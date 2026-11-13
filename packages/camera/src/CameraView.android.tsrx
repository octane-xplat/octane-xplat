/** @jsxImportSource @octane-xplat/jsx */
import { useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import { Application, View } from '@nativescript/core'
import { registerElement } from '@octane-xplat/nativescript-octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import type { CameraViewProps } from './props'
import { attachSessionPreview } from './session'
import { cameraHardwarePresent, ensureCameraPermission } from './camera-permission.mobile'
import {
  applyEscapeProps,
  layoutChildProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from './layout-child'

import { observePreviewPinch } from './preview-pinch'
import { observePreviewTap } from './preview-tap'
import { java } from '@octane-xplat/platform/android'

class CameraPreview extends View {
  createNativeView() {
    const nativeClass = (globalThis as any).com.octanexplat.camera.CameraPreviewView

    return new nativeClass(this._context)
  }
}

declare module '@octane-xplat/jsx/intrinsics' {
  interface NativeElements<TElement> {
    camerapreview: Attributes<TElement, {}>
  }
}

registerElement('camerapreview', CameraPreview)

/** Live Android preview backed by CameraX. */
export function CameraView(props: CameraViewProps): unknown @{
  const host = useRef<any>(null)
  const active = props.active !== false
  const facing = props.facing ?? 'back'

  useImperativeHandle(props.ref, () => ({ native: host.current.android }), [])

  const bindHost = useCallback((view: any) => {
    host.current = view
  }, [])

  useEffect(() => {
    const nativeView = host.current?.android

    if (!nativeView) {
      return
    }

    let disposed = false
    let provider: any
    let preview: any

    nativeView.setCameraActive(active)
    if (!active) {
      return () => nativeView.setCameraActive(false)
    }

    const fail = (message: string) => props.onError?.({ message })

    if (props.session) {
      if (props.facing !== undefined) {
        fail('camera session conflicts with facing')
        return () => nativeView.setCameraActive(false)
      }

      try {
        const detach = attachSessionPreview(props.session, nativeView, {
          onReady: props.onReady,
          onDisplayReady: props.onDisplayReady,
          onError: (issue) => fail(issue.message),
        })

        return () => {
          detach()
          nativeView.setCameraActive(false)
        }
      } catch (error: any) {
        fail(error?.message ?? 'camera session error')
        return () => nativeView.setCameraActive(false)
      }
    }

    if (!cameraHardwarePresent()) {
      fail('camera unsupported')
      return () => nativeView.setCameraActive(false)
    }

    ensureCameraPermission().then((granted) => {
      if (disposed) {
        return
      }

      if (!granted) {
        fail('camera permission denied')
        return
      }

      try {
        const context = Application.android.context
        const cameraX = (globalThis as any).androidx.camera
        const future = cameraX.lifecycle.ProcessCameraProvider.getInstance(context)
        const executor = (globalThis as any).androidx.core.content.ContextCompat.getMainExecutor(
          context,
        )

        future.addListener(
          new java.lang.Runnable({
            run() {
              if (disposed) {
                return
              }

              try {
                provider = future.get()

                const selectorClass = cameraX.core.CameraSelector
                const lens =
                  facing === 'front'
                    ? selectorClass.LENS_FACING_FRONT
                    : selectorClass.LENS_FACING_BACK

                const selector = new selectorClass.Builder().requireLensFacing(lens).build()

                preview = new cameraX.core.Preview.Builder().build()
                preview.setSurfaceProvider(nativeView.getSurfaceProvider())
                provider.bindToLifecycle(nativeView, selector, preview)
                props.onReady?.()

                // CameraX STREAMING is the displayed-frame edge; the
                // PreviewView is its own LifecycleOwner here. LiveData can
                // re-emit a value, so dedupe into displayed transitions.
                let displayed = false

                nativeView.getStreamState?.().observe(
                  nativeView,
                  new (globalThis as any).androidx.lifecycle.Observer({
                    onChanged(state: any) {
                      const streaming =
                        state ===
                        (globalThis as any).androidx.camera.view.PreviewView.StreamState.STREAMING

                      if (!disposed && streaming && !displayed) {
                        props.onDisplayReady?.()
                      }

                      displayed = streaming
                    },
                  }),
                )
              } catch (error: any) {
                fail(error?.message ?? 'camera error')
              }
            },
          }),
          executor,
        )
      } catch (error: any) {
        fail(error?.message ?? 'camera error')
      }
    })

    return () => {
      disposed = true
      nativeView.setCameraActive(false)
      if (provider && preview) {
        try {
          provider.unbind(preview)
        } catch {}
      }
    }
  }, [active, facing, props.session])

  useEffect(() => {
    const view = host.current

    if (!view) {
      return
    }

    applyEscapeProps(view.android, props)
  }, [props.ref, props.android])

  useEffect(() => observePreviewTap(host.current, props.onTap), [props.onTap])
  useEffect(() => observePreviewPinch(host.current, props.onPinch), [props.onPinch])

  <masonview
    id={props.id}
    className={['vx-layers', 'vx-cameraview', props.className]}
    {...layoutChildProps(props, {
      display: 'grid',
      gridTemplateRows: '1fr',
      gridTemplateColumns: '1fr',
      backgroundColor: '#000',
      ...props.style,
    })}
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
    accessibilityLiveRegion={props.accessibilityLiveRegion as any}
  >
    <camerapreview ref={bindHost} style={{ gridRow: '1', gridColumn: '1' }} />
  </masonview>
}
