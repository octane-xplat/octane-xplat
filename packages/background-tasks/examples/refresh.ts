/** App-owned refresh experiment; import before the native app starts. */
import { backgroundTasks, type TaskResult } from '@octane-xplat/background-tasks'
import { storage } from '@octane-xplat/platform'

export const taskName = 'record-refresh'
const enabledKey = 'refresh.enabled'
const foregroundKey = 'refresh.foreground-at'
const backgroundKey = 'refresh.background-at'
const requestKey = 'refresh.request-status'
let requestedInThisModule = false

async function recordRun(kind: 'foreground' | 'background'): Promise<TaskResult> {
	try {
		storage.setString(
			kind === 'background' ? backgroundKey : foregroundKey,
			new Date().toISOString(),
		)
		return storage.flush() ? 'success' : 'failed'
	} catch {
		return 'failed'
	}
}
backgroundTasks.defineTask(taskName, () => recordRun('background'))

/** Call once during a fresh process launch, before Application.run(). */
export function requestAtNativeStartup(): void {
	if (
		requestedInThisModule ||
		!backgroundTasks.supported ||
		storage.getString(enabledKey) !== 'yes'
	)
		{return}
	requestedInThisModule = true
	// The native registration runs synchronously inside the current adapter's
	// async method. Do not await getStatus() before registering the iOS handler.
	void backgroundTasks.register(taskName, { minimumInterval: 3600 }).then(
		() => recordRequest('requested; execution unverified'),
		() => recordRequest('registration failed'),
	)
}
function recordRequest(message: string): void {
	// Diagnostic persistence is best-effort; it must not reject startup work.
	try {
		storage.setString(requestKey, message)
		storage.flush()
	} catch {}
}

export function enableForNextLaunch(): boolean {
	storage.setString(enabledKey, 'yes')
	return storage.flush()
}

export async function disableRefresh(): Promise<void> {
	let saved = false
	try {
		storage.remove(enabledKey)
		saved = storage.flush()
	} catch {}
	if (backgroundTasks.supported) {await backgroundTasks.unregister(taskName)}
	if (!saved) {throw new Error('Could not save disabled preference')}
}

export async function refreshNow(): Promise<TaskResult> {
	return recordRun('foreground')
}

export function readEvidence() {
	return {
		enabledForNextLaunch: storage.getString(enabledKey) === 'yes',
		foregroundAt: storage.getString(foregroundKey),
		backgroundAt: storage.getString(backgroundKey),
		requestStatus: storage.getString(requestKey),
	}
}
