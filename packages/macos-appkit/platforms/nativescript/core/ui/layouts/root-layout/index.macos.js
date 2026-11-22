// macOS Core provider: RootLayout for AppKit — port of
// root-layout/index.ios.js over the shared root-layout-common overlay
// machinery (open/close/bringToFront/closeAll/getShadeCover/topmost).
// Shade-cover state/animation goes through our layer-backed Animation and
// direct layer writes; unflipped-layer Y/rotation sign rules match
// ui/animation/index.macos.ts.
import { Color } from '@nativescript/core/color';
import { RootLayoutBase, defaultShadeCoverOptions, defaultTransitionAnimation } from '@nativescript/core/ui/layouts/root-layout/root-layout-common';
import { Animation } from '@nativescript/core/ui/animation';
export * from '@nativescript/core/ui/layouts/root-layout/root-layout-common';
export class RootLayout extends RootLayoutBase {
    disposeNativeView() {
        this._cleanupPlatformShadeCover();
        super.disposeNativeView();
    }
    _bringToFront(view) {
        const nv = view?.nativeViewProtected;
        const parent = this.nativeViewProtected;
        if (!nv || !parent)
            {return;}
        // Later subviews draw on top in AppKit.
        nv.removeFromSuperview();
        parent.addSubview(nv);
    }
    _initShadeCover(view, shadeOptions) {
        const initialState = {
            ...defaultShadeCoverOptions.animation.enterFrom,
            ...shadeOptions?.animation?.enterFrom,
        };
        this._applyAnimationProperties(view, initialState);
    }
    _updateShadeCover(view, shadeOptions) {
        return new Promise((resolve) => {
            const options = { ...defaultShadeCoverOptions, ...shadeOptions };
            const nv = view?.nativeViewProtected;
            if (!nv) {
                resolve();
                return;
            }
            if (options.color) {
                if (typeof nv.wantsLayer !== 'undefined')
                    {nv.wantsLayer = true;}
                const color = new Color(options.color).macos;
                if (nv.layer && color)
                    {nv.layer.backgroundColor = color.CGColor;}
            }
            const duration = options.animation?.enterFrom?.duration ?? defaultShadeCoverOptions.animation.enterFrom.duration;
            const target = {
                ...defaultTransitionAnimation,
                ...options.animation?.enterFrom,
                opacity: shadeOptions?.opacity ?? options.opacity,
            };
            new Animation([
                {
                    target: view,
                    translate: { x: 0, y: 0 },
                    scale: { x: 1, y: 1 },
                    rotate: 0,
                    opacity: target.opacity,
                    duration,
                    curve: target.curve,
                },
            ])
                .play()
                .then(() => resolve());
        });
    }
    _closeShadeCover(view, shadeOptions) {
        return new Promise((resolve) => {
            const exitState = {
                ...defaultShadeCoverOptions.animation.exitTo,
                ...shadeOptions?.animation?.exitTo,
            };
            if (!view?.nativeViewProtected) {
                resolve();
                return;
            }
            new Animation([
                {
                    target: view,
                    translate: { x: exitState.translateX, y: exitState.translateY },
                    scale: { x: exitState.scaleX, y: exitState.scaleY },
                    rotate: exitState.rotate,
                    opacity: exitState.opacity,
                    duration: exitState.duration,
                    curve: exitState.curve,
                },
            ])
                .play()
                .then(() => resolve());
        });
    }
    _cleanupPlatformShadeCover() {
        if (this._gradientLayer != null) {
            this._gradientLayer.removeFromSuperlayer();
            this._gradientLayer = null;
        }
    }
    _applyAnimationProperties(view, a) {
        const nv = view?.nativeViewProtected;
        if (!nv)
            {return;}
        if (typeof nv.wantsLayer !== 'undefined')
            {nv.wantsLayer = true;}
        const layer = nv.layer;
        if (layer) {
            let t = CATransform3DMakeTranslation(a.translateX, -a.translateY, 0);
            t = CATransform3DScale(t, a.scaleX || 0.1, a.scaleY || 0.1, 1);
            t = CATransform3DRotate(t, -(a.rotate * Math.PI) / 180, 0, 0, 1);
            layer.transform = t;
            layer.opacity = a.opacity;
        }
        if (typeof nv.alphaValue !== 'undefined')
            {nv.alphaValue = a.opacity;}
    }
}
