# Define and qualify a background refresh

ID: background-refresh
Targets: ios, android
Related APIs: @octane-xplat/background-tasks, backgroundTasks.defineTask, backgroundTasks.register, backgroundTasks.unregister, backgroundTasks.getStatus, backgroundTasks.isRegistered, storage.flush

## Starting point

An app with deferrable work and a foreground recovery action. The native
scheduler currently has known lifecycle gaps; production delivery is not implied.

## Requirements

Define the task before native startup, configure each platform, request/remove
scheduling and persist inspectable evidence distinct from foreground execution.
State cold-start, outcome, expiration and recurrence limits precisely.

## Acceptance criteria

- AC1: The reader defines a bounded task with durable output, runs a separate foreground recovery action and distinguishes their evidence after restart.
- AC2: The reader configures iOS identifiers/background modes and Android integration, registers at the required launch point, and handles restricted/unsupported status without a fictional permission prompt.
- AC3: Enable/disable intent survives relaunch, scheduling is requested without repeated unsafe iOS registration, failures are observable and cancellation does not promise to interrupt in-flight work.
- AC4: A native qualification procedure distinguishes registration from actual warm/suspended/process-dead execution, task outcome/expiration and subsequent delivery; current framework blockers are named and tracked.

## Documentation

- AC1: [Observable refresh](../../../docs/platform/background-work.md#make-the-refresh-observable), [maintained module](../../../packages/background-tasks/examples/refresh.ts) and [controlled example tests](../../../packages/background-tasks/tests/refresh-guide.test.mjs).
- AC2: [Native configuration](../../../docs/platform/background-work.md#configure-the-native-experiment) and [startup request](../../../docs/platform/background-work.md#request-once-at-startup) explain launch-time registration and the development-shell boundary.
- AC3: [Enable/startup](../../../docs/platform/background-work.md#request-once-at-startup) and [disable/recovery](../../../docs/platform/background-work.md#disable-retry-and-fall-back) use persisted intent and a fresh-launch experiment instead of repeat registration.
- AC4: [Execution procedure](../../../docs/platform/background-work.md#prove-execution-separately) and [current lifecycle limits](../../../docs/platform/background-work.md#disable-retry-and-fall-back) identify Android cold-start/completion issue #71 and iOS outcome/expiration/recurrence issue #72. Native execution verification require separate execution evidence; actual delivery is blocked or unqualified as described, separately from the documented procedure.
