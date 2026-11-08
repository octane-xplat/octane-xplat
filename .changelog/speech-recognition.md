---
hype: 55
---

### Dictate text with the OS speech service

New `@octane-xplat/speech-recognition` package transcribes spoken audio into text through the platform's own recognizer — Web Speech API in the browser, `SFSpeechRecognizer` on iOS and macOS, `SpeechRecognizer` on Android, and the WinRT dictation recognizer on Windows.

```ts
import { speechRecognition } from '@octane-xplat/speech-recognition'

const session = speechRecognition.start({ lang: 'en-US' })
session.subscribe((event) => {
  if (event.type === 'transcript') field.value = event.transcript
})
const result = await session.stop() // { transcript, reason, error }
```

Sessions emit interim and final cumulative transcripts, choose a BCP-47 language, stop gracefully or abort immediately, and report typed errors (`permission-denied`, `network`, `audio-capture`, `no-speech`, `interrupted`, `busy`, `unsupported-option`). `getAvailability()` reports whether recognition may use the network so apps can disclose it — no platform promises offline dictation. Linux and GTK report `supported: false` because no OS speech-recognition service exists there.

See [`@octane-xplat/speech-recognition`](https://octane-xplat.goddardai.org/package-speech-recognition).
