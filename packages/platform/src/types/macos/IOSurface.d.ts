import type { NSCoder, NSDictionary, NSSecureCoding } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const kIOSurfaceBytesPerElement: interop.Pointer

export declare const IOSurfacePropertyAllocSizeKey: string

export declare const IOSurfacePropertyKeyPlaneSize: string

export declare const IOSurfacePropertyKeyPlaneOffset: string

export declare const IOSurfacePropertyKeyPlaneBytesPerRow: string

export declare const IOSurfacePropertyKeyPlaneHeight: string

export declare const IOSurfacePropertyKeyPlaneWidth: string

export declare const IOSurfacePropertyKeyOffset: string

export declare const IOSurfacePropertyKeyElementWidth: string

export declare const IOSurfacePropertyKeyBytesPerElement: string

export declare const IOSurfacePropertyKeyHeight: string

export declare const IOSurfacePropertyKeyWidth: string

export declare const IOSurfacePropertyKeyAllocSize: string

export declare const IOSurfacePropertyKeyBytesPerRow: string

export declare const kIOSurfaceICCProfile: interop.Pointer

export declare const kIOSurfacePlaneComponentBitOffsets: interop.Pointer

export declare const kIOSurfacePixelSizeCastingAllowed: interop.Pointer

export declare const kIOSurfaceIsGlobal: interop.Pointer

export declare const kIOSurfaceCacheMode: interop.Pointer

export declare const kIOSurfacePlaneBitsPerElement: interop.Pointer

export declare const kIOSurfacePlaneBase: interop.Pointer

export declare const kIOSurfacePlaneSize: interop.Pointer

export declare const kIOSurfacePlaneHeight: interop.Pointer

export declare const kIOSurfacePlaneWidth: interop.Pointer

export declare const kIOSurfaceAllocSize: interop.Pointer

export declare const kIOSurfaceMapWriteCombineCache: number

export declare const kIOSurfaceMapInhibitCache: number

export declare const kIOSurfaceCopybackInnerCache: number

export declare const kIOSurfaceWriteCombineCache: number

export declare const kIOSurfaceCopybackCache: number

export declare const kIOSurfaceDefaultCache: number

export declare const kIOSurfaceHeight: interop.Pointer

export declare const IOSurfacePropertyKeyPlaneBytesPerElement: string

export declare const IOSurfacePropertyKeyElementHeight: string

export declare const IOSurfacePropertyKeyPlaneElementHeight: string

export declare const kIOSurfacePlaneElementHeight: interop.Pointer

export declare const kIOSurfaceMapCopybackCache: number

export declare const kIOSurfaceMapDefaultCache: number

export declare const IOSurfacePropertyKeyCacheMode: string

export declare const kIOSurfacePlaneElementWidth: interop.Pointer

export declare const kIOSurfaceWidth: interop.Pointer

export declare const kIOSurfaceMapWriteThruCache: number

export declare const kIOSurfaceName: interop.Pointer

export declare const kIOSurfacePlaneComponentRanges: interop.Pointer

export declare const kIOSurfacePlaneInfo: interop.Pointer

export declare const kIOSurfacePlaneComponentTypes: interop.Pointer

export declare const IOSurfacePropertyKeyPlaneInfo: string

export declare const kIOSurfacePlaneComponentBitDepths: interop.Pointer

export declare const kIOSurfaceInhibitCache: number

export declare const kIOSurfacePixelFormat: interop.Pointer

export declare const kIOSurfacePlaneBytesPerElement: interop.Pointer

export declare const IOSurfacePropertyKeyPlaneElementWidth: string

export declare const kIOSurfacePlaneComponentNames: interop.Pointer

export declare const kIOSurfaceSubsampling: interop.Pointer

export declare const IOSurfacePropertyKeyPlaneBase: string

export declare const kIOSurfaceElementHeight: interop.Pointer

export declare const kIOSurfaceMapCopybackInnerCache: number

export declare const IOSurfacePropertyKeyPixelFormat: string

export declare const IOSurfacePropertyKeyPixelSizeCastingAllowed: string

export declare const kIOSurfaceColorSpace: interop.Pointer

export declare const kIOSurfacePlaneBytesPerRow: interop.Pointer

export declare const kIOSurfaceWriteThruCache: number

export declare const kIOSurfaceBytesPerRow: interop.Pointer

export declare const kIOSurfaceOffset: interop.Pointer

export declare const kIOSurfaceElementWidth: interop.Pointer

export declare const kIOSurfaceMapCacheShift: number

export declare const kIOSurfacePlaneOffset: interop.Pointer

export declare const IOSurfaceMemoryLedgerFlags: {
	kIOSurfaceMemoryLedgerFlagNoFootprint: 1
}

export declare const IOSurfacePurgeabilityState: {
	NonVolatile: 0
	Volatile: 1
	Empty: 2
	KeepCurrent: 3
}

export declare const IOSurfaceSubsampling: {
	SubsamplingUnknown: 0
	SubsamplingNone: 1
	Subsampling422: 2
	Subsampling420: 3
	Subsampling411: 4
}

export declare const IOSurfaceLockOptions: {
	ReadOnly: 1
	AvoidSync: 2
}

export declare const IOSurfaceComponentName: {
	Unknown: 0
	Alpha: 1
	Red: 2
	Green: 3
	Blue: 4
	Luma: 5
	ChromaRed: 6
	ChromaBlue: 7
}

export declare const IOSurfaceMemoryLedgerTags: {
	Default: 1
	Network: 2
	Media: 3
	Graphics: 4
	Neural: 5
}

export declare const IOSurfaceComponentRange: {
	Unknown: 0
	FullRange: 1
	VideoRange: 2
	WideRange: 3
}

export declare const IOSurfaceComponentType: {
	Unknown: 0
	UnsignedInteger: 1
	SignedInteger: 2
	Float: 3
	SignedNormalized: 4
}

export declare function IOSurfaceGetTypeID(): number

export declare function IOSurfaceCreate(properties: interop.Object): interop.Object

export declare function IOSurfaceLookup(csid: number): interop.Object

export declare function IOSurfaceGetID(buffer: interop.Object): number

export declare function IOSurfaceLock(
	buffer: interop.Object,
	options: interop.Enum<typeof IOSurfaceLockOptions>,
	seed: interop.PointerConvertible,
): number

export declare function IOSurfaceUnlock(
	buffer: interop.Object,
	options: interop.Enum<typeof IOSurfaceLockOptions>,
	seed: interop.PointerConvertible,
): number

export declare function IOSurfaceGetAllocSize(buffer: interop.Object): number

export declare function IOSurfaceGetWidth(buffer: interop.Object): number

export declare function IOSurfaceGetHeight(buffer: interop.Object): number

export declare function IOSurfaceGetBytesPerElement(buffer: interop.Object): number

export declare function IOSurfaceGetBytesPerRow(buffer: interop.Object): number

export declare function IOSurfaceGetBaseAddress(buffer: interop.Object): interop.Pointer

export declare function IOSurfaceGetElementWidth(buffer: interop.Object): number

export declare function IOSurfaceGetElementHeight(buffer: interop.Object): number

export declare function IOSurfaceGetPixelFormat(buffer: interop.Object): number

export declare function IOSurfaceGetSeed(buffer: interop.Object): number

export declare function IOSurfaceGetPlaneCount(buffer: interop.Object): number

export declare function IOSurfaceGetWidthOfPlane(buffer: interop.Object, planeIndex: number): number

export declare function IOSurfaceGetHeightOfPlane(
	buffer: interop.Object,
	planeIndex: number,
): number

export declare function IOSurfaceGetBytesPerElementOfPlane(
	buffer: interop.Object,
	planeIndex: number,
): number

export declare function IOSurfaceGetBytesPerRowOfPlane(
	buffer: interop.Object,
	planeIndex: number,
): number

export declare function IOSurfaceGetBaseAddressOfPlane(
	buffer: interop.Object,
	planeIndex: number,
): interop.Pointer

export declare function IOSurfaceGetElementWidthOfPlane(
	buffer: interop.Object,
	planeIndex: number,
): number

export declare function IOSurfaceGetElementHeightOfPlane(
	buffer: interop.Object,
	planeIndex: number,
): number

export declare function IOSurfaceGetNumberOfComponentsOfPlane(
	buffer: interop.Object,
	planeIndex: number,
): number

export declare function IOSurfaceGetNameOfComponentOfPlane(
	buffer: interop.Object,
	planeIndex: number,
	componentIndex: number,
): interop.Enum<typeof IOSurfaceComponentName>

export declare function IOSurfaceGetTypeOfComponentOfPlane(
	buffer: interop.Object,
	planeIndex: number,
	componentIndex: number,
): interop.Enum<typeof IOSurfaceComponentType>

export declare function IOSurfaceGetRangeOfComponentOfPlane(
	buffer: interop.Object,
	planeIndex: number,
	componentIndex: number,
): interop.Enum<typeof IOSurfaceComponentRange>

export declare function IOSurfaceGetBitDepthOfComponentOfPlane(
	buffer: interop.Object,
	planeIndex: number,
	componentIndex: number,
): number

export declare function IOSurfaceGetBitOffsetOfComponentOfPlane(
	buffer: interop.Object,
	planeIndex: number,
	componentIndex: number,
): number

export declare function IOSurfaceGetSubsampling(
	buffer: interop.Object,
): interop.Enum<typeof IOSurfaceSubsampling>

export declare function IOSurfaceSetValue(
	buffer: interop.Object,
	key: interop.Object,
	value: interop.Object,
): void

export declare function IOSurfaceCopyValue(
	buffer: interop.Object,
	key: interop.Object,
): interop.Object

export declare function IOSurfaceRemoveValue(buffer: interop.Object, key: interop.Object): void

export declare function IOSurfaceSetValues(
	buffer: interop.Object,
	keysAndValues: interop.Object,
): void

export declare function IOSurfaceCopyAllValues(buffer: interop.Object): interop.Object

export declare function IOSurfaceRemoveAllValues(buffer: interop.Object): void

export declare function IOSurfaceCreateMachPort(buffer: interop.Object): number

export declare function IOSurfaceLookupFromMachPort(port: number): interop.Object

export declare function IOSurfaceGetPropertyMaximum(property: interop.Object): number

export declare function IOSurfaceGetPropertyAlignment(property: interop.Object): number

export declare function IOSurfaceAlignProperty(property: interop.Object, value: number): number

export declare function IOSurfaceIncrementUseCount(buffer: interop.Object): void

export declare function IOSurfaceDecrementUseCount(buffer: interop.Object): void

export declare function IOSurfaceGetUseCount(buffer: interop.Object): number

export declare function IOSurfaceIsInUse(buffer: interop.Object): number

export declare function IOSurfaceAllowsPixelSizeCasting(buffer: interop.Object): number

export declare function IOSurfaceSetPurgeable(
	buffer: interop.Object,
	newState: number,
	oldState: interop.PointerConvertible,
): number

export declare function IOSurfaceCreateXPCObject(aSurface: interop.Object): NSObject

export declare function IOSurfaceLookupFromXPCObject(xobj: NSObject): interop.Object

export declare class IOSurface extends NSObject implements NSSecureCoding {
	initWithProperties(
		properties:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): this

	lockWithOptionsSeed(
		options: interop.Enum<typeof IOSurfaceLockOptions>,
		seed: interop.PointerConvertible,
	): number

	unlockWithOptionsSeed(
		options: interop.Enum<typeof IOSurfaceLockOptions>,
		seed: interop.PointerConvertible,
	): number

	readonly allocationSize: number

	readonly width: number

	readonly height: number

	readonly baseAddress: interop.Pointer

	readonly pixelFormat: number

	readonly bytesPerRow: number

	readonly bytesPerElement: number

	readonly elementWidth: number

	readonly elementHeight: number

	readonly seed: number

	readonly planeCount: number

	widthOfPlaneAtIndex(planeIndex: number): number

	heightOfPlaneAtIndex(planeIndex: number): number

	bytesPerRowOfPlaneAtIndex(planeIndex: number): number

	bytesPerElementOfPlaneAtIndex(planeIndex: number): number

	elementWidthOfPlaneAtIndex(planeIndex: number): number

	elementHeightOfPlaneAtIndex(planeIndex: number): number

	baseAddressOfPlaneAtIndex(planeIndex: number): interop.Pointer

	setAttachmentForKey(anObject: interop.Object, key: string): void

	attachmentForKey(key: string): interop.Object

	removeAttachmentForKey(key: string): void

	setAllAttachments(
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): void

	allAttachments(): NSDictionary

	removeAllAttachments(): void

	readonly inUse: boolean

	incrementUseCount(): void

	decrementUseCount(): void

	readonly localUseCount: number

	readonly allowsPixelSizeCasting: boolean

	setPurgeableOldState(
		newState: interop.Enum<typeof IOSurfacePurgeabilityState>,
		oldState: interop.PointerConvertible,
	): number

	isInUse(): boolean

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
