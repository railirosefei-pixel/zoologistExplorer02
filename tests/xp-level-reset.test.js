import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blockCompletionStore } from "../src/js/blockCompletionState.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
	return readFileSync(join(repoRoot, relativePath), "utf8");
}

test("XP history snapshots and school-day rollback logic handle weekend skipping and no-op cases", () => {
	const {
		state,
		getSchoolDayDateKey,
		getTodayInfo,
		resetXpSchoolDaysBack,
		resetLevelSchoolDaysBack,
	} = blockCompletionStore;
	state.completedBlockKeys = {};
	state.bonusXp = 0;
	state.level = 0;
	state.xpHistory = [];

	blockCompletionStore.addBonusXp(60);
	blockCompletionStore.addBonusXp(20);
	assert.equal(state.bonusXp, 80, "bonus XP should accumulate");
	assert.ok(Array.isArray(state.xpHistory), "history must be tracked");
	assert.equal(
		state.xpHistory.length >= 2,
		true,
		"each XP mutation should append a pre-change snapshot",
	);

	const targetKey = getSchoolDayDateKey(1);
	const targetSnapshot = { dateKey: targetKey, bonusXp: 60, level: 1 };
	state.xpHistory.push(targetSnapshot);
	state.level = 5;
	assert.equal(
		resetXpSchoolDaysBack(1),
		true,
		"reset should restore a matching snapshot when one exists",
	);
	assert.equal(state.bonusXp, 60, "bonus XP should revert to the prior school-day snapshot");

	state.level = 5;
	assert.equal(
		resetLevelSchoolDaysBack(1),
		true,
		"level rollback should restore a known school-day snapshot",
	);
	assert.equal(state.level, 1, "level should be able to decrease when resetting");

	state.bonusXp = 80;
	state.xpHistory = state.xpHistory.filter((entry) => entry.dateKey === getTodayInfo().key);
	assert.equal(
		resetXpSchoolDaysBack(999),
		true,
		"missing historical dates should fall back to the baseline",
	);
	assert.equal(state.bonusXp, 0, "bonus XP should revert to zero when no earlier history exists");

	state.level = 5;
	assert.equal(
		resetLevelSchoolDaysBack(999),
		true,
		"missing level history should fall back to the baseline",
	);
	assert.equal(state.level, 0, "level should revert to zero when no earlier history exists");
});

test("completed blocks persist across store reloads", async () => {
	const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
	const storedValues = new Map();
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem(key) {
				return storedValues.get(key) ?? null;
			},
			setItem(key, value) {
				storedValues.set(key, value);
			},
		},
	});

	try {
		const { blockCompletionStore: beforeReload } =
			await import("../src/js/blockCompletionState.js?completion-persistence-write");
		beforeReload.markBlockComplete("September 28, 2026", "Math", 1);

		const { blockCompletionStore: afterReload } =
			await import("../src/js/blockCompletionState.js?completion-persistence-read");
		assert.equal(
			afterReload.isBlockCompleteForDate("September 28, 2026", "Math", 1),
			true,
			"a completed date-specific block should be restored after reload",
		);
	} finally {
		if (originalStorage) {
			Object.defineProperty(globalThis, "localStorage", originalStorage);
		} else {
			delete globalThis.localStorage;
		}
	}
});

test("StudentNavigation exposes the Reset stack and custom input handlers for XP and level rollback", () => {
	const source = readSource("src/components/StudentNavigation.vue");
	assert.match(source, /student-progress-reset-button/);
	assert.match(source, /student-progress-reset-xp-button/);
	assert.match(source, /student-progress-reset-level-button/);
	assert.match(source, /student-progress-reset-xp-custom-input/);
	assert.match(source, /student-progress-reset-level-custom-input/);
	assert.match(source, /student-progress-reset-stack/);
	assert.match(source, /v-if="explorerPositionsModeActive"/);
	assert.match(source, /handleResetToggle/);
	assert.match(source, /handleXpResetToday|handleXpResetTwoDays|handleXpResetSubmit/);
	assert.match(source, /handleLevelResetToday|handleLevelResetTwoDays|handleLevelResetSubmit/);
	assert.doesNotMatch(source, /style=""/);
});
