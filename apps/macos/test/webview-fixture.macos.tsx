/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { WebView } from '@octane-xplat/ui'
import type { WebViewHandle, WebViewProps } from '@octane-xplat/ui'

function Content(props: WebViewProps) {
	return <WebView {...props} />
}

export function runWebViewFixture(first: string, second: string, missing: string) {
	const host = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 400, height: 200 },
	})

	const root = createMacOSRoot(host)
	const handle: { current: WebViewHandle | null } = { current: null }
	let loads = 0
	let measured = false
	let finished = false
	const fail = (message: string) => {
		console.error('WEBVIEW_FIXTURE_FAIL ' + message)
		globalThis.__xplatStopHost()
	}

	const finish = () => {
		const native = handle.current?.native
		handle.current?.stopLoading()
		root.unmount()
		setTimeout(() => {
			if (native.navigationDelegate || handle.current) {
				return fail('disposal/ref clearing')
			}

			finished = true
			console.log('WEBVIEW_RUNTIME_OK loads=' + loads + ' file-error=true')
			globalThis.__xplatStopHost()
		}, 20)
	}

	const props: WebViewProps = {
		id: 'embedded',
		ref: handle,
		style: { width: 320, height: 150 },
		matchContents: true,
		scrollEnabled: false,
		onLayoutContent: (size) => {
			if (size.height < 700 || size.width <= 0) {
				return fail('content measurement ' + JSON.stringify(size))
			}

			const constraints = handle.current?.native?.constraints
			let heightMatches = false
			for (let index = 0; index < Number(constraints?.count ?? 0); index++) {
				const constraint = constraints.objectAtIndex(index)
				if (
					Number(constraint.firstAttribute) === 8 &&
					Number(constraint.constant) === size.height
				) {
					heightMatches = true
				}
			}

			if (!heightMatches) {
				return fail('matchContents height constraint')
			}
			measured = true
		},
		onError: (event) => {
			if (loads !== 7 || !event.error || event.url !== missing) {
				return fail('unexpected load failure ' + event.error)
			}

			finish()
		},
		onLoad: (event) => {
			loads++
			const expected = loads <= 3 ? undefined : [first, second, first, second][loads - 4]
			if (event.url !== expected) {
				return fail('load URL ' + event.url + ' expected ' + expected)
			}

			setTimeout(() => {
				if (!measured || !handle.current?.native) {
					return fail('missing measurement/ref')
				}

				if (loads === 1) {
					handle.current.reload()
				} else if (loads === 2) {
					root.render(Content, {
						...props,
						html: '<html><body style="height:900px">replacement</body></html>',
					})
				} else if (loads === 3) {
					root.render(Content, { ...props, src: first })
				} else if (loads === 4) {
					root.render(Content, { ...props, src: second })
				} else if (loads === 5) {
					handle.current.goBack()
				} else if (loads === 6) {
					handle.current.goForward()
				} else if (loads === 7) {
					root.render(Content, { ...props, src: missing })
				} else {
					fail('unexpected success after missing file')
				}
			}, 100)
		},
	}

	root.render(Content, {
		...props,
		html: '<html><body style="margin:0;height:700px">embedded</body></html>',
		src: 'https://invalid.example',
	})

	host.layoutSubtreeIfNeeded()
	// A headless fixture has no window to drive AppKit layout.
	handle.current?.native.setFrameSize({ width: 320, height: 150 })
	setTimeout(() => {
		if (!finished) {
			fail('timeout waiting for WebKit callbacks loads=' + loads)
		}
	}, 15000)
}
