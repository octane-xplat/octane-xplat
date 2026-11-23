// macOS Core provider: Image for AppKit — NSImageView,
// ported from ui/image/index.ios.js. stretch maps to NSImageView's
// imageScaling; aspectFill uses a layer-backed contentsGravity (AppKit
// has no ScaleAspectFill mode).
import { ImageBase, stretchProperty, imageSourceProperty, tintColorProperty, srcProperty } from '@nativescript/core/ui/image/image-common';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
import { Color } from '@nativescript/core/color';
import { Trace } from '@nativescript/core/trace';
export * from '@nativescript/core/ui/image/image-common';
// NSImageScaling constants (bridge does not expose the enum name).
const SCALE_PROPORTIONALLY_UP_OR_DOWN = 3;
const SCALE_AXES_INDEPENDENTLY = 1;
const SCALE_NONE = 2;
export class Image extends ImageBase {
    nativeViewProtected;
    _imageSourceAffectsLayout = true;
    _templateImageWasCreated = false;
    createNativeView() {
        const imageView = NSImageView.alloc().init();
        imageView.imageScaling = SCALE_PROPORTIONALLY_UP_OR_DOWN;
        return imageView;
    }
    initNativeView() {
        super.initNativeView();
        this._setNativeClipToBounds();
    }
    disposeImageSource() {
        if (this.nativeViewProtected?.image === this.imageSource?.macos) {
            this.nativeViewProtected.image = null;
        }
        if (this.imageSource?.macos) {
            this.imageSource.macos = null;
        }
        this.imageSource = null;
    }
    disposeNativeView() {
        if (this.nativeViewProtected?.image) {
            this.nativeViewProtected.image = null;
        }
        this.disposeImageSource();
        super.disposeNativeView();
    }
    setTintColor(value) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        if (value && nativeView.image && !this._templateImageWasCreated) {
            // template + contentTintColor is the AppKit tint path.
            nativeView.image.template = true;
            this._templateImageWasCreated = true;
        }
        else if (!value && nativeView.image && this._templateImageWasCreated) {
            this._templateImageWasCreated = false;
            nativeView.image.template = false;
        }
        nativeView.contentTintColor = value ? (value instanceof Color ? value.macos : value) : null;
    }
    _setNativeImage(nativeImage) {
        if (this.nativeViewProtected?.image) {
            this.nativeViewProtected.image = null;
        }
        if (this.nativeViewProtected) {
            this.nativeViewProtected.image = nativeImage;
            if (this._aspectFill) {
                this._applyAspectFillLayer(nativeImage);
            }
        }
        this._templateImageWasCreated = false;
        this.setTintColor(this.style?.tintColor);
        if (this._imageSourceAffectsLayout) {
            this.requestLayout();
        }
    }
    _aspectFill = false;
    _applyAspectFillLayer(nativeImage) {
        const view = this.nativeViewProtected;
        if (!view) {
            return;
        }
        // Draw through the layer so contentsGravity can crop like iOS's
        // ScaleAspectFill (NSImageScaling has no equivalent mode); view.image
        // stays set for tint/measure bookkeeping.
        view.wantsLayer = true;
        view.layer.contents = nativeImage;
        view.layer.contentsGravity = 'resizeAspectFill';
        view.layer.masksToBounds = true;
    }
    _clearAspectFillLayer() {
        const view = this.nativeViewProtected;
        if (!view) {
            return;
        }
        if (view.layer) {
            view.layer.contents = null;
        }
    }
    _setNativeClipToBounds() {
        if (this.nativeViewProtected) {
            this.nativeViewProtected.clipsToBounds = true;
        }
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        const nativeWidth = this.imageSource ? layout.toDevicePixels(this.imageSource.width) : 0;
        const nativeHeight = this.imageSource ? layout.toDevicePixels(this.imageSource.height) : 0;
        let measureWidth = Math.max(nativeWidth, this.effectiveMinWidth);
        let measureHeight = Math.max(nativeHeight, this.effectiveMinHeight);
        const finiteWidth = widthMode !== layout.UNSPECIFIED;
        const finiteHeight = heightMode !== layout.UNSPECIFIED;
        this._imageSourceAffectsLayout = widthMode !== layout.EXACTLY || heightMode !== layout.EXACTLY;
        if (nativeWidth !== 0 && nativeHeight !== 0 && (finiteWidth || finiteHeight)) {
            const scale = Image.computeScaleFactor(width, height, finiteWidth, finiteHeight, nativeWidth, nativeHeight, this.stretch);
            const resultW = Math.round(nativeWidth * scale.width);
            const resultH = Math.round(nativeHeight * scale.height);
            measureWidth = finiteWidth ? Math.min(resultW, width) : resultW;
            measureHeight = finiteHeight ? Math.min(resultH, height) : resultH;
            if (Trace.isEnabled()) {
                Trace.write('Image stretch: ' + this.stretch + ', nativeWidth: ' + nativeWidth + ', nativeHeight: ' + nativeHeight, Trace.categories.Layout);
            }
        }
        const widthAndState = View.resolveSizeAndState(measureWidth, width, widthMode, 0);
        const heightAndState = View.resolveSizeAndState(measureHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }
    static computeScaleFactor(measureWidth, measureHeight, widthIsFinite, heightIsFinite, nativeWidth, nativeHeight, imageStretch) {
        let scaleW = 1;
        let scaleH = 1;
        if ((imageStretch === 'aspectFill' || imageStretch === 'aspectFit' || imageStretch === 'fill') && (widthIsFinite || heightIsFinite)) {
            scaleW = nativeWidth > 0 ? measureWidth / nativeWidth : 0;
            scaleH = nativeHeight > 0 ? measureHeight / nativeHeight : 0;
            if (!widthIsFinite) {
                scaleW = scaleH;
            }
            else if (!heightIsFinite) {
                scaleH = scaleW;
            }
            else {
                switch (imageStretch) {
                    case 'aspectFit':
                        scaleH = scaleW < scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                    case 'aspectFill':
                        scaleH = scaleW > scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                }
            }
        }
        return { width: scaleW, height: scaleH };
    }
    [stretchProperty.setNative](value) {
        if (this.nativeViewProtected) {
            switch (value) {
                case 'aspectFit':
                    this._aspectFill = false;
                    this._clearAspectFillLayer();
                    this.nativeViewProtected.imageScaling = SCALE_PROPORTIONALLY_UP_OR_DOWN;
                    break;
                case 'aspectFill':
                    this._aspectFill = true;
                    this.nativeViewProtected.imageScaling = SCALE_AXES_INDEPENDENTLY;
                    this._applyAspectFillLayer(this.imageSource?.macos);
                    break;
                case 'fill':
                    this._aspectFill = false;
                    this._clearAspectFillLayer();
                    this.nativeViewProtected.imageScaling = SCALE_AXES_INDEPENDENTLY;
                    break;
                case 'none':
                default:
                    this._aspectFill = false;
                    this._clearAspectFillLayer();
                    this.nativeViewProtected.imageScaling = SCALE_NONE;
                    break;
            }
        }
    }
    [tintColorProperty.setNative](value) {
        this.setTintColor(value);
    }
    [imageSourceProperty.setNative](value) {
        if (value !== this.imageSource) {
            this.disposeImageSource();
        }
        this._setNativeImage(value ? value.macos : null);
    }
    [srcProperty.setNative](value) {
        this._createImageSourceFromSrc(value);
    }
}
CSSType('Image')(Image);
