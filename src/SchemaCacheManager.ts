import { TAbstractFile, TFile } from 'obsidian';
import MyPlugin, { SchemaCache } from 'main';


export class SchemaCacheManager {
	state: SchemaCache = {};
	plugin: MyPlugin;

	constructor(plugin: MyPlugin) {
		this.plugin = plugin;
		plugin.app.vault.on("create", this.reloadFile);
		plugin.app.vault.on("modify", this.reloadFile);
		plugin.app.vault.on("rename", this.reloadFile);
		plugin.app.vault.on("delete", this.cleanupFile);
	}

	async getSchema(path: string) {
		if (!this.state[path]) {
			const file = this.plugin.app.vault.getAbstractFileByPath(path);
			if (file) {
				await this.reloadFile(file);
			}
		}
		return this.state[path];
	}

	isSchemaFile(file: TAbstractFile) {
		return file.path.startsWith(this.plugin.settings.schemasDirectory);
	}

	async reloadFile(file: TAbstractFile) {
		if (file instanceof TFile && this.isSchemaFile(file)) {
			const fileContent = await this.plugin.app.vault.read(file);
			this.state[file.path] = JSON.parse(fileContent);
		}
	}

	cleanupFile(file: TAbstractFile) {
		if (file instanceof TFile && this.isSchemaFile(file) && this.state[file.path]) {
			delete this.state[file.path];
		}
	}
}
