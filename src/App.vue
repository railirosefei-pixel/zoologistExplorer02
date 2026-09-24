/** Root shell for home and student navigation state. */
<script setup>
import { ref } from "vue";
import HomeView from "./components/HomeView.vue";
import StudentNavigation from "./components/StudentNavigation.vue";
import CalendarView from "./components/CalendarView.vue";

const isStudentMenuOpen = ref(false);
const isParentMenuOpen = ref(false);
const isTextEditorMenuOpen = ref(false);
const activeStudentTab = ref("calendar");

/** Home navigation pipeline boundary. */
function handleStudentMenuOpen() {
	isStudentMenuOpen.value = true;
	isParentMenuOpen.value = false;
	isTextEditorMenuOpen.value = false;
	activeStudentTab.value = "calendar";
}

/** Parent menu navigation pipeline boundary. */
function handleParentMenuOpen() {
	isParentMenuOpen.value = true;
	isStudentMenuOpen.value = false;
	isTextEditorMenuOpen.value = false;
}

/** Text editor navigation pipeline boundary. */
function handleTextEditorMenuOpen() {
	isTextEditorMenuOpen.value = true;
	isParentMenuOpen.value = true;
}

/** Student-menu exit pipeline boundary. */
function handleStudentMenuClose() {
	isStudentMenuOpen.value = false;
	activeStudentTab.value = "calendar";
}

/** Student-menu tab navigation pipeline boundary. */
function handleCalendarTabOpen() {
	activeStudentTab.value = "calendar";
}
</script>

<template>
	<HomeView
		v-if="!isStudentMenuOpen && !isParentMenuOpen"
		@open-student-menu="handleStudentMenuOpen"
		@open-parent-menu="handleParentMenuOpen"
	/>

	<main
		v-else-if="isParentMenuOpen && !isTextEditorMenuOpen"
		id="parent-menu-page"
		class="parent-menu-page"
		role="main"
		aria-label="Parent menu"
		title="Parent menu"
		data-page-name="parent-menu-page"
	>
		<aside
			id="parent-menu-sidebar"
			class="parent-menu-sidebar"
			role="navigation"
			aria-label="Parent menu sidebar"
			title="Parent menu sidebar"
			data-container-name="parent-menu-sidebar"
		>
			<button
				id="text-editor-button"
				class="text-editor-button"
				type="button"
				name="text-editor-button"
				data-button-name="text-editor-button"
				aria-label="Open Text Editor"
				title="Open Text Editor"
				@click="handleTextEditorMenuOpen"
			>
				Text Editor
			</button>
		</aside>
	</main>

	<main
		v-else-if="isTextEditorMenuOpen"
		id="text-editor-menu-page"
		class="text-editor-menu-page"
		role="main"
		aria-label="Text Editor menu"
		title="Text Editor menu"
		data-page-name="text-editor-menu-page"
	>
		<aside
			id="text-editor-menu-sidebar"
			class="text-editor-menu-sidebar"
			role="navigation"
			aria-label="Text Editor menu sidebar"
			title="Text Editor menu sidebar"
			data-container-name="text-editor-menu-sidebar"
		>
			<button
				id="templates-button"
				class="templates-button"
				type="button"
				name="templates-button"
				data-button-name="templates-button"
				aria-label="Open Templates"
				title="Open Templates"
			>
				Templates
			</button>
			<button
				id="grid-button"
				class="grid-button"
				type="button"
				name="grid-button"
				data-button-name="grid-button"
				aria-label="Open Grid"
				title="Open Grid"
			>
				Grid
			</button>
		</aside>
	</main>

	<main
		v-else
		id="student-menu-page"
		class="student-menu-page"
		role="main"
		aria-label="Student menu"
		title="Student menu"
		data-page-name="student-menu-page"
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
		<StudentNavigation
			@open-calendar="handleCalendarTabOpen"
			@close-student-menu="handleStudentMenuClose"
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
