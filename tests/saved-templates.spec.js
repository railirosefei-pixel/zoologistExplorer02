import { test, expect } from "@playwright/test";

test("New and Load menus reject conflicting activation with an illegal-action sound", async ({
	page,
}) => {
	await page.addInitScript(() => {
		window.__illegalActionSoundCount = 0;
		window.AudioContext = class {
			constructor() {
				window.__illegalActionSoundCount += 1;
				this.currentTime = 0;
				this.destination = {};
			}

			createOscillator() {
				return {
					type: "",
					frequency: {
						setValueAtTime() {},
						exponentialRampToValueAtTime() {},
					},
					connect() {},
					addEventListener() {},
					start() {},
					stop() {},
				};
			}

			createGain() {
				return {
					gain: {
						setValueAtTime() {},
						exponentialRampToValueAtTime() {},
					},
					connect() {},
				};
			}

			close() {
				return Promise.resolve();
			}
		};
	});
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.evaluate(() => {
		window.__illegalActionSoundCount = 0;
	});

	const loadButton = page.locator("#text-editor-template-load-button");
	const newButton = page.locator("#text-editor-template-new-button");
	await loadButton.click();
	await newButton.click();
	await expect(loadButton).toHaveAttribute("aria-pressed", "true");
	await expect(newButton).toHaveAttribute("aria-pressed", "false");
	await expect.poll(() => page.evaluate(() => window.__illegalActionSoundCount)).toBe(1);

	await loadButton.click();
	await newButton.click();
	await loadButton.click();
	await expect(loadButton).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#text-editor-new-menu")).toBeVisible();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await expect.poll(() => page.evaluate(() => window.__illegalActionSoundCount)).toBe(2);
});

test("New menu matches the Load menu position with separate identifiers", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();

	const loadButton = page.locator("#text-editor-template-load-button");
	await loadButton.click();
	const loadMenuBox = await page.locator("#text-editor-load-menu").boundingBox();
	await loadButton.click();
	await page.getByRole("button", { name: "New +" }).click();

	const newMenu = page.locator("#text-editor-new-menu");
	await expect(newMenu).toBeVisible();
	const newMenuBox = await newMenu.boundingBox();
	expect(newMenuBox).toEqual(loadMenuBox);
	await expect(
		newMenu.getByRole("button", { name: "Create A Shell", exact: true }),
	).toBeVisible();
	await expect(
		newMenu.getByRole("button", { name: "Create A Template", exact: true }),
	).toBeVisible();
	await expect(newMenu.locator("#text-editor-new-create-shell-button")).toHaveAttribute(
		"class",
		"text-editor-new-create-shell-button",
	);
	await expect(newMenu.locator("#text-editor-new-create-template-button")).toHaveAttribute(
		"class",
		"text-editor-new-create-template-button",
	);
	await expect(page.locator("#text-editor-load-menu")).toHaveCount(0);
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await newMenu.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await expect(newMenu).toHaveCount(0);
	await expect(page.locator("#text-editor-print-preview-panel")).toBeVisible();
});

test("opening New menu does not shift Tools panel in shell or template mode", async ({ page }) => {
	for (const action of ["Create A Shell", "Create A Template"]) {
		await page.goto("./");
		await page.evaluate(() => window.localStorage.clear());
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Text Editor" }).click();
		await page.getByRole("button", { name: "New +" }).click();
		await page.getByRole("button", { name: action, exact: true }).click();
		await page.getByRole("button", { name: "Tools" }).click();

		const newButton = page.locator("#text-editor-template-new-button");
		const toolsPanel = page.locator("#text-editor-tools-panel");
		const toolsPanelMetrics = await toolsPanel.evaluate((panel) => {
			const panelRect = panel.getBoundingClientRect();
			const toolsRect = document
				.querySelector("#text-editor-editing-tools-button")
				.getBoundingClientRect();
			const gridRect = document.querySelector("#text-editor-grid-button").getBoundingClientRect();
			return {
				leftGap: panelRect.left - toolsRect.left,
				rightGap: gridRect.right - panelRect.right,
				width: panelRect.width,
			};
		});
		expect(toolsPanelMetrics).toEqual({ leftGap: 0, rightGap: 0, width: 288 });
		const initialTop = await toolsPanel.evaluate((element) => element.getBoundingClientRect().top);

		await expect(newButton).toHaveAttribute("aria-pressed", "true");
		await newButton.click();
		await expect(newButton).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
		await expect(page.locator("#text-editor-new-menu")).toBeVisible();
		await expect(page.locator("#text-editor-print-preview-panel")).toBeVisible();
		await expect
			.poll(() => toolsPanel.evaluate((element) => element.getBoundingClientRect().top))
			.toBe(initialTop);

		await newButton.click();
		await expect(newButton).toHaveAttribute("aria-pressed", "false");
		await expect(page.locator("#text-editor-new-menu")).toHaveCount(0);
		await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
		await expect
			.poll(() => toolsPanel.evaluate((element) => element.getBoundingClientRect().top))
			.toBe(initialTop);
	}
});

test("New+ can reopen its menu without showing the data-loss confirmation", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();

	const newButton = page.locator("#text-editor-template-new-button");
	const workflowBackButton = page.locator("#text-editor-workflow-back-button");

	for (const optionName of ["Create A Shell", "Create A Template"]) {
		await newButton.click();
		await page.getByRole("button", { name: optionName, exact: true }).click();
		await expect(page.locator("#text-editor-print-preview-panel")).toBeVisible();

		const editor = page.locator(".print-preview-paper-editor");
		await expect(editor).toHaveAttribute(
			"contenteditable",
			optionName === "Create A Shell" ? "false" : "true",
		);

		await expect(newButton).toHaveAttribute("aria-pressed", "true");
		await newButton.click();
		await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
		await expect(page.locator("#text-editor-new-menu")).toBeVisible();
		await expect(newButton).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator("#text-editor-print-preview-panel")).toBeVisible();

		await newButton.click();
		await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
		await expect(newButton).toHaveAttribute("aria-pressed", "false");
		await expect(page.locator("#text-editor-new-menu")).toHaveCount(0);
		await expect(page.locator("#text-editor-print-preview-panel")).toBeVisible();
		await workflowBackButton.click();
		await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
		await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	}
});

test("workflow Back confirms edits to loaded and created shells and templates", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => {
		window.localStorage.setItem(
			"ze2.textEditor.savedTemplates",
			JSON.stringify([
				{
					id: "loaded-template",
					name: "Loaded template",
					createdAt: new Date().toISOString(),
					template: {
						html: "Original template",
						widthValue: "6",
						widthUnit: "in",
						heightValue: "9",
						heightUnit: "in",
						isShell: false,
					},
				},
				{
					id: "loaded-shell",
					name: "Loaded shell",
					createdAt: new Date().toISOString(),
					template: {
						html: "",
						widthValue: "7",
						widthUnit: "in",
						heightValue: "9",
						heightUnit: "in",
						isShell: true,
					},
				},
			]),
		);
	});
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Tools" }).click();

	const backButton = page.locator("#text-editor-workflow-back-button");
	const dialog = page.getByRole("dialog", {
		name: "If You Leave Now Without Saving, Your Data Will Be Lost",
	});
	const confirmBackAfterEdit = async (editDocument) => {
		await editDocument();
		await backButton.click();
		await expect(dialog).toBeVisible();
		await dialog.getByRole("button", { name: "Stay" }).click();
		await expect(dialog).toHaveCount(0);
		await expect(page.locator("#text-editor-print-preview-panel")).toBeVisible();

		await backButton.click();
		await dialog.getByRole("button", { name: "Leave" }).click();
		await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
		await expect(page.locator("#text-editor-template-load-button")).toBeVisible();
	};

	const loadButton = page.locator("#text-editor-template-load-button");
	await loadButton.click();
	await page.getByRole("button", { name: "Loaded template" }).click();
	await confirmBackAfterEdit(() =>
		page.locator(".print-preview-paper-editor").fill("Edited loaded template"),
	);

	await loadButton.click();
	await page.getByRole("button", { name: "Load Shells" }).click();
	await page.getByRole("button", { name: "Loaded shell" }).click();
	await page.locator("#text-editor-size-menu-button").click();
	await confirmBackAfterEdit(() => page.locator("#text-editor-size-width").fill("7.5"));

	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Template", exact: true }).click();
	await confirmBackAfterEdit(() =>
		page.locator(".print-preview-paper-editor").fill("Edited new template"),
	);

	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.locator("#text-editor-size-width").fill("8");
	await confirmBackAfterEdit(async () => {});
});

test("Tools in the top navigation opens the editing controls", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();

	const toolsButton = page.locator(
		"#text-editor-navigation-bar #text-editor-editing-tools-button",
	);
	await expect(toolsButton).toBeEnabled();
	await toolsButton.click();
	await expect(toolsButton).toHaveAttribute("aria-pressed", "true");
	await expect(toolsButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");
	await expect(page.locator("#text-editor-tools-panel")).toBeVisible();
	await toolsButton.click();
	await expect(toolsButton).toHaveAttribute("aria-pressed", "false");
	await expect(toolsButton).toHaveCSS("transform", "none");
	await expect(page.locator("#text-editor-tools-panel")).toHaveCount(0);
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await expect(toolsButton).toBeEnabled();
	await toolsButton.click();
	await expect(page.locator("#text-editor-tools-panel")).toBeVisible();
	await expect(page.locator("#text-editor-size-menu-button")).toBeVisible();
	const alignmentButton = page.locator("#text-editor-alignment-button");
	await expect(alignmentButton).toBeVisible();
	await expect(alignmentButton).toHaveAttribute("aria-pressed", "false");
	await alignmentButton.click();
	await expect(alignmentButton).toHaveAttribute("aria-pressed", "true");
	await expect(alignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");
	await page.mouse.move(0, 0);
	await expect(alignmentButton).toHaveCSS("background-color", "rgb(88, 191, 255)");
	const alignmentPanel = page.locator("#text-editor-alignment-panel");
	await expect(alignmentPanel).toBeVisible();
	const matchingAlignmentFrame = await page.evaluate(() => {
		const tools = getComputedStyle(document.querySelector("#text-editor-tools-panel"));
		const panelElement = document.querySelector("#text-editor-alignment-panel");
		const panel = getComputedStyle(panelElement);
		return ["borderRadius", "backgroundColor", "boxShadow"].every(
			(property) => tools[property] === panel[property],
		);
	});
	expect(matchingAlignmentFrame).toBe(true);
	await expect(alignmentPanel).toHaveCSS("width", "288px");
	await expect(alignmentPanel).toHaveCSS("height", "64px");
	const alignmentChoiceButtons = alignmentPanel.getByRole("button");
	await expect(alignmentChoiceButtons).toHaveText(["Left", "Center", "Right"]);
	const alignmentChoiceClasses = await alignmentChoiceButtons.evaluateAll((buttons) =>
		buttons.map((button) => button.classList.contains("text-editor-font-styles-button")),
	);
	expect(alignmentChoiceClasses).toEqual([true, true, true]);
	const alignmentChoiceMetrics = await page.evaluate(() => {
		const panel = document.querySelector("#text-editor-alignment-panel").getBoundingClientRect();
		const buttons = [...panelElementButtons()];
		const bounds = buttons.map((button) => button.getBoundingClientRect());
		return {
			buttonHeights: bounds.map((button) => button.height),
			leftGap: bounds[0].left - panel.left,
			firstGap: bounds[1].left - bounds[0].right,
			secondGap: bounds[2].left - bounds[1].right,
		rightGap: panel.right - bounds[2].right,
			topGap: bounds[0].top - panel.top,
			bottomGap: panel.bottom - bounds[0].bottom,
		};
		function panelElementButtons() {
			return document.querySelectorAll("#text-editor-alignment-panel button");
		}
	});
	expect(alignmentChoiceMetrics).toEqual({
		buttonHeights: [32, 32, 32],
		leftGap: 16,
		firstGap: 16,
		secondGap: 16,
		rightGap: 16,
		topGap: 16,
		bottomGap: 16,
	});
	await alignmentButton.click();
	await expect(alignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(alignmentPanel).toHaveCount(0);
	await page.locator("#text-editor-size-menu-button").click();
	await page.locator("#text-editor-margins-button").click();
	await page.locator("#text-editor-fonts-button").click();
	await expect(alignmentButton).toHaveCSS("position", "static");
	await alignmentButton.click();
	const alignmentPanelGap = await page.evaluate(() => {
		const panel = document.querySelector("#text-editor-alignment-panel").getBoundingClientRect();
		const openPanels = [
			"#text-editor-size-panel",
			"#text-editor-margins-panel",
			"#text-editor-fonts-panel",
		].map((selector) => document.querySelector(selector).getBoundingClientRect());
		return panel.top - Math.max(...openPanels.map((openPanel) => openPanel.bottom));
	});
	expect(alignmentPanelGap).toBe(16);
	await alignmentButton.click();
	await expect(alignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(alignmentPanel).toHaveCount(0);
	await page.locator("#text-editor-fonts-button").click();
	await page.locator("#text-editor-margins-button").click();
	await page.locator("#text-editor-size-menu-button").click();
	await page.mouse.move(0, 0);
	await expect(alignmentButton).toHaveCSS("transform", "none");
	const toolButtonBoxes = await Promise.all(
		[
			"#text-editor-size-menu-button",
			"#text-editor-margins-button",
			"#text-editor-fonts-button",
			"#text-editor-alignment-button",
		].map((selector) => page.locator(selector).boundingBox()),
	);
	const toolsPanelBox = await page.locator("#text-editor-tools-panel").boundingBox();
	expect(toolButtonBoxes.map(({ width, height }) => ({ width, height }))).toEqual(
		Array(4).fill({ width: 256, height: 64 }),
	);
	const sizeBackground = await page
		.locator("#text-editor-size-menu-button")
		.evaluate((button) => getComputedStyle(button).backgroundImage);
	expect(sizeBackground).toContain("rgb(143, 184, 214)");
	expect(sizeBackground).toContain("rgb(122, 168, 204)");
	expect(sizeBackground).toContain("rgb(103, 152, 189)");
	const marginsBackground = await page
		.locator("#text-editor-margins-button")
		.evaluate((button) => getComputedStyle(button).backgroundImage);
	expect(marginsBackground).toContain("rgb(176, 212, 236)");
	expect(marginsBackground).toContain("rgb(159, 201, 230)");
	expect(marginsBackground).toContain("rgb(138, 186, 221)");
	const fontsBackground = await page
		.locator("#text-editor-fonts-button")
		.evaluate((button) => getComputedStyle(button).backgroundImage);
	expect(fontsBackground).toContain("rgb(213, 232, 245)");
	expect(fontsBackground).toContain("rgb(201, 225, 241)");
	expect(fontsBackground).toContain("rgb(189, 217, 236)");
	const alignmentBackground = await page
		.locator("#text-editor-alignment-button")
		.evaluate((button) => getComputedStyle(button).backgroundImage);
	await expect(alignmentButton).toHaveClass(/text-editor-fonts-button--light-blue/);
	expect(alignmentBackground).toBe(fontsBackground);
	const toolButtonTextColors = await Promise.all(
		[
			"#text-editor-size-menu-button",
			"#text-editor-margins-button",
			"#text-editor-fonts-button",
			"#text-editor-alignment-button",
		].map((selector) =>
			page.locator(selector).evaluate((button) => getComputedStyle(button).color),
		),
	);
	expect(toolButtonTextColors).toEqual(Array(4).fill("rgb(27, 27, 27)"));
	const fontsButton = page.locator("#text-editor-fonts-button");
	await fontsButton.click();
	const fontsPressedShadow = await fontsButton.evaluate(
		(button) => getComputedStyle(button).boxShadow,
	);
	await fontsButton.click();
	await alignmentButton.click();
	const alignmentPressedShadow = await alignmentButton.evaluate(
		(button) => getComputedStyle(button).boxShadow,
	);
	expect(alignmentPressedShadow).toBe(fontsPressedShadow);
	await alignmentButton.click();
	expect(toolButtonBoxes[0].x - toolsPanelBox.x).toBe(16);
	expect(toolsPanelBox.x + toolsPanelBox.width - toolButtonBoxes[0].x - toolButtonBoxes[0].width).toBe(16);
	expect(toolButtonBoxes[0].y - toolsPanelBox.y).toBe(16);
	expect(toolButtonBoxes[1].x - toolsPanelBox.x).toBe(16);
	expect(toolsPanelBox.x + toolsPanelBox.width - toolButtonBoxes[1].x - toolButtonBoxes[1].width).toBe(16);
	expect(toolButtonBoxes[1].y - toolButtonBoxes[0].y - toolButtonBoxes[0].height).toBe(16);
	expect(toolButtonBoxes[2].y - toolButtonBoxes[1].y - toolButtonBoxes[1].height).toBe(16);
	expect(toolButtonBoxes[3].y - toolButtonBoxes[2].y - toolButtonBoxes[2].height).toBe(16);
	expect(toolButtonBoxes[3].x - toolsPanelBox.x).toBe(16);
	expect(toolsPanelBox.x + toolsPanelBox.width - toolButtonBoxes[3].x - toolButtonBoxes[3].width).toBe(16);
	expect(toolsPanelBox.y + toolsPanelBox.height - toolButtonBoxes[3].y - toolButtonBoxes[3].height).toBe(16);
	await expect(
		page.locator("#text-editor-tools-panel #text-editor-editing-tools-button"),
	).toHaveCount(0);
});

test("new templates inherit Tools settings while shells omit font settings", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Tools" }).click();
	await page.locator("#text-editor-fonts-button").click();
	await page.locator("#text-editor-font-styles-button").click();
	await page.locator('[data-font-style="minecraft-regular-1"]').click();
	await page.locator("#text-editor-size-menu-button").click();
	await page.locator("#text-editor-size-width").fill("5");

	const newButton = page.locator("#text-editor-template-new-button");
	await newButton.click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	const shellEditor = page.locator(".print-preview-paper-editor");
	await expect(shellEditor).toHaveAttribute("contenteditable", "false");
	await expect(shellEditor).toHaveJSProperty("style.fontFamily", "");
	await expect(page.locator("#print-preview-paper")).toHaveCSS(
		"--print-preview-paper-width",
		"545px",
	);

	await newButton.click();
	await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
	await expect(page.locator("#text-editor-new-menu")).toBeVisible();
	await page.getByRole("button", { name: "Create A Template", exact: true }).click();
	const templatePanel = page.locator("#text-editor-print-preview-panel");
	await expect(templatePanel).toHaveCSS("top", "96px");
	await expect(templatePanel).toHaveCSS("right", "0px");
	await expect(templatePanel).toHaveCSS("bottom", "0px");
	await expect(templatePanel).toHaveCSS("left", "0px");
	const templateEditor = page.locator(".print-preview-paper-editor");
	await expect(templateEditor).toHaveJSProperty(
		"style.fontFamily",
		'MinecraftRegular1, "Trebuchet MS", sans-serif',
	);
	await expect(page.locator("#print-preview-paper")).toHaveCSS(
		"--print-preview-paper-width",
		"545px",
	);
});

test("template and shell paper left edges stay fixed when width increases", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 1200 });

	for (const action of ["Create A Shell", "Create A Template"]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Text Editor" }).click();
		await page.getByRole("button", { name: "New +" }).click();
		await page.getByRole("button", { name: action, exact: true }).click();
		await page.getByRole("button", { name: "Tools" }).click();

		const paper = page.locator("#print-preview-paper");
		const paperBefore = await paper.evaluate((element) => {
			const paperRect = element.getBoundingClientRect();
			const toolsRect = document
				.querySelector("#text-editor-tools-panel")
				.getBoundingClientRect();
			return {
				left: paperRect.left,
				width: paperRect.width,
				gap: paperRect.left - toolsRect.right,
			};
		});

		await page.locator("#text-editor-size-menu-button").click();
		await page.locator("#text-editor-size-width").fill("10");

		const paperAfter = await paper.evaluate((element) => {
			const paperRect = element.getBoundingClientRect();
			const toolsRect = document
				.querySelector("#text-editor-tools-panel")
				.getBoundingClientRect();
			return {
				left: paperRect.left,
				width: paperRect.width,
				gap: paperRect.left - toolsRect.right,
			};
		});

		expect(paperBefore.gap).toBe(16);
		expect(paperAfter.gap).toBe(16);
		expect(paperAfter.left).toBe(paperBefore.left);
		expect(paperAfter.width).toBeGreaterThan(paperBefore.width);
	}
});

test("loading saved documents preserves their settings and shell mode", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => {
		window.localStorage.setItem("ze2.textEditor.fontStyle", "minecraft-regular-1");
		window.localStorage.setItem(
			"ze2.textEditor.savedTemplates",
			JSON.stringify([
				{
					id: "saved-template",
					name: "Saved template",
					createdAt: new Date().toISOString(),
					template: {
						html: "Saved content",
						widthValue: "6",
						widthUnit: "in",
						heightValue: "9",
						heightUnit: "in",
						isShell: false,
						fontFamily: "Georgia",
						fontSize: "18px",
						fontColor: "rgb(10, 20, 30)",
						textAlign: "center",
						padding: "10px",
					},
				},
				{
					id: "saved-shell",
					name: "Saved shell",
					createdAt: new Date().toISOString(),
					template: {
						html: "",
						widthValue: "7",
						widthUnit: "in",
						heightValue: "9",
						heightUnit: "in",
						isShell: true,
					},
				},
			]),
		);
	});
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	const navigationButtonStyles = async (selector) =>
		page.locator(selector).evaluate((button) => {
			const style = getComputedStyle(button);
			return Object.fromEntries(
				[
					"width",
					"height",
					"min-height",
					"padding",
					"border",
					"border-radius",
					"font-family",
					"font-size",
					"font-style",
					"font-weight",
					"color",
					"background-color",
					"background-image",
					"box-shadow",
					"transition",
					"position",
					"top",
					"right",
					"transform",
					"z-index",
				].map((property) => [property, style.getPropertyValue(property)]),
			);
		});
	const originalHomeStyle = await navigationButtonStyles("#text-editor-home-button");
	const originalBackStyle = await navigationButtonStyles("#parent-screen-back-button");
	await page.getByRole("button", { name: "Tools" }).click();
	await page.locator("#text-editor-fonts-button").click();
	await page.locator("#text-editor-font-styles-button").click();
	await page.locator('[data-font-style="minecraft-regular-2"]').click();
	await page.locator("#text-editor-size-menu-button").click();
	await page.locator("#text-editor-size-width").fill("5");

	const loadButton = page.locator("#text-editor-template-load-button");
	await loadButton.click();
	await expect(page.locator("#text-editor-workflow-home-button")).toBeVisible();
	await expect(page.locator("#text-editor-workflow-back-button")).toBeVisible();
	expect(await navigationButtonStyles("#text-editor-workflow-home-button")).toEqual(
		originalHomeStyle,
	);
	expect(await navigationButtonStyles("#text-editor-workflow-back-button")).toEqual(
		originalBackStyle,
	);
	const templateDate = page.locator(".text-editor-saved-template-date").first();
	await expect(templateDate).toHaveText(/^\d{2}\/\d{2}$/);
	await expect(templateDate).toHaveCSS("color", "rgb(57, 255, 20)");
	await expect(page.locator(".text-editor-saved-template-item").first()).toHaveCSS(
		"color",
		"rgb(255, 255, 255)",
	);
	await page.getByRole("button", { name: "Saved template" }).click();
	await expect(page.locator("#text-editor-workflow-home-button")).toBeVisible();
	await expect(page.locator("#text-editor-workflow-back-button")).toBeVisible();
	let editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toHaveAttribute("contenteditable", "true");
	await expect(editor).toHaveText("Saved content");
	await expect(editor).toHaveJSProperty(
		"style.fontFamily",
		'MinecraftRegular2, "Trebuchet MS", sans-serif',
	);
	await expect(editor).toHaveJSProperty("style.textAlign", "center");
	await expect(page.locator("#print-preview-paper")).toHaveCSS(
		"--print-preview-paper-width",
		"654px",
	);
	await page.locator("#text-editor-workflow-back-button").click();
	await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await expect(page.locator("#text-editor-menu")).toBeVisible();

	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toHaveAttribute("contenteditable", "false");
	await expect(editor).toBeEmpty();
	await expect(editor).toHaveJSProperty("style.fontFamily", "");

	await page.locator("#text-editor-workflow-back-button").click();
	await expect(page.locator("#text-editor-unsaved-confirmation")).toHaveCount(0);
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await expect(page.locator("#text-editor-menu")).toBeVisible();
	await expect(page.locator("#text-editor-home-button")).toBeVisible();
	await expect(page.locator("#parent-screen-back-button")).toBeVisible();
	await loadButton.click();
	await page.getByRole("button", { name: "Load Shells" }).click();
	const shellDate = page.locator(".text-editor-saved-template-date").first();
	await expect(shellDate).toHaveText(/^\d{2}\/\d{2}$/);
	await page.getByRole("button", { name: "Saved shell" }).click();
	editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toHaveAttribute("contenteditable", "false");
	await expect(editor).toBeEmpty();
	await expect(editor).toHaveJSProperty("style.fontFamily", "");
	await expect(page.locator("#print-preview-paper")).toHaveCSS(
		"--print-preview-paper-width",
		"763px",
	);
});

test("saved templates stay available across reloads and restore their paper state", async ({
	page,
}) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	const initialLoadButton = page.locator("#text-editor-template-load-button");
	await initialLoadButton.click();
	const initialLoadMenu = page.locator("#text-editor-load-menu");
	await expect(initialLoadMenu.getByText("No saved templates yet.")).toHaveCount(0);
	const emptyMenuBottomGap = await initialLoadMenu.evaluate((menu) => {
		const buttons = Array.from(menu.querySelectorAll("button"));
		return menu.getBoundingClientRect().bottom - buttons.at(-1).getBoundingClientRect().bottom;
	});
	expect(emptyMenuBottomGap).toBe(16);
	await initialLoadButton.click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Template", exact: true }).click();

	const editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toHaveAttribute("contenteditable", "true");
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Size" }).click();
	await page.locator("#text-editor-size-width").fill("5");

	const saveButton = page.locator("#text-editor-template-save-button");
	const prompt = page.locator("#text-editor-template-name-prompt");
	await saveButton.click();
	await expect(prompt).toBeVisible();
	await expect(prompt.getByText("Template's Name")).toBeVisible();
	const saveBox = await saveButton.boundingBox();
	const promptBox = await prompt.boundingBox();
	expect(promptBox).not.toBeNull();
	expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(saveBox.y + 1);

	await page.locator("#text-editor-template-name-input").fill("Alphabet 5in");
	await page.getByRole("button", { name: "Save Template" }).click();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);

	await page.reload();
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	const loadButton = page.locator("#text-editor-template-load-button");
	await loadButton.click();
	await expect(loadButton).toHaveAttribute("aria-pressed", "true");
	const loadMenu = page.locator("#text-editor-load-menu");
	const loadMenuShellsButton = page.locator("#text-editor-load-menu-shells-button");
	const loadMenuTemplatesButton = page.locator(
		"#text-editor-load-menu-templates-button",
	);
	const savedList = page.locator("#text-editor-saved-templates-list");
	await expect(savedList).toBeVisible();
	await expect(loadMenuShellsButton).toBeVisible();
	await expect(loadMenuTemplatesButton).toBeVisible();
	await loadMenuShellsButton.click();
	await expect(savedList).toHaveCount(0);
	await loadMenuTemplatesButton.click();
	await expect(savedList).toBeVisible();
	await expect(page.getByRole("button", { name: "Alphabet 5in", exact: true })).toBeVisible();
	await expect(loadMenuShellsButton).toHaveAttribute("class", "text-editor-load-menu-shells-button");
	await expect(loadMenuShellsButton).toHaveAttribute("name", "text-editor-load-menu-shells-button");
	await expect(loadMenuShellsButton).toHaveAttribute(
		"data-button-name",
		"text-editor-load-menu-shells-button",
	);
	await expect(loadMenuTemplatesButton).toHaveAttribute(
		"id",
		"text-editor-load-menu-templates-button",
	);
	await expect(loadMenuTemplatesButton).toHaveAttribute(
		"class",
		"text-editor-load-menu-templates-button",
	);
	await expect(loadMenuTemplatesButton).toHaveAttribute(
		"name",
		"text-editor-load-menu-templates-button",
	);
	await expect(loadMenuTemplatesButton).toHaveAttribute(
		"data-button-name",
		"text-editor-load-menu-templates-button",
	);
	await expect(loadMenu.getByText("Tools", { exact: true })).toHaveCount(0);
	await expect(loadMenu.getByText("Load Templates", { exact: true })).toHaveCount(1);
	const loadMenuMetrics = await loadMenu.evaluate((menu) => {
		const listItems = Array.from(menu.querySelectorAll(".text-editor-saved-template-item"));
		const lastItem = listItems[listItems.length - 1];
		const menuRect = menu.getBoundingClientRect();
		const itemRect = lastItem.getBoundingClientRect();
		const navigationRect = document
			.querySelector("#text-editor-navigation-bar")
			.getBoundingClientRect();
		const newButtonRect = document
			.querySelector("#text-editor-template-new-button")
			.getBoundingClientRect();
		const loadButtonRect = document
			.querySelector("#text-editor-template-load-button")
			.getBoundingClientRect();
		const menuStyle = getComputedStyle(menu);
		const loadShellsButtonRect = menu
			.querySelector("#text-editor-load-menu-shells-button")
			.getBoundingClientRect();
		const loadTemplatesButtonRect = menu
			.querySelector("#text-editor-load-menu-templates-button")
			.getBoundingClientRect();
		return {
			shellsLeftGap: loadShellsButtonRect.left - menuRect.left,
			shellsRightGap: menuRect.right - loadShellsButtonRect.right,
			templatesLeftGap: loadTemplatesButtonRect.left - menuRect.left,
			templatesRightGap: menuRect.right - loadTemplatesButtonRect.right,
			shellsTopGap: loadShellsButtonRect.top - menuRect.top,
			templatesTopGap: loadTemplatesButtonRect.top - loadShellsButtonRect.bottom,
			topGap: menuRect.top - navigationRect.bottom,
			leftGap: menuRect.left - loadButtonRect.left,
			rightGap: menuRect.right - newButtonRect.right,
			bottomGap: menuRect.bottom - itemRect.bottom,
			backgroundColor: menuStyle.backgroundColor,
			borderRadius: menuStyle.borderRadius,
			boxShadow: menuStyle.boxShadow,
		};
	});
	expect(loadMenuMetrics).toEqual({
		shellsLeftGap: 16,
		shellsRightGap: 16,
		templatesLeftGap: 16,
		templatesRightGap: 16,
		shellsTopGap: 16,
		templatesTopGap: 16,
		topGap: 16,
		leftGap: 0,
		rightGap: 0,
		bottomGap: 16,
		backgroundColor: "rgb(11, 45, 85)",
		borderRadius: "12px",
		boxShadow:
			"rgba(255, 255, 255, 0.24) 0px 2px 0px 0px inset, rgba(0, 0, 0, 0.35) 0px -4px 0px 0px inset, rgb(6, 26, 50) 0px 5px 0px 0px, rgba(0, 0, 0, 0.3) 0px 8px 12px 0px",
	});
	await loadButton.click();
	await expect(loadButton).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#text-editor-saved-templates-list")).toHaveCount(0);
	await loadButton.click();
	await expect(page.getByRole("button", { name: "Alphabet 5in" })).toBeVisible();
	await page.getByRole("button", { name: "Alphabet 5in" }).click();

	await expect(editor).toHaveAttribute("contenteditable", "true");
	await editor.fill("Alphabet Practice");
	await expect(editor).toContainText("Alphabet Practice");
	await expect
		.poll(async () => {
			return await page
				.locator(".print-preview-paper")
				.evaluate((element) =>
					getComputedStyle(element).getPropertyValue("--print-preview-paper-width"),
				);
		})
		.toBe("545px");

	await page.getByRole("button", { name: "Save", exact: true }).click();
	await page.locator("#text-editor-template-name-input").fill("Second");
	await page.getByRole("button", { name: "Save Template" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-load-button").click();
	await expect(page.getByRole("button", { name: "Alphabet 5in" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Second" })).toBeVisible();
});

test("shell save prompt identifies the name as a shell", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.locator("#text-editor-template-save-button").click();

	const prompt = page.locator("#text-editor-template-name-prompt");
	await expect(prompt).toBeVisible();
	await expect(prompt).toHaveAttribute("aria-label", "Name this shell");
	await expect(prompt.getByText("Shell's Name")).toBeVisible();
});

test("saved shells appear in the Load Shells menu by their saved name", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.locator("#text-editor-template-save-button").click();
	await page.locator("#text-editor-template-name-input").fill("Saved Shell");
	await page.getByRole("button", { name: "Save Template" }).click();

	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-load-button").click();
	await page.getByRole("button", { name: "Load Shells", exact: true }).click();
	await expect(page.locator("#text-editor-saved-shells-list")).toBeVisible();
	await expect(page.getByRole("button", { name: "Saved Shell", exact: true })).toBeVisible();
});
