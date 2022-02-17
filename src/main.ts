import { Switcher } from 'components/Switcher';
import { Plugin } from 'obsidian';
import {
	CardViewSwitcherSettingTab,
	DEFAULT_SETTINGS,
	type CardViewSwitcherSettings,
} from 'Setting';
import { deepMerge } from 'utils/Util';

export default class CardViewSwitcherPlugin extends Plugin {
	settings: CardViewSwitcherSettings | undefined;

	override async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'card-view-switcher:open',
			name: 'Open switcher',
			callback: () => {
				this.addChild(new Switcher(this.app));
			},
		});

		this.addSettingTab(new CardViewSwitcherSettingTab(this.app, this));
	}

	// override onunload() {}
	async loadSettings() {
		this.settings = deepMerge(DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
