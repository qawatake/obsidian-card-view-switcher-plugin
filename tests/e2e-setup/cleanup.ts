import test, {
	expect,
	type ElectronApplication,
	_electron as electron,
} from "@playwright/test";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const appPath = path.resolve("./.obsidian-unpacked/main.js");
const vaultPath = path.resolve("./tests/test-vault");

let app: ElectronApplication;

test.beforeEach(async () => {
	await fs.rm(path.join(vaultPath, ".obsidian", "workspace.json"), {
		recursive: true,
		force: true,
	});

	app = await electron.launch({
		args: [
			appPath,
			"open",
			`obsidian://open?path=${encodeURIComponent(vaultPath)}`,
		],
	});
});

test.afterEach(async () => {
	await app?.close();
});

test("Unregister test vault", async () => {
	let window = await app.firstWindow();

	// Execute the "Open another vault" command
	{
		// Open the command palette
		await window
			.getByLabel("Open command palette", { exact: true })
			.click();

		// Input to the command palette
		const commandPalette = window.locator(":focus");
		await commandPalette.fill("open another vault");
		await commandPalette.press("Enter");
	}

	// Wait for the new window to open
	window = await app.waitForEvent("window", (w) =>
		w.url().includes("starter")
	);

	// Close the originally opened window
	{
		const originalWindow = app
			.windows()
			.find((w) => !w.url().includes("starter"));
		await originalWindow?.close();
	}

	// Remove the registered vault
	{
		await window
			.getByLabel(vaultPath)
			.getByLabel("More options", { exact: true })
			.click();
		await window.getByText("Remove from list").click();
	}
});
