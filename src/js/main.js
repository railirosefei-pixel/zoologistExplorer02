import { createApp } from "vue";

import App from "../App.vue";
import "../css/input.css";

/**
 * Zoom lock: keep the app at 100% so pixel-based calibration stays trustworthy.
 * Browsers do not let pages block zoom via meta tags (desktop), so gesture,
 * ctrl+wheel, and keyboard zoom shortcuts are intercepted here.
 */
function installZoomLock() {
	document.addEventListener(
		"wheel",
		(event) => {
			if (event.ctrlKey) {
				event.preventDefault();
			}
		},
		{ passive: false },
	);

	document.addEventListener(
		"touchmove",
		(event) => {
			if (event.touches.length > 1) {
				event.preventDefault();
			}
		},
		{ passive: false },
	);
	document.addEventListener("gesturestart", (event) => event.preventDefault());
	document.addEventListener("gesturechange", (event) => event.preventDefault());

	document.addEventListener("keydown", (event) => {
		if (!event.ctrlKey && !event.metaKey) {
			return;
		}
		if (["=", "-", "+", "_", "0", ")"].includes(event.key)) {
			event.preventDefault();
		}
	});
}

installZoomLock();

const navButtonHeldClassNames = {
	home: "nav-button--held-home",
	back: "nav-button--held-back",
};

function getNavigationButtonKind(button) {
	const label = [
		button.textContent || "",
		button.getAttribute("aria-label") || "",
		button.getAttribute("title") || "",
		button.dataset.buttonName || "",
	].join(" ").toLowerCase();

	if (/home/.test(label) && !/back to/.test(label)) {
		return "home";
	}

	if (/back/.test(label)) {
		return "back";
	}

	return "";
}

function getNavigationButtonHeldClass(navButtonKind) {
	return navButtonHeldClassNames[navButtonKind] || "";
}

function attachNavigationButtonState() {
	document.addEventListener("pointerdown", (event) => {
		const button = event.target.closest("button");
		if (!button || event.button !== 0) {
			return;
		}

		const navButtonKind = getNavigationButtonKind(button);
		if (!navButtonKind) {
			return;
		}

		const heldClassName = getNavigationButtonHeldClass(navButtonKind);
		button.classList.add("nav-button");
		button.classList.remove("nav-button--pressed");
		if (heldClassName) {
			button.classList.add(heldClassName);
		}
	});

	document.addEventListener("pointerup", (event) => {
		const button = event.target.closest("button");
		if (!button || event.button !== 0) {
			return;
		}

		const navButtonKind = getNavigationButtonKind(button);
		if (!navButtonKind) {
			return;
		}

		const heldClassName = getNavigationButtonHeldClass(navButtonKind);
		button.classList.remove(heldClassName, "nav-button--pressed");
		button.classList.add("nav-button--pressed");
		window.clearTimeout(button.__navButtonPressResetTimer);
		button.__navButtonPressResetTimer = window.setTimeout(() => {
			button.classList.remove("nav-button--pressed");
		}, 180);
	});

	document.addEventListener("pointerleave", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}
		const button = target.closest("button");
		if (!button) {
			return;
		}

		const navButtonKind = getNavigationButtonKind(button);
		if (!navButtonKind) {
			return;
		}

		const heldClassName = getNavigationButtonHeldClass(navButtonKind);
		button.classList.remove(heldClassName);
	});

	document.addEventListener("pointercancel", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}
		const button = target.closest("button");
		if (!button) {
			return;
		}

		const navButtonKind = getNavigationButtonKind(button);
		if (!navButtonKind) {
			return;
		}

		const heldClassName = getNavigationButtonHeldClass(navButtonKind);
		button.classList.remove(heldClassName, "nav-button--pressed");
	});
}

/** Entry/mount pipeline boundary for the Vue application. */
function mountApplication() {
	attachNavigationButtonState();
	createApp(App).mount("#app");
}

mountApplication();
