import '@nativescript/core/globals'
import { Application, Utils } from '@nativescript/core'
import { Label } from '@nativescript/core/ui/label'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { native_ } from '@octane-xplat/nativescript-mason-core/symbols'
import { createNativeScriptRoot, registerElement } from '@nativescript-community/octane'
import { Home } from '../Home.tsrx'
import { qualifyHomeParity, HomeLeaseRetired } from './home-parity.js'
import { matchPreparedVisualTree } from '../match-tree.mjs'
import {
  prepareHomeApplication,
  acceptHomeApplication,
  destroyHomeApplication,
  forwardHomeLifecycle,
} from './home-application.js'
import resolved from 'xplat-prerender:artifact'
import sheets from 'xplat-prerender:styles'

const check = (value, message) => {
  if (!value) throw new Error(message)
}
registerElement('masonview', View)
let root, host, lease
org.octanexplat.prerenderandroid.HomeApplication.installBridge(
  new org.octanexplat.prerenderandroid.HomeBridge({
    onActivity(activity) {
      try {
        check(!root && activity.getViewCount() === 19, 'Unexpected Home ownership/generation')
        const currentLease = { active: true, activity }
        lease = currentLease
        // Public custom-Application initialization supplies Core's real app context
        // before shared render reads theme; Application/window handoff is later.
        if (!Application.android.nativeApp) Application.android.init(activity.getApplication())
        const window = XPLAT_PRERENDER_HOME_APPLICATION
          ? prepareHomeApplication(activity)
          : undefined
        const scheme = Application.systemAppearance() === 'dark' ? 'dark' : 'light'
        check(scheme === activity.getHomeTheme(), 'Native/live Home theme differs')
        const natives = resolved.nodes.map((_, index) => activity.getView(index))
        const parents = natives.map((native) => native.getParent())
        host = new View()
        host[native_] = activity.getViewport()
        host.width = '100%'
        host.height = '100%'
        host.style.display = 'flex'
        host.style.flexDirection = 'column'
        host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
        host.css = sheets.map((sheet) => sheet.css).join('\n')
        const wrappers = resolved.nodes.map((node, index) => {
          const wrapper = node.kind === 'label' ? new Label() : new View()
          if (wrapper instanceof View) wrapper[native_] = natives[index]
          else wrapper.createNativeView = () => natives[index]
          return wrapper
        })
        for (const wrapper of [host, ...wrappers.filter((view) => view instanceof View)]) {
          const attach = wrapper._addViewToNativeVisualTree
          wrapper._addViewToNativeVisualTree = function (child, atIndex = -1) {
            const native = child.nativeViewProtected
            if (native && native.getParent() === this._view) {
              const { nativeIndex } = this._nativeAttachIndex(child, atIndex)
              check(
                this._view.getChildAt(nativeIndex) === native,
                'Existing Home native child order differs',
              )
              child._hasNativeView = true
              child._isMasonChild = true
              this._masonAdoptForeign(child)
              return true
            }
            return attach.call(this, child, atIndex)
          }
        }
        let claiming = false,
          hookCalls = 0
        const claims = new Map()
        root = createNativeScriptRoot(host, {
          createView(id, type) {
            hookCalls++
            if (!claiming) return undefined
            const index = claims.get(id)
            check(
              index !== undefined && resolved.nodes[index].kind === type,
              'Home factory claim differs',
            )
            claims.delete(id)
            return wrappers[index]
          },
        })
        const aborted = root.prepare(Home, resolved.seed)
        check(aborted.status === 'prepared', 'Aborted Home prepare suspended')
        aborted.abort()
        check(
          hookCalls === 0 &&
            host.getChildrenCount() === 0 &&
            wrappers.every((view) => !view.parent),
          'Prepare/abort claimed Home wrappers',
        )
        check(
          natives.every((native, index) => native.getParent() === parents[index]),
          'Prepare/abort changed native Home',
        )
        const prepared = root.prepare(Home, resolved.seed)
        check(prepared.status === 'prepared', 'Home prepare suspended')
        for (const [id, index] of matchPreparedVisualTree(
          prepared.batch.commands,
          resolved.nodes,
          27,
        ))
          claims.set(id, index)
        check(claims.size === 19, 'Home plan did not match all native records')
        host._setupAsRootView(activity)
        host.callLoaded()
        activity.restoreHomeDefaults()
        claiming = true
        prepared.commit()
        claiming = false
        check(claims.size === 0 && hookCalls === 19, 'Home claims not consumed exactly once')
        const width = activity.getViewport().getWidth(),
          height = activity.getViewport().getHeight()
        const left = activity.getViewport().getLeft(),
          top = activity.getViewport().getTop()
        host.measure(
          Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY),
          Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY),
        )
        host.layout(left, top, left + width, top + height)
        check(
          host.getChildrenCount() === 1 && host.getChildAt(0) === wrappers[0],
          'Home logical root differs',
        )
        wrappers.forEach((view, index) => {
          const parent = resolved.nodes[index].parent
          check(
            view.parent === (parent === null ? host : wrappers[parent]) &&
              view.isLoaded &&
              view._context === activity,
            'Home wrapper parent/load/context differs',
          )
          check(
            view.nativeViewProtected === natives[index] &&
              natives[index].getParent() === parents[index],
            'Home native identity/parent differs',
          )
          const children = resolved.nodes[index].children
          if (view instanceof View)
            check(
              view.getChildrenCount() === children.length &&
                children.every((child, order) => view.getChildAt(order) === wrappers[child]),
              'Home logical child order differs',
            )
        })
        if (window) acceptHomeApplication(activity, host, window)
        activity.recordHomeProof(
          JSON.stringify({
            phase: 'adopted',
            visualOwners: 19,
            logicalNodesMatched: 27,
            hookCalls,
            prepareAbortMutationFree: true,
            identitiesRetained: true,
            logicalChildOrder: true,
            contextsEstablished: true,
            loaded: true,
            applicationHandoff: Boolean(window),
            styleParityQualified: false,
          }),
        )
        activity.markBridgeReady()
        if (XPLAT_PRERENDER_HOME_PARITY)
          qualifyHomeParity(activity, host, () => hookCalls, currentLease).catch((error) => {
            if (error instanceof HomeLeaseRetired) {
              check(!activity.isAlive(), 'Comparison lease retired while Activity remained alive')
              activity.recordHomeProof(
                JSON.stringify({ phase: 'parity-cancelled', reason: 'activity-destroyed' }),
              )
              return
            }
            activity.recordHomeProof(
              JSON.stringify({ phase: 'failed', error: String(error), stack: error?.stack }),
            )
          })
      } catch (error) {
        activity.recordHomeProof(
          JSON.stringify({ phase: 'failed', error: String(error), stack: error?.stack }),
        )
        throw error
      }
    },
    onDestroy(activity) {
      check(lease?.activity === activity, 'Home destruction owner differs')
      lease.active = false
      lease = undefined
      const retiringRoot = root,
        retiringHost = host
      root = undefined
      host = undefined
      if (XPLAT_PRERENDER_HOME_APPLICATION) destroyHomeApplication(activity, retiringHost)
      Promise.resolve(retiringRoot?.unmount()).then(() => {
        if (retiringHost?.isLoaded) retiringHost.callUnloaded()
        if (retiringHost?._context) retiringHost._tearDownUI(true)
      })
    },
    onHostLifecycle(activity, event) {
      check(XPLAT_PRERENDER_HOME_APPLICATION, 'Unexpected Home lifecycle bridge')
      forwardHomeLifecycle(activity, event)
    },
  }),
)
