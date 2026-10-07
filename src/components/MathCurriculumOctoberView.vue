<script setup>
/**
 * Full-screen October 2026 Math curriculum menu with weekday buttons grouped
 * into Monday-through-Friday weeks and independently toggled selections.
 */
import { ref } from "vue";

const emit = defineEmits(["back-to-student-edits", "go-home"]);
const pressedDateDays = ref(new Set());
const october2026WeekdayWeeks = [
	[5, 6, 7, 8, 9],
	[12, 13, 14, 15, 16],
	[19, 20, 21, 22, 23],
	[26, 27, 28, 29, 30],
].map((days, weekIndex) => ({
	id: `math-curriculum-october-week-${weekIndex + 1}`,
	dates: days.map((dayOfMonth) => ({
		dayOfMonth,
		id: `math-curriculum-october-date-${dayOfMonth}`,
	})),
}));

function getOrdinalSuffix(dayOfMonth) {
	const lastTwoDigits = dayOfMonth % 100;
	if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
		return "th";
	}
	switch (dayOfMonth % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}

function isDatePressed(dayOfMonth) {
	return pressedDateDays.value.has(dayOfMonth);
}

function handleDateToggle(dayOfMonth) {
	const nextPressedDateDays = new Set(pressedDateDays.value);
	if (nextPressedDateDays.has(dayOfMonth)) {
		nextPressedDateDays.delete(dayOfMonth);
	} else {
		nextPressedDateDays.add(dayOfMonth);
	}
	pressedDateDays.value = nextPressedDateDays;
}

function handleScreenBack() {
	emit("back-to-student-edits");
}

function handleScreenHome() {
	emit("go-home");
}
</script>

<template>
	<main
		id="math-curriculum-october-screen"
		class="math-curriculum-october-screen"
		role="main"
		aria-label="Math Curriculum October 2026"
		title="Math Curriculum October 2026"
	>
		<button
			id="math-curriculum-october-screen-home-button"
			class="math-curriculum-october-screen-home-button"
			type="button"
			name="math-curriculum-october-screen-home-button"
			data-button-name="math-curriculum-october-screen-home-button"
			aria-label="Return home"
			title="Return home"
			@click="handleScreenHome"
		>
			Home
		</button>
		<button
			id="math-curriculum-october-screen-back-button"
			class="math-curriculum-october-screen-back-button"
			type="button"
			name="math-curriculum-october-screen-back-button"
			data-button-name="math-curriculum-october-screen-back-button"
			aria-label="Back to student edits"
			title="Back to student edits"
			@click="handleScreenBack"
		>
			Back
		</button>
		<h1 class="math-curriculum-october-heading">Math Curriculum<br />October 2026</h1>
		<div id="math-curriculum-october-week-list" class="math-curriculum-october-week-list">
			<fieldset
				v-for="(week, weekIndex) in october2026WeekdayWeeks"
				:id="week.id"
				:key="week.id"
				class="math-curriculum-october-week"
				:aria-label="`October 2026 weekdays, week ${weekIndex + 1}`"
			>
				<button
					v-for="date in week.dates"
					:id="date.id"
					:key="date.id"
					class="math-curriculum-october-date-button"
					type="button"
					:name="date.id"
					:data-button-name="date.id"
					:aria-label="`Math (October ${date.dayOfMonth}${getOrdinalSuffix(date.dayOfMonth)}, 2026)`"
					:title="`Math (October ${date.dayOfMonth}${getOrdinalSuffix(date.dayOfMonth)}, 2026)`"
					:aria-pressed="isDatePressed(date.dayOfMonth)"
					@click="handleDateToggle(date.dayOfMonth)"
				>
					<span>Math</span>
					<span>(October {{ date.dayOfMonth }}{{ getOrdinalSuffix(date.dayOfMonth) }}, 2026)</span>
				</button>
			</fieldset>
		</div>
	</main>
</template>