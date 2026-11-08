# `@octane-xplat/speech-recognition`

> Speech-to-text dictation sessions for Octane xplat

Dictation sessions for Octane xplat apps — `start()` returns a session that
emits cumulative transcripts as the user speaks. The engine is the
platform's own speech service: Web Speech API in the browser,
`SFSpeechRecognizer` on iOS and macOS, `SpeechRecognizer` on Android, and
the WinRT dictation recognizer on Windows. Linux and GTK report
`supported: false` because no OS speech-recognition service exists there.

```sh
bun add @octane-xplat/speech-recognition
```

```ts
import { speechRecognition } from '@octane-xplat/speech-recognition'

const session = speechRecognition.start({ lang: 'en-US' })
session.subscribe((event) => {
  if (event.type === 'transcript') {
    // event.transcript is cumulative; event.isFinal commits it
  }
})
const result = await session.stop() // { transcript, reason, error }
```

Check `speechRecognition.supported` and `getAvailability()` before showing
dictation UI — the session's result classifies failures as
`permission-denied`, `language-unsupported`, `service-unavailable`,
`network`, `audio-capture`, `no-speech`, `interrupted`, `busy`,
`unsupported-option`, or `unknown`, and one session can be active at a time.

```ts
if (speechRecognition.supported) {
  const availability = await speechRecognition.getAvailability({ lang: 'en-US' })
  // availability.networkUse tells you whether recognition may leave the
  // device: 'required' (online service), 'possible', or null.
}
```

## Permissions and privacy

Speech recognition needs microphone access, and on Apple platforms also the
OS speech-recognition permission. `getPermissions()` reads state without
prompting; `requestPermissions()` shows the system dialog; a session started
with undetermined permission requests it first. Host apps must declare the
platform usage strings — the package ships `platforms/ios/Info.plist` and
`platforms/android/AndroidManifest.xml` entries (`NSMicrophoneUsageDescription`,
`NSSpeechRecognitionUsageDescription`, `RECORD_AUDIO`) that NativeScript
merges into the app. Packaged macOS apps need both usage strings in their
Info.plist; a command-line or unconfigured host reports `supported: false`.

```ts
const permission = await speechRecognition.getPermissions()
if (permission.status === 'undetermined' && permission.canAskAgain) {
  await speechRecognition.requestPermissions()
}
```

## Sessions

`start(options)` takes `lang` (BCP-47, defaults to the system language),
`interimResults` (default `true`), and `continuous` (default `false`). A
non-continuous session ends after the speaker pauses; a continuous session
keeps transcribing until `stop()` or `abort()`. `stop()` waits for the
final transcript (5 s fallback); `abort()` cancels immediately without one.
`session.result` always resolves — including `aborted` and error outcomes —
so `await` it to observe the end reason.

```ts
const session = speechRecognition.start({ continuous: true })
const off = session.subscribe((event) => {
  if (event.type === 'transcript') field.value = event.transcript
  if (event.type === 'end') off()
})
// … later, from a stop button:
const { transcript, reason, error } = await session.stop()
```

Starting a second session while one is active ends the new one with a
`busy` error — reuse or await the first. Leaving the app (iOS background,
hidden web tab, media-services reset) ends the session `interrupted`; a
revoked permission surfaces as `permission-denied`.

## Platform limits

Speech services differ in what they promise:

| Platform | Engine | Network | Notes |
| --- | --- | --- | --- |
| Web | Web Speech API | `required` unless `available({ processLocally })` | Chrome routes audio to a server; `continuous` supported |
| iOS | `SFSpeechRecognizer` | `possible` (on-device models) or `required` | Mic + speech permissions; background ends the session |
| macOS | `SFSpeechRecognizer` | same | Packaged app must carry both usage strings |
| Android | `SpeechRecognizer` | `possible` | Service depends on the installed recognizer; `continuous` unsupported (`unsupported-option`) |
| Windows | WinRT `SpeechRecognizer` | `required` | Needs the "online speech recognition" privacy consent; `SpeechRecognitionUI` is not projected |
| Linux / GTK | none | — | `supported: false` — no OS service exists |

`getAvailability({ lang })` reports `networkUse` per platform so a privacy
UI can disclose when audio leaves the device. Nothing in this package
promises offline recognition: on Apple platforms on-device recognition is
used when the model is already installed, but the service may still contact
Apple's servers.
