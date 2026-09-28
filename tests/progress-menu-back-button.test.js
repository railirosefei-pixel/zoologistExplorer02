import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const componentSource = fs.readFileSync(
  path.join(projectRoot, "src", "components", "StudentNavigation.vue"),
  "utf8",
);
const cssSource = fs.readFileSync(path.join(projectRoot, "src", "css", "input.css"), "utf8");

test("progress menu includes a fixed-position back button matching the app pattern", () => {
  assert.match(
    componentSource,
    /id="student-menu-back-button"[\s\S]*?class="student-menu-back-button"[\s\S]*?Back/,
    "Student progress menu should render a Back button",
  );

  assert.match(
    cssSource,
    /\.student-menu-back-button,\s*\.rewards-page-back-button\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?top:\s*16px;[\s\S]*?right:\s*16px;/,
    "Back buttons should be fixed at top-right with the expected spacing",
  );
});
