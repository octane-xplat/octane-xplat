# @octane-xplat/background-tasks

Schedule periodic background work on iOS and Android. The operating system
chooses when it runs; use this for deferrable refreshes, not exact timers.
Web and desktop report `supported: false`.

## Register a task

From an existing Xplat app:

```sh
pnpm add @octane-xplat/background-tasks @octane-xplat/platform
```

On iOS, the app's Info.plist needs `UIBackgroundModes` with `fetch` and
`BGTaskSchedulerPermittedIdentifiers` with the full identifier. The task named
`record-refresh` below uses `com.octanexplat.tasks.record-refresh`. Android uses
the package's WorkManager bridge. Rebuild after changing native configuration.

Import this module during startup so the task is defined before registration.
The example records a timestamp locally, which you can inspect from the app:

```ts
import { backgroundTasks } from '@octane-xplat/background-tasks'
import { storage } from '@octane-xplat/platform'

backgroundTasks.defineTask('record-refresh', async () => {
	storage.setString('last-background-refresh', new Date().toISOString())
	storage.flush()
	return 'success'
})

export async function enableRefresh() {
	if (!backgroundTasks.supported) return false
	if ((await backgroundTasks.getStatus()) !== 'available') return false
	await backgroundTasks.register('record-refresh', { minimumInterval: 3600 })
	return backgroundTasks.isRegistered('record-refresh')
}

export async function disableRefresh() {
	if (backgroundTasks.supported) await backgroundTasks.unregister('record-refresh')
}
```

Call `enableRefresh` when the feature is enabled and `disableRefresh` when it is
disabled. Registration success does not prove the OS executed the task. Verify
that the stored timestamp changes in a background run on each target.
The interval is in seconds; Android has a 15-minute minimum. OS restrictions
may delay or prevent delivery.

See the [task contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/background-tasks/src/types.ts)
and [device feature guidance](https://octane-xplat.goddardai.org/platform-services)
for service availability. Cold-start and suspended execution require device
qualification; an imported module or a successful build is insufficient.
