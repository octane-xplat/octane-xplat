import { Utils } from '@nativescript/core'
import { HomeLeaseRetired } from './home-parity.js'

let baseline
export function captureMasonBaseline(activity) {
  const stats = JSON.parse(String(activity.snapshotMasonStats()))
  if (
    !Number.isSafeInteger(stats.liveNodes) ||
    !Number.isSafeInteger(stats.trackedNodes) ||
    stats.liveNodes < 20 ||
    stats.trackedNodes < 20
  )
    throw new Error('Invalid Mason node baseline: ' + JSON.stringify(stats))
  baseline ??= stats
  return stats
}

/** Observe Java objects and live-node counters, not overall native bytes. */
export async function qualifyRetiredHome(activity, lease) {
  const expected = XPLAT_PRERENDER_HOME_RECREATE_COUNT
  const samples = []
  for (let attempt = 1; attempt <= 8; attempt++) {
    if (!lease.active) throw new HomeLeaseRetired()
    Utils.GC()
    java.lang.System.gc()
    await new Promise((done) => setTimeout(done, 50))
    if (!lease.active) throw new HomeLeaseRetired()
    const sample = JSON.parse(String(activity.snapshotRetiredHome()))
    const stats = JSON.parse(String(activity.snapshotMasonStats()))
    samples.push({ ...sample, masonStats: stats })
    if (
      sample.retiredGenerations !== expected ||
      sample.observedViews !== 19 * expected ||
      sample.observedNodes !== 19 * expected
    )
      throw new Error('Retired Home lifetime baseline differs: ' + JSON.stringify(sample))
    if (
      sample.aliveViews.length === 0 &&
      sample.aliveNodes.length === 0 &&
      baseline &&
      Number.isSafeInteger(stats.liveNodes) &&
      stats.liveNodes >= 20 &&
      stats.liveNodes <= baseline.liveNodes &&
      Number.isSafeInteger(stats.trackedNodes) &&
      stats.trackedNodes >= 20 &&
      stats.trackedNodes <= baseline.trackedNodes
    ) {
      activity.recordHomeProof(
        JSON.stringify({
          phase: 'retired-lifetime',
          attempts: attempt,
          ...sample,
          javaObjectsCollected: true,
          masonBaseline: baseline,
          masonStats: stats,
          nativeLiveNodesReturned: true,
          nativeDeallocationQualified: false,
        }),
      )
      return
    }
  }
  throw new Error(
    'Retired Home objects or Mason node counts remained after bounded GC: ' +
      JSON.stringify({ baseline, samples }),
  )
}
