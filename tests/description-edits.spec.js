import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for Parent > Student Edits > Blocks > Description Edits:
		await expect(page.locator(`#${prefix}-date-subrow`)).toBeVisible();
 * stable mode controls, and calendar rendering of saved text.
 * Gated/manual: run with `npm run test:e2e -- tests/description-edits.spec.js`.
 */

const COMMIT_TEXT = "Line one of the description.\n\nLine three after a blank line.";
const PLAY_BY_PLAY_TEXT = "First step.\nSecond step.";

test("Description month choices start with October 2026 and end with December 2027", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await clickOffscreenControl(page, "#description-edits-description-button");
	await clickOffscreenControl(page, "#description-edits-date-dropdown-button");
	await clickOffscreenControl(page, "#description-edits-month-dropdown-button");

	const monthOptions = page.locator("#description-edits-month-options-list button");
	await expect(monthOptions).toHaveCount(15);
	await expect(monthOptions.first()).toHaveAttribute("aria-label", "Select month October 2026");
	await expect(monthOptions.last()).toHaveAttribute("aria-label", "Select month December 2027");
	await expect(page.locator("#description-edits-month-option-2026-8")).toHaveCount(0);
});

/** Click a control that sits inside the 96px bottom gap, below the 772px text box. */
async function clickOffscreenControl(page, selector) {
	await page.locator(selector).evaluate((element) => element.click());
}

async function selectTextInEditor(page, selector, selectedText) {
	await page.locator(selector).evaluate((editor, text) => {
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
		const textNodes = [];
		let textNode;
		while ((textNode = walker.nextNode())) {
			textNodes.push(textNode);
		}
		const fullText = textNodes.map((node) => node.nodeValue).join("");
		const start = fullText.indexOf(text);
		if (start === -1) {
			throw new Error(`Could not find text to select: ${text}`);
		}
		const getTextPosition = (offset) => {
			for (const node of textNodes) {
				if (offset <= node.length) {
					return { node, offset };
				}
				offset -= node.length;
			}
			const lastNode = textNodes.at(-1);
			return { node: lastNode, offset: lastNode.length };
		};
		const range = document.createRange();
		const rangeStart = getTextPosition(start);
		const rangeEnd = getTextPosition(start + text.length);
		range.setStart(rangeStart.node, rangeStart.offset);
		range.setEnd(rangeEnd.node, rangeEnd.offset);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		editor.focus();
	}, selectedText);
}

async function applyDescriptionFontStyle(page, editorSelector, selectedText, fontLabel) {
	await selectTextInEditor(page, editorSelector, selectedText);
	const editorButton = page.locator("#description-editor-button");
	if ((await editorButton.getAttribute("aria-expanded")) !== "true") {
		await editorButton.click();
	}
	const fontStyleButton = page.locator("#description-editor-font-style-button");
	if ((await fontStyleButton.getAttribute("aria-expanded")) !== "true") {
		await fontStyleButton.click();
	}
	await page.getByRole("button", { name: fontLabel, exact: true }).click();
}

test("Description and Play by Play Font Size formats selected and newly typed text", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	for (const mode of ["description", "play-by-play"]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await page.locator("#description-editor-button").click();
		await clickOffscreenControl(
			page,
			mode === "description"
				? "#description-edits-description-button"
				: "#description-edits-play-by-play-button",
		);
		const editorSelector =
			mode === "description" ? "#description-edits-text-box" : "#play-by-play-edits-text-box";
		const editor = page.locator(editorSelector);
		await editor.fill("plain colored tail");
		await selectTextInEditor(page, editorSelector, "colored");

		const fontSizeButton = page.locator("#description-editor-font-size-button");
		if ((await fontSizeButton.getAttribute("aria-expanded")) !== "true") {
			await fontSizeButton.click();
		}
		await page.locator("#description-editor-font-size-input").fill("24");
		await page.locator("#description-editor-font-size-commit-button").click();
		await page.keyboard.type("!");

		const sizedText = editor.locator("span[style*='font-size']");
		await expect(sizedText).toHaveCount(1);
		await expect(sizedText).toHaveText("colored!");
		await expect(sizedText).toHaveAttribute("style", /font-size:\s*24pt/);

		const otherModeButton =
			mode === "description"
				? "#description-edits-play-by-play-button"
				: "#description-edits-description-button";
		const currentModeButton =
			mode === "description"
				? "#description-edits-description-button"
				: "#description-edits-play-by-play-button";
		await clickOffscreenControl(page, otherModeButton);
		await clickOffscreenControl(page, currentModeButton);
		await expect(editor.locator("span[style*='font-size']")).toHaveText("colored!");
	}
});

test("Font Size applies to the highlighted text after choosing a font style", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	for (const mode of ["description", "play-by-play"]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.getByRole("button", { name: "Curriculum Description", exact: true }).click();
		await page.locator("#description-editor-button").click();
		await clickOffscreenControl(
			page,
			mode === "description"
				? "#description-edits-description-button"
				: "#description-edits-play-by-play-button",
		);
		const editorSelector =
			mode === "description" ? "#description-edits-text-box" : "#play-by-play-edits-text-box";
		const editor = page.locator(editorSelector);
		await editor.fill("plain colored tail");
		const editorFontSize = await editor.evaluate(
			(element) => getComputedStyle(element).fontSize,
		);
		await editor.focus();
		await page.keyboard.press("End");
		await page.locator("#description-editor-font-style-button").click();
		await page.getByRole("button", { name: "Minecraft 1 Reg", exact: true }).click();
		await expect(editor.locator("[data-font-style]")).toHaveCount(0);
		await page.keyboard.type("!");
		const newlyTypedStyle = editor.locator('[data-font-style="minecraft-regular-1"]');
		await expect(newlyTypedStyle).toHaveText("!");
		await expect
			.poll(() =>
				newlyTypedStyle.evaluate((element) => ({
					fontSize: getComputedStyle(element).fontSize,
					fontSizeAdjust: getComputedStyle(element).fontSizeAdjust,
				})),
			)
			.toEqual({ fontSize: editorFontSize, fontSizeAdjust: "0.5" });

		await selectTextInEditor(page, editorSelector, "colored");
		await page.getByRole("button", { name: "Minecraft 1 Reg", exact: true }).click();
		await page.locator("#description-editor-font-size-button").click();
		await page.locator("#description-editor-font-size-input").fill("24");
		await page.locator("#description-editor-font-size-commit-button").click();

		const styledText = editor.locator(
			'[data-font-style="minecraft-regular-1"]:has([style*="font-size"])',
		);
		const sizedText = styledText.locator('[style*="font-size"]');
		await expect(styledText).toHaveText("colored");
		await expect(sizedText).toHaveText("colored");
		await expect(sizedText).toHaveAttribute("style", /font-size:\s*24pt/);
	}
});

test("Font Color in-page picker matches its swatch with 16px vertical gaps", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-editor-button").click();
	await clickOffscreenControl(page, "#description-edits-description-button");
	const editor = page.locator("#description-edits-text-box");
	await editor.fill("plain colored tail");
	await selectTextInEditor(page, "#description-edits-text-box", "colored");
	await page.locator("#description-editor-font-color-button").click();
	await page.locator("#description-editor-font-color-swatch").click();

	const geometry = await page.evaluate(() => {
		const swatch = document
			.querySelector("#description-editor-font-color-swatch")
			.getBoundingClientRect();
		const picker = document
			.querySelector("#description-editor-font-color-picker")
			.getBoundingClientRect();
		const hex = document
			.querySelector("#description-editor-font-color-hex-input")
			.getBoundingClientRect();
		return {
			swatch: { width: swatch.width, height: swatch.height },
			picker: { width: picker.width, height: picker.height },
			swatchToPicker: picker.top - swatch.bottom,
			pickerToHex: hex.top - picker.bottom,
		};
	});

	expect(geometry.picker).toEqual(geometry.swatch);
	expect(geometry.swatchToPicker).toBe(16);
	expect(geometry.pickerToHex).toBe(16);
	await page.locator("#description-editor-font-color-picker").click({
		position: { x: 72, y: 60 },
	});
	const selectedColor = await page
		.locator("#description-editor-font-color-hex-input")
		.inputValue();
	expect(selectedColor).toMatch(/^#[\da-f]{6}$/i);
	expect(selectedColor).not.toBe("#000000");
	const swatchColor = await page
		.locator(".description-editor-font-color-swatch-canvas")
		.evaluate((canvas) => {
			const { data } = canvas
				.getContext("2d")
				.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1);
			return `#${[...data.slice(0, 3)]
				.map((channel) => channel.toString(16).padStart(2, "0"))
				.join("")}`;
		});
	expect(swatchColor).toBe(selectedColor);
	await expect(editor.locator(`[data-font-color="${selectedColor}"]`)).toHaveText("colored");
});

async function measureHorizontalButtonSpacing(page, prefix) {
	return page.evaluate((modePrefix) => {
		const panel = document.querySelector("#description-edits-panel-container");
		const panelBounds = panel.getBoundingClientRect();
		const workflow = panel.querySelector(`#${modePrefix}-workflow-row`);
		const actionButtons = panel.querySelector("#description-edits-action-buttons");
		const measure = (elements) => {
			const bounds = [...elements].map((element) => element.getBoundingClientRect());
			return {
				leftInset: bounds[0].left - panelBounds.left,
				rightInset: panelBounds.right - bounds.at(-1).right,
				gaps: bounds.slice(1).map((box, index) => box.left - bounds[index].right),
			};
		};
		return {
			workflow: measure(workflow.children),
			actionButtons: measure(actionButtons.children),
		};
	}, prefix);
}

test("Load buttons match neighboring workflow button geometry and typography", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-edits-description-button").click();

	for (const mode of ["description", "play-by-play"]) {
		if (mode === "play-by-play") {
			await page.locator("#description-edits-play-by-play-button").click();
		}
		const prefix = mode === "description" ? "description-edits" : "play-by-play-edits";
		const matchedStyles = await page.evaluate(
			({ comparisonId, loadId }) => {
				const properties = [
					"borderRadius",
					"fontFamily",
					"fontSize",
					"fontWeight",
					"letterSpacing",
					"paddingTop",
					"paddingBottom",
					"textTransform",
				];
				const comparison = document.getElementById(comparisonId);
				const load = document.getElementById(loadId);
				const comparisonStyles = getComputedStyle(comparison);
				const loadStyles = getComputedStyle(load);
				return {
					comparisonSize: [
						comparison.getBoundingClientRect().width,
						comparison.getBoundingClientRect().height,
					],
					loadSize: [
						load.getBoundingClientRect().width,
						load.getBoundingClientRect().height,
					],
					comparisonStyles: Object.fromEntries(
						properties.map((property) => [property, comparisonStyles[property]]),
					),
					loadStyles: Object.fromEntries(
						properties.map((property) => [property, loadStyles[property]]),
					),
				};
			},
			{ comparisonId: `${prefix}-date-dropdown-button`, loadId: `${prefix}-load-button` },
		);
		expect(matchedStyles.loadSize).toEqual(matchedStyles.comparisonSize);
		expect(matchedStyles.loadStyles).toEqual(matchedStyles.comparisonStyles);
	}
});

test("Date selectors match and align with workflow buttons in both modes", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-edits-description-button").click();

	for (const mode of ["description", "play-by-play"]) {
		if (mode === "play-by-play") {
			await page.locator("#description-edits-play-by-play-button").click();
		}
		const prefix = mode === "description" ? "description-edits" : "play-by-play-edits";
		await page.locator(`#${prefix}-date-dropdown-button`).click();
		const dateSubrow = page.locator(`#${prefix}-date-subrow`);
		await expect(dateSubrow).toBeVisible();
		const comparisons = await page.evaluate(
			({ prefix }) => {
				const styleProperties = [
					"borderRadius",
					"borderTopWidth",
					"color",
					"fontFamily",
					"fontSize",
					"fontWeight",
					"letterSpacing",
					"paddingTop",
					"paddingBottom",
					"textTransform",
				];
				return [
					[`${prefix}-month-dropdown-button`, `${prefix}-block-dropdown-button`],
					[`${prefix}-day-dropdown-button`, `${prefix}-history-dropdown-button`],
					[`${prefix}-year-dropdown-button`, `${prefix}-remove-button`],
				].map(([dateId, workflowId]) => {
					const dateButton = document.getElementById(dateId);
					const workflowButton = document.getElementById(workflowId);
					const dateBounds = dateButton.getBoundingClientRect();
					const workflowBounds = workflowButton.getBoundingClientRect();
					const getStyles = (element) => {
						const styles = getComputedStyle(element);
						return Object.fromEntries(
							styleProperties.map((property) => [property, styles[property]]),
						);
					};
					return {
						dateGeometry: [dateBounds.left, dateBounds.width, dateBounds.height],
						workflowGeometry: [
							workflowBounds.left,
							workflowBounds.width,
							workflowBounds.height,
						],
						dateStyles: getStyles(dateButton),
						workflowStyles: dateId.endsWith("year-dropdown-button")
							? { ...getStyles(workflowButton), color: "rgb(0, 0, 0)" }
							: getStyles(workflowButton),
					};
				});
			},
			{ prefix },
		);
		for (const comparison of comparisons) {
			expect(comparison.dateGeometry).toEqual(comparison.workflowGeometry);
			expect(comparison.dateStyles).toEqual(comparison.workflowStyles);
		}
		await page.locator(`#${prefix}-date-dropdown-button`).click();
	}
});

test("Date selector row keeps the panel fixed with 16px gaps in both modes", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-edits-description-button").click();

	for (const mode of ["description", "play-by-play"]) {
		if (mode === "play-by-play") {
			await page.locator("#description-edits-play-by-play-button").click();
		}
		const prefix = mode === "description" ? "description-edits" : "play-by-play-edits";
		const panel = page.locator("#description-edits-panel-container");
		const initialPanel = await panel.boundingBox();
		const initialButtonSpacing = await measureHorizontalButtonSpacing(page, prefix);
		expect(initialButtonSpacing.workflow.leftInset).toBe(16);
		expect(initialButtonSpacing.workflow.rightInset).toBe(16);
		const dateRow = page.locator(`#${prefix}-date-subrow`);
		await expect(dateRow).toBeHidden();
		await page.locator(`#${prefix}-date-dropdown-button`).click();
		await page.mouse.move(0, 0);
		await page.evaluate(() => {
			for (const animation of document.getAnimations()) animation.finish();
		});
		expect(await measureHorizontalButtonSpacing(page, prefix)).toEqual(initialButtonSpacing);
		await expect(dateRow).toBeVisible();
		const geometry = await page.evaluate((modePrefix) => {
			const bounds = (selector) => document.querySelector(selector).getBoundingClientRect();
			const panel = bounds("#description-edits-panel-container");
			const editor = bounds("#description-edits-text-box, #play-by-play-edits-text-box");
			const curriculumRow = bounds("#play-by-play-math-curriculum-row");
			const workflow = bounds(`#${modePrefix}-workflow-row`);
			const actions = [
				...document.querySelectorAll("#description-edits-action-buttons button"),
			].map((button) => button.getBoundingClientRect());
			return {
				panelTop: panel.top,
				panelHeight: panel.height,
				bottomInset: panel.bottom - Math.max(...actions.map((button) => button.bottom)),
				dateGaps: ["month", "day", "year"].map((field) => {
					const date = bounds(`#${modePrefix}-${field}-dropdown-button`);
					return {
						above: date.top - editor.bottom,
						toCurriculum: curriculumRow.top - date.bottom,
						toWorkflow: workflow.top - curriculumRow.bottom,
					};
				}),
			};
		}, prefix);
		expect(geometry.panelTop).toBe(initialPanel.y);
		expect(geometry.panelHeight).toBe(initialPanel.height);
		expect(geometry.bottomInset).toBe(16);
		for (const gaps of geometry.dateGaps) {
			expect(gaps.above).toBe(16);
			expect(gaps.toCurriculum).toBe(16);
			expect(gaps.toWorkflow).toBe(16);
		}
		await page.locator(`#${prefix}-date-dropdown-button`).click();
		await expect(dateRow).toBeHidden();
		const collapsedPanel = await panel.boundingBox();
		expect(collapsedPanel).toEqual(initialPanel);
	}
});

test("Selecting date fields does not resize or shift the Description Edits panel", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });

	for (const mode of ["description", "play-by-play"]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await page.locator(`#description-edits-${mode}-button`).click();

		const prefix = mode === "description" ? "description-edits" : "play-by-play-edits";
		await page.locator(`#${prefix}-date-dropdown-button`).click();
		await expect(page.locator(`#${prefix}-date-subrow`)).toBeVisible();

		const geometry = await page.evaluate(() => {
			const bounds = (element) => {
				const { x, y, width, height } = element.getBoundingClientRect();
				return { x, y, width, height };
			};
			return {
				panel: bounds(document.querySelector("#description-edits-panel-container")),
				editor: bounds(
					document.querySelector(
						"#description-edits-text-box, #play-by-play-edits-text-box",
					),
				),
				modeButtons: [
					...document.querySelectorAll("#description-edits-action-buttons button"),
				].map((button) => {
					const { width, height } = button.getBoundingClientRect();
					return { width: Number(width.toFixed(2)), height: Number(height.toFixed(2)) };
				}),
			};
		});

		for (const [buttonSelector, optionSelector] of [
			[`#${prefix}-month-dropdown-button`, `#${prefix}-month-option-2026-9`],
			[`#${prefix}-day-dropdown-button`, `#${prefix}-day-option-15`],
			[`#${prefix}-year-dropdown-button`, `#${prefix}-year-option-2026`],
		]) {
			await page.locator(buttonSelector).click();
			await page.locator(optionSelector).click();
			const selectedGeometry = await page.evaluate(() => {
				const bounds = (element) => {
					const { x, y, width, height } = element.getBoundingClientRect();
					return { x, y, width, height };
				};

				return {
					panel: bounds(document.querySelector("#description-edits-panel-container")),
					editor: bounds(
						document.querySelector(
							"#description-edits-text-box, #play-by-play-edits-text-box",
						),
					),
					modeButtons: [
						...document.querySelectorAll("#description-edits-action-buttons button"),
					].map((button) => {
						const { width, height } = button.getBoundingClientRect();
						return {
							width: Number(width.toFixed(2)),
							height: Number(height.toFixed(2)),
						};
					}),
				};
			});
			expect(selectedGeometry).toEqual(geometry);
		}
	}
});

test("Description and Play by Play keep independent selected dates", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-edits-description-button").click();
	await page.locator("#description-edits-date-dropdown-button").click();

	for (const [buttonSelector, optionSelector] of [
		["#description-edits-month-dropdown-button", "#description-edits-month-option-2026-9"],
		["#description-edits-day-dropdown-button", "#description-edits-day-option-15"],
		["#description-edits-year-dropdown-button", "#description-edits-year-option-2026"],
	]) {
		await page.locator(buttonSelector).click();
		await page.locator(optionSelector).click();
	}
	await expect(page.locator("#description-edits-month-dropdown-button")).toHaveText("Month");
	await expect(page.locator("#description-edits-day-dropdown-button")).toHaveText("Day");
	await expect(page.locator("#description-edits-year-dropdown-button")).toHaveText("Year");

	await page.locator("#description-edits-play-by-play-button").click();
	await expect(page.locator("#play-by-play-edits-month-dropdown-button")).toHaveText("Month");
	await expect(page.locator("#play-by-play-edits-day-dropdown-button")).toHaveText("Day");
	await expect(page.locator("#play-by-play-edits-year-dropdown-button")).toHaveText("Year");
	await page.locator("#play-by-play-edits-date-dropdown-button").click();
	for (const [buttonSelector, optionSelector] of [
		["#play-by-play-edits-month-dropdown-button", "#play-by-play-edits-month-option-2026-9"],
		["#play-by-play-edits-day-dropdown-button", "#play-by-play-edits-day-option-26"],
		["#play-by-play-edits-year-dropdown-button", "#play-by-play-edits-year-option-2027"],
	]) {
		await page.locator(buttonSelector).click();
		await page.locator(optionSelector).click();
	}

	await page.locator("#description-edits-description-button").click();
	await expect(page.locator("#description-edits-month-dropdown-button")).toHaveText("Month");
	await expect(page.locator("#description-edits-day-dropdown-button")).toHaveText("Day");
	await expect(page.locator("#description-edits-year-dropdown-button")).toHaveText("Year");
	await page.locator("#description-edits-play-by-play-button").click();
	await expect(page.locator("#play-by-play-edits-month-dropdown-button")).toHaveText("Month");
	await expect(page.locator("#play-by-play-edits-day-dropdown-button")).toHaveText("Day");
	await expect(page.locator("#play-by-play-edits-year-dropdown-button")).toHaveText("Year");
});

test("Description and Play by Play keep independent selected subjects and blocks", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-edits-description-button").click();
	await page.locator("#description-edits-subject-dropdown-button").click();
	await page.locator("#description-edits-subject-option-math").click();
	await page.locator("#description-edits-block-dropdown-button").click();
	await page.locator("#description-edits-block-option-1").click();
	await expect(page.locator("#description-edits-selection-subject")).toHaveText("Subject: Math");
	await expect(page.locator("#description-edits-selection-block")).toHaveText("Block: 1");

	await page.locator("#description-edits-play-by-play-button").click();
	await expect(page.locator("#description-edits-selection-subject")).toHaveCount(0);
	await expect(page.locator("#description-edits-selection-block")).toHaveCount(0);
	await page.locator("#play-by-play-edits-subject-dropdown-button").click();
	await page.locator("#play-by-play-edits-subject-option-science").click();
	await page.locator("#play-by-play-edits-block-dropdown-button").click();
	await page.locator("#play-by-play-edits-block-option-3").click();
	await expect(page.locator("#description-edits-selection-subject")).toHaveText(
		"Subject: Science",
	);
	await expect(page.locator("#description-edits-selection-block")).toHaveText("Block: 3");

	await page.locator("#description-edits-description-button").click();
	await expect(page.locator("#description-edits-selection-subject")).toHaveText("Subject: Math");
	await expect(page.locator("#description-edits-selection-block")).toHaveText("Block: 1");
	await page.locator("#description-edits-play-by-play-button").click();
	await expect(page.locator("#description-edits-selection-subject")).toHaveText(
		"Subject: Science",
	);
	await expect(page.locator("#description-edits-selection-block")).toHaveText("Block: 3");
});

test("Selecting a block does not resize or shift the Description Edits panel", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });

	for (const mode of ["description", "play-by-play"]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await page.locator(`#description-edits-${mode}-button`).click();
		const prefix = mode === "description" ? "description-edits" : "play-by-play-edits";

		const geometry = async () =>
			page.evaluate(() => {
				const bounds = (element) => {
					const { x, y, width, height } = element.getBoundingClientRect();
					return { x, y, width, height };
				};
				return {
					panel: bounds(document.querySelector("#description-edits-panel-container")),
					editor: bounds(
						document.querySelector(
							"#description-edits-text-box, #play-by-play-edits-text-box",
						),
					),
					modeButtons: [
						...document.querySelectorAll("#description-edits-action-buttons button"),
					].map((button) => {
						const { width, height } = button.getBoundingClientRect();
						return {
							width: Number(width.toFixed(2)),
							height: Number(height.toFixed(2)),
						};
					}),
				};
			});
		const initialGeometry = await geometry();

		for (const block of ["1", "all"]) {
			await page.locator(`#${prefix}-block-dropdown-wrapper button`).click();
			await page.locator(`#${prefix}-block-option-${block}`).click();
			expect(await geometry()).toEqual(initialGeometry);
		}
	}
});

test.beforeEach(async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => {
		globalThis.localStorage?.removeItem("zoologistExplorer02.blockDescriptions");
		globalThis.localStorage?.removeItem("zoologistExplorer02.blockPlayByPlay");
		globalThis.localStorage?.removeItem("zoologistExplorer02.descriptionHistory");
	});
	await page.reload();
});

test("Curriculum Description stays depressed while hovered and Back leaves no empty edit screen", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();

	const button = page.getByRole("button", { name: "Curriculum Description", exact: true });
	await button.click();
	await expect(button).toHaveAttribute("aria-pressed", "true");
	await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");

	const bounds = await button.boundingBox();
	await page.mouse.move(1200, 100);
	await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
	await expect(button).toHaveAttribute("aria-pressed", "true");
	await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");

	await page.locator("#blocks-screen-back-button").click();
	await expect(button).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#description-edits-panel-container")).toBeHidden();
	await expect(page.locator("#blocks-menu-sidebar")).toHaveCount(0);
	await expect(page.locator("#student-edits-screen-back-button")).toBeVisible();
});

test("Block Completion Edits and Curriculum Description cannot be active together", async ({
	page,
}) => {
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();

	const descriptionButton = page.getByRole("button", {
		name: "Curriculum Description",
		exact: true,
	});
	const blockEditsButton = page.getByRole("button", {
		name: "Block Completion Edits",
		exact: true,
	});

	await descriptionButton.click();
	await expect(descriptionButton).toHaveAttribute("aria-pressed", "true");
	await page.locator("#blocks-screen-back-button").click();
	await expect(descriptionButton).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#blocks-menu-sidebar")).toHaveCount(0);

	await blockEditsButton.click();
	await expect(descriptionButton).toHaveAttribute("aria-pressed", "false");
	await expect(blockEditsButton).toHaveAttribute("aria-pressed", "true");
	await expect(page.locator("#description-edits-panel-container")).toBeHidden();
	await expect(page.locator(".block-edits-panel")).toHaveCount(5);

	await page.locator("#blocks-screen-back-button").click();
	await expect(blockEditsButton).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#blocks-menu-sidebar")).toHaveCount(0);
	await expect(page.locator("#student-edits-screen-back-button")).toBeVisible();

	await descriptionButton.click();
	await expect(descriptionButton).toHaveAttribute("aria-pressed", "true");
	await expect(blockEditsButton).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#description-edits-panel-container")).toBeVisible();
	await expect(page.locator(".block-edits-panel")).toHaveCount(0);
});

test("Curriculum Description opens the Editor sidebar from Student Edits", async ({ page }) => {
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();

	const editorButton = page.getByRole("button", { name: "Editor", exact: true });
	await expect(editorButton).toHaveCount(0);
	await page.getByRole("button", { name: "Curriculum Description", exact: true }).click();
	await expect(editorButton).toBeVisible();
	await expect(page.locator("#blocks-menu-sidebar")).toBeVisible();
	await expect(editorButton.locator("..")).toHaveAttribute("id", "blocks-menu-sidebar");
	await expect(page.locator("#description-edits-button").locator("..")).toHaveAttribute(
		"id",
		"student-edits-sidebar",
	);
	await expect(page.locator("#block-edits-button").locator("..")).toHaveAttribute(
		"id",
		"student-edits-sidebar",
	);
	await expect(page.locator("#description-edits-button").locator("..")).not.toHaveAttribute(
		"id",
		"blocks-menu-sidebar",
	);
});

test("Editor reveals aligned pastel font controls with 16px gaps", async ({ page }) => {
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.getByRole("button", { name: "Curriculum Description", exact: true }).click();

	const editorButton = page.getByRole("button", { name: "Editor", exact: true });
	await expect(editorButton).toBeVisible();
	await expect(page.getByRole("button", { name: "Font Style", exact: true })).toHaveCount(0);
	await editorButton.click();

	const labels = ["Font Style", "Font Size", "Font Color"];
	for (const label of labels) {
		await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
	}

	const layout = await page.evaluate(() => {
		const editor = document.querySelector("#description-editor-button").getBoundingClientRect();
		const buttons = [
			"description-editor-font-style-button",
			"description-editor-font-size-button",
			"description-editor-font-color-button",
		].map((id) => {
			const button = document.querySelector(`#${id}`);
			const bounds = button.getBoundingClientRect();
			return {
				left: bounds.left,
				right: bounds.right,
				top: bounds.top,
				bottom: bounds.bottom,
				background: getComputedStyle(button).backgroundImage,
			};
		});
		return {
			editor: { left: editor.left, right: editor.right, bottom: editor.bottom },
			buttons,
		};
	});

	expect(layout.buttons[0].top - layout.editor.bottom).toBe(16);
	for (let index = 0; index < layout.buttons.length; index += 1) {
		expect(layout.buttons[index].left).toBe(layout.editor.left);
		expect(layout.buttons[index].right).toBe(layout.editor.right);
		if (index > 0) {
			expect(layout.buttons[index].top - layout.buttons[index - 1].bottom).toBe(16);
		}
	}

	const pastelColorPairs = [
		[0, ["rgb(247, 196, 196)", "rgb(238, 156, 156)"]],
		[1, ["rgb(215, 237, 207)", "rgb(182, 219, 168)"]],
		[2, ["rgb(255, 242, 179)", "rgb(245, 223, 125)"]],
	];
	for (const [index, colorPair] of pastelColorPairs) {
		expect(layout.buttons[index].background).toContain(colorPair[0]);
		expect(layout.buttons[index].background).toContain(colorPair[1]);
	}

	await page.locator("#description-editor-font-style-button").click();
	const fontStyleOptions = await page
		.locator(".description-editor-font-style-option-button")
		.evaluateAll((buttons) =>
			buttons.map((button) => {
				const bounds = button.getBoundingClientRect();
				const menuBounds = button.parentElement.getBoundingClientRect();
				return {
					widthRatio: bounds.width / menuBounds.width,
					left: bounds.left,
					menuLeft: menuBounds.left,
					textAlign: getComputedStyle(button).textAlign,
				};
			}),
		);
	expect(fontStyleOptions).toHaveLength(5);
	for (const option of fontStyleOptions) {
		expect(option.widthRatio).toBeCloseTo(0.7, 2);
		expect(option.left).toBe(option.menuLeft);
		expect(option.textAlign).toBe("left");
	}
});

test("Font Alignment formats selected and subsequently typed text in both modes", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	for (const mode of [
		{
			name: "Description",
			editor: "#description-edits-text-box",
			action: "description",
			otherAction: "play-by-play",
		},
		{
			name: "Play by Play",
			editor: "#play-by-play-edits-text-box",
			action: "play-by-play",
			otherAction: "description",
		},
	]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.getByRole("button", { name: "Curriculum Description", exact: true }).click();
		await page.locator("#description-editor-button").click();
		await clickOffscreenControl(page, `#description-edits-${mode.action}-button`);
		const editor = page.locator(mode.editor);
		await editor.fill("before target after");

		for (const alignment of ["left", "center", "right"]) {
			await editor.fill("before target after");
			await selectTextInEditor(page, mode.editor, "target");
			const alignmentButton = page.locator(
				`#description-editor-text-alignment-${alignment}-button`,
			);
			if (!(await alignmentButton.isVisible())) {
				await page.locator("#description-editor-text-alignment-button").click();
			}
			await expect(alignmentButton).toBeVisible();
			await alignmentButton.click();
			await page.keyboard.type(alignment[0]);

			const alignedText = await editor.evaluate((element) => {
				const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
				let textNode;
				while ((textNode = walker.nextNode())) {
					if (textNode.nodeValue.includes("target")) {
						const block = textNode.parentElement.closest("div, p") ?? element;
						return {
							text: element.textContent,
							alignment: getComputedStyle(block).textAlign,
						};
					}
				}
				return null;
			});
			expect(alignedText).toEqual({
				text: `before target${alignment[0]} after`,
				alignment,
			});

			await clickOffscreenControl(page, `#description-edits-${mode.otherAction}-button`);
			await clickOffscreenControl(page, `#description-edits-${mode.action}-button`);
			await expect
				.poll(() =>
					editor.evaluate((element) => {
						const block = element.querySelector("[data-text-alignment]");
						return block ? getComputedStyle(block).textAlign : null;
					}),
				)
				.toBe(alignment);
		}
	}
});

test("Font Style options match the Text Editor and format selected and subsequently typed text", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	const optionPairs = [
		["red", "Minecraft 1 Reg", "minecraft-regular-1"],
		["orange", "Minecraft 2 Reg", "minecraft-regular-2"],
		["yellow", "Minecraft 2 Bold", "minecraft-regular-2-bold"],
		["green", "Minecraft 2 Ital", "minecraft-regular-2-italic"],
		["blue", "Minecraft 2 Bold Ital.", "minecraft-regular-2-bold-italic"],
	];
	const expectedText = "plain red orange yellow green blue future tail";

	for (const mode of [
		{ name: "Description", editor: "#description-edits-text-box", action: "description" },
		{
			name: "Play by Play",
			editor: "#play-by-play-edits-text-box",
			action: "play-by-play",
		},
	]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.getByRole("button", { name: "Curriculum Description", exact: true }).click();
		await page.locator("#description-editor-button").click();
		const editor = page.locator(mode.editor);
		if (mode.action === "play-by-play") {
			await clickOffscreenControl(page, "#description-edits-play-by-play-button");
		} else {
			await clickOffscreenControl(page, "#description-edits-description-button");
		}
		await editor.fill("plain red orange yellow green blue tail");

		await page.locator("#description-editor-font-style-button").click();
		for (const [word, label, fontStyleId] of optionPairs) {
			await editor.evaluate((element, selectedWord) => {
				const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
				let textNode;
				while ((textNode = walker.nextNode())) {
					const start = textNode.nodeValue.indexOf(selectedWord);
					if (start === -1) {
						continue;
					}
					const range = document.createRange();
					range.setStart(textNode, start);
					range.setEnd(textNode, start + selectedWord.length);
					const selection = window.getSelection();
					selection.removeAllRanges();
					selection.addRange(range);
					element.focus();
					return;
				}
				throw new Error(`Could not find text to select: ${selectedWord}`);
			}, word);
			await page.getByRole("button", { name: label, exact: true }).click();
			const styledText = editor.locator(`[data-font-style="${fontStyleId}"]`);
			await expect(styledText).toHaveText(word);
		}

		await page.keyboard.type(" future");
		const formattedEditor = await editor.evaluate((element) => {
			const plainText = element.firstChild;
			const tailText = element.lastChild;
			return {
				text: element.textContent,
				fontStyles: [...element.querySelectorAll("[data-font-style]")].map((span) => ({
					id: span.dataset.fontStyle,
					text: span.textContent,
					fontFamily: getComputedStyle(span).fontFamily,
				})),
				plainBeforeHasFontStyle:
					plainText.parentElement?.closest("[data-font-style]") !== null,
				plainAfterHasFontStyle:
					tailText.parentElement?.closest("[data-font-style]") !== null,
			};
		});
		expect(formattedEditor.text).toBe(expectedText);
		expect(formattedEditor.fontStyles.map(({ id, text }) => [id, text])).toEqual([
			["minecraft-regular-1", "red"],
			["minecraft-regular-2", "orange"],
			["minecraft-regular-2-bold", "yellow"],
			["minecraft-regular-2-italic", "green"],
			["minecraft-regular-2-bold-italic", "blue future"],
		]);
		expect(formattedEditor.fontStyles[0].fontFamily).toContain("MinecraftRegular1");
		expect(formattedEditor.fontStyles[4].fontFamily).toContain("Minecraft2BoldItalic");
		expect(formattedEditor.plainBeforeHasFontStyle).toBe(false);
		expect(formattedEditor.plainAfterHasFontStyle).toBe(false);

		const restyledText = "red orange yellow green blue";
		await selectTextInEditor(page, mode.editor, restyledText);
		await page.getByRole("button", { name: "Minecraft 1 Reg", exact: true }).click();
		const restyledSelection = await editor.evaluate((element, selectedText) => {
			const selectedStyle = [
				...element.querySelectorAll('[data-font-style="minecraft-regular-1"]'),
			].find((span) => span.textContent === selectedText);
			if (!selectedStyle) {
				throw new Error("The entire selection was not wrapped in the chosen font style.");
			}
			const walker = document.createTreeWalker(selectedStyle, NodeFilter.SHOW_TEXT);
			const effectiveFontFamilies = [];
			let textNode;
			while ((textNode = walker.nextNode())) {
				const fontStyle = textNode.parentElement.closest("[data-font-style]");
				effectiveFontFamilies.push(getComputedStyle(fontStyle).fontFamily);
			}
			return {
				nestedFontStyleCount: selectedStyle.querySelectorAll("[data-font-style]").length,
				effectiveFontFamilies,
			};
		}, restyledText);
		expect(restyledSelection.nestedFontStyleCount).toBe(0);
		expect(restyledSelection.effectiveFontFamilies.length).toBeGreaterThan(0);
		for (const fontFamily of restyledSelection.effectiveFontFamilies) {
			expect(fontFamily).toContain("MinecraftRegular1");
		}

		await page.keyboard.type(" future");
		await expect(
			editor.locator('[data-font-style="minecraft-regular-1"]').filter({
				hasText: `${restyledText} future`,
			}),
		).toHaveText(`${restyledText} future`);
		await expect(editor).toContainText("future tail");
	}
});

test("Description and Play by Play highlights clear only on left double-click", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	for (const mode of [
		{ action: "description", editor: "#description-edits-text-box" },
		{ action: "play-by-play", editor: "#play-by-play-edits-text-box" },
	]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await clickOffscreenControl(page, `#description-edits-${mode.action}-button`);
		const editor = page.locator(mode.editor);
		await editor.fill("keep this highlighted");
		await editor.evaluate((element) => {
			const textNode = element.firstChild;
			const range = document.createRange();
			range.setStart(textNode, 5);
			range.setEnd(textNode, textNode.textContent.length);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
			element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
		});
		const highlightedText = () =>
			editor.evaluate(() => {
				const highlight = CSS.highlights.get("description-edits-text-selection");
				return highlight ? [...highlight].map((range) => range.toString()) : [];
			});

		await expect.poll(highlightedText).toEqual(["this highlighted"]);
		await page.locator("#description-editor-button").click();
		await expect.poll(highlightedText).toEqual(["this highlighted"]);
		await page.evaluate(() => {
			document.querySelector("#student-edits-screen").dispatchEvent(
				new MouseEvent("dblclick", { bubbles: true, button: 2 }),
			);
		});
		await expect.poll(highlightedText).toEqual(["this highlighted"]);
		await page.locator("#description-editor-button").dblclick();
		await expect.poll(highlightedText).toEqual([]);

		await selectTextInEditor(page, mode.editor, "this highlighted");
		await editor.evaluate((element) => {
			element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
		});
		await expect.poll(highlightedText).toEqual(["this highlighted"]);
		await editor.click({ position: { x: 100, y: 30 } });
		await expect.poll(highlightedText).toEqual(["this highlighted"]);
		await editor.dblclick({ position: { x: 100, y: 30 } });
		await expect.poll(highlightedText).toEqual([]);
	}
});

test("Font Color picker applies hex colors to selections and subsequent text in both modes", async ({
	page,
}) => {
	const scenarios = [
		{
			mode: "Description",
			action: "description",
			editor: "#description-edits-text-box",
			chooseColor: async (_picker, hexInput) => {
				await hexInput.fill("#12abef");
				await hexInput.press("Enter");
				return "#12abef";
			},
		},
		{
			mode: "Play by Play",
			action: "play-by-play",
			editor: "#play-by-play-edits-text-box",
			chooseColor: async (_picker, hexInput) => {
				await hexInput.fill("#3c84f1");
				await hexInput.press("Enter");
				return "#3c84f1";
			},
		},
	];

	for (const scenario of scenarios) {
		await page.goto("./");
		await page.setViewportSize({ width: 1440, height: 1200 });
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.getByRole("button", { name: "Curriculum Description", exact: true }).click();
		await page.locator("#description-editor-button").click();
		if (scenario.action === "play-by-play") {
			await clickOffscreenControl(page, "#description-edits-play-by-play-button");
		} else {
			await clickOffscreenControl(page, "#description-edits-description-button");
		}

		const editor = page.locator(scenario.editor);
		await editor.fill("plain colored tail");
		await selectTextInEditor(page, scenario.editor, "colored");
		await page.locator("#description-editor-font-color-button").click();
		await page.locator("#description-editor-font-color-swatch").click();

		const picker = page.locator("#description-editor-font-color-picker");
		const hexInput = page.locator("#description-editor-font-color-hex-input");
		await hexInput.click();
		await expect(hexInput).toBeFocused();
		await expect
			.poll(() =>
				page.evaluate((selector) => {
					const editor = document.querySelector(selector);
					const highlight = CSS.highlights.get("description-edits-text-selection");
					const highlightedRange = highlight ? [...highlight][0] : null;
					return {
						backgroundColor: getComputedStyle(
							editor,
							"::highlight(description-edits-text-selection)",
						).backgroundColor,
						selectedText: highlightedRange?.toString(),
					};
				}, scenario.editor),
			)
			.toEqual({
				backgroundColor: "rgba(0, 149, 255, 0.35)",
				selectedText: "colored",
			});
		const pickerSpacing = await page.evaluate(() => {
			const swatch = document.querySelector("#description-editor-font-color-swatch");
			const picker = document.querySelector("#description-editor-font-color-picker");
			const hexInput = document.querySelector("#description-editor-font-color-hex-input");
			const swatchBounds = swatch.getBoundingClientRect();
			const pickerBounds = picker.getBoundingClientRect();
			return {
				swatchToPicker: pickerBounds.top - swatchBounds.bottom,
				pickerToHex: hexInput.getBoundingClientRect().top - pickerBounds.bottom,
				pickerSize: [pickerBounds.width, pickerBounds.height],
				swatchSize: [swatchBounds.width, swatchBounds.height],
			};
		});
		expect(pickerSpacing.swatchToPicker).toBe(16);
		expect(pickerSpacing.pickerToHex).toBe(16);
		expect(pickerSpacing.pickerSize).toEqual(pickerSpacing.swatchSize);

		const color = await scenario.chooseColor(picker, hexInput);
		const coloredText = editor.locator(`[data-font-color="${color}"]`);
		await expect(coloredText).toHaveText("colored");
		await expect(coloredText).toHaveCSS(
			"color",
			color === "#12abef" ? "rgb(18, 171, 239)" : "rgb(60, 132, 241)",
		);

		await page.keyboard.type(" future");
		await expect(editor).toContainText("colored future tail");
		await expect(editor.locator(`[data-font-color="${color}"]`)).toHaveText("colored future");

		const prefix =
			scenario.action === "description" ? "description-edits" : "play-by-play-edits";
		for (const [control, option] of [
			["date", null],
			["month", "month-option-2026-9"],
			["day", "day-option-13"],
			["year", "year-option-2026"],
			["subject", "subject-option-math"],
			["block", "block-option-1"],
		]) {
			await clickOffscreenControl(page, `#${prefix}-${control}-dropdown-button`);
			if (option) {
				await clickOffscreenControl(page, `#${prefix}-${option}`);
			}
		}
		await clickOffscreenControl(page, `#${prefix}-commit-button`);
		const savedText = await page.evaluate(
			(storageKey) => {
				const savedEntries = JSON.parse(localStorage.getItem(storageKey));
				return savedEntries["2026-10-13::math::1"];
			},
			scenario.action === "description"
				? "zoologistExplorer02.blockDescriptions"
				: "zoologistExplorer02.blockPlayByPlay",
		);
		expect(savedText).toContain(`<span data-font-color="${color}"`);
		expect(savedText).toContain("colored future");

		await clickOffscreenControl(page, `#${prefix}-load-button`);
		const loadedEditor = page.locator(`[id^="${prefix}-loaded-text-"]`);
		const loadedColoredText = loadedEditor.locator(`[data-font-color="${color}"]`);
		await expect(loadedColoredText).toHaveText("colored future");
		await expect(loadedColoredText).toHaveCSS(
			"color",
			color === "#12abef" ? "rgb(18, 171, 239)" : "rgb(60, 132, 241)",
		);
	}
});

test("Font Color hex input reflects uniformly colored selections in both modes", async ({
	page,
}) => {
	const scenarios = [
		{
			editor: "#description-edits-text-box",
			action: "description",
			color: "#12abef",
		},
		{
			editor: "#play-by-play-edits-text-box",
			action: "play-by-play",
			color: "#3c84f1",
		},
	];

	for (const scenario of scenarios) {
		await page.goto("./");
		await page.setViewportSize({ width: 1440, height: 1200 });
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.getByRole("button", { name: "Curriculum Description", exact: true }).click();
		await page.locator("#description-editor-button").click();
		await clickOffscreenControl(page, `#description-edits-${scenario.action}-button`);

		const editor = page.locator(scenario.editor);
		await editor.fill("plain colored tail");
		await selectTextInEditor(page, scenario.editor, "colored");
		await editor.evaluate((element) => {
			element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
		});
		await page.locator("#description-editor-font-color-button").click();
		await page.locator("#description-editor-font-color-swatch").click();

		const hexInput = page.locator("#description-editor-font-color-hex-input");
		await hexInput.fill(scenario.color);
		await hexInput.press("Enter");
		await expect(editor.locator(`[data-font-color="${scenario.color}"]`)).toHaveText("colored");

		await hexInput.fill("#000000");
		await selectTextInEditor(page, scenario.editor, "colored");
		await editor.evaluate((element) => {
			element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
		});
		await expect(hexInput).toHaveValue(scenario.color);
	}
});

for (const mode of [
	{ name: "Description", prefix: "description-edits", action: "description" },
	{ name: "Play by Play", prefix: "play-by-play-edits", action: "play-by-play" },
]) {
	for (const scenario of ["before focus", "empty editor", "existing text"]) {
		test(`${mode.name} Font selection at a caret works with ${scenario}`, async ({ page }) => {
			await page.getByRole("button", { name: "Open parent section" }).click();
			await page.getByRole("button", { name: "Student Edits" }).click();
			await page.locator("#description-edits-button").click();
			await clickOffscreenControl(page, `#description-edits-${mode.action}-button`);
			await page.locator("#description-editor-button").click();
			await page.locator("#description-editor-font-style-button").click();

			const editor = page.locator(`#${mode.prefix}-text-box`);
			const originalText = scenario === "existing text" ? "plain" : "";
			if (scenario === "existing text") {
				await editor.fill(originalText);
				await editor.press("Control+End");
			} else if (scenario === "empty editor") {
				await editor.click();
			}

			const cdp = await page.context().newCDPSession(page);
			await cdp.send("DOM.enable");
			await cdp.send("CSS.enable");
			const fontChoices = [
				["Minecraft 1 Reg", "minecraft-regular-1", "MinecraftRegular1", " red"],
				["Minecraft 2 Reg", "minecraft-regular-2", "MinecraftRegular2", " orange"],
				["Minecraft 2 Bold", "minecraft-regular-2-bold", "Minecraft2Bold", " yellow"],
				["Minecraft 2 Ital", "minecraft-regular-2-italic", "Minecraft2Italic", " green"],
				[
					"Minecraft 2 Bold Ital.",
					"minecraft-regular-2-bold-italic",
					"Minecraft2BoldItalic",
					" blue",
				],
			];
			let expectedText = originalText;
			for (const [label, id, family, typedText] of fontChoices) {
				const button = page.getByRole("button", { name: label, exact: true });
				await clickOffscreenControl(page, `#description-editor-font-style-option-${id}`);
				await expect(button).toHaveAttribute("aria-pressed", "true");
				if (scenario === "before focus" && expectedText === "") {
					await editor.click();
				}
				await page.keyboard.type(typedText);
				expectedText += typedText;
				await expect
					.poll(() => editor.evaluate((element) => element.textContent))
					.toBe(expectedText);
				const styledText = editor.locator(`[data-font-style="${id}"]`);
				const formattedRuns = await styledText.evaluateAll((spans) =>
					spans.map((span) => ({
						text: span.textContent,
						fontFamily: getComputedStyle(span).fontFamily,
					})),
				);
				expect(formattedRuns.map(({ text }) => text).join("")).toBe(typedText);
				expect(formattedRuns.length).toBeGreaterThan(0);
				for (const { fontFamily } of formattedRuns) {
					expect(fontFamily).toMatch(new RegExp(family));
				}
				await page.evaluate(() => document.fonts.ready);

				const { root } = await cdp.send("DOM.getDocument");
				const { nodeId } = await cdp.send("DOM.querySelector", {
					nodeId: root.nodeId,
					selector: `#${mode.prefix}-text-box [data-font-style="${id}"]`,
				});
				const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
				expect(fonts.length).toBeGreaterThan(0);
				expect(fonts.every((font) => font.isCustomFont && font.glyphCount > 0)).toBe(true);
			}
			await page.keyboard.press("Enter");
			await page.keyboard.type("next line");
			await expect
				.poll(() => editor.evaluate((element) => element.innerText))
				.toBe(`${expectedText}\nnext line`);
			const nextLineFont = await editor.evaluate((element) => {
				const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
				let node;
				while ((node = walker.nextNode())) {
					if (node.nodeValue.includes("next line")) {
						return getComputedStyle(node.parentElement).fontFamily;
					}
				}
				throw new Error("The typed next line was not found.");
			});
			expect(nextLineFont).toContain("Minecraft2BoldItalic");
			await cdp.detach();
			if (originalText) {
				const plainText = await editor.evaluate((element) => ({
					text: element.firstChild.textContent,
					isStyled:
						element.firstChild.parentElement.closest("[data-font-style]") !== null,
				}));
				expect(plainText).toEqual({ text: originalText, isStyled: false });
			}
		});
	}
	test(`${mode.name} Font selection applies to replacement and plain-text paste`, async ({
		page,
	}) => {
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await clickOffscreenControl(page, `#description-edits-${mode.action}-button`);
		const editorSelector = `#${mode.prefix}-text-box`;
		const editor = page.locator(editorSelector);
		await editor.fill("prefix selected suffix");
		await applyDescriptionFontStyle(page, editorSelector, "selected", "Minecraft 1 Reg");
		await selectTextInEditor(page, editorSelector, "prefix");
		await page.keyboard.type("replaced");
		await expect(editor).toHaveText("replaced selected suffix");
		await page.getByRole("button", { name: "Minecraft 2 Ital", exact: true }).click();
		await editor.evaluate((element) => {
			const clipboardData = new DataTransfer();
			clipboardData.setData("text/plain", " <b>plain</b>\nnext");
			element.dispatchEvent(
				new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }),
			);
		});
		await expect
			.poll(() => editor.evaluate((element) => element.innerText))
			.toBe("replaced <b>plain</b>\nnext selected suffix");
		await expect(editor.locator("b")).toHaveCount(0);
		const pastedFont = await editor.evaluate((element) => {
			const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
			let node;
			while ((node = walker.nextNode())) {
				if (node.nodeValue.includes("<b>plain</b>")) {
					return getComputedStyle(node.parentElement).fontFamily;
				}
			}
			throw new Error("Pasted plain text was not found.");
		});
		expect(pastedFont).toContain("Minecraft2Italic");
	});
}

test("Description Edits panel expands on selection and stays fixed across content modes", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.evaluate(() => document.fonts.ready);

	const panel = page.locator("#description-edits-panel-container");
	const initialGeometry = await panel.boundingBox();
	const initialGaps = await page.evaluate(() => {
		const editor = document
			.querySelector("#description-edits-text-box")
			.getBoundingClientRect();
		const curriculumButton = document
			.querySelector("#math-curriculum-october-button")
			.getBoundingClientRect();
		const buttons = [
			...document.querySelectorAll("#description-edits-action-buttons button"),
		].map((button) => button.getBoundingClientRect());
		const panelBounds = document
			.querySelector("#description-edits-panel-container")
			.getBoundingClientRect();
		return {
			top: curriculumButton.top - editor.bottom,
			toolbar: Math.min(...buttons.map((button) => button.top)) - curriculumButton.bottom,
			bottom: panelBounds.bottom - Math.max(...buttons.map((button) => button.bottom)),
		};
	});
	expect(initialGaps.top).toBeCloseTo(16, 0);
	expect(initialGaps.toolbar).toBe(16);
	expect(initialGaps.bottom).toBeCloseTo(16, 0);

	let expandedGeometry;
	let expandedButtonLayout;
	for (const selector of [
		"#description-edits-description-button",
		"#description-edits-play-by-play-button",
	]) {
		await page.locator(selector).click();
		const currentGeometry = await panel.boundingBox();
		const currentButtonLayout = await page.evaluate(() =>
			[...document.querySelectorAll("#description-edits-panel-container button")].map(
				(button) => ({
					left: button.offsetLeft,
					top: button.offsetTop,
					width: button.offsetWidth,
					height: button.offsetHeight,
				}),
			),
		);
		expect(currentGeometry.height).toBeGreaterThan(initialGeometry.height);
		if (expandedGeometry) {
			expect(currentGeometry).toEqual(expandedGeometry);
			expect(currentButtonLayout).toEqual(expandedButtonLayout);
		} else {
			expandedGeometry = currentGeometry;
			expandedButtonLayout = currentButtonLayout;
			expect(currentGeometry.width).toBe(initialGeometry.width);
		}
	}
});

test("Description and Play by Play buttons keep their size across modes", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.evaluate(() => document.fonts.ready);

	const buttonSelectors = [
		"#description-edits-description-button",
		"#description-edits-play-by-play-button",
	];
	async function measureButtons() {
		return page.locator("#description-edits-panel-container").evaluate((panel, selectors) => {
			return selectors.map((selector) => {
				const buttonBox = panel.querySelector(selector).getBoundingClientRect();
				return {
					width: buttonBox.width,
					height: buttonBox.height,
				};
			});
		}, buttonSelectors);
	}
	const initialGeometry = await measureButtons();
	expect(initialGeometry[0]).toEqual(initialGeometry[1]);
	for (const selector of buttonSelectors) {
		await page.locator(selector).evaluate((button) => button.click());
		await expect(page.locator(selector)).toHaveAttribute("aria-pressed", "true");
		expect(await measureButtons()).toEqual(initialGeometry);
	}
	await page.locator(buttonSelectors[1]).evaluate((button) => button.click());
	await expect(page.locator(buttonSelectors[1])).toHaveAttribute("aria-pressed", "false");
	expect(await measureButtons()).toEqual(initialGeometry);
});

for (const mode of [
	{
		name: "Description",
		prefix: "description-edits",
		button: "description",
		editor: "#description-edits-text-box",
		history: "Description history options",
	},
	{
		name: "Play by Play",
		prefix: "play-by-play-edits",
		button: "play-by-play",
		editor: "#play-by-play-edits-text-box",
		history: "Play by Play history options",
	},
]) {
	test(`${mode.name} option groups preserve separate selectors, geometry, and keyboard selection`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 1200 });
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await page.locator(`#description-edits-${mode.button}-button`).click();

		for (const selection of [
			{
				name: "subject",
				label:
					mode.name === "Description"
						? "Subject options"
						: "Play by Play Subject options",
				option: "math",
				width: 200,
			},
			{
				name: "block",
				label: mode.name === "Description" ? "Block options" : "Play by Play Block options",
				option: "1",
				width: 160,
			},
			{
				name: "month",
				label: mode.name === "Description" ? "Month options" : "Play by Play Month options",
				option: "2026-9",
				width: 180,
			},
			{
				name: "day",
				label: mode.name === "Description" ? "Day options" : "Play by Play Day options",
				option: "1",
				width: 120,
			},
			{
				name: "year",
				label: mode.name === "Description" ? "Year options" : "Play by Play Year options",
				option: "2026",
				width: 120,
			},
			{ name: "history", label: mode.history, width: 200 },
		]) {
			if (selection.name === "month") {
				await page.locator(`#${mode.prefix}-date-dropdown-button`).press("Enter");
			}
			if (selection.name === "history") {
				await page.locator(`#${mode.prefix}-date-dropdown-button`).press("Enter");
				await page.locator(mode.editor).fill(COMMIT_TEXT);
				await page.locator(`#${mode.prefix}-commit-button`).press("Enter");
				await page.locator(mode.editor).fill("");
			}
			const trigger = page.locator(`#${mode.prefix}-${selection.name}-dropdown-button`);
			await trigger.press("Enter");
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
			const group = page.getByRole("group", { name: selection.label, exact: true });
			await expect(group).toHaveAttribute(
				"id",
				`${mode.prefix}-${selection.name}-options-list`,
			);
			await expect(group).toHaveAttribute(
				"class",
				`${mode.prefix}-${selection.name}-options-list`,
			);
			await expect(group).toHaveJSProperty("tagName", "FIELDSET");
			const geometry = await group.evaluate((element) => {
				const styles = getComputedStyle(element);
				return {
					width: element.getBoundingClientRect().width,
					margin: styles.margin,
					padding: styles.padding,
					minWidth: styles.minWidth,
				};
			});
			expect(geometry).toEqual({
				width: selection.width,
				margin: "0px",
				padding: "0px",
				minWidth: "0px",
			});
			await trigger.press("Tab");
			const option =
				selection.name === "history"
					? group.getByRole("button").first()
					: page.locator(`#${mode.prefix}-${selection.name}-option-${selection.option}`);
			await expect(option).toBeFocused();
			await option.press("Enter");
			await expect(group).toHaveCount(0);
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
			if (selection.name === "subject" || selection.name === "block") {
				await expect(trigger).toHaveText(
					selection.name === "subject" ? "Subject" : "Block",
				);
			}
		}
		await expect(page.locator(mode.editor)).toHaveText(COMMIT_TEXT);
		await expect(page.getByRole("listbox")).toHaveCount(0);
	});
}

test.describe("Description Load and Save", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1200 });
		await page.evaluate(
			({ description, steps }) => {
				localStorage.setItem(
					"zoologistExplorer02.blockDescriptions",
					JSON.stringify({
						"2026-10-01::math::1": description,
						"2026-10-01::math::2": "",
						"2026-10-01::math::3": description,
						"2026-10-01::science::1": "Unrelated description.",
						"2026-10-02::math::1": "Next day's description.",
					}),
				);
				localStorage.setItem(
					"zoologistExplorer02.blockPlayByPlay",
					JSON.stringify({
						"2026-10-01::math::1": steps,
						"2026-10-01::math::2": "Other saved steps.",
					}),
				);
			},
			{ description: COMMIT_TEXT, steps: PLAY_BY_PLAY_TEXT },
		);
		await page.reload();
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await page.locator("#description-edits-description-button").click();

		const load = page.getByRole("button", { name: "Load description", exact: true });
		await expect(load).toBeDisabled();
		expect(await load.evaluate((element) => getComputedStyle(element).boxShadow)).toMatch(
			/^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(?:, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*)$/,
		);
		await expect(load).toHaveCSS("background-color", "rgb(209, 213, 219)");
		await expect(page.locator("#play-by-play-edits-load-button")).toHaveCount(0);
		await expect(page.locator("#play-by-play-edits-text-box")).toHaveCount(0);
		await page.locator("#description-edits-date-dropdown-button").click();
		await page.locator("#description-edits-month-dropdown-button").click();
		await page.locator("#description-edits-month-option-2026-9").click();
		await expect(load).toBeDisabled();
		await page.locator("#description-edits-day-dropdown-button").click();
		await page.locator("#description-edits-day-option-1").click();
		await expect(load).toBeDisabled();
		await page.locator("#description-edits-year-dropdown-button").click();
		await page.locator("#description-edits-year-option-2026").click();
		await expect(load).toBeDisabled();
		await page.locator("#description-edits-date-dropdown-button").click();
		await page.locator("#description-edits-subject-dropdown-button").click();
		await page.locator("#description-edits-subject-option-math").click();
		await expect(load).toBeDisabled();
	});

	test("font selection on loaded text persists without additional typing", async ({ page }) => {
		await page.locator("#description-edits-block-dropdown-button").click();
		await page.locator("#description-edits-block-option-1").click();
		await page.locator("#description-edits-load-button").click();
		await applyDescriptionFontStyle(
			page,
			"#description-edits-loaded-text-1",
			"description",
			"Minecraft 2 Bold",
		);
		await page.locator("#description-edits-commit-button").press("Enter");
		await page.locator("#description-edits-load-button").click();
		const savedFont = page.locator(
			'#description-edits-loaded-text-1 [data-font-style="minecraft-regular-2-bold"]',
		);
		await expect(savedFont).toHaveText("description");
		await expect(savedFont).toHaveCSS("font-family", /Minecraft2Bold/);
		await expect
			.poll(() =>
				page
					.locator("#description-edits-loaded-text-1")
					.evaluate((element) => element.innerText),
			)
			.toBe(COMMIT_TEXT);
		await page.locator("#description-edits-loaded-text-1").press("Control+End");
		await page.getByRole("button", { name: "Minecraft 1 Reg", exact: true }).click();
		await page.keyboard.type(" appended");
		await page.locator("#description-edits-commit-button").press("Enter");
		await page.locator("#description-edits-load-button").click();
		await expect
			.poll(() =>
				page
					.locator(
						'#description-edits-loaded-text-1 [data-font-style="minecraft-regular-1"]',
					)
					.evaluateAll((spans) => spans.map((span) => span.textContent).join("")),
			)
			.toBe(" appended");
		await expect
			.poll(() =>
				page
					.locator("#description-edits-loaded-text-1")
					.evaluate((element) => element.innerText),
			)
			.toBe(`${COMMIT_TEXT} appended`);
	});

	test("single-block editing waits for Save, overwrites only its key, and resets the editor", async ({
		page,
	}) => {
		await page.locator("#description-edits-block-dropdown-button").click();
		await page.locator("#description-edits-block-option-1").click();
		const load = page.getByRole("button", { name: "Load description", exact: true });
		await expect(load).toBeEnabled();
		expect(await load.evaluate((element) => getComputedStyle(element).boxShadow)).toContain(
			"rgb(122, 86, 18) 0px 4px 0px 0px",
		);
		const original = await page.evaluate(() => ({
			descriptions: JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			steps: localStorage.getItem("zoologistExplorer02.blockPlayByPlay"),
		}));
		await load.click();
		await expect(page.locator(".description-edits-loaded-text")).toHaveCount(1);
		await expect(page.locator("#play-by-play-edits-loaded-scroll-region")).toHaveCount(0);
		const field = page.getByLabel("Block 1", { exact: true });
		await expect(field).toHaveText(COMMIT_TEXT);
		const edited = "Edited description.\n\nReplacement, not appended text.";
		await field.fill(edited);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual(original.descriptions);
		const save = page.getByRole("button", { name: "Save description", exact: true });
		await expect(save).toHaveText("Save");
		await expect(save).toHaveAttribute("title", "Save description");
		await save.press("Enter");
		await expect(page.locator("#description-edits-loaded-scroll-region")).toHaveCount(0);
		const editor = page.locator("#description-edits-text-box");
		await expect(editor).toHaveText("");
		await expect(editor).toBeFocused();
		expect(
			await editor.evaluate((element) => ({
				caretAtStart: (() => {
					const selection = window.getSelection();
					return (
						selection?.isCollapsed &&
						selection.anchorNode === element &&
						selection.anchorOffset === 0
					);
				})(),
				top: element.scrollTop,
				left: element.scrollLeft,
			})),
		).toEqual({ caretAtStart: true, top: 0, left: 0 });
		const expected = { ...original.descriptions, "2026-10-01::math::1": edited };
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual(expected);
		expect(
			await page.evaluate(() => localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
		).toBe(original.steps);
		await load.click();
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveText(edited);
		await page.reload();
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual(expected);
	});

	test("All Blocks groups identical non-empty descriptions without creating empty block values", async ({
		page,
	}) => {
		await page.locator("#description-edits-block-dropdown-button").click();
		await page.locator("#description-edits-block-option-all").click();
		await expect(page.locator("#description-edits-selection-summary span")).toHaveText([
			"Date: 10/01/26",
			"Subject: Math",
			"Block: All",
		]);
		const original = await page.evaluate(() => ({
			descriptions: JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			steps: localStorage.getItem("zoologistExplorer02.blockPlayByPlay"),
		}));
		await page.locator("#description-edits-load-button").click();
		await expect(page.locator(".description-edits-loaded-text")).toHaveCount(1);
		await expect(page.getByLabel("Blocks 1, 3", { exact: true })).toHaveText(COMMIT_TEXT);
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveCount(0);
		await page.locator("#description-edits-commit-button").press("Enter");
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual(original.descriptions);
		await page.locator("#description-edits-load-button").click();
		const edited = "Identical descriptions replaced together.";
		await page.getByLabel("Blocks 1, 3", { exact: true }).fill(edited);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual(original.descriptions);
		await page.locator("#description-edits-commit-button").press("Enter");
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual({
			...original.descriptions,
			"2026-10-01::math::1": edited,
			"2026-10-01::math::3": edited,
		});
		expect(
			await page.evaluate(() => localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
		).toBe(original.steps);
		await expect(page.locator("#description-edits-loaded-scroll-region")).toHaveCount(0);
		await expect(page.locator("#description-edits-text-box")).toHaveText("");
		await expect(page.locator("#description-edits-text-box")).toBeFocused();
	});

	test("differing descriptions have labeled scrollable fields and Save writes only changed blocks", async ({
		page,
	}) => {
		await page.locator("#description-edits-block-dropdown-button").click();
		await page.locator("#description-edits-block-option-2").click();
		await page.locator("#description-edits-load-button").click();
		await expect(page.locator("#description-edits-loaded-scroll-region")).toHaveCount(0);
		const longDescription = "A long description line.\n".repeat(100);
		await page.locator("#description-edits-text-box").fill(longDescription);
		await page.locator("#description-edits-commit-button").press("Enter");
		await page.locator("#description-edits-block-dropdown-button").click();
		await page.locator("#description-edits-block-option-all").click();
		await page.locator("#description-edits-load-button").click();
		await expect(page.locator(".description-edits-loaded-text")).toHaveCount(3);
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveText(COMMIT_TEXT);
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveText(longDescription);
		await expect(page.getByLabel("Block 3", { exact: true })).toHaveText(COMMIT_TEXT);
		const region = page.locator("#description-edits-loaded-scroll-region");
		const geometry = await region.evaluate((element) => {
			const styles = getComputedStyle(element);
			const parentStyles = getComputedStyle(element.parentElement);
			return {
				height: element.getBoundingClientRect().height,
				rightInset:
					element.parentElement.getBoundingClientRect().right -
					element.getBoundingClientRect().right -
					Number.parseFloat(parentStyles.paddingRight) -
					Number.parseFloat(parentStyles.borderRightWidth),
				overflow: styles.overflowY,
				direction: styles.direction,
				hasOverflow: element.scrollHeight > element.clientHeight,
			};
		});
		expect(geometry).toEqual({
			height: 772,
			rightInset: 0,
			overflow: "scroll",
			direction: "ltr",
			hasOverflow: true,
		});
		await region.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});
		expect(await region.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		const longField = page.getByLabel("Block 2", { exact: true });
		await longField.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});
		expect(await longField.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		const original = await page.evaluate(() => {
			globalThis.descriptionStorageWrites = [];
			const setItem = Storage.prototype.setItem;
			Storage.prototype.setItem = function (key, value) {
				if (key === "zoologistExplorer02.blockDescriptions") {
					globalThis.descriptionStorageWrites.push(JSON.parse(value));
				}
				return setItem.call(this, key, value);
			};
			return {
				descriptions: JSON.parse(
					localStorage.getItem("zoologistExplorer02.blockDescriptions"),
				),
				steps: localStorage.getItem("zoologistExplorer02.blockPlayByPlay"),
			};
		});
		const edited = "Only the second description changed.";
		await longField.fill(edited);
		expect(await page.evaluate(() => globalThis.descriptionStorageWrites)).toEqual([]);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual(original.descriptions);
		await page.locator("#description-edits-commit-button").press("Enter");
		const expected = { ...original.descriptions, "2026-10-01::math::2": edited };
		expect(await page.evaluate(() => globalThis.descriptionStorageWrites)).toEqual([expected]);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockDescriptions")),
			),
		).toEqual(expected);
		expect(
			await page.evaluate(() => localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
		).toBe(original.steps);
		await expect(region).toHaveCount(0);
		await expect(page.locator("#description-edits-text-box")).toHaveText("");
		await expect(page.locator("#description-edits-text-box")).toBeFocused();
		await page.locator("#description-edits-load-button").click();
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveText(edited);
		await page.locator("#description-edits-commit-button").press("Enter");
		expect(await page.evaluate(() => globalThis.descriptionStorageWrites)).toEqual([expected]);
	});
});

test.describe("Play by Play Load and Save", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1200 });
		await page.evaluate(
			({ description, steps }) => {
				localStorage.setItem(
					"zoologistExplorer02.blockPlayByPlay",
					JSON.stringify({
						"2026-10-01::math::1": steps,
						"2026-10-01::math::2": "",
						"2026-10-01::math::3": steps,
						"2026-10-01::science::1": "Unrelated steps.",
						"2026-10-02::math::1": "Next day's steps.",
					}),
				);
				localStorage.setItem(
					"zoologistExplorer02.blockDescriptions",
					JSON.stringify({
						"2026-10-01::math::1": description,
						"2026-10-01::math::2": "Other saved description.",
					}),
				);
			},
			{ description: COMMIT_TEXT, steps: PLAY_BY_PLAY_TEXT },
		);
		await page.reload();
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await page.locator("#description-edits-play-by-play-button").click();

		const load = page.getByRole("button", { name: "Load Play by Play", exact: true });
		await expect(load).toBeDisabled();
		expect(await load.evaluate((element) => getComputedStyle(element).boxShadow)).toMatch(
			/^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(?:, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*)$/,
		);
		await expect(load).toHaveCSS("background-color", "rgb(209, 213, 219)");
		await expect(page.locator("#description-edits-load-button")).toHaveCount(0);
		await expect(page.locator("#description-edits-text-box")).toHaveCount(0);
		await page.locator("#play-by-play-edits-date-dropdown-button").click();
		await page.locator("#play-by-play-edits-month-dropdown-button").click();
		await page.locator("#play-by-play-edits-month-option-2026-9").click();
		await expect(load).toBeDisabled();
		await page.locator("#play-by-play-edits-day-dropdown-button").click();
		await page.locator("#play-by-play-edits-day-option-1").click();
		await expect(load).toBeDisabled();
		await page.locator("#play-by-play-edits-year-dropdown-button").click();
		await page.locator("#play-by-play-edits-year-option-2026").click();
		await expect(load).toBeDisabled();
		await page.locator("#play-by-play-edits-date-dropdown-button").click();
		await page.locator("#play-by-play-edits-subject-dropdown-button").click();
		await page.locator("#play-by-play-edits-subject-option-math").click();
		await expect(load).toBeDisabled();
	});

	test("font selection on loaded text persists without additional typing", async ({ page }) => {
		await page.locator("#play-by-play-edits-block-dropdown-button").click();
		await page.locator("#play-by-play-edits-block-option-1").click();
		await page.locator("#play-by-play-edits-load-button").click();
		await applyDescriptionFontStyle(
			page,
			"#play-by-play-edits-loaded-text-1",
			"First step",
			"Minecraft 2 Ital",
		);
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		await page.locator("#play-by-play-edits-load-button").click();
		const savedFont = page.locator(
			'#play-by-play-edits-loaded-text-1 [data-font-style="minecraft-regular-2-italic"]',
		);
		await expect(savedFont).toHaveText("First step");
		await expect(savedFont).toHaveCSS("font-family", /Minecraft2Italic/);
		await expect
			.poll(() =>
				page
					.locator("#play-by-play-edits-loaded-text-1")
					.evaluate((element) => element.innerText),
			)
			.toBe(PLAY_BY_PLAY_TEXT);
		await page.locator("#play-by-play-edits-loaded-text-1").press("Control+End");
		await page.getByRole("button", { name: "Minecraft 1 Reg", exact: true }).click();
		await page.keyboard.type(" appended");
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		await page.locator("#play-by-play-edits-load-button").click();
		await expect
			.poll(() =>
				page
					.locator(
						'#play-by-play-edits-loaded-text-1 [data-font-style="minecraft-regular-1"]',
					)
					.evaluateAll((spans) => spans.map((span) => span.textContent).join("")),
			)
			.toBe(" appended");
		await expect
			.poll(() =>
				page
					.locator("#play-by-play-edits-loaded-text-1")
					.evaluate((element) => element.innerText),
			)
			.toBe(`${PLAY_BY_PLAY_TEXT} appended`);
	});

	test("single-block editing waits for Save, overwrites only its key, and resets the editor", async ({
		page,
	}) => {
		await page.locator("#play-by-play-edits-block-dropdown-button").click();
		await page.locator("#play-by-play-edits-block-option-1").click();
		const load = page.getByRole("button", { name: "Load Play by Play", exact: true });
		await expect(load).toBeEnabled();
		expect(await load.evaluate((element) => getComputedStyle(element).boxShadow)).toContain(
			"rgb(122, 86, 18) 0px 4px 0px 0px",
		);
		const original = await page.evaluate(() => ({
			steps: JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			descriptions: localStorage.getItem("zoologistExplorer02.blockDescriptions"),
		}));
		await load.click();
		await expect(page.locator(".play-by-play-edits-loaded-text")).toHaveCount(1);
		await expect(page.locator("#description-edits-loaded-scroll-region")).toHaveCount(0);
		const field = page.getByLabel("Block 1", { exact: true });
		await expect(field).toHaveText(PLAY_BY_PLAY_TEXT);
		const edited = "Edited first step.\n\nReplacement, not appended steps.";
		await field.fill(edited);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual(original.steps);
		const save = page.getByRole("button", { name: "Save Play by Play", exact: true });
		await expect(save).toHaveText("Save");
		await expect(save).toHaveAttribute("title", "Save Play by Play");
		await save.press("Enter");
		await expect(page.locator("#play-by-play-edits-loaded-scroll-region")).toHaveCount(0);
		const editor = page.locator("#play-by-play-edits-text-box");
		await expect(editor).toHaveText("");
		await expect(editor).toBeFocused();
		expect(
			await editor.evaluate((element) => ({
				caretAtStart: (() => {
					const selection = window.getSelection();
					return (
						selection?.isCollapsed &&
						selection.anchorNode === element &&
						selection.anchorOffset === 0
					);
				})(),
				top: element.scrollTop,
				left: element.scrollLeft,
			})),
		).toEqual({ caretAtStart: true, top: 0, left: 0 });
		const expected = { ...original.steps, "2026-10-01::math::1": edited };
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual(expected);
		expect(
			await page.evaluate(() =>
				localStorage.getItem("zoologistExplorer02.blockDescriptions"),
			),
		).toBe(original.descriptions);
		await load.click();
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveText(edited);
		await page.reload();
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual(expected);
	});

	test("All Blocks groups identical non-empty steps without creating empty block values", async ({
		page,
	}) => {
		await page.locator("#play-by-play-edits-block-dropdown-button").click();
		await page.locator("#play-by-play-edits-block-option-all").click();
		const original = await page.evaluate(() => ({
			steps: JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			descriptions: localStorage.getItem("zoologistExplorer02.blockDescriptions"),
		}));
		await page.locator("#play-by-play-edits-load-button").click();
		await expect(page.locator(".play-by-play-edits-loaded-text")).toHaveCount(1);
		await expect(page.getByLabel("Blocks 1, 3", { exact: true })).toHaveText(PLAY_BY_PLAY_TEXT);
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveCount(0);
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual(original.steps);
		await page.locator("#play-by-play-edits-load-button").click();
		const edited = "Identical steps replaced together.";
		await page.getByLabel("Blocks 1, 3", { exact: true }).fill(edited);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual(original.steps);
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual({
			...original.steps,
			"2026-10-01::math::1": edited,
			"2026-10-01::math::3": edited,
		});
		expect(
			await page.evaluate(() =>
				localStorage.getItem("zoologistExplorer02.blockDescriptions"),
			),
		).toBe(original.descriptions);
		await expect(page.locator("#play-by-play-edits-loaded-scroll-region")).toHaveCount(0);
		await expect(page.locator("#play-by-play-edits-text-box")).toHaveText("");
		await expect(page.locator("#play-by-play-edits-text-box")).toBeFocused();
	});

	test("differing steps have labeled scrollable fields and Save writes only changed blocks", async ({
		page,
	}) => {
		await page.locator("#play-by-play-edits-block-dropdown-button").click();
		await page.locator("#play-by-play-edits-block-option-2").click();
		await page.locator("#play-by-play-edits-load-button").click();
		await expect(page.locator("#play-by-play-edits-loaded-scroll-region")).toHaveCount(0);
		const longSteps = "A long Play by Play step.\n".repeat(100);
		await page.locator("#play-by-play-edits-text-box").fill(longSteps);
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		await page.locator("#play-by-play-edits-block-dropdown-button").click();
		await page.locator("#play-by-play-edits-block-option-all").click();
		await page.locator("#play-by-play-edits-load-button").click();
		await expect(page.locator(".play-by-play-edits-loaded-text")).toHaveCount(3);
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveText(PLAY_BY_PLAY_TEXT);
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveText(longSteps);
		await expect(page.getByLabel("Block 3", { exact: true })).toHaveText(PLAY_BY_PLAY_TEXT);
		const region = page.locator("#play-by-play-edits-loaded-scroll-region");
		const geometry = await region.evaluate((element) => {
			const styles = getComputedStyle(element);
			const parentStyles = getComputedStyle(element.parentElement);
			return {
				height: element.getBoundingClientRect().height,
				rightInset:
					element.parentElement.getBoundingClientRect().right -
					element.getBoundingClientRect().right -
					Number.parseFloat(parentStyles.paddingRight) -
					Number.parseFloat(parentStyles.borderRightWidth),
				overflow: styles.overflowY,
				direction: styles.direction,
				hasOverflow: element.scrollHeight > element.clientHeight,
			};
		});
		expect(geometry).toEqual({
			height: 772,
			rightInset: 0,
			overflow: "scroll",
			direction: "ltr",
			hasOverflow: true,
		});
		await region.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});
		expect(await region.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		const longField = page.getByLabel("Block 2", { exact: true });
		await longField.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});
		expect(await longField.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		const original = await page.evaluate(() => {
			globalThis.playByPlayStorageWrites = [];
			const setItem = Storage.prototype.setItem;
			Storage.prototype.setItem = function (key, value) {
				if (key === "zoologistExplorer02.blockPlayByPlay") {
					globalThis.playByPlayStorageWrites.push(JSON.parse(value));
				}
				return setItem.call(this, key, value);
			};
			return {
				steps: JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
				descriptions: localStorage.getItem("zoologistExplorer02.blockDescriptions"),
			};
		});
		const edited = "Only the second block's steps changed.";
		await longField.fill(edited);
		expect(await page.evaluate(() => globalThis.playByPlayStorageWrites)).toEqual([]);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual(original.steps);
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		const expected = { ...original.steps, "2026-10-01::math::2": edited };
		expect(await page.evaluate(() => globalThis.playByPlayStorageWrites)).toEqual([expected]);
		expect(
			await page.evaluate(() =>
				JSON.parse(localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
			),
		).toEqual(expected);
		expect(
			await page.evaluate(() =>
				localStorage.getItem("zoologistExplorer02.blockDescriptions"),
			),
		).toBe(original.descriptions);
		await expect(region).toHaveCount(0);
		await expect(page.locator("#play-by-play-edits-text-box")).toHaveText("");
		await expect(page.locator("#play-by-play-edits-text-box")).toBeFocused();
		await page.locator("#play-by-play-edits-load-button").click();
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveText(edited);
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		expect(await page.evaluate(() => globalThis.playByPlayStorageWrites)).toEqual([expected]);
	});
});

test.describe("Description selection summary", () => {
	test.use({ viewport: { width: 1440, height: 1200 } });

	test.beforeEach(async ({ page }) => {
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#description-edits-button").click();
		await page.locator("#description-edits-description-button").click();
	});

	for (const selection of [
		{
			name: "subject",
			button: "#description-edits-subject-dropdown-button",
			option: "#description-edits-subject-option-math",
		},
		{
			name: "date",
			button: "#description-edits-date-dropdown-button",
			option: "#description-edits-month-option-2026-9",
		},
		{
			name: "block",
			button: "#description-edits-block-dropdown-button",
			option: "#description-edits-block-option-1",
		},
	]) {
		test(`appears without resizing the container after selecting a ${selection.name}`, async ({
			page,
		}) => {
			const summary = page.locator("#description-edits-selection-summary");
			const controls = page.locator("#description-edits-controls-row");
			await expect(summary).toBeHidden();
			const initialControls = await controls.boundingBox();
			const initialPanel = await page
				.locator("#description-edits-panel-container")
				.boundingBox();
			await page.locator(selection.button).click();
			await expect(summary).toBeHidden();
			if (selection.name === "date") {
				await page.locator("#description-edits-month-dropdown-button").click();
			}
			await page.locator(selection.option).click();
			await expect(summary).toBeVisible();
			await expect(summary).toHaveCount(1);
			const selectedControls = await controls.boundingBox();
			const selectedPanel = await page
				.locator("#description-edits-panel-container")
				.boundingBox();
			expect(selectedControls).toEqual(initialControls);
			expect(selectedPanel).toEqual(initialPanel);
			const summaryBox = await summary.boundingBox();
			for (const selector of [
				"#description-edits-date-dropdown-button",
				"#description-edits-subject-dropdown-button",
				"#description-edits-block-dropdown-button",
			]) {
				const buttonBox = await page.locator(selector).boundingBox();
				expect(summaryBox.y + summaryBox.height).toBeLessThanOrEqual(buttonBox.y);
			}
			await page.locator("#description-edits-play-by-play-button").click();
			await expect(summary).toBeHidden();
			await page.locator("#description-edits-description-button").click();
			await expect(summary).toBeVisible();
			await page.locator("#description-edits-description-button").click();
			await expect(summary).toHaveCount(0);
		});
	}

	test("Play by Play displays the same selection text and placement as Description", async ({
		page,
	}) => {
		const layouts = [];
		for (const mode of ["description", "play-by-play"]) {
			if (mode === "play-by-play") {
				await page.locator("#description-edits-play-by-play-button").click();
			}
			const prefix = mode === "description" ? "description-edits" : "play-by-play-edits";
			await page.locator(`#${prefix}-date-dropdown-button`).click();
			for (const [field, option] of [
				["month", "month-option-2026-9"],
				["day", "day-option-1"],
				["year", "year-option-2027"],
			]) {
				await page.locator(`#${prefix}-${field}-dropdown-button`).click();
				await page.locator(`#${prefix}-${option}`).click();
			}
			await page.locator(`#${prefix}-date-dropdown-button`).click();
			await page.locator(`#${prefix}-subject-dropdown-button`).click();
			await page.locator(`#${prefix}-subject-option-math`).click();
			await page.locator(`#${prefix}-block-dropdown-button`).click();
			await page.locator(`#${prefix}-block-option-all`).click();
			const summary = page.locator("#description-edits-selection-summary");
			await expect(summary).toBeVisible();
			await expect(summary.locator("span")).toHaveText([
				"Date: 10/01/27",
				"Subject: Math",
				"Block: All",
			]);
			layouts.push(
				await summary.evaluate((element) =>
					[...element.children].map((field) => {
						const range = document.createRange();
						range.selectNodeContents(field);
						const { x, y, width, height } = range.getBoundingClientRect();
						const styles = getComputedStyle(field);
						return { x, y, width, height, font: styles.font, color: styles.color };
					}),
				),
			);
		}
		expect(layouts[1]).toEqual(layouts[0]);
	});

	test("formats the date, subjects and blocks in order with 16px text gaps", async ({ page }) => {
		await page.locator("#description-edits-date-dropdown-button").click();
		await page.locator("#description-edits-month-dropdown-button").click();
		await page.locator("#description-edits-month-option-2026-9").click();
		await expect(page.locator("#description-edits-selection-date")).toHaveCount(0);
		await page.locator("#description-edits-day-dropdown-button").click();
		await page.locator("#description-edits-day-option-1").click();
		await page.locator("#description-edits-year-dropdown-button").click();
		await page.locator("#description-edits-year-option-2027").click();
		await expect(page.locator("#description-edits-selection-date")).toHaveText(
			"Date: 10/01/27",
		);
		await page.locator("#description-edits-date-dropdown-button").click();
		await page.locator("#description-edits-block-dropdown-button").click();
		await page.locator("#description-edits-block-option-all").click();

		for (const subject of [
			{ key: "math", label: "Math" },
			{ key: "language-arts", label: "Language Arts" },
			{ key: "social-studies", label: "Social Studies" },
			{ key: "science", label: "Science" },
		]) {
			await page.locator("#description-edits-subject-dropdown-button").click();
			await page.locator(`#description-edits-subject-option-${subject.key}`).click();
			await expect(page.locator("#description-edits-selection-subject")).toHaveText(
				`Subject: ${subject.label}`,
			);
			const layout = await page
				.locator("#description-edits-selection-summary")
				.evaluate((element) => {
					const fields = [...element.children];
					const bounds = fields.map((field) => {
						const range = document.createRange();
						range.selectNodeContents(field);
						const { left, right, top, bottom } = range.getBoundingClientRect();
						return { left, right, top, bottom };
					});
					return {
						ids: fields.map((field) => field.id),
						bounds,
						left: element.getBoundingClientRect().left,
						fits: element.scrollWidth <= element.clientWidth,
					};
				});
			expect(layout.ids).toEqual([
				"description-edits-selection-date",
				"description-edits-selection-subject",
				"description-edits-selection-block",
			]);
			expect(layout.bounds[0].left).toBe(layout.left);
			expect(layout.bounds[1].left - layout.bounds[0].right).toBe(16);
			expect(layout.bounds[2].left - layout.bounds[1].right).toBe(16);
			expect(layout.bounds[1].top).toBe(layout.bounds[0].top);
			expect(layout.bounds[2].top).toBe(layout.bounds[0].top);
			expect(layout.fits).toBe(true);
		}
		for (const block of [1, 2, 3, "all"]) {
			await page.locator("#description-edits-block-dropdown-button").click();
			await page.locator(`#description-edits-block-option-${block}`).click();
			await expect(page.locator("#description-edits-selection-block")).toHaveText(
				`Block: ${block === "all" ? "All" : block}`,
			);
		}
		await page.locator("#description-edits-date-dropdown-button").click();
		await page.locator("#description-edits-month-dropdown-button").click();
		await page.locator("#description-edits-month-option-2026-9").click();
		await expect(page.locator("#description-edits-selection-date")).toHaveText(
			"Date: 10/01/27",
		);
	});
});

test("Blocks sidebar is 336px wide and Description Edits commit reaches the calendar", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();

	const blocksSidebar = page.locator("#blocks-menu-sidebar");
	await expect(blocksSidebar).toBeVisible();
	const sidebarBox = await blocksSidebar.evaluate((element) => {
		const { x, width, top, height } = element.getBoundingClientRect();
		return { x, width, top, height };
	});
	expect(sidebarBox.x).toBe(0);
	expect(sidebarBox.width).toBe(336);
	expect(sidebarBox.top).toBe(0);
	expect(sidebarBox.height).toBeGreaterThanOrEqual(page.viewportSize().height);

	const descriptionEditsButton = page.locator("#description-edits-button");
	await expect(descriptionEditsButton).toHaveClass(/description-edits-button--active/);
	await expect(page.locator("#description-edits-text-box")).toBeVisible();
	await expect(page.locator("#description-edits-commit-button")).toHaveCount(0);
	await expect(page.locator("#math-curriculum-october-button")).toBeHidden();
	await expect(page.locator("#math-curriculum-october-button")).toBeDisabled();
	const defaultEditorGap = await page.evaluate(() => {
		const textBox = document
			.querySelector("#description-edits-text-box")
			.getBoundingClientRect();
		const curriculumButton = document
			.querySelector("#math-curriculum-october-button")
			.getBoundingClientRect();
		return curriculumButton.top - textBox.bottom;
	});
	expect(defaultEditorGap).toBe(16);

	await page.locator("#description-edits-description-button").click();
	await expect(page.locator("#description-edits-commit-button")).toBeVisible();

	await clickOffscreenControl(page, "#description-edits-date-dropdown-button");
	await clickOffscreenControl(page, "#description-edits-month-dropdown-button");
	await page.locator("#description-edits-month-option-2026-9").click();
	await clickOffscreenControl(page, "#description-edits-day-dropdown-button");
	await page.locator("#description-edits-day-option-16").click();
	await clickOffscreenControl(page, "#description-edits-year-dropdown-button");
	await page.locator("#description-edits-year-option-2026").click();
	await clickOffscreenControl(page, "#description-edits-subject-dropdown-button");
	await page.locator("#description-edits-subject-option-math").click();
	await clickOffscreenControl(page, "#description-edits-block-dropdown-button");
	await page.locator("#description-edits-block-option-2").click();

	await page.locator("#description-edits-text-box").fill(COMMIT_TEXT);
	await applyDescriptionFontStyle(
		page,
		"#description-edits-text-box",
		"description",
		"Minecraft 2 Bold",
	);
	await clickOffscreenControl(page, "#description-edits-commit-button");
	const storedDescriptions = await page.evaluate(() =>
		JSON.parse(globalThis.localStorage.getItem("zoologistExplorer02.blockDescriptions")),
	);
	expect(storedDescriptions["2026-10-16::math::2"]).toContain(
		'<span data-font-style="minecraft-regular-2-bold">description</span>',
	);

	await clickOffscreenControl(page, "#description-edits-history-dropdown-button");
	const historyList = page.locator("#description-edits-history-options-list");
	await expect(historyList).toBeVisible();
	const historyOption = historyList.locator(".description-edits-history-option-button", {
		hasText: /Math \d{2}\/\d{2}\/\d{2}/,
	});
	await expect(historyOption).toHaveCount(1);

	await historyOption.click();
	await expect
		.poll(() =>
			page.locator("#description-edits-text-box").evaluate((editor) => editor.innerText),
		)
		.toBe(COMMIT_TEXT);

	await page.locator("#description-edits-play-by-play-button").click();
	await expect(page.locator("#play-by-play-edits-commit-button")).toBeVisible();
	await clickOffscreenControl(page, "#play-by-play-edits-date-dropdown-button");
	await clickOffscreenControl(page, "#play-by-play-edits-month-dropdown-button");
	await page.locator("#play-by-play-edits-month-option-2026-9").click();
	await clickOffscreenControl(page, "#play-by-play-edits-day-dropdown-button");
	await page.locator("#play-by-play-edits-day-option-16").click();
	await clickOffscreenControl(page, "#play-by-play-edits-year-dropdown-button");
	await page.locator("#play-by-play-edits-year-option-2026").click();
	await clickOffscreenControl(page, "#play-by-play-edits-subject-dropdown-button");
	await page.locator("#play-by-play-edits-subject-option-math").click();
	await clickOffscreenControl(page, "#play-by-play-edits-block-dropdown-button");
	await page.locator("#play-by-play-edits-block-option-2").click();
	await page.locator("#play-by-play-edits-text-box").fill(PLAY_BY_PLAY_TEXT);
	await applyDescriptionFontStyle(
		page,
		"#play-by-play-edits-text-box",
		"First step",
		"Minecraft 2 Ital",
	);
	await clickOffscreenControl(page, "#play-by-play-edits-commit-button");
	const storedPlayByPlay = await page.evaluate(() =>
		JSON.parse(globalThis.localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
	);
	expect(storedPlayByPlay["2026-10-16::math::2"]).toContain(
		'<span data-font-style="minecraft-regular-2-italic">First step</span>',
	);

	await page.locator("#blocks-screen-back-button").click();
	await page.locator("#student-edits-screen-home-button").click();
	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	const octoberSixteenth = page.locator("#calendar-day-cell-October-2026-18");
	await octoberSixteenth.click();
	await octoberSixteenth.click();

	await page.locator("#daily-menu-math-button").click();
	await page.locator("#daily-menu-math-block-2-button").click();

	const savedDescription = page.locator(
		"#daily-menu-math-block-2-panel .daily-menu-block-saved-description",
	);
	await expect(savedDescription).toBeVisible();
	await expect(savedDescription).toHaveText(COMMIT_TEXT);
	await expect
		.poll(() => savedDescription.evaluate((element) => element.innerText))
		.toBe(COMMIT_TEXT);
	await expect(
		savedDescription.locator('[data-font-style="minecraft-regular-2-bold"]'),
	).toHaveText("description");

	const savedPlayByPlay = page.locator(
		"#daily-menu-math-block-2-panel .daily-menu-block-play-by-play",
	);
	await expect(savedPlayByPlay).toBeVisible();
	await expect(savedPlayByPlay).toHaveText(PLAY_BY_PLAY_TEXT);
	await expect
		.poll(() => savedPlayByPlay.evaluate((element) => element.innerText))
		.toBe(PLAY_BY_PLAY_TEXT);
	await expect(
		savedPlayByPlay.locator('[data-font-style="minecraft-regular-2-italic"]'),
	).toHaveText("First step");
	const descriptionColors = await savedDescription.evaluate((element) => {
		const styles = getComputedStyle(element);
		return { backgroundColor: styles.backgroundColor, backgroundImage: styles.backgroundImage };
	});
	const playByPlayColors = await savedPlayByPlay.evaluate((element) => {
		const styles = getComputedStyle(element);
		return { backgroundColor: styles.backgroundColor, backgroundImage: styles.backgroundImage };
	});
	expect(playByPlayColors).toEqual(descriptionColors);
	const playByPlayGeometry = await page.evaluate(() => {
		const panel = document.querySelector("#daily-menu-math-block-2-panel");
		const playByPlay = panel.querySelector(".daily-menu-block-play-by-play");
		const completeButton = panel.querySelector(".daily-menu-block-complete-button");
		const panelBox = panel.getBoundingClientRect();
		const playBox = playByPlay.getBoundingClientRect();
		const completeBox = completeButton.getBoundingClientRect();
		return {
			height: playBox.height,
			leftInset: playBox.left - panelBox.left,
			rightInset: panelBox.right - playBox.right,
			buttonGap: completeBox.top - playBox.bottom,
		};
	});
	expect(playByPlayGeometry.height).toBe(490.5);
	expect(playByPlayGeometry.leftInset).toBe(16);
	expect(playByPlayGeometry.rightInset).toBe(16);
	expect(playByPlayGeometry.buttonGap).toBe(16);
});

test("Math Curriculum October opens grouped Friday-through-Tuesday buttons with independent toggle states", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#description-edits-button").click();
	await page.locator("#description-edits-play-by-play-button").click();

	const curriculumButton = page.locator("#math-curriculum-october-button");
	await expect(curriculumButton).toBeVisible();
	const launchButtonLayout = await page.evaluate(() => {
		const bounds = (selector) => document.querySelector(selector).getBoundingClientRect();
		const curriculum = bounds("#math-curriculum-october-button");
		const subject = bounds("#play-by-play-edits-subject-dropdown-button");
		const block = bounds("#play-by-play-edits-block-dropdown-button");
		const remove = bounds("#play-by-play-edits-remove-button");
		const curriculumStyle = getComputedStyle(
			document.querySelector("#math-curriculum-october-button"),
		);
		const subjectStyle = getComputedStyle(
			document.querySelector("#play-by-play-edits-subject-dropdown-button"),
		);
		return {
			left: curriculum.left,
			right: curriculum.right,
			blockLeft: block.left,
			removeRight: remove.right,
			gap: remove.top - curriculum.bottom,
			heightRatio: curriculum.height / subject.height,
			backgroundImageMatches:
				curriculumStyle.backgroundImage === subjectStyle.backgroundImage,
			boxShadowMatches: curriculumStyle.boxShadow === subjectStyle.boxShadow,
		};
	});
	expect(launchButtonLayout.left).toBe(launchButtonLayout.blockLeft);
	expect(launchButtonLayout.right).toBe(launchButtonLayout.removeRight);
	expect(launchButtonLayout.gap).toBe(16);
	expect(launchButtonLayout.heightRatio).toBeCloseTo(2, 2);
	expect(launchButtonLayout.backgroundImageMatches).toBe(true);
	expect(launchButtonLayout.boxShadowMatches).toBe(true);
	await curriculumButton.click();
	const screen = page.locator("#math-curriculum-october-screen");
	await expect(screen).toBeVisible();

	const weeks = screen.locator(".math-curriculum-october-week");
	await expect(weeks).toHaveCount(5);
	expect(
		await weeks
			.locator(".math-curriculum-october-date-button")
			.evaluateAll((buttons) => buttons.length),
	).toBe(22);

	const labels = await screen
		.locator(".math-curriculum-october-date-button")
		.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
	expect(labels).toEqual([
		"Math (October 2nd, 2026)",
		"Math (October 3rd, 2026)",
		"Math (October 4th, 2026)",
		"Math (October 5th, 2026)",
		"Math (October 6th, 2026)",
		"Math (October 9th, 2026)",
		"Math (October 10th, 2026)",
		"Math (October 11th, 2026)",
		"Math (October 12th, 2026)",
		"Math (October 13th, 2026)",
		"Math (October 16th, 2026)",
		"Math (October 17th, 2026)",
		"Math (October 18th, 2026)",
		"Math (October 19th, 2026)",
		"Math (October 20th, 2026)",
		"Math (October 23rd, 2026)",
		"Math (October 24th, 2026)",
		"Math (October 25th, 2026)",
		"Math (October 26th, 2026)",
		"Math (October 27th, 2026)",
		"Math (October 30th, 2026)",
		"Math (October 31st, 2026)",
	]);

	const layout = await page.evaluate(() => {
		const menu = document.querySelector("#math-curriculum-october-screen");
		const weekList = document.querySelector("#math-curriculum-october-week-list");
		const firstWeek = document.querySelector(".math-curriculum-october-week");
		const firstButton = document.querySelector(".math-curriculum-october-date-button");
		const buttonStyles = getComputedStyle(firstButton);
		return {
			background: getComputedStyle(menu).backgroundColor,
			buttonColor: buttonStyles.color,
			buttonRadius: buttonStyles.borderRadius,
			weekGap: getComputedStyle(weekList).rowGap,
			weekdayGap: getComputedStyle(firstWeek).columnGap,
			labelsFit: [...document.querySelectorAll(".math-curriculum-october-date-button")].every(
				(button) =>
					button.scrollWidth <= button.clientWidth &&
					button.scrollHeight <= button.clientHeight,
			),
		};
	});
	expect(layout.background).toBe("rgb(12, 59, 34)");
	expect(layout.buttonColor).toBe("rgb(17, 17, 17)");
	expect(layout.buttonRadius).toBe("9999px");
	expect(layout.weekGap).toBe("16px");
	expect(layout.weekdayGap).toBe("16px");
	expect(layout.labelsFit).toBe(true);

	const firstDateButton = screen.locator(".math-curriculum-october-date-button").first();
	await firstDateButton.click();
	await expect(firstDateButton).toHaveAttribute("aria-pressed", "true");
	await expect(firstDateButton).toHaveCSS("box-shadow", /rgba\(255, 225, 0, 0\.98\)/);
	await firstDateButton.click();
	await expect(firstDateButton).toHaveAttribute("aria-pressed", "false");

	await page.setViewportSize({ width: 390, height: 844 });
	const mobileLayout = await page.evaluate(() => {
		const screenElement = document.querySelector("#math-curriculum-october-screen");
		const weekListElement = document.querySelector("#math-curriculum-october-week-list");
		return {
			pageFits: document.documentElement.scrollWidth <= window.innerWidth,
			weekScrolls: weekListElement.scrollWidth > weekListElement.clientWidth,
			buttonWidth: document
				.querySelector(".math-curriculum-october-date-button")
				.getBoundingClientRect().width,
			screenWidth: screenElement.clientWidth,
		};
	});
	expect(mobileLayout.pageFits).toBe(true);
	expect(mobileLayout.weekScrolls).toBe(true);
	expect(mobileLayout.buttonWidth).toBeGreaterThanOrEqual(200);
	expect(mobileLayout.screenWidth).toBe(390);

	await page.locator("#math-curriculum-october-screen-back-button").click();
	await expect(page.locator("#student-edits-screen")).toBeVisible();
	await expect(page.locator("#blocks-menu-sidebar")).toBeVisible();
	await expect(page.locator("#description-edits-button")).toHaveAttribute("aria-pressed", "true");
	await expect(page.locator("#description-edits-position-wrapper")).toBeVisible();
});
