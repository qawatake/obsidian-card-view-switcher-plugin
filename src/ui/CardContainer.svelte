<script lang="ts">
	import { app } from 'ui/store';
	import type { TFile } from 'obsidian';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { ViewGenerator } from 'interfaces/ViewGenerator';

	// props
	export let id: number;
	export let file: TFile;
	export let selected: boolean;

	// internal variables
	let contentContainerEl: HTMLElement;
	let renderer: ViewGenerator;
	const dispatch = createEventDispatcher();

	onMount(async () => {
		renderer = await new ViewGenerator($app, contentContainerEl, file).load(
			'preview'
		);
	});

	onDestroy(() => {
		setTimeout(() => renderer.unload(), 1000);
	});

	function onClicked() {
		dispatch('click');
	}
</script>

<div
	class="card-container"
	class:is-selected={selected}
	data-id={id}
	data-path={file.path}
	on:click={onClicked}
>
	<div class="file-name-container">{file.basename}</div>

	<div class="content-container-wrapper">
		<div class="content-container" bind:this={contentContainerEl} />
	</div>
</div>

<style>
	.card-container {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		border-radius: 10px;
		cursor: pointer;
		background-color: var(--background-primary);
		box-sizing: content-box;
	}

	.card-container:hover {
		/* top: -2px;
		box-shadow: 0 4px 5px var(--interactive-accent); */
		border: 5px solid var(--interactive-accent);
		margin: -5px;
	}

	.card-container.is-selected {
		/* top: -2px;
		box-shadow: 0 4px 5px var(--interactive-accent); */
		border: 5px solid var(--interactive-accent);
		margin: -5px;
	}

	.file-name-container {
		padding: 5px 10px;
		font-size: 1rem;
		line-height: 1.2rem;
		background-color: var(--background-secondary);
		color: var(--text-muted);
		overflow-wrap: break-word;
		flex-grow: 0;
	}

	.content-container-wrapper {
		padding: 5px;
		flex: 1;
		height: 100%;
		min-height: 0;
	}

	.content-container {
		overflow: hidden;
		height: 100%;

		font-size: 0.8rem;
		line-height: 1.2;
	}

	.content-container :global(div),
	:global(p),
	:global(li),
	:global(code) {
		font-size: 0.8rem;
		line-height: 1.2;
	}

	.content-container :global(h1) {
		font-size: 1rem;
		line-height: 1.2;
		margin: 5px;
	}
	.content-container :global(h2) {
		font-size: 1rem;
		line-height: 1.2;
		margin: 5px;
	}
	.content-container :global(h3) {
		font-size: 1rem;
		line-height: 1.2;
		margin: 5px;
	}
	.content-container :global(h4) {
		font-size: 1rem;
		line-height: 1.2;
		margin: 5px;
	}
	.content-container :global(h5) {
		font-size: 1rem;
		line-height: 1.2;
		margin: 5px;
	}
	.content-container :global(h6) {
		font-size: 1rem;
		line-height: 1.2;
		margin: 5px;
	}

	.content-container :global(a) {
		pointer-events: none;
	}

	/* modify preview */
	.content-container :global(.workspace-leaf) {
		contain: initial !important;
	}
	.content-container :global(.workspace-leaf-resize-handle) {
		display: none;
	}
	.content-container :global(.view-header) {
		display: none;
	}
	.content-container :global(.markdown-preview-view) {
		padding: 0;
	}
	.content-container :global(.modal-content) {
		margin: 0;
	}
</style>
