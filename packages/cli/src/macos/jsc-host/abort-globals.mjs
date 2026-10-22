import { AbortController, AbortSignal } from 'abort-controller/dist/abort-controller.js'

// Shared AppKit host capability. Preserve a provider installed by the runtime.
// This engine supplies the abort-event/aborted subset used by Octane requests.
globalThis.AbortController ??= AbortController
globalThis.AbortSignal ??= AbortSignal
