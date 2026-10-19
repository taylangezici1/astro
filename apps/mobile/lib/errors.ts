/**
 * Turn any thrown error into a sentence a user can act on, in their language.
 * Screens with their own wording for specific statuses (e.g. 401 on login,
 * 409 on signup) check those first and fall back to this.
 */

import type { ApiErrorCode } from "@synastry/api-types";

import { ApiError, NetworkError } from "@/lib/api";
import type { Translations } from "@/lib/i18n/strings";

export function describeError(err: unknown, t: Translations): string {
  if (err instanceof NetworkError) return t.errors.network;
  if (err instanceof ApiError) {
    if (err.code === ("BIRTH_TIME_IN_DST_GAP" satisfies ApiErrorCode)) {
      return t.errors.invalidBirth;
    }
    if (err.status === 401) return t.errors.sessionExpired;
    if (err.status === 429) return t.errors.rateLimited;
    if (err.status >= 500) return t.errors.server;
  }
  return t.errors.generic;
}
