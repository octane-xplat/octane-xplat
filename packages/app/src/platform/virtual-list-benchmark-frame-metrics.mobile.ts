import { Application } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'

/** Android window frame metrics report UI work, independent of snapshot timers. */
export function observeAndroidFrames() {
  const activity = Application.android?.foregroundActivity
  const nativeWindow = activity?.getWindow?.()
  const supported = nativeWindow && android.os.Build.VERSION.SDK_INT >= 24
  const rate = supported
    ? Number(activity.getWindowManager().getDefaultDisplay().getRefreshRate())
    : 0

  const budgetMs = rate > 0 ? 1000 / rate : 0
  const totals: number[] = []
  const layouts: number[] = []
  const draws: number[] = []
  let droppedReports = 0
  const summarize = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const percentile = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0

    return {
      samples: sorted.length,
      p50: percentile(0.5),
      p95: percentile(0.95),
      max: sorted.at(-1) ?? 0,
    }
  }

  const listener = supported
    ? new android.view.Window.OnFrameMetricsAvailableListener({
        onFrameMetricsAvailable(_window: any, metrics: any, dropped: number) {
          // Startup frames are outside the scrolling comparison.
          if (metrics.getMetric(android.view.FrameMetrics.FIRST_DRAW_FRAME) !== 0) {
            return
          }

          totals.push(metrics.getMetric(android.view.FrameMetrics.TOTAL_DURATION) / 1e6)
          layouts.push(metrics.getMetric(android.view.FrameMetrics.LAYOUT_MEASURE_DURATION) / 1e6)
          draws.push(metrics.getMetric(android.view.FrameMetrics.DRAW_DURATION) / 1e6)
          droppedReports += dropped
        },
      })
    : null

  if (listener) {
    nativeWindow.addOnFrameMetricsAvailableListener(
      listener,
      new android.os.Handler(android.os.Looper.getMainLooper()),
    )
  }

  return {
    dispose: () => {
      if (listener) {
        nativeWindow.removeOnFrameMetricsAvailableListener(listener)
      }
    },
    result: () =>
      listener
        ? {
            status: 'collected',
            source: 'Android Window.OnFrameMetricsAvailableListener',
            pollingIsFramePacing: false,
            measuresPresentation: false,
            refreshRateHz: rate,
            budgetMs,
            droppedReports,
            totalDurationMs: summarize(totals),
            layoutMeasureDurationMs: summarize(layouts),
            drawDurationMs: summarize(draws),
            overBudgetFrames: totals.filter((value) => value > budgetMs).length,
          }
        : { status: 'not-collected', pollingIsFramePacing: false },
  }
}
