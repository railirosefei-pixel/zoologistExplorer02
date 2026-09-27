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

const state = reactive({
	/** @type {Record<string, boolean>} */
	completedBlockKeys: {},
	/** Permanent level — only ever increases. */
	level: 0,
});

/**
 * XP derived from completed blocks: +20 per completed block, -20 per
 * un-activation, and hard-capped at 240 so it can never pass the cap.
 */
const totalXp = computed(
	() =>
		Math.min(
			XP_LEVEL_CAP,
			Object.values(state.completedBlockKeys).filter(Boolean).length *
				XP_PER_COMPLETED_BLOCK,
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

function markBlockComplete(dateLabel, subject, blockNumber) {
	const key = buildBlockKey(dateLabel, subject, blockNumber);
	if (key) {
		state.completedBlockKeys[key] = true;
	}
}

function markBlockIncomplete(dateLabel, subject, blockNumber) {
	const key = buildBlockKey(dateLabel, subject, blockNumber);
	if (key) {
		state.completedBlockKeys[key] = false;
	}
}

export const blockCompletionStore = {
	state,
	totalXp,
	isBlockCompleteForDate,
	markBlockComplete,
	markBlockIncomplete,
	getTodayInfo,
};
