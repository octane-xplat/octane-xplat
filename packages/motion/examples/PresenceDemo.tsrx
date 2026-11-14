import { useState } from 'octane'
import { VStack, Text, Pressable } from '@octane-xplat/ui'
import { motion, Presence, MotionConfig } from '../src/index'

function CounterCard() @{
  const [count, setCount] = useState(0)

  <motion.View
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 12 }}
    transition={{ duration: 0.25 }}
  >
    <Pressable onPress={() => setCount(count + 1)}>
      <Text>{`Count: ${count}`}</Text>
    </Pressable>
  </motion.View>
}

/** Toggle twice during exit: the same counter survives; a completed exit resets it. */
export function PresenceDemo() @{
  const [present, setPresent] = useState(true)

  <MotionConfig reducedMotion="user">
    <VStack gap={3}>
      <Pressable onPress={() => setPresent(!present)}>
        <Text>Toggle card</Text>
      </Pressable>
      <Presence present={present}>
        <CounterCard />
      </Presence>
    </VStack>
  </MotionConfig>
}
