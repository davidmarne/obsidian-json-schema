import { ItemView, TFile, WorkspaceLeaf, renderResults } from 'obsidian';
import { createElement, createFactory } from 'react';
import { createRoot } from 'react-dom/client';
import ObsidianJsonSchemaPlugin, { ERRORS_VIEW_TYPE_KEY } from 'main';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { stringify } from 'yaml';
import List from '@mui/material/List';
import { ErrorSummary, ErrorsSummary, SchemaPathPartLocation, SchemaPathPartSelection } from './validation';


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
		return "Validation Results";
	}

	getIcon() {
		return "alert-triangle";
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
		container.createEl("h4", { text:"Validation Results" });
		for (const [k, v] of Object.entries(this.plugin.state)) {
			const details = container.createEl("details");
			details.createEl("summary", { text: k });
			for (const err of v.errors) {
				const innerDetails = details.createEl("details");
				innerDetails.setCssStyles({paddingLeft: '10px'})
				const summary = innerDetails.createEl("summary")
				summary.createSpan({text: `${err.errorDetails.message} `})
				const jump = summary.createEl("a", {text: "(jump)"})
				this.registerDomEvent(jump, 'click', (e) => {
					this.jumpToLocation(v.file, err.schemaPath.last()!.location);
					e.preventDefault();
				})
				const pre = innerDetails.createEl("pre", {text: stringify(err.errorDetails)})
				pre.setCssStyles({paddingLeft: '20px'})
			}
		}
	}

	async jumpToLocation(file: TFile, loc: SchemaPathPartSelection) {
		await this.plugin.app.workspace.getLeaf(false).openFile(file);
		this.plugin.app.workspace.activeEditor!.editor?.setSelection({
			ch: loc.end.char - 1,
			line: loc.end.line - 1,
		},{
			ch: loc.start.char - 1,
			line: loc.start.line - 1,
		})
	}

	async onClose() {
		const container = this.containerEl.children[1];
		container.empty();
	}
}
