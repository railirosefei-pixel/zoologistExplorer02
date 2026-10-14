/** Root shell for home, student, and parent navigation state. */
<script setup>
import { ref } from "vue";
import HomeView from "./components/HomeView.vue";
import StudentNavigation from "./components/StudentNavigation.vue";
import CalendarView from "./components/CalendarView.vue";
import RewardsView from "./components/RewardsView.vue";
import ParentView from "./components/ParentView.vue";
import StudentEditsView from "./components/StudentEditsView.vue";
import CurriculumGameView from "./components/CurriculumGameView.vue";
import MathCurriculumOctoberView from "./components/MathCurriculumOctoberView.vue";
import { earnedBadges, removeEarnedBadge } from "./js/rewardBadgeState.js";

const isStudentMenuOpen = ref(false);
const isRewardsPageOpen = ref(false);
const activeStudentTab = ref("calendar");
const activeParentScreen = ref("");
const isExplorerPositionsModeActive = ref(false);
const calendarViewRef = ref(null);
const studentNavigationRef = ref(null);
const goldCoinTotal = ref(0);
const activeRewardCelebration = ref(null);
const isCompletionRewardFlowActive = ref(false);
const REWARD_RETURN_DELAY_MS = 1300;
let rewardReturnTimerId = null;

function clearRewardReturnTimer() {
	if (rewardReturnTimerId !== null) {
		window.clearTimeout(rewardReturnTimerId);
		rewardReturnTimerId = null;
	}
}

/** Home navigation pipeline boundary. */
function handleStudentMenuOpen() {
	isStudentMenuOpen.value = true;
	isRewardsPageOpen.value = false;
	activeStudentTab.value = "calendar";
}

/** Student-menu exit pipeline boundary. */
function handleStudentMenuClose() {
	isCompletionRewardFlowActive.value = false;
	isStudentMenuOpen.value = false;
	isRewardsPageOpen.value = false;
	activeStudentTab.value = "calendar";
}

/** Rewards-page navigation pipeline boundary. */
function handleRewardsPageOpen(celebration = null, preserveStudentMenu = false) {
	clearRewardReturnTimer();
	activeRewardCelebration.value = celebration;
	try {
		const savedProgress = JSON.parse(
			localStorage.getItem("zoologist-math-games-progress") || "{}",
		);
		goldCoinTotal.value = Object.values(savedProgress || {}).filter(
			(completedLevels) => completedLevels === 10,
		).length;
	} catch {
		goldCoinTotal.value = 0;
	}
	isStudentMenuOpen.value = preserveStudentMenu;
	isRewardsPageOpen.value = true;
}

/** Rewards-page return pipeline boundary. */
function handleRewardsPageClose() {
	clearRewardReturnTimer();
	if (isCompletionRewardFlowActive.value) {
		studentNavigationRef.value?.closeProgress();
		isCompletionRewardFlowActive.value = false;
	}
	isRewardsPageOpen.value = false;
	isStudentMenuOpen.value = true;
	activeRewardCelebration.value = null;
}

/** Third-block reward route: show Progress through the explorer and XP update first. */
async function handleCompletionRewardOpen(celebration) {
	isCompletionRewardFlowActive.value = true;
	const progressOpening = handleProgressOpen(true, { holdProgressScreen: true });
	if (!progressOpening) {
		isCompletionRewardFlowActive.value = false;
		throw new Error("Student Progress must be open before its completion reward.");
	}

	const progressStayedOpen = await progressOpening;
	if (!progressStayedOpen || !isCompletionRewardFlowActive.value) {
		isCompletionRewardFlowActive.value = false;
		return;
	}

	await new Promise((resolve) => {
		window.setTimeout(resolve, REWARD_RETURN_DELAY_MS);
	});
	if (!isCompletionRewardFlowActive.value) {
		return;
	}

	handleRewardsPageOpen(celebration, true);
}

/** Start the return delay only after the badge has finished its arrival animation. */
function handleRewardAnimationComplete() {
	if (!isRewardsPageOpen.value || !activeRewardCelebration.value) {
		return;
	}

	clearRewardReturnTimer();
	rewardReturnTimerId = window.setTimeout(() => {
		rewardReturnTimerId = null;
		handleRewardsPageClose();
	}, REWARD_RETURN_DELAY_MS);
}

/** Student-menu tab navigation pipeline boundary. */
function handleCalendarTabOpen() {
	activeStudentTab.value = "calendar";
	calendarViewRef.value?.resetToCalendar();
}

/** Progress-screen navigation pipeline boundary. */
function handleProgressOpen(advanceFromCompletion = false, options = {}) {
	return studentNavigationRef.value?.openProgress(advanceFromCompletion, options);
}

/** Parent-menu navigation pipeline boundary. */
function handleParentMenuOpen() {
	activeParentScreen.value = "parent";
}

/** Parent-screen exit pipeline boundary. */
function handleParentScreenClose() {
	activeParentScreen.value = "";
}

/** Student Edits screen navigation pipeline boundary. */
function handleStudentEditsOpen() {
	activeParentScreen.value = "student-edits";
}

/** Persist removal requested from the Badges Earned edit panel. */
function handleEarnedBadgeReset(badgeId) {
	removeEarnedBadge(badgeId);
}

/** Student Edits return-to-parent-menu pipeline boundary. */
function handleStudentEditsParentMenuClose() {
	activeParentScreen.value = "parent";
}

/** Curriculum Game screen navigation pipeline boundary. */
function handleCurriculumGameOpen() {
	activeParentScreen.value = "curriculum-game";
}

/** Curriculum Game screen exit pipeline boundary. */
function handleCurriculumGameClose() {
	activeParentScreen.value = "student-edits";
}

/** October Math curriculum screen navigation pipeline boundary. */
function handleMathCurriculumOctoberOpen() {
	activeParentScreen.value = "math-curriculum-october";
}

/** October Math curriculum screen exit pipeline boundary. */
function handleMathCurriculumOctoberClose() {
	activeParentScreen.value = "description-edits";
}

/** Explorer Positions mode toggle pipeline boundary. */
function handleExplorerPositionsToggle() {
	isExplorerPositionsModeActive.value = !isExplorerPositionsModeActive.value;
}

/** Parent-chain home-return pipeline boundary. */
function handleParentChainHome() {
	activeParentScreen.value = "";
}
</script>

<template>
	<HomeView
		v-if="!isStudentMenuOpen && !isRewardsPageOpen && !activeParentScreen"
		@open-student-menu="handleStudentMenuOpen"
		@open-parent-menu="handleParentMenuOpen"
	/>

	<ParentView
		v-else-if="activeParentScreen === 'parent'"
		@open-student-edits="handleStudentEditsOpen"
		@back-to-home="handleParentScreenClose"
	/>

	<StudentEditsView
		v-else-if="
			activeParentScreen === 'student-edits' || activeParentScreen === 'description-edits'
		"
		:initial-description-edits-open="activeParentScreen === 'description-edits'"
		:earned-badges="earnedBadges"
		@open-curriculum-game="handleCurriculumGameOpen"
		@open-math-curriculum-october="handleMathCurriculumOctoberOpen"
		@back-to-parent-menu="handleStudentEditsParentMenuClose"
		@reset-earned-badge="handleEarnedBadgeReset"
		@go-home="handleParentChainHome"
	/>

	<CurriculumGameView
		v-else-if="activeParentScreen === 'curriculum-game'"
		:explorer-positions-mode-active="isExplorerPositionsModeActive"
		@toggle-explorer-positions-mode="handleExplorerPositionsToggle"
		@back-to-student-edits="handleCurriculumGameClose"
		@go-home="handleParentChainHome"
	/>

	<MathCurriculumOctoberView
		v-else-if="activeParentScreen === 'math-curriculum-october'"
		@back-to-student-edits="handleMathCurriculumOctoberClose"
		@go-home="handleParentChainHome"
	/>

	<main
		v-else-if="isStudentMenuOpen"
		v-show="!isRewardsPageOpen"
		id="student-menu-page"
		class="student-menu-page"
		role="main"
		aria-label="Student menu"
		title="Student menu"
		data-page-name="student-menu-page"
	>
		<StudentNavigation
			ref="studentNavigationRef"
			:explorer-positions-mode-active="isExplorerPositionsModeActive"
			@open-calendar="handleCalendarTabOpen"
			@open-rewards="handleRewardsPageOpen"
			@back-to-home="handleStudentMenuClose"
		/>

		<section
			id="student-menu-content"
			class="student-menu-content"
			role="region"
			aria-label="Student menu content"
			title="Student menu content"
			data-container-name="student-menu-content"
		>
			<CalendarView
				v-if="activeStudentTab === 'calendar'"
				ref="calendarViewRef"
				@go-home="handleStudentMenuClose"
				@open-progress="handleProgressOpen(true)"
				@open-reward="handleCompletionRewardOpen"
			/>
		</section>
	</main>

	<RewardsView
		v-if="isRewardsPageOpen"
		:gold-coin-total="goldCoinTotal"
		:earned-badges="earnedBadges"
		:celebrating-badge="activeRewardCelebration"
		@back-to-student-menu="handleRewardsPageClose"
		@badge-animation-complete="handleRewardAnimationComplete"
	/>
</template>
