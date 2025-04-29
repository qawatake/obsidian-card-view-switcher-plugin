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
		args: [appPath, "open"],
	});
});

test.afterEach(async () => {
	await app?.close();
});

test("Set up test vault to make plugin ready to use when Obsidian opens", async () => {
	let window = await app.firstWindow();

	// Wait for 'did-finish-load' event on Obsidian side
	await window.waitForEvent("domcontentloaded");

	// Stub the file picker
	await app.evaluate(async ({ dialog }, fakePath) => {
		dialog.showOpenDialogSync = () => {
			return [fakePath];
		};
	}, vaultPath);

	const openButton = window.getByRole("button", { name: "Open" });
	await openButton.click();

	// Reload the window
	window = await app.waitForEvent("window");

	// Trust the author of the vault
	await window
		.getByRole("button", { name: "Trust author and enable plugins" })
		.click();

	// Close a modal for community plugins
	await window.keyboard.press("Escape");
});
