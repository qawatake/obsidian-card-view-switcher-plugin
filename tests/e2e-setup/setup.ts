import test, {
	type Dialog,
	expect,
	type ElectronApplication,
	type Page,
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

	// Handle JS dialogs (e.g. beforeunload on app close) explicitly.
	// Playwright's implicit auto-dismiss races with Obsidian closing its own
	// dialogs ("No dialog is showing" protocol error), which hangs teardown.
	const handleDialogs = (page: Page) => {
		page.on("dialog", (dialog: Dialog) => dialog.accept().catch(() => {}));
	};
	app.on("window", handleDialogs);
	for (const page of app.windows()) {
		handleDialogs(page);
	}
});

test.afterEach(async () => {
	if (!app) return;
	// app.close() can hang if Obsidian blocks shutdown, so bound it and
	// force-kill as a fallback. The process handle must be grabbed before
	// close(): a disposed ElectronApplication throws from process().
	const obsidianProcess = app.process();
	await Promise.race([
		app.close(),
		new Promise((resolve) => setTimeout(resolve, 15_000)),
	]);
	obsidianProcess.kill();
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

	// Turn off Obsidian's auto-updater for this (throw-away) install: CI must
	// test the version it downloaded, not whatever the updater fetches, and the
	// update flow must not pop UI over the tests. Persisted in the app config.
	const updatesDisabled = await window.evaluate(() =>
		require("electron").ipcRenderer.sendSync("disable-update", true),
	);
	expect(updatesDisabled).toBe(true);
});
