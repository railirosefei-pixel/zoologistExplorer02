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

const isStudentMenuOpen = ref(false);
const isRewardsPageOpen = ref(false);
const activeStudentTab = ref("calendar");
const activeParentScreen = ref("");
const isExplorerPositionsModeActive = ref(false);
const calendarViewRef = ref(null);

/** Home navigation pipeline boundary. */
function handleStudentMenuOpen() {
	isStudentMenuOpen.value = true;
	isRewardsPageOpen.value = false;
	activeStudentTab.value = "calendar";
}

/** Student-menu exit pipeline boundary. */
function handleStudentMenuClose() {
	isStudentMenuOpen.value = false;
	isRewardsPageOpen.value = false;
	activeStudentTab.value = "calendar";
}

/** Rewards-page navigation pipeline boundary. */
function handleRewardsPageOpen() {
	isStudentMenuOpen.value = false;
	isRewardsPageOpen.value = true;
}

/** Rewards-page return pipeline boundary. */
function handleRewardsPageClose() {
	isRewardsPageOpen.value = false;
	isStudentMenuOpen.value = true;
}

/** Student-menu tab navigation pipeline boundary. */
function handleCalendarTabOpen() {
	activeStudentTab.value = "calendar";
	calendarViewRef.value?.resetToCalendar();
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
		v-else-if="activeParentScreen === 'student-edits'"
		@open-curriculum-game="handleCurriculumGameOpen"
		@back-to-parent-menu="handleStudentEditsParentMenuClose"
		@go-home="handleParentChainHome"
	/>

	<CurriculumGameView
		v-else-if="activeParentScreen === 'curriculum-game'"
		:explorer-positions-mode-active="isExplorerPositionsModeActive"
		@toggle-explorer-positions-mode="handleExplorerPositionsToggle"
		@back-to-student-edits="handleCurriculumGameClose"
		@go-home="handleParentChainHome"
	/>

	<main
		v-else-if="isStudentMenuOpen"
		id="student-menu-page"
		class="student-menu-page"
		role="main"
		aria-label="Student menu"
		title="Student menu"
		data-page-name="student-menu-page"
	>
		<StudentNavigation
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
			/>
		</section>
	</main>

	<RewardsView v-else @back-to-student-menu="handleRewardsPageClose" />
</template>
