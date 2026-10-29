import type { TrackingCapabilities } from './types'
export interface TrackingBackend {
	readonly identifierFormat?: 'uuid' | 'alphanumeric'
	capabilities(): TrackingCapabilities
	/** -1: no ATT gate, 0: not determined, 1: restricted, 2: denied, 3: authorized. */
	read(): number
	request(): Promise<number>
	advertisingId(): string | null
	advertisingIdAsync(): Promise<string | null>
}
