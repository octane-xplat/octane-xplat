// iOS share.file leaf — UIActivityViewController over a file URL, with the
// iPad popover anchor (an unanchored popover sheet crashes on present) and
// completionWithItemsHandler so dismissals resolve 'cancelled'. Native
// globals are read inside functions so the module stays import-safe in
// Android bundles, which carry both leaves.

import { Utils } from '@nativescript/core'
import { normalizeFilePath } from './share-paths'
import type { ShareFileOptions, ShareResult } from './types'

declare const UIApplication: any
declare const UIActivityViewController: any
declare const NSFileManager: any
declare const NSURL: any
declare const CGRectMake: any

function visibleViewController(): any {
	const app = UIApplication.sharedApplication
	const keyWindow = app.keyWindow || (app.windows.count > 0 && app.windows[0])
	// Utils.ios is only populated on iOS — typed as an empty bag elsewhere.
	const getVisible = (Utils.ios as any)?.getVisibleViewController
	return keyWindow && typeof getVisible === 'function'
		? getVisible(keyWindow.rootViewController)
		: null
}

export async function shareFile(path: string, _options?: ShareFileOptions): Promise<ShareResult> {
	const input = normalizeFilePath(path)
	if (input.kind === 'content') {
		throw new Error('share.file: content:// URIs are Android-only — pass a filesystem path on iOS')
	}

	if (!NSFileManager.defaultManager.fileExistsAtPath(input.path)) {
		return 'unavailable'
	}

	const presenter = visibleViewController()
	if (!presenter) {
		return 'unavailable'
	}

	return new Promise<ShareResult>((resolve) => {
		const sheet = UIActivityViewController.alloc().initWithActivityItemsApplicationActivities(
			[NSURL.fileURLWithPath(input.path)] as any,
			null,
		)

		sheet.completionWithItemsHandler = (_activity: any, completed: boolean) =>
			resolve(completed ? 'shared' : 'cancelled')

		// iPad presents activity sheets as popovers and crashes without an anchor.
		const popover = sheet.popoverPresentationController
		if (popover) {
			popover.sourceView = presenter.view
			popover.sourceRect = CGRectMake(
				presenter.view.bounds.size.width / 2,
				presenter.view.bounds.size.height - 1,
				1,
				1,
			)
		}

		presenter.presentViewControllerAnimatedCompletion(sheet, true, null)
	})
}
