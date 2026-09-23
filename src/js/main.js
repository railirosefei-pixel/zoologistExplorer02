import { createApp } from "vue";

import App from "../App.vue";
import "../css/input.css";

/** Entry/mount pipeline boundary for the Vue application. */
function mountApplication() {
	createApp(App).mount("#app");
}

mountApplication();
