import { defineConfig } from "@playwright/test";

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
	fullyParallel: false,
	// Each test launches its own Obsidian on the same vault and user data dir,
	// so two of them cannot run at the same time.
	workers: 1,
	forbidOnly: !!process.env["CI"],
	use: {
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "e2e",
			testDir: "./tests/e2e",
		},
		{
			name: "e2e-setup",
			testDir: "./tests/e2e-setup",
			testMatch: "**/*.ts",
		},
	],
	timeout: 300 * 1000,
});
