<script setup>
/** Shared game illustration used in both its thumbnail and level screen. */
defineProps({
	path: { type: String, required: true },
	symbol: { type: String, required: true },
	week: { type: Number, required: true },
	label: { type: String, required: true },
});

const weekBackgrounds = ["#dcfce7", "#cffafe", "#ffe4e6", "#fef9c3"];
</script>

<template>
	<svg viewBox="0 0 109 64" role="img" :aria-label="label">
		<rect width="109" height="64" rx="4" :fill="weekBackgrounds[week - 1]" />
		<path
			:d="path"
			fill="none"
			stroke="#164e63"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<text x="54.5" y="59" text-anchor="middle" font-size="12" font-weight="bold" fill="#164e63">
			{{ symbol }}
		</text>
	</svg>
</template>
