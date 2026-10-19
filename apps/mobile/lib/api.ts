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
 * Auth: most calls take an optional `token` argument. The auth provider in
 * `lib/auth` owns the lifecycle of the token; this file just stamps it into
 * the Authorization header when it's present.
 */

import type {
  AuthResponse,
  District,
  DistrictsResponse,
  LoginRequest,
  MatchRequest,
  MatchResult,
  SignupRequest,
  User,
} from "@synastry/api-types";

// Re-export so existing imports from "@/lib/api" keep working unchanged.
export type {
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
  User,
} from "@synastry/api-types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3010";

// ---------- client ----------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------- public endpoints ----------

export async function getDistricts(): Promise<District[]> {
  const res = await fetch(`${BASE_URL}/districts`);
  const parsed = await parseResponse(res);
  if (!res.ok) {
    throw new ApiError(`GET /districts failed (${res.status})`, res.status, parsed);
  }
  return ((parsed as DistrictsResponse | null)?.districts ?? []).slice();
}

// ---------- auth ----------

export async function postSignup(body: SignupRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = await parseResponse(res);
  if (!res.ok) {
    throw new ApiError(`POST /auth/signup failed (${res.status})`, res.status, parsed);
  }
  return parsed as AuthResponse;
}

export async function postLogin(body: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = await parseResponse(res);
  if (!res.ok) {
    throw new ApiError(`POST /auth/login failed (${res.status})`, res.status, parsed);
  }
  return parsed as AuthResponse;
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { ...authHeaders(token) },
  });
  const parsed = await parseResponse(res);
  if (!res.ok) {
    throw new ApiError(`GET /auth/me failed (${res.status})`, res.status, parsed);
  }
  return parsed as User;
}

// ---------- /match ----------

export async function postMatch(
  request: MatchRequest,
  token: string,
): Promise<MatchResult> {
  const res = await fetch(`${BASE_URL}/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(request),
  });
  const parsed = await parseResponse(res);
  if (!res.ok) {
    throw new ApiError(`POST /match failed (${res.status})`, res.status, parsed);
  }
  return parsed as MatchResult;
}
