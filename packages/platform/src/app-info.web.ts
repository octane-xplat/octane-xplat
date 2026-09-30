// App info — web leaf. A browser bundle has no trustworthy native version,
// build, or bundle identifier, so the contract reports that honestly.
import type { AppInfo } from './types'
import { desktopHostBootstrap } from './host-runtime.web'

export const appInfo: AppInfo = desktopHostBootstrap()?.appInfo ?? {
	supported: false,
	version: null,
	build: null,
	bundleId: null,
}
