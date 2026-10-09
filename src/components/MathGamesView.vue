<script setup>
/** Topic-specific math practice with explicit feedback and self-paced, ten-level runs. */
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import MathGameArtwork from "./MathGameArtwork.vue";

const props = defineProps({
	layout: { type: String, default: "parent" },
});
const emit = defineEmits(["close", "go-home"]);
const galleryClasses = computed(() =>
	props.layout === "student"
		? "student-math-games-gallery bg-[#bfe9be] text-[#1d3f6d]"
		: "parent-math-games-gallery fixed top-[132px] right-4 bottom-4 left-[234px] bg-purple-950 text-white max-[48rem]:left-[141px]",
);

const games = [
	{ id: "place-names", title: "Place-Value Treehouse", topic: "Place value names", week: 1 },
	{ id: "digit-values", title: "Firefly Value Hunt", topic: "Value of a digit", week: 1 },
	{
		id: "place-relations",
		title: "Tenfold Train",
		topic: "Relationship between place values",
		week: 1,
	},
	{
		id: "place-conversion",
		title: "Crate Exchange",
		topic: "Convert between place values",
		week: 1,
	},
	{
		id: "expanded-form",
		title: "Expedition Blueprint",
		topic: "Convert between standard and expanded form",
		week: 1,
	},
	{
		id: "number-words",
		title: "Ranger Radio",
		topic: "Writing numbers up to one million: convert between words and digits",
		week: 1,
	},
	{
		id: "compare-numbers",
		title: "River Crossing",
		topic: "Compare numbers up to one million",
		week: 2,
	},
	{ id: "compare-tables", title: "Census Lookout", topic: "Compare numbers in tables", week: 2 },
	{
		id: "order-numbers",
		title: "Migration Lineup",
		topic: "Order numbers up to one million",
		week: 2,
	},
	{
		id: "round-place",
		title: "Rounding Lighthouse",
		topic: "Rounding: up to hundred thousands place",
		week: 2,
	},
	{
		id: "round-any",
		title: "Compass Rounding",
		topic: "Round a number to any place: up to hundred thousands",
		week: 2,
	},
	{ id: "round-puzzles", title: "Lost Map Tags", topic: "Rounding puzzles", week: 2 },
	{ id: "add-numbers", title: "Addition Trail", topic: "Add two multi-digit numbers", week: 3 },
	{
		id: "add-word",
		title: "Supply Dispatch",
		topic: "Add two multi-digit numbers: word problems",
		week: 3,
	},
	{
		id: "subtract-numbers",
		title: "Rescue Subtraction",
		topic: "Subtract two multi-digit numbers",
		week: 3,
	},
	{
		id: "subtract-word",
		title: "Habitat Tracker",
		topic: "Subtract two multi-digit numbers: word problems",
		week: 3,
	},
	{
		id: "compare-word",
		title: "Track Gap",
		topic: "Comparison word problems with addition and subtraction",
		week: 3,
	},
	{
		id: "sum-difference",
		title: "Twin Number Detective",
		topic: "Find two numbers based on sum and difference",
		week: 3,
	},
	{ id: "estimate-sums", title: "Supply Estimate", topic: "Estimate sums", week: 4 },
	{
		id: "estimate-sums-word",
		title: "Picnic Planner",
		topic: "Estimate sums: word problems",
		week: 4,
	},
	{
		id: "estimate-differences",
		title: "Distance Estimate",
		topic: "Estimate differences",
		week: 4,
	},
	{
		id: "estimate-differences-word",
		title: "Water Watch",
		topic: "Estimate differences: word problems",
		week: 4,
	},
	{
		id: "multi-step-word",
		title: "Rescue Route",
		topic: "Multi-step addition and subtraction word problems",
		week: 4,
	},
	{
		id: "equation-word",
		title: "Ranger Equations",
		topic: "Use equations to solve multi-step addition and subtraction word problems",
		week: 4,
	},
];
const thumbnailModels = {
	"place-names": {
		symbol: "1 10 100",
		path: "M12 38V24L33 8L54 24V38ZM24 38V26H42V38M67 10H98M67 22H92M67 34H86",
	},
	"digit-values": {
		symbol: "700",
		path: "M34 24A10 10 0 1 0 14 24A10 10 0 1 0 34 24M64 24A10 10 0 1 0 44 24A10 10 0 1 0 64 24M94 24A10 10 0 1 0 74 24A10 10 0 1 0 94 24M24 7V2M54 7V2M84 7V2",
	},
	"place-relations": {
		symbol: "x 10",
		path: "M12 13H36V32H12ZM42 13H66V32H42ZM72 13H96V32H72ZM36 23H42M66 23H72M18 36H30M48 36H60M78 36H90",
	},
	"place-conversion": {
		symbol: "100 / 10",
		path: "M12 10H36V34H12ZM24 10V34M12 22H36M68 8H82V22H68ZM87 8H101V22H87ZM68 27H82V41H68ZM87 27H101V41H87ZM43 25H61M56 20L61 25L56 30",
	},
	"expanded-form": { symbol: "100+20+3", path: "M12 6H97V36H12ZM38 6V36M65 6V36M12 21H97" },
	"number-words": {
		symbol: "123 / ABC",
		path: "M17 12H91V38H17ZM26 19H64V31H26ZM84 25A6 6 0 1 0 72 25A6 6 0 1 0 84 25M71 12L89 3",
	},
	"compare-numbers": {
		symbol: "< = >",
		path: "M13 33H96M21 33V22Q54 1 88 22V33M21 22H88M39 15V33M69 15V33",
	},
	"compare-tables": { symbol: "42 68 95", path: "M15 6H94V37H15ZM15 16H94M15 26H94M55 6V37" },
	"order-numbers": {
		symbol: "1 2 3 4",
		path: "M10 12H28V36H10ZM34 12H52V36H34ZM58 12H76V36H58ZM82 12H100V36H82",
	},
	"round-place": {
		symbol: "10 / 100",
		path: "M39 38L44 12H66L72 38ZM40 12L55 3L70 12M17 15L36 19M77 19L96 15M46 25H64",
	},
	"round-any": {
		symbol: "100,000",
		path: "M75 23A20 20 0 1 0 35 23A20 20 0 1 0 75 23M55 8L64 31L55 26L46 31ZM17 23H29M81 23H93",
	},
	"round-puzzles": {
		symbol: "?",
		path: "M15 9L40 3L68 10L95 4V36L68 42L40 35L15 41ZM40 3V35M68 10V42M24 25L32 17M77 23L87 32",
	},
	"add-numbers": {
		symbol: "24 + 12",
		path: "M13 34Q26 4 40 23T69 18T97 29M23 20V30M18 25H28M77 13V23M72 18H82",
	},
	"add-word": {
		symbol: "+ seeds",
		path: "M17 37L22 13H43L48 37ZM61 37L66 13H87L92 37M24 13L22 6H43L40 13M69 13L66 6H87L84 13M30 22V30M25 26H35",
	},
	"subtract-numbers": {
		symbol: "57 - 24",
		path: "M13 34Q26 4 40 23T69 18T97 29M18 25H28M72 18H82",
	},
	"subtract-word": {
		symbol: "birds left",
		path: "M13 18Q24 7 35 18Q46 7 57 18M49 34Q60 23 71 34Q82 23 93 34M65 11Q76 1 87 11Q96 3 103 11",
	},
	"compare-word": {
		symbol: "more / fewer",
		path: "M15 8H92V17H15ZM15 24H62V33H15ZM67 24H92V33H67",
	},
	"sum-difference": {
		symbol: "sum / gap",
		path: "M60 20A16 16 0 1 0 28 20A16 16 0 1 0 60 20M57 33L72 43M74 10H97M74 21H97M74 32H88",
	},
	"estimate-sums": {
		symbol: "~ +",
		path: "M13 8H44V36H13ZM65 8H96V36H65ZM28 8V36M13 22H44M80 8V36M65 22H96",
	},
	"estimate-sums-word": {
		symbol: "~ snacks",
		path: "M24 16Q55 -2 86 16M17 16H93L85 38H25ZM38 16V38M55 16V38M72 16V38",
	},
	"estimate-differences": {
		symbol: "~ -",
		path: "M12 35L31 9L51 35L75 7L98 35M18 40H92M31 9V35M75 7V35",
	},
	"estimate-differences-word": {
		symbol: "~ water",
		path: "M30 5H79V39H30ZM30 24Q42 17 54 24T79 24M35 12H44M35 32H44M86 10V33M82 29L86 33L90 29",
	},
	"multi-step-word": {
		symbol: "+ then -",
		path: "M14 32L33 11L56 32L78 11L97 32M28 11H38M33 6V16M73 11H83M9 32H19M92 32H102",
	},
	"equation-word": {
		symbol: "x = ...",
		path: "M17 5H92V34H17ZM29 34L23 42M80 34L86 42M29 17H48M59 13H80M59 21H80",
	},
};
const placeNames = [
	"Ones",
	"Tens",
	"Hundreds",
	"Thousands",
	"Ten Thousands",
	"Hundred Thousands",
	"Millions",
];
const placeNumbers = [23, 47, 315, 682, 2437, 8169, 35428, 760915, 934862, 1000000];
const targetPlaces = [0, 1, 0, 2, 1, 3, 2, 4, 5, 6];
const firstNumbers = [24, 57, 126, 428, 1234, 5729, 12345, 42876, 135792, 246810];
const secondNumbers = [12, 24, 27, 156, 623, 1347, 6342, 17893, 62748, 135729];
const activeGame = ref(null);
const levelIndex = ref(0);
const feedback = ref("");
const hintVisible = ref(false);
const questionHeading = ref(null);
const inputAnswers = ref([]);
const selectedValues = ref([]);
const selectedEquation = ref("");
const progress = ref(loadProgress());
const isCoinCelebrating = ref(false);
const winningSoundState = ref("idle");
const progressSaveFailed = ref(false);
let winningAudioContext = null;
const gameComplete = computed(() => levelIndex.value === 10);
const question = computed(() =>
	buildQuestion(activeGame.value?.id || "place-names", levelIndex.value % 10),
);
const feedbackText = computed(() => {
	if (feedback.value === "correct") return "Correct!";
	if (feedback.value === "retry")
		return "Not yet. Keep your work and try again, or check the hint.";
	return "";
});

function formatNumber(value) {
	return Number(value).toLocaleString("en-US");
}

function numberWords(value) {
	const small = [
		"zero",
		"one",
		"two",
		"three",
		"four",
		"five",
		"six",
		"seven",
		"eight",
		"nine",
		"ten",
		"eleven",
		"twelve",
		"thirteen",
		"fourteen",
		"fifteen",
		"sixteen",
		"seventeen",
		"eighteen",
		"nineteen",
	];
	const tens = [
		"",
		"",
		"twenty",
		"thirty",
		"forty",
		"fifty",
		"sixty",
		"seventy",
		"eighty",
		"ninety",
	];
	if (value < 20) return small[value];
	if (value < 100)
		return tens[Math.floor(value / 10)] + (value % 10 ? `-${small[value % 10]}` : "");
	if (value < 1000)
		return (
			`${small[Math.floor(value / 100)]} hundred` +
			(value % 100 ? ` ${numberWords(value % 100)}` : "")
		);
	if (value < 1000000)
		return (
			`${numberWords(Math.floor(value / 1000))} thousand` +
			(value % 1000 ? ` ${numberWords(value % 1000)}` : "")
		);
	return "one million";
}

/** Each topic has its own task, model, and ten deterministic difficulty steps. */
function buildQuestion(gameId, stage) {
	const number = placeNumbers[stage];
	const first = firstNumbers[stage];
	const second = secondNumbers[stage];
	const place = targetPlaces[stage];
	const digits = String(number);
	const base = {
		number: digits,
		place,
		choices: [],
		fields: [],
		expected: [],
		first,
		second,
		hint: "",
		mode: "choice",
	};
	const numericTask = (prompt, label, answer, hint, mode = "numeric") => ({
		...base,
		prompt,
		mode,
		fields: [label],
		expected: [answer],
		hint,
	});
	const roundPower = 10 ** (Math.min(Math.floor(stage / 2), 4) + 1);
	const rounded = Math.round(first / roundPower) * roundPower;
	const roundingHint = `Find the ${placeNames[Math.log10(roundPower)].toLowerCase()} place. If the next digit is 5 or more, round up; otherwise round down. Replace the digits to the right with zeros.`;
	const game = games.find((entry) => entry.id === gameId);
	if (!game) throw new Error(`Unknown math game: ${gameId}`);
	const builders = [
		buildPlaceValueQuestion,
		buildComparisonQuestion,
		buildArithmeticQuestion,
		buildEstimationQuestion,
	];
	return builders[game.week - 1](gameId, {
		number,
		first,
		second,
		place,
		digits,
		base,
		numericTask,
		stage,
		roundPower,
		rounded,
		roundingHint,
	});
}

function buildPlaceValueQuestion(gameId, { number, place, digits, base, numericTask, stage }) {
	switch (gameId) {
		case "place-names":
			return {
				...base,
				mode: "place-name",
				prompt: "Which place contains the highlighted digit?",
				answer: placeNames[place],
				choices: placeNames,
				hint: "From right to left: ones, tens, hundreds, thousands, ten thousands, hundred thousands, millions.",
			};
		case "digit-values": {
			const targetIndex = digits.length - 1 - place;
			return {
				...base,
				mode: "digit-value",
				prompt: `Find the digit worth ${formatNumber(Number(digits[targetIndex]) * 10 ** place)} in ${formatNumber(number)}.`,
				answer: targetIndex,
				hint: "A digit's value is the digit multiplied by its place value. For example, a 3 in the hundreds place is worth 300.",
			};
		}
		case "place-relations": {
			const lowerPlace = Math.min(Math.floor(stage / 2), 5);
			const movesLeft = stage % 2 === 0;
			return {
				...base,
				mode: "train",
				prompt: `The train moves from ${placeNames[movesLeft ? lowerPlace : lowerPlace + 1].toLowerCase()} to ${placeNames[movesLeft ? lowerPlace + 1 : lowerPlace].toLowerCase()}. How does the same digit's value change?`,
				choices: ["10 times as much", "One tenth as much"],
				answer: movesLeft ? "10 times as much" : "One tenth as much",
				hint: "Each move one place left multiplies the value by 10. Each move one place right divides the value by 10.",
			};
		}
		case "place-conversion": {
			const fromPlace = Math.min(1 + Math.floor(stage / 2), 5);
			const toPlace = Math.floor(stage / 4);
			return {
				...numericTask(
					`Exchange ${stage + 2} ${placeNames[fromPlace].toLowerCase()} for ${placeNames[toPlace].toLowerCase()}.`,
					"Number of smaller units",
					(stage + 2) * 10 ** (fromPlace - toPlace),
					"One large unit contains 10 units from the next smaller place. Multiply by 10 for each place crossed.",
					"exchange",
				),
				fromPlace,
				toPlace,
				amount: stage + 2,
			};
		}
		case "expanded-form": {
			const terms = [...digits]
				.map((digit, digitIndex) => Number(digit) * 10 ** (digits.length - 1 - digitIndex))
				.filter(Boolean);
			if (stage % 2)
				return numericTask(
					`Rebuild the number: ${terms.map(formatNumber).join(" + ")}.`,
					"Standard form",
					number,
					"Add the value of each place, keeping zero placeholders where a place is empty.",
					"blueprint",
				);
			return {
				...base,
				mode: "expanded-select",
				prompt: `Choose all the place-value pieces for ${formatNumber(number)}.`,
				choices: [...terms, number + 1, number + 10].map(String),
				expected: terms.map(String),
				hint: "Split the number into the value of each nonzero digit. In 347, the pieces are 300, 40, and 7.",
			};
		}
		case "number-words":
			if (stage % 2 === 0)
				return numericTask(
					`Decode the radio message: ${numberWords(number)}.`,
					"Number in digits",
					number,
					"Write each group in its place: millions, thousands, then hundreds, tens, and ones.",
					"radio",
				);
			return {
				...base,
				mode: "radio",
				prompt: `Send ${formatNumber(number)} as words.`,
				choices: [
					numberWords(Math.max(number - 1, 0)),
					numberWords(number),
					numberWords(Math.max(number - 10, 0)),
				],
				answer: numberWords(number),
				hint: "Read the number in groups of three digits. Say the thousands group before the final three digits.",
			};
	}
}

function buildComparisonQuestion(
	gameId,
	{ number, first, base, numericTask, stage, roundPower, rounded, roundingHint },
) {
	switch (gameId) {
		case "compare-numbers": {
			const comparisonNumber = number === 1000000 ? 999990 : number;
			const other = comparisonNumber + [10, 0, -1][stage % 3];
			const comparison = ["<", "=", ">"][Math.sign(comparisonNumber - other) + 1];
			return {
				...base,
				mode: "compare",
				prompt: "Choose the crossing that compares these numbers.",
				first: comparisonNumber,
				second: other,
				choices: ["<", "=", ">"],
				answer: comparison,
				hint: "Start at the leftmost digit. The first different digit tells which number is greater; identical digits mean equal numbers.",
			};
		}
		case "compare-tables": {
			const rows = [
				{ label: "Forest", count: first + 14 },
				{ label: "Wetland", count: first - 8 },
				{ label: "Grassland", count: first + 2 },
			];
			return {
				...base,
				mode: "table",
				rows,
				prompt: `Which habitat has the ${stage % 2 === 0 ? "most" : "fewest"} recorded sightings?`,
				answer: stage % 2 === 0 ? "Forest" : "Wetland",
				hint: "Keep each habitat name beside its count. Compare the counts from the leftmost place.",
			};
		}
		case "order-numbers": {
			const choices = [number - 3, number - 12, number - 1, number - 7];
			const descending = stage % 2 === 1;
			return {
				...base,
				mode: "order",
				prompt: `Line up the migration tags from ${descending ? "greatest to least" : "least to greatest"}.`,
				choices: choices.map(String),
				expected: [...choices]
					.sort((left, right) => (descending ? right - left : left - right))
					.map(String),
				hint: "Compare the leftmost digits first. Keep equal leading digits together and then compare the next place.",
			};
		}
		case "round-place": {
			const lower = Math.floor(first / roundPower) * roundPower;
			return {
				...base,
				mode: "lighthouse",
				prompt: `Guide ${formatNumber(first)} to the nearest ${placeNames[Math.log10(roundPower)].toLowerCase()} landing.`,
				choices: [String(lower), String(lower + roundPower)],
				answer: String(rounded),
				hint: roundingHint,
				roundPower,
			};
		}
		case "round-any": {
			const compassPlace = [1, 2, 1, 3, 2, 4, 3, 5, 4, 5][stage];
			const compassPower = 10 ** compassPlace;
			return {
				...numericTask(
					`Round ${formatNumber(first)} to the nearest ${placeNames[compassPlace].toLowerCase()}.`,
					"Rounded number",
					Math.round(first / compassPower) * compassPower,
					"Locate the requested place, check the digit immediately to its right, then round and replace the later digits with zeros.",
					"compass",
				),
				roundPower: compassPower,
			};
		}
		case "round-puzzles":
			return {
				...base,
				mode: "map-puzzle",
				prompt: `A lost tag rounds to ${formatNumber(rounded)} to the nearest ${placeNames[Math.log10(roundPower)].toLowerCase()}. Which tag fits?`,
				choices: [
					rounded + roundPower,
					first,
					Math.max(0, rounded - roundPower),
					rounded + 2 * roundPower,
				].map(String),
				answer: String(first),
				hint: "Round each candidate to the named place. Only one candidate matches the clue.",
			};
	}
}

function buildArithmeticQuestion(gameId, { first, second, base, numericTask, stage }) {
	switch (gameId) {
		case "add-numbers":
			return {
				...numericTask(
					"Join the two supply trails.",
					"Sum",
					first + second,
					"Line up equal places. Add from the ones column. Ten ones can be regrouped as one ten.",
					"columns",
				),
				operator: "+",
			};
		case "add-word":
			return numericTask(
				`A ranger packs ${formatNumber(first)} seeds. Another ranger packs ${formatNumber(second)} seeds. How many seeds do they pack altogether?`,
				"Total seeds",
				first + second,
				"Altogether means combine both groups. Add the two seed counts.",
				"supplies",
			);
		case "subtract-numbers":
			return {
				...numericTask(
					"Find what remains on the rescue trail.",
					"Difference",
					first - second,
					"Line up equal places and subtract from the ones column. Regroup one larger unit as ten smaller units when needed.",
					"columns",
				),
				operator: "-",
			};
		case "subtract-word":
			return numericTask(
				`There are ${formatNumber(first)} birds at the wetland. ${formatNumber(second)} fly away. How many birds remain?`,
				"Birds remaining",
				first - second,
				"Start with the full group and subtract the birds that left.",
				"habitat",
			);
		case "compare-word": {
			const more = stage % 2 === 0;
			return {
				...numericTask(
					`The grassland has ${formatNumber(first)} recorded tracks. The forest has ${formatNumber(second)} ${more ? "more" : "fewer"} tracks. How many tracks are in the forest?`,
					"Forest tracks",
					more ? first + second : first - second,
					more
						? "Start with the grassland count and add the extra tracks."
						: "Start with the grassland count and subtract the gap.",
					"bars",
				),
				operator: more ? "+" : "-",
			};
		}
		case "sum-difference":
			return {
				...base,
				mode: "detective",
				prompt: `Two mystery counts have a sum of ${formatNumber(first + second)} and a difference of ${formatNumber(first - second)}. Find both counts.`,
				fields: ["Smaller number", "Larger number"],
				expected: [second, first],
				hint: "Subtract the difference from the sum, then halve the result to find the smaller number. Add the difference to find the larger number.",
				sum: first + second,
				difference: first - second,
			};
	}
}

function buildEstimationQuestion(gameId, { first, second, base, stage }) {
	switch (gameId) {
		case "estimate-sums":
		case "estimate-sums-word":
		case "estimate-differences":
		case "estimate-differences-word": {
			const isSum = gameId.includes("sums");
			const estimatePower = 10 ** (1 + Math.floor(stage / 3));
			const roundedFirst = Math.round(first / estimatePower) * estimatePower;
			const roundedSecond = Math.round(second / estimatePower) * estimatePower;
			const stories = {
				"estimate-sums-word": `Two supply stores have ${formatNumber(first)} and ${formatNumber(second)} snack packs. Estimate the total.`,
				"estimate-differences-word": `A tank holds ${formatNumber(first)} liters. Rangers use ${formatNumber(second)} liters. Estimate the water remaining.`,
			};
			const story =
				stories[gameId] ||
				`Estimate ${formatNumber(first)} ${isSum ? "+" : "-"} ${formatNumber(second)}.`;
			return {
				...base,
				mode: isSum ? "estimate-pack" : "estimate-water",
				operator: isSum ? "+" : "-",
				prompt: `${story} Round both counts to the nearest ${placeNames[Math.log10(estimatePower)].toLowerCase()}.`,
				fields: [
					"First rounded number",
					"Second rounded number",
					isSum ? "Estimated total" : "Estimated difference",
				],
				expected: [
					roundedFirst,
					roundedSecond,
					isSum ? roundedFirst + roundedSecond : roundedFirst - roundedSecond,
				],
				hint: "Round each original number separately to the named place. Then use the rounded numbers, not the original numbers, to calculate the estimate.",
			};
		}
		case "multi-step-word":
		case "equation-word": {
			const delivered = Math.floor(second / 2) + 1;
			const afterCollection = first + second;
			const remaining = afterCollection - delivered;
			const prompt = `Rangers start with ${formatNumber(first)} supplies, collect ${formatNumber(second)} more, then deliver ${formatNumber(delivered)}. How many remain?`;
			if (gameId === "multi-step-word")
				return {
					...base,
					mode: "route",
					prompt,
					fields: ["After collecting supplies", "After delivery"],
					expected: [afterCollection, remaining],
					hint: "First combine the starting supplies and the collection. Keep that total, then subtract the delivery.",
					delivered,
				};
			const equation = `x = (${first} + ${second}) - ${delivered}`;
			return {
				...base,
				mode: "equation",
				prompt,
				choices: [
					equation,
					`x = (${first} + ${second}) + ${delivered}`,
					`x = ${first} - (${second} + ${delivered})`,
				],
				answer: equation,
				fields: ["Supplies remaining"],
				expected: [remaining],
				hint: "Collection increases the supplies; delivery decreases them. The correct equation adds first, then subtracts.",
				delivered,
			};
		}
		default:
			throw new Error(`Unknown math game: ${gameId}`);
	}
}

function loadProgress() {
	try {
		const saved = JSON.parse(localStorage.getItem("zoologist-math-games-progress") || "{}");
		return Object.fromEntries(
			games.map((game) => [
				game.id,
				Number.isInteger(saved?.[game.id]) && saved[game.id] >= 0 && saved[game.id] <= 10
					? saved[game.id]
					: 0,
			]),
		);
	} catch {
		return {};
	}
}

async function focusQuestion() {
	await nextTick();
	questionHeading.value?.focus();
}

function startGame(game) {
	if (isCoinCelebrating.value) return;
	prepareWinningAudio();
	activeGame.value = game;
	levelIndex.value = (progress.value[game.id] || 0) % 10;
	resetAnswers();
	focusQuestion();
}

function resetAnswers() {
	feedback.value = "";
	hintVisible.value = false;
	inputAnswers.value = question.value.fields.map(() => "");
	selectedValues.value = [];
	selectedEquation.value = "";
}

function numericAnswersMatch() {
	return question.value.expected.every((expected, answerIndex) => {
		const typed = String(inputAnswers.value[answerIndex] || "").trim();
		return /^\d+(?:,\d{3})*$/.test(typed) && Number(typed.replaceAll(",", "")) === expected;
	});
}

function togglePiece(piece) {
	if (feedback.value === "correct") return;
	if (selectedValues.value.includes(piece))
		selectedValues.value = selectedValues.value.filter((selected) => selected !== piece);
	else selectedValues.value.push(piece);
}

function checkAnswer(answer = null) {
	if (feedback.value === "correct") return;
	let matches;
	if (question.value.mode === "expanded-select") {
		matches =
			selectedValues.value.length === question.value.expected.length &&
			question.value.expected.every((piece) => selectedValues.value.includes(piece));
	} else if (question.value.mode === "order") {
		matches = JSON.stringify(selectedValues.value) === JSON.stringify(question.value.expected);
	} else if (question.value.mode === "equation") {
		matches = selectedEquation.value === question.value.answer && numericAnswersMatch();
	} else if (question.value.fields.length) {
		matches = numericAnswersMatch();
	} else matches = answer === question.value.answer;
	if (!matches) {
		feedback.value = "retry";
		return;
	}
	const isFirstGameCompletion = progress.value[activeGame.value.id] !== 10;
	feedback.value = "correct";
	progress.value[activeGame.value.id] = Math.max(
		progress.value[activeGame.value.id] || 0,
		levelIndex.value + 1,
	);
	try {
		const storedProgress = loadProgress();
		for (const game of games)
			progress.value[game.id] = Math.max(
				progress.value[game.id] || 0,
				storedProgress[game.id] || 0,
			);
		localStorage.setItem("zoologist-math-games-progress", JSON.stringify(progress.value));
		progressSaveFailed.value = false;
	} catch {
		progressSaveFailed.value = true;
	}
	if (levelIndex.value === 9 && isFirstGameCompletion) {
		winningSoundState.value = "waiting";
		isCoinCelebrating.value = true;
	}
}

function advanceLevel() {
	levelIndex.value += 1;
	resetAnswers();
	focusQuestion();
}

function choiceLabel(choice) {
	if (question.value.mode === "compare")
		return { "<": "Less than", "=": "Equal to", ">": "Greater than" }[choice];
	return /^\d+$/.test(choice) ? formatNumber(choice) : choice;
}

/** Unlock audio on the game-start gesture; the chime follows the three-second spin. */
function prepareWinningAudio() {
	const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextConstructor) {
		winningSoundState.value = "unavailable";
		return;
	}
	try {
		winningAudioContext ||= new AudioContextConstructor();
		winningAudioContext.resume().catch(() => {
			winningSoundState.value = "unavailable";
		});
	} catch {
		winningSoundState.value = "unavailable";
	}
}

function playWinningSound() {
	if (winningAudioContext?.state !== "running") {
		winningSoundState.value = "unavailable";
		return;
	}
	const startTime = winningAudioContext.currentTime;
	for (const [noteIndex, frequency] of [523.25, 659.25, 783.99, 1046.5].entries()) {
		const oscillator = winningAudioContext.createOscillator();
		const gain = winningAudioContext.createGain();
		const noteTime = startTime + noteIndex * 0.12;
		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(frequency, noteTime);
		gain.gain.setValueAtTime(0.0001, noteTime);
		gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.03);
		gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.3);
		oscillator.connect(gain);
		gain.connect(winningAudioContext.destination);
		oscillator.onended = () => {
			oscillator.disconnect();
			gain.disconnect();
		};
		oscillator.start(noteTime);
		oscillator.stop(noteTime + 0.32);
	}
	winningSoundState.value = "played";
}

function handleCoinAnimationEnd() {
	if (!isCoinCelebrating.value) return;
	playWinningSound();
	isCoinCelebrating.value = false;
}

onBeforeUnmount(() => {
	winningAudioContext?.close().catch(() => {
		winningSoundState.value = "unavailable";
	});
});
</script>

<template>
	<section
		id="math-games-view"
		class="math-games-view overflow-y-auto"
		:class="activeGame ? 'fixed inset-4 z-50 bg-white p-4 text-black' : galleryClasses"
		:data-winning-sound="winningSoundState"
		aria-label="Math games"
		title="Math games"
	>
		<p
			v-if="progressSaveFailed"
			class="mb-4 border-2 border-rose-700 bg-rose-50 p-3"
			role="alert"
		>
			Progress could not be saved. Keep this page open and try again before leaving.
		</p>
		<template v-if="!activeGame">
			<h2 class="sr-only">Math Games</h2>
			<div
				:class="
					layout === 'student'
						? 'student-math-games-grid'
						: 'grid grid-cols-[repeat(auto-fill,218px)] gap-4'
				"
			>
				<button
					v-for="game in games"
					:id="`math-game-${game.id}`"
					:key="game.id"
					:data-game-id="game.id"
					:data-game-topic="game.topic"
					type="button"
					class="relative flex h-[218px] w-[218px] shrink-0 flex-col items-center rounded-lg border-2 border-cyan-800 bg-white p-2 text-black focus-visible:outline-4 focus-visible:outline-cyan-800"
					:class="
						layout === 'student'
							? 'student-math-game-thumbnail'
							: 'parent-math-game-thumbnail'
					"
					:aria-label="game.title"
					:title="`Week ${game.week}: ${game.topic}`"
					@click="startGame(game)"
				>
					<span class="relative block h-[148px] w-full overflow-hidden rounded">
						<MathGameArtwork
							class="absolute inset-0 h-full w-full"
							:path="thumbnailModels[game.id].path"
							:symbol="thumbnailModels[game.id].symbol"
							:week="game.week"
							:label="`${game.title} game illustration`"
						/>
						<svg
							viewBox="0 0 218 148"
							class="absolute inset-0 h-full w-full"
							aria-hidden="true"
						>
							<rect
								data-game-shadow
								width="218"
								height="148"
								fill="#111827"
								:fill-opacity="(0.72 * (10 - (progress[game.id] || 0))) / 10"
							/>
						</svg>
						<svg
							viewBox="0 0 40 40"
							class="math-games-thumbnail-coin absolute top-2 right-2 h-10 w-10"
							aria-hidden="true"
						>
							<circle
								cx="20"
								cy="20"
								r="17"
								fill="#facc15"
								stroke="#a16207"
								stroke-width="3"
								:fill-opacity="(progress[game.id] || 0) / 10"
								:stroke-opacity="(progress[game.id] || 0) / 10"
							/>
							<circle
								cx="20"
								cy="20"
								r="12"
								fill="#fde047"
								stroke="#fef9c3"
								stroke-width="2"
								:fill-opacity="(progress[game.id] || 0) / 10"
								:stroke-opacity="(progress[game.id] || 0) / 10"
							/>
							<path
								d="M20 8L23 16L32 17L25 23L27 32L20 27L13 32L15 23L8 17L17 16Z"
								fill="#ca8a04"
								:fill-opacity="(progress[game.id] || 0) / 10"
							/>
						</svg>
					</span>
					<span
						data-game-caption
						class="block h-[40px] w-full overflow-hidden text-center text-sm leading-4 font-bold [overflow-wrap:anywhere]"
						>{{ game.title }}</span
					>
					<span class="block text-xs leading-4">{{ progress[game.id] || 0 }} / 10</span>
				</button>
			</div>
			<button
				v-if="layout === 'student'"
				id="student-math-games-home-button"
				type="button"
				class="student-math-games-home-button navigation-home-button rounded border-2 border-green-800 bg-white px-4 py-2 text-black"
				aria-label="Return home"
				title="Return home"
				@click="emit('go-home')"
			>
				Home
			</button>
			<button
				v-if="layout === 'student'"
				id="student-math-games-back-button"
				type="button"
				class="student-math-games-back-button navigation-back-button fixed right-4 bottom-4 z-50 rounded border-2 border-cyan-800 bg-white px-4 py-2 text-black"
				aria-label="Back to student menu"
				title="Back to student menu"
				@click="emit('close')"
			>
				Back
			</button>
		</template>
		<template v-else>
			<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
				<h2 class="text-2xl font-bold">{{ activeGame.title }}</h2>
				<button
					id="math-games-back-to-gallery-button"
					type="button"
					class="navigation-back-button rounded border-2 border-black bg-white px-4 py-2 disabled:opacity-60"
					:disabled="isCoinCelebrating"
					@click="activeGame = null"
				>
					Back to games
				</button>
			</div>
			<section
				v-if="gameComplete"
				id="math-games-complete"
				class="math-games-complete"
				aria-label="Game complete"
				title="Game complete"
			>
				<h3 class="text-2xl font-bold">All 10 levels complete!</h3>
				<button
					id="math-games-play-again-button"
					type="button"
					class="mt-4 rounded border-2 border-green-700 bg-green-100 px-4 py-2 disabled:opacity-60"
					:disabled="isCoinCelebrating"
					@click="startGame(activeGame)"
				>
					Play again
				</button>
			</section>
			<section
				v-else
				id="math-games-current-level"
				aria-label="Current level"
				title="Current level"
				class="mx-auto max-w-2xl"
			>
				<p class="mb-2">Week {{ activeGame.week }}: {{ activeGame.topic }}</p>
				<p class="mb-4 font-bold">Level {{ levelIndex + 1 }} of 10</p>
				<MathGameArtwork
					class="mx-auto mb-4 h-[188px] w-80 max-w-full"
					:path="thumbnailModels[activeGame.id].path"
					:symbol="thumbnailModels[activeGame.id].symbol"
					:week="activeGame.week"
					:label="`First-level image for ${activeGame.title}`"
				/>
				<h3 ref="questionHeading" tabindex="-1" class="mb-4 text-xl font-bold">
					{{ question.prompt }}
				</h3>
				<div
					v-if="question.mode === 'place-name'"
					class="mb-6 flex justify-center gap-1 sm:gap-2"
					aria-label="Number with highlighted digit"
				>
					<span
						v-for="(digit, digitIndex) in question.number.split('')"
						:key="digitIndex"
						class="flex h-14 w-8 shrink-0 items-center justify-center border-b-4 text-2xl sm:w-10"
						:class="
							digitIndex === question.number.length - 1 - question.place
								? 'border-green-700 bg-green-100 font-bold'
								: 'border-transparent'
						"
						:aria-label="
							digitIndex === question.number.length - 1 - question.place
								? `Highlighted digit ${digit}`
								: digit
						"
						>{{ digit }}</span
					>
				</div>
				<div
					v-if="question.mode === 'digit-value'"
					class="mb-6 flex justify-center gap-1 sm:gap-2"
				>
					<button
						v-for="(digit, digitIndex) in question.number.split('')"
						:id="`math-game-digit-choice-${digitIndex}`"
						:key="digitIndex"
						type="button"
						class="h-14 w-8 shrink-0 rounded border-2 border-yellow-700 bg-yellow-100 text-2xl sm:w-10"
						:aria-label="`Digit ${digit} in the ${placeNames[question.number.length - 1 - digitIndex]} place`"
						:disabled="feedback === 'correct'"
						@click="checkAnswer(digitIndex)"
					>
						{{ digit }}
					</button>
				</div>
				<div
					v-if="question.mode === 'compare'"
					class="mb-4 flex flex-wrap justify-center gap-4 text-2xl font-bold"
					aria-label="Numbers to compare"
				>
					<span>{{ formatNumber(question.first) }}</span
					><span aria-label="Comparison">?</span
					><span>{{ formatNumber(question.second) }}</span>
				</div>
				<div
					v-if="question.mode === 'columns'"
					class="mx-auto mb-4 w-fit border-b-4 border-green-800 px-4 text-right font-mono text-2xl"
				>
					<p>{{ formatNumber(question.first) }}</p>
					<p>{{ question.operator }} {{ formatNumber(question.second) }}</p>
				</div>
				<div v-if="question.mode === 'bars'" class="mb-4 space-y-2">
					<p class="border-l-8 border-cyan-700 bg-cyan-50 p-3">
						Grassland: {{ formatNumber(question.first) }}
					</p>
					<p class="border-l-8 border-rose-700 bg-rose-50 p-3">
						Forest: {{ question.operator === "+" ? "more" : "fewer" }} by
						{{ formatNumber(question.second) }}
					</p>
				</div>
				<div
					v-if="question.mode === 'exchange'"
					class="mb-4 flex flex-wrap items-center justify-center gap-3"
				>
					<span class="border-2 border-green-700 bg-green-50 p-3"
						>{{ question.amount }} {{ placeNames[question.fromPlace] }}</span
					><span>=</span
					><span class="border-2 border-yellow-700 bg-yellow-50 p-3"
						>? {{ placeNames[question.toPlace] }}</span
					>
				</div>
				<div v-if="question.mode === 'detective'" class="mb-4 flex flex-wrap gap-4">
					<p class="border-l-4 border-cyan-700 pl-3">
						Sum: {{ formatNumber(question.sum) }}
					</p>
					<p class="border-l-4 border-rose-700 pl-3">
						Difference: {{ formatNumber(question.difference) }}
					</p>
				</div>
				<table
					v-if="question.mode === 'table'"
					class="mb-4 w-full border-collapse text-left"
				>
					<caption class="mb-2 font-bold">
						Habitat sightings
					</caption>
					<thead>
						<tr>
							<th class="border-b-2 p-2">Habitat</th>
							<th class="border-b-2 p-2">Sightings</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in question.rows" :key="row.label">
							<td class="border-b p-2">
								<button
									:id="`math-game-table-choice-${row.label}`"
									type="button"
									class="rounded border-2 border-cyan-800 bg-cyan-50 px-3 py-2"
									:disabled="feedback === 'correct'"
									@click="checkAnswer(row.label)"
								>
									{{ row.label }}
								</button>
							</td>
							<td class="border-b p-2">{{ formatNumber(row.count) }}</td>
						</tr>
					</tbody>
				</table>
				<ol
					v-if="question.mode === 'order'"
					class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
					aria-label="Ordered migration tags"
				>
					<li
						v-for="slot in 4"
						:key="slot"
						class="flex min-h-14 items-center justify-center border-b-4 border-cyan-700 bg-cyan-50 p-2 font-bold"
					>
						{{
							selectedValues[slot - 1] ? formatNumber(selectedValues[slot - 1]) : "?"
						}}
					</li>
				</ol>
				<div
					v-if="question.choices.length"
					class="grid grid-cols-1 gap-3 sm:grid-cols-2"
					:class="question.mode === 'lighthouse' ? 'border-b-4 border-cyan-700 pb-4' : ''"
				>
					<button
						v-for="(choice, choiceIndex) in question.choices"
						:id="`math-game-choice-${choiceIndex}`"
						:key="choice"
						type="button"
						class="min-h-12 rounded border-2 border-green-800 bg-green-50 px-3 py-2 text-left break-words disabled:opacity-60"
						:class="
							(question.mode === 'expanded-select' &&
								selectedValues.includes(choice)) ||
							(question.mode === 'equation' && selectedEquation === choice)
								? 'ring-4 ring-yellow-500'
								: ''
						"
						:disabled="
							feedback === 'correct' ||
							(question.mode === 'order' && selectedValues.includes(choice))
						"
						:aria-pressed="
							question.mode === 'expanded-select'
								? selectedValues.includes(choice)
								: question.mode === 'equation'
									? selectedEquation === choice
									: undefined
						"
						:aria-label="choiceLabel(choice)"
						@click="
							question.mode === 'expanded-select'
								? togglePiece(choice)
								: question.mode === 'order'
									? selectedValues.push(choice)
									: question.mode === 'equation'
										? (selectedEquation = choice)
										: checkAnswer(choice)
						"
					>
						{{ question.mode === "compare" ? choice : choiceLabel(choice) }}
					</button>
				</div>
				<button
					v-if="
						question.mode === 'order' && selectedValues.length && feedback !== 'correct'
					"
					id="math-game-undo-last-button"
					type="button"
					class="mt-3 rounded border-2 border-black bg-white px-4 py-2"
					@click="selectedValues.pop()"
				>
					Undo last
				</button>
				<form
					v-if="question.fields.length"
					class="mt-4 space-y-4"
					@submit.prevent="checkAnswer()"
					@keydown.enter.prevent="checkAnswer()"
				>
					<div v-for="(field, fieldIndex) in question.fields" :key="field">
						<label
							:for="`math-game-answer-${fieldIndex}`"
							class="mb-2 block font-bold"
							>{{ field }}</label
						><input
							:id="`math-game-answer-${fieldIndex}`"
							v-model="inputAnswers[fieldIndex]"
							type="text"
							inputmode="numeric"
							autocomplete="off"
							class="w-full rounded border-2 border-green-800 bg-white px-3 py-2 text-lg text-black disabled:bg-green-50"
							:disabled="feedback === 'correct'"
						/>
					</div>
					<button
						id="math-game-check-answer-button"
						type="button"
						class="rounded border-2 border-green-800 bg-green-100 px-4 py-2"
						:disabled="feedback === 'correct'"
						@click="checkAnswer()"
					>
						Check answer
					</button>
				</form>
				<button
					v-if="['order', 'expanded-select'].includes(question.mode)"
					id="math-game-selection-check-answer-button"
					type="button"
					class="mt-4 rounded border-2 border-green-800 bg-green-100 px-4 py-2"
					:disabled="feedback === 'correct'"
					@click="checkAnswer()"
				>
					Check answer
				</button>
				<output class="mt-4 block min-h-8 font-bold" aria-live="polite">{{
					feedbackText
				}}</output>
				<button
					v-if="feedback === 'correct'"
					id="math-game-next-level-button"
					type="button"
					class="mt-2 rounded border-2 border-green-800 bg-green-100 px-4 py-2"
					@click="advanceLevel"
				>
					{{ levelIndex === 9 ? "Finish" : "Next level" }}
				</button>
				<button
					v-else
					id="math-game-hint-toggle-button"
					type="button"
					class="mt-2 rounded border-2 border-black bg-white px-4 py-2"
					:aria-expanded="hintVisible"
					@click="hintVisible = !hintVisible"
				>
					Hint
				</button>
				<p v-if="hintVisible" class="mt-4 border-l-4 border-green-700 pl-4">
					{{ question.hint }}
				</p>
			</section>
		</template>
		<div
			v-if="isCoinCelebrating"
			class="math-games-coin-stage pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
			aria-live="polite"
		>
			<svg
				class="math-games-winning-coin"
				viewBox="0 0 109 109"
				role="img"
				aria-label="Winning gold coin"
				@animationend="handleCoinAnimationEnd"
			>
				<circle
					cx="54.5"
					cy="54.5"
					r="47"
					fill="#facc15"
					stroke="#a16207"
					stroke-width="5"
				/>
				<circle
					cx="54.5"
					cy="54.5"
					r="37"
					fill="#fde047"
					stroke="#fef9c3"
					stroke-width="3"
				/>
				<path
					d="M54.5 26L62 44L82 46L67 60L71 81L54.5 71L38 81L42 60L27 46L47 44Z"
					fill="#ca8a04"
				/>
			</svg>
		</div>
	</section>
</template>

<style scoped>
.student-math-games-gallery {
	position: fixed;
	z-index: 40;
	top: 112px;
	right: 1rem;
	bottom: 2rem;
	left: calc(var(--student-menu-navigation-width) + 1rem);
}

.student-math-games-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 216px), 1fr));
	gap: 1rem;
}

.student-math-games-grid .student-math-game-thumbnail {
	width: 100%;
	height: auto;
	min-height: 0;
	aspect-ratio: 1;
}

.math-games-thumbnail-coin {
	filter: drop-shadow(0 0 5px #facc15);
}

.math-games-winning-coin {
	width: 109px;
	height: 109px;
	filter: drop-shadow(0 0 12px #facc15);
	animation: math-games-coin-win 3s linear forwards;
}

@keyframes math-games-coin-win {
	from {
		transform: rotateY(0deg) scale(0.5);
	}
	to {
		transform: rotateY(1080deg) scale(2.6);
	}
}

@media (prefers-reduced-motion: reduce) {
	.math-games-winning-coin {
		animation-name: math-games-coin-still;
	}
}

@keyframes math-games-coin-still {
	from {
		transform: none;
	}
	to {
		transform: none;
	}
}
</style>
