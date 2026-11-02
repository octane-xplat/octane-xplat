### GIF-to-MP4 conversion on iOS needs no native rebuild

`@octane-xplat/media-converter` no longer ships a Swift leaf on iOS. The
backend runs the same ImageIO decode, pixel-buffer compositing, and H.264
encode in a NativeScript worker isolate spawned per conversion, so installing
or updating the package works with a JavaScript-only refresh. Output,
progress, cancellation, and temporary-file cleanup match the previous engine,
and the conversion loop stays off the main thread. macOS keeps its packaged
engine; Android and web are unchanged.

```ts
const video = await convertGif(source, { format: 'mp4' }).result // unchanged API
```

See [`@octane-xplat/media-converter`](https://octane-xplat.goddardai.org/package-media-converter).
