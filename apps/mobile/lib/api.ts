/**
 * Thin typed client for the @synastry/api backend.
 *
 * The base URL is read from EXPO_PUBLIC_API_URL so the same binary can talk to
 * a localhost dev server (web), a LAN IP (physical device), or a deployed
 * environment. EXPO_PUBLIC_* vars are inlined at build time by Expo, so this
 * works in dev and in EAS builds without any extra plumbing.
 *
 * All wire-format types live in @synastry/api-types and are imported (and
 * re-exported below) so the rest of the mobile app can keep importing from
 * "@/lib/api" without caring about the package boundary.
 *
 * Errors: a request that reaches the server but fails throws `ApiError`
 * (with the HTTP status and the server's machine-readable `code`, if any); a
 * request that never gets a response throws `NetworkError`. `lib/errors`
 * turns either into a user-facing sentence.
 */

import type {
  AuthResponse,
  DeleteAccountRequest,
  District,
  DistrictsResponse,
  LoginRequest,
  MatchRequest,
  MatchResult,
  SignupRequest,
  UpdateBirthRequest,
  User,
} from "@synastry/api-types";

// Re-export so existing imports from "@/lib/api" keep working unchanged.
export type {
  AspectHit,
  AspectName,
  AuthResponse,
  District,
  DistrictsResponse,
  GoldenDegreeBand,
  HouseRule,
  LoginRequest,
  MatchRequest,
  MatchResult,
  Party,
  PlanetKey,
  PlanetaryChart,
  RefinementHit,
  RefinementResult,
  RefinementStats,
  ResolvedBirth,
  SignupRequest,
  SkyMatch,
  SynastryRule,
  UpdateBirthRequest,
  User,
} from "@synastry/api-types";
export { DEFAULT_ORB, DEFAULT_SYNASTRY_RULES } from "@synastry/api-types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
/** Matching can take a couple of seconds uncached; anything past this is stuck. */
const TIMEOUT_MS = 30_000;

// ---------- client ----------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
  }

  /** Machine-readable error code from the server body, e.g. "BIRTH_TIME_IN_DST_GAP". */
  get code(): string | undefined {
    const code = (this.body as { code?: unknown } | null)?.code;
    return typeof code === "string" ? code : undefined;
  }
}

/** The request never got a response: offline, DNS, timeout, server down. */
export class NetworkError extends Error {}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: { body?: unknown; token?: string | null } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new NetworkError(`${method} ${path}: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!res.ok) {
    throw new ApiError(`${method} ${path} failed (${res.status})`, res.status, parsed);
  }
  return parsed as T;
}

// ---------- public endpoints ----------

export async function getDistricts(): Promise<District[]> {
  const res = await request<DistrictsResponse | null>("GET", "/districts");
  return (res?.districts ?? []).slice();
}

// ---------- auth ----------

export function postSignup(body: SignupRequest): Promise<AuthResponse> {
  return request("POST", "/auth/signup", { body });
}

export function postLogin(body: LoginRequest): Promise<AuthResponse> {
  return request("POST", "/auth/login", { body });
}

export function getMe(token: string): Promise<User> {
  return request("GET", "/auth/me", { token });
}

export function patchMe(body: UpdateBirthRequest, token: string): Promise<User> {
  return request("PATCH", "/auth/me", { body, token });
}

export function deleteMe(body: DeleteAccountRequest, token: string): Promise<void> {
  return request("DELETE", "/auth/me", { body, token });
}

// ---------- /match ----------

export function postMatch(body: MatchRequest, token: string): Promise<MatchResult> {
  return request("POST", "/match", { body, token });
}
