// Android speech engine — `android.speech.SpeechRecognizer` over the
// NativeScript Java interop globals. This leaf deliberately carries no
// `@nativescript/core` dependency (the package only declares
// `@octane-xplat/lib`), so the host surface is reached structurally:
//
// - the application context comes from
//   `com.tns.NativeScriptApplication.getInstance()` — the stock
//   NativeScript Application class registers itself statically;
// - the foreground activity is tracked through
//   `Application.registerActivityLifecycleCallbacks`;
// - permission prompts ride `ActivityResultRegistry` when the foreground
//   activity is a `ComponentActivity` (every `com.tns.NativeScriptActivity`
//   is, through AppCompatActivity) and fall back to the platform
//   `ACTION_REQUEST_PERMISSIONS` intent when no activity has been observed.
//
// Everything is resolved lazily through `lookupGlobal` so this module
// evaluates and typechecks in every environment — the web/macos/etc. lanes
// include unsuffixed sources and never see the `android`/`java`/`com`
// namespaces ambiently declared.
import { lookupGlobal } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import { mapAndroidSpeechError } from './error-map'
import { createSpeechService } from './session-core'
import type {
  SpeechBeginOptions,
  SpeechEngine,
  SpeechEngineHandle,
  SpeechEngineSink,
} from './session-core'

import { SpeechRecognitionError } from './types'
import type { SpeechRecognitionAvailability, SpeechRecognitionImpl } from './types'

const PERMISSION = 'android.permission.RECORD_AUDIO'
// Intent.ACTION_REQUEST_PERMISSIONS / EXTRA_REQUEST_PERMISSIONS_NAMES —
// stable string values since API 23; read literally so the engine needs no
// typed constant surface for a fallback path.
const REQUEST_PERMISSIONS_ACTION = 'android.content.pm.action.REQUEST_PERMISSIONS'
const REQUEST_PERMISSIONS_NAMES = 'android.content.pm.extra.REQUEST_PERMISSIONS_NAMES'
const REQUEST_PERMISSIONS_PACKAGE = 'android.content.pm.extra.REQUEST_PERMISSIONS_PACKAGE_NAME'
const ACTIVITY_NEW_TASK = 0x10000000 // Intent.FLAG_ACTIVITY_NEW_TASK
const PERMISSION_GRANTED_FALLBACK = 0 // PackageManager.PERMISSION_GRANTED
const PERMISSION_POLL_MS = 250
const PERMISSION_PROMPT_TIMEOUT_MS = 60_000

// ---------------------------------------------------------------------------
// Structural views of the host runtime — the real objects are
// `android.*`/`androidx.*`/`com.tns.*`/`java.*` interop proxies; tests stub
// them as plain objects. Only the members this engine calls are named.

interface AndroidIntentLike {
  putExtra(name: string, value: unknown): AndroidIntentLike
  setFlags(flags: number): AndroidIntentLike
}

interface AndroidStringList {
  isEmpty(): boolean
  get(index: number): string
}

interface AndroidResultsBundleLike {
  getStringArrayList(name: string): AndroidStringList | null
}

interface AndroidServiceList {
  isEmpty(): boolean
}

interface AndroidPackageManagerLike {
  queryIntentServices(intent: AndroidIntentLike, flags: number): AndroidServiceList | null
}

interface AndroidContextLike {
  checkSelfPermission?(permission: string): number
  getPackageName?(): string
  getPackageManager?(): AndroidPackageManagerLike | null
  registerActivityLifecycleCallbacks?(callbacks: unknown): void
  startActivity?(intent: AndroidIntentLike): void
}

interface AndroidActivityResultLauncherLike {
  launch(input: string): void
  unregister(): void
}

interface AndroidActivityResultRegistryLike {
  register(key: string, contract: unknown, callback: unknown): AndroidActivityResultLauncherLike
}

interface AndroidActivityLike {
  requestPermissions?(permissions: string[], requestCode: number): void
  shouldShowRequestPermissionRationale?(permission: string): boolean
  getActivityResultRegistry?(): AndroidActivityResultRegistryLike | null
}

// RecognitionListener is an interface — the interop proxy forwards every
// declared callback, so the implementation carries all of them, including
// the API 33/34 additions that fire regardless of feature use.
interface AndroidRecognitionListenerImpl {
  onReadyForSpeech(params: unknown): void
  onBeginningOfSpeech(): void
  onRmsChanged(rmsdB: number): void
  onBufferReceived(buffer: unknown): void
  onEndOfSpeech(): void
  onError(error: number): void
  onResults(results: AndroidResultsBundleLike | null): void
  onPartialResults(partialResults: AndroidResultsBundleLike | null): void
  onEvent(eventType: number, params: unknown): void
  onEndOfSegmentedSession(): void
  onSegmentResults(segmentResults: AndroidResultsBundleLike | null): void
  onLanguageDetection(results: AndroidResultsBundleLike | null): void
}

// Application.ActivityLifecycleCallbacks — the full surface. Every method
// the OS dispatches must exist on the JS proxy, including the API 29
// pre/post variants.
interface AndroidActivityCallbacksImpl {
  onActivityCreated(activity: AndroidActivityLike, savedInstanceState: unknown): void
  onActivityStarted(activity: AndroidActivityLike): void
  onActivityResumed(activity: AndroidActivityLike): void
  onActivityPaused(activity: AndroidActivityLike): void
  onActivityStopped(activity: AndroidActivityLike): void
  onActivitySaveInstanceState(activity: AndroidActivityLike, outState: unknown): void
  onActivityDestroyed(activity: AndroidActivityLike): void
  onActivityPreCreated(activity: AndroidActivityLike, savedInstanceState: unknown): void
  onActivityPostCreated(activity: AndroidActivityLike, savedInstanceState: unknown): void
  onActivityPreStarted(activity: AndroidActivityLike): void
  onActivityPostStarted(activity: AndroidActivityLike): void
  onActivityPreResumed(activity: AndroidActivityLike): void
  onActivityPostResumed(activity: AndroidActivityLike): void
  onActivityPrePaused(activity: AndroidActivityLike): void
  onActivityPostPaused(activity: AndroidActivityLike): void
  onActivityPreStopped(activity: AndroidActivityLike): void
  onActivityPostStopped(activity: AndroidActivityLike): void
  onActivityPreSaveInstanceState(activity: AndroidActivityLike, outState: unknown): void
  onActivityPostSaveInstanceState(activity: AndroidActivityLike, outState: unknown): void
  onActivityPreDestroyed(activity: AndroidActivityLike): void
  onActivityPostDestroyed(activity: AndroidActivityLike): void
}

interface AndroidSpeechRecognizerLike {
  setRecognitionListener(listener: unknown): void
  startListening(intent: AndroidIntentLike): void
  stopListening(): void
  cancel(): void
  destroy(): void
}

interface AndroidSpeechStatics {
  createSpeechRecognizer(context: AndroidContextLike): AndroidSpeechRecognizerLike | null
  isRecognitionAvailable?(context: AndroidContextLike): boolean
}

interface AndroidRuntime {
  app: {
    Application: {
      ActivityLifecycleCallbacks: new (impl: AndroidActivityCallbacksImpl) => unknown
    }
  }
  content: {
    Intent: (new (action: string) => AndroidIntentLike) & { FLAG_ACTIVITY_NEW_TASK?: number }
    pm: { PackageManager: { PERMISSION_GRANTED: number } }
  }
  speech: {
    RecognitionListener: new (impl: AndroidRecognitionListenerImpl) => unknown
    RecognitionService: { SERVICE_INTERFACE: string }
    RecognizerIntent: {
      ACTION_RECOGNIZE_SPEECH: string
      EXTRA_CALLING_PACKAGE: string
      EXTRA_LANGUAGE: string
      EXTRA_LANGUAGE_MODEL: string
      EXTRA_PARTIAL_RESULTS: string
      EXTRA_RESULTS: string
      LANGUAGE_MODEL_FREE_FORM: string
    }
    SpeechRecognizer: AndroidSpeechStatics
  }
}

interface NativeScriptApplicationClass {
  getInstance(): AndroidContextLike | null
}

interface AndroidxActivityResultNamespace {
  ActivityResultCallback: new (impl: { onActivityResult(result: unknown): void }) => unknown
  contract: {
    ActivityResultContracts: {
      RequestPermission: new () => unknown
    }
  }
}

interface JavaRuntime {
  util?: {
    Locale?: { getDefault(): { toLanguageTag(): string } }
  }
}

// ---------------------------------------------------------------------------
// Host access

interface AndroidHost {
  ns: AndroidRuntime
  context: AndroidContextLike
}

const UNSUPPORTED_PERMISSION: PermissionResponse = {
  status: 'unsupported',
  granted: false,
  canAskAgain: false,
}

// The interop globals are host-provided and untyped at the boundary — read
// them once through lookupGlobal and bound the residual assertion to the
// named structural types above.
function readHost(): AndroidHost | null {
  const ns = lookupGlobal(['android']) as AndroidRuntime | undefined
  const appClass = lookupGlobal(['com', 'tns', 'NativeScriptApplication']) as
    | NativeScriptApplicationClass
    | undefined
  if (ns === undefined || appClass === undefined) {
    return null
  }

  let context: AndroidContextLike | null = null
  try {
    context = appClass.getInstance?.() ?? null
  } catch {
    return null
  }

  if (context === null) {
    return null
  }

  return { ns, context }
}

const grantedValue = (host: AndroidHost): number =>
  host.ns.content?.pm?.PackageManager?.PERMISSION_GRANTED ?? PERMISSION_GRANTED_FALLBACK

const permissionGranted = (host: AndroidHost): boolean =>
  host.context.checkSelfPermission?.(PERMISSION) === grantedValue(host)

// ---------------------------------------------------------------------------
// Foreground-activity tracking

let trackingAttempted = false
let foregroundActivity: AndroidActivityLike | null = null
// Incremented on every resume — a post-request bump marks the permission
// prompt's dismissal when no precise result channel exists.
let resumeGeneration = 0

const noop = (): void => {}

function ensureActivityTracking(host: AndroidHost): void {
  if (trackingAttempted) {
    return
  }

  trackingAttempted = true
  const Callbacks = host.ns.app?.Application?.ActivityLifecycleCallbacks
  if (!Callbacks || !host.context.registerActivityLifecycleCallbacks) {
    return
  }

  const callbacks = new Callbacks({
    onActivityResumed: (activity) => {
      foregroundActivity = activity
      resumeGeneration++
    },
    onActivityPaused: (activity) => {
      if (foregroundActivity === activity) {
        foregroundActivity = null
      }
    },
    onActivityDestroyed: (activity) => {
      if (foregroundActivity === activity) {
        foregroundActivity = null
      }
    },
    onActivityCreated: noop,
    onActivityStarted: noop,
    onActivityStopped: noop,
    onActivitySaveInstanceState: noop,
    onActivityPreCreated: noop,
    onActivityPostCreated: noop,
    onActivityPreStarted: noop,
    onActivityPostStarted: noop,
    onActivityPreResumed: noop,
    onActivityPostResumed: noop,
    onActivityPrePaused: noop,
    onActivityPostPaused: noop,
    onActivityPreStopped: noop,
    onActivityPostStopped: noop,
    onActivityPreSaveInstanceState: noop,
    onActivityPostSaveInstanceState: noop,
    onActivityPreDestroyed: noop,
    onActivityPostDestroyed: noop,
  })

  try {
    host.context.registerActivityLifecycleCallbacks(callbacks)
  } catch {
    // Tracking is opportunistic — the intent fallback still prompts.
  }
}

// ---------------------------------------------------------------------------
// Engine surface

function defaultLang(): string {
  const javaNs = lookupGlobal(['java']) as JavaRuntime | undefined
  try {
    const tag = javaNs?.util?.Locale?.getDefault?.().toLanguageTag?.()
    return typeof tag === 'string' ? tag : String(tag ?? '')
  } catch {
    return ''
  }
}

// Android cannot distinguish "never asked" from a prompt the OS answered
// invisibly — the engine remembers whether it issued a request this
// process lifetime. Unlike @octane-xplat/recorder the flag is in-memory
// only (no ApplicationSettings without @nativescript/core), so a fresh
// process reports 'undetermined' until the first request.
let askedOnce = false

function readPermission(): Promise<PermissionResponse> {
  const host = readHost()
  if (host !== null) {
    ensureActivityTracking(host)
  }

  return Promise.resolve(readPermissionSnapshot())
}

function readPermissionSnapshot(): PermissionResponse {
  const host = readHost()
  if (host === null || !host.context.checkSelfPermission) {
    return UNSUPPORTED_PERMISSION
  }

  if (permissionGranted(host)) {
    return { status: 'granted', granted: true, canAskAgain: true }
  }

  if (!askedOnce) {
    return { status: 'undetermined', granted: false, canAskAgain: true }
  }

  const rationale = foregroundActivity?.shouldShowRequestPermissionRationale?.(PERMISSION)
  return {
    status: 'denied',
    granted: false,
    canAskAgain: rationale === undefined ? true : rationale,
  }
}

// Precise path — androidx.activity ActivityResultRegistry on a
// ComponentActivity. Resolves null when the path is unavailable so the
// caller can fall through to the intent path.
function requestViaResultRegistry(
  host: AndroidHost,
  activity: AndroidActivityLike,
): Promise<PermissionResponse> | null {
  const registry = activity.getActivityResultRegistry?.()
  const resultNs = lookupGlobal(['androidx', 'activity', 'result']) as
    | AndroidxActivityResultNamespace
    | undefined
  const Contract = resultNs?.contract?.ActivityResultContracts?.RequestPermission
  const Callback = resultNs?.ActivityResultCallback
  if (!registry || !Contract || !Callback) {
    return null
  }

  let launcher: AndroidActivityResultLauncherLike | null = null
  return new Promise<PermissionResponse>((resolve) => {
    let settled = false
    const finish = (): void => {
      if (settled) {
        return
      }

      settled = true
      try {
        launcher?.unregister()
      } catch {
        // Launcher already released.
      }

      resolve(readPermissionSnapshot())
    }

    const timeout = setTimeout(finish, PERMISSION_PROMPT_TIMEOUT_MS)
    const guardedFinish = (): void => {
      clearTimeout(timeout)
      finish()
    }

    try {
      const callback = new Callback({
        onActivityResult: () => {
          guardedFinish()
        },
      })

      launcher = registry.register('octane-xplat.speech.record_audio', new Contract(), callback)
      launcher.launch(PERMISSION)
    } catch {
      clearTimeout(timeout)
      finish()
    }
  })
}

// Fallback path — the platform's GrantPermissionsActivity via a plain
// context startActivity. Results are read back by polling
// checkSelfPermission; a tracked resume ends the wait on dismissal.
function requestViaIntent(host: AndroidHost): Promise<PermissionResponse> {
  const Intent = host.ns.content?.Intent
  if (!Intent || !host.context.startActivity) {
    return Promise.resolve(readPermissionSnapshot())
  }

  let intent: AndroidIntentLike
  try {
    const names = (
      Array as unknown as { create?(type: string, count: number): unknown[] }
    ).create?.('java.lang.String', 1)

    if (!names) {
      return Promise.resolve(readPermissionSnapshot())
    }

    names[0] = PERMISSION
    intent = new Intent(REQUEST_PERMISSIONS_ACTION)
      .putExtra(REQUEST_PERMISSIONS_NAMES, names)
      .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK ?? ACTIVITY_NEW_TASK)

    const pkg = host.context.getPackageName?.()
    if (pkg) {
      intent.putExtra(REQUEST_PERMISSIONS_PACKAGE, pkg)
    }

    host.context.startActivity(intent)
  } catch {
    return Promise.resolve(readPermissionSnapshot())
  }

  const resumeMark = resumeGeneration
  return new Promise<PermissionResponse>((resolve) => {
    const started = Date.now()
    const timer = setInterval(() => {
      const host2 = readHost()
      if (host2 !== null && permissionGranted(host2)) {
        clearInterval(timer)
        resolve(readPermissionSnapshot())
        return
      }

      // The grant prompt overlays the app — our activity resuming again
      // means it dismissed. Without tracking (no resume ever observed) the
      // timeout is the only bound.
      if (resumeGeneration !== resumeMark || Date.now() - started > PERMISSION_PROMPT_TIMEOUT_MS) {
        clearInterval(timer)
        resolve(readPermissionSnapshot())
      }
    }, PERMISSION_POLL_MS)
  })
}

function ensurePermission(): Promise<PermissionResponse> {
  const host = readHost()
  if (host === null || !host.context.checkSelfPermission) {
    return Promise.resolve(UNSUPPORTED_PERMISSION)
  }

  ensureActivityTracking(host)

  if (permissionGranted(host)) {
    return Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })
  }

  const wasAsked = askedOnce
  askedOnce = true
  const activity = foregroundActivity

  // A denial with the "don't ask again" flag is terminal — the OS ignores
  // further requests without UI. Detect it before prompting so the call
  // does not stall on a dialog that never appears. The check only applies
  // after a real request: rationale is also false before the first ask.
  if (wasAsked && activity?.shouldShowRequestPermissionRationale?.(PERMISSION) === false) {
    return Promise.resolve(readPermissionSnapshot())
  }

  if (activity !== null) {
    const viaRegistry = requestViaResultRegistry(host, activity)
    if (viaRegistry !== null) {
      return viaRegistry
    }
  }

  return requestViaIntent(host)
}

function probeService(host: AndroidHost): boolean {
  const statics = host.ns.speech?.SpeechRecognizer
  try {
    if (typeof statics?.isRecognitionAvailable === 'function') {
      return Boolean(statics.isRecognitionAvailable(host.context))
    }
  } catch {
    // Fall through to the intent-services probe.
  }

  try {
    const Intent = host.ns.content?.Intent
    const serviceInterface = host.ns.speech?.RecognitionService?.SERVICE_INTERFACE
    const pm = host.context.getPackageManager?.()
    if (Intent && serviceInterface && pm?.queryIntentServices) {
      const services = pm.queryIntentServices(new Intent(serviceInterface), 0)
      return services !== null && !services.isEmpty()
    }
  } catch {
    // No usable probe.
  }

  return false
}

function availability(lang?: string): Promise<SpeechRecognitionAvailability> {
  const host = readHost()
  const resolved = lang ?? defaultLang()
  if (host === null) {
    return Promise.resolve({
      available: false,
      reason: 'unsupported',
      lang: resolved,
      networkUse: null,
      continuous: false,
    })
  }

  // Language availability has no queryable API — EXTRA_LANGUAGE is a
  // best-effort passthrough and the service answers
  // ERROR_LANGUAGE_NOT_SUPPORTED/UNAVAILABLE during a session. The probe
  // therefore reports the requested tag verbatim.
  const available = probeService(host)
  return Promise.resolve({
    available,
    reason: available ? null : 'service-unavailable',
    lang: resolved,
    // Google's recognizer may run on-device (downloaded packs) or online —
    // 'possible' covers both; there is no per-request offline guarantee.
    networkUse: available ? 'possible' : null,
    // Android sessions always self-end on their own endpoint; there is no
    // keep-listening mode at this level, so continuous is unsupported.
    continuous: false,
  })
}

const firstResult = (bundle: AndroidResultsBundleLike | null, key: string): string => {
  const list = bundle?.getStringArrayList?.(key)
  if (!list || list.isEmpty()) {
    return ''
  }

  return String(list.get(0) ?? '')
}

function begin(options: SpeechBeginOptions, sink: SpeechEngineSink): SpeechEngineHandle {
  const host = readHost()
  const statics = host?.ns.speech?.SpeechRecognizer
  const Listener = host?.ns.speech?.RecognitionListener
  const Intent = host?.ns.content?.Intent
  const R = host?.ns.speech?.RecognizerIntent
  if (!host || !statics || !Listener || !Intent || !R) {
    throw new SpeechRecognitionError(
      'service-unavailable',
      'The Android speech recognizer is unavailable',
    )
  }

  // SpeechRecognizer must be created and driven on the main thread — in a
  // NativeScript app the JS thread is the main thread, so direct calls are
  // correct here.
  let recognizer: AndroidSpeechRecognizerLike | null = null
  try {
    recognizer = statics.createSpeechRecognizer(host.context)
  } catch (cause) {
    throw new SpeechRecognitionError(
      'service-unavailable',
      'SpeechRecognizer.createSpeechRecognizer failed',
      { cause },
    )
  }

  if (recognizer === null || recognizer === undefined) {
    throw new SpeechRecognitionError(
      'service-unavailable',
      'No speech recognition service is bound on this device',
    )
  }

  let released = false
  const release = (): void => {
    if (released) {
      return
    }

    released = true
    try {
      recognizer?.destroy()
    } catch {
      // Release is best-effort on teardown paths.
    }
  }

  try {
    recognizer.setRecognitionListener(
      new Listener({
        onReadyForSpeech: () => sink.listening(),
        onBeginningOfSpeech: noop,
        onRmsChanged: noop,
        onBufferReceived: noop,
        onEndOfSpeech: noop,
        onEndOfSegmentedSession: noop,
        onSegmentResults: noop,
        onLanguageDetection: noop,
        onEvent: noop,
        onError: (error) => {
          sink.failed(mapAndroidSpeechError(error))
        },
        onResults: (results) => {
          const text = firstResult(results, R.EXTRA_RESULTS)
          if (text !== '') {
            sink.hypothesis(text, true)
          }

          sink.finished()
        },
        onPartialResults: (partialResults) => {
          const text = firstResult(partialResults, R.EXTRA_RESULTS)
          if (text !== '') {
            sink.hypothesis(text, false)
          }
        },
      }),
    )

    const intent = new Intent(R.ACTION_RECOGNIZE_SPEECH)
    intent.putExtra(R.EXTRA_LANGUAGE_MODEL, R.LANGUAGE_MODEL_FREE_FORM)
    intent.putExtra(R.EXTRA_PARTIAL_RESULTS, options.interimResults)
    if (options.lang !== '') {
      intent.putExtra(R.EXTRA_LANGUAGE, options.lang)
    }

    const pkg = host.context.getPackageName?.()
    if (pkg) {
      intent.putExtra(R.EXTRA_CALLING_PACKAGE, pkg)
    }

    recognizer.startListening(intent)
  } catch (cause) {
    release()
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new SpeechRecognitionError(
      /permission/i.test(message) ? 'permission-denied' : 'service-unavailable',
      `SpeechRecognizer failed to start: ${message}`,
      { cause },
    )
  }

  return {
    finish() {
      try {
        recognizer?.stopListening()
      } catch {
        // Already ended or released.
      }
    },
    cancel() {
      try {
        recognizer?.cancel()
      } catch {
        // Already ended or released.
      }

      release()
    },
  }
}

const engine: SpeechEngine = {
  get supported() {
    const host = readHost()
    return (
      host !== null &&
      typeof host.ns.speech?.SpeechRecognizer?.createSpeechRecognizer === 'function'
    )
  },
  defaultLang,
  readPermission,
  ensurePermission,
  availability,
  begin,
  // Android delivers its own endpoint through onResults/onError — the core
  // needs no silence timer.
}

/** Speech recognition service — android.speech.SpeechRecognizer engine. */
export const speechRecognition: Permissioned<SpeechRecognitionImpl> = createSpeechService(engine)
