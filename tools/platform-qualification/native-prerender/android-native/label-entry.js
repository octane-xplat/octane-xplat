import '@nativescript/core/globals'
import { Label } from '@nativescript/core/ui/label'

// This isolated check adopts real Label wrappers only. The native Activity
// still owns the Mason parent; no Octane or Core Application handoff is implied.
let wrappers = []
const check = (value, message) => {
  if (!value) throw new Error(message)
}
org.octanexplat.prerenderandroid.ProbeApplication.installBridge(
  new org.octanexplat.prerenderandroid.ProbeBridge({
    onActivity(activity) {
      check(wrappers.length === 0, 'Old Activity wrappers still retained')
      const native = [activity.getFirstLabel(), activity.getSecondLabel()]
      wrappers = native.map((view) => {
        const wrapper = new Label()
        // Claim at the ordinary setup boundary so Core establishes the Android
        // context before initNativeView. Do not call setNativeView eagerly.
        wrapper.createNativeView = () => view
        wrapper.text = String(view.getText())
        wrapper.fontSize = 18
        wrapper._setupUI(activity)
        wrapper.callLoaded()
        check(wrapper.nativeViewProtected === view, 'Label allocated a replacement widget')
        check(wrapper._context === activity && wrapper.isLoaded, 'Label setup incomplete')
        return wrapper
      })
      wrappers[0].text = 'Updated through NativeScript bridge'
      check(String(native[0].getText()) === wrappers[0].text, 'Wrapper text update missing')
      activity.recordWrapperProof(
        JSON.stringify({
          phase: 'adopted',
          realLabelWrappers: wrappers.length,
          identitiesRetained: true,
          contextsEstablished: true,
          loaded: true,
          ordinaryApplicationQualified: false,
          logicalParentQualified: false,
        }),
      )
      activity.markBridgeReady()
    },
    onDestroy(activity) {
      for (const wrapper of wrappers) {
        wrapper.callUnloaded()
        wrapper._tearDownUI(true)
        check(
          !wrapper.nativeViewProtected && !wrapper._context && !wrapper.isLoaded,
          'Destroyed Activity wrapper remains attached',
        )
        // Retire the claim closure as well as Core's native handle.
        wrapper.createNativeView = () => {
          throw new Error('Retired native claim')
        }
      }
      const count = wrappers.length
      wrappers = []
      activity.recordWrapperProof(JSON.stringify({ phase: 'disposed', releasedWrappers: count }))
      activity.markBridgeDetached()
    },
  }),
)
