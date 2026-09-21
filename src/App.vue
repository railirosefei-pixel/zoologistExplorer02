<script setup>
import { ref } from "vue";

const isAdultMenuOpen = ref(false);
const isSchedulePanelVisible = ref(false);

function toggleAdultMenu() {
	isAdultMenuOpen.value = !isAdultMenuOpen.value;
}

function showSchedulePlan() {
	isSchedulePanelVisible.value = true;
}
</script>

<template>
	<main class="app-shell">
		<header class="site-header">
			<a class="brand" href="./" aria-label="cTeacher home">cTeacher</a>
			<button
				id="adult-menu-button"
				class="button button-secondary"
				type="button"
				:aria-expanded="isAdultMenuOpen"
				@click="toggleAdultMenu"
			>
				Adult Menu
			</button>
		</header>

		<section class="hero" aria-labelledby="welcome-heading">
			<p class="eyebrow">A calmer teaching workspace</p>
			<h1 id="welcome-heading">Learn, guide, and grow with clarity.</h1>
			<p class="hero-copy">
				Keep plans, routines, and next steps in one focused place.
			</p>
		</section>

		<nav
			id="adult-menu"
			class="menu-panel"
			aria-label="Adult menu"
			:hidden="!isAdultMenuOpen"
		>
			<button
				id="schedule-plan-button"
				class="menu-item"
				type="button"
				@click="showSchedulePlan"
			>
				Schedule Plan
			</button>
		</nav>

		<section
			id="schedule-panel"
			class="content-panel"
			aria-labelledby="schedule-heading"
			:hidden="!isSchedulePanelVisible"
		>
			<div>
				<p class="eyebrow">Planning</p>
				<h2 id="schedule-heading">Schedule Plan</h2>
				<p>Choose a day to shape the rhythm of your week.</p>
			</div>
			<button id="schedule-calendar-button" class="schedule-calendar-button" type="button">
				Open calendar
			</button>
		</section>
	</main>
</template>