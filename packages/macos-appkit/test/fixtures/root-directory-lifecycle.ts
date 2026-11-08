import { createMacOSRoot, observeLayoutCommits } from '@octane-xplat/macos-appkit'
import { NSView } from '@octane-xplat/platform/macos'
import DirectoryRoots, { DirectoryLabel } from './RootDirectory'

export async function checkRootDirectoryLifecycle(nativeWindow: any) {
  const check = (condition: unknown, message: string) => {
    if (!condition) {
      throw new Error(message)
    }
  }

  const settle = () =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        nativeWindow.contentView.layoutSubtreeIfNeeded()
        resolve()
      }, 70),
    )

  const host = NSView.alloc().initWithFrame({
    origin: { x: 0, y: 0 },
    size: { width: 240, height: 180 },
  })

  const target = NSView.alloc().initWithFrame({
    origin: { x: 0, y: 0 },
    size: { width: 40, height: 25 },
  })

  nativeWindow.contentView.addSubview(host)
  host.addSubview(target)

  const root = createMacOSRoot(host, { fontFamily: 'Menlo' })
  const debug = (root as any).__macosDebug
  const bridge = Reflect.get(globalThis, '__xplatAppKit')
  let popup: any, layer: any

  try {
    let rejected = false

    try {
      createMacOSRoot(host)
    } catch {
      rejected = true
    }

    check(rejected, 'Duplicate native host mount admitted')
    root.render(DirectoryRoots as any, { target })
    await settle()

    const family = (view: any) => String(view?.font?.familyName)
    const label = debug.findId('directory-main')

    check(family(label) === 'Menlo', 'Main root lost its font')
    check(family(debug.findId('directory-tab-label')) === 'Menlo', 'Tab portal lost inherited font')
    check(
      family(debug.findId('directory-tab-root-label')) === 'Menlo',
      'Retained tab root lost inherited font',
    )

    const table = debug.findId('directory-list').documentView
    const row = table.viewAtColumnRowMakeIfNecessary(0, 0, true)

    check(family(row.subviews.objectAtIndex(0)) === 'Menlo', 'List nested root lost inherited font')

    const portal = debug.findId('directory-portal')

    check(
      portal.superview === target && family(portal) === 'Menlo',
      'Portal target membership/font lost',
    )

    const hosts: any[] = []

    observeLayoutCommits((commit) => hosts.push(commit.hostView))()
    check(
      hosts.includes(host) && hosts.length >= 2,
      'Immediate layout observation missed live nested roots',
    )

    popup = bridge.showAnchoredPopup({
      anchor: label,
      component: DirectoryLabel,
      props: { id: 'directory-popup' },
      animates: false,
      lightDismiss: false,
    })

    check(popup, 'Native popup did not open')
    await settle()
    check(family(debug.findId('directory-popup')) === 'Menlo', 'Popup root lost inherited font')
    popup.close()
    check(
      Reflect.get(globalThis, '__xplatMacOSDebug') !== undefined,
      'Newest debug retirement lost remaining roots',
    )

    check(debug.findId('directory-popup') === null, 'Popup retirement retained membership')
    layer = bridge.showLayer({
      anchor: label,
      component: DirectoryLabel,
      props: { id: 'directory-layer' },
      lightDismiss: false,
      position: () => ({ left: 0, top: 0 }),
    })

    await settle()
    check(family(debug.findId('directory-layer')) === 'Menlo', 'Layer root lost inherited font')

    const layerDebug = Reflect.get(globalThis, '__xplatMacOSDebug')

    layer.close()
    check(
      Reflect.get(globalThis, '__xplatMacOSDebug') !== layerDebug &&
        Reflect.get(globalThis, '__xplatMacOSDebug') !== undefined,
      'Newest debug retirement did not restore a live root',
    )

    check(debug.findId('directory-layer') === null, 'Layer retirement retained membership')

    // Inject a boundary failure in the real runtime's per-root setup, after
    // universal-root acquisition. This does not emulate a failing OS release.
    const failure = Error('native setup injection')
    const failingHost = {
      get window() {
        throw failure
      },
    }

    let caught: unknown

    try {
      createMacOSRoot(failingHost as any, { fontFamily: 'Gone' })
    } catch (error) {
      caught = error
    }

    check(caught === failure, 'Root setup replaced its primary failure')
    Object.defineProperty(failingHost, 'window', { value: undefined })
    createMacOSRoot(failingHost as any).unmount()
    check(
      Reflect.get(globalThis, '__xplatMacOSDebug') !== undefined,
      'Failed root setup lost live diagnostics',
    )
  } finally {
    popup?.close()
    layer?.close()
    root.unmount()
    target.removeFromSuperview()
    host.removeFromSuperview()
  }

  check(
    (root as any).__macosDebug === undefined && !debug.findId('directory-main'),
    'Main retirement retained debug membership',
  )

  const replacement = createMacOSRoot(host)

  root.unmount()
  check(
    (replacement as any).__macosDebug === Reflect.get(globalThis, '__xplatMacOSDebug'),
    'Old unmount retired replacement debug owner',
  )

  replacement.render(DirectoryLabel as any, {})
  await settle()
  check(
    String((replacement as any).__macosDebug.findId('directory-overlay').font.familyName) !==
      'Menlo',
    'Retired font leaked into host reuse',
  )

  replacement.unmount()
  console.log('PACKED_ROOT_DIRECTORY_OK')
}
