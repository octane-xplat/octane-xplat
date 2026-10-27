export interface NotificationsImpl {
	notify(title: string, body?: string): void
}

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'
