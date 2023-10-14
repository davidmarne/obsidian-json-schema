import { TAbstractFile, TFile } from 'obsidian';
import ObsidianJsonSchemaPlugin, { SchemaCache } from 'main';


export class SchemaCacheManager {
	state: SchemaCache = {};
	plugin: ObsidianJsonSchemaPlugin;

	constructor(plugin: ObsidianJsonSchemaPlugin) {
		this.plugin = plugin;
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
