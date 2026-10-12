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

test("Progress step XP starts at zero and first 20 XP is earned on step 2", () => {
	const { getXpForProgressStep } = blockCompletionStore;
	assert.equal(getXpForProgressStep(0), 0, "step 0 should not award XP");
	assert.equal(getXpForProgressStep(1), 0, "being on step 1 should mean 0 XP");
	assert.equal(getXpForProgressStep(2), 20, "moving from step 1 to step 2 should earn the first 20 XP");
	assert.equal(getXpForProgressStep(3), 40, "later steps should continue awarding 20 XP per step advance");
});

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
	state.completedBlockKeys = { "2026-10-09::Math::1": true };
	state.level = 5;
	assert.equal(
		resetXpSchoolDaysBack(1),
		true,
		"reset should succeed when a school-day offset is provided",
	);
	assert.equal(state.bonusXp, 0, "XP reset should clear bonus XP");
	assert.equal(
		Object.values(state.completedBlockKeys).some(Boolean),
		false,
		"XP reset should clear completed-block XP",
	);
	assert.equal(blockCompletionStore.totalXp.value, 0, "XP reset should empty the XP bar");

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
		"reset should also work when no historical date is available",
	);
	assert.equal(state.bonusXp, 0, "XP reset should keep bonus XP at zero");

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
		beforeReload.markBlockComplete("October 5, 2026", "Math", 1);

		const { blockCompletionStore: afterReload } =
			await import("../src/js/blockCompletionState.js?completion-persistence-read");
		assert.equal(
			afterReload.isBlockCompleteForDate("October 12, 2026", "Math", 1),
			true,
			"a completed block should move to the updated school-week date after reload",
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
