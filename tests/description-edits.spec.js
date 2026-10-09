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
	await page.locator("#blocks-menu-button").click();
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
	await page.locator("#blocks-menu-button").click();
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
	await page.locator("#blocks-menu-button").click();
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
	await page.locator("#blocks-menu-button").click();
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
		await page.locator("#blocks-menu-button").click();
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
	await page.locator("#blocks-menu-button").click();
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
	await page.locator("#blocks-menu-button").click();
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
		await page.locator("#blocks-menu-button").click();
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

test("Description Edits stays depressed while hovered and toggles on click", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#blocks-menu-button").click();

	const button = page.locator("#description-edits-button");
	await button.click();
	await expect(button).toHaveAttribute("aria-pressed", "true");
	await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");

	const bounds = await button.boundingBox();
	await page.mouse.move(1200, 100);
	await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
	await expect(button).toHaveAttribute("aria-pressed", "true");
	await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");

	await button.click();
	await expect(button).toHaveAttribute("aria-pressed", "false");
	await expect(page.locator("#description-edits-panel-container")).toBeHidden();
});

test("Description Edits panel expands on selection and stays fixed across content modes", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#blocks-menu-button").click();
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
	await page.locator("#blocks-menu-button").click();
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
		await page.locator("#blocks-menu-button").click();
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
		await expect(page.locator(mode.editor)).toHaveValue(COMMIT_TEXT);
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
		await page.locator("#blocks-menu-button").click();
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
		await page.locator("#description-edits-text-box").fill("Unsaved description draft.");
		await load.click();
		await expect(page.locator(".description-edits-loaded-text")).toHaveCount(1);
		await expect(page.locator("#play-by-play-edits-loaded-scroll-region")).toHaveCount(0);
		const field = page.getByLabel("Block 1", { exact: true });
		await expect(field).toHaveValue(COMMIT_TEXT);
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
		await expect(editor).toHaveValue("");
		await expect(editor).toBeFocused();
		expect(
			await editor.evaluate((element) => ({
				start: element.selectionStart,
				end: element.selectionEnd,
				top: element.scrollTop,
				left: element.scrollLeft,
			})),
		).toEqual({ start: 0, end: 0, top: 0, left: 0 });
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
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveValue(edited);
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
		await expect(page.getByLabel("Blocks 1, 3", { exact: true })).toHaveValue(COMMIT_TEXT);
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
		await expect(page.locator("#description-edits-text-box")).toHaveValue("");
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
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveValue(COMMIT_TEXT);
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveValue(longDescription);
		await expect(page.getByLabel("Block 3", { exact: true })).toHaveValue(COMMIT_TEXT);
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
		await expect(page.locator("#description-edits-text-box")).toHaveValue("");
		await expect(page.locator("#description-edits-text-box")).toBeFocused();
		await page.locator("#description-edits-load-button").click();
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveValue(edited);
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
		await page.locator("#blocks-menu-button").click();
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
		await page.locator("#play-by-play-edits-text-box").fill("Unsaved Play by Play draft.");
		await load.click();
		await expect(page.locator(".play-by-play-edits-loaded-text")).toHaveCount(1);
		await expect(page.locator("#description-edits-loaded-scroll-region")).toHaveCount(0);
		const field = page.getByLabel("Block 1", { exact: true });
		await expect(field).toHaveValue(PLAY_BY_PLAY_TEXT);
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
		await expect(editor).toHaveValue("");
		await expect(editor).toBeFocused();
		expect(
			await editor.evaluate((element) => ({
				start: element.selectionStart,
				end: element.selectionEnd,
				top: element.scrollTop,
				left: element.scrollLeft,
			})),
		).toEqual({ start: 0, end: 0, top: 0, left: 0 });
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
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveValue(edited);
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
		await expect(page.getByLabel("Blocks 1, 3", { exact: true })).toHaveValue(
			PLAY_BY_PLAY_TEXT,
		);
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
		await expect(page.locator("#play-by-play-edits-text-box")).toHaveValue("");
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
		await expect(page.getByLabel("Block 1", { exact: true })).toHaveValue(PLAY_BY_PLAY_TEXT);
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveValue(longSteps);
		await expect(page.getByLabel("Block 3", { exact: true })).toHaveValue(PLAY_BY_PLAY_TEXT);
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
		await expect(page.locator("#play-by-play-edits-text-box")).toHaveValue("");
		await expect(page.locator("#play-by-play-edits-text-box")).toBeFocused();
		await page.locator("#play-by-play-edits-load-button").click();
		await expect(page.getByLabel("Block 2", { exact: true })).toHaveValue(edited);
		await page.locator("#play-by-play-edits-commit-button").press("Enter");
		expect(await page.evaluate(() => globalThis.playByPlayStorageWrites)).toEqual([expected]);
	});
});

test.describe("Description selection summary", () => {
	test.use({ viewport: { width: 1440, height: 1200 } });

	test.beforeEach(async ({ page }) => {
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Student Edits" }).click();
		await page.locator("#blocks-menu-button").click();
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
	await page.locator("#blocks-menu-button").click();

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
	await descriptionEditsButton.click();
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
	await page.locator("#description-edits-day-option-5").click();
	await clickOffscreenControl(page, "#description-edits-year-dropdown-button");
	await page.locator("#description-edits-year-option-2026").click();
	await clickOffscreenControl(page, "#description-edits-subject-dropdown-button");
	await page.locator("#description-edits-subject-option-math").click();
	await clickOffscreenControl(page, "#description-edits-block-dropdown-button");
	await page.locator("#description-edits-block-option-2").click();

	await page.locator("#description-edits-text-box").fill(COMMIT_TEXT);
	await clickOffscreenControl(page, "#description-edits-commit-button");

	const storedDescriptions = await page.evaluate(() =>
		JSON.parse(globalThis.localStorage.getItem("zoologistExplorer02.blockDescriptions")),
	);
	expect(storedDescriptions["2026-10-05::math::2"]).toBe(COMMIT_TEXT);

	await clickOffscreenControl(page, "#description-edits-history-dropdown-button");
	const historyList = page.locator("#description-edits-history-options-list");
	await expect(historyList).toBeVisible();
	const historyOption = historyList.locator(".description-edits-history-option-button", {
		hasText: /Math \d{2}\/\d{2}\/\d{2}/,
	});
	await expect(historyOption).toHaveCount(1);

	await historyOption.click();
	await expect(page.locator("#description-edits-text-box")).toHaveValue(COMMIT_TEXT);

	await page.locator("#description-edits-play-by-play-button").click();
	await expect(page.locator("#play-by-play-edits-commit-button")).toBeVisible();
	await clickOffscreenControl(page, "#play-by-play-edits-date-dropdown-button");
	await clickOffscreenControl(page, "#play-by-play-edits-month-dropdown-button");
	await page.locator("#play-by-play-edits-month-option-2026-9").click();
	await clickOffscreenControl(page, "#play-by-play-edits-day-dropdown-button");
	await page.locator("#play-by-play-edits-day-option-5").click();
	await clickOffscreenControl(page, "#play-by-play-edits-year-dropdown-button");
	await page.locator("#play-by-play-edits-year-option-2026").click();
	await clickOffscreenControl(page, "#play-by-play-edits-subject-dropdown-button");
	await page.locator("#play-by-play-edits-subject-option-math").click();
	await clickOffscreenControl(page, "#play-by-play-edits-block-dropdown-button");
	await page.locator("#play-by-play-edits-block-option-2").click();
	await page.locator("#play-by-play-edits-text-box").fill(PLAY_BY_PLAY_TEXT);
	await clickOffscreenControl(page, "#play-by-play-edits-commit-button");
	const storedPlayByPlay = await page.evaluate(() =>
		JSON.parse(globalThis.localStorage.getItem("zoologistExplorer02.blockPlayByPlay")),
	);
	expect(storedPlayByPlay["2026-10-05::math::2"]).toBe(PLAY_BY_PLAY_TEXT);

	await page.locator("#description-edits-button").click();
	await page.locator("#blocks-menu-button").evaluate((element) => element.click());
	await page.locator("#student-edits-screen-home-button").click();
	await page.reload();
	await page.getByRole("button", { name: "Open student section" }).click();
	const octoberFifth = page.locator("#calendar-day-cell-October-2026-7");
	await octoberFifth.click();
	await octoberFifth.click();

	await page.locator("#daily-menu-math-button").click();
	await page.locator("#daily-menu-math-block-2-button").click();

	const savedDescription = page.locator(
		"#daily-menu-math-block-2-panel .daily-menu-block-saved-description",
	);
	await expect(savedDescription).toBeVisible();
	await expect(savedDescription).toHaveText(COMMIT_TEXT);

	const savedPlayByPlay = page.locator(
		"#daily-menu-math-block-2-panel .daily-menu-block-play-by-play",
	);
	await expect(savedPlayByPlay).toBeVisible();
	await expect(savedPlayByPlay).toHaveText(PLAY_BY_PLAY_TEXT);
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

test("Math Curriculum October opens grouped weekday buttons with independent toggle states", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Student Edits" }).click();
	await page.locator("#blocks-menu-button").click();
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
	await expect(weeks).toHaveCount(4);
	for (const week of await weeks.all()) {
		await expect(week.locator(".math-curriculum-october-date-button")).toHaveCount(5);
	}

	const labels = await screen
		.locator(".math-curriculum-october-date-button")
		.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
	expect(labels).toEqual([
		"Math (October 5th, 2026)",
		"Math (October 6th, 2026)",
		"Math (October 7th, 2026)",
		"Math (October 8th, 2026)",
		"Math (October 9th, 2026)",
		"Math (October 12th, 2026)",
		"Math (October 13th, 2026)",
		"Math (October 14th, 2026)",
		"Math (October 15th, 2026)",
		"Math (October 16th, 2026)",
		"Math (October 19th, 2026)",
		"Math (October 20th, 2026)",
		"Math (October 21st, 2026)",
		"Math (October 22nd, 2026)",
		"Math (October 23rd, 2026)",
		"Math (October 26th, 2026)",
		"Math (October 27th, 2026)",
		"Math (October 28th, 2026)",
		"Math (October 29th, 2026)",
		"Math (October 30th, 2026)",
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
