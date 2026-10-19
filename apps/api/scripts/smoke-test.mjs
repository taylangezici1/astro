// One-shot smoke test for the auth + /match flow.
//
// 1. POST /auth/signup (idempotent: 409 means user already exists, fall through
//    to login).
// 2. POST /auth/login → bearer token.
// 3. POST /match with the bearer header.
//
// Usage: node apps/api/scripts/smoke-test.mjs   (or `yarn workspace @synastry/api smoke`)

const PORT = process.env.SMOKE_PORT || "3000";
const BASE = `http://localhost:${PORT}`;

const credentials = {
  email: "smoke@synastry.test",
  password: "smoke-password",
};

const signupBody = {
  ...credentials,
  birthLocalDate: "1994-10-12",
  birthLocalTime: "17:15",
  latitude: 38.4192,
  longitude: 27.1287,
  districtId: "izmir-konak",
};

const matchBody = {
  limit: 100,
  rules: [{ self: "venus", aspect: "trine", other: "mars" }],
  orb: 5,
};

async function postJson(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function ensureLoggedIn() {
  const signup = await postJson("/auth/signup", signupBody);
  if (signup.status >= 200 && signup.status < 300) {
    console.log(`signup: HTTP ${signup.status} ${signup.body.user.email}`);
    return signup.body.token;
  }
  if (signup.status === 409) {
    console.log("signup: HTTP 409 (already exists), falling back to login");
    const login = await postJson("/auth/login", credentials);
    if (login.status !== 200 && login.status !== 201) {
      console.error("login failed:", login.status, login.body);
      process.exit(1);
    }
    console.log(`login: HTTP ${login.status} ${login.body.user.email}`);
    return login.body.token;
  }
  console.error("signup failed:", signup.status, signup.body);
  process.exit(1);
}

const token = await ensureLoggedIn();

const match = await postJson("/match", matchBody, token);
console.log(`match: HTTP ${match.status}`);
console.log(JSON.stringify(match.body, null, 2));
