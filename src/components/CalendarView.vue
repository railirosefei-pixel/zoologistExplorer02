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
const isSeptemberMonth = computed(() => currentMonth.value.monthName === "September");
const explodedDayCellKey = ref(null);
const isExplosionVisible = ref(false);
const isExplosionTextureHidden = ref(false);
const pastelReplacementClasses = [
	"calendar-day-replacement--pink",
	"calendar-day-replacement--blue",
	"calendar-day-replacement--yellow",
	"calendar-day-replacement--green",
];
const replacementColorClass = ref(pastelReplacementClasses[0]);
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
		isSeptemberMonth.value ? `url("${septemberDayTexture}")` : "none",
	);
}

watch([currentMonth, isSeptemberMonth], syncVisualTheme, { immediate: true });
onMounted(syncVisualTheme);

function goToPreviousMonth() {
	clearDayCellExplosion();
	currentMonthIndex.value =
		(currentMonthIndex.value - 1 + calendarMonths.length) % calendarMonths.length;
}

function goToNextMonth() {
	clearDayCellExplosion();
	currentMonthIndex.value = (currentMonthIndex.value + 1) % calendarMonths.length;
}

function triggerDayCellExplosion(cellIndex) {
	const cell = currentMonth.value.cells[cellIndex];
	if (!isSeptemberMonth.value || !cell?.isCurrentMonth) {
		return;
	}
	const cellKey = `${currentMonth.value.id}-${cellIndex}`;
	if (isExplosionTextureHidden.value && explodedDayCellKey.value === cellKey) {
		return;
	}

	if (explosionTimeoutId) {
		window.clearTimeout(explosionTimeoutId);
	}
	if (explosionTextureTimeoutId) {
		window.clearTimeout(explosionTextureTimeoutId);
	}

	explodedDayCellKey.value = cellKey;
	isExplosionVisible.value = true;
	isExplosionTextureHidden.value = false;
	const nextReplacementColorIndex =
		(explosionInstance.value + currentMonthIndex.value + 1) % pastelReplacementClasses.length;
	replacementColorClass.value = pastelReplacementClasses[nextReplacementColorIndex];
	explosionInstance.value += 1;
	explosionTextureTimeoutId = window.setTimeout(() => {
		isExplosionTextureHidden.value = true;
		explosionTextureTimeoutId = undefined;
	}, explosionTextureHideDelayMs);
	explosionTimeoutId = window.setTimeout(() => {
		isExplosionVisible.value = false;
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
	isExplosionVisible.value = false;
	isExplosionTextureHidden.value = false;
}

function handleDayCellClick(cell) {
	triggerDayCellExplosion(currentMonth.value.cells.indexOf(cell));
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
					@click="goToPreviousMonth"
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
					@click="goToNextMonth"
				>
					Forward
				</button>
			</div>
		</header>
		<div class="calendar-month-grid calendar-month-grid--single">
			<CalendarMonthCard
				:current-month="currentMonth"
				:weekdays="weekdays"
				:is-september-month="isSeptemberMonth"
				:is-explosion-texture-hidden="isExplosionTextureHidden"
				:is-explosion-visible="isExplosionVisible"
				:exploded-day-cell-key="explodedDayCellKey"
				:replacement-color-class="replacementColorClass"
				:explosion-instance="explosionInstance"
				:explosion-image="minecraftExplosion"
				@day-cell-click="handleDayCellClick"
			/>
		</div>
	</div>
</template>
