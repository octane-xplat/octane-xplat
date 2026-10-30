// Deep links — native leaf. iOS delivers openUrl + launchOptions; Android
// delivers an intent on resume/newIntent. Handlers get the raw URL string —
// the app maps it onto its route table.
import { Application } from '@nativescript/core'

type LinkHandler = (url: string) => void
const handlers = new Set<LinkHandler>()
let wired = false
let initial: string | null = null
let launchEchoSuppressed = false
let lastIntent: any = null
let sceneConnected = false
let androidLaunched = false
const earlyIntents: any[] = []
const sameIntent = (a: any, b: any) => !!a && !!b && (a === b || a.equals?.(b))

function dispatch(url: string | null | undefined) {
	if (!url) {
		return
	}

	for (const handler of handlers) {
		handler(url)
	}
}

// Foundation NSSet.allObjects is an NSArray, rather than necessarily a JS array.
function iosValues(collection: any): any[] {
	const values = collection?.allObjects ?? collection
	if (!values) {
		return []
	}
	if (Array.isArray(values)) {
		return values
	}
	const result: any[] = []
	for (let index = 0; index < (values.count ?? 0); index++) {
		result.push(values.objectAtIndex(index))
	}
	return result
}

function wire() {
	if (wired) {
		return
	}

	wired = true
	androidLaunched = Application.hasLaunched?.() ?? false
	Application.on(Application.launchEvent, (args: any) => {
		const androidUrl = args.android?.getDataString?.()
		const iosUrl = args.ios?.objectForKey?.('UIApplicationLaunchOptionsURLKey')?.absoluteString
		initial = androidUrl || iosUrl || initial
		lastIntent = args.android ?? lastIntent
		androidLaunched = true
		// Some Android hosts deliver the launch Intent through onNewIntent
		// before the legacy launch event. Classify it once launch identifies
		// the cold Intent; distinct early deliveries remain warm actions.
		for (const intent of earlyIntents.splice(0)) {
			if (!sameIntent(intent, args.android)) {
				dispatch(intent.getDataString?.())
			}

			lastIntent = intent
		}
	})

	if (Application.ios) {
		Application.ios.on('sceneWillConnect', (args: any) => {
			const options = args.connectionOptions
			const urls: string[] = [
				...iosValues(options?.URLContexts).map((context) => context.URL?.absoluteString),
				...iosValues(options?.userActivities).map(
					(activity) => activity.webpageURL?.absoluteString,
				),
			].filter((url): url is string => typeof url === 'string' && url.length > 0)
			if (!sceneConnected) {
				sceneConnected = true
				initial = urls.shift() ?? initial
			}
			for (const url of urls) {
				dispatch(url)
			}
		})

		Application.ios.on('sceneOpenURLContexts', (args: any) => {
			for (const context of iosValues(args.urlContexts)) {
				dispatch(context.URL?.absoluteString)
			}
		})

		Application.ios.on('sceneContinueUserActivity', (args: any) => {
			dispatch(args.userActivity?.webpageURL?.absoluteString)
		})

		Application.on('openUrl', (args: any) => {
			// Scene events are authoritative. A delegate/plugin forwarding them to
			// the legacy bus must not deliver the same OS action twice.
			if (sceneConnected) {
				return
			}
			const url = args.url?.absoluteString ?? String(args.url ?? '')
			// UIKit can also report a launch URL through openUrl once. Keep it
			// queued for consumeInitialUrl while bootstrap is still pending —
			// but only suppress that first echo; a later identical URL is a
			// new user action and must dispatch.
			if (url === initial && !launchEchoSuppressed) {
				launchEchoSuppressed = true
				return
			}

			dispatch(url)
		})

		Application.on('continueActivity', (args: any) => {
			if (sceneConnected) {
				return
			}
			dispatch(args.activity?.webpageURL?.absoluteString)
		})
	}

	if (Application.android) {
		const receiveIntent = (intent: any) => {
			if (!intent) {
				return
			}
			if (!androidLaunched) {
				if (!earlyIntents.some((queued) => sameIntent(queued, intent))) {
					earlyIntents.push(intent)
				}

				return
			}
			// New Intent and resume are one delivery. A distinct Intent with
			// the same URL is still a new user action.
			if (sameIntent(intent, lastIntent)) {
				return
			}
			lastIntent = intent
			dispatch(intent.getDataString?.())
		}

		Application.android.on('activityNewIntent', (args: any) => receiveIntent(args.intent))
		Application.on(Application.resumeEvent, () => {
			receiveIntent(Application.android.foregroundActivity?.getIntent?.())
		})
	}
}

/** Subscribe to incoming deep links. */
export function onDeepLink(cb: LinkHandler): () => void {
	wire()
	handlers.add(cb)
	return () => handlers.delete(cb)
}

/** Read and clear the URL that launched the app. */
export function consumeInitialUrl(): string | null {
	const u = initial
	initial = null
	return u
}
