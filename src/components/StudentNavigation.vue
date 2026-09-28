/** Navigation controls for the student workspace. */
<script setup>
import { computed, onMounted, ref, watch } from "vue";
import progressMenuBackground from "../../assets/images/backgrounds/grasslands(Day)01Final.webp";
import railiFront from "../../assets/images/characters/railiFront.webp";
import ProgressXpBar from "./ProgressXpBar.vue";
import { blockCompletionStore } from "../js/blockCompletionState.js";

const props = defineProps({
	explorerPositionsModeActive: { type: Boolean, default: false },
});

const emit = defineEmits(["open-calendar", "open-rewards"]);
const activeStudentMenu = ref("");
const isResizeModeActive = ref(false);
const isMoveModeActive = ref(false);
const railiImageRef = ref(null);
const railiFrameRef = ref(null);
const progressMenuBackgroundImage = `url("${progressMenuBackground}")`;
const totalXp = blockCompletionStore.totalXp;
const level = computed(() => blockCompletionStore.state.level);
const RAILI_HEIGHT_STORAGE_KEY = "ze2.studentProgress.railiHeightPx";
const RAILI_OFFSET_X_STORAGE_KEY = "ze2.studentProgress.railiOffsetXPx";
const RAILI_OFFSET_Y_STORAGE_KEY = "ze2.studentProgress.railiOffsetYPx";
let railiDragStartY = 0;
let railiDragStartHeightPx = 0;
let railiDragActive = false;
let railiMoveStartX = 0;
let railiMoveStartY = 0;
let railiMoveStartOffsetX = 0;
let railiMoveStartOffsetY = 0;
let railiMoveActive = false;

/** Student-menu navigation pipeline boundary for the calendar tab. */
function handleCalendarNavigation() {
	activeStudentMenu.value = "";
	emit("open-calendar");
}

/** Rewards-page navigation pipeline boundary. */
function handleRewardsNavigation() {
	emit("open-rewards");
}

/** Student sidebar submenu pipeline boundary. */
function handleStudentMenuNavigation(menuName) {
	activeStudentMenu.value = menuName;
}

/** Resize mode toggle pipeline boundary. */
function handleResizeToggle() {
	isResizeModeActive.value = !isResizeModeActive.value;
}

/** Move mode toggle pipeline boundary. */
function handleMoveToggle() {
	isMoveModeActive.value = !isMoveModeActive.value;
}

/** Apply a clamped Raili height and store it in the CSS variable. */
function applyRailiHeight(heightPx) {
	const clampedHeight = Math.min(Math.max(heightPx, 96), window.innerHeight * 0.8);
	railiImageRef.value?.style.setProperty("--student-raili-height", `${clampedHeight}px`);
}

/** Begin dragging a Raili resize handle. */
function handleRailiResizeStart(corner, event) {
	void corner;
	railiDragActive = true;
	railiDragStartY = event.clientY;
	railiDragStartHeightPx = railiImageRef.value?.getBoundingClientRect().height ?? 384;
	event.currentTarget.setPointerCapture(event.pointerId);
}

/** Resize Raili height while the pointer moves. */
function handleRailiResizeMove(corner, event) {
	if (!railiDragActive) {
		return;
	}

	const sign = corner === "nw" || corner === "ne" ? -1 : 1;
	const nextHeight = railiDragStartHeightPx + sign * (event.clientY - railiDragStartY);
	applyRailiHeight(nextHeight);
}

/** Finish dragging a Raili resize handle and persist the result. */
function handleRailiResizeEnd() {
	if (!railiDragActive) {
		return;
	}

	const persistedHeight = Math.round(railiImageRef.value?.getBoundingClientRect().height ?? 0);
	localStorage.setItem(RAILI_HEIGHT_STORAGE_KEY, String(persistedHeight));
	railiDragActive = false;
}

/** Apply a Raili position offset and store it in CSS variables on the frame. */
function applyRailiOffset(offsetXPx, offsetYPx) {
	railiFrameRef.value?.style.setProperty("--student-raili-offset-x", `${offsetXPx}px`);
	railiFrameRef.value?.style.setProperty("--student-raili-offset-y", `${offsetYPx}px`);
}

/** Begin dragging the Raili frame in Move mode. */
function handleRailiMoveStart(event) {
	if (!isMoveModeActive.value || event.target !== event.currentTarget) {
		return;
	}

	railiMoveStartX = event.clientX;
	railiMoveStartY = event.clientY;
	railiMoveStartOffsetX = Number.parseFloat(
		railiFrameRef.value?.style.getPropertyValue("--student-raili-offset-x") ?? "",
	) || 0;
	railiMoveStartOffsetY = Number.parseFloat(
		railiFrameRef.value?.style.getPropertyValue("--student-raili-offset-y") ?? "",
	) || 0;
	railiMoveActive = true;
	event.currentTarget.setPointerCapture(event.pointerId);
}

/** Move the Raili frame while the pointer moves. */
function handleRailiMoveMove(event) {
	if (!railiMoveActive) {
		return;
	}

	applyRailiOffset(
		railiMoveStartOffsetX + (event.clientX - railiMoveStartX),
		railiMoveStartOffsetY + (event.clientY - railiMoveStartY),
	);
}

/** Finish dragging the Raili frame and persist the position. */
function handleRailiMoveEnd() {
	if (!railiMoveActive) {
		return;
	}

	const persistedOffsetX = Math.round(
		Number.parseFloat(railiFrameRef.value?.style.getPropertyValue("--student-raili-offset-x") ?? "0"),
	);
	const persistedOffsetY = Math.round(
		Number.parseFloat(railiFrameRef.value?.style.getPropertyValue("--student-raili-offset-y") ?? "0"),
	);
	localStorage.setItem(RAILI_OFFSET_X_STORAGE_KEY, String(persistedOffsetX));
	localStorage.setItem(RAILI_OFFSET_Y_STORAGE_KEY, String(persistedOffsetY));
	railiMoveActive = false;
}

watch(
	() => props.explorerPositionsModeActive,
	(active) => {
		if (!active) {
			isResizeModeActive.value = false;
			isMoveModeActive.value = false;
		}
	},
);

watch(activeStudentMenu, (menu) => {
	if (menu !== "progress") {
		isResizeModeActive.value = false;
		isMoveModeActive.value = false;
		return;
	}

	const storedOffsetX = Number.parseFloat(localStorage.getItem(RAILI_OFFSET_X_STORAGE_KEY) ?? "");
	const storedOffsetY = Number.parseFloat(localStorage.getItem(RAILI_OFFSET_Y_STORAGE_KEY) ?? "");
	if (Number.isFinite(storedOffsetX) && Number.isFinite(storedOffsetY)) {
		applyRailiOffset(storedOffsetX, storedOffsetY);
	}
}, { flush: "post" });

onMounted(() => {
	const storedHeight = Number.parseFloat(localStorage.getItem(RAILI_HEIGHT_STORAGE_KEY) ?? "");
	if (Number.isFinite(storedHeight) && storedHeight > 0) {
		applyRailiHeight(storedHeight);
	}
	const storedOffsetX = Number.parseFloat(localStorage.getItem(RAILI_OFFSET_X_STORAGE_KEY) ?? "");
	const storedOffsetY = Number.parseFloat(localStorage.getItem(RAILI_OFFSET_Y_STORAGE_KEY) ?? "");
	if (Number.isFinite(storedOffsetX) && Number.isFinite(storedOffsetY)) {
		applyRailiOffset(storedOffsetX, storedOffsetY);
	}

	if (!props.explorerPositionsModeActive) {
		isResizeModeActive.value = false;
		isMoveModeActive.value = false;
	}
});
</script>

<template>
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
			aria-expanded="false"
			@click="handleCalendarNavigation"
		>
			Calendar
		</button>
		<button
			id="rewards-tab"
			class="student-menu-rewards-tab"
			type="button"
			name="rewards-tab"
			data-button-name="rewards-tab"
			aria-label="Open Rewards tab"
			title="Open Rewards tab"
			@click="handleRewardsNavigation"
		>
			Rewards
		</button>
		<button
			id="games-tab"
			class="student-menu-games-tab"
			type="button"
			name="games-tab"
			data-button-name="games-tab"
			aria-label="Open Games tab"
			title="Open Games tab"
			:aria-expanded="activeStudentMenu === 'games'"
			@click="handleStudentMenuNavigation('games')"
		>
			Games
		</button>
		<button
			id="extra-credit-tab"
			class="student-menu-extra-credit-tab"
			type="button"
			name="extra-credit-tab"
			data-button-name="extra-credit-tab"
			aria-label="Open Extra Credit tab"
			title="Open Extra Credit tab"
			:aria-expanded="activeStudentMenu === 'extra-credit'"
			@click="handleStudentMenuNavigation('extra-credit')"
		>
			Extra Credit
		</button>
		<button
			id="progress-tab"
			class="student-menu-progress-tab"
			type="button"
			name="progress-tab"
			data-button-name="progress-tab"
			aria-label="Open Progress tab"
			title="Open Progress tab"
			:aria-expanded="activeStudentMenu === 'progress'"
			@click="handleStudentMenuNavigation('progress')"
		>
			Progress
		</button>
		<slot />

		<aside
			v-if="activeStudentMenu"
			id="student-submenu-panel"
			class="student-submenu-panel"
			:class="{
				'student-submenu-panel-games': activeStudentMenu === 'games',
				'student-submenu-panel-extra-credit': activeStudentMenu === 'extra-credit',
				'student-submenu-panel-progress': activeStudentMenu === 'progress',
			}"
			aria-label="Student submenu panel"
			title="Student submenu panel"
			data-container-name="student-submenu-panel"
		>
			<article
				v-if="activeStudentMenu === 'games'"
				id="games-menu"
				class="student-submenu-section student-submenu-games"
				aria-label="Games menu"
				title="Games menu"
			>
				<h2>Games</h2>
				<p>Pick a game to practice your skills.</p>
			</article>
			<article
				v-if="activeStudentMenu === 'extra-credit'"
				id="extra-credit-menu"
				class="student-submenu-section student-submenu-extra-credit"
				aria-label="Extra Credit menu"
				title="Extra Credit menu"
			>
				<h2>Extra Credit</h2>
				<p>Explore optional challenges and activities.</p>
			</article>
			<div v-if="activeStudentMenu === 'progress'" class="student-progress-xp-bar-slot">
				<ProgressXpBar :xp="totalXp" :level="level" />
			</div>
			<div
				v-if="activeStudentMenu === 'progress'"
				id="student-progress-raili-frame"
				class="student-progress-raili-frame"
				ref="railiFrameRef"
				:class="{
					'student-progress-raili-frame--resize-active': isResizeModeActive,
					'student-progress-raili-frame--move-active': isMoveModeActive,
				}"
				data-container-name="student-progress-raili-frame"
				@pointerdown="handleRailiMoveStart"
				@pointermove="handleRailiMoveMove"
				@pointerup="handleRailiMoveEnd"
				@pointercancel="handleRailiMoveEnd"
			>
				<img
					ref="railiImageRef"
					class="student-progress-raili-image"
					:src="railiFront"
					alt="Raili"
				/>
				<div
					v-if="isResizeModeActive"
					id="student-progress-raili-resize-handle-nw"
					class="student-progress-raili-resize-handle student-progress-raili-resize-handle--nw"
					role="presentation"
					aria-hidden="true"
					@pointerdown="handleRailiResizeStart('nw', $event)"
					@pointermove="handleRailiResizeMove('nw', $event)"
					@pointerup="handleRailiResizeEnd"
					@pointercancel="handleRailiResizeEnd"
				></div>
				<div
					v-if="isResizeModeActive"
					id="student-progress-raili-resize-handle-ne"
					class="student-progress-raili-resize-handle student-progress-raili-resize-handle--ne"
					role="presentation"
					aria-hidden="true"
					@pointerdown="handleRailiResizeStart('ne', $event)"
					@pointermove="handleRailiResizeMove('ne', $event)"
					@pointerup="handleRailiResizeEnd"
					@pointercancel="handleRailiResizeEnd"
				></div>
				<div
					v-if="isResizeModeActive"
					id="student-progress-raili-resize-handle-sw"
					class="student-progress-raili-resize-handle student-progress-raili-resize-handle--sw"
					role="presentation"
					aria-hidden="true"
					@pointerdown="handleRailiResizeStart('sw', $event)"
					@pointermove="handleRailiResizeMove('sw', $event)"
					@pointerup="handleRailiResizeEnd"
					@pointercancel="handleRailiResizeEnd"
				></div>
				<div
					v-if="isResizeModeActive"
					id="student-progress-raili-resize-handle-se"
					class="student-progress-raili-resize-handle student-progress-raili-resize-handle--se"
					role="presentation"
					aria-hidden="true"
					@pointerdown="handleRailiResizeStart('se', $event)"
					@pointermove="handleRailiResizeMove('se', $event)"
					@pointerup="handleRailiResizeEnd"
					@pointercancel="handleRailiResizeEnd"
				></div>
			</div>
			<div
				v-if="activeStudentMenu === 'progress' && explorerPositionsModeActive"
				id="student-progress-resize-dock"
				class="student-progress-resize-dock"
				role="region"
				aria-label="Resize tools"
				title="Resize tools"
				data-container-name="student-progress-resize-dock"
			>
				<button
					id="student-progress-resize-button"
					class="student-progress-resize-button"
					type="button"
					name="student-progress-resize-button"
					data-button-name="student-progress-resize-button"
					aria-label="Toggle Raili resize mode"
					title="Toggle Raili resize mode"
					:aria-pressed="isResizeModeActive"
					:class="{ 'student-progress-resize-button--engaged': isResizeModeActive }"
					@click="handleResizeToggle"
				>
					Resize
				</button>
				<button
					id="student-progress-move-button"
					class="student-progress-move-button"
					type="button"
					name="student-progress-move-button"
					data-button-name="student-progress-move-button"
					aria-label="Toggle Raili move mode"
					title="Toggle Raili move mode"
					:aria-pressed="isMoveModeActive"
					:class="{ 'student-progress-move-button--engaged': isMoveModeActive }"
					@click="handleMoveToggle"
				>
					Move
				</button>
			</div>
		</aside>
	</nav>
</template>

<style scoped>
/* Centers the XP bar horizontally at the top of the Student Progress menu. */
.student-progress-xp-bar-slot {
	display: flex;
	justify-content: center;
	width: 100%;
}

.student-submenu-panel-progress {
	background-image: v-bind(progressMenuBackgroundImage);
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
}
</style>
