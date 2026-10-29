import { isIOS, Utils, type Page } from '@nativescript/core'

const preparedPages = new WeakSet<Page>()

/**
 * Let SafeArea own system-bar padding in a NativeScript Page, including pages
 * navigated by a Frame. Call before rendering content; the host still controls
 * the Page's bounds (this does not cover navigation bars or a containing tab).
 * @example
 * import { Page } from '@nativescript/core'
 * import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'
 * const page = prepareFullScreenPage(new Page())
 * page.actionBarHidden = true
 */
export function prepareFullScreenPage<T extends Page>(page: T): T {
	page.iosIgnoreSafeArea = true
	page.androidOverflowEdge = 'ignore'
	if (isIOS && !preparedPages.has(page)) {
		preparedPages.add(page)
		const measure = page.measure
		page.measure = function (widthMeasureSpec, heightMeasureSpec) {
			// Core 9.1.3 measures a Page against safeAreaLayoutGuide even when it
			// ignores safe areas, then lays its child out in the full native frame.
			// Wrap measure (not onMeasure): core caches these specs before resolving
			// child percentages, which must use the same size as native layout.
			const size = this.nativeViewProtected?.bounds?.size
			if (size?.width > 0 && size?.height > 0) {
				const { layout } = Utils
				widthMeasureSpec = layout.makeMeasureSpec(layout.toDevicePixels(size.width), layout.EXACTLY)
				heightMeasureSpec = layout.makeMeasureSpec(
					layout.toDevicePixels(size.height),
					layout.EXACTLY,
				)
			}
			measure.call(this, widthMeasureSpec, heightMeasureSpec)
		}
	}
	return page
}
