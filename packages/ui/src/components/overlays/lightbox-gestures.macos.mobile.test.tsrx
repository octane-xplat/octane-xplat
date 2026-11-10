/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

vi.mock('./presentation.macos.tsrx', () => import('../../../tests/presentation-mock.tsrx'))
vi.mock('./layer-dismissal.tsrx', async (original) => ({
  ...(await original<typeof import('./layer-dismissal.tsrx')>()),
  useLayerDismissal: () => ({ depth: 0, shouldClose: () => true }),
}))

vi.mock('../actions/controls.macos.tsrx', () => import('../../../tests/lightbox-button-mock.macos.tsrx'))
vi.mock('../../gestures/host.macos.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))

import { dispatchTestPan, dispatchTestDoublePress } from '../../../tests/interaction-host-mock.tsrx'
import type { PanSample } from '../../gestures/types'

const point = { x: 0, y: 0 },
  position = { local: point, window: point, screen: null }

const sample: PanSample = {
  sequenceId: 'test',
  time: 0,
  target: { id: 'stage' },
  currentTarget: { id: 'stage' },
  position,
  startPosition: position,
  contacts: [],
  pointerCount: 0,
  session: { id: 'test', cancel() {} },
  translation: point,
  velocity: null,
}

const swipe = (host: object, direction: number) =>
  dispatchTestPan(host, {
    phase: 'finish',
    terminal: {
      outcome: 'ended',
      sample: { ...sample, translation: { x: direction === 2 ? -80 : 80, y: 0 } },
    },
  })

import { Lightbox } from './Lightbox.macos.tsrx'

it('AppKit panel wires current zoom/swipe policy and media replacement while late handlers become inert', () => {
  const window = {},
    changes: number[] = [],
    current: number[] = [],
    zooms: number[] = []

  const container = createObjectContainer('nativescript'),
    driver = createObjectDriver('nativescript'),
    instance = driver.getPublicInstance.bind(driver)

  driver.getPublicInstance = (container, id) => {
    const view: any = instance(container, id)

    view.window = window
    if (view.type === 'scrollview') {
      Object.assign(view, {
        magnification: 1,
        contentView: { bounds: { origin: { x: 0, y: 0 }, size: { width: 200, height: 100 } } },
        setMagnificationCenteredAtPoint(scale: number) {
          view.magnification = scale
          zooms.push(scale)
        },
      })
    }

    return view
  }

  const root = createUniversalRoot(container, driver),
    media = [
      { src: 'photo-a', alt: 'First' },
      { src: 'photo-b', alt: 'Second' },
    ]

  const render = (extra: any = {}) =>
    flushUniversalSync(() =>
      root.render(Lightbox, {
        isOpen: true,
        onOpenChange() {},
        media,
        onIndexChange: (index: number) => changes.push(index),
        ...extra,
      }),
    )

  const all = (): any[] => {
    const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]

    return container.children.flatMap(walk)
  }

  try {
    render()

    const stage = all().find((node) =>
        String(node.props?.className).split(' ').includes('vx-lightbox-stage'),
      ),
      scroll = all().find((node) => node.type === 'scrollview')

    const retainedToggle = () => dispatchTestDoublePress(stage)

    retainedToggle()
    expect(zooms).toEqual([2])
    swipe(stage, 2)
    expect(changes).toEqual([])
    dispatchTestDoublePress(stage)
    swipe(stage, 2)
    flushUniversalSync(() => {})
    expect(changes).toEqual([1])
    expect(scroll.magnification).toBe(1)
    render({ index: 0, hasZoom: false, onIndexChange: (index: number) => current.push(index) })
    swipe(stage, 2)
    expect(current).toEqual([1])
    expect(stage.props.onDoubleTap).toBeUndefined()
    retainedToggle()
    expect(zooms).toEqual([2, 1])
    render({
      media: [{ type: 'video', src: 'clip.mp4', alt: 'Clip' }],
      index: 0,
      hasAutoPlay: true,
    })

    const video = all().find((node) => node.type === 'xplatvideo')

    expect(video.props.src).toBe('clip.mp4')
    expect(video.props.autoplay).toBe(true)
    expect(all().some((node) => node.type === 'scrollview')).toBe(false)
    root.unmount()
    swipe(stage, 1)
    expect(current).toEqual([1])
  } finally {
    root.unmount()
  }
})
