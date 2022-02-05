<script lang="ts">
	import { prepareFuzzySearch, TFile, type SplitDirection } from 'obsidian';
	import { onDestroy, onMount } from 'svelte';
	import CardContainer from 'ui/CardContainer.svelte';
	import { app, switcherComponent } from 'ui/store';

	// const
	const CARDS_PER_PAGE = 10;

	// props
	export let files: TFile[];

	// bind
	let containerEl: HTMLElement;
	let inputEl: HTMLInputElement;
	let query = '';

	// state variables
	let selected: number | undefined = undefined;
	let page = 0;

	// onload
	$: onInputChange(query);

	onMount(() => {
		inputEl.focus();
	});

	onDestroy(() => {
		// unsubscribers.forEach((unsubscriber) => unsubscriber());
	});

	export function navigateForward() {
		selected = selected === undefined ? 0 : selected + 1;
		if (selected >= files.length) {
			selected = files.length - 1;
		}
	}

	export function navigateBack() {
		if (selected === undefined) {
			return;
		}
		selected--;
		if (selected < 0) {
			selected = 0;
		}
	}

	export async function open(direction?: SplitDirection) {
		if (selected === undefined) {
			return;
		}
		const file = files[selected];
		if (file === undefined) {
			return;
		}
		await openFile(file, direction);
		$switcherComponent.unload();
		containerEl.remove();
	}

	function renderRecentFiles() {
		const paths = $app.workspace.getLastOpenFiles();
		files = [];
		paths.forEach((path) => {
			const file = $app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				files.push(file);
			}
		});
	}

	async function openFile(file: TFile, direction?: SplitDirection) {
		const leaf =
			direction === undefined
				? $app.workspace.getMostRecentLeaf()
				: $app.workspace.splitActiveLeaf(direction);
		await leaf.openFile(file);
		$app.workspace.setActiveLeaf(leaf, true, true);
	}

	function onInputChange(query: string) {
		selected = 0;

		if (query === '') {
			renderRecentFiles();
			return;
		}
		const fuzzy = prepareFuzzySearch(query);
		files = $app.vault
			.getFiles()
			.map((file) => {
				const matchInFile = fuzzy(file.basename);
				const matchInPath = fuzzy(file.path);
				return {
					matchInFile: matchInFile,
					matchInPath: matchInPath,
					file: file,
				};
			})
			.filter((result) => {
				return (
					result.matchInPath !== null &&
					result.matchInPath?.score > -1
				);
			})
			.sort((a, b) => {
				if (a.matchInFile === null && b.matchInFile === null) {
					return 0;
				}

				if (a.matchInFile !== null && b.matchInFile !== null) {
					if (a.matchInFile.score !== b.matchInFile.score) {
						return b.matchInFile.score - a.matchInFile.score;
					}

					return a.file.name <= b.file.name ? -1 : 1;
				}

				return a.matchInFile === null ? 1 : -1;
			})
			.map((result) => result.file);
	}
</script>

<div class="modal" bind:this={containerEl}>
	<div class="prompt-container">
		<!-- <input class="prompt-input" bind:this={inputEl} on:input={onInput} /> -->
		<input class="prompt-input" bind:this={inputEl} bind:value={query} />
		<div class="prompt-instruction" />
	</div>

	<div class="cards-container">
		{#each files.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE) as file, id (file.path)}
			<CardContainer
				{id}
				{file}
				selected={selected === id}
				on:click={() => {
					selected = id;
					open();
				}}
			/>
		{/each}
	</div>
</div>

<style>
	.modal {
		display: flex;
		/* align-items: center; */
		/* justify-content: center; */
		flex-direction: column;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: var(--layer-modal);

		padding: 30px 50px;
		background-color: var(--background-modifier-cover);

		/* reset the default obsidian style */
		max-width: unset;
		border-radius: unset;
		border: unset;
	}

	.prompt-container {
		margin-bottom: 20px;
	}

	.prompt-input {
		width: 100%;
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

	.prompt-instruction {
		display: unset;
		margin-right: 0;
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
	}
</style>
