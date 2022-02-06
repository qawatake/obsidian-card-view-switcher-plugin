import { App, Component, Scope, TFile } from 'obsidian';
import Modal from 'ui/Modal.svelte';
import * as store from 'ui/store';

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

		this.opemModal();
	}

	override onunload(): void {
		this.detachHotkeys();
		this.modal?.$destroy();
	}

	private opemModal() {
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
	}

	private setHotkeys() {
		this.app.keymap.pushScope(this.scope);

		this.scope?.register(['Ctrl'], 'p', () => {
			this.modal?.navigateBack();
		});
		this.scope?.register(['Ctrl'], 'n', () => {
			this.modal?.navigateForward();
		});
		this.scope?.register([], 'ArrowUp', () => {
			this.modal?.navigateBack();
		});
		this.scope?.register([], 'ArrowDown', () => {
			this.modal?.navigateForward();
		});
		this.scope?.register([], 'Enter', () => {
			this.modal?.open(false);
		});
		this.scope?.register(['Ctrl'], 'Enter', () => {
			this.modal?.open(true);
		});
		this.scope?.register([], 'Escape', () => {
			this.unload();
		});
	}

	private detachHotkeys() {
		this.app.keymap.popScope(this.scope);
	}
}
