# Image manipulation contracts and evidence

`@octane-xplat/image-manipulator` follows Expo's modern context API using a
shared immutable-frame queue. Browsers draw canvas images, iOS uses UIKit,
Android uses Bitmap/Canvas, and AppKit uses NSBitmapImageRep. Generated public
types are independent of DOM/native host types. Direct context/ImageRef class
construction and the deprecated Expo manipulator function are outside this API.

## Ownership and platform boundaries

The source image is retained for reset. Each transformation creates independent
pixels. Reference counts retain snapshots and active saves; disposing a context
does not invalidate previously rendered snapshots or saved results. Encoded
results have separately tracked URI ownership; cleanup never deletes input files.
`releaseImage` applies to outputs owned by the current API instance, not arbitrary
paths or outputs reopened in another process.

Size bounds currently reduce the working image after decoding; they do not
guarantee reduced decoder peak memory. Native transformations/encoding execute
on the calling JS thread. JPEG/PNG are the portable outputs. Native iOS/AppKit
reject WebP; extent follows Expo's web-only scope. Native GTK/Windows adapters
have not been implemented. Their safe unsupported imports are not evidence that
the OS cannot perform bitmap operations; future adapters can use host engines.

Reference contracts: [Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/),
[NativeScript ImageSource](https://docs.nativescript.org/core/image-source),
and the [public package guide](../../../packages/image-manipulator/README.md).

## Verification

- Local core tests: operation order, snapshot ownership, reset, input-ref reuse,
  save/release overlap, failure cleanup, validation, and geometry.
- Chromium: real PNG pixel decoding after crop/rotation/flip/extent, resize
  dimensions, output encoding, URI revocation, reset, source-ref reuse, and
  Octane hook source/bounds changes and unmount cleanup.
- AppKit on `skymac.local`: a task-owned headless fixture reused the checkout's
  prebuilt NativeScript runtime and metadata (checkout `1fcf6406f`). Seventeen
  host assertions and five independently decoded PNG samples passed with real
  AppKit decoding, transforms, PNG/JPEG encoding, and Foundation file operations.
  Eight EXIF orientations also passed independent pixel and dimension checks.
  The fixture supplies the platform import namespace from the runtime globals;
  it does not qualify packed module delivery or a full consumer app.
- iOS 26.2 on `skymac.local`: a task-owned iPhone Air simulator passed eighteen
  native assertions and five independently decoded PNG samples. The maintained
  probe also verified all eight EXIF orientations with independent pixel and
  dimension checks using the real UIKit backend and NativeScript file APIs. The simulator
  was shut down afterward. The host checkout predates the shared capability
  export, so the probe used a task-owned copy of the current utility package.
- Packed consumer: ambient-free web/native public types, a web production
  bundle, and resolution of the packed UIKit backend passed locally.
- Combined platform source typecheck (including the crop helper and iOS probe)
  passed. Android runtime verification is explicitly deferred by the user.
- No OS-input, live camera, picker, screenshot, or visual-analysis claim is made.

The maintained runtime fixture lives in
[`tests/macos-runtime.mjs`](../../../packages/image-manipulator/tests/macos-runtime.mjs)
and [`tests/ios-runtime.mjs`](../../../packages/image-manipulator/tests/ios-runtime.mjs).
Its private `native-driver` workspace allows Turbo to run copied source on the
remote test host without modifying that host's existing tracked files. AppKit
reuses a prebuilt host; iOS builds one isolated probe app and reuses it on reruns.
`XPLAT_NATIVE_TEST_REPO` selects that host checkout; `XPLAT_IOS_DEVICE` selects
the owned simulator, and optional `XPLAT_IMAGE_LIB_ROOT` selects the matching
utility package when the host checkout is older. The primary fixture directory
and generated outputs are task-owned. No remote resource-broker executable was
available; the local broker reserved the unique remote simulator ID and native
build capacity while supervising SSH. The remote script shut down its simulator.

## Native color sampling observation

During the AppKit fixture, sampling a six-pixel PNG with
`NSBitmapImageRep.colorAtXY`, conversion to sRGB, and `NSColor.redComponent`
reported red value 26 for every pixel. An independent PNG decoder applied to
the actual saved bytes recovered the distinct expected values and passed the
transform checks. The discrepancy in this native sampling path is observed,
but its cause has not been isolated. It is not a confirmed AppKit engine bug.

The fixture therefore checks encoded PNG bytes with Node's zlib and PNG filter
decoding rather than treating native color access as its pixel oracle. Keep
that independent check until a focused bridge reproduction verifies native
sampling. Silo observation `84fd10f1-a365-40ee-afca-556b473d0751` preserves the
original expectation and evidence. No runtime library workaround or patch is
introduced for this observation.
