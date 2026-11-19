import { expect, it } from 'vitest'
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
