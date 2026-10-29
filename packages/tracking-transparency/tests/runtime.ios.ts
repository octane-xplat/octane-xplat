const applicationActive = 0 // UIApplicationStateActive from UIKit.
import { Application, File, Label, Page, knownFolders, path } from '@nativescript/core'
import * as Tracking from '../src/index'
const NativeTracking = (
	globalThis as unknown as { XplatTrackingTransparency: { 'new'(): { read(): string } } }
).XplatTrackingTransparency.new()
const nativeStatus = () => Number(JSON.parse(NativeTracking.read()).status)
const folder = knownFolders.documents().path
const request = JSON.parse(
	File.fromPath(path.join(folder, 'tracking-request.json')).readTextSync(),
) as { mode: 'missing-purpose' | 'configured'; nonce: string }
const checks: string[] = []
const assert = (condition: unknown, message: string) => {
	if (!condition) {
		throw new Error(message)
	}
	checks.push(message)
}
const result = (phase: string, error?: unknown) => {
	File.fromPath(path.join(folder, 'tracking-result.json')).writeTextSync(
		JSON.stringify({
			nonce: request.nonce,
			mode: request.mode,
			phase,
			passed: !error,
			checks,
			...(error ? { error: String(error) } : {}),
		}),
	)
}
const page = new Page(),
	label = new Label()
label.text = 'Tracking permission guard checks'
page.content = label
let started = false
let backgroundArmed = false
const suspended = () => {
	if (!backgroundArmed) {
		return
	}
	backgroundArmed = false
	void (async () => {
		try {
			assert(
				UIApplication.sharedApplication.applicationState !== applicationActive,
				'real UIApplication is inactive for the negative lifecycle case',
			)
			let failure = ''
			try {
				await Tracking.requestTrackingPermissionsAsync()
			} catch (error) {
				failure = String(error)
			}
			assert(
				failure.includes('active foreground app action'),
				'inactive requests reject before invoking the ATT prompt',
			)
			result('complete')
		} catch (error) {
			result('complete', error)
		}
	})()
}
Application.ios.addNotificationObserver(UIApplicationDidEnterBackgroundNotification, suspended)
page.on(Page.loadedEvent, () => {
	if (started) {
		return
	}
	started = true
	void (async () => {
		try {
			await new Promise<void>((resolve) => setTimeout(resolve, 300))
			assert(
				UIApplication.sharedApplication.applicationState === applicationActive,
				'real UIApplication is active after launch',
			)
			assert(Tracking.isAvailable(), 'native tracking bridge is available')
			assert(
				Tracking.TrackingTransparency.capabilities.prompt,
				'iOS ATT prompt capability comes from the real native bridge',
			)
			const before = nativeStatus()
			const permission = await Tracking.getTrackingPermissionsAsync()
			const names = ['not-determined', 'restricted', 'denied', 'authorized']
			assert(
				permission.authorizationStatus === names[before],
				'facade preserves the actual ATTrackingManager authorization state',
			)
			assert(
				permission.status === (before === 3 ? 'granted' : before === 0 ? 'undetermined' : 'denied'),
				'portable permission status maps the real native state',
			)
			assert(permission.expires === 'never', 'permission expiration follows the Expo contract')
			assert(permission.granted === (before === 3), 'granted reflects actual OS authorization')
			assert(
				Tracking.getAdvertisingId() === null,
				'simulator exposes no IDFA through the synchronous getter',
			)
			assert(
				(await Tracking.getAdvertisingIdAsync()) === null,
				'simulator exposes no IDFA through the asynchronous getter',
			)
			assert(
				nativeStatus() === before,
				'reads do not change tracking authorization or request a prompt',
			)
			if (request.mode === 'missing-purpose') {
				assert(
					!NSBundle.mainBundle.objectForInfoDictionaryKey('NSUserTrackingUsageDescription'),
					'negative fixture has no purpose string',
				)
				// Harness-directed negative action: validation must reject before any prompt.
				const first = Tracking.requestTrackingPermissionsAsync(),
					second = Tracking.requestTrackingPermissionsAsync()
				assert(first === second, 'concurrent facade callers share one pending request')
				let failure = ''
				try {
					await first
				} catch (error) {
					failure = String(error)
				}
				assert(
					failure.includes('NSUserTrackingUsageDescription'),
					'missing purpose rejects as configuration instead of crashing or prompting',
				)
				let retry = ''
				try {
					await Tracking.requestTrackingPermissionsAsync()
				} catch (error) {
					retry = String(error)
				}
				assert(
					retry.includes('NSUserTrackingUsageDescription'),
					'failed request releases coordination for an explicit retry',
				)
				assert(nativeStatus() === before, 'invalid requests leave the OS permission unchanged')
				result('complete')
			} else {
				assert(
					typeof NSBundle.mainBundle.objectForInfoDictionaryKey(
						'NSUserTrackingUsageDescription',
					) === 'string',
					'configured fixture has its real purpose string',
				)
				backgroundArmed = true
				result('waiting-background')
			}
		} catch (error) {
			result('complete', error)
		}
	})()
})
Application.run({ create: () => page })
