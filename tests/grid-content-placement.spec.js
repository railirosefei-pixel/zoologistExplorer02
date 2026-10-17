import { expect, test } from "@playwright/test";

test("Text Confined to Grid keeps text and the caret inside the grid bounds", async ({ page }) => {
	await page.setViewportSize({ width: 2560, height: 1080 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Template", exact: true }).click();

	await page.getByRole("button", { name: "Tools" }).click();
	await page.locator("#text-editor-size-menu-button").click();
	await page.locator("#text-editor-size-width").fill("0.75");
	await page.locator("#text-editor-size-height").fill("0.75");
	await page.locator("#text-editor-grid-button").click();
	await page.getByRole("button", { name: "Grid Applied: Off" }).click();
	await page.locator("#grid-menu-content-placement-dropdown summary").click();
	const confinedToGridButton = page.locator("#grid-menu-confine-text-to-grid-button");
	const confinedToShapesButton = page.locator(
		"#grid-menu-confine-text-to-grid-shapes-button",
	);
	await confinedToShapesButton.click();
	await expect(confinedToShapesButton).toHaveAttribute("aria-pressed", "true");
	await expect(confinedToGridButton).toHaveAttribute("aria-pressed", "false");
	await confinedToGridButton.click();
	await expect(confinedToGridButton).toHaveAttribute("aria-pressed", "true");
	await expect(confinedToShapesButton).toHaveAttribute("aria-pressed", "false");

	const editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toHaveClass(/print-preview-paper-editor--confined-to-grid/);
	await expect(editor).toBeFocused();
	const initialGeometry = await editor.evaluate((element) => {
		const editorBounds = element.getBoundingClientRect();
		const paperBounds = element.parentElement.getBoundingClientRect();
		const selection = window.getSelection();
		return {
			editorBounds: {
				left: editorBounds.left,
				top: editorBounds.top,
				right: editorBounds.right,
				bottom: editorBounds.bottom,
			},
			paperBounds: {
				left: paperBounds.left,
				top: paperBounds.top,
			},
			caretAtEditorStart:
				selection.isCollapsed &&
				selection.anchorNode === element &&
				selection.anchorOffset === 0,
		};
	});
	expect(initialGeometry.editorBounds.left).toBe(initialGeometry.paperBounds.left);
	expect(initialGeometry.editorBounds.top).toBe(initialGeometry.paperBounds.top);
	expect(initialGeometry.caretAtEditorStart).toBe(true);

	const attemptedText = "x".repeat(80);
	await editor.pressSequentially(attemptedText);
	const textAfterOverflowAttempt = await editor.textContent();
	expect(textAfterOverflowAttempt.length).toBeGreaterThan(0);
	expect(textAfterOverflowAttempt.length).toBeLessThan(attemptedText.length);
	const visibleLineBounds = await editor.evaluate((element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		const editorBounds = element.getBoundingClientRect();
		return [...range.getClientRects()].map((bounds) => ({
			insideLeft: bounds.left >= editorBounds.left,
			insideRight: bounds.right <= editorBounds.right,
			insideTop: bounds.top >= editorBounds.top,
			insideBottom: bounds.bottom <= editorBounds.bottom,
		}));
	});
	expect(visibleLineBounds.length).toBeGreaterThan(0);
	expect(visibleLineBounds.every((bounds) => Object.values(bounds).every(Boolean))).toBe(true);

	await editor.pressSequentially("overflow");
	await expect(editor).toHaveText(textAfterOverflowAttempt);
});

test("Text Confined to Grid Shapes selects and confines text to one shape", async ({ page }) => {
	await page.setViewportSize({ width: 2560, height: 1080 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Template", exact: true }).click();

	await page.getByRole("button", { name: "Tools" }).click();
	await page.locator("#text-editor-size-menu-button").click();
	await page.locator("#text-editor-size-width").fill("0.75");
	await page.locator("#text-editor-size-height").fill("0.75");
	await page.locator("#text-editor-grid-button").click();
	await page.getByRole("button", { name: "Grid Applied: Off" }).click();
	await page.locator("#grid-menu-content-placement-dropdown summary").click();
	const confinedToGridButton = page.locator("#grid-menu-confine-text-to-grid-button");
	const confinedToShapesButton = page.locator(
		"#grid-menu-confine-text-to-grid-shapes-button",
	);
	await confinedToGridButton.click();
	await expect(confinedToGridButton).toHaveAttribute("aria-pressed", "true");
	await confinedToShapesButton.click();
	await expect(confinedToGridButton).toHaveAttribute("aria-pressed", "false");
	await expect(confinedToShapesButton).toHaveAttribute("aria-pressed", "true");
	const shapeEditorPadding = await page
		.locator(".print-preview-paper-editor--confined-to-grid-shape")
		.evaluateAll((elements) =>
			elements.map((element) => getComputedStyle(element).paddingLeft),
		);
	expect(shapeEditorPadding.length).toBeGreaterThan(0);
	expect(shapeEditorPadding.every((padding) => padding === "2px")).toBe(true);

	const editor = page.locator(
		'.print-preview-paper-editor--confined-to-grid-shape[data-grid-shape-key="base-0-0"]',
	);
	await expect(editor).toHaveClass(/print-preview-paper-editor--confined-to-grid-shape/);
	await expect(editor).toBeFocused();
	const initialCellBounds = await editor.evaluate((element) => {
		const editorBounds = element.getBoundingClientRect();
		const paperBounds = element.parentElement.getBoundingClientRect();
		const selection = window.getSelection();
		return {
			leftOffset: editorBounds.left - paperBounds.left,
			topOffset: editorBounds.top - paperBounds.top,
			width: editorBounds.width,
			height: editorBounds.height,
			caretAtEditorStart:
				selection.isCollapsed &&
				selection.anchorNode === element &&
				selection.anchorOffset === 0,
		};
	});
	expect(initialCellBounds.leftOffset).toBe(0);
	expect(initialCellBounds.topOffset).toBe(0);
	expect(initialCellBounds.width).toBeGreaterThan(0);
	expect(initialCellBounds.height).toBeGreaterThan(0);
	expect(initialCellBounds.caretAtEditorStart).toBe(true);
	await editor.fill("I I");
	await expect(editor).toHaveText("I I");
	const whitespacePoint = await editor.evaluate((element) => {
		const textNode = element.firstChild;
		const range = document.createRange();
		range.setStart(textNode, 1);
		range.setEnd(textNode, 2);
		const bounds = range.getBoundingClientRect();
		return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
	});
	await page.mouse.click(whitespacePoint.x, whitespacePoint.y);
	const whitespaceCaret = await editor.evaluate(() => {
		const selection = window.getSelection();
		return {
			collapsed: selection.isCollapsed,
			text: selection.anchorNode.textContent,
			offset: selection.anchorOffset,
		};
	});
	expect(whitespaceCaret).toMatchObject({ collapsed: true, text: "I I" });
	expect([1, 2]).toContain(whitespaceCaret.offset);
	const trailingSpacePoint = await editor.evaluate((element) => {
		const textNode = element.firstChild;
		const range = document.createRange();
		range.setStart(textNode, 2);
		range.setEnd(textNode, 3);
		const characterBounds = range.getBoundingClientRect();
		const editorBounds = element.getBoundingClientRect();
		return {
			x: Math.min(characterBounds.right + 3, editorBounds.right - 1),
			y: characterBounds.top + characterBounds.height / 2,
		};
	});
	await page.mouse.click(trailingSpacePoint.x, trailingSpacePoint.y);
	const trailingSpaceCaret = await editor.evaluate(() => {
		const selection = window.getSelection();
		return {
			collapsed: selection.isCollapsed,
			text: selection.anchorNode.textContent,
			offset: selection.anchorOffset,
		};
	});
	expect(trailingSpaceCaret).toEqual({ collapsed: true, text: "I I", offset: 3 });

	const grid = page.locator("#print-preview-grid");
	const secondCellCenter = await grid.evaluate((element) => {
		const bounds = element.getBoundingClientRect();
		return { x: bounds.left + bounds.width * 0.625, y: bounds.top + bounds.height / 6 };
	});
	await page.mouse.click(secondCellCenter.x, secondCellCenter.y);
	const secondEditor = page.locator(
		'.print-preview-paper-editor--confined-to-grid-shape[data-grid-shape-key="base-0-2"]',
	);
	await expect(secondEditor).toBeFocused();
	await expect
		.poll(() =>
			secondEditor.evaluate(
				(element) =>
					element.getBoundingClientRect().left -
					element.parentElement.getBoundingClientRect().left,
			),
		)
		.toBeGreaterThan(initialCellBounds.leftOffset);
	const selectedCellBounds = await secondEditor.evaluate((element) => {
		const editorBounds = element.getBoundingClientRect();
		const paperBounds = element.parentElement.getBoundingClientRect();
		const selection = window.getSelection();
		return {
			leftOffset: editorBounds.left - paperBounds.left,
			width: editorBounds.width,
			height: editorBounds.height,
			caretAtEditorStart:
				selection.isCollapsed &&
				selection.anchorNode === element &&
				selection.anchorOffset === 0,
		};
	});
	expect(selectedCellBounds.caretAtEditorStart).toBe(true);
	expect(selectedCellBounds.width).toBe(initialCellBounds.width);
	expect(selectedCellBounds.height).toBe(initialCellBounds.height);
	await expect(editor).toHaveText("I I");

	await secondEditor.pressSequentially("x".repeat(40));
	const textAfterShapeOverflowAttempt = await secondEditor.textContent();
	expect(textAfterShapeOverflowAttempt.length).toBeGreaterThan(0);
	expect(textAfterShapeOverflowAttempt.length).toBeLessThan(40);
	await expect(editor).toHaveText("I I");
	await secondEditor.pressSequentially("overflow");
	await expect(secondEditor).toHaveText(textAfterShapeOverflowAttempt);
});
