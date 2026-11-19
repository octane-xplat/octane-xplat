import type { PermissionStatus } from '@octane-xplat/platform'
import type { PermissionResult } from './types'

// Non-prompting authorization read for the dispatcher's getPermissions.
export function cameraPermissionStatus(): PermissionStatus {
  const av = (globalThis as any).AVCaptureDevice

  if (typeof av?.authorizationStatusForMediaType !== 'function') {
    return 'unsupported'
  }

  // AVCaptureDevice authorization: 0=notDetermined 1=restricted 2=denied 3=authorized
  const status = av.authorizationStatusForMediaType((globalThis as any).AVMediaTypeVideo)

  return status === 3 ? 'granted' : status === 0 ? 'undetermined' : 'denied'
}

export async function ensureCameraPermission(): Promise<PermissionResult> {
  try {
    const av = (globalThis as any).AVCaptureDevice
    const video = (globalThis as any).AVMediaTypeVideo
    // 0=notDetermined 1=restricted 2=denied 3=authorized
    const status = av?.authorizationStatusForMediaType?.(video)

    if (status === 3) {
      return 'granted'
    }

    if (status === 1 || status === 2) {
      return 'denied'
    }

    if (typeof av?.requestAccessForMediaTypeCompletionHandler !== 'function') {
      return 'unsupported'
    }

    return await new Promise<PermissionResult>((resolve) => {
      av.requestAccessForMediaTypeCompletionHandler(video, (granted: boolean) =>
        resolve(granted ? 'granted' : 'denied'),
      )
    })
  } catch {
    return 'denied'
  }
}
