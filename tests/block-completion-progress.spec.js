import { expect, test } from "@playwright/test";

test("completing a Math block advances Raili to step 2 and fills one XP segment", async ({
	page,
}) => {
	await page.addInitScript(() => {
		localStorage.removeItem("zoologistExplorer02.completedBlocks");
		localStorage.setItem(
			"ze2.studentProgress.railiCommittedPositions",
			JSON.stringify({
				1: { x: 20, y: 10 },
				2: { x: 80, y: -35 },
			}),
		);
		localStorage.setItem("ze2.studentProgress.railiOffsetXPx", "20");
		localStorage.setItem("ze2.studentProgress.railiOffsetYPx", "10");
	});
	await page.goto("./");

	await page.getByRole("button", { name: "Open student section" }).click();
	const day = page.locator("#calendar-day-cell-October-2026-7");
	await day.click();
	await day.click();
	await page.locator("#daily-menu-math-button").click();
	await page.locator("#daily-menu-math-block-1-button").click();
	await page.locator("#daily-menu-math-block-1-complete-button").click();

	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"20px",
	);
	await expect(page.locator(".progress-xp-bar-segment--filled")).toHaveCount(0);
	await expect(page.locator("#progress-xp-bar")).toHaveAttribute(
		"aria-label",
		"Level 0, 0 XP",
	);

	await page.waitForTimeout(500);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"20px",
	);
	await expect(page.locator(".progress-xp-bar-segment--filled")).toHaveCount(0);

	await page.waitForTimeout(1600);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"80px",
	);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-y",
		"-35px",
	);
	await expect(page.locator(".progress-xp-bar-segment--filled")).toHaveCount(1);
	await expect(page.locator("#progress-xp-bar")).toHaveAttribute(
		"aria-label",
		"Level 0, 20 XP",
	);
});
