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
