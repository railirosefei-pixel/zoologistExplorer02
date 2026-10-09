import { expect, test } from "@playwright/test";

test("Student Games subjects show inert, color-cycled month placeholders", async ({ page }) => {
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
	await expect(topNavigation).toHaveCSS(
		"background-color",
		"rgb(191, 218, 252)",
	);
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
	await expect(page.locator("#math-games-view")).toBeVisible();
	const gallery = await page.locator("#math-games-view").boundingBox();
	expect(gallery.y - (navigation.y + navigation.height)).toBe(16);
	const sidebarButton = await page.locator("#games-tab").boundingBox();

	for (const subject of ["Math", "Language Arts", "Social Studies", "Science", "Art"]) {
		await page.getByRole("button", { name: subject, exact: true }).click();
		const monthButtons = page.locator("#student-games-month-panel button");
		await expect(page.locator("#student-menu-navigation #student-games-month-panel")).toHaveCount(
			1,
		);
		await expect(page.locator("#games-tab")).toHaveCount(0);
		await expect(page.locator("#calendar-tab")).toHaveCount(0);
		const monthPanel = await page.locator("#student-games-month-panel").boundingBox();
		await expect(monthButtons).toHaveCount(15);
		await expect(page.locator("#student-games-month-panel")).toHaveCSS("gap", "16px");
		expect(monthPanel.x).toBe(sidebarButton.x);
		const firstMonthButton = await monthButtons.first().boundingBox();
		expect(firstMonthButton.width).toBe(sidebarButton.width);
		expect(firstMonthButton.height).toBe(sidebarButton.height);
		await expect(monthButtons.first()).toHaveText("October 26");
		await expect(monthButtons.last()).toHaveText("December 27");
		await expect(monthButtons.first()).toHaveClass(/student-games-month-button--red/);
		await expect(monthButtons.nth(1)).toHaveClass(/student-games-month-button--orange/);
		await expect(monthButtons.nth(6)).toHaveClass(/student-games-month-button--violet/);
		await expect(monthButtons.nth(7)).toHaveClass(/student-games-month-button--red/);
		await expect(page.locator("#math-games-view")).toBeHidden();

		await monthButtons.first().click();
		await expect(monthButtons).toHaveCount(15);
	}

	await page.getByRole("button", { name: "Art", exact: true }).click();
	await expect(page.locator("#student-games-month-panel")).toHaveCount(0);
	await expect(page.locator("#calendar-tab")).toBeVisible();
	await expect(page.locator("#math-games-view")).toBeVisible();
});
