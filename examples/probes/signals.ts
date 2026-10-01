import { createScope, runWithSignalOwner, signal$ } from 'octane/signals'
import type { ProbeContext } from '../../scripts/probe/context'

const value$ = signal$(1, { key: 'probe.signals.value' })

export async function run(ctx: ProbeContext) {
	const owner = createScope({ scopeKey: 'probe.signals' })
	ctx.onCleanup(() => owner.dispose())
	runWithSignalOwner(owner, () => {
		value$.set(value$.get() + 1)
		ctx.assert('signal updates in the target runtime', value$.get(), 2)
	})

	ctx.record('target', ctx.target)
}
