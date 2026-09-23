/** Navigation controls for the student workspace. */
<script setup>
const emit = defineEmits(["open-calendar", "close-student-menu"]);

function handleOpenCalendar() {
	emit("open-calendar");
}

function handleCloseStudentMenu() {
	emit("close-student-menu");
}
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
			@click="handleOpenCalendar"
		>
			Calendar
		</button>
		<button
			id="student-menu-back-button"
			class="student-menu-back-button"
			type="button"
			name="student-menu-back-button"
			data-button-name="student-menu-back-button"
			aria-label="Back to home page"
			title="Back to home page"
			@click="handleCloseStudentMenu"
		>
			Back
		</button>
	</nav>
</template>
