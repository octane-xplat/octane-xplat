# `@octane-xplat/background-tasks`

```sh
pnpm add @octane-xplat/background-tasks
```

OS-scheduled periodic work — `BGTaskScheduler` app-refresh on iOS,
WorkManager periodic requests on Android (custom bridge; no NS plugin
exists). Mirrors `expo-task-manager`'s structural contract: `defineTask`
bodies must be declared at module scope because the OS can invoke a task on
a cold start before app code runs again.

```ts
import { backgroundTasks } from '@octane-xplat/background-tasks'

backgroundTasks.defineTask('sync-cache', async () => {
	await refreshCache()
	return 'success'
})

await backgroundTasks.register('sync-cache', { minimumInterval: 3600 })
```

The OS decides actual cadence — `minimumInterval` is an earliest hint, not a
timer (Android WorkManager floors at 15 minutes). Web/desktop report
`supported: false`.
