import { expect, test } from "@playwright/test";

async function completeFinalBlockForBadge(
	page,
	{
		dayNumber,
		subjectKey,
		subjectLabel,
		badgeAlt,
		earnedBadgeIds = [],
		verifyConfettiSequence = false,
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
	await page.emulateMedia({ reducedMotion: "reduce" });
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
	await expect(page.locator(".rewards-page-badge-image").last()).toHaveAttribute(
		"alt",
		badgeAlt,
	);
}

test("badge animation returns to the open calendar block after 1.3 seconds", async ({ page }) => {
	await page.addInitScript(() => {
		window.rewardBadgeAnimationEndedAt = null;
		window.progressConfettiAnimationEndedAt = null;
		document.addEventListener(
			"animationend",
			(event) => {
				if (event.target.matches(".rewards-page-badge-animation")) {
					window.rewardBadgeAnimationEndedAt = performance.now();
				}
				if (event.target.matches(".student-progress-confetti-piece")) {
					window.progressConfettiAnimationEndedAt = performance.now();
				}
			},
			true,
		);
	});
	await completeFinalBlockForBadge(page, {
		dayNumber: 16,
		subjectKey: "math",
		subjectLabel: "Math",
		badgeAlt: "Math badge 001",
		verifyConfettiSequence: true,
	});

	const rewardsPage = page.locator("#rewards-page");
	const elapsedAfterConfetti = await page.evaluate(
		() => performance.now() - window.progressConfettiAnimationEndedAt,
	);
	expect(elapsedAfterConfetti).toBeGreaterThanOrEqual(1300);
	await expect(page.locator(".rewards-page-badge-animation")).toHaveCount(0);
	await expect(rewardsPage).toBeHidden();
	const elapsedAfterAnimation = await page.evaluate(
		() => performance.now() - window.rewardBadgeAnimationEndedAt,
	);
	expect(elapsedAfterAnimation).toBeGreaterThanOrEqual(1300);
	await expect(page.locator("#student-menu-page")).toBeVisible();
	await expect(page.locator("#daily-menu-math-block-3-panel")).toBeVisible();
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
	await expect(page.locator("#rewards-page-chest-button .rewards-page-chest")).toHaveAttribute(
		"src",
		/minecraftChest03/,
	);
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(1);
	await expect(page.locator(".rewards-page-badge-image")).toHaveAttribute(
		"alt",
		"Math badge 001",
	);
	await expect(page.locator(".rewards-page-badge-animation")).toBeVisible();
	await expect(page.locator(".rewards-page-badge-animation")).toHaveCSS(
		"object-fit",
		"cover",
	);
	await expect(page.locator(".rewards-page-badge-animation")).toHaveCount(0, {
		timeout: 5000,
	});
	const earnedBadgeBounds = await page
		.locator(".rewards-page-badge-image")
		.boundingBox();
	expect(earnedBadgeBounds.width).toBe(246);

	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
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
});

test("earned badge collection scrolls through all subjects in three columns", async ({ page }) => {
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

	const panel = page.locator("#rewards-page-badge-panel");
	const oneBadgeHeight = (await panel.boundingBox()).height;
	await page.evaluate((badgeIds) => {
		localStorage.setItem(
			"ze2.studentProgress.earnedBadges",
			JSON.stringify(badgeIds),
		);
	}, earnedBadgeIds.slice(0, 4));
	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
	const fourBadgeHeight = (await panel.boundingBox()).height;
	expect(fourBadgeHeight).toBeGreaterThan(oneBadgeHeight);
	const fourBadgeScrollMetrics = await panel.evaluate((element) => ({
		scrollHeight: element.scrollHeight,
		clientHeight: element.clientHeight,
	}));
	expect(fourBadgeScrollMetrics.scrollHeight).toBe(
		fourBadgeScrollMetrics.clientHeight,
	);

	await page.evaluate((badgeIds) => {
		localStorage.setItem(
			"ze2.studentProgress.earnedBadges",
			JSON.stringify(badgeIds),
		);
	}, earnedBadgeIds);
	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
	await expect(panel.locator(".rewards-page-badge-image")).toHaveCount(20);
	const dimensions = await panel.evaluate((element) => {
		const items = [...element.querySelectorAll(".rewards-page-badge-item")];
		const firstRow = items.slice(0, 3).map((item) => item.getBoundingClientRect());
		const secondRow = items.slice(3, 6).map((item) => item.getBoundingClientRect());
		const panelBounds = element.getBoundingClientRect();
		const chestBounds = document
			.querySelector("#rewards-page-chest-button")
			.getBoundingClientRect();
		const styles = getComputedStyle(element);
		return {
			width: panelBounds.width,
			bottomGap: window.innerHeight - panelBounds.bottom,
			gap: firstRow[1].left - firstRow[0].right,
			edgeGap: firstRow[0].left - panelBounds.left,
			rightEdgeGap: panelBounds.right - firstRow[2].right,
			chestGap: chestBounds.left - panelBounds.right,
			badgeWidth: items[0].querySelector("img").getBoundingClientRect().width,
			badgeBounds: [...element.querySelectorAll(".rewards-page-badge-image")].map(
				(image) => {
					const { width, height } = image.getBoundingClientRect();
					return { width, height };
				},
			),
			rowGap: secondRow[0].top - firstRow[0].bottom,
			overflowY: styles.overflowY,
			scrollHeight: element.scrollHeight,
			clientHeight: element.clientHeight,
		};
	});
	expect(dimensions.width).toBe(930);
	expect(dimensions.bottomGap).toBe(16);
	expect(dimensions.gap).toBe(16);
	expect(dimensions.edgeGap).toBe(16);
	expect(dimensions.rightEdgeGap).toBe(144);
	expect(dimensions.chestGap).toBeGreaterThanOrEqual(16);
	expect(dimensions.badgeWidth).toBe(246);
	expect(dimensions.badgeBounds).toEqual(
		Array.from({ length: 20 }, () => ({ width: 246, height: 246 })),
	);
	expect(dimensions.rowGap).toBe(16);
	expect(dimensions.overflowY).toBe("auto");
	expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
	await panel.evaluate((element) => {
		element.scrollTop = element.scrollHeight;
	});
	await expect(panel.locator(".rewards-page-badge-image").last()).toBeInViewport();
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
	await expect(page.locator(".rewards-page-badge-image")).toHaveCount(4);
	await expect(
		page.locator('.rewards-page-badge-image[alt="Math badge 001"]'),
	).toHaveCount(0);
});
