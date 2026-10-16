import type { NSArray, NSData, NSDate } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const VSErrorInfoKeyUnsupportedProviderIdentifier: string

export declare const VSErrorInfoKeySAMLResponseStatus: string

export declare const VSErrorInfoKeySAMLResponse: string

export declare const VSCheckAccessOptionPrompt: string

export declare const VSAccountProviderAuthenticationSchemeSAML: string

export declare const VSErrorDomain: string

export declare const VSErrorInfoKeyAccountProviderResponse: string

export declare const VSAccountProviderAuthenticationSchemeAPI: string

export declare const VSErrorCode: {
	AccessNotGranted: 0
	UnsupportedProvider: 1
	UserCancelled: 2
	ServiceTemporarilyUnavailable: 3
	ProviderRejected: 4
	InvalidVerificationToken: 5
	Rejected: 6
	Unsupported: 7
}

export declare const VSSubscriptionAccessLevel: {
	Unknown: 0
	FreeWithAccount: 1
	Paid: 2
}

export declare const VSAccountAccessStatus: {
	NotDetermined: 0
	Restricted: 1
	Denied: 2
	Granted: 3
}

export declare interface VSAccountManagerDelegate extends NSObjectProtocol {
	accountManagerShouldAuthenticateAccountProviderWithIdentifier?(
		accountManager: VSAccountManager,
		accountProviderIdentifier: string,
	): boolean
}

export declare class VSAccountManagerDelegate
	extends NativeObject
	implements VSAccountManagerDelegate {}

export declare class VSAccountMetadataRequest extends NSObject {
	channelIdentifier: string

	get supportedAccountProviderIdentifiers(): NSArray
	set supportedAccountProviderIdentifiers(value: NSArray<interop.Object> | Array<interop.Object>)

	get featuredAccountProviderIdentifiers(): NSArray
	set featuredAccountProviderIdentifiers(value: NSArray<interop.Object> | Array<interop.Object>)

	verificationToken: string

	includeAccountProviderIdentifier: boolean

	includeAuthenticationExpirationDate: boolean

	localizedVideoTitle: string

	interruptionAllowed: boolean

	forceAuthentication: boolean

	get attributeNames(): NSArray
	set attributeNames(value: NSArray<interop.Object> | Array<interop.Object>)

	get supportedAuthenticationSchemes(): NSArray
	set supportedAuthenticationSchemes(value: NSArray<interop.Object> | Array<interop.Object>)

	accountProviderAuthenticationToken: string

	get applicationAccountProviders(): NSArray
	set applicationAccountProviders(value: NSArray<interop.Object> | Array<interop.Object>)

	isInterruptionAllowed(): boolean
}

export declare class VSAccountMetadata extends NSObject {
	readonly accountProviderIdentifier: string

	readonly authenticationExpirationDate: NSDate

	readonly verificationData: NSData

	readonly SAMLAttributeQueryResponse: string

	readonly accountProviderResponse: VSAccountProviderResponse
}

export declare class VSAccountApplicationProvider extends NSObject {
	initWithLocalizedDisplayNameIdentifier(localizedDisplayName: string, identifier: string): this

	readonly localizedDisplayName: string

	readonly identifier: string
}

export declare class VSSubscription extends NSObject {
	expirationDate: NSDate

	accessLevel: interop.Enum<typeof VSSubscriptionAccessLevel>

	get tierIdentifiers(): NSArray
	set tierIdentifiers(value: NSArray<interop.Object> | Array<interop.Object>)

	billingIdentifier: string
}

export declare class VSAccountManager extends NSObject {
	delegate: VSAccountManagerDelegate | null
}

export declare class VSAccountManagerResult extends NSObject {
	cancel(): void
}

export declare class VSAccountProviderResponse extends NSObject {
	readonly authenticationScheme: string

	readonly status: string

	readonly body: string
}

export declare class VSSubscriptionRegistrationCenter extends NSObject {
	static defaultSubscriptionRegistrationCenter(): VSSubscriptionRegistrationCenter

	setCurrentSubscription(currentSubscription: VSSubscription | null): void
}
