/**
 * The full set of translatable strings.
 *
 * Both `tr.ts` and `en.ts` must conform to this `Translations` interface, so
 * dropping a key in one file is a TypeScript error in the other. Use the
 * `t()` helper from `lib/i18n` to read these.
 */

export interface Translations {
  common: {
    cancel: string;
    done: string;
    remove: string;
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
      districtTrigger: string;
      districtSearch: string;
    };
    button: string;
    errors: {
      pickDistrict: string;
      addRule: string;
      dateFormat: string;
      timeFormat: string;
      latRange: string;
      lngRange: string;
      apiPrefix: string;
      apiUnknown: string;
    };
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
    orb: {
      title: string;
      hintLine1: string;
      hintLine2: string;
    };
    rules: {
      title: string;
      hint: { their: string; your: string; tail: string };
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
      labelPhase3: string;
      placePrefix: string;
      metaPhase3: (matched: number, total: number, pairs: string, ms: number) => string;
      labelPhase2: string;
      metaPhase2: (matched: number, total: number, orb: number) => string;
    };
    empty: {
      title: string;
      hint: string;
    };
    why: {
      title: string;
      subtitle: string;
    };
    places: {
      title: (count: number) => string;
      subtitle: string;
      score: (n: number) => string;
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
    moments: {
      title: (count: number) => string;
      subtitle: string;
      score: (n: number) => string;
    };
  };
  detail: {
    backLabel: string;
    heroLabel: string;
    matchChart: {
      title: string;
      subtitle: string;
    };
    yourChart: {
      title: string;
      subtitle: string;
    };
    rulesMatched: {
      title: string;
      subtitle: string;
    };
    location: {
      title: string;
      district: string;
      coordinates: string;
    };
    score: {
      title: string;
      value: (n: number) => string;
    };
    phase2Note: string;
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
      errorGeneric: string;
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
      errorPickDistrict: string;
      errorGeneric: string;
    };
    logout: string;
    loggedInAs: string;
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
  /**
   * Format a `RefinementHit.satisfiedRules` entry as a sentence.
   *
   * `planet` and `houseOwner` are pre-resolved nouns ready for the language.
   * The function returns a complete sentence in the active language.
   */
  houseRule: (params: {
    planet: string;
    house: number;
    /** "you" / "them" already in the active language. */
    planetOwner: string;
    houseOwner: string;
  }) => string;
  /** Locale tag passed to `Date.toLocaleDateString` etc. */
  localeTag: string;
}
