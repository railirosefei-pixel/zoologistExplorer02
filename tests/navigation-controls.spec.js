import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 2560, height: 1080 } });

const homeGradient = "linear-gradient(rgb(36, 107, 57) 0%, rgb(29, 90, 48) 33.333%, rgb(22, 74, 39) 66.667%, rgb(16, 58, 30) 100%)";
const backGradient = "linear-gradient(rgb(35, 91, 145) 0%, rgb(29, 76, 122) 33.333%, rgb(23, 62, 100) 66.667%, rgb(17, 47, 78) 100%)";

async function verifyNavigation(page, homeId, backId) {
	await page.mouse.move(500, 500);
	const homes = page.locator(".navigation-home-button:visible");
	const backs = page.locator(".navigation-back-button:visible");
	await expect(homes).toHaveCount(homeId ? 1 : 0);
	await expect(backs).toHaveCount(1);
	await expect(backs).toHaveAttribute("id", backId);
	if (homeId) await expect(homes).toHaveAttribute("id", homeId);
	for (const [button, right, gradient] of [
		[backs, 16, backGradient],
		...(homeId ? [[homes, 128, homeGradient]] : []),
	]) {
		await expect(button).toHaveCSS("background-image", gradient);
		await expect(button).toHaveCSS("font-size", "16px");
		await expect(button).toHaveCSS("border-radius", "8px");
		await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
		await expect(button).toHaveCSS("transform", "none");
		const geometry = await button.evaluate((element) => {
			const bounds = element.getBoundingClientRect();
			return { top: bounds.top, right: innerWidth - bounds.right, width: bounds.width, height: bounds.height };
		});
		expect(geometry).toEqual({ top: 16, right, width: 96, height: 44 });
	}
}

async function openParent(page) {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
}

test("parent screens share navigation and Back returns one level", async ({ page }) => {
	await openParent(page);
	await verifyNavigation(page, null, "parent-screen-back-button-parent");
	await page.getByRole("button", { name: "Student Edits", exact: true }).click();
	await verifyNavigation(page, "student-edits-screen-home-button", "student-edits-screen-back-button");
	await page.getByRole("button", { name: "Open Blocks menu" }).click();
	await verifyNavigation(page, "blocks-screen-home-button", "blocks-screen-back-button");
	await page.getByRole("button", { name: "Toggle Description Edits" }).click();
	await page.locator("#blocks-screen-back-button").click();
	await expect(page.locator("#description-edits-position-wrapper")).toHaveCount(0);
	await expect(page.locator("#blocks-menu-sidebar")).toBeVisible();
	await page.locator("#blocks-screen-back-button").click();
	await expect(page.locator("#blocks-menu-sidebar")).toHaveCount(0);
	await verifyNavigation(page, "student-edits-screen-home-button", "student-edits-screen-back-button");
	await page.getByRole("button", { name: "Open Curriculum Game" }).click();
	await verifyNavigation(page, "curriculum-game-screen-home-button", "curriculum-game-screen-back-button");
	await page.locator("#curriculum-game-screen-back-button").click();
	await expect(page.locator("#student-edits-screen")).toBeVisible();
	await page.locator("#student-edits-screen-home-button").click();
	await expect(page.getByRole("button", { name: "Open parent section" })).toBeVisible();
});

test("Text Editor and Grid controls keep the correct Back", async ({ page }) => {
	await openParent(page);
	await page.getByRole("button", { name: "Text Editor", exact: true }).click();
	await verifyNavigation(page, "text-editor-home-button", "parent-screen-back-button");
	await page.locator("#text-editor-grid-button").click();
	await page.locator("#grid-applied-button").click();
	await verifyNavigation(page, "text-editor-home-button", "parent-screen-back-button");
	await expect(page.locator("#grid-menu-selection-prompt")).toHaveCount(0);
	await page.locator("#text-editor-template-new-button").click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await verifyNavigation(page, "text-editor-workflow-home-button", "text-editor-workflow-back-button");
	await page.locator("#grid-shape-option-4").click();
	await verifyNavigation(page, "text-editor-workflow-home-button", "grid-menu-quadrilateral-prompt-back-button");
	await page.locator("#grid-menu-quadrilateral-prompt-back-button").click();
	await page.locator("#text-editor-workflow-back-button").click();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await verifyNavigation(page, "text-editor-home-button", "parent-screen-back-button");
	await page.locator("#parent-screen-back-button").click();
	await expect(page.getByRole("button", { name: "Student Edits", exact: true })).toBeVisible();
});

test("parent Games Back returns game, gallery, sidebar, then Parent", async ({ page }) => {
	await openParent(page);
	await page.getByRole("button", { name: "Games", exact: true }).click();
	await page.getByRole("button", { name: "Math", exact: true }).click();
	await verifyNavigation(page, null, "parent-screen-back-button-parent");
	await page.locator("#math-game-place-names").click();
	await verifyNavigation(page, null, "math-games-back-to-gallery-button");
	await page.locator("#math-games-back-to-gallery-button").click();
	await page.locator("#parent-screen-back-button-parent").click();
	await expect(page.locator("#math-games-view")).toHaveCount(0);
	await expect(page.locator("#games-sidebar-panel")).toBeVisible();
	await page.locator("#parent-screen-back-button-parent").click();
	await expect(page.locator("#games-sidebar-panel")).toHaveCount(0);
	await page.locator("#parent-screen-back-button-parent").click();
	await expect(page.getByRole("button", { name: "Open parent section" })).toBeVisible();
});

test("student, Progress, Rewards, calendar pages and games share navigation", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await verifyNavigation(page, null, "student-menu-back-button");
	await page.locator("#calendar-next-month-button").click();
	await verifyNavigation(page, null, "calendar-previous-month-button");
	await page.locator("#calendar-previous-month-button").click();
	await verifyNavigation(page, null, "student-menu-back-button");
	await page.getByRole("button", { name: "Open Progress tab" }).click();
	await verifyNavigation(page, "student-progress-home-button", "student-progress-back-button");
	await page.locator("#student-progress-back-button").click();
	await page.getByRole("button", { name: "Open Rewards tab" }).click();
	await verifyNavigation(page, null, "rewards-page-back-button");
	await page.locator("#rewards-page-back-button").click();
	await page.getByRole("button", { name: "Open Games tab" }).click();
	await verifyNavigation(page, null, "student-math-games-back-button");
	await page.locator("#math-game-place-names").click();
	await verifyNavigation(page, null, "math-games-back-to-gallery-button");
	await page.locator("#math-games-back-to-gallery-button").click();
	await page.locator("#student-math-games-back-button").click();
	await verifyNavigation(page, null, "student-menu-back-button");
	await page.getByRole("button", { name: "Open Progress tab" }).click();
	await page.locator("#student-progress-home-button").click();
	await expect(page.getByRole("button", { name: "Open student section" })).toBeVisible();
});

test("Daily subjects and Story return one screen while Home exits to the home page", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	const day = page.locator("#calendar-day-cell-October-2026-7");
	await day.click();
	await expect(day).toHaveClass(/calendar-day-cell--exploding/);
	await expect(day).toBeEnabled();
	await day.click();
	await expect(page.locator("#daily-menu-panel")).toBeVisible();
	await verifyNavigation(page, "daily-menu-home-button", "daily-menu-back-button");
	await page.getByRole("button", { name: "Math", exact: true }).click();
	await page.locator("#daily-menu-back-button").click();
	await expect(page.locator("#daily-menu-panel")).toBeVisible();
	await expect(page.getByRole("button", { name: "Back to calendar", exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Story", exact: true }).click();
	await verifyNavigation(page, "daily-menu-home-button", "daily-menu-story-back-button");
	await page.locator("#daily-menu-story-back-button").click();
	await page.locator("#daily-menu-back-button").click();
	await expect(page.locator("#daily-menu-panel")).toHaveCount(0);
	await day.click();
	await expect(page.locator("#daily-menu-panel")).toBeVisible();
	await page.locator("#daily-menu-home-button").click();
	await expect(page.getByRole("button", { name: "Open student section" })).toBeVisible();
});

test("Math Curriculum controls match the shared position, styles, and Home destination", async ({ page }) => {
	await openParent(page);
	await page.getByRole("button", { name: "Student Edits", exact: true }).click();
	await page.locator("#blocks-menu-button").click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-edits-play-by-play-button").click();
	await page.locator("#math-curriculum-october-button").click();
	await verifyNavigation(page, "math-curriculum-october-screen-home-button", "math-curriculum-october-screen-back-button");
	await page.locator("#math-curriculum-october-screen-back-button").click();
	await expect(page.locator("#description-edits-position-wrapper")).toBeVisible();
	await page.locator("#description-edits-play-by-play-button").click();
	await page.locator("#math-curriculum-october-button").click();
	await page.locator("#math-curriculum-october-screen-home-button").click();
	await expect(page.getByRole("button", { name: "Open parent section" })).toBeVisible();
});
