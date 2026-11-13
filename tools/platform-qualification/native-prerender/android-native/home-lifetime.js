import { Utils } from '@nativescript/core'
import { HomeLeaseRetired } from './home-parity.js'

/** Observe Java objects only; this does not count Rust/native allocations. */
export async function qualifyRetiredHome(activity, lease) {
  const samples = []
  for (let attempt = 1; attempt <= 8; attempt++) {
    if (!lease.active) throw new HomeLeaseRetired()
    Utils.GC()
    java.lang.System.gc()
    await new Promise((done) => setTimeout(done, 50))
    if (!lease.active) throw new HomeLeaseRetired()
    const sample = JSON.parse(String(activity.snapshotRetiredHome()))
    samples.push(sample)
    if (
      sample.retiredGenerations !== 1 ||
      sample.observedViews !== 19 ||
      sample.observedNodes !== 19
    )
      throw new Error('Retired Home lifetime baseline differs: ' + JSON.stringify(sample))
    if (sample.aliveViews.length === 0 && sample.aliveNodes.length === 0) {
      activity.recordHomeProof(
        JSON.stringify({
          phase: 'retired-lifetime',
          attempts: attempt,
          ...sample,
          javaObjectsCollected: true,
          nativeDeallocationQualified: false,
        }),
      )
      return
    }
  }
  throw new Error('Retired Home Java objects remained after bounded GC: ' + JSON.stringify(samples))
}
