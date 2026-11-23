// macOS Core provider: AppKit imports HTML into a selectable text field.
import { HtmlViewBase, htmlProperty, selectableProperty } from '@nativescript/core/ui/html-view/html-view-common';
import { lineHeightProperty, textAlignmentProperty } from '@nativescript/core/ui/text-base/text-base-common';
import { colorProperty, fontInternalProperty } from '@nativescript/core/ui/styling/style-properties';
import { Color } from '@nativescript/core/color';
import { Font } from '@nativescript/core/ui/styling/font';
import { layout } from '@nativescript/core/utils';
import { parseHtmlText } from '../../../../../src/html-text';

export * from '@nativescript/core/ui/html-view/html-view-common';
export class HtmlView extends HtmlViewBase {
    createNativeView() {
        const field = NSTextField.wrappingLabelWithString('');
        field.editable = false;
        field.selectable = true;
        field.drawsBackground = false;
        field.font = NSFont.systemFontOfSize(16);
        field.textColor = NSColor.labelColor;
        return field;
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [htmlProperty.getDefault]() {
        return '';
    }
    [htmlProperty.setNative](value) {
        this._refreshHtml(value);
    }
    [selectableProperty.getDefault]() {
        return true;
    }
    [selectableProperty.setNative](value) {
        this.nativeViewProtected.selectable = value;
    }
    [fontInternalProperty.getDefault]() {
        return this.nativeViewProtected.font;
    }
    [fontInternalProperty.setNative](value) {
        const view = this.nativeViewProtected;
        view.font = value instanceof Font ? value.getUIFont(view.font) : value;
        this._refreshHtml();
    }
    [colorProperty.getDefault]() {
        return NSColor.labelColor;
    }
    [colorProperty.setNative](value) {
        this.nativeViewProtected.textColor = value instanceof Color ? value.macos : value ?? NSColor.labelColor;
        this._refreshHtml();
    }
    [textAlignmentProperty.setNative]() {
        this._refreshHtml();
    }
    [lineHeightProperty.setNative]() {
        this._refreshHtml();
    }
    _refreshHtml(html = this.html) {
        const view = this.nativeViewProtected;
        // Setting attributedStringValue can change the field's textColor.
        // Supply the current Core color to the field and the importer.
        const color = this.style.color?.macos ?? NSColor.labelColor;
        view.textColor = color;
        view.attributedStringValue = parseHtmlText(html, {
            fontSize: Number(view.font.pointSize),
            fontFamily: String(view.font.familyName),
            fontWeight: this.style.fontWeight ?? '400',
            color,
            appearance: view.effectiveAppearance,
            style: { fontStyle: this.style.fontStyle, textAlign: this.style.textAlignment, lineHeight: this.style.lineHeight },
        });
        view.invalidateIntrinsicContentSize();
        this.requestLayout();
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const view = this.nativeViewProtected;
        if (view) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const constrained = layout.getMeasureSpecMode(widthMeasureSpec) !== layout.UNSPECIFIED;
            view.preferredMaxLayoutWidth = constrained ? layout.toDeviceIndependentPixels(width) : 0;
        }
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }
}
