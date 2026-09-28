import { test, expect } from "@playwright/test";

test("Raili resize commit persists across reload and commit button does not scale", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1600, height: 1000 });
	await page.goto("/");

	// Enable Explorer Positions mode: Parent → Student Edits → Curriculum Game → Explorer Positions toggle
	await page.click("#parent-button");
	await page.click("#student-edits-tab");
	await page.click("#curriculum-game-button");
	await page.click("#explorer-positions-button");
	await page.click("#curriculum-game-screen-home-button");

	// Enter student menu via the Home screen Student button
	await page.click("#student-button");

	// Open the Progress tab
	const progressTab = page.locator("#progress-tab");
	await expect(progressTab).toBeVisible({ timeout: 10000 });
	await progressTab.click();

	const resizeButton = page.locator("#student-progress-resize-button");
	await expect(resizeButton).toBeVisible({ timeout: 10000 });

	await resizeButton.click();

	const commitButton = page.locator("#student-progress-resize-commit-button");
	await expect(commitButton).toBeVisible();

	const buttonHeightBefore = (await commitButton.boundingBox()).height;

	const img = page.locator(".student-progress-raili-image");
	const imgHeightBefore = (await img.boundingBox()).height;

	// Drag the NW resize handle upward to grow the asset (SE handle anchors off-viewport bottom-right)
	const handle = page.locator("#student-progress-raili-resize-handle-nw");
	const handleBox = await handle.boundingBox();
	await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
	await page.mouse.down();
	await page.mouse.move(
		handleBox.x + handleBox.width / 2,
		handleBox.y + handleBox.height / 2 - 120,
		{ steps: 5 },
	);
	await page.mouse.up();

	const imgHeightAfter = (await img.boundingBox()).height;
	const buttonHeightAfterResize = (await commitButton.boundingBox()).height;

	// Step 1 assertion: commit button size must NOT change with the resize
	expect(buttonHeightAfterResize).toBeCloseTo(buttonHeightBefore, 0);
	// Sanity: the image did grow
	expect(imgHeightAfter).toBeGreaterThan(imgHeightBefore);

	// Commit
	await commitButton.click();
	const stored = await page.evaluate(() =>
		localStorage.getItem("ze2.studentProgress.railiHeightPx"),
	);
	expect(Number(stored)).toBeGreaterThan(0);
	expect(Number(stored)).toBeCloseTo(Math.round(imgHeightAfter), -1);

	// Reload and verify persistence (reload returns to Home; re-enter student menu → Progress)
	await page.reload();
	await page.click("#student-button");
	await page.locator("#progress-tab").click();
	const imgAfterReload = page.locator(".student-progress-raili-image");
	const imgHeightReloaded = (await imgAfterReload.boundingBox()).height;
	expect(imgHeightReloaded).toBeCloseTo(imgHeightAfter, 0);
});
