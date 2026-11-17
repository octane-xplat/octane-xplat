import { afterEach, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({
  registerClass: vi.fn(),
  registerHotkey: vi.fn(),
  installMenu: vi.fn(),
  createStatusItem: vi.fn(),
  disableAutomaticTermination: vi.fn(),
}))

vi.mock('@octane-xplat/platform/macos', () => ({
  NativeClass: native.registerClass,
  NSObject: class {},
  NSApp: {},
  NSMenuItem: {},
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
