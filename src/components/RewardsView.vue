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
const props = defineProps({
	goldCoinTotal: {
		type: Number,
		default: 0,
	},
});
const isRewardChestHovered = ref(false);
const isRewardChestClicked = ref(false);
const isGoldBagHovered = ref(false);
const isGoldBagOpen = ref(false);
const isGoldCoinTotalVisible = ref(false);
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

/** Opens the revealed pouch once and starts its coin-spill animation. */
function handleGoldBagClick() {
	if (isGoldBagOpen.value) {
		return;
	}

	isGoldBagOpen.value = true;
}

/** Reveals the total after the final coin finishes spilling. */
function handleGoldCoinSpillComplete() {
	isGoldCoinTotalVisible.value = true;
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
				class="rewards-page-back-button navigation-back-button"
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
		<button
			v-if="rewardSequenceStage === 'complete'"
			id="rewards-page-gold-bag-button"
			class="rewards-page-gold-bag"
			:class="{ 'rewards-page-gold-bag--uncinched': isGoldBagHovered || isGoldBagOpen }"
			type="button"
			aria-label="Gold cinch bag"
			:aria-expanded="isGoldBagOpen"
			@mouseenter="isGoldBagHovered = true"
			@mouseleave="isGoldBagHovered = false"
			@focus="isGoldBagHovered = true"
			@blur="isGoldBagHovered = false"
			@click="handleGoldBagClick"
		>
			<span class="rewards-page-gold-bag-neck" aria-hidden="true" />
			<span class="rewards-page-gold-bag-body" aria-hidden="true" />
			<span class="rewards-page-gold-bag-tie" aria-hidden="true" />
			<span v-if="isGoldBagOpen" class="rewards-page-gold-coins" aria-hidden="true">
				<span class="rewards-page-gold-coin rewards-page-gold-coin--one" />
				<span class="rewards-page-gold-coin rewards-page-gold-coin--two" />
				<span class="rewards-page-gold-coin rewards-page-gold-coin--three" />
				<span class="rewards-page-gold-coin rewards-page-gold-coin--four" />
				<span
					class="rewards-page-gold-coin rewards-page-gold-coin--five"
					@animationend="handleGoldCoinSpillComplete"
				/>
			</span>
		</button>
		<output v-if="isGoldCoinTotalVisible" class="rewards-page-gold-total">
			{{ props.goldCoinTotal }} gold coins
		</output>
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

.rewards-page-gold-bag {
	position: absolute;
	left: 76%;
	top: 56%;
	width: clamp(5rem, 12vw, 9rem);
	aspect-ratio: 1;
	transform: translate(-50%, -50%);
	z-index: 2;
	animation: rewards-gold-bag-emerge 1800ms cubic-bezier(0.16, 0.84, 0.3, 1) both;
	transition: filter 150ms ease;
	padding: 0;
	border: 0;
	background: transparent;
	cursor: pointer;
}

.rewards-page-gold-bag:hover {
	filter: drop-shadow(0 0 8px #ffea00) drop-shadow(0 0 18px #ffea00);
}

.rewards-page-gold-bag-neck {
	position: absolute;
	top: 15%;
	left: 29%;
	width: 42%;
	height: 26%;
	border-radius: 42% 42% 18% 18%;
	background: linear-gradient(110deg, #4b291c, #a36c48 48%, #603722);
	transition: top 220ms ease, transform 220ms ease;
}

.rewards-page-gold-bag--uncinched .rewards-page-gold-bag-neck {
	top: 7%;
	transform: rotate(-12deg) scaleY(0.78);
}

.rewards-page-gold-bag-body {
	position: absolute;
	left: 12%;
	bottom: 7%;
	width: 76%;
	height: 67%;
	border: 3px solid #392216;
	border-radius: 38% 38% 46% 46% / 28% 28% 56% 56%;
	background:
		repeating-linear-gradient(78deg, transparent 0 8px, #39221622 9px 10px),
		radial-gradient(ellipse at 36% 25%, #b27c57 0, #805337 46%, #4b2c1e 100%);
	box-shadow: inset 0 0 0 4px #9a6a4b, inset 0 -0.35rem 0.6rem #27150e88, 0 0.3rem 0 #352015;
}

.rewards-page-gold-bag-tie {
	position: absolute;
	top: 26%;
	left: 43%;
	width: 14%;
	height: 13%;
	border: 3px solid #4b291c;
	border-radius: 50% 50% 35% 35%;
	background: #bd8a5a;
	transition: transform 220ms ease;
}

.rewards-page-gold-bag--uncinched .rewards-page-gold-bag-tie {
	transform: translateY(-0.6rem) rotate(-24deg);
}

.rewards-page-gold-coins {
	position: absolute;
	left: 50%;
	top: 36%;
	width: 0;
	height: 0;
	pointer-events: none;
}

.rewards-page-gold-coin {
	position: absolute;
	top: 0;
	left: 0;
	width: 1.5rem;
	height: 0.8rem;
	border: 2px solid #a85e05;
	border-radius: 50%;
	background: radial-gradient(ellipse at 35% 25%, #fff8ad, #f6c638 62%, #c77908);
	box-shadow: inset 0 0 0 2px #f8d75f;
	animation: rewards-gold-coin-spill 850ms cubic-bezier(0.2, 0.8, 0.3, 1) var(--coin-delay) forwards;
}

.rewards-page-gold-coin--one {
	--coin-x: -3rem;
	--coin-y: -2rem;
	--coin-delay: 0ms;
}

.rewards-page-gold-coin--two {
	--coin-x: -1.5rem;
	--coin-y: -4rem;
	--coin-delay: 70ms;
}

.rewards-page-gold-coin--three {
	--coin-x: 1.3rem;
	--coin-y: -3.3rem;
	--coin-delay: 140ms;
}

.rewards-page-gold-coin--four {
	--coin-x: 2.8rem;
	--coin-y: -1.7rem;
	--coin-delay: 210ms;
}

.rewards-page-gold-coin--five {
	--coin-x: 0.4rem;
	--coin-y: -0.8rem;
	--coin-delay: 280ms;
}

.rewards-page-gold-total {
	position: absolute;
	left: 76%;
	top: 68%;
	width: min(38vw, 18rem);
	transform: translateX(-50%);
	margin: 0;
	color: #ffe25b;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
	font-size: 1.2rem;
	text-align: center;
	text-shadow: 0 0 0.35rem #ffea00, 0 0 0.8rem #d99600;
}

@keyframes rewards-gold-bag-emerge {
	0% {
		opacity: 0;
		z-index: 0;
		transform: translate(-50%, -50%) translate(-26vw, -6vh) scale(0.12) rotate(-720deg);
	}

	18% {
		opacity: 1;
	}

	100% {
		opacity: 1;
		z-index: 2;
		transform: translate(-50%, -50%) scale(1) rotate(0);
	}
}

@keyframes rewards-gold-coin-spill {
	0% {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.2) rotate(0);
	}

	15% {
		opacity: 1;
	}

	100% {
		opacity: 1;
		transform: translate(calc(-50% + var(--coin-x)), calc(-50% + var(--coin-y))) scale(1) rotate(720deg);
	}
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

	.rewards-page-gold-bag {
		animation-duration: 1ms;
	}

	.rewards-page-gold-coin {
		animation-duration: 1ms;
		animation-delay: 0ms;
	}
}
</style>
