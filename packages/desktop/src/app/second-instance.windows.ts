import { lookupGlobal } from '@octane-xplat/lib/capability'
import { watchSecondInstance, type SingleInstanceSupport } from './second-instance.js'

function invoke(method: 'IsSupported' | 'Acquire' | 'Poll'): string {
  const bridge = lookupGlobal(['NSWinRT', 'dotnet'])
  if (typeof bridge !== 'object' || bridge === null ||
    !('invoke' in bridge) || typeof bridge.invoke !== 'function') {
    throw new Error('This Windows host has no managed single-instance bridge')
  }
  return String(bridge.invoke('', 'OctaneXplat.Desktop.DesktopSingleInstance', method, []))
}

export function createWindowsSingleInstance(isReady: () => boolean): SingleInstanceSupport {
  let ownsLock = false
  return {
    supportsSingleInstanceLock() {
      try {
        return invoke('IsSupported') === 'yes'
      } catch {
        return false
      }
    },
    requestSingleInstanceLock() {
      if (ownsLock) return true
      if (isReady()) throw new Error('Request the single-instance lock before mounting the Windows app')

      const result = invoke('Acquire')
      if (result !== 'primary' && result !== 'redirected') {
        throw new Error('Windows could not claim or redirect this launch')
      }
      ownsLock = result === 'primary'
      return ownsLock
    },
    supportsSecondInstance: () => ownsLock,
    addSecondInstanceHandler(handler) {
      return watchSecondInstance(isReady, () => {
        const argv: unknown = JSON.parse(invoke('Poll'))
        if (argv === null) return null
        if (!Array.isArray(argv) || !argv.every((argument) => typeof argument === 'string')) {
          throw new Error('Invalid launch arguments from the Windows host')
        }
        return { argv }
      }, handler)
    },
  }
}
