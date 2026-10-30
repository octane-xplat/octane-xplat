/** Local-notification façade; push (APNs/FCM) is intentionally out of scope. */
export interface NotificationsImpl {
	/** Post a local notification. Fire-and-forget: silently dropped when
	 *  permission is not granted. On iOS the plugin schedules a fixed ~2s
	 *  trigger, so delivery lags the immediate macOS/web path. */
	notify(title: string, body?: string): void
}

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'
