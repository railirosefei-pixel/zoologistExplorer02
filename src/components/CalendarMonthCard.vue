/** Calendar month card and its stable weekday/day-cell structure. */
<script setup>
import DayCellInteraction from "./DayCellInteraction.vue";

const props = defineProps({
	currentMonth: {
		type: Object,
		required: true,
	},
	weekdays: {
		type: Array,
		required: true,
	},
	dayCellAnimationState: {
		type: String,
		required: true,
	},
	explodedDayCellKey: {
		type: [String, null],
		default: null,
	},
	lastClickedDayCellKey: {
		type: [String, null],
		default: null,
	},
	hiddenDayCellKeys: {
		type: Array,
		default: () => [],
	},
	replacementVisibleDayCellKeys: {
		type: Array,
		default: () => [],
	},
	replacementColorClassesByDayCellKey: {
		type: Object,
		required: true,
	},
	explosionInstance: {
		type: Number,
		required: true,
	},
	explosionImage: {
		type: String,
		required: true,
	},
});

defineEmits(["day-cell-click"]);

function isSeptemberRestrictedDayCell(cell) {
	if (!cell || !cell.isCurrentMonth || cell.value === "") {
		return false;
	}
	const dayNumber = Number(cell.value);
	return props.currentMonth.monthName === "September" && dayNumber >= 1 && dayNumber <= 27;
}
</script>

<template>
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
			<DayCellInteraction
				v-for="(cell, cellIndex) in currentMonth.cells"
				:key="`${currentMonth.id}-${cell.value || 'empty'}-${cell.isCurrentMonth}-${cellIndex}`"
				:cell="cell"
				:cell-id="`calendar-day-cell-${currentMonth.id}-${cellIndex}`"
				:cell-key="`${currentMonth.id}-${cellIndex}`"
				:day-cell-animation-state="dayCellAnimationState"
				:is-exploded="explodedDayCellKey === `${currentMonth.id}-${cellIndex}`"
				:last-clicked-day-cell-key="lastClickedDayCellKey"
				:hidden-day-cell-keys="hiddenDayCellKeys"
				:replacement-visible-day-cell-keys="replacementVisibleDayCellKeys"
				:replacement-color-classes-by-day-cell-key="replacementColorClassesByDayCellKey"
				:explosion-instance="explosionInstance"
				:explosion-image="explosionImage"
				:is-tnt-function-disabled="isSeptemberRestrictedDayCell(cell)"
				@day-cell-click="$emit('day-cell-click', cell)"
			/>
		</div>
	</article>
</template>
