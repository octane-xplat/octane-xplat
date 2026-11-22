// Borrowed from NativeScript/NativeScript PR #11089: packages/core/utils/constants.macos.ts
const version = NSProcessInfo.processInfo.operatingSystemVersion;
export const SDK_VERSION = parseFloat(`${version.majorVersion}.${version.minorVersion}`);
export function supportsGlass() {
    return __APPLE__ && SDK_VERSION >= 26;
}
