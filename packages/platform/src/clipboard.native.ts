// Clipboard — pasteboard via nativescript-clipboard (sync API wrapped async
// to keep the shared contract awaitable on both sides).
import { getTextSync, setTextSync } from 'nativescript-clipboard';

export const clipboard = {
	async write(text: string): Promise<boolean> {
		setTextSync(text);
		return true;
	},
	async read(): Promise<string | null> {
		try {
			return getTextSync();
		} catch {
			return null;
		}
	},
};
