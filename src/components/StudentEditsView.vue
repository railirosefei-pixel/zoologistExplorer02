<script setup>
/**
 * Parent > Student Edits screen. Hosts the Curriculum Game and Block Edits
 * sidebar controls plus a weekly Monday-through-Friday Block Edits set that
 * mirrors the Student daily-menu block completion behavior for each day.
 */
import { computed, nextTick, ref, watch } from "vue";
import { blockCompletionStore } from "../js/blockCompletionState.js";
import { blockDescriptionStore } from "../js/blockDescriptionState.js";

const emit = defineEmits([
	"open-curriculum-game",
	"open-math-curriculum-october",
	"back-to-parent-menu",
	"go-home",
]);
const props = defineProps({
	initialDescriptionEditsOpen: {
		type: Boolean,
		default: false,
	},
});
const isBlockEditsOpen = ref(false);
const isBlocksMenuOpen = ref(props.initialDescriptionEditsOpen);
const isDescriptionEditsOpen = ref(props.initialDescriptionEditsOpen);
const descriptionEditsDraft = ref("");
const descriptionEditsPlayByPlayDraft = ref("");
const descriptionEditsMode = ref(null);
const descriptionEditsActiveDraft = computed({
	get() {
		return descriptionEditsMode.value === "play-by-play"
			? descriptionEditsPlayByPlayDraft.value
			: descriptionEditsDraft.value;
	},
	set(value) {
		if (descriptionEditsMode.value === "play-by-play") {
			descriptionEditsPlayByPlayDraft.value = value;
		} else {
			descriptionEditsDraft.value = value;
		}
	},
});
const descriptionEditsDateSelections = {
	description: {
		month: ref(null),
		day: ref(null),
		year: ref(null),
	},
	playByPlay: {
		month: ref(null),
		day: ref(null),
		year: ref(null),
	},
};
const activeDescriptionEditsDateSelection = computed(() =>
	descriptionEditsMode.value === "play-by-play"
		? descriptionEditsDateSelections.playByPlay
		: descriptionEditsDateSelections.description,
);
const descriptionEditsSelectedMonth = computed({
	get: () => activeDescriptionEditsDateSelection.value.month.value,
	set: (month) => {
		activeDescriptionEditsDateSelection.value.month.value = month;
	},
});
const descriptionEditsSelectedDay = computed({
	get: () => activeDescriptionEditsDateSelection.value.day.value,
	set: (day) => {
		activeDescriptionEditsDateSelection.value.day.value = day;
	},
});
const descriptionEditsSelectedYear = computed({
	get: () => activeDescriptionEditsDateSelection.value.year.value,
	set: (year) => {
		activeDescriptionEditsDateSelection.value.year.value = year;
	},
});
const descriptionEditsSelections = {
	description: {
		subject: ref(null),
		block: ref(null),
	},
	playByPlay: {
		subject: ref(null),
		block: ref(null),
	},
};
const activeDescriptionEditsSelection = computed(() =>
	descriptionEditsMode.value === "play-by-play"
		? descriptionEditsSelections.playByPlay
		: descriptionEditsSelections.description,
);
const descriptionEditsSelectedSubject = computed({
	get: () => activeDescriptionEditsSelection.value.subject.value,
	set: (subject) => {
		activeDescriptionEditsSelection.value.subject.value = subject;
	},
});
const descriptionEditsSelectedBlock = computed({
	get: () => activeDescriptionEditsSelection.value.block.value,
	set: (block) => {
		activeDescriptionEditsSelection.value.block.value = block;
	},
});
const descriptionEditsLoadedSelectionKey = ref(null);
const descriptionEditsLoadedFields = ref([]);
const descriptionEditsEditor = ref(null);
const isDescriptionEditsLoadEnabled = computed(() => Boolean(
	descriptionEditsMode.value === "description" &&
	descriptionEditsSelectedMonth.value &&
	descriptionEditsSelectedDay.value &&
	descriptionEditsSelectedYear.value &&
	descriptionEditsSelectedSubject.value &&
	descriptionEditsSelectedBlock.value !== null,
));
watch(
	[
		descriptionEditsSelectedMonth,
		descriptionEditsSelectedDay,
		descriptionEditsSelectedYear,
		descriptionEditsSelectedSubject,
		descriptionEditsSelectedBlock,
		descriptionEditsMode,
	],
	() => {
		descriptionEditsLoadedSelectionKey.value = null;
		descriptionEditsLoadedFields.value = [];
	},
	{ flush: "sync" },
);
const playByPlayEditsLoadedSelectionKey = ref(null);
const playByPlayEditsLoadedFields = ref([]);
const playByPlayEditsEditor = ref(null);
const isPlayByPlayEditsLoadEnabled = computed(() => Boolean(
	descriptionEditsMode.value === "play-by-play" &&
	descriptionEditsSelectedMonth.value &&
	descriptionEditsSelectedDay.value &&
	descriptionEditsSelectedYear.value &&
	descriptionEditsSelectedSubject.value &&
	descriptionEditsSelectedBlock.value !== null,
));
watch(
	[
		descriptionEditsSelectedMonth,
		descriptionEditsSelectedDay,
		descriptionEditsSelectedYear,
		descriptionEditsSelectedSubject,
		descriptionEditsSelectedBlock,
		descriptionEditsMode,
	],
	() => {
		playByPlayEditsLoadedSelectionKey.value = null;
		playByPlayEditsLoadedFields.value = [];
	},
	{ flush: "sync" },
);
const isDescriptionEditsSelectionSummaryVisible = computed(() =>
	Boolean(
		descriptionEditsSelectedMonth.value ||
			descriptionEditsSelectedDay.value ||
			descriptionEditsSelectedYear.value ||
			descriptionEditsSelectedSubject.value ||
			descriptionEditsSelectedBlock.value !== null,
	),
);
const descriptionEditsSelectionDateLabel = computed(() => {
	if (
		!descriptionEditsSelectedMonth.value ||
		!descriptionEditsSelectedDay.value ||
		!descriptionEditsSelectedYear.value
	) {
		return "";
	}
	const month = String(descriptionEditsSelectedMonth.value.getMonth() + 1).padStart(2, "0");
	const day = String(descriptionEditsSelectedDay.value).padStart(2, "0");
	const year = String(descriptionEditsSelectedYear.value).slice(-2);
	return `${month}/${day}/${year}`;
});
const descriptionEditsMenuOpenStates = {
	description: {
		date: ref(false),
		month: ref(false),
		day: ref(false),
		year: ref(false),
		subject: ref(false),
		block: ref(false),
		history: ref(false),
	},
	playByPlay: {
		date: ref(false),
		month: ref(false),
		day: ref(false),
		year: ref(false),
		subject: ref(false),
		block: ref(false),
		history: ref(false),
	},
};
const activeDescriptionEditsMenuOpenStates = computed(() =>
	descriptionEditsMode.value === "play-by-play"
		? descriptionEditsMenuOpenStates.playByPlay
		: descriptionEditsMenuOpenStates.description,
);
const isDescriptionEditsDateOpen = computed({
	get: () => activeDescriptionEditsMenuOpenStates.value.date.value,
	set: (isOpen) => {
		activeDescriptionEditsMenuOpenStates.value.date.value = isOpen;
	},
});
const isDescriptionEditsMonthOpen = computed({
	get: () => activeDescriptionEditsMenuOpenStates.value.month.value,
	set: (isOpen) => {
		activeDescriptionEditsMenuOpenStates.value.month.value = isOpen;
	},
});
const isDescriptionEditsDayOpen = computed({
	get: () => activeDescriptionEditsMenuOpenStates.value.day.value,
	set: (isOpen) => {
		activeDescriptionEditsMenuOpenStates.value.day.value = isOpen;
	},
});
const isDescriptionEditsYearOpen = computed({
	get: () => activeDescriptionEditsMenuOpenStates.value.year.value,
	set: (isOpen) => {
		activeDescriptionEditsMenuOpenStates.value.year.value = isOpen;
	},
});
const isDescriptionEditsSubjectOpen = computed({
	get: () => activeDescriptionEditsMenuOpenStates.value.subject.value,
	set: (isOpen) => {
		activeDescriptionEditsMenuOpenStates.value.subject.value = isOpen;
	},
});
const isDescriptionEditsBlockOpen = computed({
	get: () => activeDescriptionEditsMenuOpenStates.value.block.value,
	set: (isOpen) => {
		activeDescriptionEditsMenuOpenStates.value.block.value = isOpen;
	},
});
const isDescriptionEditsHistoryOpen = computed({
	get: () => activeDescriptionEditsMenuOpenStates.value.history.value,
	set: (isOpen) => {
		activeDescriptionEditsMenuOpenStates.value.history.value = isOpen;
	},
});

/** Block subjects shown per day, mirroring the Student daily-menu blocks. */
const blockEditsSubjects = [
	{ key: "math", label: "Math" },
	{ key: "language-arts", label: "Language Arts" },
	{ key: "social-studies", label: "Social Studies" },
	{ key: "science", label: "Science" },
	{ key: "art", label: "Art" },
];

const blockEditsBlocksPerSubject = [1, 2, 3];

/** Months on the current calendar, October 2026 through December 2027. */
const descriptionEditsMonths = Array.from(
	{ length: 15 },
	(_, index) => new Date(2026, 9 + index, 1),
);

/** Years available on the current calendar. */
const descriptionEditsYears = [2026, 2027];

/** Subject options for Description Edits, mirroring blockEditsSubjects. */
const descriptionEditsSubjects = [
	{ key: "math", label: "Math" },
	{ key: "language-arts", label: "Language Arts" },
	{ key: "social-studies", label: "Social Studies" },
	{ key: "science", label: "Science" },
	{ key: "art", label: "Art" },
];

/** Block options for Description Edits; "all" resolves to blocks 1-3 at commit time. */
const descriptionEditsBlocks = [1, 2, 3, "all"];

/** Days in the selected Description Edits month, or 31 when no month is chosen. */
const descriptionEditsDayCount = computed(() => {
	if (!descriptionEditsSelectedMonth.value) {
		return 31;
	}
	const month = descriptionEditsSelectedMonth.value;
	return new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
});

/** Day numbers offered by the Description Edits Day dropdown. */
const descriptionEditsDays = computed(() =>
	Array.from({ length: descriptionEditsDayCount.value }, (_, index) => index + 1),
);

/** Clamp the chosen day to the last day of the chosen month. */
function clampDescriptionEditsDay() {
	if (
		descriptionEditsSelectedDay.value &&
		descriptionEditsSelectedDay.value > descriptionEditsDayCount.value
	) {
		descriptionEditsSelectedDay.value = descriptionEditsDayCount.value;
	}
}

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

function formatDateLabel(date) {
	return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getMondayOfCurrentWeek(date = new Date()) {
	const normalizedDate = new Date(date);
	normalizedDate.setHours(0, 0, 0, 0);
	const dayIndex = (normalizedDate.getDay() + 6) % 7;
	normalizedDate.setDate(normalizedDate.getDate() - dayIndex);
	return normalizedDate;
}

const blockEditsWeekDays = computed(() => {
	const monday = getMondayOfCurrentWeek();
	return Array.from({ length: 5 }, (_, index) => {
		const date = new Date(monday);
		date.setDate(monday.getDate() + index);
		return {
			key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
			label: formatDateLabel(date),
		};
	});
});

function blockEditsIsComplete(dateLabel, subjectKey, blockNumber) {
	return blockCompletionStore.isBlockCompleteForDate(dateLabel, subjectKey, blockNumber);
}

function handleCurriculumGameNavigation() {
	emit("open-curriculum-game");
}

function handleBlockEditsToggle() {
	isBlockEditsOpen.value = !isBlockEditsOpen.value;
}

/** Toggle the Blocks menu sidebar. */
function handleBlocksMenuToggle() {
	isBlocksMenuOpen.value = !isBlocksMenuOpen.value;
}

/** Toggle the Description Edits depressed state and its text box panel. */
function handleDescriptionEditsToggle() {
	isDescriptionEditsOpen.value = !isDescriptionEditsOpen.value;
}

/** Select or collapse the Description Edits content mode. */
function handleDescriptionEditsModeToggle(mode) {
	descriptionEditsMode.value = descriptionEditsMode.value === mode ? null : mode;
}

/** Toggle the Description Edits Date sub-row. */
function handleDescriptionEditsDateToggle() {
	descriptionEditsMenuOpenStates.description.date.value = !descriptionEditsMenuOpenStates.description.date.value;
}

/** Toggle the Play by Play Date sub-row. */
function handlePlayByPlayEditsDateToggle() {
	descriptionEditsMenuOpenStates.playByPlay.date.value = !descriptionEditsMenuOpenStates.playByPlay.date.value;
}

/** Toggle the Description Month options list. */
function handleDescriptionEditsMonthToggle() {
	descriptionEditsMenuOpenStates.description.month.value = !descriptionEditsMenuOpenStates.description.month.value;
}

/** Toggle the Play by Play Month options list. */
function handlePlayByPlayEditsMonthToggle() {
	descriptionEditsMenuOpenStates.playByPlay.month.value = !descriptionEditsMenuOpenStates.playByPlay.month.value;
}

/** Toggle the Description Day options list. */
function handleDescriptionEditsDayToggle() {
	descriptionEditsMenuOpenStates.description.day.value = !descriptionEditsMenuOpenStates.description.day.value;
}

/** Toggle the Play by Play Day options list. */
function handlePlayByPlayEditsDayToggle() {
	descriptionEditsMenuOpenStates.playByPlay.day.value = !descriptionEditsMenuOpenStates.playByPlay.day.value;
}

/** Toggle the Description Year options list. */
function handleDescriptionEditsYearToggle() {
	descriptionEditsMenuOpenStates.description.year.value = !descriptionEditsMenuOpenStates.description.year.value;
}

/** Toggle the Play by Play Year options list. */
function handlePlayByPlayEditsYearToggle() {
	descriptionEditsMenuOpenStates.playByPlay.year.value = !descriptionEditsMenuOpenStates.playByPlay.year.value;
}

/** Toggle the Description Subject options list. */
function handleDescriptionEditsSubjectToggle() {
	descriptionEditsMenuOpenStates.description.subject.value = !descriptionEditsMenuOpenStates.description.subject.value;
}

/** Toggle the Play by Play Subject options list. */
function handlePlayByPlayEditsSubjectToggle() {
	descriptionEditsMenuOpenStates.playByPlay.subject.value = !descriptionEditsMenuOpenStates.playByPlay.subject.value;
}

/** Toggle the Description Block options list. */
function handleDescriptionEditsBlockToggle() {
	descriptionEditsMenuOpenStates.description.block.value = !descriptionEditsMenuOpenStates.description.block.value;
}

/** Toggle the Play by Play Block options list. */
function handlePlayByPlayEditsBlockToggle() {
	descriptionEditsMenuOpenStates.playByPlay.block.value = !descriptionEditsMenuOpenStates.playByPlay.block.value;
}

/** Toggle the Description History options list. */
function handleDescriptionEditsHistoryToggle() {
	descriptionEditsMenuOpenStates.description.history.value = !descriptionEditsMenuOpenStates.description.history.value;
}

/** Toggle the Play by Play History options list. */
function handlePlayByPlayEditsHistoryToggle() {
	descriptionEditsMenuOpenStates.playByPlay.history.value = !descriptionEditsMenuOpenStates.playByPlay.history.value;
}

function getDescriptionEditsHistory() {
	return blockDescriptionStore.getHistory();
}

function getPlayByPlayEditsHistory() {
	return blockDescriptionStore.getHistory("play-by-play");
}

/** Select a Description Edits month and clamp an out-of-range day. */
function handleDescriptionEditsMonthSelect(month) {
	descriptionEditsDateSelections.description.month.value = month;
	descriptionEditsMenuOpenStates.description.month.value = false;
	clampDescriptionEditsDay();
}

/** Select a Play by Play month and clamp an out-of-range day. */
function handlePlayByPlayEditsMonthSelect(month) {
	descriptionEditsDateSelections.playByPlay.month.value = month;
	descriptionEditsMenuOpenStates.playByPlay.month.value = false;
	clampDescriptionEditsDay();
}

/** Select a Description Edits day. */
function handleDescriptionEditsDaySelect(day) {
	descriptionEditsDateSelections.description.day.value = day;
	descriptionEditsMenuOpenStates.description.day.value = false;
}

/** Select a Play by Play day. */
function handlePlayByPlayEditsDaySelect(day) {
	descriptionEditsDateSelections.playByPlay.day.value = day;
	descriptionEditsMenuOpenStates.playByPlay.day.value = false;
}

/** Select a Description Edits year and clamp an out-of-range day. */
function handleDescriptionEditsYearSelect(year) {
	descriptionEditsDateSelections.description.year.value = year;
	descriptionEditsMenuOpenStates.description.year.value = false;
	clampDescriptionEditsDay();
}

/** Select a Play by Play year and clamp an out-of-range day. */
function handlePlayByPlayEditsYearSelect(year) {
	descriptionEditsDateSelections.playByPlay.year.value = year;
	descriptionEditsMenuOpenStates.playByPlay.year.value = false;
	clampDescriptionEditsDay();
}

/** Select a Description subject. */
function handleDescriptionEditsSubjectSelect(subject) {
	descriptionEditsSelections.description.subject.value = subject;
	descriptionEditsMenuOpenStates.description.subject.value = false;
}

/** Select a Play by Play subject. */
function handlePlayByPlayEditsSubjectSelect(subject) {
	descriptionEditsSelections.playByPlay.subject.value = subject;
	descriptionEditsMenuOpenStates.playByPlay.subject.value = false;
}

/** Select a Description block option. */
function handleDescriptionEditsBlockSelect(block) {
	descriptionEditsSelections.description.block.value = block;
	descriptionEditsMenuOpenStates.description.block.value = false;
}

/** Select a Play by Play block option. */
function handlePlayByPlayEditsBlockSelect(block) {
	descriptionEditsSelections.playByPlay.block.value = block;
	descriptionEditsMenuOpenStates.playByPlay.block.value = false;
}

/** Load a Description Edits history entry into the text box. */
function handleDescriptionEditsHistorySelect(entry) {
	descriptionEditsLoadedFields.value = [];
	descriptionEditsLoadedSelectionKey.value = null;
	descriptionEditsDraft.value = entry.text;
	descriptionEditsMenuOpenStates.description.history.value = false;
}

/** Load a Play by Play history entry into the text box. */
function handlePlayByPlayEditsHistorySelect(entry) {
	playByPlayEditsLoadedFields.value = [];
	playByPlayEditsLoadedSelectionKey.value = null;
	descriptionEditsPlayByPlayDraft.value = entry.text;
	descriptionEditsMenuOpenStates.playByPlay.history.value = false;
}

function handleDescriptionEditsLoad() {
	if (!isDescriptionEditsLoadEnabled.value) {
		return;
	}
	const dateKey = `${descriptionEditsSelectedYear.value}-${String(
		descriptionEditsSelectedMonth.value.getMonth() + 1,
	).padStart(2, "0")}-${String(descriptionEditsSelectedDay.value).padStart(2, "0")}`;
	const blocks =
		descriptionEditsSelectedBlock.value === "all"
			? [1, 2, 3]
			: [descriptionEditsSelectedBlock.value];
	const subjectKey = descriptionEditsSelectedSubject.value.key;
	const savedBlocks = blocks.map((blockNumber) => ({
		blockNumber,
		text: blockDescriptionStore.getDescription(dateKey, subjectKey, blockNumber),
	})).filter(({ text }) => text !== null && text.length > 0);
	descriptionEditsLoadedFields.value = savedBlocks.length > 0 &&
		savedBlocks.every(({ text }) => text === savedBlocks[0].text)
		? [{ blocks: savedBlocks.map(({ blockNumber }) => blockNumber), originalText: savedBlocks[0].text, text: savedBlocks[0].text }]
		: savedBlocks.map(({ blockNumber, text }) => ({ blocks: [blockNumber], originalText: text, text }));
	descriptionEditsLoadedSelectionKey.value = savedBlocks.length > 0
		? `${dateKey}::${subjectKey}::${descriptionEditsSelectedBlock.value}`
		: null;
}

async function handleDescriptionEditsCommit() {
	if (!isDescriptionEditsLoadEnabled.value) {
		return;
	}
	const dateKey = `${descriptionEditsSelectedYear.value}-${String(
		descriptionEditsSelectedMonth.value.getMonth() + 1,
	).padStart(2, "0")}-${String(descriptionEditsSelectedDay.value).padStart(2, "0")}`;
	const subjectKey = descriptionEditsSelectedSubject.value.key;
	if (descriptionEditsLoadedSelectionKey.value !== null) {
		for (const field of descriptionEditsLoadedFields.value) {
			if (field.text !== field.originalText) {
				for (const blockNumber of field.blocks) {
					blockDescriptionStore.overwriteDescription({ dateKey, subjectKey, blockNumber, text: field.text });
				}
			}
		}
	} else if (!blockDescriptionStore.commitDescription({
		dateKey,
		subjectKey,
		blocks: descriptionEditsSelectedBlock.value === "all" ? [1, 2, 3] : [descriptionEditsSelectedBlock.value],
		text: descriptionEditsDraft.value,
	})) {
		return;
	}
	descriptionEditsLoadedFields.value = [];
	descriptionEditsLoadedSelectionKey.value = null;
	descriptionEditsDraft.value = "";
	await nextTick();
	if (descriptionEditsEditor.value) {
		descriptionEditsEditor.value.focus();
		descriptionEditsEditor.value.setSelectionRange(0, 0);
		descriptionEditsEditor.value.scrollTop = 0;
		descriptionEditsEditor.value.scrollLeft = 0;
	}
}

function handlePlayByPlayEditsLoad() {
	if (!isPlayByPlayEditsLoadEnabled.value) {
		return;
	}
	const dateKey = `${descriptionEditsSelectedYear.value}-${String(
		descriptionEditsSelectedMonth.value.getMonth() + 1,
	).padStart(2, "0")}-${String(descriptionEditsSelectedDay.value).padStart(2, "0")}`;
	const blocks =
		descriptionEditsSelectedBlock.value === "all"
			? [1, 2, 3]
			: [descriptionEditsSelectedBlock.value];
	const subjectKey = descriptionEditsSelectedSubject.value.key;
	const savedBlocks = blocks.map((blockNumber) => ({
		blockNumber,
		text: blockDescriptionStore.getPlayByPlay(dateKey, subjectKey, blockNumber),
	})).filter(({ text }) => text !== null && text.length > 0);
	playByPlayEditsLoadedFields.value = savedBlocks.length > 0 &&
		savedBlocks.every(({ text }) => text === savedBlocks[0].text)
		? [{ blocks: savedBlocks.map(({ blockNumber }) => blockNumber), originalText: savedBlocks[0].text, text: savedBlocks[0].text }]
		: savedBlocks.map(({ blockNumber, text }) => ({ blocks: [blockNumber], originalText: text, text }));
	playByPlayEditsLoadedSelectionKey.value = savedBlocks.length > 0
		? `${dateKey}::${subjectKey}::${descriptionEditsSelectedBlock.value}`
		: null;
}

async function handlePlayByPlayEditsCommit() {
	if (!isPlayByPlayEditsLoadEnabled.value) {
		return;
	}
	const dateKey = `${descriptionEditsSelectedYear.value}-${String(
		descriptionEditsSelectedMonth.value.getMonth() + 1,
	).padStart(2, "0")}-${String(descriptionEditsSelectedDay.value).padStart(2, "0")}`;
	const subjectKey = descriptionEditsSelectedSubject.value.key;
	if (playByPlayEditsLoadedSelectionKey.value !== null) {
		for (const field of playByPlayEditsLoadedFields.value) {
			if (field.text !== field.originalText) {
				for (const blockNumber of field.blocks) {
					blockDescriptionStore.overwritePlayByPlay({ dateKey, subjectKey, blockNumber, text: field.text });
				}
			}
		}
	} else if (!blockDescriptionStore.commitPlayByPlay({
		dateKey,
		subjectKey,
		blocks: descriptionEditsSelectedBlock.value === "all" ? [1, 2, 3] : [descriptionEditsSelectedBlock.value],
		text: descriptionEditsPlayByPlayDraft.value,
	})) {
		return;
	}
	playByPlayEditsLoadedFields.value = [];
	playByPlayEditsLoadedSelectionKey.value = null;
	descriptionEditsPlayByPlayDraft.value = "";
	await nextTick();
	if (playByPlayEditsEditor.value) {
		playByPlayEditsEditor.value.focus();
		playByPlayEditsEditor.value.setSelectionRange(0, 0);
		playByPlayEditsEditor.value.scrollTop = 0;
		playByPlayEditsEditor.value.scrollLeft = 0;
	}
}

/** Build removal details for one menu's selection. */
function getDescriptionEditsRemoveDetails(selection) {
	if (
		!selection.month.value ||
		!selection.day.value ||
		!selection.year.value ||
		!selection.subject.value ||
		selection.block.value === null
	) {
		return null;
	}
	return {
		dateKey: `${selection.year.value}-${String(
			selection.month.value.getMonth() + 1,
		).padStart(2, "0")}-${String(selection.day.value).padStart(2, "0")}`,
		subjectKey: selection.subject.value.key,
		blocks: selection.block.value === "all" ? [1, 2, 3] : [selection.block.value],
	};
}

/** Remove saved descriptions for the Description menu selection. */
function handleDescriptionEditsRemove() {
	const removeDetails = getDescriptionEditsRemoveDetails({
		...descriptionEditsDateSelections.description,
		...descriptionEditsSelections.description,
	});
	if (removeDetails) {
		blockDescriptionStore.removeDescriptions(removeDetails);
		if (descriptionEditsLoadedSelectionKey.value !== null) {
			descriptionEditsLoadedFields.value = [];
			descriptionEditsLoadedSelectionKey.value = null;
			descriptionEditsDraft.value = "";
		}
	}
}

/** Remove saved Play by Play for its independent menu selection. */
function handlePlayByPlayEditsRemove() {
	const removeDetails = getDescriptionEditsRemoveDetails({
		...descriptionEditsDateSelections.playByPlay,
		...descriptionEditsSelections.playByPlay,
	});
	if (removeDetails) {
		blockDescriptionStore.removePlayByPlay(removeDetails);
		if (playByPlayEditsLoadedSelectionKey.value !== null) {
			playByPlayEditsLoadedFields.value = [];
			playByPlayEditsLoadedSelectionKey.value = null;
			descriptionEditsPlayByPlayDraft.value = "";
		}
	}
}

/** Toggle a Block Edits entry for the selected day in the active week. */
function handleBlockEditsCompleteToggle(dateLabel, subjectKey, blockNumber) {
	if (blockEditsIsComplete(dateLabel, subjectKey, blockNumber)) {
		blockCompletionStore.markBlockIncomplete(dateLabel, subjectKey, blockNumber);
	} else {
		blockCompletionStore.markBlockComplete(dateLabel, subjectKey, blockNumber);
	}
}

function handleStudentEditsScreenClose() {
	emit("back-to-parent-menu");
}

function handleBlocksScreenBack() {
	if (isDescriptionEditsOpen.value) {
		isDescriptionEditsOpen.value = false;
		descriptionEditsMode.value = null;
	} else if (isBlockEditsOpen.value) {
		isBlockEditsOpen.value = false;
	} else {
		isBlocksMenuOpen.value = false;
	}
}

function handleMathCurriculumOctoberOpen() {
	emit("open-math-curriculum-october");
}

function handleStudentEditsScreenHome() {
	emit("go-home");
}
</script>

<template>
	<main
		id="student-edits-screen"
		class="student-edits-screen"
		role="main"
		aria-label="Student Edits screen"
		title="Student Edits screen"
	>
		<aside
			id="student-edits-sidebar"
			class="student-edits-sidebar"
			aria-label="Student Edits sidebar"
			title="Student Edits sidebar"
		>
			<button
				id="curriculum-game-button"
				class="curriculum-game-button"
				type="button"
				name="curriculum-game-button"
				data-button-name="curriculum-game-button"
				aria-label="Open Curriculum Game"
				title="Open Curriculum Game"
				@click="handleCurriculumGameNavigation"
			>
				Curriculum Game
			</button>
			<button
				id="blocks-menu-button"
				class="blocks-menu-button"
				type="button"
				name="blocks-menu-button"
				data-button-name="blocks-menu-button"
				aria-label="Open Blocks menu"
				title="Open Blocks menu"
				@click="handleBlocksMenuToggle"
			>
				Blocks
			</button>
			<div class="student-edits-sidebar-actions">
				<button
					v-show="!isBlocksMenuOpen"
					id="student-edits-screen-home-button"
					class="student-edits-screen-home-button navigation-home-button"
					type="button"
					name="student-edits-screen-home-button"
					data-button-name="student-edits-screen-home-button"
					aria-label="Return home"
					title="Return home"
					@click="handleStudentEditsScreenHome"
				>
					Home
				</button>
				<button
					v-show="!isBlocksMenuOpen"
					id="student-edits-screen-back-button"
					class="student-edits-screen-back-button navigation-back-button"
					type="button"
					name="student-edits-screen-back-button"
					data-button-name="student-edits-screen-back-button"
					aria-label="Back to parent"
					title="Back to parent"
					@click="handleStudentEditsScreenClose"
				>
					Back
				</button>
			</div>
		</aside>
		<aside
			v-if="isBlocksMenuOpen"
			id="blocks-menu-sidebar"
			class="blocks-menu-sidebar"
			aria-label="Blocks menu"
			title="Blocks menu"
		>
			<button
				id="description-edits-button"
				class="description-edits-button"
				:class="{ 'description-edits-button--active': isDescriptionEditsOpen }"
				type="button"
				name="description-edits-button"
				data-button-name="description-edits-button"
				aria-label="Toggle Description Edits"
				title="Toggle Description Edits"
				:aria-pressed="isDescriptionEditsOpen"
				@click="handleDescriptionEditsToggle"
			>
				Description Edits
			</button>
			<button
				id="block-edits-button"
				class="block-edits-button"
				:class="{ 'block-edits-button--active': isBlockEditsOpen }"
				type="button"
				name="block-edits-button"
				data-button-name="block-edits-button"
				aria-label="Toggle Block Edits"
				title="Toggle Block Edits"
				:aria-pressed="isBlockEditsOpen"
				@click="handleBlockEditsToggle"
			>
				Block Edits
			</button>
			<div class="blocks-menu-sidebar-actions student-edits-sidebar-actions">
				<button
					id="blocks-screen-home-button"
					class="blocks-screen-home-button navigation-home-button"
					type="button"
					name="blocks-screen-home-button"
					data-button-name="blocks-screen-home-button"
					aria-label="Return home"
					title="Return home"
					@click="handleStudentEditsScreenHome"
				>
					Home
				</button>
				<button
					id="blocks-screen-back-button"
					class="blocks-screen-back-button navigation-back-button"
					type="button"
					name="blocks-screen-back-button"
					data-button-name="blocks-screen-back-button"
					aria-label="Back one screen"
					title="Back one screen"
					@click="handleBlocksScreenBack"
				>
					Back
				</button>
			</div>
		</aside>
		<div
			v-if="isDescriptionEditsOpen"
			id="description-edits-position-wrapper"
			class="description-edits-position-wrapper"
		>
			<div
				id="description-edits-panel-container"
				class="description-edits-panel-container"
				:class="{ 'description-edits-panel-container--compact': !descriptionEditsMode }"
			>
				<div
					v-if="descriptionEditsMode === 'description' && descriptionEditsLoadedFields.length > 0"
					id="description-edits-loaded-scroll-region"
					class="description-edits-loaded-scroll-region ml-auto flex h-[772px] w-[772px] flex-col gap-4 overflow-y-scroll rounded-lg border-2 border-[#7a5612]/50 bg-[#fffce7] p-4 text-[#513d12] [direction:ltr]"
					aria-label="Loaded descriptions"
				>
					<div
						v-for="field in descriptionEditsLoadedFields"
						:key="field.blocks.join('-')"
						class="description-edits-loaded-field flex shrink-0 flex-col gap-2"
					>
						<label
							:for="`description-edits-loaded-text-${field.blocks.join('-')}`"
							class="description-edits-loaded-label text-base font-bold"
						>Block{{ field.blocks.length > 1 ? 's' : '' }} {{ field.blocks.join(', ') }}</label>
						<textarea
							:id="`description-edits-loaded-text-${field.blocks.join('-')}`"
							v-model="field.text"
							class="description-edits-loaded-text w-full resize-none overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#7a5612]/50 bg-[#fffce7] p-4 text-base leading-normal"
							:class="descriptionEditsLoadedFields.length === 1 ? 'h-[704px]' : 'h-[240px]'"
						/>
					</div>
				</div>
				<div
					v-else-if="descriptionEditsMode === 'play-by-play' && playByPlayEditsLoadedFields.length > 0"
					id="play-by-play-edits-loaded-scroll-region"
					class="play-by-play-edits-loaded-scroll-region ml-auto flex h-[772px] w-[772px] flex-col gap-4 overflow-y-scroll rounded-lg border-2 border-[#7a5612]/50 bg-[#fffce7] p-4 text-[#513d12] [direction:ltr]"
					aria-label="Loaded Play by Play"
				>
					<div
						v-for="field in playByPlayEditsLoadedFields"
						:key="field.blocks.join('-')"
						class="play-by-play-edits-loaded-field flex shrink-0 flex-col gap-2"
					>
						<label
							:for="`play-by-play-edits-loaded-text-${field.blocks.join('-')}`"
							class="play-by-play-edits-loaded-label text-base font-bold"
						>Block{{ field.blocks.length > 1 ? 's' : '' }} {{ field.blocks.join(', ') }}</label>
						<textarea
							:id="`play-by-play-edits-loaded-text-${field.blocks.join('-')}`"
							v-model="field.text"
							class="play-by-play-edits-loaded-text w-full resize-none overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#7a5612]/50 bg-[#fffce7] p-4 text-base leading-normal"
							:class="playByPlayEditsLoadedFields.length === 1 ? 'h-[704px]' : 'h-[240px]'"
						/>
					</div>
				</div>
				<textarea
					v-else-if="descriptionEditsMode === 'play-by-play'"
					id="play-by-play-edits-text-box"
					ref="playByPlayEditsEditor"
					v-model="descriptionEditsPlayByPlayDraft"
					class="play-by-play-edits-text-box block h-[772px] w-[772px] resize-none overflow-y-scroll whitespace-pre-wrap rounded-[0.875rem] border-2 border-[#7a5612]/50 bg-[#fffce7]/95 p-4 text-base leading-normal text-[#513d12] [font-family:Trebuchet_MS,sans-serif]"
					aria-label="Play by Play text box"
					name="play-by-play-edits-text-box"
				/>
				<textarea
					v-else
					id="description-edits-text-box"
					ref="descriptionEditsEditor"
					v-model="descriptionEditsActiveDraft"
					class="description-edits-text-box"
					:aria-label="descriptionEditsMode === 'play-by-play' ? 'Play by Play text box' : 'Description text box'"
					name="description-edits-text-box"
				/>
				<div
					v-if="descriptionEditsMode === 'description'"
					id="description-edits-date-subrow"
					class="description-edits-date-subrow"
					:class="{ 'description-edits-date-subrow--hidden': !isDescriptionEditsDateOpen }"
					:aria-hidden="!isDescriptionEditsDateOpen"
					:inert="!isDescriptionEditsDateOpen"
				>
					<div id="description-edits-month-dropdown-wrapper" class="description-edits-month-dropdown-wrapper">
						<button id="description-edits-month-dropdown-button" class="description-edits-month-dropdown-button" type="button" name="description-edits-month-dropdown-button" data-button-name="description-edits-month-dropdown-button" title="Toggle Month options" :aria-expanded="isDescriptionEditsMonthOpen" @click="handleDescriptionEditsMonthToggle">Month</button>
						<fieldset v-if="isDescriptionEditsMonthOpen" id="description-edits-month-options-list" class="description-edits-month-options-list" aria-label="Month options" title="Month options">
							<button v-for="month in descriptionEditsMonths" :id="`description-edits-month-option-${month.getFullYear()}-${month.getMonth()}`" :key="`${month.getFullYear()}-${month.getMonth()}`" class="description-edits-month-option-button" type="button" :name="`description-edits-month-option-${month.getFullYear()}-${month.getMonth()}`" :data-button-name="`description-edits-month-option-${month.getFullYear()}-${month.getMonth()}`" :aria-label="`Select month ${monthNames[month.getMonth()]} ${month.getFullYear()}`" :title="`Select month ${monthNames[month.getMonth()]} ${month.getFullYear()}`" @click="handleDescriptionEditsMonthSelect(month)">{{ monthNames[month.getMonth()] }}</button>
						</fieldset>
					</div>
					<div id="description-edits-day-dropdown-wrapper" class="description-edits-day-dropdown-wrapper">
						<button id="description-edits-day-dropdown-button" class="description-edits-day-dropdown-button" type="button" name="description-edits-day-dropdown-button" data-button-name="description-edits-day-dropdown-button" title="Toggle Day options" :aria-expanded="isDescriptionEditsDayOpen" @click="handleDescriptionEditsDayToggle">Day</button>
						<fieldset v-if="isDescriptionEditsDayOpen" id="description-edits-day-options-list" class="description-edits-day-options-list" aria-label="Day options">
							<button v-for="day in descriptionEditsDays" :id="`description-edits-day-option-${day}`" :key="day" class="description-edits-day-option-button" type="button" :name="`description-edits-day-option-${day}`" :data-button-name="`description-edits-day-option-${day}`" :aria-label="`Select day ${day}`" :title="`Select day ${day}`" @click="handleDescriptionEditsDaySelect(day)">{{ day }}</button>
						</fieldset>
					</div>
					<div id="description-edits-year-dropdown-wrapper" class="description-edits-year-dropdown-wrapper">
						<button id="description-edits-year-dropdown-button" class="description-edits-year-dropdown-button" type="button" name="description-edits-year-dropdown-button" data-button-name="description-edits-year-dropdown-button" title="Toggle Year options" :aria-expanded="isDescriptionEditsYearOpen" @click="handleDescriptionEditsYearToggle">Year</button>
						<fieldset v-if="isDescriptionEditsYearOpen" id="description-edits-year-options-list" class="description-edits-year-options-list" aria-label="Year options">
							<button v-for="year in descriptionEditsYears" :id="`description-edits-year-option-${year}`" :key="year" class="description-edits-year-option-button" type="button" :name="`description-edits-year-option-${year}`" :data-button-name="`description-edits-year-option-${year}`" :aria-label="`Select year ${year}`" :title="`Select year ${year}`" @click="handleDescriptionEditsYearSelect(year)">{{ year }}</button>
						</fieldset>
					</div>
				</div>
				<div
					v-else-if="descriptionEditsMode === 'play-by-play'"
					id="play-by-play-edits-date-subrow"
					class="play-by-play-edits-date-subrow"
					:class="{ 'play-by-play-edits-date-subrow--hidden': !isDescriptionEditsDateOpen }"
					:aria-hidden="!isDescriptionEditsDateOpen"
					:inert="!isDescriptionEditsDateOpen"
				>
					<div id="play-by-play-edits-month-dropdown-wrapper" class="play-by-play-edits-month-dropdown-wrapper">
						<button id="play-by-play-edits-month-dropdown-button" class="play-by-play-edits-month-dropdown-button" type="button" name="play-by-play-edits-month-dropdown-button" data-button-name="play-by-play-edits-month-dropdown-button" title="Toggle Play by Play Month options" :aria-expanded="isDescriptionEditsMonthOpen" @click="handlePlayByPlayEditsMonthToggle">Month</button>
						<fieldset v-if="isDescriptionEditsMonthOpen" id="play-by-play-edits-month-options-list" class="play-by-play-edits-month-options-list" aria-label="Play by Play Month options" title="Play by Play Month options">
							<button v-for="month in descriptionEditsMonths" :id="`play-by-play-edits-month-option-${month.getFullYear()}-${month.getMonth()}`" :key="`${month.getFullYear()}-${month.getMonth()}`" class="play-by-play-edits-month-option-button" type="button" :name="`play-by-play-edits-month-option-${month.getFullYear()}-${month.getMonth()}`" :data-button-name="`play-by-play-edits-month-option-${month.getFullYear()}-${month.getMonth()}`" :aria-label="`Select Play by Play month ${monthNames[month.getMonth()]} ${month.getFullYear()}`" :title="`Select Play by Play month ${monthNames[month.getMonth()]} ${month.getFullYear()}`" @click="handlePlayByPlayEditsMonthSelect(month)">{{ monthNames[month.getMonth()] }}</button>
						</fieldset>
					</div>
					<div id="play-by-play-edits-day-dropdown-wrapper" class="play-by-play-edits-day-dropdown-wrapper">
						<button id="play-by-play-edits-day-dropdown-button" class="play-by-play-edits-day-dropdown-button" type="button" name="play-by-play-edits-day-dropdown-button" data-button-name="play-by-play-edits-day-dropdown-button" title="Toggle Play by Play Day options" :aria-expanded="isDescriptionEditsDayOpen" @click="handlePlayByPlayEditsDayToggle">Day</button>
						<fieldset v-if="isDescriptionEditsDayOpen" id="play-by-play-edits-day-options-list" class="play-by-play-edits-day-options-list" aria-label="Play by Play Day options">
							<button v-for="day in descriptionEditsDays" :id="`play-by-play-edits-day-option-${day}`" :key="day" class="play-by-play-edits-day-option-button" type="button" :name="`play-by-play-edits-day-option-${day}`" :data-button-name="`play-by-play-edits-day-option-${day}`" :aria-label="`Select Play by Play day ${day}`" :title="`Select Play by Play day ${day}`" @click="handlePlayByPlayEditsDaySelect(day)">{{ day }}</button>
						</fieldset>
					</div>
					<div id="play-by-play-edits-year-dropdown-wrapper" class="play-by-play-edits-year-dropdown-wrapper">
						<button id="play-by-play-edits-year-dropdown-button" class="play-by-play-edits-year-dropdown-button" type="button" name="play-by-play-edits-year-dropdown-button" data-button-name="play-by-play-edits-year-dropdown-button" title="Toggle Play by Play Year options" :aria-expanded="isDescriptionEditsYearOpen" @click="handlePlayByPlayEditsYearToggle">Year</button>
						<fieldset v-if="isDescriptionEditsYearOpen" id="play-by-play-edits-year-options-list" class="play-by-play-edits-year-options-list" aria-label="Play by Play Year options">
							<button v-for="year in descriptionEditsYears" :id="`play-by-play-edits-year-option-${year}`" :key="year" class="play-by-play-edits-year-option-button" type="button" :name="`play-by-play-edits-year-option-${year}`" :data-button-name="`play-by-play-edits-year-option-${year}`" :aria-label="`Select Play by Play year ${year}`" :title="`Select Play by Play year ${year}`" @click="handlePlayByPlayEditsYearSelect(year)">{{ year }}</button>
						</fieldset>
					</div>
				</div>
				<div id="description-edits-controls-row" class="description-edits-controls-row">
					<div
						v-if="descriptionEditsMode"
						id="description-edits-selection-summary"
						class="description-edits-selection-summary"
						:class="{ 'description-edits-selection-summary--hidden': !isDescriptionEditsSelectionSummaryVisible }"
						:aria-hidden="!isDescriptionEditsSelectionSummaryVisible"
						aria-live="polite"
					>
						<span
							v-if="descriptionEditsSelectionDateLabel"
							id="description-edits-selection-date"
							class="description-edits-selection-date"
						>Date: {{ descriptionEditsSelectionDateLabel }}</span>
						<span
							v-if="descriptionEditsSelectedSubject"
							id="description-edits-selection-subject"
							class="description-edits-selection-subject"
						>Subject: {{ descriptionEditsSelectedSubject.label }}</span>
						<span
							v-if="descriptionEditsSelectedBlock !== null"
							id="description-edits-selection-block"
							class="description-edits-selection-block"
						>Block: {{ descriptionEditsSelectedBlock === "all" ? "All" : descriptionEditsSelectedBlock }}</span>
					</div>
					<div
						id="play-by-play-math-curriculum-row"
						class="play-by-play-math-curriculum-row"
					>
						<button
							id="math-curriculum-october-button"
							class="math-curriculum-october-button"
							:class="{ 'math-curriculum-october-button--reserved': descriptionEditsMode !== 'play-by-play' }"
							type="button"
							name="math-curriculum-october-button"
							data-button-name="math-curriculum-october-button"
							aria-label="Math Curriculum (October)"
							title="Math Curriculum (October)"
							:aria-hidden="descriptionEditsMode !== 'play-by-play'"
							:inert="descriptionEditsMode !== 'play-by-play'"
							:disabled="descriptionEditsMode !== 'play-by-play'"
							@click="handleMathCurriculumOctoberOpen"
						>
							Math Curriculum<br />(October)
						</button>
					</div>
					<div
						:id="descriptionEditsMode === 'description' ? 'description-edits-workflow-row' : 'play-by-play-edits-workflow-row'"
						:class="descriptionEditsMode === 'description' ? 'description-edits-workflow-row col-span-full grid grid-cols-7 items-center justify-center gap-4' : descriptionEditsMode === 'play-by-play' ? 'play-by-play-edits-workflow-row col-span-full grid grid-cols-7 items-center justify-center gap-4' : 'contents'"
					>
						<button
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-commit-button"
							class="description-edits-commit-button"
							type="button"
							name="description-edits-commit-button"
							data-button-name="description-edits-commit-button"
							aria-label="Save description"
							title="Save description"
							@click="handleDescriptionEditsCommit"
						>
							Save
						</button>
						<button
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-commit-button"
							class="play-by-play-edits-commit-button"
							type="button"
							name="play-by-play-edits-commit-button"
							data-button-name="play-by-play-edits-commit-button"
							aria-label="Save Play by Play"
							title="Save Play by Play"
							@click="handlePlayByPlayEditsCommit"
						>
							Save
						</button>
						<button
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-load-button"
							class="description-edits-load-button"
							type="button"
							name="description-edits-load-button"
							data-button-name="description-edits-load-button"
							aria-label="Load description"
							title="Load description"
							:disabled="!isDescriptionEditsLoadEnabled"
							@click="handleDescriptionEditsLoad"
						>
							Load
						</button>
						<button
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-load-button"
							class="play-by-play-edits-load-button"
							type="button"
							name="play-by-play-edits-load-button"
							data-button-name="play-by-play-edits-load-button"
							aria-label="Load Play by Play"
							title="Load Play by Play"
							:disabled="!isPlayByPlayEditsLoadEnabled"
							@click="handlePlayByPlayEditsLoad"
						>
							Load
						</button>
						<button
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-date-dropdown-button"
							class="description-edits-date-dropdown-button"
							type="button"
							name="description-edits-date-dropdown-button"
							data-button-name="description-edits-date-dropdown-button"
							aria-label="Toggle Date options"
							title="Toggle Date options"
							:aria-expanded="isDescriptionEditsDateOpen"
							@click="handleDescriptionEditsDateToggle"
						>
							Date
						</button>
						<button
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-date-dropdown-button"
							class="play-by-play-edits-date-dropdown-button"
							type="button"
							name="play-by-play-edits-date-dropdown-button"
							data-button-name="play-by-play-edits-date-dropdown-button"
							aria-label="Toggle Play by Play Date options"
							title="Toggle Play by Play Date options"
							:aria-expanded="isDescriptionEditsDateOpen"
							@click="handlePlayByPlayEditsDateToggle"
						>
							Date
						</button>
						<div
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-subject-dropdown-wrapper"
							class="description-edits-subject-dropdown-wrapper"
						>
							<button id="description-edits-subject-dropdown-button" class="description-edits-subject-dropdown-button" type="button" name="description-edits-subject-dropdown-button" data-button-name="description-edits-subject-dropdown-button" title="Toggle Subject options" :aria-expanded="isDescriptionEditsSubjectOpen" @click="handleDescriptionEditsSubjectToggle">Subject</button>
							<fieldset v-if="isDescriptionEditsSubjectOpen" id="description-edits-subject-options-list" class="description-edits-subject-options-list" aria-label="Subject options" title="Subject options">
								<button v-for="subject in descriptionEditsSubjects" :id="`description-edits-subject-option-${subject.key}`" :key="subject.key" class="description-edits-subject-option-button" type="button" :name="`description-edits-subject-option-${subject.key}`" :data-button-name="`description-edits-subject-option-${subject.key}`" :aria-label="`Select subject ${subject.label}`" :title="`Select subject ${subject.label}`" @click="handleDescriptionEditsSubjectSelect(subject)">{{ subject.label }}</button>
							</fieldset>
						</div>
						<div
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-subject-dropdown-wrapper"
							class="play-by-play-edits-subject-dropdown-wrapper"
						>
							<button id="play-by-play-edits-subject-dropdown-button" class="play-by-play-edits-subject-dropdown-button" type="button" name="play-by-play-edits-subject-dropdown-button" data-button-name="play-by-play-edits-subject-dropdown-button" title="Toggle Play by Play Subject options" :aria-expanded="isDescriptionEditsSubjectOpen" @click="handlePlayByPlayEditsSubjectToggle">Subject</button>
							<fieldset v-if="isDescriptionEditsSubjectOpen" id="play-by-play-edits-subject-options-list" class="play-by-play-edits-subject-options-list" aria-label="Play by Play Subject options" title="Play by Play Subject options">
								<button v-for="subject in descriptionEditsSubjects" :id="`play-by-play-edits-subject-option-${subject.key}`" :key="subject.key" class="play-by-play-edits-subject-option-button" type="button" :name="`play-by-play-edits-subject-option-${subject.key}`" :data-button-name="`play-by-play-edits-subject-option-${subject.key}`" :aria-label="`Select Play by Play subject ${subject.label}`" :title="`Select Play by Play subject ${subject.label}`" @click="handlePlayByPlayEditsSubjectSelect(subject)">{{ subject.label }}</button>
							</fieldset>
						</div>
						<div v-if="descriptionEditsMode === 'description'" id="description-edits-block-dropdown-wrapper" class="description-edits-block-dropdown-wrapper">
							<button id="description-edits-block-dropdown-button" class="description-edits-block-dropdown-button" type="button" name="description-edits-block-dropdown-button" data-button-name="description-edits-block-dropdown-button" title="Toggle Block options" :aria-expanded="isDescriptionEditsBlockOpen" @click="handleDescriptionEditsBlockToggle">Block</button>
							<fieldset v-if="isDescriptionEditsBlockOpen" id="description-edits-block-options-list" class="description-edits-block-options-list" aria-label="Block options" title="Block options">
								<button v-for="blockOption in descriptionEditsBlocks" :id="`description-edits-block-option-${blockOption}`" :key="blockOption" class="description-edits-block-option-button" type="button" :name="`description-edits-block-option-${blockOption}`" :data-button-name="`description-edits-block-option-${blockOption}`" :aria-label="`Select ${blockOption === 'all' ? 'All Blocks' : `Block ${blockOption}`}`" :title="`Select ${blockOption === 'all' ? 'All Blocks' : `Block ${blockOption}`}`" @click="handleDescriptionEditsBlockSelect(blockOption)">{{ blockOption === "all" ? "All Blocks" : `Block ${blockOption}` }}</button>
							</fieldset>
						</div>
						<div v-else-if="descriptionEditsMode === 'play-by-play'" id="play-by-play-edits-block-dropdown-wrapper" class="play-by-play-edits-block-dropdown-wrapper">
							<button id="play-by-play-edits-block-dropdown-button" class="play-by-play-edits-block-dropdown-button" type="button" name="play-by-play-edits-block-dropdown-button" data-button-name="play-by-play-edits-block-dropdown-button" title="Toggle Play by Play Block options" :aria-expanded="isDescriptionEditsBlockOpen" @click="handlePlayByPlayEditsBlockToggle">Block</button>
							<fieldset v-if="isDescriptionEditsBlockOpen" id="play-by-play-edits-block-options-list" class="play-by-play-edits-block-options-list" aria-label="Play by Play Block options" title="Play by Play Block options">
								<button v-for="blockOption in descriptionEditsBlocks" :id="`play-by-play-edits-block-option-${blockOption}`" :key="blockOption" class="play-by-play-edits-block-option-button" type="button" :name="`play-by-play-edits-block-option-${blockOption}`" :data-button-name="`play-by-play-edits-block-option-${blockOption}`" :aria-label="`Select Play by Play ${blockOption === 'all' ? 'All Blocks' : `Block ${blockOption}`}`" :title="`Select Play by Play ${blockOption === 'all' ? 'All Blocks' : `Block ${blockOption}`}`" @click="handlePlayByPlayEditsBlockSelect(blockOption)">{{ blockOption === "all" ? "All Blocks" : `Block ${blockOption}` }}</button>
							</fieldset>
						</div>
						<div v-if="descriptionEditsMode === 'description'" id="description-edits-history-dropdown-wrapper" class="description-edits-history-dropdown-wrapper">
							<button id="description-edits-history-dropdown-button" class="description-edits-history-dropdown-button" type="button" name="description-edits-history-dropdown-button" data-button-name="description-edits-history-dropdown-button" aria-label="Toggle History options" title="Toggle History options" :aria-expanded="isDescriptionEditsHistoryOpen" @click="handleDescriptionEditsHistoryToggle">History</button>
							<fieldset v-if="isDescriptionEditsHistoryOpen" id="description-edits-history-options-list" class="description-edits-history-options-list" aria-label="Description history options" title="Description history options">
								<button v-for="entry in getDescriptionEditsHistory()" :id="`description-edits-history-option-${entry.savedAtIso}`" :key="entry.savedAtIso" class="description-edits-history-option-button" type="button" :name="`description-edits-history-option-${entry.savedAtIso}`" :data-button-name="`description-edits-history-option-${entry.savedAtIso}`" :aria-label="`Load description ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`" :title="`Load description ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`" @click="handleDescriptionEditsHistorySelect(entry)">{{ entry.subjectAbbrev }} {{ entry.savedAtLabel }}</button>
								<p v-if="getDescriptionEditsHistory().length === 0" id="description-edits-history-empty" class="description-edits-history-empty">&lt; none &gt;</p>
							</fieldset>
						</div>
						<div v-else-if="descriptionEditsMode === 'play-by-play'" id="play-by-play-edits-history-dropdown-wrapper" class="play-by-play-edits-history-dropdown-wrapper">
							<button id="play-by-play-edits-history-dropdown-button" class="play-by-play-edits-history-dropdown-button" type="button" name="play-by-play-edits-history-dropdown-button" data-button-name="play-by-play-edits-history-dropdown-button" aria-label="Toggle Play by Play History options" title="Toggle Play by Play History options" :aria-expanded="isDescriptionEditsHistoryOpen" @click="handlePlayByPlayEditsHistoryToggle">History</button>
							<fieldset v-if="isDescriptionEditsHistoryOpen" id="play-by-play-edits-history-options-list" class="play-by-play-edits-history-options-list" aria-label="Play by Play history options" title="Play by Play history options">
								<button v-for="entry in getPlayByPlayEditsHistory()" :id="`play-by-play-edits-history-option-${entry.savedAtIso}`" :key="entry.savedAtIso" class="play-by-play-edits-history-option-button" type="button" :name="`play-by-play-edits-history-option-${entry.savedAtIso}`" :data-button-name="`play-by-play-edits-history-option-${entry.savedAtIso}`" :aria-label="`Load Play by Play ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`" :title="`Load Play by Play ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`" @click="handlePlayByPlayEditsHistorySelect(entry)">{{ entry.subjectAbbrev }} {{ entry.savedAtLabel }}</button>
								<p v-if="getPlayByPlayEditsHistory().length === 0" id="play-by-play-edits-history-empty" class="play-by-play-edits-history-empty">&lt; none &gt;</p>
							</fieldset>
						</div>
						<button
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-remove-button"
							class="description-edits-remove-button"
							type="button"
							name="description-edits-remove-button"
							data-button-name="description-edits-remove-button"
							aria-label="Remove description"
							title="Remove description"
							@click="handleDescriptionEditsRemove"
						>
							Remove
						</button>
						<button
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-remove-button"
							class="play-by-play-edits-remove-button"
							type="button"
							name="play-by-play-edits-remove-button"
							data-button-name="play-by-play-edits-remove-button"
							aria-label="Remove Play by Play"
							title="Remove Play by Play"
							@click="handlePlayByPlayEditsRemove"
						>
							Remove
						</button>
					</div>
					<div id="description-edits-action-buttons" class="description-edits-action-buttons">
						<button
							id="description-edits-description-button"
							class="description-edits-description-button"
							type="button"
							name="description-edits-description-button"
							data-button-name="description-edits-description-button"
							:aria-pressed="descriptionEditsMode === 'description'"
							@click="handleDescriptionEditsModeToggle('description')"
						>
							Description
						</button>
						<button
							id="description-edits-play-by-play-button"
							class="description-edits-play-by-play-button"
							type="button"
							name="description-edits-play-by-play-button"
							data-button-name="description-edits-play-by-play-button"
							:aria-pressed="descriptionEditsMode === 'play-by-play'"
							@click="handleDescriptionEditsModeToggle('play-by-play')"
						>
							Play by Play
						</button>
					</div>
				</div>
			</div>
		</div>
		<section
			v-if="isBlockEditsOpen"
			id="block-edits-week-panel-container"
			class="block-edits-week-panel-container"
			aria-label="Block Edits week"
			title="Block Edits week"
		>
			<section
				v-for="day in blockEditsWeekDays"
				:id="`block-edits-panel-${day.key}`"
				:key="day.key"
				class="block-edits-panel"
				:aria-label="`Block Edits ${day.label}`"
				:title="`Block Edits ${day.label}`"
			>
				<h2 class="block-edits-panel-heading">Block Edits</h2>
				<p class="block-edits-panel-date">
					{{ day.label }}
				</p>
				<div class="block-edits-subject-list">
					<section
						v-for="subject in blockEditsSubjects"
						:id="`block-edits-subject-${day.key}-${subject.key}-section`"
						:key="`${day.key}-${subject.key}`"
						class="block-edits-subject-section"
						:aria-label="`${subject.label} blocks for ${day.label}`"
						:title="`${subject.label} blocks for ${day.label}`"
					>
						<h3 class="block-edits-subject-heading">
							{{ subject.label }}
						</h3>
						<div class="block-edits-block-list">
							<!-- prettier-ignore -->
							<button
								v-for="blockNumber in blockEditsBlocksPerSubject"
								:id="`block-edits-panel-${day.key}-${subject.key}-block-${blockNumber}-complete-control`"
								:key="blockNumber"
								class="block-edits-block-complete-control"
								:class="{
									'block-edits-block-complete-control--complete':
										blockEditsIsComplete(day.label, subject.key, blockNumber),
								}"
								type="button"
								:name="`block-edits-panel-${day.key}-${subject.key}-block-${blockNumber}-complete-control`"
								:data-button-name="`block-edits-panel-${day.key}-${subject.key}-block-${blockNumber}-complete-control`"
								:aria-label="`Block Edits toggle ${subject.label} Block ${blockNumber} for ${day.label}`"
								:aria-pressed="blockEditsIsComplete(day.label, subject.key, blockNumber)"
								@click="handleBlockEditsCompleteToggle(day.label, subject.key, blockNumber)"
							>
								Block {{ blockNumber }}
							</button>
						</div>
					</section>
				</div>
			</section>
		</section>
	</main>
</template>
