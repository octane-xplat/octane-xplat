// macOS Core provider: TextField for AppKit — editable
// NSTextField. Text flows native -> Core through the NSTextFieldDelegate
// controlTextDidChange: callback (the notification NSControl forwards to
// its delegate), mirroring ui/text-field/index.ios.js's delegate contract.
import { TextFieldBase } from '@nativescript/core/ui/text-field/text-field-common';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { textProperty } from '@nativescript/core/ui/text-base';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/text-field/text-field-common';
class NSTextFieldDelegateImpl extends NSObject {
    static ObjCProtocols = [NSTextFieldDelegate];
    _owner;
    static initWithOwner(owner) {
        const impl = NSTextFieldDelegateImpl.new();
        impl._owner = owner;
        return impl;
    }
    controlTextDidChange(notification) {
        const owner = this._owner ? this._owner.deref() : null;
        if (!owner) {
            return;
        }
        const field = notification.object;
        textProperty.nativeValueChange(owner, String(field.stringValue));
    }
}
NativeClass(NSTextFieldDelegateImpl);
export class TextField extends TextFieldBase {
    nativeViewProtected;
    _delegate;
    createNativeView() {
        const field = NSTextField.alloc().init();
        field.editable = true;
        return field;
    }
    initNativeView() {
        super.initNativeView();
        this._delegate = NSTextFieldDelegateImpl.initWithOwner(new WeakRef(this));
        this.nativeViewProtected.delegate = this._delegate;
    }
    disposeNativeView() {
        if (this.nativeViewProtected) {
            this.nativeViewProtected.delegate = null;
        }
        this._delegate = null;
        super.disposeNativeView();
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
}
CSSType('TextField')(TextField);
