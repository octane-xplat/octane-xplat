import { GridLayout } from '@nativescript/core/ui/layouts/grid-layout';
import { mountGlassBackdrop } from '../../../../../../src/glass-backdrop';

export class LiquidGlass extends GridLayout {
    initNativeView() {
        super.initNativeView();
        this._backdrop = mountGlassBackdrop(this.nativeViewProtected);
    }

    _addViewToNativeVisualTree(child, atIndex) {
        const nativeIndex = atIndex >= 0 ? atIndex + 1 : atIndex;
        return super._addViewToNativeVisualTree(child, nativeIndex);
    }

    disposeNativeView() {
        try {
            this._backdrop?.removeFromSuperview();
        }
        finally {
            this._backdrop = undefined;
            super.disposeNativeView();
        }
    }
}
