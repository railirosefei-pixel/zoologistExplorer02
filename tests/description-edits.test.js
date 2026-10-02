import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blockDescriptionStore } from "../src/js/blockDescriptionState.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
	return readFileSync(join(repoRoot, relativePath), "utf8");
}

test("StudentEditsView.vue contains all Blocks menu and Description Edits ids", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	const requiredIds = [
		"blocks-menu-button",
		"blocks-menu-sidebar",
		"description-edits-button",
		"description-edits-position-wrapper",
		"description-edits-panel-container",
		"description-edits-text-box",
		"description-edits-controls-row",
		"description-edits-commit-button",
		"description-edits-date-dropdown-button",
		"description-edits-subject-dropdown-button",
		"description-edits-block-dropdown-button",
		"description-edits-history-dropdown-button",
		"description-edits-month-dropdown-button",
		"description-edits-day-dropdown-button",
		"description-edits-year-dropdown-button",
		"blocks-screen-home-button",
		"blocks-screen-back-button",
	];
	for (const id of requiredIds) {
		assert.ok(source.includes(`id="${id}"`), `missing id "${id}" in StudentEditsView.vue`);
	}
	assert.match(
		source,
		/blocks-screen-home-button[\s\S]*@click="handleStudentEditsScreenHome"/,
		"Blocks Home button must use the home handler",
	);
	assert.match(
		source,
		/blocks-screen-back-button[\s\S]*@click="handleStudentEditsScreenClose"/,
		"Blocks Back button must use the parent handler",
	);
});

test("Description Edits commit pipeline is wired in StudentEditsView.vue", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	assert.match(
		source,
		/import \{ blockDescriptionStore \} from "\.\.\/js\/blockDescriptionState\.js";/,
		"must import blockDescriptionStore",
	);
	assert.match(
		source,
		/blockDescriptionStore\.commitDescription\(/,
		"commit handler must call commitDescription",
	);
	assert.match(
		source,
		/blockDescriptionStore\.getHistory\(\)/,
		"History list must render getHistory() entries",
	);
});

test("Description Edits Remove targets only the selected date, subject, and blocks", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	assert.match(
		source,
		/description-edits-remove-button[\s\S]*@click="handleDescriptionEditsRemove"/,
		"Remove button must invoke the selected-description removal handler",
	);
	assert.match(
		source,
		/blockDescriptionStore\.removeDescriptions\(/,
		"removal handler must call removeDescriptions",
	);

	const dateKey = "2099-12-31";
	blockDescriptionStore.commitDescription({
		dateKey,
		subjectKey: "math",
		blocks: [1, 2, 3],
		text: "selected date math",
	});
	blockDescriptionStore.commitDescription({
		dateKey,
		subjectKey: "science",
		blocks: [2],
		text: "same date, other subject",
	});
	blockDescriptionStore.commitDescription({
		dateKey: "2099-12-30",
		subjectKey: "math",
		blocks: [2],
		text: "other date, same subject",
	});

	assert.equal(
		blockDescriptionStore.removeDescriptions({ dateKey, subjectKey: "math", blocks: [2] }),
		true,
	);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), "selected date math");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 2), null);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 3), "selected date math");
	assert.equal(
		blockDescriptionStore.getDescription(dateKey, "science", 2),
		"same date, other subject",
	);
	assert.equal(
		blockDescriptionStore.getDescription("2099-12-30", "math", 2),
		"other date, same subject",
	);
	assert.equal(
		blockDescriptionStore.removeDescriptions({ dateKey, subjectKey: "math", blocks: [1, 3] }),
		true,
	);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), null);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 3), null);
});

test("input.css keeps Blocks menu and Description Edits layout invariants", () => {
	const source = readSource("src/css/input.css");
	assert.match(
		source,
		/\.blocks-menu-sidebar\s*\{[^}]*width:\s*336px;/s,
		"Blocks sidebar must be 336px wide",
	);
	assert.match(
		source,
		/\.blocks-menu-sidebar\s*\{[^}]*background:\s*#091018;/s,
		"Blocks sidebar must use a solid background",
	);
	assert.match(
		source,
		/\.description-edits-text-box\s*\{[^}]*width:\s*772px;[^}]*height:\s*772px;/s,
		"text box must be 772px by 772px",
	);
	assert.match(
		source,
		/\.description-edits-panel-container\s*\{[^}]*padding:\s*16px;/s,
		"text box container must keep 16px padding",
	);
	assert.match(
		source,
		/\.description-edits-controls-row\s*\{[^}]*margin-top:\s*16px;[^}]*row-gap:\s*16px;/s,
		"Description Edits rows must keep 16px vertical gaps",
	);
	assert.match(
		source,
		/\.description-edits-button\s*\{[^}]*linear-gradient\(180deg,\s*#fff7b8\s*0%,\s*#f8e99a\s*100%\)/s,
		"Description Edits button must use the pastel yellow gradient",
	);
	assert.match(
		source,
		/\.description-edits-button--active\s*\{/s,
		"Description Edits depressed glow state must exist",
	);
	assert.match(
		source,
		/\.daily-menu-block-saved-description\s*\{[^}]*font-size:\s*1rem;[^}]*white-space:\s*pre-wrap;/s,
		"saved description rule must keep 1rem pre-wrap formatting",
	);
	assert.match(
		source,
		/\.block-edits-week-panel-container\s*\{[^}]*left:\s*336px;/s,
		"Block Edits panel must stay offset 336px",
	);
});

test("blockDescriptionState.js exists with both localStorage keys", () => {
	const modulePath = join(repoRoot, "src", "js", "blockDescriptionState.js");
	assert.ok(existsSync(modulePath), "src/js/blockDescriptionState.js must exist");
	const source = readSource("src/js/blockDescriptionState.js");
	assert.match(
		source,
		/zoologistExplorer02\.blockDescriptions/,
		"must persist descriptions under the blockDescriptions key",
	);
	assert.match(
		source,
		/zoologistExplorer02\.descriptionHistory/,
		"must persist history under the descriptionHistory key",
	);
});
