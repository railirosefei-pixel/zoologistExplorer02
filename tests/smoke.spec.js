import { test, expect } from "@playwright/test";

test("home page loads and renders the app shell", async ({ page }) => {
	await page.goto("./");

	await expect(page).toHaveTitle(/zoologistExplorer02/i);
	await expect(page.locator("#home-page-shell")).toBeVisible();
	const backgroundImage = await page
		.locator("#home-page-shell")
		.evaluate((element) => getComputedStyle(element).backgroundImage);
	expect(backgroundImage).not.toBe("none");
	const containerRightEdge = await page
		.locator("#home-page-container")
		.evaluate((element) => element.getBoundingClientRect().right);
	expect(containerRightEdge).toBe(275);
	await expect(page.getByRole("button", { name: "Open student section" })).toBeVisible();
});

test("Student button opens the full-screen menu and Back returns home", async ({ page }) => {
	await page.goto("./");

	await page.getByRole("button", { name: "Open student section" }).click();

	const studentMenu = page.locator("#student-menu-page");
	await expect(studentMenu).toBeVisible();
	await expect(page.locator("#calendar-tab")).toBeVisible();
	const menuHeight = await studentMenu.evaluate(
		(element) => element.getBoundingClientRect().height,
	);
	const viewportHeight = page.viewportSize().height;
	expect(menuHeight).toBeGreaterThanOrEqual(viewportHeight);

	await page.getByRole("button", { name: "Back to home page" }).click();

	await expect(page.locator("#home-page-shell")).toBeVisible();
	await expect(studentMenu).toBeHidden();
});

test("September 2026 hides Back without moving Calendar or Forward", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const calendarHeading = page.locator("#calendar-menu-heading");
	const forwardButton = page.locator("#calendar-next-month-button");
	const backButton = page.locator("#calendar-previous-month-button");
	const readPosition = (element) =>
		element.evaluate((node) => {
			const { x, y, width, height } = node.getBoundingClientRect();
			return { x, y, width, height };
		});

	await page.getByRole("button", { name: "Show next month" }).click();
	const octoberHeadingPosition = await readPosition(calendarHeading);
	const octoberForwardPosition = await readPosition(forwardButton);

	await page.getByRole("button", { name: "Show previous month" }).click();
	await expect(backButton).toHaveCount(0);
	expect(await readPosition(calendarHeading)).toEqual(octoberHeadingPosition);
	expect(await readPosition(forwardButton)).toEqual(octoberForwardPosition);
});

test("December 2027 hides Forward without moving Back or Calendar", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const calendarHeading = page.locator("#calendar-menu-heading");
	const backButton = page.locator("#calendar-previous-month-button");
	const forwardButton = page.locator("#calendar-next-month-button");
	const monthHeading = page.locator("#calendar-month-header h2");
	const readPosition = (element) =>
		element.evaluate((node) => {
			const { x, y, width, height } = node.getBoundingClientRect();
			return { x, y, width, height };
		});

	for (let monthOffset = 0; monthOffset < 14; monthOffset += 1) {
		await page.getByRole("button", { name: "Show next month" }).click();
	}
	await expect(monthHeading).toHaveText("November 2027");
	const novemberHeadingPosition = await readPosition(calendarHeading);
	const novemberBackPosition = await readPosition(backButton);

	await page.getByRole("button", { name: "Show next month" }).click();
	await expect(monthHeading).toHaveText("December 2027");
	await expect(forwardButton).toHaveCount(0);
	await expect(backButton).toBeVisible();
	expect(await readPosition(calendarHeading)).toEqual(novemberHeadingPosition);
	expect(await readPosition(backButton)).toEqual(novemberBackPosition);
});

test("Student sidebar includes the full button set", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	await expect(page.getByRole("button", { name: "Calendar" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Rewards" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Games" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Extra Credit" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Progress" })).toBeVisible();
});

test("Student sidebar navigation always selects its destination", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const destinations = [
		{ button: "Rewards", panel: "#rewards-menu" },
		{ button: "Games", panel: "#games-menu" },
		{ button: "Extra Credit", panel: "#extra-credit-menu" },
		{ button: "Progress", panel: "#progress-menu" },
	];

	for (const destination of destinations) {
		const button = page.getByRole("button", { name: destination.button });
		await button.click();
		await expect(page.locator(destination.panel)).toBeVisible();
		await button.click();
		await expect(page.locator(destination.panel)).toBeVisible();
	}

	const calendarButton = page.getByRole("button", { name: "Calendar" });
	await calendarButton.click();
	await expect(page.locator("#calendar-menu-heading")).toBeVisible();
	await expect(page.locator("#student-submenu-panel")).toHaveCount(0);
	await calendarButton.click();
	await expect(page.locator("#calendar-menu-heading")).toBeVisible();
});

test("TNT-visible day cell is disabled until its texture has cleared", async ({ page }) => {
	await page.clock.install();
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const clickedDay = page.locator(".calendar-day-cell:not(.calendar-day-cell--empty)").first();
	await clickedDay.click();
	await expect(clickedDay).toBeDisabled();
	await expect(page.locator(".calendar-day-replacement")).toBeVisible();
	await expect(clickedDay.locator(".calendar-day-cell-explosion")).toBeVisible();
	await expect(clickedDay.locator(".calendar-day-cell-number")).toBeHidden();

	await clickedDay.evaluate((dayCell) => dayCell.click());
	await expect(clickedDay).toBeDisabled();
	await expect(page.locator("#daily-menu-panel")).toBeHidden();

	await page.clock.fastForward(450);
	await expect(clickedDay).not.toBeDisabled();
	await expect(clickedDay.locator(".calendar-day-cell-explosion")).toBeVisible();
	await expect(page.locator(".calendar-day-replacement")).toBeVisible();

	await page.clock.fastForward(450);
	await expect(clickedDay.locator(".calendar-day-cell-explosion")).toBeHidden();
	await expect(page.locator(".calendar-day-replacement")).toBeVisible();
});

test("TNT explosion remains scoped to its clicked month and day cell", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const clickedDay = page.locator(".calendar-day-cell:not(.calendar-day-cell--empty)").first();
	await clickedDay.click();
	await expect(page.locator(".calendar-day-replacement")).toBeVisible();
	await expect(clickedDay.locator(".calendar-day-cell-explosion")).toBeVisible();
	await expect(clickedDay.locator(".calendar-day-cell-number")).toBeHidden();

	await page.getByRole("button", { name: "Show next month" }).click();
	await expect(page.locator(".calendar-day-replacement")).toBeHidden();

	await page.getByRole("button", { name: "Show previous month" }).click();
	await expect(clickedDay.locator(".calendar-day-cell-number")).toBeVisible();
});

test("day numbers stay fully inside the upper-left corner of each calendar box", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const info = await page
		.locator(".calendar-day-cell--current-month .calendar-day-cell-number")
		.first()
		.evaluate((element) => {
			const cell = element.closest(".calendar-day-cell");
			const cellRect = cell.getBoundingClientRect();
			const rect = element.getBoundingClientRect();
			return {
				left: rect.left - cellRect.left,
				top: rect.top - cellRect.top,
				right: rect.right - cellRect.left,
				bottom: rect.bottom - cellRect.top,
				cellWidth: cellRect.width,
				cellHeight: cellRect.height,
			};
		});

	expect(info.left).toBeGreaterThanOrEqual(0);
	expect(info.top).toBeGreaterThanOrEqual(0);
	expect(info.left).toBeLessThan(info.cellWidth * 0.4);
	expect(info.top).toBeLessThan(info.cellHeight * 0.4);
	expect(info.right).toBeLessThanOrEqual(info.cellWidth + 1);
	expect(info.bottom).toBeLessThanOrEqual(info.cellHeight + 1);
});
