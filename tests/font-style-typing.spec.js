import { expect, test } from "@playwright/test";

test("font styles affect highlighted text and text typed afterward only", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 1200 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Templates" }).click();
	await page.getByRole("button", { name: "New +" }).click();

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
		.getByRole("button", { name: "Fonts", exact: true })
		.click();
	await page.getByRole("button", { name: "Minecraft Reg 1" }).click();

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
	await page.getByRole("button", { name: "Minecraft Reg 2", exact: true }).click();
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

test("font style buttons use the requested 16px spacing and centered text", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 1200 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open parent section" }).click();
	await page.getByRole("button", { name: "Text Editor" }).click();
	await page.getByRole("button", { name: "Templates" }).click();
	await page.getByRole("button", { name: "New +" }).click();

	await page.getByRole("button", { name: "Tools" }).click();
	await page.getByRole("button", { name: "Fonts", exact: true }).click();
	await page
		.locator("#text-editor-fonts-panel")
		.getByRole("button", { name: "Fonts", exact: true })
		.click();

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

	expect(metrics[0].width).toBeGreaterThan(130);
	expect(metrics[0].width).toBeLessThan(140);
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