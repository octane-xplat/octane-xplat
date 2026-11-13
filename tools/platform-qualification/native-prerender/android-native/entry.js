// One process-level controller receives each actual Activity. It retains no
// Activity/Widget handles after a callback, including across recreation.
org.octanexplat.prerenderandroid.ProbeApplication.installBridge(
  new org.octanexplat.prerenderandroid.ProbeBridge({
    onActivity(activity) {
      activity.getFirstLabel().setText('Updated through NativeScript bridge')
      activity.markBridgeReady()
    },
    onDestroy(activity) {
      activity.markBridgeDetached()
    },
  }),
)
