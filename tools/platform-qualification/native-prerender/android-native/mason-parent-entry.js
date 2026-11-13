import '@nativescript/core/globals'
import { Label } from '@nativescript/core/ui/label'
import { Application } from '@nativescript/core/application'
import { setActivityCallbacks } from '@nativescript/core/ui/frame'
import { View } from 'xplat-prerender:mason/view'
import { native_ } from 'xplat-prerender:mason/symbols'

let root
let labels = []
const check = (value, message) => {
  if (!value) throw new Error(message)
}
let windowSession
const lifecycle = {
  ready: 0,
  opened: 0,
  attached: 0,
  detached: 0,
  created: 0,
  destroyed: 0,
  started: 0,
  resumed: 0,
}
if (XPLAT_PRERENDER_APPLICATION) {
  Application.on(Application.readyEvent, () => lifecycle.ready++)
  Application.on(Application.windowOpenEvent, ({ window }) => {
    lifecycle.opened++
    check(!windowSession, 'Unexpected second window session')
    windowSession = window
    for (const [event, key] of [
      ['attached', 'attached'],
      ['detached', 'detached'],
      ['activityCreated', 'created'],
      ['activityDestroyed', 'destroyed'],
      ['activityStarted', 'started'],
      ['activityResumed', 'resumed'],
    ])
      window.on(event, () => lifecycle[key]++)
  })
  Application.run()
}
// Native super methods have already executed in this split native/JS host.
const nativeSuperCompleted = () => {}
function prepareApplication(activity) {
  activity.enableApplicationHandoff()
  let window = Application.android._getWindowForActivity(activity)
  if (!window) {
    check(!activity.isWarmActivity(), 'Warm Activity missed ordinary Core lifecycle registration')
    const callbacks = Application.android.lifecycleCallbacks
    check(callbacks, 'Core application lifecycle callbacks unavailable')
    // Catch up only Core's own observer for the existing cold Activity. Never
    // broadcast old events to arbitrary plugin/application callbacks.
    callbacks.onActivityCreated(activity, activity.getLaunchState())
    if (activity.hasStarted()) callbacks.onActivityStarted(activity)
    if (activity.hasPostResumed()) callbacks.onActivityResumed(activity)
    window = Application.android._getWindowForActivity(activity)
  }
  check(
    window && window === windowSession && window === Application.primaryWindow,
    'Primary window session differs',
  )
  setActivityCallbacks(activity)
  return window
}
org.octanexplat.prerenderandroid.ProbeApplication.installBridge(
  new org.octanexplat.prerenderandroid.ProbeBridge({
    onActivity(activity) {
      try {
        check(!root && labels.length === 0, 'Old logical root retained')
        const window = XPLAT_PRERENDER_APPLICATION ? prepareApplication(activity) : undefined
        root = new View()
        root[native_] = activity.getMasonHost()
        const originalViews = [activity.getFirstLabel(), activity.getSecondLabel()]
        check(
          root[native_].getChildCount() === originalViews.length &&
            originalViews.every((view, index) => root[native_].getChildAt(index) === view),
          'Native adoption topology differs',
        )
        if (XPLAT_PRERENDER_ADOPT_PARENT) {
          const attach = root._addViewToNativeVisualTree
          root._addViewToNativeVisualTree = function (child, atIndex = -1) {
            const native = child.nativeViewProtected
            if (native && native.getParent() === this._view) {
              const { nativeIndex } = this._nativeAttachIndex(child, atIndex)
              check(
                this._view.getChildAt(nativeIndex) === native,
                'Existing native child order differs',
              )
              child._hasNativeView = true
              child._isMasonChild = true
              this._masonAdoptForeign(child)
              return true
            }
            return attach.call(this, child, atIndex)
          }
        }
        labels = originalViews.map((native) => {
          const wrapper = new Label()
          wrapper.createNativeView = () => native
          wrapper.text = String(native.getText())
          wrapper.fontSize = 18
          root.addChild(wrapper)
          return wrapper
        })
        root._setupAsRootView(activity)
        root.callLoaded()
        check(root.nativeViewProtected === activity.getMasonHost(), 'Mason root replaced')
        check(
          labels.every(
            (label) => label.parent === root && label.isLoaded && label._context === activity,
          ),
          'Logical parent/load missing',
        )
        activity.verifyOriginalTree(false, 0, 0)
        root.removeChild(labels[0])
        root.addChild(labels[0])
        activity.verifyOriginalTree(true, 1, 1)
        root.removeChild(labels[1])
        root.addChild(labels[1])
        activity.verifyOriginalTree(false, 2, 2)
        const extra = new Label()
        extra.text = 'Ordinary post-adoption insertion'
        root.addChild(extra)
        check(
          extra.nativeViewProtected && extra.parent === root && extra.isLoaded,
          'Ordinary new child did not attach',
        )
        root.removeChild(extra)
        check(
          !extra.nativeViewProtected && !extra.parent && !extra.isLoaded,
          'Ordinary new child did not detach',
        )
        activity.verifyOriginalTree(false, 3, 3)
        labels[0].text = 'Updated through NativeScript bridge'
        if (window) {
          // Use Android's real platform content pipeline. Generic setContent
          // first sets the root up with {}, which tears down this Android
          // context. This pipeline sets up with the Activity and adopts the
          // root into NativeWindow itself. The native host keeps its view.
          activity._callbacks.resetActivityContent(activity, root)
          if (activity.hasStarted()) activity._callbacks.onStart(activity, nativeSuperCompleted)
          if (activity.hasPostResumed())
            activity._callbacks.onPostResume(activity, nativeSuperCompleted)
          check(
            Application.getRootView() === root &&
              window.rootView === root &&
              root.getNativeWindow() === window,
            'Application/window/root ownership differs',
          )
          check(
            Application.android._getWindows().length === 1 &&
              lifecycle.ready === 1 &&
              lifecycle.opened === 1,
            'Application/window initialized more than once',
          )
          activity.verifyOriginalTree(false, 3, 3)
          activity.recordWrapperProof(
            JSON.stringify({
              phase: 'application',
              windowId: window.id,
              state: window.state,
              active: Application.activeWindow === window,
              foregroundActivity: Application.android.foregroundActivity === activity,
              sameRoot: true,
              registrySize: Application.android._getWindows().length,
              lifecycle: { ...lifecycle },
              catchUp: !activity.isWarmActivity(),
            }),
          )
        }
        activity.recordWrapperProof(
          JSON.stringify({
            phase: 'adopted',
            realLabelWrappers: 2,
            identitiesRetained: true,
            contextsEstablished: true,
            loaded: true,
            logicalMasonParent: true,
            matchedAttachmentOnly: XPLAT_PRERENDER_ADOPT_PARENT,
            mutationsVerified: true,
            adoptionPhysicalAttachments: 0,
            octaneQualified: false,
          }),
        )
        activity.markBridgeReady()
      } catch (error) {
        activity.recordWrapperProof(
          JSON.stringify({
            phase: 'failed',
            error: String(error) + '\n' + String(error.stack ?? ''),
          }),
        )
        throw error
      }
    },
    onDestroy(activity) {
      if (XPLAT_PRERENDER_APPLICATION) {
        check(!root.isLoaded, 'Core stop did not unload the root')
        activity._callbacks.onDestroy(activity, nativeSuperCompleted)
      } else {
        root.callUnloaded()
        root._tearDownUI(true)
      }
      activity.verifyEmptyTree()
      for (const label of labels) {
        check(
          !label.nativeViewProtected && !label._context && !label.isLoaded,
          'Old Label not disposed',
        )
        label.createNativeView = () => {
          throw new Error('Retired native claim')
        }
      }
      labels = []
      root = undefined
      activity.recordWrapperProof(
        JSON.stringify({
          phase: 'disposed',
          releasedWrappers: 2,
          nativeChildren: 0,
          masonChildren: 0,
        }),
      )
      activity.markBridgeDetached()
    },
    onHostLifecycle(activity, event) {
      const callbacks = activity._callbacks
      check(callbacks, 'Activity callback owner missing')
      if (event === 'start') callbacks.onStart(activity, nativeSuperCompleted)
      else if (event === 'stop') callbacks.onStop(activity, nativeSuperCompleted)
      else if (event === 'postResume') callbacks.onPostResume(activity, nativeSuperCompleted)
      else throw new Error('Unexpected native lifecycle event: ' + event)
    },
  }),
)
