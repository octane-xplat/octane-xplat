import {
	AbsoluteLayout,
	LiquidGlassContainer as NSLiquidGlassContainer,
} from '@nativescript/core'

/** Keep NativeScript's absolute layout and native-view lifecycle. */
export class LiquidGlassContainerView extends NSLiquidGlassContainer {
	/** Core 9.1.3 zeroes padding/border while measuring (NativeScript#11134), assuming the
	 *  parent already removed them. Mason and core parents pass the border-box spec, so
	 *  padded content measured at full width and overflowed by the padding (issue #37).
	 *  Measure as the AbsoluteLayout this view is; core's local-coordinate onLayout and
	 *  transform normalisation stay. */
	onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
		AbsoluteLayout.prototype.onMeasure.call(this, widthMeasureSpec, heightMeasureSpec)
	}
}
