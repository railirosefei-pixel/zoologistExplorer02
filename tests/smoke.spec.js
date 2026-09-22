import { test, expect } from "@playwright/test";

test("home page loads and renders the app shell", async ({ page }) => {
  await page.goto("./");

  await expect(page).toHaveTitle(/zoologistExplorer02/i);
  await expect(page.locator("#home-page-shell")).toBeVisible();
  const backgroundImage = await page.locator("#home-page-shell").evaluate((element) =>
    getComputedStyle(element).backgroundImage,
  );
  expect(backgroundImage).not.toBe("none");
  const containerRightEdge = await page.locator("#home-page-container").evaluate(
    (element) => element.getBoundingClientRect().right,
  );
  expect(containerRightEdge).toBe(275);
  await expect(page.getByRole("button", { name: "Open student section" })).toBeVisible();
});

test("Student button opens the full-screen menu and Back returns home", async ({ page }) => {
  await page.goto("./");

  await page.getByRole("button", { name: "Open student section" }).click();

  const studentMenu = page.locator("#student-menu-page");
  await expect(studentMenu).toBeVisible();
  await expect(page.locator("#calendar-tab")).toBeVisible();
  const menuHeight = await studentMenu.evaluate((element) => element.getBoundingClientRect().height);
  const viewportHeight = page.viewportSize().height;
  expect(menuHeight).toBeGreaterThanOrEqual(viewportHeight);

  await page.getByRole("button", { name: "Back to home page" }).click();

  await expect(page.locator("#home-page-shell")).toBeVisible();
  await expect(studentMenu).toBeHidden();
});
