# Sherpa ONNX leaf package plan

Status: proposal, 2026-10-20. This records the intended package and the work
needed to qualify it. No Xplat implementation or platform runtime probe has
been completed. API names below are proposed contracts, not shipped exports.

## Outcome and agreed direction

Build `packages/sherpa-onnx`, published as `@octane-xplat/sherpa-onnx`, for
local speech recognition and synthesis. Keep the inference engine outside
`@octane-xplat/ui`: native binaries, WASM, model storage, and engine lifetimes
are independent costs that belong in a leaf package.

Include `/recorder` and `/audio` integrations in the initial usable release,
with `@octane-xplat/recorder` and `@octane-xplat/audio` as optional peers.
The core works with supplied audio and never acquires a microphone or starts
playback. Use existing sherpa model directories and configuration conventions;
do not require users to author an Xplat model manifest.

Use [XDcobra/react-native-sherpa-onnx][rn] as the principal mobile reference,
alongside [sherpa-onnx itself][sherpa]. Borrow applicable ideas and, where
justified, reusable native code with attribution. React Native TurboModules,
React hooks, and React Native filesystem/download dependencies are not usable
as Xplat runtime dependencies.

This plan authorizes no implementation by itself. Record numbered architecture
commitments through Silo before adding them to the decision ledger during
implementation; this proposal does not allocate decision numbers.

## Scope and release boundary

The initial release must provide offline recognition, streaming recognition
for a qualified model family, batch synthesis, model loading, foreground
model preparation, and both audio integration subpaths. Limit the first
qualified matrix to one small offline ASR model, one streaming transducer
model, and one TTS voice that can run across the intended targets. Choose
exact artifacts and revisions during feasibility work, rather than assuming
every upstream model works in every backend.

| Area | Initial commitment | Later expansion |
| --- | --- | --- |
| Recognition | Supplied mono PCM; completed WAV recordings; one streaming family | More model families, arbitrary encoded audio |
| Synthesis | Text to complete PCM output; playback through `/audio` | Incremental synthesis and low-latency PCM playback |
| Model sources | Bundled files, downloaded upstream layouts, explicitly mapped files | Additional hosted catalogs and Android asset delivery |
| Downloads | Explicit foreground operation, cancellation, progress, verified publication | Background transfers and resumable extraction |
| Execution | CPU baseline, worker/background execution | Individually qualified acceleration providers |
| Other speech tasks | Preserve room for additional entry points | VAD, diarization, speaker embeddings, enhancement, separation, alignment |

Web, iOS, Android, and experimental AppKit macOS are intended targets. Prove
the uncertain architecture in web → iOS → macOS order, then qualify Android
before calling mobile support complete. Investigate Linux and Windows host
options explicitly; do not infer native support from an upstream OS listing
or infer WebView support from a desktop Chromium pass. An unsupported target
must expose matching public types and a clear unsupported result/error.

## Evidence and references

These are documentation/source findings, not Xplat runtime qualification.
Capture exact upstream commits and binary digests before adopting code or
artifacts; the links below follow moving branches.

| Evidence | What it establishes | What remains unproven |
| --- | --- | --- |
| [Sherpa capability/platform overview][sherpa] | Native speech engines and multiple language bindings exist | Xplat bridge, model parity, and performance |
| [Sherpa browser build][wasm] | Browser WASM speech recognition has an upstream path | Reusable worker loading, dynamic models, browser coverage, TTS |
| [Sherpa Apple package][apple] | iOS/macOS XCFrameworks and ONNX Runtime linkage are available | NativeScript/AppKit packaging, deployment minimums, simulator slices |
| [Sherpa Android guide][android] | Native Android integration is documented | Our packaged ABI/API-level compatibility and device behavior |
| [RN model setup][rn-models] | Asset/file sources, directory inspection, required-file checks, and explicit/automatic type selection | Whether its detection rules are suitable for our shared implementation |
| [RN download manager][rn-downloads] | Release-backed discovery and archive preparation are useful precedents | Cross-platform extraction and our storage/transport choices |
| [RN PCM stream][rn-pcm] | Capture/resampling and serialized recognition input need explicit contracts | Compatibility with our recorder's public interface |
| [ONNX external data][onnx-data] | A graph can reference external tensor files | Complete multi-graph speech pipeline discovery |
| [Hub downloads][hub] | Repository files can be addressed at a fixed revision | Sherpa-specific role mapping and a browser/native transport |

The RN reference uses directory heuristics, not a universal model manifest.
Treat ambiguous detection as a condition requiring an explicit choice. Its
documented defaults are reference material, not an obligation to silently
choose a model architecture or quantization variant.

## Existing audio contracts and required work

The current source contracts are
[`packages/recorder/src/types.ts`](../../packages/recorder/src/types.ts) and
[`packages/audio/src/types.ts`](../../packages/audio/src/types.ts).

| Existing interface | Verified source contract | Implication |
| --- | --- | --- |
| `AudioRecorder.stop()` | Complete 16-bit little-endian PCM RIFF/WAVE bytes, actual rate/channel count, optional native path | Batch transcription can compose without changing the recorder API |
| Recorder subscriptions | State, permission, duration, meter, error | No public live PCM subscription exists today |
| `AudioPlayer.setQueue()` | Tracks with string `source` | Generated PCM needs a WAV file or browser object URL before playback |
| `AudioPlayer.play()` | Starts playback; state is separately observable | Resolving `play()` does not establish end of speech or safe asset deletion |

The recorder integration initially adapts completed recordings. Live
microphone transcription requires a separately reviewed PCM capture contract
in `@octane-xplat/recorder`, delivered before advertising that workflow.
Capture, permission handling, interruptions, and native audio-session ownership
remain in the recorder. Do not implement a second microphone stack inside
sherpa to bypass that prerequisite.

Generated speech playback initially writes WAV to an owned temporary resource.
No raw PCM sink is assumed in the existing player. Later incremental playback
requires a general audio-package extension, with underrun and cancellation
behavior qualified independently.

## Package boundaries

| Entry point | Responsibility | Audio peer requirement |
| --- | --- | --- |
| Root | Shared types, capabilities, model inspection, recognizer/synthesizer factories | Neither audio peer |
| `/models` | Explicit download/cache preparation, local model removal | Neither audio peer |
| `/recorder` | Completed-recording transcription; later recorder PCM connection | Recorder |
| `/audio` | Generated speech resources and playback composition | Audio |

There is no eager model download, native engine allocation, microphone prompt,
or playback at import time. Root exports and declarations must not re-export
the optional integration modules. Dependency direction is sherpa integration
→ recorder/audio; recorder and audio never import sherpa.

Declare both audio packages as optional peers, use `workspace:*` for local
workspace specs, and follow the repository's release transformation for
published ranges. Inspect the packed manifest to ensure consumers receive
usable ranges. Required engine libraries remain owned dependencies/artifacts;
optional peers are not a way to hide a mandatory engine dependency.

```json
{
  "peerDependencies": {
    "@octane-xplat/recorder": "workspace:*",
    "@octane-xplat/audio": "workspace:*"
  },
  "peerDependenciesMeta": {
    "@octane-xplat/recorder": { "optional": true },
    "@octane-xplat/audio": { "optional": true }
  }
}
```

Verify root imports and root declarations in an installed consumer with both
peers absent. Each integration must enforce its declared peer requirement;
test either a useful install/import diagnostic or an explicit factory-time
diagnostic according to the chosen import mechanism. Optional peer metadata
alone does not isolate runtime imports or declaration resolution.

Suggested source layout, with identical exports/types across platform leaves:

```text
packages/sherpa-onnx/
  src/
    types.ts
    index.ts / index.web.ts / index.macos.ts
    engine.ios.ts / engine.android.ts / engine.web.ts / engine.macos.ts
    engine.linux.ts / engine.windows.ts
    model-detection.ts
    models/                 # platform storage/transport leaves
    recorder/               # imports the optional recorder peer
    audio/                  # imports the optional audio peer
    workers/                # browser inference worker and owned WASM assets
  platforms/                # native bridge/build integration
  tests/
  tsconfig.envs.json
```

Select platform filenames/export conditions using current framework
conventions. Browser globals stay in browser leaves. Factories need no Octane
hooks; add hooks only when a demonstrated app workflow benefits from them.

## Model sources, detection, and preparation

Represent source location separately from task configuration. The following
draft shape allows upstream folders, browser resources, and explicit roles
without defining a required on-disk manifest. A relative asset path resolves
against the app's configured asset root; native absolute paths never become
browser URLs automatically.

```ts
export type ModelSource =
  | { kind: 'asset'; path: string }
  | { kind: 'directory'; path: string }
  | { kind: 'files'; files: Readonly<Record<string, string | Uint8Array>> }

export type PcmAudio = {
  samples: Float32Array
  sampleRate: number
  channels: 1
}
```

Recognize existing supported folder layouts and validate required roles before
allocating an engine. Report candidates, selected files, precision, missing
files, and unsupported hardware requirements. Explicit type/file selections
override detection; ambiguity fails with actionable candidate information.
The file-role map is the escape hatch for unfamiliar names. Define supported
role keys per model family in the implementation's discriminated types.

```ts
import { inspectModel, createRecognizer } from '@octane-xplat/sherpa-onnx'

const source = { kind: 'asset', path: 'models/english-offline' } as const
const inspection = await inspectModel({ source, task: 'recognition' })
if (!inspection.usable) {
  throw new Error(inspection.reason)
}
const recognizer = await createRecognizer({ model: inspection.model })
await recognizer.dispose()
```

Inspection returns an opaque model reference tied to selected files and backend
compatibility, not resident engine memory. Revalidate accessibility at engine
creation; inspection cannot guarantee that external files remain unchanged.
Optional ONNX metadata can inform inspection but cannot replace tokenizer,
lexicon, vocoder, or multi-graph validation.

```ts
import type { ModelSource } from '@octane-xplat/sherpa-onnx'

const customFiles: ModelSource = {
  kind: 'files',
  files: {
    encoder: '/models/custom/encoder.onnx',
    decoder: '/models/custom/decoder.onnx',
    joiner: '/models/custom/joiner.onnx',
    tokens: '/models/custom/tokens.txt',
  },
}
```

Preparation is an explicit foreground operation. Begin with a pinned upstream
archive URL plus expected SHA-256, and bundled/local sources; add pinned Hub
repository support once its transport is qualified. A curated catalog may
provide these descriptors so application authors need not write checksums.
Catalog entries are package-owned compatibility data, not a new mandatory
manifest format for model publishers.

```ts
import { prepareModel } from '@octane-xplat/sherpa-onnx/models'

export async function prepareEnglishModel(url: string, sha256: string) {
  const controller = new AbortController()
  return prepareModel({
    source: { kind: 'archive', url, sha256 },
    task: 'recognition',
    signal: controller.signal,
    onProgress: ({ phase, loadedBytes, totalBytes }) => {
      console.log(phase, loadedBytes, totalBytes)
    },
  })
}
```

Preparation must follow these storage invariants:

1. Key cached content by artifact digest/revision and selected variant, not a
   mutable URL or display name alone. Preserve upstream relative paths.
2. Download into staging, verify the expected digest, extract within an owned
   root, validate required files, and publish a ready marker atomically.
   A cache hit must pass readiness checks; no partial folder is loadable.
3. Reject extraction path escapes, escaping links, and unreasonable expansion.
   Support only formats demonstrated by the chosen fixtures; evaluate a proven
   small extraction engine rather than writing archive codecs.
4. Serialize preparation per cache key. Cancelling one caller must not corrupt
   a shared completed artifact or another caller's active request. Define
   subscription/reference-count behavior before deduplicating active work.
5. Report download, verification, extraction, and validation separately;
   unknown totals stay unknown. Report disk/quota failures distinctly.
6. Native storage uses an app-owned persistent model directory with platform
   backup policy considered. Browser storage is quota-limited and may be
   evicted; treat missing files as a recoverable cache miss. Probe IndexedDB
   or OPFS and WASM filesystem mounting before selecting one.

Engine disposal leaves cached files intact. Explicit removal must reject an
in-use model or defer removal until its final engine lease ends; it never
deletes caller-owned directories or bundled files.

```ts
import { removePreparedModel } from '@octane-xplat/sherpa-onnx/models'

export async function removeDownloadedVoice(cacheKey: string) {
  await removePreparedModel(cacheKey)
}
```

Background transfers, platform service setup, pause/resume persistence,
automatic updates, and PAD are subsequent work. An interrupted foreground
operation can restart safely; no background completion promise is implied.

## Inference contract and lifecycle

Core recognition accepts normalized mono float PCM with an explicit rate in
Hz. Reject invalid rates/non-finite samples and unsupported input formats;
never reinterpret stereo/interleaved data as mono. Specify the resampling
owner per backend and qualify it with non-model sample rates. Task factories
validate the selected model's offline/streaming capabilities.

```ts
import type { PcmAudio, Recognizer } from '@octane-xplat/sherpa-onnx'

export async function transcribeAudio(recognizer: Recognizer, audio: PcmAudio) {
  const result = await recognizer.transcribe(audio)
  return result.text
}
```

Streaming sessions are independent decoder states owned by an engine. Feed
chunks serially with bounded buffering. Distinguish partial results,
utterance endpoints, final input, and cancellation; do not equate a single
endpoint with the end of the entire microphone session.

```ts
import type { Recognizer, PcmAudio } from '@octane-xplat/sherpa-onnx'

export async function transcribeChunks(
  recognizer: Recognizer,
  chunks: AsyncIterable<PcmAudio>,
) {
  const session = await recognizer.createSession()
  try {
    for await (const chunk of chunks) {
      const update = await session.accept(chunk)
      console.log(update.text, update.isEndpoint)
    }
    return await session.finish()
  } finally {
    await session.dispose()
  }
}
```

Batch synthesis returns PCM plus the actual output rate. Text length, speaker,
language, and voice options must be validated against the selected model;
unsupported options must not silently change meaning across platforms.

```ts
import type { Synthesizer } from '@octane-xplat/sherpa-onnx'

export async function generateGreeting(synthesizer: Synthesizer) {
  return synthesizer.synthesize({ text: 'Your recording is ready.' })
}
```

The engine lifecycle is `loading → ready → disposing → disposed`, with
creation failure releasing all partially allocated resources. Streaming
sessions follow `open → finishing → finished → disposed`, or cancellation
followed by disposal. Dispose is idempotent and awaitable, rejects new work,
settles pending calls deterministically, and prevents late callbacks. Engine
disposal closes owned sessions before releasing model memory. Define whether
an active native call can be interrupted or must finish before disposal;
never free memory still in use by native code.

```ts
import { createRecognizer } from '@octane-xplat/sherpa-onnx'
import type { ModelReference } from '@octane-xplat/sherpa-onnx'

export async function withRecognizer(model: ModelReference) {
  const recognizer = await createRecognizer({ model })
  try {
    console.log(recognizer.capabilities())
  } finally {
    await recognizer.dispose()
  }
}
```

Factories perform expensive initialization and inference off the UI thread.
Native handles remain in the owning worker/serial queue; results cross the
bridge as bounded data. Serialize calls unless concurrent execution is proven
safe. Prefer typed-buffer transport over copying PCM through JSON/base64;
benchmark the actual bridge before choosing buffer ownership. Input buffers
must remain valid until the operation settles; transferring a caller's buffer
requires an explicit ownership contract.

Use a shared error taxonomy: unsupported target/model/provider, ambiguous or
missing files, integrity failure, storage/quota failure, invalid audio,
cancelled operation, disposed handle, queue overflow, and engine failure.
Preserve actionable native causes without embedding private audio or full
user filesystem paths in diagnostics.

## Recorder and playback integration

The `/recorder` subpath consumes the current `RecordingResult` and decodes its
PCM WAV into core input. The app owns capture and permission UI. The adapter
does not delete the recording or dispose the caller's recorder/recognizer.

```ts
import type { AudioRecorder } from '@octane-xplat/recorder'
import type { Recognizer } from '@octane-xplat/sherpa-onnx'
import { transcribeRecording } from '@octane-xplat/sherpa-onnx/recorder'

export async function finishAndTranscribe(
  recorder: AudioRecorder,
  recognizer: Recognizer,
) {
  const recording = await recorder.stop()
  return transcribeRecording({ recognizer, recording })
}
```

Before adding live integration, design a reusable recorder PCM session with
sample format, actual rate, channels, timestamps, buffer ownership,
backpressure, and interruption semantics. Plan a capture-only mode so long
transcription sessions do not require retaining a complete WAV in memory.
Probe iOS audio-engine capture, Android capture dispatch, browser AudioWorklet,
and the macOS bridge. Preserve existing recording behavior and avoid a second
audio session competing with the recorder. This is a prerequisite milestone,
not a shipped capability assumed by the snippet above.

The `/audio` adapter materializes complete synthesized PCM as a temporary WAV
resource whose `track` fits the existing player. The app controls playback;
the resource stays alive until the player releases it. The example uses a
dedicated caller-owned player so teardown ownership is explicit.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'
import type { PcmAudio } from '@octane-xplat/sherpa-onnx'
import { createSpeechTrack } from '@octane-xplat/sherpa-onnx/audio'

export async function openSpeechPlayback(audio: PcmAudio) {
  const resource = await createSpeechTrack(audio)
  const player = createAudioPlayer()
  try {
    await player.setQueue([resource.track])
    await player.play()
  } catch (error) {
    player.dispose()
    await resource.dispose()
    throw error
  }
  return {
    player,
    async dispose() {
      player.dispose()
      await resource.dispose()
    },
  }
}
```

On web the resource owns its object URL; on native it owns only its generated
temporary file. Resource disposal is idempotent. Cancellation, replacing a
track, completed playback, and failed playback all need explicit cleanup;
do not revoke/delete when `play()` first resolves. Concurrent capture/playback
and echo cancellation require separate qualification before a conversational
duplex workflow is documented.

## Platform implementation and packaging

| Target | Proposed mechanism | Required feasibility evidence |
| --- | --- | --- |
| Web | Sherpa WASM in a dedicated worker; dynamically mount selected files | Same worker can load/change models; ASR/TTS exports; emitted asset URLs; production base paths; CORS/CSP; memory growth and cancellation |
| iOS | Narrow ObjC-compatible facade over C/C++ engine, invoked through NativeScript | Device and simulator slices, metadata exposure, background queue, memory ownership, audio interruption coexistence |
| macOS | Equivalent facade in the AppKit host's native leaf machinery | XCFramework linkage, package discovery, signing/rpaths, typed-array transport, owned queue cleanup |
| Android | Java/Kotlin facade over JNI or existing upstream bindings | ABI coverage, minimum API, native library/ONNX Runtime conflicts, 16 KB page compatibility, background execution and device interruption |
| Linux/Windows | Inspect each supported native host's bridge and WASM host separately | Concrete load/worker/asset feasibility; otherwise explicit documented unsupported subset |

Use the CPU backend as the baseline. A Node addon is not automatically usable
in NativeScript, AppKit, GJS, or a WebView; select the engine binding for the
actual host. Single-thread WASM in a worker avoids making cross-origin
isolation a default requirement; measure performance before deciding whether
a threaded build is necessary. Never claim a worker makes a model fast enough
for real-time recognition without measuring it.

Pin engine, ONNX Runtime, bridge headers, WASM build, and binary checksums as
one tested set. Inventory transitive binary costs and publish reproducible
build/download instructions. App installs must not fetch every platform's
binaries unnecessarily. Keep model weights outside the npm tarball and avoid
unrequested application-start downloads.

Compare direct upstream binaries with the RN reference's prebuilt pipeline;
select the smallest compatible maintained path after inspecting its license,
patches, ABI, and release provenance. Review model/voice licenses separately
from engine/wrapper licenses. Do not inherit FFmpeg, libarchive, React Native,
or broad codecs merely because the reference uses them. Archive support may
warrant an owned dependency, but it must be declared and justified.

## Implementation sequence and exit criteria

1. **Inspect and freeze reference inputs.** Record upstream commit IDs,
   release assets, licenses, and selected model digests. Inspect RN model
   detection, lifecycle, native queues, PCM transport, and packaging source.
   Use `exports-md` for package API exploration and `opensrc` when internal
   implementation inspection is needed. Inventory existing recorder/audio
   callers and tests with source-context and semantic impact tools before
   changing either package. Exit: concrete compatibility/dependency matrix.
2. **Prove web first.** Run supplied PCM recognition and batch synthesis with
   external model assets in a worker. Prove offline reuse, model replacement,
   cancellation/disposal, archive preparation, and production asset resolution.
   Test the intended Chromium/Firefox/WebKit subset. Exit: measured working
   model fixtures and a decision on WASM/storage/extraction strategy.
3. **Prove iOS, then macOS.** Load the same qualified model families, run
   inference off-thread, repeatedly create/dispose engines, and exercise
   packaging through installed consumers. Include iOS physical-device
   performance evidence, not only simulator results. Exit: source/build and
   actual runtime evidence recorded separately for each target.
4. **Qualify Android and assess remaining hosts.** Test the chosen binaries
   on a physical Android device and required emulator ABI. Record concrete
   Linux/Windows host findings. Exit: all intended targets either pass their
   stated subset or have explicit evidence-backed limitations.
5. **Land the core and model operations.** Implement shared types, detection,
   explicit configuration, inference ownership, foreground preparation, and
   native packaging. Promote important probes into maintained tests. Exit:
   packed consumers, failure cases, and public declarations pass.
6. **Ship both integration subpaths.** Implement completed-recording input
   and generated WAV track output using current peers. Add maintained examples
   for record → stop → transcript and text → speech → playback. Exit: optional
   peer isolation and temporary-resource cleanup verified on each target.
7. **Add live recorder integration.** Review and implement reusable PCM capture
   in recorder, then connect it to streaming recognition with bounded queues.
   Exit: actual microphone input, endpoint/final result behavior, interruptions,
   route changes, overload, and teardown verified. If this milestone is deferred,
   initial release notes must say the recorder adapter handles completed takes;
   streaming core support alone does not establish live microphone support.
8. **Document and release.** Add recipes, public guides, declarations, demos,
   skill guidance, and limitations. Follow lockstep package release and one-time
   npm/trusted-publisher setup. Exit: qualified scope and remaining gaps are
   explicit; no unfinished feature is described as supported.

Do not choose the final architecture based only on the RN wrapper's README.
If a milestone exposes an upstream limitation, record its scope, evidence,
and workaround using [upstream limitation guidance](../docs/upstream-limitations.md)
before building a local workaround. Store exploration state in Silo; keep
this design focused on intended behavior and conclusions.

## Verification and acceptance

| Layer | Required checks |
| --- | --- |
| Shared logic | Family/role mapping, ambiguous layouts, variant selection, WAV parsing/encoding, rate/channel validation, error normalization |
| Model storage | Interrupted downloads, digest mismatch, archive traversal, disk/quota failure, concurrent callers, stale ready markers, in-use deletion, caller-owned file preservation |
| Lifecycle | Repeated load/dispose, init failure, disposed calls, cancellation during native work, session isolation, bounded streaming queues, no late events |
| Package boundaries | Root imports/types with no audio peers; each adapter with its required peer only; no React Native/DOM/Node leakage into other targets |
| Runtime audio | Real microphone capture for live claims; actual audible output or loopback evidence for playback; denied permission, user gesture, interruptions and device changes |
| Model results | Fixed audio/text fixtures, meaningful transcript expectations, finite nonempty generated samples, duration/rate checks; tolerances for backend numeric variation |
| Performance | Cold load, cache reuse, peak memory, real-time factor, stream latency, bridge copies, synthesis latency on named hardware/browser versions |
| Distribution | Fresh packed install, production browser paths/worker assets, native device/simulator/ABI linkage, license inventory and tested binary set |

Measure performance against the duration of input audio and the chosen
model/device. Define acceptable latency and memory budgets after the initial
fixtures run, before making real-time or low-latency promises. Build success,
mock callbacks, and queued handler dispatch are not runtime audio evidence.

Use temporary `research/` probes through `pnpm probe doctor` and
`pnpm probe run <case> --target <target> --watch`. Promote preserved behavior
to maintained package tests. Reserve native-build/device resources and shut
down owned devices as required by the host broker. Browser/device checks run
locally; PR `checks` must not install browser engines or launch emulators.

Once the package exists, run its scoped checks and repeat the typecheck for
every additional package actually touched. The commands below are future
implementation checks; they do not run against a package that does not yet
exist.

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/sherpa-onnx
pnpm --filter @octane-xplat/sherpa-onnx test
pnpm --filter @octane-xplat/sherpa-onnx pack:check
pnpm --filter @octane-xplat/sherpa-onnx test:packed
pnpm check:recipes
```

Use one `tsconfig.envs.json` for the package and shared public declarations.
Check native leaves and web worker code in their declared environments.
Install packed consumers with pnpm to verify exported source, declaration
resolution, native artifacts, and dependency isolation together.

## Documentation and remaining decisions

The implementation needs recipes for offline transcription, model preparation,
and speech playback, then live transcription when qualified. Revisit
[`voice-memo`](../docs/recipes/voice-memo.md) if recorder behavior changes.
Record recipe coverage separately from target verification in Silo and run
`pnpm check:recipes`. Add a small maintained demo with explicit model download,
progress, transcript, playback, and cleanup, using the qualified fixtures.

Review the [Octane skill](../skills/octane-xplat/SKILL.md) and service/limit
references during implementation. Add task-oriented guidance for choosing
the audio integrations, model ownership, platform prerequisites, and proven
limits. This proposal alone changes no supported workflow or public API,
so it does not require a recipe or consumer skill change now.

Resolve these points with evidence before freezing the API:

- Exact common ASR/TTS model families, binary versions, deployment minimums,
  supported browser versions, and per-target capability results.
- WASM dynamic model mounting and TTS build; archive extraction dependency;
  browser persistence and eviction recovery.
- Native bridge buffer ownership, background scheduling, and cancel/dispose
  behavior during an active inference call.
- Detection ambiguity policy and stable typed configuration for each family.
- Model lease/removal behavior, cache location/backup policy, offline retention,
  and curated artifact provenance.
- The general recorder PCM extension and later audio streaming sink; neither
  is established by the current file-based interfaces.

[sherpa]: https://github.com/k2-fsa/sherpa-onnx
[rn]: https://github.com/XDcobra/react-native-sherpa-onnx
[rn-models]: https://github.com/XDcobra/react-native-sherpa-onnx/blob/main/docs/model-setup.md
[rn-downloads]: https://github.com/XDcobra/react-native-sherpa-onnx/blob/main/docs/download-manager.md
[rn-pcm]: https://github.com/XDcobra/react-native-sherpa-onnx/blob/main/docs/pcm-live-stream.md
[wasm]: https://k2-fsa.github.io/sherpa/onnx/wasm/build.html
[apple]: https://github.com/k2-fsa/sherpa-onnx/blob/master/Package.swift
[android]: https://k2-fsa.github.io/sherpa/onnx/android/index.html
[onnx-data]: https://onnx.ai/onnx/repo-docs/ExternalData
[hub]: https://huggingface.co/docs/huggingface_hub/guides/download
