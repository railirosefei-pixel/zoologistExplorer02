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
			></div>
		</div>
	</div>
</template>

<style scoped>
/* === XP bar layout: bar is exactly 672px long, 14 segments of 48px === */
.progress-xp-bar-frame {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
}

.progress-xp-bar-track {
	display: flex;
	width: 672px;
	height: 18px;
	padding: 2px;
	box-sizing: border-box;
	background: #1c1c1c;
	border: 2px solid #0a0a0a;
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.08),
		0 2px 0 rgba(0, 0, 0, 0.6);
}

.progress-xp-bar-segment {
	width: 48px;
	height: 100%;
	box-sizing: border-box;
	background: #2b2b2b;
	border-right: 2px solid #0a0a0a;
	box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.5);
}

.progress-xp-bar-segment:last-child {
	border-right: none;
}

/* === Filled segment: Minecraft-style bright green with highlight === */
.progress-xp-bar-segment--filled {
	background: linear-gradient(180deg, #b6ff5c 0%, #7ee21f 45%, #4fa30a 100%);
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.55),
		inset 0 -2px 0 rgba(0, 0, 0, 0.35),
		0 0 6px rgba(126, 226, 31, 0.7);
}

/* === Level label: pixel font, Minecraft green with dark outline === */
.progress-xp-bar-level-row {
	display: flex;
	align-items: baseline;
	gap: 8px;
}

.progress-xp-bar-level-label,
.progress-xp-bar-level-number {
	font-family: "Minecraft2Bold", monospace;
	font-size: 1.1rem;
	color: #7efc4f;
	text-shadow:
		2px 2px 0 #1e3d0c,
		0 0 4px rgba(0, 0, 0, 0.8);
}
</style>
