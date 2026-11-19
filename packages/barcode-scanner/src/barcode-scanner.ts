// Barcode scanner — native service leaf. Live scanning is the <BarcodeScanner>
// component (mlkit-core's MLKitView); this file owns the camera permission
// ensure (platform primitives, media's pattern) and headless still decode.
import { ImageSource } from '@nativescript/core'
import { DetectionType, detectWithStillImage } from '@nativescript/mlkit-core'
import type { BarcodeFormat, BarcodeScannerService, ScannedCode } from './types'
import { cameraPermissionStatus, ensureCameraPermission } from './barcode-permission'
import type { PermissionStatus } from '@octane-xplat/platform'
import { fromNativeFormat, toNativeFormats } from './format-map'

async function toImageSource(image: unknown): Promise<any> {
  if (image instanceof ImageSource) {
    return image
  }

  if (typeof image === 'string') {
    return ImageSource.fromFile(image)
  }

  if (
    typeof image === 'object' &&
    image !== null &&
    'uri' in image &&
    typeof image.uri === 'string'
  ) {
    return ImageSource.fromFile(image.uri)
  }

  throw new Error('barcodeScanner.scanImage: expected an ImageSource, file path, or {uri} ref')
}

/** Headless barcode service — permission + still-image decode. See BarcodeScannerService. */
export const barcodeScanner: BarcodeScannerService = {
  supported: true,

  ensure: ensureCameraPermission,

  async scanImage(image: unknown, formats?: BarcodeFormat[]): Promise<ScannedCode[]> {
    const source = await toImageSource(image)
    const result = await detectWithStillImage(source, {
      detectorType: DetectionType.Barcode,
      barcodeScanning: { barcodeFormat: toNativeFormats(formats) as [any] },
    })

    const list = Array.isArray(result) ? result : Object.values(result ?? {})

    return list
      .flat()
      .filter((item: any) => item && (item.rawValue !== undefined || item.format !== undefined))
      .map((item: any) => ({
        type: fromNativeFormat(item.format),
        data: String(item.rawValue ?? item.displayValue ?? ''),
        bounds: item.bounds
          ? {
              x: item.bounds.origin?.x ?? item.bounds.x ?? 0,
              y: item.bounds.origin?.y ?? item.bounds.y ?? 0,
              width: item.bounds.size?.width ?? item.bounds.width ?? 0,
              height: item.bounds.size?.height ?? item.bounds.height ?? 0,
            }
          : undefined,
      }))
  },
}

// Scanning needs camera access — register the kind this leaf owns for the
// platform dispatcher (same 'camera' kind media registers; both leafs' owners
// run identical ensure logic, and the leaf must work with media absent).
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

const toResponse = (status: PermissionStatus) => ({
  status,
  granted: status === 'granted',
  canAskAgain: status === 'granted' || status === 'undetermined',
})

permissionOwners.camera = {
  getPermissions: async () => toResponse(cameraPermissionStatus()),
  requestPermissions: async () => toResponse(await barcodeScanner.ensure()),
}
