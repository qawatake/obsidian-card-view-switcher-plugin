import type CardViewSwitcherPlugin from 'main';
import type { App } from 'obsidian';
import { writable } from 'svelte/store';

export const app = writable<App>();
export const plugin = writable<CardViewSwitcherPlugin>();

export const selectedCardId = writable<number | undefined>();
