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

test("最近2番目に開いたファイルが含まれる", async () => {
	const window = await app.firstWindow();
	// 起動時の modal (vault の信頼確認など) を片付け、plugin の読み込みを待つ
	await settleVaultWindow(app, window);
	// ファイルhogeを開く
	{
		// Quick switcherを開く
		await window.getByLabel("Open quick switcher", { exact: true }).click();
		const quickSwitcher = window.locator(":focus");
		// Quick switcherに入力
		await quickSwitcher.fill("hoge");
		await quickSwitcher.press("Enter");
	}
	// ファイルfugaを開く
	{
		// Quick switcherを開く
		await window.getByLabel("Open quick switcher", { exact: true }).click();
		const quickSwitcher = window.locator(":focus");
		// Quick switcherに入力
		await quickSwitcher.fill("fuga");
		await quickSwitcher.press("Enter");
	}

	// CardViewSwitcherを開く
	{
		// コマンドパレットを開く
		await window
			.getByLabel("Open command palette", { exact: true })
			.click();

		// コマンドパレットに入力
		const commandPalette = window.locator(":focus");
		await commandPalette.fill("card view switcher");
		await commandPalette.press("Enter");
	}

	// card view switcherにhogeを入力
	const cardViewSwitcher = window.locator(":focus");
	await cardViewSwitcher.fill("hoge");

	// カードをクリック
	await window.getByRole("button", { name: "hoge" }).click();

	// カードにフォーカスが当たり、カードの内容が表示される
	const focused = window.locator(":focus");
	await expect(focused).toContainText("hogehoge");
});
