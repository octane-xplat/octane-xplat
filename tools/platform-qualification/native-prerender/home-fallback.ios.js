// Fixed Home qualification fixture; the host build supplies the two virtual data modules.
import { writeProbeDiagnostic } from './write-native-diagnostic.ios.js'
import '@nativescript/core/globals'
import { Application, Page } from '@nativescript/core'
import { GestureTypes } from '@nativescript/core/ui/gestures'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { setiOSWindow } from '@nativescript/core/application/helpers-common'
import { native_ } from '@octane-xplat/nativescript-mason-core/symbols'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { Home } from './Home.tsrx'
import { matchPreparedVisualTree } from './match-tree.mjs'
import sheets from 'xplat-prerender:styles'
import resolved from 'xplat-prerender:artifact'
const check = (value, message) => {
  if (!value) throw new Error(message)
}
const delay = () => new Promise((resolve) => setTimeout(resolve, 0))
const snapshot = JSON.parse(
  String(
    NSString.stringWithContentsOfFileEncodingError(
      NSHomeDirectory() + '/Documents/native-home.json',
      4,
      null,
    ),
  ),
)
const scene = UIApplication.sharedApplication.connectedScenes.allObjects.objectAtIndex(0)
const window = scene.windows.objectAtIndex(0)
const nativeHost = window.rootViewController.view.subviews.objectAtIndex(0)
const staleHome = nativeHost.subviews.objectAtIndex(0)
const scheme = Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'
check(snapshot.theme !== scheme, 'Expected stale native launch theme')
const host = new View()
host[native_] = nativeHost
host.setNativeView(nativeHost)
host.width = '100%'
host.height = '100%'
host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
host.css = sheets.map((sheet) => sheet.css).join('\n')
let claimCalls = 0
const candidate = createNativeScriptRoot(host, {
  createView() {
    claimCalls++
    throw new Error('Stale environment must not claim a view')
  },
})
const prepared = candidate.prepare(Home, resolved.seed)
check(prepared.status === 'prepared', 'Home fallback prepare suspended')
matchPreparedVisualTree(prepared.batch.commands, resolved.nodes, 27)
prepared.abort()
candidate.unmount()
check(
  claimCalls === 0 &&
    host.getChildrenCount() === 0 &&
    nativeHost.subviews.objectAtIndex(0) === staleHome,
  'Rejected preparation mutated native tree',
)
const root = createNativeScriptRoot(host)
const live = root.prepare(Home, resolved.seed)
check(live.status === 'prepared', 'Ordinary fallback prepare suspended')
const page = new Page()
page.actionBarHidden = true
page.content = host
let presentations = 0,
  rootSetups = 0
const setup = host._setupUI
host._setupUI = function (context) {
  rootSetups++
  return setup.call(this, context)
}
const HostDelegate = NSObject.extend(
  {
    presentNativeScriptApp(controller) {
      presentations++
      window.rootViewController = controller
      return controller
    },
  },
  { name: 'StaleHomePageEmbedder', protocols: [NativeScriptEmbedderDelegate] },
)
const embedder = HostDelegate.new()
NativeScriptEmbedder.sharedInstance().setDelegate(embedder)
setiOSWindow(window)
Application.run({ create: () => page })
async function run() {
  const deadline = Date.now() + 2000
  while (!host.isLoaded || !page.isLoaded) {
    check(Date.now() < deadline, 'Fallback Page failed to load')
    await delay()
  }
  check(
    claimCalls === 0 && nativeHost.subviews.objectAtIndex(0) === staleHome,
    'Rejected candidate consumed native claims',
  )
  nativeHost.removeView(staleHome)
  live.commit()
  await delay()
  check(
    presentations === 1 &&
      rootSetups === 1 &&
      host.getChildrenCount() === 1 &&
      nativeHost.subviews.count === 1,
    'Fallback root ownership mismatch',
  )
  const wrappers = []
  function collect(view) {
    wrappers.push(view)
    if (view instanceof View)
      for (let i = 0; i < view.getChildrenCount(); i++) collect(view.getChildAt(i))
  }
  collect(host.getChildAt(0))
  check(
    wrappers.length === 19 &&
      wrappers[0].nativeViewProtected !== staleHome &&
      staleHome.superview == null,
    'Fallback retained stale Home',
  )
  const find = (id) => wrappers.find((view) => view.id === id)
  function activate(view) {
    const observers = view.getGestureObservers(GestureTypes.tap)
    check(observers?.length > 0, 'Fallback Button has no tap listener')
    for (const observer of [...observers])
      observer.callback.call(observer.context, {
        eventName: 'tap',
        type: GestureTypes.tap,
        object: view,
        view,
        ios: null,
        android: undefined,
      })
  }
  activate(find('home-complete'))
  await delay()
  check(find('home-completed').text === '4', 'Fallback increment failed')
  activate(find('home-reset'))
  await delay()
  check(find('home-completed').text === '3', 'Fallback reset failed')
  const expected = scheme === 'dark' ? '#101827' : '#f5f7fb'
  const color = host.getChildAt(0).backgroundColor
  check(
    color?.hex?.toLowerCase().endsWith(expected.slice(1)),
    'Fallback did not resolve current theme: ' + String(color?.hex),
  )
  writeProbeDiagnostic(
    'entry-details.json',
    JSON.stringify({
      passed: true,
      kind: 'stale-theme-ordinary-fallback',
      visualNodes: 19,
      logicalNodes: 27,
      nativeTheme: snapshot.theme,
      liveTheme: scheme,
      claimsBeforeReject: claimCalls,
      staleNativeRootDetached: true,
      normalRenderFallback: true,
      sharedButtonUpdates: true,
      sharedResetUpdates: true,
      currentThemeApplied: true,
      presentations,
      rootSetups,
      osInputQualified: false,
      presentationQualified: false,
    }),
  )
  globalThis.__staleHomeFallback = { root, host, page, embedder }
}
run().catch((error) => {
  writeProbeDiagnostic('entry-error.txt', String(error.stack ?? error))
  throw error
})
