# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: september-day-gate.spec.js >> September 1 uses a gated explosion before opening the daily menu
- Location: tests\september-day-gate.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Daily Menu/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: /Daily Menu/i }) with timeout 5000ms
  - waiting for getByRole('heading', { name: /Daily Menu/i })

```

```yaml
- main "Student menu":
  - navigation "Student menu navigation":
    - button "Open Calendar tab": Calendar
    - button "Back to home page": Back
  - region "Student menu content":
    - region "Daily menu":
      - button "Back to calendar": Back
      - paragraph: September 1, 2026
      - navigation "Daily menu subjects":
        - button "Math"
        - button "Language Arts"
        - button "Social Studies"
        - button "Science"
        - button "Art"
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test("September 1 uses a gated explosion before opening the daily menu", async ({ page }) => {
  4   | 	await page.goto("./");
  5   | 	await page.getByRole("button", { name: "Open student section" }).click();
  6   | 
  7   | 	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
  8   | 	await expect(septemberOne).toBeVisible();
  9   | 	await septemberOne.click();
  10  | 
  11  | 	await expect(septemberOne).toBeDisabled();
  12  | 	await page.waitForTimeout(1200);
  13  | 	await expect(septemberOne).toBeEnabled();
  14  | 	await septemberOne.click();
  15  | 
  16  | 	await expect(page.locator("#daily-menu-panel")).toBeVisible();
> 17  | 	await expect(page.getByRole("heading", { name: /Daily Menu/i })).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  18  | });
  19  | 
  20  | test("Rapid later clicks preserve earlier square replacements and hide TNT textures", async ({
  21  | 	page,
  22  | }) => {
  23  | 	await page.goto("./");
  24  | 	await page.getByRole("button", { name: "Open student section" }).click();
  25  | 
  26  | 	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
  27  | 	const septemberTwo = page.locator("#calendar-day-cell-September-2026-2");
  28  | 	const septemberThree = page.locator("#calendar-day-cell-September-2026-3");
  29  | 	const septemberOneReplacement = page.locator("#calendar-day-replacement-September-2026-1");
  30  | 	const septemberTwoReplacement = page.locator("#calendar-day-replacement-September-2026-2");
  31  | 
  32  | 	await septemberOne.click();
  33  | 	await page.waitForTimeout(500);
  34  | 	await expect(septemberOneReplacement).toBeVisible();
  35  | 	await expect(septemberOneReplacement).toHaveClass(/calendar-day-replacement--blue/);
  36  | 	await expect(septemberOne).toHaveCSS("background-image", "none");
  37  | 
  38  | 	await septemberTwo.click();
  39  | 	await page.waitForTimeout(250);
  40  | 	await expect(septemberOne).toBeVisible();
  41  | 	await expect(septemberOneReplacement).toBeVisible();
  42  | 	await expect(septemberOneReplacement).toHaveClass(/calendar-day-replacement--blue/);
  43  | 	await expect(septemberOne.locator(".calendar-day-cell-number")).toHaveText("1");
  44  | 	await expect(septemberOne).toHaveCSS("background-image", "none");
  45  | 
  46  | 	await septemberThree.click();
  47  | 	await page.waitForTimeout(250);
  48  | 	await expect(septemberTwo).toBeVisible();
  49  | 	await expect(septemberTwoReplacement).toBeVisible();
  50  | 	await expect(septemberOneReplacement).toHaveClass(/calendar-day-replacement--blue/);
  51  | 	await expect(septemberTwoReplacement).toHaveClass(/calendar-day-replacement--yellow/);
  52  | 	await expect(septemberTwo.locator(".calendar-day-cell-number")).toHaveText("2");
  53  | 	await expect(septemberOne).toHaveCSS("background-image", "none");
  54  | 	await expect(septemberTwo).toHaveCSS("background-image", "none");
  55  | });
  56  | 
  57  | test("Every revealed day opens the daily menu for its own date", async ({ page }) => {
  58  | 	await page.goto("./");
  59  | 	await page.getByRole("button", { name: "Open student section" }).click();
  60  | 
  61  | 	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
  62  | 	const septemberTwo = page.locator("#calendar-day-cell-September-2026-2");
  63  | 	const septemberThree = page.locator("#calendar-day-cell-September-2026-3");
  64  | 	const dailyMenuDate = page.locator(".daily-menu-date");
  65  | 
  66  | 	await septemberOne.click();
  67  | 	await page.waitForTimeout(500);
  68  | 	await septemberTwo.click();
  69  | 	await page.waitForTimeout(500);
  70  | 	await septemberThree.click();
  71  | 	await page.waitForTimeout(500);
  72  | 
  73  | 	for (const [dayCell, expectedDate] of [
  74  | 		[septemberOne, "September 1, 2026"],
  75  | 		[septemberTwo, "September 2, 2026"],
  76  | 		[septemberThree, "September 3, 2026"],
  77  | 	]) {
  78  | 		await dayCell.click();
  79  | 		await expect(page.locator("#daily-menu-panel")).toBeVisible();
  80  | 		await expect(dailyMenuDate).toHaveText(expectedDate);
  81  | 		await page.getByRole("button", { name: "Back to calendar" }).click();
  82  | 	}
  83  | });
  84  | 
  85  | test("Leaving and reopening the calendar reapplies the TNT texture", async ({ page }) => {
  86  | 	await page.goto("./");
  87  | 	await page.getByRole("button", { name: "Open student section" }).click();
  88  | 
  89  | 	const septemberOne = page.locator("#calendar-day-cell-September-2026-1");
  90  | 	await septemberOne.click();
  91  | 	await page.waitForTimeout(500);
  92  | 	await expect(septemberOne).toHaveCSS("background-image", "none");
  93  | 
  94  | 	await page.getByRole("button", { name: "Back to home page" }).click();
  95  | 	await expect(page.locator("#home-page-shell")).toBeVisible();
  96  | 
  97  | 	await page.getByRole("button", { name: "Open student section" }).click();
  98  | 	const reopenedSeptemberOne = page.locator("#calendar-day-cell-September-2026-1");
  99  | 	await expect(reopenedSeptemberOne).toHaveCSS("background-image", /url\(".*minecraftTNT/);
  100 | });
  101 | 
```