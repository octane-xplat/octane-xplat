import type { Environment, Storage } from './client'

// Windows leaf — OTA updates apply to the mobile release flow only. Reporting
// `releaseBuild: false` makes index.ts select the unsupported client without
// touching the ios/android file-system environment.
const storage: Storage = {
  exists: () => false,
  read: () => '',
  write: () => {},
  remove: () => {},
  move: () => {},
}

export function nativeEnvironment(): Environment {
  return {
    platform: 'windows',
    nativeFingerprint: 'unsupported',
    releaseBuild: false,
    storage,
    request: () => Promise.reject(new Error('unsupported: OTA updates on windows')),
  }
}
