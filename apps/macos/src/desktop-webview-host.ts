import { createMacOSWebView, type MacOSWebView } from '@octane-xplat/desktop-webview/macos'
import { createHostDispatcher, type HostReplyPort } from '@octane-xplat/platform/host'

import type {
	FrameworkHostEvents,
	FrameworkHostServices,
	HostBootstrapState,
	HostFileRef,
	HostWindowOpenOptions,
} from '@octane-xplat/platform/host/services'

type AppInfo = ReturnType<FrameworkHostServices['app']['getInfo']>
type AppState = ReturnType<FrameworkHostServices['app']['getState']>
type WindowSize = ReturnType<FrameworkHostServices['app']['getWindowSize']>
type PermissionResult = Awaited<ReturnType<FrameworkHostServices['notifications']['ensure']>>
import { createHostedWindow } from './appkit.mjs'

export interface AppKitHostServices {
	appInfo: AppInfo
	readonly appState: AppState
	readonly windowSize: WindowSize
	readClipboard(): string | null
	writeClipboard(value: string): boolean
	shareContent(input: { text?: string; url?: string; title?: string }): 'shared' | 'unavailable'
	openUrl(url: string): boolean
	openPath(path: string): boolean
	getColorScheme(): 'light' | 'dark'
	storageGet(key: string): string | null
	storageSet(key: string, value: string): void
	storageRemove(key: string): void
	consumeInitialUrl(): string | null
	onAppStateChange(listener: () => void): () => void
	onWindowResize(listener: (window?: unknown) => void): () => void
	onDeepLink(listener: (url: string) => void): () => void
	onAppearanceChange(listener: () => void): () => void
}

type WebViewWindowController = ReturnType<typeof createHostedWindow>

type Endpoint<Services extends FrameworkHostServices, Events extends FrameworkHostEvents> = {
	webView: MacOSWebView
	dispatcher: ReturnType<typeof createHostDispatcher<Services, Events>>
}

export interface DesktopWebViewHost<
	Services extends FrameworkHostServices = FrameworkHostServices,
	Events extends FrameworkHostEvents = FrameworkHostEvents,
> {
	dispatcher: ReturnType<typeof createHostDispatcher<Services, Events>>
	emit: ReturnType<typeof createHostDispatcher<Services, Events>>['emit']
	dispose(): void
}

const windowSizeFor = (
	size: { width?: number; height?: number } | null | undefined,
): WindowSize => ({
	width: Number(size?.width ?? 0),
	height: Number(size?.height ?? 0),
	orientation: Number(size?.width ?? 0) >= Number(size?.height ?? 0) ? 'landscape' : 'portrait',
})

const notificationPermission = (webView: MacOSWebView): PermissionResult => {
	const status = webView.notificationPermission()
	if (status === 'granted' || status === 'denied') {
		return status
	}

	return webView.requestNotificationPermission() ? 'granted' : 'denied'
}

const fileRef = (value: { name: string; uri: string } | null): HostFileRef | null =>
	value && { name: String(value.name), uri: String(value.uri) }

/**
 * Install the typed framework bridge on one WKWebView. Secondary windows get
 * their own webview and dispatcher; close events go back to their opener.
 */
export function createDesktopWebViewHost<
	Services extends FrameworkHostServices,
	Events extends FrameworkHostEvents,
>(
	webView: MacOSWebView,
	appKit: AppKitHostServices,
	baseUrl: string | null,
	extraServices: (
		sender: MacOSWebView,
		emit: <Event extends keyof Events & string>(name: Event, payload: Events[Event]) => void,
	) => Omit<Services, keyof FrameworkHostServices>,
	primaryWindow?: { frame?: { size?: { width?: number; height?: number } } },
): DesktopWebViewHost<Services, Events> {
	const endpoints = new Map<MacOSWebView, Endpoint<Services, Events>>()
	const secondaryWindows = new Map<
		string,
		{ controller: WebViewWindowController; webView: MacOSWebView; opener: MacOSWebView }
	>()

	const pendingInitialUrls = new Map<MacOSWebView, string | null>()

	const emitAll = <Event extends keyof Events & string>(name: Event, payload: Events[Event]) => {
		for (const endpoint of endpoints.values()) {
			endpoint.dispatcher.emit(name, payload)
		}
	}

	const sameNativeWindow = (left: unknown, right: unknown) =>
		left === right ||
		Boolean((left as { isEqual?(value: unknown): boolean } | null)?.isEqual?.(right)) ||
		Boolean((right as { isEqual?(value: unknown): boolean } | null)?.isEqual?.(left))

	const senderWindowSize = (sender: MacOSWebView) =>
		windowSizeFor(
			(sender.owningWindow() as { frame?: { size?: { width?: number; height?: number } } } | null)
				?.frame?.size ??
				primaryWindow?.frame?.size ??
				appKit.windowSize,
		)

	const hostWindowSize = () => windowSizeFor(primaryWindow?.frame?.size ?? appKit.windowSize)

	const bootstrapFor = (sender: MacOSWebView, windowSize: WindowSize): HostBootstrapState => {
		if (!pendingInitialUrls.has(sender)) {
			pendingInitialUrls.set(sender, sender === webView ? appKit.consumeInitialUrl() : null)
		}

		return {
			appInfo: appKit.appInfo,
			appState: appKit.appState,
			windowSize,
			initialUrl: pendingInitialUrls.get(sender) ?? null,
			colorScheme: appKit.getColorScheme(),
		}
	}

	const emitTo = <Event extends keyof Events & string>(
		sender: MacOSWebView,
		name: Event,
		payload: Events[Event],
	) => {
		endpoints.get(sender)?.dispatcher.emit(name, payload)
	}

	const attach = (target: MacOSWebView, services: Services) => {
		if (!target.setBootstrap(JSON.stringify(bootstrapFor(target, senderWindowSize(target))))) {
			throw new Error('failed to install desktop webview bootstrap')
		}

		const port: HostReplyPort = {
			reply: (message) => target.deliver(message),
			emit: (message) => target.deliver(message),
		}

		const dispatcher = createHostDispatcher<Services, Events>(services, port)
		target.installDispatcher((message) => void dispatcher.dispatch(message))
		endpoints.set(target, { webView: target, dispatcher })
		return dispatcher
	}

	const detach = (target: MacOSWebView) => {
		endpoints.delete(target)
		pendingInitialUrls.delete(target)
		target.dispose()
	}

	const loadTarget = (target: MacOSWebView, targetUrl?: string) => {
		const raw = targetUrl ?? '/'
		if (/^https?:\/\//i.test(raw)) {
			return target.load(raw)
		}

		const packaged = raw.match(/^xplat:\/\/app(\/.*)?$/i)?.[1] ?? ''
		const path = packaged || (raw.startsWith('/') ? raw : `/${raw}`) || '/index.html'
		if (baseUrl) {
			return target.load(`${baseUrl.replace(/\/$/, '')}${path}`)
		}

		return target.loadPackaged(path)
	}

	const openWebWindow = (opener: MacOSWebView, options: HostWindowOpenOptions) => {
		const id = String(options.id ?? `w${secondaryWindows.size + 1}`)
		const controller = createHostedWindow({
			kind: options.kind === 'dialog' ? 'dialog' : 'regular',
			parent: options.kind === 'dialog' ? opener.owningWindow() : null,
			title: options.title,
			size: options.size,
		})

		const child = createMacOSWebView(controller.window.contentView)
		child.setWindowContext(id, JSON.stringify(options.data ?? null))
		attach(child, servicesFor(child))

		secondaryWindows.set(id, { controller, webView: child, opener })
		void controller.closed.then(() => {
			const entry = secondaryWindows.get(id)
			secondaryWindows.delete(id)
			endpoints.get(entry?.opener ?? opener)?.dispatcher.emit('windows.closed', id)
			detach(child)
		})

		if (!loadTarget(child, options.url)) {
			controller.close()
			throw new Error(`unsupported macOS webview window URL: ${String(options.url ?? '/')}`)
		}

		return id
	}

	const servicesFor = (sender: MacOSWebView): Services =>
		({
			app: {
				getInfo: () => appKit.appInfo,
				getState: () => appKit.appState,
				getWindowSize: () => senderWindowSize(sender),
				consumeInitialUrl: () => {
					const url = pendingInitialUrls.get(sender) ?? null
					pendingInitialUrls.delete(sender)
					return url
				},
			},
			clipboard: {
				read: () => Promise.resolve(appKit.readClipboard()),
				write: (value) => Promise.resolve(appKit.writeClipboard(value)),
			},
			files: {
				pick: (accept, options) =>
					Promise.resolve(
						fileRef(sender.pickFile(accept ?? '*/*', options?.startingFolder ?? null)),
					),
				readText: (uri) => Promise.resolve(sender.readFileText(uri)),
				writeText: (name, text) => Promise.resolve(fileRef(sender.writeFileText(name, text))),
			},
			notifications: {
				ensure: () => Promise.resolve(notificationPermission(sender)),
				notify: (title, body) => Promise.resolve(sender.notify(title, body ?? '')),
			},
			secureStorage: {
				get: (key) => Promise.resolve(sender.secureStorageGet(key)),
				set: (key, value) => Promise.resolve(sender.secureStorageSet(key, value)),
				remove: (key) => Promise.resolve(sender.secureStorageRemove(key)),
			},
			appearance: {
				get: () => Promise.resolve(appKit.getColorScheme()),
			},
			windows: {
				open: (options) => Promise.resolve(openWebWindow(sender, options)),
				close: (id) => {
					const entry = secondaryWindows.get(id)
					if (!entry) {
						return Promise.resolve(false)
					}

					entry.controller.close()
					return Promise.resolve(true)
				},
				setTitle: (id, title) => {
					const entry = secondaryWindows.get(id)
					entry?.controller.setTitle(title)
					return Promise.resolve(Boolean(entry))
				},
			},
			system: {
				openUrl: (url) => Promise.resolve(appKit.openUrl(url)),
				openPath: (path) => Promise.resolve(appKit.openPath(path)),
				shareContent: (input) => Promise.resolve(appKit.shareContent(input)),
			},
			storage: {
				get: (key) => Promise.resolve(appKit.storageGet(key)),
				set: (key, value) => Promise.resolve(appKit.storageSet(key, value)),
				remove: (key) => Promise.resolve(appKit.storageRemove(key)),
			},
			...extraServices(sender, (name, payload) => emitTo(sender, name, payload)),
		}) as Services

	const dispatcher = attach(webView, servicesFor(webView))

	const subscriptions = [
		appKit.onAppStateChange(() => emitAll('app.state.change', appKit.appState)),
		appKit.onWindowResize((nativeWindow) => {
			if (!nativeWindow) {
				emitAll('window.resize', hostWindowSize())
				return
			}

			for (const endpoint of endpoints.values()) {
				if (sameNativeWindow(endpoint.webView.owningWindow(), nativeWindow)) {
					emitTo(endpoint.webView, 'window.resize', senderWindowSize(endpoint.webView))
				}
			}
		}),
		appKit.onDeepLink((url) => emitAll('app.deep-link', url)),
		appKit.onAppearanceChange(() => emitAll('appearance.change', appKit.getColorScheme())),
	]

	return {
		dispatcher,
		emit: (name, payload) => dispatcher.emit(name, payload),
		dispose() {
			for (const unsubscribe of subscriptions) {
				unsubscribe()
			}

			for (const { webView } of endpoints.values()) {
				webView.dispose()
			}

			endpoints.clear()
		},
	}
}
