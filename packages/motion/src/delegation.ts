import type { DelegatedRun } from './host-types'

// Probe-visible counters so retained probes can distinguish a real delegated
// run from a silent JS-engine fallback without widening the public API.
export function delegationStats() {
	const platform = globalThis as any
	return (platform.__xplatMotionDelegations ??= {
		started: 0,
		finished: 0,
		cancelled: 0,
		fallback: 0,
	})
}

/** Count a delegated run and fold its settled result into the counters. */
export function trackDelegatedRun(run: DelegatedRun): DelegatedRun {
	delegationStats().started++
	const finished = run.finished.then((result) => {
		if (result === 'finished') {
			delegationStats().finished++
		} else {
			delegationStats().cancelled++
		}

		return result
	})

	return { ...run, finished }
}
