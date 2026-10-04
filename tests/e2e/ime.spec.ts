import test, { type ElectronApplication, expect } from "@playwright/test";
import {
	closeObsidian,
	launchObsidian,
	settleVaultWindow,
} from "../support/obsidian";

let app: ElectronApplication;

test.beforeEach(async () => {
	app = await launchObsidian();
});

test.afterEach(async () => {
	if (app) await closeObsidian(app);
});

test("IME の変換確定の Enter ではファイルを開かない", async () => {
	const window = await app.firstWindow();
	await settleVaultWindow(app, window);

	// CardViewSwitcherを開く
	await window.getByLabel("Open command palette", { exact: true }).click();
	const commandPalette = window.locator(":focus");
	await commandPalette.fill("card view switcher");
	await commandPalette.press("Enter");

	const switcher = window.locator(".card-view-switcher-modal");
	await expect(switcher).toBeVisible();
	const input = switcher.locator(".prompt-input");
	await input.fill("'hoge");
	await expect(window.getByRole("button", { name: "hoge" })).toBeVisible();

	// IME の変換を確定する Enter。Chromium では isComposing が true、keyCode が 229 になる
	await input.evaluate((el) => {
		el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
		el.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "Enter",
				code: "Enter",
				keyCode: 229,
				isComposing: true,
				bubbles: true,
				cancelable: true,
			}),
		);
		el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
	});

	// switcher は開いたまま
	await expect(switcher).toBeVisible();
	await expect(input).toBeFocused();

	// 変換中でない Enter ではファイルを開く
	await window.keyboard.press("Enter");
	await expect(switcher).toHaveCount(0);
	await expect
		.poll(() =>
			window.evaluate(
				// biome-ignore lint/suspicious/noExplicitAny: Obsidian internal API
				() => (globalThis as any).app.workspace.getActiveFile()?.basename,
			),
		)
		.toBe("hoge");
});
