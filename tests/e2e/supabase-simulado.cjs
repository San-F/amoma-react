// Supabase simulado para pruebas de interfaz (no es la seguridad real)
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt =
  b64({ alg: "HS256", typ: "JWT" }) +
  "." +
  b64({
    sub: "u1",
    role: "authenticated",
    aal: "aal2",
    exp,
    email: "duena@amoma.test",
  }) +
  ".firma";
exports.session = {
  access_token: jwt,
  refresh_token: "r",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: exp,
  user: {
    id: "u1",
    email: "duena@amoma.test",
    aud: "authenticated",
    role: "authenticated",
  },
};
exports.png = require("fs").readFileSync(
  require("path").join(__dirname, "../../public/logo.png"),
);
exports.json = (r, body, status = 200, headers = {}) =>
  r.fulfill({
    status,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "content-range",
      ...headers,
    },
    body: JSON.stringify(body),
  });
exports.preflight = (r) =>
  r.fulfill({
    status: 200,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    },
  });
