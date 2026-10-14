<script setup>
/**
 * Minecraft-style XP bar for the Progress screen.
 * Self-contained: all XP bar text and styling live in this file so any
 * aspect can be edited here without touching other components.
 *
 * The bar has 14 segments of 20 XP each (280 XP of track). XP is capped
 * upstream at 240, so segments 13 and 14 (240-260, 260-280) currently
 * stay empty and are reserved for future behavior.
 */
import { computed } from "vue";

const props = defineProps({
	/** Total XP earned, already capped at 240 by the store. */
	xp: { type: Number, required: true },
	/** Permanent level; increments once per 240 XP earned. */
	level: { type: Number, required: true },
});

const XP_PER_SEGMENT = 20;
const SEGMENT_COUNT = 14;

/** One slot per segment; filled when XP reaches the segment's threshold. */
const segments = computed(() =>
	Array.from({ length: SEGMENT_COUNT }, (_, index) => ({
		index,
		filled: props.xp >= (index + 1) * XP_PER_SEGMENT,
	})),
);
</script>

<template>
	<div
		id="progress-xp-bar"
		class="progress-xp-bar-frame"
		role="img"
		:aria-label="`Level ${level}, ${xp} XP`"
		title="XP bar"
	>
		<div class="progress-xp-bar-level-row">
			<span class="progress-xp-bar-level-label">Level</span>
			<span class="progress-xp-bar-level-number">{{ level }}</span>
		</div>
		<div class="progress-xp-bar-track">
			<div
				v-for="segment in segments"
				:key="segment.index"
				class="progress-xp-bar-segment"
				:class="{ 'progress-xp-bar-segment--filled': segment.filled }"
			/>
		</div>
	</div>
</template>

<style scoped>
/* === XP bar layout: bar is exactly 672px long, 14 segments of 48px === */
.progress-xp-bar-frame {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 7px;
	padding: 12px 16px;
	border: 3px solid #a64c1f;
	border-radius: 9px;
	background: linear-gradient(145deg, #fff0a6 0%, #f4be45 52%, #e77732 100%);
	box-shadow:
		inset 0 2px 0 rgba(255, 251, 219, 0.82),
		inset 0 -5px 0 rgba(56, 45, 27, 0.42),
		0 6px 0 #332719,
		0 10px 16px rgba(24, 29, 17, 0.35);
}

.progress-xp-bar-track {
	display: flex;
	width: 672px;
	height: 24px;
	padding: 3px;
	box-sizing: border-box;
	background: #332719;
	border: 3px solid #1d170f;
	box-shadow:
		inset 0 0 0 1px #a97938,
		inset 0 3px 0 rgba(255, 239, 190, 0.18),
		0 3px 0 #171109,
		0 0 12px rgba(191, 137, 59, 0.3);
}

.progress-xp-bar-segment {
	width: 48px;
	height: 100%;
	box-sizing: border-box;
	background: #493a27;
	border-right: 2px solid #261c11;
	box-shadow:
		inset 0 2px 0 rgba(255, 239, 190, 0.08),
		inset 0 -2px 0 rgba(0, 0, 0, 0.45);
}

.progress-xp-bar-segment:last-child {
	border-right: none;
}

.progress-xp-bar-segment--filled {
	background: linear-gradient(
		180deg,
		var(--xp-segment-light) 0%,
		var(--xp-segment-dark) 100%
	);
	box-shadow:
		inset 0 2px 0 rgba(255, 248, 220, 0.5),
		inset 0 -2px 0 rgba(43, 31, 17, 0.42),
		0 0 7px rgba(201, 151, 70, 0.45);
}

.progress-xp-bar-segment--filled:nth-child(1) {
	--xp-segment-light: #fff08a;
	--xp-segment-dark: #ffd43b;
}

.progress-xp-bar-segment--filled:nth-child(2) {
	--xp-segment-light: #ffe45c;
	--xp-segment-dark: #ffc52f;
}

.progress-xp-bar-segment--filled:nth-child(3) {
	--xp-segment-light: #ffd34c;
	--xp-segment-dark: #ffae2f;
}

.progress-xp-bar-segment--filled:nth-child(4) {
	--xp-segment-light: #ffc247;
	--xp-segment-dark: #f9952f;
}

.progress-xp-bar-segment--filled:nth-child(5) {
	--xp-segment-light: #ffad3b;
	--xp-segment-dark: #ee7b2e;
}

.progress-xp-bar-segment--filled:nth-child(6) {
	--xp-segment-light: #ff9938;
	--xp-segment-dark: #e9672b;
}

.progress-xp-bar-segment--filled:nth-child(7) {
	--xp-segment-light: #f98536;
	--xp-segment-dark: #db5228;
}

.progress-xp-bar-segment--filled:nth-child(8) {
	--xp-segment-light: #ed7133;
	--xp-segment-dark: #ca4325;
}

.progress-xp-bar-segment--filled:nth-child(9) {
	--xp-segment-light: #df5d30;
	--xp-segment-dark: #b83823;
}

.progress-xp-bar-segment--filled:nth-child(10) {
	--xp-segment-light: #ce4c2d;
	--xp-segment-dark: #a32e22;
}

.progress-xp-bar-segment--filled:nth-child(11) {
	--xp-segment-light: #bb3c2c;
	--xp-segment-dark: #8f2521;
}

.progress-xp-bar-segment--filled:nth-child(12) {
	--xp-segment-light: #a9322a;
	--xp-segment-dark: #7b201f;
}

.progress-xp-bar-segment--filled:nth-child(13) {
	--xp-segment-light: #972b28;
	--xp-segment-dark: #691d1c;
}

.progress-xp-bar-segment--filled:nth-child(14) {
	--xp-segment-light: #832523;
	--xp-segment-dark: #581919;
}

.progress-xp-bar-level-row {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 4px 12px;
	background: #352719;
	border: 2px solid #9b6e34;
	box-shadow:
		inset 0 0 0 1px #4c3820,
		0 2px 0 #171109;
}

.progress-xp-bar-level-row::before,
.progress-xp-bar-level-row::after {
	width: 7px;
	height: 7px;
	background: #e6be68;
	box-shadow:
		1px 1px 0 #533b20,
		0 0 6px rgba(239, 193, 83, 0.7);
	content: "";
	transform: rotate(45deg);
}

.progress-xp-bar-level-label,
.progress-xp-bar-level-number {
	font-family: "Minecraft2Bold", monospace;
	font-size: 1.1rem;
	color: #f2d58f;
	text-shadow:
		2px 2px 0 #3c2a17,
		0 0 5px rgba(230, 190, 104, 0.55);
}

.progress-xp-bar-level-number {
	color: #fff0bd;
}
</style>
