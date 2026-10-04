import test, { type ElectronApplication, expect, type Page } from "@playwright/test";
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

/** How far the element's content sticks out to the side of the element. */
async function horizontalOverflow(
	window: Page,
	selector: string,
): Promise<number> {
	return window.evaluate((selector) => {
		const el = document.querySelector(selector);
		if (!el) throw new Error(`${selector} not found`);
		return el.scrollWidth - el.clientWidth;
	}, selector);
}

test("preview は長い行・コードブロック・表があっても横にスクロールしない", async () => {
	const window = await app.firstWindow();
	await settleVaultWindow(app, window);

	// CardViewSwitcherを開く
	await window.getByLabel("Open command palette", { exact: true }).click();
	const commandPalette = window.locator(":focus");
	await commandPalette.fill("card view switcher");
	await commandPalette.press("Enter");

	const cardViewSwitcher = window.locator(":focus");
	// 先頭の ' でファイル名検索モードにする
	await cardViewSwitcher.fill("'wide-note");
	await expect(window.getByRole("button", { name: "wide-note" })).toBeVisible();

	// preview を開く
	await window.keyboard.press("Control+Space");
	await expect(
		window
			.locator(".modal-container .modal .content-container")
			.getByRole("table"),
	).toBeVisible();

	// preview のスクロール領域 (modal) も中身の入れ物も横にはみ出さない。
	// 幅の広いコードブロックや表は、それ自体の中で横にスクロールする。
	await expect
		.poll(() => horizontalOverflow(window, ".modal-container .modal"))
		.toBeLessThanOrEqual(0);
	expect(
		await horizontalOverflow(
			window,
			".modal-container .modal .content-container",
		),
	).toBeLessThanOrEqual(0);
});
