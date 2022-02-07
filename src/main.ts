import { Switcher } from 'components/Switcher';
import { Plugin } from 'obsidian';

export default class CardViewSwitcherPlugin extends Plugin {
	override async onload() {
		this.addCommand({
			id: 'card-view-switcher:open',
			name: 'Open switcher',
			callback: () => {
				this.addChild(new Switcher(this.app));
			},
		});
	}

	// override onunload() {}
}
