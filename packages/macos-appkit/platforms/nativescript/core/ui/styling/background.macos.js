// Borrowed from NativeScript/NativeScript PR #11089: packages/core/ui/styling/background.macos.ts
// plus the `ios` helper surface iOS consumers import (returns null — no
// gradient/border drawing in this spike).
export * from '@nativescript/core/ui/styling/background-common';
export const ios = {
    createBackgroundUIColor(_view, _callback, _flip) {
        return null;
    },
};
