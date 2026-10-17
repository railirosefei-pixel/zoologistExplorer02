/** Rewards destination, earned-badge collection, and celebration pipeline. */
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import rewardsBackground from "../../assets/images/backgrounds/rewardsMenu02.webp";
import rewardChest from "../../assets/images/rewards/minecraftChest01.webp";
import rewardChestHover from "../../assets/images/rewards/minecraftChest02.webp";
import rewardChestClicked from "../../assets/images/rewards/minecraftChest03.webp";

const emit = defineEmits(["back-to-student-menu", "go-home"]);
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
const isBadgesMenuOpen = ref(Boolean(props.celebratingBadge));
const isBadgesButtonVisible = ref(Boolean(props.celebratingBadge));
const isBadgesButtonEmerging = ref(false);
const isBadgeAnimationActive = ref(false);
const isCelebratingBadgeHidden = ref(Boolean(props.celebratingBadge?.animate));
const isCelebrationChestVisible = ref(false);
const isCelebrationChestOpen = ref(false);
const isGoldBagHovered = ref(false);
const isGoldBagOpen = ref(false);
const isGoldCoinTotalVisible = ref(false);
const badgeAnimationTrackRef = ref(null);
const celebrationChestContainerRef = ref(null);
const rewardsBackgroundImage = `url("${rewardsBackground}")`;
const badgeImageElements = new Map();
let badgesButtonDelayTimerId = null;
let badgeAnimation = null;
let chestAnimation = null;

onMounted(async () => {
	if (
		props.celebratingBadge?.animate &&
		props.earnedBadges.some((badge) => badge.id === props.celebratingBadge.badge?.id)
	) {
		isCelebrationChestVisible.value = true;
		await nextTick();
		startCelebrationChestFadeIn();
	}
});

onBeforeUnmount(() => {
	clearBadgesButtonDelay();
	badgeAnimation?.cancel();
	chestAnimation?.cancel();
});

function clearBadgesButtonDelay() {
	if (badgesButtonDelayTimerId !== null) {
		window.clearTimeout(badgesButtonDelayTimerId);
		badgesButtonDelayTimerId = null;
	}
}

function setBadgeImageRef(element, badgeId) {
	if (element) {
		badgeImageElements.set(badgeId, element);
	} else {
		badgeImageElements.delete(badgeId);
	}
}

async function startBadgeAnimation() {
	const badgeId = props.celebratingBadge?.badge?.id;
	const targetImage = badgeImageElements.get(badgeId);
	const animationTrack = badgeAnimationTrackRef.value;
	const chestContainer = celebrationChestContainerRef.value;
	if (!targetImage || !animationTrack || !chestContainer) {
		throw new Error("The earned badge animation target is unavailable.");
	}

	targetImage.scrollIntoView({ block: "nearest", inline: "nearest" });
	await nextTick();
	const targetBounds = targetImage.getBoundingClientRect();
	const originBounds = animationTrack.getBoundingClientRect();
	const hoverTop = Math.max(16, targetBounds.top - 180);
	const targetX = targetBounds.left - originBounds.left;
	const targetY = targetBounds.top - originBounds.top;
	const hoverY = hoverTop - originBounds.top;
	const enlargedTransform = `translate(${targetX}px, ${hoverY}px) scale(2) rotate(1440deg)`;
	const landingTransform = `translate(${targetX}px, ${targetY}px) scale(1) rotate(1440deg)`;
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const duration = prefersReducedMotion ? 250 : 4500;
	const chestFadeDuration = prefersReducedMotion ? 250 : 3000;
	chestAnimation = chestContainer.animate(
		[{ opacity: 1 }, { opacity: 0 }],
		{
			duration: chestFadeDuration,
			easing: "linear",
			fill: "forwards",
		},
	);
	chestAnimation.onfinish = handleCelebrationChestFadeOutComplete;
	badgeAnimation = animationTrack.animate(
		prefersReducedMotion
			? [
					{ opacity: 0, transform: landingTransform },
					{ opacity: 1, transform: landingTransform },
				]
			: [
					{
						opacity: 1,
						transform: "translate(0, 0) scale(0.12) rotate(0deg)",
						offset: 0,
					},
					{ opacity: 1, transform: enlargedTransform, offset: 2 / 3 },
					{ opacity: 1, transform: landingTransform, offset: 1 },
				],
		{
			duration,
			easing: "linear",
			fill: "forwards",
		},
	);
	badgeAnimation.onfinish = handleBadgeAnimationComplete;
}

function startCelebrationChestFadeIn() {
	const chestContainer = celebrationChestContainerRef.value;
	if (!chestContainer) {
		throw new Error("The earned badge celebration chest is unavailable.");
	}

	const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		? 250
		: 3000;
	chestAnimation = chestContainer.animate(
		[{ opacity: 0 }, { opacity: 1 }],
		{
			duration,
			easing: "linear",
			fill: "both",
		},
	);
	chestAnimation.onfinish = handleCelebrationChestFadeInComplete;
}

async function handleCelebrationChestFadeInComplete() {
	chestAnimation = null;
	if (!isBadgesMenuOpen.value) {
		return;
	}

	isCelebrationChestOpen.value = true;
	isBadgeAnimationActive.value = true;
	await nextTick();
	await startBadgeAnimation();
}

function handleCelebrationChestFadeOutComplete() {
	isCelebrationChestVisible.value = false;
	chestAnimation = null;
}

function cancelBadgeAnimation() {
	if (badgeAnimation && badgeAnimation.playState !== "finished") {
		badgeAnimation.cancel();
	}
	if (chestAnimation && chestAnimation.playState !== "finished") {
		chestAnimation.cancel();
	}
	badgeAnimation = null;
	chestAnimation = null;
	isBadgeAnimationActive.value = false;
	isCelebratingBadgeHidden.value = false;
	isCelebrationChestVisible.value = false;
	isCelebrationChestOpen.value = false;
}

function closeBadgesMenu() {
	isBadgesMenuOpen.value = false;
	cancelBadgeAnimation();
}

/** Rewards-page return pipeline boundary. */
function handleRewardsPageBack() {
	if (isBadgesMenuOpen.value) {
		closeBadgesMenu();
		return;
	}
	emit("back-to-student-menu");
}

function handleRewardsPageHome() {
	emit("go-home");
}

function handleBadgesToggle() {
	if (isBadgesMenuOpen.value) {
		closeBadgesMenu();
		return;
	}
	isBadgesMenuOpen.value = true;
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

/** Reveals the Badges control after the gold bag finishes emerging. */
function handleGoldBagAnimationComplete() {
	if (isBadgesButtonVisible.value || badgesButtonDelayTimerId !== null) {
		return;
	}

	badgesButtonDelayTimerId = window.setTimeout(() => {
		badgesButtonDelayTimerId = null;
		isBadgesButtonVisible.value = true;
		isBadgesButtonEmerging.value = true;
	}, 500);
}

/** Reveals the total after the final coin finishes spilling. */
function handleGoldCoinSpillComplete() {
	isGoldCoinTotalVisible.value = true;
}

/** Reveals the earned badge after its arrival animation. */
function handleBadgeAnimationComplete() {
	isBadgeAnimationActive.value = false;
	isCelebratingBadgeHidden.value = false;
	isCelebrationChestVisible.value = false;
	badgeAnimation = null;
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
				:aria-label="
					isBadgesMenuOpen ? 'Back to Rewards menu' : 'Back to student menu'
				"
				:title="isBadgesMenuOpen ? 'Back to Rewards menu' : 'Back to student menu'"
				@click="handleRewardsPageBack"
			>
				Back
			</button>
		</header>
		<button
			v-if="isBadgesButtonVisible && !isBadgesMenuOpen"
			id="rewards-page-badges-button"
			class="rewards-page-badges-toggle"
			:class="{
				'rewards-page-badges-toggle--pressed': isBadgesMenuOpen,
				'rewards-page-badges-toggle--emerging': isBadgesButtonEmerging,
			}"
			type="button"
			aria-label="Badges"
			title="Badges"
			:aria-pressed="isBadgesMenuOpen"
			@click="handleBadgesToggle"
		>
			Badges
		</button>
		<button
			v-if="isBadgesMenuOpen"
			id="rewards-page-home-button"
			class="rewards-page-home-button navigation-home-button"
			type="button"
			aria-label="Back to home page"
			title="Back to home page"
			@click="handleRewardsPageHome"
		>
			Home
		</button>
		<aside
			v-if="isBadgesMenuOpen"
			id="rewards-page-badge-menu"
			class="rewards-page-badge-menu"
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
							isCelebratingBadgeHidden &&
							props.celebratingBadge?.badge?.id === badge.id,
					}"
				>
					<img
						:ref="(element) => setBadgeImageRef(element, badge.id)"
						class="rewards-page-badge-image"
						:class="{
							'rewards-page-badge-image--wide-artwork': badge.subject === 'math',
						}"
						:src="badge.src"
						:alt="badge.alt"
					/>
				</li>
			</ul>
			<p v-else class="rewards-page-badge-empty">
				Your earned badges will appear here
			</p>
		</aside>
		<div
			v-if="isBadgeAnimationActive && props.celebratingBadge?.badge"
			ref="badgeAnimationTrackRef"
			class="rewards-page-badge-animation-track"
		>
			<img
				class="rewards-page-badge-animation"
				:class="{
					'rewards-page-badge-animation--wide-artwork':
						props.celebratingBadge.badge.subject === 'math',
				}"
				:src="props.celebratingBadge.badge.src"
				alt=""
			/>
		</div>
		<div
			v-if="!isBadgesMenuOpen || isCelebrationChestVisible"
			id="rewards-page-chest-container"
			ref="celebrationChestContainerRef"
			class="rewards-page-chest-container"
			:class="{
				'rewards-page-chest-container--celebrating': isCelebrationChestVisible,
			}"
		>
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
						props.celebratingBadge
							? isCelebrationChestOpen
								? rewardChestClicked
								: rewardChest
							: isRewardChestClicked
								? rewardChestClicked
								: isRewardChestHovered
									? rewardChestHover
									: rewardChest
					"
					alt=""
				/>
			</button>
			<div v-if="isRewardChestClicked" class="rewards-page-gold-reward">
				<button
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
					@animationend.self="handleGoldBagAnimationComplete"
					@click="handleGoldBagClick"
				>
					<span class="rewards-page-gold-bag-neck" aria-hidden="true" />
					<span class="rewards-page-gold-bag-body" aria-hidden="true" />
					<span class="rewards-page-gold-bag-tie" aria-hidden="true" />
					<span
						v-if="isGoldBagOpen"
						class="rewards-page-gold-coins"
						aria-hidden="true"
					>
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
			</div>
		</div>
	</main>
</template>

<style scoped>
.rewards-page {
	--rewards-chest-half-width: min(46.8vw, 21rem, max(0px, calc(50vw - 481px)));
	--rewards-chest-width: calc(
		var(--rewards-chest-half-width) + var(--rewards-chest-half-width)
	);
	--rewards-gold-bag-size: clamp(4rem, 12vw, 9rem);
	height: 100svh;
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
	z-index: 1000;
}

.rewards-page-chest-container {
	position: absolute;
	left: 50%;
	top: 50%;
	width: var(--rewards-chest-width);
	transform: translate(-50%, -50%);
	z-index: 1;
}

.rewards-page-chest-button {
	display: block;
	position: relative;
	width: 100%;
	padding: 0;
	border: 0;
	background: transparent;
	cursor: pointer;
}

.rewards-page-chest {
	display: block;
	width: 100%;
	max-height: 68svh;
	object-fit: contain;
}

.rewards-page-gold-reward {
	position: absolute;
	top: 50%;
	left: calc(100% + 1rem);
	width: var(--rewards-gold-bag-size);
	height: var(--rewards-gold-bag-size);
	transform: translateY(-50%);
}

.rewards-page-gold-bag {
	position: absolute;
	left: 50%;
	top: 0;
	width: 100%;
	aspect-ratio: 1;
	transform: translate(-50%, 0);
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
	top: calc(100% + 16px);
	left: 50%;
	width: max-content;
	max-width: calc(100vw - 2rem);
	transform: translateX(-50%);
	margin: 0;
	color: #ffe25b;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
	font-size: clamp(0.75rem, 2vw, 1.2rem);
	text-align: center;
	text-shadow:
		0 0 0.35rem #ffea00,
		0 0 0.8rem #d99600;
}

@keyframes rewards-gold-bag-emerge {
	0% {
		opacity: 0;
		z-index: 0;
		transform: translate(-50%, 0) translate(-26vw, -6vh) scale(0.12) rotate(-720deg);
	}

	18% {
		opacity: 1;
	}

	100% {
		opacity: 1;
		z-index: 2;
		transform: translate(-50%, 0) scale(1) rotate(0);
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

.rewards-page-badges-toggle {
	position: fixed;
	top: 50%;
	right: calc(50% + var(--rewards-chest-half-width) + 1rem);
	z-index: 1001;
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	box-shadow: none;
	transform: translateY(-50%);
	color: #ffe66d;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
	font-size: clamp(1.5rem, 3vw, 2.5rem);
	line-height: 1.2;
	text-shadow:
		0 1px 0 #b27614,
		0 2px 0 #96600f,
		0 3px 0 #75490b,
		0 5px 0 #593707,
		0 8px 6px rgba(27, 17, 2, 0.72);
	cursor: pointer;
	transition:
		filter 120ms ease,
		text-shadow 120ms ease;
}

.rewards-page-badges-toggle--emerging {
	animation: rewards-badges-toggle-emerge 600ms cubic-bezier(0.16, 0.84, 0.3, 1) both;
}

.rewards-page-badges-toggle:hover {
	filter: brightness(1.15);
}

.rewards-page-badges-toggle--pressed {
	transform: translateY(-50%);
	text-shadow:
		0 1px 0 #96600f,
		0 2px 0 #75490b,
		0 3px 0 #593707,
		0 4px 4px rgba(27, 17, 2, 0.72);
}

@keyframes rewards-badges-toggle-emerge {
	0% {
		opacity: 0;
		transform: translate(85%, -50%) scale(0.12) rotate(-720deg);
	}

	100% {
		opacity: 1;
		transform: translate(0, -50%) scale(1) rotate(0);
	}
}

.rewards-page-badge-menu {
	position: fixed;
	inset: 0;
	z-index: 10;
	box-sizing: border-box;
	min-height: 0;
	padding: 60px 16px 16px;
	overflow-x: hidden;
	overflow-y: auto;
	border-radius: 0;
	background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 35%, #e1bee7 70%, #d1c4e9 100%);
	box-shadow:
		inset 0 0 0 1px rgba(93, 58, 111, 0.52),
		0 0.75rem 1.5rem rgba(47, 25, 61, 0.36),
		inset 0 0.125rem 0 rgba(255, 255, 255, 0.9),
		inset 0 -0.25rem 0 rgba(89, 55, 105, 0.22);
}

.rewards-page-badge-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, 246px);
	grid-auto-rows: 246px;
	gap: 16px;
	align-content: start;
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
	position: static;
	top: auto;
	left: auto;
	z-index: auto;
	display: block;
	width: 246px;
	height: 246px;
	object-fit: contain;
}

.rewards-page-badge-image--wide-artwork {
	object-fit: cover;
	transform: none;
	animation: none;
}

.rewards-page-badge-empty {
	margin: 0;
	color: #3e2e4a;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
	font-size: clamp(0.75rem, 2vw, 1.5rem);
	line-height: 1.2;
	white-space: nowrap;
}

.rewards-page-chest-container--celebrating {
	z-index: 12;
}

.rewards-page-badge-animation-track {
	position: fixed;
	top: calc(50% - 123px);
	left: calc(50% - 123px);
	z-index: 13;
	width: 246px;
	height: 246px;
	pointer-events: none;
}

.rewards-page-badge-animation {
	position: static;
	top: auto;
	left: auto;
	z-index: auto;
	display: block;
	width: 246px;
	height: 246px;
	object-fit: contain;
	transform: none;
	animation: none;
}

.rewards-page-badge-animation--wide-artwork {
	object-fit: cover;
}

@media (prefers-reduced-motion: reduce) {
	.rewards-page-gold-bag {
		animation-duration: 1ms;
	}

	.rewards-page-badges-toggle--emerging {
		animation-duration: 1ms;
	}

	.rewards-page-gold-coin {
		animation-duration: 1ms;
		animation-delay: 0ms;
	}
}
</style>
