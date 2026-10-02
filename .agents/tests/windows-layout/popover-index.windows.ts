import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { WindowsUICase } from './windows-ui-case.tsrx'
Application.run({
	create() {
		const page = new Page()
		page.actionBarHidden = true
		renderNativeScriptApp(page, WindowsUICase)
		let tick = 0
		const timer = setInterval(() => {
			const records: any[] = []
			const walk = (v: any) => {
				if (v.id === 'popover-label' || String(v.className).includes('vx-popover-backdrop'))
					records.push({
						id: v.id,
						class: v.className,
						size: v.getActualSize?.(),
						brush: !!v.nativeViewProtected?.Background,
					})
				v.eachChildView?.((c: any) => {
					walk(c)
					return true
				})
			}
			walk(page)
			console.log('[priority-popover] tick=' + tick + ' ' + JSON.stringify(records))
			if (++tick >= 120) clearInterval(timer)
		}, 2000)
		return page
	},
})
