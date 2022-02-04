<script lang="ts">
	import { app } from 'ui/store';
	import type { TFile } from 'obsidian';
	import { onDestroy, onMount } from 'svelte';
	import { ViewGenerator } from 'interfaces/ViewGenerator';

	// props
	export let id: number;
	export let file: TFile;

	// internal variables
	let contentContainerEl: HTMLElement;
	let renderer: ViewGenerator;

	onMount(async () => {
		renderer = await new ViewGenerator($app, contentContainerEl, file).load(
			'preview'
		);
	});

	onDestroy(() => {
		renderer.unload();
	});
</script>

<div class="card-container" data-id={id} data-path={file.path}>
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
	}

	.card-container:hover {
		top: -2px;
		box-shadow: 0 4px 5px var(--interactive-accent);
	}

	.card-container.is-selected {
		top: -2px;
		box-shadow: 0 4px 5px var(--interactive-accent);
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
		height: 100px;
	}

	.content-container {
		overflow: hidden;
		height: 100%;

		font-size: 0.8rem;
		line-height: 1.2;
	}

	.content-container div,
	p,
	li,
	code {
		font-size: 0.8rem;
		line-height: 1.2;
	}

	.content-container h2,
	h3,
	h4,
	h5,
	h6 {
		font-size: 1rem;
		line-height: 1.2;
		margin: 5px;
	}

	.content-container a {
		pointer-events: none;
	}

	/* modify preview */
	div.workspace-leaf {
		contain: initial !important;
	}
	div.workspace-leaf-resize-handle {
		display: none;
	}
	div.view-header {
		display: none;
	}
	div.markdown-preview-view {
		padding: 0;
	}
	div.modal-content {
		margin: 0;
	}
</style>
