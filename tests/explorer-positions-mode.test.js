import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
	return readFileSync(join(repoRoot, relativePath), "utf8");
}

test("Explorer Positions mode removal and Raili resize behavior are wired as required", () => {
	assert.throws(
		() => readFileSync(join(repoRoot, "src/components/ExplorerPositionsView.vue"), "utf8"),
		/ENOENT|not found/i,
		"ExplorerPositionsView.vue must be removed",
	);

	const appSource = readSource("src/App.vue");
	assert.doesNotMatch(appSource, /ExplorerPositionsView/);
	assert.doesNotMatch(appSource, /handleExplorerPositionsOpen|handleExplorerPositionsClose/);
	assert.match(appSource, /isExplorerPositionsModeActive/);
	assert.match(appSource, /:explorer-positions-mode-active="isExplorerPositionsModeActive"/);
	assert.doesNotMatch(
		appSource,
		/handleParentChainHome\s*\(\)\s*\{[\s\S]*?isExplorerPositionsModeActive\.value = false/,
		"Home navigation must not clear the Explorer Positions toggle state",
	);

	const curriculumSource = readSource("src/components/CurriculumGameView.vue");
	assert.match(curriculumSource, /toggle-explorer-positions-mode/);
	assert.match(curriculumSource, /explorer-positions-button--engaged/);

	const studentSource = readSource("src/components/StudentNavigation.vue");
	assert.match(studentSource, /student-progress-resize-dock/);
	assert.match(studentSource, /student-progress-resize-button/);
	assert.match(studentSource, /student-progress-raili-resize-handle-nw/);
	assert.match(studentSource, /student-progress-raili-resize-handle-ne/);
	assert.match(studentSource, /student-progress-raili-resize-handle-sw/);
	assert.match(studentSource, /student-progress-raili-resize-handle-se/);
	assert.match(studentSource, /setProperty\("--student-raili-height"/);
	assert.match(studentSource, /ze2\.studentProgress\.railiHeightPx/);

	const cssSource = readSource("src/css/input.css");
	assert.match(cssSource, /\.explorer-positions-button--engaged/);
	assert.match(cssSource, /width:\s*116px/);
	assert.match(cssSource, /height:\s*40px/);
	assert.match(cssSource, /var\(--student-raili-height\)/);
	assert.doesNotMatch(cssSource, /\.explorer-positions-screen/);
});

test("Move mode button and Raili drag wiring are present", () => {
	const studentSource = readSource("src/components/StudentNavigation.vue");
	assert.match(studentSource, /student-progress-move-button/);
	assert.match(studentSource, /student-progress-move-button--engaged/);
	assert.match(studentSource, /isMoveModeActive/);
	assert.match(studentSource, /handleMoveToggle/);
	assert.match(studentSource, /handleRailiMoveStart/);
	assert.match(studentSource, /handleRailiMoveMove/);
	assert.match(studentSource, /handleRailiMoveEnd/);
	assert.match(studentSource, /student-progress-raili-frame--move-active/);
	assert.match(studentSource, /railiFrameRef/);
	assert.match(studentSource, /--student-raili-offset-x/);
	assert.match(studentSource, /--student-raili-offset-y/);
	assert.match(studentSource, /ze2\.studentProgress\.railiOffsetXPx/);
	assert.match(studentSource, /ze2\.studentProgress\.railiOffsetYPx/);

	const cssSource = readSource("src/css/input.css");
	assert.match(cssSource, /\.student-progress-move-button/);
	assert.match(cssSource, /\.student-progress-move-button--engaged/);
	assert.match(cssSource, /\.student-progress-raili-frame--move-active/);
	assert.match(cssSource, /var\(--student-raili-offset-x/);
	assert.match(cssSource, /#38bdf8/);
	assert.doesNotMatch(
		studentSource,
		/class="student-progress-resize-button"[^>]*>\s*Move/,
	);
});
