<script setup>
/** Safari place-value game adapted from the standalone mathGames01.html prototype. */
import { computed, onMounted, ref } from "vue";

const emit = defineEmits(["close"]);

const maxXp = 100;
const placeBlocks = [
	{
		value: 1000,
		label: "Thousands",
		buttonClass: "border-sky-700 bg-sky-300 text-slate-950 hover:bg-sky-200",
		countClass: "bg-sky-500/20",
	},
	{
		value: 100,
		label: "Hundreds",
		buttonClass: "border-yellow-700 bg-yellow-300 text-slate-950 hover:bg-yellow-200",
		countClass: "bg-yellow-500/20",
	},
	{
		value: 10,
		label: "Tens",
		buttonClass: "border-slate-500 bg-slate-300 text-slate-950 hover:bg-slate-200",
		countClass: "bg-slate-400/20",
	},
	{
		value: 1,
		label: "Ones",
		buttonClass: "border-amber-900 bg-amber-800 text-white hover:bg-amber-700",
		countClass: "bg-amber-700/20",
	},
];
const xp = ref(0);
const targetNumber = ref(0);
const currentNumber = ref(0);
const counts = ref({ 1000: 0, 100: 0, 10: 0, 1: 0 });
const isWinDialogOpen = ref(false);
const feedbackText = computed(() =>
	currentNumber.value > targetNumber.value
		? "That is too many leaves. Reset your count and try again."
		: "",
);

onMounted(generateTarget);

function generateTarget(previousTarget = null) {
	let minimum = 10;
	let maximum = 99;

	if (xp.value >= 50) {
		minimum = 1000;
		maximum = 9999;
	} else if (xp.value >= 20) {
		minimum = 100;
		maximum = 999;
	}

	const nextTarget = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
	targetNumber.value =
		nextTarget === previousTarget
			? nextTarget === maximum
				? minimum
				: nextTarget + 1
			: nextTarget;
}

function addValue(value) {
	if (isWinDialogOpen.value) return;

	currentNumber.value += value;
	counts.value[value] += 1;

	if (currentNumber.value === targetNumber.value) {
		xp.value = Math.min(xp.value + 10, maxXp);
		isWinDialogOpen.value = true;
	}
}

function resetCurrent() {
	currentNumber.value = 0;
	counts.value = { 1000: 0, 100: 0, 10: 0, 1: 0 };
	generateTarget(targetNumber.value);
}

function startNextQuest() {
	isWinDialogOpen.value = false;
	if (xp.value >= maxXp) xp.value = 0;
	resetCurrent();
}
</script>

<template>
	<section
		id="safari-place-value-game"
		class="fixed inset-4 z-50 overflow-y-auto rounded-2xl border-4 border-amber-700 bg-gradient-to-b from-sky-300 via-amber-100 to-amber-800 p-3 pt-12 text-slate-900 sm:p-5 sm:pt-14"
		role="dialog"
		aria-modal="true"
		aria-labelledby="safari-place-value-title"
		title="Safari place value game"
	>
		<button
			id="safari-place-value-back-button"
			class="navigation-back-button fixed top-4 right-4 z-[60] rounded-lg border-2 border-cyan-800 bg-white px-4 py-2 text-black"
			type="button"
			aria-label="Back to games"
			title="Back to games"
			@click="emit('close')"
		>
			Back to Games
		</button>

		<div
			class="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-between gap-4"
		>
			<header
				id="safari-place-value-game-header"
				class="w-full rounded-xl border-4 border-amber-600 bg-white/90 p-4 shadow-lg"
				aria-label="Safari place value game header"
				title="Safari place value game header"
			>
				<div class="mb-2 flex items-center justify-between gap-4">
					<h1
						id="safari-place-value-title"
						class="text-lg font-bold text-amber-800 sm:text-2xl"
					>
						Raili's Bestiary
					</h1>
					<span class="text-xl sm:text-2xl" aria-hidden="true">🦒 🦓 🐘</span>
				</div>
				<div>
					<div class="mb-1 flex justify-between text-sm font-bold text-slate-700">
						<span>Explorer XP</span>
						<span id="safari-place-value-xp">{{ xp }} / {{ maxXp }}</span>
					</div>
					<svg
						class="h-7 w-full overflow-hidden rounded border-4 border-slate-700 bg-slate-800"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
						role="progressbar"
						aria-label="Explorer XP"
						:aria-valuenow="xp"
						aria-valuemin="0"
						:aria-valuemax="maxXp"
					>
						<rect :width="xp" height="10" fill="#22c55e" />
					</svg>
				</div>
			</header>

			<main
				id="safari-place-value-game-main"
				class="flex w-full flex-grow flex-col items-center justify-center gap-4 sm:gap-6"
				role="main"
				aria-label="Safari place value activities"
				title="Safari place value activities"
			>
				<section
					id="safari-place-value-target-panel"
					class="w-full rounded-2xl border-4 border-emerald-700 bg-white/95 p-4 text-center shadow-xl sm:p-6"
					role="region"
					aria-labelledby="safari-place-value-target"
					title="Target number"
				>
					<h2 class="mb-2 text-base font-bold text-emerald-800 sm:text-xl">
						The Whispering Giraffes need exactly:
					</h2>
					<p
						id="safari-place-value-target"
						class="font-mono text-4xl font-bold text-emerald-600 sm:text-6xl"
						aria-live="polite"
					>
						{{ targetNumber.toLocaleString("en-US") }}
					</p>
					<p class="mt-2 font-bold text-emerald-700">Acacia Leaves 🍃</p>
				</section>

				<section
					id="safari-place-value-count-panel"
					class="w-full rounded-2xl border-4 border-slate-900 bg-slate-800 p-4 text-center text-white shadow-xl sm:p-6"
					role="region"
					aria-label="Current number of leaves"
					title="Current number of leaves"
				>
					<h2 class="mb-2 text-base font-bold sm:text-lg">Raili has gathered:</h2>
					<p
						id="safari-place-value-current"
						class="font-mono text-4xl font-bold text-amber-400 sm:text-6xl"
						aria-live="polite"
					>
						{{ currentNumber.toLocaleString("en-US") }}
					</p>
					<div
						class="mt-4 grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-4 sm:text-sm"
					>
						<div
							v-for="block in placeBlocks"
							:key="block.value"
							:class="['rounded p-2', block.countClass]"
						>
							<span :id="`safari-place-value-count-${block.value}`">{{
								counts[block.value]
							}}</span>
							{{ block.label }}
						</div>
					</div>
				</section>

				<div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
					<button
						v-for="block in placeBlocks"
						:id="`safari-place-value-add-${block.value}`"
						:key="block.value"
						:class="[
							'flex min-h-24 flex-col items-center justify-center rounded-xl border-4 p-3 shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.3),inset_4px_4px_0_rgba(255,255,255,0.4)] transition active:scale-95',
							block.buttonClass,
						]"
						type="button"
						:aria-label="`Add ${block.value} ${block.label.toLowerCase()}`"
						:disabled="isWinDialogOpen"
						@click="addValue(block.value)"
					>
						<span class="text-2xl font-bold">+{{ block.value }}</span>
						<span class="mt-1 text-sm">{{ block.label }}</span>
					</button>
				</div>

				<p
					v-if="feedbackText"
					class="w-full text-center font-bold text-red-900"
					role="status"
				>
					{{ feedbackText }}
				</p>

				<button
					id="safari-place-value-reset-button"
					class="rounded-full border-4 border-red-700 bg-red-500 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-red-600 active:scale-95"
					type="button"
					:disabled="isWinDialogOpen"
					@click="resetCurrent"
				>
					Oops! Start Over (Reset)
				</button>
			</main>
		</div>

		<div
			v-if="isWinDialogOpen"
			id="safari-place-value-win-dialog"
			class="fixed inset-4 z-[70] flex items-center justify-center rounded-2xl bg-black/70 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="safari-place-value-win-title"
		>
			<div
				class="w-full max-w-md rounded-2xl border-4 border-amber-500 bg-white p-6 text-center shadow-2xl sm:p-8"
			>
				<p class="mb-3 text-4xl" aria-hidden="true">🍃 🦒 ✨</p>
				<h2
					id="safari-place-value-win-title"
					class="mb-4 text-2xl font-bold text-amber-800 sm:text-3xl"
				>
					{{ xp >= maxXp ? "Hooray!" : "Wackadoo!" }}
				</h2>
				<p class="mb-6 text-lg text-slate-700">
					{{
						xp >= maxXp
							? "You filled your Bestiary and saved the Savanna!"
							: "You fed the giraffes!"
					}}
				</p>
				<button
					id="safari-place-value-next-button"
					class="w-full rounded-xl border-4 border-slate-700 bg-emerald-500 px-8 py-3 text-xl font-bold text-white shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.3),inset_4px_4px_0_rgba(255,255,255,0.4)]"
					type="button"
					@click="startNextQuest"
				>
					Next Quest!
				</button>
			</div>
		</div>
	</section>
</template>
