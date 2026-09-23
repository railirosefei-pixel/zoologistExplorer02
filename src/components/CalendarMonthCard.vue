/** Calendar month card and its stable weekday/day-cell structure. */
<script setup>
import DayCellInteraction from "./DayCellInteraction.vue";

defineProps({
	currentMonth: {
		type: Object,
		required: true,
	},
	weekdays: {
		type: Array,
		required: true,
	},
	isExplosionTextureHidden: {
		type: Boolean,
		required: true,
	},
	isExplosionVisible: {
		type: Boolean,
		required: true,
	},
	explodedDayCellKey: {
		type: [String, null],
		default: null,
	},
	replacementColorClass: {
		type: String,
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
    <div
      class="calendar-weekday-row"
      aria-hidden="true"
    >
      <span
        v-for="day in weekdays"
        :key="`${currentMonth.id}-${day}`"
      >{{ day }}</span>
    </div>
    <div class="calendar-day-grid">
      <DayCellInteraction
        v-for="(cell, cellIndex) in currentMonth.cells"
        :key="`${currentMonth.id}-${cell.value || 'empty'}-${cell.isCurrentMonth}-${cellIndex}`"
        :cell="cell"
        :cell-id="`calendar-day-cell-${currentMonth.id}-${cellIndex}`"
        :cell-key="`${currentMonth.id}-${cellIndex}`"
        :is-explosion-texture-hidden="isExplosionTextureHidden"
        :is-explosion-visible="isExplosionVisible"
        :is-exploded="explodedDayCellKey === `${currentMonth.id}-${cellIndex}`"
        :replacement-color-class="replacementColorClass"
        :explosion-instance="explosionInstance"
        :explosion-image="explosionImage"
        @day-cell-click="$emit('day-cell-click', cell)"
      />
    </div>
  </article>
</template>
