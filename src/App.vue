/**
 * Student content shell for the home and calendar views.
 * The calendar layout stores month data in a generated 42-cell grid and
 * provides lightweight controls for moving between months and day-cell effects.
 */
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import minecraftExplosion from "../assets/animations/minecraftExplosion.gif";
import homePageBackground from "../assets/images/backgrounds/vetClinicNight.webp";
import calendarPanelBackground from "../assets/textures/minecraftDirt01.webp";
import septemberDayTexture from "../assets/textures/minecraftTNT.webp";

const isStudentMenuOpen = ref(false);
const activeStudentTab = ref("calendar");
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

	return {
		id: `${monthName}-${year}`,
		monthName,
		year,
		cells,
	};
});
const currentMonthIndex = ref(0);
const currentMonth = computed(() => calendarMonths[currentMonthIndex.value]);
const isSeptemberMonth = computed(() => currentMonth.value.monthName === "September");
const explodedDayCellIndex = ref(null);
const isExplosionTextureHidden = ref(false);
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

/** Controls the home-to-student menu transition. */
function openStudentMenu() {
	isStudentMenuOpen.value = true;
	activeStudentTab.value = "calendar";
	playStudentButtonSound();
}

function closeStudentMenu() {
	isStudentMenuOpen.value = false;
	activeStudentTab.value = "calendar";
}

function openCalendarTab() {
	activeStudentTab.value = "calendar";
}

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
	if (explosionTimeoutId) {
		window.clearTimeout(explosionTimeoutId);
	}
	if (explosionTextureTimeoutId) {
		window.clearTimeout(explosionTextureTimeoutId);
	}

	explodedDayCellIndex.value = cellIndex;
	isExplosionTextureHidden.value = false;
	explosionInstance.value += 1;
	explosionTextureTimeoutId = window.setTimeout(() => {
		isExplosionTextureHidden.value = true;
		explosionTextureTimeoutId = undefined;
	}, explosionTextureHideDelayMs);
	explosionTimeoutId = window.setTimeout(clearDayCellExplosion, explosionDurationMs);
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

	explodedDayCellIndex.value = null;
	isExplosionTextureHidden.value = false;
}

onBeforeUnmount(clearDayCellExplosion);

function playStudentButtonSound() {
	const audioContext = new AudioContext();
	const now = audioContext.currentTime;
	const bellPartials = [
		{ frequency: 880, duration: 0.9, volume: 0.16 },
		{ frequency: 1320, duration: 0.65, volume: 0.1 },
	];
	let endedPartials = 0;

	for (const partial of bellPartials) {
		const gain = audioContext.createGain();
		const oscillator = audioContext.createOscillator();

		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(partial.frequency, now);
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(partial.volume, now + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + partial.duration);
		oscillator.connect(gain);
		gain.connect(audioContext.destination);
		oscillator.start(now);
		oscillator.stop(now + partial.duration);
		oscillator.addEventListener("ended", () => {
			endedPartials += 1;
			if (endedPartials === bellPartials.length) {
				audioContext.close();
			}
		});
	}
}
</script>

<template>
	<main
		v-if="!isStudentMenuOpen"
		id="home-page-shell"
		class="home-page-shell"
		role="main"
		aria-label="Student home page"
		title="Student home page"
		data-page-name="home-page-shell"
	>
		<section
			id="home-page-container"
			class="home-page-container"
			role="region"
			aria-label="Student home page container"
			title="Student home page container"
			data-container-name="home-page-container"
		>
			<button
				id="student-button"
				class="student-button"
				type="button"
				name="student-button"
				data-button-name="student-button"
				aria-label="Open student section"
				title="Open student section"
				@click="openStudentMenu"
			>
				Student
			</button>
		</section>
	</main>

	<main
		v-else
		id="student-menu-page"
		class="student-menu-page"
		role="main"
		aria-label="Student menu"
		title="Student menu"
		data-page-name="student-menu-page"
	>
		<nav
			id="student-menu-navigation"
			class="student-menu-navigation"
			role="navigation"
			aria-label="Student menu navigation"
			title="Student menu navigation"
			data-container-name="student-menu-navigation"
		>
			<button
				id="calendar-tab"
				class="student-menu-calendar-tab"
				type="button"
				name="calendar-tab"
				data-button-name="calendar-tab"
				aria-label="Open Calendar tab"
				title="Open Calendar tab"
				@click="openCalendarTab"
			>
				Calendar
			</button>
			<button
				id="student-menu-back-button"
				class="student-menu-back-button"
				type="button"
				name="student-menu-back-button"
				data-button-name="student-menu-back-button"
				aria-label="Back to home page"
				title="Back to home page"
				@click="closeStudentMenu"
			>
				Back
			</button>
		</nav>

		<section
			id="student-menu-content"
			class="student-menu-content"
			role="region"
			aria-label="Student menu content"
			title="Student menu content"
			data-container-name="student-menu-content"
		>
			<div
				v-if="activeStudentTab === 'calendar'"
				id="calendar-panel"
				class="calendar-panel"
				role="region"
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
					<article
						id="calendar-month-card"
						class="calendar-month-card calendar-month-card--single"
						role="article"
						aria-label="Current month calendar card"
						title="Current month calendar card"
					>
						<header
							id="calendar-month-header"
							class="calendar-month-header"
							aria-label="Current month header"
							title="Current month header"
						>
							<h2>{{ currentMonth.monthName }} {{ currentMonth.year }}</h2>
						</header>
						<div class="calendar-weekday-row" aria-hidden="true">
							<span v-for="day in weekdays" :key="`${currentMonth.id}-${day}`">{{ day }}</span>
						</div>
						<div class="calendar-day-grid">
							<span
								v-for="cell in currentMonth.cells"
								:key="`${currentMonth.id}-${cell.value || 'empty'}-${cell.isCurrentMonth}-${currentMonth.cells.indexOf(cell)}`"
								class="calendar-day-cell"
								role="button"
								tabindex="0"
								:class="{
									'calendar-day-cell--empty': !cell.isCurrentMonth,
									'calendar-day-cell--september':
										cell.isCurrentMonth && isSeptemberMonth,
									'calendar-day-cell--exploding':
										isExplosionTextureHidden &&
										explodedDayCellIndex === currentMonth.cells.indexOf(cell),
								}"
								@click="triggerDayCellExplosion(currentMonth.cells.indexOf(cell))"
								@keydown.enter="triggerDayCellExplosion(currentMonth.cells.indexOf(cell))"
								@keydown.space.prevent="triggerDayCellExplosion(currentMonth.cells.indexOf(cell))"
							>
								<span class="calendar-day-cell-number">{{ cell.value || "" }}</span>
								<img
									v-if="explodedDayCellIndex === currentMonth.cells.indexOf(cell)"
									:key="`${currentMonth.id}-${explosionInstance}`"
									class="calendar-day-cell-explosion"
									:src="minecraftExplosion"
									alt=""
									aria-hidden="true"
								/>
							</span>
						</div>
					</article>
				</div>
			</div>
		</section>
	</main>
</template>