/**
 * Format a `HouseRule` (the structured rule the API now returns) as a
 * complete sentence in the active language. The phrasing template lives in
 * the translation tables (`t.houseRule`).
 */

import type { HouseRule } from "@/lib/api";
import type { Translations } from "@/lib/i18n/strings";

export function formatHouseRule(rule: HouseRule, t: Translations): string {
  // Pronouns are language-specific. EN: "your" / "their"; TR: "sizin" /
  // "onların". Embedded directly into the houseRule template.
  const PRONOUNS: Record<string, { self: string; other: string }> = {
    "en-US": { self: "your", other: "their" },
    "tr-TR": { self: "sizin", other: "onların" },
  };
  const pronouns = PRONOUNS[t.localeTag] ?? PRONOUNS["en-US"];

  return t.houseRule({
    planet: t.planets[rule.planet],
    house: rule.house,
    planetOwner: rule.planetOf === "self" ? pronouns.self : pronouns.other,
    houseOwner: rule.houseOf === "self" ? pronouns.self : pronouns.other,
  });
}
