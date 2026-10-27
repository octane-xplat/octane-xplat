// Test-runtime shim for '@nativescript-community/octane'. The real package
// index pulls @nativescript/core (not loadable in node), so the vitest config
// aliases it here. Everything the driver re-exports comes from the universal
// runtime; registerElement is a native-side tag registry call that becomes a
// no-op under the object driver.
export * from 'octane/universal/native'
export function registerElement() {}
