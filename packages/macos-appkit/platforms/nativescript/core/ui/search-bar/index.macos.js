// macOS Core provider: SearchBar for AppKit — NSSearchField
// with delegate-driven textChange/submit/clear, ported from
// ui/search-bar/index.ios.js. Colors have no direct AppKit knob — gap.
import { SearchBarBase, textProperty, hintProperty } from '@nativescript/core/ui/search-bar/search-bar-common';
import { layout } from '@nativescript/core/utils';
import { View } from '@nativescript/core/ui/core/view';
export * from '@nativescript/core/ui/search-bar/search-bar-common';
class SearchBarDelegateImpl extends NSObject {
    static ObjCProtocols = [NSSearchFieldDelegate];
    _owner;
    static initWithOwner(owner) {
        const impl = SearchBarDelegateImpl.new();
        impl._owner = owner;
        return impl;
    }
    controlTextDidChange(notification) {
        const owner = this._owner ? this._owner.deref() : null;
        if (owner) {
            const text = String(notification.object.stringValue);
            textProperty.nativeValueChange(owner, text);
            if (text === '') {
                owner._clear();
            }
        }
    }
}
for (const name of Object.getOwnPropertyNames(SearchBarDelegateImpl.prototype)) {
    if (name === 'constructor')
        {continue;}
    const d = Object.getOwnPropertyDescriptor(SearchBarDelegateImpl.prototype, name);
    Object.defineProperty(SearchBarDelegateImpl.prototype, name, { ...d, enumerable: true });
}
NativeClass(SearchBarDelegateImpl);
const SearchBarTargetImpl = NSObject.extend({
    ['submit:'](_sender) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner)
            {owner._submit();}
    },
}, {
    name: 'NSCoreMacosSearchBarTarget',
    exposedMethods: { 'submit:': { returns: interop.types.void, params: [interop.types.id] } },
});
export class SearchBar extends SearchBarBase {
    nativeViewProtected;
    _delegate;
    _target;
    createNativeView() {
        const field = NSSearchField.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        return field;
    }
    initNativeView() {
        super.initNativeView();
        this._delegate = SearchBarDelegateImpl.initWithOwner(new WeakRef(this));
        this.nativeViewProtected.delegate = this._delegate;
        this._target = SearchBarTargetImpl.new();
        this._target._weakOwner = new WeakRef(this);
        this.nativeViewProtected.target = this._target;
        this.nativeViewProtected.action = NSSelectorFromString('submit:');
    }
    disposeNativeView() {
        const nv = this.nativeViewProtected;
        if (nv) {
            nv.delegate = null;
            nv.target = null;
            nv.action = null;
        }
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    _submit() {
        this.notify({ eventName: SearchBarBase.submitEvent, object: this, text: this.text });
    }
    _clear() {
        this.notify({ eventName: SearchBarBase.clearEvent, object: this, text: this.text });
    }
    [textProperty.getDefault]() {
        return '';
    }
    [textProperty.setNative](value) {
        this.nativeViewProtected.stringValue = value == null ? '' : String(value);
    }
    [hintProperty.getDefault]() {
        return '';
    }
    [hintProperty.setNative](value) {
        this.nativeViewProtected.placeholderString = value == null ? '' : String(value);
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const fit = nativeView.fittingSize;
            this.setMeasuredDimension(width, Math.max(fit.height, 22));
        }
    }
}
