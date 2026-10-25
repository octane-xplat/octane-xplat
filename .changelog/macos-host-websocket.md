### `WebSocket` is available in the macOS AppKit host

Apps running on the macOS JavaScriptCore host can now use the standard
`WebSocket` global — the same API web and iOS provide — for `ws:` and
`wss:` URLs. It supports subprotocol negotiation, text and binary
(`ArrayBuffer`) messages, and `open`/`message`/`error`/`close` events with
real close codes, backed by `NSURLSessionWebSocketTask`.

```ts
const socket = new WebSocket('ws://localhost:8080')
socket.onmessage = (event) => console.log(event.data)
socket.send('hello')
```

`binaryType` stays `'arraybuffer'`; received binary messages deliver
`ArrayBuffer` values.

[macOS host documentation](https://octane-xplat.goddardai.org/macos-native)
