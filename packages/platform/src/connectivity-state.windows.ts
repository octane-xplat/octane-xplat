import { Windows } from '@octane-xplat/platform/windows'
import type { ConnectionType, ConnectivityState } from './types'

const unavailable = (): ConnectivityState => ({ supported: false, online: false, type: 'unknown' })
const offline = (): ConnectivityState => ({ supported: true, online: false, type: 'none' })

function transport(profile: any): ConnectionType {
	try {
		if (profile.IsWwanConnectionProfile === true) {
			return 'mobile'
		}
	} catch {}
	try {
		if (profile.IsWlanConnectionProfile === true) {
			return 'wifi'
		}
	} catch {}
	try {
		const type = profile.NetworkAdapter?.IanaInterfaceType
		if (type === 6) {
			return 'ethernet'
		}

		if (type === 71) {
			return 'wifi'
		}
	} catch {}
	return 'unknown'
}

/** Online state must not depend on recognizing the adapter's transport type. */
export function readWindowsConnectivity(): ConnectivityState {
	try {
		const api = Windows?.Networking?.Connectivity
		if (typeof api?.NetworkInformation?.GetInternetConnectionProfile !== 'function') {
			return unavailable()
		}

		const profile = api.NetworkInformation.GetInternetConnectionProfile()
		if (profile === null) {
			return offline()
		}

		if (!profile) {
			return unavailable()
		}

		const level = profile.GetNetworkConnectivityLevel()
		const levels = api.NetworkConnectivityLevel
		if (
			!Number.isInteger(level) ||
			typeof levels?.None !== 'number' ||
			![
				levels.None,
				levels.LocalAccess,
				levels.ConstrainedInternetAccess,
				levels.InternetAccess,
			].includes(level)
		) {
			return unavailable()
		}

		return level === levels.None
			? offline()
			: { supported: true, online: true, type: transport(profile) }
	} catch {
		return unavailable()
	}
}
