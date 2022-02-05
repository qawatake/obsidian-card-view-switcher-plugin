<script lang="ts">
	import type { SplitDirection, TFile } from 'obsidian';
	import { onDestroy, onMount } from 'svelte';
	import CardContainer from 'ui/CardContainer.svelte';
	import { app, switcherComponent } from 'ui/store';

	// const
	const CARDS_PER_PAGE = 10;

	// props
	export let files: TFile[];

	// internal variables
	let containerEl: HTMLElement;
	let inputEl: HTMLInputElement;

	// state variables
	let selected: number | undefined = undefined;

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

	async function openFile(file: TFile, direction?: SplitDirection) {
		const leaf =
			direction === undefined
				? $app.workspace.getMostRecentLeaf()
				: $app.workspace.splitActiveLeaf(direction);
		await leaf.openFile(file);
		$app.workspace.setActiveLeaf(leaf, true, true);
	}
</script>

<div class="modal" bind:this={containerEl}>
	<div class="prompt-container">
		<input class="prompt-input" bind:this={inputEl} />
		<div class="prompt-instruction" />
	</div>

	<div class="cards-container">
		{#each files.slice(0, CARDS_PER_PAGE) as file, id}
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

		max-width: unset;
		padding: 30px 50px;

		background-color: var(--background-primary);
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
