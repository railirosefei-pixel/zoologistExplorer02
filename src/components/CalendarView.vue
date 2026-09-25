/** Calendar view state, month navigation, theme sync, and day-cell timing pipeline. */
<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import minecraftExplosion from "../../assets/animations/minecraftExplosion.gif";
import artBackground from "../../assets/images/backgrounds/art(Background)01.webp";
import languageArtsBackground from "../../assets/images/backgrounds/languageArts(Background)01.webp";
import mathBackground from "../../assets/images/backgrounds/math(Background)01.webp";
import scienceBackground from "../../assets/images/backgrounds/science(Background)01.webp";
import socialStudiesBackground from "../../assets/images/backgrounds/socialStudies(Background)01.webp";
import storyImage from "../../assets/images/backgrounds/storyImage.webp";
import calendarPanelBackground from "../../assets/textures/minecraftDirt01.webp";
import septemberDayTexture from "../../assets/textures/minecraftTNT.webp";
import CalendarMonthCard from "./CalendarMonthCard.vue";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const storyTimelineTabs = ["Year", "Quarter", "Month", "Week"];
const calendarMonths = Array.from({ length: 16 }, (_, index) => {
	const monthDate = new Date(2026, 8 + index, 1);
	const monthName = monthDate.toLocaleString("en-US", { month: "long" });
	const year = monthDate.getFullYear();
	const firstDay = new Date(year, monthDate.getMonth(), 1);
	const totalDays = new Date(year, monthDate.getMonth() + 1, 0).getDate();
	const leadingCells = (firstDay.getDay() + 6) % 7;
	const totalCells = 42;
	const cells = [];

	for (let dayIndex = 0; dayIndex < totalCells; dayIndex += 1) {
		const dayNumber = dayIndex - leadingCells + 1;
		cells.push(
			dayNumber >= 1 && dayNumber <= totalDays
				? { value: dayNumber, isCurrentMonth: true }
				: { value: "", isCurrentMonth: false },
		);
	}

	return { id: `${monthName}-${year}`, monthName, year, cells };
});
const currentMonthIndex = ref(0);
const currentMonth = computed(() => calendarMonths[currentMonthIndex.value]);
const isDailyMenuOpen = ref(false);
const selectedDailyMenuDateLabel = ref("");
const selectedDailyMenuSubject = ref(null);
const activeStoryTimelineTab = ref(null);
const explodedDayCellKey = ref(null);
const lastClickedDayCellKey = ref(null);
const hiddenDayCellKeys = ref([]);
const replacementVisibleDayCellKeys = ref([]);
const dayCellAnimationState = ref("idle");
const pastelReplacementClasses = [
	"calendar-day-replacement--pink",
	"calendar-day-replacement--blue",
	"calendar-day-replacement--yellow",
	"calendar-day-replacement--green",
];
const replacementColorClassesByDayCellKey = ref({});
const explosionInstance = ref(0);
const explosionDurationMs = 900;
const explosionTextureHideDelayMs = 450;
const september28StoryTheme = "The Journey to the Watering Hole";
const september28StoryParagraphs = [
	'Towering above you, the giraffes stretch so high their heads seem to touch the clouds! You pause to count them: "1... 2... 3... 4..."—a complete herd of 15 giraffes. It is an amazing sight, but you keep your eyes on the quest. "My name is Raili Rose," you announce, stepping forward. "I\'ve come to help you. I overheard you whispering about your lion troubles. Tell me what you need."',
	'"Too many troubles to count, I\'m afraid," whispers the tallest and oldest giraffe with a heavy sigh. "Lions are driving us from the land our families have lived on for generations. I don\'t know if even an explorer like you can help... but our calves haven\'t had any food or water in a day. We can\'t risk visiting the watering hole with the pride hunting us. If you can help us find water, we will be forever grateful."',
	'Suddenly, a warm glow hums from your vest pocket. You pull out your journal as its pages flutter wildly, snapping open to an exact map of the savanna around you. Before you can blink, a bright red dot pulses right where your boots hit the dirt. A crisp red line zips out from the dot, curling off to the right before locking in place beside clean, glowing text: 1027 ft. "The dot marks where I\'m standing," you realize, tracing the glowing path. "And that red line leads straight to another watering hole!" You look up at the herd with total confidence. "I know where to go. Follow me—it\'s not too far away." With no other choice, the giraffes place their trust in you, lining up single file to match your stride across the plains.',
];
const september29StoryTheme = "The Journey to Acacia Grove";
const september29StoryParagraphs = [
	'After the herd drinks deeply from the cool, sparkling watering hole, they bow their long necks in relief and gratitude. The oldest giraffe steps forward, his deep voice filled with respect. "You saved us today, Raili Rose," he rumbles softly. "You have proven yourself to be a true explorer. But our herd faces another desperate trial: we have not eaten in a couple of days. Lions are stalking our favorite Acacia trees, waiting to ambush us. Our calves are starving. Can you guide us to food?"',
	'"Of course I\'ll help!" you answer eagerly. Right on cue, a bright yellow glow bursts from your vest pocket. You draw out your journal as its pages flutter rapidly, snapping open to a fresh map. The familiar red dot pulses beneath your boots. In a flash, a thin red line darts across the parchment, drawing a path straight to a cluster of tiny, ink-drawn trees. "A hidden Acacia grove—safe from the lions!" you realize with a grin. "I know just where to go!" You spin toward the open plains, journal in hand. Behind you, the giraffes turn as one and follow without hesitation. You are quickly becoming the true hero of the Whispering Giraffes.',
];
const september30StoryTheme = "Handling the Lions with Pride";
const september30StoryParagraphs = [
	"Full bellies, sweet acacia leaves, and cool water. After days of exhaustion, the Whispering Giraffes were finally safe—thanks to you. While the leggy calves played tag across the clearing, the elders hummed low, rumbling stories of the old days. You couldn't help but smile. You had saved them. Then, the entire herd froze.",
	"Dozens of long necks snapped upright. Ears swiveled toward the ridge. Every eye locked in the exact same direction, wide with terror.",
	'"What\'s wrong?" you ask, stepping forward. "You look like you\'ve seen a ghost!"',
	'"Worse," the oldest giraffe whispers, his voice trembling. "Lions. They tracked us through the canyon. If we run right now, some of us might escape!"',
	'"No way!" you say, planting your feet. "This grove is perfect. You have cool water and all the food you could ever want. We have to stand our ground!"',
	'"Stand our ground? How?" the elder dips his head. "We are only giraffes. We can\'t fight a pride of lions. We never could." Suddenly, a warm glow pulses against your ribs. You reach into your vest pocket and pull out your journal. The pages flutter open like rapid wings, snapping to a stop at a glowing illustration: the steep canyon pass you traveled through earlier today. Perched on the cliff high above the narrow canyon trail sits a massive pile of loose boulders. Like an animated clip, the ink moves across the paper. The boulders tip over the cliff\'s edge, crashing into the narrow gap below and slamming the trail completely shut.',
	'"That\'s it!" you whisper, eyes wide. "If we hike up that winding cliff path and shove those boulders down into the canyon, it will seal the gap! The lions won\'t be able to get through!"',
	'"Our legs are far too long and clumsy for a ledge that narrow. We\'d fall. But we can\'t lose our new home, either. I don\'t know what to do," the oldest giraffe says.',
	'You square your shoulders, stand tall, and smile. "Leave the climbing to me," you say proudly. "We made it this far, and I\'m not quitting now!"',
];
const october1StoryTheme = "The Float of Crocodiles";
const october1StoryParagraphs = [
	'"We can\'t thank you enough, Master Explorer Raili Rose," the oldest giraffe whispers, bowing his long neck. "Our bellies are full, our herd is safe, and the lions are gone."',
	'"I\'m just glad I could help," you say, grinning. "I\'ve learned so much about you and your herd! That\'s all the thanks I need."',
	'The elder tilts his head toward the sunset. "How about one last cool drink before dark? Would you like a ride?"',
	'"A ride on a giraffe? Yes, please!"',
	'The elder bends his knobby knees like a folding crane. You grab his warm, patterned neck, swing your leg over, and settle onto his back. With a smooth sway, he rises into the air. Suddenly, you are gazing across the entire savanna from high in the air. The view is breathtakingly beautiful. The herd trots toward the watering hole. But as you reach the ridge, the giraffes come to a dead stop.',
	'"Do you smell that?" the elder murmurs, his ears pinning back flat. A mother giraffe shivers. "Oh no... crocodiles!"',
	'"Crocodiles?" you ask, scanning the muddy banks. "Out here?"',
	'"They lurk in the shallows," the elder groans. "If they take over the pool, we can\'t drink. What are we going to do?"',
	'A bright golden light flares inside your vest. You pull out your journal. The pages rustle open to a glowing map of the valley. Right over the watering hole pulses a bright red dot. From that dot, a glowing red line traces across the grassland, pointing directly to a new symbol: a carved icon of a hippopotamus. The journal has a plan.',
	'"Follow me!" you call out from high on the elder\'s back, pointing toward the western bend. "We\'re going to get your water back!" You guide the herd through the tall grass until the earth begins to vibrate. There, lounging in the muddy riverbank, is a pod of hippos. School textbooks showed pictures, but they never prepared you for this. These beasts are massive, gray river boulders weighing thousands of pounds each.',
	'The giraffes freeze. The hippos halt and swivel their heads. Dozens of tiny ears twitch. Heavy, dark eyes lock onto your herd.',
	'The journal pulses again, sending a warm hum through your fingers. Suddenly, the grunts and rumbles of the hippos turn into words you can clearly understand! "Why are giraffes invading our river?" one hippo grunts to another. "The whole herd is here."',
	'"Relax," another snorts, blowing river water from his snout. "They eat leaves. They aren\'t a threat to us." The pod mutters in a rumbling wave of voices until the largest hippo of all emerges from the deep water. He rises like an island, water cascading off his wide shoulders. He stomps up the bank, his deep growl vibrating right through your ribs.',
	'"State your business," he rumbles. "We are peaceful creatures, and we like our quiet."',
	'Your stomach does a flip. Your hands want to shake. But you are Master Explorer Raili Rose. You sit up straight on the giraffe\'s back, pull your shoulders back, and speak with a steady voice:',
	'"Forgive the interruption, sir. We need your help. We escaped a pride of lions and sealed the canyon pass, but now crocodiles have invaded our watering hole. The giraffes have nowhere else to drink."',
	'The giant hippo blinks his heavy eyelids. "The pool right downriver?"',
	'"Yes," the giraffe elder answers softly. "We cannot fight them alone. Can you help us?"',
	'The hippos turn and murmur together in a quick, low rumble. A moment later, the giant leader steps forward, snapping his massive jaws shut with a solid THUD.',
	'"We can," the leader grumbles. "The savanna fears crocodiles, but we do not. The crocodiles fear us. They know we never tolerate them in our water. Lead the way, Explorer. Let\'s go have a word with these crocs."',
];
const october2StoryTheme = "The Towering Acacia Clinic";
const october2StoryParagraphs = [
	'After a day of victory celebrations, exhaustion hits you all at once. You whisper "goodnight" to your gentle giraffe friends and curl up inside a cozy rock hollow near the acacia grove.',
	'Cough! Hack! Achoo!',
	'You snap awake in the pitch-dark. Grabbing your lantern, you sweep the beam across the tall grass. There, shivering and sniffling on the ground, are the two youngest calves.',
	'"We\'re sick," both calves groan at the exact same time.',
	'"My head is pounding," one whines.',
	'"My chest hurts," whimpers the other.',
	'Footsteps thump against the dirt. Their mother rushes over, her long neck trembling. "My poor babies! What could have made you so sick? Seeing you suffer like this breaks my heart."',
	'You kneel down in the grass so you are eye-to-eye with the calves. "Did you two eat anything besides sweet acacia leaves?"',
	'"Well..." the first calf begins.',
	'"Shut up!" his brother hiss-whispers, bumping him with his shoulder to keep him quiet.',
	'The mother giraffe pins her ears back, but her voice stays calm and steady. "Boys. Whatever you did, tell me right now. You are not in trouble, but I can\'t help you unless I know the truth."',
	'The first calf drops his chin to his chest. "We found some berry bushes hidden behind the rocks where Raili Rose was sleeping. They tasted bitter and sour... but we ate them anyway."',
	'"Boys! You know you cannot eat strange plants!" The mother\'s frustration instantly melts into pure panic.',
	'"Don\'t worry, I\'m on it," you say, lifting your lantern. "Let me inspect those bushes."',
	'You dash behind the rock formation. Sure enough, tangled against the cliff wall is a thorny bush covered in dark, glossy berries. Suddenly, your vest pocket flares with a bright golden glow. You slide out your magical journal. The pages flutter furiously, snapping to a stop on an ultra-zoomed map of the exact ground beneath your boots.',
	'Suddenly, a glowing red skull-and-crossbones stamps itself directly over the berry bushes. "Poisonous!", you say loudly in your own head. Then, a luminous red line traces away from the toxic bushes, weaving across the savanna until it locks onto a new icon: a carved sprig of medicinal leaves.',
	'"Healing herbs," you whisper. "The journal has the cure!"',
	'You sprint along the glowing trail until you reach a hidden clearing overflowing with wild herbs—velvety mint, silvery roots, and leafy green stalks. You harvest thick bundles of each kind, stuffing your explorer pack until it bulges.',
	'Sprinting back to the grove, you find the mother curled protectively around her calves, fast asleep from exhaustion. But the little ones are still wide awake, trembling and miserable. You check the journal\'s glowing illustration, pick out the exact matching green leaves from your bag, and kneel down.',
	'"Here, little guys," you whisper gently. "Chew on these. They are healing herbs. They will cure your stomachache."',
	'One calf pulls his head back, his dark eyes nervous. "Are you sure? The last strange thing we ate made our bellies feel like fire."',
	'"I know it\'s scary," you say with a warm, steady smile. "But I need you to trust me. This is medicine. It will make you feel better."',
	'Slowly, both calves take the leafy stems from your hands. They chew silently, their faces instantly twisting into expressions of pure disgust—ears twitching, tongues curling.',
	'You stifle a giggle. You remember having to swallow bitter medicine whenever you caught a bad cold. Medicine never tastes good, but it does the trick.',
	'Hopeful that the young calves will recover from their sickness, you curl back up into your cozy rock hollow and quickly fall asleep.',
	'Bright sunlight wakes you to joyful thumping. The two calves are zooming in energetic circles around your boulder, kicking their knobby legs high in a rowdy game of tag! "Raili Rose! Raili Rose!" they squeal, barreling over and talking over each other. "We feel great! Our stomachs don\'t hurt at all! In fact, we\'ve never felt better in our whole lives!"',
	'Their mother strides over with long, graceful steps. "Calm down, boys. Raili Rose just woke up—give our Master Explorer some space."',
	'She bows her head down to yours, her eyes shining with warmth. "Thank you, Raili Rose. You saved my children. I only wish we had a way to store these healing herbs year-round, so we always have medicine on hand for whenever curious calves get into trouble."',
	'The journal bursts into a brilliant white-and-gold glow right in your pocket. You snap it open. This time, it isn\'t a map at all. It is an illustrated herbal field guide! Every single plant from the meadow is sketched in vivid detail, accompanied by exact notes showing which illness, fever, or sting it treats.',
	'Whoosh. The page turns by itself. Across the fresh page is a detailed blueprint: sturdy wooden storage boxes strapped high into the sturdy branches of an acacia tree, each labeled for a different healing herb. A savanna apothecary! You grin up at the towering branches. You know exactly what to build.',
];

/** Story content lookup keyed by the selected daily menu date label. */
const storyContentByDateLabel = {
	"September 28, 2026": {
		theme: september28StoryTheme,
		paragraphs: september28StoryParagraphs,
	},
	"September 29, 2026": {
		theme: september29StoryTheme,
		paragraphs: september29StoryParagraphs,
	},
	"September 30, 2026": {
		theme: september30StoryTheme,
		paragraphs: september30StoryParagraphs,
	},
	"October 1, 2026": {
		theme: october1StoryTheme,
		paragraphs: october1StoryParagraphs,
	},
	"October 2, 2026": {
		theme: october2StoryTheme,
		paragraphs: october2StoryParagraphs,
	},
};
const selectedStoryContent = computed(
	() => storyContentByDateLabel[selectedDailyMenuDateLabel.value] ?? null,
);
const calendarPanelBackgroundImage = `url("${calendarPanelBackground}")`;
const calendarDayImage = `url("${septemberDayTexture}")`;
let explosionTimeoutId;
let explosionTextureTimeoutId;

/** Calendar-month selection pipeline boundary for stepping one month in either direction. */
function handleMonthSelectionOffset(monthOffset) {
	isDailyMenuOpen.value = false;
	clearDayCellExplosion();
	currentMonthIndex.value =
		(currentMonthIndex.value + monthOffset + calendarMonths.length) % calendarMonths.length;
}

/** Daily menu close pipeline boundary. */
function handleDailyMenuClose() {
	isDailyMenuOpen.value = false;
	selectedDailyMenuSubject.value = null;
	activeStoryTimelineTab.value = null;
}

function handleDailyMenuSubjectSelection(subject) {
	selectedDailyMenuSubject.value = subject;
	activeStoryTimelineTab.value = null;
}

function handleStoryPanelBack() {
	selectedDailyMenuSubject.value = null;
	activeStoryTimelineTab.value = null;
}

function handleStoryTimelineTabSelection(tabName) {
	activeStoryTimelineTab.value =
		activeStoryTimelineTab.value === tabName ? null : tabName;
}

function isStoryButtonAvailable() {
	if (!selectedDailyMenuDateLabel.value) {
		return false;
	}

	const match = selectedDailyMenuDateLabel.value.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})$/);
	if (!match) {
		return false;
	}

	const [, monthName, dayValue, yearValue] = match;
	const monthIndex = new Date(`${monthName} 1, ${yearValue}`).getMonth();
	const selectedDate = new Date(Number(yearValue), monthIndex, Number(dayValue));
	const storyStartDate = new Date(2026, 8, 28);
	const dayOfWeek = selectedDate.getDay();

	return selectedDate >= storyStartDate && dayOfWeek >= 1 && dayOfWeek <= 5;
}

/** Calendar-day activation pipeline boundary. */
function isCurrentMonthDayCell(cell) {
	return Boolean(cell?.isCurrentMonth && cell?.value !== "");
}

/** Revealed-day navigation pipeline boundary. */
function openDailyMenuForDayCell(cell) {
	selectedDailyMenuDateLabel.value = `${currentMonth.value.monthName} ${cell.value}, ${currentMonth.value.year}`;
	isDailyMenuOpen.value = true;
}

/** Day-cell animation pipeline boundary. */
function handleDayCellAnimation(cellIndex) {
	const cell = currentMonth.value.cells[cellIndex];
	if (!isCurrentMonthDayCell(cell)) {
		return;
	}
	const cellKey = `${currentMonth.value.id}-${cellIndex}`;
	if (explodedDayCellKey.value && dayCellAnimationState.value === "exploding") {
		replacementVisibleDayCellKeys.value = [
			...new Set([...replacementVisibleDayCellKeys.value, explodedDayCellKey.value]),
		];
	}

	if (explosionTimeoutId) {
		window.clearTimeout(explosionTimeoutId);
	}
	if (explosionTextureTimeoutId) {
		window.clearTimeout(explosionTextureTimeoutId);
	}

	hiddenDayCellKeys.value = [...new Set([...hiddenDayCellKeys.value, cellKey])];
	lastClickedDayCellKey.value = cellKey;
	explodedDayCellKey.value = cellKey;
	dayCellAnimationState.value = "exploding";
	const nextReplacementColorIndex =
		(explosionInstance.value + currentMonthIndex.value + 1) % pastelReplacementClasses.length;
	replacementColorClassesByDayCellKey.value = {
		...replacementColorClassesByDayCellKey.value,
		[cellKey]: pastelReplacementClasses[nextReplacementColorIndex],
	};
	explosionInstance.value += 1;
	explosionTextureTimeoutId = window.setTimeout(() => {
		dayCellAnimationState.value = "textureCleared";
		replacementVisibleDayCellKeys.value = [
			...new Set([...replacementVisibleDayCellKeys.value, cellKey]),
		];
		explosionTextureTimeoutId = undefined;
	}, explosionTextureHideDelayMs);
	explosionTimeoutId = window.setTimeout(() => {
		dayCellAnimationState.value = "ready";
		explosionTimeoutId = undefined;
	}, explosionDurationMs);
}

function clearDayCellExplosion() {
	if (explosionTimeoutId) {
		window.clearTimeout(explosionTimeoutId);
		explosionTimeoutId = undefined;
	}
	if (explosionTextureTimeoutId) {
		window.clearTimeout(explosionTextureTimeoutId);
		explosionTextureTimeoutId = undefined;
	}

	explodedDayCellKey.value = null;
	lastClickedDayCellKey.value = null;
	hiddenDayCellKeys.value = [];
	replacementVisibleDayCellKeys.value = [];
	replacementColorClassesByDayCellKey.value = {};
	selectedDailyMenuDateLabel.value = "";
	dayCellAnimationState.value = "idle";
}

function handleDayCellClick(cell) {
	if (!isCurrentMonthDayCell(cell)) {
		return;
	}

	const cellIndex = currentMonth.value.cells.indexOf(cell);
	const cellKey = `${currentMonth.value.id}-${cellIndex}`;

	if (
		replacementVisibleDayCellKeys.value.includes(cellKey) ||
		(explodedDayCellKey.value === cellKey &&
			["textureCleared", "ready"].includes(dayCellAnimationState.value))
	) {
		openDailyMenuForDayCell(cell);
		return;
	}

	handleDayCellAnimation(cellIndex);
}

onBeforeUnmount(clearDayCellExplosion);
</script>

<template>
	<div
		id="calendar-panel"
		class="calendar-panel"
		aria-label="Calendar panel"
		title="Calendar panel"
		aria-live="polite"
	>
		<header
			v-if="!isDailyMenuOpen"
			id="calendar-panel-header"
			class="calendar-panel-header"
			aria-label="Calendar panel header"
			title="Calendar panel header"
		>
			<div class="calendar-header-row">
				<button
					id="calendar-previous-month-button"
					class="calendar-previous-month-button"
					type="button"
					aria-label="Show previous month"
					title="Show previous month"
					@click="handleMonthSelectionOffset(-1)"
				>
					Back
				</button>
				<h1 id="calendar-menu-heading" class="student-menu-heading">Calendar</h1>
				<button
					id="calendar-next-month-button"
					class="calendar-next-month-button"
					type="button"
					aria-label="Show next month"
					title="Show next month"
					@click="handleMonthSelectionOffset(1)"
				>
					Forward
				</button>
			</div>
		</header>
		<div v-if="!isDailyMenuOpen" class="calendar-month-grid calendar-month-grid--single">
			<CalendarMonthCard
				:current-month="currentMonth"
				:weekdays="weekdays"
				:day-cell-animation-state="dayCellAnimationState"
				:exploded-day-cell-key="explodedDayCellKey"
				:last-clicked-day-cell-key="lastClickedDayCellKey"
				:hidden-day-cell-keys="hiddenDayCellKeys"
				:replacement-visible-day-cell-keys="replacementVisibleDayCellKeys"
				:replacement-color-classes-by-day-cell-key="replacementColorClassesByDayCellKey"
				:explosion-instance="explosionInstance"
				:explosion-image="minecraftExplosion"
				@day-cell-click="handleDayCellClick"
			/>
		</div>
		<section
			v-else
			id="daily-menu-panel"
			class="daily-menu-panel"
			role="region"
			aria-label="Daily menu"
			title="Daily menu"
		>
			<div
				:class="[
					'daily-menu-content',
					{ 'daily-menu-content--story': selectedDailyMenuSubject === 'story' },
				]"
			>
				<h2 v-if="selectedDailyMenuSubject !== 'story'">Daily Menu</h2>
				<button
					v-if="selectedDailyMenuSubject !== 'story'"
					id="daily-menu-back-button"
					class="daily-menu-back-button"
					type="button"
					aria-label="Back to calendar"
					title="Back to calendar"
					@click="handleDailyMenuClose"
				>
					Back
				</button>
				<p v-if="selectedDailyMenuSubject !== 'story'" class="daily-menu-date">{{ selectedDailyMenuDateLabel }}</p>
				<nav
					v-if="selectedDailyMenuSubject !== 'story'"
					id="daily-menu-subject-navigation"
					class="daily-menu-subject-grid"
					role="navigation"
					aria-label="Daily menu subjects"
					title="Daily menu subjects"
				>
					<button
						v-if="isStoryButtonAvailable()"
						id="daily-menu-story-button"
						class="daily-menu-story-button"
						type="button"
						aria-label="Story"
						title="Story"
						@click="handleDailyMenuSubjectSelection('story')"
					>
						<img :src="storyImage" alt="" />
					</button>
					<button
						id="daily-menu-math-button"
						class="daily-menu-math-button"
						type="button"
						aria-label="Math"
						title="Math"
						@click="handleDailyMenuSubjectSelection('math')"
					>
						<img :src="mathBackground" alt="" />
					</button>
					<button
						id="daily-menu-language-arts-button"
						class="daily-menu-language-arts-button"
						type="button"
						aria-label="Language Arts"
						title="Language Arts"
						@click="handleDailyMenuSubjectSelection('language-arts')"
					>
						<img :src="languageArtsBackground" alt="" />
					</button>
					<button
						id="daily-menu-social-studies-button"
						class="daily-menu-social-studies-button"
						type="button"
						aria-label="Social Studies"
						title="Social Studies"
						@click="handleDailyMenuSubjectSelection('social-studies')"
					>
						<img :src="socialStudiesBackground" alt="" />
					</button>
					<button
						id="daily-menu-science-button"
						class="daily-menu-science-button"
						type="button"
						aria-label="Science"
						title="Science"
						@click="handleDailyMenuSubjectSelection('science')"
					>
						<img :src="scienceBackground" alt="" />
					</button>
					<button
						id="daily-menu-art-button"
						class="daily-menu-art-button"
						type="button"
						aria-label="Art"
						title="Art"
						@click="handleDailyMenuSubjectSelection('art')"
					>
						<img :src="artBackground" alt="" />
					</button>
				</nav>
				<div
					:class="[
						'daily-menu-subject-panel-stack',
						{ 'daily-menu-subject-panel-stack--story': selectedDailyMenuSubject === 'story' },
					]"
				>
					<article
						v-if="selectedDailyMenuSubject === 'math'"
						id="daily-menu-math-panel"
						class="daily-menu-subject-panel daily-menu-math-panel"
						aria-label="Math subject panel"
						title="Math subject panel"
					>
						<h2>Math</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'story'"
						id="daily-menu-story-panel"
						class="daily-menu-subject-panel daily-menu-story-panel"
						aria-label="Story subject panel"
						title="Story subject panel"
					>
						<div class="daily-menu-story-panel-shell">
							<div
								class="daily-menu-story-tab-list"
								role="tablist"
								aria-label="Story timeline navigation"
							>
								<button
									v-for="storyTab in storyTimelineTabs"
									:key="storyTab"
									:id="`daily-menu-story-tab-${storyTab.toLowerCase()}`"
									type="button"
									class="daily-menu-story-tab"
									:class="{ 'daily-menu-story-tab--active': activeStoryTimelineTab === storyTab }"
									:aria-selected="activeStoryTimelineTab === storyTab"
									@click="handleStoryTimelineTabSelection(storyTab)"
								>
									{{ storyTab }}
								</button>
							</div>
							<div
								v-if="activeStoryTimelineTab"
								class="daily-menu-story-menu-panel"
								role="tabpanel"
								:aria-label="`${activeStoryTimelineTab} story menu`"
							>
								<h2>{{ activeStoryTimelineTab }}</h2>
								<h3>Theme</h3>
								<h2>Story</h2>
							</div>
							<div v-else class="daily-menu-story-content">
								<button
									v-if="selectedDailyMenuSubject === 'story' && !activeStoryTimelineTab"
									id="daily-menu-story-back-button"
									class="daily-menu-story-back-button"
									type="button"
									aria-label="Back to daily menu"
									title="Back to daily menu"
									@click="handleStoryPanelBack"
								>
									Back
								</button>
								<h3>Theme</h3>
								<p v-if="selectedStoryContent">{{ selectedStoryContent.theme }}</p>
								<h2>Story</h2>
								<template v-if="selectedStoryContent">
									<p v-for="paragraph in selectedStoryContent.paragraphs" :key="paragraph">
										{{ paragraph }}
									</p>
								</template>
							</div>
						</div>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'language-arts'"
						id="daily-menu-language-arts-panel"
						class="daily-menu-subject-panel daily-menu-language-arts-panel"
						aria-label="Language Arts subject panel"
						title="Language Arts subject panel"
					>
						<h2>Language Arts</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'social-studies'"
						id="daily-menu-social-studies-panel"
						class="daily-menu-subject-panel daily-menu-social-studies-panel"
						aria-label="Social Studies subject panel"
						title="Social Studies subject panel"
					>
						<h2>Social Studies</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'science'"
						id="daily-menu-science-panel"
						class="daily-menu-subject-panel daily-menu-science-panel"
						aria-label="Science subject panel"
						title="Science subject panel"
					>
						<h2>Science</h2>
					</article>
					<article
						v-if="selectedDailyMenuSubject === 'art'"
						id="daily-menu-art-panel"
						class="daily-menu-subject-panel daily-menu-art-panel"
						aria-label="Art subject panel"
						title="Art subject panel"
					>
						<h2>Art</h2>
					</article>
				</div>
			</div>
		</section>
	</div>
</template>

<style scoped>
.calendar-panel {
	background-image: v-bind(calendarPanelBackgroundImage);
}

:deep(
		.calendar-day-cell--current-month:not(.calendar-day-cell--texture-suppressed):not(
			.calendar-day-cell--exploding
		)
	) {
	background-image: v-bind(calendarDayImage);
}
</style>
