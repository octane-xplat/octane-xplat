// Native mounting/identity control. Core wrappers and Octane are a later phase.
org.octanexplat.prerenderandroid.HomeApplication.installBridge(
  new org.octanexplat.prerenderandroid.HomeBridge({
    onActivity(activity) {
      if (activity.getViewCount() !== 19) throw new Error('Expected actual shared Home')
      activity.markBridgeReady()
    },
    onDestroy() {},
  }),
)
