/** Navigation controls for the student workspace. */
<script setup>
import { ref } from "vue";

const emit = defineEmits(["open-calendar"]);
const activeStudentMenu = ref("");

/** Student-menu navigation pipeline boundary for the calendar tab. */
function handleCalendarNavigation() {
	activeStudentMenu.value = "";
	emit("open-calendar");
}

/** Student sidebar submenu pipeline boundary. */
function handleStudentMenuNavigation(menuName) {
	activeStudentMenu.value = activeStudentMenu.value === menuName ? "" : menuName;
}
</script>

<template>
	<nav
		id="student-menu-navigation"
		class="student-menu-navigation"
		role="navigation"
		aria-label="Student menu navigation"
		title="Student menu navigation"
		data-container-name="student-menu-navigation"
	>
		<button
			id="calendar-tab"
			class="student-menu-calendar-tab"
			type="button"
			name="calendar-tab"
			data-button-name="calendar-tab"
			aria-label="Open Calendar tab"
			title="Open Calendar tab"
			aria-expanded="false"
			@click="handleCalendarNavigation"
		>
			Calendar
		</button>
		<button
			id="rewards-tab"
			class="student-menu-rewards-tab"
			type="button"
			name="rewards-tab"
			data-button-name="rewards-tab"
			aria-label="Open Rewards tab"
			title="Open Rewards tab"
			:aria-expanded="activeStudentMenu === 'rewards'"
			@click="handleStudentMenuNavigation('rewards')"
		>
			Rewards
		</button>
		<button
			id="games-tab"
			class="student-menu-games-tab"
			type="button"
			name="games-tab"
			data-button-name="games-tab"
			aria-label="Open Games tab"
			title="Open Games tab"
			:aria-expanded="activeStudentMenu === 'games'"
			@click="handleStudentMenuNavigation('games')"
		>
			Games
		</button>
		<button
			id="extra-credit-tab"
			class="student-menu-extra-credit-tab"
			type="button"
			name="extra-credit-tab"
			data-button-name="extra-credit-tab"
			aria-label="Open Extra Credit tab"
			title="Open Extra Credit tab"
			:aria-expanded="activeStudentMenu === 'extra-credit'"
			@click="handleStudentMenuNavigation('extra-credit')"
		>
			Extra Credit
		</button>
		<button
			id="progress-tab"
			class="student-menu-progress-tab"
			type="button"
			name="progress-tab"
			data-button-name="progress-tab"
			aria-label="Open Progress tab"
			title="Open Progress tab"
			:aria-expanded="activeStudentMenu === 'progress'"
			@click="handleStudentMenuNavigation('progress')"
		>
			Progress
		</button>
		<slot />

		<aside
			v-if="activeStudentMenu"
			id="student-submenu-panel"
			class="student-submenu-panel"
			:class="{
				'student-submenu-panel-rewards': activeStudentMenu === 'rewards',
				'student-submenu-panel-games': activeStudentMenu === 'games',
				'student-submenu-panel-extra-credit': activeStudentMenu === 'extra-credit',
				'student-submenu-panel-progress': activeStudentMenu === 'progress',
			}"
			aria-label="Student submenu panel"
			title="Student submenu panel"
			data-container-name="student-submenu-panel"
		>
			<article
				v-if="activeStudentMenu === 'rewards'"
				id="rewards-menu"
				class="student-submenu-section student-submenu-rewards"
				aria-label="Rewards menu"
				title="Rewards menu"
			>
				<h2>Rewards</h2>
				<p>Choose a reward for your learning progress.</p>
			</article>
			<article
				v-if="activeStudentMenu === 'games'"
				id="games-menu"
				class="student-submenu-section student-submenu-games"
				aria-label="Games menu"
				title="Games menu"
			>
				<h2>Games</h2>
				<p>Pick a game to practice your skills.</p>
			</article>
			<article
				v-if="activeStudentMenu === 'extra-credit'"
				id="extra-credit-menu"
				class="student-submenu-section student-submenu-extra-credit"
				aria-label="Extra Credit menu"
				title="Extra Credit menu"
			>
				<h2>Extra Credit</h2>
				<p>Explore optional challenges and activities.</p>
			</article>
			<article
				v-if="activeStudentMenu === 'progress'"
				id="progress-menu"
				class="student-submenu-section student-submenu-progress"
				aria-label="Progress menu"
				title="Progress menu"
			>
				<h2>Progress</h2>
				<p>Review your learning progress and milestones.</p>
			</article>
		</aside>
	</nav>
</template>
