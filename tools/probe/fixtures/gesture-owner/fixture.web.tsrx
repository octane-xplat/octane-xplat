/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot, useRef, useState } from 'octane'
import { View, Stack, Pressable, usePanGesture$, useInteractionScope$ } from '@octane-xplat/ui'
import { motion, MotionConfig } from '@octane-xplat/motion'
import type { Suspension } from '@octane-xplat/ui'

const initial = {
  clicks: 0,
  starts: 0,
  ends: 0,
  cancels: 0,
  x: 0,
  scopePresses: 0,
  leases: 0,
  scopeFailure: '',
  scrollY: 0,
  revealStarts: 0,
  motionPresses: 0,
  motionStarts: 0,
  rawPresses: 0,
  nativeClicks: 0,
  scaledStarts: 0,
}

function Fixture() {
  const [state, setState] = useState(initial)
  const current = useRef(initial)
  const update = (patch: Partial<typeof initial>) => {
    current.current = { ...current.current, ...patch }
    setState(current.current)
  }

  const drag = usePanGesture$({
    axis: 'x',
    onStart: () => update({ starts: current.current.starts + 1 }),
    onUpdate: (event) => update({ x: event.translation.x }),
    onEnd: () => update({ ends: current.current.ends + 1 }),
    onCancel: () => update({ cancels: current.current.cancels + 1 }),
  })

  const scope = useInteractionScope$()
  const leases = useRef<Suspension[]>([])
  const reveal = usePanGesture$({
    axis: 'x',
    onStart: () => update({ revealStarts: current.current.revealStarts + 1 }),
  })

  return (
    <>
      <View id="panel" gestures={drag} style={{ transform: `translateX(${state.x}px)` }}>
        <Pressable id="action" onPress={() => update({ clicks: current.current.clicks + 1 })}>
          Nested action
        </Pressable>
      </View>
      <output id="state">{JSON.stringify(state)}</output>
      <View id="frozen-content" interactionScope={scope}>
        <Pressable
          id="frozen-action"
          onPress={() => update({ scopePresses: current.current.scopePresses + 1 })}
        >
          Scoped action
        </Pressable>
      </View>
      <Pressable
        id="freeze"
        onPress={() => {
          const result = scope.suspend()

          if (result.ok) {
            leases.current.push(result.lease)
          }

          update({ leases: leases.current.length, scopeFailure: result.ok ? '' : result.reason })
        }}
      >
        Suspend content
      </Pressable>
      <Pressable
        id="release"
        onPress={() => {
          leases.current.pop()?.release()
          update({ leases: leases.current.length })
        }}
      >
        Release one lease
      </Pressable>
      <View id="scroll-parent" gestures={reveal}>
        <Stack
          id="scroll-viewport"
          isScrollable={true}
          direction="vertical"
          web={{
            onscroll: (event: Event) =>
              update({ scrollY: (event.target as HTMLElement).scrollTop }),
          }}
        >
          <div id="scroll-content">Managed vertical scrolling</div>
        </Stack>
      </View>
      <Pressable
        id="raw-controls"
        onPress={() => update({ rawPresses: current.current.rawPresses + 1 })}
      >
        <input id="native-checkbox" type="checkbox" />
        <button
          id="native-button"
          onClick={() => update({ nativeClicks: current.current.nativeClicks + 1 })}
        >
          Native action
        </button>
      </Pressable>
      <MotionConfig reducedMotion="always">
        <motion.Pressable
          id="motion-panel"
          drag="x"
          whileTap={{ scale: 0.98 }}
          dragMomentum={false}
          onDragStart={() => update({ motionStarts: current.current.motionStarts + 1 })}
        >
          <Pressable
            id="motion-action"
            onPress={() => update({ motionPresses: current.current.motionPresses + 1 })}
          >
            Motion nested action
          </Pressable>
        </motion.Pressable>
      </MotionConfig>
      <View
        style={{ transform: 'scale(1.25)', transformOrigin: 'top left', width: 320, height: 150 }}
      >
        <MotionConfig reducedMotion="always">
          <motion.View
            id="scaled-panel"
            drag="x"
            dragMomentum={false}
            style={{ scale: 1.5, width: 200, height: 80 }}
            onDragStart={() => update({ scaledStarts: current.current.scaledStarts + 1 })}
          >
            <span>Scaled drag</span>
          </motion.View>
        </MotionConfig>
      </View>
    </>
  )
}

const root = createRoot(document.querySelector('#app')!)

root.render(<Fixture />)
window.addEventListener('pagehide', () => root.unmount(), { once: true })
