import { createUpdates } from '@octane-xplat/updates'

// 1. Replace this origin with your deployed Worker before checking for updates.
export const updates = createUpdates({
  endpoint: 'https://updates.example.com',
  embeddedVersion: '1.0.0',
  channel: 'stable',
})

// 2. Call this after the essential screen and its required data are ready.
export async function afterSuccessfulStartup() {
  if (!updates.supported) {
    return
  }

  // 3. Mark the current version healthy, then check for an update.
  updates.markHealthy()

  const result = await updates.check()

  // 4. Install an available update and report the resulting status.
  if (result.available) {
    await updates.install(result.manifest)
  }

  return updates.status()
}
