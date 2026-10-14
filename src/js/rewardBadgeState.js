import { computed, ref } from "vue";
import mathBadge001 from "../../assets/images/stickers/mathBadge001.webp";
import mathBadge002 from "../../assets/images/stickers/mathBadge002.webp";
import mathBadge003 from "../../assets/images/stickers/mathBadge003.webp";
import mathBadge004 from "../../assets/images/stickers/mathBadge004.webp";
import mathBadge005 from "../../assets/images/stickers/mathBadge005.webp";
import langArts001 from "../../assets/images/stickers/langArts001.webp";
import langArts002 from "../../assets/images/stickers/langArts002.webp";
import langArts003 from "../../assets/images/stickers/langArts003.webp";
import langArts004 from "../../assets/images/stickers/langArts004.webp";
import langArts005 from "../../assets/images/stickers/langArts005.webp";
import socialStudies001 from "../../assets/images/stickers/socialStudies001.webp";
import socialStudies002 from "../../assets/images/stickers/socialStudies002.webp";
import socialStudies003 from "../../assets/images/stickers/socialStudies003.webp";
import socialStudies004 from "../../assets/images/stickers/socialStudies004.webp";
import socialStudies005 from "../../assets/images/stickers/socialStudies005.webp";
import scienceBadge001 from "../../assets/images/stickers/scienceBadge001NBG.webp";
import scienceBadge002 from "../../assets/images/stickers/scienceBadge002.webp";
import scienceBadge003 from "../../assets/images/stickers/scienceBadge003.webp";
import scienceBadge004 from "../../assets/images/stickers/scienceBadge004.webp";
import scienceBadge005 from "../../assets/images/stickers/scienceBadge005.webp";

/** Persistent reward definitions and earned-badge state for subject completion. */
const EARNED_BADGES_STORAGE_KEY = "ze2.studentProgress.earnedBadges";
const badgeDates = [
	{ dateKey: "2026-10-16", badgeNumber: "001" },
	{ dateKey: "2026-10-17", badgeNumber: "002" },
	{ dateKey: "2026-10-18", badgeNumber: "003" },
	{ dateKey: "2026-10-19", badgeNumber: "004" },
	{ dateKey: "2026-10-20", badgeNumber: "005" },
];
const subjectBadgeAssets = [
	{
		subject: "math",
		subjectLabel: "Math",
		assets: [mathBadge001, mathBadge002, mathBadge003, mathBadge004, mathBadge005],
	},
	{
		subject: "language-arts",
		subjectLabel: "Language Arts",
		assets: [langArts001, langArts002, langArts003, langArts004, langArts005],
	},
	{
		subject: "social-studies",
		subjectLabel: "Social Studies",
		assets: [
			socialStudies001,
			socialStudies002,
			socialStudies003,
			socialStudies004,
			socialStudies005,
		],
	},
	{
		subject: "science",
		subjectLabel: "Science",
		assets: [
			scienceBadge001,
			scienceBadge002,
			scienceBadge003,
			scienceBadge004,
			scienceBadge005,
		],
	},
];
const rewardDefinitions = badgeDates.flatMap(({ dateKey, badgeNumber }, dateIndex) =>
	subjectBadgeAssets.map(({ subject, subjectLabel, assets }) => ({
		id: `${dateKey}::${subject}`,
		dateKey,
		subject,
		subjectLabel,
		badgeNumber,
		src: assets[dateIndex],
		alt: `${subjectLabel} badge ${badgeNumber}`,
	})),
);
const rewardDefinitionsById = new Map(
	rewardDefinitions.map((badge) => [badge.id, badge]),
);

function loadEarnedBadgeIds() {
	let stored;
	try {
		stored = globalThis.localStorage?.getItem(EARNED_BADGES_STORAGE_KEY);
	} catch (error) {
		console.error("Earned badges could not be read from local storage.", error);
		return [];
	}
	if (!stored) {
		return [];
	}

	try {
		const parsed = JSON.parse(stored);
		if (!Array.isArray(parsed)) {
			throw new TypeError("Earned badge storage must contain an array.");
		}
		return parsed.filter(
			(id) => typeof id === "string" && rewardDefinitionsById.has(id),
		);
	} catch (error) {
		console.error("Earned badge storage could not be parsed.", error);
		return [];
	}
}

const earnedBadgeIds = ref(loadEarnedBadgeIds());

export const earnedBadges = computed(() =>
	earnedBadgeIds.value
		.map((id) => rewardDefinitionsById.get(id))
		.filter(Boolean),
);

/** Remove an earned badge from shared state and persist the updated collection. */
export function removeEarnedBadge(badgeId) {
	if (!earnedBadgeIds.value.includes(badgeId)) {
		return;
	}

	earnedBadgeIds.value = earnedBadgeIds.value.filter((id) => id !== badgeId);
	try {
		globalThis.localStorage?.setItem(
			EARNED_BADGES_STORAGE_KEY,
			JSON.stringify(earnedBadgeIds.value),
		);
	} catch (error) {
		console.error("Earned badge removal could not be saved to local storage.", error);
	}
}

/** Award the configured sticker after all blocks for its subject are complete. */
export function awardCompletedSubjectBadge(dateLabel, subject) {
	const completedDate = new Date(dateLabel);
	if (!dateLabel || Number.isNaN(completedDate.getTime())) {
		return null;
	}
	const dateKey = [
		completedDate.getFullYear(),
		String(completedDate.getMonth() + 1).padStart(2, "0"),
		String(completedDate.getDate()).padStart(2, "0"),
	].join("-");
	const badge = rewardDefinitions.find(
		(reward) => reward.dateKey === dateKey && reward.subject === subject,
	);
	if (!badge) {
		return null;
	}

	const isNew = !earnedBadgeIds.value.includes(badge.id);
	if (isNew) {
		earnedBadgeIds.value = [...earnedBadgeIds.value, badge.id];
		try {
			globalThis.localStorage?.setItem(
				EARNED_BADGES_STORAGE_KEY,
				JSON.stringify(earnedBadgeIds.value),
			);
		} catch (error) {
			console.error("Earned badge could not be saved to local storage.", error);
		}
	}

	return { badge, isNew };
}
