import { useSignal$ } from 'octane/signals/client'
import { View, Text, Pressable, useAnimation } from '@octane-xplat/ui'

/** Ref-driven animation: each button replaces playback from its current sample. */
export function AnimationDemo() @{
  // 1. Own the animation and a signal for its latest result.
  const x = useAnimation(0, 'translateX')
  const status$ = useSignal$('Ready')

  // 2. Start, replace, or stop playback from the controls below.
  <View>
    <Pressable
      onPress={async () => {
        const result = await x.to(80, { duration: 300 })

        status$.set(result.status)
      }}
    >
      <Text>Slide</Text>
    </Pressable>
    <Pressable onPress={() => x.spring(0, { damping: 14, stiffness: 120 })}>
      <Text>Return</Text>
    </Pressable>
    <Pressable onPress={() => x.stop()}>
      <Text>Stop</Text>
    </Pressable>
    <Text>{status$.get()}</Text>
    {/* 3. Attach the animation to the view that should move. */}
    <View ref={x.ref}>
      <Text>Moving card</Text>
    </View>
  </View>
}
