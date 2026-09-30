// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { createRoot, flushSync } from 'octane'
import { DataScreen, DataSharedReader } from './data-probe.tsrx'
import { runDataTrace } from './data-trace'

it('keeps component queries independent through the shared data lifecycle trace', async () => {
	const hosts = Array.from({ length: 4 }, () => document.createElement('div'))
	for (const host of hosts) {
		document.body.append(host)
	}

	const roots = hosts.map((host) => createRoot(host))
	try {
		roots[0].render(DataScreen, { id: 'first' })
		roots[1].render(DataScreen, { id: 'second' })
		roots[2].render(DataSharedReader, {})
		roots[3].render(DataSharedReader, {})
		const count = await runDataTrace({
			text: (root, id) => hosts[root].querySelector(`#${id}`)?.textContent ?? undefined,
			tap: (root, id) => {
				const target = hosts[root].querySelector<HTMLElement>(`#${id}`)
				if (!target) {
					throw new Error('Missing control ' + id)
				}

				flushSync(() => target.click())
			},
			unmount: (root) => roots[root].unmount(),
			wait: () => new Promise<void>((done) => setTimeout(done, 0)),
		})

		expect(count).toBe(13)
	} finally {
		for (const root of roots) {
			root.unmount()
		}

		for (const host of hosts) {
			host.remove()
		}
	}
})
