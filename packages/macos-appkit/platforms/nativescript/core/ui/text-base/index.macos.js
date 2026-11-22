// Provider override: macOS (AppKit) TextBase — text properties applied to an
// NSTextField in label mode via stringValue / attributedStringValue.
// Simplified port of ui/text-base/index.ios.js (formatted strings handled
// with NSMutableAttributedString; iOS-only features dropped).
import { getClosestPropertyValue, TextBaseCommon, textProperty, formattedTextProperty, textAlignmentProperty, textTransformProperty, resetSymbol } from '@nativescript/core/ui/text-base/text-base-common';
import { Color } from '@nativescript/core/color';
import { Font } from '@nativescript/core/ui/styling/font';
import { colorProperty, fontInternalProperty } from '@nativescript/core/ui/styling/style-properties';
import { isString, isNullOrUndefined } from '@nativescript/core/utils/types';
export * from '@nativescript/core/ui/text-base/text-base-common';
const NS_LEFT = 0;
const NS_RIGHT = 1;
const NS_CENTER = 2;
const NS_JUSTIFIED = 3;
export class TextBase extends TextBaseCommon {
    // Native default captured at view init — prop removal must restore the
    // field's own default (labelWithString uses labelColor; an editable field
    // uses controlTextColor), which nil does not reproduce on the cell.
    _defaultTextColor;
    initNativeView() {
        super.initNativeView();
        const view = this.nativeTextViewProtected;
        if (view && !this._defaultTextColor) {
            this._defaultTextColor = view.textColor;
        }
    }
    get nativeTextViewProtected() {
        return super.nativeTextViewProtected;
    }
    [textProperty.getDefault]() {
        return resetSymbol;
    }
    [textProperty.setNative](value) {
        const reset = value === resetSymbol;
        if (!reset && this.formattedText) {
            return;
        }
        this._setNativeText(reset);
        this._requestLayoutOnTextChanged();
    }
    [formattedTextProperty.setNative](value) {
        this._setNativeText();
        textProperty.nativeValueChange(this, !value ? '' : value.toString());
        this._requestLayoutOnTextChanged();
    }
    [colorProperty.getDefault]() {
        const nativeView = this.nativeTextViewProtected;
        return nativeView ? nativeView.textColor : undefined;
    }
    [colorProperty.setNative](value) {
        const color = value instanceof Color ? value.macos : value;
        const view = this.nativeTextViewProtected;
        if (view) {
            // Restore the field's own default when the prop is removed — nil leaves
            // the cell's color empty rather than labelColor/controlTextColor.
            view.textColor = color ?? this._defaultTextColor ?? null;
        }
    }
    [fontInternalProperty.getDefault]() {
        const nativeView = this.nativeTextViewProtected;
        return nativeView ? nativeView.font : undefined;
    }
    [fontInternalProperty.setNative](value) {
        const view = this.nativeTextViewProtected;
        if (!view)
            {return;}
        // nil restores the control's default font (unconditional like iOS)
        view.font = value instanceof Font ? value.getUIFont(view.font) : value;
    }
    [textAlignmentProperty.setNative](value) {
        const view = this.nativeTextViewProtected;
        if (!view)
            {return;}
        switch (value) {
            case 'left':
            case 'initial':
                view.alignment = NS_LEFT;
                break;
            case 'center':
                view.alignment = NS_CENTER;
                break;
            case 'right':
                view.alignment = NS_RIGHT;
                break;
            case 'justify':
                view.alignment = NS_JUSTIFIED;
                break;
        }
    }
    [textTransformProperty.setNative](_value) {
        this._setNativeText();
    }
    _setNativeText(reset = false) {
        const view = this.nativeTextViewProtected;
        if (!view) {
            return;
        }
        if (reset) {
            view.stringValue = '';
            view.attributedStringValue = NSAttributedString.alloc().initWithString('');
            return;
        }
        if (this.formattedText) {
            view.attributedStringValue = this.createAttributedString(this.formattedText);
        }
        else {
            const text = getTransformedText(isNullOrUndefined(this.text) ? '' : `${this.text}`, this.textTransform);
            view.stringValue = text;
        }
    }
    createAttributedString(formattedString) {
        const result = NSMutableAttributedString.alloc().init();
        if (formattedString && formattedString.parent) {
            const spans = formattedString.spans;
            for (let i = 0, length = spans.length; i < length; i++) {
                const span = spans.getItem(i);
                const text = isNullOrUndefined(span.text) ? '' : `${span.text}`;
                let spanText = text;
                const transform = formattedString.parent.textTransform;
                if (transform !== 'none' && transform !== 'initial') {
                    spanText = getTransformedText(text, transform);
                }
                const attrs = NSMutableDictionary.alloc().init();
                const font = new Font(span.style.fontFamily, span.style.fontSize, span.style.fontStyle, span.style.fontWeight);
                const nativeFont = font.getUIFont(this.nativeTextViewProtected.font);
                if (nativeFont) {
                    attrs.setObjectForKey(nativeFont, NSFontAttributeName);
                }
                const fg = span.color || span.parent.color;
                if (fg && fg.macos) {
                    attrs.setObjectForKey(fg.macos, NSForegroundColorAttributeName);
                }
                result.appendAttributedString(NSAttributedString.alloc().initWithStringAttributes(spanText, attrs));
            }
        }
        return result;
    }
}
export function getTransformedText(text, textTransform) {
    if (!text || !isString(text)) {
        return '';
    }
    const ns = NSString.stringWithString(text instanceof NSAttributedString ? String(text.string) : text);
    switch (textTransform) {
        case 'uppercase':
            return ns.localizedUppercaseString;
        case 'lowercase':
            return ns.localizedLowercaseString;
        case 'capitalize':
            return ns.localizedCapitalizedString;
        default:
            return text;
    }
}
