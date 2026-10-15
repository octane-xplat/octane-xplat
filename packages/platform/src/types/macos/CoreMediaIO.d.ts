import type { CFUUIDBytes } from './CoreFoundation'

import type { CMTime } from './CoreMedia'

import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'



export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorScale: interop.Object;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorFrameRect: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_MouseAndKeyboardModifiers: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_ClientSequenceID: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_RepeatedBufferContents: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_HostTime: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_NumberOfVideoFramesInBuffer: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_SMPTETime: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_CAAudioTimeStamp: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_HDV2_VAUX: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_HDV1_PackData: interop.Object;

export declare const kCMIOSampleBufferAttachmentKey_DiscontinuityFlags: interop.Object;

export declare const kCMIOSampleBufferNoDataEvent_SleepWakeCycle: number;

export declare const kCMIOSampleBufferNoDataEvent_ProcessingError: number;

export declare const kCMIOSampleBufferNoDataEvent_DeviceDidNotSync: number;

export declare const kCMIOSampleBufferNoDataEvent_NoMedia: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_CodecSettingsChanged: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_SleepWakeCycle: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_DataFormatChanged: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_NoDataMarker: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_TrickPlay: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_MalformedData: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_PacketError: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_TimecodeDiscontinuity: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_UnknownDiscontinuity: number;

export declare const kCMIOSampleBufferNoDiscontinuities: number;

export declare const kCMIOPlugInPropertyBundleID: number;

export declare const kCMIOPlugInClassID: number;

export declare const kCMIODeviceUnsupportedFormatError: number;

export declare const kCMIOHardwareSuspendedBySystemError: number;

export declare const kCMIOHardwareBadStreamError: number;

export declare const kCMIOHardwareBadPropertySizeError: number;

export declare const kCMIOHardwareUnknownPropertyError: number;

export declare const kCMIOHardwareUnspecifiedError: number;

export declare const kCMIOHardwareNotRunningError: number;

export declare const kCMIOHardwareNotStoppedError: number;

export declare const kCMIOExposureControlPropertyMaximumGain: number;

export declare const kCMIOExposureControlPropertyIntegrationTime: number;

export declare const kCMIOExposureControlPropertyStable: number;

export declare const kCMIOExposureControlPropertyConvergenceSpeed: number;

export declare const kCMIOExposureControlPropertyTarget: number;

export declare const kCMIOExposureControlPropertyLockThreshold: number;

export declare const kCMIOFeatureControlPropertyNativeDataRange: number;

export declare const kCMIOFeatureControlPropertyNativeData: number;

export declare const kCMIOFeatureControlPropertyAbsoluteUnitName: number;

export declare const kCMIOFeatureControlPropertyConvertAbsoluteToNative: number;

export declare const kCMIOFeatureControlPropertyConvertNativeToAbsolute: number;

export declare const kCMIOFeatureControlPropertyAbsoluteRange: number;

export declare const kCMIOFeatureControlPropertyNativeRange: number;

export declare const kCMIOFeatureControlPropertyAbsoluteValue: number;

export declare const kCMIOFeatureControlPropertyNativeValue: number;

export declare const kCMIOFeatureControlPropertyTune: number;

export declare const kCMIOFeatureControlPropertyOnOff: number;

export declare const kCMIOSelectorControlPropertyAvailableItems: number;

export declare const kCMIOBooleanControlPropertyValue: number;

export declare const kCMIONoiseReductionControlClassID: number;

export declare const kCMIOTiltControlClassID: number;

export declare const kCMIOPanControlClassID: number;

export declare const kCMIOFocusControlClassID: number;

export declare const kCMIOTemperatureControlClassID: number;

export declare const kCMIOGammaControlClassID: number;

export declare const kCMIOWhiteBalanceUControlClassID: number;

export declare const kCMIOExposureControlClassID: number;

export declare const kCMIODataSourceControlClassID: number;

export declare const kCMIODirectionControlClassID: number;

export declare const kCMIOFeatureControlClassID: number;

export declare const kCMIOBooleanControlClassID: number;

export declare const kCMIODevicePropertyLocationExternalWirelessDevice: number;

export declare const kCMIODevicePropertyLocationExternalDevice: number;

export declare const kCMIODevicePropertyLocationBuiltInDisplay: number;

export declare const kCMIODevicePropertyIIDCInitialUnitSpace: number;

export declare const kCMIODevicePropertyLinkedAndSyncedCoreAudioDeviceUID: number;

export declare const kCMIODevicePropertyVideoDigitizerComponents: number;

export declare const kCMIODevicePropertyLinkedCoreAudioDeviceUID: number;

export declare const kCMIODevicePropertyAVCDeviceType: number;

export declare const kCMIODevicePropertyCanProcessAVCCommand: number;

export declare const kCMIODevicePropertyClientSyncDiscontinuity: number;

export declare const kCMIODevicePropertyExcludeNonDALAccess: number;

export declare const kCMIODevicePropertyLatency: number;

export declare const kCMIODevicePropertyHogMode: number;

export declare const kCMIODevicePropertyDeviceCanBeDefaultDevice: number;

export declare const kCMIODevicePropertyTransportType: number;

export declare const kCMIODevicePropertyModelUID: number;

export declare const kCMIODeviceAVCSignalModeDVCPro50_525_60: number;

export declare const kCMIODeviceAVCSignalModeDVCPro25_525_60: number;

export declare const kCMIODeviceAVCSignalModeHDV2_50: number;

export declare const kCMIODeviceAVCSignalModeMicroMV6Mbps_50: number;

export declare const kCMIODeviceAVCSignalModeMicroMV12Mbps_50: number;

export declare const kCMIODeviceAVCSignalModeHi8PAL: number;

export declare const kCMIODeviceAVCSignalModeSVHS625_50: number;

export declare const kCMIODeviceAVCSignalModeVHSMESECAM: number;

export declare const kCMIODeviceAVCSignalModeVHSSECAM: number;

export declare const kCMIODeviceAVCSignalModeVHSNPAL: number;

export declare const kCMIODeviceAVCSignalModeVHSNTSC: number;

export declare const kCMIODeviceAVCSignalModeDVHS: number;

export declare const kCMIODeviceAVCSignalModeMPEG12Mbps_50: number;

export declare const kCMIODeviceAVCSignalModeHDV1_50: number;

export declare const kCMIODeviceAVCSignalModeMPEG25Mbps_50: number;

export declare const kCMIODeviceAVCSignalModeMPEG6Mbps_60: number;

export declare const kCMIODeviceAVCSignalModeMPEG12Mbps_60: number;

export declare const kCMIODeviceAVCSignalModeHDV1_60: number;

export declare const kCMIODeviceAVCSignalModeHD1250_50: number;

export declare const kCMIODeviceAVCSignalModeSDL625_50: number;

export declare const kCMIODeviceAVCSignalModeSD625_50: number;

export declare const kCMIODeviceAVCSignalModeHD1125_60: number;

export declare const kCMIODeviceAVCSignalModeSD525_60: number;

export declare const kCMIOAVCDeviceType_DVCPro100_PAL: number;

export declare const kCMIOAVCDeviceType_DVCPro50_PAL: number;

export declare const kCMIOAVCDeviceType_DVCPro_PAL: number;

export declare const kCMIOAVCDeviceType_DVCPro_NTSC: number;

export declare const kCMIOAVCDeviceType_Unknown: number;

export declare const kCMIODeviceClassID: number;

export declare const kCMIODevicePropertyScopePlayThrough: number;

export declare const kCMIODevicePropertyScopeOutput: number;

export declare const kCMIODevicePropertyScopeInput: number;

export declare const kCMIOStreamPropertyPreferredFrameRate: number;

export declare const kCMIOStreamPropertyInitialPresentationTimeStampForLinkedAndSyncedAudio: number;

export declare const kCMIOStreamPropertyDeckLocal: number;

export declare const kCMIOStreamPropertyEndOfData: number;

export declare const kCMIOStreamPropertyFirstOutputPresentationTimeStamp: number;

export declare const kCMIOStreamPropertyOutputBuffersRequiredForStartup: number;

export declare const kCMIOStreamPropertyOutputBufferQueueSize: number;

export declare const kCMIOStreamPropertyOutputBufferRepeatCount: number;

export declare const kCMIOStreamPropertyNoDataEventCount: number;

export declare const kCMIOStreamPropertyDeviceSyncTimeoutInMSec: number;

export declare const kCMIOStreamPropertyNoDataTimeoutInMSec: number;

export declare const kCMIOStreamPropertyFrameRates: number;

export declare const kCMIOStreamPropertyMinimumFrameRate: number;

export declare const kCMIOStreamPropertyStillImage: number;

export declare const kCMIOStreamPropertyFormatDescription: number;

export declare const kCMIOStreamPropertyStartingChannel: number;

export declare const kCMIODeckShuttlePlayHighSpeed: number;

export declare const kCMIODeckShuttlePlayFastest: number;

export declare const kCMIODeckShuttlePlayFast: number;

export declare const kCMIODeckShuttlePlay1x: number;

export declare const kCMIODeckShuttlePlaySlow3: number;

export declare const kCMIODeckShuttlePlaySlow1: number;

export declare const kCMIODeckShuttlePause: number;

export declare const kCMIODeckShuttlePlayPreviousFrame: number;

export declare const kCMIODeckShuttleReverseSlow1: number;

export declare const kCMIODeckShuttleReverse1x: number;

export declare const kCMIODevicePermissionsError: number;

export declare const kCMIODeckShuttleReverseFast: number;

export declare const kCMIODeckShuttleReverseFastest: number;

export declare const kCMIODeckShuttleReverseHighSpeed: number;

export declare const kCMIODeckStateFastForward: number;

export declare const kCMIODeckStatePlayReverse: number;

export declare const kCMIODeckStatePlay: number;

export declare const kCMIODeckStatusOpcode: number;

export declare const kCMIODeckStatusNotThreaded: number;

export declare const kCMIOStreamUnknown: number;

export declare const kCMIOHardwarePropertyDeviceForUID: number;

export declare const kCMIOHardwarePropertyDefaultOutputDevice: number;

export declare const kCMIOHardwarePropertyDefaultInputDevice: number;

export declare const kCMIOHardwarePropertyDevices: number;

export declare const kCMIOHardwarePropertyProcessIsMaster: number;

export declare const kCMIOSystemObjectClassID: number;

export declare const kCMIOObjectPropertyListenerRemoved: number;

export declare const kCMIOObjectPropertyListenerAdded: number;

export declare const kCMIOObjectPropertyOwnedObjects: number;

export declare const kCMIOObjectPropertyElementNumberName: number;

export declare const kCMIOObjectPropertyManufacturer: number;

export declare const kCMIOObjectPropertyCreator: number;

export declare const kCMIOObjectPropertyOwner: number;

export declare const kCMIOObjectUnknown: number;

export declare const kCMIOObjectClassIDWildcard: number;

export declare const kCMIOObjectPropertyElementMaster: number;

export declare const kCMIOObjectPropertyElementMain: number;

export declare const kCMIOObjectPropertyScopeGlobal: number;

export declare const kCMIOObjectPropertySelectorWildcard: number;

export declare const kCMIODeckShuttlePlayNextFrame: number;

export declare const kCMIODeviceAVCSignalModeVHSPAL: number;

export declare const kCMIODeckStatusBusy: number;

export declare const kCMIOGainControlClassID: number;

export declare const kCMIODeckShuttlePlaySlow2: number;

export declare const kCMIODevicePropertyLocationExternalDisplay: number;

export declare const kCMIODeviceAVCSignalModeVHSMPAL: number;

export declare const kCMIODeviceAVCSignalModeHi8NTSC: number;

export declare const kCMIODevicePropertyDeviceControl: number;

export declare const kCMIODevicePropertySMPTETimeCallback: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorReference: interop.Object;

export declare const kCMIOObjectClassID: number;

export declare const kCMIOHardwareUnsupportedOperationError: number;

export declare const kCMIODevicePropertyCanProcessRS422Command: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_BufferOverrun: number;

export declare const kCMIOAVCDeviceType_DVCProHD_1080i50: number;

export declare const kCMIOStreamPropertyDeck: number;

export declare const kCMIOObjectPropertyElementWildcard: number;

export declare const kCMIOAVCDeviceType_DV_PAL: number;

export declare const kCMIODevicePropertyDeviceIsAlive: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_TimingReferenceJumped: number;

export declare const kCMIOSampleBufferNoDataEvent_Unknown: number;

export declare const kCMIOSelectorControlClassID: number;

export declare const kCMIODevicePropertyDeviceIsRunningSomewhere: number;

export declare const kCMIOZoomRelativeControlClassID: number;

export declare const kCMIOObjectPropertyName: number;

export declare const kCMIODeviceAVCSignalModeDVCPro100_50: number;

export declare const kCMIOSelectorControlPropertyAvailableItemNames: number;

export declare const kCMIOStreamPropertyOutputBuffersNeededForThrottledPlayback: number;

export declare const kCMIOStreamPropertyDeckDropness: number;

export declare const kCMIOAVCDeviceType_DVCPro100_NTSC: number;

export declare const kCMIOSampleBufferAttachmentKey_MuxedSourcePresentationTimeStamp: interop.Object;

export declare const kCMIOBlockBufferAttachmentKey_CVPixelBufferReference: interop.Object;

export declare const kCMIODeviceAVCSignalModeMPEG25Mbps_60: number;

export declare const kCMIOExposureControlPropertyRegionOfInterest: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_KeyboardModifiers: interop.Object;

export declare const kCMIOStreamPropertyPreferredFormatDescription: number;

export declare const kCMIOStreamClassID: number;

export declare const kCMIOOpticalFilterClassID: number;

export declare const kCMIOHardwarePropertyAllowScreenCaptureDevices: number;

export declare const kCMIOHueControlClassID: number;

export declare const kCMIOSampleBufferAttachmentKey_ClosedCaptionSampleBuffer: interop.Object;

export declare const kCMIOBacklightCompensationControlClassID: number;

export declare const kCMIOHardwarePropertySuspendedBySystem: number;

export declare const kCMIODeviceAVCSignalMode8mmNTSC: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorPositionX: interop.Object;

export declare const kCMIOControlPropertyVariant: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_ClientSyncDiscontinuity: number;

export declare const kCMIODevicePropertyLocation: number;

export declare const kCMIODeviceAVCSignalModeHDV2_60: number;

export declare const kCMIOPanTiltRelativeControlClassID: number;

export declare const kCMIOHardwarePropertyUserSessionIsActiveOrHeadless: number;

export declare const kCMIODeckStateStop: number;

export declare const kCMIOSampleBufferNoDataEvent_DeviceInWrongMode: number;

export declare const kCMIODeckShuttleReverseSlowest: number;

export declare const kCMIOAVCDeviceType_DVCProHD_1080i60: number;

export declare const kCMIODeckShuttleReverseSlow3: number;

export declare const kCMIOSelectorControlPropertyCurrentItem: number;

export declare const kCMIOStreamPropertyCanProcessDeckCommand: number;

export declare const kCMIOPlugInPropertyIsExtension: number;

export declare const kCMIOStreamPropertyStillImageFormatDescriptions: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_KeyboardModifiersEvent: interop.Object;

export declare const kCMIODeviceAVCSignalModeSVHS525_60: number;

export declare const kCMIOSampleBufferAttachmentKey_NumberOfVideoFramesInGOP: interop.Object;

export declare const kCMIOFeatureControlPropertyAbsoluteNative: number;

export declare const kCMIOSaturationControlClassID: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_DataWasFlushed: number;

export declare const kCMIOPanTiltAbsoluteControlClassID: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorIsDrawnInFramebuffer: interop.Object;

export declare const kCMIOHardwareIllegalOperationError: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorSeed: interop.Object;

export declare const kCMIODeviceUnknown: number;

export declare const kCMIOSampleBufferAttachmentKey_PulldownCadenceInfo: interop.Object;

export declare const kCMIODeviceAVCSignalModeDVCPro100_60: number;

export declare const kCMIODevicePropertyPlugIn: number;

export declare const kCMIOObjectSystemObject: number;

export declare const kCMIOHardwareNoError: number;

export declare const kCMIODevicePropertyDeviceHasStreamingError: number;

export declare const kCMIOHardwarePropertySleepingIsAllowed: number;

export declare const kCMIOObjectPropertyElementCategoryName: number;

export declare const kCMIOWhiteBalanceVControlClassID: number;

export declare const kCMIOZoomControlClassID: number;

export declare const kCMIODeckStatusNoDevice: number;

export declare const kCMIOStreamPropertyDeckCueing: number;

export declare const kCMIODevicePropertyAVCDeviceSignalMode: number;

export declare const kCMIOHardwarePropertyAllowWirelessScreenCaptureDevices: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_StreamDiscontinuity: number;

export declare const kCMIODeviceAVCSignalModeMicroMV6Mbps_60: number;

export declare const kCMIOStreamPropertyScheduledOutputNotificationProc: number;

export declare const kCMIOStreamPropertyClock: number;

export declare const kCMIODevicePropertyDeviceHasChanged: number;

export declare const kCMIOAVCDeviceType_DV_NTSC: number;

export declare const kCMIOHardwarePropertyIsInitingOrExiting: number;

export declare const kCMIOSampleBufferAttachmentKey_NativeSMPTEFrameCount: interop.Object;

export declare const kCMIODevicePropertyLocationUnknown: number;

export declare const kCMIODeckStateReverseSlow: number;

export declare const kCMIODeckStateFastRewind: number;

export declare const kCMIOSampleBufferAttachmentKey_NoDataMarker: interop.Object;

export declare const kCMIODeckStatePause: number;

export declare const kCMIODeviceAVCSignalModeMicroMV12Mbps_60: number;

export declare const kCMIOWhiteLevelControlClassID: number;

export declare const kCMIOControlPropertyElement: number;

export declare const kCMIOSampleBufferAttachmentKey_SourceAudioFormatDescription: interop.Object;

export declare const kCMIODeviceAVCSignalModeSDL525_60: number;

export declare const kCMIOHardwarePropertyPlugInForBundleID: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorPositionY: interop.Object;

export declare const kCMIOFeatureControlPropertyAutomaticManual: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_DataWasDropped: number;

export declare const kCMIOControlPropertyScope: number;

export declare const kCMIOContrastControlClassID: number;

export declare const kCMIOJackControlClassID: number;

export declare const kCMIOStreamPropertyDeckThreaded: number;

export declare const kCMIODataDestinationControlClassID: number;

export declare const kCMIODevicePropertyCanSwitchFrameRatesWithoutFrameDrops: number;

export declare const kCMIODeckStatePlaySlow: number;

export declare const kCMIOStreamPropertyLatency: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_CursorIsVisible: interop.Object;

export declare const kCMIODevicePropertyStreams: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_RelatedToDiscontinuity: number;

export declare const kCMIOStreamPropertyFrameRate: number;

export declare const kCMIOBrightnessControlClassID: number;

export declare const kCMIODeckShuttleReverseFaster: number;

export declare const kCMIOHardwareBadDeviceError: number;

export declare const kCMIOStreamPropertyDeckFrameNumber: number;

export declare const kCMIOStreamPropertyOutputBufferUnderrunCount: number;

export declare const kCMIODevicePropertyIIDCCSRData: number;

export declare const kCMIOStreamPropertyFormatDescriptions: number;

export declare const kCMIODeckShuttlePlayFaster: number;

export declare const kCMIOSharpnessControlClassID: number;

export declare const kCMIOExposureControlPropertyUnlockThreshold: number;

export declare const kCMIODevicePropertyDeviceUID: number;

export declare const kCMIOObjectPropertyClass: number;

export declare const kCMIOWhiteBalanceControlClassID: number;

export declare const kCMIOSampleBufferAttachment_MouseAndKeyboardModifiersKey_MouseButtonState: interop.Object;

export declare const kCMIOSampleBufferDiscontinuityFlag_DiscontinuityInDTS: number;

export declare const kCMIODeckStatusTapeInserted: number;

export declare const kCMIOSampleBufferAttachmentKey_SequenceNumber: interop.Object;

export declare const kCMIODeckShuttleReverseSlow2: number;

export declare const kCMIOStreamPropertyFrameRateRanges: number;

export declare const kCMIOExposureControlPropertyStability: number;

export declare const kCMIODeviceAVCSignalModeAudio: number;

export declare const kCMIODevicePropertyStreamConfiguration: number;

export declare const kCMIOAVCDeviceType_DVCPro100_720p: number;

export declare const kCMIOStreamPropertyTerminalType: number;

export declare const kCMIORollAbsoluteControlClassID: number;

export declare const kCMIOHardwareBadObjectError: number;

export declare const kCMIOHardwarePropertyUnloadingIsAllowed: number;

export declare const kCMIODeviceAVCSignalModeDVCPro50_625_50: number;

export declare const kCMIOObjectPropertyElementName: number;

export declare const kCMIOBlackLevelControlClassID: number;

export declare const kCMIOSelectorControlPropertyItemName: number;

export declare const kCMIOControlClassID: number;

export declare const kCMIOPowerLineFrequencyControlClassID: number;

export declare const kCMIOSampleBufferDiscontinuityFlag_DurationWasExtended: number;

export declare const kCMIOHardwarePropertyProcessIsMain: number;

export declare const kCMIODeviceAVCSignalModeDVCPro25_625_50: number;

export declare const kCMIODeckStatusLocal: number;

export declare const kCMIOIrisControlClassID: number;

export declare const kCMIODevicePropertyDeviceMaster: number;

export declare const kCMIOShutterControlClassID: number;

export declare const kCMIODeckShuttlePlaySlowest: number;

export declare const kCMIODevicePropertySuspendedByUser: number;

export declare const kCMIOAVCDeviceType_DVCPro50_NTSC: number;

export declare const kCMIOStreamPropertyDirection: number;

export declare const kCMIODeviceAVCSignalModeMPEG6Mbps_50: number;

export declare const kCMIOObjectPropertyScopeWildcard: number;

export declare const kCMIOAVCDeviceType_MPEG2: number;

export declare const kCMIODevicePropertyDeviceIsRunning: number;

export declare const kCMIODeckStatusSearchingForDevice: number;

export declare const kCMIODeviceAVCSignalMode8mmPAL: number;

export declare class CMIODeviceSMPTETimeCallback {
  constructor(init?: CMIODeviceSMPTETimeCallback);
  mGetSMPTETimeProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  mRefCon: interop.Pointer;
}

export declare class CMIODeviceRS422Command {
  constructor(init?: CMIODeviceRS422Command);
  mCommand: interop.Pointer;
  mCommandLength: number;
  mResponse: interop.Pointer;
  mResponseLength: number;
  mResponseUsed: number;
}

export declare class CMIODeviceStreamConfiguration {
  constructor(init?: CMIODeviceStreamConfiguration);
  mNumberStreams: number;
  mNumberChannels: interop.Pointer;
}

export declare class CMIOStreamDeck {
  constructor(init?: CMIOStreamDeck);
  mStatus: number;
  mState: number;
  mState2: number;
}

export declare class CMIODeviceAVCCommand {
  constructor(init?: CMIODeviceAVCCommand);
  mCommand: interop.Pointer;
  mCommandLength: number;
  mResponse: interop.Pointer;
  mResponseLength: number;
  mResponseUsed: number;
}

export declare class CMIOObjectPropertyAddress {
  constructor(init?: CMIOObjectPropertyAddress);
  mSelector: number;
  mScope: number;
  mElement: number;
}

export declare class CMIOHardwarePlugInInterface {
  constructor(init?: CMIOHardwarePlugInInterface);
  _reserved: interop.Pointer;
  QueryInterface: (p1: interop.PointerConvertible, p2: CFUUIDBytes, p3: interop.PointerConvertible) => number | null;
  AddRef: (p1: interop.PointerConvertible) => number | null;
  Release: (p1: interop.PointerConvertible) => number | null;
  Initialize: (p1: interop.PointerConvertible) => number | null;
  InitializeWithObjectID: (p1: interop.PointerConvertible, p2: number) => number | null;
  Teardown: (p1: interop.PointerConvertible) => number | null;
  ObjectShow: (p1: interop.PointerConvertible, p2: number) => void | null;
  ObjectHasProperty: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  ObjectIsPropertySettable: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  ObjectGetPropertyDataSize: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number | null;
  ObjectGetPropertyData: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: number, p7: interop.PointerConvertible, p8: interop.PointerConvertible) => number | null;
  ObjectSetPropertyData: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: number, p7: interop.PointerConvertible) => number | null;
  DeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null;
  DeviceResume: (p1: interop.PointerConvertible, p2: number) => number | null;
  DeviceStartStream: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  DeviceStopStream: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  DeviceProcessAVCCommand: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  DeviceProcessRS422Command: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  StreamCopyBufferQueue: (p1: interop.PointerConvertible, p2: number, p3: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  StreamDeckPlay: (p1: interop.PointerConvertible, p2: number) => number | null;
  StreamDeckStop: (p1: interop.PointerConvertible, p2: number) => number | null;
  StreamDeckJog: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  StreamDeckCueTo: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number | null;
}

export declare class CMIOStreamScheduledOutputNotificationProcAndRefCon {
  constructor(init?: CMIOStreamScheduledOutputNotificationProcAndRefCon);
  scheduledOutputNotificationProc: (p1: number, p2: number, p3: interop.PointerConvertible) => void | null;
  scheduledOutputNotificationRefCon: interop.Pointer;
}

export declare function CMIOObjectShow(objectID: number): void;

export declare function CMIOObjectHasProperty(objectID: number, address: interop.PointerConvertible): number;

export declare function CMIOObjectIsPropertySettable(objectID: number, address: interop.PointerConvertible, isSettable: interop.PointerConvertible): number;

export declare function CMIOObjectGetPropertyDataSize(objectID: number, address: interop.PointerConvertible, qualifierDataSize: number, qualifierData: interop.PointerConvertible, dataSize: interop.PointerConvertible): number;

export declare function CMIOObjectGetPropertyData(objectID: number, address: interop.PointerConvertible, qualifierDataSize: number, qualifierData: interop.PointerConvertible, dataSize: number, dataUsed: interop.PointerConvertible, data: interop.PointerConvertible): number;

export declare function CMIOObjectSetPropertyData(objectID: number, address: interop.PointerConvertible, qualifierDataSize: number, qualifierData: interop.PointerConvertible, dataSize: number, data: interop.PointerConvertible): number;

export declare function CMIOObjectAddPropertyListener(objectID: number, address: interop.PointerConvertible, listener: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, clientData: interop.PointerConvertible): number;

export declare function CMIOObjectRemovePropertyListener(objectID: number, address: interop.PointerConvertible, listener: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, clientData: interop.PointerConvertible): number;

export declare function CMIOObjectAddPropertyListenerBlock(objectID: number, address: interop.PointerConvertible, dispatchQueue: NSObject, listener: (p1: number, p2: interop.PointerConvertible) => void): number;

export declare function CMIOObjectRemovePropertyListenerBlock(objectID: number, address: interop.PointerConvertible, dispatchQueue: NSObject, listener: (p1: number, p2: interop.PointerConvertible) => void): number;

export declare function CMIOStreamCopyBufferQueue(streamID: number, queueAlteredProc: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, queueAlteredRefCon: interop.PointerConvertible, queue: interop.PointerConvertible): number;

export declare function CMIOStreamDeckPlay(streamID: number): number;

export declare function CMIOStreamDeckStop(streamID: number): number;

export declare function CMIOStreamDeckJog(streamID: number, speed: number): number;

export declare function CMIOStreamDeckCueTo(streamID: number, frameNumber: number, playOnCue: number): number;

export declare function CMIOStreamClockCreate(allocator: interop.Object, clockName: interop.Object, sourceIdentifier: interop.PointerConvertible, getTimeCallMinimumInterval: CMTime, numberOfEventsForRateSmoothing: number, numberOfAveragesForRateSmoothing: number, clock: interop.PointerConvertible): number;

export declare function CMIOStreamClockPostTimingEvent(eventTime: CMTime, hostTime: number, resynchronize: number, clock: interop.Object): number;

export declare function CMIOStreamClockInvalidate(clock: interop.Object): number;

export declare function CMIOStreamClockConvertHostTimeToDeviceTime(hostTime: number, clock: interop.Object): CMTime;

export declare function CMIODeviceStartStream(deviceID: number, streamID: number): number;

export declare function CMIODeviceStopStream(deviceID: number, streamID: number): number;

export declare function CMIODeviceProcessAVCCommand(deviceID: number, ioAVCCommand: interop.PointerConvertible): number;

export declare function CMIODeviceProcessRS422Command(deviceID: number, ioRS422Command: interop.PointerConvertible): number;

export declare function CMIOObjectCreate(owningPlugIn: interop.PointerConvertible, owningObjectID: number, classID: number, objectID: interop.PointerConvertible): number;

export declare function CMIOObjectsPublishedAndDied(owningPlugIn: interop.PointerConvertible, owningObjectID: number, numberPublishedCMIOObjects: number, publishedCMIOObjects: interop.Pointer, numberDeadCMIOObjects: number, deadCMIOObjects: interop.Pointer): number;

export declare function CMIOObjectPropertiesChanged(owningPlugIn: interop.PointerConvertible, objectID: number, numberAddresses: number, addresses: interop.Pointer): number;

export declare function CMIOSampleBufferCreate(allocator: interop.Object, dataBuffer: interop.Object, formatDescription: interop.Object, numSamples: number, numSampleTimingEntries: number, sampleTimingArray: interop.PointerConvertible, numSampleSizeEntries: number, sampleSizeArray: interop.PointerConvertible, sequenceNumber: number, discontinuityFlags: number, sBufOut: interop.PointerConvertible): number;

export declare function CMIOSampleBufferCreateForImageBuffer(allocator: interop.Object, imageBuffer: interop.Object, formatDescription: interop.Object, sampleTiming: interop.PointerConvertible, sequenceNumber: number, discontinuityFlags: number, sBufOut: interop.PointerConvertible): number;

export declare function CMIOSampleBufferCreateNoDataMarker(allocator: interop.Object, noDataEvent: number, formatDescription: interop.Object, sequenceNumber: number, discontinuityFlags: number, sBufOut: interop.PointerConvertible): number;

export declare function CMIOSampleBufferSetSequenceNumber(allocator: interop.Object, sbuf: interop.Object, sequenceNumber: number): void;

export declare function CMIOSampleBufferGetSequenceNumber(sbuf: interop.Object): number;

export declare function CMIOSampleBufferSetDiscontinuityFlags(allocator: interop.Object, sbuf: interop.Object, discontinuityFlags: number): void;

export declare function CMIOSampleBufferGetDiscontinuityFlags(sbuf: interop.Object): number;

export declare function CMIOSampleBufferCopyNonRequiredAttachments(sourceSBuf: interop.Object, destSBuf: interop.Object, attachmentMode: number): number;

export declare function CMIOSampleBufferCopySampleAttachments(sourceSBuf: interop.Object, destSBuf: interop.Object): number;
