@NativeClass()
class OrientationDelegate extends UIResponder implements UIApplicationDelegate {
	static ObjCProtocols = [UIApplicationDelegate]
	applicationSupportedInterfaceOrientationsForWindow(
		_app: UIApplication,
		window: UIWindow,
	): UIInterfaceOrientationMask {
		const requested = Screen.getIOSSupportedInterfaceOrientations(window)
		const mask = conflict ? 2 : requested
		diagnostics.push({
			forwarded: true,
			same: window === Application.primaryWindow?.ios?.uiWindow,
			mask,
		})
		return mask
	}
}
import { Application, File, Label, Page, knownFolders, path } from '@nativescript/core'
import * as Screen from '../src/index'
const folder = knownFolders.documents().path
const request = JSON.parse(
	File.fromPath(path.join(folder, 'orientation-request.json')).readTextSync(),
) as { mode: string; nonce: string }
const diagnostics: unknown[] = []
let conflict = false
if (request.mode !== 'missing-delegate') {
	Application.ios.delegate = OrientationDelegate
}
const checks: string[] = []
const assert = (condition: unknown, message: string) => {
	if (!condition) {
		throw new Error(message)
	}
	checks.push(message)
}
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const page = new Page()
const label = new Label()
label.text = 'Screen orientation lifecycle'
page.content = label
let started = false
page.on(Page.loadedEvent, () => {
	if (started) {
		return
	}
	started = true
	void (async () => {
		let error: unknown
		try {
			await wait(300)
			const window = Application.primaryWindow!.ios!.uiWindow
			const scene = window.windowScene!
			assert(Screen.ScreenOrientation.capabilities.observe, 'real primary UIWindowScene available')
			assert(
				(await Screen.getOrientationAsync()) ===
					(scene.interfaceOrientation === 3
						? Screen.Orientation.LANDSCAPE_RIGHT
						: scene.interfaceOrientation === 4
							? Screen.Orientation.LANDSCAPE_LEFT
							: scene.interfaceOrientation),
				'query reads native scene interface orientation',
			)
			if (request.mode === 'missing-delegate') {
				assert(
					!(await Screen.supportsOrientationLockAsync(Screen.OrientationLock.LANDSCAPE)),
					'missing forwarding callback reports unsupported',
				)
				let rejected = false
				try {
					await Screen.lockAsync(Screen.OrientationLock.LANDSCAPE)
				} catch {
					rejected = true
				}
				assert(rejected, 'missing delegate rejects before applying a policy')
				return
			}

			if (request.mode === 'conflicting-delegate') {
				conflict = true
				let refused: unknown
				try {
					await Screen.lockAsync(Screen.OrientationLock.LANDSCAPE_LEFT)
				} catch (error) {
					refused = error
				}
				diagnostics.push({ refusal: String(refused) })
				assert(
					Boolean(refused),
					'conflicting native delegate policy rejects instead of reporting success',
				)
				assert(
					(await Screen.getOrientationLockAsync()) === Screen.OrientationLock.PORTRAIT_UP,
					'policy query exposes the actual restrictive delegate value',
				)
				conflict = false
				await Screen.lockAsync(Screen.OrientationLock.PORTRAIT_UP)
				assert(
					scene.interfaceOrientation === 1,
					'a later request recovers after the rejected policy conflict',
				)
				return
			}
			const declared = NSBundle.mainBundle.objectForInfoDictionaryKey(
				'UISupportedInterfaceOrientations',
			)
			diagnostics.push({
				callback: UIApplication.sharedApplication.delegate?.respondsToSelector(
					'application:supportedInterfaceOrientationsForWindow:',
				),
				mask: UIApplication.sharedApplication.supportedInterfaceOrientationsForWindow(window),
				declared: String(declared),
				count: declared?.count,
				length: declared?.length,
			})
			assert(
				await Screen.supportsOrientationLockAsync(Screen.OrientationLock.PORTRAIT_UP),
				'configured portrait policy supported',
			)
			assert(
				!(await Screen.supportsOrientationLockAsync(Screen.OrientationLock.ALL)),
				'upside-down iPhone subset rejected',
			)
			await Screen.lockAsync(Screen.OrientationLock.PORTRAIT_UP)
			assert(scene.interfaceOrientation === 1, 'portrait lock reaches native scene')
			assert(
				(await Screen.getOrientationLockAsync()) === Screen.OrientationLock.PORTRAIT_UP,
				'portrait policy getter reads applied mask',
			)
			const events: Screen.OrientationChangeEvent[] = []
			const subscription = Screen.addOrientationChangeListener((event) => events.push(event))
			await Screen.lockAsync(Screen.OrientationLock.LANDSCAPE_LEFT)
			await wait(100)
			assert(scene.interfaceOrientation === 4, 'left landscape reaches native scene')
			assert(
				(await Screen.getOrientationAsync()) === Screen.Orientation.LANDSCAPE_LEFT,
				'left landscape public value matches UIKit',
			)
			assert(
				UIApplication.sharedApplication.delegate!
					.applicationSupportedInterfaceOrientationsForWindow!(
					UIApplication.sharedApplication,
					window,
				) === 16,
				'UIKit delegate enforces left-only mask',
			)
			assert(
				events.length === 1 &&
					events[0]!.orientationInfo.orientation === Screen.Orientation.LANDSCAPE_LEFT,
				'portrait-to-landscape emits exactly one native-state event',
			)
			assert(
				events[0]!.orientationInfo.horizontalSizeClass ===
					window.traitCollection.horizontalSizeClass &&
					events[0]!.orientationInfo.verticalSizeClass === window.traitCollection.verticalSizeClass,
				'iOS event size classes match the native window traits',
			)
			await Screen.lockAsync(Screen.OrientationLock.LANDSCAPE_RIGHT)
			await wait(100)
			assert(scene.interfaceOrientation === 3, 'right landscape reaches native scene')
			assert(events.length === 1, 'same-axis flip does not emit')
			await Screen.lockPlatformAsync({
				screenOrientationArrayIOS: [Screen.Orientation.PORTRAIT_UP],
			})
			await wait(100)
			assert(
				scene.interfaceOrientation === 1 && events.length === 2,
				'platform mask returns portrait and emits one transition',
			)
			assert(
				(await Screen.getPlatformOrientationLockAsync()).screenOrientationArrayIOS?.join(',') ===
					'1',
				'platform query returns actual allowed interface mask',
			)
			let rejected = false
			try {
				await Screen.lockAsync(Screen.OrientationLock.PORTRAIT_DOWN)
			} catch {
				rejected = true
			}
			assert(
				rejected && (await Screen.getOrientationLockAsync()) === Screen.OrientationLock.PORTRAIT_UP,
				'unsupported request preserves previous policy',
			)
			subscription.remove()
			subscription.remove()
			await Screen.lockAsync(Screen.OrientationLock.LANDSCAPE_LEFT)
			await wait(100)
			assert(events.length === 2, 'removed listener receives no further changes')
			await Screen.unlockAsync()
			assert(
				(await Screen.getOrientationLockAsync()) === Screen.OrientationLock.DEFAULT,
				'unlock restores DEFAULT policy',
			)
			assert(
				UIApplication.sharedApplication.delegate!
					.applicationSupportedInterfaceOrientationsForWindow!(
					UIApplication.sharedApplication,
					window,
				) === 26,
				'default restores all-but-upside-down native mask',
			)
			await Screen.lockAsync(Screen.OrientationLock.PORTRAIT_UP)
			await Screen.lockAsync(Screen.OrientationLock.PORTRAIT_UP)
			assert(scene.interfaceOrientation === 1, 'repeated policy requests finish without hanging')

			assert(
				Application.primaryWindow!.ios!.uiWindow === window &&
					window.keyWindow &&
					window.userInteractionEnabled,
				'requests preserve primary key window and input ownership',
			)
		} catch (caught) {
			error = caught
		} finally {
			File.fromPath(path.join(folder, 'orientation-result.json')).writeTextSync(
				JSON.stringify({
					nonce: request.nonce,
					mode: request.mode,
					passed: !error,
					checks,
					diagnostics,
					message: error ? String(error) : null,
				}),
			)
		}
	})()
})
Application.run({ create: () => page })
