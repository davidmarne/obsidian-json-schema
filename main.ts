import { Plugin, TAbstractFile, TFile } from 'obsidian';
import { ErrorsSummary, getMDAST, getMarkdownSchemaFileNameFromAst, validateFile } from 'src/validation';
import { nodeToSchema } from 'src/schemas';
import { ErrorDetailsView } from 'src/ErrorDetailsView';
import { DEFAULT_SETTINGS, ObsidianJsonSchemaSettings, ObsidianSchemaSettingsTab } from 'src/ObsidianSchemaSettings';
import { SchemaCacheManager } from 'src/SchemaCacheManager';

export const ERRORS_VIEW_TYPE_KEY = "example-view";


export interface SchemaCache {
	[path: string]: object;
}

interface ValidationState {
	[path: string]: ErrorsSummary;
}

export default class ObsidianJsonSchemaPlugin extends Plugin {
	settings: ObsidianJsonSchemaSettings;
	state: ValidationState = {};
	errorDetails: ErrorDetailsView;
	schemaCache: SchemaCacheManager;

	async onload() {
		await this.loadSettings();
		this.schemaCache = new SchemaCacheManager(this);

		const statusBar = this.addStatusBarItem();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ObsidianSchemaSettingsTab(this.app, this));
		this.registerView(ERRORS_VIEW_TYPE_KEY, (leaf) => {
			this.errorDetails = new ErrorDetailsView(leaf, this)
			return this.errorDetails;
		});

		const onState = () => {
			// update status bar
			const numLints = Object.values(this.state).reduce((a, b) => a += b.errors.length, 0);
			statusBar.setText(`${numLints} Schema Validation Errors`);

			// update error details panel if one exists
			this.errorDetails?.onState();
		}

		const revalidateFile = async (file: TAbstractFile) => {
			if (file instanceof TFile && (this.settings.autolint || this.state[file.path])) {
				validate(file)
			}
		}

		const validate = async (file: TFile) => {
			const errors = await validateFile(this.schemaCache, this.app.vault, file, this.settings.schemasDirectory);
			if (errors) {
				this.state[file.path] = errors
			} else {
				delete this.state[file.path]
			}
			onState();
		}

		const cleanupFile = async (file: TAbstractFile) => {
			if (file instanceof TFile && this.state[file.path]) {
				delete this.state[file.path]
				onState();
			}
		}

		// listen to file change events to update the schema cache or revalidate any md files
		this.registerEvent(this.app.vault.on("create", this.schemaCache.reloadFile.bind(this.schemaCache)));
		this.registerEvent(this.app.vault.on("modify", this.schemaCache.reloadFile.bind(this.schemaCache)));
		this.registerEvent(this.app.vault.on("rename", this.schemaCache.reloadFile.bind(this.schemaCache)));
		this.registerEvent(this.app.vault.on("delete", this.schemaCache.cleanupFile.bind(this.schemaCache)));
		this.registerEvent(this.app.vault.on("create", revalidateFile.bind(this)));
		this.registerEvent(this.app.vault.on("modify", revalidateFile.bind(this)));
		this.registerEvent(this.app.vault.on("rename", revalidateFile.bind(this)));
		this.registerEvent(this.app.vault.on("delete", cleanupFile.bind(this)));
		
		if (this.settings.autolint) {
			for (const tfile of this.app.vault.getMarkdownFiles()) {
				validate(tfile)
			}
		}

		const activateView = async () => {
			this.app.workspace.detachLeavesOfType(ERRORS_VIEW_TYPE_KEY);

			await this.app.workspace.getRightLeaf(false).setViewState({
				type: ERRORS_VIEW_TYPE_KEY,
				active: true,
			});

			this.app.workspace.revealLeaf(
				this.app.workspace.getLeavesOfType(ERRORS_VIEW_TYPE_KEY)[0]
			);
		}

		this.addCommand({
			id: 'show_schema_validation_errors',
			name: 'Show schema validation errors',
			callback: async () => {
				await activateView();
			}
		});

		this.addCommand({
			id: 'generate_mdast_schema_from_current_file',
			name: 'Generate schema from current file',
			editorCallback: async (editor, ctx) => {
				if (ctx.file) {
					const mdast = await getMDAST(this.app.vault, ctx.file);
					const schemaFileName = getMarkdownSchemaFileNameFromAst(this.settings.schemasDirectory, mdast);
					if (schemaFileName !== null) {
						const nts = nodeToSchema(mdast);
						this.app.vault.create(schemaFileName, JSON.stringify(nts));
					}
				}
			}
		});

		this.addCommand({
			id: 'validate_schema_for_current_file',
			name: 'Validate schema for current file',
			editorCallback(_, ctx) {
				if (ctx.file) {
					validate(ctx.file);
				}
			},
		});

		this.addCommand({
			id: 'validate_schema_for_all_files',
			name: 'Validate schema for all files',
			callback: () => {
				for (const tfile of this.app.vault.getMarkdownFiles()) {
					validate(tfile)
				}
			},
		});
	}

	onunload() {
		// no event listeners to cancel, registerEvents should handle disposal
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


