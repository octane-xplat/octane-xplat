# Run a background refresh

> Record refresh execution separately from scheduling, keep a foreground recovery action, and understand the current native lifecycle limits.

Give your app a **Refresh now** action that records when work ran. Then define
the same small job for background delivery and inspect a separate background
timestamp. This separation lets you tell an actual execution from a registration
request or a foreground button press.

The current native scheduler has consequential gaps: Android cannot bootstrap
a dead runtime ([#71](https://github.com/octane-xplat/octane-xplat/issues/71)),
and iOS does not correctly handle outcomes, expiration or recurring requests
([#72](https://github.com/octane-xplat/octane-xplat/issues/72)). Treat scheduling
below as a qualification experiment, not a production delivery guarantee. Keep
the foreground path usable. Web and desktop do not schedule this service.

Use background work for a refresh that can wait. The OS chooses its delivery
time; it is unsuitable for an exact alarm, a continuously running process, or
a guarantee that data will update while the app is closed. Android periodic
work has a 15-minute minimum and can run later because of system restrictions;
see [WorkManager intervals](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work).

## Make the refresh observable

Start with a running app and install the packages:

```sh
bun add @octane-xplat/background-tasks @octane-xplat/platform
```

Copy the maintained [refresh.ts example](../../packages/background-tasks/examples/refresh.ts)
into `src/background/refresh.ts`. It defines a tiny timestamp-writing job at
module load, keeps foreground/background evidence in separate settings keys,
and checks whether settings could be flushed. No network, account, location
permission or mounted screen is needed to execute this job.

Add `src/background/RefreshScreen.tsx`:

```tsx
import { useState } from 'octane'
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { backgroundTasks } from '@octane-xplat/background-tasks'
import { disableRefresh, enableForNextLaunch, readEvidence, refreshNow } from './refresh'

export function RefreshScreen() {
  const [evidence, setEvidence] = useState(readEvidence)
  const [message, setMessage] = useState('Try Refresh now first.')
  return <VStack>
    <Text>Foreground: {evidence.foregroundAt ?? 'Not run'}</Text>
    <Text>Background: {evidence.backgroundAt ?? 'Not observed'}</Text>
    <Text>Scheduling: {evidence.requestStatus ?? 'Not requested'}</Text>
    <Text>{message}</Text>
    <Pressable onPress={async () => {
      const result = await refreshNow()
      setEvidence(readEvidence())
      setMessage(result === 'success' ? 'Foreground refresh recorded.' : 'Could not save refresh evidence.')
    }}><Text>Refresh now</Text></Pressable>
    <Pressable onPress={async () => {
      if (!backgroundTasks.supported || (await backgroundTasks.getStatus()) !== 'available') {
        setMessage('Background refresh is unavailable or restricted. Use Refresh now.')
        return
      }
      setMessage(enableForNextLaunch() ? 'Enabled for the next fresh app launch.' : 'Could not save the preference.')
      setEvidence(readEvidence())
    }}><Text>Enable on next launch</Text></Pressable>
    <Pressable onPress={async () => {
      try {
        await disableRefresh()
        setMessage('Future refresh requests disabled. An already-running task may finish.')
      } catch {
        setMessage('Could not confirm disable. Check settings and retry.')
      }
      setEvidence(readEvidence())
    }}><Text>Disable refresh</Text></Pressable>
    <Pressable onPress={() => setEvidence(readEvidence())}>
      <Text>Read execution evidence</Text>
    </Pressable>
  </VStack>
}
```

Render that component inside your app's existing screen/layout. In the starter,
import it into `src/App.tsrx` and place it inside the existing `SafeArea`. For a
router app, place it in a route component:

```tsx
import { RefreshScreen } from './background/RefreshScreen'

export function RefreshExample() {
  return <RefreshScreen />
}
```

Press **Refresh now**. Expect a new foreground timestamp and **Foreground refresh
recorded**. The background timestamp must remain **Not observed**. Reopening the
app should preserve the foreground value; a failed flush reports failure, so
an in-memory value alone does not establish durable storage.

The job is deliberately small. Replace its body with a bounded, idempotent
refresh only after the scheduler is qualified. Idempotent means retrying the
job has the same final effect as running it once. Save useful results outside
component state; a background launch may have no mounted screen. Fetching
private data also needs an app-owned credential/retry policy that works without
showing a sign-in dialog.

## Configure the native experiment

On iOS, add or merge these entries into the root dictionary in
`App_Resources/iOS/Info.plist`. Preserve entries used by other app features:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
</array>
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
  <string>com.octanexplat.tasks.record-refresh</string>
</array>
```

The full identifier is the adapter's prefix plus the task name. The package
carries native background-mode metadata, but your app must supply its allowed
identifier. This adapter submits an app-refresh request; the extra `processing`
mode in package metadata does not give it a separate processing-task API.

Apple requires each launch handler to be registered once, before app launch
finishes. A second registration of the same identifier can terminate the app;
see [Apple's registration contract](https://developer.apple.com/documentation/backgroundtasks/bgtaskscheduler/register(fortaskwithidentifier:using:launchhandler:)).
The wrapper currently combines handler registration and scheduling. This example
therefore persists enablement for the **next fresh process launch**, rather than
calling registration from a screen button or repeatedly from an effect.

For Android, the package provides its WorkManager dependency, worker and native
manifest integration. This timestamp task needs no location permission or
foreground-service UI. Do not add location/geofencing permissions just to try
it. Rebuild after adding the package or changing native resources.

## Request once at startup

The example's task definition already runs when `refresh.ts` is imported.
In the starter's native `src/main.ts`, add the import, then request registration
before its existing `Application.run`/`resetRootView` branch. Keep the rest of
the starter bootstrap. `Application` is already imported there; keep one copy
of that import (shown here for context):

```ts
import { Application } from '@nativescript/core'
import { requestAtNativeStartup } from './background/refresh'

// Insert before the existing native startup branch; do not add another run().
if (!Application.started) requestAtNativeStartup()
```

The helper attempts scheduling only when the preference was saved and this
module has not already requested it. Do not insert an `await getStatus()` before
this launch-time call: moving handler registration past app launch is unsafe.
Use availability checks at the enable action, as shown on the screen.

Use a freshly built, installed app to qualify startup. The native development
session may start its placeholder shell before evaluating app modules; the
`Application.started` guard intentionally skips registration in that case.
Hot reload is not a reliable way to repeat iOS registration in the same process.
Follow [native build/distribution](../start/native-release.md) for the installed
app path, then fully restart that test app after enabling the preference.

The screen distinguishes **requested; execution unverified** from a background
run. The service's `isRegistered` reads an in-memory map; it does not query the
OS's durable queue or prove the worker ran. Use it only as that narrower check:

```ts
import { backgroundTasks } from '@octane-xplat/background-tasks'

export async function hasLocalRegistrationRecord() {
  return backgroundTasks.supported && await backgroundTasks.isRegistered('record-refresh')
}
```

## Disable, retry and fall back

Disabling clears and flushes the saved preference and requests cancellation.
It does not promise to interrupt an executor already running. If saving or
cancellation fails, expose the failure and allow another disable attempt:

```ts
import { disableRefresh } from './refresh'

export async function turnOffRefresh() {
  await disableRefresh() // The screen above catches failure and offers retry.
}
```

If iOS reports restricted availability, inspect the device's Background App
Refresh settings and power restrictions. There is no permission dialog in this
API to override OS policy. Keep **Refresh now** for unavailable scheduling,
network failures, stale data or any task that must run while the user waits:

```ts
import { refreshNow } from './refresh'

export async function refreshWhileOpen() {
  return refreshNow()
}
```

The task's return value describes its own work, but the current native delivery
bridge has these limits. They remain framework issues even if registration
returns successfully:

| Target | Current limitation | Consequence |
| --- | --- | --- |
| Android | Worker retries when no NativeScript runtime exists; it does not bootstrap task definitions | Process-dead execution is unsupported by that path; track #71 |
| Android | Worker result handling does not match the asynchronous JS completion callback | A worker success/retry cannot establish the executor's actual outcome; track #71 |
| iOS | Handler always reports success and has no expiration cleanup | Failed or expired work is not propagated correctly; track #72 |
| iOS | One request is submitted; completion does not resubmit it | The configured interval is not a recurring-delivery guarantee; track #72 |
| iOS | Registration and scheduling share one method | Repeated enable/reschedule calls are unsafe; this experiment enables for a fresh launch |
| Web/desktop | Scheduler reports unsupported | Use foreground refresh or a target-specific scheduling service |

Do not build around these gaps with a timer, a second iOS registration, or an
unverified private worker invocation. For production scheduling, resolve and
qualify the native lifecycle issues or integrate a separately owned, proven
scheduler with explicit platform boundaries.

## Prove execution separately

Use an owned test app and record target, build, OS/device, scheduling time,
execution timestamp and observed process state:

1. Run **Refresh now** and confirm only the foreground key changes.
2. Enable for next launch, restart the installed app and inspect the request
   status. Registration failure is distinct from a delayed OS delivery.
3. Background the app. Use the platform's supported development tools to
   inspect scheduled work and dispatch a controlled test run when available.
   Check the background timestamp after returning; never press Refresh now as
   a substitute for this evidence.
4. Repeat with the app process absent. On Android, do not use a force-stop as
   an equivalent process-death test: it changes whether work may run. The
   current cold-start bridge gap should remain a failed/unqualified gate.
5. Inject a controlled executor failure and expiration, then inspect native
   completion/retry status and preserved data. The current iOS outcome and
   Android completion gaps prevent claiming these checks passed.
6. Disable, restart and verify no new request is made. Observe whether an
   already-running job completes; do not label that as a new scheduled run.
7. Verify a subsequent OS delivery if recurring refresh is required. The current
   iOS adapter does not provide that recurrence by itself.

The maintained Node tests check task definition, saved intent, separate evidence
keys, flush failure, cancellation requests and unsupported fallback. Their
controlled callback invocation is not OS delivery. No native scheduler, cold
launch, suspension, expiration or periodic-device journey is qualified by those
tests or by a successful docs build.
