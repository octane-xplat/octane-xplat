import type { CFUUIDBytes } from './CoreFoundation'

import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'

export declare class NetFSInterface {
	constructor(init?: NetFSInterface)
	_interface: interop.Pointer
	_factoryID: interop.Object | null
	_refCount: number
}

export declare class NetFSMountInterface_V1 {
	constructor(init?: NetFSMountInterface_V1)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateSessionRef: (p1: interop.PointerConvertible) => number | null
	GetServerInfo: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	ParseURL: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	CreateURL: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	OpenSession: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	EnumerateShares: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	Mount: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	Cancel: (p1: interop.PointerConvertible) => number | null
	CloseSession: (p1: interop.PointerConvertible) => number | null
	GetMountInfo: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
}

export declare function NetFSMountURLSync(
	url: interop.Object,
	mountpath: interop.Object,
	user: interop.Object,
	passwd: interop.Object,
	open_options: interop.Object,
	mount_options: interop.Object,
	mountpoints: interop.PointerConvertible,
): number

export declare function NetFSMountURLAsync(
	url: interop.Object,
	mountpath: interop.Object,
	user: interop.Object,
	passwd: interop.Object,
	open_options: interop.Object,
	mount_options: interop.Object,
	requestID: interop.PointerConvertible,
	dispatchq: NSObject,
	mount_report: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => void,
): number

export declare function NetFSMountURLCancel(requestID: interop.PointerConvertible): number

export declare function NetFSMountURLProbe(hostname: interop.Object): interop.Object

export declare function NetFSCopyURLForRemountingVolume(
	localPathURL: interop.Object,
): interop.Object

export declare function NetFSInterface_AddRef(p1: interop.PointerConvertible): number

export declare function NetFSInterface_Release(p1: interop.PointerConvertible): number

export declare function NetFS_CreateInterface(
	factoryID: interop.Object,
	interfaceFTbl: interop.PointerConvertible,
): interop.Pointer

export declare function NetFSQueryInterface(
	p1: interop.PointerConvertible,
	iid: CFUUIDBytes,
	ppv: interop.PointerConvertible,
): number

export declare function NetFSCFStringtoCString(p1: interop.Object): string
