import { test, expect } from "@playwright/test";

test("paper template prompts for a name and saves the full template under the new schema", async ({ page }) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Templates" }).click();
	await page.getByRole("button", { name: "New +" }).click();

	const editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toBeFocused();
	await editor.press("Tab");
	await expect(editor).toHaveText("    ");
	const beforeEmptyLineEnter = await editor.evaluate((element) => element.innerHTML);
	await editor.press("Enter");
	const afterEmptyLineEnter = await editor.evaluate((element) => element.innerHTML);
	expect(afterEmptyLineEnter).not.toBe(beforeEmptyLineEnter);

	await editor.type("Line 1");
	await page.keyboard.press("Enter");
	await editor.type("Line 2");
	await page.keyboard.press("Enter");
	await editor.type("Line 3");
	const beforeNormalEnter = await editor.evaluate((element) => element.innerHTML);
	await page.keyboard.press("Enter");
	const afterNormalEnter = await editor.evaluate((element) => element.innerHTML);
	expect(afterNormalEnter).not.toBe(beforeNormalEnter);

	for (let index = 0; index < 60; index += 1) {
		await editor.type(`Line ${index + 1}`);
		await page.keyboard.press("Enter");
	}
	const beforeBottom = await editor.evaluate((element) => element.innerHTML);
	for (let index = 0; index < 3; index += 1) {
		await page.keyboard.press("Enter");
	}
	const afterBottom = await editor.evaluate((element) => element.innerHTML);

	expect(afterBottom).toBe(beforeBottom);

	const metrics = await editor.evaluate((element) => {
		const styles = window.getComputedStyle(element);
		return {
			overflow: styles.overflow,
			scrollHeight: element.scrollHeight,
			clientHeight: element.clientHeight,
		};
	});

	expect(metrics.overflow).toBe("hidden");
	expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);

	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect(page.locator("#text-editor-template-name-prompt")).toBeVisible();
	await page.locator("#text-editor-template-name-input").fill("Keys Test Template");
	await page.getByRole("button", { name: "Save Template" }).click();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);

	const savedTemplates = await page.evaluate(() => {
		const rawValue = window.localStorage.getItem("ze2.textEditor.savedTemplates");
		return rawValue ? JSON.parse(rawValue) : [];
	});

	expect(savedTemplates).toHaveLength(1);
	expect(savedTemplates[0].name).toBe("Keys Test Template");
	expect(savedTemplates[0].template.html).toContain("Line 1");
	expect(savedTemplates[0].template.widthValue).toBe("8");
	expect(savedTemplates[0].template.widthUnit).toBe("in");
});
