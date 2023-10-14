import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';
import ObsidianJsonSchemaPlugin from 'main';
import { App, ButtonComponent, DropdownComponent, Modal } from 'obsidian';
import { createFactory } from 'react';
import { createRoot } from 'react-dom/client';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { Root } from 'mdast';

/**
 * for main
import { CreateNoteModal } from 'src/CreateNoteModalCopy';

		this.addCommand({
			id: 'new_note_from_schema',
			name: 'new note from schema',
			callback: () => {
				new CreateNoteModal(this.app, this).open();
			}
		});
 */

export class CreateNoteModal extends Modal {
	selectedSchema: string 
	pendingFilePath: string = "untitled"
	plugin: ObsidianJsonSchemaPlugin

	constructor(app: App, plugin: ObsidianJsonSchemaPlugin) {
		super(app);
		this.plugin = plugin;
	}

	render() {
		const { contentEl } = this;
		contentEl.empty();

		let record: Record<string, string> = {};
		const options = Object.keys(this.plugin.schemaCache.state)
		if (options.length === 0) {
			contentEl.appendText("no schemas found");
			return;
		}

		// ! is safe because if (options.length === 0) check above 
		this.selectedSchema = options.first()!;
		for (const option of options) {
			record[option] = option
		}

		new DropdownComponent(contentEl)
			.setValue(this.selectedSchema)
			.onChange(((value) => this.selectedSchema = value))
			.addOptions(record)

		contentEl.appendChild(document.createElement('br'))

		new ButtonComponent(contentEl)
			.setButtonText("submit")
			.onClick(() => this.onSelect(this.selectedSchema));
	}

	async onSelect(selectedSchema: string) {
		const { contentEl } = this;
		const schema = await this.plugin.schemaCache.getSchema(selectedSchema);
		contentEl.empty();
		
		const form = createFactory(Form);
		const root = createRoot(contentEl)

		root.render(form({
			schema: schema,
			validator: validator,
			onChange: ((e) => console.log(e)),
			onSubmit: (async (document) => {
				const root = document.formData as Root;
				const file = await unified()
					.use(remarkStringify)
					.process(root);
			}),
			onError: ((e) => console.log(e)),
		}));
	}

	onOpen() {
		this.render();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
