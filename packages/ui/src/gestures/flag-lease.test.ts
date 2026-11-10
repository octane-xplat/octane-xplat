import { expect, it } from 'vitest'
import { leaseNativeFlag } from './flag-lease'

it('restores original native flags only after the last overlapping owner leaves', () => {
  const native = { enabled: true, hidden: false }
  const a = leaseNativeFlag(native, 'enabled', false),
    b = leaseNativeFlag(native, 'enabled', false)

  a()
  a()
  expect(native.enabled).toBe(false)
  b()
  expect(native.enabled).toBe(true)

  const hidden = leaseNativeFlag(native, 'hidden', true)

  native.hidden = false
  hidden()
  expect(native.hidden).toBe(false)
})
