// Provider override: macOS (AppKit) Label — NSTextField in label mode.
// Ported from ui/label/index.ios.js with UIKit text measurement replaced by
// NSTextField intrinsicContentSize/cell wrapping.
import { booleanConverter } from '@nativescript/core/ui/core/view-base';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { CoreTypes } from '@nativescript/core/core-types';
import { TextBase, whiteSpaceProperty, textOverflowProperty } from '@nativescript/core/ui/text-base';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/text-base';
export class Label extends TextBase {
    get textWrap() {
        return this.style.whiteSpace === 'normal';
    }
    set textWrap(value) {
        if (typeof value === 'string') {
            value = booleanConverter(value);
        }
        this.style.whiteSpace = value ? 'normal' : 'nowrap';
    }
    createNativeView() {
        const field = NSTextField.labelWithString('');
        field.editable = false;
        field.selectable = false;
        field.bezeled = false;
        field.drawsBackground = false;
        // let intrinsicContentSize reflect the string (multi-line aware)
        field.cell.wraps = true;
        field.cell.lineBreakMode = 4; // NSLineBreakByWordWrapping
        field.maximumNumberOfLines = 0;
        return field;
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
            // Cap preferred layout width so intrinsic size reflects wrapping.
            if (widthMode !== layout.UNSPECIFIED) {
                const dips = layout.toDeviceIndependentPixels(width);
                nativeView.preferredMaxLayoutWidth = dips;
                nativeView.cell.wraps = true;
            }
            else {
                nativeView.preferredMaxLayoutWidth = 0;
                nativeView.cell.wraps = false;
            }
            const fitting = nativeView.intrinsicContentSize;
            const finiteW = fitting && fitting.width >= 0 ? fitting.width : 0;
            const finiteH = fitting && fitting.height >= 0 ? fitting.height : 0;
            const nativeWidth = widthMode === layout.EXACTLY ? width : layout.round(layout.toDevicePixels(finiteW));
            const nativeHeight = heightMode === layout.EXACTLY ? height : layout.round(layout.toDevicePixels(finiteH));
            const widthAndState = View.resolveSizeAndState(nativeWidth, width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(nativeHeight, height, heightMode, 0);
            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }
    [whiteSpaceProperty.setNative](_value) {
        this._updateTextWrap();
    }
    [textOverflowProperty.setNative](_value) {
        this._updateTextWrap();
    }
    _updateTextWrap() {
        const view = this.nativeViewProtected;
        if (!view) {
            return;
        }
        const wrap = this.whiteSpace === 'normal';
        view.cell.wraps = wrap && this.maxLines !== 1;
        if (!wrap) {
            view.maximumNumberOfLines = 1;
            view.cell.lineBreakMode = this.textOverflow === 'ellipsis' ? 2 /* byTruncatingTail */ : 0; /* byClipping */
        }
        else {
            view.maximumNumberOfLines = this.maxLines || 0;
            view.cell.lineBreakMode = 4; /* byWordWrapping */
        }
    }
}
CSSType('Label')(Label);
