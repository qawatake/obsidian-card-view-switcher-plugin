import type CardViewSwitcherPlugin from 'main';
import { App, Component, Notice, Scope, TFile } from 'obsidian';
import Modal from 'ui/Modal.svelte';
import { generateInternalLinkFrom } from 'utils/Link';
import { PreviewModal } from './PreviewModal';
import * as store from 'ui/store';

export class Switcher extends Component {
	private readonly app: App;
	private readonly plugin: CardViewSwitcherPlugin;
	private modal: Modal | undefined;
	private scope: Scope;
	private selection: Selection | undefined;
	public shouldRestoreSelection: boolean;

	constructor(app: App, plugin: CardViewSwitcherPlugin) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.scope = new Scope();
		this.shouldRestoreSelection = true;
	}

	public override onload(): void {
		store.switcher.set(this);
		this.setHotkeys();
		this.selection = this.fetchSelection();

		this.openModal();
	}

	override onunload(): void {
		this.detachHotkeys();
		this.modal?.$destroy();
		if (this.shouldRestoreSelection) {
			this.restoreSelection(this.selection);
		}
	}

	private openModal() {
		const paths = this.app.workspace.getLastOpenFiles();
		const files: TFile[] = [];
		paths.forEach((path) => {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				files.push(file);
			}
		});

		// store.switcherComponent.set(this);
		this.modal = new Modal({
			target: document.body,
		});

		this.modal.$on('should-destroy', () => {
			this.unload();
		});
	}

	private setHotkeys() {
		const { settings } = this.plugin;
		if (!settings) return;
		const hotkeyMap = settings.cardViewModalHotkeys;

		this.app.keymap.pushScope(this.scope);

		hotkeyMap.selectPrevious.forEach((hotkey) => {
			this.scope?.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault(); // to prevent cursor from moving to the start position
				this.modal?.navigateBack();
			});
		});
		hotkeyMap.selectNext.forEach((hotkey) => {
			this.scope?.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault(); // to prevent cursor from moving to the end position
				this.modal?.navigateForward();
			});
		});
		if (!this.app.vault.config.legacyEditor) {
			hotkeyMap.openPreviewModal.forEach((hotkey) => {
				this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
					evt.preventDefault();
					const result = this.modal?.selectedResult();
					if (result === undefined) return;
					new PreviewModal(
						this.app,
						this.plugin,
						this,
						result.file,
						result.content?.matches ?? []
					).open();
				});
			});
		}
		hotkeyMap.open.forEach((hotkey) => {
			this.scope?.register(hotkey.modifiers, hotkey.key, () => {
				this.modal?.open();
			});
		});
		hotkeyMap.openInNewPaneHorizontally.forEach((hotkey) => {
			this.scope?.register(hotkey.modifiers, hotkey.key, () => {
				this.modal?.open('horizontal');
			});
		});
		hotkeyMap.openInNewPaneVertically.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, () => {
				this.modal?.open('vertical');
			});
		});
		hotkeyMap.copyLink.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, () => {
				const result = this.modal?.selectedResult();
				if (!result) return;
				const internalLink = generateInternalLinkFrom(
					this.app.metadataCache,
					result.file
				);
				navigator.clipboard.writeText(internalLink);
				new Notice('copy internal link!');
			});
		});
		this.scope?.register([], 'Escape', () => {
			this.unload();
		});
	}

	private detachHotkeys() {
		this.app.keymap.popScope(this.scope);
	}

	private fetchSelection(): Selection | undefined {
		const s = window.getSelection();
		if (!s) return undefined;
		return {
			range: s.rangeCount > 0 ? s.getRangeAt(0) : null,
			focusEl: document.activeElement,
		};
	}

	private restoreSelection(selection: Selection | undefined) {
		if (!selection) return;

		const { focusEl, range } = selection;
		if (
			range &&
			document.body.contains(range.startContainer) &&
			document.body.contains(range.endContainer)
		) {
			const s = window.getSelection();
			s?.removeAllRanges();
			s?.addRange(range);
		}
		if (
			(focusEl instanceof HTMLElement || focusEl instanceof SVGElement) &&
			document.body.contains(focusEl)
		) {
			focusEl.focus();
		}
	}
}

interface Selection {
	range: Range | null;
	focusEl: Element | null;
}
