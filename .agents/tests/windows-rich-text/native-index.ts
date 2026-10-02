import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { WindowsUICase, changeRichText } from './windows-ui-case.tsrx'
// Copy native-case.tsrx to the lab app's src/windows-ui-case.tsrx and this entry
// to src/index.ts. Every guest write, prepare and launch requires the shared lease.
function inspect(page: Page, stage: number) {
	const labels = ['mixed', 'deep', 'order', 'explicit'].map((id) => {
		const view: any = page.getViewById(id)
		if (!view) throw new Error('Missing label ' + id)
		const inner = view.nativeTextViewProtected
		if (!inner) throw new Error('Missing inner TextBlock for ' + id)
		const runs = []
		for (let i = 0; i < inner.Inlines.Size; i++) {
			const run = inner.Inlines.GetAt(i)
			runs.push({ text: run.Text, weight: run.FontWeight.Weight, style: Number(run.FontStyle) })
		}
		return {
			id,
			text: view.text,
			nativeText: inner.Text,
			runs,
			formatted: !!view.formattedText,
			size: view.getActualSize(),
			innerSize: { width: inner.ActualWidth, height: inner.ActualHeight },
		}
	})
	console.log('[rich-text-native] ' + JSON.stringify({ stage, labels }))
}
Application.run({
	create() {
		const page = new Page()
		page.actionBarHidden = true
		const root = renderNativeScriptApp(page, WindowsUICase)
		let stage = 0
		const step = () => {
			try {
				inspect(page, stage)
				if (stage === 3) {
					const retained: any = page.getViewById('mixed')
					root.unmount()
					console.log(
						'[rich-text-native] ' +
							JSON.stringify({
								stage: 4,
								contentEmpty: page.content == null,
								retainedFormatted: !!retained.formattedText,
							}),
					)
					return
				}
				changeRichText(++stage)
				setTimeout(step, 800)
			} catch (error) {
				console.log('[rich-text-native-error] ' + String(error))
			}
		}
		setTimeout(step, 3000)
		return page
	},
})
