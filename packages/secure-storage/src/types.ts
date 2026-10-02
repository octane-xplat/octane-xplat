/** Optional capability — never throws for absence (docs/platform/platform-services.md). */
export interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	/** usable iff supported && ensured */
	impl: T | null
}

export interface SecureStore {
	get(key: string): Promise<string | null>
	set(key: string, value: string): Promise<boolean>
	remove(key: string): Promise<boolean>
}
