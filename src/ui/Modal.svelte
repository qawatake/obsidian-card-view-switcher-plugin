<script lang="ts">
	import type { TFile } from 'obsidian';
	import CardContainer from 'ui/CardContainer.svelte';

	// props
	export let files: TFile[];
</script>

<div class="modal">
	<div class="prompt-container">
		<div class="prompt-input" />
		<div class="prompt-instruction" />
	</div>

	<div class="cards-container">
		{#each files as file, id}
			<CardContainer {id} {file} />
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
	}

	.cards-container {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-rows: repeat(attr(data-row), 1fr);
		grid-gap: 20px;
		height: 100%;
		width: 100%;
	}
</style>
