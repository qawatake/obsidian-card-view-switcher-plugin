import {
	App,
	Modal,
	type SplitDirection,
	MarkdownView,
	Notice,
	TFile,
	type SearchMatches,
} from 'obsidian';
import { scrollIteration } from 'utils/Util';
import { generateInternalLinkFrom } from 'utils/Link';
import type CardViewSwitcherPlugin from 'main';
import type { Switcher } from './Switcher';
import PreviewModalContent from 'ui/PreviewModalContent.svelte';

type ScrollDirection = 'up' | 'down';

const SCROLL_AMOUNT = 70;

export class PreviewModal extends Modal {
	private readonly plugin: CardViewSwitcherPlugin;
	private readonly switcher: Switcher;
	private readonly file: TFile;
	private readonly matches: SearchMatches;
	private previewContent: PreviewModalContent | undefined;

	currentFocus: number | undefined;

	constructor(
		app: App,
		plugin: CardViewSwitcherPlugin,
		switcher: Switcher,
		file: TFile,
		matches: SearchMatches
	) {
		super(app);
		this.plugin = plugin;
		this.switcher = switcher;
		this.file = file;
		this.matches = matches;
		this.currentFocus = undefined;
	}

	override async onOpen() {
		this.renderView();

		const hotkeyMap = this.plugin.settings?.previewModalHotkeys;
		if (!hotkeyMap) return;

		hotkeyMap.closeModal.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault(); // to prevent input
				this.shouldRestoreSelection = true;
				this.close();
			});
		});

		hotkeyMap.open.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				this.openAndFocus(this.currentFocus);
				this.switcher.unload();
				this.shouldRestoreSelection = false;
				this.close();
			});
		});

		hotkeyMap.openInNewPaneHorizontally.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				this.openAndFocus(this.currentFocus, 'horizontal');
				this.switcher.unload();
				this.shouldRestoreSelection = false;
				this.close();
			});
		});

		hotkeyMap.openInNewPaneVertically.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				this.openAndFocus(this.currentFocus, 'vertical');
				this.switcher.unload();
				this.shouldRestoreSelection = false;
				this.close();
			});
		});

		hotkeyMap.bigScrollDown.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				this.scroll('down');
			});
		});

		hotkeyMap.bigScrollUp.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				this.scroll('up');
			});
		});

		hotkeyMap.scrollDown.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				this.scroll('down', SCROLL_AMOUNT);
			});
		});

		hotkeyMap.scrollUp.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				this.scroll('up', SCROLL_AMOUNT);
			});
		});

		hotkeyMap.focusNext.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault(); // to prevent inserting indent in editing mode in the active leaf
				const numMatches = this.countMatches();
				if (numMatches === undefined || numMatches === 0) {
					return;
				}
				this.currentFocus = (this.currentFocus ?? 0) + 1;
				this.currentFocus = cyclicId(this.currentFocus, numMatches);
				this.previewContent?.focusOn(this.currentFocus, true);
			});
		});

		hotkeyMap.focusPrevious.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				const numMatches = this.countMatches();
				if (numMatches === undefined || numMatches === 0) {
					return;
				}
				if (this.currentFocus === undefined) {
					return;
				}
				this.currentFocus--;
				this.currentFocus = cyclicId(this.currentFocus, numMatches);
				this.previewContent?.focusOn(this.currentFocus, true);
			});
		});

		hotkeyMap.toggleViewMode.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				(async () => {
					await this.previewContent?.toggleViewMode();
					this.previewContent?.highlightMatches();
				})();
			});
		});

		hotkeyMap.copyLink.forEach((hotkey) => {
			this.scope.register(hotkey.modifiers, hotkey.key, (evt) => {
				evt.preventDefault();
				const internalLink = generateInternalLinkFrom(
					this.app.metadataCache,
					this.file
				);
				navigator.clipboard.writeText(internalLink);
				new Notice('Copy wiki link!');
			});
		});
	}

	override onClose() {
		this.previewContent?.$destroy();
	}

	private renderView() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.hide();
		this.previewContent = new PreviewModalContent({
			target: contentEl,
			props: {
				file: this.file,
				matches: this.matches,
			},
		});
		contentEl.show();
	}

	private countMatches(): number | undefined {
		return this.matches.length;
	}

	private scroll(direction: ScrollDirection, px?: number) {
		const { containerEl, contentEl } = this;
		const move =
			(px ?? containerEl.clientHeight / 2) *
			(direction === 'up' ? -1 : 1);
		contentEl.scrollBy({
			top: move,
			behavior: 'smooth',
		});
	}

	async openAndFocus(
		matchId: number | undefined,
		direction?: SplitDirection
	) {
		const { file } = this;

		// open file
		const leaf =
			direction === undefined
				? this.app.workspace.getMostRecentLeaf()
				: this.app.workspace.splitActiveLeaf(direction);
		await leaf.openFile(file);
		this.app.workspace.setActiveLeaf(leaf, true, true);

		// highlight matches
		if (matchId === undefined) {
			return;
		}
		const match = this.matches[matchId];
		if (!match) {
			return;
		}
		const { view } = leaf;
		if (!(view instanceof MarkdownView)) {
			return;
		}
		const editor = view.editor;
		const range = {
			from: editor.offsetToPos(match[0]),
			to: editor.offsetToPos(match[1]),
		};
		editor.addHighlights([range], 'obsidian-search-match-highlight');

		// scroll
		// if content of a file is too large, we need to call scrollIntoView many times
		const iter = scrollIteration(editor);
		if (iter === undefined) {
			return;
		}
		for (let i = 0; i < iter; i++) {
			editor.scrollIntoView(range, true);
		}
		editor.setCursor(range.from);
	}
}

function cyclicId(id: number, total: number): number {
	return ((id % total) + total) % total;
}
