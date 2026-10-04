import { defineConfig } from "@playwright/test";

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
	// Each test runs its own Obsidian on its own vault copy and user data dir
	// (tests/support/obsidian.ts), so tests can run side by side.
	fullyParallel: true,
	forbidOnly: !!process.env["CI"],
	use: {
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "e2e",
			testDir: "./tests/e2e",
		},
	],
	timeout: 300 * 1000,
});
