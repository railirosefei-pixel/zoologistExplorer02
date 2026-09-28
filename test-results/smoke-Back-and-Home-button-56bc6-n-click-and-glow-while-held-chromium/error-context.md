# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> Back and Home buttons depress on click and glow while held
- Location: tests\smoke.spec.js:232:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Student Edits' })

```

# Page snapshot

```yaml
- main "Student home page" [ref=f1e3]:
  - region "Student home page container" [ref=f1e4]:
    - button "Open student section" [ref=f1e5] [cursor=pointer]: Student
    - button "Open parent section" [ref=f1e6] [cursor=pointer]: Parent
```

# Test source

```ts
  152 | 	);
  153 | 	await page.mouse.up();
  154 | 
  155 | 	const horizontalResizedBounds = await readBarBounds();
  156 | 	expect(horizontalResizedBounds.width).toBe(100);
  157 | 	expect(horizontalResizedBounds.height).toBe(60);
  158 | 	expect(horizontalResizedBounds.y).toBe(horizontalBounds.y);
  159 | 
  160 | 	await rotateButton.click();
  161 | 	await expect(calibrationBar).toHaveCSS("width", "60px");
  162 | 	await expect(calibrationBar).toHaveCSS("height", "580px");
  163 | 
  164 | 	await page.goto("./");
  165 | 	await page.getByRole("button", { name: "Open parent section" }).click();
  166 | 	await page.getByRole("button", { name: "Text Editor" }).click();
  167 | 	await page.getByRole("button", { name: "Calibrate" }).click();
  168 | 	const movementStartBounds = await readBarBounds();
  169 | 	const movementStartX = movementStartBounds.x + movementStartBounds.width / 2;
  170 | 	const movementStartY = movementStartBounds.y + movementStartBounds.height / 2;
  171 | 	await page.mouse.move(movementStartX, movementStartY);
  172 | 	await page.mouse.down();
  173 | 	await page.mouse.move(movementStartX + 35, movementStartY + 20);
  174 | 	await page.mouse.up();
  175 | 	const movedBounds = await readBarBounds();
  176 | 	expect(movedBounds.x).toBe(movementStartBounds.x + 35);
  177 | 	expect(movedBounds.y).toBe(movementStartBounds.y + 20);
  178 | });
  179 | 
  180 | test("September 2026 hides Back without moving Calendar or Forward", async ({ page }) => {
  181 | 	await page.goto("./");
  182 | 	await page.getByRole("button", { name: "Open student section" }).click();
  183 | 
  184 | 	const calendarHeading = page.locator("#calendar-menu-heading");
  185 | 	const forwardButton = page.locator("#calendar-next-month-button");
  186 | 	const backButton = page.locator("#calendar-previous-month-button");
  187 | 	const readPosition = (element) =>
  188 | 		element.evaluate((node) => {
  189 | 			const { x, y, width, height } = node.getBoundingClientRect();
  190 | 			return { x, y, width, height };
  191 | 		});
  192 | 
  193 | 	await page.getByRole("button", { name: "Show next month" }).click();
  194 | 	const octoberHeadingPosition = await readPosition(calendarHeading);
  195 | 	const octoberForwardPosition = await readPosition(forwardButton);
  196 | 
  197 | 	await page.getByRole("button", { name: "Show previous month" }).click();
  198 | 	await expect(backButton).toHaveCount(0);
  199 | 	expect(await readPosition(calendarHeading)).toEqual(octoberHeadingPosition);
  200 | 	expect(await readPosition(forwardButton)).toEqual(octoberForwardPosition);
  201 | });
  202 | 
  203 | test("December 2027 hides Forward without moving Back or Calendar", async ({ page }) => {
  204 | 	await page.goto("./");
  205 | 	await page.getByRole("button", { name: "Open student section" }).click();
  206 | 
  207 | 	const calendarHeading = page.locator("#calendar-menu-heading");
  208 | 	const backButton = page.locator("#calendar-previous-month-button");
  209 | 	const forwardButton = page.locator("#calendar-next-month-button");
  210 | 	const monthHeading = page.locator("#calendar-month-header h2");
  211 | 	const readPosition = (element) =>
  212 | 		element.evaluate((node) => {
  213 | 			const { x, y, width, height } = node.getBoundingClientRect();
  214 | 			return { x, y, width, height };
  215 | 		});
  216 | 
  217 | 	for (let monthOffset = 0; monthOffset < 14; monthOffset += 1) {
  218 | 		await page.getByRole("button", { name: "Show next month" }).click();
  219 | 	}
  220 | 	await expect(monthHeading).toHaveText("November 2027");
  221 | 	const novemberHeadingPosition = await readPosition(calendarHeading);
  222 | 	const novemberBackPosition = await readPosition(backButton);
  223 | 
  224 | 	await page.getByRole("button", { name: "Show next month" }).click();
  225 | 	await expect(monthHeading).toHaveText("December 2027");
  226 | 	await expect(forwardButton).toHaveCount(0);
  227 | 	await expect(backButton).toBeVisible();
  228 | 	expect(await readPosition(calendarHeading)).toEqual(novemberHeadingPosition);
  229 | 	expect(await readPosition(backButton)).toEqual(novemberBackPosition);
  230 | });
  231 | 
  232 | test("Back and Home buttons depress on click and glow while held", async ({ page }) => {
  233 | 	await page.goto("./");
  234 | 	await page.getByRole("button", { name: "Open parent section" }).click();
  235 | 	await page.getByRole("button", { name: "Student Edits" }).click();
  236 | 
  237 | 	const homeButton = page.locator("#student-edits-screen-home-button");
  238 | 	const backButton = page.locator("#student-edits-screen-back-button");
  239 | 	await expect(homeButton).toBeVisible();
  240 | 	await expect(backButton).toBeVisible();
  241 | 
  242 | 	const homeBounds = await homeButton.boundingBox();
  243 | 	const backBounds = await backButton.boundingBox();
  244 | 	await page.mouse.move(homeBounds.x + homeBounds.width / 2, homeBounds.y + homeBounds.height / 2);
  245 | 	await page.mouse.down();
  246 | 	await expect(homeButton).toHaveClass(/nav-button--held-home/);
  247 | 	await expect(homeButton).toHaveCSS("animation-duration", "8s");
  248 | 	await expect(homeButton).toHaveCSS("animation-name", /sparkle|glow/i);
  249 | 	await page.mouse.up();
  250 | 	await expect(page.getByRole("button", { name: "Open parent section" })).toBeVisible();
  251 | 
> 252 | 	await page.getByRole("button", { name: "Student Edits" }).click();
      |                                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  253 | 	const backCenterX = backBounds.x + backBounds.width / 2;
  254 | 	const backCenterY = backBounds.y + backBounds.height / 2;
  255 | 	await page.mouse.move(backCenterX, backCenterY);
  256 | 	await page.mouse.down();
  257 | 	await expect(backButton).toHaveClass(/nav-button--held-back/);
  258 | 	await expect(backButton).toHaveCSS("animation-duration", "8s");
  259 | 	await expect(backButton).toHaveCSS("animation-name", /sparkle|glow/i);
  260 | 	await page.mouse.up();
  261 | 	await expect(page.getByRole("button", { name: "Student Edits" })).toBeVisible();
  262 | 	await expect(page.getByRole("button", { name: "Text Editor" })).toBeVisible();
  263 | });
  264 | 
  265 | test("Student sidebar includes the full button set", async ({ page }) => {
  266 | 	await page.goto("./");
  267 | 	await page.getByRole("button", { name: "Open student section" }).click();
  268 | 
  269 | 	await expect(page.getByRole("button", { name: "Calendar" })).toBeVisible();
  270 | 	await expect(page.getByRole("button", { name: "Rewards" })).toBeVisible();
  271 | 	await expect(page.getByRole("button", { name: "Games" })).toBeVisible();
  272 | 	await expect(page.getByRole("button", { name: "Extra Credit" })).toBeVisible();
  273 | 	await expect(page.getByRole("button", { name: "Progress" })).toBeVisible();
  274 | });
  275 | 
  276 | test("Rewards button opens full-screen rewards page", async ({ page }) => {
  277 | 	await page.goto("./");
  278 | 	await page.getByRole("button", { name: "Open student section" }).click();
  279 | 	await page.getByRole("button", { name: "Open Rewards tab" }).click();
  280 | 
  281 | 	const rewardsPage = page.locator("#rewards-page");
  282 | 	await expect(rewardsPage).toBeVisible();
  283 | 	await expect(page.locator("#student-menu-page")).toBeHidden();
  284 | 	await expect(rewardsPage.locator("#rewards-page-heading")).toHaveText("Rewards");
  285 | 
  286 | 	const backgroundImage = await rewardsPage.evaluate(
  287 | 		(element) => getComputedStyle(element).backgroundImage,
  288 | 	);
  289 | 	expect(backgroundImage).toMatch(/rewardsMenu02[^)]*\.webp/);
  290 | 
  291 | 	const pageSize = await rewardsPage.evaluate((element) => {
  292 | 		const { width, height } = element.getBoundingClientRect();
  293 | 		return { width, height };
  294 | 	});
  295 | 	const viewportSize = page.viewportSize();
  296 | 	expect(pageSize.width).toBeGreaterThanOrEqual(viewportSize.width);
  297 | 	expect(pageSize.height).toBeGreaterThanOrEqual(viewportSize.height);
  298 | 
  299 | 	const rewardChestButton = page.getByRole("button", { name: "Open reward chest" });
  300 | 	const rewardChestImage = rewardChestButton.locator(".rewards-page-chest");
  301 | 	await expect(rewardChestImage).toHaveAttribute("src", /minecraftChest01[^/]*\.webp/);
  302 | 
  303 | 	await rewardChestButton.hover();
  304 | 	await expect(rewardChestImage).toHaveAttribute("src", /minecraftChest02[^/]*\.webp/);
  305 | 
  306 | 	await rewardChestButton.click();
  307 | 	await expect(rewardChestImage).toHaveAttribute("src", /minecraftChest03[^/]*\.webp/);
  308 | 
  309 | 	const rewardJournal = rewardsPage.locator(".rewards-page-journal");
  310 | 	await expect(rewardJournal).toBeVisible();
  311 | 	expect(
  312 | 		await rewardJournal.evaluate((element) => getComputedStyle(element).animationName),
  313 | 	).toMatch(/^rewards-journal-emerge(?:-[\w-]+)?$/);
  314 | 
  315 | 	await rewardJournal.dispatchEvent("animationend");
  316 | 	const rewardBookAnimation = rewardsPage.locator(".rewards-page-book-animation");
  317 | 	await expect(rewardBookAnimation).toBeVisible();
  318 | 	await expect(rewardBookAnimation).toHaveAttribute("src", /Sequence02[^/]*\.webm/);
  319 | 	await expect(rewardBookAnimation).toHaveJSProperty("muted", true);
  320 | 	await expect
  321 | 		.poll(() => rewardBookAnimation.evaluate((element) => element.readyState))
  322 | 		.toBeGreaterThanOrEqual(1);
  323 | 
  324 | 	await rewardBookAnimation.evaluate((element) => {
  325 | 		element.currentTime = element.duration;
  326 | 		element.dispatchEvent(new Event("ended"));
  327 | 	});
  328 | 
  329 | 	const rewardBookStage = rewardsPage.locator(".rewards-page-book-stage");
  330 | 	await expect(rewardBookStage).toHaveClass(/rewards-page-book-stage--settled/);
  331 | 	await expect(rewardBookAnimation).toBeVisible();
  332 | 	await expect
  333 | 		.poll(async () => {
  334 | 			const bookBounds = await rewardBookAnimation.boundingBox();
  335 | 			const chestBounds = await rewardChestButton.boundingBox();
  336 | 			return bookBounds.x + bookBounds.width / 2 - (chestBounds.x + chestBounds.width / 2);
  337 | 		})
  338 | 		.toBeLessThan(0);
  339 | 
  340 | 	await page.getByRole("button", { name: "Back to student menu" }).click();
  341 | 	await expect(page.locator("#student-menu-page")).toBeVisible();
  342 | 	await expect(page.locator("#calendar-menu-heading")).toBeVisible();
  343 | });
  344 | 
  345 | test("Student sidebar navigation always selects its destination", async ({ page }) => {
  346 | 	await page.goto("./");
  347 | 	await page.getByRole("button", { name: "Open student section" }).click();
  348 | 
  349 | 	const destinations = [
  350 | 		{ button: "Games", panel: "#games-menu" },
  351 | 		{ button: "Extra Credit", panel: "#extra-credit-menu" },
  352 | 		{ button: "Progress", panel: "#student-submenu-panel" },
```