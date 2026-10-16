import type { NSData, NSError } from './Foundation'

import { NSObject } from './Runtime'

export declare const DCErrorDomain: string

export declare const DCError: {
	UnknownSystemFailure: 0
	FeatureUnsupported: 1
	InvalidInput: 2
	InvalidKey: 3
	ServerUnavailable: 4
}

export declare class DCAppAttestService extends NSObject {
	static readonly sharedService: DCAppAttestService

	readonly supported: boolean

	generateKeyWithCompletionHandler(
		completionHandler: (p1: string, p2: NSError) => void | null,
	): void

	attestKeyClientDataHashCompletionHandler(
		keyId: string,
		clientDataHash: NSData,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): void

	generateAssertionClientDataHashCompletionHandler(
		keyId: string,
		clientDataHash: NSData,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): void

	isSupported(): boolean
}

export declare class DCDevice extends NSObject {
	static readonly currentDevice: DCDevice

	readonly supported: boolean

	generateTokenWithCompletionHandler(completion: (p1: NSData, p2: NSError) => void | null): void

	isSupported(): boolean
}
