// Fixed Home qualification fixture; the host build supplies the two virtual data modules.
import { writeProbeDiagnostic } from './write-native-diagnostic.ios.js'
import { matchPreparedVisualTree } from './match-tree.mjs'
import '@nativescript/core/globals'
import { Application, Page, Utils } from '@nativescript/core'
import { Label } from '@nativescript/core/ui/label'
import { GestureTypes } from '@nativescript/core/ui/gestures'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { setiOSWindow } from '@nativescript/core/application/helpers-common'
import { native_ } from '@octane-xplat/nativescript-mason-core/symbols'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { Home } from './Home.tsrx'
import sheets from 'xplat-prerender:styles'
import resolved from 'xplat-prerender:artifact'
const check = (value, message) => {
  if (!value) throw new Error(message)
}
const scene = UIApplication.sharedApplication.connectedScenes.allObjects.objectAtIndex(0)
const window = scene.windows.objectAtIndex(0)
const nativeHost = window.rootViewController.view.subviews.objectAtIndex(0)
const scheme = Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'
const nativeSnapshot = JSON.parse(
  String(
    NSString.stringWithContentsOfFileEncodingError(
      NSHomeDirectory() + '/Documents/native-home.json',
      4,
      null,
    ),
  ),
)
check(nativeSnapshot.theme === scheme, 'Native/live launch environment theme differs')
const nativeViews = []
function collect(native, path) {
  const expected = resolved.nodes[nativeViews.length]
  check(expected?.path === path, 'Native adoption topology mismatch at ' + path)
  check(
    expected.kind === 'label' ? native instanceof TNSLabel : native instanceof MasonUIView,
    'Wrong native class at ' + path,
  )
  nativeViews.push(native)
  if (expected.kind === 'masonview')
    for (let index = 0; index < native.subviews.count; index++)
      collect(native.subviews.objectAtIndex(index), path + '/' + index)
}
check(nativeHost.subviews.count === 1, 'Expected one native Home root')
collect(nativeHost.subviews.objectAtIndex(0), '0')
check(nativeViews.length === 19, 'Native Home record count differs')
const oldNodes = nativeViews.map((view) =>
  NSCMason.shared.nodeForView(view, view instanceof TNSLabel),
)
const oldParents = nativeViews.map((view) => view.superview)
const oldTexts = nativeViews.map((view, index) =>
  resolved.nodes[index].kind === 'label' ? view.text : null,
)
const oldFrames = nativeViews.map((view) => ({
  x: view.frame.origin.x,
  y: view.frame.origin.y,
  width: view.frame.size.width,
  height: view.frame.size.height,
}))
const host = new View()
host[native_] = nativeHost
host.setNativeView(nativeHost)
host.width = '100%'
host.height = '100%'
host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
host.css = sheets.map((sheet) => sheet.css).join('\n')
const wrappers = nativeViews.map((native, index) => {
  const view = resolved.nodes[index].kind === 'label' ? new Label() : new View()
  if (view instanceof View) view[native_] = native
  view.setNativeView(native)
  return view
})
let claiming = false,
  hookCalls = 0
const pendingClaims = new Map()
const root = createNativeScriptRoot(host, {
  createView(id, type, props) {
    hookCalls++
    if (!claiming) return undefined
    const index = pendingClaims.get(id)
    check(
      index !== undefined && resolved.nodes[index].kind === type,
      'Unexpected root-scoped native claim',
    )
    check(
      (props.id ?? null) === (resolved.nodes[index].props.id ?? null),
      'Root-scoped claim address changed',
    )
    pendingClaims.delete(id)
    return wrappers[index]
  },
})
const aborted = root.prepare(Home, resolved.seed)
check(aborted.status === 'prepared', 'Aborted Home prepare suspended')
aborted.abort()
check(
  host.getChildrenCount() === 0 &&
    nativeViews.every((view, index) => view.superview === oldParents[index]),
  'Aborted prepare mutated native/logical tree',
)
check(wrappers.every((view) => !view.parent) && hookCalls === 0, 'Aborted prepare claimed wrappers')
const prepared = root.prepare(Home, resolved.seed)
check(prepared.status === 'prepared', 'Actual Home prepare suspended')
const addresses = matchPreparedVisualTree(prepared.batch.commands, resolved.nodes, 27)
check(addresses.size === 19, 'Not all visual nodes validated')
for (const [id, index] of addresses) pendingClaims.set(id, index)
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
  { name: 'SharedHomePageEmbedder', protocols: [NativeScriptEmbedderDelegate] },
)
const embedder = HostDelegate.new()
NativeScriptEmbedder.sharedInstance().setDelegate(embedder)
setiOSWindow(window)
Application.run({ create: () => page })
const deadline = Date.now() + 2000
function accept() {
  try {
    if (!host.isLoaded || !page.isLoaded) {
      check(Date.now() < deadline, 'Page/Home failed to load')
      setTimeout(accept, 10)
      return
    }
    check(presentations === 1 && rootSetups === 1, 'Page set up/presented Home more than once')
    check(
      Application.getRootView() === page &&
        Application.primaryWindow?.rootView === page &&
        Application.primaryWindow?.ios?.uiWindow === window,
      'Page/window application registration differs',
    )
    check(host.nativeViewProtected === nativeHost, 'Page replaced native viewport')
    // Restore canonical native baselines synchronously before live property
    // initialization captures defaults. Initial live CSS is committed before yielding.
    nativeViews.forEach((native, index) => {
      const journal = native.valueForKey('prerenderDefaults')
      check(journal, 'Missing native default journal')
      NSCMason.shared.styleForView(native).borderRadius = journal.objectForKey('borderRadius')
      if (resolved.nodes[index].kind === 'label') {
        native.font = journal.objectForKey('font')
        native.textColor = journal.objectForKey('textColor')
      }
    })
    claiming = true
    prepared.commit()
    claiming = false
    check(
      pendingClaims.size === 0 && hookCalls === 19,
      'Root-scoped native claims did not match the validated plan',
    )

    const width = Utils.layout.toDevicePixels(nativeHost.bounds.size.width),
      height = Utils.layout.toDevicePixels(nativeHost.bounds.size.height),
      left = Utils.layout.toDevicePixels(nativeHost.frame.origin.x),
      top = Utils.layout.toDevicePixels(nativeHost.frame.origin.y)
    function layout() {
      host.measure(
        Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY),
        Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY),
      )
      host.layout(left, top, left + width, top + height)
    }
    function identities() {
      check(
        host.getChildrenCount() === 1 && host.getChildAt(0) === wrappers[0],
        'Wrong adopted logical root',
      )
      wrappers.forEach((view, index) => {
        const parent = resolved.nodes[index].parent
        check(
          view.parent === (parent === null ? host : wrappers[parent]) && view.isLoaded,
          'Lost logical parent/loaded lifecycle',
        )
        check(
          view.nativeViewProtected === nativeViews[index] &&
            nativeViews[index].superview === oldParents[index],
          'Native handle or parent changed',
        )
        check(
          NSCMason.shared.nodeForView(
            nativeViews[index],
            resolved.nodes[index].kind === 'label',
          ) === oldNodes[index],
          'Mason Node identity changed',
        )
        if (resolved.nodes[index].kind === 'masonview')
          check(
            view.getChildrenCount() === resolved.nodes[index].children.length &&
              resolved.nodes[index].children.every(
                (child, slot) => view.getChildAt(slot) === wrappers[child],
              ),
            'Logical child order changed',
          )
      })
    }
    layout()
    identities()
    const geometryDifferences = []
    nativeViews.forEach((view, index) => {
      const actual = {
        x: view.frame.origin.x,
        y: view.frame.origin.y,
        width: view.frame.size.width,
        height: view.frame.size.height,
      }
      for (const key of Object.keys(actual))
        if (Math.abs(actual[key] - oldFrames[index][key]) > 0.5)
          geometryDifferences.push({
            index,
            key,
            before: oldFrames[index][key],
            after: actual[key],
          })
    })
    writeProbeDiagnostic(
      'entry-details.json',
      JSON.stringify({ passed: false, phase: 'committed', geometryDifferences, claimed: 19 }),
    )
    check(geometryDifferences.length === 0, 'Home adoption changed initial geometry')

    function equivalent(a, b) {
      if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.00001
      if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b
      const keys = Object.keys(a)
      return (
        keys.length === Object.keys(b).length && keys.every((key) => equivalent(a[key], b[key]))
      )
    }
    const paintDifferences = []
    function paint(native, index) {
      const style = NSCMason.shared.styleForView(native)
      const value = {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        cornerShape: style.cornerShape,
      }
      const layout = native.valueForKey('prerenderLayoutValues')
      value.layoutValues = JSON.parse(
        String(
          NSString.alloc().initWithDataEncoding(
            NSJSONSerialization.dataWithJSONObjectOptionsError(layout, 0, null),
            4,
          ),
        ),
      )
      const radii = native.valueForKey('prerenderEffectiveRadii')
      value.effectiveRadii = Array.from({ length: radii.count }, (_, index) =>
        Number(radii.objectAtIndex(index)),
      )
      if (resolved.nodes[index].kind === 'label') {
        const r = new interop.Reference(),
          g = new interop.Reference(),
          b = new interop.Reference(),
          a = new interop.Reference()
        check(native.textColor.getRedGreenBlueAlpha(r, g, b, a), 'Live text color did not resolve')
        value.textColor = [r.value, g.value, b.value, a.value]
        const attributed = native.attributedText?.length
          ? native.attributedText.attributeAtIndexEffectiveRange(NSFontAttributeName, 0, null)
          : null
        const font = attributed instanceof UIFont ? attributed : native.font
        value.font = Object.fromEntries(
          [
            'fontName',
            'pointSize',
            'ascender',
            'descender',
            'lineHeight',
            'leading',
            'capHeight',
            'xHeight',
          ].map((key) => [key, font[key]]),
        )
      }
      return value
    }
    nativeViews.forEach((native, index) => {
      const before = nativeSnapshot.rows[index].paint,
        after = paint(native, index)
      for (const key of ['backgroundColor'])
        if (before[key] !== after[key])
          paintDifferences.push({ index, key, before: before[key], after: after[key] })
      for (const key of Object.keys(before.layoutValues))
        if (!equivalent(before.layoutValues[key], after.layoutValues[key]))
          paintDifferences.push({
            index,
            key: 'layout.' + key,
            before: before.layoutValues[key],
            after: after.layoutValues[key],
          })
      for (let channel = 0; channel < 20; channel++)
        if (Math.abs(before.effectiveRadii[channel] - after.effectiveRadii[channel]) > 0.00001)
          paintDifferences.push({
            index,
            key: 'effectiveRadii',
            channel,
            before: before.effectiveRadii[channel],
            after: after.effectiveRadii[channel],
          })
      if (before.textColor)
        for (let channel = 0; channel < 4; channel++)
          if (Math.abs(before.textColor[channel] - after.textColor[channel]) > 0.00001)
            paintDifferences.push({
              index,
              key: 'textColor',
              channel,
              before: before.textColor[channel],
              after: after.textColor[channel],
            })
      if (before.font)
        for (const key of Object.keys(before.font))
          if (
            typeof before.font[key] === 'number'
              ? Math.abs(before.font[key] - after.font[key]) > 0.0001
              : before.font[key] !== after.font[key]
          )
            paintDifferences.push({
              index,
              key: 'font.' + key,
              before: before.font[key],
              after: after.font[key],
            })
    })
    writeProbeDiagnostic(
      'entry-details.json',
      JSON.stringify({
        passed: false,
        phase: 'native-paint-comparison',
        geometryDifferences,
        paintDifferences,
        scheme,
      }),
    )
    check(
      paintDifferences.length === 0,
      'Home native paint/font properties differ after CSS adoption',
    )

    const siblingHost = new View()
    siblingHost._setupAsRootView({})
    siblingHost.className = host.className
    siblingHost.css = host.css
    siblingHost.callLoaded()
    const siblingRoot = createNativeScriptRoot(siblingHost)
    const siblingPrepared = siblingRoot.prepare(Home, { name: 'Blair', initialCompleted: 7 })
    check(siblingPrepared.status === 'prepared', 'Ordinary sibling Home suspended')
    siblingPrepared.commit()
    const siblingViews = []
    function collectSibling(view) {
      siblingViews.push(view)
      if (view instanceof View)
        for (let index = 0; index < view.getChildrenCount(); index++)
          collectSibling(view.getChildAt(index))
    }
    collectSibling(siblingHost.getChildAt(0))
    check(
      siblingViews.length === 19 && hookCalls === 19,
      'Unrelated root used the first-screen factory',
    )
    check(
      siblingViews.every((view) => !nativeViews.includes(view.nativeViewProtected)),
      'Unrelated root reused first-screen native views',
    )
    const siblingCompleted = siblingViews.find((view) => view.id === 'home-completed')
    check(
      siblingCompleted.text === '7' &&
        siblingViews.find((view) => view.id === 'home-greeting').text === 'Welcome back, Blair',
      'Ordinary sibling initial state differs',
    )
    let fallbackCalls = 0
    const fallbackHost = new View()
    fallbackHost._setupAsRootView({})
    fallbackHost.callLoaded()
    const fallbackRoot = createNativeScriptRoot(fallbackHost, {
      createView() {
        fallbackCalls++
        return undefined
      },
    })
    const fallbackAborted = fallbackRoot.prepare(Home, { name: 'Casey', initialCompleted: 9 })
    check(fallbackAborted.status === 'prepared', 'Fallback prepare suspended')
    fallbackAborted.abort()
    check(fallbackCalls === 0, 'Factory ran during aborted preparation')
    const fallbackPrepared = fallbackRoot.prepare(Home, { name: 'Casey', initialCompleted: 9 })
    check(fallbackPrepared.status === 'prepared', 'Fallback render suspended')
    fallbackPrepared.commit()
    check(
      fallbackCalls === 19 && hookCalls === 19,
      'Per-root undefined fallback changed another root factory',
    )
    function rejectedFactory(factory, message) {
      const rejectedHost = new View()
      rejectedHost._setupAsRootView({})
      rejectedHost.callLoaded()
      const rejectedRoot = createNativeScriptRoot(rejectedHost, { createView: factory })
      const attempt = rejectedRoot.prepare(Home, resolved.seed)
      check(attempt.status === 'prepared', 'Rejection test prepare suspended')
      let failure = null
      try {
        attempt.commit()
      } catch (error) {
        failure = error
      }
      check(String(failure).includes(message), 'Factory rejection differs: ' + String(failure))
      check(
        rejectedHost.getChildrenCount() === 0 &&
          rejectedHost.nativeViewProtected.subviews.count === 0,
        'Rejected factory attached native children',
      )
      rejectedRoot.unmount()
      identities()
    }
    rejectedFactory(() => ({}), 'must return a ViewBase or undefined')
    rejectedFactory(() => wrappers[2], 'owned by a live host node')
    const find = (id) => wrappers[resolved.nodes.findIndex((node) => node.props.id === id)]
    function activate(view) {
      const observers = view.getGestureObservers(GestureTypes.tap)
      check(observers?.length > 0, 'Shared Button has no semantic tap listener')
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
    function guard(callback) {
      try {
        callback()
      } catch (error) {
        writeProbeDiagnostic('entry-error.txt', String(error.stack ?? error))
        throw error
      }
    }
    setTimeout(
      () =>
        guard(() => {
          activate(find('home-complete'))
          setTimeout(
            () =>
              guard(() => {
                check(
                  find('home-completed').text === '4' &&
                    find('home-status').text === 'One more step completed.',
                  'Shared Button/state did not update adopted Home',
                )
                identities()
                check(
                  siblingCompleted.text === '7' && hookCalls === 19,
                  'First-screen update affected the sibling root',
                )
                activate(find('home-reset'))
                setTimeout(
                  () =>
                    guard(() => {
                      check(
                        find('home-completed').text === '3' &&
                          find('home-status').text === 'Ready when you are.',
                        'Shared reset Button did not restore state',
                      )
                      identities()
                      layout()
                      host.css = ''
                      siblingHost.css = ''
                      host.className = ''
                      siblingHost.className = ''
                      setTimeout(
                        () =>
                          guard(() => {
                            const removals = []
                            nativeViews.forEach((native, index) => {
                              const adopted = paint(native, index),
                                ordinary = paint(siblingViews[index].nativeViewProtected, index)
                              for (const key of ['backgroundColor'])
                                if (adopted[key] !== ordinary[key])
                                  removals.push({
                                    index,
                                    key,
                                    adopted: adopted[key],
                                    ordinary: ordinary[key],
                                  })
                              for (const key of Object.keys(adopted.layoutValues))
                                if (
                                  !equivalent(adopted.layoutValues[key], ordinary.layoutValues[key])
                                )
                                  removals.push({
                                    index,
                                    key: 'layout.' + key,
                                    adopted: adopted.layoutValues[key],
                                    ordinary: ordinary.layoutValues[key],
                                  })
                              for (let channel = 0; channel < 20; channel++)
                                if (
                                  Math.abs(
                                    adopted.effectiveRadii[channel] -
                                      ordinary.effectiveRadii[channel],
                                  ) > 0.00001
                                )
                                  removals.push({
                                    index,
                                    key: 'effectiveRadii',
                                    channel,
                                    adopted: adopted.effectiveRadii[channel],
                                    ordinary: ordinary.effectiveRadii[channel],
                                  })
                              if (adopted.textColor)
                                for (let channel = 0; channel < 4; channel++)
                                  if (
                                    Math.abs(
                                      adopted.textColor[channel] - ordinary.textColor[channel],
                                    ) > 0.00001
                                  )
                                    removals.push({
                                      index,
                                      key: 'textColor',
                                      channel,
                                      adopted: adopted.textColor[channel],
                                      ordinary: ordinary.textColor[channel],
                                    })
                              if (adopted.font)
                                for (const key of Object.keys(adopted.font))
                                  if (
                                    typeof adopted.font[key] === 'number'
                                      ? Math.abs(adopted.font[key] - ordinary.font[key]) > 0.0001
                                      : adopted.font[key] !== ordinary.font[key]
                                  )
                                    removals.push({
                                      index,
                                      key: 'font.' + key,
                                      adopted: adopted.font[key],
                                      ordinary: ordinary.font[key],
                                    })
                            })
                            writeProbeDiagnostic(
                              'entry-details.json',
                              JSON.stringify({
                                passed: false,
                                phase: 'clear-home-css',
                                removals,
                                scheme,
                              }),
                            )
                            check(
                              removals.length === 0,
                              'Adopted Home restored startup styles as defaults: ' +
                                JSON.stringify(removals),
                            )
                            identities()
                            siblingRoot.unmount()
                            fallbackRoot.unmount()
                            setTimeout(
                              () =>
                                guard(() => {
                                  check(
                                    siblingHost.getChildrenCount() === 0 &&
                                      siblingHost.nativeViewProtected.subviews.count === 0,
                                    'Sibling root retained mounted children',
                                  )
                                  check(
                                    siblingViews.every((view) => !view.isLoaded),
                                    'Sibling root retained loaded lifecycle',
                                  )
                                  check(
                                    siblingViews
                                      .filter(
                                        (view) =>
                                          view.id === 'home-complete' || view.id === 'home-reset',
                                      )
                                      .every(
                                        (view) =>
                                          (view.getGestureObservers(GestureTypes.tap)?.length ??
                                            0) === 0,
                                      ),
                                    'Sibling root retained shared Button tap observers',
                                  )
                                  check(
                                    fallbackHost.getChildrenCount() === 0 &&
                                      fallbackHost.nativeViewProtected.subviews.count === 0,
                                    'Fallback root retained mounted children',
                                  )
                                  identities()
                                  check(
                                    hookCalls === 19 && fallbackCalls === 19,
                                    'Sibling disposal invoked another root factory',
                                  )
                                  writeProbeDiagnostic(
                                    'entry-details.json',
                                    JSON.stringify({
                                      passed: true,
                                      kind: 'actual-shared-home-native-adoption',
                                      visualNodes: 19,
                                      logicalNodes: 27,
                                      sameNativeViews: true,
                                      sameMasonNodes: true,
                                      initialGeometryPreserved: true,
                                      nativePaintParity: true,
                                      scheme,
                                      rootScopedClaims: true,
                                      siblingRootIsolation: true,
                                      ordinarySiblingDisposal: true,
                                      homeCssRemovalParity: true,
                                      nativeDefaultJournal: true,
                                      undefinedFactoryFallback: true,
                                      invalidFactoryRejected: true,
                                      liveOwnershipRejected: true,
                                      sharedButtonUpdates: true,
                                      sharedResetUpdates: true,
                                      osInputQualified: false,
                                      styleRemovalQualified: false,
                                      pageIntegrationQualified: true,
                                      presentations,
                                      rootSetups,
                                      presentationQualified: false,
                                    }),
                                  )
                                }),
                              0,
                            )
                          }),
                        0,
                      )
                    }),
                  0,
                )
              }),
            0,
          )
        }),
      0,
    )
    globalThis.__sharedHomeAdoption = { root, host, wrappers, nativeViews, page, embedder }
  } catch (error) {
    writeProbeDiagnostic('entry-error.txt', String(error.stack ?? error))
    throw error
  }
}
setTimeout(accept, 0)
