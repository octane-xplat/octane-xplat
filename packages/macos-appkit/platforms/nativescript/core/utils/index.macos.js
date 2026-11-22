// Based on NativeScript/NativeScript PR #11089: packages/core/utils/index.macos.ts
// — merged with the export surface of core's utils/index.ios.js.
import { Trace } from '@nativescript/core/trace';
import { collections, getCurrentAppPath, joinPaths, getWindow, iOSNativeHelper, isRealDevice } from '@nativescript/core/utils/native-helper';
export { clearInterval, clearTimeout, setInterval, setTimeout } from '@nativescript/core/timer';
export * from '@nativescript/core/utils/animation-helpers';
export * from '@nativescript/core/utils/common';
export * from '@nativescript/core/utils/constants';
export * from '@nativescript/core/utils/debug';
export * from '@nativescript/core/utils/layout-helper';
export * from '@nativescript/core/utils/macrotask-scheduler';
export * from '@nativescript/core/utils/mainthread-helper';
export * from '@nativescript/core/utils/native-helper';
export * from '@nativescript/core/utils/shared';
export * from '@nativescript/core/utils/types';
export function openFile(filePath) {
    return openUrl(`file://${filePath}`);
}
export function openUrl(location) {
    try {
        const value = location && location.trim();
        if (!value) {
            return false;
        }
        const url = NSURL.URLWithString(value);
        if (!url) {
            return false;
        }
        return NSWorkspace.sharedWorkspace.openURL(url);
    }
    catch {
        return false;
    }
}
export function openUrlAsync(location) {
    return Promise.resolve(openUrl(location));
}
export function GC() {
    if (typeof globalThis.__collect === 'function') {
        globalThis.__collect();
    }
}
let queuedGCHandle;
export function queueGC(delay = 900) {
    clearTimeout(queuedGCHandle);
    queuedGCHandle = setTimeout(() => GC(), delay);
}
export function releaseNativeObject(object) {
    if (typeof globalThis.__releaseNativeCounterpart === 'function') {
        globalThis.__releaseNativeCounterpart(object);
    }
}
export const ad = 0;
export function dismissSoftInput(_nativeView) { }
export function dismissKeyboard() {
    dismissSoftInput();
}
export function copyToClipboard(value) {
    const pasteboard = NSPasteboard.generalPasteboard;
    pasteboard.clearContents();
    pasteboard.setStringForType(value, NSPasteboardTypeString);
}
export { iOSNativeHelper };
