<script setup>
/**
 * Parent > Student Edits screen. Hosts the Curriculum Game and Block Edits
 * sidebar controls plus a weekly Monday-through-Friday Block Edits set that
 * mirrors the Student daily-menu block completion behavior for each day.
 */
import { computed, nextTick, ref, watch } from "vue";
import { blockCompletionStore } from "../js/blockCompletionState.js";
import { blockDescriptionStore } from "../js/blockDescriptionState.js";

const emit = defineEmits(["open-curriculum-game", "back-to-parent-menu", "go-home"]);
const isBlockEditsOpen = ref(false);
const isBlocksMenuOpen = ref(false);
const isDescriptionEditsOpen = ref(false);
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
const descriptionEditsSelectedMonth = ref(null);
const descriptionEditsSelectedDay = ref(null);
const descriptionEditsSelectedYear = ref(null);
const descriptionEditsSelectedSubject = ref(null);
const descriptionEditsSelectedBlock = ref(null);
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
const isDescriptionEditsDateOpen = ref(false);
const isDescriptionEditsMonthOpen = ref(false);
const isDescriptionEditsDayOpen = ref(false);
const isDescriptionEditsYearOpen = ref(false);
const isDescriptionEditsSubjectOpen = ref(false);
const isDescriptionEditsBlockOpen = ref(false);
const isDescriptionEditsHistoryOpen = ref(false);

/** Block subjects shown per day, mirroring the Student daily-menu blocks. */
const blockEditsSubjects = [
	{ key: "math", label: "Math" },
	{ key: "language-arts", label: "Language Arts" },
	{ key: "social-studies", label: "Social Studies" },
	{ key: "science", label: "Science" },
	{ key: "art", label: "Art" },
];

const blockEditsBlocksPerSubject = [1, 2, 3];

/** Months on the current calendar, September 2026 through December 2027. */
const descriptionEditsMonths = Array.from(
	{ length: 16 },
	(_, index) => new Date(2026, 8 + index, 1),
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
	isDescriptionEditsDateOpen.value = !isDescriptionEditsDateOpen.value;
}

/** Toggle the Description Edits Month options list. */
function handleDescriptionEditsMonthToggle() {
	isDescriptionEditsMonthOpen.value = !isDescriptionEditsMonthOpen.value;
}

/** Toggle the Description Edits Day options list. */
function handleDescriptionEditsDayToggle() {
	isDescriptionEditsDayOpen.value = !isDescriptionEditsDayOpen.value;
}

/** Toggle the Description Edits Year options list. */
function handleDescriptionEditsYearToggle() {
	isDescriptionEditsYearOpen.value = !isDescriptionEditsYearOpen.value;
}

/** Toggle the Description Edits Subject options list. */
function handleDescriptionEditsSubjectToggle() {
	isDescriptionEditsSubjectOpen.value = !isDescriptionEditsSubjectOpen.value;
}

/** Toggle the Description Edits Block options list. */
function handleDescriptionEditsBlockToggle() {
	isDescriptionEditsBlockOpen.value = !isDescriptionEditsBlockOpen.value;
}

/** Toggle the Description Edits History options list. */
function handleDescriptionEditsHistoryToggle() {
	isDescriptionEditsHistoryOpen.value = !isDescriptionEditsHistoryOpen.value;
}

function getDescriptionEditsHistory() {
	return descriptionEditsMode.value === "play-by-play"
		? blockDescriptionStore.getHistory("play-by-play")
		: blockDescriptionStore.getHistory();
}

/** Select a Description Edits month and clamp an out-of-range day. */
function handleDescriptionEditsMonthSelect(month) {
	descriptionEditsSelectedMonth.value = month;
	isDescriptionEditsMonthOpen.value = false;
	clampDescriptionEditsDay();
}

/** Select a Description Edits day. */
function handleDescriptionEditsDaySelect(day) {
	descriptionEditsSelectedDay.value = day;
	isDescriptionEditsDayOpen.value = false;
}

/** Select a Description Edits year and clamp an out-of-range day. */
function handleDescriptionEditsYearSelect(year) {
	descriptionEditsSelectedYear.value = year;
	isDescriptionEditsYearOpen.value = false;
	clampDescriptionEditsDay();
}

/** Select a Description Edits subject. */
function handleDescriptionEditsSubjectSelect(subject) {
	descriptionEditsSelectedSubject.value = subject;
	isDescriptionEditsSubjectOpen.value = false;
}

/** Select a Description Edits block option. */
function handleDescriptionEditsBlockSelect(block) {
	descriptionEditsSelectedBlock.value = block;
	isDescriptionEditsBlockOpen.value = false;
}

/** Load a Description Edits history entry into the text box. */
function handleDescriptionEditsHistorySelect(entry) {
	if (descriptionEditsMode.value === "play-by-play") {
		playByPlayEditsLoadedFields.value = [];
		playByPlayEditsLoadedSelectionKey.value = null;
		descriptionEditsPlayByPlayDraft.value = entry.text;
	} else {
		descriptionEditsLoadedFields.value = [];
		descriptionEditsLoadedSelectionKey.value = null;
		descriptionEditsDraft.value = entry.text;
	}
	isDescriptionEditsHistoryOpen.value = false;
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

/** Remove saved descriptions for the selected date, subject, and block(s). */
function handleDescriptionEditsRemove() {
	if (
		!descriptionEditsSelectedMonth.value ||
		!descriptionEditsSelectedDay.value ||
		!descriptionEditsSelectedYear.value ||
		!descriptionEditsSelectedSubject.value ||
		descriptionEditsSelectedBlock.value === null ||
		!descriptionEditsMode.value
	) {
		return;
	}
	const dateKey = `${descriptionEditsSelectedYear.value}-${String(
		descriptionEditsSelectedMonth.value.getMonth() + 1,
	).padStart(2, "0")}-${String(descriptionEditsSelectedDay.value).padStart(2, "0")}`;
	const blocks =
		descriptionEditsSelectedBlock.value === "all"
			? [1, 2, 3]
			: [descriptionEditsSelectedBlock.value];
	const removeDetails = {
		dateKey,
		subjectKey: descriptionEditsSelectedSubject.value.key,
		blocks,
	};
	if (descriptionEditsMode.value === "play-by-play") {
		blockDescriptionStore.removePlayByPlay(removeDetails);
	} else {
		blockDescriptionStore.removeDescriptions(removeDetails);
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
			role="complementary"
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
					id="student-edits-screen-home-button"
					class="student-edits-screen-home-button"
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
					id="student-edits-screen-back-button"
					class="student-edits-screen-back-button"
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
			role="complementary"
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
				type="button"
				name="block-edits-button"
				data-button-name="block-edits-button"
				aria-label="Open Block Edits"
				title="Open Block Edits"
				@click="handleBlockEditsToggle"
			>
				Block Edits
			</button>
			<div class="blocks-menu-sidebar-actions student-edits-sidebar-actions">
				<button
					id="blocks-screen-home-button"
					class="blocks-screen-home-button"
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
					class="blocks-screen-back-button"
					type="button"
					name="blocks-screen-back-button"
					data-button-name="blocks-screen-back-button"
					aria-label="Back to parent"
					title="Back to parent"
					@click="handleStudentEditsScreenClose"
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
				:class="{ 'description-edits-panel-container--date-open': isDescriptionEditsDateOpen && descriptionEditsMode }"
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
					v-if="isDescriptionEditsDateOpen && descriptionEditsMode"
					id="description-edits-date-subrow"
					class="description-edits-date-subrow"
				>
					<div
						id="description-edits-month-dropdown-wrapper"
						class="description-edits-month-dropdown-wrapper"
					>
						<button
							id="description-edits-month-dropdown-button"
							class="description-edits-month-dropdown-button"
							type="button"
							name="description-edits-month-dropdown-button"
							data-button-name="description-edits-month-dropdown-button"
							title="Toggle Month options"
							:aria-expanded="isDescriptionEditsMonthOpen"
							@click="handleDescriptionEditsMonthToggle"
						>
							{{
								descriptionEditsSelectedMonth
									? monthNames[descriptionEditsSelectedMonth.getMonth()]
									: "Month"
							}}
						</button>
						<fieldset
							v-if="isDescriptionEditsMonthOpen"
							id="description-edits-month-options-list"
							class="description-edits-month-options-list"
							aria-label="Month options"
							title="Month options"
						>
							<button
								v-for="month in descriptionEditsMonths"
								:id="`description-edits-month-option-${month.getFullYear()}-${month.getMonth()}`"
								:key="`${month.getFullYear()}-${month.getMonth()}`"
								class="description-edits-month-option-button"
								type="button"
								:name="`description-edits-month-option-${month.getFullYear()}-${month.getMonth()}`"
								:data-button-name="`description-edits-month-option-${month.getFullYear()}-${month.getMonth()}`"
								:aria-label="`Select month ${monthNames[month.getMonth()]} ${month.getFullYear()}`"
								:title="`Select month ${monthNames[month.getMonth()]} ${month.getFullYear()}`"
								@click="handleDescriptionEditsMonthSelect(month)"
							>
								{{ monthNames[month.getMonth()] }}
							</button>
						</fieldset>
					</div>
					<div
						id="description-edits-day-dropdown-wrapper"
						class="description-edits-day-dropdown-wrapper"
					>
						<button
							id="description-edits-day-dropdown-button"
							class="description-edits-day-dropdown-button"
							type="button"
							name="description-edits-day-dropdown-button"
							data-button-name="description-edits-day-dropdown-button"
							title="Toggle Day options"
							:aria-expanded="isDescriptionEditsDayOpen"
							@click="handleDescriptionEditsDayToggle"
						>
							{{ descriptionEditsSelectedDay ?? "Day" }}
						</button>
						<fieldset
							v-if="isDescriptionEditsDayOpen"
							id="description-edits-day-options-list"
							class="description-edits-day-options-list"
							aria-label="Day options"
						>
							<button
								v-for="day in descriptionEditsDays"
								:id="`description-edits-day-option-${day}`"
								:key="day"
								class="description-edits-day-option-button"
								type="button"
								:name="`description-edits-day-option-${day}`"
								:data-button-name="`description-edits-day-option-${day}`"
								:aria-label="`Select day ${day}`"
								:title="`Select day ${day}`"
								@click="handleDescriptionEditsDaySelect(day)"
							>
								{{ day }}
							</button>
						</fieldset>
					</div>
					<div
						id="description-edits-year-dropdown-wrapper"
						class="description-edits-year-dropdown-wrapper"
					>
						<button
							id="description-edits-year-dropdown-button"
							class="description-edits-year-dropdown-button"
							type="button"
							name="description-edits-year-dropdown-button"
							data-button-name="description-edits-year-dropdown-button"
							title="Toggle Year options"
							:aria-expanded="isDescriptionEditsYearOpen"
							@click="handleDescriptionEditsYearToggle"
						>
							{{ descriptionEditsSelectedYear ?? "Year" }}
						</button>
						<fieldset
							v-if="isDescriptionEditsYearOpen"
							id="description-edits-year-options-list"
							class="description-edits-year-options-list"
							aria-label="Year options"
						>
							<button
								v-for="year in descriptionEditsYears"
								:id="`description-edits-year-option-${year}`"
								:key="year"
								class="description-edits-year-option-button"
								type="button"
								:name="`description-edits-year-option-${year}`"
								:data-button-name="`description-edits-year-option-${year}`"
								:aria-label="`Select year ${year}`"
								:title="`Select year ${year}`"
								@click="handleDescriptionEditsYearSelect(year)"
							>
								{{ year }}
							</button>
						</fieldset>
					</div>
				</div>
				<div id="description-edits-controls-row" class="description-edits-controls-row">
					<div
						v-if="descriptionEditsMode === 'description' && isDescriptionEditsSelectionSummaryVisible"
						id="description-edits-selection-summary"
						class="description-edits-selection-summary"
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
						class="description-edits-load-button cursor-pointer border-2 border-[#7a5612]/50 bg-[#fff7b8] text-[#513d12] shadow-[0_4px_0_#7a5612] enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#d1d5db] disabled:text-[#6b7280] disabled:shadow-none"
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
						class="play-by-play-edits-load-button cursor-pointer border-2 border-[#7a5612]/50 bg-[#fff7b8] text-[#513d12] shadow-[0_4px_0_#7a5612] enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#d1d5db] disabled:text-[#6b7280] disabled:shadow-none"
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
						@click="handleDescriptionEditsDateToggle"
					>
						Date
					</button>
					<div
						v-if="descriptionEditsMode"
						id="description-edits-subject-dropdown-wrapper"
						class="description-edits-subject-dropdown-wrapper"
					>
						<button
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-subject-dropdown-button"
							class="description-edits-subject-dropdown-button"
							type="button"
							name="description-edits-subject-dropdown-button"
							data-button-name="description-edits-subject-dropdown-button"
							title="Toggle Subject options"
							:aria-expanded="isDescriptionEditsSubjectOpen"
							@click="handleDescriptionEditsSubjectToggle"
						>
							Subject
						</button>
						<button
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-subject-dropdown-button"
							class="play-by-play-edits-subject-dropdown-button"
							type="button"
							name="play-by-play-edits-subject-dropdown-button"
							data-button-name="play-by-play-edits-subject-dropdown-button"
							title="Toggle Play by Play Subject options"
							:aria-expanded="isDescriptionEditsSubjectOpen"
							@click="handleDescriptionEditsSubjectToggle"
						>
							Subject
						</button>
						<fieldset
							v-if="isDescriptionEditsSubjectOpen"
							id="description-edits-subject-options-list"
							class="description-edits-subject-options-list"
							aria-label="Subject options"
							title="Subject options"
						>
							<button
								v-for="subject in descriptionEditsSubjects"
								:id="`description-edits-subject-option-${subject.key}`"
								:key="subject.key"
								class="description-edits-subject-option-button"
								type="button"
								:name="`description-edits-subject-option-${subject.key}`"
								:data-button-name="`description-edits-subject-option-${subject.key}`"
								:aria-label="`Select subject ${subject.label}`"
								:title="`Select subject ${subject.label}`"
								@click="handleDescriptionEditsSubjectSelect(subject)"
							>
								{{ subject.label }}
							</button>
						</fieldset>
					</div>
					<div
						v-if="descriptionEditsMode"
						id="description-edits-block-dropdown-wrapper"
						class="description-edits-block-dropdown-wrapper"
					>
						<button
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-block-dropdown-button"
							class="description-edits-block-dropdown-button"
							type="button"
							name="description-edits-block-dropdown-button"
							data-button-name="description-edits-block-dropdown-button"
							title="Toggle Block options"
							:aria-expanded="isDescriptionEditsBlockOpen"
							@click="handleDescriptionEditsBlockToggle"
						>
							Block
						</button>
						<button
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-block-dropdown-button"
							class="play-by-play-edits-block-dropdown-button"
							type="button"
							name="play-by-play-edits-block-dropdown-button"
							data-button-name="play-by-play-edits-block-dropdown-button"
							title="Toggle Play by Play Block options"
							:aria-expanded="isDescriptionEditsBlockOpen"
							@click="handleDescriptionEditsBlockToggle"
						>
							Block
						</button>
						<fieldset
							v-if="isDescriptionEditsBlockOpen"
							id="description-edits-block-options-list"
							class="description-edits-block-options-list"
							aria-label="Block options"
							title="Block options"
						>
							<button
								v-for="blockOption in descriptionEditsBlocks"
								:id="`description-edits-block-option-${blockOption}`"
								:key="blockOption"
								class="description-edits-block-option-button"
								type="button"
								:name="`description-edits-block-option-${blockOption}`"
								:data-button-name="`description-edits-block-option-${blockOption}`"
								:aria-label="`Select ${blockOption === 'all' ? 'All Blocks' : `Block ${blockOption}`}`"
								:title="`Select ${blockOption === 'all' ? 'All Blocks' : `Block ${blockOption}`}`"
								@click="handleDescriptionEditsBlockSelect(blockOption)"
							>
								{{ blockOption === "all" ? "All Blocks" : `Block ${blockOption}` }}
							</button>
						</fieldset>
					</div>
					<div
						v-if="descriptionEditsMode"
						id="description-edits-history-dropdown-wrapper"
						class="description-edits-history-dropdown-wrapper"
					>
						<button
							v-if="descriptionEditsMode === 'description'"
							id="description-edits-history-dropdown-button"
							class="description-edits-history-dropdown-button"
							type="button"
							name="description-edits-history-dropdown-button"
							data-button-name="description-edits-history-dropdown-button"
							aria-label="Toggle History options"
							title="Toggle History options"
							:aria-expanded="isDescriptionEditsHistoryOpen"
							@click="handleDescriptionEditsHistoryToggle"
						>
							History
						</button>
						<button
							v-else-if="descriptionEditsMode === 'play-by-play'"
							id="play-by-play-edits-history-dropdown-button"
							class="play-by-play-edits-history-dropdown-button"
							type="button"
							name="play-by-play-edits-history-dropdown-button"
							data-button-name="play-by-play-edits-history-dropdown-button"
							aria-label="Toggle Play by Play History options"
							title="Toggle Play by Play History options"
							:aria-expanded="isDescriptionEditsHistoryOpen"
							@click="handleDescriptionEditsHistoryToggle"
						>
							History
						</button>
						<fieldset
							v-if="isDescriptionEditsHistoryOpen"
							id="description-edits-history-options-list"
							class="description-edits-history-options-list"
							:aria-label="descriptionEditsMode === 'play-by-play' ? 'Play by Play history options' : 'Description history options'"
							:title="descriptionEditsMode === 'play-by-play' ? 'Play by Play history options' : 'Description history options'"
						>
							<button
								v-for="entry in getDescriptionEditsHistory()"
								:id="descriptionEditsMode === 'play-by-play' ? `play-by-play-edits-history-option-${entry.savedAtIso}` : `description-edits-history-option-${entry.savedAtIso}`"
								:key="entry.savedAtIso"
								:class="descriptionEditsMode === 'play-by-play' ? 'play-by-play-edits-history-option-button' : 'description-edits-history-option-button'"
								type="button"
								:name="descriptionEditsMode === 'play-by-play' ? `play-by-play-edits-history-option-${entry.savedAtIso}` : `description-edits-history-option-${entry.savedAtIso}`"
								:data-button-name="descriptionEditsMode === 'play-by-play' ? `play-by-play-edits-history-option-${entry.savedAtIso}` : `description-edits-history-option-${entry.savedAtIso}`"
								:aria-label="`Load ${descriptionEditsMode === 'play-by-play' ? 'Play by Play' : 'description'} ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`"
								:title="`Load ${descriptionEditsMode === 'play-by-play' ? 'Play by Play' : 'description'} ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`"
								@click="handleDescriptionEditsHistorySelect(entry)"
							>
								{{ entry.subjectAbbrev }} {{ entry.savedAtLabel }}
							</button>
							<p
								v-if="getDescriptionEditsHistory().length === 0"
								id="description-edits-history-empty"
								class="description-edits-history-empty"
							>
								&lt; none &gt;
							</p>
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
						@click="handleDescriptionEditsRemove"
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
		<div
			v-if="isBlockEditsOpen"
			class="block-edits-week-panel-container"
			role="region"
			aria-label="Block Edits week"
			title="Block Edits week"
		>
			<section
				v-for="day in blockEditsWeekDays"
				:id="`block-edits-panel-${day.key}`"
				:key="day.key"
				class="block-edits-panel"
				role="region"
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
						role="region"
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
		</div>
	</main>
</template>
