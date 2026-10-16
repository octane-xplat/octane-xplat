import type { CGSize } from './CoreFoundation'

import type {
	NSArray,
	NSData,
	NSDate,
	NSDictionary,
	NSError,
	NSNumber,
	NSPersonNameComponents,
	NSProgress,
	NSURL,
	NSURLSessionTask,
	NSXPCListenerEndpoint,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { UTType } from './UniformTypeIdentifiers'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const NSFileProviderErrorNonExistentItemIdentifierKey: string

export declare const NSFileProviderErrorDomain: string

export declare const NSFileProviderWorkingSetContainerItemIdentifier: string

export declare const NSFileProviderDomainDidChange: string

export declare const NSFileProviderErrorItemKey: string

export declare const NSFileProviderTrashContainerItemIdentifier: string

export declare const NSFileProviderInitialPageSortedByName: NSData

export declare const NSFileProviderFavoriteRankUnranked: number

export declare const NSFileProviderInitialPageSortedByDate: NSData

export declare const NSFileProviderRootContainerItemIdentifier: string

export declare const NSFileProviderDeleteItemOptions: {
	NSFileProviderDeleteItemRecursive: 1
}

export declare const NSFileProviderErrorCode: {
	NotAuthenticated: -1000
	FilenameCollision: -1001
	SyncAnchorExpired: -1002
	PageExpired: -1002
	InsufficientQuota: -1003
	ServerUnreachable: -1004
	NoSuchItem: -1005
	DeletionRejected: -1006
	DirectoryNotEmpty: -1007
	ProviderNotFound: -2001
	ProviderTranslocated: -2002
	OlderExtensionVersionRunning: -2003
	NewerExtensionVersionFound: -2004
	CannotSynchronize: -2005
}

export declare const NSFileProviderKnownFolders: {
	Desktop: 1
	Documents: 2
}

export declare const NSFileProviderFileSystemFlags: {
	UserExecutable: 1
	UserReadable: 2
	UserWritable: 4
	Hidden: 8
	PathExtensionHidden: 16
}

export declare const NSFileProviderItemFields: {
	Contents: 1
	Filename: 2
	ParentItemIdentifier: 4
	LastUsedDate: 8
	TagData: 16
	FavoriteRank: 32
	CreationDate: 64
	ContentModificationDate: 128
	FileSystemFlags: 256
	ExtendedAttributes: 512
}

export declare const NSFileProviderItemCapabilities: {
	Reading: 1
	Writing: 2
	Reparenting: 4
	Renaming: 8
	Trashing: 16
	Deleting: 32
	Evicting: 64
	AddingSubItems: 2
	ContentEnumerating: 1
	All: 63
}

export declare const NSFileProviderModifyItemOptions: {
	NSFileProviderModifyItemMayAlreadyExist: 1
}

export declare const NSFileProviderManagerDisconnectionOptions: {
	NSFileProviderManagerDisconnectionOptionsTemporary: 1
}

export declare const NSFileProviderCreateItemOptions: {
	NSFileProviderCreateItemMayAlreadyExist: 1
}

export declare const NSFileProviderDomainTestingModes: {
	AlwaysEnabled: 1
	Interactive: 2
}

export declare class NSFileProviderTypeAndCreator {
	constructor(init?: NSFileProviderTypeAndCreator)
	type: number
	creator: number
}

export declare interface NSFileProviderServiceSource {
	readonly serviceName: string

	makeListenerEndpointAndReturnError(error: interop.PointerConvertible): NSXPCListenerEndpoint
}

export declare class NSFileProviderServiceSource
	extends NativeObject
	implements NSFileProviderServiceSource {}

export declare interface NSFileProviderChangeObserver extends NSObjectProtocol {
	didUpdateItems(updatedItems: NSArray<interop.Object> | Array<interop.Object>): void

	didDeleteItemsWithIdentifiers(
		deletedItemIdentifiers: NSArray<interop.Object> | Array<interop.Object>,
	): void

	finishEnumeratingChangesUpToSyncAnchorMoreComing(anchor: NSData, moreComing: boolean): void

	finishEnumeratingWithError(error: NSError): void

	readonly suggestedBatchSize?: number
}

export declare class NSFileProviderChangeObserver
	extends NativeObject
	implements NSFileProviderChangeObserver {}

export declare interface NSFileProviderEnumerating extends NSObjectProtocol {
	enumeratorForContainerItemIdentifierRequestError(
		containerItemIdentifier: string,
		request: NSFileProviderRequest,
		error: interop.PointerConvertible,
	): NSFileProviderEnumerator
}

export declare class NSFileProviderEnumerating
	extends NativeObject
	implements NSFileProviderEnumerating {}

export declare interface NSFileProviderItemDecorating extends NSFileProviderItem {
	readonly decorations: NSArray
}

export declare class NSFileProviderItemDecorating
	extends NativeObject
	implements NSFileProviderItemDecorating {}

export declare interface NSFileProviderEnumerator extends NSObjectProtocol {
	invalidate(): void

	enumerateItemsForObserverStartingAtPage(
		observer: NSFileProviderEnumerationObserver,
		page: NSData,
	): void

	enumerateChangesForObserverFromSyncAnchor?(
		observer: NSFileProviderChangeObserver,
		syncAnchor: NSData,
	): void

	currentSyncAnchorWithCompletionHandler?(completionHandler: (p1: NSData) => void | null): void
}

export declare class NSFileProviderEnumerator
	extends NativeObject
	implements NSFileProviderEnumerator {}

export declare interface NSFileProviderEnumerationObserver extends NSObjectProtocol {
	didEnumerateItems(updatedItems: NSArray<interop.Object> | Array<interop.Object>): void

	finishEnumeratingUpToPage(nextPage: NSData | null): void

	finishEnumeratingWithError(error: NSError): void

	readonly suggestedPageSize?: number
}

export declare class NSFileProviderEnumerationObserver
	extends NativeObject
	implements NSFileProviderEnumerationObserver {}

export declare interface NSFileProviderServicing extends NSObjectProtocol {
	supportedServiceSourcesForItemIdentifierCompletionHandler(
		itemIdentifier: string,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): NSProgress
}

export declare class NSFileProviderServicing
	extends NativeObject
	implements NSFileProviderServicing {}

export declare interface NSFileProviderIncrementalContentFetching extends NSObjectProtocol {
	fetchContentsForItemWithIdentifierVersionUsingExistingContentsAtURLExistingVersionRequestCompletionHandler(
		itemIdentifier: string,
		requestedVersion: NSFileProviderItemVersion | null,
		existingContents: NSURL,
		existingVersion: NSFileProviderItemVersion,
		request: NSFileProviderRequest,
		completionHandler: (p1: NSURL, p2: NSFileProviderItem, p3: NSError) => void | null,
	): NSProgress
}

export declare class NSFileProviderIncrementalContentFetching
	extends NativeObject
	implements NSFileProviderIncrementalContentFetching {}

export declare interface NSFileProviderReplicatedExtension
	extends NSObjectProtocol, NSFileProviderEnumerating {
	initWithDomain(domain: NSFileProviderDomain): this

	invalidate(): void

	itemForIdentifierRequestCompletionHandler(
		identifier: string,
		request: NSFileProviderRequest,
		completionHandler: (p1: NSFileProviderItem, p2: NSError) => void | null,
	): NSProgress

	fetchContentsForItemWithIdentifierVersionRequestCompletionHandler(
		itemIdentifier: string,
		requestedVersion: NSFileProviderItemVersion | null,
		request: NSFileProviderRequest,
		completionHandler: (p1: NSURL, p2: NSFileProviderItem, p3: NSError) => void | null,
	): NSProgress

	createItemBasedOnTemplateFieldsContentsOptionsRequestCompletionHandler(
		itemTemplate: NSFileProviderItem,
		fields: interop.Enum<typeof NSFileProviderItemFields>,
		url: NSURL | null,
		options: interop.Enum<typeof NSFileProviderCreateItemOptions>,
		request: NSFileProviderRequest,
		completionHandler: (
			p1: NSFileProviderItem,
			p2: interop.Enum<typeof NSFileProviderItemFields>,
			p3: boolean,
			p4: NSError,
		) => void | null,
	): NSProgress

	modifyItemBaseVersionChangedFieldsContentsOptionsRequestCompletionHandler(
		item: NSFileProviderItem,
		version: NSFileProviderItemVersion,
		changedFields: interop.Enum<typeof NSFileProviderItemFields>,
		newContents: NSURL | null,
		options: interop.Enum<typeof NSFileProviderModifyItemOptions>,
		request: NSFileProviderRequest,
		completionHandler: (
			p1: NSFileProviderItem,
			p2: interop.Enum<typeof NSFileProviderItemFields>,
			p3: boolean,
			p4: NSError,
		) => void | null,
	): NSProgress

	deleteItemWithIdentifierBaseVersionOptionsRequestCompletionHandler(
		identifier: string,
		version: NSFileProviderItemVersion,
		options: interop.Enum<typeof NSFileProviderDeleteItemOptions>,
		request: NSFileProviderRequest,
		completionHandler: (p1: NSError) => void | null,
	): NSProgress

	importDidFinishWithCompletionHandler?(completionHandler: () => void): void

	materializedItemsDidChangeWithCompletionHandler?(completionHandler: () => void): void
}

export declare class NSFileProviderReplicatedExtension
	extends NativeObject
	implements NSFileProviderReplicatedExtension {}

export declare interface NSFileProviderItem extends NSObjectProtocol {
	readonly itemIdentifier: string

	readonly parentItemIdentifier: string

	readonly filename: string

	readonly contentType?: UTType

	readonly capabilities?: interop.Enum<typeof NSFileProviderItemCapabilities>

	readonly fileSystemFlags?: interop.Enum<typeof NSFileProviderFileSystemFlags>

	readonly documentSize?: NSNumber

	readonly childItemCount?: NSNumber

	readonly creationDate?: NSDate

	readonly contentModificationDate?: NSDate

	readonly extendedAttributes?: NSDictionary

	readonly lastUsedDate?: NSDate

	readonly tagData?: NSData

	readonly uploaded?: boolean

	readonly uploading?: boolean

	readonly uploadingError?: NSError

	readonly downloaded?: boolean

	readonly downloading?: boolean

	readonly downloadingError?: NSError

	readonly mostRecentVersionDownloaded?: boolean

	readonly shared?: boolean

	readonly sharedByCurrentUser?: boolean

	readonly ownerNameComponents?: NSPersonNameComponents

	readonly mostRecentEditorNameComponents?: NSPersonNameComponents

	readonly itemVersion?: NSFileProviderItemVersion

	readonly symlinkTargetPath?: string

	readonly userInfo?: NSDictionary

	isUploaded?(): boolean

	isUploading?(): boolean

	isDownloaded?(): boolean

	isDownloading?(): boolean

	isMostRecentVersionDownloaded?(): boolean

	isShared?(): boolean

	isSharedByCurrentUser?(): boolean
}

export declare class NSFileProviderItem extends NativeObject implements NSFileProviderItem {}

export declare interface NSFileProviderThumbnailing extends NSObjectProtocol {
	fetchThumbnailsForItemIdentifiersRequestedSizePerThumbnailCompletionHandlerCompletionHandler(
		itemIdentifiers: NSArray<interop.Object> | Array<interop.Object>,
		size: CGSize,
		perThumbnailCompletionHandler: (p1: string, p2: NSData, p3: NSError) => void | null,
		completionHandler: (p1: NSError) => void | null,
	): NSProgress
}

export declare class NSFileProviderThumbnailing
	extends NativeObject
	implements NSFileProviderThumbnailing {}

export declare interface NSFileProviderCustomAction extends NSObjectProtocol {
	performActionWithIdentifierOnItemsWithIdentifiersCompletionHandler(
		actionIdentifier: string,
		itemIdentifiers: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): NSProgress
}

export declare class NSFileProviderCustomAction
	extends NativeObject
	implements NSFileProviderCustomAction {}

export declare class NSFileProviderRequest extends NSObject {
	readonly isSystemRequest: boolean

	readonly isFileViewerRequest: boolean

	readonly requestingExecutable: NSURL
}

export declare class NSFileProviderDomain extends NSObject {
	initWithIdentifierDisplayName(identifier: string, displayName: string): this

	readonly identifier: string

	readonly displayName: string

	readonly disconnected: boolean

	readonly userEnabled: boolean

	hidden: boolean

	isDisconnected(): boolean

	isHidden(): boolean
}

export declare class NSFileProviderItemVersion extends NSObject {
	initWithContentVersionMetadataVersion(contentVersion: NSData, metadataVersion: NSData): this

	readonly contentVersion: NSData

	readonly metadataVersion: NSData
}

export declare class NSFileProviderManager extends NSObject {
	static managerForDomain<This extends abstract new (...args: any) => any>(
		this: This,
		domain: NSFileProviderDomain,
	): InstanceType<This>

	signalEnumeratorForContainerItemIdentifierCompletionHandler(
		containerItemIdentifier: string,
		completion: (p1: NSError) => void | null,
	): void

	getUserVisibleURLForItemIdentifierCompletionHandler(
		itemIdentifier: string,
		completionHandler: (p1: NSURL, p2: NSError) => void | null,
	): void

	static getIdentifierForUserVisibleFileAtURLCompletionHandler(
		url: NSURL,
		completionHandler: (p1: string, p2: string, p3: NSError) => void | null,
	): void

	registerURLSessionTaskForItemWithIdentifierCompletionHandler(
		task: NSURLSessionTask,
		identifier: string,
		completion: (p1: NSError) => void | null,
	): void

	temporaryDirectoryURLWithError(error: interop.PointerConvertible): NSURL

	static addDomainCompletionHandler(
		domain: NSFileProviderDomain,
		completionHandler: (p1: NSError) => void | null,
	): void

	static removeDomainCompletionHandler(
		domain: NSFileProviderDomain,
		completionHandler: (p1: NSError) => void | null,
	): void

	static getDomainsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	static removeAllDomainsWithCompletionHandler(
		completionHandler: (p1: NSError) => void | null,
	): void

	signalErrorResolvedCompletionHandler(
		error: NSError,
		completionHandler: (p1: NSError) => void | null,
	): void

	enumeratorForMaterializedItems(): NSFileProviderEnumerator

	static importDomainFromDirectoryAtURLCompletionHandler(
		domain: NSFileProviderDomain,
		url: NSURL,
		completionHandler: (p1: NSError) => void | null,
	): void

	reimportItemsBelowItemWithIdentifierCompletionHandler(
		itemIdentifier: string,
		completionHandler: (p1: NSError) => void | null,
	): void

	evictItemWithIdentifierCompletionHandler(
		itemIdentifier: string,
		completionHandler: (p1: NSError) => void | null,
	): void

	waitForChangesOnItemsBelowItemWithIdentifierCompletionHandler(
		itemIdentifier: string,
		completionHandler: (p1: NSError) => void | null,
	): void

	waitForStabilizationWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void

	disconnectWithReasonOptionsCompletionHandler(
		localizedReason: string,
		options: interop.Enum<typeof NSFileProviderManagerDisconnectionOptions>,
		completionHandler: (p1: NSError) => void | null,
	): void

	reconnectWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void
}
