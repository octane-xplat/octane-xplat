import { Utils } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { lookupGlobal } from '@octane-xplat/lib/capability'
import { aborted } from './backend-types'
import type { ConversionBackend } from './backend-types'
import type { ConvertedVideo } from './types'

interface NativeEngine {
  available(): boolean
  start(json: string, cache: string, callback: object): void
  cancel(id: string): void
  remove(uri: string): boolean
}

/** The bridge's progress/result event envelope. */
interface ConverterEvent {
  progress?: number
  result?: ConvertedVideo
  error?: string
  cancelled?: boolean
}

interface EngineClass {
  new (): NativeEngine
  Callback: new (methods: { onEvent(json: string): void }) => object
}

function engineClass(): EngineClass | undefined {
  return lookupGlobal(['com', 'octanexplat', 'converter', 'Converter']) as EngineClass | undefined
}

let instance: NativeEngine | undefined
let serial = 0
function engine(): NativeEngine | undefined {
  return (instance ??= engineClass() ? new (engineClass()!)() : undefined)
}

export const backend: ConversionBackend = {
  isAvailable: async (format) => format === 'mp4' && Boolean(engine()?.available()),
  async convert(source, request, control) {
    const value = engine(),
      Type = engineClass()

    if (!value || !Type) {
      throw new UnavailabilityError(
        'MediaConverter Android bridge; rebuild the app after installation',
      )
    }

    const id = `conversion-${Date.now()}-${++serial}`

    return new Promise<ConvertedVideo>((resolve, reject) => {
      const callback = new Type.Callback({
        onEvent(json) {
          try {
            const parsed: unknown = JSON.parse(json)
            const event = (
              typeof parsed === 'object' && parsed !== null ? parsed : {}
            ) as ConverterEvent

            if (event.error) {
              reject(event.cancelled ? aborted() : new Error(event.error))
            } else if (event.result) {
              resolve(event.result)
            } else if (typeof event.progress === 'number') {
              control.progress(event.progress)
            }
          } catch (error) {
            value.cancel(id)
            reject(error)
          }
        },
      })

      value.start(
        JSON.stringify({ ...request, source, id }),
        Utils.android.getApplicationContext().getCacheDir().getAbsolutePath(),
        callback,
      )

      control.onCancel(() => value.cancel(id))
    })
  },
  release(uri) {
    if (!engine()?.remove(uri)) {
      throw new Error('Could not remove the converted video')
    }
  },
}
