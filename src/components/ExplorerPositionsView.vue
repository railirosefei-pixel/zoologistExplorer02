<script setup>
const emit = defineEmits(["back-to-curriculum-game", "go-home"]);

function handleExplorerPositionsScreenClose() {
	emit("back-to-curriculum-game");
}

function handleExplorerPositionsScreenHome() {
	emit("go-home");
}
</script>

<template>
	<main
		id="explorer-positions-screen"
		class="explorer-positions-screen"
		role="main"
		aria-label="Explorer Positions screen"
		title="Explorer Positions screen"
	>
		<section
			id="explorer-positions-placeholder"
			class="explorer-positions-placeholder"
			role="region"
			aria-label="Explorer Positions"
			title="Explorer Positions"
		>
			<h1 class="explorer-positions-heading">Explorer Positions</h1>
		</section>
		<button
			id="explorer-positions-screen-home-button"
			class="explorer-positions-screen-home-button"
			type="button"
			name="explorer-positions-screen-home-button"
			data-button-name="explorer-positions-screen-home-button"
			aria-label="Return home"
			title="Return home"
			@click="handleExplorerPositionsScreenHome"
		>
			Home
		</button>
		<button
			id="explorer-positions-screen-back-button"
			class="explorer-positions-screen-back-button"
			type="button"
			name="explorer-positions-screen-back-button"
			data-button-name="explorer-positions-screen-back-button"
			aria-label="Back to Curriculum Game"
			title="Back to Curriculum Game"
			@click="handleExplorerPositionsScreenClose"
		>
			Back
		</button>
	</main>
</template>
