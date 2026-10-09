import { test, expect } from "@playwright/test";

test("loaded editable paper templates preserve keyboard line bounds", async ({ page }) => {
	await page.addInitScript(() => {
		window.localStorage.setItem(
			"ze2.textEditor.savedTemplates",
			JSON.stringify([
				{
					id: "paper-keys-test-template",
					name: "Keyboard Test Template",
					template: {
						html: "",
						widthValue: "8",
						widthUnit: "in",
						heightValue: "10",
						heightUnit: "in",
					},
				},
			]),
		);
	});
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.locator("#text-editor-template-load-button").click();
	await page.getByRole("button", { name: "Keyboard Test Template" }).click();

	const editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toHaveAttribute("contenteditable", "true");
	await editor.focus();
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

	for (let index = 0; index < 100; index += 1) {
		await editor.type(`Line ${index + 1}`);
		const beforeEnter = await editor.evaluate((element) => element.innerHTML);
		await page.keyboard.press("Enter");
		const afterEnter = await editor.evaluate((element) => element.innerHTML);
		if (afterEnter === beforeEnter) {
			break;
		}
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
	expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight);
});

test("new shells reject text while keeping size tools available", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();

	const panel = page.locator("#text-editor-print-preview-panel");
	const shellBounds = await panel.evaluate((element) => {
		const panelRect = element.getBoundingClientRect();
		const navigationRect = document
			.querySelector("#text-editor-navigation-bar")
			.getBoundingClientRect();
		return {
			top: panelRect.top,
			left: panelRect.left,
			right: panelRect.right,
			bottom: panelRect.bottom,
			navigationBottom: navigationRect.bottom,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
		};
	});
	expect(shellBounds).toEqual({
		top: shellBounds.navigationBottom,
		left: 0,
		right: shellBounds.viewportWidth,
		bottom: shellBounds.viewportHeight,
		navigationBottom: 96,
		viewportWidth: shellBounds.viewportWidth,
		viewportHeight: shellBounds.viewportHeight,
	});

	const editor = page.locator(".print-preview-paper-editor");
	await expect(editor).toHaveAttribute("contenteditable", "false");
	await page.keyboard.type("Text is not allowed");
	await expect(editor).toBeEmpty();

	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Size" }).click();
	await page.locator("#text-editor-size-width").fill("5");
	await expect(page.locator("#text-editor-size-width")).toHaveValue("5");
	await expect(page.locator("#text-editor-template-save-button")).toBeVisible();
});
