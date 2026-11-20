import { describe, expect, it, vi } from 'vitest'

import * as native from '../../src/index'
import * as web from '../../src/index.web'
import * as windowsTray from '../../src/tray/index.windows'
import * as windowsApp from '../../src/app/index.windows'
import { windows as secondaryWindows } from '../../src/window/index.windows'

vi.mock('@nativescript/core/application/application.windows', () => ({ Application: {} }))

const windows = { ...windowsTray, ...windowsApp }

const variants = [
  { name: 'native default', api: native, reason: 'unsupported-platform' },
  { name: 'web', api: web, reason: 'unsupported-platform' },
] as const

describe('unsupported variants', () => {
  for (const { name, api, reason } of variants) {
    it(`${name} reports unavailable`, async () => {
      const availability = await api.getTrayAvailability()

      expect(availability.available).toBe(false)
      if (!availability.available) {
        expect(availability.reason).toBe(reason)
        expect(availability.message.length).toBeGreaterThan(0)
      }
    })

    it(`${name} rejects createTray with TrayError(${reason})`, async () => {
      await expect(
        api.createTray({ id: 't', icon: { type: 'named', name: 'star' } }),
      ).rejects.toMatchObject({ name: 'TrayError', code: reason })
    })

    it(`${name} throws UnavailabilityError from window and residency helpers`, () => {
      for (const [call, feature] of [
        [() => api.showAppWindows(), 'showAppWindows'],
        [() => api.hideAppWindows(), 'hideAppWindows'],
        [() => api.toggleAppWindows(), 'toggleAppWindows'],
        [() => api.areAppWindowsVisible(), 'areAppWindowsVisible'],
        [() => api.keepAppResident(), 'keepAppResident'],
        [() => api.keepAppResident({ hideWindowsOnClose: true }), 'keepAppResident'],
      ] as const) {
        expect(call).toThrowError(
          expect.objectContaining({ name: 'UnavailabilityError', feature }),
        )
      }
    })
  }

  it('web explains it needs a native desktop runtime', async () => {
    const availability = await web.getTrayAvailability()

    expect(availability.available).toBe(false)
    if (!availability.available) {
      expect(availability.message).toMatch(/native desktop runtime/)
      expect(availability.message).toMatch(/WebView/)
    }
  })
})

// The windows leaf is real, but on a host without the packaged runtime's
// Win32 projection it still reports and throws the same explicit unsupported
// state instead of crashing on a missing global.
describe('windows leaf without the Win32 projection', () => {
  it('reports window and lifecycle APIs unavailable outside the Windows host', async () => {
    expect(windows.app.supported).toBe(false)
    expect(windows.app.isReady()).toBe(false)
    await expect(windows.app.whenReady()).rejects.toMatchObject({ name: 'UnavailabilityError' })
    expect(() => windows.app.quit()).toThrowError(expect.objectContaining({ name: 'UnavailabilityError' }))
    expect(secondaryWindows.supported).toBe(false)
    expect(() => secondaryWindows.open()).toThrowError(expect.objectContaining({ name: 'UnavailabilityError' }))
  })

  it('reports unsupported-runtime', async () => {
    const availability = await windows.getTrayAvailability()

    expect(availability.available).toBe(false)
    if (!availability.available) {
      expect(availability.reason).toBe('unsupported-runtime')
      expect(availability.message).toMatch(/Win32 FFI/)
    }
  })

  it('rejects createTray with TrayError(unsupported-runtime)', async () => {
    await expect(
      windows.createTray({ id: 't', icon: { type: 'named', name: 'application' } }),
    ).rejects.toMatchObject({ name: 'TrayError', code: 'unsupported-runtime' })
  })

  it('throws UnavailabilityError from window and residency helpers', () => {
    for (const [call, feature] of [
      [() => windows.showAppWindows(), 'showAppWindows'],
      [() => windows.hideAppWindows(), 'hideAppWindows'],
      [() => windows.toggleAppWindows(), 'toggleAppWindows'],
      [() => windows.areAppWindowsVisible(), 'areAppWindowsVisible'],
      [() => windows.keepAppResident(), 'keepAppResident'],
    ] as const) {
      expect(call).toThrowError(
        expect.objectContaining({ name: 'UnavailabilityError', feature }),
      )
    }
  })
})
