import {
	App,
	prepareFuzzySearch,
	prepareSimpleSearch,
	type SearchResult,
	type TFile,
} from 'obsidian';

export interface FilePathSearchResultItem {
	file: TFile;
	name: SearchResult | null;
	path: SearchResult | null;
}

export function fuzzySearchInFilePaths(
	query: string,
	files: TFile[]
): FilePathSearchResultItem[] {
	const fuzzy = prepareFuzzySearch(query);
	return files
		.map((file) => {
			const matchInFile = fuzzy(file.basename);
			const matchInPath = fuzzy(file.path);
			return {
				file: file,
				name: matchInFile,
				path: matchInPath,
			};
		})
		.filter((item) => {
			return item.path !== null;
		});
}

export function sortResultItemsInFilePathSearch(
	items: FilePathSearchResultItem[]
): FilePathSearchResultItem[] {
	return items.sort((a, b) => {
		if (a.name === null && b.name === null) {
			return 0;
		}

		if (a.path !== null && b.path !== null) {
			if (a.name === null || b.name === null) return 0;
			if (a.name.score !== b.name.score) {
				return b.name?.score - a.name?.score;
			}

			return a.file.name <= b.file.name ? -1 : 1;
		}

		return a.name === null ? 1 : -1;
	});
}

export interface FileSearchResultItem {
	file: TFile;
	name: SearchResult | null;
	content: SearchResult | null;
}

export function searchInFiles(
	app: App,
	query: string,
	files: TFile[]
): FileSearchResultItem[] {
	const search = prepareSimpleSearch(query);
	const items: FileSearchResultItem[] = [];
	files.forEach(async (file) => {
		const inName = search(file.name);
		const inContent = search(await app.vault.cachedRead(file));
		items.push({ file: file, name: inName, content: inContent });
	});
	return items.filter((item) => {
		return item.name !== null && item.content !== null;
	});
}
