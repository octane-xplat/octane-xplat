/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Lightbox } from '../../../packages/ui/src/components/overlays/Lightbox.web.tsrx'

type PointerStep = { type: 'move'; x: number; y: number } | { type: 'down' } | { type: 'up' }
const realPointer: (steps: PointerStep[]) => Promise<void> = Reflect.get(commands, 'realPointer')

it('moves a zoomed image by the pointer drag in screen coordinates', async () => {
  const container = document.createElement('div')
  const style = document.createElement('style')

  style.textContent = `
    .vx-lightbox-layer { position: fixed; inset: 0; }
    .vx-lightbox-stage { position: fixed; inset: 0; }
    .vx-lightbox-media { position: absolute; left: 220px; top: 160px; width: 200px; height: 100px; }
  `

  document.head.append(style)
  document.body.append(container)

  const root = createRoot(container)

  try {
    act(() =>
      root.render(
        <Lightbox
          isOpen
          media={[
            {
              src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
              alt: 'Example image',
            },
          ]}
        />,
      ),
    )

    const image = document.querySelector<HTMLImageElement>('.vx-lightbox-media')

    expect(image).not.toBeNull()
    if (!image) {
      throw new Error('Lightbox image did not mount')
    }

    await userEvent.click(image)
    await vi.waitFor(() => expect(image.style.transform).toBe('scale(2.5) translate(0px, 0px)'))
    await realPointer([
      { type: 'move', x: 320, y: 210 },
      { type: 'down' },
      { type: 'move', x: 330, y: 215 },
      { type: 'move', x: 340, y: 220 },
      { type: 'move', x: 350, y: 225 },
      { type: 'move', x: 360, y: 230 },
      { type: 'move', x: 370, y: 235 },
    ])

    await vi.waitFor(() => expect(image.style.transform).toBe('scale(2.5) translate(20px, 10px)'))
  } finally {
    await realPointer([{ type: 'up' }])
    act(() => root.unmount())
    container.remove()
    style.remove()
  }
})
