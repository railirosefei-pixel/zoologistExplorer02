import { test, expect } from "@playwright/test";

test("September 1 uses a gated explosion before opening the daily menu", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
	await expect(septemberOne).toBeVisible();
	await septemberOne.click();

	await expect(septemberOne).toBeDisabled();
	await page.waitForTimeout(1200);
	await expect(septemberOne).toBeEnabled();
	await septemberOne.click();

	await expect(page.locator("#daily-menu-panel")).toBeVisible();
	await expect(page.getByRole("heading", { name: /Daily Menu/i })).toBeVisible();
});

test("Rapid later clicks preserve earlier square replacements and hide TNT textures", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
	const septemberTwo = page.locator("#calendar-day-cell-September-2026-2");
	const septemberThree = page.locator("#calendar-day-cell-September-2026-3");
	const septemberOneReplacement = page.locator("#calendar-day-replacement-September-2026-1");
	const septemberTwoReplacement = page.locator("#calendar-day-replacement-September-2026-2");

	await septemberOne.click();
	await page.waitForTimeout(500);
	await expect(septemberOneReplacement).toBeVisible();
	await expect(septemberOneReplacement).toHaveClass(/calendar-day-replacement--blue/);
	await expect(septemberOne).toHaveCSS("background-image", "none");

	await septemberTwo.click();
	await page.waitForTimeout(250);
	await expect(septemberOne).toBeVisible();
	await expect(septemberOneReplacement).toBeVisible();
	await expect(septemberOneReplacement).toHaveClass(/calendar-day-replacement--blue/);
	await expect(septemberOne.locator(".calendar-day-cell-number")).toHaveText("1");
	await expect(septemberOne).toHaveCSS("background-image", "none");

	await septemberThree.click();
	await page.waitForTimeout(250);
	await expect(septemberTwo).toBeVisible();
	await expect(septemberTwoReplacement).toBeVisible();
	await expect(septemberOneReplacement).toHaveClass(/calendar-day-replacement--blue/);
	await expect(septemberTwoReplacement).toHaveClass(/calendar-day-replacement--yellow/);
	await expect(septemberTwo.locator(".calendar-day-cell-number")).toHaveText("2");
	await expect(septemberOne).toHaveCSS("background-image", "none");
	await expect(septemberTwo).toHaveCSS("background-image", "none");
});

test("Every revealed day opens the daily menu for its own date", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
	const septemberTwo = page.locator("#calendar-day-cell-September-2026-2");
	const septemberThree = page.locator("#calendar-day-cell-September-2026-3");
	const dailyMenuDate = page.locator(".daily-menu-date");

	await septemberOne.click();
	await page.waitForTimeout(500);
	await septemberTwo.click();
	await page.waitForTimeout(500);
	await septemberThree.click();
	await page.waitForTimeout(500);

	for (const [dayCell, expectedDate] of [
		[septemberOne, "September 1, 2026"],
		[septemberTwo, "September 2, 2026"],
		[septemberThree, "September 3, 2026"],
	]) {
		await dayCell.click();
		await expect(page.locator("#daily-menu-panel")).toBeVisible();
		await expect(dailyMenuDate).toHaveText(expectedDate);
		await page.getByRole("button", { name: "Back to calendar" }).click();
	}
});

test("Story is available on weekday daily menus from September 28 onward", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
	await septemberTwentyEight.click();
	await page.waitForTimeout(500);
	await septemberTwentyEight.click();
	await expect(page.locator("#daily-menu-panel")).toBeVisible();
	await expect(page.getByRole("button", { name: "Story" })).toBeVisible();
	await page.getByRole("button", { name: "Story" }).click();
	await expect(page.locator("#daily-menu-story-panel")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Story" })).toBeVisible();
});

test("Story opens the Year tab by default", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
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

test("Day timeline shows the matching Day 1 through Day 5 stories", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	let currentMonth = "September";

	for (const day of [
		{
			month: "September",
			cellId: 28,
			theme: "The Journey to the Watering Hole",
			story: "Towering above you, the giraffes stretch so high",
		},
		{
			month: "September",
			cellId: 29,
			theme: "The Journey to Acacia Grove",
			story: "After the herd drinks deeply from the cool, sparkling watering hole",
		},
		{
			month: "September",
			cellId: 30,
			theme: "Handling the Lions with Pride",
			story: "Full bellies, sweet acacia leaves, and cool water.",
		},
		{
			month: "October",
			cellId: 3,
			theme: "The Float of Crocodiles",
			story: "We can't thank you enough, Master Explorer Raili Rose",
		},
		{
			month: "October",
			cellId: 4,
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

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
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

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
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

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
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

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
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

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
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

	const septemberTwentyEight = page.locator("#calendar-day-cell-September-2026-28");
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

	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
	await septemberOne.click();
	await page.waitForTimeout(500);
	await expect(septemberOne).toHaveCSS("background-image", "none");

	await page.getByRole("button", { name: "Back to home page" }).click();
	await expect(page.locator("#home-page-shell")).toBeVisible();

	await page.getByRole("button", { name: "Open student section" }).click();
	const reopenedSeptemberOne = page.locator("#calendar-day-cell-September-2026-1");
	await expect(reopenedSeptemberOne).toHaveCSS("background-image", /url\(".*minecraftTNT/);
});
