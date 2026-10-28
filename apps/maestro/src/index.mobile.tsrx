/** @jsxImportSource @octane-xplat/jsx */
import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { install as installGestureHandler } from '@nativescript-community/gesturehandler'
import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'
import LightboxGallery from './LightboxGallery.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'

installGestureHandler()

Application.run({
	create() {
		const page = prepareFullScreenPage(new Page())
		page.actionBarHidden = true
		renderNativeScriptApp(page, LightboxGallery)
		return page
	},
})
