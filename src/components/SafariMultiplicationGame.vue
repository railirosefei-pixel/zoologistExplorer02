<script setup>
/** Safari multiplication game with randomized story problems and place-value counting. */
import { computed, onMounted, ref } from "vue";

const emit = defineEmits(["close", "complete"]);
const props = defineProps({
	useDoubleDigitFactor: { type: Boolean, default: false },
});

const maxXp = 100;
const themes = [
	{
		animal: "🐒",
		animalName: "Mischievous Monkeys",
		container: "Crates",
		containerSingular: "Crate",
		item: "Bananas",
		emoji: "🍌",
	},
	{
		animal: "🐘",
		animalName: "Stomping Elephants",
		container: "Baskets",
		containerSingular: "Basket",
		item: "Peanuts",
		emoji: "🥜",
	},
	{
		animal: "🦒",
		animalName: "Whispering Giraffes",
		container: "Branches",
		containerSingular: "Branch",
		item: "Leaves",
		emoji: "🍃",
	},
	{
		animal: "🦓",
		animalName: "Dazzling Zebras",
		container: "Patches",
		containerSingular: "Patch",
		item: "Tall Grass",
		emoji: "🌾",
	},
];
const placeBlocks = [
	{
		value: 100,
		label: "Hundreds",
		buttonClass: "border-yellow-700 bg-yellow-300 text-slate-950 hover:bg-yellow-200",
		countClass: "bg-yellow-500/20 text-yellow-700",
	},
	{
		value: 10,
		label: "Tens",
		buttonClass: "border-slate-500 bg-slate-300 text-slate-950 hover:bg-slate-200",
		countClass: "bg-slate-400/20 text-slate-300",
	},
	{
		value: 1,
		label: "Ones",
		buttonClass: "border-amber-900 bg-amber-800 text-white hover:bg-amber-700",
		countClass: "bg-amber-700/20 text-amber-500",
	},
];
const xpWidthClasses = [
	"w-0",
	"w-[10%]",
	"w-[20%]",
	"w-[30%]",
	"w-[40%]",
	"w-1/2",
	"w-[60%]",
	"w-[70%]",
	"w-[80%]",
	"w-[90%]",
	"w-full",
];
const xp = ref(0);
const problem = ref(null);
const currentNumber = ref(0);
const counts = ref({ 100: 0, 10: 0, 1: 0 });
const isWinDialogOpen = ref(false);
const targetNumber = computed(
	() => (problem.value?.factorA ?? 0) * (problem.value?.factorB ?? 0),
);
const feedbackText = computed(() =>
	currentNumber.value > targetNumber.value
		? "That is too many items. Reset your count and try again."
		: "",
);

onMounted(generateProblem);

function generateProblem() {
	const theme = themes[Math.floor(Math.random() * themes.length)];
	let minA = 1;
	let maxA = 5;
	let minB = 1;
	let maxB = 5;

	if (xp.value >= 70) {
		minA = 3;
		maxA = 9;
		minB = 3;
		maxB = 9;
	} else if (xp.value >= 30) {
		minA = 2;
		maxA = 9;
		minB = 2;
	}

	const factorA = props.useDoubleDigitFactor
		? Math.floor(Math.random() * 90) + 10
		: Math.floor(Math.random() * (maxA - minA + 1)) + minA;
	const factorB = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
	problem.value = { ...theme, factorA, factorB };
}

function addValue(value) {
	if (isWinDialogOpen.value) return;

	currentNumber.value += value;
	counts.value[value] += 1;

	if (currentNumber.value === targetNumber.value) {
		xp.value = Math.min(xp.value + 10, maxXp);
		isWinDialogOpen.value = true;
		if (xp.value === maxXp) {
			emit("complete");
		}
	}
}

function resetCurrent() {
	if (isWinDialogOpen.value) return;

	currentNumber.value = 0;
	counts.value = { 100: 0, 10: 0, 1: 0 };
}

function startNextQuest() {
	isWinDialogOpen.value = false;
	currentNumber.value = 0;
	counts.value = { 100: 0, 10: 0, 1: 0 };

	if (xp.value >= maxXp) xp.value = 0;
	generateProblem();
}
</script>

<template>
	<section
		id="safari-multiplication-game"
		class="fixed inset-4 z-50 overflow-y-auto rounded-2xl border-4 border-amber-700 bg-gradient-to-b from-sky-300 via-amber-100 to-amber-800 p-3 pt-12 text-slate-900 sm:p-5 sm:pt-14"
		role="dialog"
		aria-modal="true"
		aria-labelledby="safari-multiplication-title"
		title="Safari multiplication game"
	>
		<button
			id="safari-multiplication-back-button"
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
				id="safari-multiplication-game-header"
				class="w-full rounded-xl border-4 border-amber-600 bg-white/90 p-4 shadow-lg"
				aria-label="Safari multiplication game header"
				title="Safari multiplication game header"
			>
				<div class="mb-2 flex items-center justify-between gap-4">
					<h1
						id="safari-multiplication-title"
						class="text-lg font-bold text-amber-800 sm:text-2xl"
					>
						Raili's Bestiary
					</h1>
					<span class="text-2xl" aria-hidden="true">{{ problem?.animal }}</span>
				</div>
				<div>
					<div class="mb-1 flex justify-between text-sm font-bold text-slate-700">
						<span>Explorer XP</span>
						<span id="safari-multiplication-xp">{{ xp }} / {{ maxXp }}</span>
					</div>
					<div
						class="h-7 w-full overflow-hidden rounded border-4 border-slate-700 bg-slate-800"
						role="progressbar"
						aria-label="Explorer XP"
						:aria-valuenow="xp"
						aria-valuemin="0"
						:aria-valuemax="maxXp"
					>
						<div
							class="h-full bg-green-500 transition-[width] duration-500"
							:class="xpWidthClasses[xp / 10]"
						/>
					</div>
				</div>
			</header>

			<main
				id="safari-multiplication-game-main"
				class="flex w-full flex-grow flex-col items-center justify-center gap-4 sm:gap-6"
				role="main"
				aria-label="Safari multiplication activities"
				title="Safari multiplication activities"
			>
				<section
					id="safari-multiplication-story-panel"
					class="relative w-full overflow-hidden rounded-2xl border-4 border-emerald-700 bg-white/95 p-4 text-center shadow-xl sm:p-6"
					role="region"
					aria-labelledby="safari-multiplication-story"
					title="Multiplication story problem"
				>
					<span class="absolute -top-4 -left-4 text-6xl opacity-20" aria-hidden="true">
						🍃
					</span>
					<span class="absolute -right-4 -bottom-4 text-6xl opacity-20" aria-hidden="true">
						🍃
					</span>
					<h2
						id="safari-multiplication-story"
						class="relative mb-4 text-lg font-bold text-emerald-800 sm:text-xl"
					>
						The {{ problem?.animalName }} have {{ problem?.factorA }}
						{{ problem?.container.toLowerCase() }}. Each
						{{ problem?.containerSingular.toLowerCase() }} has
						{{ problem?.factorB }} {{ problem?.item.toLowerCase() }}. How many
						{{ problem?.item.toLowerCase() }} total?
					</h2>
					<div class="relative flex items-center justify-center gap-3 sm:gap-8">
						<div class="flex flex-col items-center">
							<span
								id="safari-multiplication-factor-a"
								class="font-mono text-4xl font-bold text-emerald-600 sm:text-6xl"
							>
								{{ problem?.factorA }}
							</span>
							<span class="mt-2 text-sm font-bold text-slate-500">
								{{ problem?.container }}
							</span>
						</div>
						<span class="font-mono text-3xl font-bold text-slate-400 sm:text-5xl">×</span>
						<div class="flex flex-col items-center">
							<span
								id="safari-multiplication-factor-b"
								class="font-mono text-4xl font-bold text-emerald-600 sm:text-6xl"
							>
								{{ problem?.factorB }}
							</span>
							<span class="mt-2 text-sm font-bold text-slate-500">{{ problem?.item }}</span>
						</div>
						<span class="font-mono text-3xl font-bold text-slate-400 sm:text-5xl">=</span>
						<div class="flex flex-col items-center">
							<span class="font-mono text-4xl font-bold text-slate-300 sm:text-6xl">?</span>
							<span class="mt-2 text-sm font-bold text-slate-500">Total</span>
						</div>
					</div>
				</section>

				<section
					id="safari-multiplication-count-panel"
					class="w-full rounded-2xl border-4 border-slate-900 bg-slate-800 p-4 text-center text-white shadow-xl sm:p-6"
					role="region"
					aria-label="Current number of items"
					title="Current number of items"
				>
					<h2 class="mb-2 text-base font-bold text-slate-300 sm:text-lg">
						Raili has counted:
					</h2>
					<p
						id="safari-multiplication-current"
						class="my-4 font-mono text-6xl font-bold transition-colors md:text-8xl"
						:class="currentNumber > targetNumber ? 'text-rose-500' : 'text-amber-400'"
						aria-live="polite"
					>
						{{ currentNumber }}
					</p>
					<div class="mt-4 grid grid-cols-3 gap-2 text-sm font-bold">
						<div
							v-for="block in placeBlocks"
							:key="block.value"
							:class="['rounded p-2', block.countClass]"
						>
							<span :id="`safari-multiplication-count-${block.value}`">
								{{ counts[block.value] }}
							</span>
							<br />
							{{ block.label }}
						</div>
					</div>
				</section>

				<div class="mt-2 grid w-full grid-cols-3 gap-3 md:gap-6">
					<button
						v-for="block in placeBlocks"
						:id="`safari-multiplication-add-${block.value}`"
						:key="block.value"
						:class="[
							'flex h-24 flex-col items-center justify-center rounded-xl border-4 p-4 shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.3),inset_4px_4px_0_rgba(255,255,255,0.4)] transition active:scale-95 md:h-32',
							block.buttonClass,
						]"
						type="button"
						:aria-label="`Add ${block.value} ${block.label.toLowerCase()}`"
						:disabled="isWinDialogOpen"
						@click="addValue(block.value)"
					>
						<span class="text-2xl font-bold md:text-3xl">+{{ block.value }}</span>
						<span class="mt-1 text-xs font-bold md:text-sm">{{ block.label }}</span>
					</button>
				</div>

				<p v-if="feedbackText" class="w-full text-center font-bold text-red-900" role="status">
					That is too many items. Reset your count and try again.
				</p>

				<button
					id="safari-multiplication-reset-button"
					class="mt-4 rounded-full border-4 border-red-700 bg-red-500 px-8 py-3 font-bold text-white shadow-lg transition hover:scale-105 hover:bg-red-600 active:scale-95"
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
			id="safari-multiplication-win-dialog"
			class="fixed inset-4 z-[70] flex items-center justify-center rounded-2xl bg-black/70 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="safari-multiplication-win-title"
		>
			<div
				class="mx-4 w-full max-w-md rounded-2xl border-4 border-amber-500 bg-white p-6 text-center shadow-2xl sm:p-8"
			>
				<p class="mb-3 text-4xl" aria-hidden="true">{{ problem?.animal }} {{ problem?.emoji }} ✨</p>
				<h2
					id="safari-multiplication-win-title"
					class="mb-4 text-2xl font-bold text-amber-800 sm:text-3xl"
				>
					{{ xp >= maxXp ? "Hooray!" : "Wackadoo!" }}
				</h2>
				<p class="mb-6 text-lg font-bold text-slate-700">
					{{
						xp >= maxXp
							? "You helped all the animals and mastered multiplication!"
							: `You correctly counted ${targetNumber} ${problem?.item.toLowerCase()}!`
					}}
				</p>
				<button
					id="safari-multiplication-next-button"
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
