// Fixed Home qualification fixture; the host build supplies three virtual data modules.
import { writeProbeDiagnostic } from './write-native-diagnostic.ios.js'
import '@nativescript/core/globals'
import { Application, Page } from '@nativescript/core'
import { GestureTypes } from '@nativescript/core/ui/gestures'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { setiOSWindow } from '@nativescript/core/application/helpers-common'
import { bindNativeView } from '@octane-xplat/nativescript-mason-core/adoption'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'
import { Home } from './Home.tsrx'
import { matchPreparedTree } from '@octane-xplat/native-prerender'
import sheets from 'xplat-prerender:styles'
import resolved from 'xplat-prerender:artifact'
import startup from 'xplat-prerender:startup'
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
const artifactRejected = snapshot.artifactRejected === true
const staleHome = artifactRejected ? null : nativeHost.subviews.objectAtIndex(0)
function nativeTreeUnchanged() {
  return staleHome
    ? nativeHost.subviews.count === 1 && nativeHost.subviews.objectAtIndex(0) === staleHome
    : nativeHost.subviews.count === 0
}
const scheme = Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'
check(
  artifactRejected || snapshot.theme !== scheme,
  'Expected rejected artifact or stale native launch theme',
)
check(nativeTreeUnchanged(), 'Rejected artifact unexpectedly created native Home views')
const host = new View()
bindNativeView(host, nativeHost)
host.setNativeView(nativeHost)
host.width = '100%'
host.height = '100%'
host.style.display = 'flex'
host.style.flexDirection = 'column'
host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
host.css = sheets.map((sheet) => sheet.css).join('\n')
let claimCalls = 0
const candidate = createNativeScriptRoot(host, {
  createView() {
    claimCalls++
    throw new Error('Rejected pre-render must not claim a view')
  },
})
const prepared = candidate.prepare(Home, resolved.seed)
check(prepared.status === 'prepared', 'Home fallback prepare suspended')
matchPreparedTree(prepared.batch.commands, startup.nodes)
prepared.abort()
candidate.unmount()
check(
  claimCalls === 0 && host.getChildrenCount() === 0 && nativeTreeUnchanged(),
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
  check(claimCalls === 0 && nativeTreeUnchanged(), 'Rejected candidate consumed native claims')
  if (staleHome) nativeHost.removeView(staleHome)
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
      (!staleHome || staleHome.superview == null),
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
      kind: artifactRejected
        ? 'rejected-artifact-ordinary-fallback'
        : 'stale-theme-ordinary-fallback',
      artifactRejectedBeforeRuntime: artifactRejected,
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
