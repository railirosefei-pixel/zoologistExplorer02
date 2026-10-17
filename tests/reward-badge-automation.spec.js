import { expect, test } from "@playwright/test";

async function revealBadgesButton(page) {
	await page.locator("#rewards-page-chest-button").click();
	const goldBag = page.locator("#rewards-page-gold-bag-button");
	await expect(goldBag).toBeVisible();
	await goldBag.evaluate((element) => {
		for (const animation of element.getAnimations()) {
			animation.finish();
		}
	});
	await expect(page.locator("#rewards-page-badges-button")).toBeVisible();
	await page.locator("#rewards-page-badges-button").evaluate((element) => {
		for (const animation of element.getAnimations()) {
			animation.finish();
		}
	});
}

async function completeFinalBlockForBadge(
	page,
	{
		dayNumber,
		subjectKey,
		subjectLabel,
		badgeAlt,
		earnedBadgeIds = [],
		verifyConfettiSequence = false,
		reducedMotion = "reduce",
	},
) {
	const legacyCompletionDay = dayNumber === 20 ? 9 : dayNumber - 4;
	const completionDateKey = `2026-10-${String(legacyCompletionDay).padStart(2, "0")}`;
	const completedBlocks = Object.fromEntries(
		[1, 2].map((blockNumber) => [
			`${completionDateKey}::${subjectKey}::${blockNumber}`,
			true,
		]),
	);
	await page.emulateMedia({ reducedMotion });
	await page.addInitScript(
		({ completedBlocks: initialCompletions, initialBadgeIds }) => {
			localStorage.setItem(
				"zoologistExplorer02.completedBlocks",
				JSON.stringify(initialCompletions),
			);
			localStorage.setItem(
				"ze2.studentProgress.earnedBadges",
				JSON.stringify(initialBadgeIds),
			);
			localStorage.setItem(
				"ze2.studentProgress.railiCommittedPositions",
				JSON.stringify({
					1: { x: 20, y: 10 },
					2: { x: 80, y: -35 },
				}),
			);
			localStorage.setItem("ze2.studentProgress.railiOffsetXPx", "20");
			localStorage.setItem("ze2.studentProgress.railiOffsetYPx", "10");
		},
		{ completedBlocks, initialBadgeIds: earnedBadgeIds },
	);
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const day = page.locator(
		`#calendar-day-cell-October-2026-${dayNumber + 2}`,
	);
	await day.click();
	await expect(day).toBeEnabled();
	await day.click();
	await page.getByRole("button", { name: subjectLabel, exact: true }).click();
	await page.locator(`#daily-menu-${subjectKey}-block-3-button`).click();
	await page.locator(`#daily-menu-${subjectKey}-block-3-complete-button`).click();

	await expect(page.locator("#student-progress-back-button")).toBeVisible();
	await expect(page.locator("#rewards-page")).toBeHidden();
	await expect(page.locator("#progress-xp-bar")).toHaveAttribute(
		"aria-label",
		"Level 0, 60 XP",
	);
	await expect(page.locator(".progress-xp-bar-segment--filled")).toHaveCount(3);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"80px",
	);
	if (verifyConfettiSequence) {
		await expect(page.locator(".student-progress-confetti-piece").first()).toBeVisible();
		await expect(page.locator("#rewards-page")).toBeHidden();
	}
	await expect(page.locator("#rewards-page")).toBeVisible({ timeout: 10000 });
	expect(await page.locator("#rewards-page-chest-container").count()).toBe(1);
	await expect(page.locator("#rewards-page-badge-menu")).toBeVisible();
	await expect(page.locator("#rewards-page-badges-button")).toHaveCount(0);
	await expect(
		page.locator(`.rewards-page-badge-image[alt="${badgeAlt}"]`),
	).toHaveCount(1);
}

test("badge earning opens and retains the Badges menu after its animation", async ({ page }) => {
	await completeFinalBlockForBadge(page, {
		dayNumber: 16,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 001",
		verifyConfettiSequence: true,
		reducedMotion: "no-preference",
	});

	const earnedBadge = page.locator(".rewards-page-badge-image[alt='Math badge 001']");
	expect(await earnedBadge.isVisible()).toBe(false);
	await expect(page.locator("#rewards-page-chest-container")).toBeVisible();
	const badgeTrack = page.locator(".rewards-page-badge-animation-track");
	await expect(badgeTrack).toBeVisible();
	const emergingBadgeSource = await badgeTrack
		.locator(".rewards-page-badge-animation")
		.getAttribute("src");
	expect(emergingBadgeSource).toBe(await earnedBadge.getAttribute("src"));
	await expect(badgeTrack).toHaveCount(0, {
		timeout: 9500,
	});
	await expect(earnedBadge).toBeVisible();
	expect(await earnedBadge.getAttribute("src")).toBe(emergingBadgeSource);
	await expect(page.locator("#rewards-page-badge-menu")).toBeVisible();
	await expect(page.locator("#rewards-page")).toBeVisible();
	await expect(page.locator("#student-menu-page")).toBeHidden();
});

test("badge completion replays the chest animation when the badge was already earned", async ({
	page,
}) => {
	await completeFinalBlockForBadge(page, {
		dayNumber: 16,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 001",
		earnedBadgeIds: ["2026-10-16::math"],
	});

	await expect(page.locator("#rewards-page-chest-container")).toBeVisible();
	await expect(page.locator(".rewards-page-badge-animation-track")).toBeVisible();
});

test("badge animation peaks at twice its resting size", async ({ page }) => {
	await page.addInitScript(() => {
		const originalAnimate = Element.prototype.animate;
		Element.prototype.animate = function (...argumentsList) {
			const animation = originalAnimate.apply(this, argumentsList);
			if (this.matches(".rewards-page-badge-animation-track")) {
				animation.pause();
			}
			return animation;
		};
	});
	await completeFinalBlockForBadge(page, {
		dayNumber: 16,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 001",
		reducedMotion: "no-preference",
	});

	await page.setViewportSize({ width: 375, height: 667 });
	const badgeTrack = page.locator(".rewards-page-badge-animation-track");
	await expect(badgeTrack).toBeVisible();
	const animationDuration = await badgeTrack.evaluate((element) => {
		const animation = element.getAnimations()[0];
		if (!animation) {
			throw new Error("The reward badge emergence animation is unavailable.");
		}
		return animation.effect.getTiming().duration;
	});
	expect(animationDuration).toBe(4500);
	const peakWidth = await badgeTrack.evaluate((element) => {
		const animation = element.getAnimations()[0];
		animation.currentTime = 3000;
		return element.getBoundingClientRect().width;
	});
	expect(peakWidth).toBeCloseTo(492, 0);

	const restingWidth = await badgeTrack.evaluate((element, currentTime) => {
		const animation = element.getAnimations()[0];
		animation.currentTime = currentTime;
		return element.getBoundingClientRect().width;
	}, animationDuration);
	expect(restingWidth).toBeCloseTo(246, 0);
});

test("badge celebration fades the chest in and out over three seconds", async ({ page }) => {
	await page.addInitScript(() => {
		const originalAnimate = Element.prototype.animate;
		Element.prototype.animate = function (...argumentsList) {
			const animation = originalAnimate.apply(this, argumentsList);
			if (
				this.matches(
					".rewards-page-chest-container--celebrating, .rewards-page-badge-animation-track",
				)
			) {
				animation.pause();
			}
			return animation;
		};
	});
	await completeFinalBlockForBadge(page, {
		dayNumber: 16,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 001",
		reducedMotion: "no-preference",
	});

	const chest = page.locator("#rewards-page-chest-container");
	await expect(chest).toBeVisible();
	await chest.locator("#rewards-page-chest-button").hover();
	await expect(chest.locator(".rewards-page-chest")).toHaveAttribute(
		"src",
		/minecraftChest01/,
	);
	const fadeIn = await chest.evaluate((element) => {
		const animation = element.getAnimations()[0];
		animation.currentTime = 0;
		const initialOpacity = getComputedStyle(element).opacity;
		animation.currentTime = 1500;
		const midpointOpacity = getComputedStyle(element).opacity;
		return {
			duration: animation.effect.getTiming().duration,
			initialOpacity,
			midpointOpacity,
		};
	});
	expect(fadeIn).toEqual({
		duration: 3000,
		initialOpacity: "0",
		midpointOpacity: "0.5",
	});
	await chest.evaluate((element) => element.getAnimations()[0].finish());
	await expect(page.locator(".rewards-page-chest")).toHaveAttribute(
		"src",
		/minecraftChest03/,
	);
	const badgeTrack = page.locator(".rewards-page-badge-animation-track");
	await expect(badgeTrack).toBeVisible();

	const choreography = await page.evaluate(() => {
		const chestContainer = document.querySelector("#rewards-page-chest-container");
		const chestFadeOut = chestContainer
			.getAnimations()
			.find((animation) => animation.playState === "paused");
		const badgeTrackElement = document.querySelector(
			".rewards-page-badge-animation-track",
		);
		const badgeAnimation = badgeTrackElement.getAnimations()[0];
		chestFadeOut.currentTime = 0;
		const chestOpacityAtStart = getComputedStyle(chestContainer).opacity;
		chestFadeOut.currentTime = 1500;
		const chestOpacityAtMidpoint = getComputedStyle(chestContainer).opacity;
		chestFadeOut.currentTime = 3000;
		badgeAnimation.currentTime = 3000;
		return {
			chestFadeDuration: chestFadeOut.effect.getTiming().duration,
			chestOpacityAtStart,
			chestOpacityAtMidpoint,
			chestOpacityAtBadgePeak: getComputedStyle(chestContainer).opacity,
			badgeDuration: badgeAnimation.effect.getTiming().duration,
			badgePeakWidth: badgeTrackElement.getBoundingClientRect().width,
		};
	});
	expect(choreography).toEqual({
		chestFadeDuration: 3000,
		chestOpacityAtStart: "1",
		chestOpacityAtMidpoint: "0.5",
		chestOpacityAtBadgePeak: "0",
		badgeDuration: 4500,
		badgePeakWidth: 492,
	});
});

test("reduced-motion badge celebration uses visible fades without badge travel", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const originalAnimate = Element.prototype.animate;
		Element.prototype.animate = function (...argumentsList) {
			const animation = originalAnimate.apply(this, argumentsList);
			if (
				this.matches(
					".rewards-page-chest-container--celebrating, .rewards-page-badge-animation-track",
				)
			) {
				animation.pause();
			}
			return animation;
		};
	});
	await completeFinalBlockForBadge(page, {
		dayNumber: 16,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 001",
		reducedMotion: "reduce",
	});

	const chest = page.locator("#rewards-page-chest-container");
	await expect(chest).toBeVisible();
	const chestFadeIn = await chest.evaluate((element) => {
		const animation = element.getAnimations()[0];
		if (!animation) {
			throw new Error("The reduced-motion chest fade-in is unavailable.");
		}
		return animation.effect.getTiming().duration;
	});
	expect(chestFadeIn).toBe(250);
	await chest.evaluate((element) => element.getAnimations()[0].finish());

	const badgeTrack = page.locator(".rewards-page-badge-animation-track");
	await expect(badgeTrack).toBeVisible();
	const badgeFade = await badgeTrack.evaluate((element) => {
		const animation = element.getAnimations()[0];
		if (!animation) {
			throw new Error("The reduced-motion badge fade is unavailable.");
		}
		const keyframes = animation.effect.getKeyframes();
		return {
			duration: animation.effect.getTiming().duration,
			opacities: keyframes.map((frame) => frame.opacity),
			transforms: keyframes.map((frame) => frame.transform),
		};
	});
	expect(badgeFade.duration).toBe(250);
	expect(badgeFade.opacities).toEqual(["0", "1"]);
	expect(new Set(badgeFade.transforms).size).toBe(1);
});

test("completing Math on October 16 awards and persists badge 001", async ({ page }) => {
	await page.addInitScript(() => {
		if (!sessionStorage.getItem("reward-badge-test-initialized")) {
			localStorage.removeItem("zoologistExplorer02.completedBlocks");
			localStorage.removeItem("ze2.studentProgress.earnedBadges");
			sessionStorage.setItem("reward-badge-test-initialized", "true");
		}
	});
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const day = page.locator("#calendar-day-cell-October-2026-18");
	await day.click();
	await expect(day).toBeEnabled();
	await day.click();
	await page.getByRole("button", { name: "Math", exact: true }).click();

	for (const blockNumber of [1, 2]) {
		await page.locator(`#daily-menu-math-block-${blockNumber}-complete-button`).click();
		await expect(page.locator("#student-progress-back-button")).toBeVisible();
		await page.locator("#student-progress-back-button").click();
		await page.locator(`#daily-menu-math-block-${blockNumber + 1}-button`).click();
	}

	await page.locator("#daily-menu-math-block-3-complete-button").click();
	await expect(page.locator("#rewards-page")).toBeVisible({ timeout: 10000 });
	await expect(page.locator("#rewards-page-badge-menu")).toBeVisible();
	await expect(page.locator("#rewards-page-chest-container")).toBeVisible();
	await expect(page.locator("#rewards-page-chest-button .rewards-page-chest")).toHaveAttribute(
		"src",
		/minecraftChest03/,
	);
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(1);
	await expect(page.locator(".rewards-page-badge-image")).toHaveAttribute(
		"alt",
		"Math badge 001",
	);
	await expect(page.locator(".rewards-page-badge-animation-track")).toBeVisible();
	await expect(page.locator(".rewards-page-badge-animation")).toHaveCSS(
		"object-fit",
		"cover",
	);
	await expect(page.locator(".rewards-page-badge-animation-track")).toHaveCount(0, {
		timeout: 6500,
	});
	const earnedBadgeBounds = await page
		.locator(".rewards-page-badge-image")
		.boundingBox();
	expect(earnedBadgeBounds.width).toBe(246);

	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
	await revealBadgesButton(page);
	await page.getByRole("button", { name: "Badges" }).click();
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(1);
});

test("completing Math on October 17 awards badge 002", async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.removeItem("zoologistExplorer02.completedBlocks");
		localStorage.removeItem("ze2.studentProgress.earnedBadges");
	});
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const day = page.locator("#calendar-day-cell-October-2026-19");
	await day.click();
	await expect(day).toBeEnabled();
	await day.click();
	await page.getByRole("button", { name: "Math", exact: true }).click();

	for (const blockNumber of [1, 2]) {
		await page.locator(`#daily-menu-math-block-${blockNumber}-complete-button`).click();
		await expect(page.locator("#student-progress-back-button")).toBeVisible();
		await page.locator("#student-progress-back-button").click();
		await page.locator(`#daily-menu-math-block-${blockNumber + 1}-button`).click();
	}

	await page.locator("#daily-menu-math-block-3-complete-button").click();
	await expect(page.locator("#rewards-page")).toBeVisible({ timeout: 10000 });
	await expect(page.locator(".rewards-page-badge-image")).toHaveAttribute(
		"alt",
		"Math badge 002",
	);
});

test("completing Math on October 18 awards badge 003 in the third grid slot", async ({
	page,
}) => {
	await completeFinalBlockForBadge(page, {
		dayNumber: 18,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 003",
		earnedBadgeIds: ["2026-10-16::math", "2026-10-17::math"],
	});
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(3);
});

test("completing Math on October 19 awards badge 004 on the second row", async ({ page }) => {
	await completeFinalBlockForBadge(page, {
		dayNumber: 19,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 004",
		earnedBadgeIds: [
			"2026-10-16::math",
			"2026-10-17::math",
			"2026-10-18::math",
		],
	});
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(4);
});

test("completing Math on October 20 awards badge 005 in the next row", async ({ page }) => {
	await completeFinalBlockForBadge(page, {
		dayNumber: 20,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 005",
		earnedBadgeIds: [
			"2026-10-16::math",
			"2026-10-17::math",
			"2026-10-18::math",
			"2026-10-19::math",
		],
	});
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(5);
});

const additionalSubjectAwards = [
	{ subjectKey: "language-arts", subjectLabel: "Language Arts" },
	{ subjectKey: "social-studies", subjectLabel: "Social Studies" },
	{ subjectKey: "science", subjectLabel: "Science" },
];

for (const { subjectKey, subjectLabel } of additionalSubjectAwards) {
	for (const dayNumber of [16, 17, 18, 19, 20]) {
		const badgeNumber = String(dayNumber - 15).padStart(3, "0");
		test(
			`completing ${subjectLabel} on October ${dayNumber} awards badge ${badgeNumber}`,
			async ({ page }) => {
				await completeFinalBlockForBadge(page, {
					dayNumber,
					subjectKey,
					subjectLabel,
					badgeAlt: `${subjectLabel} badge ${badgeNumber}`,
				});
			},
		);
	}
}

test("all subject badges use matching dimensions in the rewards collection", async ({
	page,
}) => {
	const earnedBadgeIds = [];
	for (const dayNumber of [16, 17, 18, 19, 20]) {
		for (const subjectKey of ["math", "language-arts", "social-studies", "science"]) {
			earnedBadgeIds.push(`2026-10-${dayNumber}::${subjectKey}`);
		}
	}
	await page.addInitScript((badgeIds) => {
		localStorage.setItem(
			"ze2.studentProgress.earnedBadges",
			JSON.stringify(badgeIds),
		);
	}, earnedBadgeIds);
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
	await revealBadgesButton(page);
	await page.getByRole("button", { name: "Badges" }).click();

	const badgeImages = page.locator(".rewards-page-badge-image");
	await expect(badgeImages).toHaveCount(20);
	const dimensions = await badgeImages.evaluateAll((images) =>
		images.map((image) => {
			const { width, height } = image.getBoundingClientRect();
			return { width, height, objectFit: getComputedStyle(image).objectFit };
		}),
	);
	expect(dimensions).toEqual(
		Array.from({ length: 20 }, (_, index) => ({
			width: 246,
			height: 246,
			objectFit: index % 4 === 0 ? "cover" : "contain",
		})),
	);
	const layout = await page.evaluate(() => {
		const panel = document.querySelector("#rewards-page-badge-menu");
		const images = [...panel.querySelectorAll(".rewards-page-badge-image")];
		const firstBounds = images[0].getBoundingClientRect();
		const secondBounds = images[1].getBoundingClientRect();
		const firstRowCount = images.filter(
			(image) => image.getBoundingClientRect().top === firstBounds.top,
		).length;
		const nextRowBounds = images[firstRowCount].getBoundingClientRect();
		const panelBounds = panel.getBoundingClientRect();
		const homeBounds = document
			.querySelector("#rewards-page-home-button")
			.getBoundingClientRect();
		const styles = getComputedStyle(panel);
		return {
			top: panelBounds.top,
			rightGap: innerWidth - panelBounds.right,
			bottomGap: innerHeight - panelBounds.bottom,
			left: panelBounds.left,
			leftBadgeGap: firstBounds.left - panelBounds.left,
			buttonGap: firstBounds.top - homeBounds.bottom,
			horizontalBadgeGap: secondBounds.left - firstBounds.right,
			verticalBadgeGap: nextRowBounds.top - firstBounds.bottom,
			overflowY: styles.overflowY,
			scrollHeight: panel.scrollHeight,
			clientHeight: panel.clientHeight,
		};
	});
	expect(layout).toMatchObject({
		top: 0,
		rightGap: 0,
		bottomGap: 0,
		left: 0,
		leftBadgeGap: 16,
		buttonGap: 0,
		horizontalBadgeGap: 16,
		verticalBadgeGap: 16,
		overflowY: "auto",
	});
	expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight);
	await page.locator("#rewards-page-badge-menu").evaluate((element) => {
		element.scrollTop = element.scrollHeight;
	});
	await expect(badgeImages.last()).toBeInViewport();
});

test("Badges button opens a full-screen menu and hides while open", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();

	const badgesButton = page.locator("#rewards-page-badges-button");
	await expect(badgesButton).toHaveCount(0);
	await page.locator("#rewards-page-chest-button").click();
	const goldBag = page.locator("#rewards-page-gold-bag-button");
	await expect(goldBag).toBeVisible();
	await goldBag.click();
	const spilledCoins = page.locator(".rewards-page-gold-coin");
	await expect(spilledCoins).toHaveCount(5);
	await spilledCoins.evaluateAll((elements) => {
		for (const element of elements) {
			for (const animation of element.getAnimations()) {
				animation.finish();
			}
		}
	});
	await expect(badgesButton).toHaveCount(0);
	await goldBag.evaluate((element) => {
		for (const animation of element.getAnimations()) {
			animation.finish();
		}
	});
	await page.waitForTimeout(300);
	await expect(badgesButton).toHaveCount(0);
	await expect(badgesButton).toBeVisible();
	await badgesButton.evaluate((element) => {
		for (const animation of element.getAnimations()) {
			animation.finish();
		}
	});
	const placement = await badgesButton.evaluate((element) => {
		const buttonBounds = element.getBoundingClientRect();
		const chestBounds = document
			.querySelector("#rewards-page-chest-button")
			.getBoundingClientRect();
		return {
			gap: chestBounds.left - buttonBounds.right,
			centerOffset:
				buttonBounds.top +
				buttonBounds.height / 2 -
				(chestBounds.top + chestBounds.height / 2),
		};
	});
	expect(placement.gap).toBe(16);
	expect(Math.abs(placement.centerOffset)).toBeLessThan(0.1);
	await expect(badgesButton).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#rewards-page-badge-menu")).toHaveCount(0);
	const buttonStyles = await badgesButton.evaluate((element) => {
		const styles = getComputedStyle(element);
		return {
			backgroundColor: styles.backgroundColor,
			borderStyle: styles.borderStyle,
			boxShadow: styles.boxShadow,
			textShadow: styles.textShadow,
			fontSize: Number.parseFloat(styles.fontSize),
		};
	});
	expect(buttonStyles.backgroundColor).toBe("rgba(0, 0, 0, 0)");
	expect(buttonStyles.borderStyle).toBe("none");
	expect(buttonStyles.boxShadow).toBe("none");
	expect(buttonStyles.textShadow.split(",").length).toBeGreaterThanOrEqual(5);
	expect(buttonStyles.fontSize).toBeGreaterThanOrEqual(24);

	await badgesButton.click();
	await expect(badgesButton).toHaveCount(0);
	const panel = page.locator("#rewards-page-badge-menu");
	await expect(panel).toBeVisible();
	await expect(panel).toHaveText("Your earned badges will appear here");
	await expect(panel.locator(".rewards-page-badge-empty")).toHaveCSS(
		"white-space",
		"nowrap",
	);
	const panelBounds = await panel.boundingBox();
	const viewportSize = page.viewportSize();
	expect(panelBounds).toEqual({
		x: 0,
		y: 0,
		width: viewportSize.width,
		height: viewportSize.height,
	});
	await expect(page.locator("#rewards-page-home-button")).toBeVisible();

	await page.locator("#rewards-page-back-button").click();
	await expect(panel).toHaveCount(0);
	await expect(badgesButton).toBeVisible();
	await expect(page.locator("#rewards-page-home-button")).toHaveCount(0);

	await badgesButton.click();
	await page.locator("#rewards-page-home-button").click();
	await expect(page.locator("#home-page-shell")).toBeVisible();
});

test("Rewards page keeps badges hidden until opened and preserves the gold bag", async ({
	page,
}) => {
	const earnedBadgeIds = [];
	for (const dayNumber of [16, 17, 18, 19, 20]) {
		const dateKey = `2026-10-${dayNumber}`;
		for (const subjectKey of ["math", "language-arts", "social-studies", "science"]) {
			earnedBadgeIds.push(`${dateKey}::${subjectKey}`);
		}
	}
	await page.addInitScript((badgeIds) => {
		if (!sessionStorage.getItem("reward-panel-growth-initialized")) {
			localStorage.setItem(
				"ze2.studentProgress.earnedBadges",
				JSON.stringify(badgeIds),
			);
			sessionStorage.setItem("reward-panel-growth-initialized", "true");
		}
	}, earnedBadgeIds.slice(0, 1));
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();

	await expect(page.locator("#rewards-page-badge-menu")).toHaveCount(0);
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(0);

	await page.locator("#rewards-page-chest-button").click();
	const goldBag = page.locator("#rewards-page-gold-bag-button");
	await expect(goldBag).toBeVisible();
	await goldBag.evaluate((element) =>
		element.getAnimations().forEach((animation) => animation.finish()),
	);
	const goldBagPosition = await goldBag.evaluate((element) => {
		const bagBounds = element.getBoundingClientRect();
		const chestBounds = document
			.querySelector("#rewards-page-chest-button")
			.getBoundingClientRect();
		return {
			chestCenterOffset:
				chestBounds.left +
				chestBounds.width / 2 -
				window.innerWidth / 2,
			bagRightGap: bagBounds.left - chestBounds.right,
			bagCenterOffset:
				bagBounds.top +
				bagBounds.height / 2 -
				(chestBounds.top + chestBounds.height / 2),
		};
	});
	expect(goldBagPosition.chestCenterOffset).toBeCloseTo(0);
	expect(goldBagPosition.bagRightGap).toBe(16);
	expect(Math.abs(goldBagPosition.bagCenterOffset)).toBeLessThan(0.1);

	await goldBag.click();
	await page.locator(".rewards-page-gold-coin").evaluateAll((elements) => {
		for (const element of elements) {
			for (const animation of element.getAnimations()) {
				animation.finish();
			}
		}
	});
	const goldTotal = page.locator(".rewards-page-gold-total");
	await expect(goldTotal).toHaveText("0 gold coins");
	const goldTotalPosition = await goldTotal.evaluate((element) => {
		const totalBounds = element.getBoundingClientRect();
		const bagBounds = document
			.querySelector("#rewards-page-gold-bag-button")
			.getBoundingClientRect();
		return {
			centerOffset:
				totalBounds.left +
				totalBounds.width / 2 -
				(bagBounds.left + bagBounds.width / 2),
			topGap: totalBounds.top - bagBounds.bottom,
		};
	});
	expect(Math.abs(goldTotalPosition.centerOffset)).toBeLessThan(0.1);
	expect(goldTotalPosition.topGap).toBe(16);
});

test("Badges Earned filters by subject, shows badge details, and resets the student reward", async ({
	page,
}) => {
	const earnedBadgeIds = [
		"2026-10-16::math",
		"2026-10-17::math",
		"2026-10-16::language-arts",
		"2026-10-16::social-studies",
		"2026-10-16::science",
	];
	await page.addInitScript((badgeIds) => {
		if (!sessionStorage.getItem("badges-earned-test-seeded")) {
			localStorage.setItem("ze2.studentProgress.earnedBadges", JSON.stringify(badgeIds));
			sessionStorage.setItem("badges-earned-test-seeded", "true");
		}
	}, earnedBadgeIds);
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits", exact: true }).click();
	await page.getByRole("button", { name: "Open Rewards Edits menu" }).click();
	await page.locator("#badges-earned-button").click();

	const sidebar = page.locator("#badges-earned-sidebar");
	await expect(sidebar).toBeVisible();
	await expect(sidebar.locator(".blocks-menu-button")).toHaveText([
		"Math",
		"Language Arts",
		"Social Studies",
		"Science",
	]);
	const sidebarBounds = await sidebar.boundingBox();
	const subjectButtonBounds = await sidebar.locator(".blocks-menu-button").evaluateAll(
		(buttons) =>
			buttons.map((button) => {
				const bounds = button.getBoundingClientRect();
				return { left: bounds.left, top: bounds.top, bottom: bounds.bottom };
			}),
	);
	expect(subjectButtonBounds[0].left - sidebarBounds.x).toBe(24);
	expect(subjectButtonBounds[0].top - sidebarBounds.y).toBe(16);
	for (let index = 1; index < subjectButtonBounds.length; index += 1) {
		expect(subjectButtonBounds[index].top - subjectButtonBounds[index - 1].bottom).toBe(16);
	}
	await expect(page.locator("#badges-earned-content")).toBeVisible();

	for (const subject of ["math", "language-arts", "social-studies", "science"]) {
		await page.locator(`#earned-badges-subject-${subject}-button`).click();
		await expect(page.locator(".badges-earned-image")).toHaveCount(
			subject === "math" ? 2 : 1,
		);
		await expect
			.poll(() =>
				page
					.locator(".badges-earned-image")
					.first()
					.evaluate((image) => image.complete && image.naturalWidth > 0),
			)
			.toBe(true);
		const badgeDimensions = await page
			.locator(".badges-earned-image")
			.first()
			.evaluate((image) => {
				const bounds = image.getBoundingClientRect();
				return {
					width: bounds.width,
					height: bounds.height,
					naturalWidth: image.naturalWidth,
					naturalHeight: image.naturalHeight,
				};
			});
		expect(badgeDimensions.width).toBe(218);
		expect(badgeDimensions.height / badgeDimensions.width).toBeCloseTo(
			badgeDimensions.naturalHeight / badgeDimensions.naturalWidth,
			3,
		);
	}

	await page.locator("#earned-badges-subject-math-button").click();
	const secondBadgeBeforeDetails = await page.locator(".badges-earned-item").nth(1).boundingBox();
	const firstBadgeBeforeDetails = await page.locator(".badges-earned-item").first().boundingBox();
	await page.locator(".badges-earned-image-button").first().click();
	await expect(page.locator(".badges-earned-detail-heading")).toHaveText(
		"Math Badge Day 1",
	);
	const firstBadgeAfterDetails = await page.locator(".badges-earned-item").first().boundingBox();
	const secondBadgeAfterDetails = await page.locator(".badges-earned-item").nth(1).boundingBox();
	const detailBounds = await page.locator(".badges-earned-detail").boundingBox();
	expect(firstBadgeAfterDetails).toEqual(firstBadgeBeforeDetails);
	expect(secondBadgeAfterDetails).toEqual(secondBadgeBeforeDetails);
	expect(detailBounds).toMatchObject({
		width: firstBadgeBeforeDetails.width,
		height: firstBadgeBeforeDetails.height,
	});
	await expect(page.locator(".badges-earned-acquired-date")).toHaveText(
		"Acquired: 10/16/2026",
	);
	await page.getByRole("button", { name: "Reset Math Badge Day 1" }).click();
	await expect(page.locator(".badges-earned-image")).toHaveCount(1);
	await expect
		.poll(() =>
			page.evaluate(() =>
				JSON.parse(localStorage.getItem("ze2.studentProgress.earnedBadges")),
			),
		)
		.toEqual(earnedBadgeIds.slice(1));

	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
	await revealBadgesButton(page);
	await page.getByRole("button", { name: "Badges" }).click();
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(4);
	await expect(
		page.locator('.rewards-page-badge-image[alt="Math badge 001"]'),
	).toHaveCount(0);
});

test("parent badge resets replace earned state and compact collection placement", async ({
	page,
}) => {
	const earnedBadgeIds = [
		"2026-10-16::math",
		"2026-10-17::math",
		"2026-10-16::language-arts",
	];
	await page.addInitScript((badgeIds) => {
		if (!sessionStorage.getItem("parent-reset-test-seeded")) {
			localStorage.setItem("ze2.studentProgress.earnedBadges", JSON.stringify(badgeIds));
			sessionStorage.setItem("parent-reset-test-seeded", "true");
		}
	}, earnedBadgeIds);
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits", exact: true }).click();
	await page.getByRole("button", { name: "Open Rewards Edits menu" }).click();
	await page.locator("#badges-earned-button").click();
	await page.locator("#earned-badges-subject-math-button").click();
	await page.locator(".badges-earned-image-button").first().click();
	await page.getByRole("button", { name: "Reset Math Badge Day 1" }).click();
	await expect
		.poll(() =>
			page.evaluate(() =>
				JSON.parse(localStorage.getItem("ze2.studentProgress.earnedBadges")),
			),
		)
		.toEqual(earnedBadgeIds.slice(1));

	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
	await revealBadgesButton(page);
	await page.getByRole("button", { name: "Badges" }).click();
	const badges = page.locator(".rewards-page-badge-image");
	await expect(badges).toHaveCount(2);
	await expect(badges.nth(0)).toHaveAttribute("alt", "Math badge 002");
	await expect(badges.nth(1)).toHaveAttribute("alt", "Language Arts badge 001");
	const positions = await badges.evaluateAll((images) =>
		images.map((image) => {
			const { left, top, right } = image.getBoundingClientRect();
			return { left, top, right };
		}),
	);
	expect(positions[1].top).toBe(positions[0].top);
	expect(positions[1].left - positions[0].right).toBe(16);
});
