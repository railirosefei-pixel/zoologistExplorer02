<script setup>
/** Student Games subject navigation and safari game launcher. */
import { ref } from "vue";
import artBackground from "../../assets/images/backgrounds/art(Background)01.webp";
import languageArtsBackground from "../../assets/images/backgrounds/languageArts(Background)01.webp";
import mathBackground from "../../assets/images/backgrounds/math(Background)01.webp";
import scienceBackground from "../../assets/images/backgrounds/science(Background)01.webp";
import socialStudiesBackground from "../../assets/images/backgrounds/socialStudies(Background)01.webp";
import { recordSafariMathGameCompletion } from "../js/gameExtraCreditState.js";
import SafariMultiplicationGame from "./SafariMultiplicationGame.vue";
import SafariPlaceValueGame from "./SafariPlaceValueGame.vue";

const props = defineProps({
	activeSubjectId: { type: String, default: "" },
	isGameEditsMode: { type: Boolean, default: false },
	layout: { type: String, default: "student" },
});

const emit = defineEmits([
	"close",
	"go-home",
	"subject-change",
	"first-math-game-completion",
	"reset-extra-credit",
]);
const activeGameId = ref("");
const isCompletionSaveFailed = ref(false);

const subjects = [
	{ id: "math", label: "Math" },
	{
		id: "language-arts",
		label: "Language Arts",
	},
	{
		id: "social-studies",
		label: "Social Studies",
	},
	{ id: "science", label: "Science" },
	{ id: "art", label: "Art" },
];

const subjectButtonClasses = {
	math: "student-games-subject-button--math",
	"language-arts": "student-games-subject-button--language-arts",
	"social-studies": "student-games-subject-button--social-studies",
	science: "student-games-subject-button--science",
	art: "student-games-subject-button--art",
};

const mathBackgroundImage = `url("${mathBackground}")`;
const languageArtsBackgroundImage = `url("${languageArtsBackground}")`;
const socialStudiesBackgroundImage = `url("${socialStudiesBackground}")`;
const scienceBackgroundImage = `url("${scienceBackground}")`;
const artBackgroundImage = `url("${artBackground}")`;

function toggleSubject(subjectId) {
	emit("subject-change", props.activeSubjectId === subjectId ? "" : subjectId);
}

/** Open a game only from the student-facing launcher, not its edits gallery. */
function openGame(gameId) {
	if (!props.isGameEditsMode) {
		activeGameId.value = gameId;
	}
}

function handleGameCompletion() {
	const gameId = activeGameId.value;
	try {
		const result = recordSafariMathGameCompletion(gameId);
		if (!result.isFirstCompletion) {
			isCompletionSaveFailed.value = false;
			return;
		}

		isCompletionSaveFailed.value = false;
		emit("first-math-game-completion");
	} catch (error) {
		isCompletionSaveFailed.value = true;
		console.error("Unable to save Safari Math game completion.", error);
	}
}
</script>

<template>
	<div
		class="student-games-view"
		:class="{
			'student-games-view--edits': props.isGameEditsMode,
			'student-games-view--parent': props.layout === 'parent',
		}"
	>
		<p
			v-if="isCompletionSaveFailed"
			class="fixed top-4 left-4 z-[80] max-w-[calc(100vw-2rem)] rounded border-2 border-rose-800 bg-rose-50 p-3 text-rose-950"
			role="alert"
		>
			This game completion could not be saved. Keep this page open and try again.
		</p>
		<template v-if="!activeGameId">
			<nav
				v-if="props.layout === 'student'"
				id="student-games-top-navigation"
				class="student-games-top-navigation"
				role="navigation"
				aria-label="Games subjects"
				title="Games subjects"
			>
				<button
					v-for="subject in subjects"
					:id="`student-games-subject-${subject.id}-button`"
					:key="subject.id"
					class="student-games-subject-button"
					:class="[
						subjectButtonClasses[subject.id],
						{
							'student-games-subject-button--active':
								props.activeSubjectId === subject.id,
						},
					]"
					type="button"
					:aria-label="subject.label"
					:aria-pressed="activeSubjectId === subject.id"
					@click="toggleSubject(subject.id)"
				/>
			</nav>

			<main
				v-if="!props.activeSubjectId || props.activeSubjectId === 'math'"
				:id="props.layout === 'parent' ? 'math-games-view' : 'student-games-gallery'"
				class="student-games-gallery"
				:class="{
					'student-games-gallery--parent bg-purple-950 text-white':
						props.layout === 'parent',
				}"
				role="main"
				:aria-label="props.layout === 'parent' ? 'Parent Math games' : 'Student games'"
				:title="props.layout === 'parent' ? 'Parent Math games' : 'Student games'"
			>
				<div class="student-games-card">
					<button
						id="student-safari-place-value-thumbnail"
						class="flex h-[248px] w-[218px] shrink-0 flex-col items-center gap-2 rounded-lg border-4 border-amber-700 bg-white p-2 text-center text-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-4 focus-visible:outline-amber-800"
						type="button"
						aria-label="Play Raili's Safari Place Value Adventure"
						title="Build numbers with thousands, hundreds, tens, and ones."
						:aria-disabled="props.isGameEditsMode"
						@click="openGame('safari-place-value')"
					>
						<span
							class="flex aspect-[218/148] w-full flex-col items-center justify-center gap-2 rounded bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-200 p-3"
							aria-hidden="true"
						>
							<span class="text-sm font-bold text-amber-900">Raili's Bestiary</span>
							<span class="text-3xl">🦒 🦓 🐘</span>
							<span
								class="rounded-lg bg-white/90 px-3 py-1 font-mono text-lg font-bold text-emerald-700"
							>
								1,248 🍃
							</span>
						</span>
						<span class="text-sm leading-4 font-bold">Safari Place Value Adventure</span>
						<span class="text-xs text-slate-600">Gather leaves for the giraffes!</span>
					</button>
					<button
						v-if="props.isGameEditsMode"
						id="student-game-extra-credit-reset-safari-place-value"
						class="student-games-extra-credit-reset-button"
						type="button"
						aria-label="Reset Extra Credit for Safari Place Value Adventure"
						@click="emit('reset-extra-credit', 'safari-place-value')"
					>
						Reset Extra Credit
					</button>
				</div>
				<div class="student-games-card">
					<button
						id="student-safari-multiplication-thumbnail"
						class="flex h-[248px] w-[218px] shrink-0 flex-col items-center gap-2 rounded-lg border-4 border-amber-700 bg-white p-2 text-center text-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-4 focus-visible:outline-amber-800"
						type="button"
						aria-label="Play Raili's Safari Multiplication Adventure (Single Digits)"
						title="Solve multiplication stories by gathering hundreds, tens, and ones."
						:aria-disabled="props.isGameEditsMode"
						@click="openGame('safari-multiplication')"
					>
						<span
							class="flex aspect-[218/148] w-full flex-col items-center justify-center gap-2 rounded bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-200 p-3"
							aria-hidden="true"
						>
							<span class="text-sm font-bold text-amber-900">Raili's Bestiary</span>
							<span class="text-3xl">🐒 🐘 🦒 🦓</span>
							<span
								class="rounded-lg bg-white/90 px-3 py-1 font-mono text-lg font-bold text-emerald-700"
							>
								3 × 4 = ?
							</span>
						</span>
						<span class="text-sm leading-4 font-bold">Safari Multiplication Adventure (Single Digits)</span>
						<span class="text-xs text-slate-600">Count items for the safari animals!</span>
					</button>
					<button
						v-if="props.isGameEditsMode"
						id="student-game-extra-credit-reset-safari-multiplication"
						class="student-games-extra-credit-reset-button"
						type="button"
						aria-label="Reset Extra Credit for Safari Multiplication Adventure (Single Digits)"
						@click="emit('reset-extra-credit', 'safari-multiplication')"
					>
						Reset Extra Credit
					</button>
				</div>
				<div class="student-games-card">
					<button
						id="student-safari-multiplication-double-digit-thumbnail"
						class="flex h-[248px] w-[218px] shrink-0 flex-col items-center gap-2 rounded-lg border-4 border-amber-700 bg-white p-2 text-center text-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-4 focus-visible:outline-amber-800"
						type="button"
						aria-label="Play Raili's Safari Multiplication Adventure (1 Double Digit)"
						title="Solve multiplication stories by gathering hundreds, tens, and ones."
						:aria-disabled="props.isGameEditsMode"
						@click="openGame('safari-multiplication-double-digit')"
					>
						<span
							class="flex aspect-[218/148] w-full flex-col items-center justify-center gap-2 rounded bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-200 p-3"
							aria-hidden="true"
						>
							<span class="text-sm font-bold text-amber-900">Raili's Bestiary</span>
							<span class="text-3xl">🐒 🐘 🦒 🦓</span>
							<span
								class="rounded-lg bg-white/90 px-3 py-1 font-mono text-lg font-bold text-emerald-700"
							>
								12 × 3 = ?
							</span>
						</span>
						<span class="text-sm leading-4 font-bold">Safari Multiplication Adventure (1 Double Digit)</span>
						<span class="text-xs text-slate-600">Count items for the safari animals!</span>
					</button>
					<button
						v-if="props.isGameEditsMode"
						id="student-game-extra-credit-reset-safari-multiplication-double-digit"
						class="student-games-extra-credit-reset-button"
						type="button"
						aria-label="Reset Extra Credit for Safari Multiplication Adventure (1 Double Digit)"
						@click="emit('reset-extra-credit', 'safari-multiplication-double-digit')"
					>
						Reset Extra Credit
					</button>
				</div>
			</main>

			<button
				v-if="props.layout === 'student' && !props.isGameEditsMode"
				id="student-games-home-button"
				class="student-games-home-button navigation-home-button rounded border-2 border-green-800 bg-white px-4 py-2 text-black"
				type="button"
				aria-label="Return home"
				title="Return home"
				@click="emit('go-home')"
			>
				Home
			</button>
			<button
				v-if="props.layout === 'student' && !props.isGameEditsMode"
				id="student-games-back-button"
				class="student-games-back-button navigation-back-button fixed right-4 bottom-4 z-50 rounded border-2 border-cyan-800 bg-white px-4 py-2 text-black"
				type="button"
				aria-label="Back to student menu"
				title="Back to student menu"
				@click="emit('close')"
			>
				Back
			</button>
		</template>
		<SafariPlaceValueGame
			v-else-if="activeGameId === 'safari-place-value'"
			@close="activeGameId = ''"
			@complete="handleGameCompletion"
		/>
		<SafariMultiplicationGame
			v-else-if="activeGameId === 'safari-multiplication'"
			@close="activeGameId = ''"
			@complete="handleGameCompletion"
		/>
		<SafariMultiplicationGame
			v-else-if="activeGameId === 'safari-multiplication-double-digit'"
			:use-double-digit-factor="true"
			@close="activeGameId = ''"
			@complete="handleGameCompletion"
		/>
	</div>
</template>

<style scoped>
.student-games-gallery {
	position: fixed;
	z-index: 10;
	top: 112px;
	right: 1rem;
	bottom: 2rem;
	left: calc(var(--student-menu-navigation-width) + 1rem);
	display: grid;
	grid-template-columns: repeat(auto-fit, 218px);
	align-content: start;
	gap: 16px;
	overflow-y: auto;
	padding: 1rem;
}

.student-games-gallery.student-games-gallery--parent {
	top: 132px;
	right: 1rem;
	bottom: 1rem;
	left: 234px;
	padding: 0;
}

@media (max-width: 48rem) {
	.student-games-gallery.student-games-gallery--parent {
		left: 141px;
	}
}

.student-games-card {
	display: contents;
}

.student-games-view--edits .student-games-card {
	display: flex;
	width: 218px;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

.student-games-extra-credit-reset-button {
	border: 2px solid #991b1b;
	border-radius: 9999px;
	background: #dc2626;
	padding: 0.5rem 1rem;
	color: #fff;
	font-weight: 700;
	box-shadow: 0 3px 0 #7f1d1d;
	cursor: pointer;
	transition:
		transform 120ms ease,
		box-shadow 120ms ease,
		filter 120ms ease;
}

.student-games-extra-credit-reset-button:hover {
	filter: brightness(1.08);
	transform: translateY(-1px);
}

.student-games-extra-credit-reset-button:active {
	transform: translateY(2px);
	box-shadow: 0 1px 0 #7f1d1d;
}

.student-games-top-navigation {
	position: fixed;
	z-index: 11;
	top: 0;
	right: 0;
	left: var(--student-menu-navigation-width);
	display: flex;
	align-items: center;
	gap: 8px;
	height: 96px;
	padding: 2px 16px 0;
	overflow-x: auto;
	background: #bfdafc;
	box-shadow:
		inset 0 4px 0 rgba(255, 255, 255, 0.55),
		inset 0 -5px 0 rgba(30, 50, 90, 0.24),
		0 6px 0 rgba(55, 80, 128, 0.52),
		0 9px 12px rgba(15, 23, 42, 0.2);
}

.student-games-subject-button {
	display: flex;
	flex: 1 0 132px;
	align-items: center;
	justify-content: center;
	min-width: 0;
	height: 24px;
	padding: 0 12px;
	border: 1px solid rgba(47, 68, 112, 0.7);
	border-radius: 999px;
	background-position: center;
	background-size: cover;
	color: #172033;
	font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif;
	font-size: 0.8rem;
	text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95);
	cursor: pointer;
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.85),
		inset 0 -3px 0 rgba(30, 50, 90, 0.28),
		0 6px 0 rgba(55, 80, 128, 0.7),
		0 9px 10px rgba(15, 23, 42, 0.25);
	transition:
		transform 120ms ease,
		box-shadow 120ms ease,
		filter 120ms ease;
}

.student-games-top-navigation .student-games-subject-button {
	flex: 0 0 136px;
	width: 136px;
	height: 64px;
}

.student-games-subject-button:hover {
	filter: brightness(1.08);
	transform: translateY(-1px);
}

.student-games-subject-button:active,
.student-games-subject-button--active {
	transform: translateY(3px);
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.72),
		inset 0 -2px 0 rgba(30, 50, 90, 0.32),
		0 2px 0 rgba(55, 80, 128, 0.7),
		0 4px 6px rgba(15, 23, 42, 0.2);
}

.student-games-subject-button--math {
	background-image: v-bind(mathBackgroundImage);
}

.student-games-subject-button--language-arts {
	background-image: v-bind(languageArtsBackgroundImage);
}

.student-games-subject-button--social-studies {
	background-image: v-bind(socialStudiesBackgroundImage);
}

.student-games-subject-button--science {
	background-image: v-bind(scienceBackgroundImage);
}

.student-games-subject-button--art {
	background-image: v-bind(artBackgroundImage);
}

@media (max-width: 48rem) {
	.student-games-top-navigation {
		gap: 4px;
		padding-right: 8px;
		padding-left: 8px;
	}

	.student-games-subject-button {
		flex-basis: 112px;
	}
}
</style>
