/** Interactive calendar day cell presentation and click boundary. */
<script setup>
import { computed } from "vue";

const props = defineProps({
	cell: {
		type: Object,
		required: true,
	},
	cellId: {
		type: String,
		required: true,
	},
	cellKey: {
		type: String,
		required: true,
	},
	dayCellAnimationState: {
		type: String,
		required: true,
	},
	isExploded: {
		type: Boolean,
		required: true,
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

const emit = defineEmits(["day-cell-click"]);

const isCurrentCellReplacementVisible = computed(
	() => props.isExploded || props.replacementVisibleDayCellKeys.includes(props.cellKey),
);
const replacementColorClass = computed(
	() => props.replacementColorClassesByDayCellKey[props.cellKey],
);
const isCellLocked = computed(
	() => props.isExploded && props.dayCellAnimationState === "exploding",
);
const isTextureSuppressed = computed(
	() =>
		props.hiddenDayCellKeys.includes(props.cellKey) &&
		props.lastClickedDayCellKey !== props.cellKey,
);

function handleDayCellClick() {
	if (isCellLocked.value) {
		return;
	}
	emit("day-cell-click", props.cell);
}
</script>

<template>
	<button
		:id="cellId"
		:key="cellKey"
		class="calendar-day-cell"
		type="button"
		:disabled="isCellLocked"
		:aria-disabled="isCellLocked"
		:class="{
			'calendar-day-cell--empty': !cell.isCurrentMonth,
			'calendar-day-cell--current-month': cell.isCurrentMonth,
			'calendar-day-cell--exploding':
				isExploded && ['textureCleared', 'ready'].includes(dayCellAnimationState),
			'calendar-day-cell--locked': isCellLocked,
			'calendar-day-cell--texture-suppressed': isTextureSuppressed,
		}"
		@click="handleDayCellClick"
	>
		<span
			v-if="
				cell.isCurrentMonth &&
				cell.value !== '' &&
				!(isExploded && ['exploding', 'textureCleared'].includes(dayCellAnimationState))
			"
			class="calendar-day-cell-number"
		>
			{{ cell.value || "" }}
		</span>
		<img
			v-if="
				['exploding', 'textureCleared'].includes(dayCellAnimationState) &&
				cell.isCurrentMonth &&
				isExploded
			"
			:key="`${cellKey}-${explosionInstance}`"
			class="calendar-day-cell-explosion"
			:src="explosionImage"
			alt=""
			aria-hidden="true"
		/>
		<span
			v-if="isCurrentCellReplacementVisible"
			:id="`calendar-day-replacement-${cellKey}`"
			class="calendar-day-replacement"
			:class="replacementColorClass"
			aria-label="Calendar day replacement"
		/>
	</button>
</template>
