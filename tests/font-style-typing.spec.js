import { expect, test } from "@playwright/test";

async function openEditablePaperTemplate(page, selectTemplate = true) {
	await page.addInitScript(() => {
		window.localStorage.setItem(
			"ze2.textEditor.savedTemplates",
			JSON.stringify([
				{
					id: "font-style-test-template",
					name: "Font Style Test Template",
					template: {
						html: "before after",
						widthValue: "8",
						widthUnit: "in",
						heightValue: "10",
						heightUnit: "in",
					},
				},
			]),
		);
	});
	await page.setViewportSize({ width: 1280, height: 1200 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	if (selectTemplate) {
		await page.locator("#text-editor-template-load-button").click();
		await page.getByRole("button", { name: "Font Style Test Template" }).click();
		const editor = page.locator(".print-preview-paper-editor");
		await expect(editor).toBeFocused();
		const hasCollapsedCaret = await editor.evaluate((element) => {
			const selection = window.getSelection();
			return (
				selection?.isCollapsed &&
				element.contains(selection.anchorNode)
			);
		});
		expect(hasCollapsedCaret).toBe(true);
	}
}

test("nested font menus lower together when the New menu is open", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	const fontsPanel = page.locator("#text-editor-fonts-panel");
	await fontsPanel.getByRole("button", { name: "Font Styles", exact: true }).click();
	await fontsPanel.getByRole("button", { name: "Font Color", exact: true }).click();
	await fontsPanel.getByRole("button", { name: "Font Size", exact: true }).click();
	await page.locator("#text-editor-template-new-button").dispatchEvent("click");
	await expect(page.locator("#text-editor-new-menu")).toBeVisible();

	const menuGaps = await page.evaluate(() => {
		const fonts = document.querySelector("#text-editor-fonts-panel").getBoundingClientRect();
		const color = document.querySelector("#text-editor-font-color-menu").getBoundingClientRect();
		const styles = document.querySelector("#text-editor-font-styles-menu").getBoundingClientRect();
		const size = document.querySelector("#text-editor-font-size-menu").getBoundingClientRect();
		return {
			colorToFonts: color.top - fonts.top,
			stylesToColor: styles.top - color.bottom,
			sizeToStyles: size.top - styles.bottom,
		};
	});
	expect(menuGaps).toEqual({ colorToFonts: 0, stylesToColor: 16, sizeToStyles: 16 });
});

test("font selected before loading a template applies to new text", async ({ page }) => {
	await openEditablePaperTemplate(page, false);

	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	await page
		.locator("#text-editor-fonts-panel")
		.getByRole("button", { name: "Font Styles", exact: true })
		.click();
	await page.getByRole("button", { name: "Minecraft 2 Bold", exact: true }).click();

	await page.locator("#text-editor-template-load-button").click();
	await page.getByRole("button", { name: "Font Style Test Template" }).click();
	const editor = page.getByRole("textbox", { name: "Paper template text" });
	await expect(editor).toHaveCSS("font-family", /Minecraft2Bold/);
	await editor.evaluate((element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});
	await page.keyboard.type(" typed");

	await expect(editor).toHaveText("before after typed");
	await expect(editor).toHaveCSS("font-family", /Minecraft2Bold/);
});

test("repeated letters keep stable font features across every font style", async ({ page }) => {
	await openEditablePaperTemplate(page);
	const editor = page.getByRole("textbox", { name: "Paper template text" });
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	await page
		.locator("#text-editor-fonts-panel")
		.getByRole("button", { name: "Font Styles", exact: true })
		.click();

	const fontStyles = [
		["Minecraft 1 Reg", "MinecraftRegular1"],
		["Minecraft 2 Reg", "MinecraftRegular2"],
		["Minecraft 2 Bold", "Minecraft2Bold"],
		["Minecraft 2 Ital", "Minecraft2Italic"],
		["Minecraft 2 Bold Ital.", "Minecraft2BoldItalic"],
	];
	for (const [label, family] of fontStyles) {
		await editor.fill("before after");
		await editor.evaluate((element) => {
			const range = document.createRange();
			range.selectNodeContents(element);
			range.collapse(false);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		});
		await page.getByRole("button", { name: label, exact: true }).click();
		await editor.pressSequentially("aaaaaaaa");

		await expect(editor).toHaveText("before afteraaaaaaaa");
		const typedRunStyles = await editor.evaluate((element) => {
			const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
			while (walker.nextNode()) {
				if (walker.currentNode.textContent.endsWith("aaaaaaaa")) {
					const style = getComputedStyle(walker.currentNode.parentElement);
					return { fontFamily: style.fontFamily, fontFeatureSettings: style.fontFeatureSettings };
				}
			}
			return null;
		});
		expect(typedRunStyles.fontFamily).toContain(family);
		expect(typedRunStyles.fontFeatureSettings).toBe('"calt" 0, "rand" 0');
	}
});

test("font styles affect highlighted text and text typed afterward only", async ({ page }) => {
	await openEditablePaperTemplate(page);

	const editor = page.getByRole("textbox", { name: "Paper template text" });
	await editor.fill("before after");
	await editor.evaluate((element) => {
		const textNode = element.firstChild;
		const range = document.createRange();
		range.setStart(textNode, 0);
		range.setEnd(textNode, 6);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});

	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	await page
		.locator("#text-editor-fonts-panel")
		.getByRole("button", { name: "Font Styles", exact: true })
		.click();
	const firstFontButton = page.getByRole("button", { name: "Minecraft 1 Reg" });
	const secondFontButton = page.getByRole("button", { name: "Minecraft 2 Reg", exact: true });
	await firstFontButton.click();
	await expect(firstFontButton).toHaveAttribute("aria-pressed", "true");
	await page.mouse.move(1270, 1180);
	const pressedStyleColor = await firstFontButton.evaluate((button) => {
		const style = getComputedStyle(button);
		return {
			backgroundColor: style.backgroundColor,
			boxShadow: style.boxShadow,
			pressedOffset: new DOMMatrix(style.transform).m42,
		};
	});
	expect(pressedStyleColor.backgroundColor).toBe("rgb(199, 224, 244)");
	expect(pressedStyleColor.boxShadow).toContain("rgba(199, 224, 244");
	expect(pressedStyleColor.pressedOffset).toBe(4);
	await firstFontButton.click();
	await expect(firstFontButton).toHaveAttribute("aria-pressed", "true");

	const firstFormatting = await editor.evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const fragments = [];
		while (walker.nextNode()) {
			fragments.push({
				text: walker.currentNode.textContent,
				fontFamily: getComputedStyle(walker.currentNode.parentElement).fontFamily,
			});
		}
		return fragments;
	});
	expect(firstFormatting).toHaveLength(2);
	expect(firstFormatting[0].text).toBe("before");
	expect(firstFormatting[0].fontFamily).toContain("MinecraftRegular1");
	expect(firstFormatting[1].text).toBe(" after");
	expect(firstFormatting[1].fontFamily).not.toContain("MinecraftRegular1");

	await editor.evaluate((element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});
	await secondFontButton.click();
	await expect(firstFontButton).toHaveAttribute("aria-pressed", "false");
	await expect(secondFontButton).toHaveAttribute("aria-pressed", "true");
	await editor.pressSequentially(" future");

	const finalFormatting = await editor.evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const fragments = [];
		while (walker.nextNode()) {
			fragments.push({
				text: walker.currentNode.textContent,
				fontFamily: getComputedStyle(walker.currentNode.parentElement).fontFamily,
			});
		}
		return fragments;
	});
	expect(finalFormatting.map(({ text }) => text)).toEqual(["before", " after", " future"]);
	expect(finalFormatting[0].fontFamily).toContain("MinecraftRegular1");
	expect(finalFormatting[1].fontFamily).not.toContain("MinecraftRegular1");
	expect(finalFormatting[2].fontFamily).toContain("MinecraftRegular2");
});

test("Font Styles stays depressed with the Font Color glow until toggled off", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();

	const stylesButton = page.locator("#text-editor-font-styles-button");
	const colorButton = page.locator("#text-editor-font-color-button");
	await stylesButton.click();
	await expect(stylesButton).toHaveAttribute("aria-pressed", "true");
	await expect(stylesButton).toHaveClass(/text-editor-font-styles-button--depressed/);

	await colorButton.click();
	await expect(stylesButton).toHaveAttribute("aria-pressed", "true");
	await page.mouse.move(1270, 1180);
	const readPressedStyle = (button) => button.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			borderColor: style.borderColor,
			boxShadow: style.boxShadow,
			transform: style.transform,
		};
	});
	expect(await readPressedStyle(stylesButton)).toEqual(await readPressedStyle(colorButton));

	await stylesButton.click();
	await expect(stylesButton).toHaveAttribute("aria-pressed", "false");
	await expect(stylesButton).not.toHaveClass(/text-editor-font-styles-button--depressed/);
});

test("Font Size stays depressed until toggled off", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();

	const sizeButton = page.locator("#text-editor-font-size-button");
	const stylesButton = page.locator("#text-editor-font-styles-button");
	await sizeButton.click();
	await expect(sizeButton).toHaveAttribute("aria-pressed", "true");
	await expect(sizeButton).toHaveClass(/text-editor-font-size-button--depressed/);
	expect(await sizeButton.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
	await stylesButton.click();
	const sizeShadow = await sizeButton.evaluate((element) => getComputedStyle(element).boxShadow);
	const stylesShadow = await stylesButton.evaluate((element) => getComputedStyle(element).boxShadow);
	expect(sizeShadow).toBe(stylesShadow);
	await stylesButton.click();

	await sizeButton.click();
	await expect(sizeButton).toHaveAttribute("aria-pressed", "false");
	await expect(sizeButton).not.toHaveClass(/text-editor-font-size-button--depressed/);
});

test("Font Size menu matches Font Color width and label inset", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();

	const colorButton = page.locator("#text-editor-font-color-button");
	await colorButton.click();
	const colorWidth = await page.locator("#text-editor-font-color-menu").evaluate(
		(element) => element.getBoundingClientRect().width,
	);
	await colorButton.press("Enter");
	await expect(colorButton).toHaveAttribute("aria-pressed", "false");

	await page.locator("#text-editor-font-size-button").click();
	const menu = page.locator("#text-editor-font-size-menu");
	await expect(menu).toBeVisible();
	const panelGap = await menu.evaluate((element) => {
		const menuBounds = element.getBoundingClientRect();
		const panelBounds = document
			.querySelector("#text-editor-fonts-panel")
			.getBoundingClientRect();
		return {
			rightGap: panelBounds.left - menuBounds.right,
			bottomAlignment: panelBounds.bottom - menuBounds.bottom,
		};
	});
	expect(panelGap).toEqual({ rightGap: 16, bottomAlignment: 0 });
	const metrics = await menu.evaluate((element) => {
		const menuBounds = element.getBoundingClientRect();
		const contentBounds = element
			.querySelector(".text-editor-font-size-menu-content")
			.getBoundingClientRect();
		return {
			menuWidth: menuBounds.width,
			topGap: contentBounds.top - menuBounds.top,
			leftGap: contentBounds.left - menuBounds.left,
			bottomGap: menuBounds.bottom - contentBounds.bottom,
		};
	});
	expect(metrics).toEqual({ menuWidth: colorWidth, topGap: 16, leftGap: 16, bottomGap: 16 });
});

test("Font Size menu sits below the active Font Styles or Font Color menu", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();

	const stylesButton = page.locator("#text-editor-font-styles-button");
	const colorButton = page.locator("#text-editor-font-color-button");
	const sizeButton = page.locator("#text-editor-font-size-button");
	const sizeMenu = page.locator("#text-editor-font-size-menu");
	const expectSizeBelow = async (adjacentMenu) => {
		const geometry = await sizeMenu.evaluate((element, selector) => {
			const sizeBounds = element.getBoundingClientRect();
			const adjacentBounds = document.querySelector(selector).getBoundingClientRect();
			return {
				topGap: sizeBounds.top - adjacentBounds.bottom,
				leftAlignment: sizeBounds.left - adjacentBounds.left,
			};
		}, adjacentMenu);
		expect(geometry).toEqual({ topGap: 16, leftAlignment: 0 });
	};

	await stylesButton.click();
	await sizeButton.click();
	await expectSizeBelow("#text-editor-font-styles-menu");
	await sizeButton.click();
	await stylesButton.click();

	await colorButton.click();
	await sizeButton.click();
	await expectSizeBelow("#text-editor-font-color-menu");
	await sizeButton.click();
	await colorButton.press("Enter");
	await expect(colorButton).toHaveAttribute("aria-pressed", "false");

	await stylesButton.click();
	await colorButton.click();
	await sizeButton.click();
	await expectSizeBelow("#text-editor-font-styles-menu");
});

test("Font Size input accepts at most three digits", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	await page.locator("#text-editor-font-size-button").click();

	const input = page.getByRole("textbox", { name: "Font size in points" });
	await expect(input).toHaveAttribute("inputmode", "numeric");
	await expect(page.getByText("pt", { exact: true })).toBeVisible();
	await input.fill("a12b345");
	await expect(input).toHaveValue("123");
	await input.fill("1234");
	await expect(input).toHaveValue("123");
});

test("Font Size Commit matches Font Color Commit styling", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();

	const colorButton = page.locator("#text-editor-font-color-button");
	await colorButton.click();
	const colorCommit = page.locator("#text-editor-font-color-commit-button");
	const readButtonStyle = (button) => button.evaluate((element) => {
		const style = getComputedStyle(element);
		const bounds = element.getBoundingClientRect();
		return {
			width: bounds.width,
			height: bounds.height,
			border: style.border,
			borderRadius: style.borderRadius,
			background: style.background,
			color: style.color,
			boxShadow: style.boxShadow,
			padding: style.padding,
			font: style.font,
			textTransform: style.textTransform,
		};
	});
	const colorStyle = await readButtonStyle(colorCommit);
	await colorButton.click();
	await page.locator("#text-editor-font-size-button").click();
	await page.mouse.move(0, 0);
	const sizeCommit = page.locator("#text-editor-font-size-commit-button");
	expect(await readButtonStyle(sizeCommit)).toEqual(colorStyle);
	const commitGaps = await sizeCommit.evaluate((button) => {
		const buttonBounds = button.getBoundingClientRect();
		const menuBounds = document.querySelector("#text-editor-font-size-menu").getBoundingClientRect();
		return {
			rightGap: menuBounds.right - buttonBounds.right,
			bottomGap: menuBounds.bottom - buttonBounds.bottom,
		};
	});
	expect(commitGaps).toEqual({ rightGap: 16, bottomGap: 16 });
});

test("Font Size changes selected text and future typing only", async ({ page }) => {
	await openEditablePaperTemplate(page);
	const editor = page.getByRole("textbox", { name: "Paper template text" });
	await editor.fill("before after");
	await editor.evaluate((element) => {
		const range = document.createRange();
		range.setStart(element.firstChild, 0);
		range.setEnd(element.firstChild, 6);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});

	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	await page.locator("#text-editor-font-size-button").click();
	await page.getByRole("textbox", { name: "Font size in points" }).fill("18");
	await page.locator("#text-editor-font-size-commit-button").click();

	await editor.evaluate((element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});
	await editor.pressSequentially(" future");

	const formatting = await editor.evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const fragments = [];
		while (walker.nextNode()) {
			fragments.push({
				text: walker.currentNode.textContent,
				fontSize: getComputedStyle(walker.currentNode.parentElement).fontSize,
			});
		}
		return fragments;
	});
	expect(formatting.map(({ text }) => text)).toEqual(["before", " after", " future"]);
	expect(formatting[0].fontSize).toBe("24px");
	expect(formatting[1].fontSize).not.toBe("24px");
	expect(formatting[2].fontSize).toBe("24px");
});

test("font style buttons use the requested 16px spacing and centered text", async ({ page }) => {
	await openEditablePaperTemplate(page);

	await page.getByRole("button", { name: "Tools" }).click();
	const fontButtonStyles = await page.locator("#text-editor-fonts-button").evaluate((button) => {
		const style = getComputedStyle(button);
		return { borderRadius: style.borderRadius, boxShadow: style.boxShadow };
	});
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	await page
		.locator("#text-editor-fonts-panel")
		.getByRole("button", { name: "Font Styles", exact: true })
		.click();
	expect(await page.locator(".text-editor-font-style-button").allTextContents()).toEqual([
		"Minecraft 1 Reg",
		"Minecraft 2 Reg",
		"Minecraft 2 Bold",
		"Minecraft 2 Ital",
		"Minecraft 2 Bold Ital.",
	]);
	const frameMetrics = await page.evaluate(() => {
		const fonts = document.querySelector("#text-editor-fonts-panel");
		const stylesMenu = document.querySelector("#text-editor-font-styles-menu");
		const fontsBounds = fonts.getBoundingClientRect();
		const stylesBounds = stylesMenu.getBoundingClientRect();
		const fontsStyle = getComputedStyle(fonts);
		const stylesStyle = getComputedStyle(stylesMenu);
		return {
			width: stylesBounds.width,
			height: stylesBounds.height,
			leftGap: fontsBounds.left - stylesBounds.right,
			matchingFrame: ["borderRadius", "backgroundColor", "boxShadow"].every(
				(property) => fontsStyle[property] === stylesStyle[property],
			),
		};
	});
	expect(frameMetrics).toEqual({
		width: 288,
		height: 256,
		leftGap: 8,
		matchingFrame: true,
	});
	const buttonStyles = await page.evaluate(() => {
		return [...document.querySelectorAll(".text-editor-font-style-button")].map((button) => {
			const style = getComputedStyle(button);
			return {
				borderRadius: style.borderRadius,
				backgroundImage: style.backgroundImage,
				boxShadow: style.boxShadow,
				height: parseFloat(style.height),
			};
		});
	});
	expect(
		buttonStyles.every(
			({ borderRadius, backgroundImage, boxShadow, height }) =>
				borderRadius === fontButtonStyles.borderRadius &&
				boxShadow === fontButtonStyles.boxShadow &&
				backgroundImage.includes("linear-gradient") &&
				height === 64,
		),
	).toBe(true, JSON.stringify(buttonStyles));

	const metrics = await page.locator(".text-editor-font-style-button").evaluateAll((buttons) =>
		buttons.map((button) => {
			const style = getComputedStyle(button);
			return {
				width: parseFloat(style.width),
				top: parseFloat(style.top),
				left: parseFloat(style.left),
				justifyContent: style.justifyContent,
				alignItems: style.alignItems,
				textAlign: style.textAlign,
			};
		})
	);

	expect(metrics[0].width).toBeGreaterThan(110);
	expect(metrics[0].width).toBeLessThan(120);
	expect(metrics[0].left).toBeGreaterThanOrEqual(14);
	expect(metrics[0].left).toBeLessThanOrEqual(18);
	expect(metrics[1].left - (metrics[0].left + metrics[0].width)).toBeGreaterThanOrEqual(14);
	expect(metrics[1].left - (metrics[0].left + metrics[0].width)).toBeLessThanOrEqual(18);
	expect(metrics[0].top).toBeGreaterThanOrEqual(14);
	expect(metrics[0].top).toBeLessThanOrEqual(18);
	expect(metrics[2].top - metrics[0].top).toBeGreaterThanOrEqual(80);
	expect(metrics[2].top - metrics[0].top).toBeLessThanOrEqual(88);
	expect(metrics[0].justifyContent).toBe("center");
	expect(metrics[0].alignItems).toBe("center");
	expect(metrics[0].textAlign).toBe("center");
});

test("font color picker commits a color that persists across font styles", async ({ page }) => {
	await openEditablePaperTemplate(page);
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();

	const colorButton = page.locator("#text-editor-font-color-button");
	await colorButton.click();
	await expect(colorButton).toHaveAttribute("aria-pressed", "true");
	const pressedShadow = await colorButton.evaluate((button) => getComputedStyle(button).boxShadow);
	expect(pressedShadow).toContain("rgba(0, 149, 255");
	const colorPreview = page.locator("#text-editor-font-color-preview");
	const readPreviewRgb = () =>
		colorPreview.evaluate((canvas) => {
			const { data } = canvas.getContext("2d").getImageData(20, 20, 1, 1);
			return [...data].slice(0, 3);
		});
	await expect.poll(readPreviewRgb).toEqual([255, 255, 255]);

	const colorMenu = page.locator("#text-editor-font-color-menu");
	const menuMetrics = await page.evaluate(() => {
		const menu = document.querySelector("#text-editor-font-color-menu");
		const picker = document.querySelector("#text-editor-font-color-picker");
		const menuBounds = menu.getBoundingClientRect();
		const pickerBounds = picker.getBoundingClientRect();
		return {
			menuWidth: menuBounds.width,
			menuHeight: menuBounds.height,
			pickerWidth: pickerBounds.width,
			pickerHeight: pickerBounds.height,
			topGap: pickerBounds.top - menuBounds.top,
			leftGap: pickerBounds.left - menuBounds.left,
			rightGap: menuBounds.right - pickerBounds.right,
			bottomGap: menuBounds.bottom - pickerBounds.bottom,
		};
	});
	expect(menuMetrics).toEqual({
		menuWidth: 288,
		menuHeight: 256,
		pickerWidth: 256,
		pickerHeight: 176,
		topGap: 16,
		leftGap: 16,
		rightGap: 16,
		bottomGap: 64,
	});

	const stylesButton = page.locator("#text-editor-font-styles-button");
	await stylesButton.click();
	const placementMetrics = await page.evaluate(() => {
		const color = document.querySelector("#text-editor-font-color-menu").getBoundingClientRect();
		const styles = document.querySelector("#text-editor-font-styles-menu").getBoundingClientRect();
		return styles.top - color.bottom;
	});
	expect(placementMetrics).toBe(16);
	await stylesButton.click();
	const fontsGap = await page.evaluate(() => {
		const fonts = document.querySelector("#text-editor-fonts-panel").getBoundingClientRect();
		const color = document.querySelector("#text-editor-font-color-menu").getBoundingClientRect();
		return fonts.left - color.right;
	});
	expect(fontsGap).toBe(16);

	await page.locator("#text-editor-font-color-picker").click({ position: { x: 160, y: 80 } });
	await expect.poll(readPreviewRgb).not.toEqual([255, 255, 255]);
	await page.locator("#text-editor-font-color-hex-input").fill("#12345678");
	await expect.poll(readPreviewRgb).not.toEqual([255, 255, 255]);
	await page.locator("#text-editor-font-color-hex-input").fill("#12abef");
	await expect.poll(readPreviewRgb).toEqual([18, 171, 239]);
	const editor = page.getByRole("textbox", { name: "Paper template text" });
	await editor.evaluate((element) => {
		const textNode = element.firstChild;
		const range = document.createRange();
		range.setStart(textNode, 0);
		range.setEnd(textNode, 6);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});
	await page.getByRole("button", { name: "Commit", exact: true }).click();
	await expect(colorButton).toHaveAttribute("aria-pressed", "true");

	const committedTextColors = await editor.evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const colors = {};
		while (walker.nextNode()) {
			const text = walker.currentNode.textContent;
			if (text.includes("before")) {
				colors.before = getComputedStyle(walker.currentNode.parentElement).color;
			}
			if (text.includes("after")) {
				colors.after = getComputedStyle(walker.currentNode.parentElement).color;
			}
		}
		return colors;
	});
	expect(committedTextColors).toEqual({
		before: "rgb(18, 171, 239)",
		after: "rgb(0, 0, 0)",
	});
	await editor.evaluate((element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});
	await stylesButton.click();
	await page.getByRole("button", { name: "Minecraft 2 Bold", exact: true }).click();
	await editor.pressSequentially(" color");
	const typedColor = await editor.evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) {
			if (walker.currentNode.textContent.endsWith(" color")) {
				return getComputedStyle(walker.currentNode.parentElement).color;
			}
		}
		return null;
	});
	expect(typedColor).toBe("rgb(18, 171, 239)");

	await colorButton.click();
	await expect(colorButton).toHaveAttribute("aria-pressed", "false");
	await expect(colorMenu).toBeHidden();
});