/** Calendar view state, month navigation, theme sync, and day-cell timing pipeline. */
<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import minecraftExplosion from "../../assets/animations/minecraftExplosion.gif";
import explosionSound from "../../assets/sounds/Explosion Dynamite 01.wav";
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
const storyTimelineTabs = ["Year", "Quarter", "Month", "Week", "Day"];
const year1TimelineStory = {
	theme: "Expeditions into Blockland: The Obsidian Portal and the Never Ending Tales of Raili Rose",
	paragraphs: [
		"Deep beneath the surface of your blocky world, an adventure awaits.",
		"You are the Great Explorer Raili Rose. You have spent hours tunneling near bedrock on the hunt for elusive diamonds to power your gear. With one final strike against the solid rock, your pickaxe breaks through into a hidden cavern. Soft moss glows along the stone walls, and clusters of redstone sparkle in the dark.",
		'In the center of the room, resting on a smooth cobblestone pedestal, you discover an ancient, leather-bound book. You brush the dust off the cover. Stamped in faded gold letters is a single word: BESTIARY—the lost logbook of Earth’s most incredible animals. You open it. The first few pages are filled with sketches and field notes, but the rest are completely blank. A handwritten message at the top of the page reads: "To the explorer who finds this book: The world is vast, and my journey is over. Finish what I started." Just as you slip the leather journal into your explorer\'s vest pocket, the cavern hums with energy. VOOOOOO-SHHH! A giant, swirling purple portal tears open right in front of you, surrounded by a jet black obsidian arch! As you stare at the beautiful, swirling purple colors of the obsidian portal, the colors slowly fade into moving images of animals from all over Blockland: giraffes, zebras, polar bears, penguins, monkeys, lions, hippos, and even some animals you have never even heard of before. This is the beginning of your journey...the journey of the Great Explorer Raili Rose and her quest to learn about the animals of Blockland and aid them in any way she can...',
	],
};
const quarter1TimelineStory = {
	theme: "Journey into Blockland: Safari through the Savanna",
	paragraphs: [
		"The swirling violet mist within the obsidian frame begins to steady. Slowly, the swirling colors clear, revealing a breathtaking view of a sunlit, golden plain. Tall giraffes stride across the grasslands, plucking sweet leaves from the highest acacia trees. Nearby, a herd of zebras grazes peacefully on fresh, green grass. Beneath the shade of a rock ledge, a lioness rests while her cubs tumble and play, and down in the river shallows, a pod of hippos splashes together in the cool water. You stare in absolute wonder. Suddenly, you feel an quickly increasing feeling of warmth against your chest. As you look down to pinpoint where this feeling is coming from, you quickly realize that your vest pocket is glowing. You reach inside and pull out the ancient Bestiary. Its leather cover hums with energy. Right before your eyes, a brilliant beam of light leaps from the pages. The glowing beam shoots straight forward, slicing through the air and anchoring directly into the center of the portal. You have no idea what awaits you on the other side. Yet as the beam pulses between your hands and the swirling gateway, one thing is certain: out there across the wild plains, creatures are in need—and this portal is calling you to help them. You take a deep breath, step up to the towering obsidian arch, and cross into the unknown...",
	],
};
const month1TimelineStory = {
	theme: "The Herbivores of the Plains",
	paragraphs: [
		"The Great Plant-Eaters! Adventure awaits across the sunlit savanna, where the magnificent herbivores of Blockland need a brave explorer. You will journey through the grasslands to watch giant giraffes reach the sweetest treetops, race beside zebra herds, and lead elephant families to secret watering holes. As you uncover how these amazing animals live and survive, you will use your knowledge to aid the great herbivores of the plains in any way that you can. Learn everything you can about the herbivores of the savanna, fill every blank page in your explorer journal, and prove you have what it takes to be a Master Explorer!",
	],
};
const week1TimelineStory = {
	theme: "The Whispering Giraffes",
	paragraphs: [
		"As you walk across the golden plains of the savanna, you notice a herd of tall giraffes gathered near a watering hole. Usually, these gentle giants stride calmly across the plains, but today they stand frozen in place, their ears twitching with worry. As you step closer, your Explorer Journal warms up in your hands and begins to glow with a soft light. Suddenly, the quiet murmurs across the grass turn into clear words...your journal is translating animal speech, and you can understand exactly what the giraffes are saying! Listening in, you hear the herd whispering anxiously. \"That pride of lions just won't budge. How will we ever get our calves to the watering hole or reach the Acacia trees on the other side? We'll starve!\"",
	],
};
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
const selectedDailyMenuBlock = ref(null);
const activeStoryTimelineTab = ref(null);
const hasDailyMenuContent = computed(() => {
	const septemberDateMatch = selectedDailyMenuDateLabel.value.match(
		/^September\s+(\d{1,2}),\s+2026$/,
	);
	if (!septemberDateMatch) {
		return true;
	}

	const dayNumber = Number(septemberDateMatch[1]);
	return dayNumber < 1 || dayNumber > 27;
});
const blockSubjectLabels = {
	math: "Math",
	"language-arts": "Language Arts",
	"social-studies": "Social Studies",
	science: "Science",
};
const blockButtonClasses = {
	math: [
		"daily-menu-math-block-1-button",
		"daily-menu-math-block-2-button",
		"daily-menu-math-block-3-button",
	],
	"language-arts": [
		"daily-menu-language-arts-block-1-button",
		"daily-menu-language-arts-block-2-button",
		"daily-menu-language-arts-block-3-button",
	],
	"social-studies": [
		"daily-menu-social-studies-block-1-button",
		"daily-menu-social-studies-block-2-button",
		"daily-menu-social-studies-block-3-button",
	],
	science: [
		"daily-menu-science-block-1-button",
		"daily-menu-science-block-2-button",
		"daily-menu-science-block-3-button",
	],
};
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
	"\"Too many troubles to count, I'm afraid,\" whispers the tallest and oldest giraffe with a heavy sigh. \"Lions are driving us from the land our families have lived on for generations. I don't know if even an explorer like you can help... but our calves haven't had any food or water in a day. We can't risk visiting the watering hole with the pride hunting us. If you can help us find water, we will be forever grateful.\"",
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
	"\"Our legs are far too long and clumsy for a ledge that narrow. We'd fall. But we can't lose our new home, either. I don't know what to do,\" the oldest giraffe says.",
	'You square your shoulders, stand tall, and smile. "Leave the climbing to me," you say proudly. "We made it this far, and I\'m not quitting now!"',
];
const october1StoryTheme = "The Float of Crocodiles";
const october1StoryParagraphs = [
	'"We can\'t thank you enough, Master Explorer Raili Rose," the oldest giraffe whispers, bowing his long neck. "Our bellies are full, our herd is safe, and the lions are gone."',
	'"I\'m just glad I could help," you say, grinning. "I\'ve learned so much about you and your herd! That\'s all the thanks I need."',
	'The elder tilts his head toward the sunset. "How about one last cool drink before dark? Would you like a ride?"',
	'"A ride on a giraffe? Yes, please!"',
	"The elder bends his knobby knees like a folding crane. You grab his warm, patterned neck, swing your leg over, and settle onto his back. With a smooth sway, he rises into the air. Suddenly, you are gazing across the entire savanna from high in the air. The view is breathtakingly beautiful. The herd trots toward the watering hole. But as you reach the ridge, the giraffes come to a dead stop.",
	'"Do you smell that?" the elder murmurs, his ears pinning back flat. A mother giraffe shivers. "Oh no... crocodiles!"',
	'"Crocodiles?" you ask, scanning the muddy banks. "Out here?"',
	'"They lurk in the shallows," the elder groans. "If they take over the pool, we can\'t drink. What are we going to do?"',
	"A bright golden light flares inside your vest. You pull out your journal. The pages rustle open to a glowing map of the valley. Right over the watering hole pulses a bright red dot. From that dot, a glowing red line traces across the grassland, pointing directly to a new symbol: a carved icon of a hippopotamus. The journal has a plan.",
	'"Follow me!" you call out from high on the elder\'s back, pointing toward the western bend. "We\'re going to get your water back!" You guide the herd through the tall grass until the earth begins to vibrate. There, lounging in the muddy riverbank, is a pod of hippos. School textbooks showed pictures, but they never prepared you for this. These beasts are massive, gray river boulders weighing thousands of pounds each.',
	"The giraffes freeze. The hippos halt and swivel their heads. Dozens of tiny ears twitch. Heavy, dark eyes lock onto your herd.",
	'The journal pulses again, sending a warm hum through your fingers. Suddenly, the grunts and rumbles of the hippos turn into words you can clearly understand! "Why are giraffes invading our river?" one hippo grunts to another. "The whole herd is here."',
	'"Relax," another snorts, blowing river water from his snout. "They eat leaves. They aren\'t a threat to us." The pod mutters in a rumbling wave of voices until the largest hippo of all emerges from the deep water. He rises like an island, water cascading off his wide shoulders. He stomps up the bank, his deep growl vibrating right through your ribs.',
	'"State your business," he rumbles. "We are peaceful creatures, and we like our quiet."',
	"Your stomach does a flip. Your hands want to shake. But you are Master Explorer Raili Rose. You sit up straight on the giraffe's back, pull your shoulders back, and speak with a steady voice:",
	'"Forgive the interruption, sir. We need your help. We escaped a pride of lions and sealed the canyon pass, but now crocodiles have invaded our watering hole. The giraffes have nowhere else to drink."',
	'The giant hippo blinks his heavy eyelids. "The pool right downriver?"',
	'"Yes," the giraffe elder answers softly. "We cannot fight them alone. Can you help us?"',
	"The hippos turn and murmur together in a quick, low rumble. A moment later, the giant leader steps forward, snapping his massive jaws shut with a solid THUD.",
	'"We can," the leader grumbles. "The savanna fears crocodiles, but we do not. The crocodiles fear us. They know we never tolerate them in our water. Lead the way, Explorer. Let\'s go have a word with these crocs."',
];
const october2StoryTheme = "The Towering Acacia Clinic";
const october2StoryParagraphs = [
	'After a day of victory celebrations, exhaustion hits you all at once. You whisper "goodnight" to your gentle giraffe friends and curl up inside a cozy rock hollow near the acacia grove.',
	"Cough! Hack! Achoo!",
	"You snap awake in the pitch-dark. Grabbing your lantern, you sweep the beam across the tall grass. There, shivering and sniffling on the ground, are the two youngest calves.",
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
	"You dash behind the rock formation. Sure enough, tangled against the cliff wall is a thorny bush covered in dark, glossy berries. Suddenly, your vest pocket flares with a bright golden glow. You slide out your magical journal. The pages flutter furiously, snapping to a stop on an ultra-zoomed map of the exact ground beneath your boots.",
	'Suddenly, a glowing red skull-and-crossbones stamps itself directly over the berry bushes. "Poisonous!", you say loudly in your own head. Then, a luminous red line traces away from the toxic bushes, weaving across the savanna until it locks onto a new icon: a carved sprig of medicinal leaves.',
	'"Healing herbs," you whisper. "The journal has the cure!"',
	"You sprint along the glowing trail until you reach a hidden clearing overflowing with wild herbs—velvety mint, silvery roots, and leafy green stalks. You harvest thick bundles of each kind, stuffing your explorer pack until it bulges.",
	"Sprinting back to the grove, you find the mother curled protectively around her calves, fast asleep from exhaustion. But the little ones are still wide awake, trembling and miserable. You check the journal's glowing illustration, pick out the exact matching green leaves from your bag, and kneel down.",
	'"Here, little guys," you whisper gently. "Chew on these. They are healing herbs. They will cure your stomachache."',
	'One calf pulls his head back, his dark eyes nervous. "Are you sure? The last strange thing we ate made our bellies feel like fire."',
	'"I know it\'s scary," you say with a warm, steady smile. "But I need you to trust me. This is medicine. It will make you feel better."',
	"Slowly, both calves take the leafy stems from your hands. They chew silently, their faces instantly twisting into expressions of pure disgust—ears twitching, tongues curling.",
	"You stifle a giggle. You remember having to swallow bitter medicine whenever you caught a bad cold. Medicine never tastes good, but it does the trick.",
	"Hopeful that the young calves will recover from their sickness, you curl back up into your cozy rock hollow and quickly fall asleep.",
	'Bright sunlight wakes you to joyful thumping. The two calves are zooming in energetic circles around your boulder, kicking their knobby legs high in a rowdy game of tag! "Raili Rose! Raili Rose!" they squeal, barreling over and talking over each other. "We feel great! Our stomachs don\'t hurt at all! In fact, we\'ve never felt better in our whole lives!"',
	'Their mother strides over with long, graceful steps. "Calm down, boys. Raili Rose just woke up—give our Master Explorer some space."',
	'She bows her head down to yours, her eyes shining with warmth. "Thank you, Raili Rose. You saved my children. I only wish we had a way to store these healing herbs year-round, so we always have medicine on hand for whenever curious calves get into trouble."',
	"The journal bursts into a brilliant white-and-gold glow right in your pocket. You snap it open. This time, it isn't a map at all. It is an illustrated herbal field guide! Every single plant from the meadow is sketched in vivid detail, accompanied by exact notes showing which illness, fever, or sting it treats.",
	"Whoosh. The page turns by itself. Across the fresh page is a detailed blueprint: sturdy wooden storage boxes strapped high into the sturdy branches of an acacia tree, each labeled for a different healing herb. A savanna apothecary! You grin up at the towering branches. You know exactly what to build.",
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
const explorerCopyBySubject = {
	math: [
		"Explorer Raili!",
		"You are so brave to help the Whispering Giraffes find their way to a new watering hole!",
		"Complete all the Quests below and you will be well on your way to being the hero that we all know you are!",
	],
	"language-arts": [
		"Explorer Raili!",
		"Amazing Work!  You did your best and it shows!",
		"Keep going and complete the Quests below to continue to help the Whispering Giraffe Family find water and avoid the hungry lions!",
	],
	"social-studies": [
		"Explorer Raili!",
		"You’ve come so far and Assistant Daddy is sooooo proud of you!",
		"Continue your journey!  Do your best and you will soon succeed.",
		"Use your map skills to avert the danger that the lions pose!",
	],
	science: [
		"Explorer Raili!",
		"Incredible! You’re unstoppable!",
		"Let’s use science to continure our Quest of saving the Whispering Giraffe Family, by leading them to water",
	],
};
function isExplorerCopyActive(subject) {
	if (!selectedDailyMenuDateLabel.value) {
		return false;
	}

	const match = selectedDailyMenuDateLabel.value.match(
		/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})$/,
	);
	if (!match) {
		return false;
	}

	const [, monthName, dayValue, yearValue] = match;
	const monthIndex = new Date(`${monthName} 1, ${yearValue}`).getMonth();
	const selectedDate = new Date(Number(yearValue), monthIndex, Number(dayValue));
	const startDate = new Date(2026, 8, 28);

	return (
		selectedDate.getTime() === startDate.getTime() &&
		Boolean(explorerCopyBySubject[subject])
	);
}
const selectedTimelineStory = computed(() => {
	if (activeStoryTimelineTab.value === "Year" && isStoryButtonAvailable()) {
		return year1TimelineStory;
	}
	if (
		activeStoryTimelineTab.value === "Quarter" &&
		isStoryButtonAvailable(new Date(2026, 11, 21))
	) {
		return quarter1TimelineStory;
	}
	if (activeStoryTimelineTab.value === "Month" && isStoryButtonAvailable(new Date(2026, 9, 26))) {
		return month1TimelineStory;
	}
	if (activeStoryTimelineTab.value === "Week" && isStoryButtonAvailable(new Date(2026, 9, 5))) {
		return week1TimelineStory;
	}
	if (activeStoryTimelineTab.value === "Day" && isStoryButtonAvailable(new Date(2026, 9, 3))) {
		return storyContentByDateLabel[selectedDailyMenuDateLabel.value] ?? null;
	}
	return null;
});
const calendarPanelBackgroundImage = `url("${calendarPanelBackground}")`;
const calendarDayImage = `url("${septemberDayTexture}")`;
let explosionTimeoutId;
let explosionTextureTimeoutId;

/** Calendar-month selection pipeline boundary for stepping one month in either direction. */
function handleMonthSelectionOffset(monthOffset) {
	isDailyMenuOpen.value = false;
	selectedDailyMenuBlock.value = null;
	clearDayCellExplosion();
	currentMonthIndex.value =
		(currentMonthIndex.value + monthOffset + calendarMonths.length) % calendarMonths.length;
}

/** Daily menu close pipeline boundary. */
function handleDailyMenuClose() {
	isDailyMenuOpen.value = false;
	selectedDailyMenuSubject.value = null;
	selectedDailyMenuBlock.value = null;
	activeStoryTimelineTab.value = null;
}

/** Calendar navigation reset pipeline boundary. */
function resetToCalendar() {
	handleDailyMenuClose();
}

defineExpose({ resetToCalendar });

function handleDailyMenuSubjectSelection(subject) {
	selectedDailyMenuSubject.value = subject;
	selectedDailyMenuBlock.value = null;
	if (subject === "story") {
		activeStoryTimelineTab.value = "Year";
		return;
	}
	activeStoryTimelineTab.value = null;
}

function handleStoryPanelBack() {
	selectedDailyMenuSubject.value = null;
	activeStoryTimelineTab.value = null;
}

function handleBlockSelection(blockNumber) {
	selectedDailyMenuBlock.value = blockNumber;
}

function handleStoryTimelineTabSelection(tabName) {
	if (activeStoryTimelineTab.value === tabName) {
		return;
	}
	activeStoryTimelineTab.value = tabName;
}

function isStoryButtonAvailable(endDate) {
	if (!selectedDailyMenuDateLabel.value) {
		return false;
	}

	const match = selectedDailyMenuDateLabel.value.match(
		/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})$/,
	);
	if (!match) {
		return false;
	}

	const [, monthName, dayValue, yearValue] = match;
	const monthIndex = new Date(`${monthName} 1, ${yearValue}`).getMonth();
	const selectedDate = new Date(Number(yearValue), monthIndex, Number(dayValue));
	const storyStartDate = new Date(2026, 8, 28);
	const dayOfWeek = selectedDate.getDay();

	return (
		selectedDate >= storyStartDate &&
		dayOfWeek >= 1 &&
		dayOfWeek <= 5 &&
		(!endDate || selectedDate < endDate)
	);
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
	const explosionAudio = new Audio(explosionSound);
	void explosionAudio.play().catch(() => {
		// Ignore browser autoplay restrictions for the explosion effect.
	});
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

function isDecorativeSeptemberDayCell(cell) {
	if (!isCurrentMonthDayCell(cell) || currentMonth.value.monthName !== "September") {
		return false;
	}

	const dayNumber = Number(cell.value);
	return dayNumber >= 1 && dayNumber <= 27;
}

function handleDayCellClick(cell) {
	if (!isCurrentMonthDayCell(cell) || isDecorativeSeptemberDayCell(cell)) {
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
					v-if="currentMonthIndex > 0"
					aria-label="Show previous month"
					title="Show previous month"
					@click="handleMonthSelectionOffset(-1)"
				>
					Back
				</button>
				<span
					v-else
					class="calendar-previous-month-button invisible"
					aria-hidden="true"
				></span>
				<h1 id="calendar-menu-heading" class="student-menu-heading">Calendar</h1>
				<button
					v-if="currentMonthIndex < calendarMonths.length - 1"
					id="calendar-next-month-button"
					class="calendar-next-month-button"
					type="button"
					aria-label="Show next month"
					title="Show next month"
					@click="handleMonthSelectionOffset(1)"
				>
					Forward
				</button>
				<span v-else class="calendar-next-month-button invisible" aria-hidden="true"></span>
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
				v-if="hasDailyMenuContent"
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
				<p v-if="selectedDailyMenuSubject !== 'story'" class="daily-menu-date">
					{{ selectedDailyMenuDateLabel }}
				</p>
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
						{
							'daily-menu-subject-panel-stack--story':
								selectedDailyMenuSubject === 'story',
						},
					]"
				>
					<div
						v-if="selectedDailyMenuBlock !== null"
						class="daily-menu-subject-tab-list"
						role="tablist"
						:aria-label="`${blockSubjectLabels[selectedDailyMenuSubject]} block navigation`"
					>
						<button
							v-for="blockNumber in [1, 2, 3]"
							:id="`daily-menu-${selectedDailyMenuSubject}-block-${blockNumber}-button`"
							:key="blockNumber"
							:class="blockButtonClasses[selectedDailyMenuSubject][blockNumber - 1]"
							type="button"
							role="tab"
							:aria-label="`${blockSubjectLabels[selectedDailyMenuSubject]} Block ${blockNumber}`"
							:aria-selected="selectedDailyMenuBlock === blockNumber"
							@click="handleBlockSelection(blockNumber)"
						>
							Block {{ blockNumber }}
						</button>
					</div>
					<article
						v-if="selectedDailyMenuBlock !== null"
						:id="`daily-menu-${selectedDailyMenuSubject}-block-${selectedDailyMenuBlock}-panel`"
						class="daily-menu-subject-panel daily-menu-block-panel"
						:aria-label="`${selectedDailyMenuSubject} Block ${selectedDailyMenuBlock} panel`"
						:title="`${selectedDailyMenuSubject} Block ${selectedDailyMenuBlock} panel`"
					>
						<div
							v-if="isExplorerCopyActive(selectedDailyMenuSubject)"
							class="daily-menu-subject-panel-message"
						>
							<p
								v-for="line in explorerCopyBySubject[selectedDailyMenuSubject]"
								:key="line"
							>
								{{ line }}
							</p>
						</div>
					</article>
					<article
						v-if="
							selectedDailyMenuSubject === 'math' && selectedDailyMenuBlock === null
						"
						id="daily-menu-math-panel"
						class="daily-menu-subject-panel daily-menu-math-panel"
						aria-label="Math subject panel"
						title="Math subject panel"
					>
						<div
							v-if="isExplorerCopyActive('math')"
							class="daily-menu-subject-panel-message"
						>
							<p v-for="line in explorerCopyBySubject.math" :key="line">
								{{ line }}
							</p>
						</div>
						<div
							class="daily-menu-subject-tab-list"
							role="tablist"
							aria-label="Math block navigation"
						>
							<button
								id="daily-menu-math-block-1-button"
								class="daily-menu-math-block-1-button"
								type="button"
								role="tab"
								aria-label="Math Block 1"
								title="Math Block 1"
								aria-selected="false"
								@click="handleBlockSelection(1)"
							>
								Block 1
							</button>
							<button
								id="daily-menu-math-block-2-button"
								class="daily-menu-math-block-2-button"
								type="button"
								role="tab"
								aria-label="Math Block 2"
								title="Math Block 2"
								aria-selected="false"
								@click="handleBlockSelection(2)"
							>
								Block 2
							</button>
							<button
								id="daily-menu-math-block-3-button"
								class="daily-menu-math-block-3-button"
								type="button"
								role="tab"
								aria-label="Math Block 3"
								title="Math Block 3"
								aria-selected="false"
								@click="handleBlockSelection(3)"
							>
								Block 3
							</button>
						</div>
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
									:id="'daily-menu-story-tab-' + storyTab.toLowerCase()"
									:key="storyTab"
									type="button"
									class="daily-menu-story-tab"
									:class="{
										'daily-menu-story-tab--active':
											activeStoryTimelineTab === storyTab,
									}"
									:aria-selected="activeStoryTimelineTab === storyTab"
									@click="handleStoryTimelineTabSelection(storyTab)"
								>
									{{ storyTab }}
								</button>
							</div>
							<button
								v-if="selectedDailyMenuSubject === 'story'"
								id="daily-menu-story-back-button"
								class="daily-menu-story-back-button"
								type="button"
								aria-label="Back to daily menu"
								title="Back to daily menu"
								@click="handleStoryPanelBack"
							>
								Back
							</button>
							<div
								v-if="activeStoryTimelineTab"
								class="daily-menu-story-menu-panel"
								role="tabpanel"
								:aria-label="`${activeStoryTimelineTab} story menu`"
							>
								<h2>{{ activeStoryTimelineTab }}</h2>
								<h3>Theme</h3>
								<p v-if="selectedTimelineStory">
									{{ selectedTimelineStory.theme }}
								</p>
								<h2>Story</h2>
								<template v-if="selectedTimelineStory">
									<p
										v-for="paragraph in selectedTimelineStory.paragraphs"
										:key="paragraph"
									>
										{{ paragraph }}
									</p>
								</template>
							</div>
							<div v-else class="daily-menu-story-content">
								<h3>Theme</h3>
								<p v-if="selectedStoryContent">
									{{ selectedStoryContent.theme }}
								</p>
								<h2>Story</h2>
								<template v-if="selectedStoryContent">
									<p
										v-for="paragraph in selectedStoryContent.paragraphs"
										:key="paragraph"
									>
										{{ paragraph }}
									</p>
								</template>
							</div>
						</div>
					</article>
					<article
						v-if="
							selectedDailyMenuSubject === 'language-arts' &&
							selectedDailyMenuBlock === null
						"
						id="daily-menu-language-arts-panel"
						class="daily-menu-subject-panel daily-menu-language-arts-panel"
						aria-label="Language Arts subject panel"
						title="Language Arts subject panel"
					>
						<div
							v-if="isExplorerCopyActive('language-arts')"
							class="daily-menu-subject-panel-message"
						>
							<p v-for="line in explorerCopyBySubject['language-arts']" :key="line">
								{{ line }}
							</p>
						</div>
						<div
							class="daily-menu-subject-tab-list"
							role="tablist"
							aria-label="Language Arts block navigation"
						>
							<button
								id="daily-menu-language-arts-block-1-button"
								class="daily-menu-language-arts-block-1-button"
								type="button"
								role="tab"
								aria-label="Language Arts Block 1"
								title="Language Arts Block 1"
								aria-selected="false"
								@click="handleBlockSelection(1)"
							>
								Block 1
							</button>
							<button
								id="daily-menu-language-arts-block-2-button"
								class="daily-menu-language-arts-block-2-button"
								type="button"
								role="tab"
								aria-label="Language Arts Block 2"
								title="Language Arts Block 2"
								aria-selected="false"
								@click="handleBlockSelection(2)"
							>
								Block 2
							</button>
							<button
								id="daily-menu-language-arts-block-3-button"
								class="daily-menu-language-arts-block-3-button"
								type="button"
								role="tab"
								aria-label="Language Arts Block 3"
								title="Language Arts Block 3"
								aria-selected="false"
								@click="handleBlockSelection(3)"
							>
								Block 3
							</button>
						</div>
						<h2>Language Arts</h2>
					</article>
					<article
						v-if="
							selectedDailyMenuSubject === 'social-studies' &&
							selectedDailyMenuBlock === null
						"
						id="daily-menu-social-studies-panel"
						class="daily-menu-subject-panel daily-menu-social-studies-panel"
						aria-label="Social Studies subject panel"
						title="Social Studies subject panel"
					>
						<div
							v-if="isExplorerCopyActive('social-studies')"
							class="daily-menu-subject-panel-message"
						>
							<p v-for="line in explorerCopyBySubject['social-studies']" :key="line">
								{{ line }}
							</p>
						</div>
						<div
							class="daily-menu-subject-tab-list"
							role="tablist"
							aria-label="Social Studies block navigation"
						>
							<button
								id="daily-menu-social-studies-block-1-button"
								class="daily-menu-social-studies-block-1-button"
								type="button"
								role="tab"
								aria-label="Social Studies Block 1"
								title="Social Studies Block 1"
								aria-selected="false"
								@click="handleBlockSelection(1)"
							>
								Block 1
							</button>
							<button
								id="daily-menu-social-studies-block-2-button"
								class="daily-menu-social-studies-block-2-button"
								type="button"
								role="tab"
								aria-label="Social Studies Block 2"
								title="Social Studies Block 2"
								aria-selected="false"
								@click="handleBlockSelection(2)"
							>
								Block 2
							</button>
							<button
								id="daily-menu-social-studies-block-3-button"
								class="daily-menu-social-studies-block-3-button"
								type="button"
								role="tab"
								aria-label="Social Studies Block 3"
								title="Social Studies Block 3"
								aria-selected="false"
								@click="handleBlockSelection(3)"
							>
								Block 3
							</button>
						</div>
						<h2>Social Studies</h2>
					</article>
					<article
						v-if="
							selectedDailyMenuSubject === 'science' &&
							selectedDailyMenuBlock === null
						"
						id="daily-menu-science-panel"
						class="daily-menu-subject-panel daily-menu-science-panel"
						aria-label="Science subject panel"
						title="Science subject panel"
					>
						<div
							v-if="isExplorerCopyActive('science')"
							class="daily-menu-subject-panel-message"
						>
							<p v-for="line in explorerCopyBySubject.science" :key="line">
								{{ line }}
							</p>
						</div>
						<div
							class="daily-menu-subject-tab-list"
							role="tablist"
							aria-label="Science block navigation"
						>
							<button
								id="daily-menu-science-block-1-button"
								class="daily-menu-science-block-1-button"
								type="button"
								role="tab"
								aria-label="Science Block 1"
								title="Science Block 1"
								aria-selected="false"
								@click="handleBlockSelection(1)"
							>
								Block 1
							</button>
							<button
								id="daily-menu-science-block-2-button"
								class="daily-menu-science-block-2-button"
								type="button"
								role="tab"
								aria-label="Science Block 2"
								title="Science Block 2"
								aria-selected="false"
								@click="handleBlockSelection(2)"
							>
								Block 2
							</button>
							<button
								id="daily-menu-science-block-3-button"
								class="daily-menu-science-block-3-button"
								type="button"
								role="tab"
								aria-label="Science Block 3"
								title="Science Block 3"
								aria-selected="false"
								@click="handleBlockSelection(3)"
							>
								Block 3
							</button>
						</div>
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
