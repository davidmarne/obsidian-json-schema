import { ItemView, WorkspaceLeaf } from 'obsidian';
import { stringify } from 'yaml';
import ObsidianJsonSchemaPlugin, { ERRORS_VIEW_TYPE_KEY } from 'main';



export class ErrorDetailsView extends ItemView {
	plugin: ObsidianJsonSchemaPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ObsidianJsonSchemaPlugin) {
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
		const container = this.containerEl.children[1];
		container.empty();
	}
}
