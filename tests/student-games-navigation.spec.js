import { expect, test } from "@playwright/test";

test("Student Games shows its math thumbnails and subject month placeholders", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Games tab", exact: true }).click();

	await expect(page.locator("#games-menu")).toHaveCount(0);
	const subjectButtons = page.locator("#student-games-top-navigation button");
	await expect(subjectButtons).toHaveText(["", "", "", "", ""]);
	const subjectLabels = await subjectButtons.evaluateAll((buttons) =>
		buttons.map((button) => button.getAttribute("aria-label")),
	);
	expect(subjectLabels).toEqual(["Math", "Language Arts", "Social Studies", "Science", "Art"]);
	const navigation = await page.locator("#student-games-top-navigation").boundingBox();
	expect(navigation.height).toBe(96);
	const subjectButtonSizes = await subjectButtons.evaluateAll((buttons) =>
		buttons.map((button) => {
			const { width, height } = button.getBoundingClientRect();
			return { width, height };
		}),
	);
	expect(subjectButtonSizes).toEqual(
		Array.from({ length: 5 }, () => ({ width: 136, height: 64 })),
	);
	const topNavigation = page.locator("#student-games-top-navigation");
	await expect(topNavigation).toHaveCSS("background-color", "rgb(191, 218, 252)");
	const topNavigationShadow = await topNavigation.evaluate(
		(element) => getComputedStyle(element).boxShadow,
	);
	expect(topNavigationShadow).toContain("inset");
	expect(topNavigationShadow).toContain("0px 6px 0px");
	const subjectStyles = await subjectButtons.evaluateAll((buttons) =>
		buttons.map((button) => ({
			backgroundImage: getComputedStyle(button).backgroundImage,
			borderRadius: getComputedStyle(button).borderRadius,
			boxShadow: getComputedStyle(button).boxShadow,
			className: button.className,
			id: button.id,
		})),
	);
	expect(subjectStyles.map(({ id }) => id)).toEqual([
		"student-games-subject-math-button",
		"student-games-subject-language-arts-button",
		"student-games-subject-social-studies-button",
		"student-games-subject-science-button",
		"student-games-subject-art-button",
	]);
	expect(subjectStyles.every(({ className }) => !className.includes("games-sidebar"))).toBe(true);
	expect(subjectStyles.every(({ borderRadius }) => borderRadius === "999px")).toBe(true);
	expect(subjectStyles.every(({ boxShadow }) => boxShadow.includes("6px"))).toBe(true);
	expect(subjectStyles.map(({ backgroundImage }) => backgroundImage)).toEqual(
		expect.arrayContaining([
			expect.stringContaining("math"),
			expect.stringContaining("languageArts"),
			expect.stringContaining("socialStudies"),
			expect.stringContaining("science"),
			expect.stringContaining("art"),
		]),
	);
	await expect(page.locator("#student-safari-place-value-thumbnail")).toBeVisible();
	await expect(page.locator("#student-safari-multiplication-thumbnail")).toBeVisible();
	const placeValueThumbnail = await page
		.locator("#student-safari-place-value-thumbnail")
		.boundingBox();
	const multiplicationThumbnail = await page
		.locator("#student-safari-multiplication-thumbnail")
		.boundingBox();
	expect(placeValueThumbnail.width).toBe(218);
	expect(placeValueThumbnail.height).toBe(218);
	expect(multiplicationThumbnail.width).toBe(218);
	expect(multiplicationThumbnail.height).toBe(218);
	expect(multiplicationThumbnail.x - placeValueThumbnail.x - placeValueThumbnail.width).toBe(
		16,
	);
	await expect(page.locator("#math-games-view")).toHaveCount(0);
	const sidebarButton = await page.locator("#games-tab").boundingBox();

	for (const subject of ["Math", "Language Arts", "Social Studies", "Science", "Art"]) {
		await page.getByRole("button", { name: subject, exact: true }).click();
		if (subject === "Math") {
			await expect(page.locator("#student-safari-place-value-thumbnail")).toBeVisible();
			await expect(page.locator("#student-safari-multiplication-thumbnail")).toBeVisible();
		} else {
			await expect(page.locator("#student-safari-place-value-thumbnail")).toHaveCount(0);
			await expect(page.locator("#student-safari-multiplication-thumbnail")).toHaveCount(0);
		}
		const monthButtons = page.locator("#student-games-month-panel button");
		await expect(
			page.locator("#student-menu-navigation #student-games-month-panel"),
		).toHaveCount(1);
		await expect(page.locator("#games-tab")).toHaveCount(0);
		await expect(page.locator("#calendar-tab")).toHaveCount(0);
		const monthPanel = await page.locator("#student-games-month-panel").boundingBox();
		await expect(monthButtons).toHaveCount(15);
		await expect(page.locator("#student-games-month-panel")).toHaveCSS("gap", "16px");
		expect(monthPanel.x).toBe(sidebarButton.x);
		const firstMonthButton = await monthButtons.first().boundingBox();
		expect(firstMonthButton.width).toBe(sidebarButton.width);
		expect(firstMonthButton.height).toBeCloseTo(sidebarButton.height, 3);
		await expect(monthButtons.first()).toHaveText("October 26");
		await expect(monthButtons.last()).toHaveText("December 27");
		await expect(monthButtons.first()).toHaveClass(/student-games-month-button--red/);
		await expect(monthButtons.nth(1)).toHaveClass(/student-games-month-button--orange/);
		await expect(monthButtons.nth(6)).toHaveClass(/student-games-month-button--violet/);
		await expect(monthButtons.nth(7)).toHaveClass(/student-games-month-button--red/);
		await monthButtons.first().click();
		await expect(monthButtons).toHaveCount(15);
	}

	await page.getByRole("button", { name: "Art", exact: true }).click();
	await expect(page.locator("#student-games-month-panel")).toHaveCount(0);
	await expect(page.locator("#calendar-tab")).toBeVisible();
	await expect(page.locator("#student-safari-place-value-thumbnail")).toBeVisible();
	await expect(page.locator("#student-safari-multiplication-thumbnail")).toBeVisible();
});

test("Safari Place Value Adventure can be played and returned to the Games menu", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Games tab", exact: true }).click();

	await page.locator("#student-safari-place-value-thumbnail").click();
	await expect(page.locator("#safari-place-value-game")).toBeVisible();
	const targetText = await page.locator("#safari-place-value-target").innerText();
	let target = Number(targetText.replaceAll(",", ""));
	expect(target).toBeGreaterThanOrEqual(10);
	expect(target).toBeLessThanOrEqual(99);

	await page.locator("#safari-place-value-add-10").click();
	await expect(page.locator("#safari-place-value-current")).toHaveText("10");
	const firstTarget = Number(
		(await page.locator("#safari-place-value-target").innerText()).replaceAll(",", ""),
	);
	await page.locator("#safari-place-value-reset-button").click();
	await expect(page.locator("#safari-place-value-current")).toHaveText("0");
	const resetTarget = Number(
		(await page.locator("#safari-place-value-target").innerText()).replaceAll(",", ""),
	);
	expect(resetTarget).not.toBe(firstTarget);
	expect(resetTarget).toBeGreaterThanOrEqual(10);
	expect(resetTarget).toBeLessThanOrEqual(99);
	target = resetTarget;

	for (let tens = 0; tens < Math.floor(target / 10); tens += 1) {
		await page.locator("#safari-place-value-add-10").click();
	}
	for (let ones = 0; ones < target % 10; ones += 1) {
		await page.locator("#safari-place-value-add-1").click();
	}

	await expect(page.locator("#safari-place-value-win-dialog")).toBeVisible();
	await expect(page.locator("#safari-place-value-xp")).toHaveText("10 / 100");
	await page.locator("#safari-place-value-next-button").click();
	await expect(page.locator("#safari-place-value-win-dialog")).toHaveCount(0);
	await expect(page.locator("#safari-place-value-current")).toHaveText("0");

	await page.locator("#safari-place-value-back-button").click();
	await expect(page.locator("#student-safari-place-value-thumbnail")).toBeVisible();
	await expect(page.locator("#safari-place-value-game")).toHaveCount(0);
});

test("Safari Multiplication Adventure can be solved, reset, and returned to the Games menu", async ({
	page,
}) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();
	await page.getByRole("button", { name: "Open Games tab", exact: true }).click();

	await page.locator("#student-safari-multiplication-thumbnail").click();
	await expect(page.locator("#safari-multiplication-game")).toBeVisible();
	const factorA = Number(await page.locator("#safari-multiplication-factor-a").innerText());
	const factorB = Number(await page.locator("#safari-multiplication-factor-b").innerText());
	const target = factorA * factorB;
	expect(target).toBeGreaterThanOrEqual(1);
	expect(target).toBeLessThanOrEqual(81);

	await page.locator("#safari-multiplication-add-100").click();
	await expect(page.locator("#safari-multiplication-current")).toHaveText("100");
	await page.locator("#safari-multiplication-reset-button").click();
	await expect(page.locator("#safari-multiplication-current")).toHaveText("0");

	for (let tens = 0; tens < Math.floor(target / 10); tens += 1) {
		await page.locator("#safari-multiplication-add-10").click();
	}
	for (let ones = 0; ones < target % 10; ones += 1) {
		await page.locator("#safari-multiplication-add-1").click();
	}

	await expect(page.locator("#safari-multiplication-win-dialog")).toBeVisible();
	await expect(page.locator("#safari-multiplication-xp")).toHaveText("10 / 100");
	await page.locator("#safari-multiplication-next-button").click();
	await expect(page.locator("#safari-multiplication-win-dialog")).toHaveCount(0);
	await expect(page.locator("#safari-multiplication-current")).toHaveText("0");

	await page.locator("#safari-multiplication-back-button").click();
	await expect(page.locator("#student-safari-multiplication-thumbnail")).toBeVisible();
	await expect(page.locator("#safari-multiplication-game")).toHaveCount(0);
});
