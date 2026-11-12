/** @jsxImportSource @octane-xplat/jsx */
import {
  Application,
  File,
  Frame,
  GestureTypes,
  Page,
  knownFolders,
  path,
} from '@nativescript/core'

import { View as NativeView } from '@nativescript/core'
import { install } from '@nativescript-community/gesturehandler'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { useEffect, useMemo, useRef, useState } from 'octane'
import { View, Pressable, Text, ScrollableArea } from '@octane-xplat/ui'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'
import { motion, MotionConfig } from '../../../../packages/motion/src/index'
import { clock } from '../../../../packages/motion/src/clock'
import { delegationStats } from '../../../../packages/motion/src/delegation'
import '@octane-xplat/ui/theme/tokens.css'
import './animation-quality.css'

interface TraceBridge {
  beginScenario(scenario: string): void
  environment(): NSDictionary<string, number | boolean>
  end(): void
  beginFrame(): void
  endFrame(): void
}

declare const AnimationQualityTrace: TraceBridge
declare const NativeScriptViewFactory: {
  readonly shared: { readonly views: NSDictionary<string, UIView> } | null
}

function sheetFactoryEntries(): number {
  const keys = NativeScriptViewFactory.shared?.views.allKeys
  let count = 0

  for (let index = 0; keys && index < keys.count; index++) {
    if (String(keys.objectAtIndex(index)).startsWith('xplatsheet')) {
      count++
    }
  }

  return count
}

declare const __XPLAT_ANIMATION_INPUT_DEBUG__: boolean
const inputDebug = __XPLAT_ANIMATION_INPUT_DEBUG__
const inputEvents: { event: string; data: unknown }[] = []
const results: object[] = []
let resultWrites: Promise<void> = Promise.resolve()
const inputLog = (event: string, data: unknown) => {
  if (inputDebug && inputEvents.length < 100) {
    const serialized = JSON.stringify(data)

    inputEvents.push({ event, data: serialized === undefined ? null : JSON.parse(serialized) })
    File.fromPath(
      path.join(knownFolders.documents().path, 'animation-input-diagnostic.json'),
    ).writeTextSync(JSON.stringify(inputEvents))
  }
}

function sheetInputState(host: NativeView | undefined) {
  return {
    loaded: host?.isLoaded ?? null,
    attached: Boolean(host?.ios?.window),
    native: String(host?.ios ?? null),
    recognizers: String(host?.ios?.gestureRecognizers ?? null),
    tapObservers: host?.getGestureObservers(GestureTypes.tap)?.length ?? 0,
    touchObservers: host?.getGestureObservers(GestureTypes.touch)?.length ?? 0,
  }
}

inputLog('loaded', { diagnostic: inputDebug })
if (inputDebug) {
  const error = (event: object) => {
    if ('error' in event) {
      const value = event.error

      inputLog('error', value instanceof Error ? value.stack : String(value))
    }
  }

  Application.on('uncaughtError', error)
  Application.on('discardedError', error)
}

// Diagnostic callback costs include JS, synchronous bridge calls and synchronous
// layout. These are NOT display hitch measurements. Sampling is bounded and no
// output is written during a measured interval.
const request = clock.request
const costs: number[] = []
let detailed = false
let running = false
let deliveries = 0

clock.request = (callback) =>
  request(() => {
    deliveries++
    if (!running || !detailed) {
      callback()
      return
    }

    const start = clock.now()

    AnimationQualityTrace.beginFrame()
    try {
      callback()
    } finally {
      AnimationQualityTrace.endFrame()
      if (costs.length < 10000) {
        costs.push(clock.now() - start)
      }
    }
  })

function Benchmark() {
  const [scenario, setScenario] = useState('tween')
  const [target, setTarget] = useState(false)
  const [mounted, setMounted] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [status, setStatus] = useState('ready')
  const [iteration, setIteration] = useState(0)

  useEffect(() => {
    inputLog('state', { scenario, status, sheet })
  }, [scenario, status, sheet])

  const Region = scenario === 'scroll' ? ScrollableArea : View
  const card = useRef<NativeView | null>(null)
  const sampleRef = useRef<number[]>([])
  const samples = sampleRef.current
  const idleObservation = useRef<{ before: number; after: number; elapsedMs: number } | null>(null)
  const controls = useRef<Record<string, NativeView>>({})
  const releaseSheetInput = useRef<(() => void) | null>(null)
  const saveStart = useMemo(
    () => (value: object | null) => {
      if (value instanceof NativeView) {
        controls.current.start = value
      }
    },
    [],
  )

  const saveSheetClose = useMemo(
    () => (value: object | null) => {
      releaseSheetInput.current?.()
      releaseSheetInput.current = null
      if (value instanceof NativeView) {
        controls.current.sheetClose = value

        let alive = true
        const record = (event: string) => {
          inputLog(event, sheetInputState(value))
          queueMicrotask(() => {
            if (alive) {
              inputLog(event + '-settled', sheetInputState(value))
            }
          })
        }

        const loaded = () => record('sheet-close-loaded')
        const unloaded = () => record('sheet-close-unloaded')

        value.on('loaded', loaded)
        value.on('unloaded', unloaded)
        inputLog('sheet-close-ref', sheetInputState(value))
        releaseSheetInput.current = () => {
          alive = false
          value.off('loaded', loaded)
          value.off('unloaded', unloaded)
        }
      } else {
        inputLog('sheet-close-ref-cleared', {})
        delete controls.current.sheetClose
      }
    },
    [],
  )

  useEffect(() => {
    if (!inputDebug || !sheet) {
      return
    }

    const timer = setTimeout(() => {
      const host = controls.current.sheetClose

      inputLog('sheet-native-state', sheetInputState(host))
    }, 700)

    return () => clearTimeout(timer)
  }, [sheet])

  const inspectStart = () => {
    const view = controls.current.start?.ios

    if (!view?.window) {
      return
    }

    const point = view.convertPointToView(
      { x: view.bounds.size.width / 2, y: view.bounds.size.height / 2 },
      view.window,
    )

    let hit = view.window.hitTestWithEvent(point, null)
    const ancestry: string[] = []

    while (hit) {
      ancestry.push(String(hit.class()) + ':' + String(hit.accessibilityIdentifier ?? ''))
      hit = hit.superview
    }

    inputLog('start-hit-test', {
      scenario,
      status,
      ancestry,
      recognizers: String(view.gestureRecognizers),
      enabled: view.userInteractionEnabled,
    })
  }

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => {
    for (const timer of timers.current) {
      clearTimeout(timer)
    }

    timers.current = []
  }

  useEffect(
    () => () => {
      clearTimers()
      releaseSheetInput.current?.()
      releaseSheetInput.current = null
      AnimationQualityTrace.end()
      running = false
    },
    [],
  )

  const sample = () => {
    // Presentation-layer translation, never a screenshot or model destination.
    const layer = card.current?.ios?.layer.presentationLayer()

    return layer ? Number(layer.transform.m41) : null
  }

  const finish = (updateStatus = true) => {
    clearTimers()
    AnimationQualityTrace.end()
    running = false
    if (updateStatus) {
      setStatus('saving')
    }

    const environment = AnimationQualityTrace.environment()
    const result = {
      scenario,
      environment: {
        maximumFramesPerSecond: environment.objectForKey('maximumFramesPerSecond'),
        lowPowerMode: environment.objectForKey('lowPowerMode'),
        thermalState: environment.objectForKey('thermalState'),
        reduceMotion: environment.objectForKey('reduceMotion'),
      },
      diagnostic: detailed || inputDebug,
      callbackMs: [...costs],
      interruptionSamples: [...samples],
      delegations: { ...delegationStats() },
      sheetFactoryEntries: sheetFactoryEntries(),
      callbackDeliveries: deliveries,
      idleObservation: idleObservation.current,
    }

    if (results.length < 100) {
      results.push(result)

      // Use NativeScript's async iOS write so a Finish tap does not block the UI thread.
      const write = resultWrites
        .catch(() => undefined)
        .then(() =>
          File.fromPath(
            path.join(knownFolders.documents().path, 'animation-quality-results.json'),
          ).writeText(JSON.stringify(results)),
        )

      resultWrites = write.then(() => undefined)
      void write.then(
        () => {
          if (updateStatus) {
            setStatus('done')
          }
        },
        (error: unknown) => {
          console.error('ANIMATION_QUALITY_WRITE_FAILED ' + String(error))
          if (updateStatus) {
            setStatus('error')
          }
        },
      )
    } else if (updateStatus) {
      setStatus('done')
    }

    console.log('ANIMATION_QUALITY ' + JSON.stringify(result))
  }

  const select = (name: string) => {
    inputLog('select', { name, scenario, status })
    if (inputDebug) {
      setTimeout(inspectStart, 100)
    }

    if (running) {
      finish(false)
    }

    idleObservation.current = null
    setIteration((value) => value + 1)
    setScenario(name)
    setTarget(false)
    setMounted(true)
    setSheet(false)
    setStatus('ready')
  }

  return (
    <MotionConfig reducedMotion="user">
      <View className="animation-quality-root">
        <Text testID="status">{status}</Text>
        {['tween', 'spring', 'drag', 'retarget', 'layout', 'shared', 'sheet', 'scroll'].map(
          (name) => (
            <Pressable testID={'select-' + name} onPress={() => select(name)}>
              <Text>{name}</Text>
            </Pressable>
          ),
        )}
        <Pressable
          testID="start"
          ref={inputDebug ? saveStart : undefined}
          onPressIn={inputDebug ? () => inputLog('start-down', { scenario, status }) : undefined}
          onPressOut={inputDebug ? () => inputLog('start-up', { scenario, status }) : undefined}
          onPress={() => {
            inputLog('start-enter', { scenario, status, sheet })
            costs.length = 0
            samples.length = 0
            running = true
            AnimationQualityTrace.beginScenario(scenario)
            inputLog('start-signpost-open', { scenario, status })
            setStatus('running')
            setTarget(true)
            if (scenario === 'sheet') {
              setSheet(true)
            }

            if (scenario === 'retarget') {
              for (let index = 1; index <= 6; index++) {
                timers.current.push(
                  setTimeout(() => {
                    const position = sample()

                    if (position !== null) {
                      samples.push(position)
                    }

                    setTarget((value) => !value)
                  }, index * 80),
                )
              }
            }
          }}
        >
          <Text>Start</Text>
        </Pressable>
        <Pressable
          testID="reverse"
          onPress={() => {
            const before = sample()

            setTarget(!target)

            const after = sample()

            if (before !== null && after !== null) {
              samples.push(after - before)
            }
          }}
        >
          <Text>Reverse</Text>
        </Pressable>
        <Pressable
          testID="dispose"
          onPress={() => {
            clearTimers()
            setMounted(false)
            setStatus('waiting-for-idle')
            // Permit the final cancelled/empty frame to drain before observing.
            timers.current.push(
              setTimeout(() => {
                const before = deliveries
                const start = clock.now()

                timers.current.push(
                  setTimeout(() => {
                    idleObservation.current = {
                      before,
                      after: deliveries,
                      elapsedMs: clock.now() - start,
                    }

                    setStatus(deliveries === before ? 'idle' : 'callbacks-during-idle')
                  }, 10000),
                )
              }, 250),
            )
          }}
        >
          <Text>Dispose</Text>
        </Pressable>
        <Pressable testID="finish" onPress={() => finish()}>
          <Text>Finish</Text>
        </Pressable>
        <Pressable
          testID="diagnostic"
          onPress={() => {
            detailed = !detailed
          }}
        >
          <Text>Toggle diagnostic spans</Text>
        </Pressable>
        {scenario === 'scroll' && (
          <motion.View
            animate={{ x: target ? 160 : 0 }}
            transition={{
              type: 'spring',
              stiffness: 90,
              damping: 9,
              repeat: 10,
              repeatType: 'reverse',
            }}
            style={{ width: 70, height: 30, backgroundColor: '#276EF1' }}
          />
        )}
        <Region testID="scroller" className="animation-quality-region">
          <View
            className="animation-quality-content"
            style={{ height: scenario === 'scroll' ? 1600 : 210 }}
          >
            {mounted && (
              <motion.View
                key={iteration}
                onAnimationComplete={() => {
                  if (running && ['tween', 'spring', 'retarget'].includes(scenario)) {
                    AnimationQualityTrace.end()
                  }
                }}
                onLayoutAnimationComplete={() => {
                  if (running && scenario === 'layout') {
                    AnimationQualityTrace.end()
                  }
                }}
                testID="card"
                ref={(value: NativeView | null) => {
                  card.current = value
                }}
                drag={scenario === 'drag' ? 'x' : false}
                onDragEnd={(_event, info) => {
                  inputLog('drag-end', info)
                  setStatus(info.cancelled ? 'drag-cancelled' : 'drag-ended')
                }}
                dragConstraints={{ left: 0, right: 180 }}
                layout={scenario === 'layout'}
                animate={
                  scenario === 'drag' ? undefined : { x: target && scenario !== 'layout' ? 160 : 0 }
                }
                transition={
                  scenario === 'spring' || scenario === 'scroll'
                    ? {
                        type: 'spring',
                        stiffness: 90,
                        damping: 9,
                        repeat: scenario === 'scroll' ? 10 : 0,
                        repeatType: 'reverse',
                      }
                    : { duration: 0.8, ease: 'easeInOut' }
                }
                style={{
                  width: scenario === 'layout' && target ? 220 : 70,
                  height: 70,
                  backgroundColor: '#276EF1',
                }}
              />
            )}
            {scenario === 'shared' &&
              (target ? (
                <motion.View
                  layoutId="quality-shared"
                  onLayoutAnimationComplete={() => {
                    if (running) {
                      AnimationQualityTrace.end()
                    }
                  }}
                  style={{ marginLeft: 170, width: 100, height: 80, backgroundColor: '#EF7627' }}
                />
              ) : (
                <motion.View
                  layoutId="quality-shared"
                  onLayoutAnimationComplete={() => {
                    if (running) {
                      AnimationQualityTrace.end()
                    }
                  }}
                  style={{ width: 60, height: 40, backgroundColor: '#EF7627' }}
                />
              ))}
          </View>
        </Region>
        {scenario === 'sheet' && (
          <SwiftUIBottomSheet
            open={sheet}
            detents={['medium', 'large']}
            onPresentedChange={(presented) => inputLog('sheet-presented', { presented })}
            onDismissed={() => {
              inputLog('sheet-dismissed', { sheet, status })
              AnimationQualityTrace.end()
              setSheet(false)
            }}
            content={() => (
              <Pressable
                testID="close-sheet"
                ref={inputDebug ? saveSheetClose : undefined}
                onPressIn={inputDebug ? () => inputLog('sheet-close-down', {}) : undefined}
                onPressOut={inputDebug ? () => inputLog('sheet-close-up', {}) : undefined}
                onPress={() => {
                  inputLog('sheet-close', { sheet, status })
                  setSheet(false)
                }}
              >
                <Text>Close sheet</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </MotionConfig>
  )
}

install()
Application.run({
  create: () => {
    const page = new Page()

    page.actionBarHidden = true
    renderNativeScriptApp(page, Benchmark)

    const frame = new Frame()

    frame.navigate({ create: () => page })
    return frame
  },
})
