/** @jsxImportSource @nativescript-community/octane */
import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import Counter from './Counter.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'

Application.run({
	create() {
		const page = new Page()
		page.actionBarHidden = true
		renderNativeScriptApp(page, Counter)
		return page
	},
})
