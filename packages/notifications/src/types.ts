/** Optional capability — never throws for absence (docs/platform/platform-services.md). */
export interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	/** usable iff supported && ensured */
	impl: T | null
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export interface NotificationsImpl {
	notify(title: string, body?: string): void
}
