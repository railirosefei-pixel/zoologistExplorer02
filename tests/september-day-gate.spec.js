import { test, expect } from "@playwright/test";

test("Explorer text lines use the same spacing as the surrounding copy", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberFirst = page.locator("#calendar-day-cell-October-2026-10");
	await octoberFirst.click();
	await page.waitForTimeout(500);
	await octoberFirst.click();
	await page.getByRole("button", { name: "Math" }).click();

	const panel = page.locator("#daily-menu-math-block-1-panel");
	await expect(panel).toContainText("Explorer Raili!");

	const firstParagraph = panel.locator(".daily-menu-subject-panel-message p").first();
	const explorerName = panel.locator(".daily-menu-explorer-name").first();

	const paragraphMargin = await firstParagraph.evaluate(
		(element) => getComputedStyle(element).marginBottom,
	);
	const paragraphLineHeight = await firstParagraph.evaluate(
		(element) => getComputedStyle(element).lineHeight,
	);
	const explorerFontSize = await explorerName.evaluate(
		(element) => getComputedStyle(element).fontSize,
	);
	const paragraphFontSize = await firstParagraph.evaluate(
		(element) => getComputedStyle(element).fontSize,
	);

	expect(paragraphMargin).toBe("0px");
	expect(parseFloat(paragraphLineHeight)).toBeLessThanOrEqual(20);
	expect(explorerFontSize).toBe(paragraphFontSize);
});

test("Explorer text is available for the October 5 through 7 block panels", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	const septemberTwentyNine = page.locator("#calendar-day-cell-October-2026-8");
	const septemberThirty = page.locator("#calendar-day-cell-October-2026-9");

	for (const day of [septemberTwentyEight, septemberTwentyNine]) {
		await day.click();
		await page.waitForTimeout(500);
		await day.click();
		await page.getByRole("button", { name: "Math" }).click();
		await expect(
			page.locator("#daily-menu-math-block-1-panel .daily-menu-subject-panel-message"),
		).toBeVisible();
		await expect(page.getByText("Explorer Raili!", { exact: true })).toBeVisible();
		await page.getByRole("button", { name: "Back to daily menu", exact: true }).click();
		await expect(page.locator("#daily-menu-math-block-1-panel")).toHaveCount(0);
		await expect(page.locator("#daily-menu-subject-navigation")).toBeVisible();
		await page.getByRole("button", { name: "Back to calendar" }).click();
		await expect(page.locator("#daily-menu-panel")).toHaveCount(0);
		await expect(day).toBeVisible();
	}

	await septemberThirty.click();
	await page.waitForTimeout(500);
	await septemberThirty.click();
	for (const subject of ["Math", "Language Arts", "Social Studies", "Science"]) {
		await page.getByRole("button", { name: subject }).click();
		for (const blockNumber of [1, 2, 3]) {
			await page.getByRole("tab", { name: `${subject} Block ${blockNumber}` }).click();
			await expect(
				page.locator(
					`#daily-menu-${subject.toLowerCase().replaceAll(" ", "-")}-block-${blockNumber}-panel .daily-menu-subject-panel-message`,
				),
			).toBeVisible();
			await expect(page.getByText("Explorer Raili!", { exact: true })).toBeVisible();
		}
	}
});

test("October 8 Math Explorer text appears in all three block panels", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberFirst = page.locator("#calendar-day-cell-October-2026-10");
	await octoberFirst.click();
	await page.waitForTimeout(500);
	await octoberFirst.click();
	await page.getByRole("button", { name: "Math" }).click();

	for (const blockNumber of [1, 2, 3]) {
		await page.getByRole("tab", { name: `Math Block ${blockNumber}` }).click();
		const panel = page.locator(`#daily-menu-math-block-${blockNumber}-panel`);
		await expect(panel).toContainText("Explorer Raili!");
		await expect(panel).toContainText(
			"Amazing job, blocking the lion’s path!  You really saved the day, but now it appears that the crocodiles are blocking the Whispering Giraffe Family’s path to their new found watering hold.  We can’t let that happen!  Continue your journey by completing the daily Quests and we will make our way to the hippos so they can help us save the giraffes",
		);
	}
});

test("October 8 Language Arts Explorer text appears in all three block panels", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberFirst = page.locator("#calendar-day-cell-October-2026-10");
	await octoberFirst.click();
	await page.waitForTimeout(500);
	await octoberFirst.click();
	await page.getByRole("button", { name: "Language Arts" }).click();

	for (const blockNumber of [1, 2, 3]) {
		await page.getByRole("tab", { name: `Language Arts Block ${blockNumber}` }).click();
		const panel = page.locator(`#daily-menu-language-arts-block-${blockNumber}-panel`);
		await expect(panel).toContainText("Explorer Raili!");
		await expect(panel).toContainText(
			"Absolutely remarkable! Keep going, Explorer Raili.  I can already see that you’re about to do it, again!  The hippos will help, I just know they will.  The journal hasn’t led you wrong, yet!  Stay strong!",
		);
	}
});

test("October 8 Social Studies Explorer text appears in all three block panels", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberFirst = page.locator("#calendar-day-cell-October-2026-10");
	await octoberFirst.click();
	await page.waitForTimeout(500);
	await octoberFirst.click();
	await page.getByRole("button", { name: "Social Studies" }).click();

	for (const blockNumber of [1, 2, 3]) {
		await page.getByRole("tab", { name: `Social Studies Block ${blockNumber}` }).click();
		const panel = page.locator(`#daily-menu-social-studies-block-${blockNumber}-panel`);
		await expect(panel).toContainText("Explorer Raili!");
		await expect(panel).toContainText(
			"Stunning!  You did it again.  I can’t wait to see how far you can go.  The Whispering Giraffe Family is counting on you and you haven’t let them down, yet.  Your Quests await you!",
		);
	}
});

test("October 8 Science Explorer text appears in all three block panels", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberFirst = page.locator("#calendar-day-cell-October-2026-10");
	await octoberFirst.click();
	await page.waitForTimeout(500);
	await octoberFirst.click();
	await page.getByRole("button", { name: "Science" }).click();

	for (const blockNumber of [1, 2, 3]) {
		await page.getByRole("tab", { name: `Science Block ${blockNumber}` }).click();
		const panel = page.locator(`#daily-menu-science-block-${blockNumber}-panel`);
		await expect(panel).toContainText("Explorer Raili!");
		await expect(panel).toContainText(
			"Unbelievable!  I never doubted you for second.  You’ve made it so far and I just know that if you keep doing your best, you’ll win every time!  Just a little farther to go and those crocodiles are sure to leave",
		);
	}
});

test("October 9 Explorer text appears in all subject block panels", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberSecond = page.locator("#calendar-day-cell-October-2026-11");
	await octoberSecond.click();
	await page.waitForTimeout(500);
	await octoberSecond.click();

	for (const [subject, label] of [
		["math", "Math"],
		["language-arts", "Language Arts"],
		["social-studies", "Social Studies"],
		["science", "Science"],
	]) {
		await page.getByRole("button", { name: label }).click();
		for (const blockNumber of [1, 2, 3]) {
			await page.getByRole("tab", { name: `${label} Block ${blockNumber}` }).click();
			const panel = page.locator(`#daily-menu-${subject}-block-${blockNumber}-panel`);
			await expect(panel).toContainText("Explorer Raili!");
		}
	}
});

test("October 9 subject menus open on Block 1 by default", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberSecond = page.locator("#calendar-day-cell-October-2026-11");
	await octoberSecond.click();
	await page.waitForTimeout(500);
	await octoberSecond.click();

	for (const [subject, label] of [
		["math", "Math"],
		["language-arts", "Language Arts"],
		["social-studies", "Social Studies"],
		["science", "Science"],
		["art", "Art"],
	]) {
		await page.locator(`#daily-menu-${subject}-button`).click();
		await expect(page.getByRole("tab", { name: `${label} Block 1` })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		await expect(page.locator(`#daily-menu-${subject}-block-1-panel`)).toBeVisible();
	}
});

test("October 8 subject block panels stay centered", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberFirst = page.locator("#calendar-day-cell-October-2026-10");
	await octoberFirst.click();
	await page.waitForTimeout(500);
	await octoberFirst.click();

	for (const [subject] of [
		["math", "Math"],
		["language-arts", "Language Arts"],
		["social-studies", "Social Studies"],
		["science", "Science"],
	]) {
		await page.locator(`#daily-menu-${subject}-button`).click();

		for (const blockNumber of [1, 2, 3]) {
			await page.locator(`#daily-menu-${subject}-block-${blockNumber}-button`).click();
			const panel = page.locator(`#daily-menu-${subject}-block-${blockNumber}-panel`);
			await expect(panel).toHaveCSS("text-align", "center");
			await expect(panel.locator(".daily-menu-subject-panel-message")).toHaveCSS(
				"text-align",
				"center",
			);
		}
	}
});

test("October 9 subject block panels stay centered", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const octoberSecond = page.locator("#calendar-day-cell-October-2026-11");
	await octoberSecond.click();
	await page.waitForTimeout(500);
	await octoberSecond.click();

	for (const [subject] of [
		["math", "Math"],
		["language-arts", "Language Arts"],
		["social-studies", "Social Studies"],
		["science", "Science"],
	]) {
		await page.locator(`#daily-menu-${subject}-button`).click();

		for (const blockNumber of [1, 2, 3]) {
			await page.locator(`#daily-menu-${subject}-block-${blockNumber}-button`).click();
			const panel = page.locator(`#daily-menu-${subject}-block-${blockNumber}-panel`);
			await expect(panel).toHaveCSS("text-align", "center");
			await expect(panel.locator(".daily-menu-subject-panel-message")).toHaveCSS(
				"text-align",
				"center",
			);
		}
	}
});

test("October 1 through 4 day cells stay decorative and disabled", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberOne = page.locator("#calendar-day-cell-October-2026-3");
	const septemberTwentySeven = page.locator("#calendar-day-cell-October-2026-6");

	await expect(septemberOne).toBeVisible();
	await expect(septemberOne).toBeDisabled();
	await expect(septemberTwentySeven).toBeDisabled();

	await expect(page.locator("#daily-menu-panel")).toHaveCount(0);
	await expect(page.locator(".daily-menu-content")).toHaveCount(0);
	await expect(septemberOne).toHaveCSS("background-image", /url\(".*minecraftTNT/);
	await expect(septemberTwentySeven).toHaveCSS("background-image", /url\(".*minecraftTNT/);
});

test("October 6 subject menu text is centered before and after selecting a block", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyNine = page.locator("#calendar-day-cell-October-2026-8");
	await septemberTwentyNine.click();
	await page.waitForTimeout(500);
	await septemberTwentyNine.click();
	await page.locator("#daily-menu-math-button").click();

	await expect(page.locator("#daily-menu-math-block-1-panel")).toHaveCSS("text-align", "center");
	await page.locator("#daily-menu-math-block-2-button").click();
	await expect(page.locator("#daily-menu-math-block-2-panel")).toHaveCSS("text-align", "center");
});

test("October 7 subject menu text is centered before and after selecting each block", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberThirty = page.locator("#calendar-day-cell-October-2026-9");
	await septemberThirty.click();
	await page.waitForTimeout(500);
	await septemberThirty.click();

	for (const subject of ["math", "language-arts", "social-studies", "science"]) {
		await page.locator(`#daily-menu-${subject}-button`).click();
		await expect(page.locator(`#daily-menu-${subject}-block-1-panel`)).toHaveCSS(
			"text-align",
			"center",
		);
		await page.locator(`#daily-menu-${subject}-block-2-button`).click();
		await expect(page.locator(`#daily-menu-${subject}-block-2-panel`)).toHaveCSS(
			"text-align",
			"center",
		);
	}
});

test("Rapid later clicks preserve earlier square replacements and hide TNT textures", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	const septemberTwentyNine = page.locator("#calendar-day-cell-October-2026-8");
	const septemberThirty = page.locator("#calendar-day-cell-October-2026-9");
	const septemberTwentyEightReplacement = page.locator(
		"#calendar-day-replacement-October-2026-7",
	);
	const septemberTwentyNineReplacement = page.locator("#calendar-day-replacement-October-2026-8");

	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await expect(septemberTwentyEightReplacement).toBeVisible();
	await expect(septemberTwentyEightReplacement).toHaveClass(/calendar-day-replacement--blue/);
	await expect(septemberTwentyEight).toHaveCSS("background-image", "none");

	await septemberTwentyNine.click();
	await page.waitForTimeout(250);
	await expect(septemberTwentyEight).toBeVisible();
	await expect(septemberTwentyEightReplacement).toBeVisible();
	await expect(septemberTwentyEightReplacement).toHaveClass(/calendar-day-replacement--blue/);
	await expect(septemberTwentyEight.locator(".calendar-day-cell-number")).toHaveText("5");
	await expect(septemberTwentyEight).toHaveCSS("background-image", "none");

	await septemberThirty.click();
	await page.waitForTimeout(250);
	await expect(septemberTwentyNine).toBeVisible();
	await expect(septemberTwentyNineReplacement).toBeVisible();
	await expect(septemberTwentyEightReplacement).toHaveClass(/calendar-day-replacement--blue/);
	await expect(septemberTwentyNineReplacement).toHaveClass(/calendar-day-replacement--yellow/);
	await expect(septemberTwentyNine.locator(".calendar-day-cell-number")).toHaveText("6");
	await expect(septemberTwentyEight).toHaveCSS("background-image", "none");
	await expect(septemberTwentyNine).toHaveCSS("background-image", "none");
});

test("Story is available on weekday daily menus from October 5 onward", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await expect(page.locator("#daily-menu-panel")).toBeVisible();
	await expect(page.getByRole("button", { name: "Story" })).toBeVisible();
	await page.getByRole("button", { name: "Story" }).click();
	await expect(page.locator("#daily-menu-story-panel")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Story" })).toBeVisible();
});

test("Daily-menu Home stays 16px left of Back and returns home", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();

	const homeButton = page.locator("#daily-menu-home-button");
	const assertNavigationButtonSpacing = async (backSelector) => {
		const homeBounds = await homeButton.boundingBox();
		const backBounds = await page.locator(backSelector).boundingBox();
		expect(homeBounds.y).toBe(16);
		expect(backBounds.y).toBe(16);
		expect(backBounds.x - (homeBounds.x + homeBounds.width)).toBe(16);
	};

	await expect(homeButton).toBeVisible();
	await assertNavigationButtonSpacing("#daily-menu-back-button");
	await page.getByRole("button", { name: "Story" }).click();
	await assertNavigationButtonSpacing("#daily-menu-story-back-button");
	await homeButton.click();

	await expect(page.locator("#home-page-shell")).toBeVisible();
});

test("Story opens the Year tab by default", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();

	await expect(page.locator("#daily-menu-story-panel")).toBeVisible();
	await expect(page.getByRole("button", { name: "Year" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await expect(page.locator("#daily-menu-story-tab-year")).toHaveClass(
		/daily-menu-story-tab--active/,
	);
	await expect(page.locator(".daily-menu-story-menu-panel")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Year" })).toBeVisible();
	await expect(
		page.getByText(
			"Expeditions into Blockland: The Obsidian Portal and the Never Ending Tales of Raili Rose",
			{ exact: true },
		),
	).toBeVisible();
	await expect(
		page.getByText("Deep beneath the surface of your blocky world, an adventure awaits.", {
			exact: true,
		}),
	).toBeVisible();
	await page.locator("#daily-menu-story-tab-quarter").click();
	await expect(page.getByRole("heading", { name: "Quarter" })).toBeVisible();
	await expect(
		page.getByText("Journey into Blockland: Safari through the Savanna", { exact: true }),
	).toBeVisible();
	await expect(
		page.getByText("The swirling violet mist within the obsidian frame begins to steady.", {
			exact: false,
		}),
	).toBeVisible();
	await page.locator("#daily-menu-story-tab-month").click();
	await expect(page.getByRole("heading", { name: "Month" })).toBeVisible();
	await expect(page.getByText("The Herbivores of the Plains", { exact: true })).toBeVisible();
	await expect(
		page.getByText("The Great Plant-Eaters! Adventure awaits across the sunlit savanna", {
			exact: false,
		}),
	).toBeVisible();
	await page.locator("#daily-menu-story-tab-week").click();
	await expect(page.getByRole("heading", { name: "Week" })).toBeVisible();
	await expect(page.getByText("The Whispering Giraffes", { exact: true })).toBeVisible();
	await expect(
		page.getByText("your journal is translating animal speech", { exact: false }),
	).toBeVisible();
});

test("Calendar button returns from a nested Story menu", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();
	await expect(page.locator("#daily-menu-story-panel")).toBeVisible();
	await page.locator("#daily-menu-story-tab-week").click();
	await expect(page.getByRole("heading", { name: "Week" })).toBeVisible();

	await page.locator("#calendar-tab").click();

	await expect(page.locator("#daily-menu-panel")).toHaveCount(0);
	await expect(page.locator("#daily-menu-story-panel")).toHaveCount(0);
	await expect(septemberTwentyEight).toBeVisible();
});

test("Day timeline shows the matching Day 1 through Day 5 stories", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	let currentMonth = "October";

	for (const day of [
		{
			month: "October",
			cellId: 7,
			theme: "The Journey to the Watering Hole",
			story: "Towering above you, the giraffes stretch so high",
		},
		{
			month: "October",
			cellId: 8,
			theme: "The Journey to Acacia Grove",
			story: "After the herd drinks deeply from the cool, sparkling watering hole",
		},
		{
			month: "October",
			cellId: 9,
			theme: "Handling the Lions with Pride",
			story: "Full bellies, sweet acacia leaves, and cool water.",
		},
		{
			month: "October",
			cellId: 10,
			theme: "The Float of Crocodiles",
			story: "We can't thank you enough, Master Explorer Raili Rose",
		},
		{
			month: "October",
			cellId: 11,
			theme: "The Towering Acacia Clinic",
			story: "After a day of victory celebrations, exhaustion hits you all at once",
		},
	]) {
		if (day.month !== currentMonth) {
			await page.getByRole("button", { name: "Show next month" }).click();
			currentMonth = day.month;
		}
		const calendarDay = page.locator(`#calendar-day-cell-${day.month}-2026-${day.cellId}`);
		await calendarDay.click();
		await page.waitForTimeout(500);
		await calendarDay.click();
		await page.getByRole("button", { name: "Story" }).click();
		await page.locator("#daily-menu-story-tab-day").click();
		await expect(page.getByText(day.theme, { exact: true })).toBeVisible();
		await expect(page.getByText(day.story, { exact: false })).toBeVisible();
		await page.locator("#daily-menu-story-back-button").click();
		await page.getByRole("button", { name: "Back to calendar" }).click();
	}
});

test("Selecting Story replaces the daily menu content and hides the menu text", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();

	await expect(page.locator("#daily-menu-story-panel")).toBeVisible();
	await expect(page.locator("#daily-menu-subject-navigation")).not.toBeVisible();
	await expect(page.getByRole("heading", { name: "Daily Menu" })).not.toBeVisible();
	await expect(page.locator(".daily-menu-date")).not.toBeVisible();

	const storyPanelBox = await page.locator("#daily-menu-story-panel").boundingBox();
	const dailyContentBox = await page.locator(".daily-menu-content").boundingBox();
	if (!storyPanelBox || !dailyContentBox) {
		test.fail("Daily menu layout boxes were not available for story-panel validation.");
	}
	const widthDifference = Math.abs(storyPanelBox.width - dailyContentBox.width);
	expect(widthDifference).toBeLessThanOrEqual(6);
});

test("Story screen keeps only one back button visible and returns one screen at a time", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();

	await expect(page.locator("#daily-menu-back-button")).toHaveCount(0);
	await expect(page.locator("#daily-menu-story-back-button")).toBeVisible();

	await page.locator("#daily-menu-story-back-button").click();
	await expect(page.locator("#daily-menu-subject-navigation")).toBeVisible();
	await expect(page.locator("#daily-menu-story-panel")).not.toBeVisible();
	await expect(page.getByRole("button", { name: "Back to calendar" })).toBeVisible();
	await page.getByRole("button", { name: "Back to calendar" }).click();
	await expect(page.locator("#daily-menu-panel")).not.toBeVisible();
});

test("Story panel includes a back button that returns to the daily menu", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();

	await expect(page.locator("#daily-menu-story-back-button")).toBeVisible();
	await page.locator("#daily-menu-story-back-button").click();
	await expect(page.locator("#daily-menu-subject-navigation")).toBeVisible();
	await expect(page.locator("#daily-menu-story-panel")).not.toBeVisible();
});

test("Story panel exposes Year, Quarter, Month, Week, and Day tabs on the outer edge", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();

	for (const tabName of ["Year", "Quarter", "Month", "Week", "Day"]) {
		const tab = page.getByRole("button", { name: tabName });
		await expect(tab).toBeVisible();
	}

	const tabLabels = await page.locator(".daily-menu-story-tab").allTextContents();
	expect(tabLabels).toEqual(["Year", "Quarter", "Month", "Week", "Day"]);

	await page.locator("#daily-menu-story-tab-day").click();
	const dayPanel = page.getByRole("tabpanel", { name: "Day story menu" });
	await expect(dayPanel.getByRole("heading", { name: "Theme" })).toBeVisible();
	await expect(dayPanel.getByRole("heading", { name: "Story" })).toBeVisible();

	const panelBox = await page.locator("#daily-menu-story-panel").boundingBox();
	const yearTabBox = await page.getByRole("button", { name: "Year" }).boundingBox();

	if (!panelBox || !yearTabBox) {
		test.fail("Story panel and tab geometry were not available for validation.");
	}

	expect(yearTabBox.x + yearTabBox.width).toBeLessThanOrEqual(panelBox.x + 4);
});

test("Story panel Theme header matches the Story header styling", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();

	const themeHeading = page.locator("#daily-menu-story-panel h3");
	const storyHeading = page.locator("#daily-menu-story-panel h2", { hasText: "Story" });

	await expect(themeHeading).toBeVisible();
	await expect(storyHeading).toBeVisible();

	const [themeStyle, storyStyle, themeSize, storySize] = await Promise.all([
		themeHeading.evaluate((element) => getComputedStyle(element).fontFamily),
		storyHeading.evaluate((element) => getComputedStyle(element).fontFamily),
		themeHeading.evaluate((element) => getComputedStyle(element).fontSize),
		storyHeading.evaluate((element) => getComputedStyle(element).fontSize),
	]);

	expect(themeStyle).toBe(storyStyle);
	expect(themeSize).toBe(storySize);
});

test("Story panel uses a right-aligned scrollbar when text exceeds the panel height", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await page.getByRole("button", { name: "Story" }).click();

	const storyMenuPanel = page.locator(".daily-menu-story-menu-panel");
	await expect(storyMenuPanel).toBeVisible();
	await storyMenuPanel.evaluate((element) => {
		element.insertAdjacentHTML(
			"beforeend",
			Array.from(
				{ length: 40 },
				() =>
					"<p>Story paragraph repeated to force vertical overflow in the panel to ensure the scrollbar can be used.</p>",
			).join(""),
		);
	});

	const panelState = await storyMenuPanel.evaluate((element) => {
		const styles = window.getComputedStyle(element);
		return {
			overflowY: styles.overflowY,
			scrollHeight: element.scrollHeight,
			clientHeight: element.clientHeight,
			canScroll: element.scrollHeight > element.clientHeight,
		};
	});

	expect(panelState.overflowY).toBe("auto");
	expect(panelState.canScroll).toBe(true);
	await storyMenuPanel.evaluate((element) => {
		element.scrollTop = element.scrollHeight;
	});
	await expect
		.poll(async () => await storyMenuPanel.evaluate((element) => element.scrollTop > 0))
		.toBe(true);
});

test("Leaving and reopening the calendar reapplies the TNT texture", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await expect(septemberTwentyEight).toHaveCSS("background-image", "none");

	await page.getByRole("button", { name: "Back to home page" }).click();
	await expect(page.locator("#home-page-shell")).toBeVisible();

	await page.getByRole("button", { name: "Open student section" }).click();
	const reopenedSeptemberTwentyEight = page.locator("#calendar-day-cell-October-2026-7");
	await expect(reopenedSeptemberTwentyEight).toHaveCSS(
		"background-image",
		/url\(".*minecraftTNT/,
	);
});
