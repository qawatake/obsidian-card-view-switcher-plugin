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
