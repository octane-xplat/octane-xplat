// Share — native share sheet via @nativescript/social-share.
import { shareText, shareUrl } from '@nativescript/social-share';

export const share = {
	async text(text: string, subject?: string): Promise<'shared'> {
		shareText(text, subject);
		return 'shared';
	},
	async url(url: string, title?: string): Promise<'shared'> {
		shareUrl(url, title ?? url);
		return 'shared';
	},
};
