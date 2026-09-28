/** Full-screen rewards destination and background asset pipeline. */
<script setup>
import { ref } from "vue";
import rewardsBackground from "../../assets/images/backgrounds/rewardsMenu02.webp";
import rewardChest from "../../assets/images/rewards/minecraftChest01.webp";
import rewardChestHover from "../../assets/images/rewards/minecraftChest02.webp";
import rewardChestClicked from "../../assets/images/rewards/minecraftChest03.webp";
import rewardJournal from "../../assets/images/rewards/journal01.webp";
import rewardBookOpening from "../../assets/animations/Sequence02.webm";
import rewardBookOpeningCaptions from "../../assets/animations/bookOpeningCaptions.vtt";

const emit = defineEmits(["back-to-student-menu"]);
const isRewardChestHovered = ref(false);
const isRewardChestClicked = ref(false);
const rewardSequenceStage = ref("idle");
const rewardsBackgroundImage = `url("${rewardsBackground}")`;

/** Rewards-page return pipeline boundary. */
function handleRewardsPageBack() {
	emit("back-to-student-menu");
}

/** Starts the one-time journal reveal for the current rewards-page visit. */
function handleRewardChestClick() {
	if (rewardSequenceStage.value !== "idle") {
		return;
	}

	isRewardChestClicked.value = true;
	rewardSequenceStage.value = "journal";
}

/** Hands the reveal from the arriving journal to the opening-book video. */
function handleRewardJournalArrival() {
	rewardSequenceStage.value = "video";
}

/** Keeps the video's final frame visible and moves it beside the chest. */
function handleRewardBookAnimationEnded() {
	rewardSequenceStage.value = "complete";
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
		<button
			id="rewards-page-chest-button"
			class="rewards-page-chest-button"
			type="button"
			name="rewards-page-chest-button"
			data-button-name="rewards-page-chest-button"
			aria-label="Open reward chest"
			title="Open reward chest"
			@mouseenter="isRewardChestHovered = true"
			@click="handleRewardChestClick"
			@mouseleave="isRewardChestHovered = false"
			@focus="isRewardChestHovered = true"
			@blur="isRewardChestHovered = false"
		>
			<img
				class="rewards-page-chest"
				:src="
					isRewardChestClicked
						? rewardChestClicked
						: isRewardChestHovered
							? rewardChestHover
							: rewardChest
				"
				alt=""
			/>
		</button>
		<div
			v-if="rewardSequenceStage !== 'idle'"
			class="rewards-page-book-stage"
			:class="{ 'rewards-page-book-stage--settled': rewardSequenceStage === 'complete' }"
		>
			<img
				v-if="rewardSequenceStage === 'journal'"
				class="rewards-page-journal"
				:src="rewardJournal"
				alt="Explorer's journal"
				@animationend="handleRewardJournalArrival"
			/>
			<video
				v-else
				class="rewards-page-book-animation"
				:src="rewardBookOpening"
				autoplay
				muted
				playsinline
				preload="auto"
				aria-label="Explorer's journal opening"
				@ended="handleRewardBookAnimationEnded"
			>
				<track
					kind="captions"
					:src="rewardBookOpeningCaptions"
					srclang="en"
					label="No dialogue"
					default
				/>
			</video>
		</div>
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
	z-index: 4;
}

.rewards-page-chest-button {
	position: absolute;
	left: 50%;
	top: 50%;
	width: min(72vw, 32rem);
	padding: 0;
	border: 0;
	background: transparent;
	transform: translate(-50%, -50%) scale(1.3);
	cursor: pointer;
	z-index: 1;
}

.rewards-page-chest {
	display: block;
	width: 100%;
	max-height: 68svh;
	object-fit: contain;
}

.rewards-page-book-stage {
	position: absolute;
	left: 50%;
	top: 50%;
	width: min(64vw, 42rem);
	aspect-ratio: 16 / 9;
	transform: translate(-50%, -50%);
	transition:
		left 700ms ease,
		top 700ms ease,
		width 700ms ease;
	pointer-events: none;
	z-index: 3;
}

.rewards-page-book-stage--settled {
	left: 24%;
	top: 56%;
	width: min(40vw, 30rem);
}

.rewards-page-journal,
.rewards-page-book-animation {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.rewards-page-journal {
	animation: rewards-journal-emerge 1400ms cubic-bezier(0.16, 0.84, 0.3, 1) forwards;
}

@keyframes rewards-journal-emerge {
	0% {
		opacity: 0;
		transform: translateY(10%) scale(0.06) rotate(-720deg);
	}

	18% {
		opacity: 1;
	}

	100% {
		opacity: 1;
		transform: translateY(0) scale(1) rotate(0);
	}
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

@media (prefers-reduced-motion: reduce) {
	.rewards-page-book-stage {
		transition: none;
	}

	.rewards-page-journal {
		animation-duration: 1ms;
	}
}
</style>
