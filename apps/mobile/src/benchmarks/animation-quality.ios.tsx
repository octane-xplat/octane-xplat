/** @jsxImportSource @octane-xplat/jsx */
import { Application, Frame, Page } from '@nativescript/core'
import type { View as NativeView } from '@nativescript/core'
import { install } from '@nativescript-community/gesturehandler'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { useEffect, useRef, useState } from 'octane'
import { View, Pressable, Text, ScrollableArea } from '@octane-xplat/ui'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'
import { motion, MotionConfig } from '../../../../packages/motion/src/index'
import { clock } from '../../../../packages/motion/src/clock'
import { delegationStats } from '../../../../packages/motion/src/delegation'
import '@octane-xplat/ui/theme/tokens.css'

interface TraceBridge {
  begin(): void
  end(): void
  beginFrame(): void
  endFrame(): void
}
declare const AnimationQualityTrace: TraceBridge

// Diagnostic callback costs include JS, synchronous bridge calls and synchronous
// layout. These are NOT display hitch measurements. Sampling is bounded and no
// output is written during a measured interval.
const request = clock.request
const costs: number[] = []
let detailed = false
let running = false
clock.request = (callback) =>
  request(() => {
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
  const card = useRef<NativeView | null>(null)
  const sampleRef = useRef<number[]>([])
  const samples = sampleRef.current
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
  const finish = () => {
    clearTimers()
    AnimationQualityTrace.end()
    running = false
    setStatus('done')
    console.log(
      'ANIMATION_QUALITY ' +
        JSON.stringify({
          scenario,
          diagnostic: detailed,
          callbackMs: costs,
          interruptionSamples: samples,
          delegations: delegationStats(),
        }),
    )
  }
  const select = (name: string) => {
    if (running) {
      finish()
    }
    setScenario(name)
    setTarget(false)
    setMounted(true)
    setSheet(false)
    setStatus('ready')
  }
  return (
    <MotionConfig reducedMotion="user">
      <View style={{ padding: 20, gap: 8 }}>
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
          onPress={() => {
            costs.length = 0
            samples.length = 0
            running = true
            AnimationQualityTrace.begin()
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
          }}
        >
          <Text>Dispose</Text>
        </Pressable>
        <Pressable testID="finish" onPress={finish}>
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
        <ScrollableArea testID="scroller" style={{ height: 220 }}>
          <View style={{ height: scenario === 'scroll' ? 1600 : 210 }}>
            {mounted && (
              <motion.View
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
                onDragEnd={() => setStatus('drag-ended')}
                dragConstraints={{ left: 0, right: 180 }}
                layout={scenario === 'layout'}
                animate={{ x: target && scenario !== 'layout' && scenario !== 'drag' ? 160 : 0 }}
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
        </ScrollableArea>
        <SwiftUIBottomSheet
          open={sheet}
          detents={['medium', 'large']}
          onDismissed={() => {
            AnimationQualityTrace.end()
            setSheet(false)
          }}
          content={() => (
            <Pressable testID="close-sheet" onPress={() => setSheet(false)}>
              <Text>Close sheet</Text>
            </Pressable>
          )}
        />
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
