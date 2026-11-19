import { expect, it, vi } from 'vitest'
import { createDesktopScreen } from '../../src/screen/service.js'

const secondary = {
  id: 'left',
  bounds: { x: -120, y: 0, width: 120, height: 70 },
  isPrimary: false,
  scaleFactor: 1,
}
const primary = {
  id: 'main',
  bounds: { x: 0, y: 0, width: 160, height: 100 },
  isPrimary: true,
  scaleFactor: 2,
}

it('matches overlap, distance, and primary ties in desktop coordinates', () => {
  const screen = createDesktopScreen('logical', () => true, () => [secondary, primary])

  expect(screen.getPrimaryDisplay()).toEqual(primary)
  expect(screen.getDisplayMatching({ x: -50, y: 10, width: 70, height: 20 })).toEqual(secondary)
  expect(screen.getDisplayMatching({ x: -25, y: 10, width: 50, height: 20 })).toEqual(primary)
  expect(screen.getDisplayMatching({ x: -200, y: 20, width: 14, height: 10 })).toEqual(secondary)
  expect(() => screen.getDisplayMatching({ x: 0, y: 0, width: -1, height: 0 })).toThrow(RangeError)
})

it('keeps empty snapshots and hosts without an identified primary explicit', () => {
  const screen = createDesktopScreen('logical', () => true, () => [secondary])
  expect(screen.getPrimaryDisplay()).toBeUndefined()

  const empty = createDesktopScreen('logical', () => true, () => [])
  expect(empty.getDisplayMatching(secondary.bounds)).toBeUndefined()
})

it('coalesces changes, reports changed fields, and stops after the last listener', async () => {
  let displays = [primary, secondary]
  let notify = () => {}
  let stopped = 0
  const screen = createDesktopScreen('logical', () => true, () => displays, (changed) => {
    notify = changed
    return () => { stopped++ }
  })
  const events: unknown[] = []
  const added = vi.fn((event, display) => events.push([event.type, display.id]))
  const removed = vi.fn((event, display) => events.push([event.type, display.id]))
  const changed = vi.fn((event, display, metrics) => {
    events.push([event.type, display.id, metrics])
    display.bounds.width = 0
  })

  screen.on('display-added', added).on('display-removed', removed).on('display-metrics-changed', changed)
  expect(events).toEqual([])
  displays = [
    { ...primary, bounds: { ...primary.bounds, width: 180 }, scaleFactor: 1.5 },
    { ...secondary, id: 'right' },
  ]
  notify()
  notify()
  await Promise.resolve()
  expect(events).toEqual([
    ['display-removed', 'left'],
    ['display-metrics-changed', 'main', ['bounds', 'scaleFactor']],
    ['display-added', 'right'],
  ])
  expect(displays[0].bounds.width).toBe(180)

  displays = []
  notify()
  screen.off('display-added', added).off('display-removed', removed).off('display-metrics-changed', changed)
  expect(stopped).toBe(1)
  await Promise.resolve()
  expect(events).toHaveLength(3)
})
