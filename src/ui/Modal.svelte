<script lang="ts">
	import {
		TFile,
		type Instruction,
		type Match,
		type SplitDirection,
	} from 'obsidian';
	import { onDestroy, onMount } from 'svelte';
	import CardContainer from 'ui/CardContainer.svelte';
	import { app, switcherComponent } from 'ui/store';
	import {
		fuzzySearchInFilePaths,
		searchInFiles,
		sortResultItemsInFilePathSearch,
	} from 'utils/Search';

	// const
	const CARDS_PER_PAGE = 10;
	const instructions: Instruction[] = [
		{ command: '↑↓', purpose: 'to navigate' },
		{ command: 'ctrl + n/p', purpose: 'to navigate' },
		{ command: '↵', purpose: 'to open' },
		{ command: 'ctrl + ↵', purpose: 'to open horizontally' },
		{ command: 'ctrl + shift + ↵', purpose: 'to open vertically' },
		{ command: 'esc', purpose: 'to dismiss' },
	];

	// bind
	let containerEl: HTMLElement | undefined | null;
	let inputEl: HTMLInputElement | undefined | null;

	// state variables
	interface FoundResult {
		file: TFile;
		matches: Match[];
	}
	let results: FoundResult[] = [];
	let selected = 0;
	let page = 0;
	// type SearchMode = 'normal' | 'recent';
	// let mode: SearchMode = 'recent';

	onMount(() => {
		inputEl?.focus();
		renderRecentFiles();
	});

	onDestroy(() => {
		// unsubscribers.forEach((unsubscriber) => unsubscriber());
	});

	export function navigateForward() {
		// update selected
		let updated = true;
		selected++;
		// if (selected >= files.length) {
		if (selected >= results.length) {
			selected = results.length - 1;
			updated = false;
		}

		// update page
		if (updated) {
			const shouldTransitNextPage = selected % CARDS_PER_PAGE === 0;
			if (shouldTransitNextPage) page++;
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

		// update page
		if (updated) {
			const shouldTransitPreviousPage =
				(selected + 1) % CARDS_PER_PAGE === 0;
			if (shouldTransitPreviousPage) page--;
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
		$switcherComponent.unload();
		containerEl?.remove();
	}

	function renderRecentFiles() {
		const paths = $app.workspace.getLastOpenFiles();
		// files = [];
		results = [];
		paths.forEach((path) => {
			const file = $app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				results.push({
					file: file,
					matches: [],
				});
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

	function onInput(evt: Event) {
		if (!(evt instanceof InputEvent)) {
			return;
		}
		const inputEl = evt.target;
		if (!(inputEl instanceof HTMLInputElement)) return;
		const changed = shouldChangeMode(inputEl, evt);
		if (changed) return;

		renderResults(inputEl.value);
	}

	async function renderResults(query: string) {
		selected = 0;
		page = 0;

		if (query === '') {
			renderRecentFiles();
			return;
		}

		results = [];
		if (!query.startsWith("'")) {
			const files = $app.workspace
				.getLastOpenFiles()
				.map((path) => $app.vault.getAbstractFileByPath(path))
				.filter((file) => file instanceof TFile) as TFile[];
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
	}

	function shouldChangeMode(
		inputEl: HTMLInputElement,
		evt: InputEvent
	): boolean {
		if (evt.data === ' ' && inputEl.value === evt.data) {
			evt.preventDefault();
			inputEl.value = "'";
			return true;
		}
		return false;
	}
</script>

<div class="modal" bind:this={containerEl}>
	<div
		class="modal-background"
		on:click={() => {
			$switcherComponent.unload();
			containerEl?.remove();
		}}
	/>

	<div class="prompt-container">
		<input
			class="prompt-input"
			placeholder="Hit space key to toggle the normal search mode"
			bind:this={inputEl}
			on:input={onInput}
		/>
		<div class="prompt-instruction-container">
			{#each instructions as instruction}
				<div class="prompt-instruction">
					<span class="prompt-instruction-command"
						>{instruction.command}</span
					>
					<span>{instruction.purpose}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="cards-container">
		{#each results.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE) as result, id (result)}
			<CardContainer
				id={CARDS_PER_PAGE * page + id}
				file={result.file}
				matches={result.matches}
				selected={selected === CARDS_PER_PAGE * page + id}
				on:click={() => {
					selected = CARDS_PER_PAGE * page + id;
					open();
				}}
			/>
		{/each}
	</div>
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
