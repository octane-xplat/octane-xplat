// Share — native share sheet via @nativescript/social-share; share.file is
// per-OS (UIActivityViewController on iOS, FileProvider ACTION_SEND on
// Android) so the package owns the provider and result semantics.
import { isIOS } from '@nativescript/core'
import { shareText, shareUrl } from '@nativescript/social-share'
import { shareFile as shareFileAndroid } from './share-file.android'
import { shareFile as shareFileIos } from './share-file.ios'
import type { Share, ShareFileOptions, ShareResult } from './types'

const shareFile = isIOS ? shareFileIos : shareFileAndroid

/** Share service: iOS UIActivityViewController, Android ACTION_SEND,
 *  macOS NSSharingServicePicker. */
export const share: Share = {
	async text(text: string, subject?: string): Promise<ShareResult> {
		shareText(text, subject)
		return 'shared'
	},
	async url(url: string, title?: string): Promise<ShareResult> {
		shareUrl(url, title ?? url)
		return 'shared'
	},
	file(path: string, options?: ShareFileOptions): Promise<ShareResult> {
		return shareFile(path, options)
	},
}
