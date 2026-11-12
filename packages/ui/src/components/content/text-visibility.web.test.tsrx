/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { useSignal$ } from 'octane/signals/client'
import { expect, it } from 'vitest'
import { Text } from './Text.web.tsrx'

function VisibilityFixture() @{
  const visibility$ = useSignal$<'hidden' | 'collapse' | 'visible'>('hidden')
  const mounted$ = useSignal$(false)
  const revision$ = useSignal$(0)
  const presses$ = useSignal$(0)

  <>
    <button
      id="next"
      onClick={() =>
        visibility$.set((v) =>
          v === 'hidden' ? 'collapse' : v === 'collapse' ? 'visible' : 'hidden',
        )
      }
    >
      Next
    </button>
    <button id="mount" onClick={() => mounted$.set((v) => !v)}>
      Mount
    </button>
    <button id="text" onClick={() => revision$.set((v) => v + 1)}>
      Text
    </button>
    <button id="input" onClick={() => presses$.set((v) => v + 1)}>
      {presses$.get()}
    </button>
    // Web removal deliberately uses display:none; CSS collapse is layout-dependent.
    <Text
      id="inline"
      style={{
        visibility: visibility$.get() === 'hidden' ? 'hidden' : 'visible',
        display: visibility$.get() === 'collapse' ? 'none' : 'inline-block',
      }}
    >
      {revision$.get() === 0 ? '-10s' : '+10s changed while hidden ' + revision$.get()}
    </Text>
    <Text id="class" className={['visibility-label', 'visibility-' + visibility$.get()]}>
      {revision$.get() === 0 ? '-10s' : '+10s changed while hidden ' + revision$.get()}
    </Text>
    @if (mounted$.get()) {
      <Text id="conditional">
        {revision$.get() === 0 ? '-10s' : '+10s changed while hidden ' + revision$.get()}
      </Text>
    }
  </>
}

it('updates public Text inline/class styles, hidden content and fresh conditional hosts', () => {
  const host = document.createElement('div')
  const css = document.createElement('style')

  css.textContent =
    '.visibility-hidden { visibility:hidden } .visibility-visible { visibility:visible } .visibility-collapse { visibility:visible; display:none }'

  document.head.append(css)
  document.body.append(host)

  const root = createRoot(host)
  const node = (id: string) => host.querySelector<HTMLElement>('#' + id)!
  const click = (id: string) => act(() => node(id).click())

  try {
    act(() => root.render(<VisibilityFixture />))

    const inline = node('inline')
    const classHost = node('class')

    expect(inline.style.visibility).toBe('hidden')
    expect(getComputedStyle(classHost).visibility).toBe('hidden')
    expect(node('conditional')).toBeNull()
    for (let cycle = 0; cycle < 3; cycle++) {
      click('text')

      const text = '+10s changed while hidden ' + (cycle + 1)

      expect(inline.textContent).toBe(text)
      expect(classHost.textContent).toBe(text)
      expect(inline.style.visibility).toBe('hidden')
      expect(getComputedStyle(classHost).visibility).toBe('hidden')
      for (const mode of ['collapse', 'visible', 'hidden']) {
        click('next')
        for (const id of ['inline', 'class']) {
          const style = getComputedStyle(node(id))

          expect(style.visibility).toBe(mode === 'hidden' ? 'hidden' : 'visible')
          expect(style.display === 'none').toBe(mode === 'collapse')
        }

        expect(node('inline')).toBe(inline)
        expect(node('class')).toBe(classHost)
        click('input')
      }

      click('mount')

      const previous = node('conditional')

      expect(previous.textContent).toBe(text)
      click('mount')
      expect(node('conditional')).toBeNull()
      expect(previous.isConnected).toBe(false)
      click('mount')
      expect(node('conditional')).not.toBe(previous)
      expect(node('conditional').textContent).toBe(text)
      click('mount')
      expect(node('conditional')).toBeNull()
    }

    expect(node('input').textContent).toBe('9')
  } finally {
    act(() => root.unmount())
    css.remove()
    host.remove()
  }
})
