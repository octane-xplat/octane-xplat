// Web browser — native leaf. iOS presents SFSafariViewController (declared
// locally; SafariServices sits outside the @nativescript/types default
// subset, same as platform's auth-session). Android launches a Chrome Custom
// Tab via androidx.browser — pulled in by platforms/android/include.gradle.
import { Application, Color, Utils, isIOS } from '@nativescript/core'
import { NSURL, UIApplication, UIWindowScene } from '@octane-xplat/platform/ios'
import type { OpenBrowserOptions, WebBrowser, WebBrowserResult } from './types'

declare const SFSafariViewController: any
declare const SFSafariViewControllerConfiguration: any

// UIModalPresentationStyle
const PRESENTATION: Record<string, number> = {
	automatic: -2,
	fullScreen: 0,
	pageSheet: 1,
	formSheet: 2,
	popover: 7,
}

function topViewController(): any {
	const foregroundActive = (globalThis as any).UISceneActivationState?.ForegroundActive
	let controller: any
	const scenes = UIApplication.sharedApplication.connectedScenes.allObjects
	for (let i = 0; i < scenes.count; i++) {
		const scene = scenes.objectAtIndex(i) as UIWindowScene
		if (scene.activationState === foregroundActive) {
			controller = scene.windows.objectAtIndex(0)?.rootViewController
			break
		}
	}
	controller ??= UIApplication.sharedApplication.keyWindow?.rootViewController
	while (controller?.presentedViewController) {
		controller = controller.presentedViewController
	}
	return controller
}

let presented: any = null

function iosOpen(url: string, options?: OpenBrowserOptions): Promise<WebBrowserResult> {
	return new Promise((resolve) => {
		const nsUrl = NSURL.URLWithString(url)
		const presenter = topViewController()
		if (!nsUrl || !presenter) {
			resolve({ type: 'cancel' })
			return
		}

		let controller: any
		if (
			typeof SFSafariViewControllerConfiguration !== 'undefined' &&
			(options?.toolbarColor || options?.controlsColor)
		) {
			const config = SFSafariViewControllerConfiguration.new()
			if (options.toolbarColor) {
				config.preferredBarTintColor = new Color(options.toolbarColor).ios
			}

			if (options.controlsColor) {
				config.preferredControlTintColor = new Color(options.controlsColor).ios
			}

			controller = SFSafariViewController.alloc().initWithURLConfiguration(nsUrl, config)
		} else {
			controller = SFSafariViewController.alloc().initWithURL(nsUrl)
		}

		if (options?.presentationStyle && PRESENTATION[options.presentationStyle] !== undefined) {
			controller.modalPresentationStyle = PRESENTATION[options.presentationStyle]
		}

		presented = controller
		presenter.presentViewControllerAnimatedCompletion(controller, true, () =>
			resolve({ type: 'opened' }),
		)
	})
}

function androidOpen(url: string, options?: OpenBrowserOptions): Promise<WebBrowserResult> {
	return new Promise((resolve) => {
		const androidUtils = Utils.android as any
		const activity = androidUtils?.getCurrentActivity?.() ?? Application.android?.foregroundActivity
		const tabs = (globalThis as any).androidx?.browser?.customtabs
		if (!activity || !tabs?.CustomTabsIntent) {
			resolve({ type: 'cancel' })
			return
		}
		try {
			const builder = new tabs.CustomTabsIntent.Builder()
			if (options?.toolbarColor) {
				builder.setToolbarColor(android.graphics.Color.parseColor(options.toolbarColor))
			}

			if (options?.showTitle) {
				builder.setShowTitle(true)
			}

			if (options?.enableBarCollapsing) {
				builder.setUrlBarHidingEnabled(true)
			}

			builder.build().launchUrl(activity, android.net.Uri.parse(url))
			resolve({ type: 'opened' })
		} catch {
			resolve({ type: 'cancel' })
		}
	})
}

let tabsConnection: any = null

/** Android Custom Tabs service connection helper — binds the app to the
 *  browser's CustomTabsService and hands the CustomTabsClient to `run`. */
function withTabsClient(
	packageName: string | undefined,
	run: (client: any) => void,
): Promise<void> {
	return new Promise((resolve) => {
		const androidUtils = Utils.android as any
		const context = androidUtils?.getApplicationContext?.()
		const androidx = (globalThis as any).androidx?.browser?.customtabs
		if (!context || !androidx?.CustomTabsClient) {
			resolve()
			return
		}
		const pkg = packageName ?? 'com.android.chrome'
		const connection = new androidx.CustomTabsServiceConnection({
			onCustomTabsServiceConnected: (_name: any, client: any) => {
				try {
					run(client)
				} finally {
					resolve()
				}
			},
			onServiceDisconnected: () => {},
		})
		tabsConnection = connection
		androidx.CustomTabsClient.bindCustomTabsService(context, pkg, connection)
	})
}

export const webBrowser: WebBrowser = {
	supported: isIOS
		? typeof SFSafariViewController !== 'undefined'
		: !!(globalThis as any).androidx?.browser?.customtabs?.CustomTabsIntent,

	openBrowser(url: string, options?: OpenBrowserOptions): Promise<WebBrowserResult> {
		return isIOS ? iosOpen(url, options) : androidOpen(url, options)
	},

	dismissBrowser(): void {
		if (isIOS && presented) {
			presented.dismissViewControllerAnimatedCompletion(true, null)
			presented = null
		}
	},

	warmUp(packageName?: string): Promise<void> {
		return isIOS ? Promise.resolve() : withTabsClient(packageName, (client) => client.warmUp(0))
	},

	coolDown(packageName?: string): Promise<void> {
		if (isIOS) {
			return Promise.resolve()
		}
		const androidUtils = Utils.android as any
		const context = androidUtils?.getApplicationContext?.()
		if (context && tabsConnection) {
			context.unbindService(tabsConnection)
			tabsConnection = null
		}
		return Promise.resolve()
	},

	mayInitWithUrl(url: string, packageName?: string): Promise<void> {
		if (isIOS) {
			return Promise.resolve()
		}
		return withTabsClient(packageName, (client) => {
			const session = client.newSession(null)
			session?.mayLaunchUrl(android.net.Uri.parse(url), null, null)
		})
	},
}
