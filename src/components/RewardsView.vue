/** Full-screen rewards destination and background asset pipeline. */
<script setup>
import { computed, onMounted, ref } from "vue";
import rewardsBackground from "../../assets/images/backgrounds/rewardsMenu02.webp";
import rewardChest from "../../assets/images/rewards/minecraftChest01.webp";
import rewardChestHover from "../../assets/images/rewards/minecraftChest02.webp";
import rewardChestClicked from "../../assets/images/rewards/minecraftChest03.webp";

const emit = defineEmits(["back-to-student-menu", "badge-animation-complete"]);
const props = defineProps({
	goldCoinTotal: {
		type: Number,
		default: 0,
	},
	earnedBadges: {
		type: Array,
		default: () => [],
	},
	celebratingBadge: {
		type: Object,
		default: null,
	},
});
const isRewardChestHovered = ref(false);
const isRewardChestClicked = ref(false);
const isBadgeAnimationActive = ref(Boolean(props.celebratingBadge?.animate));
const isGoldBagHovered = ref(false);
const isGoldBagOpen = ref(false);
const isGoldCoinTotalVisible = ref(false);
const badgePanelRef = ref(null);
const rewardsBackgroundImage = `url("${rewardsBackground}")`;
const badgeLandingClassNames = [
	"rewards-page-badge-animation--slot-0",
	"rewards-page-badge-animation--slot-1",
	"rewards-page-badge-animation--slot-2",
	"rewards-page-badge-animation--slot-3",
	"rewards-page-badge-animation--slot-4",
	"rewards-page-badge-animation--slot-5",
	"rewards-page-badge-animation--slot-6",
	"rewards-page-badge-animation--slot-7",
	"rewards-page-badge-animation--slot-8",
	"rewards-page-badge-animation--slot-9",
	"rewards-page-badge-animation--slot-10",
	"rewards-page-badge-animation--slot-11",
	"rewards-page-badge-animation--slot-12",
	"rewards-page-badge-animation--slot-13",
	"rewards-page-badge-animation--slot-14",
	"rewards-page-badge-animation--slot-15",
	"rewards-page-badge-animation--slot-16",
	"rewards-page-badge-animation--slot-17",
	"rewards-page-badge-animation--slot-18",
	"rewards-page-badge-animation--slot-19",
];
const badgeLandingClass = computed(() => {
	const badgeId = props.celebratingBadge?.badge?.id;
	const slotIndex = props.earnedBadges.findIndex((badge) => badge.id === badgeId);
	return badgeLandingClassNames[Math.max(0, slotIndex)] ?? badgeLandingClassNames[0];
});

onMounted(() => {
	if (props.celebratingBadge?.animate) {
		const slotIndex = props.earnedBadges.findIndex(
			(badge) => badge.id === props.celebratingBadge.badge.id,
		);
		badgePanelRef.value?.scrollTo({ top: Math.floor(slotIndex / 3) * 262 });
	} else if (props.celebratingBadge) {
		emit("badge-animation-complete");
	}
});

/** Rewards-page return pipeline boundary. */
function handleRewardsPageBack() {
	emit("back-to-student-menu");
}

/** Opens the reward chest for the current rewards-page visit. */
function handleRewardChestClick() {
	if (isRewardChestClicked.value) {
		return;
	}

	isRewardChestClicked.value = true;
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

/** Reveals the earned badge in its collection after its arrival animation. */
function handleBadgeAnimationComplete() {
	isBadgeAnimationActive.value = false;
	emit("badge-animation-complete");
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
		<aside
			id="rewards-page-badge-panel"
			ref="badgePanelRef"
			class="rewards-page-badge-panel"
			aria-label="Earned badges"
			title="Earned badges"
		>
			<ul v-if="props.earnedBadges.length" class="rewards-page-badge-list">
				<li
					v-for="badge in props.earnedBadges"
					:key="badge.id"
					class="rewards-page-badge-item"
					:class="{
						'rewards-page-badge-item--hidden':
							isBadgeAnimationActive &&
							props.celebratingBadge?.badge?.id === badge.id,
					}"
				>
					<img
						class="rewards-page-badge-image"
						:class="{
							'rewards-page-badge-image--wide-artwork': badge.subject === 'math',
						}"
						:src="badge.src"
						:alt="badge.alt"
					/>
				</li>
			</ul>
			<p v-else class="rewards-page-badge-empty">Badges you earn will appear here.</p>
		</aside>
		<img
			v-if="isBadgeAnimationActive && props.celebratingBadge?.badge"
			class="rewards-page-badge-animation"
			:class="[
				badgeLandingClass,
				{
					'rewards-page-badge-animation--wide-artwork':
						props.celebratingBadge.badge.subject === 'math',
				},
			]"
			:src="props.celebratingBadge.badge.src"
			alt=""
			@animationend="handleBadgeAnimationComplete"
		/>
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
					props.celebratingBadge || isRewardChestClicked
						? rewardChestClicked
						: isRewardChestHovered
							? rewardChestHover
							: rewardChest
				"
				alt=""
			/>
		</button>
		<button
			v-if="isRewardChestClicked"
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
	left: calc(930px + 32px + (100% - 930px - 32px) / 2);
	top: 50%;
	width: min(93.6vw, 42rem, max(0px, calc(100vw - 962px)));
	padding: 0;
	border: 0;
	background: transparent;
	transform: translate(-50%, -50%);
	cursor: pointer;
	z-index: 1;
}

.rewards-page-badge-panel {
	position: absolute;
	top: auto;
	bottom: 16px;
	left: 1rem;
	z-index: 2;
	box-sizing: border-box;
	width: 930px;
	max-height: calc(100svh - 6rem);
	padding: 1rem;
	overflow-y: auto;
	border-radius: 0.5rem;
	background: #f1ddff;
	box-shadow: inset 0 0 0 2px #6b5136;
}

.rewards-page-badge-list {
	display: grid;
	grid-template-columns: repeat(3, 246px);
	gap: 1rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.rewards-page-badge-item {
	display: grid;
	width: 246px;
	height: 246px;
	place-items: center;
}

.rewards-page-badge-item--hidden {
	visibility: hidden;
}

.rewards-page-badge-image {
	display: block;
	width: 246px;
	height: 246px;
	object-fit: contain;
}

.rewards-page-badge-animation {
	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 5;
	width: 246px;
	height: 246px;
	object-fit: contain;
	transform-origin: center;
	animation: rewards-badge-emerge 2600ms cubic-bezier(0.18, 0.72, 0.25, 1) both;
}

.rewards-page-badge-image--wide-artwork,
.rewards-page-badge-animation--wide-artwork {
	object-fit: cover;
}

.rewards-page-badge-animation--slot-0 {
	--badge-landing-x: 32px;
	--badge-landing-y: min(96px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-1 {
	--badge-landing-x: 294px;
	--badge-landing-y: min(96px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-2 {
	--badge-landing-x: 556px;
	--badge-landing-y: min(96px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-3 {
	--badge-landing-x: 32px;
	--badge-landing-y: min(358px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-4 {
	--badge-landing-x: 294px;
	--badge-landing-y: min(358px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-5 {
	--badge-landing-x: 556px;
	--badge-landing-y: min(358px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-6 {
	--badge-landing-x: 32px;
	--badge-landing-y: min(620px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-7 {
	--badge-landing-x: 294px;
	--badge-landing-y: min(620px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-8 {
	--badge-landing-x: 556px;
	--badge-landing-y: min(620px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-9 {
	--badge-landing-x: 32px;
	--badge-landing-y: min(882px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-10 {
	--badge-landing-x: 294px;
	--badge-landing-y: min(882px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-11 {
	--badge-landing-x: 556px;
	--badge-landing-y: min(882px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-12 {
	--badge-landing-x: 32px;
	--badge-landing-y: min(1144px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-13 {
	--badge-landing-x: 294px;
	--badge-landing-y: min(1144px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-14 {
	--badge-landing-x: 556px;
	--badge-landing-y: min(1144px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-15 {
	--badge-landing-x: 32px;
	--badge-landing-y: min(1406px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-16 {
	--badge-landing-x: 294px;
	--badge-landing-y: min(1406px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-17 {
	--badge-landing-x: 556px;
	--badge-landing-y: min(1406px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-18 {
	--badge-landing-x: 32px;
	--badge-landing-y: min(1668px, calc(100svh - 114px));
}

.rewards-page-badge-animation--slot-19 {
	--badge-landing-x: 294px;
	--badge-landing-y: min(1668px, calc(100svh - 114px));
}

@keyframes rewards-badge-emerge {
	0% {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.12) rotate(0);
	}

	12% {
		opacity: 1;
	}

	52% {
		transform: translate(-50%, -50%) scale(3.2) rotate(1440deg);
	}

	65% {
		transform: translate(-50%, -50%) scale(3.2) rotate(1440deg);
	}

	100% {
		top: var(--badge-landing-y);
		left: var(--badge-landing-x);
		transform: scale(1) rotate(1440deg);
	}
}

.rewards-page-badge-empty {
	margin: 0;
	color: #3e2e4a;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
	font-size: 0.85rem;
	text-align: center;
}

.rewards-page-chest {
	display: block;
	width: 100%;
	max-height: 68svh;
	object-fit: contain;
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
	transition:
		top 220ms ease,
		transform 220ms ease;
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
	box-shadow:
		inset 0 0 0 4px #9a6a4b,
		inset 0 -0.35rem 0.6rem #27150e88,
		0 0.3rem 0 #352015;
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
	animation: rewards-gold-coin-spill 850ms cubic-bezier(0.2, 0.8, 0.3, 1) var(--coin-delay)
		forwards;
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
	text-shadow:
		0 0 0.35rem #ffea00,
		0 0 0.8rem #d99600;
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
		transform: translate(calc(-50% + var(--coin-x)), calc(-50% + var(--coin-y))) scale(1)
			rotate(720deg);
	}
}

.rewards-page-heading {
	margin: 0;
	color: #fff7cc;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
}

@media (prefers-reduced-motion: reduce) {
	.rewards-page-gold-bag {
		animation-duration: 1ms;
	}

	.rewards-page-badge-animation {
		animation-duration: 1ms;
	}

	.rewards-page-gold-coin {
		animation-duration: 1ms;
		animation-delay: 0ms;
	}
}
</style>
