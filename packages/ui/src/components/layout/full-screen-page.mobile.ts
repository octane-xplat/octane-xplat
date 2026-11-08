import { isIOS, type Page } from '@nativescript/core'
import { wrapFullScreenPageMeasure } from './full-screen-page-measure'

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
  if (isIOS) {
    wrapFullScreenPageMeasure(page)
  }

  return page
}
