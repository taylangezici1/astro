/**
 * The full set of translatable strings.
 *
 * Both `tr.ts` and `en.ts` must conform to this `Translations` interface, so
 * dropping a key in one file is a TypeScript error in the other. Use the
 * `useT()` hook from `lib/i18n` to read these.
 *
 * Sentences built from structured data (`houseRule`, `aspectRule`) are
 * functions so each language can apply its own grammar — Turkish possessive
 * suffixes follow vowel harmony and can't be glued onto a generic noun.
 */

import type { HouseRule, SynastryRule } from "@/lib/api";

export interface Translations {
  common: {
    cancel: string;
    done: string;
    remove: string;
    retry: string;
    save: string;
  };
  nav: {
    match: string;
    about: string;
  };
  home: {
    eyebrow: string;
    title: string;
    tagline: string;
  };
  form: {
    title: string;
    hint: string;
    fields: {
      birthDateWeb: string;
      birthDateNative: string;
      birthTimeWeb: string;
      birthTimeNative: string;
      district: string;
    };
    placeholders: {
      birthDate: string;
      birthTime: string;
      pickDate: string;
      pickTime: string;
      districtTrigger: string;
      districtSearch: string;
    };
    button: string;
    errors: {
      addRule: string;
    };
  };
  /** User-facing versions of API / network failures. */
  errors: {
    network: string;
    sessionExpired: string;
    rateLimited: string;
    server: string;
    /** The birth time falls in a daylight-saving gap. */
    invalidBirth: string;
    generic: string;
  };
  districts: {
    title: string;
    empty: string;
    loadFailed: string;
  };
  advanced: {
    header: string;
    summary: (orb: number, count: number) => string;
    intro: string;
    reset: string;
    orb: {
      title: string;
      hintLine1: string;
      hintLine2: string;
    };
    age: {
      title: string;
      hint: string;
      value: (years: number) => string;
    };
    rules: {
      title: string;
      hint: { their: string; tail: string };
      ruleTitle: (n: number) => string;
      add: string;
    };
    chips: {
      their: string;
      at: string;
      toYour: string;
    };
  };
  results: {
    hero: {
      label: string;
      placePrefix: string;
      summary: (aspectsMet: number, aspectsTotal: number, housesMet: number, housesTotal: number) => string;
      fit: (percent: number) => string;
      hint: string;
    };
    empty: {
      title: string;
      hint: string;
    };
    why: {
      title: string;
      subtitle: string;
    };
    others: {
      title: (count: number) => string;
      subtitle: string;
    };
    sky: {
      title: string;
      subtitle: (localISO: string, tz: string) => string;
    };
    looking: {
      title: string;
      subtitle: string;
      separator: string;
    };
    footer: (days: number, fromYear: number, toYear: number, pairs: string, ms: number) => string;
  };
  detail: {
    backLabel: string;
    heroLabel: string;
    notFound: string;
    fit: {
      title: string;
      overall: string;
      aspects: string;
      houses: string;
      explain: string;
    };
    aspects: {
      title: string;
      subtitle: string;
    };
    houses: {
      title: string;
      subtitle: string;
      none: string;
    };
    matchChart: {
      title: string;
      subtitle: string;
    };
    yourChart: {
      title: string;
      subtitle: string;
    };
    location: {
      title: string;
      district: string;
      coordinates: string;
      localTime: string;
      timezone: string;
    };
  };
  auth: {
    login: {
      title: string;
      tagline: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      switchToSignup: string;
      errorMissingFields: string;
      errorInvalid: string;
    };
    signup: {
      title: string;
      tagline: string;
      sectionAccount: string;
      sectionBirth: string;
      birthHint: string;
      submit: string;
      switchToLogin: string;
      errorMissingFields: string;
      errorPasswordTooShort: string;
      errorEmailTaken: string;
      errorPickBirth: string;
      errorPickDistrict: string;
      errorInvalid: string;
    };
    logout: string;
    loggedInAs: string;
  };
  account: {
    title: string;
    editBirth: string;
    deleteTitle: string;
    deleteWarning: string;
    deletePasswordLabel: string;
    deleteConfirm: string;
    wrongPassword: string;
  };
  profile: {
    title: string;
    subtitle: string;
    saved: string;
  };
  about: {
    eyebrow: string;
    title: string;
    tagline: string;
    pipeline: {
      title: string;
      step1: { title: string; body: string };
      step2: { title: string; body: string };
      step3: { title: string; body: string };
    };
    howToRead: {
      title: string;
      bullets: string[];
    };
    sources: {
      title: string;
      sweph: string;
      districts: string;
      tzlookup: string;
    };
    language: {
      title: string;
      subtitle: string;
      tr: string;
      en: string;
    };
  };
  planets: {
    sun: string;
    moon: string;
    mercury: string;
    venus: string;
    mars: string;
    jupiter: string;
    saturn: string;
  };
  aspects: {
    conjunction: string;
    sextile: string;
    square: string;
    trine: string;
    opposition: string;
  };
  zodiac: [
    string, // Aries
    string, // Taurus
    string, // Gemini
    string, // Cancer
    string, // Leo
    string, // Virgo
    string, // Libra
    string, // Scorpio
    string, // Sagittarius
    string, // Capricorn
    string, // Aquarius
    string, // Pisces
  ];
  /** "Their Venus is in your 7th house." */
  houseRule: (rule: HouseRule) => string;
  /** "Their Moon trines your Sun." (`rule.other` is the partner's planet.) */
  aspectRule: (rule: SynastryRule) => string;
  /** "1.2° from exact" / "6.0° away — outside the orb". */
  aspectDistance: (degrees: number, inOrb: boolean) => string;
  /** Locale tag passed to `Date.toLocaleDateString` etc. */
  localeTag: string;
}
