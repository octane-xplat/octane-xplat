import type { TrackingBackend } from './backend-types'

// AppTrackingTransparency ships in @nativescript/types-ios but is outside its
// default ambient framework set — declare the two members this adapter uses.
// The framework is also outside the default link set, so the class is exposed
// by loading it through NSBundle before first use (photos-runtime precedent).
declare const ATTrackingManager:
  | {
      readonly trackingAuthorizationStatus: number
      requestTrackingAuthorizationWithCompletionHandler(completion: (status: number) => void): void
    }
  | undefined

// ATTrackingManagerAuthorizationStatus — the ambient const enum is not in the
// default type set and cannot be read under verbatimModuleSyntax.
const statusNotDetermined = 0
const statusAuthorized = 3
// UIApplicationStateActive from UIKit.
const applicationStateActive = 0
const zeroIdentifier = '00000000-0000-0000-0000-000000000000'

function loadFramework(path: string): boolean {
  try {
    return Boolean(NSBundle.bundleWithPath(path)?.load())
  } catch {
    return false
  }
}

function manager(): typeof ATTrackingManager {
  if (!loadFramework('/System/Library/Frameworks/AppTrackingTransparency.framework')) {
    return undefined
  }
  return typeof ATTrackingManager === 'undefined' ? undefined : ATTrackingManager
}

function identifiers(): typeof ASIdentifierManager | undefined {
  if (!loadFramework('/System/Library/Frameworks/AdSupport.framework')) {
    return undefined
  }
  return typeof ASIdentifierManager === 'undefined' ? undefined : ASIdentifierManager
}

let requesting = false

export const backend: TrackingBackend = {
  capabilities: () => ({
    prompt: Boolean(manager()),
    advertisingId: Boolean(identifiers()),
    advertisingIdAsync: Boolean(identifiers()),
  }),
  read: () => {
    const tracking = manager()
    return tracking ? Number(tracking.trackingAuthorizationStatus) : -1
  },
  request: () =>
    new Promise<number>((resolve, reject) => {
      if (!NSThread.isMainThread) {
        reject(new Error('Tracking requests require the main thread'))
        return
      }
      if (String(NSBundle.mainBundle.bundlePath).endsWith('.appex')) {
        reject(new Error('Tracking prompts are unavailable in app extensions'))
        return
      }
      const tracking = manager()
      if (!tracking) {
        resolve(-1)
        return
      }
      const purpose = NSBundle.mainBundle.objectForInfoDictionaryKey(
        'NSUserTrackingUsageDescription',
      )
      if (typeof purpose !== 'string' || !purpose.trim()) {
        reject(
          new Error(
            'Configure NSUserTrackingUsageDescription in Info.plist and rebuild before requesting tracking',
          ),
        )

        return
      }
      if (Number(UIApplication.sharedApplication.applicationState) !== applicationStateActive) {
        reject(new Error('Request tracking only from an active foreground app action'))
        return
      }
      const status = Number(tracking.trackingAuthorizationStatus)
      if (status !== statusNotDetermined) {
        resolve(status)
        return
      }
      if (requesting) {
        reject(new Error('A native tracking request is already pending'))
        return
      }
      requesting = true
      tracking.requestTrackingAuthorizationWithCompletionHandler((next) => {
        NSOperationQueue.mainQueue.addOperationWithBlock(() => {
          requesting = false
          resolve(Number(next))
        })
      })
    }),
  advertisingId: () => {
    const tracking = manager()
    const shared = identifiers()?.sharedManager()
    if (tracking) {
      if (Number(tracking.trackingAuthorizationStatus) !== statusAuthorized) {
        return null
      }
    } else if (!shared?.advertisingTrackingEnabled) {
      return null
    }
    const identifier = shared?.advertisingIdentifier.UUIDString
    return !identifier || identifier === zeroIdentifier ? null : identifier
  },
  async advertisingIdAsync() {
    return backend.advertisingId()
  },
}
