import type { CFRange, CGRect, CGSize } from './CoreFoundation'

import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'

import { CFComparisonResult } from './CoreFoundation'



export declare const kCMMetadataBaseDataType_JSON: interop.Pointer;

export declare const kCMMetadataBaseDataType_DimensionsF32: interop.Pointer;

export declare const kCMMetadataBaseDataType_UInt64: interop.Pointer;

export declare const kCMMetadataBaseDataType_UInt16: interop.Pointer;

export declare const kCMMetadataBaseDataType_UInt8: interop.Pointer;

export declare const kCMMetadataBaseDataType_SInt64: interop.Pointer;

export declare const kCMMetadataBaseDataType_SInt32: interop.Pointer;

export declare const kCMMetadataBaseDataType_SInt8: interop.Pointer;

export declare const kCMMetadataBaseDataType_Float32: interop.Pointer;

export declare const kCMMetadataBaseDataType_BMP: interop.Pointer;

export declare const kCMMetadataBaseDataType_PNG: interop.Pointer;

export declare const kCMMetadataBaseDataType_JPEG: interop.Pointer;

export declare const kCMMetadataBaseDataType_UTF8: interop.Pointer;

export declare const kCMMetadataIdentifier_QuickTimeMetadataLivePhotoStillImageTransformReferenceDimensions: interop.Pointer;

export declare const kCMMetadataIdentifier_QuickTimeMetadataLivePhotoStillImageTransform: interop.Pointer;

export declare const kCMMetadataIdentifier_QuickTimeMetadataVideoOrientation: interop.Pointer;

export declare const kCMMetadataKeySpace_HLSDateRange: interop.Pointer;

export declare const kCMMetadataKeySpace_ID3: interop.Pointer;

export declare const kCMMetadataKeySpace_QuickTimeMetadata: interop.Pointer;

export declare const kCMMetadataDataTypeRegistryError_MultipleConformingBaseTypes: number;

export declare const kCMMetadataDataTypeRegistryError_DataTypeAlreadyRegistered: number;

export declare const kCMMetadataDataTypeRegistryError_BadDataTypeIdentifier: number;

export declare const kCMMetadataDataTypeRegistryError_AllocationFailed: number;

export declare const kCMMetadataIdentifierError_BadKeySpace: number;

export declare const kCMMetadataIdentifierError_BadNumberKey: number;

export declare const kCMMetadataIdentifierError_BadKeyLength: number;

export declare const kCMMetadataIdentifierError_BadKey: number;

export declare const kCMMetadataIdentifierError_RequiredParameterMissing: number;

export declare const kCMTextMarkupCharacterEdgeStyle_DropShadow: interop.Pointer;

export declare const kCMTextMarkupCharacterEdgeStyle_Uniform: interop.Pointer;

export declare const kCMTextMarkupCharacterEdgeStyle_Depressed: interop.Pointer;

export declare const kCMTextMarkupCharacterEdgeStyle_None: interop.Pointer;

export declare const kCMTextMarkupAttribute_WritingDirectionSizePercentage: interop.Pointer;

export declare const kCMTextMarkupAlignmentType_Right: interop.Pointer;

export declare const kCMTextMarkupAlignmentType_End: interop.Pointer;

export declare const kCMTextMarkupAlignmentType_Middle: interop.Pointer;

export declare const kCMTextVerticalLayout_RightToLeft: interop.Pointer;

export declare const kCMTextVerticalLayout_LeftToRight: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_SmallCapital: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_Cursive: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_Casual: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_MonospaceSansSerif: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_MonospaceSerif: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_ProportionalSerif: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_Monospace: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_SansSerif: interop.Pointer;

export declare const kCMTextMarkupGenericFontName_Serif: interop.Pointer;

export declare const kCMTextMarkupAttribute_GenericFontFamilyName: interop.Pointer;

export declare const kCMTextMarkupAttribute_UnderlineStyle: interop.Pointer;

export declare const kCMTextMarkupAttribute_BoldStyle: interop.Pointer;

export declare const kCMTextMarkupAttribute_BackgroundColorARGB: interop.Pointer;

export declare const kCMMemoryPoolOption_AgeOutPeriod: interop.Object;

export declare const kCMMemoryPoolError_InvalidParameter: number;

export declare const kCMMemoryPoolError_AllocationFailed: number;

export declare const kCMSimpleQueueError_ParameterOutOfRange: number;

export declare const kCMSimpleQueueError_RequiredParameterMissing: number;

export declare const kCMBufferQueueTrigger_WhenBufferCountBecomesLessThan: number;

export declare const kCMBufferQueueTrigger_WhenReset: number;

export declare const kCMBufferQueueTrigger_WhenMaxPresentationTimeStampChanges: number;

export declare const kCMBufferQueueTrigger_WhenMinPresentationTimeStampChanges: number;

export declare const kCMBufferQueueTrigger_WhenDurationBecomesGreaterThanOrEqualTo: number;

export declare const kCMBufferQueueTrigger_WhenDurationBecomesGreaterThan: number;

export declare const kCMBufferQueueTrigger_WhenDurationBecomesLessThanOrEqualTo: number;

export declare const kCMBufferQueueError_InvalidBuffer: number;

export declare const kCMBufferQueueError_InvalidTriggerToken: number;

export declare const kCMBufferQueueError_CannotModifyQueueFromTriggerCallback: number;

export declare const kCMBufferQueueError_QueueIsFull: number;

export declare const kCMBufferQueueError_InvalidCMBufferCallbacksStruct: number;

export declare const kCMBufferQueueError_RequiredParameterMissing: number;

export declare const kCMBufferQueueError_AllocationFailed: number;

export declare const kCMSoundDescriptionFlavor_3GPFamily: interop.Pointer;

export declare const kCMSoundDescriptionFlavor_ISOFamily: interop.Pointer;

export declare const kCMSoundDescriptionFlavor_QuickTimeMovieV2: interop.Pointer;

export declare const kCMImageDescriptionFlavor_3GPFamily: interop.Pointer;

export declare const kCMImageDescriptionFlavor_QuickTimeMovie: interop.Pointer;

export declare const kCMFormatDescriptionBridgeError_InvalidSlice: number;

export declare const kCMFormatDescriptionBridgeError_IncompatibleFormatDescription: number;

export declare const kCMFormatDescriptionBridgeError_InvalidFormatDescription: number;

export declare const kCMFormatDescriptionBridgeError_AllocationFailed: number;

export declare const kCMFormatDescriptionBridgeError_InvalidParameter: number;

export declare const kCMMetadataBaseDataType_PolylineF32: interop.Pointer;

export declare const kCMTimebaseNotification_TimeJumped: interop.Pointer;

export declare const kCMSyncError_RateMustBeNonZero: number;

export declare const kCMSyncError_InvalidParameter: number;

export declare const kCMSyncError_MissingRequiredParameter: number;

export declare const kCMTimebaseError_ReadOnly: number;

export declare const kCMTimebaseError_AllocationFailed: number;

export declare const kCMTimebaseError_MissingRequiredParameter: number;

export declare const kCMClockError_UnsupportedOperation: number;

export declare const kCMClockError_AllocationFailed: number;

export declare const kCMFormatDescriptionKey_CleanApertureHeight: interop.Pointer;

export declare const kCMSampleBufferError_ArrayTooSmall: number;

export declare const kCMFormatDescriptionKey_CleanApertureVerticalOffset: interop.Pointer;

export declare const kCMSampleBufferConduitNotificationParameter_MaxUpcomingOutputPTS: interop.Pointer;

export declare const kCMMetadataIdentifier_QuickTimeMetadataDirection_Facing: interop.Pointer;

export declare const kCMTextFormatDescriptionExtension_DefaultStyle: interop.Pointer;

export declare const kCMTimeMappingTargetKey: interop.Pointer;

export declare const kCMTimeMappingInvalid: CMTimeMapping;

export declare const kCMTimeRangeStartKey: interop.Pointer;

export declare const kCMTimeRangeInvalid: CMTimeRange;

export declare const kCMSampleBufferAttachmentKey_ForceKeyFrame: interop.Pointer;

export declare const kCMSampleBufferLensStabilizationInfo_Active: interop.Pointer;

export declare const kCMSampleBufferDroppedFrameReasonInfo_CameraModeSwitch: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_GradualDecoderRefresh: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_SampleReferenceURL: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_EndsPreviousSampleDuration: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_SpeedMultiplier: interop.Pointer;

export declare const kCMSampleAttachmentKey_HEVCSyncSampleNALUnitType: interop.Pointer;

export declare const kCMSampleAttachmentKey_HEVCStepwiseTemporalSubLayerAccess: interop.Pointer;

export declare const kCMSampleAttachmentKey_DoNotDisplay: interop.Pointer;

export declare const kCMHEVCTemporalLevelInfoKey_LevelIndex: interop.Pointer;

export declare const kCMHEVCTemporalLevelInfoKey_ProfileIndex: interop.Pointer;

export declare const kCMHEVCTemporalLevelInfoKey_TierFlag: interop.Pointer;

export declare const kCMHEVCTemporalLevelInfoKey_ProfileSpace: interop.Pointer;

export declare const kCMHEVCTemporalLevelInfoKey_TemporalLevel: interop.Pointer;

export declare const kCMSampleAttachmentKey_DisplayImmediately: interop.Pointer;

export declare const kCMSampleAttachmentKey_NotSync: interop.Pointer;

export declare const kCMSampleBufferConduitNotificationParameter_UpcomingOutputPTSRangeMayOverlapQueuedOutputPTSRange: interop.Pointer;

export declare const kCMSampleBufferNotification_DataBecameReady: interop.Pointer;

export declare const kCMSampleBufferFlag_AudioBufferList_Assure16ByteAlignment: number;

export declare const kCMSampleBufferError_DataCanceled: number;

export declare const kCMSampleBufferError_Invalidated: number;

export declare const kCMSampleBufferError_InvalidMediaTypeForOperation: number;

export declare const kCMSampleBufferError_SampleTimingInfoInvalid: number;

export declare const kCMSampleBufferError_BufferHasNoSampleTimingInfo: number;

export declare const kCMSampleBufferError_BufferNotReady: number;

export declare const kCMSampleBufferError_AlreadyHasDataBuffer: number;

export declare const kCMSampleBufferError_RequiredParameterMissing: number;

export declare const kCMSampleBufferError_AllocationFailed: number;

export declare const kCMMetadataFormatDescriptionMetadataSpecificationKey_StructuralDependency: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_SetupData: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_StructuralDependency: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_ConformingDataTypes: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_Value: interop.Pointer;

export declare const kCMMetadataFormatType_ID3: number;

export declare const kCMMetadataFormatType_ICY: number;

export declare const kCMTimeCodeFormatDescriptionKey_LangCode: interop.Pointer;

export declare const kCMTimeCodeFlag_NegTimesOK: number;

export declare const kCMTimeCodeFlag_DropFrame: number;

export declare const kCMSampleAttachmentKey_HasRedundantCoding: interop.Pointer;

export declare const kCMSubtitleFormatType_WebVTT: number;

export declare const kCMTextFormatDescriptionStyle_Height: interop.Pointer;

export declare const kCMTextFormatDescriptionExtension_HorizontalJustification: interop.Pointer;

export declare const kCMTextFormatDescriptionStyle_StartChar: interop.Pointer;

export declare const kCMTextFormatDescriptionRect_Bottom: interop.Pointer;

export declare const kCMTextFormatDescriptionRect_Left: interop.Pointer;

export declare const kCMTextFormatDescriptionRect_Top: interop.Pointer;

export declare const kCMTextFormatDescriptionExtension_DefaultTextBox: interop.Pointer;

export declare const kCMTextFormatDescriptionColor_Alpha: interop.Pointer;

export declare const kCMTextJustification_centered: number;

export declare const kCMTextDisplayFlag_obeySubtitleFormatting: number;

export declare const kCMTextFormatType_3GText: number;

export declare const kCMClosedCaptionFormatType_ATSC: number;

export declare const kCMMuxedStreamType_MPEG2Program: number;

export declare const kCMFormatDescriptionExtension_AlphaChannelMode: interop.Pointer;

export declare const kCMFormatDescriptionExtension_AlternativeTransferCharacteristics: interop.Pointer;

export declare const kCMFormatDescriptionExtension_MasteringDisplayColorVolume: interop.Pointer;

export declare const kCMFormatDescriptionVendor_Apple: interop.Pointer;

export declare const kCMFormatDescriptionExtension_RevisionLevel: interop.Pointer;

export declare const kCMFormatDescriptionExtension_SpatialQuality: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XF: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD_540p: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_1080p24_CBR50: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_1080i50_CBR50: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_1080i60_CBR50: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_720p60_CBR50: number;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_1080p24_VBR35: number;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_1080i50_VBR35: number;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_720p30_VBR35: number;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_720p25_VBR35: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD_1080p25_VBR35: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD_1080i50_VBR35: number;

export declare const kCMMPEG2VideoProfile_HDV_1080p30: number;

export declare const kCMMPEG2VideoProfile_HDV_1080p25: number;

export declare const kCMMPEG2VideoProfile_HDV_1080i60: number;

export declare const kCMFormatDescriptionExtension_ProtectedContentOriginalFormat: interop.Pointer;

export declare const kCMFormatDescriptionChromaLocation_Top: interop.Pointer;

export declare const kCMFormatDescriptionChromaLocation_Left: interop.Pointer;

export declare const kCMFormatDescriptionExtension_ChromaLocationTopField: interop.Pointer;

export declare const kCMFormatDescriptionExtension_FullRangeVideo: interop.Pointer;

export declare const kCMFormatDescriptionYCbCrMatrix_ITU_R_2020: interop.Pointer;

export declare const kCMFormatDescriptionYCbCrMatrix_ITU_R_601_4: interop.Pointer;

export declare const kCMFormatDescriptionTransferFunction_sRGB: interop.Pointer;

export declare const kCMFormatDescriptionTransferFunction_Linear: interop.Pointer;

export declare const kCMFormatDescriptionTransferFunction_ITU_R_2020: interop.Pointer;

export declare const kCMFormatDescriptionTransferFunction_UseGamma: interop.Pointer;

export declare const kCMFormatDescriptionTransferFunction_SMPTE_240M_1995: interop.Pointer;

export declare const kCMFormatDescriptionExtension_TransferFunction: interop.Pointer;

export declare const kCMFormatDescriptionColorPrimaries_EBU_3213: interop.Pointer;

export declare const kCMFormatDescriptionFieldDetail_TemporalTopFirst: interop.Pointer;

export declare const kCMFormatDescriptionExtension_FieldDetail: interop.Pointer;

export declare const kCMFormatDescriptionKey_CleanApertureHeightRational: interop.Pointer;

export declare const kCMFormatDescriptionKey_CleanApertureWidthRational: interop.Pointer;

export declare const kCMFormatDescriptionExtension_CleanAperture: interop.Pointer;

export declare const kCMVideoCodecType_AV1: number;

export declare const kCMVideoCodecType_AppleProResRAW: number;

export declare const kCMVideoCodecType_AppleProRes4444XQ: number;

export declare const kCMVideoCodecType_DVCPROHD1080p25: number;

export declare const kCMVideoCodecType_DVCPROHD1080p30: number;

export declare const kCMVideoCodecType_DVCPROHD1080i50: number;

export declare const kCMVideoCodecType_DVCPROHD1080i60: number;

export declare const kCMVideoCodecType_DVCPROHD720p60: number;

export declare const kCMVideoCodecType_DVCPAL: number;

export declare const kCMVideoCodecType_DVCNTSC: number;

export declare const kCMVideoCodecType_MPEG1Video: number;

export declare const kCMVideoCodecType_HEVCWithAlpha: number;

export declare const kCMVideoCodecType_Cinepak: number;

export declare const kCMVideoCodecType_Animation: number;

export declare const kCMPixelFormat_4444YpCbCrA8: number;

export declare const kCMPixelFormat_444YpCbCr8: number;

export declare const kCMPixelFormat_422YpCbCr8_yuvs: number;

export declare const kCMPixelFormat_16LE565: number;

export declare const kCMPixelFormat_16LE555: number;

export declare const kCMPixelFormat_16BE565: number;

export declare const kCMPixelFormat_32BGRA: number;

export declare const kCMAudioFormatDescriptionMask_All: number;

export declare const kCMAudioFormatDescriptionMask_ChannelLayout: number;

export declare const kCMAudioFormatDescriptionMask_StreamBasicDescription: number;

export declare const kCMAudioCodecType_AAC_AudibleProtected: number;

export declare const kCMFormatDescriptionExtension_SampleDescriptionExtensionAtoms: interop.Pointer;

export declare const kCMMediaType_TaggedBufferGroup: number;

export declare const kCMMediaType_Subtitle: number;

export declare const kCMMediaType_ClosedCaption: number;

export declare const kCMMediaType_Text: number;

export declare const kCMMediaType_Muxed: number;

export declare const kCMMediaType_Audio: number;

export declare const kCMFormatDescriptionError_ValueNotAvailable: number;

export declare const kCMFormatDescriptionError_AllocationFailed: number;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_1080p30_VBR35: number;

export declare const kCMBlockBufferDontOptimizeDepthFlag: number;

export declare const kCMBlockBufferAlwaysCopyDataFlag: number;

export declare const kCMBlockBufferEmptyBBufErr: number;

export declare const kCMBlockBufferBadPointerParameterErr: number;

export declare const kCMBlockBufferBadLengthParameterErr: number;

export declare const kCMBlockBufferBadCustomBlockSourceErr: number;

export declare const kCMSampleAttachmentKey_IsDependedOnByOthers: interop.Pointer;

export declare const kCMBlockBufferBlockAllocationFailedErr: number;

export declare const kCMBlockBufferStructureAllocationFailedErr: number;

export declare const kCMAttachmentMode_ShouldPropagate: number;

export declare const kCMAttachmentMode_ShouldNotPropagate: number;

export declare const kCMTimeFlagsKey: interop.Pointer;

export declare const kCMTimeScaleKey: interop.Pointer;

export declare const kCMTimeZero: CMTime;

export declare const kCMTimeIndefinite: CMTime;

export declare const kCMTimeInvalid: CMTime;

export declare const kCMMPEG2VideoProfile_XDCAM_HD_1080p30_VBR35: number;

export declare const kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType: interop.Pointer;

export declare const kCMFormatDescriptionError_InvalidParameter: number;

export declare const kCMFormatDescriptionChromaLocation_DV420: interop.Pointer;

export declare const kCMFormatDescriptionYCbCrMatrix_ITU_R_709_2: interop.Pointer;

export declare const kCMTextFormatDescriptionStyle_EndChar: interop.Pointer;

export declare const kCMTimeCodeFormatDescriptionKey_Value: interop.Pointer;

export declare const kCMBufferQueueTrigger_WhenDurationBecomesGreaterThanOrEqualToAndBufferCountBecomesGreaterThan: number;

export declare const kCMSampleBufferAttachmentKey_TransitionID: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_1080p25_VBR35: number;

export declare const kCMMuxedStreamType_MPEG2Transport: number;

export declare const kCMTextMarkupAttribute_Alignment: interop.Pointer;

export declare const kCMVideoCodecType_AppleProRes422LT: number;

export declare const kCMBlockBufferBadOffsetParameterErr: number;

export declare const kCMSubtitleFormatType_3GText: number;

export declare const kCMMPEG2VideoProfile_HDV_720p60: number;

export declare const kCMFormatDescriptionConformsToMPEG2VideoProfile: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_540p: number;

export declare const kCMMetadataIdentifier_QuickTimeMetadataLocation_ISO6709: interop.Pointer;

export declare const kCMTextFormatDescriptionColor_Red: interop.Pointer;

export declare const kCMFormatDescriptionExtension_VerbatimISOSampleEntry: interop.Pointer;

export declare const kCMTextFormatDescriptionExtension_TextJustification: interop.Pointer;

export declare const kCMSampleAttachmentKey_PartialSync: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_Reverse: interop.Pointer;

export declare const kCMMetadataBaseDataType_SInt16: interop.Pointer;

export declare const kCMTimebaseNotificationKey_EventTime: interop.Pointer;

export declare const kCMBlockBufferCustomBlockSourceVersion: number;

export declare const kCMSampleBufferLensStabilizationInfo_Unavailable: interop.Pointer;

export declare const kCMVideoCodecType_AppleProResRAWHQ: number;

export declare const kCMBlockBufferPermitEmptyReferenceFlag: number;

export declare const kCMTimebaseError_TimerIntervalTooShort: number;

export declare const kCMPixelFormat_444YpCbCr10: number;

export declare const kCMFormatDescriptionExtension_Depth: interop.Pointer;

export declare const kCMTextFormatDescriptionStyle_Font: interop.Pointer;

export declare const kCMMetadataFormatType_Boxed: number;

export declare const kCMBlockBufferNoErr: number;

export declare const kCMVideoCodecType_VP9: number;

export declare const kCMFormatDescriptionColorPrimaries_SMPTE_C: interop.Pointer;

export declare const kCMSampleBufferError_DataFailed: number;

export declare const kCMFormatDescriptionFieldDetail_TemporalBottomFirst: interop.Pointer;

export declare const kCMMetadataFormatDescriptionMetadataSpecificationKey_ExtendedLanguageTag: interop.Pointer;

export declare const kCMVideoCodecType_SorensonVideo3: number;

export declare const kCMTextFormatDescriptionColor_Green: interop.Pointer;

export declare const kCMTextJustification_bottom_right: number;

export declare const kCMTextMarkupGenericFontName_Fantasy: interop.Pointer;

export declare const kCMVideoCodecType_SorensonVideo: number;

export declare const kCMTextJustification_left_top: number;

export declare const kCMVideoCodecType_DVCPro50PAL: number;

export declare const kCMSampleBufferError_InvalidEntryCount: number;

export declare const kCMFormatDescriptionExtension_ContentLightLevelInfo: interop.Pointer;

export declare const kCMFormatDescriptionExtension_FieldCount: interop.Pointer;

export declare const kCMMPEG2VideoProfile_HDV_720p50: number;

export declare const kCMTextFormatDescriptionExtension_DefaultFontName: interop.Pointer;

export declare const kCMFormatDescriptionKey_PixelAspectRatioVerticalSpacing: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_720p50_CBR50: number;

export declare const kCMVideoCodecType_DolbyVisionHEVC: number;

export declare const kCMSampleBufferConduitNotification_InhibitOutputUntil: interop.Pointer;

export declare const kCMClockError_MissingRequiredParameter: number;

export declare const kCMBufferQueueTrigger_WhenDataBecomesReady: number;

export declare const kCMTimeCodeFormatType_Counter64: number;

export declare const kCMTextMarkupAlignmentType_Left: interop.Pointer;

export declare const kCMHEVCTemporalLevelInfoKey_ProfileCompatibilityFlags: interop.Pointer;

export declare const kCMPixelFormat_24RGB: number;

export declare const kCMBufferQueueError_InvalidTriggerCondition: number;

export declare const kCMTextMarkupGenericFontName_Default: interop.Pointer;

export declare const kCMMediaType_Metadata: number;

export declare const kCMFormatDescriptionExtension_ICCProfile: interop.Pointer;

export declare const kCMFormatDescriptionExtension_YCbCrMatrix: interop.Pointer;

export declare const kCMSampleBufferError_InvalidMediaFormat: number;

export declare const kCMSampleBufferNotificationParameter_OSStatus: interop.Pointer;

export declare const kCMMetadataBaseDataType_PolygonF32: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_1080p25_CBR50: number;

export declare const kCMMediaType_Video: number;

export declare const kCMMetadataDataTypeRegistryError_RequiresConformingBaseType: number;

export declare const kCMSampleAttachmentKey_HEVCTemporalSubLayerAccess: interop.Pointer;

export declare const kCMTextMarkupAttribute_RelativeFontSize: interop.Pointer;

export declare const kCMVideoCodecType_HEVC: number;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_1080i60_VBR35: number;

export declare const kCMFormatDescriptionKey_CleanApertureHorizontalOffsetRational: interop.Pointer;

export declare const kCMFormatDescriptionExtensionKey_MetadataKeyTable: interop.Pointer;

export declare const kCMSampleBufferConsumerNotification_BufferConsumed: interop.Pointer;

export declare const kCMFormatDescriptionExtension_PixelAspectRatio: interop.Pointer;

export declare const kCMTextMarkupCharacterEdgeStyle_Raised: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_EmptyMedia: interop.Pointer;

export declare const kCMAudioCodecType_AAC_LCProtected: number;

export declare const kCMFormatDescriptionKey_PixelAspectRatioHorizontalSpacing: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_LocalID: interop.Pointer;

export declare const kCMTextMarkupAttribute_CharacterBackgroundColorARGB: interop.Pointer;

export declare const kCMFormatDescriptionKey_CleanApertureHorizontalOffset: interop.Pointer;

export declare const kCMVideoCodecType_MPEG2Video: number;

export declare const kCMMetadataKeySpace_QuickTimeUserData: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_720p24_VBR35: number;

export declare const kCMTimingInfoInvalid: CMSampleTimingInfo;

export declare const kCMTextDisplayFlag_continuousKaraoke: number;

export declare const kCMFormatDescriptionChromaLocation_TopLeft: interop.Pointer;

export declare const kCMPixelFormat_32ARGB: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_720p30_CBR50: number;

export declare const kCMTextDisplayFlag_scrollDirection_bottomToTop: number;

export declare const kCMVideoCodecType_DisparityHEVC: number;

export declare const kCMFormatDescriptionChromaLocation_Bottom: interop.Pointer;

export declare const kCMMetadataFormatDescriptionMetadataSpecificationKey_SetupData: interop.Pointer;

export declare const kCMTextDisplayFlag_writeTextVertically: number;

export declare const kCMImageDescriptionFlavor_ISOFamily: interop.Pointer;

export declare const kCMFormatDescriptionExtension_ChromaLocationBottomField: interop.Pointer;

export declare const kCMTextMarkupAlignmentType_Start: interop.Pointer;

export declare const kCMTextMarkupAttribute_FontFamilyName: interop.Pointer;

export declare const kCMFormatDescriptionExtension_Vendor: interop.Pointer;

export declare const kCMFormatDescriptionExtension_VerbatimSampleDescription: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_ResumeOutput: interop.Pointer;

export declare const kCMTextDisplayFlag_allSubtitlesForced: number;

export declare const kCMMPEG2VideoProfile_HDV_720p24: number;

export declare const kCMMetadataDataType_QuickTimeMetadataLocation_ISO6709: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_DroppedFrameReasonInfo: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_ResetDecoderBeforeDecoding: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_TrimDurationAtStart: interop.Pointer;

export declare const kCMTextMarkupAttribute_VerticalLayout: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_StillImageLensStabilizationInfo: interop.Pointer;

export declare const kCMAudioFormatDescriptionMask_Extensions: number;

export declare const kCMTimeNegativeInfinity: CMTime;

export declare const kCMMetadataBaseDataType_PointF32: interop.Pointer;

export declare const kCMFormatDescriptionColorPrimaries_ITU_R_709_2: interop.Pointer;

export declare const kCMFormatDescriptionTransferFunction_ITU_R_2100_HLG: interop.Pointer;

export declare const kCMFormatDescriptionKey_CleanApertureWidth: interop.Pointer;

export declare const kCMMetadataDataType_QuickTimeMetadataDirection: interop.Pointer;

export declare const kCMFormatDescriptionBridgeError_UnsupportedSampleDescriptionFlavor: number;

export declare const kCMTextFormatDescriptionStyle_FontSize: interop.Pointer;

export declare const kCMBufferQueueTrigger_WhenEndOfDataReached: number;

export declare const kCMFormatDescriptionColorPrimaries_P22: interop.Pointer;

export declare const kCMPixelFormat_422YpCbCr16: number;

export declare const kCMMediaType_TimeCode: number;

export declare const kCMMetadataBaseDataType_RectF32: interop.Pointer;

export declare const kCMFormatDescriptionExtension_TemporalQuality: interop.Pointer;

export declare const kCMBlockBufferInsufficientSpaceErr: number;

export declare const kCMMetadataIdentifier_QuickTimeMetadataPreferredAffineTransform: interop.Pointer;

export declare const kCMTextFormatDescriptionColor_Blue: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_CameraIntrinsicMatrix: interop.Pointer;

export declare const kCMFormatDescriptionTransferFunction_SMPTE_ST_428_1: interop.Pointer;

export declare const kCMMetadataIdentifierError_BadIdentifier: number;

export declare const kCMVideoCodecType_JPEG: number;

export declare const kCMFormatDescriptionColorPrimaries_P3_D65: interop.Pointer;

export declare const kCMTextFormatDescriptionExtension_VerticalJustification: interop.Pointer;

export declare const kCMSampleAttachmentKey_DependsOnOthers: interop.Pointer;

export declare const kCMMetadataBaseDataType_Float64: interop.Pointer;

export declare const kCMFormatDescriptionAlphaChannelMode_PremultipliedAlpha: interop.Pointer;

export declare const kCMTextDisplayFlag_forcedSubtitlesPresent: number;

export declare const kCMTimeCodeFormatType_TimeCode32: number;

export declare const kCMTimeCodeFormatType_TimeCode64: number;

export declare const kCMFormatDescriptionFieldDetail_SpatialFirstLineLate: interop.Pointer;

export declare const kCMMetadataBaseDataType_UInt32: interop.Pointer;

export declare const kCMFormatDescriptionExtension_Version: interop.Pointer;

export declare const kCMFormatDescriptionChromaLocation_Center: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_DisplayEmptyMediaImmediately: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_DataTypeNamespace: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_DrainAfterDecoding: interop.Pointer;

export declare const kCMFormatDescriptionExtension_VerbatimImageDescription: interop.Pointer;

export declare const kCMFormatDescriptionKey_CleanApertureVerticalOffsetRational: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_TrimDurationAtEnd: interop.Pointer;

export declare const kCMFormatDescriptionChromaLocation_BottomLeft: interop.Pointer;

export declare const kCMFormatDescriptionColorPrimaries_ITU_R_2020: interop.Pointer;

export declare const kCMVideoCodecType_MPEG4Video: number;

export declare const kCMMetadataIdentifierError_BadKeyType: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_720p24_CBR50: number;

export declare const kCMMetadataBaseDataType_UTF16: interop.Pointer;

export declare const kCMPixelFormat_16LE5551: number;

export declare const kCMFormatDescriptionExtension_FormatName: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_HD_1080i60_VBR35: number;

export declare const kCMSampleAttachmentKey_EarlierDisplayTimesAllowed: interop.Pointer;

export declare const kCMBlockBufferUnallocatedBlockErr: number;

export declare const kCMSampleBufferAttachmentKey_PermanentEmptyMedia: interop.Pointer;

export declare const kCMBufferQueueTrigger_WhenBufferCountBecomesGreaterThan: number;

export declare const kCMMPEG2VideoProfile_HDV_720p25: number;

export declare const kCMClosedCaptionFormatType_CEA608: number;

export declare const kCMTextMarkupAttribute_ForegroundColorARGB: interop.Pointer;

export declare const kCMPixelFormat_16BE555: number;

export declare const kCMFormatDescriptionTransferFunction_ITU_R_709_2: interop.Pointer;

export declare const kCMSampleBufferDroppedFrameReason_OutOfBuffers: interop.Pointer;

export declare const kCMTextDisplayFlag_scrollDirectionMask: number;

export declare const kCMMetadataIdentifierError_NoKeyValueAvailable: number;

export declare const kCMTextDisplayFlag_scrollDirection_rightToLeft: number;

export declare const kCMTimeValueKey: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_SampleReferenceByteOffset: interop.Pointer;

export declare const kCMSampleBufferError_SampleIndexOutOfRange: number;

export declare const kCMTextMarkupAttribute_OrthogonalLinePositionPercentageRelativeToWritingDirection: interop.Pointer;

export declare const kCMVideoCodecType_DepthHEVC: number;

export declare const kCMMetadataDataTypeRegistryError_RequiredParameterMissing: number;

export declare const kCMMetadataIdentifierError_AllocationFailed: number;

export declare const kCMTextMarkupAttribute_BaseFontSizePercentageRelativeToVideoHeight: interop.Pointer;

export declare const kCMBlockBufferAssureMemoryNowFlag: number;

export declare const kCMTextFormatType_QTText: number;

export declare const kCMSampleBufferNotification_DataFailed: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_720p50_VBR35: number;

export declare const kCMSampleBufferError_InvalidSampleData: number;

export declare const kCMFormatDescriptionYCbCrMatrix_SMPTE_240M_1995: interop.Pointer;

export declare const kCMTimebaseNotification_EffectiveRateChanged: interop.Pointer;

export declare const kCMMPEG2VideoProfile_HDV_1080i50: number;

export declare const kCMTextMarkupAttribute_TextPositionPercentageRelativeToWritingDirection: interop.Pointer;

export declare const kCMMetadataKeySpace_iTunes: interop.Pointer;

export declare const kCMTextDisplayFlag_scrollDirection_topToBottom: number;

export declare const kCMVideoCodecType_JPEG_OpenDML: number;

export declare const kCMTimeCodeFormatType_Counter32: number;

export declare const kCMTextFormatDescriptionStyle_FontFace: interop.Pointer;

export declare const kCMTextFormatDescriptionExtension_BackgroundColor: interop.Pointer;

export declare const kCMSampleAttachmentKey_AudioIndependentSampleDecoderRefreshCount: interop.Pointer;

export declare const kCMSampleBufferLensStabilizationInfo_Off: interop.Pointer;

export declare const kCMClockError_InvalidParameter: number;

export declare const kCMVideoCodecType_JPEG_XL: number;

export declare const kCMVideoCodecType_AppleProRes422Proxy: number;

export declare const kCMMetadataBaseDataType_RawData: interop.Pointer;

export declare const kCMBufferQueueTrigger_WhenDurationBecomesLessThan: number;

export declare const kCMSoundDescriptionFlavor_QuickTimeMovie: interop.Pointer;

export declare const kCMTextMarkupAttribute_CharacterEdgeStyle: interop.Pointer;

export declare const kCMFormatDescriptionExtension_OriginalCompressionSettings: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_Namespace: interop.Pointer;

export declare const kCMPixelFormat_422YpCbCr10: number;

export declare const kCMBufferQueueError_EnqueueAfterEndOfData: number;

export declare const kCMVideoCodecType_AppleProRes422HQ: number;

export declare const kCMFormatDescriptionBridgeError_InvalidSerializedSampleDescription: number;

export declare const kCMMPEG2VideoProfile_XDCAM_EX_720p60_VBR35: number;

export declare const kCMBufferQueueError_BadTriggerDuration: number;

export declare const kCMTimeEpochKey: interop.Pointer;

export declare const kCMSimpleQueueError_QueueIsFull: number;

export declare const kCMMetadataFormatType_EMSG: number;

export declare const kCMFormatDescriptionTransferFunction_SMPTE_ST_2084_PQ: interop.Pointer;

export declare const kCMTimebaseError_InvalidParameter: number;

export declare const kCMTimeRangeDurationKey: interop.Pointer;

export declare const kCMMetadataFormatDescriptionKey_LanguageTag: interop.Pointer;

export declare const kCMVideoCodecType_DVCPROHD720p50: number;

export declare const kCMTextFormatDescriptionExtension_FontTable: interop.Pointer;

export declare const kCMTextMarkupAttribute_ItalicStyle: interop.Pointer;

export declare const kCMTextFormatDescriptionStyle_Ascent: interop.Pointer;

export declare const kCMSyncError_AllocationFailed: number;

export declare const kCMTimeCodeFlag_24HourMax: number;

export declare const kCMFormatDescriptionFieldDetail_SpatialFirstLineEarly: interop.Pointer;

export declare const kCMVideoCodecType_422YpCbCr8: number;

export declare const kCMMPEG2VideoProfile_HDV_720p30: number;

export declare const kCMMetadataKeySpace_Icy: interop.Pointer;

export declare const kCMVideoCodecType_H264: number;

export declare const kCMFormatDescriptionAlphaChannelMode_StraightAlpha: interop.Pointer;

export declare const kCMMPEG2VideoProfile_HDV_1080p24: number;

export declare const kCMTimePositiveInfinity: CMTime;

export declare const kCMSampleBufferDroppedFrameReason_Discontinuity: interop.Pointer;

export declare const kCMPixelFormat_8IndexedGray_WhiteIsZero: number;

export declare const kCMClosedCaptionFormatType_CEA708: number;

export declare const kCMTextMarkupGenericFontName_ProportionalSansSerif: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_HD_1080p24_VBR35: number;

export declare const kCMTimeRangeZero: CMTimeRange;

export declare const kCMTextDisplayFlag_fillTextRegion: number;

export declare const kCMSampleBufferConduitNotificationParameter_MinUpcomingOutputPTS: interop.Pointer;

export declare const kCMFormatDescriptionExtension_ContainsAlphaChannel: interop.Pointer;

export declare const kCMTextDisplayFlag_scrollDirection_leftToRight: number;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_1080p30_CBR50: number;

export declare const kCMVideoCodecType_AppleProRes422: number;

export declare const kCMMetadataFormatDescriptionKey_DataType: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_PostNotificationWhenConsumed: interop.Pointer;

export declare const kCMSampleBufferDroppedFrameReason_FrameWasLate: interop.Pointer;

export declare const kCMMuxedStreamType_MPEG1System: number;

export declare const kCMVideoCodecType_DVCPro50NTSC: number;

export declare const kCMTimeMappingSourceKey: interop.Pointer;

export declare const kCMMetadataBaseDataType_GIF: interop.Pointer;

export declare const kCMMPEG2VideoProfile_XDCAM_HD422_720p25_CBR50: number;

export declare const kCMSimpleQueueError_AllocationFailed: number;

export declare const kCMSampleBufferConduitNotification_UpcomingOutputPTSRangeChanged: interop.Pointer;

export declare const kCMTextFormatDescriptionExtension_DisplayFlags: interop.Pointer;

export declare const kCMSampleBufferError_CannotSubdivide: number;

export declare const kCMTextFormatDescriptionStyle_ForegroundColor: interop.Pointer;

export declare const kCMPixelFormat_422YpCbCr8: number;

export declare const kCMTextFormatDescriptionRect_Right: interop.Pointer;

export declare const kCMFormatDescriptionExtension_GammaLevel: interop.Pointer;

export declare const kCMTextDisplayFlag_scrollOut: number;

export declare const kCMSampleBufferLensStabilizationInfo_OutOfRange: interop.Pointer;

export declare const kCMFormatDescriptionExtension_AuxiliaryTypeInfo: interop.Pointer;

export declare const kCMSampleBufferAttachmentKey_FillDiscontinuitiesWithSilence: interop.Pointer;

export declare const kCMFormatDescriptionExtension_BytesPerRow: interop.Pointer;

export declare const kCMVideoCodecType_H263: number;

export declare const kCMSampleBufferAttachmentKey_DroppedFrameReason: interop.Pointer;

export declare const kCMSampleBufferError_BufferHasNoSampleSizes: number;

export declare const kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier: interop.Pointer;

export declare const kCMMetadataFormatDescription_StructuralDependencyKey_DependencyIsInvalidFlag: interop.Pointer;

export declare const kCMVideoCodecType_DVCProPAL: number;

export declare const kCMTextDisplayFlag_scrollIn: number;

export declare const kCMHEVCTemporalLevelInfoKey_ConstraintIndicatorFlags: interop.Pointer;

export declare const kCMMuxedStreamType_DV: number;

export declare const kCMAudioFormatDescriptionMask_MagicCookie: number;

export declare const kCMFormatDescriptionExtension_ColorPrimaries: interop.Pointer;

export declare const kCMSampleBufferConduitNotificationParameter_ResumeTag: interop.Pointer;

export declare const kCMMetadataKeySpace_ISOUserData: interop.Pointer;

export declare const kCMFormatDescriptionColorPrimaries_DCI_P3: interop.Pointer;

export declare const kCMSampleAttachmentKey_HEVCTemporalLevelInfo: interop.Pointer;

export declare const kCMMetadataBaseDataType_AffineTransformF64: interop.Pointer;

export declare const kCMTimeCodeFormatDescriptionExtension_SourceReferenceName: interop.Pointer;

export declare const kCMMetadataBaseDataType_PerspectiveTransformF64: interop.Pointer;

export declare const kCMSampleBufferConduitNotification_ResetOutput: interop.Pointer;

export declare const kCMVideoCodecType_AppleProRes4444: number;

export declare const kCMMediaType_AuxiliaryPicture: number;

export declare const kCMPersistentTrackID_Invalid: number;

export declare const CMTimeRoundingMethod: {
  RoundHalfAwayFromZero: 1,
  RoundTowardZero: 2,
  RoundAwayFromZero: 3,
  QuickTime: 4,
  RoundTowardPositiveInfinity: 5,
  RoundTowardNegativeInfinity: 6,
  Default: 1,
};

export declare const CMTimeFlags: {
  Valid: 1,
  HasBeenRounded: 2,
  PositiveInfinity: 4,
  NegativeInfinity: 8,
  Indefinite: 16,
  ImpliedValueFlagsMask: 28,
};

export declare class CMBufferCallbacks {
  constructor(init?: CMBufferCallbacks);
  version: number;
  refcon: interop.Pointer;
  getDecodeTimeStamp: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => CMTime | null;
  getPresentationTimeStamp: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => CMTime | null;
  getDuration: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => CMTime | null;
  isDataReady: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  compare: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => interop.Enum<typeof CFComparisonResult> | null;
  dataBecameReadyNotification: interop.Object | null;
  getSize: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
}

export declare class opaqueCMBufferQueue {
  constructor(init?: opaqueCMBufferQueue);
}

export declare class OpaqueCMMemoryPool {
  constructor(init?: OpaqueCMMemoryPool);
}

export declare class CMTimeMapping {
  constructor(init?: CMTimeMapping);
  source: CMTimeRange;
  target: CMTimeRange;
}

export declare class opaqueCMSampleBuffer {
  constructor(init?: opaqueCMSampleBuffer);
}

export declare class CMVideoDimensions {
  constructor(init?: CMVideoDimensions);
  width: number;
  height: number;
}

export declare class CMBlockBufferCustomBlockSource {
  constructor(init?: CMBlockBufferCustomBlockSource);
  version: number;
  AllocateBlock: (p1: interop.PointerConvertible, p2: number) => interop.Pointer | null;
  FreeBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void | null;
  refCon: interop.Pointer;
}

export declare class CMTime {
  constructor(init?: CMTime);
  value: number;
  timescale: number;
  flags: interop.Enum<typeof CMTimeFlags>;
  epoch: number;
}

export declare class opaqueCMSimpleQueue {
  constructor(init?: opaqueCMSimpleQueue);
}

export declare class OpaqueCMTimebase {
  constructor(init?: OpaqueCMTimebase);
}

export declare class opaqueCMBufferQueueTriggerToken {
  constructor(init?: opaqueCMBufferQueueTriggerToken);
}

export declare class CMTimeRange {
  constructor(init?: CMTimeRange);
  start: CMTime;
  duration: CMTime;
}

export declare class OpaqueCMTaggedBufferGroup {
  constructor(init?: OpaqueCMTaggedBufferGroup);
}

export declare class CMSampleTimingInfo {
  constructor(init?: CMSampleTimingInfo);
  duration: CMTime;
  presentationTimeStamp: CMTime;
  decodeTimeStamp: CMTime;
}

export declare class opaqueCMFormatDescription {
  constructor(init?: opaqueCMFormatDescription);
}

export declare class CMBufferHandlers {
  constructor(init?: CMBufferHandlers);
  version: number;
  getDecodeTimeStamp: (p1: interop.PointerConvertible) => CMTime | null;
  getPresentationTimeStamp: (p1: interop.PointerConvertible) => CMTime | null;
  getDuration: (p1: interop.PointerConvertible) => CMTime | null;
  isDataReady: (p1: interop.PointerConvertible) => number | null;
  compare: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Enum<typeof CFComparisonResult> | null;
  dataBecameReadyNotification: interop.Object | null;
  getSize: (p1: interop.PointerConvertible) => number | null;
}

export declare class OpaqueCMTagCollection {
  constructor(init?: OpaqueCMTagCollection);
}

export declare class OpaqueCMBlockBuffer {
  constructor(init?: OpaqueCMBlockBuffer);
}

export declare class OpaqueCMClock {
  constructor(init?: OpaqueCMClock);
}

export declare function CMTimeMake(value: number, timescale: number): CMTime;

export declare function CMTimeMakeWithEpoch(value: number, timescale: number, epoch: number): CMTime;

export declare function CMTimeMakeWithSeconds(seconds: number, preferredTimescale: number): CMTime;

export declare function CMTimeGetSeconds(time: CMTime): number;

export declare function CMTimeConvertScale(time: CMTime, newTimescale: number, method: interop.Enum<typeof CMTimeRoundingMethod>): CMTime;

export declare function CMTimeAdd(lhs: CMTime, rhs: CMTime): CMTime;

export declare function CMTimeSubtract(lhs: CMTime, rhs: CMTime): CMTime;

export declare function CMTimeMultiply(time: CMTime, multiplier: number): CMTime;

export declare function CMTimeMultiplyByFloat64(time: CMTime, multiplier: number): CMTime;

export declare function CMTimeMultiplyByRatio(time: CMTime, multiplier: number, divisor: number): CMTime;

export declare function CMTimeCompare(time1: CMTime, time2: CMTime): number;

export declare function CMTimeMinimum(time1: CMTime, time2: CMTime): CMTime;

export declare function CMTimeMaximum(time1: CMTime, time2: CMTime): CMTime;

export declare function CMTimeAbsoluteValue(time: CMTime): CMTime;

export declare function CMTimeCopyAsDictionary(time: CMTime, allocator: interop.Object): interop.Object;

export declare function CMTimeMakeFromDictionary(dictionaryRepresentation: interop.Object): CMTime;

export declare function CMTimeCopyDescription(allocator: interop.Object, time: CMTime): interop.Object;

export declare function CMTimeShow(time: CMTime): void;

export declare function CMSetAttachment(target: interop.Object, key: interop.Object, value: interop.Object, attachmentMode: number): void;

export declare function CMGetAttachment(target: interop.Object, key: interop.Object, attachmentModeOut: interop.PointerConvertible): interop.Object;

export declare function CMRemoveAttachment(target: interop.Object, key: interop.Object): void;

export declare function CMRemoveAllAttachments(target: interop.Object): void;

export declare function CMCopyDictionaryOfAttachments(allocator: interop.Object, target: interop.Object, attachmentMode: number): interop.Object;

export declare function CMSetAttachments(target: interop.Object, theAttachments: interop.Object, attachmentMode: number): void;

export declare function CMPropagateAttachments(source: interop.Object, destination: interop.Object): void;

export declare function CMBlockBufferCreateEmpty(structureAllocator: interop.Object, subBlockCapacity: number, flags: number, blockBufferOut: interop.PointerConvertible): number;

export declare function CMBlockBufferCreateWithMemoryBlock(structureAllocator: interop.Object, memoryBlock: interop.PointerConvertible, blockLength: number, blockAllocator: interop.Object, customBlockSource: interop.PointerConvertible, offsetToData: number, dataLength: number, flags: number, blockBufferOut: interop.PointerConvertible): number;

export declare function CMBlockBufferCreateWithBufferReference(structureAllocator: interop.Object, bufferReference: interop.Object, offsetToData: number, dataLength: number, flags: number, blockBufferOut: interop.PointerConvertible): number;

export declare function CMBlockBufferCreateContiguous(structureAllocator: interop.Object, sourceBuffer: interop.Object, blockAllocator: interop.Object, customBlockSource: interop.PointerConvertible, offsetToData: number, dataLength: number, flags: number, blockBufferOut: interop.PointerConvertible): number;

export declare function CMBlockBufferGetTypeID(): number;

export declare function CMBlockBufferAppendMemoryBlock(theBuffer: interop.Object, memoryBlock: interop.PointerConvertible, blockLength: number, blockAllocator: interop.Object, customBlockSource: interop.PointerConvertible, offsetToData: number, dataLength: number, flags: number): number;

export declare function CMBlockBufferAppendBufferReference(theBuffer: interop.Object, targetBBuf: interop.Object, offsetToData: number, dataLength: number, flags: number): number;

export declare function CMBlockBufferAssureBlockMemory(theBuffer: interop.Object): number;

export declare function CMBlockBufferAccessDataBytes(theBuffer: interop.Object, offset: number, length: number, temporaryBlock: interop.PointerConvertible, returnedPointerOut: interop.PointerConvertible): number;

export declare function CMBlockBufferCopyDataBytes(theSourceBuffer: interop.Object, offsetToData: number, dataLength: number, destination: interop.PointerConvertible): number;

export declare function CMBlockBufferReplaceDataBytes(sourceBytes: interop.PointerConvertible, destinationBuffer: interop.Object, offsetIntoDestination: number, dataLength: number): number;

export declare function CMBlockBufferFillDataBytes(fillByte: number, destinationBuffer: interop.Object, offsetIntoDestination: number, dataLength: number): number;

export declare function CMBlockBufferGetDataPointer(theBuffer: interop.Object, offset: number, lengthAtOffsetOut: interop.PointerConvertible, totalLengthOut: interop.PointerConvertible, dataPointerOut: interop.PointerConvertible): number;

export declare function CMBlockBufferGetDataLength(theBuffer: interop.Object): number;

export declare function CMBlockBufferIsRangeContiguous(theBuffer: interop.Object, offset: number, length: number): number;

export declare function CMBlockBufferIsEmpty(theBuffer: interop.Object): number;

export declare function CMFormatDescriptionCreate(allocator: interop.Object, mediaType: number, mediaSubType: number, extensions: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMFormatDescriptionGetTypeID(): number;

export declare function CMFormatDescriptionEqual(formatDescription: interop.Object, otherFormatDescription: interop.Object): number;

export declare function CMFormatDescriptionEqualIgnoringExtensionKeys(formatDescription: interop.Object, otherFormatDescription: interop.Object, formatDescriptionExtensionKeysToIgnore: interop.Object, sampleDescriptionExtensionAtomKeysToIgnore: interop.Object): number;

export declare function CMFormatDescriptionGetMediaType(desc: interop.Object): number;

export declare function CMFormatDescriptionGetMediaSubType(desc: interop.Object): number;

export declare function CMFormatDescriptionGetExtensions(desc: interop.Object): interop.Object;

export declare function CMFormatDescriptionGetExtension(desc: interop.Object, extensionKey: interop.Object): interop.Object;

export declare function CMAudioFormatDescriptionCreate(allocator: interop.Object, asbd: interop.PointerConvertible, layoutSize: number, layout: interop.PointerConvertible, magicCookieSize: number, magicCookie: interop.PointerConvertible, extensions: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMAudioFormatDescriptionGetStreamBasicDescription(desc: interop.Object): interop.Pointer;

export declare function CMAudioFormatDescriptionGetMagicCookie(desc: interop.Object, sizeOut: interop.PointerConvertible): interop.Pointer;

export declare function CMAudioFormatDescriptionGetChannelLayout(desc: interop.Object, sizeOut: interop.PointerConvertible): interop.Pointer;

export declare function CMAudioFormatDescriptionGetFormatList(desc: interop.Object, sizeOut: interop.PointerConvertible): interop.Pointer;

export declare function CMAudioFormatDescriptionGetRichestDecodableFormat(desc: interop.Object): interop.Pointer;

export declare function CMAudioFormatDescriptionGetMostCompatibleFormat(desc: interop.Object): interop.Pointer;

export declare function CMAudioFormatDescriptionCreateSummary(allocator: interop.Object, formatDescriptionArray: interop.Object, flags: number, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMAudioFormatDescriptionEqual(formatDescription: interop.Object, otherFormatDescription: interop.Object, equalityMask: number, equalityMaskOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionCreate(allocator: interop.Object, codecType: number, width: number, height: number, extensions: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionCreateForImageBuffer(allocator: interop.Object, imageBuffer: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionCreateFromH264ParameterSets(allocator: interop.Object, parameterSetCount: number, parameterSetPointers: interop.PointerConvertible, parameterSetSizes: interop.PointerConvertible, NALUnitHeaderLength: number, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionCreateFromHEVCParameterSets(allocator: interop.Object, parameterSetCount: number, parameterSetPointers: interop.PointerConvertible, parameterSetSizes: interop.PointerConvertible, NALUnitHeaderLength: number, extensions: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionGetH264ParameterSetAtIndex(videoDesc: interop.Object, parameterSetIndex: number, parameterSetPointerOut: interop.PointerConvertible, parameterSetSizeOut: interop.PointerConvertible, parameterSetCountOut: interop.PointerConvertible, NALUnitHeaderLengthOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionGetHEVCParameterSetAtIndex(videoDesc: interop.Object, parameterSetIndex: number, parameterSetPointerOut: interop.PointerConvertible, parameterSetSizeOut: interop.PointerConvertible, parameterSetCountOut: interop.PointerConvertible, NALUnitHeaderLengthOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionGetDimensions(videoDesc: interop.Object): CMVideoDimensions;

export declare function CMVideoFormatDescriptionGetPresentationDimensions(videoDesc: interop.Object, usePixelAspectRatio: number, useCleanAperture: number): CGSize;

export declare function CMVideoFormatDescriptionGetCleanAperture(videoDesc: interop.Object, originIsAtTopLeft: number): CGRect;

export declare function CMVideoFormatDescriptionGetExtensionKeysCommonWithImageBuffers(): interop.Object;

export declare function CMVideoFormatDescriptionMatchesImageBuffer(desc: interop.Object, imageBuffer: interop.Object): number;

export declare function CMMuxedFormatDescriptionCreate(allocator: interop.Object, muxType: number, extensions: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMTextFormatDescriptionGetDisplayFlags(desc: interop.Object, displayFlagsOut: interop.PointerConvertible): number;

export declare function CMTextFormatDescriptionGetJustification(desc: interop.Object, horizontaJustificationlOut: interop.PointerConvertible, verticalJustificationOut: interop.PointerConvertible): number;

export declare function CMTextFormatDescriptionGetDefaultTextBox(desc: interop.Object, originIsAtTopLeft: number, heightOfTextTrack: number, defaultTextBoxOut: interop.PointerConvertible): number;

export declare function CMTextFormatDescriptionGetDefaultStyle(desc: interop.Object, localFontIDOut: interop.PointerConvertible, boldOut: interop.PointerConvertible, italicOut: interop.PointerConvertible, underlineOut: interop.PointerConvertible, fontSizeOut: interop.PointerConvertible, colorComponentsOut: interop.PointerConvertible): number;

export declare function CMTextFormatDescriptionGetFontName(desc: interop.Object, localFontID: number, fontNameOut: interop.PointerConvertible): number;

export declare function CMTimeCodeFormatDescriptionCreate(allocator: interop.Object, timeCodeFormatType: number, frameDuration: CMTime, frameQuanta: number, flags: number, extensions: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMTimeCodeFormatDescriptionGetFrameDuration(timeCodeFormatDescription: interop.Object): CMTime;

export declare function CMTimeCodeFormatDescriptionGetFrameQuanta(timeCodeFormatDescription: interop.Object): number;

export declare function CMTimeCodeFormatDescriptionGetTimeCodeFlags(desc: interop.Object): number;

export declare function CMMetadataFormatDescriptionCreateWithKeys(allocator: interop.Object, metadataType: number, keys: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMMetadataFormatDescriptionCreateWithMetadataSpecifications(allocator: interop.Object, metadataType: number, metadataSpecifications: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMMetadataFormatDescriptionCreateWithMetadataFormatDescriptionAndMetadataSpecifications(allocator: interop.Object, sourceDescription: interop.Object, metadataSpecifications: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMMetadataFormatDescriptionCreateByMergingMetadataFormatDescriptions(allocator: interop.Object, sourceDescription: interop.Object, otherSourceDescription: interop.Object, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMMetadataFormatDescriptionGetKeyWithLocalID(desc: interop.Object, localKeyID: number): interop.Object;

export declare function CMMetadataFormatDescriptionGetIdentifiers(desc: interop.Object): interop.Object;

export declare function CMSampleBufferCreate(allocator: interop.Object, dataBuffer: interop.Object, dataReady: number, makeDataReadyCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, makeDataReadyRefcon: interop.PointerConvertible, formatDescription: interop.Object, numSamples: number, numSampleTimingEntries: number, sampleTimingArray: interop.PointerConvertible, numSampleSizeEntries: number, sampleSizeArray: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferCreateWithMakeDataReadyHandler(allocator: interop.Object, dataBuffer: interop.Object, dataReady: number, formatDescription: interop.Object, numSamples: number, numSampleTimingEntries: number, sampleTimingArray: interop.PointerConvertible, numSampleSizeEntries: number, sampleSizeArray: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible, makeDataReadyHandler: (p1: interop.PointerConvertible) => number): number;

export declare function CMSampleBufferCreateReady(allocator: interop.Object, dataBuffer: interop.Object, formatDescription: interop.Object, numSamples: number, numSampleTimingEntries: number, sampleTimingArray: interop.PointerConvertible, numSampleSizeEntries: number, sampleSizeArray: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMAudioSampleBufferCreateWithPacketDescriptions(allocator: interop.Object, dataBuffer: interop.Object, dataReady: number, makeDataReadyCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, makeDataReadyRefcon: interop.PointerConvertible, formatDescription: interop.Object, numSamples: number, presentationTimeStamp: CMTime, packetDescriptions: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMAudioSampleBufferCreateWithPacketDescriptionsAndMakeDataReadyHandler(allocator: interop.Object, dataBuffer: interop.Object, dataReady: number, formatDescription: interop.Object, numSamples: number, presentationTimeStamp: CMTime, packetDescriptions: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible, makeDataReadyHandler: (p1: interop.PointerConvertible) => number): number;

export declare function CMAudioSampleBufferCreateReadyWithPacketDescriptions(allocator: interop.Object, dataBuffer: interop.Object, formatDescription: interop.Object, numSamples: number, presentationTimeStamp: CMTime, packetDescriptions: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferCreateForImageBuffer(allocator: interop.Object, imageBuffer: interop.Object, dataReady: number, makeDataReadyCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, makeDataReadyRefcon: interop.PointerConvertible, formatDescription: interop.Object, sampleTiming: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferCreateForImageBufferWithMakeDataReadyHandler(allocator: interop.Object, imageBuffer: interop.Object, dataReady: number, formatDescription: interop.Object, sampleTiming: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible, makeDataReadyHandler: (p1: interop.PointerConvertible) => number): number;

export declare function CMSampleBufferCreateReadyWithImageBuffer(allocator: interop.Object, imageBuffer: interop.Object, formatDescription: interop.Object, sampleTiming: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferCreateCopy(allocator: interop.Object, sbuf: interop.Object, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferCreateCopyWithNewTiming(allocator: interop.Object, originalSBuf: interop.Object, numSampleTimingEntries: number, sampleTimingArray: interop.PointerConvertible, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferCopySampleBufferForRange(allocator: interop.Object, sbuf: interop.Object, sampleRange: CFRange, sampleBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferGetTypeID(): number;

export declare function CMSampleBufferSetDataBuffer(sbuf: interop.Object, dataBuffer: interop.Object): number;

export declare function CMSampleBufferGetDataBuffer(sbuf: interop.Object): interop.Object;

export declare function CMSampleBufferGetImageBuffer(sbuf: interop.Object): interop.Object;

export declare function CMSampleBufferSetDataBufferFromAudioBufferList(sbuf: interop.Object, blockBufferStructureAllocator: interop.Object, blockBufferBlockAllocator: interop.Object, flags: number, bufferList: interop.PointerConvertible): number;

export declare function CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(sbuf: interop.Object, bufferListSizeNeededOut: interop.PointerConvertible, bufferListOut: interop.PointerConvertible, bufferListSize: number, blockBufferStructureAllocator: interop.Object, blockBufferBlockAllocator: interop.Object, flags: number, blockBufferOut: interop.PointerConvertible): number;

export declare function CMSampleBufferGetAudioStreamPacketDescriptions(sbuf: interop.Object, packetDescriptionsSize: number, packetDescriptionsOut: interop.PointerConvertible, packetDescriptionsSizeNeededOut: interop.PointerConvertible): number;

export declare function CMSampleBufferGetAudioStreamPacketDescriptionsPtr(sbuf: interop.Object, packetDescriptionsPointerOut: interop.PointerConvertible, packetDescriptionsSizeOut: interop.PointerConvertible): number;

export declare function CMSampleBufferCopyPCMDataIntoAudioBufferList(sbuf: interop.Object, frameOffset: number, numFrames: number, bufferList: interop.PointerConvertible): number;

export declare function CMSampleBufferSetDataReady(sbuf: interop.Object): number;

export declare function CMSampleBufferDataIsReady(sbuf: interop.Object): number;

export declare function CMSampleBufferSetDataFailed(sbuf: interop.Object, status: number): number;

export declare function CMSampleBufferHasDataFailed(sbuf: interop.Object, statusOut: interop.PointerConvertible): number;

export declare function CMSampleBufferMakeDataReady(sbuf: interop.Object): number;

export declare function CMSampleBufferTrackDataReadiness(sbuf: interop.Object, sampleBufferToTrack: interop.Object): number;

export declare function CMSampleBufferInvalidate(sbuf: interop.Object): number;

export declare function CMSampleBufferSetInvalidateCallback(sbuf: interop.Object, invalidateCallback: (p1: interop.PointerConvertible, p2: number) => void, invalidateRefCon: number): number;

export declare function CMSampleBufferSetInvalidateHandler(sbuf: interop.Object, invalidateHandler: (p1: interop.PointerConvertible) => void): number;

export declare function CMSampleBufferIsValid(sbuf: interop.Object): number;

export declare function CMSampleBufferGetNumSamples(sbuf: interop.Object): number;

export declare function CMSampleBufferGetDuration(sbuf: interop.Object): CMTime;

export declare function CMSampleBufferGetPresentationTimeStamp(sbuf: interop.Object): CMTime;

export declare function CMSampleBufferGetDecodeTimeStamp(sbuf: interop.Object): CMTime;

export declare function CMSampleBufferGetOutputDuration(sbuf: interop.Object): CMTime;

export declare function CMSampleBufferGetOutputPresentationTimeStamp(sbuf: interop.Object): CMTime;

export declare function CMSampleBufferSetOutputPresentationTimeStamp(sbuf: interop.Object, outputPresentationTimeStamp: CMTime): number;

export declare function CMSampleBufferGetOutputDecodeTimeStamp(sbuf: interop.Object): CMTime;

export declare function CMSampleBufferGetSampleTimingInfoArray(sbuf: interop.Object, numSampleTimingEntries: number, timingArrayOut: interop.PointerConvertible, timingArrayEntriesNeededOut: interop.PointerConvertible): number;

export declare function CMSampleBufferGetOutputSampleTimingInfoArray(sbuf: interop.Object, timingArrayEntries: number, timingArrayOut: interop.PointerConvertible, timingArrayEntriesNeededOut: interop.PointerConvertible): number;

export declare function CMSampleBufferGetSampleTimingInfo(sbuf: interop.Object, sampleIndex: number, timingInfoOut: interop.PointerConvertible): number;

export declare function CMSampleBufferGetSampleSizeArray(sbuf: interop.Object, sizeArrayEntries: number, sizeArrayOut: interop.PointerConvertible, sizeArrayEntriesNeededOut: interop.PointerConvertible): number;

export declare function CMSampleBufferGetSampleSize(sbuf: interop.Object, sampleIndex: number): number;

export declare function CMSampleBufferGetTotalSampleSize(sbuf: interop.Object): number;

export declare function CMSampleBufferGetFormatDescription(sbuf: interop.Object): interop.Object;

export declare function CMSampleBufferGetSampleAttachmentsArray(sbuf: interop.Object, createIfNecessary: number): interop.Object;

export declare function CMSampleBufferCallForEachSample(sbuf: interop.Object, callback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number, refcon: interop.PointerConvertible): number;

export declare function CMSampleBufferCallBlockForEachSample(sbuf: interop.Object, handler: (p1: interop.PointerConvertible, p2: number) => number): number;

export declare function CMTimeRangeMake(start: CMTime, duration: CMTime): CMTimeRange;

export declare function CMTimeRangeGetUnion(range: CMTimeRange, otherRange: CMTimeRange): CMTimeRange;

export declare function CMTimeRangeGetIntersection(range: CMTimeRange, otherRange: CMTimeRange): CMTimeRange;

export declare function CMTimeRangeEqual(range1: CMTimeRange, range2: CMTimeRange): number;

export declare function CMTimeRangeContainsTime(range: CMTimeRange, time: CMTime): number;

export declare function CMTimeRangeContainsTimeRange(range: CMTimeRange, otherRange: CMTimeRange): number;

export declare function CMTimeRangeGetEnd(range: CMTimeRange): CMTime;

export declare function CMTimeMapTimeFromRangeToRange(t: CMTime, fromRange: CMTimeRange, toRange: CMTimeRange): CMTime;

export declare function CMTimeClampToRange(time: CMTime, range: CMTimeRange): CMTime;

export declare function CMTimeMapDurationFromRangeToRange(dur: CMTime, fromRange: CMTimeRange, toRange: CMTimeRange): CMTime;

export declare function CMTimeFoldIntoRange(time: CMTime, foldRange: CMTimeRange): CMTime;

export declare function CMTimeRangeFromTimeToTime(start: CMTime, end: CMTime): CMTimeRange;

export declare function CMTimeRangeCopyAsDictionary(range: CMTimeRange, allocator: interop.Object): interop.Object;

export declare function CMTimeRangeMakeFromDictionary(dictionaryRepresentation: interop.Object): CMTimeRange;

export declare function CMTimeRangeCopyDescription(allocator: interop.Object, range: CMTimeRange): interop.Object;

export declare function CMTimeRangeShow(range: CMTimeRange): void;

export declare function CMTimeMappingMake(source: CMTimeRange, target: CMTimeRange): CMTimeMapping;

export declare function CMTimeMappingMakeEmpty(target: CMTimeRange): CMTimeMapping;

export declare function CMTimeMappingCopyAsDictionary(mapping: CMTimeMapping, allocator: interop.Object): interop.Object;

export declare function CMTimeMappingMakeFromDictionary(dictionaryRepresentation: interop.Object): CMTimeMapping;

export declare function CMTimeMappingCopyDescription(allocator: interop.Object, mapping: CMTimeMapping): interop.Object;

export declare function CMTimeMappingShow(mapping: CMTimeMapping): void;

export declare function CMClockGetTypeID(): number;

export declare function CMClockGetHostTimeClock(): interop.Object;

export declare function CMClockConvertHostTimeToSystemUnits(hostTime: CMTime): number;

export declare function CMClockMakeHostTimeFromSystemUnits(hostTime: number): CMTime;

export declare function CMClockGetTime(clock: interop.Object): CMTime;

export declare function CMClockGetAnchorTime(clock: interop.Object, clockTimeOut: interop.PointerConvertible, referenceClockTimeOut: interop.PointerConvertible): number;

export declare function CMClockMightDrift(clock: interop.Object, otherClock: interop.Object): number;

export declare function CMClockInvalidate(clock: interop.Object): void;

export declare function CMTimebaseGetTypeID(): number;

export declare function CMTimebaseCreateWithMasterClock(allocator: interop.Object, masterClock: interop.Object, timebaseOut: interop.PointerConvertible): number;

export declare function CMTimebaseCreateWithMasterTimebase(allocator: interop.Object, masterTimebase: interop.Object, timebaseOut: interop.PointerConvertible): number;

export declare function CMTimebaseCopyMasterTimebase(timebase: interop.Object): interop.Object;

export declare function CMTimebaseCopyMasterClock(timebase: interop.Object): interop.Object;

export declare function CMTimebaseCopyMaster(timebase: interop.Object): interop.Object;

export declare function CMTimebaseCopyUltimateMasterClock(timebase: interop.Object): interop.Object;

export declare function CMTimebaseGetMasterTimebase(timebase: interop.Object): interop.Object;

export declare function CMTimebaseGetMasterClock(timebase: interop.Object): interop.Object;

export declare function CMTimebaseGetMaster(timebase: interop.Object): interop.Object;

export declare function CMTimebaseGetUltimateMasterClock(timebase: interop.Object): interop.Object;

export declare function CMTimebaseSetMasterClock(timebase: interop.Object, newMasterClock: interop.Object): number;

export declare function CMTimebaseSetMasterTimebase(timebase: interop.Object, newMasterTimebase: interop.Object): number;

export declare function CMTimebaseGetTime(timebase: interop.Object): CMTime;

export declare function CMTimebaseGetTimeWithTimeScale(timebase: interop.Object, timescale: number, method: interop.Enum<typeof CMTimeRoundingMethod>): CMTime;

export declare function CMTimebaseSetTime(timebase: interop.Object, time: CMTime): number;

export declare function CMTimebaseSetAnchorTime(timebase: interop.Object, timebaseTime: CMTime, immediateSourceTime: CMTime): number;

export declare function CMTimebaseGetRate(timebase: interop.Object): number;

export declare function CMTimebaseGetTimeAndRate(timebase: interop.Object, timeOut: interop.PointerConvertible, rateOut: interop.PointerConvertible): number;

export declare function CMTimebaseSetRate(timebase: interop.Object, rate: number): number;

export declare function CMTimebaseSetRateAndAnchorTime(timebase: interop.Object, rate: number, timebaseTime: CMTime, immediateSourceTime: CMTime): number;

export declare function CMTimebaseGetEffectiveRate(timebase: interop.Object): number;

export declare function CMTimebaseAddTimer(timebase: interop.Object, timer: interop.Object, runloop: interop.Object): number;

export declare function CMTimebaseRemoveTimer(timebase: interop.Object, timer: interop.Object): number;

export declare function CMTimebaseSetTimerNextFireTime(timebase: interop.Object, timer: interop.Object, fireTime: CMTime, flags: number): number;

export declare function CMTimebaseSetTimerToFireImmediately(timebase: interop.Object, timer: interop.Object): number;

export declare function CMTimebaseAddTimerDispatchSource(timebase: interop.Object, timerSource: NSObject): number;

export declare function CMTimebaseRemoveTimerDispatchSource(timebase: interop.Object, timerSource: NSObject): number;

export declare function CMTimebaseSetTimerDispatchSourceNextFireTime(timebase: interop.Object, timerSource: NSObject, fireTime: CMTime, flags: number): number;

export declare function CMTimebaseSetTimerDispatchSourceToFireImmediately(timebase: interop.Object, timerSource: NSObject): number;

export declare function CMSyncGetRelativeRate(ofClockOrTimebase: interop.Object, relativeToClockOrTimebase: interop.Object): number;

export declare function CMSyncGetRelativeRateAndAnchorTime(ofClockOrTimebase: interop.Object, relativeToClockOrTimebase: interop.Object, outRelativeRate: interop.PointerConvertible, outOfClockOrTimebaseAnchorTime: interop.PointerConvertible, outRelativeToClockOrTimebaseAnchorTime: interop.PointerConvertible): number;

export declare function CMSyncConvertTime(time: CMTime, fromClockOrTimebase: interop.Object, toClockOrTimebase: interop.Object): CMTime;

export declare function CMSyncMightDrift(clockOrTimebase1: interop.Object, clockOrTimebase2: interop.Object): number;

export declare function CMSyncGetTime(clockOrTimebase: interop.Object): CMTime;

export declare function CMTimebaseNotificationBarrier(timebase: interop.Object): number;

export declare function CMVideoFormatDescriptionCreateFromBigEndianImageDescriptionData(allocator: interop.Object, imageDescriptionData: interop.PointerConvertible, size: number, stringEncoding: number, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionCreateFromBigEndianImageDescriptionBlockBuffer(allocator: interop.Object, imageDescriptionBlockBuffer: interop.Object, stringEncoding: number, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMVideoFormatDescriptionCopyAsBigEndianImageDescriptionBlockBuffer(allocator: interop.Object, videoFormatDescription: interop.Object, stringEncoding: number, flavor: interop.PointerConvertible, blockBufferOut: interop.PointerConvertible): number;

export declare function CMSwapBigEndianImageDescriptionToHost(imageDescriptionData: interop.PointerConvertible, imageDescriptionSize: number): number;

export declare function CMSwapHostEndianImageDescriptionToBig(imageDescriptionData: interop.PointerConvertible, imageDescriptionSize: number): number;

export declare function CMAudioFormatDescriptionCreateFromBigEndianSoundDescriptionData(allocator: interop.Object, soundDescriptionData: interop.PointerConvertible, size: number, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMAudioFormatDescriptionCreateFromBigEndianSoundDescriptionBlockBuffer(allocator: interop.Object, soundDescriptionBlockBuffer: interop.Object, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMAudioFormatDescriptionCopyAsBigEndianSoundDescriptionBlockBuffer(allocator: interop.Object, audioFormatDescription: interop.Object, flavor: interop.PointerConvertible, blockBufferOut: interop.PointerConvertible): number;

export declare function CMDoesBigEndianSoundDescriptionRequireLegacyCBRSampleTableLayout(soundDescriptionBlockBuffer: interop.Object, flavor: interop.PointerConvertible): number;

export declare function CMSwapBigEndianSoundDescriptionToHost(soundDescriptionData: interop.PointerConvertible, soundDescriptionSize: number): number;

export declare function CMSwapHostEndianSoundDescriptionToBig(soundDescriptionData: interop.PointerConvertible, soundDescriptionSize: number): number;

export declare function CMTextFormatDescriptionCreateFromBigEndianTextDescriptionData(allocator: interop.Object, textDescriptionData: interop.PointerConvertible, size: number, flavor: interop.PointerConvertible, mediaType: number, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMTextFormatDescriptionCreateFromBigEndianTextDescriptionBlockBuffer(allocator: interop.Object, textDescriptionBlockBuffer: interop.Object, flavor: interop.PointerConvertible, mediaType: number, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMTextFormatDescriptionCopyAsBigEndianTextDescriptionBlockBuffer(allocator: interop.Object, textFormatDescription: interop.Object, flavor: interop.PointerConvertible, blockBufferOut: interop.PointerConvertible): number;

export declare function CMSwapBigEndianTextDescriptionToHost(textDescriptionData: interop.PointerConvertible, textDescriptionSize: number): number;

export declare function CMSwapHostEndianTextDescriptionToBig(textDescriptionData: interop.PointerConvertible, textDescriptionSize: number): number;

export declare function CMClosedCaptionFormatDescriptionCreateFromBigEndianClosedCaptionDescriptionData(allocator: interop.Object, closedCaptionDescriptionData: interop.PointerConvertible, size: number, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMClosedCaptionFormatDescriptionCreateFromBigEndianClosedCaptionDescriptionBlockBuffer(allocator: interop.Object, closedCaptionDescriptionBlockBuffer: interop.Object, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMClosedCaptionFormatDescriptionCopyAsBigEndianClosedCaptionDescriptionBlockBuffer(allocator: interop.Object, closedCaptionFormatDescription: interop.Object, flavor: interop.PointerConvertible, blockBufferOut: interop.PointerConvertible): number;

export declare function CMSwapBigEndianClosedCaptionDescriptionToHost(closedCaptionDescriptionData: interop.PointerConvertible, closedCaptionDescriptionSize: number): number;

export declare function CMSwapHostEndianClosedCaptionDescriptionToBig(closedCaptionDescriptionData: interop.PointerConvertible, closedCaptionDescriptionSize: number): number;

export declare function CMTimeCodeFormatDescriptionCreateFromBigEndianTimeCodeDescriptionData(allocator: interop.Object, timeCodeDescriptionData: interop.PointerConvertible, size: number, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMTimeCodeFormatDescriptionCreateFromBigEndianTimeCodeDescriptionBlockBuffer(allocator: interop.Object, timeCodeDescriptionBlockBuffer: interop.Object, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMTimeCodeFormatDescriptionCopyAsBigEndianTimeCodeDescriptionBlockBuffer(allocator: interop.Object, timeCodeFormatDescription: interop.Object, flavor: interop.PointerConvertible, blockBufferOut: interop.PointerConvertible): number;

export declare function CMSwapBigEndianTimeCodeDescriptionToHost(timeCodeDescriptionData: interop.PointerConvertible, timeCodeDescriptionSize: number): number;

export declare function CMSwapHostEndianTimeCodeDescriptionToBig(timeCodeDescriptionData: interop.PointerConvertible, timeCodeDescriptionSize: number): number;

export declare function CMMetadataFormatDescriptionCreateFromBigEndianMetadataDescriptionData(allocator: interop.Object, metadataDescriptionData: interop.PointerConvertible, size: number, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMMetadataFormatDescriptionCreateFromBigEndianMetadataDescriptionBlockBuffer(allocator: interop.Object, metadataDescriptionBlockBuffer: interop.Object, flavor: interop.PointerConvertible, formatDescriptionOut: interop.PointerConvertible): number;

export declare function CMMetadataFormatDescriptionCopyAsBigEndianMetadataDescriptionBlockBuffer(allocator: interop.Object, metadataFormatDescription: interop.Object, flavor: interop.PointerConvertible, blockBufferOut: interop.PointerConvertible): number;

export declare function CMSwapBigEndianMetadataDescriptionToHost(metadataDescriptionData: interop.PointerConvertible, metadataDescriptionSize: number): number;

export declare function CMSwapHostEndianMetadataDescriptionToBig(metadataDescriptionData: interop.PointerConvertible, metadataDescriptionSize: number): number;

export declare function CMBufferQueueGetCallbacksForUnsortedSampleBuffers(): interop.Pointer;

export declare function CMBufferQueueGetCallbacksForSampleBuffersSortedByOutputPTS(): interop.Pointer;

export declare function CMBufferQueueCreate(allocator: interop.Object, capacity: number, callbacks: interop.PointerConvertible, queueOut: interop.PointerConvertible): number;

export declare function CMBufferQueueCreateWithHandlers(allocator: interop.Object, capacity: number, handlers: interop.PointerConvertible, queueOut: interop.PointerConvertible): number;

export declare function CMBufferQueueGetTypeID(): number;

export declare function CMBufferQueueEnqueue(queue: interop.Object, buf: interop.Object): number;

export declare function CMBufferQueueDequeueAndRetain(queue: interop.Object): interop.Object;

export declare function CMBufferQueueDequeueIfDataReadyAndRetain(queue: interop.Object): interop.Object;

export declare function CMBufferQueueGetHead(queue: interop.Object): interop.Object;

export declare function CMBufferQueueIsEmpty(queue: interop.Object): number;

export declare function CMBufferQueueMarkEndOfData(queue: interop.Object): number;

export declare function CMBufferQueueContainsEndOfData(queue: interop.Object): number;

export declare function CMBufferQueueIsAtEndOfData(queue: interop.Object): number;

export declare function CMBufferQueueReset(queue: interop.Object): number;

export declare function CMBufferQueueResetWithCallback(queue: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, refcon: interop.PointerConvertible): number;

export declare function CMBufferQueueGetBufferCount(queue: interop.Object): number;

export declare function CMBufferQueueGetDuration(queue: interop.Object): CMTime;

export declare function CMBufferQueueGetMinDecodeTimeStamp(queue: interop.Object): CMTime;

export declare function CMBufferQueueGetFirstDecodeTimeStamp(queue: interop.Object): CMTime;

export declare function CMBufferQueueGetMinPresentationTimeStamp(queue: interop.Object): CMTime;

export declare function CMBufferQueueGetFirstPresentationTimeStamp(queue: interop.Object): CMTime;

export declare function CMBufferQueueGetMaxPresentationTimeStamp(queue: interop.Object): CMTime;

export declare function CMBufferQueueGetEndPresentationTimeStamp(queue: interop.Object): CMTime;

export declare function CMBufferQueueGetTotalSize(queue: interop.Object): number;

export declare function CMBufferQueueInstallTrigger(queue: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, refcon: interop.PointerConvertible, condition: number, time: CMTime, triggerTokenOut: interop.PointerConvertible): number;

export declare function CMBufferQueueInstallTriggerWithIntegerThreshold(queue: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, refcon: interop.PointerConvertible, condition: number, threshold: number, triggerTokenOut: interop.PointerConvertible): number;

export declare function CMBufferQueueInstallTriggerHandler(queue: interop.Object, condition: number, time: CMTime, triggerTokenOut: interop.PointerConvertible, handler: (p1: interop.PointerConvertible) => void): number;

export declare function CMBufferQueueInstallTriggerHandlerWithIntegerThreshold(queue: interop.Object, condition: number, threshold: number, triggerTokenOut: interop.PointerConvertible, handler: (p1: interop.PointerConvertible) => void): number;

export declare function CMBufferQueueRemoveTrigger(queue: interop.Object, triggerToken: interop.PointerConvertible): number;

export declare function CMBufferQueueTestTrigger(queue: interop.Object, triggerToken: interop.PointerConvertible): number;

export declare function CMBufferQueueCallForEachBuffer(queue: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, refcon: interop.PointerConvertible): number;

export declare function CMBufferQueueSetValidationCallback(queue: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, refcon: interop.PointerConvertible): number;

export declare function CMBufferQueueSetValidationHandler(queue: interop.Object, handler: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): number;

export declare function CMSimpleQueueGetTypeID(): number;

export declare function CMSimpleQueueCreate(allocator: interop.Object, capacity: number, queueOut: interop.PointerConvertible): number;

export declare function CMSimpleQueueEnqueue(queue: interop.Object, element: interop.PointerConvertible): number;

export declare function CMSimpleQueueDequeue(queue: interop.Object): interop.Pointer;

export declare function CMSimpleQueueGetHead(queue: interop.Object): interop.Pointer;

export declare function CMSimpleQueueReset(queue: interop.Object): number;

export declare function CMSimpleQueueGetCapacity(queue: interop.Object): number;

export declare function CMSimpleQueueGetCount(queue: interop.Object): number;

export declare function CMMemoryPoolGetTypeID(): number;

export declare function CMMemoryPoolCreate(options: interop.Object): interop.Object;

export declare function CMMemoryPoolGetAllocator(pool: interop.Object): interop.Object;

export declare function CMMemoryPoolFlush(pool: interop.Object): void;

export declare function CMMemoryPoolInvalidate(pool: interop.Object): void;

export declare function CMMetadataCreateIdentifierForKeyAndKeySpace(allocator: interop.Object, key: interop.Object, keySpace: interop.Object, identifierOut: interop.PointerConvertible): number;

export declare function CMMetadataCreateKeyFromIdentifier(allocator: interop.Object, identifier: interop.Object, keyOut: interop.PointerConvertible): number;

export declare function CMMetadataCreateKeyFromIdentifierAsCFData(allocator: interop.Object, identifier: interop.Object, keyOut: interop.PointerConvertible): number;

export declare function CMMetadataCreateKeySpaceFromIdentifier(allocator: interop.Object, identifier: interop.Object, keySpaceOut: interop.PointerConvertible): number;

export declare function CMMetadataDataTypeRegistryRegisterDataType(dataType: interop.Object, description: interop.Object, conformingDataTypes: interop.Object): number;

export declare function CMMetadataDataTypeRegistryDataTypeIsRegistered(dataType: interop.Object): number;

export declare function CMMetadataDataTypeRegistryGetDataTypeDescription(dataType: interop.Object): interop.Object;

export declare function CMMetadataDataTypeRegistryGetConformingDataTypes(dataType: interop.Object): interop.Object;

export declare function CMMetadataDataTypeRegistryDataTypeConformsToDataType(dataType: interop.Object, conformsToDataType: interop.Object): number;

export declare function CMMetadataDataTypeRegistryGetBaseDataTypes(): interop.Object;

export declare function CMMetadataDataTypeRegistryDataTypeIsBaseDataType(dataType: interop.Object): number;

export declare function CMMetadataDataTypeRegistryGetBaseDataTypeForConformingDataType(dataType: interop.Object): interop.Object;

export declare function CMAudioDeviceClockCreate(allocator: interop.Object, deviceUID: interop.Object, clockOut: interop.PointerConvertible): number;

export declare function CMAudioDeviceClockCreateFromAudioDeviceID(allocator: interop.Object, deviceID: number, clockOut: interop.PointerConvertible): number;

export declare function CMAudioDeviceClockSetAudioDeviceUID(clock: interop.Object, deviceUID: interop.Object): number;

export declare function CMAudioDeviceClockSetAudioDeviceID(clock: interop.Object, deviceID: number): number;

export declare function CMAudioDeviceClockGetAudioDevice(clock: interop.Object, deviceUIDOut: interop.PointerConvertible, deviceIDOut: interop.PointerConvertible, trackingDefaultDeviceOut: interop.PointerConvertible): number;
