import type CardViewSwitcherPlugin from 'main';
import { App, Component, Notice, Scope, TFile } from 'obsidian';
import Modal from 'ui/Modal.svelte';
import { generateInternalLinkFrom } from 'utils/Link';
import { PreviewModal } from './PreviewModal';

export class Switcher extends Component {
	private readonly app: App;
	private readonly plugin: CardViewSwitcherPlugin;
	private modal: Modal | undefined;
	private scope: Scope;

	constructor(app: App, plugin: CardViewSwitcherPlugin) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.scope = new Scope();
	}

	override onload(): void {
		this.setHotkeys();

		this.openModal();
	}

	override onunload(): void {
		this.detachHotkeys();
		this.modal?.$destroy();
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
						result.content?.matches ?? [],
						this.onPreviewModalClose
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

	private get onPreviewModalClose(): () => void {
		return () => {
			// too fast to focus
			this.modal?.focusInput();
		};
	}

	private detachHotkeys() {
		this.app.keymap.popScope(this.scope);
	}
}
