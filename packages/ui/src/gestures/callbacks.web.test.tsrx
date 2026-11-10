/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it } from 'vitest'
import { View } from '../components/layout/View.web.tsrx'
import { usePanGesture$ } from './hooks.tsrx'

it('finalizes a failing input callback synchronously before its renderer boundary handles the error', async () => {
  const mount = document.createElement('div'),
    calls: string[] = []

  document.body.append(mount)

  const root = createRoot(mount)
  function Broken() {
    const pan = usePanGesture$({
      axis: 'x',
      onStart() {
        calls.push('start')
        throw new Error('Drag failed')
      },
      onUpdate() {
        calls.push('update')
      },
      onCancel() {
        calls.push('cancel')
      },
      onFinalize() {
        calls.push('finalize')
      },
    })

    return <View gestures={pan} />
  }

  function Boundary() @{
    @try {
      <Broken />
    } @catch (error) {
      <span>{String(error)}</span>
    }
  }

  try {
    act(() => root.render(<Boundary />))

    const host = mount.firstElementChild!
    const send = (type: string, x: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: 0 })

      Object.defineProperty(event, 'pointerId', { value: 1 })
      host.dispatchEvent(event)
    }

    act(() => {
      send('pointerdown', 0)
      send('pointermove', 20)
    })

    expect(calls).toEqual(['start', 'cancel', 'finalize'])
    await act(async () => {
      await Promise.resolve()
    })

    expect(mount.textContent).toContain('Drag failed')
  } finally {
    act(() => root.unmount())
    mount.remove()
  }
})
