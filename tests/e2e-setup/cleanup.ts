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

	// Handle JS dialogs (e.g. beforeunload on app close) explicitly.
	// Playwright's implicit auto-dismiss races with Obsidian closing its own
	// dialogs ("No dialog is showing" protocol error), which hangs teardown.
	const handleDialogs = (page) => {
		page.on("dialog", (dialog) => dialog.accept().catch(() => {}));
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

test("Unregister test vault", async () => {
	let window = await app.firstWindow();

	// Open the vault chooser. The command is executed by its stable id
	// because its palette name changed across Obsidian versions
	// ("Open another vault" -> "Manage vaults...").
	// Wait until the command is registered; the commands registry exists
	// before individual commands are added during workspace init.
	await window.waitForFunction(
		() =>
			// @ts-expect-error app is a global in the Obsidian renderer
			window.app?.commands?.findCommand?.("app:open-vault") != null,
	);
	const executed = await window.evaluate(() => {
		// @ts-expect-error app is a global in the Obsidian renderer
		return window.app.commands.executeCommandById("app:open-vault");
	});
	expect(executed, "app:open-vault command should exist").toBe(true);

	// Wait for the vault chooser window. Polling app.windows() instead of
	// waitForEvent("window") avoids the race where the window opens before
	// the event listener is registered. On failure the assertion message
	// shows the URLs of all windows that actually exist.
	await expect
		.poll(() => JSON.stringify(app.windows().map((w) => w.url())), {
			timeout: 30000,
		})
		.toContain("starter");
	window = app.windows().find((w) => w.url().includes("starter"))!;

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
