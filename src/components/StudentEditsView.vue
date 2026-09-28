<script setup>
/**
 * Parent > Student Edits screen. Hosts the Curriculum Game and Block Edits
 * sidebar controls plus a weekly Monday-through-Friday Block Edits set that
 * mirrors the Student daily-menu block completion behavior for each day.
 */
import { computed, ref } from "vue";
import { blockCompletionStore } from "../js/blockCompletionState.js";
import { blockDescriptionStore } from "../js/blockDescriptionState.js";

const emit = defineEmits(["open-curriculum-game", "back-to-parent", "go-home"]);
const isBlockEditsOpen = ref(false);
const isBlocksMenuOpen = ref(false);
const isDescriptionEditsOpen = ref(false);
const descriptionEditsDraft = ref("");
const descriptionEditsSelectedMonth = ref(null);
const descriptionEditsSelectedDay = ref(null);
const descriptionEditsSelectedYear = ref(null);
const descriptionEditsSelectedSubject = ref(null);
const descriptionEditsSelectedBlock = ref(null);
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
const descriptionEditsMonths = Array.from({ length: 16 }, (_, index) => new Date(2026, 8 + index, 1));

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
	if (descriptionEditsSelectedDay.value && descriptionEditsSelectedDay.value > descriptionEditsDayCount.value) {
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
	descriptionEditsDraft.value = entry.text;
	isDescriptionEditsHistoryOpen.value = false;
}

/** Commit the Description Edits draft to the chosen date, subject, and block(s). */
function handleDescriptionEditsCommit() {
	if (
		!descriptionEditsSelectedMonth.value ||
		!descriptionEditsSelectedDay.value ||
		!descriptionEditsSelectedYear.value ||
		!descriptionEditsSelectedSubject.value ||
		descriptionEditsSelectedBlock.value === null
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
	blockDescriptionStore.commitDescription({
		dateKey,
		subjectKey: descriptionEditsSelectedSubject.value.key,
		blocks,
		text: descriptionEditsDraft.value,
	});
}

/** Remove saved descriptions for the selected date, subject, and block(s). */
function handleDescriptionEditsRemove() {
	if (
		!descriptionEditsSelectedMonth.value ||
		!descriptionEditsSelectedDay.value ||
		!descriptionEditsSelectedYear.value ||
		!descriptionEditsSelectedSubject.value ||
		descriptionEditsSelectedBlock.value === null
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
	blockDescriptionStore.removeDescriptions({
		dateKey,
		subjectKey: descriptionEditsSelectedSubject.value.key,
		blocks,
	});
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
	emit("back-to-parent");
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
					class="blocks-screen-home-button student-edits-screen-home-button"
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
					class="blocks-screen-back-button student-edits-screen-back-button"
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
			>
				<textarea
					id="description-edits-text-box"
					v-model="descriptionEditsDraft"
					class="description-edits-text-box"
					aria-label="Description text box"
					name="description-edits-text-box"
				/>
				<div
					id="description-edits-controls-row"
					class="description-edits-controls-row"
				>
					<button
						id="description-edits-commit-button"
						class="description-edits-commit-button"
						type="button"
						name="description-edits-commit-button"
						data-button-name="description-edits-commit-button"
						aria-label="Commit description"
						title="Commit description"
						@click="handleDescriptionEditsCommit"
					>
						Commit
					</button>
					<button
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
					<div
						id="description-edits-subject-dropdown-wrapper"
						class="description-edits-subject-dropdown-wrapper"
					>
						<button
							id="description-edits-subject-dropdown-button"
							class="description-edits-subject-dropdown-button"
							type="button"
							name="description-edits-subject-dropdown-button"
							data-button-name="description-edits-subject-dropdown-button"
							aria-label="Toggle Subject options"
							title="Toggle Subject options"
							:aria-expanded="isDescriptionEditsSubjectOpen"
							@click="handleDescriptionEditsSubjectToggle"
						>
							{{ descriptionEditsSelectedSubject ? descriptionEditsSelectedSubject.label : "Subject" }}
						</button>
						<div
							v-if="isDescriptionEditsSubjectOpen"
							id="description-edits-subject-options-list"
							class="description-edits-subject-options-list"
							role="listbox"
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
						</div>
					</div>
					<div
						id="description-edits-block-dropdown-wrapper"
						class="description-edits-block-dropdown-wrapper"
					>
						<button
							id="description-edits-block-dropdown-button"
							class="description-edits-block-dropdown-button"
							type="button"
							name="description-edits-block-dropdown-button"
							data-button-name="description-edits-block-dropdown-button"
							aria-label="Toggle Block options"
							title="Toggle Block options"
							:aria-expanded="isDescriptionEditsBlockOpen"
							@click="handleDescriptionEditsBlockToggle"
						>
							{{
								descriptionEditsSelectedBlock === null
									? "Block"
									: descriptionEditsSelectedBlock === "all"
										? "All Blocks"
										: `Block ${descriptionEditsSelectedBlock}`
							}}
						</button>
						<div
							v-if="isDescriptionEditsBlockOpen"
							id="description-edits-block-options-list"
							class="description-edits-block-options-list"
							role="listbox"
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
						</div>
					</div>
					<div
						id="description-edits-history-dropdown-wrapper"
						class="description-edits-history-dropdown-wrapper"
					>
						<button
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
						<div
							v-if="isDescriptionEditsHistoryOpen"
							id="description-edits-history-options-list"
							class="description-edits-history-options-list"
							role="listbox"
							aria-label="Description history options"
							title="Description history options"
						>
							<button
								v-for="entry in blockDescriptionStore.getHistory()"
								:id="`description-edits-history-option-${entry.savedAtIso}`"
								:key="entry.savedAtIso"
								class="description-edits-history-option-button"
								type="button"
								:name="`description-edits-history-option-${entry.savedAtIso}`"
								:data-button-name="`description-edits-history-option-${entry.savedAtIso}`"
								:aria-label="`Load description ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`"
								:title="`Load description ${entry.subjectAbbrev} saved ${entry.savedAtLabel}`"
								@click="handleDescriptionEditsHistorySelect(entry)"
							>
								{{ entry.subjectAbbrev }} {{ entry.savedAtLabel }}
							</button>
							<p
								v-if="blockDescriptionStore.getHistory().length === 0"
								id="description-edits-history-empty"
								class="description-edits-history-empty"
							>
								&lt; none &gt;
							</p>
						</div>
					</div>
					<button
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
				</div>
				<div
					v-if="isDescriptionEditsDateOpen"
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
							aria-label="Toggle Month options"
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
						<div
							v-if="isDescriptionEditsMonthOpen"
							id="description-edits-month-options-list"
							class="description-edits-month-options-list"
							role="listbox"
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
						</div>
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
							aria-label="Toggle Day options"
							title="Toggle Day options"
							:aria-expanded="isDescriptionEditsDayOpen"
							@click="handleDescriptionEditsDayToggle"
						>
							{{ descriptionEditsSelectedDay ?? "Day" }}
						</button>
						<div
							v-if="isDescriptionEditsDayOpen"
							id="description-edits-day-options-list"
							class="description-edits-day-options-list"
							role="listbox"
							aria-label="Day options"
							title="Day options"
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
						</div>
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
							aria-label="Toggle Year options"
							title="Toggle Year options"
							:aria-expanded="isDescriptionEditsYearOpen"
							@click="handleDescriptionEditsYearToggle"
						>
							{{ descriptionEditsSelectedYear ?? "Year" }}
						</button>
						<div
							v-if="isDescriptionEditsYearOpen"
							id="description-edits-year-options-list"
							class="description-edits-year-options-list"
							role="listbox"
							aria-label="Year options"
							title="Year options"
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
						</div>
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
				:key="day.key"
				:id="`block-edits-panel-${day.key}`"
				class="block-edits-panel"
				role="region"
				:aria-label="`Block Edits ${day.label}`"
				:title="`Block Edits ${day.label}`"
			>
				<h2 class="block-edits-panel-heading">
					Block Edits
				</h2>
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
