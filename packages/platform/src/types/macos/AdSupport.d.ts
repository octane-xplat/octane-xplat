import type { NSUUID } from './Foundation'

import { NSObject } from './Runtime'

export declare class ASIdentifierManager extends NSObject {
	static sharedManager(): ASIdentifierManager

	readonly advertisingIdentifier: NSUUID

	readonly advertisingTrackingEnabled: boolean

	isAdvertisingTrackingEnabled(): boolean
}
