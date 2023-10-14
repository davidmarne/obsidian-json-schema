import { App, PluginSettingTab, Setting } from 'obsidian';
import ObsidianJsonSchemaPlugin from 'main';


export interface ObsidianJsonSchemaSettings {
	schemasDirectory: string;
	autolint: boolean;
}

export const DEFAULT_SETTINGS: ObsidianJsonSchemaSettings = {
	schemasDirectory: 'schemas' ,
	autolint: true,
}


export class ObsidianSchemaSettingsTab extends PluginSettingTab {
	plugin: ObsidianJsonSchemaPlugin;

	constructor(app: App, plugin: ObsidianJsonSchemaPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Schema Directory')
			.setDesc('Directory where json schemas for notes live')
			.addSearch((search) => search
				.setPlaceholder('Enter your schema directory')
				.setValue(this.plugin.settings.schemasDirectory)
				.onChange(async (value) => {
					this.plugin.settings.schemasDirectory = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto lint')
			.setDesc('Automatically re-lint all files when they change. If false, use the "validate schema for current file" command to lint the current file.')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autolint)
				.onChange(async (value) => {
					this.plugin.settings.autolint = value;
					await this.plugin.saveSettings();
				}));
	}
}
