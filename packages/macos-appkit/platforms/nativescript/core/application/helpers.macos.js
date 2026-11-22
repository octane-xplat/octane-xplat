// .macos variant of @nativescript/core/application/helpers.ios.js (spike).
// iOS maps native view -> Core view by writing uiView.tag; NSView.tag is
// readonly on AppKit, so keep the same mapping in a WeakMap instead.
const nativeToView = new WeakMap();
// stubs copied from helpers.ios.js to avoid bundler warnings
export const updateContentDescription = (view, forceUpdate) => null;
export function applyContentDescription(view, forceUpdate) {
    return null;
}
export function androidGetCurrentActivity() { }
export function androidGetForegroundActivity() { }
export function androidSetForegroundActivity(activity) { }
export function androidGetStartActivity() { }
export function androidSetStartActivity(activity) { }
export function setupAccessibleView(view) {
    const nsView = view.nativeViewProtected;
    if (!nsView) {
        return;
    }
    nativeToView.set(nsView, view);
}
export function getViewFromNativeView(nsView) {
    return nativeToView.get(nsView);
}
