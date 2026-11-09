/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
export const state = { count: 0, text: '', changes: 0 }
export const actions: { setCount: ((value: number) => void) | null } = { setCount: null }
export function Screen() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  actions.setCount = setCount
  state.count = count
  state.text = text
  return (
    <masonview id="layout">
      <label id="counter" text={`Count: ${count}`} />
      <button id="increment" text="Increment" onTap={() => setCount(count + 1)} />
      <textfield
        id="entry"
        text={text}
        onTextChange={(event: { value?: string }) => {
          state.changes++
          setText((event.value ?? '').toUpperCase())
        }}
      />
      <label id="echo" text={`Text: ${text}`} />
    </masonview>
  )
}
