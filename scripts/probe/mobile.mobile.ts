// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { install as installGestureHandler } from '@nativescript-community/gesturehandler'
import { Application, Frame, GestureTypes, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'

import { dispatchScrub } from './touch.ts'
import { dispatchPress } from './press.ts'

installGestureHandler()

export function mobileAdapter() {
	const page = new Page()
	page.actionBarHidden = true
	// Same as prepareFullScreenPage() in @octane-xplat/ui/nativescript (not importable here).
	page.iosIgnoreSafeArea = true
	page.androidOverflowEdge = 'ignore'
	const frame = new Frame()
	frame.navigate({ create: () => page, animated: false })
	const entry = { create: () => frame }
	if (Application.started) {
		Application.resetRootView(entry)
	} else {
		Application.run(entry)
	}

	let root
	let reportError
	const onError = (args) => reportError?.(args.error ?? args)
	Application.on(Application.uncaughtErrorEvent, onError)
	const find = (id) => page.getViewById(id) ?? null
	const required = (id) => {
		const view = find(id)
		if (!view) {
			throw new Error('Missing probe view: ' + id)
		}

		return view
	}

	return {
		host: { page, frame },
		identity: 'NativeScript',
		interaction: 'event-handler-dispatch',
		onError(report) {
			reportError = report
		},
		async ready() {
			while (!page.isLoaded) {
				await new Promise((resolve) => setTimeout(resolve, 20))
			}
		},
		mount(Component, props) {
			root?.unmount()
			root = renderNativeScriptApp(page, Component, props)
		},
		find,
		press(id) {
			dispatchPress(required(id))
		},
		scrub(id, points) {
			return dispatchScrub(required(id), points, GestureTypes.touch)
		},
		setText(id, value) {
			required(id).text = value
		},
		inspect(id) {
			const view = required(id)
			const location = view.getLocationOnScreen?.()
			const size = view.getActualSize?.()
			return {
				text: String(view.text ?? ''),
				value: String(view.text ?? ''),
				frame: location && size ? { ...location, width: size.width, height: size.height } : null,
			}
		},
		dispose() {
			root?.unmount()
			Application.off(Application.uncaughtErrorEvent, onError)
		},
	}
}
