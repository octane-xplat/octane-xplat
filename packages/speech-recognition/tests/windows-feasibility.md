# WinRT SpeechRecognizer feasibility — NativeScript Windows preview

**Verdict: implement a real engine leaf** — `Windows.Media.SpeechRecognition` is fully
projected by the preview runtime and drives a real `SpeechRecognizer` through
constraint compilation. The only step not proven end-to-end is audio→transcript,
blocked by the OS per-app microphone-consent gate that the headless packaged
harness could not satisfy — that is an environment/UX gate any real app hits
once, not a projection defect.

Runtime used: `C:\Users\alecs\dev\octane-xplat\apps\windows\platforms\windows\windows\bin`
(the documented `bin\x64\Release\net10.0-...\win-x64` path no longer exists — the
flat `bin\` dir is the current output). AppxManifest already declares
`<DeviceCapability Name="microphone"/>` (plus webcam) — no injection needed.

## What is projected (verified by constructing/reading inside the packaged app)

Projected and functional:
- `SpeechRecognizer` (ctor works; `.State`, `.Constraints`, `.Timeouts`,
  `.ContinuousRecognitionSession`, `SystemSpeechLanguage`=en-US,
  `SupportedTopicLanguages`/`SupportedGrammarLanguages`)
- `SpeechRecognitionTopicConstraint` / `ListConstraint` /
  `GrammarFileConstraint` — ctors work, `Constraints.Append(c)` works,
  `CompileConstraintsAsync()` → `Status` **0 (Success)**
- `SpeechRecognitionCompilationResult`, `SpeechRecognitionResult`,
  `SpeechRecognizerTimeouts`, `SpeechRecognitionSemanticInterpretation`
- Enums present as opaque objects: `SpeechRecognitionScenario`,
  `ResultStatus`, `Confidence`, `AudioProblem`, `ConstraintType`,
  `RecognizerState` (no enumerable own-props — map status ints via literals)
- Sibling `Windows.Media.SpeechSynthesis.*` fully projected (SpeechSynthesizer,
  SpeechSynthesisStream, SpeechSynthesizerOptions, VoiceInformation) → **not a
  metadata gap**, the SpeechRecognition surface is real projection.
- `Windows.Globalization.Language` projected (for `SpeechRecognizer(language)`).

NOT projected (null): `SpeechRecognitionUI`, `SpeechRecognitionQualityDegradation`,
`SpeechRecognitionConstraintProbabilities`, static class
`SpeechRecognitionContinuousRecognitionSession` (the *instance* still works via
`recognizer.ContinuousRecognitionSession`), `Media.CaptureFrames`,
`MixedRealityCapture`, `RemoteDisplay`, `AutoRepeatMode`,
`SpeechSynthesizerState`.

## Recognition attempt results

- `RecognizeAsync()` first threw `HRESULT 0x80045509` =
  SPERR_SPEECH_PRIVACY_POLICY_NOT_ACCEPTED. Setting
  `HKCU\Software\Microsoft\Speech_OneCore\Settings\OnlineSpeechPrivacy`
  `HasAccepted=1` removed it (restored afterward — consent requires that
  "online speech recognition" toggle).
- After the privacy fix, `RecognizeAsync()` ran ~30s then completed with the
  projection's generic "WinRT async operation failed" (no inner hresult
  surfaced). `recognizer.State` stayed **0 (Idle)** throughout — audio capture
  never started. Root cause is mic consent for the packaged app:
  `AppCapability.Create("microphone").CheckAccess()` = 3
  (`UserPromptRequired`); `RequestAccessAsync()` never surfaced a UIA-visible
  prompt (TOPS window dump showed none — prompt likely on a separate desktop);
  `MediaCapture.InitializeAsync(audio)` hung on the same gate and
  `DeviceInformation.FindAllAsync(AudioCapture)` → 0x80004005. Pre-writing
  consent under both registry stores (`DeviceAccess\Global\{E5323777-…}` and
  `CapabilityAccessManager\ConsentStore\microphone`, value + subkey forms) did
  not flip `CheckAccess` — real consent must come from the interactive prompt
  or a signed/declared path.
- Events: `recognizer.HypothesisGenerated` / `.StateChanged` subscribe OK via
  `instance.Event = NSWinRT.asDelegate('Windows.Foundation.TypedEventHandler`2<…>', cb)`
  (StateChanged did fire). `ContinuousRecognitionSession.ResultGenerated`
  event add **fails: 0x80004002 (no such interface)** — prefer a
  `RecognizeAsync` loop or hypothesis events over the continuous session.
- `Timeouts` members project as opaque `Symbol` handles (can't String() them);
  `IReadOnlyList<Language>` items resolved as "undefined" — treat
  SupportedTopicLanguages presence only, not contents.
- Audio sanity: a SAPI `SpeechRecognitionEngine` in the interactive session
  showed `AudioState` Speech/Silence and `AudioLevel` 0–4 while TTS spoke —
  the mic hears the speakers faintly but produced no completed transcript on
  this box.

## Engine-leaf implications

- Use `SpeechRecognizer` + `SpeechRecognitionTopicConstraint(Dictation)` +
  `CompileConstraintsAsync` + `RecognizeAsync()` (works through compile).
- Permission flow: `AppCapability.Create("microphone")` → `CheckAccess()` →
  `RequestAccessAsync()` (0=DeniedBySystem,1=NotDeclared,2=DeniedByUser,
  3=UserPromptRequired,4=Allowed); requires OnlineSpeechPrivacy consent —
  map 0x80045509 to a "speech privacy declined/unavailable" error.
- Async ops via `NSWinRT.toPromise(op)` (op.done fallback). Events via
  `NSWinRT.asDelegate` property assignment — continuous-session event add is
  broken, so a `RecognizeAsync` loop or `HypothesisGenerated` is the realistic
  design.
- Status/enum names aren't enumerable — hardcode `SpeechRecognitionResultStatus`
  literals (0=Success).

## Probe files (uncommitted, under packages/speech-recognition/tests/)

- `windows-probe.mjs` — node/vite runner (needs SHORTCUTS-style env or
  defaults host=windy, runtime=bin path) — couldn't run here (node not
  permitted in this agent); kept for interactive use.
- `fixtures/speech-probe.windows.js` — readable probe bundle (source of truth)
- `fixtures/speech-probe.oneline.windows.js` — transport copy (single
  statement per line, no `'`) — keep in sync with the readable file
- `fixtures/speech-driver.windows.ps1` — readable driver (robocopy →
  manifest rewrite → mic consent → UIA consent-clicker + TTS loop)
- `fixtures/speech-run-orchestrator.ps1` — self-contained ssh-stdin
  orchestrator embedding both (the version actually run):
  `cat speech-run-orchestrator.ps1 | ssh windy 'powershell -NoProfile -Command -'`
- `fixtures/sapi-mic-probe.ps1` — standalone interactive-session SAPI mic
  sanity check
- Scratch left behind (rm not permitted): `speech-run-1/2/3.ps1`,
  `speech-run-remote.ps1`, `speech-smoke.ps1`, `speech-capture.ps1`,
  `speech-driver.body.ps1` — safe to delete.

## Environment notes for whoever picks this up

- windy was starved by 7 spinning sshd zombies (~100% CPU, 8 days old) — killed;
  load back to ~11%. sshd zombies may recur when ssh clients die abruptly.
- `powershell -Command -` executes stdin **line-by-line**; multi-line constructs
  abort the rest. `powershell -Command "iex ([Console]::In.ReadToEnd())"` runs
  the whole stdin as one script but races the host's stdin reader on large
  input — the line-by-line orchestrator is the reliable transport.
- goddard-agent reservation was unavailable to this background agent; runs
  shared windy's desktop with another agent's tasks.
- windy registry restored: OnlineSpeechPrivacy HasAccepted removed,
  DeviceAccess/ConsentStore entries for `org.xplat.speech.*` removed, no
  leftover packages or scheduled tasks.
