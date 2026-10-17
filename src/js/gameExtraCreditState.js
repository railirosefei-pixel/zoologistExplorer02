import { ref } from "vue";

const GAME_COMPLETIONS_STORAGE_KEY = "zoologistExplorer02.safariMathGamesCompleted";
const EXTRA_CREDIT_STATE_STORAGE_KEY = "zoologistExplorer02.safariMathExtraCreditState";
const GAME_IDS = new Set([
	"safari-place-value",
	"safari-multiplication",
	"safari-multiplication-double-digit",
]);
const MAX_EXTRA_CREDIT_SEGMENTS = 2;

function getStorage() {
	const storage = globalThis.localStorage;
	if (!storage) {
		throw new Error("Browser storage is unavailable for Safari Math Extra Credit.");
	}
	return storage;
}

function readGameCompletions() {
	const storedCompletions = getStorage().getItem(GAME_COMPLETIONS_STORAGE_KEY);
	if (storedCompletions === null) {
		return {};
	}

	const completions = JSON.parse(storedCompletions);
	if (
		!completions ||
		typeof completions !== "object" ||
		Array.isArray(completions) ||
		Object.values(completions).some((completed) => typeof completed !== "boolean")
	) {
		throw new Error("Saved Safari Math game completions must be an object of booleans.");
	}
	return completions;
}

function readExtraCreditState() {
	const storedState = getStorage().getItem(EXTRA_CREDIT_STATE_STORAGE_KEY);
	if (storedState === null) {
		return { segments: 0, pendingResets: {} };
	}

	const state = JSON.parse(storedState);
	if (
		!state ||
		typeof state !== "object" ||
		Array.isArray(state) ||
		!Number.isInteger(state.segments) ||
		state.segments < 0 ||
		state.segments > MAX_EXTRA_CREDIT_SEGMENTS ||
		!state.pendingResets ||
		typeof state.pendingResets !== "object" ||
		Array.isArray(state.pendingResets) ||
		Object.entries(state.pendingResets).some(
			([gameId, pending]) => !GAME_IDS.has(gameId) || typeof pending !== "boolean",
		)
	) {
		throw new Error("Saved Safari Math Extra Credit state is invalid.");
	}
	return state;
}

function loadInitialExtraCreditState() {
	if (typeof globalThis.localStorage === "undefined") {
		return { segments: 0, error: null };
	}
	try {
		return { segments: readExtraCreditState().segments, error: null };
	} catch (error) {
		console.error("Unable to load Safari Math Extra Credit state.", error);
		return { segments: 0, error };
	}
}

const initialExtraCreditState = loadInitialExtraCreditState();
export const extraCreditSegments = ref(initialExtraCreditState.segments);
export const extraCreditStorageError = ref(initialExtraCreditState.error);

function validateGameId(gameId) {
	if (!GAME_IDS.has(gameId)) {
		throw new Error(`Unsupported Safari Math game ID: ${gameId}`);
	}
}

function saveExtraCreditState(state) {
	getStorage().setItem(EXTRA_CREDIT_STATE_STORAGE_KEY, JSON.stringify(state));
	extraCreditSegments.value = state.segments;
	extraCreditStorageError.value = null;
}

/** Reset one game's first-completion flag and arm its next completion for Extra Credit. */
export function resetGameExtraCredit(gameId) {
	try {
		validateGameId(gameId);
		const completions = readGameCompletions();
		const state = readExtraCreditState();
		delete completions[gameId];
		state.pendingResets[gameId] = true;
		saveExtraCreditState(state);
		getStorage().setItem(GAME_COMPLETIONS_STORAGE_KEY, JSON.stringify(completions));
	} catch (error) {
		extraCreditStorageError.value = error;
		throw error;
	}
}

/** Record a first completion and award one reserved XP segment when reset was requested. */
export function recordSafariMathGameCompletion(gameId) {
	try {
		validateGameId(gameId);
		const completions = readGameCompletions();
		if (completions[gameId] === true) {
			extraCreditStorageError.value = null;
			return { isFirstCompletion: false, extraCreditAwarded: false };
		}

		const state = readExtraCreditState();
		const extraCreditAwarded = state.pendingResets[gameId] === true;
		if (extraCreditAwarded) {
			state.segments = Math.min(state.segments + 1, MAX_EXTRA_CREDIT_SEGMENTS);
			delete state.pendingResets[gameId];
			saveExtraCreditState(state);
		}

		completions[gameId] = true;
		getStorage().setItem(GAME_COMPLETIONS_STORAGE_KEY, JSON.stringify(completions));
		extraCreditStorageError.value = null;
		return { isFirstCompletion: true, extraCreditAwarded };
	} catch (error) {
		extraCreditStorageError.value = error;
		throw error;
	}
}
