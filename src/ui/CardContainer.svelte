<script lang="ts">
	import { app } from 'ui/store';
	import { setIcon, type TFile } from 'obsidian';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { ViewGenerator } from 'interfaces/ViewGenerator';

	// consts
	// extension: file type
	const FILE_TYPES = ['md', 'image', 'audio', 'movie', 'pdf'] as const;
	type FileType = typeof FILE_TYPES[number];
	const fileTypeMap: { [extension: string]: FileType } = {
		md: 'md',
		png: 'image',
		jpg: 'image',
		jpeg: 'image',
		gif: 'image',
		bmp: 'image',
		svg: 'image',
		mp3: 'audio',
		webm: 'audio',
		wav: 'audio',
		m4a: 'audio',
		ogg: 'audio',
		'3gp': 'audio',
		flac: 'audio',
		mp4: 'movie',
		ogv: 'movie',
		pdf: 'pdf',
	};
	// FileType: icon
	const fileIconMap = new Map<FileType | undefined, string>([
		['md', 'document'],
		['image', 'image-file'],
		['audio', 'audio-file'],
		['movie', 'play-audio-glyph'],
		['pdf', 'pdf-file'],
		[undefined, 'question-mark-glyph'],
	]);

	// props
	export let id: number;
	export let file: TFile;
	export let selected: boolean;

	// internal variables
	let contentContainerEl: HTMLElement;
	let iconContainerEl: HTMLElement;
	let renderer: ViewGenerator;
	const dispatch = createEventDispatcher();

	onMount(async () => {
		renderer = await new ViewGenerator($app, contentContainerEl, file).load(
			'preview'
		);
		setFileIcon(file);
	});

	onDestroy(() => {
		setTimeout(() => renderer.unload(), 1000);
	});

	function onClicked() {
		dispatch('click');
	}

	function setFileIcon(file: TFile) {
		iconContainerEl.empty();

		const iconId = fileIconMap.get(fileTypeMap[file.extension]);
		if (iconId === undefined) {
			return;
		}
		setIcon(iconContainerEl, iconId);
	}
</script>

<div
	class="card-container"
	class:is-selected={selected}
	data-id={id}
	data-path={file.path}
	on:click={onClicked}
>
	<div class="card-container-header">
		<div class="file-icon-container" bind:this={iconContainerEl} />
		<div class="file-name-container">{file.basename}</div>
	</div>

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

	.card-container-header {
		padding: 5px 10px;
		background-color: var(--background-secondary);
		display: flex;
		color: var(--text-muted);
	}

	.file-icon-container {
		padding-right: 10px;
	}

	.file-name-container {
		font-size: 1rem;
		line-height: 1.2rem;
		overflow-wrap: break-word;
		min-width: 0;
		flex: 1;
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
