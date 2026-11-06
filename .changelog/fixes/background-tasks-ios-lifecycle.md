---
hype: 50
---

### iOS background refresh honors outcomes, expiration and recurrence

On iOS, a background-task run now reports the executor's real result instead of always succeeding, completes exactly once when the OS expires the run, and submits the next refresh request after each run while the task stays enabled — so registered work actually recurs. `defineTask` registers Apple's required launch handler once at module scope, which makes `register()` pure scheduling that is safe to call from an enable action or at every launch.

```ts
backgroundTasks.defineTask('sync', async (context) => {
  const first = await fetchDelta()
  if (context.expired) {
    return 'failed' // OS reclaimed the run; stop promptly
  }
  return (await persist(first)) ? 'success' : 'failed'
})

// Idempotent scheduling — call on every launch or from an enable action.
await backgroundTasks.register('sync', { minimumInterval: 3600 })
```

Executors that can stop early should watch `context.expired`; a run the OS reclaims is completed as failed and a late result is discarded.

[Background work guide](https://octane-xplat.goddardai.org/background-work)
