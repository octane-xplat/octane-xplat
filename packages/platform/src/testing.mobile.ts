/** On-device spec support — the Xplat half of @nativescript/unit-test-runner
 *  mounts. Upstream `mount()` attaches a native view to the test host page;
 *  `mountXplat()` renders an Octane component into the ContentView it hands
 *  over, tracks the live roots so a re-mount or a finished test can't leak
 *  them, and pairs every mount with the component's `unmount()`.
 *
 *  Bundled only under the `native` condition (spec code runs inside the
 *  `--env.unitTesting` build, where bare `vitest` imports alias to the
 *  runner's device shim). Specs keep using the upstream interaction/wait
 *  helpers — tap, enterText, waitUntil, nextRenderPass — directly; this
 *  module adds only what the upstream runner cannot know about. */
import { ContentView, type View, type ViewBase } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { enterText, mount } from '@nativescript/unit-test-runner/testing'
import { onTestFinished } from 'vitest'

// The upstream spec surface, re-exported so spec files need one import site.
// tap()/enterText() dispatch through gesture observers — they prove handler
// wiring, not OS hit-testing (that stays Maestro's lane).
export {
	doubleTap,
	enterText,
	longPress,
	nextRenderPass,
	returnPress,
	tap,
	waitForLayout,
	waitUntil,
} from '@nativescript/unit-test-runner/testing'

export type { Mounted, MountOptions, WaitUntilOptions } from '@nativescript/unit-test-runner/testing'

/** The view shape `enterText` accepts — handy as `findByTestId<TextInputView>`. */
export type TextInputView = Parameters<typeof enterText>[0]

export interface MountedComponent {
	/** The ContentView the component rendered into. */
	view: ContentView
	/** The runner's host surface; its `content` clears on unmount. */
	host: ContentView
	/** Unmount the component root and detach the holder. Idempotent. */
	unmount(): Promise<void>
}

export interface MountXplatOptions {
	/** Unmount automatically when the current test finishes. Default true. */
	autoUnmount?: boolean
	/** View-load + layout budget forwarded to the runner's mount(). */
	timeout?: number
}

// Live component roots for the current spec. mount() replaces host.content
// on every call — without this, a second mountXplat() would orphan the
// previous root's native tree while its subscriptions and timers stay live.
const liveMounts = new Set<() => Promise<void>>()

export async function mountXplat<P extends object>(
	component: (props: P) => unknown,
	props?: P,
	options: MountXplatOptions = {},
): Promise<MountedComponent> {
	for (const release of new Set(liveMounts)) {
		await release()
	}

	let root: { unmount(): void } | undefined
	const { view, host, unmount: unmountView } = await mount(
		() => {
			const holder = new ContentView()
			root = renderNativeScriptApp(holder, component, props)
			return holder
		},
		// The runner's own autoUnmount only clears host.content — the octane
		// root cleanup lives here instead so both happen as one unit.
		{ timeout: options.timeout, autoUnmount: false },
	)

	let unmounted = false
	const unmount = async () => {
		if (unmounted) {
			return
		}

		unmounted = true
		liveMounts.delete(unmount)
		root?.unmount()
		await unmountView()
	}

	liveMounts.add(unmount)
	if (options.autoUnmount !== false) {
		onTestFinished(() => unmount())
	}

	return { view, host, unmount }
}

/** Depth-first walk of the mounted native tree. */
export function eachDescendant(root: ViewBase, visit: (view: ViewBase) => void): void {
	const walk = (view: ViewBase) => {
		visit(view)

		;(view as View).eachChildView?.((child) => {
			walk(child)
			return true
		})
	}

	walk(root)
}

/** Every `text`/`formattedText` string in the subtree, depth-first. The
 *  runner exposes no query layer — text is the shared observable contract
 *  across Xplat leaves, so this is the portable assertion surface. */
export function viewText(root: ViewBase): string[] {
	const out: string[] = []
	eachDescendant(root, (view) => {
		const text = (view as { text?: unknown }).text
		if (typeof text === 'string') {
			out.push(text)
		}
	})

	return out
}

/** First descendant whose NativeScript `testID` matches — the native half of
 *  the shared `testID` prop (`data-testid` on web). `id`-based lookups belong
 *  to `view.getViewById` instead. */
export function findByTestId<T = View>(root: ViewBase, testID: string): T | undefined {
	let found: T | undefined
	eachDescendant(root, (view) => {
		if (!found && (view as View).testID === testID) {
			found = view as T
		}
	})

	return found
}
