// Borrowed from NativeScript/NativeScript PR #11089: packages/core/utils/native-helper.macos.ts
import { platformCheck } from '@nativescript/core/utils/platform-check';
export function getCurrentAppPath() {
    if (!global.__dirname) {
        global.__dirname = '/app';
    }
    const currentDir = global.__dirname;
    const tnsModulesIndex = currentDir.indexOf('/tns_modules');
    let appPath = currentDir;
    if (tnsModulesIndex !== -1) {
        appPath = currentDir.substring(0, tnsModulesIndex);
    }
    return appPath;
}
export function joinPaths(...paths) {
    if (!paths || paths.length === 0) {
        return '';
    }
    return NSString.stringWithString(NSString.pathWithComponents(paths)).stringByStandardizingPath;
}
export function isRealDevice() {
    return true;
}
export function getWindow() {
    const app = NSApplication.sharedApplication;
    if (!app) {
        return null;
    }
    return app.keyWindow || app.mainWindow;
}
export function getter(_this, property) {
    if (typeof property === 'function') {
        return property.call(_this);
    }
    return property;
}
export const collections = {
    jsArrayToNSArray(arr) {
        return NSArray.arrayWithArray(arr);
    },
    nsArrayToJSArray(arr) {
        const result = [];
        if (!arr) {
            return result;
        }
        const count = arr.count;
        for (let i = 0; i < count; i++) {
            result.push(arr.objectAtIndex(i));
        }
        return result;
    },
};
export const ios = {
    collections,
    getCurrentAppPath,
    getWindow,
    isRealDevice,
    joinPaths,
};
export const iOSNativeHelper = ios;
export const android = platformCheck('utils.android');
