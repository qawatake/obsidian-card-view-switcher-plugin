import { expect, type Page } from "@playwright/test";

export const PLUGIN_ID = "obsidian-card-view-switcher-plugin";

type ObsidianGlobal = {
	app?: { plugins?: { plugins?: Record<string, unknown> } };
};

/**
 * Bring a freshly opened vault window to a quiet state: the plugin is loaded
 * and no modal is open. Call it before the first interaction.
 *
 * On startup Obsidian either loads the community plugins, or, when the vault
 * is not trusted yet (`enable-plugin-<appId>` missing from localStorage), shows
 * the "Do you trust the author of this vault?" prompt instead. Clicking
 * "Trust author and enable plugins" closes that prompt at once, but the click
 * handler then awaits `plugins.setEnable(true)` and only afterwards opens
 * Settings > Community plugins as another modal. Anything done between the
 * two (opening the quick switcher, an evaluate) races with that modal, so wait
 * for it explicitly, close it, and only then hand the window back.
 */
export async function settleVaultWindow(page: Page, pluginId = PLUGIN_ID) {
	page.on("pageerror", (e) => console.log(`[diag] pageerror ${e.stack ?? e}`));
	page.on("console", (m) => {
		if (m.type() === "error" || m.type() === "warning")
			console.log(`[diag] console.${m.type()} ${m.text().slice(0, 300)}`);
	});
	// The two startup outcomes are exclusive: the prompt is shown instead of
	// loading plugins, so one of them always becomes true.
	await page.waitForFunction(
		(id) =>
			document.querySelector(".modal.mod-trust-folder") !== null ||
			!!(globalThis as ObsidianGlobal).app?.plugins?.plugins?.[id],
		pluginId,
	);

	const trustPrompt = page.locator(".modal.mod-trust-folder");
	if ((await trustPrompt.count()) > 0) {
		console.log("[e2e] vault trust prompt shown at startup, trusting");
		await trustPrompt
			.getByRole("button", { name: "Trust author and enable plugins" })
			.click();
		// DIAG (temporary): trace modal state after the click
		for (let i = 0; i < 12; i++) {
			const st = await page
				.evaluate((id) => {
					const g = globalThis as ObsidianGlobal & {
						app?: { setting?: { containerEl?: HTMLElement } };
					};
					return JSON.stringify({
						t: Math.round(performance.now()),
						modals: Array.from(
							document.querySelectorAll(".modal-container"),
						).map(
							(c) =>
								`${c.className} > ${c.querySelector(".modal")?.className}`,
						),
						settingConnected: !!g.app?.setting?.containerEl?.isConnected,
						plugin: !!g.app?.plugins?.plugins?.[id],
						active: document.activeElement?.className,
					});
				}, pluginId)
				.catch((e) => `ERR ${e}`);
			console.log(`[diag] ${i} ${st}`);
			await page.waitForTimeout(250);
		}
		console.log(
			`[diag] hasPhysicalKeyboard=${await page.evaluate(() => {
				const p = (globalThis as unknown as { Platform?: { hasPhysicalKeyboard?: boolean } }).Platform;
				return String(p?.hasPhysicalKeyboard);
			})}`,
		);
	}

	const modal = page.locator(".modal-container");
	if ((await modal.count()) > 0) {
		const text = (await modal.first().innerText())
			.replace(/\s+/g, " ")
			.slice(0, 200);
		console.log(`[e2e] unexpected modal open at startup, closing: ${text}`);
		await page.keyboard.press("Escape");
	}
	await expect(modal).toHaveCount(0);

	await page.waitForFunction(
		(id) => !!(globalThis as ObsidianGlobal).app?.plugins?.plugins?.[id],
		pluginId,
	);
}
