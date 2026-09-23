# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> TNT-visible day cell is disabled until its texture has cleared
- Location: tests\smoke.spec.js:39:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.calendar-day-cell:not(.calendar-day-cell--empty)').first().locator('.calendar-day-cell-explosion')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.calendar-day-cell:not(.calendar-day-cell--empty)').first().locator('.calendar-day-cell-explosion') with timeout 5000ms
  - waiting for locator('.calendar-day-cell:not(.calendar-day-cell--empty)').first().locator('.calendar-day-cell-explosion')

```

```yaml
- main "Student menu":
  - navigation "Student menu navigation":
    - button "Open Calendar tab": Calendar
    - button "Back to home page": Back
  - region "Student menu content":
    - button "Show previous month": Back
    - heading "Calendar" [level=1]
    - button "Show next month": Forward
    - article "Current month calendar card":
      - heading "September 2026" [level=2]
      - button
      - button "Calendar day replacement"
      - button "2"
      - button "3"
      - button "4"
      - button "5"
      - button "6"
      - button "7"
      - button "8"
      - button "9"
      - button "10"
      - button "11"
      - button "12"
      - button "13"
      - button "14"
      - button "15"
      - button "16"
      - button "17"
      - button "18"
      - button "19"
      - button "20"
      - button "21"
      - button "22"
      - button "23"
      - button "24"
      - button "25"
      - button "26"
      - button "27"
      - button "28"
      - button "29"
      - button "30"
      - button
      - button
      - button
      - button
      - button
      - button
      - button
      - button
      - button
      - button
      - button
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("home page loads and renders the app shell", async ({ page }) => {
  4  | 	await page.goto("./");
  5  | 
  6  | 	await expect(page).toHaveTitle(/zoologistExplorer02/i);
  7  | 	await expect(page.locator("#home-page-shell")).toBeVisible();
  8  | 	const backgroundImage = await page
  9  | 		.locator("#home-page-shell")
  10 | 		.evaluate((element) => getComputedStyle(element).backgroundImage);
  11 | 	expect(backgroundImage).not.toBe("none");
  12 | 	const containerRightEdge = await page
  13 | 		.locator("#home-page-container")
  14 | 		.evaluate((element) => element.getBoundingClientRect().right);
  15 | 	expect(containerRightEdge).toBe(275);
  16 | 	await expect(page.getByRole("button", { name: "Open student section" })).toBeVisible();
  17 | });
  18 | 
  19 | test("Student button opens the full-screen menu and Back returns home", async ({ page }) => {
  20 | 	await page.goto("./");
  21 | 
  22 | 	await page.getByRole("button", { name: "Open student section" }).click();
  23 | 
  24 | 	const studentMenu = page.locator("#student-menu-page");
  25 | 	await expect(studentMenu).toBeVisible();
  26 | 	await expect(page.locator("#calendar-tab")).toBeVisible();
  27 | 	const menuHeight = await studentMenu.evaluate(
  28 | 		(element) => element.getBoundingClientRect().height,
  29 | 	);
  30 | 	const viewportHeight = page.viewportSize().height;
  31 | 	expect(menuHeight).toBeGreaterThanOrEqual(viewportHeight);
  32 | 
  33 | 	await page.getByRole("button", { name: "Back to home page" }).click();
  34 | 
  35 | 	await expect(page.locator("#home-page-shell")).toBeVisible();
  36 | 	await expect(studentMenu).toBeHidden();
  37 | });
  38 | 
  39 | test("TNT-visible day cell is disabled until its texture has cleared", async ({ page }) => {
  40 | 	await page.goto("./");
  41 | 	await page.getByRole("button", { name: "Open student section" }).click();
  42 | 
  43 | 	const clickedDay = page.locator(".calendar-day-cell:not(.calendar-day-cell--empty)").first();
  44 | 	await clickedDay.click();
  45 | 	await expect(clickedDay).toBeDisabled();
  46 | 	await expect(page.locator(".calendar-day-replacement")).toBeVisible();
> 47 | 	await expect(clickedDay.locator(".calendar-day-cell-explosion")).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  48 | 	await expect(clickedDay.locator(".calendar-day-cell-number")).toBeHidden();
  49 | 
  50 | 	await page.waitForTimeout(500);
  51 | 	await expect(clickedDay).not.toBeDisabled();
  52 | });
  53 | 
  54 | test("TNT explosion remains scoped to its clicked month and day cell", async ({ page }) => {
  55 | 	await page.goto("./");
  56 | 	await page.getByRole("button", { name: "Open student section" }).click();
  57 | 
  58 | 	const clickedDay = page.locator(".calendar-day-cell:not(.calendar-day-cell--empty)").first();
  59 | 	await clickedDay.click();
  60 | 	await expect(page.locator(".calendar-day-replacement")).toBeVisible();
  61 | 	await expect(clickedDay.locator(".calendar-day-cell-explosion")).toBeVisible();
  62 | 	await expect(clickedDay.locator(".calendar-day-cell-number")).toBeHidden();
  63 | 
  64 | 	await page.getByRole("button", { name: "Show next month" }).click();
  65 | 	await expect(page.locator(".calendar-day-replacement")).toBeHidden();
  66 | 
  67 | 	await page.getByRole("button", { name: "Show previous month" }).click();
  68 | 	await expect(clickedDay.locator(".calendar-day-cell-number")).toBeVisible();
  69 | });
  70 | 
```