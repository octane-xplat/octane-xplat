import type { CFUUIDBytes } from './CoreFoundation'

import type {
	NSObject,
	Rect,
	UnsignedWide,
	audit_token_t,
	mach_msg_body_t,
	mach_msg_header_t,
} from './Runtime'

import type { interop } from './objc-runtime'

export declare const kIOFWSWVers_KPF: number

export declare const kIOFWMustHaveGap63: number

export declare const kIOFWMustNotBeRoot: number

export declare const kIOFWMustBeRoot: number

export declare const kIOFWDisablePhyOnSleep: number

export declare const kIOFWEnableRetryOnAckD: number

export declare const kIOFWDisableAllPhysicalAccess: number

export declare const kIOFWDisablePhysicalAccess: number

export declare const kFWMaxNodeHops: number

export declare const kFWMaxBusses: number

export declare const kFWBusManagerArbitrationTimeoutDuration: number

export declare const kDCLPtrTimeStampOp: number

export declare const kDCLTimeStampOp: number

export declare const kDCLUpdateDCLListOp: number

export declare const kDCLSetTagSyncBitsOp: number

export declare const kDCLCallProcOp: number

export declare const kDCLReceivePacketStartOp: number

export declare const kFWDCLOpFlagMask: number

export declare const kFWDCLOpDynamicFlag: number

export declare const kFWIsochChannelDoNotResumeOnWake: number

export declare const kFWIsochSy: number

export declare const kFWIsochTCodePhase: number

export declare const kFWIsochChanNumPhase: number

export declare const kFWIsochChanNum: number

export declare const kFWIsochDataLengthPhase: number

export declare const kConfigUnitSWVersIIDC101: number

export declare const kConfigUnitSWVersMacintosh10: number

export declare const kConfigUnitSpec1394TA1: number

export declare const kFWBIBLinkSpeed: number

export declare const kFWBIBGenerationPhase: number

export declare const kFWBIBGeneration: number

export declare const kFWBIBMaxRec: number

export declare const kFWBIBBmc: number

export declare const kFWBIBCmc: number

export declare const kFWBIBBusName: number

export declare const kFWBIBNodeUniqueIDHiAddress: number

export declare const kFWBIBBusNameAddress: number

export declare const kFWBIBHeaderAddress: number

export declare const kFWBroadcastAddress: number

export declare const kFWLocalBusAddress: number

export declare const kFWLocalBusID: number

export declare const kFWAddressNodeIDPhase: number

export declare const kFWAddressBusIDPhase: number

export declare const kFWAddressBusID: number

export declare const kFWCSRStateGone: number

export declare const kFCPCommandAddress: number

export declare const kConfigBIBHeaderAddress: number

export declare const kConfigROMBaseAddress: number

export declare const kCSRChannelsAvailable31_0: number

export declare const kCSRBandwidthAvailable: number

export declare const kCSRBusyTimeout: number

export declare const kCSRMessageResponseAddress: number

export declare const kCSRClockInfo3Address: number

export declare const kCSRClockInfo1Address: number

export declare const kCSRClockStrobeArrivedMidAddress: number

export declare const kCSRClockTickPeriodMidAddress: number

export declare const kCSRClockValueMidAddress: number

export declare const kCSRInterruptMaskAddress: number

export declare const kCSRMemoryBoundLoAddress: number

export declare const kCSRMemoryBaseLoAddress: number

export declare const kCSRUnitsBoundHiAddress: number

export declare const kCSRIndirectAddressAddress: number

export declare const kCSRResetStartAddress: number

export declare const kCSRStateSetAddress: number

export declare const kCSRPrivateSpaceBaseAddressHi: number

export declare const kCSRInitialMemorySpaceBaseAddressLo: number

export declare const kCSRInitialMemorySpaceBaseAddressHi: number

export declare const kCSRNodeID: number

export declare const kConfigLeafDirCRCPhase: number

export declare const kConfigLeafDirLengthPhase: number

export declare const kConfigEntryValuePhase: number

export declare const kConfigEntryKeyValue: number

export declare const kConfigEntryKeyTypePhase: number

export declare const kConfigEntryKeyType: number

export declare const kConfigROMCRCValuePhase: number

export declare const kConfigROMCRCLengthPhase: number

export declare const kConfigROMCRCLength: number

export declare const kCSRStateStateDead: number

export declare const kCSRStateStateRunning: number

export declare const kCSRStateStatePhase: number

export declare const kCSRStateELog: number

export declare const kCSRStateBusDependPhase: number

export declare const kCSRStateUnitDependPhase: number

export declare const kCSRStateUnitDepend: number

export declare const kConfigSBP2LUN: number

export declare const kConfigUnitSwVersionKey: number

export declare const kConfigUnitSpecIdKey: number

export declare const kConfigNodeUnitsExtentKey: number

export declare const kConfigNodeUniqueIdKey: number

export declare const kConfigNodeCapabilitiesKey: number

export declare const kConfigNodeSpecIdKey: number

export declare const kConfigNodeHwVersionKey: number

export declare const kConfigModuleSwVersionKey: number

export declare const kConfigModuleHwVersionKey: number

export declare const kConfigTextualDescriptorKey: number

export declare const kFWAckDataError: number

export declare const kFWAckComplete: number

export declare const kCSRStateBusDepend: number

export declare const kFWAckTimeout: number

export declare const kFWResponseBusResetError: number

export declare const kFWResponseTypeError: number

export declare const kFWResponseAddressError: number

export declare const kFWDCLSyBitsEvent: number

export declare const kCSRClockInfo0Address: number

export declare const kIOFWSpecID_AAPL: number

export declare const kIOVideoFeatureControlClassIDOpticalFilter: number

export declare const kIOVideoFeatureControlClassIDTemperature: number

export declare const kIOVideoFeatureControlClassIDGamma: number

export declare const kIOVideoFeatureControlClassIDWhiteBalanceV: number

export declare const kIOVideoFeatureControlClassIDWhiteBalanceU: number

export declare const kIOVideoFeatureControlClassIDShutter: number

export declare const kIOVideoFeatureControlClassIDIris: number

export declare const kIOVideoFeatureControlClassIDSharpness: number

export declare const kIOVideoFeatureControlClassIDContrast: number

export declare const kIOVideoFeatureControlClassIDSaturation: number

export declare const kIOVideoFeatureControlClassIDHue: number

export declare const kIOVideoFeatureControlClassIDWhiteLevel: number

export declare const kIOVideoFeatureControlClassIDBlackLevel: number

export declare const kIOVideoSelectorControlClassIDDataDestination: number

export declare const kIOVideoBooleanControlClassIDDirection: number

export declare const kIOVideoBooleanControlClassIDJack: number

export declare const kIOVideoControlBaseClassIDSelector: number

export declare const kIOVideoControlBaseClassIDBoolean: number

export declare const kIOVideoControlScopeOutput: number

export declare const kIOVideoControlScopeInput: number

export declare const kIOVideoDeviceNotificationID_ControlValueChanged: number

export declare const kIOVideoDevicePortTypeInput: number

export declare const kIOVideoDevicePortTypeOutput: number

export declare const kIOVideoDevicePortTypeNotification: number

export declare const kXHCIUSB2RootHubAddress: number

export declare const kUSBAddress_Mask: number

export declare const kUSBSpeed_Shift: number

export declare const kUSBCUnsupportedTBCableNotificationType: number

export declare const kUSBCUnsupportedTBPortNotificationType: number

export declare const kUSBCTBUnsupportedNotificationType: number

export declare const kUSBCTBNotEnoughPowerNotificationType: number

export declare const kUSBUnsupportedNotificationType: number

export declare const kUSBEndpointCountExceededNotificationType: number

export declare const kUSBiOSDeviceNotEnoughPowerNotificationType: number

export declare const kUSBIndividualOverCurrentNotificationType: number

export declare const kUSBNotEnoughPowerNotificationType: number

export declare const kUSBLowLatencyIsochTransferKey: number

export declare const kUSBHighSpeedMicrosecondsInFrame: number

export declare const kUSBDeviceSpeedSuperPlusBy2: number

export declare const kUSBDeviceSpeedSuperPlus: number

export declare const kUSBDeviceSpeedSuper: number

export declare const kUSBDeviceSpeedLow: number

export declare const kIOUSBVendorIDApple: number

export declare const kUSBDefaultControlCompletionTimeoutMS: number

export declare const kUSBDefaultControlNoDataTimeoutMS: number

export declare const kIOUSBAnySubClass: number

export declare const kIOUSBAnyClass: number

export declare const addPacketShift: number

export declare const kUSB_SSCompDesc_Isoc_Mult_Shift: number

export declare const kUSB_SSCompDesc_Isoc_Mult_Mask: number

export declare const kUSB_SSCompDesc_Bulk_MaxStreams_Shift: number

export declare const kUSB_HSFSEPDesc_wMaxPacketSize_Mult_Shift: number

export declare const kUSB_EPDesc_wMaxPacketSize_MPS_Shift: number

export declare const kUSB_EPDesc_wMaxPacketSize_MPS_Mask: number

export declare const kUSB_EPDesc_bmAttributes_UsageType_Mask: number

export declare const kUSB_EPDesc_bmAttributes_SyncType_Shift: number

export declare const kUSB_EPDesc_bmAttributes_SyncType_Mask: number

export declare const kUSB_EPDesc_bmAttributes_TranType_Mask: number

export declare const kIOUSBDeviceCapabilityDescriptorLengthMin: number

export declare const kIOUSBDeviceCapabilityDescriptorType: number

export declare const kSetInterfaceFeature: number

export declare const kSetDescriptor: number

export declare const kGetEndpointStatus: number

export declare const kGetInterfaceStatus: number

export declare const kGetInterface: number

export declare const kGetConfiguration: number

export declare const kClearEndpointFeature: number

export declare const kClearDeviceFeature: number

export declare const kUSBMaxHSIsocEndpointReqCount: number

export declare const kUSBMaxFSIsocEndpointReqCount: number

export declare const kUSBRqRecipientMask: number

export declare const kUSBRqDirnMask: number

export declare const kUSBRqDirnShift: number

export declare const kUSBStreamIDAllStreamsMask: number

export declare const kUSBAllStreams: number

export declare const kUSBMaxStream: number

export declare const kUSBUCRequestWithoutUSBNotificationMask: number

export declare const kUSBNoPipeIdx: number

export declare const kUSBDeviceMask: number

export declare const kUSBInterfaceIDMask: number

export declare const kUSBMaxInterfaces: number

export declare const kUSBPipeIDMask: number

export declare const kUSBDeviceIDMask: number

export declare const kUSBMaxDevice: number

export declare const kUSBMaxDevices: number

export declare const kUSBDeviceIDShift: number

export declare const kUSBBillboardAdditinalInfoNoPower: number

export declare const kUSBBillboardAltModeConfigSuccess: number

export declare const kUSBBillboardConfigUnsuccessful: number

export declare const kUSBBillboardVConnReserved: number

export declare const kUSBBillboardVConn6Watt: number

export declare const kFWDCLOpVendorDefinedFlag: number

export declare const kUSBBillboardVConn3Watt: number

export declare const kUSBBillboardVConn1P5Watt: number

export declare const kUSBSuperSpeedSupportsLS: number

export declare const kUSBImplicitFeedbackDataIsocUsageType: number

export declare const kUSBNoSynchronizationIsocSyncType: number

export declare const kUSBNotificationInterruptUsageType: number

export declare const kUSBEndpointbmAttributesUsageTypeShift: number

export declare const kUSBEndpointbmAttributesUsageTypeMask: number

export declare const kUSBEndpointbmAttributesSynchronizationTypeShift: number

export declare const kUSBEndpointbmAttributesSynchronizationTypeMask: number

export declare const kUSBEndpointbmAttributesTransferTypeMask: number

export declare const kUSBEndpointDirectionIn: number

export declare const kUSBEndpointDirectionOut: number

export declare const kUSBbEndpointDirectionBit: number

export declare const kUSBDFUManifestationTolerantBit: number

export declare const kMSCProtocolControlBulk: number

export declare const KUSBInterfaceAssociationDescriptorProtocol: number

export declare const kUSBBluetoothProgrammingInterfaceProtocol: number

export declare const kUSB2ComplianceDeviceProtocol: number

export declare const kUSBVendorSpecificProtocol: number

export declare const kHIDMouseInterfaceProtocol: number

export declare const kUSBVideoInterfaceCollectionSubClass: number

export declare const kUSBCommonClassSubClass: number

export declare const kUSBCommEthernetNetworkingSubClass: number

export declare const kUSBCommMultiChannelSubClass: number

export declare const kUSBCommAbstractSubClass: number

export declare const kUSBHIDBootInterfaceSubClass: number

export declare const kUSBMassStorageQIC157SubClass: number

export declare const kUSBMassStorageATAPISubClass: number

export declare const kUSBTestMeasurementSubClass: number

export declare const kUSBMIDIStreamingSubClass: number

export declare const kUSBAudioStreamingSubClass: number

export declare const kUSBAudioControlSubClass: number

export declare const kUSBHubSubClass: number

export declare const kUSBDisplayClass: number

export declare const kUSBVendorSpecificInterfaceClass: number

export declare const kUSBWirelessControllerInterfaceClass: number

export declare const kUSBPersonalHealthcareInterfaceClass: number

export declare const kUSBVideoInterfaceClass: number

export declare const kUSBContentSecurityInterfaceClass: number

export declare const kUSBMassStorageInterfaceClass: number

export declare const kUSBImageInterfaceClass: number

export declare const kUSBHIDClass: number

export declare const kUSBApplicationSpecificClass: number

export declare const kUSBMiscellaneousClass: number

export declare const kUSBWirelessControllerClass: number

export declare const kUSBDiagnosticClass: number

export declare const kUSBCommunicationClass: number

export declare const kHIDBootProtocolValue: number

export declare const kHIDRtFeatureReport: number

export declare const kHIDRtInputReport: number

export declare const kHIDRqSetProtocol: number

export declare const kHIDRqSetReport: number

export declare const kHIDRqGetReport: number

export declare const kUSBRel30: number

export declare const kUSBRel20: number

export declare const kUSB3MaxPowerPerPort: number

export declare const kUSB150mA: number

export declare const kUSB900mAAvailable: number

export declare const kUSB2MaxPowerPerPort: number

export declare const kUSBAtrRemoteWakeup: number

export declare const kUSBAtrBusPowered: number

export declare const kUSBLowPowerSuspendStateBit: number

export declare const kUSBFunctionRemoteWakeupBit: number

export declare const kUSBFunctionRemoteWakeCapableBit: number

export declare const kUSBFeatureU2Enable: number

export declare const kUSBDeviceCapabilityContainerID: number

export declare const kUSBDeviceCapabilityWirelessUSB: number

export declare const kUSBReportDesc: number

export declare const kUSBHIDDesc: number

export declare const kUSBOnTheGoDesc: number

export declare const kUSBOtherSpeedConfDesc: number

export declare const kUSBEndpointDesc: number

export declare const kUSBInterfaceDesc: number

export declare const kUSBDeviceDesc: number

export declare const kUSBSetSel: number

export declare const kUSBRqSyncFrame: number

export declare const kUSBRqSetInterface: number

export declare const kUSBRqGetConfig: number

export declare const kUSBRqSetDescriptor: number

export declare const kUSBEndpoint: number

export declare const kUSBDevice: number

export declare const kUSBAnyDirn: number

export declare const kUSBNone: number

export declare const kUSBIn: number

export declare const kUSBAnyType: number

export declare const kUSBIsoc: number

export declare const kIOUSBHubDelayNs: number

export declare const kIOUSBInterfaceSuspendRemoteWakeEnable: number

export declare const kIOUSBInterfaceSuspendLowPower: number

export declare const IOUSBEndpointFeatureSelectorStall: number

export declare const kIOUSBDeviceFeatureSelectorU2Enable: number

export declare const IOUSBEndpointStatusHalt: number

export declare const kIOUSBInterfaceStatusRemoteWakeCapable: number

export declare const kIOUSBDeviceStatusU2Enable: number

export declare const kIOUSBDeviceStatusRemoteWakeEnable: number

export declare const kIOUSBDeviceRequestGetConfiguration: number

export declare const kIOUSBDeviceRequestSetDescriptor: number

export declare const kIOUSBDeviceRequestSetFeature: number

export declare const kIOUSBDeviceRequestGetState: number

export declare const kIOUSBDeviceRequestClearFeature: number

export declare const kIOUSBDeviceRequestGetStatus: number

export declare const kIOUSBSuperSpeedHubDelayMax: number

export declare const kIOUSBSuperSpeedHubCharacteristicsReserved: number

export declare const kIOUSBSuperSpeedHubCharacteristicsOverCurrentIndividual: number

export declare const kIOUSBSuperSpeedHubCharacteristicsCompoundDevice: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorIsocReservedPhase: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorIsocReserved: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorIsocMultPhase: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorBulkReservedPhase: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorBulkReserved: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorBulkMaxStreams: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorMaxBurstPhase: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedMantissa: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkProtocolPhase: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkDirectionTx: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSymmetry: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkType: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkLSEGbits: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkLSEMbits: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkLSE: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedIdPhase: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedId: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilityMinTxLaneCount: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilityMinRxLaneCount: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkMinSpeedIdPhase: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedIdCount: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedAttrCount: number

export declare const kIOUSBSuperSpeedDeviceCapabilitySupport5Gb: number

export declare const kIOUSBSuperSpeedDeviceCapabilitySupportFullSpeed: number

export declare const kIOUSBSuperSpeedDeviceCapabilityFullSpeed: number

export declare const kIOUSBSuperSpeedDeviceCapabilityLTM: number

export declare const kIOUSBUSB20ExtensionCapabilityBESLD: number

export declare const kIOUSBUSB20ExtensionCapabilityBESLValid: number

export declare const kIOUSBUSB20ExtensionCapabilityBESLSupport: number

export declare const kIOUSBUSB20ExtensionCapabilityLPM: number

export declare const kIOUSBEndpointDescriptorReservedPhase: number

export declare const kIOUSB30RetimerDepthLimit: number

export declare const kIOUSBEndpointDescriptorReserved: number

export declare const kIOUSBEndpointDescriptorPacketSizeMultPhase: number

export declare const kIOUSBEndpointDescriptorPacketSize: number

export declare const kIOUSBEndpointDescriptorUsageTypeInterruptReserved1: number

export declare const kIOUSBEndpointDescriptorUsageTypeInterruptPeriodic: number

export declare const kMSCProtocolBulkOnly: number

export declare const kIOUSBEndpointDescriptorUsageTypePhase: number

export declare const kIOUSBEndpointDescriptorUsageType: number

export declare const kIOUSBEndpointDescriptorSynchronizationTypeAdaptive: number

export declare const kIOUSBEndpointDescriptorSynchronizationTypeAsynchronous: number

export declare const kIOUSBEndpointDescriptorSynchronizationTypeNone: number

export declare const kIOUSBEndpointDescriptorSynchronizationTypePhase: number

export declare const kIOUSBEndpointDescriptorSynchronizationType: number

export declare const kIOUSBEndpointDescriptorTransferTypeInterrupt: number

export declare const kIOUSBEndpointDescriptorTransferTypeIsochronous: number

export declare const kIOUSBEndpointDescriptorTransferType: number

export declare const kIOUSBEndpointDescriptorDirectionIn: number

export declare const kIOUSBEndpointDescriptorDirectionOut: number

export declare const kIOUSBEndpointDescriptorEndpointAddressReserved: number

export declare const kIOUSBEndpointDescriptorNumber: number

export declare const kIOUSBConfigurationDescriptorAttributeSelfPowered: number

export declare const kIOUSBConfigurationDescriptorAttributeRemoteWakeCapable: number

export declare const kIOUSBAppleVendorID: number

export declare const kIOUSBLinkSpeed80Gbps: number

export declare const kIOUSBLinkSpeed20Gbps: number

export declare const kIOUSBLinkSpeedLow: number

export declare const kIOStreamEnqueueInputSyncTrap: number

export declare const kIOStreamMethodSetMode: number

export declare const kIOStreamMethodStart: number

export declare const kIOStreamMethodClose: number

export declare const kIOStreamOptionOpenExclusive: number

export declare const kIOStreamPortTypeInput: number

export declare const kIOStreamPortTypeOutput: number

export declare const kIOStreamMemoryTypeMask: number

export declare const kIOStreamBufferIDMask: number

export declare const kIOStreamMemoryTypeBufferData: number

export declare const kATASMARTSelfTestStatusPreviousTestReadFailure: number

export declare const kATASMARTSelfTestStatusPreviousTestElectricalFailure: number

export declare const kATASMARTSelfTestStatusPreviousTestUnknownFailure: number

export declare const kATASMARTSelfTestStatusFatalError: number

export declare const kDCLReceivePacketOp: number

export declare const kATASMARTOffLineCollectionFatalError: number

export declare const kATASMARTOffLineCollectionAbortedByHost: number

export declare const kATASMARTOffLineCollectionNeverStarted: number

export declare const kATAOperationTypeSMS: number

export declare const kATAOperationTypePowerManagement: number

export declare const kATAOperationTypeSMART: number

export declare const kATAOperationTypeFlushCache: number

export declare const kATAOperationTypeWrite: number

export declare const kATAEnablePIOModeMask: number

export declare const kATAEnableMultiWordDMAModeMask: number

export declare const kIOATADefaultPerformance: number

export declare const kIOATAFeature48BitLBA: number

export declare const kIOATAFeatureCompactFlash: number

export declare const kATAValidLogicalSectorSizeMask: number

export declare const kATAValidLogicalSectorSizeBit: number

export declare const kATAPhysicalLogicalEnabledBit0: number

export declare const kATAForceUnitAccessFeatureMask: number

export declare const kATASupportsFlushCacheExtendedMask: number

export declare const kATASupports48BitAddressingMask: number

export declare const kATASupportsCompactFlashMask: number

export declare const kATASupportsFlushCacheBit: number

export declare const kATASupports48BitAddressingBit: number

export declare const kATASupportsWriteCacheMask: number

export declare const kATASupportsSMARTMask: number

export declare const kATASupportsWriteCacheBit: number

export declare const kATASupportsSMARTBit: number

export declare const k5Minutes: number

export declare const kIOATAMaxBlocksPerXfer: number

export declare const kIOATAMaximumBlockCount16Bit: number

export declare const kIOATAMaximumBlockCount8Bit: number

export declare const kIOATASectorCount16Bit: number

export declare const kIOATASectorCount8Bit: number

export declare const kATADefaultRetries: number

export declare const kATAZeroRetries: number

export declare const kATATimeout45Seconds: number

export declare const kATATimeout30Seconds: number

export declare const kATATimeout10Seconds: number

export declare const kSizeOfATARevisionString: number

export declare const kSizeOfATAModelString: number

export declare const kCurFieldsValidMask: number

export declare const kExtFieldsValidBit: number

export declare const kStandbySupportedMask: number

export declare const kIORDYSupportedMask: number

export declare const kDMADisableMask: number

export declare const kIOUSBEndpointDescriptorUsageTypeIsocFeedback: number

export declare const kLBASupportedMask: number

export declare const kDMASupportedMask: number

export declare const kDMABit: number

export declare const kNonMagneticDriveMask: number

export declare const kRemoveableMediaBit: number

export declare const kFixedDeviceBit: number

export declare const kATAIdentifyIntegrity: number

export declare const kATAIdentifyLogicalSectorAlignment: number

export declare const kATAIdentifyWordsPerLogicalSector2: number

export declare const kATAIdentifyCommandsDefault: number

export declare const kATAIdentifyCommandsEnabled: number

export declare const kATAIdentifyCommandExtension2: number

export declare const kATAIdentifyCommandSetSupported2: number

export declare const kATAIdentifyCommandSetSupported: number

export declare const kATAIdentifyQueueDepth: number

export declare const kATAIdentifyMinPIOTimeWithIORDY: number

export declare const kATAIdentifyMinPIOTime: number

export declare const kATAIdentifyRecommendedMultiWordDMATime: number

export declare const kATAIdentifyMinMultiWordDMATime: number

export declare const kATAIdentifyAdvancedPIOModes: number

export declare const kATAIdentifyMultiWordDMA: number

export declare const kATAIdentifySingleWordDMA: number

export declare const kATAIdentifyCurrentCapacity: number

export declare const kATAIdentifyCurrentCylinders: number

export declare const kATAIdentifyPIOTiming: number

export declare const kATAIdentifyModelNumber: number

export declare const kIOStorageUnmapOptionReserved: number

export declare const kIOStorageUnmapOptionNone: number

export declare const kCDTrackInfoAddressTypeLBA: number

export declare const kCDTOCFormatATIP: number

export declare const kCDTOCFormatPMA: number

export declare const kCDMediaTypeMax: number

export declare const kCDMediaTypeROM: number

export declare const kCDMediaTypeUnknown: number

export declare const kIOMediaAttributeReservedMask: number

export declare const kBDMediaTypeMax: number

export declare const kBDMediaTypeMin: number

export declare const kBDMediaTypeR: number

export declare const kBDMediaTypeROM: number

export declare const kDVDRZoneInfoAddressTypeLBA: number

export declare const kDVDStructureFormatManufacturingInfo: number

export declare const kDVDStructureFormatDiscKeyInfo: number

export declare const kDVDStructureFormatPhysicalFormatInfo: number

export declare const kDVDKeyFormatAGID_Invalidate: number

export declare const kDVDKeyFormatASF: number

export declare const kDVDKeyFormatTitleKey: number

export declare const kDVDKeyFormatKey1: number

export declare const kDVDKeyFormatChallengeKey: number

export declare const kDVDKeyFormatAGID_CSS: number

export declare const kDVDKeyClassRSSA: number

export declare const kDVDBookTypePlusRW: number

export declare const kDVDBookTypeHDRW: number

export declare const kDVDBookTypeHDR: number

export declare const kDVDBookTypeRAM: number

export declare const kDVDBookTypeROM: number

export declare const kDVDRegionalPlaybackControlSchemePhase2: number

export declare const kDVDRegionalPlaybackControlSchemePhase1: number

export declare const kDVDCPRMRegion6: number

export declare const kDVDCPRMRegion5: number

export declare const kDVDCPRMRegion3: number

export declare const kDVDMediaTypeMax: number

export declare const kDVDMediaTypeHDRW: number

export declare const kDVDMediaTypeHDROM: number

export declare const kDVDMediaTypePlusRW: number

export declare const kDVDMediaTypeRW: number

export declare const kDVDMediaTypeR: number

export declare const kDVDMediaTypeROM: number

export declare const kMMCDeviceTrayOpen: number

export declare const kREPORT_LUNS_ADDRESS_METHOD_OFFSET: number

export declare const kREPORT_LUNS_ADDRESS_METHOD_LOGICAL_UNIT: number

export declare const kREPORT_LUNS_ADDRESS_METHOD_FLAT_SPACE: number

export declare const kSCSICDBSize_12Byte: number

export declare const kSCSICDBSize_10Byte: number

export declare const kSCSICDBSize_6Byte: number

export declare const kREAD_CAPACITY_RTO_Disabled: number

export declare const kREPORT_CAPACITY_DataSize: number

export declare const kRBCCmd_WRITE_BUFFER: number

export declare const kRBCCmd_WRITE_10: number

export declare const kRBCCmd_VERIFY_10: number

export declare const kRBCCmd_START_STOP_UNIT: number

export declare const kRBCCmd_FORMAT_UNIT: number

export declare const kSESCmd_RESERVE_10: number

export declare const kSESCmd_PERSISTENT_RESERVE_IN: number

export declare const kSESCmd_MODE_SENSE_6: number

export declare const kSESCmd_MODE_SELECT_6: number

export declare const kSCCCmd_SEND_DIAGNOSTICS: number

export declare const kSCCCmd_RESERVE_6: number

export declare const kSCCCmd_RELEASE_10: number

export declare const kSCCCmd_RELEASE_6: number

export declare const kSCCCmd_REDUNDANCY_GROUP_OUT: number

export declare const kSCCCmd_REDUNDANCY_GROUP_IN: number

export declare const kSCCCmd_PERSISTENT_RESERVE_IN: number

export declare const kSCCCmd_MODE_SELECT_6: number

export declare const kSCCCmd_MAINTENANCE_IN: number

export declare const kSMCCmd_RESERVE_ELEMENT_10: number

export declare const kSMCCmd_RELEASE_ELEMENT_6: number

export declare const kSMCCmd_POSITION_TO_ELEMENT: number

export declare const kSMCCmd_MODE_SELECT_6: number

export declare const kSMCCmd_INITIALIZE_ELEMENT_STATUS: number

export declare const kSGCCmd_TEST_UNIT_READY: number

export declare const kSGCCmd_SET_WINDOW: number

export declare const kSGCCmd_SEND: number

export declare const kSGCCmd_REQUEST_SENSE: number

export declare const kSGCCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kSGCCmd_OBJECT_POSITION: number

export declare const kSGCCmd_MODE_SENSE_6: number

export declare const kSGCCmd_LOG_SELECT: number

export declare const kSGCCmd_GET_WINDOW: number

export declare const kSGCCmd_GET_DATA_BUFFER_STATUS: number

export declare const kSGCCmd_CHANGE_DEFINITION: number

export declare const kMMCCmd_WRITE_BUFFER: number

export declare const kMMCCmd_WRITE_AND_VERIFY_10: number

export declare const kMMCCmd_WRITE_12: number

export declare const kMMCCmd_WRITE_10: number

export declare const kMMCCmd_TEST_UNIT_READY: number

export declare const kMMCCmd_SYNCHRONIZE_CACHE: number

export declare const kMMCCmd_START_STOP_UNIT: number

export declare const kMMCCmd_SET_STREAMING: number

export declare const kMMCCmd_SET_READ_AHEAD: number

export declare const kMMCCmd_SET_LIMITS_12: number

export declare const kMMCCmd_SET_LIMITS_10: number

export declare const kMMCCmd_SET_CD_SPEED: number

export declare const kMMCCmd_SEND_KEY: number

export declare const kMMCCmd_SEND_DVD_STRUCTURE: number

export declare const kMMCCmd_SEEK_10: number

export declare const kMMCCmd_SEARCH_DATA_LOW_10: number

export declare const kMMCCmd_SEARCH_DATA_HIGH_12: number

export declare const kMMCCmd_SEARCH_DATA_EQUAL_10: number

export declare const kMMCCmd_RESERVE_TRACK: number

export declare const kMMCCmd_REQUEST_SENSE: number

export declare const kMMCCmd_REPORT_KEY: number

export declare const kMMCCmd_READ_LONG: number

export declare const kMMCCmd_READ_CAPACITY: number

export declare const kMMCCmd_READ_CD_MSF: number

export declare const kMMCCmd_READ_BUFFER: number

export declare const kMMCCmd_READ_12: number

export declare const kMMCCmd_READ_10: number

export declare const kMMCCmd_PREVENT_ALLOW_MEDIUM_REMOVAL: number

export declare const kMMCCmd_PREFETCH: number

export declare const kMMCCmd_PLAY_AUDIO_12: number

export declare const kMMCCmd_MODE_SENSE_10: number

export declare const kMMCCmd_MODE_SENSE_6: number

export declare const kMMCCmd_MODE_SELECT_6: number

export declare const kMMCCmd_LOG_SELECT: number

export declare const kMMCCmd_LOAD_UNLOAD_MEDIUM: number

export declare const kMMCCmd_INQUIRY: number

export declare const kMMCCmd_GET_EVENT_STATUS_NOTIFICATION: number

export declare const kMMCCmd_GET_CONFIGURATION: number

export declare const kMMCCmd_ERASE: number

export declare const kMMCCmd_CHANGE_DEFINITION: number

export declare const kMMCCmd_BLANK: number

export declare const kSBCWOCmd_WRITE_LONG: number

export declare const kSBCWOCmd_WRITE_BUFFER: number

export declare const kSBCWOCmd_WRITE_AND_VERIFY_12: number

export declare const kSBCWOCmd_WRITE_10: number

export declare const kSBCWOCmd_SYNCHRONIZE_CACHE: number

export declare const kSBCWOCmd_START_STOP_UNIT: number

export declare const kSBCWOCmd_SET_LIMITS_12: number

export declare const kUSBChipSmartCardInterfaceClass: number

export declare const kSBCWOCmd_SEEK_6: number

export declare const kSBCWOCmd_SEARCH_DATA_HIGH_12: number

export declare const kSBCWOCmd_SEARCH_DATA_HIGH_10: number

export declare const kSBCWOCmd_SEARCH_DATA_EQUAL_10: number

export declare const kSBCWOCmd_REZERO_UNIT: number

export declare const kSBCWOCmd_REQUEST_SENSE: number

export declare const kSBCWOCmd_RELEASE_10: number

export declare const kSBCWOCmd_RELEASE_6: number

export declare const kSBCWOCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kSBCWOCmd_READ_LONG: number

export declare const kSBCWOCmd_READ_ELEMENT_STATUS: number

export declare const kSBCWOCmd_READ_6: number

export declare const kIOUSBSuperSpeedDeviceCapabilityU2DevExitLatMax: number

export declare const kSBCWOCmd_PREVENT_ALLOW_MEDIUM_REMOVAL: number

export declare const kSBCWOCmd_PREFETCH: number

export declare const kSBCWOCmd_PERSISTENT_RESERVE_IN: number

export declare const kSBCWOCmd_MODE_SENSE_6: number

export declare const kSBCWOCmd_MODE_SELECT_6: number

export declare const kSBCWOCmd_MEDIUM_SCAN: number

export declare const kSBCWOCmd_LOG_SENSE: number

export declare const kSBCWOCmd_LOG_SELECT: number

export declare const kSBCWOCmd_INQUIRY: number

export declare const kSBCWOCmd_COMPARE: number

export declare const kSBCWOCmd_CHANGE_DEFINITION: number

export declare const kSPCProcCmd_WRITE_BUFFER: number

export declare const kSPCProcCmd_RELEASE_6: number

export declare const kSPCProcCmd_RELEASE_10: number

export declare const kSPCProcCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kSPCProcCmd_RECEIVE: number

export declare const kSPCProcCmd_PERSISTENT_RESERVE_OUT: number

export declare const kSPCProcCmd_EXTENDED_COPY: number

export declare const kSPCProcCmd_COPY_AND_VERIFY: number

export declare const kSPCProcCmd_CHANGE_DEFINITION: number

export declare const kSSCPrinterCmd_WRITE_BUFFER: number

export declare const kSSCPrinterCmd_SYNCHRONIZE_BUFFER: number

export declare const kSSCPrinterCmd_SEND_DIAGNOSTICS: number

export declare const kSSCPrinterCmd_RESERVE_10: number

export declare const kSSCPrinterCmd_RESERVE_6: number

export declare const kSSCPrinterCmd_REQUEST_SENSE: number

export declare const kSSCPrinterCmd_RELEASE_6: number

export declare const kSSCPrinterCmd_PERSISTENT_RESERVE_OUT: number

export declare const kSSCPrinterCmd_PERSISTENT_RESERVE_IN: number

export declare const kSSCPrinterCmd_INQUIRY: number

export declare const kSSCPrinterCmd_FORMAT: number

export declare const kSSCPrinterCmd_COPY: number

export declare const kSSCPrinterCmd_COMPARE: number

export declare const kATAIdentifyMultipleSectorCount: number

export declare const kSSCPrinterCmd_CHANGE_DEFINITION: number

export declare const kSSCSeqCmd_TEST_UNIT_READY: number

export declare const kSSCSeqCmd_RESERVE_10: number

export declare const kSSCSeqCmd_RESERVE_6: number

export declare const kSSCSeqCmd_REPORT_DENSITY_SUPPORT: number

export declare const kSSCSeqCmd_RELEASE_10: number

export declare const kSSCSeqCmd_RELEASE_6: number

export declare const kSSCSeqCmd_RECOVER_BUFFERED_DATA: number

export declare const kSSCSeqCmd_READ_REVERSE: number

export declare const kSSCSeqCmd_READ_6: number

export declare const kSSCSeqCmd_PREVENT_ALLOW_MEDIUM_REMOVAL: number

export declare const kSSCSeqCmd_PERSISTENT_RESERVE_OUT: number

export declare const kSSCSeqCmd_MODE_SENSE_10: number

export declare const kSSCSeqCmd_MODE_SENSE_6: number

export declare const kSSCSeqCmd_MODE_SELECT_10: number

export declare const kSSCSeqCmd_LOG_SENSE: number

export declare const kSSCSeqCmd_FORMAT_MEDIUM: number

export declare const kSSCSeqCmd_ERASE: number

export declare const kSSCSeqCmd_COPY_AND_VERIFY: number

export declare const kSSCSeqCmd_COPY: number

export declare const kSBCCmd_XDREAD: number

export declare const kSBCCmd_WRITE_SAME: number

export declare const kSBCCmd_WRITE_AND_VERIFY_10: number

export declare const kSBCCmd_WRITE_10: number

export declare const kSBCCmd_WRITE_6: number

export declare const kSBCCmd_START_STOP_UNIT: number

export declare const kSBCCmd_SET_LIMITS_12: number

export declare const kSBCCmd_SET_LIMITS_10: number

export declare const kSBCCmd_SEEK_10: number

export declare const kSBCCmd_SEARCH_DATA_HIGH_10: number

export declare const kSBCCmd_SEARCH_DATA_EQUAL_10: number

export declare const kSBCCmd_RESERVE_6: number

export declare const kSBCCmd_RELEASE_10: number

export declare const kSBCCmd_RELEASE_6: number

export declare const kSBCCmd_REGENERATE: number

export declare const kSBCCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kSBCCmd_REBUILD: number

export declare const kSBCCmd_REASSIGN_BLOCKS: number

export declare const kSBCCmd_READ_LONG: number

export declare const kSBCCmd_READ_GENERATION: number

export declare const kSBCCmd_READ_DEFECT_DATA_12: number

export declare const kSBCCmd_READ_DEFECT_DATA_10: number

export declare const kSBCCmd_READ_BUFFER: number

export declare const kSBCCmd_READ_12: number

export declare const kSBCCmd_PREVENT_ALLOW_MEDIUM_REMOVAL: number

export declare const kSBCCmd_MODE_SENSE_10: number

export declare const kSBCCmd_MODE_SENSE_6: number

export declare const kSBCCmd_MODE_SELECT_10: number

export declare const kSBCCmd_INQUIRY: number

export declare const kSBCCmd_COPY: number

export declare const kSBCCmd_COMPARE: number

export declare const kSBCCmd_CHANGE_DEFINITION: number

export declare const kSPCCmd_WRITE_BUFFER: number

export declare const kSPCCmd_RESERVE_6: number

export declare const kSPCCmd_RESERVE_10: number

export declare const kSPCCmd_RELEASE_6: number

export declare const kSPCCmd_RELEASE_10: number

export declare const kSPCCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kSPCCmd_READ_BUFFER: number

export declare const kSPCCmd_PERSISTENT_RESERVE_IN: number

export declare const kSPCCmd_MOVE_MEDIUM_ATTACHED: number

export declare const kSPCCmd_MODE_SENSE_6: number

export declare const kSPCCmd_MODE_SELECT_6: number

export declare const kSPCCmd_LOG_SENSE: number

export declare const kSPCCmd_COMPARE: number

export declare const kSPCCmd_CHANGE_DEFINITION: number

export declare const kSCSIServiceAction_WRITE_LONG_16: number

export declare const kSCSIServiceAction_READ_CAPACITY_16: number

export declare const kSCSIServiceAction_SET_DEVICE_IDENTIFIER: number

export declare const kSCSIServiceAction_CHANGE_ALIASES: number

export declare const kSCSIServiceAction_REPORT_TARGET_PORT_GROUPS: number

export declare const kSCSIServiceAction_REPORT_SUPPORTED_OPERATION_CODES: number

export declare const kSCSIServiceAction_REPORT_DEVICE_IDENTIFIER: number

export declare const kSCSIServiceAction_REPORT_ALIASES: number

export declare const kSCSIServiceAction_XPWRITE_32: number

export declare const kSCSIServiceAction_WRITE_SAME_32: number

export declare const kSCSIServiceAction_WRITE_AND_VERIFY_32: number

export declare const kSCSIServiceAction_WRITE_32: number

export declare const kSCSIServiceAction_VERIFY_32: number

export declare const kSCSIServiceAction_READ_32: number

export declare const kSCSICmdVariableLengthCDB: number

export declare const kSCSICmd_XDWRITEREAD_10: number

export declare const kSCSICmd_XDWRITE_EXTENDED: number

export declare const kSCSICmd_XDREAD: number

export declare const kSCSICmd_WRITE_SAME: number

export declare const kSCSICmd_WRITE_LONG: number

export declare const kUSBRel11: number

export declare const kSCSICmd_WRITE_AND_VERIFY_16: number

export declare const kSCSICmd_WRITE_AND_VERIFY_12: number

export declare const kSCSICmd_WRITE_12: number

export declare const kSCSICmd_WRITE_10: number

export declare const kSCSICmd_WRITE_6: number

export declare const kSCSICmd_VOLUME_SET_OUT: number

export declare const kSCSICmd_VOLUME_SET_IN: number

export declare const kSCSICmd_VERIFY_12: number

export declare const kSCSICmd_UNMAP: number

export declare const kSCSICmd_UPDATE_BLOCK: number

export declare const kSCSICmd_TEST_UNIT_READY: number

export declare const kUSBMassStorageRBCSubClass: number

export declare const kSCSICmd_SYNCHRONIZE_CACHE_16: number

export declare const kSCSICmd_SYNCHRONIZE_CACHE: number

export declare const kSCSICmd_START_STOP_UNIT: number

export declare const kSCSICmd_SPARE_OUT: number

export declare const kUSBStreamIDMask: number

export declare const kSCSICmd_SPARE_IN: number

export declare const kSCSICmd_SET_STREAMING: number

export declare const kSCSICmd_SET_LIMITS_12: number

export declare const kSCSICmd_SET_DEVICE_IDENTIFIER: number

export declare const kSCSICmd_SET_CD_SPEED: number

export declare const kSCSICmd_SERVICE_ACTION_OUT: number

export declare const kSCSICmd_SEND_OPC_INFORMATION: number

export declare const kSCSICmd_SEND_EVENT: number

export declare const kSCSICmd_SEND_DIAGNOSTICS: number

export declare const kSCSICmd_SEEK_10: number

export declare const kSCSICmd_SEEK_6: number

export declare const kSCSICmd_SEARCH_DATA_HIGH_12: number

export declare const kSCSICmd_SCAN_MMC: number

export declare const kSCSICmd_REZERO_UNIT: number

export declare const kSCSICmd_RESERVE_TRACK: number

export declare const kSCSICmd_RESERVE_10: number

export declare const kSCSICmd_RESERVE_6: number

export declare const kSCSICmd_REPORT_KEY: number

export declare const kSCSICmd_REPORT_DEVICE_IDENTIFIER: number

export declare const kSCSICmd_REPAIR_TRACK: number

export declare const kSCSICmd_RELEASE_10: number

export declare const kSCSICmd_REGENERATE: number

export declare const kSCSICmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kSCSICmd_RECEIVE: number

export declare const kSCSICmd_REASSIGN_BLOCKS: number

export declare const kSCSICmd_READ_UPDATED_BLOCK_10: number

export declare const kSCSICmd_READ_TRACK_INFORMATION: number

export declare const kSCSICmd_READ_TOC_PMA_ATIP: number

export declare const kSCSICmd_READ_SUB_CHANNEL: number

export declare const kSCSICmd_READ_MASTER_CUE: number

export declare const kSCSICmd_READ_HEADER: number

export declare const kSCSICmd_READ_GENERATION: number

export declare const kSCSICmd_READ_FORMAT_CAPACITIES: number

export declare const kSCSICmd_READ_DISC_STRUCTURE: number

export declare const kSCSICmd_READ_DVD_STRUCTURE: number

export declare const kSCSICmd_READ_DISC_INFORMATION: number

export declare const kSCSICmd_READ_CD: number

export declare const kSCSICmd_READ_BUFFER: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilityMinTxLaneCountPhase: number

export declare const kSCSICmd_READ_ATTRIBUTE: number

export declare const kSCSICmd_READ_10: number

export declare const kSCSICmd_READ_6: number

export declare const kSCSICmd_PLAY_RELATIVE_12: number

export declare const kSCSICmd_PLAY_AUDIO_TRACK_INDEX: number

export declare const kSCSICmd_PLAY_AUDIO_MSF: number

export declare const kSCSICmd_PLAY_AUDIO_12: number

export declare const kSCSICmd_ATA_PASS_THROUGH_EXT: number

export declare const kSCSICmd_ATA_PASS_THROUGH: number

export declare const kSCSICmd_MODE_SENSE_10: number

export declare const kSCSICmd_MEDIUM_SCAN: number

export declare const kSCSICmd_MECHANISM_STATUS: number

export declare const kSCSICmd_MAINTENANCE_OUT: number

export declare const kSCSICmd_LOCK_UNLOCK_CACHE_16: number

export declare const kSCSICmd_GET_CONFIGURATION: number

export declare const kSCSICmd_FORMAT_UNIT: number

export declare const kSCSICmd_EXTENDED_COPY: number

export declare const kSCSICmd_COPY_AND_VERIFY: number

export declare const kSCSICmd_COPY: number

export declare const kSCSICmd_CHANGE_DEFINITION: number

export declare const kSCSICmd_ACCESS_CONTROL_IN: number

export declare const kSBCModePageCaching_FSW_Mask: number

export declare const kSBCModePageCaching_LBCSS_Mask: number

export declare const kSBCModePageCaching_VS2_Mask: number

export declare const kSBCModePageCaching_LBCSS_Bit: number

export declare const kSBCModePageCaching_DRA_Bit: number

export declare const kSBCModePageCaching_VS2_Bit: number

export declare const kSBCModePageCaching_VS1_Bit: number

export declare const kSBCModePageCaching_DEMAND_WRITE_Mask: number

export declare const kSBCModePageCaching_ABPF_Mask: number

export declare const kSBCModePageCaching_CAP_Mask: number

export declare const kSBCModePageCaching_DISC_Mask: number

export declare const kSBCModePageCaching_SIZE_Mask: number

export declare const kSBCModePageCaching_WCE_Mask: number

export declare const kSBCModePageCaching_RCD_Mask: number

export declare const kSBCModePageCaching_IC_Bit: number

export declare const kSBCModePageCaching_WCE_Bit: number

export declare const kSBCModePageCaching_RCD_Bit: number

export declare const kSBCModePageFlexibleDisk_PIN_4_Mask: number

export declare const kSBCModePageFlexibleDisk_PIN_1_Mask: number

export declare const kSBCModePageFlexibleDisk_PIN_34_Mask: number

export declare const kSBCModePageFlexibleDisk_PIN_2_Mask: number

export declare const kSBCModePageFlexibleDisk_TRDY_Mask: number

export declare const kSBCModePageFlexibleDisk_SSN_Bit: number

export declare const kSBCModePageCachingCode: number

export declare const kSBCModePageRigidDiskGeometryCode: number

export declare const kSPCModePageAllPagesCode: number

export declare const kModePageFormat_PS_Mask: number

export declare const kModePageFormat_PAGE_CODE_Mask: number

export declare const kModePageFormat_PS_Bit: number

export declare const kModeSenseSBCDeviceSpecific_WriteProtectMask: number

export declare const kModeSenseSBCDeviceSpecific_DPOFUAMask: number

export declare const kModeSenseSBCDeviceSpecific_WriteProtectBit: number

export declare const kModeSenseSBCDeviceSpecific_DPOFUABit: number

export declare const kINQUIRY_PageC0_Features_HasSEP_LUN: number

export declare const kSCSIProtocolIdentifier_SAS: number

export declare const kSCSIProtocolIdentifier_iSCSI: number

export declare const kSCSIProtocolIdentifier_RDMA: number

export declare const kSCSIProtocolIdentifier_ParallelSCSI: number

export declare const kSCSIProtocolIdentifier_FibreChannel: number

export declare const kUSB_EPDesc_bmAttributes_UsageType_Shift: number

export declare const kINQUIRY_Page83_IdentifierTypeSCSINameString: number

export declare const kINQUIRY_Page83_IdentifierTypeMD5LogicalUnitIdentifier: number

export declare const kINQUIRY_Page83_IdentifierTypeTargetPortGroup: number

export declare const kINQUIRY_Page83_IdentifierTypeNAAIdentifier: number

export declare const kINQUIRY_Page83_IdentifierTypeVendorSpecific: number

export declare const kINQUIRY_Page83_AssociationDevice: number

export declare const kUSBRqSetConfig: number

export declare const kINQUIRY_Page83_AssociationLogicalUnit: number

export declare const kINQUIRY_Page83_CodeSetMask: number

export declare const kINQUIRY_Page83_CodeSetBinaryData: number

export declare const kINQUIRY_PageC1_PageCode: number

export declare const kINQUIRY_PageB2_PageCode: number

export declare const kINQUIRY_PageB0_PageCode: number

export declare const kINQUIRY_Page89_PageCode: number

export declare const kINQUIRY_VERSION_DESCRIPTOR_NVME: number

export declare const kINQUIRY_Byte56_CLOCKING_Mask: number

export declare const kSBCModePageCaching_CAP_Bit: number

export declare const kINQUIRY_Byte56_QAS_Mask: number

export declare const kINQUIRY_Byte56_IUS_Mask: number

export declare const kINQUIRY_Byte56_QAS_Bit: number

export declare const kINQUIRY_Byte56_Offset: number

export declare const kINQUIRY_Byte7_RELADR_Mask: number

export declare const kINQUIRY_Byte7_TRANDIS_Mask: number

export declare const kINQUIRY_Byte7_LINKED_Bit: number

export declare const kINQUIRY_Byte7_TRANDIS_Bit: number

export declare const kINQUIRY_Byte6_ADDR16_Mask: number

export declare const kINQUIRY_Byte6_BQUE_Bit: number

export declare const kINQUIRY_Byte6_ADDR16_Bit: number

export declare const kINQUIRY_Byte5_PROTECT_Mask: number

export declare const kINQUIRY_Byte5_3PC_Mask: number

export declare const kINQUIRY_Byte5_ImplicitTPGS_Mask: number

export declare const kINQUIRY_Byte5_ExplicitTPGS_Mask: number

export declare const kINQUIRY_Byte5_SCCS_Mask: number

export declare const kINQUIRY_Byte5_PROTECT_Bit: number

export declare const kINQUIRY_Byte5_3PC_Bit: number

export declare const kINQUIRY_Byte5_ImplicitTPGS_Bit: number

export declare const kINQUIRY_Byte5_ExplicitTPGS_Bit: number

export declare const kINQUIRY_Byte3_AERC_Mask: number

export declare const kUSBCommDirectLineSubClass: number

export declare const kINQUIRY_Byte3_NORMACA_Bit: number

export declare const kINQUIRY_Byte3_HISUP_Bit: number

export declare const kINQUIRY_ANSI_VERSION_SCSI_SPC_3_Compliant: number

export declare const kINQUIRY_ANSI_VERSION_SCSI_SPC_2_Compliant: number

export declare const kINQUIRY_ANSI_VERSION_SCSI_SPC_Compliant: number

export declare const kINQUIRY_ANSI_VERSION_SCSI_1_Compliant: number

export declare const kINQUIRY_ISO_IEC_VERSION_Mask: number

export declare const kINQUIRY_PERIPHERAL_RMB_MediumRemovable: number

export declare const kINQUIRY_PERIPHERAL_TYPE_AutomationDriveInterface: number

export declare const kINQUIRY_PERIPHERAL_TYPE_CommunicationsSSCDevice: number

export declare const kINQUIRY_PERIPHERAL_TYPE_OpticalMemorySBCDevice: number

export declare const kINQUIRY_PERIPHERAL_TYPE_ScannerSCSI2Device: number

export declare const kINQUIRY_PERIPHERAL_TYPE_WriteOnceSBCDevice: number

export declare const kINQUIRY_PERIPHERAL_TYPE_PrinterSSCDevice: number

export declare const kINQUIRY_PERIPHERAL_QUALIFIER_SupportedButNotConnected: number

export declare const kINQUIRY_PRODUCT_REVISION_LEVEL_Length: number

export declare const kINQUIRY_PRODUCT_IDENTIFICATION_Length: number

export declare const kINQUIRY_VENDOR_IDENTIFICATION_Length: number

export declare const kINQUIRY_StandardDataHeaderSize: number

export declare const kSENSE_KEY_Mask: number

export declare const kSENSE_KEY_MISCOMPARE: number

export declare const kSENSE_KEY_VOLUME_OVERFLOW: number

export declare const kSENSE_KEY_ABORTED_COMMAND: number

export declare const kUSBPhysicalDesc: number

export declare const kSENSE_KEY_COPY_ABORTED: number

export declare const kSENSE_KEY_UNIT_ATTENTION: number

export declare const kSENSE_KEY_MEDIUM_ERROR: number

export declare const kSENSE_KEY_NOT_READY: number

export declare const kSENSE_ILI_Not_Set: number

export declare const kSENSE_ILI_Set: number

export declare const kSENSE_EOM_Set: number

export declare const kSENSE_FILEMARK_Set: number

export declare const kSENSE_RESPONSE_CODE_Deferred_Errors: number

export declare const kSENSE_NOT_DATA_VALID: number

export declare const kSenseDefaultSize: number

export declare const kDiscStatusErasableMask: number

export declare const kDiscStatusComplete: number

export declare const kBDFeaturesWriteBit: number

export declare const kDVDFeaturesHDRAMMask: number

export declare const kDVDFeaturesHDRMask: number

export declare const kDVDFeaturesPlusRMask: number

export declare const kDVDFeaturesBUFWriteMask: number

export declare const kDVDFeaturesTestWriteMask: number

export declare const kDVDFeaturesReadStructuresMask: number

export declare const kDVDFeaturesHDReadBit: number

export declare const kDVDFeaturesPlusRWBit: number

export declare const kDVDFeaturesTestWriteBit: number

export declare const kDVDFeaturesReadStructuresBit: number

export declare const kCDFeaturesSAOWriteMask: number

export declare const kCDFeaturesPacketWriteMask: number

export declare const kCDFeaturesWriteOnceMask: number

export declare const kCDFeaturesReadStructuresMask: number

export declare const kCDFeaturesAnalogAudioMask: number

export declare const kCDFeaturesBUFWriteBit: number

export declare const kCDFeaturesRawWriteBit: number

export declare const kCDFeaturesSAOWriteBit: number

export declare const kCDFeaturesCDDAStreamAccurateBit: number

export declare const kCDFeaturesReWriteableBit: number

export declare const kCDFeaturesWriteOnceBit: number

export declare const kMessageFoundMedia: number

export declare const kMessageDeterminingMediaPresence: number

export declare const kMessageTrayStateChangeRequestRejected: number

export declare const kIOSystemLoadAdvisoryLevelOK: number

export declare const kIOSystemLoadAdvisoryLevelBad: number

export declare const kIOPMAssertionLevelOff: number

export declare const kIOPMSystemCapabilityAudio: number

export declare const kSSCSeqCmd_REQUEST_SENSE: number

export declare const kIOPMSystemCapabilityGraphics: number

export declare const kIOPMSystemCapabilityWillChange: number

export declare const kIOPMClamshellStateOnWake: number

export declare const kIOPMForceLowSpeed: number

export declare const kIOPMRawLowBattery: number

export declare const kIOPMACnoChargeCapability: number

export declare const kIOPMBatteryDepleted: number

export declare const kIOPMUPSInstalled: number

export declare const kIOPMBatteryCharging: number

export declare const kIOPMACInstalled: number

export declare const kIOBatteryChargerConnect: number

export declare const kIOBatteryCharge: number

export declare const kIOBatteryInstalled: number

export declare const kIOPMInternalPower: number

export declare const kPMEthernetWakeOnLANSettings: number

export declare const kPMMinutesToDim: number

export declare const kIOPMThermalLevelTrap: number

export declare const kSCSIDataTransfer_NoDataTransfer: number

export declare const kIOPMThermalLevelCritical: number

export declare const kIOPMThermalLevelNormal: number

export declare const kIOPSAdapterErrorFlagDeviceNeedsToBeRepositioned: number

export declare const kIOPSAdapterErrorFlagForeignObjectDetected: number

export declare const kIOPSAdapterErrorFlagInsufficientAvailablePower: number

export declare const kIOPSAdapterErrorFlagNoErrors: number

export declare const kIOPSFamilyCodeExternal6: number

export declare const kIOPSFamilyCodeExternal5: number

export declare const kIOPSFamilyCodeExternal3: number

export declare const kIOPSFamilyCodeExternal2: number

export declare const kIOPSFamilyCodeExternal: number

export declare const kIOPSFamilyCodeAC: number

export declare const kIOPSFamilyCodeUSBCBrick: number

export declare const kIOPSFamilyCodeUSBAdapter: number

export declare const kIOPSFamilyCodeFirewire: number

export declare const kIOPSFamilyCodeUnsupported: number

export declare const kIOPSFamilyCodeDisconnected: number

export declare const kIOPMPoorValue: number

export declare const kIOPMPSLocationRight: number

export declare const IOPMNotYetInitialized: number

export declare const IOPMCannotRaisePower: number

export declare const IOPMNoSuchState: number

export declare const IOPMNoErr: number

export declare const kIOPMNotYetInitialized: number

export declare const kIOPMParameterError: number

export declare const kIOPMNoSuchState: number

export declare const kIOPMBadSpecification: number

export declare const kIOPMPowerButtonUp: number

export declare const kIOPMDWOverTemp: number

export declare const kIOPMOverTemp: number

export declare const kIOPMEnableClamshell: number

export declare const kIOPMPowerEmergency: number

export declare const kIOPMClamshellClosed: number

export declare const kIOPMSleepNow: number

export declare const kInflowForciblyEnabledBit: number

export declare const kClamshellSleepBit: number

export declare const kClamshellStateBit: number

export declare const kIOPMDriverAssertionForceFullWakeupBit: number

export declare const kIOPMDriverAssertionNetworkKeepAliveActiveBit: number

export declare const kIOPMDriverAssertionReservedBit7: number

export declare const kIOPMDriverAssertionReservedBit5: number

export declare const kIOPMDriverAssertionExternalMediaMountedBit: number

export declare const kIOPMDriverAssertionPreventSystemIdleSleepBit: number

export declare const kIOPMDriverAssertionCPUBit: number

export declare const kIOPMUnknown: number

export declare const IOPMLowestState: number

export declare const IOPMSoftSleep: number

export declare const IOPMNotPowerManaged: number

export declare const IOPMClockRunning: number

export declare const kIOPMCapabilitiesMask: number

export declare const kIOPMStaticPowerValid: number

export declare const kIOPMConfigRetained: number

export declare const kIOPMNotAttainable: number

export declare const kIOPMMaxPerformance: number

export declare const kIOPMChildClamp2: number

export declare const kIOPMChildClamp: number

export declare const kIOPMPreventSystemSleep: number

export declare const kIOPMClockRunning: number

export declare const kIOPMRestart: number

export declare const kIOPMRestartCapability: number

export declare const kIOPMDeviceUsable: number

export declare const IOPMMaxPowerStates: number

export declare const kIOPMMaxPowerStates: number

export declare const kIONetworkLinkValid: number

export declare const kIOMediumOptionLoopback: number

export declare const kIOMediumOptionFlag0: number

export declare const kIOMediumOptionFlowControl: number

export declare const kIOMediumIEEE80211DS2: number

export declare const kIOMediumIEEE80211FH2: number

export declare const kIOMediumEthernet5000BaseT: number

export declare const kIOMediumEthernet10GBaseT: number

export declare const kIOMediumEthernet10GBaseCX4: number

export declare const kIOMediumEthernetHomePNA1: number

export declare const kIOMediumEthernet1000BaseT: number

export declare const kIOMediumEthernet1000BaseTX: number

export declare const kIOMediumEthernet1000BaseLX: number

export declare const kIOMediumEthernet10BaseFL: number

export declare const kIOMediumEthernet10BaseSTP: number

export declare const kIOMediumEthernet100BaseT2: number

export declare const kIOMediumEthernet10BaseT: number

export declare const kIOMediumEthernetNone: number

export declare const kIOMediumEthernetManual: number

export declare const kIOMediumEthernetAuto: number

export declare const kIONetworkInterfaceDisabledState: number

export declare const kIONetworkInterfaceRegisteredState: number

export declare const kIONetworkStackRegisterInterfaceWithLowestUnit: number

export declare const kIONetworkStackRegisterInterfaceWithUnit: number

export declare const kIONetworkDataBufferTypeExternal: number

export declare const kDCLLabelOp: number

export declare const kIONetworkDataBufferTypeInternal: number

export declare const kIONetworkDataAccessTypeReset: number

export declare const kIONetworkDataAccessTypeWrite: number

export declare const kIONetworkFeatureLRO: number

export declare const kIONetworkFeatureSWTimeStamp: number

export declare const kIONetworkFeatureTransmitCompletionStatus: number

export declare const kIONetworkFeatureTSOIPv4: number

export declare const kIONetworkFeatureNoBSDWait: number

export declare const kIOPacketFilterPromiscuousAll: number

export declare const kDVIPowerSwitchActiveMask: number

export declare const kDVIPowerSwitchSupportMask: number

export declare const kMirrorUnclippedMirrorMask: number

export declare const kMirrorAreMirroredMask: number

export declare const kMirrorCanMirrorMask: number

export declare const kMirrorCommonGammaMask: number

export declare const kMirrorSameTimingOnlyMirrorMask: number

export declare const kSetClutAtVBL: number

export declare const kSetClutAtSetEntries: number

export declare const kScaleRotate180Mask: number

export declare const kScaleRotateFlagsMask: number

export declare const kScaleCanRotateMask: number

export declare const kScaleCanScaleInterlacedMask: number

export declare const kScaleCanUpSamplePixelsMask: number

export declare const kRangeSupportsSyncOnGreenBit: number

export declare const kAnalogSignalLevel_0714_0286: number

export declare const kInterlacedCEA861SyncModeBit: number

export declare const kAnalogSetupExpectedBit: number

export declare const kDigitalSignalBit: number

export declare const kRangeSupportsSignal_0700_0000_Mask: number

export declare const kRangeSupportsSignal_0714_0286_Mask: number

export declare const kVideoBufferSizeErr: number

export declare const kVideoI2CTransactionTypeErr: number

export declare const kVideoI2CTransactionErr: number

export declare const kVideoI2CReplyPendingErr: number

export declare const kTimingChangeRestrictedErr: number

export declare const kDMSModeFree: number

export declare const kSyncDigitalHSyncPositiveMask: number

export declare const kSyncDigitalVSyncPositiveMask: number

export declare const kSyncDigitalSeperateMask: number

export declare const kSyncDigitalCompositeSerrateMask: number

export declare const kSPCCmd_TEST_UNIT_READY: number

export declare const kSyncDigitalCompositeMask: number

export declare const kSyncAnalogBipolarSRGBSyncMask: number

export declare const kSyncAnalogBipolarSerrateMask: number

export declare const kSyncAnalogBipolarMask: number

export declare const kSyncAnalogCompositeRGBSyncMask: number

export declare const kSyncAnalogCompositeSerrateMask: number

export declare const kSyncAnalogCompositeMask: number

export declare const kVideoUsageAddrSubAddrBit: number

export declare const kVideoReplyMicroSecDelayBit: number

export declare const kVideoDisplayPortNativeTypeMask: number

export declare const kVideoNoTransactionType: number

export declare const kVideoBusTypeInvalid: number

export declare const kActivateConnection: number

export declare const kGetConnectionCount: number

export declare const kGammaTableIDSpecific: number

export declare const kGammaTableIDNoMoreTables: number

export declare const kGammaTableIDFindFirst: number

export declare const kDisplayModeIDBootProgrammable: number

export declare const kDisplayModeIDFindFirstProgrammable: number

export declare const kDisplayModeIDFindFirstResolution: number

export declare const kDisplayModeIDInvalid: number

export declare const kDisplayModeIDCurrent: number

export declare const kSixthDepthMode: number

export declare const kFirstDepthMode: number

export declare const kDepthMode4: number

export declare const kDepthMode3: number

export declare const kDepthMode2: number

export declare const kDepthMode1: number

export declare const kESCSevenDDC: number

export declare const kESCSevenPALAlternate: number

export declare const kESCSeven16Inch: number

export declare const kESCSevenVGA: number

export declare const kESCSevenNTSC: number

export declare const kESCSevenPAL: number

export declare const kESCSixStandard: number

export declare const kESCFivePortrait: number

export declare const kESCFourNTSC: number

export declare const kESCThree21InchMono: number

export declare const kESCTwo12Inch: number

export declare const kESCZero21Inch: number

export declare const kRSCSeven: number

export declare const kRSCSix: number

export declare const kRSCFive: number

export declare const kRSCFour: number

export declare const kRSCThree: number

export declare const kLiveVideoPassThruMask: number

export declare const kLiveVideoPassThru: number

export declare const kConvolved: number

export declare const kDPMSSyncSuspend: number

export declare const kDPMSSyncStandby: number

export declare const kSyncOnRedMask: number

export declare const kVerticalSyncMask: number

export declare const kTriStateSyncBit: number

export declare const kNoSeparateSyncControlBit: number

export declare const kEnableSyncOnRed: number

export declare const kEnableSyncOnGreen: number

export declare const kEnableSyncOnBlue: number

export declare const kDisableCompositeSyncBit: number

export declare const kDisableHorizontalSyncBit: number

export declare const cscGetFeatureList: number

export declare const cscGetMirror: number

export declare const cscGetScalerInfo: number

export declare const cscGetCommunicationInfo: number

export declare const cscGetDetailedTiming: number

export declare const cscGetTimingRanges: number

export declare const cscGetClutBehavior: number

export declare const cscGetPowerState: number

export declare const cscGetConvolution: number

export declare const cscGetHardwareCursorDrawState: number

export declare const cscSupportsHardwareCursor: number

export declare const cscRetrieveGammaTable: number

export declare const cscGetGammaInfoList: number

export declare const cscGetNextResolution: number

export declare const cscGetConnection: number

export declare const cscGetDefaultMode: number

export declare const cscGetBaseAddr: number

export declare const kUSBNotEnoughPowerNoACNotificationType: number

export declare const cscGetMode: number

export declare const cscUnusedCall: number

export declare const cscSetFeatureConfiguration: number

export declare const cscSetClutBehavior: number

export declare const cscSetMultiConnect: number

export declare const cscPrivateControlCall: number

export declare const cscSetConvolution: number

export declare const cscSetGray: number

export declare const cscGrayScreen: number

export declare const cscSetGamma: number

export declare const cscSetEntries: number

export declare const cscSetMode: number

export declare const kSPCProcCmd_REPORT_LUNS: number

export declare const kPowerStateSupportsReducedPower3BitMask: number

export declare const kPowerStateSupportsReducedPower1BitMask: number

export declare const kSBCWOCmd_VERIFY_10: number

export declare const kPowerStateSupportsReducedPower1Bit: number

export declare const kPowerStateSleepWaketoDozeMask: number

export declare const kPowerStateSleepNoDPMSMask: number

export declare const kPowerStateSleepForbiddenMask: number

export declare const kPowerStateNeedsRefreshMask: number

export declare const kDVDMediaTypeUnknown: number

export declare const kPowerStateSleepWaketoDozeBit: number

export declare const kPowerStateSleepForbiddenBit: number

export declare const kSBCWOCmd_READ_BUFFER: number

export declare const kPowerStateSleepAwareBit: number

export declare const kPowerStateReducedPower2: number

export declare const kPowerStateReducedPowerMask: number

export declare const kHardwarePark: number

export declare const kHardwareWakeFromSuspend: number

export declare const kHardwareWake: number

export declare const kHardwareSleep: number

export declare const kAVPowerStandby: number

export declare const kAVPowerOff: number

export declare const kResolutionHasMultipleDepthSizes: number

export declare const kDepthDependentMask: number

export declare const kDepthDependent: number

export declare const kModeValidateAgainstDisplay: number

export declare const kModeBuiltIn: number

export declare const kModeNotPreset: number

export declare const kModeSimulscan: number

export declare const kModeShowNever: number

export declare const kModeDefault: number

export declare const kModeSafe: number

export declare const kNoConnect: number

export declare const cscReset: number

export declare const kGenericCRT: number

export declare const kColor19Connect: number

export declare const kColor16Connect: number

export declare const kMonoTwoPageConnect: number

export declare const kPanelFSTNConnect: number

export declare const kPALConnect: number

export declare const kVGAConnect: number

export declare const kMultiModeCRT1Connect: number

export declare const kINQUIRY_Byte56_CLOCKING_ST_AND_DT: number

export declare const kFixedModeCRTConnect: number

export declare const kPanelTFTConnect: number

export declare const kPanelConnect: number

export declare const kOverrideConnection: number

export declare const kConnectionInactive: number

export declare const kHasDDCConnection: number

export declare const kReportsDDCConnection: number

export declare const kTaggingInfoNonStandard: number

export declare const kHasDirectConnection: number

export declare const kAllModesSafe: number

export declare const kAllModesValid: number

export declare const timingSony_1900x1200_74hz: number

export declare const timingApple21: number

export declare const timingApple16: number

export declare const timingApple15x: number

export declare const timingApple15: number

export declare const timingApple12x: number

export declare const timingApple12: number

export declare const timingSony_1920x1200_76hz: number

export declare const timingSony_1920x1080_60hz: number

export declare const timingSony_1600x1024_76hz: number

export declare const timingFilmRate_48hz: number

export declare const timingVESA_1856x1392_75hz: number

export declare const timingVESA_1856x1392_60hz: number

export declare const timingVESA_1792x1344_75hz: number

export declare const timingVESA_1792x1344_60hz: number

export declare const kDCLInvalidOp: number

export declare const timingVESA_1600x1200_80hz: number

export declare const timingVESA_1600x1200_70hz: number

export declare const timingVESA_1280x1024_85hz: number

export declare const timingAppleNTSC_FFconv: number

export declare const timingAppleNTSC_STconv: number

export declare const timingAppleNTSC_FF: number

export declare const timingApple_1152x870_75hz: number

export declare const timingVESA_1024x768_85hz: number

export declare const timingVESA_1024x768_75hz: number

export declare const timingVESA_1024x768_70hz: number

export declare const timingVESA_1024x768_60hz: number

export declare const timingVESA_800x600_85hz: number

export declare const timingVESA_800x600_75hz: number

export declare const timingVESA_800x600_72hz: number

export declare const timingApple_832x624_75hz: number

export declare const timingGTF_640x480_120hz: number

export declare const timingVESA_640x480_85hz: number

export declare const timingVESA_640x480_72hz: number

export declare const timingApple_640x400_67hz: number

export declare const timingApple_FixedRateLCD: number

export declare const timingInvalid: number

export declare const kDDCForceReadBit: number

export declare const kDDCBlockTypeEDID: number

export declare const kDetailedTimingFormat: number

export declare const sixthVidMode: number

export declare const fifthVidMode: number

export declare const secondVidMode: number

export declare const kSBCCmd_READ_ELEMENT_STATUS_ATTACHED: number

export declare const firstVidMode: number

export declare const sixteenBitMode: number

export declare const eightBitMode: number

export declare const fourBitMode: number

export declare const mVidParams: number

export declare const mVertRefRate: number

export declare const mPixelSize: number

export declare const mPixelType: number

export declare const mHRes: number

export declare const mBounds: number

export declare const kIOI2CBusNumberMask: number

export declare const kIOI2CUseSubAddressCommFlag: number

export declare const kIOI2CDisplayPortNativeTransactionType: number

export declare const kIOI2CNoTransactionType: number

export declare const kIOHIDOpenedByFastPathClient: number

export declare const kIOHIDEventQueueTypeUser: number

export declare const kIOHIDGlobalMemory: number

export declare const kIOHIDEventSystemConnectType: number

export declare const kIOHIDParamConnectType: number

export declare const kHIDUsage_FIDO_InputData: number

export declare const kHIDUsage_FIDO_Undefined: number

export declare const kHIDUsage_CC_Autofocus: number

export declare const kHIDUsage_CC_Undefined: number

export declare const kHIDUsage_MSR_Track3Data: number

export declare const kConfigLeafDirCRC: number

export declare const kHIDUsage_MSR_Track1Data: number

export declare const kHIDUsage_MSR_TrackData: number

export declare const kATAIdentifyDriveCapabilitiesExtended: number

export declare const kHIDUsage_MSR_Track1Length: number

export declare const kHIDUsage_MSR_DeviceReadOnly: number

export declare const kHIDUsage_MSR_Undefined: number

export declare const kHIDUsage_WD_EnforcedZeroReturn: number

export declare const kHIDUsage_WD_ZeroScale: number

export declare const kHIDUsage_WD_ScaleStatusOverWeightLimit: number

export declare const kIOPMPowerOn: number

export declare const kHIDUsage_WD_ScaleStatusUnderZero: number

export declare const kHIDUsage_WD_ScaleStatusWeightStable: number

export declare const kHIDUsage_WD_ScaleStatusStableAtZero: number

export declare const kHIDUsage_WD_ScaleStatusFault: number

export declare const kHIDUsage_WD_RezeroCount: number

export declare const kHIDUsage_WD_WeightUnitOunce: number

export declare const kHIDUsage_WD_WeightUnitAvoirTon: number

export declare const kHIDUsage_WD_WeightUnitMetricTon: number

export declare const kHIDUsage_WD_WeightUnitTaels: number

export declare const kHIDUsage_WD_WeightUnitCarats: number

export declare const kHIDUsage_WD_WeightUnitKilogram: number

export declare const kHIDUsage_WD_WeightUnitGram: number

export declare const kHIDUsage_WD_WeightUnitMilligram: number

export declare const kHIDUsage_WD_ScaleWeightLimitReport: number

export declare const kHIDUsage_WD_ScaleDataReport: number

export declare const kHIDUsage_WD_ScaleAtrributeReport: number

export declare const kHIDUsage_WD_ScaleScaleClassIVEnglish: number

export declare const kHIDUsage_WD_ScaleScaleClassIVMetric: number

export declare const kHIDUsage_WD_ScaleScaleClassIIILMetric: number

export declare const kHIDUsage_WD_ScaleScaleClassIIMetric: number

export declare const kHIDUsage_WD_ScaleScaleClassIMetric: number

export declare const kHIDUsage_WD_WeighingDevice: number

export declare const kHIDUsage_BCS_VeriCode: number

export declare const kHIDUsage_BCS_SuperCode: number

export declare const kHIDUsage_BCS_PosiCode: number

export declare const kHIDUsage_BCS_MicroPDF: number

export declare const kHIDUsage_BCS_Code49: number

export declare const kHIDUsage_BCS_Code16: number

export declare const kHIDUsage_BCS_DLMethodCheckInRange: number

export declare const kHIDUsage_BCS_SecondDiscreteLengthToDecode: number

export declare const kHIDUsage_BCS_MaximumLengthToDecode: number

export declare const kHIDUsage_BCS_MinimumLengthToDecode: number

export declare const kHIDUsage_BCS_RawDataPolarity: number

export declare const kHIDUsage_BCS_SymbologyIdentifier3: number

export declare const kHIDUsage_BCS_SymbologyIdentifier1: number

export declare const kHIDUsage_BCS_CheckDigitCodabarEnable: number

export declare const kHIDUsage_BCS_CheckDigitEnableOneMSIPlessey: number

export declare const kHIDUsage_BCS_CheckDigitEnableStandard2of5OPCC: number

export declare const kHIDUsage_BCS_CheckDigitDisable: number

export declare const kHIDUsage_BCS_CheckDigit: number

export declare const kHIDUsage_BCS_UCC_EAN_128: number

export declare const kHIDUsage_BCS_TriOptic: number

export declare const kHIDUsage_BCS_ItalianPharmacyCode: number

export declare const kHIDUsage_BCS_Interleaved2of5: number

export declare const kHIDUsage_BCS_FullASCIIConversion: number

export declare const kHIDUsage_BCS_Code93: number

export declare const kHIDUsage_BCS_Codabar: number

export declare const kHIDUsage_BCS_ClearAllEAN2_3LabelDefinitions: number

export declare const kHIDUsage_BCS_EAN13FlagDigit3: number

export declare const kHIDUsage_BCS_EAN8FlagDigit2: number

export declare const kHIDUsage_BCS_EAN8FlagDigit1: number

export declare const kHIDUsage_BCS_EANThreeLabel: number

export declare const kHIDUsage_BCS_CheckEnableEuropean4DigitPrice: number

export declare const kHIDUsage_BCS_CheckEnable5DigitPrice: number

export declare const kHIDUsage_BCS_PeriodicalIgnorePlus5: number

export declare const kHIDUsage_BCS_PeriodicalIgnorePlus2: number

export declare const kHIDUsage_BCS_PeriodicalOnlyDecodeWithPlus2: number

export declare const kHIDUsage_BCS_PeriodicalAutoDiscriminatePlus2: number

export declare const kHIDUsage_BCS_Periodical: number

export declare const kHIDUsage_BCS_UPC_AWithP5Optional: number

export declare const kHIDUsage_BCS_UPC_AWith128Optical: number

export declare const kHIDUsage_BCS_UPC_AWith128Mandatory: number

export declare const kHIDUsage_BCS_UPC_EANPeriodicals: number

export declare const kHIDUsage_BCS_UPC_EANCouponCode: number

export declare const kHIDUsage_BCS_EAN_99_P5_128_Optional: number

export declare const kHIDUsage_BCS_ConvertUPC_EToA: number

export declare const kHIDUsage_BCS_GRWTIBeep_LampAfterTransmit: number

export declare const kHIDUsage_BCS_GRWTIAfterDecode: number

export declare const kHIDUsage_BCS_GoodReadWhenToWrite: number

export declare const kHIDUsage_BCS_SoundNotOnFileBeep: number

export declare const kHIDUsage_BCS_SoundErrorBeep: number

export declare const kHIDUsage_BCS_GoodReadToneVolume: number

export declare const kHIDUsage_BCS_GoodReadToneLength: number

export declare const kHIDUsage_BCS_GoodReadLED: number

export declare const kHIDUsage_BCS_GoodReadLampDuration: number

export declare const kHIDUsage_BCS_AimDuration: number

export declare const kHIDUsage_BCS_ScannerInRange: number

export declare const kHIDUsage_BCS_ScannerInCradle: number

export declare const kHIDUsage_BCS_TriggerModeLaserOnWhilePulled: number

export declare const kHIDUsage_BCS_TriggerModeContinuousLaserOn: number

export declare const kHIDUsage_BCS_TriggerModeBlinkingLaserOn: number

export declare const kHIDUsage_BCS_TriggerState: number

export declare const kHIDUsage_BCS_InitiateBarcodeRead: number

export declare const kHIDUsage_BCS_PowerOnResetScanner: number

export declare const kHIDUsage_BCS_MotorState: number

export declare const kHIDUsage_BCS_LaserState: number

export declare const kHIDUsage_BCS_BeeperState: number

export declare const kHIDUsage_BCS_BarCodePresent: number

export declare const kHIDUsage_BCS_AimingLaserPattern: number

export declare const kHIDUsage_BCS_ActiveTime: number

export declare const kHIDUsage_BCS_PrefixProprietary: number

export declare const kHIDUsage_BCS_PrefixNone: number

export declare const kHIDUsage_BCS_DataPrefix: number

export declare const kHIDUsage_BCS_ScannerReadConfidence: number

export declare const kHIDUsage_BCS_FragmentDecoding: number

export declare const kHIDUsage_BCS_ProximitySensor: number

export declare const kHIDUsage_BCS_MultiRangeScanner: number

export declare const kHIDUsage_BCS_WaterResistant: number

export declare const kHIDUsage_BCS_Triggerless: number

export declare const kBDFeaturesReadBit: number

export declare const kHIDUsage_BCS_ProgrammableBeeper: number

export declare const kHIDUsage_BCS_IntrinsicallySafe: number

export declare const kHIDUsage_BCS_FixedBeeper: number

export declare const kHIDUsage_BCS_ErrorIndication: number

export declare const kHIDUsage_BCS_Class2Laser: number

export declare const kHIDUsage_BCS_Class1ALaser: number

export declare const kHIDUsage_BCS_2DControlReport: number

export declare const kHIDUsage_BCS_Code128ControlReport: number

export declare const kHIDUsage_BCS_CodabarControlReport: number

export declare const kHIDUsage_BCS_Standard2of5ControlReport: number

export declare const kHIDUsage_BCS_Code39ControlReport: number

export declare const kHIDUsage_BCS_ScannedDataReport: number

export declare const kHIDUsage_BCS_AttributeReport: number

export declare const kHIDUsage_BCS_CordlessScannerBase: number

export declare const kPowerStateSleepCanPowerOffMask: number

export declare const kHIDUsage_BCS_DumbBarCodeScanner: number

export declare const kHIDUsage_BCS_BarCodeScanner: number

export declare const kHIDUsage_BCS_BadgeReader: number

export declare const kSBCCmd_WRITE_AND_VERIFY_12: number

export declare const kHIDUsage_BCS_Undefined: number

export declare const kHIDUsage_BS_ChargerSpec: number

export declare const kHIDUsage_BS_MasterMode: number

export declare const kHIDUsage_BS_VoltageNotRegulated: number

export declare const kHIDUsage_BS_CurrentNotRegulated: number

export declare const kHIDUsage_BS_CurrentOutOfRange: number

export declare const kHIDUsage_BS_VoltageOutOfRange: number

export declare const kHIDUsage_BS_ThermistorOverRange: number

export declare const kHIDUsage_BS_AlarmInhibited: number

export declare const kHIDUsage_BS_EnablePolling: number

export declare const kHIDUsage_BS_iOEMInformation: number

export declare const kHIDUsage_BS_CapacityGranularity2: number

export declare const kHIDUsage_BS_WarningCapacityLimit: number

export declare const kHIDUsage_BS_Rechargable: number

export declare const kHIDUsage_BS_iDevicename: number

export declare const kHIDUsage_BS_ManufacturerDate: number

export declare const kHIDUsage_BS_ManufacturerData: number

export declare const kHIDUsage_BS_SpecificationInfo: number

export declare const kHIDUsage_BS_PrimaryBatterySupport: number

export declare const kHIDUsage_BS_AverageTimeToFull: number

export declare const kHIDUsage_BS_RunTimeToEmpty: number

export declare const kHIDUsage_BS_FullChargeCapacity: number

export declare const kHIDUsage_BS_RemainingCapacity: number

export declare const kHIDUsage_BS_NeedReplacement: number

export declare const kHIDUsage_BS_ConditioningFlag: number

export declare const kHIDUsage_BS_Discharging: number

export declare const kHIDUsage_BS_Charging: number

export declare const kHIDUsage_BS_ChargeController: number

export declare const kHIDUsage_BS_PrimaryBattery: number

export declare const kHIDUsage_BS_CapacityMode: number

export declare const kHIDUsage_BS_AtRate: number

export declare const kHIDUsage_BS_RemainingCapacityLimit: number

export declare const kHIDUsage_BS_ManufacturerAccess: number

export declare const kHIDUsage_BS_BatterySupported: number

export declare const kHIDUsage_BS_OKToUse: number

export declare const kHIDUsage_BS_OutputConnection: number

export declare const kHIDUsage_BS_ConnectionToSMBus: number

export declare const kHIDUsage_BS_OptionalMfgFunction4: number

export declare const kHIDUsage_BS_OptionalMfgFunction3: number

export declare const kHIDUsage_BS_OptionalMfgFunction2: number

export declare const kHIDUsage_BS_OptionalMfgFunction1: number

export declare const kMMCCmd_SEARCH_DATA_LOW_12: number

export declare const kHIDUsage_BS_SMBSelectorInfo: number

export declare const kHIDUsage_BS_SMBSelectorPresets: number

export declare const kHIDUsage_BS_SMBSelectorState: number

export declare const kHIDUsage_BS_SMBChargerMode: number

export declare const kHIDUsage_BS_SMBAlarmWarning: number

export declare const kHIDUsage_BS_SMBBatteryMode: number

export declare const kHIDUsage_PD_iProduct: number

export declare const kHIDUsage_PD_Tested: number

export declare const kHIDUsage_PD_Buck: number

export declare const kHIDUsage_PD_Used: number

export declare const kHIDUsage_PD_Switchable: number

export declare const kHIDUsage_PD_ShutdownImminent: number

export declare const kHIDUsage_PD_ShutdownRequested: number

export declare const kConfigSBP2MAO: number

export declare const kHIDUsage_PD_OverCharged: number

export declare const kHIDUsage_PD_FrequencyOutOfRange: number

export declare const kHIDUsage_PD_InternalFailure: number

export declare const kHIDUsage_PD_Good: number

export declare const kHIDUsage_PD_Present: number

export declare const kHIDUsage_PD_ModuleReset: number

export declare const kHIDUsage_PD_Test: number

export declare const kHIDUsage_PD_DelayBeforeStartup: number

export declare const kHIDUsage_PD_ToggleControl: number

export declare const kHIDUsage_PD_SwitchOffControl: number

export declare const kHIDUsage_PD_SwitchOnControl: number

export declare const kHIDUsage_PD_ConfigHumidity: number

export declare const kHIDUsage_PD_ConfigPercentLoad: number

export declare const kATAPhysicalLogicalEnabledValue: number

export declare const kHIDUsage_PD_ConfigApparentPower: number

export declare const kHIDUsage_PD_ConfigFrequency: number

export declare const kHIDUsage_PD_ApparentPower: number

export declare const kHIDUsage_PD_Current: number

export declare const kHIDUsage_PD_GangID: number

export declare const kHIDUsage_PD_Gang: number

export declare const kHIDUsage_PD_OutletID: number

export declare const kHIDUsage_PD_FlowID: number

export declare const kHIDUsage_PD_OutputID: number

export declare const kHIDUsage_PD_OutletSystem: number

export declare const kHIDUsage_PD_BatteryID: number

export declare const kHIDUsage_PD_Battery: number

export declare const kHIDUsage_PD_BatterySystemID: number

export declare const kHIDUsage_PD_BatterySystem: number

export declare const kHIDUsage_PD_PeripheralDevice: number

export declare const kHIDUsage_PD_UPS: number

export declare const kMMCCmd_CLOSE_TRACK_SESSION: number

export declare const kHIDUsage_PD_PresentStatus: number

export declare const kHIDUsage_PD_Undefined: number

export declare const kHIDUsage_BD_BrailleRockerUp: number

export declare const kHIDUsage_BD_BrailleDPadRight: number

export declare const kHIDUsage_BD_BrailleDPadLeft: number

export declare const kHIDUsage_BD_BrailleDPadDown: number

export declare const kHIDUsage_BD_BrailleJoystickRight: number

export declare const kHIDUsage_BD_BrailleJoystickDown: number

export declare const kHIDUsage_BD_BrailleKeyboardLeftSpace: number

export declare const kHIDUsage_BD_BrailleKeyboardDot6: number

export declare const kHIDUsage_BD_BrailleKeyboardDot5: number

export declare const kHIDUsage_BD_BrailleKeyboardDot4: number

export declare const kHIDUsage_BD_BrailleKeyboardDot2: number

export declare const kHIDUsage_BD_BrailleKeyboardDot1: number

export declare const kHIDUsage_BD_RowRouterKey: number

export declare const kHIDUsage_BD_RouterSet2: number

export declare const kHIDUsage_BD_ScreenReaderControl: number

export declare const kHIDUsage_CC_Shutter: number

export declare const kHIDUsage_BD_NumberOfBrailleCells: number

export declare const kHIDUsage_BD_8DotBrailleCell: number

export declare const kHIDUsage_BD_BrailleDisplay: number

export declare const kHIDUsage_Snsr_Data_Custom_Value6: number

export declare const kHIDUsage_Snsr_Data_Custom_Value4: number

export declare const kHIDUsage_Snsr_Data_Custom_Value2: number

export declare const kHIDUsage_Snsr_Data_Custom_Value1: number

export declare const kHIDUsage_Snsr_Data_Custom_Value: number

export declare const kHIDUsage_Snsr_Data_Custom_Usage: number

export declare const kHIDUsage_Snsr_Property_Time_TimeTrimAdjustment: number

export declare const kHIDUsage_Snsr_Property_Time_TimeZoneOffsetFromUTC: number

export declare const kHIDUsage_Snsr_Property_Time: number

export declare const kHIDUsage_Snsr_Data_Time_JulianDayOfYear: number

export declare const kFWBIBIsc: number

export declare const kHIDUsage_Snsr_Data_Time_Timestamp: number

export declare const kHIDUsage_Snsr_Data_Time_Millisecond: number

export declare const kHIDUsage_Snsr_Data_Time_Minute: number

export declare const kIOPMSystemCapabilityCPU: number

export declare const kHIDUsage_Snsr_Data_Time_Hour: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeekSaturday: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeekFriday: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeekThursday: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeekWednesday: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeekMonday: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeekSunday: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeek: number

export declare const kHIDUsage_Snsr_Data_Time_Day: number

export declare const kHIDUsage_Snsr_Data_Electrical_PercentOfRange: number

export declare const kHIDUsage_Snsr_Data_Electrical_Period: number

export declare const kHIDUsage_Snsr_Data_Electrical_Inductance: number

export declare const kHIDUsage_Snsr_Data_Electrical: number

export declare const kSBCCmd_LOG_SELECT: number

export declare const kHIDUsage_Snsr_Property_Scanner_NFCSentenceSend: number

export declare const kHIDUsage_Snsr_Property_Scanner: number

export declare const kHIDUsage_Snsr_Data_Scanner_RFIDTag40Bit: number

export declare const kHIDUsage_Snsr_Property_Light_ConsumerIRSentenceSend: number

export declare const kCSRClockTickPeriodLoAddress: number

export declare const kHIDUsage_Snsr_Data_Light_Chromaticity: number

export declare const kHIDUsage_Snsr_Data_Light_ColorTemperature: number

export declare const kHIDUsage_Snsr_Data_Light_Illuminance: number

export declare const kHIDUsage_Snsr_Data_Biometric_HumanPresence: number

export declare const kHIDUsage_Snsr_Data_Mechanical_Weight: number

export declare const kHIDUsage_Snsr_Data_Mechanical_GaugePressure: number

export declare const kHIDUsage_Snsr_Data_Mechanical_BooleanSwitchState: number

export declare const kHIDUsage_Snsr_Data_Orientation_MagneticFluxZAxis: number

export declare const kHIDUsage_Snsr_Data_Orientation_MagneticFluxXAxis: number

export declare const kHIDUsage_Snsr_Data_Orientation_RotationMatrix: number

export declare const kHIDUsage_Snsr_Data_Orientation_TiltZAxis: number

export declare const kHIDUsage_Snsr_Data_Orientation_TiltYAxis: number

export declare const kHIDUsage_Snsr_Data_Orientation_TiltXAxis: number

export declare const kHIDUsage_Snsr_Data_Orientation_DistanceOutOfRange: number

export declare const kHIDUsage_Snsr_Data_Orientation_Distance: number

export declare const kHIDUsage_BCS_MSI_Plessey: number

export declare const kHIDUsage_Snsr_Data_Orientation_HeadingMagneticNorth: number

export declare const kHIDUsage_Snsr_Data_Orientation_HeadingCompensatedMagneticNorth: number

export declare const kHIDUsage_Snsr_Data_Orientation_HeadingZAxis: number

export declare const kHIDUsage_Snsr_Data_Orientation: number

export declare const kHIDUsage_Snsr_Data_Motion_Intensity: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularVelocityZAxis: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularVelocityYAxis: number

export declare const kHIDUsage_Snsr_Data_Motion_Acceleration: number

export declare const kHIDUsage_Snsr_Property_Environmental: number

export declare const kHIDUsage_Snsr_Data_Environmental_WindSpeed: number

export declare const kHIDUsage_Snsr_Data_Environmental_WindDirection: number

export declare const kMMCCmd_PLAY_AUDIO_10: number

export declare const kHIDUsage_Snsr_Data_Environmental_RelativeHumidity: number

export declare const kHIDUsage_Snsr_Property_Location_AccuracyLow: number

export declare const kHIDUsage_Snsr_Property_Location_AccuracyHigh: number

export declare const kHIDUsage_Snsr_Property_Location_AccuracyDefault: number

export declare const kHIDUsage_Snsr_Property_Location: number

export declare const kHIDUsage_Snsr_Data_Location_StateOrProvince: number

export declare const kHIDUsage_Snsr_Data_Location_NMEASentence: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesUsedPRNs: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesInViewSNRatios: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesInViewPRNs: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesInViewIDs: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesInViewAzimuth: number

export declare const kHIDUsage_Snsr_Data_Location_MagneticHeading: number

export declare const kHIDUsage_Snsr_Data_Location_Longitude: number

export declare const kHIDUsage_Snsr_Data_Location_PositionDilutionOfPrecision: number

export declare const kHIDUsage_Snsr_Data_Location_GPSStatusDataNotValid: number

export declare const kHIDUsage_Snsr_Data_Location_GPSStatusDataValid: number

export declare const kHIDUsage_Snsr_Data_Location_GPSStatus: number

export declare const kHIDUsage_Snsr_Data_Location_GPSSelectionModeDataNotValid: number

export declare const kHIDUsage_Snsr_Data_Location_GPSSelectionModeManualInput: number

export declare const kHIDUsage_Snsr_Data_Location_GPSSelectionModeEstimated: number

export declare const kHIDUsage_Snsr_Data_Location_GPSSelectionModeDGPS: number

export declare const kHIDUsage_Snsr_Data_Location_GPSSelectionMode: number

export declare const kHIDUsage_Snsr_Data_Location_GPSOperationModeAutomatic: number

export declare const kHIDUsage_Snsr_Data_Location_GPSOperationModeManual: number

export declare const kHIDUsage_Snsr_Data_Location_GPSOperationMode: number

export declare const kHIDUsage_Snsr_Data_Location_GeoidalSeparation: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeManualInputMode: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeEstimated: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeRealTimeKinematic: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeGPSPPSMode: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeDGPSSPSMode: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeGPSSPSMode: number

export declare const kHIDUsage_Snsr_Data_Location_FixType: number

export declare const kHIDUsage_Snsr_Data_Location_FixQualityDGPS: number

export declare const kHIDUsage_Snsr_Data_Location_FixQualityNoFix: number

export declare const kHIDUsage_Snsr_Data_Location_ErrorRadius: number

export declare const kHIDUsage_Snsr_Data_Location_AltitudeSeaLevelError: number

export declare const kHIDUsage_Snsr_Data_Location_AltitudeEllipsoidError: number

export declare const kHIDUsage_Snsr_Data_Location_Reserved: number

export declare const kHIDUsage_Snsr_Data_Location: number

export declare const kHIDUsage_Snsr_Light_Illuminance: number

export declare const kHIDUsage_Snsr_Property_PowerState_D4_PowerOff: number

export declare const kHIDUsage_Snsr_Property_PowerState_D1_LowPower: number

export declare const kHIDUsage_Snsr_Property_PowerState_D0_FullPower: number

export declare const kHIDUsage_Snsr_Property_ReportingState_WakeAllEvents: number

export declare const kHIDUsage_Snsr_Property_ReportingState_WakeNoEvents: number

export declare const kHIDUsage_Snsr_Property_ReportingState_ThresholdEvents: number

export declare const kHIDUsage_Snsr_Property_ReportLatency: number

export declare const kHIDUsage_Snsr_Property_SamplingRate: number

export declare const kHIDUsage_Snsr_Property_Maximum: number

export declare const kHIDUsage_Snsr_Property_ChangeSensitivityPercentRelative: number

export declare const kHIDUsage_Snsr_Property_ChangeSensitivityAbsolute: number

export declare const kHIDUsage_Snsr_Property_ReportInterval: number

export declare const kHIDUsage_Snsr_Property_FirmwareVersion: number

export declare const kHIDUsage_Snsr_Property_HardwareRevision: number

export declare const kHIDUsage_Snsr_Property_SensorStatus: number

export declare const kHIDUsage_Snsr_Property_FriendlyName: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_ComplexTrigger: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_ZeroThresholdCrossUp: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_LowThresholdCrossUp: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_HighThresholdCrossDown: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_HighThresholdCrossUp: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_RangeMaxReached: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_StateChanged: number

export declare const kVideoNoTransactionTypeMask: number

export declare const kHIDUsage_Snsr_Event_SensorState_Error: number

export declare const kHIDUsage_Snsr_Event_SensorState_AccessDenied: number

export declare const kHIDUsage_Snsr_Event_SensorState_Ready: number

export declare const kHIDUsage_Snsr_Event_SensorState_Undefined: number

export declare const kHIDUsage_Snsr_Event_SensorState: number

export declare const kHIDUsage_Snsr_Modifier_ChangeSensitivityPercentRelative: number

export declare const kHIDUsage_Snsr_Modifier_FrequencyMax: number

export declare const kHIDUsage_Snsr_Modifier_ReportInterval: number

export declare const kHIDUsage_Snsr_Modifier_CalibrationOffset: number

export declare const kHIDUsage_Snsr_Modifier_ThresholdLow: number

export declare const kHIDUsage_Snsr_Modifier_Accuracy: number

export declare const kHIDUsage_Snsr_Modifier_Min: number

export declare const kHIDUsage_Snsr_Modifier_Max: number

export declare const kHIDUsage_Snsr_Modifier_ChangeSensitivityAbsolute: number

export declare const kHIDUsage_Snsr_Other_HingeAngle: number

export declare const kHIDUsage_Snsr_Other_GenericEnumerator: number

export declare const kHIDUsage_Snsr_Other: number

export declare const kHIDUsage_Snsr_Scanner_Barcode: number

export declare const kHIDUsage_Snsr_Orientation_InclinometerD: number

export declare const kHIDUsage_Snsr_Orientation_DeviceOrientation: number

export declare const kHIDUsage_Snsr_Orientation_Distance2D: number

export declare const kHIDUsage_Snsr_Orientation_Inclinometer1D: number

export declare const kHIDUsage_Snsr_Orientation_Compass3D: number

export declare const kHIDUsage_Snsr_Motion_LinearAccelerometer: number

export declare const kHIDUsage_Snsr_Motion_GravityVector: number

export declare const kHIDUsage_Snsr_Motion_Gyrometer3D: number

export declare const kHIDUsage_Snsr_Motion_Gyrometer2D: number

export declare const kHIDUsage_BCS_EAN_13: number

export declare const kHIDUsage_Snsr_Motion_Gyrometer1D: number

export declare const kHIDUsage_Snsr_Motion_Accelerometer1D: number

export declare const kHIDUsage_Snsr_Motion: number

export declare const kHIDUsage_PD_iManufacturer: number

export declare const kHIDUsage_Snsr_Mechanical_HallEffectSwitch: number

export declare const kHIDUsage_Snsr_Mechanical_HapticVibrator: number

export declare const kHIDUsage_Snsr_Mechanical_Force: number

export declare const kHIDUsage_Snsr_Mechanical_BooleanSwitch: number

export declare const kHIDUsage_Snsr_Mechanical: number

export declare const kHIDUsage_Snsr_Location_Static: number

export declare const kHIDUsage_Snsr_Location_Other: number

export declare const kHIDUsage_Snsr_Location_Lookup: number

export declare const kHIDUsage_Snsr_Location_GPS: number

export declare const kHIDUsage_Snsr_Location_Broadcast: number

export declare const kHIDUsage_Snsr_Location: number

export declare const kHIDUsage_Snsr_Light_ConsumerInfrared: number

export declare const kHIDUsage_Snsr_Environmental_WindDirection: number

export declare const kHIDUsage_Snsr_Environmental_Temperature: number

export declare const kHIDUsage_Snsr_Environmental_Humidity: number

export declare const kHIDUsage_Snsr_Environmental: number

export declare const kMode3Mask: number

export declare const kHIDUsage_Snsr_Electrical_Period: number

export declare const kHIDUsage_Snsr_Electrical_Frequency: number

export declare const kHIDUsage_Snsr_Electrical_Potentiometer: number

export declare const kHIDUsage_Snsr_Electrical_Voltage: number

export declare const kHIDUsage_Snsr_Electrical_Inductance: number

export declare const kHIDUsage_Snsr_Electrical_Capacitance: number

export declare const kSESCmd_SEND_DIAGNOSTICS: number

export declare const kHIDUsage_Snsr_Biometric_HumanTouch: number

export declare const kHIDUsage_Snsr_Biometric_HumanPresence: number

export declare const kHIDUsage_Snsr_Biometric: number

export declare const kHIDUsage_AD_UnicodeCharacterSet: number

export declare const kHIDUsage_AD_CharacterSpacingHorizontal: number

export declare const kHIDUsage_AD_CursorEnable: number

export declare const kHIDUsage_AD_CursorPixelPositioning: number

export declare const kHIDUsage_AD_Rows: number

export declare const kHIDUsage_AD_Column: number

export declare const kHIDUsage_AD_CursorPositionReport: number

export declare const kHIDUsage_AD_VerticalScroll: number

export declare const kHIDUsage_AD_ScreenSaverEnable: number

export declare const kHIDUsage_AD_DisplayEnable: number

export declare const kHIDUsage_AD_ClearDisplay: number

export declare const kHIDUsage_AD_FontReadBack: number

export declare const kHIDUsage_AD_DataReadBack: number

export declare const kFWBIBMaxROM: number

export declare const kHIDUsage_AD_AlphanumericDisplay: number

export declare const kHIDUsage_PID_Reserved: number

export declare const kHIDUsage_PID_CreateNewEffectReport: number

export declare const kHIDUsage_PID_SharedParameterBlocks: number

export declare const kHIDUsage_PID_ParameterBlockSize: number

export declare const kHIDUsage_PID_StartDelay: number

export declare const kHIDUsage_PID_ActuatorPower: number

export declare const kFWIsochTagPhase: number

export declare const kMMCCmd_PAUSE_RESUME: number

export declare const kINQUIRY_Byte7_WBUS16_Bit: number

export declare const kHIDUsage_PID_ActuatorOverrideSwitch: number

export declare const kHIDUsage_PID_SafetySwitch: number

export declare const kHIDUsage_PID_DevicePaused: number

export declare const kHIDUsage_PID_DC_DeviceReset: number

export declare const kHIDUsage_PID_DC_DisableActuators: number

export declare const kHIDUsage_PID_DeviceControl: number

export declare const kHIDUsage_PID_DeviceControlReport: number

export declare const kHIDUsage_PID_StateReport: number

export declare const kHIDUsage_PID_BlockFreeReport: number

export declare const kHIDUsage_PID_BlockLoadError: number

export declare const kHIDRqSetIdle: number

export declare const kHIDUsage_PID_BlockLoadFull: number

export declare const kHIDUsage_PID_BlockLoadSuccess: number

export declare const kHIDUsage_PID_MoveSource: number

export declare const kHIDUsage_PID_PoolMoveReport: number

export declare const kHIDUsage_PID_SimultaneousEffectsMax: number

export declare const kHIDUsage_PID_ROM_EffectBlockCount: number

export declare const kHIDUsage_PID_RAM_PoolSize: number

export declare const kHIDUsage_PID_DeviceGain: number

export declare const kHIDUsage_PID_DeviceGainReport: number

export declare const kHIDUsage_PID_OpEffectStop: number

export declare const kHIDUsage_PID_OpEffectStart: number

export declare const kHIDUsage_PID_EffectOperationReport: number

export declare const kHIDUsage_PID_RampEnd: number

export declare const kHIDUsage_PID_RampStart: number

export declare const kHIDUsage_PID_SetRampForceReport: number

export declare const kHIDUsage_PID_Magnitude: number

export declare const kHIDUsage_PID_SetCustomForceReport: number

export declare const kHIDUsage_PID_CustomForceVendorDefinedData: number

export declare const kHIDUsage_PID_PositiveSaturation: number

export declare const kHIDUsage_PID_NegativeCoefficient: number

export declare const kHIDUsage_PID_PositiveCoefficient: number

export declare const kHIDUsage_PID_CP_Offset: number

export declare const kHIDUsage_PID_FadeLevel: number

export declare const kHIDUsage_PID_SetEnvelopeReport: number

export declare const kHIDUsage_PID_BlockType: number

export declare const kHIDUsage_PID_DirectionEnable: number

export declare const kHIDUsage_PID_TriggerRepeatInterval: number

export declare const kHIDUsage_PID_TriggerButton: number

export declare const kHIDUsage_PID_Gain: number

export declare const kHIDUsage_PID_SamplePeriod: number

export declare const kHIDUsage_PID_Duration: number

export declare const kHIDUsage_PID_ET_Friction: number

export declare const kHIDUsage_PID_ET_Damper: number

export declare const kHIDUsage_PID_ET_Spring: number

export declare const kHIDUsage_PID_ET_SawtoothUp: number

export declare const kHIDUsage_PID_ET_Triangle: number

export declare const kHIDUsage_PID_ET_Square: number

export declare const kHIDUsage_PID_ET_CustomForceData: number

export declare const kHIDUsage_PID_ET_ConstantForce: number

export declare const kHIDUsage_PID_ROM_Flag: number

export declare const kHIDUsage_PID_ParamBlockOffset: number

export declare const kHIDUsage_PID_EffectBlockIndex: number

export declare const kHIDUsage_PID_SetEffectReport: number

export declare const kHIDUsage_Haptics_VendorWaveformFirst: number

export declare const kHIDUsage_Haptics_WaveformRumbleContinuous: number

export declare const kHIDUsage_Haptics_WaveformClick: number

export declare const kHIDUsage_Haptics_WaveformStop: number

export declare const kHIDUsage_Haptics_WaveformCutoffTime: number

export declare const kHIDUsage_Haptics_RetriggerPeriod: number

export declare const kHIDUsage_Haptics_RepeatCount: number

export declare const kHIDUsage_Haptics_Intensity: number

export declare const kHIDUsage_Haptics_AutoTriggerAssociatedControl: number

export declare const kHIDUsage_Haptics_ManualTrigger: number

export declare const kHIDUsage_Haptics_AutoTrigger: number

export declare const kHIDUsage_Haptics_DurationList: number

export declare const kHIDUsage_Haptics_WaveformList: number

export declare const kHIDUsage_Dig_ReportRate: number

export declare const kHIDUsage_Dig_CapacitiveHeatMapFrameData: number

export declare const kHIDUsage_Dig_CapacitiveHeatMapProtocolVendorID: number

export declare const kHIDUsage_Dig_GestureCharacterEncodingUTF32BE: number

export declare const kHIDUsage_Dig_GestureCharacterEncodingUTF16BE: number

export declare const kHIDUsage_Dig_GestureCharacterEncodingUTF16LE: number

export declare const kHIDUsage_Dig_GestureCharacterDataLength: number

export declare const kHIDUsage_Dig_GestureCharacterEnable: number

export declare const kHIDUsage_Dig_RelativeScanTime: number

export declare const kHIDUsage_Dig_ContactCountMaximum: number

export declare const kHIDUsage_Dig_DeviceMode: number

export declare const kHIDUsage_Dig_Width: number

export declare const kHIDUsage_Dig_TouchValid: number

export declare const kHIDUsage_Dig_TabletPick: number

export declare const kHIDUsage_Dig_BarrelSwitch: number

export declare const kHIDUsage_Dig_Twist: number

export declare const kHIDUsage_Dig_Altitude: number

export declare const kHIDUsage_Dig_Azimuth: number

export declare const kHIDUsage_Dig_Invert: number

export declare const kHIDUsage_Dig_TransducerIndex: number

export declare const kHIDUsage_Dig_Untouch: number

export declare const kHIDUsage_Dig_Touch: number

export declare const kHIDUsage_Dig_InRange: number

export declare const kHIDUsage_Dig_BarrelPressure: number

export declare const kHIDUsage_BCS_PrefixAIMI: number

export declare const kHIDUsage_Dig_TipPressure: number

export declare const kHIDUsage_Dig_GestureCharacter: number

export declare const kHIDUsage_Dig_DeviceSettings: number

export declare const kHIDUsage_Dig_Finger: number

export declare const kHIDUsage_Dig_DeviceConfiguration: number

export declare const kINQUIRY_ANSI_VERSION_SCSI_2_Compliant: number

export declare const kHIDUsage_Dig_FreeSpaceWand: number

export declare const kHIDUsage_Dig_Armature: number

export declare const kHIDUsage_Dig_CoordinateMeasuringMachine: number

export declare const kHIDUsage_Dig_TouchPad: number

export declare const kHIDUsage_Csmr_ContactStatusFlag: number

export declare const kHIDUsage_Csmr_ContactSpeedDialNumber: number

export declare const kHIDUsage_Csmr_ContactEmailMain: number

export declare const kHIDUsage_Csmr_ContactPhoneNumberOther: number

export declare const kHIDUsage_Csmr_ContactPhoneNumberFax: number

export declare const kHIDUsage_Csmr_ContactPhoneNumberPager: number

export declare const kHIDUsage_Csmr_ContactPhoneNumberBusiness: number

export declare const kHIDUsage_Csmr_ContactFullName: number

export declare const thirtyTwoBitMode: number

export declare const kHIDUsage_Csmr_ContactNickname: number

export declare const kHIDUsage_Csmr_ContactAdded: number

export declare const kHIDUsage_Csmr_ContactEdited: number

export declare const kHIDUsage_Csmr_KeyboardInputAssistCancel: number

export declare const kHIDUsage_Csmr_KeyboardInputAssistNext: number

export declare const kHIDUsage_Csmr_ImplementedKeyboardInputAssistControls: number

export declare const kHIDUsage_Csmr_KeyboardIETFLanguageTagIndex: number

export declare const kHIDUsage_Csmr_KeyboardPhysicalLayout: number

export declare const kHIDUsage_Csmr_ExtendedKeyboardAttributesCollection: number

export declare const kHIDUsage_Csmr_ACDesktopShowAllApplications: number

export declare const kHIDUsage_Csmr_ACSoftKeyRight: number

export declare const kHIDUsage_Csmr_ACSoftKeyLeft: number

export declare const kHIDUsage_Csmr_ACNavigationGuidance: number

export declare const kUSBFeatureEndpointStall: number

export declare const kHIDUsage_Csmr_ACSplit: number

export declare const kHIDUsage_Csmr_ACMerge: number

export declare const kHIDUsage_Csmr_ACRename: number

export declare const kFifthDepthMode: number

export declare const kHIDUsage_Csmr_ACInsertSymbol: number

export declare const kHIDUsage_BCS_NotOnFileIndication: number

export declare const kHIDUsage_Csmr_ACInsertPicture: number

export declare const kHIDUsage_Csmr_ACInsertRow: number

export declare const kHIDUsage_Csmr_ACSetBorders: number

export declare const kCSRIndirectDataAddress: number

export declare const kHIDUsage_Csmr_ACDownload: number

export declare const kHIDUsage_Csmr_ACSend: number

export declare const kHIDUsage_Csmr_ACReply: number

export declare const kHIDUsage_Csmr_ACSendTo: number

export declare const kHIDUsage_Csmr_ACSynchronize: number

export declare const kHIDUsage_Csmr_ACResetAlarm: number

export declare const kHIDUsage_Csmr_ACSnoozeAlarm: number

export declare const kHIDUsage_Csmr_ACClearAlarm: number

export declare const kHIDUsage_Csmr_ACSetAlarm: number

export declare const kHIDUsage_Csmr_ACEditTimeZones: number

export declare const kHIDUsage_Csmr_ACSelectTimeZone: number

export declare const kHIDUsage_Csmr_ACSetClock: number

export declare const kHIDUsage_Csmr_ACSortDescending: number

export declare const kHIDUsage_BD_BrailleJoystickLeft: number

export declare const kHIDUsage_Csmr_ACSortAscending: number

export declare const kHIDUsage_Csmr_ACSort: number

export declare const IOPMNextLowerState: number

export declare const kHIDUsage_Csmr_ACSelectTable: number

export declare const kHIDUsage_Csmr_ACSelectColumn: number

export declare const kHIDUsage_Csmr_ACSelectParagraph: number

export declare const kHIDUsage_Csmr_ACSelectSentence: number

export declare const kHIDUsage_Csmr_ACViewComment: number

export declare const kHIDUsage_Csmr_ACUnprotect: number

export declare const kHIDUsage_Csmr_ACProtect: number

export declare const kHIDUsage_Csmr_ACDelete: number

export declare const kHIDUsage_Csmr_ACCollapse: number

export declare const kHIDUsage_Csmr_ACAddToCart: number

export declare const kHIDUsage_Csmr_ACBuyOrCheckout: number

export declare const kHIDUsage_Csmr_ACCancel: number

export declare const kHIDUsage_Csmr_ACNo: number

export declare const kHIDUsage_Csmr_ACYes: number

export declare const kHIDUsage_Csmr_ACPromote: number

export declare const kHIDUsage_Csmr_ACBulletedList: number

export declare const kHIDUsage_Csmr_ACRestartNumbering: number

export declare const kHIDUsage_Csmr_ACJustifyBlockV: number

export declare const kIOPacketFilterUnicast: number

export declare const kHIDUsage_Csmr_ACJustifyTop: number

export declare const kHIDUsage_Csmr_ACJustifyRight: number

export declare const kHIDUsage_Csmr_ACFontSelect: number

export declare const kHIDUsage_Csmr_ACMirrorHorizontal: number

export declare const kHIDUsage_Csmr_ACFlipVertical: number

export declare const kHIDUsage_Csmr_ACFlipHorizontal: number

export declare const kHIDUsage_Csmr_ACStrikethrough: number

export declare const kHIDUsage_Csmr_ACUnderline: number

export declare const kHIDUsage_Csmr_ACItalics: number

export declare const kHIDUsage_Csmr_ACFormat: number

export declare const kHIDUsage_Snsr_Property_Environmental_ReferencePressure: number

export declare const kHIDUsage_Csmr_ACTileVertically: number

export declare const kHIDUsage_Csmr_ACTileHorizontally: number

export declare const kHIDUsage_Csmr_ACPan: number

export declare const kHIDUsage_Csmr_ACPanRight: number

export declare const kHIDUsage_Csmr_ACPanLeft: number

export declare const kHIDUsage_Csmr_ACScroll: number

export declare const kHIDUsage_Csmr_ACScrollUp: number

export declare const kHIDUsage_Csmr_ACZoomIn: number

export declare const kHIDUsage_Csmr_ACSubscriptions: number

export declare const kHIDUsage_Csmr_ACHistory: number

export declare const kHIDUsage_Csmr_ACBookmarks: number

export declare const kHIDUsage_Csmr_ACPreviousLink: number

export declare const kHIDUsage_Csmr_ACStop: number

export declare const kHIDUsage_Csmr_ACHome: number

export declare const kHIDUsage_Csmr_ACFindandReplace: number

export declare const kHIDUsage_Csmr_ACFind: number

export declare const kHIDUsage_Csmr_ACUndo: number

export declare const kHIDUsage_Csmr_ACProperties: number

export declare const kHIDUsage_Csmr_ACSave: number

export declare const kHIDUsage_Csmr_ACMinimize: number

export declare const kHIDUsage_Csmr_ACNew: number

export declare const kHIDUsage_Csmr_ALNavigation: number

export declare const kHIDUsage_Csmr_ALContactSync: number

export declare const kHIDUsage_Csmr_ALAudioPlayer: number

export declare const kHIDUsage_Csmr_ALCustomizedCorporateNewsBrowser: number

export declare const kINQUIRY_ECMA_VERSION_Mask: number

export declare const kHIDUsage_Csmr_ALMarketMonitorOrFinanceBrowser: number

export declare const kHIDUsage_Csmr_ALSmartCardInformationOrHelp: number

export declare const kHIDUsage_Csmr_ALOnlineCommunity: number

export declare const kHIDUsage_Csmr_ALDigitalWallet: number

export declare const kHIDUsage_Csmr_ALMovieBrowser: number

export declare const kHIDUsage_Csmr_ALAudioBrowser: number

export declare const kHIDUsage_Csmr_ALImageBrowser: number

export declare const kHIDUsage_Csmr_ALFileBrowser: number

export declare const kHIDUsage_Csmr_ALScreenSaver: number

export declare const kHIDUsage_Csmr_ALEncryption: number

export declare const kHIDUsage_BCS_ParametersChanged: number

export declare const kHIDUsage_Csmr_ALKeyboardLayout: number

export declare const kHIDUsage_Csmr_ALGrammerCheck: number

export declare const kHIDUsage_Csmr_ALSpellCheck: number

export declare const kHIDUsage_Csmr_ALDictionary: number

export declare const kHIDUsage_Csmr_ALDocuments: number

export declare const kHIDUsage_Csmr_ALIntegratedHelpCenter: number

export declare const kHIDUsage_Csmr_ALPreemptiveHaltTaskOrApplication: number

export declare const kHIDUsage_Csmr_ALPreviousTaskOrApplication: number

export declare const kHIDUsage_BCS_LockoutTime: number

export declare const kHIDUsage_Csmr_ALCommandLineProcessorOrRun: number

export declare const kHIDUsage_Csmr_ALTerminalLockOrScreensaver: number

export declare const kHIDUsage_Csmr_VendorSpecificKeyboardPhysicalLayout: number

export declare const kHIDUsage_Csmr_ALLogonOrLogoff: number

export declare const kHIDUsage_Csmr_ALLogon: number

export declare const kHIDUsage_Csmr_ALTelephonyOrDialer: number

export declare const kHIDUsage_Csmr_ALNetworkChat: number

export declare const kHIDUsage_Csmr_ALInternetBrowser: number

export declare const kHIDUsage_Csmr_ALCalculator: number

export declare const kHIDUsage_Csmr_ALLogOrJournalOrTimecard: number

export declare const kHIDUsage_Csmr_ALContactsOrAddressBook: number

export declare const kHIDUsage_Csmr_ALPresentationApp: number

export declare const kHIDUsage_Csmr_ALGraphicsEditor: number

export declare const kHIDUsage_Csmr_ALSpreadsheet: number

export declare const kIOPMCannotRaisePower: number

export declare const kHIDUsage_Csmr_ALTextEditor: number

export declare const kHIDUsage_Csmr_ALConsumerControlConfiguration: number

export declare const kHIDUsage_Csmr_ALProgrammableButtonConfiguration: number

export declare const kHIDUsage_Csmr_ALLaunchButtonConfigurationTool: number

export declare const kHIDUsage_Csmr_AlternateAudioIncrement: number

export declare const kHIDUsage_Csmr_SubChannelIncrement: number

export declare const kHIDUsage_Csmr_SubChannel: number

export declare const kHIDUsage_Csmr_ChannelTop: number

export declare const kHIDUsage_Csmr_ChannelSurround: number

export declare const kHIDUsage_Csmr_ChannelSide: number

export declare const kHIDUsage_Csmr_ChannelCenterFront: number

export declare const kSBCWOCmd_WRITE_12: number

export declare const kHIDUsage_Csmr_ChannelRight: number

export declare const kHIDUsage_Csmr_ChannelLeft: number

export declare const kHIDUsage_Csmr_SpeakerSystem: number

export declare const kHIDUsage_Csmr_TrebleIncrement: number

export declare const kHIDUsage_BS_ThermistorUnderRange: number

export declare const kHIDUsage_Csmr_BassDecrement: number

export declare const kHIDUsage_Csmr_BalanceLeft: number

export declare const kHIDUsage_Csmr_HoldupAlarm: number

export declare const kHIDUsage_Csmr_Motion: number

export declare const kHIDUsage_Csmr_FireAlarm: number

export declare const kHIDUsage_Csmr_RoomTemperature: number

export declare const kHIDUsage_Csmr_LightIlluminationLevel: number

export declare const kHIDUsage_Csmr_LightEnable: number

export declare const kHIDUsage_Csmr_Slow: number

export declare const kHIDUsage_Csmr_ExtendedPlay: number

export declare const kHIDUsage_Csmr_LongPlay: number

export declare const kHIDUsage_Csmr_StandardPlay: number

export declare const kHIDUsage_Csmr_PlaybackSpeed: number

export declare const kHIDUsage_Csmr_Speed: number

export declare const kHIDUsage_Csmr_VolumeDecrement: number

export declare const kHIDUsage_Csmr_MPX: number

export declare const kHIDUsage_Csmr_Bass: number

export declare const kHIDUsage_Csmr_Mute: number

export declare const kHIDUsage_Csmr_Volume: number

export declare const kHIDUsage_Csmr_VoiceCommand: number

export declare const kHIDUsage_BS_Maxerror: number

export declare const kHIDUsage_Csmr_PlayOrSkip: number

export declare const kHIDUsage_Csmr_PlayOrPause: number

export declare const kHIDUsage_Csmr_StopOrEject: number

export declare const kHIDUsage_Csmr_TrackingDecrement: number

export declare const kHIDUsage_Csmr_CounterReset: number

export declare const kHIDUsage_Csmr_SearchMarkBackwards: number

export declare const kHIDUsage_Csmr_SearchMarkForward: number

export declare const kHIDUsage_Csmr_ReturnToMark: number

export declare const kHIDUsage_Csmr_ClearMark: number

export declare const kHIDUsage_Csmr_FrameBack: number

export declare const kHIDUsage_Csmr_FrameForward: number

export declare const kHIDUsage_Csmr_TrackNormal: number

export declare const kHIDUsage_Csmr_EnterDisc: number

export declare const kHIDUsage_Csmr_RandomPlay: number

export declare const kHIDUsage_Csmr_FastForward: number

export declare const kHIDUsage_Csmr_Pause: number

export declare const kHIDUsage_Csmr_Monthly: number

export declare const kHIDUsage_Csmr_Daily: number

export declare const kHIDUsage_Csmr_ChannelDecrement: number

export declare const kHIDUsage_Csmr_ChannelIncrement: number

export declare const kHIDUsage_Csmr_MediaSelectCall: number

export declare const kHIDUsage_Csmr_MediaSelectHome: number

export declare const kHIDUsage_Csmr_MediaSelectSecurity: number

export declare const kHIDUsage_Csmr_MediaSelectSatellite: number

export declare const kHIDUsage_Csmr_MediaSelectTape: number

export declare const kHIDUsage_Csmr_Help: number

export declare const kHIDUsage_Csmr_MediaSelectVCR: number

export declare const kHIDUsage_Csmr_MediaSelectCD: number

export declare const kHIDUsage_Csmr_MediaSelectMessages: number

export declare const kHIDUsage_Csmr_MediaSelectVideoPhone: number

export declare const kHIDUsage_Csmr_MediaSelectProgramGuide: number

export declare const kHIDUsage_Csmr_MediaSelectDVD: number

export declare const kHIDUsage_Csmr_MediaSelectComputer: number

export declare const kHIDUsage_Csmr_Channel: number

export declare const kHIDUsage_PD_Frequency: number

export declare const kHIDUsage_Csmr_OrderMovie: number

export declare const kHIDUsage_Csmr_EnterChannel: number

export declare const kHIDUsage_Csmr_RecallLast: number

export declare const kHIDUsage_Csmr_Selection: number

export declare const kHIDUsage_Csmr_DisplayBrightnessSetAutoBrightness: number

export declare const kHIDUsage_Csmr_DisplayBrightnessMaximum: number

export declare const kHIDUsage_Csmr_DisplayBrightnessMinimum: number

export declare const kHIDUsage_Csmr_DisplayBacklightToggle: number

export declare const kHIDUsage_Csmr_DisplayBrightness: number

export declare const kHIDUsage_Csmr_3DModeSelect: number

export declare const kHIDUsage_Csmr_YellowMenuButton: number

export declare const kHIDUsage_Csmr_RedMenuButton: number

export declare const kHIDUsage_Csmr_PictureInPictureSwap: number

export declare const kHIDUsage_Csmr_PictureInPictureToggle: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularVelocity: number

export declare const kHIDUsage_Csmr_BroadcastMode: number

export declare const kHIDUsage_Csmr_VCROrTV: number

export declare const kHIDUsage_Csmr_ClosedCaptionSelect: number

export declare const kHIDUsage_Csmr_ClosedCaption: number

export declare const kHIDUsage_Csmr_MenuValueDecrease: number

export declare const kHIDUsage_Csmr_MenuEscape: number

export declare const kHIDUsage_Csmr_MenuLeft: number

export declare const kHIDUsage_Csmr_MenuPick: number

export declare const kHIDUsage_Csmr_SleepMode: number

export declare const kHIDUsage_Csmr_SleepAfter: number

export declare const kHIDUsage_Csmr_Reset: number

export declare const kSCSICmd_READ_CD_MSF: number

export declare const kHIDUsage_Csmr_Power: number

export declare const kSCSIServiceAction_SET_TARGET_PORT_GROUPS: number

export declare const kHIDUsage_Csmr_Plus100: number

export declare const kHIDUsage_Csmr_GraphicEqualizer: number

export declare const kHIDUsage_Csmr_Headphone: number

export declare const kHIDUsage_Csmr_Microphone: number

export declare const kHIDUsage_Csmr_ProgrammableButtons: number

export declare const kHIDUsage_Csmr_ConsumerControl: number

export declare const kHIDUsage_TFon_Reserved: number

export declare const kHIDUsage_Tfon_PhoneKeyStar: number

export declare const kHIDUsage_Tfon_PhoneKey9: number

export declare const kHIDUsage_Tfon_PhoneKey7: number

export declare const kHIDUsage_Tfon_PhoneKey6: number

export declare const kHIDUsage_Tfon_PhoneKey2: number

export declare const kHIDUsage_Tfon_PhoneKey1: number

export declare const kHIDUsage_Tfon_PhoneKey0: number

export declare const kHIDUsage_Tfon_ConfirmationTone2: number

export declare const kHIDUsage_Tfon_ConfirmationTone1: number

export declare const kHIDUsage_Tfon_PriorityRingback: number

export declare const kHIDUsage_Tfon_InsideRingback: number

export declare const kHIDUsage_Tfon_OutsideRingTone: number

export declare const kHIDUsage_Tfon_InsideRingTone: number

export declare const kHIDUsage_Tfon_OutsideDialTone: number

export declare const kHIDUsage_Tfon_InsideDialTone: number

export declare const kHIDUsage_Tfon_AnswerOnOrOff: number

export declare const kHIDUsage_Tfon_ScreenCalls: number

export declare const kHIDUsage_Tfon_RecallNumber: number

export declare const kHIDUsage_Tfon_SpeedDial: number

export declare const kHIDUsage_Tfon_CallerID: number

export declare const kHIDUsage_Tfon_PhoneMute: number

export declare const kHIDUsage_Tfon_Ring: number

export declare const kHIDUsage_Tfon_RingEnable: number

export declare const kHIDUsage_Tfon_Conference: number

export declare const kHIDUsage_Tfon_Line: number

export declare const kHIDUsage_Tfon_AlternateFunction: number

export declare const kHIDUsage_Tfon_Transfer: number

export declare const kHIDUsage_Tfon_Redial: number

export declare const kHIDUsage_Tfon_Hold: number

export declare const kHIDUsage_Tfon_Feature: number

export declare const kHIDUsage_Tfon_Flash: number

export declare const kHIDUsage_Tfon_HookSwitch: number

export declare const kHIDUsage_Tfon_TelephonyKeyPad: number

export declare const kSCSICmd_REPORT_LUNS: number

export declare const kHIDUsage_Tfon_Headset: number

export declare const kHIDUsage_Tfon_Handset: number

export declare const kHIDUsage_Tfon_AnsweringMachine: number

export declare const kHIDUsage_Ord_Instance65535: number

export declare const kHIDUsage_Ord_Instance3: number

export declare const kHIDUsage_Button_254: number

export declare const kHIDUsage_Button_253: number

export declare const kHIDUsage_Button_252: number

export declare const kHIDUsage_Button_251: number

export declare const kHIDUsage_Button_250: number

export declare const kHIDUsage_Button_249: number

export declare const kHIDUsage_Button_247: number

export declare const kHIDUsage_Button_245: number

export declare const kHIDUsage_Button_244: number

export declare const kHIDUsage_Button_243: number

export declare const kHIDUsage_Button_242: number

export declare const kHIDUsage_Button_239: number

export declare const kHIDUsage_Snsr_Data_Custom_BooleanArray: number

export declare const kHIDUsage_Button_238: number

export declare const kHIDUsage_Button_237: number

export declare const kHIDUsage_Button_236: number

export declare const kHIDUsage_Button_232: number

export declare const kHIDUsage_Button_231: number

export declare const kHIDUsage_Button_230: number

export declare const kHIDUsage_Button_229: number

export declare const kHIDUsage_Button_227: number

export declare const kHIDUsage_Button_225: number

export declare const kHIDUsage_Button_224: number

export declare const kHIDUsage_Button_222: number

export declare const kHIDUsage_Button_221: number

export declare const kHIDUsage_Button_220: number

export declare const kHIDUsage_Button_219: number

export declare const kHIDUsage_Button_217: number

export declare const kHIDUsage_Button_213: number

export declare const kHIDUsage_Button_212: number

export declare const kSCCCmd_REQUEST_SENSE: number

export declare const kHIDUsage_Button_210: number

export declare const kHIDUsage_Button_207: number

export declare const kHIDUsage_Button_206: number

export declare const kHIDUsage_Button_205: number

export declare const kIOUSBUSB20ExtensionCapabilityBESL: number

export declare const kHIDUsage_Button_201: number

export declare const kHIDUsage_Button_200: number

export declare const kHIDUsage_Button_199: number

export declare const kHIDUsage_Button_198: number

export declare const kHIDUsage_Button_197: number

export declare const kHIDUsage_Button_195: number

export declare const kHIDUsage_Button_192: number

export declare const kHIDUsage_Button_189: number

export declare const kHIDUsage_Button_188: number

export declare const kHIDUsage_Button_187: number

export declare const kHIDUsage_Button_186: number

export declare const kHIDUsage_Button_185: number

export declare const kHIDUsage_Button_184: number

export declare const kHIDUsage_Button_182: number

export declare const kSCSICmd_BLANK: number

export declare const kHIDUsage_Button_181: number

export declare const kHIDUsage_Button_180: number

export declare const kHIDUsage_Button_176: number

export declare const kHIDUsage_Button_175: number

export declare const kHIDUsage_Button_171: number

export declare const kHIDUsage_Button_170: number

export declare const kHIDUsage_Button_167: number

export declare const kHIDUsage_Button_166: number

export declare const kHIDUsage_Button_165: number

export declare const kHIDUsage_Button_161: number

export declare const kHIDUsage_Button_158: number

export declare const kHIDUsage_Button_156: number

export declare const kHIDUsage_Button_150: number

export declare const kHIDUsage_Button_149: number

export declare const kHIDUsage_Button_148: number

export declare const kIOPSFamilyCodeUSBHostSuspended: number

export declare const kHIDUsage_Button_147: number

export declare const kHIDUsage_Button_146: number

export declare const kHIDUsage_Button_145: number

export declare const kHIDUsage_Button_141: number

export declare const kHIDUsage_Button_139: number

export declare const kHIDUsage_BCS_GoodDecodeIndication: number

export declare const kHIDUsage_Button_136: number

export declare const kHIDUsage_Button_134: number

export declare const kHIDUsage_Button_133: number

export declare const kHIDUsage_Button_131: number

export declare const kHIDUsage_Button_128: number

export declare const kHIDUsage_Button_125: number

export declare const kHIDUsage_Button_124: number

export declare const kHIDUsage_Button_121: number

export declare const kHIDUsage_Button_117: number

export declare const kHIDUsage_Button_115: number

export declare const kHIDUsage_Button_113: number

export declare const kHIDUsage_Button_112: number

export declare const kHIDUsage_Button_111: number

export declare const kHIDUsage_Button_106: number

export declare const kHIDUsage_Button_105: number

export declare const kHIDUsage_Button_103: number

export declare const kHIDUsage_Button_101: number

export declare const kHIDUsage_Button_100: number

export declare const kHIDUsage_Button_99: number

export declare const kHIDUsage_Button_96: number

export declare const kHIDUsage_Button_93: number

export declare const kHIDUsage_Button_92: number

export declare const kHIDUsage_Button_90: number

export declare const kHIDUsage_Button_84: number

export declare const kHIDUsage_Button_83: number

export declare const kHIDUsage_Button_79: number

export declare const kHIDUsage_Button_78: number

export declare const kHIDUsage_Button_74: number

export declare const kHIDUsage_Button_72: number

export declare const kHIDUsage_Snsr_Event_SensorEvent: number

export declare const kHIDUsage_Button_196: number

export declare const kHIDUsage_Button_71: number

export declare const kHIDUsage_Button_69: number

export declare const kHIDUsage_Button_67: number

export declare const kHIDUsage_Button_65: number

export declare const kHIDUsage_Button_63: number

export declare const kHIDUsage_Button_59: number

export declare const kHIDUsage_Button_56: number

export declare const kHIDUsage_Button_55: number

export declare const kHIDUsage_Button_53: number

export declare const kHIDUsage_Button_51: number

export declare const kHIDUsage_Button_50: number

export declare const kHIDUsage_Button_49: number

export declare const kHIDUsage_Button_48: number

export declare const kHIDUsage_Button_46: number

export declare const kHIDUsage_Tfon_CallWaitingTone: number

export declare const kHIDUsage_Button_45: number

export declare const kIONetworkDataBufferTypeNone: number

export declare const kHIDUsage_Button_43: number

export declare const kHIDUsage_Button_42: number

export declare const kHIDUsage_Button_36: number

export declare const kSCSIServiceAction_REPORT_SUPPORTED_TASK_MANAGEMENT_FUNCTIONS: number

export declare const kHIDUsage_Button_35: number

export declare const kHIDUsage_Button_33: number

export declare const kDVDMediaTypeRAM: number

export declare const kHIDUsage_Button_31: number

export declare const kHIDUsage_Button_28: number

export declare const kHIDUsage_Button_27: number

export declare const kHIDUsage_Button_25: number

export declare const kHIDUsage_Button_24: number

export declare const kUSPrintingClassGetDeviceID: number

export declare const kHIDUsage_Button_23: number

export declare const kHIDUsage_Button_22: number

export declare const kHIDUsage_Button_21: number

export declare const kHIDUsage_Button_20: number

export declare const kHIDUsage_Button_16: number

export declare const kHIDUsage_Button_12: number

export declare const kHIDUsage_Button_10: number

export declare const kHIDUsage_Button_9: number

export declare const kHIDUsage_Button_7: number

export declare const kHIDUsage_Button_6: number

export declare const kHIDUsage_Button_5: number

export declare const kHIDUsage_Button_4: number

export declare const kHIDUsage_Button_2: number

export declare const kHIDUsage_LED_Reserved: number

export declare const kHIDUsage_LED_Player6: number

export declare const kCDFeaturesTestWriteBit: number

export declare const kHIDUsage_LED_Player5: number

export declare const kHIDUsage_LED_Player4: number

export declare const kHIDUsage_LED_Player2: number

export declare const kHIDUsage_LED_PlayerIndicator: number

export declare const kHIDUsage_LED_LEDIntensity: number

export declare const kHIDUsage_LED_BlueLEDChannel: number

export declare const kHIDUsage_LED_RedLEDChannel: number

export declare const kHIDUsage_LED_RGB_LED: number

export declare const kHIDUsage_LED_WarningStatus: number

export declare const kHIDUsage_Button_65535: number

export declare const kHIDUsage_LED_GoodStatus: number

export declare const kHIDUsage_LED_SystemSuspend: number

export declare const kHIDUsage_LED_IndicatorRed: number

export declare const kHIDUsage_LED_UsageIndicatorColor: number

export declare const kHIDUsage_LED_FastBlinkOnTime: number

export declare const kHIDUsage_Snsr_Data_Time_Year: number

export declare const kHIDUsage_LED_FlashOnTime: number

export declare const kHIDUsage_LED_IndicatorSlowBlink: number

export declare const kHIDUsage_LED_IndicatorFlash: number

export declare const kSCSIServiceAction_REPORT_PRIORITY: number

export declare const kHIDUsage_LED_IndicatorOn: number

export declare const kHIDUsage_LED_Error: number

export declare const kHIDUsage_LED_Record: number

export declare const kHIDUsage_LED_Play: number

export declare const kHIDUsage_LED_FastForward: number

export declare const kHIDUsage_LED_Stop: number

export declare const kHIDUsage_LED_Remote: number

export declare const kHIDUsage_LED_OffLine: number

export declare const kHIDUsage_PD_Overload: number

export declare const kHIDUsage_LED_StandBy: number

export declare const kHIDUsage_LED_NightMode: number

export declare const kHIDUsage_LED_Coverage: number

export declare const kHIDUsage_LED_Microphone: number

export declare const kHIDUsage_LED_Hold: number

export declare const kHIDUsage_LED_BatteryOperation: number

export declare const kHIDUsage_LED_DataMode: number

export declare const kHIDUsage_LED_MessageWaiting: number

export declare const kHIDUsage_LED_Ring: number

export declare const kHIDUsage_LED_RecordingFormatDetect: number

export declare const kHIDUsage_LED_CLV: number

export declare const kCDMediaTypeRW: number

export declare const kHIDUsage_LED_Spinning: number

export declare const kHIDUsage_LED_SamplingRateDetect: number

export declare const kHIDUsage_LED_SurroundOn: number

export declare const kHIDUsage_Csmr_ACSearch: number

export declare const kHIDUsage_LED_SoundFieldOn: number

export declare const kHIDUsage_LED_Mute: number

export declare const kHIDUsage_KeyboardRightShift: number

export declare const kHIDUsage_KeyboardLeftGUI: number

export declare const kHIDUsage_KeyboardLeftShift: number

export declare const kHIDUsage_KeyboardClearOrAgain: number

export declare const kHIDUsage_KeyboardCancel: number

export declare const kHIDUsage_KeyboardSysReqOrAttention: number

export declare const kHIDUsage_KeyboardLANG6: number

export declare const kHIDUsage_KeyboardLANG4: number

export declare const kHIDUsage_KeyboardLANG3: number

export declare const kHIDUsage_KeyboardLANG2: number

export declare const kHIDUsage_KeyboardLANG1: number

export declare const kATALogicalSectorAlignmentMask: number

export declare const kHIDUsage_KeyboardInternational9: number

export declare const kHIDUsage_KeyboardInternational8: number

export declare const kHIDUsage_KeyboardInternational6: number

export declare const kHIDUsage_KeyboardInternational5: number

export declare const kHIDUsage_KeypadEqualSignAS400: number

export declare const kHIDUsage_KeyboardLockingScrollLock: number

export declare const kHIDUsage_KeyboardLockingNumLock: number

export declare const kHIDUsage_KeyboardLockingCapsLock: number

export declare const kHIDUsage_KeyboardVolumeDown: number

export declare const kHIDUsage_KeyboardVolumeUp: number

export declare const kHIDUsage_KeyboardMute: number

export declare const kHIDUsage_KeyboardFind: number

export declare const kHIDUsage_KeyboardPaste: number

export declare const kHIDUsage_KeyboardCopy: number

export declare const kHIDUsage_KeyboardUndo: number

export declare const kHIDUsage_KeyboardMenu: number

export declare const kHIDUsage_KeyboardHelp: number

export declare const kHIDUsage_KeyboardF23: number

export declare const kHIDUsage_KeyboardF20: number

export declare const kHIDUsage_KeyboardF17: number

export declare const kDisableVerticalSyncBit: number

export declare const kHIDUsage_KeyboardF16: number

export declare const kHIDUsage_KeyboardF14: number

export declare const kHIDUsage_KeyboardF13: number

export declare const kHIDUsage_KeypadEqualSign: number

export declare const kHIDUsage_KeyboardPower: number

export declare const kHIDUsage_KeyboardNonUSBackslash: number

export declare const kHIDUsage_KeypadPeriod: number

export declare const kHIDUsage_Keypad7: number

export declare const kHIDUsage_Keypad6: number

export declare const kHIDUsage_Keypad4: number

export declare const kHIDUsage_LED_HeadSet: number

export declare const kHIDUsage_Keypad3: number

export declare const kHIDUsage_Keypad2: number

export declare const kHIDUsage_Keypad1: number

export declare const kHIDUsage_KeypadEnter: number

export declare const kHIDUsage_KeypadHyphen: number

export declare const kHIDUsage_KeypadAsterisk: number

export declare const kHIDUsage_KeypadNumLock: number

export declare const kHIDUsage_KeyboardUpArrow: number

export declare const kHIDUsage_KeyboardDownArrow: number

export declare const kHIDUsage_KeyboardLeftArrow: number

export declare const kHIDUsage_KeyboardRightArrow: number

export declare const kHIDUsage_KeyboardEnd: number

export declare const kHIDUsage_KeyboardPageUp: number

export declare const kHIDUsage_KeyboardHome: number

export declare const kHIDUsage_KeyboardInsert: number

export declare const kHIDUsage_KeyboardScrollLock: number

export declare const kHIDUsage_KeyboardF11: number

export declare const kHIDUsage_KeyboardF10: number

export declare const kHIDUsage_KeyboardF9: number

export declare const kHIDUsage_KeyboardF6: number

export declare const kHIDUsage_KeyboardF4: number

export declare const kHIDUsage_KeyboardF2: number

export declare const kHIDUsage_KeyboardCapsLock: number

export declare const kHIDUsage_KeyboardSlash: number

export declare const kHIDUsage_KeyboardComma: number

export declare const kHIDUsage_KeyboardGraveAccentAndTilde: number

export declare const kHIDUsage_KeyboardSemicolon: number

export declare const kMMCCmd_VERIFY_10: number

export declare const kHIDUsage_KeyboardNonUSPound: number

export declare const kHIDUsage_KeyboardHyphen: number

export declare const kHIDUsage_KeyboardTab: number

export declare const kCSRStateStateInitializing: number

export declare const kHIDUsage_KeyboardDeleteOrBackspace: number

export declare const kHIDUsage_Keyboard7: number

export declare const kHIDUsage_Keyboard6: number

export declare const kHIDUsage_Csmr_MenuRight: number

export declare const kHIDUsage_Keyboard3: number

export declare const kHIDUsage_Csmr_TrebleDecrement: number

export declare const kHIDUsage_Keyboard2: number

export declare const kHIDUsage_KeyboardZ: number

export declare const kHIDUsage_KeyboardY: number

export declare const kHIDUsage_KeyboardU: number

export declare const kHIDUsage_KeyboardS: number

export declare const kHIDUsage_KeyboardQ: number

export declare const kHIDUsage_KeyboardP: number

export declare const kHIDUsage_KeyboardO: number

export declare const kHIDUsage_KeyboardM: number

export declare const kHIDUsage_KeyboardK: number

export declare const kHIDUsage_KeyboardJ: number

export declare const kHIDUsage_KeyboardH: number

export declare const kHIDUsage_KeyboardG: number

export declare const cscGetPageBase: number

export declare const kHIDUsage_KeyboardD: number

export declare const kHIDUsage_KeyboardC: number

export declare const kHIDUsage_KeyboardA: number

export declare const kHIDUsage_GenDevControls_BatteryStrength: number

export declare const kHIDUsage_Game_Reserved: number

export declare const kHIDUsage_Game_GamepadFormFitting: number

export declare const kHIDUsage_Game_GamepadFormFitting_Compatibility: number

export declare const kHIDUsage_Game_GunSafety: number

export declare const kHIDUsage_Game_GunBurst: number

export declare const kIOUSBDeviceStatusSelfPowered: number

export declare const kHIDUsage_Game_GunBolt: number

export declare const kHIDUsage_Game_SecondaryFlipper: number

export declare const kHIDUsage_Game_Flipper: number

export declare const kHIDUsage_Game_LeanForwardOrBackward: number

export declare const kHIDUsage_Game_LeanRightOrLeft: number

export declare const kHIDUsage_Game_MoveUpOrDown: number

export declare const kHIDUsage_Game_MoveRightOrLeft: number

export declare const kHIDUsage_Game_TurnRightOrLeft: number

export declare const kHIDUsage_Game_GunDevice: number

export declare const kHIDUsage_Sprt_5Wood: number

export declare const kHIDUsage_Sprt_3Wood: number

export declare const kHIDUsage_Sprt_1Wood: number

export declare const kHIDUsage_Button_174: number

export declare const kHIDUsage_Sprt_SandWedge: number

export declare const kHIDUsage_Sprt_11Iron: number

export declare const kHIDUsage_Sprt_10Iron: number

export declare const kHIDUsage_Sprt_9Iron: number

export declare const kHIDUsage_Sprt_7Iron: number

export declare const kHIDUsage_Sprt_5Iron: number

export declare const kHIDUsage_Snsr_Data_Electrical_Resistance: number

export declare const kHIDUsage_Sprt_4Iron: number

export declare const kHIDUsage_Sprt_StickHeight: number

export declare const kHIDUsage_Sprt_StickType: number

export declare const kHIDUsage_Sprt_Rate: number

export declare const kHIDUsage_BCS_ParameterScanning: number

export declare const kHIDUsage_Sprt_Slope: number

export declare const kHIDUsage_Sprt_RowingMachine: number

export declare const kHIDUsage_VR_StereoEnable: number

export declare const kHIDUsage_VR_Oculometer: number

export declare const kHIDUsage_VR_HeadMountedDisplay: number

export declare const kHIDUsage_MSR_Track2Data: number

export declare const kHIDUsage_VR_HeadTracker: number

export declare const kHIDUsage_VR_Glove: number

export declare const kHIDUsage_VR_Flexor: number

export declare const kHIDUsage_VR_BodySuit: number

export declare const kHIDUsage_VR_Belt: number

export declare const kHIDUsage_Sim_FrontBrake: number

export declare const kHIDUsage_Sim_HandleBars: number

export declare const kHIDUsage_Sim_BicycleCrank: number

export declare const kHIDUsage_Sim_DivePlane: number

export declare const kHIDUsage_Sim_Accelerator: number

export declare const kHIDUsage_Sim_WingFlaps: number

export declare const kHIDUsage_Sim_Trigger: number

export declare const kHIDUsage_Sim_ToeBrake: number

export declare const kHIDUsage_Sim_LandingGear: number

export declare const kHIDUsage_Sim_Throttle: number

export declare const kHIDUsage_Sim_DiveBrake: number

export declare const kHIDUsage_Sim_CollectiveControl: number

export declare const kMMCCmd_FORMAT_UNIT: number

export declare const kHIDUsage_Sim_ChaffRelease: number

export declare const kHIDUsage_Sim_AutopilotEnable: number

export declare const kSCSICmd_GET_PERFORMANCE: number

export declare const kHIDUsage_Sim_AntiTorqueControl: number

export declare const kHIDUsage_Sim_AileronTrim: number

export declare const kHIDUsage_Sim_Aileron: number

export declare const kHIDUsage_Sim_CyclicTrim: number

export declare const kHIDUsage_Sim_CyclicControl: number

export declare const kHIDUsage_Sim_FlightControlStick: number

export declare const kHIDUsage_Sim_BicycleSimulationDevice: number

export declare const kHIDUsage_Sim_HelicopterSimulationDevice: number

export declare const kHIDUsage_Sim_SubmarineSimulationDevice: number

export declare const kHIDUsage_Sim_FlightSimulationDevice: number

export declare const kHIDUsage_GD_CallActiveLED: number

export declare const kHIDUsage_GD_DockableDevicePrimaryUsageID: number

export declare const kHIDUsage_GD_DockableDeviceVendorID: number

export declare const kSCSICmd_WRITE_SAME_16: number

export declare const kHIDUsage_GD_ControlEnable: number

export declare const kHIDUsage_GD_SystemDisplayRotationLockSliderSwitch: number

export declare const kHIDUsage_GD_ChassisEnclosure: number

export declare const kHIDUsage_GD_CoolantCriticalLevel: number

export declare const kHIDUsage_GD_SensorZone: number

export declare const kHIDUsage_GD_SystemDisplayToggleLCDAutoscale: number

export declare const kHIDUsage_GD_SystemDisplayDual: number

export declare const kHIDUsage_GD_SystemDisplayBoth: number

export declare const kHIDUsage_GD_SystemDisplayExternal: number

export declare const kHIDUsage_GD_SystemDisplayInternal: number

export declare const kHIDUsage_GD_SystemHibernate: number

export declare const kHIDUsage_GD_ApplicationDebuggerBreak: number

export declare const kHIDUsage_GD_ApplicationBreak: number

export declare const kHIDUsage_GD_SystemDebuggerBreak: number

export declare const kHIDUsage_GD_SystemSetup: number

export declare const kHIDUsage_GD_SystemUndock: number

export declare const kHIDUsage_GD_SystemDock: number

export declare const kHIDUsage_GD_SystemDismissNotification: number

export declare const kHIDUsage_GD_SFShiftLockIndicator: number

export declare const kHIDUsage_GD_SFShiftLock: number

export declare const kHIDUsage_GD_PalmTrigger: number

export declare const kHIDUsage_GD_IndexTrigger: number

export declare const kHIDUsage_GD_DPadLeft: number

export declare const kHIDUsage_GD_DPadRight: number

export declare const kHIDUsage_GD_DPadUp: number

export declare const kHIDUsage_GD_SystemMenuDown: number

export declare const kHIDUsage_GD_SystemMenuUp: number

export declare const kHIDUsage_GD_SystemMenuRight: number

export declare const kHIDUsage_GD_SystemContextMenu: number

export declare const kHIDUsage_GD_SystemSleep: number

export declare const kHIDUsage_GD_SystemPowerDown: number

export declare const kHIDUsage_GD_SystemControl: number

export declare const kHIDUsage_GD_Qw: number

export declare const kSSCPrinterCmd_MODE_SENSE_6: number

export declare const kHIDUsage_GD_Qy: number

export declare const kHIDUsage_Snsr_Data_Location_Latitude: number

export declare const kHIDUsage_GD_Qx: number

export declare const kHIDUsage_GD_FeatureNotification: number

export declare const kHIDUsage_GD_Vno: number

export declare const kHIDUsage_GD_Vbrx: number

export declare const kHIDUsage_GD_Vz: number

export declare const kHIDUsage_GD_Vx: number

export declare const kHIDUsage_GD_MotionWakeup: number

export declare const kHIDUsage_GD_ByteCount: number

export declare const kHIDUsage_GD_CountedBuffer: number

export declare const kHIDUsage_GD_Wheel: number

export declare const kHIDUsage_Sim_Reserved: number

export declare const kHIDUsage_GD_Slider: number

export declare const kHIDUsage_GD_Rz: number

export declare const kHIDUsage_GD_Rx: number

export declare const kHIDUsage_GD_Z: number

export declare const kHIDUsage_GD_X: number

export declare const kHIDUsage_GD_SpatialController: number

export declare const kHIDUsage_GD_SystemMultiAxisController: number

export declare const kHIDUsage_GD_TabletPCSystemControls: number

export declare const kHIDUsage_GD_Keypad: number

export declare const kHIDUsage_GD_Keyboard: number

export declare const kHIDUsage_GD_Joystick: number

export declare const kHIDUsage_GD_Mouse: number

export declare const kHIDUsage_GD_Pointer: number

export declare const kHIDUsage_Undefined: number

export declare const kHIDPage_FIDO: number

export declare const kHIDPage_CameraControl: number

export declare const kHIDPage_MagneticStripeReader: number

export declare const kHIDPage_WeighingDevice: number

export declare const kHIDPage_PowerReserved2: number

export declare const kHIDPage_PowerReserved: number

export declare const kHIDPage_MonitorReserved: number

export declare const kSBCWOCmd_MOVE_MEDIUM: number

export declare const kHIDPage_MonitorEnumerated: number

export declare const kHIDPage_Sensor: number

export declare const kHIDPage_AlphanumericDisplay: number

export declare const kHIDPage_Unicode: number

export declare const kHIDPage_Haptics: number

export declare const kHIDPage_Digitizer: number

export declare const kHIDPage_Game: number

export declare const kHIDPage_GenericDesktop: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkProtocol: number

export declare const kIOGraphicsEngineContextVersion: number

export declare const kIOGraphicsEngineContext: number

export declare const kIODisplayNoProductName: number

export declare const kIODisplayOnlyPreferredName: number

export declare const kIOFBCursorMemory: number

export declare const kIOFBShmemCursorNumFramesShift: number

export declare const kIOFBShmemCursorNumFramesMask: number

export declare const kIOFBTenPtOneShmemVersion: number

export declare const kIOFBHardwareCursorInVRAM: number

export declare const kIOFBHardwareCursorActive: number

export declare const kIOFBCursorHWCapable: number

export declare const kIOFBCursorImageNew: number

export declare const kIOFBMaxCursorFrames: number

export declare const kIOFBMaxCursorWidth: number

export declare const kIOFBNumCursorFrames: number

export declare const kIOBlitAllOptions: number

export declare const kIOBlitBeamSyncSpin: number

export declare const kIOBlitBeamSyncAlways: number

export declare const kRangeSupportsSignal_1000_0400_Bit: number

export declare const kIOBlitBeamSync: number

export declare const kIOBlitSurfaceDestination: number

export declare const kFWBIBNodeUniqueIDLoAddress: number

export declare const kHIDUsage_BS_SerialNumber: number

export declare const kIOBlitUnlockWithSwap: number

export declare const kIOBlitBeamSyncSwaps: number

export declare const kIOBlitHasCGSSurface: number

export declare const kIOBlitFlushWithSwap: number

export declare const kIOBlitWaitCheck: number

export declare const kIOBlitWaitAll2D: number

export declare const kIOBlitSynchronizeFlushHostWrites: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedMantissaPhase: number

export declare const kIO128RGBAFloatPixelFormat: number

export declare const kIO64RGBAFloatPixelFormat: number

export declare const kIO16LE4444PixelFormat: number

export declare const kIO2vuyPixelFormat: number

export declare const kIOYVYU422PixelFormat: number

export declare const kHIDUsage_FIDO_U2FDevice: number

export declare const kIOYUV411PixelFormat: number

export declare const kIOYVU9PixelFormat: number

export declare const kIOYUVSPixelFormat: number

export declare const kIO24BGRPixelFormat: number

export declare const kIO16LE565PixelFormat: number

export declare const kIO16LE5551PixelFormat: number

export declare const kIO16LE555PixelFormat: number

export declare const kIO8IndexedPixelFormat: number

export declare const kIO2IndexedPixelFormat: number

export declare const kIO1MonochromePixelFormat: number

export declare const kIOBlitSourcePattern: number

export declare const kIOBlitSourceOOLMemory: number

export declare const kIOBlitHighlightOperation: number

export declare const kIOBlitXorOperation: number

export declare const kIOBlitCopyOperation: number

export declare const kIOBlitTypeOperationType0: number

export declare const kIOBlitTypeOperationShift: number

export declare const kIOBlitTypeOperationMask: number

export declare const kIOBlitTypeSourceKeyColorEqual: number

export declare const kIOBlitTypeDestKeyColorModeMask: number

export declare const kIOBlitTypeSourceKeyColorModeMask: number

export declare const kIOBlitTypeScale: number

export declare const kIOBlitTypeColorSpaceConvert: number

export declare const kIOBlitTypeMonoExpand: number

export declare const kIOBlitTypeHideCursor: number

export declare const kIOBlitTypeMoveCursor: number

export declare const kIOBlitTypeCopyRegion: number

export declare const kIOBlitTypeScanlines: number

export declare const kIOBlitTypeRects: number

export declare const kIOBlitTypeVerbMask: number

export declare const kIOAccelPrivateID: number

export declare const kIOAccelVolatileSurface: number

export declare const kIOAudioChannelLabel_Discrete_65535: number

export declare const kHIDUsage_Csmr_ACBold: number

export declare const kIOAudioChannelLabel_Discrete_14: number

export declare const kIOAudioChannelLabel_Discrete_13: number

export declare const kIOAudioChannelLabel_Discrete_12: number

export declare const kIOAudioChannelLabel_Discrete_11: number

export declare const kIOAudioChannelLabel_Discrete_10: number

export declare const kIOAudioChannelLabel_Discrete_8: number

export declare const kIOAudioChannelLabel_Discrete_7: number

export declare const kIOAudioChannelLabel_Discrete_5: number

export declare const kIOAudioChannelLabel_Discrete_4: number

export declare const kIOAudioChannelLabel_Discrete_3: number

export declare const kIOAudioChannelLabel_Discrete_2: number

export declare const kIOAudioChannelLabel_Discrete_1: number

export declare const kIOAudioChannelLabel_Discrete: number

export declare const kIOAudioChannelLabel_ForeignLanguage: number

export declare const kUSBFeatureU1Enable: number

export declare const kIOAudioChannelLabel_ClickTrack: number

export declare const kIOAudioChannelLabel_HeadphonesRight: number

export declare const kIOAudioChannelLabel_HeadphonesLeft: number

export declare const kIOAudioChannelLabel_XY_Y: number

export declare const kIOAudioChannelLabel_XY_X: number

export declare const kMMCDeviceTrayMask: number

export declare const kIOAudioChannelLabel_MS_Side: number

export declare const kIOAudioChannelLabel_MS_Mid: number

export declare const kSSCSeqCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kIOAudioChannelLabel_Ambisonic_Z: number

export declare const kIOAudioChannelLabel_Ambisonic_Y: number

export declare const kIOAudioChannelLabel_CenterTopRear: number

export declare const kIOAudioChannelLabel_CenterTopMiddle: number

export declare const kIOAudioChannelLabel_LeftTopMiddle: number

export declare const kIOAudioChannelLabel_RightTopFront: number

export declare const kIOPMUnidleDevice: number

export declare const kIOAudioChannelLabel_CenterTopFront: number

export declare const kHIDUsage_KeyboardI: number

export declare const kIOAudioChannelLabel_Haptic: number

export declare const kIOAudioChannelLabel_Mono: number

export declare const kIOAudioChannelLabel_Narration: number

export declare const kIOAudioChannelLabel_HearingImpaired: number

export declare const kIOHIDSetGlobalEventFlags: number

export declare const kIOAudioChannelLabel_RightTotal: number

export declare const kIOAudioChannelLabel_LeftTotal: number

export declare const kIOAudioChannelLabel_LFE2: number

export declare const kIOAudioChannelLabel_RightWide: number

export declare const kIOAudioChannelLabel_RearSurroundRight: number

export declare const kIOAudioChannelLabel_RearSurroundLeft: number

export declare const kIOAudioChannelLabel_VerticalHeightRight: number

export declare const kIOAudioChannelLabel_VerticalHeightCenter: number

export declare const kIOAudioChannelLabel_VerticalHeightLeft: number

export declare const kIOAudioChannelLabel_TopCenterSurround: number

export declare const kIOAudioChannelLabel_RightSurroundDirect: number

export declare const kIOAudioChannelLabel_LeftSurroundDirect: number

export declare const kIOAudioChannelLabel_RightCenter: number

export declare const kIOAudioChannelLabel_RightSurround: number

export declare const kIOAudioChannelLabel_LFEScreen: number

export declare const kHIDUsage_Button_248: number

export declare const kIOAudioChannelLabel_Right: number

export declare const kIOAudioChannelLabel_Left: number

export declare const kIOAudioChannelLabel_UseCoordinates: number

export declare const kIOAudioChannelLabel_Unused: number

export declare const kIOAudioChannelLabel_Unknown: number

export declare const PROCESSOR_GENERAL: number

export declare const kHIDUsage_Csmr_SubChannelDecrement: number

export declare const PROCESSOR_UNDEFINED: number

export declare const EMBEDDED_DSS_AUDIO: number

export declare const EMBEDDED_CABLE_TUNER_AUDIO: number

export declare const EMBEDDED_TV_TUNER_AUDIO: number

export declare const EMBEDDED_VIDEO_DISC_AUDIO: number

export declare const kHIDUsage_BCS_Wand: number

export declare const EMBEDDED_PHONOGRAPH: number

export declare const EMBEDDED_ANALOG_TAPE: number

export declare const EMBEDDED_DAT: number

export declare const EMBEDDED_LEVEL_CALIBRATION_NOISE_SOURCE: number

export declare const EXTERNAL_ADAT: number

export declare const EXTERNAL_1394_DV_STREAM_SOUNDTRACK: number

export declare const kIOUSBDeviceStatusU1Enable: number

export declare const EXTERNAL_1394_DA_STREAM: number

export declare const kHIDUsage_Csmr_Eject: number

export declare const EXTERNAL_LEGACY_AUDIO_CONNECTOR: number

export declare const EXTERNAL_LINE_CONNECTOR: number

export declare const EXTERNAL_ANALOG_CONNECTOR: number

export declare const EXTERNAL_UNDEFINED: number

export declare const kHIDUsage_Button_153: number

export declare const BIDIRECTIONAL_ECHO_SUPPRESSING_SPEAKERPHONE: number

export declare const BIDIRECTIONAL_SPEAKERPHONE_NO_ECHO_REDX: number

export declare const BIDIRECTIONAL_HANDSET: number

export declare const BIDIRECTIONAL_UNDEFINED: number

export declare const kHIDUsage_Keyboard1: number

export declare const OUTPUT_COMMUNICATION_SPEAKER: number

export declare const OUTPUT_ROOM_SPEAKER: number

export declare const OUTPUT_DESKTOP_SPEAKER: number

export declare const OUTPUT_HEADPHONES: number

export declare const OUTPUT_SPEAKER: number

export declare const OUTPUT_UNDEFINED: number

export declare const INPUT_PROCESSING_MICROPHONE_ARRAY: number

export declare const INPUT_MICROPHONE_ARRAY: number

export declare const kSMCCmd_REQUEST_VOLUME_ELEMENT_ADDRESS: number

export declare const INPUT_OMNIDIRECTIONAL_MICROPHONE: number

export declare const kIOAudioDeviceTransportTypeHdmi: number

export declare const kIOAudioDeviceTransportTypeDisplayPort: number

export declare const kIOAudioDeviceTransportTypeOther: number

export declare const kIOAudioDeviceTransportTypeWireless: number

export declare const kUSBApplicationSpecificInterfaceClass: number

export declare const kIOAudioDeviceTransportTypeNetwork: number

export declare const kHIDUsage_Button_77: number

export declare const kIOAudioDeviceTransportTypePCI: number

export declare const kIOAudioDeviceTransportTypeBuiltIn: number

export declare const kIOAudioBuiltInSystemClockDomain: number

export declare const kIOAudioLevelControlNegativeInfinity: number

export declare const kIOAudioClockSelectorTypeOther: number

export declare const kIOAudioClockSelectorTypeControl: number

export declare const kHIDUsage_MSR_Track2Length: number

export declare const kIOAudioClockSelectorTypeVideo: number

export declare const kIOAudioClockSelectorTypeSMPTE: number

export declare const kIOAudioClockSelectorTypeADATOptical: number

export declare const kRSCOne: number

export declare const kIOAudioClockSelectorTypeAESEBU: number

export declare const kIOAudioClockSelectorTypeInternal: number

export declare const kIOAudioStreamNumericRepresentationUnsignedInt: number

export declare const kIOAudioStreamNumericRepresentationSignedInt: number

export declare const kIOAudioStreamSampleFormatTimeCode: number

export declare const kIOAudioStreamSampleFormat1937MPEG2: number

export declare const kIOAudioStreamSampleFormat1937MPEG1: number

export declare const kIOAudioStreamSampleFormatAC3: number

export declare const kIOAudioStreamSampleFormatMPEG: number

export declare const kIOAudioSelectorControlSelectionValueLine: number

export declare const kIOAudioSelectorControlSelectionValueInternalMicrophone: number

export declare const kIOAudioSelectorControlSelectionValueHeadphones: number

export declare const kIOAudioSelectorControlSelectionValueExternalSpeaker: number

export declare const kIOAudioControlChannelIDDefaultSurroundLeft: number

export declare const kIOAudioControlChannelIDDefaultRearCenter: number

export declare const kIOAudioControlChannelIDDefaultFrontRightCenter: number

export declare const kIOAudioControlChannelIDDefaultSub: number

export declare const kIOAudioControlChannelIDDefaultRightRear: number

export declare const kIOAudioControlChannelIDDefaultCenter: number

export declare const kIOAudioControlChannelIDDefaultLeft: number

export declare const kIOAudioControlChannelNumberInactive: number

export declare const kIOAudioControlUsagePassThru: number

export declare const kIOAudioControlUsageOutput: number

export declare const kIOAudioSelectorControlSubTypeChannelLevelInstrumentLevel: number

export declare const kIOAudioSelectorControlSubTypeChannelLevelMicLevel: number

export declare const kIOAudioSelectorControlSubTypeChannelLevelMinus10dBV: number

export declare const kIOAudioSelectorControlSubTypeChannelLevelPlus4dBu: number

export declare const kIOAudioSelectorControlSubTypeDestination: number

export declare const kIOAudioSelectorControlSubTypeInput: number

export declare const kIOAudioSelectorControlSubTypeOutput: number

export declare const kIOAudioToggleControlSubTypePhantomPower: number

export declare const kIOAudioToggleControlSubTypeiSubAttach: number

export declare const kIOAudioToggleControlSubTypeLFEMute: number

export declare const kIOAudioToggleControlSubTypeSolo: number

export declare const kHIDUsage_GD_WirelessRadioButton: number

export declare const kIOAudioLevelControlSubTypePRAMVolume: number

export declare const kHIDUsage_Keypad9: number

export declare const kIOAudioLevelControlSubTypeVolume: number

export declare const kIOAudioControlTypeJack: number

export declare const kHIDPage_GenericDeviceControls: number

export declare const kIOAudioInputPortSubTypeSPDIF: number

export declare const kIOAudioInputPortSubTypeCD: number

export declare const kHIDUsage_Sim_Weapons: number

export declare const kIOAudioInputPortSubTypeExternalMicrophone: number

export declare const kIOAudioInputPortSubTypeInternalMicrophone: number

export declare const kIOAudioOutputPortSubTypeSPDIF: number

export declare const kIOAudioOutputPortSubTypeLine: number

export declare const kIOAudioOutputPortSubTypeHeadphones: number

export declare const kIOAudioOutputPortSubTypeInternalSpeaker: number

export declare const kIOAudioPortTypeProcessing: number

export declare const kHIDUsage_BD_BrailleTopControls: number

export declare const kIOAudioPortTypeOutput: number

export declare const kIOAudioDeviceCanBeDefaultOutput: number

export declare const kIOAudioDeviceCanBeDefaultInput: number

export declare const kIOAudioTimeStampSMPTETimeValid: number

export declare const kIOAudioTimeStampHostTimeValid: number

export declare const kIOAudioTimeStampSampleTimeValid: number

export declare const kIOAudioSMPTETimeType50: number

export declare const kIOAudioSMPTETimeType5994: number

export declare const kIOAudioSMPTETimeType30: number

export declare const kIOAudioSMPTETimeType25: number

export declare const kOSClassCanRemote: number

export declare const kIORPCMessageDeepSerialization: number

export declare const kMMCCmd_GET_PERFORMANCE: number

export declare const kIORPCMessageOnqueue: number

export declare const kIORPCMessageObjectRefs: number

export declare const kIORPCMessageLocalHost: number

export declare const kIORPCMessageRemote: number

export declare const kIORPCVersion190615Reply: number

export declare const kIOCatalogModuleTerminate: number

export declare const kIOCatalogModuleUnload: number

export declare const kIOCatalogGetROMMkextList: number

export declare const kIOCatalogGetCacheMissList: number

export declare const kIOCatalogGetModuleDemandList: number

export declare const kIOCatalogGetContents: number

export declare const kIOCatalogResetDriversNoMatch: number

export declare const kHIDNoInterfaceProtocol: number

export declare const kIOCatalogKextdFinishedLaunching: number

export declare const kHIDUsage_KeyboardBackslash: number

export declare const kIOCatalogStartMatching__Removed: number

export declare const kIOCFSerializeToBinary: number

export declare const kMMCCmd_READ_DISC_INFORMATION: number

export declare const kUSBScrollLockKey: number

export declare const mPlaneBytes: number

export declare const kHIDUsage_GD_WirelessRadioLED: number

export declare const kIOMediumOptionHalfDuplex: number

export declare const cscGrayPage: number

export declare const kSGCCmd_MODE_SELECT_10: number

export declare const kHIDUsage_Tfon_PhoneKey5: number

export declare const kATAIdentifyCurrentSectors: number

export declare const kSCSICmd_PREVENT_ALLOW_MEDIUM_REMOVAL: number

export declare const kHIDUsage_BD_BrailleLeftControls: number

export declare const kSSCSeqCmd_REPORT_LUNS: number

export declare const kUSB150mAAvailable: number

export declare const kHIDUsage_BCS_EnableCheckDigitTransmit: number

export declare const kHIDUsage_Sprt_LoftWedge: number

export declare const kSSCSeqCmd_COMPARE: number

export declare const kHIDUsage_BD_BrailleKeyboardDot8: number

export declare const kIOI2CBusTypeI2C: number

export declare const kHIDUsage_Keyboard9: number

export declare const kIOAudioControlTypeLevel: number

export declare const kHIDUsage_VR_Reserved: number

export declare const kSCSICmd_XPWRITE: number

export declare const kUSBAnyDesc: number

export declare const kIOPMDriverAssertionForceWakeupBit: number

export declare const kIOUSBLinkSpeed40Gbps: number

export declare const kHIDUsage_PID_MoveLength: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkReservedPhase: number

export declare const kHIDUsage_Tfon_PhoneKey4: number

export declare const EMBEDDED_RADIO_TRANSMITTER: number

export declare const kATAWriteCacheEnabledBit: number

export declare const kHIDUsage_Snsr_Property_Minimum: number

export declare const kSPCProcCmd_READ_BUFFER: number

export declare const kSPCCmd_SEND_DIAGNOSTICS: number

export declare const kHIDUsage_Snsr_Event_SensorState_Initializing: number

export declare const kHIDUsage_Csmr_ChannelFront: number

export declare const kHIDUsage_Csmr_MediaSelectWWW: number

export declare const kHIDUsage_BS_ThermistorHot: number

export declare const kINQUIRY_Page83_ProtocolIdentifierValidMask: number

export declare const kHIDUsage_KeyboardErrorUndefined: number

export declare const kHIDUsage_BCS_Aiming_PointerMide: number

export declare const kSPCProcCmd_RESERVE_6: number

export declare const kModeNotResize: number

export declare const kHIDUsage_Snsr_Property_ConnectionType_Attached: number

export declare const kHIDUsage_PID_FadeTime: number

export declare const kHIDUsage_Snsr_Property_Light: number

export declare const kHIDUsage_Csmr_ACCollapseAll: number

export declare const kHIDUsage_Snsr_Data_Location_DifferentialGPSDataAge: number

export declare const kFWIsochSyPhase: number

export declare const kATAIdentifyExtendedInfoSupport: number

export declare const kHIDUsage_PID_RAM_PoolAvailable: number

export declare const kSBCCmd_RESERVE_10: number

export declare const kHIDUsage_Button_39: number

export declare const kHIDUsage_Sim_ElevatorTrim: number

export declare const kHIDUsage_Snsr_Data_Time_DayOfWeekTuesday: number

export declare const kIO24RGBPixelFormat: number

export declare const kCSRMessageRequestAddress: number

export declare const kCSRArgumentHiAddress: number

export declare const kHIDUsage_BS_BatteryPresent: number

export declare const kHIDUsage_Snsr_Data_Orientation_Quaternion: number

export declare const kHIDUsage_Csmr_SelectDisc: number

export declare const kHIDUsage_KeyboardF24: number

export declare const kINQUIRY_Byte3_HISUP_Mask: number

export declare const kUSBPeriodicInterruptUsageType: number

export declare const kHIDUsage_Csmr_ACRedoOrRepeat: number

export declare const EXTERNAL_DIGITAL_AUDIO_INTERFACE: number

export declare const kConfigRootDirectoryKey: number

export declare const kHIDUsage_Dig_Digitizer: number

export declare const kMMCCmd_READ_CD: number

export declare const kHIDRtOutputReport: number

export declare const kIOBlitSourceOOLPattern: number

export declare const IOPMClockNormal: number

export declare const mDevType: number

export declare const kSENSE_RESPONSE_CODE_Mask: number

export declare const kINQUIRY_Page83_IdentifierTypeMask: number

export declare const kHIDUsage_Button_68: number

export declare const kHIDUsage_Csmr_ALControlPanel: number

export declare const kHIDUsage_Button_215: number

export declare const kSCSICmd_PREFETCH_16: number

export declare const kIOAudioClockSelectorTypeADAT9Pin: number

export declare const kHIDUsage_BCS_CommitParametersToNVM: number

export declare const kHIDUsage_BCS_TriggerModeLaserStaysOnAfterTriggerRelease: number

export declare const kSGCCmd_RELEASE_6: number

export declare const kHIDUsage_BS_RemainingTimeLimitExpired: number

export declare const IOPMAckImplied: number

export declare const kMMCCmd_READ_FORMAT_CAPACITIES: number

export declare const kHIDUsage_Snsr_Motion_Speedometer: number

export declare const kHIDUsage_PD_LowVoltageTransfer: number

export declare const kSCSICmd_XDWRITE: number

export declare const kBuiltInConnection: number

export declare const kHIDUsage_Snsr_Data_Orientation_HeadingXAxis: number

export declare const kIONetworkFeatureHWTimeStamp: number

export declare const kIONetworkLinkActive: number

export declare const kHIDUsage_Csmr_ALCalendarOrSchedule: number

export declare const kHIDUsage_Snsr_Mechanical_Strain: number

export declare const kHIDUsage_Csmr_ContactEmailBusiness: number

export declare const kIOVideoFeatureControlClassIDPowerLineFrequency: number

export declare const kSCSICmd_ERASE_12: number

export declare const kHIDUsage_Dig_Height: number

export declare const kREAD_CAPACITY_PROT_Enabled: number

export declare const kDisplayModeIDReservedBase: number

export declare const kHIDUsage_Snsr_Property_ConnectionType: number

export declare const kHIDUsage_Button_81: number

export declare const kIO2IndexedGrayPixelFormat: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkDirectionRx: number

export declare const kHIDUsage_KeyboardOpenBracket: number

export declare const kSyncFrame: number

export declare const kIOMediumEthernet100BaseFX: number

export declare const kSCSICmd_LOAD_UNLOAD_MEDIUM: number

export declare const kHIDUsage_PD_HighVoltageTransfer: number

export declare const kHIDPage_MonitorVirtual: number

export declare const cscGetDDCBlock: number

export declare const kHIDUsage_AD_FontData: number

export declare const kATAIdentifyCurrentHeads: number

export declare const kINQUIRY_Byte3_AERC_Bit: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkReserved: number

export declare const timingVESA_1600x1200_65hz: number

export declare const kHIDUsage_BCS_MirrorSpeedControl: number

export declare const kSBCModePageCaching_FSW_Bit: number

export declare const kHIDUsage_PD_ActivePower: number

export declare const kHIDUsage_Csmr_KeyboardInputAssistAccept: number

export declare const kPowerStateFullPower: number

export declare const kHIDUsage_Button_116: number

export declare const kHIDUsage_Csmr_MediaSelectCable: number

export declare const kUSBATMNetworkingSubClass: number

export declare const kHIDUsage_AD_CharacterReport: number

export declare const kSCSIProtocolIdentifier_SSA: number

export declare const kSPCProcCmd_LOG_SELECT: number

export declare const kConfigNodeMemoryExtentKey: number

export declare const kHIDUsage_Csmr_ACDemote: number

export declare const kHIDUsage_Csmr_AMOrPM: number

export declare const cscSetHardwareCursor: number

export declare const kUSPrintingClassGePortStatus: number

export declare const kUSBFeatureDeviceRemoteWakeup: number

export declare const kIOPMSleep: number

export declare const kHIDUsage_Tfon_PhoneDirectory: number

export declare const kHIDUsage_Snsr_Property_PowerState_Undefined: number

export declare const kHIDUsage_BCS_PolarityNormalBarCode: number

export declare const kHIDUsage_BCS_CheckEnable4DigitPrice: number

export declare const kIOAudioDeviceTransportTypeVirtual: number

export declare const kHIDUsage_Dig_ContactCount: number

export declare const kSCCCmd_REPORT_LUNS: number

export declare const kIOBlitTypeCopyRects: number

export declare const kUSBCompositeSubClass: number

export declare const kHIDUsage_PID_Normal: number

export declare const kHIDUsage_Snsr_Property_Resolution: number

export declare const kHIDRqGetIdle: number

export declare const kIOPMClosedClamshell: number

export declare const IOPMPowerOn: number

export declare const kHIDUsage_Snsr_Data_Mechanical_BooleanSwitchArrayStates: number

export declare const kFWMaxNodesPerBus: number

export declare const kIOAudioSelectorControlSubTypeClockSource: number

export declare const kHIDUsage_GD_SystemMenuSelect: number

export declare const kConfigNodeVendorIdKey: number

export declare const kSSCPrinterCmd_RECOVER_BUFFERED_DATA: number

export declare const kHIDUsage_BCS_CheckDigitEnableInterleaved2of5USS: number

export declare const kHIDUsage_GD_SystemSpeakerMute: number

export declare const kHIDUsage_LED_Compose: number

export declare const kSBCModePageCaching_ABPF_Bit: number

export declare const kIOAudioTimeStampWordClockTimeValid: number

export declare const kSBCCmd_LOCK_UNLOCK_CACHE: number

export declare const IOPMNotAttainable: number

export declare const kIOUSBEndpointDescriptorTransferTypeBulk: number

export declare const kHIDUsage_LED_LowCutFilter: number

export declare const kSPCCmd_COPY_AND_VERIFY: number

export declare const kHIDUsage_KeyboardLeftControl: number

export declare const kHIDPage_Simulation: number

export declare const kDigitalSignalMask: number

export declare const kIOPSFamilyCodeUSBUnknown: number

export declare const kConfigUnitDependentInfoKey: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkAsymmetric: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkLSEKbits: number

export declare const kIORPCMessageSimpleReply: number

export declare const kSBCWOCmd_REASSIGN_BLOCKS: number

export declare const kHIDUsage_PID_CustomForceDataOffset: number

export declare const kIOBlitReferenceSource: number

export declare const kUSBPrintingInterfaceClass: number

export declare const kIOAudioSelectorControlSelectionValueExternalMicrophone: number

export declare const kFWBIBCycClkAcc: number

export declare const timingVESA_640x480_60hz: number

export declare const kHIDUsage_PID_DC_StopAllEffects: number

export declare const kDCLSendPacketOp: number

export declare const kHIDUsage_Csmr_ACMirrorVertical: number

export declare const kIOHIDSetCursorPosition: number

export declare const kMMCCmd_MODE_SELECT_10: number

export declare const kHIDUsage_Sprt_StickFollowThrough: number

export declare const kHIDUsage_Game_RollRightOrLeft: number

export declare const kDVDFeaturesRandomWriteableMask: number

export declare const kHIDUsage_BCS_LaserOnTime: number

export declare const kATAIdentifyLBACapacity: number

export declare const kMirrorHAlignCenterMirrorMask: number

export declare const kHIDUsage_Snsr_Electrical_Current: number

export declare const kHIDUsage_LED_PaperOut: number

export declare const kHIDUsage_PD_ChangedStatus: number

export declare const kIORPCMessageIDKernel: number

export declare const kHIDUsage_PID_DeadBand: number

export declare const kIOVideoFeatureControlClassIDExposure: number

export declare const kMMCCmd_READ_TOC_PMA_ATIP: number

export declare const kHIDUsage_LED_SendCalls: number

export declare const kIOI2CBusTypeDisplayPort: number

export declare const kSPCCmd_INQUIRY: number

export declare const kHIDUsage_Csmr_ACKeyboardLayoutSelect: number

export declare const kHIDUsage_LED_SlowBlinkOffTime: number

export declare const kHIDUsage_BCS_UPC_EAN: number

export declare const kSCSICmd_CLOSE_TRACK_SESSION: number

export declare const kSBCModePageFlexibleDisk_MO_Bit: number

export declare const kHIDUsage_BS_DesignCapacity: number

export declare const kHIDUsage_BCS_RawScannedDataReport: number

export declare const kSCSICmd_MODE_SELECT_10: number

export declare const kHIDUsage_Csmr_ALLANOrWANBrowser: number

export declare const kRangeSupportsSeperateSyncsBit: number

export declare const kSBCWOCmd_SEARCH_DATA_LOW_10: number

export declare const kIOAudioControlChannelIDDefaultLeftRear: number

export declare const BIDIRECTIONAL_ECHO_CANCELING_SPEAKERPHONE: number

export declare const kUSBAsynchronousIsocSyncType: number

export declare const kHIDUsage_LED_Power: number

export declare const kMMCCmd_SEARCH_DATA_HIGH_10: number

export declare const kCSRClockValueHiAddress: number

export declare const kFWCSRStateCMstr: number

export declare const kSCSICmd_MODE_SELECT_6: number

export declare const kCSRTestStartAddress: number

export declare const kSCSIServiceAction_GET_LBA_STATUS: number

export declare const kHIDUsage_Csmr_ALCheckbookOrFinance: number

export declare const kHIDUsage_Csmr_ACDesktopShowAllWindows: number

export declare const kUSBMaxHSIsocFrameCount: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkMinSpeedId: number

export declare const kHIDUsage_LED_FastBlinkOffTime: number

export declare const kHIDUsage_Game_PointofView: number

export declare const kHIDUsage_Snsr_Undefined: number

export declare const kDPMSSyncOff: number

export declare const kScaleStretchOnlyMask: number

export declare const kUSBEndpointTransferTypeUCMask: number

export declare const kINQUIRY_PERIPHERAL_TYPE_ProcessorSPCDevice: number

export declare const kSMCCmd_PERSISTENT_RESERVE_IN: number

export declare const kHIDUsage_Snsr_Property_PowerState_D3_Sleep: number

export declare const kHIDUsage_MSR_TrackJISLength: number

export declare const kHIDUsage_Tfon_Phone: number

export declare const kHIDUsage_Snsr_Orientation_DistanceD: number

export declare const kHIDUsage_LED_Stereo: number

export declare const kHIDUsage_Sim_FlareRelease: number

export declare const kHIDUsage_Button_173: number

export declare const kINQUIRY_PERIPHERAL_TYPE_OpticalCardReaderOCRWDevice: number

export declare const kHIDUsage_PD_PowerSummaryID: number

export declare const kIOMediumIEEE80211DS1: number

export declare const kHIDUsage_Button_3: number

export declare const kIOMediumEthernet: number

export declare const kHIDUsage_Csmr_ACInsertFile: number

export declare const kMirrorVAlignCenterMirrorMask: number

export declare const kIOMediumEthernet1000BaseCX: number

export declare const kIOAudioSelectorControlSubTypeChannelLevelMinus20dBV: number

export declare const kHIDUsage_Csmr_ACGoTo: number

export declare const cscGetEntries: number

export declare const kHIDUsage_WD_ScaleScaleClassIMetricCL: number

export declare const kHIDUsage_BS_InternalChargeController: number

export declare const kHIDUsage_Button_58: number

export declare const kIOVideoFeatureControlClassIDPan: number

export declare const kHIDUsage_GD_Qz: number

export declare const kIOPSFamilyCodeUSBChargingPortDownstream: number

export declare const cscGetPageCnt: number

export declare const kHIDUsage_Snsr_Motion_Gyrometer: number

export declare const kSCSICmd_STOP_PLAY_SCAN: number

export declare const kSecondDepthMode: number

export declare const kPMSetProcessorSpeed: number

export declare const kHIDUsage_KeyboardInternational3: number

export declare const kIONetworkLinkNoNetworkChange: number

export declare const kIOCatalogRemoveKernelLinker__Removed: number

export declare const kHIDUsage_BCS_Code128: number

export declare const kMMCCmd_PLAY_AUDIO_TRACK_INDEX: number

export declare const kIOSystemLoadAdvisoryLevelGreat: number

export declare const kHIDUsage_Button_241: number

export declare const kExtFieldsValidMask: number

export declare const kSCSICmd_READ_12: number

export declare const kIOAudioSMPTETimeRunning: number

export declare const kSCSICmd_PLAY_CD: number

export declare const kUSBRqGetDescriptor: number

export declare const kHIDUsage_Button_108: number

export declare const kINQUIRY_Page83_AssociationMask: number

export declare const kRangeSupportsCompositeSyncMask: number

export declare const kHIDUsage_Csmr_ACPrintPreview: number

export declare const kSBCCmd_SEND_DIAGNOSTICS: number

export declare const kMMCCmd_PLAY_AUDIO_MSF: number

export declare const kHIDUsage_LED_IndicatorOff: number

export declare const kIOPMPowerButton: number

export declare const kIOAudioChannelLabel_RightTopRear: number

export declare const kFixedDeviceMask: number

export declare const kSBCModePageCaching_DRA_Mask: number

export declare const kIONUCGetNetworkDataCapacityIndex: number

export declare const kHIDUsage_KeyboardB: number

export declare const kSBCModePageFlexibleDisk_MO_Mask: number

export declare const kHIDUsage_Csmr_ACSubscript: number

export declare const kHIDUsage_Csmr_ACSendOrReceive: number

export declare const kRangeSupportsVSyncSerrationMask: number

export declare const kHIDUsage_Button_34: number

export declare const kHIDUsage_Snsr_Property_PowerState_D2_Standby: number

export declare const kHIDUsage_BCS_CheckDigitEnableTwoMSIPlessey: number

export declare const kHIDUsage_Tfon_Park: number

export declare const kHIDUsage_Csmr_BassIncrement: number

export declare const kHIDUsage_Csmr_ALNetworkConference: number

export declare const kIONetworkFeatureHardwareVlan: number

export declare const kHIDUsage_BCS_SoundGoodReadBeep: number

export declare const kSCSICmd_READ_16: number

export declare const kHIDUsage_Snsr_Data_Orientation_MagneticFluxYAxis: number

export declare const kSSCSeqCmd_PERSISTENT_RESERVE_IN: number

export declare const kHIDUsage_Csmr_ChannelUnknown: number

export declare const cscSetDefaultMode: number

export declare const kHIDUsage_Csmr_ModeStep: number

export declare const kDVDBookTypeHDROM: number

export declare const kUSBSuperSpeedLTMCapable: number

export declare const kUSBMassStorageClass: number

export declare const kHIDUsage_Snsr_Modifier_ChangeSensitivityPercentRange: number

export declare const kIONetworkDataAccessTypeRead: number

export declare const kESCSixMSB3: number

export declare const kUSBStream0: number

export declare const kHIDUsage_Csmr_ALPowerStatus: number

export declare const kINQUIRY_PageB1_PageCode: number

export declare const kHIDUsage_KeyboardReturn: number

export declare const kC0DataMaxStringLen: number

export declare const kIOPMHighestState: number

export declare const kIOPMNextHigherState: number

export declare const kIOAudioClockSelectorTypeTOSLink: number

export declare const kIO32RGBAPixelFormat: number

export declare const kHIDUsage_Sim_AutomobileSimulationDevice: number

export declare const kSBCWOCmd_MODE_SENSE_10: number

export declare const kDVIPowerSwitchFeature: number

export declare const kHIDUsage_Snsr_Orientation_CompassD: number

export declare const kHIDUsage_Csmr_Balance: number

export declare const kDVDFeaturesCSSBit: number

export declare const kHIDUsage_LED_Usage: number

export declare const kIOUSBSuperSpeedHubCharacteristicsOverCurrentGlobal: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkTypePhase: number

export declare const kIOI2CCombinedTransactionType: number

export declare const kINQUIRY_PERIPHERAL_TYPE_MediumChangerSMCDevice: number

export declare const kATAIdentifyLogicalHeadCount: number

export declare const kIOPacketFilterMulticast: number

export declare const kIOAudioNewClockDomain: number

export declare const kHIDUsage_Button_94: number

export declare const kUSBNotificationPreForcedSuspendBit: number

export declare const kHIDUsage_Button_86: number

export declare const kUSBFullSpeedMicrosecondsInFrame: number

export declare const kMMCCmd_SCAN_MMC: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularPositionXAxis: number

export declare const kHIDUsage_Button_52: number

export declare const kHIDUsage_Csmr_ALContextawareDesktopAssistant: number

export declare const kHIDUsage_Csmr_ACViewToggle: number

export declare const cscGetModeTiming: number

export declare const kSBCModePageRigidDiskGeometry_RPL_Mask: number

export declare const kHIDUsage_GD_Y: number

export declare const kHIDUsage_Csmr_ACExit: number

export declare const kSMCCmd_MOVE_MEDIUM: number

export declare const kHIDUsage_Button_169: number

export declare const kUSBStringDesc: number

export declare const kIOI2CDDCciReplyTransactionType: number

export declare const kDVDKeyFormatRegionState: number

export declare const kHIDUsage_Sprt_3Iron: number

export declare const kSBCCmd_READ_10: number

export declare const BIDIRECTIONAL_HEADSET: number

export declare const timingVESA_1280x960_85hz: number

export declare const kHIDUsage_Button_13: number

export declare const kHIDUsage_BCS_DecodeDataContinued: number

export declare const kHIDUsage_Sprt_BaseballBat: number

export declare const kHIDUsage_Csmr_ALDigitalRightsManager: number

export declare const kHIDUsage_LED_Reverse: number

export declare const kScaleCanSupportInsetMask: number

export declare const kFourthDepthMode: number

export declare const kSBCWOCmd_VERIFY_12: number

export declare const kHIDUsage_Csmr_DisplayBrightnessDecrement: number

export declare const kUncertainConnection: number

export declare const kHIDUsage_Sim_TurretDirection: number

export declare const kIOHIDServerConnectType: number

export declare const kSBCWOCmd_TEST_UNIT_READY: number

export declare const kIOUSBAnyProduct: number

export declare const kHIDUsage_WD_ScaleStatusRequiresRezeroing: number

export declare const kIOPMNotPowerManaged: number

export declare const kHIDUsage_AD_CursorMode: number

export declare const kIOPMProModeEngaged: number

export declare const kHIDUsage_KeyboardCrSelOrProps: number

export declare const kHIDUsage_Csmr_Menu: number

export declare const kHIDUsage_Button_154: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorBulkMaxStreamsPhase: number

export declare const kHIDUsage_Snsr_Data_Location_HorizontalDilutionOfPrecision: number

export declare const kIOAudioChannelLabel_Ambisonic_W: number

export declare const cscGetModeBaseAddress: number

export declare const kHIDUsage_Csmr_ACClose: number

export declare const kHIDUsage_BS_iManufacturerName: number

export declare const kHIDUsage_Snsr_Data_Light_ChromaticityX: number

export declare const kSPCCmd_REPORT_DEVICE_IDENTIFIER: number

export declare const kAppleVendorID: number

export declare const kDVDStructureFormatCopyrightInfo: number

export declare const kHIDUsage_BCS_BarSpaceData: number

export declare const kHIDUsage_GD_SystemDisplayToggleMode: number

export declare const kCSRMemoryBoundHiAddress: number

export declare const cscGetPreferredConfiguration: number

export declare const kHIDUsage_Button_129: number

export declare const kHIDUsage_Sim_AirplaneSimulationDevice: number

export declare const kHIDUsage_GD_AssistiveControl: number

export declare const kDMSModeNotReady: number

export declare const kHIDUsage_BCS_USB_5_SlugCode: number

export declare const kModelessConnect: number

export declare const kHIDUsage_Dig_Pen: number

export declare const kHIDUsage_FIDO_OutputData: number

export declare const kHIDUsage_LED_Rewind: number

export declare const kHIDUsage_GD_Reserved: number

export declare const kIOBlitSourceIsSame: number

export declare const kHIDUsage_Sprt_Reserved: number

export declare const kHIDUsage_BCS_MaxiCode: number

export declare const kIOPSFamilyCodeUSBChargingPortDedicated: number

export declare const kHIDUsage_PD_AwaitingPower: number

export declare const kHIDUsage_Csmr_ACDetachComment: number

export declare const kHIDUsage_Csmr_Repeat: number

export declare const kIONetworkInterfaceOpenedState: number

export declare const kINQUIRY_Page83_ProtocolIdentifierValidBit: number

export declare const kCSRStateOff: number

export declare const kHIDUsage_BCS_UPC_E: number

export declare const timingInvalid_SM_T24: number

export declare const kINQUIRY_Page83_CodeSetASCIIData: number

export declare const kConfigSBP2Revision: number

export declare const kIOAudioChannelLabel_LeftWide: number

export declare const kUSBInterface: number

export declare const kHIDUsage_KeyboardE: number

export declare const kHIDUsage_BD_BrailleRow: number

export declare const kIOPMAllowSleep: number

export declare const kIOAudioSelectorControlSubTypeChannelHighPassFilter: number

export declare const kSetAddress: number

export declare const kTriStateSyncMask: number

export declare const timingApplePAL_ST: number

export declare const kHIDUsage_Snsr_Orientation_Inclinometer2D: number

export declare const kIOMediumEthernet1000BaseSX: number

export declare const kIOCatalogRemoveDrivers: number

export declare const kHIDUsage_PD_OutletSystemID: number

export declare const kHIDUsage_BS_BattPackModelLevel: number

export declare const kSBCCmd_SYNCHRONIZE_CACHE: number

export declare const TELEPHONY_UNDEFINED: number

export declare const kMMCCmd_MECHANISM_STATUS: number

export declare const mCmpCount: number

export declare const kDVDFeaturesHDRWBit: number

export declare const kDVDMediaTypeMin: number

export declare const kHIDUsage_Snsr_Property_MinimumReportInterval: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedAttrCountPhase: number

export declare const kHIDUsage_Csmr_Record: number

export declare const kHIDUsage_PID_SetConditionReport: number

export declare const kSBCModePageCaching_SIZE_Bit: number

export declare const kScaleInvertYMask: number

export declare const kHIDUsage_BD_BrailleKeyboardRightSpace: number

export declare const kHIDUsage_Snsr_Data_Biometric: number

export declare const kHIDUsage_Csmr_SecurityEnable: number

export declare const kHIDUsage_Csmr_ACPaste: number

export declare const kIOScaleCanRotate: number

export declare const kHIDUsage_Snsr_Data_Time_Second: number

export declare const kSPCProcCmd_INQUIRY: number

export declare const kIOMapCopybackInnerCache: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularPosition: number

export declare const kHIDUsage_Csmr_ContactEmailOther: number

export declare const kIOAudioClockSelectorTypeExternal: number

export declare const kHIDUsage_Snsr_Mechanical_MultivalueSwitch: number

export declare const kHIDUsage_Button_135: number

export declare const kIOFBShmemVersionMask: number

export declare const kHIDUsage_Csmr_ContactPhoneNumberPersonal: number

export declare const kHIDUsage_Sim_Brake: number

export declare const kHIDUsage_BCS_CheckDisablePrice: number

export declare const kHIDUsage_GD_SystemDisplayInvert: number

export declare const kIOFBNS_DisplayStateMask: number

export declare const kHIDUsage_Snsr_Property_Location_DesiredAccuracy: number

export declare const kFastCheckForDDC: number

export declare const kHIDUsage_Button_47: number

export declare const kIODisplayYCbCr444ColorComponentBits8: number

export declare const kINQUIRY_Byte6_MCHNGR_Mask: number

export declare const kIOMediumIEEE80211DS11: number

export declare const kHIDUsage_Snsr_Light: number

export declare const kHIDUsage_Button_123: number

export declare const kIOVideoFeatureControlClassIDZoom: number

export declare const kIOCatalogAddDrivers: number

export declare const kINQUIRY_PageC0_PageCode: number

export declare const kHIDUsage_Sprt_StickTempo: number

export declare const kHIDUsage_LED_Repeat: number

export declare const kIOAudioChannelLabel_DialogCentricMix: number

export declare const kUSBTooManyDevicesAddress: number

export declare const kSSCSeqCmd_INQUIRY: number

export declare const kHIDUsage_WD_Undefined: number

export declare const kHIDUsage_Keypad8: number

export declare const kConfigEntryKeyValuePhase: number

export declare const kIODynamicRangeTraditionalGammaSDR: number

export declare const kConfigModuleDependentInfoKey: number

export declare const kINQUIRY_Byte56_CLOCKING_ONLY_DT: number

export declare const kCDFeaturesTAOWriteBit: number

export declare const kIOUSBDeviceFeatureSelectorTestMode: number

export declare const kPowerStateSleepWakeNeedsProbeBit: number

export declare const kSGCCmd_MODE_SENSE_10: number

export declare const kHIDUsage_KeyboardPrior: number

export declare const kINQUIRY_ANSI_VERSION_NoClaimedConformance: number

export declare const kHIDUsage_Button_120: number

export declare const kSecondsInAMinute: number

export declare const kSCSIProtocolIdentifier_ATAPI: number

export declare const kHIDUsage_KeyboardPrintScreen: number

export declare const kREAD_CAPACITY_RTO_Mask: number

export declare const kHIDUsage_Snsr_Motion_Accelerometer2D: number

export declare const kHIDUsage_WD_DataWeight: number

export declare const kIOPMDriverAssertionMagicPacketWakeEnabledBit: number

export declare const kSESCmd_RELEASE_10: number

export declare const kHIDUsage_Dig_ProgramChangeKeys: number

export declare const kCSRNodeIDsAddress: number

export declare const kSBCCmd_FORMAT_UNIT: number

export declare const kSPCCmd_REQUEST_SENSE: number

export declare const kIOAudioChannelLabel_LeftSurround: number

export declare const kHIDUsage_Csmr_ACNumberedList: number

export declare const kHIDUsage_GD_WirelessRadioSliderSwitch: number

export declare const kIOPostedWrite: number

export declare const kDVDMediaTypePlusR: number

export declare const kHIDUsage_BCS_Check: number

export declare const kHIDUsage_Button_61: number

export declare const kHIDUsage_Csmr_MenuDown: number

export declare const kConnectionBlueGammaScale: number

export declare const kHIDUsage_BD_BrailleKeyboardDot3: number

export declare const kHIDUsage_GD_SystemMenuExit: number

export declare const kHIDUsage_Csmr_Treble: number

export declare const kHIDUsage_KeyboardEscape: number

export declare const kMMCCmd_REPAIR_TRACK: number

export declare const kUSBDataClass: number

export declare const kHIDPage_BarCodeScanner: number

export declare const kHIDUsage_Sprt_6Iron: number

export declare const kHIDUsage_GD_SystemWarmRestart: number

export declare const kSESCmd_PERSISTENT_RESERVE_OUT: number

export declare const kHIDUsage_Csmr_KeyboardInputAssistNextGroup: number

export declare const kSSCSeqCmd_REWIND: number

export declare const kSENSE_KEY_ILLEGAL_REQUEST: number

export declare const kATASupportsCompactFlashBit: number

export declare const kIOHIDStandardTypeISO: number

export declare const kHIDUsage_Csmr_AC: number

export declare const kIOMediumIEEE80211Manual: number

export declare const kHIDUsage_Button_228: number

export declare const kIOColorimetryBT2100: number

export declare const kHIDUsage_Haptics_SimpleHapticController: number

export declare const kHIDUsage_PD_ChargerID: number

export declare const kIOHIDReportOptionVariableSize: number

export declare const kIOPMNullAssertionID: number

export declare const kIOMatchingCalloutRefconIndex: number

export declare const kSSCSeqCmd_SPACE: number

export declare const kSBCCmd_SEARCH_DATA_LOW_10: number

export declare const kVideoBusTypeI2C: number

export declare const kHIDUsage_Snsr_Location_Triangulation: number

export declare const kHIDUsage_Button_144: number

export declare const kIOAudioDeviceTransportTypeFireWire: number

export declare const kSPCCmd_COPY: number

export declare const kSPCCmd_MODE_SENSE_10: number

export declare const kHIDUsage_Csmr_ACAttachComment: number

export declare const kREPORT_LUNS_ADDRESS_DEVICE_TYPE_SPECIFIC: number

export declare const kIOMapWriteThruCache: number

export declare const kATASMARTSelfTestStatusNoError: number

export declare const kIOPMSoftSleep: number

export declare const INPUT_MICROPHONE: number

export declare const kIOAudioControlChannelIDAll: number

export declare const kHIDUsage_MSR_Track3Length: number

export declare const kHIDUsage_LED_Player3: number

export declare const kFWCSRStateLinkOff: number

export declare const kMMCCmd_READ_TRACK_INFORMATION: number

export declare const kHIDUsage_Csmr_ACReplyAll: number

export declare const kIOAudioStreamSampleFormatLinearPCM: number

export declare const kHIDUsage_Csmr_ACZoom: number

export declare const kHIDUsage_Csmr_ACNextLink: number

export declare const kIOAudioChannelLabel_Discrete_0: number

export declare const kIODisplayYCbCr444ColorComponentBits6: number

export declare const kHIDUsage_Tfon_Drop: number

export declare const kHIDUsage_BCS_BarCodePresentSensor: number

export declare const kHIDUsage_BD_BrailleKeyboardDot7: number

export declare const kHIDUsage_Button_155: number

export declare const kHIDUsage_LED_IndicatorOrange: number

export declare const kIOFBConnectInterruptType: number

export declare const kHIDUsage_PID_NegativeSaturation: number

export declare const kSCSICmd_WRITE_ATTRIBUTE: number

export declare const timingApple13x: number

export declare const kIOUSBSuperSpeedHubCharacteristicsPowerSwitchingIndividual: number

export declare const mTable: number

export declare const kIOStreamMemoryTypeOutputQueue: number

export declare const kDepthMode6: number

export declare const kDeactivateConnection: number

export declare const kHIDUsage_Snsr_Mechanical_Pressure: number

export declare const kIOAudioStreamSampleFormatIEEEFloat: number

export declare const kHIDUsage_BCS_EAN_8: number

export declare const kHIDUsage_GenDevControls_BackgroundControls: number

export declare const kHIDUsage_BS_SelectorRevision: number

export declare const kHIDUsage_Sprt_StickSpeed: number

export declare const kIOAudioChannelLabel_Discrete_9: number

export declare const kSCSICmd_READ_ELEMENT_STATUS_ATTACHED: number

export declare const kIORangeColorimetryxvYCC: number

export declare const kCDTrackInfoAddressTypeSessionNumber: number

export declare const kHIDUsage_Csmr_KeyboardBrightnessIncrement: number

export declare const kUSBSuperSpeedSupportsHS: number

export declare const kIOAudioStreamByteOrderLittleEndian: number

export declare const kHIDUsage_Game_Bump: number

export declare const kDiscStatusIncomplete: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkLSEPhase: number

export declare const kConfigModelIdKey: number

export declare const kIOMapOverwrite: number

export declare const kIOTimingIDApple_FixedRateLCD: number

export declare const kIO32ARGBPixelFormat: number

export declare const kHIDUsage_BCS_SymbologyIdentifier2: number

export declare const kINQUIRY_Page83_IdentifierTypeVendorID: number

export declare const kHIDUsage_Snsr_Property_Time_TimeZoneName: number

export declare const kIOFBBlueGammaScaleAttribute: number

export declare const kUSBBillboardVConn2Watt: number

export declare const kINQUIRY_PERIPHERAL_TYPE_WellKnownLogicalUnit: number

export declare const kHIDUsage_Button_89: number

export declare const kIODPEventMCCS: number

export declare const kIOUSBEndpointDescriptorPacketSizeMult: number

export declare const kHIDUsage_KeyboardRightControl: number

export declare const kHIDUsage_BD_BrailleDPadUp: number

export declare const kHIDUsage_BS_ThermistorCold: number

export declare const kHIDUsage_BCS_UPC_E1: number

export declare const kIOFBNS_Wake: number

export declare const kSBCModePageFormatDeviceCode: number

export declare const kSCSIDataTransfer_FromTargetToInitiator: number

export declare const kMMCCmd_SEND_CUE_SHEET: number

export declare const kIO64BGRAPixelFormat: number

export declare const cscProbeConnection: number

export declare const kHIDUsage_Button_223: number

export declare const kConnectionColorMode: number

export declare const kIO8IndexedGrayPixelFormat: number

export declare const kIORGBSignedDirectPixels: number

export declare const kHIDUsage_Snsr_Data_Environmental_AtmosphericPressure: number

export declare const kATAIdentifyFirmwareRevision: number

export declare const kUSBDFUCanUploadBit: number

export declare const kDMSModeReady: number

export declare const kHIDUsage_PID_ET_Sine: number

export declare const timingAppleVGA: number

export declare const kHIDUsage_Dig_ArticulatedArm: number

export declare const kIOUSBSuperSpeedDeviceCapabilityHighSpeed: number

export declare const kSSCPrinterCmd_TEST_UNIT_READY: number

export declare const kVideoDisplayPortNativeType: number

export declare const kATASupportsPowerManagementBit: number

export declare const kHIDUsage_Csmr_ContactEmailPersonal: number

export declare const kSPCCmd_EXTENDED_COPY: number

export declare const kHIDUsage_WD_ScaleScaleClassIIIMetric: number

export declare const kDVDKeyFormatKey2: number

export declare const kSCSIServiceAction_XDWRITE_32: number

export declare const kSCSICmd_SEARCH_DATA_LOW_12: number

export declare const kCSRUnitsBoundLoAddress: number

export declare const kDVDFeaturesHDRAMBit: number

export declare const kSSCSeqCmd_READ_POSITION: number

export declare const kIOUSBLinkSpeed5Gbps: number

export declare const kHIDUsage_Sprt_Putter: number

export declare const kHIDUsage_BCS_BC412: number

export declare const kFWResponseDataError: number

export declare const kINQUIRY_Page83_AssociationTargetPort: number

export declare const kIOScaleRotateFlags: number

export declare const kHIDUsage_PID_PoolAlignment: number

export declare const kConfigUnitDirectoryKey: number

export declare const kCDFeaturesTestWriteMask: number

export declare const kIOAudioSMPTETimeType24: number

export declare const kScaleRotate270Mask: number

export declare const kSSCSeqCmd_LOCATE: number

export declare const kATASupportsFlushCacheExtendedBit: number

export declare const kDVDBookTypeRW: number

export declare const kHIDUsage_Csmr_Illumination: number

export declare const kHIDUsage_BCS_Misc1DControlReport: number

export declare const kIORDYDisableBit: number

export declare const kIOStreamMemoryTypeInputQueue: number

export declare const kHIDUsage_Snsr_Data_Hinge_Angle: number

export declare const IOPMParameterError: number

export declare const kHIDUsage_WD_ScaleStatusReport: number

export declare const kHIDUsage_PD_PowerConverter: number

export declare const kModeSenseParameterHeader10_LongLBABit: number

export declare const kHIDUsage_Sim_FlightCommunications: number

export declare const kHIDUsage_Keyboard5: number

export declare const kIOUSBSuperSpeedHubCharacteristicsPowerSwitchingGanged: number

export declare const kSBCCmd_READ_CAPACITY: number

export declare const kHIDUsage_Button_190: number

export declare const kHIDUsage_BCS_NoReadMessage: number

export declare const kIOHIDAccelerationAlgorithmTypeTable: number

export declare const kIOHIDKeyboardPhysicalLayoutTypeVendor: number

export declare const kIOHIDKeyboardPhysicalLayoutType106: number

export declare const kIOHIDKeyboardPhysicalLayoutType104: number

export declare const kIOHIDKeyboardPhysicalLayoutType102: number

export declare const kIOHIDKeyboardPhysicalLayoutTypeUnknown: number

export declare const kIOHIDStandardTypeUnspecified: number

export declare const kIOHIDStandardTypeANSI: number

export declare const kIOHIDReportOptionNotInterrupt: number

export declare const kIOHIDValueOptionsUpdateElementValues: number

export declare const kIOHIDValueOptionsFlagRelativeSimple: number

export declare const kIOHIDValueScaleTypePhysical: number

export declare const kIOHIDValueScaleTypeCalibrated: number

export declare const kIOHIDElementFlagsBufferedByteMask: number

export declare const kIOHIDElementFlagsNullStateMask: number

export declare const kIOBlitOrOperation: number

export declare const kIOHIDElementFlagsConstantMask: number

export declare const kHIDUsage_KeyboardSeparator: number

export declare const kHIDUsage_BS_OptionalMfgFunction5: number

export declare const kUSBHUBDesc: number

export declare const kIOServiceMessageNotificationType: number

export declare const kHIDUsage_MSR_TrackJISData: number

export declare const kUSBStandard: number

export declare const kHIDUsage_KeyboardRightAlt: number

export declare const kHIDUsage_Snsr_Biometric_HeartRate: number

export declare const kHIDUsage_VR_AnimatronicDevice: number

export declare const kHIDUsage_PID_Phase: number

export declare const kHIDUsage_Snsr_Data_Scanner_NFCSentenceReceive: number

export declare const kCSRRegisterSpaceBaseAddressLo: number

export declare const kIOMediumEthernet10Base2: number

export declare const kHIDUsage_KeyboardLANG7: number

export declare const kIOATAFeatureAdvancedPowerManagement: number

export declare const kAnalogSignalLevel_0700_0000: number

export declare const kSENSE_KEY_VENDOR_SPECIFIC: number

export declare const kUSBVideoStreamingSubClass: number

export declare const kHIDUsage_Snsr_Property_MaxFIFOEvents: number

export declare const kHIDUsage_Csmr_RepeatFromMark: number

export declare const kIOMediumEthernet10Base5: number

export declare const kPowerStateSleepWakeNeedsProbeMask: number

export declare const kHIDUsage_KeyboardCloseBracket: number

export declare const kIOAudioControlTypeSelector: number

export declare const kHIDUsage_BCS_TriggerReport: number

export declare const kHIDUsage_PD_BadCount: number

export declare const kHIDUsage_Csmr_Rewind: number

export declare const kVideoBusTypeDisplayPort: number

export declare const kUSBReprogrammableDiagnosticSubClass: number

export declare const kHIDUsage_Button_157: number

export declare const kHIDUsage_Snsr_Data_Location_AltitudeEllipsoid: number

export declare const kHIDUsage_KeyboardInternational2: number

export declare const kHIDUsage_Csmr_ACJustifyBottom: number

export declare const kSuperSpeedBusBitMask: number

export declare const kIOVideoDeviceNotificationID_ControlRangeChanged: number

export declare const kHIDUsage_Snsr_Orientation_Distance1D: number

export declare const kSPCModePagePowerConditionCode: number

export declare const kIOBlitDestFramebuffer: number

export declare const kTransparentEncodedPixel: number

export declare const kHIDUsage_BD_BrailleRockerPress: number

export declare const kHIDUsage_Snsr_Motion_Accelerometer: number

export declare const kIOHIDElementFlagsNonLinearMask: number

export declare const kHIDUsage_BCS_ConvertEAN8To13Type: number

export declare const kUSBRqTypeShift: number

export declare const kHIDUsage_Snsr_Data_Orientation_DistanceZAxis: number

export declare const kHIDUsage_Haptics_WaveformVendorID: number

export declare const kHIDUsage_KeyboardExSel: number

export declare const kHIDUsage_LED_NumLock: number

export declare const kFWDCLOpFlagPhase: number

export declare const kRangeSupportsVSyncSerrationBit: number

export declare const kConnectionSupportsLLDDCSense: number

export declare const kHIDUsage_Button_38: number

export declare const kHIDUsage_Button_110: number

export declare const kSMCCmd_MODE_SENSE_10: number

export declare const cscSetInterrupt: number

export declare const kHIDUsage_GD_ResolutionMultiplier: number

export declare const kHIDUsage_Snsr_Modifier_None: number

export declare const kHIDUsage_KeyboardF5: number

export declare const kUSBEndpointPropertiesVersion3: number

export declare const kIOPSFamilyCodeUSBCPD: number

export declare const kHIDUsage_Button_76: number

export declare const kConnectionEnableAudio: number

export declare const cscSetDetailedTiming: number

export declare const kHIDUsage_GD_CallMuteToggle: number

export declare const kUSBSetIsochDelay: number

export declare const kHIDUsage_Csmr_KeyboardBrightnessDecrement: number

export declare const timingApple_512x384_60hz: number

export declare const kIOBlitColorSpaceTypes: number

export declare const kMMCCmd_SEARCH_DATA_EQUAL_12: number

export declare const kHIDUsage_Ord_Instance4: number

export declare const kINQUIRY_VERSION_DESCRIPTOR_SAT: number

export declare const kHIDUsage_KeyboardLeftAlt: number

export declare const kPowerStateSupportsReducedPower2BitMask: number

export declare const kConfigBusInfoBlockLength: number

export declare const kHIDUsage_GD_SystemDisplayRotationLockButton: number

export declare const kHIDUsage_Button_137: number

export declare const kIOHIDValueScaleTypeExponent: number

export declare const kHIDUsage_GD_AssistiveControlCompatible: number

export declare const kIOUSBSuperSpeedDeviceCapabilitySupportLowSpeed: number

export declare const kHIDUsage_Button_60: number

export declare const kHIDUsage_Csmr_Plus10: number

export declare const kHIDUsage_Csmr_ALInstantMessaging: number

export declare const kHIDUsage_Snsr_Data_Location_MagneticVariation: number

export declare const kCDFeaturesBUFWriteMask: number

export declare const kINQUIRY_Byte7_CMDQUE_Mask: number

export declare const kIOMediaStateOffline: number

export declare const kIONUCLastIndex: number

export declare const kHIDUsage_VR_HandTracker: number

export declare const kIOPMDoze: number

export declare const kIOMediumOptionEEE: number

export declare const kFWDCLImmediateEvent: number

export declare const kGetDescriptor: number

export declare const kHIDUsage_KeyboardF3: number

export declare const kIOPSFamilyCodeUSBChargingPort: number

export declare const kSCSIServiceAction_REPORT_PROVISIONING_INITIALIZATION_PATTERN: number

export declare const kIOBuiltinPanelPowerAttribute: number

export declare const kFWResponseComplete: number

export declare const kVideoDDCciReplyTypeMask: number

export declare const kUSBRFControllerSubClass: number

export declare const kIOAudioChannelLabel_TopBackCenter: number

export declare const kTransparentEncoding: number

export declare const kIOBlitTypeOperationTypeMask: number

export declare const kIOFBAVSignalTypeDP: number

export declare const kIOTimingIDApple_1024x768_75hz: number

export declare const kGenericLCD: number

export declare const kSGCCmd_COPY_AND_VERIFY: number

export declare const kIOAudioChannelLabel_TopBackRight: number

export declare const kSBCCmd_REZERO_UNIT: number

export declare const kIOGDiagnoseGTraceType: number

export declare const kLBABit: number

export declare const kSMCCmd_MODE_SENSE_6: number

export declare const kHIDUsage_Csmr_PoliceAlarm: number

export declare const kIOUSBDeviceRequestSetAddress: number

export declare const kHIDPage_Monitor: number

export declare const kHIDUsage_Snsr_Orientation_Compass1D: number

export declare const kHIDUsage_Csmr_FanEnable: number

export declare const kSSCPrinterCmd_PRINT: number

export declare const kIOUSBEndpointDescriptorDirection: number

export declare const kDisplaySubPixelConfigurationStripe: number

export declare const kHIDUsage_GD_SystemWakeUp: number

export declare const kUSB_SSCompDesc_Bulk_MaxStreams_Mask: number

export declare const kIORangeColorimetryNotSupported: number

export declare const kUSBDeviceCapability: number

export declare const kVideoI2CBusyErr: number

export declare const kHIDUsage_KeyboardInternational7: number

export declare const kHIDUsage_BS_CycleCount: number

export declare const kHIDUsage_Game_Player: number

export declare const kDisplayModeValidForMirroringFlag: number

export declare const cscSetSync: number

export declare const kIOAudioStreamByteOrderBigEndian: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkDirectionPhase: number

export declare const kIOStreamMethodSuspend: number

export declare const kConnectionSyncFlags: number

export declare const kDisplayModeValidForAirPlayFlag: number

export declare const kESCOnePortraitMono: number

export declare const kHIDUsage_BD_BrailleKeyboardSpace: number

export declare const kIOPMDisableClamshell: number

export declare const kUnknownConnect: number

export declare const kIOTimingIDVESA_1280x1024_60hz: number

export declare const kHIDUsage_WD_ScaleScaleClassGeneric: number

export declare const kHIDUsage_Sim_ElectronicCountermeasures: number

export declare const kHIDUsage_Csmr_ACFilter: number

export declare const kUSBPersonalHealthcareClass: number

export declare const kHIDUsage_Game_GunSingleShot: number

export declare const kIOBitsPerColorComponent16: number

export declare const kIONUCWriteNetworkDataIndex: number

export declare const kHIDKeyboardInterfaceProtocol: number

export declare const kIOWSAA_Accelerated: number

export declare const kHIDUsage_Dig_YTilt: number

export declare const kIOPSFamilyCodeUSBHost: number

export declare const kHIDUsage_Game_NewGame: number

export declare const kMMCCmd_READ_SUB_CHANNEL: number

export declare const kHIDUsage_GD_DPadDown: number

export declare const kHIDUsage_Game_GamepadFireOrJump: number

export declare const kRangeSupportsSignal_0700_0300_Mask: number

export declare const kHIDUsage_Tfon_ReorderTone: number

export declare const kHIDUsage_Csmr_ACInsertColumn: number

export declare const kHIDUsage_PID_EffectType: number

export declare const kHIDUsage_Csmr_ACCatalog: number

export declare const kXHCISSRootHubAddress: number

export declare const timingApple1Kb: number

export declare const kUSBFunctionRemoteWakeEnableBit: number

export declare const kIOAudioChannelLabel_Discrete_6: number

export declare const kIOHIDEventNotification: number

export declare const kCSRBusManagerID: number

export declare const kHIDUsage_Csmr_VolumeIncrement: number

export declare const kHIDUsage_BS_AverageCurrent: number

export declare const kUSBBulk: number

export declare const kHIDUsage_Haptics_WaveformRelease: number

export declare const EXTERNAL_MADI: number

export declare const kHIDUsage_Game_PinballDevice: number

export declare const kSPCProcCmd_RECEIVE_COPY_RESULTS: number

export declare const kHIDUsage_BS_ChargerConnection: number

export declare const kSCSICmd_PLAY_AUDIO_10: number

export declare const kINQUIRY_Byte6_VS_Mask: number

export declare const kHIDUsage_LED_UsageMultiModeIndicator: number

export declare const kHIDUsage_Csmr_ALOnlineShoppingBrowswer: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorIsocMult: number

export declare const kHIDUsage_Button_85: number

export declare const kIOUSBDeviceFeatureSelectorRemoteWakeup: number

export declare const kHIDUsage_BCS_Colorcode: number

export declare const EMBEDDED_DVD_AUDIO: number

export declare const kIOWriteCombineCache: number

export declare const kIOMediaAttributeEjectableMask: number

export declare const kSBCCmd_REPORT_LUNS: number

export declare const kConfigROMCRCValue: number

export declare const kHIDUsage_Snsr_Mechanical_BooleanSwitchArray: number

export declare const kSSCSeqCmd_READ_ELEMENT_STATUS_ATTACHED: number

export declare const kRBCCmd_READ_CAPACITY: number

export declare const kHIDUsage_KeyboardT: number

export declare const kUSPrintingClassSoftReset: number

export declare const timingApple_0x0_0hz_Offline: number

export declare const kHorizontalSyncMask: number

export declare const kIOMediumEthernet10GBaseLR: number

export declare const kHIDUsage_WD_ScaleScaleDevice: number

export declare const kHIDUsage_KeyboardCut: number

export declare const kSBCWOCmd_READ_CAPACITY: number

export declare const kIOAudioDeviceCanBeSystemOutput: number

export declare const kHIDUsage_KeyboardF19: number

export declare const kIOATAFeatureWriteCache: number

export declare const kDVDFeaturesWriteOnceMask: number

export declare const kIOPMNoErr: number

export declare const kHIDUsage_Game_GunClip: number

export declare const kIOAudioChannelLabel_Discrete_15: number

export declare const kHIDUsage_Keypad5: number

export declare const kIOPMBatteryInstalled: number

export declare const kSENSE_KEY_DATA_PROTECT: number

export declare const kIOStreamMemoryTypeBufferControl: number

export declare const kSGCCmd_COMPARE: number

export declare const kHIDUsage_Csmr_ACJustifyCenterV: number

export declare const kUSBRqGetInterface: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_Unknown: number

export declare const kInterlacedCEA861SyncModeMask: number

export declare const kHIDUsage_Snsr_Data_Location_DifferentialReferenceStationID: number

export declare const kIOAudioSMPTETimeType2997: number

export declare const kHIDUsage_Snsr_Data_Location_TrueHeading: number

export declare const kSCCCmd_MAINTENANCE_OUT: number

export declare const kSCSICmd_WRITE_BUFFER: number

export declare const kNanosecondScale: number

export declare const kIOAudioDeviceTransportTypeBluetooth: number

export declare const kHIDUsage_PID_AttackTime: number

export declare const INPUT_NULL: number

export declare const kPowerStateReducedPower1: number

export declare const kIOColorimetryAdobeRGB: number

export declare const kHIDUsage_LED_SystemMicrophoneMute: number

export declare const kHIDUsage_Snsr_Modifier_ThresholdHigh: number

export declare const kATAOperationTypeConfiguration: number

export declare const kIOMediumEthernet100BaseVG: number

export declare const kDiscStatusMask: number

export declare const kDiscStatusOther: number

export declare const kSCSICmd_VERIFY_10: number

export declare const kIOUSBAnyProtocol: number

export declare const kHIDUsage_Game_Gun: number

export declare const kHIDPage_Consumer: number

export declare const kHIDUsage_KeyboardN: number

export declare const kIOUSBEndpointDescriptorUsageTypeInterruptReserved2: number

export declare const kBDFeaturesReadMask: number

export declare const kHIDUsage_Snsr_Data_Location_AltitudeAntennaSeaLevel: number

export declare const timingVESA_1920x1440_60hz: number

export declare const kIOStreamMethodGetBufferCount: number

export declare const kDisplayModeAcceleratorBackedFlag: number

export declare const kIONetworkFeatureTSOIPv6: number

export declare const kSPCProcCmd_SEND_DIAGNOSTICS: number

export declare const kIOFBSharedConnectType: number

export declare const kIO4IndexedGrayPixelFormat: number

export declare const kHIDUsage_Sim_TrackControl: number

export declare const kHIDUsage_Snsr_Data_Orientation_DistanceXAxis: number

export declare const kHIDUsage_KeyboardRightGUI: number

export declare const kIOPMAckImplied: number

export declare const kIOAudioLevelControlSubTypeLFEVolume: number

export declare const kHIDUsage_Csmr_ALDesktop: number

export declare const kHIDUsage_Csmr_Assign: number

export declare const kHIDUsage_Csmr_ACCopy: number

export declare const kATAWriteCacheEnabledMask: number

export declare const kHIDUsage_PID_EffectOperation: number

export declare const kHIDUsage_Snsr_Data_Electrical_Capacitance: number

export declare const kIOAudioPortTypePassThru: number

export declare const kUSBConfDesc: number

export declare const kHIDUsage_Snsr_Data_Biometric_HumanTouchState: number

export declare const kMMCCmd_SEND_EVENT: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSpeedIdCountPhase: number

export declare const kHIDUsage_WD_CalibrationCount: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularPositionYAxis: number

export declare const kSPCCmd_REPORT_LUNS: number

export declare const kIOATAMaxPowerSavings: number

export declare const kHIDUsage_Haptics_WaveformBuzzContinuous: number

export declare const kHIDUsage_GD_Start: number

export declare const cscDoCommunication: number

export declare const INPUT_DESKTOP_MICROPHONE: number

export declare const kCSRTestStatusAddress: number

export declare const kHIDUsage_BS_ChargerSelectorSupport: number

export declare const kDVDKeyFormatAGID_CSS2: number

export declare const kHIDUsage_Snsr_Data_Electrical_Voltage: number

export declare const kDisplayModeDefaultFlag: number

export declare const kIOMaxBusStall30usec: number

export declare const kHIDUsage_Button_88: number

export declare const kHIDUsage_Button_30: number

export declare const kHIDUsage_Csmr_ACNewWindow: number

export declare const kHIDUsage_GD_CoolantLevel: number

export declare const kATAForceUnitAccessFeatureBit: number

export declare const kIONetworkFeatureSoftwareVlan: number

export declare const kHIDUsage_AD_CharacterHeight: number

export declare const kSCSICmd_PERSISTENT_RESERVE_OUT: number

export declare const kHIDUsage_Button_211: number

export declare const kHIDUsage_PID_IsochCustomForceEnable: number

export declare const kUSBBillboardVConn5Watt: number

export declare const kIOUSBEndpointDescriptorNumberPhase: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_FrequencyExceeded: number

export declare const kHIDUsage_GD_SystemMenu: number

export declare const kReportsHotPlugging: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_RangeMinReached: number

export declare const kIOFWLimitAsyncPacketSize: number

export declare const kSCSIServiceAction_XDREAD_32: number

export declare const kHIDUsage_KeyboardPeriod: number

export declare const kIOAudioDeviceTransportTypeThunderbolt: number

export declare const kHIDUsage_Csmr_ALProcessOrTaskManager: number

export declare const kIOPMThermalLevelDanger: number

export declare const kHIDUsage_PID_AxesEnable: number

export declare const kIOBlitSynchronizeWaitBeamExit: number

export declare const kSSCSeqCmd_WRITE_BUFFER: number

export declare const kHIDUsage_Button_29: number

export declare const kIORangeSupportsSyncOnGreen: number

export declare const kHIDUsage_Snsr_Data_Environmental_Temperature: number

export declare const kUSBDFUCanDownloadBit: number

export declare const kHIDUsage_BCS_CheckEnableEuropean5DigitPrice: number

export declare const kSyncDigitalCompositeMatchHSyncMask: number

export declare const kIOMediumIEEE80211: number

export declare const cscSetScaler: number

export declare const kINQUIRY_Page83_IdentifierTypeLogicalUnitGroup: number

export declare const kCSRCoreRegistersBaseAddress: number

export declare const kRangeSupportsSeperateSyncsMask: number

export declare const kATASMARTSelfTestStatusPreviousTestServoFailure: number

export declare const kSBCWOCmd_PERSISTENT_RESERVE_OUT: number

export declare const kINQUIRY_Byte6_BQUE_Mask: number

export declare const kIOScaleStretchOnly: number

export declare const kIODisplayYCbCr444ColorComponentBitsUnknown: number

export declare const kINQUIRY_PERIPHERAL_TYPE_Mask: number

export declare const kHIDUsage_Snsr_Property_Time_ArmAlarm: number

export declare const kSyncOnBlueMask: number

export declare const kIOPMSystemCapabilityAOT: number

export declare const kUSBbEndpointAddressMask: number

export declare const kHIDUsage_PID_Period: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_ZeroThresholdCrossDown: number

export declare const kIOTimingIDApplePAL_FF: number

export declare const kMSCProtocolUSBAttachedSCSI: number

export declare const kATADefaultTimeout: number

export declare const mCmpSize: number

export declare const kHIDUsage_BS_SMBErrorCode: number

export declare const kConfigUnitSWVersIIDC102: number

export declare const kHIDUsage_Snsr_Data_Orientation_Heading: number

export declare const kHIDUsage_Tfon_OutsideRingback: number

export declare const kHIDUsage_Csmr_ACBack: number

export declare const kHIDUsage_Snsr_Data_Location_PostalCode: number

export declare const kSBCWOCmd_MODE_SELECT_10: number

export declare const kSCSICmd_WRITE_AND_VERIFY_10: number

export declare const timingSony_1920x1080_72hz: number

export declare const kFWDCLCycleEvent: number

export declare const kHIDUsage_Sim_Rudder: number

export declare const kHIDUsage_Csmr_ALTaskOrProjectManager: number

export declare const kIOKitNoticationTypeSizeAdjShift: number

export declare const kHIDUsage_Csmr_ACIndentyIncrease: number

export declare const kHIDUsage_BCS_CheckDigitEnableStandard2of5USS: number

export declare const kHIDUsage_Csmr_ALMessageStatus: number

export declare const kHIDUsage_Csmr_MediaSelection: number

export declare const kUSBDataIsocUsageType: number

export declare const kHIDUsage_Snsr_Property_Mechanical_BackwardVibrationSpeed: number

export declare const kHIDUsage_Csmr_Proximity: number

export declare const kMMCCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kHIDUsage_WD_ScaleStatus: number

export declare const kHIDUsage_BCS_DecodedData: number

export declare const kHIDUsage_GD_Hatswitch: number

export declare const kHIDUsage_BS_SMBChargerStatus: number

export declare const kIOUSBDeviceFeatureSelectorU1Enable: number

export declare const kNonMagneticDriveBit: number

export declare const kIOAudioSMPTETimeType2398: number

export declare const kHIDUsage_PD_Output: number

export declare const kHIDUsage_Csmr_ALWordProcessor: number

export declare const kHIDUsage_Dig_GestureCharacterEncodingUTF8: number

export declare const kHIDUsage_Sprt_9Wood: number

export declare const kIOPSFamilyCodeUSBCTypeC: number

export declare const kHIDUsage_Csmr_AL: number

export declare const kHIDUsage_Csmr_ChannelCenter: number

export declare const IOPMMaxPerformance: number

export declare const kHIDUsage_Csmr_ALDatabaseApp: number

export declare const kUSBBOSDescriptor: number

export declare const kHIDUsage_Snsr_Data_Orientation_HeadingYAxis: number

export declare const timingApple1Ka: number

export declare const thirdVidMode: number

export declare const kHIDUsage_BCS_SettingsReport: number

export declare const kHIDUsage_Snsr_Time_RealTimeClock: number

export declare const kSCSICmd_VendorSpecific_End: number

export declare const kConnectionDisplayFlags: number

export declare const kHIDUsage_Sim_BarrelElevation: number

export declare const kIOUSBSuperSpeedDeviceCapabilityLowSpeed: number

export declare const kDeclROMtables: number

export declare const kHIDUsage_BCS_DataLengthMethod: number

export declare const kIOScaleCanUpSamplePixels: number

export declare const kSPCProcCmd_PERSISTENT_RESERVE_IN: number

export declare const kDVDFeaturesCSSMask: number

export declare const kATAIdentifyWordsPerLogicalSector1: number

export declare const kUSB500mAAvailable: number

export declare const kIOPMPSLocationLeft: number

export declare const kFWBadNodeID: number

export declare const kHIDUsage_Snsr_Data_Location_Speed: number

export declare const kIOAudioChannelLabel_LeftCenter: number

export declare const kHIDUsage_BCS_CheckDigitEnableInterleaved2of5OPCC: number

export declare const kIOAudioOutputPortSubTypeExternalSpeaker: number

export declare const kFWIsochDataLength: number

export declare const kHIDUsage_PD_ConfigActivePower: number

export declare const kHIDUsage_Csmr_Play: number

export declare const kSMCCmd_RESERVE_ELEMENT_6: number

export declare const kIOUSBDeviceRequestSetInterface: number

export declare const kHIDUsage_LED_OnLine: number

export declare const kINQUIRY_Page83_IdentifierTypeIEEE_EUI64: number

export declare const kHIDUsage_BS_AtRateTimeToEmpty: number

export declare const kHIDUsage_Button_40: number

export declare const kINQUIRY_MaximumDataSize: number

export declare const kUSBAtrSelfPowered: number

export declare const kHIDUsage_GD_DoNotDisturb: number

export declare const kIOBlitBlendOperation: number

export declare const kSCSICmd_RECEIVE_COPY_RESULTS: number

export declare const kIOAudioSelectorControlSelectionValueNone: number

export declare const kHIDUsage_Csmr_ACFontColor: number

export declare const kHIDUsage_BCS_Interleaved2of5ControlReport: number

export declare const kCSRUnitsBaseHiAddress: number

export declare const kHIDUsage_KeyboardF22: number

export declare const kMMCCmd_SEEK_6: number

export declare const kIOPMBatteryAtWarn: number

export declare const kIOMediumOptionFlag2: number

export declare const kHIDUsage_Button_152: number

export declare const kHIDUsage_Csmr_ALThesaurus: number

export declare const kIOHIDActivityUserIdle: number

export declare const kCSRStateDReq: number

export declare const kUSBDFUSubClass: number

export declare const kStereoSyncConnection: number

export declare const kIONetworkDataAccessTypeMask: number

export declare const kHIDUsage_GD_SystemMenuHelp: number

export declare const kHIDUsage_BD_BrailleJoystickCenter: number

export declare const kDVDFeaturesRandomWriteableBit: number

export declare const kHIDUsage_Csmr_Once: number

export declare const kSCCCmd_PORT_STATUS: number

export declare const kHIDPage_Sport: number

export declare const kMSCProtocolControlBulkInterrupt: number

export declare const kDisplaySubPixelShapeSquare: number

export declare const kHIDUsage_Sprt_Oar: number

export declare const kDisplaySubPixelShapeElliptical: number

export declare const kDisplaySubPixelConfigurationStripeOffset: number

export declare const kHIDUsage_Csmr_ACSuperscript: number

export declare const kDisplaySubPixelConfigurationDelta: number

export declare const kDisplaySubPixelConfigurationUndefined: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorSSPIsocCompanion: number

export declare const kDisplaySubPixelLayoutQuadGBL: number

export declare const kIOCatalogResetDrivers: number

export declare const kDisplaySubPixelLayoutBGR: number

export declare const kDisplaySubPixelLayoutUndefined: number

export declare const kDisplayProductIDGeneric: number

export declare const kIOFBLinkScramblerAlternate: number

export declare const kIOFBLinkScramblerNormal: number

export declare const kIOFBLinkDownspreadMax: number

export declare const kATAIdentifyCommandExtension1: number

export declare const kIOFBLinkPreEmphasisLevel3: number

export declare const kIOFBLinkPreEmphasisLevel1: number

export declare const timingApplePAL_FF: number

export declare const kIOFBLinkPreEmphasisLevel0: number

export declare const kIOFBLinkVoltageLevel3: number

export declare const kIOFBLinkVoltageLevel1: number

export declare const kIOFBBitRateRBR: number

export declare const kIOFBAVSignalTypeDVI: number

export declare const kIOFBAVSignalTypeVGA: number

export declare const kIOFBAVSignalTypeUnknown: number

export declare const kIOHibernatePreviewUpdates: number

export declare const kIOHibernatePreviewActive: number

export declare const kIOTimingIDVESA_1360x768_60hz: number

export declare const kIOTimingIDVESA_848x480_60hz: number

export declare const kIOTimingIDSony_1920x1200_76hz: number

export declare const kIOTimingIDSony_1920x1080_60hz: number

export declare const kIOTimingIDSony_1600x1024_76hz: number

export declare const kIOTimingIDFilmRate_48hz: number

export declare const kIOTimingIDVESA_1920x1440_60hz: number

export declare const kIOTimingIDVESA_1856x1392_75hz: number

export declare const kIOTimingIDVESA_1792x1344_75hz: number

export declare const kIOTimingIDVESA_1600x1200_85hz: number

export declare const kIOTimingIDVESA_1600x1200_80hz: number

export declare const kIOTimingIDVESA_1600x1200_75hz: number

export declare const kIOTimingIDVESA_1280x1024_85hz: number

export declare const kIOTimingIDVESA_1280x960_75hz: number

export declare const kIOTimingIDApplePAL_FFconv: number

export declare const kIOTimingIDApplePAL_STconv: number

export declare const kIOTimingIDApplePAL_ST: number

export declare const kIOTimingIDAppleNTSC_FFconv: number

export declare const kIOTimingIDApple_1152x870_75hz: number

export declare const kIOTimingIDVESA_1152x864_75hz: number

export declare const kSSCSeqCmd_CHANGE_DEFINITION: number

export declare const kIOTimingIDVESA_1024x768_85hz: number

export declare const kIOTimingIDVESA_800x600_75hz: number

export declare const kIONUCReadNetworkDataIndex: number

export declare const kIOTimingIDVESA_800x600_56hz: number

export declare const kIOTimingIDApple_832x624_75hz: number

export declare const kIOTimingIDApple_640x818_75hz: number

export declare const kIOTimingIDApple_640x870_75hz: number

export declare const kIOTimingIDGTF_640x480_120hz: number

export declare const kIOTimingIDVESA_640x480_72hz: number

export declare const kIOTimingIDApple_640x400_67hz: number

export declare const kIOTimingIDApple_512x384_60hz: number

export declare const kIOFBWakeInterruptType: number

export declare const kIOFBMCCSInterruptType: number

export declare const kUSB_EPDesc_MaxMPS: number

export declare const kIOFBDisplayPortInterruptType: number

export declare const kIOFBOfflineInterruptType: number

export declare const kIOFBFrameInterruptType: number

export declare const kIOFBHBLInterruptType: number

export declare const kIOFBVBLInterruptType: number

export declare const kHardwareCursorInfoMinorVersion: number

export declare const kInvertingEncoding: number

export declare const kIODisplayAssertionConnectType: number

export declare const kIODisplayPowerStateOn: number

export declare const kIODisplayPowerStateMinUsable: number

export declare const kIODisplayDitherYCbCr422Shift: number

export declare const kIODisplayDitherYCbCr444Shift: number

export declare const kIODisplayDitherRGBShift: number

export declare const kIODisplayDitherFrameRateControl: number

export declare const kIODisplayDitherSpatial: number

export declare const kIODisplayDitherDisable: number

export declare const kIODisplayYCbCr422ColorComponentBits10: number

export declare const kIODisplayYCbCr422ColorComponentBits8: number

export declare const kIODisplayYCbCr422ColorComponentBitsUnknown: number

export declare const kIODisplayYCbCr444ColorComponentBits16: number

export declare const kIODisplayYCbCr444ColorComponentBits14: number

export declare const kIODisplayYCbCr444ColorComponentBits12: number

export declare const kIODisplayYCbCr444ColorComponentBits10: number

export declare const kIODisplayRGBColorComponentBits16: number

export declare const kIODisplayRGBColorComponentBits14: number

export declare const kIODisplayRGBColorComponentBits10: number

export declare const kIODisplayRGBColorComponentBitsUnknown: number

export declare const kINQUIRY_Byte56_CLOCKING_ONLY_ST: number

export declare const kIODisplayColorMode: number

export declare const kHIDUsage_Csmr_DisplayBrightnessIncrement: number

export declare const kIODPEventAutomatedTestRequest: number

export declare const kIODPEventRemoteControlCommandPending: number

export declare const kIODPEventForceRetrain: number

export declare const kIODPEventIdle: number

export declare const kIODPEventStart: number

export declare const kIOWindowServerActiveAttribute: number

export declare const kIOSyncOnGreen: number

export declare const kIOSyncOnBlue: number

export declare const kIOTriStateSyncs: number

export declare const kIOVSyncDisable: number

export declare const kIOConnectionStereoSync: number

export declare const kIOConnectionBuiltIn: number

export declare const kConnectionStartOfFrameTime: number

export declare const kIODisplayRGBColorComponentBits6: number

export declare const kIOMediumEthernet2500BaseT: number

export declare const kConnectionAudioStreaming: number

export declare const kConnectionControllerDitherControl: number

export declare const kConnectionColorModesSupported: number

export declare const kConnectionPanelTimingDisable: number

export declare const kConnectionHandleDisplayPortEvent: number

export declare const kConnectionVBLMultiplier: number

export declare const kConnectionGammaScale: number

export declare const kConnectionGreenGammaScale: number

export declare const kConnectionOverscan: number

export declare const kConnectionDisplayParameterCount: number

export declare const kConnectionChanged: number

export declare const kConnectionCheckEnable: number

export declare const kConnectionSupportsHLDDCSense: number

export declare const kConnectionFlags: number

export declare const kAndConnections: number

export declare const kOrConnections: number

export declare const kIOScaleCanSupportInset: number

export declare const kIOScaleCanScaleInterlaced: number

export declare const kIOScaleCanDownSamplePixels: number

export declare const kIOAnalogSignalLevel_1000_0400: number

export declare const kUSBControl: number

export declare const kIOAnalogSignalLevel_0714_0286: number

export declare const kIOMultiAlignedTiming: number

export declare const kSBCModePageFlexibleDisk_SPC_Mask: number

export declare const kIODSCBlockPredEnable: number

export declare const kIOPALTiming: number

export declare const kIONTSCTiming: number

export declare const kIORangeSupportsMultiAlignedTiming: number

export declare const kIORangeSupportsInterlacedCEATimingWithConfirm: number

export declare const kPowerStateSupportsReducedPower3Bit: number

export declare const kIORangeSupportsVSyncSerration: number

export declare const kIORangeSupportsCompositeSync: number

export declare const kIORangeSupportsSignal_0714_0286: number

export declare const kIORangeSupportsSignal_0700_0300: number

export declare const kIORangeDynamicRangeTraditionalGammaSDR: number

export declare const kIORangeDynamicRangeDolbyTunnelMode: number

export declare const kIORangeDynamicRangeSDR: number

export declare const kHIDUsage_BS_AverageTimeToEmpty: number

export declare const kIORangeColorimetryBT2020: number

export declare const kIORangeColorimetryBT709: number

export declare const kIORangeColorimetryBT601: number

export declare const kIORangeColorimetryAdobeRGB: number

export declare const kIORangeColorimetryDCIP3: number

export declare const kIORangeColorimetrysRGB: number

export declare const kIORangeColorimetryNativeRGB: number

export declare const kIORangeBitsPerColorComponent12: number

export declare const kIORangeBitsPerColorComponent6: number

export declare const kIORangePixelEncodingYCbCr422: number

export declare const kHIDUsage_Snsr_Property_ResponseCurve: number

export declare const kIORangePixelEncodingRGB444: number

export declare const kIORangePixelEncodingNotSupported: number

export declare const kIOTimingRangeV1: number

export declare const kCSRRegisterSpaceBaseAddressHi: number

export declare const kIOWSAA_Hibernate: number

export declare const kIOTimingRangeV2: number

export declare const kIODynamicRangeDolbyNormalMode: number

export declare const kIODynamicRangeHDR10: number

export declare const kIODynamicRangeSDR: number

export declare const kIOColorimetryBT2020: number

export declare const kIOColorimetryWGRGB: number

export declare const kConfigModuleVendorIdKey: number

export declare const kIOColorimetryxvYCC: number

export declare const kHIDUsage_Csmr_AlternateAudioDecrement: number

export declare const kIOColorimetrysRGB: number

export declare const kIOBitsPerColorComponentNotSupported: number

export declare const kIOPixelEncodingYCbCr420: number

export declare const kIOPixelEncodingYCbCr422: number

export declare const kIOPixelEncodingRGB444: number

export declare const kIOPixelEncodingNotSupported: number

export declare const kIOScaleRotate180: number

export declare const kIOScaleInvertY: number

export declare const kIOScaleSwapAxes: number

export declare const kIODetailedTimingValid: number

export declare const kIOMirrorForced: number

export declare const kIOMirrorDefault: number

export declare const kIOUSBInterfaceStatusRemoteWakeEnable: number

export declare const kIOMirrorHWClipped: number

export declare const kIOFBNS_GenerationShift: number

export declare const kIOFBNS_DisplayStateShift: number

export declare const kIOFBNS_Dim: number

export declare const kIOFBNS_Doze: number

export declare const kIOAudioStreamSampleFormat1937AC3: number

export declare const kIOFBNS_Sleep: number

export declare const kIOFBNS_Rendezvous: number

export declare const kHIDUsage_GD_SystemMenuLeft: number

export declare const kIOWSAA_DriverOpen: number

export declare const kIOWSAA_Sleep: number

export declare const kIOScaleStretchToFit: number

export declare const kIOWSAA_From_Accelerated: number

export declare const kIOFBDisplayState_RestoredProfile: number

export declare const kIOFBDisplayState_AlreadyActive: number

export declare const kIOFBHDCPLimit_NoHDCP20Type1: number

export declare const kIOFBHDCPLimit_NoHDCP20Type0: number

export declare const kIOFBHDCPLimit_NoHDCP1x: number

export declare const kIOFBHDRMetaDataAttribute: number

export declare const kIOFBGreenGammaScaleAttribute: number

export declare const kIOFBStop: number

export declare const kIOFBLimitHDCPStateAttribute: number

export declare const kIOFBLimitHDCPAttribute: number

export declare const kIOFBVariableRefreshRate: number

export declare const kIOClamshellStateAttribute: number

export declare const kIOCursorControlAttribute: number

export declare const kIOUSBEndpointDescriptorUsageTypeInterruptNotification: number

export declare const kIOPowerAttribute: number

export declare const kSetCLUTWithLuminance: number

export declare const kSBCModePageCaching_MF_Bit: number

export declare const kSetCLUTImmediately: number

export declare const kSetCLUTByValue: number

export declare const kIOFBSystemAperture: number

export declare const kFramebufferSupportsWritethruCache: number

export declare const kFramebufferSupportsCopybackCache: number

export declare const kIOPMProcessorSpeedChange: number

export declare const kDisplayModeSafeFlag: number

export declare const kDisplayModeNativeFlag: number

export declare const kDisplayModeValidateAgainstDisplay: number

export declare const kDisplayModeNotGraphicsQualityFlag: number

export declare const kDisplayModeNotPresetFlag: number

export declare const kDisplayModeRequiresPanFlag: number

export declare const kDisplayModeNotResizeFlag: number

export declare const kUSBAudioClass: number

export declare const kHIDUsage_Snsr_Modifier_VendorDefined: number

export declare const kDisplayModeNeverShowFlag: number

export declare const kDisplayModeAlwaysShowFlag: number

export declare const kDisplayModeSafetyFlags: number

export declare const kIOMonoDirectPixels: number

export declare const timingSMPTE240M_60hz: number

export declare const kIORGBDirectPixels: number

export declare const kIOCLUTPixels: number

export declare const kIOMaxPixelBits: number

export declare const kIODisplayModeIDReservedBase: number

export declare const kIODisplayModeIDBootProgrammable: number

export declare const kDDCBlockSize: number

export declare const kHIDUsage_Snsr_Scanner: number

export declare const kIOAudioControlChannelIDDefaultSurroundRight: number

export declare const kIODynamicRangeTraditionalGammaHDR: number

export declare const kUSBDFUAttributesMask: number

export declare const kHIDUsage_LED_CAV: number

export declare const kHIDUsage_Csmr_ScanPreviousTrack: number

export declare const kPowerStateSupportsReducedPower2Bit: number

export declare const kSGCCmd_READ: number

export declare const kHIDUsage_Csmr_ACResize: number

export declare const kIOInterestCalloutRefconIndex: number

export declare const kIOUSBEndpointDescriptorPacketSizePhase: number

export declare const kCDFeaturesPacketWriteBit: number

export declare const kReportsTagging: number

export declare const kIOPacketFilterPromiscuous: number

export declare const kHubSuperSpeedProtocol: number

export declare const kSSCPrinterCmd_LOG_SELECT: number

export declare const kIODisplayPowerStateOff: number

export declare const kSMCCmd_EXCHANGE_MEDIUM: number

export declare const kHIDUsage_BCS_DataMatrix: number

export declare const kHIDUsage_Dig_DataValid: number

export declare const kFWBIBCycClkAccPhase: number

export declare const kSBCCmd_COPY_AND_VERIFY: number

export declare const timingApple_640x870_75hz: number

export declare const kINQUIRY_PERIPHERAL_TYPE_ObjectBasedStorageDevice: number

export declare const EMBEDDED_RADIO_RECEIVER: number

export declare const kCDTrackInfoAddressTypeTrackNumber: number

export declare const kHIDUsage_Snsr_Data_Mechanical_MultivalueSwitchValue: number

export declare const kIODisplayDitherAll: number

export declare const kHIDUsage_Dig_Stylus: number

export declare const kHIDUsage_PD_ConfigCurrent: number

export declare const kMirrorSameDepthOnlyMirrorMask: number

export declare const kIOAudioSMPTETimeType5994Drop: number

export declare const kINQUIRY_PageB1_Page_Length: number

export declare const kHIDUsage_Snsr_Data_Location_AddressLine2: number

export declare const kIOUSBSuperSpeedHubDecodeLatencyMax: number

export declare const kIOPSFamilyCodeUSBDevice: number

export declare const kHIDUsage_Sim_MotorcycleSimulationDevice: number

export declare const kHIDUsage_Csmr_ACFontSize: number

export declare const kHIDUsage_Tfon_Message: number

export declare const kUSDebugDesc: number

export declare const kINQUIRY_Byte7_Offset: number

export declare const kSetDeviceFeature: number

export declare const kIOMapWriteCombineCache: number

export declare const kDPMSSyncMask: number

export declare const kConfigBusDependentInfoKey: number

export declare const kSPCCmd_MODE_SELECT_10: number

export declare const kIOAudioSMPTETimeType2997Drop: number

export declare const kSetEndpointFeature: number

export declare const kIOStreamMethodStop: number

export declare const kIOTimingIDApple_0x0_0hz_Offline: number

export declare const kSPCProcCmd_RESERVE_10: number

export declare const kIOPSFamilyCodeUnsupportedRegion: number

export declare const kMMCCmd_RESERVE_6: number

export declare const kHIDUsage_Snsr_Electrical_Resistance: number

export declare const kINQUIRY_Byte6_ENCSERV_Mask: number

export declare const kConfigUnitLocationKey: number

export declare const kHIDUsage_Csmr_FunctionButtons: number

export declare const kIOFBLinkDownspreadNone: number

export declare const kIOUSBVendorIDAppleComputer: number

export declare const kSCSICmd_READ_CAPACITY: number

export declare const kHIDUsage_GD_SystemColdRestart: number

export declare const kATAIdentifyUltraDMASupported: number

export declare const kIORangeDynamicRangeHDR10: number

export declare const kIOHIDOptionsTypeMaskPrivate: number

export declare const kHIDUsage_Button_62: number

export declare const timingVESA_1600x1200_75hz: number

export declare const kSCSICmd_COMPARE: number

export declare const kSSCPrinterCmd_COPY_AND_VERIFY: number

export declare const kHIDUsage_Button_160: number

export declare const kHIDUsage_Snsr_Data_Biometric_HumanProximityOutOfRange: number

export declare const kHIDUsage_Csmr_NumericKeyPad: number

export declare const kHIDUsage_LED_Kana: number

export declare const kUSB100mA: number

export declare const kIOHIDElementFlagsVariableMask: number

export declare const kHIDUsage_KeyboardSpacebar: number

export declare const IOPMNextHigherState: number

export declare const kRangeSupportsSignal_0714_0286_Bit: number

export declare const kINQUIRY_Byte7_WBUS16_Mask: number

export declare const kHIDUsage_Snsr_Property_Mechanical_ForwardVibrationSpeed: number

export declare const kHIDUsage_Tfon_DoNotDisturb: number

export declare const kHIDUsage_LED_OffHook: number

export declare const kHIDReportProtocolValue: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilityReservedPhase: number

export declare const kIOUYVY422PixelFormat: number

export declare const kIOMapPrefault: number

export declare const twoBitMode: number

export declare const kSCSICmd_GET_EVENT_STATUS_NOTIFICATION: number

export declare const kIOWSAA_DeferStart: number

export declare const kIOAudioStreamSampleFormatMuLaw: number

export declare const kIOUSBAnyVendor: number

export declare const kHIDUsage_Snsr_Biometric_HumanProximity: number

export declare const kHIDUsage_Csmr_ACSaveAndClose: number

export declare const kUSBBillboardConfigNotAttempted: number

export declare const kHIDUsage_Dig_MultiplePointDigitizer: number

export declare const kHIDUsage_Snsr_Property: number

export declare const kHIDUsage_LED_IndicatorFastBlink: number

export declare const kIOPMWillAckLater: number

export declare const kIOBlitSourceSolid: number

export declare const kHIDUsage_Dig_SurfaceSwitch: number

export declare const kIOCopybackCache: number

export declare const kIOWSAA_Reserved: number

export declare const kHIDUsage_KeyboardPOSTFail: number

export declare const kHardwareCursorInfoMajorVersion: number

export declare const kINQUIRY_Page00_PageCode: number

export declare const kUSBCommunicationControlInterfaceClass: number

export declare const kHIDUsage_PID_SampleCount: number

export declare const kHIDUsage_Game_MoveForwardOrBackward: number

export declare const kHIDUsage_Tfon_StoreNumber: number

export declare const kHIDUsage_KeyboardInternational4: number

export declare const kHIDUsage_Button_127: number

export declare const kSCSICmd_SEND_CUE_SHEET: number

export declare const kHIDUsage_KeyboardClear: number

export declare const kHIDUsage_BS_Undefined: number

export declare const kMMCCmd_READ_MASTER_CUE: number

export declare const kHIDUsage_Button_203: number

export declare const kIOCatalogKextdActive: number

export declare const kHIDUsage_PID_OpEffectStartSolo: number

export declare const kHIDUsage_Csmr_ACScrollDown: number

export declare const kIORangeDynamicRangeNotSupported: number

export declare const cscGetMultiConnect: number

export declare const kHIDUsage_Csmr_ACUpload: number

export declare const kHIDUsage_Csmr_ClimateControlEnable: number

export declare const kHIDUsage_BCS_Standard2of5: number

export declare const kSBCModePageFlexibleDisk_TRDY_Bit: number

export declare const kIOTimingIDSMPTE240M_60hz: number

export declare const kHIDUsage_Csmr_MedicalAlarm: number

export declare const kUSBSpeed_Mask: number

export declare const kVideoDDCciReplyType: number

export declare const kHIDUsage_Snsr_Environmental_WindSpeed: number

export declare const kHIDUsage_Csmr_MediaSelectGames: number

export declare const kSCSICmd_MODE_SENSE_6: number

export declare const kHIDUsage_BS_AtRateOK: number

export declare const kHIDUsage_LED_Pause: number

export declare const kHIDUsage_Button_107: number

export declare const kIOScaleRotate270: number

export declare const kHIDUsage_GD_SystemAppMenu: number

export declare const kATASMARTSelfTestStatusInProgress: number

export declare const kINQUIRY_Byte7_SYNC_Bit: number

export declare const kHardwareCursorDescriptorMinorVersion: number

export declare const kHIDUsage_Csmr_ACEdit: number

export declare const kHIDUsage_Csmr_Quit: number

export declare const kCSRChannelsAvailable63_32: number

export declare const kIOVideoFeatureControlClassIDGain: number

export declare const kHardwareCursorDescriptorMajorVersion: number

export declare const kDisplaySubPixelShapeUndefined: number

export declare const kCDMediaTypeMin: number

export declare const INPUT_UNDEFINED: number

export declare const kSBCCmd_UPDATE_BLOCK: number

export declare const kHIDUsage_Snsr_Data_Electrical_Frequency: number

export declare const kHIDUsage_BCS_PDF_417: number

export declare const kHIDUsage_Csmr_Still: number

export declare const kUSB3HUBDesc: number

export declare const kHIDUsage_Dig_LightPen: number

export declare const kINQUIRY_Byte6_ENCSERV_Bit: number

export declare const kHIDPage_Undefined: number

export declare const kHIDUsage_Csmr_ALRemoteNetworkingOrISPConnect: number

export declare const kIOBlitMemoryRequiresHostFlush: number

export declare const kHIDUsage_Csmr_ACInsertObject: number

export declare const kSENSE_FILEMARK_Not_Set: number

export declare const kHIDUsage_Csmr_ALClock: number

export declare const kHIDUsage_BCS_PeriodicalOnlyDecodeWithPlus5: number

export declare const kHIDUsage_KeyboardSelect: number

export declare const kModeNotGraphicsQuality: number

export declare const mPageCnt: number

export declare const kUSBMassStorageSFF8070iSubClass: number

export declare const kSBCCmd_SEEK_6: number

export declare const kSPCCmd_READ_ELEMENT_STATUS_ATTACHED: number

export declare const kSyncInterlaceMask: number

export declare const kINQUIRY_Byte3_NORMACA_Mask: number

export declare const kFCPResponseAddress: number

export declare const kSPCProcCmd_REQUEST_SENSE: number

export declare const kIORangeColorimetryBT2100: number

export declare const kHIDUsage_Button_122: number

export declare const kFWAckBusyX: number

export declare const kIOBlitSourceDefault: number

export declare const kHIDUsage_BCS_ContactScanner: number

export declare const kIOUSBDeviceRequestSetSel: number

export declare const kThirdDepthMode: number

export declare const kHIDUsage_BS_TerminateDischarge: number

export declare const kPowerStateReducedPower3: number

export declare const kSCCCmd_PERSISTENT_RESERVE_OUT: number

export declare const kSPCCmd_PREVENT_ALLOW_MEDIUM_REMOVAL: number

export declare const kIOAudioDeviceCanBeDefaultNothing: number

export declare const kHIDUsage_Csmr_ContactLastName: number

export declare const kConnectionColorDepthsSupported: number

export declare const kINQUIRY_Page83_CodeSetReserved: number

export declare const kCSRMemoryBaseHiAddress: number

export declare const kUSB100mAAvailable: number

export declare const kIOBitsPerColorComponent8: number

export declare const kFWAckPending: number

export declare const cscGetSync: number

export declare const kFWIsochTag: number

export declare const kHIDUsage_AD_Row: number

export declare const kHIDUsage_WD_WeightUnitPennyweights: number

export declare const kMirrorCanChangeTimingMask: number

export declare const kSBCModePageFlexibleDisk_SSN_Mask: number

export declare const kIOStreamMethodOpen: number

export declare const kSCSICmd_SET_LIMITS_10: number

export declare const timingVESA_640x480_75hz: number

export declare const kIODynamicRangeNotSupported: number

export declare const kUSBInterfaceIDShift: number

export declare const kHIDUsage_GD_SystemMainMenu: number

export declare const kSCSICmd_PAUSE_RESUME: number

export declare const kIOPMNextLowerState: number

export declare const kHIDUsage_KeyboardPageDown: number

export declare const kIOMapUnique: number

export declare const kHIDUsage_WD_WeightUnitPound: number

export declare const kHIDUsage_Csmr_ACDistributeV: number

export declare const kConfigNodeSwVersionKey: number

export declare const kIODefaultCache: number

export declare const kDisplayModeIDNoMoreResolutions: number

export declare const kHIDUsage_Sim_Elevator: number

export declare const kHIDUsage_BCS_PreventReadOfBarcodes: number

export declare const kIOCatalogAddDriversNoMatch: number

export declare const kIOAsyncCalloutCount: number

export declare const kDisplayModeStretchedFlag: number

export declare const kHIDUsage_BS_ResetToZero: number

export declare const kDisplayModeTelevisionFlag: number

export declare const kRangeSupportsSignal_0700_0300_Bit: number

export declare const kIOHIDElementFlagsWrapMask: number

export declare const kHIDUsage_Csmr_GenericGUIApplicationControls: number

export declare const kMMCCmd_VERIFY_12: number

export declare const kSENSE_KEY_BLANK_CHECK: number

export declare const kIOUSBDeviceRequestGetInterface: number

export declare const kHIDPage_PID: number

export declare const kHIDUsage_GD_MultiAxisController: number

export declare const kHIDUsage_BCS_EAN_99_128_Mandatory: number

export declare const kHIDUsage_PD_Humidity: number

export declare const kIOMediumIEEE80211OptionAdhoc: number

export declare const kRangeSupportsSignal_0700_0000_Bit: number

export declare const timingVESA_1920x1440_75hz: number

export declare const kIODisplayMatchingInfo: number

export declare const kSCSICmd_SEND: number

export declare const cscGetGray: number

export declare const EMBEDDED_DCC: number

export declare const kIOAsyncReservedCount: number

export declare const kHIDUsage_Snsr_Data_Location_CountryOrRegion: number

export declare const timingVESA_800x600_60hz: number

export declare const kIOBitsPerColorComponent12: number

export declare const kSCSICmd_SEARCH_DATA_HIGH_10: number

export declare const kHIDPage_BrailleDisplay: number

export declare const kHIDUsage_GD_Select: number

export declare const kIOPMClockNormal: number

export declare const kHIDUsage_Snsr_Data_Light_ChromaticityY: number

export declare const kUSBBillboardAdditinalInfoNoUSBPD: number

export declare const kHIDUsage_LED_Forward: number

export declare const kHIDUsage_Haptics_WaveformPress: number

export declare const kScaleStretchToFitMask: number

export declare const kHIDUsage_GD_DockableDevicePrimaryUsagePage: number

export declare const kIOPMLowestState: number

export declare const kMMCDeviceTrayClosed: number

export declare const kDPMSSyncOn: number

export declare const kHIDUsage_Csmr_BlueMenuButton: number

export declare const kHIDUsage_BD_BrailleRockerDown: number

export declare const kHIDUsage_Button_240: number

export declare const kUSBAudioInterfaceClass: number

export declare const kHIDPage_KeyboardOrKeypad: number

export declare const kIOHIDOpenedByEventSystem: number

export declare const kHIDUsage_KeypadPlus: number

export declare const kPCRBaseAddress: number

export declare const TELEPHONY_DOWN_LINE_PHONE: number

export declare const kHIDUsage_BS_SMBChargerSpecInfo: number

export declare const kSSCSeqCmd_READ_ELEMENT_STATUS: number

export declare const kIOAudioSelectorControlSubTypeChannelNominalLineLevel: number

export declare const kHIDUsage_Button_64: number

export declare const kATAIdentifyPhysicalLogicalSectorSize: number

export declare const kHIDUsage_LED_GreenLEDChannel: number

export declare const kHIDUsage_KeyboardInternational1: number

export declare const kSSCPrinterCmd_MODE_SELECT_10: number

export declare const kIOTimingIDVESA_640x480_85hz: number

export declare const kMMCCmd_LOG_SENSE: number

export declare const kHIDUsage_LED_Player8: number

export declare const kUSBNotificationPreForcedResumeBit: number

export declare const kIORangePixelEncodingYCbCr444: number

export declare const kSBCModePageCaching_VS1_Mask: number

export declare const kIORPCMessageKernel: number

export declare const timingVESA_1280x1024_60hz: number

export declare const kIOPMGoodValue: number

export declare const kHIDUsage_Dig_Tap: number

export declare const kHIDUsage_Snsr_Property_Manufacturer: number

export declare const kHIDUsage_LED_ExternalPowerConnected: number

export declare const kHIDUsage_Button_168: number

export declare const kSGCCmd_COPY: number

export declare const kIOEthernetWakeOnMagicPacket: number

export declare const kIOUSBUSB20ExtensionCapabilityBESLDValid: number

export declare const kINQUIRY_PERIPHERAL_QUALIFIER_NotSupported: number

export declare const kSBCModePageCaching_DEMAND_READ_Mask: number

export declare const kHIDUsage_Snsr_Property_Description: number

export declare const kIOFBNS_UnDim: number

export declare const kATAIdentifyDriveCapabilities: number

export declare const kESCSixMSB2: number

export declare const kATASMARTOffLineCollectionNoError: number

export declare const kFullPageConnect: number

export declare const kHIDUsage_BS_RemainingTimeLimit: number

export declare const kHIDUsage_Snsr_Location_DeadReckoning: number

export declare const kVideoSimpleI2CType: number

export declare const kDVDBookTypePlusRDoubleLayer: number

export declare const kINQUIRY_Byte6_VS_Bit: number

export declare const kHIDUsage_Button_159: number

export declare const kHIDUsage_Csmr_ACAttachFile: number

export declare const kHIDUsage_KeyboardOut: number

export declare const kUSBNumLockKey: number

export declare const kHIDUsage_Snsr_Property_ChangeSensitivityPercentRange: number

export declare const kMirrorSameSizeOnlyMirrorMask: number

export declare const kHIDUsage_Snsr_Property_Time_DaylightSavingsTimeObserved: number

export declare const kHIDUsage_Dig_GestureCharacterEncodingUTF32LE: number

export declare const kIOHIDKeyboardPhysicalLayoutType101: number

export declare const kHIDUsage_WD_WeightUnitTroyOunce: number

export declare const kIOHSyncDisable: number

export declare const kIORangeBitsPerColorComponent16: number

export declare const kINQUIRY_PERIPHERAL_TYPE_SimplifiedDirectAccessRBCDevice: number

export declare const kMMCCmd_COPY: number

export declare const kIONUCGetNetworkDataHandleIndex: number

export declare const timingApplePAL_FFconv: number

export declare const timingAppleSVGA: number

export declare const kIOMapStatic: number

export declare const kConfigGenerationKey: number

export declare const kHIDUsage_Csmr_ACForwardMessage: number

export declare const kIOWSAA_Unaccelerated: number

export declare const kModeSenseParameterHeader10_LongLBAMask: number

export declare const kHIDUsage_BCS_LongRangeScanner: number

export declare const kIORPCVersion190615: number

export declare const kHIDUsage_Csmr_ACSelectObject: number

export declare const kSBCWOCmd_RESERVE_6: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_ChangeSensitivity: number

export declare const kHIDUsage_Sprt_1Iron: number

export declare const kIOTimingIDApple_560x384_60hz: number

export declare const kIOScaleCanBorderInsetOnly: number

export declare const kHIDUsage_BS_FullyDischarged: number

export declare const kHIDUsage_BS_AtRateTimeToFull: number

export declare const kHIDUsage_Snsr_Data_Hinge: number

export declare const kIOKitNoticationTypeMask: number

export declare const kSBCWOCmd_SET_LIMITS_10: number

export declare const kIOFBLinkVoltageLevel0: number

export declare const kDisplaySubPixelLayoutQuadGBR: number

export declare const kSCSICDBSize_16Byte: number

export declare const kVideoUsageAddrSubAddrMask: number

export declare const kHIDUsage_PD_PercentLoad: number

export declare const kConfigEntryValue: number

export declare const kHIDUsage_Sim_MagicCarpetSimulationDevice: number

export declare const kDVDRZoneInfoAddressTypeBorderNumber: number

export declare const kSMCCmd_REQUEST_SENSE: number

export declare const kSCSICmd_SEARCH_DATA_EQUAL_12: number

export declare const kHIDUsage_BCS_BooklandEAN: number

export declare const kHIDUsage_Csmr_Reserved: number

export declare const kINQUIRY_Byte7_VS_Mask: number

export declare const kIORGBSignedFloatingPointPixels: number

export declare const kCDFeaturesReadStructuresBit: number

export declare const kHIDUsage_Sprt_Treadmill: number

export declare const kDVDFeaturesHDReadMask: number

export declare const kHIDUsage_Button_233: number

export declare const kUSBHIDInterfaceClass: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeFloatRTK: number

export declare const kUSBInterfaceAssociationDesc: number

export declare const IOPMWillAckLater: number

export declare const kIOFBDisplayPortTrainingAttribute: number

export declare const kSBCWOCmd_COPY_AND_VERIFY: number

export declare const cscPrivateStatusCall: number

export declare const kHIDUsage_LED_HighCutFilter: number

export declare const kDVDMediaTypeHDR: number

export declare const kCDTOCFormatTOC: number

export declare const kSGCCmd_WRITE_BUFFER: number

export declare const kIOColorimetryNativeRGB: number

export declare const kHIDUsage_Csmr_ACNormalView: number

export declare const kIORangeBitsPerColorComponent10: number

export declare const kHIDUsage_Sprt_8Iron: number

export declare const kUSBBillboardUnspecifiedError: number

export declare const kIOBitsPerColorComponent6: number

export declare const kUSBDeviceCapabilityUSB20Extension: number

export declare const kIOAudioChannelLabel_TopBackLeft: number

export declare const EMBEDDED_MINIDISK: number

export declare const kHIDUsage_KeyboardW: number

export declare const kHIDUsage_Sim_RearBrake: number

export declare const kMirrorClippedMirrorMask: number

export declare const kHIDUsage_Dig_Eraser: number

export declare const kHIDUsage_BCS_ChannelCode: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularVelocityXAxis: number

export declare const kSSCSeqCmd_MOVE_MEDIUM_ATTACHED: number

export declare const kINQUIRY_PERIPHERAL_QUALIFIER_Mask: number

export declare const kHIDUsage_Button_226: number

export declare const kIOBlitTypeDestKeyColorNotEqual: number

export declare const kSSCSeqCmd_WRITE_FILEMARKS: number

export declare const kSCSICmd_INQUIRY: number

export declare const kIOMediumOptionFullDuplex: number

export declare const kCSRStateAtn: number

export declare const kUSBFeedbackIsocUsageType: number

export declare const kIOVideoFeatureControlClassIDBrightness: number

export declare const kDVDFeaturesReWriteableMask: number

export declare const kIORPCMessageOneway: number

export declare const kHIDUsage_BS_SMBBatteryStatus: number

export declare const kIOTimingIDAppleNTSC_ST: number

export declare const kSBCModePageCaching_DISC_Bit: number

export declare const kIOMediumOptionFlag1: number

export declare const kIOFBDisplayState_PipelineBlack: number

export declare const kUSBAdaptiveIsocSyncType: number

export declare const kIOPSFamilyCodeExternal8: number

export declare const kINQUIRY_PERIPHERAL_RMB_BitMask: number

export declare const kSBCCmd_XPWRITE: number

export declare const cscGetScaler: number

export declare const kIOUSBDeviceRequestSetIsochronousDelay: number

export declare const kHIDUsage_PID_DC_EnableActuators: number

export declare const kSBCCmd_LOG_SENSE: number

export declare const kIOTimingIDAppleNTSC_FF: number

export declare const kIORangeSupportsSeparateSyncs: number

export declare const kHIDUsage_BCS_DLMethodReadAny: number

export declare const kHIDUsage_Tfon_VoiceMail: number

export declare const cscSetMirror: number

export declare const kHIDUsage_Game_HeightOfPOV: number

export declare const kHIDUsage_Csmr_ALAOrVCaptureOrPlayback: number

export declare const kHIDUsage_LED_Shift: number

export declare const kHardwareWakeToDoze: number

export declare const kHIDUsage_PD_Initialized: number

export declare const kHIDPage_VR: number

export declare const kSSCPrinterCmd_MODE_SELECT_6: number

export declare const kIORangeColorimetryWGRGB: number

export declare const kIOMediumIEEE80211DS5: number

export declare const kHIDUsage_BCS_HeaterPresent: number

export declare const kSyncOnGreenMask: number

export declare const kHIDUsage_Csmr_DataOnScreen: number

export declare const kHIDUsage_LED_ToneEnable: number

export declare const kHIDUsage_Button_114: number

export declare const kINQUIRY_Byte7_LINKED_Mask: number

export declare const kHIDUsage_Csmr_ChannelLowFrequencyEnhancement: number

export declare const kIOHIDElementFlagsNoPreferredMask: number

export declare const kConnectionDisplayParameters: number

export declare const kHIDUsage_Tfon_PhoneKey8: number

export declare const kHIDUsage_Sim_SailingSimulationDevice: number

export declare const kIONUCResetNetworkDataIndex: number

export declare const kSSCPrinterCmd_RELEASE_10: number

export declare const kHIDUsage_Csmr_Aspect: number

export declare const kHIDUsage_Button_172: number

export declare const kUSBSuperSpeedSupportsFS: number

export declare const kHardwareWakeToDozeFromSuspend: number

export declare const cscGetGamma: number

export declare const kUSBMaxPipes: number

export declare const kDisplayVendorIDUnknown: number

export declare const kIOCatalogRemoveDriversNoMatch: number

export declare const kATAPhysicalLogicalEnabledBit1: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesInView: number

export declare const kPMGeneralAggressiveness: number

export declare const kHIDUsage_BS_iDeviceChemistry: number

export declare const kIOColorimetryBT709: number

export declare const kSSCPrinterCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kUSBMassStorageUFISubClass: number

export declare const kREAD_CAPACITY_PROT_Mask: number

export declare const kUSBHubCountExceededNotificationType: number

export declare const kHIDUsage_Snsr_Time: number

export declare const kIOUSBSuperSpeedDeviceCapabilitySupportHighSpeed: number

export declare const kIOHardwareCursorAttribute: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_PeriodExceeded: number

export declare const kTickScale: number

export declare const kConnectionSupportsAppleSense: number

export declare const kHIDUsage_WD_ScaleScaleClassIIILEnglish: number

export declare const kHIDUsage_PD_DelayBeforeReboot: number

export declare const kHIDUsage_Button_235: number

export declare const kDisplaySubPixelLayoutRGB: number

export declare const kUSBVendor: number

export declare const kIOPMProModeDisengaged: number

export declare const kHIDUsage_Button_255: number

export declare const kHIDUsage_PID_DC_DeviceContinue: number

export declare const mVRes: number

export declare const kIOHIDTransactionOptionDefaultOutputValue: number

export declare const kATAIdentifyConfiguration: number

export declare const kIOSyncOnRed: number

export declare const kHIDUsage_Csmr_MediaSelectTV: number

export declare const kPowerStateSleepCanPowerOffBit: number

export declare const kIOHIDOptionsTypeSeizeDevice: number

export declare const kUSBDeviceSpeedHigh: number

export declare const kConfigNodeDependentInfoKey: number

export declare const kHIDUsage_Snsr_Modifier_CalibrationMultiplier: number

export declare const kHIDUsage_Snsr_Data_Mechanical: number

export declare const kIOWSAA_NonConsoleDevice: number

export declare const kIOAudioTimeStampRateScalarValid: number

export declare const kHIDUsage_Button_75: number

export declare const kInvertingEncodingShift: number

export declare const kATASupportsAdvancedPowerManagementBit: number

export declare const kSBCCmd_WRITE_12: number

export declare const kIODeferCLUTSetAttribute: number

export declare const kINQUIRY_PERIPHERAL_RMB_MediumFixed: number

export declare const kHIDUsage_Snsr_Data_Orientation_MagneticFlux: number

export declare const kPowerStateSleepAwareMask: number

export declare const kHIDUsage_KeyboardAgain: number

export declare const kSSCSeqCmd_READ_BUFFER: number

export declare const kHIDUsage_GD_SystemDisplaySwap: number

export declare const kHIDUsage_GD_DockableDeviceUniqueID: number

export declare const kHIDUsage_BS_FullyCharged: number

export declare const kSBCCmd_READ_UPDATED_BLOCK_10: number

export declare const kIOFBBitRateHBR: number

export declare const kIOTimingIDVESA_1024x768_60hz: number

export declare const kSESCmd_RESERVE_6: number

export declare const kHIDUsage_Snsr_Data_Biometric_HeartRate: number

export declare const mVersion: number

export declare const kSSCPrinterCmd_MODE_SENSE_10: number

export declare const kSGCCmd_SEND_DIAGNOSTICS: number

export declare const kSENSE_EOM_Not_Set: number

export declare const kHIDUsage_BCS_QRCode: number

export declare const kHIDUsage_Button_26: number

export declare const kIOPMPreventIdleSleep: number

export declare const kFWBIBMaxRecPhase: number

export declare const kSCSICmd_SEND_DVD_STRUCTURE: number

export declare const kClearInterfaceFeature: number

export declare const kHIDUsage_Snsr_Property_ReportingState_NoEvents: number

export declare const kAnalogSignalLevel_0700_0300: number

export declare const kHIDUsage_PD_Flow: number

export declare const kHIDPage_LEDs: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesUsedCount: number

export declare const kHIDUsage_LED_CameraOn: number

export declare const kIO16BE565PixelFormat: number

export declare const kHIDUsage_LED_CameraOff: number

export declare const kIORangeSupportsSignal_1000_0400: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeSimulatorMode: number

export declare const kPMMotionSensor: number

export declare const kIOAnalogSignalLevel_0700_0300: number

export declare const kHIDUsage_Snsr_Data_Location_AddressLine1: number

export declare const kDisplayModeInterlacedFlag: number

export declare const kHIDUsage_Dig_TipSwitch: number

export declare const kSESCmd_MODE_SELECT_10: number

export declare const kSCSICmd_SEND_KEY: number

export declare const kDCLJumpOp: number

export declare const kIOTimingIDAppleNTSC_STconv: number

export declare const kHIDUsage_Csmr_ACZoomOut: number

export declare const kUSBDeviceSpeedFull: number

export declare const kSESCmd_MODE_SENSE_10: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_PollResponse: number

export declare const kSMCCmd_PERSISTENT_RESERVE_OUT: number

export declare const kHIDUsage_KeyboardL: number

export declare const kIORegistryIterateParents: number

export declare const kIORegistryIterateRecursively: number

export declare const kDVDRZoneInfoAddressTypeRZoneNumber: number

export declare const kIOMasterPortDefault: number

export declare const kIOHIDSetRelativeCursorPosition: number

export declare const kOSAsyncRefSize: number

export declare const kOSAsyncRefCount: number

export declare const kOSAsyncRef64Size: number

export declare const kIOInterestCalloutCount: number

export declare const kIOMatchingCalloutCount: number

export declare const kIOAsyncCalloutRefconIndex: number

export declare const kIOAsyncCalloutFuncIndex: number

export declare const kUSBNotificationPostForcedSuspendBit: number

export declare const IOPMHighestState: number

export declare const kIOAsyncReservedIndex: number

export declare const kHIDUsage_Dig_Quality: number

export declare const kOSNotificationMessageID: number

export declare const kLastIOKitNotificationType: number

export declare const kIOServicePublishNotificationType: number

export declare const kIOSystemStateSleepDescriptionHibernateStateWakingFromHibernate: number

export declare const kIOSystemStateSleepDescriptionHibernateStateHibernating: number

export declare const kIOMaxBusStall10usec: number

export declare const kHIDUsage_PD_SwitchOnOff: number

export declare const kIOCatalogServiceTerminate: number

export declare const kIOMaxBusStall40usec: number

export declare const kSecondScale: number

export declare const kIOMapGuardedSmall: number

export declare const kIOMapGuardedMask: number

export declare const kIOMapPostedCombinedReordered: number

export declare const kIOMatchingCalloutFuncIndex: number

export declare const kIOMapRealTimeCache: number

export declare const kIOMapCopybackCache: number

export declare const kIOServiceInteractionAllowed: number

export declare const kIOMapInhibitCache: number

export declare const kIOMapDefaultCache: number

export declare const kIOMapCacheMask: number

export declare const kIOPostedCombinedReordered: number

export declare const kMMCCmd_COMPARE: number

export declare const kIOPostedReordered: number

export declare const kIORealTimeCache: number

export declare const kSBCCmd_TEST_UNIT_READY: number

export declare const kIOCopybackInnerCache: number

export declare const kIODefaultMemoryType: number

export declare const EMBEDDED_CD_PLAYER: number

export declare const kBDFeaturesWriteMask: number

export declare const kIOMaxBusStall5usec: number

export declare const kINQUIRY_Page83_AssociationTargetDevice: number

export declare const kIOVideoFeatureControlClassIDTilt: number

export declare const kFramebufferDisableAltivecAccess: number

export declare const kIOAudioControlUsageInput: number

export declare const kHIDUsage_GD_DockableDeviceDisplayOcclusion: number

export declare const kHIDUsage_BCS_ConvertUPCAToEAN_13: number

export declare const kSSCSeqCmd_LOG_SELECT: number

export declare const kHIDUsage_BCS_StatusReport: number

export declare const kCSRSplitTimeoutHiAddress: number

export declare const kINQUIRY_Byte7_RELADR_Bit: number

export declare const kUSBSuperSpeedSupportsSS: number

export declare const kSetConfiguration: number

export declare const kOSAsyncCompleteMessageID: number

export declare const kHIDUsage_BS_BatteryInsertion: number

export declare const kINQUIRY_Byte6_MULTIP_Bit: number

export declare const kHIDUsage_Dig_StereoPlotter: number

export declare const kCurFieldsValidBit: number

export declare const kHIDUsage_KeyboardOper: number

export declare const kSCSICmd_LOG_SENSE: number

export declare const kHIDUsage_LED_GenericIndicator: number

export declare const kIOServiceMatchedNotificationType: number

export declare const kDisplayModeBuiltInFlag: number

export declare const kIORangeSupportsInterlacedCEATiming: number

export declare const kIOPowerStateAttribute: number

export declare const timingApple_640x480_67hz: number

export declare const kHIDUsage_GD_CallMuteLED: number

export declare const kIOStreamEnqueueInputTrap: number

export declare const kIOFBNumCursorFramesShift: number

export declare const kHIDUsage_Button_204: number

export declare const cscGetScanProc: number

export declare const kESCSevenNoDisplay: number

export declare const kHIDUsage_GD_SFShift: number

export declare const kSCSICmd_VendorSpecific_Start: number

export declare const kIOAudioStreamSampleFormatALaw: number

export declare const kAVPowerOn: number

export declare const kIOPMClamshellOpened: number

export declare const kIOFBServerConnectType: number

export declare const kHIDUsage_Snsr_Data_Scanner: number

export declare const kINQUIRY_Byte5_ACC_Bit: number

export declare const kRSCZero: number

export declare const kAnalogSetupExpectedMask: number

export declare const kHIDPage_Ordinal: number

export declare const timingApple_640x818_75hz: number

export declare const kIORDYBit: number

export declare const kHIDUsage_PID_SetConstantForceReport: number

export declare const kIOTimingIDVESA_1856x1392_60hz: number

export declare const kHIDUsage_Dig_CapacitiveHeatMapDigitizer: number

export declare const kMultiModeCRT4Connect: number

export declare const kIOYUVUPixelFormat: number

export declare const kSGCCmd_INQUIRY: number

export declare const kVideoCombinedI2CTypeMask: number

export declare const kHIDUsage_Tfon_ProgrammableButton: number

export declare const kIONetworkDataAccessTypeSerialize: number

export declare const kUSBInterrupt: number

export declare const kHIDUsage_Sim_FlightYoke: number

export declare const kHIDUsage_BD_6DotBrailleCell: number

export declare const kVideoCannotMirrorErr: number

export declare const kINQUIRY_PERIPHERAL_TYPE_CDROM_MMCDevice: number

export declare const kHIDUsage_BD_BraillePanRight: number

export declare const TELEPHONY_PHONE_LINE: number

export declare const kIOScaleRotate90: number

export declare const kHIDUsage_Dig_3DDigitizer: number

export declare const kOSAsyncRef64Count: number

export declare const kIOAudioSelectorControlSelectionValueInternalSpeaker: number

export declare const kHIDUsage_Button_216: number

export declare const kRemoveableMediaMask: number

export declare const kHIDUsage_Csmr_SlowTracking: number

export declare const kSCSICmd_SEARCH_DATA_EQUAL_10: number

export declare const kHIDUsage_Button_95: number

export declare const kIOPMSleepCapability: number

export declare const kHIDUsage_Snsr_Property_ReportingState_WakeThresholdEvents: number

export declare const kHIDUsage_Keyboard0: number

export declare const kDisplaySubPixelShapeOval: number

export declare const kIOTimingIDVESA_1792x1344_60hz: number

export declare const kCSRErrorLogBufferAddress: number

export declare const kHIDUsage_Snsr_Data_Motion_AccelerationAxisX: number

export declare const kHIDUsage_Snsr_Property_SerialNumber: number

export declare const kIdentifyWordValidationMask: number

export declare const kIOAudioChannelLabel_Ambisonic_X: number

export declare const kSBCModePageCaching_IC_Mask: number

export declare const kHIDUsage_BCS_GRWTINoBeep_LampUseAtAll: number

export declare const kSCSIServiceAction_XDWRITEREAD_32: number

export declare const kHIDUsage_PID_ROM_PoolSize: number

export declare const kHIDUsage_BCS_UPC_A: number

export declare const kIOAudioToggleControlSubTypeMute: number

export declare const kDisplaySubPixelConfigurationQuad: number

export declare const cscGetCurMode: number

export declare const kIOGDiagnoseConnectType: number

export declare const kHIDUsage_Csmr_VCRPlus: number

export declare const kIOUSBDeviceRequestSynchFrame: number

export declare const kINQUIRY_Byte6_Offset: number

export declare const kDVDCPRMRegion4: number

export declare const kHIDUsage_Sim_Clutch: number

export declare const kConnectionControllerColorDepth: number

export declare const kSPCCmd_LOG_SELECT: number

export declare const kSCSICmd_PERSISTENT_RESERVE_IN: number

export declare const kUSBDeviceQualifierDesc: number

export declare const kIOMonoInverseDirectPixels: number

export declare const kHIDUsage_Csmr_ACSelectWord: number

export declare const kHIDUsage_Sprt_GolfClub: number

export declare const kCSRInterruptTargetAddress: number

export declare const kHIDUsage_BS_ACPresent: number

export declare const kHIDUsage_Snsr_Event: number

export declare const kSBCWOCmd_WRITE_6: number

export declare const EMBEDDED_VCR_AUDIO: number

export declare const kHIDUsage_Button_87: number

export declare const kHIDUsage_KeyboardAlternateErase: number

export declare const kHIDUsage_GD_DockableDeviceObjectType: number

export declare const kHIDUsage_Snsr_Data_Orientation_HeadingTrueNorth: number

export declare const kHIDUsage_BCS_MSIPlesseyControlReport: number

export declare const kFWIsochTCode: number

export declare const kHIDUsage_BD_RouterSet3: number

export declare const kHIDUsage_Button_151: number

export declare const kUSBSynchronousIsocSyncType: number

export declare const kHIDUsage_Snsr_Data_Mechanical_Strain: number

export declare const kUSBDeviceCapabilitySuperSpeedUSB: number

export declare const IOPMAuxPowerOn: number

export declare const kIOUSBEndpointDescriptorUsageTypeIsocImplicit: number

export declare const kINQUIRY_Page83_AssociationShift: number

export declare const kDVDFeaturesWriteOnceBit: number

export declare const IOPMDeviceUsable: number

export declare const kIO32ABGRPixelFormat: number

export declare const kScaleCanBorderInsetOnlyMask: number

export declare const kHIDUsage_Snsr_Data_Custom: number

export declare const kHIDPage_PowerDevice: number

export declare const kHIDUsage_Snsr_Property_ConnectionType_External: number

export declare const kHIDUsage_Snsr_Data_Location_VerticalDilutionOfPrecision: number

export declare const kMode3Bit: number

export declare const kHIDUsage_BCS_Standard2of5IATA: number

export declare const kUSBTDMLowBatteryType: number

export declare const kHIDUsage_Csmr_TrackingIncrement: number

export declare const kHIDUsage_Csmr_ALResearchOrSearchBrowswer: number

export declare const kHIDUsage_Dig_GestureCharacterData: number

export declare const kHIDUsage_KeyboardLANG9: number

export declare const kModeInterlaced: number

export declare const kIOInterestCalloutServiceIndex: number

export declare const kHIDUsage_Csmr_Stop: number

export declare const kINQUIRY_Byte5_SCCS_Bit: number

export declare const kHIDUsage_Csmr_ALLogoff: number

export declare const kSMCCmd_MODE_SELECT_10: number

export declare const kHIDUsage_Snsr_Data_Mechanical_Force: number

export declare const kIOAudioControlChannelIDDefaultRight: number

export declare const kHIDUsage_Button_246: number

export declare const kHIDUsage_Snsr_Data_Location_SatellitesInViewElevation: number

export declare const kHIDUsage_PID_ET_Ramp: number

export declare const kHIDUsage_Button_162: number

export declare const kCSRUnitsBaseLoAddress: number

export declare const EMBEDDED_SYNTHESIZER: number

export declare const kHIDUsage_PD_Charger: number

export declare const cscGetPages: number

export declare const timingVESA_1280x960_60hz: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_DataUpdated: number

export declare const kIOCapturedAttribute: number

export declare const cscSwitchMode: number

export declare const kHIDUsage_Csmr_ACFullScreenView: number

export declare const kIOMapCacheShift: number

export declare const kATAIdentifyLogicalCylinderCount: number

export declare const kHIDUsage_Keyboard4: number

export declare const kIOTimingIDVESA_800x600_72hz: number

export declare const kHIDUsage_BD_BrailleJoystickUp: number

export declare const kUSBBillBoardClass: number

export declare const kHIDUsage_Button_19: number

export declare const kHIDUsage_Dig_TabletFunctionKeys: number

export declare const kDVDCPRMRegion2: number

export declare const kScaleRotate90Mask: number

export declare const kIOKitNoticationMsgSizeMask: number

export declare const kUSBMassStorageSCSISubClass: number

export declare const kIOHIDAccelerationAlgorithmTypeDefault: number

export declare const kMMCCmd_READ_6: number

export declare const kHIDUsage_AD_CharacterSpacingVertical: number

export declare const fourthVidMode: number

export declare const kHIDUsage_KeyboardApplication: number

export declare const timingVESA_1600x1200_85hz: number

export declare const kHIDUsage_BCS_BarCodeScannerCradle: number

export declare const kMMCCmd_SEND_DIAGNOSTICS: number

export declare const kTransparentEncodingShift: number

export declare const kHIDUsage_Sprt_StickHeelOrToe: number

export declare const kIOMaxBusStallNone: number

export declare const kUSBOut: number

export declare const kIOUSBSuperSpeedDeviceCapability5Gb: number

export declare const kSCSICmd_LOCK_UNLOCK_CACHE: number

export declare const kIO16BE4444PixelFormat: number

export declare const kIOFBOnlineInterruptType: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilityMinRxLaneCountPhase: number

export declare const kDCLNuDCLLeaderOp: number

export declare const kIOMediaStateBusy: number

export declare const kHIDUsage_GD_Dial: number

export declare const kHIDUsage_BD_BraillePanLeft: number

export declare const kSMCCmd_RELEASE_ELEMENT_10: number

export declare const kIODisplayDitherTemporal: number

export declare const kDisplayModeValidForHiResFlag: number

export declare const kUSBFeatureFunctionSuspend: number

export declare const kIOVRAMSaveAttribute: number

export declare const kConnectionFlushParameters: number

export declare const kMMCCmd_READ_BUFFER_CAPACITY: number

export declare const kIOBlitSourceFramebuffer: number

export declare const kIOAudioSMPTETimeType30Drop: number

export declare const kIOServiceTerminatedNotificationType: number

export declare const kHIDUsage_BS_RelativeStateOfCharge: number

export declare const kUSBCompositeClass: number

export declare const kSCSICmd_REDUNDANCY_GROUP_IN: number

export declare const kHIDUsage_Game_ShootBall: number

export declare const kHIDUsage_Snsr_Property_ReportingState_AllEvents: number

export declare const kHIDUsage_Csmr_ACJustifyBlockH: number

export declare const kIOFBChangedInterruptType: number

export declare const kHIDUsage_Button_15: number

export declare const kHIDUsage_AD_FontReport: number

export declare const kMessageMediaTypeDetermined: number

export declare const kSMCCmd_READ_ELEMENT_STATUS: number

export declare const kIODisplayRGBColorComponentBits8: number

export declare const timingApple_1024x768_75hz: number

export declare const kHIDUsage_Csmr_DuressAlarm: number

export declare const kATASupportsAdvancedPowerManagementMask: number

export declare const kIOPacketFilterMulticastAll: number

export declare const kUSBPrintingClass: number

export declare const kHIDUsage_PID_CustomForceData: number

export declare const kIOUSBInterfaceFeatureSelectorSuspend: number

export declare const kHIDUsage_PID_ActuatorsEnabled: number

export declare const kHIDUsage_Snsr_Property_DevicePath: number

export declare const kHIDUsage_Csmr_MenuValueIncrease: number

export declare const kIOSystemStateSleepDescriptionHibernateStateInactive: number

export declare const kHIDRqGetProtocol: number

export declare const kHIDUsage_Csmr_ACUnlock: number

export declare const kHIDUsage_PID_SetPeriodicReport: number

export declare const kHIDUsage_Snsr_Data_Motion_Speed: number

export declare const kIOI2CSimpleTransactionType: number

export declare const kHIDUsage_BD_RouterKey: number

export declare const IOPMConfigRetained: number

export declare const kHIDUsage_Button_119: number

export declare const kHIDUsage_KeyboardEqualSign: number

export declare const kHIDUsage_Button_130: number

export declare const kHIDUsage_Csmr_ACIdleKeepAlive: number

export declare const kHIDUsage_GD_RPM: number

export declare const kUSBClass: number

export declare const kHIDUsage_KeyboardR: number

export declare const kIOAudioSelectorControlSelectionValueCD: number

export declare const kSCCCmd_SPARE_OUT: number

export declare const kIOHIDPostHIDManagerEvent: number

export declare const kIOPMSystemCapabilityNetwork: number

export declare const kDVDFeaturesBUFWriteBit: number

export declare const kSSCSeqCmd_LOAD_UNLOAD: number

export declare const kIOMapUserOptionsMask: number

export declare const kIOFBDisplayPortLinkChangeInterruptType: number

export declare const kIODPEventContentProtection: number

export declare const kHIDUsage_Snsr_Data_Light_ConsumerIRSentenceReceive: number

export declare const timingAppleNTSC_ST: number

export declare const kIOMirrorAttribute: number

export declare const kIOFBNS_MessageMask: number

export declare const kHIDUsage_Snsr_Electrical_Power: number

export declare const kMMCCmd_RESERVE_10: number

export declare const kHIDUsage_Dig_GestureCharacterEncoding: number

export declare const kColorTwoPageConnect: number

export declare const kIODPEventSinkSpecific: number

export declare const kIOTimingIDVESA_1600x1200_70hz: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSymmetryPhase: number

export declare const kIOMaxBusStall25usec: number

export declare const kHIDUsage_BS_Usenext: number

export declare const kHIDUsage_KeyboardPause: number

export declare const kIOAudioPortTypeMixer: number

export declare const kHIDUsage_Snsr_Data_Location_AltitudeSeaLevel: number

export declare const kHIDUsage_Ord_Instance2: number

export declare const kIOPSFamilyCodeExternal4: number

export declare const kHIDUsage_PID_PhysicalInterfaceDevice: number

export declare const kHIDUsage_PD_Input: number

export declare const kHIDUsage_Csmr_FanSpeed: number

export declare const kHIDUsage_Button_54: number

export declare const kHIDUsage_Button_208: number

export declare const kSCSIUntaggedTaskIdentifier: number

export declare const kSCCCmd_RESERVE_10: number

export declare const kHIDUsage_BCS_EAN2_3LabelControlReport: number

export declare const kVideoSimpleI2CTypeMask: number

export declare const kConnectionVideoBest: number

export declare const kIOScaleRotate0: number

export declare const kHIDUsage_Csmr_ContactPhoneNumberMobile: number

export declare const kRangeSupportsSyncOnGreenMask: number

export declare const kIOBlitWaitAll: number

export declare const kHIDUsage_Csmr_Mark: number

export declare const kSCSICmd_MAINTENANCE_IN: number

export declare const kConnectionPower: number

export declare const kUSBDeviceCapabilityBillboardAltMode: number

export declare const kHIDUsage_Snsr_Scanner_NFC: number

export declare const kHIDUsage_Button_91: number

export declare const kHIDUsage_Button_102: number

export declare const kHIDUsage_BCS_PolarityInvertedBarCode: number

export declare const kIOAudioChannelLabel_RightTopMiddle: number

export declare const kHIDUsage_BS_InhibitCharge: number

export declare const kFWIsochChannelDefaultFlags: number

export declare const kHIDUsage_Button_14: number

export declare const EXTERNAL_SPDIF_INTERFACE: number

export declare const kFWBIBLinkSpeedPhase: number

export declare const kUSBRqGetStatus: number

export declare const kIOPMFairValue: number

export declare const kHIDUsage_LED_IndicatorBlue: number

export declare const kHIDUsage_Csmr_ACForward: number

export declare const kHIDUsage_Csmr_ACSelectRow: number

export declare const kHIDUsage_Snsr_Property_Mechanical_VibrationState: number

export declare const kHIDUsage_Snsr_Data_Light: number

export declare const kPMMinutesToSpinDown: number

export declare const kATAOperationTypeRead: number

export declare const spGammaDir: number

export declare const kSCSIProtocolIdentifier_None: number

export declare const kINQUIRY_PERIPHERAL_TYPE_UnknownOrNoDeviceType: number

export declare const kHIDUsage_Snsr_Event_SensorState_NotAvailable: number

export declare const kHIDUsage_Snsr_Data_Location_FixQuality: number

export declare const kIORangePixelEncodingYCbCr420: number

export declare const kHIDUsage_Snsr_Data_Biometric_HumanProximityRange: number

export declare const kIOAudioChannelLabel_CenterSurround: number

export declare const kATAIdentifySectorsPerTrack: number

export declare const kHIDUsage_PD_InputID: number

export declare const kMultiModeCRT2Connect: number

export declare const timingApple13: number

export declare const kUSBIrDABridgeSubClass: number

export declare const kHIDUsage_PD_Boost: number

export declare const kSBCWOCmd_READ_10: number

export declare const kHIDPage_VendorDefinedStart: number

export declare const kIOUSBEndpointDescriptorTransferTypeControl: number

export declare const kHIDUsage_BCS_DLMethodCheckForDiscrete: number

export declare const kIOTimingIDVESA_640x480_75hz: number

export declare const kHIDPage_Button: number

export declare const kFWBroadcastNodeID: number

export declare const kHIDUsage_Snsr_Mechanical_Weight: number

export declare const kConnectionRedGammaScale: number

export declare const kHIDUsage_KeyboardF1: number

export declare const kMMCCmd_READ_DVD_STRUCTURE: number

export declare const kHIDUsage_Keypad0: number

export declare const timingVESA_1280x1024_75hz: number

export declare const kIOHIDStandardTypeJIS: number

export declare const kHIDUsage_BCS_ElectronicArticleSurveillanceNotification: number

export declare const kHIDUsage_BS_PowerFail: number

export declare const kMMCCmd_RELEASE_10: number

export declare const kHIDUsage_LED_Ready: number

export declare const kMillisecondScale: number

export declare const kSENSE_EOM_Mask: number

export declare const kIOUSBLinkSpeedFull: number

export declare const kMMCCmd_READ_HEADER: number

export declare const kIOHIDElementFlagsRelativeMask: number

export declare const kIOFBCurrentShmemVersion: number

export declare const kUSBDeviceCountExceededNotificationType: number

export declare const kIOFBAVSignalTypeHDMI: number

export declare const kHIDUsage_PD_ConfigTemperature: number

export declare const kHIDUsage_Csmr_ACExpand: number

export declare const kHIDUsage_WD_ScaleStatusInMotion: number

export declare const kHIDUsage_Csmr_KeyboardFormFactor: number

export declare const kHIDPage_Arcade: number

export declare const kSBCCmd_MODE_SELECT_6: number

export declare const kIOAudioSMPTETimeType60: number

export declare const kMicrosecondScale: number

export declare const kPMLastAggressivenessType: number

export declare const kHIDUsage_LED_ScrollLock: number

export declare const kIOAudioPortTypeInput: number

export declare const kINQUIRY_Byte5_ACC_Mask: number

export declare const kHIDUsage_Snsr_Sensor: number

export declare const kUSB_HSFSEPDesc_wMaxPacketSize_Mult_Mask: number

export declare const kHIDUsage_AD_Reserved: number

export declare const kUSBVendorSpecificClass: number

export declare const kHIDUsage_BD_ScreenReaderIdentifier: number

export declare const kHIDUsage_PD_PowerSupply: number

export declare const kIOBlitTypeSourceKeyColorNotEqual: number

export declare const kHIDUsage_Csmr_ACIndentyDecrease: number

export declare const kIOFixedCLUTPixels: number

export declare const kSCSIServiceAction_READ_LONG_16: number

export declare const kREAD_CAPACITY_RTO_Enabled: number

export declare const kHIDUsage_KeyboardQuote: number

export declare const kCompositeSyncMask: number

export declare const kIOVideoFeatureControlClassIDBacklightCompensation: number

export declare const kSCSICmd_READ_LONG: number

export declare const mRowBytes: number

export declare const kIOFBLinkVoltageLevel2: number

export declare const kIORangeBitsPerColorComponentNotSupported: number

export declare const kIOAudioChannelLabel_LeftTopRear: number

export declare const kHIDUsage_Snsr_Data_Electrical_Current: number

export declare const kHIDUsage_Snsr_Orientation_Distance3D: number

export declare const kHIDUsage_Button_234: number

export declare const kHIDPage_BatterySystem: number

export declare const kIOBlitFramebufferDestination: number

export declare const kHIDUsage_PID_TypeSpecificBlockHandle: number

export declare const kHIDUsage_PID_EffectPlaying: number

export declare const kHIDUsage_BCS_UPC_EANControlReport: number

export declare const OUTPUT_NULL: number

export declare const kHIDUsage_BCS_EAN13FlagDigit2: number

export declare const kHIDUsage_GD_Vbry: number

export declare const cscGetVideoParameters: number

export declare const kHIDUsage_Button_194: number

export declare const kUSBFeatureTestMode: number

export declare const kIOPMPreventSleep: number

export declare const kUSBRqTypeMask: number

export declare const kHIDUsage_GD_SystemBreak: number

export declare const kStandbyTimerBit: number

export declare const kSBCCmd_VERIFY_10: number

export declare const kHIDUsage_BCS_NotOnFileVolume: number

export declare const kHIDUsage_Snsr_Property_ReleaseData: number

export declare const kConfigUnitSWVersIIDC100: number

export declare const kIOPMInitialDeviceState: number

export declare const kSCCCmd_MODE_SENSE_10: number

export declare const kSBCCmd_MOVE_MEDIUM_ATTACHED: number

export declare const kIOWSAA_Transactional: number

export declare const kSCCCmd_SPARE_IN: number

export declare const kHIDUsage_BCS_EAN13FlagDigit1: number

export declare const kDVDKeyFormatAGID_CPRM: number

export declare const kINQUIRY_PERIPHERAL_TYPE_DirectAccessSBCDevice: number

export declare const kHIDUsage_Game_GamepadTrigger: number

export declare const kIOMapGuardedLarge: number

export declare const kHIDUsage_Dig_Reserved: number

export declare const kHIDUsage_Tfon_LineBusyTone: number

export declare const kUSBCommClass: number

export declare const kIOTimingIDVESA_800x600_60hz: number

export declare const kHIDUsage_VR_Vest: number

export declare const kIOMediumEthernet10GBaseSR: number

export declare const kINQUIRY_PERIPHERAL_TYPE_EnclosureServicesSESDevice: number

export declare const kHIDUsage_Dig_WhiteBoard: number

export declare const kIOScalingInfoValid: number

export declare const kHIDUsage_BCS_PowerupBeep: number

export declare const kHIDUsage_WD_ScaleStatusRequiresCalibration: number

export declare const kSBCCmd_XDWRITE_EXTENDED: number

export declare const kSCSICmd_RELEASE_6: number

export declare const kINQUIRY_RESPONSE_DATA_FORMAT_Mask: number

export declare const IOPMBadSpecification: number

export declare const kCDFeaturesReWriteableMask: number

export declare const kDVDBookTypeHDRAM: number

export declare const kHIDUsage_Button_193: number

export declare const kHIDUsage_Csmr_ALLocalMachineBrowser: number

export declare const kESCSeven19Inch: number

export declare const kHIDUsage_BS_ChargingIndicator: number

export declare const kIOHIDNumLockState: number

export declare const kIOUSBSuperSpeedDeviceCapabilityU1DevExitLatMax: number

export declare const kSyncPositivePolarityMask: number

export declare const kHIDUsage_Snsr_Property_PowerState: number

export declare const kIOUSBUSB20ExtensionCapabilityBESLPhase: number

export declare const kUSBRqClearFeature: number

export declare const kIOPSFamilyCodeExternal7: number

export declare const kINQUIRY_Page80_PageCode: number

export declare const kIOHIDElementFlagsVolativeMask: number

export declare const kUSBGangOverCurrentNotificationType: number

export declare const kHIDUsage_Dig_SecondaryTipSwitch: number

export declare const kIONetworkSupportedPacketFilters: number

export declare const kHIDUsage_Haptics_WaveformVendorPage: number

export declare const kIOAudioChannelLabel_CenterSurroundDirect: number

export declare const kHIDUsage_Csmr_ALNextTaskOrApplication: number

export declare const kIOVideoControlElementMaster: number

export declare const kIOMediumIEEE80211Auto: number

export declare const kNTSCConnect: number

export declare const kBDMediaTypeRE: number

export declare const kUSBCapsLockKey: number

export declare const kREAD_CAPACITY_PROT_Disabled: number

export declare const kSCSIProtocolIdentifier_FireWire: number

export declare const kHIDUsage_BCS_SetParameterDefaultValues: number

export declare const kSCSIProtocolIdentifier_ADT: number

export declare const kSGCCmd_RESERVE_6: number

export declare const kSCSICmd_MOVE_MEDIUM_ATTACHED: number

export declare const kRangeSupportsSignal_1000_0400_Mask: number

export declare const kUSBSuperSpeedEndpointCompanion: number

export declare const kHIDUsage_Button_132: number

export declare const kHIDUsage_LED_Player1: number

export declare const kHIDUsage_Csmr_BassBoost: number

export declare const kCSRStateClearAddress: number

export declare const kHIDUsage_Csmr_ACRefresh: number

export declare const kSCSICmd_READ_BUFFER_CAPACITY: number

export declare const kHIDUsage_Sprt_7Wood: number

export declare const kHIDUsage_Csmr_Loudness: number

export declare const kDVDKeyFormatSetRegion: number

export declare const kINQUIRY_Byte6_MULTIP_Mask: number

export declare const kHIDUsage_LED_BatteryOK: number

export declare const kHIDUsage_Tfon_TonesOff: number

export declare const kCSRClockInfo2Address: number

export declare const kSPCProcCmd_SEND: number

export declare const kHIDUsage_Button_82: number

export declare const kHIDUsage_LED_EqualizerEnable: number

export declare const kIOFBUserRequestProbe: number

export declare const kIOPMUndefinedValue: number

export declare const kHIDUsage_LED_CapsLock: number

export declare const kATAMultipleLogicalSectorsBit: number

export declare const kRBCCmd_SYNCHRONIZE_CACHE: number

export declare const kHIDUsage_Ord_Instance1: number

export declare const kIOBlitTypeDestKeyColorEqual: number

export declare const kHIDUsage_PD_OverTemperature: number

export declare const kHIDUsage_Snsr_Data_Location_FixTypeNoFix: number

export declare const kHIDUsage_Sim_FlightStick: number

export declare const kHIDUsage_Snsr_Other_Custom: number

export declare const kHIDUsage_Csmr_BalanceRight: number

export declare const kATASupportsPowerManagementMask: number

export declare const kFWAckBusyA: number

export declare const kHIDUsage_Csmr_MediaSelectTuner: number

export declare const kHIDUsage_Button_80: number

export declare const kHIDUsage_Snsr_Data_Environmental_Reserved: number

export declare const kIsMonoDev: number

export declare const kHIDUsage_LED_PaperJam: number

export declare const kHIDUsage_LED_Conference: number

export declare const kIOAnalogSignalLevel_0700_0000: number

export declare const kHIDUsage_Csmr_Sleep: number

export declare const kSESCmd_RELEASE_6: number

export declare const kSCCCmd_MODE_SELECT_10: number

export declare const kHIDUsage_Dig_CapacitiveHeatMapProtocolVersion: number

export declare const kCDMediaTypeR: number

export declare const kHIDUsage_LED_Player7: number

export declare const kHIDUsage_GD_DockableDeviceDockingState: number

export declare const kHIDUsage_Snsr_Event_SensorState_NoData: number

export declare const kScaleCanDownSamplePixelsMask: number

export declare const kHIDUsage_Csmr_ALWirelessStatus: number

export declare const kHIDUsage_Tfon_SpeakerPhone: number

export declare const kHIDUsage_WD_ScaleControlReport: number

export declare const kHIDUsage_BCS_TriggerMode: number

export declare const kDDCConnect: number

export declare const kHIDUsage_Csmr_MenuUp: number

export declare const kDVDBookTypePlusRWDoubleLayer: number

export declare const kDCLSendBufferOp: number

export declare const kHIDUsage_AD_DisplayControlReport: number

export declare const kHIDUsage_Snsr_Data_Custom_Value3: number

export declare const kHIDUsage_Csmr_Snapshot: number

export declare const kHIDUsage_Snsr_Property_PersistentUniqueID: number

export declare const kIOUSBSuperSpeedHubCharacteristicsOverCurrentMask: number

export declare const kHIDUsage_PID_Offset: number

export declare const kIOAudioDeviceTransportTypeUSB: number

export declare const kHIDUsage_Tfon_PhoneKeyB: number

export declare const kSSCPrinterCmd_LOG_SENSE: number

export declare const kIOAudioSMPTETimeValid: number

export declare const kDCLSendPacketStartOp: number

export declare const kMMCCmd_PLAY_RELATIVE_12: number

export declare const kSSCPrinterCmd_STOP_PRINT: number

export declare const kIODisplayDitherDefault: number

export declare const kATAIdentifyMinorVersion: number

export declare const kIOUSBUSB20ExtensionCapabilityBESLDPhase: number

export declare const TELEPHONY_TELEPHONE: number

export declare const kHIDUsage_Button_97: number

export declare const kHIDUsage_KeyboardErrorRollOver: number

export declare const kIOBlitSourceCGSSurface: number

export declare const kHIDUsage_Snsr_Data_Custom_Value5: number

export declare const kCSRStateStateTesting: number

export declare const kHIDUsage_Snsr_Data_Motion_AccelerationAxisY: number

export declare const kIOAudioControlChannelIDDefaultFrontLeftCenter: number

export declare const kIOUSBFindInterfaceDontCare: number

export declare const kDVDFeaturesReWriteableBit: number

export declare const kIOAudioToggleControlSubTypePhaseInvert: number

export declare const kHIDUsage_Button_163: number

export declare const EMBEDDED_MULTITRACK_RECORDER: number

export declare const kHIDUsage_Csmr_ALEmailReader: number

export declare const kIOMaxBusStall20usec: number

export declare const kUSBOther: number

export declare const kHIDUsage_Tfon_ForwardCalls: number

export declare const kHIDUsage_Csmr_ShowCounter: number

export declare const kHIDUsage_LED_CallPickup: number

export declare const kIOMapPostedReordered: number

export declare const kFWResponsePending: number

export declare const kHIDUsage_Snsr_Modifier_PeriodMax: number

export declare const kHIDUsage_PID_ET_Inertia: number

export declare const kHIDUsage_AD_CharacterWidth: number

export declare const kIOSyncPositivePolarity: number

export declare const kHIDUsage_Csmr_ACAllCaps: number

export declare const kIOAudioStreamAlignmentLowByte: number

export declare const kIOHIDEventQueueTypeKernel: number

export declare const kHIDUsage_Dig_GestureCharacterQuality: number

export declare const kMMCCmd_PLAY_RELATIVE_10: number

export declare const kHIDUsage_BD_RouterSet1: number

export declare const kIOUSBLinkSpeedHigh: number

export declare const EMBEDDED_EQUALIZATION_NOISE: number

export declare const kHIDUsage_LED_UsageInUseIndicator: number

export declare const kUSBCommCAPISubClass: number

export declare const kModeValid: number

export declare const kDVDMediaTypeHDRAM: number

export declare const kHIDUsage_Button_214: number

export declare const kHIDUsage_AD_ErrNotaloadablecharacter: number

export declare const kDCLSkipCycleOp: number

export declare const kHIDUsage_Sim_SpaceshipSimulationDevice: number

export declare const oneBitMode: number

export declare const kESCSixMSB1: number

export declare const kConnectionControllerDepthsSupported: number

export declare const kIOUSBPingResponseTimeNs: number

export declare const kIODisplayRGBColorComponentBits12: number

export declare const kIOUSBEndpointDescriptorSynchronizationTypeSynchronous: number

export declare const kIOBitsPerColorComponent10: number

export declare const kHIDUsage_Button_17: number

export declare const kDisplaySubPixelShapeRound: number

export declare const kIOUSBEndpointDescriptorTransferTypePhase: number

export declare const kHIDUsage_Csmr_ScanNextTrack: number

export declare const kHIDUsage_PD_ConfigVoltage: number

export declare const kHIDUsage_Csmr_ContactMisc: number

export declare const kVideoReplyMicroSecDelayMask: number

export declare const kConnectionIgnore: number

export declare const kIOPMAssertionLevelOn: number

export declare const kSGCCmd_MODE_SELECT_6: number

export declare const kHIDUsage_GD_CoolantPump: number

export declare const kCSRNodeIDPhase: number

export declare const kSPCProcCmd_LOG_SENSE: number

export declare const kSBCWOCmd_SEND_DIAGNOSTICS: number

export declare const timingSony_1900x1200_76hz: number

export declare const cscDirectSetEntries: number

export declare const kATAEnableUltraDMAModeMask: number

export declare const kIOPacketFilterBroadcast: number

export declare const kHIDUsage_GD_Vbrz: number

export declare const kHIDUsage_Button_218: number

export declare const kIOMirrorIsPrimary: number

export declare const kHIDUsage_Snsr_Orientation_Compass2D: number

export declare const kESCThree21InchMonoRadius: number

export declare const kMultiModeCRT3Connect: number

export declare const EXTERNAL_TDIF: number

export declare const kUSBEndPtShift: number

export declare const kIOTimingIDVESA_1600x1200_65hz: number

export declare const kHIDUsage_PID_BlockLoadReport: number

export declare const kHIDUsage_Csmr_ACPasteSpecial: number

export declare const kHIDUsage_Button_177: number

export declare const kATAIdentifySerialNumber: number

export declare const kHIDUsage_Keyboard_Reserved: number

export declare const kIOMapReadOnly: number

export declare const kCSRArgumentLoAddress: number

export declare const kSCSICmd_SERVICE_ACTION_IN: number

export declare const kFirstIOKitNotificationType: number

export declare const kPMPowerSource: number

export declare const kHIDUsage_Dig_DeviceIdentifier: number

export declare const kIORangeDynamicRangeTraditionalGammaHDR: number

export declare const kHIDUsage_Haptics_WaveformNone: number

export declare const kHIDUsage_Sprt_PowerWedge: number

export declare const kIODisplayYCbCr422ColorComponentBits12: number

export declare const kSCCCmd_MODE_SENSE_6: number

export declare const kHIDUsage_BCS_EAN8FlagDigit3: number

export declare const kHIDUsage_Csmr_SurroundMode: number

export declare const kHIDUsage_BCS_ConstantElectronicArticleSurveillance: number

export declare const kGetDeviceStatus: number

export declare const kHIDUsage_Snsr_Property_Accuracy: number

export declare const kHIDUsage_GD_Vy: number

export declare const kSBCModePageFlexibleDiskCode: number

export declare const kIOAudioSelectorControlSelectionValueSPDIF: number

export declare const kSENSE_KEY_NO_SENSE: number

export declare const kHIDUsage_BCS_GoodReadToneFrequency: number

export declare const kHIDUsage_PID_MoveDestination: number

export declare const kHIDUsage_Game_GunAutomatic: number

export declare const kUSBNoUserNotificationType: number

export declare const kINQUIRY_PERIPHERAL_TYPE_StorageArrayControllerSCC2Device: number

export declare const kSCSICmd_VERIFY_16: number

export declare const kATAMultipleLogicalSectorsMask: number

export declare const kHIDUsage_BD_Undefined: number

export declare const kIODisplayYCbCr422ColorComponentBits16: number

export declare const kIO32BGRAPixelFormat: number

export declare const kScaleInvertXMask: number

export declare const kCSRStateState: number

export declare const kIOVideoControlBaseClassIDFeature: number

export declare const kHIDUsage_AD_DisplayAttributesReport: number

export declare const kIO1IndexedGrayPixelFormat: number

export declare const kHIDUsage_Snsr_Data_Location_GPSSelectionModeAutonomous: number

export declare const kIOHIDCapsLockState: number

export declare const kIODigitalSignal: number

export declare const kIOTimingIDVESA_800x600_85hz: number

export declare const kIOMediaAttributeRemovableMask: number

export declare const kIOInterlacedCEATiming: number

export declare const timingApplePAL_STconv: number

export declare const kIOAudioInputPortSubTypeLine: number

export declare const kHIDUsage_Game_PitchUpOrDown: number

export declare const kIOVideoControlScopePlayThrough: number

export declare const kATAIdentifyMajorVersion: number

export declare const kDVDFeaturesPlusRBit: number

export declare const kDisplayModeSimulscanFlag: number

export declare const kHIDUsage_AD_ASCIICharacterSet: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_LowThresholdCrossDown: number

export declare const kFWAckTypeError: number

export declare const kIOVideoControlScopeGlobal: number

export declare const kHIDUsage_GD_SystemMicrophoneMute: number

export declare const kHIDPage_Telephony: number

export declare const kIOUSBLinkSpeed10Gbps: number

export declare const kIOMediumIEEE80211FH1: number

export declare const kIOWSAA_To_Accelerated: number

export declare const kIOBlitWaitContext: number

export declare const kIODisplayYCbCr422ColorComponentBits6: number

export declare const kHIDUsage_Haptics_VendorWaveformLast: number

export declare const kHIDUsage_KeyboardF12: number

export declare const kIOFBDisplayState_Mask: number

export declare const kUSBVideoControlSubClass: number

export declare const kIOTimingIDVESA_1280x960_60hz: number

export declare const kIOAudioStreamNumericRepresentationIEEE754Float: number

export declare const kIOSystemPowerAttribute: number

export declare const kConfigBusInfoBlockLengthPhase: number

export declare const cscGetFeatureConfiguration: number

export declare const kSBCCmd_PERSISTENT_RESERVE_OUT: number

export declare const kHIDUsage_LED_DoNotDisturb: number

export declare const kIOFBMaxCursorDepth: number

export declare const kIOVideoFeatureControlClassIDFocus: number

export declare const kIOAudioControlUsageCoreAudioProperty: number

export declare const kHIDUsage_Sim_Steering: number

export declare const kIONetworkStackRegisterInterfaceAll: number

export declare const kATAIdentifyCurrentMultipleSectors: number

export declare const timingVESA_800x600_56hz: number

export declare const kHIDUsage_Snsr_Data_Location_GPSSelectionModeSimulator: number

export declare const kIOTimingIDSony_1920x1080_72hz: number

export declare const kIOAudioTimeStampSampleHostTimeValid: number

export declare const kIOUSBEndpointDescriptorUsageTypeIsocReserved: number

export declare const kPowerStateSleepNoDPMSBit: number

export declare const kIOAudioControlTypeToggle: number

export declare const kHIDUsage_Csmr_KeyboardInputAssistPrevious: number

export declare const kINQUIRY_PERIPHERAL_TYPE_SequentialAccessSSCDevice: number

export declare const kHIDUsage_Csmr_ALVirusProtection: number

export declare const kRSCTwo: number

export declare const kSCSIServiceAction_SET_PRIORITY: number

export declare const kHIDUsage_Csmr_ACViewClock: number

export declare const kHIDUsage_PD_PowerSummary: number

export declare const kSESCmd_REQUEST_SENSE: number

export declare const kSyncPositivePolarityBit: number

export declare const kHIDUsage_PID_TypeSpecificBlockOffset: number

export declare const kHIDUsage_Button_73: number

export declare const kIOInhibitCache: number

export declare const kHIDUsage_Csmr_ACJustifyLeft: number

export declare const kIOWSAA_StateMask: number

export declare const kINQUIRY_Page83_IdentifierTypeRelativePortIdentifier: number

export declare const IOPMContextRetained: number

export declare const kSBCModePageCaching_MF_Mask: number

export declare const kIOWSAA_DeferEnd: number

export declare const kSBCCmd_REQUEST_SENSE: number

export declare const kINQUIRY_Byte7_SYNC_Mask: number

export declare const kCDTOCFormatTEXT: number

export declare const kIOPixelEncodingYCbCr444: number

export declare const kHIDUsage_Snsr_Data_Motion_State: number

export declare const kIOColorimetryNotSupported: number

export declare const kUSBHubClass: number

export declare const kIOPMContextRetained: number

export declare const kModeShowNow: number

export declare const kHIDUsage_Snsr_Data_Orientation_HeadingCompensatedTrueNorth: number

export declare const kHIDUsage_Dig_ContactIdentifier: number

export declare const kHIDUsage_Csmr_Media: number

export declare const kIOMediumEthernet100BaseTX: number

export declare const kIOPMExternalPower: number

export declare const timingVESA_1600x1200_60hz: number

export declare const kHIDUsage_Snsr_Data_Motion: number

export declare const kIOBlitWaitGlobal: number

export declare const cscSetPowerState: number

export declare const kDVDFeaturesHDRWMask: number

export declare const kHIDUsage_Snsr_Motion_Accelerometer3D: number

export declare const kHIDUsage_Csmr_ACMaximize: number

export declare const kPMMinutesToSleep: number

export declare const kIOPMDriverAssertionBluetoothHIDDevicePairedBit: number

export declare const timingVESA_1280x960_75hz: number

export declare const kIOUSBHubPort2PortExitLatencyNs: number

export declare const kHIDUsage_Sprt_2Iron: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilityReserved: number

export declare const kHIDUsage_Csmr_ACExpandAll: number

export declare const kIOVideoSelectorControlClassIDDataSource: number

export declare const kIOBlitSourceMemory: number

export declare const kIOColorimetryDCIP3: number

export declare const kSBCWOCmd_WRITE_AND_VERIFY_10: number

export declare const kUSBAddress_Shift: number

export declare const kIOPMLowPower: number

export declare const kIOUSBDeviceRequestGetDescriptor: number

export declare const kHIDUsage_KeyboardLANG5: number

export declare const kHIDUsage_BD_BrailleDPadCenter: number

export declare const kHIDUsage_Button_57: number

export declare const kSENSE_DATA_VALID_Mask: number

export declare const kConfigLeafDirLength: number

export declare const kHIDUsage_Snsr_Data_Mechanical_AbsolutePressure: number

export declare const kIOFBRedGammaScaleAttribute: number

export declare const kHIDUsage_Csmr_KeyboardKeyType: number

export declare const kHIDUsage_Csmr_ALVoicemail: number

export declare const kHIDUsage_BCS_UltraCode: number

export declare const kIOFBHDCPLimit_AllowAll: number

export declare const kHIDUsage_Button_41: number

export declare const kHIDUsage_Dig_XTilt: number

export declare const kATASupportsFlushCacheMask: number

export declare const kHIDUsage_Sim_TankSimulationDevice: number

export declare const kModeRequiresPan: number

export declare const kCSRBroadcastChannel: number

export declare const kHIDUsage_Csmr_KeyboardInputAssistPreviousGroup: number

export declare const kAVPowerSuspend: number

export declare const kHIDUsage_Csmr_ALOEMFeatureBrowser: number

export declare const kIOPMDriverAssertionPreventDisplaySleepBit: number

export declare const kIOPMAuxPowerOn: number

export declare const kATASMARTOffLineCollectionMask: number

export declare const kConfigUnitSpecAppleA27: number

export declare const EMBEDDED_UNDEFINED: number

export declare const kFWBIBIrmc: number

export declare const kSCSICmd_PLAY_RELATIVE_10: number

export declare const kDependentConnection: number

export declare const kMessageTrayStateChangeRequestAccepted: number

export declare const INPUT_PERSONAL_MICROPHONE: number

export declare const kIOATAFeaturePowerManagement: number

export declare const kIOBlitTypeShowCursor: number

export declare const kUSBRqSetFeature: number

export declare const kSENSE_KEY_RECOVERED_ERROR: number

export declare const kIORangeSupportsVRR: number

export declare const kIOScaleInvertX: number

export declare const kFWAckBusyB: number

export declare const kSCSICmd_LOG_SELECT: number

export declare const kHIDUsage_Snsr_Motion_MotionDetector: number

export declare const kHIDUsage_Tfon_PhoneKeyA: number

export declare const kSSCPrinterCmd_READ_BUFFER: number

export declare const kIOTimingIDVESA_1024x768_70hz: number

export declare const kHIDUsage_Snsr_Data_Electrical_ElectricalPower: number

export declare const kHIDUsage_Csmr_ALOnlineActivityBrowswer: number

export declare const kHIDUsage_WD_ScaleStatisticsReport: number

export declare const kHIDUsage_Csmr_ALEntertainmentContentBrowser: number

export declare const kHIDUsage_Tfon_PhoneKey3: number

export declare const kHIDUsage_PD_DelayBeforeShutdown: number

export declare const kHIDUsage_Csmr_ACRotate: number

export declare const kIOAsyncCompletionNotificationType: number

export declare const kHIDUsage_Snsr_Orientation: number

export declare const kIOUSBSuperSpeedHubCharacteristicsPowerSwitchingMask: number

export declare const kHIDUsage_Button_209: number

export declare const kHIDUsage_Csmr_ALAlarms: number

export declare const kSBCWOCmd_LOCK_UNLOCK_CACHE: number

export declare const kConfigUnitPollMaskKey: number

export declare const kHIDUsage_PD_Voltage: number

export declare const kIdentifyWordValid: number

export declare const kHIDUsage_BD_BrailleRightControls: number

export declare const timingApple_560x384_60hz: number

export declare const kSetInterface: number

export declare const kHIDUsage_KeyboardReturnOrEnter: number

export declare const kSBCCmd_WRITE_LONG: number

export declare const kSCSICmd_WRITE_16: number

export declare const kSSCSeqCmd_WRITE_6: number

export declare const kCSRSplitTimeoutLoAddress: number

export declare const kHIDUsage_BS_Level3: number

export declare const kIOFBBitRateHBR2: number

export declare const kConnectionSyncEnable: number

export declare const kIOPMThermalLevelWarning: number

export declare const kHIDUsage_BCS_CheckDigitCode99Enable: number

export declare const kHIDUsage_Csmr_Tracking: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkLSEBits: number

export declare const kHIDUsage_Csmr_ACPrint: number

export declare const kDVDKeyClassCSS_CPPM_CPRM: number

export declare const kIOHIDQueueOptionsTypeEnqueueAll: number

export declare const kPowerStateNeedsRefresh: number

export declare const kFWBIBMaxROMPhase: number

export declare const kDVDBookTypeR: number

export declare const kHIDUsage_PID_PoolReport: number

export declare const kIOBlitTypeLines: number

export declare const kUSBFeatureLTMEnable: number

export declare const kHIDUsage_KeyboardLANG8: number

export declare const kHIDUsage_Snsr_Data_Time: number

export declare const kCSRBusDependentRegistersBaseAddress: number

export declare const kIOYUV211PixelFormat: number

export declare const kHIDUsage_Csmr_ApplicationLaunchButtons: number

export declare const kIONetworkFeatureMultiPages: number

export declare const kHIDUsage_WD_WeightUnit: number

export declare const kSENSE_FILEMARK_Mask: number

export declare const kUSBPRimeStream: number

export declare const kCSRPrivateSpaceBaseAddressLo: number

export declare const kINQUIRY_Byte7_VS_Bit: number

export declare const kHIDUsage_Snsr_Property_ConnectionType_Integrated: number

export declare const kHIDUsage_AD_StatNotReady: number

export declare const kDDCForceReadMask: number

export declare const kSSCSeqCmd_MODE_SELECT_6: number

export declare const kHIDUsage_BCS_Code32: number

export declare const kCDFeaturesTAOWriteMask: number

export declare const kRangeSupportsCompositeSyncBit: number

export declare const kHIDUsage_Button_109: number

export declare const kHIDUsage_PID_ET_SawtoothDown: number

export declare const kHIDUsage_PID_BlockLoadStatus: number

export declare const kUSBBillboardVConn4Watt: number

export declare const cscKillIO: number

export declare const kATASMARTOffLineCollectionSuspendedByHost: number

export declare const kIOTimingIDVESA_1024x768_75hz: number

export declare const kIOFBNS_GenerationMask: number

export declare const kSENSE_DATA_VALID: number

export declare const kSENSE_RESPONSE_CODE_Current_Errors: number

export declare const kHIDUsage_LED_IndicatorGreen: number

export declare const kFWBIBNodeCapabilitiesAddress: number

export declare const kINQUIRY_Byte56_IUS_Bit: number

export declare const kSSCSeqCmd_MOVE_MEDIUM: number

export declare const kFramebufferSupportsGammaCorrection: number

export declare const kHardwareDrive: number

export declare const kHIDUsage_PID_Direction: number

export declare const kMMCCmd_READ_DISC_STRUCTURE: number

export declare const kHIDUsage_KeypadComma: number

export declare const kMaxAsyncArgs: number

export declare const kBDMediaTypeUnknown: number

export declare const kInvertingEncodedPixel: number

export declare const kIOPMRootDomainState: number

export declare const kAnalogSignalLevel_1000_0400: number

export declare const kHIDUsage_PID_DC_DevicePause: number

export declare const kIOEthernetWakeOnPacketAddressMatch: number

export declare const kSBCCmd_WRITE_BUFFER: number

export declare const kSCSICmd_PREFETCH: number

export declare const kIOMapPostedWrite: number

export declare const kConvolvedMask: number

export declare const kHIDUsage_Snsr_Data_Time_Month: number

export declare const kIOCatalogResetDefault: number

export declare const kHIDUsage_Sim_Shifter: number

export declare const kREPORT_CAPACITY_16_DataSize: number

export declare const INPUT_MODEM_AUDIO: number

export declare const kHIDUsage_Button_104: number

export declare const kIOPMThermalLevelUnknown: number

export declare const kHIDUsage_KeyboardExecute: number

export declare const kHIDUsage_Snsr_Environmental_AtmosphericPressure: number

export declare const kHIDUsage_BS_TerminateCharge: number

export declare const kIOPMBroadcastAggressiveness: number

export declare const kHIDUsage_PD_AudibleAlarmControl: number

export declare const kHIDUsage_Button_8: number

export declare const timingApple19: number

export declare const kHIDUsage_Snsr_Data_Location_FixQualityGPS: number

export declare const kHIDUsage_Button_140: number

export declare const kUSBbEndpointDirectionMask: number

export declare const kHIDUsage_Button_138: number

export declare const kINQUIRY_PERIPHERAL_QUALIFIER_Connected: number

export declare const kHIDUsage_Snsr_Light_AmbientLight: number

export declare const kSyncOnMask: number

export declare const kHIDUsage_BCS_FirstDiscreteLengthToDecode: number

export declare const EMBEDDED_SATELLITE_RECEIVER_AUDIO: number

export declare const kIOUSBEndpointDescriptorDirectionPhase: number

export declare const kSGCCmd_LOG_SENSE: number

export declare const kHIDUsage_BCS_PeriodicalAutoDiscriminatePlus5: number

export declare const kHIDUsage_AD_ErrFontdatacannotberead: number

export declare const kHIDUsage_LED_Busy: number

export declare const OUTPUT_LOW_FREQUENCY_EFFECTS_SPEAKER: number

export declare const kHIDUsage_Csmr_ACCut: number

export declare const kDiscStatusEmpty: number

export declare const kIOStreamOptionOpenShared: number

export declare const kHIDUsage_KeyboardV: number

export declare const kESCThree21InchRadius: number

export declare const kHIDUsage_KeyboardF7: number

export declare const kHIDUsage_AD_StatReady: number

export declare const kIOCSyncDisable: number

export declare const kHIDUsage_PD_Outlet: number

export declare const kHIDUsage_Button_143: number

export declare const kHIDUsage_Tfon_PhoneKeyPound: number

export declare const kHIDUsage_Button_37: number

export declare const kHIDUsage_BCS_ScannerDataAccuracy: number

export declare const kSBCCmd_READ_6: number

export declare const kHIDUsage_PID_DownloadForceSample: number

export declare const kSCSIDataTransfer_FromInitiatorToTarget: number

export declare const kHIDUsage_Sim_Ballast: number

export declare const kHIDUsage_Csmr_ACJustifyCenterH: number

export declare const kIOAnalogSetupExpected: number

export declare const kIOPMPassThrough: number

export declare const kSESCmd_RECEIVE_DIAGNOSTICS_RESULTS: number

export declare const kHRConnect: number

export declare const kHIDUsage_Csmr_ACLock: number

export declare const kHIDUsage_PID_CustomForceDataReport: number

export declare const kHIDUsage_BCS_AztecCode: number

export declare const kHIDUsage_Csmr_GreenMenuButton: number

export declare const kHIDUsage_BS_BroadcastToCharger: number

export declare const kMMCCmd_PLAY_CD: number

export declare const kIOHIDQueueOptionsTypeNone: number

export declare const kHIDUsage_BCS_GoodReadLampIntensity: number

export declare const kHIDUsage_VR_DisplayEnable: number

export declare const kSBCWOCmd_RESERVE_10: number

export declare const kHIDUsage_PID_AttackLevel: number

export declare const kHIDUsage_Sim_SportsSimulationDevice: number

export declare const kIOATAFeatureSMART: number

export declare const kSBCWOCmd_SEARCH_DATA_EQUAL_12: number

export declare const kHIDUsage_Button_191: number

export declare const kSSCPrinterCmd_SLEW_AND_PRINT: number

export declare const kIOMapAnywhere: number

export declare const kHIDUsage_GD_Ry: number

export declare const kIOAudioDeviceTransportTypeAVB: number

export declare const kIOHIDAccelerationAlgorithmTypeParametric: number

export declare const kIOInterestCalloutFuncIndex: number

export declare const kIOPMDriverAssertionUSBExternalDeviceBit: number

export declare const spVidNamesDir: number

export declare const kHIDUsage_Csmr_ALOEMHelp: number

export declare const kHIDUsage_Button_202: number

export declare const kHIDUsage_PD_iserialNumber: number

export declare const kHIDUsage_BD_BrailleFaceControls: number

export declare const kIOMirrorDefaultAttribute: number

export declare const kHIDUsage_Button_118: number

export declare const kIOFBLinkPreEmphasisLevel2: number

export declare const cscSavePreferredConfiguration: number

export declare const kHIDUsage_BCS_EANTwoLabel: number

export declare const kSGCCmd_READ_BUFFER: number

export declare const kSBCWOCmd_COPY: number

export declare const kHIDUsage_Dig_TouchScreen: number

export declare const kSBCWOCmd_SEEK_10: number

export declare const kDVDBookTypePlusR: number

export declare const kHIDUsage_Dig_Puck: number

export declare const kIOMediumIEEE80211None: number

export declare const kHIDUsage_Snsr_Property_Location_AccuracyMedium: number

export declare const kSPCProcCmd_COMPARE: number

export declare const kIOMapReference: number

export declare const kDCLReceiveBufferOp: number

export declare const kHIDUsage_BCS_Code39: number

export declare const kINQUIRY_Byte6_MCHNGR_Bit: number

export declare const kHIDUsage_LED_SlowBlinkOnTime: number

export declare const kDVDFeaturesHDRBit: number

export declare const kHIDUsage_Csmr_ACDistributeH: number

export declare const kHIDUsage_KeyboardF15: number

export declare const kModeStretched: number

export declare const kHIDUsage_Csmr_ACOpen: number

export declare const kIOAudioSMPTETimeType60Drop: number

export declare const kHIDUsage_BCS_CodeOne: number

export declare const kHIDUsage_AD_ScreenSaverDelay: number

export declare const kHIDUsage_BCS_HandsFreeScanning: number

export declare const kIOUSBDeviceStatusLTMEnable: number

export declare const kSPCProcCmd_COPY: number

export declare const kMMCCmd_RELEASE_6: number

export declare const kIORangeDynamicRangeDolbyNormalMode: number

export declare const kIOHIDOptionsTypeNone: number

export declare const kScaleRotate0Mask: number

export declare const kHIDUsage_PD_PowerConverterID: number

export declare const kUSBBillboardVConn1Watt: number

export declare const kIOAudioChannelLabel_Center: number

export declare const kHIDUsage_PD_Temperature: number

export declare const kHIDUsage_KeyboardX: number

export declare const kRBCCmd_READ_10: number

export declare const kHIDUsage_Button_98: number

export declare const kHIDUsage_PD_CommunicationLost: number

export declare const kHIDUsage_Csmr_ContactFirstName: number

export declare const kHIDUsage_Tfon_PriorityRingTone: number

export declare const kUSBCommTelephoneSubClass: number

export declare const kHIDUsage_PID_DeviceManagedPool: number

export declare const kSCSICmd_SET_READ_AHEAD: number

export declare const kHIDUsage_Button_44: number

export declare const kHIDUsage_Dig_BatteryStrength: number

export declare const kMMCCmd_COPY_AND_VERIFY: number

export declare const kIOMirrorIsMirrored: number

export declare const kMMCCmd_SEND_OPC_INFORMATION: number

export declare const kHIDUsage_Game_3DGameController: number

export declare const kCDFeaturesAnalogAudioBit: number

export declare const kHIDUsage_BCS_TransmitCheckDigit: number

export declare const kHIDUsage_Sprt_StickFaceAngle: number

export declare const kMirrorCanChangePixelFormatMask: number

export declare const kSBCCmd_PERSISTENT_RESERVE_IN: number

export declare const kHIDUsage_Button_183: number

export declare const kUSBDeviceCapabilityBillboard: number

export declare const kHIDUsage_BS_AbsoluteStateOfCharge: number

export declare const kHIDUsage_KeypadSlash: number

export declare const kConnectionEnable: number

export declare const kINQUIRY_Page83_CodeSetUTF8Data: number

export declare const kSSCPrinterCmd_REPORT_LUNS: number

export declare const kHIDUsage_Button_18: number

export declare const kUSBNoStream: number

export declare const kHIDUsage_AD_Columns: number

export declare const kIOBlitFixedSource: number

export declare const kConnectionProbe: number

export declare const kCDFeaturesCDDAStreamAccurateMask: number

export declare const kSCSICmd_REBUILD: number

export declare const kHIDUsage_Snsr_Property_Model: number

export declare const kIOWriteThruCache: number

export declare const kHIDUsage_BCS_AddEAN2_3LabelDefinition: number

export declare const kHIDUsage_PID_BlockHandle: number

export declare const kFWResponseConflictError: number

export declare const kHIDUsage_Snsr_Property_Mechanical: number

export declare const cscGetInterrupt: number

export declare const kHIDUsage_Snsr_Data_Motion_AngularPositionZAxis: number

export declare const kIODisplayYCbCr422ColorComponentBits14: number

export declare const kHIDUsage_PD_VoltageOutOfRange: number

export declare const kSSCSeqCmd_READ_BLOCK_LIMITS: number

export declare const kConfigModuleSpecIdKey: number

export declare const kSCSICmd_ACCESS_CONTROL_OUT: number

export declare const kSPCCmd_SET_DEVICE_IDENTIFIER: number

export declare const kHIDUsage_KeyboardF21: number

export declare const kIODriverPowerAttribute: number

export declare const kHIDUsage_WD_WeightUnitGrains: number

export declare const kHIDUsage_PID_LoopCount: number

export declare const kSENSE_KEY_HARDWARE_ERROR: number

export declare const kSGCCmd_PORT_STATUS: number

export declare const kHIDUsage_Snsr_Other_Generic: number

export declare const kVideoCombinedI2CType: number

export declare const kATASMARTSelfTestStatusAbortedByHost: number

export declare const kSPCCmd_RECEIVE_COPY_RESULTS: number

export declare const kHIDUsage_Button_142: number

export declare const kATAPhysicalLogicalEnabledMask: number

export declare const kIOHIDActivityDisplayOn: number

export declare const kHIDUsage_Button_66: number

export declare const kUSBRqGetState: number

export declare const kIOPMSystemCapabilityDidChange: number

export declare const kDVDFeaturesPlusRWMask: number

export declare const kSPCProcCmd_TEST_UNIT_READY: number

export declare const kSBCWOCmd_SEARCH_DATA_LOW_12: number

export declare const kINQUIRY_Page83_PageCode: number

export declare const cscDrawHardwareCursor: number

export declare const kINQUIRY_ANSI_VERSION_Mask: number

export declare const kHIDUsage_BS_Level2: number

export declare const kChecksumValidCookie: number

export declare const kSPCCmd_PERSISTENT_RESERVE_OUT: number

export declare const kHIDUsage_KeyboardDeleteForward: number

export declare const kIOTimingIDInvalid: number

export declare const kHIDUsage_Sim_WeaponsArm: number

export declare const kHIDUsage_Button_126: number

export declare const kHIDUsage_Snsr_Orientation_Inclinometer3D: number

export declare const kSBCWOCmd_READ_12: number

export declare const kHIDUsage_Button_164: number

export declare const kIOFBDisplayState: number

export declare const kIOTimingIDVESA_1920x1440_75hz: number

export declare const kHIDUsage_AD_CursorBlink: number

export declare const kSSCSeqCmd_SEND_DIAGNOSTICS: number

export declare const kHIDPage_Scale: number

export declare const kIOUSBSuperSpeedEndpointCompanionDescriptorMaxBurst: number

export declare const kIOUSBDeviceFeatureSelectorLTMEnable: number

export declare const kUSBDiagnosticDeviceInterfaceClass: number

export declare const kHIDUsage_Csmr_Weekly: number

export declare const kSCSICmd_READ_DEFECT_DATA_12: number

export declare const kSSCSeqCmd_VERIFY_6: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkSymmetric: number

export declare const kSCSICmd_REQUEST_SENSE: number

export declare const kIORangeSupportsSignal_0700_0000: number

export declare const kIOAudioStreamAlignmentHighByte: number

export declare const kHIDUsage_BS_BelowRemainingCapacityLimit: number

export declare const kHIDUsage_Snsr_Scanner_RFID: number

export declare const kHIDUsage_LED_BatteryLow: number

export declare const kHIDUsage_Button_70: number

export declare const kDVDCPRMRegion1: number

export declare const kHIDUsage_Snsr_Data_Motion_AccelerationAxisZ: number

export declare const kCDFeaturesRawWriteMask: number

export declare const kHIDUsage_KeyboardF: number

export declare const kIOHIDKeyboardPhysicalLayoutType103: number

export declare const kCSRClockStrobeArrivedHiAddress: number

export declare const kSCSICmd_READ_DEFECT_DATA_10: number

export declare const kHIDUsage_WD_ScaleScaleClassIIIEnglish: number

export declare const kHIDUsage_BCS_MotorTimeout: number

export declare const kSCSICmd_REDUNDANCY_GROUP_OUT: number

export declare const kIODynamicRangeDolbyTunnelMode: number

export declare const kHIDUsage_AD_DisplayData: number

export declare const kIOTimingIDVESA_640x480_60hz: number

export declare const kHIDUsage_Snsr_Data_Environmental: number

export declare const kHIDUsage_Csmr_ACInsertMode: number

export declare const kATATimeout1Minute: number

export declare const kIOTimingIDVESA_1280x1024_75hz: number

export declare const kHIDUsage_Snsr_Data_Orientation_DistanceYAxis: number

export declare const kHIDUsage_Snsr_Modifier_Resolution: number

export declare const mBaseOffset: number

export declare const kIOUSBSuperSpeedPlusDeviceCapabilitySublinkDirection: number

export declare const kSBCCmd_PREFETCH: number

export declare const kIONoSeparateSyncControl: number

export declare const kHIDUsage_BCS_KlasseEinsLaser: number

export declare const kIOATAMaxPerformance: number

export declare const kConnectionPostWake: number

export declare const kDepthMode5: number

export declare const kHIDUsage_Button_178: number

export declare const kDisplayModeValidFlag: number

export declare const kHIDUsage_Button_32: number

export declare const kIOAudioChannelLabel_LeftTopFront: number

export declare const kIOTimingIDVESA_1600x1200_60hz: number

export declare const kHIDUsage_Button_179: number

export declare const kHIDUsage_Button_1: number

export declare const kVideoDefaultBus: number

export declare const kCSRStateLost: number

export declare const OUTPUT_HEAD_MOUNTED_DISPLAY_AUDIO: number

export declare const kINQUIRY_Byte7_CMDQUE_Bit: number

export declare const kHIDUsage_Snsr_Data_Orientation_Tilt: number

export declare const kUSB_EPDesc_bmAttributes_TranType_Shift: number

export declare const kSCSICDBSize_Maximum: number

export declare const kHIDUsage_Tfon_PhoneKeyC: number

export declare const kHIDUsage_Csmr_ContactRecordActive: number

export declare const kHIDUsage_BS_CapacityGranularity1: number

export declare const kIO4IndexedPixelFormat: number

export declare const kHIDUsage_Snsr_Property_ReportingState: number

export declare const kIOMediumEthernet100BaseT4: number

export declare const kIOConnectMethodVarOutputSize: number

export declare const kIOUSBEndpointDescriptorUsageTypeIsocData: number

export declare const kUSBRqSetAddress: number

export declare const kIOColorimetryBT601: number

export declare const kUSBRel10: number

export declare const kIOUSBDeviceRequestSetConfiguration: number

export declare const kHIDUsage_Snsr_Data_Location_City: number

export declare const kIODisplayNeedsCEAUnderscan: number

export declare const kHIDUsage_WD_DataScaling: number

export declare const kUSBInterfacePowerDesc: number

export declare const kUSB20ExtensionLPMSupported: number

export declare const kHIDUsage_Tfon_PhoneKeyD: number

export declare const kHIDUsage_KeyboardF18: number

export declare const kREPORT_LUNS_ADDRESS_METHOD_PERIPHERAL_DEVICE: number

export declare const kHIDUsage_Button_11: number

export declare const kIORangeBitsPerColorComponent8: number

export declare const kIORPCMessageError: number

export declare const kIOTimingIDVESA_1280x960_85hz: number

export declare const kIOFBTenPtTwoShmemVersion: number

export declare const kHIDUsage_Csmr_ALNewsreader: number

export declare const kHIDUsage_GD_Thumbstick: number

export declare const kHIDUsage_BCS_DisableCheckDigitTransmit: number

export declare const kHIDUsage_BCS_TransmitStart_Stop: number

export declare const kHIDUsage_Snsr_Time_AlarmTimer: number

export declare const kIOStorageUnmapOptionWhole: number

export declare const kHIDUsage_AD_HorizontalScroll: number

export declare const kSGCCmd_SCAN: number

export declare const kHIDUsage_Snsr_Electrical: number

export declare const kHIDUsage_Keyboard8: number

export declare const kIOAudioClockSelectorTypeSPDIF: number

export declare const kHIDUsage_KeyboardF8: number

export declare const kConfigBIBBusNameAddress: number

export declare const kUSBRqReserved2: number

export declare const kHIDUsage_Csmr_ContactIndex: number

export declare const kHIDUsage_KeyboardStop: number

export declare const kSCSICmd_ERASE_10: number

export declare const kHIDUsage_BD_BrailleButtons: number

export declare const kUSBPhysicalInterfaceClass: number

export declare const kUSBCommunicationDataInterfaceClass: number

export declare const kSCSICmd_SEARCH_DATA_LOW_10: number

export declare const kMMCCmd_STOP_PLAY_SCAN: number

export declare const kHIDUsage_GD_GamePad: number

export declare const kSBCCmd_XDWRITE: number

export declare const kFWAddressNodeID: number

export declare const kIOHIDValueOptionsFlagPrevious: number

export declare const kIOStreamMethodGetMode: number

export declare const kDisplaySubPixelShapeRectangular: number

export declare const kSENSE_ILI_Mask: number

export declare const kIO16BE555PixelFormat: number

export declare const kATASMARTSelfTestStatusInterruptedByReset: number

export declare const kIOMediaStateOnline: number

export declare const kUSBNotificationPostForcedResumeBit: number

export declare const kHIDUsage_LED_IndicatorAmber: number

export declare const kIOTimingIDApple_640x480_67hz: number

export declare const kHIDUsage_PD_iName: number

export declare const kScaleSwapAxesMask: number

export declare const kHIDUsage_Tfon_MessageControls: number

export declare const kHIDUsage_AD_DisplayStatus: number

export declare const kHIDUsage_Csmr_MediaSelectTelephone: number

export declare const kATAPhysicalSectorSizeMask: number

export declare const kHIDUsage_Snsr_Event_SensorEvent_PropertyChanged: number

export declare const kHIDUsage_LED_Speaker: number

export declare const IOFWPhysicalAccessMode: {
	Enabled: 0
	Disabled: 1
	DisabledForGeneration: 2
}

export declare const IOFWSecurityMode: {
	Normal: 0
	Secure: 1
	SecurePermanent: 2
}

export declare const NuDCLFlags: {
	Dynamic: 2
	UpdateBeforeCallback: 4
}

export declare const IOFWDCLNotificationType: {
	DCLInvalid: 0
	DCLUpdate: 1
	DCLModify: 2
	NuDCLModify: 3
	NuDCLModifyJump: 4
	NuDCLUpdate: 5
}

export declare const IOCSRKeyType: {
	CSRImmediateKey: 0
	CSROffsetKey: 1
	CSRLeafKey: 2
	CSRDirectoryKey: 3
	InvalidCSRROMEntry: 255
}

export declare const IOConfigKeyType: {
	ConfigImmediateKey: 0
	ConfigOffsetKey: 1
	ConfigLeafKey: 2
	ConfigDirectoryKey: 3
	InvalidConfigROMEntry: 255
}

export declare const IOFWSpeed: {
	Speed100MBit: 0
	Speed200MBit: 1
	Speed400MBit: 2
	Speed800MBit: 3
	SpeedReserved: 3
	SpeedReserved1: 7
	SpeedUnknownMask: 128
	SpeedMaximum: 2147483647
	SpeedInvalid: -2147483648
}

export declare const IOFWWriteFlags: {
	FlagsNone: 0
	FlagsDeferredNotify: 1
	FastRetryOnBusy: 2
	BlockRequest: 4
}

export declare const IOFWIsochResourceFlags: {
	NeverMultiMode: 0
	AllowMultiMode: 1
	SuggestMultiMode: 2
	AlwaysMultiMode: 3
	DefaultIsochResourceFlags: 0
}

export declare const IOFWReadFlags: {
	FlagsNone: 0
	BlockRequest: 4
	PingTime: 8
}

export declare const kUSBHostConnectorType: {
	BTypeAConnector: 0
	BTypeMiniABConnector: 1
	BTypeExpressCard: 2
	B3TypeStdAConnector: 3
	B3TypeStdBConnector: 4
	B3TypeMicroBConnector: 5
	B3TypeMicroABConnector: 6
	B3TypePowerBConnector: 7
	BProprietaryConnector: 255
}

export declare const USBDeviceInformationBits: {
	DeviceIsCaptiveBit: 0
	DeviceIsAttachedToRootHubBit: 1
	DeviceIsInternalBit: 2
	DeviceIsConnectedBit: 3
	DeviceIsEnabledBit: 4
	DeviceIsSuspendedBit: 5
	DeviceIsInResetBit: 6
	DeviceOvercurrentBit: 7
	DevicePortIsInTestModeBit: 8
	DeviceIsRootHub: 9
	RootHubisBuiltIn: 10
	RootHubIsBuiltInBit: 10
	DeviceIsRemote: 11
	DeviceIsAttachedToEnclosure: 12
	DeviceIsOnThunderboltBit: 13
	DeviceIsCaptiveMask: 1
	DeviceIsAttachedToRootHubMask: 2
	DeviceIsInternalMask: 4
	DeviceIsConnectedMask: 8
	DeviceIsEnabledMask: 16
	DeviceIsSuspendedMask: 32
	DeviceIsInResetMask: 64
	DeviceOvercurrentMask: 128
	DevicePortIsInTestModeMask: 256
	DeviceIsRootHubMask: 512
	RootHubisBuiltInMask: 1024
	RootHubIsBuiltInMask: 1024
	DeviceIsRemoteMask: 2048
	DeviceIsAttachedToEnclosureMask: 4096
	DeviceIsOnThunderboltMask: 8192
}

export declare const USBReEnumerateOptions: {
	AddExtraResetTimeBit: 31
	ReEnumerateCaptureDeviceBit: 30
	ReEnumerateReleaseDeviceBit: 29
	AddExtraResetTimeMask: -2147483648
	ReEnumerateCaptureDeviceMask: 1073741824
	ReEnumerateReleaseDeviceMask: 536870912
}

export declare const USBClassSpecificDesc: {
	kUSBClassSpecificDescriptor: 36
}

export declare const tIOUSBHostPortStatus: {
	PortTypeMask: 15
	PortTypePhase: 0
	PortTypeStandard: 0
	PortTypeCaptive: 1
	PortTypeInternal: 2
	PortTypeAccessory: 3
	PortTypeReserved: 240
	ConnectedSpeedMask: 1792
	ConnectedSpeedPhase: 8
	ConnectedSpeedNone: 0
	ConnectedSpeedFull: 256
	ConnectedSpeedLow: 512
	ConnectedSpeedHigh: 768
	ConnectedSpeedSuper: 1024
	ConnectedSpeedSuperPlus: 1280
	ConnectedSpeedSuperPlusBy2: 1536
	ConnectedSpeedOther: 1792
	Resetting: 2048
	Enabled: 4096
	Suspended: 8192
	Overcurrent: 16384
	TestMode: 32768
}

export declare const tIOUSB40LinkStateTimeout: {
	PortReady: 1100
	KeepAlive: 20
}

export declare const tIOUSB30HubExtStatus: {
	RxSublinkSpeedID: 15
	RxSublinkSpeedIDPhase: 0
	TxSublinkSpeedID: 240
	TxSublinkSpeedIDPhase: 4
	RxLaneCount: 3840
	RxLaneCountPhase: 8
	TxLaneCount: 61440
	TxLaneCountPhase: 12
}

export declare const tIOUSB20BusCurrent: {
	Minimum: 100
	Default: 500
	MaxPowerUnits: 2
}

export declare const tIOUSBDeviceRequestRecipientValue: {
	Device: 0
	Interface: 1
	Endpoint: 2
	Other: 3
}

export declare const IOHIDUserDeviceOptions: {
	IOHIDUserDeviceOptionsCreateOnActivate: 1
}

export declare const tIOUSBLanguageID: {
	kIOUSBLanguageIDEnglishUS: 1033
}

export declare const tIOUSBEndpointSynchronizationType: {
	None: 0
	Asynchronous: 1
	Adaptive: 2
	Synchronous: 3
}

export declare const tIOUSBEndpointType: {
	Control: 0
	Isochronous: 1
	Bulk: 2
	Interrupt: 3
}

export declare const tIOUSBEndpointDirection: {
	Out: 0
	In: 1
	Unknown: 2
}

export declare const tIOUSBDescriptorSize: {
	HeaderSize: 2
	SizeDevice: 18
	SizeConfiguration: 9
	SizeInterface: 9
	SizeEndpoint: 7
	SizeStringMinimum: 2
	SizeStringMaximum: 255
	SizeDeviceQualifier: 10
	SizeInterfaceAssociation: 8
	SizeBOS: 5
	SizeDeviceCapability: 3
	SizeUSB20ExtensionCapability: 7
	SizeSuperSpeedUSBDeviceCapability: 10
	SizeContainerIDCapability: 20
	SizeHubMinimum: 9
	SizeHubMaximum: 21
	SizeSuperSpeedHub: 12
	SizeSuperSpeedUSBEndpointCompanion: 6
	SizeSuperSpeedPlusIsochronousEndpointCompanion: 8
	SizeBillboardDeviceMinimum: 44
	SizeBillboardDeviceMaximum: 256
	SizePlatformECIDCapability: 28
	SizePlatformCapability: 20
}

export declare const tIOUSBDescriptorType: {
	DescriptorTypeDevice: 1
	DescriptorTypeConfiguration: 2
	DescriptorTypeString: 3
	DescriptorTypeInterface: 4
	DescriptorTypeEndpoint: 5
	DescriptorTypeDeviceQualifier: 6
	DescriptorTypeOtherSpeedConfiguration: 7
	DescriptorTypeInterfacePower: 8
	DescriptorTypeOTG: 9
	DescriptorTypeDebug: 10
	DescriptorTypeInterfaceAssociation: 11
	DescriptorTypeBOS: 15
	DescriptorTypeDeviceCapability: 16
	DecriptorTypeHID: 33
	DecriptorTypeReport: 34
	DescriptorTypePhysical: 35
	DescriptorTypeHub: 41
	DescriptorTypeSuperSpeedHub: 42
	DescriptorTypeSuperSpeedUSBEndpointCompanion: 48
	DescriptorTypeSuperSpeedPlusIsochronousEndpointCompanion: 49
}

export declare const CDSectorSize: {
	CDDA: 2352
	Mode1: 2048
	Mode2: 2336
	Mode2Form1: 2048
	Mode2Form2: 2328
	Whole: 2352
}

export declare const SCSITaskStatus: {
	GOOD: 0
	CHECK_CONDITION: 2
	CONDITION_MET: 4
	BUSY: 8
	INTERMEDIATE: 16
	INTERMEDIATE_CONDITION_MET: 20
	RESERVATION_CONFLICT: 24
	TASK_SET_FULL: 40
	ACA_ACTIVE: 48
	TaskTimeoutOccurred: 1
	ProtocolTimeoutOccurred: 2
	DeviceNotResponding: 3
	DeviceNotPresent: 4
	DeliveryFailure: 5
	No_Status: 255
}

export declare const IOPSLowBatteryWarningLevel: {
	None: 1
	Early: 2
	Final: 3
}

export declare const IOHIDRequestType: {
	Post: 0
	Listen: 1
}

export declare const IOHIDScrollEventOptions: {
	kIOHIDScrollEventOptionsNoAcceleration: 256
}

export declare const IOHIDPointerEventOptions: {
	kIOHIDPointerEventOptionsNoAcceleration: 256
}

export declare const IOHIDKeyboardEventOptions: {
	kIOHIDKeyboardEventOptionsNoKeyRepeat: 256
}

export declare const eIOAccelSurfaceLockBits: {
	Backing: 0
	Accel: 1
	DontCare: 2
	Mask: 3
}

export declare const eIOAccelSurfaceStateBits: {
	None: 0
	IdleBit: 1
}

export declare const eIOAccelSurfaceModeBits: {
	ColorDepth1555: 3
	ColorDepth8888: 4
	ColorDepthYUV: 6
	ColorDepthYUV9: 7
	ColorDepthYUV12: 8
	ColorDepthYUV2: 9
	ColorDepthBGRA32: 10
	ColorDepth2101010: 15
	ColorDepthBits: 15
	StereoBit: 16
	WindowedBit: 32
	Surface2: 16384
	BeamSync: 32768
}

export declare const eIOAccelSurfaceMethods: {
	SurfaceReadLockOptions: 0
	SurfaceReadUnlockOptions: 1
	SurfaceGetState: 2
	SurfaceWriteLockOptions: 3
	SurfaceWriteUnlockOptions: 4
	SurfaceRead: 5
	SurfaceSetShapeBacking: 6
	SurfaceSetIDMode: 7
	SurfaceSetScale: 8
	SurfaceSetShape: 9
	SurfaceFlush: 10
	SurfaceQueryLock: 11
	SurfaceReadLock: 12
	SurfaceReadUnlock: 13
	SurfaceWriteLock: 14
	SurfaceWriteUnlock: 15
	SurfaceControl: 16
	SurfaceSetShapeBackingAndLength: 17
	NumSurfaceMethods: 18
}

export declare const _IOAudioEngineNotifications: {
	AllNotifications: 0
	StreamFormatChangeNotification: 1
	ChangeNotification: 2
	StartedNotification: 3
	StoppedNotification: 4
	PausedNotification: 5
	ResumedNotification: 6
}

export declare const _IOAudioEngineTraps: {
	kIOAudioEngineTrapPerformClientIO: 0
}

export declare const _IOAudioEngineMemory: {
	Status: 0
	Sample: 1
	Mix: 2
	BytesInInput: 3
	BytesInOutput: 4
}

export declare const IOURLError: {
	Unknown: -10
	UnknownScheme: -11
	ResourceNotFound: -12
	ResourceAccessViolation: -13
	RemoteHostUnavailable: -14
	ImproperArguments: -15
	UnknownPropertyKey: -16
	PropertyKeyUnavailable: -17
	Timeout: -18
}

export declare const USBPowerRequestTypes: {
	DuringSleep: 0
	DuringWake: 1
	RequestWakeRelease: 2
	RequestSleepRelease: 3
	RequestWakeReallocate: 4
	RequestSleepReallocate: 5
	DuringWakeRevocable: 6
	DuringWakeUSB3: 7
}

export declare const IOHIDServiceSensorControlOptions: {
	Decimation: 1
	Aggregation: 2
	DispatchControl: 4
}

export declare const _IOAudioEngineState: {
	Stopped: 0
	Running: 1
	Paused: 2
	Resumed: 3
}

export declare const eIOAccelSurfaceScaleBits: {
	BeamSyncSwaps: 1
	FixedSource: 2
	Filtering: 240
	FilterDefault: 0
	FilterNone: 16
	FilterLinear: 32
}

export declare const IOHIDTransactionOptions: {
	None: 0
	WeakDevice: 1
}

export declare const CDSectorArea: {
	Sync: 128
	Header: 32
	SubHeader: 64
	User: 16
	Auxiliary: 8
	ErrorFlags: 2
	SubChannel: 1
	SubChannelQ: 4
}

export declare const USBLowLatencyBufferType: {
	Write: 0
	Read: 1
	FrameList: 2
}

export declare const kUSBConnectable: {
	Not: 0
	kUSBPortConnectable: 1
}

export declare const tIOUSBTopology: {
	TopologyHost: 1
	TopologyRootPort: 2
	Topology1Hub: 3
	Topology2Hub: 4
	Topology3Hub: 5
	Topology4Hub: 6
	Topology5Hub: 7
	TopologyTierLimit: 7
}

export declare const IOPMUserClientNotificationType: {
	IOPMUserClientNotificationType_AssertionLog: 0
}

export declare const CDSectorType: {
	Unknown: 0
	CDDA: 1
	Mode1: 2
	Mode2: 3
	Mode2Form1: 4
	Mode2Form2: 5
	Count: 6
}

export declare const _IOAudioStreamDirection: {
	Output: 0
	Input: 1
}

export declare const tIOUSB30DeviceNotificationType: {
	FunctionWake: 1
	LatencyTolerance: 2
	BusIntervalAdjustment: 3
	HostRoleRequest: 4
	SublinkSpeed: 5
}

export declare const IOHIDTransactionDirectionType: {
	Input: 0
	Output: 1
}

export declare const IOHIDElementType: {
	Input_Misc: 1
	Input_Button: 2
	Input_Axis: 3
	Input_ScanCodes: 4
	Input_NULL: 5
	Output: 129
	Feature: 257
	Collection: 513
}

export declare const IOHIDElementCommitDirection: {
	In: 0
	Out: 1
}

export declare const IOHIDReportType: {
	Input: 0
	Output: 1
	Feature: 2
	Count: 3
}

export declare const NXMouseButton: {
	One: 0
	Left: 1
	Right: 2
}

export declare const IOHIDButtonModes: {
	BothLeftClicks: 0
	ReverseLeftRightClicks: 1
	EnableRightClick: 2
}

export declare const _IOAudioControlNotifications: {
	Value: 0
	Range: 1
}

export declare const tIOUSBHostConnectionSpeed: {
	None: 0
	Full: 1
	Low: 2
	High: 3
	Super: 4
	SuperPlus: 5
	SuperPlusBy2: 6
	Other: 7
	Count: 8
}

export declare const evsioEVSIOSCSIndices: {
	X: 0
	Y: 1
}

export declare const tIOUSBHostPortType: {
	Standard: 0
	Captive: 1
	Internal: 2
	Accessory: 3
	ExpressCard: 4
	C: 5
	Unknown: 6
}

export declare const eIOAccelSurfaceShapeBits: {
	None: 0
	NonBlockingBit: 1
	NonSimpleBit: 2
	IdentityScaleBit: 4
	FrameSyncBit: 8
	BeamSyncBit: 16
	StaleBackingBit: 32
	AssemblyBit: 64
	WaitEnabledBit: 128
	BlockingBit: 1
}

export declare const evsioEVSIOCCSIndices: {
	X: 0
	Y: 1
}

export declare const tIOUSB30HubPortStatusCode: {
	Standard: 0
	PD: 1
	Ext: 2
	Count: 3
}

export declare const eIOAcceleratorClientTypes: {
	SurfaceClientType: 0
	NumClientTypes: 1
	Surface2ClientType: 32
}

export declare const tIOUSB30ResetTimeout: {
	Minimum: 80
	Typical: 100
	Maximum: 120
	MaximumWithMargin: 150
}

export declare const SCSIServiceResponse: {
	Request_In_Process: 0
	SERVICE_DELIVERY_OR_TARGET_FAILURE: 1
	TASK_COMPLETE: 2
	LINK_COMMAND_COMPLETE: 3
	FUNCTION_COMPLETE: 4
	FUNCTION_REJECTED: 5
}

export declare const IOHIDManagerOptions: {
	None: 0
	UsePersistentProperties: 1
	DoNotLoadProperties: 2
	DoNotSaveProperties: 4
	IndependentDevices: 8
}

export declare const eIOAccelSurfaceMemoryTypes: {
	kIOAccelNumSurfaceMemoryTypes: 0
}

export declare const _IOAudioEngineCalls: {
	RegisterClientBuffer: 0
	UnregisterClientBuffer: 1
	GetConnectionID: 2
	Start: 3
	Stop: 4
	GetNearestStartTime: 5
}

export declare const tIOUSBDeviceRequest: {
	Size: 8
	DirectionMask: 128
	DirectionPhase: 7
	DirectionOut: 0
	DirectionIn: 128
	TypeMask: 96
	TypePhase: 5
	TypeStandard: 0
	TypeClass: 32
	TypeVendor: 64
	RecipientMask: 31
	RecipientPhase: 0
	RecipientDevice: 0
	RecipientInterface: 1
	RecipientEndpoint: 2
	RecipientOther: 3
}

export declare const _IOAudioControlCalls: {
	Set: 0
	Get: 1
}

export declare const SCSITaskState: {
	NEW_TASK: 0
	ENABLED: 1
	BLOCKED: 2
	DORMANT: 3
	ENDED: 4
}

export declare const USBNotificationTypes: {
	PreForcedSuspend: 1
	PostForcedSuspend: 2
	PreForcedResume: 4
	PostForcedResume: 8
}

export declare const IOFWIsochPortOptions: {
	PortDefaultOptions: 0
	PortUseSeparateKernelThread: 2
	EnableRobustness: 4
	BigEndianUpdates: 8
	RequireLastContext: 16
}

export declare const tIOUSBDeviceCapabilityType: {
	Wireless: 1
	USB20Extension: 2
	SuperSpeed: 3
	ContainerID: 4
	Platform: 5
	PowerDelivery: 6
	BatteryInfo: 7
	PdConsumerPort: 8
	PdProviderPort: 9
	SuperSpeedPlus: 10
	PrecisionMeasurement: 11
	WirelessExt: 12
	Billboard: 13
	BillboardAltMode: 15
}

export declare const EvCmd: {
	NOP: 0
	HIDE: 1
	SHOW: 2
	MOVE: 3
	LEVEL: 4
}

export declare const IOHIDElementCollectionType: {
	Physical: 0
	Application: 1
	Logical: 2
	Report: 3
	NamedArray: 4
	UsageSwitch: 5
	UsageModifier: 6
}

export declare const IOStreamMode: {
	Input: 0
	Output: 1
	InputOutput: 2
}

export declare const tIOUSBDeviceRequestTypeValue: {
	Standard: 0
	Class: 1
	Vendor: 2
}

export declare const tIOUSB30TimingParameters: {
	Default: 1000000
	Min: 125000
}

export declare const IOHIDDeviceGetValueOptions: {
	With: 131072
	Without: 262144
}

export declare const tIOUSB30BusCurrent: {
	Minimum: 150
	Default: 900
	MaxPowerUnits: 8
}

export declare const tIOUSB30LinkStateTimeout: {
	LinkStateSSInactiveQuietTimeout: 12
	LinkStateRxDetectQuietTimeout: 12
	LinkStatePollingLFPSTimeout: 360
	LinkStatePollingActiveTimeout: 12
	LinkStatePollingConfigurationTimeout: 12
	LinkStatePollingIdleTimeout: 2
	LinkStateU0RecoveryTimeout: 1
	LinkStateU0LTimeout: 0
	LinkStateU1NoLFPSResponseTimeout: 2
	LinkStateU1PingTimeout: 300
	LinkStateU2NoLFPSResponseTimeout: 2
	LinKStateU2RxDetectDelay: 100
	LinkStateU3NoLFPSResponseTimeout: 10
	LinkStateU3WakeupRetryDelay: 100
	LinkStateU3RxDetectDelay: 100
	LinkStateRecoveryActiveTimeout: 12
	LinkStateRecoveryConfigurationTimeout: 6
	LinkStateRecoveryIdleTimeout: 2
	LinkStateLoopbackExitTimeout: 2
	LinkStateHotResetActiveTimeout: 12
	LinkStateHotResetExitTimeout: 2
	LinkStatePollingDeadline: 387
	LinkStateSSResumeDeadline: 130
	LinkStateRecoveryDeadline: 21
	LinkStateHotResetDeadline: 15
}

export declare const tIOUSBBusVoltage: {
	kIOUSBBusVoltageDefault: 5
}

export declare const SCSITaskAttribute: {
	SIMPLE: 0
	ORDERED: 1
	HEAD_OF_QUEUE: 2
	ACA: 3
}

export declare const tIOUSBEndpointUsageType: {
	Data: 0
	Feedback: 1
	Implicit: 2
}

export declare const IOHIDAccessType: {
	Granted: 0
	Denied: 1
	Unknown: 2
}

export declare const IOPMUserActiveType: {
	Local: 0
	Remote: 1
}

export declare const tIOUSBDeviceRequestDirectionValue: {
	Out: 0
	In: 1
}

export declare const HIDReportCommandType: {
	Set: 0
	Get: 1
}

export declare class __NuDCL {
	constructor(init?: __NuDCL)
}

export declare class UserExportDCLNuDCLLeader {
	constructor(init?: UserExportDCLNuDCLLeader)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	program: number
}

export declare class UserExportDCLPtrTimeStampStruct {
	constructor(init?: UserExportDCLPtrTimeStampStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	timeStampPtr: number
}

export declare class UserExportDCLTimeStampStruct {
	constructor(init?: UserExportDCLTimeStampStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	timeStamp: number
}

export declare class UserExportDCLSetTagSyncBitsStruct {
	constructor(init?: UserExportDCLSetTagSyncBitsStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	tagBits: number
	syncBits: number
}

export declare class UserExportDCLLabelStruct {
	constructor(init?: UserExportDCLLabelStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
}

export declare class UserExportDCLTransferBufferStruct {
	constructor(init?: UserExportDCLTransferBufferStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	buffer: number
	size: number
	packetSize: number
	reserved: number
	bufferOffset: number
}

export declare class UserExportDCLTransferPacketStruct {
	constructor(init?: UserExportDCLTransferPacketStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	buffer: number
	size: number
}

export declare class DCLPtrTimeStampStruct {
	constructor(init?: DCLPtrTimeStampStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	timeStampPtr: interop.Pointer
}

export declare class DCLUpdateDCLListStruct {
	constructor(init?: DCLUpdateDCLListStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	dclCommandList: interop.Pointer
	numDCLCommands: number
}

export declare class DCLSetTagSyncBitsStruct {
	constructor(init?: DCLSetTagSyncBitsStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	tagBits: number
	syncBits: number
}

export declare class DCLLabelStruct {
	constructor(init?: DCLLabelStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
}

export declare class DCLTransferBufferStruct {
	constructor(init?: DCLTransferBufferStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	buffer: interop.Pointer
	size: number
	packetSize: number
	reserved: number
	bufferOffset: number
}

export declare class DCLTransferPacketStruct {
	constructor(init?: DCLTransferPacketStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	buffer: interop.Pointer
	size: number
}

export declare class DCLCommandStruct {
	constructor(init?: DCLCommandStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	operands: unknown /* const array */
}

export declare class DCLTimeStampStruct {
	constructor(init?: DCLTimeStampStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	timeStamp: number
}

export declare class IOFireWireSessionRefOpaqueStuct {
	constructor(init?: IOFireWireSessionRefOpaqueStuct)
}

export declare class DVDAuthenticationGrantIDInfo {
	constructor(init?: DVDAuthenticationGrantIDInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	reserved2: unknown /* const array */
	reservedBits: number
	grantID: number
}

export declare class IOUSBInterfaceStruct650 {
	constructor(init?: IOUSBInterfaceStruct650)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV3: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetEndpointPropertiesV3: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SupportsStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	CreateStreams: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetConfiguredStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ReadStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: number,
	) => number | null
	WriteStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
	) => number | null
	ReadStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	WriteStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	AbortStreamsPipe: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	RegisterForNotification: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	UnregisterNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	AcknowledgeNotification: (p1: interop.PointerConvertible, p2: number) => number | null
}

export declare class IOUSBInterfaceStruct398 {
	constructor(init?: IOUSBInterfaceStruct398)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBInterfaceStruct192 {
	constructor(init?: IOUSBInterfaceStruct192)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBInterfaceStruct190 {
	constructor(init?: IOUSBInterfaceStruct190)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBInterfaceStruct100 {
	constructor(init?: IOUSBInterfaceStruct100)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBDeviceStruct942 {
	constructor(init?: IOUSBDeviceStruct942)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetUSBDeviceInformation: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	RequestExtraPower: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	ReturnExtraPower: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetExtraPowerAllocated: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetBandwidthAvailableForDevice: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfigurationV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: boolean,
		p4: boolean,
	) => number | null
	RegisterForNotification: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	UnregisterNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	AcknowledgeNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	GetDeviceAsyncNotificationPort: (p1: interop.PointerConvertible) => interop.Pointer | null
}

export declare class IOUSBDeviceStruct320 {
	constructor(init?: IOUSBDeviceStruct320)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetUSBDeviceInformation: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	RequestExtraPower: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	ReturnExtraPower: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetExtraPowerAllocated: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBDeviceStruct300 {
	constructor(init?: IOUSBDeviceStruct300)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBDeviceStruct197 {
	constructor(init?: IOUSBDeviceStruct197)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBDeviceStruct182 {
	constructor(init?: IOUSBDeviceStruct182)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBBulkPipeReq {
	constructor(init?: IOUSBBulkPipeReq)
	pipeRef: number
	buf: interop.Pointer
	size: number
	noDataTimeout: number
	completionTimeout: number
}

export declare class IOUSBDevRequest {
	constructor(init?: IOUSBDevRequest)
	bmRequestType: number
	bRequest: number
	wValue: number
	wIndex: number
	wLength: number
	pData: interop.Pointer
	wLenDone: number
}

export declare class IOUSBFindEndpointRequest {
	constructor(init?: IOUSBFindEndpointRequest)
	type: number
	direction: number
	maxPacketSize: number
	interval: number
}

export declare class IOUSBEndpointProperties {
	constructor(init?: IOUSBEndpointProperties)
	bVersion: number
	bAlternateSetting: number
	bDirection: number
	bEndpointNumber: number
	bTransferType: number
	bUsageType: number
	bSyncType: number
	bInterval: number
	wMaxPacketSize: number
	bMaxBurst: number
	bMaxStreams: number
	bMult: number
	wBytesPerInterval: number
}

export declare class IOUSBKeyboardData {
	constructor(init?: IOUSBKeyboardData)
	keycount: number
	usbkeycode: unknown /* const array */
}

export declare class IOUSBMouseData {
	constructor(init?: IOUSBMouseData)
	buttons: number
	XDelta: number
	YDelta: number
}

export declare class IOUSBLowLatencyIsocCompletion {
	constructor(init?: IOUSBLowLatencyIsocCompletion)
	target: interop.Pointer
	action: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => void | null
	parameter: interop.Pointer
}

export declare class IOUSBCompletion {
	constructor(init?: IOUSBCompletion)
	target: interop.Pointer
	action: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void | null
	parameter: interop.Pointer
}

export declare class IOUSBLowLatencyIsocFrame {
	constructor(init?: IOUSBLowLatencyIsocFrame)
	frStatus: number
	frReqCount: number
	frActCount: number
	frTimeStamp: UnsignedWide
}

export declare class IOUSBDeviceRequest {
	constructor(init?: IOUSBDeviceRequest)
	bmRequestType: number
	bRequest: number
	wValue: number
	wIndex: number
	wLength: number
}

export declare class IOUSBHIDDescriptor {
	constructor(init?: IOUSBHIDDescriptor)
	descLen: number
	descType: number
	descVersNum: number
	hidCountryCode: number
	hidNumDescriptors: number
	hidDescriptorType: number
	hidDescriptorLengthLo: number
	hidDescriptorLengthHi: number
}

export declare class IOUSBSuperSpeedHubDescriptor {
	constructor(init?: IOUSBSuperSpeedHubDescriptor)
	bLength: number
	bDescriptorType: number
	bNumberPorts: number
	wHubCharacteristics: number
	bPowerOnToPowerGood: number
	bHubControllerCurrent: number
	bHubDecodeLatency: number
	wHubDelay: number
	deviceRemovable: number
}

export declare class IOUSBSuperSpeedPlusIsochronousEndpointCompanionDescriptor {
	constructor(init?: IOUSBSuperSpeedPlusIsochronousEndpointCompanionDescriptor)
	bLength: number
	bDescriptorType: number
	wReserved: number
	dwBytesPerInterval: number
}

export declare class IOUSBDeviceCapabilityBillboardAltConfig {
	constructor(init?: IOUSBDeviceCapabilityBillboardAltConfig)
	wSVID: number
	bAltenateMode: number
	iAlternateModeString: number
}

export declare class IOUSBDeviceCapabilityBillboardAltConfigCompatibility {
	constructor(init?: IOUSBDeviceCapabilityBillboardAltConfigCompatibility)
	wSVID: number
	dwAlternateMode: number
	iAlternateModeString: number
}

export declare class IOUSBDeviceCapabilitySuperSpeedPlusUSB {
	constructor(init?: IOUSBDeviceCapabilitySuperSpeedPlusUSB)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
	bReserved: number
	bmAttributes: number
	wFunctionalitySupport: number
	wReserved: number
	bmSublinkSpeedAttr: interop.Pointer
}

export declare class IOUSBDeviceCapabilitySuperSpeedUSB {
	constructor(init?: IOUSBDeviceCapabilitySuperSpeedUSB)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
	bmAttributes: number
	wSpeedsSupported: number
	bFunctionalitySupport: number
	bU1DevExitLat: number
	wU2DevExitLat: number
}

export declare class SCSICmd_INQUIRY_PageC0_Data {
	constructor(init?: SCSICmd_INQUIRY_PageC0_Data)
	fHeader: SCSICmd_INQUIRY_PageCx_Header
	fTdmPageVersion: number
	fTdmProtocolVersion: number
	fReserved1: number
	fReserved2: number
	fMacModelId: unknown /* const array */
	fSerialNumber: unknown /* const array */
	fMaxReadSize: number
	fMaxWriteSize: number
	fNativeBlockSize: number
	fPreferredIOSize: number
	fFeatures: number
	fWorkArounds: number
	fEncryptionType: number
	fReserved3: unknown /* const array */
	fInstalledRAMSize: number
}

export declare class IOUSBDeviceCapabilityUSB2Extension {
	constructor(init?: IOUSBDeviceCapabilityUSB2Extension)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
	bmAttributes: number
}

export declare class IOUSBEndpointDescriptor {
	constructor(init?: IOUSBEndpointDescriptor)
	bLength: number
	bDescriptorType: number
	bEndpointAddress: number
	bmAttributes: number
	wMaxPacketSize: number
	bInterval: number
}

export declare class IOUSBConfigurationDescHeader {
	constructor(init?: IOUSBConfigurationDescHeader)
	bLength: number
	bDescriptorType: number
	wTotalLength: number
}

export declare class IOUSBDeviceQualifierDescriptor {
	constructor(init?: IOUSBDeviceQualifierDescriptor)
	bLength: number
	bDescriptorType: number
	bcdUSB: number
	bDeviceClass: number
	bDeviceSubClass: number
	bDeviceProtocol: number
	bMaxPacketSize0: number
	bNumConfigurations: number
	bReserved: number
}

export declare class IOUSBDeviceDescriptor {
	constructor(init?: IOUSBDeviceDescriptor)
	bLength: number
	bDescriptorType: number
	bcdUSB: number
	bDeviceClass: number
	bDeviceSubClass: number
	bDeviceProtocol: number
	bMaxPacketSize0: number
	idVendor: number
	idProduct: number
	bcdDevice: number
	iManufacturer: number
	iProduct: number
	iSerialNumber: number
	bNumConfigurations: number
}

export declare class __IOStreamBufferQueue {
	constructor(init?: __IOStreamBufferQueue)
	entryCount: number
	headIndex: number
	tailIndex: number
	reserved: number
	queue: unknown /* const array */
}

export declare class __IOStreamBufferQueueEntry {
	constructor(init?: __IOStreamBufferQueueEntry)
	bufferID: number
	dataOffset: number
	dataLength: number
	controlOffset: number
	controlLength: number
	reserved: unknown /* const array */
}

export declare class ATASMARTLogEntry {
	constructor(init?: ATASMARTLogEntry)
	numberOfSectors: number
	reserved: number
}

export declare class dk_cd_read_track_info_t {
	constructor(init?: dk_cd_read_track_info_t)
	reserved0000: unknown /* const array */
	address: number
	addressType: number
	reserved0072: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class dk_cd_read_mcn_t {
	constructor(init?: dk_cd_read_mcn_t)
	mcn: unknown /* const array */
	reserved0112: unknown /* const array */
}

export declare class dk_cd_read_t {
	constructor(init?: dk_cd_read_t)
	offset: number
	sectorArea: number
	sectorType: number
	reserved0080: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class VDEntryRecord {
	constructor(init?: VDEntryRecord)
	csTable: string | null
}

export declare class CDDiscInfo {
	constructor(init?: CDDiscInfo)
	dataLength: number
	discStatus: number
	stateOfLastSession: number
	erasable: number
	reserved: number
	numberOfFirstTrack: number
	numberOfSessionsLSB: number
	firstTrackNumberInLastSessionLSB: number
	lastTrackNumberInLastSessionLSB: number
	reserved3: number
	unrestrictedUse: number
	discBarCodeValid: number
	discIdentificationValid: number
	discType: number
	numberOfSessionsMSB: number
	firstTrackNumberInLastSessionMSB: number
	lastTrackNumberInLastSessionMSB: number
	discIdentification: number
	reserved7: number
	lastSessionLeadInStartTime: CDMSF
	reserved8: number
	lastPossibleStartTimeOfLeadOut: CDMSF
	discBarCode: unknown /* const array */
	reserved9: number
	numberOfOPCTableEntries: number
	opcTableEntries: unknown /* const array */
}

export declare class CDTEXT {
	constructor(init?: CDTEXT)
	dataLength: number
	reserved: number
	reserved2: number
	descriptors: unknown /* const array */
}

export declare class CDATIP {
	constructor(init?: CDATIP)
	dataLength: number
	reserved: unknown /* const array */
	referenceSpeed: number
	reserved3: number
	indicativeTargetWritingPower: number
	reserved2: number
	reserved5: number
	unrestrictedUse: number
	reserved4: number
	a3Valid: number
	a2Valid: number
	a1Valid: number
	discSubType: number
	discType: number
	reserved6: number
	reserved7: number
	startTimeOfLeadIn: CDMSF
	reserved8: number
	lastPossibleStartTimeOfLeadOut: CDMSF
	reserved9: number
	a1: unknown /* const array */
	reserved10: number
	a2: unknown /* const array */
	reserved11: number
	a3: unknown /* const array */
	reserved12: number
}

export declare class CDPMA {
	constructor(init?: CDPMA)
	dataLength: number
	reserved: number
	reserved2: number
	descriptors: unknown /* const array */
}

export declare class unnamed_11043553746395291637 {
	constructor(init?: unnamed_11043553746395291637)
	index: number
	number: number
	time: CDMSF
}

export declare class CDMSF {
	constructor(init?: CDMSF)
	minute: number
	second: number
	frame: number
}

export declare class dk_bd_send_key_t {
	constructor(init?: dk_bd_send_key_t)
	format: number
	keyClass: number
	reserved0016: unknown /* const array */
	grantID: number
	reserved0072: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class dk_bd_report_key_t {
	constructor(init?: dk_bd_report_key_t)
	format: number
	keyClass: number
	blockCount: number
	reserved0024: unknown /* const array */
	address: number
	grantID: number
	reserved0072: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class IOUPSPlugInInterface {
	constructor(init?: IOUPSPlugInInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	getProperties: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getCapabilities: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getEvent: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	setEventCallback: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	sendCommand: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
}

export declare class dk_bd_read_structure_t {
	constructor(init?: dk_bd_read_structure_t)
	format: number
	reserved0008: unknown /* const array */
	address: number
	grantID: number
	layer: number
	reserved0080: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class fdisk_part {
	constructor(init?: fdisk_part)
	bootid: number
	beghead: number
	begsect: number
	begcyl: number
	systid: number
	endhead: number
	endsect: number
	endcyl: number
	relsect: number
	numsect: number
}

export declare class BDTrackInfo {
	constructor(init?: BDTrackInfo)
	dataLength: number
	trackNumberLSB: number
	sessionNumberLSB: number
	reserved: number
	reserved2: number
	damage: number
	reserved3: number
	reserved4: number
	blank: number
	reservedTrack: number
	nextWritableAddressValid: number
	lastRecordedAddressValid: number
	reserved5: number
	trackStartAddress: number
	nextWritableAddress: number
	freeBlocks: number
	clusterSize: number
	trackSize: number
	lastRecordedAddress: number
	trackNumberMSB: number
	sessionNumberMSB: number
	reserved6: number
	reserved7: number
}

export declare class Block0 {
	constructor(init?: Block0)
	sbSig: number
	sbBlkSize: number
	sbBlkCount: number
	sbDevType: number
	sbDevId: number
	sbDrvrData: number
	sbDrvrCount: number
	sbDrvrMap: unknown /* const array */
	sbReserved: unknown /* const array */
}

export declare class dpme {
	constructor(init?: dpme)
	dpme_signature: number
	dpme_reserved_1: number
	dpme_map_entries: number
	dpme_pblock_start: number
	dpme_pblocks: number
	dpme_name: unknown /* const array */
	dpme_type: unknown /* const array */
	dpme_lblock_start: number
	dpme_lblocks: number
	dpme_flags: number
	dpme_boot_block: number
	dpme_boot_bytes: number
	dpme_load_addr: number
	dpme_load_addr_2: number
	dpme_goto_addr: number
	dpme_goto_addr_2: number
	dpme_checksum: number
	dpme_process_id: unknown /* const array */
	dpme_reserved_2: unknown /* const array */
	dpme_reserved_3: unknown /* const array */
}

export declare class dk_dvd_read_disc_info_t {
	constructor(init?: dk_dvd_read_disc_info_t)
	reserved0000: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class dk_dvd_read_structure_t {
	constructor(init?: dk_dvd_read_structure_t)
	format: number
	reserved0008: unknown /* const array */
	address: number
	grantID: number
	layer: number
	reserved0080: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class DVDRegionPlaybackControlInfo {
	constructor(init?: DVDRegionPlaybackControlInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	numberUserResets: number
	numberVendorResets: number
	typeCode: number
	driveRegion: number
	rpcScheme: number
	reserved2: number
}

export declare class DVDDiscInfo {
	constructor(init?: DVDDiscInfo)
	dataLength: number
	discStatus: number
	stateOfLastBorder: number
	erasable: number
	reserved: number
	reserved2: number
	numberOfBordersLSB: number
	firstRZoneNumberInLastBorderLSB: number
	lastRZoneNumberInLastBorderLSB: number
	reserved3: number
	unrestrictedUse: number
	discBarCodeValid: number
	reserved4: number
	reserved5: number
	numberOfBordersMSB: number
	firstRZoneNumberInLastBorderMSB: number
	lastRZoneNumberInLastBorderMSB: number
	reserved6: unknown /* const array */
	reserved7: unknown /* const array */
	reserved8: unknown /* const array */
	discBarCode: unknown /* const array */
	reserved9: number
	numberOfOPCTableEntries: number
	opcTableEntries: unknown /* const array */
}

export declare class DVDKey2Info {
	constructor(init?: DVDKey2Info)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	key2Value: unknown /* const array */
	reserved2: unknown /* const array */
}

export declare class DVDKey1Info {
	constructor(init?: DVDKey1Info)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	key1Value: unknown /* const array */
	reserved2: unknown /* const array */
}

export declare class DVDChallengeKeyInfo {
	constructor(init?: DVDChallengeKeyInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	challengeKeyValue: unknown /* const array */
	reserved2: unknown /* const array */
}

export declare class DVDManufacturingInfo {
	constructor(init?: DVDManufacturingInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	discManufacturingInfo: unknown /* const array */
}

export declare class DVDCopyrightInfo {
	constructor(init?: DVDCopyrightInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	copyrightProtectionSystemType: number
	regionMask: number
	reserved2: unknown /* const array */
}

export declare class DVDPhysicalFormatInfo {
	constructor(init?: DVDPhysicalFormatInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	partVersion: number
	bookType: number
	minimumRate: number
	discSize: number
	layerType: number
	trackPath: number
	numberOfLayers: number
	reserved2: number
	trackDensity: number
	linearDensity: number
	zero1: number
	startingPhysicalSectorNumberOfDataArea: unknown /* const array */
	zero2: number
	endPhysicalSectorNumberOfDataArea: unknown /* const array */
	zero3: number
	endSectorNumberInLayerZero: unknown /* const array */
	reserved1: number
	bcaFlag: number
	mediaSpecific: unknown /* const array */
}

export declare class IOUSBDeviceStruct187 {
	constructor(init?: IOUSBDeviceStruct187)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
}

export declare class REPORT_LUNS_LOGICAL_UNIT_ADDRESSING {
	constructor(init?: REPORT_LUNS_LOGICAL_UNIT_ADDRESSING)
	LUN: number
	BUS_NUMBER: number
	TARGET: number
	reserved2: number
	reserved: number
}

export declare class SCSICmd_REPORT_LUNS_LUN_ENTRY {
	constructor(init?: SCSICmd_REPORT_LUNS_LUN_ENTRY)
	FIRST_LEVEL_ADDRESSING: number
	SECOND_LEVEL_ADDRESSING: number
	THIRD_LEVEL_ADDRESSING: number
	FOURTH_LEVEL_ADDRESSING: number
}

export declare class SCSI_Capacity_Data_Long {
	constructor(init?: SCSI_Capacity_Data_Long)
	RETURNED_LOGICAL_BLOCK_ADDRESS: number
	BLOCK_LENGTH_IN_BYTES: number
	RTO_EN_PROT_EN: number
	Reserved: unknown /* const array */
}

export declare class VDDDCBlockRec {
	constructor(init?: VDDDCBlockRec)
	ddcBlockNumber: number
	ddcBlockType: number
	ddcFlags: number
	ddcReserved: number
	ddcBlockData: unknown /* const array */
}

export declare class SBCModePageFlexibleDisk {
	constructor(init?: SBCModePageFlexibleDisk)
	header: ModePageFormatHeader
	TRANSFER_RATE: number
	NUMBER_OF_HEADS: number
	SECTORS_PER_TRACK: number
	DATA_BYTES_PER_SECTOR: number
	NUMBER_OF_CYLINDERS: number
	STARTING_CYLINDER_WRITE_PRECOMPENSATION: number
	STARTING_CYLINDER_REDUCED_WRITE_CURRENT: number
	DEVICE_STEP_RATE: number
	DEVICE_STEP_PULSE_WIDTH: number
	HEAD_SETTLE_DELAY: number
	MOTOR_ON_DELAY: number
	MOTOR_OFF_DELAY: number
	TRDY_SSN_MO: number
	SPC: number
	WRITE_COMPENSATION: number
	HEAD_LOAD_DELAY: number
	HEAD_UNLOAD_DELAY: number
	PIN_34_PIN_2: number
	PIN_4_PIN_1: number
	MEDIUM_ROTATION_RATE: number
	RESERVED: unknown /* const array */
}

export declare class SBCModePageFormatDevice {
	constructor(init?: SBCModePageFormatDevice)
	header: ModePageFormatHeader
	TRACKS_PER_ZONE: number
	ALTERNATE_SECTORS_PER_ZONE: number
	ALTERNATE_TRACKS_PER_ZONE: number
	ALTERNATE_TRACKS_PER_LOGICAL_UNIT: number
	SECTORS_PER_TRACK: number
	DATA_BYTES_PER_PHYSICAL_SECTOR: number
	INTERLEAVE: number
	TRACK_SKEW_FACTOR: number
	CYLINDER_SKEW_FACTOR: number
	SSEC_HSEC_RMB_SURF: number
	RESERVED: unknown /* const array */
}

export declare class SCSITaskInterface {
	constructor(init?: SCSITaskInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	version: number
	revision: number
	IsTaskActive: (p1: interop.PointerConvertible) => number | null
	SetTaskAttribute: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof SCSITaskAttribute>,
	) => number | null
	GetTaskAttribute: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetCommandDescriptorBlock: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	GetCommandDescriptorBlockSize: (p1: interop.PointerConvertible) => number | null
	GetCommandDescriptorBlock: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetScatterGatherEntries: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
		p5: number,
	) => number | null
	SetTimeoutDuration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetTimeoutDuration: (p1: interop.PointerConvertible) => number | null
	SetTaskCompletionCallback: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.Enum<typeof SCSIServiceResponse>,
			p2: interop.Enum<typeof SCSITaskStatus>,
			p3: number,
			p4: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
	) => number | null
	ExecuteTaskAsync: (p1: interop.PointerConvertible) => number | null
	ExecuteTaskSync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	AbortTask: (p1: interop.PointerConvertible) => number | null
	GetSCSIServiceResponse: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetTaskState: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetTaskStatus: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetRealizedDataTransferCount: (p1: interop.PointerConvertible) => number | null
	GetAutoSenseData: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetAutoSenseDataBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	ResetForNewTask: (p1: interop.PointerConvertible) => number | null
}

export declare class SPCModePagePowerCondition {
	constructor(init?: SPCModePagePowerCondition)
	header: ModePageFormatHeader
	RESERVED: number
	IDLE_STANDBY: number
	IDLE_CONDITION_TIMER: number
	STANDBY_CONDITION_TIMER: number
}

export declare class LongLBAModeParameterBlockDescriptor {
	constructor(init?: LongLBAModeParameterBlockDescriptor)
	NUMBER_OF_BLOCKS: number
	DENSITY_CODE: number
	RESERVED: unknown /* const array */
	BLOCK_LENGTH: number
}

export declare class DASDModeParameterBlockDescriptor {
	constructor(init?: DASDModeParameterBlockDescriptor)
	NUMBER_OF_BLOCKS: number
	DENSITY_CODE: number
	BLOCK_LENGTH: unknown /* const array */
}

export declare class SPCModeParameterHeader6 {
	constructor(init?: SPCModeParameterHeader6)
	MODE_DATA_LENGTH: number
	MEDIUM_TYPE: number
	DEVICE_SPECIFIC_PARAMETER: number
	BLOCK_DESCRIPTOR_LENGTH: number
}

export declare class SCSICmd_INQUIRY_PageCx_Header {
	constructor(init?: SCSICmd_INQUIRY_PageCx_Header)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	RESERVED: number
	PAGE_LENGTH: number
}

export declare class SCSICmd_INQUIRY_PageB2_Provisioning_Group_Descriptor {
	constructor(init?: SCSICmd_INQUIRY_PageB2_Provisioning_Group_Descriptor)
	DESIGNATION_DESCRIPTOR: unknown /* const array */
	RESERVED: unknown /* const array */
}

export declare class SCSICmd_INQUIRY_Page89_Data {
	constructor(init?: SCSICmd_INQUIRY_Page89_Data)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	PAGE_LENGTH: number
	Reserved: number
	SAT_VENDOR_IDENTIFICATION: unknown /* const array */
	SAT_PRODUCT_IDENTIFICATION: unknown /* const array */
	SAT_PRODUCT_REVISION_LEVEL: unknown /* const array */
	ATA_DEVICE_SIGNATURE: unknown /* const array */
	COMMAND_CODE: number
	Reserved2: unknown /* const array */
	IDENTIFY_DATA: unknown /* const array */
}

export declare class SCSICmd_INQUIRY_Page83_TargetPortGroup_Identifier {
	constructor(init?: SCSICmd_INQUIRY_Page83_TargetPortGroup_Identifier)
	RESERVED: number
	TARGET_PORT_GROUP: number
}

export declare class SCSICmd_INQUIRY_Page80_Header_SPC_16 {
	constructor(init?: SCSICmd_INQUIRY_Page80_Header_SPC_16)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	PAGE_LENGTH: number
	PRODUCT_SERIAL_NUMBER: number
}

export declare class SCSICmd_INQUIRY_Page80_Header {
	constructor(init?: SCSICmd_INQUIRY_Page80_Header)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	RESERVED: number
	PAGE_LENGTH: number
	PRODUCT_SERIAL_NUMBER: number
}

export declare class SCSICmd_INQUIRY_Page00_Header {
	constructor(init?: SCSICmd_INQUIRY_Page00_Header)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	RESERVED: number
	PAGE_LENGTH: number
}

export declare class IOPowerStateChangeNotification {
	constructor(init?: IOPowerStateChangeNotification)
	powerRef: interop.Pointer
	returnValue: number
	stateNumber: number
	stateFlags: number
}

export declare class IOPMCalendarStruct {
	constructor(init?: IOPMCalendarStruct)
	year: number
	month: number
	day: number
	hour: number
	minute: number
	second: number
	selector: number
}

export declare class IODot3TxExtraEntry {
	constructor(init?: IODot3TxExtraEntry)
	underruns: number
	jabbers: number
	phyErrors: number
	timeouts: number
	interrupts: number
	resets: number
	resourceErrors: number
	reserved: unknown /* const array */
}

export declare class IODot3CollEntry {
	constructor(init?: IODot3CollEntry)
	collFrequencies: unknown /* const array */
}

export declare class IODot3StatsEntry {
	constructor(init?: IODot3StatsEntry)
	alignmentErrors: number
	fcsErrors: number
	singleCollisionFrames: number
	multipleCollisionFrames: number
	sqeTestErrors: number
	deferredTransmissions: number
	lateCollisions: number
	excessiveCollisions: number
	internalMacTransmitErrors: number
	carrierSenseErrors: number
	frameTooLongs: number
	internalMacReceiveErrors: number
	etherChipSet: number
	missedFrames: number
}

export declare class IOOutputQueueStats {
	constructor(init?: IOOutputQueueStats)
	capacity: number
	size: number
	peakSize: number
	dropCount: number
	outputCount: number
	retryCount: number
	stallCount: number
	reserved: unknown /* const array */
}

export declare class IONetworkStats {
	constructor(init?: IONetworkStats)
	inputPackets: number
	inputErrors: number
	outputPackets: number
	outputErrors: number
	collisions: number
}

export declare class VDConfigurationFeatureListRec {
	constructor(init?: VDConfigurationFeatureListRec)
	csConfigFeatureList: interop.Pointer
	csNumConfigFeatures: number
	csReserved1: number
	csReserved2: number
}

export declare class VDDisplayTimingRangeRec {
	constructor(init?: VDDisplayTimingRangeRec)
	csRangeSize: number
	csRangeType: number
	csRangeVersion: number
	csRangeReserved: number
	csRangeBlockIndex: number
	csRangeGroup: number
	csRangeBlockCount: number
	csRangeFlags: number
	csMinPixelClock: number
	csMaxPixelClock: number
	csMaxPixelError: number
	csTimingRangeSyncFlags: number
	csTimingRangeSignalLevels: number
	csTimingRangeSupportedSignalConfigs: number
	csMinFrameRate: number
	csMaxFrameRate: number
	csMinLineRate: number
	csMaxLineRate: number
	csMaxHorizontalTotal: number
	csMaxVerticalTotal: number
	csMaxTotalReserved1: number
	csMaxTotalReserved2: number
	csCharSizeHorizontalActive: number
	csCharSizeHorizontalBlanking: number
	csCharSizeHorizontalSyncOffset: number
	csCharSizeHorizontalSyncPulse: number
	csCharSizeVerticalActive: number
	csCharSizeVerticalBlanking: number
	csCharSizeVerticalSyncOffset: number
	csCharSizeVerticalSyncPulse: number
	csCharSizeHorizontalBorderLeft: number
	csCharSizeHorizontalBorderRight: number
	csCharSizeVerticalBorderTop: number
	csCharSizeVerticalBorderBottom: number
	csCharSizeHorizontalTotal: number
	csCharSizeVerticalTotal: number
	csCharSizeReserved1: number
	csMinHorizontalActiveClocks: number
	csMaxHorizontalActiveClocks: number
	csMinHorizontalBlankingClocks: number
	csMaxHorizontalBlankingClocks: number
	csMinHorizontalSyncOffsetClocks: number
	csMaxHorizontalSyncOffsetClocks: number
	csMinHorizontalPulseWidthClocks: number
	csMaxHorizontalPulseWidthClocks: number
	csMinVerticalActiveClocks: number
	csMaxVerticalActiveClocks: number
	csMinVerticalBlankingClocks: number
	csMaxVerticalBlankingClocks: number
	csMinVerticalSyncOffsetClocks: number
	csMaxVerticalSyncOffsetClocks: number
	csMinVerticalPulseWidthClocks: number
	csMaxVerticalPulseWidthClocks: number
	csMinHorizontalBorderLeft: number
	csMaxHorizontalBorderLeft: number
	csMinHorizontalBorderRight: number
	csMaxHorizontalBorderRight: number
	csMinVerticalBorderTop: number
	csMaxVerticalBorderTop: number
	csMinVerticalBorderBottom: number
	csMaxVerticalBorderBottom: number
	csMaxNumLinks: number
	csMinLink0PixelClock: number
	csMaxLink0PixelClock: number
	csMinLink1PixelClock: number
	csMaxLink1PixelClock: number
	csReserved6: number
	csReserved7: number
	csReserved8: number
}

export declare class VDPrivateSelectorDataRec {
	constructor(init?: VDPrivateSelectorDataRec)
	privateParameters: interop.Pointer
	privateParametersSize: number
	privateResults: interop.Pointer
	privateResultsSize: number
}

export declare class VDConvolutionInfoRec {
	constructor(init?: VDConvolutionInfoRec)
	csDisplayModeID: number
	csDepthMode: number
	csPage: number
	csFlags: number
	csReserved: number
}

export declare class VDResolutionInfoRec {
	constructor(init?: VDResolutionInfoRec)
	csPreviousDisplayModeID: number
	csDisplayModeID: number
	csHorizontalPixels: number
	csVerticalLines: number
	csRefreshRate: number
	csMaxDepthMode: number
	csResolutionFlags: number
	csReserved: number
}

export declare class VDDefMode {
	constructor(init?: VDDefMode)
	csID: number
	filler: number
}

export declare class VDSizeInfo {
	constructor(init?: VDSizeInfo)
	csHSize: number
	csHPos: number
	csVSize: number
	csVPos: number
}

export declare class VDSetEntryRecord {
	constructor(init?: VDSetEntryRecord)
	csTable: interop.Pointer
	csStart: number
	csCount: number
}

export declare class IOHIDDeviceQueueInterface {
	constructor(init?: IOHIDDeviceQueueInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	getAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	setDepth: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	getDepth: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	addElement: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	removeElement: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	containsElement: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	start: (p1: interop.PointerConvertible, p2: number) => number | null
	stop: (p1: interop.PointerConvertible, p2: number) => number | null
	setValueAvailableCallback: (
		p1: interop.PointerConvertible,
		p2: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p3: interop.PointerConvertible,
	) => number | null
	copyNextValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
}

export declare class IOHIDDeviceDeviceInterface {
	constructor(init?: IOHIDDeviceDeviceInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	open: (p1: interop.PointerConvertible, p2: number) => number | null
	close: (p1: interop.PointerConvertible, p2: number) => number | null
	getProperty: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	setProperty: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	getAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	copyMatchingElements: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	setValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p6: interop.PointerConvertible,
		p7: number,
	) => number | null
	getValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p6: interop.PointerConvertible,
		p7: number,
	) => number | null
	setInputReportCallback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.Enum<typeof IOHIDReportType>,
			p5: number,
			p6: interop.PointerConvertible,
			p7: number,
		) => void,
		p5: interop.PointerConvertible,
		p6: number,
	) => number | null
	setReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.Enum<typeof IOHIDReportType>,
			p5: number,
			p6: interop.PointerConvertible,
			p7: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: number,
	) => number | null
	getReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.Enum<typeof IOHIDReportType>,
			p5: number,
			p6: interop.PointerConvertible,
			p7: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: number,
	) => number | null
}

export declare class IOHIDDeviceInterface122 {
	constructor(init?: IOHIDDeviceInterface122)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	createAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	getAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	createAsyncPort: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getAsyncPort: (p1: interop.PointerConvertible) => number | null
	open: (p1: interop.PointerConvertible, p2: number) => number | null
	close: (p1: interop.PointerConvertible) => number | null
	setRemovalCallback: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	getElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	setElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	queryElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	startAllQueues: (p1: interop.PointerConvertible) => number | null
	stopAllQueues: (p1: interop.PointerConvertible) => number | null
	allocQueue: (p1: interop.PointerConvertible) => interop.Pointer | null
	allocOutputTransaction: (p1: interop.PointerConvertible) => interop.Pointer | null
	setReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	getReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	copyMatchingElements: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	setInterruptReportHandlerCallback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
}

export declare class IOHIDDeviceInterface {
	constructor(init?: IOHIDDeviceInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	createAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	getAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	createAsyncPort: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getAsyncPort: (p1: interop.PointerConvertible) => number | null
	open: (p1: interop.PointerConvertible, p2: number) => number | null
	close: (p1: interop.PointerConvertible) => number | null
	setRemovalCallback: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	getElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	setElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	queryElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	startAllQueues: (p1: interop.PointerConvertible) => number | null
	stopAllQueues: (p1: interop.PointerConvertible) => number | null
	allocQueue: (p1: interop.PointerConvertible) => interop.Pointer | null
	allocOutputTransaction: (p1: interop.PointerConvertible) => interop.Pointer | null
	setReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	getReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
}

export declare class IOHIDQueueInterface {
	constructor(init?: IOHIDQueueInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	createAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	getAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	createAsyncPort: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getAsyncPort: (p1: interop.PointerConvertible) => number | null
	create: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	dispose: (p1: interop.PointerConvertible) => number | null
	addElement: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	removeElement: (p1: interop.PointerConvertible, p2: number) => number | null
	hasElement: (p1: interop.PointerConvertible, p2: number) => number | null
	start: (p1: interop.PointerConvertible) => number | null
	stop: (p1: interop.PointerConvertible) => number | null
	getNextEvent: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: UnsignedWide,
		p4: number,
	) => number | null
	setEventCallout: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	getEventCallout: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
}

export declare class IOHIDEventStruct {
	constructor(init?: IOHIDEventStruct)
	type: interop.Enum<typeof IOHIDElementType>
	elementCookie: number
	value: number
	timestamp: UnsignedWide
	longValueSize: number
	longValue: interop.Pointer
}

export declare class IOGraphicsEngineContext {
	constructor(init?: IOGraphicsEngineContext)
	contextLock: number
	state: number
	owner: interop.Pointer
	version: number
	structSize: number
	reserved: unknown /* const array */
}

export declare class StdFBShmem_t {
	constructor(init?: StdFBShmem_t)
	cursorSema: number
	frame: number
	cursorShow: number
	cursorObscured: number
	shieldFlag: number
	shielded: number
	saveRect: IOGBounds
	shieldRect: IOGBounds
	cursorLoc: IOGPoint
	cursorRect: IOGBounds
	oldCursorRect: IOGBounds
	screenBounds: IOGBounds
	version: number
	structSize: number
	vblTime: UnsignedWide
	vblDelta: UnsignedWide
	vblCount: number
	reservedC: unknown /* const array */
	hardwareCursorFlags: unknown /* const array */
	hardwareCursorCapable: number
	hardwareCursorActive: number
	hardwareCursorShields: number
	reservedB: unknown /* const array */
	cursorSize: unknown /* const array */
	hotSpot: unknown /* const array */
	cursor: unnamed_10924855648621315523
}

export declare class IOVideoStreamDescription {
	constructor(init?: IOVideoStreamDescription)
	mVideoCodecType: number
	mVideoCodecFlags: number
	mWidth: number
	mHeight: number
	mReserved1: number
	mReserved2: number
}

export declare class UserExportDCLCommandStruct {
	constructor(init?: UserExportDCLCommandStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	operands: unknown /* const array */
}

export declare class bm38Cursor {
	constructor(init?: bm38Cursor)
	image: unknown /* const array */
	save: unknown /* const array */
}

export declare class bm34Cursor {
	constructor(init?: bm34Cursor)
	image: unknown /* const array */
	save: unknown /* const array */
}

export declare class IOGraphicsAcceleratorInterfaceStruct {
	constructor(init?: IOGraphicsAcceleratorInterfaceStruct)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	version: number
	revision: number
	Probe: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	Start: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	Stop: (p1: interop.PointerConvertible) => number | null
	Reset: (p1: interop.PointerConvertible, p2: number) => number | null
	CopyCapabilities: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetBlitProc: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
	) => number | null
	Flush: (p1: interop.PointerConvertible, p2: number) => number | null
	WaitForCompletion: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	Synchronize: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	GetBeamPosition: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	AllocateSurface: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	FreeSurface: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	LockSurface: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	UnlockSurface: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	SwapSurface: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	SetDestination: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetBlitter: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
	) => number | null
	WaitComplete: (p1: interop.PointerConvertible, p2: number) => number | null
	__gaInterfaceReserved: unknown /* const array */
}

export declare class IOBlitSurfaceStruct {
	constructor(init?: IOBlitSurfaceStruct)
	memory: unnamed_2395891732250933184
	pixelFormat: number
	size: IOBlitRectangleStruct
	rowBytes: number
	byteOffset: number
	palette: interop.Pointer
	accessFlags: number
	interfaceRef: interop.Pointer
	more: unknown /* const array */
}

export declare class _IOBlitMemory {
	constructor(init?: _IOBlitMemory)
}

export declare class IOBlitCursorStruct {
	constructor(init?: IOBlitCursorStruct)
	operation: IOBlitOperationStruct
	rect: IOBlitRectangleStruct
}

export declare class IOBlitVertexStruct {
	constructor(init?: IOBlitVertexStruct)
	x: number
	y: number
}

export declare class IOBlitCopyRectangleStruct {
	constructor(init?: IOBlitCopyRectangleStruct)
	sourceX: number
	sourceY: number
	x: number
	y: number
	width: number
	height: number
}

export declare class IOBlitOperationStruct {
	constructor(init?: IOBlitOperationStruct)
	color0: number
	color1: number
	offsetX: number
	offsetY: number
	sourceKeyColor: number
	destKeyColor: number
	specific: unknown /* const array */
}

export declare class IOAccelDeviceRegion {
	constructor(init?: IOAccelDeviceRegion)
	num_rects: number
	bounds: IOAccelBounds
	rect: unknown /* const array */
}

export declare class _IOAudioSampleRate {
	constructor(init?: _IOAudioSampleRate)
	whole: number
	fraction: number
}

export declare class _IOAudioStreamDataDescriptor {
	constructor(init?: _IOAudioStreamDataDescriptor)
	fVersion: number
	fNumberOfStreams: number
	fStreamLength: unknown /* const array */
}

export declare class IORPCMessage {
	constructor(init?: IORPCMessage)
	msgid: number
	flags: number
	objectRefs: number
	objects: unknown /* const array */
}

export declare class IORPCMessageMach {
	constructor(init?: IORPCMessageMach)
	msgh: mach_msg_header_t
	msgh_body: mach_msg_body_t
	objects: unknown /* const array */
}

export declare class IOUSBInterfaceStruct500 {
	constructor(init?: IOUSBInterfaceStruct500)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
	) => number | null
}

export declare class IOCFPlugInInterfaceStruct {
	constructor(init?: IOCFPlugInInterfaceStruct)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	version: number
	revision: number
	Probe: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	Start: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	Stop: (p1: interop.PointerConvertible) => number | null
}

export declare class _IOAudioNotificationMessage {
	constructor(init?: _IOAudioNotificationMessage)
	messageHeader: mach_msg_header_t
	type: number
	ref: number
	sender: interop.Pointer
}

export declare class _evGlobals {
	constructor(init?: _evGlobals)
	cursorSema: number
	eNum: number
	buttons: number
	eventFlags: number
	VertRetraceClock: number
	cursorLoc: IOGPoint
	frame: number
	workBounds: IOGBounds
	mouseRect: IOGBounds
	version: number
	structSize: number
	lastFrame: number
	screenCursorFixed: __IOFixedPoint32
	desktopCursorFixed: __IOFixedPoint32
	reservedA: unknown /* const array */
	reserved: number
	updateCursorPositionFromFixed: number
	logCursorUpdates: number
	wantPressure: number
	wantPrecision: number
	dontWantCoalesce: number
	dontCoalesce: number
	mouseRectValid: number
	movedMask: number
	waitCursorSema: number
	AALastEventSent: number
	AALastEventConsumed: number
	waitCursorUp: number
	ctxtTimedOut: number
	waitCursorEnabled: number
	globalWaitCursorEnabled: number
	waitThreshold: number
	LLEHead: number
	LLETail: number
	LLELast: number
	lleq: unknown /* const array */
}

export declare class VDGammaInfoRec {
	constructor(init?: VDGammaInfoRec)
	csLastGammaID: number
	csNextGammaID: number
	csGammaPtr: string | null
	csReserved: number
}

export declare class UASPipeDescriptor {
	constructor(init?: UASPipeDescriptor)
	bLength: number
	bDescriptorType: number
	bPipeID: number
	bReserved: number
}

export declare class IOBlitCopyRegionStruct {
	constructor(init?: IOBlitCopyRegionStruct)
	operation: IOBlitOperationStruct
	deltaX: number
	deltaY: number
	region: interop.Pointer
}

export declare class ModePageFormatHeader {
	constructor(init?: ModePageFormatHeader)
	PS_PAGE_CODE: number
	PAGE_LENGTH: number
}

export declare class SCSICmd_INQUIRY_Page00_Header_SPC_16 {
	constructor(init?: SCSICmd_INQUIRY_Page00_Header_SPC_16)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	PAGE_LENGTH: number
}

export declare class SBCModePageRigidDiskGeometry {
	constructor(init?: SBCModePageRigidDiskGeometry)
	header: ModePageFormatHeader
	NUMBER_OF_CYLINDERS: unknown /* const array */
	NUMBER_OF_HEADS: number
	STARTING_CYLINDER_WRITE_PRECOMPENSATION: unknown /* const array */
	STARTING_CYLINDER_REDUCED_WRITE_CURRENT: unknown /* const array */
	DEVICE_STEP_RATE: number
	LANDING_ZONE_CYLINDER: unknown /* const array */
	RPL: number
	ROTATIONAL_OFFSET: number
	RESERVED: number
	MEDIUM_ROTATION_RATE: number
	RESERVED1: unknown /* const array */
}

export declare class IOUSBConfigurationDescriptor {
	constructor(init?: IOUSBConfigurationDescriptor)
	bLength: number
	bDescriptorType: number
	wTotalLength: number
	bNumInterfaces: number
	bConfigurationValue: number
	iConfiguration: number
	bmAttributes: number
	MaxPower: number
}

export declare class IOUSBDeviceCapabilityBillboard {
	constructor(init?: IOUSBDeviceCapabilityBillboard)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
	iAdditionalInfoURL: number
	bNumberOfAlternateModes: number
	bPreferredAlternateMode: number
	vCONNPower: number
	bmConfigured: unknown /* const array */
	bcdVersion: number
	bAdditionalFailureInfo: number
	bReserved: number
	pAltConfigurations: interop.Pointer
}

export declare class IOUSBInterfaceStruct942 {
	constructor(init?: IOUSBInterfaceStruct942)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV3: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetEndpointPropertiesV3: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SupportsStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	CreateStreams: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetConfiguredStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ReadStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: number,
	) => number | null
	WriteStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
	) => number | null
	ReadStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	WriteStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	AbortStreamsPipe: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	RegisterForNotification: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	UnregisterNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	AcknowledgeNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	RegisterDriver: (p1: interop.PointerConvertible) => number | null
	SetDeviceIdlePolicy: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipeIdlePolicy: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetInterfaceAsyncNotificationPort: (p1: interop.PointerConvertible) => interop.Pointer | null
}

export declare class _IODataQueueAppendix {
	constructor(init?: _IODataQueueAppendix)
	version: number
	msgh: mach_msg_header_t
}

export declare class _IODataQueueMemory {
	constructor(init?: _IODataQueueMemory)
	queueSize: number
	head: number
	tail: number
	queue: unknown /* const array */
}

export declare class ATASMARTDataThresholds {
	constructor(init?: ATASMARTDataThresholds)
	vendorSpecific1: unknown /* const array */
	vendorSpecific2: unknown /* const array */
	checksum: number
}

export declare class VDSwitchInfoRec {
	constructor(init?: VDSwitchInfoRec)
	csMode: number
	csData: number
	csPage: number
	csBaseAddr: string | null
	csReserved: number
}

export declare class IOBlitRectangleStruct {
	constructor(init?: IOBlitRectangleStruct)
	x: number
	y: number
	width: number
	height: number
}

export declare class DCLJumpStruct {
	constructor(init?: DCLJumpStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	pJumpDCLLabel: interop.Pointer
}

export declare class ATASMARTData {
	constructor(init?: ATASMARTData)
	vendorSpecific1: unknown /* const array */
	offLineDataCollectionStatus: number
	selfTestExecutionStatus: number
	secondsToCompleteOffLineActivity: unknown /* const array */
	vendorSpecific2: number
	offLineDataCollectionCapability: number
	SMARTCapability: unknown /* const array */
	errorLoggingCapability: number
	vendorSpecific3: number
	shortTestPollingInterval: number
	extendedTestPollingInterval: number
	reserved: unknown /* const array */
	vendorSpecific4: unknown /* const array */
	checksum: number
}

export declare class IOUSBInterfaceStruct550 {
	constructor(init?: IOUSBInterfaceStruct550)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV3: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetEndpointPropertiesV3: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SupportsStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	CreateStreams: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetConfiguredStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ReadStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: number,
	) => number | null
	WriteStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
	) => number | null
	ReadStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	WriteStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	AbortStreamsPipe: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
}

export declare class VDVideoParametersInfoRec {
	constructor(init?: VDVideoParametersInfoRec)
	csDisplayModeID: number
	csDepthMode: number
	csVPBlockPtr: interop.Pointer
	csPageCount: number
	csDeviceType: number
	csDepthFlags: number
}

export declare class SCSICmd_INQUIRY_Page83_LogicalUnitGroup_Identifier {
	constructor(init?: SCSICmd_INQUIRY_Page83_LogicalUnitGroup_Identifier)
	RESERVED: number
	LOGICAL_UNIT_GROUP: number
}

export declare class _IOAudioStreamFormat {
	constructor(init?: _IOAudioStreamFormat)
	fNumChannels: number
	fSampleFormat: number
	fNumericRepresentation: number
	fBitDepth: number
	fBitWidth: number
	fAlignment: number
	fByteOrder: number
	fIsMixable: number
	fDriverTag: number
}

export declare class VDDisplayConnectInfoRec {
	constructor(init?: VDDisplayConnectInfoRec)
	csDisplayType: number
	csConnectTaggedType: number
	csConnectTaggedData: number
	csConnectFlags: number
	csDisplayComponent: number
	csConnectReserved: number
}

export declare class VDDrawHardwareCursorRec {
	constructor(init?: VDDrawHardwareCursorRec)
	csCursorX: number
	csCursorY: number
	csCursorVisible: number
	csReserved1: number
	csReserved2: number
}

export declare class dk_cd_read_toc_t {
	constructor(init?: dk_cd_read_toc_t)
	format: number
	formatAsTime: number
	reserved0016: unknown /* const array */
	address: unnamed_9382568860700690146
	reserved0064: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class SCSICmd_INQUIRY_StandardData {
	constructor(init?: SCSICmd_INQUIRY_StandardData)
	PERIPHERAL_DEVICE_TYPE: number
	RMB: number
	VERSION: number
	RESPONSE_DATA_FORMAT: number
	ADDITIONAL_LENGTH: number
	SCCSReserved: number
	flags1: number
	flags2: number
	VENDOR_IDENTIFICATION: unknown /* const array */
	PRODUCT_IDENTIFICATION: unknown /* const array */
	PRODUCT_REVISION_LEVEL: unknown /* const array */
}

export declare class ATASMARTLogDirectory {
	constructor(init?: ATASMARTLogDirectory)
	SMARTLoggingVersion: unknown /* const array */
	entries: unknown /* const array */
}

export declare class VDConfigurationRec {
	constructor(init?: VDConfigurationRec)
	csConfigFeature: number
	csConfigSupport: number
	csConfigValue: number
	csReserved1: number
	csReserved2: number
}

export declare class IOUSBHIDReportDesc {
	constructor(init?: IOUSBHIDReportDesc)
	hidDescriptorType: number
	hidDescriptorLengthLo: number
	hidDescriptorLengthHi: number
}

export declare class VDSetHardwareCursorRec {
	constructor(init?: VDSetHardwareCursorRec)
	csCursorRef: interop.Pointer
	csReserved1: number
	csReserved2: number
}

export declare class LowLatencyUserBufferInfo {
	constructor(init?: LowLatencyUserBufferInfo)
	cookie: number
	bufferAddress: interop.Pointer
	bufferSize: number
	bufferType: number
	isPrepared: number
	nextBuffer: interop.Pointer
}

export declare class FWAddressStruct {
	constructor(init?: FWAddressStruct)
	nodeID: number
	addressHi: number
	addressLo: number
}

export declare class IOUSBStringDescriptor {
	constructor(init?: IOUSBStringDescriptor)
	bLength: number
	bDescriptorType: number
	bString: unknown /* const array */
}

export declare class bm18Cursor {
	constructor(init?: bm18Cursor)
	image: unknown /* const array */
	mask: unknown /* const array */
	save: unknown /* const array */
}

export declare class DDMap {
	constructor(init?: DDMap)
	ddBlock: number
	ddSize: number
	ddType: number
}

export declare class IOUSBCompletionWithTimeStamp {
	constructor(init?: IOUSBCompletionWithTimeStamp)
	target: interop.Pointer
	action: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
		p5: UnsignedWide,
	) => void | null
	parameter: interop.Pointer
}

export declare class VDRetrieveGammaRec {
	constructor(init?: VDRetrieveGammaRec)
	csGammaTableID: number
	csGammaTablePtr: interop.Pointer
}

export declare class IOUSBGetFrameStruct {
	constructor(init?: IOUSBGetFrameStruct)
	frame: number
	timeStamp: UnsignedWide
}

export declare class IOUSBInterfaceStruct400 {
	constructor(init?: IOUSBInterfaceStruct400)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class evsioMouseScaling {
	constructor(init?: evsioMouseScaling)
	numScaleLevels: number
	scaleThresholds: unknown /* const array */
	scaleFactors: unknown /* const array */
}

export declare class __IOHIDValue {
	constructor(init?: __IOHIDValue)
}

export declare class _NXParsedKeyMapping_ {
	constructor(init?: _NXParsedKeyMapping_)
	shorts: number
	keyBits: unknown /* const array */
	maxMod: number
	modDefs: unknown /* const array */
	numDefs: number
	keyDefs: unknown /* const array */
	numSeqs: number
	seqDefs: unknown /* const array */
	numSpecialKeys: number
	specialKeys: unknown /* const array */
	mapping: interop.Pointer
	mappingLen: number
}

export declare class __IOHIDManager {
	constructor(init?: __IOHIDManager)
}

export declare class VDSyncInfoRec {
	constructor(init?: VDSyncInfoRec)
	csMode: number
	csFlags: number
}

export declare class IOUSBIsocCompletion {
	constructor(init?: IOUSBIsocCompletion)
	target: interop.Pointer
	action: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => void | null
	parameter: interop.Pointer
}

export declare class IOFramebufferInformation {
	constructor(init?: IOFramebufferInformation)
	baseAddress: number
	activeWidth: number
	activeHeight: number
	bytesPerRow: number
	bytesPerPlane: number
	bitsPerPixel: number
	pixelType: number
	flags: number
	reserved: unknown /* const array */
}

export declare class applelabel {
	constructor(init?: applelabel)
	al_boot0: unknown /* const array */
	al_magic: number
	al_type: number
	al_flags: number
	al_offset: number
	al_size: number
	al_checksum: number
	al_boot1: unknown /* const array */
}

export declare class VDScalerInfoRec {
	constructor(init?: VDScalerInfoRec)
	csScalerInfoSize: number
	csScalerInfoVersion: number
	csReserved1: number
	csReserved2: number
	csScalerFeatures: number
	csMaxHorizontalPixels: number
	csMaxVerticalPixels: number
	csReserved3: number
	csReserved4: number
	csReserved5: number
	csReserved6: number
	csReserved7: number
}

export declare class IOAccelSurfaceReadData {
	constructor(init?: IOAccelSurfaceReadData)
	x: number
	y: number
	w: number
	h: number
	client_addr: number
	client_row_bytes: number
}

export declare class __IOHIDElement {
	constructor(init?: __IOHIDElement)
}

export declare class IOUSBDeviceRequestSetSELData {
	constructor(init?: IOUSBDeviceRequestSetSELData)
	u1Sel: number
	u1Pel: number
	u2Sel: number
	u2Pel: number
}

export declare class SPCModeParameterHeader10 {
	constructor(init?: SPCModeParameterHeader10)
	MODE_DATA_LENGTH: number
	MEDIUM_TYPE: number
	DEVICE_SPECIFIC_PARAMETER: number
	LONGLBA: number
	RESERVED: number
	BLOCK_DESCRIPTOR_LENGTH: number
}

export declare class ModeParameterBlockDescriptor {
	constructor(init?: ModeParameterBlockDescriptor)
	DENSITY_CODE: number
	NUMBER_OF_BLOCKS: unknown /* const array */
	RESERVED: number
	BLOCK_LENGTH: unknown /* const array */
}

export declare class SCSICmd_INQUIRY_Page83_Header_SPC_16 {
	constructor(init?: SCSICmd_INQUIRY_Page83_Header_SPC_16)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	PAGE_LENGTH: number
}

export declare class SCSICmd_INQUIRY_PageB2_Data {
	constructor(init?: SCSICmd_INQUIRY_PageB2_Data)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	PAGE_LENGTH: number
	THRESHOLD_EXPONENT: number
	LBP_FLAGS: number
	MINIMUM_PERCENTAGE: number
	THRESHOLD_PERCENTAGE: number
}

export declare class IOUSBDeviceStruct400 {
	constructor(init?: IOUSBDeviceStruct400)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetUSBDeviceInformation: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	RequestExtraPower: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	ReturnExtraPower: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetExtraPowerAllocated: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class VDSettings {
	constructor(init?: VDSettings)
	csParamCnt: number
	csBrightMax: number
	csBrightDef: number
	csBrightVal: number
	csCntrstMax: number
	csCntrstDef: number
	csCntrstVal: number
	csTintMax: number
	csTintDef: number
	csTintVal: number
	csHueMax: number
	csHueDef: number
	csHueVal: number
	csHorizDef: number
	csHorizVal: number
	csHorizMax: number
	csVertDef: number
	csVertVal: number
	csVertMax: number
}

export declare class SCSICmd_INQUIRY_Page83_Header {
	constructor(init?: SCSICmd_INQUIRY_Page83_Header)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	RESERVED: number
	PAGE_LENGTH: number
}

export declare class _IOAudioBufferDataDescriptor {
	constructor(init?: _IOAudioBufferDataDescriptor)
	fActualDataByteSize: number
	fActualNumSampleFrames: number
	fTotalDataByteSize: number
	fNominalDataByteSize: number
	fData: unknown /* const array */
}

export declare class IOUSBInterfaceStruct300 {
	constructor(init?: IOUSBInterfaceStruct300)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class SCSICmd_INQUIRY_Page83_RelativeTargetPort_Identifier {
	constructor(init?: SCSICmd_INQUIRY_Page83_RelativeTargetPort_Identifier)
	OBSOLETE: number
	RELATIVE_TARGET_PORT_IDENTIFIER: number
}

export declare class unnamed_10854644804533774633 {
	constructor(init?: unnamed_10854644804533774633)
	dx: number
	dy: number
	subx: number
	suby: number
	subType: number
	reserved1: number
	reserved2: number
	tablet: unnamed_1287348019338051674
}

export declare class IOBlitScanlinesStruct {
	constructor(init?: IOBlitScanlinesStruct)
	operation: IOBlitOperationStruct
	count: number
	y: number
	height: number
	x: unknown /* const array */
}

export declare class VDDetailedTimingRec {
	constructor(init?: VDDetailedTimingRec)
	csTimingSize: number
	csTimingType: number
	csTimingVersion: number
	csTimingReserved: number
	csDisplayModeID: number
	csDisplayModeSeed: number
	csDisplayModeState: number
	csDisplayModeAlias: number
	csSignalConfig: number
	csSignalLevels: number
	csPixelClock: number
	csMinPixelClock: number
	csMaxPixelClock: number
	csHorizontalActive: number
	csHorizontalBlanking: number
	csHorizontalSyncOffset: number
	csHorizontalSyncPulseWidth: number
	csVerticalActive: number
	csVerticalBlanking: number
	csVerticalSyncOffset: number
	csVerticalSyncPulseWidth: number
	csHorizontalBorderLeft: number
	csHorizontalBorderRight: number
	csVerticalBorderTop: number
	csVerticalBorderBottom: number
	csHorizontalSyncConfig: number
	csHorizontalSyncLevel: number
	csVerticalSyncConfig: number
	csVerticalSyncLevel: number
	csNumLinks: number
	csReserved2: number
	csReserved3: number
	csReserved4: number
	csReserved5: number
	csReserved6: number
	csReserved7: number
	csReserved8: number
}

export declare class SCSICmd_INQUIRY_PageB1_Data {
	constructor(init?: SCSICmd_INQUIRY_PageB1_Data)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	Reserved: number
	PAGE_LENGTH: number
	MEDIUM_ROTATION_RATE: number
	Reserved2: unknown /* const array */
}

export declare class DVDRZoneInfo {
	constructor(init?: DVDRZoneInfo)
	dataLength: number
	rzoneNumberLSB: number
	borderNumberLSB: number
	reserved: number
	reserved2: number
	copy: number
	damage: number
	reserved3: number
	reserved4: number
	restrictedOverwrite: number
	incremental: number
	blank: number
	reservedRZone: number
	nextWritableAddressValid: number
	lastRecordedAddressValid: number
	reserved5: number
	rzoneStartAddress: number
	nextWritableAddress: number
	freeBlocks: number
	blockingFactor: number
	rzoneSize: number
	lastRecordedAddress: number
	rzoneNumberMSB: number
	borderNumberMSB: number
	reserved6: number
	reserved7: number
}

export declare class LowLatencyUserBufferInfoV2 {
	constructor(init?: LowLatencyUserBufferInfoV2)
	cookie: number
	bufferAddress: interop.Pointer
	bufferSize: number
	bufferType: number
	isPrepared: number
	mappedUHCIAddress: interop.Pointer
	nextBuffer: interop.Pointer
}

export declare class IOPixelInformation {
	constructor(init?: IOPixelInformation)
	bytesPerRow: number
	bytesPerPlane: number
	bitsPerPixel: number
	pixelType: number
	componentCount: number
	bitsPerComponent: number
	componentMasks: unknown /* const array */
	pixelFormat: unknown /* const array */
	flags: number
	activeWidth: number
	activeHeight: number
	reserved: unknown /* const array */
}

export declare class IOUSBLowLatencyIsocStruct {
	constructor(init?: IOUSBLowLatencyIsocStruct)
	fPipe: number
	fBufSize: number
	fStartFrame: number
	fNumFrames: number
	fUpdateFrequency: number
	fDataBufferCookie: number
	fDataBufferOffset: number
	fFrameListBufferCookie: number
	fFrameListBufferOffset: number
}

export declare class IOUSBDeviceCapabilityDescriptorHeader {
	constructor(init?: IOUSBDeviceCapabilityDescriptorHeader)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
}

export declare class IOUSB30HubPortStatusExt {
	constructor(init?: IOUSB30HubPortStatusExt)
	wPortStatus: number
	wPortChange: number
	dwExtPortStatus: number
}

export declare class IOUSBIsocFrame {
	constructor(init?: IOUSBIsocFrame)
	frStatus: number
	frReqCount: number
	frActCount: number
}

export declare class CDTEXTDescriptor {
	constructor(init?: CDTEXTDescriptor)
	packType: number
	trackNumber: number
	sequenceNumber: number
	characterPosition: number
	blockNumber: number
	doubleByteCharacterCode: number
	textData: unknown /* const array */
	reserved: unknown /* const array */
}

export declare class IOEthernetStats {
	constructor(init?: IOEthernetStats)
	dot3StatsEntry: IODot3StatsEntry
	dot3CollEntry: IODot3CollEntry
	dot3RxExtraEntry: IODot3RxExtraEntry
	dot3TxExtraEntry: IODot3TxExtraEntry
}

export declare class IOUSBDescriptorHeader {
	constructor(init?: IOUSBDescriptorHeader)
	bLength: number
	bDescriptorType: number
}

export declare class _NXEventExtension {
	constructor(init?: _NXEventExtension)
	flags: number
	audit: audit_token_t
}

export declare class unnamed_4661731728819155438 {
	constructor(init?: unnamed_4661731728819155438)
	x: number
	y: number
}

export declare class unnamed_8970883627365768146 {
	constructor(init?: unnamed_8970883627365768146)
	vendorID: number
	tabletID: number
	pointerID: number
	deviceID: number
	systemTabletID: number
	vendorPointerType: number
	pointerSerialNumber: number
	uniqueID: number
	capabilityMask: number
	pointerType: number
	enterProximity: number
	reserved1: number
	reserved2: unknown /* const array */
}

export declare class unnamed_11232072664559040057 {
	constructor(init?: unnamed_11232072664559040057)
	x: number
	y: number
	z: number
	buttons: number
	pressure: number
	tilt: unnamed_3719132138026818458
	rotation: number
	tangentialPressure: number
	deviceID: number
	vendor1: number
	vendor2: number
	vendor3: number
	reserved: unknown /* const array */
}

export declare class unnamed_4116032477102299272 {
	constructor(init?: unnamed_4116032477102299272)
	deltaAxis1: number
	deltaAxis2: number
	deltaAxis3: number
	reserved1: number
	fixedDeltaAxis1: number
	fixedDeltaAxis2: number
	fixedDeltaAxis3: number
	pointDeltaAxis1: number
	pointDeltaAxis2: number
	pointDeltaAxis3: number
	reserved8: unknown /* const array */
}

export declare class unnamed_14501965845456453057 {
	constructor(init?: unnamed_14501965845456453057)
	reserved: number
	eventNum: number
	trackingNum: number
	userData: number
	reserved1: number
	reserved2: number
	reserved3: number
	reserved4: number
	reserved5: number
	reserved6: unknown /* const array */
}

export declare class unnamed_7504216891884428952 {
	constructor(init?: unnamed_7504216891884428952)
	origCharSet: number
	repeat: number
	charSet: number
	charCode: number
	keyCode: number
	origCharCode: number
	reserved1: number
	keyboardType: number
	reserved2: number
	reserved3: number
	reserved4: number
	reserved5: unknown /* const array */
}

export declare class unnamed_6275799594833531837 {
	constructor(init?: unnamed_6275799594833531837)
	subx: number
	suby: number
	eventNum: number
	click: number
	pressure: number
	buttonNumber: number
	subType: number
	reserved2: number
	reserved3: number
	tablet: unnamed_2774405816219376817
}

export declare class _NXTabletProximityData {
	constructor(init?: _NXTabletProximityData)
	vendorID: number
	tabletID: number
	pointerID: number
	deviceID: number
	systemTabletID: number
	vendorPointerType: number
	pointerSerialNumber: number
	uniqueID: number
	capabilityMask: number
	pointerType: number
	enterProximity: number
	reserved1: number
}

export declare class unnamed_13681803734884863347 {
	constructor(init?: unnamed_13681803734884863347)
	x: number
	y: number
}

export declare class _NXPoint {
	constructor(init?: _NXPoint)
	x: number
	y: number
}

export declare class NXEventSystemDeviceList {
	constructor(init?: NXEventSystemDeviceList)
	dev: unknown /* const array */
}

export declare class __IOFixedPoint32 {
	constructor(init?: __IOFixedPoint32)
	x: number
	y: number
}

export declare class evsioKeymapping {
	constructor(init?: evsioKeymapping)
	size: number
	mapping: string | null
}

export declare class _NXEQElStruct {
	constructor(init?: _NXEQElStruct)
	next: number
	sema: number
	event: _NXEvent
}

export declare class IOFBDPLinkConfig {
	constructor(init?: IOFBDPLinkConfig)
	version: number
	bitRate: number
	__reservedA: unknown /* const array */
	t1Time: number
	t2Time: number
	t3Time: number
	idlePatterns: number
	laneCount: number
	voltage: number
	preEmphasis: number
	downspread: number
	scrambler: number
	maxBitRate: number
	maxLaneCount: number
	maxDownspread: number
	__reservedB: unknown /* const array */
}

export declare class IOHardwareCursorInfo {
	constructor(init?: IOHardwareCursorInfo)
	majorVersion: number
	minorVersion: number
	cursorHeight: number
	cursorWidth: number
	colorMap: interop.Pointer
	hardwareCursorData: interop.Pointer
	cursorHotSpotX: number
	cursorHotSpotY: number
	reserved: unknown /* const array */
}

export declare class IOHardwareCursorDescriptor {
	constructor(init?: IOHardwareCursorDescriptor)
	majorVersion: number
	minorVersion: number
	height: number
	width: number
	bitDepth: number
	maskBitDepth: number
	numColors: number
	colorEncodings: interop.Pointer
	flags: number
	supportedSpecialEncodings: number
	specialEncodings: unknown /* const array */
}

export declare class IOGBounds {
	constructor(init?: IOGBounds)
	minx: number
	maxx: number
	miny: number
	maxy: number
}

export declare class IODisplayScalerInformation {
	constructor(init?: IODisplayScalerInformation)
	__reservedA: unknown /* const array */
	version: number
	__reservedB: unknown /* const array */
	scalerFeatures: number
	maxHorizontalPixels: number
	maxVerticalPixels: number
	__reservedC: unknown /* const array */
}

export declare class IODisplayTimingRangeV1 {
	constructor(init?: IODisplayTimingRangeV1)
	__reservedA: unknown /* const array */
	version: number
	__reservedB: unknown /* const array */
	minPixelClock: number
	maxPixelClock: number
	maxPixelError: number
	supportedSyncFlags: number
	supportedSignalLevels: number
	supportedSignalConfigs: number
	minFrameRate: number
	maxFrameRate: number
	minLineRate: number
	maxLineRate: number
	maxHorizontalTotal: number
	maxVerticalTotal: number
	__reservedD: unknown /* const array */
	charSizeHorizontalActive: number
	charSizeHorizontalBlanking: number
	charSizeHorizontalSyncOffset: number
	charSizeHorizontalSyncPulse: number
	charSizeVerticalActive: number
	charSizeVerticalBlanking: number
	charSizeVerticalSyncOffset: number
	charSizeVerticalSyncPulse: number
	charSizeHorizontalBorderLeft: number
	charSizeHorizontalBorderRight: number
	charSizeVerticalBorderTop: number
	charSizeVerticalBorderBottom: number
	charSizeHorizontalTotal: number
	charSizeVerticalTotal: number
	__reservedE: number
	minHorizontalActiveClocks: number
	maxHorizontalActiveClocks: number
	minHorizontalBlankingClocks: number
	maxHorizontalBlankingClocks: number
	minHorizontalSyncOffsetClocks: number
	maxHorizontalSyncOffsetClocks: number
	minHorizontalPulseWidthClocks: number
	maxHorizontalPulseWidthClocks: number
	minVerticalActiveClocks: number
	maxVerticalActiveClocks: number
	minVerticalBlankingClocks: number
	maxVerticalBlankingClocks: number
	minVerticalSyncOffsetClocks: number
	maxVerticalSyncOffsetClocks: number
	minVerticalPulseWidthClocks: number
	maxVerticalPulseWidthClocks: number
	minHorizontalBorderLeft: number
	maxHorizontalBorderLeft: number
	minHorizontalBorderRight: number
	maxHorizontalBorderRight: number
	minVerticalBorderTop: number
	maxVerticalBorderTop: number
	minVerticalBorderBottom: number
	maxVerticalBorderBottom: number
	maxNumLinks: number
	minLink0PixelClock: number
	maxLink0PixelClock: number
	minLink1PixelClock: number
	maxLink1PixelClock: number
	supportedPixelEncoding: number
	supportedBitsPerColorComponent: number
	supportedColorimetryModes: number
	supportedDynamicRangeModes: number
	__reservedF: unknown /* const array */
}

export declare class IOFBDisplayModeDescription {
	constructor(init?: IOFBDisplayModeDescription)
	info: IODisplayModeInformation
	timingInfo: IOTimingInformation
}

export declare class IODetailedTimingInformationV2 {
	constructor(init?: IODetailedTimingInformationV2)
	__reservedA: unknown /* const array */
	horizontalScaledInset: number
	verticalScaledInset: number
	scalerFlags: number
	horizontalScaled: number
	verticalScaled: number
	signalConfig: number
	signalLevels: number
	pixelClock: number
	minPixelClock: number
	maxPixelClock: number
	horizontalActive: number
	horizontalBlanking: number
	horizontalSyncOffset: number
	horizontalSyncPulseWidth: number
	verticalActive: number
	verticalBlanking: number
	verticalSyncOffset: number
	verticalSyncPulseWidth: number
	horizontalBorderLeft: number
	horizontalBorderRight: number
	verticalBorderTop: number
	verticalBorderBottom: number
	horizontalSyncConfig: number
	horizontalSyncLevel: number
	verticalSyncConfig: number
	verticalSyncLevel: number
	numLinks: number
	verticalBlankingExtension: number
	pixelEncoding: number
	bitsPerColorComponent: number
	colorimetry: number
	dynamicRange: number
	dscCompressedBitsPerPixel: number
	dscSliceHeight: number
	dscSliceWidth: number
	verticalBlankingMaxStretchPerFrame: number
	verticalBlankingMaxShrinkPerFrame: number
	__reservedB: unknown /* const array */
}

export declare class _NXEvent {
	constructor(init?: _NXEvent)
	type: number
	location: unnamed_4661731728819155438
	time: number
	flags: number
	window: number
	service_id: number
	ext_pid: number
	data: NXEventData
}

export declare class IODetailedTimingInformationV1 {
	constructor(init?: IODetailedTimingInformationV1)
	pixelClock: number
	horizontalActive: number
	horizontalBlanking: number
	horizontalBorder: number
	horizontalSyncOffset: number
	horizontalSyncWidth: number
	verticalActive: number
	verticalBlanking: number
	verticalBorder: number
	verticalSyncOffset: number
	verticalSyncWidth: number
}

export declare class IOFBHDRMetaDataV1 {
	constructor(init?: IOFBHDRMetaDataV1)
	displayPrimary_X0: number
	displayPrimary_Y0: number
	displayPrimary_X1: number
	displayPrimary_Y1: number
	displayPrimary_X2: number
	displayPrimary_Y2: number
	displayPrimary_X: number
	displayPrimary_Y: number
	desiredLuminance_Max: number
	desiredLuminance_Min: number
	desiredLightLevel_Avg: number
	desiredLightLevel_Max: number
	__reservedA: unknown /* const array */
}

export declare class IODisplayModeInformation {
	constructor(init?: IODisplayModeInformation)
	nominalWidth: number
	nominalHeight: number
	refreshRate: number
	maxDepthIndex: number
	flags: number
	imageWidth: number
	imageHeight: number
	reserved: unknown /* const array */
}

export declare class _evOffsets {
	constructor(init?: _evOffsets)
	evGlobalsOffset: number
	evShmemOffset: number
}

export declare class IOUSBDevReqOOLTO {
	constructor(init?: IOUSBDevReqOOLTO)
	bmRequestType: number
	bRequest: number
	wValue: number
	wIndex: number
	wLength: number
	pData: interop.Pointer
	wLenDone: number
	pipeRef: number
	noDataTimeout: number
	completionTimeout: number
}

export declare class _NXTabletPointData {
	constructor(init?: _NXTabletPointData)
	x: number
	y: number
	z: number
	buttons: number
	pressure: number
	tilt: unnamed_13681803734884863347
	rotation: number
	tangentialPressure: number
	deviceID: number
	vendor1: number
	vendor2: number
	vendor3: number
}

export declare class IOI2CBuffer {
	constructor(init?: IOI2CBuffer)
}

export declare class OSClassDescription {
	constructor(init?: OSClassDescription)
	descriptionSize: number
	name: unknown /* const array */
	superName: unknown /* const array */
	methodOptionsSize: number
	methodOptionsOffset: number
	metaMethodOptionsSize: number
	metaMethodOptionsOffset: number
	queueNamesSize: number
	queueNamesOffset: number
	methodNamesSize: number
	methodNamesOffset: number
	metaMethodNamesSize: number
	metaMethodNamesOffset: number
	flags: number
	resv1: unknown /* const array */
	methodOptions: unknown /* const array */
	metaMethodOptions: unknown /* const array */
	dispatchNames: unknown /* const array */
	methodNames: unknown /* const array */
	metaMethodNames: unknown /* const array */
}

export declare class IORPCMessageErrorReturn {
	constructor(init?: IORPCMessageErrorReturn)
	mach: IORPCMessageMach
	content: IORPCMessageErrorReturnContent
}

export declare class IOUSB20HubDescriptor {
	constructor(init?: IOUSB20HubDescriptor)
	bLength: number
	bDescriptorType: number
	bNumberPorts: number
	wHubCharacteristics: number
	bPowerOnToPowerGood: number
	bHubControllerCurrent: number
	deviceRemovable: unknown /* const array */
	reserved: unknown /* const array */
}

export declare class LowLatencyUserBufferInfoV3 {
	constructor(init?: LowLatencyUserBufferInfoV3)
	cookie: number
	bufferAddress: number
	bufferSize: number
	bufferType: number
	isPrepared: number
	mappedUHCIAddress: number
	nextBuffer: interop.Pointer
}

export declare class dk_bd_read_disc_info_t {
	constructor(init?: dk_bd_read_disc_info_t)
	reserved0000: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class VDGrayRecord {
	constructor(init?: VDGrayRecord)
	csMode: number
	filler: number
}

export declare class gpt_hdr {
	constructor(init?: gpt_hdr)
	hdr_sig: unknown /* const array */
	hdr_revision: number
	hdr_size: number
	hdr_crc_self: number
	__reserved: number
	hdr_lba_self: number
	hdr_lba_alt: number
	hdr_lba_start: number
	hdr_lba_end: number
	hdr_uuid: unknown /* const array */
	hdr_lba_table: number
	hdr_entries: number
	hdr_entsz: number
	hdr_crc_table: number
	padding: number
}

export declare class IOUSBInterfaceStruct800 {
	constructor(init?: IOUSBInterfaceStruct800)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV3: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetEndpointPropertiesV3: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SupportsStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	CreateStreams: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetConfiguredStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ReadStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: number,
	) => number | null
	WriteStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
	) => number | null
	ReadStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	WriteStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	AbortStreamsPipe: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	RegisterForNotification: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	UnregisterNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	AcknowledgeNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	RegisterDriver: (p1: interop.PointerConvertible) => number | null
	SetDeviceIdlePolicy: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipeIdlePolicy: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
}

export declare class unnamed_17124830411558016002 {
	constructor(init?: unnamed_17124830411558016002)
	reserved: number
	subType: number
	misc: unnamed_16176017495813799677
}

export declare class SCSI_Capacity_Data {
	constructor(init?: SCSI_Capacity_Data)
	RETURNED_LOGICAL_BLOCK_ADDRESS: number
	BLOCK_LENGTH_IN_BYTES: number
}

export declare class OSNotificationHeader64 {
	constructor(init?: OSNotificationHeader64)
	size: number
	type: number
	reference: unknown /* const array */
	content: interop.Pointer
}

export declare class IOBlitCopyRectanglesStruct {
	constructor(init?: IOBlitCopyRectanglesStruct)
	operation: IOBlitOperationStruct
	count: number
	rects: unknown /* const array */
}

export declare class IODot3RxExtraEntry {
	constructor(init?: IODot3RxExtraEntry)
	overruns: number
	watchdogTimeouts: number
	frameTooShorts: number
	collisionErrors: number
	phyErrors: number
	timeouts: number
	interrupts: number
	resets: number
	resourceErrors: number
	reserved: unknown /* const array */
}

export declare class __IOHIDQueue {
	constructor(init?: __IOHIDQueue)
}

export declare class IOAsyncCompletionContent {
	constructor(init?: IOAsyncCompletionContent)
	result: number
	args: interop.Pointer
}

export declare class IOServiceInterestContent64 {
	constructor(init?: IOServiceInterestContent64)
	messageType: number
	messageArgument: unknown /* const array */
}

export declare class IONamedValue {
	constructor(init?: IONamedValue)
	value: number
	name: string | null
}

export declare class IOHIDOutputTransactionInterface {
	constructor(init?: IOHIDOutputTransactionInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	createAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	getAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	createAsyncPort: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getAsyncPort: (p1: interop.PointerConvertible) => number | null
	create: (p1: interop.PointerConvertible) => number | null
	dispose: (p1: interop.PointerConvertible) => number | null
	addElement: (p1: interop.PointerConvertible, p2: number) => number | null
	removeElement: (p1: interop.PointerConvertible, p2: number) => number | null
	hasElement: (p1: interop.PointerConvertible, p2: number) => number | null
	setElementDefault: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	getElementDefault: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	setElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	getElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	commit: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	clear: (p1: interop.PointerConvertible) => number | null
}

export declare class IOPhysicalRange {
	constructor(init?: IOPhysicalRange)
	address: number
	length: number
}

export declare class IOUSBBOSDescriptor {
	constructor(init?: IOUSBBOSDescriptor)
	bLength: number
	bDescriptorType: number
	wTotalLength: number
	bNumDeviceCaps: number
}

export declare class VDPageInfo {
	constructor(init?: VDPageInfo)
	csMode: number
	csData: number
	csPage: number
	csBaseAddr: string | null
}

export declare class IOI2CBusTiming {
	constructor(init?: IOI2CBusTiming)
	bitTimeout: UnsignedWide
	byteTimeout: UnsignedWide
	acknowledgeTimeout: UnsignedWide
	startTimeout: UnsignedWide
	holdTime: UnsignedWide
	riseFallTime: UnsignedWide
	__reservedA: unknown /* const array */
}

export declare class VDCommunicationInfoRec {
	constructor(init?: VDCommunicationInfoRec)
	csBusID: number
	csBusType: number
	csMinBus: number
	csMaxBus: number
	csSupportedTypes: number
	csSupportedCommFlags: number
	csReserved2: number
	csReserved3: number
	csReserved4: number
	csReserved5: number
	csReserved6: number
	csReserved7: number
}

export declare class CDTOCDescriptor {
	constructor(init?: CDTOCDescriptor)
	session: number
	control: number
	adr: number
	tno: number
	point: number
	address: CDMSF
	zero: number
	p: CDMSF
}

export declare class evioSpecialKeyMsg {
	constructor(init?: evioSpecialKeyMsg)
	Head: mach_msg_header_t
	key: number
	direction: number
	flags: number
	level: number
}

export declare class IORPC {
	constructor(init?: IORPC)
	message: interop.Pointer
	reply: interop.Pointer
	sendSize: number
	replySize: number
}

export declare class IOUPSPlugInInterface_v140 {
	constructor(init?: IOUPSPlugInInterface_v140)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	getProperties: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getCapabilities: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getEvent: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	setEventCallback: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	sendCommand: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	createAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
}

export declare class SCSICmd_INQUIRY_StandardDataAll {
	constructor(init?: SCSICmd_INQUIRY_StandardDataAll)
	PERIPHERAL_DEVICE_TYPE: number
	RMB: number
	VERSION: number
	RESPONSE_DATA_FORMAT: number
	ADDITIONAL_LENGTH: number
	SCCSReserved: number
	flags1: number
	flags2: number
	VENDOR_IDENTIFICATION: unknown /* const array */
	PRODUCT_IDENTIFICATION: unknown /* const array */
	PRODUCT_REVISION_LEVEL: unknown /* const array */
	VendorSpecific1: unknown /* const array */
	flags3: number
	Reserved1: number
	VERSION_DESCRIPTOR: unknown /* const array */
	Reserved2: unknown /* const array */
	VendorSpecific2: unknown /* const array */
}

export declare class BDDiscInfo {
	constructor(init?: BDDiscInfo)
	dataLength: number
	discStatus: number
	stateOfLastSession: number
	erasable: number
	dataType: number
	reserved2: number
	numberOfSessionsLSB: number
	firstTrackNumberInLastSessionLSB: number
	lastTrackNumberInLastSessionLSB: number
	reserved4: unknown /* const array */
	numberOfSessionsMSB: number
	firstTrackNumberInLastSessionMSB: number
	lastTrackNumberInLastSessionMSB: number
	reserved6: unknown /* const array */
}

export declare class IOAccelBounds {
	constructor(init?: IOAccelBounds)
	x: number
	y: number
	w: number
	h: number
}

export declare class dk_dvd_report_key_t {
	constructor(init?: dk_dvd_report_key_t)
	format: number
	keyClass: number
	blockCount: number
	reserved0024: unknown /* const array */
	address: number
	grantID: number
	reserved0072: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class IOUSBDevReqOOL {
	constructor(init?: IOUSBDevReqOOL)
	bmRequestType: number
	bRequest: number
	wValue: number
	wIndex: number
	wLength: number
	pData: interop.Pointer
	wLenDone: number
	pipeRef: number
}

export declare class SCSICmd_INQUIRY_PageB0_Data {
	constructor(init?: SCSICmd_INQUIRY_PageB0_Data)
	PERIPHERAL_DEVICE_TYPE: number
	PAGE_CODE: number
	PAGE_LENGTH: number
	WSNZ: number
	MAXIMUM_COMPARE_AND_WRITE_LENGTH: number
	OPTIMAL_TRANSFER_LENGTH_GRANULARITY: number
	MAXIMUM_TRANSFER_LENGTH: number
	OPTIMAL_TRANSFER_LENGTH: number
	MAXIMUM_PREFETCH_LENGTH: number
	MAXIMUM_UNMAP_LBA_COUNT: number
	MAXIMUM_UNMAP_BLOCK_DESCRIPTOR_COUNT: number
	OPTIMAL_UNMAP_GRANULARITY: number
	UNMAP_GRANULARITY_ALIGNMENT: number
	MAXIMUM_WRITE_SAME_LENGTH: number
	MAXIMUM_ATOMIC_TRANSFER_LENGTH: number
	ATOMIC_ALIGNMENT: number
	ATOMIC_TRANSFER_LENGTH_GRANULARITY: number
	MAXIMUM_ATOMIC_TRANSFER_LENGTH_WITH_ATOMIC_BOUNDARY: number
	MAXIMUM_ATOMIC_BOUNDARY_SIZE: number
}

export declare class IOVideoDeviceNotificationMessage {
	constructor(init?: IOVideoDeviceNotificationMessage)
	mMessageHeader: mach_msg_header_t
	mClientData: number
	mNumberNotifications: number
	mNotifications: unknown /* const array */
}

export declare class IOUSBDeviceStruct500 {
	constructor(init?: IOUSBDeviceStruct500)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetUSBDeviceInformation: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	RequestExtraPower: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	ReturnExtraPower: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetExtraPowerAllocated: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetBandwidthAvailableForDevice: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBInterfaceDescriptor {
	constructor(init?: IOUSBInterfaceDescriptor)
	bLength: number
	bDescriptorType: number
	bInterfaceNumber: number
	bAlternateSetting: number
	bNumEndpoints: number
	bInterfaceClass: number
	bInterfaceSubClass: number
	bInterfaceProtocol: number
	iInterface: number
}

export declare class VDCommunicationRec {
	constructor(init?: VDCommunicationRec)
	csBusID: number
	csCommFlags: number
	csMinReplyDelay: number
	csReserved2: number
	csSendAddress: number
	csSendType: number
	csSendBuffer: interop.Pointer
	csSendSize: number
	csReplyAddress: number
	csReplyType: number
	csReplyBuffer: interop.Pointer
	csReplySize: number
	csReserved3: number
	csReserved4: number
	csReserved5: number
	csReserved6: number
}

export declare class IOUSBInterfaceStruct700 {
	constructor(init?: IOUSBInterfaceStruct700)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
	) => number | null
	GetPipePropertiesV3: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetEndpointPropertiesV3: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SupportsStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	CreateStreams: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetConfiguredStreams: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ReadStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: number,
	) => number | null
	WriteStreamsPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
	) => number | null
	ReadStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	WriteStreamsPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: number,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	AbortStreamsPipe: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	RegisterForNotification: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	UnregisterNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	AcknowledgeNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	RegisterDriver: (p1: interop.PointerConvertible) => number | null
}

export declare class dk_cd_read_isrc_t {
	constructor(init?: dk_cd_read_isrc_t)
	isrc: unknown /* const array */
	track: number
	reserved0112: unknown /* const array */
}

export declare class IOUSBInterfaceStruct183 {
	constructor(init?: IOUSBInterfaceStruct183)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
}

export declare class IOUSBInterfaceStruct220 {
	constructor(init?: IOUSBInterfaceStruct220)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
}

export declare class _IOAudioTimeStamp {
	constructor(init?: _IOAudioTimeStamp)
	fSampleTime: number
	fHostTime: number
	fRateScalar: number
	fWordClockTime: number
	fSMPTETime: _IOAudioSMPTETime
	fFlags: number
	fReserved: number
}

export declare class IOUSBDeviceStruct650 {
	constructor(init?: IOUSBDeviceStruct650)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetBusFrameNumberWithTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetUSBDeviceInformation: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	RequestExtraPower: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	ReturnExtraPower: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	GetExtraPowerAllocated: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetBandwidthAvailableForDevice: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfigurationV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: boolean,
		p4: boolean,
	) => number | null
	RegisterForNotification: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	UnregisterNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	AcknowledgeNotification: (p1: interop.PointerConvertible, p2: number) => number | null
}

export declare class dk_cd_read_disc_info_t {
	constructor(init?: dk_cd_read_disc_info_t)
	reserved0000: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class IOPMSystemCapabilityChangeParameters {
	constructor(init?: IOPMSystemCapabilityChangeParameters)
	notifyRef: number
	maxWaitForReply: number
	changeFlags: number
	__reserved1: number
	fromCapabilities: number
	toCapabilities: number
	__reserved2: unknown /* const array */
}

export declare class SCSICmd_REPORT_LUNS_Header {
	constructor(init?: SCSICmd_REPORT_LUNS_Header)
	LUN_LIST_LENGTH: number
	RESERVED: number
	LUN: unknown /* const array */
}

export declare class _IOAudioEngineStatus {
	constructor(init?: _IOAudioEngineStatus)
	fVersion: number
	fCurrentLoopCount: number
	fLastLoopTime: UnsignedWide
	fEraseHeadSampleFrame: number
}

export declare class DCLCallProcStruct {
	constructor(init?: DCLCallProcStruct)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	proc: (p1: interop.PointerConvertible) => void | null
	procData: interop.Pointer
}

export declare class IOVirtualRange {
	constructor(init?: IOVirtualRange)
	address: number
	length: number
}

export declare class IOHIDDeviceTimeStampedDeviceInterface {
	constructor(init?: IOHIDDeviceTimeStampedDeviceInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	open: (p1: interop.PointerConvertible, p2: number) => number | null
	close: (p1: interop.PointerConvertible, p2: number) => number | null
	getProperty: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	setProperty: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	getAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	copyMatchingElements: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	setValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p6: interop.PointerConvertible,
		p7: number,
	) => number | null
	getValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p6: interop.PointerConvertible,
		p7: number,
	) => number | null
	setInputReportCallback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.Enum<typeof IOHIDReportType>,
			p5: number,
			p6: interop.PointerConvertible,
			p7: number,
		) => void,
		p5: interop.PointerConvertible,
		p6: number,
	) => number | null
	setReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.Enum<typeof IOHIDReportType>,
			p5: number,
			p6: interop.PointerConvertible,
			p7: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: number,
	) => number | null
	getReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.Enum<typeof IOHIDReportType>,
			p5: number,
			p6: interop.PointerConvertible,
			p7: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: number,
	) => number | null
	setInputReportWithTimeStampCallback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.Enum<typeof IOHIDReportType>,
			p5: number,
			p6: interop.PointerConvertible,
			p7: number,
			p8: number,
		) => void,
		p5: interop.PointerConvertible,
		p6: number,
	) => number | null
}

export declare class VDMultiConnectInfoRec {
	constructor(init?: VDMultiConnectInfoRec)
	csDisplayCountOrNumber: number
	csConnectInfo: VDDisplayConnectInfoRec
}

export declare class evioLLEvent {
	constructor(init?: evioLLEvent)
	setCursor: number
	type: number
	location: IOGPoint
	data: NXEventData
	setFlags: number
	flags: number
}

export declare class IOATASMARTInterface {
	constructor(init?: IOATASMARTInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	version: number
	revision: number
	SMARTEnableDisableOperations: (p1: interop.PointerConvertible, p2: number) => number | null
	SMARTEnableDisableAutosave: (p1: interop.PointerConvertible, p2: number) => number | null
	SMARTReturnStatus: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SMARTExecuteOffLineImmediate: (p1: interop.PointerConvertible, p2: number) => number | null
	SMARTReadData: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SMARTValidateReadData: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SMARTReadDataThresholds: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SMARTReadLogDirectory: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SMARTReadLogAtAddress: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	SMARTWriteLogAtAddress: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	GetATAIdentifyData: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
}

export declare class UserExportDCLJumpStruct {
	constructor(init?: UserExportDCLJumpStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	pJumpDCLLabel: number
}

export declare class IOGPoint {
	constructor(init?: IOGPoint)
	x: number
	y: number
}

export declare class dk_bd_read_track_info_t {
	constructor(init?: dk_bd_read_track_info_t)
	reserved0000: unknown /* const array */
	address: number
	addressType: number
	reserved0072: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class VDSupportsHardwareCursorRec {
	constructor(init?: VDSupportsHardwareCursorRec)
	csSupportsHardwareCursor: number
	csReserved1: number
	csReserved2: number
}

export declare class DVDDiscKeyInfo {
	constructor(init?: DVDDiscKeyInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	discKeyStructures: unknown /* const array */
}

export declare class VDHardwareCursorDrawStateRec {
	constructor(init?: VDHardwareCursorDrawStateRec)
	csCursorX: number
	csCursorY: number
	csCursorVisible: number
	csCursorSet: number
	csReserved1: number
	csReserved2: number
}

export declare class IOStreamInterface_v1_t {
	constructor(init?: IOStreamInterface_v1_t)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	Version: number
	Revision: number
	Open: (p1: interop.PointerConvertible, p2: number) => number | null
	Close: (p1: interop.PointerConvertible) => number | null
	GetBufferCount: (p1: interop.PointerConvertible) => number | null
	GetBufferInfo: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	GetOutputPort: (p1: interop.PointerConvertible) => interop.Pointer | null
	GetInputPort: (p1: interop.PointerConvertible) => interop.Pointer | null
	GetOutputQueue: (p1: interop.PointerConvertible) => interop.Pointer | null
	GetInputQueue: (p1: interop.PointerConvertible) => interop.Pointer | null
	SetOutputCallback: (
		p1: interop.PointerConvertible,
		p2: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
		p3: interop.PointerConvertible,
	) => number | null
	GetRunLoopSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	AddToRunLoop: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	RemoveFromRunLoop: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	DequeueOutputEntry: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	EnqueueInputEntry: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	EnqueueInputBuffer: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	SendInputNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	SendInputSyncNotification: (p1: interop.PointerConvertible, p2: number) => number | null
	GetDataBuffer: (p1: interop.PointerConvertible, p2: number) => interop.Pointer | null
	GetDataBufferLength: (p1: interop.PointerConvertible, p2: number) => number | null
	GetControlBuffer: (p1: interop.PointerConvertible, p2: number) => interop.Pointer | null
	GetControlBufferLength: (p1: interop.PointerConvertible, p2: number) => number | null
	StartStream: (p1: interop.PointerConvertible) => number | null
	StopStream: (p1: interop.PointerConvertible) => number | null
	SuspendStream: (p1: interop.PointerConvertible) => number | null
	GetMode: (p1: interop.PointerConvertible) => interop.Enum<typeof IOStreamMode> | null
	SetMode: (p1: interop.PointerConvertible, p2: interop.Enum<typeof IOStreamMode>) => number | null
}

export declare class VDScalerRec {
	constructor(init?: VDScalerRec)
	csScalerSize: number
	csScalerVersion: number
	csReserved1: number
	csReserved2: number
	csDisplayModeID: number
	csDisplayModeSeed: number
	csDisplayModeState: number
	csReserved3: number
	csScalerFlags: number
	csHorizontalPixels: number
	csVerticalPixels: number
	csHorizontalInset: number
	csVerticalInset: number
	csReserved6: number
	csReserved7: number
	csReserved8: number
}

export declare class CDAudioStatus {
	constructor(init?: CDAudioStatus)
	status: number
	position: unnamed_313033799851782764
}

export declare class IOI2CRequest {
	constructor(init?: IOI2CRequest)
	sendTransactionType: number
	replyTransactionType: number
	sendAddress: number
	replyAddress: number
	sendSubAddress: number
	replySubAddress: number
	__reservedA: unknown /* const array */
	minReplyDelay: number
	result: number
	commFlags: number
	__padA: number
	sendBytes: number
	__reservedB: unknown /* const array */
	__padB: number
	replyBytes: number
	completion: (p1: interop.PointerConvertible) => void | null
	sendBuffer: number
	replyBuffer: number
	__reservedC: unknown /* const array */
}

export declare class VPBlock {
	constructor(init?: VPBlock)
	vpBaseOffset: number
	vpRowBytes: number
	vpBounds: Rect
	vpVersion: number
	vpPackType: number
	vpPackSize: number
	vpHRes: number
	vpVRes: number
	vpPixelType: number
	vpPixelSize: number
	vpCmpCount: number
	vpCmpSize: number
	vpPlaneBytes: number
}

export declare class __IOHIDDevice {
	constructor(init?: __IOHIDDevice)
}

export declare class unnamed_313033799851782764 {
	constructor(init?: unnamed_313033799851782764)
	time: CDMSF
	track: unnamed_11043553746395291637
}

export declare class dk_dvd_read_rzone_info_t {
	constructor(init?: dk_dvd_read_rzone_info_t)
	reserved0000: unknown /* const array */
	address: number
	addressType: number
	reserved0072: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class SBCModePageCaching {
	constructor(init?: SBCModePageCaching)
	header: ModePageFormatHeader
	flags: number
	DEMAND_READ_WRITE_RETENTION_PRIORITY: number
	DISABLE_PREFETCH_TRANSFER_LENGTH: number
	MINIMUM_PREFETCH: number
	MAXIMUM_PREFETCH: number
	MAXIMUM_PREFETCH_CEILING: number
	flags2: number
	NUMBER_OF_CACHE_SEGMENTS: number
	CACHE_SEGMENT_SIZE: number
	RESERVED: number
	NON_CACHE_SEGMENT_SIZE: unknown /* const array */
}

export declare class VDGetGammaListRec {
	constructor(init?: VDGetGammaListRec)
	csPreviousGammaTableID: number
	csGammaTableID: number
	csGammaTableSize: number
	csGammaTableName: string | null
}

export declare class IONotificationPort {
	constructor(init?: IONotificationPort)
}

export declare class MMCDeviceInterface {
	constructor(init?: MMCDeviceInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	version: number
	revision: number
	Inquiry: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	TestUnitReady: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetPerformance: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: number,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	ModeSense10: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	SetWriteParametersModePage: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	GetTrayState: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetTrayState: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadTableOfContents: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	ReadDiscInformation: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	ReadTrackInformation: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	ReadDVDStructure: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	GetSCSITaskDeviceInterface: (p1: interop.PointerConvertible) => interop.Pointer | null
	GetPerformanceV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	SetCDSpeed: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	ReadFormatCapacities: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	ReadDiscStructure: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	ReadDiscInformationV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	ReadTrackInformationV2: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	SetStreaming: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
}

export declare class IORPCMessageErrorReturnContent {
	constructor(init?: IORPCMessageErrorReturnContent)
	hdr: IORPCMessage
	result: number
	pad: number
}

export declare class IOUSBInterfaceStruct197 {
	constructor(init?: IOUSBInterfaceStruct197)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class _NXSize {
	constructor(init?: _NXSize)
	width: number
	height: number
}

export declare class IOUSBDeviceStruct100 {
	constructor(init?: IOUSBDeviceStruct100)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class disk_blk0 {
	constructor(init?: disk_blk0)
	bootcode: unknown /* const array */
	parts: unknown /* const array */
	signature: number
}

export declare class IOBlitVerticesStruct {
	constructor(init?: IOBlitVerticesStruct)
	operation: IOBlitOperationStruct
	count: number
	vertices: unknown /* const array */
}

export declare class IOUSBDFUDescriptor {
	constructor(init?: IOUSBDFUDescriptor)
	bLength: number
	bDescriptorType: number
	bmAttributes: number
	wDetachTimeout: number
	wTransferSize: number
}

export declare class VDFlagRecord {
	constructor(init?: VDFlagRecord)
	csMode: number
	filler: number
}

export declare class _IOAudioSMPTETime {
	constructor(init?: _IOAudioSMPTETime)
	fSubframes: number
	fSubframeDivisor: number
	fCounter: number
	fType: number
	fFlags: number
	fHours: number
	fMinutes: number
	fSeconds: number
	fFrames: number
}

export declare class REPORT_LUNS_PERIPHERAL_DEVICE_ADDRESSING {
	constructor(init?: REPORT_LUNS_PERIPHERAL_DEVICE_ADDRESSING)
	TARGET_LUN: number
	BUS_IDENTIFIER: number
	reserved2: number
	reserved: number
}

export declare class IOHIDDeviceTransactionInterface {
	constructor(init?: IOHIDDeviceTransactionInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	getAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	setDirection: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDTransactionDirectionType>,
		p3: number,
	) => number | null
	getDirection: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	addElement: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	removeElement: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	containsElement: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	setValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	getValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	commit: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
		p5: number,
	) => number | null
	clear: (p1: interop.PointerConvertible, p2: number) => number | null
}

export declare class SCSICmd_INQUIRY_PageC1_Data {
	constructor(init?: SCSICmd_INQUIRY_PageC1_Data)
	fHeader: SCSICmd_INQUIRY_PageCx_Header
	fTdmPowerRequirementsPageVersion: number
	fReserved1: number
	fReserved2: number
	fPowerRequired: number
}

export declare class OSNotificationHeader {
	constructor(init?: OSNotificationHeader)
	size: number
	type: number
	reference: unknown /* const array */
	content: interop.Pointer
}

export declare class IOUSBInterfaceStruct245 {
	constructor(init?: IOUSBInterfaceStruct245)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBInterfaceOpenSeize: (p1: interop.PointerConvertible) => number | null
	ClearPipeStallBothEnds: (p1: interop.PointerConvertible, p2: number) => number | null
	SetPipePolicy: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
	) => number | null
	GetBandwidthAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetEndpointProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	LowLatencyReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyWriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p9: interop.PointerConvertible,
	) => number | null
	LowLatencyCreateBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	LowLatencyDestroyBuffer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetFrameListTime: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	FindNextAssociatedDescriptor: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => interop.Pointer | null
	FindNextAltInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
}

export declare class VDPowerStateRec {
	constructor(init?: VDPowerStateRec)
	powerState: number
	powerFlags: number
	powerReserved1: number
	powerReserved2: number
}

export declare class IOVideoDeviceNotification {
	constructor(init?: IOVideoDeviceNotification)
	mObjectID: number
	mNotificationID: number
	mNotificationArgument1: number
	mNotificationArgument2: number
	mNotificationArgument3: number
	mNotificationArgument4: number
}

export declare class IOVideoDeviceInterface_v1_t {
	constructor(init?: IOVideoDeviceInterface_v1_t)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	Version: number
	Revision: number
	Open: (p1: interop.PointerConvertible, p2: number) => number | null
	Close: (p1: interop.PointerConvertible) => number | null
	GetNotificationPort: (p1: interop.PointerConvertible) => interop.Pointer | null
	SetNotificationCallback: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.PointerConvertible,
			p2: interop.PointerConvertible,
			p3: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
	) => number | null
	SetControlValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	SetStreamFormat: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetRunLoopSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	AddToRunLoop: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	RemoveFromRunLoop: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	CreateStreamInterface: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: boolean,
		p5: interop.PointerConvertible,
	) => number | null
	ReleaseStreamInterface: (
		p1: interop.PointerConvertible,
		p2: boolean,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class SCSITaskDeviceInterface {
	constructor(init?: SCSITaskDeviceInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	version: number
	revision: number
	IsExclusiveAccessAvailable: (p1: interop.PointerConvertible) => number | null
	AddCallbackDispatcherToRunLoop: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	RemoveCallbackDispatcherFromRunLoop: (p1: interop.PointerConvertible) => void | null
	ObtainExclusiveAccess: (p1: interop.PointerConvertible) => number | null
	ReleaseExclusiveAccess: (p1: interop.PointerConvertible) => number | null
	CreateSCSITask: (p1: interop.PointerConvertible) => interop.Pointer | null
}

export declare class IOGSize {
	constructor(init?: IOGSize)
	width: number
	height: number
}

export declare class IOUSBSuperSpeedEndpointCompanionDescriptor {
	constructor(init?: IOUSBSuperSpeedEndpointCompanionDescriptor)
	bLength: number
	bDescriptorType: number
	bMaxBurst: number
	bmAttributes: number
	wBytesPerInterval: number
}

export declare class IOI2CConnect {
	constructor(init?: IOI2CConnect)
}

export declare class __IOHIDTransaction {
	constructor(init?: __IOHIDTransaction)
}

export declare class IOBlitRectanglesStruct {
	constructor(init?: IOBlitRectanglesStruct)
	operation: IOBlitOperationStruct
	count: number
	rects: unknown /* const array */
}

export declare class IOTimingInformation {
	constructor(init?: IOTimingInformation)
	appleTimingID: number
	flags: number
	detailedInfo: unnamed_13126335752215089091
}

export declare class DVDTitleKeyInfo {
	constructor(init?: DVDTitleKeyInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	CP_MOD: number
	CGMS: number
	CP_SEC: number
	CPM: number
	titleKeyValue: unknown /* const array */
	reserved2: unknown /* const array */
}

export declare class gpt_ent {
	constructor(init?: gpt_ent)
	ent_type: unknown /* const array */
	ent_uuid: unknown /* const array */
	ent_lba_start: number
	ent_lba_end: number
	ent_attr: number
	ent_name: unknown /* const array */
}

export declare class IOUSBDeviceCapabilityBillboardAltMode {
	constructor(init?: IOUSBDeviceCapabilityBillboardAltMode)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
	bIndex: number
	dwAlternateModeVdo: number
}

export declare class IOUSBInterfaceAssociationDescriptor {
	constructor(init?: IOUSBInterfaceAssociationDescriptor)
	bLength: number
	bDescriptorType: number
	bFirstInterface: number
	bInterfaceCount: number
	bFunctionClass: number
	bFunctionSubClass: number
	bFunctionProtocol: number
	iFunction: number
}

export declare class SCSICmd_INQUIRY_Page83_Identification_Descriptor {
	constructor(init?: SCSICmd_INQUIRY_Page83_Identification_Descriptor)
	CODE_SET: number
	IDENTIFIER_TYPE: number
	RESERVED: number
	IDENTIFIER_LENGTH: number
	IDENTIFIER: number
}

export declare class IOServiceInterestContent {
	constructor(init?: IOServiceInterestContent)
	messageType: number
	messageArgument: unknown /* const array */
}

export declare class DCLNuDCLLeader {
	constructor(init?: DCLNuDCLLeader)
	pNextDCLCommand: interop.Pointer
	compilerData: number
	opcode: number
	program: interop.Pointer
}

export declare class _IOAudioStreamFormatExtension {
	constructor(init?: _IOAudioStreamFormatExtension)
	fVersion: number
	fFlags: number
	fFramesPerPacket: number
	fBytesPerPacket: number
}

export declare class CDPMADescriptor {
	constructor(init?: CDPMADescriptor)
	reserved: number
	control: number
	adr: number
	tno: number
	point: number
	address: CDMSF
	zero: number
	p: CDMSF
}

export declare class SCSI_Sense_Data {
	constructor(init?: SCSI_Sense_Data)
	VALID_RESPONSE_CODE: number
	SEGMENT_NUMBER: number
	SENSE_KEY: number
	INFORMATION_1: number
	INFORMATION_2: number
	INFORMATION_3: number
	INFORMATION_4: number
	ADDITIONAL_SENSE_LENGTH: number
	COMMAND_SPECIFIC_INFORMATION_1: number
	COMMAND_SPECIFIC_INFORMATION_2: number
	COMMAND_SPECIFIC_INFORMATION_3: number
	COMMAND_SPECIFIC_INFORMATION_4: number
	ADDITIONAL_SENSE_CODE: number
	ADDITIONAL_SENSE_CODE_QUALIFIER: number
	FIELD_REPLACEABLE_UNIT_CODE: number
	SKSV_SENSE_KEY_SPECIFIC_MSB: number
	SENSE_KEY_SPECIFIC_MID: number
	SENSE_KEY_SPECIFIC_LSB: number
}

export declare class __IOHIDUserDevice {
	constructor(init?: __IOHIDUserDevice)
}

export declare class IOUSBDeviceCapabilityContainerID {
	constructor(init?: IOUSBDeviceCapabilityContainerID)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
	bReservedID: number
	containerID: unknown /* const array */
}

export declare class unnamed_15320079305736581321 {
	constructor(init?: unnamed_15320079305736581321)
	csGTable: string | null
}

export declare class unnamed_3719132138026818458 {
	constructor(init?: unnamed_3719132138026818458)
	x: number
	y: number
}

export declare class IOUSBDeviceStruct245 {
	constructor(init?: IOUSBDeviceStruct245)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateDeviceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateDeviceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBDeviceOpen: (p1: interop.PointerConvertible) => number | null
	USBDeviceClose: (p1: interop.PointerConvertible) => number | null
	GetDeviceClass: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceAddress: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceBusPowerAvailable: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceSpeed: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetNumberOfConfigurations: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetConfigurationDescriptorPtr: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetConfiguration: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SetConfiguration: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ResetDevice: (p1: interop.PointerConvertible) => number | null
	DeviceRequest: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsync: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	CreateInterfaceIterator: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	USBDeviceOpenSeize: (p1: interop.PointerConvertible) => number | null
	DeviceRequestTO: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	DeviceRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p4: interop.PointerConvertible,
	) => number | null
	USBDeviceSuspend: (p1: interop.PointerConvertible, p2: number) => number | null
	USBDeviceAbortPipeZero: (p1: interop.PointerConvertible) => number | null
	USBGetManufacturerStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetProductStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBGetSerialNumberStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	USBDeviceReEnumerate: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusMicroFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetIOUSBLibVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class IOAccelSurfaceScaling {
	constructor(init?: IOAccelSurfaceScaling)
	buffer: IOAccelBounds
	source: IOAccelSize
	reserved: unknown /* const array */
}

export declare class UserExportDCLUpdateDCLListStruct {
	constructor(init?: UserExportDCLUpdateDCLListStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	dclCommandList: number
	numDCLCommands: number
}

export declare class IOUSBIsocStruct {
	constructor(init?: IOUSBIsocStruct)
	fPipe: number
	fBuffer: interop.Pointer
	fBufSize: number
	fStartFrame: number
	fNumFrames: number
	fFrameCounts: interop.Pointer
}

export declare class IOUSBDevRequestTO {
	constructor(init?: IOUSBDevRequestTO)
	bmRequestType: number
	bRequest: number
	wValue: number
	wIndex: number
	wLength: number
	pData: interop.Pointer
	wLenDone: number
	noDataTimeout: number
	completionTimeout: number
}

export declare class __IOHIDEventSystemClient {
	constructor(init?: __IOHIDEventSystemClient)
}

export declare class bm12Cursor {
	constructor(init?: bm12Cursor)
	image: unknown /* const array */
	mask: unknown /* const array */
	save: unknown /* const array */
}

export declare class IOUSBMatch {
	constructor(init?: IOUSBMatch)
	usbClass: number
	usbSubClass: number
	usbProtocol: number
	usbVendor: number
	usbProduct: number
}

export declare class IOHIDDeviceInterface121 {
	constructor(init?: IOHIDDeviceInterface121)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	createAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	getAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	createAsyncPort: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	getAsyncPort: (p1: interop.PointerConvertible) => number | null
	open: (p1: interop.PointerConvertible, p2: number) => number | null
	close: (p1: interop.PointerConvertible) => number | null
	setRemovalCallback: (
		p1: interop.PointerConvertible,
		p2: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
		) => void,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	getElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	setElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	queryElementValue: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	startAllQueues: (p1: interop.PointerConvertible) => number | null
	stopAllQueues: (p1: interop.PointerConvertible) => number | null
	allocQueue: (p1: interop.PointerConvertible) => interop.Pointer | null
	allocOutputTransaction: (p1: interop.PointerConvertible) => interop.Pointer | null
	setReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	getReport: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof IOHIDReportType>,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: interop.PointerConvertible,
			p4: interop.PointerConvertible,
			p5: number,
		) => void,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
}

export declare class NXEventSystemDevice {
	constructor(init?: NXEventSystemDevice)
	interface: number
	interface_addr: number
	dev_type: number
	id: number
}

export declare class dk_dvd_send_key_t {
	constructor(init?: dk_dvd_send_key_t)
	format: number
	keyClass: number
	reserved0016: unknown /* const array */
	grantID: number
	reserved0072: unknown /* const array */
	bufferLength: number
	buffer: interop.Pointer
}

export declare class IOUSBFindInterfaceRequest {
	constructor(init?: IOUSBFindInterfaceRequest)
	bInterfaceClass: number
	bInterfaceSubClass: number
	bInterfaceProtocol: number
	bAlternateSetting: number
}

export declare class _NXEventExt {
	constructor(init?: _NXEventExt)
	payload: _NXEvent
	extension: _NXEventExtension
}

export declare class DVDAuthenticationSuccessFlagInfo {
	constructor(init?: DVDAuthenticationSuccessFlagInfo)
	dataLength: unknown /* const array */
	reserved: unknown /* const array */
	reserved2: unknown /* const array */
	successFlag: number
	reservedBits: number
}

export declare class VDPrivateSelectorRec {
	constructor(init?: VDPrivateSelectorRec)
	reserved: number
	data: unknown /* const array */
}

export declare class IOColorEntry {
	constructor(init?: IOColorEntry)
	index: number
	red: number
	green: number
	blue: number
}

export declare class IOAccelSize {
	constructor(init?: IOAccelSize)
	w: number
	h: number
}

export declare class UserExportDCLCallProcStruct {
	constructor(init?: UserExportDCLCallProcStruct)
	pClientDCLStruct: number
	pNextDCLCommand: number
	compilerData: number
	opcode: number
	proc: number
	procData: number
}

export declare class VDMirrorRec {
	constructor(init?: VDMirrorRec)
	csMirrorSize: number
	csMirrorVersion: number
	csMirrorRequestID: number
	csMirrorResultID: number
	csMirrorFeatures: number
	csMirrorSupportedFlags: number
	csMirrorFlags: number
	csReserved1: number
	csReserved2: number
	csReserved3: number
	csReserved4: number
	csReserved5: number
}

export declare class IOHIDCompletion {
	constructor(init?: IOHIDCompletion)
	target: interop.Pointer
	action: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void | null
	parameter: interop.Pointer
}

export declare class IOUSBInterfaceStruct182 {
	constructor(init?: IOUSBInterfaceStruct182)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	CreateInterfaceAsyncEventSource: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncEventSource: (p1: interop.PointerConvertible) => interop.Pointer | null
	CreateInterfaceAsyncPort: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceAsyncPort: (p1: interop.PointerConvertible) => number | null
	USBInterfaceOpen: (p1: interop.PointerConvertible) => number | null
	USBInterfaceClose: (p1: interop.PointerConvertible) => number | null
	GetInterfaceClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceSubClass: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceProtocol: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceVendor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDeviceProduct: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetDeviceReleaseNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetConfigurationValue: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetInterfaceNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetAlternateSetting: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetNumEndpoints: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetLocationID: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetDevice: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	SetAlternateInterface: (p1: interop.PointerConvertible, p2: number) => number | null
	GetBusFrameNumber: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequest: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	GetPipeProperties: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	GetPipeStatus: (p1: interop.PointerConvertible, p2: number) => number | null
	AbortPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ResetPipe: (p1: interop.PointerConvertible, p2: number) => number | null
	ClearPipeStall: (p1: interop.PointerConvertible, p2: number) => number | null
	ReadPipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	WritePipe: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	ReadPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	WritePipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p6: interop.PointerConvertible,
	) => number | null
	ReadIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WriteIsochPipeAsync: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	ControlRequestTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	ControlRequestAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p5: interop.PointerConvertible,
	) => number | null
	ReadPipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
	) => number | null
	WritePipeTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => number | null
	ReadPipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	WritePipeAsyncTO: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
		p7: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
		p8: interop.PointerConvertible,
	) => number | null
	USBInterfaceGetStringIndex: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
}

export declare class IOUSBPlatformCapabilityDescriptor {
	constructor(init?: IOUSBPlatformCapabilityDescriptor)
	bLength: number
	bDescriptorType: number
	bDevCapabilityType: number
	bReserved: number
	PlatformCapabilityUUID: unknown /* const array */
}

export declare class VDTimingInfoRec {
	constructor(init?: VDTimingInfoRec)
	csTimingMode: number
	csTimingReserved: number
	csTimingFormat: number
	csTimingData: number
	csTimingFlags: number
}

export declare class _IODataQueueEntry {
	constructor(init?: _IODataQueueEntry)
	size: number
	data: unknown /* const array */
}

export declare class CDTrackInfo {
	constructor(init?: CDTrackInfo)
	dataLength: number
	trackNumberLSB: number
	sessionNumberLSB: number
	reserved: number
	trackMode: number
	copy: number
	damage: number
	reserved3: number
	dataMode: number
	fixedPacket: number
	packet: number
	blank: number
	reservedTrack: number
	nextWritableAddressValid: number
	lastRecordedAddressValid: number
	reserved5: number
	trackStartAddress: number
	nextWritableAddress: number
	freeBlocks: number
	fixedPacketSize: number
	trackSize: number
	lastRecordedAddress: number
	trackNumberMSB: number
	sessionNumberMSB: number
	reserved6: number
	reserved7: number
}

export declare class __IOHIDServiceClient {
	constructor(init?: __IOHIDServiceClient)
}

export declare class CDTOC {
	constructor(init?: CDTOC)
	length: number
	sessionFirst: number
	sessionLast: number
	descriptors: unknown /* const array */
}

export declare class IOAccelSurfaceInformation {
	constructor(init?: IOAccelSurfaceInformation)
	address: unknown /* const array */
	rowBytes: number
	width: number
	height: number
	pixelFormat: number
	flags: number
	colorTemperature: unknown /* const array */
	typeDependent: unknown /* const array */
}

export declare class IODisplayTimingRangeV2 {
	constructor(init?: IODisplayTimingRangeV2)
	__reservedA: unknown /* const array */
	version: number
	__reservedB: unknown /* const array */
	minPixelClock: number
	maxPixelClock: number
	maxPixelError: number
	supportedSyncFlags: number
	supportedSignalLevels: number
	supportedSignalConfigs: number
	minFrameRate: number
	maxFrameRate: number
	minLineRate: number
	maxLineRate: number
	maxHorizontalTotal: number
	maxVerticalTotal: number
	__reservedD: unknown /* const array */
	charSizeHorizontalActive: number
	charSizeHorizontalBlanking: number
	charSizeHorizontalSyncOffset: number
	charSizeHorizontalSyncPulse: number
	charSizeVerticalActive: number
	charSizeVerticalBlanking: number
	charSizeVerticalSyncOffset: number
	charSizeVerticalSyncPulse: number
	charSizeHorizontalBorderLeft: number
	charSizeHorizontalBorderRight: number
	charSizeVerticalBorderTop: number
	charSizeVerticalBorderBottom: number
	charSizeHorizontalTotal: number
	charSizeVerticalTotal: number
	__reservedE: number
	minHorizontalActiveClocks: number
	maxHorizontalActiveClocks: number
	minHorizontalBlankingClocks: number
	maxHorizontalBlankingClocks: number
	minHorizontalSyncOffsetClocks: number
	maxHorizontalSyncOffsetClocks: number
	minHorizontalPulseWidthClocks: number
	maxHorizontalPulseWidthClocks: number
	minVerticalActiveClocks: number
	maxVerticalActiveClocks: number
	minVerticalBlankingClocks: number
	maxVerticalBlankingClocks: number
	minVerticalSyncOffsetClocks: number
	maxVerticalSyncOffsetClocks: number
	minVerticalPulseWidthClocks: number
	maxVerticalPulseWidthClocks: number
	minHorizontalBorderLeft: number
	maxHorizontalBorderLeft: number
	minHorizontalBorderRight: number
	maxHorizontalBorderRight: number
	minVerticalBorderTop: number
	maxVerticalBorderTop: number
	minVerticalBorderBottom: number
	maxVerticalBorderBottom: number
	maxNumLinks: number
	minLink0PixelClock: number
	maxLink0PixelClock: number
	minLink1PixelClock: number
	maxLink1PixelClock: number
	supportedPixelEncoding: number
	supportedBitsPerColorComponent: number
	supportedColorimetryModes: number
	supportedDynamicRangeModes: number
	__reservedF: unknown /* const array */
	maxBandwidth: number
	dscMinSliceHeight: number
	dscMaxSliceHeight: number
	dscMinSliceWidth: number
	dscMaxSliceWidth: number
	dscMinSlicePerLine: number
	dscMaxSlicePerLine: number
	dscMinBPC: number
	dscMaxBPC: number
	dscMinBPP: number
	dscMaxBPP: number
	dscVBR: number
	dscBlockPredEnable: number
	__reservedC: unknown /* const array */
}

export declare class _IOAudioSampleIntervalDescriptor {
	constructor(init?: _IOAudioSampleIntervalDescriptor)
	sampleIntervalHi: number
	sampleIntervalLo: number
}

export type unnamed_10924855648621315523Descriptor =
	| { bw: bm12Cursor }
	| { bw8: bm18Cursor }
	| { rgb: bm34Cursor }
	| { rgb24: bm38Cursor }

export declare class unnamed_10924855648621315523 {
	constructor(init?: unnamed_10924855648621315523Descriptor)
	bw: bm12Cursor
	bw8: bm18Cursor
	rgb: bm34Cursor
	rgb24: bm38Cursor
}

export type IOUSBHIDDataDescriptor = { kbd: IOUSBKeyboardData } | { mouse: IOUSBMouseData }

export declare class IOUSBHIDData {
	constructor(init?: IOUSBHIDDataDescriptor)
	kbd: IOUSBKeyboardData
	mouse: IOUSBMouseData
}

export type unnamed_9382568860700690146Descriptor = { session: number } | { track: number }

export declare class unnamed_9382568860700690146 {
	constructor(init?: unnamed_9382568860700690146Descriptor)
	session: number
	track: number
}

export type unnamed_16176017495813799677Descriptor =
	| { F: unknown /* const array */ }
	| { L: unknown /* const array */ }
	| { S: unknown /* const array */ }
	| { C: unknown /* const array */ }

export declare class unnamed_16176017495813799677 {
	constructor(init?: unnamed_16176017495813799677Descriptor)
	F: unknown /* const array */
	L: unknown /* const array */
	S: unknown /* const array */
	C: unknown /* const array */
}

export type IOFBHDRMetaDataDescriptor = { v1: IOFBHDRMetaDataV1 }

export declare class IOFBHDRMetaData {
	constructor(init?: IOFBHDRMetaDataDescriptor)
	v1: IOFBHDRMetaDataV1
}

export type unnamed_13126335752215089091Descriptor =
	| { v1: IODetailedTimingInformationV1 }
	| { v2: IODetailedTimingInformationV2 }

export declare class unnamed_13126335752215089091 {
	constructor(init?: unnamed_13126335752215089091Descriptor)
	v1: IODetailedTimingInformationV1
	v2: IODetailedTimingInformationV2
}

export type unnamed_2395891732250933184Descriptor =
	| { bytes: interop.PointerConvertible }
	| { ref: interop.PointerConvertible }

export declare class unnamed_2395891732250933184 {
	constructor(init?: unnamed_2395891732250933184Descriptor)
	bytes: interop.Pointer
	ref: interop.Pointer
}

export type unnamed_2774405816219376817Descriptor =
	| { point: _NXTabletPointData }
	| { proximity: _NXTabletProximityData }

export declare class unnamed_2774405816219376817 {
	constructor(init?: unnamed_2774405816219376817Descriptor)
	point: _NXTabletPointData
	proximity: _NXTabletProximityData
}

export type unnamed_1287348019338051674Descriptor =
	| { point: _NXTabletPointData }
	| { proximity: _NXTabletProximityData }

export declare class unnamed_1287348019338051674 {
	constructor(init?: unnamed_1287348019338051674Descriptor)
	point: _NXTabletPointData
	proximity: _NXTabletProximityData
}

export type NXEventDataDescriptor =
	| { mouse: unnamed_6275799594833531837 }
	| { mouseMove: unnamed_10854644804533774633 }
	| { key: unnamed_7504216891884428952 }
	| { tracking: unnamed_14501965845456453057 }
	| { scrollWheel: unnamed_4116032477102299272 }
	| { zoom: unnamed_4116032477102299272 }
	| { compound: unnamed_17124830411558016002 }
	| { tablet: unnamed_11232072664559040057 }
	| { proximity: unnamed_8970883627365768146 }

export declare class NXEventData {
	constructor(init?: NXEventDataDescriptor)
	mouse: unnamed_6275799594833531837
	mouseMove: unnamed_10854644804533774633
	key: unnamed_7504216891884428952
	tracking: unnamed_14501965845456453057
	scrollWheel: unnamed_4116032477102299272
	zoom: unnamed_4116032477102299272
	compound: unnamed_17124830411558016002
	tablet: unnamed_11232072664559040057
	proximity: unnamed_8970883627365768146
}

export declare function IOMasterPort(
	bootstrapPort: number,
	mainPort: interop.PointerConvertible,
): number

export declare function IONotificationPortCreate(mainPort: number): interop.Pointer

export declare function IONotificationPortDestroy(notify: interop.PointerConvertible): void

export declare function IONotificationPortGetRunLoopSource(
	notify: interop.PointerConvertible,
): interop.Object

export declare function IONotificationPortGetMachPort(notify: interop.PointerConvertible): number

export declare function IONotificationPortSetImportanceReceiver(
	notify: interop.PointerConvertible,
): number

export declare function IONotificationPortSetDispatchQueue(
	notify: interop.PointerConvertible,
	queue: NSObject,
): void

export declare function IODispatchCalloutFromMessage(
	unused: interop.PointerConvertible,
	msg: interop.PointerConvertible,
	reference: interop.PointerConvertible,
): void

export declare function IOCreateReceivePort(
	msgType: number,
	recvPort: interop.PointerConvertible,
): number

export declare function IOObjectRelease(object: number): number

export declare function IOObjectRetain(object: number): number

export declare function IOObjectGetClass(
	object: number,
	className: unknown /* const array */,
): number

export declare function IOObjectCopyClass(object: number): interop.Object

export declare function IOObjectCopySuperclassForClass(classname: interop.Object): interop.Object

export declare function IOObjectCopyBundleIdentifierForClass(
	classname: interop.Object,
): interop.Object

export declare function IOObjectConformsTo(
	object: number,
	className: unknown /* const array */,
): number

export declare function IOObjectIsEqualTo(object: number, anObject: number): number

export declare function IOObjectGetKernelRetainCount(object: number): number

export declare function IOObjectGetUserRetainCount(object: number): number

export declare function IOObjectGetRetainCount(object: number): number

export declare function IOIteratorNext(iterator: number): number

export declare function IOIteratorReset(iterator: number): void

export declare function IOIteratorIsValid(iterator: number): number

export declare function IOServiceGetMatchingService(
	mainPort: number,
	matching: interop.Object,
): number

export declare function IOServiceGetMatchingServices(
	mainPort: number,
	matching: interop.Object,
	existing: interop.PointerConvertible,
): number

export declare function IOServiceAddNotification(
	mainPort: number,
	notificationType: unknown /* const array */,
	matching: interop.Object,
	wakePort: number,
	reference: number,
	notification: interop.PointerConvertible,
): number

export declare function IOServiceAddMatchingNotification(
	notifyPort: interop.PointerConvertible,
	notificationType: unknown /* const array */,
	matching: interop.Object,
	callback: (p1: interop.PointerConvertible, p2: number) => void,
	refCon: interop.PointerConvertible,
	notification: interop.PointerConvertible,
): number

export declare function IOServiceAddInterestNotification(
	notifyPort: interop.PointerConvertible,
	service: number,
	interestType: unknown /* const array */,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => void,
	refCon: interop.PointerConvertible,
	notification: interop.PointerConvertible,
): number

export declare function IOServiceMatchPropertyTable(
	service: number,
	matching: interop.Object,
	matches: interop.PointerConvertible,
): number

export declare function IOServiceGetBusyState(
	service: number,
	busyState: interop.PointerConvertible,
): number

export declare function IOServiceWaitQuiet(
	service: number,
	waitTime: interop.PointerConvertible,
): number

export declare function IOKitGetBusyState(
	mainPort: number,
	busyState: interop.PointerConvertible,
): number

export declare function IOKitWaitQuiet(
	mainPort: number,
	waitTime: interop.PointerConvertible,
): number

export declare function IOServiceOpen(
	service: number,
	owningTask: number,
	type: number,
	connect: interop.PointerConvertible,
): number

export declare function IOServiceRequestProbe(service: number, options: number): number

export declare function IOServiceAuthorize(service: number, options: number): number

export declare function IOServiceOpenAsFileDescriptor(service: number, oflag: number): number

export declare function IOServiceClose(connect: number): number

export declare function IOConnectAddRef(connect: number): number

export declare function IOConnectRelease(connect: number): number

export declare function IOConnectGetService(
	connect: number,
	service: interop.PointerConvertible,
): number

export declare function IOConnectSetNotificationPort(
	connect: number,
	type: number,
	port: number,
	reference: number,
): number

export declare function IOConnectMapMemory(
	connect: number,
	memoryType: number,
	intoTask: number,
	atAddress: interop.PointerConvertible,
	ofSize: interop.PointerConvertible,
	options: number,
): number

export declare function IOConnectMapMemory64(
	connect: number,
	memoryType: number,
	intoTask: number,
	atAddress: interop.PointerConvertible,
	ofSize: interop.PointerConvertible,
	options: number,
): number

export declare function IOConnectUnmapMemory(
	connect: number,
	memoryType: number,
	fromTask: number,
	atAddress: number,
): number

export declare function IOConnectUnmapMemory64(
	connect: number,
	memoryType: number,
	fromTask: number,
	atAddress: number,
): number

export declare function IOConnectSetCFProperties(
	connect: number,
	properties: interop.Object,
): number

export declare function IOConnectSetCFProperty(
	connect: number,
	propertyName: interop.Object,
	property: interop.Object,
): number

export declare function IOConnectCallMethod(
	connection: number,
	selector: number,
	input: interop.PointerConvertible,
	inputCnt: number,
	inputStruct: interop.PointerConvertible,
	inputStructCnt: number,
	output: interop.PointerConvertible,
	outputCnt: interop.PointerConvertible,
	outputStruct: interop.PointerConvertible,
	outputStructCnt: interop.PointerConvertible,
): number

export declare function IOConnectCallAsyncMethod(
	connection: number,
	selector: number,
	wake_port: number,
	reference: interop.PointerConvertible,
	referenceCnt: number,
	input: interop.PointerConvertible,
	inputCnt: number,
	inputStruct: interop.PointerConvertible,
	inputStructCnt: number,
	output: interop.PointerConvertible,
	outputCnt: interop.PointerConvertible,
	outputStruct: interop.PointerConvertible,
	outputStructCnt: interop.PointerConvertible,
): number

export declare function IOConnectCallStructMethod(
	connection: number,
	selector: number,
	inputStruct: interop.PointerConvertible,
	inputStructCnt: number,
	outputStruct: interop.PointerConvertible,
	outputStructCnt: interop.PointerConvertible,
): number

export declare function IOConnectCallAsyncStructMethod(
	connection: number,
	selector: number,
	wake_port: number,
	reference: interop.PointerConvertible,
	referenceCnt: number,
	inputStruct: interop.PointerConvertible,
	inputStructCnt: number,
	outputStruct: interop.PointerConvertible,
	outputStructCnt: interop.PointerConvertible,
): number

export declare function IOConnectCallScalarMethod(
	connection: number,
	selector: number,
	input: interop.PointerConvertible,
	inputCnt: number,
	output: interop.PointerConvertible,
	outputCnt: interop.PointerConvertible,
): number

export declare function IOConnectCallAsyncScalarMethod(
	connection: number,
	selector: number,
	wake_port: number,
	reference: interop.PointerConvertible,
	referenceCnt: number,
	input: interop.PointerConvertible,
	inputCnt: number,
	output: interop.PointerConvertible,
	outputCnt: interop.PointerConvertible,
): number

export declare function IOConnectTrap0(connect: number, index: number): number

export declare function IOConnectTrap1(connect: number, index: number, p1: number): number

export declare function IOConnectTrap2(
	connect: number,
	index: number,
	p1: number,
	p2: number,
): number

export declare function IOConnectTrap3(
	connect: number,
	index: number,
	p1: number,
	p2: number,
	p3: number,
): number

export declare function IOConnectTrap4(
	connect: number,
	index: number,
	p1: number,
	p2: number,
	p3: number,
	p4: number,
): number

export declare function IOConnectTrap5(
	connect: number,
	index: number,
	p1: number,
	p2: number,
	p3: number,
	p4: number,
	p5: number,
): number

export declare function IOConnectTrap6(
	connect: number,
	index: number,
	p1: number,
	p2: number,
	p3: number,
	p4: number,
	p5: number,
	p6: number,
): number

export declare function IOConnectAddClient(connect: number, client: number): number

export declare function IORegistryGetRootEntry(mainPort: number): number

export declare function IORegistryEntryFromPath(
	mainPort: number,
	path: unknown /* const array */,
): number

export declare function IORegistryEntryCopyFromPath(mainPort: number, path: interop.Object): number

export declare function IORegistryCreateIterator(
	mainPort: number,
	plane: unknown /* const array */,
	options: number,
	iterator: interop.PointerConvertible,
): number

export declare function IORegistryEntryCreateIterator(
	entry: number,
	plane: unknown /* const array */,
	options: number,
	iterator: interop.PointerConvertible,
): number

export declare function IORegistryIteratorEnterEntry(iterator: number): number

export declare function IORegistryIteratorExitEntry(iterator: number): number

export declare function IORegistryEntryGetName(
	entry: number,
	name: unknown /* const array */,
): number

export declare function IORegistryEntryGetNameInPlane(
	entry: number,
	plane: unknown /* const array */,
	name: unknown /* const array */,
): number

export declare function IORegistryEntryGetLocationInPlane(
	entry: number,
	plane: unknown /* const array */,
	location: unknown /* const array */,
): number

export declare function IORegistryEntryGetPath(
	entry: number,
	plane: unknown /* const array */,
	path: unknown /* const array */,
): number

export declare function IORegistryEntryCopyPath(
	entry: number,
	plane: unknown /* const array */,
): interop.Object

export declare function IORegistryEntryGetRegistryEntryID(
	entry: number,
	entryID: interop.PointerConvertible,
): number

export declare function IORegistryEntryCreateCFProperties(
	entry: number,
	properties: interop.PointerConvertible,
	allocator: interop.Object,
	options: number,
): number

export declare function IORegistryEntryCreateCFProperty(
	entry: number,
	key: interop.Object,
	allocator: interop.Object,
	options: number,
): interop.Object

export declare function IORegistryEntrySearchCFProperty(
	entry: number,
	plane: unknown /* const array */,
	key: interop.Object,
	allocator: interop.Object,
	options: number,
): interop.Object

export declare function IORegistryEntryGetProperty(
	entry: number,
	propertyName: unknown /* const array */,
	buffer: unknown /* const array */,
	size: interop.PointerConvertible,
): number

export declare function IORegistryEntrySetCFProperties(
	entry: number,
	properties: interop.Object,
): number

export declare function IORegistryEntrySetCFProperty(
	entry: number,
	propertyName: interop.Object,
	property: interop.Object,
): number

export declare function IORegistryEntryGetChildIterator(
	entry: number,
	plane: unknown /* const array */,
	iterator: interop.PointerConvertible,
): number

export declare function IORegistryEntryGetChildEntry(
	entry: number,
	plane: unknown /* const array */,
	child: interop.PointerConvertible,
): number

export declare function IORegistryEntryGetParentIterator(
	entry: number,
	plane: unknown /* const array */,
	iterator: interop.PointerConvertible,
): number

export declare function IORegistryEntryGetParentEntry(
	entry: number,
	plane: unknown /* const array */,
	parent: interop.PointerConvertible,
): number

export declare function IORegistryEntryInPlane(
	entry: number,
	plane: unknown /* const array */,
): number

export declare function IOServiceMatching(name: string): interop.Object

export declare function IOServiceNameMatching(name: string): interop.Object

export declare function IOBSDNameMatching(
	mainPort: number,
	options: number,
	bsdName: string,
): interop.Object

export declare function IOOpenFirmwarePathMatching(
	mainPort: number,
	options: number,
	path: string,
): interop.Object

export declare function IORegistryEntryIDMatching(entryID: number): interop.Object

export declare function IOServiceOFPathToBSDName(
	mainPort: number,
	openFirmwarePath: unknown /* const array */,
	bsdName: unknown /* const array */,
): number

export declare function OSGetNotificationFromMessage(
	msg: interop.PointerConvertible,
	index: number,
	type: interop.PointerConvertible,
	reference: interop.PointerConvertible,
	content: interop.PointerConvertible,
	size: interop.PointerConvertible,
): number

export declare function IOCatalogueSendData(
	mainPort: number,
	flag: number,
	buffer: string,
	size: number,
): number

export declare function IOCatalogueTerminate(
	mainPort: number,
	flag: number,
	description: unknown /* const array */,
): number

export declare function IOCatalogueGetData(
	mainPort: number,
	flag: number,
	buffer: interop.PointerConvertible,
	size: interop.PointerConvertible,
): number

export declare function IOCatalogueModuleLoaded(
	mainPort: number,
	name: unknown /* const array */,
): number

export declare function IOCatalogueReset(mainPort: number, flag: number): number

export declare function IODataQueueDataAvailable(dataQueue: interop.PointerConvertible): number

export declare function IODataQueuePeek(dataQueue: interop.PointerConvertible): interop.Pointer

export declare function IODataQueueDequeue(
	dataQueue: interop.PointerConvertible,
	data: interop.PointerConvertible,
	dataSize: interop.PointerConvertible,
): number

export declare function IODataQueueWaitForAvailableData(
	dataQueue: interop.PointerConvertible,
	notificationPort: number,
): number

export declare function IODataQueueAllocateNotificationPort(): number

export declare function IODataQueueEnqueue(
	dataQueue: interop.PointerConvertible,
	data: interop.PointerConvertible,
	dataSize: number,
): number

export declare function IODataQueueSetNotificationPort(
	dataQueue: interop.PointerConvertible,
	notifyPort: number,
): number

export declare function IOCreatePlugInInterfaceForService(
	service: number,
	pluginType: interop.Object,
	interfaceType: interop.Object,
	theInterface: interop.PointerConvertible,
	theScore: interop.PointerConvertible,
): number

export declare function IODestroyPlugInInterface(interface: interop.PointerConvertible): number

export declare function IOCFSerialize(object: interop.Object, options: number): interop.Object

export declare function IOURLCreatePropertyFromResource(
	alloc: interop.Object,
	url: interop.Object,
	property: interop.Object,
	errorCode: interop.PointerConvertible,
): interop.Object

export declare function IOURLCreateDataAndPropertiesFromResource(
	alloc: interop.Object,
	url: interop.Object,
	resourceData: interop.PointerConvertible,
	properties: interop.PointerConvertible,
	desiredProperties: interop.Object,
	errorCode: interop.PointerConvertible,
): number

export declare function IOURLWriteDataAndPropertiesToResource(
	url: interop.Object,
	dataToWrite: interop.Object,
	propertiesToWrite: interop.Object,
	errorCode: interop.PointerConvertible,
): number

export declare function IOCFUnserialize(
	buffer: string,
	allocator: interop.Object,
	options: number,
	errorString: interop.PointerConvertible,
): interop.Object

export declare function IOCFUnserializeBinary(
	buffer: string,
	bufferSize: number,
	allocator: interop.Object,
	options: number,
	errorString: interop.PointerConvertible,
): interop.Object

export declare function IOCFUnserializeWithSize(
	buffer: string,
	bufferSize: number,
	allocator: interop.Object,
	options: number,
	errorString: interop.PointerConvertible,
): interop.Object

export declare function IORPCMessageFromMach(
	msg: interop.PointerConvertible,
	reply: boolean,
): interop.Pointer

export declare function IOAccelFindAccelerator(
	framebuffer: number,
	pAccelerator: interop.PointerConvertible,
	pFramebufferIndex: interop.PointerConvertible,
): number

export declare function IOFramebufferOpen(
	service: number,
	owningTask: number,
	type: number,
	connect: interop.PointerConvertible,
): number

export declare function IODisplayCreateInfoDictionary(
	framebuffer: number,
	options: number,
): interop.Object

export declare function IODisplayMatchDictionaries(
	matching1: interop.Object,
	matching2: interop.Object,
	options: number,
): number

export declare function IODisplayForFramebuffer(framebuffer: number, options: number): number

export declare function IODisplaySetParameters(
	service: number,
	options: number,
	params: interop.Object,
): number

export declare function IODisplaySetFloatParameter(
	service: number,
	options: number,
	parameterName: interop.Object,
	value: number,
): number

export declare function IODisplaySetIntegerParameter(
	service: number,
	options: number,
	parameterName: interop.Object,
	value: number,
): number

export declare function IODisplayCopyParameters(
	service: number,
	options: number,
	params: interop.PointerConvertible,
): number

export declare function IODisplayCopyFloatParameters(
	service: number,
	options: number,
	params: interop.PointerConvertible,
): number

export declare function IODisplayGetFloatParameter(
	service: number,
	options: number,
	parameterName: interop.Object,
	value: interop.PointerConvertible,
): number

export declare function IODisplayGetIntegerRangeParameter(
	service: number,
	options: number,
	parameterName: interop.Object,
	value: interop.PointerConvertible,
	min: interop.PointerConvertible,
	max: interop.PointerConvertible,
): number

export declare function IODisplayCommitParameters(service: number, options: number): number

export declare function IOHIDQueueGetTypeID(): number

export declare function IOHIDQueueCreate(
	allocator: interop.Object,
	device: interop.Object,
	depth: number,
	options: number,
): interop.Object

export declare function IOHIDQueueGetDevice(queue: interop.Object): interop.Object

export declare function IOHIDQueueGetDepth(queue: interop.Object): number

export declare function IOHIDQueueSetDepth(queue: interop.Object, depth: number): void

export declare function IOHIDQueueAddElement(queue: interop.Object, element: interop.Object): void

export declare function IOHIDQueueRemoveElement(
	queue: interop.Object,
	element: interop.Object,
): void

export declare function IOHIDQueueContainsElement(
	queue: interop.Object,
	element: interop.Object,
): number

export declare function IOHIDQueueStart(queue: interop.Object): void

export declare function IOHIDQueueStop(queue: interop.Object): void

export declare function IOHIDQueueScheduleWithRunLoop(
	queue: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDQueueUnscheduleFromRunLoop(
	queue: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDQueueSetDispatchQueue(
	queue: interop.Object,
	dispatchQueue: NSObject,
): void

export declare function IOHIDQueueSetCancelHandler(queue: interop.Object, handler: () => void): void

export declare function IOHIDQueueActivate(queue: interop.Object): void

export declare function IOHIDQueueCancel(queue: interop.Object): void

export declare function IOHIDQueueRegisterValueAvailableCallback(
	queue: interop.Object,
	callback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDQueueCopyNextValue(queue: interop.Object): interop.Object

export declare function IOHIDQueueCopyNextValueWithTimeout(
	queue: interop.Object,
	timeout: number,
): interop.Object

export declare function IOHIDDeviceGetTypeID(): number

export declare function IOHIDDeviceCreate(
	allocator: interop.Object,
	service: number,
): interop.Object

export declare function IOHIDDeviceGetService(device: interop.Object): number

export declare function IOHIDDeviceOpen(device: interop.Object, options: number): number

export declare function IOHIDDeviceClose(device: interop.Object, options: number): number

export declare function IOHIDDeviceConformsTo(
	device: interop.Object,
	usagePage: number,
	usage: number,
): number

export declare function IOHIDDeviceGetProperty(
	device: interop.Object,
	key: interop.Object,
): interop.Object

export declare function IOHIDDeviceSetProperty(
	device: interop.Object,
	key: interop.Object,
	property: interop.Object,
): number

export declare function IOHIDDeviceCopyMatchingElements(
	device: interop.Object,
	matching: interop.Object,
	options: number,
): interop.Object

export declare function IOHIDDeviceScheduleWithRunLoop(
	device: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDDeviceUnscheduleFromRunLoop(
	device: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDDeviceSetDispatchQueue(device: interop.Object, queue: NSObject): void

export declare function IOHIDDeviceSetCancelHandler(
	device: interop.Object,
	handler: () => void,
): void

export declare function IOHIDDeviceActivate(device: interop.Object): void

export declare function IOHIDDeviceCancel(device: interop.Object): void

export declare function IOHIDDeviceRegisterRemovalCallback(
	device: interop.Object,
	callback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDDeviceRegisterInputValueCallback(
	device: interop.Object,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDDeviceRegisterInputReportCallback(
	device: interop.Object,
	report: interop.PointerConvertible,
	reportLength: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.Enum<typeof IOHIDReportType>,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDDeviceRegisterInputReportWithTimeStampCallback(
	device: interop.Object,
	report: interop.PointerConvertible,
	reportLength: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.Enum<typeof IOHIDReportType>,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
		p8: number,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDDeviceSetInputValueMatching(
	device: interop.Object,
	matching: interop.Object,
): void

export declare function IOHIDDeviceSetInputValueMatchingMultiple(
	device: interop.Object,
	multiple: interop.Object,
): void

export declare function IOHIDDeviceSetValue(
	device: interop.Object,
	element: interop.Object,
	value: interop.Object,
): number

export declare function IOHIDDeviceSetValueMultiple(
	device: interop.Object,
	multiple: interop.Object,
): number

export declare function IOHIDDeviceSetValueWithCallback(
	device: interop.Object,
	element: interop.Object,
	value: interop.Object,
	timeout: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function IOHIDDeviceSetValueMultipleWithCallback(
	device: interop.Object,
	multiple: interop.Object,
	timeout: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function IOHIDDeviceGetValue(
	device: interop.Object,
	element: interop.Object,
	pValue: interop.PointerConvertible,
): number

export declare function IOHIDDeviceGetValueWithOptions(
	device: interop.Object,
	element: interop.Object,
	pValue: interop.PointerConvertible,
	options: number,
): number

export declare function IOHIDDeviceCopyValueMultiple(
	device: interop.Object,
	elements: interop.Object,
	pMultiple: interop.PointerConvertible,
): number

export declare function IOHIDDeviceGetValueWithCallback(
	device: interop.Object,
	element: interop.Object,
	pValue: interop.PointerConvertible,
	timeout: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function IOHIDDeviceCopyValueMultipleWithCallback(
	device: interop.Object,
	elements: interop.Object,
	pMultiple: interop.PointerConvertible,
	timeout: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function IOHIDDeviceSetReport(
	device: interop.Object,
	reportType: interop.Enum<typeof IOHIDReportType>,
	reportID: number,
	report: interop.PointerConvertible,
	reportLength: number,
): number

export declare function IOHIDDeviceSetReportWithCallback(
	device: interop.Object,
	reportType: interop.Enum<typeof IOHIDReportType>,
	reportID: number,
	report: interop.PointerConvertible,
	reportLength: number,
	timeout: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.Enum<typeof IOHIDReportType>,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function IOHIDDeviceGetReport(
	device: interop.Object,
	reportType: interop.Enum<typeof IOHIDReportType>,
	reportID: number,
	report: interop.PointerConvertible,
	pReportLength: interop.PointerConvertible,
): number

export declare function IOHIDDeviceGetReportWithCallback(
	device: interop.Object,
	reportType: interop.Enum<typeof IOHIDReportType>,
	reportID: number,
	report: interop.PointerConvertible,
	pReportLength: interop.PointerConvertible,
	timeout: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.Enum<typeof IOHIDReportType>,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function IOHIDElementGetTypeID(): number

export declare function IOHIDElementCreateWithDictionary(
	allocator: interop.Object,
	dictionary: interop.Object,
): interop.Object

export declare function IOHIDElementGetDevice(element: interop.Object): interop.Object

export declare function IOHIDElementGetParent(element: interop.Object): interop.Object

export declare function IOHIDElementGetChildren(element: interop.Object): interop.Object

export declare function IOHIDElementAttach(element: interop.Object, toAttach: interop.Object): void

export declare function IOHIDElementDetach(element: interop.Object, toDetach: interop.Object): void

export declare function IOHIDElementCopyAttached(element: interop.Object): interop.Object

export declare function IOHIDElementGetCookie(element: interop.Object): number

export declare function IOHIDElementGetType(
	element: interop.Object,
): interop.Enum<typeof IOHIDElementType>

export declare function IOHIDElementGetCollectionType(
	element: interop.Object,
): interop.Enum<typeof IOHIDElementCollectionType>

export declare function IOHIDElementGetUsagePage(element: interop.Object): number

export declare function IOHIDElementGetUsage(element: interop.Object): number

export declare function IOHIDElementIsVirtual(element: interop.Object): number

export declare function IOHIDElementIsRelative(element: interop.Object): number

export declare function IOHIDElementIsWrapping(element: interop.Object): number

export declare function IOHIDElementIsArray(element: interop.Object): number

export declare function IOHIDElementIsNonLinear(element: interop.Object): number

export declare function IOHIDElementHasPreferredState(element: interop.Object): number

export declare function IOHIDElementHasNullState(element: interop.Object): number

export declare function IOHIDElementGetName(element: interop.Object): interop.Object

export declare function IOHIDElementGetReportID(element: interop.Object): number

export declare function IOHIDElementGetReportSize(element: interop.Object): number

export declare function IOHIDElementGetReportCount(element: interop.Object): number

export declare function IOHIDElementGetUnit(element: interop.Object): number

export declare function IOHIDElementGetUnitExponent(element: interop.Object): number

export declare function IOHIDElementGetLogicalMin(element: interop.Object): number

export declare function IOHIDElementGetLogicalMax(element: interop.Object): number

export declare function IOHIDElementGetPhysicalMin(element: interop.Object): number

export declare function IOHIDElementGetPhysicalMax(element: interop.Object): number

export declare function IOHIDElementGetProperty(
	element: interop.Object,
	key: interop.Object,
): interop.Object

export declare function IOHIDElementSetProperty(
	element: interop.Object,
	key: interop.Object,
	property: interop.Object,
): number

export declare function IOHIDManagerGetTypeID(): number

export declare function IOHIDManagerCreate(
	allocator: interop.Object,
	options: number,
): interop.Object

export declare function IOHIDManagerOpen(manager: interop.Object, options: number): number

export declare function IOHIDManagerClose(manager: interop.Object, options: number): number

export declare function IOHIDManagerGetProperty(
	manager: interop.Object,
	key: interop.Object,
): interop.Object

export declare function IOHIDManagerSetProperty(
	manager: interop.Object,
	key: interop.Object,
	value: interop.Object,
): number

export declare function IOHIDManagerScheduleWithRunLoop(
	manager: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDManagerUnscheduleFromRunLoop(
	manager: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDManagerSetDispatchQueue(manager: interop.Object, queue: NSObject): void

export declare function IOHIDManagerSetCancelHandler(
	manager: interop.Object,
	handler: () => void,
): void

export declare function IOHIDManagerActivate(manager: interop.Object): void

export declare function IOHIDManagerCancel(manager: interop.Object): void

export declare function IOHIDManagerSetDeviceMatching(
	manager: interop.Object,
	matching: interop.Object,
): void

export declare function IOHIDManagerSetDeviceMatchingMultiple(
	manager: interop.Object,
	multiple: interop.Object,
): void

export declare function IOHIDManagerCopyDevices(manager: interop.Object): interop.Object

export declare function IOHIDManagerRegisterDeviceMatchingCallback(
	manager: interop.Object,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDManagerRegisterDeviceRemovalCallback(
	manager: interop.Object,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDManagerRegisterInputReportCallback(
	manager: interop.Object,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.Enum<typeof IOHIDReportType>,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDManagerRegisterInputReportWithTimeStampCallback(
	manager: interop.Object,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.Enum<typeof IOHIDReportType>,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
		p8: number,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDManagerRegisterInputValueCallback(
	manager: interop.Object,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): void

export declare function IOHIDManagerSetInputValueMatching(
	manager: interop.Object,
	matching: interop.Object,
): void

export declare function IOHIDManagerSetInputValueMatchingMultiple(
	manager: interop.Object,
	multiple: interop.Object,
): void

export declare function IOHIDManagerSaveToPropertyDomain(
	manager: interop.Object,
	applicationID: interop.Object,
	userName: interop.Object,
	hostName: interop.Object,
	options: number,
): void

export declare function IOHIDValueGetTypeID(): number

export declare function IOHIDValueCreateWithIntegerValue(
	allocator: interop.Object,
	element: interop.Object,
	timeStamp: number,
	value: number,
): interop.Object

export declare function IOHIDValueCreateWithBytes(
	allocator: interop.Object,
	element: interop.Object,
	timeStamp: number,
	bytes: interop.PointerConvertible,
	length: number,
): interop.Object

export declare function IOHIDValueCreateWithBytesNoCopy(
	allocator: interop.Object,
	element: interop.Object,
	timeStamp: number,
	bytes: interop.PointerConvertible,
	length: number,
): interop.Object

export declare function IOHIDValueGetElement(value: interop.Object): interop.Object

export declare function IOHIDValueGetTimeStamp(value: interop.Object): number

export declare function IOHIDValueGetLength(value: interop.Object): number

export declare function IOHIDValueGetBytePtr(value: interop.Object): interop.Pointer

export declare function IOHIDValueGetIntegerValue(value: interop.Object): number

export declare function IOHIDValueGetScaledValue(value: interop.Object, type: number): number

export declare function IOHIDTransactionGetTypeID(): number

export declare function IOHIDTransactionCreate(
	allocator: interop.Object,
	device: interop.Object,
	direction: interop.Enum<typeof IOHIDTransactionDirectionType>,
	options: number,
): interop.Object

export declare function IOHIDTransactionGetDevice(transaction: interop.Object): interop.Object

export declare function IOHIDTransactionGetDirection(
	transaction: interop.Object,
): interop.Enum<typeof IOHIDTransactionDirectionType>

export declare function IOHIDTransactionSetDirection(
	transaction: interop.Object,
	direction: interop.Enum<typeof IOHIDTransactionDirectionType>,
): void

export declare function IOHIDTransactionAddElement(
	transaction: interop.Object,
	element: interop.Object,
): void

export declare function IOHIDTransactionRemoveElement(
	transaction: interop.Object,
	element: interop.Object,
): void

export declare function IOHIDTransactionContainsElement(
	transaction: interop.Object,
	element: interop.Object,
): number

export declare function IOHIDTransactionScheduleWithRunLoop(
	transaction: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDTransactionUnscheduleFromRunLoop(
	transaction: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): void

export declare function IOHIDTransactionSetValue(
	transaction: interop.Object,
	element: interop.Object,
	value: interop.Object,
	options: number,
): void

export declare function IOHIDTransactionGetValue(
	transaction: interop.Object,
	element: interop.Object,
	options: number,
): interop.Object

export declare function IOHIDTransactionCommit(transaction: interop.Object): number

export declare function IOHIDTransactionCommitWithCallback(
	transaction: interop.Object,
	timeout: number,
	callback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
	context: interop.PointerConvertible,
): number

export declare function IOHIDTransactionClear(transaction: interop.Object): void

export declare function IOHIDCreateSharedMemory(connect: number, version: number): number

export declare function IOHIDSetEventsEnable(connect: number, enable: number): number

export declare function IOHIDSetCursorEnable(connect: number, enable: number): number

export declare function IOHIDPostEvent(
	connect: number,
	eventType: number,
	location: IOGPoint,
	eventData: interop.PointerConvertible,
	eventDataVersion: number,
	eventFlags: number,
	options: number,
): number

export declare function IOHIDSetMouseLocation(connect: number, x: number, y: number): number

export declare function IOHIDGetButtonEventNum(
	connect: number,
	button: interop.Enum<typeof NXMouseButton>,
	eventNum: interop.PointerConvertible,
): number

export declare function IOHIDGetScrollAcceleration(
	handle: number,
	acceleration: interop.PointerConvertible,
): number

export declare function IOHIDSetScrollAcceleration(handle: number, acceleration: number): number

export declare function IOHIDGetMouseAcceleration(
	handle: number,
	acceleration: interop.PointerConvertible,
): number

export declare function IOHIDSetMouseAcceleration(handle: number, acceleration: number): number

export declare function IOHIDGetMouseButtonMode(
	handle: number,
	mode: interop.PointerConvertible,
): number

export declare function IOHIDSetMouseButtonMode(handle: number, mode: number): number

export declare function IOHIDGetAccelerationWithKey(
	handle: number,
	key: interop.Object,
	acceleration: interop.PointerConvertible,
): number

export declare function IOHIDSetAccelerationWithKey(
	handle: number,
	key: interop.Object,
	acceleration: number,
): number

export declare function IOHIDGetParameter(
	handle: number,
	key: interop.Object,
	maxSize: number,
	bytes: interop.PointerConvertible,
	actualSize: interop.PointerConvertible,
): number

export declare function IOHIDSetParameter(
	handle: number,
	key: interop.Object,
	bytes: interop.PointerConvertible,
	size: number,
): number

export declare function IOHIDCopyCFTypeParameter(
	handle: number,
	key: interop.Object,
	parameter: interop.PointerConvertible,
): number

export declare function IOHIDSetCFTypeParameter(
	handle: number,
	key: interop.Object,
	parameter: interop.Object,
): number

export declare function IOHIDGetStateForSelector(
	handle: number,
	selector: number,
	state: interop.PointerConvertible,
): number

export declare function IOHIDSetStateForSelector(
	handle: number,
	selector: number,
	state: number,
): number

export declare function IOHIDGetModifierLockState(
	handle: number,
	selector: number,
	state: interop.PointerConvertible,
): number

export declare function IOHIDSetModifierLockState(
	handle: number,
	selector: number,
	state: boolean,
): number

export declare function IOHIDRegisterVirtualDisplay(
	handle: number,
	display_token: interop.PointerConvertible,
): number

export declare function IOHIDUnregisterVirtualDisplay(handle: number, display_token: number): number

export declare function IOHIDSetVirtualDisplayBounds(
	handle: number,
	display_token: number,
	bounds: interop.PointerConvertible,
): number

export declare function IOHIDGetActivityState(
	handle: number,
	hidActivityIdle: interop.PointerConvertible,
): number

export declare function IOHIDCheckAccess(
	requestType: interop.Enum<typeof IOHIDRequestType>,
): interop.Enum<typeof IOHIDAccessType>

export declare function IOHIDRequestAccess(
	requestType: interop.Enum<typeof IOHIDRequestType>,
): boolean

export declare function IOHIDAccessCheckAuditToken(
	requestType: interop.Enum<typeof IOHIDRequestType>,
	token: audit_token_t,
): boolean

export declare function NXOpenEventStatus(): number

export declare function NXCloseEventStatus(handle: number): void

export declare function NXEventSystemInfo(
	handle: number,
	flavor: string,
	evs_info: interop.PointerConvertible,
	evs_info_cnt: interop.PointerConvertible,
): interop.Pointer

export declare function NXSetKeyRepeatInterval(handle: number, seconds: number): void

export declare function NXKeyRepeatInterval(handle: number): number

export declare function NXSetKeyRepeatThreshold(handle: number, threshold: number): void

export declare function NXKeyRepeatThreshold(handle: number): number

export declare function NXResetKeyboard(handle: number): void

export declare function NXSetClickTime(handle: number, seconds: number): void

export declare function NXClickTime(handle: number): number

export declare function NXSetClickSpace(handle: number, area: interop.PointerConvertible): void

export declare function NXGetClickSpace(handle: number, area: interop.PointerConvertible): void

export declare function NXResetMouse(handle: number): void

export declare function IOHIDEventSystemClientCreateSimpleClient(
	allocator: interop.Object,
): interop.Pointer

export declare function IOHIDEventSystemClientSetProperty(
	client: interop.PointerConvertible,
	key: interop.Object,
	property: interop.Object,
): number

export declare function IOHIDEventSystemClientCopyProperty(
	client: interop.PointerConvertible,
	key: interop.Object,
): interop.Object

export declare function IOHIDEventSystemClientGetTypeID(): number

export declare function IOHIDEventSystemClientCopyServices(
	client: interop.PointerConvertible,
): interop.Object

export declare function IOHIDServiceClientSetProperty(
	service: interop.PointerConvertible,
	key: interop.Object,
	property: interop.Object,
): number

export declare function IOHIDServiceClientCopyProperty(
	service: interop.PointerConvertible,
	key: interop.Object,
): interop.Object

export declare function IOHIDServiceClientGetTypeID(): number

export declare function IOHIDServiceClientGetRegistryID(
	service: interop.PointerConvertible,
): interop.Object

export declare function IOHIDServiceClientConformsTo(
	service: interop.PointerConvertible,
	usagePage: number,
	usage: number,
): number

export declare function IOHIDUserDeviceGetTypeID(): number

export declare function IOHIDUserDeviceCreateWithProperties(
	allocator: interop.Object,
	properties: interop.Object,
	options: number,
): interop.Pointer

export declare function IOHIDUserDeviceRegisterGetReportBlock(
	device: interop.PointerConvertible,
	block: (
		p1: interop.Enum<typeof IOHIDReportType>,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number,
): void

export declare function IOHIDUserDeviceRegisterSetReportBlock(
	device: interop.PointerConvertible,
	block: (
		p1: interop.Enum<typeof IOHIDReportType>,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number,
): void

export declare function IOHIDUserDeviceSetDispatchQueue(
	device: interop.PointerConvertible,
	queue: NSObject,
): void

export declare function IOHIDUserDeviceSetCancelHandler(
	device: interop.PointerConvertible,
	handler: () => void,
): void

export declare function IOHIDUserDeviceActivate(device: interop.PointerConvertible): void

export declare function IOHIDUserDeviceCancel(device: interop.PointerConvertible): void

export declare function IOHIDUserDeviceCopyProperty(
	device: interop.PointerConvertible,
	key: interop.Object,
): interop.Object

export declare function IOHIDUserDeviceSetProperty(
	device: interop.PointerConvertible,
	key: interop.Object,
	property: interop.Object,
): number

export declare function IOHIDUserDeviceHandleReportWithTimeStamp(
	device: interop.PointerConvertible,
	timestamp: number,
	report: interop.PointerConvertible,
	reportLength: number,
): number

export declare function IOFBGetI2CInterfaceCount(
	framebuffer: number,
	count: interop.PointerConvertible,
): number

export declare function IOFBCopyI2CInterfaceForBus(
	framebuffer: number,
	bus: number,
	interface: interop.PointerConvertible,
): number

export declare function IOI2CCopyInterfaceForID(
	identifier: interop.Object,
	interface: interop.PointerConvertible,
): number

export declare function IOI2CInterfaceOpen(
	interface: number,
	options: number,
	connect: interop.PointerConvertible,
): number

export declare function IOI2CInterfaceClose(
	connect: interop.PointerConvertible,
	options: number,
): number

export declare function IOI2CSendRequest(
	connect: interop.PointerConvertible,
	options: number,
	request: interop.PointerConvertible,
): number

export declare function KextManagerCreateURLForBundleIdentifier(
	allocator: interop.Object,
	kextIdentifier: interop.Object,
): interop.Object

export declare function KextManagerLoadKextWithIdentifier(
	kextIdentifier: interop.Object,
	dependencyKextAndFolderURLs: interop.Object,
): number

export declare function KextManagerLoadKextWithURL(
	kextURL: interop.Object,
	dependencyKextAndFolderURLs: interop.Object,
): number

export declare function KextManagerUnloadKextWithIdentifier(kextIdentifier: interop.Object): number

export declare function KextManagerCopyLoadedKextInfo(
	kextIdentifiers: interop.Object,
	infoKeys: interop.Object,
): interop.Object

export declare function IONetworkOpen(obj: number, con: interop.PointerConvertible): number

export declare function IONetworkClose(con: number): number

export declare function IONetworkWriteData(
	conObj: number,
	dataHandle: number,
	srcBuf: interop.PointerConvertible,
	inSize: number,
): number

export declare function IONetworkReadData(
	conObj: number,
	dataHandle: number,
	destBuf: interop.PointerConvertible,
	inOutSizeP: interop.PointerConvertible,
): number

export declare function IONetworkResetData(conObject: number, dataHandle: number): number

export declare function IONetworkGetDataCapacity(
	conObject: number,
	dataHandle: number,
	capacityP: interop.PointerConvertible,
): number

export declare function IONetworkGetDataHandle(
	conObject: number,
	dataName: string,
	dataHandleP: interop.PointerConvertible,
): number

export declare function IONetworkSetPacketFiltersMask(
	connect: number,
	filterGroup: unknown /* const array */,
	filtersMask: number,
	options: number,
): number

export declare function IONetworkGetPacketFiltersMask(
	connect: number,
	filterGroup: unknown /* const array */,
	filtersMask: interop.PointerConvertible,
	options: number,
): number

export declare function IOPSGetBatteryWarningLevel(): interop.Enum<
	typeof IOPSLowBatteryWarningLevel
>

export declare function IOPSGetTimeRemainingEstimate(): number

export declare function IOPSCopyPowerSourcesInfo(): interop.Object

export declare function IOPSCopyPowerSourcesList(blob: interop.Object): interop.Object

export declare function IOPSGetPowerSourceDescription(
	blob: interop.Object,
	ps: interop.Object,
): interop.Object

export declare function IOPSGetProvidingPowerSourceType(snapshot: interop.Object): interop.Object

export declare function IOPSNotificationCreateRunLoopSource(
	callback: (p1: interop.PointerConvertible) => void,
	context: interop.PointerConvertible,
): interop.Object

export declare function IOPSCreateLimitedPowerNotification(
	callback: (p1: interop.PointerConvertible) => void,
	context: interop.PointerConvertible,
): interop.Object

export declare function IOPSCopyExternalPowerAdapterDetails(): interop.Object

export declare function IOPMFindPowerManagement(master_device_port: number): number

export declare function IOPMSetAggressiveness(
	fb: number,
	type: number,
	aggressiveness: number,
): number

export declare function IOPMGetAggressiveness(
	fb: number,
	type: number,
	aggressiveness: interop.PointerConvertible,
): number

export declare function IOPMSleepEnabled(): number

export declare function IOPMSleepSystem(fb: number): number

export declare function IOPMCopyBatteryInfo(
	masterPort: number,
	info: interop.PointerConvertible,
): number

export declare function IORegisterApp(
	refcon: interop.PointerConvertible,
	theDriver: number,
	thePortRef: interop.PointerConvertible,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => void,
	notifier: interop.PointerConvertible,
): number

export declare function IORegisterForSystemPower(
	refcon: interop.PointerConvertible,
	thePortRef: interop.PointerConvertible,
	callback: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
	) => void,
	notifier: interop.PointerConvertible,
): number

export declare function IODeregisterApp(notifier: interop.PointerConvertible): number

export declare function IODeregisterForSystemPower(notifier: interop.PointerConvertible): number

export declare function IOAllowPowerChange(kernelPort: number, notificationID: number): number

export declare function IOCancelPowerChange(kernelPort: number, notificationID: number): number

export declare function IOPMSchedulePowerEvent(
	time_to_wake: interop.Object,
	my_id: interop.Object,
	type: interop.Object,
): number

export declare function IOPMCancelScheduledPowerEvent(
	time_to_wake: interop.Object,
	my_id: interop.Object,
	type: interop.Object,
): number

export declare function IOPMCopyScheduledPowerEvents(): interop.Object

export declare function IOPMAssertionCreateWithDescription(
	AssertionType: interop.Object,
	Name: interop.Object,
	Details: interop.Object,
	HumanReadableReason: interop.Object,
	LocalizationBundlePath: interop.Object,
	Timeout: number,
	TimeoutAction: interop.Object,
	AssertionID: interop.PointerConvertible,
): number

export declare function IOPMAssertionCreateWithProperties(
	AssertionProperties: interop.Object,
	AssertionID: interop.PointerConvertible,
): number

export declare function IOPMAssertionDeclareUserActivity(
	AssertionName: interop.Object,
	userType: interop.Enum<typeof IOPMUserActiveType>,
	AssertionID: interop.PointerConvertible,
): number

export declare function IOPMDeclareNetworkClientActivity(
	AssertionName: interop.Object,
	AssertionID: interop.PointerConvertible,
): number

export declare function IOPMAssertionRetain(theAssertion: number): void

export declare function IOPMAssertionRelease(AssertionID: number): number

export declare function IOPMAssertionCopyProperties(theAssertion: number): interop.Object

export declare function IOPMAssertionSetProperty(
	theAssertion: number,
	theProperty: interop.Object,
	theValue: interop.Object,
): number

export declare function IOPMCopyAssertionsByProcess(
	AssertionsByPID: interop.PointerConvertible,
): number

export declare function IOPMCopyAssertionsStatus(
	AssertionsStatus: interop.PointerConvertible,
): number

export declare function IOPMAssertionCreate(
	AssertionType: interop.Object,
	AssertionLevel: number,
	AssertionID: interop.PointerConvertible,
): number

export declare function IOPMAssertionCreateWithName(
	AssertionType: interop.Object,
	AssertionLevel: number,
	AssertionName: interop.Object,
	AssertionID: interop.PointerConvertible,
): number

export declare function IOGetSystemLoadAdvisory(): number

export declare function IOCopySystemLoadAdvisoryDetailed(): interop.Object

export declare function IOPMCopyCPUPowerStatus(cpuPowerStatus: interop.PointerConvertible): number

export declare function IOPMGetThermalWarningLevel(thermalLevel: interop.PointerConvertible): number
