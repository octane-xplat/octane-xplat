// The GTK layout manager owns the Mason tree and style. The shared driver's
// mobile adapter is bypassed for this provider.
import { LayoutBase } from '@nativescript/core'
export { LayoutBase as View, LayoutBase as Scroll }
export class Style {
  static fromView() {
    throw new Error('GTK Mason layout is owned by the GTK layout manager')
  }
}
