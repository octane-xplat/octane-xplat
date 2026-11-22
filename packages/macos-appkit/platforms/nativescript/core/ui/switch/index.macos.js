// macOS Core provider: Switch for AppKit — NSSwitch with
// target-action checkedChange, ported from ui/switch/index.ios.js.
// iOS tint plumbing (onTintColor/thumbTintColor/track colors) has no
// NSSwitch equivalent — colors are a recorded gap.
import { SwitchBase, checkedProperty, offBackgroundColorProperty } from '@nativescript/core/ui/switch/switch-common';
import { colorProperty, backgroundColorProperty, backgroundInternalProperty } from '@nativescript/core/ui/styling/style-properties';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/switch/switch-common';
class SwitchChangeHandlerImpl extends NSObject {
    _owner;
    static initWithOwner(owner) {
        const handler = SwitchChangeHandlerImpl.new();
        handler._owner = owner;
        return handler;
    }
    ['valueChanged:'](sender) {
        const owner = this._owner ? this._owner.deref() : null;
        if (owner) {
            checkedProperty.nativeValueChange(owner, sender.state === 1 /* NSControlStateValueOn */);
        }
    }
    static ObjCExposedMethods = {
        'valueChanged:': { returns: interop.types.void, params: [interop.types.id] },
    };
}
for (const name of Object.getOwnPropertyNames(SwitchChangeHandlerImpl.prototype)) {
    if (name === 'constructor') {
        continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(SwitchChangeHandlerImpl.prototype, name);
    Object.defineProperty(SwitchChangeHandlerImpl.prototype, name, { ...descriptor, enumerable: true });
}
NativeClass(SwitchChangeHandlerImpl);
export class Switch extends SwitchBase {
    nativeViewProtected;
    _handler;
    createNativeView() {
        return NSSwitch.new();
    }
    initNativeView() {
        super.initNativeView();
        this._handler = SwitchChangeHandlerImpl.initWithOwner(new WeakRef(this));
        this.nativeViewProtected.target = this._handler;
        this.nativeViewProtected.action = NSSelectorFromString('valueChanged:');
    }
    disposeNativeView() {
        if (this.nativeViewProtected) {
            this.nativeViewProtected.target = null;
            this.nativeViewProtected.action = null;
        }
        this._handler = null;
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [checkedProperty.getDefault]() {
        return false;
    }
    [checkedProperty.setNative](value) {
        this.nativeViewProtected.state = value ? 1 /* NSControlStateValueOn */ : 0 /* NSControlStateValueOff */;
    }
    // Color gaps: NSSwitch has no tint API.
    [colorProperty.getDefault]() {
        return null;
    }
    [colorProperty.setNative](_value) { }
    [backgroundColorProperty.getDefault]() {
        return null;
    }
    [backgroundColorProperty.setNative](_value) { }
    [backgroundInternalProperty.getDefault]() {
        return null;
    }
    [backgroundInternalProperty.setNative](_value) { }
    [offBackgroundColorProperty.getDefault]() {
        return null;
    }
    [offBackgroundColorProperty.setNative](_value) { }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
            const fitting = nativeView.intrinsicContentSize;
            const intrinsicW = fitting && fitting.width >= 0 ? layout.toDevicePixels(fitting.width) : 0;
            const intrinsicH = fitting && fitting.height >= 0 ? layout.toDevicePixels(fitting.height) : 0;
            // Controls with indefinite intrinsic width (bar progress/slider)
            // fill the proposed width; a sane default keeps UNSPECIFIED sane.
            const fallbackW = layout.toDevicePixels(60);
            const nativeWidth = widthMode === layout.EXACTLY ? width : intrinsicW > 0 ? intrinsicW : widthMode === layout.AT_MOST ? Math.min(width, fallbackW) : fallbackW;
            const nativeHeight = heightMode === layout.EXACTLY ? height : intrinsicH > 0 ? intrinsicH : layout.toDevicePixels(24);
            const widthAndState = View.resolveSizeAndState(layout.round(nativeWidth), width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(layout.round(nativeHeight), height, heightMode, 0);
            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }
}
CSSType('Switch')(Switch);
