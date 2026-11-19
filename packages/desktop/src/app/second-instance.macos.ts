import { lookupGlobal } from '@octane-xplat/lib/capability'
import { NSFileManager } from '@octane-xplat/platform/macos'
import { watchSecondInstance, type SingleInstanceSupport } from './second-instance.js'

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function createMacOSSingleInstance(isReady: () => boolean): SingleInstanceSupport {
  let ownsLock = false
  return {
    supportsSingleInstanceLock: () =>
      typeof lookupGlobal(['__xplatClaimSingleInstance']) === 'function' &&
      typeof lookupGlobal(['__xplatPollSecondInstance']) === 'function',
    requestSingleInstanceLock() {
      if (ownsLock) return true
      if (isReady()) throw new Error('Request the single-instance lock before mounting the macOS app')

      const claim = lookupGlobal(['__xplatClaimSingleInstance'])
      const argv = lookupGlobal(['__xplatLaunchArguments'])
      if (typeof claim !== 'function' || !isStringArray(argv)) {
        throw new Error('This macOS host has no packaged single-instance bridge')
      }
      const workingDirectory = NSFileManager.defaultManager.currentDirectoryPath
      const result: unknown = claim(JSON.stringify({ argv, workingDirectory }))
      if (typeof result !== 'boolean') throw new Error('Invalid macOS single-instance result')
      ownsLock = result
      return result
    },
    supportsSecondInstance: () => ownsLock,
    addSecondInstanceHandler(handler) {
      const poll = lookupGlobal(['__xplatPollSecondInstance'])
      if (typeof poll !== 'function') throw new Error('This macOS host cannot receive second launches')
      return watchSecondInstance(isReady, () => {
        const raw: unknown = poll()
        if (raw === null) return null
        if (typeof raw !== 'string') throw new Error('Invalid message from the macOS launch bridge')

        const launch: unknown = JSON.parse(raw)
        if (typeof launch !== 'object' || launch === null ||
          !('argv' in launch) || !isStringArray(launch.argv) ||
          !('workingDirectory' in launch) || typeof launch.workingDirectory !== 'string') {
          throw new Error('Invalid launch arguments from the macOS host')
        }
        return { argv: launch.argv, workingDirectory: launch.workingDirectory }
      }, handler)
    },
  }
}
