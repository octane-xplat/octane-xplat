/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./AppKit.d.ts" />

declare const LPErrorDomain: string

declare const LPErrorCode: {
	Unknown: 1
	MetadataFetchFailed: 2
	MetadataFetchCancelled: 3
	MetadataFetchTimedOut: 4
}

declare class LPMetadataProvider extends NSObject {
	startFetchingMetadataForURLCompletionHandler(
		URL: NSURL,
		completionHandler: (p1: LPLinkMetadata, p2: NSError) => void | null,
	): void

	cancel(): void

	shouldFetchSubresources: boolean

	timeout: number
}

declare class LPLinkView extends NSView {
	initWithURL(URL: NSURL): this

	initWithMetadata(metadata: LPLinkMetadata): this

	metadata: LPLinkMetadata
}

declare class LPLinkMetadata extends NSObject implements NSCopying, NSSecureCoding {
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
