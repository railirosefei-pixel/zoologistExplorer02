import { test, expect } from "@playwright/test";

test("Position reset returns Raili to saved position 1 and persists its offsets", async ({
	page,
}) => {
	await page.addInitScript(() => {
		localStorage.setItem(
			"ze2.studentProgress.railiCommittedPositions",
			JSON.stringify({ 1: { x: 40, y: -25 } }),
		);
		localStorage.setItem("ze2.studentProgress.railiOffsetXPx", "100");
		localStorage.setItem("ze2.studentProgress.railiOffsetYPx", "50");
	});
	await page.goto("/");

	await page.click("#parent-button");
	await page.click("#student-edits-tab");
	await page.click("#curriculum-game-button");
	await page.click("#explorer-positions-button");
	await page.click("#curriculum-game-screen-home-button");
	await page.click("#student-button");
	await page.locator("#progress-tab").click();
	await page.locator("#student-progress-reset-button").click();

	const positionButton = page.locator("#student-progress-reset-position-button");
	await expect(positionButton).toBeEnabled();
	await positionButton.click();

	const frame = page.locator("#student-progress-raili-frame");
	await expect(frame).toHaveCSS("--student-raili-offset-x", "40px");
	await expect(frame).toHaveCSS("--student-raili-offset-y", "-25px");
	await expect
		.poll(() =>
			page.evaluate(() => [
				localStorage.getItem("ze2.studentProgress.railiOffsetXPx"),
				localStorage.getItem("ze2.studentProgress.railiOffsetYPx"),
			]),
		)
		.toEqual(["40", "-25"]);
});

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

	// Reload and verify persistence (reload returns to Home; re-enter student menu → Progress)
	await page.reload();
	await page.click("#student-button");
	await page.locator("#progress-tab").click();
	const imgAfterReload = page.locator(".student-progress-raili-image");
	const imgHeightReloaded = (await imgAfterReload.boundingBox()).height;
	expect(Math.round(imgHeightReloaded)).toBe(Number(stored));
});

test("Progress starts empty and Raili follows the pointer exactly in Move mode", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1600, height: 1000 });
	await page.addInitScript(() => localStorage.clear());
	await page.goto("/");

	await page.click("#parent-button");
	await page.click("#student-edits-tab");
	await page.click("#curriculum-game-button");
	await page.click("#explorer-positions-button");
	await page.click("#curriculum-game-screen-home-button");
	await page.click("#student-button");
	await page.locator("#progress-tab").click();

	await expect(page.locator(".progress-xp-bar-segment--filled")).toHaveCount(0);

	const moveButton = page.locator("#student-progress-move-button");
	await moveButton.click();
	await expect(moveButton).toHaveAttribute("aria-pressed", "true");

	const imageBox = await page.locator(".student-progress-raili-image").boundingBox();
	const startX = imageBox.x + imageBox.width / 2;
	const startY = imageBox.y + imageBox.height / 2;
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(startX + 80, startY - 50, { steps: 4 });

	const frame = page.locator("#student-progress-raili-frame");
	await expect(frame).toHaveCSS("--student-raili-offset-x", "80px");
	await expect(frame).toHaveCSS("--student-raili-offset-y", "-50px");
	await page.mouse.up();
	await expect
		.poll(() =>
			page.evaluate(() => [
				localStorage.getItem("ze2.studentProgress.railiOffsetXPx"),
				localStorage.getItem("ze2.studentProgress.railiOffsetYPx"),
			]),
		)
		.toEqual(["80", "-50"]);
});
