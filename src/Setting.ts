import type CardViewSwitcherPlugin from 'main';
import { App, Notice, PluginSettingTab, type Hotkey } from 'obsidian';
import { HotkeySetter } from 'ui/HotkeySetter';
import { contain } from 'utils/Keymap';

export interface CardViewSwitcherSettings {
	hotkeys: HotkeyMap;
}

export class CardViewSwitcherSettingTab extends PluginSettingTab {
	plugin: CardViewSwitcherPlugin;
	hotkeySetters: HotkeySetter[];

	constructor(app: App, plugin: CardViewSwitcherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.hotkeySetters = [];
	}

	display() {
		const { containerEl } = this;
		const { settings } = this.plugin;
		if (!settings) return;
		HOTKEY_ACTION_IDS.forEach((actionId) => {
			const hotkeys = settings.hotkeys[actionId];
			const defaultHotkeys = DEFAULT_SETTINGS.hotkeys[actionId];
			const description = HOTKEY_ACTION_INFO[actionId].description;
			const hotkeySetter = new HotkeySetter(
				this.app,
				containerEl,
				description,
				hotkeys,
				defaultHotkeys
			).onChanged((renewed, added) => {
				if (added) {
					// modifier key should be pressed
					if (added.modifiers.length === 0) return false;

					// avoid collision
					const collision = Object.values(settings.hotkeys).some(
						(hotkeys) => {
							return contain(hotkeys, added);
						}
					);
					if (collision) {
						new Notice('Hotkeys are conflicting!');
						return false;
					}
				}
				settings.hotkeys[actionId] = renewed;
				this.plugin.saveSettings();
				return true;
			});
			this.hotkeySetters.push(hotkeySetter);
		});
	}

	override hide() {
		super.hide();
		this.hotkeySetters.forEach((s) => s.unload());
		this.hotkeySetters = [];
	}
}

export const DEFAULT_SETTINGS: CardViewSwitcherSettings = {
	hotkeys: {
		selectNext: [
			{
				modifiers: ['Ctrl'],
				key: 'n',
			},
			{
				modifiers: [],
				key: 'ArrowDown',
			},
		],
		selectPrevious: [
			{
				modifiers: ['Ctrl'],
				key: 'ArrowUp',
			},
		],
		open: [
			{
				modifiers: [],
				key: 'Enter',
			},
		],
		openInNewPaneVertically: [
			{
				modifiers: ['Ctrl', 'Shift'],
				key: 'Enter',
			},
		],
		openInNewPaneHorizontally: [
			{
				modifiers: ['Ctrl'],
				key: 'Enter',
			},
		],
		copyLink: [
			{
				modifiers: ['Ctrl'],
				key: 'i',
			},
		],
	},
};

const HOTKEY_ACTION_IDS = [
	'selectNext',
	'selectPrevious',
	'open',
	'openInNewPaneVertically',
	'openInNewPaneHorizontally',
	'copyLink',
] as const;

type HotkeyActionId = typeof HOTKEY_ACTION_IDS[number];

type HotkeyMap = {
	[actionId in HotkeyActionId]: Hotkey[];
};

/**
 * key: actionId
 * value: human friendly name
 */
const HOTKEY_ACTION_INFO: {
	[actionId in HotkeyActionId]: {
		description: string;
		short: string;
	};
} = {
	selectNext: {
		description: 'Select the next item',
		short: 'select next',
	},
	selectPrevious: {
		description: 'Select the previous item',
		short: 'select previous',
	},
	open: {
		description: 'Open the selected item',
		short: 'open',
	},
	openInNewPaneVertically: {
		description: 'Open the selected item in a new pane vertically',
		short: 'open vertically',
	},
	openInNewPaneHorizontally: {
		description: 'Open the selected item in a new pane horizontally',
		short: 'open horizontally',
	},
	copyLink: {
		description: 'Copy the internal link of the selected item',
		short: 'copy link',
	},
};
