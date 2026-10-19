import type { PlanetKey } from "@/lib/api";
import type { Translations } from "./strings";

const PLANETS: Record<PlanetKey, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
};

export const en: Translations = {
  common: {
    cancel: "Cancel",
    done: "Done",
    remove: "Remove",
    retry: "Try again",
    save: "Save",
  },
  nav: {
    match: "Match",
    about: "About",
  },
  home: {
    eyebrow: "PROJECT",
    title: "Synastry",
    tagline: "Find the birth moment of your theoretical perfect match.",
  },
  form: {
    title: "Find your match",
    hint: "We search 40 years of sky for the moment someone who fits you best was born.",
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
      pickDate: "Select a date",
      pickTime: "Select a time",
      districtTrigger: "Select a district…",
      districtSearch: "Search by district or province…",
    },
    button: "✨  Find my match",
    errors: {
      addRule: "Add at least one cosmic alignment.",
    },
  },
  errors: {
    network: "Can't reach the server. Check your connection and try again.",
    sessionExpired: "Your session has expired. Please sign in again.",
    rateLimited: "Too many requests. Wait a minute and try again.",
    server: "Something went wrong on our side. Please try again.",
    invalidBirth:
      "That birth time doesn't exist in your timezone — the clocks skipped it for daylight saving. Please check the time.",
    generic: "Something went wrong. Please try again.",
  },
  districts: {
    title: "Birth district",
    empty: "No matches.",
    loadFailed: "Couldn't load the district list.",
  },
  advanced: {
    header: "FINE-TUNE THE MATCHING",
    summary: (orb, count) =>
      `±${orb}° · ${count} alignment${count === 1 ? "" : "s"}`,
    intro:
      "Cosmic alignments are pairs of planets sitting at meaningful angles. Pick which alignments matter and how strict the match should be.",
    reset: "Reset to defaults",
    orb: {
      title: "How strict?",
      hintLine1: "Allowed wiggle room around each target degree.",
      hintLine2:
        "Wider = more alignments count, but looser. Tighter = only near-exact alignments count.",
    },
    rules: {
      title: "Cosmic alignments",
      hint: {
        their: "Their planet",
        tail: "sits at this angle to yours. Matches are ranked by how closely they hit every alignment.",
      },
      ruleTitle: (n) => `Alignment ${n}`,
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
      label: "✨ Your theoretical perfect match was born",
      placePrefix: "📍",
      summary: (aMet, aTotal, hMet, hTotal) =>
        `${aMet}/${aTotal} alignments · ${hMet}/${hTotal} house placements`,
      fit: (percent) => `Fit score ${percent}/100`,
      hint: "Tap for the full breakdown",
    },
    empty: {
      title: "No matches found",
      hint: "Nothing in 40 years of sky comes close to these alignments. Try a wider orb or different alignments.",
    },
    why: {
      title: "WHY THIS IS YOUR MATCH",
      subtitle: "How their planets line up with yours.",
    },
    others: {
      title: (count) => `MORE STRONG MATCHES (${count})`,
      subtitle: "Other people the sky suggests, each in their best-fitting birthplace.",
    },
    sky: {
      title: "YOUR SKY AT BIRTH",
      subtitle: (localISO, tz) =>
        `Where each planet was the moment you were born — resolved as ${localISO} (${tz}).`,
    },
    looking: {
      title: "WHAT WE'RE LOOKING FOR",
      subtitle:
        "The partner-planet positions that would form each of your chosen alignments.",
      separator: "  or  ",
    },
    footer: (days, pairs, ms) =>
      `Ranked ${days} candidate days from 40 years of sky, then checked ${pairs} birthplace combinations in ${ms} ms.`,
  },
  detail: {
    backLabel: "Results",
    heroLabel: "Match detail",
    notFound: "This match is no longer available. Run the search again.",
    fit: {
      title: "FIT SCORE",
      overall: "Overall",
      aspects: "Alignments",
      houses: "House placements",
      explain:
        "Each alignment or placement that lines up earns half its credit; the rest depends on how exact it is. Alignments count for 60% of the score, house placements for 40%.",
    },
    aspects: {
      title: "ALIGNMENTS",
      subtitle: "Your chosen alignments, and how close this match comes to each.",
    },
    houses: {
      title: "HOUSE PLACEMENTS",
      subtitle: "Classic synastry placements that land for this match.",
      none: "None of the house placements land for this match — it ranks on its alignments.",
    },
    matchChart: {
      title: "THEIR SKY",
      subtitle: "The natal chart of someone born at this moment.",
    },
    yourChart: {
      title: "YOUR SKY",
      subtitle: "Your natal chart, for comparison.",
    },
    location: {
      title: "BIRTH",
      district: "District",
      coordinates: "Coordinates",
      localTime: "Local birth time",
      timezone: "Timezone",
    },
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
    },
    signup: {
      title: "Create your account",
      tagline: "Tell us about your birth once and matching becomes one tap.",
      sectionAccount: "ACCOUNT",
      sectionBirth: "BIRTH DETAILS",
      birthHint:
        "Enter your birth date and time as you'd say them out loud — we work out the timezone from your district.",
      submit: "Create account",
      switchToLogin: "Already have an account? Sign in",
      errorMissingFields: "Please fill in every field.",
      errorPasswordTooShort: "Password must be at least 8 characters.",
      errorEmailTaken: "That email is already registered. Sign in instead.",
      errorPickBirth: "Pick your birth date and time.",
      errorPickDistrict: "Pick a birth district.",
      errorInvalid: "Please check your email address and birth details.",
    },
    logout: "Log out",
    loggedInAs: "Signed in as",
  },
  account: {
    title: "ACCOUNT",
    editBirth: "Edit birth details",
    deleteTitle: "Delete account",
    deleteWarning:
      "This permanently deletes your account and your birth details. It can't be undone.",
    deletePasswordLabel: "Enter your password to confirm",
    deleteConfirm: "Permanently delete my account",
    wrongPassword: "Incorrect password.",
  },
  profile: {
    title: "Birth details",
    subtitle: "Your matches are computed from these. Saving re-computes your chart.",
    saved: "Saved — your chart has been updated.",
  },
  about: {
    eyebrow: "ABOUT",
    title: "Project Synastry",
    tagline:
      "A theoretical matching engine that finds the birth moment — and place — of your astrological perfect match.",
    pipeline: {
      title: "THE PIPELINE",
      step1: {
        title: "Global Sky",
        body: "A 1.4M-row table of every planet's position in 15-minute steps over the last 40 years, computed once with the Swiss Ephemeris.",
      },
      step2: {
        title: "Golden Degrees",
        body: "From your natal chart we work out where a partner's planets would need to be to form classic synastry aspects with yours, then score every moment in those 40 years by how close it gets. Within ±3° counts; exact counts most.",
      },
      step3: {
        title: "Local Refinement",
        body: "For the 30 best days we walk Türkiye's 972 districts, compute the partner's Placidus houses at each, and keep the birthplace where their houses fit your chart best.",
      },
    },
    howToRead: {
      title: "HOW TO READ YOUR RESULT",
      bullets: [
        "The top card is your best match: when and where they were born, and how many alignments and house placements line up.",
        "Matches are ranked, not filtered: someone who meets every alignment loosely can outrank someone who meets one exactly.",
        "Tap any match for the full breakdown — how far each alignment is from exact, and which house placements land.",
        '"Resolved as" shows the timezone we picked from your birth district. Check that it looks right.',
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
  planets: PLANETS,
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
  // "Their Venus is in your 7th house" / "Your Sun is in their 7th house"
  houseRule: ({ planetOf, planet, houseOf, house }) => {
    const whose = planetOf === "self" ? "Your" : "Their";
    const owner = houseOf === "self" ? "your" : "their";
    const own = planetOf === houseOf ? `${owner} own` : owner;
    return `${whose} ${PLANETS[planet]} is in ${own} ${house}${ordinalSuffix(house)} house`;
  },
  // "Their Moon trines your Sun"
  aspectRule: ({ self, aspect, other }) => {
    const verbs = {
      conjunction: "is conjunct",
      sextile: "sextiles",
      square: "squares",
      trine: "trines",
      opposition: "opposes",
    };
    return `Their ${PLANETS[other]} ${verbs[aspect]} your ${PLANETS[self]}`;
  },
  aspectDistance: (degrees, inOrb) => {
    if (!inOrb) return `${degrees.toFixed(1)}° away — outside the orb`;
    return degrees < 0.05 ? "exact" : `${degrees.toFixed(1)}° from exact`;
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
