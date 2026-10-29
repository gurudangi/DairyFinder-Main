const test = require("node:test");
const assert = require("node:assert/strict");
const { credentials } = require("./auth.validation");

test("auth validation accepts credentials", () => {
  assert.deepEqual(credentials({ username: "admin", password: "secret" }), {
    username: "admin",
    password: "secret"
  });
});

test("auth validation rejects missing credentials", () => {
  assert.throws(() => credentials({ username: "" }), /required/);
});
