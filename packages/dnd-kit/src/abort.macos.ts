import { AbortController, AbortSignal } from 'abort-controller/dist/abort-controller.js'

// The abstract core constructs AbortController at drag begin. AppKit's JSC
// host does not provide it; install only missing globals and leave other hosts intact.
const host = globalThis as any
host.AbortController ??= AbortController
host.AbortSignal ??= AbortSignal
