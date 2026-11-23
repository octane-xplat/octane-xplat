import { afterEach, describe, expect, it, vi } from 'vitest'

const stub = vi.hoisted(() => {
  const host = (position: 'front' | 'back') => {
    const connection: Record<string, unknown> = { supportsVideoMirroring: true }
    const layer: Record<string, any> = {
      connection,
      previewing: undefined,
      frame: undefined,
      videoGravity: undefined,
      removeFromSuperlayer() {},
    }

    const session = {
      inputs: [] as unknown[],
      canAddInput: () => true,
      addInput(input: unknown) {
        this.inputs.push(input)
      },
      startRunning() {},
      stopRunning() {},
    }

    const listeners = new Map<string, (...args: any[]) => void>()
    const view = {
      ios: { layer: { addSublayer: () => {} } },
      on(name: string, handler: (...args: any[]) => void) {
        listeners.set(name, handler)
      },
      off(name: string, _handler: (...args: any[]) => void) {
        listeners.delete(name)
      },
    }

    const device = { position: position === 'front' ? 2 : 1 } // AVCaptureDevicePosition

    vi.stubGlobal('AVCaptureDevice', {
      devicesWithMediaType: () => ({ count: 1, objectAtIndex: () => device }),
    })

    vi.stubGlobal('AVCaptureDeviceInput', { deviceInputWithDeviceError: (input: unknown) => input })
    vi.stubGlobal('AVCaptureSession', { new: () => session })
    vi.stubGlobal('AVCaptureVideoPreviewLayer', { layerWithSession: () => layer })
    vi.stubGlobal('AVMediaTypeVideo', 'vide')

    return { connection, view }
  }

  return { host }
})

import { startCameraPreview } from '../src/camera-session.ios'

afterEach(() => vi.unstubAllGlobals())

describe('startCameraPreview', () => {
  // iOS AVCaptureConnection binds `supportsVideoMirroring`/`videoMirrored`;
  // the legacy `isVideoMirroringSupported`/`isVideoMirrored` members are
  // macOS-only and absent from NativeScript's iOS metadata, so the stub
  // models only the names the iOS runtime actually resolves.
  it('mirrors the front camera connection', () => {
    const { connection, view } = stub.host('front')

    const detach = startCameraPreview(view, 'front')

    expect(connection.automaticallyAdjustsVideoMirroring).toBe(false)
    expect(connection.videoMirrored).toBe(true)
    detach()
  })

  it('leaves the back camera unmirrored', () => {
    const { connection, view } = stub.host('back')

    const detach = startCameraPreview(view, 'back')

    expect(connection.videoMirrored).toBe(false)
    detach()
  })
})
