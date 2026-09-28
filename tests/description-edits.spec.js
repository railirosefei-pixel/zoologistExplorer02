import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for Parent > Student Edits > Blocks > Description Edits:
 * sidebar geometry, depressed glow state, dropdown selections, commit pipeline,
 * History entry, and calendar block rendering of the saved description.
 * Gated/manual: run with `npx playwright test tests/description-edits.spec.js`.
 */

const COMMIT_TEXT = "Line one of the description.\n\nLine three after a blank line.";

/** Click a control that sits inside the 96px bottom gap, below the 772px text box. */
async function clickOffscreenControl(page, selector) {
	await page.locator(selector).evaluate((element) => element.click());
}

test.beforeEach(async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => {
		globalThis.localStorage?.removeItem("zoologistExplorer02.blockDescriptions");
		globalThis.localStorage?.removeItem("zoologistExplorer02.descriptionHistory");
	});
	await page.reload();
});

test("Blocks sidebar is 336px wide and Description Edits commit reaches the calendar", async ({
	page,
}) => {
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#blocks-menu-button").click();

	const blocksSidebar = page.locator("#blocks-menu-sidebar");
	await expect(blocksSidebar).toBeVisible();
	const sidebarBox = await blocksSidebar.evaluate((element) => {
		const { x, width, top, height } = element.getBoundingClientRect();
		return { x, width, top, height };
	});
	expect(sidebarBox.x).toBe(0);
	expect(sidebarBox.width).toBe(336);
	expect(sidebarBox.top).toBe(0);
	expect(sidebarBox.height).toBeGreaterThanOrEqual(page.viewportSize().height);

	const descriptionEditsButton = page.locator("#description-edits-button");
	await descriptionEditsButton.click();
	await expect(descriptionEditsButton).toHaveClass(/description-edits-button--active/);
	await expect(page.locator("#description-edits-text-box")).toBeVisible();

	await clickOffscreenControl(page, "#description-edits-date-dropdown-button");
	await clickOffscreenControl(page, "#description-edits-month-dropdown-button");
	await page.locator("#description-edits-month-option-2026-9").click();
	await clickOffscreenControl(page, "#description-edits-day-dropdown-button");
	await page.locator("#description-edits-day-option-1").click();
	await clickOffscreenControl(page, "#description-edits-year-dropdown-button");
	await page.locator("#description-edits-year-option-2026").click();
	await clickOffscreenControl(page, "#description-edits-subject-dropdown-button");
	await page.locator("#description-edits-subject-option-math").click();
	await clickOffscreenControl(page, "#description-edits-block-dropdown-button");
	await page.locator("#description-edits-block-option-2").click();

	await page.locator("#description-edits-text-box").fill(COMMIT_TEXT);
	await clickOffscreenControl(page, "#description-edits-commit-button");

	const storedDescriptions = await page.evaluate(() =>
		JSON.parse(globalThis.localStorage.getItem("zoologistExplorer02.blockDescriptions")),
	);
	expect(storedDescriptions["2026-10-01::math::2"]).toBe(COMMIT_TEXT);

	await clickOffscreenControl(page, "#description-edits-history-dropdown-button");
	const historyList = page.locator("#description-edits-history-options-list");
	await expect(historyList).toBeVisible();
	const historyOption = historyList.locator(".description-edits-history-option-button", {
		hasText: /Math \d{2}\/\d{2}\/\d{2}/,
	});
	await expect(historyOption).toHaveCount(1);

	await historyOption.click();
	await expect(page.locator("#description-edits-text-box")).toHaveValue(COMMIT_TEXT);

	await page.locator("#description-edits-button").click();
	await page.locator("#blocks-menu-button").evaluate((element) => element.click());
	await page.locator("#student-edits-screen-home-button").click();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Show next month" }).click();
	const octoberFirst = page.locator("#calendar-day-cell-October-2026-3");
	await octoberFirst.click();
	await octoberFirst.click();

	await page.locator("#daily-menu-math-button").click();
	await page.locator("#daily-menu-math-block-2-button").click();

	const savedDescription = page.locator(
		"#daily-menu-math-block-2-panel .daily-menu-block-saved-description",
	);
	await expect(savedDescription).toBeVisible();
	await expect(savedDescription).toHaveText(COMMIT_TEXT);
});
