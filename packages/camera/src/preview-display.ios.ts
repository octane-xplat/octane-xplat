import { NSObject, interop } from '@octane-xplat/platform/ios'

/** `previewing` (iOS 13+) is documented KVO-observable: it flips true when
 *  the layer actually renders frames, asynchronously after
 *  `startRunning()` returns. Non-empty bounds are the second half of
 *  "visible" — a zero-size layer can report previewing without showing
 *  anything. */
let DisplayObserverClass: any
const displayObserverClass = () => {
  // Register through the Objective-C bridge lazily; the probe/test
  // runtime does not provide the extend hook.
  DisplayObserverClass ??= (NSObject as any).extend(
    {
      'observeValueForKeyPath:ofObject:change:context:'() {
        ;(this as any).callback?.()
      },
    },
    {
      name: 'XplatCameraPreviewDisplayObserver',
      exposedMethods: {
        'observeValueForKeyPath:ofObject:change:context:': {
          returns: interop.types.void,
          params: [interop.types.id, interop.types.id, interop.types.id, interop.types.id],
        },
      },
    },
  )

  return DisplayObserverClass
}

/** Whether the preview layer is displaying a live frame right now. */
export function previewLayerDisplaying(layer: any): boolean {
  return (
    layer?.previewing === true &&
    (layer.bounds?.size?.width ?? 0) > 0 &&
    (layer.bounds?.size?.height ?? 0) > 0
  )
}

/** Observe display readiness on an AVCaptureVideoPreviewLayer. `change`
 *  runs on every readiness transition in either direction — callers own
 *  edge detection. Returns the detach, or `undefined` when the runtime
 *  predates the iOS 13 `previewing` property and no display signal
 *  exists. */
export function observePreviewDisplay(layer: any, change: () => void): (() => void) | undefined {
  if (
    typeof layer?.addObserverForKeyPathOptionsContext !== 'function' ||
    typeof layer.previewing !== 'boolean'
  ) {
    return undefined
  }

  const observer = displayObserverClass().new()

  observer.callback = change
  // New = 1; `bounds` is observed so a layer laid out after previewing
  // started still produces a transition worth re-evaluating.
  for (const key of ['previewing', 'bounds']) {
    layer.addObserverForKeyPathOptionsContext(observer, key, 1, null as any)
  }

  return () => {
    observer.callback = undefined
    for (const key of ['previewing', 'bounds']) {
      layer.removeObserverForKeyPath(observer, key)
    }
  }
}
