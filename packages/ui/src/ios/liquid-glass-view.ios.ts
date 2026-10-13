import { LiquidGlass as NSLiquidGlass, Utils, type GlassEffectType } from '@nativescript/core'

// UIBlurEffectStyle.SystemMaterial = 8 (iOS 13+). Numeric spelling keeps
// NativeScript ambient const enums compatible with verbatimModuleSyntax.
const SYSTEM_MATERIAL_BLUR_STYLE = 8

/** Keep NativeScript's content host, layout and native-view lifecycle. */
export class LiquidGlassView extends NSLiquidGlass {
	createNativeView() {
		const view = super.createNativeView() as UIVisualEffectView
		if (!Utils.supportsGlass()) {
			view.effect = UIBlurEffect.effectWithStyle(SYSTEM_MATERIAL_BLUR_STYLE)
		}

		return view
	}

	protected _applyGlassEffect(
		value: GlassEffectType,
		options: Parameters<NSLiquidGlass['_applyGlassEffect']>[1],
	): UIVisualEffectView | undefined {
		if (!Utils.supportsGlass() && options.targetView) {
			// Core's native setter otherwise replaces the blur with an empty
			// UIVisualEffect on initial property replay and later prop updates.
			options.targetView.effect = UIBlurEffect.effectWithStyle(SYSTEM_MATERIAL_BLUR_STYLE)
			return undefined
		}

		return super._applyGlassEffect(value, options)
	}
}
