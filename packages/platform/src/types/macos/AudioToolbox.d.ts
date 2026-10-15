import type { AVAudioFormat } from './AVFAudio'

import type { NSImage, NSView, NSViewController } from './AppKit'

import type { AUAudioUnitViewConfiguration } from './CoreAudioKit'

import type { AudioClassDescription, AudioStreamBasicDescription, AudioTimeStamp, SMPTETime } from './CoreAudioTypes'

import type { CGSize } from './CoreFoundation'

import type { MIDICIProfile, MIDICIProfileState } from './CoreMIDI'

import type { NSArray, NSCoder, NSDictionary, NSError, NSExtensionRequestHandling, NSFastEnumeration, NSIndexSet, NSSecureCoding } from './Foundation'

import type { OS_os_workgroup } from './Runtime'

import type { interop } from './objc-runtime'

import { MIDIProtocolID } from './CoreMIDI'

import { NSKeyValueObservingOptions } from './Foundation'

import { NSObject, os_clockid_t } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const kAudioUnitCarbonViewRange: number;

export declare const kAudioUnitCarbonViewEvent_MouseDownInControl: number;

export declare const kAUCarbonViewSubType_Generic: number;

export declare const kAudioSessionProperty_AudioRoute: number;

export declare const kAudioSessionCategory_UserInterfaceSoundEffects: number;

export declare const kAudioSessionSetActiveFlag_NotifyOthersOnDeactivation: number;

export declare const kAudioSessionProperty_AudioRouteDescription: number;

export declare const kAudioSessionProperty_InputGainAvailable: number;

export declare const kAudioSessionProperty_OutputDestination: number;

export declare const kAudioSessionProperty_InputSource: number;

export declare const kAudioSessionProperty_OutputDestinations: number;

export declare const kAudioSessionProperty_InputSources: number;

export declare const kAudioSessionProperty_Mode: number;

export declare const kAudioSessionProperty_OverrideCategoryEnableBluetoothInput: number;

export declare const kAudioSessionProperty_OtherMixableAudioShouldDuck: number;

export declare const kAudioSessionProperty_OverrideAudioRoute: number;

export declare const kAudioSessionProperty_OtherAudioIsPlaying: number;

export declare const kAudioSessionProperty_CurrentHardwareOutputLatency: number;

export declare const kAudioSessionProperty_CurrentHardwareInputLatency: number;

export declare const kAudioSessionProperty_CurrentHardwareOutputNumberChannels: number;

export declare const kAudioSessionProperty_CurrentHardwareInputNumberChannels: number;

export declare const kAudioSessionProperty_AudioRouteChange: number;

export declare const kAudioSessionProperty_AudioCategory: number;

export declare const kAudioSessionProperty_PreferredHardwareSampleRate: number;

export declare const kAudioSessionMode_GameChat: number;

export declare const kAudioSessionMode_Measurement: number;

export declare const kAudioSessionMode_VideoRecording: number;

export declare const kAudioSessionRouteChangeReason_RouteConfigurationChange: number;

export declare const kAudioSessionRouteChangeReason_WakeFromSleep: number;

export declare const kAudioSessionRouteChangeReason_Override: number;

export declare const kAudioSessionRouteChangeReason_CategoryChange: number;

export declare const kAudioSessionRouteChangeReason_OldDeviceUnavailable: number;

export declare const kAudioSessionRouteChangeReason_NewDeviceAvailable: number;

export declare const kAudioSessionOverrideAudioRoute_Speaker: number;

export declare const kAudioSessionOverrideAudioRoute_None: number;

export declare const kAudioSessionCategory_PlayAndRecord: number;

export declare const kAudioSessionCategory_RecordAudio: number;

export declare const kAudioSessionCategory_MediaPlayback: number;

export declare const kAudioSessionCategory_AmbientSound: number;

export declare const kAudioSessionEndInterruption: number;

export declare const kAudioSessionBeginInterruption: number;

export declare const kAudioSessionIncompatibleCategory: number;

export declare const kAudioSessionNoCategorySet: number;

export declare const kAudioServicesNoHardwareError: number;

export declare const kAudioSessionUnsupportedPropertyError: number;

export declare const kAudioSessionInitializationError: number;

export declare const kAudioSessionAlreadyInitialized: number;

export declare const kAudioSessionNotInitialized: number;

export declare const kAudioSessionNoError: number;

export declare const kCAClock_CannotSetTimeError: number;

export declare const kCAClock_InvalidPlayRateError: number;

export declare const kCAClock_InvalidTimebaseSourceError: number;

export declare const kCAClock_InvalidTimebaseError: number;

export declare const kCAClock_InvalidSyncModeError: number;

export declare const kCAClock_InvalidPropertySizeError: number;

export declare const kCAClock_UnknownPropertyError: number;

export declare const kAudioFileGetUserDataAtOffsetSelect: number;

export declare const kAudioFileGetUserDataSize64Select: number;

export declare const kAudioFileReadPacketDataSelect: number;

export declare const kAudioFileOpenURLSelect: number;

export declare const kAudioFileCreateURLSelect: number;

export declare const kAudioFileRemoveUserDataSelect: number;

export declare const kAudioFileGetUserDataSizeSelect: number;

export declare const kAudioFileGetGlobalInfoSelect: number;

export declare const kAudioFileGetGlobalInfoSizeSelect: number;

export declare const kAudioFileExtensionIsThisFormatSelect: number;

export declare const kAudioFileSetPropertySelect: number;

export declare const kAudioFileGetPropertyInfoSelect: number;

export declare const kAudioFileReadBytesSelect: number;

export declare const kAudioFileOptimizeSelect: number;

export declare const kAudioFileCloseSelect: number;

export declare const kAudioFileInitializeWithCallbacksSelect: number;

export declare const kAudioFileOpenWithCallbacksSelect: number;

export declare const kAudioFileOpenSelect: number;

export declare const kAudioFileCreateSelect: number;

export declare const kAudioFileComponent_FastDispatchTable: number;

export declare const kAudioFileComponent_AvailableStreamDescriptionsForFormat: number;

export declare const kAudioFileComponent_AvailableFormatIDs: number;

export declare const kAudioFileComponent_ExtensionsForType: number;

export declare const kAudioFileComponent_FileTypeName: number;

export declare const kAudioFileComponent_CanRead: number;

export declare const kMusicEventType_ExtendedControl: number;

export declare const kSequenceTrackProperty_AutomatedParameters: number;

export declare const kSequenceTrackProperty_MuteStatus: number;

export declare const kSequenceTrackProperty_OffsetTime: number;

export declare const kSequenceTrackProperty_LoopInfo: number;

export declare const kAudioToolboxErr_CannotDoInCurrentContext: number;

export declare const kAudioToolboxErr_InvalidEventType: number;

export declare const kAudioToolboxErr_StartOfTrack: number;

export declare const kAudioToolboxErr_InvalidSequenceType: number;

export declare const kMusicEventType_AUPreset: number;

export declare const kMusicEventType_Parameter: number;

export declare const kMusicEventType_MIDIChannelMessage: number;

export declare const kMusicEventType_Meta: number;

export declare const kMusicEventType_User: number;

export declare const kExtAudioFileError_AsyncWriteBufferOverflow: number;

export declare const kExtAudioFileError_AsyncWriteTooLarge: number;

export declare const kExtAudioFileError_InvalidSeek: number;

export declare const kExtAudioFileError_MaxPacketSizeUnknown: number;

export declare const kExtAudioFileError_InvalidOperationOrder: number;

export declare const kExtAudioFileError_InvalidChannelMap: number;

export declare const kExtAudioFileError_NonPCMClientFormat: number;

export declare const kExtAudioFileError_InvalidProperty: number;

export declare const kExtAudioFileProperty_PacketTable: number;

export declare const kExtAudioFileProperty_IOBufferSizeBytes: number;

export declare const kExtAudioFileProperty_AudioFile: number;

export declare const kExtAudioFileProperty_AudioConverter: number;

export declare const kExtAudioFileProperty_ClientChannelLayout: number;

export declare const kExtAudioFileProperty_ClientDataFormat: number;

export declare const kExtAudioFileProperty_FileDataFormat: number;

export declare const kExtAudioFilePacketTableInfoOverride_UseFileValueIfValid: number;

export declare const kCAF_SMPTE_TimeType50: number;

export declare const kCAF_SMPTE_TimeType5994Drop: number;

export declare const kCAF_SMPTE_TimeType60Drop: number;

export declare const kCAF_SMPTE_TimeType60: number;

export declare const kCAF_SMPTE_TimeType2997Drop: number;

export declare const kCAFMarkerType_TimeSignature: number;

export declare const kCAFMarkerType_SavedPlayPosition: number;

export declare const kCAFMarkerType_ReleaseLoopEnd: number;

export declare const kCAFMarkerType_ReleaseLoopStart: number;

export declare const kCAFMarkerType_SustainLoopEnd: number;

export declare const kCAFMarkerType_SustainLoopStart: number;

export declare const kCAFMarkerType_EditDestinationBegin: number;

export declare const kCAFMarkerType_EditSourceEnd: number;

export declare const kCAFMarkerType_EditSourceBegin: number;

export declare const kCAFMarkerType_SelectionEnd: number;

export declare const kCAFMarkerType_RegionSyncPoint: number;

export declare const kCAFMarkerType_RegionStart: number;

export declare const kCAFMarkerType_Index: number;

export declare const kCAFMarkerType_TrackEnd: number;

export declare const kCAFMarkerType_ProgramEnd: number;

export declare const kCAFMarkerType_ProgramStart: number;

export declare const kCAFMarkerType_Generic: number;

export declare const kCAF_iXMLChunkID: number;

export declare const kCAF_FormatListID: number;

export declare const kCAF_OverviewChunkID: number;

export declare const kCAF_PeakChunkID: number;

export declare const kCAF_UUIDChunkID: number;

export declare const kCAF_StringsChunkID: number;

export declare const kCAF_InfoStringsChunkID: number;

export declare const kCAF_MagicCookieID: number;

export declare const kCAF_InstrumentChunkID: number;

export declare const kCAF_MarkerChunkID: number;

export declare const kCAF_AudioDataChunkID: number;

export declare const kCAF_StreamDescriptionChunkID: number;

export declare const kAudioServicesPropertyCompletePlaybackIfAppDies: number;

export declare const kAudioServicesPropertyIsUISound: number;

export declare const kSystemSoundID_Vibrate: number;

export declare const kSystemSoundID_FlashScreen: number;

export declare const kSystemSoundID_UserPreferredAlert: number;

export declare const kAudioServicesSystemSoundExceededMaximumDurationError: number;

export declare const kAudioServicesSystemSoundClientTimedOutError: number;

export declare const kAudioServicesBadSpecifierSizeError: number;

export declare const kAudioServicesNoError: number;

export declare const kAudioHardwareServiceDeviceProperty_VirtualMasterBalance: number;

export declare const kAudioUnitSubType_Reverb2: number;

export declare const kMultibandFilter_Bandwidth2: number;

export declare const kAUNetStatus_Overflow: number;

export declare const kAudioUnitProcessMultipleSelect: number;

export declare const kAudioCodecUnspecifiedError: number;

export declare const kAudioQueueParam_PlayRate: number;

export declare const kAudioQueueTimePitchAlgorithm_Varispeed: number;

export declare const kAudioQueueTimePitchAlgorithm_TimeDomain: number;

export declare const kAudioQueueProperty_TimePitchBypass: number;

export declare const kAudioQueueProperty_TimePitchAlgorithm: number;

export declare const kAudioQueueProperty_EnableTimePitch: number;

export declare const kAudioQueueProperty_CurrentLevelMeter: number;

export declare const kAudioQueueProperty_ChannelLayout: number;

export declare const kAudioQueueProperty_StreamDescription: number;

export declare const kAudioQueueProperty_MaximumOutputPacketSize: number;

export declare const kAudioQueueProperty_CurrentDevice: number;

export declare const kAudioQueueErr_BufferEnqueuedTwice: number;

export declare const kAudioQueueErr_QueueInvalidated: number;

export declare const kAudioQueueErr_CodecNotFound: number;

export declare const kAudioQueueErr_PrimeTimedOut: number;

export declare const kAudioQueueErr_Permissions: number;

export declare const kAudioQueueErr_InvalidRunState: number;

export declare const kAudioQueueErr_InvalidPropertySize: number;

export declare const kAudioQueueErr_DisposalPending: number;

export declare const kAudioFormatUnsupportedDataFormatError: number;

export declare const kAudioFormatProperty_ID3TagSize: number;

export declare const kAudioFormatProperty_BalanceFade: number;

export declare const kAudioFormatProperty_ChannelName: number;

export declare const kAudioFormatProperty_ValidateChannelLayout: number;

export declare const kAudioFormatProperty_AreChannelLayoutsEquivalent: number;

export declare const kAudioFormatProperty_ChannelMap: number;

export declare const kAudioFormatProperty_MatrixMixMap: number;

export declare const kAudioFormatProperty_AvailableDecodeNumberChannels: number;

export declare const kAudioFormatProperty_Encoders: number;

export declare const kAudioFormatProperty_FormatIsVBR: number;

export declare const kAudioFormatProperty_ChannelLayoutFromESDS: number;

export declare const kAudioFileStreamProperty_BitRate: number;

export declare const kAUGroupParameterID_Expression: number;

export declare const kAudioFileStreamProperty_AverageBytesPerPacket: number;

export declare const kAudioFileStreamProperty_PacketSizeUpperBound: number;

export declare const kAudioFileStreamProperty_PacketTableInfo: number;

export declare const kAudioFileStreamProperty_ByteToPacket: number;

export declare const kAudioFileStreamProperty_PacketToByte: number;

export declare const kAudioFileStreamProperty_PreviousIndependentPacket: number;

export declare const kAudioFileStreamProperty_FrameToPacket: number;

export declare const kAudioFileStreamProperty_PacketToFrame: number;

export declare const kAudioFileStreamProperty_ChannelLayout: number;

export declare const kAudioFileStreamProperty_MagicCookieData: number;

export declare const kAudioFileStreamProperty_DataFormat: number;

export declare const kAudioFileStreamError_ValueUnknown: number;

export declare const kExtAudioFileProperty_FileLengthFrames: number;

export declare const kAudioFileStreamError_InvalidFile: number;

export declare const kAudioFileStreamError_NotOptimized: number;

export declare const kAudioFileStreamError_UnsupportedProperty: number;

export declare const kAudioFileGlobalInfo_TypesForHFSTypeCode: number;

export declare const kAudioFileGlobalInfo_ExtensionsForType: number;

export declare const kAudioFileGlobalInfo_AllMIMETypes: number;

export declare const kAudioFileGlobalInfo_AllUTIs: number;

export declare const kAudioFileGlobalInfo_AllHFSTypeCodes: number;

export declare const kAudioFileGlobalInfo_AllExtensions: number;

export declare const kAudioFileGlobalInfo_AvailableFormatIDs: number;

export declare const kAudioFileGlobalInfo_ReadableTypes: number;

export declare const kAudioFilePropertyUseAudioTrack: number;

export declare const kAudioFilePropertyPacketRangeByteCountUpperBound: number;

export declare const kAudioFilePropertyFormatList: number;

export declare const kAudioFilePropertyInfoDictionary: number;

export declare const kAudioFilePropertyPacketToByte: number;

export declare const kReverbParam_ModulationRate: number;

export declare const kAudioFilePropertyNextIndependentPacket: number;

export declare const kAudioFilePropertyMarkerList: number;

export declare const kAudioFilePropertyDataFormatName: number;

export declare const kAudioFilePropertyDataOffset: number;

export declare const kAudioFilePropertyAudioDataByteCount: number;

export declare const kAudioFilePropertyIsOptimized: number;

export declare const kAudioFileMarkerType_Generic: number;

export declare const kAudioFileLoopDirection_Forward: number;

export declare const kAudioFileLoopDirection_NoLooping: number;

export declare const kAudioFileFileNotFoundError: number;

export declare const kAudioFilePositionError: number;

export declare const kAudioFileEndOfFileError: number;

export declare const kAudioFilePermissionsError: number;

export declare const kAudioFileBadPropertySizeError: number;

export declare const kAudioFileUnsupportedPropertyError: number;

export declare const kAudioFileUnsupportedFileTypeError: number;

export declare const kAudioFileUnspecifiedError: number;

export declare const kAudioFileAMRType: number;

export declare const kAudioFile3GP2Type: number;

export declare const kAudioFileStreamProperty_FileFormat: number;

export declare const kAudioFileCAFType: number;

export declare const kAudioFileM4AType: number;

export declare const kAudioFileAAC_ADTSType: number;

export declare const kAudioFileRF64Type: number;

export declare const kAudioFileAIFFType: number;

export declare const kAudioConverterPropertyMaximumInputBufferSize: number;

export declare const kAudioConverterErr_RequiresPacketDescriptionsError: number;

export declare const kAudioConverterErr_InputSampleRateOutOfRange: number;

export declare const kAudioConverterErr_UnspecifiedError: number;

export declare const kAudioConverterErr_InvalidInputSize: number;

export declare const kAudioConverterErr_PropertyNotSupported: number;

export declare const kConverterPrimeMethod_Normal: number;

export declare const kAudioConverterSampleRateConverterComplexity_Mastering: number;

export declare const kAudioConverterSampleRateConverterComplexity_Normal: number;

export declare const kAudioConverterSampleRateConverterComplexity_Linear: number;

export declare const kAudioUnitProperty_InputAnchorTimeStamp: number;

export declare const kAudioConverterQuality_Max: number;

export declare const kAudioConverterPropertyChannelMixMap: number;

export declare const kAudioConverterPropertySettings: number;

export declare const kAudioConverterInputChannelLayout: number;

export declare const kAudioConverterCompressionMagicCookie: number;

export declare const kAudioConverterChannelMap: number;

export declare const kAudioConverterPrimeMethod: number;

export declare const kAudioConverterSampleRateConverterInitialPhase: number;

export declare const kAudioConverterPropertyInputCodecParameters: number;

export declare const kAudioConverterPropertyCalculateInputBufferSize: number;

export declare const kAudioConverterPropertyMinimumOutputBufferSize: number;

export declare const kAudioConverterPropertyMinimumInputBufferSize: number;

export declare const kAUGraphErr_CannotDoInCurrentContext: number;

export declare const kAUGraphErr_OutputNodeErr: number;

export declare const kMusicDeviceStartNoteSelect: number;

export declare const kMusicDevicePrepareInstrumentSelect: number;

export declare const kMusicNoteEvent_Unused: number;

export declare const kReverb2Param_MinDelayTime: number;

export declare const kReverb2Param_Gain: number;

export declare const kReverb2Param_DryWetMix: number;

export declare const kRandomParam_Curve: number;

export declare const kMusicDeviceParam_Tuning: number;

export declare const kAUNetStatus_Listening: number;

export declare const kAUNetStatus_Connecting: number;

export declare const kAUNetStatus_Connected: number;

export declare const kStereoMixerParam_PreAveragePower: number;

export declare const kRogerBeepParam_RogerType: number;

export declare const kRogerBeepParam_OutGateThresholdTime: number;

export declare const kRogerBeepParam_InGateThresholdTime: number;

export declare const kMultibandFilter_HighFilterType: number;

export declare const kMultibandFilter_Bandwidth3: number;

export declare const kMultibandFilter_CenterGain3: number;

export declare const kMultibandFilter_CenterFreq3: number;

export declare const kMultibandFilter_CenterFreq2: number;

export declare const kMultibandFilter_LowFrequency: number;

export declare const kMultibandCompressorParam_OutputAmplitude3: number;

export declare const kMultibandCompressorParam_InputAmplitude4: number;

export declare const kMultibandCompressorParam_InputAmplitude1: number;

export declare const kMultibandCompressorParam_CompressionAmount1: number;

export declare const kMultibandCompressorParam_EQ4: number;

export declare const kMultibandCompressorParam_EQ3: number;

export declare const kMultibandCompressorParam_ReleaseTime: number;

export declare const kMultibandCompressorParam_Headroom3: number;

export declare const kMultibandCompressorParam_Headroom1: number;

export declare const kMultibandCompressorParam_Threshold4: number;

export declare const kMultibandCompressorParam_Threshold1: number;

export declare const kReverbParam_SmallDelayRange: number;

export declare const kReverbParam_SmallDensity: number;

export declare const kRoundTripAACParam_CompressedFormatSampleRate: number;

export declare const kRoundTripAACParam_RateOrQuality: number;

export declare const kRoundTripAACParam_EncodingStrategy: number;

export declare const kAUNBandEQFilterType_LowShelf: number;

export declare const kAUNBandEQFilterType_BandStop: number;

export declare const kAUNBandEQFilterType_ResonantHighPass: number;

export declare const kAUNBandEQFilterType_2ndOrderButterworthHighPass: number;

export declare const kAUNBandEQParam_Bandwidth: number;

export declare const kAUNBandEQParam_Frequency: number;

export declare const kAUNBandEQParam_FilterType: number;

export declare const kDelayParam_LopassCutoff: number;

export declare const kDistortionParam_FinalMix: number;

export declare const kDistortionParam_SoftClipGain: number;

export declare const kDistortionParam_RingModMix: number;

export declare const kDistortionParam_RingModFreq2: number;

export declare const kDistortionParam_PolynomialMix: number;

export declare const kDistortionParam_CubicTerm: number;

export declare const kDistortionParam_SquaredTerm: number;

export declare const kDistortionParam_DelayMix: number;

export declare const kVarispeedParam_PlaybackCents: number;

export declare const kDynamicsProcessorParam_CompressionAmount: number;

export declare const kDynamicsProcessorParam_OverallGain: number;

export declare const kDynamicsProcessorParam_ReleaseTime: number;

export declare const kDynamicsProcessorParam_AttackTime: number;

export declare const kDynamicsProcessorParam_HeadRoom: number;

export declare const kDynamicsProcessorParam_Threshold: number;

export declare const kLimiterParam_PreGain: number;

export declare const kLimiterParam_AttackTime: number;

export declare const kParametricEQParam_Q: number;

export declare const kAudioCodecBitRateFormat: number;

export declare const kAULowShelfParam_CutoffFrequency: number;

export declare const kHighShelfParam_Gain: number;

export declare const kHighShelfParam_CutOffFrequency: number;

export declare const kHipassParam_Resonance: number;

export declare const kHipassParam_CutoffFrequency: number;

export declare const kBandpassParam_Bandwidth: number;

export declare const kLowPassParam_Resonance: number;

export declare const kBandpassParam_CenterFrequency: number;

export declare const kNewTimePitchParam_EnableTransientPreservation: number;

export declare const kNewTimePitchParam_Overlap: number;

export declare const kNewTimePitchParam_Smoothness: number;

export declare const kNewTimePitchParam_Pitch: number;

export declare const kMatrixMixerParam_PrePeakHoldLevelLinear: number;

export declare const kMatrixMixerParam_PreAveragePowerLinear: number;

export declare const kMatrixMixerParam_PostPeakHoldLevel: number;

export declare const kMultiChannelMixerParam_PostAveragePower: number;

export declare const kMultiChannelMixerParam_PreAveragePower: number;

export declare const k3DMixerParam_PostAveragePower: number;

export declare const k3DMixerParam_PreAveragePower: number;

export declare const k3DMixerParam_MaxGain: number;

export declare const k3DMixerParam_MinGain: number;

export declare const k3DMixerParam_GlobalReverbGain: number;

export declare const k3DMixerParam_ObstructionAttenuationInDecibels: number;

export declare const k3DMixerParam_OcclusionAttenuationInDecibels: number;

export declare const k3DMixerParam_Gain: number;

export declare const k3DMixerParam_Distance: number;

export declare const k3DMixerParam_Elevation: number;

export declare const kReverbParam_FilterBandwidth: number;

export declare const kSpatialMixerParam_HeadYaw: number;

export declare const kSpatialMixerParam_ReverbBlend: number;

export declare const kMultibandCompressorParam_EQ1: number;

export declare const kAudioFormatProperty_ChannelLayoutForBitmap: number;

export declare const kSpatialMixerParam_MaxGain: number;

export declare const kSpatialMixerParam_PlaybackRate: number;

export declare const kSpatialMixerParam_Elevation: number;

export declare const kPannerParam_CoordScale: number;

export declare const kAUGroupParameterID_KeyPressure_LastKey: number;

export declare const kAUGroupParameterID_DataEntry_LSB: number;

export declare const kAUGroupParameterID_Expression_LSB: number;

export declare const kAUGroupParameterID_DataEntry: number;

export declare const kRoundTripAACParam_BitRate: number;

export declare const kAUGroupParameterID_KeyPressure: number;

export declare const kAUGroupParameterID_Foot: number;

export declare const kAUGroupParameterID_ResetAllControllers: number;

export declare const kAUGroupParameterID_Volume: number;

export declare const kAudioUnitProperty_DeferredRendererPullSize: number;

export declare const kSpeakerConfiguration_Stereo: number;

export declare const kMusicDeviceProperty_SoundBankFSSpec: number;

export declare const kAudioOfflineUnitProperty_OutputSize: number;

export declare const kAudioUnitParameterFlag_HasName: number;

export declare const kAudioUnitParameterFlag_Group: number;

export declare const kAudioUnitParameterFlag_Input: number;

export declare const kAUNetSendPresetFormat_AAC_LD_32kbpspc: number;

export declare const kAUNetSendPresetFormat_AAC_LD_48kbpspc: number;

export declare const kAUNetSendPresetFormat_AAC_40kbpspc: number;

export declare const kAUNetSendPresetFormat_AAC_64kbpspc: number;

export declare const kAUNetSendPresetFormat_AAC_128kbpspc: number;

export declare const kAUNetSendPresetFormat_IMA4: number;

export declare const kAUNetSendPresetFormat_PCMFloat32: number;

export declare const kAUNetSendProperty_Disconnect: number;

export declare const kAUNetSendProperty_PortNum: number;

export declare const kAudioUnitProperty_DeferredRendererWaitFrames: number;

export declare const kAudioUnitProperty_DeferredRendererExtraLatency: number;

export declare const kInstrumentType_EXS24: number;

export declare const kInstrumentType_DLSPreset: number;

export declare const kMusicDeviceProperty_InstrumentCount: number;

export declare const kMusicDeviceProperty_InstrumentName: number;

export declare const kMusicDeviceProperty_SoundBankFSRef: number;

export declare const kMusicDeviceProperty_SoundBankData: number;

export declare const kAudioUnitProperty_ScheduledFileBufferSizeFrames: number;

export declare const kAudioUnitProperty_ScheduledFilePrime: number;

export declare const kReverbParam_FilterGain: number;

export declare const kAudioUnitProperty_ScheduledFileIDs: number;

export declare const kAudioUnitProperty_CurrentPlayTime: number;

export declare const kAudioUnitProperty_DopplerShift: number;

export declare const kAudioUnitProperty_3DMixerDistanceParams: number;

export declare const kAudioUnitProperty_SpatialMixerOutputType: number;

export declare const kAudioUnitProperty_SpatialMixerSourceMode: number;

export declare const kAudioUnitProperty_SpatializationAlgorithm: number;

export declare const kAudioUnitProperty_ReverbRoomType: number;

export declare const kAudioUnitProperty_MatrixDimensions: number;

export declare const kAUNBandEQProperty_BiquadCoefficients: number;

export declare const kAUNBandEQProperty_NumberOfBands: number;

export declare const kAUVoiceIOProperty_VoiceProcessingEnableAGC: number;

export declare const kAudioOutputUnitProperty_NodeComponentDescription: number;

export declare const kAudioOutputUnitProperty_HostTransportState: number;

export declare const kCAF_FillerChunkID: number;

export declare const kAudioOutputUnitProperty_HostReceivesRemoteControlEvents: number;

export declare const kAudioOutputUnitProperty_OSWorkgroup: number;

export declare const kAudioOutputUnitProperty_StartTime: number;

export declare const kAudioOutputUnitProperty_EnableIO: number;

export declare const kSampleDelayParam_DelayFrames: number;

export declare const kAudioOutputUnitProperty_CurrentDevice: number;

export declare const kAudioUnitSampleRateConverterComplexity_Linear: number;

export declare const kOtherPluginFormat_AU: number;

export declare const kAudioCodecQuality_High: number;

export declare const kOtherPluginFormat_kVST: number;

export declare const kAudioUnitMigrateProperty_OldAutomation: number;

export declare const kAudioUnitMigrateProperty_FromPlugin: number;

export declare const kAudioUnitProperty_DistanceAttenuationData: number;

export declare const kOfflinePreflight_Optional: number;

export declare const kAudioUnitOfflineProperty_PreflightRequirements: number;

export declare const kAudioUnitOfflineProperty_OutputSize: number;

export declare const kMusicDeviceProperty_DualSchedulingMode: number;

export declare const kMusicDeviceProperty_MIDIXMLNames: number;

export declare const kAudioUnitProperty_AddParameterMIDIMapping: number;

export declare const kAudioUnitProperty_AllParameterMIDIMappings: number;

export declare const kRenderQuality_Medium: number;

export declare const kAudioUnitProperty_AudioUnitMIDIProtocol: number;

export declare const kAudioUnitProperty_AUHostIdentifier: number;

export declare const kAudioUnitProperty_GetUIComponentList: number;

export declare const kAudioUnitProperty_PresentationLatency: number;

export declare const kAudioUnitProperty_ContextName: number;

export declare const kAudioUnitProperty_ParameterValueFromString: number;

export declare const kAudioUnitProperty_OfflineRender: number;

export declare const kAudioUnitProperty_NickName: number;

export declare const kAudioUnitProperty_FrequencyResponse: number;

export declare const kAudioUnitProperty_InputSamplesInOutput: number;

export declare const kAudioUnitProperty_DependentParameters: number;

export declare const kAudioUnitProperty_PresentPreset: number;

export declare const kAudioUnitProperty_RenderQuality: number;

export declare const kAudioUnitProperty_FactoryPresets: number;

export declare const kAudioUnitProperty_SetRenderCallback: number;

export declare const kAudioUnitProperty_LastRenderError: number;

export declare const kAudioUnitProperty_BypassEffect: number;

export declare const kAudioUnitProperty_TailTime: number;

export declare const kAudioUnitProperty_AudioChannelLayout: number;

export declare const kAudioUnitProperty_SupportedNumChannels: number;

export declare const kAudioFilePropertyDeferSizeUpdates: number;

export declare const kAudioUnitProperty_StreamFormat: number;

export declare const kAudioUnitProperty_ParameterInfo: number;

export declare const kAudioUnitProperty_ParameterList: number;

export declare const kAudioUnitProperty_MakeConnection: number;

export declare const kAudioUnitScope_Note: number;

export declare const kAudioUnitScope_Global: number;

export declare const kAudioUnitRenderSelect: number;

export declare const kAudioUnitRemoveRenderNotifySelect: number;

export declare const kAudioUnitRemovePropertyListenerWithUserDataSelect: number;

export declare const kAudioUnitAddPropertyListenerSelect: number;

export declare const kAudioUnitSetPropertySelect: number;

export declare const kAudioUnitErr_RenderTimeout: number;

export declare const kAudioComponentErr_InstanceInvalidated: number;

export declare const kAudioUnitErr_Unauthorized: number;

export declare const kAudioUnitErr_InvalidOfflineRender: number;

export declare const kAudioUnitErr_PropertyNotInUse: number;

export declare const kAudioUnitErr_InvalidPropertyValue: number;

export declare const kAudioUnitErr_CannotDoInCurrentContext: number;

export declare const kAudioUnitErr_FileNotSpecified: number;

export declare const kAudioUnitErr_InvalidElement: number;

export declare const kAudioUnitErr_InvalidProperty: number;

export declare const kAudioUnitSubType_AudioFilePlayer: number;

export declare const kAudioUnitSubType_VectorPanner: number;

export declare const kAudioUnitSubType_SphericalHeadPanner: number;

export declare const kAudioUnitSubType_AUFilter: number;

export declare const kAudioUnitSubType_Pitch: number;

export declare const kAudioUnitSubType_Delay: number;

export declare const kAudioUnitSubType_ParametricEQ: number;

export declare const kAudioUnitSubType_HighPassFilter: number;

export declare const kAudioUnitSubType_LowPassFilter: number;

export declare const kAudioUnitSubType_DynamicsProcessor: number;

export declare const kAudioUnitSubType_TimePitch: number;

export declare const kAudioUnitSubType_AUiPodTimeOther: number;

export declare const kAudioUnitSubType_NewTimePitch: number;

export declare const kAudioUnitSubType_Merger: number;

export declare const kAudioUnitSubType_MultiSplitter: number;

export declare const kAudioUnitSubType_Varispeed: number;

export declare const kAudioUnitSubType_AUConverter: number;

export declare const kAudioUnitSubType_MIDISynth: number;

export declare const kAudioUnitSubType_Sampler: number;

export declare const kAudioUnitSubType_DLSSynth: number;

export declare const kAudioUnitSubType_HALOutput: number;

export declare const kAudioUnitSubType_VoiceProcessingIO: number;

export declare const kAudioUnitSubType_GenericOutput: number;

export declare const kAudioUnitManufacturer_Apple: number;

export declare const kAudioUnitType_RemoteMusicEffect: number;

export declare const kAudioUnitType_MIDIProcessor: number;

export declare const kAudioUnitType_Generator: number;

export declare const kAudioUnitType_Mixer: number;

export declare const kAudioUnitType_Effect: number;

export declare const kAudioUnitType_FormatConverter: number;

export declare const kAudioUnitType_MusicEffect: number;

export declare const kHintAdvanced: number;

export declare const kAudioCodecOutputPrecedenceSampleRate: number;

export declare const kAudioCodecOutputPrecedenceBitRate: number;

export declare const kAudioCodecOutputPrecedenceNone: number;

export declare const kAudioCodecBitRateFormat_VBR: number;

export declare const kAudioCodecBitRateFormat_CBR: number;

export declare const kAudioCodecPropertyAvailableInputChannelLayouts: number;

export declare const kAudioCodecPropertyOutputChannelLayout: number;

export declare const kAudioCodecPropertyInputChannelLayout: number;

export declare const kAudioCodecOutputFormatsForInputFormat: number;

export declare const kAudioCodecDoesSampleRateConversion: number;

export declare const kAudioCodecPropertyRequiresPacketDescription: number;

export declare const kAudioCodecPropertyManufacturerCFString: number;

export declare const kAudioCodecPropertyNameCFString: number;

export declare const kAudioCodecPropertyMinimumDelayMode: number;

export declare const kAudioCodecBadDataError: number;

export declare const kAudioCodecBadPropertySizeError: number;

export declare const kAudioCodecUnknownPropertyError: number;

export declare const kAudioCodecProduceOutputDataSelect: number;

export declare const kAudioCodecAppendInputDataSelect: number;

export declare const kAudioCodecInitializeSelect: number;

export declare const kAudioCodecProduceOutputPacketSuccessConcealed: number;

export declare const kAudioCodecProduceOutputPacketAtEOF: number;

export declare const kAudioCodecProduceOutputPacketNeedsMoreInputData: number;

export declare const kMultibandFilter_CenterGain1: number;

export declare const kAudioCodecContentSource_AV_Spatial_Live: number;

export declare const kAudioCodecContentSource_AV_Spatial_Offline: number;

export declare const kAudioCodecContentSource_Capture_Spatial: number;

export declare const kAudioCodecContentSource_Capture_Traditional: number;

export declare const kAudioCodecContentSource_AppleAV_Traditional_Offline: number;

export declare const kAudioCodecContentSource_AppleMusic_Spatial: number;

export declare const kAudioCodecContentSource_AppleMusic_Traditional: number;

export declare const kRenderQuality_High: number;

export declare const kAudioCodecContentSource_AppleCapture_Spatial: number;

export declare const kAudioCodecDynamicRangeControlConfiguration_Capture: number;

export declare const kAudioCodecDynamicRangeControlConfiguration_Movie: number;

export declare const kAudioFileSoundDesigner2Type: number;

export declare const kAudioCodecDynamicRangeControlConfiguration_Speech: number;

export declare const kAudioCodecDynamicRangeControlConfiguration_Music: number;

export declare const kAudioFormatProperty_FormatList: number;

export declare const kAudioCodecDynamicRangeControlConfiguration_None: number;

export declare const kDynamicRangeCompressionProfile_GeneralCompression: number;

export declare const kDynamicRangeCompressionProfile_NoisyEnvironment: number;

export declare const kAudioCodecPropertyFormatCFString: number;

export declare const kDynamicRangeCompressionProfile_LateNight: number;

export declare const kDynamicRangeControlMode_Heavy: number;

export declare const kDynamicRangeControlMode_None: number;

export declare const kProgramTargetLevel_Minus20dB: number;

export declare const kProgramTargetLevel_Minus23dB: number;

export declare const kProgramTargetLevel_Minus31dB: number;

export declare const kAudioCodecDelayMode_Minimum: number;

export declare const kAudioCodecDelayMode_Compatibility: number;

export declare const kAudioCodecBitRateControlMode_VariableConstrained: number;

export declare const kDitherAlgorithm_NoiseShaping: number;

export declare const kAudioCodecQuality_Low: number;

export declare const kAudioFileNextType: number;

export declare const kAudioCodecQuality_Max: number;

export declare const kAudioCodecPropertyASPFrequency: number;

export declare const kAudioCodecPropertyDynamicRangeControlMode: number;

export declare const kAudioCodecPropertyAdjustLocalQuality: number;

export declare const kAudioCodecPropertySoundQualityForVBR: number;

export declare const kAudioCodecPropertyBitRateControlMode: number;

export declare const kAudioCodecPropertySettings: number;

export declare const kAudioCodecPropertyCurrentOutputChannelLayout: number;

export declare const kAudioCodecPropertyCurrentInputChannelLayout: number;

export declare const kAudioCodecPropertyPrimeInfo: number;

export declare const kAudioCodecPropertyPrimeMethod: number;

export declare const kAudioCodecPropertyPaddedZeros: number;

export declare const kAudioCodecPropertyApplicableOutputSampleRates: number;

export declare const kAudioCodecPropertyApplicableInputSampleRates: number;

export declare const kAudioCodecPropertyQualitySetting: number;

export declare const kAudioCodecPropertyEmploysDependentPackets: number;

export declare const kAudioCodecPropertyHasVariablePacketByteSizes: number;

export declare const kAudioCodecPropertyInputBufferSize: number;

export declare const kAudioCodecPropertyFormatInfo: number;

export declare const kAudioCodecPropertyInputFormatsForOutputFormat: number;

export declare const kAudioCodecPropertyAvailableInputChannelLayoutTags: number;

export declare const kAudioCodecPropertyDoesSampleRateConversion: number;

export declare const kAudioCodecPropertyAvailableNumberChannels: number;

export declare const kAudioCodecPropertyAvailableBitRateRange: number;

export declare const kAudioCodecPropertyAvailableOutputSampleRates: number;

export declare const kAudioCodecPropertySupportedOutputFormats: number;

export declare const kAudioUnitOfflineProperty_StartOffset: number;

export declare const kMusicDeviceProperty_SoundBankURL: number;

export declare const kAudioFileInvalidPacketOffsetError: number;

export declare const kSpatialMixerParam_Enable: number;

export declare const kAudioUnitProperty_ParameterClumpName: number;

export declare const kAudioFileCountUserDataSelect: number;

export declare const kTimePitchParam_Rate: number;

export declare const kAudioFilePropertyFrameToPacket: number;

export declare const kAudioFileFileDataIsThisFormatSelect: number;

export declare const kAudioComponentRegistrationsChangedNotification: interop.Pointer;

export declare const kAudioOutputUnitProperty_HasIO: number;

export declare const kAUNBandEQParam_BypassBand: number;

export declare const kSpatialMixerParam_MinGain: number;

export declare const kAUMIDISynthProperty_EnablePreload: number;

export declare const kPannerParam_Elevation: number;

export declare const kAudioFormatUnknownFormatError: number;

export declare const kAudioUnitSRCAlgorithm_Polyphase: number;

export declare const kCAF_SMPTE_TimeType24: number;

export declare const kAUNBandEQProperty_MaxNumberOfBands: number;

export declare const kAudioFormatProperty_TagForChannelLayout: number;

export declare const kAudioUnitSubType_DeferredRenderer: number;

export declare const kAudioCodecContentSource_AppleCapture_Traditional: number;

export declare const kAudioFileInvalidPacketDependencyError: number;

export declare const kAudioHardwareServiceProperty_ServiceRestarted: number;

export declare const kAudioFormatProperty_FormatIsExternallyFramed: number;

export declare const kAudioComponentInstanceInvalidationNotification: interop.Pointer;

export declare const kAudioFileGlobalInfo_WritableTypes: number;

export declare const kReverb2Param_DecayTimeAt0Hz: number;

export declare const kAudioCodecPropertyAvailableOutputChannelLayouts: number;

export declare const kAudioConverterErr_BadPropertySizeError: number;

export declare const kMusicEventType_MIDINoteMessage: number;

export declare const kAudioFileSetUserDataSelect: number;

export declare const kAudioSessionProperty_OverrideCategoryMixWithOthers: number;

export declare const kAudioUnitProperty_SupportedChannelLayoutTags: number;

export declare const kAudioUnitType_Output: number;

export declare const kAudioUnitSubType_MatrixReverb: number;

export declare const kAudioFilePropertyPacketToFrame: number;

export declare const kAudioCodecPropertySupportedInputFormats: number;

export declare const kAudioConverterPropertyMaximumOutputPacketSize: number;

export declare const kUserPreferredAlert: number;

export declare const kAudioCodecPrimeMethod_None: number;

export declare const kAudioUnitScope_Layer: number;

export declare const kAudioUnitProperty_ElementName: number;

export declare const kAudioUnitSubType_NetSend: number;

export declare const kMultibandCompressorParam_CompressionAmount2: number;

export declare const kAudioFormatProperty_EncodeFormatIDs: number;

export declare const kAudioUnitType_Panner: number;

export declare const kAudioCodecPropertyAdjustTargetLevelConstant: number;

export declare const kRoundTripAACParam_Format: number;

export declare const kDistortionParam_RingModBalance: number;

export declare const kAudioSessionProperty_InputGainScalar: number;

export declare const kSpatialMixerParam_HeadRoll: number;

export declare const kMultibandCompressorParam_EQ2: number;

export declare const kAudioConverterCodecQuality: number;

export declare const kAudioUnitInitializeSelect: number;

export declare const kAUNetSendPresetFormat_Lossless16: number;

export declare const kAudioCodecPrimeMethod_Pre: number;

export declare const kAudioFormatProperty_AvailableEncodeBitRates: number;

export declare const kAudioQueueErr_TooManyTaps: number;

export declare const kAudioCodecContentSource_Passthrough: number;

export declare const kAudioCodecStateError: number;

export declare const kAudioCodecPropertyContentSource: number;

export declare const kAudioSessionRouteChangeReason_Unknown: number;

export declare const kAUSamplerParam_Gain: number;

export declare const kMultibandCompressorParam_OutputAmplitude2: number;

export declare const kAudioCodecPropertyApplicableBitRateRange: number;

export declare const kHintHidden: number;

export declare const kAUParameterListener_AnyParameter: number;

export declare const kAudioDecoderComponentType: number;

export declare const kDynamicsProcessorParam_InputAmplitude: number;

export declare const kMultibandCompressorParam_CompressionAmount3: number;

export declare const kReverb2Param_RandomizeReflections: number;

export declare const kAudioUnitParameterFlag_Global: number;

export declare const kAudioCodecPropertyAvailableBitRates: number;

export declare const kAudioComponentErr_InvalidFormat: number;

export declare const kAUSampler_DefaultMelodicBankMSB: number;

export declare const kAUNodeInteraction_InputCallback: number;

export declare const kAudioUnitProperty_ScheduledFileRegion: number;

export declare const kAudioCodecContentSource_Unspecified: number;

export declare const kAudioCodecPropertyCurrentInputFormat: number;

export declare const kTimePitchParam_EffectBlend: number;

export declare const kAudioUnitErr_MIDIOutputBufferFull: number;

export declare const kAudioUnitSubType_SystemOutput: number;

export declare const kAUGroupParameterID_KeyPressure_FirstKey: number;

export declare const kAudioFileInvalidChunkError: number;

export declare const kMultiChannelMixerParam_PostPeakHoldLevel: number;

export declare const kMatrixMixerParam_Enable: number;

export declare const kAudioQueueErr_InvalidParameter: number;

export declare const kAudioUnitProperty_3DMixerDistanceAtten: number;

export declare const kAUNetSendPresetFormat_AAC_LD_40kbpspc: number;

export declare const kAudioFormatBadPropertySizeError: number;

export declare const kAudioUnitProperty_MeterClipping: number;

export declare const kAudioQueueProperty_DecodeBufferSizeFrames: number;

export declare const kAudioUnitSubType_SoundFieldPanner: number;

export declare const kAudioCodecContentSource_Capture_Spatial_Enhanced: number;

export declare const kAudioUnitProperty_MIDIOutputCallback: number;

export declare const kAUNBandEQParam_Gain: number;

export declare const kAudioUnitErr_InvalidFilePath: number;

export declare const kAUGroupParameterID_Pan_LSB: number;

export declare const kAudioCodecPropertyProgramTargetLevel: number;

export declare const kAudioCodecPropertyProgramTargetLevelConstant: number;

export declare const kMusicEventType_ExtendedTempo: number;

export declare const kAudioComponentErr_NotPermitted: number;

export declare const kAUNBandEQFilterType_ResonantHighShelf: number;

export declare const k3DMixerParam_GlobalReverbGainInDecibels: number;

export declare const kAudioConverterErr_InvalidOutputSize: number;

export declare const k3DMixerParam_MaxGainInDecibels: number;

export declare const kMultibandCompressorParam_Crossover2: number;

export declare const kMatrixMixerParam_Volume: number;

export declare const kMusicDeviceParam_Volume: number;

export declare const kAudioUnitClumpID_System: number;

export declare const kReverbParam_SmallSize: number;

export declare const kAudioUnitProperty_ReverbPreset: number;

export declare const k3DMixerParam_MinGainInDecibels: number;

export declare const kAudioUnitSubType_Distortion: number;

export declare const kDynamicRangeCompressionProfile_LimitedPlaybackRange: number;

export declare const kAudioCodecPropertyMagicCookie: number;

export declare const kMusicDeviceSampleFrameMask_SampleOffset: number;

export declare const kAudioCodecPropertyPacketFrameSize: number;

export declare const kAudioCodecPropertyAdjustTargetLevel: number;

export declare const kAudioUnitErr_InvalidParameterValue: number;

export declare const kAudioConverterCurrentInputStreamDescription: number;

export declare const kAudioUnitProperty_SpatialMixerDistanceParams: number;

export declare const kAudioComponentErr_TooManyInstances: number;

export declare const kDistortionParam_Decimation: number;

export declare const kLowPassParam_CutoffFrequency: number;

export declare const kAudioUnitCarbonViewCreateSelect: number;

export declare const kAudioUnitProperty_HostCallbacks: number;

export declare const kNumAUNBandEQFilterTypes: number;

export declare const kAudioUnitErr_MissingKey: number;

export declare const kAudioUnitSubType_ScheduledSoundPlayer: number;

export declare const kAudioFilePropertyBitRate: number;

export declare const kAudioCodecContentSource_AppleAV_Traditional_Live: number;

export declare const kAudioFileComponent_HFSTypeCodesForType: number;

export declare const kAudioUnitProperty_IconLocation: number;

export declare const kAudioUnitErr_ComponentManagerNotSupported: number;

export declare const kAudioQueueDeviceProperty_SampleRate: number;

export declare const kAudioUnitScope_Output: number;

export declare const kExtAudioFilePacketTableInfoOverride_UseFileValue: number;

export declare const kMusicDeviceSysExSelect: number;

export declare const kAudioCodecProduceOutputPacketFailure: number;

export declare const kAudioFilePropertyAudioTrackCount: number;

export declare const kAUSampler_DefaultPercussionBankMSB: number;

export declare const kRogerBeepParam_InGateThreshold: number;

export declare const kPannerParam_RefDistance: number;

export declare const kAudioSessionUnspecifiedError: number;

export declare const kAudioUnitProperty_ClassInfo: number;

export declare const k3DMixerParam_OcclusionAttenuation: number;

export declare const kMusicDeviceStopNoteSelect: number;

export declare const kMultibandCompressorParam_Crossover1: number;

export declare const kAudioFileStreamError_UnsupportedDataFormat: number;

export declare const kSequenceTrackProperty_SoloStatus: number;

export declare const kAudioFileStreamError_IllegalOperation: number;

export declare const kAudioFormatUnspecifiedError: number;

export declare const kLimiterParam_DecayTime: number;

export declare const kAUSamplerParam_FineTuning: number;

export declare const kSpatialMixerParam_Distance: number;

export declare const kAudioFormatProperty_ChannelLayoutSimpleName: number;

export declare const kAudioUnitSubType_GraphicEQ: number;

export declare const kAudioUnitProperty_SpatialMixerAttenuationCurve: number;

export declare const kInstrumentType_Audiofile: number;

export declare const kAudioOutputUnitProperty_IsRunning: number;

export declare const kAudioOutputUnitProperty_StartTimestampsAtZero: number;

export declare const kSpeakerConfiguration_HeadPhones: number;

export declare const kDistortionParam_Decay: number;

export declare const kAudioQueueErr_CannotStart: number;

export declare const kAudioUnitSubType_RogerBeep: number;

export declare const kAudioSessionMode_Default: number;

export declare const kNewTimePitchParam_EnablePeakLocking: number;

export declare const kAudioUnitScope_Input: number;

export declare const kAUSamplerProperty_LoadAudioFiles: number;

export declare const kAudioFormatProperty_ChannelLayoutForTag: number;

export declare const kAudioCodecBitRateControlMode_LongTermAverage: number;

export declare const kMultiChannelMixerParam_Pan: number;

export declare const kCAClock_InvalidSMPTEOffsetError: number;

export declare const kMultibandFilter_CenterFreq1: number;

export declare const kAudioServicesUnsupportedPropertyError: number;

export declare const kAudioConverterPropertyBitDepthHint: number;

export declare const kAudioUnitSubType_StereoMixer: number;

export declare const kAudioFilePropertyMagicCookieData: number;

export declare const kReverbParam_LargeSize: number;

export declare const kAudioCodecUseRecommendedSampleRate: number;

export declare const kDitherAlgorithm_TPDF: number;

export declare const kAudioCodecPropertyRecommendedBitRateRange: number;

export declare const kCAF_MIDIChunkID: number;

export declare const kAudioCodecSetPropertySelect: number;

export declare const kAUSampler_DefaultBankLSB: number;

export declare const kDistortionParam_RingModFreq1: number;

export declare const kMultibandFilter_Bandwidth1: number;

export declare const kAudioUnitType_MusicDevice: number;

export declare const kParametricEQParam_CenterFreq: number;

export declare const kAudioCodecPropertyZeroFramesPadded: number;

export declare const kAudioUnitType_RemoteGenerator: number;

export declare const kAudioUnitSubType_DefaultOutput: number;

export declare const kAudioUnitErr_UnknownFileType: number;

export declare const kMusicDeviceProperty_BankName: number;

export declare const kAudioFileWave64Type: number;

export declare const kAudioToolboxErr_EndOfTrack: number;

export declare const kTimePitchParam_Pitch: number;

export declare const kMultibandFilter_CenterGain2: number;

export declare const kAudioFormatProperty_NumberOfChannelsForLayout: number;

export declare const kAudioUnitProperty_Latency: number;

export declare const kMatrixMixerParam_PostAveragePowerLinear: number;

export declare const kAudioFormatProperty_Decoders: number;

export declare const kAudioFilePropertyPacketToRollDistance: number;

export declare const kMultibandCompressorParam_InputAmplitude3: number;

export declare const kAUGraphErr_InvalidAudioUnit: number;

export declare const kAudioFileStreamProperty_PacketToDependencyInfo: number;

export declare const kAudioConverterPropertyFormatList: number;

export declare const kAudioConverterPrimeInfo: number;

export declare const kNewTimePitchParam_Rate: number;

export declare const kAudioUnitType_RemoteInstrument: number;

export declare const kAudioConverterPropertyMaximumInputPacketSize: number;

export declare const kAudioConverterQuality_Min: number;

export declare const kAudioUnitComplexRenderSelect: number;

export declare const kAUNBandEQFilterType_Parametric: number;

export declare const kAudioUnitProperty_ShouldAllocateBuffer: number;

export declare const kAudioFileMP2Type: number;

export declare const kAudioFileDoesNotAllow64BitDataSizeError: number;

export declare const kAudioFileStreamError_UnspecifiedError: number;

export declare const kAudioUnitRange: number;

export declare const kMultibandCompressorParam_Crossover3: number;

export declare const kAudioUnitProperty_SampleRateConverterComplexity: number;

export declare const kAudioUnitErr_IllegalInstrument: number;

export declare const kCAF_ChannelLayoutChunkID: number;

export declare const kAUNetReceiveParam_Status: number;

export declare const kConverterPrimeMethod_Pre: number;

export declare const kAudioUnitSubType_RoundTripAAC: number;

export declare const kAudioUnitProperty_ClassInfoFromDocument: number;

export declare const kAudioCodecProduceOutputPacketSuccess: number;

export declare const kAUNetSendPresetFormat_AAC_LD_64kbpspc: number;

export declare const kAudioUnitProperty_IsInterAppConnected: number;

export declare const kReverbParam_PreDelay: number;

export declare const kAUNetSendPresetFormat_AAC_32kbpspc: number;

export declare const kAudioUnitErr_NoConnection: number;

export declare const kAudioFileAC3Type: number;

export declare const kMusicEventType_NULL: number;

export declare const kExtAudioFileError_InvalidPropertySize: number;

export declare const kMultiChannelMixerParam_Volume: number;

export declare const kAudioFileGlobalInfo_TypesForMIMEType: number;

export declare const kAudioToolboxErr_TrackIndexError: number;

export declare const kAudioUnitProperty_RemoteControlEventListener: number;

export declare const kAudioFileMP3Type: number;

export declare const kAudioConverterSampleRateConverterAlgorithm: number;

export declare const kSpatialMixerParam_HeadPitch: number;

export declare const kMultibandCompressorParam_Postgain: number;

export declare const kMusicEventType_ExtendedNote: number;

export declare const kRenderQuality_Low: number;

export declare const kAudioComponentErr_InitializationTimedOut: number;

export declare const kAudioCodecPrimeMethod_Normal: number;

export declare const kAudioConverterApplicableEncodeBitRates: number;

export declare const kAUSamplerProperty_LoadPresetFromBank: number;

export declare const kAudioUnitSubType_NBandEQ: number;

export declare const kAudioFilePropertyID3Tag: number;

export declare const kAudioUnitCarbonViewSetEventListenerSelect: number;

export declare const kAudioFileWritePacketsSelect: number;

export declare const kAudioSessionProperty_OverrideCategoryDefaultToSpeaker: number;

export declare const kAudioFileM4BType: number;

export declare const kParametricEQParam_Gain: number;

export declare const kCAClock_InvalidUnitError: number;

export declare const kAudioCodecGetPropertySelect: number;

export declare const kAudioUnitProperty_3DMixerRenderingFlags: number;

export declare const kOtherPluginFormat_kMAS: number;

export declare const kAudioFormatProperty_FormatIsEncrypted: number;

export declare const kAudioFileStreamProperty_MaximumPacketSize: number;

export declare const kCAF_SMPTE_TimeType2997: number;

export declare const kAUNetSendParam_NumParameters: number;

export declare const kAudioQueueErr_InvalidDevice: number;

export declare const kAudioFileGetPropertySelect: number;

export declare const kExtAudioFileProperty_IOBuffer: number;

export declare const kAudioFileStreamError_UnsupportedFileType: number;

export declare const kAudioUnitProperty_ParameterValueName: number;

export declare const kMultibandCompressorParam_Pregain: number;

export declare const k3DMixerParam_PostPeakHoldLevel: number;

export declare const kAudioCodecPropertyCurrentOutputSampleRate: number;

export declare const kDistortionParam_DecimationMix: number;

export declare const kAudioFilePropertyChannelLayout: number;

export declare const kReverbParam_SmallBrightness: number;

export declare const kAUNBandEQFilterType_HighShelf: number;

export declare const kMultibandCompressorParam_CompressionAmount4: number;

export declare const kReverbParam_LargeDensity: number;

export declare const kReverbParam_FilterType: number;

export declare const kAudioFileReadPacketsSelect: number;

export declare const kAudioUnitProperty_MaximumFramesPerSlice: number;

export declare const kAudioFileLoopDirection_Backward: number;

export declare const kAUNBandEQFilterType_2ndOrderButterworthLowPass: number;

export declare const kAudioCodecPropertyOutputFormatsForInputFormat: number;

export declare const kAudioCodecQuality_Min: number;

export declare const kAudioFilePropertyRegionList: number;

export declare const kAudioFilePropertyID3TagOffset: number;

export declare const kAudioFilePropertyByteToPacket: number;

export declare const kAudioQueueErr_InvalidBuffer: number;

export declare const kAUGroupParameterID_PitchBend: number;

export declare const kAudioUnitErr_Uninitialized: number;

export declare const kAUNetReceiveParam_NumParameters: number;

export declare const kAudioToolboxErr_NoSequence: number;

export declare const AUEventSampleTimeImmediate: number;

export declare const kStereoMixerParam_PostAveragePower: number;

export declare const kAudioFormatProperty_FormatName: number;

export declare const kAudioCodecUninitializeSelect: number;

export declare const kAudioServicesBadPropertySizeError: number;

export declare const kCAFMarkerType_RegionEnd: number;

export declare const kAudioUnitProperty_PeerURL: number;

export declare const kReverbParam_DryWetMix: number;

export declare const kDynamicRangeControlMode_Light: number;

export declare const kAudioFilePropertyFileFormat: number;

export declare const kAudioCodecAppendInputBufferListSelect: number;

export declare const kMusicDeviceProperty_PartGroup: number;

export declare const kAudioUnitType_OfflineEffect: number;

export declare const kAudioUnitErr_FormatNotSupported: number;

export declare const kCAFMarkerType_TrackStart: number;

export declare const kMultibandFilter_LowFilterType: number;

export declare const kAudioCodecProduceOutputBufferListSelect: number;

export declare const kAudioFileGlobalInfo_HFSTypeCodesForType: number;

export declare const kAUNetSendProperty_ServiceName: number;

export declare const kRenderQuality_Min: number;

export declare const kAudioCodecContentSource_Music_Spatial: number;

export declare const kAUGroupParameterID_Foot_LSB: number;

export declare const kAUSamplerParam_Pan: number;

export declare const kExtAudioFileProperty_ConverterConfig: number;

export declare const kAudioFormatUnsupportedPropertyError: number;

export declare const kAudioConverterApplicableEncodeSampleRates: number;

export declare const kAudioFileOperationNotSupportedError: number;

export declare const kAudioFileStreamProperty_FormatList: number;

export declare const kAUSamplerProperty_BankAndPreset: number;

export declare const kAudioFilePropertyChunkIDs: number;

export declare const kAudioCodecPropertyFormatList: number;

export declare const kDistortionParam_Rounding: number;

export declare const kAudioUnitProperty_UsesInternalReverb: number;

export declare const kAudioQueueErr_InvalidPropertyValue: number;

export declare const kCAF_SMPTE_TimeType25: number;

export declare const kAudioFileMPEG4Type: number;

export declare const kRogerBeepParam_OutGateThreshold: number;

export declare const kAudioComponentErr_UnsupportedType: number;

export declare const kAudioCodecProduceOutputPacketSuccessHasMore: number;

export declare const kAUNBandEQParam_GlobalGain: number;

export declare const kAudioCodecPropertyMinimumNumberOutputPackets: number;

export declare const kMultibandCompressorParam_Headroom2: number;

export declare const kInstrumentType_AUPreset: number;

export declare const kAudioToolboxError_NoTrackDestination: number;

export declare const kMultibandCompressorParam_InputAmplitude2: number;

export declare const kAUVoiceIOProperty_MuteOutput: number;

export declare const kAudioCodecInputFormatsForOutputFormat: number;

export declare const kAudioQueueErr_RecordUnderrun: number;

export declare const kRoundTripAACParam_Quality: number;

export declare const kReverbParam_LargeDelayRange: number;

export declare const kAudioUnitErr_FailedInitialization: number;

export declare const kAudioCodecPropertyCurrentOutputFormat: number;

export declare const kAudioUnitProperty_3DMixerAttenuationCurve: number;

export declare const kAudioFileNotOpenError: number;

export declare const kAudioCodecContentSource_Reserved: number;

export declare const kAudioUnitProperty_CurrentPreset: number;

export declare const k3DMixerParam_PrePeakHoldLevel: number;

export declare const kAudioFileStreamProperty_InfoDictionary: number;

export declare const kAudioUnitParameterName_Full: number;

export declare const kAudioFileStreamProperty_DataOffset: number;

export declare const kAUGroupParameterID_Pan: number;

export declare const kAudioConverterAvailableEncodeSampleRates: number;

export declare const kAULowShelfParam_Gain: number;

export declare const kAudioToolboxErr_InvalidPlayerState: number;

export declare const kAudioConverterQuality_Medium: number;

export declare const kAudioOutputUnitStopSelect: number;

export declare const kAudioFilePropertyMaximumPacketSize: number;

export declare const kAudioConverterCurrentOutputStreamDescription: number;

export declare const kAudioFileInitializeSelect: number;

export declare const kCAFMarkerType_EditDestinationEnd: number;

export declare const kExtAudioFileProperty_ClientMaxPacketSize: number;

export declare const kAUGroupParameterID_ChannelPressure: number;

export declare const kDelayParam_Feedback: number;

export declare const kAudioUnitProperty_PannerMode: number;

export declare const kAudioFileBW64Type: number;

export declare const kAudioUnitErr_InstrumentTypeNotFound: number;

export declare const kAudioComponentErr_DuplicateDescription: number;

export declare const kAudioCodecContentSource_AV_Traditional_Offline: number;

export declare const kAudioConverterDecompressionMagicCookie: number;

export declare const kAudioQueueProperty_IsRunning: number;

export declare const kAudioUnitErr_InvalidParameter: number;

export declare const kAudioConverterErr_OutputSampleRateOutOfRange: number;

export declare const kAudioUnitScheduleParametersSelect: number;

export declare const kAUVoiceIOProperty_BypassVoiceProcessing: number;

export declare const kAudioCodecGetPropertyInfoSelect: number;

export declare const kAudioUnitSRCAlgorithm_MediumQuality: number;

export declare const kAudioCodecNoError: number;

export declare const kAudioCodecQuality_Medium: number;

export declare const kAudioUnitProperty_CPULoad: number;

export declare const kDynamicsProcessorParam_ExpansionRatio: number;

export declare const kAudioFileFLACType: number;

export declare const kAudioSessionProperty_CurrentHardwareSampleRate: number;

export declare const kAudioCodecPropertyCurrentTargetBitRate: number;

export declare const kAudioCodecPropertyUsedInputBufferSize: number;

export declare const kAudioFileGetUserDataSelect: number;

export declare const kAudioSessionBadPropertySizeError: number;

export declare const kSequenceTrackProperty_TimeResolution: number;

export declare const kAudioFileGlobalInfo_FileTypeName: number;

export declare const kAudioUnitProperty_ScheduledFileNumberBuffers: number;

export declare const kRogerBeepParam_Sensitivity: number;

export declare const kMusicEventType_MIDIRawData: number;

export declare const kMultibandFilter_HighFrequency: number;

export declare const kAudioUnitProperty_HostMIDIProtocol: number;

export declare const kAudioUnitProperty_ElementCount: number;

export declare const kDistortionParam_LinearTerm: number;

export declare const kAudioCodecIllegalOperationError: number;

export declare const kAudioUnitSampleRateConverterComplexity_Mastering: number;

export declare const kMusicDeviceSampleFrameMask_IsScheduled: number;

export declare const kReverbParam_FilterFrequency: number;

export declare const kAudioConverterErr_OperationNotSupported: number;

export declare const kExtAudioFileProperty_FileChannelLayout: number;

export declare const kAudioQueueProperty_ConverterError: number;

export declare const kDynamicsProcessorParam_MasterGain: number;

export declare const kMultibandCompressorParam_Headroom4: number;

export declare const kConverterPrimeMethod_None: number;

export declare const kAudioFilePropertyPacketToDependencyInfo: number;

export declare const kAudioFormatProperty_ID3TagToDictionary: number;

export declare const kMatrixMixerParam_PrePeakHoldLevel: number;

export declare const kAudioQueueParam_Pitch: number;

export declare const kAudioUnitUninitializeSelect: number;

export declare const kAudioConverterEncodeBitRate: number;

export declare const kAudioUnitGetParameterSelect: number;

export declare const kAudioUnitGetPropertySelect: number;

export declare const kAudioCodecBitRateControlMode_Constant: number;

export declare const kAudioCodecPropertyDelayMode: number;

export declare const kAudioConverterPropertyDithering: number;

export declare const kAudioCodecResetSelect: number;

export declare const kAudioUnitProperty_SpatialMixerPointSourceInHeadMode: number;

export declare const kAudioUnitCarbonViewComponentType: number;

export declare const kAudioConverterSampleRateConverterComplexity_MinimumPhase: number;

export declare const kAudioCodecOutputPrecedence: number;

export declare const kAudioFormatProperty_ChannelLayoutName: number;

export declare const kAudioUnitProperty_SpatialMixerRenderingFlags: number;

export declare const kAudioUnitAddRenderNotifySelect: number;

export declare const kMultibandFilter_HighGain: number;

export declare const kCAFMarkerType_Tempo: number;

export declare const kAudioConverterPropertyCalculateOutputBufferSize: number;

export declare const kAudioSessionProperty_AudioInputAvailable: number;

export declare const kProgramTargetLevel_None: number;

export declare const kSpatialMixerParam_Azimuth: number;

export declare const kAudioHardwareServiceDeviceProperty_VirtualMainVolume: number;

export declare const kAUVoiceIOErr_UnexpectedNumberOfInputChannels: number;

export declare const kAudioCodecExtendFrequencies: number;

export declare const kAudioSessionProperty_ServerDied: number;

export declare const kAudioCodecNotEnoughBufferSpaceError: number;

export declare const k3DMixerParam_ObstructionAttenuation: number;

export declare const kAudioQueueErr_BufferInQueue: number;

export declare const kAudioOfflineUnitProperty_InputSize: number;

export declare const kAudioConverterAvailableEncodeBitRates: number;

export declare const kAudioSessionNotActiveError: number;

export declare const kHALOutputParam_Volume: number;

export declare const kAudioUnitSubType_SampleDelay: number;

export declare const kAudioUnitSampleRateConverterComplexity_Normal: number;

export declare const kAudioCodecContentSource_AppleCapture_Spatial_Enhanced: number;

export declare const kOfflinePreflight_NotRequired: number;

export declare const kAudioEncoderComponentType: number;

export declare const kAudioCodecPropertyAvailableInputSampleRates: number;

export declare const kAudioUnitSubType_NetReceive: number;

export declare const kReverbParam_FilterEnable: number;

export declare const kAudioUnitSubType_BandPassFilter: number;

export declare const kAudioFileGlobalInfo_AvailableStreamDescriptionsForFormat: number;

export declare const kAudioUnitCarbonViewEvent_MouseUpInControl: number;

export declare const kAUNetSendProperty_TransmissionFormat: number;

export declare const kMusicDeviceParam_ReverbVolume: number;

export declare const kAudioQueueTimePitchAlgorithm_Spectral: number;

export declare const kAudioUnitProperty_CocoaUI: number;

export declare const kAudioFilePropertyPacketSizeUpperBound: number;

export declare const kAudioConverterErr_FormatNotSupported: number;

export declare const kAudioSessionInterruptionType_ShouldResume: number;

export declare const kAUNBandEQFilterType_ResonantLowShelf: number;

export declare const kAudioFileAIFCType: number;

export declare const kAudioCodecUnsupportedFormatError: number;

export declare const kAudioUnitSubType_MultiChannelMixer: number;

export declare const kAudioFilePropertyPacketTableInfo: number;

export declare const kAUGroupParameterID_AllSoundOff: number;

export declare const kDelayParam_DelayTime: number;

export declare const kAudioUnitGetPropertyInfoSelect: number;

export declare const kAudioUnitErr_TooManyFramesToProcess: number;

export declare const kCAF_SMPTE_TimeType5994: number;

export declare const kAudioFilePropertySourceBitDepth: number;

export declare const kAudioUnitOfflineProperty_InputSize: number;

export declare const kAudioQueueErr_InvalidTapType: number;

export declare const kAudioFormatProperty_FormatEmploysDependentPackets: number;

export declare const kAudioUnitErr_InvalidScope: number;

export declare const kAUVoiceIOProperty_VoiceProcessingQuality: number;

export declare const kAudioSessionProperty_InterruptionType: number;

export declare const kRogerBeepParam_RogerGain: number;

export declare const kSpeakerConfiguration_Quad: number;

export declare const kAudioFileStreamError_BadPropertySize: number;

export declare const kAudioFormatProperty_TagsForNumberOfChannels: number;

export declare const kAudioCodecContentSource_Music_Traditional: number;

export declare const kSequenceTrackProperty_TrackLength: number;

export declare const kInstrumentType_SF2Preset: number;

export declare const kAUNetSendNumPresetFormats: number;

export declare const kAudioFilePropertyReserveDuration: number;

export declare const kAudioFileStreamProperty_RestrictsRandomAccess: number;

export declare const kAudioOutputUnitProperty_MIDICallbacks: number;

export declare const kAudioFileStreamError_DataUnavailable: number;

export declare const kAudioUnitProperty_MIDIOutputBufferSizeHint: number;

export declare const kAudioUnitProperty_InPlaceProcessing: number;

export declare const kAUNetSendPresetFormat_ULaw: number;

export declare const kAudioOutputUnitStartSelect: number;

export declare const kAudioUnitErr_Initialized: number;

export declare const kAudioUnitSubType_Splitter: number;

export declare const kAudioToolboxErr_TrackNotFound: number;

export declare const kAudioUnitParameterFlag_Output: number;

export declare const kAudioUnitProcessSelect: number;

export declare const kAUNetSendProperty_Password: number;

export declare const kAudioConverterEncodeAdjustableSampleRate: number;

export declare const kAudioConverterSampleRateConverterComplexity: number;

export declare const kGraphicEQParam_NumberOfBands: number;

export declare const kCAF_RegionChunkID: number;

export declare const kCAF_FileType: number;

export declare const kAudioUnityCodecComponentType: number;

export declare const kAUNetReceiveProperty_Password: number;

export declare const kAudioCodecPropertyAdjustCompressionProfile: number;

export declare const kAudioUnitProperty_ParameterStringFromValue: number;

export declare const kRenderQuality_Max: number;

export declare const kPannerParam_Gain: number;

export declare const kAudioSessionCategory_SoloAmbientSound: number;

export declare const kReverbParam_LargeBrightness: number;

export declare const kAudioUnitProperty_FastDispatch: number;

export declare const kAudioFileInvalidFileError: number;

export declare const kAudioUnitProperty_HotMapParameterMIDIMapping: number;

export declare const kAUNetSendPresetFormat_AAC_80kbpspc: number;

export declare const kAudioFileGlobalInfo_MIMETypesForType: number;

export declare const kVarispeedParam_PlaybackRate: number;

export declare const kCAF_EditCommentsChunkID: number;

export declare const kMusicDeviceProperty_UsesInternalReverb: number;

export declare const kAudioQueueErr_EnqueueDuringReset: number;

export declare const kAUGroupParameterID_Sostenuto: number;

export declare const kMatrixMixerParam_PreAveragePower: number;

export declare const kMatrixMixerParam_PostAveragePower: number;

export declare const kAudioUnitProperty_ParameterValueStrings: number;

export declare const kMultibandCompressorParam_AttackTime: number;

export declare const kAudioCodecContentSource_AppleAV_Spatial_Offline: number;

export declare const kAUGroupParameterID_ModWheel_LSB: number;

export declare const kAudioFormatProperty_AvailableEncodeNumberChannels: number;

export declare const kStereoMixerParam_Volume: number;

export declare const kAudioFile3GPType: number;

export declare const kAudioUnitProperty_ParameterIDName: number;

export declare const kAudioUnitProperty_RequestViewController: number;

export declare const kAUNetSendPresetFormat_PCMInt16: number;

export declare const kAudioCodecPropertyCurrentInputSampleRate: number;

export declare const kAudioFileFileIsThisFormatSelect: number;

export declare const kAudioUnitProperty_SpeakerConfiguration: number;

export declare const k3DMixerParam_BusEnable: number;

export declare const kAudioCodecPropertyDynamicRangeControlConfiguration: number;

export declare const kStereoMixerParam_PostPeakHoldLevel: number;

export declare const kAudioFormatProperty_DecodeFormatIDs: number;

export declare const kAudioUnitErr_ExtensionNotFound: number;

export declare const kAudioFileLATMInLOASType: number;

export declare const kDynamicsProcessorParam_ExpansionThreshold: number;

export declare const kAudioFileStreamProperty_NextIndependentPacket: number;

export declare const kSpeakerConfiguration_5_0: number;

export declare const kStereoMixerParam_PrePeakHoldLevel: number;

export declare const kAudioFormatProperty_FirstPlayableFormatFromList: number;

export declare const kAudioQueueParam_Volume: number;

export declare const kAudioFileUnsupportedDataFormatError: number;

export declare const kMultibandFilter_LowGain: number;

export declare const kAudioUnitProperty_ScheduleStartTimeStamp: number;

export declare const kMultibandCompressorParam_Threshold2: number;

export declare const kAUNetReceiveProperty_Hostname: number;

export declare const kAudioCodecPropertyIsInitialized: number;

export declare const kAudioFileNotOptimizedError: number;

export declare const kAudioConverterQuality_Low: number;

export declare const kAudioComponentErr_InstanceTimedOut: number;

export declare const kCAF_PacketTableChunkID: number;

export declare const kMusicDeviceProperty_SupportsStartStopNote: number;

export declare const kOfflinePreflight_Required: number;

export declare const kAUGraphErr_InvalidConnection: number;

export declare const kMultibandCompressorParam_Threshold3: number;

export declare const kAudioUnitScope_Group: number;

export declare const kAudioUnitErr_PropertyNotWritable: number;

export declare const kAudioFormatProperty_FormatInfo: number;

export declare const kAudioQueueProperty_ChannelAssignments: number;

export declare const kPannerParam_Distance: number;

export declare const kAudioUnitProperty_RemoveParameterMIDIMapping: number;

export declare const kAudioFileStreamProperty_PacketToRollDistance: number;

export declare const kAudioUnitProperty_LoadedOutOfProcess: number;

export declare const kAudioCodecBitRateFormat_ABR: number;

export declare const kAudioQueueDeviceProperty_NumberChannels: number;

export declare const kAudioUnitScope_LayerItem: number;

export declare const kAudioFileWriteBytesSelect: number;

export declare const kAudioFormatBadSpecifierSizeError: number;

export declare const kSpatialMixerParam_OcclusionAttenuation: number;

export declare const kAudioFilePropertyEstimatedDuration: number;

export declare const kAudioFileLoopDirection_ForwardAndBackward: number;

export declare const kAudioCodecPropertyAvailableOutputChannelLayoutTags: number;

export declare const kAudioQueueErr_InvalidProperty: number;

export declare const kAudioUnitSubType_PeakLimiter: number;

export declare const kAudioFormatProperty_ChannelLayoutHash: number;

export declare const kAudioUnitProperty_BusCount: number;

export declare const kAudioUnitProperty_LastRenderSampleTime: number;

export declare const kAudioFileStreamError_DiscontinuityCantRecover: number;

export declare const kAudioUnitProperty_ParameterHistoryInfo: number;

export declare const kDynamicsProcessorParam_OutputAmplitude: number;

export declare const kExtAudioFileProperty_FileMaxPacketSize: number;

export declare const kAudioUnitProperty_MIDIOutputEventListCallback: number;

export declare const kAudioFileStreamError_InvalidPacketOffset: number;

export declare const kMultiChannelMixerParam_Enable: number;

export declare const kAudioFormatProperty_ASBDFromESDS: number;

export declare const kAudioSessionProperty_PreferredHardwareIOBufferDuration: number;

export declare const kReverbParam_SmallLargeMix: number;

export declare const kAudioUnitErr_InvalidFile: number;

export declare const kAudioUnitProperty_ScheduleAudioSlice: number;

export declare const kAudioCodecBitRateControlMode_Variable: number;

export declare const kAudioFileStreamProperty_ReadyToProducePackets: number;

export declare const kAudioFilePropertyAlbumArtwork: number;

export declare const kCAF_FileVersion_Initial: number;

export declare const kAudioUnitType_RemoteEffect: number;

export declare const kMultibandCompressorParam_OutputAmplitude4: number;

export declare const kAudioCodecDelayMode_Optimal: number;

export declare const kAudioUnitRemovePropertyListenerSelect: number;

export declare const kAudioCodecPropertyMaximumPacketByteSize: number;

export declare const k3DMixerParam_DryWetReverbBlend: number;

export declare const kAudioUnitSubType_3DMixer: number;

export declare const kExtAudioFileError_InvalidDataFormat: number;

export declare const kAudioQueueErr_BufferEmpty: number;

export declare const kReverbParam_ModulationDepth: number;

export declare const kAudioFileWAVEType: number;

export declare const kCAF_SMPTE_TimeTypeNone: number;

export declare const kAudioFilePropertyPreviousIndependentPacket: number;

export declare const kAudioUnitSubType_MultiBandCompressor: number;

export declare const kAudioFileGlobalInfo_TypesForExtension: number;

export declare const kAudioFileGlobalInfo_TypesForUTI: number;

export declare const kAudioSessionMode_VoiceChat: number;

export declare const kAudioOutputUnitProperty_SetInputCallback: number;

export declare const kAudioUnitSubType_HRTFPanner: number;

export declare const kDistortionParam_Delay: number;

export declare const kAudioUnitScope_Part: number;

export declare const kAudioUnitProperty_RenderContextObserver: number;

export declare const kMusicDeviceProperty_StreamFromDisk: number;

export declare const kHintBasic: number;

export declare const kAUNetSendPresetFormat_AAC_96kbpspc: number;

export declare const kReverb2Param_MaxDelayTime: number;

export declare const kAudioQueueProperty_EnableLevelMetering: number;

export declare const kAUSamplerProperty_LoadInstrument: number;

export declare const kAudioFileComponent_CanWrite: number;

export declare const kAudioOutputUnitProperty_ChannelMap: number;

export declare const kMultibandCompressorParam_OutputAmplitude1: number;

export declare const kAudioQueueErr_InvalidCodecAccess: number;

export declare const kAudioCodecContentSource_ApplePassthrough: number;

export declare const kAudioFileComponent_MIMETypesForType: number;

export declare const kAudioUnitErr_MultipleVoiceProcessors: number;

export declare const kDelayParam_WetDryMix: number;

export declare const kMusicDeviceReleaseInstrumentSelect: number;

export declare const kAudioUnitProperty_SupportsMPE: number;

export declare const kAudioUnitSubType_HighShelfFilter: number;

export declare const kAudioFileStreamProperty_AudioDataByteCount: number;

export declare const kCAClock_InvalidSMPTEFormatError: number;

export declare const kAudioHardwareServiceDeviceProperty_VirtualMasterVolume: number;

export declare const kAudioConverterPropertyOutputCodecParameters: number;

export declare const kAudioCodecPropertyBitRateForVBR: number;

export declare const kAudioCodecContentSource_AV_Traditional_Live: number;

export declare const kAudioFormatProperty_ASBDFromMPEGPacket: number;

export declare const kAudioConverterPropertyDitherBitDepth: number;

export declare const kAUGroupParameterID_AllNotesOff: number;

export declare const kAudioFilePropertyRestrictsRandomAccess: number;

export declare const kAudioToolboxErr_IllegalTrackDestination: number;

export declare const kRandomParam_BoundB: number;

export declare const kNewTimePitchParam_EnableSpectralCoherence: number;

export declare const kAUNodeInteraction_Connection: number;

export declare const kAudioFileMP1Type: number;

export declare const kAudioUnitProperty_MIDIOutputCallbackInfo: number;

export declare const kCAF_SMPTE_TimeType30Drop: number;

export declare const kAUNetSendParam_Status: number;

export declare const kMusicDeviceProperty_InstrumentNumber: number;

export declare const kAudioSessionProperty_CurrentHardwareIOBufferDuration: number;

export declare const kAudioUnitResetSelect: number;

export declare const kAudioSessionRouteChangeReason_NoSuitableRouteForCategory: number;

export declare const kAUGraphErr_NodeNotFound: number;

export declare const k3DMixerParam_Azimuth: number;

export declare const kDynamicRangeCompressionProfile_None: number;

export declare const kOtherPluginFormat_Undefined: number;

export declare const kAUNetSendPresetFormat_Lossless24: number;

export declare const kAudioSessionCategory_LiveAudio: number;

export declare const kMusicDeviceMIDIEventSelect: number;

export declare const k3DMixerParam_PlaybackRate: number;

export declare const kAudioQueueErr_InvalidQueueType: number;

export declare const kAUNetSendPresetFormat_PCMInt24: number;

export declare const kSpatialMixerParam_GlobalReverbGain: number;

export declare const kAudioUnitOfflineProperty_PreflightName: number;

export declare const kRandomParam_BoundA: number;

export declare const kCAFMarkerType_SelectionStart: number;

export declare const kAudioQueueProperty_MagicCookie: number;

export declare const kAudioConverterAvailableEncodeChannelLayoutTags: number;

export declare const kAudioFileComponent_UTIsForType: number;

export declare const kAudioQueueErr_InvalidOfflineMode: number;

export declare const kMultiChannelMixerParam_PrePeakHoldLevel: number;

export declare const kAUGroupParameterID_Volume_LSB: number;

export declare const kAudioSessionInterruptionType_ShouldNotResume: number;

export declare const kCAF_SMPTE_TimeType30: number;

export declare const kReverbParam_LargeDelay: number;

export declare const kAudioFormatProperty_AvailableEncodeSampleRates: number;

export declare const kSpatialMixerParam_ObstructionAttenuation: number;

export declare const kCAF_UMIDChunkID: number;

export declare const kAUGroupParameterID_ModWheel: number;

export declare const kStereoMixerParam_Pan: number;

export declare const kAUNetStatus_Underflow: number;

export declare const kMusicDeviceProperty_GroupOutputBus: number;

export declare const kAudioUnitProperty_SRCAlgorithm: number;

export declare const kMusicNoteEvent_UseGroupInstrument: number;

export declare const kAudioUnitSubType_MatrixMixer: number;

export declare const kAudioUnitProperty_MatrixLevels: number;

export declare const kReverb2Param_DecayTimeAtNyquist: number;

export declare const kAudioQueueErr_CannotStartYet: number;

export declare const kNumberOfResponseFrequencies: number;

export declare const kAudioFileDataIsThisFormatSelect: number;

export declare const kAudioOutputUnitProperty_RemoteControlToHost: number;

export declare const kPannerParam_Azimuth: number;

export declare const kAudioFormatProperty_ChannelShortName: number;

export declare const kAudioSessionCategory_AudioProcessing: number;

export declare const kAUNetSendPresetFormat_AAC_48kbpspc: number;

export declare const kAudioUnitSubType_LowShelfFilter: number;

export declare const kAudioHardwareServiceDeviceProperty_VirtualMainBalance: number;

export declare const kMatrixMixerParam_PostPeakHoldLevelLinear: number;

export declare const kAudioQueueErr_InvalidTapContext: number;

export declare const kAUNBandEQFilterType_BandPass: number;

export declare const kCAClock_InvalidSyncSourceError: number;

export declare const kAUNetStatus_NotConnected: number;

export declare const kAudioUnitSubType_SpatialMixer: number;

export declare const kAudioFormatProperty_BitmapForLayoutTag: number;

export declare const kAudioFilePropertyDataFormat: number;

export declare const kAudioFileStreamProperty_AudioDataPacketCount: number;

export declare const kAudioUnitProperty_MeteringMode: number;

export declare const kAudioUnitProperty_ParametersForOverview: number;

export declare const kAUNetSendProperty_TransmissionFormatIndex: number;

export declare const k3DMixerParam_ReverbBlend: number;

export declare const kAudioUnitProperty_MIDIControlMapping: number;

export declare const kAudioUnitSetParameterSelect: number;

export declare const kReverb2Param_LegacyMode: number;

export declare const kCAF_SMPTE_TimeType2398: number;

export declare const kMusicDeviceMIDIEventListSelect: number;

export declare const kAudioConverterSampleRateConverterQuality: number;

export declare const kAudioServicesSystemSoundUnspecifiedError: number;

export declare const kAUNBandEQFilterType_ResonantLowPass: number;

export declare const kAudioSessionProperty_CurrentHardwareOutputVolume: number;

export declare const kAudioUnitProperty_SampleRate: number;

export declare const kCAClock_InvalidTimeFormatError: number;

export declare const kAudioUnitProperty_SetExternalBuffer: number;

export declare const kSpatialMixerParam_Gain: number;

export declare const kAudioFormatProperty_AvailableEncodeChannelLayoutTags: number;

export declare const kMusicDeviceRange: number;

export declare const kAUSamplerParam_CoarseTuning: number;

export declare const kAudioCodecPropertyPacketSizeLimitForVBR: number;

export declare const kCAFMarkerType_KeySignature: number;

export declare const kExtAudioFileProperty_CodecManufacturer: number;

export declare const kAudioFormatProperty_OutputFormatList: number;

export declare const kAUGroupParameterID_Sustain: number;

export declare const kAudioQueueParam_Pan: number;

export declare const kAudioFormatProperty_PanningMatrix: number;

export declare const kAudioQueueParam_VolumeRampTime: number;

export declare const kSpeakerConfiguration_5_1: number;

export declare const kAudioCodecContentSource_AppleAV_Spatial_Live: number;

export declare const kAudioCodecPropertyMinimumNumberInputPackets: number;

export declare const kAudioFilePropertyAudioDataPacketCount: number;

export declare const kAudioConverterPropertyPerformDownmix: number;

export declare const kAudioConverterQuality_High: number;

export declare const kAudioQueueProperty_CurrentLevelMeterDB: number;

export declare const kAudioConverterOutputChannelLayout: number;

export declare const kAudioOutputUnitRange: number;

export declare const kAudioFileGlobalInfo_UTIsForType: number;

export declare const AudioUnitParameterUnit: {
  Generic: 0,
  Indexed: 1,
  Boolean: 2,
  Percent: 3,
  Seconds: 4,
  SampleFrames: 5,
  Phase: 6,
  Rate: 7,
  Hertz: 8,
  Cents: 9,
  RelativeSemiTones: 10,
  MIDINoteNumber: 11,
  MIDIController: 12,
  Decibels: 13,
  LinearGain: 14,
  Degrees: 15,
  EqualPowerCrossfade: 16,
  MixerFaderCurve1: 17,
  Pan: 18,
  Meters: 19,
  AbsoluteCents: 20,
  Octaves: 21,
  BPM: 22,
  Beats: 23,
  Milliseconds: 24,
  Ratio: 25,
  CustomUnit: 26,
  MIDI2Controller: 27,
};

export declare const AUSpatialMixerPointSourceInHeadMode: {
  Mono: 0,
  Bypass: 1,
};

export declare const MusicSequenceLoadFlags: {
  Preserve: 0,
  ChannelsTo: 1,
};

export declare const CAFRegionFlags: {
  LoopEnable: 1,
  PlayForward: 2,
  PlayBackward: 4,
};

export declare const CAFFormatFlags: {
  Float: 1,
  LittleEndian: 2,
};

export declare const AudioQueueProcessingTapFlags: {
  PreEffects: 1,
  PostEffects: 2,
  Siphon: 4,
  StartOfStream: 256,
  EndOfStream: 512,
};

export declare const AudioBalanceFadeType: {
  MaxUnityGain: 0,
  EqualPower: 1,
};

export declare const AudioPanningMode: {
  SoundField: 3,
  VectorBasedPanning: 4,
};

export declare const AudioFileStreamSeekFlags: {
  kAudioFileStreamSeekFlag_OffsetIsEstimated: 1,
};

export declare const AudioBytePacketTranslationFlags: {
  kBytePacketTranslationFlag_IsEstimate: 1,
};

export declare const AudioFilePermissions: {
  Read: 1,
  Write: 2,
  ReadWrite: 3,
};

export declare const AUAudioUnitBusType: {
  Input: 1,
  Output: 2,
};

export declare const AUParameterAutomationEventType: {
  Value: 0,
  Touch: 1,
  Release: 2,
};

export declare const AUScheduledAudioSliceFlags: {
  Complete: 1,
  BeganToRender: 2,
  BeganToRenderLate: 4,
  Loop: 8,
  Interrupt: 16,
  InterruptAtLoop: 32,
};

export declare const AU3DMixerAttenuationCurve: {
  Power: 0,
  Exponential: 1,
  Inverse: 2,
  Linear: 3,
};

export declare const AUReverbRoomType: {
  SmallRoom: 0,
  MediumRoom: 1,
  LargeRoom: 2,
  MediumHall: 3,
  LargeHall: 4,
  Plate: 5,
  MediumChamber: 6,
  LargeChamber: 7,
  Cathedral: 8,
  LargeRoom2: 9,
  MediumHall2: 10,
  MediumHall3: 11,
  LargeHall2: 12,
};

export declare const AU3DMixerRenderingFlags: {
  InterAuralDelay: 1,
  DopplerShift: 2,
  DistanceAttenuation: 4,
  DistanceFilter: 8,
  DistanceDiffusion: 16,
  LinearDistanceAttenuation: 32,
  ConstantReverbBlend: 64,
};

export declare const AUSpatialMixerAttenuationCurve: {
  Power: 0,
  Exponential: 1,
  Inverse: 2,
  Linear: 3,
};

export declare const AUSpatializationAlgorithm: {
  EqualPowerPanning: 0,
  SphericalHead: 1,
  HRTF: 2,
  SoundField: 3,
  VectorBasedPanning: 4,
  StereoPassThrough: 5,
  HRTFHQ: 6,
  UseOutputType: 7,
};

export declare const AUVoiceIOSpeechActivityEvent: {
  Started: 0,
  Ended: 1,
};

export declare const AudioUnitRemoteControlEvent: {
  TogglePlayPause: 1,
  ToggleRecord: 2,
  Rewind: 3,
};

export declare const AudioUnitParameterOptions: {
  CFNameRelease: 16,
  OmitFromPresets: 8192,
  PlotHistory: 16384,
  MeterReadOnly: 32768,
  DisplayMask: 4653056,
  DisplaySquareRoot: 65536,
  DisplaySquared: 131072,
  DisplayCubed: 196608,
  DisplayCubeRoot: 262144,
  DisplayExponential: 327680,
  HasClump: 1048576,
  ValuesHaveStrings: 2097152,
  DisplayLogarithmic: 4194304,
  IsHighResolution: 8388608,
  NonRealTime: 16777216,
  CanRamp: 33554432,
  ExpertMode: 67108864,
  HasCFNameString: 134217728,
  IsGlobalMeta: 268435456,
  IsElementMeta: 536870912,
  IsReadable: 1073741824,
  IsWritable: -2147483648,
};

export declare const AURenderEventType: {
  Parameter: 1,
  ParameterRamp: 2,
  MIDI: 8,
  MIDISysEx: 9,
  MIDIEventList: 10,
};

export declare const AudioUnitRenderActionFlags: {
  UnitRenderAction_PreRender: 4,
  UnitRenderAction_PostRender: 8,
  UnitRenderAction_OutputIsSilence: 16,
  OfflineUnitRenderAction_Preflight: 32,
  OfflineUnitRenderAction_Render: 64,
  OfflineUnitRenderAction_Complete: 128,
  UnitRenderAction_PostRenderError: 256,
  UnitRenderAction_DoNotCheckRenderArgs: 512,
};

export declare const AudioFileRegionFlags: {
  LoopEnable: 1,
  PlayForward: 2,
  PlayBackward: 4,
};

export declare const AUParameterEventType: {
  Immediate: 1,
  Ramped: 2,
};

export declare const AudioComponentInstantiationOptions: {
  OutOf: 1,
  In: 2,
};

export declare const CAClockSyncMode: {
  Internal: 1768846450,
  MIDIClockTransport: 1835232363,
  MTCTransport: 1835889763,
};

export declare const MusicSequenceType: {
  Beats: 1650811252,
  Seconds: 1936024435,
  Samples: 1935764848,
};

export declare const AudioFileStreamParseFlags: {
  kAudioFileStreamParseFlag_Discontinuity: 1,
};

export declare const MusicSequenceFileFlags: {
  Default: 0,
  EraseFile: 1,
};

export declare const AUSpatialMixerOutputType: {
  Headphones: 1,
  BuiltInSpeakers: 2,
  ExternalSpeakers: 3,
};

export declare const AUParameterMIDIMappingFlags: {
  AnyChannelFlag: 1,
  AnyNoteFlag: 2,
  SubRange: 4,
  Toggle: 8,
  Bipolar: 16,
  Bipolar_On: 32,
};

export declare const AUHostTransportStateFlags: {
  Changed: 1,
  Moving: 2,
  Recording: 4,
  Cycling: 8,
};

export declare const CAClockMessage: {
  StartTimeSet: 1937009005,
  Started: 1937011316,
  Stopped: 1937010544,
  Armed: 1634889060,
  Disarmed: 1684107885,
  PropertyChanged: 1885562983,
  WrongSMPTEFormat: 1064529264,
};

export declare const AudioComponentFlags: {
  Unsearchable: 1,
  SandboxSafe: 2,
  IsV3AudioUnit: 4,
  RequiresAsyncInstantiation: 8,
  CanLoadInProcess: 16,
};

export declare const CAClockPropertyID: {
  InternalTimebase: 1768846434,
  TimebaseSource: 1769235059,
  SyncMode: 1937337965,
  SyncSource: 1937337971,
  SMPTEFormat: 1936552038,
  SMPTEOffset: 1936552047,
  MIDIClockDestinations: 1835164516,
  MTCDestinations: 1836344164,
  MTCFreewheelTime: 1836344951,
  TempoMap: 1953329263,
  MeterTrack: 1835365490,
  Name: 1851878757,
  SendMIDISPP: 1836281968,
};

export declare const AUVoiceIOOtherAudioDuckingLevel: {
  Default: 0,
  Min: 10,
  Mid: 20,
  Max: 30,
};

export declare const CAClockTimebase: {
  HostTime: 1752134516,
  AudioDevice: 1635083369,
  AudioOutputUnit: 1635086197,
};

export declare const AudioFileFlags: {
  EraseFile: 1,
  DontPageAlignAudioData: 2,
};

export declare const AudioComponentValidationResult: {
  Unknown: 0,
  Passed: 1,
  Failed: 2,
  TimedOut: 3,
  UnauthorizedError_Open: 4,
  UnauthorizedError_Init: 5,
};

export declare const AudioConverterOptions: {
  kAudioConverterOption_Unbuffered: 65536,
};

export declare const AUSpatialMixerSourceMode: {
  SpatializeIfMono: 0,
  Bypass: 1,
  PointSource: 2,
  AmbienceBed: 3,
};

export declare const MusicSequenceFileTypeID: {
  File_Any: 0,
  File_MIDI: 1835623529,
  File_iMelody: 1768777068,
};

export declare const CAClockTimeFormat: {
  HostTime: 1752134516,
  Samples: 1935764848,
  Beats: 1650811252,
  Seconds: 1936024435,
  SMPTESeconds: 1936552051,
  SMPTETime: 1936552052,
  AbsoluteSeconds: 1634952547,
};

export declare const AudioUnitEventType: {
  ParameterValueChange: 0,
  BeginParameterChangeGesture: 1,
  EndParameterChangeGesture: 2,
  PropertyChange: 3,
};

export declare const AudioSettingsFlags: {
  Expert: 1,
  Invisible: 2,
  Meta: 4,
  UserInterface: 8,
};

export declare const AUSpatialMixerRenderingFlags: {
  InterAuralDelay: 1,
  DistanceAttenuation: 4,
};

export declare const AudioFileStreamPropertyFlags: {
  PropertyIsCached: 1,
  CacheProperty: 2,
};

export declare class AudioQueueParameterEvent {
  constructor(init?: AudioQueueParameterEvent);
  mID: number;
  mValue: number;
}

export declare class AudioFile_SMPTE_Time {
  constructor(init?: AudioFile_SMPTE_Time);
  mHours: number;
  mMinutes: number;
  mSeconds: number;
  mFrames: number;
  mSubFrameSampleOffset: number;
}

export declare class AURenderCallbackStruct {
  constructor(init?: AURenderCallbackStruct);
  inputProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: number, p6: interop.PointerConvertible) => number | null;
  inputProcRefCon: interop.Pointer;
}

export declare class AudioUnitPresetMAS_Settings {
  constructor(init?: AudioUnitPresetMAS_Settings);
  manufacturerID: number;
  effectID: number;
  variantID: number;
  settingsVersion: number;
  numberOfSettings: number;
  settings: unknown /* const array */;
}

export declare class OpaqueMusicSequence {
  constructor(init?: OpaqueMusicSequence);
}

export declare class AUSamplerInstrumentData {
  constructor(init?: AUSamplerInstrumentData);
  fileURL: interop.Object | null;
  instrumentType: number;
  bankMSB: number;
  bankLSB: number;
  presetID: number;
}

export declare class OpaqueAUGraph {
  constructor(init?: OpaqueAUGraph);
}

export declare class OpaqueMusicTrack {
  constructor(init?: OpaqueMusicTrack);
}

export declare class CAMeterTrackEntry {
  constructor(init?: CAMeterTrackEntry);
  beats: number;
  meterNumer: number;
  meterDenom: number;
}

export declare class OpaqueMusicEventIterator {
  constructor(init?: OpaqueMusicEventIterator);
}

export declare class CABarBeatTime {
  constructor(init?: CABarBeatTime);
  bar: number;
  beat: number;
  subbeat: number;
  subbeatDivisor: number;
  reserved: number;
}

export declare class AUPresetEvent {
  constructor(init?: AUPresetEvent);
  scope: number;
  element: number;
  preset: interop.Object | null;
}

export declare class ExtendedTempoEvent {
  constructor(init?: ExtendedTempoEvent);
  bpm: number;
}

export declare class ExtendedNoteOnEvent {
  constructor(init?: ExtendedNoteOnEvent);
  instrumentID: number;
  groupID: number;
  duration: number;
  extendedParams: MusicDeviceNoteParams;
}

export declare class ExtendedAudioFormatInfo {
  constructor(init?: ExtendedAudioFormatInfo);
  mASBD: AudioStreamBasicDescription;
  mMagicCookie: interop.Pointer;
  mMagicCookieSize: number;
  mClassDescription: AudioClassDescription;
}

export declare class MIDIChannelMessage {
  constructor(init?: MIDIChannelMessage);
  status: number;
  data1: number;
  data2: number;
  reserved: number;
}

export declare class OpaqueExtAudioFile {
  constructor(init?: OpaqueExtAudioFile);
}

export declare class CAFPeakChunk {
  constructor(init?: CAFPeakChunk);
  mEditCount: number;
  mPeaks: unknown /* const array */;
}

export declare class CAFPositionPeak {
  constructor(init?: CAFPositionPeak);
  mValue: number;
  mFrameNumber: number;
}

export declare class CAFInfoStrings {
  constructor(init?: CAFInfoStrings);
  mNumEntries: number;
}

export declare class CAFStrings {
  constructor(init?: CAFStrings);
  mNumEntries: number;
  mStringsIDs: unknown /* const array */;
}

export declare class CAFStringID {
  constructor(init?: CAFStringID);
  mStringID: number;
  mStringStartByteOffset: number;
}

export declare class CAFInstrumentChunk {
  constructor(init?: CAFInstrumentChunk);
  mBaseNote: number;
  mMIDILowNote: number;
  mMIDIHighNote: number;
  mMIDILowVelocity: number;
  mMIDIHighVelocity: number;
  mdBGain: number;
  mStartRegionID: number;
  mSustainRegionID: number;
  mReleaseRegionID: number;
  mInstrumentID: number;
}

export declare class CAFRegion {
  constructor(init?: CAFRegion);
  mRegionID: number;
  mFlags: interop.Enum<typeof CAFRegionFlags>;
  mNumberMarkers: number;
  mMarkers: unknown /* const array */;
}

export declare class ScheduledAudioFileRegion {
  constructor(init?: ScheduledAudioFileRegion);
  mTimeStamp: AudioTimeStamp;
  mCompletionProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void | null;
  mCompletionProcUserData: interop.Pointer;
  mAudioFile: interop.Pointer;
  mLoopCount: number;
  mStartFrame: number;
  mFramesToPlay: number;
}

export declare class CAFMarker {
  constructor(init?: CAFMarker);
  mType: number;
  mFramePosition: number;
  mMarkerID: number;
  mSMPTETime: CAF_SMPTE_Time;
  mChannel: number;
}

export declare class CAFDataChunk {
  constructor(init?: CAFDataChunk);
  mEditCount: number;
  mData: unknown /* const array */;
}

export declare class CAFAudioFormatListItem {
  constructor(init?: CAFAudioFormatListItem);
  mFormat: CAFAudioDescription;
  mChannelLayoutTag: number;
}

export declare class CAFAudioDescription {
  constructor(init?: CAFAudioDescription);
  mSampleRate: number;
  mFormatID: number;
  mFormatFlags: interop.Enum<typeof CAFFormatFlags>;
  mBytesPerPacket: number;
  mFramesPerPacket: number;
  mChannelsPerFrame: number;
  mBitsPerChannel: number;
}

export declare class AUListenerBase {
  constructor(init?: AUListenerBase);
}

export declare class AudioQueueChannelAssignment {
  constructor(init?: AudioQueueChannelAssignment);
  mDeviceUID: interop.Object | null;
  mChannelNumber: number;
}

export declare class OpaqueAudioQueueProcessingTap {
  constructor(init?: OpaqueAudioQueueProcessingTap);
}

export declare class OpaqueAudioQueueTimeline {
  constructor(init?: OpaqueAudioQueueTimeline);
}

export declare class OpaqueAudioQueue {
  constructor(init?: OpaqueAudioQueue);
}

export declare class AudioFormatInfo {
  constructor(init?: AudioFormatInfo);
  mASBD: AudioStreamBasicDescription;
  mMagicCookie: interop.Pointer;
  mMagicCookieSize: number;
}

export declare class AudioPanningInfo {
  constructor(init?: AudioPanningInfo);
  mPanningMode: interop.Enum<typeof AudioPanningMode>;
  mCoordinateFlags: number;
  mCoordinates: unknown /* const array */;
  mGainScale: number;
  mOutputChannelMap: interop.Pointer;
}

export declare class OpaqueAudioFileStreamID {
  constructor(init?: OpaqueAudioFileStreamID);
}

export declare class AudioPacketRollDistanceTranslation {
  constructor(init?: AudioPacketRollDistanceTranslation);
  mPacket: number;
  mRollDistance: number;
}

export declare class AudioPacketRangeByteCountTranslation {
  constructor(init?: AudioPacketRangeByteCountTranslation);
  mPacket: number;
  mPacketCount: number;
  mByteCountUpperBound: number;
}

export declare class AudioFilePacketTableInfo {
  constructor(init?: AudioFilePacketTableInfo);
  mNumberValidFrames: number;
  mPrimingFrames: number;
  mRemainderFrames: number;
}

export declare class AudioFileRegionList {
  constructor(init?: AudioFileRegionList);
  mSMPTE_TimeType: number;
  mNumberRegions: number;
  mRegions: unknown /* const array */;
}

export declare class AudioFileRegion {
  constructor(init?: AudioFileRegion);
  mRegionID: number;
  mName: interop.Object | null;
  mFlags: interop.Enum<typeof AudioFileRegionFlags>;
  mNumberMarkers: number;
  mMarkers: unknown /* const array */;
}

export declare class AudioFileMarkerList {
  constructor(init?: AudioFileMarkerList);
  mSMPTE_TimeType: number;
  mNumberMarkers: number;
  mMarkers: unknown /* const array */;
}

export declare class AudioFileMarker {
  constructor(init?: AudioFileMarker);
  mFramePosition: number;
  mName: interop.Object | null;
  mMarkerID: number;
  mSMPTETime: AudioFile_SMPTE_Time;
  mType: number;
  mReserved: number;
  mChannel: number;
}

export declare class AudioConverterPrimeInfo {
  constructor(init?: AudioConverterPrimeInfo);
  leadingFrames: number;
  trailingFrames: number;
}

export declare class OpaqueAudioConverter {
  constructor(init?: OpaqueAudioConverter);
}

export declare class AudioUnitNodeConnection {
  constructor(init?: AudioUnitNodeConnection);
  sourceNode: number;
  sourceOutputNumber: number;
  destNode: number;
  destInputNumber: number;
}

export declare class AUMIDIEventList {
  constructor(init?: AUMIDIEventList);
  next: interop.Pointer;
  eventSampleTime: number;
  eventType: interop.Enum<typeof AURenderEventType>;
  reserved: number;
  cable: number;
  eventList: MIDIEventList;
}

export declare class AUMIDIEvent {
  constructor(init?: AUMIDIEvent);
  next: interop.Pointer;
  eventSampleTime: number;
  eventType: interop.Enum<typeof AURenderEventType>;
  reserved: number;
  length: number;
  cable: number;
  data: unknown /* const array */;
}

export declare class AURenderEventHeader {
  constructor(init?: AURenderEventHeader);
  next: interop.Pointer;
  eventSampleTime: number;
  eventType: interop.Enum<typeof AURenderEventType>;
  reserved: number;
}

export declare class AUParameterAutomationEvent {
  constructor(init?: AUParameterAutomationEvent);
  hostTime: number;
  address: number;
  value: number;
  eventType: interop.Enum<typeof AUParameterAutomationEventType>;
  reserved: number;
}

export declare class AURecordedParameterEvent {
  constructor(init?: AURecordedParameterEvent);
  hostTime: number;
  address: number;
  value: number;
}

export declare class AudioUnitMIDIControlMapping {
  constructor(init?: AudioUnitMIDIControlMapping);
  midiNRPN: number;
  midiControl: number;
  scope: number;
  element: number;
  parameter: number;
}

export declare class AUNumVersion {
  constructor(init?: AUNumVersion);
  nonRelRev: number;
  stage: number;
  minorAndBugRev: number;
  majorRev: number;
}

export declare class OpaqueAudioFileID {
  constructor(init?: OpaqueAudioFileID);
}

export declare class AudioUnitMeterClipping {
  constructor(init?: AudioUnitMeterClipping);
  peakValueSinceLastCall: number;
  sawInfinity: number;
  sawNotANumber: number;
}

export declare class AUSamplerBankPresetData {
  constructor(init?: AUSamplerBankPresetData);
  bankURL: interop.Object | null;
  bankMSB: number;
  bankLSB: number;
  presetID: number;
  reserved: number;
}

export declare class AUVoiceIOOtherAudioDuckingConfiguration {
  constructor(init?: AUVoiceIOOtherAudioDuckingConfiguration);
  mEnableAdvancedDucking: number;
  mDuckingLevel: interop.Enum<typeof AUVoiceIOOtherAudioDuckingLevel>;
}

export declare class AudioOutputUnitStartAtTimeParams {
  constructor(init?: AudioOutputUnitStartAtTimeParams);
  mTimestamp: AudioTimeStamp;
  mFlags: number;
}

export declare class unnamed_14620460738840462260 {
  constructor(init?: unnamed_14620460738840462260);
  inDistance: number;
  outGain: number;
}

export declare class AUDistanceAttenuationData {
  constructor(init?: AUDistanceAttenuationData);
  inNumberOfPairs: number;
  pairs: unknown /* const array */;
}

export declare class AUParameterMIDIMapping {
  constructor(init?: AUParameterMIDIMapping);
  mScope: number;
  mElement: number;
  mParameterID: number;
  mFlags: interop.Enum<typeof AUParameterMIDIMappingFlags>;
  mSubRangeMin: number;
  mSubRangeMax: number;
  mStatus: number;
  mData1: number;
  reserved1: number;
  reserved2: number;
  reserved3: number;
}

export declare class AudioUnitParameterValueFromString {
  constructor(init?: AudioUnitParameterValueFromString);
  inParamID: number;
  inString: interop.Object | null;
  outValue: number;
}

export declare class AudioUnitParameterStringFromValue {
  constructor(init?: AudioUnitParameterStringFromValue);
  inParamID: number;
  inValue: interop.Pointer;
  outString: interop.Object | null;
}

export declare class AudioUnitParameterNameInfo {
  constructor(init?: AudioUnitParameterNameInfo);
  inID: number;
  inDesiredLength: number;
  outName: interop.Object | null;
}

export declare class AUInputSamplesInOutputCallbackStruct {
  constructor(init?: AUInputSamplesInOutputCallbackStruct);
  inputToOutputCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void | null;
  userData: interop.Pointer;
}

export declare class MIDIPacketList {
  constructor(init?: MIDIPacketList);
  numPackets: number;
  packet: unknown /* const array */;
}

export declare class HostCallbackInfo {
  constructor(init?: HostCallbackInfo);
  hostUserData: interop.Pointer;
  beatAndTempoProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  musicalTimeLocationProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  transportStateProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
  transportStateProc2: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible) => number | null;
}

export declare class AudioUnitExternalBuffer {
  constructor(init?: AudioUnitExternalBuffer);
  buffer: interop.Pointer;
  size: number;
}

export declare class AudioUnitParameter {
  constructor(init?: AudioUnitParameter);
  mAudioUnit: interop.Pointer;
  mParameterID: number;
  mScope: number;
  mElement: number;
}

export declare class unnamed_8445170490944776183 {
  constructor(init?: unnamed_8445170490944776183);
  bufferOffset: number;
  value: number;
}

export declare class unnamed_5718025209024854476 {
  constructor(init?: unnamed_5718025209024854476);
  startBufferOffset: number;
  durationInFrames: number;
  startValue: number;
  endValue: number;
}

export declare class AudioUnitParameterEvent {
  constructor(init?: AudioUnitParameterEvent);
  scope: number;
  element: number;
  parameter: number;
  eventType: interop.Enum<typeof AUParameterEventType>;
  eventValues: unnamed_12225062337913078395;
}

export declare class AudioCodecPrimeInfo {
  constructor(init?: AudioCodecPrimeInfo);
  leadingFrames: number;
  trailingFrames: number;
}

export declare class AudioCodecMagicCookieInfo {
  constructor(init?: AudioCodecMagicCookieInfo);
  mMagicCookieSize: number;
  mMagicCookie: interop.Pointer;
}

export declare class OpaqueAudioComponent {
  constructor(init?: OpaqueAudioComponent);
}

export declare class AudioUnitParameterValueTranslation {
  constructor(init?: AudioUnitParameterValueTranslation);
  otherDesc: AudioUnitOtherPluginDesc;
  otherParamID: number;
  otherValue: number;
  auParamID: number;
  auValue: number;
}

export declare class MusicTrackLoopInfo {
  constructor(init?: MusicTrackLoopInfo);
  loopDuration: number;
  numberOfLoops: number;
}

export declare class AudioQueueBuffer {
  constructor(init?: AudioQueueBuffer);
  mAudioDataBytesCapacity: number;
  mAudioData: interop.Pointer;
  mAudioDataByteSize: number;
  mUserData: interop.Pointer;
  mPacketDescriptionCapacity: number;
  mPacketDescriptions: interop.Pointer;
  mPacketDescriptionCount: number;
}

export declare class CAFFileHeader {
  constructor(init?: CAFFileHeader);
  mFileType: number;
  mFileVersion: number;
  mFileFlags: number;
}

export declare class MixerDistanceParams {
  constructor(init?: MixerDistanceParams);
  mReferenceDistance: number;
  mMaxDistance: number;
  mMaxAttenuation: number;
}

export declare class CATempoMapEntry {
  constructor(init?: CATempoMapEntry);
  beats: number;
  tempoBPM: number;
}

export declare class MIDINoteMessage {
  constructor(init?: MIDINoteMessage);
  channel: number;
  note: number;
  velocity: number;
  releaseVelocity: number;
  duration: number;
}

export declare class AudioQueueLevelMeterState {
  constructor(init?: AudioQueueLevelMeterState);
  mAveragePower: number;
  mPeakPower: number;
}

export declare class ExtendedControlEvent {
  constructor(init?: ExtendedControlEvent);
  groupID: number;
  controlID: number;
  value: number;
}

export declare class AUHostIdentifier {
  constructor(init?: AUHostIdentifier);
  hostName: interop.Object | null;
  hostVersion: AUNumVersion;
}

export declare class AudioUnitParameterValueName {
  constructor(init?: AudioUnitParameterValueName);
  inParamID: number;
  inValue: interop.Pointer;
  outName: interop.Object | null;
}

export declare class ParameterEvent {
  constructor(init?: ParameterEvent);
  parameterID: number;
  scope: number;
  element: number;
  value: number;
}

export declare class CAFChunkHeader {
  constructor(init?: CAFChunkHeader);
  mChunkType: number;
  mChunkSize: number;
}

export declare class AUParameterEvent {
  constructor(init?: AUParameterEvent);
  next: interop.Pointer;
  eventSampleTime: number;
  eventType: interop.Enum<typeof AURenderEventType>;
  reserved: unknown /* const array */;
  rampDurationSampleFrames: number;
  parameterAddress: number;
  value: number;
}

export declare class AudioFileFDFTable {
  constructor(init?: AudioFileFDFTable);
  mComponentStorage: interop.Pointer;
  mReadBytesFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  mWriteBytesFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  mReadPacketsFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
  mWritePacketsFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
  mGetPropertyInfoFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  mGetPropertyFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  mSetPropertyFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  mCountUserDataFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  mGetUserDataSizeFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  mGetUserDataFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  mSetUserDataFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number | null;
}

export declare class AudioUnitCocoaViewInfo {
  constructor(init?: AudioUnitCocoaViewInfo);
  mCocoaAUViewBundleLocation: interop.Object | null;
  mCocoaAUViewClass: unknown /* const array */;
}

export declare class AUDependentParameter {
  constructor(init?: AUDependentParameter);
  mScope: number;
  mParameterID: number;
}

export declare class AudioUnitEvent {
  constructor(init?: AudioUnitEvent);
  mEventType: interop.Enum<typeof AudioUnitEventType>;
  mArgument: unnamed_501478680063556574;
}

export declare class AudioUnitParameterHistoryInfo {
  constructor(init?: AudioUnitParameterHistoryInfo);
  updatesPerSecond: number;
  historyDurationInSeconds: number;
}

export declare class AudioFramePacketTranslation {
  constructor(init?: AudioFramePacketTranslation);
  mFrame: number;
  mPacket: number;
  mFrameOffsetInPacket: number;
}

export declare class AudioUnitOtherPluginDesc {
  constructor(init?: AudioUnitOtherPluginDesc);
  format: number;
  plugin: AudioClassDescription;
}

export declare class AudioUnitParameterInfo {
  constructor(init?: AudioUnitParameterInfo);
  name: unknown /* const array */;
  unitName: interop.Object | null;
  clumpID: number;
  cfNameString: interop.Object | null;
  unit: interop.Enum<typeof AudioUnitParameterUnit>;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  flags: interop.Enum<typeof AudioUnitParameterOptions>;
}

export declare class AudioPacketDependencyInfoTranslation {
  constructor(init?: AudioPacketDependencyInfoTranslation);
  mPacket: number;
  mIsIndependentlyDecodable: number;
  mNumberPrerollPackets: number;
}

export declare class AudioFileTypeAndFormatID {
  constructor(init?: AudioFileTypeAndFormatID);
  mFileType: number;
  mFormatID: number;
}

export declare class CAFUMIDChunk {
  constructor(init?: CAFUMIDChunk);
  mBytes: unknown /* const array */;
}

export declare class MusicDeviceStdNoteParams {
  constructor(init?: MusicDeviceStdNoteParams);
  argCount: number;
  mPitch: number;
  mVelocity: number;
}

export declare class AudioUnitPresetMAS_SettingData {
  constructor(init?: AudioUnitPresetMAS_SettingData);
  isStockSetting: number;
  settingID: number;
  dataLen: number;
  data: unknown /* const array */;
}

export declare class AudioIndependentPacketTranslation {
  constructor(init?: AudioIndependentPacketTranslation);
  mPacket: number;
  mIndependentlyDecodablePacket: number;
}

export declare class MIDIEventList {
  constructor(init?: MIDIEventList);
  protocol: interop.Enum<typeof MIDIProtocolID>;
  numPackets: number;
  packet: unknown /* const array */;
}

export declare class NoteParamsControlValue {
  constructor(init?: NoteParamsControlValue);
  mID: number;
  mValue: number;
}

export declare class AudioUnitProperty {
  constructor(init?: AudioUnitProperty);
  mAudioUnit: interop.Pointer;
  mPropertyID: number;
  mScope: number;
  mElement: number;
}

export declare class CAFOverviewSample {
  constructor(init?: CAFOverviewSample);
  mMinValue: number;
  mMaxValue: number;
}

export declare class AUHostVersionIdentifier {
  constructor(init?: AUHostVersionIdentifier);
  hostName: interop.Object | null;
  hostVersion: number;
}

export declare class AUPreset {
  constructor(init?: AUPreset);
  presetNumber: number;
  presetName: interop.Object | null;
}

export declare class AudioOutputUnitMIDICallbacks {
  constructor(init?: AudioOutputUnitMIDICallbacks);
  userData: interop.Pointer;
  MIDIEventProc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  MIDISysExProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void | null;
}

export declare class AudioUnitFrequencyResponseBin {
  constructor(init?: AudioUnitFrequencyResponseBin);
  mFrequency: number;
  mMagnitude: number;
}

export declare class CAFPacketTableHeader {
  constructor(init?: CAFPacketTableHeader);
  mNumberPackets: number;
  mNumberValidFrames: number;
  mPrimingFrames: number;
  mRemainderFrames: number;
  mPacketDescriptions: unknown /* const array */;
}

export declare class AudioUnitRenderContext {
  constructor(init?: AudioUnitRenderContext);
  workgroup: OS_os_workgroup | null;
  reserved: unknown /* const array */;
}

export declare class CAF_UUID_ChunkHeader {
  constructor(init?: CAF_UUID_ChunkHeader);
  mHeader: CAFChunkHeader;
  mUUID: unknown /* const array */;
}

export declare class MIDIMetaEvent {
  constructor(init?: MIDIMetaEvent);
  metaEventType: number;
  unused1: number;
  unused2: number;
  unused3: number;
  dataLength: number;
  data: unknown /* const array */;
}

export declare class AudioBalanceFade {
  constructor(init?: AudioBalanceFade);
  mLeftRightBalance: number;
  mBackFrontFade: number;
  mType: interop.Enum<typeof AudioBalanceFadeType>;
  mChannelLayout: interop.Pointer;
}

export declare class CAClockTime {
  constructor(init?: CAClockTime);
  format: interop.Enum<typeof CAClockTimeFormat>;
  reserved: number;
  time: unnamed_8495746342208049701;
}

export declare class MIDIRawData {
  constructor(init?: MIDIRawData);
  length: number;
  data: unknown /* const array */;
}

export declare class AUMIDIOutputCallbackStruct {
  constructor(init?: AUMIDIOutputCallbackStruct);
  midiOutputCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number | null;
  userData: interop.Pointer;
}

export declare class OpaqueMusicPlayer {
  constructor(init?: OpaqueMusicPlayer);
}

export declare class AudioFileFDFTableExtended {
  constructor(init?: AudioFileFDFTableExtended);
  mComponentStorage: interop.Pointer;
  mReadBytesFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  mWriteBytesFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  mReadPacketsFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
  mWritePacketsFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
  mGetPropertyInfoFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  mGetPropertyFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  mSetPropertyFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  mCountUserDataFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  mGetUserDataSizeFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  mGetUserDataFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  mSetUserDataFDF: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number | null;
  mReadPacketDataFDF: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
}

export declare class AUChannelInfo {
  constructor(init?: AUChannelInfo);
  inChannels: number;
  outChannels: number;
}

export declare class CAFOverviewChunk {
  constructor(init?: CAFOverviewChunk);
  mEditCount: number;
  mNumFramesPerOVWSample: number;
  mData: unknown /* const array */;
}

export declare class AudioComponentPlugInInterface {
  constructor(init?: AudioComponentPlugInInterface);
  Open: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  Close: (p1: interop.PointerConvertible) => number | null;
  Lookup: (p1: number) => (p1: interop.PointerConvertible) => number | null;
  reserved: interop.Pointer;
}

export declare class AUNodeInteraction {
  constructor(init?: AUNodeInteraction);
  nodeInteractionType: number;
  nodeInteraction: unnamed_12926841200931729946;
}

export declare class CAF_SMPTE_Time {
  constructor(init?: CAF_SMPTE_Time);
  mHours: number;
  mMinutes: number;
  mSeconds: number;
  mFrames: number;
  mSubFrameSampleOffset: number;
}

export declare class OpaqueCAClock {
  constructor(init?: OpaqueCAClock);
}

export declare class AudioUnitConnection {
  constructor(init?: AudioUnitConnection);
  sourceAudioUnit: interop.Pointer;
  sourceOutputNumber: number;
  destInputNumber: number;
}

export declare class ScheduledAudioSlice {
  constructor(init?: ScheduledAudioSlice);
  mTimeStamp: AudioTimeStamp;
  mCompletionProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  mCompletionProcUserData: interop.Pointer;
  mFlags: interop.Enum<typeof AUScheduledAudioSliceFlags>;
  mReserved: number;
  mReserved2: interop.Pointer;
  mNumberFrames: number;
  mBufferList: interop.Pointer;
}

export declare class CAFMarkerChunk {
  constructor(init?: CAFMarkerChunk);
  mSMPTE_TimeType: number;
  mNumberMarkers: number;
  mMarkers: unknown /* const array */;
}

export declare class MusicDeviceNoteParams {
  constructor(init?: MusicDeviceNoteParams);
  argCount: number;
  mPitch: number;
  mVelocity: number;
  mControls: unknown /* const array */;
}

export declare class CAFRegionChunk {
  constructor(init?: CAFRegionChunk);
  mSMPTE_TimeType: number;
  mNumberRegions: number;
  mRegions: unknown /* const array */;
}

export declare class AUNodeRenderCallback {
  constructor(init?: AUNodeRenderCallback);
  destNode: number;
  destInputNumber: number;
  cback: AURenderCallbackStruct;
}

export declare class MusicEventUserData {
  constructor(init?: MusicEventUserData);
  length: number;
  data: unknown /* const array */;
}

export declare class AudioBytePacketTranslation {
  constructor(init?: AudioBytePacketTranslation);
  mByte: number;
  mPacket: number;
  mByteOffsetInPacket: number;
  mFlags: interop.Enum<typeof AudioBytePacketTranslationFlags>;
}

export declare class AudioComponentDescription {
  constructor(init?: AudioComponentDescription);
  componentType: number;
  componentSubType: number;
  componentManufacturer: number;
  componentFlags: number;
  componentFlagsMask: number;
}

export type unnamed_501478680063556574Descriptor = 
  | { mParameter: AudioUnitParameter }
  | { mProperty: AudioUnitProperty };

export declare class unnamed_501478680063556574 {
  constructor(init?: unnamed_501478680063556574Descriptor);
  mParameter: AudioUnitParameter;
  mProperty: AudioUnitProperty;
}

export type unnamed_8495746342208049701Descriptor = 
  | { hostTime: number }
  | { samples: number }
  | { beats: number }
  | { seconds: number }
  | { smpte: SMPTETime };

export declare class unnamed_8495746342208049701 {
  constructor(init?: unnamed_8495746342208049701Descriptor);
  hostTime: number;
  samples: number;
  beats: number;
  seconds: number;
  smpte: SMPTETime;
}

export type unnamed_12926841200931729946Descriptor = 
  | { connection: AudioUnitNodeConnection }
  | { inputCallback: AUNodeRenderCallback };

export declare class unnamed_12926841200931729946 {
  constructor(init?: unnamed_12926841200931729946Descriptor);
  connection: AudioUnitNodeConnection;
  inputCallback: AUNodeRenderCallback;
}

export type unnamed_12225062337913078395Descriptor = 
  | { ramp: unnamed_5718025209024854476 }
  | { immediate: unnamed_8445170490944776183 };

export declare class unnamed_12225062337913078395 {
  constructor(init?: unnamed_12225062337913078395Descriptor);
  ramp: unnamed_5718025209024854476;
  immediate: unnamed_8445170490944776183;
}

export type AURenderEventDescriptor = 
  | { head: AURenderEventHeader }
  | { parameter: AUParameterEvent }
  | { MIDI: AUMIDIEvent }
  | { MIDIEventsList: AUMIDIEventList };

export declare class AURenderEvent {
  constructor(init?: AURenderEventDescriptor);
  head: AURenderEventHeader;
  parameter: AUParameterEvent;
  MIDI: AUMIDIEvent;
  MIDIEventsList: AUMIDIEventList;
}

export declare function AudioComponentFindNext(inComponent: interop.PointerConvertible, inDesc: interop.PointerConvertible): interop.Pointer;

export declare function AudioComponentCount(inDesc: interop.PointerConvertible): number;

export declare function AudioComponentCopyName(inComponent: interop.PointerConvertible, outName: interop.PointerConvertible): number;

export declare function AudioComponentGetDescription(inComponent: interop.PointerConvertible, outDesc: interop.PointerConvertible): number;

export declare function AudioComponentGetVersion(inComponent: interop.PointerConvertible, outVersion: interop.PointerConvertible): number;

export declare function AudioComponentGetIcon(comp: interop.PointerConvertible): NSImage;

export declare function AudioComponentInstanceNew(inComponent: interop.PointerConvertible, outInstance: interop.PointerConvertible): number;

export declare function AudioComponentInstantiate(inComponent: interop.PointerConvertible, inOptions: interop.Enum<typeof AudioComponentInstantiationOptions>, inCompletionHandler: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function AudioComponentInstanceDispose(inInstance: interop.PointerConvertible): number;

export declare function AudioComponentInstanceGetComponent(inInstance: interop.PointerConvertible): interop.Pointer;

export declare function AudioComponentInstanceCanDo(inInstance: interop.PointerConvertible, inSelectorID: number): number;

export declare function AudioComponentRegister(inDesc: interop.PointerConvertible, inName: interop.Object, inVersion: number, inFactory: (p1: interop.PointerConvertible) => interop.Pointer): interop.Pointer;

export declare function AudioComponentCopyConfigurationInfo(inComponent: interop.PointerConvertible, outConfigurationInfo: interop.PointerConvertible): number;

export declare function AudioComponentValidate(inComponent: interop.PointerConvertible, inValidationParameters: interop.Object, outValidationResult: interop.PointerConvertible): number;

export declare function AudioCodecGetPropertyInfo(inCodec: interop.PointerConvertible, inPropertyID: number, outSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioCodecGetProperty(inCodec: interop.PointerConvertible, inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioCodecSetProperty(inCodec: interop.PointerConvertible, inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioCodecInitialize(inCodec: interop.PointerConvertible, inInputFormat: interop.PointerConvertible, inOutputFormat: interop.PointerConvertible, inMagicCookie: interop.PointerConvertible, inMagicCookieByteSize: number): number;

export declare function AudioCodecUninitialize(inCodec: interop.PointerConvertible): number;

export declare function AudioCodecAppendInputData(inCodec: interop.PointerConvertible, inInputData: interop.PointerConvertible, ioInputDataByteSize: interop.PointerConvertible, ioNumberPackets: interop.PointerConvertible, inPacketDescription: interop.PointerConvertible): number;

export declare function AudioCodecProduceOutputPackets(inCodec: interop.PointerConvertible, outOutputData: interop.PointerConvertible, ioOutputDataByteSize: interop.PointerConvertible, ioNumberPackets: interop.PointerConvertible, outPacketDescription: interop.PointerConvertible, outStatus: interop.PointerConvertible): number;

export declare function AudioCodecAppendInputBufferList(inCodec: interop.PointerConvertible, inBufferList: interop.PointerConvertible, ioNumberPackets: interop.PointerConvertible, inPacketDescription: interop.PointerConvertible, outBytesConsumed: interop.PointerConvertible): number;

export declare function AudioCodecProduceOutputBufferList(inCodec: interop.PointerConvertible, ioBufferList: interop.PointerConvertible, ioNumberPackets: interop.PointerConvertible, outPacketDescription: interop.PointerConvertible, outStatus: interop.PointerConvertible): number;

export declare function AudioCodecReset(inCodec: interop.PointerConvertible): number;

export declare function AudioUnitInitialize(inUnit: interop.PointerConvertible): number;

export declare function AudioUnitUninitialize(inUnit: interop.PointerConvertible): number;

export declare function AudioUnitGetPropertyInfo(inUnit: interop.PointerConvertible, inID: number, inScope: number, inElement: number, outDataSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioUnitGetProperty(inUnit: interop.PointerConvertible, inID: number, inScope: number, inElement: number, outData: interop.PointerConvertible, ioDataSize: interop.PointerConvertible): number;

export declare function AudioUnitSetProperty(inUnit: interop.PointerConvertible, inID: number, inScope: number, inElement: number, inData: interop.PointerConvertible, inDataSize: number): number;

export declare function AudioUnitAddPropertyListener(inUnit: interop.PointerConvertible, inID: number, inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number) => void, inProcUserData: interop.PointerConvertible): number;

export declare function AudioUnitRemovePropertyListenerWithUserData(inUnit: interop.PointerConvertible, inID: number, inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number) => void, inProcUserData: interop.PointerConvertible): number;

export declare function AudioUnitAddRenderNotify(inUnit: interop.PointerConvertible, inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: number, p6: interop.PointerConvertible) => number, inProcUserData: interop.PointerConvertible): number;

export declare function AudioUnitRemoveRenderNotify(inUnit: interop.PointerConvertible, inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: number, p6: interop.PointerConvertible) => number, inProcUserData: interop.PointerConvertible): number;

export declare function AudioUnitGetParameter(inUnit: interop.PointerConvertible, inID: number, inScope: number, inElement: number, outValue: interop.PointerConvertible): number;

export declare function AudioUnitSetParameter(inUnit: interop.PointerConvertible, inID: number, inScope: number, inElement: number, inValue: number, inBufferOffsetInFrames: number): number;

export declare function AudioUnitScheduleParameters(inUnit: interop.PointerConvertible, inParameterEvent: interop.PointerConvertible, inNumParamEvents: number): number;

export declare function AudioUnitRender(inUnit: interop.PointerConvertible, ioActionFlags: interop.PointerConvertible, inTimeStamp: interop.PointerConvertible, inOutputBusNumber: number, inNumberFrames: number, ioData: interop.PointerConvertible): number;

export declare function AudioUnitProcess(inUnit: interop.PointerConvertible, ioActionFlags: interop.PointerConvertible, inTimeStamp: interop.PointerConvertible, inNumberFrames: number, ioData: interop.PointerConvertible): number;

export declare function AudioUnitProcessMultiple(inUnit: interop.PointerConvertible, ioActionFlags: interop.PointerConvertible, inTimeStamp: interop.PointerConvertible, inNumberFrames: number, inNumberInputBufferLists: number, inInputBufferLists: interop.PointerConvertible, inNumberOutputBufferLists: number, ioOutputBufferLists: interop.PointerConvertible): number;

export declare function AudioUnitReset(inUnit: interop.PointerConvertible, inScope: number, inElement: number): number;

export declare function AudioComponentCopyIcon(comp: interop.PointerConvertible): NSImage;

export declare function AudioUnitExtensionSetComponentList(extensionIdentifier: interop.Object, audioComponentInfo: interop.Object): number;

export declare function AudioUnitExtensionCopyComponentList(extensionIdentifier: interop.Object): interop.Object;

export declare function AudioOutputUnitStart(ci: interop.PointerConvertible): number;

export declare function AudioOutputUnitStop(ci: interop.PointerConvertible): number;

export declare function MusicDeviceMIDIEvent(inUnit: interop.PointerConvertible, inStatus: number, inData1: number, inData2: number, inOffsetSampleFrame: number): number;

export declare function MusicDeviceSysEx(inUnit: interop.PointerConvertible, inData: interop.PointerConvertible, inLength: number): number;

export declare function MusicDeviceStartNote(inUnit: interop.PointerConvertible, inInstrument: number, inGroupID: number, outNoteInstanceID: interop.PointerConvertible, inOffsetSampleFrame: number, inParams: interop.PointerConvertible): number;

export declare function MusicDeviceStopNote(inUnit: interop.PointerConvertible, inGroupID: number, inNoteInstanceID: number, inOffsetSampleFrame: number): number;

export declare function MusicDevicePrepareInstrument(inUnit: interop.PointerConvertible, inInstrument: number): number;

export declare function MusicDeviceReleaseInstrument(inUnit: interop.PointerConvertible, inInstrument: number): number;

export declare function NewAUGraph(outGraph: interop.PointerConvertible): number;

export declare function DisposeAUGraph(inGraph: interop.PointerConvertible): number;

export declare function AUGraphAddNode(inGraph: interop.PointerConvertible, inDescription: interop.PointerConvertible, outNode: interop.PointerConvertible): number;

export declare function AUGraphRemoveNode(inGraph: interop.PointerConvertible, inNode: number): number;

export declare function AUGraphGetNodeCount(inGraph: interop.PointerConvertible, outNumberOfNodes: interop.PointerConvertible): number;

export declare function AUGraphGetIndNode(inGraph: interop.PointerConvertible, inIndex: number, outNode: interop.PointerConvertible): number;

export declare function AUGraphNodeInfo(inGraph: interop.PointerConvertible, inNode: number, outDescription: interop.PointerConvertible, outAudioUnit: interop.PointerConvertible): number;

export declare function AUGraphNewNodeSubGraph(inGraph: interop.PointerConvertible, outNode: interop.PointerConvertible): number;

export declare function AUGraphGetNodeInfoSubGraph(inGraph: interop.PointerConvertible, inNode: number, outSubGraph: interop.PointerConvertible): number;

export declare function AUGraphIsNodeSubGraph(inGraph: interop.PointerConvertible, inNode: number, outFlag: interop.PointerConvertible): number;

export declare function AUGraphConnectNodeInput(inGraph: interop.PointerConvertible, inSourceNode: number, inSourceOutputNumber: number, inDestNode: number, inDestInputNumber: number): number;

export declare function AUGraphSetNodeInputCallback(inGraph: interop.PointerConvertible, inDestNode: number, inDestInputNumber: number, inInputCallback: interop.PointerConvertible): number;

export declare function AUGraphDisconnectNodeInput(inGraph: interop.PointerConvertible, inDestNode: number, inDestInputNumber: number): number;

export declare function AUGraphClearConnections(inGraph: interop.PointerConvertible): number;

export declare function AUGraphGetNumberOfInteractions(inGraph: interop.PointerConvertible, outNumInteractions: interop.PointerConvertible): number;

export declare function AUGraphGetInteractionInfo(inGraph: interop.PointerConvertible, inInteractionIndex: number, outInteraction: interop.PointerConvertible): number;

export declare function AUGraphCountNodeInteractions(inGraph: interop.PointerConvertible, inNode: number, outNumInteractions: interop.PointerConvertible): number;

export declare function AUGraphGetNodeInteractions(inGraph: interop.PointerConvertible, inNode: number, ioNumInteractions: interop.PointerConvertible, outInteractions: interop.PointerConvertible): number;

export declare function AUGraphUpdate(inGraph: interop.PointerConvertible, outIsUpdated: interop.PointerConvertible): number;

export declare function AUGraphOpen(inGraph: interop.PointerConvertible): number;

export declare function AUGraphClose(inGraph: interop.PointerConvertible): number;

export declare function AUGraphInitialize(inGraph: interop.PointerConvertible): number;

export declare function AUGraphUninitialize(inGraph: interop.PointerConvertible): number;

export declare function AUGraphStart(inGraph: interop.PointerConvertible): number;

export declare function AUGraphStop(inGraph: interop.PointerConvertible): number;

export declare function AUGraphIsOpen(inGraph: interop.PointerConvertible, outIsOpen: interop.PointerConvertible): number;

export declare function AUGraphIsInitialized(inGraph: interop.PointerConvertible, outIsInitialized: interop.PointerConvertible): number;

export declare function AUGraphIsRunning(inGraph: interop.PointerConvertible, outIsRunning: interop.PointerConvertible): number;

export declare function AUGraphGetCPULoad(inGraph: interop.PointerConvertible, outAverageCPULoad: interop.PointerConvertible): number;

export declare function AUGraphGetMaxCPULoad(inGraph: interop.PointerConvertible, outMaxLoad: interop.PointerConvertible): number;

export declare function AUGraphAddRenderNotify(inGraph: interop.PointerConvertible, inCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: number, p6: interop.PointerConvertible) => number, inRefCon: interop.PointerConvertible): number;

export declare function AUGraphRemoveRenderNotify(inGraph: interop.PointerConvertible, inCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: number, p6: interop.PointerConvertible) => number, inRefCon: interop.PointerConvertible): number;

export declare function AUGraphNewNode(inGraph: interop.PointerConvertible, inDescription: interop.PointerConvertible, inClassDataSize: number, inClassData: interop.PointerConvertible, outNode: interop.PointerConvertible): number;

export declare function AUGraphGetNodeInfo(inGraph: interop.PointerConvertible, inNode: number, outDescription: interop.PointerConvertible, outClassDataSize: interop.PointerConvertible, outClassData: interop.PointerConvertible, outAudioUnit: interop.PointerConvertible): number;

export declare function AUGraphGetNumberOfConnections(inGraph: interop.PointerConvertible, outNumConnections: interop.PointerConvertible): number;

export declare function AUGraphGetConnectionInfo(inGraph: interop.PointerConvertible, inConnectionIndex: number, outSourceNode: interop.PointerConvertible, outSourceOutputNumber: interop.PointerConvertible, outDestNode: interop.PointerConvertible, outDestInputNumber: interop.PointerConvertible): number;

export declare function AUGraphCountNodeConnections(inGraph: interop.PointerConvertible, inNode: number, outNumConnections: interop.PointerConvertible): number;

export declare function AUGraphGetNodeConnections(inGraph: interop.PointerConvertible, inNode: number, outConnections: interop.PointerConvertible, ioNumConnections: interop.PointerConvertible): number;

export declare function AudioConverterNew(inSourceFormat: interop.PointerConvertible, inDestinationFormat: interop.PointerConvertible, outAudioConverter: interop.PointerConvertible): number;

export declare function AudioConverterNewSpecific(inSourceFormat: interop.PointerConvertible, inDestinationFormat: interop.PointerConvertible, inNumberClassDescriptions: number, inClassDescriptions: interop.PointerConvertible, outAudioConverter: interop.PointerConvertible): number;

export declare function AudioConverterDispose(inAudioConverter: interop.PointerConvertible): number;

export declare function AudioConverterReset(inAudioConverter: interop.PointerConvertible): number;

export declare function AudioConverterGetPropertyInfo(inAudioConverter: interop.PointerConvertible, inPropertyID: number, outSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioConverterGetProperty(inAudioConverter: interop.PointerConvertible, inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioConverterSetProperty(inAudioConverter: interop.PointerConvertible, inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioConverterConvertBuffer(inAudioConverter: interop.PointerConvertible, inInputDataSize: number, inInputData: interop.PointerConvertible, ioOutputDataSize: interop.PointerConvertible, outOutputData: interop.PointerConvertible): number;

export declare function AudioConverterFillComplexBuffer(inAudioConverter: interop.PointerConvertible, inInputDataProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inInputDataProcUserData: interop.PointerConvertible, ioOutputDataPacketSize: interop.PointerConvertible, outOutputData: interop.PointerConvertible, outPacketDescription: interop.PointerConvertible): number;

export declare function AudioConverterConvertComplexBuffer(inAudioConverter: interop.PointerConvertible, inNumberPCMFrames: number, inInputData: interop.PointerConvertible, outOutputData: interop.PointerConvertible): number;

export declare function AudioConverterFillBuffer(inAudioConverter: interop.PointerConvertible, inInputDataProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, inInputDataProcUserData: interop.PointerConvertible, ioOutputDataSize: interop.PointerConvertible, outOutputData: interop.PointerConvertible): number;

export declare function AudioFileCreateWithURL(inFileRef: interop.Object, inFileType: number, inFormat: interop.PointerConvertible, inFlags: interop.Enum<typeof AudioFileFlags>, outAudioFile: interop.PointerConvertible): number;

export declare function AudioFileOpenURL(inFileRef: interop.Object, inPermissions: interop.Enum<typeof AudioFilePermissions>, inFileTypeHint: number, outAudioFile: interop.PointerConvertible): number;

export declare function AudioFileInitializeWithCallbacks(inClientData: interop.PointerConvertible, inReadFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inWriteFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inGetSizeFunc: (p1: interop.PointerConvertible) => number, inSetSizeFunc: (p1: interop.PointerConvertible, p2: number) => number, inFileType: number, inFormat: interop.PointerConvertible, inFlags: interop.Enum<typeof AudioFileFlags>, outAudioFile: interop.PointerConvertible): number;

export declare function AudioFileOpenWithCallbacks(inClientData: interop.PointerConvertible, inReadFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inWriteFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inGetSizeFunc: (p1: interop.PointerConvertible) => number, inSetSizeFunc: (p1: interop.PointerConvertible, p2: number) => number, inFileTypeHint: number, outAudioFile: interop.PointerConvertible): number;

export declare function AudioFileClose(inAudioFile: interop.PointerConvertible): number;

export declare function AudioFileOptimize(inAudioFile: interop.PointerConvertible): number;

export declare function AudioFileReadBytes(inAudioFile: interop.PointerConvertible, inUseCache: number, inStartingByte: number, ioNumBytes: interop.PointerConvertible, outBuffer: interop.PointerConvertible): number;

export declare function AudioFileWriteBytes(inAudioFile: interop.PointerConvertible, inUseCache: number, inStartingByte: number, ioNumBytes: interop.PointerConvertible, inBuffer: interop.PointerConvertible): number;

export declare function AudioFileReadPacketData(inAudioFile: interop.PointerConvertible, inUseCache: number, ioNumBytes: interop.PointerConvertible, outPacketDescriptions: interop.PointerConvertible, inStartingPacket: number, ioNumPackets: interop.PointerConvertible, outBuffer: interop.PointerConvertible): number;

export declare function AudioFileReadPackets(inAudioFile: interop.PointerConvertible, inUseCache: number, outNumBytes: interop.PointerConvertible, outPacketDescriptions: interop.PointerConvertible, inStartingPacket: number, ioNumPackets: interop.PointerConvertible, outBuffer: interop.PointerConvertible): number;

export declare function AudioFileWritePackets(inAudioFile: interop.PointerConvertible, inUseCache: number, inNumBytes: number, inPacketDescriptions: interop.PointerConvertible, inStartingPacket: number, ioNumPackets: interop.PointerConvertible, inBuffer: interop.PointerConvertible): number;

export declare function AudioFileCountUserData(inAudioFile: interop.PointerConvertible, inUserDataID: number, outNumberItems: interop.PointerConvertible): number;

export declare function AudioFileGetUserDataSize(inAudioFile: interop.PointerConvertible, inUserDataID: number, inIndex: number, outUserDataSize: interop.PointerConvertible): number;

export declare function AudioFileGetUserData(inAudioFile: interop.PointerConvertible, inUserDataID: number, inIndex: number, ioUserDataSize: interop.PointerConvertible, outUserData: interop.PointerConvertible): number;

export declare function AudioFileSetUserData(inAudioFile: interop.PointerConvertible, inUserDataID: number, inIndex: number, inUserDataSize: number, inUserData: interop.PointerConvertible): number;

export declare function AudioFileRemoveUserData(inAudioFile: interop.PointerConvertible, inUserDataID: number, inIndex: number): number;

export declare function AudioFileGetPropertyInfo(inAudioFile: interop.PointerConvertible, inPropertyID: number, outDataSize: interop.PointerConvertible, isWritable: interop.PointerConvertible): number;

export declare function AudioFileGetProperty(inAudioFile: interop.PointerConvertible, inPropertyID: number, ioDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioFileSetProperty(inAudioFile: interop.PointerConvertible, inPropertyID: number, inDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioFileGetGlobalInfoSize(inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, outDataSize: interop.PointerConvertible): number;

export declare function AudioFileGetGlobalInfo(inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, ioDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioFileCreate(inParentRef: interop.PointerConvertible, inFileName: interop.Object, inFileType: number, inFormat: interop.PointerConvertible, inFlags: interop.Enum<typeof AudioFileFlags>, outNewFileRef: interop.PointerConvertible, outAudioFile: interop.PointerConvertible): number;

export declare function AudioFileInitialize(inFileRef: interop.PointerConvertible, inFileType: number, inFormat: interop.PointerConvertible, inFlags: interop.Enum<typeof AudioFileFlags>, outAudioFile: interop.PointerConvertible): number;

export declare function AudioFileOpen(inFileRef: interop.PointerConvertible, inPermissions: interop.Enum<typeof AudioFilePermissions>, inFileTypeHint: number, outAudioFile: interop.PointerConvertible): number;

export declare function AudioFileStreamOpen(inClientData: interop.PointerConvertible, inPropertyListenerProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void, inPacketsProc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void, inFileTypeHint: number, outAudioFileStream: interop.PointerConvertible): number;

export declare function AudioFileStreamParseBytes(inAudioFileStream: interop.PointerConvertible, inDataByteSize: number, inData: interop.PointerConvertible, inFlags: interop.Enum<typeof AudioFileStreamParseFlags>): number;

export declare function AudioFileStreamSeek(inAudioFileStream: interop.PointerConvertible, inPacketOffset: number, outDataByteOffset: interop.PointerConvertible, ioFlags: interop.PointerConvertible): number;

export declare function AudioFileStreamGetPropertyInfo(inAudioFileStream: interop.PointerConvertible, inPropertyID: number, outPropertyDataSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioFileStreamGetProperty(inAudioFileStream: interop.PointerConvertible, inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioFileStreamSetProperty(inAudioFileStream: interop.PointerConvertible, inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioFileStreamClose(inAudioFileStream: interop.PointerConvertible): number;

export declare function AudioFormatGetPropertyInfo(inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, outPropertyDataSize: interop.PointerConvertible): number;

export declare function AudioFormatGetProperty(inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioQueueNewOutput(inFormat: interop.PointerConvertible, inCallbackProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, inUserData: interop.PointerConvertible, inCallbackRunLoop: interop.Object, inCallbackRunLoopMode: interop.Object, inFlags: number, outAQ: interop.PointerConvertible): number;

export declare function AudioQueueNewInput(inFormat: interop.PointerConvertible, inCallbackProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible) => void, inUserData: interop.PointerConvertible, inCallbackRunLoop: interop.Object, inCallbackRunLoopMode: interop.Object, inFlags: number, outAQ: interop.PointerConvertible): number;

export declare function AudioQueueNewOutputWithDispatchQueue(outAQ: interop.PointerConvertible, inFormat: interop.PointerConvertible, inFlags: number, inCallbackDispatchQueue: NSObject, inCallbackBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): number;

export declare function AudioQueueNewInputWithDispatchQueue(outAQ: interop.PointerConvertible, inFormat: interop.PointerConvertible, inFlags: number, inCallbackDispatchQueue: NSObject, inCallbackBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => void): number;

export declare function AudioQueueDispose(inAQ: interop.PointerConvertible, inImmediate: number): number;

export declare function AudioQueueAllocateBuffer(inAQ: interop.PointerConvertible, inBufferByteSize: number, outBuffer: interop.PointerConvertible): number;

export declare function AudioQueueAllocateBufferWithPacketDescriptions(inAQ: interop.PointerConvertible, inBufferByteSize: number, inNumberPacketDescriptions: number, outBuffer: interop.PointerConvertible): number;

export declare function AudioQueueFreeBuffer(inAQ: interop.PointerConvertible, inBuffer: interop.PointerConvertible): number;

export declare function AudioQueueEnqueueBuffer(inAQ: interop.PointerConvertible, inBuffer: interop.PointerConvertible, inNumPacketDescs: number, inPacketDescs: interop.PointerConvertible): number;

export declare function AudioQueueEnqueueBufferWithParameters(inAQ: interop.PointerConvertible, inBuffer: interop.PointerConvertible, inNumPacketDescs: number, inPacketDescs: interop.PointerConvertible, inTrimFramesAtStart: number, inTrimFramesAtEnd: number, inNumParamValues: number, inParamValues: interop.PointerConvertible, inStartTime: interop.PointerConvertible, outActualStartTime: interop.PointerConvertible): number;

export declare function AudioQueueStart(inAQ: interop.PointerConvertible, inStartTime: interop.PointerConvertible): number;

export declare function AudioQueuePrime(inAQ: interop.PointerConvertible, inNumberOfFramesToPrepare: number, outNumberOfFramesPrepared: interop.PointerConvertible): number;

export declare function AudioQueueStop(inAQ: interop.PointerConvertible, inImmediate: number): number;

export declare function AudioQueuePause(inAQ: interop.PointerConvertible): number;

export declare function AudioQueueFlush(inAQ: interop.PointerConvertible): number;

export declare function AudioQueueReset(inAQ: interop.PointerConvertible): number;

export declare function AudioQueueGetParameter(inAQ: interop.PointerConvertible, inParamID: number, outValue: interop.PointerConvertible): number;

export declare function AudioQueueSetParameter(inAQ: interop.PointerConvertible, inParamID: number, inValue: number): number;

export declare function AudioQueueGetProperty(inAQ: interop.PointerConvertible, inID: number, outData: interop.PointerConvertible, ioDataSize: interop.PointerConvertible): number;

export declare function AudioQueueSetProperty(inAQ: interop.PointerConvertible, inID: number, inData: interop.PointerConvertible, inDataSize: number): number;

export declare function AudioQueueGetPropertySize(inAQ: interop.PointerConvertible, inID: number, outDataSize: interop.PointerConvertible): number;

export declare function AudioQueueAddPropertyListener(inAQ: interop.PointerConvertible, inID: number, inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void, inUserData: interop.PointerConvertible): number;

export declare function AudioQueueRemovePropertyListener(inAQ: interop.PointerConvertible, inID: number, inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void, inUserData: interop.PointerConvertible): number;

export declare function AudioQueueCreateTimeline(inAQ: interop.PointerConvertible, outTimeline: interop.PointerConvertible): number;

export declare function AudioQueueDisposeTimeline(inAQ: interop.PointerConvertible, inTimeline: interop.PointerConvertible): number;

export declare function AudioQueueGetCurrentTime(inAQ: interop.PointerConvertible, inTimeline: interop.PointerConvertible, outTimeStamp: interop.PointerConvertible, outTimelineDiscontinuity: interop.PointerConvertible): number;

export declare function AudioQueueDeviceGetCurrentTime(inAQ: interop.PointerConvertible, outTimeStamp: interop.PointerConvertible): number;

export declare function AudioQueueDeviceTranslateTime(inAQ: interop.PointerConvertible, inTime: interop.PointerConvertible, outTime: interop.PointerConvertible): number;

export declare function AudioQueueDeviceGetNearestStartTime(inAQ: interop.PointerConvertible, ioRequestedStartTime: interop.PointerConvertible, inFlags: number): number;

export declare function AudioQueueSetOfflineRenderFormat(inAQ: interop.PointerConvertible, inFormat: interop.PointerConvertible, inLayout: interop.PointerConvertible): number;

export declare function AudioQueueOfflineRender(inAQ: interop.PointerConvertible, inTimestamp: interop.PointerConvertible, ioBuffer: interop.PointerConvertible, inNumberFrames: number): number;

export declare function AudioQueueProcessingTapNew(inAQ: interop.PointerConvertible, inCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => void, inClientData: interop.PointerConvertible, inFlags: interop.Enum<typeof AudioQueueProcessingTapFlags>, outMaxFrames: interop.PointerConvertible, outProcessingFormat: interop.PointerConvertible, outAQTap: interop.PointerConvertible): number;

export declare function AudioQueueProcessingTapDispose(inAQTap: interop.PointerConvertible): number;

export declare function AudioQueueProcessingTapGetSourceAudio(inAQTap: interop.PointerConvertible, inNumberFrames: number, ioTimeStamp: interop.PointerConvertible, outFlags: interop.PointerConvertible, outNumberFrames: interop.PointerConvertible, ioData: interop.PointerConvertible): number;

export declare function AudioQueueProcessingTapGetQueueTime(inAQTap: interop.PointerConvertible, outQueueSampleTime: interop.PointerConvertible, outQueueFrameCount: interop.PointerConvertible): number;

export declare function AudioHardwareServiceHasProperty(inObjectID: number, inAddress: interop.PointerConvertible): number;

export declare function AudioHardwareServiceIsPropertySettable(inObjectID: number, inAddress: interop.PointerConvertible, outIsSettable: interop.PointerConvertible): number;

export declare function AudioHardwareServiceGetPropertyDataSize(inObjectID: number, inAddress: interop.PointerConvertible, inQualifierDataSize: number, inQualifierData: interop.PointerConvertible, outDataSize: interop.PointerConvertible): number;

export declare function AudioHardwareServiceGetPropertyData(inObjectID: number, inAddress: interop.PointerConvertible, inQualifierDataSize: number, inQualifierData: interop.PointerConvertible, ioDataSize: interop.PointerConvertible, outData: interop.PointerConvertible): number;

export declare function AudioHardwareServiceSetPropertyData(inObjectID: number, inAddress: interop.PointerConvertible, inQualifierDataSize: number, inQualifierData: interop.PointerConvertible, inDataSize: number, inData: interop.PointerConvertible): number;

export declare function AudioHardwareServiceAddPropertyListener(inObjectID: number, inAddress: interop.PointerConvertible, inListener: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioHardwareServiceRemovePropertyListener(inObjectID: number, inAddress: interop.PointerConvertible, inListener: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioServicesCreateSystemSoundID(inFileURL: interop.Object, outSystemSoundID: interop.PointerConvertible): number;

export declare function AudioServicesDisposeSystemSoundID(inSystemSoundID: number): number;

export declare function AudioServicesPlayAlertSoundWithCompletion(inSystemSoundID: number, inCompletionBlock: () => void): void;

export declare function AudioServicesPlaySystemSoundWithCompletion(inSystemSoundID: number, inCompletionBlock: () => void): void;

export declare function AudioServicesGetPropertyInfo(inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, outPropertyDataSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioServicesGetProperty(inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioServicesSetProperty(inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioServicesPlayAlertSound(inSystemSoundID: number): void;

export declare function AudioServicesPlaySystemSound(inSystemSoundID: number): void;

export declare function AudioServicesAddSystemSoundCompletion(inSystemSoundID: number, inRunLoop: interop.Object, inRunLoopMode: interop.Object, inCompletionRoutine: (p1: number, p2: interop.PointerConvertible) => void, inClientData: interop.PointerConvertible): number;

export declare function AudioServicesRemoveSystemSoundCompletion(inSystemSoundID: number): void;

export declare function AUListenerCreateWithDispatchQueue(outListener: interop.PointerConvertible, inNotificationInterval: number, inDispatchQueue: NSObject, inBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void): number;

export declare function AUListenerCreate(inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number) => void, inUserData: interop.PointerConvertible, inRunLoop: interop.Object, inRunLoopMode: interop.Object, inNotificationInterval: number, outListener: interop.PointerConvertible): number;

export declare function AUListenerDispose(inListener: interop.PointerConvertible): number;

export declare function AUListenerAddParameter(inListener: interop.PointerConvertible, inObject: interop.PointerConvertible, inParameter: interop.PointerConvertible): number;

export declare function AUListenerRemoveParameter(inListener: interop.PointerConvertible, inObject: interop.PointerConvertible, inParameter: interop.PointerConvertible): number;

export declare function AUParameterSet(inSendingListener: interop.PointerConvertible, inSendingObject: interop.PointerConvertible, inParameter: interop.PointerConvertible, inValue: number, inBufferOffsetInFrames: number): number;

export declare function AUParameterListenerNotify(inSendingListener: interop.PointerConvertible, inSendingObject: interop.PointerConvertible, inParameter: interop.PointerConvertible): number;

export declare function AUEventListenerCreateWithDispatchQueue(outListener: interop.PointerConvertible, inNotificationInterval: number, inValueChangeGranularity: number, inDispatchQueue: NSObject, inBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void): number;

export declare function AUEventListenerCreate(inProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: number) => void, inUserData: interop.PointerConvertible, inRunLoop: interop.Object, inRunLoopMode: interop.Object, inNotificationInterval: number, inValueChangeGranularity: number, outListener: interop.PointerConvertible): number;

export declare function AUEventListenerAddEventType(inListener: interop.PointerConvertible, inObject: interop.PointerConvertible, inEvent: interop.PointerConvertible): number;

export declare function AUEventListenerRemoveEventType(inListener: interop.PointerConvertible, inObject: interop.PointerConvertible, inEvent: interop.PointerConvertible): number;

export declare function AUEventListenerNotify(inSendingListener: interop.PointerConvertible, inSendingObject: interop.PointerConvertible, inEvent: interop.PointerConvertible): number;

export declare function AUParameterValueFromLinear(inLinearValue: number, inParameter: interop.PointerConvertible): number;

export declare function AUParameterValueToLinear(inParameterValue: number, inParameter: interop.PointerConvertible): number;

export declare function AUParameterFormatValue(inParameterValue: number, inParameter: interop.PointerConvertible, inTextBuffer: string, inDigits: number): string;

export declare function AudioWorkIntervalCreate(name: string, clock: interop.Enum<typeof os_clockid_t>, attr: interop.PointerConvertible): OS_os_workgroup;

export declare function CAShow(inObject: interop.PointerConvertible): void;

export declare function CAShowFile(inObject: interop.PointerConvertible, inFile: interop.PointerConvertible): void;

export declare function ExtAudioFileOpenURL(inURL: interop.Object, outExtAudioFile: interop.PointerConvertible): number;

export declare function ExtAudioFileWrapAudioFileID(inFileID: interop.PointerConvertible, inForWriting: number, outExtAudioFile: interop.PointerConvertible): number;

export declare function ExtAudioFileCreateWithURL(inURL: interop.Object, inFileType: number, inStreamDesc: interop.PointerConvertible, inChannelLayout: interop.PointerConvertible, inFlags: number, outExtAudioFile: interop.PointerConvertible): number;

export declare function ExtAudioFileOpen(inFSRef: interop.PointerConvertible, outExtAudioFile: interop.PointerConvertible): number;

export declare function ExtAudioFileCreateNew(inParentDir: interop.PointerConvertible, inFileName: interop.Object, inFileType: number, inStreamDesc: interop.PointerConvertible, inChannelLayout: interop.PointerConvertible, outExtAudioFile: interop.PointerConvertible): number;

export declare function ExtAudioFileDispose(inExtAudioFile: interop.PointerConvertible): number;

export declare function ExtAudioFileRead(inExtAudioFile: interop.PointerConvertible, ioNumberFrames: interop.PointerConvertible, ioData: interop.PointerConvertible): number;

export declare function ExtAudioFileWrite(inExtAudioFile: interop.PointerConvertible, inNumberFrames: number, ioData: interop.PointerConvertible): number;

export declare function ExtAudioFileWriteAsync(inExtAudioFile: interop.PointerConvertible, inNumberFrames: number, ioData: interop.PointerConvertible): number;

export declare function ExtAudioFileSeek(inExtAudioFile: interop.PointerConvertible, inFrameOffset: number): number;

export declare function ExtAudioFileTell(inExtAudioFile: interop.PointerConvertible, outFrameOffset: interop.PointerConvertible): number;

export declare function ExtAudioFileGetPropertyInfo(inExtAudioFile: interop.PointerConvertible, inPropertyID: number, outSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function ExtAudioFileGetProperty(inExtAudioFile: interop.PointerConvertible, inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function ExtAudioFileSetProperty(inExtAudioFile: interop.PointerConvertible, inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function NewMusicPlayer(outPlayer: interop.PointerConvertible): number;

export declare function DisposeMusicPlayer(inPlayer: interop.PointerConvertible): number;

export declare function MusicPlayerSetSequence(inPlayer: interop.PointerConvertible, inSequence: interop.PointerConvertible): number;

export declare function MusicPlayerGetSequence(inPlayer: interop.PointerConvertible, outSequence: interop.PointerConvertible): number;

export declare function MusicPlayerSetTime(inPlayer: interop.PointerConvertible, inTime: number): number;

export declare function MusicPlayerGetTime(inPlayer: interop.PointerConvertible, outTime: interop.PointerConvertible): number;

export declare function MusicPlayerGetHostTimeForBeats(inPlayer: interop.PointerConvertible, inBeats: number, outHostTime: interop.PointerConvertible): number;

export declare function MusicPlayerGetBeatsForHostTime(inPlayer: interop.PointerConvertible, inHostTime: number, outBeats: interop.PointerConvertible): number;

export declare function MusicPlayerPreroll(inPlayer: interop.PointerConvertible): number;

export declare function MusicPlayerStart(inPlayer: interop.PointerConvertible): number;

export declare function MusicPlayerStop(inPlayer: interop.PointerConvertible): number;

export declare function MusicPlayerIsPlaying(inPlayer: interop.PointerConvertible, outIsPlaying: interop.PointerConvertible): number;

export declare function MusicPlayerSetPlayRateScalar(inPlayer: interop.PointerConvertible, inScaleRate: number): number;

export declare function MusicPlayerGetPlayRateScalar(inPlayer: interop.PointerConvertible, outScaleRate: interop.PointerConvertible): number;

export declare function NewMusicSequence(outSequence: interop.PointerConvertible): number;

export declare function DisposeMusicSequence(inSequence: interop.PointerConvertible): number;

export declare function MusicSequenceNewTrack(inSequence: interop.PointerConvertible, outTrack: interop.PointerConvertible): number;

export declare function MusicSequenceDisposeTrack(inSequence: interop.PointerConvertible, inTrack: interop.PointerConvertible): number;

export declare function MusicSequenceGetTrackCount(inSequence: interop.PointerConvertible, outNumberOfTracks: interop.PointerConvertible): number;

export declare function MusicSequenceGetIndTrack(inSequence: interop.PointerConvertible, inTrackIndex: number, outTrack: interop.PointerConvertible): number;

export declare function MusicSequenceGetTrackIndex(inSequence: interop.PointerConvertible, inTrack: interop.PointerConvertible, outTrackIndex: interop.PointerConvertible): number;

export declare function MusicSequenceGetTempoTrack(inSequence: interop.PointerConvertible, outTrack: interop.PointerConvertible): number;

export declare function MusicSequenceSetAUGraph(inSequence: interop.PointerConvertible, inGraph: interop.PointerConvertible): number;

export declare function MusicSequenceGetAUGraph(inSequence: interop.PointerConvertible, outGraph: interop.PointerConvertible): number;

export declare function MusicSequenceSetMIDIEndpoint(inSequence: interop.PointerConvertible, inEndpoint: number): number;

export declare function MusicSequenceSetSequenceType(inSequence: interop.PointerConvertible, inType: interop.Enum<typeof MusicSequenceType>): number;

export declare function MusicSequenceGetSequenceType(inSequence: interop.PointerConvertible, outType: interop.PointerConvertible): number;

export declare function MusicSequenceFileLoad(inSequence: interop.PointerConvertible, inFileRef: interop.Object, inFileTypeHint: interop.Enum<typeof MusicSequenceFileTypeID>, inFlags: interop.Enum<typeof MusicSequenceLoadFlags>): number;

export declare function MusicSequenceFileLoadData(inSequence: interop.PointerConvertible, inData: interop.Object, inFileTypeHint: interop.Enum<typeof MusicSequenceFileTypeID>, inFlags: interop.Enum<typeof MusicSequenceLoadFlags>): number;

export declare function MusicSequenceFileCreate(inSequence: interop.PointerConvertible, inFileRef: interop.Object, inFileType: interop.Enum<typeof MusicSequenceFileTypeID>, inFlags: interop.Enum<typeof MusicSequenceFileFlags>, inResolution: number): number;

export declare function MusicSequenceFileCreateData(inSequence: interop.PointerConvertible, inFileType: interop.Enum<typeof MusicSequenceFileTypeID>, inFlags: interop.Enum<typeof MusicSequenceFileFlags>, inResolution: number, outData: interop.PointerConvertible): number;

export declare function MusicSequenceReverse(inSequence: interop.PointerConvertible): number;

export declare function MusicSequenceGetSecondsForBeats(inSequence: interop.PointerConvertible, inBeats: number, outSeconds: interop.PointerConvertible): number;

export declare function MusicSequenceGetBeatsForSeconds(inSequence: interop.PointerConvertible, inSeconds: number, outBeats: interop.PointerConvertible): number;

export declare function MusicSequenceSetUserCallback(inSequence: interop.PointerConvertible, inCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: number, p7: number) => void, inClientData: interop.PointerConvertible): number;

export declare function MusicSequenceBeatsToBarBeatTime(inSequence: interop.PointerConvertible, inBeats: number, inSubbeatDivisor: number, outBarBeatTime: interop.PointerConvertible): number;

export declare function MusicSequenceBarBeatTimeToBeats(inSequence: interop.PointerConvertible, inBarBeatTime: interop.PointerConvertible, outBeats: interop.PointerConvertible): number;

export declare function MusicSequenceGetInfoDictionary(inSequence: interop.PointerConvertible): interop.Object;

export declare function MusicTrackGetSequence(inTrack: interop.PointerConvertible, outSequence: interop.PointerConvertible): number;

export declare function MusicTrackSetDestNode(inTrack: interop.PointerConvertible, inNode: number): number;

export declare function MusicTrackSetDestMIDIEndpoint(inTrack: interop.PointerConvertible, inEndpoint: number): number;

export declare function MusicTrackGetDestNode(inTrack: interop.PointerConvertible, outNode: interop.PointerConvertible): number;

export declare function MusicTrackGetDestMIDIEndpoint(inTrack: interop.PointerConvertible, outEndpoint: interop.PointerConvertible): number;

export declare function MusicTrackSetProperty(inTrack: interop.PointerConvertible, inPropertyID: number, inData: interop.PointerConvertible, inLength: number): number;

export declare function MusicTrackGetProperty(inTrack: interop.PointerConvertible, inPropertyID: number, outData: interop.PointerConvertible, ioLength: interop.PointerConvertible): number;

export declare function MusicTrackMoveEvents(inTrack: interop.PointerConvertible, inStartTime: number, inEndTime: number, inMoveTime: number): number;

export declare function MusicTrackClear(inTrack: interop.PointerConvertible, inStartTime: number, inEndTime: number): number;

export declare function MusicTrackCut(inTrack: interop.PointerConvertible, inStartTime: number, inEndTime: number): number;

export declare function MusicTrackCopyInsert(inSourceTrack: interop.PointerConvertible, inSourceStartTime: number, inSourceEndTime: number, inDestTrack: interop.PointerConvertible, inDestInsertTime: number): number;

export declare function MusicTrackMerge(inSourceTrack: interop.PointerConvertible, inSourceStartTime: number, inSourceEndTime: number, inDestTrack: interop.PointerConvertible, inDestInsertTime: number): number;

export declare function MusicTrackNewMIDINoteEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inMessage: interop.PointerConvertible): number;

export declare function MusicTrackNewMIDIChannelEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inMessage: interop.PointerConvertible): number;

export declare function MusicTrackNewMIDIRawDataEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inRawData: interop.PointerConvertible): number;

export declare function MusicTrackNewExtendedNoteEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inInfo: interop.PointerConvertible): number;

export declare function MusicTrackNewParameterEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inInfo: interop.PointerConvertible): number;

export declare function MusicTrackNewExtendedTempoEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inBPM: number): number;

export declare function MusicTrackNewMetaEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inMetaEvent: interop.PointerConvertible): number;

export declare function MusicTrackNewUserEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inUserData: interop.PointerConvertible): number;

export declare function MusicTrackNewAUPresetEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inPresetEvent: interop.PointerConvertible): number;

export declare function NewMusicEventIterator(inTrack: interop.PointerConvertible, outIterator: interop.PointerConvertible): number;

export declare function DisposeMusicEventIterator(inIterator: interop.PointerConvertible): number;

export declare function MusicEventIteratorSeek(inIterator: interop.PointerConvertible, inTimeStamp: number): number;

export declare function MusicEventIteratorNextEvent(inIterator: interop.PointerConvertible): number;

export declare function MusicEventIteratorPreviousEvent(inIterator: interop.PointerConvertible): number;

export declare function MusicEventIteratorGetEventInfo(inIterator: interop.PointerConvertible, outTimeStamp: interop.PointerConvertible, outEventType: interop.PointerConvertible, outEventData: interop.PointerConvertible, outEventDataSize: interop.PointerConvertible): number;

export declare function MusicEventIteratorSetEventInfo(inIterator: interop.PointerConvertible, inEventType: number, inEventData: interop.PointerConvertible): number;

export declare function MusicEventIteratorSetEventTime(inIterator: interop.PointerConvertible, inTimeStamp: number): number;

export declare function MusicEventIteratorDeleteEvent(inIterator: interop.PointerConvertible): number;

export declare function MusicEventIteratorHasPreviousEvent(inIterator: interop.PointerConvertible, outHasPrevEvent: interop.PointerConvertible): number;

export declare function MusicEventIteratorHasNextEvent(inIterator: interop.PointerConvertible, outHasNextEvent: interop.PointerConvertible): number;

export declare function MusicEventIteratorHasCurrentEvent(inIterator: interop.PointerConvertible, outHasCurEvent: interop.PointerConvertible): number;

export declare function MusicSequenceLoadSMFWithFlags(inSequence: interop.PointerConvertible, inFileRef: interop.PointerConvertible, inFlags: interop.Enum<typeof MusicSequenceLoadFlags>): number;

export declare function MusicSequenceLoadSMFDataWithFlags(inSequence: interop.PointerConvertible, inData: interop.Object, inFlags: interop.Enum<typeof MusicSequenceLoadFlags>): number;

export declare function MusicSequenceSaveMIDIFile(inSequence: interop.PointerConvertible, inParentDirectory: interop.PointerConvertible, inFileName: interop.Object, inResolution: number, inFlags: number): number;

export declare function MusicSequenceSaveSMFData(inSequence: interop.PointerConvertible, outData: interop.PointerConvertible, inResolution: number): number;

export declare function NewMusicTrackFrom(inSourceTrack: interop.PointerConvertible, inSourceStartTime: number, inSourceEndTime: number, outNewTrack: interop.PointerConvertible): number;

export declare function MusicTrackNewExtendedControlEvent(inTrack: interop.PointerConvertible, inTimeStamp: number, inInfo: interop.PointerConvertible): number;

export declare function AudioFileComponentCreateURL(inComponent: interop.PointerConvertible, inFileRef: interop.Object, inFormat: interop.PointerConvertible, inFlags: number): number;

export declare function AudioFileComponentOpenURL(inComponent: interop.PointerConvertible, inFileRef: interop.Object, inPermissions: number, inFileDescriptor: number): number;

export declare function AudioFileComponentOpenWithCallbacks(inComponent: interop.PointerConvertible, inClientData: interop.PointerConvertible, inReadFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inWriteFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inGetSizeFunc: (p1: interop.PointerConvertible) => number, inSetSizeFunc: (p1: interop.PointerConvertible, p2: number) => number): number;

export declare function AudioFileComponentInitializeWithCallbacks(inComponent: interop.PointerConvertible, inClientData: interop.PointerConvertible, inReadFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inWriteFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inGetSizeFunc: (p1: interop.PointerConvertible) => number, inSetSizeFunc: (p1: interop.PointerConvertible, p2: number) => number, inFileType: number, inFormat: interop.PointerConvertible, inFlags: number): number;

export declare function AudioFileComponentCloseFile(inComponent: interop.PointerConvertible): number;

export declare function AudioFileComponentOptimize(inComponent: interop.PointerConvertible): number;

export declare function AudioFileComponentReadBytes(inComponent: interop.PointerConvertible, inUseCache: number, inStartingByte: number, ioNumBytes: interop.PointerConvertible, outBuffer: interop.PointerConvertible): number;

export declare function AudioFileComponentWriteBytes(inComponent: interop.PointerConvertible, inUseCache: number, inStartingByte: number, ioNumBytes: interop.PointerConvertible, inBuffer: interop.PointerConvertible): number;

export declare function AudioFileComponentReadPackets(inComponent: interop.PointerConvertible, inUseCache: number, outNumBytes: interop.PointerConvertible, outPacketDescriptions: interop.PointerConvertible, inStartingPacket: number, ioNumPackets: interop.PointerConvertible, outBuffer: interop.PointerConvertible): number;

export declare function AudioFileComponentReadPacketData(inComponent: interop.PointerConvertible, inUseCache: number, ioNumBytes: interop.PointerConvertible, outPacketDescriptions: interop.PointerConvertible, inStartingPacket: number, ioNumPackets: interop.PointerConvertible, outBuffer: interop.PointerConvertible): number;

export declare function AudioFileComponentWritePackets(inComponent: interop.PointerConvertible, inUseCache: number, inNumBytes: number, inPacketDescriptions: interop.PointerConvertible, inStartingPacket: number, ioNumPackets: interop.PointerConvertible, inBuffer: interop.PointerConvertible): number;

export declare function AudioFileComponentGetPropertyInfo(inComponent: interop.PointerConvertible, inPropertyID: number, outPropertySize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioFileComponentGetProperty(inComponent: interop.PointerConvertible, inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioFileComponentSetProperty(inComponent: interop.PointerConvertible, inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioFileComponentCountUserData(inComponent: interop.PointerConvertible, inUserDataID: number, outNumberItems: interop.PointerConvertible): number;

export declare function AudioFileComponentGetUserDataSize(inComponent: interop.PointerConvertible, inUserDataID: number, inIndex: number, outUserDataSize: interop.PointerConvertible): number;

export declare function AudioFileComponentGetUserData(inComponent: interop.PointerConvertible, inUserDataID: number, inIndex: number, ioUserDataSize: interop.PointerConvertible, outUserData: interop.PointerConvertible): number;

export declare function AudioFileComponentSetUserData(inComponent: interop.PointerConvertible, inUserDataID: number, inIndex: number, inUserDataSize: number, inUserData: interop.PointerConvertible): number;

export declare function AudioFileComponentRemoveUserData(inComponent: interop.PointerConvertible, inUserDataID: number, inIndex: number): number;

export declare function AudioFileComponentExtensionIsThisFormat(inComponent: interop.PointerConvertible, inExtension: interop.Object, outResult: interop.PointerConvertible): number;

export declare function AudioFileComponentFileDataIsThisFormat(inComponent: interop.PointerConvertible, inDataByteSize: number, inData: interop.PointerConvertible, outResult: interop.PointerConvertible): number;

export declare function AudioFileComponentFileIsThisFormat(inComponent: interop.PointerConvertible, inFileRefNum: number, outResult: interop.PointerConvertible): number;

export declare function AudioFileComponentDataIsThisFormat(inComponent: interop.PointerConvertible, inClientData: interop.PointerConvertible, inReadFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inWriteFunc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number, inGetSizeFunc: (p1: interop.PointerConvertible) => number, inSetSizeFunc: (p1: interop.PointerConvertible, p2: number) => number, outResult: interop.PointerConvertible): number;

export declare function AudioFileComponentGetGlobalInfoSize(inComponent: interop.PointerConvertible, inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, outPropertySize: interop.PointerConvertible): number;

export declare function AudioFileComponentGetGlobalInfo(inComponent: interop.PointerConvertible, inPropertyID: number, inSpecifierSize: number, inSpecifier: interop.PointerConvertible, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioFileComponentCreate(inComponent: interop.PointerConvertible, inParentRef: interop.PointerConvertible, inFileName: interop.Object, inFormat: interop.PointerConvertible, inFlags: number, outNewFileRef: interop.PointerConvertible): number;

export declare function AudioFileComponentInitialize(inComponent: interop.PointerConvertible, inFileRef: interop.PointerConvertible, inFormat: interop.PointerConvertible, inFlags: number): number;

export declare function AudioFileComponentOpenFile(inComponent: interop.PointerConvertible, inFileRef: interop.PointerConvertible, inPermissions: number, inRefNum: number): number;

export declare function CAClockNew(inReservedFlags: number, outCAClock: interop.PointerConvertible): number;

export declare function CAClockDispose(inCAClock: interop.PointerConvertible): number;

export declare function CAClockGetPropertyInfo(inCAClock: interop.PointerConvertible, inPropertyID: interop.Enum<typeof CAClockPropertyID>, outSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function CAClockGetProperty(inCAClock: interop.PointerConvertible, inPropertyID: interop.Enum<typeof CAClockPropertyID>, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function CAClockSetProperty(inCAClock: interop.PointerConvertible, inPropertyID: interop.Enum<typeof CAClockPropertyID>, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function CAClockAddListener(inCAClock: interop.PointerConvertible, inListenerProc: (p1: interop.PointerConvertible, p2: interop.Enum<typeof CAClockMessage>, p3: interop.PointerConvertible) => void, inUserData: interop.PointerConvertible): number;

export declare function CAClockRemoveListener(inCAClock: interop.PointerConvertible, inListenerProc: (p1: interop.PointerConvertible, p2: interop.Enum<typeof CAClockMessage>, p3: interop.PointerConvertible) => void, inUserData: interop.PointerConvertible): number;

export declare function CAClockSetCurrentTime(inCAClock: interop.PointerConvertible, inTime: interop.PointerConvertible): number;

export declare function CAClockGetCurrentTime(inCAClock: interop.PointerConvertible, inTimeFormat: interop.Enum<typeof CAClockTimeFormat>, outTime: interop.PointerConvertible): number;

export declare function CAClockGetStartTime(inCAClock: interop.PointerConvertible, inTimeFormat: interop.Enum<typeof CAClockTimeFormat>, outTime: interop.PointerConvertible): number;

export declare function CAClockTranslateTime(inCAClock: interop.PointerConvertible, inTime: interop.PointerConvertible, inOutputTimeFormat: interop.Enum<typeof CAClockTimeFormat>, outTime: interop.PointerConvertible): number;

export declare function CAClockStart(inCAClock: interop.PointerConvertible): number;

export declare function CAClockStop(inCAClock: interop.PointerConvertible): number;

export declare function CAClockArm(inCAClock: interop.PointerConvertible): number;

export declare function CAClockDisarm(inCAClock: interop.PointerConvertible): number;

export declare function CAClockSetPlayRate(inCAClock: interop.PointerConvertible, inPlayRate: number): number;

export declare function CAClockGetPlayRate(inCAClock: interop.PointerConvertible, outPlayRate: interop.PointerConvertible): number;

export declare function CAClockGetCurrentTempo(inCAClock: interop.PointerConvertible, outTempo: interop.PointerConvertible, outTimestamp: interop.PointerConvertible): number;

export declare function CAClockSetCurrentTempo(inCAClock: interop.PointerConvertible, inTempo: number, inTimestamp: interop.PointerConvertible): number;

export declare function CAClockSecondsToSMPTETime(inCAClock: interop.PointerConvertible, inSeconds: number, inSubframeDivisor: number, outSMPTETime: interop.PointerConvertible): number;

export declare function CAClockSMPTETimeToSeconds(inCAClock: interop.PointerConvertible, inSMPTETime: interop.PointerConvertible, outSeconds: interop.PointerConvertible): number;

export declare function CAClockBeatsToBarBeatTime(inCAClock: interop.PointerConvertible, inBeats: number, inSubbeatDivisor: number, outBarBeatTime: interop.PointerConvertible): number;

export declare function CAClockBarBeatTimeToBeats(inCAClock: interop.PointerConvertible, inBarBeatTime: interop.PointerConvertible, outBeats: interop.PointerConvertible): number;

export declare function CAClockParseMIDI(inCAClock: interop.PointerConvertible, inMIDIPacketList: interop.PointerConvertible): number;

export declare function GetNameFromSoundBank(inSoundBankRef: interop.PointerConvertible, outName: interop.PointerConvertible): number;

export declare function CopyNameFromSoundBank(inURL: interop.Object, outName: interop.PointerConvertible): number;

export declare function CopyInstrumentInfoFromSoundBank(inURL: interop.Object, outInstrumentInfo: interop.PointerConvertible): number;

export declare interface AUCocoaUIBase {
  interfaceVersion(): number;

  uiViewForAudioUnitWithSize(inAudioUnit: interop.PointerConvertible, inPreferredSize: CGSize): NSView | null;
}

export declare class AUCocoaUIBase extends NativeObject implements AUCocoaUIBase {
}

export declare interface AUAudioUnitFactory extends NSExtensionRequestHandling {
  createAudioUnitWithComponentDescriptionError(desc: AudioComponentDescription, error: interop.PointerConvertible): AUAudioUnit;
}

export declare class AUAudioUnitFactory extends NativeObject implements AUAudioUnitFactory {
}

export declare class AUAudioUnitPreset extends NSObject implements NSSecureCoding {
  number: number;

  name: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class AUAudioUnitBusArray extends NSObject implements NSFastEnumeration {
  initWithAudioUnitBusTypeBusses(owner: AUAudioUnit, busType: interop.Enum<typeof AUAudioUnitBusType>, busArray: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithAudioUnitBusType(owner: AUAudioUnit, busType: interop.Enum<typeof AUAudioUnitBusType>): this;

  readonly count: number;

  objectAtIndexedSubscript(index: number): AUAudioUnitBus;

  readonly countChangeable: boolean;

  setBusCountError(count: number, outError: interop.PointerConvertible): boolean;

  addObserverToAllBussesForKeyPathOptionsContext(observer: NSObject, keyPath: string, options: interop.Enum<typeof NSKeyValueObservingOptions>, context: interop.PointerConvertible): void;

  removeObserverFromAllBussesForKeyPathContext(observer: NSObject, keyPath: string, context: interop.PointerConvertible): void;

  readonly ownerAudioUnit: AUAudioUnit;

  readonly busType: interop.Enum<typeof AUAudioUnitBusType>;

  isCountChangeable(): boolean;

  replaceBusses(busArray: NSArray<interop.Object> | Array<interop.Object>): void;

  countByEnumeratingWithStateObjectsCount(state: interop.PointerConvertible, buffer: interop.PointerConvertible, len: number): number;

  readonly [Symbol.iterator]: () => Iterator<any>;

}

export declare class AUParameter extends AUParameterNode implements NSSecureCoding {
  readonly minValue: number;

  readonly maxValue: number;

  readonly unit: interop.Enum<typeof AudioUnitParameterUnit>;

  readonly unitName: string;

  readonly flags: interop.Enum<typeof AudioUnitParameterOptions>;

  readonly address: number;

  readonly valueStrings: NSArray;

  readonly dependentParameters: NSArray;

  value: number;

  setValueOriginator(value: number, originator: interop.PointerConvertible): void;

  setValueOriginatorAtHostTime(value: number, originator: interop.PointerConvertible, hostTime: number): void;

  setValueOriginatorAtHostTimeEventType(value: number, originator: interop.PointerConvertible, hostTime: number, eventType: interop.Enum<typeof AUParameterAutomationEventType>): void;

  stringFromValue(value: interop.PointerConvertible): string;

  valueFromString(string: string): number;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class AUParameterTree extends AUParameterGroup implements NSSecureCoding {
  parameterWithAddress(address: number): AUParameter | null;

  parameterWithIDScopeElement(paramID: number, scope: number, element: number): AUParameter | null;

  static createParameterWithIdentifierNameAddressMinMaxUnitUnitNameFlagsValueStringsDependentParameters(identifier: string, name: string, address: number, min: number, max: number, unit: interop.Enum<typeof AudioUnitParameterUnit>, unitName: string | null, flags: interop.Enum<typeof AudioUnitParameterOptions>, valueStrings: NSArray<interop.Object> | Array<interop.Object> | null, dependentParameters: NSArray<interop.Object> | Array<interop.Object> | null): AUParameter;

  static createGroupWithIdentifierNameChildren(identifier: string, name: string, children: NSArray<interop.Object> | Array<interop.Object>): AUParameterGroup;

  static createGroupTemplate(children: NSArray<interop.Object> | Array<interop.Object>): AUParameterGroup;

  static createGroupFromTemplateIdentifierNameAddressOffset(templateGroup: AUParameterGroup, identifier: string, name: string, addressOffset: number): AUParameterGroup;

  static createTreeWithChildren(children: NSArray<interop.Object> | Array<interop.Object>): AUParameterTree;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class AUParameterGroup extends AUParameterNode implements NSSecureCoding {
  readonly children: NSArray;

  readonly allParameters: NSArray;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class AUParameterNode extends NSObject {
  readonly identifier: string;

  readonly keyPath: string;

  readonly displayName: string;

  displayNameWithLength(maximumLength: number): string;

  tokenByAddingParameterObserver(observer: (p1: number, p2: number) => void): interop.Pointer;

  tokenByAddingParameterRecordingObserver(observer: (p1: number, p2: interop.PointerConvertible) => void): interop.Pointer;

  tokenByAddingParameterAutomationObserver(observer: (p1: number, p2: interop.PointerConvertible) => void): interop.Pointer;

  removeParameterObserver(token: interop.PointerConvertible): void;

  implementorValueObserver: (p1: AUParameter, p2: number) => void;

  implementorValueProvider: (p1: AUParameter) => number;

  implementorStringFromValueCallback: (p1: AUParameter, p2: interop.PointerConvertible) => string;

  implementorValueFromStringCallback: (p1: AUParameter, p2: string) => number;

  implementorDisplayNameWithLengthCallback: (p1: AUParameterNode, p2: number) => string;
}

export declare class AUAudioUnit extends NSObject {
  initWithComponentDescriptionOptionsError(componentDescription: AudioComponentDescription, options: interop.Enum<typeof AudioComponentInstantiationOptions>, outError: interop.PointerConvertible): this;

  initWithComponentDescriptionError(componentDescription: AudioComponentDescription, outError: interop.PointerConvertible): this;

  static instantiateWithComponentDescriptionOptionsCompletionHandler(componentDescription: AudioComponentDescription, options: interop.Enum<typeof AudioComponentInstantiationOptions>, completionHandler: (p1: AUAudioUnit, p2: NSError) => void | null): void;

  readonly componentDescription: AudioComponentDescription;

  readonly component: interop.Pointer;

  readonly componentName: string;

  readonly audioUnitName: string;

  readonly manufacturerName: string;

  readonly audioUnitShortName: string;

  readonly componentVersion: number;

  allocateRenderResourcesAndReturnError(outError: interop.PointerConvertible): boolean;

  deallocateRenderResources(): void;

  readonly renderResourcesAllocated: boolean;

  reset(): void;

  readonly inputBusses: AUAudioUnitBusArray;

  readonly outputBusses: AUAudioUnitBusArray;

  readonly renderBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible, p6: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible) => number) => number;

  readonly scheduleParameterBlock: (p1: number, p2: number, p3: number, p4: number) => void;

  tokenByAddingRenderObserver(observer: (p1: interop.Enum<typeof AudioUnitRenderActionFlags>, p2: interop.PointerConvertible, p3: number, p4: number) => void): number;

  removeRenderObserver(token: number): void;

  maximumFramesToRender: number;

  parameterTree: AUParameterTree;

  parametersForOverviewWithCount(count: number): NSArray;

  readonly allParameterValues: boolean;

  readonly musicDeviceOrEffect: boolean;

  readonly virtualMIDICableCount: number;

  readonly scheduleMIDIEventBlock: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => void;

  readonly MIDIOutputNames: NSArray;

  readonly providesUserInterface: boolean;

  MIDIOutputEventBlock: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => number;

  get fullState(): NSDictionary;
  set fullState(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  get fullStateForDocument(): NSDictionary;
  set fullStateForDocument(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  readonly factoryPresets: NSArray;

  readonly userPresets: NSArray;

  saveUserPresetError(userPreset: AUAudioUnitPreset, outError: interop.PointerConvertible): boolean;

  deleteUserPresetError(userPreset: AUAudioUnitPreset, outError: interop.PointerConvertible): boolean;

  presetStateForError(userPreset: AUAudioUnitPreset, outError: interop.PointerConvertible): NSDictionary;

  readonly supportsUserPresets: boolean;

  readonly isLoadedInProcess: boolean;

  currentPreset: AUAudioUnitPreset;

  readonly latency: number;

  readonly tailTime: number;

  renderQuality: number;

  shouldBypassEffect: boolean;

  readonly canProcessInPlace: boolean;

  renderingOffline: boolean;

  readonly channelCapabilities: NSArray;

  musicalContextBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => boolean;

  transportStateBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => boolean;

  contextName: string;

  readonly supportsMPE: boolean;

  get channelMap(): NSArray;
  set channelMap(value: NSArray<interop.Object> | Array<interop.Object>);

  profileStateForCableChannel(cable: number, channel: number): MIDICIProfileState;

  enableProfileCableOnChannelError(profile: MIDICIProfile, cable: number, channel: number, outError: interop.PointerConvertible): boolean;

  disableProfileCableOnChannelError(profile: MIDICIProfile, cable: number, channel: number, outError: interop.PointerConvertible): boolean;

  profileChangedBlock: (p1: number, p2: number, p3: MIDICIProfile, p4: boolean) => void;

  isMusicDeviceOrEffect(): boolean;

  isRenderingOffline(): boolean;

  readonly canPerformInput: boolean;

  readonly canPerformOutput: boolean;

  inputEnabled: boolean;

  outputEnabled: boolean;

  outputProvider: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible) => number;

  inputHandler: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void;

  readonly deviceID: number;

  setDeviceIDError(deviceID: number, outError: interop.PointerConvertible): boolean;

  readonly deviceInputLatency: number;

  readonly deviceOutputLatency: number;

  readonly running: boolean;

  startHardwareAndReturnError(outError: interop.PointerConvertible): boolean;

  stopHardware(): void;

  readonly osWorkgroup: OS_os_workgroup;

  isInputEnabled(): boolean;

  isOutputEnabled(): boolean;

  isRunning(): boolean;

  static registerSubclassAsComponentDescriptionNameVersion(cls: interop.PointerConvertible, componentDescription: AudioComponentDescription, name: string, version: number): void;

  readonly internalRenderBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible) => number) => number;

  readonly renderContextObserver: (p1: interop.PointerConvertible) => void;

  MIDIOutputBufferSizeHint: number;

  shouldChangeToFormatForBus(format: AVAudioFormat, bus: AUAudioUnitBus): boolean;

  requestViewControllerWithCompletionHandler(completionHandler: (p1: NSViewController) => void | null): void;

  supportedViewConfigurations(availableViewConfigurations: NSArray<interop.Object> | Array<interop.Object>): NSIndexSet;

  selectViewConfiguration(viewConfiguration: AUAudioUnitViewConfiguration): void;
}

export declare class AUAudioUnitV2Bridge extends AUAudioUnit {
  readonly audioUnit: interop.Pointer;
}

export declare class AUAudioUnitBus extends NSObject {
  readonly format: AVAudioFormat;

  setFormatError(format: AVAudioFormat, outError: interop.PointerConvertible): boolean;

  shouldAllocateBuffer: boolean;

  enabled: boolean;

  name: string;

  readonly index: number;

  readonly busType: interop.Enum<typeof AUAudioUnitBusType>;

  readonly ownerAudioUnit: AUAudioUnit;

  readonly supportedChannelLayoutTags: NSArray;

  contextPresentationLatency: number;

  isEnabled(): boolean;

  initWithFormatError(format: AVAudioFormat, outError: interop.PointerConvertible): this;

  get supportedChannelCounts(): NSArray;
  set supportedChannelCounts(value: NSArray<interop.Object> | Array<interop.Object>);

  maximumChannelCount: number;
}
