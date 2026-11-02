# Media conversion boundaries

`@octane-xplat/image-manipulator` owns still-image pixels and encoding.
`@octane-xplat/media-converter` owns timed conversion jobs. A format pair alone
does not warrant a package; split an engine only when its independent binary,
licensing, or lifecycle cost justifies opting into it separately. Conversion
stays out of the UI, GIF display, picker, and playback packages.

The current converter implements one GIF traversal to opaque H.264/MP4, plus
VP9/WebM on web. It deliberately does not expose arbitrary FFmpeg commands,
video editing, or audio transcoding. Public ownership, limits, and usage belong
in the [package guide](../../../docs/packages/package-media-converter.md).

## Engines and upstream constraints

- Web: gifuct-js 2.1.2 decodes frame patches; the compositor applies offsets,
  transparency, and disposal before Mediabunny 1.42.0 feeds WebCodecs and muxes
  the output. Encoder support is queried, then checked again at actual dimensions.
  Codec availability is not input qualification. Browser decoding runs on the
  caller's thread with yields between frames; moving it into a worker would
  require a separately qualified worker/bundler delivery contract.
- Apple: the identical iOS/macOS Swift engine uses ImageIO GIF decoding and
  AVAssetWriter, preserving presentation timestamps and explicitly ending the
  session after the last frame delay. A background queue owns native work;
  callbacks return to the main thread. Keep both Swift copies synchronized.
- Android: Glide gifdecoder 4.16.0 decodes/composites; MediaCodec byte-buffer
  H.264 encoders and MediaMuxer write MP4. Only advertised planar/semiplanar YUV
  encoders qualify. Glide's GifHeaderParser intentionally replaces delays below
  two centiseconds with ten centiseconds. Xplat reads original GCE delays itself
  for presentation timestamps, preserving 10 ms frames; zero/missing delays use
  100 ms on every backend. Recheck this workaround when changing decoder versions.
- Native Windows/GTK have no adapters. Their import-safe unavailable results
  describe missing integration, not proof that the operating systems lack codecs.

Reference implementations:
[Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/),
[React Native Compressor](https://github.com/numandev1/react-native-compressor),
[Android GIFCompressor](https://natario1.github.io/GIFCompressor/),
and [WordPress GIF conversion](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-video-conversion/).
Glide's timing behavior is visible in
[GifHeaderParser.java](https://github.com/bumptech/glide/blob/v4.16.0/third_party/gif_decoder/src/main/java/com/bumptech/glide/gifdecoder/GifHeaderParser.java).

## Verification boundaries

Maintained tests distinguish shared job ownership, browser runtime, native
engine runtime, SDK compilation, and packed module delivery. Native engine tests
are independent executables: they do not establish NativeScript metadata,
CocoaPods delivery, app lifecycle, or an installed consumer's bridge behavior.
The separate macOS source-consumer test compiles the manifest-selected leaves,
generates metadata, and exercises both JavaScript/native bridges through the
prebuilt host. It is distinct from the ambient-free packed export check.
Android's JVM delay test does not exercise Bitmap decoding or MediaCodec.
Qualification state belongs in Silo; do not infer a device pass from typechecks.

## WebP engine packaging

Image manipulation uses the existing host encoder where possible. WebP adds
libwebp on Apple and a lazy @jsquash/webp 1.5.0 WASM fallback when canvas returns
a different MIME type. The fallback is bundled through a Vite `?url` asset;
there is no CDN fetch or server conversion. Test this path by forcing canvas's
WebP request to return PNG, not merely by checking a format constant.

Apple's native codec decodes the rendered PNG through ImageIO, unpremultiplies
RGBA, then calls libwebp. This PNG interchange keeps the bridge independent of
UIKit/AppKit object types at the cost of an extra in-memory encode/decode.
Apple codec limits prevent excessive intermediate allocation; the owning
README states these limits. Rendering/encoding remains on the JS calling thread.

macOS compiles the unmodified libwebp v1.6.0 submodule at
`packages/image-manipulator/platforms/macos/vendor/libwebp` (upstream commit
`4fa21912`). The manifest selects library sources, headers, and required notices;
keep COPYING, PATENTS, and AUTHORS in the npm tarball. iOS links the same
version through CocoaPods. The identical Objective-C bridge/header copies in
both platforms must stay synchronized. No global Homebrew codec is required
by consumers. NativeScript consumers need a native rebuild after installation.
