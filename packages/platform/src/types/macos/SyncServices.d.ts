import type { NSManagedObject, NSPersistentStoreCoordinator } from './CoreData'

import type { NSArray, NSCoder, NSCoding, NSDate, NSDictionary, NSEnumerator, NSError, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const ISyncInvalidArgumentsException: string;

export declare const ISyncInvalidSchemaException: string;

export declare const ISyncSessionDriverFatalError: number;

export declare const ISyncSessionDriverRegistrationError: number;

export declare const ISyncSessionUserCanceledSessionError: number;

export declare const ISyncErrorDomain: string;

export declare const ISyncRecordEntityNameKey: string;

export declare const ISyncUnsupportedEntityException: string;

export declare const ISyncInvalidRecordsKey: string;

export declare const ISyncInvalidRecordReasonsKey: string;

export declare const ISyncInvalidRecordIdentifiersKey: string;

export declare const ISyncSessionCancelledException: string;

export declare const ISyncServerUnavailableException: string;

export declare const ISyncAvailabilityChangedNotification: string;

export declare const ISyncClientTypePeer: string;

export declare const ISyncChangePropertyValueIsDefaultKey: string;

export declare const ISyncChangePropertyValueKey: string;

export declare const ISyncChangePropertyNameKey: string;

export declare const ISyncChangePropertyClear: string;

export declare const ISyncChangePropertySet: string;

export declare const ISyncInvalidEntityException: string;

export declare const ISyncClientTypeDevice: string;

export declare const ISyncChangePropertyActionKey: string;

export declare const ISyncSessionUnavailableException: string;

export declare const ISyncSessionDriverPullFailureError: number;

export declare const ISyncSessionClientAlreadySyncingError: number;

export declare const ISyncClientTypeApplication: string;

export declare const ISyncInvalidRecordException: string;

export declare const ISyncClientTypeServer: string;

export declare const ISyncServerDisabledReason: {
  None: 1000,
  ByPreference: 1001,
  SharedNetworkHome: 1002,
  Unresponsive: 1003,
  Unknown: 1004,
};

export declare const ISyncSessionDriverMode: {
  Fast: 1,
  Slow: 2,
  Refresh: 3,
};

export declare const __ISyncStatus: {
  Running: 1,
  Success: 2,
  Warnings: 3,
  Errors: 4,
  Cancelled: 5,
  Failed: 6,
  Never: 7,
};

export declare const ISyncSessionDriverChangeResult: {
  Refused: 0,
  Accepted: 1,
  Ignored: 2,
  Error: 3,
};

export declare const __ISyncChangeType: {
  None: 0,
  Add: 1,
  Modify: 2,
  Delete: 3,
};

export declare interface NSPersistentStoreCoordinatorSyncing extends NSObjectProtocol {
  managedObjectContextsToMonitorWhenSyncingPersistentStoreCoordinator?(coordinator: NSPersistentStoreCoordinator): NSArray;

  managedObjectContextsToReloadAfterSyncingPersistentStoreCoordinator?(coordinator: NSPersistentStoreCoordinator): NSArray;

  persistentStoreCoordinatorShouldStartSyncing?(coordinator: NSPersistentStoreCoordinator): boolean;

  persistentStoreCoordinatorWillPushChangesInSyncSession?(coordinator: NSPersistentStoreCoordinator, session: ISyncSession): void;

  persistentStoreCoordinatorDidPushChangesInSyncSession?(coordinator: NSPersistentStoreCoordinator, session: ISyncSession): void;

  persistentStoreCoordinatorWillPullChangesInSyncSession?(coordinator: NSPersistentStoreCoordinator, session: ISyncSession): void;

  persistentStoreCoordinatorDidPullChangesInSyncSession?(coordinator: NSPersistentStoreCoordinator, session: ISyncSession): void;

  persistentStoreCoordinatorDidFinishSyncSession?(coordinator: NSPersistentStoreCoordinator, session: ISyncSession): void;

  persistentStoreCoordinatorDidCancelSyncSessionError?(coordinator: NSPersistentStoreCoordinator, session: ISyncSession, error: NSError): void;

  persistentStoreCoordinatorWillPushRecordForManagedObjectInSyncSession?(coordinator: NSPersistentStoreCoordinator, record: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, managedObject: NSManagedObject, session: ISyncSession): NSDictionary;

  persistentStoreCoordinatorWillDeleteRecordWithIdentifierInSyncSession?(coordinator: NSPersistentStoreCoordinator, identifier: string, session: ISyncSession): boolean;

  persistentStoreCoordinatorWillApplyChangeToManagedObjectInSyncSession?(coordinator: NSPersistentStoreCoordinator, change: ISyncChange, managedObject: NSManagedObject, session: ISyncSession): ISyncChange;

  persistentStoreCoordinatorDidApplyChangeToManagedObjectInSyncSession?(coordinator: NSPersistentStoreCoordinator, change: ISyncChange, managedObject: NSManagedObject, session: ISyncSession): void;

  persistentStoreCoordinatorDidCommitChangesInSyncSession?(coordinator: NSPersistentStoreCoordinator, changes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, session: ISyncSession): void;
}

export declare class NSPersistentStoreCoordinatorSyncing extends NativeObject implements NSPersistentStoreCoordinatorSyncing {
}

export declare interface ISyncSessionDriverDataSource {
  clientIdentifier(): string;

  clientDescriptionURL(): NSURL;

  schemaBundleURLs(): NSArray;

  preferredSyncModeForEntityName(entity: string): interop.Enum<typeof ISyncSessionDriverMode>;

  recordsForEntityNameMoreComingError(entity: string, moreComing: interop.PointerConvertible, outError: interop.PointerConvertible): NSDictionary;

  applyChangeForEntityNameRemappedRecordIdentifierFormattedRecordError(change: ISyncChange, entityName: string, outRecordIdentifier: interop.PointerConvertible, outRecord: interop.PointerConvertible, outError: interop.PointerConvertible): interop.Enum<typeof ISyncSessionDriverChangeResult>;

  deleteAllRecordsForEntityNameError(entityName: string, outError: interop.PointerConvertible): boolean;

  entityNamesToSync?(): NSArray;

  entityNamesToPull?(): NSArray;

  sessionBeginTimeout?(): number;

  sessionPullChangesTimeout?(): number;

  lastAnchorForEntityName?(entityName: string): string;

  nextAnchorForEntityName?(entityName: string): string;

  changedRecordsForEntityNameMoreComingError?(entity: string, moreComing: interop.PointerConvertible, outError: interop.PointerConvertible): NSDictionary;

  changesForEntityNameMoreComingError?(entity: string, moreComing: interop.PointerConvertible, outError: interop.PointerConvertible): NSArray;

  identifiersForRecordsToDeleteForEntityNameMoreComingError?(entityName: string, moreComing: interop.PointerConvertible, outError: interop.PointerConvertible): NSArray;
}

export declare class ISyncSessionDriverDataSource extends NativeObject implements ISyncSessionDriverDataSource {
}

export declare interface ISyncFiltering extends NSCoding {
  isEqual(anotherFilter: interop.Object): boolean;

  supportedEntityNames(): NSArray;

  shouldApplyRecordWithRecordIdentifier(record: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, recordId: string): boolean;
}

export declare class ISyncFiltering extends NativeObject implements ISyncFiltering {
}

export declare class ISyncSession extends NSObject {
  static beginSessionWithClientEntityNamesBeforeDate(client: ISyncClient, entityNames: NSArray<interop.Object> | Array<interop.Object>, date: NSDate): ISyncSession;

  static beginSessionInBackgroundWithClientEntityNamesTargetSelector(client: ISyncClient, entityNames: NSArray<interop.Object> | Array<interop.Object>, target: interop.Object, selector: string): void;

  static cancelPreviousBeginSessionWithClient(client: ISyncClient): void;

  static beginSessionWithClientEntityNamesBeforeDateLastAnchors(client: ISyncClient, entityNames: NSArray<interop.Object> | Array<interop.Object>, date: NSDate, anchors: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): ISyncSession;

  static beginSessionInBackgroundWithClientEntityNamesTargetSelectorLastAnchors(client: ISyncClient, entityNames: NSArray<interop.Object> | Array<interop.Object>, target: interop.Object, selector: string, anchors: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  clientDidResetEntityNames(entityNames: NSArray<interop.Object> | Array<interop.Object>): void;

  clientWantsToPushAllRecordsForEntityNames(entityNames: NSArray<interop.Object> | Array<interop.Object>): void;

  shouldPushChangesForEntityName(entityName: string): boolean;

  shouldPushAllRecordsForEntityName(entityName: string): boolean;

  shouldPullChangesForEntityName(entityName: string): boolean;

  shouldReplaceAllRecordsOnClientForEntityName(entityName: string): boolean;

  pushChange(change: ISyncChange): void;

  pushChangesFromRecordWithIdentifier(record: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, recordId: string): void;

  deleteRecordWithIdentifier(recordId: string): void;

  clientLostRecordWithIdentifierShouldReplaceOnNextSync(recordId: string, flag: boolean): void;

  clientFinishedPushingChangesWithNextAnchors(anchors: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  prepareToPullChangesForEntityNamesBeforeDate(entityNames: NSArray<interop.Object> | Array<interop.Object>, date: NSDate): boolean;

  prepareToPullChangesInBackgroundForEntityNamesTargetSelector(entityNames: NSArray<interop.Object> | Array<interop.Object>, target: interop.Object, selector: string): void;

  changeEnumeratorForEntityNames(entityNames: NSArray<interop.Object> | Array<interop.Object>): NSEnumerator;

  clientAcceptedChangesForRecordWithIdentifierFormattedRecordNewRecordIdentifier(recordId: string, formattedRecord: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, recordId_: string): void;

  clientRefusedChangesForRecordWithIdentifier(recordId: string): void;

  clientCommittedAcceptedChanges(): void;

  clientCommittedAcceptedChangesWithNextAnchors(anchors: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  clientChangedRecordIdentifiers(oldToNew: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  isCancelled(): boolean;

  cancelSyncing(): void;

  finishSyncing(): void;

  clientInfoForRecordWithIdentifier(recordId: string): interop.Object;

  setClientInfoForRecordWithIdentifier(clientInfo: NSCoding, recordId: string): void;

  snapshotOfRecordsInTruth(): ISyncRecordSnapshot;

  ping(): void;
}

export declare class ISyncClient extends NSObject {
  clientIdentifier(): string;

  clientType(): string;

  displayName(): string;

  setDisplayName(displayName: string): void;

  imagePath(): string;

  setImagePath(path: string): void;

  supportedEntityNames(): NSArray;

  canPushChangesForEntityName(entityName: string): boolean;

  canPullChangesForEntityName(entityName: string): boolean;

  lastSyncDateForEntityName(entityName: string): NSDate;

  lastSyncStatusForEntityName(entityName: string): number;

  enabledEntityNames(): NSArray;

  isEnabledForEntityName(entityName: string): boolean;

  setEnabledForEntityNames(flag: boolean, entityNames: NSArray<interop.Object> | Array<interop.Object>): void;

  formatsRelationships(): boolean;

  setFormatsRelationships(flag: boolean): void;

  shouldReplaceClientRecordsForEntityName(entityName: string): boolean;

  setShouldReplaceClientRecordsForEntityNames(flag: boolean, entityNames: NSArray<interop.Object> | Array<interop.Object>): void;

  objectForKey(key: string): interop.Object;

  setObjectForKey(value: NSCoding, key: string): void;

  filters(): NSArray;

  setFilters(filters: NSArray<interop.Object> | Array<interop.Object>): void;

  shouldSynchronizeWithClientsOfType(clientType: string): boolean;

  setShouldSynchronizeWithClientsOfType(flag: boolean, clientType: string): void;

  syncAlertToolPath(): string;

  setSyncAlertToolPath(path: string): void;

  setSyncAlertHandlerSelector(handler: interop.Object, selector: string): void;
}

export declare class ISyncChange extends NSObject {
  static changeWithTypeRecordIdentifierChanges(type: number, recordIdentifier: string, changes: NSArray<interop.Object> | Array<interop.Object>): interop.Object;

  initWithChangeTypeRecordIdentifierChanges(type: number, recordIdentifier: string, changes: NSArray<interop.Object> | Array<interop.Object>): this;

  type(): number;

  recordIdentifier(): string;

  record(): NSDictionary;

  changes(): NSArray;
}

export declare class ISyncSessionDriver extends NSObject {
  static sessionDriverWithDataSource(dataSource: ISyncSessionDriverDataSource): ISyncSessionDriver;

  sync(): boolean;

  startAsynchronousSync(outError: interop.PointerConvertible): boolean;

  lastError(): NSError;

  dataSource(): ISyncSessionDriverDataSource;

  setDelegate(delegate: interop.Object): void;

  delegate(): interop.Object;

  setHandlesSyncAlerts(yesOrNo: boolean): void;

  handlesSyncAlerts(): boolean;

  client(): ISyncClient;

  session(): ISyncSession;

  finishSyncing(): void;
}

export declare class ISyncFilter extends NSObject {
  static filterMatchingAllFilters(filters: NSArray<interop.Object> | Array<interop.Object>): ISyncFiltering;

  static filterMatchingAtLeastOneFilter(filters: NSArray<interop.Object> | Array<interop.Object>): ISyncFiltering;
}

export declare class ISyncRecordReference extends NSObject implements NSCoding {
  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class ISyncRecordSnapshot extends NSObject {
  recordsWithIdentifiers(recordIds: NSArray<interop.Object> | Array<interop.Object>): NSDictionary;

  targetIdentifiersForRelationshipNameWithSourceIdentifier(relationshipName: string, sourceId: string): NSArray;

  sourceIdentifiersForRelationshipNameWithTargetIdentifier(relationshipName: string, sourceId: string): NSArray;

  recordsWithMatchingAttributes(attributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSDictionary;

  recordReferenceForRecordWithIdentifier(identifier: string): ISyncRecordReference;

  recordIdentifierForReferenceIsModified(reference: ISyncRecordReference, pModified: interop.PointerConvertible): string;
}

export declare class ISyncManager extends NSObject {
  static sharedManager(): ISyncManager;

  isEnabled(): boolean;

  syncDisabledReason(): NSError;

  clientWithIdentifier(clientId: string): ISyncClient;

  registerClientWithIdentifierDescriptionFilePath(clientId: string, descriptionFilePath: string): ISyncClient;

  unregisterClient(client: ISyncClient): void;

  registerSchemaWithBundlePath(bundlePath: string): boolean;

  unregisterSchemaWithName(schemaName: string): void;

  clientWithIdentifierNeedsSyncing(clientId: string, flag: boolean): void;

  snapshotOfRecordsInTruthWithEntityNamesUsingIdentifiersForClient(entityNames: NSArray<interop.Object> | Array<interop.Object>, client: ISyncClient): ISyncRecordSnapshot;

  addRequestMode(mode: string): void;

  removeRequestMode(mode: string): void;

  requestModes(): NSArray;
}
