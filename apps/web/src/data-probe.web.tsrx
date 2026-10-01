import { createRoot } from 'octane'
import { DataScreen, DataSharedReader, DataRetained } from '@xplat/app/data-probe.tsrx'
import { runDataTrace } from '@xplat/app/data-trace'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'

const ids = ['first', 'second', 'sheet', 'modal']
const hosts = ids.map((id) => document.getElementById(id)!)
const roots = hosts.map((host) => createRoot(host))
roots[0].render(<DataScreen id="first" />)
roots[1].render(<DataScreen id="second" />)
roots[2].render(<DataSharedReader />)
roots[3].render(<DataSharedReader />)

let resolve!: (value: string) => void
const pending = new Promise<string>((done) => { resolve = done })
const report = { assertions: 0, error: '', uncaught: 0, resolve: () => resolve('resolved') }

;(window as any).__dataProbe = report
createRoot(document.getElementById('retained')!, {
	onUncaughtError: () => { report.uncaught++ },
}).render(<DataRetained pending={pending} fail={() => { throw new Error('probe handler failure') }} />)

runDataTrace({
	text: (root, id) => hosts[root].querySelector(`#${id}`)?.textContent ?? undefined,
	tap: (root, id) => {
		const target = hosts[root].querySelector<HTMLElement>(`#${id}`)
		if (!target) throw new Error('Missing data control: ' + id)
		target.click()
	},
	unmount: (root) => roots[root].unmount(),
	wait: () => new Promise<void>((done) => setTimeout(done, 20)),
}).then((assertions) => { report.assertions = assertions }, (error) => { report.error = String(error); console.error(error) })
