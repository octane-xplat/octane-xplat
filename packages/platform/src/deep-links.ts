// Deep links — native leaf. iOS delivers openUrl + launchOptions; Android
// delivers an intent on resume/newIntent. Handlers get the raw URL string —
// the app maps it onto its route table.
import { Application } from '@nativescript/core'

type LinkHandler = (url: string) => void
const handlers = new Set<LinkHandler>()
let wired = false
let initial: string | null = null
let lastIntent: any = null

function dispatch(url: string | null | undefined) {
	if (!url) {
		return
	}

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
		lastIntent = args.android ?? lastIntent
	})

	if (Application.ios) {
		Application.on('openUrl', (args: any) => {
			const url = args.url?.absoluteString ?? String(args.url ?? '')
			// UIKit can also report a launch URL through openUrl. Keep it
			// queued for consumeInitialUrl while bootstrap is still pending.
			if (url === initial) {
				return
			}
			dispatch(url)
		})

		Application.on('continueActivity', (args: any) => {
			dispatch(args.activity?.webpageURL?.absoluteString)
		})
	}

	if (Application.android) {
		Application.android.on('activityNewIntent', (args: any) => {
			lastIntent = args.intent
			dispatch(args.intent?.getDataString?.())
		})

		Application.on(Application.resumeEvent, () => {
			const intent = Application.android.foregroundActivity?.getIntent?.()
			// A new intent and its resume are one delivery. A later intent
			// carrying the same URL is a new user action and must navigate.
			if (!intent || intent === lastIntent || intent.equals?.(lastIntent)) {
				return
			}
			lastIntent = intent
			dispatch(intent.getDataString?.())
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
