/** Optional capability — never throws for absence (docs/platform-services.md). */
export interface Capability<T> {
	supported: boolean;
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>;
	/** usable iff supported && ensured */
	impl: T | null;
}

export type AppState = 'active' | 'background' | 'inactive';
