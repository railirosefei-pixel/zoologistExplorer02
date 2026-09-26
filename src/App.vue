/** Root shell for home and student navigation state. */
<script setup>
import { ref } from "vue";
import HomeView from "./components/HomeView.vue";
import StudentNavigation from "./components/StudentNavigation.vue";
import CalendarView from "./components/CalendarView.vue";
import RewardsView from "./components/RewardsView.vue";

const isStudentMenuOpen = ref(false);
const isRewardsPageOpen = ref(false);
const activeStudentTab = ref("calendar");
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
</script>

<template>
	<HomeView
		v-if="!isStudentMenuOpen && !isRewardsPageOpen"
		@open-student-menu="handleStudentMenuOpen"
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
			@open-calendar="handleCalendarTabOpen"
			@open-rewards="handleRewardsPageOpen"
		>
			<button
				id="student-menu-back-button"
				class="student-menu-back-button"
				type="button"
				name="student-menu-back-button"
				data-button-name="student-menu-back-button"
				aria-label="Back to home page"
				title="Back to home page"
				@click="handleStudentMenuClose"
			>
				Back
			</button>
		</StudentNavigation>

		<section
			id="student-menu-content"
			class="student-menu-content"
			role="region"
			aria-label="Student menu content"
			title="Student menu content"
			data-container-name="student-menu-content"
		>
			<CalendarView v-if="activeStudentTab === 'calendar'" ref="calendarViewRef" />
		</section>
	</main>

	<RewardsView v-else @back-to-student-menu="handleRewardsPageClose" />
</template>
