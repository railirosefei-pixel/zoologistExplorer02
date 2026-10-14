import { expect, test } from "@playwright/test";

test("completing Math blocks advances Raili from the previous step, including after reload", async ({
	page,
}) => {
	await page.addInitScript(() => {
		localStorage.removeItem("zoologistExplorer02.completedBlocks");
		localStorage.setItem(
			"ze2.studentProgress.railiCommittedPositions",
			JSON.stringify({
				1: { x: 20, y: 10 },
				2: { x: 80, y: -35 },
				3: { x: 120, y: -60 },
			}),
		);
		if (!localStorage.getItem("ze2.studentProgress.railiProgressStepIndex")) {
			localStorage.setItem("ze2.studentProgress.railiOffsetXPx", "20");
			localStorage.setItem("ze2.studentProgress.railiOffsetYPx", "10");
		}
	});
	await page.goto("./");

	await page.getByRole("button", { name: "Open student section" }).click();
	const day = page.locator("#calendar-day-cell-October-2026-18");
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
	await expect(page.locator("#progress-xp-bar")).toHaveAttribute("aria-label", "Level 0, 0 XP");

	await page.waitForTimeout(500);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"20px",
	);
	await expect(page.locator(".progress-xp-bar-segment--filled")).toHaveCount(0);

	await page.waitForTimeout(600);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"80px",
	);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-y",
		"-35px",
	);
	await expect(page.locator(".progress-xp-bar-segment--filled")).toHaveCount(1);
	await expect(page.locator("#progress-xp-bar")).toHaveAttribute("aria-label", "Level 0, 20 XP");
	await expect
		.poll(() =>
			page.evaluate(() => localStorage.getItem("ze2.studentProgress.railiProgressStepIndex")),
		)
		.toBe("2");

	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Progress tab" }).click();
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"80px",
	);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-y",
		"-35px",
	);
	await page.locator("#student-progress-back-button").click();

	const nextDay = page.locator("#calendar-day-cell-October-2026-18");
	await nextDay.click();
	await nextDay.click();
	await page.locator("#daily-menu-math-button").click();
	await page.locator("#daily-menu-math-block-2-button").click();
	await page.locator("#daily-menu-math-block-2-complete-button").click();

	await page.waitForTimeout(1100);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-x",
		"120px",
	);
	await expect(page.locator("#student-progress-raili-frame")).toHaveCSS(
		"--student-raili-offset-y",
		"-60px",
	);
	await expect
		.poll(() =>
			page.evaluate(() => localStorage.getItem("ze2.studentProgress.railiProgressStepIndex")),
		)
		.toBe("3");
});
