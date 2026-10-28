/** @jsxImportSource @octane-xplat/jsx */
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { routerScopeCases } from '../tests/router-scope-cases.tsrx'

routerScopeCases((component, props) => {
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	root.render(component, props)
	return {
		async settle() {
			flushUniversalSync(() => {})
			await new Promise((resolve) => setTimeout(resolve, 0))
			flushUniversalSync(() => {})
		},
		unmount() {
			root.unmount()
		},
	}
})
