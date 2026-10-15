import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'



export declare const kDADiskDescriptionWatchVolumePath: interop.Object;

export declare const kDADiskEjectOptionDefault: number;

export declare const kDADiskUnmountOptionForce: number;

export declare const kDADiskUnmountOptionDefault: number;

export declare const kDADiskRenameOptionDefault: number;

export declare const kDADiskMountOptionNoFollow: number;

export declare const kDADiskMountOptionWhole: number;

export declare const kDADiskMountOptionDefault: number;

export declare const kDAReturnNotMounted: number;

export declare const kDAReturnBadArgument: number;

export declare const kDAReturnNotPermitted: number;

export declare const kDADiskDescriptionMatchMediaWhole: interop.Object;

export declare const kDADiskClaimOptionDefault: number;

export declare const kDAReturnUnsupported: number;

export declare const kDAReturnNotFound: number;

export declare const kDADiskDescriptionMatchVolumeUnrecognized: interop.Object;

export declare const kDADiskDescriptionDeviceGUIDKey: interop.Pointer;

export declare const kDAReturnNotWritable: number;

export declare const kDADiskDescriptionMediaKindKey: interop.Pointer;

export declare const kDADiskDescriptionMatchVolumeMountable: interop.Object;

export declare const kDADiskDescriptionMediaBSDMajorKey: interop.Pointer;

export declare const kDADiskDescriptionMediaLeafKey: interop.Pointer;

export declare const kDADiskDescriptionDeviceVendorKey: interop.Pointer;

export declare const kDADiskDescriptionVolumePathKey: interop.Pointer;

export declare const kDADiskDescriptionVolumeUUIDKey: interop.Pointer;

export declare const kDADiskDescriptionMediaTypeKey: interop.Pointer;

export declare const kDADiskDescriptionVolumeNameKey: interop.Pointer;

export declare const kDADiskDescriptionMediaBSDUnitKey: interop.Pointer;

export declare const kDADiskDescriptionMediaEjectableKey: interop.Pointer;

export declare const kDADiskDescriptionBusNameKey: interop.Pointer;

export declare const kDADiskDescriptionDevicePathKey: interop.Pointer;

export declare const kDADiskDescriptionBusPathKey: interop.Pointer;

export declare const kDADiskDescriptionDeviceModelKey: interop.Pointer;

export declare const kDADiskDescriptionDeviceInternalKey: interop.Pointer;

export declare const kDADiskDescriptionMediaWritableKey: interop.Pointer;

export declare const kDADiskDescriptionMediaWholeKey: interop.Pointer;

export declare const kDADiskDescriptionMediaBSDNameKey: interop.Pointer;

export declare const kDADiskDescriptionMediaBSDMinorKey: interop.Pointer;

export declare const kDADiskDescriptionMediaBlockSizeKey: interop.Pointer;

export declare const kDADiskDescriptionVolumeTypeKey: interop.Pointer;

export declare const kDADiskDescriptionVolumeKindKey: interop.Pointer;

export declare const kDADiskDescriptionMediaRemovableKey: interop.Pointer;

export declare const kDADiskDescriptionDeviceProtocolKey: interop.Pointer;

export declare const kDADiskDescriptionDeviceUnitKey: interop.Pointer;

export declare const kDADiskDescriptionMediaPathKey: interop.Pointer;

export declare const kDADiskOptionDefault: number;

export declare const kDADiskDescriptionMediaContentKey: interop.Pointer;

export declare const kDAReturnBusy: number;

export declare const kDAReturnNotPrivileged: number;

export declare const kDAReturnSuccess: number;

export declare const kDADiskDescriptionWatchVolumeName: interop.Object;

export declare const kDAReturnNotReady: number;

export declare const kDADiskDescriptionMatchMediaUnformatted: interop.Object;

export declare const kDAReturnError: number;

export declare const kDADiskDescriptionMediaEncryptionDetailKey: interop.Pointer;

export declare const kDADiskDescriptionMediaUUIDKey: interop.Pointer;

export declare const kDADiskDescriptionDeviceRevisionKey: interop.Pointer;

export declare const kDAReturnNoResources: number;

export declare const kDADiskDescriptionVolumeMountableKey: interop.Pointer;

export declare const kDAReturnExclusiveAccess: number;

export declare const kDADiskDescriptionMediaEncryptedKey: interop.Pointer;

export declare const kDADiskDescriptionMediaNameKey: interop.Pointer;

export declare const kDADiskDescriptionDeviceTDMLockedKey: interop.Pointer;

export declare const kDADiskUnmountOptionWhole: number;

export declare const kDADiskDescriptionMediaSizeKey: interop.Pointer;

export declare const kDADiskDescriptionVolumeNetworkKey: interop.Pointer;

export declare const kDADiskDescriptionMediaIconKey: interop.Pointer;

export declare class __DADissenter {
  constructor(init?: __DADissenter);
}

export declare class __DADisk {
  constructor(init?: __DADisk);
}

export declare class __DASession {
  constructor(init?: __DASession);
}

export declare function DASessionGetTypeID(): number;

export declare function DASessionCreate(allocator: interop.Object): interop.Object;

export declare function DASessionScheduleWithRunLoop(session: interop.Object, runLoop: interop.Object, runLoopMode: interop.Object): void;

export declare function DASessionUnscheduleFromRunLoop(session: interop.Object, runLoop: interop.Object, runLoopMode: interop.Object): void;

export declare function DASessionSetDispatchQueue(session: interop.Object, queue: NSObject): void;

export declare function DAApprovalSessionGetTypeID(): number;

export declare function DAApprovalSessionCreate(allocator: interop.Object): interop.Object;

export declare function DAApprovalSessionScheduleWithRunLoop(session: interop.Object, runLoop: interop.Object, runLoopMode: interop.Object): void;

export declare function DAApprovalSessionUnscheduleFromRunLoop(session: interop.Object, runLoop: interop.Object, runLoopMode: interop.Object): void;

export declare function DADiskGetTypeID(): number;

export declare function DADiskCreateFromBSDName(allocator: interop.Object, session: interop.Object, name: string): interop.Object;

export declare function DADiskCreateFromIOMedia(allocator: interop.Object, session: interop.Object, media: number): interop.Object;

export declare function DADiskCreateFromVolumePath(allocator: interop.Object, session: interop.Object, path: interop.Object): interop.Object;

export declare function DADiskGetBSDName(disk: interop.Object): string;

export declare function DADiskCopyIOMedia(disk: interop.Object): number;

export declare function DADiskCopyDescription(disk: interop.Object): interop.Object;

export declare function DADiskCopyWholeDisk(disk: interop.Object): interop.Object;

export declare function DADissenterCreate(allocator: interop.Object, status: number, string: interop.Object): interop.Object;

export declare function DADissenterGetStatus(dissenter: interop.Object): number;

export declare function DADissenterGetStatusString(dissenter: interop.Object): interop.Object;

export declare function DARegisterDiskAppearedCallback(session: interop.Object, match: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DARegisterDiskDescriptionChangedCallback(session: interop.Object, match: interop.Object, watch: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DARegisterDiskDisappearedCallback(session: interop.Object, match: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DADiskMount(disk: interop.Object, path: interop.Object, options: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DADiskMountWithArguments(disk: interop.Object, path: interop.Object, options: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible, arguments$: interop.PointerConvertible): void;

export declare function DARegisterDiskMountApprovalCallback(session: interop.Object, match: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Pointer, context: interop.PointerConvertible): void;

export declare function DADiskRename(disk: interop.Object, name: interop.Object, options: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DADiskUnmount(disk: interop.Object, options: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DARegisterDiskUnmountApprovalCallback(session: interop.Object, match: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Pointer, context: interop.PointerConvertible): void;

export declare function DADiskEject(disk: interop.Object, options: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DARegisterDiskEjectApprovalCallback(session: interop.Object, match: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Pointer, context: interop.PointerConvertible): void;

export declare function DADiskClaim(disk: interop.Object, options: number, release: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Pointer, releaseContext: interop.PointerConvertible, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, callbackContext: interop.PointerConvertible): void;

export declare function DADiskIsClaimed(disk: interop.Object): number;

export declare function DADiskUnclaim(disk: interop.Object): void;

export declare function DARegisterDiskPeekCallback(session: interop.Object, match: interop.Object, order: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, context: interop.PointerConvertible): void;

export declare function DADiskGetOptions(disk: interop.Object): number;

export declare function DADiskSetOptions(disk: interop.Object, options: number, value: number): number;

export declare function DAUnregisterCallback(session: interop.Object, callback: interop.PointerConvertible, context: interop.PointerConvertible): void;

export declare function DAUnregisterApprovalCallback(session: interop.Object, callback: interop.PointerConvertible, context: interop.PointerConvertible): void;
