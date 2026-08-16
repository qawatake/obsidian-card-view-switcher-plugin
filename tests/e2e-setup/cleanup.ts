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

	// Open the vault chooser. The command is executed by its stable id
	// because its palette name changed across Obsidian versions
	// ("Open another vault" -> "Manage vaults...").
	await window.evaluate(() => {
		// @ts-expect-error app is a global in the Obsidian renderer
		window.app.commands.executeCommandById("app:open-vault");
	});

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
