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
	const activeShadow = await blockEditsButton.evaluate((button) => getComputedStyle(button).boxShadow);
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
	const measureVerticalCenterDifference = (selector) =>
		printButton.evaluate((button, targetSelector) => {
			const printBounds = button.getBoundingClientRect();
			const targetBounds = document.querySelector(targetSelector).getBoundingClientRect();
			return Math.abs(
				printBounds.top + printBounds.height / 2 - (targetBounds.top + targetBounds.height / 2),
			);
		}, selector);
	expect(await measureVerticalCenterDifference("#text-editor-home-button")).toBeLessThan(0.1);
	expect(await measureVerticalCenterDifference("#parent-screen-back-button")).toBeLessThan(0.1);

	await page.getByRole("button", { name: "New +" }).click();
	await page.getByRole("button", { name: "Create A Shell", exact: true }).click();

	expect(await measureHomeGap("#text-editor-workflow-home-button")).toBe(16);

	await printButton.click();
	expect(await page.evaluate(() => window.__printCallCount)).toBe(1);

	await page.getByRole("button", { name: "Grid", exact: true }).click();
	await page.locator("#grid-applied-button").click();
	const grid = page.locator("#print-preview-grid");
	await expect(grid).toBeVisible();
	await page.locator("#grid-shape-width-input").fill("2.35");
	await page.locator("#grid-shape-height-input").fill("3.35");
	await page.locator("#grid-shape-size-commit-button").evaluate((button) => button.click());
	const bottomAlignmentButton = page.locator("#grid-alignment-bottom-button");
	const topAlignmentButton = page.locator("#grid-alignment-top-button");
	const gridAreaHeight = await grid.evaluate((element) =>
		Number(element.getAttribute("viewBox").split(" ")[3]),
	);
	const renderedGridHeight = await grid
		.locator("[data-grid-shape-area]")
		.evaluate((area) => Number(area.getAttribute("height")));
	const expectedBottomOffset = Math.max(0, gridAreaHeight - renderedGridHeight);
	expect(expectedBottomOffset).toBeGreaterThan(0);
	const getGridVerticalOffset = () =>
		grid.locator("g").evaluate((group) =>
			Number(group.getAttribute("transform").match(/translate\([^ ]+ ([^)]+)\)/)[1]),
		);
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
	const printedGridSizeInches = await grid.evaluate((element) => {
		const pattern = element.querySelector("pattern");
		const [, , viewBoxWidth, viewBoxHeight] = element
			.getAttribute("viewBox")
			.split(" ")
			.map(Number);
		const bounds = element.getBoundingClientRect();
		return {
			width: Number(pattern.getAttribute("width")) * bounds.width / viewBoxWidth / 96,
			height: Number(pattern.getAttribute("height")) * bounds.height / viewBoxHeight / 96,
		};
	});
	expect(printedGridSizeInches.width).toBeCloseTo(2.35, 2);
	expect(printedGridSizeInches.height).toBeCloseTo(3.35, 2);

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

test("Math place-value game has ten self-paced levels and supports retry and replay", async ({ page }) => {
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
	const answers = ["Ones", "Tens", "Ones", "Hundreds", "Tens", "Thousands", "Hundreds", "Ten Thousands", "Hundred Thousands", "Millions"];
	for (const [levelIndex, answer] of answers.entries()) {
		await expect(page.getByText(`Level ${levelIndex + 1} of 10`, { exact: true })).toBeVisible();
		await page.getByRole("button", { name: answer, exact: true }).click();
		await expect(page.getByRole("status")).toHaveText("Correct!");
		await page.getByRole("button", { name: levelIndex === 9 ? "Finish" : "Next level", exact: true }).click();
	}
	await expect(page.getByRole("heading", { name: "All 10 levels complete!" })).toBeVisible();
	await page.getByRole("button", { name: "Play again", exact: true }).click();
	await expect(page.getByText("Level 1 of 10", { exact: true })).toBeVisible();
});

const mathPlaceNumbers = [23, 47, 315, 682, 2437, 8169, 35428, 760915, 934862, 1000000];
const mathFirstNumbers = [24, 57, 126, 428, 1234, 5729, 12345, 42876, 135792, 246810];
const mathSecondNumbers = [12, 24, 27, 156, 623, 1347, 6342, 17893, 62748, 135729];
const mathTargetPlaces = [0, 1, 0, 2, 1, 3, 2, 4, 5, 6];
const mathPlaceNames = ["Ones", "Tens", "Hundreds", "Thousands", "Ten Thousands", "Hundred Thousands", "Millions"];
const mathWordAnswers = ["", "forty-seven", "", "six hundred eighty-two", "", "eight thousand one hundred sixty-nine", "", "seven hundred sixty thousand nine hundred fifteen", "", "one million"];
const mathGameIds = ["place-names", "digit-values", "place-relations", "place-conversion", "expanded-form", "number-words", "compare-numbers", "compare-tables", "order-numbers", "round-place", "round-any", "round-puzzles", "add-numbers", "add-word", "subtract-numbers", "subtract-word", "compare-word", "sum-difference", "estimate-sums", "estimate-sums-word", "estimate-differences", "estimate-differences-word", "multi-step-word", "equation-word"];

for (const gameId of mathGameIds) {
	test(`Math minigame: ${gameId} teaches its topic through all ten levels`, async ({ page }) => {
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Games", exact: true }).click();
		await page.getByRole("button", { name: "Math", exact: true }).click();
		await expect(page.locator("[data-game-id]")).toHaveCount(24);
		const thumbnail = page.locator(`[data-game-id="${gameId}"]`);
		const thumbnailArtwork = await thumbnail.locator("svg").first().evaluate((element) => ({
			path: element.querySelector("path").getAttribute("d"),
			symbol: element.querySelector("text").textContent,
			background: element.querySelector("rect").getAttribute("fill"),
		}));
		const gameTitle = await thumbnail.getAttribute("aria-label");
		await thumbnail.click();
		const firstLevelArtwork = page.getByRole("img", { name: `First-level image for ${gameTitle}`, exact: true });
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
				case "place-names": choices = [mathPlaceNames[mathTargetPlaces[stage]]]; break;
				case "digit-values": {
					const digit = String(number).at(-1 - mathTargetPlaces[stage]);
					choices = [`Digit ${digit} in the ${mathPlaceNames[mathTargetPlaces[stage]]} place`];
					break;
				}
				case "place-relations": choices = [stage % 2 === 0 ? "10 times as much" : "One tenth as much"]; break;
				case "place-conversion": answers = [[20, 30, 400, 500, 600, 700, 8000, 9000, 10000, 11000][stage]]; break;
				case "expanded-form":
					if (stage % 2) answers = [number];
					else {
						choices = [...String(number)].map((digit, digitIndex, digits) => Number(digit) * 10 ** (digits.length - 1 - digitIndex)).filter(Boolean).map((term) => term.toLocaleString("en-US"));
						needsCheck = true;
					}
					break;
				case "number-words":
					if (stage % 2 === 0) answers = [number];
					else choices = [mathWordAnswers[stage]];
					break;
				case "compare-numbers": {
					const displayed = await page.getByLabel("Numbers to compare", { exact: true }).locator("span").allTextContents();
					for (const value of displayed.filter((text) => text !== "?")) {
						expect(Number(value.replaceAll(",", ""))).toBeLessThanOrEqual(1000000);
					}
					choices = [stage % 3 === 0 ? "Less than" : stage % 3 === 1 ? "Equal to" : "Greater than"];
					break;
				}
				case "compare-tables": choices = [stage % 2 === 0 ? "Forest" : "Wetland"]; break;
				case "order-numbers":
					choices = [number - 3, number - 12, number - 1, number - 7].sort((left, right) => stage % 2 ? right - left : left - right).map((value) => value.toLocaleString("en-US"));
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
				case "round-puzzles": choices = [first.toLocaleString("en-US")]; break;
				case "add-numbers": case "add-word": answers = [first + second]; break;
				case "subtract-numbers": case "subtract-word": answers = [first - second]; break;
				case "compare-word": answers = [stage % 2 ? first - second : first + second]; break;
				case "sum-difference": answers = [second, first]; break;
				case "estimate-sums": case "estimate-sums-word": case "estimate-differences": case "estimate-differences-word": {
					const unit = 10 ** (1 + Math.floor(stage / 3));
					const roundedFirst = Math.round(first / unit) * unit;
					const roundedSecond = Math.round(second / unit) * unit;
					answers = [roundedFirst, roundedSecond, gameId.includes("sums") ? roundedFirst + roundedSecond : roundedFirst - roundedSecond];
					break;
				}
				case "multi-step-word": answers = [first + second, first + second - Math.floor(second / 2) - 1]; break;
				case "equation-word":
					choices = [`x = (${first} + ${second}) - ${Math.floor(second / 2) + 1}`];
					answers = [first + second - Math.floor(second / 2) - 1];
					break;
			}
			for (const choice of choices) await page.getByRole("button", { name: choice, exact: true }).click();
			for (const [answerIndex, answer] of answers.entries()) await page.locator(`#math-game-answer-${answerIndex}`).fill(String(answer));
			if (["add-numbers", "sum-difference"].includes(gameId)) {
				await page.locator("#math-game-answer-0").press("Enter");
			} else if (answers.length || needsCheck) {
				await page.getByRole("button", { name: "Check answer", exact: true }).click();
			}
			await expect(page.getByRole("status")).toHaveText("Correct!");
			await page.getByRole("button", { name: stage === 9 ? "Finish" : "Next level", exact: true }).click();
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

async function revealGoldCoinTotal(page, expectedTotal) {
	await page.getByRole("button", { name: "Open Rewards tab", exact: true }).click();
	await page.getByRole("button", { name: "Open reward chest", exact: true }).click();
	await page.locator(".rewards-page-journal").dispatchEvent("animationend");
	await page.locator(".rewards-page-book-animation").dispatchEvent("ended");
	const pouch = page.getByRole("button", { name: "Gold cinch bag", exact: true });
	await pouch.evaluate((element) => element.getAnimations().forEach((animation) => animation.finish()));
	await pouch.click();
	await page.locator(".rewards-page-gold-coin").evaluateAll((elements) => elements.forEach((element) => element.getAnimations().forEach((animation) => animation.finish())));
	await expect(page.locator(".rewards-page-gold-total")).toHaveText(`${expectedTotal} gold coins`);
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
		await page.setViewportSize(run ? { width: 375, height: 812 } : { width: 1280, height: 720 });
		for (let stage = 0; stage < 10; stage += 1) {
			if (run === 0 || stage === 0) await thumbnail.click();
			await expect(page.getByText(`Level ${stage + 1} of 10`, { exact: true })).toBeVisible();
			await page.getByRole("button", { name: mathPlaceNames[mathTargetPlaces[stage]], exact: true }).click();
			if (stage === 9) {
				await page.getByRole("button", { name: "Finish", exact: true }).click();
				const coin = page.getByRole("img", { name: "Winning gold coin", exact: true });
				if (run === 0) {
					await expect(coin).toBeVisible();
					await expect(coin).toHaveCSS("animation-duration", "3s");
					const keyframes = await coin.evaluate((element) => element.getAnimations()[0].effect.getKeyframes());
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
					await page.screenshot({ path: testInfo.outputPath(`winning-coin-run-${run}.png`) });
					if (page.viewportSize().width === 375) await coin.evaluate((element) => element.getAnimations()[0].play());
					await expect(coin).toHaveCount(0, { timeout: 5000 });
					await expect(page.locator("#math-games-view")).toHaveAttribute("data-winning-sound", "played");
				} else {
					await expect(coin).toHaveCount(0);
				}
				const notes = await page.evaluate(() => window.mathWinningNotesPlayed);
				expect(notes).toBe(navigationNoteCount + 4);
			}
			if (run === 0 || stage === 9) {
				await page.getByRole("button", { name: "Back to games", exact: true }).click();
				await expect(thumbnail.locator("[data-game-shadow]")).toHaveAttribute("fill-opacity", String(run ? 0 : 0.72 * (9 - stage) / 10));
			} else {
				await page.getByRole("button", { name: "Next level", exact: true }).click();
			}
		}
		await expect(thumbnail.locator(".math-games-thumbnail-coin")).toHaveCSS("filter", /drop-shadow/);
		await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
		await revealGoldCoinTotal(page, 1);
		await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
		await page.getByRole("button", { name: "Open Games tab", exact: true }).click();
	}
	await page.evaluate(() => {
		const savedProgress = JSON.parse(localStorage.getItem("zoologist-math-games-progress"));
		localStorage.setItem("zoologist-math-games-progress", JSON.stringify({ ...savedProgress, "digit-values": 9 }));
	});
	await page.reload();
	await openStudentMathGames(page);
	await page.locator('[data-game-id="digit-values"]').click();
	await expect(page.getByText("Level 10 of 10", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Digit 1 in the Millions place", exact: true }).click();
	await page.getByRole("button", { name: "Finish", exact: true }).click();
	await expect(page.getByRole("img", { name: "Winning gold coin", exact: true })).toHaveCount(0, { timeout: 5000 });
	await page.getByRole("button", { name: "Back to games", exact: true }).click();
	await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
	await revealGoldCoinTotal(page, 2);
	await page.reload();
	await page.getByRole("button", { name: "Open student section", exact: true }).click();
	await revealGoldCoinTotal(page, 2);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
	test(`Parent math thumbnails have exact dimensions and gaps at ${viewport.width}px`, async ({ page }, testInfo) => {
		await page.setViewportSize(viewport);
		await page.goto("./");
		await page.getByRole("button", { name: "Open parent section" }).click();
		await page.getByRole("button", { name: "Games", exact: true }).click();
		await page.getByRole("button", { name: "Math", exact: true }).click();
		const thumbnails = page.locator(".parent-math-game-thumbnail");
		await expect(thumbnails).toHaveCount(24);
		await expect(page.locator("#math-games-view")).toHaveClass(/bg-purple-950/);
		await expect(page.locator("#math-games-view")).toHaveCSS("background-color", "oklch(0.291 0.149 302.717)");
		const boxes = await thumbnails.evaluateAll((elements) => elements.map((element) => {
			const { x, y, width, height } = element.getBoundingClientRect();
			return { x, y, width, height };
		}));
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
			const positions = [...new Set(boxes.map((box) => box[axis]))].sort((left, right) => left - right);
			for (let position = 1; position < positions.length; position += 1) expect(positions[position] - positions[position - 1] - 218).toBe(16);
		}
		if (viewport.width <= 768) {
			expect(sidebar.width).toBe(125);
			for (const box of boxes) {
				expect(box.x).toBeGreaterThanOrEqual(sidebar.x + sidebar.width + 16);
				expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 16);
			}
		}
		const captionsFit = await thumbnails.locator("[data-game-caption]").evaluateAll((elements) => elements.every((element) => element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth));
		expect(captionsFit).toBe(true);
		const backButton = page.getByRole("button", { name: "Back to home", exact: true });
		const backBox = await backButton.boundingBox();
		expect(viewport.width - backBox.x - backBox.width).toBe(16);
		expect(backBox.y).toBe(16);
		await page.screenshot({ path: testInfo.outputPath(`parent-math-${viewport.width}.png`) });
		await backButton.click();
		await expect(page.locator("#home-page-shell")).toBeVisible();
	});
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
	test(`Student math thumbnails have exact dimensions and gaps at ${viewport.width}px`, async ({ page }, testInfo) => {
		await page.setViewportSize(viewport);
		await page.goto("./");
		await page.getByRole("button", { name: "Open student section" }).click();
		await page.getByRole("button", { name: "Open Games tab", exact: true }).click();
		const thumbnails = page.locator(".student-math-game-thumbnail");
		await expect(thumbnails).toHaveCount(24);
		const boxes = await thumbnails.evaluateAll((elements) => elements.map((element) => {
			const { x, y, width, height } = element.getBoundingClientRect();
			return { x, y, width, height };
		}));
		for (const box of boxes) expect(box).toMatchObject({ width: 218, height: 218 });
		expect(boxes[0]).toMatchObject({ x: 16, y: 16 });
		const gallery = await page.locator("#math-games-view").boundingBox();
		expect(gallery.x).toBe(16);
		expect(gallery.y).toBe(16);
		expect(viewport.width - gallery.x - gallery.width).toBe(16);
		for (const axis of ["x", "y"]) {
			const positions = [...new Set(boxes.map((box) => box[axis]))].sort((left, right) => left - right);
			for (let position = 1; position < positions.length; position += 1) expect(positions[position] - positions[position - 1] - 218).toBe(16);
		}
		const captionsFit = await thumbnails.locator("[data-game-caption]").evaluateAll((elements) => elements.every((element) => element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth));
		expect(captionsFit).toBe(true);
		await page.screenshot({ path: testInfo.outputPath(`student-math-${viewport.width}.png`) });
		await thumbnails.first().click();
		await page.getByRole("button", { name: "Ones", exact: true }).click();
		await expect(page.getByRole("status")).toHaveText("Correct!");
		await page.getByRole("button", { name: "Back to games", exact: true }).click();
		await expect(thumbnails.first()).toContainText("1 / 10");
		await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
		await expect(page.locator("#student-submenu-panel")).toHaveCount(0);
		await expect(page.getByRole("button", { name: "Back to home page", exact: true })).toBeVisible();
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
	const expectAlignmentBelow = async (panelSelector) => {
		const panelBounds = await page.locator(panelSelector).boundingBox();
		const alignmentBounds = await alignmentButton.boundingBox();
		expect(alignmentBounds.y - panelBounds.y - panelBounds.height).toBe(16);
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
	await expectAlignmentBelow("#text-editor-size-panel");
	await marginsButton.click();
	await expectAlignmentBelow("#text-editor-margins-panel");
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
	await expectAlignmentBelow("#text-editor-size-panel");
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
	await expectAlignmentBelow("#text-editor-fonts-panel");
	await fontsButton.click();

	await expect(fontsPanel).toHaveCount(0);
	await marginsButton.click();
	await expect(marginsButton).toHaveAttribute("aria-pressed", "true");
	await expectAlignmentBelow("#text-editor-margins-panel");
	await expect(marginsButton).toHaveCSS("background-color", "rgb(88, 191, 255)");
	await fontsButton.click();
	await expect(fontsButton).toHaveAttribute("aria-pressed", "true");
	await expectAlignmentBelow("#text-editor-margins-panel");
	await fontStylesButton.click();
	const marginFontStylesPressed = await getPressedStyles(fontStylesButton);
	expect(await getPressedStyles(marginsButton)).toEqual(marginFontStylesPressed);
	expect(await getPressedStyles(fontsButton)).toEqual(marginFontStylesPressed);
	await fontStylesButton.click();
	const fontsToMarginsGap = await page.evaluate(() => {
		const margins = document.querySelector("#text-editor-margins-panel").getBoundingClientRect();
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
	await expectAlignmentBelow("#text-editor-margins-panel");
	const stackedFontsToSizeAndMarginsGaps = await page.evaluate(() => {
		const margins = document.querySelector("#text-editor-margins-panel").getBoundingClientRect();
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
		const toolsPanel = document.querySelector("#text-editor-tools-panel").getBoundingClientRect();
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
	expect(buttonMetrics.buttons.map(({ leftGap, width, height, borderRadius }) => ({
		leftGap,
		width,
		height,
		borderRadius,
	}))).toEqual(Array(3).fill({ leftGap: 16, width: 256, height: 64, borderRadius: "999px" }));
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
	const shellButtonMetrics = await page.locator("#text-editor-new-create-shell-button").evaluate((button) => {
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
	const fontButtonMetrics = await fontsPanel.locator("[data-font-option]").evaluateAll((buttons) =>
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
	const normalizeShadow = (shadow) =>
		shadow.replace(/rgba?\([^)]*\)|#[\da-f]{3,8}/gi, "<color>");
	for (const button of fontButtonMetrics) {
		expect(button.width).toBe(shellButtonMetrics.width);
		expect(button.height).toBe(shellButtonMetrics.height);
		expect(button.borderRadius).toBe(shellButtonMetrics.borderRadius);
		expect(button.fontFamily).toBe(shellButtonMetrics.fontFamily);
		expect(button.fontSize).toBe(shellButtonMetrics.fontSize);
		expect(button.fontWeight).toBe(shellButtonMetrics.fontWeight);
		expect(normalizeShadow(button.boxShadow)).toBe(normalizeShadow(shellButtonMetrics.boxShadow));
	}
	await page.getByRole("button", { name: "New +", exact: true }).click();

	const geometry = await fontsPanel.evaluate((element) => {
		const panel = element.getBoundingClientRect();
		const toolsPanel = document.querySelector("#text-editor-tools-panel").getBoundingClientRect();
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

test("Margins create numeric paper insets, toggle guides, and restore with saved shells", async ({ page }) => {
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
				offsets.push(range.getBoundingClientRect().left - element.getBoundingClientRect().left);
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
	await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();

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

test("October 2026 is first and hides Back without moving Calendar or Forward", async ({ page }) => {
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

	const rewardJournal = rewardsPage.locator(".rewards-page-journal");
	await expect(rewardJournal).toBeVisible();
	expect(
		await rewardJournal.evaluate((element) => getComputedStyle(element).animationName),
	).toMatch(/^rewards-journal-emerge(?:-[\w-]+)?$/);

	await rewardJournal.dispatchEvent("animationend");
	const rewardBookAnimation = rewardsPage.locator(".rewards-page-book-animation");
	await expect(rewardBookAnimation).toBeVisible();
	await expect(rewardBookAnimation).toHaveAttribute("src", /Sequence02[^/]*\.webm/);
	await expect(rewardBookAnimation).toHaveJSProperty("muted", true);
	await expect
		.poll(() => rewardBookAnimation.evaluate((element) => element.readyState))
		.toBeGreaterThanOrEqual(1);

	await rewardBookAnimation.evaluate((element) => {
		element.currentTime = element.duration;
		element.dispatchEvent(new Event("ended"));
	});

	const rewardBookStage = rewardsPage.locator(".rewards-page-book-stage");
	await expect(rewardBookStage).toHaveClass(/rewards-page-book-stage--settled/);
	await rewardBookStage.evaluate((element) => {
		for (const animation of element.getAnimations()) {
			animation.finish();
		}
	});
	await expect(rewardBookAnimation).toBeVisible();
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
	await expect
		.poll(async () => {
			const bookBounds = await rewardBookAnimation.boundingBox();
			const chestBounds = await rewardChestButton.boundingBox();
			return bookBounds.x + bookBounds.width / 2 - (chestBounds.x + chestBounds.width / 2);
		})
		.toBeLessThan(0);
	const [bookBounds, chestBounds, bagBounds] = await Promise.all([
		rewardBookAnimation.boundingBox(),
		rewardChestButton.boundingBox(),
		goldBag.boundingBox(),
	]);
	const bookOffsetX = bookBounds.x + bookBounds.width / 2 - (chestBounds.x + chestBounds.width / 2);
	const bagOffsetX = bagBounds.x + bagBounds.width / 2 - (chestBounds.x + chestBounds.width / 2);
	const bookOffsetY = bookBounds.y + bookBounds.height / 2 - (chestBounds.y + chestBounds.height / 2);
	const bagOffsetY = bagBounds.y + bagBounds.height / 2 - (chestBounds.y + chestBounds.height / 2);
	expect(Math.abs(Math.hypot(bookOffsetX, bookOffsetY) - Math.hypot(bagOffsetX, bagOffsetY))).toBeLessThan(2);
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

test("Student sidebar navigation selects its destination and returns from Games", async ({ page }) => {
	await page.goto("./");
	await page.getByRole("button", { name: "Open student section" }).click();

	const destinations = [
		{ button: "Games", panel: "#games-menu" },
		{ button: "Extra Credit", panel: "#extra-credit-menu" },
		{ button: "Progress", panel: "#student-submenu-panel" },
	];

	for (const destination of destinations) {
		const button = page.getByRole("button", { name: destination.button });
		await button.click();
		await expect(page.locator(destination.panel)).toBeVisible();
		if (destination.button === "Games") {
			await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
			await expect(page.locator("#games-menu")).toHaveCount(0);
		}
		await button.click();
		await expect(page.locator(destination.panel)).toBeVisible();
		if (destination.button === "Games") {
			await page.getByRole("button", { name: "Back to student menu", exact: true }).click();
			await expect(page.locator("#games-menu")).toHaveCount(0);
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
			buttonBottomGap: rect.bottom - element.querySelector("button").getBoundingClientRect().bottom,
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

test("Text Editor Home and Back buttons sit inside the navigation bar", async ({ page }) => {
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
			homeCenterOffset: (homeRect.top + homeRect.bottom) / 2 -
				(navigationRect.top + navigationRect.bottom) / 2,
			backCenterOffset: (backRect.top + backRect.bottom) / 2 -
				(navigationRect.top + navigationRect.bottom) / 2,
		};
	});
	expect(metrics).toEqual({
		hasHome: true,
		hasBack: true,
		backRightGap: 16,
		homeBackGap: 16,
		homeCenterOffset: 0,
		backCenterOffset: 0,
	});
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
	await expect(gridAlignmentDropdown).toHaveAttribute("open", "");
	await expect(gridAlignmentDropdown.locator("summary")).toHaveText("Grid Alignment");
	const gridAlignmentButtons = page.locator("#grid-menu-alignment-buttons button");
	await expect(gridAlignmentButtons).toHaveCount(9);
	expect((await gridAlignmentButtons.allTextContents()).map((label) => label.trim())).toEqual([
		"Left",
		"Center",
		"Right",
		"Bottom",
		"Top",
		"Bottom Left",
		"Bottom Right",
		"Top Left",
		"Top Right",
	]);
	const gridAlignmentLayout = await page.evaluate(() => {
		const menu = document.querySelector("#text-editor-grid-menu").getBoundingClientRect();
		const reference = document.querySelector("#grid-applied-button");
		const referenceStyles = getComputedStyle(reference);
		const buttons = [...document.querySelectorAll("#grid-menu-alignment-buttons button")];
		const buttonBounds = buttons.map((button) => button.getBoundingClientRect());
		const sizeControlsBounds = document.querySelector("#grid-shape-size-row").getBoundingClientRect();
		const buttonStyles = buttons.map((button) => getComputedStyle(button));
		return {
			leftInset: buttonBounds[0].left - menu.left,
			gaps: buttonBounds.slice(1, 3).map((bounds, index) => bounds.left - buttonBounds[index].right),
			sizeControlsGap: sizeControlsBounds.left - buttonBounds[2].right,
			buttonHeights: buttonBounds.map((bounds) => bounds.height),
			buttonTops: buttonBounds.map((bounds) => bounds.top),
			buttonBottoms: buttonBounds.map((bounds) => bounds.bottom),
			buttonWidths: buttonBounds.map((bounds) => bounds.width),
			fontSizes: buttonStyles.map((styles) => styles.fontSize),
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
	expect(gridAlignmentLayout.sizeControlsGap).toBe(16);
	expect(gridAlignmentLayout.buttonHeights).toEqual(Array(9).fill(24));
	expect(gridAlignmentLayout.fontSizes).toEqual(Array(9).fill("12px"));
	expect(new Set(gridAlignmentLayout.buttonTops.slice(0, 3)).size).toBe(1);
	expect(gridAlignmentLayout.buttonTops[3]).toBe(gridAlignmentLayout.buttonBottoms[0] + 16);
	expect(gridAlignmentLayout.buttonTops[4]).toBe(gridAlignmentLayout.buttonTops[3]);
	expect(gridAlignmentLayout.buttonTops[5]).toBe(gridAlignmentLayout.buttonBottoms[3] + 16);
	expect(gridAlignmentLayout.buttonTops[6]).toBe(gridAlignmentLayout.buttonTops[5]);
	expect(gridAlignmentLayout.buttonTops[7]).toBe(gridAlignmentLayout.buttonBottoms[5] + 16);
	expect(gridAlignmentLayout.buttonTops[8]).toBe(gridAlignmentLayout.buttonTops[7]);
	expect(new Set(gridAlignmentLayout.buttonWidths).size).toBe(1);
	expect(gridAlignmentLayout.buttonWidths).toEqual(Array(9).fill(80));
	expect(gridAlignmentLayout.backgroundColors).toEqual(Array(9).fill("rgb(255, 48, 48)"));
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
	expect(await leftAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow)).toContain(
		"rgba(0, 255, 64, 0.85)",
	);
	await expect(leftAlignmentButton).toHaveText("Left");
	await centerAlignmentButton.click();
	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(leftAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "true");
	await expect(centerAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	expect(await centerAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow)).toContain(
		"rgba(0, 255, 64, 0.85)",
	);
	await expect(centerAlignmentButton).toHaveText("Center");
	await rightAlignmentButton.click();
	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "true");
	await expect(rightAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	expect(await rightAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow)).toContain(
		"rgba(0, 255, 64, 0.85)",
	);
	await expect(rightAlignmentButton).toHaveText("Right");
	await rightAlignmentButton.click();
	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "false");
	await expect(rightAlignmentButton).toHaveCSS("transform", "none");
	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	const applyToMarginsButton = page.locator("#grid-apply-to-margins-button");
	const rowsAmount = page.locator("#grid-rows-amount");
	const columnsAmount = page.locator("#grid-columns-amount");
	const gridShapesList = page.locator("#grid-menu-shapes-list");
	const gridShapeCommitButton = page.locator("#grid-sides-commit-button");
	await expect(page.locator("#grid-sides-label, #grid-sides-input")).toHaveCount(0);
	const gridShapeCommitLayout = await page.evaluate(() => {
		const list = document.querySelector("#grid-menu-shapes-list").getBoundingClientRect();
		const button = document.querySelector("#grid-sides-commit-button").getBoundingClientRect();
		return {
			centerOffset: button.left + button.width / 2 - (list.left + list.width / 2),
			topGap: button.top - list.bottom,
		};
	});
	expect(gridShapeCommitLayout.centerOffset).toBeCloseTo(0, 0);
	expect(gridShapeCommitLayout.topGap).toBe(16);
	const gridHeadingLayout = await page.evaluate(() => {
		const menu = document.querySelector("#text-editor-grid-menu");
		const alignment = document.querySelector("#grid-menu-alignment-heading");
		const lines = document.querySelector("#grid-menu-lines-heading");
		const shapes = document.querySelector("#grid-menu-shapes-heading");
		const size = document.querySelector("#grid-menu-size-heading");
		const sizeDimensions = document.querySelector("#grid-shape-size-row");
		const commit = document.querySelector("#grid-sides-commit-button");
		const alignmentStyles = getComputedStyle(alignment);
		const linesStyles = getComputedStyle(lines);
		const menuLeft = menu.getBoundingClientRect().left;
		return {
			linesLeftOffset: lines.getBoundingClientRect().left - menuLeft,
			shapesLeftOffset: shapes.getBoundingClientRect().left - menuLeft,
			linesGap: lines.getBoundingClientRect().top - commit.getBoundingClientRect().bottom,
			sizeDimensionsGap:
				sizeDimensions.getBoundingClientRect().top - size.getBoundingClientRect().bottom,
			headingsTopOffset: Math.abs(
				size.getBoundingClientRect().top - alignment.getBoundingClientRect().top,
			),
			headingsHorizontalGap:
				size.getBoundingClientRect().left - alignment.getBoundingClientRect().right,
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
	expect(gridHeadingLayout.headingsTopOffset).toBe(0);
	expect(gridHeadingLayout.headingsHorizontalGap).toBe(125);
	expect(gridHeadingLayout.sizeDimensionsGap).toBe(16);
	expect(gridHeadingLayout.shapesGap).toBeGreaterThan(0);
	expect(gridHeadingLayout.linesTextAlign).toBe("left");
	expect(gridHeadingLayout.matchingStyle).toBe(true);
	await expect(gridAppliedButton).toHaveText("Off");
	await expect(gridAppliedButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
	const gridPrintableButton = page.locator("#grid-menu-printable-button");
	await expect(gridPrintableButton).toHaveText("Printable");
	await expect(gridPrintableButton).toHaveAttribute("aria-pressed", "true");
	await expect(gridPrintableButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
	const printableOnShadow = await gridPrintableButton.evaluate((button) =>
		getComputedStyle(button).boxShadow,
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
	const gridSizeCommitButton = page.locator("#grid-shape-size-commit-button");
	const gridShapeCommitButtonStyles = await page.locator("#grid-sides-commit-button").evaluate((button) => {
		const styles = getComputedStyle(button);
		const bounds = button.getBoundingClientRect();
		return {
			width: bounds.width,
			height: bounds.height,
			borderRadius: styles.borderRadius,
			backgroundImage: styles.backgroundImage,
			boxShadow: styles.boxShadow,
		};
	});
	const gridSizeCommitButtonStyles = await gridSizeCommitButton.evaluate((button) => {
		const styles = getComputedStyle(button);
		const bounds = button.getBoundingClientRect();
		return {
			width: bounds.width,
			height: bounds.height,
			borderRadius: styles.borderRadius,
			backgroundImage: styles.backgroundImage,
			boxShadow: styles.boxShadow,
		};
	});
	await expect(gridSizeCommitButton).toHaveText("Commit");
	expect(gridSizeCommitButtonStyles).toEqual(gridShapeCommitButtonStyles);
	await gridShapeHeightInput.fill("2a.3");
	await expect(gridShapeHeightInput).toHaveValue("2.3");
	const gridDimensionLayout = await page.evaluate(() => {
		const menu = document.querySelector("#text-editor-grid-menu");
		const menuBounds = menu.getBoundingClientRect();
		const menuStyles = getComputedStyle(menu);
		const menuContentRight =
			menuBounds.right -
			Number.parseFloat(menuStyles.paddingRight) -
			Number.parseFloat(menuStyles.borderRightWidth);
		const itemBounds = [
			"#grid-shape-width-label",
			"#grid-shape-width-input",
			"#grid-shape-width-unit",
			"#grid-shape-height-label",
			"#grid-shape-height-input",
			"#grid-shape-height-unit",
			"#grid-shape-size-commit-button",
		].map((selector) => document.querySelector(selector).getBoundingClientRect());
		const widthRow = itemBounds.slice(0, 3);
		const heightRow = itemBounds.slice(3, 6);
		const centerY = (bounds) => (bounds.top + bounds.bottom) / 2;
		return {
			widthRowHasReadableGaps: widthRow.every(
				(bounds, index) => index === 0 || bounds.left - widthRow[index - 1].right >= 5,
			),
			heightRowHasReadableGaps: heightRow.every(
				(bounds, index) => index === 0 || bounds.left - heightRow[index - 1].right >= 5,
			),
			verticalGap:
				Math.min(...heightRow.map((bounds) => bounds.top)) -
				Math.max(...widthRow.map((bounds) => bounds.bottom)),
			commitGap: itemBounds[6].left - itemBounds[2].right,
			commitCenterOffset:
				centerY(itemBounds[6]) - (centerY(itemBounds[1]) + centerY(itemBounds[4])) / 2,
			commitRight: itemBounds[6].right,
			menuContentRight,
			commitFits: itemBounds[6].right <= menuContentRight,
		};
	});
	expect(gridDimensionLayout.widthRowHasReadableGaps).toBe(true);
	expect(gridDimensionLayout.heightRowHasReadableGaps).toBe(true);
	expect(gridDimensionLayout.verticalGap).toBe(16);
	expect(gridDimensionLayout.commitGap).toBe(16);
	expect(gridDimensionLayout.commitCenterOffset).toBeCloseTo(0, 0);
	expect(gridDimensionLayout.commitFits).toBe(true);
	await gridShapeWidthInput.fill("1a.2");
	await expect(gridShapeWidthInput).toHaveValue("1.2");
	await gridShapeWidthInput.fill("1..2");
	await expect(gridShapeWidthInput).toHaveValue("1.2");
	await rowsAmount.fill("1");
	await rowsAmount.pressSequentially("a23");
	await expect(rowsAmount).toHaveValue("123");
	await columnsAmount.fill("45");
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
		return {
			left: labels[0].left - menu.left,
			top: labels[0].top - menu.top,
			verticalGaps: labels.slice(1).map((label, index) => label.top - labels[index].bottom),
			headingFontSize: Number.parseFloat(headingStyles.fontSize),
			headingColor: headingStyles.color,
			headingCenter: headingBounds.left + headingBounds.width / 2,
		};
	});
	expect(gridControlGaps.left).toBe(16);
	expect(gridControlGaps.top).toBe(16);
	expect(gridControlGaps.verticalGaps).toEqual([71, 192, 16, 16]);
	expect(gridControlGaps.headingFontSize).toBeCloseTo((22 * 96) / 72, 2);
	expect(gridControlGaps.headingColor).toBe("rgb(0, 0, 0)");
	await gridAppliedButton.click();
	await expect(gridAppliedButton).toHaveText("Off");
	await expect(page.locator("#grid-menu-selection-prompt")).toBeVisible();
	await expect(
		page.getByText("Load or Create a Template or Shell in Order to Switch the Grid on"),
	).toBeVisible();
	await page.locator("#grid-menu-selection-prompt-back-button").click();
	await expect(page.locator("#grid-menu-selection-prompt")).toHaveCount(0);
	await gridShapesList.locator('[data-side-count="5"]').click();
	await gridShapeCommitButton.click();
	await newButton.click();
	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
	await expect(page.locator("#text-editor-new-menu")).toHaveCount(0);
	await expect(newButton).toHaveAttribute("aria-pressed", "false");
	await page.locator("#text-editor-grid-button").click();
	await newButton.click();
	await page.locator("#text-editor-new-create-template-button").click();
	await expect(page.locator("#print-preview-paper")).toBeVisible();
	await page.locator("#text-editor-grid-button").click();
	await rowsAmount.fill("");
	await columnsAmount.fill("");
	const templateGap = await page.evaluate(() => {
		const paper = document.querySelector("#print-preview-paper").getBoundingClientRect();
		const menu = document.querySelector("#text-editor-grid-menu").getBoundingClientRect();
		return menu.left - paper.right;
	});
	expect(templateGap).toBe(16);
	await page.locator("#grid-applied-button").click();
	const paper = page.locator("#print-preview-paper");
	await expect(paper).toHaveAttribute("data-grid-applied", "true");
	await expect(paper).toHaveAttribute("data-grid-printable", "true");
	await expect(paper).toHaveAttribute("data-grid-sides", "5");
	await gridShapesList.locator('[data-side-count="3"]').click();
	await expect(paper).toHaveAttribute("data-grid-sides", "5");
	await gridShapeCommitButton.click();
	await expect(paper).toHaveAttribute("data-grid-sides", "3");
	const grid = paper.locator(".print-preview-grid");
	await expect(grid).toHaveAttribute("data-grid-rows", "3");
	await expect(grid).toHaveAttribute("data-grid-columns", "4");
	await expect(grid).toHaveAttribute("data-grid-rendered-rows", "3");
	await expect(grid).toHaveAttribute("data-grid-rendered-columns", "4");
	await expect(grid).toHaveAttribute("data-grid-sides", "3");
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
	await expect(gridOutline).toHaveAttribute("d", /^M 1 1 H [\d.]+ M 1 1 V [\d.]+ M [\d.]+ 1 V [\d.]+$/);
	await expect(grid.locator("[data-grid-connection]")).toHaveCount(0);
	const triangleCellBounds = await grid.locator("polygon").evaluate((polygon) => {
		const points = polygon.points;
		const vertices = Array.from({ length: points.numberOfItems }, (_, index) => points.getItem(index));
		const pattern = polygon.ownerSVGElement.querySelector("pattern");
		return {
			width: Math.max(...vertices.map((point) => point.x)) - Math.min(...vertices.map((point) => point.x)),
			height: Math.max(...vertices.map((point) => point.y)) - Math.min(...vertices.map((point) => point.y)),
			cellWidth: Number(pattern.getAttribute("width")),
			cellHeight: Number(pattern.getAttribute("height")),
		};
	});
	expect(triangleCellBounds.width).toBeCloseTo(triangleCellBounds.cellWidth, 3);
	expect(triangleCellBounds.height).toBeCloseTo(triangleCellBounds.cellHeight, 3);
	await gridShapesList.locator('[data-side-count="1"]').click();
	await gridShapeCommitButton.click();
	await expect(grid).toHaveAttribute("data-grid-sides", "1");
	await expect(grid.locator("ellipse")).toHaveCount(1);
	await expect(grid.locator("polygon")).toHaveCount(0);
	await expect(grid.locator("[data-grid-connection]")).toHaveCount(0);
	await gridShapesList.locator('[data-side-count="3"]').click();
	await gridShapeCommitButton.click();
	await expect(paper).toHaveAttribute("data-grid-apply-to-margins", "true");
	const quadrilateralExpectations = [
		{ variant: "square", orientation: "axis-aligned-square" },
		{ variant: "diamond", orientation: "diamond" },
		{ variant: "vertical-rectangle", orientation: "tall" },
		{ variant: "horizontal-rectangle", orientation: "wide" },
	];
	for (const { variant, orientation } of quadrilateralExpectations) {
		const quadrilateralOption = gridShapesList.locator(`[data-shape-variant="${variant}"]`);
		await quadrilateralOption.click();
		await expect(quadrilateralOption).toHaveCSS("text-shadow", /rgb\(57, 255, 20\)/);
		await expect(gridShapesList.locator('[data-side-count="4"]')).toHaveCSS(
			"text-shadow",
			/rgb\(57, 255, 20\)/,
		);
		await gridShapeCommitButton.click();
		await expect(grid).toHaveAttribute("data-grid-shape-variant", variant);
		const polygonBounds = await grid.locator("polygon").evaluate((polygon) => {
			const points = polygon.points;
			const vertices = Array.from({ length: points.numberOfItems }, (_, index) =>
				points.getItem(index),
			);
			const pattern = polygon.ownerSVGElement.querySelector("pattern");
			return {
				width: Math.max(...vertices.map((point) => point.x)) - Math.min(...vertices.map((point) => point.x)),
				height: Math.max(...vertices.map((point) => point.y)) - Math.min(...vertices.map((point) => point.y)),
				topEdgeHorizontal: Math.abs(vertices[0].y - vertices[1].y) < 0.001,
				cellWidth: Number(pattern.getAttribute("width")),
				cellHeight: Number(pattern.getAttribute("height")),
			};
		});
		expect(polygonBounds.width).toBeCloseTo(polygonBounds.cellWidth, 3);
		expect(polygonBounds.height).toBeCloseTo(polygonBounds.cellHeight, 3);
		if (orientation === "axis-aligned-square") {
			expect(polygonBounds.topEdgeHorizontal).toBe(true);
		} else if (orientation === "diamond") {
			expect(polygonBounds.topEdgeHorizontal).toBe(false);
		} else if (orientation === "tall") {
			expect(polygonBounds.topEdgeHorizontal).toBe(true);
		} else {
			expect(polygonBounds.topEdgeHorizontal).toBe(true);
		}
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
	const sizeBeforeCommit = await grid.locator("pattern").evaluate((pattern) => ({
		width: Number(pattern.getAttribute("width")),
		height: Number(pattern.getAttribute("height")),
	}));
	await gridSizeCommitButton.click();
	const committedPolygonBounds = await grid.locator("polygon").evaluate((polygon) => {
		const points = polygon.points;
		const vertices = Array.from({ length: points.numberOfItems }, (_, index) =>
			points.getItem(index),
		);
		return {
			width: Math.max(...vertices.map((point) => point.x)) - Math.min(...vertices.map((point) => point.x)),
			height: Math.max(...vertices.map((point) => point.y)) - Math.min(...vertices.map((point) => point.y)),
		};
	});
	expect(sizeBeforeCommit.width).not.toBeCloseTo(1.2 * 109, 1);
	expect(sizeBeforeCommit.height).not.toBeCloseTo(2.3 * 109, 1);
	expect(committedPolygonBounds.width).toBeCloseTo(1.2 * 109, 1);
	expect(committedPolygonBounds.height).toBeCloseTo(2.3 * 109, 1);
	await gridShapeWidthInput.fill("0");
	await gridSizeCommitButton.click();
	await expect(gridShapeWidthInput).toHaveValue("2.3");
	const zeroWidthDefault = await grid.locator("pattern").evaluate((pattern) => ({
		width: Number(pattern.getAttribute("width")),
		height: Number(pattern.getAttribute("height")),
	}));
	expect(zeroWidthDefault.width).toBeCloseTo(2.3 * 109, 1);
	expect(zeroWidthDefault.height).toBeCloseTo(2.3 * 109, 1);
	await gridShapeWidthInput.fill("");
	await gridShapeHeightInput.fill("1.7");
	await gridSizeCommitButton.click();
	await expect(gridShapeWidthInput).toHaveValue("1.7");
	const blankWidthDefault = await grid.locator("pattern").evaluate((pattern) => ({
		width: Number(pattern.getAttribute("width")),
		height: Number(pattern.getAttribute("height")),
	}));
	expect(blankWidthDefault.width).toBeCloseTo(1.7 * 109, 1);
	expect(blankWidthDefault.height).toBeCloseTo(1.7 * 109, 1);
	await gridShapeWidthInput.fill("1.4");
	await gridShapeHeightInput.fill("0");
	await gridSizeCommitButton.click();
	await expect(gridShapeHeightInput).toHaveValue("1.4");
	const zeroHeightDefault = await grid.locator("pattern").evaluate((pattern) => ({
		width: Number(pattern.getAttribute("width")),
		height: Number(pattern.getAttribute("height")),
	}));
	expect(zeroHeightDefault.width).toBeCloseTo(1.4 * 109, 1);
	expect(zeroHeightDefault.height).toBeCloseTo(1.4 * 109, 1);
	await gridShapeWidthInput.fill("1.8");
	await gridShapeHeightInput.fill("");
	await gridSizeCommitButton.click();
	await expect(gridShapeHeightInput).toHaveValue("1.8");
	const blankHeightDefault = await grid.locator("pattern").evaluate((pattern) => ({
		width: Number(pattern.getAttribute("width")),
		height: Number(pattern.getAttribute("height")),
	}));
	expect(blankHeightDefault.width).toBeCloseTo(1.8 * 109, 1);
	expect(blankHeightDefault.height).toBeCloseTo(1.8 * 109, 1);
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
	expect(rightGridAlignment.areaWidth).toBeLessThan(rightGridAlignment.gridWidth);
	expect(rightGridAlignment.leftGap).toBeGreaterThan(0);
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
	expect(centerGridAlignment.areaWidth).toBeLessThan(centerGridAlignment.gridWidth);
	expect(centerGridAlignment.areaHeight).toBeLessThan(centerGridAlignment.gridHeight);
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
		return { leftGap: area.left - paperBounds.left, bottomGap: paperBounds.bottom - area.bottom };
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
		return { rightGap: paperBounds.right - area.right, bottomGap: paperBounds.bottom - area.bottom };
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
