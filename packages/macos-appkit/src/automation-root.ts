import type { UniversalRoot } from 'octane/universal/native'

const debugRoots = new Map<UniversalRoot, object>()

export function appKitAutomationEnabled(): boolean {
  return process.env.OCTANE_MACOS_AUTOMATION === '1'
}

/** Publish debug state for the same lifetime as the root it represents. */
export function publishAppKitAutomation(root: UniversalRoot, debug: object): () => void {
  try {
    Object.defineProperty(root, '__macosDebug', { value: debug, configurable: true })
    Object.defineProperty(globalThis, '__xplatMacOSDebug', { value: debug, configurable: true })
    debugRoots.set(root, debug)
  } catch (error) {
    if (Reflect.get(root, '__macosDebug') === debug) {
      Reflect.deleteProperty(root, '__macosDebug')
    }
    throw error
  }

  return () => {
    debugRoots.delete(root)
    if (Reflect.get(root, '__macosDebug') === debug) {
      Reflect.deleteProperty(root, '__macosDebug')
    }
    if (Reflect.get(globalThis, '__xplatMacOSDebug') === debug) {
      const latest = [...debugRoots.values()].at(-1)
      if (latest) {
        Object.defineProperty(globalThis, '__xplatMacOSDebug', {
          value: latest,
          configurable: true,
        })
      } else {
        Reflect.deleteProperty(globalThis, '__xplatMacOSDebug')
      }
    }
  }
}
