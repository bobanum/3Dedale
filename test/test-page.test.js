const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("test html page provides maze size form and result output", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "test.html"), "utf8");

  assert.match(html, /<form id="mazeForm">/);
  assert.match(html, /id="width"/);
  assert.match(html, /id="height"/);
  assert.match(html, /id="depth"/);
  assert.match(html, /Generate maze/);
  assert.match(html, /Maze generated\./);
  assert.match(html, /JSON\.stringify/);
  assert.match(html, /Solved path length/);
});
