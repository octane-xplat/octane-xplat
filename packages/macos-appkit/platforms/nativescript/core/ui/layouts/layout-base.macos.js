// macOS Core provider: LayoutBase for AppKit — extends the iOS
// implementation (resolved through the provider `reuse` map) and swaps the
// UIKit-only native calls for AppKit equivalents. See provider rule 2:
// reuse + smallest-method override.
import { isPassThroughParentEnabledProperty } from '@nativescript/core/ui/layouts/layout-base-common';
import { LayoutBase as AppleLayoutBase } from '@nativescript/core/ui/layouts/layout-base';
export * from '@nativescript/core/ui/layouts/layout-base-common';
export class LayoutBase extends AppleLayoutBase {
    _setNativeClipToBounds() {
        const view = this.nativeViewProtected;
        if (view && this.clipToBounds) {
            view.wantsLayer = true;
            if (view.layer) {
                view.layer.masksToBounds = true;
            }
        }
    }
    [isPassThroughParentEnabledProperty.setNative](value) {
        // NSView has no setPassThroughParent category (an {N} iOS runtime
        // extension); apply only when the method exists.
        if (typeof this.nativeViewProtected?.setPassThroughParent === 'function') {
            this.nativeViewProtected.setPassThroughParent(value);
        }
    }
}
