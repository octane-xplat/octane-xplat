// Adapter registry — one adapter per release-boundary platform. Adapters
// own the platform mechanics; the runtime service owns sessions, jobs,
// ownership and evidence.

import { createAndroidAdapter } from './android.ts'
import { createIosAdapter } from './ios.ts'
import { createLinuxAdapter } from './linux.ts'
import { createMacosAdapter } from './macos.ts'
import { createWebAdapter } from './web.ts'
import { createWindowsAdapter } from './windows.ts'

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
