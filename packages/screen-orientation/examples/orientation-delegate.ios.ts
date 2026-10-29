// Keep the native class first for NativeScript Vite's decorator transform.
@NativeClass()
class OrientationDelegate extends UIResponder implements UIApplicationDelegate {
	static ObjCProtocols = [UIApplicationDelegate]
	applicationSupportedInterfaceOrientationsForWindow(
		_app: UIApplication,
		window: UIWindow,
	): UIInterfaceOrientationMask {
		return getIOSSupportedInterfaceOrientations(window)
	}
}
import { Application } from '@nativescript/core'
import { getIOSSupportedInterfaceOrientations } from '../src/index'

// For a new app without a custom delegate. Add the method above to an
// existing delegate instead of replacing its lifecycle/URL methods.
Application.ios.delegate = OrientationDelegate
