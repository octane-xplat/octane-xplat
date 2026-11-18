import { Application } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import type { PermissionResult } from './types'

let scanRequestCode = 7723

export async function ensureCameraPermission(): Promise<PermissionResult> {
  try {
    const perm = 'android.permission.CAMERA'
    const activity = Application.android.foregroundActivity ?? Application.android.startActivity

    if (
      activity?.checkSelfPermission?.(perm) === android.content.pm.PackageManager.PERMISSION_GRANTED
    ) {
      return 'granted'
    }

    if (!activity) {
      return 'denied'
    }

    return await new Promise<PermissionResult>((resolve) => {
      const requestCode = scanRequestCode++
      const event = Application.android.activityRequestPermissionsEvent
      const onResult = (args: any) => {
        if (args.requestCode !== requestCode) {
          return
        }

        Application.android.off(event, onResult)
        resolve(
          args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED
            ? 'granted'
            : 'denied',
        )
      }

      Application.android.on(event, onResult)
      try {
        activity.requestPermissions([perm], requestCode)
      } catch {
        Application.android.off(event, onResult)
        resolve('denied')
      }
    })
  } catch {
    return 'denied'
  }
}
