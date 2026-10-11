// Adapter registry — one adapter per release-boundary platform. Adapters
// own the platform mechanics; the runtime service owns sessions, jobs,
// ownership and evidence.

import { createAndroidAdapter } from './android.mjs'
import { createIosAdapter } from './ios.mjs'
import { createLinuxAdapter } from './linux.mjs'
import { createMacosAdapter } from './macos.mjs'
import { createWebAdapter } from './web.mjs'
import { createWindowsAdapter } from './windows.mjs'

export function createAdapters() {
	const list = [
		createWebAdapter(),
		createIosAdapter(),
		createAndroidAdapter(),
		createMacosAdapter(),
		createLinuxAdapter(),
		createWindowsAdapter(),
	]

	return new Map(list.map((adapter) => [adapter.platform, adapter]))
}
