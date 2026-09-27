<script setup>
const emit = defineEmits(["open-student-edits", "back-to-home"]);

function handleStudentEditsOpen() {
	emit("open-student-edits");
}

function handleParentScreenClose() {
	emit("back-to-home");
}
</script>

<template>
	<main
		id="parent-screen"
		class="parent-screen"
		role="main"
		aria-label="Parent screen"
		title="Parent screen"
	>
		<nav
			id="parent-screen-tab-rail"
			class="parent-screen-tab-rail"
			role="navigation"
			aria-label="Parent navigation"
			title="Parent navigation"
		>
			<button
				id="student-edits-tab"
				class="student-edits-tab"
				type="button"
				name="student-edits-tab"
				data-button-name="student-edits-tab"
				@click="handleStudentEditsOpen"
			>
				Student Edits
			</button>
		</nav>
		<button
			id="parent-screen-back-button"
			class="parent-screen-back-button"
			type="button"
			name="parent-screen-back-button"
			data-button-name="parent-screen-back-button"
			aria-label="Back to home"
			title="Back to home"
			@click="handleParentScreenClose"
		>
			Back
		</button>
	</main>
</template>
