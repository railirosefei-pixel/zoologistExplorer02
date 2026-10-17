import { expect, test } from "@playwright/test";

test("Game Edits resets a specific game and its next completion fills Extra Credit", async ({
	page,
}) => {
	await page.addInitScript(() => {
		localStorage.setItem(
			"zoologistExplorer02.safariMathGamesCompleted",
			JSON.stringify({ "safari-place-value": true }),
		);
		Math.random = () => 0;
	});
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits", exact: true }).click();
	await page.getByRole("button", { name: "Game Edits", exact: true }).click();

	await expect(page.locator("#student-edits-game-menu")).toBeVisible();
	await expect(page.locator("#student-games-top-navigation button")).toHaveCount(5);
	await expect(page.locator("#student-safari-place-value-thumbnail")).toBeVisible();
	await expect(page.locator("#student-safari-multiplication-thumbnail")).toBeVisible();
	await expect(page.locator("#student-safari-multiplication-double-digit-thumbnail")).toBeVisible();
	const resetButtons = page.locator(".student-games-extra-credit-reset-button");
	await expect(resetButtons).toHaveCount(3);
	await expect(resetButtons).toHaveText([
		"Reset Extra Credit",
		"Reset Extra Credit",
		"Reset Extra Credit",
	]);
	await expect(resetButtons.first()).toHaveCSS("background-color", "rgb(220, 38, 38)");
	await expect(resetButtons.first()).toHaveCSS("border-radius", "9999px");

	await page.locator("#student-game-extra-credit-reset-safari-place-value").click();
	await expect
		.poll(() =>
			page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.safariMathGamesCompleted")),
			),
		)
		.toEqual({});
	await expect
		.poll(() =>
			page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.safariMathExtraCreditState")),
			),
		)
		.toEqual({ segments: 0, pendingResets: { "safari-place-value": true } });

	await page.locator("#student-edits-screen-home-button").click();
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Games tab", exact: true }).click();
	await page.locator("#student-safari-place-value-thumbnail").click();

	const solveCurrentQuest = async () => {
		let target = Number(
			(await page.locator("#safari-place-value-target").innerText()).replaceAll(",", ""),
		);
		for (const value of [1000, 100, 10, 1]) {
			const blockCount = Math.floor(target / value);
			for (let count = 0; count < blockCount; count += 1) {
				await page.locator(`#safari-place-value-add-${value}`).click();
			}
			target %= value;
		}
	};

	for (let quest = 0; quest < 10; quest += 1) {
		await solveCurrentQuest();
		if (quest < 9) {
			await page.locator("#safari-place-value-next-button").click();
		}
	}

	await expect(page.locator("#progress-xp-bar")).toBeVisible({ timeout: 5000 });
	const segments = page.locator("#progress-xp-bar .progress-xp-bar-segment");
	await expect(segments.nth(12)).toHaveClass(/progress-xp-bar-segment--filled/);
	await expect(segments.nth(13)).not.toHaveClass(/progress-xp-bar-segment--filled/);
	await expect
		.poll(() =>
			page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.safariMathExtraCreditState")),
			),
		)
		.toEqual({ segments: 1, pendingResets: {} });
});

test("Progress renders both persistent Extra Credit segments", async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem(
			"zoologistExplorer02.safariMathExtraCreditState",
			JSON.stringify({ segments: 2, pendingResets: {} }),
		);
	});
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Progress tab", exact: true }).click();

	const segments = page.locator("#progress-xp-bar .progress-xp-bar-segment");
	await expect(segments).toHaveCount(14);
	await expect(segments.nth(11)).not.toHaveClass(/progress-xp-bar-segment--filled/);
	await expect(segments.nth(12)).toHaveClass(/progress-xp-bar-segment--filled/);
	await expect(segments.nth(13)).toHaveClass(/progress-xp-bar-segment--filled/);
	await expect(page.locator("#progress-xp-bar")).toHaveAttribute("aria-label", "Level 0, 0 XP");
});
