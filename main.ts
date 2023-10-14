import { ErrorObject } from 'ajv';
import { Plugin, TAbstractFile, TFile } from 'obsidian';
import { getMDAST, getMarkdownSchemaFileNameFromAst, validateFile } from 'src/validation';
import { nodeToSchema } from 'src/schemas';
import { ErrorDetailsView } from 'src/ErrorDetailsView';
import { DEFAULT_SETTINGS, ObsidianJsonSchemaSettings, ObsidianSchemaSettingsTab } from 'src/ObsidianSchemaSettings';
import { SchemaCacheManager } from 'src/SchemaCacheManager';

export const ERRORS_VIEW_TYPE_KEY = "example-view";


export interface SchemaCache {
	[path: string]: object;
}

interface ValidationState {
	[path: string]: ErrorObject[];
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
			const numLints = Object.values(this.state).reduce((a, b) => a += b.length, 0);
			statusBar.setText(`${numLints} Schema Validation Errors`);

			// update error details panel if one exists
			this.errorDetails?.onState();
		}

		const revalidateFile = async (file: TAbstractFile) => {
			if (file instanceof TFile) {
				const errors = await validateFile(this.schemaCache, this.app.vault, file, this.settings.schemasDirectory);
				if (errors) {
					this.state[file.path] = errors
				} else {
					delete this.state[file.path]
				}
				onState();
			}

		}

		const cleanupFile = async (file: TAbstractFile) => {
			if (file instanceof TFile && this.state[file.path]) {
				delete this.state[file.path]
				onState();
			}
		}

		if (this.settings.autolint) {
			this.app.vault.on("create", revalidateFile);
			this.app.vault.on("modify", revalidateFile);
			this.app.vault.on("rename", revalidateFile);
			this.app.vault.on("delete", cleanupFile);
			for (const tfile of this.app.vault.getMarkdownFiles()) {
				revalidateFile(tfile)
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
			name: 'show schema validation errors',
			callback: async () => {
				await activateView();
			}
		});

		this.addCommand({
			id: 'generate_mdast_schema_from_current_file',
			name: 'generate schema from current file',
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
			name: 'validate schema for current file',
			editorCallback(_, ctx) {
				if (ctx.file) {
					revalidateFile(ctx.file);
				}
			},
		});
	}

	onunload() {
		// TODO: cleanup file event listeners
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


