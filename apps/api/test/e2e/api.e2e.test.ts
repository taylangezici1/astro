/**
 * End-to-end: boots the real API (same `node -r @swc-node/register
 * src/main.ts` path as production) against a disposable Postgres schema,
 * seeds a small fixture, and exercises auth + matching over HTTP.
 *
 * Needs E2E_DATABASE_URL pointing at a schema or database it may wipe, e.g.
 *   postgresql://user:pass@localhost:5432/synastry?schema=e2e
 * The URL must name a schema "e2e" or a database ending in "_test"; anything
 * else is refused so this can never truncate real data.
 *
 *   yarn workspace @synastry/api test:e2e
 */

import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthResponse, District, MatchResult, User } from "@synastry/api-types";

const E2E_URL = process.env.E2E_DATABASE_URL;
const API_DIR = path.resolve(__dirname, "../..");
const DB_DIR = path.resolve(API_DIR, "../../packages/database");
const PRISMA_BIN = path.resolve(API_DIR, "../../node_modules/prisma/build/index.js");

let api: ChildProcess | undefined;
let base = "";
let apiLog = "";

function assertDisposable(url: string): void {
  const parsed = new URL(url);
  const schema = parsed.searchParams.get("schema");
  const database = parsed.pathname.replace(/^\//, "");
  if (schema !== "e2e" && !database.endsWith("_test")) {
    throw new Error(
      `Refusing to run e2e tests against ${parsed.host}/${database} (schema=${schema}). ` +
        `Use ?schema=e2e or a database whose name ends in _test.`,
    );
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function seedFixture(databaseUrl: string): Promise<void> {
  process.env.DATABASE_URL = databaseUrl;
  // Imported after DATABASE_URL is set: the client reads it on construction.
  const { prisma } = await import("@synastry/database");
  const { calcChart } = await import("@synastry/ephemeris");

  await prisma.$executeRawUnsafe(`TRUNCATE "User", "GlobalSky", "District" RESTART IDENTITY CASCADE`);

  const districts: District[] = JSON.parse(
    fs.readFileSync(path.join(DB_DIR, "seed-data/turkey-districts.json"), "utf8"),
  );
  await prisma.district.createMany({ data: districts });

  // Two months of sky inside the test user's default ±10-year window (born
  // 1994): the Moon laps the zodiac twice, so every Moon-based rule has
  // candidates while the slow planets mostly don't — a realistic mix of
  // rules met and missed. Plus one month of 2024, which is outside the
  // window and under 18, so it must never appear in results.
  const windows: [Date, Date][] = [
    [new Date(Date.UTC(1995, 0, 1)), new Date(Date.UTC(1995, 2, 1))],
    [new Date(Date.UTC(2024, 0, 1)), new Date(Date.UTC(2024, 1, 1))],
  ];
  const rows = [];
  for (const [from, to] of windows) {
    for (let t = from.getTime(); t < to.getTime(); t += 15 * 60_000) {
      const timestamp = new Date(t);
      rows.push({ timestamp, ...calcChart(timestamp) });
    }
  }
  await prisma.globalSky.createMany({ data: rows });
  await prisma.$disconnect();
}

async function startApi(databaseUrl: string): Promise<void> {
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  api = spawn(process.execPath, ["-r", "@swc-node/register", "src/main.ts"], {
    cwd: API_DIR,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PORT: String(port),
      JWT_SECRET: "e2e-only-secret",
      NODE_ENV: "test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  api.stdout?.on("data", (chunk) => (apiLog += chunk));
  api.stderr?.on("data", (chunk) => (apiLog += chunk));

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (api.exitCode !== null) throw new Error(`API exited during startup:\n${apiLog}`);
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`API did not become healthy in time:\n${apiLog}`);
}

async function call<T = unknown>(
  method: string,
  route: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${base}${route}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : null) as T };
}

const ALICE = {
  email: "alice@e2e.test",
  password: "correct horse battery",
  birthLocalDate: "1994-10-12",
  birthLocalTime: "17:15",
  latitude: 38.4192,
  longitude: 27.1287,
  districtId: "izmir-konak",
};

describe.skipIf(!E2E_URL)("API end-to-end", () => {
  let token = "";

  beforeAll(async () => {
    const url = E2E_URL!;
    assertDisposable(url);
    execFileSync(process.execPath, [PRISMA_BIN, "migrate", "deploy"], {
      cwd: DB_DIR,
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });
    await seedFixture(url);
    await startApi(url);
  }, 180_000);

  afterAll(() => {
    api?.kill();
  });

  it("reports healthy", async () => {
    const res = await call("GET", "/health");
    expect(res).toEqual({ status: 200, body: { status: "ok", db: "up" } });
  });

  describe("signup + login", () => {
    it("creates an account and returns a token", async () => {
      const res = await call<AuthResponse>("POST", "/auth/signup", ALICE);
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(ALICE.email);
      expect(res.body.user.birthTimezone).toBe("Europe/Istanbul");
      expect(res.body.user.district?.id).toBe("izmir-konak");
      expect(res.body.user).not.toHaveProperty("passwordHash");
      token = res.body.token;
    });

    it("rejects a second signup with the same email (any case)", async () => {
      const res = await call("POST", "/auth/signup", { ...ALICE, email: "ALICE@e2e.test" });
      expect(res.status).toBe(409);
    });

    it("rejects a birth time skipped by daylight saving, with a code", async () => {
      // Türkiye jumped 03:00 → 04:00 on 2015-03-29.
      const res = await call<{ code: string }>("POST", "/auth/signup", {
        ...ALICE,
        email: "gap@e2e.test",
        birthLocalDate: "2015-03-29",
        birthLocalTime: "03:30",
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("BIRTH_TIME_IN_DST_GAP");
    });

    it("rejects a birth date in the future", async () => {
      const res = await call("POST", "/auth/signup", {
        ...ALICE,
        email: "future@e2e.test",
        birthLocalDate: "2999-01-01",
      });
      expect(res.status).toBe(400);
    });

    it("logs in with the right password only", async () => {
      expect((await call("POST", "/auth/login", { email: ALICE.email, password: "wrong password" })).status).toBe(401);
      expect((await call("POST", "/auth/login", { email: "nobody@e2e.test", password: "whatever1" })).status).toBe(401);
      const ok = await call<AuthResponse>("POST", "/auth/login", {
        email: ALICE.email,
        password: ALICE.password,
      });
      expect(ok.status).toBe(200);
      expect(ok.body.token).toBeTruthy();
    });

    it("requires a token for /auth/me and /match", async () => {
      expect((await call("GET", "/auth/me")).status).toBe(401);
      expect((await call("POST", "/match", {})).status).toBe(401);
      expect((await call<User>("GET", "/auth/me", undefined, token)).body.email).toBe(ALICE.email);
    });
  });

  describe("matching", () => {
    let first: MatchResult;

    it("returns ranked, distinct matches with local birth times", async () => {
      const res = await call<MatchResult>("POST", "/match", {}, token);
      expect(res.status).toBe(200);
      first = res.body;

      // Phase 2: one candidate per day, best aspect fit first. The order is
      // computed in SQL and the fits in TypeScript, so a sorted list also
      // shows the two formulas agree.
      const days = first.matches.map((m) => m.timestamp.slice(0, 10));
      expect(new Set(days).size).toBe(days.length);
      const fits = first.matches.map((m) => m.aspectFit);
      expect(fits).toEqual([...fits].sort((a, b) => b - a));
      expect(fits[0]).toBeGreaterThan(0);

      // Phase 3: distinct people, best first, all fields populated.
      const { best, top } = first.refinement;
      expect(best).not.toBeNull();
      expect(best).toEqual(top[0]);
      expect(new Set(top.map((h) => h.timestamp)).size).toBe(top.length);
      const scores = top.map((h) => h.compatibility);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
      for (const hit of top) {
        expect(hit.timezone).toBe("Europe/Istanbul");
        expect(hit.localISO).toMatch(/^1995-0[12]-\d{2}T\d{2}:\d{2}:00$/);
        expect(hit.aspects).toHaveLength(first.bands.length);
      }
    });

    it("only suggests adults born within the age gap", async () => {
      expect(first.searchWindow.from.slice(0, 10)).toBe("1984-10-12");
      expect(first.searchWindow.to.slice(0, 10)).toBe("2004-10-12");
      for (const m of first.matches) expect(m.timestamp.startsWith("1995-")).toBe(true);

      // Even with the widest gap, the 2024 sky (under-18s) never shows up.
      const wide = await call<MatchResult>("POST", "/match", { maxAgeGap: 40 }, token);
      expect(wide.status).toBe(200);
      for (const m of wide.body.matches) expect(m.timestamp.startsWith("1995-")).toBe(true);
    });

    it("serves an identical repeat request from the cache", async () => {
      const t0 = Date.now();
      const res = await call<MatchResult>("POST", "/match", {}, token);
      expect(res.body).toEqual(first);
      expect(Date.now() - t0).toBeLessThan(200);
    });

    it("re-ranks when the tunables change", async () => {
      const res = await call<MatchResult>(
        "POST",
        "/match",
        { orb: 6, rules: [{ self: "sun", aspect: "trine", other: "moon" }] },
        token,
      );
      expect(res.status).toBe(200);
      expect(res.body.orb).toBe(6);
      expect(res.body.bands).toHaveLength(1);
      expect(res.body.refinement.best?.aspects[0].inOrb).toBe(true);
    });

    it("validates the request body", async () => {
      expect((await call("POST", "/match", { orb: 50 }, token)).status).toBe(400);
      expect((await call("POST", "/match", { limit: 1000 }, token)).status).toBe(400);
      expect((await call("POST", "/match", { maxAgeGap: 0 }, token)).status).toBe(400);
      expect((await call("POST", "/match", { surprise: true }, token)).status).toBe(400);
      expect(
        (await call("POST", "/match", { rules: [{ self: "pluto", aspect: "trine", other: "sun" }] }, token))
          .status,
      ).toBe(400);
    });
  });

  describe("account", () => {
    it("updates birth details and recomputes the chart", async () => {
      const before = (await call<User>("GET", "/auth/me", undefined, token)).body;
      const res = await call<User>(
        "PATCH",
        "/auth/me",
        { birthLocalDate: "1990-03-21", birthLocalTime: "06:00", latitude: 39.92, longitude: 32.85, districtId: "ankara-cankaya" },
        token,
      );
      expect(res.status).toBe(200);
      expect(res.body.birthLocalDate).toBe("1990-03-21");
      expect(res.body.district?.id).toBe("ankara-cankaya");
      expect(res.body.natal.sun).not.toBeCloseTo(before.natal.sun, 0);

      const match = await call<MatchResult>("POST", "/match", {}, token);
      expect(match.body.birth.localISO).toBe("1990-03-21T06:00:00");
    });

    it("deletes the account only with the right password", async () => {
      const wrong = await call<{ code?: string }>("DELETE", "/auth/me", { password: "nope" }, token);
      expect(wrong.status).toBe(401);
      expect(wrong.body.code).toBe("INVALID_PASSWORD");
      expect((await call("DELETE", "/auth/me", { password: ALICE.password }, token)).status).toBe(204);
      expect((await call("GET", "/auth/me", undefined, token)).status).toBe(401);
      expect((await call("POST", "/auth/login", { email: ALICE.email, password: ALICE.password })).status).toBe(401);
    });
  });

  it("rate-limits repeated login attempts", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      statuses.push((await call("POST", "/auth/login", { email: "brute@e2e.test", password: "guess-" + i })).status);
    }
    expect(statuses).toContain(429);
  });
});
