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
		/<button\b[^>]*\bid="student-progress-back-button"[^>]*\bclass="student-progress-back-button navigation-back-button"[^>]*>\s*Back\s*<\/button>/,
		"Student progress menu should render a Back button",
	);

	assert.match(
		cssSource,
		/\.student-progress-back-button\s*\{[^}]*position:\s*fixed;[^}]*top:\s*16px;[^}]*right:\s*16px;/,
		"Progress Back button should be fixed at top-right with the expected spacing",
	);
});
