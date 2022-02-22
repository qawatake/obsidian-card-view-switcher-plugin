import {
	App,
	prepareFuzzySearch,
	prepareSimpleSearch,
	type SearchResult,
	type TFile,
} from 'obsidian';

export interface FilePathSearchResultItem extends FileSearchResultItem {
	file: TFile;
	name: SearchResult | null;
	path: SearchResult | null;
	content: undefined;
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
				content: undefined,
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
	path: SearchResult | null;
	content: SearchResult | null | undefined;
}

// results are sorted by last opened date (new -> old)
export async function searchInFiles(
	app: App,
	query: string,
	files: TFile[]
): Promise<FileSearchResultItem[]> {
	const search = prepareSimpleSearch(query);
	const items: FileSearchResultItem[] = [];
	for (const file of files) {
		const inName = search(file.name);
		const inPath = search(file.path);
		const inContent =
			file.extension === 'md'
				? search(await app.vault.cachedRead(file))
				: null;
		items.push({
			file: file,
			name: inName,
			path: inPath,
			content: inContent,
		});
	}
	return items.filter((item) => {
		return item.name !== null || item.content !== null;
	});
}

// interface FileWithContent {
// 	file: TFile;
// 	content: string | undefined; // undefined for non-md files
// }

// export class RecentSearch {
// 	private readonly app: App;
// 	private readonly files: TFile[];
// 	private filesWithContent: FileWithContent[];

// 	constructor(app: App, files: TFile[]) {
// 		this.app = app;
// 		this.files = files;
// 		this.filesWithContent = [];
// 	}

// 	async load(): Promise<RecentSearch> {
// 		await this.onload();
// 		return this;
// 	}

// 	async onload() {
// 		this.filesWithContent = [];
// 		const { files } = this;
// 		for (const file of files) {
// 			const content =
// 				file.extension === 'md'
// 					? await this.app.vault.cachedRead(file)
// 					: undefined;
// 			this.filesWithContent.push({
// 				file: file,
// 				content: content,
// 			});
// 		}
// 	}
// }
