/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./Foundation.d.ts" />

declare const CKQueryOperationMaximumResults: number;

declare const CKRecordTypeShare: string;

declare const CKErrorRetryAfterKey: string;

declare const CKRecordChangedErrorClientRecordKey: string;

declare const CKRecordChangedErrorServerRecordKey: string;

declare const CKRecordChangedErrorAncestorRecordKey: string;

declare const CKAccountChangedNotification: string;

declare const CKCurrentUserDefaultName: string;

declare const CKPartialErrorsByItemIDKey: string;

declare const CKRecordCreatorUserRecordIDKey: string;

declare const CKRecordShareKey: string;

declare const CKRecordParentKey: string;

declare const CKRecordModificationDateKey: string;

declare const CKRecordLastModifiedUserRecordIDKey: string;

declare const CKRecordTypeUserRecord: string;

declare const CKRecordRecordIDKey: string;

declare const CKShareTypeKey: string;

declare const CKShareTitleKey: string;

declare const CKOwnerDefaultName: string;

declare const CKErrorDomain: string;

declare const CKRecordZoneDefaultName: string;

declare const CKRecordCreationDateKey: string;

declare const CKShareThumbnailImageDataKey: string;

declare const CKSyncEngineAccountChangeType: {
  SignIn: 0,
  SignOut: 1,
  SwitchAccounts: 2,
};

declare const CKSyncEngineEventType: {
  StateUpdate: 0,
  AccountChange: 1,
  FetchedDatabaseChanges: 2,
  FetchedRecordZoneChanges: 3,
  SentDatabaseChanges: 4,
  SentRecordZoneChanges: 5,
  WillFetchChanges: 6,
  WillFetchRecordZoneChanges: 7,
  DidFetchRecordZoneChanges: 8,
  DidFetchChanges: 9,
  WillSendChanges: 10,
  DidSendChanges: 11,
};

declare const CKSyncEngineSyncReason: {
  Scheduled: 0,
  Manual: 1,
};

declare const CKSyncEnginePendingDatabaseChangeType: {
  Save: 0,
  Delete: 1,
};

declare const CKRecordSavePolicy: {
  IfServerRecordUnchanged: 0,
  ChangedKeys: 1,
  AllKeys: 2,
};

declare const CKShareParticipantAcceptanceStatus: {
  Unknown: 0,
  Pending: 1,
  Accepted: 2,
  Removed: 3,
};

declare const CKRecordZoneEncryptionScope: {
  Record: 0,
  Zone: 1,
};

declare const CKQueryNotificationReason: {
  Created: 1,
  Updated: 2,
  Deleted: 3,
};

declare const CKApplicationPermissionStatus: {
  InitialState: 0,
  CouldNotComplete: 1,
  Denied: 2,
  Granted: 3,
};

declare const CKApplicationPermissions: {
  CKApplicationPermissionUserDiscoverability: 1,
};

declare const CKAccountStatus: {
  CouldNotDetermine: 0,
  Available: 1,
  Restricted: 2,
  NoAccount: 3,
};

declare const CKShareParticipantRole: {
  Unknown: 0,
  Owner: 1,
  PrivateUser: 3,
  PublicUser: 4,
};

declare const CKSyncEnginePendingRecordZoneChangeType: {
  Save: 0,
  Delete: 1,
};

declare const CKNotificationType: {
  Query: 1,
  RecordZone: 2,
  ReadNotification: 3,
  Database: 4,
};

declare const CKShareParticipantType: {
  Unknown: 0,
  Owner: 1,
  PrivateUser: 3,
  PublicUser: 4,
};

declare const CKOperationGroupTransferSize: {
  Unknown: 0,
  Kilobytes: 1,
  Megabytes: 2,
  TensOfMegabytes: 3,
  HundredsOfMegabytes: 4,
  Gigabytes: 5,
  TensOfGigabytes: 6,
  HundredsOfGigabytes: 7,
};

declare const CKShareParticipantPermission: {
  Unknown: 0,
  None: 1,
  ReadOnly: 2,
  ReadWrite: 3,
};

declare const CKDatabaseScope: {
  Public: 1,
  Private: 2,
  Shared: 3,
};

declare const CKQuerySubscriptionOptions: {
  OnRecordCreation: 1,
  OnRecordUpdate: 2,
  OnRecordDeletion: 4,
  Once: 8,
};

declare const CKSubscriptionType: {
  Query: 1,
  RecordZone: 2,
  Database: 3,
};

declare const CKReferenceAction: {
  None: 0,
  DeleteSelf: 1,
};

declare const CKErrorCode: {
  InternalError: 1,
  PartialFailure: 2,
  NetworkUnavailable: 3,
  NetworkFailure: 4,
  BadContainer: 5,
  ServiceUnavailable: 6,
  RequestRateLimited: 7,
  MissingEntitlement: 8,
  NotAuthenticated: 9,
  PermissionFailure: 10,
  UnknownItem: 11,
  InvalidArguments: 12,
  ResultsTruncated: 13,
  ServerRecordChanged: 14,
  ServerRejectedRequest: 15,
  AssetFileNotFound: 16,
  AssetFileModified: 17,
  IncompatibleVersion: 18,
  ConstraintViolation: 19,
  OperationCancelled: 20,
  ChangeTokenExpired: 21,
  BatchRequestFailed: 22,
  ZoneBusy: 23,
  BadDatabase: 24,
  QuotaExceeded: 25,
  ZoneNotFound: 26,
  LimitExceeded: 27,
  UserDeletedZone: 28,
  TooManyParticipants: 29,
  AlreadyShared: 30,
  ReferenceViolation: 31,
  ManagedAccountRestricted: 32,
  ParticipantMayNeedVerification: 33,
  ServerResponseLost: 34,
  AssetNotAvailable: 35,
};

declare const CKRecordZoneCapabilities: {
  FetchChanges: 1,
  Atomic: 2,
  Sharing: 4,
};

declare const CKSyncEngineZoneDeletionReason: {
  Deleted: 0,
  Purged: 1,
  EncryptedDataReset: 2,
};

declare interface CKRecordKeyValueSetting extends NSObjectProtocol {
  objectForKey(key: string): CKRecordValue;

  setObjectForKey(object: CKRecordValue | null, key: string): void;

  objectForKeyedSubscript(key: string): CKRecordValue;

  setObjectForKeyedSubscript(object: CKRecordValue | null, key: string): void;

  allKeys(): NSArray;

  changedKeys(): NSArray;
}

declare class CKRecordKeyValueSetting extends NativeObject implements CKRecordKeyValueSetting {
}

declare interface CKRecordValue extends NSObjectProtocol {
}

declare class CKRecordValue extends NativeObject implements CKRecordValue {
}

declare class CKQueryOperation extends CKDatabaseOperation {
  init(): this;

  initWithQuery(query: CKQuery): this;

  initWithCursor(cursor: CKQueryCursor): this;

  query: CKQuery;

  cursor: CKQueryCursor;

  zoneID: CKRecordZoneID;

  resultsLimit: number;

  get desiredKeys(): NSArray;
  set desiredKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  recordFetchedBlock: (p1: CKRecord) => void;

  queryCompletionBlock: (p1: CKQueryCursor, p2: NSError) => void | null;
}

declare class CKModifyRecordsOperation extends CKDatabaseOperation {
  init(): this;

  initWithRecordsToSaveRecordIDsToDelete(records: NSArray<interop.Object> | Array<interop.Object> | null, recordIDs: NSArray<interop.Object> | Array<interop.Object> | null): this;

  get recordsToSave(): NSArray;
  set recordsToSave(value: NSArray<interop.Object> | Array<interop.Object>);

  get recordIDsToDelete(): NSArray;
  set recordIDsToDelete(value: NSArray<interop.Object> | Array<interop.Object>);

  savePolicy: interop.Enum<typeof CKRecordSavePolicy>;

  clientChangeTokenData: NSData;

  atomic: boolean;

  perRecordProgressBlock: (p1: CKRecord, p2: number) => void;

  perRecordCompletionBlock: (p1: CKRecord, p2: NSError) => void | null;

  modifyRecordsCompletionBlock: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSArray<interop.Object> | Array<interop.Object>, p3: NSError) => void | null;
}

declare class CKFetchSubscriptionsOperation extends CKDatabaseOperation {
  static fetchAllSubscriptionsOperation<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  init(): this;

  initWithSubscriptionIDs(subscriptionIDs: NSArray<interop.Object> | Array<interop.Object>): this;

  get subscriptionIDs(): NSArray;
  set subscriptionIDs(value: NSArray<interop.Object> | Array<interop.Object>);

  fetchSubscriptionCompletionBlock: (p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, p2: NSError) => void | null;
}

declare class CKFetchRecordZoneChangesOptions extends NSObject implements NSSecureCoding, NSCopying {
  previousServerChangeToken: CKServerChangeToken;

  resultsLimit: number;

  get desiredKeys(): NSArray;
  set desiredKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKFetchRecordChangesOperation extends CKDatabaseOperation {
  init(): this;

  initWithRecordZoneIDPreviousServerChangeToken(recordZoneID: CKRecordZoneID, previousServerChangeToken: CKServerChangeToken | null): this;

  recordZoneID: CKRecordZoneID;

  previousServerChangeToken: CKServerChangeToken;

  resultsLimit: number;

  get desiredKeys(): NSArray;
  set desiredKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  recordChangedBlock: (p1: CKRecord) => void;

  recordWithIDWasDeletedBlock: (p1: CKRecordID) => void;

  readonly moreComing: boolean;

  fetchRecordChangesCompletionBlock: (p1: CKServerChangeToken, p2: NSData, p3: NSError) => void | null;
}

declare class CKDiscoverUserIdentitiesOperation extends CKOperation {
  init(): this;

  initWithUserIdentityLookupInfos(userIdentityLookupInfos: NSArray<interop.Object> | Array<interop.Object>): this;

  get userIdentityLookupInfos(): NSArray;
  set userIdentityLookupInfos(value: NSArray<interop.Object> | Array<interop.Object>);

  userIdentityDiscoveredBlock: (p1: CKUserIdentity, p2: CKUserIdentityLookupInfo) => void;

  discoverUserIdentitiesCompletionBlock: (p1: NSError) => void | null;
}

declare class CKUserIdentityLookupInfo extends NSObject implements NSSecureCoding, NSCopying {
  initWithEmailAddress(emailAddress: string): this;

  initWithPhoneNumber(phoneNumber: string): this;

  initWithUserRecordID(userRecordID: CKRecordID): this;

  static lookupInfosWithEmails(emails: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  static lookupInfosWithPhoneNumbers(phoneNumbers: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  static lookupInfosWithRecordIDs(recordIDs: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  readonly emailAddress: string;

  readonly phoneNumber: string;

  readonly userRecordID: CKRecordID;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKUserIdentity extends NSObject implements NSSecureCoding, NSCopying {
  readonly userRecordID: CKRecordID;

  readonly lookupInfo: CKUserIdentityLookupInfo;

  readonly nameComponents: NSPersonNameComponents;

  readonly hasiCloudAccount: boolean;

  readonly contactIdentifiers: NSArray;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKShareMetadata extends NSObject implements NSCopying, NSSecureCoding {
  readonly containerIdentifier: string;

  readonly share: CKShare;

  readonly participantRole: interop.Enum<typeof CKShareParticipantRole>;

  readonly participantStatus: interop.Enum<typeof CKShareParticipantAcceptanceStatus>;

  readonly participantPermission: interop.Enum<typeof CKShareParticipantPermission>;

  readonly ownerIdentity: CKUserIdentity;

  readonly rootRecord: CKRecord;

  readonly participantType: interop.Enum<typeof CKShareParticipantType>;

  readonly rootRecordID: CKRecordID;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CKServerChangeToken extends NSObject implements NSCopying, NSSecureCoding {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CKQuery extends NSObject implements NSSecureCoding, NSCopying {
  initWithCoder(aDecoder: NSCoder): this;

  initWithRecordTypePredicate(recordType: string, predicate: NSPredicate): this;

  readonly recordType: string;

  readonly predicate: NSPredicate;

  get sortDescriptors(): NSArray;
  set sortDescriptors(value: NSArray<interop.Object> | Array<interop.Object>);

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKOperationGroup extends NSObject implements NSSecureCoding, NSCopying {
  init(): this;

  initWithCoder(aDecoder: NSCoder): this;

  readonly operationGroupID: string;

  defaultConfiguration: CKOperationConfiguration;

  name: string;

  quantity: number;

  expectedSendSize: interop.Enum<typeof CKOperationGroupTransferSize>;

  expectedReceiveSize: interop.Enum<typeof CKOperationGroupTransferSize>;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKQueryNotification extends CKNotification {
  readonly queryNotificationReason: interop.Enum<typeof CKQueryNotificationReason>;

  readonly recordFields: NSDictionary;

  readonly recordID: CKRecordID;

  readonly databaseScope: interop.Enum<typeof CKDatabaseScope>;
}

declare class CKNotificationID extends NSObject implements NSCopying, NSSecureCoding {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CKOperation extends NSOperation {
  init(): this;

  configuration: CKOperationConfiguration;

  group: CKOperationGroup;

  readonly operationID: string;

  longLivedOperationWasPersistedBlock: () => void;

  container: CKContainer;

  allowsCellularAccess: boolean;

  longLived: boolean;

  timeoutIntervalForRequest: number;

  timeoutIntervalForResource: number;

  isLongLived(): boolean;
}

declare class CKFetchDatabaseChangesOperation extends CKDatabaseOperation {
  init(): this;

  initWithPreviousServerChangeToken(previousServerChangeToken: CKServerChangeToken | null): this;

  previousServerChangeToken: CKServerChangeToken;

  resultsLimit: number;

  fetchAllChanges: boolean;

  recordZoneWithIDChangedBlock: (p1: CKRecordZoneID) => void;

  recordZoneWithIDWasDeletedBlock: (p1: CKRecordZoneID) => void;

  recordZoneWithIDWasPurgedBlock: (p1: CKRecordZoneID) => void;

  changeTokenUpdatedBlock: (p1: CKServerChangeToken) => void;

  fetchDatabaseChangesCompletionBlock: (p1: CKServerChangeToken, p2: boolean, p3: NSError) => void | null;
}

declare class CKRecordID extends NSObject implements NSSecureCoding, NSCopying {
  initWithRecordName(recordName: string): this;

  initWithRecordNameZoneID(recordName: string, zoneID: CKRecordZoneID): this;

  readonly recordName: string;

  readonly zoneID: CKRecordZoneID;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKShare extends CKRecord implements NSSecureCoding, NSCopying {
  initWithRootRecord(rootRecord: CKRecord): this;

  initWithRootRecordShareID(rootRecord: CKRecord, shareID: CKRecordID): this;

  initWithCoder(coder: NSCoder): this;
  initWithCoder(aDecoder: NSCoder): this;

  publicPermission: interop.Enum<typeof CKShareParticipantPermission>;

  readonly URL: NSURL;

  readonly participants: NSArray;

  readonly owner: CKShareParticipant;

  readonly currentUserParticipant: CKShareParticipant;

  addParticipant(participant: CKShareParticipant): void;

  removeParticipant(participant: CKShareParticipant): void;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKModifyRecordZonesOperation extends CKDatabaseOperation {
  init(): this;

  initWithRecordZonesToSaveRecordZoneIDsToDelete(recordZonesToSave: NSArray<interop.Object> | Array<interop.Object> | null, recordZoneIDsToDelete: NSArray<interop.Object> | Array<interop.Object> | null): this;

  get recordZonesToSave(): NSArray;
  set recordZonesToSave(value: NSArray<interop.Object> | Array<interop.Object>);

  get recordZoneIDsToDelete(): NSArray;
  set recordZoneIDsToDelete(value: NSArray<interop.Object> | Array<interop.Object>);

  modifyRecordZonesCompletionBlock: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSArray<interop.Object> | Array<interop.Object>, p3: NSError) => void | null;
}

declare class CKFetchWebAuthTokenOperation extends CKDatabaseOperation {
  init(): this;

  initWithAPIToken(APIToken: string): this;

  APIToken: string;

  fetchWebAuthTokenCompletionBlock: (p1: string, p2: NSError) => void | null;
}

declare class CKShareParticipant extends NSObject implements NSSecureCoding, NSCopying {
  readonly userIdentity: CKUserIdentity;

  role: interop.Enum<typeof CKShareParticipantRole>;

  type: interop.Enum<typeof CKShareParticipantType>;

  readonly acceptanceStatus: interop.Enum<typeof CKShareParticipantAcceptanceStatus>;

  permission: interop.Enum<typeof CKShareParticipantPermission>;

  readonly participantID: string;

  isEqual(object: interop.Object): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKDiscoverAllUserIdentitiesOperation extends CKOperation {
  init(): this;

  userIdentityDiscoveredBlock: (p1: CKUserIdentity) => void;

  discoverAllUserIdentitiesCompletionBlock: (p1: NSError) => void | null;
}

declare class CKNotification extends NSObject {
  static notificationFromRemoteNotificationDictionary<This extends abstract new (...args: any) => any>(this: This, notificationDictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): InstanceType<This>;

  readonly notificationType: interop.Enum<typeof CKNotificationType>;

  readonly notificationID: CKNotificationID;

  readonly containerIdentifier: string;

  readonly subscriptionOwnerUserRecordID: CKRecordID;

  readonly isPruned: boolean;

  readonly subscriptionID: string;

  readonly alertBody: string;

  readonly alertLocalizationKey: string;

  readonly alertLocalizationArgs: NSArray;

  readonly title: string;

  readonly titleLocalizationKey: string;

  readonly titleLocalizationArgs: NSArray;

  readonly subtitle: string;

  readonly subtitleLocalizationKey: string;

  readonly subtitleLocalizationArgs: NSArray;

  readonly alertActionLocalizationKey: string;

  readonly alertLaunchImage: string;

  readonly badge: NSNumber;

  readonly soundName: string;

  readonly category: string;
}

declare class CKDatabaseSubscription extends CKSubscription implements NSSecureCoding, NSCopying {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  initWithSubscriptionID(subscriptionID: string): this;

  initWithCoder(coder: NSCoder): this;
  initWithCoder(aDecoder: NSCoder): this;

  recordType: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKFetchShareMetadataOperation extends CKOperation {
  init(): this;

  initWithShareURLs(shareURLs: NSArray<interop.Object> | Array<interop.Object>): this;

  get shareURLs(): NSArray;
  set shareURLs(value: NSArray<interop.Object> | Array<interop.Object>);

  shouldFetchRootRecord: boolean;

  get rootRecordDesiredKeys(): NSArray;
  set rootRecordDesiredKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  perShareMetadataBlock: (p1: NSURL, p2: CKShareMetadata, p3: NSError) => void | null;

  fetchShareMetadataCompletionBlock: (p1: NSError) => void | null;
}

declare class CKRecordZone extends NSObject implements NSSecureCoding, NSCopying {
  static defaultRecordZone(): CKRecordZone;

  initWithZoneName(zoneName: string): this;

  initWithZoneID(zoneID: CKRecordZoneID): this;

  readonly zoneID: CKRecordZoneID;

  readonly capabilities: interop.Enum<typeof CKRecordZoneCapabilities>;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKSubscription extends NSObject implements NSSecureCoding, NSCopying {
  readonly subscriptionID: string;

  readonly subscriptionType: interop.Enum<typeof CKSubscriptionType>;

  notificationInfo: CKNotificationInfo;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKOperationConfiguration extends NSObject {
  container: CKContainer;

  qualityOfService: interop.Enum<typeof NSQualityOfService>;

  allowsCellularAccess: boolean;

  longLived: boolean;

  timeoutIntervalForRequest: number;

  timeoutIntervalForResource: number;

  isLongLived(): boolean;
}

declare class CKRecordZoneSubscription extends CKSubscription implements NSSecureCoding, NSCopying {
  initWithZoneID(zoneID: CKRecordZoneID): this;

  initWithZoneIDSubscriptionID(zoneID: CKRecordZoneID, subscriptionID: string): this;

  initWithCoder(coder: NSCoder): this;
  initWithCoder(aDecoder: NSCoder): this;

  readonly zoneID: CKRecordZoneID;

  recordType: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKLocationSortDescriptor extends NSSortDescriptor implements NSSecureCoding {
  initWithKeyRelativeLocation(key: string, relativeLocation: CLLocation): this;

  initWithCoder(coder: NSCoder): this;
  initWithCoder(aDecoder: NSCoder): this;

  readonly relativeLocation: CLLocation;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;
}

declare class CKFetchRecordsOperation extends CKDatabaseOperation {
  init(): this;

  initWithRecordIDs(recordIDs: NSArray<interop.Object> | Array<interop.Object>): this;

  static fetchCurrentUserRecordOperation<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  get recordIDs(): NSArray;
  set recordIDs(value: NSArray<interop.Object> | Array<interop.Object>);

  get desiredKeys(): NSArray;
  set desiredKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  perRecordProgressBlock: (p1: CKRecordID, p2: number) => void;

  perRecordCompletionBlock: (p1: CKRecord, p2: CKRecordID, p3: NSError) => void | null;

  fetchRecordsCompletionBlock: (p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, p2: NSError) => void | null;
}

declare class CKQueryCursor extends NSObject implements NSCopying, NSSecureCoding {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CKDatabase extends NSObject {
  addOperation(operation: CKDatabaseOperation): void;

  readonly databaseScope: interop.Enum<typeof CKDatabaseScope>;

  fetchRecordWithIDCompletionHandler(recordID: CKRecordID, completionHandler: (p1: CKRecord, p2: NSError) => void | null): void;

  saveRecordCompletionHandler(record: CKRecord, completionHandler: (p1: CKRecord, p2: NSError) => void | null): void;

  deleteRecordWithIDCompletionHandler(recordID: CKRecordID, completionHandler: (p1: CKRecordID, p2: NSError) => void | null): void;

  performQueryInZoneWithIDCompletionHandler(query: CKQuery, zoneID: CKRecordZoneID | null, completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  fetchAllRecordZonesWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  fetchRecordZoneWithIDCompletionHandler(zoneID: CKRecordZoneID, completionHandler: (p1: CKRecordZone, p2: NSError) => void | null): void;

  saveRecordZoneCompletionHandler(zone: CKRecordZone, completionHandler: (p1: CKRecordZone, p2: NSError) => void | null): void;

  deleteRecordZoneWithIDCompletionHandler(zoneID: CKRecordZoneID, completionHandler: (p1: CKRecordZoneID, p2: NSError) => void | null): void;

  fetchSubscriptionWithIDCompletionHandler(subscriptionID: string, completionHandler: (p1: CKSubscription, p2: NSError) => void | null): void;

  fetchAllSubscriptionsWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  saveSubscriptionCompletionHandler(subscription: CKSubscription, completionHandler: (p1: CKSubscription, p2: NSError) => void | null): void;

  deleteSubscriptionWithIDCompletionHandler(subscriptionID: string, completionHandler: (p1: string, p2: NSError) => void | null): void;
}

declare class CKDatabaseOperation extends CKOperation {
  database: CKDatabase;
}

declare class CKDatabaseNotification extends CKNotification {
  readonly databaseScope: interop.Enum<typeof CKDatabaseScope>;
}

declare class CKNotificationInfo extends NSObject implements NSSecureCoding, NSCopying {
  alertBody: string;

  alertLocalizationKey: string;

  get alertLocalizationArgs(): NSArray;
  set alertLocalizationArgs(value: NSArray<interop.Object> | Array<interop.Object>);

  title: string;

  titleLocalizationKey: string;

  get titleLocalizationArgs(): NSArray;
  set titleLocalizationArgs(value: NSArray<interop.Object> | Array<interop.Object>);

  subtitle: string;

  subtitleLocalizationKey: string;

  get subtitleLocalizationArgs(): NSArray;
  set subtitleLocalizationArgs(value: NSArray<interop.Object> | Array<interop.Object>);

  alertActionLocalizationKey: string;

  alertLaunchImage: string;

  soundName: string;

  get desiredKeys(): NSArray;
  set desiredKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  shouldBadge: boolean;

  shouldSendContentAvailable: boolean;

  shouldSendMutableContent: boolean;

  category: string;

  collapseIDKey: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKQuerySubscription extends CKSubscription implements NSSecureCoding, NSCopying {
  initWithRecordTypePredicateOptions(recordType: string, predicate: NSPredicate, querySubscriptionOptions: interop.Enum<typeof CKQuerySubscriptionOptions>): this;

  initWithRecordTypePredicateSubscriptionIDOptions(recordType: string, predicate: NSPredicate, subscriptionID: string, querySubscriptionOptions: interop.Enum<typeof CKQuerySubscriptionOptions>): this;

  initWithCoder(coder: NSCoder): this;
  initWithCoder(aDecoder: NSCoder): this;

  readonly recordType: string;

  readonly predicate: NSPredicate;

  zoneID: CKRecordZoneID;

  readonly querySubscriptionOptions: interop.Enum<typeof CKQuerySubscriptionOptions>;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKRecord extends NSObject implements NSSecureCoding, NSCopying, CKRecordKeyValueSetting {
  initWithRecordType(recordType: string): this;

  initWithRecordTypeRecordID(recordType: string, recordID: CKRecordID): this;

  initWithRecordTypeZoneID(recordType: string, zoneID: CKRecordZoneID): this;

  readonly recordType: string;

  readonly recordID: CKRecordID;

  readonly recordChangeTag: string;

  readonly creatorUserRecordID: CKRecordID;

  readonly creationDate: NSDate;

  readonly lastModifiedUserRecordID: CKRecordID;

  readonly modificationDate: NSDate;

  objectForKey(key: string): CKRecordValue;

  setObjectForKey(object: CKRecordValue | null, key: string): void;

  allKeys(): NSArray;

  allTokens(): NSArray;

  objectForKeyedSubscript(key: string): CKRecordValue;

  setObjectForKeyedSubscript(object: CKRecordValue | null, key: string): void;

  changedKeys(): NSArray;

  encodeSystemFieldsWithCoder(coder: NSCoder): void;

  readonly share: CKReference;

  parent: CKReference;

  setParentReferenceFromRecord(parentRecord: CKRecord | null): void;

  setParentReferenceFromRecordID(parentRecordID: CKRecordID | null): void;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class CKFetchShareParticipantsOperation extends CKOperation {
  init(): this;

  initWithUserIdentityLookupInfos(userIdentityLookupInfos: NSArray<interop.Object> | Array<interop.Object>): this;

  get userIdentityLookupInfos(): NSArray;
  set userIdentityLookupInfos(value: NSArray<interop.Object> | Array<interop.Object>);

  shareParticipantFetchedBlock: (p1: CKShareParticipant) => void;

  perShareParticipantCompletionBlock: (p1: CKUserIdentityLookupInfo, p2: CKShareParticipant, p3: NSError) => void | null;

  fetchShareParticipantsCompletionBlock: (p1: NSError) => void | null;
}

declare class CKFetchRecordZoneChangesConfiguration extends NSObject implements NSSecureCoding, NSCopying {
  previousServerChangeToken: CKServerChangeToken;

  resultsLimit: number;

  get desiredKeys(): NSArray;
  set desiredKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKFetchRecordZonesOperation extends CKDatabaseOperation {
  static fetchAllRecordZonesOperation<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  init(): this;

  initWithRecordZoneIDs(zoneIDs: NSArray<interop.Object> | Array<interop.Object>): this;

  get recordZoneIDs(): NSArray;
  set recordZoneIDs(value: NSArray<interop.Object> | Array<interop.Object>);

  fetchRecordZonesCompletionBlock: (p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, p2: NSError) => void | null;
}

declare class CKRecordZoneID extends NSObject implements NSSecureCoding, NSCopying {
  initWithZoneNameOwnerName(zoneName: string, ownerName: string): this;

  readonly zoneName: string;

  readonly ownerName: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CKFetchRecordZoneChangesOperation extends CKDatabaseOperation {
  init(): this;

  initWithRecordZoneIDsConfigurationsByRecordZoneID(recordZoneIDs: NSArray<interop.Object> | Array<interop.Object>, configurationsByRecordZoneID: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  get recordZoneIDs(): NSArray;
  set recordZoneIDs(value: NSArray<interop.Object> | Array<interop.Object>);

  get configurationsByRecordZoneID(): NSDictionary;
  set configurationsByRecordZoneID(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  fetchAllChanges: boolean;

  recordChangedBlock: (p1: CKRecord) => void;

  recordWithIDWasDeletedBlock: (p1: CKRecordID, p2: string) => void;

  recordZoneChangeTokensUpdatedBlock: (p1: CKRecordZoneID, p2: CKServerChangeToken, p3: NSData) => void | null;

  recordZoneFetchCompletionBlock: (p1: CKRecordZoneID, p2: CKServerChangeToken, p3: NSData, p4: boolean, p5: NSError) => void | null;

  fetchRecordZoneChangesCompletionBlock: (p1: NSError) => void | null;

  initWithRecordZoneIDsOptionsByRecordZoneID(recordZoneIDs: NSArray<interop.Object> | Array<interop.Object>, optionsByRecordZoneID: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  get optionsByRecordZoneID(): NSDictionary;
  set optionsByRecordZoneID(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);
}

declare class CKReference extends NSObject implements NSSecureCoding, NSCopying, CKRecordValue {
  initWithRecordIDAction(recordID: CKRecordID, action: interop.Enum<typeof CKReferenceAction>): this;

  initWithRecordAction(record: CKRecord, action: interop.Enum<typeof CKReferenceAction>): this;

  readonly referenceAction: interop.Enum<typeof CKReferenceAction>;

  readonly recordID: CKRecordID;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class CKContainer extends NSObject {
  static defaultContainer(): CKContainer;

  static containerWithIdentifier(containerIdentifier: string): CKContainer;

  readonly containerIdentifier: string;

  addOperation(operation: CKOperation): void;

  readonly privateCloudDatabase: CKDatabase;

  readonly publicCloudDatabase: CKDatabase;

  readonly sharedCloudDatabase: CKDatabase;

  databaseWithDatabaseScope(databaseScope: interop.Enum<typeof CKDatabaseScope>): CKDatabase;

  accountStatusWithCompletionHandler(completionHandler: (p1: interop.Enum<typeof CKAccountStatus>, p2: NSError) => void | null): void;

  statusForApplicationPermissionCompletionHandler(applicationPermission: interop.Enum<typeof CKApplicationPermissions>, completionHandler: (p1: interop.Enum<typeof CKApplicationPermissionStatus>, p2: NSError) => void): void;

  requestApplicationPermissionCompletionHandler(applicationPermission: interop.Enum<typeof CKApplicationPermissions>, completionHandler: (p1: interop.Enum<typeof CKApplicationPermissionStatus>, p2: NSError) => void): void;

  fetchUserRecordIDWithCompletionHandler(completionHandler: (p1: CKRecordID, p2: NSError) => void | null): void;

  discoverAllIdentitiesWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  discoverUserIdentityWithEmailAddressCompletionHandler(email: string, completionHandler: (p1: CKUserIdentity, p2: NSError) => void | null): void;

  discoverUserIdentityWithPhoneNumberCompletionHandler(phoneNumber: string, completionHandler: (p1: CKUserIdentity, p2: NSError) => void | null): void;

  discoverUserIdentityWithUserRecordIDCompletionHandler(userRecordID: CKRecordID, completionHandler: (p1: CKUserIdentity, p2: NSError) => void | null): void;

  fetchShareParticipantWithEmailAddressCompletionHandler(emailAddress: string, completionHandler: (p1: CKShareParticipant, p2: NSError) => void | null): void;

  fetchShareParticipantWithPhoneNumberCompletionHandler(phoneNumber: string, completionHandler: (p1: CKShareParticipant, p2: NSError) => void | null): void;

  fetchShareParticipantWithUserRecordIDCompletionHandler(userRecordID: CKRecordID, completionHandler: (p1: CKShareParticipant, p2: NSError) => void | null): void;

  fetchShareMetadataWithURLCompletionHandler(url: NSURL, completionHandler: (p1: CKShareMetadata, p2: NSError) => void | null): void;

  acceptShareMetadataCompletionHandler(metadata: CKShareMetadata, completionHandler: (p1: CKShare, p2: NSError) => void | null): void;

  fetchAllLongLivedOperationIDsWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  fetchLongLivedOperationWithIDCompletionHandler(operationID: string, completionHandler: (p1: CKOperation, p2: NSError) => void | null): void;
}

declare class CKModifySubscriptionsOperation extends CKDatabaseOperation {
  init(): this;

  initWithSubscriptionsToSaveSubscriptionIDsToDelete(subscriptionsToSave: NSArray<interop.Object> | Array<interop.Object> | null, subscriptionIDsToDelete: NSArray<interop.Object> | Array<interop.Object> | null): this;

  get subscriptionsToSave(): NSArray;
  set subscriptionsToSave(value: NSArray<interop.Object> | Array<interop.Object>);

  get subscriptionIDsToDelete(): NSArray;
  set subscriptionIDsToDelete(value: NSArray<interop.Object> | Array<interop.Object>);

  modifySubscriptionsCompletionBlock: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSArray<interop.Object> | Array<interop.Object>, p3: NSError) => void | null;
}

declare class CKAcceptSharesOperation extends CKOperation {
  init(): this;

  initWithShareMetadatas(shareMetadatas: NSArray<interop.Object> | Array<interop.Object>): this;

  get shareMetadatas(): NSArray;
  set shareMetadatas(value: NSArray<interop.Object> | Array<interop.Object>);

  perShareCompletionBlock: (p1: CKShareMetadata, p2: CKShare, p3: NSError) => void | null;

  acceptSharesCompletionBlock: (p1: NSError) => void | null;
}

declare class CKAsset extends NSObject implements CKRecordValue {
  initWithFileURL(fileURL: NSURL): this;

  readonly fileURL: NSURL;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class CKRecordZoneNotification extends CKNotification {
  readonly recordZoneID: CKRecordZoneID;

  readonly databaseScope: interop.Enum<typeof CKDatabaseScope>;
}

