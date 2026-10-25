import { execFileSync } from 'node:child_process'

/** Boot a discovered simulator without requiring the optional Simulator.app UI. */
export function prepareIosSimulator(
	deviceId: string,
	exec: (command: string, args: string[], options?: { timeoutMs: number }) => string | null = (
		command,
		args,
	) => execFileSync(command, args, { encoding: 'utf8', timeout: 120_000 }),
) {
	const output = exec('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])
	if (output === null) {
		throw new Error('Unable to discover iOS simulators with xcrun simctl.')
	}
	const devices = Object.values(JSON.parse(output).devices ?? {}).flat() as Array<{
		udid: string
		state: string
	}>
	const device = devices.find((device) => device.udid === deviceId)
	// Physical devices are managed by NativeScript, not simctl.
	if (!device) {
		return
	}
	if (device.state !== 'Booted') {
		if (exec('xcrun', ['simctl', 'boot', deviceId]) === null) {
			throw new Error(`Unable to boot iOS simulator ${deviceId}.`)
		}
	}
	if (exec('xcrun', ['simctl', 'bootstatus', deviceId, '-b'], { timeoutMs: 120_000 }) === null) {
		throw new Error(`iOS simulator ${deviceId} did not finish booting.`)
	}
}
