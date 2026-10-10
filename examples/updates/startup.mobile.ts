import { createUpdates } from '@octane-xplat/updates'

// Replace this origin with your deployed Worker before checking for updates.
export const updates = createUpdates({
	endpoint: 'https://updates.example.com',
	embeddedVersion: '1.0.0',
	channel: 'stable',
})

// Call only after the essential screen and its required data are ready.
export async function afterSuccessfulStartup() {
	if (!updates.supported) return
	updates.markHealthy()
	const result = await updates.check()
	if (result.available) await updates.install(result.manifest)
	return updates.status()
}
