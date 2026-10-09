<script setup>
/** Student Games subject navigation and its inert month/year placeholders. */
import artBackground from "../../assets/images/backgrounds/art(Background)01.webp";
import languageArtsBackground from "../../assets/images/backgrounds/languageArts(Background)01.webp";
import mathBackground from "../../assets/images/backgrounds/math(Background)01.webp";
import scienceBackground from "../../assets/images/backgrounds/science(Background)01.webp";
import socialStudiesBackground from "../../assets/images/backgrounds/socialStudies(Background)01.webp";
import MathGamesView from "./MathGamesView.vue";

const props = defineProps({
	activeSubjectId: { type: String, default: "" },
});

const emit = defineEmits(["close", "go-home", "subject-change"]);

const subjects = [
	{ id: "math", label: "Math", imageClass: "student-games-subject-button--math" },
	{
		id: "language-arts",
		label: "Language Arts",
		imageClass: "student-games-subject-button--language-arts",
	},
	{
		id: "social-studies",
		label: "Social Studies",
		imageClass: "student-games-subject-button--social-studies",
	},
	{ id: "science", label: "Science", imageClass: "student-games-subject-button--science" },
	{ id: "art", label: "Art", imageClass: "student-games-subject-button--art" },
];

const mathBackgroundImage = `url("${mathBackground}")`;
const languageArtsBackgroundImage = `url("${languageArtsBackground}")`;
const socialStudiesBackgroundImage = `url("${socialStudiesBackground}")`;
const scienceBackgroundImage = `url("${scienceBackground}")`;
const artBackgroundImage = `url("${artBackground}")`;

function toggleSubject(subjectId) {
	emit("subject-change", props.activeSubjectId === subjectId ? "" : subjectId);
}
</script>

<template>
	<div
		class="student-games-view"
	>
		<nav
			id="student-games-top-navigation"
			class="student-games-top-navigation"
			aria-label="Games subjects"
		>
			<button
				v-for="subject in subjects"
				:id="`student-games-subject-${subject.id}-button`"
				:key="subject.id"
				class="student-games-subject-button"
				:class="[
					subject.imageClass,
					{ 'student-games-subject-button--active': props.activeSubjectId === subject.id },
				]"
				type="button"
				:aria-label="subject.label"
				:aria-pressed="activeSubjectId === subject.id"
				@click="toggleSubject(subject.id)"
			/>
		</nav>

		<MathGamesView
			v-show="!props.activeSubjectId"
			layout="student"
			@close="emit('close')"
			@go-home="emit('go-home')"
		/>
	</div>
</template>

<style scoped>
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
