/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { createMacOSRoot, type UniversalComponent } from '@octane-xplat/macos-appkit'
import { NSWindow } from '@octane-xplat/platform/macos'

function Panel() {
  return (
    <masonview
      id="panel"
      style={mergeStyle(
        { left: 10, top: 12, bottom: 18, position: 'absolute' },
        {
          display: 'flex',
          flexDirection: 'column',
          width: 268,
        },
      )}
    >
      <masonview
        id="header"
        style={{
          display: 'flex',
          height: 44,
        }}
      >
        <label text="Panel header" />
      </masonview>
      <scrollview id="scroll" className="flex-1">
        <masonview style={{ display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: 30 }, (_, index) => (
            <label key={index} text={'Row ' + index} style={{ height: 32 }} />
          ))}
        </masonview>
      </scrollview>
      <masonview
        id="footer"
        style={{
          display: 'flex',
          height: 36,
        }}
      >
        <label text="Panel footer" />
      </masonview>
    </masonview>
  )
}

function AbsolutePanel() {
  return (
    <masonview id="container">
      <Panel style={{ position: 'absolute' }} />
    </masonview>
  )
}

function GridPanel() {
  return (
    <masonview
      id="container"
      style={{
        display: 'grid',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        gridTemplateRows: '100%',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      <masonview
        style={{
          display: 'flex',
          flexDirection: 'column',
          gridRow: '1',
          gridColumn: '2',
        }}
        id="panel"
      >
        <masonview
          id="header"
          style={{
            display: 'flex',
            height: 44,
          }}
        >
          <label text="Panel header" />
        </masonview>
        <scrollview id="scroll" className="flex-1">
          <masonview style={{ display: 'flex', flexDirection: 'column' }}>
            <label text="Scrollable rows" style={{ height: 960 }} />
          </masonview>
        </scrollview>
        <masonview
          id="footer"
          style={{
            display: 'flex',
            height: 36,
          }}
        >
          <label text="Panel footer" />
        </masonview>
      </masonview>
    </masonview>
  )
}

export async function runLayoutPlacementFixture(stopHost = true) {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    { origin: { x: 180, y: 160 }, size: { width: 288, height: 803 } },
    15,
    2,
    false,
  )

  window.releasedWhenClosed = false
  // No required contentView size pins: placement must not defeat AppKit's
  // WindowSizeStayPut priority and shrink the host to content fitting size.
  window.orderFront(null)

  const root = createMacOSRoot(window.contentView)
  const view = (id: string) => (root as any).__macosDebug.findId(id)
  const near = (actual: number, expected: number, message: string) => {
    if (
      !Number.isFinite(actual) ||
      !Number.isFinite(expected) ||
      Math.abs(actual - expected) >= 1
    ) {
      throw new Error(message + ': ' + actual + ' vs ' + expected)
    }
  }

  const settle = () =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        window.contentView.layoutSubtreeIfNeeded()
        resolve()
      }, 40),
    )

  try {
    // Each panel fills a deterministic region of the host: the absolute panel
    // honors its authored insets; the grid panel fills the right column of a
    // 1x2 fr grid (x = half width, bottom-pinned at y 0).
    const components: [
      UniversalComponent,
      (width: number, height: number) => { x: number; y: number; w: number; h: number },
    ][] = [
      [
        AbsolutePanel as unknown as UniversalComponent,
        (_w, h) => ({ x: 10, y: 18, w: 268, h: h - 30 }),
      ],
      [GridPanel as unknown as UniversalComponent, (w, h) => ({ x: w / 2, y: 0, w: w / 2, h })],
    ]

    for (const [Component, region] of components) {
      const initialOrigin = window.frame.origin

      root.render(Component)
      await settle()
      near(Number(window.contentView.bounds.size.width), 288, 'initial host width')
      near(Number(window.contentView.bounds.size.height), 803, 'initial host height')
      near(Number(window.frame.origin.x), Number(initialOrigin.x), 'initial host x')
      near(Number(window.frame.origin.y), Number(initialOrigin.y), 'initial host y')
      for (const size of [
        { width: 288, height: 803 },
        { width: 420, height: 640 },
        { width: 288, height: 803 },
      ]) {
        window.setContentSize(size)

        const origin = window.frame.origin

        for (let solve = 0; solve < 3; solve++) {
          await settle()
          near(Number(window.contentView.bounds.size.width), size.width, 'host width')
          near(Number(window.contentView.bounds.size.height), size.height, 'host height')
          near(Number(window.frame.origin.x), Number(origin.x), 'host x')
          near(Number(window.frame.origin.y), Number(origin.y), 'host y')

          const expected = region(size.width, size.height)
          const panel = view('panel').frame

          near(Number(panel.origin.x), expected.x, 'panel leading')
          near(Number(panel.origin.y), expected.y, 'panel bottom')
          near(Number(panel.size.width), expected.w, 'panel width')
          near(Number(panel.size.height), expected.h, 'panel height')
          for (const id of ['header', 'scroll', 'footer']) {
            near(Number(view(id).frame.size.width), expected.w, id + ' assigned width')
          }

          near(
            Number(view('header').frame.origin.y) + Number(view('header').frame.size.height),
            expected.h,
            'top-packed header',
          )

          near(Number(view('footer').frame.origin.y), 0, 'bottom footer')
          near(Number(view('scroll').frame.size.height), expected.h - 80, 'growing scroll height')
        }
      }
    }

    console.log('LAYOUT_PLACEMENT_OK')
  } catch (error) {
    console.error('LAYOUT_PLACEMENT_FAIL: ' + (error as Error).message)
    throw error
  } finally {
    root.unmount()
    window.close()
    if (stopHost) {
      ;(globalThis as any).__xplatStopHost()
    }
  }
}
