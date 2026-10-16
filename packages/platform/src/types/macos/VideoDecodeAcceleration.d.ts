import type { interop } from './objc-runtime'

export declare const kVDADecoderFlush_EmitFrames: number

export declare const kVDADecoderConfiguration_avcCData: interop.Pointer

export declare const kVDADecoderConfiguration_SourceFormat: interop.Pointer

export declare const kVDADecoderConfiguration_Height: interop.Pointer

export declare const kVDADecoderAllocationFailedErr: number

export declare const kVDADecoderParamErr: number

export declare const kVDADecoderDecoderFailedErr: number

export declare const kVDADecoderNoErr: number

export declare const kVDADecoderDecodeFlags_DontEmitFrame: number

export declare const kVDADecoderFormatNotSupportedErr: number

export declare const kVDADecoderConfiguration_Width: interop.Pointer

export declare const kVDADecoderConfigurationError: number

export declare const kVDADecoderHardwareNotSupportedErr: number

export declare class OpaqueVDADecoder {
	constructor(init?: OpaqueVDADecoder)
}

export declare function VDADecoderCreate(
	decoderConfiguration: interop.Object,
	destinationImageBufferAttributes: interop.Object,
	outputCallback: interop.PointerConvertible,
	decoderOutputCallbackRefcon: interop.PointerConvertible,
	decoderOut: interop.PointerConvertible,
): number

export declare function VDADecoderDecode(
	decoder: interop.PointerConvertible,
	decodeFlags: number,
	compressedBuffer: interop.Object,
	frameInfo: interop.Object,
): number

export declare function VDADecoderFlush(
	decoder: interop.PointerConvertible,
	flushFlags: number,
): number

export declare function VDADecoderDestroy(decoder: interop.PointerConvertible): number
