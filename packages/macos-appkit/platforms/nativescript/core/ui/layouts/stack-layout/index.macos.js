// macOS Core provider: StackLayout for AppKit — extends the iOS
// implementation (resolved through the provider `reuse` map); the iOS file is
// pure measure/layout JS except for a UITableView/UIScrollView instanceof in
// isUnsizedScrollableView, which is swapped for the AppKit classes.
import { StackLayout as AppleStackLayout } from '@nativescript/core/ui/layouts/stack-layout';
export * from '@nativescript/core/ui/layouts/stack-layout/stack-layout-common';
export class StackLayout extends AppleStackLayout {
    isUnsizedScrollableView(child) {
        if (child.height === 'auto' &&
            ((typeof NSTableView !== 'undefined' && child.macos instanceof NSTableView) ||
                (typeof NSScrollView !== 'undefined' && child.macos instanceof NSScrollView))) {
            return true;
        }
        return false;
    }
}
