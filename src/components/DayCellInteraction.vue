/** Interactive calendar day cell presentation and click boundary. */
<script setup>
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
	isSeptemberMonth: {
		type: Boolean,
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

function handleDayCellClick() {
	emit("day-cell-click", props.cell);
}
</script>

<template>
	<button
		:id="cellId"
		:key="cellKey"
		class="calendar-day-cell"
		type="button"
		:class="{
			'calendar-day-cell--empty': !cell.isCurrentMonth,
			'calendar-day-cell--september': cell.isCurrentMonth && isSeptemberMonth,
			'calendar-day-cell--exploding': isExplosionTextureHidden && isExploded,
		}"
		@click="handleDayCellClick"
	>
		<span v-if="!isExplosionTextureHidden || !isExploded" class="calendar-day-cell-number">
			{{ cell.value || "" }}
		</span>
		<img
			v-if="isExplosionVisible && isSeptemberMonth && cell.isCurrentMonth && isExploded"
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
