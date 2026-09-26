/** Compile-time platform flag — `true` in every NativeScript build.
 *  Prefer `.web`/`.native` leaves for real divergence; `isNative` covers
 *  the render-time cases (conditional JSX, prop selection) where a whole
 *  leaf file is heavier than the difference. For OS-level splits use
 *  `.ios`/`.android` leaves or `isIOS`/`isAndroid` from @nativescript/core
 *  inside `.native` code. */
export const isNative = true
