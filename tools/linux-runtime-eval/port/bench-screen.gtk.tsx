/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { View, Text } from '@octane-xplat/ui'
export const ROWS = 200
export const benchControl: { setTick: (tick: number) => void; setFocus: (tick: number) => void } = {
  setTick: () => {},
  setFocus: () => {},
}
export function BenchScreen() {
  const [tick, setTick] = useState(0)
  const [focus, setFocus] = useState(0)
  benchControl.setTick = setTick
  benchControl.setFocus = setFocus
  return <View id="bench" style={{ width: 480, height: 320, flexDirection: 'column' }}>
    <Text id="focus">{`Focus ${focus}`}</Text>
    {Array.from({ length: ROWS }, (_, i) => <Text key={i} id={`row-${i}`}>{`Row ${i}: ${tick}`}</Text>)}
  </View>
}
