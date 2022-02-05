<script lang="ts">
	import type { TFile } from 'obsidian';
	import CardContainer from 'ui/CardContainer.svelte';

	// props
	export let files: TFile[];
</script>

<div class="modal">
	<div class="prompt-container">
		<!-- <div class="prompt-input" /> -->
		<input class="prompt-input" />
		<div class="prompt-instruction" />
	</div>

	<div class="cards-container">
		{#each files as file, id}
			{#if id < 10}
				<CardContainer {id} {file} />
			{/if}
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
