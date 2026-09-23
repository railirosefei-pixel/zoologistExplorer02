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
	isExplosionTextureHidden: {
		type: Boolean,
		required: true,
	},
	isExplosionVisible: {
		type: Boolean,
		required: true,
	},
	isExploded: {
		type: Boolean,
		required: true,
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

const emit = defineEmits(["day-cell-click"]);

const isCellLocked = computed(() => props.isExplosionVisible && props.isExploded);

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
			'calendar-day-cell--september': cell.isCurrentMonth,
			'calendar-day-cell--exploding': isExplosionTextureHidden && isExploded,
			'calendar-day-cell--locked': isCellLocked,
		}"
		@click="handleDayCellClick"
	>
		<span v-if="!isExplosionTextureHidden || !isExploded" class="calendar-day-cell-number">
			{{ cell.value || "" }}
		</span>
		<img
			v-if="isExplosionVisible && cell.isCurrentMonth && isExploded"
			:key="`${cellKey}-${explosionInstance}`"
			class="calendar-day-cell-explosion"
			:src="explosionImage"
			alt=""
			aria-hidden="true"
		/>
		<span
			v-if="isExplosionTextureHidden && isExploded"
			:id="`calendar-day-replacement-${cellKey}`"
			class="calendar-day-replacement"
			:class="replacementColorClass"
			aria-label="Calendar day replacement"
		/>
	</button>
</template>
