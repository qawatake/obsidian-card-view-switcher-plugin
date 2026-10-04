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

/** How far the preview content has moved up inside the preview modal. */
async function previewScrollOffset(window: Page): Promise<number> {
	return window.evaluate(() => {
		const modal = document.querySelector(".modal-container .modal");
		const content = modal?.querySelector(".content-container");
		if (!modal || !content) throw new Error("preview modal not found");
		return (
			modal.getBoundingClientRect().top - content.getBoundingClientRect().top
		);
	});
}

/** The scroll offset once the preview has stopped moving. */
async function settledScrollOffset(window: Page): Promise<number> {
	let last = await previewScrollOffset(window);
	for (;;) {
		await window.waitForTimeout(200);
		const current = await previewScrollOffset(window);
		if (Math.abs(current - last) < 1) return current;
		last = current;
	}
}

for (const { name, down, up } of [
	{ name: "↓ / ↑", down: "ArrowDown", up: "ArrowUp" },
	{ name: "Ctrl+N / Ctrl+P", down: "Control+n", up: "Control+p" },
]) {
	test(`preview を開いたあと ${name} でスクロールできる`, async () => {
		const window = await app.firstWindow();
		await settleVaultWindow(app, window);

		// CardViewSwitcherを開く
		await window.getByLabel("Open command palette", { exact: true }).click();
		const commandPalette = window.locator(":focus");
		await commandPalette.fill("card view switcher");
		await commandPalette.press("Enter");

		const cardViewSwitcher = window.locator(":focus");
		// 先頭の ' でファイル名検索モードにする
		await cardViewSwitcher.fill("'long-note");
		await expect(
			window.getByRole("button", { name: "long-note" }),
		).toBeVisible();

		// preview を開く
		await window.keyboard.press("Control+Space");
		await expect(
			window.locator(".modal-container .modal .content-container"),
		).toContainText("line 1");

		// 中身のレイアウトが終わり、preview がスクロールできるようになるのを待つ
		await expect
			.poll(() =>
				window.evaluate(() => {
					const modal = document.querySelector(".modal-container .modal");
					return modal ? modal.scrollHeight - modal.clientHeight : 0;
				}),
			)
			.toBeGreaterThan(1000);

		const initial = await previewScrollOffset(window);

		for (let i = 0; i < 5; i++) {
			await window.keyboard.press(down);
		}
		await expect
			.poll(() => previewScrollOffset(window), {
				message: `${down} should scroll the preview down`,
			})
			.toBeGreaterThan(initial + 100);
		// スクロールは smooth なので、止まるのを待ってから戻りの基準位置を取る
		const scrolled = await settledScrollOffset(window);

		for (let i = 0; i < 5; i++) {
			await window.keyboard.press(up);
		}
		await expect
			.poll(() => previewScrollOffset(window), {
				message: `${up} should scroll the preview up`,
			})
			.toBeLessThan(scrolled - 100);
		// 下と同じ回数だけ上に送ると先頭に戻る。キーが preview 内の editor に
		// 届くと、cursor が動いて scrollIntoView され、スクロールが途中で止まる
		await expect
			.poll(() => settledScrollOffset(window), {
				message: `${up} should scroll back to where ${down} started`,
			})
			.toBeCloseTo(initial, 0);
	});
}
