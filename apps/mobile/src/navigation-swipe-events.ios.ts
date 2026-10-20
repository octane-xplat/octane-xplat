import { File, Frame, GridLayout, Page, knownFolders } from '@nativescript/core'
import { requestAnimationFrame } from '@nativescript/core/animation-frame'
import { NSObject, UIGestureRecognizerDelegate } from '@octane-xplat/platform/ios'

/** SDK boundary diagnostic after canonical routers have been disposed. UIKit's
 * synchronous delegate can refuse a real OS swipe before a native pop. Async
 * admission can then take a separate programmatic path; this does not resume
 * the original interactive gesture or implement canonical swipe handling. */
export async function checkNativeSwipeEvents(
	frame: Frame,
	base: Page,
	check: (name: string, pass: boolean, detail?: string) => void,
	wait: (name: string, condition: () => boolean) => Promise<void>,
): Promise<void> {
	const target = new Page()
	target.actionBarHidden = true
	target.content = new GridLayout()
	frame.navigate({ create: () => target, animated: false })
	await wait('swipe diagnostic Page commits', () => frame.currentPage === target)
	const controller = frame.ios.controller
	const edge = controller.interactivePopGestureRecognizer
	const content = controller.interactiveContentPopGestureRecognizer
	if (!edge || !content) {
		throw new Error('The swipe diagnostic requires iOS 26 or later')
	}
	check('native edge recognizer is enabled', edge.enabled)
	check('native content recognizer is enabled', content.enabled)
	const previousEdge = edge.delegate
	const previousContent = content.delegate
	let active = true
	let calls = 0
	let completed = 0
	let settle: ((allow: boolean) => void) | undefined
	const tasks: Promise<void>[] = []
	const Delegate = (NSObject as any).extend(
		{
			gestureRecognizerShouldBegin() {
				if (!active || settle) {
					return false
				}
				calls++
				const decision = new Promise<boolean>((resolve) => {
					settle = (allow) => {
						settle = undefined
						resolve(allow)
					}
				})
				tasks.push(
					decision.then((allow) => {
						completed++
						if (allow && active && frame.currentPage === target) {
							frame.goBack()
						}
					}),
				)
				return false
			},
		},
		{ name: 'XplatNavigationSwipeDiagnosticDelegate', protocols: [UIGestureRecognizerDelegate] },
	)
	const delegate = Delegate.new()
	edge.delegate = delegate
	content.delegate = delegate
	const report = File.fromPath(knownFolders.documents().path + '/navigation-gesture-check.json')
	const phase = (name: string) =>
		report.writeTextSync(
			JSON.stringify({
				phase: name,
				width: controller.view.bounds.size.width,
				height: controller.view.bounds.size.height,
			}),
		)
	try {
		phase('edge-deny')
		await wait('OS edge swipe reaches its delegate', () => calls > 0)
		check('edge callback suspends before a native pop', frame.currentPage === target)
		settle!(false)
		await wait('edge refusal settles', () => completed > 0)
		check('refused edge gesture keeps the current native Page', frame.currentPage === target)
		const before = calls
		phase('content-allow')
		await wait('OS content swipe reaches its delegate', () => calls > before)
		check('content callback suspends before a native pop', frame.currentPage === target)
		settle!(true)
		await wait('admitted swipe returns to the base', () => frame.currentPage === base)
		check(
			'admitted gesture can take a later programmatic Frame Back path',
			frame.currentPage === base,
		)

		await Promise.all(tasks)
		phase('complete')
	} finally {
		active = false
		settle?.(false)
		if (edge.delegate === delegate) {
			edge.delegate = previousEdge
		}

		if (content.delegate === delegate) {
			content.delegate = previousContent
		}
	}
}

/** Coordinate real OS input without using screenshots or a timing sleep. */
export async function requestNavigationSwipe(
	frame: Frame,
	phase:
		| 'canonical-blocker-deny'
		| 'canonical-blocker-admit'
		| 'canonical-modal-down'
		| 'canonical-root-probe'
		| 'canonical-short'
		| 'canonical-content'
		| 'canonical-deny'
		| 'canonical-admit'
		| 'canonical-tab',
): Promise<void> {
	// A native commit and acceptance of the next OS touch are separate milestones.
	// Publish input readiness after UIKit has an attached, interactive target.
	await new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	)
	const controller =
		phase === 'canonical-modal-down'
			? frame.ios.controller.presentedViewController
			: frame.ios.controller
	const inputStarted = Date.now()
	while (
		!controller?.view.window ||
		controller.view.hidden ||
		!controller.view.userInteractionEnabled ||
		controller.transitionCoordinator
	) {
		if (Date.now() - inputStarted > 10000) {
			throw new Error('OS swipe target did not become interactive: ' + phase)
		}

		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
	}
	const bounds = controller.view.bounds.size
	const root = knownFolders.documents().path
	File.fromPath(root + '/navigation-gesture-check.json').writeTextSync(
		JSON.stringify({ phase, width: bounds.width, height: bounds.height }),
	)
	const ack = root + '/navigation-gesture-ack.json'
	const started = Date.now()
	while (true) {
		if (File.exists(ack)) {
			try {
				if (JSON.parse(File.fromPath(ack).readTextSync()).phase === phase) {
					break
				}
			} catch {
				/* Wait for the small acknowledgement write. */
			}
		}

		if (Date.now() - started > 30000) {
			throw new Error('OS swipe acknowledgement timed out: ' + phase)
		}

		await new Promise((resolve) => setTimeout(resolve, 20))
	}
	await new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	)
}
