// macOS Core provider: Slider for AppKit — continuous
// NSSlider with target-action valueChange, ported from
// ui/slider/index.ios.js. Track/thumb tint and a11y increment/decrement
// have no NSSlider equivalent — recorded gaps.
import { SliderBase, valueProperty, minValueProperty, maxValueProperty } from '@nativescript/core/ui/slider/slider-common';
import { layout } from '@nativescript/core/utils';
import { colorProperty, backgroundColorProperty, backgroundInternalProperty } from '@nativescript/core/ui/styling/style-properties';
import { View, CSSType } from '@nativescript/core/ui/core/view';
export * from '@nativescript/core/ui/slider/slider-common';
class SliderChangeHandlerImpl extends NSObject {
    _owner;
    static initWithOwner(owner) {
        const handler = SliderChangeHandlerImpl.new();
        handler._owner = owner;
        return handler;
    }
    ['sliderValueChanged:'](sender) {
        const owner = this._owner ? this._owner.deref() : null;
        if (owner) {
            valueProperty.nativeValueChange(owner, sender.doubleValue);
        }
    }
    static ObjCExposedMethods = {
        'sliderValueChanged:': { returns: interop.types.void, params: [interop.types.id] },
    };
}
for (const name of Object.getOwnPropertyNames(SliderChangeHandlerImpl.prototype)) {
    if (name === 'constructor') {
        continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(SliderChangeHandlerImpl.prototype, name);
    Object.defineProperty(SliderChangeHandlerImpl.prototype, name, { ...descriptor, enumerable: true });
}
NativeClass(SliderChangeHandlerImpl);
export class Slider extends SliderBase {
    nativeViewProtected;
    _changeHandler;
    createNativeView() {
        const slider = NSSlider.new();
        slider.continuous = true;
        return slider;
    }
    initNativeView() {
        super.initNativeView();
        const nativeView = this.nativeViewProtected;
        nativeView.minValue = 0;
        nativeView.maxValue = this.maxValue;
        this._changeHandler = SliderChangeHandlerImpl.initWithOwner(new WeakRef(this));
        nativeView.target = this._changeHandler;
        nativeView.action = NSSelectorFromString('sliderValueChanged:');
    }
    disposeNativeView() {
        if (this.nativeViewProtected) {
            this.nativeViewProtected.target = null;
            this.nativeViewProtected.action = null;
        }
        this._changeHandler = null;
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [valueProperty.getDefault]() {
        return 0;
    }
    [valueProperty.setNative](value) {
        this.macos.doubleValue = value;
    }
    [minValueProperty.getDefault]() {
        return 0;
    }
    [minValueProperty.setNative](value) {
        this.macos.minValue = value;
    }
    [maxValueProperty.getDefault]() {
        return 100;
    }
    [maxValueProperty.setNative](value) {
        this.macos.maxValue = value;
    }
    // Color gaps: NSSlider exposes no track/thumb tint.
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
            const fallbackW = layout.toDevicePixels(160);
            const nativeWidth = widthMode === layout.EXACTLY ? width : intrinsicW > 0 ? intrinsicW : widthMode === layout.AT_MOST ? Math.min(width, fallbackW) : fallbackW;
            const nativeHeight = heightMode === layout.EXACTLY ? height : intrinsicH > 0 ? intrinsicH : layout.toDevicePixels(22);
            const widthAndState = View.resolveSizeAndState(layout.round(nativeWidth), width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(layout.round(nativeHeight), height, heightMode, 0);
            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }
}
CSSType('Slider')(Slider);
