import type { PermissionResult } from './types'

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
