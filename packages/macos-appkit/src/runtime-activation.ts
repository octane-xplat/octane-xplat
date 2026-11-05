// This leaf is the runtime's first import. Its state must exist before native
// classes in other imports register and can reenter the public root facade.
let phase: 'constructing' | 'activating' | 'active' | 'failed' = 'constructing'
let failure: unknown

export function assertRuntimeActive(operation: string): void {
  if (phase === 'failed') {
    throw failure
  }
  if (phase !== 'active') {
    throw new Error(`AppKit runtime is ${phase}; ${operation} requires activation`)
  }
}

/** One activation for the loaded process; failed native registration is not retried. */
export function activateRuntime(install: () => void): void {
  if (phase === 'active') {
    return
  }
  if (phase === 'failed') {
    throw failure
  }
  if (phase !== 'constructing') {
    throw new Error(`AppKit runtime is ${phase}; activation cannot reenter`)
  }
  phase = 'activating'
  try {
    install()
    phase = 'active'
  } catch (error) {
    failure = error
    phase = 'failed'
    throw error
  }
}
