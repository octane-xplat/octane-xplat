/** @jsxImportSource @octane-xplat/jsx/dom */
import { useSignal$ } from 'octane/signals/client'
import { useKeyboard } from '@octane-xplat/ui'

export function KeyboardDemo() @{
  // 1. Keep the latest key in a signal and ignore keys while text is composing.
  const key$ = useSignal$('Press a key')
  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      if (!event.isComposing) {
        key$.set(`${event.key} (${event.code})`)
      }
    },
  })

  // 2. Attach the keyboard props to the focusable button.
  <button {...keyboardProps}>{key$.get()}</button>
}
