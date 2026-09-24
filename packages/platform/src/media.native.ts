// Media picking — @nativescript/imagepicker presents the system picker and
// yields ImageAssets; the FileRef uri is the asset's file path.
import { create as createImagePicker } from '@nativescript/imagepicker';
import type { FileRef } from './files.web';

export const media = {
	async pickImage(): Promise<FileRef | null> {
		const picker = createImagePicker({ mode: 'single' });
		await picker.authorize();
		const [asset] = await picker.present();
		if (!asset) return null;
		const uri = (asset as any).ios ?? (asset as any).android ?? '';
		return { name: 'image', uri: String(uri) };
	},
};
