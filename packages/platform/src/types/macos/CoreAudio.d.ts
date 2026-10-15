import type { AudioStreamBasicDescription, AudioTimeStamp, AudioValueRange } from './CoreAudioTypes'

import type { CFUUIDBytes } from './CoreFoundation'

import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'



export declare const kAudioDevicePropertyClockAlgorithm: number;

export declare const kAudioDevicePropertyZeroTimeStampPeriod: number;

export declare const kAudioPlugInPropertyResourceBundle: number;

export declare const kAudioServerPlugInHostClientID: number;

export declare const kAudioObjectPlugInObject: number;

export declare const kAudioObjectPropertyCustomPropertyInfoList: number;

export declare const kAudioClockSourceControlPropertyItemKind: number;

export declare const kAudioStreamUnknown: number;

export declare const kAudioDevicePropertyHighPassFilterSettingNameForID: number;

export declare const kAudioDevicePropertyDataSourceNameForID: number;

export declare const kAudioDevicePropertyStreamFormatMatch: number;

export declare const kAudioDevicePropertyStreamFormatSupported: number;

export declare const kAudioDeviceTransportTypeAutoAggregate: number;

export declare const kAudioHardwarePropertyBootChimeVolumeDecibelsToScalarTransferFunction: number;

export declare const kAudioHardwarePropertyBootChimeVolumeDecibels: number;

export declare const kAudioHardwarePropertyBootChimeVolumeScalar: number;

export declare const kAudioHardwarePropertyPlugInForBundleID: number;

export declare const kAudioLevelControlPropertyDecibelsToScalarTransferFunction: number;

export declare const kAudioISubOwnerControlClassID: number;

export declare const kAudioPropertyWildcardChannel: number;

export declare const kAudioPropertyWildcardSection: number;

export declare const kAudioDevicePropertyScopePlayThrough: number;

export declare const kAudioDevicePropertyScopeOutput: number;

export declare const kAudioDevicePropertyScopeInput: number;

export declare const kAudioTapPropertyFormat: number;

export declare const kAudioTapPropertyDescription: number;

export declare const kAudioTapPropertyUID: number;

export declare const kAudioProcessPropertyIsRunning: number;

export declare const kAudioProcessClassID: number;

export declare const kAudioSubTapPropertyDriftCompensationQuality: number;

export declare const kAudioSubTapPropertyDriftCompensation: number;

export declare const kAudioSubTapClassID: number;

export declare const kAudioSubDevicePropertyDriftCompensation: number;

export declare const kAudioSubDevicePropertyExtraLatency: number;

export declare const kAudioAggregateDriftCompensationMinQuality: number;

export declare const kAudioAggregateDevicePropertyMainSubDevice: number;

export declare const kAudioAggregateDevicePropertyComposition: number;

export declare const kAudioDevicePropertySubVolumeDecibels: number;

export declare const kAudioDevicePropertyHighPassFilterSettings: number;

export declare const kAudioDevicePropertyHighPassFilterSetting: number;

export declare const kAudioDevicePropertyChannelNominalLineLevels: number;

export declare const kAudioDevicePropertyPlayThruDestination: number;

export declare const kAudioDevicePropertyPlayThruStereoPanChannels: number;

export declare const kAudioDevicePropertyPlayThruVolumeDecibelsToScalar: number;

export declare const kAudioDevicePropertyPlayThruVolumeScalar: number;

export declare const kAudioDevicePropertyClockSourceKindForID: number;

export declare const kAudioDevicePropertyClockSources: number;

export declare const kAudioDevicePropertyDataSourceKindForID: number;

export declare const kAudioDevicePropertyDataSources: number;

export declare const kAudioDevicePropertyTalkback: number;

export declare const kAudioObjectPropertyScopePlayThrough: number;

export declare const kAudioDevicePropertyVolumeDecibelsToScalar: number;

export declare const kAudioDevicePropertyVolumeDecibels: number;

export declare const kAudioDevicePropertyVoiceActivityDetectionEnable: number;

export declare const kAudioDevicePropertyActualSampleRate: number;

export declare const kAudioDevicePropertyUsesVariableBufferFrameSizes: number;

export declare const kAudioDevicePropertyBufferFrameSize: number;

export declare const kAudioDevicePropertyHogMode: number;

export declare const kAudioDevicePropertyIOStoppedAbnormally: number;

export declare const kAudioDevicePropertyDeviceIsRunningSomewhere: number;

export declare const kAudioDevicePropertyPlugIn: number;

export declare const kAudioDeviceStartTimeDontConsultDeviceFlag: number;

export declare const kAudioHardwarePropertyTranslateUIDToTap: number;

export declare const kAudioHardwarePropertyTapList: number;

export declare const kAudioHardwarePropertyTranslatePIDToProcessObject: number;

export declare const kAudioHardwarePropertyProcessObjectList: number;

export declare const kAudioHardwarePropertyHogModeIsAllowed: number;

export declare const kAudioHardwarePropertySleepingIsAllowed: number;

export declare const kAudioHardwarePropertyProcessIsAudible: number;

export declare const kAudioHardwarePropertyProcessInputMute: number;

export declare const kAudioHardwarePropertyIsInitingOrExiting: number;

export declare const kAudioHardwarePropertyTranslateUIDToClockDevice: number;

export declare const kAudioHardwarePropertyClockDeviceList: number;

export declare const kAudioHardwarePropertyBoxList: number;

export declare const kAudioHardwarePropertyTranslateBundleIDToPlugIn: number;

export declare const kAudioHardwarePropertyPlugInList: number;

export declare const kAudioHardwarePropertyMixStereoToMono: number;

export declare const kAudioHardwarePropertyTranslateUIDToDevice: number;

export declare const kAudioHardwarePropertyDefaultInputDevice: number;

export declare const kAudioSystemObjectClassID: number;

export declare const kAudioObjectPropertyListenerRemoved: number;

export declare const kAudioObjectPropertyListenerAdded: number;

export declare const kAudioObjectSystemObject: number;

export declare const kAudioStereoPanControlPropertyValue: number;

export declare const kAudioStereoPanControlClassID: number;

export declare const kAudioSelectorControlItemKindSpacer: number;

export declare const kAudioSelectorControlPropertyItemKind: number;

export declare const kAudioSelectorControlPropertyItemName: number;

export declare const kAudioLineLevelControlClassID: number;

export declare const kAudioClockSourceControlClassID: number;

export declare const kAudioTalkbackControlClassID: number;

export declare const kAudioLFEMuteControlClassID: number;

export declare const kAudioMuteControlClassID: number;

export declare const kAudioLevelControlPropertyDecibelRange: number;

export declare const kAudioLFEVolumeControlClassID: number;

export declare const kAudioVolumeControlClassID: number;

export declare const kAudioSliderControlPropertyValue: number;

export declare const kAudioControlPropertyElement: number;

export declare const kAudioControlPropertyScope: number;

export declare const kAudioStreamPropertyAvailablePhysicalFormats: number;

export declare const kAudioStreamPropertyPhysicalFormat: number;

export declare const kAudioStreamPropertyVirtualFormat: number;

export declare const kAudioStreamPropertyLatency: number;

export declare const kAudioStreamPropertyStartingChannel: number;

export declare const kAudioStreamTerminalTypeHDMI: number;

export declare const kAudioStreamTerminalTypeReceiverMicrophone: number;

export declare const kAudioStreamTerminalTypeHeadsetMicrophone: number;

export declare const kAudioStreamTerminalTypeReceiverSpeaker: number;

export declare const kAudioStreamTerminalTypeSpeaker: number;

export declare const kAudioStreamTerminalTypeLine: number;

export declare const kAudioClockDevicePropertyClockDomain: number;

export declare const kAudioClockDevicePropertyDeviceUID: number;

export declare const kAudioDevicePropertyWantsControlsRestored: number;

export declare const kAudioDevicePropertyPreferredChannelsForStereo: number;

export declare const kAudioDevicePropertyStreams: number;

export declare const kAudioDevicePropertyLatency: number;

export declare const kAudioDevicePropertyDeviceIsAlive: number;

export declare const kAudioDevicePropertyTransportType: number;

export declare const kAudioDeviceTransportTypeRemoteStreaming: number;

export declare const kAudioDeviceTransportTypeContinuityCaptureWired: number;

export declare const kAudioDeviceTransportTypeThunderbolt: number;

export declare const kAudioDeviceTransportTypeAirPlay: number;

export declare const kAudioDeviceTransportTypeDisplayPort: number;

export declare const kAudioDeviceTransportTypeVirtual: number;

export declare const kAudioDeviceTransportTypeAggregate: number;

export declare const kAudioEndPointClassID: number;

export declare const kAudioDeviceTransportTypeUnknown: number;

export declare const kAudioDeviceClassID: number;

export declare const kAudioBoxPropertyClockDeviceList: number;

export declare const kAudioBoxPropertyHasMIDI: number;

export declare const kAudioBoxPropertyBoxUID: number;

export declare const kAudioTransportManagerPropertyTranslateUIDToEndPoint: number;

export declare const kAudioTransportManagerPropertyEndPointList: number;

export declare const kAudioPlugInPropertyTranslateUIDToClockDevice: number;

export declare const kAudioPlugInPropertyTranslateUIDToBox: number;

export declare const kAudioPlugInPropertyDeviceList: number;

export declare const kAudioObjectPropertyFirmwareVersion: number;

export declare const kAudioObjectPropertyBaseClass: number;

export declare const kAudioObjectClassIDWildcard: number;

export declare const kAudioObjectPropertySelectorWildcard: number;

export declare const kAudioDeviceUnsupportedFormatError: number;

export declare const kAudioHardwareUnsupportedOperationError: number;

export declare const kAudioHardwareBadStreamError: number;

export declare const kAudioHardwareBadDeviceError: number;

export declare const kAudioHardwareUnspecifiedError: number;

export declare const kAudioStreamPropertyTerminalType: number;

export declare const kAudioSubDeviceClassID: number;

export declare const kAudioHardwarePropertyPowerHint: number;

export declare const kAudioLevelControlClassID: number;

export declare const kAudioAggregateDevicePropertyClockDevice: number;

export declare const kAudioDevicePropertyChannelCategoryName: number;

export declare const kAudioDeviceTransportTypeBluetooth: number;

export declare const kAudioDevicePropertySubVolumeScalar: number;

export declare const kAudioStreamTerminalTypeLFESpeaker: number;

export declare const kAudioStreamTerminalTypeTTY: number;

export declare const kAudioDevicePropertyStreamConfiguration: number;

export declare const kAudioObjectPropertyScopeInput: number;

export declare const kAudioTransportManagerPropertyTransportType: number;

export declare const kAudioServerPlugInCustomPropertyDataTypeCFString: number;

export declare const kAudioDataDestinationControlClassID: number;

export declare const kAudioObjectPropertyName: number;

export declare const kAudioDeviceTransportTypeBluetoothLE: number;

export declare const kAudioStreamTerminalTypeMicrophone: number;

export declare const kAudioDeviceTransportTypeFireWire: number;

export declare const kAudioClockDevicePropertyTransportType: number;

export declare const kAudioDevicePropertyPhaseInvert: number;

export declare const kAudioDevicePropertyPlayThruSolo: number;

export declare const kAudioControlClassID: number;

export declare const kAudioDevicePropertySubMute: number;

export declare const kAudioEndPointDeviceClassID: number;

export declare const kAudioProcessPropertyBundleID: number;

export declare const kAudioTransportManagerClassID: number;

export declare const kAudioBoxPropertyAcquired: number;

export declare const kAudioDevicePropertyClockIsStable: number;

export declare const kAudioDeviceProcessorOverload: number;

export declare const kAudioDevicePropertyClockDevice: number;

export declare const kAudioDeviceTransportTypeHDMI: number;

export declare const kAudioStreamPropertyDirection: number;

export declare const kAudioDevicePropertyPlayThru: number;

export declare const kAudioPlugInPropertyBoxList: number;

export declare const kAudioDevicePropertyDeviceIsRunning: number;

export declare const kAudioDevicePropertySafetyOffset: number;

export declare const kAudioSelectorControlPropertyCurrentItem: number;

export declare const kAudioBooleanControlPropertyValue: number;

export declare const kAudioDevicePropertyIOProcStreamUsage: number;

export declare const kAudioBoxPropertyTransportType: number;

export declare const kAudioAggregateDriftCompensationMaxQuality: number;

export declare const kAudioClockSourceItemKindInternal: number;

export declare const kAudioDevicePropertyVolumeScalar: number;

export declare const kAudioClockDevicePropertyDeviceIsRunning: number;

export declare const kAudioDevicePropertyDeviceHasChanged: number;

export declare const kAudioClockDevicePropertyControlList: number;

export declare const kAudioObjectPropertySerialNumber: number;

export declare const kAudioObjectPropertyOwnedObjects: number;

export declare const kAudioStreamPropertyPhysicalFormatMatch: number;

export declare const kAudioHardwarePropertyProcessIsMain: number;

export declare const kAudioObjectPropertyScopeGlobal: number;

export declare const kAudioDevicePropertyMute: number;

export declare const kAudioEndPointDevicePropertyEndPointList: number;

export declare const kAudioHardwareUnknownPropertyError: number;

export declare const kAudioStreamTerminalTypeHeadphones: number;

export declare const kAudioDevicePermissionsError: number;

export declare const kAudioTransportManagerCreateEndPointDevice: number;

export declare const kAudioDevicePropertyPlayThruVolumeDecibels: number;

export declare const kAudioDevicePropertyChannelName: number;

export declare const kAudioLevelControlPropertyDecibelValue: number;

export declare const kAudioSubTapPropertyExtraLatency: number;

export declare const kAudioDevicePropertyNominalSampleRate: number;

export declare const kAudioDevicePropertyDeviceManufacturer: number;

export declare const kAudioEndPointDevicePropertyComposition: number;

export declare const kAudioDevicePropertyChannelCategoryNameCFString: number;

export declare const kAudioDevicePropertyPlayThruVolumeDecibelsToScalarTransferFunction: number;

export declare const kAudioSoloControlClassID: number;

export declare const kAudioDevicePropertyJackIsConnected: number;

export declare const kAudioDeviceTransportTypeAVB: number;

export declare const kAudioDevicePropertyBufferFrameSizeRange: number;

export declare const kAudioDeviceTransportTypeBuiltIn: number;

export declare const kAudioDevicePropertySubVolumeRangeDecibels: number;

export declare const kAudioObjectPropertyModelName: number;

export declare const kAudioObjectPropertyElementWildcard: number;

export declare const kAudioDevicePropertyIOCycleUsage: number;

export declare const kAudioDevicePropertyListenback: number;

export declare const kAudioObjectPropertyElementMain: number;

export declare const kAudioDevicePropertyClockSourceNameForID: number;

export declare const kAudioAggregateDevicePropertyTapList: number;

export declare const kAudioStreamPropertyIsActive: number;

export declare const kAudioBoxPropertyIsProtected: number;

export declare const kAudioDevicePropertyDeviceManufacturerCFString: number;

export declare const kAudioAggregateDriftCompensationLowQuality: number;

export declare const kAudioDevicePropertyRegisterBufferList: number;

export declare const kAudioDevicePropertyClockDomain: number;

export declare const kAudioObjectPropertyOwner: number;

export declare const kAudioDevicePropertyPreferredChannelLayout: number;

export declare const kAudioDevicePropertyChannelNominalLineLevelNameForID: number;

export declare const kAudioObjectPropertyScopeWildcard: number;

export declare const kAudioStreamPropertyOwningDevice: number;

export declare const kAudioHardwarePropertyBootChimeVolumeRangeDecibels: number;

export declare const kAudioObjectUnknown: number;

export declare const kAudioDevicePropertyChannelNominalLineLevel: number;

export declare const kAudioHardwareNotReadyError: number;

export declare const kAudioDeviceStartTimeIsInputFlag: number;

export declare const kAudioHardwarePropertyBootChimeVolumeScalarToDecibels: number;

export declare const kAudioDeviceTransportTypePCI: number;

export declare const kAudioSliderControlClassID: number;

export declare const kAudioBoxPropertyHasAudio: number;

export declare const kAudioDeviceTransportTypeContinuityCaptureWireless: number;

export declare const kAudioDevicePropertyIOThreadOSWorkgroup: number;

export declare const kAudioProcessPropertyPID: number;

export declare const kAudioDevicePropertySubVolumeDecibelsToScalar: number;

export declare const kAudioStreamPropertyPhysicalFormatSupported: number;

export declare const kAudioDevicePropertyClockSource: number;

export declare const kAudioClockDevicePropertyDeviceIsAlive: number;

export declare const kAudioHardwarePropertyServiceRestarted: number;

export declare const kAudioPlugInPropertyBundleID: number;

export declare const kAudioObjectClassID: number;

export declare const kAudioDevicePropertyModelUID: number;

export declare const kAudioSubDevicePropertyDriftCompensationQuality: number;

export declare const kAudioDevicePropertyDataSourceNameForIDCFString: number;

export declare const kAudioHardwarePropertyTranslateUIDToBox: number;

export declare const kAudioDevicePropertyChannelNumberNameCFString: number;

export declare const kAudioAggregateDriftCompensationHighQuality: number;

export declare const kAudioDevicePropertySubVolumeDecibelsToScalarTransferFunction: number;

export declare const kAudioHardwareIllegalOperationError: number;

export declare const kAudioAggregateDevicePropertyActiveSubDeviceList: number;

export declare const kAudioHardwarePropertyDevices: number;

export declare const kAudioDevicePropertyStereoPanChannels: number;

export declare const kAudioListenbackControlClassID: number;

export declare const kAudioClipLightControlClassID: number;

export declare const kAudioHardwarePropertyDefaultOutputDevice: number;

export declare const kAudioHardwarePropertyBootChimeVolumeDecibelsToScalar: number;

export declare const kAudioPlugInPropertyTranslateUIDToDevice: number;

export declare const kAudioObjectPropertyElementNumberName: number;

export declare const kAudioDevicePropertyBufferSize: number;

export declare const kAudioSelectorControlPropertyAvailableItems: number;

export declare const kAudioDataSourceControlClassID: number;

export declare const kAudioDevicePropertyProcessMute: number;

export declare const kAudioDevicePropertyPhantomPower: number;

export declare const kAudioDeviceTransportTypeRemoteScreen: number;

export declare const kAudioBoxPropertyAcquisitionFailed: number;

export declare const kAudioAggregateDeviceClassID: number;

export declare const kAudioObjectPropertyControlList: number;

export declare const kAudioDevicePropertyDeviceName: number;

export declare const kAudioDevicePropertyVoiceActivityDetectionState: number;

export declare const kAudioDevicePropertyHighPassFilterSettingNameForIDCFString: number;

export declare const kAudioDevicePropertyRelatedDevices: number;

export declare const kAudioDevicePropertyVolumeScalarToDecibels: number;

export declare const kAudioBoxClassID: number;

export declare const kAudioBoxPropertyHasVideo: number;

export declare const kAudioDevicePropertyWantsStreamFormatsRestored: number;

export declare const kAudioDevicePropertyDeviceUID: number;

export declare const kAudioBootChimeVolumeControlClassID: number;

export declare const kAudioHardwareBadPropertySizeError: number;

export declare const kAudioObjectPropertyClass: number;

export declare const kAudioStreamTerminalTypeUnknown: number;

export declare const kAudioDevicePropertyConfigurationApplication: number;

export declare const kAudioServerPlugInCustomPropertyDataTypeCFPropertyList: number;

export declare const kAudioDevicePropertyIcon: number;

export declare const kAudioHardwarePropertyTransportManagerList: number;

export declare const kAudioDevicePropertyPlayThruDestinationNameForID: number;

export declare const kAudioDevicePropertyDriverShouldOwniSub: number;

export declare const kAudioClockDevicePropertyAvailableNominalSampleRates: number;

export declare const kAudioDevicePropertyDeviceCanBeDefaultSystemDevice: number;

export declare const kAudioDevicePropertySubVolumeScalarToDecibels: number;

export declare const kAudioDevicePropertyAvailableNominalSampleRates: number;

export declare const kAudioControlPropertyVariant: number;

export declare const kAudioStreamClassID: number;

export declare const kAudioDevicePropertySupportsMixing: number;

export declare const kAudioJackControlClassID: number;

export declare const kAudioBoxPropertyDeviceList: number;

export declare const kAudioStereoPanControlPropertyPanningChannels: number;

export declare const kAudioStreamPropertyAvailableVirtualFormats: number;

export declare const kAudioObjectPropertyCreator: number;

export declare const kAudioHardwareNotRunningError: number;

export declare const kAudioDevicePropertyChannelNumberName: number;

export declare const kAudioSelectorControlClassID: number;

export declare const kAudioAggregateDevicePropertyFullSubDeviceList: number;

export declare const kAudioProcessPropertyDevices: number;

export declare const kAudioPlugInCreateAggregateDevice: number;

export declare const kAudioTransportManagerDestroyEndPointDevice: number;

export declare const kAudioObjectPropertyScopeOutput: number;

export declare const kAudioPhaseInvertControlClassID: number;

export declare const kAudioClockDeviceClassID: number;

export declare const kAudioStreamTerminalTypeDigitalAudioInterface: number;

export declare const kAudioProcessPropertyIsRunningOutput: number;

export declare const kAudioDevicePropertyPlayThruDestinations: number;

export declare const kAudioDeviceStartTimeDontConsultHALFlag: number;

export declare const kAudioDevicePropertyBufferSizeRange: number;

export declare const kAudioDevicePropertyStreamFormat: number;

export declare const kAudioPropertyWildcardPropertyID: number;

export declare const kAudioObjectPropertyElementName: number;

export declare const kAudioDeviceTransportTypeUSB: number;

export declare const kAudioDevicePropertyPlayThruVolumeRangeDecibels: number;

export declare const kAudioSliderControlPropertyRange: number;

export declare const kAudioDevicePropertyStreamFormats: number;

export declare const kAudioDevicePropertyPlayThruVolumeScalarToDecibels: number;

export declare const kAudioDevicePropertyChannelNameCFString: number;

export declare const kAudioObjectPropertyElementCategoryName: number;

export declare const kAudioDevicePropertyStereoPan: number;

export declare const kAudioStreamPropertyPhysicalFormats: number;

export declare const kAudioDevicePropertyDeviceCanBeDefaultDevice: number;

export declare const kAudioPhantomPowerControlClassID: number;

export declare const kAudioDevicePropertyVolumeDecibelsToScalarTransferFunction: number;

export declare const kAudioTapClassID: number;

export declare const kAudioHardwarePropertyTranslateBundleIDToTransportManager: number;

export declare const kAudioDevicePropertyClipLight: number;

export declare const kAudioHardwarePropertyUserSessionIsActiveOrHeadless: number;

export declare const kAudioDevicePropertyChannelNominalLineLevelNameForIDCFString: number;

export declare const kAudioAggregateDriftCompensationMediumQuality: number;

export declare const kAudioAggregateDevicePropertyMasterSubDevice: number;

export declare const kAudioObjectPropertyElementMaster: number;

export declare const kAudioBooleanControlClassID: number;

export declare const kAudioHardwarePropertyRunLoop: number;

export declare const kAudioPlugInDestroyAggregateDevice: number;

export declare const kAudioLevelControlPropertyScalarValue: number;

export declare const kAudioServerPlugInCustomPropertyDataTypeNone: number;

export declare const kAudioHardwarePropertyDefaultSystemOutputDevice: number;

export declare const kAudioObjectPropertyManufacturer: number;

export declare const kAudioDevicePropertyPlayThruStereoPan: number;

export declare const kAudioHardwarePropertyDeviceForUID: number;

export declare const kAudioEndPointDevicePropertyIsPrivate: number;

export declare const kAudioClockDevicePropertyNominalSampleRate: number;

export declare const kAudioDevicePropertySolo: number;

export declare const kAudioHardwareNoError: number;

export declare const kAudioStreamTerminalTypeDisplayPort: number;

export declare const kAudioLevelControlPropertyConvertScalarToDecibels: number;

export declare const kAudioDevicePropertyVolumeRangeDecibels: number;

export declare const kAudioDevicePropertyPlayThruDestinationNameForIDCFString: number;

export declare const kAudioHighPassFilterControlClassID: number;

export declare const kAudioHardwareBadObjectError: number;

export declare const kAudioClockDevicePropertyLatency: number;

export declare const kAudioDeviceUnknown: number;

export declare const kAudioPlugInClassID: number;

export declare const kAudioDevicePropertyDataSource: number;

export declare const kAudioProcessPropertyIsRunningInput: number;

export declare const kAudioHardwarePropertyUserIDChanged: number;

export declare const kAudioDevicePropertyClockSourceNameForIDCFString: number;

export declare const kAudioLevelControlPropertyConvertDecibelsToScalar: number;

export declare const kAudioHardwarePropertyUnloadingIsAllowed: number;

export declare const kAudioDevicePropertyDeviceNameCFString: number;

export declare const kAudioAggregateDevicePropertySubTapList: number;

export declare const kAudioHardwarePropertyProcessIsMaster: number;

export declare const kAudioObjectPropertyIdentify: number;

export declare const kAudioPlugInPropertyClockDeviceList: number;

export declare const kAudioDevicePropertyIsHidden: number;

export declare const AudioServerPlugInIOOperation: {
  Thread: 1953002084,
  Cycle: 1668899692,
  ReadInput: 1919246692,
  ConvertInput: 1667853936,
  ProcessInput: 1885957744,
  ProcessOutput: 1886352756,
  MixOutput: 1835628655,
  ProcessMix: 1886218616,
  ConvertMix: 1668114808,
  WriteMix: 1919513701,
};

export declare const AudioLevelControlTransferFunction: {
  FunctionLinear: 0,
  Function1Over3: 1,
  Function1Over2: 2,
  Function3Over4: 3,
  Function3Over2: 4,
  Function2Over1: 5,
  Function3Over1: 6,
  Function4Over1: 7,
  Function5Over1: 8,
  Function6Over1: 9,
  Function7Over1: 10,
  Function8Over1: 11,
  Function9Over1: 12,
  Function10Over1: 13,
  Function11Over1: 14,
  Function12Over1: 15,
};

export declare const AudioHardwarePowerHint: {
  None: 0,
  FavorSavingPower: 1,
};

export declare const AudioDeviceClockAlgorithmSelector: {
  AlgorithmRaw: 1918990199,
  AlgorithmSimpleIIR: 1768518246,
  Algorithm12PtMovingWindowAverage: 1835103847,
};

export declare class AudioServerPlugInIOCycleInfo {
  constructor(init?: AudioServerPlugInIOCycleInfo);
  mIOCycleCounter: number;
  mNominalIOBufferFrameSize: number;
  mCurrentTime: AudioTimeStamp;
  mInputTime: AudioTimeStamp;
  mOutputTime: AudioTimeStamp;
  mMainHostTicksPerFrame: number;
  mDeviceHostTicksPerFrame: number;
}

export declare class AudioServerPlugInCustomPropertyInfo {
  constructor(init?: AudioServerPlugInCustomPropertyInfo);
  mSelector: number;
  mPropertyDataType: number;
  mQualifierDataType: number;
}

export declare class AudioServerPlugInDriverInterface {
  constructor(init?: AudioServerPlugInDriverInterface);
  _reserved: interop.Pointer;
  QueryInterface: (p1: interop.PointerConvertible, p2: CFUUIDBytes, p3: interop.PointerConvertible) => number | null;
  AddRef: (p1: interop.PointerConvertible) => number | null;
  Release: (p1: interop.PointerConvertible) => number | null;
  Initialize: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  CreateDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  DestroyDevice: (p1: interop.PointerConvertible, p2: number) => number | null;
  AddDeviceClient: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  RemoveDeviceClient: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  PerformDeviceConfigurationChange: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  AbortDeviceConfigurationChange: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  HasProperty: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  IsPropertySettable: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  GetPropertyDataSize: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
  GetPropertyData: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number | null;
  SetPropertyData: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: number, p8: interop.PointerConvertible) => number | null;
  StartIO: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  StopIO: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  GetZeroTimeStamp: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number | null;
  WillDoIOOperation: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number | null;
  BeginIOOperation: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => number | null;
  DoIOOperation: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number | null;
  EndIOOperation: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => number | null;
}

export declare class AudioHardwareIOProcStreamUsage {
  constructor(init?: AudioHardwareIOProcStreamUsage);
  mIOProc: interop.Pointer;
  mNumberStreams: number;
  mStreamIsOn: unknown /* const array */;
}

export declare class AudioStreamRangedDescription {
  constructor(init?: AudioStreamRangedDescription);
  mFormat: AudioStreamBasicDescription;
  mSampleRateRange: AudioValueRange;
}

export declare class AudioObjectPropertyAddress {
  constructor(init?: AudioObjectPropertyAddress);
  mSelector: number;
  mScope: number;
  mElement: number;
}

export declare class AudioServerPlugInClientInfo {
  constructor(init?: AudioServerPlugInClientInfo);
  mClientID: number;
  mProcessID: number;
  mIsNativeEndian: number;
  mBundleID: interop.Object | null;
}

export declare class AudioServerPlugInHostInterface {
  constructor(init?: AudioServerPlugInHostInterface);
  PropertiesChanged: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  CopyFromStorage: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  WriteToStorage: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  DeleteFromStorage: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  RequestDeviceConfigurationChange: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
}

export declare function AudioObjectShow(inObjectID: number): void;

export declare function AudioObjectHasProperty(inObjectID: number, inAddress: interop.PointerConvertible): number;

export declare function AudioObjectIsPropertySettable(inObjectID: number, inAddress: interop.PointerConvertible, outIsSettable: interop.PointerConvertible): number;

export declare function AudioObjectGetPropertyDataSize(inObjectID: number, inAddress: interop.PointerConvertible, inQualifierDataSize: number, inQualifierData: interop.PointerConvertible, outDataSize: interop.PointerConvertible): number;

export declare function AudioObjectGetPropertyData(inObjectID: number, inAddress: interop.PointerConvertible, inQualifierDataSize: number, inQualifierData: interop.PointerConvertible, ioDataSize: interop.PointerConvertible, outData: interop.PointerConvertible): number;

export declare function AudioObjectSetPropertyData(inObjectID: number, inAddress: interop.PointerConvertible, inQualifierDataSize: number, inQualifierData: interop.PointerConvertible, inDataSize: number, inData: interop.PointerConvertible): number;

export declare function AudioObjectAddPropertyListener(inObjectID: number, inAddress: interop.PointerConvertible, inListener: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioObjectRemovePropertyListener(inObjectID: number, inAddress: interop.PointerConvertible, inListener: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioObjectAddPropertyListenerBlock(inObjectID: number, inAddress: interop.PointerConvertible, inDispatchQueue: NSObject, inListener: (p1: number, p2: interop.PointerConvertible) => void): number;

export declare function AudioObjectRemovePropertyListenerBlock(inObjectID: number, inAddress: interop.PointerConvertible, inDispatchQueue: NSObject, inListener: (p1: number, p2: interop.PointerConvertible) => void): number;

export declare function AudioHardwareUnload(): number;

export declare function AudioHardwareCreateAggregateDevice(inDescription: interop.Object, outDeviceID: interop.PointerConvertible): number;

export declare function AudioHardwareDestroyAggregateDevice(inDeviceID: number): number;

export declare function AudioDeviceCreateIOProcID(inDevice: number, inProc: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible, outIOProcID: interop.PointerConvertible): number;

export declare function AudioDeviceCreateIOProcIDWithBlock(outIOProcID: interop.PointerConvertible, inDevice: number, inDispatchQueue: NSObject, inIOBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): number;

export declare function AudioDeviceDestroyIOProcID(inDevice: number, inIOProcID: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number): number;

export declare function AudioDeviceStart(inDevice: number, inProcID: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number): number;

export declare function AudioDeviceStartAtTime(inDevice: number, inProcID: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number, ioRequestedStartTime: interop.PointerConvertible, inFlags: number): number;

export declare function AudioDeviceStop(inDevice: number, inProcID: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number): number;

export declare function AudioDeviceGetCurrentTime(inDevice: number, outTime: interop.PointerConvertible): number;

export declare function AudioDeviceTranslateTime(inDevice: number, inTime: interop.PointerConvertible, outTime: interop.PointerConvertible): number;

export declare function AudioDeviceGetNearestStartTime(inDevice: number, ioRequestedStartTime: interop.PointerConvertible, inFlags: number): number;

export declare function AudioHardwareAddRunLoopSource(inRunLoopSource: interop.Object): number;

export declare function AudioHardwareRemoveRunLoopSource(inRunLoopSource: interop.Object): number;

export declare function AudioHardwareGetPropertyInfo(inPropertyID: number, outSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioHardwareGetProperty(inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioHardwareSetProperty(inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioHardwareAddPropertyListener(inPropertyID: number, inProc: (p1: number, p2: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioHardwareRemovePropertyListener(inPropertyID: number, inProc: (p1: number, p2: interop.PointerConvertible) => number): number;

export declare function AudioDeviceAddIOProc(inDevice: number, inProc: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioDeviceRemoveIOProc(inDevice: number, inProc: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number): number;

export declare function AudioDeviceRead(inDevice: number, inStartTime: interop.PointerConvertible, outData: interop.PointerConvertible): number;

export declare function AudioDeviceGetPropertyInfo(inDevice: number, inChannel: number, isInput: number, inPropertyID: number, outSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioDeviceGetProperty(inDevice: number, inChannel: number, isInput: number, inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioDeviceSetProperty(inDevice: number, inWhen: interop.PointerConvertible, inChannel: number, isInput: number, inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioDeviceAddPropertyListener(inDevice: number, inChannel: number, isInput: number, inPropertyID: number, inProc: (p1: number, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioDeviceRemovePropertyListener(inDevice: number, inChannel: number, isInput: number, inPropertyID: number, inProc: (p1: number, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number): number;

export declare function AudioStreamGetPropertyInfo(inStream: number, inChannel: number, inPropertyID: number, outSize: interop.PointerConvertible, outWritable: interop.PointerConvertible): number;

export declare function AudioStreamGetProperty(inStream: number, inChannel: number, inPropertyID: number, ioPropertyDataSize: interop.PointerConvertible, outPropertyData: interop.PointerConvertible): number;

export declare function AudioStreamSetProperty(inStream: number, inWhen: interop.PointerConvertible, inChannel: number, inPropertyID: number, inPropertyDataSize: number, inPropertyData: interop.PointerConvertible): number;

export declare function AudioStreamAddPropertyListener(inStream: number, inChannel: number, inPropertyID: number, inProc: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => number, inClientData: interop.PointerConvertible): number;

export declare function AudioStreamRemovePropertyListener(inStream: number, inChannel: number, inPropertyID: number, inProc: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => number): number;

export declare function AudioGetCurrentHostTime(): number;

export declare function AudioGetHostClockFrequency(): number;

export declare function AudioGetHostClockMinimumTimeDelta(): number;

export declare function AudioConvertHostTimeToNanos(inHostTime: number): number;

export declare function AudioConvertNanosToHostTime(inNanos: number): number;
