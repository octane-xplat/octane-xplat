import type { NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const EPErrorDomain: string

export declare const EPError: {
	Generic: 1
	NotADeveloperTool: 2
}

export declare const EPDeveloperToolStatus: {
	NotDetermined: 0
	Restricted: 1
	Denied: 2
	Authorized: 3
}

export declare class EPExecutionPolicy extends NSObject {
	init(): this

	addPolicyExceptionForURLError(url: NSURL, error: interop.PointerConvertible): boolean
}

export declare class EPDeveloperTool extends NSObject {
	init(): this

	readonly authorizationStatus: interop.Enum<typeof EPDeveloperToolStatus>

	requestDeveloperToolAccessWithCompletionHandler(handler: (p1: boolean) => void): void
}
