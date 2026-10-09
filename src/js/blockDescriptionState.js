import { reactive } from "vue";

/**
 * Shared block-description state for the Parent > Student Edits > Blocks >
 * Description Edits text box and the Student daily-menu block panels.
 * Committed descriptions are keyed as `YYYY-MM-DD::subject::blockNumber` so
 * each saved description stays specific to one date, subject, and block.
 * History entries are stored most-recent-first with the subject abbreviation
 * and save date (`mm/dd/yy`) shown in the History dropdown.
 */

const BLOCK_DESCRIPTIONS_STORAGE_KEY = "zoologistExplorer02.blockDescriptions";
const BLOCK_PLAY_BY_PLAY_STORAGE_KEY = "zoologistExplorer02.blockPlayByPlay";
const DESCRIPTION_HISTORY_STORAGE_KEY = "zoologistExplorer02.descriptionHistory";

/** Load the persisted description map, tolerating unavailable storage. */
function loadDescriptionsByKey() {
	try {
		const stored = globalThis.localStorage?.getItem(BLOCK_DESCRIPTIONS_STORAGE_KEY);
		const parsed = stored ? JSON.parse(stored) : {};
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return {};
		}
		return Object.fromEntries(
			Object.entries(parsed).filter(([, text]) => typeof text === "string"),
		);
	} catch {
		return {};
	}
}

/** Load the persisted Play by Play map, tolerating unavailable storage. */
function loadPlayByPlayByKey() {
	try {
		const stored = globalThis.localStorage?.getItem(BLOCK_PLAY_BY_PLAY_STORAGE_KEY);
		const parsed = stored ? JSON.parse(stored) : {};
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return {};
		}
		return Object.fromEntries(
			Object.entries(parsed).filter(([, text]) => typeof text === "string"),
		);
	} catch {
		return {};
	}
}

/** Load the persisted history list, tolerating unavailable storage. */
function loadHistoryEntries() {
	try {
		const stored = globalThis.localStorage?.getItem(DESCRIPTION_HISTORY_STORAGE_KEY);
		const parsed = stored ? JSON.parse(stored) : [];
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.filter(
			(entry) =>
				entry &&
				typeof entry === "object" &&
				typeof entry.dateKey === "string" &&
				typeof entry.subjectKey === "string" &&
				Array.isArray(entry.blocks) &&
				typeof entry.text === "string",
		);
	} catch {
		return [];
	}
}

function saveDescriptionsByKey() {
	try {
		globalThis.localStorage?.setItem(
			BLOCK_DESCRIPTIONS_STORAGE_KEY,
			JSON.stringify(state.descriptionsByKey),
		);
	} catch {
		// Storage can be unavailable in restricted browser contexts.
	}
}

function saveHistoryEntries() {
	try {
		globalThis.localStorage?.setItem(
			DESCRIPTION_HISTORY_STORAGE_KEY,
			JSON.stringify(state.historyEntries),
		);
	} catch {
		// Storage can be unavailable in restricted browser contexts.
	}
}

const state = reactive({
	/** @type {Record<string, string>} */
	descriptionsByKey: loadDescriptionsByKey(),
	/** @type {Record<string, string>} */
	playByPlayByKey: loadPlayByPlayByKey(),
	/** @type {Array<{ dateKey: string, subjectKey: string, subjectAbbrev: string, blocks: number[], text: string, savedAtIso: string, savedAtLabel: string }>} */
	historyEntries: loadHistoryEntries(),
});

/** Normalize a date (or "Month D, YYYY" label) into an ISO day key. */
function toDateKey(dateLabelOrDate) {
	const parsed = dateLabelOrDate instanceof Date ? dateLabelOrDate : new Date(dateLabelOrDate);
	if (!dateLabelOrDate || Number.isNaN(parsed.getTime())) {
		return null;
	}
	const year = parsed.getFullYear();
	const month = String(parsed.getMonth() + 1).padStart(2, "0");
	const day = String(parsed.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/** Build the storage key for one date + subject + block description. */
function buildDescriptionKey(dateKey, subjectKey, blockNumber) {
	if (!dateKey || !subjectKey || !blockNumber) {
		return null;
	}
	return `${dateKey}::${subjectKey}::${blockNumber}`;
}

/** Short subject label used on History dropdown entries. */
function toSubjectAbbrev(subjectKey) {
	return (
		{
			math: "Math",
			"language-arts": "LA",
			"social-studies": "SS",
			science: "Science",
			art: "Art",
		}[subjectKey] ?? subjectKey
	);
}

/** Format an ISO date-time as `mm/dd/yy` for History dropdown entries. */
function toSavedAtLabel(date) {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${month}/${day}/${year}`;
}

/**
 * Save the description text immediately and permanently: one copy per chosen
 * block (readable by the Student daily-menu block panel for that date and
 * subject) plus one History entry. The text is stored exactly as typed so all
 * spaces, tabs, and line breaks survive.
 */
function commitDescription({ dateKey, subjectKey, blocks, text }) {
	if (!dateKey || !subjectKey || !Array.isArray(blocks) || blocks.length === 0) {
		return false;
	}
	if (typeof text !== "string" || text.length === 0) {
		return false;
	}

	for (const blockNumber of blocks) {
		const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
		if (key) {
			state.descriptionsByKey[key] = text;
		}
	}

	const savedAt = new Date();
	state.historyEntries.unshift({
		dateKey,
		subjectKey,
		subjectAbbrev: toSubjectAbbrev(subjectKey),
		blocks: [...blocks],
		text,
		contentType: "description",
		savedAtIso: savedAt.toISOString(),
		savedAtLabel: toSavedAtLabel(savedAt),
	});

	saveDescriptionsByKey();
	saveHistoryEntries();
	return true;
}

function overwriteDescription({ dateKey, subjectKey, blockNumber, text }) {
	const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
	if (
		!key ||
		typeof text !== "string" ||
		!Object.hasOwn(state.descriptionsByKey, key) ||
		state.descriptionsByKey[key] === text
	) {
		return false;
	}
	if (text.length > 0) {
		return commitDescription({ dateKey, subjectKey, blocks: [blockNumber], text });
	}
	state.descriptionsByKey[key] = text;
	saveDescriptionsByKey();
	return true;
}

/** Save Play by Play text under the same date + subject + block key scheme. */
function commitPlayByPlay({ dateKey, subjectKey, blocks, text }) {
	if (!dateKey || !subjectKey || !Array.isArray(blocks) || blocks.length === 0) {
		return false;
	}
	if (typeof text !== "string" || text.length === 0) {
		return false;
	}

	for (const blockNumber of blocks) {
		const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
		if (key) {
			state.playByPlayByKey[key] = text;
		}
	}

	const savedAt = new Date();
	state.historyEntries.unshift({
		dateKey,
		subjectKey,
		subjectAbbrev: toSubjectAbbrev(subjectKey),
		blocks: [...blocks],
		text,
		contentType: "play-by-play",
		savedAtIso: savedAt.toISOString(),
		savedAtLabel: toSavedAtLabel(savedAt),
	});

	try {
		globalThis.localStorage?.setItem(
			BLOCK_PLAY_BY_PLAY_STORAGE_KEY,
			JSON.stringify(state.playByPlayByKey),
		);
	} catch {
		// Storage can be unavailable in restricted browser contexts.
	}
	saveHistoryEntries();
	return true;
}

function overwritePlayByPlay({ dateKey, subjectKey, blockNumber, text }) {
	const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
	if (
		!key ||
		typeof text !== "string" ||
		!Object.hasOwn(state.playByPlayByKey, key) ||
		state.playByPlayByKey[key] === text
	) {
		return false;
	}
	if (text.length > 0) {
		return commitPlayByPlay({ dateKey, subjectKey, blocks: [blockNumber], text });
	}
	state.playByPlayByKey[key] = text;
	try {
		globalThis.localStorage?.setItem(
			BLOCK_PLAY_BY_PLAY_STORAGE_KEY,
			JSON.stringify(state.playByPlayByKey),
		);
	} catch {
		return true;
	}
	return true;
}

/** Read the saved description for one date + subject + block, or null. */
function getDescription(dateLabelOrKey, subjectKey, blockNumber) {
	const dateKey =
		typeof dateLabelOrKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateLabelOrKey)
			? dateLabelOrKey
			: toDateKey(dateLabelOrKey);
	const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
	if (!key) {
		return null;
	}
	return state.descriptionsByKey[key] ?? null;
}

/** Read the saved Play by Play text for one date + subject + block, or null. */
function getPlayByPlay(dateLabelOrKey, subjectKey, blockNumber) {
	const dateKey =
		typeof dateLabelOrKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateLabelOrKey)
			? dateLabelOrKey
			: toDateKey(dateLabelOrKey);
	const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
	if (!key) {
		return null;
	}
	return state.playByPlayByKey[key] ?? null;
}

/** Remove saved descriptions for only the supplied date, subject, and blocks. */
function removeDescriptions({ dateKey, subjectKey, blocks }) {
	if (!dateKey || !subjectKey || !Array.isArray(blocks) || blocks.length === 0) {
		return false;
	}

	let removed = false;
	for (const blockNumber of blocks) {
		const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
		if (key && Object.hasOwn(state.descriptionsByKey, key)) {
			delete state.descriptionsByKey[key];
			removed = true;
		}
	}

	if (removed) {
		saveDescriptionsByKey();
	}
	return removed;
}

/** Remove Play by Play text for only the supplied date, subject, and blocks. */
function removePlayByPlay({ dateKey, subjectKey, blocks }) {
	if (!dateKey || !subjectKey || !Array.isArray(blocks) || blocks.length === 0) {
		return false;
	}

	let removed = false;
	for (const blockNumber of blocks) {
		const key = buildDescriptionKey(dateKey, subjectKey, blockNumber);
		if (key && Object.hasOwn(state.playByPlayByKey, key)) {
			delete state.playByPlayByKey[key];
			removed = true;
		}
	}

	if (removed) {
		try {
			globalThis.localStorage?.setItem(
				BLOCK_PLAY_BY_PLAY_STORAGE_KEY,
				JSON.stringify(state.playByPlayByKey),
			);
		} catch {
			// Storage can be unavailable in restricted browser contexts.
		}
	}
	return removed;
}

/** Return the full history list, most recent first. */
function getHistory(contentType = "description") {
	return state.historyEntries.filter(
		(entry) => (entry.contentType ?? "description") === contentType,
	);
}

export const blockDescriptionStore = {
	state,
	commitDescription,
	overwriteDescription,
	commitPlayByPlay,
	overwritePlayByPlay,
	getDescription,
	getPlayByPlay,
	removeDescriptions,
	removePlayByPlay,
	getHistory,
};
