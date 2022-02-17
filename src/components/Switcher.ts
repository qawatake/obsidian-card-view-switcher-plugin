import { App, Component, Notice, Scope, TFile } from 'obsidian';
import Modal from 'ui/Modal.svelte';
import * as store from 'ui/store';
import { generateInternalLinkFrom } from 'utils/Link';

export class Switcher extends Component {
	private readonly app: App;
	private modal: Modal | undefined;
	private scope: Scope;

	constructor(app: App) {
		super();
		this.app = app;
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

		store.app.set(this.app);
		store.switcherComponent.set(this);
		this.modal = new Modal({
			target: document.body,
		});

		this.modal.$on('should-destroy', () => {
			this.unload();
		});
	}

	private setHotkeys() {
		this.app.keymap.pushScope(this.scope);

		this.scope?.register(['Ctrl'], 'p', (evt) => {
			evt.preventDefault(); // to prevent cursor from moving to the start position
			this.modal?.navigateBack();
		});
		this.scope?.register(['Ctrl'], 'n', (evt) => {
			evt.preventDefault(); // to prevent cursor from moving to the end position
			this.modal?.navigateForward();
		});
		this.scope?.register([], 'ArrowUp', () => {
			this.modal?.navigateBack();
		});
		this.scope?.register([], 'ArrowDown', () => {
			this.modal?.navigateForward();
		});
		this.scope?.register([], 'Enter', () => {
			this.modal?.open();
		});
		this.scope?.register(['Ctrl'], 'Enter', () => {
			this.modal?.open('horizontal');
		});
		this.scope.register(['Ctrl', 'Shift'], 'Enter', () => {
			this.modal?.open('vertical');
		});
		this.scope.register(['Ctrl'], 'i', () => {
			const file = this.modal?.selectedFile();
			if (!file) return;
			const internalLink = generateInternalLinkFrom(
				this.app.metadataCache,
				file
			);
			navigator.clipboard.writeText(internalLink);
			new Notice('copy internal link!');
		});
		this.scope?.register([], 'Escape', () => {
			this.unload();
		});
	}

	private detachHotkeys() {
		this.app.keymap.popScope(this.scope);
	}
}
