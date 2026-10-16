import type { interop } from './objc-runtime'

export declare const kMTAudioProcessingTapCallbacksVersion_0: number

export declare const kMTAudioProcessingTapFlag_EndOfStream: number

export declare const kMTAudioProcessingTapFlag_StartOfStream: number

export declare const kMTAudioProcessingTapCreationFlag_PreEffects: number

export declare const kMTAudioProcessingTapCreationFlag_PostEffects: number

export declare class MTAudioProcessingTapCallbacks {
	constructor(init?: MTAudioProcessingTapCallbacks)
	version: number
	clientInfo: interop.Pointer
	init: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => void | null
	finalize: (p1: interop.PointerConvertible) => void | null
	prepare: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => void | null
	unprepare: (p1: interop.PointerConvertible) => void | null
	process: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => void | null
}

export declare class opaqueMTAudioProcessingTap {
	constructor(init?: opaqueMTAudioProcessingTap)
}

export declare function MTAudioProcessingTapGetTypeID(): number

export declare function MTAudioProcessingTapCreate(
	allocator: interop.Object,
	callbacks: interop.PointerConvertible,
	flags: number,
	tapOut: interop.PointerConvertible,
): number

export declare function MTAudioProcessingTapGetStorage(tap: interop.Object): interop.Pointer

export declare function MTAudioProcessingTapGetSourceAudio(
	tap: interop.Object,
	numberFrames: number,
	bufferListInOut: interop.PointerConvertible,
	flagsOut: interop.PointerConvertible,
	timeRangeOut: interop.PointerConvertible,
	numberFramesOut: interop.PointerConvertible,
): number

export declare function MTRegisterProfessionalVideoWorkflowFormatReaders(): void

export declare function MTCopyLocalizedNameForMediaType(mediaType: number): interop.Object

export declare function MTCopyLocalizedNameForMediaSubType(
	mediaType: number,
	mediaSubType: number,
): interop.Object
