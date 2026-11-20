import { Application, ApplicationSettings } from '@nativescript/core'
import { setiOSWindow } from '@nativescript/core/application/helpers-common'
import { registerElement } from '@octane-xplat/nativescript-octane'
import { Scroll } from '@octane-xplat/nativescript-mason-core/scroll'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import {
  bindIOSMasonTree,
  releaseIOSMasonOwners,
  releaseIOSMasonTree,
} from '../ios/mason-binding.ios.js'
import { renderWithStartupCore } from './shared.js'

registerElement('masonview', View)
registerElement('scrollview', Scroll)

function appearance() {
  return Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'
}

function resolveInput(name) {
  if (name === 'systemAppearance') {
    return appearance()
  }
  return ApplicationSettings.hasKey(name) ? ApplicationSettings.getString(name) : null
}

let mountClaimed = false
let handoffInstalled = false

function readMount() {
  if (typeof PrerenderMountHost === 'undefined') {
    return null
  }

  const mount = {
    window: PrerenderMountHost.window ?? null,
    rejected: PrerenderMountHost.rejection ? String(PrerenderMountHost.rejection) : null,
    theme: PrerenderMountHost.theme ? String(PrerenderMountHost.theme) : null,
    bind: PrerenderMountHost.bind ? JSON.parse(String(PrerenderMountHost.bind)) : null,
    viewport: PrerenderMountHost.viewport ?? null,
    mount: PrerenderMountHost.mount ?? null,
    natives: [],
  }

  if (mount.mount && mount.viewport) {
    for (let index = 0; index < mount.mount.views.count; index++) {
      mount.natives.push(mount.mount.views.objectAtIndex(index))
    }
    mount.restoreDefaults = () => mount.mount.restoreDefaults()
  } else if (!mount.rejected) {
    mount.rejected = 'native mount missing'
  }

  return mount
}

/**
 * Hand the bootstrap's window to NativeScriptEmbedder so the stock
 * Application.run root install reuses the scene window instead of creating a
 * second one. Required by ordinary rendering too.
 */
function installHandoff(mount) {
  const window = mount?.window ?? null
  if (!window || handoffInstalled) {
    return
  }
  handoffInstalled = true
  setiOSWindow(window)
  const delegate = NSObject.extend(
    {
      presentNativeScriptApp(controller) {
        window.rootViewController = controller
        return controller
      },
    },
    { protocols: [NativeScriptEmbedderDelegate] },
  )
  NativeScriptEmbedder.sharedInstance().setDelegate(delegate.new())
}

function overflowsSafeArea(native) {
  const window = native.window
  if (!window) {
    return false
  }
  const guide = window.safeAreaLayoutGuide.layoutFrame
  const frame = native.convertRectToCoordinateSpace(native.bounds, window)
  return (
    frame.origin.y < guide.origin.y ||
    frame.origin.y + frame.size.height > guide.origin.y + guide.size.height ||
    frame.origin.x < guide.origin.x ||
    frame.origin.x + frame.size.width > guide.origin.x + guide.size.width
  )
}

function styleHost(host, mount, sheets) {
  const cold = mount.natives
  host.iosOverflowSafeArea = cold.some((native) => overflowsSafeArea(native))
  host.width = '100%'
  host.height = '100%'
  host.className = 'ns-root ' + (appearance() === 'dark' ? 'ns-dark' : 'xds-light')
  if (sheets) {
    host.css = sheets.map((sheet) => (typeof sheet === 'string' ? sheet : sheet.css)).join('\n')
  }
}

function discardMount() {
  try {
    PrerenderMountHost.viewport?.removeFromSuperview?.()
  } catch {}
}

function releaseFailed(binding) {
  try {
    releaseIOSMasonTree(binding.host, binding.wrappers)
  } finally {
    releaseIOSMasonOwners(binding.host, binding.wrappers)
  }
}

/**
 * Ordinary app entry replacement: render `component` under `host` (the entry
 * Page), adopting the bootstrap-mounted cold native tree when the packaged
 * startup artifact selects it and every check passes. See `startup.d.ts` and
 * the package README for the full contract.
 */
export function renderWithStartup(host, component, props, startup) {
  return renderWithStartupCore(host, component, props, startup, {
    appearance,
    resolveInput,
    readMount,
    installHandoff,
    consumed: () => mountClaimed,
    claimMount: () => {
      mountClaimed = true
    },
    bindTree: (nodes, mount) => bindIOSMasonTree(nodes, mount.viewport, mount.natives),
    styleHost,
    discardMount,
    releaseFailed,
  })
}
