import { useState } from 'octane'
import { useTweak } from '@octane-xplat/tweaks'
import { View, Text, Pressable } from '@octane-xplat/ui'
import styles from './App.style'

// A default that isn't a literal: the panel shows it read-only.
const DEFAULT_MESSAGE = 'hello tweaks'

// Mounted only while expanded — proves unmounted entries leave the panel state.
function Details() @{
  const detailText = useTweak('expandable detail', {
    name: 'detailText',
    group: 'details',
  })

  const chip = { fontWeight: 'bold' }

  return (
    <View>
      <Text testID="card.detail" style={{ paddingTop: 4 }}>
        {detailText}
      </Text>
      {/* Read-only site: the spread makes the object uninstrumentable. */}
      <Text testID="card.chip" style={{ ...chip, fontSize: 12 }}>
        chip
      </Text>
    </View>
  )
}

export function App() @{
  const radius = useTweak(8, { input: { type: 'number', min: 0, max: 40, step: 1 } })
  const padding = useTweak(16, { input: { type: 'number', min: 0, max: 64 } })
  const accent = useTweak('#4477ff', { input: { type: 'color' } })
  const showBorder = useTweak(true, { input: { type: 'boolean' } })
  const density = useTweak('cozy', {
    input: { type: 'select', options: ['compact', 'cozy', 'roomy'] },
  })

  const title = useTweak('Tweak me', { name: 'title', group: 'card' })
  const message = useTweak(DEFAULT_MESSAGE, { name: 'message' })

  const [count, setCount] = useState(0)
  const [details, setDetails] = useState(true)
  const [flag, setFlag] = useState(true)

  return (
    <View className={styles.screen}>
      <View
        testID="card.box"
        className={styles.card}
        style={{
          borderRadius: radius,
          padding,
          borderColor: accent,
          borderWidth: showBorder ? 2 : 0,
          gap: density === 'compact' ? 4 : density === 'roomy' ? 16 : 8,
        }}
      >
        <Text testID="card.title" style={{ color: accent, fontSize: 24 }}>
          {title}
        </Text>
        <Text testID="card.message">{message}</Text>
        <Pressable testID="details.toggle" onPress={() => setDetails(!details)}>
          <Text>{details ? 'hide' : 'show'} details</Text>
        </Pressable>
        {details ? <Details /> : null}
        <Pressable testID="flag.toggle" onPress={() => setFlag(!flag)}>
          <Text>{flag ? 'hide' : 'show'} flag</Text>
        </Pressable>
        {/* Same-component conditional: exercises per-render mount/unmount of a style site. */}
        {flag ? (
          <Text testID="card.flag" style={{ marginTop: 4 }}>
            flag
          </Text>
        ) : null}
      </View>
      <View className={styles.row}>
        <Pressable
          testID="counter.increment"
          className={styles.button}
          onPress={() => setCount(count + 1)}
        >
          <Text>+</Text>
        </Pressable>
        <Text testID="counter.value">{count}</Text>
      </View>
    </View>
  )
}
