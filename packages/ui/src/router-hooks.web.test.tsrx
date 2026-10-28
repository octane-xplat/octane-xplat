// @vitest-environment jsdom
/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { routerScopeCases } from '../tests/router-scope-cases.tsrx'

routerScopeCases((component, props) => {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	act(() => root.render(component, props))
	return {
		async settle() {
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 0))
			})
		},
		unmount() {
			act(() => root.unmount())
			host.remove()
		},
	}
})
