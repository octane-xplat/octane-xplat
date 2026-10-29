# Tracking transparency implementation and evidence

The leaf follows Expo's permission methods and tuple, using platform SDKs
instead of React Native. The added authorizationStatus preserves restricted
versus denied. request:true is deliberately unsupported: only explicit actions
may prompt. Expo's no-ATT-gate grant is retained with authorizationStatus
unavailable; it is not app consent. Ads guidance requires consent before SDK
initialization.

## Platform engines

- iOS: AppTrackingTransparency and AdSupport Swift bridge. Status reads never
  prompt. Requests require main thread, non-extension app, nonblank purpose and
  active UIApplication before reading determined status or calling ATT. Native
  and JS coordinators prevent overlapping requests. Failures release JS state
  for a new explicit retry. Legacy iOS uses its advertising preference.
- Android: Google play-services-ads-identifier 18.3.0, AD_ID manifest merge,
  worker-thread getter, main-thread callback, limit-ad-tracking/zero normalization.
  Google forbids synchronous calls on the main thread; NativeScript shares its
  JS/UI thread, so getAdvertisingId rejects with the asynchronous alternative.
  No provider exception text or completed IDs are retained. Compilation and
  runtime are deferred by user instruction.
- Windows: optional WinRT Windows.System.UserProfile.AdvertisingManager binding.
  Capability checks inspect type presence without reading an ID. Explicit calls
  return null for empty or zero values. Its documented alphanumeric format is
  validated separately from Apple/Google UUIDs. Live NativeScript access remains
  unqualified; no new engine dependency is introduced.
- Native macOS: no ATT gate or ID. Apple's SDK headers explicitly document
  always-notDetermined ATT and all-zero AdSupport IDs on macOS. GTK/web also
  provide no native gate or identifier; they do not fabricate a consent record.

The hook activates its result owner in a layout effect. A passive mount read
must yield to an explicit action taken after render, and unmount invalidates
pending writes. Only in-flight promises are shared; completed IDs are not cached.

## Verification

- Twelve Vitest service/component/universal-compiler tests pass, including
  permission mappings, failed-request retry, identifier normalization/noncache,
  immediate explicit hook actions and unmount/stale response handling.
- Combined source and maintained examples typecheck; seven isolated packed
  declaration consumers pass without native ambient types.
- skymac.local: Swift 4/5 SDK API checks pass. One native executable was built;
  subsequent runs reused it with JS refresh. A real simulator app passes 28
  assertions across missing-purpose and configured variants: actual OS status,
  synchronous/asynchronous null IDFA, reads without status changes, request
  coalescing, configuration rejection/retry and inactive-request rejection.
  No ATT choice was displayed and no real identifier was retrieved.
- The remote native probe uses installed Octane 0.11.0, while current hook
  compilation/component checks use 0.16.3 locally. This SDK/service harness does
  not qualify the current native hook or an installed current consumer.
- ssh windy: eleven synthetic adapter assertions plus an actual WinRT type
  lookup pass. The host's advertising identifier was never read or logged;
  NativeScript getter projection and OS opt-out transitions remain unqualified.
- Android application compilation/runtime, successful ATT choices (including
  denial/restriction/return from settings), physical-device ID access, live
  Windows NativeScript getters and signed consumers remain unqualified.

Logs for this work session: /tmp/xplat-tracking-final-checks.log,
/tmp/xplat-tracking-ios-final.log, the remote native build/API logs. Windows
contract output is in the tool transcript; maintained fixtures live in tests/.
No screenshots or visual analysis were used. Twenty recipe_audit rows cover
web/iOS/Android/macOS at the implementation commit, with five GTK and five
Windows assessments in their separate desktop recipe tables. Windows remains
typechecked evidence despite the narrow synthetic adapter fixture; live native
identifier access and installed-consumer behavior remain unqualified.

## Fixture corrections and expectation mismatches

The initial hook copied a passive owner activation pattern. An immediate getter
with get:false returned a response but left component state null. Layout-effect
ownership and an explicit-action counter now protect that interval; regression
coverage includes the immediate action and mount-read race.

The first native fixture assumed NativeScript suspendEvent meant UIKit was
already inactive. That notification occurs during will-resign and UIKit still
reported active. The corrected fixture waits for the real
UIApplicationDidEnterBackgroundNotification before checking the guard. This
was a fixture timing assumption, not evidence of an ATT engine defect.

Reinstalling variants can change an iOS app data-container UUID. The runner now
resolves the container after each installation instead of reusing its old path.

## References

- [Expo API](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/)
- [Apple request contract](https://developer.apple.com/documentation/apptrackingtransparency/attrackingmanager/requesttrackingauthorization(completionhandler:))
- [Google threading restriction](https://developers.google.com/android/reference/com/google/android/gms/ads/identifier/AdvertisingIdClient)
- [Windows identifier contract](https://learn.microsoft.com/en-us/uwp/api/windows.system.userprofile.advertisingmanager.advertisingid?view=winrt-26100)
