import { View, Utils, type GlassEffectType } from '@nativescript/core'
import { ELEMENTS } from '@nativescript-community/octane'
import { UIBlurEffect, UIVisualEffect, UIVisualEffectView } from '@octane-xplat/platform/ios'

const SYSTEM_MATERIAL_BLUR_STYLE = 8

type MasonMaterialConstructor = new () => View

function masonMaterialClass(): MasonMaterialConstructor {
  const registered = ELEMENTS.get('masonview')
  const material =
    registered && 'materialViewClass' in registered ? registered.materialViewClass : undefined

  if (typeof material !== 'function' || !(material.prototype instanceof View)) {
    throw new Error('LiquidGlass requires Mason core with a native material layout root.')
  }

  // The registry erases the concrete host constructor. Validate the material
  // capability and core ancestry once, then inherit Mason's complete lifecycle.
  return material as MasonMaterialConstructor
}

/** One Mason box whose native root is UIKit's supported effect/content host. */
export abstract class MasonMaterialView extends masonMaterialClass() {
  protected abstract get materialEffectType(): 'glass' | 'container'
  private materialView: UIVisualEffectView | undefined

  constructor() {
    super()
    this.installMaterial(this.ios)
  }

  createNativeView(): UIVisualEffectView {
    const view = super.createNativeView()

    if (!(view instanceof UIVisualEffectView)) {
      throw new Error('Mason did not create a UIKit material layout root.')
    }

    if (!this.materialView) {
      this.installMaterial(view)
    }

    return view
  }

  private initialEffect(): UIVisualEffect {
    return !Utils.supportsGlass() && this.materialEffectType === 'glass'
      ? UIBlurEffect.effectWithStyle(SYSTEM_MATERIAL_BLUR_STYLE)
      : UIVisualEffect.new()
  }

  private installMaterial(view: unknown): void {
    if (!(view instanceof UIVisualEffectView)) {
      throw new Error('Mason did not create a UIKit material layout root.')
    }

    view.effect = this.initialEffect()
    this.materialView = view
  }

  protected _applyGlassEffect(
    value: GlassEffectType,
    options: Parameters<View['_applyGlassEffect']>[1],
  ): UIVisualEffectView | undefined {
    const targetView = this.materialView

    if (!targetView) {
      return undefined
    }

    if (!Utils.supportsGlass()) {
      // Core would replace the older-system blur with an empty effect on replay.
      // A grouping region remains an inert layout host on those systems.
      targetView.effect = this.initialEffect()
      return undefined
    }

    return super._applyGlassEffect(value, {
      ...options,
      effectType: this.materialEffectType,
      targetView,
      toGlassStyleFn: (variant) => (variant === 'clear' ? 1 : 0),
    })
  }

  disposeNativeView(): void {
    this.materialView = undefined
    super.disposeNativeView()
  }
}

export class LiquidGlassView extends MasonMaterialView {
  protected get materialEffectType(): 'glass' {
    return 'glass'
  }
}
