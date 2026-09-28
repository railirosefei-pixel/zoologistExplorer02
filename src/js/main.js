import { createApp } from "vue";

import App from "../App.vue";
import "../css/input.css";

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
		const button = event.target.closest("button");
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
		const button = event.target.closest("button");
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
