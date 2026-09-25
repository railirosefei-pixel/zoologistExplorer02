/** Home view for the student entry point and its background pipeline. */
<script setup>
import homePageBackground from "../../assets/images/backgrounds/vetClinicNight.webp";

const emit = defineEmits(["open-student-menu"]);
const homePageBackgroundImage = `url("${homePageBackground}")`;

/** Audio feedback pipeline boundary for home navigation. */
function playAudioFeedback() {
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

/** Home navigation event pipeline boundary. */
function handleHomeNavigation() {
	emit("open-student-menu");
	playAudioFeedback();
}
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
			role="region"
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
				@click="handleHomeNavigation"
			>
				Student
			</button>
		</section>
	</main>
</template>

<style scoped>
.home-page-shell {
	background-image: v-bind(homePageBackgroundImage);
}
</style>
