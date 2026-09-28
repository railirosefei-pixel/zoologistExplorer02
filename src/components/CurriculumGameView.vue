<script setup>
defineProps({
	explorerPositionsModeActive: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle-explorer-positions-mode", "back-to-student-edits", "go-home"]);

function handleExplorerPositionsToggle() {
	emit("toggle-explorer-positions-mode");
}

function handleCurriculumGameScreenClose() {
	emit("back-to-student-edits");
}

function handleCurriculumGameScreenHome() {
	emit("go-home");
}
</script>

<template>
	<main
		id="curriculum-game-screen"
		class="curriculum-game-screen"
		role="main"
		aria-label="Curriculum Game screen"
		title="Curriculum Game screen"
	>
		<aside
			id="curriculum-game-sidebar"
			class="curriculum-game-sidebar"
			role="complementary"
			aria-label="Curriculum Game sidebar"
			title="Curriculum Game sidebar"
		>
			<button
				id="explorer-positions-button"
				class="explorer-positions-button"
				:class="{ 'explorer-positions-button--engaged': explorerPositionsModeActive }"
				type="button"
				name="explorer-positions-button"
				data-button-name="explorer-positions-button"
				aria-label="Toggle Explorer Positions"
				title="Toggle Explorer Positions"
				:aria-pressed="explorerPositionsModeActive"
				@click="handleExplorerPositionsToggle"
			>
				Explorer Positions
			</button>
		</aside>
		<button
			id="curriculum-game-screen-home-button"
			class="curriculum-game-screen-home-button"
			type="button"
			name="curriculum-game-screen-home-button"
			data-button-name="curriculum-game-screen-home-button"
			aria-label="Return home"
			title="Return home"
			@click="handleCurriculumGameScreenHome"
		>
			Home
		</button>
		<button
			id="curriculum-game-screen-back-button"
			class="curriculum-game-screen-back-button"
			type="button"
			name="curriculum-game-screen-back-button"
			data-button-name="curriculum-game-screen-back-button"
			aria-label="Back to student edits"
			title="Back to student edits"
			@click="handleCurriculumGameScreenClose"
		>
			Back
		</button>
	</main>
</template>
