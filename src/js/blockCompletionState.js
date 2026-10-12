import { reactive, computed, watch } from "vue";
import { shiftInitialSchoolWeekDateKey } from "./initialSchoolWeekDateShift.js";

/**
 * Shared block-completion state for the Student daily menu and the
 * Parent > Student Edits > Block Edits panel. Keyed as
 * `YYYY-MM-DD::subject::blockNumber` so completion stays day-specific.
 */

/** XP constants for the Progress screen XP bar. */
const XP_PER_COMPLETED_BLOCK = 20;
const XP_LEVEL_CAP = 240;
const XP_PER_LEVEL = 240;
const COMPLETED_BLOCKS_STORAGE_KEY = "zoologistExplorer02.completedBlocks";

function loadCompletedBlockKeys() {
	try {
		const stored = globalThis.localStorage?.getItem(COMPLETED_BLOCKS_STORAGE_KEY);
		const parsed = stored ? JSON.parse(stored) : {};
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return {};
		}
		return Object.fromEntries(
			Object.entries(parsed).filter(([, completed]) => typeof completed === "boolean"),
		);
	} catch {
		return {};
	}
}

function saveCompletedBlockKeys() {
	try {
		globalThis.localStorage?.setItem(
			COMPLETED_BLOCKS_STORAGE_KEY,
			JSON.stringify(state.completedBlockKeys),
		);
	} catch {
		// Storage can be unavailable in restricted browser contexts.
	}
}

const state = reactive({
	/** @type {Record<string, boolean>} */
	completedBlockKeys: loadCompletedBlockKeys(),
	/** Permanent level — only ever increases. */
	level: 0,
	bonusXp: 0,
	xpHistory: [],
});

/** Move old-week completion records forward without overwriting destination data. */
function migrateInitialSchoolWeekCompletions() {
	let changed = false;
	for (const [key, completed] of Object.entries(state.completedBlockKeys)) {
		const separatorIndex = key.indexOf("::");
		if (separatorIndex === -1) {
			continue;
		}

		const dateKey = key.slice(0, separatorIndex);
		const shiftedDateKey = shiftInitialSchoolWeekDateKey(dateKey);
		if (shiftedDateKey === dateKey) {
			continue;
		}

		const shiftedKey = `${shiftedDateKey}${key.slice(separatorIndex)}`;
		if (Object.hasOwn(state.completedBlockKeys, shiftedKey)) {
			continue;
		}

		state.completedBlockKeys[shiftedKey] = completed;
		delete state.completedBlockKeys[key];
		changed = true;
	}

	if (changed) {
		saveCompletedBlockKeys();
	}
}

migrateInitialSchoolWeekCompletions();

/**
 * Progress steps are 1-based. Step 1 has 0 XP; the first 20 XP is earned when
 * the player advances from step 1 to step 2.
 */
function getXpForProgressStep(stepNumber) {
	if (!Number.isFinite(stepNumber) || stepNumber <= 1) {
		return 0;
	}
	return (stepNumber - 1) * XP_PER_COMPLETED_BLOCK;
}

/**
 * XP derived from completed blocks: +20 per completed block after step 1, -20 per
 * un-activation, and hard-capped at 240 so it can never pass the cap.
 */
const totalXp = computed(() =>
	Math.min(
		XP_LEVEL_CAP,
		getXpForProgressStep(
			Object.values(state.completedBlockKeys).filter(Boolean).length + 1,
		) + state.bonusXp,
	),
);

/** Level rises at each 240 XP milestone and never decreases. */
watch(totalXp, (xp) => {
	state.level = Math.max(state.level, Math.floor(xp / XP_PER_LEVEL));
});

/** Normalize a date (or "Month D, YYYY" label) into an ISO day key. */
function toDateKey(dateLabel) {
	const parsed = dateLabel instanceof Date ? dateLabel : new Date(dateLabel);
	if (!dateLabel || Number.isNaN(parsed.getTime())) {
		return null;
	}
	const year = parsed.getFullYear();
	const month = String(parsed.getMonth() + 1).padStart(2, "0");
	const day = String(parsed.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/** Readable label for the real current day, matching calendar date labels. */
function toDateLabel(date) {
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Today's ISO key and readable label — the only day Block Edits exposes. */
function getTodayInfo() {
	const now = new Date();
	return { key: toDateKey(now), label: toDateLabel(now) };
}

function buildBlockKey(dateLabel, subject, blockNumber) {
	const dateKey = toDateKey(dateLabel);
	if (!dateKey || !subject || !blockNumber) {
		return null;
	}
	return `${dateKey}::${subject}::${blockNumber}`;
}

function isBlockCompleteForDate(dateLabel, subject, blockNumber) {
	const key = buildBlockKey(dateLabel, subject, blockNumber);
	return key ? Boolean(state.completedBlockKeys[key]) : false;
}

function recordXpSnapshot() {
	const today = getTodayInfo();
	state.xpHistory.push({
		dateKey: today.key,
		bonusXp: state.bonusXp,
		level: state.level,
	});
}

function getSchoolDayDateKey(n) {
	if (!Number.isInteger(n) || n < 1) {
		return null;
	}

	const reference = new Date();
	let schoolDaysBack = 0;
	const targetDate = new Date(reference);

	while (schoolDaysBack < n) {
		targetDate.setDate(targetDate.getDate() - 1);
		const weekday = targetDate.getDay();
		if (weekday !== 0 && weekday !== 6) {
			schoolDaysBack += 1;
		}
	}

	return toDateKey(targetDate);
}

function resetXpSchoolDaysBack(n) {
	const targetKey = getSchoolDayDateKey(n);
	if (!targetKey) {
		return false;
	}

	for (const key of Object.keys(state.completedBlockKeys)) {
		state.completedBlockKeys[key] = false;
	}
	state.bonusXp = 0;
	saveCompletedBlockKeys();
	recordXpSnapshot();
	return true;
}

function resetLevelSchoolDaysBack(n) {
	const targetKey = getSchoolDayDateKey(n);
	if (!targetKey) {
		return false;
	}
	const snapshots = [...state.xpHistory].reverse();
	const snapshot = snapshots.find((entry) => entry.dateKey === targetKey) ??
		snapshots.find((entry) => entry.dateKey < targetKey) ?? {
			dateKey: targetKey,
			bonusXp: 0,
			level: 0,
		};
	state.level = snapshot.level;
	return true;
}

function markBlockComplete(dateLabel, subject, blockNumber) {
	const key = buildBlockKey(dateLabel, subject, blockNumber);
	if (key) {
		state.completedBlockKeys[key] = true;
		saveCompletedBlockKeys();
		recordXpSnapshot();
	}
}

function markBlockIncomplete(dateLabel, subject, blockNumber) {
	const key = buildBlockKey(dateLabel, subject, blockNumber);
	if (key) {
		state.completedBlockKeys[key] = false;
		saveCompletedBlockKeys();
		recordXpSnapshot();
	}
}

/** Add XP earned outside of block completion (Explorer Positions test moves). */
function addBonusXp(amount) {
	if (!Number.isFinite(amount) || amount <= 0) {
		return;
	}
	state.bonusXp += amount;
	recordXpSnapshot();
}

export const blockCompletionStore = {
	state,
	totalXp,
	getXpForProgressStep,
	getSchoolDayDateKey,
	resetXpSchoolDaysBack,
	resetLevelSchoolDaysBack,
	isBlockCompleteForDate,
	markBlockComplete,
	markBlockIncomplete,
	addBonusXp,
	getTodayInfo,
};
