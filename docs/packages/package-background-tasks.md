# @octane-xplat/background-tasks

> OS-scheduled periodic background work for Octane xplat — BGTaskScheduler and WorkManager

Define deferrable work for iOS/Android scheduler experiments. The OS chooses
when work runs; this is not an exact timer. On iOS the launch handler reports
the executor's real outcome, completes exactly once on expiration, and
resubmits the next request after each run while the task stays enabled. The
Android cold-start/completion bridge still has open gaps
([#71](https://github.com/octane-xplat/octane-xplat/issues/71)). Do not treat
scheduling as a production delivery guarantee. Web/desktop are unsupported.

Follow [Run a background refresh](https://octane-xplat.goddardai.org/background-work)
for a maintained timestamp job, foreground recovery screen, native configuration,
launch-time registration, disable and execution checks.


[Generated API reference](https://octane-xplat.goddardai.org/api-background-tasks).

## Define a small task

Install in an existing Xplat app:

```sh
bun add @octane-xplat/background-tasks @octane-xplat/platform
```

Define tasks at module scope in a module imported at native startup. Keep their
results outside mounted screens, and confirm durable writes. This definition
records an execution attempt; it does not itself schedule or prove OS delivery:

```ts
import { backgroundTasks } from '@octane-xplat/background-tasks'
import { storage } from '@octane-xplat/platform'

backgroundTasks.defineTask('record-refresh', async () => {
  try {
    storage.setString('refresh.background-at', new Date().toISOString())
    return storage.flush() ? 'success' : 'failed'
  } catch {
    return 'failed'
  }
})
```

Use the guide's [native configuration](https://octane-xplat.goddardai.org/background-work#configure-the-native-experiment)
and [startup request](https://octane-xplat.goddardai.org/background-work#request-once-at-startup)
before scheduling. On iOS, the task requires a permitted full identifier;
`defineTask` registers the launch handler once at module scope, so scheduling
with `register()` is safe from a button or a launch-time re-request. Android
carries a WorkManager bridge with a 15-minute interval floor, but its current
worker does not bootstrap a dead JS runtime.

Keep the [foreground fallback](https://octane-xplat.goddardai.org/background-work#disable-retry-and-fall-back).
The interval is in seconds and is a scheduling hint. `isRegistered` only checks
the current JS map, not the OS queue. Executors can observe `context.expired`
to stop promptly when the OS reclaims a run. The iOS simulator rejects task
submission, so qualify a persisted execution timestamp and subsequent delivery
on a physical device using the guide's
[device procedure](https://octane-xplat.goddardai.org/background-work#prove-execution-separately).
