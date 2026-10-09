# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> Text Editor navigation controls stay aligned with the New menu
- Location: tests\smoke.spec.js:2598:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 16
Received: 392.390625
```

# Page snapshot

```yaml
- main "Parent screen" [ref=e3]:
  - region "Text Editor menu" [ref=e4]:
    - navigation "Text Editor navigation" [ref=e5]:
      - button "Load" [ref=e6] [cursor=pointer]
      - button "New +" [pressed] [ref=e7] [cursor=pointer]
      - button "Tools" [pressed] [ref=e8] [cursor=pointer]
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
        - generic [ref=e19]:
          - generic [ref=e20]: Grid Applied
          - 'button "Grid Applied: On" [pressed] [ref=e21] [cursor=pointer]': "On"
        - generic [ref=e22]:
          - generic [ref=e23]: Apply to Margins
          - button "Off" [ref=e24] [cursor=pointer]
      - generic [ref=e25]:
        - generic [ref=e26]: Alignment
        - generic [ref=e27]: Shapes
        - generic [ref=e28]:
          - group [ref=e29]:
            - generic "Full Grid Alignment" [ref=e30]
            - group "Grid alignment" [ref=e31]:
              - generic [ref=e32]:
                - button "Left" [ref=e33] [cursor=pointer]
                - button "Center" [ref=e34] [cursor=pointer]
                - button "Right" [active] [ref=e35] [cursor=pointer]
              - generic [ref=e36]:
                - button "Top" [ref=e37] [cursor=pointer]
                - button "Top Left" [ref=e38] [cursor=pointer]
                - button "Top Right" [ref=e39] [cursor=pointer]
              - generic [ref=e40]:
                - button "Bottom" [ref=e41] [cursor=pointer]
                - button "Bottom Left" [ref=e42] [cursor=pointer]
                - button "Bottom Right" [ref=e43] [cursor=pointer]
              - button "Custom" [ref=e44] [cursor=pointer]
          - group [ref=e45]:
            - generic "Single Shape Alignment" [ref=e46]
            - group "Single shape actions" [ref=e47]:
              - button "Shape Removal" [ref=e48] [cursor=pointer]
              - button "Shape Addition" [ref=e52] [cursor=pointer]
              - button "Shape Swap" [ref=e55] [cursor=pointer]
              - group [ref=e58]:
                - generic "Shape Manipulation" [ref=e59]
          - group [ref=e60]:
            - generic "Grid Dimensions" [ref=e61]
            - generic [ref=e62]:
              - generic [ref=e63]:
                - generic [ref=e64]: Rows Amount
                - textbox "Rows Amount" [ref=e65]
              - generic [ref=e66]:
                - generic [ref=e67]: Columns Amount
                - textbox "Columns Amount" [ref=e68]
              - generic [ref=e69]: Size
              - generic [ref=e70]:
                - generic [ref=e71]: Width
                - textbox "Width" [ref=e72]
                - generic [ref=e73]: inches
                - generic [ref=e74]: Height
                - textbox "Height" [ref=e75]
                - generic [ref=e76]: inches
        - list "Shapes" [ref=e78]:
          - listitem [ref=e79]:
            - 'button "1 Side: Circle" [ref=e80] [cursor=pointer]'
          - listitem [ref=e81]:
            - 'button "3 Sides: Triangle" [ref=e82] [cursor=pointer]'
          - listitem [ref=e83]:
            - 'button "4 Sides: Quadrilateral" [ref=e84] [cursor=pointer]'
            - list "Quadrilateral grid shapes" [ref=e85]:
              - listitem [ref=e86]:
                - button "A.) Squares" [ref=e87] [cursor=pointer]
              - listitem [ref=e88]:
                - button "B.) Squares (Diamond)" [ref=e89] [cursor=pointer]
              - listitem [ref=e90]:
                - button "C.) Rectangles (Vertical)" [ref=e91] [cursor=pointer]
              - listitem [ref=e92]:
                - button "D.) Rectangles (Horizontal)" [ref=e93] [cursor=pointer]
          - listitem [ref=e94]:
            - 'button "5 Sides: Pentagon" [ref=e95] [cursor=pointer]'
          - listitem [ref=e96]:
            - 'button "6 Sides: Hexagon" [ref=e97] [cursor=pointer]'
          - listitem [ref=e98]:
            - 'button "7 Sides: Heptagon" [ref=e99] [cursor=pointer]'
          - listitem [ref=e100]:
            - 'button "8 Sides: Octagon" [ref=e101] [cursor=pointer]'
          - listitem [ref=e102]:
            - 'button "9 Sides: Nonagon" [ref=e103] [cursor=pointer]'
          - listitem [ref=e104]:
            - 'button "10 Sides: Decagon" [ref=e105] [cursor=pointer]'
          - listitem [ref=e106]:
            - 'button "11 Sides: Hendecagon" [ref=e107] [cursor=pointer]'
          - listitem [ref=e108]:
            - 'button "12 Sides: Dodecagon" [ref=e109] [cursor=pointer]'
          - listitem [ref=e110]:
            - 'button "13 Sides: Triskaidecagon" [ref=e111] [cursor=pointer]'
          - listitem [ref=e112]:
            - 'button "14 Sides: Tetradecagon" [ref=e113] [cursor=pointer]'
          - listitem [ref=e114]:
            - 'button "15 Sides: Pentadecagon" [ref=e115] [cursor=pointer]'
          - listitem [ref=e116]:
            - 'button "16 Sides: Hexadecagon" [ref=e117] [cursor=pointer]'
          - listitem [ref=e118]:
            - 'button "17 Sides: Heptadecagon" [ref=e119] [cursor=pointer]'
          - listitem [ref=e120]:
            - 'button "18 Sides: Octadecagon" [ref=e121] [cursor=pointer]'
          - listitem [ref=e122]:
            - 'button "19 Sides: Enneadecagon" [ref=e123] [cursor=pointer]'
          - listitem [ref=e124]:
            - 'button "20 Sides: Icosagon" [ref=e125] [cursor=pointer]'
          - listitem [ref=e126]:
            - 'button "21 Sides: Icosihenagon" [ref=e127] [cursor=pointer]'
          - listitem [ref=e128]:
            - 'button "22 Sides: Icosidigon" [ref=e129] [cursor=pointer]'
          - listitem [ref=e130]:
            - 'button "23 Sides: Icositrigon" [ref=e131] [cursor=pointer]'
          - listitem [ref=e132]:
            - 'button "24 Sides: Icositetragon" [ref=e133] [cursor=pointer]'
          - listitem [ref=e134]:
            - 'button "25 Sides: Icosipentagon" [ref=e135] [cursor=pointer]'
          - listitem [ref=e136]:
            - 'button "26 Sides: Icosihexagon" [ref=e137] [cursor=pointer]'
          - listitem [ref=e138]:
            - 'button "27 Sides: Icosiheptagon" [ref=e139] [cursor=pointer]'
          - listitem [ref=e140]:
            - 'button "28 Sides: Icosioctagon" [ref=e141] [cursor=pointer]'
          - listitem [ref=e142]:
            - 'button "29 Sides: Icosienneagon" [ref=e143] [cursor=pointer]'
          - listitem [ref=e144]:
            - 'button "30 Sides: Triacontagon" [ref=e145] [cursor=pointer]'
          - listitem [ref=e146]:
            - 'button "31 Sides: Triacontahenagon" [ref=e147] [cursor=pointer]'
          - listitem [ref=e148]:
            - 'button "32 Sides: Triacontadigon" [ref=e149] [cursor=pointer]'
          - listitem [ref=e150]:
            - 'button "33 Sides: Triacontatrigon" [ref=e151] [cursor=pointer]'
          - listitem [ref=e152]:
            - 'button "34 Sides: Triacontatetragon" [ref=e153] [cursor=pointer]'
          - listitem [ref=e154]:
            - 'button "35 Sides: Triacontapentagon" [ref=e155] [cursor=pointer]'
          - listitem [ref=e156]:
            - 'button "36 Sides: Triacontahexagon" [ref=e157] [cursor=pointer]'
          - listitem [ref=e158]:
            - 'button "37 Sides: Triacontaheptagon" [ref=e159] [cursor=pointer]'
          - listitem [ref=e160]:
            - 'button "38 Sides: Triacontaoctagon" [ref=e161] [cursor=pointer]'
          - listitem [ref=e162]:
            - 'button "39 Sides: Triacontaenneagon" [ref=e163] [cursor=pointer]'
          - listitem [ref=e164]:
            - 'button "40 Sides: Tetracontagon" [ref=e165] [cursor=pointer]'
          - listitem [ref=e166]:
            - 'button "41 Sides: Tetracontahenagon" [ref=e167] [cursor=pointer]'
          - listitem [ref=e168]:
            - 'button "42 Sides: Tetracontadigon" [ref=e169] [cursor=pointer]'
          - listitem [ref=e170]:
            - 'button "43 Sides: Tetracontatrigon" [ref=e171] [cursor=pointer]'
          - listitem [ref=e172]:
            - 'button "44 Sides: Tetracontatetragon" [ref=e173] [cursor=pointer]'
          - listitem [ref=e174]:
            - 'button "45 Sides: Tetracontapentagon" [ref=e175] [cursor=pointer]'
          - listitem [ref=e176]:
            - 'button "46 Sides: Tetracontahexagon" [ref=e177] [cursor=pointer]'
          - listitem [ref=e178]:
            - 'button "47 Sides: Tetracontaheptagon" [ref=e179] [cursor=pointer]'
          - listitem [ref=e180]:
            - 'button "48 Sides: Tetracontaoctagon" [ref=e181] [cursor=pointer]'
          - listitem [ref=e182]:
            - 'button "49 Sides: Tetracontaenneagon" [ref=e183] [cursor=pointer]'
          - listitem [ref=e184]:
            - 'button "50 Sides: Pentacontagon" [ref=e185] [cursor=pointer]'
      - generic [ref=e186]: Lines
      - button "Printable" [pressed] [ref=e187] [cursor=pointer]
    - region "Editing tools" [ref=e188]:
      - generic [ref=e191]:
        - button "Size" [ref=e193] [cursor=pointer]
        - button "Margins" [ref=e194] [cursor=pointer]
        - button "Fonts" [ref=e195] [cursor=pointer]
        - button "Alignment" [ref=e196] [cursor=pointer]
```

# Test source

```ts
  2903 | 	]);
  2904 | 	const leftAlignmentButton = page.locator("#grid-alignment-left-button");
  2905 | 	const centerAlignmentButton = page.locator("#grid-alignment-center-button");
  2906 | 	const rightAlignmentButton = page.locator("#grid-alignment-right-button");
  2907 | 	const bottomAlignmentButton = page.locator("#grid-alignment-bottom-button");
  2908 | 	const topAlignmentButton = page.locator("#grid-alignment-top-button");
  2909 | 	const bottomLeftAlignmentButton = page.locator("#grid-alignment-bottom-left-button");
  2910 | 	const bottomRightAlignmentButton = page.locator("#grid-alignment-bottom-right-button");
  2911 | 	const topLeftAlignmentButton = page.locator("#grid-alignment-top-left-button");
  2912 | 	const topRightAlignmentButton = page.locator("#grid-alignment-top-right-button");
  2913 | 	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2914 | 	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2915 | 	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2916 | 	await expect(bottomAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2917 | 	await expect(topAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2918 | 	await expect(bottomLeftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2919 | 	await expect(bottomRightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2920 | 	await expect(topLeftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2921 | 	await expect(topRightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2922 | 	await leftAlignmentButton.click();
  2923 | 	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "true");
  2924 | 	await expect(leftAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
  2925 | 	await expect(leftAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  2926 | 	expect(
  2927 | 		await leftAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow),
  2928 | 	).toContain("rgba(0, 255, 64, 0.85)");
  2929 | 	await expect(leftAlignmentButton).toHaveText("Left");
  2930 | 	await centerAlignmentButton.click();
  2931 | 	await expect(leftAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2932 | 	await expect(leftAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  2933 | 	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "true");
  2934 | 	await expect(centerAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
  2935 | 	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  2936 | 	expect(
  2937 | 		await centerAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow),
  2938 | 	).toContain("rgba(0, 255, 64, 0.85)");
  2939 | 	await expect(centerAlignmentButton).toHaveText("Center");
  2940 | 	await rightAlignmentButton.click();
  2941 | 	await expect(centerAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2942 | 	await expect(centerAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  2943 | 	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "true");
  2944 | 	await expect(rightAlignmentButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
  2945 | 	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  2946 | 	expect(
  2947 | 		await rightAlignmentButton.evaluate((button) => getComputedStyle(button).boxShadow),
  2948 | 	).toContain("rgba(0, 255, 64, 0.85)");
  2949 | 	await expect(rightAlignmentButton).toHaveText("Right");
  2950 | 	await rightAlignmentButton.click();
  2951 | 	await expect(rightAlignmentButton).toHaveAttribute("aria-pressed", "false");
  2952 | 	await expect(rightAlignmentButton).toHaveCSS("transform", "none");
  2953 | 	await expect(rightAlignmentButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  2954 | 	const applyToMarginsButton = page.locator("#grid-apply-to-margins-button");
  2955 | 	const rowsAmount = page.locator("#grid-rows-amount");
  2956 | 	const columnsAmount = page.locator("#grid-columns-amount");
  2957 | 	await expect(rowsAmount).toBeVisible();
  2958 | 	await expect(columnsAmount).toBeVisible();
  2959 | 	const amountInputEdges = await page.evaluate(() => {
  2960 | 		const rows = document.querySelector("#grid-rows-amount").getBoundingClientRect();
  2961 | 		const columns = document.querySelector("#grid-columns-amount").getBoundingClientRect();
  2962 | 		return {
  2963 | 			rowsLeft: rows.left,
  2964 | 			rowsRight: rows.right,
  2965 | 			columnsLeft: columns.left,
  2966 | 			columnsRight: columns.right,
  2967 | 		};
  2968 | 	});
  2969 | 	expect(amountInputEdges.rowsLeft).toBe(amountInputEdges.columnsLeft);
  2970 | 	expect(amountInputEdges.rowsRight).toBe(amountInputEdges.columnsRight);
  2971 | 	const gridShapesList = page.locator("#grid-menu-shapes-list");
  2972 | 	await expect(page.locator("#grid-sides-label, #grid-sides-input")).toHaveCount(0);
  2973 | 	const gridHeadingLayout = await page.evaluate(() => {
  2974 | 		const menu = document.querySelector("#text-editor-grid-menu");
  2975 | 		const alignment = document.querySelector("#grid-menu-alignment-heading");
  2976 | 		const lines = document.querySelector("#grid-menu-lines-heading");
  2977 | 		const shapes = document.querySelector("#grid-menu-shapes-heading");
  2978 | 		const size = document.querySelector("#grid-menu-size-heading");
  2979 | 		const sizeDimensions = document.querySelector("#grid-shape-size-row");
  2980 | 		const dimensionsDropdown = document.querySelector("#grid-menu-dimensions-dropdown");
  2981 | 		const alignmentStyles = getComputedStyle(alignment);
  2982 | 		const linesStyles = getComputedStyle(lines);
  2983 | 		const menuLeft = menu.getBoundingClientRect().left;
  2984 | 		return {
  2985 | 			linesLeftOffset: lines.getBoundingClientRect().left - menuLeft,
  2986 | 			shapesLeftOffset: shapes.getBoundingClientRect().left - menuLeft,
  2987 | 			sizeDimensionsGap:
  2988 | 				sizeDimensions.getBoundingClientRect().top - size.getBoundingClientRect().bottom,
  2989 | 			sizeHeadingInsideDimensions:
  2990 | 				size.closest("#grid-menu-dimensions-dropdown") === dimensionsDropdown,
  2991 | 			sizeControlsInsideDimensions:
  2992 | 				sizeDimensions.closest("#grid-menu-dimensions-dropdown") === dimensionsDropdown,
  2993 | 			shapesGap: shapes.getBoundingClientRect().top - size.getBoundingClientRect().bottom,
  2994 | 			sizeText: size.textContent.trim(),
  2995 | 			linesTextAlign: linesStyles.textAlign,
  2996 | 			matchingStyle: ["color", "fontFamily", "fontSize", "fontWeight", "lineHeight"].every(
  2997 | 				(property) => alignmentStyles[property] === linesStyles[property],
  2998 | 			),
  2999 | 		};
  3000 | 	});
  3001 | 	expect(gridHeadingLayout.sizeText).toBe("Size");
  3002 | 	expect(gridHeadingLayout.linesLeftOffset).toBe(16);
> 3003 | 	expect(gridHeadingLayout.shapesLeftOffset).toBe(16);
       |                                             ^ Error: expect(received).toBe(expected) // Object.is equality
  3004 | 	expect(gridHeadingLayout.sizeDimensionsGap).toBe(16);
  3005 | 	expect(gridHeadingLayout.sizeHeadingInsideDimensions).toBe(true);
  3006 | 	expect(gridHeadingLayout.sizeControlsInsideDimensions).toBe(true);
  3007 | 	expect(gridHeadingLayout.shapesGap).toBeGreaterThan(0);
  3008 | 	expect(gridHeadingLayout.linesTextAlign).toBe("left");
  3009 | 	expect(gridHeadingLayout.matchingStyle).toBe(true);
  3010 | 	await expect(gridAppliedButton).toHaveText("On");
  3011 | 	await expect(gridAppliedButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  3012 | 	const gridPrintableButton = page.locator("#grid-menu-printable-button");
  3013 | 	await expect(gridPrintableButton).toHaveText("Printable");
  3014 | 	await expect(gridPrintableButton).toHaveAttribute("aria-pressed", "true");
  3015 | 	await expect(gridPrintableButton).toHaveCSS("background-color", "rgb(0, 255, 64)");
  3016 | 	const printableOnShadow = await gridPrintableButton.evaluate(
  3017 | 		(button) => getComputedStyle(button).boxShadow,
  3018 | 	);
  3019 | 	expect(printableOnShadow).toContain("rgba(0, 255, 64, 0.85)");
  3020 | 	await expect(gridPrintableButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 3)");
  3021 | 	await gridPrintableButton.click();
  3022 | 	await expect(gridPrintableButton).toHaveAttribute("aria-pressed", "false");
  3023 | 	await expect(gridPrintableButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  3024 | 	await expect(gridPrintableButton).toHaveCSS("box-shadow", "none");
  3025 | 	await gridPrintableButton.click();
  3026 | 	await expect(gridPrintableButton).toHaveAttribute("aria-pressed", "true");
  3027 | 	await expect(applyToMarginsButton).toHaveText("Off");
  3028 | 	await expect(applyToMarginsButton).toHaveCSS("background-color", "rgb(255, 48, 48)");
  3029 | 	await expect(rowsAmount).toHaveAttribute("maxlength", "3");
  3030 | 	await expect(columnsAmount).toHaveAttribute("maxlength", "3");
  3031 | 	await expect(rowsAmount).toHaveAttribute("inputmode", "numeric");
  3032 | 	await expect(columnsAmount).toHaveAttribute("inputmode", "numeric");
  3033 | 	const gridShapeWidthInput = page.locator("#grid-shape-width-input");
  3034 | 	await expect(gridShapeWidthInput).toHaveAttribute("maxlength", "4");
  3035 | 	await expect(gridShapeWidthInput).toHaveAttribute("inputmode", "decimal");
  3036 | 	await expect(page.locator("#grid-shape-width-unit")).toHaveText("inches");
  3037 | 	const gridShapeHeightInput = page.locator("#grid-shape-height-input");
  3038 | 	await expect(gridShapeHeightInput).toHaveAttribute("maxlength", "4");
  3039 | 	await expect(gridShapeHeightInput).toHaveAttribute("inputmode", "decimal");
  3040 | 	await expect(page.locator("#grid-shape-height-unit")).toHaveText("inches");
  3041 | 	const gridDimensionTypographyMatches = await page.evaluate(() => {
  3042 | 		const reference = getComputedStyle(document.querySelector("#grid-rows-amount-label"));
  3043 | 		const properties = ["fontFamily", "fontSize", "fontWeight", "fontStyle"];
  3044 | 		return [
  3045 | 			"#grid-shape-width-label",
  3046 | 			"#grid-shape-width-unit",
  3047 | 			"#grid-shape-height-label",
  3048 | 			"#grid-shape-height-unit",
  3049 | 		].every((selector) => {
  3050 | 			const styles = getComputedStyle(document.querySelector(selector));
  3051 | 			return properties.every((property) => styles[property] === reference[property]);
  3052 | 		});
  3053 | 	});
  3054 | 	expect(gridDimensionTypographyMatches).toBe(true);
  3055 | 	await gridShapeHeightInput.fill("2a.3");
  3056 | 	await expect(gridShapeHeightInput).toHaveValue("2.3");
  3057 | 	const gridDimensionLayout = await page.evaluate(() => {
  3058 | 		const rowsInput = document.querySelector("#grid-rows-amount").getBoundingClientRect();
  3059 | 		const columnsInput = document.querySelector("#grid-columns-amount").getBoundingClientRect();
  3060 | 		const sizeHeading = document
  3061 | 			.querySelector("#grid-menu-size-heading")
  3062 | 			.getBoundingClientRect();
  3063 | 		const itemBounds = [
  3064 | 			"#grid-shape-width-label",
  3065 | 			"#grid-shape-width-input",
  3066 | 			"#grid-shape-width-unit",
  3067 | 			"#grid-shape-height-label",
  3068 | 			"#grid-shape-height-input",
  3069 | 			"#grid-shape-height-unit",
  3070 | 		].map((selector) => document.querySelector(selector).getBoundingClientRect());
  3071 | 		const widthRow = itemBounds.slice(0, 3);
  3072 | 		const heightRow = itemBounds.slice(3, 6);
  3073 | 		return {
  3074 | 			widthRowHasReadableGaps: widthRow.every(
  3075 | 				(bounds, index) => index === 0 || bounds.left - widthRow[index - 1].right >= 5,
  3076 | 			),
  3077 | 			heightRowHasReadableGaps: heightRow.every(
  3078 | 				(bounds, index) => index === 0 || bounds.left - heightRow[index - 1].right >= 5,
  3079 | 			),
  3080 | 			rowsToColumnsGap: columnsInput.top - rowsInput.bottom,
  3081 | 			columnsToSizeHeadingGap: sizeHeading.top - columnsInput.bottom,
  3082 | 			sizeHeadingToWidthGap:
  3083 | 				Math.min(...widthRow.map((bounds) => bounds.top)) - sizeHeading.bottom,
  3084 | 			verticalGap:
  3085 | 				Math.min(...heightRow.map((bounds) => bounds.top)) -
  3086 | 				Math.max(...widthRow.map((bounds) => bounds.bottom)),
  3087 | 			widthHeightInputsAligned:
  3088 | 				itemBounds[1].left === itemBounds[4].left &&
  3089 | 				itemBounds[1].right === itemBounds[4].right,
  3090 | 		};
  3091 | 	});
  3092 | 	expect(gridDimensionLayout.widthRowHasReadableGaps).toBe(true);
  3093 | 	expect(gridDimensionLayout.heightRowHasReadableGaps).toBe(true);
  3094 | 	expect(gridDimensionLayout.rowsToColumnsGap).toBe(16);
  3095 | 	expect(gridDimensionLayout.columnsToSizeHeadingGap).toBe(16);
  3096 | 	expect(gridDimensionLayout.sizeHeadingToWidthGap).toBe(16);
  3097 | 	expect(gridDimensionLayout.verticalGap).toBe(16);
  3098 | 	expect(gridDimensionLayout.widthHeightInputsAligned).toBe(true);
  3099 | 	await gridShapeWidthInput.fill("1a.2");
  3100 | 	await expect(gridShapeWidthInput).toHaveValue("1.2");
  3101 | 	await gridShapeWidthInput.fill("1..2");
  3102 | 	await expect(gridShapeWidthInput).toHaveValue("1.2");
  3103 | 	await rowsAmount.fill("1");
```