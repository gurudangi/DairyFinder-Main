const test = require("node:test");
const assert = require("node:assert/strict");
const { parseReport } = require("./report.validation");

test("report validation accepts supported reasons", () => {
  assert.deepEqual(parseReport({
    reason: "not_available_today",
    notes: "The dairy confirmed it is out today."
  }), {
    reason: "not_available_today",
    notes: "The dairy confirmed it is out today."
  });
});

test("report validation rejects unsupported reasons", () => {
  assert.throws(() => parseReport({ reason: "unknown" }), /valid report reason/);
});
