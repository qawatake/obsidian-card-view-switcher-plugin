import test, {
	expect,
	type ElectronApplication,
	_electron as electron,
} from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const appPath = path.resolve("./.obsidian-unpacked/main.js");
const vaultPath = path.resolve("./e2e-vault");

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

test("最近2番目に開いたファイルが含まれる", async () => {
	const window = await app.firstWindow();
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
