<script setup>
/**
 * Parent > Student Edits screen. Hosts the Curriculum Game and Block Edits
 * sidebar controls plus the Block Edits day panel, which mirrors the
 * completion state of the Student daily-menu blocks for the active day only.
 */
import { computed, ref } from "vue";
import { blockCompletionStore } from "../js/blockCompletionState.js";

const emit = defineEmits(["open-curriculum-game", "back-to-parent", "go-home"]);
const isBlockEditsOpen = ref(false);

/** Block subjects shown per day, mirroring the Student daily-menu blocks. */
const blockEditsSubjects = [
	{ key: "math", label: "Math" },
	{ key: "language-arts", label: "Language Arts" },
	{ key: "social-studies", label: "Social Studies" },
	{ key: "science", label: "Science" },
	{ key: "art", label: "Art" },
];

const blockEditsBlocksPerSubject = [1, 2, 3];

const blockEditsTodayLabel = computed(() => blockCompletionStore.getTodayInfo().label);

function blockEditsIsComplete(subjectKey, blockNumber) {
	return blockCompletionStore.isBlockCompleteForDate(
		blockEditsTodayLabel.value,
		subjectKey,
		blockNumber,
	);
}

function handleCurriculumGameNavigation() {
	emit("open-curriculum-game");
}

function handleBlockEditsToggle() {
	isBlockEditsOpen.value = !isBlockEditsOpen.value;
}

/** Toggle a Block Edits entry for today only. */
function handleBlockEditsCompleteToggle(subjectKey, blockNumber) {
	const todayLabel = blockEditsTodayLabel.value;
	if (blockEditsIsComplete(subjectKey, blockNumber)) {
		blockCompletionStore.markBlockIncomplete(todayLabel, subjectKey, blockNumber);
	} else {
		blockCompletionStore.markBlockComplete(todayLabel, subjectKey, blockNumber);
	}
}

function handleStudentEditsScreenClose() {
	emit("back-to-parent");
}

function handleStudentEditsScreenHome() {
	emit("go-home");
}
</script>

<template>
	<main
		id="student-edits-screen"
		class="student-edits-screen"
		role="main"
		aria-label="Student Edits screen"
		title="Student Edits screen"
	>
		<aside
			id="student-edits-sidebar"
			class="student-edits-sidebar"
			role="complementary"
			aria-label="Student Edits sidebar"
			title="Student Edits sidebar"
		>
			<button
				id="curriculum-game-button"
				class="curriculum-game-button"
				type="button"
				name="curriculum-game-button"
				data-button-name="curriculum-game-button"
				aria-label="Open Curriculum Game"
				title="Open Curriculum Game"
				@click="handleCurriculumGameNavigation"
			>
				Curriculum Game
			</button>
			<button
				id="block-edits-button"
				class="block-edits-button"
				type="button"
				name="block-edits-button"
				data-button-name="block-edits-button"
				aria-label="Open Block Edits"
				title="Open Block Edits"
				@click="handleBlockEditsToggle"
			>
				Block Edits
			</button>
		</aside>
		<section
			v-if="isBlockEditsOpen"
			id="block-edits-panel"
			class="block-edits-panel"
			role="region"
			aria-label="Block Edits"
			title="Block Edits"
		>
			<h2 class="block-edits-panel-heading">Block Edits</h2>
			<p class="block-edits-panel-date">{{ blockEditsTodayLabel }}</p>
			<div class="block-edits-subject-list">
				<section
					v-for="subject in blockEditsSubjects"
					:id="`block-edits-subject-${subject.key}-section`"
					:key="subject.key"
					class="block-edits-subject-section"
					role="region"
					:aria-label="`${subject.label} blocks`"
					:title="`${subject.label} blocks`"
				>
					<h3 class="block-edits-subject-heading">{{ subject.label }}</h3>
					<div class="block-edits-block-list">
						<button
							v-for="blockNumber in blockEditsBlocksPerSubject"
							:id="`block-edits-panel-${subject.key}-block-${blockNumber}-complete-control`"
							:key="blockNumber"
							class="block-edits-block-complete-control"
							:class="{
								'block-edits-block-complete-control--complete':
									blockEditsIsComplete(subject.key, blockNumber),
							}"
							type="button"
							:name="`block-edits-panel-${subject.key}-block-${blockNumber}-complete-control`"
							:data-button-name="`block-edits-panel-${subject.key}-block-${blockNumber}-complete-control`"
							:aria-label="`Block Edits toggle ${subject.label} Block ${blockNumber}`"
							:aria-pressed="blockEditsIsComplete(subject.key, blockNumber)"
							@click="handleBlockEditsCompleteToggle(subject.key, blockNumber)"
						>
							Block {{ blockNumber }}
						</button>
					</div>
				</section>
			</div>
		</section>
		<button
			id="student-edits-screen-home-button"
			class="student-edits-screen-home-button"
			type="button"
			name="student-edits-screen-home-button"
			data-button-name="student-edits-screen-home-button"
			aria-label="Return home"
			title="Return home"
			@click="handleStudentEditsScreenHome"
		>
			Home
		</button>
		<button
			id="student-edits-screen-back-button"
			class="student-edits-screen-back-button"
			type="button"
			name="student-edits-screen-back-button"
			data-button-name="student-edits-screen-back-button"
			aria-label="Back to parent"
			title="Back to parent"
			@click="handleStudentEditsScreenClose"
		>
			Back
		</button>
	</main>
</template>
