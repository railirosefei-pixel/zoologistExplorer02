/** Home view for the student entry point and its background pipeline. */
<script setup>
import { onMounted } from "vue";
import homePageBackground from "../../assets/images/backgrounds/vetClinicNight.webp";

defineEmits(["open-student-menu"]);

onMounted(() => {
	document.documentElement.style.setProperty(
		"--home-page-background-image",
		`url("${homePageBackground}")`,
	);
});
</script>

<template>
	<main
		id="home-page-shell"
		class="home-page-shell"
		role="main"
		aria-label="Student home page"
		title="Student home page"
		data-page-name="home-page-shell"
	>
		<section
			id="home-page-container"
			class="home-page-container"
			aria-label="Student home page container"
			title="Student home page container"
			data-container-name="home-page-container"
		>
			<button
				id="student-button"
				class="student-button"
				type="button"
				name="student-button"
				data-button-name="student-button"
				aria-label="Open student section"
				title="Open student section"
				@click="$emit('open-student-menu')"
			>
				Student
			</button>
		</section>
	</main>
</template>
