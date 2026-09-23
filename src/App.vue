/** Root shell for home and student navigation state. */
<script setup>
import { ref } from "vue";
import HomeView from "./components/HomeView.vue";
import StudentNavigation from "./components/StudentNavigation.vue";
import CalendarView from "./components/CalendarView.vue";

const isStudentMenuOpen = ref(false);
const activeStudentTab = ref("calendar");

function openStudentMenu() {
	isStudentMenuOpen.value = true;
	activeStudentTab.value = "calendar";
}

function closeStudentMenu() {
	isStudentMenuOpen.value = false;
	activeStudentTab.value = "calendar";
}

function openCalendarTab() {
	activeStudentTab.value = "calendar";
}
</script>

<template>
	<HomeView v-if="!isStudentMenuOpen" @open-student-menu="openStudentMenu" />

	<main
		v-else
		id="student-menu-page"
		class="student-menu-page"
		role="main"
		aria-label="Student menu"
		title="Student menu"
		data-page-name="student-menu-page"
	>
		<StudentNavigation
			@open-calendar="openCalendarTab"
			@close-student-menu="closeStudentMenu"
		/>

		<section
			id="student-menu-content"
			class="student-menu-content"
			role="region"
			aria-label="Student menu content"
			title="Student menu content"
			data-container-name="student-menu-content"
		>
			<CalendarView v-if="activeStudentTab === 'calendar'" />
		</section>
	</main>
</template>
