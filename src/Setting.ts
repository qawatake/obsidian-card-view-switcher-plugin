import type CardViewSwitcherPlugin from 'main';
import { App, Notice, PluginSettingTab, type Hotkey } from 'obsidian';
import { HotkeySetter } from 'ui/HotkeySetter';
import { contain } from 'utils/Keymap';

export interface CardViewSwitcherSettings {
	cardViewModalHotkeys: CardViewModalHotkeyMap;
	previewModalHotkeys: PreviewModalHotkeyMap;
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

		containerEl.createEl('h2', { text: 'Hotkeys' });

		containerEl.createEl('h3', { text: 'Card View Modal' });
		CARD_VIEW_MODAL_HOTKEY_ACTION_IDS.forEach((actionId) => {
			const hotkeys = settings.cardViewModalHotkeys[actionId];
			const defaultHotkeys =
				DEFAULT_SETTINGS.cardViewModalHotkeys[actionId];
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
					const collision = Object.values(
						settings.cardViewModalHotkeys
					).some((hotkeys) => {
						return contain(hotkeys, added);
					});
					if (collision) {
						new Notice('Hotkeys are conflicting!');
						return false;
					}
				}
				settings.cardViewModalHotkeys[actionId] = renewed;
				this.plugin.saveSettings();
				return true;
			});
			this.hotkeySetters.push(hotkeySetter);
		});

		containerEl.createEl('h3', { text: 'Preview Modal' });
		PREVIEW_MODAL_HOTKEY_ACTION_IDS.forEach((actionId) => {
			const hotkeys = settings.previewModalHotkeys[actionId];
			const defaultHotkeys =
				DEFAULT_SETTINGS.previewModalHotkeys[actionId];
			const description =
				PREVIEW_MODAL_HOTKEY_ACTION_INFO[actionId].description;
			const hotkeySetter = new HotkeySetter(
				this.app,
				containerEl,
				description,
				hotkeys,
				defaultHotkeys
			).onChanged((renewed, added) => {
				if (added) {
					// avoid collision
					const collision = Object.values(
						settings.previewModalHotkeys
					).some((hotkeys) => {
						return contain(hotkeys, added);
					});
					if (collision) {
						new Notice('Hotkeys are conflicting!');
						return false;
					}
				}
				settings.previewModalHotkeys[actionId] = renewed;
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
	cardViewModalHotkeys: {
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
				key: 'p',
			},
			{
				modifiers: [],
				key: 'ArrowUp',
			},
		],
		openPreviewModal: [
			{
				modifiers: ['Ctrl'],
				key: ' ',
			},
		],
		open: [
			{
				modifiers: [],
				key: 'Enter',
			},
		],
		openInNewPaneHorizontally: [
			{
				modifiers: ['Ctrl'],
				key: 'Enter',
			},
		],
		openInNewPaneVertically: [
			{
				modifiers: ['Ctrl', 'Shift'],
				key: 'Enter',
			},
		],
		refocus: [
			{
				modifiers: ['Ctrl'],
				key: 'r',
			},
		],
		copyLink: [
			{
				modifiers: ['Ctrl'],
				key: 'i',
			},
		],
	},
	previewModalHotkeys: {
		scrollDown: [
			{
				modifiers: [],
				key: 'ArrowDown',
			},
			{
				modifiers: ['Ctrl'],
				key: 'n',
			},
		],
		scrollUp: [
			{
				modifiers: [],
				key: 'ArrowUp',
			},
			{
				modifiers: ['Ctrl'],
				key: 'p',
			},
		],
		bigScrollDown: [
			{
				modifiers: [],
				key: ' ',
			},
		],
		bigScrollUp: [
			{
				modifiers: ['Shift'],
				key: ' ',
			},
		],
		open: [
			{
				modifiers: [],
				key: 'Enter',
			},
		],
		openInNewPaneHorizontally: [
			{
				modifiers: ['Ctrl'],
				key: 'Enter',
			},
		],
		openInNewPaneVertically: [
			{
				modifiers: ['Ctrl', 'Shift'],
				key: 'Enter',
			},
		],
		closeModal: [
			{
				modifiers: ['Ctrl'],
				key: ' ',
			},
		],
		focusNext: [
			{
				modifiers: [],
				key: 'Tab',
			},
		],
		focusPrevious: [
			{
				modifiers: ['Shift'],
				key: 'Tab',
			},
		],
		togglePreviewMode: [
			{
				modifiers: ['Ctrl'],
				key: 'e',
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

export const CARD_VIEW_MODAL_HOTKEY_ACTION_IDS = [
	'selectNext',
	'selectPrevious',
	'openPreviewModal',
	'open',
	'openInNewPaneHorizontally',
	'openInNewPaneVertically',
	'refocus',
	'copyLink',
] as const;

type CardViewModalHotkeyActionId =
	typeof CARD_VIEW_MODAL_HOTKEY_ACTION_IDS[number];

type CardViewModalHotkeyMap = {
	[actionId in CardViewModalHotkeyActionId]: Hotkey[];
};

/**
 * key: actionId
 * value: human friendly name
 */
export const HOTKEY_ACTION_INFO: {
	[actionId in CardViewModalHotkeyActionId]: {
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
	openPreviewModal: {
		description: 'Open preview modal',
		short: 'preview',
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
	refocus: {
		description: 'Focus on the input form',
		short: 'refocus',
	},
	copyLink: {
		description: 'Copy the internal link of the selected item',
		short: 'copy link',
	},
};

export const PREVIEW_MODAL_HOTKEY_ACTION_IDS = [
	'scrollDown',
	'scrollUp',
	'bigScrollDown',
	'bigScrollUp',
	'open',
	'openInNewPaneHorizontally',
	'openInNewPaneVertically',
	'closeModal',
	'focusNext',
	'focusPrevious',
	'togglePreviewMode',
	'copyLink',
] as const;

type PreviewModalHotkeyActionId =
	typeof PREVIEW_MODAL_HOTKEY_ACTION_IDS[number];

type PreviewModalHotkeyMap = {
	[actionId in PreviewModalHotkeyActionId]: Hotkey[];
};

/**
 * key: actionId
 * value: human friendly name
 */
export const PREVIEW_MODAL_HOTKEY_ACTION_INFO: {
	[actionId in PreviewModalHotkeyActionId]: {
		description: string;
		short: string;
	};
} = {
	scrollDown: {
		description: 'Scroll down a bit',
		short: 'scroll down',
	},
	scrollUp: {
		description: 'Scroll up a bit',
		short: 'scroll up',
	},
	bigScrollDown: {
		description: 'Scroll down a lot',
		short: 'scroll down',
	},
	bigScrollUp: {
		description: 'Scroll up a lot',
		short: 'scroll up',
	},
	open: {
		description: 'Open the file',
		short: 'open',
	},
	openInNewPaneHorizontally: {
		description: 'Open the file in a new pane horizontally',
		short: 'open horizontally',
	},
	openInNewPaneVertically: {
		description: 'Open the file in a new pane vertically',
		short: 'open vertically',
	},
	closeModal: {
		description: 'Close the modal',
		short: 'close',
	},
	focusNext: {
		description: 'Focus on the next match',
		short: 'focus next',
	},
	focusPrevious: {
		description: 'Focus on the previous match',
		short: 'focus previous',
	},
	togglePreviewMode: {
		description: 'Toggle preview mode',
		short: 'preview',
	},
	copyLink: {
		description: 'Copy wiki link of the file',
		short: 'copy link',
	},
};
