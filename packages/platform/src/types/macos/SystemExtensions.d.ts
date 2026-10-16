import type { NSError, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const OSSystemExtensionErrorDomain: string

export declare const NSSystemExtensionUsageDescriptionKey: string

export declare const OSBundleUsageDescriptionKey: string

export declare const OSSystemExtensionRequestResult: {
	Completed: 0
	WillCompleteAfterReboot: 1
}

export declare const OSSystemExtensionReplacementAction: {
	Cancel: 0
	Replace: 1
}

export declare const OSSystemExtensionErrorCode: {
	Unknown: 1
	MissingEntitlement: 2
	UnsupportedParentBundleLocation: 3
	ExtensionNotFound: 4
	ExtensionMissingIdentifier: 5
	DuplicateExtensionIdentifer: 6
	UnknownExtensionCategory: 7
	CodeSignatureInvalid: 8
	ValidationFailed: 9
	ForbiddenBySystemPolicy: 10
	RequestCanceled: 11
	RequestSuperseded: 12
	AuthorizationRequired: 13
}

export declare interface OSSystemExtensionRequestDelegate extends NSObjectProtocol {
	requestActionForReplacingExtensionWithExtension(
		request: OSSystemExtensionRequest,
		existing: OSSystemExtensionProperties,
		ext: OSSystemExtensionProperties,
	): interop.Enum<typeof OSSystemExtensionReplacementAction>

	requestNeedsUserApproval(request: OSSystemExtensionRequest): void

	requestDidFinishWithResult(
		request: OSSystemExtensionRequest,
		result: interop.Enum<typeof OSSystemExtensionRequestResult>,
	): void

	requestDidFailWithError(request: OSSystemExtensionRequest, error: NSError): void
}

export declare class OSSystemExtensionRequestDelegate
	extends NativeObject
	implements OSSystemExtensionRequestDelegate {}

export declare class OSSystemExtensionProperties extends NSObject {
	readonly URL: NSURL

	readonly bundleIdentifier: string

	readonly bundleVersion: string

	readonly bundleShortVersion: string
}

export declare class OSSystemExtensionRequest extends NSObject {
	static activationRequestForExtensionQueue<This extends abstract new (...args: any) => any>(
		this: This,
		identifier: string,
		queue: NSObject,
	): InstanceType<This>

	static deactivationRequestForExtensionQueue<This extends abstract new (...args: any) => any>(
		this: This,
		identifier: string,
		queue: NSObject,
	): InstanceType<This>

	delegate: OSSystemExtensionRequestDelegate

	readonly identifier: string
}

export declare class OSSystemExtensionManager extends NSObject {
	static readonly sharedManager: OSSystemExtensionManager

	submitRequest(request: OSSystemExtensionRequest): void
}
