import '@nativescript/core/globals'
import { Application, Utils } from '@nativescript/core'
import { Label } from '@nativescript/core/ui/label'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { native_, style_ } from '@octane-xplat/nativescript-mason-core/symbols'
import { createNativeScriptRoot, registerElement } from '@nativescript-community/octane'
import { Home } from '../Home.tsrx'
import { qualifyHomeParity, HomeLeaseRetired } from './home-parity.js'
import { captureMasonBaseline, qualifyRetiredHome } from './home-lifetime.js'
import { AdoptionMismatch, matchPreparedVisualTree } from '../match-tree.mjs'
import { renderFallbackHome } from './home-fallback.js'
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
const originalAttaches = new WeakMap()
function claimFactory(state) {
  // This closure captures no Activity or surrounding render activation.
  return (id, type) => {
    state.hookCalls++
    if (!state.claiming) return undefined
    const index = state.map.get(id)
    check(index !== undefined && resolved.nodes[index].kind === type, 'Home factory claim differs')
    state.map.delete(id)
    return state.wrappers[index]
  }
}
function releaseClaimTree(host, wrappers) {
  const owned = new Set([host, ...wrappers])
  for (const view of wrappers.slice().reverse()) {
    const parent = view.parent
    if (parent) {
      check(owned.has(parent) && parent instanceof View, 'Failed claim escaped its owner scope')
      if (parent.getChildIndex(view) >= 0) parent.removeChild(view)
      else parent._removeView(view)
    }
    if (view.isLoaded) view.callUnloaded()
    if (view._context) view._tearDownUI(true)
  }
}
function retireClaims(host, wrappers) {
  for (const wrapper of [host, ...wrappers]) {
    const attach = originalAttaches.get(wrapper)
    if (attach) wrapper._addViewToNativeVisualTree = attach
    originalAttaches.delete(wrapper)
    if (wrapper instanceof View) {
      wrapper[native_] = undefined
      wrapper[style_] = undefined
    } else
      wrapper.createNativeView = () => {
        throw new Error('Retired failed native claim')
      }
  }
}
let root, host, lease
org.octanexplat.prerenderandroid.HomeApplication.installBridge(
  new org.octanexplat.prerenderandroid.HomeBridge({
    onActivity(activity) {
      try {
        check(!root, 'Unexpected Home ownership/generation')
        const currentLease = { active: true, activity }
        lease = currentLease
        const liveSeed = XPLAT_PRERENDER_HOME_SEED_MISMATCH
          ? { ...resolved.seed, initialCompleted: resolved.seed.initialCompleted + 1 }
          : resolved.seed
        if (activity.isFallback()) {
          check(XPLAT_PRERENDER_HOME_APPLICATION, 'Home fallback requires Application integration')
          const ordinary = renderFallbackHome(activity, liveSeed)
          root = ordinary.root
          host = ordinary.host
          return
        }
        check(activity.getViewCount() === 19, 'Unexpected Home native count')
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
        currentLease.claims = { wrappers, natives, parents }
        let attachmentCalls = 0
        const injectedAttachmentFailure = new Error('Injected Android Home attachment failure')
        for (const wrapper of [host, ...wrappers.filter((view) => view instanceof View)]) {
          const attach = wrapper._addViewToNativeVisualTree
          originalAttaches.set(wrapper, attach)
          wrapper._addViewToNativeVisualTree = function (child, atIndex = -1) {
            if (XPLAT_PRERENDER_HOME_ATTACH_FAILURE && ++attachmentCalls === 17)
              throw injectedAttachmentFailure
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
        const claimState = { claiming: false, hookCalls: 0, map: new Map(), wrappers }
        currentLease.claims.state = claimState
        root = createNativeScriptRoot(host, {
          createView: claimFactory(claimState),
        })
        const aborted = root.prepare(Home, resolved.seed)
        check(aborted.status === 'prepared', 'Aborted Home prepare suspended')
        aborted.abort()
        check(
          claimState.hookCalls === 0 &&
            host.getChildrenCount() === 0 &&
            wrappers.every((view) => !view.parent),
          'Prepare/abort claimed Home wrappers',
        )
        check(
          natives.every((native, index) => native.getParent() === parents[index]),
          'Prepare/abort changed native Home',
        )
        const prepared = root.prepare(Home, liveSeed)
        check(prepared.status === 'prepared', 'Home prepare suspended')
        let matched
        try {
          matched = matchPreparedVisualTree(prepared.batch.commands, resolved.nodes, 27)
        } catch (error) {
          if (!(error instanceof AdoptionMismatch) || !window) throw error
          prepared.abort()
          check(
            claimState.hookCalls === 0 &&
              claimState.map.size === 0 &&
              !host._context &&
              wrappers.every((view) => !view.parent && !view._context),
            'Unmatched Home already consumed native claims',
          )
          activity.recordHomeProof(
            JSON.stringify({
              phase: 'plan-rejected',
              reason: String(error),
              hookCalls: claimState.hookCalls,
              preparedAborted: true,
              wrappersUnattached: true,
            }),
          )
          retireClaims(host, wrappers)
          const discarded = root
          activity.abandonUnclaimedHome(String(error))
          const ordinary = renderFallbackHome(activity, liveSeed, window)
          root = ordinary.root
          host = ordinary.host
          Promise.resolve(discarded.unmount())
            .then(() => {
              check(claimState.hookCalls === 0, 'Unmatched plan consumed late native claims')
              activity.recordHomeProof(
                JSON.stringify({ phase: 'unmatched-disposed', hookCalls: claimState.hookCalls }),
              )
            })
            .catch((error) =>
              activity.recordHomeProof(JSON.stringify({ phase: 'failed', error: String(error) })),
            )
          return
        }
        for (const [id, index] of matched) claimState.map.set(id, index)
        check(claimState.map.size === 19, 'Home plan did not match all native records')
        host._setupAsRootView(activity)
        host.callLoaded()
        activity.restoreHomeDefaults()
        claimState.claiming = true
        try {
          prepared.commit()
        } catch (error) {
          if (error !== injectedAttachmentFailure || !window) throw error
          claimState.claiming = false
          const setupWrappers = wrappers.filter((view) => view._context === activity).length
          check(
            claimState.hookCalls === 19 && attachmentCalls === 17 && setupWrappers > 0,
            'Injected failure did not reach partially established native ownership',
          )
          activity.recordHomeProof(
            JSON.stringify({
              phase: 'claim-failure',
              hookCalls: claimState.hookCalls,
              attachmentCalls,
              setupWrappers,
              injectedFailureObserved: true,
            }),
          )
          root.unmount()
          if (host.isLoaded) host.callUnloaded()
          if (host._context) host._tearDownUI(true)
          const residual = wrappers.map((view, index) => ({
            index,
            context: Boolean(view._context),
            native: Boolean(view.nativeViewProtected),
            loaded: view.isLoaded,
            parent: Boolean(view.parent),
          }))
          activity.recordHomeProof(JSON.stringify({ phase: 'claim-cleanup-observation', residual }))
          // Mason can remove a failed insertion from its child list while Core
          // still retains parent/context. Only this failed scope owns these
          // wrappers; use Core's removal seam for an unlisted child.
          releaseClaimTree(host, wrappers)
          retireClaims(host, wrappers)
          check(
            host.getChildrenCount() === 0 &&
              !host._context &&
              !host.nativeViewProtected &&
              wrappers.every(
                (view) =>
                  !view.parent && !view._context && !view.nativeViewProtected && !view.isLoaded,
              ),
            'Failed Home retained native handles, contexts or loading',
          )
          activity.abandonFailedHome(String(error))
          activity.recordHomeProof(
            JSON.stringify({
              phase: 'failed-adoption-disposed',
              releasedWrappers: wrappers.length,
              hookCalls: claimState.hookCalls,
              contextsCleared: true,
              handlesCleared: true,
              parentsCleared: true,
            }),
          )
          const ordinary = renderFallbackHome(activity, liveSeed, window)
          root = ordinary.root
          host = ordinary.host
          return
        } finally {
          claimState.claiming = false
        }
        check(
          claimState.map.size === 0 && claimState.hookCalls === 19,
          'Home claims not consumed exactly once',
        )
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
            masonStats: XPLAT_PRERENDER_HOME_LIFETIME ? captureMasonBaseline(activity) : undefined,
            visualOwners: 19,
            logicalNodesMatched: 27,
            hookCalls: claimState.hookCalls,
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
          qualifyHomeParity(activity, host, () => claimState.hookCalls, currentLease)
            .then(() => {
              if (XPLAT_PRERENDER_HOME_LIFETIME) return qualifyRetiredHome(activity, currentLease)
            })
            .catch((error) => {
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
      const retiringClaims = lease.claims
      lease.active = false
      lease = undefined
      const retiringRoot = root,
        retiringHost = host
      root = undefined
      host = undefined
      if (XPLAT_PRERENDER_HOME_APPLICATION) destroyHomeApplication(activity, retiringHost)
      Promise.resolve(retiringRoot?.unmount())
        .then(() => {
          if (retiringHost?.isLoaded) retiringHost.callUnloaded()
          if (retiringHost?._context) retiringHost._tearDownUI(true)
          if (retiringClaims) {
            const released = retiringClaims.wrappers.length
            releaseClaimTree(retiringHost, retiringClaims.wrappers)
            retireClaims(retiringHost, retiringClaims.wrappers)
            check(
              retiringClaims.wrappers.every(
                (view) =>
                  !view.parent && !view._context && !view.nativeViewProtected && !view.isLoaded,
              ),
              'Retired Home claim owners remain active',
            )
            // A disposed root's captured factory scope may outlive unmount. Drop
            // its explicit native/parent arrays as well as wrapper native caches.
            retiringClaims.natives.length = 0
            retiringClaims.parents.length = 0
            retiringClaims.wrappers.length = 0
            retiringClaims.state.claiming = false
            retiringClaims.state.map.clear()
            activity.recordHomeProof(
              JSON.stringify({
                phase: 'claims-retired',
                releasedWrappers: released,
                nativeArraysCleared: true,
                wrapperHandlesCleared: true,
              }),
            )
          }
        })
        .catch((error) => {
          activity.recordHomeProof(JSON.stringify({ phase: 'failed', error: String(error) }))
        })
    },
    onHostLifecycle(activity, event) {
      check(XPLAT_PRERENDER_HOME_APPLICATION, 'Unexpected Home lifecycle bridge')
      forwardHomeLifecycle(activity, event)
    },
  }),
)
