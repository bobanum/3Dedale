import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("test html page provides maze size form and result output", () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "test.html"), "utf8");

    assert.match(html, /<link rel="stylesheet" href="\.\/css\/test-page\.css">/);
    assert.match(html, /<script type="module" src="\.\/src\/app\.js"><\/script>/);
    assert.match(html, /id="mazeCanvas"/);
    assert.match(html, /<form id="mazeForm">/);
    assert.match(html, /id="width"/);
    assert.match(html, /id="height"/);
    assert.match(html, /id="depth"/);
    assert.match(html, /Generate maze/);
    assert.match(html, /Maze generated\./);
});
