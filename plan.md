- **Read `C:\zoologistExplorer02\rules\copilot-rules.md`**

- Avoid embedding unescaped JS/JSDoc text in one PowerShell string and instead run separate parser-safe checks.

- Make sure that you write the code in a way that makes adding, subtracting, and editing simple and seamless so that adding functionality, buttons, menus, screens, assets and everything else in the program is a simple process.

- Make sure that front-end pipelines are being created often, so that if there's an error it will be extremely simple to find exactly where that error is. I want everything perfectly organized and labeled to avoid any confusion for debugging or adding functionality.

- After each meaningful batch of authorized edits, run only the checks relevant to that batch after their safety and consent gates have passed. Record unavailable, blocked, or unauthorized checks as `not run` or `blocked`; never treat them as passes.

- IMPORTANT Follow the plan 1 step at a time

- Whenever a consistency check involving the investigation of stale, unused, duplicate, or contradictory code is run against the program, do not include the "assets" folder in the check. Do not remove the assets directory or anything contained within it

- Only post text of any kind in reports/acuteIssues when explicitly instructed to do so. When instructed to post reports inside the acuteIssues file, do so in the following manner: Post your Hypothesis' first and enumerate them if there are more than one. Underneath each hypothesis, write the potential fixes for that hypothesis and use capitalized alphabetical enumeration for the fixes

1.) I want the following behavior to apply only to the September 1 2026 day box:

    A.) I want the button underneath the C:\zoologistExplorer02\assets\textures\minecraftTNT.webp texture to be completely unactivated to where it is unclickable until after the explosion animation has completed entirely

    B.) After the explosion animation has completed, I want the button to become clickable

    C.) When clicked, I want the button underneath to lead to a Daily menu

    D.) I want the Daily menu to be the same exact size and shape as the calendar, itself.

    E.) I want the Daily menu to replace the calendar white it is activated.

    F.) I want there to be a functional "Back" button in the upper-right hand corner of the Daily menu