/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const PGResumeErrorDomain: string

declare const PGResumeErrorCode: {
	InternalFault: 0
	InvalidSuspendStateVersion: 1
	InvalidContent: 2
	InvalidGuestVersion: 3
	IncompatibleDevice: 4
	InvalidDisplayPortCount: 5
}

declare class PGTask_s {
	constructor(init?: PGTask_s)
}

declare class PGPhysicalMemoryRange_s {
	constructor(init?: PGPhysicalMemoryRange_s)
	physicalAddress: number
	physicalLength: number
}

declare class PGTraceRange_s {
	constructor(init?: PGTraceRange_s)
}

declare class PGDisplayCoord_t {
	constructor(init?: PGDisplayCoord_t)
	x: number
	y: number
}

declare function PGNewDeviceWithDescriptor(descriptor: PGDeviceDescriptor): PGDevice

declare function PGCopyOptionROMURL(): NSURL

declare interface PGDisplay extends NSObjectProtocol {
	readonly name: string

	readonly sizeInMillimeters: CGSize

	readonly queue: NSObject

	readonly modeChangeHandler: (p1: PGDisplayCoord_t, p2: number) => void

	readonly newFrameEventHandler: () => void

	readonly cursorGlyphHandler: (p1: NSBitmapImageRep, p2: PGDisplayCoord_t) => void

	readonly cursorShowHandler: (p1: boolean) => void

	readonly cursorPosition: PGDisplayCoord_t

	readonly serialNum: number

	readonly port: number

	readonly minimumTextureUsage: interop.Enum<typeof MTLTextureUsage>

	readonly guestPresentCount: number

	readonly hostPresentCount: number

	get modeList(): NSArray
	set modeList(value: NSArray<interop.Object> | Array<interop.Object>)

	encodeCurrentFrameToCommandBufferTextureRegion(
		commandBuffer: MTLCommandBuffer,
		texture: MTLTexture,
		region: MTLRegion,
	): boolean
}

declare class PGDisplay extends NativeObject implements PGDisplay {}

declare interface PGDevice extends NSObjectProtocol {
	mmioReadAtOffset(offset: number): number

	mmioWriteAtOffsetValue(offset: number, value: number): void

	newDisplayWithDescriptorPortSerialNum(
		descriptor: PGDisplayDescriptor,
		port: number,
		serialNum: number,
	): PGDisplay | null

	willSuspend(): void

	finishSuspend(): NSData | null

	willResumeWithSuspendStateError(suspendState: NSData, error: interop.PointerConvertible): boolean

	didResume(): void
}

declare class PGDevice extends NativeObject implements PGDevice {}

declare class PGDisplayDescriptor extends NSObject {
	name: string

	sizeInMillimeters: CGSize

	queue: NSObject

	modeChangeHandler: (p1: PGDisplayCoord_t, p2: number) => void

	newFrameEventHandler: () => void

	cursorGlyphHandler: (p1: NSBitmapImageRep, p2: PGDisplayCoord_t) => void

	cursorShowHandler: (p1: boolean) => void
}

declare class PGDeviceDescriptor extends NSObject {
	device: MTLDevice

	mmioLength: number

	createTask: (p1: number, p2: interop.PointerConvertible) => interop.Pointer

	destroyTask: (p1: interop.PointerConvertible) => void

	mapMemory: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: boolean,
		p5: interop.PointerConvertible,
	) => boolean

	unmapMemory: (p1: interop.PointerConvertible, p2: number, p3: number) => boolean

	readMemory: (p1: number, p2: number, p3: interop.PointerConvertible) => boolean

	raiseInterrupt: (p1: number) => void

	addTraceRange: (
		p1: interop.PointerConvertible,
		p2: (p1: interop.PointerConvertible) => void,
	) => interop.Pointer

	removeTraceRange: (p1: interop.PointerConvertible) => void
}

declare class PGDisplayMode extends NSObject {
	readonly sizeInPixels: PGDisplayCoord_t

	readonly refreshRate: number

	initWithSizeInPixelsRefreshRateInHz(sizeInPixels: PGDisplayCoord_t, refreshRateInHz: number): this
}
