import { test } from "node:test";
import assert from "node:assert/strict";
import {
	extraCreditSegments,
	extraCreditStorageError,
	recordSafariMathGameCompletion,
	resetGameExtraCredit,
} from "../src/js/gameExtraCreditState.js";

const GAME_COMPLETIONS_STORAGE_KEY = "zoologistExplorer02.safariMathGamesCompleted";
const EXTRA_CREDIT_STATE_STORAGE_KEY = "zoologistExplorer02.safariMathExtraCreditState";

test("only explicit game resets award the two persistent Extra Credit segments", () => {
	const previousStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
	const storageValues = new Map();
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem(key) {
				return storageValues.get(key) ?? null;
			},
			setItem(key, value) {
				storageValues.set(key, value);
			},
		},
	});
	extraCreditSegments.value = 0;
	extraCreditStorageError.value = null;

	try {
		assert.deepEqual(recordSafariMathGameCompletion("safari-place-value"), {
			isFirstCompletion: true,
			extraCreditAwarded: false,
		});
		assert.equal(extraCreditSegments.value, 0);

		resetGameExtraCredit("safari-place-value");
		assert.equal(
			JSON.parse(storageValues.get(GAME_COMPLETIONS_STORAGE_KEY))["safari-place-value"],
			undefined,
		);
		assert.equal(
			JSON.parse(storageValues.get(EXTRA_CREDIT_STATE_STORAGE_KEY)).pendingResets[
				"safari-place-value"
			],
			true,
		);
		assert.deepEqual(recordSafariMathGameCompletion("safari-place-value"), {
			isFirstCompletion: true,
			extraCreditAwarded: true,
		});
		assert.equal(extraCreditSegments.value, 1);
		assert.deepEqual(recordSafariMathGameCompletion("safari-place-value"), {
			isFirstCompletion: false,
			extraCreditAwarded: false,
		});
		assert.equal(extraCreditSegments.value, 1);

		resetGameExtraCredit("safari-multiplication");
		assert.equal(recordSafariMathGameCompletion("safari-multiplication").extraCreditAwarded, true);
		assert.equal(extraCreditSegments.value, 2);

		resetGameExtraCredit("safari-multiplication-double-digit");
		assert.equal(
			recordSafariMathGameCompletion("safari-multiplication-double-digit").extraCreditAwarded,
			true,
		);
		assert.equal(extraCreditSegments.value, 2);
		assert.equal(extraCreditStorageError.value, null);
	} finally {
		if (previousStorageDescriptor) {
			Object.defineProperty(globalThis, "localStorage", previousStorageDescriptor);
		} else {
			delete globalThis.localStorage;
		}
	}
});
