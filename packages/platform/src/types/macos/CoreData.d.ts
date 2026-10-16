import type { NSDiffableDataSourceSnapshot, NSEditor, NSEditorRegistration } from './AppKit'

import type { CKRecord, CKRecordID } from './CloudKit'

import type { CSSearchableIndex, CSSearchableItemAttributeSet } from './CoreSpotlight'

import type {
	NSArray,
	NSCoder,
	NSCoding,
	NSCopying,
	NSData,
	NSDate,
	NSDictionary,
	NSError,
	NSFastEnumeration,
	NSIndexPath,
	NSLocking,
	NSMutableDictionary,
	NSNotification,
	NSOrderedCollectionDifference,
	NSPredicate,
	NSProgress,
	NSSecureCoding,
	NSSet,
	NSURL,
	NSUUID,
	NSUndoManager,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { ISyncClient, NSPersistentStoreCoordinatorSyncing } from './SyncServices'

import type { interop } from './objc-runtime'

import { CKDatabaseScope } from './CloudKit'

import { NSExpression, NSExpressionType, NSKeyValueSetMutationKind } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const NSValidateXMLStoreOption: string

export declare const NSPersistentStoreCoordinatorStoresDidChangeNotification: string

export declare const NSMigrationConstraintViolationError: number

export declare const NSPersistentCloudKitContainerEventChangedNotification: string

export declare const NSStoreUUIDInPathKey: string

export declare const NSUpdatedObjectIDsKey: string

export declare const NSCoreDataCoreSpotlightDelegateIndexDidUpdateNotification: string

export declare const NSMigrationPropertyMappingKey: string

export declare const NSMigrationEntityMappingKey: string

export declare const NSMigrationDestinationObjectKey: string

export declare const NSMigrationManagerKey: string

export declare const NSPersistentStoreRebuildFromUbiquitousContentOption: string

export declare const NSPersistentStoreUbiquitousPeerTokenOption: string

export declare const NSPersistentStoreUbiquitousTransitionTypeKey: string

export declare const NSPersistentHistoryTokenKey: string

export declare const NSPersistentStoreURLKey: string

export declare const NSPersistentStoreRemoteChangeNotificationPostOptionKey: string

export declare const NSBinaryStoreInsecureDecodingCompatibilityOption: string

export declare const NSBinaryStoreSecureDecodingClasses: string

export declare const NSObjectURIKey: string

export declare const NSModelPathKey: string

export declare const NSStorePathKey: string

export declare const NSExternalRecordsDirectoryOption: string

export declare const NSBinaryExternalRecordType: string

export declare const NSXMLExternalRecordType: string

export declare const NSPersistentStoreOSCompatibility: string

export declare const NSMigratePersistentStoresAutomaticallyOption: string

export declare const NSRemovedPersistentStoresKey: string

export declare const NSPersistentStoreCoordinatorWillRemoveStoreNotification: string

export declare const NSStoreUUIDKey: string

export declare const NSStoreTypeKey: string

export declare const NSBinaryStoreType: string

export declare const NSSQLiteStoreType: string

export declare const NSStagedMigrationBackwardMigrationError: number

export declare const NSStagedMigrationFrameworkVersionMismatchError: number

export declare const NSManagedObjectModelReferenceNotFoundError: number

export declare const NSEntityMigrationPolicyError: number

export declare const NSMigrationManagerDestinationStoreError: number

export declare const NSMigrationMissingSourceModelError: number

export declare const NSMigrationCancelledError: number

export declare const NSPersistentStoreUnsupportedRequestTypeError: number

export declare const NSPersistentStoreTimeoutError: number

export declare const NSPersistentStoreOperationError: number

export declare const NSCoreDataError: number

export declare const NSPersistentStoreInvalidTypeError: number

export declare const NSManagedObjectMergeError: number

export declare const NSManagedObjectReferentialIntegrityError: number

export declare const NSPersistentStoreCoordinatorLockingError: number

export declare const NSManagedObjectContextLockingError: number

export declare const NSValidationInvalidURIError: number

export declare const NSValidationStringPatternMatchingError: number

export declare const NSValidationNumberTooSmallError: number

export declare const NSValidationRelationshipExceedsMaximumCountError: number

export declare const NSValidationRelationshipLacksMinimumCountError: number

export declare const NSValidationMissingMandatoryPropertyError: number

export declare const NSValidationMultipleErrorsError: number

export declare const NSManagedObjectValidationError: number

export declare const NSAffectedObjectsErrorKey: string

export declare const NSValidationValueErrorKey: string

export declare const NSSQLiteManualVacuumOption: string

export declare const NSMigrationMissingMappingModelError: number

export declare const NSExternalRecordImportError: number

export declare const NSAffectedStoresErrorKey: string

export declare const NSStoreModelVersionIdentifiersKey: string

export declare const NSRollbackMergePolicy: interop.Object

export declare const NSMergeByPropertyObjectTrumpMergePolicy: interop.Object

export declare const NSRefreshedObjectIDsKey: string

export declare const NSInsertedObjectIDsKey: string

export declare const NSInvalidatedObjectsKey: string

export declare const NSDeletedObjectsKey: string

export declare const NSUpdatedObjectsKey: string

export declare const NSInsertedObjectsKey: string

export declare const NSManagedObjectContextObjectsDidChangeNotification: string

export declare const NSManagedObjectContextDidSaveNotification: string

export declare const NSCoreDataVersionNumber: number

export declare const NSInvalidatedObjectIDsKey: string

export declare const NSCoreDataCoreSpotlightExporter: string

export declare const NSPersistentStoreUbiquitousContentURLKey: string

export declare const NSPersistentStoreRemoteChangeNotification: string

export declare const NSPersistentStoreCoordinatorStoresWillChangeNotification: string

export declare const NSPersistentStoreRemoveUbiquitousMetadataOption: string

export declare const NSValidationStringTooShortError: number

export declare const NSMergeByPropertyStoreTrumpMergePolicy: interop.Object

export declare const NSValidationKeyErrorKey: string

export declare const NSPersistentStoreUbiquitousContainerIdentifierKey: string

export declare const NSValidationDateTooSoonError: number

export declare const NSValidationObjectErrorKey: string

export declare const NSManagedObjectContextQueryGenerationKey: string

export declare const NSInvalidatedAllObjectsKey: string

export declare const NSMigrationError: number

export declare const NSPersistentStoreConnectionPoolMaxSizeKey: string

export declare const NSUUIDChangedPersistentStoresKey: string

export declare const NSPersistentStoreIncompatibleSchemaError: number

export declare const NSPersistentStoreTypeMismatchError: number

export declare const NSPersistentStoreOpenError: number

export declare const NSOverwriteMergePolicy: interop.Object

export declare const NSManagedObjectConstraintValidationError: number

export declare const NSAddedPersistentStoresKey: string

export declare const NSExternalRecordExtensionOption: string

export declare const NSManagedObjectContextWillSaveNotification: string

export declare const NSValidationRelationshipDeniedDeleteError: number

export declare const NSPersistentHistoryTrackingKey: string

export declare const NSValidationNumberTooLargeError: number

export declare const NSInMemoryStoreType: string

export declare const NSPersistentStoreDidImportUbiquitousContentChangesNotification: string

export declare const NSValidationInvalidDateError: number

export declare const NSSQLiteError: number

export declare const NSSQLitePragmasOption: string

export declare const NSPersistentCloudKitContainerEventUserInfoKey: string

export declare const NSIgnorePersistentStoreVersioningOption: string

export declare const NSStoreModelVersionHashesKey: string

export declare const NSRefreshedObjectsKey: string

export declare const NSPersistentStoreDeferredLightweightMigrationOptionKey: string

export declare const NSSQLiteAnalyzeOption: string

export declare const NSMigrationEntityPolicyKey: string

export declare const NSDeletedObjectIDsKey: string

export declare const NSValidationStringTooLongError: number

export declare const NSManagedObjectConstraintMergeError: number

export declare const NSPersistentStoreSaveConflictsErrorKey: string

export declare const NSXMLStoreType: string

export declare const NSMigrationManagerSourceStoreError: number

export declare const NSManagedObjectExternalRelationshipError: number

export declare const NSEntityNameInPathKey: string

export declare const NSValidationDateTooLateError: number

export declare const NSPersistentStoreTimeoutOption: string

export declare const NSMigrationSourceObjectKey: string

export declare const NSInferredMappingModelError: number

export declare const NSManagedObjectContextDidSaveObjectIDsNotification: string

export declare const NSPersistentStoreSaveConflictsError: number

export declare const NSDetailedErrorsKey: string

export declare const NSExternalRecordsFileFormatOption: string

export declare const NSPersistentStoreUbiquitousContentNameKey: string

export declare const NSSQLiteErrorDomain: string

export declare const NSInferMappingModelAutomaticallyOption: string

export declare const NSValidationPredicateErrorKey: string

export declare const NSFetchRequestExpressionType: interop.Enum<typeof NSExpressionType>

export declare const NSManagedObjectContextDidMergeChangesObjectIDsNotification: string

export declare const NSPersistentStoreForceDestroyOption: string

export declare const NSErrorMergePolicy: interop.Object

export declare const NSPersistentStoreIncompleteSaveError: number

export declare const NSPersistentStoreSaveError: number

export declare const NSPersistentHistoryTokenExpiredError: number

export declare const NSReadOnlyPersistentStoreOption: string

export declare const NSPersistentStoreIncompatibleVersionHashError: number

export declare const NSEntityMappingType: {
	Undefined: 0
	Custom: 1
	Add: 2
	Remove: 3
	Copy: 4
	Transform: 5
}

export declare const NSBatchUpdateRequestResultType: {
	StatusOnly: 0
	UpdatedObjectIDs: 1
	UpdatedObjectsCount: 2
}

export declare const NSFetchedResultsChangeType: {
	Insert: 1
	Delete: 2
	Move: 3
	Update: 4
}

export declare const NSMergePolicyType: {
	Error: 0
	MergeByPropertyStoreTrump: 1
	MergeByPropertyObjectTrump: 2
	Overwrite: 3
	Rollback: 4
}

export declare const NSPersistentHistoryResultType: {
	StatusOnly: 0
	ObjectIDs: 1
	Count: 2
	TransactionsOnly: 3
	ChangesOnly: 4
	TransactionsAndChanges: 5
}

export declare const NSBatchDeleteRequestResultType: {
	StatusOnly: 0
	ObjectIDs: 1
	Count: 2
}

export declare const NSSnapshotEventType: {
	UndoInsertion: 2
	UndoDeletion: 4
	UndoUpdate: 8
	Rollback: 16
	Refresh: 32
	MergePolicy: 64
}

export declare const NSPersistentStoreRequestType: {
	Fetch: 1
	Save: 2
	BatchInsert: 5
	BatchUpdate: 6
	BatchDelete: 7
}

export declare const NSFetchIndexElementType: {
	Binary: 0
	RTree: 1
}

export declare const NSDeleteRule: {
	NoAction: 0
	Nullify: 1
	Cascade: 2
	Deny: 3
}

export declare const NSPersistentCloudKitContainerEventType: {
	Setup: 0
	Import: 1
	Export: 2
}

export declare const NSManagedObjectContextConcurrencyType: {
	Confinement: 0
	PrivateQueue: 1
	MainQueue: 2
}

export declare const NSPersistentStoreUbiquitousTransitionType: {
	AccountAdded: 1
	AccountRemoved: 2
	ContentRemoved: 3
	InitialImportCompleted: 4
}

export declare const NSBatchInsertRequestResultType: {
	StatusOnly: 0
	ObjectIDs: 1
	Count: 2
}

export declare const NSAttributeType: {
	Undefined: 0
	Integer16: 100
	Integer32: 200
	Integer64: 300
	Decimal: 400
	Double: 500
	Float: 600
	String: 700
	Boolean: 800
	Date: 900
	BinaryData: 1000
	UUID: 1100
	URI: 1200
	Transformable: 1800
	ObjectID: 2000
}

export declare const NSFetchRequestResultType: {
	ManagedObject: 0
	ManagedObjectID: 1
	Dictionary: 2
	Count: 4
}

export declare const NSPersistentHistoryChangeType: {
	Insert: 0
	Update: 1
	Delete: 2
}

export declare const NSPersistentCloudKitContainerSchemaInitializationOptions: {
	None: 0
	DryRun: 2
	PrintSchema: 4
}

export declare const NSPersistentCloudKitContainerEventResultType: {
	NSPersistentCloudKitContainerEventResultTypeEvents: 0
	Count: 1
}

export declare interface NSFetchedResultsControllerDelegate extends NSObjectProtocol {
	controllerDidChangeContentWithSnapshot?(
		controller: NSFetchedResultsController,
		snapshot: NSDiffableDataSourceSnapshot,
	): void

	controllerDidChangeContentWithDifference?(
		controller: NSFetchedResultsController,
		diff: NSOrderedCollectionDifference,
	): void

	controllerDidChangeObjectAtIndexPathForChangeTypeNewIndexPath?(
		controller: NSFetchedResultsController,
		anObject: interop.Object,
		indexPath: NSIndexPath | null,
		type: interop.Enum<typeof NSFetchedResultsChangeType>,
		newIndexPath: NSIndexPath | null,
	): void

	controllerDidChangeSectionAtIndexForChangeType?(
		controller: NSFetchedResultsController,
		sectionInfo: NSFetchedResultsSectionInfo,
		sectionIndex: number,
		type: interop.Enum<typeof NSFetchedResultsChangeType>,
	): void

	controllerWillChangeContent?(controller: NSFetchedResultsController): void

	controllerDidChangeContent?(controller: NSFetchedResultsController): void

	controllerSectionIndexTitleForSectionName?(
		controller: NSFetchedResultsController,
		sectionName: string,
	): string
}

export declare class NSFetchedResultsControllerDelegate
	extends NativeObject
	implements NSFetchedResultsControllerDelegate {}

export declare interface NSFetchedResultsSectionInfo {
	readonly name: string

	readonly indexTitle: string

	readonly numberOfObjects: number

	readonly objects: NSArray
}

export declare class NSFetchedResultsSectionInfo
	extends NativeObject
	implements NSFetchedResultsSectionInfo {}

export declare interface NSFetchRequestResult extends NSObjectProtocol {}

export declare class NSFetchRequestResult extends NativeObject implements NSFetchRequestResult {}

export declare class NSMergeConflict extends NSObject {
	readonly sourceObject: NSManagedObject

	readonly objectSnapshot: NSDictionary

	readonly cachedSnapshot: NSDictionary

	readonly persistedSnapshot: NSDictionary

	readonly newVersionNumber: number

	readonly oldVersionNumber: number

	initWithSourceNewVersionOldVersionCachedSnapshotPersistedSnapshot(
		srcObject: NSManagedObject,
		newvers: number,
		oldvers: number,
		cachesnap:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		persnap:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this
}

export declare class NSPersistentCloudKitContainerEventRequest extends NSPersistentStoreRequest {
	resultType: interop.Enum<typeof NSPersistentCloudKitContainerEventResultType>

	static fetchEventsAfterDate<This extends abstract new (...args: any) => any>(
		this: This,
		date: NSDate,
	): InstanceType<This>

	static fetchEventsAfterEvent<This extends abstract new (...args: any) => any>(
		this: This,
		event: NSPersistentCloudKitContainerEvent | null,
	): InstanceType<This>

	static fetchEventsMatchingFetchRequest<This extends abstract new (...args: any) => any>(
		this: This,
		fetchRequest: NSFetchRequest,
	): InstanceType<This>

	static fetchRequestForEvents(): NSFetchRequest
}

export declare class NSBatchUpdateRequest extends NSPersistentStoreRequest {
	static batchUpdateRequestWithEntityName<This extends abstract new (...args: any) => any>(
		this: This,
		entityName: string,
	): InstanceType<This>

	initWithEntityName(entityName: string): this

	initWithEntity(entity: NSEntityDescription): this

	readonly entityName: string

	readonly entity: NSEntityDescription

	predicate: NSPredicate

	includesSubentities: boolean

	resultType: interop.Enum<typeof NSBatchUpdateRequestResultType>

	get propertiesToUpdate(): NSDictionary
	set propertiesToUpdate(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)
}

export declare class NSEntityMapping extends NSObject {
	name: string

	mappingType: interop.Enum<typeof NSEntityMappingType>

	sourceEntityName: string

	sourceEntityVersionHash: NSData

	destinationEntityName: string

	destinationEntityVersionHash: NSData

	get attributeMappings(): NSArray
	set attributeMappings(value: NSArray<interop.Object> | Array<interop.Object>)

	get relationshipMappings(): NSArray
	set relationshipMappings(value: NSArray<interop.Object> | Array<interop.Object>)

	sourceExpression: NSExpression

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	entityMigrationPolicyClassName: string
}

export declare class NSAttributeDescription extends NSPropertyDescription {
	attributeType: interop.Enum<typeof NSAttributeType>

	attributeValueClassName: string

	defaultValue: interop.Object

	readonly versionHash: NSData

	valueTransformerName: string

	allowsExternalBinaryDataStorage: boolean

	preservesValueInHistoryOnDeletion: boolean
}

export declare class NSPersistentStoreDescription extends NSObject implements NSCopying {
	static persistentStoreDescriptionWithURL<This extends abstract new (...args: any) => any>(
		this: This,
		URL: NSURL,
	): InstanceType<This>

	type: string

	configuration: string

	URL: NSURL

	readonly options: NSDictionary

	setOptionForKey(option: NSObject | null, key: string): void

	readOnly: boolean

	timeout: number

	readonly sqlitePragmas: NSDictionary

	setValueForPragmaNamed(value: NSObject | null, name: string): void

	shouldAddStoreAsynchronously: boolean

	shouldMigrateStoreAutomatically: boolean

	shouldInferMappingModelAutomatically: boolean

	initWithURL(url: NSURL): this

	isReadOnly(): boolean

	cloudKitContainerOptions: NSPersistentCloudKitContainerOptions

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSFetchIndexDescription extends NSObject implements NSCoding, NSCopying {
	initWithNameElements(
		name: string,
		elements: NSArray<interop.Object> | Array<interop.Object> | null,
	): this

	name: string

	get elements(): NSArray
	set elements(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly entity: NSEntityDescription

	partialIndexPredicate: NSPredicate

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSManagedObject extends NSObject implements NSFetchRequestResult {
	static readonly contextShouldIgnoreUnmodeledPropertyChanges: boolean

	static entity(): NSEntityDescription

	static fetchRequest(): NSFetchRequest

	initWithEntityInsertIntoManagedObjectContext(
		entity: NSEntityDescription,
		context: NSManagedObjectContext | null,
	): this

	initWithContext(moc: NSManagedObjectContext): this

	readonly managedObjectContext: NSManagedObjectContext

	readonly entity: NSEntityDescription

	readonly objectID: NSManagedObjectID

	readonly inserted: boolean

	readonly updated: boolean

	readonly deleted: boolean

	readonly hasChanges: boolean

	readonly hasPersistentChangedValues: boolean

	readonly fault: boolean

	hasFaultForRelationshipNamed(key: string): boolean

	objectIDsForRelationshipNamed(key: string): NSArray

	readonly faultingState: number

	willAccessValueForKey(key: string | null): void

	didAccessValueForKey(key: string | null): void

	willChangeValueForKey(key: string): void

	didChangeValueForKey(key: string): void

	willChangeValueForKeyWithSetMutationUsingObjects(
		key: string,
		mutationKind: interop.Enum<typeof NSKeyValueSetMutationKind>,
		objects: NSSet,
	): void
	willChangeValueForKeyWithSetMutationUsingObjects(
		inKey: string,
		inMutationKind: interop.Enum<typeof NSKeyValueSetMutationKind>,
		inObjects: NSSet,
	): void

	didChangeValueForKeyWithSetMutationUsingObjects(
		key: string,
		mutationKind: interop.Enum<typeof NSKeyValueSetMutationKind>,
		objects: NSSet,
	): void
	didChangeValueForKeyWithSetMutationUsingObjects(
		inKey: string,
		inMutationKind: interop.Enum<typeof NSKeyValueSetMutationKind>,
		inObjects: NSSet,
	): void

	awakeFromFetch(): void

	awakeFromInsert(): void

	awakeFromSnapshotEvents(flags: interop.Enum<typeof NSSnapshotEventType>): void

	prepareForDeletion(): void

	willSave(): void

	didSave(): void

	willTurnIntoFault(): void

	didTurnIntoFault(): void

	valueForKey(key: string): interop.Object

	setValueForKey(value: interop.Object | null, key: string): void

	primitiveValueForKey(key: string): interop.Object

	setPrimitiveValueForKey(value: interop.Object | null, key: string): void

	committedValuesForKeys(keys: NSArray<interop.Object> | Array<interop.Object> | null): NSDictionary

	changedValues(): NSDictionary

	changedValuesForCurrentEvent(): NSDictionary

	validateValueForKeyError(
		ioValue: interop.PointerConvertible,
		inKey: string,
		outError: interop.PointerConvertible,
	): boolean
	validateValueForKeyError(
		value: interop.PointerConvertible,
		key: string,
		error: interop.PointerConvertible,
	): boolean

	validateForDelete(error: interop.PointerConvertible): boolean

	validateForInsert(error: interop.PointerConvertible): boolean

	validateForUpdate(error: interop.PointerConvertible): boolean

	setObservationInfo(observationInfo: interop.PointerConvertible): void
	setObservationInfo(inObservationInfo: interop.PointerConvertible): void

	get observationInfo(): interop.Pointer
	set observationInfo(value: interop.PointerConvertible)

	isInserted(): boolean

	isUpdated(): boolean

	isDeleted(): boolean

	isFault(): boolean

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class NSPersistentStoreCoordinator extends NSObject implements NSLocking {
	initWithManagedObjectModel(model: NSManagedObjectModel): this

	readonly managedObjectModel: NSManagedObjectModel

	readonly persistentStores: NSArray

	name: string

	persistentStoreForURL(URL: NSURL): NSPersistentStore

	URLForPersistentStore(store: NSPersistentStore): NSURL

	setURLForPersistentStore(url: NSURL, store: NSPersistentStore): boolean

	addPersistentStoreWithTypeConfigurationURLOptionsError(
		storeType: string,
		configuration: string | null,
		storeURL: NSURL | null,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): NSPersistentStore

	addPersistentStoreWithDescriptionCompletionHandler(
		storeDescription: NSPersistentStoreDescription,
		block: (p1: NSPersistentStoreDescription, p2: NSError) => void | null,
	): void

	removePersistentStoreError(store: NSPersistentStore, error: interop.PointerConvertible): boolean

	setMetadataForPersistentStore(
		metadata:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		store: NSPersistentStore,
	): void

	metadataForPersistentStore(store: NSPersistentStore): NSDictionary

	managedObjectIDForURIRepresentation(url: NSURL): NSManagedObjectID

	executeRequestWithContextError(
		request: NSPersistentStoreRequest,
		context: NSManagedObjectContext,
		error: interop.PointerConvertible,
	): interop.Object

	static readonly registeredStoreTypes: NSDictionary

	static registerStoreClassForStoreType(
		storeClass: interop.PointerConvertible,
		storeType: string,
	): void

	static metadataForPersistentStoreOfTypeURLOptionsError(
		storeType: string,
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): NSDictionary

	static setMetadataForPersistentStoreOfTypeURLOptionsError(
		metadata:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		storeType: string,
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): boolean

	static elementsDerivedFromExternalRecordURL(fileURL: NSURL): NSDictionary

	importStoreWithIdentifierFromExternalRecordsDirectoryToURLOptionsWithTypeError(
		storeIdentifier: string | null,
		externalRecordsURL: NSURL,
		destinationURL: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		storeType: string,
		error: interop.PointerConvertible,
	): NSPersistentStore

	migratePersistentStoreToURLOptionsWithTypeError(
		store: NSPersistentStore,
		URL: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		storeType: string,
		error: interop.PointerConvertible,
	): NSPersistentStore

	destroyPersistentStoreAtURLWithTypeOptionsError(
		url: NSURL,
		storeType: string,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): boolean

	replacePersistentStoreAtURLDestinationOptionsWithPersistentStoreFromURLSourceOptionsStoreTypeError(
		destinationURL: NSURL,
		destinationOptions:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		sourceURL: NSURL,
		sourceOptions:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		storeType: string,
		error: interop.PointerConvertible,
	): boolean

	performBlock(block: () => void): void

	performBlockAndWait(block: () => void): void

	currentPersistentHistoryTokenFromStores(
		stores: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSPersistentHistoryToken

	finishDeferredLightweightMigration(error: interop.PointerConvertible): boolean

	finishDeferredLightweightMigrationTask(error: interop.PointerConvertible): boolean

	managedObjectIDFromUTF8StringLength(utf8string: string, len: number): NSManagedObjectID

	static metadataForPersistentStoreWithURLError(
		url: NSURL,
		error: interop.PointerConvertible,
	): NSDictionary

	lock(): void

	unlock(): void

	tryLock(): boolean

	static metadataForPersistentStoreOfTypeURLError(
		storeType: string | null,
		url: NSURL,
		error: interop.PointerConvertible,
	): NSDictionary

	static setMetadataForPersistentStoreOfTypeURLError(
		metadata:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		storeType: string | null,
		url: NSURL,
		error: interop.PointerConvertible,
	): boolean

	static removeUbiquitousContentAndPersistentStoreAtURLOptionsError(
		storeURL: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): boolean

	syncWithClientInBackgroundHandlerError(
		client: ISyncClient,
		flag: boolean,
		syncHandler: NSPersistentStoreCoordinatorSyncing,
		rError: interop.PointerConvertible,
	): boolean

	setStoresFastSyncDetailsAtURLForPersistentStore(url: NSURL, store: NSPersistentStore): void
}

export declare class NSFetchRequestExpression extends NSExpression {
	static expressionForFetchContextCountOnly(
		fetch: NSExpression,
		context: NSExpression,
		countFlag: boolean,
	): NSExpression

	readonly requestExpression: NSExpression

	readonly contextExpression: NSExpression

	readonly countOnlyRequest: boolean

	isCountOnlyRequest(): boolean
}

export declare class NSCoreDataCoreSpotlightDelegate extends NSObject {
	domainIdentifier(): string

	indexName(): string

	initForStoreWithDescriptionCoordinator(
		description: NSPersistentStoreDescription,
		psc: NSPersistentStoreCoordinator,
	): this

	initForStoreWithDescriptionModel(
		description: NSPersistentStoreDescription,
		model: NSManagedObjectModel,
	): this

	startSpotlightIndexing(): void

	stopSpotlightIndexing(): void

	deleteSpotlightIndexWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void

	attributeSetForObject(object: NSManagedObject): CSSearchableItemAttributeSet

	searchableIndexReindexAllSearchableItemsWithAcknowledgementHandler(
		searchableIndex: CSSearchableIndex,
		acknowledgementHandler: () => void,
	): void

	searchableIndexReindexSearchableItemsWithIdentifiersAcknowledgementHandler(
		searchableIndex: CSSearchableIndex,
		identifiers: NSArray<interop.Object> | Array<interop.Object>,
		acknowledgementHandler: () => void,
	): void
}

export declare class NSPersistentHistoryTransaction extends NSObject implements NSCopying {
	static entityDescriptionWithContext(context: NSManagedObjectContext): NSEntityDescription

	static readonly entityDescription: NSEntityDescription

	static readonly fetchRequest: NSFetchRequest

	readonly timestamp: NSDate

	readonly changes: NSArray

	readonly transactionNumber: number

	readonly storeID: string

	readonly bundleID: string

	readonly processID: string

	readonly contextName: string

	readonly author: string

	readonly token: NSPersistentHistoryToken

	objectIDNotification(): NSNotification

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSMigrationManager extends NSObject {
	initWithSourceModelDestinationModel(
		sourceModel: NSManagedObjectModel,
		destinationModel: NSManagedObjectModel,
	): this

	migrateStoreFromURLTypeOptionsWithMappingModelToDestinationURLDestinationTypeDestinationOptionsError(
		sourceURL: NSURL,
		sStoreType: string,
		sOptions:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		mappings: NSMappingModel | null,
		dURL: NSURL,
		dStoreType: string,
		dOptions:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): boolean

	usesStoreSpecificMigrationManager: boolean

	reset(): void

	readonly mappingModel: NSMappingModel

	readonly sourceModel: NSManagedObjectModel

	readonly destinationModel: NSManagedObjectModel

	readonly sourceContext: NSManagedObjectContext

	readonly destinationContext: NSManagedObjectContext

	sourceEntityForEntityMapping(mEntity: NSEntityMapping): NSEntityDescription

	destinationEntityForEntityMapping(mEntity: NSEntityMapping): NSEntityDescription

	associateSourceInstanceWithDestinationInstanceForEntityMapping(
		sourceInstance: NSManagedObject,
		destinationInstance: NSManagedObject,
		entityMapping: NSEntityMapping,
	): void

	destinationInstancesForEntityMappingNamedSourceInstances(
		mappingName: string,
		sourceInstances: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSArray

	sourceInstancesForEntityMappingNamedDestinationInstances(
		mappingName: string,
		destinationInstances: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSArray

	readonly currentEntityMapping: NSEntityMapping

	readonly migrationProgress: number

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	cancelMigrationWithError(error: NSError): void
}

export declare class NSPersistentStoreRequest extends NSObject implements NSCopying {
	get affectedStores(): NSArray
	set affectedStores(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly requestType: interop.Enum<typeof NSPersistentStoreRequestType>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSPersistentCloudKitContainerOptions extends NSObject {
	readonly containerIdentifier: string

	databaseScope: interop.Enum<typeof CKDatabaseScope>

	initWithContainerIdentifier(containerIdentifier: string): this
}

export declare class NSBatchInsertRequest extends NSPersistentStoreRequest {
	readonly entityName: string

	readonly entity: NSEntityDescription

	get objectsToInsert(): NSArray
	set objectsToInsert(value: NSArray<interop.Object> | Array<interop.Object>)

	dictionaryHandler: (p1: NSMutableDictionary) => boolean

	managedObjectHandler: (p1: NSManagedObject) => boolean

	resultType: interop.Enum<typeof NSBatchInsertRequestResultType>

	static batchInsertRequestWithEntityNameObjects<This extends abstract new (...args: any) => any>(
		this: This,
		entityName: string,
		dictionaries: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static batchInsertRequestWithEntityNameDictionaryHandler<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		entityName: string,
		handler: (p1: NSMutableDictionary) => boolean,
	): InstanceType<This>

	static batchInsertRequestWithEntityNameManagedObjectHandler<
		This extends abstract new (...args: any) => any,
	>(this: This, entityName: string, handler: (p1: NSManagedObject) => boolean): InstanceType<This>

	init(): this

	initWithEntityNameObjects(
		entityName: string,
		dictionaries: NSArray<interop.Object> | Array<interop.Object>,
	): this

	initWithEntityObjects(
		entity: NSEntityDescription,
		dictionaries: NSArray<interop.Object> | Array<interop.Object>,
	): this

	initWithEntityDictionaryHandler(
		entity: NSEntityDescription,
		handler: (p1: NSMutableDictionary) => boolean,
	): this

	initWithEntityManagedObjectHandler(
		entity: NSEntityDescription,
		handler: (p1: NSManagedObject) => boolean,
	): this

	initWithEntityNameDictionaryHandler(
		entityName: string,
		handler: (p1: NSMutableDictionary) => boolean,
	): this

	initWithEntityNameManagedObjectHandler(
		entityName: string,
		handler: (p1: NSManagedObject) => boolean,
	): this
}

export declare class NSPersistentCloudKitContainerEvent extends NSObject implements NSCopying {
	readonly identifier: NSUUID

	readonly storeIdentifier: string

	readonly type: interop.Enum<typeof NSPersistentCloudKitContainerEventType>

	readonly startDate: NSDate

	readonly endDate: NSDate

	readonly succeeded: boolean

	readonly error: NSError

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSPersistentHistoryChangeRequest extends NSPersistentStoreRequest {
	static fetchHistoryAfterDate<This extends abstract new (...args: any) => any>(
		this: This,
		date: NSDate,
	): InstanceType<This>

	static fetchHistoryAfterToken<This extends abstract new (...args: any) => any>(
		this: This,
		token: NSPersistentHistoryToken | null,
	): InstanceType<This>

	static fetchHistoryAfterTransaction<This extends abstract new (...args: any) => any>(
		this: This,
		transaction: NSPersistentHistoryTransaction | null,
	): InstanceType<This>

	static fetchHistoryWithFetchRequest<This extends abstract new (...args: any) => any>(
		this: This,
		fetchRequest: NSFetchRequest,
	): InstanceType<This>

	static deleteHistoryBeforeDate<This extends abstract new (...args: any) => any>(
		this: This,
		date: NSDate,
	): InstanceType<This>

	static deleteHistoryBeforeToken<This extends abstract new (...args: any) => any>(
		this: This,
		token: NSPersistentHistoryToken | null,
	): InstanceType<This>

	static deleteHistoryBeforeTransaction<This extends abstract new (...args: any) => any>(
		this: This,
		transaction: NSPersistentHistoryTransaction | null,
	): InstanceType<This>

	resultType: interop.Enum<typeof NSPersistentHistoryResultType>

	readonly token: NSPersistentHistoryToken

	fetchRequest: NSFetchRequest
}

export declare class NSPersistentContainer extends NSObject {
	static persistentContainerWithName<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
	): InstanceType<This>

	static persistentContainerWithNameManagedObjectModel<
		This extends abstract new (...args: any) => any,
	>(this: This, name: string, model: NSManagedObjectModel): InstanceType<This>

	static defaultDirectoryURL(): NSURL

	readonly name: string

	readonly viewContext: NSManagedObjectContext

	readonly managedObjectModel: NSManagedObjectModel

	readonly persistentStoreCoordinator: NSPersistentStoreCoordinator

	get persistentStoreDescriptions(): NSArray
	set persistentStoreDescriptions(value: NSArray<interop.Object> | Array<interop.Object>)

	initWithName(name: string): this

	initWithNameManagedObjectModel(name: string, model: NSManagedObjectModel): this

	loadPersistentStoresWithCompletionHandler(
		block: (p1: NSPersistentStoreDescription, p2: NSError) => void | null,
	): void

	newBackgroundContext(): NSManagedObjectContext

	performBackgroundTask(block: (p1: NSManagedObjectContext) => void): void
}

export declare class NSConstraintConflict extends NSObject {
	readonly constraint: NSArray

	readonly constraintValues: NSDictionary

	readonly databaseObject: NSManagedObject

	readonly databaseSnapshot: NSDictionary

	readonly conflictingObjects: NSArray

	readonly conflictingSnapshots: NSArray

	initWithConstraintDatabaseObjectDatabaseSnapshotConflictingObjectsConflictingSnapshots(
		contraint: NSArray<interop.Object> | Array<interop.Object>,
		databaseObject: NSManagedObject | null,
		databaseSnapshot:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		conflictingObjects: NSArray<interop.Object> | Array<interop.Object>,
		conflictingSnapshots: NSArray<interop.Object> | Array<interop.Object>,
	): this
}

export declare class NSBatchDeleteRequest extends NSPersistentStoreRequest {
	initWithFetchRequest(fetch: NSFetchRequest): this

	initWithObjectIDs(objects: NSArray<interop.Object> | Array<interop.Object>): this

	resultType: interop.Enum<typeof NSBatchDeleteRequestResultType>

	readonly fetchRequest: NSFetchRequest
}

export declare class NSBatchDeleteResult extends NSPersistentStoreResult {
	readonly result: interop.Object

	readonly resultType: interop.Enum<typeof NSBatchDeleteRequestResultType>
}

export declare class NSBatchUpdateResult extends NSPersistentStoreResult {
	readonly result: interop.Object

	readonly resultType: interop.Enum<typeof NSBatchUpdateRequestResultType>
}

export declare class NSAsynchronousFetchResult<
	ResultType = interop.Object,
> extends NSPersistentStoreAsynchronousResult {
	readonly fetchRequest: NSAsynchronousFetchRequest

	readonly finalResult: NSArray
}

export declare class NSPersistentStoreResult extends NSObject {}

export declare class NSIncrementalStoreNode extends NSObject {
	initWithObjectIDWithValuesVersion(
		objectID: NSManagedObjectID,
		values: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		version: number,
	): this

	updateWithValuesVersion(
		values: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		version: number,
	): void

	readonly objectID: NSManagedObjectID

	readonly version: number

	valueForPropertyDescription(prop: NSPropertyDescription): interop.Object
}

export declare class NSAtomicStore extends NSPersistentStore {
	initWithPersistentStoreCoordinatorConfigurationNameURLOptions(
		root: NSPersistentStoreCoordinator | null,
		name: string | null,
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this
	initWithPersistentStoreCoordinatorConfigurationNameURLOptions(
		coordinator: NSPersistentStoreCoordinator | null,
		configurationName: string | null,
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	load(error: interop.PointerConvertible): boolean

	save(error: interop.PointerConvertible): boolean

	newCacheNodeForManagedObject(managedObject: NSManagedObject): NSAtomicStoreCacheNode

	updateCacheNodeFromManagedObject(
		node: NSAtomicStoreCacheNode,
		managedObject: NSManagedObject,
	): void

	cacheNodes(): NSSet

	addCacheNodes(cacheNodes: NSSet): void

	willRemoveCacheNodes(cacheNodes: NSSet): void

	cacheNodeForObjectID(objectID: NSManagedObjectID): NSAtomicStoreCacheNode

	objectIDForEntityReferenceObject(
		entity: NSEntityDescription,
		data: interop.Object,
	): NSManagedObjectID

	newReferenceObjectForManagedObject(managedObject: NSManagedObject): interop.Object

	referenceObjectForObjectID(objectID: NSManagedObjectID): interop.Object
}

export declare class NSAtomicStoreCacheNode extends NSObject {
	initWithObjectID(moid: NSManagedObjectID): this

	readonly objectID: NSManagedObjectID

	propertyCache: NSMutableDictionary

	valueForKey(key: string): interop.Object

	setValueForKey(value: interop.Object | null, key: string): void
}

export declare class NSPersistentStore extends NSObject {
	static metadataForPersistentStoreWithURLError(
		url: NSURL,
		error: interop.PointerConvertible,
	): NSDictionary

	static setMetadataForPersistentStoreWithURLError(
		metadata:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		url: NSURL,
		error: interop.PointerConvertible,
	): boolean

	static migrationManagerClass(): interop.Pointer

	initWithPersistentStoreCoordinatorConfigurationNameURLOptions(
		root: NSPersistentStoreCoordinator | null,
		name: string | null,
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	loadMetadata(error: interop.PointerConvertible): boolean

	readonly persistentStoreCoordinator: NSPersistentStoreCoordinator

	readonly configurationName: string

	readonly options: NSDictionary

	URL: NSURL

	identifier: string

	readonly type: string

	readOnly: boolean

	get metadata(): NSDictionary
	set metadata(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	didAddToPersistentStoreCoordinator(coordinator: NSPersistentStoreCoordinator): void

	willRemoveFromPersistentStoreCoordinator(coordinator: NSPersistentStoreCoordinator | null): void

	readonly coreSpotlightExporter: NSCoreDataCoreSpotlightDelegate

	isReadOnly(): boolean
}

export declare class NSManagedObjectModel
	extends NSObject
	implements NSCoding, NSCopying, NSFastEnumeration
{
	static mergedModelFromBundles(
		bundles: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSManagedObjectModel

	static modelByMergingModels(
		models: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSManagedObjectModel

	init(): this

	initWithContentsOfURL(url: NSURL): this

	readonly entitiesByName: NSDictionary

	get entities(): NSArray
	set entities(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly configurations: NSArray

	entitiesForConfiguration(configuration: string | null): NSArray

	setEntitiesForConfiguration(
		entities: NSArray<interop.Object> | Array<interop.Object>,
		configuration: string,
	): void

	setFetchRequestTemplateForName(fetchRequestTemplate: NSFetchRequest | null, name: string): void

	fetchRequestTemplateForName(name: string): NSFetchRequest

	fetchRequestFromTemplateWithNameSubstitutionVariables(
		name: string,
		variables:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): NSFetchRequest

	get localizationDictionary(): NSDictionary
	set localizationDictionary(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	static mergedModelFromBundlesForStoreMetadata(
		bundles: NSArray<interop.Object> | Array<interop.Object> | null,
		metadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): NSManagedObjectModel

	static modelByMergingModelsForStoreMetadata(
		models: NSArray<interop.Object> | Array<interop.Object>,
		metadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): NSManagedObjectModel

	readonly fetchRequestTemplatesByName: NSDictionary

	versionIdentifiers: NSSet

	isConfigurationCompatibleWithStoreMetadata(
		configuration: string | null,
		metadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): boolean

	readonly entityVersionHashesByName: NSDictionary

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<any>
}

export declare class NSEntityDescription
	extends NSObject
	implements NSCoding, NSCopying, NSFastEnumeration
{
	static entityForNameInManagedObjectContext(
		entityName: string,
		context: NSManagedObjectContext,
	): NSEntityDescription

	static insertNewObjectForEntityForNameInManagedObjectContext(
		entityName: string,
		context: NSManagedObjectContext,
	): NSManagedObject

	readonly managedObjectModel: NSManagedObjectModel

	managedObjectClassName: string

	name: string

	abstract: boolean

	readonly subentitiesByName: NSDictionary

	get subentities(): NSArray
	set subentities(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly superentity: NSEntityDescription

	readonly propertiesByName: NSDictionary

	get properties(): NSArray
	set properties(value: NSArray<interop.Object> | Array<interop.Object>)

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	readonly attributesByName: NSDictionary

	readonly relationshipsByName: NSDictionary

	relationshipsWithDestinationEntity(entity: NSEntityDescription): NSArray

	isKindOfEntity(entity: NSEntityDescription): boolean

	readonly versionHash: NSData

	versionHashModifier: string

	renamingIdentifier: string

	get indexes(): NSArray
	set indexes(value: NSArray<interop.Object> | Array<interop.Object>)

	get uniquenessConstraints(): NSArray
	set uniquenessConstraints(value: NSArray<interop.Object> | Array<interop.Object>)

	get compoundIndexes(): NSArray
	set compoundIndexes(value: NSArray<interop.Object> | Array<interop.Object>)

	coreSpotlightDisplayNameExpression: NSExpression

	isAbstract(): boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<any>
}

export declare class NSDerivedAttributeDescription extends NSAttributeDescription {
	derivationExpression: NSExpression
}

export declare class NSPropertyDescription extends NSObject implements NSCoding, NSCopying {
	readonly entity: NSEntityDescription

	name: string

	optional: boolean

	transient: boolean

	readonly validationPredicates: NSArray

	readonly validationWarnings: NSArray

	setValidationPredicatesWithValidationWarnings(
		validationPredicates: NSArray<interop.Object> | Array<interop.Object> | null,
		validationWarnings: NSArray<interop.Object> | Array<interop.Object> | null,
	): void

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	indexed: boolean

	readonly versionHash: NSData

	versionHashModifier: string

	indexedBySpotlight: boolean

	storedInExternalRecord: boolean

	renamingIdentifier: string

	isOptional(): boolean

	isTransient(): boolean

	isIndexed(): boolean

	isIndexedBySpotlight(): boolean

	isStoredInExternalRecord(): boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSEntityMigrationPolicy extends NSObject {
	beginEntityMappingManagerError(
		mapping: NSEntityMapping,
		manager: NSMigrationManager,
		error: interop.PointerConvertible,
	): boolean

	createDestinationInstancesForSourceInstanceEntityMappingManagerError(
		sInstance: NSManagedObject,
		mapping: NSEntityMapping,
		manager: NSMigrationManager,
		error: interop.PointerConvertible,
	): boolean

	endInstanceCreationForEntityMappingManagerError(
		mapping: NSEntityMapping,
		manager: NSMigrationManager,
		error: interop.PointerConvertible,
	): boolean

	createRelationshipsForDestinationInstanceEntityMappingManagerError(
		dInstance: NSManagedObject,
		mapping: NSEntityMapping,
		manager: NSMigrationManager,
		error: interop.PointerConvertible,
	): boolean

	endRelationshipCreationForEntityMappingManagerError(
		mapping: NSEntityMapping,
		manager: NSMigrationManager,
		error: interop.PointerConvertible,
	): boolean

	performCustomValidationForEntityMappingManagerError(
		mapping: NSEntityMapping,
		manager: NSMigrationManager,
		error: interop.PointerConvertible,
	): boolean

	endEntityMappingManagerError(
		mapping: NSEntityMapping,
		manager: NSMigrationManager,
		error: interop.PointerConvertible,
	): boolean
}

export declare class NSFetchIndexElementDescription
	extends NSObject
	implements NSCoding, NSCopying
{
	initWithPropertyCollationType(
		property: NSPropertyDescription,
		collationType: interop.Enum<typeof NSFetchIndexElementType>,
	): this

	readonly property: NSPropertyDescription

	readonly propertyName: string

	collationType: interop.Enum<typeof NSFetchIndexElementType>

	ascending: boolean

	readonly indexDescription: NSFetchIndexDescription

	isAscending(): boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSFetchedPropertyDescription extends NSPropertyDescription {
	fetchRequest: NSFetchRequest
}

export declare class NSPersistentHistoryChange extends NSObject implements NSCopying {
	static entityDescriptionWithContext(context: NSManagedObjectContext): NSEntityDescription

	static readonly entityDescription: NSEntityDescription

	static readonly fetchRequest: NSFetchRequest

	readonly changeID: number

	readonly changedObjectID: NSManagedObjectID

	readonly changeType: interop.Enum<typeof NSPersistentHistoryChangeType>

	readonly tombstone: NSDictionary

	readonly transaction: NSPersistentHistoryTransaction

	readonly updatedProperties: NSSet

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSPersistentCloudKitContainer extends NSPersistentContainer {
	initializeCloudKitSchemaWithOptionsError(
		options: interop.Enum<typeof NSPersistentCloudKitContainerSchemaInitializationOptions>,
		error: interop.PointerConvertible,
	): this

	recordForManagedObjectID(managedObjectID: NSManagedObjectID): CKRecord

	recordsForManagedObjectIDs(
		managedObjectIDs: NSArray<interop.Object> | Array<interop.Object>,
	): NSDictionary

	recordIDForManagedObjectID(managedObjectID: NSManagedObjectID): CKRecordID

	recordIDsForManagedObjectIDs(
		managedObjectIDs: NSArray<interop.Object> | Array<interop.Object>,
	): NSDictionary

	canUpdateRecordForManagedObjectWithID(objectID: NSManagedObjectID): boolean

	canDeleteRecordForManagedObjectWithID(objectID: NSManagedObjectID): boolean

	canModifyManagedObjectsInStore(store: NSPersistentStore): boolean
}

export declare class NSAsynchronousFetchRequest<
	ResultType = interop.Object,
> extends NSPersistentStoreRequest {
	readonly fetchRequest: NSFetchRequest

	readonly completionBlock: (p1: NSAsynchronousFetchResult) => void

	estimatedResultCount: number

	initWithFetchRequestCompletionBlock(
		request: NSFetchRequest,
		blk: (p1: NSAsynchronousFetchResult) => void | null,
	): this
}

export declare class NSExpressionDescription extends NSPropertyDescription {
	expression: NSExpression

	expressionResultType: interop.Enum<typeof NSAttributeType>
}

export declare class NSPropertyMapping extends NSObject {
	name: string

	valueExpression: NSExpression

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)
}

export declare class NSPersistentCloudKitContainerEventResult extends NSPersistentStoreResult {
	readonly result: interop.Object

	readonly resultType: interop.Enum<typeof NSPersistentCloudKitContainerEventResultType>
}

export declare class NSFetchRequest<ResultType = interop.Object>
	extends NSPersistentStoreRequest
	implements NSCoding, NSCopying
{
	static fetchRequestWithEntityName<ResultType, This extends abstract new (...args: any) => any>(
		this: This,
		entityName: string,
	): InstanceType<This>

	init(): this

	initWithEntityName(entityName: string): this

	execute(error: interop.PointerConvertible): NSArray

	entity: NSEntityDescription

	readonly entityName: string

	predicate: NSPredicate

	get sortDescriptors(): NSArray
	set sortDescriptors(value: NSArray<interop.Object> | Array<interop.Object>)

	fetchLimit: number

	get affectedStores(): NSArray
	set affectedStores(value: NSArray<interop.Object> | Array<interop.Object>)

	resultType: interop.Enum<typeof NSFetchRequestResultType>

	includesSubentities: boolean

	includesPropertyValues: boolean

	returnsObjectsAsFaults: boolean

	get relationshipKeyPathsForPrefetching(): NSArray
	set relationshipKeyPathsForPrefetching(value: NSArray<interop.Object> | Array<interop.Object>)

	includesPendingChanges: boolean

	returnsDistinctResults: boolean

	get propertiesToFetch(): NSArray
	set propertiesToFetch(value: NSArray<interop.Object> | Array<interop.Object>)

	fetchOffset: number

	fetchBatchSize: number

	shouldRefreshRefetchedObjects: boolean

	get propertiesToGroupBy(): NSArray
	set propertiesToGroupBy(value: NSArray<interop.Object> | Array<interop.Object>)

	havingPredicate: NSPredicate

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSBatchInsertResult extends NSPersistentStoreResult {
	readonly result: interop.Object

	readonly resultType: interop.Enum<typeof NSBatchInsertRequestResultType>
}

export declare class NSSaveChangesRequest extends NSPersistentStoreRequest {
	initWithInsertedObjectsUpdatedObjectsDeletedObjectsLockedObjects(
		insertedObjects: NSSet | null,
		updatedObjects: NSSet | null,
		deletedObjects: NSSet | null,
		lockedObjects: NSSet | null,
	): this

	readonly insertedObjects: NSSet

	readonly updatedObjects: NSSet

	readonly deletedObjects: NSSet

	readonly lockedObjects: NSSet
}

export declare class NSQueryGenerationToken extends NSObject implements NSCopying, NSSecureCoding {
	static readonly currentQueryGenerationToken: NSQueryGenerationToken

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSRelationshipDescription extends NSPropertyDescription {
	destinationEntity: NSEntityDescription

	inverseRelationship: NSRelationshipDescription

	maxCount: number

	minCount: number

	deleteRule: interop.Enum<typeof NSDeleteRule>

	readonly toMany: boolean

	readonly versionHash: NSData

	ordered: boolean

	isToMany(): boolean

	isOrdered(): boolean
}

export declare class NSFetchedResultsController<ResultType = interop.Object> extends NSObject {
	initWithFetchRequestManagedObjectContextSectionNameKeyPathCacheName(
		fetchRequest: NSFetchRequest,
		context: NSManagedObjectContext,
		sectionNameKeyPath: string | null,
		name: string | null,
	): this

	performFetch(error: interop.PointerConvertible): boolean

	readonly fetchRequest: NSFetchRequest

	readonly managedObjectContext: NSManagedObjectContext

	readonly sectionNameKeyPath: string

	readonly cacheName: string

	delegate: NSFetchedResultsControllerDelegate

	static deleteCacheWithName<ResultType>(name: string | null): void

	readonly fetchedObjects: NSArray

	objectAtIndexPath(indexPath: NSIndexPath): ResultType

	indexPathForObject(object: ResultType): NSIndexPath

	sectionIndexTitleForSectionName(sectionName: string): string

	readonly sectionIndexTitles: NSArray

	readonly sections: NSArray

	sectionForSectionIndexTitleAtIndex(title: string, sectionIndex: number): number
}

export declare class NSManagedObjectID extends NSObject implements NSCopying, NSFetchRequestResult {
	readonly entity: NSEntityDescription

	readonly persistentStore: NSPersistentStore

	readonly temporaryID: boolean

	URIRepresentation(): NSURL

	isTemporaryID(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class NSMergePolicy extends NSObject {
	static readonly errorMergePolicy: NSMergePolicy

	static readonly rollbackMergePolicy: NSMergePolicy

	static readonly overwriteMergePolicy: NSMergePolicy

	static readonly mergeByPropertyObjectTrumpMergePolicy: NSMergePolicy

	static readonly mergeByPropertyStoreTrumpMergePolicy: NSMergePolicy

	readonly mergeType: interop.Enum<typeof NSMergePolicyType>

	initWithMergeType(ty: interop.Enum<typeof NSMergePolicyType>): this

	resolveConflictsError(
		list: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean

	resolveOptimisticLockingVersionConflictsError(
		list: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean

	resolveConstraintConflictsError(
		list: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean
}

export declare class NSPersistentStoreAsynchronousResult extends NSPersistentStoreResult {
	readonly managedObjectContext: NSManagedObjectContext

	readonly operationError: NSError

	readonly progress: NSProgress

	cancel(): void
}

export declare class NSPersistentHistoryResult extends NSPersistentStoreResult {
	readonly result: interop.Object

	readonly resultType: interop.Enum<typeof NSPersistentHistoryResultType>
}

export declare class NSManagedObjectContext
	extends NSObject
	implements NSCoding, NSLocking, NSEditor, NSEditorRegistration
{
	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	init(): this

	initWithConcurrencyType(ct: interop.Enum<typeof NSManagedObjectContextConcurrencyType>): this

	performBlock(block: () => void): void

	performBlockAndWait(block: () => void): void

	persistentStoreCoordinator: NSPersistentStoreCoordinator

	parentContext: NSManagedObjectContext

	name: string

	undoManager: NSUndoManager

	readonly hasChanges: boolean

	readonly userInfo: NSMutableDictionary

	readonly concurrencyType: interop.Enum<typeof NSManagedObjectContextConcurrencyType>

	objectRegisteredForID(objectID: NSManagedObjectID): NSManagedObject

	objectWithID(objectID: NSManagedObjectID): NSManagedObject

	existingObjectWithIDError(
		objectID: NSManagedObjectID,
		error: interop.PointerConvertible,
	): NSManagedObject

	executeFetchRequestError(request: NSFetchRequest, error: interop.PointerConvertible): NSArray

	countForFetchRequestError(request: NSFetchRequest, error: interop.PointerConvertible): number

	executeRequestError(
		request: NSPersistentStoreRequest,
		error: interop.PointerConvertible,
	): NSPersistentStoreResult

	insertObject(object: NSManagedObject): void

	deleteObject(object: NSManagedObject): void

	refreshObjectMergeChanges(object: NSManagedObject, flag: boolean): void

	detectConflictsForObject(object: NSManagedObject): void

	observeValueForKeyPathOfObjectChangeContext(
		keyPath: string | null,
		object: interop.Object | null,
		change:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		context: interop.PointerConvertible,
	): void

	processPendingChanges(): void

	assignObjectToPersistentStore(object: interop.Object, store: NSPersistentStore): void

	readonly insertedObjects: NSSet

	readonly updatedObjects: NSSet

	readonly deletedObjects: NSSet

	readonly registeredObjects: NSSet

	undo(): void

	redo(): void

	reset(): void

	rollback(): void

	save(error: interop.PointerConvertible): boolean

	refreshAllObjects(): void

	lock(): void

	unlock(): void

	tryLock(): boolean

	propagatesDeletesAtEndOfEvent: boolean

	retainsRegisteredObjects: boolean

	shouldDeleteInaccessibleFaults: boolean

	shouldHandleInaccessibleFaultForObjectIDTriggeredByProperty(
		fault: NSManagedObject,
		oid: NSManagedObjectID,
		property: NSPropertyDescription | null,
	): boolean

	stalenessInterval: number

	mergePolicy: interop.Object

	obtainPermanentIDsForObjectsError(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean

	mergeChangesFromContextDidSaveNotification(notification: NSNotification): void

	static mergeChangesFromRemoteContextSaveIntoContexts(
		changeNotificationData:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		contexts: NSArray<interop.Object> | Array<interop.Object>,
	): void

	readonly queryGenerationToken: NSQueryGenerationToken

	setQueryGenerationFromTokenError(
		generation: NSQueryGenerationToken | null,
		error: interop.PointerConvertible,
	): boolean

	automaticallyMergesChangesFromParent: boolean

	transactionAuthor: string

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	discardEditing(): void

	commitEditing(): boolean

	commitEditingWithDelegateDidCommitSelectorContextInfo(
		delegate: interop.Object | null,
		didCommitSelector: string | null,
		contextInfo: interop.PointerConvertible,
	): void

	commitEditingAndReturnError(error: interop.PointerConvertible): boolean

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	objectDidBeginEditing(editor: NSEditor): void

	objectDidEndEditing(editor: NSEditor): void
}

export declare class NSIncrementalStore extends NSPersistentStore {
	loadMetadata(error: interop.PointerConvertible): boolean

	executeRequestWithContextError(
		request: NSPersistentStoreRequest,
		context: NSManagedObjectContext | null,
		error: interop.PointerConvertible,
	): interop.Object

	newValuesForObjectWithIDWithContextError(
		objectID: NSManagedObjectID,
		context: NSManagedObjectContext,
		error: interop.PointerConvertible,
	): NSIncrementalStoreNode

	newValueForRelationshipForObjectWithIDWithContextError(
		relationship: NSRelationshipDescription,
		objectID: NSManagedObjectID,
		context: NSManagedObjectContext | null,
		error: interop.PointerConvertible,
	): interop.Object

	static identifierForNewStoreAtURL(storeURL: NSURL): interop.Object

	obtainPermanentIDsForObjectsError(
		array: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): NSArray

	managedObjectContextDidRegisterObjectsWithIDs(
		objectIDs: NSArray<interop.Object> | Array<interop.Object>,
	): void

	managedObjectContextDidUnregisterObjectsWithIDs(
		objectIDs: NSArray<interop.Object> | Array<interop.Object>,
	): void

	newObjectIDForEntityReferenceObject(
		entity: NSEntityDescription,
		data: interop.Object,
	): NSManagedObjectID

	referenceObjectForObjectID(objectID: NSManagedObjectID): interop.Object
}

export declare class NSMappingModel extends NSObject {
	static mappingModelFromBundlesForSourceModelDestinationModel(
		bundles: NSArray<interop.Object> | Array<interop.Object> | null,
		sourceModel: NSManagedObjectModel | null,
		destinationModel: NSManagedObjectModel | null,
	): NSMappingModel

	static inferredMappingModelForSourceModelDestinationModelError(
		sourceModel: NSManagedObjectModel,
		destinationModel: NSManagedObjectModel,
		error: interop.PointerConvertible,
	): NSMappingModel

	initWithContentsOfURL(url: NSURL | null): this

	get entityMappings(): NSArray
	set entityMappings(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly entityMappingsByName: NSDictionary
}

export declare class NSPersistentHistoryToken
	extends NSObject
	implements NSCopying, NSSecureCoding
{
	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
