<script setup>
const emit = defineEmits(["open-explorer-positions", "back-to-student-edits", "go-home"]);

function handleExplorerPositionsOpen() {
	emit("open-explorer-positions");
}

function handleProgressGameScreenClose() {
	emit("back-to-student-edits");
}

function handleProgressGameScreenHome() {
	emit("go-home");
}
</script>

<template>
	<main
		id="progress-game-screen"
		class="progress-game-screen"
		role="main"
		aria-label="Progress Game screen"
		title="Progress Game screen"
	>
		<aside
			id="progress-game-sidebar"
			class="progress-game-sidebar"
			role="complementary"
			aria-label="Progress Game sidebar"
			title="Progress Game sidebar"
		>
			<button
				id="explorer-positions-button"
				class="explorer-positions-button"
				type="button"
				name="explorer-positions-button"
				data-button-name="explorer-positions-button"
				aria-label="Open Explorer Positions"
				title="Open Explorer Positions"
				@click="handleExplorerPositionsOpen"
			>
				Explorer Positions
			</button>
		</aside>
		<button
			id="progress-game-screen-home-button"
			class="progress-game-screen-home-button"
			type="button"
			name="progress-game-screen-home-button"
			data-button-name="progress-game-screen-home-button"
			aria-label="Return home"
			title="Return home"
			@click="handleProgressGameScreenHome"
		>
			Home
		</button>
		<button
			id="progress-game-screen-back-button"
			class="progress-game-screen-back-button"
			type="button"
			name="progress-game-screen-back-button"
			data-button-name="progress-game-screen-back-button"
			aria-label="Back to student edits"
			title="Back to student edits"
			@click="handleProgressGameScreenClose"
		>
			Back
		</button>
	</main>
</template>
