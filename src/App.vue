/** Root shell for home and student navigation state. */
<script setup>
import { ref } from "vue";
import HomeView from "./components/HomeView.vue";
import StudentNavigation from "./components/StudentNavigation.vue";
import CalendarView from "./components/CalendarView.vue";

const isStudentMenuOpen = ref(false);
const activeStudentTab = ref("calendar");

function playStudentButtonSound() {
	const audioContext = new AudioContext();
	const now = audioContext.currentTime;
	const bellPartials = [
		{ frequency: 880, duration: 0.9, volume: 0.16 },
		{ frequency: 1320, duration: 0.65, volume: 0.1 },
	];
	let endedPartials = 0;

	for (const partial of bellPartials) {
		const gain = audioContext.createGain();
		const oscillator = audioContext.createOscillator();

		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(partial.frequency, now);
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(partial.volume, now + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + partial.duration);
		oscillator.connect(gain);
		gain.connect(audioContext.destination);
		oscillator.start(now);
		oscillator.stop(now + partial.duration);
		oscillator.addEventListener("ended", () => {
			endedPartials += 1;
			if (endedPartials === bellPartials.length) {
				audioContext.close();
			}
		});
	}
}

function openStudentMenu() {
	isStudentMenuOpen.value = true;
	activeStudentTab.value = "calendar";
	playStudentButtonSound();
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
			aria-label="Student menu content"
			title="Student menu content"
			data-container-name="student-menu-content"
		>
			<CalendarView v-if="activeStudentTab === 'calendar'" />
		</section>
	</main>
</template>
