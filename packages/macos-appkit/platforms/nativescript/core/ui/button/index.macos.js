// macOS Core provider: Button for AppKit — NSButton with
// target/action tap delivery. Modeled on ui/button/index.ios.js (Core
// TapHandlerImpl/ObjCExposedMethods pattern); iOS-only chrome (content
// edge insets, visual states) dropped.
import { ButtonBase } from '@nativescript/core/ui/button/button-common';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/button/button-common';
class TapHandlerImpl extends NSObject {
    _owner;
    static initWithOwner(owner) {
        const handler = TapHandlerImpl.new();
        handler._owner = owner;
        return handler;
    }
    // macos-node-api's ClassBuilder uses ObjCExposedMethods keys verbatim as
    // selectors, and the JS method must use the same colon spelling
    // (packages/macos-appkit convention — e.g. actions.ts).
    ['tap:'](_args) {
        if (this._owner) {
            const owner = this._owner.deref();
            if (owner) {
                owner._emit(ButtonBase.tapEvent);
            }
        }
    }
    static ObjCExposedMethods = {
        'tap:': { returns: interop.types.void, params: [interop.types.id] },
    };
}
// The JSC host's native property enumeration sees enumerable keys only
// (packages/macos-appkit's registerGestureClass does the same): ES class
// methods are non-enumerable, so expose them before NativeClass registers.
for (const name of Object.getOwnPropertyNames(TapHandlerImpl.prototype)) {
    if (name === 'constructor') {
        continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(TapHandlerImpl.prototype, name);
    Object.defineProperty(TapHandlerImpl.prototype, name, { ...descriptor, enumerable: true });
}
NativeClass(TapHandlerImpl);
export class Button extends ButtonBase {
    nativeViewProtected;
    _tapHandler;
    createNativeView() {
        return NSButton.alloc().init();
    }
    initNativeView() {
        super.initNativeView();
        this._tapHandler = TapHandlerImpl.initWithOwner(new WeakRef(this));
        this.nativeViewProtected.target = this._tapHandler;
        this.nativeViewProtected.action = NSSelectorFromString('tap:');
    }
    disposeNativeView() {
        if (this.nativeViewProtected) {
            this.nativeViewProtected.target = null;
            this.nativeViewProtected.action = null;
        }
        this._tapHandler = null;
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
CSSType('Button')(Button);
