// Deep links — native leaf. iOS delivers openUrl + launchOptions; Android
// delivers an intent on resume/newIntent. Handlers get the raw URL string —
// the app maps it onto its route table.
import { Application } from '@nativescript/core'

type LinkHandler = (url: string) => void
const handlers = new Set<LinkHandler>()
let wired = false
let initial: string | null = null
let lastUrl: string | null = null

function dispatch(url: string | null | undefined) {
	if (!url || url === lastUrl) {
		return
	}

	lastUrl = url
	for (const handler of handlers) {
		handler(url)
	}
}

function wire() {
	if (wired) {
		return
	}

	wired = true
	Application.on(Application.launchEvent, (args: any) => {
		const androidUrl = args.android?.getDataString?.()
		const iosUrl = args.ios?.objectForKey?.('UIApplicationLaunchOptionsURLKey')?.absoluteString
		initial = androidUrl || iosUrl || initial
		dispatch(initial)
	})

	if (Application.ios) {
		Application.on('openUrl', (args: any) => {
			const url = args.url?.absoluteString ?? String(args.url ?? '')
			dispatch(url)
		})

		Application.on('continueActivity', (args: any) => {
			dispatch(args.activity?.webpageURL?.absoluteString)
		})
	}

	if (Application.android) {
		Application.on(Application.resumeEvent, () => {
			const intent = Application.android.foregroundActivity?.getIntent?.()
			const url = intent?.getDataString?.()
			dispatch(url)
		})
	}
}

export function onDeepLink(cb: LinkHandler): () => void {
	wire()
	handlers.add(cb)
	return () => handlers.delete(cb)
}

export function consumeInitialUrl(): string | null {
	const u = initial
	initial = null
	return u
}
