import type {
	NSCoder,
	NSCopying,
	NSError,
	NSItemProvider,
	NSSecureCoding,
	NSURL,
} from './Foundation'

import type { interop } from './objc-runtime'

import { NSView } from './AppKit'

import { NSObject } from './Runtime'

export declare const LPErrorDomain: string

export declare const LPErrorCode: {
	Unknown: 1
	MetadataFetchFailed: 2
	MetadataFetchCancelled: 3
	MetadataFetchTimedOut: 4
}

export declare class LPMetadataProvider extends NSObject {
	startFetchingMetadataForURLCompletionHandler(
		URL: NSURL,
		completionHandler: (p1: LPLinkMetadata, p2: NSError) => void | null,
	): void

	cancel(): void

	shouldFetchSubresources: boolean

	timeout: number
}

export declare class LPLinkView extends NSView {
	initWithURL(URL: NSURL): this

	initWithMetadata(metadata: LPLinkMetadata): this

	metadata: LPLinkMetadata
}

export declare class LPLinkMetadata extends NSObject implements NSCopying, NSSecureCoding {
	originalURL: NSURL

	URL: NSURL

	title: string

	iconProvider: NSItemProvider

	imageProvider: NSItemProvider

	videoProvider: NSItemProvider

	remoteVideoURL: NSURL

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
