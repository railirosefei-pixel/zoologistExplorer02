/** Calendar view state, month navigation, theme sync, and day-cell timing pipeline. */
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import minecraftExplosion from "../../assets/animations/minecraftExplosion.gif";
import homePageBackground from "../../assets/images/backgrounds/vetClinicNight.webp";
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
const explodedDayCellKey = ref(null);
const lastClickedDayCellKey = ref(null);
const hiddenDayCellKeys = ref([]);
const replacementVisibleDayCellKeys = ref([]);
const isExplosionVisible = ref(false);
const isExplosionTextureHidden = ref(false);
const isDayCellReady = ref(false);
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
	if (explodedDayCellKey.value && !isExplosionTextureHidden.value) {
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
	isDayCellReady.value = false;
	isExplosionVisible.value = true;
	isExplosionTextureHidden.value = false;
	const nextReplacementColorIndex =
		(explosionInstance.value + currentMonthIndex.value + 1) % pastelReplacementClasses.length;
	replacementColorClassesByDayCellKey.value = {
		...replacementColorClassesByDayCellKey.value,
		[cellKey]: pastelReplacementClasses[nextReplacementColorIndex],
	};
	explosionInstance.value += 1;
	explosionTextureTimeoutId = window.setTimeout(() => {
		isExplosionTextureHidden.value = true;
		replacementVisibleDayCellKeys.value = [
			...new Set([...replacementVisibleDayCellKeys.value, cellKey]),
		];
		explosionTextureTimeoutId = undefined;
	}, explosionTextureHideDelayMs);
	explosionTimeoutId = window.setTimeout(() => {
		isExplosionVisible.value = false;
		isDayCellReady.value = true;
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
	isExplosionVisible.value = false;
	isExplosionTextureHidden.value = false;
	isDayCellReady.value = false;
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
			(isExplosionTextureHidden.value || isDayCellReady.value))
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
				:is-explosion-texture-hidden="isExplosionTextureHidden"
				:is-explosion-visible="isExplosionVisible"
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
			<div class="daily-menu-content">
				<h2 id="daily-menu-heading" class="daily-menu-heading">Daily Menu</h2>
				<p class="daily-menu-date">{{ selectedDailyMenuDateLabel }}</p>
			</div>
		</section>
	</div>
</template>
