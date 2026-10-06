import '@nativescript/macos-node-api'

interface NativeCefHost {
	attachToUrl(parent: object, url: string): boolean
	loadURLString(url: string): boolean
	reload(): void
	goBack(): void
	goForward(): void
	canGoBack(): boolean
	canGoForward(): boolean
	takeFocus(): void
	closeBrowser(): void
	installDispatcher(dispatch: (packet: string) => void): void
	injectWheelDeltaXDeltaY(dx: number, dy: number): void
	requestSource(): void
}

declare const XplatCefHost: {
	alloc(): { init(): NativeCefHost }
	initializeCefWithPaths(paths: Record<string, string>): number
	shutdownCef(): void
	cefState(): number
}

declare const XplatCefActionTarget: {
	wireControlHandler(control: any, handler: (sender: any) => void): any
}

const keepAlive: any[] = []

// Point a renderer-created control at a real ObjC action target — the
// renderer's JS-side action dispatch crashes on sendAction (selectors
// registered through ObjCExposedMethods never become real ObjC methods
// under this runtime, so performSelector hits doesNotRecognizeSelector).
// The wiring happens ObjC-side because assigning a SEL through the bridge
// also crashes.
export function wireControl(view: any, handler: (sender: any) => void) {
	if (!view) {
		return null
	}
	// NSControl.target is weak — keep the target alive for the app lifetime.
	const target = XplatCefActionTarget.wireControlHandler(view, handler)
	keepAlive.push(target)
	return target
}

export interface CefEvent {
	type: 'created' | 'closed' | 'nav' | 'title' | 'loading' | 'error' | 'popup' | 'focus' | 'resize' | 'source'
	[key: string]: unknown
}

export interface CefBrowser {
	attachTo(parent: object, url: string): boolean
	load(url: string): boolean
	reload(): void
	goBack(): void
	goForward(): void
	takeFocus(): void
	close(): void
	injectWheel(dx: number, dy: number): void
	requestSource(): void
}

let initResult: number | null = null

/** Initialize the CEF browser process once. Returns 0 on success. */
export function ensureCef(): number {
	if (initResult !== null) {
		return initResult
	}

	const runtime = `${process.cwd()}/cef-runtime`
	const bundle = `${runtime}/XplatCefSpike.app`
	const frameworks = `${bundle}/Contents/Frameworks`
	initResult = XplatCefHost.initializeCefWithPaths({
		bundle,
		framework: `${frameworks}/Chromium Embedded Framework.framework`,
		helper: `${frameworks}/XplatCefSpike Helper.app/Contents/MacOS/XplatCefSpike Helper`,
		cache: `${runtime}/cache`,
		resources: `${frameworks}/Chromium Embedded Framework.framework/Resources`,
		log: `${runtime}/cef.log`,
	})
	return initResult
}

export function createCefBrowser(onEvent: (event: CefEvent) => void): CefBrowser {
	const state = ensureCef()
	if (state !== 0) {
		throw new Error(`CEF initialization failed (${state}); run pnpm cef:fetch && pnpm cef:runtime`)
	}

	const native = XplatCefHost.alloc().init()
	native.installDispatcher((packet: string) => {
		try {
			onEvent(JSON.parse(packet) as CefEvent)
		} catch (error) {
			console.error('[cef-spike] bad packet', error)
		}
	})

	return {
		attachTo(parent, url) {
			return native.attachToUrl(parent, url)
		},
		load(url) {
			return native.loadURLString(url)
		},
		reload() {
			native.reload()
		},
		goBack() {
			native.goBack()
		},
		goForward() {
			native.goForward()
		},
		takeFocus() {
			native.takeFocus()
		},
		close() {
			native.closeBrowser()
		},
		injectWheel(dx, dy) {
			native.injectWheelDeltaXDeltaY(dx, dy)
		},
		requestSource() {
			native.requestSource()
		},
	}
}

export { XplatCefHost }
