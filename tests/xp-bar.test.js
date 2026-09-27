import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
	return readFileSync(join(repoRoot, relativePath), "utf8");
}

test("ProgressXpBar.vue exists with 14 segments of 20 XP and no inline styles", () => {
	const source = readSource("src/components/ProgressXpBar.vue");
	assert.match(source, /SEGMENT_COUNT = 14/, "bar must have 14 segments");
	assert.match(source, /XP_PER_SEGMENT = 20/, "each segment must require 20 XP");
	assert.match(source, /width: 672px/, "bar must be exactly 672px long");
	assert.match(source, /Level/, "bar must display the word Level");
	assert.doesNotMatch(
		source,
		/style="/,
		"template must not use inline style attributes",
	);
	assert.match(
		source,
		/<style scoped>/,
		"XP bar styling must live in a scoped style block",
	);
});

test("blockCompletionState.js derives capped totalXp and a permanent level", () => {
	const source = readSource("src/js/blockCompletionState.js");
	assert.match(source, /totalXp/, "store must expose totalXp");
	assert.match(source, /XP_LEVEL_CAP = 240/, "XP must be capped at 240");
	assert.match(
		source,
		/Math\.max\(state\.level/,
		"level must never decrease",
	);
});

test("StudentNavigation.vue renders ProgressXpBar in the Student Progress menu", () => {
	const source = readSource("src/components/StudentNavigation.vue");
	assert.match(source, /import ProgressXpBar/, "must import ProgressXpBar");
	assert.match(
		source,
		/<ProgressXpBar :xp="totalXp" :level="level" \/>/,
		"must render the XP bar with xp and level",
	);
	assert.match(
		source,
		/activeStudentMenu === 'progress'[\s\S]*?student-progress-xp-bar-slot|student-progress-xp-bar-slot[\s\S]*?activeStudentMenu === 'progress'/,
		"XP bar must sit inside the Student Progress submenu panel",
	);
});

test("StudentNavigation.vue centers the XP bar slot in the Progress menu", () => {
	const source = readSource("src/components/StudentNavigation.vue");
	assert.match(
		source,
		/\.student-progress-xp-bar-slot/,
		"slot class must exist in StudentNavigation.vue",
	);
});
