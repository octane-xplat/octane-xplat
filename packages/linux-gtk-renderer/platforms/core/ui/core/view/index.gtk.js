// oxlint-disable-next-line xplat/no-ns-deep-import -- Provider leaves must avoid importing their own root barrel.
import { ViewBase } from '@nativescript/core/ui/core/view-base'
export * from '@nativescript/core/ui/core/view-base'
export * from '@nativescript/core/ui/core/properties'

export class View extends ViewBase {
  get gtk() {
    return this.nativeViewProtected
  }
  get visibility() {
    return this._visibility ?? 'visible'
  }
  set visibility(value) {
    this._visibility = value
    this.gtk?.set_visible(value === 'visible')
  }
  get isCollapsed() {
    return this.visibility === 'collapse'
  }
  requestLayout() {
    this.gtk?.queue_resize()
  }
}

export class ContainerView extends View {}
export class LayoutBase extends ContainerView {}
