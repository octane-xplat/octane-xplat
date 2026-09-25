// App info — native leaf. Read the values from the installed app bundle.
import { Application } from '@nativescript/core'
import type { AppInfo } from './types'

function value(value: unknown): string | null {
	return value === undefined || value === null ? null : String(value)
}

function read(): AppInfo {
	if (Application.android) {
		const context = Application.android.context
		const packageId = context.getPackageName()
		const packageInfo = context.getPackageManager().getPackageInfo(packageId, 0)
		return {
			supported: true,
			version: value(packageInfo.versionName),
			build: value(packageInfo.versionCode),
			bundleId: packageId,
		}
	}

	if (Application.ios) {
		const bundle = NSBundle.mainBundle
		return {
			supported: true,
			version: value(bundle.objectForInfoDictionaryKey('CFBundleShortVersionString')),
			build: value(bundle.objectForInfoDictionaryKey('CFBundleVersion')),
			bundleId: value(bundle.bundleIdentifier),
		}
	}

	return { supported: false, version: null, build: null, bundleId: null }
}

// `Application.android.context` doesn't exist while the bundled entry is
// being evaluated (Application.onCreate), so read() must not run at module
// scope. Defer until first property access.
let cached: AppInfo | undefined
function info(): AppInfo {
	return (cached ??= read())
}

export const appInfo: AppInfo = {
	get supported() {
		return info().supported
	},
	get version() {
		return info().version
	},
	get build() {
		return info().build
	},
	get bundleId() {
		return info().bundleId
	},
}
