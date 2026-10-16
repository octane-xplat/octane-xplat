import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const AppTrackingTransparencyVersionString: interop.Pointer

export declare const AppTrackingTransparencyVersionNumber: number

export declare const ATTrackingManagerAuthorizationStatus: {
	NotDetermined: 0
	Restricted: 1
	Denied: 2
	Authorized: 3
}

export declare class ATTrackingManager extends NSObject {
	static readonly trackingAuthorizationStatus: interop.Enum<
		typeof ATTrackingManagerAuthorizationStatus
	>

	static requestTrackingAuthorizationWithCompletionHandler(
		completion: (p1: interop.Enum<typeof ATTrackingManagerAuthorizationStatus>) => void,
	): void
}
