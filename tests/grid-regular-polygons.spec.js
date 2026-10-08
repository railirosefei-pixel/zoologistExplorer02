import { expect, test } from "@playwright/test";

test("Grid shapes with more than four sides keep equal edges in base and added cells", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-new-button").click();
	await page.locator("#text-editor-new-create-template-button").click();
	await page.locator("#text-editor-grid-button").click();

	await page.locator("#grid-menu-dimensions-dropdown > summary").click();
	await page.locator("#grid-shape-width-input").fill("2.35");
	await page.locator("#grid-shape-height-input").fill("3.35");
	await page.locator("#grid-shape-size-commit-button").click();
	await page.locator("#grid-menu-dimensions-dropdown > summary").click();
	await page.locator("#grid-shape-option-5").click();
	await page.locator("#grid-sides-commit-button").click();

	const grid = page.locator("#print-preview-grid");
	await page.locator("#grid-menu-single-shape-alignment-dropdown > summary").click();
	await page.locator("#grid-menu-shape-addition-button").click();
	const assertEqualPolygonEdges = async (polygon) => {
		const edgeLengths = await polygon.evaluate((element) => {
			const points = element.points;
			const vertices = Array.from({ length: points.numberOfItems }, (_, index) =>
				points.getItem(index),
			);
			return vertices.map((vertex, index) => {
				const next = vertices[(index + 1) % vertices.length];
				return Math.hypot(next.x - vertex.x, next.y - vertex.y);
			});
		});
		expect(edgeLengths.length).toBeGreaterThan(4);
		for (const edgeLength of edgeLengths.slice(1)) {
			expect(edgeLength).toBeCloseTo(edgeLengths[0], 3);
		}
	};

	await assertEqualPolygonEdges(grid.locator("#print-preview-grid-shape-pattern polygon"));

	for (const direction of ["row", "column"]) {
		await page.locator(`#grid-menu-shape-addition-${direction}-button`).click();
		await page.locator("#grid-menu-shape-addition-selection").selectOption("5");
		const gridBounds = await grid.boundingBox();
		await grid.click({
			position: { x: gridBounds.width / 8, y: gridBounds.height / 6 },
		});

		const addedShape = grid.locator(`[data-grid-added-shape="${direction}"]`);
		await expect(addedShape).toHaveAttribute("data-grid-added-sides", "5");
		await assertEqualPolygonEdges(addedShape);
	}
});
