/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const FSKitVersionString: interop.Pointer;

declare const FSKitVersionNumber: number;

declare const FSExtentType: {
  Data: 0,
  ZeroFill: 1,
};

declare const FSDataCacheMode: {
  None: 0,
  ReadWithCache: 1,
  ReadWriteWithCache: 2,
};

declare const FSSeekRegion: {
  Hole: 1,
  Data: 2,
};

declare const FSPreallocateFlags: {
  Contiguous: 2,
  All: 4,
  Persist: 8,
  FromEOF: 16,
};

declare const FSSetXattrPolicy: {
  AlwaysSet: 0,
  MustCreate: 1,
  MustReplace: 2,
  Delete: 3,
};

declare const FSVolumeCaseFormat: {
  Sensitive: 0,
  Insensitive: 1,
  InsensitiveCasePreserving: 2,
};

declare const FSMountOptions: {
  FSMountOptionsReadOnly: 1,
};

declare const FSMatchResult: {
  NotRecognized: 0,
  Recognized: 1,
  UsableButLimited: 2,
  Usable: 3,
};

declare const FSItemID: {
  Invalid: 0,
  ParentOfRoot: 1,
  RootDirectory: 2,
};

declare const FSAccessMask: {
  ReadData: 2,
  ListDirectory: 2,
  WriteData: 4,
  AddFile: 4,
  Execute: 8,
  Search: 8,
  Delete: 16,
  AppendData: 32,
  AddSubdirectory: 32,
  DeleteChild: 64,
  ReadAttributes: 128,
  WriteAttributes: 256,
  ReadXattr: 512,
  WriteXattr: 1024,
  ReadSecurity: 2048,
  WriteSecurity: 4096,
  TakeOwnership: 8192,
};

declare const FSKernelCacheCoherencyAction: {
  Push: 0,
  PushInvalidate: 1,
  Invalidate: 2,
  Update: 3,
  Revoke: 4,
};

declare const FSErrorCode: {
  ModuleLoadFailed: 4500,
  ResourceUnrecognized: 4501,
  ResourceDamaged: 4502,
  ResourceUnusable: 4503,
  StatusOperationInProgress: 4504,
  StatusOperationPaused: 4505,
  InvalidDirectoryCookie: 4506,
};

declare const FSItemDeactivationOptions: {
  Never: 0,
  Always: -1,
  ForRemovedItems: 1,
  ForPreallocatedItems: 2,
};

declare const FSCompleteIOFlags: {
  Read: 256,
  Write: 512,
  Async: 1024,
};

declare const FSDeactivateOptions: {
  FSDeactivateOptionsForce: 1,
};

declare const FSVolumeOpenModes: {
  Read: 1,
  Write: 2,
};

declare const FSSyncFlags: {
  FSSyncFlagsWait: 1,
  No: 2,
  D: 4,
};

declare const FSContainerState: {
  NotReady: 0,
  Blocked: 1,
  Ready: 2,
  Active: 3,
};

declare const FSItemType: {
  Unknown: 0,
  File: 1,
  Directory: 2,
  Symlink: 3,
  FIFO: 4,
  CharDevice: 5,
  BlockDevice: 6,
  Socket: 7,
};

declare const FSItemAttribute: {
  Type: 1,
  Mode: 2,
  LinkCount: 4,
  UID: 8,
  GID: 16,
  Flags: 32,
  Size: 64,
  AllocSize: 128,
  FileID: 256,
  ParentID: 512,
  AccessTime: 1024,
  ModifyTime: 2048,
  ChangeTime: 4096,
  BirthTime: 8192,
  BackupTime: 16384,
  AddedTime: 32768,
  SupportsLimitedXAttrs: 65536,
  InhibitKernelOffloadedIO: 131072,
};

declare const FSBlockmapFlags: {
  Read: 256,
  Write: 512,
};

declare const FSKernelCacheCoherencyType: {
  NoCache: 0,
  ReadCache: 1,
  WriteThrough: 2,
  WriteBack: 3,
};

declare const FSDataCacheErrorCode: {
  InvalidCacheModeCoherency: 4510,
  InvalidCacheTransition: 4511,
  CacheFlushFailed: 4512,
  CacheInvalidationFailed: 4513,
  CacheOperationConflict: 4514,
};

declare class FSContainerStatus extends NSObject implements NSCopying {
  readonly state: interop.Enum<typeof FSContainerState>;

  readonly status: NSError;

  static readonly active: FSContainerStatus;

  static activeWithStatus<This extends abstract new (...args: any) => any>(this: This, errorStatus: NSError): InstanceType<This>;

  static blockedWithStatus<This extends abstract new (...args: any) => any>(this: This, errorStatus: NSError): InstanceType<This>;

  static notReadyWithStatus<This extends abstract new (...args: any) => any>(this: This, errorStatus: NSError): InstanceType<This>;

  static readonly ready: FSContainerStatus;

  static readyWithStatus<This extends abstract new (...args: any) => any>(this: This, errorStatus: NSError): InstanceType<This>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class FSMetadataRange extends NSObject {
  readonly startOffset: number;

  readonly segmentLength: number;

  readonly segmentCount: number;

  initWithOffsetSegmentLengthSegmentCount(startOffset: number, segmentLength: number, segmentCount: number): this;

  static rangeWithOffsetSegmentLengthSegmentCount<This extends abstract new (...args: any) => any>(this: This, startOffset: number, segmentLength: number, segmentCount: number): InstanceType<This>;
}

