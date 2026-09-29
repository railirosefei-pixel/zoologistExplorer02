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

test("Parent Block Edits shows a Monday through Friday weekly panel set", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.getByRole("button", { name: "Open Blocks menu" }).click();
	await page.getByRole("button", { name: "Open Block Edits" }).click();

	const panels = page.locator(".block-edits-panel");
	await expect(panels).toHaveCount(5);
	const panelCount = await panels.count();
	expect(panelCount).toBe(5);

	const uniqueDates = await page
		.locator(".block-edits-panel-date")
		.evaluateAll((elements) => elements.map((element) => element.textContent.trim()));
	expect(uniqueDates).toHaveLength(5);
	expect(uniqueDates.every((date) => date.length > 0)).toBeTruthy();
});

test("Text Editor Back returns to the Parent menu", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Back to parent menu" }).click();

	await expect(page.getByRole("button", { name: "Student Edits" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Text Editor" })).toBeVisible();
	await expect(page.locator("#student-menu-page")).toHaveCount(0);
});

test("Text Editor calibration bar keeps its width and anchored resize behavior", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	const calibrateButton = page.getByRole("button", { name: "Calibrate" });
	await calibrateButton.click();

	const calibrationBar = page.locator("#calibration-bar");
	const topHandle = page.locator("#calibration-bar-top-handle");
	const bottomHandle = page.locator("#calibration-bar-bottom-handle");
	const counter = page.locator("#calibration-bar-height-counter");
	const rotateButton = page.locator("#calibration-bar-rotate-button");
	const readBarBounds = () => calibrationBar.boundingBox();

	await expect(counter).toHaveText("500 px");
	const calibrateButtonBounds = await calibrateButton.boundingBox();
	expect(await readBarBounds()).toMatchObject({
		x: calibrateButtonBounds.x + (calibrateButtonBounds.width - 60) / 2,
		y: calibrateButtonBounds.y + calibrateButtonBounds.height,
		width: 60,
		height: 500,
	});

	const initialBounds = await readBarBounds();
	const bottomHandleBounds = await bottomHandle.boundingBox();
	await page.mouse.move(
		bottomHandleBounds.x + bottomHandleBounds.width / 2,
		bottomHandleBounds.y + bottomHandleBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		bottomHandleBounds.x + bottomHandleBounds.width / 2,
		bottomHandleBounds.y + bottomHandleBounds.height / 2 + 40,
	);
	await page.mouse.up();

	await expect(counter).toHaveText("540 px");
	const bottomResizedBounds = await readBarBounds();
	expect(bottomResizedBounds.x).toBe(initialBounds.x);
	expect(bottomResizedBounds.y).toBe(initialBounds.y);
	expect(bottomResizedBounds.height).toBe(540);

	const topHandleBounds = await topHandle.boundingBox();
	await page.mouse.move(
		topHandleBounds.x + topHandleBounds.width / 2,
		topHandleBounds.y + topHandleBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		topHandleBounds.x + topHandleBounds.width / 2,
		topHandleBounds.y + topHandleBounds.height / 2 - 40,
	);
	await page.mouse.up();

	await expect(counter).toHaveText("580 px");
	const topResizedBounds = await readBarBounds();
	expect(topResizedBounds.x).toBe(initialBounds.x);
	expect(topResizedBounds.y).toBe(initialBounds.y - 40);
	expect(topResizedBounds.height).toBe(580);

	const preRotateBounds = await readBarBounds();
	const repositionDeltaX = 40 - preRotateBounds.x;
	await page.mouse.move(
		preRotateBounds.x + preRotateBounds.width / 2,
		preRotateBounds.y + preRotateBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		preRotateBounds.x + preRotateBounds.width / 2 + repositionDeltaX,
		preRotateBounds.y + preRotateBounds.height / 2,
	);
	await page.mouse.up();
	const repositionedBounds = await readBarBounds();
	expect(repositionedBounds.x).toBe(40);
	expect(repositionedBounds.y).toBe(preRotateBounds.y);

	await rotateButton.click();
	await expect(calibrationBar).toHaveCSS("height", "60px");
	await expect(calibrationBar).toHaveCSS("width", "580px");
	await expect(counter).toHaveText("580 px");
	const horizontalBounds = await readBarBounds();
	const horizontalCounterBounds = await counter.boundingBox();
	expect(horizontalCounterBounds.y + horizontalCounterBounds.height + 16).toBeCloseTo(
		horizontalBounds.y,
		0,
	);
	expect(horizontalCounterBounds.x + horizontalCounterBounds.width).toBeCloseTo(
		horizontalBounds.x + horizontalBounds.width,
		0,
	);

	const horizontalResizeHandle = page.locator("#calibration-bar-bottom-handle");
	const horizontalResizeHandleBounds = await horizontalResizeHandle.boundingBox();
	await page.mouse.move(
		horizontalResizeHandleBounds.x + horizontalResizeHandleBounds.width / 2,
		horizontalResizeHandleBounds.y + horizontalResizeHandleBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		horizontalResizeHandleBounds.x + horizontalResizeHandleBounds.width / 2 + 40,
		horizontalResizeHandleBounds.y + horizontalResizeHandleBounds.height / 2,
	);
	await page.mouse.up();

	const horizontalResizedBounds = await readBarBounds();
	expect(horizontalResizedBounds.width).toBe(620);
	expect(horizontalResizedBounds.height).toBe(60);
	expect(horizontalResizedBounds.y).toBe(horizontalBounds.y);
	await expect(counter).toHaveText("620 px");

	await rotateButton.click();
	await expect(calibrationBar).toHaveCSS("width", "60px");
	await expect(calibrationBar).toHaveCSS("height", "620px");
	await expect(counter).toHaveText("620 px");

	await calibrateButton.click();
	await expect(calibrationBar).toHaveCount(0);
	await calibrateButton.click();
	await expect(counter).toHaveText("620 px");
	await expect(calibrationBar).toHaveCSS("height", "620px");

	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Calibrate" }).click();
	await expect(counter).toHaveText("620 px");
	const movementStartBounds = await readBarBounds();
	expect(movementStartBounds.height).toBe(620);
	const movementStartX = movementStartBounds.x + movementStartBounds.width / 2;
	const movementStartY = movementStartBounds.y + movementStartBounds.height / 2;
	await page.mouse.move(movementStartX, movementStartY);
	await page.mouse.down();
	await page.mouse.move(movementStartX + 35, movementStartY + 20);
	await page.mouse.up();
	const movedBounds = await readBarBounds();
	expect(movedBounds.x).toBe(movementStartBounds.x + 35);
	expect(movedBounds.y).toBe(movementStartBounds.y + 20);
});

test("Text Editor calibration bar converts pixels to calibrated ruler units", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Calibrate" }).click();

	const counter = page.locator("#calibration-bar-height-counter");
	const realLengthInput = page.locator("#calibration-real-length-input");
	const unitSelect = page.locator("#calibration-unit-select");
	const commitButton = page.locator("#calibration-commit-button");

	await expect(counter).toHaveText("500 px");
	await realLengthInput.fill("10");
	await unitSelect.selectOption("cm");
	await commitButton.click();
	await expect(counter).toContainText("10.00 cm");
	await expect(counter).toContainText("500 px");

	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Calibrate" }).click();
	await expect(counter).toContainText("10.00 cm");
});

test("Print Preview renders the paper template at the Size menu dimensions", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Templates" }).click();
	await page.getByRole("button", { name: "Editing Tools" }).click();
	await page.getByRole("button", { name: "Size" }).click();

	await page.locator("#text-editor-size-width").fill("100");
	await page.locator("#text-editor-size-height").fill("50");
	await page.getByRole("button", { name: "Print Preview" }).click();

	const paper = page.locator("#print-preview-paper");
	const paperBounds = await paper.boundingBox();
	expect(paperBounds.width).toBe(100);
	expect(paperBounds.height).toBe(50);

	await page.locator("#text-editor-size-width-unit").click();
	await page.locator("#text-editor-size-width-in-option").click();
	await page.locator("#text-editor-size-height-unit").click();
	await page.locator("#text-editor-size-height-in-option").click();
	await page.locator("#text-editor-size-width").fill("8");
	await page.locator("#text-editor-size-height").fill("10");

	const sizeLabel = page.locator("#print-preview-paper-size-label");
	await expect(sizeLabel).toHaveText("8in × 10in");
	const inchBounds = await paper.boundingBox();
	expect(inchBounds.width).toBeCloseTo(537.6, 0);
	expect(inchBounds.height).toBeCloseTo(672, 0);
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

test("Back and Home buttons depress on click and glow while held", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();

	const homeButton = page.locator("#student-edits-screen-home-button");
	const backButton = page.locator("#student-edits-screen-back-button");
	await expect(homeButton).toBeVisible();
	await expect(backButton).toBeVisible();

	const homeBounds = await homeButton.boundingBox();
	const backBounds = await backButton.boundingBox();
	await page.mouse.move(homeBounds.x + homeBounds.width / 2, homeBounds.y + homeBounds.height / 2);
	await page.mouse.down();
	await expect(homeButton).toHaveClass(/nav-button--held-home/);
	await expect(homeButton).toHaveCSS("animation-duration", "8s");
	await expect(homeButton).toHaveCSS("animation-name", /sparkle|glow/i);
	await page.mouse.up();
	await expect(page.getByRole("button", { name: "Open parent section" })).toBeVisible();

	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	const backCenterX = backBounds.x + backBounds.width / 2;
	const backCenterY = backBounds.y + backBounds.height / 2;
	await page.mouse.move(backCenterX, backCenterY);
	await page.mouse.down();
	await expect(backButton).toHaveClass(/nav-button--held-back/);
	await expect(backButton).toHaveCSS("animation-duration", "8s");
	await expect(backButton).toHaveCSS("animation-name", /sparkle|glow/i);
	await page.mouse.up();
	await expect(page.getByRole("button", { name: "Student Edits" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Text Editor" })).toBeVisible();
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

test("Rewards button opens full-screen rewards page", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();

	const rewardsPage = page.locator("#rewards-page");
	await expect(rewardsPage).toBeVisible();
	await expect(page.locator("#student-menu-page")).toBeHidden();
	await expect(rewardsPage.locator("#rewards-page-heading")).toHaveText("Rewards");

	const backgroundImage = await rewardsPage.evaluate(
		(element) => getComputedStyle(element).backgroundImage,
	);
	expect(backgroundImage).toMatch(/rewardsMenu02[^)]*\.webp/);

	const pageSize = await rewardsPage.evaluate((element) => {
		const { width, height } = element.getBoundingClientRect();
		return { width, height };
	});
	const viewportSize = page.viewportSize();
	expect(pageSize.width).toBeGreaterThanOrEqual(viewportSize.width);
	expect(pageSize.height).toBeGreaterThanOrEqual(viewportSize.height);

	const rewardChestButton = page.getByRole("button", { name: "Open reward chest" });
	const rewardChestImage = rewardChestButton.locator(".rewards-page-chest");
	await expect(rewardChestImage).toHaveAttribute("src", /minecraftChest01[^/]*\.webp/);

	await rewardChestButton.hover();
	await expect(rewardChestImage).toHaveAttribute("src", /minecraftChest02[^/]*\.webp/);

	await rewardChestButton.click();
	await expect(rewardChestImage).toHaveAttribute("src", /minecraftChest03[^/]*\.webp/);

	const rewardJournal = rewardsPage.locator(".rewards-page-journal");
	await expect(rewardJournal).toBeVisible();
	expect(
		await rewardJournal.evaluate((element) => getComputedStyle(element).animationName),
	).toMatch(/^rewards-journal-emerge(?:-[\w-]+)?$/);

	await rewardJournal.dispatchEvent("animationend");
	const rewardBookAnimation = rewardsPage.locator(".rewards-page-book-animation");
	await expect(rewardBookAnimation).toBeVisible();
	await expect(rewardBookAnimation).toHaveAttribute("src", /Sequence02[^/]*\.webm/);
	await expect(rewardBookAnimation).toHaveJSProperty("muted", true);
	await expect
		.poll(() => rewardBookAnimation.evaluate((element) => element.readyState))
		.toBeGreaterThanOrEqual(1);

	await rewardBookAnimation.evaluate((element) => {
		element.currentTime = element.duration;
		element.dispatchEvent(new Event("ended"));
	});

	const rewardBookStage = rewardsPage.locator(".rewards-page-book-stage");
	await expect(rewardBookStage).toHaveClass(/rewards-page-book-stage--settled/);
	await expect(rewardBookAnimation).toBeVisible();
	await expect
		.poll(async () => {
			const bookBounds = await rewardBookAnimation.boundingBox();
			const chestBounds = await rewardChestButton.boundingBox();
			return bookBounds.x + bookBounds.width / 2 - (chestBounds.x + chestBounds.width / 2);
		})
		.toBeLessThan(0);

	await page.getByRole("button", { name: "Back to student menu" }).click();
	await expect(page.locator("#student-menu-page")).toBeVisible();
	await expect(page.locator("#calendar-menu-heading")).toBeVisible();
});

test("Student sidebar navigation always selects its destination", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const destinations = [
		{ button: "Games", panel: "#games-menu" },
		{ button: "Extra Credit", panel: "#extra-credit-menu" },
		{ button: "Progress", panel: "#student-submenu-panel" },
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

	const clickedDay = page.locator("#calendar-day-cell-September-2026-28");
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

	const clickedDay = page.locator("#calendar-day-cell-September-2026-28");
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
