import { afterEach, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({
  registerClass: vi.fn(),
  registerHotkey: vi.fn(),
  installMenu: vi.fn(),
  createStatusItem: vi.fn(),
  openPanel: vi.fn(),
  savePanel: vi.fn(),
  disableAutomaticTermination: vi.fn(),
}))

vi.mock('@octane-xplat/platform/macos', () => ({
  NativeClass: native.registerClass,
  NSObject: class {},
  NSApp: {},
  NSMenuItem: {},
  NSOpenPanel: { openPanel: native.openPanel },
  NSSavePanel: { savePanel: native.savePanel },
  NSStatusBar: { systemStatusBar: { statusItemWithLength: native.createStatusItem } },
  NSProcessInfo: {
    processInfo: { disableAutomaticTermination: native.disableAutomaticTermination },
  },
  RegisterEventHotKey: native.registerHotkey,
}))

afterEach(() => vi.unstubAllGlobals())

it('loads the macOS root and checks capabilities without acquiring native resources', async () => {
  vi.stubGlobal('__xplatAppKit', { installApplicationMenu: native.installMenu })

  const desktop = await import('../src/index.macos')

  expect(desktop.appMenu.supported).toBe(true)
  expect(desktop.windows.supported).toBe(false)
  expect(desktop.dialog.supported).toBe(true)
  expect(desktop.app.supported).toBe(false)
  await expect(desktop.getTrayAvailability()).resolves.toEqual({
    available: true,
    platform: 'macos',
  })

  await expect(desktop.getGlobalShortcutSupport()).resolves.toMatchObject({ supported: true })
  expect(desktop.createTray).toBeTypeOf('function')
  expect(desktop.keepAppResident).toBeTypeOf('function')

  for (const operation of Object.values(native)) {
    expect(operation).not.toHaveBeenCalled()
  }
})

it('exposes the same symbols from native and unsupported roots', async () => {
  const macos = await import('../src/index.macos')
  const fallback = await import('../src/index')
  const web = await import('../src/index.web')

  expect(Object.keys(fallback).sort()).toEqual(Object.keys(macos).sort())
  expect(Object.keys(web).sort()).toEqual(Object.keys(macos).sort())
})

it('reports secondary desktop windows as unavailable on the default and web roots', async () => {
  for (const { windows } of [await import('../src/index'), await import('../src/index.web')]) {
    expect(windows.supported).toBe(false)
    expect(() => windows.open()).toThrowError(
      expect.objectContaining({ name: 'UnavailabilityError', feature: 'windows.open' }),
    )
  }
})

it('reports app lifecycle as unavailable without a desktop host', async () => {
  const { app } = await import('../src/index.web')

  expect(app.supported).toBe(false)
  expect(app.isReady()).toBe(false)
  await expect(app.whenReady()).rejects.toMatchObject({ name: 'UnavailabilityError', feature: 'app' })
  expect(() => app.quit()).toThrowError(expect.objectContaining({ name: 'UnavailabilityError', feature: 'app' }))
})
