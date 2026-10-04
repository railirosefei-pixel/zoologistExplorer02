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
	const blockEditsButton = page.getByRole("button", { name: "Toggle Block Edits" });
	await blockEditsButton.click();
	await expect(blockEditsButton).toHaveAttribute("aria-pressed", "true");
	await expect(blockEditsButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");
	const activeShadow = await blockEditsButton.evaluate((button) => getComputedStyle(button).boxShadow);
	expect(activeShadow).toContain("0, 255, 64");

	const panels = page.locator(".block-edits-panel");
	await expect(panels).toHaveCount(5);
	const panelCount = await panels.count();
	expect(panelCount).toBe(5);

	const uniqueDates = await page
		.locator(".block-edits-panel-date")
		.evaluateAll((elements) => elements.map((element) => element.textContent.trim()));
	expect(uniqueDates).toHaveLength(5);
	expect(uniqueDates.every((date) => date.length > 0)).toBeTruthy();

	await blockEditsButton.click();
	await expect(blockEditsButton).toHaveAttribute("aria-pressed", "false");
	await expect(panels).toHaveCount(0);
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

test("Text Editor calibration bar keeps its width and anchored resize behavior", async ({
	page,
}) => {
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
	await commitButton.focus();
	await commitButton.press("Enter");
	await expect(counter).toContainText("10.00 cm");
	await expect(counter).toContainText("500 px");

	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Calibrate" }).click();
	await expect(counter).toContainText("10.00 cm");
});

test("Fonts menu stays above active Size and Margins menus", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.getByRole("button", { name: "Tools" }).click();

	const fontsButton = page.locator("#text-editor-fonts-button");
	const sizeButton = page.locator("#text-editor-size-menu-button");
	const fontStylesButton = page.locator("#text-editor-font-styles-button");
	const getPressedStyles = async (button) =>
		button.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				backgroundColor: style.backgroundColor,
				borderColor: style.borderColor,
				transform: style.transform,
				boxShadow: style.boxShadow,
			};
		});
	await sizeButton.click();
	await expect(sizeButton).toHaveAttribute("aria-pressed", "true");
	const sizePanelStyles = await page.locator("#text-editor-size-panel").evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			borderRadius: style.borderRadius,
			backgroundColor: style.backgroundColor,
			boxShadow: style.boxShadow,
		};
	});
	const fontsPanel = page.locator("#text-editor-fonts-panel");
	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "true");
	await fontStylesButton.click();
	const fontStylesPressed = await getPressedStyles(fontStylesButton);
	expect(await getPressedStyles(sizeButton)).toEqual(fontStylesPressed);
	expect(await getPressedStyles(fontsButton)).toEqual(fontStylesPressed);
	await fontStylesButton.click();
	const fontsToSizeGap = await page.evaluate(() => {
		const size = document.querySelector("#text-editor-size-panel").getBoundingClientRect();
		const fonts = document.querySelector("#text-editor-fonts-panel").getBoundingClientRect();
		return size.top - fonts.bottom;
	});
	expect(fontsToSizeGap).toBe(16);
	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "false");
	await sizeButton.click();
	await expect(sizeButton).toHaveAttribute("aria-pressed", "false");
	const fontsButtonBackground = await fontsButton.evaluate(
		(button) => getComputedStyle(button).backgroundImage,
	);

	await expect(fontsPanel).toHaveCount(0);
	const marginsButton = page.locator("#text-editor-margins-button");
	await marginsButton.click();
	await expect(marginsButton).toHaveAttribute("aria-pressed", "true");
	await expect(marginsButton).toHaveCSS("background-color", "rgb(88, 191, 255)");
	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "true");
	await fontStylesButton.click();
	const marginFontStylesPressed = await getPressedStyles(fontStylesButton);
	expect(await getPressedStyles(marginsButton)).toEqual(marginFontStylesPressed);
	expect(await getPressedStyles(fontsButton)).toEqual(marginFontStylesPressed);
	await fontStylesButton.click();
	const fontsToMarginsGap = await page.evaluate(() => {
		const margins = document.querySelector("#text-editor-margins-panel").getBoundingClientRect();
		const fonts = document.querySelector("#text-editor-fonts-panel").getBoundingClientRect();
		return margins.top - fonts.bottom;
	});
	expect(fontsToMarginsGap).toBe(16);
	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "false");
	await marginsButton.click();
	await expect(marginsButton).toHaveAttribute("aria-pressed", "false");
	await sizeButton.click();
	await marginsButton.click();
	await fontsButton.click();
	const stackedFontsToSizeAndMarginsGaps = await page.evaluate(() => {
		const margins = document.querySelector("#text-editor-margins-panel").getBoundingClientRect();
		const fonts = document.querySelector("#text-editor-fonts-panel").getBoundingClientRect();
		const size = document.querySelector("#text-editor-size-panel").getBoundingClientRect();
		return {
			fontsToSize: size.top - fonts.bottom,
			sizeToMargins: margins.top - size.bottom,
		};
	});
	expect(stackedFontsToSizeAndMarginsGaps).toEqual({ fontsToSize: 16, sizeToMargins: 16 });
	await fontsButton.click();
	await marginsButton.click();
	await sizeButton.click();
	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "true");
	await expect(fontsPanel).toBeVisible();
	for (const label of ["Font Styles", "Font Color", "Font Size"]) {
		await expect(fontsPanel.getByRole("button", { name: label, exact: true })).toBeVisible();
	}
	const panelStyles = await fontsPanel.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			borderRadius: style.borderRadius,
			backgroundColor: style.backgroundColor,
			boxShadow: style.boxShadow,
		};
	});
	expect(panelStyles).toEqual(sizePanelStyles);
	const buttonMetrics = await fontsPanel.evaluate((element, fontsButtonBackground) => {
		const panel = element.getBoundingClientRect();
		const buttons = [...element.querySelectorAll("[data-font-option]")];
		const buttonBounds = buttons.map((button) => button.getBoundingClientRect());
		const buttonStyles = buttons.map((button) => getComputedStyle(button));
		const toolsPanel = document.querySelector("#text-editor-tools-panel").getBoundingClientRect();
		return {
			panel: {
				horizontalOffset: panel.left - toolsPanel.left,
				verticalGap: panel.top - toolsPanel.bottom,
				width: panel.width,
				height: panel.height,
			},
			buttons: buttonBounds.map((bounds, index) => ({
				leftGap: bounds.left - panel.left,
				top: bounds.top,
				width: bounds.width,
				height: bounds.height,
				backgroundImage: buttonStyles[index].backgroundImage,
				boxShadow: buttonStyles[index].boxShadow,
				borderRadius: buttonStyles[index].borderRadius,
			})),
			verticalGaps: [
				buttonBounds[1].top - buttonBounds[0].bottom,
				buttonBounds[2].top - buttonBounds[1].bottom,
			],
			firstTopGap: buttonBounds[0].top - panel.top,
			lastBottomGap: panel.bottom - buttonBounds[2].bottom,
			fontsButtonBackground,
		};
	}, fontsButtonBackground);
	expect(buttonMetrics.panel).toEqual({
		horizontalOffset: 0,
		verticalGap: 16,
		width: 288,
		height: 256,
	});
	expect(buttonMetrics.buttons.map(({ leftGap, width, height, borderRadius }) => ({
		leftGap,
		width,
		height,
		borderRadius,
	}))).toEqual(Array(3).fill({ leftGap: 16, width: 256, height: 64, borderRadius: "999px" }));
	expect(buttonMetrics.firstTopGap).toBe(16);
	expect(buttonMetrics.verticalGaps).toEqual([16, 16]);
	expect(buttonMetrics.lastBottomGap).toBe(16);
	expect(buttonMetrics.buttons[0].backgroundImage).toBe(buttonMetrics.fontsButtonBackground);
	const colorStops = buttonMetrics.buttons.map(({ backgroundImage }) =>
		[...backgroundImage.matchAll(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g)].map((match) =>
			match.slice(1).map(Number),
		),
	);
	expect(colorStops.map((stops) => stops.length)).toEqual([3, 3, 3]);
	for (let buttonIndex = 1; buttonIndex < colorStops.length; buttonIndex += 1) {
		for (let stopIndex = 0; stopIndex < colorStops[buttonIndex].length; stopIndex += 1) {
			for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
				expect(colorStops[buttonIndex][stopIndex][channelIndex]).toBeGreaterThan(
					colorStops[buttonIndex - 1][stopIndex][channelIndex],
				);
			}
		}
	}

	await page.getByRole("button", { name: "New +", exact: true }).click();
	const shellButtonMetrics = await page.locator("#text-editor-new-create-shell-button").evaluate((button) => {
		const style = getComputedStyle(button);
		const bounds = button.getBoundingClientRect();
		return {
			width: bounds.width,
			height: bounds.height,
			borderRadius: style.borderRadius,
			fontFamily: style.fontFamily,
			fontSize: style.fontSize,
			fontWeight: style.fontWeight,
			boxShadow: style.boxShadow,
		};
	});
	const fontButtonMetrics = await fontsPanel.locator("[data-font-option]").evaluateAll((buttons) =>
		buttons.map((button) => {
			const style = getComputedStyle(button);
			const bounds = button.getBoundingClientRect();
			return {
				width: bounds.width,
				height: bounds.height,
				borderRadius: style.borderRadius,
				fontFamily: style.fontFamily,
				fontSize: style.fontSize,
				fontWeight: style.fontWeight,
				boxShadow: style.boxShadow,
			};
		}),
	);
	const normalizeShadow = (shadow) =>
		shadow.replace(/rgba?\([^)]*\)|#[\da-f]{3,8}/gi, "<color>");
	for (const button of fontButtonMetrics) {
		expect(button.width).toBe(shellButtonMetrics.width);
		expect(button.height).toBe(shellButtonMetrics.height);
		expect(button.borderRadius).toBe(shellButtonMetrics.borderRadius);
		expect(button.fontFamily).toBe(shellButtonMetrics.fontFamily);
		expect(button.fontSize).toBe(shellButtonMetrics.fontSize);
		expect(button.fontWeight).toBe(shellButtonMetrics.fontWeight);
		expect(normalizeShadow(button.boxShadow)).toBe(normalizeShadow(shellButtonMetrics.boxShadow));
	}
	await page.getByRole("button", { name: "New +", exact: true }).click();

	const geometry = await fontsPanel.evaluate((element) => {
		const panel = element.getBoundingClientRect();
		const toolsPanel = document.querySelector("#text-editor-tools-panel").getBoundingClientRect();
		return {
			horizontalOffset: panel.left - toolsPanel.left,
			verticalGap: panel.top - toolsPanel.bottom,
			width: panel.width,
			height: panel.height,
		};
	});
	expect(geometry).toEqual({
		horizontalOffset: 0,
		verticalGap: 16,
		width: 288,
		height: 256,
	});

	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "false");
	await expect(fontsPanel).toHaveCount(0);
});

test("Size menu defaults to inches for both dimensions", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	const paperEditor = page.locator(".print-preview-paper-editor");
	await expect(paperEditor).toHaveAttribute("contenteditable", "false");
	await page.keyboard.type("Paper text");
	await expect(paperEditor).toBeEmpty();
	await page.getByRole("button", { name: "Tools" }).click();
	const toolsPanel = page.locator("#text-editor-tools-panel");
	const toolsBounds = await toolsPanel.boundingBox();
	await page.getByRole("button", { name: "Size" }).click();
	const sizePanel = page.locator("#text-editor-size-panel");
	const [sizeBounds, matchingFrameStyles] = await Promise.all([
		sizePanel.boundingBox(),
		page.evaluate(() => {
			const tools = getComputedStyle(document.querySelector("#text-editor-tools-panel"));
			const panelElement = document.querySelector("#text-editor-size-panel");
			const panel = panelElement.getBoundingClientRect();
			const size = getComputedStyle(panelElement);
			const widthLabel = document
				.querySelector("#text-editor-size-width-label")
				.getBoundingClientRect();
			const heightLabel = document
				.querySelector("#text-editor-size-height-label")
				.getBoundingClientRect();
			return {
				matchingFrameStyles: ["borderRadius", "backgroundColor", "boxShadow"].every(
					(property) => tools[property] === size[property],
				),
				widthLabelLeftGap: widthLabel.left - panel.left,
				widthLabelTopGap: widthLabel.top - panel.top,
				heightLabelBottomGap: panel.bottom - heightLabel.bottom,
			};
		}),
	]);
	expect(sizeBounds.width).toBe(toolsBounds.width);
	expect(sizeBounds.y - toolsBounds.y - toolsBounds.height).toBe(16);
	expect(matchingFrameStyles.matchingFrameStyles).toBe(true);
	expect(matchingFrameStyles.widthLabelLeftGap).toBe(16);
	expect(matchingFrameStyles.widthLabelTopGap).toBe(16);
	expect(matchingFrameStyles.heightLabelBottomGap).toBe(16);

	await expect(page.locator("#text-editor-size-width")).toHaveValue("8.5");
	await expect(page.locator("#text-editor-size-height")).toHaveValue("11");
	await expect(page.locator("#text-editor-size-width-unit")).toHaveText("in");
	await expect(page.locator("#text-editor-size-height-unit")).toHaveText("in");
});

test("Margins menu matches the Tools frame below Tools or Size", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.getByRole("button", { name: "Tools" }).click();

	const toolsPanel = page.locator("#text-editor-tools-panel");
	const toolsBounds = await toolsPanel.boundingBox();
	const marginsButton = page.locator("#text-editor-margins-button");
	await marginsButton.click();
	const marginsPanel = page.locator("#text-editor-margins-panel");
	let marginsBounds = await marginsPanel.boundingBox();
	expect(marginsBounds.width).toBe(toolsBounds.width);
	expect(marginsBounds.height).toBe(toolsBounds.height);
	expect(marginsBounds.y - toolsBounds.y - toolsBounds.height).toBe(16);

	await marginsButton.click();
	await page.locator("#text-editor-size-menu-button").click();
	const sizeBounds = await page.locator("#text-editor-size-panel").boundingBox();
	await marginsButton.click();
	marginsBounds = await marginsPanel.boundingBox();
	expect(marginsBounds.y - sizeBounds.y - sizeBounds.height).toBe(16);

	const matchingFrameStyles = await page.evaluate(() => {
		const tools = getComputedStyle(document.querySelector("#text-editor-tools-panel"));
		const margins = getComputedStyle(document.querySelector("#text-editor-margins-panel"));
		return ["borderRadius", "backgroundColor", "boxShadow"].every(
			(property) => tools[property] === margins[property],
		);
	});
	expect(matchingFrameStyles).toBe(true);
});

test("Margins create numeric paper insets, toggle guides, and restore with saved shells", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.getByRole("button", { name: "Tools" }).click();
	await page.locator("#text-editor-margins-button").click();

	const marginFields = {
		top: page.locator("#text-editor-margin-top-input"),
		bottom: page.locator("#text-editor-margin-bottom-input"),
		left: page.locator("#text-editor-margin-left-input"),
		right: page.locator("#text-editor-margin-right-input"),
	};
	const allSidesInput = page.locator("#text-editor-margin-all-sides-input");
	await expect(page.locator("#text-editor-margins-panel")).toContainText(
		"TopBottomLeftRightAll SidesMargin Visibility",
	);
	await expect(page.locator("#text-editor-margin-visibility-button")).toHaveText("On");
	await allSidesInput.fill("18.5");
	for (const input of Object.values(marginFields)) {
		await expect(input).toHaveValue("18.5");
	}
	await marginFields.top.fill("a12");
	await expect(marginFields.top).toHaveValue("12");
	await marginFields.top.fill("12.5");
	await marginFields.bottom.fill("6");
	await marginFields.left.fill("8");
	await marginFields.right.fill("9");

	const paper = page.locator("#print-preview-paper");
	const editorInsets = await page.locator(".print-preview-paper-editor").evaluate((editor) => {
		const styles = getComputedStyle(editor);
		return { top: styles.top, right: styles.right, bottom: styles.bottom, left: styles.left };
	});
	expect(editorInsets).toEqual({ top: "12.5px", right: "9px", bottom: "6px", left: "8px" });
	await expect(page.locator(".print-preview-margin-guide")).toHaveCount(4);
	const visibilityButton = page.locator("#text-editor-margin-visibility-button");
	await expect(visibilityButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	await visibilityButton.click();
	await expect(visibilityButton).toHaveText("Off");
	await expect(visibilityButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	await expect(page.locator(".print-preview-margin-guide")).toHaveCount(0);
	await visibilityButton.click();
	await expect(page.locator(".print-preview-margin-guide")).toHaveCount(4);

	await page.locator("#text-editor-template-save-button").click();
	await page.locator("#text-editor-template-name-input").fill("Margins test shell");
	await page.getByRole("button", { name: "Save Template" }).click();
	const savedMargins = await page.evaluate(() => {
		const entries = JSON.parse(window.localStorage.getItem("ze2.textEditor.savedTemplates"));
		return entries.at(-1).template;
	});
	expect(savedMargins.marginValues).toEqual({ top: "12.5", bottom: "6", left: "8", right: "9" });
	expect(savedMargins.marginVisibility).toBe(true);

	await page.reload();
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-load-button").click();
	await page.getByRole("button", { name: "Load Shells", exact: true }).click();
	await page.getByRole("button", { name: "Margins test shell", exact: true }).click();
	await page.getByRole("button", { name: "Tools" }).click();
	await page.locator("#text-editor-margins-button").click();
	for (const [field, input] of Object.entries(marginFields)) {
		await expect(input).toHaveValue({ top: "12.5", bottom: "6", left: "8", right: "9" }[field]);
	}
	await expect(visibilityButton).toHaveText("On");
	await expect(page.locator(".print-preview-margin-guide")).toHaveCount(4);
	await expect(paper).toBeVisible();
});

test("Margins inset the selected editable template", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Template", exact: true }).click();
	const editor = page.locator(".print-preview-paper-editor");
	const hasFocusedCaret = await editor.evaluate((element) => {
		const selection = window.getSelection();
		return (
			document.activeElement === element &&
			selection?.isCollapsed &&
			element.contains(selection.anchorNode)
		);
	});
	expect(hasFocusedCaret).toBe(true);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.locator("#text-editor-margins-button").click();
	await page.locator("#text-editor-margin-all-sides-input").fill("16.5");

	await expect(editor).toHaveAttribute("contenteditable", "true");
	const editorInsets = await editor.evaluate((element) => {
		const styles = getComputedStyle(element);
		return {
			top: styles.top,
			right: styles.right,
			bottom: styles.bottom,
			left: styles.left,
			paddingLeft: styles.paddingLeft,
		};
	});
	expect(editorInsets).toEqual({
		top: "16.5px",
		right: "16.5px",
		bottom: "16.5px",
		left: "16.5px",
		paddingLeft: "2px",
	});

	await editor.click();
	await editor.pressSequentially("First line");
	await editor.press("Enter");
	await editor.pressSequentially("Second line");
	await expect(editor).toContainText("First line");
	await expect(editor).toContainText("Second line");
	const lineStartOffsets = await editor.evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const offsets = [];
		let textNode;
		while ((textNode = walker.nextNode())) {
			if (textNode.textContent.length > 0) {
				const range = document.createRange();
				range.setStart(textNode, 0);
				range.setEnd(textNode, 1);
				offsets.push(range.getBoundingClientRect().left - element.getBoundingClientRect().left);
			}
		}
		return offsets;
	});
	expect(lineStartOffsets).toHaveLength(2);
	for (const offset of lineStartOffsets) {
		expect(offset).toBeGreaterThan(0.5);
	}
	await expect(page.locator(".print-preview-margin-guide")).toHaveCount(4);
});

test("Print Preview renders the paper template at the Size menu dimensions", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Size" }).click();

	await page.locator("#text-editor-size-width-unit").click();
	await page.locator("#text-editor-size-width-px-option").click();
	await page.locator("#text-editor-size-height-unit").click();
	await page.locator("#text-editor-size-height-px-option").click();
	await page.locator("#text-editor-size-width").fill("100");
	await page.locator("#text-editor-size-height").fill("50");
	await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();

	const paper = page.locator("#print-preview-paper");
	const saveButton = page.locator("#text-editor-template-save-button");
	const viewportBounds = await page.evaluate(() => ({
		width: window.innerWidth,
		height: window.innerHeight,
	}));
	const expectSaveButtonAtViewportCorner = async (bounds) => {
		expect(bounds.x + bounds.width).toBeCloseTo(viewportBounds.width - 16, 1);
		expect(bounds.y + bounds.height).toBeCloseTo(viewportBounds.height - 16, 1);
	};
	const paperBounds = await paper.boundingBox();
	const saveBounds = await saveButton.boundingBox();
	expect(paperBounds.width).toBe(100);
	expect(paperBounds.height).toBe(50);
	await expectSaveButtonAtViewportCorner(saveBounds);

	await page.locator("#text-editor-size-width-unit").click();
	await page.locator("#text-editor-size-width-in-option").click();
	await page.locator("#text-editor-size-height-unit").click();
	await page.locator("#text-editor-size-height-in-option").click();
	await page.locator("#text-editor-size-width").fill("8");
	await page.locator("#text-editor-size-height").fill("10");

	const inchBounds = await paper.boundingBox();
	const inchSaveBounds = await saveButton.boundingBox();
	expect(inchBounds.width).toBeCloseTo(872, 0);
	expect(inchBounds.height).toBeCloseTo(1090, 0);
	await expectSaveButtonAtViewportCorner(inchSaveBounds);

	await page.locator("#text-editor-size-height").fill("12");
	const largeSaveBounds = await saveButton.boundingBox();
	await expectSaveButtonAtViewportCorner(largeSaveBounds);
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
	await page.mouse.move(
		homeBounds.x + homeBounds.width / 2,
		homeBounds.y + homeBounds.height / 2,
	);
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

test("Text Editor navigation bar has 16px button clearance and no red edge", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();

	const navigation = page.locator("#text-editor-navigation-bar");
	const metrics = await navigation.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return {
			top: rect.top,
			left: rect.left,
			right: window.innerWidth - rect.right,
			height: rect.height,
			backgroundColor: style.backgroundColor,
			borderTopWidth: style.borderTopWidth,
			borderTopStyle: style.borderTopStyle,
			borderTopColor: style.borderTopColor,
			borderRadius: style.borderRadius,
			boxShadow: style.boxShadow,
			boxSizing: style.boxSizing,
			buttonTopGap: element.querySelector("button").getBoundingClientRect().top - rect.top,
			buttonBottomGap: rect.bottom - element.querySelector("button").getBoundingClientRect().bottom,
		};
	});

	expect(metrics).toEqual({
		top: 0,
		left: 0,
		right: 0,
		height: 96,
		backgroundColor: "rgb(11, 45, 85)",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: "rgba(0, 0, 0, 0)",
		borderRadius: "0px",
		boxShadow:
			"rgba(255, 255, 255, 0.24) 0px 2px 0px 0px inset, rgba(0, 0, 0, 0.35) 0px -4px 0px 0px inset, rgb(6, 26, 50) 0px 5px 0px 0px, rgba(0, 0, 0, 0.3) 0px 8px 12px 0px",
		boxSizing: "border-box",
		buttonTopGap: 16,
		buttonBottomGap: 16,
	});

});

test("Text Editor Home and Back buttons sit inside the navigation bar", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();

	const metrics = await page.locator("#text-editor-navigation-bar").evaluate((navigation) => {
		const navigationRect = navigation.getBoundingClientRect();
		const homeButton = navigation.querySelector("#text-editor-home-button");
		const backButton = navigation.querySelector("#parent-screen-back-button");
		const homeRect = homeButton.getBoundingClientRect();
		const backRect = backButton.getBoundingClientRect();
		return {
			hasHome: Boolean(homeButton),
			hasBack: Boolean(backButton),
			backRightGap: navigationRect.right - backRect.right,
			homeBackGap: backRect.left - homeRect.right,
			homeCenterOffset: (homeRect.top + homeRect.bottom) / 2 -
				(navigationRect.top + navigationRect.bottom) / 2,
			backCenterOffset: (backRect.top + backRect.bottom) / 2 -
				(navigationRect.top + navigationRect.bottom) / 2,
		};
	});
	expect(metrics).toEqual({
		hasHome: true,
		hasBack: true,
		backRightGap: 16,
		homeBackGap: 16,
		homeCenterOffset: 0,
		backCenterOffset: 0,
	});
});

test("Text Editor navigation controls stay aligned with the New menu", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();

	const navigation = page.locator("#text-editor-navigation-bar");
	const navMetrics = await navigation.evaluate((element) => {
		const navigationRect = element.getBoundingClientRect();
		const buttons = Array.from(element.querySelectorAll("button"));
		return {
			buttonIds: buttons.map((button) => button.id),
			buttons: buttons.map((button) => {
				const rect = button.getBoundingClientRect();
				return {
					left: rect.left,
					right: rect.right,
					top: rect.top,
					width: rect.width,
					height: rect.height,
				};
			}),
			navigationLeft: navigationRect.left,
		};
	});
	expect(navMetrics.buttonIds).toEqual([
		"text-editor-template-load-button",
		"text-editor-template-new-button",
		"text-editor-editing-tools-button",
		"text-editor-grid-button",
		"text-editor-calibrate-button",
		"text-editor-home-button",
		"parent-screen-back-button",
	]);
	const [loadButton, newButtonMetrics, toolsButton, gridButton, calibrateButton] =
		navMetrics.buttons;
	expect(loadButton.left - navMetrics.navigationLeft).toBe(16);
	for (const button of [loadButton, newButtonMetrics, toolsButton, gridButton, calibrateButton]) {
		expect(button.width).toBe(136);
		expect(button.height).toBe(64);
		expect(button.top).toBe(loadButton.top);
	}
	for (const [index, button] of navMetrics.buttons.slice(0, 5).entries()) {
		if (index > 0) {
			expect(button.left - navMetrics.buttons[index - 1].right).toBe(16);
		}
	}

	await page.locator("#text-editor-template-new-button").click();
	await expect(page.locator("#text-editor-new-menu")).toBeVisible();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	const newButton = page.locator("#text-editor-template-new-button");
	await expect(newButton).toHaveAttribute("aria-pressed", "true");
	await page.locator("#text-editor-grid-button").click();
	await expect(page.locator("#text-editor-grid-button")).toHaveAttribute("aria-pressed", "true");
	await newButton.click();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await expect(page.locator("#text-editor-new-menu")).toHaveCount(0);
	await expect(newButton).toHaveAttribute("aria-pressed", "false");
});
