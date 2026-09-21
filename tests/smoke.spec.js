import { test, expect } from "@playwright/test";

test("home page loads and renders the app shell", async ({ page }) => {
  await page.goto("./");

  await expect(page).toHaveTitle(/cTeacher/i);
  await expect(page.getByText("Learn, guide, and grow with clarity.")).toBeVisible();
});

test("schedule calendar button exposes its dedicated visual selector", async ({ page }) => {
  await page.goto("./");

  await page.getByRole("button", { name: "Adult Menu", exact: true }).click();
  await page.getByRole("button", { name: "Schedule Plan", exact: true }).click();

  const calendarButton = page.locator("#schedule-calendar-button");

  await expect(calendarButton).toBeVisible();
  await expect(calendarButton).toHaveClass(/schedule-calendar-button/);

  const computedStyles = await calendarButton.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      backgroundImage: styles.backgroundImage,
      borderColor: styles.borderColor,
      boxShadow: styles.boxShadow,
    };
  });

  expect(computedStyles.backgroundImage).toContain("radial-gradient");
  expect(computedStyles.borderColor).not.toBe("rgb(49, 65, 88)");
  expect(computedStyles.boxShadow).toContain("rgba(2, 6, 23");
});
