/** Full-screen rewards destination and background asset pipeline. */
<script setup>
import { ref } from "vue";
import rewardsBackground from "../../assets/images/backgrounds/rewardsMenu02.webp";
import rewardChest from "../../assets/images/rewards/minecraftChest01.webp";
import rewardChestHover from "../../assets/images/rewards/minecraftChest02.webp";
import rewardChestClicked from "../../assets/images/rewards/minecraftChest03.webp";

const emit = defineEmits(["back-to-student-menu"]);
const isRewardChestHovered = ref(false);
const isRewardChestClicked = ref(false);
const rewardsBackgroundImage = `url("${rewardsBackground}")`;

/** Rewards-page return pipeline boundary. */
function handleRewardsPageBack() {
	emit("back-to-student-menu");
}
</script>

<template>
	<main
		id="rewards-page"
		class="rewards-page"
		role="main"
		aria-label="Rewards page"
		title="Rewards page"
		data-page-name="rewards-page"
	>
		<header
			id="rewards-page-header"
			class="rewards-page-header"
			aria-label="Rewards page header"
			title="Rewards page header"
		>
			<button
				id="rewards-page-back-button"
				class="rewards-page-back-button"
				type="button"
				name="rewards-page-back-button"
				data-button-name="rewards-page-back-button"
				aria-label="Back to student menu"
				title="Back to student menu"
				@click="handleRewardsPageBack"
			>
				Back
			</button>
			<h1 id="rewards-page-heading" class="rewards-page-heading">Rewards</h1>
		</header>
		<img
			class="rewards-page-chest"
			:src="isRewardChestClicked ? rewardChestClicked : isRewardChestHovered ? rewardChestHover : rewardChest"
			alt="Minecraft reward chest"
			@mouseenter="isRewardChestHovered = true"
			@click="isRewardChestClicked = true"
			@mouseleave="isRewardChestHovered = false; isRewardChestClicked = false"
		/>
	</main>
</template>

<style scoped>
.rewards-page {
	min-height: 100vh;
	min-height: 100svh;
	position: relative;
	background-image: v-bind(rewardsBackgroundImage);
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
}

.rewards-page-header {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	position: relative;
	z-index: 1;
}

.rewards-page-chest {
	position: absolute;
	left: 50%;
	top: 50%;
	width: min(72vw, 32rem);
	max-height: 68svh;
	object-fit: contain;
	transform: translate(-50%, -50%) scale(1.3);
}

.rewards-page-back-button {
	min-height: 2.75rem;
	padding: 0.65rem 1rem;
	border: 1px solid rgba(255, 248, 190, 0.65);
	border-radius: 0.5rem;
	background: #282c30;
	color: #fff7cc;
	font: inherit;
	font-weight: 700;
	cursor: pointer;
}

.rewards-page-heading {
	margin: 0;
	color: #fff7cc;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
}
</style>