### New package: `@octane-xplat/background-tasks`

OS-scheduled periodic work via a custom bridge — `defineTask` at module
scope (the OS can invoke on cold start), `register({minimumInterval})`,
`unregister`, `getStatus`. iOS `BGTaskScheduler`, Android WorkManager. The
OS picks the real cadence; web/desktop report `supported: false`.
