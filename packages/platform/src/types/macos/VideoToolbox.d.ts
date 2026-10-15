import type { CMTime, CMTimeRange } from './CoreMedia'

import type { interop } from './objc-runtime'



export declare const kVTVideoEncoderList_IsHardwareAccelerated: interop.Pointer;

export declare const kVTVideoEncoderList_InstanceLimit: interop.Pointer;

export declare const kVTVideoEncoderList_PerformanceRating: interop.Pointer;

export declare const kVTVideoEncoderList_SupportedSelectionProperties: interop.Pointer;

export declare const kVTVideoEncoderList_GPURegistryID: interop.Pointer;

export declare const kVTVideoEncoderList_DisplayName: interop.Pointer;

export declare const kVTVideoEncoderList_CodecType: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_RealTime: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_DestinationColorPrimaries: interop.Pointer;

export declare const kVTDownsamplingMode_Average: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_DestinationCleanAperture: interop.Pointer;

export declare const kVTScalingMode_Trim: interop.Pointer;

export declare const kVTScalingMode_Letterbox: interop.Pointer;

export declare const kVTScalingMode_CropSourceToCleanAperture: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_ScalingMode: interop.Pointer;

export declare const kVTDecompressionPropertyKey_PropagatePerFrameHDRDisplayMetadata: interop.Pointer;

export declare const kVTDecompressionPropertyKey_UsingGPURegistryID: interop.Pointer;

export declare const kVTVideoDecoderSpecification_RequiredDecoderGPURegistryID: interop.Pointer;

export declare const kVTDecompressionPropertyKey_SupportedPixelFormatsOrderedByQuality: interop.Pointer;

export declare const kVTDecompressionProperty_OnlyTheseFrames_KeyFrames: interop.Pointer;

export declare const kVTDecompressionProperty_OnlyTheseFrames_IFrames: interop.Pointer;

export declare const kVTDecompressionProperty_OnlyTheseFrames_NonDroppableFrames: interop.Pointer;

export declare const kVTDecompressionProperty_OnlyTheseFrames_AllFrames: interop.Pointer;

export declare const kVTDecompressionPropertyKey_ReducedFrameDelivery: interop.Pointer;

export declare const kVTDecompressionResolutionKey_Height: interop.Pointer;

export declare const kVTDecompressionResolutionKey_Width: interop.Pointer;

export declare const kVTDecompressionProperty_DeinterlaceMode_VerticalFilter: interop.Pointer;

export declare const kVTDecompressionPropertyKey_DeinterlaceMode: interop.Pointer;

export declare const kVTDecompressionProperty_FieldMode_DeinterlaceFields: interop.Pointer;

export declare const kVTDecompressionProperty_FieldMode_SingleField: interop.Pointer;

export declare const kVTDecompressionProperty_FieldMode_BothFields: interop.Pointer;

export declare const kVTDecompressionPropertyKey_ThreadCount: interop.Pointer;

export declare const kVTDecompressionPropertyKey_MaximizePowerEfficiency: interop.Pointer;

export declare const kVTDecompressionPropertyKey_RealTime: interop.Pointer;

export declare const kVTDecompressionPropertyKey_UsingHardwareAcceleratedVideoDecoder: interop.Pointer;

export declare const kVTVideoDecoderSpecification_RequireHardwareAcceleratedVideoDecoder: interop.Pointer;

export declare const kVTDecompressionPropertyKey_MaxOutputPresentationTimeStampOfFramesBeingDecoded: interop.Pointer;

export declare const kVTDecompressionPropertyKey_NumberOfFramesBeingDecoded: interop.Pointer;

export declare const kVTDecompressionPropertyKey_OutputPoolRequestedMinimumBufferCount: interop.Pointer;

export declare const kVTVideoEncoderList_EncoderName: interop.Pointer;

export declare const kVTDownsamplingMode_Decimate: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_DownsamplingMode: interop.Pointer;

export declare const kVTVideoDecoderSpecification_PreferredDecoderGPURegistryID: interop.Pointer;

export declare const kVTDecompressionPropertyKey_PixelBufferPoolIsShared: interop.Pointer;

export declare const kVTDecompressionPropertyKey_SuggestedQualityOfServiceTiers: interop.Pointer;

export declare const kVTCompressionPropertyKey_AllowFrameReordering: interop.Pointer;

export declare const kVTVideoEncoderSpecification_EncoderID: interop.Pointer;

export declare const kVTQPModulationLevel_Default: number;

export declare const kVTCompressionPropertyKey_EncoderID: interop.Pointer;

export declare const kVTCompressionPropertyKey_GammaLevel: interop.Pointer;

export declare const kVTCompressionPropertyKey_ContentLightLevelInfo: interop.Pointer;

export declare const kVTCompressionPropertyKey_ICCProfile: interop.Pointer;

export declare const kVTCompressionPropertyKey_FieldDetail: interop.Pointer;

export declare const kVTEncodeFrameOptionKey_ForceKeyFrame: interop.Pointer;

export declare const kVTCompressionPropertyKey_UsingGPURegistryID: interop.Pointer;

export declare const kVTVideoEncoderSpecification_RequiredEncoderGPURegistryID: interop.Pointer;

export declare const kVTCompressionPropertyKey_UsingHardwareAcceleratedVideoEncoder: interop.Pointer;

export declare const kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder: interop.Pointer;

export declare const kVTCompressionPropertyKey_BaseLayerFrameRate: interop.Pointer;

export declare const kVTCompressionPropertyKey_ExpectedDuration: interop.Pointer;

export declare const kVTCompressionPropertyKey_ExpectedFrameRate: interop.Pointer;

export declare const kVTCompressionPropertyKey_Depth: interop.Pointer;

export declare const kVTHDRMetadataInsertionMode_Auto: interop.Pointer;

export declare const kVTCompressionPropertyKey_HDRMetadataInsertionMode: interop.Pointer;

export declare const kVTProfileLevel_MP4V_AdvancedSimple_L4: interop.Pointer;

export declare const kVTProfileLevel_MP4V_AdvancedSimple_L1: interop.Pointer;

export declare const kVTProfileLevel_MP4V_Main_L3: interop.Pointer;

export declare const kVTProfileLevel_MP4V_Main_L2: interop.Pointer;

export declare const kVTProfileLevel_MP4V_Simple_L3: interop.Pointer;

export declare const kVTProfileLevel_MP4V_Simple_L1: interop.Pointer;

export declare const kVTProfileLevel_H264_High_5_2: interop.Pointer;

export declare const kVTProfileLevel_H264_High_5_1: interop.Pointer;

export declare const kVTProfileLevel_H264_High_4_1: interop.Pointer;

export declare const kVTProfileLevel_H264_High_3_1: interop.Pointer;

export declare const kVTProfileLevel_H264_Extended_AutoLevel: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_4_2: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_4_1: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_3_2: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_3_1: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_3_0: interop.Pointer;

export declare const kVTProfileLevel_H264_Baseline_5_2: interop.Pointer;

export declare const kVTProfileLevel_H264_Baseline_3_0: interop.Pointer;

export declare const kVTProfileLevel_HEVC_Monochrome10_AutoLevel: interop.Pointer;

export declare const kVTCompressionPropertyKey_PrioritizeEncodingSpeedOverQuality: interop.Pointer;

export declare const kVTCompressionPropertyKey_MoreFramesAfterEnd: interop.Pointer;

export declare const kVTCompressionPropertyKey_AverageBitRate: interop.Pointer;

export declare const kVTCompressionPropertyKey_AllowTemporalCompression: interop.Pointer;

export declare const kVTCompressionPropertyKey_VideoEncoderPixelBufferAttributes: interop.Pointer;

export declare const kVTCompressionPropertyKey_NumberOfPendingFrames: interop.Pointer;

export declare const kVTPropertySupportedValueListKey: interop.Pointer;

export declare const kVTPropertySupportedValueMaximumKey: interop.Pointer;

export declare const kVTPropertySupportedValueMinimumKey: interop.Pointer;

export declare const kVTPropertyReadWriteStatus_ReadWrite: interop.Pointer;

export declare const kVTPropertyReadWriteStatus_ReadOnly: interop.Pointer;

export declare const kVTPropertyType_Boolean: interop.Pointer;

export declare const kVTPropertyType_Enumeration: interop.Pointer;

export declare const kVTPropertyTypeKey: interop.Pointer;

export declare const kVTCouldNotFindExtensionErr: number;

export declare const kVTCouldNotOutputTaggedBufferGroupErr: number;

export declare const kVTVideoDecoderNeedsRosettaErr: number;

export declare const kVTCouldNotFindTemporalFilterErr: number;

export declare const kVTFrameSiloInvalidTimeStampErr: number;

export declare const kVTColorCorrectionPixelTransferFailedErr: number;

export declare const kVTVideoEncoderAuthorizationErr: number;

export declare const kVTColorSyncTransformConvertFailedErr: number;

export declare const kVTCouldNotCreateColorCorrectionDataErr: number;

export declare const kVTInsufficientSourceColorDataErr: number;

export declare const kVTVideoEncoderNotAvailableNowErr: number;

export declare const kVTPixelRotationNotSupportedErr: number;

export declare const kVTVideoEncoderMalfunctionErr: number;

export declare const kVTVideoDecoderBadDataErr: number;

export declare const kVTCouldNotCreateInstanceErr: number;

export declare const kVTPixelTransferNotSupportedErr: number;

export declare const kVTAllocationFailedErr: number;

export declare const kVTProfileLevel_H264_High_4_0: interop.Pointer;

export declare const kVTDecompressionProperty_FieldMode_BottomFieldOnly: interop.Pointer;

export declare const kVTVideoDecoderNotAvailableNowErr: number;

export declare const kVTDecompressionPropertyKey_SupportedPixelFormatsOrderedByPerformance: interop.Pointer;

export declare const kVTImageRotationNotSupportedErr: number;

export declare const kVTCompressionPropertyKey_FieldCount: interop.Pointer;

export declare const kVTProfileLevel_MP4V_Simple_L0: interop.Pointer;

export declare const kVTProfileLevel_H264_High_3_0: interop.Pointer;

export declare const kVTCompressionPropertyKey_SourceFrameCount: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_DestinationICCProfile: interop.Pointer;

export declare const kVTCompressionPropertyKey_AspectRatio16x9: interop.Pointer;

export declare const kVTProfileLevel_MP4V_AdvancedSimple_L0: interop.Pointer;

export declare const kVTCompressionPropertyKey_DataRateLimits: interop.Pointer;

export declare const kVTVideoDecoderRemovedErr: number;

export declare const kVTCompressionPropertyKey_PixelBufferPoolIsShared: interop.Pointer;

export declare const kVTUnlimitedFrameDelayCount: number;

export declare const kVTVideoEncoderList_SupportsFrameReordering: interop.Pointer;

export declare const kVTCompressionPropertyKey_MaxKeyFrameInterval: interop.Pointer;

export declare const kVTDecompressionPropertyKey_OnlyTheseFrames: interop.Pointer;

export declare const kVTProfileLevel_H264_Baseline_5_1: interop.Pointer;

export declare const kVTDecompressionPropertyKey_PixelBufferPool: interop.Pointer;

export declare const kVTCompressionPropertyKey_PixelTransferProperties: interop.Pointer;

export declare const kVTProfileLevel_H264_Extended_5_0: interop.Pointer;

export declare const kVTVideoEncoderAutoWhiteBalanceNotLockedErr: number;

export declare const kVTProfileLevel_H264_High_5_0: interop.Pointer;

export declare const kVTProfileLevel_MP4V_AdvancedSimple_L3: interop.Pointer;

export declare const kVTProfileLevel_H264_High_AutoLevel: interop.Pointer;

export declare const kVTProfileLevel_HEVC_Main_AutoLevel: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_AutoLevel: interop.Pointer;

export declare const kVTCompressionPropertyKey_MaxKeyFrameIntervalDuration: interop.Pointer;

export declare const kVTVideoEncoderSpecification_EnableHardwareAcceleratedVideoEncoder: interop.Pointer;

export declare const kVTPropertyNotSupportedErr: number;

export declare const kVTProfileLevel_H264_Main_4_0: interop.Pointer;

export declare const kVTVideoDecoderSpecification_EnableHardwareAcceleratedVideoDecoder: interop.Pointer;

export declare const kVTCompressionPropertyKey_Quality: interop.Pointer;

export declare const kVTLogTransferFunctionMismatchErr: number;

export declare const kVTCompressionPropertyKey_TransferFunction: interop.Pointer;

export declare const kVTProfileLevel_MP4V_AdvancedSimple_L2: interop.Pointer;

export declare const kVTProfileLevel_H263_Profile0_Level45: interop.Pointer;

export declare const kVTFormatDescriptionChangeNotSupportedErr: number;

export declare const kVTProfileLevel_H264_Main_5_0: interop.Pointer;

export declare const kVTProfileLevel_H264_Baseline_AutoLevel: interop.Pointer;

export declare const kVTCompressionPropertyKey_ProgressiveScan: interop.Pointer;

export declare const kVTProfileLevel_H264_Baseline_3_1: interop.Pointer;

export declare const kVTProfileLevel_HEVC_Monochrome_AutoLevel: interop.Pointer;

export declare const kVTCompressionPropertyKey_MoreFramesBeforeStart: interop.Pointer;

export declare const kVTMultiPassStorageInvalidErr: number;

export declare const kVTDecompressionPropertyKey_MinOutputPresentationTimeStampOfFramesBeingDecoded: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_5_2: interop.Pointer;

export declare const kVTExtensionDisabledErr: number;

export declare const kVTCompressionPropertyKey_RealTime: interop.Pointer;

export declare const kVTMultiPassStorageCreationOption_DoNotDelete: interop.Pointer;

export declare const kVTProfileLevel_H264_Baseline_4_0: interop.Pointer;

export declare const kVTCompressionPropertyKey_AlphaChannelMode: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_DestinationPixelAspectRatio: interop.Pointer;

export declare const kVTSessionMalfunctionErr: number;

export declare const kVTVideoEncoderSpecification_PreferredEncoderGPURegistryID: interop.Pointer;

export declare const kVTCompressionPropertyKey_YCbCrMatrix: interop.Pointer;

export declare const kVTCompressionPropertyKey_MaxFrameDelayCount: interop.Pointer;

export declare const kVTCouldNotFindVideoEncoderErr: number;

export declare const kVTProfileLevel_H264_High_3_2: interop.Pointer;

export declare const kVTVideoDecoderMalfunctionErr: number;

export declare const kVTDecompressionPropertyKey_ContentHasInterframeDependencies: interop.Pointer;

export declare const kVTCompressionPropertyKey_ProfileLevel: interop.Pointer;

export declare const kVTCompressionPropertyKey_PreserveDynamicHDRMetadata: interop.Pointer;

export declare const kVTVideoDecoderUnsupportedDataFormatErr: number;

export declare const kVTCompressionPropertyKey_MaximizePowerEfficiency: interop.Pointer;

export declare const kVTCompressionPropertyKey_AllowOpenGOP: interop.Pointer;

export declare const kVTParameterErr: number;

export declare const kVTScalingMode_Normal: interop.Pointer;

export declare const kVTMultiPassStorageIdentifierMismatchErr: number;

export declare const kVTProfileLevel_H264_Baseline_3_2: interop.Pointer;

export declare const kVTVideoDecoderAuthorizationErr: number;

export declare const kVTHDRMetadataInsertionMode_None: interop.Pointer;

export declare const kVTDecompressionPropertyKey_FieldMode: interop.Pointer;

export declare const kVTH264EntropyMode_CABAC: interop.Pointer;

export declare const kVTProfileLevel_MP4V_Main_L4: interop.Pointer;

export declare const kVTVideoEncoderList_QualityRating: interop.Pointer;

export declare const kVTProfileLevel_HEVC_Main10_AutoLevel: interop.Pointer;

export declare const kVTCompressionPropertyKey_MasteringDisplayColorVolume: interop.Pointer;

export declare const kVTProfileLevel_H264_Baseline_4_1: interop.Pointer;

export declare const kVTVideoEncoderMVHEVCVideoLayerIDsMismatchErr: number;

export declare const kVTCompressionPropertyKey_H264EntropyMode: interop.Pointer;

export declare const kVTVideoEncoderList_EncoderID: interop.Pointer;

export declare const kVTCompressionPropertyKey_TargetQualityForAlpha: interop.Pointer;

export declare const kVTDecompressionPropertyKey_PixelTransferProperties: interop.Pointer;

export declare const kVTCouldNotFindVideoDecoderErr: number;

export declare const kVTProfileLevel_H264_High_4_2: interop.Pointer;

export declare const kVTDecompressionPropertyKey_PixelFormatsWithReducedResolutionSupport: interop.Pointer;

export declare const kVTAlphaChannelMode_PremultipliedAlpha: interop.Pointer;

export declare const kVTAlphaChannelMode_StraightAlpha: interop.Pointer;

export declare const kVTCompressionPropertyKey_CleanAperture: interop.Pointer;

export declare const kVTColorCorrectionImageRotationFailedErr: number;

export declare const kVTDecompressionProperty_DeinterlaceMode_Temporal: interop.Pointer;

export declare const kVTPropertyShouldBeSerializedKey: interop.Pointer;

export declare const kVTInvalidSessionErr: number;

export declare const kVTPropertyType_Number: interop.Pointer;

export declare const kVTPropertyDocumentationKey: interop.Pointer;

export declare const kVTPropertyReadWriteStatusKey: interop.Pointer;

export declare const kVTVideoDecoderReferenceMissingErr: number;

export declare const kVTProfileLevel_H263_Profile3_Level45: interop.Pointer;

export declare const kVTVideoDecoderCallbackMessagingErr: number;

export declare const kVTProfileLevel_H264_Baseline_1_3: interop.Pointer;

export declare const kVTVideoEncoderNeedsRosettaErr: number;

export declare const kVTProfileLevel_H264_Baseline_5_0: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_DestinationTransferFunction: interop.Pointer;

export declare const kVTVideoDecoderUnknownErr: number;

export declare const kVTVideoEncoderList_CodecName: interop.Pointer;

export declare const kVTCompressionPropertyKey_PixelAspectRatio: interop.Pointer;

export declare const kVTPropertyReadOnlyErr: number;

export declare const kVTQPModulationLevel_Disable: number;

export declare const kVTProfileLevel_H264_Baseline_4_2: interop.Pointer;

export declare const kVTDecompressionPropertyKey_ReducedCoefficientDecode: interop.Pointer;

export declare const kVTPixelTransferPropertyKey_DestinationYCbCrMatrix: interop.Pointer;

export declare const kVTDecompressionPropertyKey_ReducedResolutionDecode: interop.Pointer;

export declare const kVTProfileLevel_H263_Profile0_Level10: interop.Pointer;

export declare const kVTPixelTransferNotPermittedErr: number;

export declare const kVTCompressionPropertyKey_ColorPrimaries: interop.Pointer;

export declare const kVTCompressionPropertyKey_MaxH264SliceBytes: interop.Pointer;

export declare const kVTExtensionConflictErr: number;

export declare const kVTDecompressionProperty_TemporalLevelLimit: interop.Pointer;

export declare const kVTProfileLevel_H264_Main_5_1: interop.Pointer;

export declare const kVTH264EntropyMode_CAVLC: interop.Pointer;

export declare const kVTDecompressionProperty_FieldMode_TopFieldOnly: interop.Pointer;

export declare const kVTCompressionPropertyKey_MultiPassStorage: interop.Pointer;

export declare const kVTFrameSiloInvalidTimeRangeErr: number;

export declare const kVTProfileLevel_MP4V_Simple_L2: interop.Pointer;

export declare const VTSuperResolutionScalerParametersSubmissionMode: {
  Random: 1,
  Sequential: 2,
};

export declare const VTSuperResolutionScalerConfigurationInputType: {
  Video: 1,
  Image: 2,
};

export declare const VTSuperResolutionScalerConfigurationRevision: {
  VTSuperResolutionScalerConfigurationRevision1: 1,
};

export declare const VTOpticalFlowConfigurationRevision: {
  VTOpticalFlowConfigurationRevision1: 1,
};

export declare const VTFrameRateConversionConfigurationRevision: {
  VTFrameRateConversionConfigurationRevision1: 1,
};

export declare const VTMotionEstimationFrameFlags: {
  kVTMotionEstimationFrameFlags_CurrentBufferWillBeNextReferenceBuffer: 1,
};

export declare const VTMotionBlurParametersSubmissionMode: {
  Random: 1,
  Sequential: 2,
};

export declare const VTFrameRateConversionParametersSubmissionMode: {
  Random: 1,
  Sequential: 2,
  SequentialReferencesUnchanged: 3,
};

export declare const VTFrameProcessorError: {
  UnknownError: -19730,
  UnsupportedResolution: -19731,
  SessionNotStarted: -19732,
  SessionAlreadyActive: -19733,
  FatalError: -19734,
  SessionLevelError: -19735,
  InitializationFailed: -19736,
  UnsupportedInput: -19737,
  MemoryAllocationFailure: -19738,
  RevisionNotSupported: -19739,
  ProcessingError: -19740,
  InvalidParameterError: -19741,
  InvalidFrameTiming: -19742,
  AssetDownloadFailed: -19743,
};

export declare const VTEncodeInfoFlags: {
  Asynchronous: 1,
  FrameDropped: 2,
};

export declare const VTDecodeInfoFlags: {
  Asynchronous: 1,
  FrameDropped: 2,
  ImageBufferModifiable: 4,
  SkippedLeadingFrameDropped: 8,
  FrameInterrupted: 16,
};

export declare const VTDecodeFrameFlags: {
  Frame_EnableAsynchronousDecompression: 1,
  Frame_DoNotOutputFrame: 2,
  Frame_1xRealTimePlayback: 4,
  Frame_EnableTemporalProcessing: 8,
};

export declare const VTMotionBlurConfigurationRevision: {
  VTMotionBlurConfigurationRevision1: 1,
};

export declare const VTCompressionSessionOptionFlags: {
  kVTCompressionSessionBeginFinalPass: 1,
};

export declare const VTOpticalFlowConfigurationQualityPrioritization: {
  Normal: 1,
  Quality: 2,
};

export declare const VTFrameRateConversionConfigurationQualityPrioritization: {
  Normal: 1,
  Quality: 2,
};

export declare const VTSuperResolutionScalerConfigurationQualityPrioritization: {
  VTSuperResolutionScalerConfigurationQualityPrioritizationNormal: 1,
};

export declare const VTMotionEstimationInfoFlags: {
  kVTMotionEstimationInfoFlags_Reserved0: 1,
};

export declare const VTMotionBlurConfigurationQualityPrioritization: {
  Normal: 1,
  Quality: 2,
};

export declare const VTOpticalFlowParametersSubmissionMode: {
  Random: 1,
  Sequential: 2,
};

export declare const VTSuperResolutionScalerConfigurationModelStatus: {
  DownloadRequired: 0,
  Downloading: 1,
  Ready: 2,
};

export declare class OpaqueVTMotionEstimationSession {
  constructor(init?: OpaqueVTMotionEstimationSession);
}

export declare class OpaqueVTHDRPerFrameMetadataGenerationSession {
  constructor(init?: OpaqueVTHDRPerFrameMetadataGenerationSession);
}

export declare class OpaqueVTMultiPassStorage {
  constructor(init?: OpaqueVTMultiPassStorage);
}

export declare class OpaqueVTFrameSilo {
  constructor(init?: OpaqueVTFrameSilo);
}

export declare class OpaqueVTDecompressionSession {
  constructor(init?: OpaqueVTDecompressionSession);
}

export declare class VTDecompressionOutputCallbackRecord {
  constructor(init?: VTDecompressionOutputCallbackRecord);
  decompressionOutputCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.Enum<typeof VTDecodeInfoFlags>, p5: interop.PointerConvertible, p6: CMTime, p7: CMTime) => void | null;
  decompressionOutputRefCon: interop.Pointer;
}

export declare class OpaqueVTRAWProcessingSession {
  constructor(init?: OpaqueVTRAWProcessingSession);
}

export declare class OpaqueVTCompressionSession {
  constructor(init?: OpaqueVTCompressionSession);
}

export declare class OpaqueVTPixelTransferSession {
  constructor(init?: OpaqueVTPixelTransferSession);
}

export declare class VTInt32Size {
  constructor(init?: VTInt32Size);
  width: number;
  height: number;
}

export declare class VTInt32Point {
  constructor(init?: VTInt32Point);
  x: number;
  y: number;
}

export declare class OpaqueVTPixelRotationSession {
  constructor(init?: OpaqueVTPixelRotationSession);
}

export declare function VTSessionCopySupportedPropertyDictionary(session: interop.Object, supportedPropertyDictionaryOut: interop.PointerConvertible): number;

export declare function VTSessionSetProperty(session: interop.Object, propertyKey: interop.Object, propertyValue: interop.Object): number;

export declare function VTSessionCopyProperty(session: interop.Object, propertyKey: interop.Object, allocator: interop.Object, propertyValueOut: interop.PointerConvertible): number;

export declare function VTSessionSetProperties(session: interop.Object, propertyDictionary: interop.Object): number;

export declare function VTSessionCopySerializableProperties(session: interop.Object, allocator: interop.Object, dictionaryOut: interop.PointerConvertible): number;

export declare function VTCompressionSessionCreate(allocator: interop.Object, width: number, height: number, codecType: number, encoderSpecification: interop.Object, sourceImageBufferAttributes: interop.Object, compressedDataAllocator: interop.Object, outputCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.Enum<typeof VTEncodeInfoFlags>, p5: interop.PointerConvertible) => void, outputCallbackRefCon: interop.PointerConvertible, compressionSessionOut: interop.PointerConvertible): number;

export declare function VTCompressionSessionInvalidate(session: interop.Object): void;

export declare function VTCompressionSessionGetTypeID(): number;

export declare function VTCompressionSessionGetPixelBufferPool(session: interop.Object): interop.Object;

export declare function VTCompressionSessionPrepareToEncodeFrames(session: interop.Object): number;

export declare function VTCompressionSessionEncodeFrame(session: interop.Object, imageBuffer: interop.Object, presentationTimeStamp: CMTime, duration: CMTime, frameProperties: interop.Object, sourceFrameRefcon: interop.PointerConvertible, infoFlagsOut: interop.PointerConvertible): number;

export declare function VTCompressionSessionEncodeFrameWithOutputHandler(session: interop.Object, imageBuffer: interop.Object, presentationTimeStamp: CMTime, duration: CMTime, frameProperties: interop.Object, infoFlagsOut: interop.PointerConvertible, outputHandler: (p1: number, p2: interop.Enum<typeof VTEncodeInfoFlags>, p3: interop.PointerConvertible) => void): number;

export declare function VTCompressionSessionCompleteFrames(session: interop.Object, completeUntilPresentationTimeStamp: CMTime): number;

export declare function VTCompressionSessionBeginPass(session: interop.Object, beginPassFlags: interop.Enum<typeof VTCompressionSessionOptionFlags>, reserved: interop.PointerConvertible): number;

export declare function VTCompressionSessionEndPass(session: interop.Object, furtherPassesRequestedOut: interop.PointerConvertible, reserved: interop.PointerConvertible): number;

export declare function VTCompressionSessionGetTimeRangesForNextPass(session: interop.Object, timeRangeCountOut: interop.PointerConvertible, timeRangeArrayOut: interop.PointerConvertible): number;

export declare function VTDecompressionSessionCreate(allocator: interop.Object, videoFormatDescription: interop.Object, videoDecoderSpecification: interop.Object, destinationImageBufferAttributes: interop.Object, outputCallback: interop.PointerConvertible, decompressionSessionOut: interop.PointerConvertible): number;

export declare function VTDecompressionSessionInvalidate(session: interop.Object): void;

export declare function VTDecompressionSessionGetTypeID(): number;

export declare function VTDecompressionSessionDecodeFrame(session: interop.Object, sampleBuffer: interop.Object, decodeFlags: interop.Enum<typeof VTDecodeFrameFlags>, sourceFrameRefCon: interop.PointerConvertible, infoFlagsOut: interop.PointerConvertible): number;

export declare function VTDecompressionSessionDecodeFrameWithOutputHandler(session: interop.Object, sampleBuffer: interop.Object, decodeFlags: interop.Enum<typeof VTDecodeFrameFlags>, infoFlagsOut: interop.PointerConvertible, outputHandler: (p1: number, p2: interop.Enum<typeof VTDecodeInfoFlags>, p3: interop.PointerConvertible, p4: CMTime, p5: CMTime) => void): number;

export declare function VTDecompressionSessionFinishDelayedFrames(session: interop.Object): number;

export declare function VTDecompressionSessionCanAcceptFormatDescription(session: interop.Object, newFormatDesc: interop.Object): number;

export declare function VTDecompressionSessionWaitForAsynchronousFrames(session: interop.Object): number;

export declare function VTDecompressionSessionCopyBlackPixelBuffer(session: interop.Object, pixelBufferOut: interop.PointerConvertible): number;

export declare function VTIsHardwareDecodeSupported(codecType: number): number;

export declare function VTPixelTransferSessionCreate(allocator: interop.Object, pixelTransferSessionOut: interop.PointerConvertible): number;

export declare function VTPixelTransferSessionInvalidate(session: interop.Object): void;

export declare function VTPixelTransferSessionGetTypeID(): number;

export declare function VTPixelTransferSessionTransferImage(session: interop.Object, sourceBuffer: interop.Object, destinationBuffer: interop.Object): number;

export declare function VTCopyVideoEncoderList(options: interop.Object, listOfVideoEncodersOut: interop.PointerConvertible): number;

export declare function VTCopySupportedPropertyDictionaryForEncoder(width: number, height: number, codecType: number, encoderSpecification: interop.Object, encoderIDOut: interop.PointerConvertible, supportedPropertiesOut: interop.PointerConvertible): number;

export declare function VTFrameSiloGetTypeID(): number;

export declare function VTFrameSiloCreate(allocator: interop.Object, fileURL: interop.Object, timeRange: CMTimeRange, options: interop.Object, frameSiloOut: interop.PointerConvertible): number;

export declare function VTFrameSiloAddSampleBuffer(silo: interop.Object, sampleBuffer: interop.Object): number;

export declare function VTFrameSiloSetTimeRangesForNextPass(silo: interop.Object, timeRangeCount: number, timeRangeArray: interop.PointerConvertible): number;

export declare function VTFrameSiloGetProgressOfCurrentPass(silo: interop.Object, progressOut: interop.PointerConvertible): number;

export declare function VTFrameSiloCallFunctionForEachSampleBuffer(silo: interop.Object, timeRange: CMTimeRange, refcon: interop.PointerConvertible, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): number;

export declare function VTFrameSiloCallBlockForEachSampleBuffer(silo: interop.Object, timeRange: CMTimeRange, handler: (p1: interop.PointerConvertible) => number): number;

export declare function VTMultiPassStorageGetTypeID(): number;

export declare function VTMultiPassStorageCreate(allocator: interop.Object, fileURL: interop.Object, timeRange: CMTimeRange, options: interop.Object, multiPassStorageOut: interop.PointerConvertible): number;

export declare function VTMultiPassStorageClose(multiPassStorage: interop.Object): number;

export declare function VTCreateCGImageFromCVPixelBuffer(pixelBuffer: interop.Object, options: interop.Object, imageOut: interop.PointerConvertible): number;

export declare function VTRegisterSupplementalVideoDecoderIfAvailable(codecType: number): void;

export declare function VTRegisterProfessionalVideoWorkflowVideoDecoders(): void;

export declare function VTRegisterProfessionalVideoWorkflowVideoEncoders(): void;
