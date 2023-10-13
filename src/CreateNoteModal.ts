import { App, Modal } from 'obsidian';

export class CreateNoteModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
