import { ItemView, WorkspaceLeaf } from 'obsidian';
import { stringify } from 'yaml';
import MyPlugin, { ERRORS_VIEW_TYPE_KEY } from 'main';



export class ErrorDetailsView extends ItemView {
	plugin: MyPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return ERRORS_VIEW_TYPE_KEY;
	}

	getDisplayText() {
		return "Example view";
	}

	async onState() {
		await this.render();
	}

	async onOpen() {
		await this.render();
	}

	async render() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "Example view" });
		container.createEl("pre", { text: Object.keys(this.plugin.state).length > 0 ? stringify(this.plugin.state) : "no validation errors" });
	}

	async onClose() {
		// Nothing to clean up.
	}
}
