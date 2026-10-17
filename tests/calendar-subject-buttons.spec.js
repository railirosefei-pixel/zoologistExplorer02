import { expect, test } from "@playwright/test";

test("daily subject buttons toggle their raised state and subject glow", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const day = page.locator("#calendar-day-cell-October-2026-18");
	await day.click();
	await day.click();

	const subjects = [
		{
			id: "daily-menu-math-button",
			sideColor: "rgba(255, 235, 145, 0.96)",
			glows: ["rgba(255, 235, 145"],
		},
		{
			id: "daily-menu-language-arts-button",
			sideColor: "rgba(255, 173, 180, 0.96)",
			glows: ["rgba(255, 173, 180"],
		},
		{
			id: "daily-menu-social-studies-button",
			sideColor: "rgba(174, 239, 184, 0.96)",
			glows: ["rgba(174, 239, 184"],
		},
		{
			id: "daily-menu-science-button",
			sideColor: "rgba(166, 218, 255, 0.96)",
			glows: ["rgba(166, 218, 255"],
		},
		{
			id: "daily-menu-art-button",
			sideColor: "rgba(255, 184, 218, 0.96)",
			glows: [
				"rgba(255, 166, 203",
				"rgba(255, 226, 156",
				"rgba(190, 240, 174",
				"rgba(160, 220, 255",
				"rgba(198, 184, 255",
			],
		},
		{
			id: "daily-menu-exercise-button",
			sideColor: "rgba(218, 224, 235, 0.96)",
			glows: ["rgba(218, 224, 235"],
		},
	];
	const buttons = subjects.map(({ id }) => page.locator(`#${id}`));

	for (const [index, { glows, sideColor }] of subjects.entries()) {
		const button = buttons[index];
		await expect(button).toHaveAttribute("aria-pressed", "false");
		const actualSideColor = await button.evaluate((element) =>
			getComputedStyle(element).getPropertyValue("--daily-menu-button-shadow-color").trim(),
		);
		expect(actualSideColor).toBe(sideColor);
		const raisedShadow = await button.evaluate(
			(element) => getComputedStyle(element).boxShadow,
		);
		expect(raisedShadow).toContain("9px");

		await button.click();
		await expect(button).toHaveAttribute("aria-pressed", "true");
		for (const [otherIndex, otherButton] of buttons.entries()) {
			if (otherIndex !== index) {
				await expect(otherButton).toHaveAttribute("aria-pressed", "false");
			}
		}

		await expect
			.poll(() =>
				button.evaluate(
					(element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42,
				),
			)
			.toBe(7);
		const selectedShadow = await button.evaluate(
			(element) => getComputedStyle(element).boxShadow,
		);
		for (const glow of glows) {
			expect(selectedShadow).toContain(glow);
		}

		await button.click();
		await expect(button).toHaveAttribute("aria-pressed", "false");
	}
});

for (const dayNumber of [16, 23]) {
	test(`selected Block tabs and their panels rise together on October ${dayNumber}`, async ({
		page,
	}) => {
		await page.goto("./");
		await page.getByRole("button", { name: "Open student section" }).click();

		const day = page.locator(`#calendar-day-cell-October-2026-${dayNumber + 2}`);
		await day.click();
		await day.click();
		await expect(page.locator(".daily-menu-date")).toHaveText(`October ${dayNumber}, 2026`);

		for (const subject of ["math", "language-arts", "social-studies", "science", "art"]) {
			await page.locator(`#daily-menu-${subject}-button`).click();

			for (const blockNumber of [1, 2, 3]) {
				const tab = page.locator(`#daily-menu-${subject}-block-${blockNumber}-button`);
				await tab.click();
				await expect(tab).toHaveAttribute("aria-selected", "true");
				await expect
					.poll(() =>
						tab.evaluate(
							(element) =>
								new DOMMatrixReadOnly(getComputedStyle(element).transform).m42,
						),
					)
					.toBeCloseTo(-6, 1);
				await expect
					.poll(() =>
						tab.evaluate((element) => {
							const style = getComputedStyle(element);
							return {
								zIndex: style.zIndex,
								boxShadow: style.boxShadow,
							};
						}),
					)
					.toMatchObject({
						zIndex: "1",
						boxShadow: expect.stringContaining("9px"),
					});
				const panel = page.locator(`#daily-menu-${subject}-block-${blockNumber}-panel`);
				await expect(panel).toBeVisible();
				const elevation = await panel.evaluate((element) => {
					const style = getComputedStyle(element);
					const selectedTab = element.parentElement.querySelector(
						'.daily-menu-subject-tab-list > button[aria-selected="true"]',
					);
					const inactiveTabs = element.parentElement.querySelectorAll(
						'.daily-menu-subject-tab-list > button[aria-selected="false"]',
					);
					if (!selectedTab || inactiveTabs.length !== 2) {
						throw new Error("Expected one selected Block tab and two inactive tabs");
					}
					const panelRect = element.getBoundingClientRect();
					const selectedRect = selectedTab.getBoundingClientRect();
					return {
						lift: new DOMMatrixReadOnly(style.transform).m42,
						boxShadow: style.boxShadow,
						connectionGap: panelRect.top - selectedRect.bottom,
						inactiveTabs: Array.from(inactiveTabs, (inactiveTab) => {
							const rect = inactiveTab.getBoundingClientRect();
							return {
								lift: new DOMMatrixReadOnly(getComputedStyle(inactiveTab).transform)
									.m42,
								topDifference: rect.top - selectedRect.top,
								panelCoversTabEdge:
									document.elementFromPoint(
										rect.x + rect.width / 2,
										rect.bottom - 1,
									) === element,
							};
						}),
					};
				});
				expect(elevation.lift).toBe(-6);
				expect(elevation.boxShadow).toContain("14px 18px");
				expect(elevation.connectionGap).toBeCloseTo(3, 1);
				for (const inactiveTab of elevation.inactiveTabs) {
					expect(inactiveTab.lift).toBe(0);
					expect(inactiveTab.topDifference).toBeCloseTo(6, 1);
					expect(inactiveTab.panelCoversTabEdge).toBe(true);
				}
			}
		}
	});
}

test("daily subject block tabs stay 16px below the Art button", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const day = page.locator("#calendar-day-cell-October-2026-18");
	await day.click();
	await day.click();

	const subjects = [
		{ id: "daily-menu-math-button", label: "Math" },
		{ id: "daily-menu-language-arts-button", label: "Language Arts" },
		{ id: "daily-menu-social-studies-button", label: "Social Studies" },
		{ id: "daily-menu-science-button", label: "Science" },
		{ id: "daily-menu-art-button", label: "Art" },
	];

	for (const { id, label } of subjects) {
		await page.locator(`#${id}`).click();
		const tablist = page.getByRole("tablist", {
			name: `${label} block navigation`,
		});
		await expect(tablist).toBeVisible();

		await expect
			.poll(() =>
				page.locator("#daily-menu-art-button").evaluate((artButton) => {
					const unselectedTab = document.querySelector(
						'.daily-menu-subject-tab-list > button[aria-selected="false"]',
					);
					if (!(unselectedTab instanceof HTMLElement)) {
						throw new Error("Daily menu unselected block tab is missing");
					}
					return (
						unselectedTab.getBoundingClientRect().top -
						artButton.getBoundingClientRect().bottom
					);
				}),
			)
			.toBeCloseTo(16, 1);
	}
});

test("daily subject block tabs use stepped pastel palettes and a continuous Art rainbow", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const day = page.locator("#calendar-day-cell-October-2026-18");
	await day.click();
	await day.click();

	const subjects = [
		{
			key: "math",
			colors: [
				["rgb(255, 253, 232)", "rgb(255, 246, 199)"],
				["rgb(255, 241, 173)", "rgb(255, 228, 126)"],
				["rgb(255, 224, 120)", "rgb(255, 208, 77)"],
			],
		},
		{
			key: "language-arts",
			colors: [
				["rgb(255, 240, 241)", "rgb(255, 224, 227)"],
				["rgb(255, 210, 214)", "rgb(255, 184, 192)"],
				["rgb(255, 176, 184)", "rgb(249, 149, 160)"],
			],
		},
		{
			key: "social-studies",
			colors: [
				["rgb(240, 248, 232)", "rgb(226, 240, 211)"],
				["rgb(216, 237, 199)", "rgb(197, 227, 174)"],
				["rgb(192, 221, 169)", "rgb(173, 208, 142)"],
			],
		},
		{
			key: "science",
			colors: [
				["rgb(237, 247, 255)", "rgb(220, 238, 255)"],
				["rgb(211, 235, 251)", "rgb(185, 220, 243)"],
				["rgb(181, 217, 242)", "rgb(153, 200, 233)"],
			],
		},
	];

	for (const { key, colors } of subjects) {
		await page.locator(`#daily-menu-${key}-button`).click();
		for (const [index, expectedColors] of colors.entries()) {
			const tab = page.locator(`#daily-menu-${key}-block-${index + 1}-button`);
			const backgroundImage = await tab.evaluate(
				(element) => getComputedStyle(element).backgroundImage,
			);
			for (const color of expectedColors) {
				expect(backgroundImage).toContain(color);
			}
		}
	}

	await page.locator("#daily-menu-art-button").click();
	const artTabs = page.locator(
		".daily-menu-art-block-1-button, .daily-menu-art-block-2-button, .daily-menu-art-block-3-button",
	);
	const artBackgrounds = await artTabs.evaluateAll((tabs) =>
		tabs.map((tab) => {
			const style = getComputedStyle(tab);
			return {
				backgroundImage: style.backgroundImage,
				backgroundPositionX: style.backgroundPositionX,
			};
		}),
	);
	const rainbowColors = [
		"rgb(255, 225, 230)",
		"rgb(255, 209, 216)",
		"rgb(255, 230, 211)",
		"rgb(255, 214, 184)",
		"rgb(255, 244, 194)",
		"rgb(255, 235, 163)",
		"rgb(228, 243, 202)",
		"rgb(209, 233, 173)",
		"rgb(216, 239, 255)",
		"rgb(191, 228, 255)",
		"rgb(223, 226, 255)",
		"rgb(201, 208, 255)",
		"rgb(240, 220, 255)",
		"rgb(226, 196, 255)",
	];

	expect(artBackgrounds.map(({ backgroundPositionX }) => backgroundPositionX)).toEqual([
		"0%",
		"50%",
		"100%",
	]);
	for (const { backgroundImage } of artBackgrounds) {
		for (const color of rainbowColors) {
			expect(backgroundImage).toContain(color);
		}
	}
});
