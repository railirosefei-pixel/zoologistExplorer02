import { test, expect } from "@playwright/test";

test("saved templates stay available across reloads and restore their paper state", async ({
	page,
}) => {
	await page.goto("./");
	await page.evaluate(() => window.localStorage.clear());
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Templates", exact: true }).click();
	await page.getByRole("button", { name: "New +" }).click();

	const editor = page.locator(".print-preview-paper-editor");
	await editor.fill("Alphabet Practice");
	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Size" }).click();
	await page.locator("#text-editor-size-width").fill("5");

	const saveButton = page.locator("#text-editor-template-save-button");
	const prompt = page.locator("#text-editor-template-name-prompt");
	await saveButton.click();
	await expect(prompt).toBeVisible();
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
	await page.getByRole("button", { name: "Templates", exact: true }).click();
	await page.getByRole("button", { name: "Saved" }).click();
	await expect(page.getByRole("button", { name: "Alphabet 5in" })).toBeVisible();
	await page.getByRole("button", { name: "Alphabet 5in" }).click();

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
	await page.getByRole("button", { name: "Templates", exact: true }).click();
	await page.getByRole("button", { name: "Saved" }).click();
	await expect(page.getByRole("button", { name: "Alphabet 5in" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Second" })).toBeVisible();
});
