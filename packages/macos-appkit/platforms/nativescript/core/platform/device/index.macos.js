// Borrowed from NativeScript/NativeScript PR #11089: packages/core/platform/device/index.macos.ts
class DeviceRef {
    get manufacturer() {
        return 'Apple';
    }
    get os() {
        return 'macOS';
    }
    get osVersion() {
        if (!this._osVersion) {
            const version = NSProcessInfo.processInfo.operatingSystemVersion;
            this._osVersion = `${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`;
        }
        return this._osVersion;
    }
    get model() {
        if (!this._model) {
            this._model = NSHost.currentHost.name || 'Mac';
        }
        return this._model;
    }
    get sdkVersion() {
        if (!this._sdkVersion) {
            this._sdkVersion = this.osVersion;
        }
        return this._sdkVersion;
    }
    get deviceType() {
        return 'Desktop';
    }
    get uuid() {
        const userDefaults = NSUserDefaults.standardUserDefaults;
        const uuidKey = 'TNSUUID';
        let appUUID = userDefaults.stringForKey(uuidKey);
        if (!appUUID) {
            appUUID = NSUUID.UUID().UUIDString;
            userDefaults.setObjectForKey(appUUID, uuidKey);
            userDefaults.synchronize();
        }
        return appUUID;
    }
    get language() {
        return NSLocale.preferredLanguages[0];
    }
    get region() {
        return NSLocale.currentLocale.objectForKey(NSLocaleCountryCode);
    }
}
export const Device = new DeviceRef();
export const device = Device;
