// oxlint-disable-next-line xplat/no-nativescript-import -- Type-only import; the shared signature names the SDK Page while .ios/.android leaves hold runtime.
import type { Page } from '@nativescript/core'

/** Android creates its native Page view after Frame supplies the context. */
export function prepareNavigationPage(_page: Page): void {}
