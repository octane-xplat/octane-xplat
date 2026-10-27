/** @jsxImportSource @octane-xplat/jsx */
import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'
import LightboxGallery from './LightboxGallery.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'

Application.run({
	create() {
		const page = prepareFullScreenPage(new Page())
		page.actionBarHidden = true
		renderNativeScriptApp(page, LightboxGallery)
		return page
	},
})
