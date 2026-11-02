### Switch cameras while keeping one recording

Web, iOS and Android can now switch cameras during a take while keeping audio active
and holding the last video frame during acquisition. The take keeps its original
completion promise and produces one output file. Check support after preview
activation; the separate desktop camera adapters currently report this operation
unavailable. Rebuild iOS apps after upgrading to include the native recorder.

```ts
if ((await session.capabilities()).cameraSwitchDuringRecording) {
	await session.switchCamera('front') // While the take is recording.
}
```

See [camera switching](https://octane-xplat.goddardai.org/movie-capture#switch-cameras-during-a-take)
for controls, error handling and platform qualification limits.
