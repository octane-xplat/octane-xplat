import { Application, Frame, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'

export function mobileAdapter() {
	const page = new Page()
	page.actionBarHidden = true
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
		interaction: 'gesture-observer-dispatch',
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
			const view = required(id)
			const observers = view.getGestureObservers?.(1) ?? []
			if (!view.isLoaded || !observers.length) {
				throw new Error('Probe view has no loaded tap observer: ' + id)
			}

			for (const observer of observers) {
				observer.callback.call(observer.context, { eventName: 'tap', object: view })
			}
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
