# View capture

`@octane-xplat/view-shot` mirrors the familiar react-native-view-shot 6.2.1
subset through Octane components/refs. This capability is an Expo ecosystem
package, rather than an Expo-owned module. It owns a DOM engine cost and native
bitmap/file lifecycle, so it belongs in a leaf instead of UI. No React runtime,
React Native handle resolver or compatibility aliases are introduced.

## Ownership

The shared controller has no renderer dependency. A stable host-ref callback
binds an imperative handle through a WeakMap. A committed effect schedules
automatic work after layout; attachment alone never captures before children
commit. Update mode coalesces pending renders. Disposal invalidates an in-flight
result and releases wrapper-owned output. Manual results transfer to callers;
a late manual result is released and rejects. Unsupported continuous mode
fails explicitly. This is not an image/font loading barrier.

Service requests snapshot validated options and share a recovering FIFO queue.
The target is validated again at dispatch. TypeScript adapters and the Windows
bridge keep exact URI ownership maps, so foreign cleanup requests cannot
remove arbitrary files. Inline results never need deletion; the Android
adapter avoids passing its large payloads through the native remove bridge.

## Platform engines

Web lazy-loads html2canvas-pro 2.4.5 (MIT), the same DOM reconstruction family
used upstream, with CORS enabled and tainting disabled. The 2.5.x engine
requires Node 24; 2.4.5 retains compatibility with this repository's Node 22
minimum. Explicit viewport
bounds limit allocation; both source and output dimensions are bounded.
Canvases are cleared after encoding. JPEG uses a white background. tmpfile
creates a genuine owned blob URL; it is not silently a data URI. The engine
has incomplete CSS/asset fidelity and can omit unavailable images. DOM
screen capture is unavailable. Reject iframe/video/object/embed targets.

Both Apple backends are TypeScript over the host ObjC bridge; the previous
XplatViewShotEngine Swift wrappers are removed. UIKit uses
UIGraphicsImageRenderer and drawHierarchy, with an explicit CALayer.render
strategy option. AppKit uses cacheDisplay, an NSBitmapImageRep target context
and bitmap encoding. Both reject detected WebKit/video/GPU descendants and
recursively inspect backing sublayers; neither claims protected media capture.
Main-thread checks precede allocation and atomic temporary file writes.
UIWindow.window is nil for the window itself, so iOS attachment checks a
window target's windowScene; screen targets take their scale from the window's
screen. The Swift engine's detached check never runtime-ran there, so
captureScreen was refused on iOS until the TypeScript port.

Android uses public Bitmap/Canvas/View.draw, exact cache-file ownership,
main-thread checks and FLAG_SECURE refusal. SurfaceView, TextureView and WebView
subtrees are rejected; the GL strategy option is not implemented. Bounded
allocation and OutOfMemoryError handling avoid pretending a partial bitmap
succeeded. Android source remains uncompiled and unrun by user instruction.

GTK uses WidgetPaintable, Snapshot, GSK render_texture and PNG bytes; built-in
GI modules are external to the app bundle. Native gtk and Linux DOM/webview
are distinct conditions. A separate native linux condition rejects safely.
GTK screen capture, JPEG and WebP are outside the subset. See
[WidgetPaintable](https://docs.gtk.org/gtk4/class.WidgetPaintable.html) and
[Gdk PNG bytes](https://docs.gtk.org/gdk4/method.Texture.save_to_png_bytes.html).

Windows uses RenderTargetBitmap, SoftwareBitmap.CreateCopyFromBuffer and
BitmapEncoder.SetSoftwareBitmap. Buffers stay in WinRT, avoiding the pinned
preview bridge's documented JS byte[] marshaling issue. NSWinRT.toPromise
handles async operations. Native URI ownership maps guard core File.removeSync.
The bridge's TaskHelper.cs was inspected on windy and includes IAsyncOperation
conversion; this is source feasibility evidence, not execution of these calls.
Video, WebView and swap-chain descendants reject. XAML popup windows are outside
the captured subtree. See [RenderAsync limits](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.media.imaging.rendertargetbitmap.renderasync)
and [SoftwareBitmap buffer copy](https://learn.microsoft.com/en-us/uwp/api/windows.graphics.imaging.softwarebitmap).

## Verification

Seventeen string-only lifecycle/service and universal compiler tests pass, as do
combined source and seven-target packed consumer declarations without native
ambient types. A nonexecuting browser graph check links the final 2.4.5 DOM
engine and excludes NativeScript. The iOS runtime probe executes fifteen
capture assertions on a booted simulator (tmpfile PNG signature and owned
release, base64/data-uri output, scaled and renderInContext renders, protected
and detached refusals); the macOS API check mounts an offscreen AppKit view
inside the node-api ObjC runtime and asserts real PNG/JPEG bytes, nonblank
pixel output and owned-file release.
Sixteen GTK introspection assertions pass in andromeda.local's octane-linux VM
(GTK 4.14.5), without initializing a window or invoking snapshot/encoding APIs.
The VM must be entered with `orb -m octane-linux -w /tmp`; its default mirrored
working directory can hang noninteractive commands. Use the maintained private
native-driver Turbo tasks for these bounded checks.

The final Chromium component fixture passes 11 DOM/ref/lifecycle assertions
with a string-only backend and hard module/network guards against real capture
engines. During fixture authoring, a trailing-slash mistake in its mock alias
caused two failed runs to invoke one synthetic-text DOM capture each, producing
ephemeral blob URLs. Browser shutdown discarded those resources. No image was
opened, inspected, persisted or treated as qualification evidence. The agent
reported the mistake to the user and recorded it in local feedback. These
misrouted attempts do not qualify output fidelity or the native backends.

Visual analysis is not authorized for this task. Keep the maintained component
fixture's guards; do not invoke real capture APIs to finish a smoke fixture. Apple
output/encoding fidelity, native file ownership and protected-surface refusals
are runtime-proven as above; pixel fidelity is uninspected, and live component
rendering plus installed consumer qualification remain open. Android app compilation/runtime
are explicitly deferred. Run eventual GTK/Windows checks only on
andromeda.local/ssh windy respectively. Creator catalog-owner and documentation/example/recipe/compatibility checks pass.
The batched dependent check found that another renderer's narrower ambient GJS
namespace hid capture APIs. The GTK bridge now keeps its SDK contract local to
this module, using the same APIs checked on andromeda; this changes types only
and adds no capture execution. Silo recipe_audit represents web/iOS/Android/macOS.
The shared gtk_recipe_checks and windows_recipe_checks tables record the five
Linux and five Windows assessments separately at their reviewed revisions.
These are documentation/source assessments, not capture-output qualification;
no desktop evidence is relabeled as another target.
