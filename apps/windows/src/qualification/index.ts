import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { Qualification } from './layout-cases.windows'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './layouts.css'

const roots = new Set<ReturnType<typeof renderNativeScriptApp>>()
const entry = {
	create() {
		const page = new Page()
		page.actionBarHidden = true
		roots.add(renderNativeScriptApp(page, Qualification))
		return page
	},
}

if (Application.started) {
	Application.resetRootView(entry)
} else {
	Application.run(entry)
}

import.meta.hot?.dispose(() => {
	for (const root of roots) {
		root.unmount()
	}
	roots.clear()
})
