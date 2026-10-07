# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> Text Editor navigation controls stay aligned with the New menu
- Location: tests\smoke.spec.js:1629:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
```

# Page snapshot

```yaml
- main "Parent screen" [ref=e3]:
  - region "Text Editor menu" [ref=e4]:
    - navigation "Text Editor navigation" [ref=e5]:
      - button "Load" [ref=e6] [cursor=pointer]
      - button "New +" [pressed] [ref=e7] [cursor=pointer]
      - button "Tools" [active] [pressed] [ref=e8] [cursor=pointer]
      - button "Grid" [pressed] [ref=e9] [cursor=pointer]
      - button "Calibrate" [ref=e10] [cursor=pointer]
      - button "Print" [ref=e11] [cursor=pointer]
      - button "Return home" [ref=e12] [cursor=pointer]: Home
      - button "Back to parent menu" [ref=e13] [cursor=pointer]: Back
    - region "New menu" [ref=e14]:
      - button "Create A Shell" [ref=e15] [cursor=pointer]
      - button "Create A Template" [ref=e16] [cursor=pointer]
    - region "Grid menu" [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: Grid Applied
        - 'button "Grid Applied: Off" [ref=e20] [cursor=pointer]': "Off"
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Alignment
          - generic [ref=e24]: Size
        - generic [ref=e25]:
          - generic [ref=e27]:
            - group [ref=e28]:
              - generic "Grid Alignment" [ref=e29]
              - group "Grid alignment" [ref=e30]:
                - generic [ref=e31]:
                  - button "Left" [ref=e32] [cursor=pointer]
                  - button "Center" [ref=e33] [cursor=pointer]
                  - button "Right" [ref=e34] [cursor=pointer]
                - generic [ref=e35]:
                  - button "Bottom" [ref=e36] [cursor=pointer]
                  - button "Top" [ref=e37] [cursor=pointer]
                - generic [ref=e38]:
                  - button "Bottom Left" [ref=e39] [cursor=pointer]
                  - button "Bottom Right" [ref=e40] [cursor=pointer]
                - generic [ref=e41]:
                  - button "Top Left" [ref=e42] [cursor=pointer]
                  - button "Top Right" [ref=e43] [cursor=pointer]
            - generic [ref=e44]:
              - generic [ref=e45]: Rows Amount
              - textbox "Rows Amount" [ref=e46]
            - generic [ref=e47]:
              - generic [ref=e48]: Columns Amount
              - textbox "Columns Amount" [ref=e49]
            - generic [ref=e50]:
              - generic [ref=e51]: Apply to Margins
              - button "Off" [ref=e52] [cursor=pointer]
          - generic [ref=e53]:
            - generic [ref=e54]: Width
            - textbox "Width" [ref=e55]
            - generic [ref=e56]: inches
            - generic [ref=e57]: Height
            - textbox "Height" [ref=e58]
            - generic [ref=e59]: inches
            - button "Commit" [ref=e60] [cursor=pointer]
      - generic [ref=e61]: Shapes
      - generic [ref=e62]:
        - list "Shapes" [ref=e63]:
          - listitem [ref=e64]:
            - 'button "1 Side: Circle" [ref=e65] [cursor=pointer]'
          - listitem [ref=e66]:
            - 'button "3 Sides: Triangle" [ref=e67] [cursor=pointer]'
          - listitem [ref=e68]:
            - 'button "4 Sides: Quadrilateral" [ref=e69] [cursor=pointer]'
            - list "Quadrilateral grid shapes" [ref=e70]:
              - listitem [ref=e71]:
                - button "A.) Squares" [ref=e72] [cursor=pointer]
              - listitem [ref=e73]:
                - button "B.) Squares (Diamond)" [ref=e74] [cursor=pointer]
              - listitem [ref=e75]:
                - button "C.) Rectangles (Vertical)" [ref=e76] [cursor=pointer]
              - listitem [ref=e77]:
                - button "D.) Rectangles (Horizontal)" [ref=e78] [cursor=pointer]
          - listitem [ref=e79]:
            - 'button "5 Sides: Pentagon" [ref=e80] [cursor=pointer]'
          - listitem [ref=e81]:
            - 'button "6 Sides: Hexagon" [ref=e82] [cursor=pointer]'
          - listitem [ref=e83]:
            - 'button "7 Sides: Heptagon" [ref=e84] [cursor=pointer]'
          - listitem [ref=e85]:
            - 'button "8 Sides: Octagon" [ref=e86] [cursor=pointer]'
          - listitem [ref=e87]:
            - 'button "9 Sides: Nonagon" [ref=e88] [cursor=pointer]'
          - listitem [ref=e89]:
            - 'button "10 Sides: Decagon" [ref=e90] [cursor=pointer]'
          - listitem [ref=e91]:
            - 'button "11 Sides: Hendecagon" [ref=e92] [cursor=pointer]'
          - listitem [ref=e93]:
            - 'button "12 Sides: Dodecagon" [ref=e94] [cursor=pointer]'
          - listitem [ref=e95]:
            - 'button "13 Sides: Triskaidecagon" [ref=e96] [cursor=pointer]'
          - listitem [ref=e97]:
            - 'button "14 Sides: Tetradecagon" [ref=e98] [cursor=pointer]'
          - listitem [ref=e99]:
            - 'button "15 Sides: Pentadecagon" [ref=e100] [cursor=pointer]'
          - listitem [ref=e101]:
            - 'button "16 Sides: Hexadecagon" [ref=e102] [cursor=pointer]'
          - listitem [ref=e103]:
            - 'button "17 Sides: Heptadecagon" [ref=e104] [cursor=pointer]'
          - listitem [ref=e105]:
            - 'button "18 Sides: Octadecagon" [ref=e106] [cursor=pointer]'
          - listitem [ref=e107]:
            - 'button "19 Sides: Enneadecagon" [ref=e108] [cursor=pointer]'
          - listitem [ref=e109]:
            - 'button "20 Sides: Icosagon" [ref=e110] [cursor=pointer]'
          - listitem [ref=e111]:
            - 'button "21 Sides: Icosihenagon" [ref=e112] [cursor=pointer]'
          - listitem [ref=e113]:
            - 'button "22 Sides: Icosidigon" [ref=e114] [cursor=pointer]'
          - listitem [ref=e115]:
            - 'button "23 Sides: Icositrigon" [ref=e116] [cursor=pointer]'
          - listitem [ref=e117]:
            - 'button "24 Sides: Icositetragon" [ref=e118] [cursor=pointer]'
          - listitem [ref=e119]:
            - 'button "25 Sides: Icosipentagon" [ref=e120] [cursor=pointer]'
          - listitem [ref=e121]:
            - 'button "26 Sides: Icosihexagon" [ref=e122] [cursor=pointer]'
          - listitem [ref=e123]:
            - 'button "27 Sides: Icosiheptagon" [ref=e124] [cursor=pointer]'
          - listitem [ref=e125]:
            - 'button "28 Sides: Icosioctagon" [ref=e126] [cursor=pointer]'
          - listitem [ref=e127]:
            - 'button "29 Sides: Icosienneagon" [ref=e128] [cursor=pointer]'
          - listitem [ref=e129]:
            - 'button "30 Sides: Triacontagon" [ref=e130] [cursor=pointer]'
          - listitem [ref=e131]:
            - 'button "31 Sides: Triacontahenagon" [ref=e132] [cursor=pointer]'
          - listitem [ref=e133]:
            - 'button "32 Sides: Triacontadigon" [ref=e134] [cursor=pointer]'
          - listitem [ref=e135]:
            - 'button "33 Sides: Triacontatrigon" [ref=e136] [cursor=pointer]'
          - listitem [ref=e137]:
            - 'button "34 Sides: Triacontatetragon" [ref=e138] [cursor=pointer]'
          - listitem [ref=e139]:
            - 'button "35 Sides: Triacontapentagon" [ref=e140] [cursor=pointer]'
          - listitem [ref=e141]:
            - 'button "36 Sides: Triacontahexagon" [ref=e142] [cursor=pointer]'
          - listitem [ref=e143]:
            - 'button "37 Sides: Triacontaheptagon" [ref=e144] [cursor=pointer]'
          - listitem [ref=e145]:
            - 'button "38 Sides: Triacontaoctagon" [ref=e146] [cursor=pointer]'
          - listitem [ref=e147]:
            - 'button "39 Sides: Triacontaenneagon" [ref=e148] [cursor=pointer]'
          - listitem [ref=e149]:
            - 'button "40 Sides: Tetracontagon" [ref=e150] [cursor=pointer]'
          - listitem [ref=e151]:
            - 'button "41 Sides: Tetracontahenagon" [ref=e152] [cursor=pointer]'
          - listitem [ref=e153]:
            - 'button "42 Sides: Tetracontadigon" [ref=e154] [cursor=pointer]'
          - listitem [ref=e155]:
            - 'button "43 Sides: Tetracontatrigon" [ref=e156] [cursor=pointer]'
          - listitem [ref=e157]:
            - 'button "44 Sides: Tetracontatetragon" [ref=e158] [cursor=pointer]'
          - listitem [ref=e159]:
            - 'button "45 Sides: Tetracontapentagon" [ref=e160] [cursor=pointer]'
          - listitem [ref=e161]:
            - 'button "46 Sides: Tetracontahexagon" [ref=e162] [cursor=pointer]'
          - listitem [ref=e163]:
            - 'button "47 Sides: Tetracontaheptagon" [ref=e164] [cursor=pointer]'
          - listitem [ref=e165]:
            - 'button "48 Sides: Tetracontaoctagon" [ref=e166] [cursor=pointer]'
          - listitem [ref=e167]:
            - 'button "49 Sides: Tetracontaenneagon" [ref=e168] [cursor=pointer]'
          - listitem [ref=e169]:
            - 'button "50 Sides: Pentacontagon" [ref=e170] [cursor=pointer]'
        - button "Commit" [ref=e171] [cursor=pointer]
      - generic [ref=e172]: Lines
      - button "Printable" [pressed] [ref=e173] [cursor=pointer]
    - region "Editing tools" [ref=e174]:
      - generic [ref=e177]:
        - button "Size" [ref=e179] [cursor=pointer]
        - button "Margins" [ref=e180] [cursor=pointer]
        - button "Fonts" [ref=e181] [cursor=pointer]
        - button "Alignment" [ref=e182] [cursor=pointer]
```

# Test source

```ts
  1667 | 	for (const button of [loadButton, newButtonMetrics, toolsButton, gridButton, calibrateButton]) {
  1668 | 		expect(button.width).toBe(136);
  1669 | 		expect(button.height).toBe(64);
  1670 | 		expect(button.top).toBe(loadButton.top);
  1671 | 	}
  1672 | 	for (const [index, button] of navMetrics.buttons.slice(0, 5).entries()) {
  1673 | 		if (index > 0) {
  1674 | 			expect(button.left - navMetrics.buttons[index - 1].right).toBe(16);
  1675 | 		}
  1676 | 	}
  1677 | 
  1678 | 	await page.setViewportSize({ width: 2560, height: 1080 });
  1679 | 	await page.locator("#text-editor-template-new-button").click();
  1680 | 	await expect(page.locator("#text-editor-new-menu")).toBeVisible();
  1681 | 	await expect(page.locator("#text-editor-print-preview-panel")).toHaveCount(0);
  1682 | 	const newButton = page.locator("#text-editor-template-new-button");
  1683 | 	await expect(newButton).toHaveAttribute("aria-pressed", "true");
  1684 | 	await page.locator("#text-editor-grid-button").click();
  1685 | 	await expect(page.locator("#text-editor-grid-button")).toHaveAttribute("aria-pressed", "true");
  1686 | 	await expect(page.locator("#text-editor-grid-menu")).toBeVisible();
  1687 | 	await page.locator("#text-editor-editing-tools-button").click();
  1688 | 	const gridMenuBounds = await page.locator("#text-editor-grid-menu").evaluate((menu) => {
  1689 | 		const bounds = menu.getBoundingClientRect();
  1690 | 		const styles = getComputedStyle(menu);
  1691 | 		return {
  1692 | 			top: bounds.top,
  1693 | 			rightGap: window.innerWidth - bounds.right,
  1694 | 			bottomGap: window.innerHeight - bounds.bottom,
  1695 | 			borderRadius: styles.borderRadius,
  1696 | 			backgroundColor: styles.backgroundColor,
  1697 | 			boxShadow: styles.boxShadow,
  1698 | 		};
  1699 | 	});
  1700 | 	expect(gridMenuBounds.top).toBe(112);
  1701 | 	expect(gridMenuBounds.rightGap).toBe(16);
  1702 | 	expect(gridMenuBounds.bottomGap).toBe(16);
  1703 | 	const matchingToolsFrame = await page.evaluate(() => {
  1704 | 		const tools = getComputedStyle(document.querySelector("#text-editor-tools-panel"));
  1705 | 		const gridMenu = getComputedStyle(document.querySelector("#text-editor-grid-menu"));
  1706 | 		return ["borderRadius", "backgroundColor", "boxShadow"].every(
  1707 | 			(property) => tools[property] === gridMenu[property],
  1708 | 		);
  1709 | 	});
  1710 | 	expect(matchingToolsFrame).toBe(true);
  1711 | 	await expect(page.locator("#text-editor-grid-menu aside")).toHaveCount(0);
  1712 | 	const gridAppliedButton = page.locator("#grid-applied-button");
  1713 | 	const gridAlignmentDropdown = page.locator("#grid-menu-alignment-dropdown");
  1714 | 	await expect(gridAlignmentDropdown).toBeVisible();
  1715 | 	await expect(gridAlignmentDropdown).toHaveAttribute("open", "");
  1716 | 	await expect(gridAlignmentDropdown.locator("summary")).toHaveText("Grid Alignment");
  1717 | 	const gridAlignmentButtons = page.locator("#grid-menu-alignment-buttons button");
  1718 | 	await expect(gridAlignmentButtons).toHaveCount(9);
  1719 | 	expect((await gridAlignmentButtons.allTextContents()).map((label) => label.trim())).toEqual([
  1720 | 		"Left",
  1721 | 		"Center",
  1722 | 		"Right",
  1723 | 		"Bottom",
  1724 | 		"Top",
  1725 | 		"Bottom Left",
  1726 | 		"Bottom Right",
  1727 | 		"Top Left",
  1728 | 		"Top Right",
  1729 | 	]);
  1730 | 	const gridAlignmentLayout = await page.evaluate(() => {
  1731 | 		const menu = document.querySelector("#text-editor-grid-menu").getBoundingClientRect();
  1732 | 		const reference = document.querySelector("#grid-applied-button");
  1733 | 		const referenceStyles = getComputedStyle(reference);
  1734 | 		const buttons = [...document.querySelectorAll("#grid-menu-alignment-buttons button")];
  1735 | 		const buttonBounds = buttons.map((button) => button.getBoundingClientRect());
  1736 | 		const sizeControlsBounds = document.querySelector("#grid-shape-size-row").getBoundingClientRect();
  1737 | 		const buttonStyles = buttons.map((button) => getComputedStyle(button));
  1738 | 		return {
  1739 | 			leftInset: buttonBounds[0].left - menu.left,
  1740 | 			gaps: buttonBounds.slice(1, 3).map((bounds, index) => bounds.left - buttonBounds[index].right),
  1741 | 			sizeControlsGap: sizeControlsBounds.left - buttonBounds[2].right,
  1742 | 			buttonHeights: buttonBounds.map((bounds) => bounds.height),
  1743 | 			buttonTops: buttonBounds.map((bounds) => bounds.top),
  1744 | 			buttonBottoms: buttonBounds.map((bounds) => bounds.bottom),
  1745 | 			buttonWidths: buttonBounds.map((bounds) => bounds.width),
  1746 | 			fontSizes: buttonStyles.map((styles) => styles.fontSize),
  1747 | 			backgroundColors: buttonStyles.map((styles) => styles.backgroundColor),
  1748 | 			borderRadii: buttonStyles.map((styles) => styles.borderRadius),
  1749 | 			shadows: buttonStyles.map((styles) => styles.boxShadow),
  1750 | 			referenceHeight: reference.getBoundingClientRect().height,
  1751 | 			referenceBorderRadius: referenceStyles.borderRadius,
  1752 | 			referenceShadow: referenceStyles.boxShadow,
  1753 | 		};
  1754 | 	});
  1755 | 	expect(gridAlignmentLayout.leftInset).toBe(16);
  1756 | 	expect(gridAlignmentLayout.gaps).toEqual([16, 16]);
  1757 | 	expect(gridAlignmentLayout.sizeControlsGap).toBe(16);
  1758 | 	expect(gridAlignmentLayout.buttonHeights).toEqual(Array(9).fill(24));
  1759 | 	expect(gridAlignmentLayout.fontSizes).toEqual(Array(9).fill("12px"));
  1760 | 	expect(new Set(gridAlignmentLayout.buttonTops.slice(0, 3)).size).toBe(1);
  1761 | 	expect(gridAlignmentLayout.buttonTops[3]).toBe(gridAlignmentLayout.buttonBottoms[0] + 16);
  1762 | 	expect(gridAlignmentLayout.buttonTops[4]).toBe(gridAlignmentLayout.buttonTops[3]);
  1763 | 	expect(gridAlignmentLayout.buttonTops[5]).toBe(gridAlignmentLayout.buttonBottoms[3] + 16);
  1764 | 	expect(gridAlignmentLayout.buttonTops[6]).toBe(gridAlignmentLayout.buttonTops[5]);
  1765 | 	expect(gridAlignmentLayout.buttonTops[7]).toBe(gridAlignmentLayout.buttonBottoms[5] + 16);
  1766 | 	expect(gridAlignmentLayout.buttonTops[8]).toBe(gridAlignmentLayout.buttonTops[7]);
> 1767 | 	expect(new Set(gridAlignmentLayout.buttonWidths).size).toBe(1);
       |                                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  1768 | 	expect(gridAlignmentLayout.buttonWidths).toEqual(Array(9).fill(80));
  1769 | 	expect(gridAlignmentLayout.backgroundColors).toEqual(Array(9).fill("rgb(255, 48, 48)"));
  1770 | 	expect(gridAlignmentLayout.borderRadii).toEqual([
  1771 | 		gridAlignmentLayout.referenceBorderRadius,
  1772 | 		gridAlignmentLayout.referenceBorderRadius,
  1773 | 		gridAlignmentLayout.referenceBorderRadius,
  1774 | 		gridAlignmentLayout.referenceBorderRadius,
  1775 | 		gridAlignmentLayout.referenceBorderRadius,
  1776 | 		gridAlignmentLayout.referenceBorderRadius,
  1777 | 		gridAlignmentLayout.referenceBorderRadius,
  1778 | 		gridAlignmentLayout.referenceBorderRadius,
  1779 | 		gridAlignmentLayout.referenceBorderRadius,
  1780 | 	]);
  1781 | 	expect(gridAlignmentLayout.shadows).toEqual([
  1782 | 		gridAlignmentLayout.referenceShadow,
  1783 | 		gridAlignmentLayout.referenceShadow,
  1784 | 		gridAlignmentLayout.referenceShadow,
  1785 | 		gridAlignmentLayout.referenceShadow,
  1786 | 		gridAlignmentLayout.referenceShadow,
  1787 | 		gridAlignmentLayout.referenceShadow,
  1788 | 		gridAlignmentLayout.referenceShadow,
  1789 | 		gridAlignmentLayout.referenceShadow,
  1790 | 		gridAlignmentLayout.referenceShadow,
  1791 | 	]);
  1792 | 	const leftAlignmentButton = page.locator("#grid-alignment-left-button");
  1793 | 	const centerAlignmentButton = page.locator("#grid-alignment-center-button");
  1794 | 	const rightAlignmentButton = page.locator("#grid-alignment-right-button");
  1795 | 	const bottomAlignmentButton = page.locator("#grid-alignment-bottom-button");
  1796 | 	const topAlignmentButton = page.locator("#grid-alignment-top-button");
  1797 | 	const bottomLeftAlignmentButton = page.locator("#grid-alignment-bottom-left-button");
  1798 | 	const bottomRightAlignmentButton = page.locator("#grid-alignment-bottom-right-button");
  1799 | 	const topLeftAlignmentButton = page.locator("#grid-alignment-top-left-button");
  1800 | 	const topRightAlignmentButton = page.locator("#grid-alignment-top-right-button");
  1801 | 	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1802 | 	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1803 | 	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1804 | 	await expect(bottomAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1805 | 	await expect(topAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1806 | 	await expect(bottomLeftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1807 | 	await expect(bottomRightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1808 | 	await expect(topLeftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1809 | 	await expect(topRightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1810 | 	await leftAlignmentButton.click();
  1811 | 	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "true");
  1812 | 	await expect(leftAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
  1813 | 	await expect(leftAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  1814 | 	expect(await leftAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow)).toContain(
  1815 | 		"rgba(0, 255, 64, 0.85)",
  1816 | 	);
  1817 | 	await expect(leftAlignmentButton).toHaveText("Left");
  1818 | 	await centerAlignmentButton.click();
  1819 | 	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1820 | 	await expect(leftAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  1821 | 	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "true");
  1822 | 	await expect(centerAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
  1823 | 	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  1824 | 	expect(await centerAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow)).toContain(
  1825 | 		"rgba(0, 255, 64, 0.85)",
  1826 | 	);
  1827 | 	await expect(centerAlignmentButton).toHaveText("Center");
  1828 | 	await rightAlignmentButton.click();
  1829 | 	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1830 | 	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  1831 | 	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "true");
  1832 | 	await expect(rightAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
  1833 | 	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  1834 | 	expect(await rightAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow)).toContain(
  1835 | 		"rgba(0, 255, 64, 0.85)",
  1836 | 	);
  1837 | 	await expect(rightAlignmentButton).toHaveText("Right");
  1838 | 	await rightAlignmentButton.click();
  1839 | 	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  1840 | 	await expect(rightAlignmentButton).toHaveCSS("transform", "none");
  1841 | 	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  1842 | 	const applyToMarginsButton = page.locator("#grid-apply-to-margins-button");
  1843 | 	const rowsAmount = page.locator("#grid-rows-amount");
  1844 | 	const columnsAmount = page.locator("#grid-columns-amount");
  1845 | 	const gridShapesList = page.locator("#grid-menu-shapes-list");
  1846 | 	const gridShapeCommitButton = page.locator("#grid-sides-commit-button");
  1847 | 	await expect(page.locator("#grid-sides-label, #grid-sides-input")).toHaveCount(0);
  1848 | 	const gridShapeCommitLayout = await page.evaluate(() => {
  1849 | 		const list = document.querySelector("#grid-menu-shapes-list").getBoundingClientRect();
  1850 | 		const button = document.querySelector("#grid-sides-commit-button").getBoundingClientRect();
  1851 | 		return {
  1852 | 			centerOffset: button.left + button.width / 2 - (list.left + list.width / 2),
  1853 | 			topGap: button.top - list.bottom,
  1854 | 		};
  1855 | 	});
  1856 | 	expect(gridShapeCommitLayout.centerOffset).toBeCloseTo(0, 0);
  1857 | 	expect(gridShapeCommitLayout.topGap).toBe(16);
  1858 | 	const gridHeadingLayout = await page.evaluate(() => {
  1859 | 		const menu = document.querySelector("#text-editor-grid-menu");
  1860 | 		const alignment = document.querySelector("#grid-menu-alignment-heading");
  1861 | 		const lines = document.querySelector("#grid-menu-lines-heading");
  1862 | 		const shapes = document.querySelector("#grid-menu-shapes-heading");
  1863 | 		const size = document.querySelector("#grid-menu-size-heading");
  1864 | 		const sizeDimensions = document.querySelector("#grid-shape-size-row");
  1865 | 		const commit = document.querySelector("#grid-sides-commit-button");
  1866 | 		const alignmentStyles = getComputedStyle(alignment);
  1867 | 		const linesStyles = getComputedStyle(lines);
```