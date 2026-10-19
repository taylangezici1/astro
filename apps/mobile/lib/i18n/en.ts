import type { Translations } from "./strings";

export const en: Translations = {
  common: {
    cancel: "Cancel",
    done: "Done",
    remove: "Remove",
  },
  nav: {
    match: "Match",
    about: "About",
  },
  home: {
    eyebrow: "PROJECT",
    title: "Synastry",
    tagline: "Find the birth instant of your theoretical perfect match.",
  },
  form: {
    title: "Tell us about you",
    hint: "Enter your birth date and time as you'd say them out loud — we figure out the timezone from your birth place.",
    fields: {
      birthDateWeb: "Birth date (YYYY-MM-DD)",
      birthDateNative: "Birth date",
      birthTimeWeb: "Birth time (HH:MM, local)",
      birthTimeNative: "Birth time (local)",
      district: "Birth district",
    },
    placeholders: {
      birthDate: "1994-10-12",
      birthTime: "17:15",
      districtTrigger: "Select a district…",
      districtSearch: "Search by district or province…",
    },
    button: "✨  Find my match",
    errors: {
      pickDistrict: "Pick a birth district.",
      addRule: "Add at least one cosmic alignment.",
      dateFormat: "Birth date must be YYYY-MM-DD.",
      timeFormat: "Birth time must be HH:MM.",
      latRange: "Latitude must be between -90 and 90.",
      lngRange: "Longitude must be between -180 and 180.",
      apiPrefix: "API error",
      apiUnknown: "Unknown error contacting the API.",
    },
  },
  districts: {
    title: "Birth district",
    empty: "No matches.",
    loadFailed: "Failed to load districts.",
  },
  advanced: {
    header: "FINE-TUNE THE MATCHING",
    summary: (orb, count) =>
      `±${orb}° · ${count} alignment${count === 1 ? "" : "s"}`,
    intro:
      "Cosmic alignments are pairs of planets sitting at meaningful angles. Pick which alignments matter and how strict the match should be.",
    orb: {
      title: "How strict?",
      hintLine1: "Allowed wiggle room around each target degree.",
      hintLine2:
        "Wider = more matches but looser fit. Tighter = fewer but truer.",
    },
    rules: {
      title: "Cosmic alignments",
      hint: {
        their: "their planet",
        your: "your planet",
        tail: " sits at this aspect to it. All alignments must be true at once.",
      },
      ruleTitle: (n) => `Rule ${n}`,
      add: "＋ Add alignment",
    },
    chips: {
      their: "Their",
      at: "at",
      toYour: "to your",
    },
  },
  results: {
    hero: {
      labelPhase3: "✨ Your theoretical perfect match was born",
      placePrefix: "in",
      metaPhase3: (matched, total, pairs, ms) =>
        `${matched} of ${total} cosmic alignments matched  ·  checked ${pairs} possibilities in ${ms} ms`,
      labelPhase2: "Closest match (no city pinned)",
      metaPhase2: (matched, total, orb) =>
        `matched ${matched} of ${total} alignments · orb ±${orb}°`,
    },
    empty: {
      title: "No matches found",
      hint: "Try widening the orb, loosening the rule set, or seeding a wider date range.",
    },
    why: {
      title: "WHY THIS IS YOUR MATCH",
      subtitle:
        "Your match's planets land in these meaningful spots when projected onto your astrological chart.",
    },
    places: {
      title: (count) => `OTHER STRONG PLACES (${count})`,
      subtitle:
        "These districts also pair well with your chart at the same instant.",
      score: (n) => `score ${n}`,
    },
    sky: {
      title: "YOUR SKY AT BIRTH",
      subtitle: (localISO, tz) =>
        `Where each planet was the moment you were born — resolved as ${localISO} (${tz}).`,
    },
    looking: {
      title: "WHAT WE'RE LOOKING FOR",
      subtitle:
        "These are the partner-planet positions that would create cosmic alignment with your chart, based on your selected rules.",
      separator: "  or  ",
    },
    moments: {
      title: (count) => `OTHER MOMENTS (${count})`,
      subtitle: "Other birth instants that satisfy your chosen alignments.",
      score: (n) => `score ${n}`,
    },
  },
  detail: {
    backLabel: "Results",
    heroLabel: "Match detail",
    matchChart: {
      title: "MATCH'S SKY",
      subtitle: "The natal chart of someone born at this instant.",
    },
    yourChart: {
      title: "YOUR SKY",
      subtitle: "Your natal chart for comparison.",
    },
    rulesMatched: {
      title: "RULES MATCHED",
      subtitle: "The synastry rules this match satisfies in your chart.",
    },
    location: {
      title: "LOCATION",
      district: "District",
      coordinates: "Coordinates",
    },
    score: {
      title: "SCORE",
      value: (n) => `${n} / total`,
    },
    phase2Note:
      "This is a Phase 2 match — pinned to time only, not yet refined to a district.",
  },
  auth: {
    login: {
      title: "Welcome back",
      tagline: "Sign in to keep matching.",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      submit: "Sign in",
      switchToSignup: "No account? Sign up",
      errorMissingFields: "Email and password are required.",
      errorInvalid: "Invalid email or password.",
      errorGeneric: "Could not sign in. The server is unreachable.",
    },
    signup: {
      title: "Create your account",
      tagline: "Tell us about your birth once and matching becomes one tap.",
      sectionAccount: "ACCOUNT",
      sectionBirth: "BIRTH DETAILS",
      birthHint:
        "Enter your birth date and time as you'd say them out loud — we figure out the timezone from your district.",
      submit: "Create account",
      switchToLogin: "Already have an account? Sign in",
      errorMissingFields: "Please fill in every field.",
      errorPasswordTooShort: "Password must be at least 8 characters.",
      errorEmailTaken: "That email is already registered. Sign in instead.",
      errorPickDistrict: "Pick a birth district.",
      errorGeneric: "Could not create account. The server is unreachable.",
    },
    logout: "Log out",
    loggedInAs: "Signed in as",
  },
  about: {
    eyebrow: "ABOUT",
    title: "Project Synastry",
    tagline:
      "A theoretical matching engine that finds the birth instant — and place — of your astrological perfect match.",
    pipeline: {
      title: "THE PIPELINE",
      step1: {
        title: "Global Sky",
        body: "A 1.4M-row Postgres table of every planetary position in 15-minute steps over the last 40 years, computed once via Swiss Ephemeris.",
      },
      step2: {
        title: "Golden Degrees",
        body: "From your natal chart, we calculate the exact partner-planet longitudes that satisfy classic synastry aspects (trine, sextile, conjunction) within a ±5° orb.",
      },
      step3: {
        title: "Local Refinement",
        body: "For the top candidate timestamps, we walk Türkiye's 972 districts and compute Placidus house cusps to find where the partner's planets would best match your house system.",
      },
    },
    howToRead: {
      title: "HOW TO READ YOUR RESULT",
      bullets: [
        "The hero card shows the timestamp + district of your top match.",
        'The "Resolved as" line echoes the IANA timezone the server picked from your district. Verify it looks right.',
        '"Why this is your match" lists the synastry rules your match actually fulfilled.',
        "Other places and other moments show the runner-up matches.",
      ],
    },
    sources: {
      title: "SOURCES",
      sweph: "Swiss Ephemeris (sweph)",
      districts: "Türkiye districts dataset",
      tzlookup: "tz-lookup",
    },
    language: {
      title: "LANGUAGE",
      subtitle: "Switch the app language.",
      tr: "Türkçe",
      en: "English",
    },
  },
  planets: {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
  },
  aspects: {
    conjunction: "conjunction",
    sextile: "sextile",
    square: "square",
    trine: "trine",
    opposition: "opposition",
  },
  zodiac: [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ],
  // "your venus in their 7th house" / "their sun in your 1st house"
  houseRule: ({ planet, house, planetOwner, houseOwner }) => {
    const ord = ordinalSuffix(house);
    return `${planetOwner} ${planet} in ${houseOwner} ${house}${ord} house`;
  },
  localeTag: "en-US",
};

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
