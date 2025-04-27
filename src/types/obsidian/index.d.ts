import type { Plugin } from "obsidian";

export * from "obsidian";

declare module "obsidian" {
	interface App {
		dom: AppDom;
		plugins: { plugins: PluginMap };
	}

	type PluginMap = {
		[pluginId: string]: Plugin;
	};

	interface AppDom {
		appContainerEl: HTMLElement;
	}

	interface Vault {
		config: BuiltInConfig;
	}

	interface BuiltInConfig {
		legacyEditor: boolean;
	}

	interface WorkspaceLeaf {
		id: string;
		containerEl: HTMLElement;
		tabHeaderEl: HTMLElement;
	}

	interface WorkspaceSidedock {
		children: WorkspaceSidedockTabParent[];
	}

	interface WorkspaceSidedockTabParent {
		children: WorkspaceLeaf[];
		type: "tabs";
	}

	interface WorkspaceSplit {
		containerEl: HTMLElement;
	}

	interface Editor {
		addHighlights(ranges: EditorRange[], cls: string): void;
		removeHighlights(cls: string): void;
	}
}
