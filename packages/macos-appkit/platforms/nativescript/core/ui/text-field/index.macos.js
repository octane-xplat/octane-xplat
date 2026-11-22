// macOS Core provider: TextField for AppKit — editable
// NSTextField. Text flows native -> Core through the NSTextFieldDelegate
// controlTextDidChange: callback (the notification NSControl forwards to
// its delegate), mirroring ui/text-field/index.ios.js's delegate contract.
import { TextFieldBase, secureProperty } from '@nativescript/core/ui/text-field/text-field-common';
import { View, CSSType, isEnabledProperty } from '@nativescript/core/ui/core/view';
import { editableProperty, hintProperty } from '@nativescript/core/ui/editable-text-base';
import { textProperty } from '@nativescript/core/ui/text-base';
import { layout } from '@nativescript/core/utils';
import { registerGestureClass } from '../../../../../src/gestures';
import { swapTextFieldCell } from '../../../../../src/text-field-cell';
export * from '@nativescript/core/ui/text-field/text-field-common';

const fieldOwners = new WeakMap();
class CoreTextField extends NSSecureTextField {
    becomeFirstResponder() {
        const accepted = super.becomeFirstResponder();
        if (accepted) {
            fieldOwners.get(this)?._setEditing(true);
        }
        return accepted;
    }
}
registerGestureClass(CoreTextField);

class NSTextFieldDelegateImpl extends NSObject {
    static ObjCProtocols = [NSTextFieldDelegate];
    static ObjCExposedMethods = {
        'xplatCoreTextFieldSubmitted:': { params: [interop.types.id], returns: interop.types.void },
    };
    _owner;
    static initWithOwner(owner) {
        const impl = NSTextFieldDelegateImpl.new();
        impl._owner = owner;
        return impl;
    }
    controlTextDidChange(notification) {
        const owner = this._owner?.deref();
        if (owner && !owner._swappingCell && owner.updateTextTrigger === 'textChanged') {
            textProperty.nativeValueChange(owner, String(notification.object.stringValue));
        }
    }
    controlTextDidBeginEditing() {
        this._owner?.deref()?._setEditing(true);
    }
    controlTextDidEndEditing(notification) {
        const owner = this._owner?.deref();
        if (owner && !owner._swappingCell) {
            if (owner.updateTextTrigger === 'focusLost') {
                textProperty.nativeValueChange(owner, String(notification.object.stringValue));
            }
            owner._setEditing(false);
        }
    }
    ['xplatCoreTextFieldSubmitted:'](field) {
        const owner = this._owner?.deref();
        const editor = field.currentEditor();
        const marked = editor?.hasMarkedText;
        if (owner && !owner._swappingCell && !(typeof marked === 'function' ? marked.call(editor) : marked)) {
            owner.notify({ eventName: TextFieldBase.returnPressEvent, object: owner });
        }
    }
}
registerGestureClass(NSTextFieldDelegateImpl);
export class TextField extends TextFieldBase {
    nativeViewProtected;
    _delegate;
    _swappingCell = false;
    _editing = false;
    _setEditing(editing) {
        if (!this._swappingCell && this._editing !== editing) {
            this._editing = editing;
            this.notify({ eventName: editing ? TextFieldBase.focusEvent : TextFieldBase.blurEvent, object: this });
        }
    }
    createNativeView() {
        const field = CoreTextField.alloc().init();
        field.cell = NSTextFieldCell.alloc().initTextCell('');
        field.editable = true;
        field.selectable = true;
        field.sendsActionOnEndEditing = false;
        return field;
    }
    initNativeView() {
        super.initNativeView();
        this._delegate = NSTextFieldDelegateImpl.initWithOwner(new WeakRef(this));
        const field = this.nativeViewProtected;
        fieldOwners.set(field, this);
        field.delegate = this._delegate;
        field.target = this._delegate;
        field.action = 'xplatCoreTextFieldSubmitted:';
    }
    disposeNativeView() {
        if (this.nativeViewProtected) {
            fieldOwners.delete(this.nativeViewProtected);
            this.nativeViewProtected.delegate = null;
            this.nativeViewProtected.target = null;
            this.nativeViewProtected.action = null;
        }
        this._delegate = null;
        this._editing = false;
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    focus() {
        const field = this.nativeViewProtected;
        return Boolean(field?.enabled && field.window?.makeFirstResponder(field));
    }
    [isEnabledProperty.getDefault]() {
        return this.nativeViewProtected.enabled;
    }
    [isEnabledProperty.setNative](enabled) {
        this.nativeViewProtected.enabled = enabled;
    }
    [editableProperty.getDefault]() {
        return this.nativeViewProtected.editable;
    }
    [editableProperty.setNative](editable) {
        this.nativeViewProtected.editable = editable;
    }
    [hintProperty.getDefault]() {
        return this.nativeViewProtected.placeholderString;
    }
    [hintProperty.setNative](hint) {
        this.nativeViewProtected.placeholderString = hint ?? null;
    }
    [secureProperty.getDefault]() {
        return false;
    }
    [secureProperty.setNative](secure) {
        const field = this.nativeViewProtected;
        if (secure === (field.cell instanceof NSSecureTextFieldCell)) {
            return;
        }
        this._swappingCell = true;
        try {
            const Cell = secure ? NSSecureTextFieldCell : NSTextFieldCell;
            swapTextFieldCell(field, (text) => Cell.alloc().initTextCell(text));
            field.placeholderString = this.hint ?? null;
        } finally {
            this._swappingCell = false;
        }
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
