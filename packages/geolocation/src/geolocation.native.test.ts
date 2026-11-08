import { expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ getCurrentLocation: vi.fn(), enableLocationRequest: vi.fn() }))

vi.mock('@nativescript/geolocation', () => api)
vi.mock('@nativescript/core', () => ({ CoreTypes: { Accuracy: { high: 1, any: 0 } } }))

import { geolocation } from './geolocation.ts'

const fix = { latitude: 1, longitude: 2, horizontalAccuracy: 3, timestamp: new Date(123) }

it('uses Android presence flags while preserving real zero and negative altitude', async () => {
  for (const present of [false, true]) {
    api.getCurrentLocation.mockResolvedValue({
      ...fix,
      altitude: -10,
      speed: 0,
      direction: 0,
      android: { hasAltitude: () => present, hasSpeed: () => present, hasBearing: () => present },
    })

    expect(await geolocation.getCurrentPosition()).toEqual({
      latitude: 1,
      longitude: 2,
      accuracy: 3,
      altitude: present ? -10 : null,
      speed: present ? 0 : null,
      heading: present ? 0 : null,
      timestamp: 123,
    })
  }
})

it('uses iOS altitude validity and rejects negative course/speed sentinels', async () => {
  api.getCurrentLocation.mockResolvedValue({
    ...fix,
    altitude: -10,
    speed: -1,
    direction: -1,
    ios: { verticalAccuracy: -1 },
  })

  const absent = await geolocation.getCurrentPosition()

  expect([absent.altitude, absent.heading, absent.speed]).toEqual([null, null, null])
  api.getCurrentLocation.mockResolvedValue({
    ...fix,
    altitude: -10,
    speed: 0,
    direction: 0,
    ios: { verticalAccuracy: 1 },
  })

  const present = await geolocation.getCurrentPosition()

  expect([present.altitude, present.heading, present.speed]).toEqual([-10, 0, 0])
})

it('clamps the iOS invalid-accuracy sentinel to the contract floor', async () => {
  api.getCurrentLocation.mockResolvedValue({ ...fix, horizontalAccuracy: -1 })
  expect((await geolocation.getCurrentPosition()).accuracy).toBe(0)
})

it('attaches the shared denied code to the plugin denial markers', async () => {
  for (const reason of [
    new Error('Authorization Denied.'),
    new Error('User denied location permission previously'),
    new Error('User needs to enable permission from settings'),
    {
      'android.permission.ACCESS_COARSE_LOCATION': false,
      'android.permission.ACCESS_FINE_LOCATION': false,
    },
  ]) {
    api.getCurrentLocation.mockRejectedValue(reason)
    await expect(geolocation.getCurrentPosition()).rejects.toMatchObject({ code: 1 })
  }
})

it('attaches the shared timeout code to the plugin timeout rejection', async () => {
  api.getCurrentLocation.mockRejectedValue(new Error('Timeout while searching for location!'))
  await expect(geolocation.getCurrentPosition()).rejects.toMatchObject({ code: 3 })
})

it('defaults remaining failures to unavailable and preserves the plugin Error', async () => {
  const error = new Error('Localized platform failure')

  api.getCurrentLocation.mockRejectedValue(error)

  const rejection = await geolocation.getCurrentPosition().catch((reason) => reason)

  expect(rejection).toBe(error)
  expect(rejection.code).toBe(2)
})

it('wraps non-Error rejections without losing the shared code', async () => {
  api.getCurrentLocation.mockRejectedValue('Location not enabled.')
  await expect(geolocation.getCurrentPosition()).rejects.toMatchObject({
    message: 'Location not enabled.',
    code: 2,
  })
})

it('reports an unsupported capability on windows', async () => {
  const windows = await import('./geolocation.windows')

  expect(windows.geolocation.supported).toBe(false)
  expect(windows.geolocation.supported).toBe(false)
  await expect(windows.geolocation.requestPermissions()).resolves.toMatchObject({
    status: 'unsupported',
  })

  await expect(windows.geolocation.getCurrentPosition()).rejects.toMatchObject({
    name: 'UnavailabilityError',
  })
})
