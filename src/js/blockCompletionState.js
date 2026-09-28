import { reactive, computed, watch } from "vue";

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

/**
 * XP derived from completed blocks: +20 per completed block, -20 per
 * un-activation, and hard-capped at 240 so it can never pass the cap.
 */
const totalXp = computed(() =>
	Math.min(
		XP_LEVEL_CAP,
		Object.values(state.completedBlockKeys).filter(Boolean).length * XP_PER_COMPLETED_BLOCK +
			state.bonusXp,
	),
);

/** Level rises at each 240 XP milestone and never decreases. */
watch(totalXp, (xp) => {
	state.level = Math.max(state.level, Math.floor(xp / XP_PER_LEVEL));
});

/** Normalize a date (or "September 28, 2026" label) into an ISO day key. */
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
	const snapshots = [...state.xpHistory].reverse();
	const snapshot = snapshots.find((entry) => entry.dateKey === targetKey) ??
		snapshots.find((entry) => entry.dateKey < targetKey) ?? {
			dateKey: targetKey,
			bonusXp: 0,
			level: 0,
		};
	state.bonusXp = snapshot.bonusXp;
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
	getSchoolDayDateKey,
	resetXpSchoolDaysBack,
	resetLevelSchoolDaysBack,
	isBlockCompleteForDate,
	markBlockComplete,
	markBlockIncomplete,
	addBonusXp,
	getTodayInfo,
};
