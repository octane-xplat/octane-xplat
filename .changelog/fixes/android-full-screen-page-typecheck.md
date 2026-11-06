### Fix the Android native typecheck for prepared full-screen Pages

Android builds no longer fail the native TypeScript check inside
`prepareFullScreenPage`. The measurement override that keeps full-bleed Page
content correctly sized is iOS-only and now lives in the iOS platform leaf, so
Android compilation no longer reports the UIKit-only `bounds` property on the
Android Page view.
