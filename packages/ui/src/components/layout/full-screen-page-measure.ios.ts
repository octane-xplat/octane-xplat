import { Utils, type Page } from '@nativescript/core'

const preparedPages = new WeakSet<Page>()

/**
 * Wrap a prepared Page's `measure` so its content resolves percentages
 * against the full native bounds. Installed once per Page.
 * @internal
 */
export function wrapFullScreenPageMeasure(page: Page): void {
  if (preparedPages.has(page)) {
    return
  }
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
