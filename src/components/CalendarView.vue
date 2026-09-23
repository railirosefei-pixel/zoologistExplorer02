/** Calendar view state, month navigation, theme sync, and day-cell timing pipeline. */
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import minecraftExplosion from "../../assets/animations/minecraftExplosion.gif";
import artBackground from "../../assets/images/backgrounds/art(Background)01.webp";
import homePageBackground from "../../assets/images/backgrounds/vetClinicNight.webp";
import languageArtsBackground from "../../assets/images/backgrounds/languageArts(Background)01.webp";
import mathBackground from "../../assets/images/backgrounds/math(Background)01.webp";
import scienceBackground from "../../assets/images/backgrounds/science(Background)01.webp";
import socialStudiesBackground from "../../assets/images/backgrounds/socialStudies(Background)01.webp";
import calendarPanelBackground from "../../assets/textures/minecraftDirt01.webp";
import septemberDayTexture from "../../assets/textures/minecraftTNT.webp";
import CalendarMonthCard from "./CalendarMonthCard.vue";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const calendarMonths = Array.from({ length: 16 }, (_, index) => {
	const monthDate = new Date(2026, 8 + index, 1);
	const monthName = monthDate.toLocaleString("en-US", { month: "long" });
	const year = monthDate.getFullYear();
	const firstDay = new Date(year, monthDate.getMonth(), 1);
	const totalDays = new Date(year, monthDate.getMonth() + 1, 0).getDate();
	const leadingCells = (firstDay.getDay() + 6) % 7;
	const totalCells = 42;
	const cells = [];

	for (let dayIndex = 0; dayIndex < totalCells; dayIndex += 1) {
		const dayNumber = dayIndex - leadingCells + 1;
		cells.push(
			dayNumber >= 1 && dayNumber <= totalDays
				? { value: dayNumber, isCurrentMonth: true }
				: { value: "", isCurrentMonth: false },
		);
	}

	return { id: `${monthName}-${year}`, monthName, year, cells };
});
const currentMonthIndex = ref(0);
const currentMonth = computed(() => calendarMonths[currentMonthIndex.value]);
const isDailyMenuOpen = ref(false);
const selectedDailyMenuDateLabel = ref("");
const selectedDailyMenuSubject = ref(null);
const explodedDayCellKey = ref(null);
const lastClickedDayCellKey = ref(null);
const hiddenDayCellKeys = ref([]);
const replacementVisibleDayCellKeys = ref([]);
const dayCellAnimationState = ref("idle");
const pastelReplacementClasses = [
	"calendar-day-replacement--pink",
	"calendar-day-replacement--blue",
	"calendar-day-replacement--yellow",
	"calendar-day-replacement--green",
];
const replacementColorClassesByDayCellKey = ref({});
const explosionInstance = ref(0);
const explosionDurationMs = 900;
const explosionTextureHideDelayMs = 450;
let explosionTimeoutId;
let explosionTextureTimeoutId;

function syncVisualTheme() {
	document.documentElement.style.setProperty(
		"--home-page-background-image",
		`url("${homePageBackground}")`,
	);
	document.documentElement.style.setProperty(
		"--calendar-panel-background-image",
		`url("${calendarPanelBackground}")`,
	);
	document.documentElement.style.setProperty(
		"--calendar-day-image",
		`url("${septemberDayTexture}")`,
	);
}

watch(currentMonth, syncVisualTheme, { immediate: true });
onMounted(syncVisualTheme);

/** Calendar-month selection pipeline boundary for the previous month. */
function handlePreviousMonthSelection() {
	isDailyMenuOpen.value = false;
	clearDayCellExplosion();
	currentMonthIndex.value =
		(currentMonthIndex.value - 1 + calendarMonths.length) % calendarMonths.length;
}

/** Calendar-month selection pipeline boundary for the next month. */
function handleNextMonthSelection() {
	isDailyMenuOpen.value = false;
	clearDayCellExplosion();
	currentMonthIndex.value = (currentMonthIndex.value + 1) % calendarMonths.length;
}

/** Daily menu close pipeline boundary. */
function handleDailyMenuClose() {
	isDailyMenuOpen.value = false;
	selectedDailyMenuSubject.value = null;
}

function handleDailyMenuSubjectSelection(subject) {
	selectedDailyMenuSubject.value = subject;
}

/** Calendar-day activation pipeline boundary. */
function isCurrentMonthDayCell(cell) {
	return Boolean(cell?.isCurrentMonth && cell?.value !== "");
}

/** Revealed-day navigation pipeline boundary. */
function openDailyMenuForDayCell(cell) {
	selectedDailyMenuDateLabel.value = `${currentMonth.value.monthName} ${cell.value}, ${currentMonth.value.year}`;
	isDailyMenuOpen.value = true;
}

/** Day-cell animation pipeline boundary. */
function handleDayCellAnimation(cellIndex) {
	const cell = currentMonth.value.cells[cellIndex];
	if (!isCurrentMonthDayCell(cell)) {
		return;
	}
	const cellKey = `${currentMonth.value.id}-${cellIndex}`;
	if (explodedDayCellKey.value && dayCellAnimationState.value === "exploding") {
		replacementVisibleDayCellKeys.value = [
			...new Set([...replacementVisibleDayCellKeys.value, explodedDayCellKey.value]),
		];
	}

	if (explosionTimeoutId) {
		window.clearTimeout(explosionTimeoutId);
	}
	if (explosionTextureTimeoutId) {
		window.clearTimeout(explosionTextureTimeoutId);
	}

	hiddenDayCellKeys.value = [...new Set([...hiddenDayCellKeys.value, cellKey])];
	lastClickedDayCellKey.value = cellKey;
	explodedDayCellKey.value = cellKey;
	dayCellAnimationState.value = "exploding";
	const nextReplacementColorIndex =
		(explosionInstance.value + currentMonthIndex.value + 1) % pastelReplacementClasses.length;
	replacementColorClassesByDayCellKey.value = {
		...replacementColorClassesByDayCellKey.value,
		[cellKey]: pastelReplacementClasses[nextReplacementColorIndex],
	};
	explosionInstance.value += 1;
	explosionTextureTimeoutId = window.setTimeout(() => {
		dayCellAnimationState.value = "textureCleared";
		replacementVisibleDayCellKeys.value = [
			...new Set([...replacementVisibleDayCellKeys.value, cellKey]),
		];
		explosionTextureTimeoutId = undefined;
	}, explosionTextureHideDelayMs);
	explosionTimeoutId = window.setTimeout(() => {
		dayCellAnimationState.value = "ready";
		explosionTimeoutId = undefined;
	}, explosionDurationMs);
}

function clearDayCellExplosion() {
	if (explosionTimeoutId) {
		window.clearTimeout(explosionTimeoutId);
		explosionTimeoutId = undefined;
	}
	if (explosionTextureTimeoutId) {
		window.clearTimeout(explosionTextureTimeoutId);
		explosionTextureTimeoutId = undefined;
	}

	explodedDayCellKey.value = null;
	lastClickedDayCellKey.value = null;
	hiddenDayCellKeys.value = [];
	replacementVisibleDayCellKeys.value = [];
	replacementColorClassesByDayCellKey.value = {};
	selectedDailyMenuDateLabel.value = "";
	dayCellAnimationState.value = "idle";
}

function handleDayCellClick(cell) {
	if (!isCurrentMonthDayCell(cell)) {
		return;
	}

	const cellIndex = currentMonth.value.cells.indexOf(cell);
	const cellKey = `${currentMonth.value.id}-${cellIndex}`;

	if (
		replacementVisibleDayCellKeys.value.includes(cellKey) ||
		(explodedDayCellKey.value === cellKey &&
			["textureCleared", "ready"].includes(dayCellAnimationState.value))
	) {
		openDailyMenuForDayCell(cell);
		return;
	}

	handleDayCellAnimation(cellIndex);
}

onBeforeUnmount(clearDayCellExplosion);
</script>

<template>
	<div
		id="calendar-panel"
		class="calendar-panel"
		aria-label="Calendar panel"
		title="Calendar panel"
		aria-live="polite"
	>
		<header
			v-if="!isDailyMenuOpen"
			id="calendar-panel-header"
			class="calendar-panel-header"
			aria-label="Calendar panel header"
			title="Calendar panel header"
		>
			<div class="calendar-header-row">
				<button
					id="calendar-previous-month-button"
					class="calendar-previous-month-button"
					type="button"
					aria-label="Show previous month"
					title="Show previous month"
					@click="handlePreviousMonthSelection"
				>
					Back
				</button>
				<h1 id="calendar-menu-heading" class="student-menu-heading">Calendar</h1>
				<button
					id="calendar-next-month-button"
					class="calendar-next-month-button"
					type="button"
					aria-label="Show next month"
					title="Show next month"
					@click="handleNextMonthSelection"
				>
					Forward
				</button>
			</div>
		</header>
		<div v-if="!isDailyMenuOpen" class="calendar-month-grid calendar-month-grid--single">
			<CalendarMonthCard
				:current-month="currentMonth"
				:weekdays="weekdays"
				:day-cell-animation-state="dayCellAnimationState"
				:exploded-day-cell-key="explodedDayCellKey"
				:last-clicked-day-cell-key="lastClickedDayCellKey"
				:hidden-day-cell-keys="hiddenDayCellKeys"
				:replacement-visible-day-cell-keys="replacementVisibleDayCellKeys"
				:replacement-color-classes-by-day-cell-key="replacementColorClassesByDayCellKey"
				:explosion-instance="explosionInstance"
				:explosion-image="minecraftExplosion"
				@day-cell-click="handleDayCellClick"
			/>
		</div>
		<section
			v-else
			id="daily-menu-panel"
			class="daily-menu-panel"
			role="region"
			aria-label="Daily menu"
			title="Daily menu"
		>
			<div class="daily-menu-content">
				<button
					id="daily-menu-back-button"
					class="daily-menu-back-button"
					type="button"
					aria-label="Back to calendar"
					title="Back to calendar"
					@click="handleDailyMenuClose"
				>
					Back
				</button>
				<p class="daily-menu-date">{{ selectedDailyMenuDateLabel }}</p>
				<nav
					id="daily-menu-subject-navigation"
					class="daily-menu-subject-grid"
					role="navigation"
					aria-label="Daily menu subjects"
					title="Daily menu subjects"
				>
					<button
						id="daily-menu-math-button"
						class="daily-menu-math-button"
						type="button"
						aria-label="Math"
						title="Math"
						@click="handleDailyMenuSubjectSelection('math')"
					>
						<img :src="mathBackground" alt="" />
					</button>
					<button
						id="daily-menu-language-arts-button"
						class="daily-menu-language-arts-button"
						type="button"
						aria-label="Language Arts"
						title="Language Arts"
						@click="handleDailyMenuSubjectSelection('language-arts')"
					>
						<img :src="languageArtsBackground" alt="" />
					</button>
					<button
						id="daily-menu-social-studies-button"
						class="daily-menu-social-studies-button"
						type="button"
						aria-label="Social Studies"
						title="Social Studies"
						@click="handleDailyMenuSubjectSelection('social-studies')"
					>
						<img :src="socialStudiesBackground" alt="" />
					</button>
					<button
						id="daily-menu-science-button"
						class="daily-menu-science-button"
						type="button"
						aria-label="Science"
						title="Science"
						@click="handleDailyMenuSubjectSelection('science')"
					>
						<img :src="scienceBackground" alt="" />
					</button>
					<button
						id="daily-menu-art-button"
						class="daily-menu-art-button"
						type="button"
						aria-label="Art"
						title="Art"
						@click="handleDailyMenuSubjectSelection('art')"
					>
						<img :src="artBackground" alt="" />
					</button>
				</nav>
				<div class="daily-menu-subject-panel-stack">
					<article
						v-if="selectedDailyMenuSubject === 'math'"
						id="daily-menu-math-panel"
						class="daily-menu-subject-panel daily-menu-math-panel"
						aria-label="Math subject panel"
						title="Math subject panel"
					>
						<h2>Math</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'language-arts'"
						id="daily-menu-language-arts-panel"
						class="daily-menu-subject-panel daily-menu-language-arts-panel"
						aria-label="Language Arts subject panel"
						title="Language Arts subject panel"
					>
						<h2>Language Arts</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'social-studies'"
						id="daily-menu-social-studies-panel"
						class="daily-menu-subject-panel daily-menu-social-studies-panel"
						aria-label="Social Studies subject panel"
						title="Social Studies subject panel"
					>
						<h2>Social Studies</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'science'"
						id="daily-menu-science-panel"
						class="daily-menu-subject-panel daily-menu-science-panel"
						aria-label="Science subject panel"
						title="Science subject panel"
					>
						<h2>Science</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'art'"
						id="daily-menu-art-panel"
						class="daily-menu-subject-panel daily-menu-art-panel"
						aria-label="Art subject panel"
						title="Art subject panel"
					>
						<h2>Art</h2>
					</article>
				</div>
			</div>
		</section>
	</div>
</template>
