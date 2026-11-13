import '@nativescript/core/globals'
import { Label } from '@nativescript/core/ui/label'
import { View } from 'xplat-prerender:mason/view'
import { native_ } from 'xplat-prerender:mason/symbols'

let root
let labels = []
const check = (value, message) => {
  if (!value) throw new Error(message)
}
org.octanexplat.prerenderandroid.ProbeApplication.installBridge(
  new org.octanexplat.prerenderandroid.ProbeBridge({
    onActivity(activity) {
      try {
        check(!root && labels.length === 0, 'Old logical root retained')
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
      root.callUnloaded()
      root._tearDownUI(true)
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
  }),
)
