<script lang="ts">
	import {
		App,
		debounce,
		TFile,
		type Instruction,
		type SearchMatches,
		type SplitDirection,
	} from 'obsidian';
	import { HOTKEY_ACTION_IDS, HOTKEY_ACTION_INFO } from 'Setting';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import CardContainer from 'ui/CardContainer.svelte';
	import { app, plugin } from 'ui/store';
	import { convertHotkeyToText } from 'utils/Keymap';
	import {
		fuzzySearchInFilePaths,
		searchInFiles,
		sortResultItemsInFilePathSearch,
	} from 'utils/Search';
	import { delay } from 'utils/Util';

	// const
	const CARDS_PER_PAGE = 10;
	// const instructions: Instruction[] = [
	// 	{ command: '↑↓', purpose: 'to navigate' },
	// 	{ command: 'ctrl + n/p', purpose: 'to navigate' },
	// 	{ command: '↵', purpose: 'to open' },
	// 	{ command: 'ctrl + ↵', purpose: 'to open horizontally' },
	// 	{ command: 'ctrl + shift + ↵', purpose: 'to open vertically' },
	// 	{ command: 'esc', purpose: 'to dismiss' },
	// ];
	const instructions: (Instruction | undefined)[] = HOTKEY_ACTION_IDS.map(
		(actionId) => {
			const hotkeys = $plugin.settings?.hotkeys[actionId];
			if (!hotkeys) return undefined;
			const purpose = 'to ' + HOTKEY_ACTION_INFO[actionId].short;
			const cmd: string = hotkeys
				.map((hotkey) => convertHotkeyToText(hotkey).toLowerCase())
				.join(', ');
			return {
				command: cmd,
				purpose: purpose,
			};
		}
	);
	instructions.push({
		command: 'esc',
		purpose: 'to dismiss',
	});

	// bind
	// let containerEl: HTMLElement | undefined | null;
	let inputEl: HTMLInputElement | undefined | null;
	let contentEl: HTMLElement | undefined | null;

	// state variables
	interface FoundResult {
		file: TFile;
		matches: SearchMatches;
	}
	let results: FoundResult[] = [];
	let selected = 0;
	let page = 0;
	let cards: CardContainer[] = [];
	// type SearchMode = 'normal' | 'recent';
	// let mode: SearchMode = 'recent';

	// debouncer
	const searchAndRenderDebouncer = debounce(searchAndRender, 100, true);

	// event dispatcher
	const dispatcher = createEventDispatcher();

	onMount(async () => {
		inputEl?.focus();

		results = await getResults('');
		if (contentEl instanceof HTMLElement) {
			renderCards(contentEl, results, 0);
		}
		focusOn(0);
	});

	onDestroy(() => {
		detachCards();
	});

	export function navigateForward() {
		// update selected
		let updated = true;
		selected++;

		if (selected >= results.length) {
			selected = results.length - 1;
			updated = false;
		}

		focusOn(selected);

		// update page
		if (updated) {
			const shouldTransitNextPage = selected % CARDS_PER_PAGE === 0;
			if (shouldTransitNextPage) {
				page++;
				if (contentEl instanceof HTMLElement) {
					renderCards(contentEl, results, page);
				}
				focusOn(selected);
			}
		}
	}

	export function navigateBack() {
		// update selected
		let updated = true;
		selected--;
		if (selected < 0) {
			selected = 0;
			updated = false;
		}

		focusOn(selected);

		// update page
		if (updated) {
			const shouldTransitPreviousPage =
				(selected + 1) % CARDS_PER_PAGE === 0;
			if (shouldTransitPreviousPage) {
				page--;
				if (contentEl instanceof HTMLElement) {
					renderCards(contentEl, results, page);
				}
				focusOn(selected);
			}
		}
	}

	export async function open(direction?: SplitDirection) {
		if (selected === undefined) {
			return;
		}
		const file = results[selected]?.file;
		if (file === undefined) {
			return;
		}
		await openFile(file, direction);
		dispatcher('should-destroy');
	}

	export function selectedFile(): TFile | undefined {
		const file = results[selected]?.file;
		return file;
	}

	async function onInput(evt: Event) {
		if (!(evt instanceof InputEvent)) return;
		const inputEl = evt.target;
		if (!(inputEl instanceof HTMLInputElement)) return;
		const changed = changeMode(inputEl, evt);
		if (changed) return;
		searchAndRenderDebouncer(inputEl);
	}

	async function searchAndRender(inputEl: HTMLInputElement) {
		// refresh
		selected = 0;
		page = 0;
		detachCards();
		// contentEl?.empty(); // unnecessary. rather cause error when used

		results = await getResults(inputEl.value);
		if (contentEl instanceof HTMLElement) {
			renderCards(contentEl, results, 0);
		}
		focusOn(0);
	}

	function focusOn(id: number) {
		const pos = id % CARDS_PER_PAGE; // id in results => position in cards
		[-1, 0, 1].forEach((i) => {
			const card = cards[pos + i];
			if (!card) return;
			if (i == 0) {
				card.$set({ selected: true });
			} else {
				card.$set({ selected: false });
			}
		});
	}

	async function openFile(file: TFile, direction?: SplitDirection) {
		const leaf =
			direction !== undefined
				? $app.workspace.splitActiveLeaf(direction)
				: $app.workspace.getMostRecentLeaf();
		await leaf.openFile(file);
		$app.workspace.setActiveLeaf(leaf, true, true);
	}

	async function getResults(query: string): Promise<FoundResult[]> {
		let results: FoundResult[];

		if (query === '') {
			const files = getRecentFiles($app);
			results = files.map((file) => {
				return { file: file, matches: [] };
			});
		} else if (!query.startsWith("'")) {
			const files = getRecentFiles($app);
			const items = await searchInFiles($app, query, files);
			results = items.map((item) => {
				return { file: item.file, matches: item.path?.matches ?? [] };
			});
		} else {
			const trimmedQuery = query.replace(/^'/, '');
			const files = $app.vault.getFiles();
			const items = sortResultItemsInFilePathSearch(
				fuzzySearchInFilePaths(trimmedQuery, files)
			);
			results = items.map((item) => {
				return { file: item.file, matches: item.path?.matches ?? [] };
			});
		}
		return results;
	}

	/**
	 *
	 * @returns whether mode change occurs
	 */
	function changeMode(inputEl: HTMLInputElement, evt: InputEvent): boolean {
		if (evt.data === ' ' && inputEl.value === evt.data) {
			evt.preventDefault();
			inputEl.value = "'";
			return true;
		}
		return false;
	}

	function renderCards(
		contentEl: HTMLElement,
		results: FoundResult[],
		page: number
	) {
		// refresh
		// contentEl.empty(); // unnecessary. rather cause error when used
		detachCards();

		for (
			let id = CARDS_PER_PAGE * page;
			id < CARDS_PER_PAGE * (page + 1);
			id++
		) {
			const result = results[id];
			if (!result) continue;
			const card = new CardContainer({
				target: contentEl,
				props: {
					id: id,
					file: result.file,
					matches: result.matches,
					selected: false,
				},
			});
			card.$on('click', () => {
				selected = id;
				open();
			});
			cards.push(card);
		}
	}

	function detachCards() {
		cards.forEach((card) => card.$destroy());
		cards = [];
	}

	function getRecentFiles(app: App): TFile[] {
		const files = app.workspace
			.getLastOpenFiles()
			.map((path) => app.vault.getAbstractFileByPath(path))
			.filter((file) => file instanceof TFile) as TFile[];
		return files;
	}
</script>

<div class="modal">
	<div
		class="modal-background"
		on:click={() => {
			dispatcher('should-destroy');
		}}
	/>

	<div class="prompt-container">
		<input
			class="prompt-input"
			placeholder="Hit space key to toggle the normal search mode"
			bind:this={inputEl}
			on:input={onInput}
			on:blur={async () => {
				await delay(100); // necessary to prevent refocus after unloading modal
				inputEl?.focus();
			}}
		/>
		<div class="prompt-instruction-container">
			{#each instructions as instruction}
				{#if instruction}
					<div class="prompt-instruction">
						<span class="prompt-instruction-command"
							>{instruction.command}</span
						>
						<span>{instruction.purpose}</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<div class="cards-container" bind:this={contentEl} />
</div>

<style>
	.modal {
		display: flex;
		align-items: center;
		flex-direction: column;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: var(--layer-modal);

		padding: 30px 50px;

		/* reset the default obsidian style */
		max-width: unset;
		border-radius: unset;
		border: unset;
		background-color: unset;
	}

	.modal-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: var(--background-modifier-cover);
	}

	.prompt-container {
		margin-bottom: 20px;
		background-color: var(--background-primary);
		padding: 10px;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: fit-content;
		z-index: 1; /* to put this in front of background */
	}

	.prompt-input {
		max-width: 700px;
		padding: 9px 20px 8px 20px;
		font-size: 16px;
		border-radius: 6px;
		height: 40px;

		background: var(--background-modifier-form-field);
		border: 1px solid var(--background-modifier-border);
		color: var(--text-normal);
	}

	.prompt-input:focus,
	.prompt-input:active {
		border-color: var(--interactive-accent);
	}

	.prompt-instruction-container {
		display: unset;
		margin-right: 0;
		padding: 10px 10px 2px 10px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
	}

	.prompt-instruction-command {
		font-size: 12px;
		font-weight: 900;
		margin-right: 4px;
	}

	.cards-container {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		/* grid-template-rows: repeat(attr(data-row), 1fr); */
		grid-template-rows: repeat(2, 1fr);
		grid-gap: 20px;
		height: 100%;
		width: 100%;
		min-height: 0;
		z-index: 1; /* to put this in front of background */
	}
</style>
