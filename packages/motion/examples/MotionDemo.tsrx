import { useRef, useState } from 'octane'
import { Text, View, Pressable, type PanNotification } from '@octane-xplat/ui'
import { motion, MotionConfig, useMotionValue, useTransform, useReducedMotion } from '../src/index'

/** Mount in a screen to exercise destination changes and pan-to-spring settling. */
export function MotionDemo() @{
  const [expanded, setExpanded] = useState(false)
  const x = useMotionValue(0)
  const scale = useTransform(x, [-120, 0, 120], [0.9, 1, 0.9])
  const origin = useRef(0)
  const reduced = useReducedMotion()
  const pan = (event: PanNotification) => {
    if (event.phase === 'start') {
      x.stop()
      origin.current = x.get()
    }

    if (event.phase !== 'finish') {
      x.set(Math.max(-120, Math.min(120, origin.current + event.sample.translation.x)))
    }

    if (event.phase === 'finish') {
      x.animate(
        0,
        reduced
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: 180,
              damping: 20,
              velocity:
                event.terminal.outcome === 'ended' ? (event.terminal.sample.velocity?.x ?? 0) : 0,
            },
      )
    }
  }

  <MotionConfig reducedMotion="user">
    <View gap={16}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Text>Toggle motion</Text>
      </Pressable>
      <motion.View
        initial={{ opacity: 0 }}
        whileFocus={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          opacity: 1,
          x: expanded ? 80 : 0,
          scale: expanded ? 1.2 : 1,
          scaleX: expanded ? 1.1 : 1,
        }}
        transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
      >
        <Text>Animated destination</Text>
      </motion.View>
      <motion.Row onPan={pan} style={{ x, scale }}>
        <Text>Drag, then release</Text>
      </motion.Row>
    </View>
  </MotionConfig>
}
