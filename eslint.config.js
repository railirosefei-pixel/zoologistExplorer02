import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";

export default [
	{
		ignores: ["dist/**", "node_modules/**"],
	},
	js.configs.recommended,
	...pluginVue.configs["flat/recommended"],
	{
		files: ["**/*.{js,mjs,cjs,vue}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			"no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"vue/html-indent": ["warn", "tab"],
			"vue/html-self-closing": [
				"warn",
				{
					html: {
						void: "always",
					},
				},
			],
		},
	},
];
