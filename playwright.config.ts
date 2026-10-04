import { defineConfig } from "@playwright/test";

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
	fullyParallel: false,
	// Only one Obsidian window can have the OS focus at a time, and a window
	// without it behaves differently (e.g. clicking a card leaves the focus in
	// the input), so tests that check the focus fail when run side by side.
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
	],
	timeout: 300 * 1000,
});
