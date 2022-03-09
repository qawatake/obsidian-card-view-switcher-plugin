import { Switcher } from 'components/Switcher';
import { Plugin } from 'obsidian';
import {
	CardViewSwitcherSettingTab,
	DEFAULT_SETTINGS,
	type CardViewSwitcherSettings,
} from 'Setting';
import { deepMerge } from 'utils/Util';
import * as store from 'ui/store';

export default class CardViewSwitcherPlugin extends Plugin {
	settings: CardViewSwitcherSettings | undefined;
	private switcher: Switcher | undefined;

	override async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'card-view-switcher:open',
			name: 'Open switcher',
			callback: () => {
				this.renewSwitcher();
			},
		});

		this.addSettingTab(new CardViewSwitcherSettingTab(this.app, this));

		// set store values
		store.plugin.set(this);
		store.app.set(this.app);
	}

	// override onunload() {}
	async loadSettings() {
		this.settings = deepMerge(DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private renewSwitcher() {
		if (this.switcher) {
			this.removeChild(this.switcher);
		}
		this.switcher = this.addChild(new Switcher(this.app, this));
	}
}
