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
	const activeShadow = await blockEditsButton.evaluate(
		(button) => getComputedStyle(button).boxShadow,
	);
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

test("Grid Applied defaults on and applies to the next template without a prompt", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-grid-button").click();

	const appliedButton = page.locator("#grid-applied-button");
	await expect(appliedButton).toHaveText("On");
	await expect(appliedButton).toHaveAttribute("aria-pressed", "true");
	await appliedButton.click();
	await expect(appliedButton).toHaveText("Off");
	await expect(page.locator("#grid-menu-selection-prompt")).toHaveCount(0);

	await appliedButton.click();
	await expect(appliedButton).toHaveText("On");
	await page.locator("#text-editor-template-new-button").click();
	await page.locator("#text-editor-new-create-template-button").click();
	const paper = page.locator("#print-preview-paper");
	await expect(paper).toBeVisible();
	await expect(paper).toHaveAttribute("data-grid-applied", "true");
});

test("Shape Removal highlights applied template shapes in a green-yellow checkerboard", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-new-button").click();
	await page.locator("#text-editor-new-create-template-button").click();
	await page.locator("#text-editor-grid-button").click();
	await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();

	const shapeRemovalButton = page.locator("#grid-menu-shape-removal-button");
	await shapeRemovalButton.click();
	await expect(shapeRemovalButton).toHaveAttribute("aria-pressed", "true");

	const highlightedArea = page.locator("[data-grid-shape-area]");
	await expect(highlightedArea).toHaveAttribute("data-grid-removal-highlight", "true");
	const highlightedShapes = page.locator(
		"#print-preview-grid-removal-pattern [data-grid-highlight-row]",
	);
	await expect(highlightedShapes).toHaveCount(4);
	await expect(highlightedShapes.nth(0)).toHaveAttribute("fill", "#00ff40");
	await expect(highlightedShapes.nth(1)).toHaveAttribute("fill", "#ffff00");
	await expect(highlightedShapes.nth(2)).toHaveAttribute("fill", "#ffff00");
	await expect(highlightedShapes.nth(3)).toHaveAttribute("fill", "#00ff40");
	for (let index = 0; index < 4; index += 1) {
		await expect(highlightedShapes.nth(index)).toHaveAttribute("stroke", "#000000");
	}

	await shapeRemovalButton.click();
	await expect(highlightedArea).toHaveAttribute("data-grid-removal-highlight", "false");
	await expect(page.locator("#print-preview-grid-removal-pattern")).toHaveCount(0);
});

test("Shape Removal removes a clicked shape while retaining its outline and surrounding grid", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-new-button").click();
	await page.locator("#text-editor-new-create-template-button").click();
	await page.locator("#text-editor-grid-button").click();
	await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();
	await page.locator("#grid-menu-shape-removal-button").click();

	const grid = page.locator("#print-preview-grid");
	const gridBounds = await grid.boundingBox();
	await grid.click({
		position: { x: gridBounds.width / 8, y: gridBounds.height / 6 },
	});

	const removedShape = page.locator('#print-preview-grid [data-grid-removed-shape="base-0-0"]');
	await expect(removedShape).toHaveAttribute("fill", "#ffffff");
	await expect(removedShape).toHaveAttribute("stroke", "#000000");
	await expect(page.locator("#print-preview-grid [data-grid-removed-shape]")).toHaveCount(1);
	await expect(page.locator("[data-grid-shape-area]")).toHaveAttribute(
		"data-grid-removal-highlight",
		"true",
	);
	await page.locator("#grid-menu-shape-removal-button").click();
	await expect(removedShape).toBeVisible();
	await expect(page.locator("[data-grid-shape-area]")).toHaveAttribute(
		"data-grid-removal-highlight",
		"false",
	);
});

test("Shape Addition highlights applied templates and shells in green-yellow checkerboards", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1080 });

	for (const documentType of ["template", "shell"]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Text Editor" }).click();

		if (documentType === "template") {
			await page.locator("#text-editor-template-new-button").click();
			await page.locator("#text-editor-new-create-template-button").click();
		} else {
			await page.getByRole("button", { name: "New +" }).click();
			await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
		}

		await page.locator("#text-editor-grid-button").click();
		await expect(page.locator("#grid-applied-button")).toHaveAttribute("aria-pressed", "true");
		await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();

		const shapeAdditionButton = page.locator("#grid-menu-shape-addition-button");
		const rowAdditionButton = page.locator("#grid-menu-shape-addition-row-button");
		const columnAdditionButton = page.locator("#grid-menu-shape-addition-column-button");
		await expect(rowAdditionButton).toHaveCount(0);
		await expect(columnAdditionButton).toHaveCount(0);
		await shapeAdditionButton.click();
		await expect(shapeAdditionButton).toHaveAttribute("aria-pressed", "true");
		await expect(rowAdditionButton).toBeVisible();
		await expect(columnAdditionButton).toBeVisible();
		const additionButtonRight = await shapeAdditionButton.evaluate(
			(button) => button.getBoundingClientRect().right,
		);
		const rowButtonLeft = await rowAdditionButton.evaluate(
			(button) => button.getBoundingClientRect().left,
		);
		expect(rowButtonLeft).toBeGreaterThan(additionButtonRight);

		const highlightedArea = page.locator("[data-grid-shape-area]");
		await expect(highlightedArea).toHaveAttribute("data-grid-addition-highlight", "true");
		const highlightedShapes = page.locator(
			"#print-preview-grid-removal-pattern [data-grid-highlight-row]",
		);
		await expect(highlightedShapes).toHaveCount(4);
		await expect(highlightedShapes.nth(0)).toHaveAttribute("fill", "#00ff40");
		await expect(highlightedShapes.nth(1)).toHaveAttribute("fill", "#ffff00");
		await expect(highlightedShapes.nth(2)).toHaveAttribute("fill", "#ffff00");
		await expect(highlightedShapes.nth(3)).toHaveAttribute("fill", "#00ff40");
	}
});

test("Shape Addition inserts the selected shape at the end of a clicked row or column", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1280 });

	for (const documentType of ["template", "shell"]) {
		for (const direction of ["row", "column"]) {
			await page.goto("./");
			await page.getByRole("button", { name: "Open parent section" }).click();
			await page.getByRole("button", { name: "Text Editor" }).click();

			if (documentType === "template") {
				await page.locator("#text-editor-template-new-button").click();
				await page.locator("#text-editor-new-create-template-button").click();
			} else {
				await page.getByRole("button", { name: "New +" }).click();
				await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
			}

			await page.locator("#text-editor-grid-button").click();
			await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();
			await page.locator("#grid-menu-shape-addition-button").click();
			await page.locator(`#grid-menu-shape-addition-${direction}-button`).click();

			await page.locator("#grid-menu-dimensions-dropdown > summary").click();
			await page.locator("#grid-rows-amount").fill("4");
			await page.locator("#grid-columns-amount").fill("4");
			await page.locator("#grid-menu-dimensions-dropdown > summary").click();

			const shapeSelect = page.locator("#grid-menu-shape-addition-selection");
			await expect(shapeSelect).toBeVisible();
			const selectSize = await shapeSelect.evaluate((element) => {
				const bounds = element.getBoundingClientRect();
				return { width: bounds.width, height: bounds.height };
			});
			expect(selectSize).toEqual({ width: 218, height: 24 });
			const shapeMenuOptions = await page
				.locator("#grid-menu-shapes-list > li > button.grid-menu-shapes-option")
				.allTextContents();
			const additionOptions = await shapeSelect.locator("option").allTextContents();
			expect(additionOptions.slice(1)).toEqual(shapeMenuOptions);
			await shapeSelect.selectOption("3");

			const grid = page.locator("#print-preview-grid");
			const originalRows = await grid.getAttribute("data-grid-rows");
			const originalColumns = await grid.getAttribute("data-grid-columns");
			const area = grid.locator("[data-grid-shape-area]");
			const originalWidth = await area.getAttribute("width");
			const originalHeight = await area.getAttribute("height");
			const pattern = grid.locator("#print-preview-grid-shape-pattern");
			const originalCellWidth = await pattern.getAttribute("width");
			const originalCellHeight = await pattern.getAttribute("height");
			const gridBounds = await grid.boundingBox();
			await grid.click({
				position: { x: gridBounds.width / 8, y: gridBounds.height / 6 },
			});

			const addedShape = page.locator(`[data-grid-added-shape="${direction}"]`);
			const packedBaseShapes = grid.locator("[data-grid-packed-base]");
			await expect(addedShape).toHaveCount(1);
			await expect(addedShape).toHaveAttribute("data-grid-added-sides", "3");
			await expect(addedShape).toHaveAttribute(
				direction === "row" ? "data-grid-added-row" : "data-grid-added-column",
				"0",
			);
			await expect(grid).toHaveAttribute("data-grid-rows", originalRows);
			await expect(grid).toHaveAttribute("data-grid-columns", originalColumns);
			await expect(area).toHaveAttribute("width", originalWidth);
			await expect(area).toHaveAttribute("height", originalHeight);
			await expect(pattern).toHaveAttribute("width", originalCellWidth);
			await expect(pattern).toHaveAttribute("height", originalCellHeight);
			await expect(packedBaseShapes).toHaveCount(4);
			if (direction === "row") {
				const rowOverlay = page.locator('[data-grid-row-addition="0"]');
				await expect(rowOverlay).toHaveCount(1);
				const cellWidth = Number(
					await rowOverlay.getAttribute("data-grid-addition-cell-width"),
				);
				const rowWidth = Number(await rowOverlay.getAttribute("width"));
				expect(cellWidth).toBeCloseTo(rowWidth / 5, 3);
				await expect(page.locator('[data-grid-row-addition="1"]')).toHaveCount(0);
				for (let column = 0; column < 4; column += 1) {
					const cell = grid.locator(`[data-grid-packed-base="base-0-${column}"]`);
					const bounds = await cell.evaluate((shape) => {
						const { x, width } = shape.getBBox();
						return { x, width };
					});
					expect(bounds.x).toBeCloseTo(column * cellWidth, 3);
					expect(bounds.width).toBeCloseTo(cellWidth, 3);
				}
			} else {
				const columnOverlay = page.locator('[data-grid-column-addition="0"]');
				await expect(columnOverlay).toHaveCount(1);
				const cellHeight = Number(
					await columnOverlay.getAttribute("data-grid-addition-cell-height"),
				);
				const columnHeight = Number(await columnOverlay.getAttribute("height"));
				expect(cellHeight).toBeCloseTo(columnHeight / 5, 3);
				await expect(page.locator('[data-grid-column-addition="1"]')).toHaveCount(0);
				for (let row = 0; row < 4; row += 1) {
					const cell = grid.locator(`[data-grid-packed-base="base-${row}-0"]`);
					const bounds = await cell.evaluate((shape) => {
						const { y, height } = shape.getBBox();
						return { y, height };
					});
					expect(bounds.y).toBeCloseTo(row * cellHeight, 3);
					expect(bounds.height).toBeCloseTo(cellHeight, 3);
				}
			}
			await page.locator("#grid-menu-shape-addition-button").click();
			await expect(addedShape).toHaveAttribute("fill", "none");
			for (const shape of await packedBaseShapes.all()) {
				await expect(shape).toHaveAttribute("fill", "none");
				await expect(shape).toHaveAttribute("stroke", "#000000");
				await expect(shape).toHaveAttribute("stroke-width", "2");
			}
		}
	}
});

test("Shape Addition fitted shapes remain clickable and retain their outlines after removal", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1280 });

	for (const direction of ["row", "column"]) {
		for (const sides of ["4", "1"]) {
			await page.goto("./");
			await page.getByRole("button", { name: "Open parent section" }).click();
			await page.getByRole("button", { name: "Text Editor" }).click();
			await page.locator("#text-editor-template-new-button").click();
			await page.locator("#text-editor-new-create-template-button").click();
			await page.locator("#text-editor-grid-button").click();
			await page.locator("#grid-menu-dimensions-dropdown > summary").click();
			await page.locator("#grid-rows-amount").fill("4");
			await page.locator("#grid-columns-amount").fill("4");
			await page.locator("#grid-menu-dimensions-dropdown > summary").click();
			await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();
			await page.locator("#grid-menu-shape-addition-button").click();
			await page.locator(`#grid-menu-shape-addition-${direction}-button`).click();
			await page.locator("#grid-menu-shape-addition-selection").selectOption(sides);

			const grid = page.locator("#print-preview-grid");
			const gridBounds = await grid.boundingBox();
			await grid.click({
				position: { x: gridBounds.width / 8, y: gridBounds.height / 8 },
			});
			const addedShapes = grid.locator(`[data-grid-added-shape="${direction}"]`);
			const packedBaseShape = grid.locator('[data-grid-packed-base="base-0-0"]');
			await expect(addedShapes).toHaveCount(1);
			await addedShapes.first().click();
			await expect(addedShapes).toHaveCount(2);
			await packedBaseShape.click();
			await expect(addedShapes).toHaveCount(3);

			await page.locator("#grid-menu-shape-addition-button").click();
			await page.locator("#grid-menu-shape-removal-button").click();
			if (sides === "1") {
				const edgeClick = await addedShapes.first().evaluate((ellipse) => {
					const bounds = ellipse.getBoundingClientRect();
					const inverse = ellipse.getScreenCTM().inverse();
					const halfAngle = Math.PI / 128;
					for (let x = Math.ceil(bounds.left); x <= Math.floor(bounds.right); x += 1) {
						for (
							let y = Math.ceil(bounds.top);
							y <= Math.floor(bounds.bottom);
							y += 1
						) {
							const point = new DOMPoint(x, y).matrixTransform(inverse);
							const localX =
								(point.x - ellipse.cx.baseVal.value) / ellipse.rx.baseVal.value;
							const localY =
								(point.y - ellipse.cy.baseVal.value) / ellipse.ry.baseVal.value;
							const radius = Math.hypot(localX, localY);
							const angle = Math.atan2(localY, localX);
							const edgeAngle =
								(Math.floor(angle / (2 * halfAngle)) + 0.5) * 2 * halfAngle;
							const polygonRadius = Math.cos(halfAngle) / Math.cos(angle - edgeAngle);
							if (radius < 1 && radius > polygonRadius) {
								return { x, y };
							}
						}
					}
					return null;
				});
				expect(edgeClick).not.toBeNull();
				await page.mouse.click(edgeClick.x, edgeClick.y);
			} else {
				await addedShapes.first().click();
			}

			const removedAddedShape = grid.locator('[data-grid-removed-shape^="addition-"]');
			await expect(removedAddedShape).toHaveCount(1);
			await expect(removedAddedShape).toHaveAttribute("fill", "#ffffff");
			await expect(removedAddedShape).toHaveAttribute("stroke", "#000000");
			await expect(removedAddedShape).toHaveAttribute("stroke-width", "2");
			await expect(addedShapes.first()).toHaveAttribute("fill", "#ffffff");

			await packedBaseShape.click();
			const removedBaseShape = grid.locator('[data-grid-removed-shape="base-0-0"]');
			await expect(removedBaseShape).toHaveAttribute("fill", "#ffffff");
			await expect(removedBaseShape).toHaveAttribute("stroke", "#000000");
			await expect(removedBaseShape).toHaveAttribute("stroke-width", "2");
			await expect(removedBaseShape).toHaveAttribute(
				"points",
				await packedBaseShape.getAttribute("points"),
			);
			await expect(grid.locator("[data-grid-removed-shape]")).toHaveCount(2);
			await page.locator("#grid-menu-shape-removal-button").click();
			await expect(removedAddedShape).toBeVisible();
			await expect(removedBaseShape).toBeVisible();
		}
	}
});

async function getGridPackedCoverage(grid) {
	return grid.evaluate((svg) => {
		const pointsOf = (polygon) =>
			Array.from({ length: polygon.points.numberOfItems }, (_, index) => {
				const { x, y } = polygon.points.getItem(index);
				return { x, y };
			});
		const shapes = [
			...svg.querySelectorAll("[data-grid-packed-base], [data-grid-added-shape]"),
		];
		const polygons = shapes.map(pointsOf);
		const maskPolygons = [
			...svg.querySelectorAll("#print-preview-grid-packed-mask polygon"),
		].map(pointsOf);
		const contains = (vertices, x, y) => {
			let inside = false;
			for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
				const a = vertices[i];
				const b = vertices[j];
				if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
					inside = !inside;
				}
			}
			return inside;
		};
		let overlaps = 0;
		let holes = 0;
		let covered = 0;
		for (let row = 0; row < 47; row += 1) {
			for (let column = 0; column < 53; column += 1) {
				const x = ((column + 0.371) * svg.viewBox.baseVal.width) / 53;
				const y = ((row + 0.619) * svg.viewBox.baseVal.height) / 47;
				const owners = polygons.filter((polygon) => contains(polygon, x, y)).length;
				const masked = maskPolygons.some((polygon) => contains(polygon, x, y));
				overlaps += Number(owners > 1);
				holes += Number(!masked || owners === 0);
				covered += Number(owners === 1);
			}
		}
		return {
			overlaps,
			holes,
			covered,
			shapeCount: shapes.length,
			straightBorders: polygons.every(
				(vertices) =>
					vertices.length === 4 &&
					vertices.every((vertex, index) => {
						const next = vertices[(index + 1) % vertices.length];
						return (
							(vertex.x === next.x || vertex.y === next.y) &&
							(vertex.x !== next.x || vertex.y !== next.y)
						);
					}),
			),
			allBordered: shapes.every(
				(shape) =>
					shape.getAttribute("stroke") === "#000000" &&
					shape.getAttribute("stroke-width") === "2",
			),
		};
	});
}

test("Shape Addition keeps mixed additions bordered without overlaps or empty tracks", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1280 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-new-button").click();
	await page.locator("#text-editor-new-create-template-button").click();
	await page.locator("#text-editor-grid-button").click();
	await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();
	await page.locator("#grid-menu-shape-addition-button").click();

	const grid = page.locator("#print-preview-grid");
	const gridBounds = await grid.boundingBox();
	await page.locator("#grid-menu-shape-addition-row-button").click();
	const shapeSelect = page.locator("#grid-menu-shape-addition-selection");
	await shapeSelect.selectOption("4");
	await grid.click({
		position: { x: gridBounds.width * 0.625, y: gridBounds.height * 0.833 },
	});
	await grid.click({
		position: { x: gridBounds.width * 0.5, y: gridBounds.height * 0.833 },
	});

	const rowOverlay = page.locator('[data-grid-row-addition="2"]');
	await expect(rowOverlay).toHaveCount(1);
	const rowCellWidthBeforeColumnAddition = Number(
		await rowOverlay.getAttribute("data-grid-addition-cell-width"),
	);
	const rowShapes = grid.locator('[data-grid-added-shape="row"]');
	await expect(rowShapes).toHaveCount(2);

	await page.locator("#grid-menu-shape-addition-column-button").click();
	await grid.click({
		position: { x: gridBounds.width * 0.875, y: gridBounds.height * 0.5 },
	});
	await grid.click({
		position: { x: gridBounds.width * 0.875, y: gridBounds.height * 0.375 },
	});

	const columnOverlay = page.locator('[data-grid-column-addition="3"]');
	await expect(columnOverlay).toHaveCount(1);
	const columnCellHeight = Number(
		await columnOverlay.getAttribute("data-grid-addition-cell-height"),
	);
	const rowCellWidthAfterColumnAddition = Number(
		await rowOverlay.getAttribute("data-grid-addition-cell-width"),
	);
	expect(rowCellWidthAfterColumnAddition).toBeCloseTo(rowCellWidthBeforeColumnAddition, 3);

	const columnShapes = grid.locator('[data-grid-added-shape="column"]');
	await expect(columnShapes).toHaveCount(2);
	const baseCellCount =
		Number(await grid.getAttribute("data-grid-rows")) *
		Number(await grid.getAttribute("data-grid-columns"));
	await expect(grid.locator("[data-grid-packed-base]")).toHaveCount(baseCellCount);
	const coverage = await getGridPackedCoverage(grid);
	expect(coverage.overlaps).toBe(0);
	expect(coverage.holes).toBe(0);
	expect(coverage.covered).toBe(47 * 53);
	expect(coverage.shapeCount).toBe(baseCellCount + 4);
	expect(coverage.straightBorders).toBe(true);
	expect(coverage.allBordered).toBe(true);
	expect(columnCellHeight).toBeGreaterThan(0);
});

test("Shape Addition keeps mixed borders straight for interior tracks and either addition order", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1280 });

	for (const directions of [
		["row", "column"],
		["column", "row"],
	]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Text Editor" }).click();
		await page.locator("#text-editor-template-new-button").click();
		await page.locator("#text-editor-new-create-template-button").click();
		await page.locator("#text-editor-grid-button").click();
		await page.locator("#grid-menu-dimensions-dropdown > summary").click();
		await page.locator("#grid-rows-amount").fill("4");
		await page.locator("#grid-columns-amount").fill("4");
		await page.locator("#grid-menu-dimensions-dropdown > summary").click();
		await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();
		await page.locator("#grid-menu-shape-addition-button").click();
		await page.locator(`#grid-menu-shape-addition-${directions[0]}-button`).click();
		await page.locator("#grid-menu-shape-addition-selection").selectOption("4");

		const grid = page.locator("#print-preview-grid");
		const gridBounds = await grid.boundingBox();
		await grid.click({
			position: { x: gridBounds.width * 0.625, y: gridBounds.height * 0.375 },
		});
		await page.locator(`#grid-menu-shape-addition-${directions[1]}-button`).click();
		await grid.locator('[data-grid-packed-base="base-1-2"]').click();

		for (const { direction, cells } of [
			{ direction: "row", cells: ["base-1-2", "base-0-2"] },
			{ direction: "column", cells: ["base-1-2", "base-1-2", "base-1-0"] },
		]) {
			const button = page.locator(`#grid-menu-shape-addition-${direction}-button`);
			if ((await button.getAttribute("aria-pressed")) !== "true") {
				await button.click();
			}
			for (const cell of cells) {
				await grid.locator(`[data-grid-packed-base="${cell}"]`).click();
			}
		}

		await expect(grid.locator("[data-grid-packed-base]")).toHaveCount(16);
		await expect(grid.locator('[data-grid-added-shape="row"]')).toHaveCount(3);
		await expect(grid.locator('[data-grid-added-row="0"]')).toHaveCount(1);
		await expect(grid.locator('[data-grid-added-row="1"]')).toHaveCount(2);
		await expect(grid.locator('[data-grid-added-shape="column"]')).toHaveCount(4);
		await expect(grid.locator('[data-grid-added-column="0"]')).toHaveCount(1);
		await expect(grid.locator('[data-grid-added-column="2"]')).toHaveCount(3);
		expect(await getGridPackedCoverage(grid)).toEqual({
			overlaps: 0,
			holes: 0,
			covered: 47 * 53,
			shapeCount: 23,
			straightBorders: true,
			allBordered: true,
		});

		await page.locator("#grid-menu-shape-addition-row-button").click();
		await page.locator("#grid-menu-shape-addition-selection").selectOption("1");
		await grid.locator('[data-grid-packed-base="base-1-2"]').click();
		const addedCircle = grid.locator(
			'ellipse[data-grid-added-shape="row"][data-grid-added-sides="1"]',
		);
		await expect(addedCircle).toHaveCount(1);
		await page.locator("#grid-menu-shape-addition-button").click();
		await page.locator("#grid-menu-shape-removal-button").click();
		await addedCircle.click();
		const removedCircle = grid.locator('ellipse[data-grid-removed-shape="addition-row-1-2"]');
		await expect(removedCircle).toHaveAttribute("fill", "#ffffff");
		await expect(removedCircle).toHaveAttribute("stroke", "#000000");
		await expect(removedCircle).toHaveAttribute("stroke-width", "2");
	}
});

test("Shape Addition persists in a saved template", async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1280 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-new-button").click();
	await page.locator("#text-editor-new-create-template-button").click();
	await page.locator("#text-editor-grid-button").click();
	await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();
	await page.locator("#grid-menu-shape-addition-button").click();
	await page.locator("#grid-menu-shape-addition-row-button").click();
	await page.locator("#grid-menu-shape-addition-selection").selectOption("3");

	await page.locator("#grid-menu-dimensions-dropdown > summary").click();
	await page.locator("#grid-rows-amount").fill("4");
	await page.locator("#grid-columns-amount").fill("4");
	await page.locator("#grid-menu-dimensions-dropdown > summary").click();
	const grid = page.locator("#print-preview-grid");
	const gridBounds = await grid.boundingBox();
	await grid.click({
		position: { x: gridBounds.width / 8, y: gridBounds.height / 6 },
	});
	await expect(page.locator('[data-grid-row-addition="0"]')).toHaveCount(1);
	await page.locator("#grid-menu-shape-addition-column-button").click();
	await grid.click({
		position: { x: gridBounds.width * 0.375, y: gridBounds.height * 0.375 },
	});
	await expect(grid.locator('[data-grid-added-shape="column"]')).toHaveCount(1);
	const packedGeometry = await grid
		.locator("[data-grid-packed-base]")
		.evaluateAll((shapes) => shapes.map((shape) => shape.getAttribute("points")));

	await page.locator("#text-editor-grid-button").click();
	await page.locator("#text-editor-template-save-button").click();
	await page.locator("#text-editor-template-name-input").fill("Saved Shape Addition");
	await page.getByRole("button", { name: "Save Template" }).click();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);

	await page.reload();
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-load-button").click();
	await page.getByRole("button", { name: "Saved Shape Addition", exact: true }).click();
	await expect(page.locator("#print-preview-grid")).toHaveAttribute("data-grid-rows", "4");
	await expect(page.locator("#print-preview-grid")).toHaveAttribute("data-grid-columns", "4");
	await expect(page.locator('[data-grid-row-addition="0"]')).toHaveCount(1);
	await expect(page.locator('[data-grid-added-shape="row"]')).toHaveAttribute(
		"data-grid-added-sides",
		"3",
	);
	await expect(page.locator('[data-grid-added-shape="column"]')).toHaveCount(1);
	expect(
		await page
			.locator("[data-grid-packed-base]")
			.evaluateAll((shapes) => shapes.map((shape) => shape.getAttribute("points"))),
	).toEqual(packedGeometry);
});

test("Shape Swap highlights applied templates and shells with bordered green-yellow alternation", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1080 });

	for (const documentType of ["template", "shell"]) {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Text Editor" }).click();

		if (documentType === "template") {
			await page.locator("#text-editor-template-new-button").click();
			await page.locator("#text-editor-new-create-template-button").click();
		} else {
			await page.getByRole("button", { name: "New +" }).click();
			await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
		}

		await page.locator("#text-editor-grid-button").click();
		await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();

		const shapeSwapButton = page.locator("#grid-menu-shape-swap-button");
		await shapeSwapButton.click();
		await expect(shapeSwapButton).toHaveAttribute("aria-pressed", "true");

		const appliedButton = page.locator("#grid-applied-button");
		const highlightedArea = page.locator("[data-grid-shape-area]");
		await appliedButton.click();
		await expect(page.locator("#print-preview-grid")).toHaveCount(0);
		await expect(page.locator("#print-preview-grid-removal-pattern")).toHaveCount(0);

		await appliedButton.click();
		await expect(highlightedArea).toHaveAttribute("data-grid-swap-highlight", "true");
		const pattern = page.locator("#print-preview-grid-removal-pattern");
		const highlightedShapes = pattern.locator("[data-grid-highlight-row]");
		await expect(highlightedShapes).toHaveCount(4);
		const expectedCells = [
			{ row: "0", column: "0", fill: "#00ff40" },
			{ row: "0", column: "1", fill: "#ffff00" },
			{ row: "1", column: "0", fill: "#ffff00" },
			{ row: "1", column: "1", fill: "#00ff40" },
		];

		for (const [index, cell] of expectedCells.entries()) {
			const shape = highlightedShapes.nth(index);
			await expect(shape).toHaveAttribute("data-grid-highlight-row", cell.row);
			await expect(shape).toHaveAttribute("data-grid-highlight-column", cell.column);
			await expect(shape).toHaveAttribute("fill", cell.fill);
			await expect(shape).toHaveAttribute("stroke", "#000000");
			await expect(shape).toHaveAttribute("stroke-width", "2");
		}
	}
});

test("Text Editor prints only the selected paper and respects the grid Printable toggle", async ({
	page,
}) => {
	await page.addInitScript(() => {
		window.__printCallCount = 0;
		window.print = () => {
			window.__printCallCount += 1;
		};
	});
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	const printButton = page.locator("#text-editor-print-button");
	const measureHomeGap = (selector) =>
		printButton.evaluate((button, homeSelector) => {
			const printBounds = button.getBoundingClientRect();
			const homeBounds = document.querySelector(homeSelector).getBoundingClientRect();
			return homeBounds.left - printBounds.right;
		}, selector);
	expect(await measureHomeGap("#text-editor-home-button")).toBe(16);
	await expect(printButton).toHaveCSS("top", "16px");
	await expect(page.locator("#text-editor-home-button")).toHaveCSS("top", "16px");
	await expect(page.locator("#parent-screen-back-button")).toHaveCSS("top", "16px");

	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();

	expect(await measureHomeGap("#text-editor-workflow-home-button")).toBe(16);

	await printButton.click();
	expect(await page.evaluate(() => window.__printCallCount)).toBe(1);

	await page.getByRole("button", { name: "Grid", exact: true }).click();
	const grid = page.locator("#print-preview-grid");
	await expect(grid).toBeVisible();
	const bottomAlignmentButton = page.locator("#grid-alignment-bottom-button");
	const topAlignmentButton = page.locator("#grid-alignment-top-button");
	const gridAreaHeight = await grid.evaluate((element) =>
		Number(element.getAttribute("viewBox").split(" ")[3]),
	);
	const renderedGridHeight = await grid
		.locator("[data-grid-shape-area]")
		.evaluate((area) => Number(area.getAttribute("height")));
	const expectedBottomOffset = Math.max(0, gridAreaHeight - renderedGridHeight);
	expect(expectedBottomOffset).toBeGreaterThanOrEqual(0);
	const getGridVerticalOffset = () =>
		grid
			.locator("g")
			.evaluate((group) =>
				Number(group.getAttribute("transform").match(/translate\([^ ]+ ([^)]+)\)/)[1]),
			);
	await page.locator("#grid-menu-alignment-dropdown > summary").click();
	await expect(page.locator("#grid-menu-alignment-dropdown")).toHaveAttribute("open", "");
	await bottomAlignmentButton.click();
	await expect(bottomAlignmentButton).toHaveAttribute("aria-pressed", "true");
	expect(await getGridVerticalOffset()).toBeCloseTo(expectedBottomOffset, 4);
	await topAlignmentButton.click();
	await expect(bottomAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(topAlignmentButton).toHaveAttribute("aria-pressed", "true");
	expect(await getGridVerticalOffset()).toBe(0);
	await page.emulateMedia({ media: "print" });
	await expect(page.locator("#parent-screen")).toHaveCSS("visibility", "hidden");
	await expect(page.locator("#print-preview-paper")).toHaveCSS("position", "fixed");
	await expect(grid).toHaveCSS("display", "block");

	await page.emulateMedia({ media: "screen" });
	await page.locator("#grid-menu-printable-button").click();
	await expect(page.locator("#print-preview-paper")).toHaveAttribute(
		"data-grid-printable",
		"false",
	);
	await page.emulateMedia({ media: "print" });
	await expect(grid).toHaveCSS("display", "none");
});

test("Parent menu includes a Games side panel and toggling buttons", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();

	const gamesButton = page.getByRole("button", { name: "Games" });
	await expect(gamesButton).toBeVisible();
	await gamesButton.click();

	const gamesPanel = page.locator("#games-sidebar-panel");
	await expect(gamesPanel).toBeVisible();
	const panelBox = await gamesPanel.boundingBox();
	expect(panelBox).not.toBeNull();
	expect(panelBox.x).toBeCloseTo(0, 1);
	expect(panelBox.width).toBeCloseTo(218, 1);
	const navigationBox = await page.locator("#parent-screen-tab-rail").boundingBox();
	expect(panelBox.y).toBeCloseTo(navigationBox.y + navigationBox.height, 1);

	for (const label of ["Math", "Language Arts", "Social Studies", "Science", "Art"]) {
		const button = page.getByRole("button", { name: label, exact: true });
		await expect(button).toBeVisible();
	}

	const mathButton = page.getByRole("button", { name: "Math", exact: true });
	await mathButton.click();
	await expect(mathButton).toHaveAttribute("aria-pressed", "true");
	await expect(mathButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 4)");
	await page.getByRole("button", { name: "Language Arts", exact: true }).click();
	await expect(mathButton).toHaveAttribute("aria-pressed", "false");
	await expect(page.getByRole("button", { name: "Language Arts", exact: true })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
});

test("Math place-value game has ten self-paced levels and supports retry and replay", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Games", exact: true }).click();
	await page.getByRole("button", { name: "Math", exact: true }).click();
	await page.getByRole("button", { name: "Place-Value Treehouse", exact: true }).click();
	await expect(page.getByText("Level 1 of 10", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Millions", exact: true }).click();
	await expect(page.getByRole("status")).toContainText("Not yet");
	await expect(page.getByText("Level 1 of 10", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Hint", exact: true }).click();
	await expect(page.getByText(/^From right to left:/)).toBeVisible();
	const answers = [
		"Ones",
		"Tens",
		"Ones",
		"Hundreds",
		"Tens",
		"Thousands",
		"Hundreds",
		"Ten Thousands",
		"Hundred Thousands",
		"Millions",
	];
	for (const [levelIndex, answer] of answers.entries()) {
		await expect(
			page.getByText(`Level ${levelIndex + 1} of 10`, { exact: true }),
		).toBeVisible();
		await page.getByRole("button", { name: answer, exact: true }).click();
		await expect(page.getByRole("status")).toHaveText("Correct!");
		await page
			.getByRole("button", { name: levelIndex === 9 ? "Finish" : "Next level", exact: true })
			.click();
	}
	await expect(page.getByRole("heading", { name: "All 10 levels complete!" })).toBeVisible();
	await page.getByRole("button", { name: "Play again", exact: true }).click();
	await expect(page.getByText("Level 1 of 10", { exact: true })).toBeVisible();
});

const mathPlaceNumbers = [23, 47, 315, 682, 2437, 8169, 35428, 760915, 934862, 1000000];
const mathFirstNumbers = [24, 57, 126, 428, 1234, 5729, 12345, 42876, 135792, 246810];
const mathSecondNumbers = [12, 24, 27, 156, 623, 1347, 6342, 17893, 62748, 135729];
const mathTargetPlaces = [0, 1, 0, 2, 1, 3, 2, 4, 5, 6];
const mathPlaceNames = [
	"Ones",
	"Tens",
	"Hundreds",
	"Thousands",
	"Ten Thousands",
	"Hundred Thousands",
	"Millions",
];
const mathWordAnswers = [
	"",
	"forty-seven",
	"",
	"six hundred eighty-two",
	"",
	"eight thousand one hundred sixty-nine",
	"",
	"seven hundred sixty thousand nine hundred fifteen",
	"",
	"one million",
];
const mathGameIds = [
	"place-names",
	"digit-values",
	"place-relations",
	"place-conversion",
	"expanded-form",
	"number-words",
	"compare-numbers",
	"compare-tables",
	"order-numbers",
	"round-place",
	"round-any",
	"round-puzzles",
	"add-numbers",
	"add-word",
	"subtract-numbers",
	"subtract-word",
	"compare-word",
	"sum-difference",
	"estimate-sums",
	"estimate-sums-word",
	"estimate-differences",
	"estimate-differences-word",
	"multi-step-word",
	"equation-word",
];

for (const gameId of mathGameIds) {
	test(`Math minigame: ${gameId} teaches its topic through all ten levels`, async ({ page }) => {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Games", exact: true }).click();
		await page.getByRole("button", { name: "Math", exact: true }).click();
		await expect(page.locator("[data-game-id]")).toHaveCount(24);
		const thumbnail = page.locator(`[data-game-id="${gameId}"]`);
		const thumbnailArtwork = await thumbnail
			.locator("svg")
			.first()
			.evaluate((element) => ({
				path: element.querySelector("path").getAttribute("d"),
				symbol: element.querySelector("text").textContent,
				background: element.querySelector("rect").getAttribute("fill"),
			}));
		const gameTitle = await thumbnail.getAttribute("aria-label");
		await thumbnail.click();
		const firstLevelArtwork = page.getByRole("img", {
			name: `First-level image for ${gameTitle}`,
			exact: true,
		});
		await expect(firstLevelArtwork).toBeVisible();
		const gameArtwork = await firstLevelArtwork.evaluate((element) => ({
			path: element.querySelector("path").getAttribute("d"),
			symbol: element.querySelector("text").textContent,
			background: element.querySelector("rect").getAttribute("fill"),
		}));
		expect(gameArtwork).toEqual(thumbnailArtwork);
		for (let stage = 0; stage < 10; stage += 1) {
			await expect(page.getByText(`Level ${stage + 1} of 10`, { exact: true })).toBeVisible();
			const number = mathPlaceNumbers[stage];
			const first = mathFirstNumbers[stage];
			const second = mathSecondNumbers[stage];
			let answers = [];
			let choices = [];
			let needsCheck = false;
			switch (gameId) {
				case "place-names":
					choices = [mathPlaceNames[mathTargetPlaces[stage]]];
					break;
				case "digit-values": {
					const digit = String(number).at(-1 - mathTargetPlaces[stage]);
					choices = [
						`Digit ${digit} in the ${mathPlaceNames[mathTargetPlaces[stage]]} place`,
					];
					break;
				}
				case "place-relations":
					choices = [stage % 2 === 0 ? "10 times as much" : "One tenth as much"];
					break;
				case "place-conversion":
					answers = [[20, 30, 400, 500, 600, 700, 8000, 9000, 10000, 11000][stage]];
					break;
				case "expanded-form":
					if (stage % 2) answers = [number];
					else {
						choices = [...String(number)]
							.map(
								(digit, digitIndex, digits) =>
									Number(digit) * 10 ** (digits.length - 1 - digitIndex),
							)
							.filter(Boolean)
							.map((term) => term.toLocaleString("en-US"));
						needsCheck = true;
					}
					break;
				case "number-words":
					if (stage % 2 === 0) answers = [number];
					else choices = [mathWordAnswers[stage]];
					break;
				case "compare-numbers": {
					const displayed = await page
						.getByLabel("Numbers to compare", { exact: true })
						.locator("span")
						.allTextContents();
					for (const value of displayed.filter((text) => text !== "?")) {
						expect(Number(value.replaceAll(",", ""))).toBeLessThanOrEqual(1000000);
					}
					choices = [
						stage % 3 === 0
							? "Less than"
							: stage % 3 === 1
								? "Equal to"
								: "Greater than",
					];
					break;
				}
				case "compare-tables":
					choices = [stage % 2 === 0 ? "Forest" : "Wetland"];
					break;
				case "order-numbers":
					choices = [number - 3, number - 12, number - 1, number - 7]
						.sort((left, right) => (stage % 2 ? right - left : left - right))
						.map((value) => value.toLocaleString("en-US"));
					needsCheck = true;
					break;
				case "round-place": {
					const unit = 10 ** (Math.min(Math.floor(stage / 2), 4) + 1);
					choices = [(Math.round(first / unit) * unit).toLocaleString("en-US")];
					break;
				}
				case "round-any": {
					const unit = 10 ** [1, 2, 1, 3, 2, 4, 3, 5, 4, 5][stage];
					answers = [Math.round(first / unit) * unit];
					break;
				}
				case "round-puzzles":
					choices = [first.toLocaleString("en-US")];
					break;
				case "add-numbers":
				case "add-word":
					answers = [first + second];
					break;
				case "subtract-numbers":
				case "subtract-word":
					answers = [first - second];
					break;
				case "compare-word":
					answers = [stage % 2 ? first - second : first + second];
					break;
				case "sum-difference":
					answers = [second, first];
					break;
				case "estimate-sums":
				case "estimate-sums-word":
				case "estimate-differences":
				case "estimate-differences-word": {
					const unit = 10 ** (1 + Math.floor(stage / 3));
					const roundedFirst = Math.round(first / unit) * unit;
					const roundedSecond = Math.round(second / unit) * unit;
					answers = [
						roundedFirst,
						roundedSecond,
						gameId.includes("sums")
							? roundedFirst + roundedSecond
							: roundedFirst - roundedSecond,
					];
					break;
				}
				case "multi-step-word":
					answers = [first + second, first + second - Math.floor(second / 2) - 1];
					break;
				case "equation-word":
					choices = [`x = (${first} + ${second}) - ${Math.floor(second / 2) + 1}`];
					answers = [first + second - Math.floor(second / 2) - 1];
					break;
			}
			for (const choice of choices)
				await page.getByRole("button", { name: choice, exact: true }).click();
			for (const [answerIndex, answer] of answers.entries())
				await page.locator(`#math-game-answer-${answerIndex}`).fill(String(answer));
			if (["add-numbers", "sum-difference"].includes(gameId)) {
				await page.locator("#math-game-answer-0").press("Enter");
			} else if (answers.length || needsCheck) {
				await page.getByRole("button", { name: "Check answer", exact: true }).click();
			}
			await expect(page.getByRole("status")).toHaveText("Correct!");
			await page
				.getByRole("button", { name: stage === 9 ? "Finish" : "Next level", exact: true })
				.click();
		}
		await expect(page.getByRole("heading", { name: "All 10 levels complete!" })).toBeVisible();
		await page.getByRole("button", { name: "Back to games", exact: true }).click();
		await expect(page.locator(`[data-game-id="${gameId}"]`)).toContainText("10 / 10");
	});
}

async function openStudentMathGames(page) {
	await page.getByRole("button", { name: "Open student section", exact: true }).click();
	await page.getByRole("button", { name: "Open Games tab", exact: true }).click();
}

test("Student Games menu and gallery use pastel green and blue backgrounds", async ({ page }) => {
	await page.goto("./");
	await openStudentMathGames(page);
	await expect(page.locator("#student-submenu-panel")).toHaveCSS(
		"background-color",
		"rgb(191, 233, 190)",
	);
	await expect(page.locator("#games-menu")).toHaveCount(0);
	await expect(page.locator("#student-games-top-navigation")).toBeVisible();
	await expect(page.locator("#math-games-view")).toHaveCSS(
		"background-color",
		"rgb(191, 233, 190)",
	);
});

async function revealGoldCoinTotal(page, expectedTotal) {
	await page.getByRole("button", { name: "Open Rewards tab", exact: true }).click();
	await page.getByRole("button", { name: "Open reward chest", exact: true }).click();
	const pouch = page.getByRole("button", { name: "Gold cinch bag", exact: true });
	await pouch.evaluate((element) =>
		element.getAnimations().forEach((animation) => animation.finish()),
	);
	await pouch.click();
	await page
		.locator(".rewards-page-gold-coin")
		.evaluateAll((elements) =>
			elements.forEach((element) =>
				element.getAnimations().forEach((animation) => animation.finish()),
			),
		);
	await expect(page.locator(".rewards-page-gold-total")).toHaveText(
		`${expectedTotal} gold coins`,
	);
}

test("Math gold coin progress, celebration and first-only rewards", async ({ page }, testInfo) => {
	await page.addInitScript(() => {
		window.mathWinningNotesPlayed = 0;
		const originalCreateOscillator = AudioContext.prototype.createOscillator;
		AudioContext.prototype.createOscillator = function (...args) {
			window.mathWinningNotesPlayed += 1;
			return originalCreateOscillator.apply(this, args);
		};
	});
	await page.goto("./");
	await openStudentMathGames(page);
	const navigationNoteCount = await page.evaluate(() => window.mathWinningNotesPlayed);
	const thumbnail = page.locator('[data-game-id="place-names"]');
	await expect(thumbnail.locator("[data-game-shadow]")).toHaveAttribute("fill", "#111827");
	await expect(thumbnail.locator("[data-game-shadow]")).toHaveAttribute("fill-opacity", "0.72");
	for (let run = 0; run < 2; run += 1) {
		await page.setViewportSize(
			run ? { width: 375, height: 812 } : { width: 1280, height: 720 },
		);
		for (let stage = 0; stage < 10; stage += 1) {
			if (run === 0 || stage === 0) await thumbnail.click();
			await expect(page.getByText(`Level ${stage + 1} of 10`, { exact: true })).toBeVisible();
			await page
				.getByRole("button", { name: mathPlaceNames[mathTargetPlaces[stage]], exact: true })
				.click();
			if (stage === 9) {
				await page.getByRole("button", { name: "Finish", exact: true }).click();
				const coin = page.getByRole("img", { name: "Winning gold coin", exact: true });
				if (run === 0) {
					await expect(coin).toBeVisible();
					await expect(coin).toHaveCSS("animation-duration", "3s");
					const keyframes = await coin.evaluate((element) =>
						element.getAnimations()[0].effect.getKeyframes(),
					);
					expect(keyframes[0].transform).toContain("scale(0.5)");
					expect(keyframes.at(-1).transform).toContain("rotateY(1080deg)");
					expect(keyframes.at(-1).transform).toContain("scale(2.6)");
					if (page.viewportSize().width === 375) {
						await coin.evaluate((element) => {
							const animation = element.getAnimations()[0];
							animation.pause();
							animation.currentTime = 2000;
						});
						const coinBox = await coin.boundingBox();
						expect(coinBox.width).toBeGreaterThan(109);
						expect(coinBox.x).toBeGreaterThanOrEqual(0);
						expect(coinBox.x + coinBox.width).toBeLessThanOrEqual(375);
						expect(coinBox.y).toBeGreaterThanOrEqual(0);
						expect(coinBox.y + coinBox.height).toBeLessThanOrEqual(812);
					}
					await page.screenshot({
						path: testInfo.outputPath(`winning-coin-run-${run}.png`),
					});
					if (page.viewportSize().width === 375)
						await coin.evaluate((element) => element.getAnimations()[0].play());
					await expect(coin).toHaveCount(0, { timeout: 5000 });
					await expect(page.locator("#math-games-view")).toHaveAttribute(
						"data-winning-sound",
						"played",
					);
				} else {
					await expect(coin).toHaveCount(0);
				}
				const notes = await page.evaluate(() => window.mathWinningNotesPlayed);
				expect(notes).toBe(navigationNoteCount + 4);
			}
			if (run === 0 || stage === 9) {
				await page.getByRole("button", { name: "Back to games", exact: true }).click();
				await expect(thumbnail.locator("[data-game-shadow]")).toHaveAttribute(
					"fill-opacity",
					String(run ? 0 : (0.72 * (9 - stage)) / 10),
				);
			} else {
				await page.getByRole("button", { name: "Next level", exact: true }).click();
			}
		}
		await expect(thumbnail.locator(".math-games-thumbnail-coin")).toHaveCSS(
			"filter",
			/drop-shadow/,
		);
		await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
		await revealGoldCoinTotal(page, 1);
		await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
		await page.getByRole("button", { name: "Open Games tab", exact: true }).click();
	}
	await page.evaluate(() => {
		const savedProgress = JSON.parse(localStorage.getItem("zoologist-math-games-progress"));
		localStorage.setItem(
			"zoologist-math-games-progress",
			JSON.stringify({ ...savedProgress, "digit-values": 9 }),
		);
	});
	await page.reload();
	await openStudentMathGames(page);
	await page.locator('[data-game-id="digit-values"]').click();
	await expect(page.getByText("Level 10 of 10", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Digit 1 in the Millions place", exact: true }).click();
	await page.getByRole("button", { name: "Finish", exact: true }).click();
	await expect(page.getByRole("img", { name: "Winning gold coin", exact: true })).toHaveCount(0, {
		timeout: 5000,
	});
	await page.getByRole("button", { name: "Back to games", exact: true }).click();
	await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
	await revealGoldCoinTotal(page, 2);
	await page.reload();
	await page.getByRole("button", { name: "Open student section", exact: true }).click();
	await revealGoldCoinTotal(page, 2);
});

for (const viewport of [
	{ width: 1280, height: 720 },
	{ width: 375, height: 812 },
]) {
	test(`Parent math thumbnails have exact dimensions and gaps at ${viewport.width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize(viewport);
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Games", exact: true }).click();
		await page.getByRole("button", { name: "Math", exact: true }).click();
		const thumbnails = page.locator(".parent-math-game-thumbnail");
		await expect(thumbnails).toHaveCount(24);
		await expect(page.locator("#math-games-view")).toHaveClass(/bg-purple-950/);
		await expect(page.locator("#math-games-view")).toHaveCSS(
			"background-color",
			"oklch(0.291 0.149 302.717)",
		);
		const boxes = await thumbnails.evaluateAll((elements) =>
			elements.map((element) => {
				const { x, y, width, height } = element.getBoundingClientRect();
				return { x, y, width, height };
			}),
		);
		for (const box of boxes) expect(box).toMatchObject({ width: 218, height: 218 });
		const sidebar = await page.locator("#games-sidebar-panel").boundingBox();
		expect(boxes[0].x - sidebar.x - sidebar.width).toBe(16);
		const navigation = await page.locator("#parent-screen-tab-rail").boundingBox();
		expect(boxes[0].y - navigation.y - navigation.height).toBe(16);
		const gallery = await page.locator("#math-games-view").boundingBox();
		expect(gallery.x - sidebar.x - sidebar.width).toBe(16);
		expect(gallery.y - navigation.y - navigation.height).toBe(16);
		expect(viewport.width - gallery.x - gallery.width).toBe(16);
		expect(viewport.height - gallery.y - gallery.height).toBe(16);
		for (const axis of ["x", "y"]) {
			const positions = [...new Set(boxes.map((box) => box[axis]))].sort(
				(left, right) => left - right,
			);
			for (let position = 1; position < positions.length; position += 1)
				expect(positions[position] - positions[position - 1] - 218).toBe(16);
		}
		if (viewport.width <= 768) {
			expect(sidebar.width).toBe(125);
			for (const box of boxes) {
				expect(box.x).toBeGreaterThanOrEqual(sidebar.x + sidebar.width + 16);
				expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 16);
			}
		}
		const captionsFit = await thumbnails
			.locator("[data-game-caption]")
			.evaluateAll((elements) =>
				elements.every(
					(element) =>
						element.scrollHeight <= element.clientHeight &&
						element.scrollWidth <= element.clientWidth,
				),
			);
		expect(captionsFit).toBe(true);
		const backButton = page.getByRole("button", { name: "Back to home", exact: true });
		const backBox = await backButton.boundingBox();
		expect(viewport.width - backBox.x - backBox.width).toBe(16);
		expect(backBox.y).toBe(16);
		await page.screenshot({ path: testInfo.outputPath(`parent-math-${viewport.width}.png`) });
		await backButton.click();
		await expect(page.locator("#math-games-view")).toHaveCount(0);
		await expect(page.locator("#parent-screen-tab-rail")).toBeVisible();
	});
}

for (const viewport of [
	{ width: 1280, height: 720 },
	{ width: 375, height: 812 },
]) {
	test(`Student math thumbnails have exact dimensions and gaps at ${viewport.width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize(viewport);
		await page.goto("./");
		await page.getByRole("button", { name: "Open student section" }).click();
		await page.getByRole("button", { name: "Open Games tab", exact: true }).click();
		const thumbnails = page.locator(".student-math-game-thumbnail");
		await expect(thumbnails).toHaveCount(24);
		const boxes = await thumbnails.evaluateAll((elements) =>
			elements.map((element) => {
				const { x, y, width, height } = element.getBoundingClientRect();
				return { x, y, width, height };
			}),
		);
		for (const box of boxes) expect(box.width).toBe(box.height);
		const sidebar = await page.locator("#student-menu-navigation").boundingBox();
		expect(boxes[0].x - (sidebar.x + sidebar.width)).toBe(16);
		const navigation = await page.locator("#student-games-top-navigation").boundingBox();
		const gallery = await page.locator("#math-games-view").boundingBox();
		expect(gallery.x).toBe(sidebar.x + sidebar.width + 16);
		expect(gallery.y - (navigation.y + navigation.height)).toBe(16);
		expect(boxes[0].y).toBe(gallery.y);
		expect(viewport.width - gallery.x - gallery.width).toBe(16);
		expect(viewport.height - gallery.y - gallery.height).toBe(32);
		expect(Math.max(...boxes.map((box) => box.x + box.width))).toBe(viewport.width - 16);
		for (const axis of ["x", "y"]) {
			const positions = [...new Set(boxes.map((box) => box[axis]))].sort(
				(left, right) => left - right,
			);
			const tileSize = axis === "x" ? boxes[0].width : boxes[0].height;
			for (let position = 1; position < positions.length; position += 1)
				expect(positions[position] - positions[position - 1] - tileSize).toBe(16);
		}
		const captionsFit = await thumbnails
			.locator("[data-game-caption]")
			.evaluateAll((elements) =>
				elements.every(
					(element) =>
						element.scrollHeight <= element.clientHeight &&
						element.scrollWidth <= element.clientWidth,
				),
			);
		expect(captionsFit).toBe(true);
		await page.screenshot({ path: testInfo.outputPath(`student-math-${viewport.width}.png`) });
		await thumbnails.first().click();
		await page.getByRole("button", { name: "Ones", exact: true }).click();
		await expect(page.getByRole("status")).toHaveText("Correct!");
		await page.getByRole("button", { name: "Back to games", exact: true }).click();
		await expect(thumbnails.first()).toContainText("1 / 10");
		await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
		await expect(page.locator("#student-submenu-panel")).toHaveCount(0);
		await expect(
			page.getByRole("button", { name: "Back to home page", exact: true }),
		).toBeVisible();
	});
}

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

test("Alignment button stays anchored while other Tools panels open", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.getByRole("button", { name: "Tools" }).click();

	const alignmentButton = page.locator("#text-editor-alignment-button");
	const menuButtons = {
		size: page.locator("#text-editor-size-menu-button"),
		margins: page.locator("#text-editor-margins-button"),
		fonts: page.locator("#text-editor-fonts-button"),
	};
	const alignmentButtonAnchor = await alignmentButton.evaluate((button) => ({
		top: button.offsetTop,
		left: button.offsetLeft,
		isInsideTools: Boolean(button.offsetParent.closest("#text-editor-tools-panel")),
	}));
	const menuStates = [
		[],
		["size"],
		["margins"],
		["fonts"],
		["size", "margins"],
		["size", "fonts"],
		["margins", "fonts"],
		["size", "margins", "fonts"],
	];
	let activeMenus = new Set();
	await alignmentButton.click();

	for (const menuState of menuStates) {
		const nextMenus = new Set(menuState);
		for (const menuName of new Set([...activeMenus, ...nextMenus])) {
			if (activeMenus.has(menuName) !== nextMenus.has(menuName)) {
				await menuButtons[menuName].click();
			}
		}
		activeMenus = nextMenus;

		const currentAnchor = await alignmentButton.evaluate((button) => ({
			top: button.offsetTop,
			left: button.offsetLeft,
			isInsideTools: Boolean(button.offsetParent.closest("#text-editor-tools-panel")),
		}));
		expect(currentAnchor).toEqual(alignmentButtonAnchor);
	}
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
	const marginsButton = page.locator("#text-editor-margins-button");
	const alignmentButton = page.locator("#text-editor-alignment-button");
	const fontStylesButton = page.locator("#text-editor-font-styles-button");
	const alignmentButtonAnchor = await alignmentButton.evaluate((button) => ({
		top: button.offsetTop,
		left: button.offsetLeft,
		isInsideTools: Boolean(button.offsetParent.closest("#text-editor-tools-panel")),
	}));
	const expectAlignmentButtonAnchored = async () => {
		const currentAnchor = await alignmentButton.evaluate((button) => ({
			top: button.offsetTop,
			left: button.offsetLeft,
			isInsideTools: Boolean(button.offsetParent.closest("#text-editor-tools-panel")),
		}));
		expect(currentAnchor).toEqual(alignmentButtonAnchor);
	};
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
	await expectAlignmentButtonAnchored();
	await marginsButton.click();
	await expectAlignmentButtonAnchored();
	await marginsButton.click();
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
	await expectAlignmentButtonAnchored();
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
	await fontsButton.click();
	await expectAlignmentButtonAnchored();
	await fontsButton.click();

	await expect(fontsPanel).toHaveCount(0);
	await marginsButton.click();
	await expect(marginsButton).toHaveAttribute("aria-pressed", "true");
	await expectAlignmentButtonAnchored();
	await expect(marginsButton).toHaveCSS("background-color", "rgb(88, 191, 255)");
	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "true");
	await expectAlignmentButtonAnchored();
	await fontStylesButton.click();
	const marginFontStylesPressed = await getPressedStyles(fontStylesButton);
	expect(await getPressedStyles(marginsButton)).toEqual(marginFontStylesPressed);
	expect(await getPressedStyles(fontsButton)).toEqual(marginFontStylesPressed);
	await fontStylesButton.click();
	const fontsToMarginsGap = await page.evaluate(() => {
		const margins = document
			.querySelector("#text-editor-margins-panel")
			.getBoundingClientRect();
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
	await expectAlignmentButtonAnchored();
	const stackedFontsToSizeAndMarginsGaps = await page.evaluate(() => {
		const margins = document
			.querySelector("#text-editor-margins-panel")
			.getBoundingClientRect();
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
		const toolsPanel = document
			.querySelector("#text-editor-tools-panel")
			.getBoundingClientRect();
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
	expect(
		buttonMetrics.buttons.map(({ leftGap, width, height, borderRadius }) => ({
			leftGap,
			width,
			height,
			borderRadius,
		})),
	).toEqual(Array(3).fill({ leftGap: 16, width: 256, height: 64, borderRadius: "999px" }));
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
	const shellButtonMetrics = await page
		.locator("#text-editor-new-create-shell-button")
		.evaluate((button) => {
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
	const fontButtonMetrics = await fontsPanel
		.locator("[data-font-option]")
		.evaluateAll((buttons) =>
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
	const normalizeShadow = (shadow) => shadow.replace(/rgba?\([^)]*\)|#[\da-f]{3,8}/gi, "<color>");
	for (const button of fontButtonMetrics) {
		expect(button.width).toBe(shellButtonMetrics.width);
		expect(button.height).toBe(shellButtonMetrics.height);
		expect(button.borderRadius).toBe(shellButtonMetrics.borderRadius);
		expect(button.fontFamily).toBe(shellButtonMetrics.fontFamily);
		expect(button.fontSize).toBe(shellButtonMetrics.fontSize);
		expect(button.fontWeight).toBe(shellButtonMetrics.fontWeight);
		expect(normalizeShadow(button.boxShadow)).toBe(
			normalizeShadow(shellButtonMetrics.boxShadow),
		);
	}
	await page.getByRole("button", { name: "New +", exact: true }).click();

	const geometry = await fontsPanel.evaluate((element) => {
		const panel = element.getBoundingClientRect();
		const toolsPanel = document
			.querySelector("#text-editor-tools-panel")
			.getBoundingClientRect();
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
	expect(marginsBounds.height).toBe(256);
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

test("Margins create numeric paper insets, toggle guides, and restore with saved shells", async ({
	page,
}) => {
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
				offsets.push(
					range.getBoundingClientRect().left - element.getBoundingClientRect().left,
				);
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
	await expect(page.locator("#text-editor-template-save-button")).toBeVisible();

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

test("October 2026 is first and hides Back without moving Calendar or Forward", async ({
	page,
}) => {
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

	await expect(page.locator("#calendar-month-header h2")).toHaveText("October 2026");
	await expect(backButton).toHaveCount(0);
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

	for (let monthOffset = 0; monthOffset < 13; monthOffset += 1) {
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

	await expect(rewardsPage.locator(".rewards-page-journal")).toHaveCount(0);
	await expect(rewardsPage.locator(".rewards-page-book-animation")).toHaveCount(0);
	const goldBag = rewardsPage.getByRole("button", { name: "Gold cinch bag" });
	await expect(goldBag).toBeVisible();
	expect(await goldBag.evaluate((element) => getComputedStyle(element).animationName)).toMatch(
		/^rewards-gold-bag-emerge(?:-[\w-]+)?$/,
	);
	await goldBag.evaluate((element) => {
		for (const animation of element.getAnimations()) {
			animation.finish();
		}
	});
	await goldBag.hover();
	await expect(goldBag).toHaveCSS("filter", /drop-shadow/);
	await expect(goldBag.locator(".rewards-page-gold-bag-neck")).not.toHaveCSS("transform", "none");
	await goldBag.click();
	await expect(goldBag).toHaveAttribute("aria-expanded", "true");
	const spilledCoins = rewardsPage.locator(".rewards-page-gold-coin");
	await expect(spilledCoins).toHaveCount(5);
	const goldCoinTotal = rewardsPage.getByRole("status");
	await expect(goldCoinTotal).toHaveCount(0);
	await spilledCoins.evaluateAll((elements) => {
		for (const element of elements) {
			for (const animation of element.getAnimations()) {
				animation.finish();
			}
		}
	});
	await expect(goldCoinTotal).toHaveText("0 gold coins");

	await page.getByRole("button", { name: "Back to student menu" }).click();
	await expect(page.locator("#student-menu-page")).toBeVisible();
	await expect(page.locator("#calendar-menu-heading")).toBeVisible();
});

test("Student sidebar navigation selects its destination and returns from Games", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const destinations = [
		{ button: "Games", panel: "#student-games-top-navigation" },
		{ button: "Extra Credit", panel: "#extra-credit-menu" },
		{ button: "Progress", panel: "#student-submenu-panel" },
	];

	for (const destination of destinations) {
		const button = page.getByRole("button", { name: destination.button });
		await button.click();
		await expect(page.locator(destination.panel)).toBeVisible();
		if (destination.button === "Games") {
			await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
			await expect(page.locator("#student-games-top-navigation")).toHaveCount(0);
		}
		await button.click();
		await expect(page.locator(destination.panel)).toBeVisible();
		if (destination.button === "Games") {
			await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
			await expect(page.locator("#student-games-top-navigation")).toHaveCount(0);
		}
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

	const clickedDay = page.locator("#calendar-day-cell-October-2026-7");
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

	const clickedDay = page.locator("#calendar-day-cell-October-2026-7");
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
			buttonBottomGap:
				rect.bottom - element.querySelector("button").getBoundingClientRect().bottom,
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

test("Text Editor Home and Back buttons use the shared viewport position", async ({ page }) => {
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
			homeTop: homeRect.top,
			backTop: backRect.top,
		};
	});
	expect(metrics).toEqual({
		hasHome: true,
		hasBack: true,
		backRightGap: 16,
		homeBackGap: 16,
		homeTop: 16,
		backTop: 16,
	});
});

test("Grid menu nudges the grid by the selected pixel amount", async ({ page }) => {
	await page.setViewportSize({ width: 2560, height: 1080 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();
	await page.getByRole("button", { name: "Grid", exact: true }).click();

	await expect(page.locator("#grid-menu-position-heading")).toHaveCount(0);
	await page.locator("#grid-menu-alignment-dropdown > summary").click();
	await expect(page.locator("#grid-menu-alignment-dropdown")).toHaveAttribute("open", "");
	const customButton = page.locator("#grid-alignment-custom-button");
	await customButton.click();
	await expect(page.locator("#grid-menu-position-heading")).toBeVisible();
	const headingLayout = await page.evaluate(() => {
		const heading = document.querySelector("#grid-menu-position-heading");
		const stepSelect = document.querySelector("#grid-move-step");
		const stepUnit = document.querySelector("#grid-move-unit");
		const customButton = document.querySelector("#grid-alignment-custom-button");
		const customPanel = document.querySelector("#grid-menu-custom-position");
		const rowsAmount = document.querySelector("#grid-rows-amount-label");
		const headingStyles = getComputedStyle(heading);
		const rowsAmountStyles = getComputedStyle(rowsAmount);
		return {
			text: heading.textContent.trim(),
			inCustomPanel: heading.closest("#grid-menu-custom-position") === customPanel,
			customButtonGap:
				heading.getBoundingClientRect().top - customButton.getBoundingClientRect().bottom,
			selectorGap:
				stepSelect.getBoundingClientRect().left - heading.getBoundingClientRect().right,
			options: [...stepSelect.options]
				.filter((option) => !option.disabled)
				.map((option) => option.textContent.trim()),
			unitText: stepUnit.textContent.trim(),
			unitFollowsSelector: stepSelect.nextElementSibling === stepUnit,
			matchingStyle: ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle"].every(
				(property) => headingStyles[property] === rowsAmountStyles[property],
			),
		};
	});
	expect(headingLayout.text).toBe("Grid Position");
	expect(headingLayout.inCustomPanel).toBe(true);
	expect(headingLayout.customButtonGap).toBe(16);
	expect(headingLayout.selectorGap).toBe(16);
	expect(headingLayout.options).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
	expect(headingLayout.unitText).toBe("px");
	expect(headingLayout.unitFollowsSelector).toBe(true);
	expect(headingLayout.matchingStyle).toBe(true);

	const grid = page.locator("#print-preview-grid");
	await expect(grid).toBeVisible();
	const gridMoveStep = page.locator("#grid-move-step");
	await expect(gridMoveStep.locator("option")).toHaveCount(11);
	await expect(gridMoveStep).toHaveValue("Select");
	const directionGroup = page.locator("#grid-menu-move-directions");
	await expect(directionGroup).toBeHidden();
	await gridMoveStep.selectOption("1");
	await expect(directionGroup).toBeVisible();
	await expect(directionGroup.locator("button")).toHaveText(["Up", "Down", "Left", "Right"]);
	const buttonPositions = await directionGroup.locator("button").evaluateAll((buttons) =>
		buttons.map((button) => {
			const { left, top } = button.getBoundingClientRect();
			return { left, top };
		}),
	);
	expect(new Set(buttonPositions.map(({ top }) => top)).size).toBe(1);
	expect(buttonPositions.map(({ left }) => left)).toEqual(
		[...buttonPositions.map(({ left }) => left)].sort((left, right) => left - right),
	);
	const gridPositionGroup = grid.locator("g");
	const readGridOffset = async () =>
		gridPositionGroup.evaluate((group) => {
			const match = group.getAttribute("transform").match(/translate\(([-\d.]+) ([-\d.]+)\)/);
			return { x: Number(match[1]), y: Number(match[2]) };
		});
	const initialGridOffset = await readGridOffset();
	await gridMoveStep.selectOption("10");
	await page.locator("#grid-move-right-button").click();
	await page.locator("#grid-move-right-button").click();
	const afterRepeatedRightNudges = await readGridOffset();
	expect(afterRepeatedRightNudges.x).toBe(initialGridOffset.x + 20);
	expect(afterRepeatedRightNudges.y).toBe(initialGridOffset.y);
	await page.locator("#grid-move-up-button").click();
	const afterUpNudge = await readGridOffset();
	expect(afterUpNudge.y).toBe(initialGridOffset.y - 10);
	await gridMoveStep.selectOption("1");
	await page.locator("#grid-move-down-button").click();
	await page.locator("#grid-move-left-button").click();
	await page.locator("#grid-move-left-button").click();
	const afterSmallNudges = await readGridOffset();
	expect(afterSmallNudges.x).toBe(initialGridOffset.x + 18);
	expect(afterSmallNudges.y).toBe(initialGridOffset.y - 9);
});

test("Text Editor navigation controls stay aligned with the New menu", async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
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
		"text-editor-print-button",
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

	await page.setViewportSize({ width: 2560, height: 1080 });
	await page.locator("#text-editor-template-new-button").click();
	await expect(page.locator("#text-editor-new-menu")).toBeVisible();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	const newButton = page.locator("#text-editor-template-new-button");
	await expect(newButton).toHaveAttribute("aria-pressed", "true");
	await page.locator("#text-editor-grid-button").click();
	await expect(page.locator("#text-editor-grid-button")).toHaveAttribute("aria-pressed", "true");
	await expect(page.locator("#text-editor-grid-menu")).toBeVisible();
	await page.locator("#text-editor-editing-tools-button").click();
	const gridMenuBounds = await page.locator("#text-editor-grid-menu").evaluate((menu) => {
		const bounds = menu.getBoundingClientRect();
		const styles = getComputedStyle(menu);
		return {
			top: bounds.top,
			rightGap: window.innerWidth - bounds.right,
			bottomGap: window.innerHeight - bounds.bottom,
			borderRadius: styles.borderRadius,
			backgroundColor: styles.backgroundColor,
			boxShadow: styles.boxShadow,
		};
	});
	expect(gridMenuBounds.top).toBe(112);
	expect(gridMenuBounds.rightGap).toBe(16);
	expect(gridMenuBounds.bottomGap).toBe(16);
	const matchingToolsFrame = await page.evaluate(() => {
		const tools = getComputedStyle(document.querySelector("#text-editor-tools-panel"));
		const gridMenu = getComputedStyle(document.querySelector("#text-editor-grid-menu"));
		return ["borderRadius", "backgroundColor", "boxShadow"].every(
			(property) => tools[property] === gridMenu[property],
		);
	});
	expect(matchingToolsFrame).toBe(true);
	await expect(page.locator("#text-editor-grid-menu aside")).toHaveCount(0);
	const gridAppliedButton = page.locator("#grid-applied-button");
	const gridAlignmentDropdown = page.locator("#grid-menu-alignment-dropdown");
	await expect(gridAlignmentDropdown).toBeVisible();
	await expect(gridAlignmentDropdown).not.toHaveAttribute("open", "");
	await expect(gridAlignmentDropdown.locator("summary")).toHaveText("Full Grid Alignment");
	const gridDimensionsDropdown = page.locator("#grid-menu-dimensions-dropdown");
	await expect(gridDimensionsDropdown).toBeVisible();
	await expect(gridDimensionsDropdown).not.toHaveAttribute("open", "");
	await expect(gridDimensionsDropdown.locator("summary")).toHaveText("Grid Dimensions");
	const singleShapeAlignmentDropdown = page.locator("#grid-menu-single-shape-alignment-dropdown");
	await expect(singleShapeAlignmentDropdown).toBeVisible();
	await expect(singleShapeAlignmentDropdown).not.toHaveAttribute("open", "");
	await expect(singleShapeAlignmentDropdown.locator(":scope > summary")).toHaveText(
		"Single Shape Alignment",
	);
	await expect(page.locator("#text-editor-grid-menu details[open]")).toHaveCount(0);
	const matchingAlignmentDropdownStyles = await page.evaluate(() => {
		const fullGridAlignment = getComputedStyle(
			document.querySelector("#grid-menu-alignment-dropdown summary"),
		);
		const singleShapeAlignment = getComputedStyle(
			document.querySelector("#grid-menu-single-shape-alignment-dropdown summary"),
		);
		return ["color", "fontFamily", "fontSize", "fontWeight", "lineHeight"].every(
			(property) => fullGridAlignment[property] === singleShapeAlignment[property],
		);
	});
	expect(matchingAlignmentDropdownStyles).toBe(true);
	await singleShapeAlignmentDropdown.locator(":scope > summary").click();
	await expect(singleShapeAlignmentDropdown).toHaveAttribute("open", "");
	const singleShapeButtons = singleShapeAlignmentDropdown.locator(
		"#grid-menu-shape-removal-button, #grid-menu-shape-addition-button, #grid-menu-shape-swap-button",
	);
	await expect(singleShapeButtons).toHaveCount(3);
	await expect(singleShapeButtons).toHaveText(["Shape Removal", "Shape Addition", "Shape Swap"]);
	const shapeRemovalButton = page.locator("#grid-menu-shape-removal-button");
	const shapeAdditionButton = page.locator("#grid-menu-shape-addition-button");
	const shapeSwapButton = page.locator("#grid-menu-shape-swap-button");
	const shapeIndicators = singleShapeAlignmentDropdown.locator(
		".grid-menu-single-shape-indicator",
	);
	await expect(shapeIndicators).toHaveCount(3);
	for (let index = 0; index < 3; index += 1) {
		await expect(shapeIndicators.nth(index)).toHaveCSS("background-color", "rgb(255, 48, 48)");
	}
	const removalLabelRight = await shapeRemovalButton
		.locator(".grid-menu-single-shape-option-label")
		.evaluate((label) => label.getBoundingClientRect().right);
	const removalIndicatorBounds = await shapeRemovalButton
		.locator(".grid-menu-single-shape-indicator")
		.evaluate((indicator) => {
			const bounds = indicator.getBoundingClientRect();
			return { left: bounds.left, width: bounds.width, height: bounds.height };
		});
	expect(removalIndicatorBounds.left).toBeGreaterThan(removalLabelRight);
	expect(removalIndicatorBounds.width).toBe(16);
	expect(removalIndicatorBounds.height).toBe(16);
	await shapeRemovalButton.click();
	await expect(shapeRemovalButton).toHaveAttribute("aria-pressed", "true");
	await expect(shapeRemovalButton).toHaveClass(/grid-menu-single-shape-option--depressed/);
	await expect(shapeRemovalButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await expect(shapeRemovalButton.locator(".grid-menu-single-shape-indicator")).toHaveCSS(
		"background-color",
		"rgb(0, 255, 64)",
	);
	await shapeAdditionButton.click();
	await expect(shapeRemovalButton).toHaveAttribute("aria-pressed", "false");
	await expect(shapeAdditionButton).toHaveAttribute("aria-pressed", "true");
	await shapeSwapButton.click();
	await expect(shapeAdditionButton).toHaveAttribute("aria-pressed", "false");
	await expect(shapeSwapButton).toHaveAttribute("aria-pressed", "true");
	await shapeSwapButton.click();
	await expect(shapeSwapButton).toHaveAttribute("aria-pressed", "false");
	const shapeManipulationDropdown = page.locator("#grid-menu-shape-manipulation-dropdown");
	await expect(shapeManipulationDropdown).toBeVisible();
	await expect(shapeManipulationDropdown.locator("summary")).toHaveText("Shape Manipulation");
	await shapeManipulationDropdown.locator("summary").click();
	await expect(shapeManipulationDropdown).toHaveAttribute("open", "");
	await gridAlignmentDropdown.locator("summary").click();
	await expect(gridAlignmentDropdown).toHaveAttribute("open", "");
	await gridDimensionsDropdown.locator("summary").click();
	await expect(gridDimensionsDropdown).toHaveAttribute("open", "");
	await gridDimensionsDropdown.locator("summary").click();
	await expect(gridDimensionsDropdown).not.toHaveAttribute("open", "");
	await expect(gridDimensionsDropdown.locator("#grid-rows-amount")).toBeHidden();
	await gridDimensionsDropdown.locator("summary").click();
	await expect(gridDimensionsDropdown).toHaveAttribute("open", "");
	await expect(gridDimensionsDropdown.locator("#grid-rows-amount")).toBeVisible();
	await expect(gridDimensionsDropdown.locator("#grid-rows-amount")).toHaveCount(1);
	await expect(gridDimensionsDropdown.locator("#grid-columns-amount")).toHaveCount(1);
	await expect(gridDimensionsDropdown.locator("#grid-menu-size-heading")).toHaveCount(1);
	await expect(gridDimensionsDropdown.locator("#grid-shape-size-row")).toHaveCount(1);
	await expect(gridDimensionsDropdown.locator("#grid-apply-to-margins-button")).toHaveCount(0);
	const gridDimensionsSummaryAboveRowsAmount = await page.evaluate(() => {
		const summary = document
			.querySelector("#grid-menu-dimensions-dropdown summary")
			.getBoundingClientRect();
		const rowsAmount = document
			.querySelector("#grid-rows-amount-label")
			.getBoundingClientRect();
		return summary.bottom <= rowsAmount.top;
	});
	expect(gridDimensionsSummaryAboveRowsAmount).toBe(true);
	const gridAlignmentButtons = page.locator("#grid-menu-alignment-buttons button");
	await expect(gridAlignmentButtons).toHaveCount(10);
	expect((await gridAlignmentButtons.allTextContents()).map((label) => label.trim())).toEqual([
		"Left",
		"Center",
		"Right",
		"Top",
		"Top Left",
		"Top Right",
		"Bottom",
		"Bottom Left",
		"Bottom Right",
		"Custom",
	]);
	const gridAlignmentLayout = await page.evaluate(() => {
		const menu = document.querySelector("#text-editor-grid-menu").getBoundingClientRect();
		const reference = document.querySelector("#grid-applied-button");
		const referenceStyles = getComputedStyle(reference);
		const buttons = [...document.querySelectorAll("#grid-menu-alignment-buttons button")];
		const buttonBounds = buttons.map((button) => button.getBoundingClientRect());
		const buttonStyles = buttons.map((button) => getComputedStyle(button));
		const summaryStyles = getComputedStyle(
			document.querySelector("#grid-menu-alignment-dropdown summary"),
		);
		const rowsAmountStyles = getComputedStyle(
			document.querySelector("#grid-rows-amount-label"),
		);
		return {
			leftInset: buttonBounds[0].left - menu.left,
			gaps: buttonBounds
				.slice(1, 3)
				.map((bounds, index) => bounds.left - buttonBounds[index].right),
			summaryToButtonsGap:
				buttonBounds[0].top -
				document
					.querySelector("#grid-menu-alignment-dropdown summary")
					.getBoundingClientRect().bottom,
			buttonHeights: buttonBounds.map((bounds) => bounds.height),
			buttonTops: buttonBounds.map((bounds) => bounds.top),
			buttonBottoms: buttonBounds.map((bounds) => bounds.bottom),
			buttonLefts: buttonBounds.map((bounds) => bounds.left),
			buttonRights: buttonBounds.map((bounds) => bounds.right),
			horizontalGaps: [
				buttonBounds[1].left - buttonBounds[0].right,
				buttonBounds[2].left - buttonBounds[1].right,
				buttonBounds[4].left - buttonBounds[3].right,
				buttonBounds[5].left - buttonBounds[4].right,
				buttonBounds[7].left - buttonBounds[6].right,
				buttonBounds[8].left - buttonBounds[7].right,
			],
			verticalGaps: [
				buttonBounds[3].top - buttonBounds[0].bottom,
				buttonBounds[6].top - buttonBounds[3].bottom,
				buttonBounds[9].top - buttonBounds[8].bottom,
			],
			buttonWidths: buttonBounds.map((bounds) => bounds.width),
			fontSizes: buttonStyles.map((styles) => styles.fontSize),
			summaryTypographyMatchesRowsAmount: [
				"fontFamily",
				"fontSize",
				"fontWeight",
				"fontStyle",
			].every((property) => summaryStyles[property] === rowsAmountStyles[property]),
			backgroundColors: buttonStyles.map((styles) => styles.backgroundColor),
			borderRadii: buttonStyles.map((styles) => styles.borderRadius),
			shadows: buttonStyles.map((styles) => styles.boxShadow),
			referenceHeight: reference.getBoundingClientRect().height,
			referenceBorderRadius: referenceStyles.borderRadius,
			referenceShadow: referenceStyles.boxShadow,
		};
	});
	expect(gridAlignmentLayout.leftInset).toBe(16);
	expect(gridAlignmentLayout.gaps).toEqual([16, 16]);
	expect(gridAlignmentLayout.summaryToButtonsGap).toBe(16);
	expect(gridAlignmentLayout.buttonHeights).toEqual(Array(10).fill(24));
	expect(gridAlignmentLayout.fontSizes).toEqual(Array(10).fill("12px"));
	expect(gridAlignmentLayout.summaryTypographyMatchesRowsAmount).toBe(true);
	expect(new Set(gridAlignmentLayout.buttonTops.slice(0, 3)).size).toBe(1);
	expect(gridAlignmentLayout.buttonTops[3]).toBe(gridAlignmentLayout.buttonBottoms[0] + 16);
	expect(gridAlignmentLayout.buttonTops[4]).toBe(gridAlignmentLayout.buttonTops[3]);
	expect(gridAlignmentLayout.buttonTops[5]).toBe(gridAlignmentLayout.buttonTops[3]);
	expect(gridAlignmentLayout.buttonLefts[4]).toBe(gridAlignmentLayout.buttonRights[3] + 16);
	expect(gridAlignmentLayout.buttonLefts[5]).toBe(gridAlignmentLayout.buttonRights[4] + 16);
	expect(gridAlignmentLayout.buttonTops[6]).toBe(gridAlignmentLayout.buttonBottoms[5] + 16);
	expect(gridAlignmentLayout.buttonLefts[6]).toBe(gridAlignmentLayout.buttonLefts[3]);
	expect(gridAlignmentLayout.buttonTops[7]).toBe(gridAlignmentLayout.buttonTops[6]);
	expect(gridAlignmentLayout.buttonTops[8]).toBe(gridAlignmentLayout.buttonTops[6]);
	expect(gridAlignmentLayout.buttonLefts[7]).toBe(gridAlignmentLayout.buttonRights[6] + 16);
	expect(gridAlignmentLayout.buttonLefts[8]).toBe(gridAlignmentLayout.buttonRights[7] + 16);
	expect(gridAlignmentLayout.buttonTops[9]).toBe(gridAlignmentLayout.buttonBottoms[8] + 16);
	expect(gridAlignmentLayout.buttonLefts[9]).toBe(gridAlignmentLayout.buttonLefts[3]);
	expect(gridAlignmentLayout.buttonRights[9]).toBe(gridAlignmentLayout.buttonRights[8]);
	expect(gridAlignmentLayout.buttonWidths).toEqual([80, 80, 80, 80, 80, 80, 80, 120, 120, 352]);
	expect(gridAlignmentLayout.horizontalGaps).toEqual(Array(6).fill(16));
	expect(gridAlignmentLayout.verticalGaps).toEqual([16, 16, 16]);
	expect(gridAlignmentLayout.backgroundColors).toEqual(Array(10).fill("rgb(255, 48, 48)"));
	expect(gridAlignmentLayout.borderRadii).toEqual([
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
		gridAlignmentLayout.referenceBorderRadius,
	]);
	expect(gridAlignmentLayout.shadows).toEqual([
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
		gridAlignmentLayout.referenceShadow,
	]);
	const leftAlignmentButton = page.locator("#grid-alignment-left-button");
	const centerAlignmentButton = page.locator("#grid-alignment-center-button");
	const rightAlignmentButton = page.locator("#grid-alignment-right-button");
	const bottomAlignmentButton = page.locator("#grid-alignment-bottom-button");
	const topAlignmentButton = page.locator("#grid-alignment-top-button");
	const bottomLeftAlignmentButton = page.locator("#grid-alignment-bottom-left-button");
	const bottomRightAlignmentButton = page.locator("#grid-alignment-bottom-right-button");
	const topLeftAlignmentButton = page.locator("#grid-alignment-top-left-button");
	const topRightAlignmentButton = page.locator("#grid-alignment-top-right-button");
	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(bottomAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(topAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(bottomLeftAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(bottomRightAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(topLeftAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(topRightAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await leftAlignmentButton.click();
	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "true");
	await expect(leftAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await expect(leftAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	expect(
		await leftAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow),
	).toContain("rgba(0, 255, 64, 0.85)");
	await expect(leftAlignmentButton).toHaveText("Left");
	await centerAlignmentButton.click();
	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(leftAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "true");
	await expect(centerAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	expect(
		await centerAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow),
	).toContain("rgba(0, 255, 64, 0.85)");
	await expect(centerAlignmentButton).toHaveText("Center");
	await rightAlignmentButton.click();
	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "true");
	await expect(rightAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	expect(
		await rightAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow),
	).toContain("rgba(0, 255, 64, 0.85)");
	await expect(rightAlignmentButton).toHaveText("Right");
	await rightAlignmentButton.click();
	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(rightAlignmentButton).toHaveCSS("transform", "none");
	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	const applyToMarginsButton = page.locator("#grid-apply-to-margins-button");
	const rowsAmount = page.locator("#grid-rows-amount");
	const columnsAmount = page.locator("#grid-columns-amount");
	await expect(rowsAmount).toBeVisible();
	await expect(columnsAmount).toBeVisible();
	const amountInputEdges = await page.evaluate(() => {
		const rows = document.querySelector("#grid-rows-amount").getBoundingClientRect();
		const columns = document.querySelector("#grid-columns-amount").getBoundingClientRect();
		return {
			rowsLeft: rows.left,
			rowsRight: rows.right,
			columnsLeft: columns.left,
			columnsRight: columns.right,
		};
	});
	expect(amountInputEdges.rowsLeft).toBe(amountInputEdges.columnsLeft);
	expect(amountInputEdges.rowsRight).toBe(amountInputEdges.columnsRight);
	const gridShapesList = page.locator("#grid-menu-shapes-list");
	await expect(page.locator("#grid-sides-label, #grid-sides-input")).toHaveCount(0);
	const gridHeadingLayout = await page.evaluate(() => {
		const menu = document.querySelector("#text-editor-grid-menu");
		const alignment = document.querySelector("#grid-menu-alignment-heading");
		const lines = document.querySelector("#grid-menu-lines-heading");
		const shapes = document.querySelector("#grid-menu-shapes-heading");
		const size = document.querySelector("#grid-menu-size-heading");
		const sizeDimensions = document.querySelector("#grid-shape-size-row");
		const dimensionsDropdown = document.querySelector("#grid-menu-dimensions-dropdown");
		const alignmentStyles = getComputedStyle(alignment);
		const linesStyles = getComputedStyle(lines);
		const menuLeft = menu.getBoundingClientRect().left;
		return {
			linesLeftOffset: lines.getBoundingClientRect().left - menuLeft,
			shapesLeftOffset: shapes.getBoundingClientRect().left - menuLeft,
			sizeDimensionsGap:
				sizeDimensions.getBoundingClientRect().top - size.getBoundingClientRect().bottom,
			sizeHeadingInsideDimensions:
				size.closest("#grid-menu-dimensions-dropdown") === dimensionsDropdown,
			sizeControlsInsideDimensions:
				sizeDimensions.closest("#grid-menu-dimensions-dropdown") === dimensionsDropdown,
			shapesGap: shapes.getBoundingClientRect().top - size.getBoundingClientRect().bottom,
			sizeText: size.textContent.trim(),
			linesTextAlign: linesStyles.textAlign,
			matchingStyle: ["color", "fontFamily", "fontSize", "fontWeight", "lineHeight"].every(
				(property) => alignmentStyles[property] === linesStyles[property],
			),
		};
	});
	expect(gridHeadingLayout.sizeText).toBe("Size");
	expect(gridHeadingLayout.linesLeftOffset).toBe(16);
	expect(gridHeadingLayout.shapesLeftOffset).toBe(16);
	expect(gridHeadingLayout.sizeDimensionsGap).toBe(16);
	expect(gridHeadingLayout.sizeHeadingInsideDimensions).toBe(true);
	expect(gridHeadingLayout.sizeControlsInsideDimensions).toBe(true);
	expect(gridHeadingLayout.shapesGap).toBeGreaterThan(0);
	expect(gridHeadingLayout.linesTextAlign).toBe("left");
	expect(gridHeadingLayout.matchingStyle).toBe(true);
	await expect(gridAppliedButton).toHaveText("On");
	await expect(gridAppliedButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	const gridPrintableButton = page.locator("#grid-menu-printable-button");
	await expect(gridPrintableButton).toHaveText("Printable");
	await expect(gridPrintableButton).toHaveAttribute("aria-pressed", "true");
	await expect(gridPrintableButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	const printableOnShadow = await gridPrintableButton.evaluate(
		(button) => getComputedStyle(button).boxShadow,
	);
	expect(printableOnShadow).toContain("rgba(0, 255, 64, 0.85)");
	await expect(gridPrintableButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await gridPrintableButton.click();
	await expect(gridPrintableButton).toHaveAttribute("aria-pressed", "false");
	await expect(gridPrintableButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	await expect(gridPrintableButton).toHaveCSS("box-shadow", "none");
	await gridPrintableButton.click();
	await expect(gridPrintableButton).toHaveAttribute("aria-pressed", "true");
	await expect(applyToMarginsButton).toHaveText("Off");
	await expect(applyToMarginsButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	await expect(rowsAmount).toHaveAttribute("maxlength", "3");
	await expect(columnsAmount).toHaveAttribute("maxlength", "3");
	await expect(rowsAmount).toHaveAttribute("inputmode", "numeric");
	await expect(columnsAmount).toHaveAttribute("inputmode", "numeric");
	const gridShapeWidthInput = page.locator("#grid-shape-width-input");
	await expect(gridShapeWidthInput).toHaveAttribute("maxlength", "4");
	await expect(gridShapeWidthInput).toHaveAttribute("inputmode", "decimal");
	await expect(page.locator("#grid-shape-width-unit")).toHaveText("inches");
	const gridShapeHeightInput = page.locator("#grid-shape-height-input");
	await expect(gridShapeHeightInput).toHaveAttribute("maxlength", "4");
	await expect(gridShapeHeightInput).toHaveAttribute("inputmode", "decimal");
	await expect(page.locator("#grid-shape-height-unit")).toHaveText("inches");
	const gridDimensionTypographyMatches = await page.evaluate(() => {
		const reference = getComputedStyle(document.querySelector("#grid-rows-amount-label"));
		const properties = ["fontFamily", "fontSize", "fontWeight", "fontStyle"];
		return [
			"#grid-shape-width-label",
			"#grid-shape-width-unit",
			"#grid-shape-height-label",
			"#grid-shape-height-unit",
		].every((selector) => {
			const styles = getComputedStyle(document.querySelector(selector));
			return properties.every((property) => styles[property] === reference[property]);
		});
	});
	expect(gridDimensionTypographyMatches).toBe(true);
	await gridShapeHeightInput.fill("2a.3");
	await expect(gridShapeHeightInput).toHaveValue("2.3");
	const gridDimensionLayout = await page.evaluate(() => {
		const rowsInput = document.querySelector("#grid-rows-amount").getBoundingClientRect();
		const columnsInput = document.querySelector("#grid-columns-amount").getBoundingClientRect();
		const sizeHeading = document
			.querySelector("#grid-menu-size-heading")
			.getBoundingClientRect();
		const itemBounds = [
			"#grid-shape-width-label",
			"#grid-shape-width-input",
			"#grid-shape-width-unit",
			"#grid-shape-height-label",
			"#grid-shape-height-input",
			"#grid-shape-height-unit",
		].map((selector) => document.querySelector(selector).getBoundingClientRect());
		const widthRow = itemBounds.slice(0, 3);
		const heightRow = itemBounds.slice(3, 6);
		return {
			widthRowHasReadableGaps: widthRow.every(
				(bounds, index) => index === 0 || bounds.left - widthRow[index - 1].right >= 5,
			),
			heightRowHasReadableGaps: heightRow.every(
				(bounds, index) => index === 0 || bounds.left - heightRow[index - 1].right >= 5,
			),
			rowsToColumnsGap: columnsInput.top - rowsInput.bottom,
			columnsToSizeHeadingGap: sizeHeading.top - columnsInput.bottom,
			sizeHeadingToWidthGap:
				Math.min(...widthRow.map((bounds) => bounds.top)) - sizeHeading.bottom,
			verticalGap:
				Math.min(...heightRow.map((bounds) => bounds.top)) -
				Math.max(...widthRow.map((bounds) => bounds.bottom)),
			widthHeightInputsAligned:
				itemBounds[1].left === itemBounds[4].left &&
				itemBounds[1].right === itemBounds[4].right,
		};
	});
	expect(gridDimensionLayout.widthRowHasReadableGaps).toBe(true);
	expect(gridDimensionLayout.heightRowHasReadableGaps).toBe(true);
	expect(gridDimensionLayout.rowsToColumnsGap).toBe(16);
	expect(gridDimensionLayout.columnsToSizeHeadingGap).toBe(16);
	expect(gridDimensionLayout.sizeHeadingToWidthGap).toBe(16);
	expect(gridDimensionLayout.verticalGap).toBe(16);
	expect(gridDimensionLayout.widthHeightInputsAligned).toBe(true);
	await gridShapeWidthInput.fill("1a.2");
	await expect(gridShapeWidthInput).toHaveValue("1.2");
	await gridShapeWidthInput.fill("1..2");
	await expect(gridShapeWidthInput).toHaveValue("1.2");
	await rowsAmount.fill("1");
	await rowsAmount.pressSequentially("a23");
	await expect(rowsAmount).toHaveValue("123");
	await columnsAmount.fill("45");
	await applyToMarginsButton.scrollIntoViewIfNeeded();
	const applyToMarginsBounds = await applyToMarginsButton.boundingBox();
	await page.mouse.move(
		applyToMarginsBounds.x + applyToMarginsBounds.width / 2,
		applyToMarginsBounds.y + applyToMarginsBounds.height / 2,
	);
	await page.mouse.down();
	await expect(applyToMarginsButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await page.mouse.up();
	await expect(applyToMarginsButton).toHaveAttribute("aria-pressed", "true");
	await expect(applyToMarginsButton).toHaveText("On");
	await expect(applyToMarginsButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	await page.mouse.move(0, 0);
	await expect(applyToMarginsButton).toHaveCSS("transform", "none");
	await page.locator("#text-editor-grid-menu").evaluate((menu) => {
		menu.scrollTop = 0;
	});
	const gridControlGaps = await page.evaluate(() => {
		const menu = document.querySelector("#text-editor-grid-menu").getBoundingClientRect();
		const heading = document.querySelector("#grid-menu-alignment-heading");
		const headingBounds = heading.getBoundingClientRect();
		const headingStyles = getComputedStyle(heading);
		const labels = [
			"#grid-applied-label",
			"#grid-menu-alignment-heading",
			"#grid-rows-amount-label",
			"#grid-columns-amount-label",
			"#grid-apply-to-margins-label",
		].map((selector) => document.querySelector(selector).getBoundingClientRect());
		const appliedButton = document
			.querySelector("#grid-applied-button")
			.getBoundingClientRect();
		const marginsButton = document
			.querySelector("#grid-apply-to-margins-button")
			.getBoundingClientRect();
		return {
			left: labels[0].left - menu.left,
			top: appliedButton.top - menu.top,
			appliedLabelCenterOffset:
				labels[0].top +
				labels[0].height / 2 -
				(appliedButton.top + appliedButton.height / 2),
			marginsLabelTopOffset: labels[4].top - labels[0].top,
			marginsButtonTopOffset: marginsButton.top - appliedButton.top,
			marginsRightOffset: labels[4].left - appliedButton.right,
			verticalGaps: labels.slice(1).map((label, index) => label.top - labels[index].bottom),
			headingFontSize: Number.parseFloat(headingStyles.fontSize),
			headingColor: headingStyles.color,
			headingCenter: headingBounds.left + headingBounds.width / 2,
		};
	});
	expect(gridControlGaps.left).toBe(16);
	expect(gridControlGaps.top).toBe(16);
	expect(gridControlGaps.appliedLabelCenterOffset).toBe(0);
	expect(gridControlGaps.marginsLabelTopOffset).toBe(0);
	expect(gridControlGaps.marginsButtonTopOffset).toBe(0);
	expect(gridControlGaps.marginsRightOffset).toBeGreaterThan(0);
	expect(gridControlGaps.verticalGaps[0]).toBe(67);
	expect(gridControlGaps.headingFontSize).toBeCloseTo((22 * 96) / 72, 2);
	expect(gridControlGaps.headingColor).toBe("rgb(0, 0, 0)");
	await gridAppliedButton.click();
	await expect(gridAppliedButton).toHaveText("Off");
	await expect(page.locator("#grid-menu-selection-prompt")).toHaveCount(0);
	await gridAppliedButton.click();
	await expect(gridAppliedButton).toHaveText("On");
	await gridShapesList.locator('[data-side-count="5"]').click();
	await newButton.click();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await expect(page.locator("#text-editor-new-menu")).toHaveCount(0);
	await expect(newButton).toHaveAttribute("aria-pressed", "false");
	await page.locator("#text-editor-grid-button").click();
	await newButton.click();
	await page.locator("#text-editor-new-create-template-button").click();
	await expect(page.locator("#print-preview-paper")).toBeVisible();
	await page.locator("#text-editor-grid-button").click();
	await gridAlignmentDropdown.locator("summary").click();
	await gridDimensionsDropdown.locator("summary").click();
	await rowsAmount.fill("");
	await columnsAmount.fill("");
	const templateGap = await page.evaluate(() => {
		const paper = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const menu = document.querySelector("#text-editor-grid-menu").getBoundingClientRect();
		return menu.left - paper.right;
	});
	expect(templateGap).toBe(16);
	const paper = page.locator("#print-preview-paper");
	await expect(paper).toHaveAttribute("data-grid-applied", "true");
	await expect(paper).toHaveAttribute("data-grid-printable", "true");
	await expect(paper).toHaveAttribute("data-grid-sides", "4");
	await gridShapesList.locator('[data-side-count="3"]').click();
	await expect(paper).toHaveAttribute("data-grid-sides", "4");
	const grid = paper.locator(".print-preview-grid");
	await expect(grid).toHaveAttribute("data-grid-rows", "3");
	await expect(grid).toHaveAttribute("data-grid-columns", "4");
	await expect(grid).toHaveAttribute("data-grid-rendered-rows", "3");
	await expect(grid).toHaveAttribute("data-grid-rendered-columns", "4");
	await expect(grid).toHaveAttribute("data-grid-sides", "4");
	await expect(grid).toBeVisible();
	await gridPrintableButton.click();
	await expect(paper).toHaveAttribute("data-grid-printable", "false");
	await page.emulateMedia({ media: "print" });
	await expect(grid).toBeHidden();
	await page.emulateMedia({ media: "screen" });
	await gridPrintableButton.click();
	await expect(paper).toHaveAttribute("data-grid-printable", "true");
	await page.emulateMedia({ media: "print" });
	await expect(grid).toBeVisible();
	await page.emulateMedia({ media: "screen" });
	await expect(grid).toBeVisible();
	const gridOutline = grid.locator("[data-grid-outline]");
	await expect(gridOutline).toHaveAttribute("stroke-width", "2");
	await expect(gridOutline).toHaveAttribute(
		"d",
		/^M 1 1 H [\d.]+ M 1 1 V [\d.]+ M [\d.]+ 1 V [\d.]+$/,
	);
	await expect(grid.locator("[data-grid-connection]")).toHaveCount(0);
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	for (const variant of ["square", "diamond", "vertical-rectangle", "horizontal-rectangle"]) {
		const quadrilateralOption = gridShapesList.locator(`[data-shape-variant="${variant}"]`);
		await quadrilateralOption.click();
		await expect(quadrilateralOption).toHaveCSS("text-shadow", /rgb\(57, 255, 20\)/);
		await expect(gridShapesList.locator('[data-side-count="4"]')).toHaveCSS(
			"text-shadow",
			/rgb\(57, 255, 20\)/,
		);
	}
	await rowsAmount.fill("321");
	await columnsAmount.fill("54");
	await expect(paper).toHaveAttribute("data-grid-rows", "321");
	await expect(paper).toHaveAttribute("data-grid-columns", "54");
	await expect(grid).toHaveAttribute("data-grid-rows", "321");
	await expect(grid).toHaveAttribute("data-grid-columns", "54");
	const gridPatternSize = await grid.locator("pattern").evaluate((pattern) => {
		const [viewBoxWidth, viewBoxHeight] = pattern.ownerSVGElement
			.getAttribute("viewBox")
			.split(" ")
			.slice(2)
			.map(Number);
		const renderedArea = pattern.ownerSVGElement.querySelector("[data-grid-shape-area]");
		return {
			cellWidth: Number(pattern.getAttribute("width")),
			cellHeight: Number(pattern.getAttribute("height")),
			viewBoxWidth,
			viewBoxHeight,
			renderedWidth: Number(renderedArea.getAttribute("width")),
			renderedHeight: Number(renderedArea.getAttribute("height")),
			renderedColumns: Number(pattern.ownerSVGElement.dataset.gridRenderedColumns),
			renderedRows: Number(pattern.ownerSVGElement.dataset.gridRenderedRows),
		};
	});
	expect(gridPatternSize.renderedColumns).toBe(54);
	expect(gridPatternSize.renderedRows).toBe(321);
	expect(gridPatternSize.cellWidth * gridPatternSize.renderedColumns).toBeCloseTo(
		gridPatternSize.renderedWidth,
		2,
	);
	expect(gridPatternSize.cellHeight * gridPatternSize.renderedRows).toBeCloseTo(
		gridPatternSize.renderedHeight,
		2,
	);
	expect(gridPatternSize.renderedHeight).toBeLessThanOrEqual(gridPatternSize.viewBoxHeight);
	expect(gridPatternSize.viewBoxHeight - gridPatternSize.renderedHeight).toBeLessThan(
		gridPatternSize.cellHeight,
	);
	await page.locator("#text-editor-margins-button").click();
	await page.locator("#text-editor-margin-top-input").fill("12");
	await page.locator("#text-editor-margin-right-input").fill("9");
	await page.locator("#text-editor-margin-bottom-input").fill("6");
	await page.locator("#text-editor-margin-left-input").fill("8");
	const marginGridCoverage = await grid.locator("[data-grid-shape-area]").evaluate((area) => {
		const [, , viewBoxWidth, viewBoxHeight] = area.ownerSVGElement
			.getAttribute("viewBox")
			.split(" ")
			.map(Number);
		return {
			width: Number(area.getAttribute("width")),
			height: Number(area.getAttribute("height")),
			viewBoxWidth,
			viewBoxHeight,
		};
	});
	expect(marginGridCoverage.width).toBeCloseTo(marginGridCoverage.viewBoxWidth, 3);
	expect(marginGridCoverage.height).toBeCloseTo(marginGridCoverage.viewBoxHeight, 3);
	await rightAlignmentButton.click();
	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const rightGridAlignment = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			gridWidth: grid.width,
			areaWidth: area.width,
			leftGap: area.left - grid.left,
			rightGap: grid.right - area.right,
		};
	});
	expect(rightGridAlignment.areaWidth).toBeCloseTo(rightGridAlignment.gridWidth, 1);
	expect(Math.abs(rightGridAlignment.leftGap)).toBeLessThan(0.1);
	expect(Math.abs(rightGridAlignment.rightGap)).toBeLessThan(0.1);
	await centerAlignmentButton.click();
	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const centerGridAlignment = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			gridWidth: grid.width,
			gridHeight: grid.height,
			areaWidth: area.width,
			areaHeight: area.height,
			leftGap: area.left - grid.left,
			rightGap: grid.right - area.right,
			topGap: area.top - grid.top,
			bottomGap: grid.bottom - area.bottom,
		};
	});
	expect(centerGridAlignment.areaWidth).toBeCloseTo(centerGridAlignment.gridWidth, 1);
	expect(centerGridAlignment.areaHeight).toBeCloseTo(centerGridAlignment.gridHeight, 1);
	expect(Math.abs(centerGridAlignment.leftGap - centerGridAlignment.rightGap)).toBeLessThan(0.1);
	expect(Math.abs(centerGridAlignment.topGap - centerGridAlignment.bottomGap)).toBeLessThan(0.1);
	const gridMarginOffsets = await page.evaluate(() => {
		const paperBounds = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const gridBounds = document.querySelector(".print-preview-grid").getBoundingClientRect();
		return {
			top: gridBounds.top - paperBounds.top,
			right: paperBounds.right - gridBounds.right,
			bottom: paperBounds.bottom - gridBounds.bottom,
			left: gridBounds.left - paperBounds.left,
		};
	});
	expect(gridMarginOffsets).toEqual({ top: 12, right: 9, bottom: 6, left: 8 });
	await bottomLeftAlignmentButton.click();
	await expect(bottomLeftAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const bottomLeftWithMargins = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return { leftGap: area.left - grid.left, bottomGap: grid.bottom - area.bottom };
	});
	expect(Math.abs(bottomLeftWithMargins.leftGap)).toBeLessThan(0.1);
	expect(Math.abs(bottomLeftWithMargins.bottomGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "false");
	const bottomLeftWithoutMargins = await page.evaluate(() => {
		const paperBounds = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			leftGap: area.left - paperBounds.left,
			bottomGap: paperBounds.bottom - area.bottom,
		};
	});
	expect(Math.abs(bottomLeftWithoutMargins.leftGap)).toBeLessThan(0.1);
	expect(Math.abs(bottomLeftWithoutMargins.bottomGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	await bottomRightAlignmentButton.click();
	await expect(bottomRightAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const bottomRightWithMargins = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return { rightGap: grid.right - area.right, bottomGap: grid.bottom - area.bottom };
	});
	expect(Math.abs(bottomRightWithMargins.rightGap)).toBeLessThan(0.1);
	expect(Math.abs(bottomRightWithMargins.bottomGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "false");
	const bottomRightWithoutMargins = await page.evaluate(() => {
		const paperBounds = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			rightGap: paperBounds.right - area.right,
			bottomGap: paperBounds.bottom - area.bottom,
		};
	});
	expect(Math.abs(bottomRightWithoutMargins.rightGap)).toBeLessThan(0.1);
	expect(Math.abs(bottomRightWithoutMargins.bottomGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	await topLeftAlignmentButton.click();
	await expect(topLeftAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const topLeftWithMargins = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return { leftGap: area.left - grid.left, topGap: area.top - grid.top };
	});
	expect(Math.abs(topLeftWithMargins.leftGap)).toBeLessThan(0.1);
	expect(Math.abs(topLeftWithMargins.topGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "false");
	const topLeftWithoutMargins = await page.evaluate(() => {
		const paperBounds = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return { leftGap: area.left - paperBounds.left, topGap: area.top - paperBounds.top };
	});
	expect(Math.abs(topLeftWithoutMargins.leftGap)).toBeLessThan(0.1);
	expect(Math.abs(topLeftWithoutMargins.topGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	await topRightAlignmentButton.click();
	await expect(topRightAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const topRightWithMargins = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return { rightGap: grid.right - area.right, topGap: area.top - grid.top };
	});
	expect(Math.abs(topRightWithMargins.rightGap)).toBeLessThan(0.1);
	expect(Math.abs(topRightWithMargins.topGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "false");
	const topRightWithoutMargins = await page.evaluate(() => {
		const paperBounds = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return { rightGap: paperBounds.right - area.right, topGap: area.top - paperBounds.top };
	});
	expect(Math.abs(topRightWithoutMargins.rightGap)).toBeLessThan(0.1);
	expect(Math.abs(topRightWithoutMargins.topGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	await bottomAlignmentButton.click();
	await expect(bottomAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const bottomWithMargins = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			centerGap: area.left + area.width / 2 - (grid.left + grid.width / 2),
			bottomGap: grid.bottom - area.bottom,
		};
	});
	expect(Math.abs(bottomWithMargins.centerGap)).toBeLessThan(0.1);
	expect(Math.abs(bottomWithMargins.bottomGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "false");
	const bottomWithoutMargins = await page.evaluate(() => {
		const paperBounds = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			centerGap: area.left + area.width / 2 - (paperBounds.left + paperBounds.width / 2),
			bottomGap: paperBounds.bottom - area.bottom,
		};
	});
	expect(Math.abs(bottomWithoutMargins.centerGap)).toBeLessThan(0.1);
	expect(Math.abs(bottomWithoutMargins.bottomGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	await topAlignmentButton.click();
	await expect(topAlignmentButton).toHaveAttribute("aria-pressed", "true");
	const topWithMargins = await page.evaluate(() => {
		const grid = document.querySelector("#print-preview-grid").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			centerGap: area.left + area.width / 2 - (grid.left + grid.width / 2),
			topGap: area.top - grid.top,
		};
	});
	expect(Math.abs(topWithMargins.centerGap)).toBeLessThan(0.1);
	expect(Math.abs(topWithMargins.topGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "false");
	const topWithoutMargins = await page.evaluate(() => {
		const paperBounds = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const area = document.querySelector("[data-grid-shape-area]").getBoundingClientRect();
		return {
			centerGap: area.left + area.width / 2 - (paperBounds.left + paperBounds.width / 2),
			topGap: area.top - paperBounds.top,
		};
	});
	expect(Math.abs(topWithoutMargins.centerGap)).toBeLessThan(0.1);
	expect(Math.abs(topWithoutMargins.topGap)).toBeLessThan(0.1);
	await applyToMarginsButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	await gridShapesList.locator('[data-side-count="4"]').click();
	await expect(page.locator("#grid-menu-quadrilateral-prompt-message")).toHaveText(
		"Pick One of the Quadrilaterals",
	);
	const quadrilateralBackStyles = await page.evaluate(() => {
		const properties = [
			"width",
			"minHeight",
			"padding",
			"border",
			"borderRadius",
			"fontWeight",
			"backgroundImage",
			"color",
			"boxShadow",
		];
		const readStyles = (selector) => {
			const styles = getComputedStyle(document.querySelector(selector));
			return Object.fromEntries(properties.map((property) => [property, styles[property]]));
		};
		return {
			prompt: readStyles("#grid-menu-quadrilateral-prompt-back-button"),
			textEditor: readStyles("#text-editor-workflow-back-button"),
		};
	});
	expect(quadrilateralBackStyles.prompt).toEqual(quadrilateralBackStyles.textEditor);
	await page.locator("#grid-menu-quadrilateral-prompt-back-button").click();
	await expect(page.locator("#grid-menu-quadrilateral-prompt")).toHaveCount(0);
});
