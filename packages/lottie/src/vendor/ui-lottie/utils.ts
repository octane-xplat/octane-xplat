// Vendored from @nativescript-community/ui-lottie (MIT), fork branch
// xplat-fixes on octane-xplat/ui-lottie — device-probed fixes for dead
// sync-src, missing events/pause-resume, URL/.lottie sources, async
// autoPlay, completion dedupe, opacity scale, Podfile pin.
// @ts-nocheck — vendored upstream code, not strict-clean; kept
// diff-identical to the fork so fix branches stay PR-able.
export function clamp(val: number, min: number = 0, max: number = 1) {
    return val > max ? max : val < min ? min : val;
}
