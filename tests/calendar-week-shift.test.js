import assert from "node:assert/strict";
import { test } from "node:test";

test("the initial school-week shift migrates saved completion and description records", async () => {
	const values = new Map([
		[
			"zoologistExplorer02.completedBlocks",
			JSON.stringify({
				"2026-10-05::math::1": true,
				"2026-10-09::science::3": false,
				"2026-10-10::art::1": true,
			}),
		],
		[
			"zoologistExplorer02.blockDescriptions",
			JSON.stringify({
				"2026-10-05::math::1": "Monday description",
				"2026-10-09::science::3": "Friday description",
				"2026-10-10::art::1": "Unchanged description",
			}),
		],
		[
			"zoologistExplorer02.blockPlayByPlay",
			JSON.stringify({
				"2026-10-06::language-arts::2": "Play-by-play",
			}),
		],
		[
			"zoologistExplorer02.descriptionHistory",
			JSON.stringify([
				{
					dateKey: "2026-10-05",
					subjectKey: "math",
					blocks: [1],
					text: "Monday history",
				},
				{
					dateKey: "2026-10-10",
					subjectKey: "art",
					blocks: [1],
					text: "Unchanged history",
				},
			]),
		],
	]);
	globalThis.localStorage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
	};

	const { blockCompletionStore } = await import(
		"../src/js/blockCompletionState.js?initial-school-week-shift-test"
	);
	const { blockDescriptionStore } = await import(
		"../src/js/blockDescriptionState.js?initial-school-week-shift-test"
	);

	assert.equal(
		blockCompletionStore.isBlockCompleteForDate("October 12, 2026", "math", 1),
		true,
	);
	assert.equal(
		blockCompletionStore.isBlockCompleteForDate("October 16, 2026", "science", 3),
		false,
	);
	assert.equal(
		blockCompletionStore.isBlockCompleteForDate("October 10, 2026", "art", 1),
		true,
	);
	assert.deepEqual(
		blockCompletionStore.state.completedBlockKeys,
		{
			"2026-10-12::math::1": true,
			"2026-10-16::science::3": false,
			"2026-10-10::art::1": true,
		},
	);

	assert.equal(
		blockDescriptionStore.getDescription("2026-10-12", "math", 1),
		"Monday description",
	);
	assert.equal(
		blockDescriptionStore.getDescription("2026-10-16", "science", 3),
		"Friday description",
	);
	assert.equal(
		blockDescriptionStore.getPlayByPlay("2026-10-13", "language-arts", 2),
		"Play-by-play",
	);
	assert.deepEqual(
		blockDescriptionStore.state.historyEntries.map(({ dateKey }) => dateKey),
		["2026-10-12", "2026-10-10"],
	);
});
