import {
	GridLayout,
	LiquidGlass as NSLiquidGlass,
	Utils,
	type GlassEffectType,
} from '@nativescript/core'
import { UIBlurEffect, UIVisualEffectView } from '@octane-xplat/platform/ios'

// UIBlurEffectStyle.SystemMaterial = 8 (iOS 13+). Numeric spelling keeps
// NativeScript ambient const enums compatible with verbatimModuleSyntax.
const SYSTEM_MATERIAL_BLUR_STYLE = 8

/** Keep NativeScript's content host, layout and native-view lifecycle. */
export class LiquidGlassView extends NSLiquidGlass {
	/** Core 9.1.3 zeroes padding/border while measuring (NativeScript#11134), assuming the
	 *  parent already removed them. Mason and core parents pass the border-box spec, so
	 *  padded content measured at full width and overflowed by the padding (issue #37).
	 *  Measure as the GridLayout this view is; core's local-coordinate onLayout stays. */
	onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
		GridLayout.prototype.onMeasure.call(this, widthMeasureSpec, heightMeasureSpec)
	}

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
