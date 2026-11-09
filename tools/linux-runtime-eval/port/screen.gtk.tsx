/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { View, Text, Button, TextInput, TextArea } from '@octane-xplat/ui'
export const portState = { count: 0, text: '', multiline: '', changes: 0 }
export function PortScreen() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [multiline, setMultiline] = useState('')
  portState.count = count
  portState.text = text
  portState.multiline = multiline
  return <View id="layout" style={{width:480, height:320}}>
    <Text id="counter">{`Count: ${count}`}</Text>
    <Button id="increment" clickAction={() => setCount(count + 1)}>Increment</Button>
    <TextInput id="entry" value={text} onChange={value => {portState.changes++;setText(value.toUpperCase())}} />
    <TextArea id="multiline" value={multiline} onChange={setMultiline} rows={2} style={{width:160, height:48}} />
    <Text id="echo">{`Text: ${text}`}</Text>
  </View>
}
