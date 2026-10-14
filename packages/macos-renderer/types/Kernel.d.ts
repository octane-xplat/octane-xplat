/// <reference types="@nativescript/objc-node-api" />

declare const kDataRotate270: number;

declare const kDataRotate180: number;

declare const kVCUsePosition: number;

declare const kVCAcquireImmediate: number;

declare const disable_kext_printf_serial_output: boolean;

declare const enable_dklog_serial_output: boolean;

declare const disable_iolog_serial_output: boolean;

declare const uint32_t: number;

declare const serialmode: number;

declare const version: interop.Pointer;

declare const version_variant: interop.Pointer;

declare const version_major: number;

declare const OSDextStatistics: number;

declare const OSKext: number;

declare const kIOEventLinkMaxNameLength: number;

declare const kIOExtensiblePaniclogOptionsWithBuffer: number;

declare const IOServiceNotificationDispatchSourceInterface: number;

declare const kIOServiceNotificationTypeLast: number;

declare const kIOServiceNotificationTypeMatched: number;

declare const kIOServiceNotificationTypeTerminated: number;

declare const IOWorkGroup: number;

declare const kIOWorkGroupMaxNameLength: number;

declare const kKUNCCancelResponse: number;

declare const kKUNCAlternateResponse: number;

declare const kAppleGPIOUserClientMethodSetGPIOData: number;

declare const kAppleGPIOUserClientMethodSetDevice: number;

declare const DYLD_CHAINED_IMPORT_ADDEND: number;

declare const DYLD_CHAINED_PTR_ARM64E_SHARED_CACHE: number;

declare const DYLD_CHAINED_PTR_ARM64E_FIRMWARE: number;

declare const DYLD_CHAINED_PTR_64_KERNEL_CACHE: number;

declare const DYLD_CHAINED_PTR_32_CACHE: number;

declare const DYLD_CHAINED_PTR_64: number;

declare const DYLD_CHAINED_PTR_START_NONE: number;

declare const os: number;

declare const operator: interop.Pointer;

declare const receive_vfs_nspace_subsystem: receive_vfs_nspace_subsystem;

declare const arcade_upcall_subsystem: arcade_upcall_subsystem;

declare const clock_reply_subsystem: clock_reply_subsystem;

declare const memory_error_notification_subsystem: memory_error_notification_subsystem;

declare const coalition_notification_subsystem: coalition_notification_subsystem;

declare const fairplay_subsystem: fairplay_subsystem;

declare const iocompressionstats_notification_subsystem: iocompressionstats_notification_subsystem;

declare const do_notify_subsystem: do_notify_subsystem;

declare const OSRetain: number;

declare const OSNoRetain: number;

declare const libkern: number;

declare const kIterationDone: number;

declare const kError: number;

declare const kDTPathNameSeparator: number;

declare const assert_boot_args_size_is_4096: unknown /* const array */;

declare const kEfiMaxMemoryType: number;

declare const kEfiMemoryMappedIOPortSpace: number;

declare const kEfiMemoryMappedIO: number;

declare const kEfiACPIMemoryNVS: number;

declare const kEfiConventionalMemory: number;

declare const kEfiRuntimeServicesData: number;

declare const kEfiReservedMemoryType: number;

declare const kBootDriverTypeKEXT: number;

declare const kBootDriverTypeInvalid: number;

declare const AppleCallbackPowerSourceProvider: number;

declare const IOHIDTranslationService: number;

declare const IOHIDPowerSourceClient: number;

declare const speclisth: unknown /* const array */;

declare const sockopt_set: number;

declare const sock_data_filt_flag_record: number;

declare const sock_evt_bound: number;

declare const sock_evt_closing: number;

declare const sock_evt_cantsendmore: number;

declare const sock_evt_shutdown: number;

declare const sock_evt_flush_read: number;

declare const sock_evt_connected: number;

declare const sock_evt_connecting: number;

declare const SFLT_EXTENDED: number;

declare const SFLT_PROG: number;

declare const SFLT_GLOBAL: number;

declare const kdebug_enable: number;

declare const msghdrs: interop.Pointer;

declare const msginfo: msginfo;

declare const MTF_IFADDR: number;

declare const MTF_SONAME: number;

declare const MTF_ATABLE: number;

declare const MTF_PCB: number;

declare const MTF_SOCKET: number;

declare const MTF_HEADER: number;

declare const lz4_encode_scratch_size: number;

declare const lz4_hash_table_size: number;

declare const OSAction_AFKUserDataPipe__HandleReportInterface: number;

declare const OSAction_AFKUserDataPipe__HandleResponseMetaClass: number;

declare const OSAction_AFKUserDataPipe__HandleResponse_Class: OSClassLoadInformation;

declare const gOSAction_AFKUserDataPipe__HandleResponseMetaClass: interop.Pointer;

declare const AFKUserDataPipeMetaClass: number;

declare const gAFKUserDataPipeMetaClass: interop.Pointer;

declare const AFKEndpointInterface: number;

declare const AFKEndpointInterfaceInterface: number;

declare const AFKEndpointInterface_Class: OSClassLoadInformation;

declare const AFKUserDataPipe: number;

declare const AFKHIDTBDevice: number;

declare const AFKTightbeamEndpoint: number;

declare const IOFastPathHIDLEDService: number;

declare const IOFastPathHIDService: number;

declare const IOHIDTimeSyncService: number;

declare const IOFastPathField: number;

declare const DigitizerTransducer: number;

declare const kHIDDispatchOptionKeyboardNoRepeat: number;

declare const kHIDDispatchOptionPhaseMayBegin: number;

declare const kHIDDispatchOptionPhaseAny: number;

declare const kHIDDispatchOptionScrollMomentumEnd: number;

declare const kHIDDispatchOptionPointerDisplayIntegrated: number;

declare const OSAction_IOHIDEventService__CopyEvent_Class: OSClassLoadInformation;

declare const gOSAction_IOHIDEventService__CopyEventMetaClass: interop.Pointer;

declare const OSAction_IOHIDEventService__SetUserProperties: number;

declare const OSAction_IOHIDEventService__SetLED_Class: OSClassLoadInformation;

declare const kKeyMaskFn: number;

declare const kKeyMaskEsc: number;

declare const kKeyMaskSlash: number;

declare const kKeyMaskShift: number;

declare const ATADeviceNub: number;

declare const IOATABusCommand: number;

declare const IOATADevice: number;

declare const IOATADevConfig: number;

declare const IOATACommand: number;

declare const IOExtendedLBA: number;

declare const kATADMAErr: number;

declare const kATAModeNotSupported: number;

declare const kATAErrDevBusy: number;

declare const kATAUnknownOpcode: number;

declare const kATAErrUnknownType: number;

declare const kATADisableWriteCache: number;

declare const kATASetPIOMode: number;

declare const kATAEnableWriteCache: number;

declare const kATAcmdFlushCacheExtended: number;

declare const kATAcmdCheckPowerMode: number;

declare const kATAcmdReadBuffer: number;

declare const kATAcmdIdle: number;

declare const kATAcmdStandby: number;

declare const kATAcmdStandbyImmed: number;

declare const kATAcmdDoorUnlock: number;

declare const kATAcmdDoorLock: number;

declare const kATAcmdWriteDMA: number;

declare const kATAcmdSetRWMultiple: number;

declare const kATAcmdInitDrive: number;

declare const kATAcmdWriteExtended: number;

declare const kATAcmdWriteLong: number;

declare const kATAcmdWrite: number;

declare const kATAcmdRecal: number;

declare const kATAcmdNOP: number;

declare const kATAcmdWORetry: number;

declare const kID_DRIVE: number;

declare const mATADCRnIntEnable: number;

declare const mATADCRReset: number;

declare const mATADCROne: number;

declare const bATADCROne: number;

declare const mATAError: number;

declare const mATAIndex: number;

declare const bATAError: number;

declare const mATALBASelect: number;

declare const mATADriveSelect: number;

declare const mATAHeadNumber: number;

declare const mATAPIuseDMA: number;

declare const bATAPIuseDMA: number;

declare const mATAMediaChangeReq: number;

declare const mATAIDNotFound: number;

declare const mATAMediaChanged: number;

declare const bATAMediaChangeReq: number;

declare const bATAMediaChanged: number;

declare const bATABadBlock: number;

declare const kATADefaultSectorSize: number;

declare const IOBacklightDisplay: number;

declare const IODisplayConnect: number;

declare const kIODisplayNumPowerStates: number;

declare const gIODisplayFadeStyle: number;

declare const gIODisplayFadeTime2: number;

declare const gIODisplayFadeTime1: number;

declare const gIODisplayFadeStyleKey: interop.Pointer;

declare const gIODisplayFadeTime3Key: interop.Pointer;

declare const gIODisplayParametersFlushKey: interop.Pointer;

declare const gIODisplayParametersCommitKey: interop.Pointer;

declare const gIODisplayControllerIDKey: interop.Pointer;

declare const gIODisplayAudioProcessorModeKey: interop.Pointer;

declare const gIODisplayAudioBalanceLRKey: interop.Pointer;

declare const gIODisplayAudioBassKey: interop.Pointer;

declare const gIODisplayAudioTrebleKey: interop.Pointer;

declare const gIODisplayMicrophoneVolumeKey: interop.Pointer;

declare const gIODisplayFirmwareLevelKey: interop.Pointer;

declare const gIODisplayTechnologyTypeKey: interop.Pointer;

declare const gIODisplayParametersTheatreModeWindowKey: interop.Pointer;

declare const gIODisplayRedGammaScaleKey: interop.Pointer;

declare const gIODisplaySelectedColorModeKey: interop.Pointer;

declare const gIODisplayVideoBestKey: interop.Pointer;

declare const gIODisplayParallelogramKey: interop.Pointer;

declare const gIODisplayPincushionKey: interop.Pointer;

declare const gIODisplayTrapezoidKey: interop.Pointer;

declare const gIODisplayVerticalSizeKey: interop.Pointer;

declare const gIODisplayBrightnessKey: interop.Pointer;

declare const gIODisplayContrastKey: interop.Pointer;

declare const gIODisplayMinValueKey: interop.Pointer;

declare const gIODisplayGUIDKey: interop.Pointer;

declare const IOMultiMemoryDescriptor: number;

declare const IONVRAMController: number;

declare const IOGuardPageMemoryDescriptor: number;

declare const IOHIDElementContainer: number;

declare const IOHIDAsyncReportQueue: number;

declare const IOHIDElementPrivate: number;

declare const IOHIDConsumer: number;

declare const OSAction_IOHIDDevice__CompleteReport: number;

declare const OSAction_IOHIDDevice__CompleteReportMetaClass: number;

declare const OSAction_IOHIDDevice__CompleteReport_Class: OSClassLoadInformation;

declare const gOSAction_IOHIDDevice__CompleteReportMetaClass: interop.Pointer;

declare const IOHIDDeviceInterface: number;

declare const IOHIDDeviceMetaClass: number;

declare const IOHIDInterface: number;

declare const IOHIDInterfaceInterface: number;

declare const IOHIDInterfaceMetaClass: number;

declare const IOHIDInterface_Class: OSClassLoadInformation;

declare const IORTC: number;

declare const IOBluetoothHIDDriver: number;

declare const IOWorkQueue: number;

declare const IOBluetoothDevice: number;

declare const IOBluetoothL2CAPChannel: number;

declare const IOFireWireAVCNub: number;

declare const IOFireWireAVCSubUnit: number;

declare const gIOAVCUnitType: interop.Pointer;

declare const IOFireWireAVCCommand: number;

declare const IOFireWirePCRSpace: number;

declare const kFWAVCProducerMode_SEND: number;

declare const kFWAVCConsumerMode_LAST: number;

declare const kFWAVCConsumerMode_MORE: number;

declare const kFWAVCStateDeviceRemoved: number;

declare const kKeyMaskPeriod: number;

declare const kFWAVCStatePlugDisconnected: number;

declare const kFWAVCStatePlugReconnected: number;

declare const kFWAVCStateBusResumed: number;

declare const kFWAVCStateBusSuspended: number;

declare const kFWAVCAsyncPlug27: number;

declare const kFWAVCAsyncPlug24: number;

declare const kFWAVCAsyncPlug22: number;

declare const kFWAVCAsyncPlug19: number;

declare const kFWAVCAsyncPlug17: number;

declare const kFWAVCAsyncPlug16: number;

declare const kFWAVCAsyncPlug10: number;

declare const kFWAVCAsyncPlug9: number;

declare const kFWAVCAsyncPlug5: number;

declare const kFWAVCAsyncPlug4: number;

declare const IOTimeStampIntervalConstantFiltered: number;

declare const IOAudioSelectorControl: number;

declare const IOAudioClientBufferSet: number;

declare const IOAudioTimeIntervalFilterFIR: number;

declare const IOAudioTimeIntervalFilter: number;

declare const U128: number;

declare const IOAudioUserClient: number;

declare const IOAudioPort: number;

declare const IOAudioControl: number;

declare const IODMAController: number;

declare const IOCatalogue: number;

declare const IOUSBHostHIDDevice: number;

declare const kInterruptRetries: number;

declare const IOUSBInterface: number;

declare const IOUSBHostInterfaceInterface: number;

declare const IOUSBHostInterface_Class: OSClassLoadInformation;

declare const IOUSBDevice: number;

declare const AppleUSBDescriptorCache: number;

declare const AppleUSBHostPort: number;

declare const AppleUSBHostDeviceIdler: number;

declare const IOUSBHostDeviceInterface: number;

declare const gIOUSBHostDeviceMetaClass: interop.Pointer;

declare const kIOUSBHostPipeBundlingMax: number;

declare const IOUSBHostStream: number;

declare const IOUSBHostIOSource: number;

declare const AppleUSBRequestPool: number;

declare const AppleUSBHostController: number;

declare const IOUSBHostCITransferCompletionMessageData1TransferStructurePhase: number;

declare const IOUSBHostCITransferCompletionMessageData1TransferStructure: number;

declare const IOUSBHostCITransferCompletionMessageData0TransferLengthPhase: number;

declare const IOUSBHostCITransferCompletionMessageControlEndpointAddressPhase: number;

declare const IOUSBHostCITransferCompletionMessageControlEndpointAddress: number;

declare const IOUSBHostCITransferCompletionMessageControlDeviceAddressPhase: number;

declare const IOUSBHostCILinkData1TransferStructureAddress: number;

declare const IOUSBHostCIIsochronousTransferData0LengthPhase: number;

declare const IOUSBHostCIIsochronousTransferData0Length: number;

declare const IOUSBHostCIIsochronousTransferControlASAP: number;

declare const IOUSBHostCIIsochronousTransferControlFrameNumber: number;

declare const IOUSBHostCINormalTransferData1BufferPhase: number;

declare const IOUSBHostCINormalTransferData1Buffer: number;

declare const IOUSBHostCINormalTransferData0LengthPhase: number;

declare const IOUSBHostCINormalTransferData0Length: number;

declare const IOUSBHostCISetupTransferData1wLengthPhase: number;

declare const IOUSBHostCISetupTransferData1wLength: number;

declare const IOUSBHostCISetupTransferData1wIndex: number;

declare const IOUSBHostCISetupTransferData1wValuePhase: number;

declare const IOUSBHostCISetupTransferData1bRequest: number;

declare const IOUSBHostCIEndpointSetNextTransferCommandData1Address: number;

declare const IOUSBHostCIEndpointCreateCommandData1Descriptor: number;

declare const IOUSBHostCIDeviceUpdateCommandData1DescriptorAddress: number;

declare const IOUSBHostCIDeviceCreateCommandData1DeviceAddressPhase: number;

declare const IOUSBHostCIDeviceCreateCommandData0Route: number;

declare const IOUSBHostCIDeviceCreateCommandData0RootPortPhase: number;

declare const IOUSBHostCIDeviceCreateCommandData0RootPort: number;

declare const IOUSBHostCIPortStatusCommandData1ChangeMask: number;

declare const IOUSBHostCIPortStatusCommandData1LinkStateChange: number;

declare const IOUSBHostCIPortStatusCommandData1OvercurrentChange: number;

declare const IOUSBHostCIPortStatusCommandData1SpeedPhase: number;

declare const IOUSBHostCIPortStatusCommandData1LinkStatePhase: number;

declare const IOUSBHostCIPortStatusCommandData1LinkState: number;

declare const IOUSBHostCIPortStatusCommandData1Connected: number;

declare const IOUSBHostCIPortStatusCommandData1Powered: number;

declare const IOUSBHostCIPortEventMessageData0PortNumberPhase: number;

declare const IOUSBHostCICommandMessageData0EndpointAddressPhase: number;

declare const IOUSBHostCICommandMessageData0DeviceAddress: number;

declare const IOUSBHostCICommandMessageData0RootPort: number;

declare const IOUSBHostCICommandMessageControlStatus: number;

declare const IOUSBHostCIPortCapabilitiesMessageData0MaxPower: number;

declare const IOUSBHostCIPortCapabilitiesMessageControlConnectorTypePhase: number;

declare const IOUSBHostCIPortCapabilitiesMessageControlInternalConnector: number;

declare const IOUSBHostCIPortCapabilitiesMessageControlPortNumberPhase: number;

declare const IOUSBHostCICapabilitiesMessageData0CommandTimeoutThresholdPhase: number;

declare const IOUSBHostCICapabilitiesMessageControlPortCountPhase: number;

declare const IOUSBHostCIMessageControlNoResponse: number;

declare const IOUSBHostCIMessageControlStatusPhase: number;

declare const IOUSBHostCIDoorbellStreamID: number;

declare const IOUSBHostCIDoorbellEndpointAddress: number;

declare const IOUSBHostCIPortStatusLinkStateChange: number;

declare const IOUSBHostCIPortStatusLinkState: number;

declare const IOUSBHostCIPortStatusOvercurrent: number;

declare const kUSB3LPMExtraDeviceEL: number;

declare const kUSB3LPMMaxT3SEL: number;

declare const kUSB3LPMU1AcceptOnly: number;

declare const kUSB3LPMU1Disabled: number;

declare const kUSB3LPMMaxU1Timeout: number;

declare const kUSBHostDefaultControlNoDataTimeoutMS: number;

declare const kUSBHostClassRequestNoDataTimeout: number;

declare const kUSBHostStandardRequestSimpleCompletionTimeout: number;

declare const kUSBHostSetAddressTimeout: number;

declare const kUSBHostOpenOptionUserClientSession: number;

declare const kUSBHostVendorIDAppleComputer: number;

declare const kUSBHostMaxCountFullSpeedIsochronous: number;

declare const kUSBHostHubClass: number;

declare const kUSBHostVendorSpecificClass: number;

declare const kHubPort2PortExitLatencyNs: number;

declare const kInterfaceSuspendRemoteWakeEnable: number;

declare const kInterfaceSuspendLowPower: number;

declare const kInterfaceFeatureSelectorSuspend: number;

declare const kDeviceFeatureSelectorU2Enable: number;

declare const kDeviceFeatureSelectorTestMode: number;

declare const kDeviceFeatureSelectorRemoteWakeup: number;

declare const kDeviceStatusU2Enable: number;

declare const IOATAIOReg32: number;

declare const kDeviceStatusU1Enable: number;

declare const kDeviceStatusRemoteWakeEnable: number;

declare const kDeviceRequestSetSel: number;

declare const kDeviceRequestSynchFrame: number;

declare const kDeviceRequestSetConfiguration: number;

declare const kDeviceRequestGetConfiguration: number;

declare const kDeviceRequestGetDescriptor: number;

declare const kDeviceRequestSetAddress: number;

declare const kDeviceRequestClearFeature: number;

declare const kDeviceRequestRecipientDevice: number;

declare const kDeviceRequestRecipientPhase: number;

declare const kDeviceRequestRecipientMask: number;

declare const kDeviceRequestTypeVendor: number;

declare const kATAcmdWriteVerify: number;

declare const kDeviceRequestTypeMask: number;

declare const kDeviceRequestDirectionOut: number;

declare const kDeviceRequestDirectionMask: number;

declare const kSuperSpeedHubCharacteristicsReserved: number;

declare const kSuperSpeedHubCharacteristicsOverCurrentIndividual: number;

declare const kSuperSpeedHubCharacteristicsOverCurrentMask: number;

declare const kSuperSpeedHubCharacteristicsCompoundDevice: number;

declare const kSuperSpeedHubCharacteristicsPowerSwitchingGanged: number;

declare const kSuperSpeedHubCharacteristicsPowerSwitchingMask: number;

declare const kSuperSpeedEndpointCompanionDescriptorIsocReservedPhase: number;

declare const kSuperSpeedEndpointCompanionDescriptorIsocReserved: number;

declare const kSuperSpeedEndpointCompanionDescriptorIsocMult: number;

declare const kSuperSpeedEndpointCompanionDescriptorBulkMaxStreams: number;

declare const kSuperSpeedEndpointCompanionDescriptorMaxBurst: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkProtocolPhase: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkProtocol: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkDirectionTx: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkDirection: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSymmetric: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSymmetry: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkLSEKbits: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkLSEBits: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkLSE: number;

declare const kSuperSpeedPlusDeviceCapabilityMinTxLaneCount: number;

declare const kSuperSpeedPlusDeviceCapabilityReserved: number;

declare const kSuperSpeedDeviceCapabilitySupportHighSpeed: number;

declare const kHIDDispatchOptionDeliveryNotificationForce: number;

declare const kSuperSpeedDeviceCapabilitySupportFullSpeed: number;

declare const kSuperSpeedDeviceCapabilitySupportLowSpeed: number;

declare const kSuperSpeedDeviceCapability5Gb: number;

declare const kSuperSpeedDeviceCapabilityLowSpeed: number;

declare const kUSB20ExtensionCapabilityBESLDPhase: number;

declare const kUSB20ExtensionCapabilityBESLDValid: number;

declare const kUSB20ExtensionCapabilityBESLSupport: number;

declare const kUSB20ExtensionCapabilityLPM: number;

declare const kEndpointDescriptorReserved: number;

declare const kEndpointDescriptorPacketSizeMult: number;

declare const kEndpointDescriptorPacketSize: number;

declare const kEndpointDescriptorUsageTypeIsocReserved: number;

declare const kEndpointDescriptorUsageTypeInterruptPeriodic: number;

declare const kEndpointDescriptorUsageType: number;

declare const kEndpointDescriptorSynchronizationTypeSynchronous: number;

declare const kEndpointDescriptorSynchronizationTypeAsynchronous: number;

declare const kEndpointDescriptorSynchronizationTypeNone: number;

declare const kEndpointDescriptorTransferTypeInterrupt: number;

declare const kEndpointDescriptorTransferTypePhase: number;

declare const kEndpointDescriptorTransferType: number;

declare const kEndpointDescriptorDirectionOut: number;

declare const kEndpointDescriptorDirectionPhase: number;

declare const kEndpointDescriptorEndpointAddressReserved: number;

declare const kEndpointDescriptorNumber: number;

declare const kConfigurationDescriptorAttributeRemoteWakeCapable: number;

declare const IOInterleavedMemoryDescriptor: number;

declare const IONDRVFramebuffer: number;

declare const IODisplay: number;

declare const IOFramebufferUserClient: number;

declare const kFBDisplayUsablePowerState: number;

declare const kIOFBNotifyGroupID_Count: number;

declare const kIOFBNotifyGroupID_VendorAMD: number;

declare const kIOFBNotifyGroupID_VendorIntel: number;

declare const kIOFBNotifyGroupID_AppleGraphicsPowerManagement: number;

declare const kIOFBNotifyGroupID_AppleGraphicsDisplayPolicy: number;

declare const kIOFBNotifyGroupID_AppleGraphicsMUXControl: number;

declare const kIOFBNotifyGroupID_AppleGraphicsMGPUPowerControl: number;

declare const kIOFBNotifyGroupID_AppleGraphicsDevicePolicy: number;

declare const kIOFBNotifyGroupID_IODisplay: number;

declare const kIOFBNotifyEvent_Last: number;

declare const kIOFBNotifyEvent_HDACodecPowerOnOff: number;

declare const kIOFBNotifyEvent_VRAMReady: number;

declare const kIOFBNotifyEvent_Probed: number;

declare const kIOFBNotifyEvent_CaptureChange: number;

declare const kIOFBNotifyEvent_ChangeSpeed: number;

declare const kIOFBNotifyEvent_PowerOnOff: number;

declare const kIOFBNotifyEvent_DisplayModeChange: number;

declare const kIOFBNotifyEvent_None: number;

declare const kIOFBNotifyWSAAEnterDefer: number;

declare const kIOFBNotifyWillNotify: number;

declare const kIOFBNotifyDisplayDimsChange: number;

declare const kIOFBNotifyOnlineChange: number;

declare const kIOFBNotifyHDACodecWillPowerOff: number;

declare const kIOFBNotifyHDACodecDidPowerOn: number;

declare const kIOFBNotifyHDACodecWillPowerOn: number;

declare const kIOFBNotifyWillChangeSpeed: number;

declare const kIOFBNotifyWillWake: number;

declare const kIOFBNotifyDidWake: number;

declare const kIOFBNotifyDisplayModeDidChange: number;

declare const kIOFBNotifyDisplayModeWillChange: number;

declare const kEnabledInterruptState: number;

declare const kIODDCHigh: number;

declare const kFBOfflineInterruptServiceType: number;

declare const kFBConnectInterruptServiceType: number;

declare const kConnectInterruptServiceType: number;

declare const kFrameInterruptServiceType: number;

declare const clutType: number;

declare const kRegModifierMask: number;

declare const kRegIterDescendants: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkTypePhase: number;

declare const kRegIterChildren: number;

declare const kRegMaxPropertyNameLength: number;

declare const kRegPropertyNameTerminator: number;

declare const kRegPathNameSeparator: number;

declare const kTenMinutesInSeconds: number;

declare const kSecondsPerHour: number;

declare const IOPMPowerSourceList: number;

declare const OSAction_AFKUserDataPipe__HandleReport_Class: OSClassLoadInformation;

declare const IOPMPowerSource: number;

declare const IOBDBlockStorageDriver: number;

declare const IODVDBlockStorageDriver: number;

declare const IODVDBlockStorageDevice: number;

declare const AFKEndpointInterfaceMetaClass: number;

declare const IOCDBlockStorageDriver: number;

declare const IOUserClient2022: number;

declare const IOKitDiagnosticsClient: number;

declare const IOGatedOutputQueue: number;

declare const IOBasicOutputQueue: number;

declare const kIOReturnOutputDropped: number;

declare const kIOOutputCommandStall: number;

declare const kIOOutputCommandNone: number;

declare const kIOOutputStatusRetry: number;

declare const kIOOutputStatusDropped: number;

declare const IOFireWireAVCProtocolUserClient: number;

declare const kIOOutputStatusAccepted: number;

declare const IONetworkData: number;

declare const MBUF_CSUM_PSEUDO_HDR: number;

declare const MBUF_CSUM_DID_DATA: number;

declare const MBUF_CSUM_DID_IP: number;

declare const MBUF_CSUM_REQ_UDPIPV6: number;

declare const MBUF_CSUM_REQ_TCPIPV6: number;

declare const MBUF_CSUM_REQ_UDP: number;

declare const MBUF_TSO_IPV4: number;

declare const MBUF_TYPE_CONTROL: number;

declare const MBUF_TYPE_RIGHTS: number;

declare const MBUF_TYPE_SOOPTS: number;

declare const MBUF_TYPE_ATABLE: number;

declare const MBUF_TYPE_HTABLE: number;

declare const MBUF_TYPE_RTABLE: number;

declare const MBUF_FRAG: number;

declare const MBUF_BCAST: number;

declare const MBUF_EOR: number;

declare const IOKernelDebugger: number;

declare const AppleMacIO: number;

declare const AppleMacIODevice: number;

declare const gGetDefaultBusSpeedsKey: interop.Pointer;

declare const kMachineTypeUnknown: number;

declare const kChipSetTypeGossamer: number;

declare const kChipSetTypePowerSurge: number;

declare const kBootROMTypeNewWorld: number;

declare const badSelfIDsErr: number;

declare const invalidFWReferenceTypeErr: number;

declare const noListenerOrTalkerErr: number;

declare const channelActiveErr: number;

declare const multipleTalkerErr: number;

declare const alreadyRegisteredErr: number;

declare const invalidIDTypeErr: number;

declare const busReconfiguredErr: number;

declare const timeoutErr: number;

declare const IOFireWireLocalNodeAux: number;

declare const IONaturalMemoryCursor: number;

declare const IOFWSkipCycleDCL: number;

declare const IOFWReceiveDCL: number;

declare const kSCSIControllerNotificationBusReset: number;

declare const kSCSIParallelTaskControllerIDQueueHead: number;

declare const kFirstOrderRanking: number;

declare const kPeripheralDeviceTypeNoMatch: number;

declare const PassthruInterruptController: number;

declare const IOSharedInterruptController: number;

declare const IOSubMemoryDescriptor: number;

declare const kIOVideoDeviceMethodStartStream: number;

declare const kIOVideoDeviceMethodSetStreamFormat: number;

declare const kIOVideoDeviceMethodCloseStream: number;

declare const kIOVideoDeviceMethodGetMode: number;

declare const kIOVideoDeviceMethodClose: number;

declare const IOVideoStreamDictionary: number;

declare const IOVideoStreamFormatDictionary: number;

declare const IOStream: number;

declare const IOVideoStream: number;

declare const IOVideoControlDictionary: number;

declare const kIODTInterruptShared: number;

declare const kIODTRecursive: number;

declare const gIODTNWInterruptMappingKey: interop.Pointer;

declare const gIODTDefaultInterruptController: interop.Pointer;

declare const gIODTAAPLInterruptsKey: interop.Pointer;

declare const gIODTTargetTypeKey: interop.Pointer;

declare const gIODTCompatibleKey: interop.Pointer;

declare const gIODTPlane: interop.Pointer;

declare const IODTPlatformExpert: number;

declare const IOPlatformDevice: number;

declare const IOACPIPlatformDevice: number;

declare const PE_halt_restart: (p1: number) => number;

declare const kPEPanicDataSend: number;

declare const kPEPanicEnd: number;

declare const kPEPanicBegin: number;

declare const kPEPagingOff: number;

declare const kPEPanicSync: number;

declare const kPEUPSDelayHaltCPU: number;

declare const kPEHangCPU: number;

declare const kPERestartCPU: number;

declare const kIOACPIDevicePowerStateCount: number;

declare const kIOACPIDevicePowerStateD3: number;

declare const kIOACPIDevicePowerStateD2: number;

declare const kIOACPIAddressSpaceOpRead: number;

declare const kIOACPIAddressSpaceIDEmbeddedController: number;

declare const kIOACPIIORange: number;

declare const gIOACPIAddressKey: interop.Pointer;

declare const kErrorRecoveryInterval: number;

declare const gIOACPIHardwareIDKey: interop.Pointer;

declare const kIOPCIAdapterUnused: number;

declare const kIOPCIAdapterNotPresentPending: number;

declare const kIOPCIResourceTypeBusNumber: number;

declare const kIOPCIResourceTypeIO: number;

declare const AppleUSBHostBulkHIDDevice: number;

declare const kIOPCIResourceTypePrefetchMemory: number;

declare const kCheckLinkParents: number;

declare const IOPCIMessagedInterruptController: number;

declare const kIOPMSupportedOnUPS: number;

declare const kIOPMSupportedOnBatt: number;

declare const kIOPMSupportedOnAC: number;

declare const kPCICantSleep: number;

declare const kFrameBufferDeepSleepSupported: number;

declare const IOAGPDevice: number;

declare const kIOAGPStateEnablePending: number;

declare const kIOAGPStateEnabled: number;

declare const kIOAGPDisableFeature9: number;

declare const kIOAGPDisableFeature7: number;

declare const kIOAGPDisableUnaligned: number;

declare const kIOAGPDisablePCIWrites: number;

declare const kIOAGPDisablePCIReads: number;

declare const kFWAVCProducerMode_TOSS: number;

declare const kIOAGPDisablePageSpans: number;

declare const kIOAGPGartIdleInvalidate: number;

declare const kIOAGPAccessOutOfRange: number;

declare const kIOAGPDefaultStatus: number;

declare const kIOAGPEnable: number;

declare const kIOPCIConfigShadowPermanent: number;

declare const kIOPCIProbeOptionNeedsScan: number;

declare const kIOPCILatencySnooped: number;

declare const kIOPCIDevicePausedState: number;

declare const kIOPCIDeviceDozeState: number;

declare const kPCI2PCIUpperIORange: number;

declare const kPCI2PCIPrefetchUpperBase: number;

declare const kPCI2PCISubordinateBus: number;

declare const kIOPCI64BitMemorySpace: number;

declare const kIOPCI32BitMemorySpace: number;

declare const kIOPCIConfigSpace: number;

declare const kIOPCIExpressL1PMSubstatesCapability: number;

declare const kIOPCIExpressAccessControlServicesCapability: number;

declare const kIOPCIExpressPowerBudgetCapability: number;

declare const kIOPCIExpressErrorReportingCapability: number;

declare const kIOPCIFPBCapability: number;

declare const kIOPCIMSIXCapability: number;

declare const kIOPCIPCIExpressCapability: number;

declare const kIOPCIAGP8Capability: number;

declare const kIOPCIVendorSpecificCapability: number;

declare const kIOPCILDTCapability: number;

declare const kIOPCISlotIDCapability: number;

declare const kIOPCIPowerManagementCapability: number;

declare const kIOPCIConfigMaximumLatency: number;

declare const kIOPCIConfigInterruptPin: number;

declare const kIOPCIConfigSubSystemID: number;

declare const kIOPCIConfigCardBusCISPtr: number;

declare const kIOPCIConfigBaseAddress5: number;

declare const kIOPCIConfigBaseAddress4: number;

declare const kIOPCIConfigBaseAddress0: number;

declare const kIOPCIConfigCacheLineSize: number;

declare const kIOPCIConfigRevisionID: number;

declare const kIOPCIConfigCommand: number;

declare const IOPCIDeviceInterface: number;

declare const gIOPCIDeviceMetaClass: interop.Pointer;

declare const kIOPCICorrectableErrorBitCorrectedInternal: number;

declare const kIOPCICorrectableErrorBitAdvisoryNonFatal: number;

declare const kIOPCICorrectableErrorBitBadTLP: number;

declare const kIOPCICorrectableErrorBitReceiver: number;

declare const kIOPCIUncorrectableErrorBitMCBlockedTLP: number;

declare const kIOPCIUncorrectableErrorBitInternal: number;

declare const kIOPCIUncorrectableErrorBitUnexpectedCompletion: number;

declare const kIOPCIUncorrectableErrorBitCompleterAbort: number;

declare const kIOPCIUncorrectableErrorBitCompletionTimeout: number;

declare const kIOPCIUncorrectableErrorBitSurpriseDown: number;

declare const kIOPCIAERCapTLPPrefixLogDW2Offset: number;

declare const kIOPCIAERCapTLPPrefixLogDW0Offset: number;

declare const kIOPCIAERCapHdrLogDW3Offset: number;

declare const kIOPCIAERCapHdrLogDW2Offset: number;

declare const kIOPCIAERCapCapControlOffset: number;

declare const kIOPCIAERCapCorErrMaskOffset: number;

declare const kIOPCISlotStatusDataLinkLayerStateChanged: number;

declare const kIOPCISlotStatusPresenceDetectChanged: number;

declare const kIOPCISlotStatusMRLSensorChanged: number;

declare const kIOPCISlotCapabilitiesBitElectromechanicalInterlockPresent: number;

declare const kIOPCISlotCapabilitiesBitHotPlugCapable: number;

declare const kIOPCISlotCapabilitiesBitPowerIndicatorPresent: number;

declare const kIOPCISlotCapabilitiesBitAttentionIndicatorPresent: number;

declare const kIOPCISlotCapabilitiesBitPowerControllerPresent: number;

declare const kPCIPMCSPMEWakeReason: number;

declare const kPCIPMCSPMEDisableInS3: number;

declare const kEfiUnusableMemory: number;

declare const kPCIPMCSDefaultEnableBits: number;

declare const kPCIPMCSPowerStateD3: number;

declare const kPCIPMCSPMEEnable: number;

declare const kPCIPMCPMESupportFromD0: number;

declare const kPCIPMCPMESupportFromD1: number;

declare const kPCIPMCPMESupportFromD2: number;

declare const kPCIPMCPMESupportFromD3Cold: number;

declare const kPCI2PCIOffsetBridgeControl: number;

declare const kPCI2PCIOffsetSecondaryBus: number;

declare const kPCI2PCIOffsetPrimaryBus: number;

declare const kIOPCIStatusParityErrActive: number;

declare const kIOPCIStatusLeadAbortActive: number;

declare const kIOPCIStatusDevSel3: number;

declare const kIOPCIStatusDevSel2: number;

declare const kIOPCIStatusDevSel1: number;

declare const kIOPCIStatusCapabilities: number;

declare const kIOPCIStatusInterrupt: number;

declare const kIOPCICommandSERR: number;

declare const kIOPCICommandPaletteSnoop: number;

declare const kIOPCICommandBusMaster: number;

declare const kIOPCICommandBusLead: number;

declare const kIOPCIExpressCapabilityIDHierarchyID: number;

declare const kIOPCIExpressCapabilityIDVFResizableBAR: number;

declare const kIOPCIExpressCapabilityIDMPCIe: number;

declare const kIOPCIExpressCapabilityIDDPC: number;

declare const kIOPCIExpressCapabilityIDLNR: number;

declare const kIOPCIExpressCapabilityIDPMUX: number;

declare const kIOPCIExpressCapabilityIDSPCIe: number;

declare const kIOPCIExpressCapabilityIDTPHRequester: number;

declare const kIOPCIExpressCapabilityIDResizableBAR: number;

declare const kIOPCIExpressCapabilityIDAMD: number;

declare const kIOPCIExpressCapabilityIDPRI: number;

declare const kIOPCIExpressCapabilityIDAlternativeRoutingID: number;

declare const kIOPCIExpressCapabilityIDCAC: number;

declare const kIOPCIExpressCapabilityIDVSEC: number;

declare const kIOPCIExpressCapabilityIDRootComplexRegBlock: number;

declare const kIOPCIExpressCapabilityIDMFVC: number;

declare const kIOPCIExpressCapabilityIDDeviceSerialNumber: number;

declare const kIOPCICapabilityIDFPB: number;

declare const kIOPCICapabilityIDAF: number;

declare const kIOPCICapabilityIDSATAConfiguration: number;

declare const kIOPCICapabilityIDMSIX: number;

declare const kIOPCICapabilityIDSecure: number;

declare const kIOPCICapabilityIDAGP8: number;

declare const kIOPCICapabilityIDDebugPort: number;

declare const kIOPCICapabilityIDPCIX: number;

declare const kIOPCICapabilityIDSlotID: number;

declare const kIOPCICapabilityIDOffset: number;

declare const kIOPCIConfigurationOffsetMinimumGrant: number;

declare const kIOPCIConfigurationOffsetInterruptLine: number;

declare const kIOPCIConfigurationOffsetCardBusCISPtr: number;

declare const kIOPCIConfigurationOffsetBaseAddress0: number;

declare const kIOPCIConfigurationOffsetBIST: number;

declare const kIOPCIConfigurationOffsetHeaderType: number;

declare const kIOPCIConfigurationOffsetCacheLineSize: number;

declare const kIOPCIConfigurationOffsetClassCode: number;

declare const kIOPCIConfigurationOffsetDeviceID: number;

declare const kIOInterruptTypePCIMessaged: number;

declare const IOHIDPointingDevice: number;

declare const IODataQueue: number;

declare const IOHIDevice: number;

declare const kHIDOutputReport: number;

declare const IOHIKeyboardMapper: number;

declare const IOHIDKeyboardDevice: number;

declare const kModifier_Locked: number;

declare const kModifier_DidKeyUp: number;

declare const kModifier_DidPerformModifiy: number;

declare const kState_Mask: number;

declare const kState_On_ModifiersDown: number;

declare const kState_On: number;

declare const kState_ShiftActivates_Flag: number;

declare const kState_Disabled_Flag: number;

declare const IOHIKeyboard: number;

declare const kIOTimeOptionsContinuous: number;

declare const kIOTimerEventSourceOptionsPriorityUser: number;

declare const kIOTimerEventSourceOptionsPriorityHigh: number;

declare const kIOTimerEventSourceOptionsPriorityMask: number;

declare const IOFireWireLib: number;

declare const kFWExtendedTCodeWrapAdd: number;

declare const kFWExtendedTCodeBoundedAdd: number;

declare const kFWExtendedTCodeLittleAdd: number;

declare const kFWExtendedTCodeFetchAdd: number;

declare const kFWExtendedTCodeCompareSwap: number;

declare const kFWTCodeIsochronousBlock: number;

declare const kFWTCodeCycleStart: number;

declare const kFWTCodeReadBlock: number;

declare const kFWTCodeWriteBlock: number;

declare const kFWTCodeWriteQuadlet: number;

declare const kFWAsynchRCode: number;

declare const kFWAsynchAckSentPhase: number;

declare const kFWAsynchExtendedTCode: number;

declare const kFWAsynchDataLengthPhase: number;

declare const kFWAsynchDataLength: number;

declare const kFWAsynchDestinationOffsetLowPhase: number;

declare const kFWAsynchDestinationOffsetHigh: number;

declare const kFWAsynchSourceID: number;

declare const kFWAsynchDestinationIDPhase: number;

declare const kFWAsynchDestinationID: number;

declare const kFWAsynchPriority: number;

declare const kTIAsycnhRetryB: number;

declare const kFWAsynchRetryA: number;

declare const kFWAsynchRt: number;

declare const kFWAsynchTTotal: number;

declare const kFWSelfIDMore: number;

declare const kFWSelfIDNPhPhase: number;

declare const kFWSelfIDNPh: number;

declare const kFWSelfIDNPgPhase: number;

declare const kFWSelfIDNPg: number;

declare const kFWSelfIDNPbPhase: number;

declare const kFWSelfIDNNPhase: number;

declare const kFWSelfIDPacketType: number;

declare const kFWSelfID0P1Phase: number;

declare const kFWSelfID0P0: number;

declare const kFWSelfID0Del: number;

declare const kFWSelfID0SP: number;

declare const kFWSelfID0L: number;

declare const kFWSelfIDM: number;

declare const kFWSelfIDPhyIDPhase: number;

declare const kFWSelfIDBusPowered10W: number;

declare const kFWSelfIDBusPowered3W: number;

declare const kFWSelfIDNoPower: number;

declare const kFWSelfIDPortStatusNotConnected: number;

declare const kFWSelfIDPortStatusChild: number;

declare const kFWPhyConfigurationGapCntPhase: number;

declare const kFWPhyConfigurationGapCnt: number;

declare const kFWPhyConfigurationT: number;

declare const kFWSelfIDPacketID: number;

declare const kFWLinkOnPacketID: number;

declare const kMaxSelfIDs: number;

declare const kIOPCIConfigurationOffsetExpansionROMBase: number;

declare const kSelfIDPacketSize: number;

declare const kFWPhyPacketPhyIDPhase: number;

declare const kMaxWaitForValidSelfID: number;

declare const kHubDelayNs: number;

declare const IOFireWireUserClient: number;

declare const IOFireWireIRM: number;

declare const IOFWWorkLoop: number;

declare const IOFireWireLink: number;

declare const IOFWQEventSource: number;

declare const IOFireWireMultiIsochReceiveListener: number;

declare const IOFWPHYPacketListener: number;

declare const IOFireWireIRMAllocation: number;

declare const IOFireWireBusAux: number;

declare const IOFWDCLPool: number;

declare const IOFireWirePowerManager: number;

declare const IOLocalConfigDirectory: number;

declare const gFireWireModel_ID: interop.Pointer;

declare const gFireWireProduct_Name: interop.Pointer;

declare const gFireWireVendor_Name: interop.Pointer;

declare const gFireWire_GUID: interop.Pointer;

declare const gFireWireVendor_ID: interop.Pointer;

declare const gFireWireSpeed: interop.Pointer;

declare const gFireWireNodeID: interop.Pointer;

declare const gFireWireROM: interop.Pointer;

declare const kFWSBP2TargetReset: number;

declare const kFWSBP2AbortTask: number;

declare const kFWSBP2QueryLogins: number;

declare const IOFireWireSBP2ManagementORB: number;

declare const kFWSBP2UnsolicitedStatus: number;

declare const kFWSBP2NormalCommandTimeout: number;

declare const kFWSBP2ExclusiveLogin: number;

declare const kIOFWSBP2FailsOnAckBusy: number;

declare const IOFireWireSBP2Login: number;

declare const IOFireWireSBP2ORB: number;

declare const kFWSBP2MaxPageClusterSize: number;

declare const kFWSBP2CommandFixedSize: number;

declare const kFWSBP2CommandDummyORB: number;

declare const kFWSBP2CommandVendorORB: number;

declare const kFWSBP2CommandNormalORB: number;

declare const kFWSBP2CommandImmediate: number;

declare const kIOUserNotifyOptionCanDrop: number;

declare const kIOUCStructIStructO: number;

declare const kIOUCScalarIStructO: number;

declare const IOUSBHostCIPortCapabilitiesMessageControlConnectorType: number;

declare const IOEventSource: number;

declare const IOFWSimplePhysicalAddressSpace: number;

declare const IOFWPhysicalAddressSpace: number;

declare const kIODMAMapOptionIterateOnly: number;

declare const kIODMAMapOptionNoCacheStore: number;

declare const kIODMAMapOptionTypeMask: number;

declare const kIODMAMapOptionMapped: number;

declare const IOFWPseudoAddressSpaceAux: number;

declare const IOFireWireDevice: number;

declare const IOFWReadQuadCommand: number;

declare const IOFWAsyncCommand: number;

declare const IOFWUserWriteCommand: number;

declare const IOFWDelayCommand: number;

declare const IOCommand: number;

declare const IOFWAddressSpace: number;

declare const IOFireWireNub: number;

declare const IOSyncer: number;

declare const IOACPIPlatformExpert: number;

declare const kPEPanicDiagnosticsInProgress: number;

declare const kIOPCICommandFastBack2Back: number;

declare const kIOMemoryKernelUserShared: number;

declare const kIOMemoryUnshared: number;

declare const kIOMemoryHostPhysicallyContiguous: number;

declare const kIOMemoryPurgeable: number;

declare const kIOMemoryPageable: number;

declare const IOInterruptEventSource: number;

declare const gIOAllCPUInitializedKey: interop.Pointer;

declare const gIOExclaveAssignedKey: interop.Pointer;

declare const gIOMatchDeferKey: interop.Pointer;

declare const gIODriverKitUserClientEntitlementAllowThirdPartyUserClientsKey: interop.Pointer;

declare const gIODriverKitTestDriverEntitlementKey: interop.Pointer;

declare const gIOServiceDEXTEntitlementsKey: interop.Pointer;

declare const gIOUserClientEntitlementsKey: interop.Pointer;

declare const gIOBSDUnitKey: interop.Pointer;

declare const gIOBSDMajorKey: interop.Pointer;

declare const gIOBSDNameKey: interop.Pointer;

declare const gIOCompatibilityMatchKey: interop.Pointer;

declare const gIOUserServicePropertiesKey: interop.Pointer;

declare const gIOSupportedPropertiesKey: interop.Pointer;

declare const gIOInterruptControllersKey: interop.Pointer;

declare const gIOAppPowerStateInterest: interop.Pointer;

declare const gIOWillTerminateNotification: interop.Pointer;

declare const gIOFirstMatchNotification: interop.Pointer;

declare const gIOPublishNotification: interop.Pointer;

declare const gIOKitDebugKey: interop.Pointer;

declare const gIOUserServerPreserveUserspaceRebootKey: interop.Pointer;

declare const gIOAssociatedServicesKey: interop.Pointer;

declare const gIOUserClassesKey: interop.Pointer;

declare const gIODEXTMatchCountKey: interop.Pointer;

declare const gIORematchCountKey: interop.Pointer;

declare const gIOMatchedPersonalityKey: interop.Pointer;

declare const gIODefaultMatchCategoryKey: interop.Pointer;

declare const gIOMatchCategoryKey: interop.Pointer;

declare const gIOPropertyMatchKey: interop.Pointer;

declare const gIONameMatchKey: interop.Pointer;

declare const gIOProviderClassKey: interop.Pointer;

declare const kIOACPIAddressSpaceIDSystemMemory: number;

declare const gIOResourceMatchedKey: interop.Pointer;

declare const gIOResourceMatchKey: interop.Pointer;

declare const gIOPowerPlane: interop.Pointer;

declare const gIOServicePlane: interop.Pointer;

declare const kIOServiceFamilyOpenOptions: number;

declare const kIOServiceAsynchronous: number;

declare const kIOServiceSynchronous: number;

declare const gFireWireTDM: interop.Pointer;

declare const kIOServiceTerminate: number;

declare const kIOServiceExclusive: number;

declare const kIOServiceReservedMatchState: number;

declare const kIOServiceFirstPublishState: number;

declare const kIODefaultProbeScore: number;

declare const kIOReportQuantityPacketCount: number;

declare const kIOReportQuantityCapacitance: number;

declare const kIOReportQuantityVoltage: number;

declare const kIOReportQuantityEnergy: number;

declare const kIOReportQuantityPower: number;

declare const kIOReportQuantityTime: number;

declare const kIOReportQuantityUndefined: number;

declare const kIOReportTraceChannelData: number;

declare const kIOReportCopyChannelData: number;

declare const kIOReportTraceOnChange: number;

declare const kIOReportEnable: number;

declare const kIOReportFormatSimpleArray: number;

declare const kIOReportFormatState: number;

declare const kIOReportInvalidFormat: number;

declare const IOTimerEventSource: number;

declare const IOCommandGate: number;

declare const kIOTrackingInvalid: number;

declare const kIOTrackingSetMinCaptureSize: number;

declare const kIOTrackingStopCapture: number;

declare const kIOTrackingResetTracking: number;

declare const kIOTrackingGetMappings: number;

declare const gIOTrackingLeakScanCallback: (p1: number) => void;

declare const gIODKDebug: number;

declare const kIODKDisableCheckInTokenVerification: number;

declare const kIODKDisableDextTag: number;

declare const kIODKDisableDextLaunch: number;

declare const kIODKLogMessages: number;

declare const kIODKLogPM: number;

declare const kIODKLogSetup: number;

declare const kIOTraceIOService: number;

declare const kIOTraceCommandGates: number;

declare const kIOTraceIntEventSource: number;

declare const kIOTraceEventSources: number;

declare const kIOTraceWorkLoops: number;

declare const kIOKitDebugUserOptions: number;

declare const _kIODebugTopFlag: number;

declare const kIOTrackingBoot: number;

declare const kIOWaitQuietBeforeRoot: number;

declare const kIOTracking: number;

declare const kIONoFreeObjects: number;

declare const kIOLogPMRootDomain: number;

declare const kIOLogDTree: number;

declare const kIOLogTracePower: number;

declare const kIOLogMapping: number;

declare const kIOLogYield: number;

declare const kIOLogConfig: number;

declare const kIOLogRegister: number;

declare const kIOLogStart: number;

declare const kIOLogProbe: number;

declare const kIOLogAttach: number;

declare const IONotifier: number;

declare const iokit_iomd_setownership_enabled: boolean;

declare const kIOPreparationIDUnprepared: number;

declare const kIOMapperUncached: number;

declare const kIODMAMapIdentityMap: number;

declare const kIODMAMapDeviceMemory: number;

declare const kIODMAMapPhysicallyContiguous: number;

declare const kIODMAMapReadAccess: number;

declare const kIOMemoryClearEncrypted: number;

declare const kIOMemoryIncoherentIOStore: number;

declare const kIOMemoryPurgeableVolatileGroup7: number;

declare const kIOMemoryPurgeableVolatileGroup6: number;

declare const kIOMemoryPurgeableVolatileGroup5: number;

declare const kIOMemoryPurgeableVolatileGroup1: number;

declare const kIOMemoryPurgeableEmpty: number;

declare const kIOMemoryPurgeableNonVolatile: number;

declare const kIOMemoryClearEncrypt: number;

declare const kIOMemoryThreadSafe: number;

declare const kIOMemoryRemote: number;

declare const kIOMemoryPersistent: number;

declare const kIOMemoryHostOnly: number;

declare const kIOMemoryMapperNone: number;

declare const kIOMemoryTypeMask: number;

declare const kIOMemoryTypeVirtual64: number;

declare const kIOMemoryTypePersistentMD: number;

declare const kIOMemoryTypeVirtual: number;

declare const kIOMemoryDirectionMask: number;

declare const kIODirectionPrepareNoFault: number;

declare const kIODirectionInOut: number;

declare const IODisplayParameterHandler: number;

declare const kIODirectionOutIn: number;

declare const _IOMemoryDescriptorMixedData: number;

declare const kIOPCISlotStatusPresenceDetectState: number;

declare const IORegistryIterator: number;

declare const IORegistryPlane: number;

declare const IORegistryEntry: number;

declare const gIORegistryEntryAllowableSetPropertiesKey: interop.Pointer;

declare const gIORegistryEntryIDKey: interop.Pointer;

declare const gIOLocationKey: interop.Pointer;

declare const gIONameKey: interop.Pointer;

declare const kIOUnserializeEditorOnAllCollections: number;

declare const kIOUnserializeEditorOnArrays: number;

declare const kIOUnserializeEditorOnDictionaries: number;

declare const kIOSerializeUniqueAll: number;

declare const kIOSerializeUniqueDisable: number;

declare const OSIterator: number;

declare const kOSStringNoCopy: number;

declare const kOFVariablePermUserWrite: number;

declare const kOFVariablePermRootOnly: number;

declare const IOConditionLock: number;

declare const IOLockGroup: interop.Pointer;

declare const phy_write_panic: number;

declare const phy_read_panic: number;

declare const OSSymbol: number;

declare const OSString: number;

declare const OSMetaClass: number;

declare const CONSISTENT_DEBUG_VERSION_VAL: number;

declare const CONSISTENT_DEBUG_MAGIC_VAL: number;

declare const CONSISTENT_DEBUG_PANIC_SOURCE_SPTM: number;

declare const CONSISTENT_DEBUG_PANIC_LEN: number;

declare const DEBUG_HEADER_ENTRY_SPTM: number;

declare const DEBUG_HEADER_MAGIC_VAL: number;

declare const kSMEPredicateCount: number;

declare const kIOPCIHotplugCapability: number;

declare const kSMEMaxPredicateSize: number;

declare const kSMEMaxVectorSize: number;

declare const SPTM_VARIANT_DEVELOPMENT: number;

declare const random_seed_length: number;

declare const EXEC_MODE_XNU_USER_TPRO_RW_TINDEX: number;

declare const EXEC_MODE_XNU_USER_DEFAULT_TINDEX: number;

declare const SPTM_TABLE_NOT_PRESENT: number;

declare const SPTM_MAP_FLUSH_PENDING: number;

declare const SPTM_MAP_VALID: number;

declare const SPTM_SUCCESS: number;

declare const SPTM_N_PUBLIC_VIOLATIONS: number;

declare const kAirshipDaleBasebandErrorPCILinkBWNotification: number;

declare const kAirshipDaleBasebandErrorPCILinkResumeFail: number;

declare const kAirshipDaleBasebandErrorPCICplTimeout: number;

declare const kAirshipDaleBasebandErrorPCIAER: number;

declare const kAirshipDaleBasebandErrorPortEnableFailure: number;

declare const kAirshipDaleBasebandDevicePowerOnTimedOut: number;

declare const kAirshipDaleBasebandErrorRxGetCompletionFailure: number;

declare const kAirshipDaleBasebandErrorTxGetCompletionFailure: number;

declare const kAirshipDaleBasebandErrorRxEnqueueFailure: number;

declare const kAirshipDaleBasebandErrorRxConsumeFailure: number;

declare const kAirshipDaleBasebandErrorCCCIInvalidMessage: number;

declare const kAirshipDaleBasebandErrorCCCIHandshakeTimeout: number;

declare const kAirshipDaleBasebandErrorInvalidBootStage: number;

declare const kDALEIPCBBTimeDomainNetwork: number;

declare const kDALEIPCBBTimeDomainGNSS: number;

declare const kAirshipDaleBasebandControlInterfaceErrorMsg: number;

declare const kAirshipDaleBasebandTraceUserClientMax: number;

declare const kAirshipDaleBasebandTraceUserClientClose: number;

declare const kAirshipDaleBasebandControlInterfaceUserClientMax: number;

declare const kAirshipDaleBasebandControlInterfaceUserClientGetDeviceTimeAsync: number;

declare const kAirshipDaleBasebandControlInterfaceUserClientWriteAsync: number;

declare const kAirshipDaleBasebandControlInterfaceUserClientWrite: number;

declare const msqids: interop.Pointer;

declare const kAirshipDaleBasebandControlInterfaceUserClientRead: number;

declare const kAirshipDaleBasebandControlInterfaceUserClientOpen: number;

declare const kAirshipDaleBasebandControlUserClientOpen: number;

declare const dot3ChipSetWesternDigital83C790: number;

declare const dot3ChipSetDigitalDC21142: number;

declare const dot3ChipSetDigitalDC21140A: number;

declare const dot3ChipSetFujitsu86950: number;

declare const dot3ChipSetNationalSonic: number;

declare const dot3ChipSetAMD7990: number;

declare const IFNET_THROTTLE_OPPORTUNISTIC: number;

declare const IFNET_THROTTLE_OFF: number;

declare const IFNET_NPM_THRESH_GENERAL: number;

declare const IFNET_NPM_THRESH_NEAR: number;

declare const IFNET_SCHED_MODEL_FQ_CODEL_NEW_DM: number;

declare const IFNET_SCHED_MODEL_FQ_CODEL_NEW: number;

declare const IFNET_SCHED_MODEL_FQ_CODEL: number;

declare const IFNET_LQM_THRESH_POOR: number;

declare const IFNET_LQM_THRESH_ABORT: number;

declare const IFNET_WAKE_ON_MAGIC_PACKET: number;

declare const IFNET_RX_CSUM: number;

declare const IFNET_LRO: number;

declare const IFNET_SW_TIMESTAMP: number;

declare const IFNET_HW_TIMESTAMP: number;

declare const IFNET_TSO_IPV6: number;

declare const IFNET_TSO_IPV4: number;

declare const IFNET_IPV6_FRAGMENT: number;

declare const IFNET_CSUM_UDPIPV6: number;

declare const IFNET_CSUM_TCPIPV6: number;

declare const IFNET_IP_FRAGMENT: number;

declare const IFNET_CSUM_FRAGMENT: number;

declare const IFNET_CSUM_TCP: number;

declare const BPF_MODE_OUTPUT: number;

declare const BPF_MODE_INPUT: number;

declare const IFNET_FAMILY_IPSEC: number;

declare const IFNET_FAMILY_UTUN: number;

declare const IFNET_FAMILY_UNUSED_16: number;

declare const IFNET_FAMILY_FAITH: number;

declare const IFNET_FAMILY_PPP: number;

declare const IFNET_FAMILY_VLAN: number;

declare const IFNET_FAMILY_LOOPBACK: number;

declare const hv_disable: number;

declare const kpc_threads_counting: number;

declare const mach_absolutetime_last_sleep: number;

declare const kext_assertions_enable: number;

declare const kHV_ION_EXIT_FULL: number;

declare const current_task: number;

declare const oop_jit_conversion: unknown /* const array */;

declare const CS_LINKAGE_APPLICATION_OOPJIT_TOTAL: number;

declare const CS_LINKAGE_APPLICATION_OOPJIT_INVALID: number;

declare const CS_LINKAGE_APPLICATION_OOPJIT: number;

declare const CS_LINKAGE_APPLICATION_XOJIT: number;

declare const CS_LINKAGE_APPLICATION_ROSETTA: number;

declare const CS_LINKAGE_APPLICATION_INVALID: number;

declare const CS_VALIDATION_CATEGORY_NONE: number;

declare const CS_VALIDATION_CATEGORY_OOPJIT: number;

declare const CS_VALIDATION_CATEGORY_LOCAL_SIGNING: number;

declare const CS_VALIDATION_CATEGORY_DEVELOPER_ID: number;

declare const CS_VALIDATION_CATEGORY_ENTERPRISE: number;

declare const CS_SIGNER_TYPE_OOPJIT: number;

declare const CS_SUPPL_SIGNER_TYPE_LOCAL: number;

declare const CS_SUPPL_SIGNER_TYPE_TRUSTCACHE: number;

declare const CS_SUPPL_SIGNER_TYPE_UNKNOWN: number;

declare const CS_SIGNER_TYPE_LEGACYVPN: number;

declare const CS_SIGNER_TYPE_UNKNOWN: number;

declare const CS_HASH_MIN_SIZE: number;

declare const kIOPCIConfigAGPStatusOffset: number;

declare const CS_CDHASH_LEN: number;

declare const CS_HASHTYPE_SHA384: number;

declare const CS_HASHTYPE_SHA256: number;

declare const CSTYPE_INDEX_ENTITLEMENTS: number;

declare const CSTYPE_INDEX_REQUIREMENTS: number;

declare const CSSLOT_SIGNATURESLOT2: number;

declare const CSSLOT_IDENTIFICATIONSLOT: number;

declare const CSSLOT_SIGNATURESLOT: number;

declare const kAirshipDaleBasebandTraceUserClientGetTraceInfo: number;

declare const CSSLOT_ALTERNATE_CODEDIRECTORY_MAX: number;

declare const CSSLOT_LIBRARY_CONSTRAINT: number;

declare const CSSLOT_DER_ENTITLEMENTS: number;

declare const CSSLOT_ENTITLEMENTS: number;

declare const CSSLOT_RESOURCEDIR: number;

declare const CSSLOT_REQUIREMENTS: number;

declare const CSSLOT_INFOSLOT: number;

declare const CSSLOT_CODEDIRECTORY: number;

declare const CS_SUPPORTSRUNTIME: number;

declare const CSMAGIC_BLOBWRAPPER: number;

declare const CSMAGIC_DETACHED_SIGNATURE: number;

declare const CSMAGIC_EMBEDDED_SIGNATURE_OLD: number;

declare const CSMAGIC_EMBEDDED_SIGNATURE: number;

declare const CSMAGIC_CODEDIRECTORY: number;

declare const CSMAGIC_REQUIREMENT: number;

declare const kIOPCIAERCapCapHeaderOffset: number;

declare const IOHIDElement: number;

declare const IOUSBHostCITransferCompletionMessageControlStatus: number;

declare const kAirshipDaleBasebandErrorTxConsumeFailure: number;

declare const kFBOnlineInterruptServiceType: number;

declare const kIOPCICapabilityIDAGP: number;

declare const IOUSBHostInterfaceMetaClass: number;

declare const kPCI2PCIPrefetchUpperLimit: number;

declare const kIOPCISlotStatusAttentionButtonPressed: number;

declare const kIOPCIStatusFastBack2Back: number;

declare const kIOPCIAERCapRootErrStatusOffset: number;

declare const kATAcmdWriteDMAExtended: number;

declare const kIOPCICommandAddressStepping: number;

declare const kUSB3LPMMaxU2SEL: number;

declare const UCInfo: number;

declare const kSuperSpeedEndpointCompanionDescriptorBulkMaxStreamsPhase: number;

declare const kIODMAMapOptionOnChip: number;

declare const IOHIPointing: number;

declare const IOMapper: number;

declare const MTF_RIGHTS: number;

declare const kDeviceRequestGetInterface: number;

declare const CS_SHA256_TRUNCATED_LEN: number;

declare const kHBLInterruptServiceType: number;

declare const kIOPCIStatusDevSel0: number;

declare const IOAccelerator: number;

declare const AppleUSBHostRequestCompleter: number;

declare const catch_exc_subsystem: catch_exc_subsystem;

declare const kCheckLinkForPower: number;

declare const kPCI2PCIPrimaryBus: number;

declare const kIOPCIExpressCapabilityIDPrecisionTimeManagement: number;

declare const CS_SHA384_LEN: number;

declare const kFWIsochChannelNotEnoughBandwidth: number;

declare const kConfigurationDescriptorAttributeSelfPowered: number;

declare const MTF_FREE: number;

declare const kSuperSpeedDeviceCapabilityFullSpeed: number;

declare const kIOVideoDeviceMethodStopStream: number;

declare const MBUF_TYPE_SONAME: number;

declare const gOSAction_IOHIDEventService__SetLEDMetaClass: interop.Pointer;

declare const kFWAVCAsyncPlug0: number;

declare const kHIDDispatchOptionPointerAbsolutToRelative: number;

declare const kIOTrackingStartCapture: number;

declare const kPCIPMCSPowerStateD0: number;

declare const gIOFirstPublishNotification: interop.Pointer;

declare const doubleagent_subsystem: doubleagent_subsystem;

declare const kSecondOrderRanking: number;

declare const gIOGeneralInterest: interop.Pointer;

declare const IOFWUserPHYPacketListener: number;

declare const kIOPCIStatusTargetAbortActive: number;

declare const kIOPCIExpressCapabilityIDL1PMSubstates: number;

declare const MBUF_TYPE_FREE: number;

declare const kPEPanicRestartCPUNoCallouts: number;

declare const catch_mach_exc_subsystem: catch_mach_exc_subsystem;

declare const gIODisplayFadeTime2Key: interop.Pointer;

declare const MTF_RTABLE: number;

declare const kIOVideoDeviceMethodOpenStream: number;

declare const kIOPCIExpressDeviceSerialNumberCapability: number;

declare const kFWSelfIDNPf: number;

declare const OSOffset: number;

declare const IOStreamUserClient: number;

declare const kIOPCIMSICapability: number;

declare const IOMbufNaturalMemoryCursor: number;

declare const ecc_panic_physical_address: number;

declare const kIOPCIExpressCapabilityIDRCECEndpointAssociation: number;

declare const IFNET_FAMILY_ETHERNET: number;

declare const kDeviceStatusLTMEnable: number;

declare const kIOFBNotifyPriority_Max: number;

declare const MBUF_TYPE_SOCKET: number;

declare const IFNET_SCHED_MODEL_NORMAL: number;

declare const IOGraphicsDevice: number;

declare const kFWAVCAsyncPlug26: number;

declare const mATAWriteFault: number;

declare const osversion: interop.Pointer;

declare const OSAction_AFKUserDataPipe__HandleReportMetaClass: number;

declare const kEndpointFeatureSelectorStall: number;

declare const kUSB20ExtensionCapabilityBESLValid: number;

declare const kIOPCIConfigBIST: number;

declare const sock_data_filt_flag_oob: number;

declare const kIOPCIConfigurationOffsetRevisionID: number;

declare const kAirshipDaleBasebandErrorDevicePowerOffTimedOut: number;

declare const IFNET_CSUM_IP: number;

declare const IOUSBHostCIMessageControlType: number;

declare const kFWConfigurationPacketID: number;

declare const static_if_modified_keys: interop.Pointer;

declare const gIOUserServerNameKey: interop.Pointer;

declare const kDeviceRequestGetStatus: number;

declare const kIOFBNotifyEvent_SleepWake: number;

declare const kIOPCIDeviceOnState: number;

declare const kOSLogRegistryMods: number;

declare const kSuperSpeedHubDelayMax: number;

declare const kPACKET: number;

declare const gIODriverKitEntitlementKey: interop.Pointer;

declare const IOUSBHostDevice_Class: OSClassLoadInformation;

declare const kIOPCIExpressCapabilityIDLatencyTolerenceReporting: number;

declare const IOBlockStorageDriver: number;

declare const IOUSBHostPipe: number;

declare const EventElementCollection: number;

declare const kIOPCICPCIHotswapCapability: number;

declare const ApplePlatformExpert: number;

declare const kIOKitDiagnosticsClientType: number;

declare const kIOFBNotifyDidSleep: number;

declare const kFWSelfIDPortStatusParent: number;

declare const kAirshipDaleBasebandErrorMax: number;

declare const SPTM_MAP_CODESIGN_ERROR: number;

declare const gIOOpenInterest: interop.Pointer;

declare const IOFramebuffer: number;

declare const SPTM_CORE_FILE_REGION_MAX_NAME_LEN: number;

declare const IOAudioToggleControl: number;

declare const kIOFBNotifyVRAMReady: number;

declare const kIOMemoryBufferPageable: number;

declare const kIOPCIConfigAGPCommandOffset: number;

declare const OSDictionary: number;

declare const debug_ivars_size: number;

declare const kIOPCIConfigVendorID: number;

declare const kAirshipDaleBasebandErrorPCIBadRequest: number;

declare const kPCI2PCIOffsetUpperIORange: number;

declare const kFWPacketTCodePhase: number;

declare const gIOACPIPlane: interop.Pointer;

declare const kIOServiceTerminateWithRematch: number;

declare const kAirshipDaleBasebandControlUserClientMax: number;

declare const kATAcmdReadLong: number;

declare const IOSharedDataQueue: number;

declare const kIOExtensiblePaniclogOptionsNone: number;

declare const IFNET_FAMILY_GIF: number;

declare const IOUSBHostCISetupTransferData1bmRequestType: number;

declare const IFNET_CSUM_UDP: number;

declare const IFNET_LQM_THRESH_UNKNOWN: number;

declare const IOUserServerCheckInToken: number;

declare const EXEC_MODE_XNU_DEFAULT_TINDEX: number;

declare const kIOPCIUncorrectableErrorBitPoisonedTLP: number;

declare const gIODisplayManufacturerSpecificKey: interop.Pointer;

declare const gIODisplayPowerStateKey: interop.Pointer;

declare const kPCIPMCPMESupportFromD3Hot: number;

declare const IOFireWireDeviceAux: number;

declare const kIOPCIDevicePowerStateCount: number;

declare const kIOMemoryMapCopyOnWrite: number;

declare const kIOFBNotifyWillPowerOff: number;

declare const kIOPCIExpressCapabilityIDVirtualChannel: number;

declare const BPF_MODE_DISABLED: number;

declare const IOUSBHostCILinkData1TransferStructureAddressPhase: number;

declare const IOMemoryCursor: number;

declare const kIOFBNotifyGroupID_AppleGraphicsControl: number;

declare const CONSISTENT_DEBUG_PANIC_SOURCE_SK: number;

declare const IOFWAddressSpaceAux: number;

declare const kATAcmdSeek: number;

declare const kIOStatistics: number;

declare const OSAction_AFKUserDataPipe__HandleResponse: number;

declare const SPTM_VARIANT_RELEASE: number;

declare const kEndpointDescriptorDirectionIn: number;

declare const OSAction_AFKUserDataPipe__HandleReport: number;

declare const kSuperSpeedDeviceCapabilityLTM: number;

declare const bin2bcd_data: interop.Pointer;

declare const gIORematchPersonalityKey: interop.Pointer;

declare const kSCSIPort_StatusOffline: number;

declare const IFNET_FAMILY_CELLULAR: number;

declare const kATAcmdReadDMA: number;

declare const kIOTrackingGetTracking: number;

declare const kAirshipDaleBasebandErrorPCILinkDown: number;

declare const DEBUG_HEADER_ENTRY_TXM: number;

declare const kFWPhyPacketIDPhase: number;

declare const kFWTCodeLock: number;

declare const IFNET_FAMILY_ANY: number;

declare const kFWTCodePHYPacket: number;

declare const IOFWAsyncStreamReceivePort: number;

declare const MBUF_LOOP: number;

declare const kIOPCICorrectableErrorBitReplayTimerTimeout: number;

declare const debug_malloc_size: number;

declare const kAirshipDaleBasebandErrorTxEnqueueFailure: number;

declare const kATAcmdMediaEject: number;

declare const mATABadBlock: number;

declare const kFWSelfIDNPd: number;

declare const gIONameMatchedKey: interop.Pointer;

declare const kIOFBNotifyGroupID_Legacy: number;

declare const kFWSBP2AbortTaskSet: number;

declare const mATASeekComplete: number;

declare const kSuperSpeedEndpointCompanionDescriptorBulkReservedPhase: number;

declare const gIODTBridgeModelKey: interop.Pointer;

declare const kAirshipDaleBasebandControlUserClientClose: number;

declare const nfs_ticks: number;

declare const kFWAsynchSpd: number;

declare const kIOFBNotifyProbed: number;

declare const kFWAsynchDestinationOffsetLow: number;

declare const gIODeviceMemoryKey: interop.Pointer;

declare const kIOACPIAddressSpaceIDPCIConfiguration: number;

declare const kFWAsynchSpdPhase: number;

declare const kIOMemoryTypeUIO: number;

declare const IFNET_NPM_THRESH_FAR: number;

declare const kIOMemoryLedgerTagMedia: number;

declare const kOFVariablePermKernelOnly: number;

declare const bATAUncorrectable: number;

declare const kFWSelfIDPortStatusNotPresent: number;

declare const IFNET_FAMILY_MDECAP: number;

declare const kRegIterSubTrees: number;

declare const gIODisplayGreenGammaScaleKey: interop.Pointer;

declare const IOFWSimpleContiguousPhysicalAddressSpace: number;

declare const kIOPCIExpressCapabilityIDMRIOV: number;

declare const kKeyMaskCtrl: number;

declare const kATAcmdDriveIdentify: number;

declare const kAirshipDaleBasebandTraceUserClientOpen: number;

declare const CSSLOT_LAUNCH_CONSTRAINT_RESPONSIBLE: number;

declare const hv_support_available: number;

declare const kIOPCICPCIResourceControlCapability: number;

declare const kIOPCIExpressCapabilityIDAlternateProtocol: number;

declare const IOUSBHostCISetupTransferData1bmRequestTypePhase: number;

declare const kIOReportFormatSimple: number;

declare const kIOAGP4xDataRate: number;

declare const kFWSBP2DontSynchronizeMgmtAgent: number;

declare const kIOAGP1xDataRate: number;

declare const kIOPCISecureCapability: number;

declare const CS_HASHTYPE_SHA256_TRUNCATED: number;

declare const IOFireWireUnit: number;

declare const MTF_DATA: number;

declare const gIOCompatibilityPropertiesKey: interop.Pointer;

declare const kIOFBNotifyWillSleep: number;

declare const MTF_OOBDATA: number;

declare const CSSLOT_ALTERNATE_CODEDIRECTORIES: number;

declare const kDeviceFeatureSelectorLTMEnable: number;

declare const kIOPCICorrectableErrorBitBadDLLP: number;

declare const kHIDDispatchOptionPointerAffixToScreen: number;

declare const IOFWUserReadQuadletCommand: number;

declare const mATASectorSize: number;

declare const gIODisplayMCCSVersionKey: interop.Pointer;

declare const kUSBHostClassRequestCompletionTimeout: number;

declare const kFWAVCAsyncPlug18: number;

declare const kHV_ION_ANY_SIZE: number;

declare const kIOPCICommandMemWrInvalidate: number;

declare const IOUSBHostCIDoorbellEndpointAddressPhase: number;

declare const kFWAsynchSourceIDPhase: number;

declare const kIOReturnOutputStall: number;

declare const AVCCommandHandlerInfo: number;

declare const gIOACPIUniqueIDKey: interop.Pointer;

declare const gIODriverKitUserClientEntitlementsKey: interop.Pointer;

declare const kFBDisplayPowerStateMask: number;

declare const kIOACPIBusNumberRange: number;

declare const kIOPCIConfigurationOffsetMaximumLatency: number;

declare const IFNET_VLAN_TAGGING: number;

declare const kATAcmdFlushCache: number;

declare const kATAEnableAPM: number;

declare const kEndpointDescriptorReservedPhase: number;

declare const kSuperSpeedEndpointCompanionDescriptorBulkReserved: number;

declare const kFWSelfID0P2Phase: number;

declare const kFWSelfID0SPPhase: number;

declare const gIOBusyInterest: interop.Pointer;

declare const kSuccess: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedAttrCountPhase: number;

declare const kRegPropertyValueIsSavedToNVRAM: number;

declare const kEndpointDescriptorSynchronizationTypeAdaptive: number;

declare const kFWSBP2NormalCommandReset: number;

declare const kUSB20ExtensionCapabilityBESLPhase: number;

declare const IOFWPseudoAddressSpace: number;

declare const kRootDomainSleepNotSupported: number;

declare const kFWIsochChannelChannelNotAvailable: number;

declare const kIOExternalMethodArgumentsCurrentVersion: number;

declare const kIOVideoDeviceMethodSetMode: number;

declare const kIOFWAVCAsyncCmdFreed: number;

declare const kIOPCIStatusTargetAbortCapable: number;

declare const kKUNCOtherResponse: number;

declare const kIOTracePowerMgmt: number;

declare const kFWSBP2LogicalUnitReset: number;

declare const gIODisplayMaxValueKey: interop.Pointer;

declare const IOUSBHostCISetupTransferData1bRequestPhase: number;

declare const kIOFBNotifyEvent_All: number;

declare const IOFWSyncer: number;

declare const CSMAGIC_EMBEDDED_LAUNCH_CONSTRAINT: number;

declare const kIOACPIAddressSpaceIDSMBus: number;

declare const kIOMemoryPurgeableVolatile: number;

declare const kIOPCICapabilityIDEnhancedAllocation: number;

declare const kIOPCIConfigExpansionROMBase: number;

declare const kFWSelfIDSelfPowered15W: number;

declare const kFWSelfIDBusPowered1W: number;

declare const kIOPCIConfigurationOffsetBaseAddress1: number;

declare const kPingResponseTimeNs: number;

declare const kHIDFeatureReport: number;

declare const kIOPCIExpressCapabilityIDATS: number;

declare const kSuperSpeedDeviceCapabilityHighSpeed: number;

declare const cablePowerInsufficientErr: number;

declare const IOUSBHostCICapabilitiesMessageData0ConnectionLatencyPhase: number;

declare const CS_SUPPORTSSCATTER: number;

declare const kKeyMaskLeftCommand: number;

declare const kIOPCIIOSpace: number;

declare const DYLD_CHAINED_IMPORT_ADDEND64: number;

declare const MBUF_TYPE_FTABLE: number;

declare const kIOFBNotifyPriority_Min: number;

declare const kIOPCIExpressCapabilityIDDVSEC: number;

declare const kIOPCIAERCapErrSourceIDOffset: number;

declare const mATADataRequest: number;

declare const IOHIDDevice_Class: OSClassLoadInformation;

declare const kIOTimeOptionsWithLeeway: number;

declare const CS_HASH_MAX_SIZE: number;

declare const IOServicePM: number;

declare const MBUF_CSUM_REQ_TCP: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSymmetryPhase: number;

declare const IOPCIDevice_Class: OSClassLoadInformation;

declare const kPCIPMCSPMEStatus: number;

declare const kATAcmdWriteMultiple: number;

declare const IOMbufMemoryCursor: number;

declare const kATAcmdWriteSame: number;

declare const kEndpointDescriptorDirection: number;

declare const cableVoltageTooLowErr: number;

declare const IFNET_FAMILY_TUN: number;

declare const gIOInterruptSpecifiersKey: interop.Pointer;

declare const MBUF_LASTFRAG: number;

declare const kUSBHostStandardRequestCompletionTimeout: number;

declare const kOSRegistryModsMode: number;

declare const kFWAsynchAckSent: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkMinSpeedId: number;

declare const IOUSBHostCIPortCapabilitiesMessageControlPortNumber: number;

declare const kDeviceStatusSelfPowered: number;

declare const kIOPCICapabilityIDVendorSpecific: number;

declare const kIOTraceTimers: number;

declare const kUSB2LPMMaxL1Timeout: number;

declare const kIODMAMapOptionBypassed: number;

declare const kIOPCIConfigStatus: number;

declare const kIOSerializeEditorOnAllCollections: number;

declare const IOUSBHostCIIsochronousTransferData1Buffer: number;

declare const version_prerelease_level: number;

declare const kEndpointDescriptorUsageTypeIsocData: number;

declare const kIOServiceFirstMatchState: number;

declare const IOFireWireSBP2Target: number;

declare const kIOTimerEventSourceOptionsDefault: number;

declare const kFWAVCAsyncPlug21: number;

declare const kKeyMaskRightCommand: number;

declare const IOUSBHostCIPortStatusConnected: number;

declare const kIOPCICommandSpecialCycles: number;

declare const kDeviceRequestDirectionIn: number;

declare const kIOMemoryPurgeableVolatileGroup4: number;

declare const CS_SUPPORTSLINKAGE: number;

declare const kFWSelfIDSelfPowered45W: number;

declare const kIOLogMemory: number;

declare const spec_vnodeop_p: interop.Pointer;

declare const kIOACPIFixedEventSleepButton: number;

declare const kIOServiceFamilyCloseOptions: number;

declare const kSuperSpeedPlusDeviceCapabilityMinRxLaneCount: number;

declare const kIOAGPSideBandAddresssing: number;

declare const IOUSBHostCIPortStatusSpeedPhase: number;

declare const kUSB20ExtensionCapabilityBESL: number;

declare const kHV_ION_NONE: number;

declare const OSCollectionIterator: number;

declare const kIOPCIExpressCapabilityIDReadinessTimeReporting: number;

declare const kIOPCIUncorrectableErrorBitAtomicOpEgressBlocked: number;

declare const kNMIIntLevelMask: number;

declare const gIODTPHandleKey: interop.Pointer;

declare const kIOUCScalarIScalarO: number;

declare const kIOKextSpinDump: number;

declare const kIOVideoDeviceMethodOpen: number;

declare const kFWSelfIDBusPowered6W: number;

declare const IOUSBHostPipeMetaClass: number;

declare const kHIDDispatchOptionPhaseEnded: number;

declare const kDeviceRequestRecipientInterface: number;

declare const kIOFBNotifyDidPowerOn: number;

declare const IOUSBHostPipe_Class: OSClassLoadInformation;

declare const IFNET_LQM_THRESH_GOOD: number;

declare const kSuperSpeedPlusDeviceCapabilityMinTxLaneCountPhase: number;

declare const gIODisplayLinearBrightnessProbeKey: interop.Pointer;

declare const kATAcmdSetFeatures: number;

declare const kIOMemorySharingTypeMask: number;

declare const kATADevIntNoCmd: number;

declare const IOHIDEventDriver: number;

declare const kFWSBP2NormalCommandStatus: number;

declare const kIOPCICommandParityError: number;

declare const kIOPCIAdapterNotPresent: number;

declare const gIODriverKitUserClientEntitlementCommunicatesWithDriversKey: interop.Pointer;

declare const DEBUG_HEADER_ENTRY_XNU: number;

declare const kIOPCIResourceTypeCount: number;

declare const dot3ChipSetIntel82557: number;

declare const kPCI2PCIOffsetPrefetchUpperBase: number;

declare const kFWAVCAsyncPlug7: number;

declare const kIOPCIConfigurationOffsetCapabilitiesPtr: number;

declare const DYLD_CHAINED_PTR_START_MULTI: number;

declare const OSAction_AFKUserDataPipe__HandleResponseInterface: number;

declare const kFWPhyConfigurationR: number;

declare const kATAcmdDiagnostic: number;

declare const kIOPCIConfigurationOffsetBaseAddress4: number;

declare const bATADataCorrected: number;

declare const MBUF_TYPE_DATA: number;

declare const IOUSBHostCICapabilitiesMessageData0ConnectionLatency: number;

declare const RGBDirect: number;

declare const kKeyMaskComma: number;

declare const kIOMemoryTypeUPL: number;

declare const kPCI2PCIOffsetPrefetchUpperLimit: number;

declare const kIOPreparationIDUnsupported: number;

declare const kSCSIPort_NotificationStatusChange: number;

declare const IOLittleMemoryCursor: number;

declare const kFWAVCAsyncPlug6: number;

declare const kFWAVCAsyncPlug2: number;

declare const kDeviceRequestTypeClass: number;

declare const gIOServiceKey: interop.Pointer;

declare const gIOKitDebug: number;

declare const kIOPCICapabilityIDPowerManagement: number;

declare const IOSCSIProtocolServices: number;

declare const IODeviceMemory: number;

declare const version_revision: number;

declare const kIOMemoryPurgeableVolatileGroup0: number;

declare const kChipSetTypeCore2001: number;

declare const IFNET_FAMILY_PVC: number;

declare const gIODisplayAudioMuteAndScreenBlankKey: interop.Pointer;

declare const kUSB20ExtensionCapabilityBESLD: number;

declare const gIODisplayFadeTime3: number;

declare const IOUSBHostCIEndpointCreateCommandData1DescriptorPhase: number;

declare const kFWSelfID0Pwr: number;

declare const IOServiceStateNotificationEventSource: number;

declare const kIOPCICapabilityIDCPCIHotswap: number;

declare const IOHIDSystem: number;

declare const IOFixedPoint64: number;

declare const kIOServiceMatchedState: number;

declare const AVCConnectionRecord: number;

declare const MTF_SOOPTS: number;

declare const kIODDCTristate: number;

declare const kKeyMaskAlt: number;

declare const kIODirectionIn: number;

declare const IOUSBHostCIPortStatusCommandData1Overcurrent: number;

declare const kIOACPIFixedEventRealTimeClock: number;

declare const gIODTAssociatedServiceKey: interop.Pointer;

declare const kFWAVCConsumerMode_LOST: number;

declare const kIOAGPDisableFeature6: number;

declare const IOFWAsyncPHYCommand: number;

declare const gIODisplayParametersTheatreModeKey: interop.Pointer;

declare const IFNET_SCHED_MODEL_FQ_CODEL_DM: number;

declare const msgmaps: interop.Pointer;

declare const gIODisplayBrightnessFadeKey: interop.Pointer;

declare const IOHIDEventService_Class: OSClassLoadInformation;

declare const CS_SHA512_LEN: number;

declare const IFNET_NPM_THRESH_UNKNOWN: number;

declare const kIOFWSBP2DontUsePTPacketLimit: number;

declare const kIOPCIConfigBaseAddress3: number;

declare const kAirshipDaleBasebandErrorDARTFailure: number;

declare const osbuilder: interop.Pointer;

declare const dot3ChipSetAMD79900: number;

declare const kIODirectionPrepareToPhys32: number;

declare const kAirshipDaleBasebandErrorIpcSetTransportFailed: number;

declare const kIOPCISlotCapabilitiesBitAttentionButtonPresent: number;

declare const kEndpointDescriptorUsageTypeInterruptReserved2: number;

declare const kIOPCINextCapabilityOffset: number;

declare const IOPCI2PCIBridge: number;

declare const telemetry_notification_subsystem: telemetry_notification_subsystem;

declare const main_device_port: number;

declare const kIOPCIExpressCapabilityIDDataLinkFeature: number;

declare const IOFWWriteCommand: number;

declare const task_access_subsystem: task_access_subsystem;

declare const kIOMemoryLedgerTagNeural: number;

declare const mATACommandAborted: number;

declare const kFWAVCAsyncPlug20: number;

declare const kVBLInterruptServiceType: number;

declare const IODCLTranslator: number;

declare const kIOVideoDeviceMethodSetControlValue: number;

declare const IORangeAllocator: number;

declare const CSSLOT_APPLICATION: number;

declare const kIOPCIUncorrectableErrorBitACSViolation: number;

declare const kFWSelfIDNN: number;

declare const mATADataCorrected: number;

declare const DYLD_CHAINED_PTR_ARM64E: number;

declare const addressAlignmentErr: number;

declare const OSObject: number;

declare const kFWSelfIDNPfPhase: number;

declare const kIOPCICorrectableErrorBitReplayNumRollover: number;

declare const IOFWUserObjectExporter: number;

declare const kIOPCIStatusUDF: number;

declare const kSuperSpeedEndpointCompanionDescriptorSSPIsocCompanion: number;

declare const IOATABusCommand64: number;

declare const kATASetTransferMode: number;

declare const kIOPCIConfigurationOffsetLatencyTimer: number;

declare const bcd2bin_data: interop.Pointer;

declare const IOUSBHostPipeInterface: number;

declare const IOPCIConfigurator: number;

declare const IOUSBHostCICommandMessageData0EndpointAddress: number;

declare const mach_absolutetime_asleep: number;

declare const kIOPCIConfigBaseAddress2: number;

declare const kHIDDispatchOptionScrollMomentumContinue: number;

declare const dot3ChipSetWesternDigital83C690: number;

declare const kIOACPIDevicePowerStateD1: number;

declare const kIOPCICorrectableErrorBitHeaderLogOverflow: number;

declare const gIOACPIDeviceStatusKey: interop.Pointer;

declare const kDeviceRequestGetState: number;

declare const IOUSBHostInterface: number;

declare const gIOHIDDeviceMetaClass: interop.Pointer;

declare const kUSB3LPMU2AcceptOnly: number;

declare const kEndpointDescriptorUsageTypePhase: number;

declare const kEndpointDescriptorSynchronizationType: number;

declare const kFWPhyPacketID: number;

declare const kIOFBNotifyWSAAExitDefer: number;

declare const OSAction_IOHIDEventService__SetUserProperties_Class: OSClassLoadInformation;

declare const kIOPCIExpressCapabilityIDPASID: number;

declare const gIOMatchedNotification: interop.Pointer;

declare const kRegPropertyValueIsSavedToDisk: number;

declare const SPTM_MAP_PADDR_CONFLICT: number;

declare const kIOPCIExpressCapabilityIDSRIOV: number;

declare const kIOPCIAERCapTLPPrefixLogDW3Offset: number;

declare const kIOPCIConfigurationOffsetStatus: number;

declare const kHIDInputReport: number;

declare const SPTM_UNMAP_FLUSH_PENDING: number;

declare const IOFireWireAVCAsynchronousCommand: number;

declare const kIOPCISlotStatusCommandCompleted: number;

declare const MBUF_PKTHDR: number;

declare const kIOPCIExpressCapabilityIDAccessControlServices: number;

declare const gIOBSDKey: interop.Pointer;

declare const IOATAReg8: number;

declare const kIOUCVariableStructureSize: number;

declare const kIOTimerEventSourceOptionsAllowReenter: number;

declare const IOUSBHostCIIsochronousTransferControlFrameNumberPhase: number;

declare const gIODisplayBlueGammaScaleKey: interop.Pointer;

declare const kFWSelfID0GapCntPhase: number;

declare const kFWAVCAsyncPlug15: number;

declare const kEndpointStatusHalt: number;

declare const kPCIPMCD2Support: number;

declare const mATATrack0NotFound: number;

declare const kSCSIPort_StatusFailure: number;

declare const kIOPCIVitalProductDataCapability: number;

declare const kFWAsynchNew: number;

declare const kSuperSpeedPlusDeviceCapabilityMinRxLaneCountPhase: number;

declare const IFNET_LQM_THRESH_MINIMALLY_VIABLE: number;

declare const kRegIterRoot: number;

declare const THREAD_CALL_OPTIONS_ONCE: number;

declare const kPCIPMCD1Support: number;

declare const sock_evt_cantrecvmore: number;

declare const kIOPCIResourceTypeMemory: number;

declare const kIOPCIExpressCapabilityIDMulticast: number;

declare const kIOPCICapabilityIDPCIExpress: number;

declare const kFWAVCAsyncPlug25: number;

declare const kIOPCIAERCapUncErrSeverityOffset: number;

declare const kIOBufferDescriptorMemoryFlags: number;

declare const IOWorkGroupInterface: number;

declare const bATAIDNotFound: number;

declare const kIOAGPFastWrite: number;

declare const kPCI2PCIBridgeControl: number;

declare const kFWTCodeWriteResponse: number;

declare const kFWAVCAsyncPlug13: number;

declare const _MachineStateCount: interop.Pointer;

declare const kATAcmdWriteBuffer: number;

declare const IOFastPathHIDGyroService: number;

declare const IOVideoDeviceUserClientInit: number;

declare const MBUF_CSUM_REQ_IP: number;

declare const kFWSBP2CommandCheckGeneration: number;

declare const kIOPCIConfigHeaderType: number;

declare const CS_VALIDATION_CATEGORY_INVALID: number;

declare const IOHIDWorkLoop: number;

declare const kFBChangedInterruptServiceType: number;

declare const kIOPCIDeviceOffState: number;

declare const kFWAsynchDestinationOffsetHighPhase: number;

declare const kHIDDispatchOptionScrollNoAcceleration: number;

declare const IOAudioDevice: number;

declare const IOUSBHostCIEndpointSetNextTransferCommandData1AddressPhase: number;

declare const IOFWReadCommand: number;

declare const notFoundErr: number;

declare const MBUF_TYPE_IFADDR: number;

declare const kPCI2PCIOffsetIORange: number;

declare const kIOUnserializeEditorOnSets: number;

declare const kUSB3LPMMaxU2Timeout: number;

declare const kIOPCIConfigClassCode: number;

declare const bATASeekComplete: number;

declare const IODCLProgram: number;

declare const IOUSBHostCIIsochronousTransferData1BufferPhase: number;

declare const sock_evt_disconnected: number;

declare const kIODirectionPrepareShareSK: number;

declare const IOGeneralMemoryDescriptor: number;

declare const kSuperSpeedEndpointCompanionDescriptorIsocMultPhase: number;

declare const gIODisplayFadeTime1Key: interop.Pointer;

declare const kFWAVCAsyncPlugAny: number;

declare const kIOAGP4GbAddressing: number;

declare const IFNET_SCHED_MODEL_DRIVER_MANAGED: number;

declare const IOUSBHostDeviceMetaClass: number;

declare const IOPacketQueue: number;

declare const CS_SUPPORTSTEAMID: number;

declare const DYLD_CHAINED_PTR_64_OFFSET: number;

declare const kFWSelfID0GapCnt: number;

declare const kUSBHostDefaultControlCompletionTimeoutMS: number;

declare const MBUF_TYPE_OOBDATA: number;

declare const SPTM_TABLE_ALREADY_PRESENT: number;

declare const kDTMaxEntryNameLength: number;

declare const IOSimpleReporter: number;

declare const kUSBHostVendorRequestCompletionTimeout: number;

declare const CS_SUPPORTSEXECSEG: number;

declare const MBUF_MCAST: number;

declare const gIODriverKitUserClientEntitlementAllowAnyKey: interop.Pointer;

declare const AFKUserDataPipe_Class: OSClassLoadInformation;

declare const kDeviceRequestTypeStandard: number;

declare const kPEPanicRestartCPU: number;

declare const kIOPCIExpressLatencyTolerenceReportingCapability: number;

declare const kThirdOrderRanking: number;

declare const IOUSBHostCICapabilitiesMessageControlPortCount: number;

declare const kFWAVCAsyncPlug12: number;

declare const kIOPCISlotStatusPowerFaultDetected: number;

declare const IOPlatformIO: number;

declare const kIOMemoryPurgeableVolatileBehaviorFifo: number;

declare const kSuperSpeedHubCharacteristicsPowerSwitchingIndividual: number;

declare const IOATAReg16: number;

declare const kIOUCForegroundOnly: number;

declare const kFWSBP2ConstraintForceDoubleBuffer: number;

declare const kIOmemoryLedgerTagNetwork: number;

declare const gOSAction_IOHIDEventService__SetUserPropertiesMetaClass: interop.Pointer;

declare const kFWIsochChannelUnknownCondition: number;

declare const kIOMemoryLedgerFlagNoFootprint: number;

declare const CS_LINKAGE_APPLICATION_XOJIT_PREVIEWS: number;

declare const IOSCSIParallelInterfaceDevice: number;

declare const kIOACPIAddressSpaceOpWrite: number;

declare const kIOEventLinkClockMachAbsoluteTime: number;

declare const OSAction_AFKUserDataPipe__HandleCommand_Class: OSClassLoadInformation;

declare const debug_iomalloc_size: number;

declare const kIOFBNotifyGroupID_AppleMCCSControl: number;

declare const kPCI2PCIIORange: number;

declare const kIOPCIAERCapHdrLogDW0Offset: number;

declare const IOFireWireSBP2UserClient: number;

declare const kIODirectionOut: number;

declare const IOFWSendDCL: number;

declare const OSAction_IOHIDEventService__SetLED: number;

declare const SPTM_SWITCH_RCTX_FLUSH: number;

declare const IOAudioEngine: number;

declare const dot3ChipSetNational8390: number;

declare const IOServiceStateNotificationDispatchSourceInterface: number;

declare const IOFireWireLocalNode: number;

declare const kIOTrackingLeakScanStart: number;

declare const kFWSelfIDNPaPhase: number;

declare const kUSB3LPMMaxU1PEL: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkLSEMbits: number;

declare const OSAction_IOHIDEventService__CopyEvent: number;

declare const IODisplayWrangler: number;

declare const IOHIDPowerSource: number;

declare const OSSerializer: number;

declare const IOFireWireSerialBusProtocolTransport: number;

declare const IFNET_TX_STATUS: number;

declare const kVCLightBackground: number;

declare const kDefaultProbeRanking: number;

declare const kBootROMTypeOldWorld: number;

declare const dad_enhanced: number;

declare const IOHIDEvent: number;

declare const IOUSBHostCITransferCompletionMessageControlStatusPhase: number;

declare const IOEventLink: number;

declare const IOPCIATA: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkLSEGbits: number;

declare const kEfiPalCode: number;

declare const kIOPCIAERCapHdrLogDW1Offset: number;

declare const kATAcmdFormatTrack: number;

declare const kIOTimerEventSourceOptionsPriorityKernel: number;

declare const MBUF_HASFCS: number;

declare const DYLD_CHAINED_PTR_32_FIRMWARE: number;

declare const kATAcmdReadDMAExtended: number;

declare const kIODMAMapWriteAccess: number;

declare const kEfiBootServicesCode: number;

declare const IOAudioLevelControl: number;

declare const kIOMemoryPurgeableVolatileGroup3: number;

declare const IOSCSIParallelInterfaceController: number;

declare const MBUF_TSO_IPV6: number;

declare const IOUSBHostCICommandMessageData0StreamID: number;

declare const invalidIsochPortIDErr: number;

declare const gIOUserClassKey: interop.Pointer;

declare const MBUF_WAITOK: number;

declare const kIOPCICapabilityIDCPCIResourceControl: number;

declare const bATACommandAborted: number;

declare const noChannelsAvailableErr: number;

declare const kEndpointDescriptorTransferTypeBulk: number;

declare const kIOServiceNotificationTypeNone: number;

declare const kFWAsynchPriorityPhase: number;

declare const kIOPCIConfigMinimumGrant: number;

declare const dot3ChipSetIntel82586: number;

declare const kHIDDispatchOptionPhaseCanceled: number;

declare const hv_callbacks: hv_callbacks_t;

declare const kSMEVectorCount: number;

declare const kIOPreparationIDAlwaysPrepared: number;

declare const kIOMemoryTypePhysical: number;

declare const kATAQueueEmpty: number;

declare const gIOPathKey: interop.Pointer;

declare const gIOKitTrace: number;

declare const kUSBHostOpenOptionSelectAlternateSetting: number;

declare const kIOAGPRequestQueueMask: number;

declare const kIOPCIAdapterHotAddPending: number;

declare const IOConfigDirectory: number;

declare const OSAllocateMemory: number;

declare const IOUSBHostDevice: number;

declare const kFWAVCAsyncPlug29: number;

declare const kIOWaitQuietPanics: number;

declare const IOUSBHostCIEndpointUpdateCommandData1DescriptorPhase: number;

declare const MAX_N_SPTM_CORE_FILE_REGIONS: number;

declare const IOFireWireUnitAux: number;

declare const kIOVideoDeviceMethodSuspendStream: number;

declare const kFWTCodeReadBlockResponse: number;

declare const VIOLATION_INVALID_IO_PADDR: number;

declare const kIOFBNotifyGroupID_AppleHDAController: number;

declare const kernel_task: number;

declare const IOHIDEventServiceMetaClass: number;

declare const kIOPCISlotCapabilitiesBitMRLSensorPresent: number;

declare const IFNET_LQM_THRESH_OFF: number;

declare const kBootDriverTypeMKEXT: number;

declare const kIOPMRunModeFullWake: number;

declare const bATATrack0NotFound: number;

declare const IOUSBHostCICommandMessageControlStatusPhase: number;

declare const dot3ChipSetDigitalDC21140: number;

declare const CS_SIGNER_TYPE_MAC_APP_STORE: number;

declare const kIOReportQuantityTemperature: number;

declare const gIOHIDInterfaceMetaClass: interop.Pointer;

declare const MBUF_PROMISC: number;

declare const kIOReportQuantityCPUInstrs: number;

declare const gIOHIDEventServiceMetaClass: interop.Pointer;

declare const kIODDCForceRead: number;

declare const kIOPCIExpressCapabilityIDFRSQueueing: number;

declare const kIOMemoryPurgeableVolatileOrderingObsolete: number;

declare const IOAudioStream: number;

declare const kIOSerializeEditorOnDictionaries: number;

declare const kIOPCIExpressCapabilityIDRCLinkDeclaration: number;

declare const IOWorkLoop: number;

declare const kATAcmdSleep: number;

declare const IOFireWireBus: number;

declare const IOUSBHostCIPortStatusLinkStatePhase: number;

declare const IOHIDKeyboard: number;

declare const IOFireWireController: number;

declare const kIOFBNotifyEvent_Notify: number;

declare const kFWSBP2CommandReservedORB: number;

declare const IOUSBHostCIDeviceCreateCommandData1DeviceAddress: number;

declare const CS_HASHTYPE_SHA1: number;

declare const kFWAVCAsyncPlug23: number;

declare const kAirshipDaleBasebandErrorIpcPowerOffTimedOut: number;

declare const IOFastPathUserClient: number;

declare const kHIDDispatchOptionPhaseChanged: number;

declare const IOPCIBridge: number;

declare const kFWExtendedTCodeVendorDependent: number;

declare const kIODKDisableIOPMSystemOffPhase2Allow: number;

declare const kSuperSpeedDeviceCapabilitySupport5Gb: number;

declare const SPTM_UPDATE_DELAYED_TLBI: number;

declare const kFWPhyPacketPhyID: number;

declare const kIOMemorySetEncrypted: number;

declare const kIOUCScalarIStructI: number;

declare const disconnectedErr: number;

declare const IFNET_RSSI_UNKNOWN: number;

declare const gIOResourceIOKitKey: interop.Pointer;

declare const kIOPCISlotStatusElectromechanicalInterlockState: number;

declare const kEfiLoaderData: number;

declare const IOUSBHostCIDoorbellDeviceAddress: number;

declare const kAppleGPIOUserClientMethodCount: number;

declare const kIOPCICapabilityIDMSI: number;

declare const kFWSBP2CommandTransferDataFromTarget: number;

declare const kIOReportDisable: number;

declare const CSSLOT_LAUNCH_CONSTRAINT_PARENT: number;

declare const IOInterruptController: number;

declare const kIOFBNotifyHDACodecDidPowerOff: number;

declare const MTF_HTABLE: number;

declare const kATAcmdRead: number;

declare const kATAcmdIdleImmed: number;

declare const gIODisplayHorizontalPositionKey: interop.Pointer;

declare const kIOReportQuantityFrequency: number;

declare const kIOFBNotifyEvent_DisplayDimsChange: number;

declare const DYLD_CHAINED_PTR_32: number;

declare const gIODisplayBrightnessProbeKey: interop.Pointer;

declare const kIOPCIConfigurationOffsetSubSystemID: number;

declare const gIOParentMatchKey: interop.Pointer;

declare const CS_SHA1_LEN: number;

declare const EXEC_MODE_XNU_ROZONE_RW_TINDEX: number;

declare const kIOVideoDeviceMethodCount: number;

declare const kIOPCIDebugPortCapability: number;

declare const gFireWireSelfIDs: interop.Pointer;

declare const gIOUserUserClientKey: interop.Pointer;

declare const kIOAGPGartInvalidate: number;

declare const OSAction_IOHIDEventService__SetUserPropertiesMetaClass: number;

declare const channelNotAvailableErr: number;

declare const IOFireWireAVCTargetSpace: number;

declare const kIOAGPDisableAGPWrites: number;

declare const kRegIterSibling: number;

declare const IOPCIDeviceMetaClass: number;

declare const kIOFBNotifyDidPowerOff: number;

declare const kIOPCIConfigBaseAddress1: number;

declare const kFWAVCAsyncPlug14: number;

declare const kFWSelfIDNPdPhase: number;

declare const kPCI2PCISecondaryLT: number;

declare const kSOFTRESET: number;

declare const kPCI2PCIOffsetMemoryRange: number;

declare const receive_sysdiagnose_notification_subsystem: receive_sysdiagnose_notification_subsystem;

declare const kIOReportNotifyHubOnChange: number;

declare const kRegMaximumPropertyNameLength: number;

declare const IOFWLocalIsochPort: number;

declare const IOUSBHostCISetupTransferData1wValue: number;

declare const gIORegistryEntryPropertyKeysKey: interop.Pointer;

declare const kDeviceRequestSetIsochronousDelay: number;

declare const IORemoteConfigDirectory: number;

declare const kFWTCodeLockResponse: number;

declare const kIOAGPInvalidGARTEntry: number;

declare const kDeviceRequestRecipientEndpoint: number;

declare const kFWPacketTCode: number;

declare const kIOPCIExpressCapabilityIDVC_MFVCPresent: number;

declare const gIOResourcesKey: interop.Pointer;

declare const kPCI2PCISecondaryBus: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedIdCountPhase: number;

declare const IOFilterInterruptEventSource: number;

declare const gIOConsoleSecurityInterest: interop.Pointer;

declare const kHIDFlag_StrictErrorChecking: number;

declare const IOPwrController: number;

declare const IOFireWireControllerAux: number;

declare const kFWSelfIDNPb: number;

declare const CS_SHA256_LEN: number;

declare const IOFireWireNubAux: number;

declare const kIOExternalMethodScalarInputCountMax: number;

declare const kIOPCIAdapterHotRemovePending: number;

declare const kFWAVCAsyncPlug8: number;

declare const IOFWAsyncStreamCommand: number;

declare const gFireWireUnit_SW_Version: interop.Pointer;

declare const CSSLOT_LAUNCH_CONSTRAINT_SELF: number;

declare const IOVideoDevice: number;

declare const kPCIPMCSPowerStateD2: number;

declare const kSuperSpeedDeviceCapabilityU2DevExitLatMax: number;

declare const kIOPCIConfigDeviceID: number;

declare const IOBigMemoryCursor: number;

declare const kUSBHostMaxDevices: number;

declare const AppleUSBHostResources: number;

declare const kIOTrackingLeaks: number;

declare const kSuperSpeedHubDecodeLatencyMax: number;

declare const kIOLogMatch: number;

declare const CS_VALIDATION_CATEGORY_DEVELOPMENT: number;

declare const kIOFBNotifyGroupID_ThirdParty: number;

declare const kIOPCISlotCapabilitiesBitHotPlugSurprise: number;

declare const kAirshipDaleBasebandControlErrorMsg: number;

declare const kIOPCICapabilityIDVitalProductData: number;

declare const IFNET_MULTIPAGES: number;

declare const MBUF_TYPE_HEADER: number;

declare const CONSISTENT_DEBUG_PANIC_SOURCE_TXM: number;

declare const kIOPCIUncorrectableErrorBitTLPPrefixBlocked: number;

declare const MBUF_CSUM_IP_GOOD: number;

declare const kIOPCICapabilityIDLDT: number;

declare const kIOPCICommandMemorySpace: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkReserved: number;

declare const kIOMemoryPhysicallyContiguous: number;

declare const kPCIPMCSPowerStateMask: number;

declare const kFWExtendedTCodeMaskSwap: number;

declare const gIODisplayGammaScaleKey: interop.Pointer;

declare const kIOLogPower: number;

declare const kIOMemoryPurgeableVolatileBehaviorLifo: number;

declare const kFWAVCAsyncPlug30: number;

declare const kVCDarkReboot: number;

declare const IODMAEventSource: number;

declare const kHIDUnknownReport: number;

declare const kAirshipDaleBasebandTraceUserClientFlushTraceBuffers: number;

declare const kIOPCILatencyUnsnooped: number;

declare const kHV_ION_ANY_VALUE: number;

declare const gIOUserServerTagKey: interop.Pointer;

declare const kIODMAMapOptionNonCoherent: number;

declare const IOUSBHostCICommandMessageData0RootPortPhase: number;

declare const kIODKDisableCDHashChecking: number;

declare const sockopt_get: number;

declare const mATAAddressNotFound: number;

declare const kFWAsynchTLabelPhase: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkMinSpeedIdPhase: number;

declare const kIODirectionNone: number;

declare const kFWSBP2CommandCompleteNotify: number;

declare const kIOExternalMethodScalarOutputCountMax: number;

declare const DYLD_CHAINED_PTR_ARM64E_USERLAND24: number;

declare const CS_VALIDATION_CATEGORY_TESTFLIGHT: number;

declare const bATADriveReady: number;

declare const kIOFBNotifyWSAAWillEnterDefer: number;

declare const IOUSBHostCIPortStatusCommandData1ConnectChange: number;

declare const kSuperSpeedHubCharacteristicsOverCurrentGlobal: number;

declare const kCheckLinkInTraining: number;

declare const kAirshipDaleBasebandTraceUserClientRegisterTraceBuffer: number;

declare const kFWSelfIDNPePhase: number;

declare const hex2ascii_data: interop.Pointer;

declare const kAppleGPIOUserClientMethodGetGPIOData: number;

declare const IOUSBHostCIPortStatusPowered: number;

declare const kEfiRuntimeServicesCode: number;

declare const kFWSelfIDSelfPowered30W: number;

declare const kDeviceRequestSetFeature: number;

declare const kIOPMPowerStateVersion1: number;

declare const DEBUG_HEADER_CURRENT_VERSION: number;

declare const gIODisplayLinearBrightnessKey: interop.Pointer;

declare const kFWAVCConsumerMode_LESS: number;

declare const IOATAController: number;

declare const kKeyMaskPower: number;

declare const kFWSelfID0C: number;

declare const kSuperSpeedEndpointCompanionDescriptorMaxBurstPhase: number;

declare const kIOLogDebugPower: number;

declare const gIOCommandPoolSizeKey: interop.Pointer;

declare const kDataRotate0: number;

declare const IOATABusInfo: number;

declare const IOUSBHostCIDeviceUpdateCommandData1DescriptorAddressPhase: number;

declare const kIOMemoryLedgerTagGraphics: number;

declare const DYLD_CHAINED_IMPORT: number;

declare const IOFireWireDuplicateGUIDList: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedIdCount: number;

declare const dot3ChipSetIntel82596: number;

declare const IOPowerConnection: number;

declare const kAirshipDaleBasebandControlInterfaceUserClientReadAsync: number;

declare const IOUSBHostCIEndpointResetCommandData1ClearState: number;

declare const kIOPCIConfigInterruptLine: number;

declare const kIOReportQuantityEventCount: number;

declare const kDeviceRequestSetInterface: number;

declare const gIODisplaySpeakerSelectKey: interop.Pointer;

declare const gIODisplayHorizontalSizeKey: interop.Pointer;

declare const CSMAGIC_REQUIREMENTS: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedAttrCount: number;

declare const kHIDDispatchOptionPointerNoAcceleration: number;

declare const kIOPCIProbeOptionDone: number;

declare const gIOBSDMinorKey: interop.Pointer;

declare const IOFWAsyncStreamReceiver: number;

declare const kEfiACPIReclaimMemory: number;

declare const gIOPropertyExistsMatchKey: interop.Pointer;

declare const kSCSIPort_StatusOnline: number;

declare const kSuperSpeedPlusDeviceCapabilityReservedPhase: number;

declare const IOHistogramReporter: number;

declare const kIOFBNotifyClamshellChange: number;

declare const kIOServiceRequired: number;

declare const kIOFBNotifyGroupID_AppleIOAccelDisplayPipe: number;

declare const kIOOutputCommandMask: number;

declare const kFWAVCAsyncPlug11: number;

declare const kNVRAMProperty: number;

declare const kIOFBNotifyEvent_WSAADefer: number;

declare const IOUSBHostCITransferCompletionMessageData0TransferLength: number;

declare const SPTM_SWITCH_ASID_TLBI_FLUSH: number;

declare const kPCI2PCIPrefetchMemoryRange: number;

declare const kIOFBNotifyEvent_ClamshellChange: number;

declare const IODCLTranslateListen: number;

declare const AFKUserDataPipeInterface: number;

declare const kRegUniversalModifierMask: number;

declare const gIOLocationMatchKey: interop.Pointer;

declare const retryExceededErr: number;

declare const kIOFBNotifyCaptureChange: number;

declare const IFNET_FAMILY_FIREWIRE: number;

declare const kIOTimerEventSourceOptionsPriorityKernelHigh: number;

declare const kFWSelfIDNPe: number;

declare const CS_LINKAGE_APPLICATION_OOPJIT_MLCOMPILER: number;

declare const kIOFBNotifyWSAADidEnterDefer: number;

declare const MBUF_EXT: number;

declare const kIOPCIExpressCapabilityIDSFI: number;

declare const kIOMemoryPurgeableVolatileOrderingNormal: number;

declare const IOPlatformExpert: number;

declare const kIOTrackingCallSiteBTs: number;

declare const kIOPCIExpressCapabilityIDLaneMarginingRx: number;

declare const kIOPCIExpressCapabilityIDRCInternalLinkCtrl: number;

declare const kIOTrackingLeakScanEnd: number;

declare const kChipSetTypePowerExpress: number;

declare const dot3ChipSetDigitalDC21040: number;

declare const CSSLOT_TICKETSLOT: number;

declare const OSAction_IOHIDEventService__SetUserPropertiesInterface: number;

declare const CS_VALIDATION_CATEGORY_APP_STORE: number;

declare const kFWSelfID0PwrPhase: number;

declare const dot3ChipSetDigitalDC21041: number;

declare const kIOServiceInactiveState: number;

declare const kIOACPIMemoryRange: number;

declare const IOStateNotificationItem: number;

declare const kNMIIntMask: number;

declare const kHIDDispatchOptionScrollMomentumStart: number;

declare const IOUSBHostCIPortCapabilitiesMessageData0MaxPowerPhase: number;

declare const kHIDDispatchOptionPhaseBegan: number;

declare const IOFastPathDescriptor: number;

declare const IOUSBHostCIMessageControlStatus: number;

declare const IOFireWireROMCache: number;

declare const IOUSBHostCIMessageControlValid: number;

declare const kVSLClamshellStateGestaltType: number;

declare const SPTM_N_TRACES: number;

declare const lz4_decode_scratch_size: number;

declare const kDeviceRequestSetDescriptor: number;

declare const kIOPCIUncorrectableErrorBitReceiverOverflow: number;

declare const OSAdoptMemory: number;

declare const msgpool: string;

declare const gIODisplayPowerModeKey: interop.Pointer;

declare const kIOUserNotifyMaxMessageSize: number;

declare const random_seed_prefix: unknown /* const array */;

declare const OSAction_AFKUserDataPipe__HandleCommandInterface: number;

declare const kIOTraceInterrupts: number;

declare const kKeyMaskDelete: number;

declare const bATADCRReset: number;

declare const IOUSBHostCITransferCompletionMessageControlDeviceAddress: number;

declare const kIOPCIConfigurationOffsetInterruptPin: number;

declare const IOAudioTimeIntervalFilterIIR: number;

declare const kEfiLoaderCode: number;

declare const kIOPCIAERCapTLPPrefixLogDW1Offset: number;

declare const kEndpointDescriptorTransferTypeControl: number;

declare const kIOFBNotifyGroupID_VendorNVIDIA: number;

declare const kIOServiceRegisteredState: number;

declare const kIOPCIProbeOptionEject: number;

declare const kIOPCIExpressVirtualChannelCapability: number;

declare const kFWSelfIDNPa: number;

declare const kKUNCDefaultResponse: number;

declare const IOFireWireAVCUnit: number;

declare const gIODisplayCapabilityStringKey: interop.Pointer;

declare const OSMetaClassBase: number;

declare const IOAudioControlUserClient: number;

declare const IOUSBHostCIPortStatusChangeMask: number;

declare const gIORegistryEntryDefaultLockingSetPropertiesKey: interop.Pointer;

declare const kIOUCTypeMask: number;

declare const kIOPCIExpressCapabilityIDPowerBudget: number;

declare const kDeviceFeatureSelectorU1Enable: number;

declare const IOUSBHostCIDoorbellDeviceAddressPhase: number;

declare const EXEC_MODE_XNU_USER_JIT_RW_TINDEX: number;

declare const gIODisplaySpeakerVolumeKey: interop.Pointer;

declare const mATADriveReady: number;

declare const IOHIDEventServiceInterface: number;

declare const VIOLATION_INVALID_RESTRICTED_IO_PADDR: number;

declare const kIOPCISlotCapabilitiesBitNoCommandCompletedSupport: number;

declare const SFLT_EXTENDED_REGISTRY: number;

declare const IOPCIDevice: number;

declare const kEndpointDescriptorPacketSizePhase: number;

declare const kIOFBNotifyWSAADidExitDefer: number;

declare const kIOReturnOutputSuccess: number;

declare const IOHIDDeviceShim: number;

declare const kIOPCICommandInterruptDisable: number;

declare const kRegNameSpaceModifierMask: number;

declare const kIOTimerEventSourceOptionsPriorityLow: number;

declare const OSAllocateMemoryZero: number;

declare const IOServiceNotificationDispatchSource: number;

declare const kSuperSpeedDeviceCapabilityU1DevExitLatMax: number;

declare const OSSerialize: number;

declare const IOUSBHostCIDeviceCreateCommandData0RoutePhase: number;

declare const OSAction_IOHIDEventService__CopyEventMetaClass: number;

declare const gIOUSBHostInterfaceMetaClass: interop.Pointer;

declare const kIODMAMapFixedAddress: number;

declare const kRegNoModifiers: number;

declare const kIOPCIConfigurationOffsetVendorID: number;

declare const kFWSBP2CommandVirtualORBs: number;

declare const kIODirectionPrepareReserved1: number;

declare const kIOACPIAddressSpaceIDSystemIO: number;

declare const kRegIterContinue: number;

declare const IOFWCommand: number;

declare const gIODisplayParametersDefaultKey: interop.Pointer;

declare const IOUSBHostCISetupTransferData1wIndexPhase: number;

declare const gIODisplayUsageTimeKey: interop.Pointer;

declare const ATATimerEventSource: number;

declare const gIOMatchedServiceCountKey: interop.Pointer;

declare const kIOPCIUncorrectableErrorBitFlowControlProtocol: number;

declare const bATAIndex: number;

declare const IOFWBusCommand: number;

declare const IFNET_IPSEC: number;

declare const kIOAGPIdle: number;

declare const kIOPCISlotStatusMRLSensorState: number;

declare const gIODisplayRotationKey: interop.Pointer;

declare const separateBusErr: number;

declare const ostype: interop.Pointer;

declare const inUseErr: number;

declare const kFWSelfID0I: number;

declare const IOFastPathService: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedMantissaPhase: number;

declare const kFWAsynchExtendedTCodePhase: number;

declare const OSAction_AFKUserDataPipe__HandleCommandMetaClass: number;

declare const kEndpointDescriptorTransferTypeIsochronous: number;

declare const kRootDomainSleepSupported: number;

declare const CS_VALIDATION_CATEGORY_ROSETTA: number;

declare const IOFWIsochChannel: number;

declare const IODCLTranslateTalk: number;

declare const kPCI2PCIOffsetSubordinateBus: number;

declare const IOUSBHostCIEndpointUpdateCommandData1Descriptor: number;

declare const IFNET_FAMILY_BOND: number;

declare const kDeviceRequestRecipientOther: number;

declare const mATAUncorrectable: number;

declare const IFNET_FAMILY_SLIP: number;

declare const directType: number;

declare const kPCI2PCIOffsetPrefetchMemoryRange: number;

declare const IOHIDDeviceElementContainer: number;

declare const IOUSBHostCICapabilitiesMessageData0CommandTimeoutThreshold: number;

declare const gAFKEndpointInterfaceMetaClass: interop.Pointer;

declare const kIOFBNotifyEvent_OnlineChange: number;

declare const IOHIDEventQueue: number;

declare const kFWAVCAsyncPlug3: number;

declare const kIOMemoryPurgeableVolatileGroup2: number;

declare const DYLD_CHAINED_PTR_START_LAST: number;

declare const IFNET_FAMILY_DISC: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkDirectionRx: number;

declare const gIODisplayOverscanKey: interop.Pointer;

declare const kSuperSpeedPlusDeviceCapabilitySublinkReservedPhase: number;

declare const kAirshipDaleBasebandErrorCCCIInternalError: number;

declare const kIODKDisablePM: number;

declare const OSAction_IOHIDEventService__SetLEDInterface: number;

declare const kIODirectionCompleteAndDeactivate: number;

declare const kFWAsynchRtPhase: number;

declare const kIOPCIConfigurationOffsetBaseAddress5: number;

declare const VIOLATION_INVALID_DT_RANGE: number;

declare const IOATAIOReg16: number;

declare const kIOPCIConfigurationOffsetCommand: number;

declare const bATADCRnIntEnable: number;

declare const kIOPCIUncorrectableErrorBitECRC: number;

declare const kFWAVCConsumerMode_JUNK: number;

declare const kATAcmdReadVerify: number;

declare const kIOReportFormatHistogram: number;

declare const kDataRotate90: number;

declare const kDTMaxPropertyNameLength: number;

declare const IOUSBHostCICommandMessageData0StreamIDPhase: number;

declare const kIOEventLinkAssociateOnWait: number;

declare const kIOReportQuantityData: number;

declare const kIOPCICapabilityIDHotplug: number;

declare const IOFWPhysicalAddressSpaceAux: number;

declare const bATABusy: number;

declare const IOATAReg32: number;

declare const kIOACPIFixedEventPowerButton: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkType: number;

declare const kIOPCIAERCapRootErrCmdOffset: number;

declare const kIOPCIExpressCapabilityIDPL16GTs: number;

declare const kEndpointDescriptorUsageTypeInterruptReserved1: number;

declare const gOSAction_AFKUserDataPipe__HandleReportMetaClass: interop.Pointer;

declare const CS_LINKAGE_APPLICATION_ROSETTA_AOT: number;

declare const IOFireWireMultiIsochReceivePacket: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedIdPhase: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkDirectionPhase: number;

declare const kIOPCIConfigurationOffsetBaseAddress3: number;

declare const IOHIDEventService: number;

declare const IOWatchDogTimer: number;

declare const kOFVariablePermUserRead: number;

declare const OSAction_IOHIDEventService__SetLEDMetaClass: number;

declare const kUSB3LPMMaxU2PEL: number;

declare const kIOPCIAERCapCorErrStatusOffset: number;

declare const kIOFBNotifyDidNotify: number;

declare const kIOACPIFixedEventPMTimer: number;

declare const kEndpointDescriptorPacketSizeMultPhase: number;

declare const gIOUserClientClassKey: interop.Pointer;

declare const IOFWIsochPort: number;

declare const kATAEnableReadAhead: number;

declare const kIOMemoryIncoherentIOFlush: number;

declare const kRegCStrMaxEntryNameLength: number;

declare const kVCDarkBackground: number;

declare const kFWAsynchRCodePhase: number;

declare const IOUSBHostCIPortStatusConnectChange: number;

declare const kIOPCIConfigurationOffsetSubSystemVendorID: number;

declare const addressRangeErr: number;

declare const gFireWireUnit_Spec_ID: interop.Pointer;

declare const kIOSerializeEditorOnSets: number;

declare const IFNET_FAMILY_STF: number;

declare const gIODriverKitRequiredEntitlementsKey: interop.Pointer;

declare const bATAAddressNotFound: number;

declare const gIODisplayValueKey: interop.Pointer;

declare const os_detail: number;

declare const CSMAGIC_EMBEDDED_ENTITLEMENTS: number;

declare const IOUSBHostCIMessageControlTypePhase: number;

declare const kInterfaceStatusRemoteWakeEnable: number;

declare const kIOPCIConfigLatencyTimer: number;

declare const kIOACPIDevicePowerStateD0: number;

declare const kIOPCIExpressCapabilityIDErrorReporting: number;

declare const kFWSelfIDNPc: number;

declare const osrelease: interop.Pointer;

declare const kIODDCLow: number;

declare const kIOPCIAdapterPresent: number;

declare const kIOLogKextMemory: number;

declare const kAirshipDaleBasebandErrorIpcPowerOnTimedOut: number;

declare const kInterfaceStatusRemoteWakeCapable: number;

declare const kIOAGPDisableFeature8: number;

declare const kIOPCICommandIOSpace: number;

declare const kIOPCIExpressCapabilityIDDPA: number;

declare const kIODirectionCompleteWithDataValid: number;

declare const CSMAGIC_EMBEDDED_DER_ENTITLEMENTS: number;

declare const gIOPriorityPowerStateInterest: interop.Pointer;

declare const kUSBHostMaxPipes: number;

declare const MTF_CONTROL: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkAsymmetric: number;

declare const IOFWAsyncStreamListener: number;

declare const gIODisplayVerticalPositionKey: interop.Pointer;

declare const kIODirectionCompleteWithError: number;

declare const gIOUSBHostPipeMetaClass: interop.Pointer;

declare const kIOMemoryAsReference: number;

declare const kPCI2PCIOffsetSecondaryLT: number;

declare const kRegIterParents: number;

declare const kUSB3LPMMaxU1SEL: number;

declare const kEndpointDescriptorSynchronizationTypePhase: number;

declare const kIOMemoryTypeVnode: number;

declare const kIODTExclusive: number;

declare const gIOPathMatchKey: interop.Pointer;

declare const debug_container_malloc_size: number;

declare const IOOutputQueue: number;

declare const kIOAGP2xDataRate: number;

declare const kKeyMaskUnknown: number;

declare const CS_LINKAGE_APPLICATION_OOPJIT_PREVIEWS: number;

declare const OSInterface: number;

declare const bATAWriteFault: number;

declare const kIOPCIPCIXCapability: number;

declare const DYLD_CHAINED_PTR_X86_64_KERNEL_CACHE: number;

declare const kIOOutputStatusMask: number;

declare const fixedType: number;

declare const kIOFBNotifyTerminated: number;

declare const DYLD_CHAINED_PTR_ARM64E_KERNEL: number;

declare const kIOLogExclaves: number;

declare const kUSB3LPMMaxHostSchDelay: number;

declare const AFKTightbeamTransportInterface: number;

declare const kAirshipDaleBasebandErrorCreateInterfaceFailure: number;

declare const DYLD_CHAINED_PTR_ARM64E_USERLAND: number;

declare const kFWSelfID0P0Phase: number;

declare const kIOFBNotifyWSAAWillExitDefer: number;

declare const IOFireWireSBP2LUN: number;

declare const version_stage: number;

declare const kIOPCIConfigSubSystemVendorID: number;

declare const kATATimeoutErr: number;

declare const kIOMemoryUseReserve: number;

declare const kFWSelfID0P2: number;

declare const IOPMrootDomain: number;

declare const kIOReportQuantityInductance: number;

declare const audit_triggers_subsystem: audit_triggers_subsystem;

declare const IOFWWriteQuadCommand: number;

declare const kChipSetTypePowerStar: number;

declare const DYLD_CHAINED_PTR_ARM64E_OFFSET: number;

declare const IOEventLinkInterface: number;

declare const kIOServiceDextRequirePowerForMatching: number;

declare const kFWSelfIDPhyID: number;

declare const kFWTCodeReadQuadlet: number;

declare const kIODirectionPrepareNonCoherent: number;

declare const kEndpointDescriptorUsageTypeIsocFeedback: number;

declare const IOUSBHostCIPortEventMessageData0PortNumber: number;

declare const gIODisplayParametersKey: interop.Pointer;

declare const kIOServiceSeize: number;

declare const kIOMemoryTypePhysical64: number;

declare const kIOFBNotifyWillPowerOn: number;

declare const kChipSetTypeCore99: number;

declare const kIODMAMapPageListFullyOccupied: number;

declare const kIOTraceCompatBootArgs: number;

declare const kIODKDisableEntitlementChecking: number;

declare const kIOPCIConfigurationOffsetBaseAddress2: number;

declare const kIOSerializeEditorOnArrays: number;

declare const kPEPanicDiagnosticsDone: number;

declare const kDisabledInterruptState: number;

declare const IOAudioEngineUserClient: number;

declare const kIOMemoryPurgeableFaultOnAccess: number;

declare const sock_evt_disconnecting: number;

declare const IOUSBHostCICommandMessageData0DeviceAddressPhase: number;

declare const kHIDDispatchOptionDeliveryNotificationSuppress: number;

declare const kIOPCIStatusPCI66: number;

declare const gIOUserServerClassKey: interop.Pointer;

declare const IOUSBHostCIPortStatusOvercurrentChange: number;

declare const kIOServiceTerminateWithRematchCurrentDext: number;

declare const kEndpointDescriptorUsageTypeIsocImplicit: number;

declare const kIOFBNotifyDidChangeSpeed: number;

declare const kATAInvalidDevID: number;

declare const kIOPCIUncorrectableErrorBitDataLinkProtocol: number;

declare const kIODDCBlockTypeEDID: number;

declare const kIOLogHibernate: number;

declare const IOUSBHostCIPortStatusCommandData1Speed: number;

declare const IOUSBHostCIPortStatusSpeed: number;

declare const gIODTTypeKey: interop.Pointer;

declare const IOMbufLittleMemoryCursor: number;

declare const kIOPCIAERCapUncErrStatusOffset: number;

declare const IOUSBHostCIDoorbellStreamIDPhase: number;

declare const kFWSelfID0DelPhase: number;

declare const kAirshipDaleBasebandErrorCCCIHandshakeError: number;

declare const kATANoErr: number;

declare const kIOPCIStatusSERRActive: number;

declare const kFWSelfID0P1: number;

declare const kIOTimerEventSourceOptionsPriorityWorkLoop: number;

declare const kRegEntryNameTerminator: number;

declare const kATAcmdMCAcknowledge: number;

declare const kIOReportQuantityCurrent: number;

declare const IOHIDDevice: number;

declare const kIOReportGetDimensions: number;

declare const kEfiBootServicesData: number;

declare const gIODTModelKey: interop.Pointer;

declare const kIOSleepWakeWdogOff: number;

declare const kIOLogCatalogue: number;

declare const CS_VALIDATION_CATEGORY_PLATFORM: number;

declare const BPF_MODE_INPUT_OUTPUT: number;

declare const kIOPCIExpressCapabilityIDNPEM: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkLSEPhase: number;

declare const IOFWUserVectorCommand: number;

declare const kDeviceRequestSize: number;

declare const AVCSubunitInfo: number;

declare const kFWDebugIgnoreNodeNone: number;

declare const kIOFBNotifyEvent_Terminated: number;

declare const kRegPathNameTerminator: number;

declare const mATABusy: number;

declare const version_minor: number;

declare const kIOInterruptTypePCIMessagedX: number;

declare const osbuild_config: interop.Pointer;

declare const MBUF_DONTWAIT: number;

declare const IOMbufBigMemoryCursor: number;

declare const MTF_TAG: number;

declare const kIOPCIAGPCapability: number;

declare const kFWTCodeReadQuadletResponse: number;

declare const kIODKLogIPC: number;

declare const kFWSelfIDNPcPhase: number;

declare const kHIDDispatchOptionScrollMomentumAny: number;

declare const IODMACommand: number;

declare const kATADeviceError: number;

declare const MBUF_FIRSTFRAG: number;

declare const kIOEventLinkAssociateCurrentThread: number;

declare const kDeviceRequestDirectionPhase: number;

declare const kPEHaltCPU: number;

declare const kFWAsynchTLabel: number;

declare const log: void;

declare const cons_ops_index: number;

declare const gIODisplayUsableLinearBrightnessKey: interop.Pointer;

declare const kIOPCIExpressCapabilityIDPL32GTs: number;

declare const IOStreamBuffer: number;

declare const kPCI2PCIMemoryRange: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedMantissa: number;

declare const kDeviceRequestTypePhase: number;

declare const OSAction_AFKUserDataPipe__HandleCommand: number;

declare const kIOPCIUncorrectableErrorBitUnsupportedRequest: number;

declare const IOHIDPointing: number;

declare const OSAction_IOHIDDevice__CompleteReportInterface: number;

declare const dot3ChipSetAMD79C940: number;

declare const kIOMemoryLedgerTagDefault: number;

declare const kIODMAMapPagingPath: number;

declare const gIOTerminatedNotification: interop.Pointer;

declare const AppleNMI: number;

declare const kATAcmdReadExtended: number;

declare const kSuperSpeedPlusDeviceCapabilitySublinkSpeedId: number;

declare const IOFastPathHIDAccelService: number;

declare const gOSAction_AFKUserDataPipe__HandleCommandMetaClass: interop.Pointer;

declare const kIOTrackingExcludeNames: number;

declare const gIODisplayAmbientLightSensorKey: interop.Pointer;

declare const kUSBHostStandardRequestNoDataTimeout: number;

declare const CS_SUPPORTSCODELIMIT64: number;

declare const kUSBHostVendorRequestNoDataTimeout: number;

declare const kIODMAMapOptionUnmapped: number;

declare const kIOPCIStatusMasterAbortActive: number;

declare const kIODKEnable: number;

declare const IOATAIOReg8: number;

declare const kIODMAMapOptionDextOwner: number;

declare const IFNET_LRO_NUM_SEG: number;

declare const kPCIPMCD3Support: number;

declare const IFNET_VLAN_MTU: number;

declare const kIOFWSBP2FailsOnBusResetsDuringIO: number;

declare const CSSLOT_ALTERNATE_CODEDIRECTORY_LIMIT: number;

declare const OSCollection: number;

declare const kIODisplayMaxPowerState: number;

declare const kAirshipDaleBasebandErrorIpcErrorOccurred: number;

declare const kIOPMPowerStateVersion2: number;

declare const kIOLogServiceTree: number;

declare const IOFWCompareAndSwapCommand: number;

declare const kIOPCIAERCapUncErrMaskOffset: number;

declare const bATADataRequest: number;

declare const kIOPCIUncorrectableErrorBitMalformedTLP: number;

declare const kFWAVCAsyncPlug1: number;

declare const kEndpointDescriptorUsageTypeInterruptNotification: number;

declare const kFWAVCAsyncPlug28: number;

declare const kIOPCIConfigCapabilitiesPtr: number;

declare const MTF_FTABLE: number;

declare const kAirshipDaleBasebandControlInterfaceUserClientClose: number;

declare const kExtInt9_NMIIntSource: number;

declare const IORTCController: number;

declare const static_if_abi: number;

declare const IOFWDCL: number;

declare const kUSB3LPMU2Disabled: number;

declare const kATAcmdReadMultiple: number;

declare const MBUF_TYPE_PCB: number;

declare const kIOMemoryPurgeableKeepCurrent: number;

declare const IOPCIHostBridgeData: number;

declare const OSAction_IOHIDEventService__CopyEventInterface: number;

declare const kPCIPMCSPowerStateD1: number;

declare const gssd_mechtype: {
  NO_: -1,
  KRB5_: 0,
  SPNEGO_: 1,
  NTLM_: 2,
  IAKERB_: 3,
};

declare const csselr_cache_type: {
  DATA_UNIFIED: 0,
  INSTR: 1,
};

declare const reloc_type_generic: {
  VANILLA: 0,
  PAIR: 1,
  SECTDIFF: 2,
  PB_LA_PTR: 3,
  LOCAL_SECTDIFF: 4,
  TLV: 5,
};

declare const airship_daleipc_ipc_error_flag: {
  CHANNEL_SYNC_FAILURE: 1,
  CLDMA_LINK_ERROR: 2,
  DEVICE_SLEEP_FAILURE: 4,
  DEVICE_SLEEP_EXIT_TIMEOUT: 8,
  DOWNLINK_BUFFER_COUNT_LENGTH_ERROR: 16,
  IO_TIMEOUT: 32,
  CLDMA_RX_ERROR: 64,
  CLDMA_TX_ERROR: 128,
  SYSTEM_FAILURE: 256,
  HOST_SLEEP_FAILURE: 512,
  HOST_WAKE_FAILURE: 1024,
  CHANNEL_UPDATE_FAILURE: 2048,
  UPLINK_UPDATE_FAILURE: 4096,
  CHANNEL_QUIESCE_FAILURE: 8192,
  DOWNLINK_UPDATE_FAILURE: 16384,
};

declare const airship_daleipc_channel_sync_operation: {
  CHANNEL_SYNC_FETCH_COMPLETION: 1,
  UPLINK_SYNC_FETCH_COMPLETION: 2,
  DOWNLINK_SYNC_FETCH_COMPLETION: 4,
  NETWORK_CLOCK_UPDATE: 8,
};

declare const daleipc_exec_stage: {
  NODEV: 0,
  ROM: 1,
  PL: 2,
  LK: 3,
  MD: 4,
  CCCI: 5,
  OS: 6,
  INVALID: 7,
};

declare const airship_acipc_auxiliary_context_state: {
  UNAVAILABLE: 0,
  AVAILABLE: 1,
  OPENING: 2,
  OPEN: 3,
  CLOSING: 4,
  LIMBO: 5,
  DEAD_UNSETTLED: 6,
  DEAD_SETTLED: 7,
  EDISCONNECTED: 8,
};

declare const airship_acipc_memregion_state_detail_flag: {
  UNAVAILABLE_EXECSTAGE: 1,
  UNAVAILABLE_CONFLICT: 2,
  DEAD_MAPREJECT: 4,
  DEAD_BYREQUEST: 8,
  DEAD_DEVICERESET: 16,
  DEAD_EXECSTAGE: 32,
};

declare const airship_acipc_memregion_state: {
  UNAVAILABLE: 0,
  AVAILABLE: 1,
  MAPPING: 2,
  MAPPED: 3,
  UNMAPPING: 4,
  LIMBO: 5,
  DEAD_UNSETTLED: 6,
  DEAD_SETTLED: 7,
  EDISCONNECTED: 8,
};

declare const airship_acipc_io_result: {
  SUCCESS: 0,
  ERROR: 1,
  OVERFLOW: 2,
  CANCELED: 3,
  RESET: 4,
};

declare const airship_acipc_tr_enqueue_option: {
  AIRSHIP_ACIPC_TR_ENQUEUE_OPTION_CHAIN: 1,
};

declare const airship_acipc_tr_mode_t: {
  STANDARD: 0,
  BATCH: 1,
};

declare const airship_acipc_boot_image_response: {
  NONE: 0,
  SUCCESS: 1,
  FAILURE: 2,
  UNKNOWN: 3,
  EDISCONNECT: 4,
};

declare const airship_acipc_boot_state_detail_flag: {
  UNAVAILABLE_EXECSTAGE: 1,
  DEAD_DEVICERESET: 2,
  DEAD_EXECSTAGE: 4,
};

declare const airship_resource_state: {
  FREE: 0,
  BUSY: 1,
};

declare const airship_driver_user_client_type: {
  CentauriHelperBoot: 0,
  CentauriHelperInterface: 1,
  CentauriHelperMemregion: 2,
  CentauriHelperTimesync: 3,
  DaleTraceInterface: 4,
};

declare const airship_result: {
  OK: 0,
  ERROR: -536870212,
  EBADARGUMENT: -536870206,
  ECANCELED: -536870165,
  ECANTMAP: -536870178,
  EDISCONNECTED: -536870208,
  EEXCLUSIVEACCESS: -536870203,
  EIO: -536870198,
  ENOTOPEN: -536870195,
  ENOSPACE: -536870181,
  ENOTPRIVILEGED: -536870207,
  ENOTREADY: -536870184,
  ETIMEOUT: -536870186,
  EDEVICE: -536870167,
};

declare const kdebug_test_t: {
  KERNEL_MACROS: 1,
  OLD_TIMESTAMP: 2,
  FUTURE_TIMESTAMP: 3,
  SETUP_IOP: 4,
  SETUP_COPROCESSOR: 5,
  CONTINUOUS_TIMESTAMP: 6,
  ABSOLUTE_TIMESTAMP: 7,
  PAST_EVENT: 8,
};

declare const kdebug_live_flags_t: {
  NOWRAP: 2,
  WRAPPED: 8,
};

declare const kdp_event_t: {
  ENTER: 0,
  EXIT: 1,
  PANICLOG: 2,
};

declare const tcp_connection_server_accurate_ecn_state_t: {
  tcp_connection_server_accurate_ecn_invalid: 0,
  tcp_connection_server_accurate_ecn_feature_disabled: 1,
  tcp_connection_server_accurate_ecn_feature_enabled: 2,
  tcp_connection_server_no_ecn_requested: 3,
  tcp_connection_server_classic_ecn_requested: 4,
  tcp_connection_server_accurate_ecn_requested: 5,
  tcp_connection_server_accurate_ecn_negotiation_blackholed: 6,
  tcp_connection_server_accurate_ecn_ace_bleaching_detected: 7,
  tcp_connection_server_accurate_ecn_negotiation_success: 8,
  tcp_connection_server_accurate_ecn_negotiation_success_ect_mangling_detected: 9,
  tcp_connection_server_accurate_ecn_negotiation_success_ect_bleaching_detected: 10,
};

declare const EXDisplayPipeIndicator: {
  CAM: 0,
  MIC: 1,
  MIC_ALT_ACCESSIBILITY: 2,
  CAM_ALT_FACEID: 3,
  CAM_ALT_FACEID_DELAYED: 4,
  COUNT: 5,
};

declare const AppleBasebandBridgeUserRequest: {
  BridgeReady: 0,
  BasebandInReset: 1,
  BasebandHostWake: 2,
  MAX: 3,
};

declare const ataEventCode: {
  NullEvent: 0,
  OnlineEvent: 1,
  OfflineEvent: 2,
  RemovedEvent: 3,
  ResetEvent: 4,
  OfflineRequest: 5,
  EjectRequest: 6,
  PIResetEvent: 7,
  ReservedEvent: 128,
};

declare const ataRegMask: {
  bATAAltSDevC: 14,
  bATAStatusCmd: 7,
  bATASDH: 6,
  bATACylinderHi: 5,
  bATACylinderLo: 4,
  bATASectorNum: 3,
  bATASectorCnt: 2,
  bATAErrFeatures: 1,
  bATAData: 0,
  mATAAltSDevC: 16384,
  mATAStatusCmd: 128,
  mATASDH: 64,
  mATACylinderHi: 32,
  mATACylinderLo: 16,
  mATASectorNum: 8,
  mATASectorCnt: 4,
  mATAErrFeatures: 2,
  mATAData: 1,
};

declare const ataUnitID: {
  Invalid: -1,
  Device0: 0,
  Device1: 1,
};

declare const ataDeviceType: {
  UnknownATA: 0,
  ATA: 1,
  ATAPI: 2,
};

declare const ataSocketType: {
  UnknownSocket: 0,
  InternalATASocket: 1,
  MediaBaySocket: 2,
  PCCardSocket: 3,
  InternalSATA: 4,
  SATABay: 5,
  InternalSATA2: 6,
  SATA2Bay: 7,
};

declare const airship_monitor_comparator: {
  EQ: 0,
  NEQ: 1,
  LT: 2,
  LE: 3,
  GT: 4,
  GE: 5,
};

declare const IOFWAVCProtocolUserClientAsyncCommandCodes: {
  SetAVCRequestCallback: 18,
  AllocateInputPlug: 19,
  AllocateOutputPlug: 20,
  InstallAVCCommandHandler: 21,
  AddSubunit: 22,
  NumAsyncCommands: 23,
};

declare const IOFWAVCProtocolUserClientCommandCodes: {
  SendAVCResponse: 0,
  FreeInputPlug: 1,
  ReadInputPlug: 2,
  UpdateInputPlug: 3,
  FreeOutputPlug: 4,
  ReadOutputPlug: 5,
  UpdateOutputPlug: 6,
  ReadOutputMasterPlug: 7,
  UpdateOutputMasterPlug: 8,
  ReadInputMasterPlug: 9,
  UpdateInputMasterPlug: 10,
  PublishAVCUnitDirectory: 11,
  SetSubunitPlugSignalFormat: 12,
  GetSubunitPlugSignalFormat: 13,
  ConnectTargetPlugs: 14,
  DisconnectTargetPlugs: 15,
  GetTargetPlugConnection: 16,
  AVCRequestNotHandled: 17,
  NumCommands: 18,
};

declare const IOFWAVCUserClientAsyncCommandCodes: {
  InstallAsyncAVCCommandCallback: 16,
  NumAsyncCommands: 17,
};

declare const IOFWAVCUserClientCommandCodes: {
  Open: 0,
  Close: 1,
  OpenWithSessionRef: 2,
  GetSessionRef: 3,
  AVCCommand: 4,
  AVCCommandInGen: 5,
  UpdateAVCCommandTimeout: 6,
  MakeP2PInputConnection: 7,
  BreakP2PInputConnection: 8,
  MakeP2POutputConnection: 9,
  BreakP2POutputConnection: 10,
  CreateAsyncAVCCommand: 11,
  SubmitAsyncAVCCommand: 12,
  CancelAsyncAVCCommand: 13,
  ReleaseAsyncAVCCommand: 14,
  ReinitAsyncAVCCommand: 15,
  NumCommands: 16,
};

declare const IOFWAVCAsyncCommandState: {
  PendingRequest: 0,
  RequestSent: 1,
  RequestFailed: 2,
  WaitingForResponse: 3,
  ReceivedInterimResponse: 4,
  ReceivedFinalResponse: 5,
  TimeOutBeforeResponse: 6,
  BusReset: 7,
  OutOfMemory: 8,
  Canceled: 9,
};

declare const IOFWAVCSubunitPlugMessages: {
  Connected: 0,
  Disconnected: 1,
  ConnectedPlugModified: 2,
  SignalFormatModified: 3,
};

declare const IOFWAVCPlugTypes: {
  SubunitSource: 0,
  SubunitDest: 1,
  IsochInput: 2,
  IsochOutput: 3,
  AsynchInput: 4,
  AsynchOutput: 5,
  ExternalInput: 6,
  ExternalOutput: 7,
};

declare const IOAVCOpcodes: {
  PlugInfoOpcode: 2,
  OutputPlugSignalFormatOpcode: 24,
  InputPlugSignalFormatOpcode: 25,
  UnitInfoOpcode: 48,
  SubunitInfoOpcode: 49,
  ConnectionsOpcode: 34,
  ConnectOpcode: 36,
  DisconnectOpcode: 37,
  PowerOpcode: 178,
  SignalSourceOpcode: 26,
  VendorDependentOpcode: 0,
  OutputSignalModeOpcode: 120,
  InputSignalModeOpcode: 121,
  SignalModeSD525_60: 0,
  SignalModeSDL525_60: 4,
  SignalModeHD1125_60: 8,
  SignalModeSD625_50: 128,
  SignalModeSDL625_50: 132,
  SignalModeHD1250_50: 136,
  SignalModeDVCPro525_60: 120,
  SignalModeDVCPro625_50: 248,
  SignalModeDummyOperand: 255,
  SignalModeMask_50: 128,
  SignalModeMask_STYPE: 124,
  SignalModeMask_SDL: 4,
  SignalModeMask_DVCPro25: 120,
};

declare const IOAVCCommandResponse: {
  ControlCommand: 0,
  StatusInquiryCommand: 1,
  SpecificInquiryCommand: 2,
  NotifyCommand: 3,
  GeneralInquiryCommand: 4,
  NotImplementedStatus: 8,
  AcceptedStatus: 9,
  RejectedStatus: 10,
  InTransitionStatus: 11,
  ImplementedStatus: 12,
  ChangedStatus: 13,
  InterimStatus: 15,
};

declare const IOAVCFrameFields: {
  CommandResponse: 0,
  Address: 1,
  Opcode: 2,
  Operand0: 3,
  Operand1: 4,
  Operand2: 5,
  Operand3: 6,
  Operand4: 7,
  Operand5: 8,
  Operand6: 9,
  Operand7: 10,
  Operand8: 11,
};

declare const tIsochronousTransactionOptions: {
  None: 0,
  Wrap: 1,
};

declare const tIsochronousTransferOptions: {
  kIsochronousTransferOptionsNone: 0,
};

declare const IOUSBHostCIDeviceState: {
  Destroyed: 0,
  Paused: 1,
  Active: 2,
};

declare const IOUSBHostCIControllerState: {
  Off: 0,
  Paused: 1,
  Active: 2,
};

declare const IOUSBHostCILinkState: {
  U0: 0,
  U1: 1,
  U2: 2,
  U3: 3,
  Disabled: 4,
  RxDetect: 5,
  Inactive: 6,
  Polling: 7,
  Recovery: 8,
  Reset: 9,
  Compliance: 10,
  Test: 11,
  Resume: 15,
};

declare const IOUSBHostCIDeviceSpeed: {
  None: 0,
  Full: 1,
  Low: 2,
  High: 3,
  Super: 4,
  SuperPlus: 5,
  SuperPlusBy2: 6,
  Other: 7,
};

declare const IOUSBHostCIMessageStatus: {
  Reserved: 0,
  Success: 1,
  Offline: 2,
  NotPermitted: 3,
  BadArgument: 4,
  Timeout: 5,
  NoResources: 6,
  EndpointStopped: 7,
  ProtocolError: 8,
  TransactionError: 9,
  OverrunError: 10,
  StallError: 11,
  MissedServiceError: 12,
  Error: 13,
};

declare const IOUSBHostCIMessageType: {
  ControllerCapabilities: 0,
  PortCapabilities: 1,
  PortEvent: 8,
  FrameNumberUpdate: 9,
  FrameTimestampUpdate: 10,
  CommandMin: 16,
  ControllerPowerOn: 16,
  ControllerPowerOff: 17,
  ControllerStart: 18,
  ControllerPause: 19,
  ControllerFrameNumber: 20,
  PortPowerOn: 24,
  PortPowerOff: 25,
  PortResume: 26,
  PortSuspend: 27,
  PortReset: 28,
  PortDisable: 29,
  PortStatus: 30,
  DeviceCreate: 32,
  DeviceDestroy: 33,
  DeviceStart: 34,
  DevicePause: 35,
  DeviceUpdate: 36,
  EndpointCreate: 40,
  EndpointDestroy: 41,
  Endpoint_reserved_: 42,
  EndpointPause: 43,
  EndpointUpdate: 44,
  EndpointReset: 45,
  EndpointSetNextTransfer: 46,
  CommandMax: 55,
  SetupTransfer: 56,
  NormalTransfer: 57,
  StatusTransfer: 58,
  IsochronousTransfer: 59,
  Link: 60,
  TransferComplete: 61,
};

declare const IOUSBHostCIExceptionType: {
  Unknown: 0,
  CapabilitiesInvalid: 1,
  Terminated: 2,
  CommandReadCollision: 3,
  CommandWriteFailed: 4,
  CommandTimeout: 5,
  CommandFailure: 6,
  InterruptInvalid: 7,
  InterruptOverflow: 8,
  DoorbellReadCollision: 9,
  DoorbellOverflow: 10,
  ProtocolError: 11,
  FrameUpdateError: 12,
};

declare const IOUSBHostCIUserClientVersion: {
  IOUSBHostCIUserClientVersion100: 0,
};

declare const tUSBDeviceLPMStatus: {
  Default: 0,
  Disabled: 1,
  Enabled: 2,
};

declare const tUSBLPMExitLatency: {
  DescriptorExitLatency: 0,
  DeviceExitLatency: 1,
  SystemExitLatency: 2,
  MaxExitLatency: 3,
  BestEffortServiceLatency: 4,
  BestEffortServiceLatencyDeep: 5,
  DefaultBestEffortServiceLatency: 6,
  DefaultBestEffortServiceLatencyDeep: 7,
  MaxL1BaseExitLatency: 8,
  MaxL1DeepExitLatency: 9,
};

declare const tUSBHostPowerSourceType: {
  StaticPool: 0,
  SMC: 1,
  Hardware: 2,
};

declare const tUSBHostPortStatus: {
  PortTypeMask: 15,
  PortTypePhase: 0,
  PortTypeStandard: 0,
  PortTypeCaptive: 1,
  PortTypeInternal: 2,
  PortTypeAccessory: 3,
  PortTypeReserved: 240,
  ConnectedSpeedMask: 1792,
  ConnectedSpeedPhase: 8,
  ConnectedSpeedNone: 0,
  ConnectedSpeedFull: 256,
  ConnectedSpeedLow: 512,
  ConnectedSpeedHigh: 768,
  ConnectedSpeedSuper: 1024,
  ConnectedSpeedSuperPlus: 1280,
  ConnectedSpeedSuperPlusBy2: 1536,
  ConnectedSpeedOther: 1792,
  Resetting: 2048,
  Enabled: 4096,
  Suspended: 8192,
  Overcurrent: 16384,
  TestMode: 32768,
};

declare const tUSBHostConnectionSpeed: {
  None: 0,
  Full: 1,
  Low: 2,
  High: 3,
  Super: 4,
  SuperPlus: 5,
  SuperPlusBy2: 6,
  Other: 7,
  Count: 8,
};

declare const tDeviceRequestType: {
  Standard: 0,
  Class: 1,
  Vendor: 2,
};

declare const tDeviceRequestDirection: {
  Out: 0,
  In: 1,
};

declare const tEndpointType: {
  Control: 0,
  Isochronous: 1,
  Bulk: 2,
  Interrupt: 3,
};

declare const tEndpointDirection: {
  Out: 0,
  In: 1,
  Unknown: 2,
};

declare const tBusVoltage: {
  kBusVoltageDefault: 5,
};

declare const tLanguageID: {
  kLanguageIDEnglishUS: 1033,
};

declare const tDescriptorSize: {
  kDescriptorSize: 2,
  Device: 18,
  Configuration: 9,
  Interface: 9,
  Endpoint: 7,
  StringMinimum: 2,
  StringMaximum: 255,
  DeviceQualifier: 10,
  InterfaceAssociation: 8,
  BOS: 5,
  DeviceCapability: 3,
  USB20ExtensionCapability: 7,
  SuperSpeedUSBDeviceCapability: 10,
  ContainerIDCapability: 20,
  HubMinimum: 9,
  HubMaximum: 21,
  SuperSpeedHub: 12,
  SuperSpeedUSBEndpointCompanion: 6,
  SuperSpeedPlusIsochronousEndpointCompanion: 8,
  BillboardDeviceMinimum: 44,
  BillboardDeviceMaximum: 256,
  PlatformECIDCapability: 28,
  PlatformCapability: 20,
};

declare const mbuf_traffic_class_t: {
  BE: 0,
  BK: 1,
  VI: 2,
  VO: 3,
};

declare const SCSIParallelFeatureResult: {
  Unchanged: 0,
  Cleared: 1,
  Success: 2,
};

declare const coprocessor_type_t: {
  VersionNone: 0,
  Version1: 65536,
  Version2: 131072,
};

declare const IOPCILinkSpeed: {
  Speed_2_5_: 1,
  Speed_5_: 2,
  Speed_8_: 3,
  Speed_16_: 4,
  Speed_32_: 5,
};

declare const IOPCIBARType: {
  M32: 0,
  IO: 1,
  M64: 4,
  M32PF: 8,
  M64PF: 12,
};

declare const tIOPCILinkControlASPMBits: {
  Disabled: 0,
  L0s: 1,
  L1: 2,
  L0sL1: 3,
};

declare const tIOPCIDeviceResetTypes: {
  HotReset: 1,
  WarmReset: 2,
  WarmResetDisable: 4,
  WarmResetEnable: 8,
  FunctionReset: 16,
};

declare const tIOPCILinkSpeed: {
  Speed_2_5_: 1,
  Speed_5_: 2,
  Speed_8_: 3,
  Speed_16_: 4,
  Speed_32_: 5,
};

declare const IOHIDKind: {
  Unknown: 0,
  Keyboard: 1,
  RelativePointing: 2,
};

declare const kdebug_coproc_flags_t: {
  KDCP_CONTINUOUS_TIME: 1,
};

declare const IONVRAMOperation: {
  Init: 0,
  Read: 1,
  Write: 2,
  Delete: 3,
  Obliterate: 4,
  Reset: 5,
};

declare const NVRAMPartitionType: {
  TypeUnknown: 0,
  System: 1,
  Common: 2,
};

declare const IOLockState: {
  Unlocked: 0,
  Locked: 1,
};

declare const ex_cb_action_t: {
  RERUN: 0,
  NONE: 1,
};

declare const sptm_info_t: {
  INFO_SPTM_ALLOWED_IO_RANGES: 0,
  INFO_SPTM_ALLOWED_IO_RANGES_COUNT: 1,
  INFO_SPTM_PMAP_IO_RANGES: 2,
  INFO_SPTM_PMAP_IO_RANGES_COUNT: 3,
  INFO_SPTM_IO_RANGES: 4,
  INFO_SPTM_IO_RANGES_COUNT: 5,
  INFO_SPTM_EVNT_CNTR_RETYPES: 6,
  INFO_SPTM_EVNT_CNTR_SWWA_TLBI_ASID: 7,
  INFO_SPTM_EVNT_CNTR_SWWA_TLBI_ALL: 8,
  INFO_SPTM_EVNT_CNTR_UAT_UNMAP_PROCESSED: 9,
  INFO_SPTM_EVNT_CNTR_UAT_UNMAP_MARKED: 10,
  INFO_SPTM_EVNT_CNTR_UAT_UNMAP_UNMARKED: 11,
  INFO_SPTM_EVNT_CNTR_SWWA_TLBI_ASID_ELIDED: 12,
  INFO_SPTM_EVNT_CNTR_SWWA_TLBI_ALL_ELIDED: 13,
  MAX_SPTM_INFOS: 14,
};

declare const sptm_guest_stage1_tlb_op_t: {
  ASIDE1IS: 0,
  VAE1IS: 1,
  VAAE1IS: 2,
  VAALE1IS: 3,
  VALE1IS: 4,
  VMALLE1IS: 5,
  RVAE1IS: 6,
  RVAAE1IS: 7,
  RVAALE1IS: 8,
  RVALE1IS: 9,
  INVALID: 10,
};

declare const xnu_entry_routine_t: {
  BOOT_COLD: 0,
  BOOT_SECONDARY: 1,
  BOOT_WARM: 2,
  BOOT_HIB: 3,
  PANIC: 4,
  EXCEPTION: 5,
};

declare const sptm_iommu_id_enum_t: {
  IOMMU_ID_SHART: 0,
  IOMMU_ID_SART: 1,
  IOMMU_ID_NVME: 2,
  IOMMU_ID_UAT: 3,
  IOMMU_ID_DART_T8020: 4,
  IOMMU_ID_DART_T8110: 5,
  IOMMU_ID_DART_T6000: 6,
  IOMMU_ID_DART_GEN3: 8,
  SPTM_IOMMUS_N_IDS: 9,
  IOMMU_ID_INVALID: 9,
};

declare const darwin_gpu_role_t: {
  UNKNOWN: 0,
  ALLOW: 1,
  DENY: 2,
  BACKGROUND: 3,
  UTILITY: 4,
  UI_NON_FOCAL: 5,
  UI: 6,
  UI_FOCAL: 7,
};

declare const libsptm_refcnt_type_t: {
  NONE: 0,
  RO: 1,
  WX: 2,
  IOMMU: 3,
};

declare const sptm_vector_type_t: {
  VECTOR_IRQ: 0,
  VECTOR_FIQ: 1,
  VECTOR_SERROR: 2,
  VECTOR_SYNC: 3,
  N_VECTOR_TYPES: 4,
};

declare const sptm_frame_type_t: {
  SPTM_UNTYPED: 0,
  SPTM_UNUSED: 1,
  SPTM_DEFAULT: 2,
  SPTM_RO: 3,
  SPTM_CODE: 4,
  SPTM_TXM_CODE: 5,
  SPTM_XNU_CODE: 6,
  SPTM_XNU_CODE_DBG_RW: 7,
  SPTM_KERNEL_ROOT_TABLE: 8,
  SPTM_PAGE_TABLE: 9,
  SPTM_IOMMU_BOOTSTRAP: 10,
  XNU_DEFAULT: 11,
  XNU_RO: 12,
  XNU_RO_DBG_RW: 13,
  XNU_USER_EXEC: 14,
  XNU_USER_DEBUG: 15,
  XNU_USER_JIT: 16,
  XNU_USER_TPRO: 17,
  XNU_USER_ROOT_TABLE: 18,
  XNU_SHARED_ROOT_TABLE: 19,
  XNU_PAGE_TABLE: 20,
  XNU_PAGE_TABLE_SHARED: 21,
  XNU_PAGE_TABLE_ROZONE: 22,
  XNU_PAGE_TABLE_COMMPAGE: 23,
  XNU_IOMMU: 24,
  XNU_ROZONE: 25,
  XNU_IO: 26,
  XNU_PROTECTED_IO: 27,
  XNU_COPROCESSOR_RO_IO: 28,
  XNU_COMMPAGE_RW: 29,
  XNU_COMMPAGE_RO: 30,
  XNU_COMMPAGE_RX: 31,
  XNU_TAG_STORAGE: 32,
  XNU_STAGE2_ROOT_TABLE: 33,
  XNU_STAGE2_PAGE_TABLE: 34,
  XNU_KERNEL_RESTRICTED: 35,
  XNU_RESERVED_1: 36,
  XNU_RESERVED_2: 37,
  XNU_RESTRICTED_IO: 38,
  XNU_RESTRICTED_IO_RO: 39,
  XNU_RESTRICTED_IO_TELEMETRY: 40,
  XNU_SUBPAGE_USER_ROOT_TABLES: 41,
  TXM_DEFAULT: 42,
  TXM_RO: 43,
  TXM_RW: 44,
  TXM_CPU_STACK: 45,
  TXM_THREAD_STACK: 46,
  TXM_ADDRESS_SPACE_TABLE: 47,
  TXM_MALLOC_PAGE: 48,
  TXM_FREE_LIST: 49,
  TXM_SLAB_TRUST_CACHE: 50,
  TXM_SLAB_PROFILE: 51,
  TXM_SLAB_CODE_SIGNATURE: 52,
  TXM_SLAB_CODE_REGION: 53,
  TXM_SLAB_ADDRESS_SPACE: 54,
  TXM_BUCKET_1024: 55,
  TXM_BUCKET_2048: 56,
  TXM_BUCKET_4096: 57,
  TXM_BUCKET_8192: 58,
  TXM_BULK_DATA: 59,
  TXM_BULK_DATA_READ_ONLY: 60,
  TXM_LOG: 61,
  TXM_SEP_SECURE_CHANNEL: 62,
  SK_DEFAULT: 63,
  SK_SHARED_RO: 64,
  SK_SHARED_RW: 65,
  SK_IO: 66,
  SK_XNU_CONTENT: 67,
  N_FRAME_TYPES: 68,
  FRAME_TYPE_INVALID: 69,
  FRAME_TYPE_ANY: 70,
};

declare const cache_type_t: {
  Lnone: 0,
  L1I: 1,
  L1D: 2,
  L2U: 3,
  L3U: 4,
  LCACHE_MAX: 5,
};

declare const cpuid_register_t: {
  eax: 0,
  ebx: 1,
  ecx: 2,
  edx: 3,
};

declare const xdrbuf_type: {
  NONE: 0,
  BUFFER: 1,
};

declare const nfstype: {
  NON: 0,
  REG: 1,
  DIR: 2,
  BLK: 3,
  CHR: 4,
  LNK: 5,
  SOCK: 6,
  FIFO: 7,
  ATTRDIR: 8,
  NAMEDATTR: 9,
};

declare const ipsec_offload_sa_flags: {
  IPSEC_OFFLOAD_SA_F_ESN: 1,
};

declare const ipsec_offload_transport: {
  ANY: 0,
  TCP: 6,
  UDP: 17,
};

declare const ipsec_offload_action: {
  ALLOW: 1,
  DISCARD: 2,
};

declare const ipsec_offload_dir: {
  IN: 1,
  OUT: 2,
  FWD: 3,
};

declare const ipsec_offload_mode: {
  RANSPORT: 0,
  UNNEL: 1,
};

declare const ipsec_dscp_mapping_t: {
  COP: 0,
  LEGAC: 1,
};

declare const if_netem_model_t: {
  ULL: 0,
  LC: 1,
};

declare const telemetry_pagein_flags_t: {
  TELEMETRY_PAGEIN_BASE: 0,
};

declare const telemetry_pmi_t: {
  NONE: 0,
  INSTRS: 1,
  CYCLES: 2,
};

declare const SCSIParallelFeatureRequest: {
  No: 0,
  Attempt: 1,
  Clear: 2,
};

declare const telemetry_command_t: {
  PMI_SETUP: 3,
  PAGEIN_SETUP: 4,
  PAGEIN_READ: 5,
  MEMORY_USAGE_SETUP: 6,
};

declare const tUSBLinkState: {
  U0: 0,
  U1: 1,
  U2: 2,
  U3: 3,
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
};

declare const mcc_ecc_version_t: {
  V1: 0,
  NUM_VERSIONS: 1,
};

declare const mcc_flags_t: {
  NONE: 0,
  IS_SINGLE_BIT: 1,
  IS_MULTI_BIT: 2,
};

declare const ecc_version_t: {
  V1: 0,
  NUM_VERSIONS: 1,
};

declare const ext_paniclog_create_options_t: {
  NONE: 0,
  WITH_BUFFER: 1,
  ADD_SEPARATE_KEY: 2,
};

declare const ext_paniclog_flags_t: {
  NONE: 0,
  ADD_SEPARATE_KEY: 1,
};

declare const thread_snapshot_wait_flags: {
  None: 0,
  KernelMutex: 1,
  PortReceive: 2,
  PortSetReceive: 3,
  PortSend: 4,
  PortSendInTransit: 5,
  Semaphore: 6,
  KernelRWLockRead: 7,
  KernelRWLockWrite: 8,
  KernelRWLockUpgrade: 9,
  UserLock: 10,
  PThreadMutex: 11,
  PThreadRWLockRead: 12,
  PThreadRWLockWrite: 13,
  PThreadCondVar: 14,
  ParkedWorkQueue: 15,
  WorkloopSyncWait: 16,
  OnProcess: 17,
  SleepWithInheritor: 18,
  Eventlink: 19,
  Compressor: 20,
  ParkedBoundWorkQueue: 21,
  PageBusy: 22,
  PLReqInProgress: 23,
  PagerReady: 24,
  PagingActivity: 25,
  MappingInProgress: 26,
  MemoryBlocked: 27,
  PagingInProgress: 28,
  PageInThrottle: 29,
  ExclaveCore: 30,
  ExclaveKit: 31,
  VMEntryExclEvent: 32,
  VMEntrySharedEvent: 33,
  VMEntryKUnwireEvent: 34,
  Threadpair: 35,
};

declare const stackshot_device_lock_state_t: {
  stackshot_lock_state_device_unlocked: 0,
  stackshot_lock_state_device_locked: 1,
  stackshot_lock_state_unknown: 2,
};

declare const stackshot_passcode_status_t: {
  stackshot_passcode_unset: 0,
  stackshot_passcode_set: 1,
  stackshot_passcode_unknown: 2,
};

declare const hvg_hcall_return_t: {
  SUCCESS: 0,
  ACCESS_DENIED: 1,
  INVALID_CODE: 2,
  INVALID_PARAMETER: 3,
  IO_FAILED: 4,
  FEAT_DISABLED: 5,
  UNSUPPORTED: 6,
};

declare const llc_event_version_t: {
  V1: 0,
  NUM_VERSIONS: 1,
};

declare const backtrace_pack_t: {
  NONE: 0,
  KERN_OFFSET_32: 1,
};

declare const backtrace_info_t: {
  I_NONE: 0,
  I_64_BIT: 1,
  I_TRUNCATED: 2,
};

declare const lck_wake_action_t: {
  EFAULT: 0,
  O_NOT_TRANSFER_PUSH: 1,
};

declare const mph_panic_flags_t: {
  NESTED_PANIC: 1,
  COMPANION_PROC_INITIATED_PANIC: 2,
  STACKSHOT_SUCCEEDED: 4,
  STACKSHOT_DATA_COMPRESSED: 8,
  STACKSHOT_FAILED_DEBUGGERSYNC: 16,
  STACKSHOT_FAILED_ERROR: 32,
  STACKSHOT_FAILED_INCOMPLETE: 64,
  STACKSHOT_FAILED_NESTED: 128,
  COREDUMP_COMPLETE: 256,
  COREDUMP_FAILED: 512,
  STACKSHOT_KERNEL_ONLY: 1024,
  STACKSHOT_FAILED_COMPRESS: 2048,
  ENCRYPTED_COREDUMP_SKIPPED: 4096,
  KERNEL_COREDUMP_SKIPPED_EXCLUDE_REGIONS_UNAVAILABLE: 8192,
  COREFILE_UNLINKED: 16384,
  INCOHERENT_PANICLOG: 32768,
  USERSPACE_INITIATED_PANIC: 65536,
  INTEGRATED_COPROC_INITIATED_PANIC: 131072,
};

declare const microstackshot_flags_t: {
  GET_KERNEL_MICROSTACKSHOT: 8,
  GET_MICROSTACKSHOT: 16,
  GLOBAL_MICROSTACKSHOT_ENABLE: 32,
  GLOBAL_MICROSTACKSHOT_DISABLE: 64,
  SET_MICROSTACKSHOT_MARK: 128,
};

declare const stackshot_flags_t: {
  GET_DQ: 1,
  SAVE_LOADINFO: 2,
  GET_GLOBAL_MEM_STATS: 4,
  SAVE_KEXT_LOADINFO: 8,
  ACTIVE_KERNEL_THREADS_ONLY: 256,
  GET_BOOT_PROFILE: 512,
  DO_COMPRESS: 1024,
  SAVE_IMP_DONATION_PIDS: 8192,
  SAVE_IN_KERNEL_BUFFER: 16384,
  RETRIEVE_EXISTING_BUFFER: 32768,
  KCDATA_FORMAT: 65536,
  ENABLE_BT_FAULTING: 131072,
  COLLECT_DELTA_SNAPSHOT: 262144,
  COLLECT_SHAREDCACHE_LAYOUT: 524288,
  TRYLOCK: 1048576,
  ENABLE_UUID_FAULTING: 2097152,
  FROM_PANIC: 4194304,
  NO_IO_STATS: 8388608,
  THREAD_WAITINFO: 16777216,
  THREAD_GROUP: 33554432,
  SAVE_JETSAM_COALITIONS: 67108864,
  INSTRS_CYCLES: 134217728,
  ASID: 268435456,
  PAGE_TABLES: 536870912,
  DISABLE_LATENCY_INFO: 1073741824,
  SAVE_DYLD_COMPACTINFO: 2147483648,
  INCLUDE_DRIVER_THREADS_IN_KERNEL: 4294967296,
  EXCLAVES: 8589934592,
  SKIP_EXCLAVES: 17179869184,
  MTEINFO: 34359738368,
};

declare const execution_mode_t: {
  EXEC_MODE_SPTM_DEFAULT: 0,
  EXEC_MODE_SK_DEFAULT: 1,
  EXEC_MODE_TXM_DEFAULT: 2,
  EXEC_MODE_XNU_DEFAULT: 3,
  EXEC_MODE_XNU_ROZONE_RW: 4,
  EXEC_MODE_XNU_USER_DEFAULT: 5,
  EXEC_MODE_XNU_USER_JIT_RW: 6,
  EXEC_MODE_XNU_USER_TPRO_RW: 7,
  MAX_EXEC_MODES: 8,
  EXEC_MODES_ALL: -1,
};

declare const kdebug_emit_flags_t: {
  FILTER_ONLY: 1,
  NON_PROCESS: 2,
};

declare const airship_acipc_cr_sync_operation: {
  AIRSHIP_ACIPC_CR_SYNC_PROCESS_HI_UPDATE: 1,
};

declare const tUSBHostPortType: {
  Standard: 0,
  Captive: 1,
  Internal: 2,
  Accessory: 3,
  ExpressCard: 4,
  C: 5,
  Unknown: 6,
};

declare const micro_snapshot_flags: {
  PageGrabRecord: 2,
  UserMode: 4,
  IORecord: 8,
  PMIRecord: 16,
  MACFRecord: 32,
  KernelThread: 64,
  VMFaultRecord: 128,
  InterruptRecord: 1,
  TimerArmingRecord: 2,
};

declare const EXBrightMessageType: {
  kLoadALSSCalibration: 0,
};

declare const csselr_cache_level: {
  L1: 0,
  L2: 2,
  L3: 4,
  L4: 6,
  L5: 8,
  L6: 10,
  L7: 12,
};

declare const telemetry_notice_t: {
  BASE: 0,
  KERNEL_MICROSTACKSHOT: 1,
};

declare const eph_panic_flags_t: {
  COREDUMP_COMPLETE: 1,
  STACKSHOT_SUCCEEDED: 2,
  STACKSHOT_FAILED_DEBUGGERSYNC: 4,
  STACKSHOT_FAILED_ERROR: 8,
  STACKSHOT_FAILED_INCOMPLETE: 16,
  STACKSHOT_FAILED_NESTED: 32,
  NESTED_PANIC: 64,
  BUTTON_RESET_PANIC: 128,
  COMPANION_PROC_INITIATED_PANIC: 256,
  COREDUMP_FAILED: 512,
  COMPRESS_FAILED: 1024,
  STACKSHOT_DATA_COMPRESSED: 2048,
  ENCRYPTED_COREDUMP_SKIPPED: 4096,
  KERNEL_COREDUMP_SKIPPED_EXCLUDE_REGIONS_UNAVAILABLE: 8192,
  COREFILE_UNLINKED: 16384,
  INCOHERENT_PANICLOG: 32768,
  EXCLAVE_PANIC: 65536,
  USERSPACE_INITIATED_PANIC: 131072,
  INTEGRATED_COPROC_INITIATED_PANIC: 262144,
  DEVICE_INFO_READ_FAILED: 524288,
};

declare const tDescriptorType: {
  Device: 1,
  Configuration: 2,
  String: 3,
  Interface: 4,
  Endpoint: 5,
  DeviceQualifier: 6,
  OtherSpeedConfiguration: 7,
  InterfacePower: 8,
  OTG: 9,
  Debug: 10,
  InterfaceAssociation: 11,
  BOS: 15,
  DeviceCapability: 16,
  Hub: 41,
  SuperSpeedHub: 42,
  SuperSpeedUSBEndpointCompanion: 48,
  SuperSpeedPlusIsochronousEndpointCompanion: 49,
};

declare const airship_acipc_ipc_error_flag: {
  DEVICE_SIGNALLED: 1,
  UNEXPECTED_TRANSPORT_REVOCATION: 2,
  SYSTEM_FAILURE: 4,
  UNEXPECTED_IPC_STATUS: 8,
  UNEXPECTED_SLEEP_STATUS: 16,
  RUNNING_TIMEOUT: 32,
  BAD_TR_TI_UPDATE: 64,
  BAD_INPLACE_COMPLETION: 128,
  BAD_CR_HI_UPDATE: 256,
  BAD_CD: 512,
};

declare const cs_launch_type_t: {
  NONE: 0,
  SYSTEM_SERVICE: 1,
  SYSDIAGNOSE: 2,
  APPLICATION: 3,
};

declare const tIOPCIAccessOptions: {
  LatencyTolerantHint: 1,
  WriteCombining: 2,
};

declare const lck_sleep_action_t: {
  DEFAULT: 0,
  UNLOCK: 1,
  SHARED: 2,
  EXCLUSIVE: 4,
  SPIN: 8,
  PROMOTED_PRI: 16,
  SPIN_ALWAYS: 32,
};

declare const generic_snapshot_flags: {
  User64_p: 1,
  Kernel64_p: 2,
};

declare const airship_acipc_boot_state: {
  UNAVAILABLE: 0,
  READY: 1,
  IMAGE_SENT: 2,
  IMAGE_DONE: 3,
  DEAD_UNSETTLED: 4,
  DEAD_SETTLED: 5,
  EDISCONNECTED: 6,
};

declare const airship_driver_error: {
  IpcErrorOccurred: 1,
  IpcSetTransportFailed: 2,
  IpcPowerOffTimedOut: 4,
  IpcPowerOnTimedOut: 8,
  DevicePowerOffTimedOut: 16,
  DevicePowerOnTimedOut: 32,
};

declare const tUSBHostConnectorType: {
  A: 0,
  MiniAB: 1,
  ExpressCard: 2,
  USB3A: 3,
  USB3B: 4,
  USB3MicroB: 5,
  USB3MicroAB: 6,
  USB3PowerB: 7,
  USBTypeC: 9,
  Unknown: 254,
  Proprietary: 255,
};

declare const airship_acipc_tr_sync_operation: {
  FLUSH_TRANSFERS: 1,
  PROCESS_TI_UPDATE: 2,
  FETCH_COMPLETIONS: 4,
};

declare const IOUSBGetEndpointDescriptorOptions: {
  Original: 0,
  CurrentPolicy: 1,
};

declare const atapiConfig: {
  DRQSlow: 0,
  IRQPacket: 1,
  DRQFast: 16,
  Unknown: 17,
};

declare const airship_driver_power_state: {
  ACTIVE: 0,
  DEVICE_SLEEP: 1,
  HOST_SLEEP: 2,
  HOST_SLEEP_WAIT: 3,
  HOST_WAKE_WAIT: 4,
};

declare const tIOPCIDeviceResetOptions: {
  None: 0,
  Terminate: 1,
};

declare const mach_assert_type_t: {
  T_DEFAULT: 0,
  T_3P: 1,
  T_3S: 2,
  T_3U: 3,
};

declare const panic_timing_t: {
  DEBUGGER_LOCK_ACQUIRED: 0,
  IPI_SENT: 1,
  CORES_HALTED: 2,
  PANIC_INFO_START: 3,
  STACKSHOT_START: 4,
  STACKSHOT_FINISHED: 5,
  PANIC_INFO_FINISHED: 6,
  COREDUMP_START: 7,
  COREDUMP_KERNEL_DUMP_FINISHED: 8,
  COREDUMP_SECURE_KERNEL_DUMP_FINISHED: 9,
  COREDUMP_COPROCESSORS_DUMP_FINISHED: 10,
  COREDUMP_USERSPACE_DUMP_FINISHED: 11,
  COREDUMP_FINISHED: 12,
  MAX: 13,
};

declare const tDeviceRequestRecipient: {
  Device: 0,
  Interface: 1,
  Endpoint: 2,
  Other: 3,
};

declare const ipsec_offload_proto: {
  ESP: 50,
  AH: 51,
};

declare const telemetry_vm_fault_flags_t: {
  TM_VMF_BASE: 0,
};

declare const tEndpointUsageType: {
  InterruptPeriodic: 0,
  InterruptNotification: 1,
  InterruptReserved1: 2,
  InterruptReserved2: 3,
  IsocData: 0,
  IsocFeedback: 1,
  IsocImplicit: 2,
  IsocReserved: 3,
};

declare const SCSIParallelMessages: {
  TASK_COMPLETE: 0,
  EXTENDED_MESSAGE: 1,
  SAVE_DATA_POINTER: 2,
  RESTORE_POINTERS: 3,
  DISCONNECT: 4,
  INITIATOR_DETECTED_ERROR: 5,
  MESSAGE_REJECT: 7,
  NO_OPERATION: 8,
  MESSAGE_PARITY_ERROR: 9,
  IGNORE_WIDE_RESIDUE: 35,
  QAS_REQUEST: 85,
  IDENTIFY: 128,
  MODIFY_DATA_POINTER: 0,
  SYNCHONOUS_DATA_TRANSFER_REQUEST: 1,
  WIDE_DATA_TRANSFER_REQUEST: 3,
  PARALLEL_PROTOCOL_REQUEST: 4,
  ACA: 36,
  HEAD_OF_QUEUE: 33,
  LINKED_COMMAND_COMPLETE: 10,
  ORDERED: 34,
  SIMPLE: 32,
  ABORT_TASK: 13,
  ABORT_TASK_SET: 6,
  CLEAR_ACA: 22,
  CLEAR_TASK_SET: 14,
  LOGICAL_UNIT_RESET: 23,
  TARGET_RESET: 12,
};

declare const IOFWSBP2UserClientCommandCodes: {
  Open: 0,
  Close: 1,
  CreateLogin: 2,
  ReleaseLogin: 3,
  SubmitLogin: 4,
  SubmitLogout: 5,
  SetLoginFlags: 6,
  GetMaxCommandBlockSize: 7,
  GetLoginID: 8,
  SetReconnectTime: 9,
  SetMaxPayloadSize: 10,
  CreateORB: 11,
  ReleaseORB: 12,
  SubmitORB: 13,
  SetCommandFlags: 14,
  SetMaxORBPayloadSize: 15,
  SetCommandTimeout: 16,
  SetCommandGeneration: 17,
  SetToDummy: 18,
  SetCommandBuffersAsRanges: 19,
  ReleaseCommandBuffers: 20,
  SetCommandBlock: 21,
  CreateMgmtORB: 22,
  ReleaseMgmtORB: 23,
  SubmitMgmtORB: 24,
  MgmtORBSetCommandFunction: 25,
  MgmtORBSetManageeORB: 26,
  MgmtORBSetManageeLogin: 27,
  MgmtORBSetResponseBuffer: 28,
  LSIWorkaroundSetCommandBuffersAsRanges: 29,
  MgmtORBLSIWorkaroundSyncBuffersForOutput: 30,
  MgmtORBLSIWorkaroundSyncBuffersForInput: 31,
  OpenWithSessionRef: 32,
  GetSessionRef: 33,
  RingDoorbell: 34,
  EnableUnsolicitedStatus: 35,
  SetBusyTimeoutRegisterValue: 36,
  SetORBRefCon: 37,
  SetPassword: 38,
  SetMessageCallback: 39,
  SetLoginCallback: 40,
  SetLogoutCallback: 41,
  SetUnsolicitedStatusNotify: 42,
  SetStatusNotify: 43,
  SetMgmtORBCallback: 44,
  SubmitFetchAgentReset: 45,
  SetFetchAgentWriteCompletion: 46,
  NumCommands: 47,
};

declare const kcd_compression_type_t: {
  NONE: 0,
  ZLIB: 1,
};

declare const IOPCISaveDeviceStateOptions: {
  kPCIConfigShadowPermanent: -2147483648,
};

declare const thread_selfcounts_kind_t: {
  CPI: 1,
  CPI_PER_PERF_LEVEL: 2,
  TIME_CPI: 3,
  TIME_CPI_PER_PERF_LEVEL: 4,
  TIME_ENERGY_CPI: 5,
  TIME_ENERGY_CPI_PER_PERF_LEVEL: 6,
};

declare const nfs_supported_kerberos_etypes: {
  DES3_CBC_SHA1_KD: 16,
  AES128_CTS_HMAC_SHA1_96: 17,
  AES256_CTS_HMAC_SHA1_96: 18,
};

declare const ipsec_offload_ip_version: {
  V4: 4,
  V6: 6,
};

declare const airship_driver_power_target: {
  ACTIVE: 0,
  ACTIVE_PREVENTING_DEVICE_SLEEP: 1,
  HOST_SLEEP: 2,
};

declare const airship_acipc_auxiliary_context_state_detail_flag: {
  UNAVAILABLE_EXECSTAGE: 1,
  UNAVAILABLE_CONFLICT: 2,
  UNAVAILABLE_DEPENDENCY: 4,
  DEAD_OPENREJECT: 8,
  DEAD_BYREQUEST: 16,
  DEAD_DEVICERESET: 32,
  DEAD_EXECSTAGE: 64,
};

declare const IODebuggerLockState: {
  kIODebuggerLockTaken: 1,
};

declare const ataOpcode: {
  NoOp: 0,
  FnExecIO: 1,
  PIFnExecIO: 2,
  FnRegAccess: 3,
  FnQFlush: 4,
  FnBusReset: 5,
};

declare const hv_volatile_state_t: {
  HV_DEBUG_STATE: 0,
};

declare const ecc_flags_t: {
  IS_UNCORRECTABLE: 0,
  IS_CORRECTABLE: 1,
  TYPE_MASK: 1,
  DB_CORRUPTED: 2,
  IS_TEST_ERROR: 4,
  DB_ONLY: 8,
  REMOVE_ADDR: 16,
  NONE: 0,
};

declare const kdebug_flags_t: {
  PIDCHECK: 16,
  MAPINIT: 32,
  PIDEXCLUDE: 64,
  LP64: 256,
  CONTINUOUS_TIME: 512,
  DISABLE_COPROCS: 1024,
  MATCH_DISABLE: 2048,
  TYPEFILTER_CHECK: 4194304,
  DEBUGID_64: 8388608,
  BUFINIT: -2147483648,
};

declare const cluster_type_t: {
  CLUSTER_TYPE_INVALID: -1,
  CLUSTER_TYPE_SMP: 0,
  CLUSTER_TYPE_E: 1,
  CLUSTER_TYPE_P: 2,
  CLUSTER_TYPE_M: 3,
  CLUSTER_TYPE_MP: 4,
  MAX_CPU_TYPES: 5,
};

declare const ex_cb_class_t: {
  ILLEGAL_INSTR_SET: 0,
  MAX: 1,
};

declare const in6_clat46_evhdlr_code_t: {
  V4_FLOW: 0,
  V6_ADDR_CONFFAIL: 1,
};

declare const tEndpointSynchronizationType: {
  None: 0,
  Asynchronous: 1,
  Adaptive: 2,
  Synchronous: 3,
};

declare const airship_buffer_direction: {
  IN: 0,
  OUT: 1,
  INOUT: 2,
};

declare const hvg_hcall_dump_option_t: {
  HVG_HCALL_DUMP_OPTION_REGULAR: 1,
};

declare const airship_daleipc_channel_state: {
  UNAVAILABLE: 0,
  AVAILABLE: 1,
  STARTED: 2,
  STOPPED: 3,
  DEAD: 4,
};

declare const telemetry_page_grab_t: {
  U: 1,
  IO: 2,
};

declare const socd_client_trace_code_xnu_t: {
  PANIC: 0,
  START_IOKIT: 1,
  PLATFORM_ACTION: 2,
  PM_SET_POWER_STATE: 3,
  PM_INFORM_POWER_CHANGE: 4,
  STACKSHOT: 5,
  PM_SET_POWER_STATE_ACK: 6,
  PM_INFORM_POWER_CHANGE_ACK: 7,
  KERNEL_STATE_PANIC: 8,
  PANIC_BACKTRACE: 9,
  MAX: 10,
};

declare const SCSIParallelFeature: {
  WideDataTransfer: 0,
  SynchronousDataTransfer: 1,
  QuickArbitrationAndSelection: 2,
  DoubleTransitionDataTransfers: 3,
  InformationUnitTransfers: 4,
  TotalFeatureCount: 5,
};

declare const tInternalUSBHostConnectionSpeed: {
  Low: 0,
  Full: 1,
  High: 2,
  Super: 3,
  SuperPlus: 4,
  SuperPlusBy2: 5,
  Tunneled40Gb: 6,
  Tunneled80Gb: 7,
  Count: 8,
};

declare const dot3Vendors: {
  AMD: 1,
  Intel: 2,
  National: 4,
  Fujitsu: 5,
  Digital: 6,
  WesternDigital: 7,
};

declare const pal_hib_restore_stage_t: {
  pal_hib_restore_stage_dram_pages: 0,
  pal_hib_restore_stage_preview_pages: 1,
  pal_hib_restore_stage_handoff_data: 2,
};

declare const telemetry_page_grab_flags_t: {
  TM_PGF_BASE: 0,
};

declare const kd_callback_type: {
  KDEBUG_ENABLED: 0,
  KDEBUG_DISABLED: 1,
  SYNC_FLUSH: 2,
  TYPEFILTER_CHANGED: 3,
  SNAPSHOT_STATE: 4,
};

declare const airship_acipc_ring_state_detail_flag: {
  UNAVAILABLE_EXECSTAGE: 1,
  UNAVAILABLE_CONFLICT: 2,
  UNAVAILABLE_DEPENDENCY: 4,
  DEAD_OPENREJECT: 8,
  DEAD_BYREQUEST: 16,
  DEAD_DEVICERESET: 32,
  DEAD_EXECSTAGE: 64,
  DEAD_CONTEXT: 128,
};

declare const IOUSBHostCIEndpointState: {
  Destroyed: 0,
  Halted: 1,
  Paused: 2,
  Active: 3,
};

declare const lck_rw_type_t: {
  SHARED: 1,
  EXCLUSIVE: 2,
};

declare const thread_call_priority_t: {
  HIGH: 0,
  KERNEL: 1,
  USER: 2,
  LOW: 3,
  KERNEL_HIGH: 4,
};

declare const os_log_coproc_reg_t: {
  os_log_coproc_register_memory: 0,
  os_log_coproc_register_harvest_fs_ftab: 1,
};

declare const libsptm_error_t: {
  SUCCESS: 0,
  NOT_INITTED: 1,
  INVALID_ARG: 2,
  TYPE_MISMATCH: 3,
  FAILURE: 4,
};

declare const EFI_RESET_TYPE: {
  Cold: 0,
  Warm: 1,
  Shutdown: 2,
};

declare const tDeviceCapabilityType: {
  Wireless: 1,
  USB20Extension: 2,
  SuperSpeed: 3,
  ContainerID: 4,
  Platform: 5,
  PowerDelivery: 6,
  BatteryInfo: 7,
  PdConsumerPort: 8,
  PdProviderPort: 9,
  SuperSpeedPlus: 10,
  PrecisionMeasurement: 11,
  WirelessExt: 12,
  Billboard: 13,
  BillboardAltMode: 15,
};

declare const IONVRAMVariableType: {
  Boolean: 1,
  Number: 2,
  String: 3,
  Data: 4,
};

declare const priority_queue_entry_sched_modifier_t: {
  NONE: 0,
  PREEMPTED: 1,
};

declare const IOCircularDataQueueCreateOptions: {
  Consumer: 1,
  Producer: 2,
};

declare const IOUSBHostCIPortState: {
  Off: 0,
  Powered: 1,
  Suspended: 2,
  Active: 3,
};

declare const IOAVCUnitTypes: {
  VideoMonitor: 0,
  Audio: 1,
  Printer: 2,
  DiskRecorder: 3,
  TapeRecorder: 4,
  Tuner: 5,
  VideoCamera: 7,
  CameraStorage: 11,
  VendorUnique: 28,
  NumSubUnitTypes: 32,
};

declare const airship_acipc_health_status_flag: {
  AIRSHIP_ACIPC_HEALTH_STATUS_ERROR_DOORBELL_COORDINATOR: 1,
};

declare const stackshot_device_lock_flags_t: {
  stackshot_device_after_first_unlock: 1,
};

declare const backtrace_flags_t: {
  NONE: 0,
  KERN_INTERRUPTED: 1,
};

declare const airship_acipc_cr_mirror_element_type: {
  COMPLETION_RECORD: 0,
  RAW_DESCRIPTOR: 1,
};

declare const hvg_hcall_code_t: {
  TRIGGER_DUMP: 1,
  SET_COREDUMP_DATA: 2,
  GET_MABS_OFFSET: 3,
  GET_BOOTSESSIONUUID: 4,
  VCPU_WFK: 5,
  VCPU_KICK: 6,
  COUNT: 7,
};

declare const tcp_connection_client_accurate_ecn_state_t: {
  tcp_connection_client_accurate_ecn_invalid: 0,
  tcp_connection_client_accurate_ecn_feature_disabled: 1,
  tcp_connection_client_accurate_ecn_feature_enabled: 2,
  tcp_connection_client_classic_ecn_available: 3,
  tcp_connection_client_ecn_not_available: 4,
  tcp_connection_client_accurate_ecn_negotiation_blackholed: 5,
  tcp_connection_client_accurate_ecn_ace_bleaching_detected: 6,
  tcp_connection_client_accurate_ecn_negotiation_success: 7,
  tcp_connection_client_accurate_ecn_negotiation_success_ect_mangling_detected: 8,
  tcp_connection_client_accurate_ecn_negotiation_success_ect_bleaching_detected: 9,
};

declare const socd_client_trace_class_t: {
  XNU: 0,
  WDT: 1,
  SOC: 2,
  MAX: 3,
};

declare const gssd_nametype: {
  STRING_NAME: 0,
  EXPORT: 1,
  ANONYMOUS: 2,
  HOSTBASED: 3,
  USER: 4,
  MACHINE_UID: 5,
  STRING_UID: 6,
  KRB5_PRINCIPAL: 7,
  KRB5_REFERRAL: 8,
  NTLM_PRINCIPAL: 9,
  NTLM_BLOB: 10,
  UUID: 11,
};

declare const airship_acipc_ring_state: {
  UNAVAILABLE: 0,
  AVAILABLE: 1,
  OPENING: 2,
  OPEN: 3,
  CLOSING: 4,
  LIMBO: 5,
  DEAD_UNSETTLED: 6,
  DEAD_SETTLED: 7,
  EDISCONNECTED: 8,
};

declare const TerminationState: {
  NotTerminated: 0,
  NeedsTermination: 1,
  Terminated: 2,
};

declare const cpu_event: {
  CPU_BOOT_REQUESTED: 0,
  CPU_BOOTED: 1,
  CPU_ACTIVE: 2,
  CLUSTER_ACTIVE: 3,
  CPU_EXIT_REQUESTED: 4,
  CPU_DOWN: 5,
  CLUSTER_EXIT_REQUESTED: 6,
  CPU_EXITED: 7,
  PLATFORM_QUIESCE: 8,
  PLATFORM_ACTIVE: 9,
  PLATFORM_HALT_RESTART: 10,
  PLATFORM_PANIC: 11,
  PLATFORM_PANIC_SYNC: 12,
  PLATFORM_PRE_SLEEP: 13,
  PLATFORM_POST_RESUME: 14,
};

declare const IOPCIMemoryRange: {
  BAR0: 0,
  BAR1: 1,
  BAR2: 2,
  BAR3: 3,
  BAR4: 4,
  BAR5: 5,
  ExpansionROM: 6,
};

declare const airship_proxima_platform: {
  POR: 0,
  AlphaPrimeFPGA: 1,
  BetaPrimeFPGA: 2,
  Protium: 3,
  Unknown: -1,
};

declare const _IOAudioDevicePowerState: {
  Sleep: 0,
  Idle: 1,
  Active: 2,
};

declare const EFI_MEMORY_TYPE: {
  ReservedMemoryType: 0,
  LoaderCode: 1,
  LoaderData: 2,
  BootServicesCode: 3,
  BootServicesData: 4,
  RuntimeServicesCode: 5,
  RuntimeServicesData: 6,
  ConventionalMemory: 7,
  UnusableMemory: 8,
  ACPIReclaimMemory: 9,
  ACPIMemoryNVS: 10,
  MemoryMappedIO: 11,
  MemoryMappedIOPortSpace: 12,
  PalCode: 13,
  MaxMemoryType: 14,
};

declare const kf_override_flag_t: {
  SERIAL_OVRD: 2,
  PMAPV_OVRD: 4,
  MATV_OVRD: 8,
  STACKSHOT_OVRD: 16,
  COMPRSV_OVRD: 32,
  INTERRUPT_MASKED_DEBUG_OVRD: 64,
  TRAPTRACE_OVRD: 128,
  IOTRACE_OVRD: 256,
  INTERRUPT_MASKED_DEBUG_STACKSHOT_OVRD: 512,
  SCHED_HYGIENE_DEBUG_PMC_OVRD: 1024,
  MACH_ASSERT_OVRD: 2048,
  MADVISE_FREE_DEBUG_OVRD: 4096,
  DISABLE_FP_POPC_ON_PGFLT: 8192,
  DISABLE_PROD_TRC_VALIDATION: 16384,
  IO_TIMEOUT_OVRD: 32768,
  PREEMPTION_DISABLED_DEBUG_OVRD: 65536,
  DISABLE_PROCREF_TRACKING_OVRD: 131072,
  COMPRESSOR_AGE_TRACKING_OVRD: 262144,
};

declare const ataFlags: {
  bATAFlagQuiesce: 20,
  bATAFlagNoIRQ: 19,
  bATAFlag48BitLBA: 18,
  bATAFlagDMAQueued: 17,
  bATAFlagOverlapped: 16,
  bATAFlagUseConfigSpeed: 15,
  bATAFlagByteSwap: 14,
  bATAFlagIORead: 13,
  bATAFlagIOWrite: 12,
  bATAFlagTFAccessResult: 8,
  bATAFlagUseDMA: 7,
  bATAFlagProtocolATAPI: 5,
  bATAFlagImmediate: 1,
  bATAFlagTFAccess: 0,
  mATAFlagQuiesce: 1048576,
  mATAFlagUseNoIRQ: 524288,
  mATAFlag48BitLBA: 262144,
  mATAFlagDMAQueued: 131072,
  mATAFlagOverlapped: 65536,
  mATAFlagUseConfigSpeed: 32768,
  mATAFlagByteSwap: 16384,
  mATAFlagIORead: 8192,
  mATAFlagIOWrite: 4096,
  mATAFlagTFAccessResult: 256,
  mATAFlagUseDMA: 128,
  mATAFlagProtocolATAPI: 32,
  mATAFlagImmediate: 2,
  mATAFlagTFAccess: 1,
};

declare const hv_trap_type_t: {
  ASK_: 0,
  HREAD_: 1,
};

declare const tUSBHostPortConnectable: {
  Not: 0,
  kUSBHostPortConnectable: 1,
};

declare const libsptm_cpu_state_t: {
  SPTM_INTERRUPTED: 0,
  PANIC_SPIN: 1,
};

declare class cpc_cycles_instrs {
  constructor(init?: cpc_cycles_instrs);
}

declare class cpc_counter {
  constructor(init?: cpc_counter);
}

declare class _cpc_x86_64_cpmu_regs {
  constructor(init?: _cpc_x86_64_cpmu_regs);
  cxcr_global_ctrl: number;
  cxcr_fixed_ctrl: number;
  cxcr_evtsel: unknown /* const array */;
}

declare class __Reply__mach_gss_unhold_cred_t {
  constructor(init?: __Reply__mach_gss_unhold_cred_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  major_stat: number;
  minor_stat: number;
}

declare class __Reply__mach_gss_hold_cred_t {
  constructor(init?: __Reply__mach_gss_hold_cred_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  major_stat: number;
  minor_stat: number;
}

declare class __Reply__mach_gss_init_sec_context_v3_t {
  constructor(init?: __Reply__mach_gss_init_sec_context_v3_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  key: mach_msg_ool_descriptor_t;
  outtoken: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  gssd_flags: number;
  context: number;
  cred_handle: number;
  ret_flags: number;
  keyCnt: number;
  outtokenCnt: number;
  displaynameOffset: number;
  displaynameCnt: number;
  displayname: unknown /* const array */;
  major_stat: number;
  minor_stat: number;
}

declare class __Reply__mach_gss_init_sec_context_v2_t {
  constructor(init?: __Reply__mach_gss_init_sec_context_v2_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  key: mach_msg_ool_descriptor_t;
  outtoken: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  gssd_flags: number;
  context: number;
  cred_handle: number;
  ret_flags: number;
  keyCnt: number;
  outtokenCnt: number;
  displaynameOffset: number;
  displaynameCnt: number;
  displayname: unknown /* const array */;
  major_stat: number;
  minor_stat: number;
}

declare class __Reply__mach_gss_init_sec_context_t {
  constructor(init?: __Reply__mach_gss_init_sec_context_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  key: mach_msg_ool_descriptor_t;
  outtoken: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  context: number;
  cred_handle: number;
  ret_flags: number;
  keyCnt: number;
  outtokenCnt: number;
  major_stat: number;
  minor_stat: number;
}

declare class __Request__mach_gss_lookup_t {
  constructor(init?: __Request__mach_gss_lookup_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  uid: number;
  asid: number;
}

declare class __Request__mach_gss_hold_cred_t {
  constructor(init?: __Request__mach_gss_hold_cred_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  princ: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  mech: interop.Enum<typeof gssd_mechtype>;
  nt: interop.Enum<typeof gssd_nametype>;
  princCnt: number;
}

declare class __Request__mach_gss_log_error_t {
  constructor(init?: __Request__mach_gss_log_error_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  mntOffset: number;
  mntCnt: number;
  mnt: unknown /* const array */;
  uid: number;
  sourceOffset: number;
  sourceCnt: number;
  source: unknown /* const array */;
  major_stat: number;
  minor_stat: number;
}

declare class __Request__mach_gss_init_sec_context_t {
  constructor(init?: __Request__mach_gss_init_sec_context_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  intoken: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  mech: interop.Enum<typeof gssd_mechtype>;
  intokenCnt: number;
  uid: number;
  princ_namestrOffset: number;
  princ_namestrCnt: number;
  princ_namestr: unknown /* const array */;
  svc_namestrOffset: number;
  svc_namestrCnt: number;
  svc_namestr: unknown /* const array */;
  flags: number;
  gssd_flags: number;
  context: number;
  cred_handle: number;
}

declare class gz_header_s {
  constructor(init?: gz_header_s);
  text: number;
  time: number;
  xflags: number;
  os: number;
  extra: interop.Pointer;
  extra_len: number;
  extra_max: number;
  name: interop.Pointer;
  name_max: number;
  comment: interop.Pointer;
  comm_max: number;
  hcrc: number;
  done: number;
}

declare class __OSMallocTag__ {
  constructor(init?: __OSMallocTag__);
}

declare class sha1_ctxt {
  constructor(init?: sha1_ctxt);
  h: unnamed_1304348816865981695;
  c: unnamed_4036696868773053385;
  m: unnamed_10211279379047170458;
  count: number;
}

declare class esptail {
  constructor(init?: esptail);
  esp_padlen: number;
  esp_nxt: number;
}

declare class ipcomp {
  constructor(init?: ipcomp);
  comp_nxt: number;
  comp_flags: number;
  comp_cpi: number;
}

declare class ipsec_wake_pkt_event_data {
  constructor(init?: ipsec_wake_pkt_event_data);
  wake_uuid: unknown /* const array */;
}

declare class ipsec_wake_pkt_info {
  constructor(init?: ipsec_wake_pkt_info);
  wake_pkt: unknown /* const array */;
  wake_uuid: unknown /* const array */;
  wake_pkt_spi: number;
  wake_pkt_seq: number;
  wake_pkt_len: number;
}

declare class ipsecstat {
  constructor(init?: ipsecstat);
  in_success: number;
  in_polvio: number;
  in_nosa: number;
  in_inval: number;
  in_nomem: number;
  in_badspi: number;
  in_ahreplay: number;
  in_espreplay: number;
  in_ahauthsucc: number;
  in_ahauthfail: number;
  in_espauthsucc: number;
  in_espauthfail: number;
  in_esphist: unknown /* const array */;
  in_ahhist: unknown /* const array */;
  in_comphist: unknown /* const array */;
  out_success: number;
  out_polvio: number;
  out_nosa: number;
  out_inval: number;
  out_nomem: number;
  out_noroute: number;
  out_esphist: unknown /* const array */;
  out_ahhist: unknown /* const array */;
  out_comphist: unknown /* const array */;
  out_notmature: number;
}

declare class unnamed_11757426018077089854 {
  constructor(init?: unnamed_11757426018077089854);
  linkmtu: number;
  maxmtu: number;
  basereachable: number;
  reachable: number;
  retrans: number;
  flags: number;
  recalctm: number;
  chlim: number;
  receivedra: number;
  collision_count: number;
}

declare class in6_defrouter {
  constructor(init?: in6_defrouter);
  rtaddr: sockaddr_in6;
  flags: number;
  stateflags: number;
  rtlifetime: number;
  expire: number;
  if_index: number;
}

declare class arm_debug_info_t {
  constructor(init?: arm_debug_info_t);
  memory_mapped_core_debug: number;
  coprocessor_core_debug: number;
  num_watchpoint_pairs: number;
  num_breakpoint_pairs: number;
}

declare class arm_vfpsaved_state {
  constructor(init?: arm_vfpsaved_state);
}

declare class perfcontrol_state {
  constructor(init?: perfcontrol_state);
  opaque: unknown /* const array */;
}

declare class relocation_info {
  constructor(init?: relocation_info);
  r_address: number;
  r_symbolnum: number;
  r_pcrel: number;
  r_length: number;
  r_extern: number;
  r_type: number;
}

declare class nlist_64 {
  constructor(init?: nlist_64);
  n_un: unnamed_4351389518475781470;
  n_type: number;
  n_sect: number;
  n_desc: number;
  n_value: number;
}

declare class nlist {
  constructor(init?: nlist);
  n_un: unnamed_2667027567974653886;
  n_type: number;
  n_sect: number;
  n_desc: number;
  n_value: number;
}

declare class dyld_chained_import {
  constructor(init?: dyld_chained_import);
  lib_ordinal: number;
  weak_import: number;
  name_offset: number;
}

declare class dyld_chained_ptr_arm64e_shared_cache_auth_rebase {
  constructor(init?: dyld_chained_ptr_arm64e_shared_cache_auth_rebase);
  runtimeOffset: number;
  diversity: number;
  addrDiv: number;
  keyIsData: number;
  next: number;
  auth: number;
}

declare class dyld_chained_ptr_32_firmware_rebase {
  constructor(init?: dyld_chained_ptr_32_firmware_rebase);
  target: number;
  next: number;
}

declare class dyld_chained_ptr_32_cache_rebase {
  constructor(init?: dyld_chained_ptr_32_cache_rebase);
  target: number;
  next: number;
}

declare class dyld_chained_ptr_32_bind {
  constructor(init?: dyld_chained_ptr_32_bind);
  ordinal: number;
  addend: number;
  next: number;
  bind: number;
}

declare class dyld_chained_ptr_64_bind {
  constructor(init?: dyld_chained_ptr_64_bind);
  ordinal: number;
  addend: number;
  reserved: number;
  next: number;
  bind: number;
}

declare class dyld_chained_ptr_arm64e_auth_bind24 {
  constructor(init?: dyld_chained_ptr_arm64e_auth_bind24);
  ordinal: number;
  zero: number;
  diversity: number;
  addrDiv: number;
  key: number;
  next: number;
  bind: number;
  auth: number;
}

declare class dyld_chained_ptr_arm64e_bind24 {
  constructor(init?: dyld_chained_ptr_arm64e_bind24);
  ordinal: number;
  zero: number;
  addend: number;
  next: number;
  bind: number;
  auth: number;
}

declare class dyld_chained_ptr_arm64e_auth_bind {
  constructor(init?: dyld_chained_ptr_arm64e_auth_bind);
  ordinal: number;
  zero: number;
  diversity: number;
  addrDiv: number;
  key: number;
  next: number;
  bind: number;
  auth: number;
}

declare class dyld_chained_ptr_arm64e_auth_rebase {
  constructor(init?: dyld_chained_ptr_arm64e_auth_rebase);
  target: number;
  diversity: number;
  addrDiv: number;
  key: number;
  next: number;
  bind: number;
  auth: number;
}

declare class dyld_chained_starts_in_image {
  constructor(init?: dyld_chained_starts_in_image);
  seg_count: number;
  seg_info_offset: unknown /* const array */;
}

declare class __Request__kextd_ping_t {
  constructor(init?: __Request__kextd_ping_t);
  Head: mach_msg_header_t;
}

declare class __Reply__mach_memory_entry_region_info_t {
  constructor(init?: __Reply__mach_memory_entry_region_info_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  offset: number;
  size: number;
  infoCnt: number;
  info: unknown /* const array */;
}

declare class __Reply__mach_memory_entry_ownership_t {
  constructor(init?: __Reply__mach_memory_entry_ownership_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__mach_memory_entry_access_tracking_t {
  constructor(init?: __Reply__mach_memory_entry_access_tracking_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  access_tracking: number;
  access_tracking_reads: number;
  access_tracking_writes: number;
}

declare class __Reply__mach_memory_entry_purgable_control_t {
  constructor(init?: __Reply__mach_memory_entry_purgable_control_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  state: number;
}

declare class __Request__mach_memory_entry_region_info_t {
  constructor(init?: __Request__mach_memory_entry_region_info_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  offset: number;
  infoCnt: number;
}

declare class __Request__mach_memory_entry_purgable_control_t {
  constructor(init?: __Request__mach_memory_entry_purgable_control_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  control: number;
  state: number;
}

declare class __Reply__mach_vm_reallocate_t {
  constructor(init?: __Reply__mach_vm_reallocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  dst: number;
}

declare class __Reply__mach_vm_update_pointers_with_remote_tags_t {
  constructor(init?: __Reply__mach_vm_update_pointers_with_remote_tags_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  out_pointer_listCnt: number;
  out_pointer_list: unknown /* const array */;
}

declare class __Reply__mach_vm_deferred_reclamation_buffer_resize_t {
  constructor(init?: __Reply__mach_vm_deferred_reclamation_buffer_resize_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  bytes_reclaimed: number;
  next_deadline: number;
}

declare class __Reply__mach_vm_deferred_reclamation_buffer_flush_t {
  constructor(init?: __Reply__mach_vm_deferred_reclamation_buffer_flush_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  bytes_reclaimed: number;
  next_deadline: number;
}

declare class __Reply__mach_vm_remap_new_t {
  constructor(init?: __Reply__mach_vm_remap_new_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  target_address: number;
  cur_protection: number;
  max_protection: number;
}

declare class __Reply__mach_vm_purgable_control_t {
  constructor(init?: __Reply__mach_vm_purgable_control_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  state: number;
}

declare class __Reply__mach_vm_region_t {
  constructor(init?: __Reply__mach_vm_region_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  object_name: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  infoCnt: number;
  info: unknown /* const array */;
}

declare class internal_state {
  constructor(init?: internal_state);
  dummy: number;
}

declare class __Reply__mach_vm_region_recurse_t {
  constructor(init?: __Reply__mach_vm_region_recurse_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  address: number;
  size: number;
  nesting_depth: number;
  infoCnt: number;
  info: unknown /* const array */;
}

declare class __Reply__mach_vm_page_query_t {
  constructor(init?: __Reply__mach_vm_page_query_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  disposition: number;
  ref_count: number;
}

declare class __Reply__mach_vm_map_t {
  constructor(init?: __Reply__mach_vm_map_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  address: number;
}

declare class __Reply__mach_vm_behavior_set_t {
  constructor(init?: __Reply__mach_vm_behavior_set_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__mach_vm_copy_t {
  constructor(init?: __Reply__mach_vm_copy_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class list_head {
  constructor(init?: list_head);
  prev: interop.Pointer;
  next: interop.Pointer;
}

declare class __Reply__mach_vm_write_t {
  constructor(init?: __Reply__mach_vm_write_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__mach_vm_read_list_t {
  constructor(init?: __Reply__mach_vm_read_list_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  data_list: unknown /* const array */;
}

declare class __Reply__mach_vm_read_t {
  constructor(init?: __Reply__mach_vm_read_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  data: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  dataCnt: number;
}

declare class __Reply__mach_vm_inherit_t {
  constructor(init?: __Reply__mach_vm_inherit_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__mach_vm_allocate_t {
  constructor(init?: __Reply__mach_vm_allocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  address: number;
}

declare class __Request__mach_vm_update_pointers_with_remote_tags_t {
  constructor(init?: __Request__mach_vm_update_pointers_with_remote_tags_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  in_pointer_listCnt: number;
  in_pointer_list: unknown /* const array */;
  out_pointer_listCnt: number;
}

declare class __Request__mach_vm_deferred_reclamation_buffer_resize_t {
  constructor(init?: __Request__mach_vm_deferred_reclamation_buffer_resize_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  new_len: number;
}

declare class __Request__mach_vm_deferred_reclamation_buffer_allocate_t {
  constructor(init?: __Request__mach_vm_deferred_reclamation_buffer_allocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  len: number;
  max_len: number;
}

declare class in6_ondireq {
  constructor(init?: in6_ondireq);
  ifname: unknown /* const array */;
  ndi: unnamed_11757426018077089854;
}

declare class __Request__mach_vm_page_range_query_t {
  constructor(init?: __Request__mach_vm_page_range_query_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  dispositions: number;
  dispositions_count: number;
}

declare class __Request__mach_vm_page_info_t {
  constructor(init?: __Request__mach_vm_page_info_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  flavor: number;
  infoCnt: number;
}

declare class __Request__mach_vm_purgable_control_t {
  constructor(init?: __Request__mach_vm_purgable_control_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  control: number;
  state: number;
}

declare class __Request__mach_vm_region_t {
  constructor(init?: __Request__mach_vm_region_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  flavor: number;
  infoCnt: number;
}

declare class __Request__mach_vm_page_query_t {
  constructor(init?: __Request__mach_vm_page_query_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  offset: number;
}

declare class __Request__mach_vm_map_t {
  constructor(init?: __Request__mach_vm_map_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  object: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  mask: number;
  flags: number;
  offset: number;
  copy: number;
  cur_protection: number;
  max_protection: number;
  inheritance: number;
}

declare class __Request__mach_vm_msync_t {
  constructor(init?: __Request__mach_vm_msync_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  sync_flags: number;
}

declare class __Request__mach_vm_read_overwrite_t {
  constructor(init?: __Request__mach_vm_read_overwrite_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  data: number;
}

declare class __Request__mach_vm_copy_t {
  constructor(init?: __Request__mach_vm_copy_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  source_address: number;
  size: number;
  dest_address: number;
}

declare class __Request__mach_vm_write_t {
  constructor(init?: __Request__mach_vm_write_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  data: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  address: number;
  dataCnt: number;
}

declare class __Request__mach_vm_read_t {
  constructor(init?: __Request__mach_vm_read_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
}

declare class __Request__mach_vm_protect_t {
  constructor(init?: __Request__mach_vm_protect_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  set_maximum: number;
  new_protection: number;
}

declare class __Reply__clock_get_time_t {
  constructor(init?: __Reply__clock_get_time_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  cur_time: mach_timespec;
}

declare class __Request__clock_get_attributes_t {
  constructor(init?: __Request__clock_get_attributes_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  flavor: number;
  clock_attrCnt: number;
}

declare class __Reply__exception_raise_t {
  constructor(init?: __Reply__exception_raise_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__exception_raise_state_t {
  constructor(init?: __Request__exception_raise_state_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  exception: number;
  codeCnt: number;
  code: unknown /* const array */;
  flavor: number;
  old_stateCnt: number;
  old_state: unknown /* const array */;
}

declare class __Request__exception_raise_t {
  constructor(init?: __Request__exception_raise_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  thread: mach_msg_port_descriptor_t;
  task: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  exception: number;
  codeCnt: number;
  code: unknown /* const array */;
}

declare class catch_exc_subsystem {
  constructor(init?: catch_exc_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class __Reply__arcade_upcall_t {
  constructor(init?: __Reply__arcade_upcall_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  should_kill: number;
}

declare class __Request__arcade_upcall_t {
  constructor(init?: __Request__arcade_upcall_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  path: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  pathCnt: number;
  offset: number;
}

declare class __Reply__audit_triggers_t {
  constructor(init?: __Reply__audit_triggers_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__audit_analytics_t {
  constructor(init?: __Request__audit_analytics_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  caller_idOffset: number;
  caller_idCnt: number;
  caller_id: unknown /* const array */;
  caller_nameOffset: number;
  caller_nameCnt: number;
  caller_name: unknown /* const array */;
}

declare class __Reply__mach_voucher_extract_attr_content_t {
  constructor(init?: __Reply__mach_voucher_extract_attr_content_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  contentCnt: number;
  content: unknown /* const array */;
}

declare class __Request__mach_voucher_extract_attr_content_t {
  constructor(init?: __Request__mach_voucher_extract_attr_content_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  key: number;
  contentCnt: number;
}

declare class __Reply__mach_exception_raise_state_identity_t {
  constructor(init?: __Reply__mach_exception_raise_state_identity_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  flavor: number;
  new_stateCnt: number;
  new_state: unknown /* const array */;
}

declare class __Reply__mach_exception_raise_t {
  constructor(init?: __Reply__mach_exception_raise_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__mach_exception_raise_state_t {
  constructor(init?: __Request__mach_exception_raise_state_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  exception: number;
  codeCnt: number;
  code: unknown /* const array */;
  flavor: number;
  old_stateCnt: number;
  old_state: unknown /* const array */;
}

declare class __Request__mach_exception_raise_t {
  constructor(init?: __Request__mach_exception_raise_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  thread: mach_msg_port_descriptor_t;
  task: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  exception: number;
  codeCnt: number;
  code: unknown /* const array */;
}

declare class __Reply__vfs_resolve_reparent_with_audit_token_t {
  constructor(init?: __Reply__vfs_resolve_reparent_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__vfs_resolve_dir_t {
  constructor(init?: __Reply__vfs_resolve_dir_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__vfs_resolve_file_t {
  constructor(init?: __Reply__vfs_resolve_file_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__nspace_handle_t {
  constructor(init?: __Reply__nspace_handle_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  handler_error: number;
}

declare class __Request__vfs_resolve_file_t {
  constructor(init?: __Request__vfs_resolve_file_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  req_id: number;
  pid: number;
  op: number;
  offset: number;
  size: number;
  path: unknown /* const array */;
}

declare class __Request__nspace_handle_t {
  constructor(init?: __Request__nspace_handle_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  pid: number;
  path: unknown /* const array */;
}

declare class __Reply__check_task_access_t {
  constructor(init?: __Reply__check_task_access_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__find_code_signature_t {
  constructor(init?: __Request__find_code_signature_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  new_pid: number;
}

declare class __Request__sysdiagnose_notification_with_audit_token_t {
  constructor(init?: __Request__sysdiagnose_notification_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  flags: number;
}

declare class __Reply__clock_alarm_reply_t {
  constructor(init?: __Reply__clock_alarm_reply_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__clock_alarm_reply_t {
  constructor(init?: __Request__clock_alarm_reply_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  alarm_code: number;
  alarm_type: number;
  alarm_time: mach_timespec;
}

declare class __Reply__mcc_memory_error_notification_t {
  constructor(init?: __Reply__mcc_memory_error_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__mcc_memory_error_notification_t {
  constructor(init?: __Request__mcc_memory_error_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  event: mcc_ecc_event_t;
}

declare class __Request__memory_error_notification_t {
  constructor(init?: __Request__memory_error_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  event: ecc_event_t;
}

declare class shared_region_range_np {
  constructor(init?: shared_region_range_np);
  srr_address: number;
  srr_size: number;
}

declare class __Reply__upl_commit_t {
  constructor(init?: __Reply__upl_commit_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__upl_abort_range_t {
  constructor(init?: __Reply__upl_abort_range_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  empty: number;
}

declare class __Reply__upl_commit_range_t {
  constructor(init?: __Reply__upl_commit_range_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  empty: number;
}

declare class unnamed_1360006967418615942 {
  constructor(init?: unnamed_1360006967418615942);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  page_listCnt: number;
  page_list: unknown /* const array */;
}

declare class __Request__telemetry_notification_t {
  constructor(init?: __Request__telemetry_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  flags: number;
}

declare class coalition_notification_subsystem {
  constructor(init?: coalition_notification_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class __Reply__fairplayd_arcade_request_t {
  constructor(init?: __Reply__fairplayd_arcade_request_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__iocompressionstats_notification_t {
  constructor(init?: __Reply__iocompressionstats_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__iocompressionstats_notification_t {
  constructor(init?: __Request__iocompressionstats_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  flags: number;
}

declare class __Reply__doubleagent_list_xattrs_t {
  constructor(init?: __Reply__doubleagent_list_xattrs_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  err: number;
  result: list_xattrs_result;
}

declare class __Request__doubleagent_list_xattrs_t {
  constructor(init?: __Request__doubleagent_list_xattrs_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  file_port: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  file_size: number;
}

declare class __Reply__doubleagent_allocate_xattr_t {
  constructor(init?: __Reply__doubleagent_allocate_xattr_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  err: number;
  value_offset: number;
}

declare class __Request__doubleagent_lookup_xattr_t {
  constructor(init?: __Request__doubleagent_lookup_xattr_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  file_port: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  file_size: number;
  nameOffset: number;
  nameCnt: number;
  name: unknown /* const array */;
}

declare class __Reply__mach_notify_send_once_t {
  constructor(init?: __Reply__mach_notify_send_once_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__mach_notify_port_deleted_t {
  constructor(init?: __Reply__mach_notify_port_deleted_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__mach_notify_dead_name_t {
  constructor(init?: __Request__mach_notify_dead_name_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  name: number;
}

declare class dyld_chained_ptr_arm64e_bind {
  constructor(init?: dyld_chained_ptr_arm64e_bind);
  ordinal: number;
  zero: number;
  addend: number;
  next: number;
  bind: number;
  auth: number;
}

declare class __Request__mach_notify_no_senders_t {
  constructor(init?: __Request__mach_notify_no_senders_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  mscount: number;
}

declare class console_ops {
  constructor(init?: console_ops);
  putc: (p1: number, p2: boolean) => void | null;
  getc: (p1: boolean) => number | null;
}

declare class ipc_object {
  constructor(init?: ipc_object);
}

declare class airship_daleipc_uplink_packet_completion {
  constructor(init?: airship_daleipc_uplink_packet_completion);
  size: number;
  tag: number;
  channel_id: number;
}

declare class daleipc_device_controller {
  constructor(init?: daleipc_device_controller);
}

declare class daleipc_downlink_controller {
  constructor(init?: daleipc_downlink_controller);
}

declare class airship_acipc_auxiliary_context_offsets {
  constructor(init?: airship_acipc_auxiliary_context_offsets);
  context_info: number;
  peripheral_info: number;
  cr_hia: number;
  tr_tia: number;
  cr_tia: number;
  tr_hia: number;
  end: number;
}

declare class airship_acipc_auxiliary_context {
  constructor(init?: airship_acipc_auxiliary_context);
}

declare class airship_acipc_doorbell {
  constructor(init?: airship_acipc_doorbell);
}

declare class __Request__mach_gss_accept_sec_context_t {
  constructor(init?: __Request__mach_gss_accept_sec_context_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  intoken: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  intokenCnt: number;
  svc_namestrOffset: number;
  svc_namestrCnt: number;
  svc_namestr: unknown /* const array */;
  gssd_flags: number;
  context: number;
  cred_handle: number;
}

declare class airship_acipc_cr_mirror_element {
  constructor(init?: airship_acipc_cr_mirror_element);
  type: interop.Enum<typeof airship_acipc_cr_mirror_element_type>;
  data: airship_acipc_cr_mirror_element_data;
}

declare class airship_acipc_cr_mirror_raw_descriptor {
  constructor(init?: airship_acipc_cr_mirror_raw_descriptor);
  bytes: unknown /* const array */;
}

declare class airship_acipc_cr {
  constructor(init?: airship_acipc_cr);
}

declare class airship_acipc_tr {
  constructor(init?: airship_acipc_tr);
}

declare class airship_interrupt {
  constructor(init?: airship_interrupt);
}

declare class airship_client {
  constructor(init?: airship_client);
}

declare class airship_device_transport {
  constructor(init?: airship_device_transport);
}

declare class DTSavedScope {
  constructor(init?: DTSavedScope);
  nextScope: interop.Pointer;
  scope: interop.Pointer;
  entry: interop.Pointer;
  index: number;
}

declare class OpaqueDTEntry {
  constructor(init?: OpaqueDTEntry);
  nProperties: number;
  nChildren: number;
}

declare class scattered_relocation_info {
  constructor(init?: scattered_relocation_info);
  r_address: number;
  r_type: number;
  r_length: number;
  r_pcrel: number;
  r_scattered: number;
  r_value: number;
}

declare class DeviceTreeNodeProperty {
  constructor(init?: DeviceTreeNodeProperty);
  name: unknown /* const array */;
  length: number;
}

declare class EFI_SYSTEM_TABLE_64 {
  constructor(init?: EFI_SYSTEM_TABLE_64);
  Hdr: EFI_TABLE_HEADER;
  FirmwareVendor: number;
  FirmwareRevision: number;
  __pad: number;
  ConsoleInHandle: number;
  ConIn: number;
  ConsoleOutHandle: number;
  ConOut: number;
  StandardErrorHandle: number;
  StdErr: number;
  RuntimeServices: number;
  BootServices: number;
  NumberOfTableEntries: number;
  ConfigurationTable: number;
}

declare class EFI_CONFIGURATION_TABLE_64 {
  constructor(init?: EFI_CONFIGURATION_TABLE_64);
  VendorGuid: EFI_GUID;
  VendorTable: number;
}

declare class EFI_RUNTIME_SERVICES_64 {
  constructor(init?: EFI_RUNTIME_SERVICES_64);
  Hdr: EFI_TABLE_HEADER;
  GetTime: number;
  SetTime: number;
  GetWakeupTime: number;
  SetWakeupTime: number;
  SetVirtualAddressMap: number;
  ConvertPointer: number;
  GetVariable: number;
  GetNextVariableName: number;
  SetVariable: number;
  GetNextHighMonotonicCount: number;
  ResetSystem: number;
}

declare class EFI_TIME_CAPABILITIES {
  constructor(init?: EFI_TIME_CAPABILITIES);
  Resolution: number;
  Accuracy: number;
  SetsToZero: number;
}

declare class EFI_MEMORY_DESCRIPTOR {
  constructor(init?: EFI_MEMORY_DESCRIPTOR);
  Type: number;
  Pad: number;
  PhysicalStart: number;
  VirtualStart: number;
  NumberOfPages: number;
  Attribute: number;
}

declare class EFI_TIME {
  constructor(init?: EFI_TIME);
  Year: number;
  Month: number;
  Day: number;
  Hour: number;
  Minute: number;
  Second: number;
  Pad1: number;
  Nanosecond: number;
  TimeZone: number;
  Daylight: number;
  Pad2: number;
}

declare class EFI_GUID {
  constructor(init?: EFI_GUID);
  Data1: number;
  Data2: number;
  Data3: number;
  Data4: unknown /* const array */;
}

declare class boot_args {
  constructor(init?: boot_args);
  Revision: number;
  Version: number;
  efiMode: number;
  debugMode: number;
  flags: number;
  CommandLine: unknown /* const array */;
  MemoryMap: number;
  MemoryMapSize: number;
  MemoryMapDescriptorSize: number;
  MemoryMapDescriptorVersion: number;
  VideoV1: Boot_VideoV1;
  deviceTreeP: number;
  deviceTreeLength: number;
  kaddr: number;
  ksize: number;
  efiRuntimeServicesPageStart: number;
  efiRuntimeServicesPageCount: number;
  efiRuntimeServicesVirtualPageStart: number;
  efiSystemTable: number;
  kslide: number;
  performanceDataStart: number;
  performanceDataSize: number;
  keyStoreDataStart: number;
  keyStoreDataSize: number;
  bootMemStart: number;
  bootMemSize: number;
  PhysicalMemorySize: number;
  FSBFrequency: number;
  pciConfigSpaceBaseAddress: number;
  pciConfigSpaceStartBusNumber: number;
  pciConfigSpaceEndBusNumber: number;
  csrActiveConfig: number;
  csrCapabilities: number;
  boot_SMC_plimit: number;
  bootProgressMeterStart: number;
  bootProgressMeterEnd: number;
  Video: Boot_Video;
  apfsDataStart: number;
  apfsDataSize: number;
  KC_hdrs_vaddr: number;
  arvRootHashStart: number;
  arvRootHashSize: number;
  arvManifestStart: number;
  arvManifestSize: number;
  bsARVRootHashStart: number;
  bsARVRootHashSize: number;
  bsARVManifestStart: number;
  bsARVManifestSize: number;
  __reserved4: unknown /* const array */;
}

declare class boot_icon_element {
  constructor(init?: boot_icon_element);
  width: number;
  height: number;
  y_offset_from_center: number;
  data_size: number;
  __reserved1: unknown /* const array */;
  data: unknown /* const array */;
}

declare class Boot_Video {
  constructor(init?: Boot_Video);
  v_display: number;
  v_rowBytes: number;
  v_width: number;
  v_height: number;
  v_depth: number;
  v_rotate: number;
  v_resv_byte: unknown /* const array */;
  v_resv: unknown /* const array */;
  v_baseAddr: number;
}

declare class Boot_VideoV1 {
  constructor(init?: Boot_VideoV1);
  v_baseAddr: number;
  v_display: number;
  v_rowBytes: number;
  v_width: number;
  v_height: number;
  v_depth: number;
}

declare class specinfo {
  constructor(init?: specinfo);
  si_hashchain: interop.Pointer;
  si_specnext: interop.Pointer;
  si_flags: number;
  si_rdev: number;
  si_opencount: number;
  si_size: number;
  si_lastr: number;
  si_devsize: number;
  si_initted: number;
  si_throttleable: number;
  si_isssd: number;
  si_devbsdunit: number;
  si_throttle_mask: number;
  si_mountingowner: number;
}

declare class pal_hib_ctx {
  constructor(init?: pal_hib_ctx);
}

declare class static_if_key_false {
  constructor(init?: static_if_key_false);
  key: static_if_key;
}

declare class static_if_key_true {
  constructor(init?: static_if_key_true);
  key: static_if_key;
}

declare class __Reply__lockd_ping_t {
  constructor(init?: __Reply__lockd_ping_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__lockd_request_t {
  constructor(init?: __Reply__lockd_request_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__lockd_shutdown_t {
  constructor(init?: __Request__lockd_shutdown_t);
  Head: mach_msg_header_t;
}

declare class __Request__lockd_ping_t {
  constructor(init?: __Request__lockd_ping_t);
  Head: mach_msg_header_t;
}

declare class user32_sigaltstack {
  constructor(init?: user32_sigaltstack);
}

declare class __Reply__mach_vm_page_range_query_t {
  constructor(init?: __Reply__mach_vm_page_range_query_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  dispositions_count: number;
}

declare class user_ucontext32 {
  constructor(init?: user_ucontext32);
  uc_onstack: number;
  uc_sigmask: number;
  uc_stack: user32_sigaltstack;
  uc_link: number;
  uc_mcsize: number;
  uc_mcontext: number;
}

declare class user_ucontext64 {
  constructor(init?: user_ucontext64);
  uc_onstack: number;
  uc_sigmask: number;
  uc_stack: user64_sigaltstack;
  uc_link: number;
  uc_mcsize: number;
  uc_mcontext64: number;
}

declare class sbuf {
  constructor(init?: sbuf);
  s_buf: string | null;
  s_unused: interop.Pointer;
  s_size: number;
  s_len: number;
  s_flags: number;
}

declare class kd_threadmap {
  constructor(init?: kd_threadmap);
  thread: number;
  valid: number;
  command: unknown /* const array */;
}

declare class kd_cpumap_ext {
  constructor(init?: kd_cpumap_ext);
  cpu_id: number;
  flags: number;
  name: unknown /* const array */;
}

declare class kbufinfo_t {
  constructor(init?: kbufinfo_t);
  nkdbufs: number;
  nolog: number;
  flags: number;
  nkdthreads: number;
  bufid: number;
}

declare class thread {
  constructor(init?: thread);
}

declare class sflt_filter_ext {
  constructor(init?: sflt_filter_ext);
  sf_ext_len: number;
  sf_ext_accept: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  sf_ext_rsvd: unknown /* const array */;
}

declare class partition {
  constructor(init?: partition);
  p_size: number;
  p_offset: number;
  p_fsize: number;
  p_fstype: number;
  p_frag: number;
  __partition_u1: unnamed_16762558694368875046;
}

declare class unnamed_6405807422710198338 {
  constructor(init?: unnamed_6405807422710198338);
  un_d_boot0: string | null;
  un_d_boot1: string | null;
}

declare class disklabel {
  constructor(init?: disklabel);
  d_magic: number;
  d_type: number;
  d_subtype: number;
  d_typename: unknown /* const array */;
  d_un: unnamed_5383106350436660137;
  d_secsize: number;
  d_nsectors: number;
  d_ntracks: number;
  d_ncylinders: number;
  d_secpercyl: number;
  d_secperunit: number;
  d_sparespertrack: number;
  d_sparespercyl: number;
  d_acylinders: number;
  d_rpm: number;
  d_interleave: number;
  d_trackskew: number;
  d_cylskew: number;
  d_headswitch: number;
  d_trkseek: number;
  d_flags: number;
  d_drivedata: unknown /* const array */;
  d_spare: unknown /* const array */;
  d_magic2: number;
  d_checksum: number;
  d_npartitions: number;
  d_bbsize: number;
  d_sbsize: number;
  d_partitions: partition;
}

declare class ctl_event_data {
  constructor(init?: ctl_event_data);
  ctl_id: number;
  ctl_unit: number;
}

declare class lockf {
  constructor(init?: lockf);
  lf_flags: number;
  lf_type: number;
  lf_start: number;
  lf_end: number;
  lf_id: string | null;
  lf_head: interop.Pointer;
  lf_vnode: interop.Pointer;
  lf_next: interop.Pointer;
  lf_blkhd: locklist;
  lf_block: unnamed_11816978242320104484;
  lf_owner: interop.Pointer;
}

declare class user32_msqid_ds {
  constructor(init?: user32_msqid_ds);
  msg_perm: ipc_perm;
  msg_first: number;
  msg_last: number;
  msg_cbytes: number;
  msg_qnum: number;
  msg_qbytes: number;
  msg_lspid: number;
  msg_lrpid: number;
  msg_stime: number;
  msg_pad1: number;
  msg_rtime: number;
  msg_pad2: number;
  msg_ctime: number;
  msg_pad3: number;
  msg_pad4: unknown /* const array */;
}

declare class user64_msqid_ds {
  constructor(init?: user64_msqid_ds);
  msg_perm: ipc_perm;
  msg_first: number;
  msg_last: number;
  msg_cbytes: number;
  msg_qnum: number;
  msg_qbytes: number;
  msg_lspid: number;
  msg_lrpid: number;
  msg_stime: number;
  msg_pad1: number;
  msg_rtime: number;
  msg_pad2: number;
  msg_ctime: number;
  msg_pad3: number;
  msg_pad4: unknown /* const array */;
}

declare class mb_stat {
  constructor(init?: mb_stat);
  mbs_cnt: number;
  mbs_pad: number;
  mbs_class: unknown /* const array */;
}

declare class ombstat {
  constructor(init?: ombstat);
  m_mbufs: number;
  m_clusters: number;
  m_spare: number;
  m_clfree: number;
  m_drops: number;
  m_wait: number;
  m_drain: number;
  m_mtypes: unknown /* const array */;
  m_mcfail: number;
  m_mpfail: number;
  m_msize: number;
  m_mclbytes: number;
  m_minclsize: number;
  m_mlen: number;
  m_mhlen: number;
}

declare class timex {
  constructor(init?: timex);
  modes: number;
  offset: number;
  freq: number;
  maxerror: number;
  esterror: number;
  status: number;
  constant: number;
  precision: number;
  tolerance: number;
  ppsfreq: number;
  jitter: number;
  shift: number;
  stabil: number;
  jitcnt: number;
  calcnt: number;
  errcnt: number;
  stbcnt: number;
}

declare class ntptimeval {
  constructor(init?: ntptimeval);
  time: timespec;
  maxerror: number;
  esterror: number;
  tai: number;
  time_state: number;
}

declare class network_port_t {
  constructor(init?: network_port_t);
  np_receiver: number;
  np_owner: number;
  np_puid: np_uid_t;
  np_sid: np_uid_t;
}

declare class np_uid_t {
  constructor(init?: np_uid_t);
  np_uid_high: number;
  np_uid_low: number;
}

declare class reg_values {
  constructor(init?: reg_values);
  rv_value: number;
  rv_name: string | null;
}

declare class thsc_time_cpi {
  constructor(init?: thsc_time_cpi);
  ttci_instructions: number;
  ttci_cycles: number;
  ttci_user_time_mach: number;
  ttci_system_time_mach: number;
}

declare class thsc_cpi {
  constructor(init?: thsc_cpi);
  tcpi_instructions: number;
  tcpi_cycles: number;
}

declare class cl_direct_read_lock {
  constructor(init?: cl_direct_read_lock);
}

declare class ungraftdmg_args {
  constructor(init?: ungraftdmg_args);
  mountdir_l_: unknown /* const array */;
  mountdir: number;
  mountdir_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class map_with_linking_np_args {
  constructor(init?: map_with_linking_np_args);
  regions_l_: unknown /* const array */;
  regions: number;
  regions_r_: unknown /* const array */;
  region_count_l_: unknown /* const array */;
  region_count: number;
  region_count_r_: unknown /* const array */;
  link_info_l_: unknown /* const array */;
  link_info: number;
  link_info_r_: unknown /* const array */;
  link_info_size_l_: unknown /* const array */;
  link_info_size: number;
  link_info_size_r_: unknown /* const array */;
}

declare class debug_syscall_reject_args {
  constructor(init?: debug_syscall_reject_args);
  packed_selectors_l_: unknown /* const array */;
  packed_selectors: number;
  packed_selectors_r_: unknown /* const array */;
}

declare class proc_info_extended_id_args {
  constructor(init?: proc_info_extended_id_args);
  callnum_l_: unknown /* const array */;
  callnum: number;
  callnum_r_: unknown /* const array */;
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  flavor_l_: unknown /* const array */;
  flavor: number;
  flavor_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  ext_id_l_: unknown /* const array */;
  ext_id: number;
  ext_id_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
  buffer_l_: unknown /* const array */;
  buffer: number;
  buffer_r_: unknown /* const array */;
  buffersize_l_: unknown /* const array */;
  buffersize: number;
  buffersize_r_: unknown /* const array */;
}

declare class ulock_wait2_args {
  constructor(init?: ulock_wait2_args);
  operation_l_: unknown /* const array */;
  operation: number;
  operation_r_: unknown /* const array */;
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
  value2_l_: unknown /* const array */;
  value2: number;
  value2_r_: unknown /* const array */;
}

declare class pwritev_nocancel_args {
  constructor(init?: pwritev_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class kd_event_matcher {
  constructor(init?: kd_event_matcher);
  kem_debugid: number;
  kem_padding: number;
  kem_args: unknown /* const array */;
}

declare class pwritev_args {
  constructor(init?: pwritev_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class ntp_gettime_args {
  constructor(init?: ntp_gettime_args);
  ntvp_l_: unknown /* const array */;
  ntvp: number;
  ntvp_r_: unknown /* const array */;
}

declare class net_qos_guideline_args {
  constructor(init?: net_qos_guideline_args);
  param_l_: unknown /* const array */;
  param: number;
  param_r_: unknown /* const array */;
  param_len_l_: unknown /* const array */;
  param_len: number;
  param_len_r_: unknown /* const array */;
}

declare class setattrlistat_args {
  constructor(init?: setattrlistat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  attributeBuffer_l_: unknown /* const array */;
  attributeBuffer: number;
  attributeBuffer_r_: unknown /* const array */;
  bufferSize_l_: unknown /* const array */;
  bufferSize: number;
  bufferSize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class terminate_with_payload_args {
  constructor(init?: terminate_with_payload_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  reason_namespace_l_: unknown /* const array */;
  reason_namespace: number;
  reason_namespace_r_: unknown /* const array */;
  reason_code_l_: unknown /* const array */;
  reason_code: number;
  reason_code_r_: unknown /* const array */;
  payload_l_: unknown /* const array */;
  payload: number;
  payload_r_: unknown /* const array */;
  payload_size_l_: unknown /* const array */;
  payload_size: number;
  payload_size_r_: unknown /* const array */;
  reason_string_l_: unknown /* const array */;
  reason_string: number;
  reason_string_r_: unknown /* const array */;
  reason_flags_l_: unknown /* const array */;
  reason_flags: number;
  reason_flags_r_: unknown /* const array */;
}

declare class ulock_wake_args {
  constructor(init?: ulock_wake_args);
  operation_l_: unknown /* const array */;
  operation: number;
  operation_r_: unknown /* const array */;
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: unknown /* const array */;
  wake_value_l_: unknown /* const array */;
  wake_value: number;
  wake_value_r_: unknown /* const array */;
}

declare class getentropy_args {
  constructor(init?: getentropy_args);
  buffer_l_: unknown /* const array */;
  buffer: number;
  buffer_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
}

declare class work_interval_ctl_args {
  constructor(init?: work_interval_ctl_args);
  operation_l_: unknown /* const array */;
  operation: number;
  operation_r_: unknown /* const array */;
  work_interval_id_l_: unknown /* const array */;
  work_interval_id: number;
  work_interval_id_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: unknown /* const array */;
}

declare class mach_eventlink_signal_wait_until_args {
  constructor(init?: mach_eventlink_signal_wait_until_args);
  eventlink_port_l_: unknown /* const array */;
  eventlink_port: number;
  eventlink_port_r_: unknown /* const array */;
  wait_count_l_: unknown /* const array */;
  wait_count: number;
  wait_count_r_: unknown /* const array */;
  signal_count_l_: unknown /* const array */;
  signal_count: number;
  signal_count_r_: unknown /* const array */;
  deadline_l_: unknown /* const array */;
  deadline: number;
  deadline_r_: unknown /* const array */;
  clock_id_l_: unknown /* const array */;
  clock_id: number;
  clock_id_r_: unknown /* const array */;
  option_l_: unknown /* const array */;
  option: number;
  option_r_: unknown /* const array */;
}

declare class mach_eventlink_signal_args {
  constructor(init?: mach_eventlink_signal_args);
  eventlink_port_l_: unknown /* const array */;
  eventlink_port: number;
  eventlink_port_r_: unknown /* const array */;
  signal_count_l_: unknown /* const array */;
  signal_count: number;
  signal_count_r_: unknown /* const array */;
}

declare class __Request__doubleagent_allocate_xattr_t {
  constructor(init?: __Request__doubleagent_allocate_xattr_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  file_port: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  file_size: number;
  nameOffset: number;
  nameCnt: number;
  name: unknown /* const array */;
  size: number;
  options: number;
}

declare class guarded_pwrite_np_args {
  constructor(init?: guarded_pwrite_np_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class guarded_open_dprotected_np_args {
  constructor(init?: guarded_open_dprotected_np_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  guardflags_l_: unknown /* const array */;
  guardflags: number;
  guardflags_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  dpclass_l_: unknown /* const array */;
  dpclass: number;
  dpclass_r_: unknown /* const array */;
  dpflags_l_: unknown /* const array */;
  dpflags: number;
  dpflags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class openbyid_np_args {
  constructor(init?: openbyid_np_args);
  fsid_l_: unknown /* const array */;
  fsid: number;
  fsid_r_: unknown /* const array */;
  objid_l_: unknown /* const array */;
  objid: number;
  objid_r_: unknown /* const array */;
  oflags_l_: unknown /* const array */;
  oflags: number;
  oflags_r_: unknown /* const array */;
}

declare class bsdthread_ctl_args {
  constructor(init?: bsdthread_ctl_args);
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  arg1_l_: unknown /* const array */;
  arg1: number;
  arg1_r_: unknown /* const array */;
  arg2_l_: unknown /* const array */;
  arg2: number;
  arg2_r_: unknown /* const array */;
  arg3_l_: unknown /* const array */;
  arg3: number;
  arg3_r_: unknown /* const array */;
}

declare class proc_trace_log_args {
  constructor(init?: proc_trace_log_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  uniqueid_l_: unknown /* const array */;
  uniqueid: number;
  uniqueid_r_: unknown /* const array */;
}

declare class symlinkat_args {
  constructor(init?: symlinkat_args);
  path1_l_: unknown /* const array */;
  path1: number;
  path1_r_: unknown /* const array */;
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path2_l_: unknown /* const array */;
  path2: number;
  path2_r_: unknown /* const array */;
}

declare class readlinkat_args {
  constructor(init?: readlinkat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
}

declare class fstatat64_args {
  constructor(init?: fstatat64_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class fstatat_args {
  constructor(init?: fstatat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class renameat_args {
  constructor(init?: renameat_args);
  fromfd_l_: unknown /* const array */;
  fromfd: number;
  fromfd_r_: unknown /* const array */;
  from_l_: unknown /* const array */;
  from: number;
  from_r_: unknown /* const array */;
  tofd_l_: unknown /* const array */;
  tofd: number;
  tofd_r_: unknown /* const array */;
  to_l_: unknown /* const array */;
  to: number;
  to_r_: unknown /* const array */;
}

declare class openat_nocancel_args {
  constructor(init?: openat_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class openat_args {
  constructor(init?: openat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class clonefileat_args {
  constructor(init?: clonefileat_args);
  src_dirfd_l_: unknown /* const array */;
  src_dirfd: number;
  src_dirfd_r_: unknown /* const array */;
  src_l_: unknown /* const array */;
  src: number;
  src_r_: unknown /* const array */;
  dst_dirfd_l_: unknown /* const array */;
  dst_dirfd: number;
  dst_dirfd_r_: unknown /* const array */;
  dst_l_: unknown /* const array */;
  dst: number;
  dst_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class getattrlistbulk_args {
  constructor(init?: getattrlistbulk_args);
  dirfd_l_: unknown /* const array */;
  dirfd: number;
  dirfd_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  attributeBuffer_l_: unknown /* const array */;
  attributeBuffer: number;
  attributeBuffer_r_: unknown /* const array */;
  bufferSize_l_: unknown /* const array */;
  bufferSize: number;
  bufferSize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class __msqid_ds_new {
  constructor(init?: __msqid_ds_new);
  msg_perm: ipc_perm;
  msg_first: number;
  msg_last: number;
  msg_cbytes: number;
  msg_qnum: number;
  msg_qbytes: number;
  msg_lspid: number;
  msg_lrpid: number;
  msg_stime: number;
  msg_pad1: number;
  msg_rtime: number;
  msg_pad2: number;
  msg_ctime: number;
  msg_pad3: number;
  msg_pad4: unknown /* const array */;
}

declare class sfi_pidctl_args {
  constructor(init?: sfi_pidctl_args);
  operation_l_: unknown /* const array */;
  operation: number;
  operation_r_: unknown /* const array */;
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  sfi_flags_l_: unknown /* const array */;
  sfi_flags: number;
  sfi_flags_r_: unknown /* const array */;
  out_sfi_flags_l_: unknown /* const array */;
  out_sfi_flags: number;
  out_sfi_flags_r_: unknown /* const array */;
}

declare class sfi_ctl_args {
  constructor(init?: sfi_ctl_args);
  operation_l_: unknown /* const array */;
  operation: number;
  operation_r_: unknown /* const array */;
  sfi_class_l_: unknown /* const array */;
  sfi_class: number;
  sfi_class_r_: unknown /* const array */;
  time_l_: unknown /* const array */;
  time: number;
  time_r_: unknown /* const array */;
  out_time_l_: unknown /* const array */;
  out_time: number;
  out_time_r_: unknown /* const array */;
}

declare class telemetry_args {
  constructor(init?: telemetry_args);
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  deadline_l_: unknown /* const array */;
  deadline: number;
  deadline_r_: unknown /* const array */;
  interval_l_: unknown /* const array */;
  interval: number;
  interval_r_: unknown /* const array */;
  leeway_l_: unknown /* const array */;
  leeway: number;
  leeway_r_: unknown /* const array */;
  arg4_l_: unknown /* const array */;
  arg4: number;
  arg4_r_: unknown /* const array */;
  arg5_l_: unknown /* const array */;
  arg5: number;
  arg5_r_: unknown /* const array */;
}

declare class guarded_close_np_args {
  constructor(init?: guarded_close_np_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
}

declare class guarded_open_np_args {
  constructor(init?: guarded_open_np_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  guardflags_l_: unknown /* const array */;
  guardflags: number;
  guardflags_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class kas_info_args {
  constructor(init?: kas_info_args);
  selector_l_: unknown /* const array */;
  selector: number;
  selector_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
}

declare class pid_suspend_args {
  constructor(init?: pid_suspend_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
}

declare class fileport_makefd_args {
  constructor(init?: fileport_makefd_args);
  port_l_: unknown /* const array */;
  port: number;
  port_r_: unknown /* const array */;
}

declare class audit_session_join_args {
  constructor(init?: audit_session_join_args);
  port_l_: unknown /* const array */;
  port: number;
  port_r_: unknown /* const array */;
}

declare class fsgetpath_args {
  constructor(init?: fsgetpath_args);
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  fsid_l_: unknown /* const array */;
  fsid: number;
  fsid_r_: unknown /* const array */;
  objid_l_: unknown /* const array */;
  objid: number;
  objid_r_: unknown /* const array */;
}

declare class __mac_mount_args {
  constructor(init?: __mac_mount_args);
  type_l_: unknown /* const array */;
  type: number;
  type_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
  mac_p_l_: unknown /* const array */;
  mac_p: number;
  mac_p_r_: unknown /* const array */;
}

declare class __sigwait_nocancel_args {
  constructor(init?: __sigwait_nocancel_args);
  set_l_: unknown /* const array */;
  set: number;
  set_r_: unknown /* const array */;
  sig_l_: unknown /* const array */;
  sig: number;
  sig_r_: unknown /* const array */;
}

declare class aio_suspend_nocancel_args {
  constructor(init?: aio_suspend_nocancel_args);
  aiocblist_l_: unknown /* const array */;
  aiocblist: number;
  aiocblist_r_: unknown /* const array */;
  nent_l_: unknown /* const array */;
  nent: number;
  nent_r_: unknown /* const array */;
  timeoutp_l_: unknown /* const array */;
  timeoutp: number;
  timeoutp_r_: unknown /* const array */;
}

declare class sem_wait_nocancel_args {
  constructor(init?: sem_wait_nocancel_args);
  sem_l_: unknown /* const array */;
  sem: number;
  sem_r_: unknown /* const array */;
}

declare class poll_nocancel_args {
  constructor(init?: poll_nocancel_args);
  fds_l_: unknown /* const array */;
  fds: number;
  fds_r_: unknown /* const array */;
  nfds_l_: unknown /* const array */;
  nfds: number;
  nfds_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
}

declare class __Reply__mach_voucher_attr_command_t {
  constructor(init?: __Reply__mach_voucher_attr_command_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  out_contentCnt: number;
  out_content: unknown /* const array */;
}

declare class waitid_nocancel_args {
  constructor(init?: waitid_nocancel_args);
  idtype_l_: unknown /* const array */;
  idtype: interop.Enum<typeof idtype_t>;
  idtype_r_: unknown /* const array */;
  id_l_: unknown /* const array */;
  id: number;
  id_r_: unknown /* const array */;
  infop_l_: unknown /* const array */;
  infop: number;
  infop_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class writev_nocancel_args {
  constructor(init?: writev_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
}

declare class readv_nocancel_args {
  constructor(init?: readv_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
}

declare class sigsuspend_nocancel_args {
  constructor(init?: sigsuspend_nocancel_args);
  mask_l_: unknown /* const array */;
  mask: number;
  mask_r_: unknown /* const array */;
}

declare class fsync_nocancel_args {
  constructor(init?: fsync_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class fcntl_nocancel_args {
  constructor(init?: fcntl_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
}

declare class msync_nocancel_args {
  constructor(init?: msync_nocancel_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class wait4_nocancel_args {
  constructor(init?: wait4_nocancel_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  status_l_: unknown /* const array */;
  status: number;
  status_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
  rusage_l_: unknown /* const array */;
  rusage: number;
  rusage_r_: unknown /* const array */;
}

declare class close_nocancel_args {
  constructor(init?: close_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class open_nocancel_args {
  constructor(init?: open_nocancel_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class pselect_nocancel_args {
  constructor(init?: pselect_nocancel_args);
  nd_l_: unknown /* const array */;
  nd: number;
  nd_r_: unknown /* const array */;
  in_l_: unknown /* const array */;
  in_: number;
  in_r_: unknown /* const array */;
  ou_l_: unknown /* const array */;
  ou: number;
  ou_r_: unknown /* const array */;
  ex_l_: unknown /* const array */;
  ex: number;
  ex_r_: unknown /* const array */;
  ts_l_: unknown /* const array */;
  ts: number;
  ts_r_: unknown /* const array */;
  mask_l_: unknown /* const array */;
  mask: number;
  mask_r_: unknown /* const array */;
}

declare class ledger_args {
  constructor(init?: ledger_args);
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  arg1_l_: unknown /* const array */;
  arg1: number;
  arg1_r_: unknown /* const array */;
  arg2_l_: unknown /* const array */;
  arg2: number;
  arg2_r_: unknown /* const array */;
  arg3_l_: unknown /* const array */;
  arg3: number;
  arg3_r_: unknown /* const array */;
}

declare class workq_kernreturn_args {
  constructor(init?: workq_kernreturn_args);
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
  item_l_: unknown /* const array */;
  item: number;
  item_r_: unknown /* const array */;
  affinity_l_: unknown /* const array */;
  affinity: number;
  affinity_r_: unknown /* const array */;
  prio_l_: unknown /* const array */;
  prio: number;
  prio_r_: unknown /* const array */;
}

declare class lchown_args {
  constructor(init?: lchown_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  owner_l_: unknown /* const array */;
  owner: number;
  owner_r_: unknown /* const array */;
  group_l_: unknown /* const array */;
  group: number;
  group_r_: unknown /* const array */;
}

declare class fat_arch {
  constructor(init?: fat_arch);
  cputype: number;
  cpusubtype: number;
  offset: number;
  size: number;
  align: number;
}

declare class bsdthread_terminate_args {
  constructor(init?: bsdthread_terminate_args);
  stackaddr_l_: unknown /* const array */;
  stackaddr: number;
  stackaddr_r_: unknown /* const array */;
  freesize_l_: unknown /* const array */;
  freesize: number;
  freesize_r_: unknown /* const array */;
  port_l_: unknown /* const array */;
  port: number;
  port_r_: unknown /* const array */;
  sema_or_ulock_l_: unknown /* const array */;
  sema_or_ulock: number;
  sema_or_ulock_r_: unknown /* const array */;
}

declare class auditctl_args {
  constructor(init?: auditctl_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class getauid_args {
  constructor(init?: getauid_args);
  auid_l_: unknown /* const array */;
  auid: number;
  auid_r_: unknown /* const array */;
}

declare class __Request__mach_vm_deferred_reclamation_buffer_query_t {
  constructor(init?: __Request__mach_vm_deferred_reclamation_buffer_query_t);
  Head: mach_msg_header_t;
}

declare class auditon_args {
  constructor(init?: auditon_args);
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
  length_l_: unknown /* const array */;
  length: number;
  length_r_: unknown /* const array */;
}

declare class __pthread_chdir_args {
  constructor(init?: __pthread_chdir_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class statfs64_args {
  constructor(init?: statfs64_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
}

declare class stat64_extended_args {
  constructor(init?: stat64_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
  xsecurity_size_l_: unknown /* const array */;
  xsecurity_size: number;
  xsecurity_size_r_: unknown /* const array */;
}

declare class lstat64_args {
  constructor(init?: lstat64_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
}

declare class stat64_args {
  constructor(init?: stat64_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
}

declare class proc_info_args {
  constructor(init?: proc_info_args);
  callnum_l_: unknown /* const array */;
  callnum: number;
  callnum_r_: unknown /* const array */;
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  flavor_l_: unknown /* const array */;
  flavor: number;
  flavor_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
  buffer_l_: unknown /* const array */;
  buffer: number;
  buffer_r_: unknown /* const array */;
  buffersize_l_: unknown /* const array */;
  buffersize: number;
  buffersize_r_: unknown /* const array */;
}

declare class __pthread_markcancel_args {
  constructor(init?: __pthread_markcancel_args);
  thread_port_l_: unknown /* const array */;
  thread_port: number;
  thread_port_r_: unknown /* const array */;
}

declare class __sigwait_args {
  constructor(init?: __sigwait_args);
  set_l_: unknown /* const array */;
  set: number;
  set_r_: unknown /* const array */;
  sig_l_: unknown /* const array */;
  sig: number;
  sig_r_: unknown /* const array */;
}

declare class __pthread_kill_args {
  constructor(init?: __pthread_kill_args);
  thread_port_l_: unknown /* const array */;
  thread_port: number;
  thread_port_r_: unknown /* const array */;
  sig_l_: unknown /* const array */;
  sig: number;
  sig_r_: unknown /* const array */;
}

declare class munlockall_args {
  constructor(init?: munlockall_args);
  how_l_: unknown /* const array */;
  how: number;
  how_r_: unknown /* const array */;
}

declare class mlockall_args {
  constructor(init?: mlockall_args);
  how_l_: unknown /* const array */;
  how: number;
  how_r_: unknown /* const array */;
}

declare class iopolicysys_args {
  constructor(init?: iopolicysys_args);
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
}

declare class aio_write_args {
  constructor(init?: aio_write_args);
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class aio_cancel_args {
  constructor(init?: aio_cancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class aio_suspend_args {
  constructor(init?: aio_suspend_args);
  aiocblist_l_: unknown /* const array */;
  aiocblist: number;
  aiocblist_r_: unknown /* const array */;
  nent_l_: unknown /* const array */;
  nent: number;
  nent_r_: unknown /* const array */;
  timeoutp_l_: unknown /* const array */;
  timeoutp: number;
  timeoutp_r_: unknown /* const array */;
}

declare class aio_return_args {
  constructor(init?: aio_return_args);
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class aio_fsync_args {
  constructor(init?: aio_fsync_args);
  op_l_: unknown /* const array */;
  op: number;
  op_r_: unknown /* const array */;
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class settid_with_pid_args {
  constructor(init?: settid_with_pid_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  assume_l_: unknown /* const array */;
  assume: number;
  assume_r_: unknown /* const array */;
}

declare class shared_region_check_np_args {
  constructor(init?: shared_region_check_np_args);
  start_address_l_: unknown /* const array */;
  start_address: number;
  start_address_r_: unknown /* const array */;
}

declare class mkdir_extended_args {
  constructor(init?: mkdir_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
}

declare class mkfifo_extended_args {
  constructor(init?: mkfifo_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
}

declare class setsgroups_args {
  constructor(init?: setsgroups_args);
  setlen_l_: unknown /* const array */;
  setlen: number;
  setlen_r_: unknown /* const array */;
  guidset_l_: unknown /* const array */;
  guidset: number;
  guidset_r_: unknown /* const array */;
}

declare class gettid_args {
  constructor(init?: gettid_args);
  uidp_l_: unknown /* const array */;
  uidp: number;
  uidp_r_: unknown /* const array */;
  gidp_l_: unknown /* const array */;
  gidp: number;
  gidp_r_: unknown /* const array */;
}

declare class fchmod_extended_args {
  constructor(init?: fchmod_extended_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
}

declare class chmod_extended_args {
  constructor(init?: chmod_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
}

declare class fstat_extended_args {
  constructor(init?: fstat_extended_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
  xsecurity_size_l_: unknown /* const array */;
  xsecurity_size: number;
  xsecurity_size_r_: unknown /* const array */;
}

declare class stat_extended_args {
  constructor(init?: stat_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
  xsecurity_size_l_: unknown /* const array */;
  xsecurity_size: number;
  xsecurity_size_r_: unknown /* const array */;
}

declare class umask_extended_args {
  constructor(init?: umask_extended_args);
  newmask_l_: unknown /* const array */;
  newmask: number;
  newmask_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
}

declare class sysctlbyname_args {
  constructor(init?: sysctlbyname_args);
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
  namelen_l_: unknown /* const array */;
  namelen: number;
  namelen_r_: unknown /* const array */;
  old_l_: unknown /* const array */;
  old: number;
  old_r_: unknown /* const array */;
  oldlenp_l_: unknown /* const array */;
  oldlenp: number;
  oldlenp_r_: unknown /* const array */;
  new_l_: unknown /* const array */;
  new: number;
  new_r_: unknown /* const array */;
  newlen_l_: unknown /* const array */;
  newlen: number;
  newlen_r_: unknown /* const array */;
}

declare class sem_trywait_args {
  constructor(init?: sem_trywait_args);
  sem_l_: unknown /* const array */;
  sem: number;
  sem_r_: unknown /* const array */;
}

declare class sem_unlink_args {
  constructor(init?: sem_unlink_args);
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
}

declare class sem_close_args {
  constructor(init?: sem_close_args);
  sem_l_: unknown /* const array */;
  sem: number;
  sem_r_: unknown /* const array */;
}

declare class minherit_args {
  constructor(init?: minherit_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
  inherit_l_: unknown /* const array */;
  inherit: number;
  inherit_r_: unknown /* const array */;
}

declare class fsctlat_args {
  constructor(init?: fsctlat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class aio_readv_args {
  constructor(init?: aio_readv_args);
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class initgroups_args {
  constructor(init?: initgroups_args);
  gidsetsize_l_: unknown /* const array */;
  gidsetsize: number;
  gidsetsize_r_: unknown /* const array */;
  gidset_l_: unknown /* const array */;
  gidset: number;
  gidset_r_: unknown /* const array */;
  gmuid_l_: unknown /* const array */;
  gmuid: number;
  gmuid_r_: unknown /* const array */;
}

declare class fsctl_args {
  constructor(init?: fsctl_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class listxattr_args {
  constructor(init?: listxattr_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  namebuf_l_: unknown /* const array */;
  namebuf: number;
  namebuf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class fgetxattr_args {
  constructor(init?: fgetxattr_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  attrname_l_: unknown /* const array */;
  attrname: number;
  attrname_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
  position_l_: unknown /* const array */;
  position: number;
  position_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class fgetattrlist_args {
  constructor(init?: fgetattrlist_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  attributeBuffer_l_: unknown /* const array */;
  attributeBuffer: number;
  attributeBuffer_r_: unknown /* const array */;
  bufferSize_l_: unknown /* const array */;
  bufferSize: number;
  bufferSize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class delete_args {
  constructor(init?: delete_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class exchangedata_args {
  constructor(init?: exchangedata_args);
  path1_l_: unknown /* const array */;
  path1: number;
  path1_r_: unknown /* const array */;
  path2_l_: unknown /* const array */;
  path2: number;
  path2_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class IOServiceNotificationDispatchSource_IVars {
  constructor(init?: IOServiceNotificationDispatchSource_IVars);
}

declare class getdirentriesattr_args {
  constructor(init?: getdirentriesattr_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  buffer_l_: unknown /* const array */;
  buffer: number;
  buffer_r_: unknown /* const array */;
  buffersize_l_: unknown /* const array */;
  buffersize: number;
  buffersize_r_: unknown /* const array */;
  count_l_: unknown /* const array */;
  count: number;
  count_r_: unknown /* const array */;
  basep_l_: unknown /* const array */;
  basep: number;
  basep_r_: unknown /* const array */;
  newstate_l_: unknown /* const array */;
  newstate: number;
  newstate_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class getattrlist_args {
  constructor(init?: getattrlist_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  attributeBuffer_l_: unknown /* const array */;
  attributeBuffer: number;
  attributeBuffer_r_: unknown /* const array */;
  bufferSize_l_: unknown /* const array */;
  bufferSize: number;
  bufferSize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class getumask_args {
  constructor(init?: getumask_args);
  dummy: number;
}

declare class fchflagsat_args {
  constructor(init?: fchflagsat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class mlock_args {
  constructor(init?: mlock_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
}

declare class sysctl_args {
  constructor(init?: sysctl_args);
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
  namelen_l_: unknown /* const array */;
  namelen: number;
  namelen_r_: unknown /* const array */;
  old_l_: unknown /* const array */;
  old: number;
  old_r_: unknown /* const array */;
  oldlenp_l_: unknown /* const array */;
  oldlenp: number;
  oldlenp_r_: unknown /* const array */;
  new_l_: unknown /* const array */;
  new: number;
  new_r_: unknown /* const array */;
  newlen_l_: unknown /* const array */;
  newlen: number;
  newlen_r_: unknown /* const array */;
}

declare class ftruncate_args {
  constructor(init?: ftruncate_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  length_l_: unknown /* const array */;
  length: number;
  length_r_: unknown /* const array */;
}

declare class truncate_args {
  constructor(init?: truncate_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  length_l_: unknown /* const array */;
  length: number;
  length_r_: unknown /* const array */;
}

declare class getdirentries_args {
  constructor(init?: getdirentries_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  count_l_: unknown /* const array */;
  count: number;
  count_r_: unknown /* const array */;
  basep_l_: unknown /* const array */;
  basep: number;
  basep_r_: unknown /* const array */;
}

declare class getrlimit_args {
  constructor(init?: getrlimit_args);
  which_l_: unknown /* const array */;
  which: number;
  which_r_: unknown /* const array */;
  rlp_l_: unknown /* const array */;
  rlp: number;
  rlp_r_: unknown /* const array */;
}

declare class pathconf_args {
  constructor(init?: pathconf_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
}

declare class lstat_args {
  constructor(init?: lstat_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
}

declare class fstat_args {
  constructor(init?: fstat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
}

declare class stat_args {
  constructor(init?: stat_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
}

declare class panic_with_data_args {
  constructor(init?: panic_with_data_args);
  uuid_l_: unknown /* const array */;
  uuid: number;
  uuid_r_: unknown /* const array */;
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: unknown /* const array */;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  msg_l_: unknown /* const array */;
  msg: number;
  msg_r_: unknown /* const array */;
}

declare class kdebug_trace_args {
  constructor(init?: kdebug_trace_args);
  code_l_: unknown /* const array */;
  code: number;
  code_r_: unknown /* const array */;
  arg1_l_: unknown /* const array */;
  arg1: number;
  arg1_r_: unknown /* const array */;
  arg2_l_: unknown /* const array */;
  arg2: number;
  arg2_r_: unknown /* const array */;
  arg3_l_: unknown /* const array */;
  arg3: number;
  arg3_r_: unknown /* const array */;
  arg4_l_: unknown /* const array */;
  arg4: number;
  arg4_r_: unknown /* const array */;
}

declare class kdebug_trace64_args {
  constructor(init?: kdebug_trace64_args);
  code_l_: unknown /* const array */;
  code: number;
  code_r_: unknown /* const array */;
  arg1_l_: unknown /* const array */;
  arg1: number;
  arg1_r_: unknown /* const array */;
  arg2_l_: unknown /* const array */;
  arg2: number;
  arg2_r_: unknown /* const array */;
  arg3_l_: unknown /* const array */;
  arg3: number;
  arg3_r_: unknown /* const array */;
  arg4_l_: unknown /* const array */;
  arg4: number;
  arg4_r_: unknown /* const array */;
}

declare class csops_audittoken_args {
  constructor(init?: csops_audittoken_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  ops_l_: unknown /* const array */;
  ops: number;
  ops_r_: unknown /* const array */;
  useraddr_l_: unknown /* const array */;
  useraddr: number;
  useraddr_r_: unknown /* const array */;
  usersize_l_: unknown /* const array */;
  usersize: number;
  usersize_r_: unknown /* const array */;
  uaudittoken_l_: unknown /* const array */;
  uaudittoken: number;
  uaudittoken_r_: unknown /* const array */;
}

declare class quotactl_args {
  constructor(init?: quotactl_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
}

declare class fstatfs_args {
  constructor(init?: fstatfs_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
}

declare class statfs_args {
  constructor(init?: statfs_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
}

declare class pread_args {
  constructor(init?: pread_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class setprivexec_args {
  constructor(init?: setprivexec_args);
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class dup3_args {
  constructor(init?: dup3_args);
  from_l_: unknown /* const array */;
  from: number;
  from_r_: unknown /* const array */;
  to_l_: unknown /* const array */;
  to: number;
  to_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class setsid_args {
  constructor(init?: setsid_args);
  dummy: number;
}

declare class gethostuuid_args {
  constructor(init?: gethostuuid_args);
  uuid_buf_l_: unknown /* const array */;
  uuid_buf: number;
  uuid_buf_r_: unknown /* const array */;
  timeoutp_l_: unknown /* const array */;
  timeoutp: number;
  timeoutp_r_: unknown /* const array */;
}

declare class adjtime_args {
  constructor(init?: adjtime_args);
  delta_l_: unknown /* const array */;
  delta: number;
  delta_r_: unknown /* const array */;
  olddelta_l_: unknown /* const array */;
  olddelta: number;
  olddelta_r_: unknown /* const array */;
}

declare class mkdir_args {
  constructor(init?: mkdir_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class __Request__mach_vm_reallocate_t {
  constructor(init?: __Request__mach_vm_reallocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  src: number;
  src_size: number;
  dst: number;
  dst_size: number;
  align_mask: number;
  options: number;
  flags: number;
}

declare class rename_args {
  constructor(init?: rename_args);
  from_l_: unknown /* const array */;
  from: number;
  from_r_: unknown /* const array */;
  to_l_: unknown /* const array */;
  to: number;
  to_r_: unknown /* const array */;
}

declare class setreuid_args {
  constructor(init?: setreuid_args);
  ruid_l_: unknown /* const array */;
  ruid: number;
  ruid_r_: unknown /* const array */;
  euid_l_: unknown /* const array */;
  euid: number;
  euid_r_: unknown /* const array */;
}

declare class fchmod_args {
  constructor(init?: fchmod_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class settimeofday_args {
  constructor(init?: settimeofday_args);
  tv_l_: unknown /* const array */;
  tv: number;
  tv_r_: unknown /* const array */;
  tzp_l_: unknown /* const array */;
  tzp: number;
  tzp_r_: unknown /* const array */;
}

declare class readv_args {
  constructor(init?: readv_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
}

declare class getrusage_args {
  constructor(init?: getrusage_args);
  who_l_: unknown /* const array */;
  who: number;
  who_r_: unknown /* const array */;
  rusage_l_: unknown /* const array */;
  rusage: number;
  rusage_r_: unknown /* const array */;
}

declare class sigsuspend_args {
  constructor(init?: sigsuspend_args);
  mask_l_: unknown /* const array */;
  mask: number;
  mask_r_: unknown /* const array */;
}

declare class setpriority_args {
  constructor(init?: setpriority_args);
  which_l_: unknown /* const array */;
  which: number;
  which_r_: unknown /* const array */;
  who_l_: unknown /* const array */;
  who: number;
  who_r_: unknown /* const array */;
  prio_l_: unknown /* const array */;
  prio: number;
  prio_r_: unknown /* const array */;
}

declare class dup2_args {
  constructor(init?: dup2_args);
  from_l_: unknown /* const array */;
  from: number;
  from_r_: unknown /* const array */;
  to_l_: unknown /* const array */;
  to: number;
  to_r_: unknown /* const array */;
}

declare class getdtablesize_args {
  constructor(init?: getdtablesize_args);
  dummy: number;
}

declare class getitimer_args {
  constructor(init?: getitimer_args);
  which_l_: unknown /* const array */;
  which: number;
  which_r_: unknown /* const array */;
  itv_l_: unknown /* const array */;
  itv: number;
  itv_r_: unknown /* const array */;
}

declare class setpgid_args {
  constructor(init?: setpgid_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  pgid_l_: unknown /* const array */;
  pgid: number;
  pgid_r_: unknown /* const array */;
}

declare class getpgrp_args {
  constructor(init?: getpgrp_args);
  dummy: number;
}

declare class mincore_args {
  constructor(init?: mincore_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
  vec_l_: unknown /* const array */;
  vec: number;
  vec_r_: unknown /* const array */;
}

declare class mprotect_args {
  constructor(init?: mprotect_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
  prot_l_: unknown /* const array */;
  prot: number;
  prot_r_: unknown /* const array */;
}

declare class munmap_args {
  constructor(init?: munmap_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
}

declare class msync_args {
  constructor(init?: msync_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class chroot_args {
  constructor(init?: chroot_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class execve_args {
  constructor(init?: execve_args);
  fname_l_: unknown /* const array */;
  fname: number;
  fname_r_: unknown /* const array */;
  argp_l_: unknown /* const array */;
  argp: number;
  argp_r_: unknown /* const array */;
  envp_l_: unknown /* const array */;
  envp: number;
  envp_r_: unknown /* const array */;
}

declare class ioctl_args {
  constructor(init?: ioctl_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  com_l_: unknown /* const array */;
  com: number;
  com_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
}

declare class __Request__vfs_resolve_dir_t {
  constructor(init?: __Request__vfs_resolve_dir_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  req_id: number;
  pid: number;
  op: number;
  file_name: unknown /* const array */;
  path: unknown /* const array */;
}

declare class sigaltstack_args {
  constructor(init?: sigaltstack_args);
  nss_l_: unknown /* const array */;
  nss: number;
  nss_r_: unknown /* const array */;
  oss_l_: unknown /* const array */;
  oss: number;
  oss_r_: unknown /* const array */;
}

declare class sigpending_args {
  constructor(init?: sigpending_args);
  osv_l_: unknown /* const array */;
  osv: number;
  osv_r_: unknown /* const array */;
}

declare class acct_args {
  constructor(init?: acct_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class setlogin_args {
  constructor(init?: setlogin_args);
  namebuf_l_: unknown /* const array */;
  namebuf: number;
  namebuf_r_: unknown /* const array */;
}

declare class __Reply__mach_voucher_debug_info_t {
  constructor(init?: __Reply__mach_voucher_debug_info_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  recipesCnt: number;
  recipes: unknown /* const array */;
}

declare class locklist {
  constructor(init?: locklist);
  tqh_first: interop.Pointer;
  tqh_last: interop.Pointer;
}

declare class getlogin_args {
  constructor(init?: getlogin_args);
  namebuf_l_: unknown /* const array */;
  namebuf: number;
  namebuf_r_: unknown /* const array */;
  namelen_l_: unknown /* const array */;
  namelen: number;
  namelen_r_: unknown /* const array */;
}

declare class setauid_args {
  constructor(init?: setauid_args);
  auid_l_: unknown /* const array */;
  auid: number;
  auid_r_: unknown /* const array */;
}

declare class sigaction_args {
  constructor(init?: sigaction_args);
  signum_l_: unknown /* const array */;
  signum: number;
  signum_r_: unknown /* const array */;
  nsa_l_: unknown /* const array */;
  nsa: number;
  nsa_r_: unknown /* const array */;
  osa_l_: unknown /* const array */;
  osa: number;
  osa_r_: unknown /* const array */;
}

declare class getppid_args {
  constructor(init?: getppid_args);
  dummy: number;
}

declare class thread_selfcounts_args {
  constructor(init?: thread_selfcounts_args);
  kind_l_: unknown /* const array */;
  kind: number;
  kind_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
}

declare class crossarch_trap_args {
  constructor(init?: crossarch_trap_args);
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
}

declare class geteuid_args {
  constructor(init?: geteuid_args);
  dummy: number;
}

declare class setuid_args {
  constructor(init?: setuid_args);
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
}

declare class chmod_args {
  constructor(init?: chmod_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class __Request__nspace_resolve_cancel_t {
  constructor(init?: __Request__nspace_resolve_cancel_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  req_id: number;
}

declare class mknod_args {
  constructor(init?: mknod_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  dev_l_: unknown /* const array */;
  dev: number;
  dev_r_: unknown /* const array */;
}

declare class link_args {
  constructor(init?: link_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  link_l_: unknown /* const array */;
  link: number;
  link_r_: unknown /* const array */;
}

declare class kd_callback {
  constructor(init?: kd_callback);
  func: (p1: interop.PointerConvertible, p2: interop.Enum<typeof kd_callback_type>, p3: interop.PointerConvertible) => void | null;
  context: interop.Pointer;
  iop_name: unknown /* const array */;
}

declare class wait4_args {
  constructor(init?: wait4_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  status_l_: unknown /* const array */;
  status: number;
  status_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
  rusage_l_: unknown /* const array */;
  rusage: number;
  rusage_r_: unknown /* const array */;
}

declare class fork_args {
  constructor(init?: fork_args);
  dummy: number;
}

declare class getdirentries64_args {
  constructor(init?: getdirentries64_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  position_l_: unknown /* const array */;
  position: number;
  position_r_: unknown /* const array */;
}

declare class user_timespec {
  constructor(init?: user_timespec);
  tv_sec: number;
  tv_nsec: number;
}

declare class user32_timeval {
  constructor(init?: user32_timeval);
  tv_sec: number;
  tv_usec: number;
}

declare class user64_timeval {
  constructor(init?: user64_timeval);
  tv_sec: number;
  tv_usec: number;
}

declare class user32_timex {
  constructor(init?: user32_timex);
  modes: number;
  offset: number;
  freq: number;
  maxerror: number;
  esterror: number;
  status: number;
  constant: number;
  precision: number;
  tolerance: number;
  ppsfreq: number;
  jitter: number;
  shift: number;
  stabil: number;
  jitcnt: number;
  calcnt: number;
  errcnt: number;
  stbcnt: number;
}

declare class user64_itimerval {
  constructor(init?: user64_itimerval);
  it_interval: number;
  it_value: number;
}

declare class user32_timespec {
  constructor(init?: user32_timespec);
  tv_sec: number;
  tv_nsec: number;
}

declare class nameidata {
  constructor(init?: nameidata);
}

declare class xvsockpcb {
  constructor(init?: xvsockpcb);
  xv_len: number;
  xv_vsockpp: number;
  xvp_local_cid: number;
  xvp_local_port: number;
  xvp_remote_cid: number;
  xvp_remote_port: number;
  xvp_rxcnt: number;
  xvp_txcnt: number;
  xvp_peer_rxhiwat: number;
  xvp_peer_rxcnt: number;
  xvp_last_pid: number;
  xvp_gencnt: number;
  xv_socket: xsocket;
}

declare class sockaddr_vm {
  constructor(init?: sockaddr_vm);
  svm_len: number;
  svm_family: number;
  svm_reserved1: number;
  svm_port: number;
  svm_cid: number;
}

declare class dyld_chained_starts_in_segment {
  constructor(init?: dyld_chained_starts_in_segment);
  size: number;
  page_size: number;
  pointer_format: number;
  segment_offset: number;
  max_valid_pointer: number;
  page_count: number;
  page_start: unknown /* const array */;
}

declare class sem {
  constructor(init?: sem);
  semval: number;
  sempid: number;
  semncnt: number;
  semzcnt: number;
}

declare class unnamed_17963737212569277895 {
  constructor(init?: unnamed_17963737212569277895);
  tss: sel;
  type: number;
  dpl: number;
  present: number;
}

declare class unnamed_13742762121275367287 {
  constructor(init?: unnamed_13742762121275367287);
  limit00: number;
  base00: number;
  base16: number;
  type: number;
  dpl: number;
  present: number;
  limit16: number;
  granular: number;
  base24: number;
}

declare class unnamed_3081758505577017777 {
  constructor(init?: unnamed_3081758505577017777);
  oldtss: sel;
  esp0: number;
  ss0: sel;
  esp1: number;
  ss1: sel;
  esp2: number;
  ss2: sel;
  cr3: number;
  eip: number;
  eflags: number;
  eax: number;
  ecx: number;
  edx: number;
  ebx: number;
  esp: number;
  ebp: number;
  esi: number;
  edi: number;
  es: sel;
  cs: sel;
  ss: sel;
  ds: sel;
  fs: sel;
  gs: sel;
  ldt: sel;
  t: number;
  io_bmap: number;
}

declare class unnamed_6133425560391434530 {
  constructor(init?: unnamed_6133425560391434530);
  rpl: number;
  ti: number;
  index: number;
}

declare class __Reply__upl_abort_t {
  constructor(init?: __Reply__upl_abort_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class intr_gate {
  constructor(init?: intr_gate);
  offset00: number;
  seg: sel;
  type: number;
  dpl: number;
  present: number;
  offset16: number;
}

declare class trap_gate {
  constructor(init?: trap_gate);
  offset00: number;
  seg: sel;
  type: number;
  dpl: number;
  present: number;
  offset16: number;
}

declare class igmpstat_v3 {
  constructor(init?: igmpstat_v3);
  igps_version: number;
  igps_len: number;
  igps_rcv_total: number;
  igps_rcv_tooshort: number;
  igps_rcv_badttl: number;
  igps_rcv_badsum: number;
  igps_rcv_v1v2_queries: number;
  igps_rcv_v3_queries: number;
  igps_rcv_badqueries: number;
  igps_rcv_gen_queries: number;
  igps_rcv_group_queries: number;
  igps_rcv_gsr_queries: number;
  igps_drop_gsr_queries: number;
  igps_rcv_reports: number;
  igps_rcv_badreports: number;
  igps_rcv_ourreports: number;
  igps_rcv_nora: number;
  igps_snd_reports: number;
  __igps_pad: unknown /* const array */;
}

declare class icmp6_router_renum {
  constructor(init?: icmp6_router_renum);
  rr_hdr: icmp6_hdr;
  rr_segnum: number;
  rr_flags: number;
  rr_maxdelay: number;
  rr_reserved: number;
}

declare class icmp6_namelookup {
  constructor(init?: icmp6_namelookup);
  icmp6_nl_hdr: icmp6_hdr;
  icmp6_nl_nonce: unknown /* const array */;
  icmp6_nl_ttl: number;
}

declare class nd_opt_pvd {
  constructor(init?: nd_opt_pvd);
  nd_opt_pvd_type: number;
  nd_opt_pvd_len: number;
  nd_opt_flags_delay: unknown /* const array */;
  nd_opt_pvd_seq: number;
  nd_opt_pvd_id: unknown /* const array */;
}

declare class nd_opt_dnssl {
  constructor(init?: nd_opt_dnssl);
  nd_opt_dnssl_type: number;
  nd_opt_dnssl_len: number;
  nd_opt_dnssl_reserved: number;
  nd_opt_dnssl_lifetime: number;
  nd_opt_dnssl_domains: unknown /* const array */;
}

declare class nd_opt_route_info {
  constructor(init?: nd_opt_route_info);
  nd_opt_rti_type: number;
  nd_opt_rti_len: number;
  nd_opt_rti_prefixlen: number;
  nd_opt_rti_flags: number;
  nd_opt_rti_lifetime: number;
}

declare class daleipc_network_clock_controller {
  constructor(init?: daleipc_network_clock_controller);
}

declare class nd_opt_nonce {
  constructor(init?: nd_opt_nonce);
  nd_opt_nonce_type: number;
  nd_opt_nonce_len: number;
  nd_opt_nonce: unknown /* const array */;
}

declare class __Request__coalition_notification_t {
  constructor(init?: __Request__coalition_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  id: number;
  flags: number;
}

declare class nd_opt_prefix_info {
  constructor(init?: nd_opt_prefix_info);
  nd_opt_pi_type: number;
  nd_opt_pi_len: number;
  nd_opt_pi_prefix_len: number;
  nd_opt_pi_flags_reserved: number;
  nd_opt_pi_valid_time: number;
  nd_opt_pi_preferred_time: number;
  nd_opt_pi_reserved2: number;
  nd_opt_pi_prefix: in6_addr;
}

declare class mld_hdr {
  constructor(init?: mld_hdr);
  mld_icmp6_hdr: icmp6_hdr;
  mld_addr: in6_addr;
}

declare class kev_netevent_clat46_data {
  constructor(init?: kev_netevent_clat46_data);
  clat46_event_code: interop.Enum<typeof in6_clat46_evhdlr_code_t>;
  epid: number;
  euuid: unknown /* const array */;
}

declare class unnamed_9822756730449729753 {
  constructor(init?: unnamed_9822756730449729753);
  ifscope: number;
}

declare class getgid_args {
  constructor(init?: getgid_args);
  dummy: number;
}

declare class ip6_opt_tunnel {
  constructor(init?: ip6_opt_tunnel);
  ip6ot_type: number;
  ip6ot_len: number;
  ip6ot_encap_limit: number;
}

declare class ip6_dest {
  constructor(init?: ip6_dest);
  ip6d_nxt: number;
  ip6d_len: number;
}

declare class udpiphdr {
  constructor(init?: udpiphdr);
  ui_i: ipovly;
  ui_u: udphdr;
}

declare class opaque_ipfilter {
  constructor(init?: opaque_ipfilter);
}

declare class ipf_filter {
  constructor(init?: ipf_filter);
  cookie: interop.Pointer;
  name: string | null;
  ipf_input: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => number | null;
  ipf_output: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  ipf_detach: (p1: interop.PointerConvertible) => void | null;
}

declare class ipf_pktopts {
  constructor(init?: ipf_pktopts);
  ippo_flags: number;
  ippo_mcast_ifnet: interop.Pointer;
  ippo_mcast_loop: number;
  ippo_mcast_ttl: number;
}

declare class unnamed_11981656854238758750 {
  constructor(init?: unnamed_11981656854238758750);
  sa_wifi_status: number;
  sa_cell_status: number;
}

declare class unnamed_3135730658466400099 {
  constructor(init?: unnamed_3135730658466400099);
  sa_unused: number;
}

declare class symptoms_advisory {
  constructor(init?: symptoms_advisory);
}

declare class mptcp_flow {
  constructor(init?: mptcp_flow);
  flow_len: number;
  flow_tcpci_offset: number;
  flow_flags: number;
  flow_cid: number;
  flow_src: sockaddr_storage;
  flow_dst: sockaddr_storage;
  flow_relseq: number;
  flow_soerror: number;
  flow_probecnt: number;
  flow_ci: conninfo_tcp;
}

declare class tcp_measure_bw_burst {
  constructor(init?: tcp_measure_bw_burst);
  min_burst_size: number;
  max_burst_size: number;
}

declare class open_args {
  constructor(init?: open_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class tcp_info {
  constructor(init?: tcp_info);
  tcpi_state: number;
  tcpi_options: number;
  tcpi_snd_wscale: number;
  tcpi_rcv_wscale: number;
  tcpi_flags: number;
  tcpi_rto: number;
  tcpi_snd_mss: number;
  tcpi_rcv_mss: number;
  tcpi_rttcur: number;
  tcpi_srtt: number;
  tcpi_rttvar: number;
  tcpi_rttbest: number;
  tcpi_snd_ssthresh: number;
  tcpi_snd_cwnd: number;
  tcpi_rcv_space: number;
  tcpi_snd_wnd: number;
  tcpi_snd_nxt: number;
  tcpi_rcv_nxt: number;
  tcpi_last_outif: number;
  tcpi_snd_sbbytes: number;
  tcpi_txpackets: number;
  tcpi_txbytes: number;
  tcpi_txretransmitbytes: number;
  tcpi_txunacked: number;
  tcpi_rxpackets: number;
  tcpi_rxbytes: number;
  tcpi_rxduplicatebytes: number;
  tcpi_rxoutoforderbytes: number;
  tcpi_snd_bw: number;
  tcpi_synrexmits: number;
  tcpi_unused1: number;
  tcpi_unused2: number;
  tcpi_cell_rxpackets: number;
  tcpi_cell_rxbytes: number;
  tcpi_cell_txpackets: number;
  tcpi_cell_txbytes: number;
  tcpi_wifi_rxpackets: number;
  tcpi_wifi_rxbytes: number;
  tcpi_wifi_txpackets: number;
  tcpi_wifi_txbytes: number;
  tcpi_wired_rxpackets: number;
  tcpi_wired_rxbytes: number;
  tcpi_wired_txpackets: number;
  tcpi_wired_txbytes: number;
  tcpi_connstatus: tcp_conn_status;
  tcpi_tfo_cookie_req: number;
  tcpi_tfo_cookie_rcv: number;
  tcpi_tfo_syn_loss: number;
  tcpi_tfo_syn_data_sent: number;
  tcpi_tfo_syn_data_acked: number;
  tcpi_tfo_syn_data_rcv: number;
  tcpi_tfo_cookie_req_rcv: number;
  tcpi_tfo_cookie_sent: number;
  tcpi_tfo_cookie_invalid: number;
  tcpi_tfo_cookie_wrong: number;
  tcpi_tfo_no_cookie_rcv: number;
  tcpi_tfo_heuristics_disable: number;
  tcpi_tfo_send_blackhole: number;
  tcpi_tfo_recv_blackhole: number;
  tcpi_tfo_onebyte_proxy: number;
  tcpi_ecn_client_setup: number;
  tcpi_ecn_server_setup: number;
  tcpi_ecn_success: number;
  tcpi_ecn_lost_syn: number;
  tcpi_ecn_lost_synack: number;
  tcpi_local_peer: number;
  tcpi_if_cell: number;
  tcpi_if_wifi: number;
  tcpi_if_wired: number;
  tcpi_if_wifi_infra: number;
  tcpi_if_wifi_awdl: number;
  tcpi_snd_background: number;
  tcpi_rcv_background: number;
  tcpi_l4s_enabled: number;
  tcpi_ecn_recv_ce: number;
  tcpi_ecn_recv_cwr: number;
  tcpi_rcvoopack: number;
  tcpi_pawsdrop: number;
  tcpi_sack_recovery_episode: number;
  tcpi_reordered_pkts: number;
  tcpi_dsack_sent: number;
  tcpi_dsack_recvd: number;
  tcpi_flowhash: number;
  tcpi_txretransmitpackets: number;
  tcpi_rcv_srtt: number;
  tcpi_client_accecn_state: number;
  tcpi_server_accecn_state: number;
  tcpi_ecn_capable_packets_sent: number;
  tcpi_ecn_capable_packets_acked: number;
  tcpi_ecn_capable_packets_marked: number;
  tcpi_ecn_capable_packets_lost: number;
  tcpi_received_ce_packets: number;
  tcpi_received_ect0_bytes: number;
  tcpi_received_ect1_bytes: number;
  tcpi_received_ce_bytes: number;
  tcpi_delivered_ect0_bytes: number;
  tcpi_delivered_ect1_bytes: number;
  tcpi_delivered_ce_bytes: number;
  tcpi_flow_control_total_time: number;
  tcpi_rcvwnd_limited_total_time: number;
  tcpi_pacing_rate: number;
  tcpi_max_pacing_rate: number;
}

declare class unnamed_11712173663391785384 {
  constructor(init?: unnamed_11712173663391785384);
  probe_activated: number;
  write_probe_failed: number;
  read_probe_failed: number;
  conn_probe_failed: number;
}

declare class tcp_notify_ack_complete {
  constructor(init?: tcp_notify_ack_complete);
  notify_pending: number;
  notify_complete_count: number;
  notify_complete_id: unknown /* const array */;
}

declare class tcpstat {
  constructor(init?: tcpstat);
  tcps_connattempt: number;
  tcps_accepts: number;
  tcps_connects: number;
  tcps_drops: number;
  tcps_conndrops: number;
  tcps_closed: number;
  tcps_segstimed: number;
  tcps_rttupdated: number;
  tcps_delack: number;
  tcps_timeoutdrop: number;
  tcps_rexmttimeo: number;
  tcps_persisttimeo: number;
  tcps_keeptimeo: number;
  tcps_keepprobe: number;
  tcps_keepdrops: number;
  tcps_sndtotal: number;
  tcps_sndpack: number;
  tcps_sndbyte: number;
  tcps_sndrexmitpack: number;
  tcps_sndrexmitbyte: number;
  tcps_sndacks: number;
  tcps_sndprobe: number;
  tcps_sndurg: number;
  tcps_sndwinup: number;
  tcps_sndctrl: number;
  tcps_rcvtotal: number;
  tcps_rcvpack: number;
  tcps_rcvbyte: number;
  tcps_rcvbadsum: number;
  tcps_rcvbadoff: number;
  tcps_rcvmemdrop: number;
  tcps_rcvshort: number;
  tcps_rcvduppack: number;
  tcps_rcvdupbyte: number;
  tcps_rcvpartduppack: number;
  tcps_rcvpartdupbyte: number;
  tcps_rcvoopack: number;
  tcps_rcvoobyte: number;
  tcps_rcvpackafterwin: number;
  tcps_rcvbyteafterwin: number;
  tcps_rcvafterclose: number;
  tcps_rcvwinprobe: number;
  tcps_rcvdupack: number;
  tcps_rcvacktoomuch: number;
  tcps_rcvackpack: number;
  tcps_rcvackbyte: number;
  tcps_rcvwinupd: number;
  tcps_pawsdrop: number;
  tcps_predack: number;
  tcps_preddat: number;
  tcps_cachedrtt: number;
  tcps_cachedrttvar: number;
  tcps_cachedssthresh: number;
  tcps_usedrtt: number;
  tcps_usedrttvar: number;
  tcps_usedssthresh: number;
  tcps_persistdrop: number;
  tcps_badsyn: number;
  tcps_mturesent: number;
  tcps_listendrop: number;
  tcps_synchallenge: number;
  tcps_rstchallenge: number;
  tcps_minmssdrops: number;
  tcps_sndrexmitbad: number;
  tcps_badrst: number;
  tcps_sc_dropped: number;
  tcps_sc_completed: number;
  tcps_sc_aborted: number;
  tcps_sc_sendcookie: number;
  tcps_sc_recvcookie: number;
  tcps_sack_recovery_episode: number;
  tcps_sack_rexmits: number;
  tcps_sack_rexmit_bytes: number;
  tcps_sack_rcv_blocks: number;
  tcps_sack_send_blocks: number;
  tcps_sack_sboverflow: number;
  tcps_rack_recovery_episode: number;
  tcps_rack_reordering_timeout_recovery_episode: number;
  tcps_rack_rexmits: number;
  tcps_bg_rcvtotal: number;
  tcps_rxtfindrop: number;
  tcps_fcholdpacket: number;
  tcps_limited_txt: number;
  tcps_early_rexmt: number;
  tcps_sack_ackadv: number;
  tcps_rcv_swcsum: number;
  tcps_rcv_swcsum_bytes: number;
  tcps_rcv6_swcsum: number;
  tcps_rcv6_swcsum_bytes: number;
  tcps_snd_swcsum: number;
  tcps_snd_swcsum_bytes: number;
  tcps_snd6_swcsum: number;
  tcps_snd6_swcsum_bytes: number;
  tcps_invalid_mpcap: number;
  tcps_invalid_joins: number;
  tcps_mpcap_fallback: number;
  tcps_join_fallback: number;
  tcps_estab_fallback: number;
  tcps_invalid_opt: number;
  tcps_mp_reducedwin: number;
  tcps_mp_badcsum: number;
  tcps_mp_oodata: number;
  tcps_mp_switches: number;
  tcps_mp_rcvtotal: number;
  tcps_mp_rcvbytes: number;
  tcps_mp_sndpacks: number;
  tcps_mp_sndbytes: number;
  tcps_join_rxmts: number;
  tcps_tailloss_rto: number;
  tcps_reordered_pkts: number;
  tcps_recovered_pkts: number;
  tcps_pto: number;
  tcps_rto_after_pto: number;
  tcps_tlp_recovery: number;
  tcps_tlp_recoverlastpkt: number;
  tcps_ecn_client_success: number;
  tcps_ecn_recv_ece: number;
  tcps_ecn_sent_ece: number;
  tcps_detect_reordering: number;
  tcps_delay_recovery: number;
  tcps_avoid_rxmt: number;
  tcps_pto_in_recovery: number;
  tcps_pmtudbh_reverted: number;
  tcps_dsack_ackloss: number;
  tcps_dsack_badrexmt: number;
  tcps_dsack_sent: number;
  tcps_dsack_recvd: number;
  tcps_dsack_recvd_old: number;
  tcps_mp_sel_rtt: number;
  tcps_mp_sel_rto: number;
  tcps_mp_num_probes: number;
  tcps_mp_verdowngrade: number;
  tcps_drop_after_sleep: number;
  tcps_probe_if: number;
  tcps_probe_if_conflict: number;
  tcps_ecn_client_setup: number;
  tcps_ecn_server_setup: number;
  tcps_ecn_server_success: number;
  tcps_ecn_ace_syn_not_ect: number;
  tcps_ecn_ace_syn_ect1: number;
  tcps_ecn_ace_syn_ect0: number;
  tcps_ecn_ace_syn_ce: number;
  tcps_ecn_lost_synack: number;
  tcps_ecn_lost_syn: number;
  tcps_ecn_not_supported: number;
  tcps_ecn_recv_ce: number;
  tcps_ecn_ace_recv_ce: number;
  tcps_ecn_conn_recv_ce: number;
  tcps_ecn_conn_recv_ece: number;
  tcps_ecn_conn_plnoce: number;
  tcps_ecn_conn_pl_ce: number;
  tcps_ecn_conn_nopl_ce: number;
  tcps_ecn_fallback_synloss: number;
  tcps_ecn_fallback_reorder: number;
  tcps_ecn_fallback_ce: number;
  tcps_tfo_syn_data_rcv: number;
  tcps_tfo_cookie_req_rcv: number;
  tcps_tfo_cookie_sent: number;
  tcps_tfo_cookie_invalid: number;
  tcps_tfo_cookie_req: number;
  tcps_tfo_cookie_rcv: number;
  tcps_tfo_syn_data_sent: number;
  tcps_tfo_syn_data_acked: number;
  tcps_tfo_syn_loss: number;
  tcps_tfo_blackhole: number;
  tcps_tfo_cookie_wrong: number;
  tcps_tfo_no_cookie_rcv: number;
  tcps_tfo_heuristics_disable: number;
  tcps_tfo_sndblackhole: number;
  tcps_mss_to_default: number;
  tcps_mss_to_medium: number;
  tcps_mss_to_low: number;
  tcps_ecn_fallback_droprst: number;
  tcps_ecn_fallback_droprxmt: number;
  tcps_ecn_fallback_synrst: number;
  tcps_mptcp_rcvmemdrop: number;
  tcps_mptcp_rcvduppack: number;
  tcps_mptcp_rcvpackafterwin: number;
  tcps_timer_drift_le_1_ms: number;
  tcps_timer_drift_le_10_ms: number;
  tcps_timer_drift_le_20_ms: number;
  tcps_timer_drift_le_50_ms: number;
  tcps_timer_drift_le_100_ms: number;
  tcps_timer_drift_le_200_ms: number;
  tcps_timer_drift_le_500_ms: number;
  tcps_timer_drift_le_1000_ms: number;
  tcps_timer_drift_gt_1000_ms: number;
  tcps_mptcp_handover_attempt: number;
  tcps_mptcp_interactive_attempt: number;
  tcps_mptcp_aggregate_attempt: number;
  tcps_mptcp_fp_handover_attempt: number;
  tcps_mptcp_fp_interactive_attempt: number;
  tcps_mptcp_fp_aggregate_attempt: number;
  tcps_mptcp_heuristic_fallback: number;
  tcps_mptcp_fp_heuristic_fallback: number;
  tcps_mptcp_handover_success_wifi: number;
  tcps_mptcp_handover_success_cell: number;
  tcps_mptcp_interactive_success: number;
  tcps_mptcp_aggregate_success: number;
  tcps_mptcp_fp_handover_success_wifi: number;
  tcps_mptcp_fp_handover_success_cell: number;
  tcps_mptcp_fp_interactive_success: number;
  tcps_mptcp_fp_aggregate_success: number;
  tcps_mptcp_handover_cell_from_wifi: number;
  tcps_mptcp_handover_wifi_from_cell: number;
  tcps_mptcp_interactive_cell_from_wifi: number;
  tcps_mptcp_handover_cell_bytes: number;
  tcps_mptcp_interactive_cell_bytes: number;
  tcps_mptcp_aggregate_cell_bytes: number;
  tcps_mptcp_handover_all_bytes: number;
  tcps_mptcp_interactive_all_bytes: number;
  tcps_mptcp_aggregate_all_bytes: number;
  tcps_mptcp_back_to_wifi: number;
  tcps_mptcp_wifi_proxy: number;
  tcps_mptcp_cell_proxy: number;
  tcps_ka_offload_drops: number;
  tcps_mptcp_triggered_cell: number;
  tcps_fin_timeout_drops: number;
  tcps_rst_dup_suppressed: number;
  tcps_rst_not_suppressed: number;
}

declare class tsegqe_head {
  constructor(init?: tsegqe_head);
  lh_first: number;
}

declare class tseg_qent {
  constructor(init?: tseg_qent);
}

declare class __Request__mach_memory_entry_get_page_counts_t {
  constructor(init?: __Request__mach_memory_entry_get_page_counts_t);
  Head: mach_msg_header_t;
}

declare class __Request__mach_vm_region_recurse_t {
  constructor(init?: __Request__mach_vm_region_recurse_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  nesting_depth: number;
  infoCnt: number;
}

declare class componentname {
  constructor(init?: componentname);
}

declare class bootp_packet {
  constructor(init?: bootp_packet);
  bp_ip: ip;
  bp_udp: udphdr;
  bp_bootp: bootp;
}

declare class unnamed_5375411979151535343 {
  constructor(init?: unnamed_5375411979151535343);
  NV1_opcode: number;
  NV1_xid: number;
  NV1_text: unknown /* const array */;
  NV1_null: number;
}

declare class vend {
  constructor(init?: vend);
  v_magic: unknown /* const array */;
  v_flags: number;
  v_unused: unknown /* const array */;
}

declare class vnop_advlock_args {
  constructor(init?: vnop_advlock_args);
}

declare class usrctl_args {
  constructor(init?: usrctl_args);
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class igmp_report {
  constructor(init?: igmp_report);
  ir_type: number;
  ir_rsv1: number;
  ir_cksum: number;
  ir_rsv2: number;
  ir_numgrps: number;
}

declare class igmp_grouprec {
  constructor(init?: igmp_grouprec);
  ig_type: number;
  ig_datalen: number;
  ig_numsrc: number;
  ig_group: in_addr;
}

declare class __Request__sysdiagnose_notification_t {
  constructor(init?: __Request__sysdiagnose_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  flags: number;
}

declare class id_ts {
  constructor(init?: id_ts);
  its_otime: number;
  its_rtime: number;
  its_ttime: number;
}

declare class ih_rtradv {
  constructor(init?: ih_rtradv);
  irt_num_addrs: number;
  irt_wpa: number;
  irt_lifetime: number;
}

declare class ih_idseq {
  constructor(init?: ih_idseq);
  icd_id: number;
  icd_seq: number;
}

declare class icmp {
  constructor(init?: icmp);
  icmp_type: number;
  icmp_code: number;
  icmp_cksum: number;
  icmp_hun: unnamed_7126892800148845993;
  icmp_dun: unnamed_16860321427244527420;
}

declare class EXDisplayPipeFrameInfo {
  constructor(init?: EXDisplayPipeFrameInfo);
  valid: boolean;
  sca_factor: number;
  scl_alpha: number;
  hue: number;
  saturation: number;
  value: number;
  edge_similarity: number;
  edge_strength: number;
  edge_similarity_boundary: number;
}

declare class EXDisplayPipeHealthStats {
  constructor(init?: EXDisplayPipeHealthStats);
  globalhealth: number;
  scldriver: number;
  scadriver: number;
  scaalgorithm: number;
  pipe: number;
  link: number;
  brightness: number;
  tconcrc: number;
  tconhealth: number;
  tconhpd: number;
  dcptransporthealth: number;
  silhealth: number;
  periodicHealthCheck: number;
  hwlinkfailures: number;
  nonauthenticpanel: number;
  sclDriverFailureTime: number;
  scaDriverFailureTime: number;
  scaAlgorithmFailureTime: number;
  pipeFailureTime: number;
  linkFailureTime: number;
  globalHealthFailureTime: number;
  hwlinkfailuresFailureTime: number;
  silHealthFailureTime: number;
  brightnessFailureTime: number;
  tconCrcFailureTime: number;
  tconHealthFailureTime: number;
  tconHpdFailureTime: number;
  dcpTransportHealthFailureTime: number;
  nonauthenticpanelFailureTime: number;
  scaFailuresBeyondThresh: number;
  crcFailuresBeyondThresh: number;
  globalHealthCp: number;
  sclDriverCp: number;
  scaDriverCp: number;
  scaAlgorithmCp: number;
  pipeCp: number;
  linkCp: number;
  brightnessCp: number;
  tconCrcCp: number;
  tconHealthCp: number;
  tconHpdCp: number;
  dcpTransportHealthCp: number;
  silHealthCp: number;
  hwlinkfailuresCp: number;
  nonauthenticpanelCp: number;
  averageSCAVariance: number;
  averageCRCVariance: number;
}

declare class unnamed_16957772744137294220 {
  constructor(init?: unnamed_16957772744137294220);
  prevTimebase: number;
  prevTimestamp: number;
  currTimebase: number;
  currTimestamp: number;
  timeDiff: number;
  timebaseDiff: number;
}

declare class EXDisplayPipeStatus {
  constructor(init?: EXDisplayPipeStatus);
  displayedSwapID: number;
  validDisplayedID: boolean;
  poweredOn: boolean;
  indicators: unknown /* const array */;
  health_report: EXDisplayPipeHealthReport;
  cancelledQueue: unknown /* const array */;
  droppedQueue: unknown /* const array */;
  cancelledCount: number;
  droppedCount: number;
}

declare class dyld_chained_ptr_64_kernel_cache_rebase {
  constructor(init?: dyld_chained_ptr_64_kernel_cache_rebase);
  target: number;
  cacheLevel: number;
  diversity: number;
  addrDiv: number;
  key: number;
  next: number;
  isAuth: number;
}

declare class EXDisplayPipeHealthRecord {
  constructor(init?: EXDisplayPipeHealthRecord);
  timestamp: number;
  health: boolean;
}

declare class OSAction_AFKUserDataPipe__HandleCommand_IVars {
  constructor(init?: OSAction_AFKUserDataPipe__HandleCommand_IVars);
}

declare class OSAction_AFKUserDataPipe__HandleResponse_LocalIVars {
  constructor(init?: OSAction_AFKUserDataPipe__HandleResponse_LocalIVars);
}

declare class OSAction_AFKUserDataPipe__HandleResponse_IVars {
  constructor(init?: OSAction_AFKUserDataPipe__HandleResponse_IVars);
}

declare class tb_endpoint_s {
  constructor(init?: tb_endpoint_s);
}

declare class AFKEndpointInterface_IVars {
  constructor(init?: AFKEndpointInterface_IVars);
}

declare class task_access_subsystem {
  constructor(init?: task_access_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class DebugKeyAction {
  constructor(init?: DebugKeyAction);
  debugArgRequired: boolean;
  mask: number;
  action: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  parameter: interop.Pointer;
}

declare class KeyValueMask {
  constructor(init?: KeyValueMask);
  key: Key;
  mask: number;
}

declare class OSAction_IOHIDEventService__CopyEvent_LocalIVars {
  constructor(init?: OSAction_IOHIDEventService__CopyEvent_LocalIVars);
}

declare class OSAction_IOHIDEventService__CopyEvent_IVars {
  constructor(init?: OSAction_IOHIDEventService__CopyEvent_IVars);
}

declare class OSAction_IOHIDEventService__SetLED_LocalIVars {
  constructor(init?: OSAction_IOHIDEventService__SetLED_LocalIVars);
}

declare class OSAction_IOHIDEventService__SetLED_IVars {
  constructor(init?: OSAction_IOHIDEventService__SetLED_IVars);
}

declare class IOHIDEventService_IVars {
  constructor(init?: IOHIDEventService_IVars);
}

declare class IOHIDDigitizerTouchData {
  constructor(init?: IOHIDDigitizerTouchData);
}

declare class IOHIDDigitizerStylusData {
  constructor(init?: IOHIDDigitizerStylusData);
}

declare class unnamed_16542306770173988349 {
  constructor(init?: unnamed_16542306770173988349);
  contextLock: number;
  state: number;
  owner: interop.Pointer;
  version: number;
  structSize: number;
  reserved: unknown /* const array */;
}

declare class z_stream_s {
  constructor(init?: z_stream_s);
  next_in: interop.Pointer;
  avail_in: number;
  total_in: number;
  next_out: interop.Pointer;
  avail_out: number;
  total_out: number;
  msg: string | null;
  state: interop.Pointer;
  zalloc: (p1: interop.PointerConvertible, p2: number, p3: number) => interop.Pointer | null;
  zfree: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  opaque: interop.Pointer;
  data_type: number;
  adler: number;
  reserved: number;
}

declare class IOCircularDataQueueMemoryCursor {
  constructor(init?: IOCircularDataQueueMemoryCursor);
  generation: number;
  position: number;
  sequenceNum: number;
}

declare class unnamed_14229012674224057930 {
  constructor(init?: unnamed_14229012674224057930);
  seqNum: bigint;
  wrIndex: bigint;
  generation: bigint;
  rstStatus: bigint;
  wrStatus: bigint;
}

declare class IOHIDInterface_LocalIVars {
  constructor(init?: IOHIDInterface_LocalIVars);
}

declare class route_in6_old {
  constructor(init?: route_in6_old);
  ro_rt: interop.Pointer;
  ro_flags: number;
  ro_dst: sockaddr_in6;
}

declare class IOHIDInterface_IVars {
  constructor(init?: IOHIDInterface_IVars);
}

declare class msginfo {
  constructor(init?: msginfo);
  msgmax: number;
  msgmni: number;
  msgmnb: number;
  msgtql: number;
  msgssz: number;
  msgseg: number;
}

declare class unnamed_12861891672978975315 {
  constructor(init?: unnamed_12861891672978975315);
  userCallback: number;
  userRefCon: number;
  internalRefCon: number;
  asyncIDRefCon: number;
  reserved: number;
}

declare class unnamed_209822808425525863 {
  constructor(init?: unnamed_209822808425525863);
  length: number;
  data: unknown /* const array */;
}

declare class unnamed_16335416013016993515 {
  constructor(init?: unnamed_16335416013016993515);
  connectionHandle: number;
}

declare class unnamed_1386749823636698887 {
  constructor(init?: unnamed_1386749823636698887);
  length: number;
  data: unknown /* const array */;
}

declare class unnamed_2993676156382471193 {
  constructor(init?: unnamed_2993676156382471193);
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
}

declare class unnamed_10390242794974579164 {
  constructor(init?: unnamed_10390242794974579164);
  error: number;
  connectionHandle: number;
  page: number;
  maxPage: number;
  lmpFeatures: BluetoothHCISupportedFeatures;
}

declare class unnamed_3417869383875129114 {
  constructor(init?: unnamed_3417869383875129114);
  debug_arch_version: number;
  trace_extn_version: number;
  perf_extn_version: number;
  brps: number;
  reserved0: number;
  wrps: number;
  reserved1: number;
  ctx_cmps: number;
  reserved32: number;
}

declare class unnamed_11662164036177659439 {
  constructor(init?: unnamed_11662164036177659439);
  error: number;
  connectionHandle: number;
  lmpFeatures: BluetoothHCISupportedFeatures;
}

declare class unnamed_13378802275720122984 {
  constructor(init?: unnamed_13378802275720122984);
  connectionHandle: number;
  packetType: number;
}

declare class unnamed_11542088580453735205 {
  constructor(init?: unnamed_11542088580453735205);
  linkType: number;
}

declare class unnamed_18204092119029278614 {
  constructor(init?: unnamed_18204092119029278614);
  error: number;
}

declare class unnamed_10727096791350198791 {
  constructor(init?: unnamed_10727096791350198791);
  deviceAddress: BluetoothDeviceAddress;
  linkKey: BluetoothKey;
}

declare class unnamed_7527454571306044784 {
  constructor(init?: unnamed_7527454571306044784);
  deviceAddress: BluetoothDeviceAddress;
  linkKey: BluetoothKey;
  keyType: number;
}

declare class unnamed_743522358268798888 {
  constructor(init?: unnamed_743522358268798888);
  deviceAddress: BluetoothDeviceAddress;
  deviceName: unknown /* const array */;
}

declare class unnamed_6940036053265067667 {
  constructor(init?: unnamed_6940036053265067667);
  connectionHandle: number;
  lmpVersion: number;
  manufacturerName: number;
  lmpSubversion: number;
}

declare class unnamed_9424924896811512953 {
  constructor(init?: unnamed_9424924896811512953);
  connectionHandle: number;
  reason: number;
}

declare class unnamed_14942451247212652301 {
  constructor(init?: unnamed_14942451247212652301);
  connectionHandle: number;
  usedFeatures: BluetoothHCISupportedFeatures;
}

declare class kd_regtype {
  constructor(init?: kd_regtype);
  type: number;
  value1: number;
  value2: number;
  value3: number;
  value4: number;
}

declare class unnamed_6684925693671454163 {
  constructor(init?: unnamed_6684925693671454163);
  connectionHandle: number;
  role: number;
  peerAddressType: number;
  peerAddress: BluetoothDeviceAddress;
  connInterval: number;
  connLatency: number;
  supervisionTimeout: number;
  masterClockAccuracy: number;
}

declare class unnamed_13878812411451609392 {
  constructor(init?: unnamed_13878812411451609392);
  connectionHandle: number;
  transmissionInterval: number;
  retransmissionWindow: number;
  receivePacketLength: number;
  transmitPacketLength: number;
}

declare class unnamed_12162695335269374428 {
  constructor(init?: unnamed_12162695335269374428);
  transmitBandWidth: number;
  receiveBandWidth: number;
  maxLatency: number;
  voiceSetting: number;
  retransmissionEffort: number;
  packetType: number;
}

declare class unnamed_13305240614445395865 {
  constructor(init?: unnamed_13305240614445395865);
  deviceAddress: BluetoothDeviceAddress;
  numericValue: number;
}

declare class unnamed_4892760219257366909 {
  constructor(init?: unnamed_4892760219257366909);
  handle: number;
  mode: number;
  afhMap: unknown /* const array */;
}

declare class unnamed_14833996286085951864 {
  constructor(init?: unnamed_14833996286085951864);
  data: unknown /* const array */;
}

declare class unnamed_1280015526819348806 {
  constructor(init?: unnamed_1280015526819348806);
  handle: number;
  lmp_handle: number;
  reserved: number;
}

declare class unnamed_6642981270794254251 {
  constructor(init?: unnamed_6642981270794254251);
  numberOfReponses: number;
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
  reserved: number;
  classOfDevice: number;
  clockOffset: number;
  RSSIValue: number;
  extendedInquiryResponse: BluetoothHCIExtendedInquiryResponse;
}

declare class unnamed_6076190237667868217 {
  constructor(init?: unnamed_6076190237667868217);
  outFECRequired: number;
  extendedInquiryResponse: BluetoothHCIExtendedInquiryResponse;
}

declare class unnamed_15787006660502189549 {
  constructor(init?: unnamed_15787006660502189549);
  productID: number;
  vendorID: number;
  type: number;
  productName: unknown /* const array */;
  vendorName: unknown /* const array */;
  totalDataBytesSent: number;
  totalSCOBytesSent: number;
  totalDataBytesReceived: number;
  totalSCOBytesReceived: number;
}

declare class unnamed_4418335964267340658 {
  constructor(init?: unnamed_4418335964267340658);
  handle: number;
  timeout: number;
}

declare class unnamed_15132999648494051444 {
  constructor(init?: unnamed_15132999648494051444);
  handle: number;
  level: number;
}

declare class unnamed_6273303174510253851 {
  constructor(init?: unnamed_6273303174510253851);
  count: number;
  codes: unknown /* const array */;
}

declare class unnamed_13224477250890307626 {
  constructor(init?: unnamed_13224477250890307626);
  count: number;
  codes: interop.Pointer;
}

declare class unnamed_18189720082080832256 {
  constructor(init?: unnamed_18189720082080832256);
  numLinkKeysRead: number;
  maxNumLinkKeysAllowedInDevice: number;
}

declare class unnamed_5674162538201217341 {
  constructor(init?: unnamed_5674162538201217341);
  ACLDataPacketLength: number;
  totalNumACLDataPackets: number;
}

declare class unnamed_14036872911643711871 {
  constructor(init?: unnamed_14036872911643711871);
  ACLDataPacketLength: number;
  SCODataPacketLength: number;
  totalNumACLDataPackets: number;
  totalNumSCODataPackets: number;
}

declare class unnamed_8789733219262922860 {
  constructor(init?: unnamed_8789733219262922860);
  manufacturerName: number;
  lmpVersion: number;
  lmpSubVersion: number;
  hciVersion: number;
  hciRevision: number;
}

declare class unnamed_2947376281178706028 {
  constructor(init?: unnamed_2947376281178706028);
  connectionHandle: number;
  flags: number;
  flowDirection: number;
  serviceType: number;
  tokenRate: number;
  tokenBucketSize: number;
  peakBandwidth: number;
  accessLatency: number;
}

declare class unnamed_8656446920341309366 {
  constructor(init?: unnamed_8656446920341309366);
  transmitBandwidth: number;
  receiveBandwidth: number;
  maxLatency: number;
  contentFormat: number;
  retransmissionEffort: number;
  packetType: number;
}

declare class unnamed_9590042042435496712 {
  constructor(init?: unnamed_9590042042435496712);
  flags: number;
  serviceType: number;
  tokenRate: number;
  peakBandwidth: number;
  latency: number;
  delayVariation: number;
}

declare class unnamed_1136442601369146365 {
  constructor(init?: unnamed_1136442601369146365);
  handle: number;
  keySize: number;
}

declare class unnamed_15140756585836518908 {
  constructor(init?: unnamed_15140756585836518908);
  handle: number;
  qualityValue: number;
}

declare class unnamed_7216459396526501576 {
  constructor(init?: unnamed_7216459396526501576);
  count: number;
  handle: number;
}

declare class fat_header {
  constructor(init?: fat_header);
  magic: number;
  nfat_arch: number;
}

declare class unnamed_11077575776574576594 {
  constructor(init?: unnamed_11077575776574576594);
  data: unknown /* const array */;
}

declare class unnamed_6670892677497043792 {
  constructor(init?: unnamed_6670892677497043792);
  data: unknown /* const array */;
}

declare class daleipc_channel_controller {
  constructor(init?: daleipc_channel_controller);
}

declare class unnamed_6844891171352842389 {
  constructor(init?: unnamed_6844891171352842389);
  data: unknown /* const array */;
}

declare class unnamed_15707010219511826939 {
  constructor(init?: unnamed_15707010219511826939);
  flags: number;
  txWindowSize: number;
  maxTransmit: number;
  retransmissionTimeout: number;
  monitorTimeout: number;
  maxPDUPayloadSize: number;
}

declare class unnamed_17432070091619386915 {
  constructor(init?: unnamed_17432070091619386915);
  flags: number;
  serviceType: number;
  tokenRate: number;
  tokenBucketSize: number;
  peakBandwidth: number;
  latency: number;
  delayVariation: number;
}

declare class unnamed_10510658829443334742 {
  constructor(init?: unnamed_10510658829443334742);
  data: unknown /* const array */;
}

declare class unnamed_7603538072180196490 {
  constructor(init?: unnamed_7603538072180196490);
  data: unknown /* const array */;
}

declare class unnamed_17479494569661773798 {
  constructor(init?: unnamed_17479494569661773798);
  data: unknown /* const array */;
}

declare class searchfs_args {
  constructor(init?: searchfs_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  searchblock_l_: unknown /* const array */;
  searchblock: number;
  searchblock_r_: unknown /* const array */;
  nummatches_l_: unknown /* const array */;
  nummatches: number;
  nummatches_r_: unknown /* const array */;
  scriptcode_l_: unknown /* const array */;
  scriptcode: number;
  scriptcode_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
  state_l_: unknown /* const array */;
  state: number;
  state_r_: unknown /* const array */;
}

declare class _AVCUnitPlugs {
  constructor(init?: _AVCUnitPlugs);
  numIsochInPlugs: number;
  numIsochOutPlugs: number;
  numExternalInPlugs: number;
  numExternalOutPlugs: number;
  isochInPlugRecord: unknown /* const array */;
  isochOutPlugRecord: unknown /* const array */;
  externalInPlugRecord: unknown /* const array */;
  externalOutPlugRecord: unknown /* const array */;
}

declare class _AVCUnitPlugRecord {
  constructor(init?: _AVCUnitPlugRecord);
  connectionCount: number;
}

declare class _AVCSubunitPlugRecord {
  constructor(init?: _AVCSubunitPlugRecord);
  plugSignalFormat: number;
  connectionCount: number;
}

declare class _AVCGetTargetPlugConnectionOutParams {
  constructor(init?: _AVCGetTargetPlugConnectionOutParams);
  connectedSubunitTypeAndID: number;
  connectedPlugType: interop.Enum<typeof IOFWAVCPlugTypes>;
  connectedPlugNum: number;
  lockConnection: number;
  permConnection: number;
}

declare class _AVCGetTargetPlugConnectionInParams {
  constructor(init?: _AVCGetTargetPlugConnectionInParams);
  subunitTypeAndID: number;
  plugType: interop.Enum<typeof IOFWAVCPlugTypes>;
  plugNum: number;
}

declare class _AVCConnectTargetPlugsOutParams {
  constructor(init?: _AVCConnectTargetPlugsOutParams);
  sourcePlugNum: number;
  destPlugNum: number;
}

declare class IOAudioClientBufferExtendedInfo {
  constructor(init?: IOAudioClientBufferExtendedInfo);
  bufferSetID: number;
  paramBuffer: interop.Pointer;
  paramBufferDescriptor: interop.Pointer;
  paramBufferMap: interop.Pointer;
  unmappedParamBuffer: interop.Pointer;
  mNextExtended: interop.Pointer;
}

declare class IOAudioClientBuffer {
  constructor(init?: IOAudioClientBuffer);
  userClient: interop.Pointer;
  audioStream: interop.Pointer;
  sourceBuffer: interop.Pointer;
  sourceBufferDescriptor: interop.Pointer;
  sourceBufferMap: interop.Pointer;
  unmappedSourceBuffer: interop.Pointer;
  numSampleFrames: number;
  numChannels: number;
  mixedPosition: IOAudioEnginePosition;
  mNextBuffer32: interop.Pointer;
  nextClip: interop.Pointer;
  previousClip: interop.Pointer;
  nextClient: interop.Pointer;
  bufferDataDescriptor: interop.Pointer;
}

declare class IOAudioFormatNotification {
  constructor(init?: IOAudioFormatNotification);
}

declare class IOAudioEnginePosition {
  constructor(init?: IOAudioEnginePosition);
  fSampleFrame: number;
  fLoopCount: number;
}

declare class IOHistReportInfo {
  constructor(init?: IOHistReportInfo);
  bucketWidth: number;
  elem: interop.Pointer;
}

declare class IOUSBHostHIDReportDescriptor {
  constructor(init?: IOUSBHostHIDReportDescriptor);
  hidDescriptorType: number;
  hidDescriptorLengthLo: number;
  hidDescriptorLengthHi: number;
}

declare class IOUSBHostInterface_IVars {
  constructor(init?: IOUSBHostInterface_IVars);
}

declare class IOUSBHostDevice_LocalIVars {
  constructor(init?: IOUSBHostDevice_LocalIVars);
}

declare class madvise_args {
  constructor(init?: madvise_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
  behav_l_: unknown /* const array */;
  behav: number;
  behav_r_: unknown /* const array */;
}

declare class IOUSBHostPipe_IVars {
  constructor(init?: IOUSBHostPipe_IVars);
}

declare class IOUSBStandardEndpointDescriptors {
  constructor(init?: IOUSBStandardEndpointDescriptors);
  bcdUSB: number;
  descriptor: IOUSBEndpointDescriptor;
  ssCompanionDescriptor: IOUSBSuperSpeedEndpointCompanionDescriptor;
  sspCompanionDescriptor: IOUSBSuperSpeedPlusIsochronousEndpointCompanionDescriptor;
}

declare class tPacketFilterMetadata {
  constructor(init?: tPacketFilterMetadata);
  deviceAddress: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  interfaceAltSetting: number;
  endpointAddress: number;
  endpointType: number;
  speed: number;
  vid: number;
  pid: number;
  locationID: number;
}

declare class IOUSBHostIOSourceClientRecordLink {
  constructor(init?: IOUSBHostIOSourceClientRecordLink);
  le_next: interop.Pointer;
  le_prev: interop.Pointer;
}

declare class IOUSBHostIOSourceClientRecordList {
  constructor(init?: IOUSBHostIOSourceClientRecordList);
  lh_first: interop.Pointer;
}

declare class nd_opt_rdnss {
  constructor(init?: nd_opt_rdnss);
  nd_opt_rdnss_type: number;
  nd_opt_rdnss_len: number;
  nd_opt_rdnss_reserved: number;
  nd_opt_rdnss_lifetime: number;
  nd_opt_rdnss_addr: unknown /* const array */;
}

declare class IOUSBHostIsochronousCompletion {
  constructor(init?: IOUSBHostIsochronousCompletion);
  owner: interop.Pointer;
  action: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  parameter: interop.Pointer;
}

declare class audit_session_port_args {
  constructor(init?: audit_session_port_args);
  asid_l_: unknown /* const array */;
  asid: number;
  asid_r_: unknown /* const array */;
  portnamep_l_: unknown /* const array */;
  portnamep: number;
  portnamep_r_: unknown /* const array */;
}

declare class IOUSBHostIsochronousTransaction {
  constructor(init?: IOUSBHostIsochronousTransaction);
  status: number;
  requestCount: number;
  offset: number;
  completeCount: number;
  timeStamp: UnsignedWide;
  options: number;
}

declare class __Reply__find_code_signature_t {
  constructor(init?: __Reply__find_code_signature_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class IOUSBHostCompletion {
  constructor(init?: IOUSBHostCompletion);
  owner: interop.Pointer;
  action: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void | null;
  parameter: interop.Pointer;
}

declare class IOUSBHostCIMessage {
  constructor(init?: IOUSBHostCIMessage);
  control: number;
  data0: number;
  data1: number;
}

declare class DeviceRequestSetSELData {
  constructor(init?: DeviceRequestSetSELData);
  u1Sel: number;
  u1Pel: number;
  u2Sel: number;
  u2Pel: number;
}

declare class HubDescriptor {
  constructor(init?: HubDescriptor);
  bLength: number;
  bDescriptorType: number;
  bNumberPorts: number;
  wHubCharacteristics: number;
  bPowerOnToPowerGood: number;
  bHubControllerCurrent: number;
  deviceRemovable: unknown /* const array */;
  reserved: unknown /* const array */;
}

declare class SuperSpeedPlusIsochronousEndpointCompanionDescriptor {
  constructor(init?: SuperSpeedPlusIsochronousEndpointCompanionDescriptor);
  bLength: number;
  bDescriptorType: number;
  wReserved: number;
  dwBytesPerInterval: number;
}

declare class InterfaceAssociationDescriptor {
  constructor(init?: InterfaceAssociationDescriptor);
  bLength: number;
  bDescriptorType: number;
  bFirstInterface: number;
  bInterfaceCount: number;
  bFunctionClass: number;
  bFunctionSubClass: number;
  bFunctionProtocol: number;
  iFunction: number;
}

declare class pshminfo {
  constructor(init?: pshminfo);
  pshm_flags: number;
  pshm_usecount: number;
  pshm_length: number;
  pshm_mode: number;
  pshm_uid: number;
  pshm_gid: number;
  pshm_name: unknown /* const array */;
  pshm_memobject: interop.Pointer;
  pshm_label: interop.Pointer;
}

declare class BillboardAltModeCapabilityDescriptor {
  constructor(init?: BillboardAltModeCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
  bIndex: number;
  dwAlternateModeVdo: number;
}

declare class BillboardCapabilityDescriptor {
  constructor(init?: BillboardCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
  iAddtionalInfoURL: number;
  bNumberOfAlternateModes: number;
  bPreferredAlternateMode: number;
  VCONNPower: number;
  bmConfigured: unknown /* const array */;
  bcdVersion: number;
  bAdditonalFailureInfo: number;
  bReserved: number;
  altModeCapabilities: interop.Pointer;
}

declare class ContainerIDCapabilityDescriptor {
  constructor(init?: ContainerIDCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
  bReserved: number;
  containerID: unknown /* const array */;
}

declare class unnamed_16857616232028915605 {
  constructor(init?: unnamed_16857616232028915605);
  data: unknown /* const array */;
}

declare class SuperSpeedUSBDeviceCapabilityDescriptor {
  constructor(init?: SuperSpeedUSBDeviceCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
  bmAttributes: number;
  wSpeedsSupported: number;
  bFunctionalitySupport: number;
  bU1DevExitLat: number;
  bU2DevExitLat: number;
}

declare class InterfaceDescriptor {
  constructor(init?: InterfaceDescriptor);
  bLength: number;
  bDescriptorType: number;
  bInterfaceNumber: number;
  bAlternateSetting: number;
  bNumEndpoints: number;
  bInterfaceClass: number;
  bInterfaceSubClass: number;
  bInterfaceProtocol: number;
  iInterface: number;
}

declare class Descriptor {
  constructor(init?: Descriptor);
  bLength: number;
  bDescriptorType: number;
}

declare class IONormDistReportValues {
  constructor(init?: IONormDistReportValues);
  samples: number;
  mean: number;
  variance: number;
  reserved: number;
}

declare class IOFBCursorControlAttribute {
  constructor(init?: IOFBCursorControlAttribute);
  inst: interop.Pointer;
  ref: interop.Pointer;
  callouts: interop.Pointer;
  reserved: unknown /* const array */;
}

declare class IOFBCursorControlCallouts {
  constructor(init?: IOFBCursorControlCallouts);
  setCursorImage: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  setCursorState: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: boolean) => number | null;
  reserved: unknown /* const array */;
}

declare class IOFBController {
  constructor(init?: IOFBController);
}

declare class OpaqueIOCommandID {
  constructor(init?: OpaqueIOCommandID);
}

declare class IOBlockStorageWorkEndArgs {
  constructor(init?: IOBlockStorageWorkEndArgs);
  postCompletionTime: number;
}

declare class IOMbufQueue {
  constructor(init?: IOMbufQueue);
}

declare class mbuf_stat {
  constructor(init?: mbuf_stat);
  mbufs: number;
  clusters: number;
  clfree: number;
  drops: number;
  wait: number;
  drain: number;
  mtypes: unknown /* const array */;
  mcfail: number;
  mpfail: number;
  msize: number;
  mclbytes: number;
  minclsize: number;
  mlen: number;
  mhlen: number;
  bigclusters: number;
  bigclfree: number;
  bigmclbytes: number;
}

declare class RomScan {
  constructor(init?: RomScan);
}

declare class IOInterruptVector {
  constructor(init?: IOInterruptVector);
  interruptActive: number;
  interruptDisabledSoft: number;
  interruptDisabledHard: number;
  interruptRegistered: number;
  interruptLock: interop.Pointer;
  nub: interop.Pointer;
  source: number;
  target: interop.Pointer;
  handler: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number) => void | null;
  refCon: interop.Pointer;
  sharedController: interop.Pointer;
}

declare class IONVRAMDescriptor {
  constructor(init?: IONVRAMDescriptor);
  format: number;
  marker: number;
  bridgeCount: number;
  busNum: number;
  bridgeDevices: number;
  functionNum: number;
  deviceNum: number;
}

declare class catch_mach_exc_subsystem {
  constructor(init?: catch_mach_exc_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class unnamed_5632071315289819367 {
  constructor(init?: unnamed_5632071315289819367);
  offset: number;
  function: number;
  device: number;
  bus: number;
  segment: number;
  reserved: number;
}

declare class IOPCIPhysicalAddress {
  constructor(init?: IOPCIPhysicalAddress);
  physHi: IOPCIAddressSpace;
  physLo: number;
  physMid: number;
  lengthLo: number;
  lengthHi: number;
}

declare class unnamed_16674912769216290365 {
  constructor(init?: unnamed_16674912769216290365);
  registerNum: number;
  functionNum: number;
  deviceNum: number;
  busNum: number;
  space: number;
  resv: number;
  t: number;
  prefetch: number;
  reloc: number;
}

declare class IOPCIDevice_IVars {
  constructor(init?: IOPCIDevice_IVars);
}

declare class ScrollAccelInfo {
  constructor(init?: ScrollAccelInfo);
}

declare class unnamed_2523850008691988883 {
  constructor(init?: unnamed_2523850008691988883);
  usage: number;
  reserved1: number;
  stringIndex: number;
  reserved2: number;
  designatorIndex: number;
  reserved3: number;
}

declare class unnamed_1349940271187565025 {
  constructor(init?: unnamed_1349940271187565025);
  usageMin: number;
  usageMax: number;
  stringMin: number;
  stringMax: number;
  designatorMin: number;
  designatorMax: number;
}

declare class unnamed_4956359801868705484 {
  constructor(init?: unnamed_4956359801868705484);
  usage: number;
  reserved1: number;
  stringIndex: number;
  reserved2: number;
  designatorIndex: number;
  reserved3: number;
}

declare class __Request__vfs_resolve_reparent_with_audit_token_t {
  constructor(init?: __Request__vfs_resolve_reparent_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  req_id: number;
  op: number;
  path: unknown /* const array */;
  dest_path: unknown /* const array */;
  req_atoken: audit_token_t;
}

declare class unnamed_5417993191739967733 {
  constructor(init?: unnamed_5417993191739967733);
  usage: number;
  reserved1: number;
  stringIndex: number;
  reserved2: number;
  designatorIndex: number;
  reserved3: number;
}

declare class unnamed_2458411210139206337 {
  constructor(init?: unnamed_2458411210139206337);
  usageMin: number;
  usageMax: number;
  stringMin: number;
  stringMax: number;
  designatorMin: number;
  designatorMax: number;
}

declare class HIDCollectionNode {
  constructor(init?: HIDCollectionNode);
  collectionUsage: number;
  collectionUsagePage: number;
  parent: number;
  numberOfChildren: number;
  nextSibling: number;
  firstChild: number;
}

declare class HIDCapabilities {
  constructor(init?: HIDCapabilities);
  usage: number;
  usagePage: number;
  inputReportByteLength: number;
  outputReportByteLength: number;
  featureReportByteLength: number;
  numberCollectionNodes: number;
  numberInputButtonCaps: number;
  numberInputValueCaps: number;
  numberOutputButtonCaps: number;
  numberOutputValueCaps: number;
  numberFeatureButtonCaps: number;
  numberFeatureValueCaps: number;
}

declare class HIDUsageAndPage {
  constructor(init?: HIDUsageAndPage);
  usage: number;
  usagePage: number;
}

declare class IOFWDuplicateGUIDStruct {
  constructor(init?: IOFWDuplicateGUIDStruct);
  fNextGUID: interop.Pointer;
  fGUID: number;
  fLastGenSeen: number;
}

declare class IOFWNodeScan {
  constructor(init?: IOFWNodeScan);
  fControl: interop.Pointer;
  fAddr: FWAddressStruct;
  fBuf: unknown /* const array */;
  fSelfIDs: interop.Pointer;
  fNumSelfIDs: number;
  fROMSize: number;
  fRead: number;
  fCmd: interop.Pointer;
  fLockCmd: interop.Pointer;
  generation: number;
  fIRMBitBucketOld: number;
  fIRMBitBucketNew: number;
  fIRMisBad: boolean;
  speedChecking: boolean;
  fContenderNeedsChecking: boolean;
  fIRMCheckingRead: boolean;
  fIRMCheckingLock: boolean;
  fRetriesBumped: number;
  fMustNotBeRoot: boolean;
}

declare class FWMultiIsochReceiveListenerParamsStruct {
  constructor(init?: FWMultiIsochReceiveListenerParamsStruct);
  maxLatencyInFireWireCycles: number;
  expectedStreamBitRate: number;
  clientPacketReturnLatencyInFireWireCycles: number;
}

declare class FWSBP2NotifyParams {
  constructor(init?: FWSBP2NotifyParams);
  commandObject: interop.Pointer;
  notificationEvent: number;
  message: interop.Pointer;
  length: number;
  generation: number;
}

declare class unnamed_13169804758734469903 {
  constructor(init?: unnamed_13169804758734469903);
  login: interop.Pointer;
  generation: number;
  status: number;
  reconnectStatusBlock: interop.Pointer;
  reconnectStatusBlockLength: number;
}

declare class unnamed_14112952107983209019 {
  constructor(init?: unnamed_14112952107983209019);
  login: interop.Pointer;
  generation: number;
  status: number;
  statusBlock: interop.Pointer;
  statusBlockLength: number;
}

declare class FWSBP2StatusBlock {
  constructor(init?: FWSBP2StatusBlock);
  details: number;
  sbpStatus: number;
  orbOffsetHi: number;
  orbOffsetLo: number;
  status: unknown /* const array */;
}

declare class FWSBP2LoginResponse {
  constructor(init?: FWSBP2LoginResponse);
  length: number;
  loginID: number;
  commandBlockAgentAddressHi: number;
  commandBlockAgentAddressLo: number;
  reserved: number;
  reconnectHold: number;
}

declare class IOExternalMethodDispatch2022 {
  constructor(init?: IOExternalMethodDispatch2022);
  function: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  checkScalarInputCount: number;
  checkStructureInputSize: number;
  checkScalarOutputCount: number;
  checkStructureOutputSize: number;
  allowAsync: number;
  checkEntitlement: string | null;
}

declare class EFI_RUNTIME_SERVICES_32 {
  constructor(init?: EFI_RUNTIME_SERVICES_32);
  Hdr: EFI_TABLE_HEADER;
  GetTime: number;
  SetTime: number;
  GetWakeupTime: number;
  SetWakeupTime: number;
  SetVirtualAddressMap: number;
  ConvertPointer: number;
  GetVariable: number;
  GetNextVariableName: number;
  SetVariable: number;
  GetNextHighMonotonicCount: number;
  ResetSystem: number;
}

declare class IOExternalMethodDispatch {
  constructor(init?: IOExternalMethodDispatch);
  function: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  checkScalarInputCount: number;
  checkStructureInputSize: number;
  checkScalarOutputCount: number;
  checkStructureOutputSize: number;
}

declare class IOExternalTrap {
  constructor(init?: IOExternalTrap);
  object: interop.Pointer;
  func: number;
}

declare class __Request__mach_gss_init_sec_context_v3_t {
  constructor(init?: __Request__mach_gss_init_sec_context_v3_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  intoken: mach_msg_ool_descriptor_t;
  clnt_princ: mach_msg_ool_descriptor_t;
  svc_princ: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  mech: interop.Enum<typeof gssd_mechtype>;
  intokenCnt: number;
  uid: number;
  clnt_nt: interop.Enum<typeof gssd_nametype>;
  clnt_princCnt: number;
  svc_nt: interop.Enum<typeof gssd_nametype>;
  svc_princCnt: number;
  flags: number;
  etypesCnt: number;
  etypes: unknown /* const array */;
  gssd_flags: number;
  context: number;
  cred_handle: number;
}

declare class IOFWCmdQ {
  constructor(init?: IOFWCmdQ);
  fHead: interop.Pointer;
  fTail: interop.Pointer;
  executeQueue: (p1: boolean) => boolean | null;
  headChanged: (p1: interop.PointerConvertible) => number | null;
}

declare class unnamed_7386740914173246650 {
  constructor(init?: unnamed_7386740914173246650);
  results: unknown /* const array */;
  count: number;
}

declare class IOCircularDataQueueDescription {
  constructor(init?: IOCircularDataQueueDescription);
  sentinel: number;
  allocMemSize: number;
  entryDataSize: number;
  memorySize: number;
  numEntries: number;
  dataSize: number;
  padding: number;
}

declare class IOInterruptSourcePrivate {
  constructor(init?: IOInterruptSourcePrivate);
}

declare class write_nocancel_args {
  constructor(init?: write_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  cbuf_l_: unknown /* const array */;
  cbuf: number;
  cbuf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
}

declare class IOServiceStateChangeVars {
  constructor(init?: IOServiceStateChangeVars);
}

declare class OSObjectUserVars {
  constructor(init?: OSObjectUserVars);
}

declare class IOReportChannelList {
  constructor(init?: IOReportChannelList);
  nchannels: number;
  channels: interop.Pointer;
}

declare class mkfifo_args {
  constructor(init?: mkfifo_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class IOReportChannelType {
  constructor(init?: IOReportChannelType);
  report_format: number;
  reserved: number;
  categories: number;
  nelements: number;
  element_idx: number;
}

declare class IOTrackingCallSiteInfo {
  constructor(init?: IOTrackingCallSiteInfo);
  count: number;
  addressPID: number;
  address: number;
  size: unknown /* const array */;
  btPID: number;
  bt: unknown /* const array */;
}

declare class IODMAMapPageList {
  constructor(init?: IODMAMapPageList);
  pageOffset: number;
  pageListCount: number;
  pageList: interop.Pointer;
}

declare class IODMAMapSpecification {
  constructor(init?: IODMAMapSpecification);
  alignment: number;
  device: interop.Pointer;
  options: number;
  numAddressBits: number;
  resvA: unknown /* const array */;
  resvB: unknown /* const array */;
}

declare class OSDictionary {
  constructor(init?: OSDictionary);
}

declare class __Request__mach_notify_port_deleted_t {
  constructor(init?: __Request__mach_notify_port_deleted_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  name: number;
}

declare class _IOSimpleLock {
  constructor(init?: _IOSimpleLock);
}

declare class _IORWLock {
  constructor(init?: _IORWLock);
}

declare class _IOLock {
  constructor(init?: _IOLock);
}

declare class ml_cpu_info {
  constructor(init?: ml_cpu_info);
  vector_unit: number;
  cache_line_size: number;
  l1_icache_size: number;
  l1_dcache_size: number;
  l2_settings: number;
  l2_cache_size: number;
  l3_settings: number;
  l3_cache_size: number;
}

declare class ex_cb_state_t {
  constructor(init?: ex_cb_state_t);
  far: number;
}

declare class sptm_core_file_region_t {
  constructor(init?: sptm_core_file_region_t);
  vaddr: number;
  size: number;
  name: unknown /* const array */;
  padding: unknown /* const array */;
}

declare class sptm_consistent_debug {
  constructor(init?: sptm_consistent_debug);
  magic: number;
  version: number;
  is_panic: number;
  exception_number: number;
  first_esr: number;
  first_elr: number;
  first_far: number;
  panic_string_addr_phys: number;
  panic_source: number;
  panic_string: unknown /* const array */;
  n_core_file_regions: number;
  core_file_regions: unknown /* const array */;
}

declare class debug_trailer {
  constructor(init?: debug_trailer);
  sptm_consistent_debug: interop.Pointer;
  translated: number;
}

declare class sptm_io_range_t {
  constructor(init?: sptm_io_range_t);
  addr: number;
  len: number;
  type: interop.Enum<typeof sptm_frame_type_t>;
}

declare class sptm_guest_dispatch_t {
  constructor(init?: sptm_guest_dispatch_t);
  stage2_root_pt: number;
  vtcr: number;
  hcr: number;
  hacr: number;
  hcrx: number;
  sp_el0: number;
  sp_el1: number;
  mdscr_el1: number;
  tpidr_el1: number;
  tpidr_el0: number;
  tpidrro_el0: number;
  par_el1: number;
  csselr_el1: number;
  afpcr_el0: number;
  scxtnum_el0: number;
  neon: sptm_guest_dispatch_neon_t;
  gpr: sptm_guest_dispatch_gpr_t;
  sme: sptm_guest_dispatch_sme_t;
  vec: sptm_guest_dispatch_vec_t;
  cpsr: number;
  pc: number;
  apstate: number;
  flush_local_tlb: boolean;
}

declare class sptm_guest_dispatch_gpr_t {
  constructor(init?: sptm_guest_dispatch_gpr_t);
  x: unknown /* const array */;
  fp: number;
  lr: number;
}

declare class __Reply__doubleagent_lookup_xattr_t {
  constructor(init?: __Reply__doubleagent_lookup_xattr_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  err: number;
  value_offset: number;
  value_length: number;
}

declare class unnamed_5279979853968467735 {
  constructor(init?: unnamed_5279979853968467735);
  z: unknown /* const array */;
  p: unknown /* const array */;
}

declare class sptm_guest_dispatch_vec_t {
  constructor(init?: sptm_guest_dispatch_vec_t);
}

declare class sptm_guest_dispatch_neon_t {
  constructor(init?: sptm_guest_dispatch_neon_t);
  cptr_el2: number;
  fpsr: number;
  fpcr: number;
}

declare class sptm_map_page_output_t {
  constructor(init?: sptm_map_page_output_t);
  prev_pte: number;
  ptep: number;
}

declare class sptm_call_regs_t {
  constructor(init?: sptm_call_regs_t);
  x0: number;
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  x5: number;
  x6: number;
  x7: number;
}

declare class sptm_guest_exception_handoff_t {
  constructor(init?: sptm_guest_exception_handoff_t);
  x0: number;
  x1: number;
  x2: number;
  x3: number;
  elr_el2: number;
  spsr_el2: number;
  aspsr_el2: number;
}

declare class unnamed_1173359785540038269 {
  constructor(init?: unnamed_1173359785540038269);
  sk_flags: number;
}

declare class unnamed_2124654459153668523 {
  constructor(init?: unnamed_2124654459153668523);
  iommu_id: number;
  iommu_retype_params: number;
}

declare class dyld_chained_ptr_arm64e_rebase {
  constructor(init?: dyld_chained_ptr_arm64e_rebase);
  target: number;
  high8: number;
  next: number;
  bind: number;
  auth: number;
}

declare class bootp {
  constructor(init?: bootp);
  bp_op: number;
  bp_htype: number;
  bp_hlen: number;
  bp_hops: number;
  bp_xid: number;
  bp_secs: number;
  bp_unused: number;
  bp_ciaddr: in_addr;
  bp_yiaddr: in_addr;
  bp_siaddr: in_addr;
  bp_giaddr: in_addr;
  bp_chaddr: unknown /* const array */;
  bp_sname: unknown /* const array */;
  bp_file: unknown /* const array */;
  bp_vend: unknown /* const array */;
}

declare class unnamed_10220754665406310398 {
  constructor(init?: unnamed_10220754665406310398);
  attr_idx: number;
  flags: number;
}

declare class sptm_retype_params_t {
  constructor(init?: sptm_retype_params_t);
}

declare class AirshipDaleBasebandTraceInfo {
  constructor(init?: AirshipDaleBasebandTraceInfo);
  version: number;
  trace_code_count: number;
  trace_code_size: number;
  min_trace_buffer_size: number;
  max_trace_buffer_size: number;
  snapshot_buffer_size: number;
  max_trace_buffers_in_flight: number;
}

declare class cpuid_tsc_leaf_t {
  constructor(init?: cpuid_tsc_leaf_t);
  numerator: number;
  denominator: number;
}

declare class AirshipDaleBasebandDeviceTimeMeasurement {
  constructor(init?: AirshipDaleBasebandDeviceTimeMeasurement);
  seq: number;
  duration: number;
  ap_time: number;
  frc_time: number;
  host_begin_abs_time: number;
  host_begin_continuous_time: number;
}

declare class cpuid_mwait_leaf_t {
  constructor(init?: cpuid_mwait_leaf_t);
  linesize_min: number;
  linesize_max: number;
  extensions: number;
  sub_Cstates: number;
}

declare class persona_token {
  constructor(init?: persona_token);
  originator: proc_persona_info;
  proximate: proc_persona_info;
}

declare class pfkeystat {
  constructor(init?: pfkeystat);
  out_total: number;
  out_bytes: number;
  out_msgtype: unknown /* const array */;
  out_invlen: number;
  out_invver: number;
  out_invmsgtype: number;
  out_tooshort: number;
  out_nomem: number;
  out_dupext: number;
  out_invexttype: number;
  out_invsatype: number;
  out_invaddr: number;
  in_total: number;
  in_bytes: number;
  in_msgtype: unknown /* const array */;
  in_msgtarget: unknown /* const array */;
  in_nomem: number;
  sockerr: number;
}

declare class xdrbuf {
  constructor(init?: xdrbuf);
  xb_u: unnamed_15629581316607134910;
  xb_ptr: string | null;
  xb_left: number;
  xb_growsize: number;
  xb_type: interop.Enum<typeof xdrbuf_type>;
  xb_flags: number;
}

declare class nfs_testmapid {
  constructor(init?: nfs_testmapid);
  ntm_lookup: number;
  ntm_grpflag: number;
  ntm_id: number;
  pad: number;
  ntm_guid: guid_t;
  ntm_name: unknown /* const array */;
}

declare class dyld_chained_ptr_32_rebase {
  constructor(init?: dyld_chained_ptr_32_rebase);
  target: number;
  next: number;
  bind: number;
}

declare class lockd_notify {
  constructor(init?: lockd_notify);
  ln_version: number;
  ln_flags: number;
  ln_pad: number;
  ln_addrcount: number;
  ln_addr: interop.Pointer;
}

declare class lockd_ans {
  constructor(init?: lockd_ans);
  la_version: number;
  la_errno: number;
  la_xid: number;
  la_flags: number;
  la_pid: number;
  la_start: number;
  la_len: number;
  la_fh_len: number;
  la_fh: unknown /* const array */;
}

declare class unnamed_17224357291029353072 {
  constructor(init?: unnamed_17224357291029353072);
  errs_common: unknown /* const array */;
  errs_unknown: number;
}

declare class unnamed_12295644343766646936 {
  constructor(init?: unnamed_12295644343766646936);
  nlm_lock: number;
  nlm_test: number;
  nlm_unlock: number;
}

declare class nfs_user_stat_path_rec {
  constructor(init?: nfs_user_stat_path_rec);
  rec_type: number;
  path: unknown /* const array */;
}

declare class __Request__llc_memory_error_notification_t {
  constructor(init?: __Request__llc_memory_error_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  event: llc_event_t;
}

declare class nfs_user_stat_desc {
  constructor(init?: nfs_user_stat_desc);
  rec_vers: number;
  rec_count: number;
}

declare class nfs_export_stat_desc {
  constructor(init?: nfs_export_stat_desc);
  rec_vers: number;
  rec_count: number;
}

declare class unnamed_11808078915071679330 {
  constructor(init?: unnamed_11808078915071679330);
  connectionHandle: number;
  maxTransmitLatency: number;
  maxReceiveLatency: number;
  minRemoteTimeout: number;
  minLocalTimeout: number;
}

declare class nfs_export_args {
  constructor(init?: nfs_export_args);
  nxa_fsid: number;
  nxa_expid: number;
  nxa_fspath: number;
  nxa_exppath: number;
  nxa_flags: number;
  nxa_netcount: number;
  nxa_nets: number;
}

declare class nfs_export_net_args {
  constructor(init?: nfs_export_net_args);
  nxna_flags: number;
  nxna_cred: xucred;
  nxna_addr: sockaddr_storage;
  nxna_mask: sockaddr_storage;
  nxna_sec: nfs_sec;
}

declare class user_nfs_args {
  constructor(init?: user_nfs_args);
  version: number;
  addr: number;
  addrlen: number;
  sotype: number;
  proto: number;
  fh: number;
  fhsize: number;
  flags: number;
  wsize: number;
  rsize: number;
  readdirsize: number;
  timeo: number;
  retrans: number;
  maxgrouplist: number;
  readahead: number;
  leaseterm: number;
  deadthresh: number;
  hostname: number;
  acregmin: number;
  acregmax: number;
  acdirmin: number;
  acdirmax: number;
  auth: number;
  deadtimeout: number;
}

declare class nfs_args {
  constructor(init?: nfs_args);
  version: number;
  addr: number;
  addrlen: number;
  sotype: number;
  proto: number;
  fh: number;
  fhsize: number;
  flags: number;
  wsize: number;
  rsize: number;
  readdirsize: number;
  timeo: number;
  retrans: number;
  maxgrouplist: number;
  readahead: number;
  leaseterm: number;
  deadthresh: number;
  hostname: number;
  acregmin: number;
  acregmax: number;
  acdirmin: number;
  acdirmax: number;
  auth: number;
  deadtimeout: number;
}

declare class nfs_etype {
  constructor(init?: nfs_etype);
  count: number;
  selected: number;
  etypes: unknown /* const array */;
}

declare class unnamed_12306680834597098402 {
  constructor(init?: unnamed_12306680834597098402);
  connectionHandle: number;
  maxSlots: number;
}

declare class msqid_kernel {
  constructor(init?: msqid_kernel);
  u: user_msqid_ds;
  label: interop.Pointer;
}

declare class ipsec_offload_ops {
  constructor(init?: ipsec_offload_ops);
  ops_sa_add: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  ops_sa_delete: (p1: interop.PointerConvertible, p2: number) => number | null;
  ops_sa_advance_esn: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  ops_policy_add: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  ops_policy_delete: (p1: interop.PointerConvertible, p2: number) => number | null;
}

declare class ipsec_offload_policy {
  constructor(init?: ipsec_offload_policy);
  pol_dir: interop.Enum<typeof ipsec_offload_dir>;
  pol_action: interop.Enum<typeof ipsec_offload_action>;
  pol_sel: ipsec_offload_selector;
  pol_reqid: number;
  pol_sa_handle: number;
}

declare class ipsec_offload_sa {
  constructor(init?: ipsec_offload_sa);
  sa_flags: number;
  sa_spi: number;
  sa_proto: interop.Enum<typeof ipsec_offload_proto>;
  sa_mode: interop.Enum<typeof ipsec_offload_mode>;
  sa_dir: interop.Enum<typeof ipsec_offload_dir>;
  sa_selector: ipsec_offload_selector;
  sa_keys: ipsec_offload_keymat;
  sa_replay_win: number;
  sa_reqid: number;
  sa_tunnel: ipsec_offload_tunnel;
}

declare class ipsec_offload_tunnel {
  constructor(init?: ipsec_offload_tunnel);
  tun_ip_version: interop.Enum<typeof ipsec_offload_ip_version>;
  tun_src: unknown /* const array */;
  tun_dst: unknown /* const array */;
  tun_hop_limit: number;
}

declare class unnamed_9951713628101946767 {
  constructor(init?: unnamed_9951713628101946767);
  connectionHandle: number;
  setupParams: BluetoothHCIQualityOfServiceSetupParams;
}

declare class ipsec_offload_keymat {
  constructor(init?: ipsec_offload_keymat);
  key_aead_alg: number;
  key_enc_alg: number;
  key_auth_alg: number;
  key_enc_key: unknown /* const array */;
  key_enc_key_len: number;
  key_auth_key: unknown /* const array */;
  key_auth_key_len: number;
  __reserved: unknown /* const array */;
  key_salt: number;
  key_icv_len: number;
}

declare class iff_filter {
  constructor(init?: iff_filter);
  iff_cookie: interop.Pointer;
  iff_name: string | null;
  iff_protocol: number;
  iff_input: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  iff_output: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number | null;
  iff_event: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  iff_ioctl: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible) => number | null;
  iff_detached: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
}

declare class arpreq {
  constructor(init?: arpreq);
  arp_pa: sockaddr;
  arp_ha: sockaddr;
  arp_flags: number;
}

declare class arphdr {
  constructor(init?: arphdr);
  ar_hrd: number;
  ar_pro: number;
  ar_hln: number;
  ar_pln: number;
  ar_op: number;
}

declare class guarded_ftruncate_np_args {
  constructor(init?: guarded_ftruncate_np_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  length_l_: unknown /* const array */;
  length: number;
  length_r_: unknown /* const array */;
}

declare class ipsec_stats_param {
  constructor(init?: ipsec_stats_param);
  utsp_packets: number;
  utsp_bytes: number;
  utsp_errors: number;
}

declare class sastat {
  constructor(init?: sastat);
  spi: number;
  created: number;
  lft_c: sadb_lifetime;
}

declare class sadb_session_id {
  constructor(init?: sadb_session_id);
  sadb_session_id_len: number;
  sadb_session_id_exttype: number;
  sadb_session_id_v: unknown /* const array */;
}

declare class sadb_x_policy {
  constructor(init?: sadb_x_policy);
  sadb_x_policy_len: number;
  sadb_x_policy_exttype: number;
  sadb_x_policy_type: number;
  sadb_x_policy_dir: number;
  sadb_x_policy_reserved: number;
  sadb_x_policy_id: number;
  sadb_x_policy_reserved2: number;
}

declare class sadb_spirange {
  constructor(init?: sadb_spirange);
  sadb_spirange_len: number;
  sadb_spirange_exttype: number;
  sadb_spirange_min: number;
  sadb_spirange_max: number;
  sadb_spirange_reserved: number;
}

declare class sadb_comb {
  constructor(init?: sadb_comb);
  sadb_comb_auth: number;
  sadb_comb_encrypt: number;
  sadb_comb_flags: number;
  sadb_comb_auth_minbits: number;
  sadb_comb_auth_maxbits: number;
  sadb_comb_encrypt_minbits: number;
  sadb_comb_encrypt_maxbits: number;
  sadb_comb_reserved: number;
  sadb_comb_soft_allocations: number;
  sadb_comb_hard_allocations: number;
  sadb_comb_soft_bytes: number;
  sadb_comb_hard_bytes: number;
  sadb_comb_soft_addtime: number;
  sadb_comb_hard_addtime: number;
  sadb_comb_soft_usetime: number;
  sadb_comb_hard_usetime: number;
}

declare class sadb_ident {
  constructor(init?: sadb_ident);
  sadb_ident_len: number;
  sadb_ident_exttype: number;
  sadb_ident_type: number;
  sadb_ident_reserved: number;
  sadb_ident_id: number;
}

declare class nd_opt_hdr {
  constructor(init?: nd_opt_hdr);
  nd_opt_type: number;
  nd_opt_len: number;
}

declare class sadb_key {
  constructor(init?: sadb_key);
  sadb_key_len: number;
  sadb_key_exttype: number;
  sadb_key_bits: number;
  sadb_key_reserved: number;
}

declare class sadb_address {
  constructor(init?: sadb_address);
  sadb_address_len: number;
  sadb_address_exttype: number;
  sadb_address_proto: number;
  sadb_address_prefixlen: number;
  sadb_address_reserved: number;
}

declare class unnamed_3065075258511695163 {
  constructor(init?: unnamed_3065075258511695163);
  control: number;
  org_code: unknown /* const array */;
  ether_type: number;
}

declare class unnamed_3543327112011839650 {
  constructor(init?: unnamed_3543327112011839650);
  control: number;
  num_rcv_x2: number;
}

declare class unnamed_5653929594553184484 {
  constructor(init?: unnamed_5653929594553184484);
  num_snd_x2: number;
  num_rcv_x2: number;
}

declare class unnamed_6159238944164597548 {
  constructor(init?: unnamed_6159238944164597548);
  control: number;
  format_id: number;
  class_id: number;
  window_x2: number;
}

declare class llc {
  constructor(init?: llc);
  llc_dsap: number;
  llc_ssap: number;
  llc_un: unnamed_18360375898093340158;
}

declare class if_protolistreq {
  constructor(init?: if_protolistreq);
  ifpl_name: unknown /* const array */;
  ifpl_count: number;
  ifpl_reserved: number;
  ifpl_list: interop.Pointer;
}

declare class if_tdmreq {
  constructor(init?: if_tdmreq);
  iftdm_name: unknown /* const array */;
  iftdm_len: number;
  iftdm_table: interop.Pointer;
}

declare class if_clat46req {
  constructor(init?: if_clat46req);
  ifclat46_name: unknown /* const array */;
  ifclat46_addr: if_ipv6_address;
}

declare class if_nat64req {
  constructor(init?: if_nat64req);
  ifnat64_name: unknown /* const array */;
  ifnat64_prefixes: unknown /* const array */;
}

declare class if_netidreq {
  constructor(init?: if_netidreq);
  ifnetid_name: unknown /* const array */;
  ifnetid_len: number;
  ifnetid: unknown /* const array */;
}

declare class kev_dl_rrc_state {
  constructor(init?: kev_dl_rrc_state);
  link_data: net_event_data;
  rrc_state: number;
}

declare class if_agentidsreq {
  constructor(init?: if_agentidsreq);
  ifar_name: unknown /* const array */;
  ifar_count: number;
  ifar_uuids: interop.Pointer;
}

declare class if_agentidreq {
  constructor(init?: if_agentidreq);
  ifar_name: unknown /* const array */;
  ifar_uuid: unknown /* const array */;
}

declare class unnamed_18151751898155817558 {
  constructor(init?: unnamed_18151751898155817558);
  connectionHandle: number;
  randomNumber: unknown /* const array */;
  ediv: number;
}

declare class if_throttlereq {
  constructor(init?: if_throttlereq);
  ifthr_name: unknown /* const array */;
  ifthr_level: number;
}

declare class sync_args {
  constructor(init?: sync_args);
  dummy: number;
}

declare class kev_dl_node_absence {
  constructor(init?: kev_dl_node_absence);
  link_data: net_event_data;
  sin6_node_address: sockaddr_in6;
  sdl_node_address: sockaddr_dl;
}

declare class if_linkparamsreq {
  constructor(init?: if_linkparamsreq);
  iflpr_name: unknown /* const array */;
  iflpr_flags: number;
  iflpr_output_sched: number;
  iflpr_output_tbr_rate: number;
  iflpr_output_tbr_percent: number;
  iflpr_input_tbr_rate: number;
  iflpr_output_bw: if_bandwidths;
  iflpr_input_bw: if_bandwidths;
  iflpr_output_lt: if_latencies;
  iflpr_input_lt: if_latencies;
  iflpr_input_netem: if_netem_params;
  iflpr_output_netem: if_netem_params;
}

declare class kev_dl_link_quality_metric_data {
  constructor(init?: kev_dl_link_quality_metric_data);
  link_data: net_event_data;
  link_quality_metric: number;
}

declare class if_lim_perf_stat {
  constructor(init?: if_lim_perf_stat);
  lim_dl_max_bandwidth: number;
  lim_ul_max_bandwidth: number;
  lim_total_txpkts: number;
  lim_total_rxpkts: number;
  lim_total_retxpkts: number;
  lim_packet_loss_percent: number;
  lim_total_oopkts: number;
  lim_packet_ooo_percent: number;
  lim_rtt_variance: number;
  lim_rtt_average: number;
  lim_rtt_min: number;
  lim_conn_timeouts: number;
  lim_conn_attempts: number;
  lim_conn_timeout_percent: number;
  lim_bk_txpkts: number;
  lim_dl_detected: number;
  lim_ul_detected: number;
}

declare class if_tcp_ecn_perf_stat {
  constructor(init?: if_tcp_ecn_perf_stat);
  total_txpkts: number;
  total_rxmitpkts: number;
  total_rxpkts: number;
  total_oopkts: number;
  total_reorderpkts: number;
  rtt_avg: number;
  rtt_var: number;
  sack_episodes: number;
  rxmit_drop: number;
  rst_drop: number;
  oo_percent: number;
  reorder_percent: number;
  rxmit_percent: number;
}

declare class if_latencies {
  constructor(init?: if_latencies);
  eff_lt: number;
  max_lt: number;
}

declare class if_lpw_stats {
  constructor(init?: if_lpw_stats);
  if_lpw_ipackets: number;
  if_lpw_opackets: number;
  if_lpw_magic_pkt_checked: number;
  if_lpw_magic_pkt_found: number;
  if_lpw_tcp_rx_packets: number;
  if_lpw_tcp_tx_packets: number;
  if_lpw_udp_rx_packets: number;
  if_lpw_udp_tx_packets: number;
  if_lpw_icmp_rx_packets: number;
  if_lpw_icmp_tx_packets: number;
  if_lpw_icmp6_rx_packets: number;
  if_lpw_icmp6_tx_packets: number;
  if_lpw_arp_rx_packets: number;
  if_lpw_arp_tx_packets: number;
  if_lpw_arp_event_full_wake: number;
  if_lpw_nd6_rx_packets: number;
  if_lpw_nd6_tx_packets: number;
  if_lpw_nd6_ra_full_wake: number;
  if_lpw_nd6_event_full_wake: number;
  if_lpw_nowake_rx_packets: number;
  if_lpw_connection_idle_rx_packets: number;
  if_lpw_connection_not_idle_full_wake: number;
  if_lpw_exit_connection_not_idle: number;
  if_lpw_exit_connection_not_idle_wifi: number;
  if_lpw_exit_connection_not_idle_cell: number;
  if_lpw_exit_connection_not_idle_bt: number;
  if_lpw_exit_arp_event: number;
  if_lpw_exit_nd6_event: number;
  if_lpw_exit_ra_event: number;
  if_lpw_exit_magic_packet: number;
  if_lpw_exit_eapol_packet: number;
  if_lpw_exit_fragment_packet: number;
  if_lpw_exit_fragment_packet_wifi: number;
  if_lpw_exit_fragment_packet_cell: number;
  if_lpw_exit_fragment_packet_bt: number;
}

declare class __Request__clock_alarm_t {
  constructor(init?: __Request__clock_alarm_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  alarm_port: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  alarm_type: number;
  alarm_time: mach_timespec;
}

declare class IOAudioClientBuffer64 {
  constructor(init?: IOAudioClientBuffer64);
  mAudioClientBuffer32: IOAudioClientBuffer;
  mUnmappedSourceBuffer64: number;
  mNextBuffer64: interop.Pointer;
}

declare class vlanreq {
  constructor(init?: vlanreq);
  vlr_parent: unknown /* const array */;
  vlr_tag: number;
}

declare class mptcp_itf_stats {
  constructor(init?: mptcp_itf_stats);
  ifindex: number;
  switches: number;
  is_expensive: number;
  mpis_txbytes: number;
  mpis_rxbytes: number;
  mpis_wifi_txbytes: number;
  mpis_wifi_rxbytes: number;
  mpis_wired_txbytes: number;
  mpis_wired_rxbytes: number;
  mpis_cell_txbytes: number;
  mpis_cell_rxbytes: number;
}

declare class xrtsockpcb {
  constructor(init?: xrtsockpcb);
  xrp_len: number;
  xrp_kind: number;
  xrp_gencnt: number;
  xrp_family: number;
  xrp_protocol: number;
  xr_fu: unnamed_5820487912701483032;
  xr_lu: unnamed_8538442842817973944;
}

declare class xrtsockgen {
  constructor(init?: xrtsockgen);
  xg_len: number;
  xg_count: number;
  xg_gencnt: number;
  xg_sogen: number;
}

declare class unnamed_17533628704571492567 {
  constructor(init?: unnamed_17533628704571492567);
  connectionHandle: number;
  supportedFeaturesInfo: BluetoothHCIExtendedFeaturesInfo;
}

declare class rt_msghdr_ext {
  constructor(init?: rt_msghdr_ext);
  rtm_msglen: number;
  rtm_version: number;
  rtm_type: number;
  rtm_index: number;
  rtm_flags: number;
  rtm_reserved: number;
  rtm_addrs: number;
  rtm_pid: number;
  rtm_seq: number;
  rtm_errno: number;
  rtm_use: number;
  rtm_inits: number;
  rtm_rmx: rt_metrics;
  rtm_ri: rt_reach_info;
}

declare class airship_centauri_alpha_ring_pool {
  constructor(init?: airship_centauri_alpha_ring_pool);
}

declare class rt_msghdr_common {
  constructor(init?: rt_msghdr_common);
  rtm_msglen: number;
  rtm_version: number;
  rtm_type: number;
  rtm_index: number;
  rtm_flags: number;
  rtm_addrs: number;
  rtm_pid: number;
  rtm_seq: number;
  rtm_errno: number;
  rtm_use: number;
}

declare class kev_netevent_apnfallbk_data {
  constructor(init?: kev_netevent_apnfallbk_data);
  epid: number;
  euuid: unknown /* const array */;
}

declare class route_old {
  constructor(init?: route_old);
  ro_rt: interop.Pointer;
  ro_flags: number;
  ro_dst: sockaddr;
}

declare class fclonefileat_args {
  constructor(init?: fclonefileat_args);
  src_fd_l_: unknown /* const array */;
  src_fd: number;
  src_fd_r_: unknown /* const array */;
  dst_dirfd_l_: unknown /* const array */;
  dst_dirfd: number;
  dst_dirfd_r_: unknown /* const array */;
  dst_l_: unknown /* const array */;
  dst: number;
  dst_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class ifnet_attach_proto_param_v2 {
  constructor(init?: ifnet_attach_proto_param_v2);
  demux_array: interop.Pointer;
  demux_count: number;
  input: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  pre_output: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: string, p7: string) => number | null;
  event: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  ioctl: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  detached: (p1: interop.PointerConvertible, p2: number) => number | null;
  resolve: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number) => number | null;
  send_arp: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number | null;
}

declare class ifnet_attach_proto_param {
  constructor(init?: ifnet_attach_proto_param);
  demux_array: interop.Pointer;
  demux_count: number;
  input: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: string) => number | null;
  pre_output: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: string, p7: string) => number | null;
  event: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  ioctl: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  detached: (p1: interop.PointerConvertible, p2: number) => number | null;
  resolve: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number) => number | null;
  send_arp: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number | null;
}

declare class ifnet_init_params {
  constructor(init?: ifnet_init_params);
  uniqueid: interop.Pointer;
  uniqueid_len: number;
  name: string | null;
  unit: number;
  family: number;
  type: number;
  output: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  demux: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: interop.PointerConvertible) => number | null;
  add_proto: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number) => number | null;
  del_proto: (p1: interop.PointerConvertible, p2: number) => number | null;
  check_multi: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  framer: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: string, p5: string) => number | null;
  softc: interop.Pointer;
  ioctl: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  set_bpf_tap: (p1: interop.PointerConvertible, p2: number, p3: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number) => number | null;
  detach: (p1: interop.PointerConvertible) => void | null;
  event: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  broadcast_addr: interop.Pointer;
  broadcast_len: number;
}

declare class pwrite_args {
  constructor(init?: pwrite_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class ifnet_stat_increment_param {
  constructor(init?: ifnet_stat_increment_param);
  packets_in: number;
  bytes_in: number;
  errors_in: number;
  packets_out: number;
  bytes_out: number;
  errors_out: number;
  collisions: number;
  dropped: number;
}

declare class kev_msg {
  constructor(init?: kev_msg);
}

declare class kern_event_msg {
  constructor(init?: kern_event_msg);
  total_size: number;
  vendor_code: number;
  kev_class: number;
  kev_subclass: number;
  id: number;
  event_code: number;
  event_data: unknown /* const array */;
}

declare class sockaddr_dl {
  constructor(init?: sockaddr_dl);
  sdl_len: number;
  sdl_family: number;
  sdl_index: number;
  sdl_type: number;
  sdl_nlen: number;
  sdl_alen: number;
  sdl_slen: number;
  sdl_data: unknown /* const array */;
}

declare class partinfo {
  constructor(init?: partinfo);
  disklab: interop.Pointer;
  part: interop.Pointer;
}

declare class xbpf_if {
  constructor(init?: xbpf_if);
  xbif_structsize: number;
  xbif_dlt: number;
  xbif_hdrlen: number;
  xbif_dcount: number;
  xbif_ifname: unknown /* const array */;
}

declare class settid_args {
  constructor(init?: settid_args);
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
}

declare class read_args {
  constructor(init?: read_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  cbuf_l_: unknown /* const array */;
  cbuf: number;
  cbuf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
}

declare class bpf_setup_args {
  constructor(init?: bpf_setup_args);
  bsa_uuid: unknown /* const array */;
  bsa_ifname: unknown /* const array */;
}

declare class ndrv_protocol_desc {
  constructor(init?: ndrv_protocol_desc);
  version: number;
  protocol_family: number;
  demux_count: number;
  demux_list: interop.Pointer;
}

declare class FWSegment {
  constructor(init?: FWSegment);
  address: FWAddressStruct;
  length: number;
}

declare class ndrv_demux_desc {
  constructor(init?: ndrv_demux_desc);
  type: number;
  length: number;
  data: unnamed_10177877263919051962;
}

declare class gpu_descriptor {
  constructor(init?: gpu_descriptor);
  gpu_id: number;
  gpu_max_domains: number;
}

declare class unnamed_17075762887868505076 {
  constructor(init?: unnamed_17075762887868505076);
  mstm_telemetry_generation: number;
  mstm_telemetry_source: number;
  mstm_telemetry_period: number;
  mstm_serial_number: number;
  mstm_telemetry_skipped: number;
}

declare class microstackshot_task {
  constructor(init?: microstackshot_task);
  mst_magic: number;
  mst_pid: number;
  mst_task_uniqueid: number;
  mst_user_term_mach_time: number;
  mst_system_term_mach_time: number;
  mst_shared_cache_identifier: unknown /* const array */;
  mst_shared_cache_slide: number;
  mst_loadinfo_count: number;
  mst_suspend_count: number;
  mst_page_count: number;
  mst_fault_count: number;
  mst_pagein_count: number;
  mst_cow_fault_count: number;
  mst_stackshot_flags_trunc: number;
  mst_resource_coal_id: number;
  mst_on_behalf_origin_pid: number;
  mst_on_behalf_proximate_pid: number;
  mst_proc_comm_name: unknown /* const array */;
  mst_was_throttled: number;
  mst_did_throttle: number;
  mst_latency_qos: number;
  mst_stackshot_flags: number;
  mst_energy_nj: number;
  mst_page_grab_count: number;
  mst_iopl_upl_page_grab_count: number;
  mst_proc_name_extra: unknown /* const array */;
  mst_metadata: unnamed_17075762887868505076;
  mst_shared_cache_slid_address: number;
  mst_reserved: unknown /* const array */;
  mst_reserved32: unknown /* const array */;
}

declare class telemetry_pagein_buffer {
  constructor(init?: telemetry_pagein_buffer);
  tpb_header: telemetry_pagein_header;
  tpb_pageins: unknown /* const array */;
}

declare class EXDisplayPipeIndicatorParams {
  constructor(init?: EXDisplayPipeIndicatorParams);
  x: number;
  y: number;
  alpha: number;
}

declare class telemetry_pagein {
  constructor(init?: telemetry_pagein);
  tp_fsid: number;
  tp_fsobj_id: number;
  tp_file_offset: number;
}

declare class telemetry_pagein_header {
  constructor(init?: telemetry_pagein_header);
  tph_magic: number;
  tph_version: number;
  tph_pagein_count: number;
  tph_reserved: number;
  tph_flags: number;
  tph_duration_mct: number;
}

declare class smrq_tailq_head {
  constructor(init?: smrq_tailq_head);
  first: __smrq_link_t;
  last: interop.Pointer;
}

declare class select_args {
  constructor(init?: select_args);
  nd_l_: unknown /* const array */;
  nd: number;
  nd_r_: unknown /* const array */;
  in_l_: unknown /* const array */;
  in_: number;
  in_r_: unknown /* const array */;
  ou_l_: unknown /* const array */;
  ou: number;
  ou_r_: unknown /* const array */;
  ex_l_: unknown /* const array */;
  ex: number;
  ex_r_: unknown /* const array */;
  tv_l_: unknown /* const array */;
  tv: number;
  tv_r_: unknown /* const array */;
}

declare class smrq_slist_head {
  constructor(init?: smrq_slist_head);
  first: __smrq_slink_t;
}

declare class smrq_slink {
  constructor(init?: smrq_slink);
  next: __smrq_slink_t;
}

declare class __smrq_slink_t {
  constructor(init?: __smrq_slink_t);
  __smr_ptr: interop.Pointer;
}

declare class smr_node {
  constructor(init?: smr_node);
  smrn_next: interop.Pointer;
  XNU_PTRAUTH_SIGNED_FUNCTION_PTR: unknown /* void (*())(struct smr_node *) (CXTypeKind: 110) */;
}

declare class task_restartable_range_t {
  constructor(init?: task_restartable_range_t);
  location: number;
  length: number;
  recovery_offs: number;
  flags: number;
}

declare class ledger_limit_args {
  constructor(init?: ledger_limit_args);
  lla_name: unknown /* const array */;
  lla_limit: number;
  lla_refill_period: number;
}

declare class ledger_entry_info {
  constructor(init?: ledger_entry_info);
  lei_balance: number;
  lei_credit: number;
  lei_debit: number;
  lei_limit: number;
  lei_refill_period: number;
  lei_last_refill: number;
}

declare class ledger_info {
  constructor(init?: ledger_info);
  li_name: unknown /* const array */;
  li_id: number;
  li_entries: number;
}

declare class mpsc_queue_head {
  constructor(init?: mpsc_queue_head);
  mpqh_head: mpsc_queue_chain;
  mpqh_tail: unknown /* _Atomic(struct mpsc_queue_chain *) (CXTypeKind: 177) */;
}

declare class nfs_exphandle {
  constructor(init?: nfs_exphandle);
  nxh_version: number;
  nxh_fsid: number;
  nxh_expid: number;
  nxh_flags: number;
  nxh_reserved: number;
  nxh_fidlen: number;
}

declare class ecc_event_t {
  constructor(init?: ecc_event_t);
  version: interop.Enum<typeof ecc_version_t>;
  flags: interop.Enum<typeof ecc_flags_t>;
  physaddr: number;
  ce_count: number;
  vendor: number;
  reserved: unknown /* const array */;
}

declare class trust_cache_module1 {
  constructor(init?: trust_cache_module1);
  version: number;
  uuid: unknown /* const array */;
  num_entries: number;
  entries: interop.Pointer;
}

declare class __lck_rw_t__ {
  constructor(init?: __lck_rw_t__);
}

declare class kern_work_interval_workload_id_args {
  constructor(init?: kern_work_interval_workload_id_args);
  wlida_flags: number;
  wlida_wicreate_flags: number;
  wlida_name: string | null;
  wlida_syscall_mask: unknown /* const array */;
}

declare class IOUSBHostIsochronousFrame {
  constructor(init?: IOUSBHostIsochronousFrame);
  status: number;
  requestCount: number;
  completeCount: number;
  reserved: number;
  timeStamp: UnsignedWide;
}

declare class kern_work_interval_args {
  constructor(init?: kern_work_interval_args);
  work_interval_id: number;
  start: number;
  finish: number;
  deadline: number;
  next_start: number;
  notify_flags: number;
  create_flags: number;
  urgency: number;
}

declare class work_interval {
  constructor(init?: work_interval);
}

declare class hvg_hcall_vmcore_file {
  constructor(init?: hvg_hcall_vmcore_file);
  tag: unknown /* const array */;
}

declare class hvg_hcall_output {
  constructor(init?: hvg_hcall_output);
  regs: unknown /* const array */;
}

declare class llc_event_t {
  constructor(init?: llc_event_t);
  version: interop.Enum<typeof llc_event_version_t>;
  sts: number;
  inf: number;
  adr: number;
  syn: number;
  way: number;
}

declare class getsgroups_args {
  constructor(init?: getsgroups_args);
  setlen_l_: unknown /* const array */;
  setlen: number;
  setlen_r_: unknown /* const array */;
  guidset_l_: unknown /* const array */;
  guidset: number;
  guidset_r_: unknown /* const array */;
}

declare class priority_queue_sched_max {
  constructor(init?: priority_queue_sched_max);
  pq_root: interop.Pointer;
}

declare class priority_queue_sched_min {
  constructor(init?: priority_queue_sched_min);
  pq_root: interop.Pointer;
}

declare class fairplay_subsystem {
  constructor(init?: fairplay_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class priority_queue_deadline_max {
  constructor(init?: priority_queue_deadline_max);
  pq_root: interop.Pointer;
}

declare class priority_queue_deadline_min {
  constructor(init?: priority_queue_deadline_min);
  pq_root: interop.Pointer;
}

declare class priority_queue_max {
  constructor(init?: priority_queue_max);
  pq_root: interop.Pointer;
  pq_cmp_fn: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
}

declare class graftdmg_args {
  constructor(init?: graftdmg_args);
  dmg_fd_l_: unknown /* const array */;
  dmg_fd: number;
  dmg_fd_r_: unknown /* const array */;
  mountdir_l_: unknown /* const array */;
  mountdir: number;
  mountdir_r_: unknown /* const array */;
  graft_type_l_: unknown /* const array */;
  graft_type: number;
  graft_type_r_: unknown /* const array */;
  gda_l_: unknown /* const array */;
  gda: number;
  gda_r_: unknown /* const array */;
}

declare class priority_queue_min {
  constructor(init?: priority_queue_min);
  pq_root: interop.Pointer;
  pq_cmp_fn: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
}

declare class priority_queue_entry_stable {
  constructor(init?: priority_queue_entry_stable);
  next: interop.Pointer;
  prev: interop.Pointer;
  key: number;
  child: number;
  stamp: number;
}

declare class priority_queue_entry_sched {
  constructor(init?: priority_queue_entry_sched);
  next: interop.Pointer;
  prev: interop.Pointer;
  key: number;
  child: number;
}

declare class priority_queue_entry_deadline {
  constructor(init?: priority_queue_entry_deadline);
  next: interop.Pointer;
  prev: interop.Pointer;
  __key: number;
  child: number;
  deadline: number;
}

declare class priority_queue_entry {
  constructor(init?: priority_queue_entry);
  next: interop.Pointer;
  prev: interop.Pointer;
  __key: number;
  child: number;
}

declare class backtrace_user_info {
  constructor(init?: backtrace_user_info);
  btui_info: interop.Enum<typeof backtrace_info_t>;
  btui_error: number;
  btui_async_start_index: number;
  btui_async_frame_addr: number;
  btui_next_frame_addr: number;
}

declare class thread_call {
  constructor(init?: thread_call);
}

declare class _lck_grp_ {
  constructor(init?: _lck_grp_);
}

declare class queue_entry {
  constructor(init?: queue_entry);
  next: interop.Pointer;
  prev: interop.Pointer;
}

declare class mach_assert_default {
  constructor(init?: mach_assert_default);
  hdr: mach_assert_hdr;
  expr: string | null;
}

declare class mach_assert_hdr {
  constructor(init?: mach_assert_hdr);
  type: interop.Enum<typeof mach_assert_type_t>;
  lineno: number;
  filename: string | null;
}

declare class getaudit_addr_args {
  constructor(init?: getaudit_addr_args);
  auditinfo_addr_l_: unknown /* const array */;
  auditinfo_addr: number;
  auditinfo_addr_r_: unknown /* const array */;
  length_l_: unknown /* const array */;
  length: number;
  length_r_: unknown /* const array */;
}

declare class netsvctype_dscp_map {
  constructor(init?: netsvctype_dscp_map);
}

declare class __lck_mtx_ext_t__ {
  constructor(init?: __lck_mtx_ext_t__);
}

declare class __lck_mtx_t__ {
  constructor(init?: __lck_mtx_t__);
}

declare class socd_client_trace_entry_t {
  constructor(init?: socd_client_trace_entry_t);
  timestamp: number;
  debugid: number;
  arg1: number;
  arg2: number;
  arg3: number;
  arg4: number;
}

declare class socd_client_hdr_t {
  constructor(init?: socd_client_hdr_t);
  version: number;
  boot_time: number;
  kernel_uuid: unknown /* const array */;
  primary_kernelcache_uuid: unknown /* const array */;
}

declare class OSKextGrabPgoStruct {
  constructor(init?: OSKextGrabPgoStruct);
  metadata: boolean;
  pSize: interop.Pointer;
  pBuffer: string | null;
  bufferSize: number;
  err: number;
  list_head: list_head;
}

declare class hv_callbacks_t {
  constructor(init?: hv_callbacks_t);
  dispatch: (p1: interop.PointerConvertible) => void | null;
  preempt: (p1: interop.PointerConvertible) => void | null;
  suspend: () => void | null;
  thread_destroy: (p1: interop.PointerConvertible) => void | null;
  task_destroy: (p1: interop.PointerConvertible) => void | null;
  volatile_state: (p1: interop.PointerConvertible, p2: number) => void | null;
  resume: () => void | null;
  memory_pressure: () => void | null;
}

declare class hv_trap_table_t {
  constructor(init?: hv_trap_table_t);
  traps: interop.Pointer;
  trap_count: number;
}

declare class IOServiceStateNotificationDispatchSource_IVars {
  constructor(init?: IOServiceStateNotificationDispatchSource_IVars);
}

declare class hw_spin_policy {
  constructor(init?: hw_spin_policy);
}

declare class thread_group {
  constructor(init?: thread_group);
}

declare class _csops_cdhash {
  constructor(init?: _csops_cdhash);
  hash: unknown /* const array */;
  type: number;
  length: number;
}

declare class launch_constraint_data {
  constructor(init?: launch_constraint_data);
  launch_type: interop.Enum<typeof cs_launch_type_t>;
}

declare class __SC_Scatter {
  constructor(init?: __SC_Scatter);
  count: number;
  base: number;
  targetOffset: number;
  spare: number;
}

declare class __SC_GenericBlob {
  constructor(init?: __SC_GenericBlob);
  magic: number;
  length: number;
  data: interop.Pointer;
}

declare class __SC_SuperBlob {
  constructor(init?: __SC_SuperBlob);
  magic: number;
  length: number;
  count: number;
  index: interop.Pointer;
}

declare class __BlobIndex {
  constructor(init?: __BlobIndex);
  type: number;
  offset: number;
}

declare class kd_cpumap {
  constructor(init?: kd_cpumap);
  cpu_id: number;
  flags: number;
  name: unknown /* const array */;
}

declare class if_rxpoll_stats {
  constructor(init?: if_rxpoll_stats);
  ifi_poll_off_req: number;
  ifi_poll_off_err: number;
  ifi_poll_on_req: number;
  ifi_poll_on_err: number;
  ifi_poll_wakeups_avg: number;
  ifi_poll_wakeups_lowat: number;
  ifi_poll_wakeups_hiwat: number;
  ifi_poll_packets: number;
  ifi_poll_packets_avg: number;
  ifi_poll_packets_min: number;
  ifi_poll_packets_max: number;
  ifi_poll_packets_lowat: number;
  ifi_poll_packets_hiwat: number;
  ifi_poll_bytes: number;
  ifi_poll_bytes_avg: number;
  ifi_poll_bytes_min: number;
  ifi_poll_bytes_max: number;
  ifi_poll_bytes_lowat: number;
  ifi_poll_bytes_hiwat: number;
  ifi_poll_packets_limit: number;
  ifi_poll_interval_time: number;
}

declare class __throttle_info_handle {
  constructor(init?: __throttle_info_handle);
}

declare class efi_aurr_extended_panic_log {
  constructor(init?: efi_aurr_extended_panic_log);
  efi_aurr_extended_log_buf: unknown /* const array */;
  efi_aurr_log_tail: number;
  efi_aurr_log_head: number;
}

declare class user_nfsd_args {
  constructor(init?: user_nfsd_args);
  sock: number;
  name: number;
  namelen: number;
}

declare class unnamed_16267160547991243465 {
  constructor(init?: unnamed_16267160547991243465);
  eph_x86_power_state: number;
  eph_x86_efi_boot_state: number;
  eph_x86_system_state: number;
  eph_x86_unused_bits: number;
}

declare class coproc_status_entry {
  constructor(init?: coproc_status_entry);
  name: unknown /* const array */;
  status: number;
}

declare class _dyld_cache_image_text_info {
  constructor(init?: _dyld_cache_image_text_info);
  uuid: unknown /* const array */;
  loadAddress: number;
  textSegmentSize: number;
  pathOffset: number;
}

declare class task_snapshot {
  constructor(init?: task_snapshot);
  snapshot_magic: number;
  pid: number;
  uniqueid: number;
  user_time_in_terminated_threads: number;
  system_time_in_terminated_threads: number;
  shared_cache_identifier: unknown /* const array */;
  shared_cache_slide: number;
  nloadinfos: number;
  suspend_count: number;
  task_size: number;
  faults: number;
  pageins: number;
  cow_faults: number;
  ss_flags: number;
  p_start_sec: number;
  p_start_usec: number;
  p_comm: unknown /* const array */;
  was_throttled: number;
  did_throttle: number;
  latency_qos: number;
  disk_reads_count: number;
  disk_reads_size: number;
  disk_writes_count: number;
  disk_writes_size: number;
  io_priority_count: unknown /* const array */;
  io_priority_size: unknown /* const array */;
  paging_count: number;
  paging_size: number;
  non_paging_count: number;
  non_paging_size: number;
  data_count: number;
  data_size: number;
  metadata_count: number;
  metadata_size: number;
  donating_pid_count: number;
}

declare class icmp_ra_addr {
  constructor(init?: icmp_ra_addr);
  ira_addr: number;
  ira_preference: number;
}

declare class priority_queue {
  constructor(init?: priority_queue);
}

declare class _unpcb_list_entry {
  constructor(init?: _unpcb_list_entry);
  le_next: number;
  le_prev: number;
}

declare class airship_driver {
  constructor(init?: airship_driver);
}

declare class __Reply__memory_error_notification_t {
  constructor(init?: __Reply__memory_error_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class conninfo_multipathtcp {
  constructor(init?: conninfo_multipathtcp);
  mptcpci_subflow_count: number;
  mptcpci_switch_count: number;
  mptcpci_subflow_connids: unknown /* const array */;
  mptcpci_init_rxbytes: number;
  mptcpci_init_txbytes: number;
  mptcpci_itfstats: unknown /* const array */;
  mptcpci_flags: number;
}

declare class debug_header {
  constructor(init?: debug_header);
  magic: number;
  version: number;
  count: number;
  resvd: number;
  image: interop.Pointer;
}

declare class AsyncCommitCall {
  constructor(init?: AsyncCommitCall);
}

declare class access_extended_args {
  constructor(init?: access_extended_args);
  entries_l_: unknown /* const array */;
  entries: number;
  entries_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
  results_l_: unknown /* const array */;
  results: number;
  results_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
}

declare class unnamed_17454206900496886574 {
  constructor(init?: unnamed_17454206900496886574);
  paddr: number;
  papt_pte_template: number;
  num_mappings: number;
  options: number;
}

declare class debug_syscall_reject_config_args {
  constructor(init?: debug_syscall_reject_config_args);
  packed_selectors1_l_: unknown /* const array */;
  packed_selectors1: number;
  packed_selectors1_r_: unknown /* const array */;
  packed_selectors2_l_: unknown /* const array */;
  packed_selectors2: number;
  packed_selectors2_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class DeviceQualifierDescriptor {
  constructor(init?: DeviceQualifierDescriptor);
  bLength: number;
  bDescriptorType: number;
  bcdUSB: number;
  bDeviceClass: number;
  bDeviceSubClass: number;
  bDeviceProtocol: number;
  bMaxPacketSize0: number;
  bNumConfigurations: number;
  bReserved: number;
}

declare class EFI_SYSTEM_TABLE_32 {
  constructor(init?: EFI_SYSTEM_TABLE_32);
  Hdr: EFI_TABLE_HEADER;
  FirmwareVendor: number;
  FirmwareRevision: number;
  ConsoleInHandle: number;
  ConIn: number;
  ConsoleOutHandle: number;
  ConOut: number;
  StandardErrorHandle: number;
  StdErr: number;
  RuntimeServices: number;
  BootServices: number;
  NumberOfTableEntries: number;
  ConfigurationTable: number;
}

declare class __Reply__exception_raise_state_identity_t {
  constructor(init?: __Reply__exception_raise_state_identity_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  flavor: number;
  new_stateCnt: number;
  new_state: unknown /* const array */;
}

declare class kevent_args {
  constructor(init?: kevent_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  changelist_l_: unknown /* const array */;
  changelist: number;
  changelist_r_: unknown /* const array */;
  nchanges_l_: unknown /* const array */;
  nchanges: number;
  nchanges_r_: unknown /* const array */;
  eventlist_l_: unknown /* const array */;
  eventlist: number;
  eventlist_r_: unknown /* const array */;
  nevents_l_: unknown /* const array */;
  nevents: number;
  nevents_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
}

declare class _evScreen {
  constructor(init?: _evScreen);
}

declare class audit_args {
  constructor(init?: audit_args);
  record_l_: unknown /* const array */;
  record: number;
  record_r_: unknown /* const array */;
  length_l_: unknown /* const array */;
  length: number;
  length_r_: unknown /* const array */;
}

declare class tcpcb {
  constructor(init?: tcpcb);
  t_segq: tsegqe_head;
  t_dupacks: number;
  unused: number;
  t_timer: unknown /* const array */;
  t_inpcb: number;
  t_state: number;
  t_flags: number;
  t_force: number;
  snd_una: number;
  snd_max: number;
  snd_nxt: number;
  snd_up: number;
  snd_wl1: number;
  snd_wl2: number;
  iss: number;
  irs: number;
  rcv_nxt: number;
  rcv_adv: number;
  rcv_wnd: number;
  rcv_up: number;
  snd_wnd: number;
  snd_cwnd: number;
  snd_ssthresh: number;
  t_maxopd: number;
  t_rcvtime: number;
  t_starttime: number;
  t_rtttime: number;
  t_rtseq: number;
  t_rxtcur: number;
  t_maxseg: number;
  t_srtt: number;
  t_rttvar: number;
  t_rxtshift: number;
  t_rttmin: number;
  t_rttupdated: number;
  max_sndwnd: number;
  t_softerror: number;
  t_oobflags: number;
  t_iobc: number;
  snd_scale: number;
  rcv_scale: number;
  request_r_scale: number;
  requested_s_scale: number;
  ts_recent: number;
  ts_recent_age: number;
  last_ack_sent: number;
  cc_send: number;
  cc_recv: number;
  snd_recover: number;
  snd_cwnd_prev: number;
  snd_ssthresh_prev: number;
  t_badrxtwin: number;
}

declare class __Reply__mach_gss_log_error_t {
  constructor(init?: __Reply__mach_gss_log_error_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class fstat64_args {
  constructor(init?: fstat64_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
}

declare class close_args {
  constructor(init?: close_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class openat_dprotected_np_args {
  constructor(init?: openat_dprotected_np_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  class_l_: unknown /* const array */;
  class: number;
  class_r_: unknown /* const array */;
  dpflags_l_: unknown /* const array */;
  dpflags: number;
  dpflags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  authfd_l_: unknown /* const array */;
  authfd: number;
  authfd_r_: unknown /* const array */;
}

declare class IOExternalMethod {
  constructor(init?: IOExternalMethod);
  object: interop.Pointer;
  func: number;
  flags: number;
  count0: number;
  count1: number;
}

declare class read_nocancel_args {
  constructor(init?: read_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  cbuf_l_: unknown /* const array */;
  cbuf: number;
  cbuf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
}

declare class fcntl_args {
  constructor(init?: fcntl_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
}

declare class open_dprotected_np_args {
  constructor(init?: open_dprotected_np_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  class_l_: unknown /* const array */;
  class: number;
  class_r_: unknown /* const array */;
  dpflags_l_: unknown /* const array */;
  dpflags: number;
  dpflags_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class mptcp_symptoms_ask_uuid {
  constructor(init?: mptcp_symptoms_ask_uuid);
  cmd: number;
  uuid: unknown /* const array */;
  priority: number;
}

declare class sptm_bootstrap_args_xnu_t {
  constructor(init?: sptm_bootstrap_args_xnu_t);
  version: number;
  physmap_base: number;
  physmap_end: number;
  first_avail_phys: number;
  phys_slide_papt: number;
  phys_slide_size: number;
  txm_thread_stacks: interop.Pointer;
  num_txm_thread_stacks: number;
  cpu_stack_papt_start: number;
  cpu_stack_papt_end: number;
  executables_papt_start: number;
  executables_papt_end: number;
  debug_header: interop.Pointer;
  num_asids: number;
  random_seed: unknown /* const array */;
  random_seed_length: number;
  sk_bootstrapped: boolean;
  sk_carveout_size: number;
  sptm_variant: number;
  xnu_triggered_panic: interop.Pointer;
  libsptm_state: sptm_client_state;
  auxkc_base: number;
  auxkc_mh: number;
  auxkc_end: number;
  timestamp_sk_bootstrap: number;
  timestamp_xnu_bootstrap: number;
  timestamp_txm_bootstrap: number;
  timestamp_sptm_init: number;
  timestamp_sk_complete: number;
  timestamp_txm_complete: number;
  reserved1: interop.Pointer;
  hib_scratch_page_paddr: number;
  sptm_pmap_io_ranges: number;
  sptm_pmap_io_ranges_count: number;
  sptm_pmap_io_filters: number;
  sptm_pmap_io_filters_count: number;
  feature_flags: number;
}

declare class mkfifoat_args {
  constructor(init?: mkfifoat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class exit_args {
  constructor(init?: exit_args);
  rval_l_: unknown /* const array */;
  rval: number;
  rval_r_: unknown /* const array */;
}

declare class IOSimpleArrayReportValues {
  constructor(init?: IOSimpleArrayReportValues);
  simple_values: unknown /* const array */;
}

declare class mmap_args {
  constructor(init?: mmap_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
  prot_l_: unknown /* const array */;
  prot: number;
  prot_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  pos_l_: unknown /* const array */;
  pos: number;
  pos_r_: unknown /* const array */;
}

declare class nfs_fsid {
  constructor(init?: nfs_fsid);
  major: number;
  minor: number;
}

declare class igmpstat {
  constructor(init?: igmpstat);
  igps_rcv_total: number;
  igps_rcv_tooshort: number;
  igps_rcv_badsum: number;
  igps_rcv_queries: number;
  igps_rcv_badqueries: number;
  igps_rcv_reports: number;
  igps_rcv_badreports: number;
  igps_rcv_ourreports: number;
  igps_snd_reports: number;
}

declare class syscp_ID_instructions_feat_1_reg {
  constructor(init?: syscp_ID_instructions_feat_1_reg);
  endianness_support: number;
  exception_1_support: number;
  exception_2_support: number;
  sign_zero_ext_support: number;
  if_then_support: number;
  immediate_support: number;
  interworking_support: number;
  jazelle_support: number;
}

declare class IOUSBIsochronousFrame {
  constructor(init?: IOUSBIsochronousFrame);
  status: number;
  requestCount: number;
  completeCount: number;
  reserved: number;
  timeStamp: number;
}

declare class unnamed_13063672524086591502 {
  constructor(init?: unnamed_13063672524086591502);
  device: interop.Pointer;
  op: number;
  result: interop.Pointer;
  arg: interop.Pointer;
}

declare class mbstat {
  constructor(init?: mbstat);
  m_mbufs: number;
  m_clusters: number;
  m_spare: number;
  m_clfree: number;
  m_drops: number;
  m_wait: number;
  m_drain: number;
  m_mtypes: unknown /* const array */;
  m_mcfail: number;
  m_mpfail: number;
  m_msize: number;
  m_mclbytes: number;
  m_minclsize: number;
  m_mlen: number;
  m_mhlen: number;
  m_bigclusters: number;
  m_bigclfree: number;
  m_bigmclbytes: number;
  m_forcedefunct: number;
}

declare class airship_acipc_memregion {
  constructor(init?: airship_acipc_memregion);
}

declare class icmp6_nodeinfo {
  constructor(init?: icmp6_nodeinfo);
  icmp6_ni_hdr: icmp6_hdr;
  icmp6_ni_nonce: unknown /* const array */;
}

declare class unnamed_14246928630746391285 {
  constructor(init?: unnamed_14246928630746391285);
  connectionHandle: number;
  deviceAddress: BluetoothDeviceAddress;
  linkType: number;
  transmissionInterval: number;
  retransmissionWindow: number;
  receivePacketLength: number;
  transmitPacketLength: number;
  airMode: number;
}

declare class user32_itimerval {
  constructor(init?: user32_itimerval);
  it_interval: user32_timeval;
  it_value: user32_timeval;
}

declare class user64_timex {
  constructor(init?: user64_timex);
  modes: number;
  offset: number;
  freq: number;
  maxerror: number;
  esterror: number;
  status: number;
  constant: number;
  precision: number;
  tolerance: number;
  ppsfreq: number;
  jitter: number;
  shift: number;
  stabil: number;
  jitcnt: number;
  calcnt: number;
  errcnt: number;
  stbcnt: number;
}

declare class unnamed_468159946417049962 {
  constructor(init?: unnamed_468159946417049962);
  registerNum: number;
  functionNum: number;
  deviceNum: number;
  busNum: number;
  registerNumExtended: number;
  resv: number;
}

declare class setitimer_args {
  constructor(init?: setitimer_args);
  which_l_: unknown /* const array */;
  which: number;
  which_r_: unknown /* const array */;
  itv_l_: unknown /* const array */;
  itv: number;
  itv_r_: unknown /* const array */;
  oitv_l_: unknown /* const array */;
  oitv: number;
  oitv_r_: unknown /* const array */;
}

declare class hfs_mount_args {
  constructor(init?: hfs_mount_args);
  hfs_uid: number;
  hfs_gid: number;
  hfs_mask: number;
  hfs_encoding: number;
  hfs_timezone: timezone;
  flags: number;
  journal_tbuffer_size: number;
  journal_flags: number;
  journal_disable: number;
}

declare class if_interface_state {
  constructor(init?: if_interface_state);
  valid_bitmask: number;
  rrc_state: number;
  lqm_state: number;
  interface_availability: number;
}

declare class mach_eventlink_wait_until_args {
  constructor(init?: mach_eventlink_wait_until_args);
  eventlink_port_l_: unknown /* const array */;
  eventlink_port: number;
  eventlink_port_r_: unknown /* const array */;
  wait_count_l_: unknown /* const array */;
  wait_count: number;
  wait_count_r_: unknown /* const array */;
  deadline_l_: unknown /* const array */;
  deadline: number;
  deadline_r_: unknown /* const array */;
  clock_id_l_: unknown /* const array */;
  clock_id: number;
  clock_id_r_: unknown /* const array */;
  option_l_: unknown /* const array */;
  option: number;
  option_r_: unknown /* const array */;
}

declare class ip6_hdr {
  constructor(init?: ip6_hdr);
  ip6_ctlun: unnamed_16255488822298767969;
  ip6_src: in6_addr;
  ip6_dst: in6_addr;
}

declare class __Request__mach_voucher_attr_command_t {
  constructor(init?: __Request__mach_voucher_attr_command_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  key: number;
  command: number;
  in_contentCnt: number;
  in_content: unknown /* const array */;
  out_contentCnt: number;
}

declare class __Reply__exception_raise_state_t {
  constructor(init?: __Reply__exception_raise_state_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  flavor: number;
  new_stateCnt: number;
  new_state: unknown /* const array */;
}

declare class if_bandwidths {
  constructor(init?: if_bandwidths);
  eff_bw: number;
  max_bw: number;
}

declare class __Request__mach_vm_behavior_set_t {
  constructor(init?: __Request__mach_vm_behavior_set_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  new_behavior: number;
}

declare class rt_reach_info {
  constructor(init?: rt_reach_info);
  ri_refcnt: number;
  ri_probes: number;
  ri_snd_expire: number;
  ri_rcv_expire: number;
  ri_rssi: number;
  ri_lqm: number;
  ri_npm: number;
}

declare class AsyncReportCall {
  constructor(init?: AsyncReportCall);
}

declare class nfs_user_stat_user_rec {
  constructor(init?: nfs_user_stat_user_rec);
  rec_type: number;
  uid: number;
  sock: sockaddr_storage;
  ops: number;
  bytes_read: number;
  bytes_written: number;
  tm_start: number;
  tm_last: number;
}

declare class IOReportChannel {
  constructor(init?: IOReportChannel);
  channel_id: number;
  channel_type: IOReportChannelType;
}

declare class format_op {
  constructor(init?: format_op);
  df_buf: string | null;
  df_count: number;
  df_startblk: number;
  df_reg: unknown /* const array */;
}

declare class xnu_saved_registers_t {
  constructor(init?: xnu_saved_registers_t);
  fp: number;
  lr: number;
  pc: number;
  sp: number;
}

declare class __smrq_link_t {
  constructor(init?: __smrq_link_t);
  __smr_ptr: interop.Pointer;
}

declare class platform_information {
  constructor(init?: platform_information);
  soc_id: number;
  soc_rev: number;
  product: unknown /* const array */;
  platformECID: number;
  status: number;
}

declare class __Reply__llc_memory_error_notification_t {
  constructor(init?: __Reply__llc_memory_error_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class ni_reply_fqdn {
  constructor(init?: ni_reply_fqdn);
  ni_fqdn_ttl: number;
  ni_fqdn_namelen: number;
  ni_fqdn_name: unknown /* const array */;
}

declare class IOHistogramSegmentConfig {
  constructor(init?: IOHistogramSegmentConfig);
  base_bucket_width: number;
  scale_flag: number;
  segment_idx: number;
  segment_bucket_count: number;
}

declare class clock_reply_subsystem {
  constructor(init?: clock_reply_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class unnamed_312657680947600804 {
  constructor(init?: unnamed_312657680947600804);
  transmitBandWidth: number;
  receiveBandWidth: number;
  transmitCodingFormat: number;
  receiveCodingFormat: number;
  transmitCodecFrameSize: number;
  receiveCodecFrameSize: number;
  inputBandwidth: number;
  outputBandwidth: number;
  inputCodingFormat: number;
  outputCodingFormat: number;
  inputCodedDataSize: number;
  outputCodedDataSize: number;
  inputPCMDataFormat: number;
  outputPCMDataFormat: number;
  inputPCMSampelPayloadMSBPosition: number;
  outputPCMSampelPayloadMSBPosition: number;
  inputDataPath: number;
  outputDataPath: number;
  inputTransportUnitSize: number;
  outputTransportUnitSize: number;
  maxLatency: number;
  voiceSetting: number;
  retransmissionEffort: number;
  packetType: number;
}

declare class fchflags_args {
  constructor(init?: fchflags_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class __Reply__clock_get_attributes_t {
  constructor(init?: __Reply__clock_get_attributes_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  clock_attrCnt: number;
  clock_attr: unknown /* const array */;
}

declare class esp {
  constructor(init?: esp);
  esp_spi: number;
}

declare class ip6_ext {
  constructor(init?: ip6_ext);
  ip6e_nxt: number;
  ip6e_len: number;
}

declare class flistxattr_args {
  constructor(init?: flistxattr_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  namebuf_l_: unknown /* const array */;
  namebuf: number;
  namebuf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class __Request__mach_memory_entry_ownership_t {
  constructor(init?: __Request__mach_memory_entry_ownership_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  owner: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  ledger_tag: number;
  ledger_flags: number;
}

declare class IOFramebufferNotificationNotify {
  constructor(init?: IOFramebufferNotificationNotify);
  event: number;
  info: interop.Pointer;
}

declare class newah {
  constructor(init?: newah);
  ah_nxt: number;
  ah_len: number;
  ah_reserve: number;
  ah_spi: number;
  ah_seq: number;
}

declare class in6_route_info {
  constructor(init?: in6_route_info);
  prefix: in6_addr;
  prefixlen: number;
  defrtrs: number;
}

declare class IOInterruptAccountingReporter {
  constructor(init?: IOInterruptAccountingReporter);
}

declare class __pthread_sigmask_args {
  constructor(init?: __pthread_sigmask_args);
  how_l_: unknown /* const array */;
  how: number;
  how_r_: unknown /* const array */;
  set_l_: unknown /* const array */;
  set: number;
  set_r_: unknown /* const array */;
  oset_l_: unknown /* const array */;
  oset: number;
  oset_r_: unknown /* const array */;
}

declare class __Reply__audit_analytics_t {
  constructor(init?: __Reply__audit_analytics_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class if_tcp_ecn_stat {
  constructor(init?: if_tcp_ecn_stat);
  timestamp: number;
  ecn_client_setup: number;
  ecn_server_setup: number;
  ecn_client_success: number;
  ecn_server_success: number;
  ecn_peer_nosupport: number;
  ecn_syn_lost: number;
  ecn_synack_lost: number;
  ecn_recv_ce: number;
  ecn_recv_ece: number;
  ecn_conn_recv_ce: number;
  ecn_conn_recv_ece: number;
  ecn_conn_plnoce: number;
  ecn_conn_plce: number;
  ecn_conn_noplce: number;
  ecn_fallback_synloss: number;
  ecn_fallback_reorder: number;
  ecn_fallback_ce: number;
  ecn_off_conn: number;
  ecn_total_conn: number;
  ecn_fallback_droprst: number;
  ecn_fallback_droprxmt: number;
  ecn_fallback_synrst: number;
  ecn_on: if_tcp_ecn_perf_stat;
  ecn_off: if_tcp_ecn_perf_stat;
}

declare class ledger_entry_info_v2 {
  constructor(init?: ledger_entry_info_v2);
  lei_balance: number;
  lei_credit: number;
  lei_debit: number;
  lei_limit: number;
  lei_refill_period: number;
  lei_last_refill: number;
  lei_lifetime_max: number;
  lei_reserved: unknown /* const array */;
}

declare class stack_snapshot_with_config_args {
  constructor(init?: stack_snapshot_with_config_args);
  stackshot_config_version_l_: unknown /* const array */;
  stackshot_config_version: number;
  stackshot_config_version_r_: unknown /* const array */;
  stackshot_config_l_: unknown /* const array */;
  stackshot_config: number;
  stackshot_config_r_: unknown /* const array */;
  stackshot_config_size_l_: unknown /* const array */;
  stackshot_config_size: number;
  stackshot_config_size_r_: unknown /* const array */;
}

declare class IOStateReportValues {
  constructor(init?: IOStateReportValues);
  state_id: number;
  intransitions: number;
  upticks: number;
  last_intransition: number;
}

declare class kd_cpumap_header {
  constructor(init?: kd_cpumap_header);
  version_no: number;
  cpu_count: number;
}

declare class flock_args {
  constructor(init?: flock_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  how_l_: unknown /* const array */;
  how: number;
  how_r_: unknown /* const array */;
}

declare class unnamed_14524932838175230803 {
  constructor(init?: unnamed_14524932838175230803);
  transmitBandwidth: number;
  receiveBandwidth: number;
  maxLatency: number;
  voiceSetting: number;
  retransmissionEffort: number;
  packetType: number;
}

declare class nd_ifinfo {
  constructor(init?: nd_ifinfo);
  linkmtu: number;
  maxmtu: number;
  basereachable: number;
  reachable: number;
  retrans: number;
  flags: number;
  recalctm: number;
  chlim: number;
  receivedra: number;
  randomseed0: unknown /* const array */;
  randomseed1: unknown /* const array */;
  randomid: unknown /* const array */;
}

declare class AirshipDaleBasebandErrorInfo {
  constructor(init?: AirshipDaleBasebandErrorInfo);
  error: number;
  param1: number;
  param2: number;
}

declare class fmount_args {
  constructor(init?: fmount_args);
  type_l_: unknown /* const array */;
  type: number;
  type_r_: unknown /* const array */;
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
}

declare class revoke_args {
  constructor(init?: revoke_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class info_tuple {
  constructor(init?: info_tuple);
  itpl_proto: number;
  itpl_localaddr: unnamed_16564182229133887322;
  itpl_remoteaddr: unnamed_13907781885479186503;
}

declare class chain_len_stats {
  constructor(init?: chain_len_stats);
  cls_one: number;
  cls_two: number;
  cls_three: number;
  cls_four: number;
  cls_five_or_more: number;
}

declare class bt_params {
  constructor(init?: bt_params);
  rate: number;
  base_local_ts: number;
  base_remote_ts: number;
}

declare class getpid_args {
  constructor(init?: getpid_args);
  dummy: number;
}

declare class __Reply__sysdiagnose_notification_with_audit_token_t {
  constructor(init?: __Reply__sysdiagnose_notification_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class airship_buffer {
  constructor(init?: airship_buffer);
}

declare class smrq_list_head {
  constructor(init?: smrq_list_head);
  first: __smrq_link_t;
}

declare class __Reply___mach_make_memory_entry_t {
  constructor(init?: __Reply___mach_make_memory_entry_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  object_handle: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  size: number;
}

declare class sockaddr_inarp {
  constructor(init?: sockaddr_inarp);
  sin_len: number;
  sin_family: number;
  sin_port: number;
  sin_addr: in_addr;
  sin_srcaddr: in_addr;
  sin_tos: number;
  sin_other: number;
}

declare class system_override_args {
  constructor(init?: system_override_args);
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class fchownat_args {
  constructor(init?: fchownat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class __Reply__mach_vm_remap_t {
  constructor(init?: __Reply__mach_vm_remap_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  target_address: number;
  cur_protection: number;
  max_protection: number;
}

declare class __Reply__mach_exception_raise_state_t {
  constructor(init?: __Reply__mach_exception_raise_state_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  flavor: number;
  new_stateCnt: number;
  new_state: unknown /* const array */;
}

declare class setrlimit_args {
  constructor(init?: setrlimit_args);
  which_l_: unknown /* const array */;
  which: number;
  which_r_: unknown /* const array */;
  rlp_l_: unknown /* const array */;
  rlp: number;
  rlp_r_: unknown /* const array */;
}

declare class in6_prefix {
  constructor(init?: in6_prefix);
  prefix: sockaddr_in6;
  raflags: prf_ra;
  prefixlen: number;
  origin: number;
  vltime: number;
  pltime: number;
  expire: number;
  flags: number;
  refcnt: number;
  if_index: number;
  advrtrs: number;
}

declare class cpuid_cache_desc_t {
  constructor(init?: cpuid_cache_desc_t);
  value: number;
  type: interop.Enum<typeof cache_type_t>;
  size: number;
  linesize: number;
  description: string | null;
}

declare class sadb_ext {
  constructor(init?: sadb_ext);
  sadb_ext_len: number;
  sadb_ext_type: number;
}

declare class unnamed_15093267558977120341 {
  constructor(init?: unnamed_15093267558977120341);
  connectionHandle: number;
}

declare class _stickyKeys_ModifierInfo {
  constructor(init?: _stickyKeys_ModifierInfo);
  key: number;
  state: number;
  leftModBit: number;
}

declare class airship_monitor {
  constructor(init?: airship_monitor);
}

declare class __Reply__mach_notify_no_senders_t {
  constructor(init?: __Reply__mach_notify_no_senders_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class fdatasync_args {
  constructor(init?: fdatasync_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class chflags_args {
  constructor(init?: chflags_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class __Reply__coalition_notification_t {
  constructor(init?: __Reply__coalition_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Reply__mach_vm_read_overwrite_t {
  constructor(init?: __Reply__mach_vm_read_overwrite_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  outsize: number;
}

declare class unnamed_11261674202216746262 {
  constructor(init?: unnamed_11261674202216746262);
  connectionHandle: number;
  deviceAddress: BluetoothDeviceAddress;
  role: number;
}

declare class HIDValueCapabilities {
  constructor(init?: HIDValueCapabilities);
  usagePage: number;
  reportID: number;
  bitField: number;
  collection: number;
  collectionUsage: number;
  collectionUsagePage: number;
  isRange: number;
  isStringRange: number;
  isDesignatorRange: number;
  isAbsolute: number;
  bitSize: number;
  reportCount: number;
  logicalMin: number;
  logicalMax: number;
  physicalMin: number;
  physicalMax: number;
  unitExponent: number;
  units: number;
  startBit: number;
  pbVersion: number;
  u: unnamed_1073308609630588625;
}

declare class unnamed_8042031980101623259 {
  constructor(init?: unnamed_8042031980101623259);
  deviceAddress: BluetoothDeviceAddress;
  hostSupportedFeatures: BluetoothHCISupportedFeatures;
}

declare class kqueue_args {
  constructor(init?: kqueue_args);
  dummy: number;
}

declare class SuperSpeedEndpointCompanionDescriptor {
  constructor(init?: SuperSpeedEndpointCompanionDescriptor);
  bLength: number;
  bDescriptorType: number;
  bMaxBurst: number;
  bmAttributes: number;
  wBytesPerInterval: number;
}

declare class __mach_bridge_remote_time_args {
  constructor(init?: __mach_bridge_remote_time_args);
  local_timestamp_l_: unknown /* const array */;
  local_timestamp: number;
  local_timestamp_r_: unknown /* const array */;
}

declare class OSAction_AFKUserDataPipe__HandleReport_LocalIVars {
  constructor(init?: OSAction_AFKUserDataPipe__HandleReport_LocalIVars);
}

declare class cpc_cpu {
  constructor(init?: cpc_cpu);
  ccp_core_active: boolean;
  ccp_core_pmi_count: number;
  ccp_cpmu_counters: number;
  ccp_cpmu_deadlines: number;
}

declare class unnamed_12682914610915075965 {
  constructor(init?: unnamed_12682914610915075965);
  usageMin: number;
  usageMax: number;
  stringMin: number;
  stringMax: number;
  designatorMin: number;
  designatorMax: number;
}

declare class mach_assert_3x {
  constructor(init?: mach_assert_3x);
  hdr: mach_assert_hdr;
  a: string | null;
  op: string | null;
  b: string | null;
}

declare class igmpv3 {
  constructor(init?: igmpv3);
  igmp_type: number;
  igmp_code: number;
  igmp_cksum: number;
  igmp_group: in_addr;
  igmp_misc: number;
  igmp_qqi: number;
  igmp_numsrc: number;
}

declare class kev_dl_low_power_mode {
  constructor(init?: kev_dl_low_power_mode);
  link_data: net_event_data;
  low_power_event: number;
}

declare class sgttyb {
  constructor(init?: sgttyb);
  sg_ispeed: number;
  sg_ospeed: number;
  sg_erase: number;
  sg_kill: number;
  sg_flags: number;
}

declare class abort_with_payload_args {
  constructor(init?: abort_with_payload_args);
  reason_namespace_l_: unknown /* const array */;
  reason_namespace: number;
  reason_namespace_r_: unknown /* const array */;
  reason_code_l_: unknown /* const array */;
  reason_code: number;
  reason_code_r_: unknown /* const array */;
  payload_l_: unknown /* const array */;
  payload: number;
  payload_r_: unknown /* const array */;
  payload_size_l_: unknown /* const array */;
  payload_size: number;
  payload_size_r_: unknown /* const array */;
  reason_string_l_: unknown /* const array */;
  reason_string: number;
  reason_string_r_: unknown /* const array */;
  reason_flags_l_: unknown /* const array */;
  reason_flags: number;
  reason_flags_r_: unknown /* const array */;
}

declare class sigreturn_args {
  constructor(init?: sigreturn_args);
  uctx_l_: unknown /* const array */;
  uctx: number;
  uctx_r_: unknown /* const array */;
  infostyle_l_: unknown /* const array */;
  infostyle: number;
  infostyle_r_: unknown /* const array */;
  token_l_: unknown /* const array */;
  token: number;
  token_r_: unknown /* const array */;
}

declare class unnamed_902456921391290121 {
  constructor(init?: unnamed_902456921391290121);
  indicator: interop.Enum<typeof EXDisplayPipeIndicator>;
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
  enabled: boolean;
  populated: boolean;
}

declare class dyld_chained_import_addend {
  constructor(init?: dyld_chained_import_addend);
  lib_ordinal: number;
  weak_import: number;
  name_offset: number;
  addend: number;
}

declare class MD5_CTX {
  constructor(init?: MD5_CTX);
  state: unknown /* const array */;
  count: unknown /* const array */;
  buffer: unknown /* const array */;
}

declare class eventreq {
  constructor(init?: eventreq);
  er_type: number;
  er_handle: number;
  er_data: interop.Pointer;
  er_rcnt: number;
  er_wcnt: number;
  er_ecnt: number;
  er_eventbits: number;
}

declare class macos_panic_header {
  constructor(init?: macos_panic_header);
  mph_magic: number;
  mph_crc: number;
  mph_version: number;
  mph_padding: number;
  mph_panic_flags: interop.Enum<typeof mph_panic_flags_t>;
  mph_panic_log_offset: number;
  mph_panic_log_len: number;
  mph_stackshot_offset: number;
  mph_stackshot_len: number;
  mph_other_log_offset: number;
  mph_other_log_len: number;
  mph_roots_installed: number;
  mph_data: interop.Pointer;
}

declare class IOPMPowerState {
  constructor(init?: IOPMPowerState);
  version: number;
  capabilityFlags: number;
  outputPowerCharacter: number;
  inputPowerRequirement: number;
  staticPower: number;
  stateOrder: number;
  powerToAttain: number;
  timeToAttain: number;
  settleUpTime: number;
  timeToLower: number;
  settleDownTime: number;
  powerDomainBudget: number;
}

declare class freadlink_args {
  constructor(init?: freadlink_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
}

declare class PlatformCapabilityDescriptor {
  constructor(init?: PlatformCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
  bReserved: number;
  uuidPlatformCapability: unknown /* const array */;
}

declare class IOExternalMethodArgumentsOpaque {
  constructor(init?: IOExternalMethodArgumentsOpaque);
}

declare class ipv6_prefix {
  constructor(init?: ipv6_prefix);
  ipv6_prefix: in6_addr;
  prefix_len: number;
}

declare class umask_args {
  constructor(init?: umask_args);
  newmask_l_: unknown /* const array */;
  newmask: number;
  newmask_r_: unknown /* const array */;
}

declare class ltchars {
  constructor(init?: ltchars);
  t_suspc: number;
  t_dsuspc: number;
  t_rprntc: number;
  t_flushc: number;
  t_werasc: number;
  t_lnextc: number;
}

declare class sadb_supported {
  constructor(init?: sadb_supported);
  sadb_supported_len: number;
  sadb_supported_exttype: number;
  sadb_supported_reserved: number;
}

declare class in6_ndireq {
  constructor(init?: in6_ndireq);
  ifname: unknown /* const array */;
  ndi: nd_ifinfo;
}

declare class StringDescriptor {
  constructor(init?: StringDescriptor);
  bLength: number;
  bDescriptorType: number;
  bString: unknown /* const array */;
}

declare class if_qstatsreq {
  constructor(init?: if_qstatsreq);
  ifqr_name: unknown /* const array */;
  ifqr_grp_idx: number;
  ifqr_slot: number;
  ifqr_buf: interop.Pointer;
  ifqr_len: number;
}

declare class __Reply__mach_vm_msync_t {
  constructor(init?: __Reply__mach_vm_msync_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class memory_error_notification_subsystem {
  constructor(init?: memory_error_notification_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class IOUSBHostIOSourceClientRecord {
  constructor(init?: IOUSBHostIOSourceClientRecord);
  forClient: interop.Pointer;
  outstandingIO: number;
  link: IOUSBHostIOSourceClientRecordLink;
}

declare class unnamed_16568359550700740867 {
  constructor(init?: unnamed_16568359550700740867);
  results: unknown /* const array */;
  count: number;
}

declare class unnamed_6299073149156340752 {
  constructor(init?: unnamed_6299073149156340752);
  connectionHandle: number;
}

declare class ptrace_args {
  constructor(init?: ptrace_args);
  req_l_: unknown /* const array */;
  req: number;
  req_r_: unknown /* const array */;
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
}

declare class nfs_sec {
  constructor(init?: nfs_sec);
  count: number;
  flavors: unknown /* const array */;
}

declare class HIDButtonCapabilities {
  constructor(init?: HIDButtonCapabilities);
  usagePage: number;
  reportID: number;
  bitField: number;
  collection: number;
  collectionUsage: number;
  collectionUsagePage: number;
  isRange: number;
  isStringRange: number;
  isDesignatorRange: number;
  isAbsolute: number;
  unitExponent: number;
  units: number;
  startBit: number;
  pbVersion: number;
  u: unnamed_15220813377071643169;
}

declare class lstat_extended_args {
  constructor(init?: lstat_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
  xsecurity_size_l_: unknown /* const array */;
  xsecurity_size: number;
  xsecurity_size_r_: unknown /* const array */;
}

declare class ffsctl_args {
  constructor(init?: ffsctl_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class IOServiceNotificationDispatchSource_LocalIVars {
  constructor(init?: IOServiceNotificationDispatchSource_LocalIVars);
}

declare class unnamed_13796328879155343206 {
  constructor(init?: unnamed_13796328879155343206);
  control: number;
  frmr_rej_pdu0: number;
  frmr_rej_pdu1: number;
  frmr_control: number;
  frmr_control_ext: number;
  frmr_cause: number;
}

declare class pread_nocancel_args {
  constructor(init?: pread_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class unnamed_5862396436199497392 {
  constructor(init?: unnamed_5862396436199497392);
  role: number;
  handle: number;
}

declare class unnamed_5213310606584169548 {
  constructor(init?: unnamed_5213310606584169548);
  deviceAddress: BluetoothDeviceAddress;
  classOfDevice: number;
  linkType: number;
}

declare class telemetry_notification_subsystem {
  constructor(init?: telemetry_notification_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class IOUSBHostInterface_LocalIVars {
  constructor(init?: IOUSBHostInterface_LocalIVars);
}

declare class fstatfs64_args {
  constructor(init?: fstatfs64_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
}

declare class __pthread_canceled_args {
  constructor(init?: __pthread_canceled_args);
  action_l_: unknown /* const array */;
  action: number;
  action_r_: unknown /* const array */;
}

declare class __Request___mach_make_memory_entry_t {
  constructor(init?: __Request___mach_make_memory_entry_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  parent_handle: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  size: number;
  offset: number;
  permission: number;
}

declare class pipe_args {
  constructor(init?: pipe_args);
  dummy: number;
}

declare class __Request__vfs_resolve_file_with_audit_token_t {
  constructor(init?: __Request__vfs_resolve_file_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  req_id: number;
  op: number;
  offset: number;
  size: number;
  path: unknown /* const array */;
  req_atoken: audit_token_t;
}

declare class mkdirat_args {
  constructor(init?: mkdirat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class write_args {
  constructor(init?: write_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  cbuf_l_: unknown /* const array */;
  cbuf: number;
  cbuf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
}

declare class sptm_client_state {
  constructor(init?: sptm_client_state);
  version: number;
  n_papt_ranges: interop.Pointer;
  papt_ranges: interop.Pointer;
  first_phys: number;
  last_phys: number;
  first_papt: number;
  last_papt: number;
  root_table_paddr: number;
  frame_table: interop.Pointer;
  frame_type_params: interop.Pointer;
  pt_attr_table: interop.Pointer;
  cpu_features: number;
  n_io_ranges: number;
  io_frame_table: interop.Pointer;
  sptm_first_tag_storage_paddr: number;
  sptm_last_tag_storage_paddr: number;
  sptm_panicking_cpu_id: interop.Pointer;
  trace_buffer: interop.Pointer;
  percpu_dispatch_state: interop.Pointer;
  max_cpus: number;
  percpu_xnu_saved_state: interop.Pointer;
  feature_flags: number;
  allowed_io_frame_table: interop.Pointer;
  sptm_n_allowed_io_ranges: number;
  sptm_pmap_io_ranges: interop.Pointer;
  sptm_pmap_io_ranges_count: number;
  sptm_panicking_domain_id: interop.Pointer;
  percpu_event_counters: interop.Pointer;
  dram_base_paddr: number;
  dram_end_paddr: number;
  sapt_table_papt: number;
  version_string: string | null;
  reserved0: unknown /* const array */;
  reserved: unknown /* const array */;
}

declare class xvsockpgen {
  constructor(init?: xvsockpgen);
  xvg_len: number;
  xvg_count: number;
  xvg_gen: number;
  xvg_sogen: number;
}

declare class kevent64_args {
  constructor(init?: kevent64_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  changelist_l_: unknown /* const array */;
  changelist: number;
  changelist_r_: unknown /* const array */;
  nchanges_l_: unknown /* const array */;
  nchanges: number;
  nchanges_r_: unknown /* const array */;
  eventlist_l_: unknown /* const array */;
  eventlist: number;
  eventlist_r_: unknown /* const array */;
  nevents_l_: unknown /* const array */;
  nevents: number;
  nevents_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
}

declare class smrq_link {
  constructor(init?: smrq_link);
  next: __smrq_link_t;
  prev: interop.Pointer;
}

declare class OSAction_IOHIDEventService__SetUserProperties_IVars {
  constructor(init?: OSAction_IOHIDEventService__SetUserProperties_IVars);
}

declare class HIDButtonCaps {
  constructor(init?: HIDButtonCaps);
  usagePage: number;
  reportID: number;
  bitField: number;
  collection: number;
  collectionUsage: number;
  collectionUsagePage: number;
  isRange: number;
  isStringRange: number;
  isDesignatorRange: number;
  isAbsolute: number;
  startBit: number;
  u: unnamed_10026640810810341317;
}

declare class sadb_lifetime {
  constructor(init?: sadb_lifetime);
  sadb_lifetime_len: number;
  sadb_lifetime_exttype: number;
  sadb_lifetime_allocations: number;
  sadb_lifetime_bytes: number;
  sadb_lifetime_addtime: number;
  sadb_lifetime_usetime: number;
}

declare class __Reply__mach_notify_dead_name_t {
  constructor(init?: __Reply__mach_notify_dead_name_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class EfiMemoryRange {
  constructor(init?: EfiMemoryRange);
  Type: number;
  Pad: number;
  PhysicalStart: number;
  VirtualStart: number;
  NumberOfPages: number;
  Attribute: number;
}

declare class conninfo_mptcp {
  constructor(init?: conninfo_mptcp);
  mptcpci_len: number;
  mptcpci_flow_offset: number;
  mptcpci_nflows: number;
  mptcpci_state: number;
  mptcpci_mpte_flags: number;
  mptcpci_flags: number;
  mptcpci_ltoken: number;
  mptcpci_rtoken: number;
  mptcpci_notsent_lowat: number;
  mptcpci_snduna: number;
  mptcpci_sndnxt: number;
  mptcpci_sndmax: number;
  mptcpci_lidsn: number;
  mptcpci_sndwnd: number;
  mptcpci_rcvnxt: number;
  mptcpci_ridsn: number;
  mptcpci_rcvwnd: number;
  mptcpci_mpte_addrid: number;
  mptcpci_flows: unknown /* const array */;
}

declare class if_traffic_class {
  constructor(init?: if_traffic_class);
  ifi_ibepackets: number;
  ifi_ibebytes: number;
  ifi_obepackets: number;
  ifi_obebytes: number;
  ifi_ibkpackets: number;
  ifi_ibkbytes: number;
  ifi_obkpackets: number;
  ifi_obkbytes: number;
  ifi_ivipackets: number;
  ifi_ivibytes: number;
  ifi_ovipackets: number;
  ifi_ovibytes: number;
  ifi_ivopackets: number;
  ifi_ivobytes: number;
  ifi_ovopackets: number;
  ifi_ovobytes: number;
  ifi_ipvpackets: number;
  ifi_ipvbytes: number;
  ifi_opvpackets: number;
  ifi_opvbytes: number;
}

declare class ip6_hdrctl {
  constructor(init?: ip6_hdrctl);
  ip6_un1_flow: number;
  ip6_un1_plen: number;
  ip6_un1_nxt: number;
  ip6_un1_hlim: number;
}

declare class efi_aurr_panic_header {
  constructor(init?: efi_aurr_panic_header);
  efi_aurr_magic: number;
  efi_aurr_crc: number;
  efi_aurr_version: number;
  efi_aurr_reset_cause: number;
  efi_aurr_reset_log_offset: number;
  efi_aurr_reset_log_len: number;
  efi_aurr_panic_data: interop.Pointer;
}

declare class nfsclntstats {
  constructor(init?: nfsclntstats);
  attrcache_hits: number;
  attrcache_misses: number;
  lookupcache_hits: number;
  lookupcache_misses: number;
  direofcache_hits: number;
  direofcache_misses: number;
  accesscache_hits: number;
  accesscache_misses: number;
  biocache_reads: number;
  read_bios: number;
  read_physios: number;
  biocache_writes: number;
  write_bios: number;
  write_physios: number;
  biocache_readlinks: number;
  readlink_bios: number;
  biocache_readdirs: number;
  readdir_bios: number;
  rpccntv3: unknown /* const array */;
  nlmcnt: unnamed_12295644343766646936;
  opcntv4: unknown /* const array */;
  cbopcntv4: unknown /* const array */;
  rpcretries: number;
  rpcrequests: number;
  rpctimeouts: number;
  rpcunexpected: number;
  rpcinvalid: number;
  pageins: number;
  pageouts: number;
  nfs_errs: unnamed_9814764806365556603;
}

declare class ConfigurationDescriptor {
  constructor(init?: ConfigurationDescriptor);
  bLength: number;
  bDescriptorType: number;
  wTotalLength: number;
  bNumInterfaces: number;
  bConfigurationValue: number;
  iConfiguration: number;
  bmAttributes: number;
  bMaxPower: number;
}

declare class pipe2_args {
  constructor(init?: pipe2_args);
  fildes_l_: unknown /* const array */;
  fildes: number;
  fildes_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class pseminfo {
  constructor(init?: pseminfo);
  psem_flags: number;
  psem_usecount: number;
  psem_mode: number;
  psem_uid: number;
  psem_gid: number;
  psem_name: unknown /* const array */;
  psem_semobject: interop.Pointer;
  psem_label: interop.Pointer;
  psem_creator_pid: number;
  psem_creator_uniqueid: number;
}

declare class smr {
  constructor(init?: smr);
}

declare class so_nke {
  constructor(init?: so_nke);
  nke_handle: number;
  nke_where: number;
  nke_flags: number;
  reserved: unknown /* const array */;
}

declare class waitid_args {
  constructor(init?: waitid_args);
  idtype_l_: unknown /* const array */;
  idtype: interop.Enum<typeof idtype_t>;
  idtype_r_: unknown /* const array */;
  id_l_: unknown /* const array */;
  id: number;
  id_r_: unknown /* const array */;
  infop_l_: unknown /* const array */;
  infop: number;
  infop_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class auditpipe_ioctl_preselect {
  constructor(init?: auditpipe_ioctl_preselect);
  aip_auid: number;
  aip_mask: au_mask;
}

declare class __Request__mach_voucher_attr_control_create_mach_voucher_t {
  constructor(init?: __Request__mach_voucher_attr_control_create_mach_voucher_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  recipesCnt: number;
  recipes: unknown /* const array */;
}

declare class call_gate {
  constructor(init?: call_gate);
  offset00: number;
  seg: sel;
  argcnt: number;
  type: number;
  dpl: number;
  present: number;
  offset16: number;
}

declare class reboot_args {
  constructor(init?: reboot_args);
  opt_l_: unknown /* const array */;
  opt: number;
  opt_r_: unknown /* const array */;
  msg_l_: unknown /* const array */;
  msg: number;
  msg_r_: unknown /* const array */;
}

declare class sadb_sa {
  constructor(init?: sadb_sa);
  sadb_sa_len: number;
  sadb_sa_exttype: number;
  sadb_sa_spi: number;
  sadb_sa_replay: number;
  sadb_sa_state: number;
  sadb_sa_auth: number;
  sadb_sa_encrypt: number;
  sadb_sa_flags: number;
}

declare class user_msqid_ds {
  constructor(init?: user_msqid_ds);
  msg_perm: ipc_perm;
  msg_first: interop.Pointer;
  msg_last: interop.Pointer;
  msg_cbytes: number;
  msg_qnum: number;
  msg_qbytes: number;
  msg_lspid: number;
  msg_lrpid: number;
  msg_stime: number;
  msg_pad1: number;
  msg_rtime: number;
  msg_pad2: number;
  msg_ctime: number;
  msg_pad3: number;
  msg_pad4: unknown /* const array */;
}

declare class __Request__mach_voucher_extract_attr_recipe_t {
  constructor(init?: __Request__mach_voucher_extract_attr_recipe_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  key: number;
  recipeCnt: number;
}

declare class dyld_chained_fixups_header {
  constructor(init?: dyld_chained_fixups_header);
  fixups_version: number;
  starts_offset: number;
  imports_offset: number;
  symbols_offset: number;
  imports_count: number;
  imports_format: number;
  symbols_format: number;
}

declare class backtrace_control {
  constructor(init?: backtrace_control);
  btc_flags: interop.Enum<typeof backtrace_flags_t>;
  btc_frame_addr: number;
  btc_user_thread: interop.Pointer;
  btc_user_copy: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => number | null;
  btc_user_copy_context: interop.Pointer;
  btc_addr_offset: number;
}

declare class receive_sysdiagnose_notification_subsystem {
  constructor(init?: receive_sysdiagnose_notification_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class IOInterruptAccountingData {
  constructor(init?: IOInterruptAccountingData);
}

declare class ctl_info {
  constructor(init?: ctl_info);
  ctl_id: number;
  ctl_name: unknown /* const array */;
}

declare class ether_vlan_header {
  constructor(init?: ether_vlan_header);
  evl_dhost: unknown /* const array */;
  evl_shost: unknown /* const array */;
  evl_encap_proto: number;
  evl_tag: number;
  evl_proto: number;
}

declare class __Reply__doubleagent_remove_xattr_t {
  constructor(init?: __Reply__doubleagent_remove_xattr_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  err: number;
  is_empty: number;
}

declare class static_if_entry {
  constructor(init?: static_if_entry);
  sie_base: number;
  sie_target: number;
  sie_link: number;
}

declare class __Reply__clock_alarm_t {
  constructor(init?: __Reply__clock_alarm_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class thsc_time_energy_cpi {
  constructor(init?: thsc_time_energy_cpi);
  ttec_instructions: number;
  ttec_cycles: number;
  ttec_user_time_mach: number;
  ttec_system_time_mach: number;
  ttec_energy_nj: number;
}

declare class __Request__vfs_resolve_dir_with_audit_token_t {
  constructor(init?: __Request__vfs_resolve_dir_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  req_id: number;
  op: number;
  file_name: unknown /* const array */;
  path: unknown /* const array */;
  req_atoken: audit_token_t;
}

declare class airship_acipc_tr_transfer_completion {
  constructor(init?: airship_acipc_tr_transfer_completion);
  io_result: interop.Enum<typeof airship_acipc_io_result>;
  cr_id: number;
  status_code: number;
  descriptor_type: number;
  size: number;
  client_data: number;
  last_completed_transfer: boolean;
  last_in_chain: boolean;
  next_tag: number;
}

declare class dyld_chained_import_addend64 {
  constructor(init?: dyld_chained_import_addend64);
  lib_ordinal: number;
  weak_import: number;
  reserved: number;
  name_offset: number;
  addend: number;
}

declare class _VSLService {
  constructor(init?: _VSLService);
}

declare class sadb_msg {
  constructor(init?: sadb_msg);
  sadb_msg_version: number;
  sadb_msg_type: number;
  sadb_msg_errno: number;
  sadb_msg_satype: number;
  sadb_msg_len: number;
  sadb_msg_reserved: number;
  sadb_msg_seq: number;
  sadb_msg_pid: number;
}

declare class __Request__doubleagent_remove_xattr_t {
  constructor(init?: __Request__doubleagent_remove_xattr_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  file_port: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  file_size: number;
  nameOffset: number;
  nameCnt: number;
  name: unknown /* const array */;
}

declare class mpsc_queue_chain {
  constructor(init?: mpsc_queue_chain);
  mpqc_next: unknown /* _Atomic(struct mpsc_queue_chain *) (CXTypeKind: 177) */;
}

declare class __Reply__vfs_resolve_file_with_audit_token_t {
  constructor(init?: __Reply__vfs_resolve_file_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__mach_exception_raise_state_identity_t {
  constructor(init?: __Request__mach_exception_raise_state_identity_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  thread: mach_msg_port_descriptor_t;
  task: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  exception: number;
  codeCnt: number;
  code: unknown /* const array */;
  flavor: number;
  old_stateCnt: number;
  old_state: unknown /* const array */;
}

declare class lio_listio_args {
  constructor(init?: lio_listio_args);
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  aiocblist_l_: unknown /* const array */;
  aiocblist: number;
  aiocblist_r_: unknown /* const array */;
  nent_l_: unknown /* const array */;
  nent: number;
  nent_r_: unknown /* const array */;
  sigp_l_: unknown /* const array */;
  sigp: number;
  sigp_r_: unknown /* const array */;
}

declare class __lck_spin_t__ {
  constructor(init?: __lck_spin_t__);
}

declare class chown_args {
  constructor(init?: chown_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
}

declare class unnamed_10947379444960332943 {
  constructor(init?: unnamed_10947379444960332943);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  offset: number;
  size: number;
  cntrl_flags: number;
  page_listCnt: number;
  page_list: unknown /* const array */;
}

declare class __Request__mach_gss_init_sec_context_v2_t {
  constructor(init?: __Request__mach_gss_init_sec_context_v2_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  intoken: mach_msg_ool_descriptor_t;
  clnt_princ: mach_msg_ool_descriptor_t;
  svc_princ: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  mech: interop.Enum<typeof gssd_mechtype>;
  intokenCnt: number;
  uid: number;
  clnt_nt: interop.Enum<typeof gssd_nametype>;
  clnt_princCnt: number;
  svc_nt: interop.Enum<typeof gssd_nametype>;
  svc_princCnt: number;
  flags: number;
  gssd_flags: number;
  context: number;
  cred_handle: number;
}

declare class unnamed_4842397918544997271 {
  constructor(init?: unnamed_4842397918544997271);
  numLinkKeys: number;
  linkKeys: unknown /* const array */;
}

declare class lz4_hash_entry_t {
  constructor(init?: lz4_hash_entry_t);
  offset: number;
  word: number;
}

declare class sadb_sens {
  constructor(init?: sadb_sens);
  sadb_sens_len: number;
  sadb_sens_exttype: number;
  sadb_sens_dpd: number;
  sadb_sens_sens_level: number;
  sadb_sens_sens_len: number;
  sadb_sens_integ_level: number;
  sadb_sens_integ_len: number;
  sadb_sens_reserved: number;
}

declare class __Reply__kextd_ping_t {
  constructor(init?: __Reply__kextd_ping_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class nd_opt_rd_hdr {
  constructor(init?: nd_opt_rd_hdr);
  nd_opt_rh_type: number;
  nd_opt_rh_len: number;
  nd_opt_rh_reserved1: number;
  nd_opt_rh_reserved2: number;
}

declare class airship_daleipc_channel_transfer_completion {
  constructor(init?: airship_daleipc_channel_transfer_completion);
  size: number;
  tag: number;
}

declare class vm_pressure_monitor_args {
  constructor(init?: vm_pressure_monitor_args);
  wait_for_pressure_l_: unknown /* const array */;
  wait_for_pressure: number;
  wait_for_pressure_r_: unknown /* const array */;
  nsecs_monitored_l_: unknown /* const array */;
  nsecs_monitored: number;
  nsecs_monitored_r_: unknown /* const array */;
  pages_reclaimed_l_: unknown /* const array */;
  pages_reclaimed: number;
  pages_reclaimed_r_: unknown /* const array */;
}

declare class getwgroups_args {
  constructor(init?: getwgroups_args);
  setlen_l_: unknown /* const array */;
  setlen: number;
  setlen_r_: unknown /* const array */;
  guidset_l_: unknown /* const array */;
  guidset: number;
  guidset_r_: unknown /* const array */;
}

declare class user64_timespec {
  constructor(init?: user64_timespec);
  tv_sec: number;
  tv_nsec: number;
}

declare class record_system_event_args {
  constructor(init?: record_system_event_args);
  type_l_: unknown /* const array */;
  type: number;
  type_r_: unknown /* const array */;
  subsystem_l_: unknown /* const array */;
  subsystem: number;
  subsystem_r_: unknown /* const array */;
  event_l_: unknown /* const array */;
  event: number;
  event_r_: unknown /* const array */;
  payload_l_: unknown /* const array */;
  payload: number;
  payload_r_: unknown /* const array */;
}

declare class nfs_stateid {
  constructor(init?: nfs_stateid);
  seqid: number;
  other: unknown /* const array */;
}

declare class IOCircularDataQueueMemory {
  constructor(init?: IOCircularDataQueueMemory);
  sentinel: number;
  _padding: number;
  entries: unknown /* const array */;
}

declare class unnamed_2052650275735979896 {
  constructor(init?: unnamed_2052650275735979896);
  scanInterval: number;
  scanWindow: number;
}

declare class tcp_conn_status {
  constructor(init?: tcp_conn_status);
}

declare class sockaddr_ctl {
  constructor(init?: sockaddr_ctl);
  sc_len: number;
  sc_family: number;
  ss_sysaddr: number;
  sc_id: number;
  sc_unit: number;
  sc_reserved: unknown /* const array */;
}

declare class doubleagent_subsystem {
  constructor(init?: doubleagent_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class xtcpcb64 {
  constructor(init?: xtcpcb64);
  xt_len: number;
  xt_inpcb: xinpcb64;
  t_segq: number;
  t_dupacks: number;
  t_timer: unknown /* const array */;
  t_state: number;
  t_flags: number;
  t_force: number;
  snd_una: number;
  snd_max: number;
  snd_nxt: number;
  snd_up: number;
  snd_wl1: number;
  snd_wl2: number;
  iss: number;
  irs: number;
  rcv_nxt: number;
  rcv_adv: number;
  rcv_wnd: number;
  rcv_up: number;
  snd_wnd: number;
  snd_cwnd: number;
  snd_ssthresh: number;
  t_maxopd: number;
  t_rcvtime: number;
  t_starttime: number;
  t_rtttime: number;
  t_rtseq: number;
  t_rxtcur: number;
  t_maxseg: number;
  t_srtt: number;
  t_rttvar: number;
  t_rxtshift: number;
  t_rttmin: number;
  t_rttupdated: number;
  max_sndwnd: number;
  t_softerror: number;
  t_oobflags: number;
  t_iobc: number;
  snd_scale: number;
  rcv_scale: number;
  request_r_scale: number;
  requested_s_scale: number;
  ts_recent: number;
  ts_recent_age: number;
  last_ack_sent: number;
  cc_send: number;
  cc_recv: number;
  snd_recover: number;
  snd_cwnd_prev: number;
  snd_ssthresh_prev: number;
  t_badrxtwin: number;
  xt_alignment_hack: number;
}

declare class dup_args {
  constructor(init?: dup_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class rt_addrinfo_ext {
  constructor(init?: rt_addrinfo_ext);
  rtix_info: rt_addrinfo;
  rtix_tiny_addr: unknown /* const array */;
  rtix_next_tiny: number;
}

declare class getfsstat_args {
  constructor(init?: getfsstat_args);
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class log_data_args {
  constructor(init?: log_data_args);
  tag_l_: unknown /* const array */;
  tag: number;
  tag_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  buffer_l_: unknown /* const array */;
  buffer: number;
  buffer_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
}

declare class IOWorkGroup_LocalIVars {
  constructor(init?: IOWorkGroup_LocalIVars);
}

declare class vc_progress_user_options {
  constructor(init?: vc_progress_user_options);
  options: number;
  x_pos: number;
  y_pos: number;
  resv: unknown /* const array */;
}

declare class readlink_args {
  constructor(init?: readlink_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  count_l_: unknown /* const array */;
  count: number;
  count_r_: unknown /* const array */;
}

declare class mptcp_symptoms_answer {
  constructor(init?: mptcp_symptoms_answer);
  advisory: symptoms_advisory;
  uuid: unknown /* const array */;
  rssi: number;
}

declare class IOExternalAsyncMethod {
  constructor(init?: IOExternalAsyncMethod);
  object: interop.Pointer;
  func: number;
  flags: number;
  count0: number;
  count1: number;
}

declare class __Reply__mach_gss_accept_sec_context_v2_t {
  constructor(init?: __Reply__mach_gss_accept_sec_context_v2_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  key: mach_msg_ool_descriptor_t;
  outtoken: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  gssd_flags: number;
  context: number;
  cred_handle: number;
  flags: number;
  uid: number;
  gidsCnt: number;
  gids: unknown /* const array */;
  keyCnt: number;
  outtokenCnt: number;
  major_stat: number;
  minor_stat: number;
}

declare class nfs_uquad {
  constructor(init?: nfs_uquad);
  nfsuquad: unknown /* const array */;
}

declare class unnamed_7102514305945053709 {
  constructor(init?: unnamed_7102514305945053709);
  connectionHandle: number;
  clockOffset: number;
}

declare class getattrlistat_args {
  constructor(init?: getattrlistat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  attributeBuffer_l_: unknown /* const array */;
  attributeBuffer: number;
  attributeBuffer_r_: unknown /* const array */;
  bufferSize_l_: unknown /* const array */;
  bufferSize: number;
  bufferSize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class symlink_args {
  constructor(init?: symlink_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  link_l_: unknown /* const array */;
  link: number;
  link_r_: unknown /* const array */;
}

declare class unnamed_2524357878917816231 {
  constructor(init?: unnamed_2524357878917816231);
  deviceAddress: BluetoothDeviceAddress;
  pageScanMode: number;
}

declare class kd_buf {
  constructor(init?: kd_buf);
  timestamp: number;
  arg1: number;
  arg2: number;
  arg3: number;
  arg4: number;
  arg5: number;
  debugid: number;
  cpuid: number;
  unused: number;
}

declare class nextvend {
  constructor(init?: nextvend);
  nv_magic: unknown /* const array */;
  nv_version: number;
  nv_U: unnamed_16339770963653865466;
}

declare class AFKUserDataPipe_IVars {
  constructor(init?: AFKUserDataPipe_IVars);
}

declare class IOUSBHostHIDDescriptor {
  constructor(init?: IOUSBHostHIDDescriptor);
}

declare class guarded_write_np_args {
  constructor(init?: guarded_write_np_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  cbuf_l_: unknown /* const array */;
  cbuf: number;
  cbuf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
}

declare class igmp {
  constructor(init?: igmp);
  igmp_type: number;
  igmp_code: number;
  igmp_cksum: number;
  igmp_group: in_addr;
}

declare class if_descreq {
  constructor(init?: if_descreq);
  ifdr_name: unknown /* const array */;
  ifdr_len: number;
  ifdr_desc: unknown /* const array */;
}

declare class aio_writev_args {
  constructor(init?: aio_writev_args);
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class fsync_args {
  constructor(init?: fsync_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class xbpf_d {
  constructor(init?: xbpf_d);
  bd_structsize: number;
  bd_dev_minor: number;
  bd_sig: number;
  bd_slen: number;
  bd_hlen: number;
  bd_bufsize: number;
  bd_pid: number;
  bd_promisc: number;
  bd_immediate: number;
  bd_hdrcmplt: number;
  bd_async: number;
  bd_headdrop: number;
  bd_direction: number;
  bh_compreq: number;
  bh_compenabled: number;
  bd_exthdr: number;
  bd_trunc: number;
  bd_pkthdrv2: number;
  bd_batch_write: number;
  bd_divert_in: number;
  bd_padding: number;
  bd_rcount: number;
  bd_dcount: number;
  bd_fcount: number;
  bd_wcount: number;
  bd_wdcount: number;
  bd_ifname: unknown /* const array */;
  bd_comp_count: number;
  bd_comp_size: number;
  bd_scnt: number;
  bd_hcnt: number;
  bd_read_count: number;
  bd_fsize: number;
  bd_btrunc: number;
}

declare class IOCircularDataQueue {
  constructor(init?: IOCircularDataQueue);
  queueCursor: IOCircularDataQueueMemoryCursor;
  OS_PTRAUTH_SIGNED_PTR: unknown /* struct IOCircularDataQueueMemory *() (CXTypeKind: 110) */;
  queueHeaderShadow: IOCircularDataQueueDescription;
}

declare class unnamed_2320494029305114188 {
  constructor(init?: unnamed_2320494029305114188);
  connectionHandle: number;
  mode: number;
  modeInterval: number;
}

declare class __CodeDirectory {
  constructor(init?: __CodeDirectory);
  magic: number;
  length: number;
  version: number;
  flags: number;
  hashOffset: number;
  identOffset: number;
  nSpecialSlots: number;
  nCodeSlots: number;
  codeLimit: number;
  hashSize: number;
  hashType: number;
  platform: number;
  pageSize: number;
  spare2: number;
  end_earliest: unknown /* const array */;
  scatterOffset: number;
  end_withScatter: unknown /* const array */;
  teamOffset: number;
  end_withTeam: unknown /* const array */;
  spare3: number;
  codeLimit64: number;
  end_withCodeLimit64: unknown /* const array */;
  execSegBase: number;
  execSegLimit: number;
  execSegFlags: number;
  end_withExecSeg: unknown /* const array */;
  runtime: number;
  preEncryptOffset: number;
  end_withPreEncryptOffset: unknown /* const array */;
  linkageHashType: number;
  linkageApplicationType: number;
  linkageApplicationSubType: number;
  linkageOffset: number;
  linkageSize: number;
  end_withLinkage: unknown /* const array */;
}

declare class conninfo_tcp {
  constructor(init?: conninfo_tcp);
  tcpci_tcp_info: tcp_info;
}

declare class trust_cache_entry1 {
  constructor(init?: trust_cache_entry1);
  cdhash: unknown /* const array */;
  hash_type: number;
  flags: number;
}

declare class __Request__mach_notify_port_destroyed_t {
  constructor(init?: __Request__mach_notify_port_destroyed_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  rights: mach_msg_port_descriptor_t;
}

declare class ifnet_stats_param {
  constructor(init?: ifnet_stats_param);
  packets_in: number;
  bytes_in: number;
  multicasts_in: number;
  errors_in: number;
  packets_out: number;
  bytes_out: number;
  multicasts_out: number;
  errors_out: number;
  collisions: number;
  dropped: number;
  no_protocol: number;
}

declare class __Reply__check_task_access_with_flavor_t {
  constructor(init?: __Reply__check_task_access_with_flavor_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class cpuid_xsave_leaf_t {
  constructor(init?: cpuid_xsave_leaf_t);
  extended_state: unknown /* const array */;
}

declare class __Request__check_task_access_with_flavor_t {
  constructor(init?: __Request__check_task_access_with_flavor_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  calling_pid: number;
  calling_gid: number;
  target_pid: number;
  flavor: number;
}

declare class lstat64_extended_args {
  constructor(init?: lstat64_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
  xsecurity_size_l_: unknown /* const array */;
  xsecurity_size: number;
  xsecurity_size_r_: unknown /* const array */;
}

declare class EXDisplayPipeHealthReport {
  constructor(init?: EXDisplayPipeHealthReport);
  sca_driver_health: EXDisplayPipeHealthRecord;
  sca_algorithm_health: EXDisplayPipeHealthRecord;
  scl_health: EXDisplayPipeHealthRecord;
  pipe_health: EXDisplayPipeHealthRecord;
  link_health: EXDisplayPipeHealthRecord;
  health: boolean;
}

declare class unnamed_17167130612807407298 {
  constructor(init?: unnamed_17167130612807407298);
  settings: number;
  handle: number;
}

declare class unnamed_395901244814143410 {
  constructor(init?: unnamed_395901244814143410);
  xbb_base: string | null;
  xbb_size: number;
  xbb_len: number;
}

declare class unnamed_8251526149712667418 {
  constructor(init?: unnamed_8251526149712667418);
  handle: number;
  timeout: number;
}

declare class IOEventLink_LocalIVars {
  constructor(init?: IOEventLink_LocalIVars);
}

declare class IOHIDEventService_LocalIVars {
  constructor(init?: IOHIDEventService_LocalIVars);
}

declare class __Request__check_task_access_t {
  constructor(init?: __Request__check_task_access_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  calling_pid: number;
  calling_gid: number;
  target_pid: number;
}

declare class unnamed_11816978242320104484 {
  constructor(init?: unnamed_11816978242320104484);
  tqe_next: interop.Pointer;
  tqe_prev: interop.Pointer;
}

declare class icmp6_hdr {
  constructor(init?: icmp6_hdr);
  icmp6_type: number;
  icmp6_code: number;
  icmp6_cksum: number;
  icmp6_dataun: unnamed_10582003878615679738;
}

declare class thread_selfusage_args {
  constructor(init?: thread_selfusage_args);
  dummy: number;
}

declare class OSAction_IOHIDEventService__SetUserProperties_LocalIVars {
  constructor(init?: OSAction_IOHIDEventService__SetUserProperties_LocalIVars);
}

declare class pselect_args {
  constructor(init?: pselect_args);
  nd_l_: unknown /* const array */;
  nd: number;
  nd_r_: unknown /* const array */;
  in_l_: unknown /* const array */;
  in_: number;
  in_r_: unknown /* const array */;
  ou_l_: unknown /* const array */;
  ou: number;
  ou_r_: unknown /* const array */;
  ex_l_: unknown /* const array */;
  ex: number;
  ex_r_: unknown /* const array */;
  ts_l_: unknown /* const array */;
  ts: number;
  ts_r_: unknown /* const array */;
  mask_l_: unknown /* const array */;
  mask: number;
  mask_r_: unknown /* const array */;
}

declare class ip6_opt_jumbo {
  constructor(init?: ip6_opt_jumbo);
  ip6oj_type: number;
  ip6oj_len: number;
  ip6oj_jumbo_len: unknown /* const array */;
}

declare class daleipc_uplink_controller {
  constructor(init?: daleipc_uplink_controller);
}

declare class if_packet_stats {
  constructor(init?: if_packet_stats);
  ifi_tcp_badformat: number;
  ifi_tcp_unspecv6: number;
  ifi_tcp_synfin: number;
  ifi_tcp_badformatipsec: number;
  ifi_tcp_noconnnolist: number;
  ifi_tcp_noconnlist: number;
  ifi_tcp_listbadsyn: number;
  ifi_tcp_icmp6unreach: number;
  ifi_tcp_deprecate6: number;
  ifi_tcp_rstinsynrcv: number;
  ifi_tcp_ooopacket: number;
  ifi_tcp_dospacket: number;
  ifi_tcp_cleanup: number;
  ifi_tcp_synwindow: number;
  reserved: unknown /* const array */;
  ifi_udp_port_unreach: number;
  ifi_udp_faithprefix: number;
  ifi_udp_port0: number;
  ifi_udp_badlength: number;
  ifi_udp_badchksum: number;
  ifi_udp_badmcast: number;
  ifi_udp_cleanup: number;
  ifi_udp_badipsec: number;
  _reserved: unknown /* const array */;
}

declare class unmount_args {
  constructor(init?: unmount_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class IOAudioClientBufferExtendedInfo64 {
  constructor(init?: IOAudioClientBufferExtendedInfo64);
  mAudioClientBufferExtended32: IOAudioClientBufferExtendedInfo;
  mUnmappedParamBuffer64: number;
  mNextExtended64: interop.Pointer;
}

declare class OpaqueDTPropertyIterator {
  constructor(init?: OpaqueDTPropertyIterator);
  entry: interop.Pointer;
  currentProperty: interop.Pointer;
  currentIndex: number;
}

declare class ulock_wait_args {
  constructor(init?: ulock_wait_args);
  operation_l_: unknown /* const array */;
  operation: number;
  operation_r_: unknown /* const array */;
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
}

declare class OSAction_IOHIDDevice__CompleteReport_LocalIVars {
  constructor(init?: OSAction_IOHIDDevice__CompleteReport_LocalIVars);
}

declare class fsetattrlist_args {
  constructor(init?: fsetattrlist_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  attributeBuffer_l_: unknown /* const array */;
  attributeBuffer: number;
  attributeBuffer_r_: unknown /* const array */;
  bufferSize_l_: unknown /* const array */;
  bufferSize: number;
  bufferSize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class dyld_chained_starts_offsets {
  constructor(init?: dyld_chained_starts_offsets);
  pointer_format: number;
  starts_count: number;
  chain_starts: unknown /* const array */;
}

declare class nfsrvstats {
  constructor(init?: nfsrvstats);
  srvrpccntv3: unknown /* const array */;
  srvrpc_errs: number;
  srv_errs: number;
  srvcache_inproghits: number;
  srvcache_idemdonehits: number;
  srvcache_nonidemdonehits: number;
  srvcache_misses: number;
  srvvop_writes: number;
  nfs_errs: unnamed_17224357291029353072;
}

declare class kdebug_trace_string_args {
  constructor(init?: kdebug_trace_string_args);
  debugid_l_: unknown /* const array */;
  debugid: number;
  debugid_r_: unknown /* const array */;
  str_id_l_: unknown /* const array */;
  str_id: number;
  str_id_r_: unknown /* const array */;
  str_l_: unknown /* const array */;
  str: number;
  str_r_: unknown /* const array */;
}

declare class sadb_x_kmprivate {
  constructor(init?: sadb_x_kmprivate);
  sadb_x_kmprivate_len: number;
  sadb_x_kmprivate_exttype: number;
  sadb_x_kmprivate_reserved: number;
}

declare class unnamed_12832443407998816313 {
  constructor(init?: unnamed_12832443407998816313);
  revision: number;
  variant: number;
  se_imp: number;
  pcsr_imp: number;
  nsuhd_imp: number;
  version: number;
  ctx_cmps: number;
  brps: number;
  wrps: number;
}

declare class futimes_args {
  constructor(init?: futimes_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  tptr_l_: unknown /* const array */;
  tptr: number;
  tptr_r_: unknown /* const array */;
}

declare class if_order {
  constructor(init?: if_order);
  ifo_count: number;
  ifo_reserved: number;
  ifo_ordered_indices: number;
}

declare class cpuid_thermal_leaf_t {
  constructor(init?: cpuid_thermal_leaf_t);
  sensor: number;
  dynamic_acceleration: number;
  invariant_APIC_timer: number;
  core_power_limits: number;
  fine_grain_clock_mod: number;
  package_thermal_intr: number;
  thresholds: number;
  ACNT_MCNT: number;
  hardware_feedback: number;
  energy_policy: number;
}

declare class ip_px_smpx_s {
  constructor(init?: ip_px_smpx_s);
  array: interop.Pointer;
  data: interop.Pointer;
  datalen: number;
}

declare class __Request__mach_gss_unhold_cred_t {
  constructor(init?: __Request__mach_gss_unhold_cred_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  princ: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  mech: interop.Enum<typeof gssd_mechtype>;
  nt: interop.Enum<typeof gssd_nametype>;
  princCnt: number;
}

declare class unnamed_2926208425853325561 {
  constructor(init?: unnamed_2926208425853325561);
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
  reserved: number;
  classOfDevice: number;
  clockOffset: number;
  RSSIValue: number;
}

declare class EXDisplayPipeSecureTEStatus {
  constructor(init?: EXDisplayPipeSecureTEStatus);
  healthRecord: EXDisplayPipeHealthRecord;
  errorCount: number;
  lastErrorTimestamp: number;
  maxConsecutiveErrors: number;
  lastErrorVal: number;
  enabled: boolean;
  errorInfo: unknown /* const array */;
  errorInfoCount: number;
}

declare class posix_spawn_args {
  constructor(init?: posix_spawn_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  adesc_l_: unknown /* const array */;
  adesc: number;
  adesc_r_: unknown /* const array */;
  argv_l_: unknown /* const array */;
  argv: number;
  argv_r_: unknown /* const array */;
  envp_l_: unknown /* const array */;
  envp: number;
  envp_r_: unknown /* const array */;
}

declare class thread_selfid_args {
  constructor(init?: thread_selfid_args);
  dummy: number;
}

declare class memorystatus_available_memory_args {
  constructor(init?: memorystatus_available_memory_args);
  dummy: number;
}

declare class ntp_adjtime_args {
  constructor(init?: ntp_adjtime_args);
  tp_l_: unknown /* const array */;
  tp: number;
  tp_r_: unknown /* const array */;
}

declare class munlock_args {
  constructor(init?: munlock_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: number;
  len_l_: unknown /* const array */;
  len: number;
  len_r_: number;
}

declare class IOReportElementValues {
  constructor(init?: IOReportElementValues);
  v: unknown /* const array */;
}

declare class open_extended_args {
  constructor(init?: open_extended_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
}

declare class if_data_extended {
  constructor(init?: if_data_extended);
  ifi_alignerrs: number;
  ifi_dt_bytes: number;
  ifi_fpackets: number;
  ifi_fbytes: number;
  reserved: unknown /* const array */;
}

declare class user64_ntptimeval {
  constructor(init?: user64_ntptimeval);
  time: user64_timespec;
  maxerror: number;
  esterror: number;
  tai: number;
  time_state: number;
}

declare class _notifyMsg {
  constructor(init?: _notifyMsg);
  h: mach_msg_header_t;
}

declare class unnamed_3040559031347937496 {
  constructor(init?: unnamed_3040559031347937496);
  connectionHandle: number;
}

declare class fileport_makeport_args {
  constructor(init?: fileport_makeport_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  portnamep_l_: unknown /* const array */;
  portnamep: number;
  portnamep_r_: unknown /* const array */;
}

declare class pivot_root_args {
  constructor(init?: pivot_root_args);
  new_rootfs_path_before_l_: unknown /* const array */;
  new_rootfs_path_before: number;
  new_rootfs_path_before_r_: unknown /* const array */;
  old_rootfs_path_after_l_: unknown /* const array */;
  old_rootfs_path_after: number;
  old_rootfs_path_after_r_: unknown /* const array */;
}

declare class unnamed_15723698468431497349 {
  constructor(init?: unnamed_15723698468431497349);
  deviceAddress: BluetoothDeviceAddress;
  notificationType: number;
}

declare class fsgetpath_ext_args {
  constructor(init?: fsgetpath_ext_args);
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  fsid_l_: unknown /* const array */;
  fsid: number;
  fsid_r_: unknown /* const array */;
  objid_l_: unknown /* const array */;
  objid: number;
  objid_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class __Reply__lockd_shutdown_t {
  constructor(init?: __Reply__lockd_shutdown_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class seteuid_args {
  constructor(init?: seteuid_args);
  euid_l_: unknown /* const array */;
  euid: number;
  euid_r_: unknown /* const array */;
}

declare class __Request__mach_vm_remap_new_t {
  constructor(init?: __Request__mach_vm_remap_new_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  src_task: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  target_address: number;
  size: number;
  mask: number;
  flags: number;
  src_address: number;
  copy: number;
  cur_protection: number;
  max_protection: number;
  inheritance: number;
}

declare class guarded_writev_np_args {
  constructor(init?: guarded_writev_np_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
}

declare class oslog_coproc_reg_args {
  constructor(init?: oslog_coproc_reg_args);
  uuid_l_: unknown /* const array */;
  uuid: number;
  uuid_r_: unknown /* const array */;
  file_path_l_: unknown /* const array */;
  file_path: number;
  file_path_r_: unknown /* const array */;
  file_path_len_l_: unknown /* const array */;
  file_path_len: number;
  file_path_len_r_: unknown /* const array */;
}

declare class renameatx_np_args {
  constructor(init?: renameatx_np_args);
  fromfd_l_: unknown /* const array */;
  fromfd: number;
  fromfd_r_: unknown /* const array */;
  from_l_: unknown /* const array */;
  from: number;
  from_r_: unknown /* const array */;
  tofd_l_: unknown /* const array */;
  tofd: number;
  tofd_r_: unknown /* const array */;
  to_l_: unknown /* const array */;
  to: number;
  to_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class setregid_args {
  constructor(init?: setregid_args);
  rgid_l_: unknown /* const array */;
  rgid: number;
  rgid_r_: unknown /* const array */;
  egid_l_: unknown /* const array */;
  egid: number;
  egid_r_: unknown /* const array */;
}

declare class airship_acipc_cr_mirror_completion_record {
  constructor(init?: airship_acipc_cr_mirror_completion_record);
  desctype: number;
  tr_id: number;
  io_count: number;
  first_tag: number;
}

declare class priority_queue_sched_stable_min {
  constructor(init?: priority_queue_sched_stable_min);
  pq_root: interop.Pointer;
}

declare class code_desc {
  constructor(init?: code_desc);
  limit00: number;
  base00: number;
  base16: number;
  type: number;
  dpl: number;
  present: number;
  limit16: number;
  Lflag: number;
  opsz: number;
  granular: number;
  base24: number;
}

declare class __mac_execve_args {
  constructor(init?: __mac_execve_args);
  fname_l_: unknown /* const array */;
  fname: number;
  fname_r_: unknown /* const array */;
  argp_l_: unknown /* const array */;
  argp: number;
  argp_r_: unknown /* const array */;
  envp_l_: unknown /* const array */;
  envp: number;
  envp_r_: unknown /* const array */;
  mac_p_l_: unknown /* const array */;
  mac_p: number;
  mac_p_r_: unknown /* const array */;
}

declare class __Reply__mach_gss_accept_sec_context_t {
  constructor(init?: __Reply__mach_gss_accept_sec_context_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  key: mach_msg_ool_descriptor_t;
  outtoken: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  context: number;
  cred_handle: number;
  flags: number;
  uid: number;
  gidsCnt: number;
  gids: unknown /* const array */;
  keyCnt: number;
  outtokenCnt: number;
  major_stat: number;
  minor_stat: number;
}

declare class writev_args {
  constructor(init?: writev_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
}

declare class mount_args {
  constructor(init?: mount_args);
  type_l_: unknown /* const array */;
  type: number;
  type_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
}

declare class unnamed_895768521341818631 {
  constructor(init?: unnamed_895768521341818631);
  usage: number;
  reserved1: number;
  stringIndex: number;
  reserved2: number;
  designatorIndex: number;
  reserved3: number;
}

declare class hvg_hcall_args {
  constructor(init?: hvg_hcall_args);
  args: unknown /* const array */;
}

declare class mb_class_stat {
  constructor(init?: mb_class_stat);
  mbcl_cname: unknown /* const array */;
  mbcl_size: number;
  mbcl_total: number;
  mbcl_active: number;
  mbcl_infree: number;
  mbcl_slab_cnt: number;
  mbcl_pad: number;
  mbcl_alloc_cnt: number;
  mbcl_free_cnt: number;
  mbcl_notified: number;
  mbcl_purge_cnt: number;
  mbcl_fail_cnt: number;
  mbcl_ctotal: number;
  mbcl_release_cnt: number;
  mbcl_mc_state: number;
  mbcl_mc_cached: number;
  mbcl_mc_waiter_cnt: number;
  mbcl_mc_wretry_cnt: number;
  mbcl_mc_nwretry_cnt: number;
  mbcl_reserved: unknown /* const array */;
}

declare class _iopol_param_t {
  constructor(init?: _iopol_param_t);
  iop_scope: number;
  iop_iotype: number;
  iop_policy: number;
}

declare class IOReportInterestList {
  constructor(init?: IOReportInterestList);
  ninterests: number;
  interests: interop.Pointer;
}

declare class IOTVector {
  constructor(init?: IOTVector);
  pc: interop.Pointer;
  toc: number;
}

declare class IOBlockStorageWorkFlags {
  constructor(init?: IOBlockStorageWorkFlags);
  isRead: boolean;
  isLowPriority: boolean;
  ioSize: number;
}

declare class swapon_args {
  constructor(init?: swapon_args);
  dummy: number;
}

declare class ataTaskFile {
  constructor(init?: ataTaskFile);
  ataTFFeatures: number;
  ataTFCount: number;
  ataTFSector: number;
  ataTFCylLo: number;
  ataTFCylHigh: number;
  ataTFSDH: number;
  ataTFCommand: number;
}

declare class __Request__upl_abort_t {
  constructor(init?: __Request__upl_abort_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  abort_cond: number;
}

declare class IOAudioStreamFormatDesc {
  constructor(init?: IOAudioStreamFormatDesc);
}

declare class RAW_header {
  constructor(init?: RAW_header);
  version_no: number;
  thread_count: number;
  TOD_secs: number;
  TOD_usecs: number;
}

declare class _stickyKeys_ToggleInfo {
  constructor(init?: _stickyKeys_ToggleInfo);
  size: number;
  toggleModifier: number;
  repetitionsToToggle: number;
  expireInterval: UnsignedWide;
  currentCount: number;
  deadlines: unknown /* const array */;
}

declare class microstackshot_thread {
  constructor(init?: microstackshot_thread);
  msth_magic: number;
  msth_kern_frame_count: number;
  msth_user_frame_count: number;
  msth_wait_event: number;
  msth_continuation: number;
  msth_thread_id: number;
  msth_user_mach_time: number;
  msth_system_mach_time: number;
  msth_state: number;
  msth_base_priority: number;
  msth_sched_priority: number;
  msth_sched_flags: number;
  msth_stackshot_flags: number;
  msth_effective_qos: number;
  msth_requested_qos: number;
  msth_requested_qos_override: number;
  msth_io_tier: number;
  msth_reserved_c: number;
  msth_async_index: number;
  msth_fault_va: number;
  msth_reserved_fault1: number;
  msth_fault_type: number;
  msth_reserved_fault2: number;
  msth_fault_flags: number;
  msth_reserved_grab1: number;
  msth_grab_vm_tag: number;
  msth_grab_iopl_count: number;
  msth_grab_upl_count: number;
  msth_energy_nj: number;
  msth_reserved: unknown /* const array */;
  msth_name: unknown /* const array */;
}

declare class change_fdguard_np_args {
  constructor(init?: change_fdguard_np_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  guardflags_l_: unknown /* const array */;
  guardflags: number;
  guardflags_r_: unknown /* const array */;
  nguard_l_: unknown /* const array */;
  nguard: number;
  nguard_r_: unknown /* const array */;
  nguardflags_l_: unknown /* const array */;
  nguardflags: number;
  nguardflags_r_: unknown /* const array */;
  fdflagsp_l_: unknown /* const array */;
  fdflagsp: number;
  fdflagsp_r_: unknown /* const array */;
}

declare class mcc_ecc_event_t {
  constructor(init?: mcc_ecc_event_t);
  version: interop.Enum<typeof mcc_ecc_version_t>;
  flags: interop.Enum<typeof mcc_flags_t>;
  status: number;
  amcc: number;
  plane: number;
  bank: number;
  way: number;
  index: number;
  bit_off_cl: number;
  bit_off_within_hcl: number;
}

declare class setgid_args {
  constructor(init?: setgid_args);
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
}

declare class __Request__nspace_resolve_path_t {
  constructor(init?: __Request__nspace_resolve_path_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  req_id: number;
  pid: number;
  op: number;
  path: unknown /* const array */;
}

declare class ecc_event {
  constructor(init?: ecc_event);
  id: number;
  count: number;
  data: unknown /* const array */;
}

declare class setegid_args {
  constructor(init?: setegid_args);
  egid_l_: unknown /* const array */;
  egid: number;
  egid_r_: unknown /* const array */;
}

declare class OSAction_AFKUserDataPipe__HandleCommand_LocalIVars {
  constructor(init?: OSAction_AFKUserDataPipe__HandleCommand_LocalIVars);
}

declare class os_fault_with_payload_args {
  constructor(init?: os_fault_with_payload_args);
  reason_namespace_l_: unknown /* const array */;
  reason_namespace: number;
  reason_namespace_r_: unknown /* const array */;
  reason_code_l_: unknown /* const array */;
  reason_code: number;
  reason_code_r_: unknown /* const array */;
  payload_l_: unknown /* const array */;
  payload: number;
  payload_r_: unknown /* const array */;
  payload_size_l_: unknown /* const array */;
  payload_size: number;
  payload_size_r_: unknown /* const array */;
  reason_string_l_: unknown /* const array */;
  reason_string: number;
  reason_string_r_: unknown /* const array */;
  reason_flags_l_: unknown /* const array */;
  reason_flags: number;
  reason_flags_r_: unknown /* const array */;
}

declare class __Request__mach_vm_range_create_t {
  constructor(init?: __Request__mach_vm_range_create_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  flavor: interop.Enum<typeof mach_vm_range_flavor_t>;
  recipesCnt: number;
  recipes: unknown /* const array */;
}

declare class TransducerData {
  constructor(init?: TransducerData);
}

declare class ledger_template_info {
  constructor(init?: ledger_template_info);
  lti_name: unknown /* const array */;
  lti_group: unknown /* const array */;
  lti_units: unknown /* const array */;
}

declare class getuid_args {
  constructor(init?: getuid_args);
  dummy: number;
}

declare class do_notify_subsystem {
  constructor(init?: do_notify_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class dyld_chained_ptr_arm64e_shared_cache_rebase {
  constructor(init?: dyld_chained_ptr_arm64e_shared_cache_rebase);
  runtimeOffset: number;
  high8: number;
  unused: number;
  next: number;
  auth: number;
}

declare class unnamed_9814764806365556603 {
  constructor(init?: unnamed_9814764806365556603);
  errs_common: unknown /* const array */;
  errs_v4: unknown /* const array */;
  errs_unknown: number;
}

declare class rmdir_args {
  constructor(init?: rmdir_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class setxattr_args {
  constructor(init?: setxattr_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  attrname_l_: unknown /* const array */;
  attrname: number;
  attrname_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
  position_l_: unknown /* const array */;
  position: number;
  position_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class DeviceCapabilityDescriptor {
  constructor(init?: DeviceCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
}

declare class EFI_CONFIGURATION_TABLE_32 {
  constructor(init?: EFI_CONFIGURATION_TABLE_32);
  VendorGuid: EFI_GUID;
  VendorTable: number;
}

declare class kevent_id_args {
  constructor(init?: kevent_id_args);
  id_l_: unknown /* const array */;
  id: number;
  id_r_: unknown /* const array */;
  changelist_l_: unknown /* const array */;
  changelist: number;
  changelist_r_: unknown /* const array */;
  nchanges_l_: unknown /* const array */;
  nchanges: number;
  nchanges_r_: unknown /* const array */;
  eventlist_l_: unknown /* const array */;
  eventlist: number;
  eventlist_r_: unknown /* const array */;
  nevents_l_: unknown /* const array */;
  nevents: number;
  nevents_r_: unknown /* const array */;
  data_out_l_: unknown /* const array */;
  data_out: number;
  data_out_r_: unknown /* const array */;
  data_available_l_: unknown /* const array */;
  data_available: number;
  data_available_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class __disable_threadsignal_args {
  constructor(init?: __disable_threadsignal_args);
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
}

declare class IOKitDiagnosticsParameters {
  constructor(init?: IOKitDiagnosticsParameters);
  size: number;
  value: number;
  options: number;
  tag: number;
  zsize: number;
  reserved: unknown /* const array */;
}

declare class kevent_qos_args {
  constructor(init?: kevent_qos_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  changelist_l_: unknown /* const array */;
  changelist: number;
  changelist_r_: unknown /* const array */;
  nchanges_l_: unknown /* const array */;
  nchanges: number;
  nchanges_r_: unknown /* const array */;
  eventlist_l_: unknown /* const array */;
  eventlist: number;
  eventlist_r_: unknown /* const array */;
  nevents_l_: unknown /* const array */;
  nevents: number;
  nevents_r_: unknown /* const array */;
  data_out_l_: unknown /* const array */;
  data_out: number;
  data_out_r_: unknown /* const array */;
  data_available_l_: unknown /* const array */;
  data_available: number;
  data_available_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class __Request__exception_raise_state_identity_t {
  constructor(init?: __Request__exception_raise_state_identity_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  thread: mach_msg_port_descriptor_t;
  task: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  exception: number;
  codeCnt: number;
  code: unknown /* const array */;
  flavor: number;
  old_stateCnt: number;
  old_state: unknown /* const array */;
}

declare class __Request__mach_voucher_debug_info_t {
  constructor(init?: __Request__mach_voucher_debug_info_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  voucher_name: number;
  recipesCnt: number;
}

declare class DTMemoryMapRange {
  constructor(init?: DTMemoryMapRange);
  paddr: number;
  length: number;
}

declare class __Reply__nspace_resolve_cancel_t {
  constructor(init?: __Reply__nspace_resolve_cancel_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class unnamed_14099649334180452822 {
  constructor(init?: unnamed_14099649334180452822);
  seqNum: bigint;
  dataSize: bigint;
  generation: bigint;
  _reserved: bigint;
  wrStatus: bigint;
}

declare class sembuf {
  constructor(init?: sembuf);
  sem_num: number;
  sem_op: number;
  sem_flg: number;
}

declare class unlinkat_args {
  constructor(init?: unlinkat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class aio_read_args {
  constructor(init?: aio_read_args);
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class __Reply__mach_voucher_attr_control_get_values_t {
  constructor(init?: __Reply__mach_voucher_attr_control_get_values_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  value_handlesCnt: number;
  value_handles: unknown /* const array */;
}

declare class ifs_iso_8802_3 {
  constructor(init?: ifs_iso_8802_3);
  dot3StatsAlignmentErrors: number;
  dot3StatsFCSErrors: number;
  dot3StatsSingleCollisionFrames: number;
  dot3StatsMultipleCollisionFrames: number;
  dot3StatsSQETestErrors: number;
  dot3StatsDeferredTransmissions: number;
  dot3StatsLateCollisions: number;
  dot3StatsExcessiveCollisions: number;
  dot3StatsInternalMacTransmitErrors: number;
  dot3StatsCarrierSenseErrors: number;
  dot3StatsFrameTooLongs: number;
  dot3StatsInternalMacReceiveErrors: number;
  dot3StatsEtherChipSet: number;
  dot3StatsMissedFrames: number;
  dot3StatsCollFrequencies: unknown /* const array */;
  dot3Compliance: number;
}

declare class __lck_attr__ {
  constructor(init?: __lck_attr__);
}

declare class rtstat_64 {
  constructor(init?: rtstat_64);
  rts_badredirect: number;
  rts_dynamic: number;
  rts_newgateway: number;
  rts_unreach: number;
  rts_wildcard: number;
  rts_badrtgwroute: number;
}

declare class sockaddr_inifscope {
  constructor(init?: sockaddr_inifscope);
  sin_len: number;
  sin_family: number;
  sin_port: number;
  sin_addr: in_addr;
  un: unnamed_15139511001915224071;
}

declare class IOStateReportInfo {
  constructor(init?: IOStateReportInfo);
  curr_state: number;
  update_ts: number;
  elem: interop.Pointer;
}

declare class KeyAttribute {
  constructor(init?: KeyAttribute);
  _flags: number;
  KeyAttribute: (p1: number) => number | null;
}

declare class sflt_filter {
  constructor(init?: sflt_filter);
  sf_handle: number;
  sf_flags: number;
  sf_name: string | null;
  sf_unregistered: (p1: number) => void | null;
  sf_attach: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  sf_detach: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  sf_notify: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  sf_getpeername: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  sf_getsockname: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  sf_data_in: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: number) => number | null;
  sf_data_out: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: number) => number | null;
  sf_connect_in: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  sf_connect_out: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  sf_bind: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  sf_setoption: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  sf_getoption: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  sf_listen: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  sf_ioctl: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string) => number | null;
  sf_ext: sflt_filter_ext;
}

declare class _IORecursiveLock {
  constructor(init?: _IORecursiveLock);
}

declare class IOWorkGroup_IVars {
  constructor(init?: IOWorkGroup_IVars);
}

declare class rr_pco_use {
  constructor(init?: rr_pco_use);
  rpu_uselen: number;
  rpu_keeplen: number;
  rpu_ramask: number;
  rpu_raflags: number;
  rpu_vltime: number;
  rpu_pltime: number;
  rpu_flags: number;
  rpu_prefix: in6_addr;
}

declare class access_args {
  constructor(init?: access_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class rip6stat {
  constructor(init?: rip6stat);
  rip6s_ipackets: number;
  rip6s_isum: number;
  rip6s_badsum: number;
  rip6s_nosock: number;
  rip6s_nosockmcast: number;
  rip6s_fullsock: number;
  rip6s_opackets: number;
}

declare class __Request__mach_gss_accept_sec_context_v2_t {
  constructor(init?: __Request__mach_gss_accept_sec_context_v2_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  intoken: mach_msg_ool_descriptor_t;
  svc_princ: mach_msg_ool_descriptor_t;
  NDR: NDR_record_t;
  intokenCnt: number;
  svc_nt: interop.Enum<typeof gssd_nametype>;
  svc_princCnt: number;
  gssd_flags: number;
  context: number;
  cred_handle: number;
}

declare class msgmap {
  constructor(init?: msgmap);
  next: number;
}

declare class unnamed_3532538575358090565 {
  constructor(init?: unnamed_3532538575358090565);
  login: interop.Pointer;
  generation: number;
  status: number;
  loginResponse: interop.Pointer;
  statusBlock: interop.Pointer;
  statusBlockLength: number;
}

declare class ml_processor_info {
  constructor(init?: ml_processor_info);
  cpu_id: interop.Pointer;
  start_paddr: number;
  supports_nap: number;
  platform_cache_dispatch: interop.Pointer;
  time_base_enable: (p1: interop.PointerConvertible, p2: number) => void | null;
  processor_idle: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  idle_tickle: interop.Pointer;
  idle_timer: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  idle_timer_refcon: interop.Pointer;
  powergate_stub_addr: number;
  powergate_stub_length: number;
  powergate_latency: number;
  platform_error_handler: (p1: interop.PointerConvertible, p2: number) => void | null;
  regmap_paddr: number;
  phys_id: number;
  log_id: number;
  l2_access_penalty: number;
  cluster_id: number;
  cluster_type: interop.Enum<typeof cluster_type_t>;
  l2_cache_id: number;
  l2_cache_size: number;
  l3_cache_id: number;
  l3_cache_size: number;
}

declare class __Reply__mach_vm_deallocate_t {
  constructor(init?: __Reply__mach_vm_deallocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class sadb_prop {
  constructor(init?: sadb_prop);
  sadb_prop_len: number;
  sadb_prop_exttype: number;
  sadb_prop_replay: number;
  sadb_prop_reserved: unknown /* const array */;
}

declare class utun_stats_param {
  constructor(init?: utun_stats_param);
  utsp_packets: number;
  utsp_bytes: number;
  utsp_errors: number;
}

declare class __Reply__ktrace_background_available_t {
  constructor(init?: __Reply__ktrace_background_available_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__mach_vm_inherit_t {
  constructor(init?: __Request__mach_vm_inherit_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  new_inheritance: number;
}

declare class __semwait_signal_args {
  constructor(init?: __semwait_signal_args);
  cond_sem_l_: unknown /* const array */;
  cond_sem: number;
  cond_sem_r_: unknown /* const array */;
  mutex_sem_l_: unknown /* const array */;
  mutex_sem: number;
  mutex_sem_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
  relative_l_: unknown /* const array */;
  relative: number;
  relative_r_: unknown /* const array */;
  tv_sec_l_: unknown /* const array */;
  tv_sec: number;
  tv_sec_r_: unknown /* const array */;
  tv_nsec_l_: unknown /* const array */;
  tv_nsec: number;
  tv_nsec_r_: unknown /* const array */;
}

declare class proc_persona_info {
  constructor(init?: proc_persona_info);
  unique_pid: number;
  pid: number;
  flags: number;
  pidversion: number;
  persona_id: number;
  uid: number;
  gid: number;
  macho_uuid: unknown /* const array */;
}

declare class if_netif_stats {
  constructor(init?: if_netif_stats);
  ifn_rx_mit_interval: number;
  ifn_rx_mit_mode: number;
  ifn_rx_mit_packets_avg: number;
  ifn_rx_mit_packets_min: number;
  ifn_rx_mit_packets_max: number;
  ifn_rx_mit_bytes_avg: number;
  ifn_rx_mit_bytes_min: number;
  ifn_rx_mit_bytes_max: number;
  ifn_rx_mit_cfg_idx: number;
  ifn_rx_mit_cfg_packets_lowat: number;
  ifn_rx_mit_cfg_packets_hiwat: number;
  ifn_rx_mit_cfg_bytes_lowat: number;
  ifn_rx_mit_cfg_bytes_hiwat: number;
  ifn_rx_mit_cfg_interval: number;
}

declare class panic_info_tracker_t {
  constructor(init?: panic_info_tracker_t);
  pit_magic_version: number;
  pit_timing_offset: number;
  pit_coproc_status_offset: number;
  pit_coproc_count: number;
}

declare class IOExternalMethodArguments {
  constructor(init?: IOExternalMethodArguments);
  version: number;
  selector: number;
  asyncWakePort: number;
  asyncReference: interop.Pointer;
  asyncReferenceCount: number;
  scalarInput: interop.Pointer;
  scalarInputCount: number;
  structureInput: interop.Pointer;
  structureInputSize: number;
  structureInputDescriptor: interop.Pointer;
  scalarOutput: interop.Pointer;
  scalarOutputCount: number;
  structureOutput: interop.Pointer;
  structureOutputSize: number;
  structureOutputDescriptor: interop.Pointer;
  structureOutputDescriptorSize: number;
  __reservedA: number;
  structureVariableOutputData: interop.Pointer;
  __reserved: unknown /* const array */;
}

declare class kev_mptcp_data {
  constructor(init?: kev_mptcp_data);
  value: number;
}

declare class ifmibdata {
  constructor(init?: ifmibdata);
  ifmd_name: unknown /* const array */;
  ifmd_pcount: number;
  ifmd_flags: number;
  ifmd_snd_len: number;
  ifmd_snd_maxlen: number;
  ifmd_snd_drops: number;
  ifmd_filler: unknown /* const array */;
  ifmd_data: if_data64;
}

declare class _AVCConnectTargetPlugsInParams {
  constructor(init?: _AVCConnectTargetPlugsInParams);
  sourceSubunitTypeAndID: number;
  sourcePlugType: interop.Enum<typeof IOFWAVCPlugTypes>;
  sourcePlugNum: number;
  destSubunitTypeAndID: number;
  destPlugType: interop.Enum<typeof IOFWAVCPlugTypes>;
  destPlugNum: number;
  lockConnection: number;
  permConnection: number;
}

declare class EndpointDescriptor {
  constructor(init?: EndpointDescriptor);
  bLength: number;
  bDescriptorType: number;
  bEndpointAddress: number;
  bmAttributes: number;
  wMaxPacketSize: number;
  bInterval: number;
}

declare class USB20ExtensionCapabilityDescriptor {
  constructor(init?: USB20ExtensionCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
  bmAttributes: number;
}

declare class ip6_opt_nsap {
  constructor(init?: ip6_opt_nsap);
  ip6on_type: number;
  ip6on_len: number;
  ip6on_src_nsap_len: number;
  ip6on_dst_nsap_len: number;
}

declare class frmrinfo {
  constructor(init?: frmrinfo);
  frmr_rej_pdu0: number;
  frmr_rej_pdu1: number;
  frmr_control: number;
  frmr_control_ext: number;
  frmr_cause: number;
}

declare class bsdthread_register_args {
  constructor(init?: bsdthread_register_args);
  threadstart_l_: unknown /* const array */;
  threadstart: number;
  threadstart_r_: unknown /* const array */;
  wqthread_l_: unknown /* const array */;
  wqthread: number;
  wqthread_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
  stack_addr_hint_l_: unknown /* const array */;
  stack_addr_hint: number;
  stack_addr_hint_r_: unknown /* const array */;
  targetconc_ptr_l_: unknown /* const array */;
  targetconc_ptr: number;
  targetconc_ptr_r_: unknown /* const array */;
  dispatchqueue_offset_l_: unknown /* const array */;
  dispatchqueue_offset: number;
  dispatchqueue_offset_r_: unknown /* const array */;
  tsd_offset_l_: unknown /* const array */;
  tsd_offset: number;
  tsd_offset_r_: unknown /* const array */;
}

declare class unnamed_16484138568302824955 {
  constructor(init?: unnamed_16484138568302824955);
  connectionHandle: number;
  connInterval: number;
  connLatency: number;
  supervisionTimeout: number;
}

declare class nd_neighbor_solicit {
  constructor(init?: nd_neighbor_solicit);
  nd_ns_hdr: icmp6_hdr;
  nd_ns_target: in6_addr;
}

declare class unnamed_13783761404601817890 {
  constructor(init?: unnamed_13783761404601817890);
  transmitBandwidth: number;
  receiveBandwidth: number;
  transmitCodingFormat: number;
  receiveCodingFormat: number;
  transmitCodecFrameSize: number;
  receiveCodecFrameSize: number;
  inputBandwidth: number;
  outputBandwidth: number;
  inputCodingFormat: number;
  outputCodingFormat: number;
  inputCodedDataSize: number;
  outputCodedDataSize: number;
  inputPCMDataFormat: number;
  outputPCMDataFormat: number;
  inputPCMSamplePayloadMSBPosition: number;
  outputPCMSamplePayloadMSBPosition: number;
  inputDataPath: number;
  outputDataPath: number;
  inputTransportUnitSize: number;
  outputTransportUnitSize: number;
  maxLatency: number;
  packetType: number;
  retransmissionEffort: number;
}

declare class i386_cpu_info {
  constructor(init?: i386_cpu_info);
  cpuid_vendor: unknown /* const array */;
  cpuid_brand_string: unknown /* const array */;
  cpuid_model_string: string | null;
  cpuid_type: number;
  cpuid_family: number;
  cpuid_model: number;
  cpuid_extmodel: number;
  cpuid_extfamily: number;
  cpuid_stepping: number;
  cpuid_features: number;
  cpuid_extfeatures: number;
  cpuid_signature: number;
  cpuid_brand: number;
  cpuid_processor_flag: number;
  cache_size: unknown /* const array */;
  cache_linesize: number;
  cache_info: unknown /* const array */;
  cpuid_cores_per_package: number;
  cpuid_logical_per_package: number;
  cache_sharing: unknown /* const array */;
  cache_partitions: unknown /* const array */;
  cpuid_cpu_type: number;
  cpuid_cpu_subtype: number;
  cpuid_mwait_leaf: cpuid_mwait_leaf_t;
  cpuid_thermal_leaf: cpuid_thermal_leaf_t;
  cpuid_arch_perf_leaf: cpuid_arch_perf_leaf_t;
  unused: unknown /* const array */;
  cpuid_cache_linesize: number;
  cpuid_cache_L2_associativity: number;
  cpuid_cache_size: number;
  cpuid_address_bits_physical: number;
  cpuid_address_bits_virtual: number;
  cpuid_microcode_version: number;
  cpuid_tlb: unknown /* const array */;
  cpuid_stlb: number;
  core_count: number;
  thread_count: number;
  cpuid_max_basic: number;
  cpuid_max_ext: number;
  cpuid_cpufamily: number;
  cpuid_mwait_leafp: interop.Pointer;
  cpuid_thermal_leafp: interop.Pointer;
  cpuid_arch_perf_leafp: interop.Pointer;
  cpuid_xsave_leafp: interop.Pointer;
  cpuid_leaf7_features: number;
  cpuid_leaf7_extfeatures: number;
  cpuid_tsc_leaf: cpuid_tsc_leaf_t;
  cpuid_xsave_leaf: unknown /* const array */;
}

declare class __Request__audit_triggers_t {
  constructor(init?: __Request__audit_triggers_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  flags: number;
}

declare class __Reply__telemetry_notification_t {
  constructor(init?: __Reply__telemetry_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class __Request__clock_get_time_t {
  constructor(init?: __Request__clock_get_time_t);
  Head: mach_msg_header_t;
}

declare class __Request__mach_vm_allocate_t {
  constructor(init?: __Request__mach_vm_allocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  flags: number;
}

declare class nfs_export_stat_rec {
  constructor(init?: nfs_export_stat_rec);
  path: unknown /* const array */;
  ops: number;
  bytes_read: number;
  bytes_written: number;
}

declare class __Reply__nspace_resolve_path_t {
  constructor(init?: __Reply__nspace_resolve_path_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  resolve_error: number;
}

declare class getxattr_args {
  constructor(init?: getxattr_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  attrname_l_: unknown /* const array */;
  attrname: number;
  attrname_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
  position_l_: unknown /* const array */;
  position: number;
  position_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class IOHistogramReportValues {
  constructor(init?: IOHistogramReportValues);
  bucket_hits: number;
  bucket_min: number;
  bucket_max: number;
  bucket_sum: number;
}

declare class ip6_rthdr0 {
  constructor(init?: ip6_rthdr0);
  ip6r0_nxt: number;
  ip6r0_len: number;
  ip6r0_type: number;
  ip6r0_segleft: number;
  ip6r0_reserved: number;
}

declare class __mac_getfsstat_args {
  constructor(init?: __mac_getfsstat_args);
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  mac_l_: unknown /* const array */;
  mac: number;
  mac_r_: unknown /* const array */;
  macsize_l_: unknown /* const array */;
  macsize: number;
  macsize_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class unnamed_1550632795945756785 {
  constructor(init?: unnamed_1550632795945756785);
  hash: BluetoothHCISimplePairingOOBData;
  randomizer: BluetoothHCISimplePairingOOBData;
}

declare class nd_router_advert {
  constructor(init?: nd_router_advert);
  nd_ra_hdr: icmp6_hdr;
  nd_ra_reachable: number;
  nd_ra_retransmit: number;
}

declare class user_nfs_export_args {
  constructor(init?: user_nfs_export_args);
  nxa_fsid: number;
  nxa_expid: number;
  nxa_fspath: number;
  nxa_exppath: number;
  nxa_flags: number;
  nxa_netcount: number;
  nxa_nets: number;
}

declare class xtcpcb {
  constructor(init?: xtcpcb);
  xt_len: number;
  xt_inp: inpcb;
  xt_tp: tcpcb;
  xt_socket: xsocket;
  xt_alignment_hack: number;
}

declare class embedded_panic_header {
  constructor(init?: embedded_panic_header);
  eph_magic: number;
  eph_crc: number;
  eph_version: number;
  eph_panic_flags: interop.Enum<typeof eph_panic_flags_t>;
  eph_panic_log_offset: number;
  eph_panic_log_len: number;
  eph_stackshot_offset: number;
  eph_stackshot_len: number;
  eph_other_log_offset: number;
  eph_other_log_len: number;
  eph_os_version: unknown /* const array */;
  eph_macos_version: unknown /* const array */;
  eph_bootsessionuuid_string: unknown /* const array */;
  eph_roots_installed: number;
  eph_ext_paniclog_offset: number;
  eph_ext_paniclog_len: number;
  eph_panic_initiator_offset: number;
  eph_panic_initiator_len: number;
  eph_soc_id: number;
  eph_soc_rev: number;
  eph_product: unknown /* const array */;
  eph_kernel_version: unknown /* const array */;
  eph_platformECID: number;
  eph_time_secs: number;
  eph_time_usecs: number;
  eph_device_target_type: unknown /* const array */;
  eph_device_model_type: unknown /* const array */;
  eph_panic_info_tracker: panic_info_tracker_t;
}

declare class fsetxattr_args {
  constructor(init?: fsetxattr_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  attrname_l_: unknown /* const array */;
  attrname: number;
  attrname_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
  position_l_: unknown /* const array */;
  position: number;
  position_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class micro_snapshot {
  constructor(init?: micro_snapshot);
  snapshot_magic: number;
  ms_cpu: number;
  ms_time: number;
  ms_time_microsecs: number;
  ms_flags: number;
  ms_opaque_flags: number;
}

declare class unnamed_10374063414335218371 {
  constructor(init?: unnamed_10374063414335218371);
  connectionHandle: number;
  deviceAddress: BluetoothDeviceAddress;
  linkType: number;
  encryptionMode: number;
}

declare class csops_args {
  constructor(init?: csops_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  ops_l_: unknown /* const array */;
  ops: number;
  ops_r_: unknown /* const array */;
  useraddr_l_: unknown /* const array */;
  useraddr: number;
  useraddr_r_: unknown /* const array */;
  usersize_l_: unknown /* const array */;
  usersize: number;
  usersize_r_: unknown /* const array */;
}

declare class undelete_args {
  constructor(init?: undelete_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class data_desc {
  constructor(init?: data_desc);
  limit00: number;
  base00: number;
  base16: number;
  type: number;
  dpl: number;
  present: number;
  limit16: number;
  stksz: number;
  granular: number;
  base24: number;
}

declare class nd_neighbor_advert {
  constructor(init?: nd_neighbor_advert);
  nd_na_hdr: icmp6_hdr;
  nd_na_target: in6_addr;
}

declare class ip6_opt_router {
  constructor(init?: ip6_opt_router);
  ip6or_type: number;
  ip6or_len: number;
  ip6or_value: unknown /* const array */;
}

declare class reg_desc {
  constructor(init?: reg_desc);
  rd_mask: number;
  rd_shift: number;
  rd_name: string | null;
  rd_format: string | null;
  rd_values: interop.Pointer;
}

declare class getsid_args {
  constructor(init?: getsid_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
}

declare class sptm_disjoint_op_t {
  constructor(init?: sptm_disjoint_op_t);
  root_pt_paddr: number;
  vaddr: number;
  pte_template: number;
}

declare class arm_saved_state {
  constructor(init?: arm_saved_state);
}

declare class __Request__mach_vm_machine_attribute_t {
  constructor(init?: __Request__mach_vm_machine_attribute_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
  attribute: number;
  value: number;
}

declare class kdebug_typefilter_args {
  constructor(init?: kdebug_typefilter_args);
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: unknown /* const array */;
  size_l_: unknown /* const array */;
  size: number;
  size_r_: unknown /* const array */;
}

declare class sockaddr_ndrv {
  constructor(init?: sockaddr_ndrv);
  snd_len: number;
  snd_family: number;
  snd_name: unknown /* const array */;
}

declare class __darwin_ucontext64 {
  constructor(init?: __darwin_ucontext64);
  uc_onstack: number;
  uc_sigmask: number;
  uc_stack: __darwin_sigaltstack;
  uc_link: interop.Pointer;
  uc_mcsize: number;
  uc_mcontext64: interop.Pointer;
}

declare class workq_open_args {
  constructor(init?: workq_open_args);
  dummy: number;
}

declare class fremovexattr_args {
  constructor(init?: fremovexattr_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  attrname_l_: unknown /* const array */;
  attrname: number;
  attrname_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class IOReportInterest {
  constructor(init?: IOReportInterest);
  provider_id: number;
  channel: IOReportChannel;
}

declare class icmp6errstat {
  constructor(init?: icmp6errstat);
  icp6errs_dst_unreach_noroute: number;
  icp6errs_dst_unreach_admin: number;
  icp6errs_dst_unreach_beyondscope: number;
  icp6errs_dst_unreach_addr: number;
  icp6errs_dst_unreach_noport: number;
  icp6errs_packet_too_big: number;
  icp6errs_time_exceed_transit: number;
  icp6errs_time_exceed_reassembly: number;
  icp6errs_paramprob_header: number;
  icp6errs_paramprob_nextheader: number;
  icp6errs_paramprob_option: number;
  icp6errs_redirect: number;
  icp6errs_unknown: number;
}

declare class BillboardAltModeCapability {
  constructor(init?: BillboardAltModeCapability);
  wSVID: number;
  bAlternateMode: number;
  iAlternateModeString: number;
}

declare class __Reply__mach_vm_page_info_t {
  constructor(init?: __Reply__mach_vm_page_info_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  infoCnt: number;
  info: unknown /* const array */;
}

declare class airship_daleipc_downlink_packet_completion {
  constructor(init?: airship_daleipc_downlink_packet_completion);
  tag: number;
  data_length: number;
  data_offset: number;
  channel_id: number;
  checksum: number;
  protocol: number;
  drop: number;
  ignore: number;
  error: number;
  wake_packet: number;
}

declare class sptm_trace_buffer_t {
  constructor(init?: sptm_trace_buffer_t);
  write_index: number;
  buffer: unknown /* const array */;
}

declare class if_description {
  constructor(init?: if_description);
  ifd_maxlen: number;
  ifd_len: number;
  ifd_desc: interop.Pointer;
}

declare class vnode_attr {
  constructor(init?: vnode_attr);
}

declare class __Reply__mach_voucher_attr_control_create_mach_voucher_t {
  constructor(init?: __Reply__mach_voucher_attr_control_create_mach_voucher_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  voucher: mach_msg_port_descriptor_t;
}

declare class __Reply__mach_voucher_extract_attr_recipe_t {
  constructor(init?: __Reply__mach_voucher_extract_attr_recipe_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  recipeCnt: number;
  recipe: unknown /* const array */;
}

declare class cpc_deadlines {
  constructor(init?: cpc_deadlines);
}

declare class IOACPIAddressSpaceDescriptor {
  constructor(init?: IOACPIAddressSpaceDescriptor);
  resourceType: number;
  generalFlags: number;
  typeSpecificFlags: number;
  reserved1: number;
  granularity: number;
  minAddressRange: number;
  maxAddressRange: number;
  translationOffset: number;
  addressLength: number;
  reserved2: number;
  reserved3: number;
  reserved4: number;
}

declare class sem_open_args {
  constructor(init?: sem_open_args);
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
  oflag_l_: unknown /* const array */;
  oflag: number;
  oflag_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  value_l_: unknown /* const array */;
  value: number;
  value_r_: unknown /* const array */;
}

declare class msg {
  constructor(init?: msg);
  msg_next: interop.Pointer;
  msg_type: number;
  msg_ts: number;
  msg_spot: number;
  label: interop.Pointer;
}

declare class ipsec_offload_selector {
  constructor(init?: ipsec_offload_selector);
  sel_ip_version: interop.Enum<typeof ipsec_offload_ip_version>;
  sel_src: unknown /* const array */;
  sel_dst: unknown /* const array */;
  sel_src_prefix: number;
  sel_dst_prefix: number;
  sel_transport: interop.Enum<typeof ipsec_offload_transport>;
  sel_src_port: number;
  sel_dst_port: number;
}

declare class sadb_x_sa2 {
  constructor(init?: sadb_x_sa2);
  sadb_x_sa2_len: number;
  sadb_x_sa2_exttype: number;
  sadb_x_sa2_mode: number;
  sadb_x_sa2_sequence: number;
  sadb_x_sa2_reqid: number;
}

declare class image_params {
  constructor(init?: image_params);
  ip_user_fname: number;
  ip_user_argv: number;
  ip_user_envv: number;
  ip_seg: number;
  ip_vp: interop.Pointer;
  ip_vattr: interop.Pointer;
  ip_origvattr: interop.Pointer;
  ip_origcputype: number;
  ip_origcpusubtype: number;
  ip_vdata: string | null;
  ip_flags: number;
  ip_argc: number;
  ip_envc: number;
  ip_applec: number;
  ip_startargv: string | null;
  ip_endargv: string | null;
  ip_endenvv: string | null;
  ip_strings: string | null;
  ip_strendp: string | null;
  ip_subsystem_root_path: string | null;
  ip_argspace: number;
  ip_strspace: number;
  ip_arch_offset: number;
  ip_arch_size: number;
  ip_interp_buffer: unknown /* const array */;
  ip_interp_sugid_fd: number;
  ip_vfs_context: interop.Pointer;
  ip_ndp: interop.Pointer;
  ip_new_thread: number;
  ip_execlabelp: interop.Pointer;
  ip_scriptlabelp: interop.Pointer;
  ip_scriptvp: interop.Pointer;
  ip_csflags: number;
  ip_mac_return: number;
  ip_px_sa: interop.Pointer;
  ip_px_sfa: interop.Pointer;
  ip_px_spa: interop.Pointer;
  ip_free_map: number;
  ip_px_smpx: ip_px_smpx_s;
  ip_px_persona: interop.Pointer;
  ip_px_pcred_info: interop.Pointer;
  ip_cs_error: interop.Pointer;
  ip_inherited_shared_region_id: string | null;
  ip_shared_region_namespace: number;
  ip_shared_region_loc: number;
  ip_shared_region_stubs: number;
  ip_dyld_fsid: number;
  ip_dyld_fsobjid: number;
  ip_inherited_jop_pid: number;
  ip_flags2: number;
}

declare class __Request__mach_notify_send_once_t {
  constructor(init?: __Request__mach_notify_send_once_t);
  Head: mach_msg_header_t;
}

declare class shared_region_map_and_slide_2_np_args {
  constructor(init?: shared_region_map_and_slide_2_np_args);
  files_count_l_: unknown /* const array */;
  files_count: number;
  files_count_r_: unknown /* const array */;
  files_l_: unknown /* const array */;
  files: number;
  files_r_: unknown /* const array */;
  mappings_count_l_: unknown /* const array */;
  mappings_count: number;
  mappings_count_r_: unknown /* const array */;
  mappings_u_l_: unknown /* const array */;
  mappings_u: number;
  mappings_u_r_: unknown /* const array */;
}

declare class pwrite_nocancel_args {
  constructor(init?: pwrite_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  nbyte_l_: unknown /* const array */;
  nbyte: number;
  nbyte_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class ih_pmtu {
  constructor(init?: ih_pmtu);
  ipm_void: number;
  ipm_nextmtu: number;
}

declare class fchdir_args {
  constructor(init?: fchdir_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class IOUSBHostIsochronousTransactionCompletion {
  constructor(init?: IOUSBHostIsochronousTransactionCompletion);
  owner: interop.Pointer;
  action: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  parameter: interop.Pointer;
}

declare class issetugid_args {
  constructor(init?: issetugid_args);
  dummy: number;
}

declare class DeviceRequest {
  constructor(init?: DeviceRequest);
  bmRequestType: number;
  bRequest: number;
  wValue: number;
  wIndex: number;
  wLength: number;
}

declare class static_if_key {
  constructor(init?: static_if_key);
  sik_enable_count: number;
  sik_init_value: boolean;
  sik_modified: boolean;
  sik_entries_count: number;
  sik_entries_head: interop.Pointer;
  sik_modified_next: interop.Pointer;
}

declare class BOSDescriptor {
  constructor(init?: BOSDescriptor);
  bLength: number;
  bDescriptorType: number;
  wTotalLength: number;
  bNumDeviceCaps: number;
}

declare class IOEventLink_IVars {
  constructor(init?: IOEventLink_IVars);
}

declare class if_linkheuristics {
  constructor(init?: if_linkheuristics);
  iflh_link_heuristics_cnt: number;
  iflh_link_heuristics_time: number;
  iflh_congested_link_cnt: number;
  iflh_congested_link_time: number;
  iflh_lqm_good_cnt: number;
  iflh_lqm_good_time: number;
  iflh_lqm_poor_cnt: number;
  iflh_lqm_poor_time: number;
  iflh_lqm_min_viable_cnt: number;
  iflh_lqm_min_viable_time: number;
  iflh_lqm_bad_cnt: number;
  iflh_lqm_bad_time: number;
  iflh_tcp_linkheur_stealthdrop: number;
  iflh_tcp_linkheur_noackpri: number;
  iflh_tcp_linkheur_comprxmt: number;
  iflh_tcp_linkheur_synrxmt: number;
  iflh_tcp_linkheur_rxmtfloor: number;
  iflh_udp_linkheur_stealthdrop: number;
}

declare class fs_snapshot_args {
  constructor(init?: fs_snapshot_args);
  op_l_: unknown /* const array */;
  op: number;
  op_r_: unknown /* const array */;
  dirfd_l_: unknown /* const array */;
  dirfd: number;
  dirfd_r_: unknown /* const array */;
  name1_l_: unknown /* const array */;
  name1: number;
  name1_r_: unknown /* const array */;
  name2_l_: unknown /* const array */;
  name2: number;
  name2_r_: unknown /* const array */;
  data_l_: unknown /* const array */;
  data: number;
  data_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class oslog_coproc_args {
  constructor(init?: oslog_coproc_args);
  buff_l_: unknown /* const array */;
  buff: number;
  buff_r_: unknown /* const array */;
  buff_len_l_: unknown /* const array */;
  buff_len: number;
  buff_len_r_: unknown /* const array */;
  type_l_: unknown /* const array */;
  type: number;
  type_r_: unknown /* const array */;
  uuid_l_: unknown /* const array */;
  uuid: number;
  uuid_r_: unknown /* const array */;
  timestamp_l_: unknown /* const array */;
  timestamp: number;
  timestamp_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
  stream_log_l_: unknown /* const array */;
  stream_log: number;
  stream_log_r_: unknown /* const array */;
}

declare class __semid_ds_new {
  constructor(init?: __semid_ds_new);
  sem_perm: ipc_perm;
  sem_base: number;
  sem_nsems: number;
  sem_otime: number;
  sem_pad1: number;
  sem_ctime: number;
  sem_pad2: number;
  sem_pad3: unknown /* const array */;
}

declare class AFKUserDataPipe_LocalIVars {
  constructor(init?: AFKUserDataPipe_LocalIVars);
}

declare class nfserr_info {
  constructor(init?: nfserr_info);
  nei_name: string | null;
  nei_error: number;
  nei_index: number;
}

declare class kill_args {
  constructor(init?: kill_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  signum_l_: unknown /* const array */;
  signum: number;
  signum_r_: unknown /* const array */;
  posix_l_: unknown /* const array */;
  posix: number;
  posix_r_: unknown /* const array */;
}

declare class IOUSBHostDevice_IVars {
  constructor(init?: IOUSBHostDevice_IVars);
}

declare class __Reply__vfs_resolve_dir_with_audit_token_t {
  constructor(init?: __Reply__vfs_resolve_dir_with_audit_token_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class tchars {
  constructor(init?: tchars);
  t_intrc: number;
  t_quitc: number;
  t_startc: number;
  t_stopc: number;
  t_eofc: number;
  t_brkc: number;
}

declare class fstat64_extended_args {
  constructor(init?: fstat64_extended_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  ub_l_: unknown /* const array */;
  ub: number;
  ub_r_: unknown /* const array */;
  xsecurity_l_: unknown /* const array */;
  xsecurity: number;
  xsecurity_r_: unknown /* const array */;
  xsecurity_size_l_: unknown /* const array */;
  xsecurity_size: number;
  xsecurity_size_r_: unknown /* const array */;
}

declare class IOCircularDataQueueEntryHeader {
  constructor(init?: IOCircularDataQueueEntryHeader);
  sentinel: number;
  _pad: number;
  data: unknown /* const array */;
}

declare class unnamed_12630235878951466609 {
  constructor(init?: unnamed_12630235878951466609);
  provider: interop.Pointer;
  busNum: number;
}

declare class user64_sigaltstack {
  constructor(init?: user64_sigaltstack);
}

declare class getfsstat64_args {
  constructor(init?: getfsstat64_args);
  buf_l_: unknown /* const array */;
  buf: number;
  buf_r_: unknown /* const array */;
  bufsize_l_: unknown /* const array */;
  bufsize: number;
  bufsize_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class nosys_args {
  constructor(init?: nosys_args);
  dummy: number;
}

declare class sptm_guest_dispatch_sme_t {
  constructor(init?: sptm_guest_dispatch_sme_t);
  tpidr2_el0: number;
  smpri_el1: number;
  svcr: number;
}

declare class sigprocmask_args {
  constructor(init?: sigprocmask_args);
  how_l_: unknown /* const array */;
  how: number;
  how_r_: unknown /* const array */;
  mask_l_: unknown /* const array */;
  mask: number;
  mask_r_: unknown /* const array */;
  omask_l_: unknown /* const array */;
  omask: number;
  omask_r_: unknown /* const array */;
}

declare class nd_opt_pref64 {
  constructor(init?: nd_opt_pref64);
  nd_opt_pref64_type: number;
  nd_opt_pref64_len: number;
  nd_opt_pref64_scaled_lifetime_plc: number;
  nd_opt_pref64_prefix: unknown /* const array */;
}

declare class IOReportElement {
  constructor(init?: IOReportElement);
  provider_id: number;
  channel_id: number;
  channel_type: IOReportChannelType;
  timestamp: number;
  values: IOReportElementValues;
}

declare class ifmibdata_supplemental {
  constructor(init?: ifmibdata_supplemental);
  ifmd_traffic_class: if_traffic_class;
  ifmd_data_extended: if_data_extended;
  ifmd_packet_stats: if_packet_stats;
  ifmd_rxpoll_stats: if_rxpoll_stats;
  ifmd_netif_stats: if_netif_stats;
}

declare class airship_acipc_boot {
  constructor(init?: airship_acipc_boot);
}

declare class unnamed_3473092985541993077 {
  constructor(init?: unnamed_3473092985541993077);
  connectionHandle: number;
  role: number;
  peerAddressType: number;
  peerAddress: BluetoothDeviceAddress;
  localResolvablePrivateAddress: BluetoothDeviceAddress;
  peerResolvablePrivateAddress: BluetoothDeviceAddress;
  connInterval: number;
  connLatency: number;
  supervisionTimeout: number;
  masterClockAccuracy: number;
}

declare class guarded_kqueue_np_args {
  constructor(init?: guarded_kqueue_np_args);
  guard_l_: unknown /* const array */;
  guard: number;
  guard_r_: unknown /* const array */;
  guardflags_l_: unknown /* const array */;
  guardflags: number;
  guardflags_r_: unknown /* const array */;
}

declare class __Request__ktrace_background_available_t {
  constructor(init?: __Request__ktrace_background_available_t);
  Head: mach_msg_header_t;
}

declare class unnamed_14090919454698453901 {
  constructor(init?: unnamed_14090919454698453901);
  page: number;
  maxPage: number;
  data: unknown /* const array */;
}

declare class udpstat {
  constructor(init?: udpstat);
  udps_ipackets: number;
  udps_hdrops: number;
  udps_badsum: number;
  udps_badlen: number;
  udps_noport: number;
  udps_noportbcast: number;
  udps_fullsock: number;
  udpps_pcbcachemiss: number;
  udpps_pcbhashmiss: number;
  udps_opackets: number;
  udps_fastout: number;
  udps_nosum: number;
  udps_noportmcast: number;
  udps_filtermcast: number;
  udps_rcv_swcsum: number;
  udps_rcv_swcsum_bytes: number;
  udps_rcv6_swcsum: number;
  udps_rcv6_swcsum_bytes: number;
  udps_snd_swcsum: number;
  udps_snd_swcsum_bytes: number;
  udps_snd6_swcsum: number;
  udps_snd6_swcsum_bytes: number;
  udps_port_unreach_dup_suppressed: number;
  udps_port_unreach_not_suppressed: number;
}

declare class _dyld_cache_header {
  constructor(init?: _dyld_cache_header);
  magic: unknown /* const array */;
  mappingOffset: number;
  mappingCount: number;
  imagesOffset: number;
  imagesCount: number;
  dyldBaseAddress: number;
  codeSignatureOffset: number;
  codeSignatureSize: number;
  slideInfoOffset: number;
  slideInfoSize: number;
  localSymbolsOffset: number;
  localSymbolsSize: number;
  uuid: unknown /* const array */;
  cacheType: number;
  branchPoolsOffset: number;
  branchPoolsCount: number;
  accelerateInfoAddr: number;
  accelerateInfoSize: number;
  imagesTextOffset: number;
  imagesTextCount: number;
  dylibsImageGroupAddr: number;
  dylibsImageGroupSize: number;
  otherImageGroupAddr: number;
  otherImageGroupSize: number;
  progClosuresAddr: number;
  progClosuresSize: number;
  progClosuresTrieAddr: number;
  progClosuresTrieSize: number;
  platform: number;
  formatVersion: number;
  dylibsExpectedOnDisk: number;
  simulator: number;
  locallyBuiltCache: number;
  padding: number;
}

declare class bpf_hdr_ext {
  constructor(init?: bpf_hdr_ext);
  bh_tstamp: timeval32;
  bh_caplen: number;
  bh_datalen: number;
  bh_hdrlen: number;
  bh_complen: number;
  bh_flags: number;
  bh_pid: number;
  bh_comm: unknown /* const array */;
  bh_pktflags: number;
  bh_trace_tag: number;
  bh_svc: number;
  bh_flowid: number;
  bh_unsent_bytes: number;
  bh_unsent_snd: number;
  bh_comp_gencnt: number;
}

declare class unnamed_7075641345827398249 {
  constructor(init?: unnamed_7075641345827398249);
  deviceAddress: BluetoothDeviceAddress;
}

declare class unnamed_2479739573426806797 {
  constructor(init?: unnamed_2479739573426806797);
  connectionHandle: number;
  supportedFeatures: BluetoothHCISupportedFeatures;
}

declare class __Reply__sysdiagnose_notification_t {
  constructor(init?: __Reply__sysdiagnose_notification_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class unnamed_1227888821503624707 {
  constructor(init?: unnamed_1227888821503624707);
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
  pageScanPeriodMode: number;
  pageScanMode: number;
  classOfDevice: number;
  clockOffset: number;
}

declare class Key {
  constructor(init?: Key);
  _value: number;
  _modified: boolean;
  Key: unknown /* int () (CXTypeKind: 110) */;
  isTopRow: unknown /* _Bool () (CXTypeKind: 110) */;
}

declare class tcpstat_local {
  constructor(init?: tcpstat_local);
  badformat: number;
  unspecv6: number;
  synfin: number;
  badformatipsec: number;
  noconnnolist: number;
  noconnlist: number;
  listbadsyn: number;
  icmp6unreach: number;
  deprecate6: number;
  ooopacket: number;
  rstinsynrcv: number;
  dospacket: number;
  cleanup: number;
  synwindow: number;
  linkheur_stealthdrop: number;
  linkheur_noackpri: number;
  linkheur_comprxmt: number;
  linkheur_synrxmt: number;
  linkheur_rxmtfloor: number;
}

declare class __Request__lockd_request_t {
  constructor(init?: __Request__lockd_request_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  vers: number;
  flags: number;
  xid: number;
  flk_start: number;
  flk_len: number;
  flk_pid: number;
  flk_type: number;
  flk_whence: number;
  sock_address: unknown /* const array */;
  cred: unknown /* const array */;
  fh_len: number;
  fh: unknown /* const array */;
}

declare class chdir_args {
  constructor(init?: chdir_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class fchmodat_args {
  constructor(init?: fchmodat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class fpathconf_args {
  constructor(init?: fpathconf_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
}

declare class unnamed_10755400700205909662 {
  constructor(init?: unnamed_10755400700205909662);
  deviceAddress: BluetoothDeviceAddress;
  passkey: number;
}

declare class BillboardAltModeCapabilityCompatibility {
  constructor(init?: BillboardAltModeCapabilityCompatibility);
  wSVID: number;
  dwAlternateMode: number;
  iAlternateModeString: number;
}

declare class __Request__mach_vm_deallocate_t {
  constructor(init?: __Request__mach_vm_deallocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  address: number;
  size: number;
}

declare class SuperSpeedHubDescriptor {
  constructor(init?: SuperSpeedHubDescriptor);
  bLength: number;
  bDescriptorType: number;
  bNumberPorts: number;
  wHubCharacteristics: number;
  bPowerOnToPowerGood: number;
  bHubControllerCurrent: number;
  bHubDecodeLatency: number;
  wHubDelay: number;
  deviceRemovable: number;
}

declare class IOUSBHostBundledCompletion {
  constructor(init?: IOUSBHostBundledCompletion);
  owner: interop.Pointer;
  action: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void | null;
  parameter: interop.Pointer;
}

declare class __Request__mach_memory_entry_access_tracking_t {
  constructor(init?: __Request__mach_memory_entry_access_tracking_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  access_tracking: number;
}

declare class if_nexusreq {
  constructor(init?: if_nexusreq);
  ifnr_name: unknown /* const array */;
  ifnr_flags: number;
  ifnr_netif: unknown /* const array */;
  ifnr_flowswitch: unknown /* const array */;
  ifnr_reserved: unknown /* const array */;
}

declare class setaudit_addr_args {
  constructor(init?: setaudit_addr_args);
  auditinfo_addr_l_: unknown /* const array */;
  auditinfo_addr: number;
  auditinfo_addr_r_: unknown /* const array */;
  length_l_: unknown /* const array */;
  length: number;
  length_r_: unknown /* const array */;
}

declare class SuperSpeedPlusUSBDeviceCapabilityDescriptor {
  constructor(init?: SuperSpeedPlusUSBDeviceCapabilityDescriptor);
  bLength: number;
  bDescriptorType: number;
  bDevCapabilityType: number;
  bReserved: number;
  bmAttributes: number;
  wFunctionalitySupport: number;
  wReserved: number;
  bmSublinkSpeedAttr: interop.Pointer;
}

declare class unnamed_17120838966663620196 {
  constructor(init?: unnamed_17120838966663620196);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  offset: number;
  size: number;
  abort_cond: number;
}

declare class nfs_filehandle {
  constructor(init?: nfs_filehandle);
  nfh_len: number;
  nfh_xh: nfs_exphandle;
  nfh_fid: unknown /* const array */;
  nfh_fhp: interop.Pointer;
}

declare class process_policy_args {
  constructor(init?: process_policy_args);
  scope_l_: unknown /* const array */;
  scope: number;
  scope_r_: unknown /* const array */;
  action_l_: unknown /* const array */;
  action: number;
  action_r_: unknown /* const array */;
  policy_l_: unknown /* const array */;
  policy: number;
  policy_r_: unknown /* const array */;
  policy_subtype_l_: unknown /* const array */;
  policy_subtype: number;
  policy_subtype_r_: unknown /* const array */;
  attrp_l_: unknown /* const array */;
  attrp: number;
  attrp_r_: unknown /* const array */;
  target_pid_l_: unknown /* const array */;
  target_pid: number;
  target_pid_r_: unknown /* const array */;
  target_threadid_l_: unknown /* const array */;
  target_threadid: number;
  target_threadid_r_: unknown /* const array */;
}

declare class unnamed_7884152256548239445 {
  constructor(init?: unnamed_7884152256548239445);
  connectionHandle: number;
  keyFlag: number;
}

declare class gettimeofday_args {
  constructor(init?: gettimeofday_args);
  tp_l_: unknown /* const array */;
  tp: number;
  tp_r_: unknown /* const array */;
  tzp_l_: unknown /* const array */;
  tzp: number;
  tzp_r_: unknown /* const array */;
  mach_absolute_time_l_: unknown /* const array */;
  mach_absolute_time: number;
  mach_absolute_time_r_: unknown /* const array */;
}

declare class priority_queue_sched_stable_max {
  constructor(init?: priority_queue_sched_stable_max);
  pq_root: interop.Pointer;
}

declare class aio_error_args {
  constructor(init?: aio_error_args);
  aiocbp_l_: unknown /* const array */;
  aiocbp: number;
  aiocbp_r_: unknown /* const array */;
}

declare class if_nsreq {
  constructor(init?: if_nsreq);
  ifnsr_name: unknown /* const array */;
  ifnsr_family: number;
  ifnsr_len: number;
  ifnsr_flags: number;
  ifnsr_data: unknown /* const array */;
}

declare class __Request__mach_voucher_attr_control_get_values_t {
  constructor(init?: __Request__mach_voucher_attr_control_get_values_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  voucher: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  value_handlesCnt: number;
}

declare class persona_modify_info {
  constructor(init?: persona_modify_info);
  persona_id: number;
  unique_pid: number;
}

declare class __Request__mach_vm_read_list_t {
  constructor(init?: __Request__mach_vm_read_list_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  data_list: unknown /* const array */;
  count: number;
}

declare class bsdthread_create_args {
  constructor(init?: bsdthread_create_args);
  func_l_: unknown /* const array */;
  func: number;
  func_r_: unknown /* const array */;
  func_arg_l_: unknown /* const array */;
  func_arg: number;
  func_arg_r_: unknown /* const array */;
  stack_l_: unknown /* const array */;
  stack: number;
  stack_r_: unknown /* const array */;
  pthread_l_: unknown /* const array */;
  pthread: number;
  pthread_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class AFKEndpointInterface_LocalIVars {
  constructor(init?: AFKEndpointInterface_LocalIVars);
}

declare class nd_opt_mtu {
  constructor(init?: nd_opt_mtu);
  nd_opt_mtu_type: number;
  nd_opt_mtu_len: number;
  nd_opt_mtu_reserved: number;
  nd_opt_mtu_mtu: number;
}

declare class IOServiceStateNotificationDispatchSource_LocalIVars {
  constructor(init?: IOServiceStateNotificationDispatchSource_LocalIVars);
}

declare class receive_vfs_nspace_subsystem {
  constructor(init?: receive_vfs_nspace_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class IOPCIDevice_LocalIVars {
  constructor(init?: IOPCIDevice_LocalIVars);
}

declare class unnamed_1049175290243989651 {
  constructor(init?: unnamed_1049175290243989651);
  handle: number;
  clock: number;
  accuracy: number;
}

declare class panic_timing_entry {
  constructor(init?: panic_timing_entry);
  timing_type: interop.Enum<typeof panic_timing_t>;
  timestamp: number;
  next_offset: number;
}

declare class objc_bp_assist_cfg_np_args {
  constructor(init?: objc_bp_assist_cfg_np_args);
  adr_l_: unknown /* const array */;
  adr: number;
  adr_r_: unknown /* const array */;
  ctl_l_: unknown /* const array */;
  ctl: number;
  ctl_r_: unknown /* const array */;
}

declare class AsyncPendingTrans {
  constructor(init?: AsyncPendingTrans);
  fHandler: interop.Pointer;
  fAltHandler: interop.Pointer;
  fTCode: number;
  fInUse: boolean;
}

declare class mknodat_args {
  constructor(init?: mknodat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  dev_l_: unknown /* const array */;
  dev: number;
  dev_r_: unknown /* const array */;
}

declare class IOHIDReportHandler {
  constructor(init?: IOHIDReportHandler);
}

declare class HIDValueCaps {
  constructor(init?: HIDValueCaps);
  usagePage: number;
  reportID: number;
  bitField: number;
  collection: number;
  collectionUsage: number;
  collectionUsagePage: number;
  isRange: number;
  isStringRange: number;
  isDesignatorRange: number;
  isAbsolute: number;
  startBit: number;
  bitSize: number;
  reportCount: number;
  logicalMin: number;
  logicalMax: number;
  physicalMin: number;
  physicalMax: number;
  u: unnamed_12453670226361702875;
}

declare class sadb_x_ipsecrequest {
  constructor(init?: sadb_x_ipsecrequest);
  sadb_x_ipsecrequest_len: number;
  sadb_x_ipsecrequest_proto: number;
  sadb_x_ipsecrequest_mode: number;
  sadb_x_ipsecrequest_level: number;
  sadb_x_ipsecrequest_reqid: number;
}

declare class unnamed_14192601549458291969 {
  constructor(init?: unnamed_14192601549458291969);
  data: unknown /* const array */;
}

declare class ip6_opt {
  constructor(init?: ip6_opt);
  ip6o_type: number;
  ip6o_len: number;
}

declare class unnamed_7361299537385875895 {
  constructor(init?: unnamed_7361299537385875895);
  connectionHandle: number;
}

declare class if_ipv6_address {
  constructor(init?: if_ipv6_address);
  v6_address: in6_addr;
  v6_prefixlen: number;
}

declare class intrusive_osobject_retainer {
  constructor(init?: intrusive_osobject_retainer);
  retain: (p1: number) => void | null;
}

declare class EFI_TABLE_HEADER {
  constructor(init?: EFI_TABLE_HEADER);
  Signature: number;
  Revision: number;
  HeaderSize: number;
  CRC32: number;
  Reserved: number;
}

declare class unnamed_14587641823161028669 {
  constructor(init?: unnamed_14587641823161028669);
  coprocessor_core_debug: number;
  coprocessor_secure_debug: number;
  memory_mapped_core_debug: number;
  coprocessor_trace_debug: number;
  memory_mapped_trace_debug: number;
  microcontroller_debug: number;
}

declare class unnamed_15224419824349941769 {
  constructor(init?: unnamed_15224419824349941769);
  data: unknown /* const array */;
}

declare class __Reply__mach_vm_range_create_t {
  constructor(init?: __Reply__mach_vm_range_create_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class ether_arp {
  constructor(init?: ether_arp);
  ea_hdr: arphdr;
  arp_sha: unknown /* const array */;
  arp_spa: unknown /* const array */;
  arp_tha: unknown /* const array */;
  arp_tpa: unknown /* const array */;
}

declare class unnamed_15028991116108628871 {
  constructor(init?: unnamed_15028991116108628871);
  usageMin: number;
  usageMax: number;
  stringMin: number;
  stringMax: number;
  designatorMin: number;
  designatorMax: number;
}

declare class circle_queue_head {
  constructor(init?: circle_queue_head);
  head: interop.Pointer;
}

declare class icmpstat {
  constructor(init?: icmpstat);
  icps_error: number;
  icps_oldshort: number;
  icps_oldicmp: number;
  icps_outhist: unknown /* const array */;
  icps_badcode: number;
  icps_tooshort: number;
  icps_checksum: number;
  icps_badlen: number;
  icps_reflect: number;
  icps_inhist: unknown /* const array */;
  icps_bmcastecho: number;
  icps_bmcasttstamp: number;
}

declare class poll_args {
  constructor(init?: poll_args);
  fds_l_: unknown /* const array */;
  fds: number;
  fds_r_: unknown /* const array */;
  nfds_l_: unknown /* const array */;
  nfds: number;
  nfds_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
}

declare class __Reply__mach_memory_entry_get_page_counts_t {
  constructor(init?: __Reply__mach_memory_entry_get_page_counts_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  resident_cnt: number;
  dirty_cnt: number;
  swapped_cnt: number;
}

declare class linkat_args {
  constructor(init?: linkat_args);
  fd1_l_: unknown /* const array */;
  fd1: number;
  fd1_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  fd2_l_: unknown /* const array */;
  fd2: number;
  fd2_r_: unknown /* const array */;
  link_l_: unknown /* const array */;
  link: number;
  link_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class __Request__mach_vm_deferred_reclamation_buffer_flush_t {
  constructor(init?: __Request__mach_vm_deferred_reclamation_buffer_flush_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  num_entries_to_reclaim: number;
}

declare class preadv_args {
  constructor(init?: preadv_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class proc_rlimit_control_args {
  constructor(init?: proc_rlimit_control_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  flavor_l_: unknown /* const array */;
  flavor: number;
  flavor_r_: unknown /* const array */;
  arg_l_: unknown /* const array */;
  arg: number;
  arg_r_: unknown /* const array */;
}

declare class lseek_args {
  constructor(init?: lseek_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
  whence_l_: unknown /* const array */;
  whence: number;
  whence_r_: unknown /* const array */;
}

declare class OSAction_IOHIDDevice__CompleteReport_IVars {
  constructor(init?: OSAction_IOHIDDevice__CompleteReport_IVars);
}

declare class shm_unlink_args {
  constructor(init?: shm_unlink_args);
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
}

declare class kev_dl_node_presence {
  constructor(init?: kev_dl_node_presence);
  link_data: net_event_data;
  sin6_node_address: sockaddr_in6;
  sdl_node_address: sockaddr_dl;
  rssi: number;
  link_quality_metric: number;
  node_proximity_metric: number;
  node_service_info: unknown /* const array */;
}

declare class newesp {
  constructor(init?: newesp);
  esp_spi: number;
  esp_seq: number;
}

declare class funmount_args {
  constructor(init?: funmount_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class __Request__mach_vm_remap_t {
  constructor(init?: __Request__mach_vm_remap_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  src_task: mach_msg_port_descriptor_t;
  NDR: NDR_record_t;
  target_address: number;
  size: number;
  mask: number;
  flags: number;
  src_address: number;
  copy: number;
  inheritance: number;
}

declare class nfsd_args {
  constructor(init?: nfsd_args);
  sock: number;
  name: number;
  namelen: number;
}

declare class __Reply__mach_vm_deferred_reclamation_buffer_allocate_t {
  constructor(init?: __Reply__mach_vm_deferred_reclamation_buffer_allocate_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  address: number;
  next_deadline: number;
}

declare class task_inspect_for_pid_args {
  constructor(init?: task_inspect_for_pid_args);
  target_tport_l_: unknown /* const array */;
  target_tport: number;
  target_tport_r_: unknown /* const array */;
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  t_l_: unknown /* const array */;
  t: number;
  t_r_: unknown /* const array */;
}

declare class audit_session_self_args {
  constructor(init?: audit_session_self_args);
  dummy: number;
}

declare class cpuid_arch_perf_leaf_t {
  constructor(init?: cpuid_arch_perf_leaf_t);
  version: number;
  number: number;
  width: number;
  events_number: number;
  events: number;
  fixed_number: number;
  fixed_width: number;
}

declare class unnamed_2467947721980687829 {
  constructor(init?: unnamed_2467947721980687829);
  handle: number;
  RSSIValue: number;
}

declare class nd_opt_dnr {
  constructor(init?: nd_opt_dnr);
  nd_opt_dnr_type: number;
  nd_opt_dnr_len: number;
  nd_opt_dnr_svc_priority: unknown /* const array */;
  nd_opt_dnr_lifetime: unknown /* const array */;
  nd_opt_dnr_adn_len: unknown /* const array */;
  nd_opt_dnr_continuation: unknown /* const array */;
}

declare class unnamed_13759521960893842890 {
  constructor(init?: unnamed_13759521960893842890);
  data: unknown /* const array */;
}

declare class __Reply__mach_voucher_extract_all_attr_recipes_t {
  constructor(init?: __Reply__mach_voucher_extract_all_attr_recipes_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  recipesCnt: number;
  recipes: unknown /* const array */;
}

declare class iocompressionstats_notification_subsystem {
  constructor(init?: iocompressionstats_notification_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class ataRegisterImage {
  constructor(init?: ataRegisterImage);
  taskFile: ataTaskFile;
  ataDataRegister: number;
  ataAltSDevCReg: number;
}

declare class sem_wait_args {
  constructor(init?: sem_wait_args);
  sem_l_: unknown /* const array */;
  sem: number;
  sem_r_: unknown /* const array */;
}

declare class __Request__fairplayd_arcade_request_t {
  constructor(init?: __Request__fairplayd_arcade_request_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  arcade_reg_port: mach_msg_port_descriptor_t;
}

declare class unnamed_7873282331825417540 {
  constructor(init?: unnamed_7873282331825417540);
  transmitBandwidth: number;
  receiveBandwidth: number;
  transmitCodingFormat: number;
  receiveCodingFormat: number;
  transmitCodecFrameSize: number;
  receiveCodecFrameSize: number;
  inputBandwidth: number;
  outputBandwidth: number;
  inputCodingFormat: number;
  outputCodingFormat: number;
  inputCodedDataSize: number;
  outputCodedDataSize: number;
  inputPCMDataFormat: number;
  outputPCMDataFormat: number;
  inputPCMSamplePayloadMSBPosition: number;
  outputPCMSamplePayloadMSBPosition: number;
  inputDataPath: number;
  outputDataPath: number;
  inputTransportUnitSize: number;
  outputTransportUnitSize: number;
  maxLatency: number;
  packetType: number;
  retransmissionEffort: number;
}

declare class ip6_hbh {
  constructor(init?: ip6_hbh);
  ip6h_nxt: number;
  ip6h_len: number;
}

declare class OSAction_AFKUserDataPipe__HandleReport_IVars {
  constructor(init?: OSAction_AFKUserDataPipe__HandleReport_IVars);
}

declare class tcpiphdr {
  constructor(init?: tcpiphdr);
  ti_i: ipovly;
  ti_t: tcphdr;
}

declare class kern_work_interval_create_args {
  constructor(init?: kern_work_interval_create_args);
  wica_id: number;
  wica_port: number;
  wica_create_flags: number;
}

declare class HIDCaps {
  constructor(init?: HIDCaps);
  usage: number;
  usagePage: number;
  inputReportByteLength: number;
  outputReportByteLength: number;
  featureReportByteLength: number;
  numberCollectionNodes: number;
  numberInputButtonCaps: number;
  numberInputValueCaps: number;
  numberOutputButtonCaps: number;
  numberOutputValueCaps: number;
  numberFeatureButtonCaps: number;
  numberFeatureValueCaps: number;
}

declare class __Request__mach_voucher_extract_all_attr_recipes_t {
  constructor(init?: __Request__mach_voucher_extract_all_attr_recipes_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  recipesCnt: number;
}

declare class getpriority_args {
  constructor(init?: getpriority_args);
  which_l_: unknown /* const array */;
  which: number;
  which_r_: unknown /* const array */;
  who_l_: unknown /* const array */;
  who: number;
  who_r_: unknown /* const array */;
}

declare class rr_result {
  constructor(init?: rr_result);
  rrr_flags: number;
  rrr_ordinal: number;
  rrr_matchedlen: number;
  rrr_ifid: number;
  rrr_prefix: in6_addr;
}

declare class preadv_nocancel_args {
  constructor(init?: preadv_nocancel_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  iovp_l_: unknown /* const array */;
  iovp: number;
  iovp_r_: unknown /* const array */;
  iovcnt_l_: unknown /* const array */;
  iovcnt: number;
  iovcnt_r_: unknown /* const array */;
  offset_l_: unknown /* const array */;
  offset: number;
  offset_r_: unknown /* const array */;
}

declare class kev_dl_issues {
  constructor(init?: kev_dl_issues);
  link_data: net_event_data;
  modid: unknown /* const array */;
  timestamp: number;
  info: unknown /* const array */;
}

declare class utimes_args {
  constructor(init?: utimes_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  tptr_l_: unknown /* const array */;
  tptr: number;
  tptr_r_: unknown /* const array */;
}

declare class ah {
  constructor(init?: ah);
  ah_nxt: number;
  ah_len: number;
  ah_reserve: number;
  ah_spi: number;
}

declare class arcade_upcall_subsystem {
  constructor(init?: arcade_upcall_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class icmp6stat {
  constructor(init?: icmp6stat);
  icp6s_error: number;
  icp6s_canterror: number;
  icp6s_toofreq: number;
  icp6s_outhist: unknown /* const array */;
  icp6s_badcode: number;
  icp6s_tooshort: number;
  icp6s_checksum: number;
  icp6s_badlen: number;
  icp6s_reflect: number;
  icp6s_inhist: unknown /* const array */;
  icp6s_nd_toomanyopt: number;
  icp6s_outerrhist: icmp6errstat;
  icp6s_pmtuchg: number;
  icp6s_nd_badopt: number;
  icp6s_badns: number;
  icp6s_badna: number;
  icp6s_badrs: number;
  icp6s_badra: number;
  icp6s_badredirect: number;
  icp6s_rfc6980_drop: number;
  icp6s_badpkttoobig: number;
}

declare class if_netem_params {
  constructor(init?: if_netem_params);
  ifnetem_model: interop.Enum<typeof if_netem_model_t>;
  ifnetem_bandwidth_bps: number;
  ifnetem_latency_ms: number;
  ifnetem_jitter_ms: number;
  ifnetem_corruption_p: number;
  ifnetem_duplication_p: number;
  ifnetem_loss_p_gr_gl: number;
  ifnetem_loss_p_gr_bl: number;
  ifnetem_loss_p_bl_br: number;
  ifnetem_loss_p_bl_gr: number;
  ifnetem_loss_p_br_bl: number;
  ifnetem_loss_recovery_ms: number;
  ifnetem_reordering_p: number;
  ifnetem_reordering_ms: number;
  ifnetem_output_ival_ms: number;
}

declare class getgroups_args {
  constructor(init?: getgroups_args);
  gidsetsize_l_: unknown /* const array */;
  gidsetsize: number;
  gidsetsize_r_: unknown /* const array */;
  gidset_l_: unknown /* const array */;
  gidset: number;
  gidset_r_: unknown /* const array */;
}

declare class unnamed_5694651472756226902 {
  constructor(init?: unnamed_5694651472756226902);
  connectionHandle: number;
  enable: number;
}

declare class shm_open_args {
  constructor(init?: shm_open_args);
  name_l_: unknown /* const array */;
  name: number;
  name_r_: unknown /* const array */;
  oflag_l_: unknown /* const array */;
  oflag: number;
  oflag_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
}

declare class sadb_alg {
  constructor(init?: sadb_alg);
  sadb_alg_id: number;
  sadb_alg_ivlen: number;
  sadb_alg_minbits: number;
  sadb_alg_maxbits: number;
  sadb_alg_reserved: number;
}

declare class IOSimpleReportValues {
  constructor(init?: IOSimpleReportValues);
  simple_value: number;
  reserved1: number;
  reserved2: number;
  reserved3: number;
}

declare class sadb_sastat {
  constructor(init?: sadb_sastat);
  sadb_sastat_len: number;
  sadb_sastat_exttype: number;
  sadb_sastat_dir: number;
  sadb_sastat_reserved: number;
  sadb_sastat_list_len: number;
}

declare class unnamed_4839339318380457615 {
  constructor(init?: unnamed_4839339318380457615);
  control: number;
  control_ext: number;
}

declare class arm_feature_bits_t {
  constructor(init?: arm_feature_bits_t);
  el0_not_implemented: number;
  el0_aarch64_only: number;
  el0_aarch32_and_64: number;
  el1_not_implemented: number;
  el1_aarch64_only: number;
  el1_aarch32_and_64: number;
  el2_not_implemented: number;
  el2_aarch64_only: number;
  el2_aarch32_and_64: number;
  el3_not_implemented: number;
  el3_aarch64_only: number;
  el3_aarch32_and_64: number;
  reserved: number;
}

declare class __Reply__mach_vm_protect_t {
  constructor(init?: __Reply__mach_vm_protect_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class DeviceDescriptor {
  constructor(init?: DeviceDescriptor);
  bLength: number;
  bDescriptorType: number;
  bcdUSB: number;
  bDeviceClass: number;
  bDeviceSubClass: number;
  bDeviceProtocol: number;
  bMaxPacketSize0: number;
  idVendor: number;
  idProduct: number;
  bcdDevice: number;
  iManufacturer: number;
  iProduct: number;
  iSerialNumber: number;
  bNumConfigurations: number;
}

declare class sptm_trace_t {
  constructor(init?: sptm_trace_t);
  trace_id: number;
  trace_type: number;
  dispatch_id: number;
  cpu_id: number;
}

declare class unlink_args {
  constructor(init?: unlink_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
}

declare class kqueue_workloop_ctl_args {
  constructor(init?: kqueue_workloop_ctl_args);
  cmd_l_: unknown /* const array */;
  cmd: number;
  cmd_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
  addr_l_: unknown /* const array */;
  addr: number;
  addr_r_: unknown /* const array */;
  sz_l_: unknown /* const array */;
  sz: number;
  sz_r_: unknown /* const array */;
}

declare class ldt_desc {
  constructor(init?: ldt_desc);
  limit00: number;
  base00: number;
  base16: number;
  type: number;
  present: number;
  limit16: number;
  granular: number;
  base24: number;
}

declare class faccessat_args {
  constructor(init?: faccessat_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  amode_l_: unknown /* const array */;
  amode: number;
  amode_r_: unknown /* const array */;
  flag_l_: unknown /* const array */;
  flag: number;
  flag_r_: unknown /* const array */;
}

declare class setattrlist_args {
  constructor(init?: setattrlist_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  alist_l_: unknown /* const array */;
  alist: number;
  alist_r_: unknown /* const array */;
  attributeBuffer_l_: unknown /* const array */;
  attributeBuffer: number;
  attributeBuffer_r_: unknown /* const array */;
  bufferSize_l_: unknown /* const array */;
  bufferSize: number;
  bufferSize_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class audit_triggers_subsystem {
  constructor(init?: audit_triggers_subsystem);
  server: (p1: interop.PointerConvertible) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  start: number;
  end: number;
  maxsize: number;
  reserved: number;
  routine: unknown /* const array */;
}

declare class nd_router_solicit {
  constructor(init?: nd_router_solicit);
  nd_rs_hdr: icmp6_hdr;
}

declare class kern_ctl_reg {
  constructor(init?: kern_ctl_reg);
  ctl_name: unknown /* const array */;
  ctl_id: number;
  ctl_unit: number;
  ctl_flags: number;
  ctl_sendsize: number;
  ctl_recvsize: number;
  ctl_connect: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  ctl_disconnect: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  ctl_send: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number) => number | null;
  ctl_setopt: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: number) => number | null;
  ctl_getopt: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number | null;
}

declare class bpf_comp_hdr {
  constructor(init?: bpf_comp_hdr);
  bh_tstamp: timeval32;
  bh_caplen: number;
  bh_datalen: number;
  bh_hdrlen: number;
  bh_complen: number;
  bh_padding: number;
}

declare class __pthread_fchdir_args {
  constructor(init?: __pthread_fchdir_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
}

declare class IOHIDDevice_IVars {
  constructor(init?: IOHIDDevice_IVars);
}

declare class mbuf {
  constructor(init?: mbuf);
}

declare class OpaqueDTEntryIterator {
  constructor(init?: OpaqueDTEntryIterator);
  outerScope: interop.Pointer;
  currentScope: interop.Pointer;
  currentEntry: interop.Pointer;
  savedScope: interop.Pointer;
  currentIndex: number;
}

declare class __Reply__mach_vm_machine_attribute_t {
  constructor(init?: __Reply__mach_vm_machine_attribute_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  value: number;
}

declare class vfs_purge_args {
  constructor(init?: vfs_purge_args);
  dummy: number;
}

declare class id_ip {
  constructor(init?: id_ip);
  idi_ip: ip;
}

declare class _cr0 {
  constructor(init?: _cr0);
  pe: number;
  mp: number;
  em: number;
  ts: number;
  ne: number;
  wp: number;
  am: number;
  nw: number;
  cd: number;
  pg: number;
}

declare class user32_ntptimeval {
  constructor(init?: user32_ntptimeval);
  time: user32_timespec;
  maxerror: number;
  esterror: number;
  tai: number;
  time_state: number;
}

declare class ATAPICmdPacket {
  constructor(init?: ATAPICmdPacket);
  atapiPacketSize: number;
  atapiCommandByte: unknown /* const array */;
}

declare class __semwait_signal_nocancel_args {
  constructor(init?: __semwait_signal_nocancel_args);
  cond_sem_l_: unknown /* const array */;
  cond_sem: number;
  cond_sem_r_: unknown /* const array */;
  mutex_sem_l_: unknown /* const array */;
  mutex_sem: number;
  mutex_sem_r_: unknown /* const array */;
  timeout_l_: unknown /* const array */;
  timeout: number;
  timeout_r_: unknown /* const array */;
  relative_l_: unknown /* const array */;
  relative: number;
  relative_r_: unknown /* const array */;
  tv_sec_l_: unknown /* const array */;
  tv_sec: number;
  tv_sec_r_: unknown /* const array */;
  tv_nsec_l_: unknown /* const array */;
  tv_nsec: number;
  tv_nsec_r_: unknown /* const array */;
}

declare class __Reply__mach_vm_deferred_reclamation_buffer_query_t {
  constructor(init?: __Reply__mach_vm_deferred_reclamation_buffer_query_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
  addr: number;
  size: number;
}

declare class pid_resume_args {
  constructor(init?: pid_resume_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
}

declare class __shmid_ds_new {
  constructor(init?: __shmid_ds_new);
  shm_perm: ipc_perm;
  shm_segsz: number;
  shm_lpid: number;
  shm_cpid: number;
  shm_nattch: number;
  shm_atime: number;
  shm_dtime: number;
  shm_ctime: number;
  shm_internal: interop.Pointer;
}

declare class ifnet_stats_per_flow {
  constructor(init?: ifnet_stats_per_flow);
  bk_txpackets: number;
  txpackets: number;
  rxpackets: number;
  txretransmitbytes: number;
  rxoutoforderbytes: number;
  rxmitpkts: number;
  rcvoopack: number;
  pawsdrop: number;
  sack_recovery_episodes: number;
  reordered_pkts: number;
  dsack_sent: number;
  dsack_recvd: number;
  srtt: number;
  rttupdated: number;
  rttvar: number;
  rttmin: number;
  bw_sndbw_max: number;
  bw_rcvbw_max: number;
  ecn_recv_ece: number;
  ecn_recv_ce: number;
  ecn_flags: number;
  ipv4: number;
  local: number;
  connreset: number;
  conntimeout: number;
  rxmit_drop: number;
  ecn_fallback_synloss: number;
  ecn_fallback_droprst: number;
  ecn_fallback_droprxmt: number;
  ecn_fallback_ce: number;
  ecn_fallback_reorder: number;
  _reserved_6: number;
  _reserved_16: number;
  _reserved_32: number;
  linkheur_noackpri: number;
  linkheur_comprxmt: number;
  linkheur_synrxmt: number;
  linkheur_rxmtfloor: number;
}

declare class sem_post_args {
  constructor(init?: sem_post_args);
  sem_l_: unknown /* const array */;
  sem: number;
  sem_r_: unknown /* const array */;
}

declare class mymsg {
  constructor(init?: mymsg);
  mtype: number;
  mtext: unknown /* const array */;
}

declare class select_nocancel_args {
  constructor(init?: select_nocancel_args);
  nd_l_: unknown /* const array */;
  nd: number;
  nd_r_: unknown /* const array */;
  in_l_: unknown /* const array */;
  in_: number;
  in_r_: unknown /* const array */;
  ou_l_: unknown /* const array */;
  ou: number;
  ou_r_: unknown /* const array */;
  ex_l_: unknown /* const array */;
  ex: number;
  ex_r_: unknown /* const array */;
  tv_l_: unknown /* const array */;
  tv: number;
  tv_r_: unknown /* const array */;
}

declare class _lck_grp_attr_ {
  constructor(init?: _lck_grp_attr_);
}

declare class user_timeval {
  constructor(init?: user_timeval);
  tv_sec: number;
  tv_usec: number;
}

declare class nd_redirect {
  constructor(init?: nd_redirect);
  nd_rd_hdr: icmp6_hdr;
  nd_rd_target: in6_addr;
  nd_rd_dst: in6_addr;
}

declare class in6_ndifreq {
  constructor(init?: in6_ndifreq);
  ifname: unknown /* const array */;
  ifindex: number;
}

declare class nfs_specdata {
  constructor(init?: nfs_specdata);
  specdata1: number;
  specdata2: number;
}

declare class arpstat {
  constructor(init?: arpstat);
  txrequests: number;
  txreplies: number;
  txannounces: number;
  rxrequests: number;
  rxreplies: number;
  received: number;
  txconflicts: number;
  invalidreqs: number;
  reqnobufs: number;
  dropped: number;
  purged: number;
  timeouts: number;
  dupips: number;
  inuse: number;
  txurequests: number;
  held: number;
}

declare class unnamed_11398826919476084987 {
  constructor(init?: unnamed_11398826919476084987);
  deviceAddress: BluetoothDeviceAddress;
  ioCapability: number;
  OOBDataPresence: number;
  authenticationRequirements: number;
}

declare class IOHIDDevice_LocalIVars {
  constructor(init?: IOHIDDevice_LocalIVars);
}

declare class getegid_args {
  constructor(init?: getegid_args);
  dummy: number;
}

declare class ifnet_demux_desc {
  constructor(init?: ifnet_demux_desc);
  type: number;
  data: interop.Pointer;
  datalen: number;
}

declare class setwgroups_args {
  constructor(init?: setwgroups_args);
  setlen_l_: unknown /* const array */;
  setlen: number;
  setlen_r_: unknown /* const array */;
  guidset_l_: unknown /* const array */;
  guidset: number;
  guidset_r_: unknown /* const array */;
}

declare class in6_nbrinfo {
  constructor(init?: in6_nbrinfo);
  ifname: unknown /* const array */;
  addr: in6_addr;
  asked: number;
  isrouter: number;
  state: number;
  expire: number;
}

declare class task_read_for_pid_args {
  constructor(init?: task_read_for_pid_args);
  target_tport_l_: unknown /* const array */;
  target_tport: number;
  target_tport_r_: unknown /* const array */;
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
  t_l_: unknown /* const array */;
  t: number;
  t_r_: unknown /* const array */;
}

declare class removexattr_args {
  constructor(init?: removexattr_args);
  path_l_: unknown /* const array */;
  path: number;
  path_r_: unknown /* const array */;
  attrname_l_: unknown /* const array */;
  attrname: number;
  attrname_r_: unknown /* const array */;
  options_l_: unknown /* const array */;
  options: number;
  options_r_: unknown /* const array */;
}

declare class thread_snapshot {
  constructor(init?: thread_snapshot);
  snapshot_magic: number;
  nkern_frames: number;
  nuser_frames: number;
  wait_event: number;
  continuation: number;
  thread_id: number;
  user_time: number;
  system_time: number;
  state: number;
  priority: number;
  sched_pri: number;
  sched_flags: number;
  ss_flags: number;
  ts_qos: number;
  ts_rqos: number;
  ts_rqos_override: number;
  io_tier: number;
  _reserved: unknown /* const array */;
  disk_reads_count: number;
  disk_reads_size: number;
  disk_writes_count: number;
  disk_writes_size: number;
  io_priority_count: unknown /* const array */;
  io_priority_size: unknown /* const array */;
  paging_count: number;
  paging_size: number;
  non_paging_count: number;
  non_paging_size: number;
  data_count: number;
  data_size: number;
  metadata_count: number;
  metadata_size: number;
  voucher_identifier: number;
  total_syscalls: number;
  pth_name: unknown /* const array */;
}

declare class ip6_rthdr {
  constructor(init?: ip6_rthdr);
  ip6r_nxt: number;
  ip6r_len: number;
  ip6r_type: number;
  ip6r_segleft: number;
}

declare class EXBrightMessage {
  constructor(init?: EXBrightMessage);
  type: interop.Enum<typeof EXBrightMessageType>;
  arg0: number;
  arg1: number;
}

declare class unnamed_5144785235306283551 {
  constructor(init?: unnamed_5144785235306283551);
  data: unknown /* const array */;
}

declare class __Reply__mach_notify_port_destroyed_t {
  constructor(init?: __Reply__mach_notify_port_destroyed_t);
  Head: mach_msg_header_t;
  NDR: NDR_record_t;
  RetCode: number;
}

declare class fchown_args {
  constructor(init?: fchown_args);
  fd_l_: unknown /* const array */;
  fd: number;
  fd_r_: unknown /* const array */;
  uid_l_: unknown /* const array */;
  uid: number;
  uid_r_: unknown /* const array */;
  gid_l_: unknown /* const array */;
  gid: number;
  gid_r_: unknown /* const array */;
}

declare class getpgid_args {
  constructor(init?: getpgid_args);
  pid_l_: unknown /* const array */;
  pid: number;
  pid_r_: unknown /* const array */;
}

declare class xunpgen {
  constructor(init?: xunpgen);
  xug_len: number;
  xug_count: number;
  xug_gen: number;
  xug_sogen: number;
}

declare class __Reply__mach_gss_lookup_t {
  constructor(init?: __Reply__mach_gss_lookup_t);
  Head: mach_msg_header_t;
  msgh_body: mach_msg_body_t;
  gssd_session_port: mach_msg_port_descriptor_t;
}

declare class setgroups_args {
  constructor(init?: setgroups_args);
  gidsetsize_l_: unknown /* const array */;
  gidsetsize: number;
  gidsetsize_r_: unknown /* const array */;
  gidset_l_: unknown /* const array */;
  gidset: number;
  gidset_r_: unknown /* const array */;
}

declare class ip6_frag {
  constructor(init?: ip6_frag);
  ip6f_nxt: number;
  ip6f_reserved: number;
  ip6f_offlg: number;
  ip6f_ident: number;
}

declare class smrq_stailq_head {
  constructor(init?: smrq_stailq_head);
  first: __smrq_slink_t;
  last: interop.Pointer;
}

declare class dyld_chained_ptr_64_rebase {
  constructor(init?: dyld_chained_ptr_64_rebase);
  target: number;
  high8: number;
  reserved: number;
  next: number;
  bind: number;
}

declare class IOUSBHostPipe_LocalIVars {
  constructor(init?: IOUSBHostPipe_LocalIVars);
}

declare class copyfile_args {
  constructor(init?: copyfile_args);
  from_l_: unknown /* const array */;
  from: number;
  from_r_: unknown /* const array */;
  to_l_: unknown /* const array */;
  to: number;
  to_r_: unknown /* const array */;
  mode_l_: unknown /* const array */;
  mode: number;
  mode_r_: unknown /* const array */;
  flags_l_: unknown /* const array */;
  flags: number;
  flags_r_: unknown /* const array */;
}

declare class bpf_comp_stats {
  constructor(init?: bpf_comp_stats);
  bcs_total_read: number;
  bcs_total_size: number;
  bcs_total_hdr_size: number;
  bcs_count_no_common_prefix: number;
  bcs_count_compressed_prefix: number;
  bcs_total_compressed_prefix_size: number;
  bcs_max_compressed_prefix_size: number;
}

declare class rr_pco_match {
  constructor(init?: rr_pco_match);
  rpm_code: number;
  rpm_len: number;
  rpm_ordinal: number;
  rpm_matchlen: number;
  rpm_minlen: number;
  rpm_maxlen: number;
  rpm_reserved: number;
  rpm_prefix: in6_addr;
}

type cpc_machine_regsDescriptor = 
  | { cmr_cpmu: _cpc_x86_64_cpmu_regs };

declare class cpc_machine_regs {
  constructor(init?: cpc_machine_regsDescriptor);
  cmr_cpmu: _cpc_x86_64_cpmu_regs;
}

type arm_cpuid_id_aa64dfr0_el1Descriptor = 
  | { debug_feature: unnamed_3417869383875129114 }
  | { value: number };

declare class arm_cpuid_id_aa64dfr0_el1 {
  constructor(init?: arm_cpuid_id_aa64dfr0_el1Descriptor);
  debug_feature: unnamed_3417869383875129114;
  value: number;
}

type arm_cpuid_id_dfr0Descriptor = 
  | { debug_feature: unnamed_14587641823161028669 }
  | { value: number };

declare class arm_cpuid_id_dfr0 {
  constructor(init?: arm_cpuid_id_dfr0Descriptor);
  debug_feature: unnamed_14587641823161028669;
  value: number;
}

type arm_feature0_reg_tDescriptor = 
  | { field: arm_feature_bits_t }
  | { value: number };

declare class arm_feature0_reg_t {
  constructor(init?: arm_feature0_reg_tDescriptor);
  field: arm_feature_bits_t;
  value: number;
}

type __ReplyUnion__kextd_kernel_request_subsystemDescriptor = 
  | { Reply_kextd_ping: __Reply__kextd_ping_t };

declare class __ReplyUnion__kextd_kernel_request_subsystem {
  constructor(init?: __ReplyUnion__kextd_kernel_request_subsystemDescriptor);
  Reply_kextd_ping: __Reply__kextd_ping_t;
}

type __RequestUnion__kextd_kernel_request_subsystemDescriptor = 
  | { Request_kextd_ping: __Request__kextd_ping_t };

declare class __RequestUnion__kextd_kernel_request_subsystem {
  constructor(init?: __RequestUnion__kextd_kernel_request_subsystemDescriptor);
  Request_kextd_ping: __Request__kextd_ping_t;
}

type __ReplyUnion__memory_entry_subsystemDescriptor = 
  | { Reply_mach_memory_entry_purgable_control: __Reply__mach_memory_entry_purgable_control_t }
  | { Reply_mach_memory_entry_access_tracking: __Reply__mach_memory_entry_access_tracking_t }
  | { Reply_mach_memory_entry_ownership: __Reply__mach_memory_entry_ownership_t }
  | { Reply_mach_memory_entry_get_page_counts: __Reply__mach_memory_entry_get_page_counts_t }
  | { Reply_mach_memory_entry_region_info: __Reply__mach_memory_entry_region_info_t };

declare class __ReplyUnion__memory_entry_subsystem {
  constructor(init?: __ReplyUnion__memory_entry_subsystemDescriptor);
  Reply_mach_memory_entry_purgable_control: __Reply__mach_memory_entry_purgable_control_t;
  Reply_mach_memory_entry_access_tracking: __Reply__mach_memory_entry_access_tracking_t;
  Reply_mach_memory_entry_ownership: __Reply__mach_memory_entry_ownership_t;
  Reply_mach_memory_entry_get_page_counts: __Reply__mach_memory_entry_get_page_counts_t;
  Reply_mach_memory_entry_region_info: __Reply__mach_memory_entry_region_info_t;
}

type __RequestUnion__memory_entry_subsystemDescriptor = 
  | { Request_mach_memory_entry_purgable_control: __Request__mach_memory_entry_purgable_control_t }
  | { Request_mach_memory_entry_access_tracking: __Request__mach_memory_entry_access_tracking_t }
  | { Request_mach_memory_entry_ownership: __Request__mach_memory_entry_ownership_t }
  | { Request_mach_memory_entry_get_page_counts: __Request__mach_memory_entry_get_page_counts_t }
  | { Request_mach_memory_entry_region_info: __Request__mach_memory_entry_region_info_t };

declare class __RequestUnion__memory_entry_subsystem {
  constructor(init?: __RequestUnion__memory_entry_subsystemDescriptor);
  Request_mach_memory_entry_purgable_control: __Request__mach_memory_entry_purgable_control_t;
  Request_mach_memory_entry_access_tracking: __Request__mach_memory_entry_access_tracking_t;
  Request_mach_memory_entry_ownership: __Request__mach_memory_entry_ownership_t;
  Request_mach_memory_entry_get_page_counts: __Request__mach_memory_entry_get_page_counts_t;
  Request_mach_memory_entry_region_info: __Request__mach_memory_entry_region_info_t;
}

type __ReplyUnion__mach_vm_subsystemDescriptor = 
  | { Reply_mach_vm_allocate: __Reply__mach_vm_allocate_t }
  | { Reply_mach_vm_deallocate: __Reply__mach_vm_deallocate_t }
  | { Reply_mach_vm_protect: __Reply__mach_vm_protect_t }
  | { Reply_mach_vm_inherit: __Reply__mach_vm_inherit_t }
  | { Reply_mach_vm_read: __Reply__mach_vm_read_t }
  | { Reply_mach_vm_read_list: __Reply__mach_vm_read_list_t }
  | { Reply_mach_vm_write: __Reply__mach_vm_write_t }
  | { Reply_mach_vm_copy: __Reply__mach_vm_copy_t }
  | { Reply_mach_vm_read_overwrite: __Reply__mach_vm_read_overwrite_t }
  | { Reply_mach_vm_msync: __Reply__mach_vm_msync_t }
  | { Reply_mach_vm_behavior_set: __Reply__mach_vm_behavior_set_t }
  | { Reply_mach_vm_map: __Reply__mach_vm_map_t }
  | { Reply_mach_vm_machine_attribute: __Reply__mach_vm_machine_attribute_t }
  | { Reply_mach_vm_remap: __Reply__mach_vm_remap_t }
  | { Reply_mach_vm_page_query: __Reply__mach_vm_page_query_t }
  | { Reply_mach_vm_region_recurse: __Reply__mach_vm_region_recurse_t }
  | { Reply_mach_vm_region: __Reply__mach_vm_region_t }
  | { Reply__mach_make_memory_entry: __Reply___mach_make_memory_entry_t }
  | { Reply_mach_vm_purgable_control: __Reply__mach_vm_purgable_control_t }
  | { Reply_mach_vm_page_info: __Reply__mach_vm_page_info_t }
  | { Reply_mach_vm_page_range_query: __Reply__mach_vm_page_range_query_t }
  | { Reply_mach_vm_remap_new: __Reply__mach_vm_remap_new_t }
  | { Reply_mach_vm_deferred_reclamation_buffer_allocate: __Reply__mach_vm_deferred_reclamation_buffer_allocate_t }
  | { Reply_mach_vm_deferred_reclamation_buffer_flush: __Reply__mach_vm_deferred_reclamation_buffer_flush_t }
  | { Reply_mach_vm_range_create: __Reply__mach_vm_range_create_t }
  | { Reply_mach_vm_deferred_reclamation_buffer_resize: __Reply__mach_vm_deferred_reclamation_buffer_resize_t }
  | { Reply_mach_vm_update_pointers_with_remote_tags: __Reply__mach_vm_update_pointers_with_remote_tags_t }
  | { Reply_mach_vm_deferred_reclamation_buffer_query: __Reply__mach_vm_deferred_reclamation_buffer_query_t }
  | { Reply_mach_vm_reallocate: __Reply__mach_vm_reallocate_t };

declare class __ReplyUnion__mach_vm_subsystem {
  constructor(init?: __ReplyUnion__mach_vm_subsystemDescriptor);
  Reply_mach_vm_allocate: __Reply__mach_vm_allocate_t;
  Reply_mach_vm_deallocate: __Reply__mach_vm_deallocate_t;
  Reply_mach_vm_protect: __Reply__mach_vm_protect_t;
  Reply_mach_vm_inherit: __Reply__mach_vm_inherit_t;
  Reply_mach_vm_read: __Reply__mach_vm_read_t;
  Reply_mach_vm_read_list: __Reply__mach_vm_read_list_t;
  Reply_mach_vm_write: __Reply__mach_vm_write_t;
  Reply_mach_vm_copy: __Reply__mach_vm_copy_t;
  Reply_mach_vm_read_overwrite: __Reply__mach_vm_read_overwrite_t;
  Reply_mach_vm_msync: __Reply__mach_vm_msync_t;
  Reply_mach_vm_behavior_set: __Reply__mach_vm_behavior_set_t;
  Reply_mach_vm_map: __Reply__mach_vm_map_t;
  Reply_mach_vm_machine_attribute: __Reply__mach_vm_machine_attribute_t;
  Reply_mach_vm_remap: __Reply__mach_vm_remap_t;
  Reply_mach_vm_page_query: __Reply__mach_vm_page_query_t;
  Reply_mach_vm_region_recurse: __Reply__mach_vm_region_recurse_t;
  Reply_mach_vm_region: __Reply__mach_vm_region_t;
  Reply__mach_make_memory_entry: __Reply___mach_make_memory_entry_t;
  Reply_mach_vm_purgable_control: __Reply__mach_vm_purgable_control_t;
  Reply_mach_vm_page_info: __Reply__mach_vm_page_info_t;
  Reply_mach_vm_page_range_query: __Reply__mach_vm_page_range_query_t;
  Reply_mach_vm_remap_new: __Reply__mach_vm_remap_new_t;
  Reply_mach_vm_deferred_reclamation_buffer_allocate: __Reply__mach_vm_deferred_reclamation_buffer_allocate_t;
  Reply_mach_vm_deferred_reclamation_buffer_flush: __Reply__mach_vm_deferred_reclamation_buffer_flush_t;
  Reply_mach_vm_range_create: __Reply__mach_vm_range_create_t;
  Reply_mach_vm_deferred_reclamation_buffer_resize: __Reply__mach_vm_deferred_reclamation_buffer_resize_t;
  Reply_mach_vm_update_pointers_with_remote_tags: __Reply__mach_vm_update_pointers_with_remote_tags_t;
  Reply_mach_vm_deferred_reclamation_buffer_query: __Reply__mach_vm_deferred_reclamation_buffer_query_t;
  Reply_mach_vm_reallocate: __Reply__mach_vm_reallocate_t;
}

type __ReplyUnion__clock_subsystemDescriptor = 
  | { Reply_clock_get_time: __Reply__clock_get_time_t }
  | { Reply_clock_get_attributes: __Reply__clock_get_attributes_t }
  | { Reply_clock_alarm: __Reply__clock_alarm_t };

declare class __ReplyUnion__clock_subsystem {
  constructor(init?: __ReplyUnion__clock_subsystemDescriptor);
  Reply_clock_get_time: __Reply__clock_get_time_t;
  Reply_clock_get_attributes: __Reply__clock_get_attributes_t;
  Reply_clock_alarm: __Reply__clock_alarm_t;
}

type __RequestUnion__catch_exc_subsystemDescriptor = 
  | { Request_exception_raise: __Request__exception_raise_t }
  | { Request_exception_raise_state: __Request__exception_raise_state_t }
  | { Request_exception_raise_state_identity: __Request__exception_raise_state_identity_t };

declare class __RequestUnion__catch_exc_subsystem {
  constructor(init?: __RequestUnion__catch_exc_subsystemDescriptor);
  Request_exception_raise: __Request__exception_raise_t;
  Request_exception_raise_state: __Request__exception_raise_state_t;
  Request_exception_raise_state_identity: __Request__exception_raise_state_identity_t;
}

type __RequestUnion__receive_vfs_nspace_subsystemDescriptor = 
  | { Request_nspace_handle: __Request__nspace_handle_t }
  | { Request_nspace_resolve_cancel: __Request__nspace_resolve_cancel_t }
  | { Request_nspace_resolve_path: __Request__nspace_resolve_path_t }
  | { Request_vfs_resolve_file: __Request__vfs_resolve_file_t }
  | { Request_vfs_resolve_dir: __Request__vfs_resolve_dir_t }
  | { Request_vfs_resolve_file_with_audit_token: __Request__vfs_resolve_file_with_audit_token_t }
  | { Request_vfs_resolve_dir_with_audit_token: __Request__vfs_resolve_dir_with_audit_token_t }
  | { Request_vfs_resolve_reparent_with_audit_token: __Request__vfs_resolve_reparent_with_audit_token_t };

declare class __RequestUnion__receive_vfs_nspace_subsystem {
  constructor(init?: __RequestUnion__receive_vfs_nspace_subsystemDescriptor);
  Request_nspace_handle: __Request__nspace_handle_t;
  Request_nspace_resolve_cancel: __Request__nspace_resolve_cancel_t;
  Request_nspace_resolve_path: __Request__nspace_resolve_path_t;
  Request_vfs_resolve_file: __Request__vfs_resolve_file_t;
  Request_vfs_resolve_dir: __Request__vfs_resolve_dir_t;
  Request_vfs_resolve_file_with_audit_token: __Request__vfs_resolve_file_with_audit_token_t;
  Request_vfs_resolve_dir_with_audit_token: __Request__vfs_resolve_dir_with_audit_token_t;
  Request_vfs_resolve_reparent_with_audit_token: __Request__vfs_resolve_reparent_with_audit_token_t;
}

type __RequestUnion__arcade_upcall_subsystemDescriptor = 
  | { Request_arcade_upcall: __Request__arcade_upcall_t };

declare class __RequestUnion__arcade_upcall_subsystem {
  constructor(init?: __RequestUnion__arcade_upcall_subsystemDescriptor);
  Request_arcade_upcall: __Request__arcade_upcall_t;
}

type __RequestUnion__audit_triggers_subsystemDescriptor = 
  | { Request_audit_triggers: __Request__audit_triggers_t }
  | { Request_audit_analytics: __Request__audit_analytics_t };

declare class __RequestUnion__audit_triggers_subsystem {
  constructor(init?: __RequestUnion__audit_triggers_subsystemDescriptor);
  Request_audit_triggers: __Request__audit_triggers_t;
  Request_audit_analytics: __Request__audit_analytics_t;
}

type __RequestUnion__mach_voucher_attr_control_subsystemDescriptor = 
  | { Request_mach_voucher_attr_control_get_values: __Request__mach_voucher_attr_control_get_values_t }
  | { Request_mach_voucher_attr_control_create_mach_voucher: __Request__mach_voucher_attr_control_create_mach_voucher_t };

declare class __RequestUnion__mach_voucher_attr_control_subsystem {
  constructor(init?: __RequestUnion__mach_voucher_attr_control_subsystemDescriptor);
  Request_mach_voucher_attr_control_get_values: __Request__mach_voucher_attr_control_get_values_t;
  Request_mach_voucher_attr_control_create_mach_voucher: __Request__mach_voucher_attr_control_create_mach_voucher_t;
}

type __RequestUnion__mach_voucher_subsystemDescriptor = 
  | { Request_mach_voucher_extract_attr_content: __Request__mach_voucher_extract_attr_content_t }
  | { Request_mach_voucher_extract_attr_recipe: __Request__mach_voucher_extract_attr_recipe_t }
  | { Request_mach_voucher_extract_all_attr_recipes: __Request__mach_voucher_extract_all_attr_recipes_t }
  | { Request_mach_voucher_attr_command: __Request__mach_voucher_attr_command_t }
  | { Request_mach_voucher_debug_info: __Request__mach_voucher_debug_info_t };

declare class __RequestUnion__mach_voucher_subsystem {
  constructor(init?: __RequestUnion__mach_voucher_subsystemDescriptor);
  Request_mach_voucher_extract_attr_content: __Request__mach_voucher_extract_attr_content_t;
  Request_mach_voucher_extract_attr_recipe: __Request__mach_voucher_extract_attr_recipe_t;
  Request_mach_voucher_extract_all_attr_recipes: __Request__mach_voucher_extract_all_attr_recipes_t;
  Request_mach_voucher_attr_command: __Request__mach_voucher_attr_command_t;
  Request_mach_voucher_debug_info: __Request__mach_voucher_debug_info_t;
}

type __ReplyUnion__catch_mach_exc_subsystemDescriptor = 
  | { Reply_mach_exception_raise: __Reply__mach_exception_raise_t }
  | { Reply_mach_exception_raise_state: __Reply__mach_exception_raise_state_t }
  | { Reply_mach_exception_raise_state_identity: __Reply__mach_exception_raise_state_identity_t };

declare class __ReplyUnion__catch_mach_exc_subsystem {
  constructor(init?: __ReplyUnion__catch_mach_exc_subsystemDescriptor);
  Reply_mach_exception_raise: __Reply__mach_exception_raise_t;
  Reply_mach_exception_raise_state: __Reply__mach_exception_raise_state_t;
  Reply_mach_exception_raise_state_identity: __Reply__mach_exception_raise_state_identity_t;
}

type __RequestUnion__catch_mach_exc_subsystemDescriptor = 
  | { Request_mach_exception_raise: __Request__mach_exception_raise_t }
  | { Request_mach_exception_raise_state: __Request__mach_exception_raise_state_t }
  | { Request_mach_exception_raise_state_identity: __Request__mach_exception_raise_state_identity_t };

declare class __RequestUnion__catch_mach_exc_subsystem {
  constructor(init?: __RequestUnion__catch_mach_exc_subsystemDescriptor);
  Request_mach_exception_raise: __Request__mach_exception_raise_t;
  Request_mach_exception_raise_state: __Request__mach_exception_raise_state_t;
  Request_mach_exception_raise_state_identity: __Request__mach_exception_raise_state_identity_t;
}

type __ReplyUnion__send_vfs_nspace_subsystemDescriptor = 
  | { Reply_send_nspace_handle: __Reply__nspace_handle_t }
  | { Reply_send_nspace_resolve_cancel: __Reply__nspace_resolve_cancel_t }
  | { Reply_send_nspace_resolve_path: __Reply__nspace_resolve_path_t }
  | { Reply_send_vfs_resolve_file: __Reply__vfs_resolve_file_t }
  | { Reply_send_vfs_resolve_dir: __Reply__vfs_resolve_dir_t }
  | { Reply_send_vfs_resolve_file_with_audit_token: __Reply__vfs_resolve_file_with_audit_token_t }
  | { Reply_send_vfs_resolve_dir_with_audit_token: __Reply__vfs_resolve_dir_with_audit_token_t }
  | { Reply_send_vfs_resolve_reparent_with_audit_token: __Reply__vfs_resolve_reparent_with_audit_token_t };

declare class __ReplyUnion__send_vfs_nspace_subsystem {
  constructor(init?: __ReplyUnion__send_vfs_nspace_subsystemDescriptor);
  Reply_send_nspace_handle: __Reply__nspace_handle_t;
  Reply_send_nspace_resolve_cancel: __Reply__nspace_resolve_cancel_t;
  Reply_send_nspace_resolve_path: __Reply__nspace_resolve_path_t;
  Reply_send_vfs_resolve_file: __Reply__vfs_resolve_file_t;
  Reply_send_vfs_resolve_dir: __Reply__vfs_resolve_dir_t;
  Reply_send_vfs_resolve_file_with_audit_token: __Reply__vfs_resolve_file_with_audit_token_t;
  Reply_send_vfs_resolve_dir_with_audit_token: __Reply__vfs_resolve_dir_with_audit_token_t;
  Reply_send_vfs_resolve_reparent_with_audit_token: __Reply__vfs_resolve_reparent_with_audit_token_t;
}

type __ReplyUnion__task_access_subsystemDescriptor = 
  | { Reply_check_task_access: __Reply__check_task_access_t }
  | { Reply_find_code_signature: __Reply__find_code_signature_t }
  | { Reply_check_task_access_with_flavor: __Reply__check_task_access_with_flavor_t };

declare class __ReplyUnion__task_access_subsystem {
  constructor(init?: __ReplyUnion__task_access_subsystemDescriptor);
  Reply_check_task_access: __Reply__check_task_access_t;
  Reply_find_code_signature: __Reply__find_code_signature_t;
  Reply_check_task_access_with_flavor: __Reply__check_task_access_with_flavor_t;
}

type __RequestUnion__task_access_subsystemDescriptor = 
  | { Request_check_task_access: __Request__check_task_access_t }
  | { Request_find_code_signature: __Request__find_code_signature_t }
  | { Request_check_task_access_with_flavor: __Request__check_task_access_with_flavor_t };

declare class __RequestUnion__task_access_subsystem {
  constructor(init?: __RequestUnion__task_access_subsystemDescriptor);
  Request_check_task_access: __Request__check_task_access_t;
  Request_find_code_signature: __Request__find_code_signature_t;
  Request_check_task_access_with_flavor: __Request__check_task_access_with_flavor_t;
}

type __ReplyUnion__receive_sysdiagnose_notification_subsystemDescriptor = 
  | { Reply_sysdiagnose_notification: __Reply__sysdiagnose_notification_t }
  | { Reply_sysdiagnose_notification_with_audit_token: __Reply__sysdiagnose_notification_with_audit_token_t };

declare class __ReplyUnion__receive_sysdiagnose_notification_subsystem {
  constructor(init?: __ReplyUnion__receive_sysdiagnose_notification_subsystemDescriptor);
  Reply_sysdiagnose_notification: __Reply__sysdiagnose_notification_t;
  Reply_sysdiagnose_notification_with_audit_token: __Reply__sysdiagnose_notification_with_audit_token_t;
}

type __ReplyUnion__receive_vfs_nspace_subsystemDescriptor = 
  | { Reply_nspace_handle: __Reply__nspace_handle_t }
  | { Reply_nspace_resolve_cancel: __Reply__nspace_resolve_cancel_t }
  | { Reply_nspace_resolve_path: __Reply__nspace_resolve_path_t }
  | { Reply_vfs_resolve_file: __Reply__vfs_resolve_file_t }
  | { Reply_vfs_resolve_dir: __Reply__vfs_resolve_dir_t }
  | { Reply_vfs_resolve_file_with_audit_token: __Reply__vfs_resolve_file_with_audit_token_t }
  | { Reply_vfs_resolve_dir_with_audit_token: __Reply__vfs_resolve_dir_with_audit_token_t }
  | { Reply_vfs_resolve_reparent_with_audit_token: __Reply__vfs_resolve_reparent_with_audit_token_t };

declare class __ReplyUnion__receive_vfs_nspace_subsystem {
  constructor(init?: __ReplyUnion__receive_vfs_nspace_subsystemDescriptor);
  Reply_nspace_handle: __Reply__nspace_handle_t;
  Reply_nspace_resolve_cancel: __Reply__nspace_resolve_cancel_t;
  Reply_nspace_resolve_path: __Reply__nspace_resolve_path_t;
  Reply_vfs_resolve_file: __Reply__vfs_resolve_file_t;
  Reply_vfs_resolve_dir: __Reply__vfs_resolve_dir_t;
  Reply_vfs_resolve_file_with_audit_token: __Reply__vfs_resolve_file_with_audit_token_t;
  Reply_vfs_resolve_dir_with_audit_token: __Reply__vfs_resolve_dir_with_audit_token_t;
  Reply_vfs_resolve_reparent_with_audit_token: __Reply__vfs_resolve_reparent_with_audit_token_t;
}

type __RequestUnion__receive_sysdiagnose_notification_subsystemDescriptor = 
  | { Request_sysdiagnose_notification: __Request__sysdiagnose_notification_t }
  | { Request_sysdiagnose_notification_with_audit_token: __Request__sysdiagnose_notification_with_audit_token_t };

declare class __RequestUnion__receive_sysdiagnose_notification_subsystem {
  constructor(init?: __RequestUnion__receive_sysdiagnose_notification_subsystemDescriptor);
  Request_sysdiagnose_notification: __Request__sysdiagnose_notification_t;
  Request_sysdiagnose_notification_with_audit_token: __Request__sysdiagnose_notification_with_audit_token_t;
}

type __ReplyUnion__clock_reply_subsystemDescriptor = 
  | { Reply_clock_alarm_reply: __Reply__clock_alarm_reply_t };

declare class __ReplyUnion__clock_reply_subsystem {
  constructor(init?: __ReplyUnion__clock_reply_subsystemDescriptor);
  Reply_clock_alarm_reply: __Reply__clock_alarm_reply_t;
}

type __RequestUnion__clock_reply_subsystemDescriptor = 
  | { Request_clock_alarm_reply: __Request__clock_alarm_reply_t };

declare class __RequestUnion__clock_reply_subsystem {
  constructor(init?: __RequestUnion__clock_reply_subsystemDescriptor);
  Request_clock_alarm_reply: __Request__clock_alarm_reply_t;
}

type __ReplyUnion__send_ktrace_background_subsystemDescriptor = 
  | { Reply_send_ktrace_background_available: __Reply__ktrace_background_available_t };

declare class __ReplyUnion__send_ktrace_background_subsystem {
  constructor(init?: __ReplyUnion__send_ktrace_background_subsystemDescriptor);
  Reply_send_ktrace_background_available: __Reply__ktrace_background_available_t;
}

type __RequestUnion__send_ktrace_background_subsystemDescriptor = 
  | { Request_send_ktrace_background_available: __Request__ktrace_background_available_t };

declare class __RequestUnion__send_ktrace_background_subsystem {
  constructor(init?: __RequestUnion__send_ktrace_background_subsystemDescriptor);
  Request_send_ktrace_background_available: __Request__ktrace_background_available_t;
}

type __RequestUnion__memory_error_notification_subsystemDescriptor = 
  | { Request_memory_error_notification: __Request__memory_error_notification_t }
  | { Request_mcc_memory_error_notification: __Request__mcc_memory_error_notification_t }
  | { Request_llc_memory_error_notification: __Request__llc_memory_error_notification_t };

declare class __RequestUnion__memory_error_notification_subsystem {
  constructor(init?: __RequestUnion__memory_error_notification_subsystemDescriptor);
  Request_memory_error_notification: __Request__memory_error_notification_t;
  Request_mcc_memory_error_notification: __Request__mcc_memory_error_notification_t;
  Request_llc_memory_error_notification: __Request__llc_memory_error_notification_t;
}

type arm_isa_feat1_regDescriptor = 
  | { value: number }
  | { field: syscp_ID_instructions_feat_1_reg };

declare class arm_isa_feat1_reg {
  constructor(init?: arm_isa_feat1_regDescriptor);
  value: number;
  field: syscp_ID_instructions_feat_1_reg;
}

type __RequestUnion__telemetry_notification_subsystemDescriptor = 
  | { Request_telemetry_notification: __Request__telemetry_notification_t };

declare class __RequestUnion__telemetry_notification_subsystem {
  constructor(init?: __RequestUnion__telemetry_notification_subsystemDescriptor);
  Request_telemetry_notification: __Request__telemetry_notification_t;
}

type __ReplyUnion__coalition_notification_subsystemDescriptor = 
  | { Reply_coalition_notification: __Reply__coalition_notification_t };

declare class __ReplyUnion__coalition_notification_subsystem {
  constructor(init?: __ReplyUnion__coalition_notification_subsystemDescriptor);
  Reply_coalition_notification: __Reply__coalition_notification_t;
}

type __ReplyUnion__fairplay_subsystemDescriptor = 
  | { Reply_fairplayd_arcade_request: __Reply__fairplayd_arcade_request_t };

declare class __ReplyUnion__fairplay_subsystem {
  constructor(init?: __ReplyUnion__fairplay_subsystemDescriptor);
  Reply_fairplayd_arcade_request: __Reply__fairplayd_arcade_request_t;
}

type __RequestUnion__fairplay_subsystemDescriptor = 
  | { Request_fairplayd_arcade_request: __Request__fairplayd_arcade_request_t };

declare class __RequestUnion__fairplay_subsystem {
  constructor(init?: __RequestUnion__fairplay_subsystemDescriptor);
  Request_fairplayd_arcade_request: __Request__fairplayd_arcade_request_t;
}

type __RequestUnion__gssd_mach_subsystemDescriptor = 
  | { Request_mach_gss_init_sec_context: __Request__mach_gss_init_sec_context_t }
  | { Request_mach_gss_accept_sec_context: __Request__mach_gss_accept_sec_context_t }
  | { Request_mach_gss_log_error: __Request__mach_gss_log_error_t }
  | { Request_mach_gss_init_sec_context_v2: __Request__mach_gss_init_sec_context_v2_t }
  | { Request_mach_gss_accept_sec_context_v2: __Request__mach_gss_accept_sec_context_v2_t }
  | { Request_mach_gss_init_sec_context_v3: __Request__mach_gss_init_sec_context_v3_t }
  | { Request_mach_gss_hold_cred: __Request__mach_gss_hold_cred_t }
  | { Request_mach_gss_unhold_cred: __Request__mach_gss_unhold_cred_t }
  | { Request_mach_gss_lookup: __Request__mach_gss_lookup_t };

declare class __RequestUnion__gssd_mach_subsystem {
  constructor(init?: __RequestUnion__gssd_mach_subsystemDescriptor);
  Request_mach_gss_init_sec_context: __Request__mach_gss_init_sec_context_t;
  Request_mach_gss_accept_sec_context: __Request__mach_gss_accept_sec_context_t;
  Request_mach_gss_log_error: __Request__mach_gss_log_error_t;
  Request_mach_gss_init_sec_context_v2: __Request__mach_gss_init_sec_context_v2_t;
  Request_mach_gss_accept_sec_context_v2: __Request__mach_gss_accept_sec_context_v2_t;
  Request_mach_gss_init_sec_context_v3: __Request__mach_gss_init_sec_context_v3_t;
  Request_mach_gss_hold_cred: __Request__mach_gss_hold_cred_t;
  Request_mach_gss_unhold_cred: __Request__mach_gss_unhold_cred_t;
  Request_mach_gss_lookup: __Request__mach_gss_lookup_t;
}

type __ReplyUnion__doubleagent_subsystemDescriptor = 
  | { Reply_doubleagent_lookup_xattr: __Reply__doubleagent_lookup_xattr_t }
  | { Reply_doubleagent_allocate_xattr: __Reply__doubleagent_allocate_xattr_t }
  | { Reply_doubleagent_list_xattrs: __Reply__doubleagent_list_xattrs_t }
  | { Reply_doubleagent_remove_xattr: __Reply__doubleagent_remove_xattr_t };

declare class __ReplyUnion__doubleagent_subsystem {
  constructor(init?: __ReplyUnion__doubleagent_subsystemDescriptor);
  Reply_doubleagent_lookup_xattr: __Reply__doubleagent_lookup_xattr_t;
  Reply_doubleagent_allocate_xattr: __Reply__doubleagent_allocate_xattr_t;
  Reply_doubleagent_list_xattrs: __Reply__doubleagent_list_xattrs_t;
  Reply_doubleagent_remove_xattr: __Reply__doubleagent_remove_xattr_t;
}

type __ReplyUnion__do_notify_subsystemDescriptor = 
  | { Reply_mach_notify_port_deleted: __Reply__mach_notify_port_deleted_t }
  | { Reply_mach_notify_port_destroyed: __Reply__mach_notify_port_destroyed_t }
  | { Reply_mach_notify_no_senders: __Reply__mach_notify_no_senders_t }
  | { Reply_mach_notify_send_once: __Reply__mach_notify_send_once_t }
  | { Reply_mach_notify_dead_name: __Reply__mach_notify_dead_name_t };

declare class __ReplyUnion__do_notify_subsystem {
  constructor(init?: __ReplyUnion__do_notify_subsystemDescriptor);
  Reply_mach_notify_port_deleted: __Reply__mach_notify_port_deleted_t;
  Reply_mach_notify_port_destroyed: __Reply__mach_notify_port_destroyed_t;
  Reply_mach_notify_no_senders: __Reply__mach_notify_no_senders_t;
  Reply_mach_notify_send_once: __Reply__mach_notify_send_once_t;
  Reply_mach_notify_dead_name: __Reply__mach_notify_dead_name_t;
}

type __RequestUnion__do_notify_subsystemDescriptor = 
  | { Request_mach_notify_port_deleted: __Request__mach_notify_port_deleted_t }
  | { Request_mach_notify_port_destroyed: __Request__mach_notify_port_destroyed_t }
  | { Request_mach_notify_no_senders: __Request__mach_notify_no_senders_t }
  | { Request_mach_notify_send_once: __Request__mach_notify_send_once_t }
  | { Request_mach_notify_dead_name: __Request__mach_notify_dead_name_t };

declare class __RequestUnion__do_notify_subsystem {
  constructor(init?: __RequestUnion__do_notify_subsystemDescriptor);
  Request_mach_notify_port_deleted: __Request__mach_notify_port_deleted_t;
  Request_mach_notify_port_destroyed: __Request__mach_notify_port_destroyed_t;
  Request_mach_notify_no_senders: __Request__mach_notify_no_senders_t;
  Request_mach_notify_send_once: __Request__mach_notify_send_once_t;
  Request_mach_notify_dead_name: __Request__mach_notify_dead_name_t;
}

type airship_acipc_cr_mirror_element_dataDescriptor = 
  | { completion_record: airship_acipc_cr_mirror_completion_record }
  | { raw_descriptor: airship_acipc_cr_mirror_raw_descriptor };

declare class airship_acipc_cr_mirror_element_data {
  constructor(init?: airship_acipc_cr_mirror_element_dataDescriptor);
  completion_record: airship_acipc_cr_mirror_completion_record;
  raw_descriptor: airship_acipc_cr_mirror_raw_descriptor;
}

type __ReplyUnion__upl_subsystemDescriptor = 
  | { Reply_upl_abort: __Reply__upl_abort_t }
  | { Reply_upl_abort_range: __Reply__upl_abort_range_t }
  | { Reply_upl_commit: __Reply__upl_commit_t }
  | { Reply_upl_commit_range: __Reply__upl_commit_range_t };

declare class __ReplyUnion__upl_subsystem {
  constructor(init?: __ReplyUnion__upl_subsystemDescriptor);
  Reply_upl_abort: __Reply__upl_abort_t;
  Reply_upl_abort_range: __Reply__upl_abort_range_t;
  Reply_upl_commit: __Reply__upl_commit_t;
  Reply_upl_commit_range: __Reply__upl_commit_range_t;
}

type __ReplyUnion__lockd_mach_subsystemDescriptor = 
  | { Reply_lockd_request: __Reply__lockd_request_t }
  | { Reply_lockd_ping: __Reply__lockd_ping_t }
  | { Reply_lockd_shutdown: __Reply__lockd_shutdown_t };

declare class __ReplyUnion__lockd_mach_subsystem {
  constructor(init?: __ReplyUnion__lockd_mach_subsystemDescriptor);
  Reply_lockd_request: __Reply__lockd_request_t;
  Reply_lockd_ping: __Reply__lockd_ping_t;
  Reply_lockd_shutdown: __Reply__lockd_shutdown_t;
}

type __RequestUnion__lockd_mach_subsystemDescriptor = 
  | { Request_lockd_request: __Request__lockd_request_t }
  | { Request_lockd_ping: __Request__lockd_ping_t }
  | { Request_lockd_shutdown: __Request__lockd_shutdown_t };

declare class __RequestUnion__lockd_mach_subsystem {
  constructor(init?: __RequestUnion__lockd_mach_subsystemDescriptor);
  Request_lockd_request: __Request__lockd_request_t;
  Request_lockd_ping: __Request__lockd_ping_t;
  Request_lockd_shutdown: __Request__lockd_shutdown_t;
}

type vm32_size_struct_tDescriptor = 
  | { UNSAFE: number };

declare class vm32_size_struct_t {
  constructor(init?: vm32_size_struct_tDescriptor);
  UNSAFE: number;
}

type unnamed_16762558694368875046Descriptor = 
  | { cpg: number }
  | { sgs: number };

declare class unnamed_16762558694368875046 {
  constructor(init?: unnamed_16762558694368875046Descriptor);
  cpg: number;
  sgs: number;
}

type arm_debug_dbgdidrDescriptor = 
  | { debug_id: unnamed_12832443407998816313 }
  | { value: number };

declare class arm_debug_dbgdidr {
  constructor(init?: arm_debug_dbgdidrDescriptor);
  debug_id: unnamed_12832443407998816313;
  value: number;
}

type idt_entryDescriptor = 
  | { trap_gate: trap_gate }
  | { intr_gate: intr_gate }
  | { task_gate: task_gate };

declare class idt_entry {
  constructor(init?: idt_entryDescriptor);
  trap_gate: trap_gate;
  intr_gate: intr_gate;
  task_gate: task_gate;
}

type gdt_entryDescriptor = 
  | { code: code_desc }
  | { data: data_desc }
  | { ldt: ldt_desc }
  | { call_gate: call_gate }
  | { task_gate: task_gate }
  | { task_state: tss_desc };

declare class gdt_entry {
  constructor(init?: gdt_entryDescriptor);
  code: code_desc;
  data: data_desc;
  ldt: ldt_desc;
  call_gate: call_gate;
  task_gate: task_gate;
  task_state: tss_desc;
}

type dt_entryDescriptor = 
  | { code: code_desc }
  | { data: data_desc }
  | { ldt: ldt_desc }
  | { task_state: tss_desc }
  | { call_gate: call_gate }
  | { trap_gate: trap_gate }
  | { intr_gate: intr_gate }
  | { task_gate: task_gate };

declare class dt_entry {
  constructor(init?: dt_entryDescriptor);
  code: code_desc;
  data: data_desc;
  ldt: ldt_desc;
  task_state: tss_desc;
  call_gate: call_gate;
  trap_gate: trap_gate;
  intr_gate: intr_gate;
  task_gate: task_gate;
}

type sockaddr_in_4_6Descriptor = 
  | { sa: sockaddr }
  | { sah: __sockaddr_header }
  | { sin: sockaddr_in }
  | { sin6: sockaddr_in6 };

declare class sockaddr_in_4_6 {
  constructor(init?: sockaddr_in_4_6Descriptor);
  sa: sockaddr;
  sah: __sockaddr_header;
  sin: sockaddr_in;
  sin6: sockaddr_in6;
}

type unnamed_15139511001915224071Descriptor = 
  | { sin_zero: unknown /* const array */ }
  | { _in_index: unnamed_9822756730449729753 };

declare class unnamed_15139511001915224071 {
  constructor(init?: unnamed_15139511001915224071Descriptor);
  sin_zero: unknown /* const array */;
  _in_index: unnamed_9822756730449729753;
}

type __RequestUnion__clock_subsystemDescriptor = 
  | { Request_clock_get_time: __Request__clock_get_time_t }
  | { Request_clock_get_attributes: __Request__clock_get_attributes_t }
  | { Request_clock_alarm: __Request__clock_alarm_t };

declare class __RequestUnion__clock_subsystem {
  constructor(init?: __RequestUnion__clock_subsystemDescriptor);
  Request_clock_get_time: __Request__clock_get_time_t;
  Request_clock_get_attributes: __Request__clock_get_attributes_t;
  Request_clock_alarm: __Request__clock_alarm_t;
}

type unnamed_13907781885479186503Descriptor = 
  | { _itpl_sa: sockaddr }
  | { _itpl_sah: __sockaddr_header }
  | { _itpl_sin: sockaddr_in }
  | { _itpl_sin6: sockaddr_in6 };

declare class unnamed_13907781885479186503 {
  constructor(init?: unnamed_13907781885479186503Descriptor);
  _itpl_sa: sockaddr;
  _itpl_sah: __sockaddr_header;
  _itpl_sin: sockaddr_in;
  _itpl_sin6: sockaddr_in6;
}

type unnamed_16564182229133887322Descriptor = 
  | { _itpl_sa: sockaddr }
  | { _itpl_sah: __sockaddr_header }
  | { _itpl_sin: sockaddr_in }
  | { _itpl_sin6: sockaddr_in6 };

declare class unnamed_16564182229133887322 {
  constructor(init?: unnamed_16564182229133887322Descriptor);
  _itpl_sa: sockaddr;
  _itpl_sah: __sockaddr_header;
  _itpl_sin: sockaddr_in;
  _itpl_sin6: sockaddr_in6;
}

type unnamed_389715986675296527Descriptor = 
  | { sa_nwk_status_int: number };

declare class unnamed_389715986675296527 {
  constructor(init?: unnamed_389715986675296527Descriptor);
  sa_nwk_status_int: number;
}

type __ReplyUnion__catch_exc_subsystemDescriptor = 
  | { Reply_exception_raise: __Reply__exception_raise_t }
  | { Reply_exception_raise_state: __Reply__exception_raise_state_t }
  | { Reply_exception_raise_state_identity: __Reply__exception_raise_state_identity_t };

declare class __ReplyUnion__catch_exc_subsystem {
  constructor(init?: __ReplyUnion__catch_exc_subsystemDescriptor);
  Reply_exception_raise: __Reply__exception_raise_t;
  Reply_exception_raise_state: __Reply__exception_raise_state_t;
  Reply_exception_raise_state_identity: __Reply__exception_raise_state_identity_t;
}

type unnamed_5233592760029389811Descriptor = 
  | { queueStateVal: unknown /* volatile _Atomic(unsigned __int128) (CXTypeKind: 177) */ }
  | { __queueState: IOCircularDataQueueState };

declare class unnamed_5233592760029389811 {
  constructor(init?: unnamed_5233592760029389811Descriptor);
  queueStateVal: unknown /* volatile _Atomic(unsigned __int128) (CXTypeKind: 177) */;
  __queueState: IOCircularDataQueueState;
}

type IOCircularDataQueueStateDescriptor = 
  | { val: bigint }
  | { fields: unnamed_14229012674224057930 };

declare class IOCircularDataQueueState {
  constructor(init?: IOCircularDataQueueStateDescriptor);
  val: bigint;
  fields: unnamed_14229012674224057930;
}

type unnamed_7508679389152120588Descriptor = 
  | { sa_nwk_status: number };

declare class unnamed_7508679389152120588 {
  constructor(init?: unnamed_7508679389152120588Descriptor);
  sa_nwk_status: number;
}

type unnamed_408001485480089998Descriptor = 
  | { headerInfoVal: unknown /* volatile _Atomic(unsigned __int128) (CXTypeKind: 177) */ }
  | { __headerInfo: IOCircularDataQueueEntryHeaderInfo };

declare class unnamed_408001485480089998 {
  constructor(init?: unnamed_408001485480089998Descriptor);
  headerInfoVal: unknown /* volatile _Atomic(unsigned __int128) (CXTypeKind: 177) */;
  __headerInfo: IOCircularDataQueueEntryHeaderInfo;
}

type IOCircularDataQueueEntryHeaderInfoDescriptor = 
  | { val: bigint }
  | { fields: unnamed_14099649334180452822 };

declare class IOCircularDataQueueEntryHeaderInfo {
  constructor(init?: IOCircularDataQueueEntryHeaderInfoDescriptor);
  val: bigint;
  fields: unnamed_14099649334180452822;
}

type IOACPIAddressDescriptor = 
  | { addr64: number }
  | { pci: unnamed_5632071315289819367 };

declare class IOACPIAddress {
  constructor(init?: IOACPIAddressDescriptor);
  addr64: number;
  pci: unnamed_5632071315289819367;
}

type unnamed_10211279379047170458Descriptor = 
  | { b8: unknown /* const array */ }
  | { b32: unknown /* const array */ };

declare class unnamed_10211279379047170458 {
  constructor(init?: unnamed_10211279379047170458Descriptor);
  b8: unknown /* const array */;
  b32: unknown /* const array */;
}

type IOPCIAddressSpaceDescriptor = 
  | { bits: number }
  | { s: unnamed_16674912769216290365 }
  | { es: unnamed_468159946417049962 };

declare class IOPCIAddressSpace {
  constructor(init?: IOPCIAddressSpaceDescriptor);
  bits: number;
  s: unnamed_16674912769216290365;
  es: unnamed_468159946417049962;
}

type unnamed_1073308609630588625Descriptor = 
  | { range: unnamed_15028991116108628871 }
  | { notRange: unnamed_895768521341818631 };

declare class unnamed_1073308609630588625 {
  constructor(init?: unnamed_1073308609630588625Descriptor);
  range: unnamed_15028991116108628871;
  notRange: unnamed_895768521341818631;
}

type unnamed_2667027567974653886Descriptor = 
  | { n_strx: number };

declare class unnamed_2667027567974653886 {
  constructor(init?: unnamed_2667027567974653886Descriptor);
  n_strx: number;
}

type unnamed_15145772721269910173Descriptor = 
  | { level: number }
  | { raw: number };

declare class unnamed_15145772721269910173 {
  constructor(init?: unnamed_15145772721269910173Descriptor);
  level: number;
  raw: number;
}

type nfs_quadconvertDescriptor = 
  | { lval: unknown /* const array */ }
  | { qval: number };

declare class nfs_quadconvert {
  constructor(init?: nfs_quadconvertDescriptor);
  lval: unknown /* const array */;
  qval: number;
}

type vm_size_struct_tDescriptor = 
  | { UNSAFE: number };

declare class vm_size_struct_t {
  constructor(init?: vm_size_struct_tDescriptor);
  UNSAFE: number;
}

type semunDescriptor = 
  | { val: number }
  | { buf: interop.PointerConvertible }
  | { array: interop.PointerConvertible };

declare class semun {
  constructor(init?: semunDescriptor);
  val: number;
  buf: interop.Pointer;
  array: interop.Pointer;
}

type __ReplyUnion__gssd_mach_subsystemDescriptor = 
  | { Reply_mach_gss_init_sec_context: __Reply__mach_gss_init_sec_context_t }
  | { Reply_mach_gss_accept_sec_context: __Reply__mach_gss_accept_sec_context_t }
  | { Reply_mach_gss_log_error: __Reply__mach_gss_log_error_t }
  | { Reply_mach_gss_init_sec_context_v2: __Reply__mach_gss_init_sec_context_v2_t }
  | { Reply_mach_gss_accept_sec_context_v2: __Reply__mach_gss_accept_sec_context_v2_t }
  | { Reply_mach_gss_init_sec_context_v3: __Reply__mach_gss_init_sec_context_v3_t }
  | { Reply_mach_gss_hold_cred: __Reply__mach_gss_hold_cred_t }
  | { Reply_mach_gss_unhold_cred: __Reply__mach_gss_unhold_cred_t }
  | { Reply_mach_gss_lookup: __Reply__mach_gss_lookup_t };

declare class __ReplyUnion__gssd_mach_subsystem {
  constructor(init?: __ReplyUnion__gssd_mach_subsystemDescriptor);
  Reply_mach_gss_init_sec_context: __Reply__mach_gss_init_sec_context_t;
  Reply_mach_gss_accept_sec_context: __Reply__mach_gss_accept_sec_context_t;
  Reply_mach_gss_log_error: __Reply__mach_gss_log_error_t;
  Reply_mach_gss_init_sec_context_v2: __Reply__mach_gss_init_sec_context_v2_t;
  Reply_mach_gss_accept_sec_context_v2: __Reply__mach_gss_accept_sec_context_v2_t;
  Reply_mach_gss_init_sec_context_v3: __Reply__mach_gss_init_sec_context_v3_t;
  Reply_mach_gss_hold_cred: __Reply__mach_gss_hold_cred_t;
  Reply_mach_gss_unhold_cred: __Reply__mach_gss_unhold_cred_t;
  Reply_mach_gss_lookup: __Reply__mach_gss_lookup_t;
}

type vm32_addr_struct_tDescriptor = 
  | { UNSAFE: number };

declare class vm32_addr_struct_t {
  constructor(init?: vm32_addr_struct_tDescriptor);
  UNSAFE: number;
}

type unnamed_5473067450059640300Descriptor = 
  | { pad_field: number };

declare class unnamed_5473067450059640300 {
  constructor(init?: unnamed_5473067450059640300Descriptor);
  pad_field: number;
}

type unnamed_16339770963653865466Descriptor = 
  | { NV0: unknown /* const array */ }
  | { NV1: unnamed_5375411979151535343 };

declare class unnamed_16339770963653865466 {
  constructor(init?: unnamed_16339770963653865466Descriptor);
  NV0: unknown /* const array */;
  NV1: unnamed_5375411979151535343;
}

type unnamed_1304348816865981695Descriptor = 
  | { b8: unknown /* const array */ }
  | { b32: unknown /* const array */ };

declare class unnamed_1304348816865981695 {
  constructor(init?: unnamed_1304348816865981695Descriptor);
  b8: unknown /* const array */;
  b32: unknown /* const array */;
}

type __RequestUnion__upl_subsystemDescriptor = 
  | { Request_upl_abort: __Request__upl_abort_t }
  | { Request_upl_abort_range: unnamed_17120838966663620196 }
  | { Request_upl_commit: unnamed_1360006967418615942 }
  | { Request_upl_commit_range: unnamed_10947379444960332943 };

declare class __RequestUnion__upl_subsystem {
  constructor(init?: __RequestUnion__upl_subsystemDescriptor);
  Request_upl_abort: __Request__upl_abort_t;
  Request_upl_abort_range: unnamed_17120838966663620196;
  Request_upl_commit: unnamed_1360006967418615942;
  Request_upl_commit_range: unnamed_10947379444960332943;
}

type unnamed_5383106350436660137Descriptor = 
  | { un_d_packname: unknown /* const array */ }
  | { un_b: unnamed_6405807422710198338 };

declare class unnamed_5383106350436660137 {
  constructor(init?: unnamed_5383106350436660137Descriptor);
  un_d_packname: unknown /* const array */;
  un_b: unnamed_6405807422710198338;
}

type __ReplyUnion__audit_triggers_subsystemDescriptor = 
  | { Reply_audit_triggers: __Reply__audit_triggers_t }
  | { Reply_audit_analytics: __Reply__audit_analytics_t };

declare class __ReplyUnion__audit_triggers_subsystem {
  constructor(init?: __ReplyUnion__audit_triggers_subsystemDescriptor);
  Reply_audit_triggers: __Reply__audit_triggers_t;
  Reply_audit_analytics: __Reply__audit_analytics_t;
}

type unnamed_4351389518475781470Descriptor = 
  | { n_strx: number };

declare class unnamed_4351389518475781470 {
  constructor(init?: unnamed_4351389518475781470Descriptor);
  n_strx: number;
}

type __RequestUnion__coalition_notification_subsystemDescriptor = 
  | { Request_coalition_notification: __Request__coalition_notification_t };

declare class __RequestUnion__coalition_notification_subsystem {
  constructor(init?: __RequestUnion__coalition_notification_subsystemDescriptor);
  Request_coalition_notification: __Request__coalition_notification_t;
}

type sptm_update_disjoint_multipage_op_tDescriptor = 
  | { per_paddr_header: unnamed_17454206900496886574 }
  | { disjoint_op: sptm_disjoint_op_t };

declare class sptm_update_disjoint_multipage_op_t {
  constructor(init?: sptm_update_disjoint_multipage_op_tDescriptor);
  per_paddr_header: unnamed_17454206900496886574;
  disjoint_op: sptm_disjoint_op_t;
}

type unnamed_7126892800148845993Descriptor = 
  | { ih_pptr: number }
  | { ih_gwaddr: in_addr }
  | { ih_idseq: ih_idseq }
  | { ih_void: number }
  | { ih_pmtu: ih_pmtu }
  | { ih_rtradv: ih_rtradv };

declare class unnamed_7126892800148845993 {
  constructor(init?: unnamed_7126892800148845993Descriptor);
  ih_pptr: number;
  ih_gwaddr: in_addr;
  ih_idseq: ih_idseq;
  ih_void: number;
  ih_pmtu: ih_pmtu;
  ih_rtradv: ih_rtradv;
}

type unnamed_17201182400857150891Descriptor = 
  | { eph_x86_do_not_use: number };

declare class unnamed_17201182400857150891 {
  constructor(init?: unnamed_17201182400857150891Descriptor);
  eph_x86_do_not_use: number;
}

type __RequestUnion__mach_vm_subsystemDescriptor = 
  | { Request_mach_vm_allocate: __Request__mach_vm_allocate_t }
  | { Request_mach_vm_deallocate: __Request__mach_vm_deallocate_t }
  | { Request_mach_vm_protect: __Request__mach_vm_protect_t }
  | { Request_mach_vm_inherit: __Request__mach_vm_inherit_t }
  | { Request_mach_vm_read: __Request__mach_vm_read_t }
  | { Request_mach_vm_read_list: __Request__mach_vm_read_list_t }
  | { Request_mach_vm_write: __Request__mach_vm_write_t }
  | { Request_mach_vm_copy: __Request__mach_vm_copy_t }
  | { Request_mach_vm_read_overwrite: __Request__mach_vm_read_overwrite_t }
  | { Request_mach_vm_msync: __Request__mach_vm_msync_t }
  | { Request_mach_vm_behavior_set: __Request__mach_vm_behavior_set_t }
  | { Request_mach_vm_map: __Request__mach_vm_map_t }
  | { Request_mach_vm_machine_attribute: __Request__mach_vm_machine_attribute_t }
  | { Request_mach_vm_remap: __Request__mach_vm_remap_t }
  | { Request_mach_vm_page_query: __Request__mach_vm_page_query_t }
  | { Request_mach_vm_region_recurse: __Request__mach_vm_region_recurse_t }
  | { Request_mach_vm_region: __Request__mach_vm_region_t }
  | { Request__mach_make_memory_entry: __Request___mach_make_memory_entry_t }
  | { Request_mach_vm_purgable_control: __Request__mach_vm_purgable_control_t }
  | { Request_mach_vm_page_info: __Request__mach_vm_page_info_t }
  | { Request_mach_vm_page_range_query: __Request__mach_vm_page_range_query_t }
  | { Request_mach_vm_remap_new: __Request__mach_vm_remap_new_t }
  | { Request_mach_vm_deferred_reclamation_buffer_allocate: __Request__mach_vm_deferred_reclamation_buffer_allocate_t }
  | { Request_mach_vm_deferred_reclamation_buffer_flush: __Request__mach_vm_deferred_reclamation_buffer_flush_t }
  | { Request_mach_vm_range_create: __Request__mach_vm_range_create_t }
  | { Request_mach_vm_deferred_reclamation_buffer_resize: __Request__mach_vm_deferred_reclamation_buffer_resize_t }
  | { Request_mach_vm_update_pointers_with_remote_tags: __Request__mach_vm_update_pointers_with_remote_tags_t }
  | { Request_mach_vm_deferred_reclamation_buffer_query: __Request__mach_vm_deferred_reclamation_buffer_query_t }
  | { Request_mach_vm_reallocate: __Request__mach_vm_reallocate_t };

declare class __RequestUnion__mach_vm_subsystem {
  constructor(init?: __RequestUnion__mach_vm_subsystemDescriptor);
  Request_mach_vm_allocate: __Request__mach_vm_allocate_t;
  Request_mach_vm_deallocate: __Request__mach_vm_deallocate_t;
  Request_mach_vm_protect: __Request__mach_vm_protect_t;
  Request_mach_vm_inherit: __Request__mach_vm_inherit_t;
  Request_mach_vm_read: __Request__mach_vm_read_t;
  Request_mach_vm_read_list: __Request__mach_vm_read_list_t;
  Request_mach_vm_write: __Request__mach_vm_write_t;
  Request_mach_vm_copy: __Request__mach_vm_copy_t;
  Request_mach_vm_read_overwrite: __Request__mach_vm_read_overwrite_t;
  Request_mach_vm_msync: __Request__mach_vm_msync_t;
  Request_mach_vm_behavior_set: __Request__mach_vm_behavior_set_t;
  Request_mach_vm_map: __Request__mach_vm_map_t;
  Request_mach_vm_machine_attribute: __Request__mach_vm_machine_attribute_t;
  Request_mach_vm_remap: __Request__mach_vm_remap_t;
  Request_mach_vm_page_query: __Request__mach_vm_page_query_t;
  Request_mach_vm_region_recurse: __Request__mach_vm_region_recurse_t;
  Request_mach_vm_region: __Request__mach_vm_region_t;
  Request__mach_make_memory_entry: __Request___mach_make_memory_entry_t;
  Request_mach_vm_purgable_control: __Request__mach_vm_purgable_control_t;
  Request_mach_vm_page_info: __Request__mach_vm_page_info_t;
  Request_mach_vm_page_range_query: __Request__mach_vm_page_range_query_t;
  Request_mach_vm_remap_new: __Request__mach_vm_remap_new_t;
  Request_mach_vm_deferred_reclamation_buffer_allocate: __Request__mach_vm_deferred_reclamation_buffer_allocate_t;
  Request_mach_vm_deferred_reclamation_buffer_flush: __Request__mach_vm_deferred_reclamation_buffer_flush_t;
  Request_mach_vm_range_create: __Request__mach_vm_range_create_t;
  Request_mach_vm_deferred_reclamation_buffer_resize: __Request__mach_vm_deferred_reclamation_buffer_resize_t;
  Request_mach_vm_update_pointers_with_remote_tags: __Request__mach_vm_update_pointers_with_remote_tags_t;
  Request_mach_vm_deferred_reclamation_buffer_query: __Request__mach_vm_deferred_reclamation_buffer_query_t;
  Request_mach_vm_reallocate: __Request__mach_vm_reallocate_t;
}

type unnamed_15726182340047559911Descriptor = 
  | { sadb_x_sa2_reserved2: number };

declare class unnamed_15726182340047559911 {
  constructor(init?: unnamed_15726182340047559911Descriptor);
  sadb_x_sa2_reserved2: number;
}

type unnamed_8538442842817973944Descriptor = 
  | { xrlu_addr: sockaddr }
  | { xrlu_dummy1: unknown /* const array */ };

declare class unnamed_8538442842817973944 {
  constructor(init?: unnamed_8538442842817973944Descriptor);
  xrlu_addr: sockaddr;
  xrlu_dummy1: unknown /* const array */;
}

type __ReplyUnion__mach_voucher_subsystemDescriptor = 
  | { Reply_mach_voucher_extract_attr_content: __Reply__mach_voucher_extract_attr_content_t }
  | { Reply_mach_voucher_extract_attr_recipe: __Reply__mach_voucher_extract_attr_recipe_t }
  | { Reply_mach_voucher_extract_all_attr_recipes: __Reply__mach_voucher_extract_all_attr_recipes_t }
  | { Reply_mach_voucher_attr_command: __Reply__mach_voucher_attr_command_t }
  | { Reply_mach_voucher_debug_info: __Reply__mach_voucher_debug_info_t };

declare class __ReplyUnion__mach_voucher_subsystem {
  constructor(init?: __ReplyUnion__mach_voucher_subsystemDescriptor);
  Reply_mach_voucher_extract_attr_content: __Reply__mach_voucher_extract_attr_content_t;
  Reply_mach_voucher_extract_attr_recipe: __Reply__mach_voucher_extract_attr_recipe_t;
  Reply_mach_voucher_extract_all_attr_recipes: __Reply__mach_voucher_extract_all_attr_recipes_t;
  Reply_mach_voucher_attr_command: __Reply__mach_voucher_attr_command_t;
  Reply_mach_voucher_debug_info: __Reply__mach_voucher_debug_info_t;
}

type unnamed_10177877263919051962Descriptor = 
  | { ether_type: number }
  | { sap: unknown /* const array */ }
  | { snap: unknown /* const array */ }
  | { other: unknown /* const array */ };

declare class unnamed_10177877263919051962 {
  constructor(init?: unnamed_10177877263919051962Descriptor);
  ether_type: number;
  sap: unknown /* const array */;
  snap: unknown /* const array */;
  other: unknown /* const array */;
}

type __RequestUnion__iocompressionstats_notification_subsystemDescriptor = 
  | { Request_iocompressionstats_notification: __Request__iocompressionstats_notification_t };

declare class __RequestUnion__iocompressionstats_notification_subsystem {
  constructor(init?: __RequestUnion__iocompressionstats_notification_subsystemDescriptor);
  Request_iocompressionstats_notification: __Request__iocompressionstats_notification_t;
}

type vm_addr_struct_tDescriptor = 
  | { UNSAFE: number };

declare class vm_addr_struct_t {
  constructor(init?: vm_addr_struct_tDescriptor);
  UNSAFE: number;
}

type __ReplyUnion__arcade_upcall_subsystemDescriptor = 
  | { Reply_arcade_upcall: __Reply__arcade_upcall_t };

declare class __ReplyUnion__arcade_upcall_subsystem {
  constructor(init?: __ReplyUnion__arcade_upcall_subsystemDescriptor);
  Reply_arcade_upcall: __Reply__arcade_upcall_t;
}

type EFI_GUID_UNIONDescriptor = 
  | { Guid: EFI_GUID }
  | { Raw: unknown /* const array */ };

declare class EFI_GUID_UNION {
  constructor(init?: EFI_GUID_UNIONDescriptor);
  Guid: EFI_GUID;
  Raw: unknown /* const array */;
}

type unnamed_18360375898093340158Descriptor = 
  | { type_u: unnamed_6159238944164597548 }
  | { type_i: unnamed_5653929594553184484 }
  | { type_s: unnamed_3543327112011839650 }
  | { type_frmr: unnamed_13796328879155343206 }
  | { type_snap: unnamed_3065075258511695163 }
  | { type_raw: unnamed_4839339318380457615 };

declare class unnamed_18360375898093340158 {
  constructor(init?: unnamed_18360375898093340158Descriptor);
  type_u: unnamed_6159238944164597548;
  type_i: unnamed_5653929594553184484;
  type_s: unnamed_3543327112011839650;
  type_frmr: unnamed_13796328879155343206;
  type_snap: unnamed_3065075258511695163;
  type_raw: unnamed_4839339318380457615;
}

type unnamed_1434387329560475752Descriptor = 
  | { q: unknown /* const array */ };

declare class unnamed_1434387329560475752 {
  constructor(init?: unnamed_1434387329560475752Descriptor);
  q: unknown /* const array */;
}

type unnamed_12453670226361702875Descriptor = 
  | { range: unnamed_1349940271187565025 }
  | { notRange: unnamed_2523850008691988883 };

declare class unnamed_12453670226361702875 {
  constructor(init?: unnamed_12453670226361702875Descriptor);
  range: unnamed_1349940271187565025;
  notRange: unnamed_2523850008691988883;
}

type unnamed_16860321427244527420Descriptor = 
  | { id_ts: id_ts }
  | { id_ip: id_ip }
  | { id_radv: icmp_ra_addr }
  | { id_mask: number }
  | { id_data: unknown /* const array */ };

declare class unnamed_16860321427244527420 {
  constructor(init?: unnamed_16860321427244527420Descriptor);
  id_ts: id_ts;
  id_ip: id_ip;
  id_radv: icmp_ra_addr;
  id_mask: number;
  id_data: unknown /* const array */;
}

type __ReplyUnion__telemetry_notification_subsystemDescriptor = 
  | { Reply_telemetry_notification: __Reply__telemetry_notification_t };

declare class __ReplyUnion__telemetry_notification_subsystem {
  constructor(init?: __ReplyUnion__telemetry_notification_subsystemDescriptor);
  Reply_telemetry_notification: __Reply__telemetry_notification_t;
}

type unnamed_11069552131084001118Descriptor = 
  | { params: unknown /* const array */ };

declare class unnamed_11069552131084001118 {
  constructor(init?: unnamed_11069552131084001118Descriptor);
  params: unknown /* const array */;
}

type unnamed_4036696868773053385Descriptor = 
  | { b8: unknown /* const array */ }
  | { b32: unknown /* const array */ }
  | { b64: unknown /* const array */ };

declare class unnamed_4036696868773053385 {
  constructor(init?: unnamed_4036696868773053385Descriptor);
  b8: unknown /* const array */;
  b32: unknown /* const array */;
  b64: unknown /* const array */;
}

type unnamed_10582003878615679738Descriptor = 
  | { icmp6_un_data32: unknown /* const array */ }
  | { icmp6_un_data16: unknown /* const array */ }
  | { icmp6_un_data8: unknown /* const array */ };

declare class unnamed_10582003878615679738 {
  constructor(init?: unnamed_10582003878615679738Descriptor);
  icmp6_un_data32: unknown /* const array */;
  icmp6_un_data16: unknown /* const array */;
  icmp6_un_data8: unknown /* const array */;
}

type __ReplyUnion__mach_voucher_attr_control_subsystemDescriptor = 
  | { Reply_mach_voucher_attr_control_get_values: __Reply__mach_voucher_attr_control_get_values_t }
  | { Reply_mach_voucher_attr_control_create_mach_voucher: __Reply__mach_voucher_attr_control_create_mach_voucher_t };

declare class __ReplyUnion__mach_voucher_attr_control_subsystem {
  constructor(init?: __ReplyUnion__mach_voucher_attr_control_subsystemDescriptor);
  Reply_mach_voucher_attr_control_get_values: __Reply__mach_voucher_attr_control_get_values_t;
  Reply_mach_voucher_attr_control_create_mach_voucher: __Reply__mach_voucher_attr_control_create_mach_voucher_t;
}

type __RequestUnion__send_vfs_nspace_subsystemDescriptor = 
  | { Request_send_nspace_handle: __Request__nspace_handle_t }
  | { Request_send_nspace_resolve_cancel: __Request__nspace_resolve_cancel_t }
  | { Request_send_nspace_resolve_path: __Request__nspace_resolve_path_t }
  | { Request_send_vfs_resolve_file: __Request__vfs_resolve_file_t }
  | { Request_send_vfs_resolve_dir: __Request__vfs_resolve_dir_t }
  | { Request_send_vfs_resolve_file_with_audit_token: __Request__vfs_resolve_file_with_audit_token_t }
  | { Request_send_vfs_resolve_dir_with_audit_token: __Request__vfs_resolve_dir_with_audit_token_t }
  | { Request_send_vfs_resolve_reparent_with_audit_token: __Request__vfs_resolve_reparent_with_audit_token_t };

declare class __RequestUnion__send_vfs_nspace_subsystem {
  constructor(init?: __RequestUnion__send_vfs_nspace_subsystemDescriptor);
  Request_send_nspace_handle: __Request__nspace_handle_t;
  Request_send_nspace_resolve_cancel: __Request__nspace_resolve_cancel_t;
  Request_send_nspace_resolve_path: __Request__nspace_resolve_path_t;
  Request_send_vfs_resolve_file: __Request__vfs_resolve_file_t;
  Request_send_vfs_resolve_dir: __Request__vfs_resolve_dir_t;
  Request_send_vfs_resolve_file_with_audit_token: __Request__vfs_resolve_file_with_audit_token_t;
  Request_send_vfs_resolve_dir_with_audit_token: __Request__vfs_resolve_dir_with_audit_token_t;
  Request_send_vfs_resolve_reparent_with_audit_token: __Request__vfs_resolve_reparent_with_audit_token_t;
}

type __ReplyUnion__memory_error_notification_subsystemDescriptor = 
  | { Reply_memory_error_notification: __Reply__memory_error_notification_t }
  | { Reply_mcc_memory_error_notification: __Reply__mcc_memory_error_notification_t }
  | { Reply_llc_memory_error_notification: __Reply__llc_memory_error_notification_t };

declare class __ReplyUnion__memory_error_notification_subsystem {
  constructor(init?: __ReplyUnion__memory_error_notification_subsystemDescriptor);
  Reply_memory_error_notification: __Reply__memory_error_notification_t;
  Reply_mcc_memory_error_notification: __Reply__mcc_memory_error_notification_t;
  Reply_llc_memory_error_notification: __Reply__llc_memory_error_notification_t;
}

type unnamed_16255488822298767969Descriptor = 
  | { ip6_un1: ip6_hdrctl }
  | { ip6_un2_vfc: number };

declare class unnamed_16255488822298767969 {
  constructor(init?: unnamed_16255488822298767969Descriptor);
  ip6_un1: ip6_hdrctl;
  ip6_un2_vfc: number;
}

type unnamed_15220813377071643169Descriptor = 
  | { range: unnamed_12682914610915075965 }
  | { notRange: unnamed_4956359801868705484 };

declare class unnamed_15220813377071643169 {
  constructor(init?: unnamed_15220813377071643169Descriptor);
  range: unnamed_12682914610915075965;
  notRange: unnamed_4956359801868705484;
}

type unnamed_15629581316607134910Descriptor = 
  | { xb_buffer: unnamed_395901244814143410 };

declare class unnamed_15629581316607134910 {
  constructor(init?: unnamed_15629581316607134910Descriptor);
  xb_buffer: unnamed_395901244814143410;
}

type ldt_entryDescriptor = 
  | { code: code_desc }
  | { data: data_desc }
  | { call_gate: call_gate }
  | { task_gate: task_gate };

declare class ldt_entry {
  constructor(init?: ldt_entryDescriptor);
  code: code_desc;
  data: data_desc;
  call_gate: call_gate;
  task_gate: task_gate;
}

type __ReplyUnion__iocompressionstats_notification_subsystemDescriptor = 
  | { Reply_iocompressionstats_notification: __Reply__iocompressionstats_notification_t };

declare class __ReplyUnion__iocompressionstats_notification_subsystem {
  constructor(init?: __ReplyUnion__iocompressionstats_notification_subsystemDescriptor);
  Reply_iocompressionstats_notification: __Reply__iocompressionstats_notification_t;
}

type __RequestUnion__doubleagent_subsystemDescriptor = 
  | { Request_doubleagent_lookup_xattr: __Request__doubleagent_lookup_xattr_t }
  | { Request_doubleagent_allocate_xattr: __Request__doubleagent_allocate_xattr_t }
  | { Request_doubleagent_list_xattrs: __Request__doubleagent_list_xattrs_t }
  | { Request_doubleagent_remove_xattr: __Request__doubleagent_remove_xattr_t };

declare class __RequestUnion__doubleagent_subsystem {
  constructor(init?: __RequestUnion__doubleagent_subsystemDescriptor);
  Request_doubleagent_lookup_xattr: __Request__doubleagent_lookup_xattr_t;
  Request_doubleagent_allocate_xattr: __Request__doubleagent_allocate_xattr_t;
  Request_doubleagent_list_xattrs: __Request__doubleagent_list_xattrs_t;
  Request_doubleagent_remove_xattr: __Request__doubleagent_remove_xattr_t;
}

type unnamed_10026640810810341317Descriptor = 
  | { range: unnamed_2458411210139206337 }
  | { notRange: unnamed_5417993191739967733 };

declare class unnamed_10026640810810341317 {
  constructor(init?: unnamed_10026640810810341317Descriptor);
  range: unnamed_2458411210139206337;
  notRange: unnamed_5417993191739967733;
}

type unnamed_5820487912701483032Descriptor = 
  | { xrfu_addr: sockaddr }
  | { xrfu_dummy1: unknown /* const array */ };

declare class unnamed_5820487912701483032 {
  constructor(init?: unnamed_5820487912701483032Descriptor);
  xrfu_addr: sockaddr;
  xrfu_dummy1: unknown /* const array */;
}

type unnamed_43089776325316495Descriptor = 
  | { sadb_x_sa2_reserved1: number };

declare class unnamed_43089776325316495 {
  constructor(init?: unnamed_43089776325316495Descriptor);
  sadb_x_sa2_reserved1: number;
}

type unnamed_17063257302219593426Descriptor = 
  | { asid: number }
  | { vmid: number };

declare class unnamed_17063257302219593426 {
  constructor(init?: unnamed_17063257302219593426Descriptor);
  asid: number;
  vmid: number;
}

declare function crc32(crc: number, bufp: interop.PointerConvertible, len: number): number;

declare function Tcl_Panic(string: string): void;

declare function kern_feature_override(fmask: interop.Enum<typeof kf_override_flag_t>): number;

declare function panic_timing_update(timing: interop.Enum<typeof panic_timing_t>): void;

declare function panic_coproc_status_update(coproc_name: string, status: number): void;

declare function copyin(uaddr: number, kaddr: interop.PointerConvertible, len: number): number;

declare function copyout(kaddr: interop.PointerConvertible, udaddr: number, len: number): number;

declare function ffs(p1: number): number;

declare function ffsll(p1: number): number;

declare function fls(p1: number): number;

declare function flsll(p1: number): number;

declare function random(): number;

declare function scanc(p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number): number;

declare function strtol(p1: string, p2: interop.PointerConvertible, p3: number): number;

declare function strtoul(p1: string, p2: interop.PointerConvertible, p3: number): number;

declare function strtoq(p1: string, p2: interop.PointerConvertible, p3: number): number;

declare function strtouq(p1: string, p2: interop.PointerConvertible, p3: number): number;

declare function strsep(p1: interop.PointerConvertible, p2: string): string;

declare function memchr(p1: interop.PointerConvertible, p2: number, p3: number): interop.Pointer;

declare function url_decode(str: string): void;

declare function __builtin___snprintf_chk(p1: string, count: number): number;

declare function scnprintf(p1: string, count: number, p3: string): number;

declare function tsnprintf(dst: string, count: number, fmt: string): string;

declare function vtsnprintf(dst: string, count: number, fmt: string, ap: string): string;

declare function __builtin___sprintf_chk(bufp: string): number;

declare function sscanf(p1: string, p2: string): number;

declare function printf(p1: string): number;

declare function crc32(crc: number, bufp: interop.PointerConvertible, len: number): number;

declare function copystr(kfaddr: interop.PointerConvertible, kdaddr: interop.PointerConvertible, len: number, done: interop.PointerConvertible): number;

declare function copyinstr(uaddr: number, kaddr: interop.PointerConvertible, len: number, done: interop.PointerConvertible): number;

declare function copyoutstr(kaddr: interop.PointerConvertible, udaddr: number, len: number, done: interop.PointerConvertible): number;

declare function vsscanf(p1: string, p2: string, p3: string): number;

declare function vprintf(p1: string, p2: string): number;

declare function __builtin___vsnprintf_chk(p1: string, p2: number): number;

declare function vscnprintf(p1: string, p2: number, p3: string, p4: string): number;

declare function __builtin___vsprintf_chk(bufp: string): number;

declare function invalidate_icache(p1: number, p2: number): void;

declare function flush_dcache(p1: number, p2: number, p3: number): void;

declare function invalidate_icache64(p1: number, p2: number): void;

declare function flush_dcache64(p1: number, p2: number, p3: number): void;

declare function vm_kernel_addrhide(addr: number, hide_addr: interop.PointerConvertible): void;

declare function vm_kernel_addrperm_external(addr: number, perm_addr: interop.PointerConvertible): void;

declare function vm_kernel_unslide_or_perm_external(addr: number, perm_addr: interop.PointerConvertible): void;

declare function vm_kernel_addrhash(addr: number): number;

declare function thread_has_thread_name(th: number): number;

declare function thread_set_thread_name(th: number, name: string): void;

declare function current_thread(): number;

declare function thread_tid(thread: number): number;

declare function thread_reference(thread: number): void;

declare function thread_deallocate(thread: number): void;

declare function kernel_thread_start(continuation: (p1: interop.PointerConvertible, p2: number) => void, parameter: interop.PointerConvertible, new_thread: interop.PointerConvertible): number;

declare function nullop(): number;

declare function nulldev(): number;

declare function enoioctl(): number;

declare function enosys(): number;

declare function enxio(): number;

declare function eopnotsupp(): number;

declare function hashinit(count: number, type: number, hashmask: interop.PointerConvertible): interop.Pointer;

declare function hashdestroy(p1: interop.PointerConvertible, type: number, hashmask: number): void;

declare function ovbcopy(from: interop.PointerConvertible, to: interop.PointerConvertible, len: number): void;

declare function fubyte(addr: number): number;

declare function fuibyte(addr: number): number;

declare function subyte(addr: number, byte: number): number;

declare function suibyte(addr: number, byte: number): number;

declare function fuword(addr: number): number;

declare function fuiword(addr: number): number;

declare function suword(addr: number, word: number): number;

declare function suiword(addr: number, word: number): number;

declare function useracc(addr: number, len: number, prot: number): number;

declare function bsd_timeout(p1: (p1: interop.PointerConvertible) => void, arg: interop.PointerConvertible, ts: interop.PointerConvertible): void;

declare function bsd_untimeout(p1: (p1: interop.PointerConvertible) => void, arg: interop.PointerConvertible): void;

declare function set_fsblocksize(p1: interop.PointerConvertible): void;

declare function tvtoabstime(p1: interop.PointerConvertible): number;

declare function tstoabstime(p1: interop.PointerConvertible): number;

declare function throttle_info_create(): interop.Pointer;

declare function throttle_info_mount_ref(mp: interop.PointerConvertible, throttle_info: interop.PointerConvertible): void;

declare function throttle_info_mount_rel(mp: interop.PointerConvertible): void;

declare function throttle_info_release(throttle_info: interop.PointerConvertible): void;

declare function throttle_info_update(throttle_info: interop.PointerConvertible, flags: number): void;

declare function throttle_lowpri_io(sleep_amount: number): number;

declare function throttle_lowpri_io_will_be_throttled(sleep_amount: number): number;

declare function throttle_set_thread_io_policy(policy: number): void;

declare function throttle_get_thread_effective_io_policy(): number;

declare function throttle_thread_io_tier_above_metadata(): number;

declare function throttle_info_ref_by_mask(throttle_mask: number, throttle_info_handle: interop.PointerConvertible): number;

declare function throttle_info_rel_by_mask(throttle_info_handle: interop.PointerConvertible): void;

declare function throttle_info_update_by_mask(throttle_info_handle: interop.PointerConvertible, flags: number): void;

declare function throttle_info_disable_throttle(devno: number, isfusion: number): void;

declare function throttle_info_io_will_be_throttled(throttle_info_handle: interop.PointerConvertible, policy: number): number;

declare function nop_create(ap: interop.PointerConvertible): number;

declare function err_create(ap: interop.PointerConvertible): number;

declare function nop_whiteout(ap: interop.PointerConvertible): number;

declare function err_whiteout(ap: interop.PointerConvertible): number;

declare function nop_mknod(ap: interop.PointerConvertible): number;

declare function err_mknod(ap: interop.PointerConvertible): number;

declare function nop_open(ap: interop.PointerConvertible): number;

declare function err_open(ap: interop.PointerConvertible): number;

declare function nop_close(ap: interop.PointerConvertible): number;

declare function err_close(ap: interop.PointerConvertible): number;

declare function nop_access(ap: interop.PointerConvertible): number;

declare function err_access(ap: interop.PointerConvertible): number;

declare function nop_getattr(ap: interop.PointerConvertible): number;

declare function err_getattr(ap: interop.PointerConvertible): number;

declare function nop_setattr(ap: interop.PointerConvertible): number;

declare function err_setattr(ap: interop.PointerConvertible): number;

declare function nop_read(ap: interop.PointerConvertible): number;

declare function err_read(ap: interop.PointerConvertible): number;

declare function nop_write(ap: interop.PointerConvertible): number;

declare function err_write(ap: interop.PointerConvertible): number;

declare function nop_ioctl(ap: interop.PointerConvertible): number;

declare function err_ioctl(ap: interop.PointerConvertible): number;

declare function nop_select(ap: interop.PointerConvertible): number;

declare function err_select(ap: interop.PointerConvertible): number;

declare function nop_exchange(ap: interop.PointerConvertible): number;

declare function err_exchange(ap: interop.PointerConvertible): number;

declare function nop_revoke(ap: interop.PointerConvertible): number;

declare function err_revoke(ap: interop.PointerConvertible): number;

declare function nop_mmap(ap: interop.PointerConvertible): number;

declare function err_mmap(ap: interop.PointerConvertible): number;

declare function nop_fsync(ap: interop.PointerConvertible): number;

declare function err_fsync(ap: interop.PointerConvertible): number;

declare function nop_remove(ap: interop.PointerConvertible): number;

declare function err_remove(ap: interop.PointerConvertible): number;

declare function nop_link(ap: interop.PointerConvertible): number;

declare function err_link(ap: interop.PointerConvertible): number;

declare function nop_rename(ap: interop.PointerConvertible): number;

declare function err_rename(ap: interop.PointerConvertible): number;

declare function nop_mkdir(ap: interop.PointerConvertible): number;

declare function err_mkdir(ap: interop.PointerConvertible): number;

declare function nop_rmdir(ap: interop.PointerConvertible): number;

declare function err_rmdir(ap: interop.PointerConvertible): number;

declare function nop_symlink(ap: interop.PointerConvertible): number;

declare function err_symlink(ap: interop.PointerConvertible): number;

declare function nop_readdir(ap: interop.PointerConvertible): number;

declare function err_readdir(ap: interop.PointerConvertible): number;

declare function nop_readdirattr(ap: interop.PointerConvertible): number;

declare function err_readdirattr(ap: interop.PointerConvertible): number;

declare function nop_readlink(ap: interop.PointerConvertible): number;

declare function err_readlink(ap: interop.PointerConvertible): number;

declare function nop_inactive(ap: interop.PointerConvertible): number;

declare function err_inactive(ap: interop.PointerConvertible): number;

declare function nop_reclaim(ap: interop.PointerConvertible): number;

declare function err_reclaim(ap: interop.PointerConvertible): number;

declare function nop_strategy(ap: interop.PointerConvertible): number;

declare function err_strategy(ap: interop.PointerConvertible): number;

declare function nop_pathconf(ap: interop.PointerConvertible): number;

declare function err_pathconf(ap: interop.PointerConvertible): number;

declare function nop_advlock(ap: interop.PointerConvertible): number;

declare function err_advlock(ap: interop.PointerConvertible): number;

declare function nop_allocate(ap: interop.PointerConvertible): number;

declare function err_allocate(ap: interop.PointerConvertible): number;

declare function nop_bwrite(ap: interop.PointerConvertible): number;

declare function err_bwrite(ap: interop.PointerConvertible): number;

declare function nop_pagein(ap: interop.PointerConvertible): number;

declare function err_pagein(ap: interop.PointerConvertible): number;

declare function nop_pageout(ap: interop.PointerConvertible): number;

declare function err_pageout(ap: interop.PointerConvertible): number;

declare function nop_searchfs(ap: interop.PointerConvertible): number;

declare function err_searchfs(ap: interop.PointerConvertible): number;

declare function nop_copyfile(ap: interop.PointerConvertible): number;

declare function err_copyfile(ap: interop.PointerConvertible): number;

declare function nop_blktooff(ap: interop.PointerConvertible): number;

declare function err_blktooff(ap: interop.PointerConvertible): number;

declare function nop_offtoblk(ap: interop.PointerConvertible): number;

declare function err_offtoblk(ap: interop.PointerConvertible): number;

declare function nop_blockmap(ap: interop.PointerConvertible): number;

declare function err_blockmap(ap: interop.PointerConvertible): number;

declare function nop_monitor(ap: interop.PointerConvertible): number;

declare function err_monitor(ap: interop.PointerConvertible): number;

declare function task_reference(p1: number): void;

declare function task_deallocate(p1: number): void;

declare function task_is_driver(task: number): boolean;

declare function task_name_deallocate_mig(task_name: number): void;

declare function task_policy_set_deallocate_mig(task_policy_set: number): void;

declare function task_policy_get_deallocate_mig(task_policy_get: number): void;

declare function task_inspect_deallocate_mig(task_inspect: number): void;

declare function task_read_deallocate_mig(task_read: number): void;

declare function task_suspension_token_deallocate(token: number): void;

declare function task_self_region_footprint(): boolean;

declare function task_self_region_footprint_set(newval: number): void;

declare function task_self_region_reused_as_clean(): boolean;

declare function task_self_region_info_flags(): number;

declare function task_self_region_info_flags_set(newval: number): number;

declare function task_ledgers_footprint(ledger: number, ledger_resident: interop.PointerConvertible, ledger_compressed: interop.PointerConvertible): void;

declare function task_set_memory_ownership_transfer(task: number, value: number): void;

declare function task_set_ast_synthesize_async_fault_mach_exception(task: number): void;

declare function extmod_statistics_incr_task_for_pid(target: number): void;

declare function extmod_statistics_incr_thread_set_state(target: number): void;

declare function extmod_statistics_incr_thread_create(target: number): void;

declare function hv_support_init(): void;

declare function hv_get_support(): number;

declare function hv_set_task_target(target: interop.PointerConvertible): void;

declare function hv_set_thread_target(target: interop.PointerConvertible): void;

declare function hv_get_task_target(): interop.Pointer;

declare function hv_get_thread_target(): interop.Pointer;

declare function hv_get_volatile_state(state: interop.Enum<typeof hv_volatile_state_t>): number;

declare function hv_set_traps(trap_type: interop.Enum<typeof hv_trap_type_t>, traps: interop.PointerConvertible, trap_count: number): number;

declare function hv_release_traps(trap_type: interop.Enum<typeof hv_trap_type_t>): void;

declare function hv_set_callbacks(callbacks: hv_callbacks_t): number;

declare function hv_release_callbacks(): void;

declare function hv_suspend(): void;

declare function hv_resume(): void;

declare function hv_task_trap(index: number, arg: number): number;

declare function hv_thread_trap(index: number, arg: number): number;

declare function hv_ast_pending(): number;

declare function hv_trace_guest_enter(vcpu_id: number, vcpu_regs: interop.PointerConvertible): void;

declare function hv_trace_guest_exit(vcpu_id: number, vcpu_regs: interop.PointerConvertible, reason: number): void;

declare function hv_trace_guest_error(vcpu_id: number, vcpu_regs: interop.PointerConvertible, failure: number, error: number): void;

declare function Assert(file: string, line: number, expression: string): void;

declare function lck_grp_attr_alloc_init(): interop.Pointer;

declare function lck_grp_attr_setdefault(attr: interop.PointerConvertible): void;

declare function lck_grp_attr_setstat(attr: interop.PointerConvertible): void;

declare function lck_grp_attr_free(attr: interop.PointerConvertible): void;

declare function lck_grp_alloc_init(grp_name: string, attr: interop.PointerConvertible): interop.Pointer;

declare function lck_grp_free(grp: interop.PointerConvertible): void;

declare function lck_attr_alloc_init(): interop.Pointer;

declare function lck_attr_setdefault(attr: interop.PointerConvertible): void;

declare function lck_attr_setdebug(attr: interop.PointerConvertible): void;

declare function lck_attr_cleardebug(attr: interop.PointerConvertible): void;

declare function lck_attr_free(attr: interop.PointerConvertible): void;

declare function lck_mtx_alloc_init(grp: interop.PointerConvertible, attr: interop.PointerConvertible): interop.Pointer;

declare function lck_mtx_init(lck: interop.PointerConvertible, grp: interop.PointerConvertible, attr: interop.PointerConvertible): void;

declare function lck_mtx_lock(lck: interop.PointerConvertible): void;

declare function lck_mtx_unlock(lck: interop.PointerConvertible): void;

declare function lck_mtx_destroy(lck: interop.PointerConvertible, grp: interop.PointerConvertible): void;

declare function lck_mtx_free(lck: interop.PointerConvertible, grp: interop.PointerConvertible): void;

declare function lck_mtx_sleep(lck: interop.PointerConvertible, lck_sleep_action: interop.Enum<typeof lck_sleep_action_t>, event: interop.PointerConvertible, interruptible: number): number;

declare function lck_mtx_sleep_deadline(lck: interop.PointerConvertible, lck_sleep_action: interop.Enum<typeof lck_sleep_action_t>, event: interop.PointerConvertible, interruptible: number, deadline: number): number;

declare function lck_mtx_assert(lck: interop.PointerConvertible, type: number): void;

declare function lck_mtx_assert_owned_spin(lck: interop.PointerConvertible): void;

declare function clock_get_calendar_microtime(secs: interop.PointerConvertible, microsecs: interop.PointerConvertible): void;

declare function clock_get_calendar_absolute_and_microtime(secs: interop.PointerConvertible, microsecs: interop.PointerConvertible, abstime: interop.PointerConvertible): void;

declare function clock_get_calendar_nanotime(secs: interop.PointerConvertible, nanosecs: interop.PointerConvertible): void;

declare function clock_get_system_microtime(secs: interop.PointerConvertible, microsecs: interop.PointerConvertible): void;

declare function clock_get_system_nanotime(secs: interop.PointerConvertible, nanosecs: interop.PointerConvertible): void;

declare function clock_timebase_info(info: interop.PointerConvertible): void;

declare function clock_get_uptime(result: interop.PointerConvertible): void;

declare function clock_interval_to_deadline(interval: number, scale_factor: number, result: interop.PointerConvertible): void;

declare function nanoseconds_to_deadline(interval: number, result: interop.PointerConvertible): void;

declare function clock_interval_to_absolutetime_interval(interval: number, scale_factor: number, result: interop.PointerConvertible): void;

declare function clock_absolutetime_interval_to_deadline(abstime: number, result: interop.PointerConvertible): void;

declare function clock_continuoustime_interval_to_deadline(abstime: number, result: interop.PointerConvertible): void;

declare function clock_delay_until(deadline: number): void;

declare function absolutetime_to_nanoseconds(abstime: number, result: interop.PointerConvertible): void;

declare function nanoseconds_to_absolutetime(nanoseconds: number, result: interop.PointerConvertible): void;

declare function absolutetime_to_microtime(abstime: number, secs: interop.PointerConvertible, microsecs: interop.PointerConvertible): void;

declare function kdb_clock_get_calendar_absolute_and_microtime_locked(secs: interop.PointerConvertible, microsecs: interop.PointerConvertible, abstime: interop.PointerConvertible): void;

declare function absolutetime_to_continuoustime(abstime: number): number;

declare function continuoustime_to_absolutetime(conttime: number): number;

declare function thread_call_enter(call: interop.PointerConvertible): number;

declare function thread_call_enter1(call: interop.PointerConvertible, param1: interop.PointerConvertible): number;

declare function thread_call_enter_delayed(call: interop.PointerConvertible, deadline: number): number;

declare function thread_call_enter1_delayed(call: interop.PointerConvertible, param1: interop.PointerConvertible, deadline: number): number;

declare function thread_call_cancel(call: interop.PointerConvertible): number;

declare function thread_call_cancel_wait(call: interop.PointerConvertible): number;

declare function thread_call_allocate(func: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, param0: interop.PointerConvertible): interop.Pointer;

declare function thread_call_allocate_with_priority(func: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, param0: interop.PointerConvertible, pri: interop.Enum<typeof thread_call_priority_t>): interop.Pointer;

declare function thread_call_allocate_with_options(func: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, param0: interop.PointerConvertible, pri: interop.Enum<typeof thread_call_priority_t>, options: number): interop.Pointer;

declare function thread_call_free(call: interop.PointerConvertible): number;

declare function thread_call_isactive(call: interop.PointerConvertible): number;

declare function host_self(): number;

declare function host_priv_self(): number;

declare function backtrace_user_copy_error(ctx: interop.PointerConvertible, dst: interop.PointerConvertible, src: number, size: number): number;

declare function backtrace(bt: interop.PointerConvertible, btlen: number, ctl: interop.PointerConvertible, info_out: interop.PointerConvertible): number;

declare function backtrace_packed(packing: interop.Enum<typeof backtrace_pack_t>, bt: interop.PointerConvertible, btsize: number, ctl: interop.PointerConvertible, info_out: interop.PointerConvertible): number;

declare function backtrace_pack(packing: interop.Enum<typeof backtrace_pack_t>, dst: interop.PointerConvertible, dst_size: number, src: interop.PointerConvertible, src_len: number): number;

declare function backtrace_unpack(packing: interop.Enum<typeof backtrace_pack_t>, dst: interop.PointerConvertible, dst_len: number, src: interop.PointerConvertible, src_size: number): number;

declare function backtrace_user(bt: interop.PointerConvertible, btlen: number, ctl: interop.PointerConvertible, info_out: interop.PointerConvertible): number;

declare function kpc_init(): void;

declare function kpc_arch_init(): void;

declare function kpc_get_classes(): number;

declare function kpc_get_running(): number;

declare function kpc_get_pmu_version(): number;

declare function kpc_set_running(classes: number): number;

declare function kpc_get_cpu_counters(all_cpus: number, classes: number, curcpu: interop.PointerConvertible, buf: interop.PointerConvertible): number;

declare function kpc_get_curthread_counters(inoutcount: interop.PointerConvertible, buf: interop.PointerConvertible): number;

declare function kpc_get_counter_count(classes: number): number;

declare function kpc_get_config_count(classes: number): number;

declare function kpc_get_thread_counting(): number;

declare function kpc_set_thread_counting(classes: number): number;

declare function kpc_get_config(classes: number, current_config: interop.PointerConvertible): number;

declare function kpc_set_config(classes: number, new_config: interop.PointerConvertible): number;

declare function kpc_get_period(classes: number, period: interop.PointerConvertible): number;

declare function kpc_set_period(classes: number, period: interop.PointerConvertible): number;

declare function kpc_get_actionid(classes: number, actionid: interop.PointerConvertible): number;

declare function kpc_set_actionid(classes: number, actionid: interop.PointerConvertible): number;

declare function kpc_thread_create(thread: number): void;

declare function kpc_thread_destroy(thread: number): void;

declare function kpc_counterbuf_alloc(): interop.Pointer;

declare function kpc_counterbuf_free(p1: interop.PointerConvertible): void;

declare function kpc_get_counterbuf_size(): number;

declare function kpc_thread_ast_handler(thread: number): void;

declare function kpc_force_all_ctrs(task: number, val: number): number;

declare function kpc_get_force_all_ctrs(): number;

declare function kpc_register_pm_handler(handler: (p1: number) => void): number;

declare function kpc_reserve_pm_counters(pmc_mask: number, handler: (p1: number) => void, custom_config: number): number;

declare function kpc_release_pm_counters(): void;

declare function kpc_pm_acknowledge(available_to_pm: number): void;

declare function kpc_controls_fixed_counters(): number;

declare function kpc_idle(): void;

declare function kpc_idle_exit(): void;

declare function get_address_from_kext_map(fsize: number): number;

declare function kext_alloc_init(): void;

declare function kext_alloc(addr: interop.PointerConvertible, size: number, fixed: number): number;

declare function kext_free(addr: number, size: number): void;

declare function kext_receipt(addrp: interop.PointerConvertible, sizep: interop.PointerConvertible): number;

declare function kext_receipt_set_queried(): number;

declare function mach_msg_send_from_kernel_proper(msg: interop.PointerConvertible, send_size: number): number;

declare function kernel_mach_msg_send_with_builder(descriptor_count: number, payload_size: number, builder: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void): number;

declare function mach_msg_rpc_from_kernel_proper(msg: interop.PointerConvertible, send_size: number, rcv_size: number): number;

declare function mach_msg_destroy_from_kernel_proper(msg: interop.PointerConvertible): void;

declare function priority_queue_init(pq: interop.PointerConvertible): void;

declare function priority_queue_insert(pq: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_remove(pq: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(pq: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(pq: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_destroy(pq: interop.PointerConvertible, offset: number, cb: (p1: interop.PointerConvertible) => void): void;

declare function priority_queue_insert(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function _priority_queue_remove_root(que: interop.PointerConvertible): interop.Pointer;

declare function priority_queue_remove(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_decreased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function priority_queue_entry_increased(que: interop.PointerConvertible, elt: interop.PointerConvertible): boolean;

declare function kern_work_interval_create(thread: number, create_params: interop.PointerConvertible): number;

declare function kern_work_interval_get_flags_from_port(port_name: number, flags: interop.PointerConvertible): number;

declare function kern_port_name_to_work_interval(name: number, work_interval: interop.PointerConvertible): number;

declare function kern_work_interval_get_policy(work_interval: interop.PointerConvertible, policy: interop.PointerConvertible, priority: interop.PointerConvertible): number;

declare function kern_work_interval_release(work_interval: interop.PointerConvertible): void;

declare function kern_work_interval_explicit_join(thread: number, work_interval: interop.PointerConvertible): number;

declare function kern_work_interval_destroy(thread: number, work_interval_id: number): number;

declare function kern_work_interval_join(thread: number, port_name: number): number;

declare function kern_work_interval_notify(thread: number, kwi_args: interop.PointerConvertible): number;

declare function kern_work_interval_set_name(port_name: number, name: string, len: number): number;

declare function kern_work_interval_set_workload_id(port_name: number, workload_id_args: interop.PointerConvertible): number;

declare function stackshot_update_lock_state(lock_state: interop.Enum<typeof stackshot_device_lock_state_t>): void;

declare function stackshot_update_passcode_status(primary_user_status: interop.Enum<typeof stackshot_passcode_status_t>): void;

declare function thread_get_current_cpuid(): number;

declare function thread_block(continuation: (p1: interop.PointerConvertible, p2: number) => void): number;

declare function thread_block_parameter(continuation: (p1: interop.PointerConvertible, p2: number) => void, parameter: interop.PointerConvertible): number;

declare function assert_wait(event: interop.PointerConvertible, interruptible: number): number;

declare function assert_wait_timeout(event: interop.PointerConvertible, interruptible: number, interval: number, scale_factor: number): number;

declare function assert_wait_timeout_with_leeway(event: interop.PointerConvertible, interruptible: number, urgency: number, interval: number, leeway: number, scale_factor: number): number;

declare function assert_wait_deadline(event: interop.PointerConvertible, interruptible: number, deadline: number): number;

declare function assert_wait_deadline_with_leeway(event: interop.PointerConvertible, interruptible: number, urgency: number, deadline: number, leeway: number): number;

declare function thread_wakeup_prim(event: interop.PointerConvertible, one_thread: number, result: number): number;

declare function thread_wakeup_nthreads_prim(event: interop.PointerConvertible, nthreads: number, result: number): number;

declare function thread_wakeup_thread(event: interop.PointerConvertible, thread: number): number;

declare function preemption_enabled(): number;

declare function lck_rw_alloc_init(grp: interop.PointerConvertible, attr: interop.PointerConvertible): interop.Pointer;

declare function lck_rw_init(lck: interop.PointerConvertible, grp: interop.PointerConvertible, attr: interop.PointerConvertible): void;

declare function lck_rw_free(lck: interop.PointerConvertible, grp: interop.PointerConvertible): void;

declare function lck_rw_destroy(lck: interop.PointerConvertible, grp: interop.PointerConvertible): void;

declare function lck_rw_lock(lck: interop.PointerConvertible, lck_rw_type: interop.Enum<typeof lck_rw_type_t>): void;

declare function lck_rw_try_lock(lck: interop.PointerConvertible, lck_rw_type: interop.Enum<typeof lck_rw_type_t>): number;

declare function lck_rw_unlock(lck: interop.PointerConvertible, lck_rw_type: interop.Enum<typeof lck_rw_type_t>): void;

declare function lck_rw_lock_shared(lck: interop.PointerConvertible): void;

declare function lck_rw_lock_shared_to_exclusive(lck: interop.PointerConvertible): number;

declare function lck_rw_unlock_shared(lck: interop.PointerConvertible): void;

declare function lck_rw_lock_exclusive(lck: interop.PointerConvertible): void;

declare function lck_rw_lock_exclusive_to_shared(lck: interop.PointerConvertible): void;

declare function lck_rw_unlock_exclusive(lck: interop.PointerConvertible): void;

declare function lck_rw_sleep(lck: interop.PointerConvertible, lck_sleep_action: interop.Enum<typeof lck_sleep_action_t>, event: interop.PointerConvertible, interruptible: number): number;

declare function lck_rw_sleep_deadline(lck: interop.PointerConvertible, lck_sleep_action: interop.Enum<typeof lck_sleep_action_t>, event: interop.PointerConvertible, interruptible: number, deadline: number): number;

declare function kcdata_estimate_required_buffer_size(num_items: number, payload_size: number): number;

declare function kcdata_memory_get_used_bytes(kcd: interop.PointerConvertible): number;

declare function kcdata_memory_get_uncompressed_bytes(kcd: interop.PointerConvertible): number;

declare function kcdata_memcpy(data: interop.PointerConvertible, dst_addr: number, src_addr: interop.PointerConvertible, size: number): number;

declare function kcdata_bzero(data: interop.PointerConvertible, dst_addr: number, size: number): number;

declare function kcdata_get_memory_addr(data: interop.PointerConvertible, type: number, size: number, user_addr: interop.PointerConvertible): number;

declare function kcdata_get_memory_addr_for_array(data: interop.PointerConvertible, type_of_element: number, size_of_element: number, count: number, user_addr: interop.PointerConvertible): number;

declare function mcc_log_memory_error(event: mcc_ecc_event_t): number;

declare function lck_spin_alloc_init(grp: interop.PointerConvertible, attr: interop.PointerConvertible): interop.Pointer;

declare function lck_spin_init(lck: interop.PointerConvertible, grp: interop.PointerConvertible, attr: interop.PointerConvertible): void;

declare function lck_spin_lock(lck: interop.PointerConvertible): void;

declare function lck_spin_lock_grp(lck: interop.PointerConvertible, grp: interop.PointerConvertible): void;

declare function lck_spin_unlock(lck: interop.PointerConvertible): void;

declare function lck_spin_destroy(lck: interop.PointerConvertible, grp: interop.PointerConvertible): void;

declare function lck_spin_free(lck: interop.PointerConvertible, grp: interop.PointerConvertible): void;

declare function lck_spin_sleep(lck: interop.PointerConvertible, lck_sleep_action: interop.Enum<typeof lck_sleep_action_t>, event: interop.PointerConvertible, interruptible: number): number;

declare function lck_spin_sleep_grp(lck: interop.PointerConvertible, lck_sleep_action: interop.Enum<typeof lck_sleep_action_t>, event: interop.PointerConvertible, interruptible: number, grp: interop.PointerConvertible): number;

declare function lck_spin_sleep_deadline(lck: interop.PointerConvertible, lck_sleep_action: interop.Enum<typeof lck_sleep_action_t>, event: interop.PointerConvertible, interruptible: number, deadline: number): number;

declare function task_restartable_ranges_register(task: number, ranges: interop.PointerConvertible, count: number): number;

declare function task_restartable_ranges_synchronize(task: number): number;

declare function mach_bridge_remote_time(p1: number): number;

declare function hv_support_init(): void;

declare function hv_get_support(): number;

declare function hv_set_task_target(target: interop.PointerConvertible): void;

declare function hv_set_thread_target(target: interop.PointerConvertible): void;

declare function hv_get_task_target(): interop.Pointer;

declare function hv_get_thread_target(): interop.Pointer;

declare function gpu_describe(p1: interop.PointerConvertible): void;

declare function gpu_accumulate_time(scope: number, gpu_id: number, gpu_domain: number, gpu_accumulated_ns: number, gpu_tstamp_ns: number): number;

declare function io_rate_update(io_rate_flags: number, read_ops_delta: number, write_ops_delta: number, read_bytes_delta: number, write_bytes_delta: number): number;

declare function io_rate_update_register(p1: (p1: number, p2: number, p3: number, p4: number, p5: number) => number): void;

declare function gpu_submission_telemetry(gpu_ncmds_total: number, gpu_noutstanding: number, gpu_busy_ns_total: number, gpu_cycles: number, gpu_telemetry_valid_flags: number, gpu_telemetry_misc: number): void;

declare function gpu_fceiling_cb_register(p1: (p1: number, p2: number) => number): void;

declare function ifnet_allocate(init: interop.PointerConvertible, interface: interop.PointerConvertible): number;

declare function ifnet_reference(interface: interop.PointerConvertible): number;

declare function ifnet_release(interface: interop.PointerConvertible): number;

declare function ifnet_attach(interface: interop.PointerConvertible, ll_addr: interop.PointerConvertible): number;

declare function ifnet_detach(interface: interop.PointerConvertible): number;

declare function ifnet_interface_family_find(module_string: string, family_id: interop.PointerConvertible): number;

declare function ifnet_softc(interface: interop.PointerConvertible): interop.Pointer;

declare function ifnet_name(interface: interop.PointerConvertible): string;

declare function ifnet_family(interface: interop.PointerConvertible): number;

declare function ifnet_unit(interface: interop.PointerConvertible): number;

declare function ifnet_index(interface: interop.PointerConvertible): number;

declare function ifnet_set_flags(interface: interop.PointerConvertible, new_flags: number, mask: number): number;

declare function ifnet_flags(interface: interop.PointerConvertible): number;

declare function ifnet_set_capabilities_supported(interface: interop.PointerConvertible, new_caps: number, mask: number): number;

declare function ifnet_capabilities_supported(interface: interop.PointerConvertible): number;

declare function ifnet_set_capabilities_enabled(interface: interop.PointerConvertible, new_caps: number, mask: number): number;

declare function ifnet_capabilities_enabled(interface: interop.PointerConvertible): number;

declare function ifnet_set_offload(interface: interop.PointerConvertible, offload: number): number;

declare function ifnet_set_offload_enabled(interface: interop.PointerConvertible, offload: number): number;

declare function ifnet_offload(interface: interop.PointerConvertible): number;

declare function ifnet_set_tso_mtu(interface: interop.PointerConvertible, family: number, mtuLen: number): number;

declare function ifnet_get_tso_mtu(interface: interop.PointerConvertible, family: number, mtuLen: interop.PointerConvertible): number;

declare function ifnet_set_wake_flags(interface: interop.PointerConvertible, properties: number, mask: number): number;

declare function ifnet_get_wake_flags(interface: interop.PointerConvertible): number;

declare function ifnet_set_link_mib_data(interface: interop.PointerConvertible, mibData: interop.PointerConvertible, mibLen: number): number;

declare function ifnet_get_link_mib_data(interface: interop.PointerConvertible, mibData: interop.PointerConvertible, mibLen: interop.PointerConvertible): number;

declare function ifnet_get_link_mib_data_length(interface: interop.PointerConvertible): number;

declare function ifnet_attach_protocol(interface: interop.PointerConvertible, protocol_family: number, proto_details: interop.PointerConvertible): number;

declare function ifnet_attach_protocol_v2(interface: interop.PointerConvertible, protocol_family: number, proto_details: interop.PointerConvertible): number;

declare function ifnet_detach_protocol(interface: interop.PointerConvertible, protocol_family: number): number;

declare function ifnet_output(interface: interop.PointerConvertible, protocol_family: number, packet: interop.PointerConvertible, route: interop.PointerConvertible, dest: interop.PointerConvertible): number;

declare function ifnet_output_raw(interface: interop.PointerConvertible, protocol_family: number, packet: interop.PointerConvertible): number;

declare function ifnet_input(interface: interop.PointerConvertible, first_packet: interop.PointerConvertible, stats: interop.PointerConvertible): number;

declare function ifnet_ioctl(interface: interop.PointerConvertible, protocol: number, ioctl_code: number, ioctl_arg: interop.PointerConvertible): number;

declare function ifnet_event(interface: interop.PointerConvertible, event_ptr: interop.PointerConvertible): number;

declare function ifnet_set_mtu(interface: interop.PointerConvertible, mtu: number): number;

declare function ifnet_mtu(interface: interop.PointerConvertible): number;

declare function ifnet_type(interface: interop.PointerConvertible): number;

declare function ifnet_set_addrlen(interface: interop.PointerConvertible, addrlen: number): number;

declare function ifnet_addrlen(interface: interop.PointerConvertible): number;

declare function ifnet_set_hdrlen(interface: interop.PointerConvertible, hdrlen: number): number;

declare function ifnet_hdrlen(interface: interop.PointerConvertible): number;

declare function ifnet_set_metric(interface: interop.PointerConvertible, metric: number): number;

declare function ifnet_metric(interface: interop.PointerConvertible): number;

declare function ifnet_set_baudrate(interface: interop.PointerConvertible, baudrate: number): number;

declare function ifnet_baudrate(interface: interop.PointerConvertible): number;

declare function ifnet_stat_increment(interface: interop.PointerConvertible, counts: interop.PointerConvertible): number;

declare function ifnet_stat_increment_in(interface: interop.PointerConvertible, packets_in: number, bytes_in: number, errors_in: number): number;

declare function ifnet_stat_increment_out(interface: interop.PointerConvertible, packets_out: number, bytes_out: number, errors_out: number): number;

declare function ifnet_set_stat(interface: interop.PointerConvertible, stats: interop.PointerConvertible): number;

declare function ifnet_stat(interface: interop.PointerConvertible, out_stats: interop.PointerConvertible): number;

declare function ifnet_set_promiscuous(interface: interop.PointerConvertible, on: number): number;

declare function ifnet_touch_lastchange(interface: interop.PointerConvertible): number;

declare function ifnet_lastchange(interface: interop.PointerConvertible, last_change: interop.PointerConvertible): number;

declare function ifnet_get_address_list(interface: interop.PointerConvertible, addresses: interop.PointerConvertible): number;

declare function ifnet_get_address_list_with_count(interface: interop.PointerConvertible, addresses: interop.PointerConvertible, addresses_count: interop.PointerConvertible): number;

declare function ifnet_get_address_list_family(interface: interop.PointerConvertible, addresses: interop.PointerConvertible, family: number): number;

declare function ifnet_free_address_list(addresses: interop.PointerConvertible): void;

declare function ifnet_set_lladdr(interface: interop.PointerConvertible, lladdr: interop.PointerConvertible, lladdr_len: number): number;

declare function ifnet_lladdr_copy_bytes(interface: interop.PointerConvertible, lladdr: interop.PointerConvertible, length: number): number;

declare function ifnet_llbroadcast_copy_bytes(interface: interop.PointerConvertible, addr: interop.PointerConvertible, bufferlen: number, out_len: interop.PointerConvertible): number;

declare function ifnet_resolve_multicast(ifp: interop.PointerConvertible, proto_addr: interop.PointerConvertible, ll_addr: interop.PointerConvertible, ll_len: number): number;

declare function ifnet_add_multicast(interface: interop.PointerConvertible, maddr: interop.PointerConvertible, multicast: interop.PointerConvertible): number;

declare function ifnet_remove_multicast(multicast: interop.PointerConvertible): number;

declare function ifnet_get_multicast_list(interface: interop.PointerConvertible, addresses: interop.PointerConvertible): number;

declare function ifnet_free_multicast_list(multicasts: interop.PointerConvertible): void;

declare function ifnet_find_by_name(ifname: string, interface: interop.PointerConvertible): number;

declare function ifnet_list_get(family: number, interfaces: interop.PointerConvertible, count: interop.PointerConvertible): number;

declare function ifnet_list_free(interfaces: interop.PointerConvertible): void;

declare function ifaddr_reference(ifaddr: interop.PointerConvertible): number;

declare function ifaddr_release(ifaddr: interop.PointerConvertible): number;

declare function ifaddr_address(ifaddr: interop.PointerConvertible, out_addr: interop.PointerConvertible, addr_size: number): number;

declare function ifaddr_address_family(ifaddr: interop.PointerConvertible): number;

declare function ifaddr_dstaddress(ifaddr: interop.PointerConvertible, out_dstaddr: interop.PointerConvertible, dstaddr_size: number): number;

declare function ifaddr_netmask(ifaddr: interop.PointerConvertible, out_netmask: interop.PointerConvertible, netmask_size: number): number;

declare function ifaddr_ifnet(ifaddr: interop.PointerConvertible): interop.Pointer;

declare function ifaddr_withaddr(address: interop.PointerConvertible): interop.Pointer;

declare function ifaddr_withdstaddr(destination: interop.PointerConvertible): interop.Pointer;

declare function ifaddr_withnet(net: interop.PointerConvertible): interop.Pointer;

declare function ifaddr_withroute(flags: number, destination: interop.PointerConvertible, gateway: interop.PointerConvertible): interop.Pointer;

declare function ifaddr_findbestforaddr(addr: interop.PointerConvertible, interface: interop.PointerConvertible): interop.Pointer;

declare function ifaddr_get_ia6_flags(ifaddr: interop.PointerConvertible, out_flags: interop.PointerConvertible): number;

declare function ifmaddr_reference(ifmaddr: interop.PointerConvertible): number;

declare function ifmaddr_release(ifmaddr: interop.PointerConvertible): number;

declare function ifmaddr_address(ifmaddr: interop.PointerConvertible, out_multicast: interop.PointerConvertible, addr_size: number): number;

declare function ifmaddr_lladdress(ifmaddr: interop.PointerConvertible, out_link_layer_multicast: interop.PointerConvertible, addr_size: number): number;

declare function ifmaddr_ifnet(ifmaddr: interop.PointerConvertible): interop.Pointer;

declare function ether_family_init(): number;

declare function ether_demux(interface: interop.PointerConvertible, packet: interop.PointerConvertible, header: string, protocol: interop.PointerConvertible): number;

declare function ether_add_proto(interface: interop.PointerConvertible, protocol: number, demux_list: interop.PointerConvertible, demux_count: number): number;

declare function ether_del_proto(interface: interop.PointerConvertible, protocol: number): number;

declare function ether_frameout(interface: interop.PointerConvertible, packet: interop.PointerConvertible, dest: interop.PointerConvertible, dest_lladdr: string, frame_type: string): number;

declare function ether_ioctl(interface: interop.PointerConvertible, command: number, data: interop.PointerConvertible): number;

declare function ether_check_multi(ifp: interop.PointerConvertible, multicast: interop.PointerConvertible): number;

declare function proto_input(protocol: number, packet: interop.PointerConvertible): number;

declare function proto_inject(protocol: number, packet: interop.PointerConvertible): number;

declare function proto_register_plumber(proto_fam: number, if_fam: number, plumb: (p1: interop.PointerConvertible, p2: number) => number, unplumb: (p1: interop.PointerConvertible, p2: number) => void): number;

declare function proto_unregister_plumber(proto_fam: number, if_fam: number): void;

declare function iflt_attach(interface: interop.PointerConvertible, filter: interop.PointerConvertible, filter_ref: interop.PointerConvertible): number;

declare function iflt_detach(filter_ref: interop.PointerConvertible): void;

declare function net_init_add(init_func: () => void): number;

declare function nfsclnt(request: number, argstructp: interop.PointerConvertible): number;

declare function xb_init(p1: interop.PointerConvertible, p2: interop.Enum<typeof xdrbuf_type>): void;

declare function xb_init_buffer(p1: interop.PointerConvertible, p2: string, p3: number): void;

declare function xb_cleanup(p1: interop.PointerConvertible): void;

declare function xb_malloc(p1: number): interop.Pointer;

declare function xb_realloc(p1: interop.PointerConvertible, p2: number, p3: number): interop.Pointer;

declare function xb_free(p1: interop.PointerConvertible): void;

declare function xb_free_size(p1: interop.PointerConvertible, p2: number): void;

declare function xb_grow(p1: interop.PointerConvertible): number;

declare function xb_set_cur_buf_len(p1: interop.PointerConvertible): void;

declare function xb_buffer_base(p1: interop.PointerConvertible): string;

declare function xb_advance(p1: interop.PointerConvertible, p2: number): number;

declare function xb_offset(p1: interop.PointerConvertible): number;

declare function xb_seek(p1: interop.PointerConvertible, p2: number): number;

declare function xb_add_bytes(p1: interop.PointerConvertible, p2: string, p3: number, p4: number): number;

declare function xb_get_bytes(p1: interop.PointerConvertible, p2: string, p3: number, p4: number): number;

declare function rdmsr_carefully(msr: number, lo: interop.PointerConvertible, hi: interop.PointerConvertible): number;

declare function cpuid_cputype(): number;

declare function cpuid_cpusubtype(): number;

declare function cpuid_cpu_display(p1: string): void;

declare function cpuid_feature_display(p1: string): void;

declare function cpuid_extfeature_display(p1: string): void;

declare function cpuid_get_feature_names(p1: number, p2: string, p3: number): string;

declare function cpuid_get_extfeature_names(p1: number, p2: string, p3: number): string;

declare function cpuid_get_leaf7_feature_names(p1: number, p2: string, p3: number): string;

declare function cpuid_get_leaf7_extfeature_names(p1: number, p2: string, p3: number): string;

declare function cpuid_features(): number;

declare function cpuid_extfeatures(): number;

declare function cpuid_leaf7_features(): number;

declare function cpuid_leaf7_extfeatures(): number;

declare function cpuid_family(): number;

declare function cpuid_cpufamily(): number;

declare function cpuid_info(): interop.Pointer;

declare function cpuid_set_info(): void;

declare function cpuid_vmm_present(): number;

declare function cpuid_vmm_family(): number;

declare function cpuid_vmm_get_kvm_features(): number;

declare function cpuid_vmm_get_applepv_features(): number;

declare function ml_get_interrupts_enabled(): number;

declare function ml_set_interrupts_enabled(enable: number): number;

declare function ml_early_set_interrupts_enabled(enable: number): number;

declare function ml_at_interrupt_context(): number;

declare function bzero_phys(phys_address: number, length: number): void;

declare function ml_stack_remaining(): number;

declare function host_vmxon(exclusive: number): number;

declare function host_vmxoff(): void;

declare function sptm_retype(paddr: number, current_type: interop.Enum<typeof sptm_frame_type_t>, new_type: interop.Enum<typeof sptm_frame_type_t>, retype_params: sptm_retype_params_t): void;

declare function libsptm_init(statep: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_kvtophys(vaddr: number, paddrp: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_phystokv(paddr: number, vaddrp: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_get_vaddr_type(vaddr: number, frame_typep: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_get_paddr_type(paddr: number, frame_typep: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_paddr_is_last_mapping(paddr: number, refcnt_type: interop.Enum<typeof libsptm_refcnt_type_t>, is_lastp: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_panic_source(panic_domain_id: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_get_cpu_state(sptm_logical_cpu_id: number, state_type: interop.Enum<typeof libsptm_cpu_state_t>, state: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_get_panicking_cpu_id(sptm_logical_cpu_id: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_features_available(features: number, available: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_get_version_string(version_string: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function _sptm_pre_entry_hook(): void;

declare function _sptm_post_exit_hook(): void;

declare function sptm_lockdown(): void;

declare function sptm_lockdown_xnu(): void;

declare function sptm_init_xnu_fixups_complete(): void;

declare function sptm_disable_kernel_mode_cpa2(): void;

declare function sptm_xnu_panic_begin(): void;

declare function sptm_map_page(root_pt_paddr: number, vaddr: number, new_pte: number, flags: number): number;

declare function sptm_map_table(root_pt_paddr: number, vaddr: number, target_level: number, new_tte: number): number;

declare function sptm_unmap_table(root_pt_paddr: number, vaddr: number, target_level: number): void;

declare function sptm_surt_alloc(surt_frame: number, surt_index: number, attr_idx: number, flags: number, asid: number): void;

declare function sptm_surt_free(surt_frame: number, surt_index: number): void;

declare function sptm_condemn_leaf_table(root_pt_paddr: number, vaddr: number): number;

declare function sptm_uncondemn_leaf_table(root_pt_paddr: number, vaddr: number): void;

declare function sptm_serial_putc(c: number): void;

declare function sptm_serial_disable(): void;

declare function sptm_program_irgkey(seed: number): void;

declare function sptm_update_region(root_pt_paddr: number, start_vaddr: number, num_mappings: number, pte_templates_pa: number, options: number): number;

declare function sptm_update_disjoint(paddr: number, disjoint_ops_pa: number, num_mappings: number, options: number): number;

declare function sptm_update_disjoint_multipage(multipage_ops_pa: number, num_entries: number): number;

declare function sptm_unmap_region(root_pt_paddr: number, start_vaddr: number, num_mappings: number, options: number): void;

declare function sptm_unmap_disjoint(paddr: number, disjoint_ops_pa: number, num_mappings: number): void;

declare function sptm_configure_shared_region(shared_root_pt_paddr: number, start_vaddr: number, page_count: number): void;

declare function sptm_set_shared_region(user_root_pt_paddr: number, shared_root_pt_paddr: number): void;

declare function sptm_nest_region(user_root_pt_paddr: number, shared_root_pt_paddr: number, start_vaddr: number, page_count: number): void;

declare function sptm_unnest_region(user_root_pt_paddr: number, shared_root_pt_paddr: number, start_vaddr: number, page_count: number): void;

declare function sptm_configure_root(root_pt_paddr: number, flags: number, mask: number): void;

declare function sptm_switch_root(root_pt_paddr: number, override_flags: number, override_mask: number): number;

declare function sptm_guest_va_to_ipa(stage2_root_pt_paddr: number, gva: number): number;

declare function sptm_guest_stage1_tlb_op(stage2_root_pt_paddr: number, op: interop.Enum<typeof sptm_guest_stage1_tlb_op_t>, param: number): void;

declare function sptm_guest_stage2_tlb_op(stage2_root_pt_paddr: number, aligned_vaddr: number, num_mappings: number, last_level_only: boolean): void;

declare function sptm_guest_exit(stage2_root_pt_paddr: number): void;

declare function sptm_guest_dispatch(guest_state_paddr: number): void;

declare function sptm_register_xnu_exc_return(return_addr: number): void;

declare function sptm_register_cpu(physical_id: number): void;

declare function sptm_slide_region(target_papt_start: number, num_mappings: number): void;

declare function sptm_cpu_id(physical_id: number): number;

declare function sptm_output_area(sptm_cpu_id: number): number;

declare function sptm_iofilter_protected_write(paddr: number, value: number, width: number): void;

declare function txm_enter(endpoint_id: number, argsp: interop.PointerConvertible): number;

declare function txm_resume(caller_return_addr: number, thread_stack_paddr: number): void;

declare function sptm_resume_from_exception(caller_return_addr: number): void;

declare function sk_resume(caller_return_addr: number): void;

declare function sk_enter(endpoint_id: number, argsp: interop.PointerConvertible): number;

declare function sptm_check_inflight(paddr: number, is_inflightp: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_check_sapt_is_writable(paddr: number, is_sapt_writable: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_get_table_mapping_count(table_paddr: number, mapping_countp: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_prefetch_fte(paddr: number): interop.Enum<typeof libsptm_error_t>;

declare function sptm_trace_copy_traces(sptm_cpu_id: number, dst_buffer: interop.PointerConvertible, max_num_traces: number, read_index: interop.PointerConvertible, num_traces_copied: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_trace_num_new_traces(sptm_cpu_id: number, prev_state: interop.PointerConvertible, num_new_traces: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_copy_callee_saved_state(sptm_logical_cpu_id: number, regp: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_get_info(info: interop.Enum<typeof sptm_info_t>, arg: number, output: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_type_is_ecc_retireable(type: interop.Enum<typeof sptm_frame_type_t>, is_ecc_retireable: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function sptm_page_is_sk_shared_realtime(paddr: number, is_sk_shared_realtime: interop.PointerConvertible): interop.Enum<typeof libsptm_error_t>;

declare function _doprnt(format: string, arg: interop.PointerConvertible, lputc: (p1: number) => void, radix: number): void;

declare function ml_cpu_signal(cpu_id: number): void;

declare function ml_cpu_signal_deferred_adjust_timer(nanosecs: number): void;

declare function ml_cpu_signal_deferred_get_timer(): number;

declare function ml_cpu_signal_deferred(cpu_id: number): void;

declare function ml_cpu_signal_retract(cpu_id: number): void;

declare function ml_init_interrupt(): void;

declare function ml_get_interrupts_enabled(): number;

declare function ml_set_interrupts_enabled(enable: number): number;

declare function ml_set_interrupts_enabled(enable: number): number;

declare function ml_early_set_interrupts_enabled(enable: number): number;

declare function sched_perfcontrol_ml_set_interrupts_without_measurement(enable: number): number;

declare function sched_perfcontrol_abandon_preemption_disable_measurement(): void;

declare function ml_at_interrupt_context(): number;

declare function ml_cause_interrupt(): void;

declare function siq_init(): void;

declare function siq_cpu_init(): void;

declare function ex_cb_register(cb_class: interop.Enum<typeof ex_cb_class_t>, cb: (p1: interop.Enum<typeof ex_cb_class_t>, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => interop.Enum<typeof ex_cb_action_t>, refcon: interop.PointerConvertible): number;

declare function ex_cb_invoke(cb_class: interop.Enum<typeof ex_cb_class_t>, far: number): interop.Enum<typeof ex_cb_action_t>;

declare function ml_get_cpu_count(): number;

declare function ml_get_cpu_number_type(cluster_type: interop.Enum<typeof cluster_type_t>, logical: boolean, available: boolean): number;

declare function ml_get_cluster_number_type(cluster_type: interop.Enum<typeof cluster_type_t>): number;

declare function ml_cpu_cache_sharing(level: number, cluster_type: interop.Enum<typeof cluster_type_t>, include_all_cpu_types: boolean): number;

declare function ml_get_cpu_types(): number;

declare function ml_get_boot_cpu_number(): number;

declare function ml_get_cpu_number(phys_id: number): number;

declare function ml_get_cpu_number_local(): number;

declare function ml_get_cluster_number(phys_id: number): number;

declare function ml_get_max_cpu_number(): number;

declare function ml_get_max_cluster_number(): number;

declare function ml_get_first_cpu_id(cluster_id: number): number;

declare function ml_get_die_id(cluster_id: number): number;

declare function ml_get_die_cluster_id(cluster_id: number): number;

declare function ml_get_max_die_id(): number;

declare function ml_get_cluster_number_local(): number;

declare function ml_get_boot_cluster_type(): interop.Enum<typeof cluster_type_t>;

declare function ml_map_cpu_pio(): void;

declare function ml_processor_register(ml_processor_info: interop.PointerConvertible, processor: interop.PointerConvertible, ipi_handler: interop.PointerConvertible, pmi_handler: interop.PointerConvertible): number;

declare function ml_lockdown_handler_register(p1: (p1: interop.PointerConvertible) => void, p2: interop.PointerConvertible): number;

declare function ml_mcache_flush_callback_register(func: (p1: interop.PointerConvertible) => number, service: interop.PointerConvertible): number;

declare function ml_mcache_flush(): number;

declare function ml_static_vtop(p1: number): number;

declare function ml_static_verify_page_protections(base: number, size: number, prot: number): number;

declare function ml_static_ptovirt(p1: number): number;

declare function ml_get_abstime_offset(): number;

declare function ml_get_conttime_offset(): number;

declare function ml_probe_read(paddr: number, val: interop.PointerConvertible): number;

declare function ml_probe_read_64(paddr: number, val: interop.PointerConvertible): number;

declare function ml_phys_read_byte(paddr: number): number;

declare function ml_phys_read_byte_64(paddr: number): number;

declare function ml_phys_read_half(paddr: number): number;

declare function ml_phys_read_half_64(paddr: number): number;

declare function ml_phys_read(paddr: number): number;

declare function ml_phys_read_64(paddr: number): number;

declare function ml_phys_read_word(paddr: number): number;

declare function ml_phys_read_word_64(paddr: number): number;

declare function ml_phys_read_double(paddr: number): number;

declare function ml_phys_read_double_64(paddr: number): number;

declare function ml_phys_write_byte(paddr: number, data: number): void;

declare function ml_phys_write_byte_64(paddr: number, data: number): void;

declare function ml_phys_write_half(paddr: number, data: number): void;

declare function ml_phys_write_half_64(paddr: number, data: number): void;

declare function ml_phys_write(paddr: number, data: number): void;

declare function ml_phys_write_64(paddr: number, data: number): void;

declare function ml_phys_write_word(paddr: number, data: number): void;

declare function ml_phys_write_word_64(paddr: number, data: number): void;

declare function ml_phys_write_double(paddr: number, data: number): void;

declare function ml_phys_write_double_64(paddr: number, data: number): void;

declare function ml_static_mfree(p1: number, p2: number): void;

declare function ml_static_protect(start: number, size: number, new_prot: number): number;

declare function ml_vtophys(vaddr: number): number;

declare function ml_cpu_get_info(ml_cpu_info: interop.PointerConvertible): void;

declare function ml_cpu_get_info_type(ml_cpu_info: interop.PointerConvertible, cluster_type: interop.Enum<typeof cluster_type_t>): void;

declare function bzero_phys(phys_address: number, length: number): void;

declare function bzero_phys_nc(src64: number, bytes: number): void;

declare function bzero_phys_with_options(src: number, bytes: number, options: number): void;

declare function ml_thread_policy(thread: number, policy_id: number, policy_info: number): void;

declare function ml_set_max_cpus(max_cpus: number): void;

declare function ml_wait_max_cpus(): number;

declare function ml_get_machine_mem(): number;

declare function ml_cpu_init_completed(): void;

declare function ml_cpu_up(): void;

declare function ml_cpu_down(): void;

declare function ml_find_next_up_processor(): number;

declare function ml_cpu_up_update_counts(cpu_id: number): void;

declare function ml_cpu_down_update_counts(cpu_id: number): void;

declare function ml_arm_sleep(): void;

declare function ml_get_wake_timebase(): number;

declare function ml_get_conttime_wake_time(): number;

declare function ml_get_time_since_reset(): number;

declare function ml_set_reset_time(wake_time: number): void;

declare function ml_stack_remaining(): number;

declare function arm_debug_read_dscr(): number;

declare function set_be_bit(): number;

declare function clr_be_bit(): number;

declare function be_tracing(): number;

declare function cpu_broadcast_xcall(p1: interop.PointerConvertible, p2: number, p3: (p1: interop.PointerConvertible) => void, p4: interop.PointerConvertible): number;

declare function cpu_broadcast_xcall_simple(p1: number, p2: (p1: interop.PointerConvertible) => void, p3: interop.PointerConvertible): number;

declare function cpu_xcall(p1: number, p2: (p1: interop.PointerConvertible) => void, p3: interop.PointerConvertible): number;

declare function cpu_immediate_xcall(p1: number, p2: (p1: interop.PointerConvertible) => void, p3: interop.PointerConvertible): number;

declare function machine_timeout_suspended(): number;

declare function ml_get_power_state(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function get_arm_cpu_version(): number;

declare function user_cont_hwclock_allowed(): number;

declare function user_timebase_type(): number;

declare function ml_thread_is64bit(thread: number): number;

declare function ml_set_align_checking(): void;

declare function wfe_timeout_configure(): void;

declare function wfe_timeout_init(): void;

declare function ml_timer_evaluate(): void;

declare function ml_timer_forced_evaluation(): number;

declare function ml_gpu_stat_update(p1: number): void;

declare function ml_gpu_stat(p1: number): number;

declare function ml_hibernate_active_pre(): void;

declare function ml_hibernate_active_post(): void;

declare function ml_report_minor_badness(badness_id: number): void;

declare function cpu_event_register_callback(fn: (p1: interop.PointerConvertible, p2: interop.Enum<typeof cpu_event>, p3: number) => boolean, param: interop.PointerConvertible): void;

declare function cpu_event_unregister_callback(fn: (p1: interop.PointerConvertible, p2: interop.Enum<typeof cpu_event>, p3: number) => boolean): void;

declare function cpu_event_debug_log(event: interop.Enum<typeof cpu_event>, cpu_or_cluster: number): void;

declare function dump_cpu_event_log(printf_func: (p1: string) => number): void;

declare function ml_io_read(iovaddr: number, iovsz: number): number;

declare function ml_io_read8(iovaddr: number): number;

declare function ml_io_read16(iovaddr: number): number;

declare function ml_io_read32(iovaddr: number): number;

declare function ml_io_read64(iovaddr: number): number;

declare function ml_io_read_cpu_reg(io_vaddr: number, io_sz: number, logical_cpu: number): number;

declare function ml_io_write(vaddr: number, val: number, size: number): void;

declare function ml_io_write8(vaddr: number, val: number): void;

declare function ml_io_write16(vaddr: number, val: number): void;

declare function ml_io_write32(vaddr: number, val: number): void;

declare function ml_io_write64(vaddr: number, val: number): void;

declare function IOLockAlloc(): interop.Pointer;

declare function IOLockFree(lock: interop.PointerConvertible): void;

declare function IOLockGetMachLock(lock: interop.PointerConvertible): interop.Pointer;

declare function IOLockLock(lock: interop.PointerConvertible): void;

declare function IOLockTryLock(lock: interop.PointerConvertible): number;

declare function IOLockUnlock(lock: interop.PointerConvertible): void;

declare function IOLockInitWithState(lock: interop.PointerConvertible, state: interop.Enum<typeof IOLockState>): void;

declare function IORecursiveLockAlloc(): interop.Pointer;

declare function IORecursiveLockFree(lock: interop.PointerConvertible): void;

declare function IORecursiveLockGetMachLock(lock: interop.PointerConvertible): interop.Pointer;

declare function IORecursiveLockLock(lock: interop.PointerConvertible): void;

declare function IORecursiveLockTryLock(lock: interop.PointerConvertible): number;

declare function IORecursiveLockUnlock(lock: interop.PointerConvertible): void;

declare function IORecursiveLockHaveLock(lock: interop.PointerConvertible): number;

declare function IORecursiveLockSleep(_lock: interop.PointerConvertible, event: interop.PointerConvertible, interType: number): number;

declare function IORecursiveLockSleepDeadline(_lock: interop.PointerConvertible, event: interop.PointerConvertible, deadline: UnsignedWide, interType: number): number;

declare function IORecursiveLockWakeup(_lock: interop.PointerConvertible, event: interop.PointerConvertible, oneThread: boolean): void;

declare function IORWLockAlloc(): interop.Pointer;

declare function IORWLockFree(lock: interop.PointerConvertible): void;

declare function IORWLockGetMachLock(lock: interop.PointerConvertible): interop.Pointer;

declare function IORWLockRead(lock: interop.PointerConvertible): void;

declare function IORWLockTryRead(lock: interop.PointerConvertible): void;

declare function IORWLockWrite(lock: interop.PointerConvertible): void;

declare function IORWLockTryWrite(lock: interop.PointerConvertible): void;

declare function IORWLockUnlock(lock: interop.PointerConvertible): void;

declare function IOSimpleLockAlloc(): interop.Pointer;

declare function IOSimpleLockFree(lock: interop.PointerConvertible): void;

declare function IOSimpleLockGetMachLock(lock: interop.PointerConvertible): interop.Pointer;

declare function IOSimpleLockInit(lock: interop.PointerConvertible): void;

declare function IOSimpleLockDestroy(lock: interop.PointerConvertible): void;

declare function IOSimpleLockLock(lock: interop.PointerConvertible): void;

declare function IOSimpleLockTryLock(lock: interop.PointerConvertible): number;

declare function IOSimpleLockUnlock(lock: interop.PointerConvertible): void;

declare function IOMalloc(size: number): interop.Pointer;

declare function IOMallocZero(size: number): interop.Pointer;

declare function IOFree(address: interop.PointerConvertible, size: number): void;

declare function IOMallocAligned(size: number, alignment: number): interop.Pointer;

declare function IOFreeAligned(address: interop.PointerConvertible, size: number): void;

declare function IOMallocContiguous(size: number, alignment: number, physicalAddress: interop.PointerConvertible): interop.Pointer;

declare function IOFreeContiguous(address: interop.PointerConvertible, size: number): void;

declare function IOMallocPageable(size: number, alignment: number): interop.Pointer;

declare function IOMallocPageableZero(size: number, alignment: number): interop.Pointer;

declare function IOFreePageable(address: interop.PointerConvertible, size: number): void;

declare function IOMallocData(size: number): interop.Pointer;

declare function IOMallocZeroData(size: number): interop.Pointer;

declare function IOMallocDataShareable(size: number): interop.Pointer;

declare function IOMallocZeroDataShareable(size: number): interop.Pointer;

declare function IOFreeData(address: interop.PointerConvertible, size: number): void;

declare function IOFreeDataShareable(address: interop.PointerConvertible, size: number): void;

declare function IOMappedRead8(address: number): number;

declare function IOMappedRead16(address: number): number;

declare function IOMappedRead32(address: number): number;

declare function IOMappedRead64(address: number): number;

declare function IOMappedWrite8(address: number, value: number): void;

declare function IOMappedWrite16(address: number, value: number): void;

declare function IOMappedWrite32(address: number, value: number): void;

declare function IOMappedWrite64(address: number, value: number): void;

declare function IOSetProcessorCacheMode(task: number, address: number, length: number, cacheMode: number): number;

declare function IOFlushProcessorCache(task: number, address: number, length: number): number;

declare function IOCreateThread(function$: (p1: interop.PointerConvertible) => void, argument: interop.PointerConvertible): number;

declare function IOExitThread(): void;

declare function IOSleep(milliseconds: number): void;

declare function IOSleepWithLeeway(intervalMilliseconds: number, leewayMilliseconds: number): void;

declare function IODelay(microseconds: number): void;

declare function IOPause(nanoseconds: number): void;

declare function IOLog(format: string): void;

declare function IOLogv(format: string, ap: string): void;

declare function IOFindNameForValue(value: number, namedValueArray: interop.PointerConvertible): string;

declare function IOFindValueForName(string: string, regValueArray: interop.PointerConvertible, value: interop.PointerConvertible): number;

declare function Debugger(reason: string): void;

declare function IOBSDNameMatching(name: string): interop.Pointer;

declare function IOOFPathMatching(path: string, buf: string, maxLen: number): interop.Pointer;

declare function IOSizeToAlignment(size: number): number;

declare function IOAlignmentToSize(align: number): number;

declare function IOGetTime(clock_time: interop.PointerConvertible): void;

declare function OSUnserializeBinary(buffer: interop.PointerConvertible, bufferSize: number): interop.Pointer;

declare function IOPrintPlane(plane: interop.PointerConvertible): void;

declare function OSPrintMemory(): void;

declare function IOServiceOrdering(inObj1: interop.PointerConvertible, inObj2: interop.PointerConvertible, ref: interop.PointerConvertible): number;

declare function IOMapperIOVMAlloc(pages: number): number;

declare function IOMapperIOVMFree(addr: number, pages: number): void;

declare function IOMapperInsertPage(addr: number, offset: number, page: number): number;

declare function HIDOpenReportDescriptor(hidReportDescriptor: interop.PointerConvertible, descriptorLength: number, preparsedDataRef: interop.PointerConvertible, flags: number): number;

declare function HIDCloseReportDescriptor(preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetButtonCaps(reportType: number, buttonCaps: interop.PointerConvertible, buttonCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetButtonCapabilities(reportType: number, buttonCaps: interop.PointerConvertible, buttonCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetCaps(preparsedDataRef: interop.PointerConvertible, capabilities: interop.PointerConvertible): number;

declare function HIDGetCapabilities(preparsedDataRef: interop.PointerConvertible, capabilities: interop.PointerConvertible): number;

declare function HIDGetCollectionNodes(collectionNodes: interop.PointerConvertible, collectionNodesSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetScaledUsageValue(reportType: number, usagePage: number, collection: number, usage: number, usageValue: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDGetSpecificButtonCaps(reportType: number, usagePage: number, collection: number, usage: number, buttonCaps: interop.PointerConvertible, buttonCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetSpecificButtonCapabilities(reportType: number, usagePage: number, collection: number, usage: number, buttonCaps: interop.PointerConvertible, buttonCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetSpecificValueCaps(reportType: number, usagePage: number, collection: number, usage: number, valueCaps: interop.PointerConvertible, valueCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetSpecificValueCapabilities(reportType: number, usagePage: number, collection: number, usage: number, valueCaps: interop.PointerConvertible, valueCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetButtonsOnPage(reportType: number, usagePage: number, collection: number, usageList: interop.PointerConvertible, usageListSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDGetButtons(reportType: number, collection: number, usageList: interop.PointerConvertible, usageListSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDGetNextButtonInfo(reportType: number, usagePage: number, usage: number, collection: interop.PointerConvertible, reportID: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetNextUsageValueInfo(reportType: number, usagePage: number, usage: number, collection: interop.PointerConvertible, reportID: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetReportLength(reportType: number, reportID: number, reportLength: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetUsageValue(reportType: number, usagePage: number, collection: number, usage: number, usageValue: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDGetUsageValueArray(reportType: number, usagePage: number, collection: number, usage: number, usageValueBuffer: interop.PointerConvertible, usageValueBufferSize: number, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDGetValueCaps(reportType: number, valueCaps: interop.PointerConvertible, valueCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDGetValueCapabilities(reportType: number, valueCaps: interop.PointerConvertible, valueCapsSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDInitReport(reportType: number, reportID: number, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDMaxUsageListLength(reportType: number, usagePage: number, preparsedDataRef: interop.PointerConvertible): number;

declare function HIDSetScaledUsageValue(reportType: number, usagePage: number, collection: number, usage: number, usageValue: number, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDSetButtons(reportType: number, usagePage: number, collection: number, usageList: interop.PointerConvertible, usageListSize: interop.PointerConvertible, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDSetUsageValue(reportType: number, usagePage: number, collection: number, usage: number, usageValue: number, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDSetUsageValueArray(reportType: number, usagePage: number, collection: number, usage: number, usageValueBuffer: interop.PointerConvertible, usageValueBufferLength: number, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function HIDUsageListDifference(previousUsageList: interop.PointerConvertible, currentUsageList: interop.PointerConvertible, breakUsageList: interop.PointerConvertible, makeUsageList: interop.PointerConvertible, usageListsSize: number): number;

declare function HIDSetButton(reportType: number, usagePage: number, collection: number, usage: number, preparsedDataRef: interop.PointerConvertible, report: interop.PointerConvertible, reportLength: number): number;

declare function registerSleepWakeInterest(p1: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: number) => number, p2: interop.PointerConvertible, p3: interop.PointerConvertible): interop.Pointer;

declare function registerPrioritySleepWakeInterest(handler: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: number) => number, self: interop.PointerConvertible, ref: interop.PointerConvertible): interop.Pointer;

declare function acknowledgeSleepWakeNotification(p1: interop.PointerConvertible): number;

declare function vetoSleepWakeNotification(PMrefcon: interop.PointerConvertible): number;

declare function PEGetMachineName(name: string, maxLength: number): number;

declare function PEGetModelName(name: string, maxLength: number): number;

declare function PEGetTargetName(name: string, maxLength: number): number;

declare function PEGetProductName(name: string, maxLength: number): number;

declare function PEGetPlatformEpoch(): number;

declare function PEHaltRestart(type: number): number;

declare function PESavePanicInfo(buffer: interop.PointerConvertible, length: number): number;

declare function PESavePanicInfoAction(buffer: interop.PointerConvertible, offset: number, length: number): void;

declare function PESendPanicInfoAction(length: number): void;

declare function PEGetGMTTimeOfDay(): number;

declare function PESetGMTTimeOfDay(secs: number): void;

declare function PEGetUTCTimeOfDay(secs: interop.PointerConvertible, usecs: interop.PointerConvertible): void;

declare function PESetUTCTimeOfDay(secs: number, usecs: number): void;

declare function PEWriteNVRAMBooleanProperty(symbol: string, value: number): number;

declare function PEWriteNVRAMProperty(symbol: string, value: interop.PointerConvertible, len: number): number;

declare function PEWriteNVRAMPropertyWithCopy(symbol: string, value: interop.PointerConvertible, len: number): number;

declare function PEReadNVRAMProperty(symbol: string, value: interop.PointerConvertible, len: interop.PointerConvertible): number;

declare function PEReadNVRAMBooleanProperty(symbol: string, value: interop.PointerConvertible): number;

declare function PERemoveNVRAMProperty(symbol: string): number;

declare function PESyncNVRAM(): number;

declare function PEGetCoprocessorVersion(): interop.Enum<typeof coprocessor_type_t>;

declare function IODeviceTreeAlloc(dtTop: interop.PointerConvertible): interop.Pointer;

declare function IODTMatchNubWithKeys(nub: interop.PointerConvertible, keys: string): boolean;

declare function IODTCompareNubName(regEntry: interop.PointerConvertible, name: interop.PointerConvertible, matchingName: interop.PointerConvertible): boolean;

declare function IODTCompareNubName(regEntry: interop.PointerConvertible, name: interop.PointerConvertible, p3: number): boolean;

declare function IODTFindMatchingEntries(from: interop.PointerConvertible, options: number, keys: string): interop.Pointer;

declare function IODTSetResolving(regEntry: interop.PointerConvertible, compareFunc: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, locationFunc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => void): void;

declare function IODTGetCellCounts(regEntry: interop.PointerConvertible, sizeCount: interop.PointerConvertible, addressCount: interop.PointerConvertible): void;

declare function IODTResolveAddressCell(regEntry: interop.PointerConvertible, cellsIn: interop.Pointer, phys: interop.PointerConvertible, len: interop.PointerConvertible): boolean;

declare function IODTResolveAddressing(regEntry: interop.PointerConvertible, addressPropertyName: string, parent: interop.PointerConvertible): interop.Pointer;

declare function IODTMakeNVDescriptor(regEntry: interop.PointerConvertible, hdr: interop.PointerConvertible): number;

declare function IODTFindSlotName(regEntry: interop.PointerConvertible, deviceNumber: number): interop.Pointer;

declare function IODTInterruptControllerName(regEntry: interop.PointerConvertible): interop.Pointer;

declare function IODTMapInterrupts(regEntry: interop.PointerConvertible): boolean;

declare function IODTGetInterruptOptions(regEntry: interop.PointerConvertible, source: number, options: interop.PointerConvertible): number;

declare function IONDRVLibrariesInitialize(provider: interop.PointerConvertible): number;

declare function IOCircularDataQueueCreateWithEntries(options: interop.Enum<typeof IOCircularDataQueueCreateOptions>, numEntries: number, entrySize: number, pQueue: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyMemoryDescriptor(queue: interop.PointerConvertible): interop.Pointer;

declare function IOCircularDataQueueDestroy(pQueue: interop.PointerConvertible): number;

declare function IOCircularDataQueueEnqueue(queue: interop.PointerConvertible, data: interop.PointerConvertible, dataSize: number): number;

declare function IOCircularDataQueueGetLatest(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyLatest(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueGetNext(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyNext(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueGetPrevious(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyPrevious(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueIsCurrentDataValid(queue: interop.PointerConvertible): number;

declare function IOCircularDataQueueSetCursorLatest(queue: interop.PointerConvertible): number;

declare function IOCircularDataQueueGetCurrent(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyCurrent(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueGetLatestWithBlock(queue: interop.PointerConvertible, handler: (p1: interop.PointerConvertible, p2: number) => void): number;

declare function IOCircularDataQueueGetNextWithBlock(queue: interop.PointerConvertible, handler: (p1: interop.PointerConvertible, p2: number) => void): number;

declare function IOCircularDataQueueGetPreviousWithBlock(queue: interop.PointerConvertible, handler: (p1: interop.PointerConvertible, p2: number) => void): number;

declare function FWComputeCRC16(pQuads: interop.PointerConvertible, numQuads: number): number;

declare function FWUpdateCRC16(crc16: number, quad: number): number;

declare function AddFWCycleTimeToFWCycleTime(cycleTime1: number, cycleTime2: number): number;

declare function SubtractFWCycleTimeFromFWCycleTime(cycleTime1: number, cycleTime2: number): number;

declare function IOFWGetAbsoluteTime(result: interop.PointerConvertible): void;

declare function mbuf_data_len(mbuf: interop.PointerConvertible, out_buf: interop.PointerConvertible, out_len: interop.PointerConvertible): number;

declare function mbuf_data(mbuf: interop.PointerConvertible): interop.Pointer;

declare function mbuf_datastart(mbuf: interop.PointerConvertible): interop.Pointer;

declare function mbuf_setdata(mbuf: interop.PointerConvertible, data: interop.PointerConvertible, len: number): number;

declare function mbuf_align_32(mbuf: interop.PointerConvertible, len: number): number;

declare function mbuf_data_to_physical(ptr: interop.PointerConvertible): number;

declare function mbuf_get(how: number, type: number, mbuf: interop.PointerConvertible): number;

declare function mbuf_gethdr(how: number, type: number, mbuf: interop.PointerConvertible): number;

declare function mbuf_attachcluster(how: number, type: number, mbuf: interop.PointerConvertible, extbuf: string, extfree: (p1: string, p2: number, p3: string) => void, extsize: number, extarg: string): number;

declare function mbuf_alloccluster(how: number, size: interop.PointerConvertible, addr: interop.PointerConvertible): number;

declare function mbuf_freecluster(addr: string, size: number): void;

declare function mbuf_getcluster(how: number, type: number, size: number, mbuf: interop.PointerConvertible): number;

declare function mbuf_mclget(how: number, type: number, mbuf: interop.PointerConvertible): number;

declare function mbuf_allocpacket(how: number, packetlen: number, maxchunks: interop.PointerConvertible, mbuf: interop.PointerConvertible): number;

declare function mbuf_allocpacket_list(numpkts: number, how: number, packetlen: number, maxchunks: interop.PointerConvertible, mbuf: interop.PointerConvertible): number;

declare function mbuf_getpacket(how: number, mbuf: interop.PointerConvertible): number;

declare function mbuf_free(mbuf: interop.PointerConvertible): interop.Pointer;

declare function mbuf_freem(mbuf: interop.PointerConvertible): void;

declare function mbuf_freem_list(mbuf: interop.PointerConvertible): number;

declare function mbuf_leadingspace(mbuf: interop.PointerConvertible): number;

declare function mbuf_trailingspace(mbuf: interop.PointerConvertible): number;

declare function mbuf_copym(src: interop.PointerConvertible, offset: number, len: number, how: number, new_mbuf: interop.PointerConvertible): number;

declare function mbuf_dup(src: interop.PointerConvertible, how: number, new_mbuf: interop.PointerConvertible): number;

declare function mbuf_prepend(mbuf: interop.PointerConvertible, len: number, how: number): number;

declare function mbuf_split(src: interop.PointerConvertible, offset: number, how: number, new_mbuf: interop.PointerConvertible): number;

declare function mbuf_pullup(mbuf: interop.PointerConvertible, len: number): number;

declare function mbuf_pulldown(src: interop.PointerConvertible, offset: interop.PointerConvertible, length: number, location: interop.PointerConvertible): number;

declare function mbuf_adj(mbuf: interop.PointerConvertible, len: number): void;

declare function mbuf_adjustlen(mbuf: interop.PointerConvertible, amount: number): number;

declare function mbuf_concatenate(dst: interop.PointerConvertible, src: interop.PointerConvertible): interop.Pointer;

declare function mbuf_copydata(mbuf: interop.PointerConvertible, offset: number, length: number, out_data: interop.PointerConvertible): number;

declare function mbuf_copyback(mbuf: interop.PointerConvertible, offset: number, length: number, data: interop.PointerConvertible, how: number): number;

declare function mbuf_mclhasreference(mbuf: interop.PointerConvertible): number;

declare function mbuf_next(mbuf: interop.PointerConvertible): interop.Pointer;

declare function mbuf_setnext(mbuf: interop.PointerConvertible, next: interop.PointerConvertible): number;

declare function mbuf_nextpkt(mbuf: interop.PointerConvertible): interop.Pointer;

declare function mbuf_setnextpkt(mbuf: interop.PointerConvertible, nextpkt: interop.PointerConvertible): void;

declare function mbuf_len(mbuf: interop.PointerConvertible): number;

declare function mbuf_setlen(mbuf: interop.PointerConvertible, len: number): void;

declare function mbuf_maxlen(mbuf: interop.PointerConvertible): number;

declare function mbuf_type(mbuf: interop.PointerConvertible): number;

declare function mbuf_settype(mbuf: interop.PointerConvertible, new_type: number): number;

declare function mbuf_flags(mbuf: interop.PointerConvertible): number;

declare function mbuf_setflags(mbuf: interop.PointerConvertible, flags: number): number;

declare function mbuf_setflags_mask(mbuf: interop.PointerConvertible, flags: number, mask: number): number;

declare function mbuf_copy_pkthdr(dest: interop.PointerConvertible, src: interop.PointerConvertible): number;

declare function mbuf_pkthdr_len(mbuf: interop.PointerConvertible): number;

declare function mbuf_pkthdr_setlen(mbuf: interop.PointerConvertible, len: number): void;

declare function mbuf_pkthdr_adjustlen(mbuf: interop.PointerConvertible, amount: number): void;

declare function mbuf_pkthdr_rcvif(mbuf: interop.PointerConvertible): interop.Pointer;

declare function mbuf_pkthdr_setrcvif(mbuf: interop.PointerConvertible, ifp: interop.PointerConvertible): number;

declare function mbuf_pkthdr_header(mbuf: interop.PointerConvertible): interop.Pointer;

declare function mbuf_pkthdr_setheader(mbuf: interop.PointerConvertible, header: interop.PointerConvertible): void;

declare function mbuf_inbound_modified(mbuf: interop.PointerConvertible): void;

declare function mbuf_outbound_finalize(mbuf: interop.PointerConvertible, protocol_family: number, protocol_offset: number): void;

declare function mbuf_set_vlan_tag(mbuf: interop.PointerConvertible, vlan: number): number;

declare function mbuf_get_vlan_tag(mbuf: interop.PointerConvertible, vlan: interop.PointerConvertible): number;

declare function mbuf_clear_vlan_tag(mbuf: interop.PointerConvertible): number;

declare function mbuf_get_csum_requested(mbuf: interop.PointerConvertible, request: interop.PointerConvertible, value: interop.PointerConvertible): number;

declare function mbuf_get_tso_requested(mbuf: interop.PointerConvertible, request: interop.PointerConvertible, mss: interop.PointerConvertible): number;

declare function mbuf_clear_csum_requested(mbuf: interop.PointerConvertible): number;

declare function mbuf_set_csum_performed(mbuf: interop.PointerConvertible, flags: number, value: number): number;

declare function mbuf_get_mlen(): number;

declare function mbuf_get_mhlen(): number;

declare function mbuf_get_minclsize(): number;

declare function mbuf_clear_csum_performed(mbuf: interop.PointerConvertible): number;

declare function mbuf_inet_cksum(mbuf: interop.PointerConvertible, protocol: number, offset: number, length: number, csum: interop.PointerConvertible): number;

declare function mbuf_inet6_cksum(mbuf: interop.PointerConvertible, protocol: number, offset: number, length: number, csum: interop.PointerConvertible): number;

declare function mbuf_tag_id_find(module_string: string, module_id: interop.PointerConvertible): number;

declare function mbuf_tag_allocate(mbuf: interop.PointerConvertible, module_id: number, type: number, length: number, how: number, data_p: interop.PointerConvertible): number;

declare function mbuf_tag_find(mbuf: interop.PointerConvertible, module_id: number, type: number, length: interop.PointerConvertible, data_p: interop.PointerConvertible): number;

declare function mbuf_tag_free(mbuf: interop.PointerConvertible, module_id: number, type: number): void;

declare function mbuf_stats(stats: interop.PointerConvertible): void;

declare function mbuf_get_traffic_class(mbuf: interop.PointerConvertible): interop.Enum<typeof mbuf_traffic_class_t>;

declare function mbuf_set_traffic_class(mbuf: interop.PointerConvertible, tc: interop.Enum<typeof mbuf_traffic_class_t>): number;

declare function mbuf_is_traffic_class_privileged(mbuf: interop.PointerConvertible): number;

declare function _IONDRVLibrariesInitialize(provider: interop.PointerConvertible): number;

declare function _IONDRVLibrariesFinalize(provider: interop.PointerConvertible): number;

declare function RegistryEntryIDCopy(entryID: interop.PointerConvertible, to: interop.PointerConvertible): number;

declare function RegistryEntryIDInit(entryID: interop.PointerConvertible): number;

declare function RegistryEntryIDCompare(id1: interop.PointerConvertible, id2: interop.PointerConvertible): number;

declare function RegistryPropertyGetSize(entryID: interop.PointerConvertible, propertyName: string, propertySize: interop.PointerConvertible): number;

declare function RegistryPropertyGet(entryID: interop.PointerConvertible, propertyName: string, propertyValue: interop.PointerConvertible, propertySize: interop.PointerConvertible): number;

declare function RegistryPropertyCreate(entryID: interop.PointerConvertible, propertyName: string, propertyValue: interop.PointerConvertible, propertySize: number): number;

declare function RegistryPropertyDelete(entryID: interop.PointerConvertible, propertyName: string): number;

declare function RegistryPropertySet(entryID: interop.PointerConvertible, propertyName: string, propertyValue: interop.PointerConvertible, propertySize: number): number;

declare function RegistryPropertyGetMod(entry: interop.PointerConvertible, name: string, modifiers: interop.PointerConvertible): number;

declare function RegistryPropertySetMod(entry: interop.PointerConvertible, name: string, modifiers: number): number;

declare function RegistryPropertyIterateCreate(entry: interop.PointerConvertible, cookie: interop.PointerConvertible): number;

declare function RegistryPropertyIterateDispose(cookie: interop.PointerConvertible): number;

declare function RegistryPropertyIterate(cookie: interop.PointerConvertible, foundProperty: string, done: interop.PointerConvertible): number;

declare function RegistryEntryIterateCreate(cookie: interop.PointerConvertible): number;

declare function RegistryEntryIterateDispose(cookie: interop.PointerConvertible): number;

declare function RegistryEntryIterate(cookie: interop.PointerConvertible, relationship: number, foundEntry: interop.PointerConvertible, done: interop.PointerConvertible): number;

declare function RegistryCStrEntryToName(entryID: interop.PointerConvertible, parentEntry: interop.PointerConvertible, nameComponent: string, done: interop.PointerConvertible): number;

declare function RegistryCStrEntryLookup(parentEntry: interop.PointerConvertible, path: string, newEntry: interop.PointerConvertible): number;

declare function RegistryEntryIDDispose(entryID: interop.PointerConvertible): number;

declare function VSLNewInterruptService(serviceDevice: interop.PointerConvertible, serviceType: number, serviceID: interop.PointerConvertible): number;

declare function VSLDisposeInterruptService(serviceID: interop.PointerConvertible): number;

declare function VSLDoInterruptService(serviceID: interop.PointerConvertible): number;

declare function VSLPrepareCursorForHardwareCursor(cursorRef: interop.PointerConvertible, hardwareDescriptor: interop.PointerConvertible, hwCursorInfo: interop.PointerConvertible): number;

declare function agdcGTraceToken(fb: interop.PointerConvertible, line: number, useController: boolean, fnID: number, fnType: number, tag1: number, arg1: number, tag2: number, arg2: number, tag3: number, arg3: number): void;

declare function IOUSBHostCIMessageStatusToIOReturn(status: interop.Enum<typeof IOUSBHostCIMessageStatus>): number;

declare function IOUSBHostCIMessageStatusFromIOReturn(status: number): interop.Enum<typeof IOUSBHostCIMessageStatus>;

declare function IOUSBHostCILinkStateEnabled(linkState: interop.Enum<typeof IOUSBHostCILinkState>): boolean;

declare function IOUSBHostCIMessageTypeToString(type: interop.Enum<typeof IOUSBHostCIMessageType>): string;

declare function IOUSBHostCIMessageStatusToString(status: interop.Enum<typeof IOUSBHostCIMessageStatus>): string;

declare function IOUSBHostCILinkStateToString(linkState: interop.Enum<typeof IOUSBHostCILinkState>): string;

declare function IOUSBHostCIDeviceSpeedToString(speed: interop.Enum<typeof IOUSBHostCIDeviceSpeed>): string;

declare function IOUSBHostCIExceptionTypeToString(exceptionType: interop.Enum<typeof IOUSBHostCIExceptionType>): string;

declare function IOUSBHostCIControllerStateToString(controllerState: interop.Enum<typeof IOUSBHostCIControllerState>): string;

declare function IOUSBHostCIPortStateToString(portState: interop.Enum<typeof IOUSBHostCIPortState>): string;

declare function IOUSBHostCIDeviceStateToString(deviceState: interop.Enum<typeof IOUSBHostCIDeviceState>): string;

declare function IOUSBHostCIEndpointStateToString(endpointState: interop.Enum<typeof IOUSBHostCIEndpointState>): string;

declare function UInt64mult(A: number, B: number): number;

declare function IOAF_Int8ToFloat32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_NativeInt16ToFloat32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_SwapInt16ToFloat32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_NativeInt24ToFloat32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_SwapInt24ToFloat32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_NativeInt32ToFloat32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_SwapInt32ToFloat32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_Float32ToInt8(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_Float32ToNativeInt16(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_Float32ToSwapInt16(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_Float32ToNativeInt24(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_Float32ToSwapInt24(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_Float32ToNativeInt32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_Float32ToSwapInt32(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function IOAF_bcopy_WriteCombine(src: interop.PointerConvertible, dest: interop.PointerConvertible, count: number): void;

declare function _isQueueMemoryCorrupted(queue: interop.PointerConvertible): boolean;

declare function destroyQueueMem(queue: interop.PointerConvertible): number;

declare function _reset(queue: interop.PointerConvertible): number;

declare function _enqueueInternal(queue: interop.PointerConvertible, data: interop.PointerConvertible, dataSize: number, earlyExitForTesting: number): number;

declare function enqueueQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, dataSize: number): number;

declare function isDataEntryValidInQueueMem(queue: interop.PointerConvertible): number;

declare function setCursorLatestInQueueMem(queue: interop.PointerConvertible): number;

declare function _getLatestInQueueMemInternal(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible, copyMem: boolean): number;

declare function getLatestInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function copyLatestInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function _getNextInQueueMemInternal(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible, copyMem: boolean): number;

declare function getNextInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function copyNextInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function _getPrevInQueueMemInternal(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible, copyMem: boolean): number;

declare function getPrevInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function copyPrevInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function _getCurrentInQueueMemInternal(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible, copyMem: boolean): number;

declare function getCurrentInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function copyCurrentInQueueMem(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function _initCursor(queue: interop.PointerConvertible): void;

declare function IOCircularDataQueueCreateWithEntries(options: interop.Enum<typeof IOCircularDataQueueCreateOptions>, numEntries: number, entrySize: number, pQueue: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyMemoryDescriptor(queue: interop.PointerConvertible): interop.Pointer;

declare function IOCircularDataQueueDestroy(pQueue: interop.PointerConvertible): number;

declare function IOCircularDataQueueEnqueue(queue: interop.PointerConvertible, data: interop.PointerConvertible, dataSize: number): number;

declare function IOCircularDataQueueGetLatest(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyLatest(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueGetNext(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyNext(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueGetPrevious(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyPrevious(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueIsCurrentDataValid(queue: interop.PointerConvertible): number;

declare function IOCircularDataQueueSetCursorLatest(queue: interop.PointerConvertible): number;

declare function IOCircularDataQueueGetCurrent(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function IOCircularDataQueueCopyCurrent(queue: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function inet_arp_lookup(interface: interop.PointerConvertible, ip_dest: interop.PointerConvertible, ll_dest: interop.PointerConvertible, ll_dest_len: number, hint: interop.PointerConvertible, packet: interop.PointerConvertible): number;

declare function inet_arp_handle_input(ifp: interop.PointerConvertible, arpop: number, sender_hw: interop.PointerConvertible, sender_ip: interop.PointerConvertible, target_ip: interop.PointerConvertible): number;

declare function inet_arp_init_ifaddr(interface: interop.PointerConvertible, ipaddr: interop.PointerConvertible): void;

declare function ipf_addv4(filter: interop.PointerConvertible, filter_ref: interop.PointerConvertible): number;

declare function ipf_addv6(filter: interop.PointerConvertible, filter_ref: interop.PointerConvertible): number;

declare function ipf_remove(filter_ref: interop.PointerConvertible): number;

declare function ipf_inject_input(data: interop.PointerConvertible, filter_ref: interop.PointerConvertible): number;

declare function ipf_inject_output(data: interop.PointerConvertible, filter_ref: interop.PointerConvertible, options: interop.PointerConvertible): number;

declare function kdp_register_send_receive(send: (p1: interop.PointerConvertible, p2: number) => void, receive: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void): void;

declare function kdp_unregister_send_receive(send: (p1: interop.PointerConvertible, p2: number) => void, receive: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void): void;

declare function kdp_register_callout(fn: (p1: interop.PointerConvertible, p2: interop.Enum<typeof kdp_event_t>) => void, arg: interop.PointerConvertible): void;

declare function lz4_encode_2gb(dst_ptr: interop.PointerConvertible, dst_size: number, src_ptr: interop.PointerConvertible, src_begin: interop.PointerConvertible, src_size: number, hash_table: unknown /* const array */, skip_final_literals: number): void;

declare function lz4_decode(dst_ptr: interop.PointerConvertible, dst_begin: interop.PointerConvertible, dst_end: interop.PointerConvertible, src_ptr: interop.PointerConvertible, src_end: interop.PointerConvertible): number;

declare function lz4_decode_asm(dst_ptr: interop.PointerConvertible, dst_begin: interop.PointerConvertible, dst_end: interop.PointerConvertible, src_ptr: interop.PointerConvertible, src_end: interop.PointerConvertible): number;

declare function lz4raw_encode_buffer(dst_buffer: interop.PointerConvertible, dst_size: number, src_buffer: interop.PointerConvertible, src_size: number, hash_table: unknown /* const array */): number;

declare function lz4raw_decode_buffer(dst_buffer: interop.PointerConvertible, dst_size: number, src_buffer: interop.PointerConvertible, src_size: number, work: interop.PointerConvertible): number;

declare function WKdm_decompress_4k(src_buf: interop.PointerConvertible, dest_buf: interop.PointerConvertible, scratch: interop.PointerConvertible, bytes: number): void;

declare function WKdm_compress_4k(src_buf: interop.PointerConvertible, dest_buf: interop.PointerConvertible, scratch: interop.PointerConvertible, limit: number): number;

declare function WKdm_decompress_16k(src_buf: interop.PointerConvertible, dest_buf: interop.PointerConvertible, scratch: interop.PointerConvertible, bytes: number): void;

declare function WKdm_compress_16k(src_buf: interop.PointerConvertible, dest_buf: interop.PointerConvertible, scratch: interop.PointerConvertible, limit: number): number;

declare function nosys(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function exit(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): void;

declare function fork(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function read(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function write(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function open(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_close(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function wait4(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function link(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function unlink(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_chdir(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fchdir(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mknod(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function chmod(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function chown(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getfsstat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getpid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setuid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getuid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function geteuid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ptrace(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function access(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function chflags(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fchflags(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sync(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kill(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_crossarch_trap(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getppid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_dup(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pipe(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getegid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sigaction(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getgid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sigprocmask(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getlogin(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setlogin(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function acct(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sigpending(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sigaltstack(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ioctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function reboot(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function revoke(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function symlink(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function readlink(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function execve(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function umask(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function chroot(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function msync(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function oslog_coproc_reg(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function oslog_coproc(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function munmap(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mprotect(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function madvise(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mincore(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getgroups(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setgroups(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getpgrp(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setpgid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setitimer(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function swapon(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getitimer(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_getdtablesize(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_dup2(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fcntl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function select(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsync(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setpriority(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getpriority(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sigsuspend(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gettimeofday(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getrusage(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function readv(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function writev(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function settimeofday(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fchown(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fchmod(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setreuid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setregid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function rename(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_flock(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mkfifo(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mkdir(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function rmdir(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function utimes(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function futimes(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function adjtime(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gethostuuid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setsid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pipe2(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_dup3(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getpgid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setprivexec(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pread(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pwrite(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function statfs(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fstatfs(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function unmount(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function funmount(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function quotactl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mount(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function csops(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function csops_audittoken(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function waitid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kdebug_typefilter(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kdebug_trace_string(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kdebug_trace64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kdebug_trace(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setgid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setegid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function seteuid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sigreturn(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_panic_with_data(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function thread_selfcounts(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fdatasync(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function stat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fstat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function lstat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pathconf(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fpathconf(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getrlimit(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setrlimit(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getdirentries(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mmap(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function lseek(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function truncate(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ftruncate(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sysctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mlock(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function munlock(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function undelete(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fchflagsat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getumask(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function open_dprotected_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsgetpath_ext(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function openat_dprotected_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getattrlist(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setattrlist(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getdirentriesattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function exchangedata(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function searchfs(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;


declare function copyfile(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fgetattrlist(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsetattrlist(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function poll(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getxattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fgetxattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setxattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsetxattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function removexattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fremovexattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function listxattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function flistxattr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function initgroups(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function posix_spawn(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ffsctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_readv(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_writev(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsctlat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function minherit(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function shm_open(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function shm_unlink(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sem_open(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sem_close(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sem_unlink(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sem_wait(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sem_trywait(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sem_post(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_sysctlbyname(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function open_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function umask_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function stat_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function lstat_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fstat_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function chmod_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fchmod_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function access_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_settid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gettid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setsgroups(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getsgroups(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setwgroups(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getwgroups(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mkfifo_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mkdir_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function shared_region_check_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function vm_pressure_monitor(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getsid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_settid_with_pid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_fsync(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_return(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_suspend(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_cancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_error(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_read(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_write(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function lio_listio(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function iopolicysys(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function process_policy(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mlockall(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function munlockall(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function issetugid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __pthread_kill(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __pthread_sigmask(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __sigwait(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __disable_threadsignal(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __pthread_markcancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __pthread_canceled(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __semwait_signal(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function proc_info(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function stat64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fstat64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function lstat64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function stat64_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function lstat64_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fstat64_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getdirentries64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function statfs64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fstatfs64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getfsstat64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __pthread_chdir(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __pthread_fchdir(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function audit(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function auditon(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_ftruncate_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getauid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setauid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getaudit_addr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setaudit_addr(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function auditctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function bsdthread_create(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function bsdthread_terminate(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kqueue(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kevent(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function lchown(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function bsdthread_register(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function workq_open(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function workq_kernreturn(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kevent64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function thread_selfid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ledger(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kevent_qos(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kevent_id(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __mac_execve(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pselect(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pselect_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function read_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function write_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function open_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_close_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function wait4_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function msync_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fcntl_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function select_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsync_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sigsuspend_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function readv_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function writev_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pread_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pwrite_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function waitid_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function poll_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sem_wait_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function aio_suspend_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __sigwait_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __semwait_signal_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __mac_mount(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __mac_getfsstat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fsgetpath(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function audit_session_self(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function audit_session_join(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fileport_makeport(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_fileport_makefd(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function audit_session_port(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pid_suspend(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pid_resume(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kas_info(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_open_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_close_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_kqueue_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function change_fdguard_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function usrctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function proc_rlimit_control(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function telemetry(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function system_override(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function vfs_purge(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sfi_ctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sfi_pidctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getattrlistbulk(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function clonefileat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function openat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function openat_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function renameat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function faccessat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fchmodat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fchownat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fstatat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fstatat64(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function linkat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function unlinkat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function readlinkat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function symlinkat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mkdirat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getattrlistat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function proc_trace_log(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function bsdthread_ctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function openbyid_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function thread_selfusage(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_open_dprotected_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_write_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_pwrite_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function guarded_writev_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function renameatx_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function stack_snapshot_with_config(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mach_eventlink_signal(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mach_eventlink_wait_until(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mach_eventlink_signal_wait_until(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function work_interval_ctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function getentropy(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_ulock_wait(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_ulock_wake(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fclonefileat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fs_snapshot(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function terminate_with_payload(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function abort_with_payload(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function setattrlistat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function net_qos_guideline(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function fmount(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ntp_adjtime(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ntp_gettime(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function os_fault_with_payload(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function kqueue_workloop_ctl(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function __mach_bridge_remote_time(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function log_data(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function memorystatus_available_memory(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function objc_bp_assist_cfg_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function shared_region_map_and_slide_2_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function pivot_root(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function task_inspect_for_pid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function task_read_for_pid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_preadv(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_pwritev(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_preadv_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_pwritev_nocancel(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_ulock_wait2(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function proc_info_extended_id(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function debug_syscall_reject(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_debug_syscall_reject_config(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function graftdmg(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function map_with_linking_np(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function freadlink(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function sys_record_system_event(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mkfifoat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function mknodat(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ungraftdmg(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function enableiopolicy_np(p1: number, p2: number, p3: number): number;

declare function disableiopolicy_np(p1: number, p2: number, p3: number): number;

declare function MD5Init(p1: interop.PointerConvertible): void;

declare function MD5Update(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number): void;

declare function MD5Final(p1: unknown /* const array */, p2: interop.PointerConvertible): void;

declare function unicode_combinable(character: number): number;

declare function unicode_decomposeable(character: number): number;

declare function utf8_encodelen(ucsp: interop.PointerConvertible, ucslen: number, altslash: number, flags: number): number;

declare function utf8_encodestr(ucsp: interop.PointerConvertible, ucslen: number, utf8p: interop.PointerConvertible, utf8len: interop.PointerConvertible, buflen: number, altslash: number, flags: number): number;

declare function utf8_decodestr(utf8p: interop.PointerConvertible, utf8len: number, ucsp: interop.PointerConvertible, ucslen: interop.PointerConvertible, buflen: number, altslash: number, flags: number): number;

declare function utf8_normalizestr(instr: interop.PointerConvertible, inlen: number, outstr: interop.PointerConvertible, outlen: interop.PointerConvertible, buflen: number, flags: number): number;

declare function utf8_validatestr(utf8p: interop.PointerConvertible, utf8len: number): number;

declare function xattr_protected(p1: string): number;

declare function xattr_validatename(p1: string): number;

declare function ctl_register(userkctl: interop.PointerConvertible, kctlref: interop.PointerConvertible): number;

declare function ctl_deregister(kctlref: interop.PointerConvertible): number;

declare function ctl_enqueuedata(kctlref: interop.PointerConvertible, unit: number, data: interop.PointerConvertible, len: number, flags: number): number;

declare function ctl_enqueuembuf(kctlref: interop.PointerConvertible, unit: number, m: interop.PointerConvertible, flags: number): number;

declare function ctl_getenqueuespace(kctlref: interop.PointerConvertible, unit: number, space: interop.PointerConvertible): number;

declare function ctl_getenqueuereadable(kctlref: interop.PointerConvertible, unit: number, difference: interop.PointerConvertible): number;

declare function kdebug_using_continuous_time(): boolean;

declare function kdebug_timestamp_from_absolute(abstime: number): number;

declare function kdebug_timestamp_from_continuous(conttime: number): number;

declare function kdebug_timestamp(): number;

declare function kdebug_debugid_enabled(debugid: number): boolean;

declare function kdebug_debugid_explicitly_enabled(debugid: number): boolean;

declare function kdebug_commpage_state(): number;

declare function kdebug_register_coproc(name: string, flags: interop.Enum<typeof kdebug_coproc_flags_t>, callback: (p1: interop.PointerConvertible, p2: interop.Enum<typeof kd_callback_type>, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible): number;

declare function kernel_debug_enter(coreid: number, debugid: number, timestamp: number, arg1: number, arg2: number, arg3: number, arg4: number, threadid: number): void;

declare function kernel_debug_register_callback(callback: kd_callback): number;

declare function kernel_debug(debugid: number, arg1: number, arg2: number, arg3: number, arg4: number, arg5: number): void;

declare function kernel_debug1(debugid: number, arg1: number, arg2: number, arg3: number, arg4: number, arg5: number): void;

declare function kernel_debug_flags(debugid: number, arg1: number, arg2: number, arg3: number, arg4: number, flags: interop.Enum<typeof kdebug_emit_flags_t>): void;

declare function kernel_debug_filtered(debugid: number, arg1: number, arg2: number, arg3: number, arg4: number): void;

declare function sock_accept(so: interop.PointerConvertible, from: interop.PointerConvertible, fromlen: number, flags: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void, cookie: interop.PointerConvertible, new_so: interop.PointerConvertible): number;

declare function sock_bind(so: interop.PointerConvertible, to: interop.PointerConvertible): number;

declare function sock_connect(so: interop.PointerConvertible, to: interop.PointerConvertible, flags: number): number;

declare function sock_getpeername(so: interop.PointerConvertible, peername: interop.PointerConvertible, peernamelen: number): number;

declare function sock_getsockname(so: interop.PointerConvertible, sockname: interop.PointerConvertible, socknamelen: number): number;

declare function sock_getsockopt(so: interop.PointerConvertible, level: number, optname: number, optval: interop.PointerConvertible, optlen: interop.PointerConvertible): number;

declare function sock_ioctl(so: interop.PointerConvertible, request: number, argp: interop.PointerConvertible): number;

declare function sock_setsockopt(so: interop.PointerConvertible, level: number, optname: number, optval: interop.PointerConvertible, optlen: number): number;

declare function sock_listen(so: interop.PointerConvertible, backlog: number): number;

declare function sock_receive(so: interop.PointerConvertible, msg: interop.PointerConvertible, flags: number, recvdlen: interop.PointerConvertible): number;

declare function sock_receivembuf(so: interop.PointerConvertible, msg: interop.PointerConvertible, data: interop.PointerConvertible, flags: number, recvlen: interop.PointerConvertible): number;

declare function sock_send(so: interop.PointerConvertible, msg: interop.PointerConvertible, flags: number, sentlen: interop.PointerConvertible): number;

declare function sock_sendmbuf(so: interop.PointerConvertible, msg: interop.PointerConvertible, data: interop.PointerConvertible, flags: number, sentlen: interop.PointerConvertible): number;

declare function sock_shutdown(so: interop.PointerConvertible, how: number): number;

declare function sock_socket(domain: number, type: number, protocol: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void, cookie: interop.PointerConvertible, new_so: interop.PointerConvertible): number;

declare function sock_close(so: interop.PointerConvertible): void;

declare function sock_retain(so: interop.PointerConvertible): void;

declare function sock_release(so: interop.PointerConvertible): void;

declare function sock_setpriv(so: interop.PointerConvertible, on: number): number;

declare function sock_isconnected(so: interop.PointerConvertible): number;

declare function sock_isnonblocking(so: interop.PointerConvertible): number;

declare function sock_gettype(so: interop.PointerConvertible, domain: interop.PointerConvertible, type: interop.PointerConvertible, protocol: interop.PointerConvertible): number;

declare function sflt_register(filter: interop.PointerConvertible, domain: number, type: number, protocol: number): number;

declare function sflt_unregister(handle: number): number;

declare function sflt_attach(socket: interop.PointerConvertible, handle: number): number;

declare function sflt_detach(socket: interop.PointerConvertible, handle: number): number;

declare function sock_inject_data_in(so: interop.PointerConvertible, from: interop.PointerConvertible, data: interop.PointerConvertible, control: interop.PointerConvertible, flags: number): number;

declare function sock_inject_data_out(so: interop.PointerConvertible, to: interop.PointerConvertible, data: interop.PointerConvertible, control: interop.PointerConvertible, flags: number): number;

declare function sockopt_direction(sopt: interop.PointerConvertible): number;

declare function sockopt_level(sopt: interop.PointerConvertible): number;

declare function sockopt_name(sopt: interop.PointerConvertible): number;

declare function sockopt_valsize(sopt: interop.PointerConvertible): number;

declare function sockopt_copyin(sopt: interop.PointerConvertible, data: interop.PointerConvertible, length: number): number;

declare function sockopt_copyout(sopt: interop.PointerConvertible, data: interop.PointerConvertible, length: number): number;

declare function ubc_blktooff(p1: interop.PointerConvertible, p2: number): number;

declare function ubc_offtoblk(p1: interop.PointerConvertible, p2: number): number;

declare function ubc_getsize(p1: interop.PointerConvertible): number;

declare function ubc_setsize(p1: interop.PointerConvertible, p2: number): number;

declare function ubc_getcred(p1: interop.PointerConvertible): interop.Pointer;

declare function ubc_setthreadcred(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function ubc_msync(p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number): number;

declare function ubc_pages_resident(p1: interop.PointerConvertible): number;

declare function ubc_page_op(p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function ubc_range_op(p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible): number;

declare function cluster_update_state(p1: interop.PointerConvertible, p2: number, p3: number, p4: number): void;

declare function advisory_read(p1: interop.PointerConvertible, p2: number, p3: number, p4: number): number;

declare function advisory_read_ext(p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p6: interop.PointerConvertible, p7: number): number;

declare function cluster_read(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number): number;

declare function cluster_read_ext(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p6: interop.PointerConvertible): number;

declare function cluster_write(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number, p6: number, p7: number): number;

declare function cluster_write_ext(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number, p6: number, p7: number, p8: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p9: interop.PointerConvertible): number;

declare function cluster_pageout(p1: interop.PointerConvertible, p2: number, upl_offset_t: number, p4: number, p5: number, p6: number, p7: number): number;

declare function cluster_pageout_ext(p1: interop.PointerConvertible, p2: number, upl_offset_t: number, p4: number, p5: number, p6: number, p7: number, p8: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p9: interop.PointerConvertible): number;

declare function cluster_pagein(p1: interop.PointerConvertible, p2: number, upl_offset_t: number, p4: number, p5: number, p6: number, p7: number): number;

declare function cluster_pagein_ext(p1: interop.PointerConvertible, p2: number, upl_offset_t: number, p4: number, p5: number, p6: number, p7: number, p8: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p9: interop.PointerConvertible): number;

declare function cluster_push(p1: interop.PointerConvertible, p2: number): number;

declare function cluster_push_ext(p1: interop.PointerConvertible, p2: number, p3: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p4: interop.PointerConvertible): number;

declare function cluster_push_err(p1: interop.PointerConvertible, p2: number, p3: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function cluster_bp(p1: interop.PointerConvertible): number;

declare function cluster_bp_ext(p1: interop.PointerConvertible, p2: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, p3: interop.PointerConvertible): number;

declare function cluster_zero(p1: number, upl_offset_t: number, p3: number, p4: interop.PointerConvertible): void;

declare function cluster_copy_upl_data(p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible): number;

declare function cluster_copy_ubc_data(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number): number;

declare function cluster_lock_direct_read(vp: interop.PointerConvertible, exclusive: interop.Enum<typeof lck_rw_type_t>): interop.Pointer;

declare function cluster_unlock_direct_read(lck: interop.PointerConvertible): void;

declare function ubc_create_upl(p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: number): number;

declare function ubc_upl_map(p1: number, p2: interop.PointerConvertible): number;

declare function ubc_upl_unmap(p1: number): number;

declare function ubc_upl_map_range(p1: number, p2: number, p3: number, p4: number, p5: interop.PointerConvertible): number;

declare function ubc_upl_unmap_range(p1: number, p2: number, p3: number): number;

declare function ubc_upl_commit(p1: number): number;

declare function ubc_upl_commit_range(p1: number, upl_offset_t: number, upl_size_t: number, p4: number): number;

declare function ubc_upl_abort(p1: number, p2: number): number;

declare function ubc_upl_abort_range(p1: number, upl_offset_t: number, upl_size_t: number, p4: number): number;

declare function ubc_upl_range_needed(p1: number, p2: number, p3: number): void;

declare function ubc_upl_pageinfo(p1: number): interop.Pointer;

declare function ubc_upl_maxbufsize(): number;

declare function is_file_clean(p1: interop.PointerConvertible, p2: number): number;

declare function mach_to_bsd_errno(mach_err: number): number;

declare function read_random(buffer: interop.PointerConvertible, numBytes: number): void;

declare function read_frandom(buffer: interop.PointerConvertible, numBytes: number): void;

declare function write_random(buffer: interop.PointerConvertible, numBytes: number): number;

declare function lockd_request(server: number, vers: number, flags: number, xid: number, flk_start: number, flk_len: number, flk_pid: number, flk_type: number, flk_whence: number, sock_address: unknown /* const array */, cred: unknown /* const array */, fh_len: number, fh: unknown /* const array */): number;

declare function lockd_ping(server: number): number;

declare function lockd_shutdown(server: number): number;

declare function static_if_boot_arg_uint64(args: string, name: string, defval: number): number;

declare function static_if_dt_property_uint32(pathName: string, propertyName: string, defval: number): number;

declare function __static_if_key_delta(key: interop.PointerConvertible, delta: number): void;

declare function __hib_assert(file: string, line: number, expression: string): void;

declare function pal_hib_map(virt: number, phys: number): number;

declare function pal_hib_restore_pal_state(src: interop.PointerConvertible): void;

declare function pal_hib_init(): void;

declare function pal_hib_write_hook(): void;

declare function pal_hib_resume_init(palHibCtx: interop.PointerConvertible, map: interop.PointerConvertible, nextFree: interop.PointerConvertible): void;

declare function pal_hib_restored_page(palHibCtx: interop.PointerConvertible, stage: interop.Enum<typeof pal_hib_restore_stage_t>, ppnum: number): void;

declare function pal_hib_patchup(palHibCtx: interop.PointerConvertible): void;

declare function pal_hib_teardown_pmap_structs(unneeded_start: interop.PointerConvertible, unneeded_end: interop.PointerConvertible): void;

declare function pal_hib_rebuild_pmap_structs(): void;

declare function pal_hib_decompress_page(src: interop.PointerConvertible, dst: interop.PointerConvertible, scratch: interop.PointerConvertible, compressedSize: number): void;

declare function spec_ebadf(p1: interop.PointerConvertible): number;

declare function spec_lookup(p1: interop.PointerConvertible): number;

declare function spec_open(p1: interop.PointerConvertible): number;

declare function spec_close(p1: interop.PointerConvertible): number;

declare function spec_read(p1: interop.PointerConvertible): number;

declare function spec_write(p1: interop.PointerConvertible): number;

declare function spec_ioctl(p1: interop.PointerConvertible): number;

declare function spec_select(p1: interop.PointerConvertible): number;

declare function spec_fsync(p1: interop.PointerConvertible): number;

declare function spec_strategy(p1: interop.PointerConvertible): number;

declare function spec_pathconf(p1: interop.PointerConvertible): number;

declare function devfs_make_node_clone(dev: number, chrblk: number, uid: number, gid: number, perms: number, clone: (p1: number, p2: number) => number, fmt: string): interop.Pointer;

declare function devfs_make_node(dev: number, chrblk: number, uid: number, gid: number, perms: number, fmt: string): interop.Pointer;

declare function devfs_remove(handle: interop.PointerConvertible): void;

declare function fifo_ebadf(p1: interop.PointerConvertible): number;

declare function fifo_lookup(p1: interop.PointerConvertible): number;

declare function fifo_open(p1: interop.PointerConvertible): number;

declare function fifo_close(p1: interop.PointerConvertible): number;

declare function fifo_read(p1: interop.PointerConvertible): number;

declare function fifo_write(p1: interop.PointerConvertible): number;

declare function fifo_ioctl(p1: interop.PointerConvertible): number;

declare function fifo_select(p1: interop.PointerConvertible): number;

declare function fifo_inactive(p1: interop.PointerConvertible): number;

declare function fifo_pathconf(p1: interop.PointerConvertible): number;

declare function fifo_advlock(p1: interop.PointerConvertible): number;

declare function hfs_relconverter(encoding: number): number;

declare function hfs_getconverter(encoding: number, get_unicode: interop.PointerConvertible, get_hfsname: interop.PointerConvertible): number;

declare function hfs_addconverter(kmod_id: number, encoding: number, get_unicode: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number, get_hfsname: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): number;

declare function hfs_remconverter(kmod_id: number, encoding: number): number;

declare function hfs_pickencoding(src: interop.PointerConvertible, len: number): number;

declare function hfs_getencodingbias(): number;

declare function hfs_setencodingbias(bias: number): void;

declare function mac_roman_to_utf8(hfs_str: unknown /* const array */, maxDstLen: number, actualDstLen: interop.PointerConvertible, dstStr: interop.PointerConvertible): number;

declare function utf8_to_mac_roman(srcLen: number, srcStr: interop.PointerConvertible, dstStr: unknown /* const array */): number;

declare function mac_roman_to_unicode(hfs_str: unknown /* const array */, uni_str: interop.PointerConvertible, maxCharLen: number, usedCharLen: interop.PointerConvertible): number;

declare function unicode_to_mac_roman(uni_str: interop.PointerConvertible, unicodeChars: number, hfs_str: unknown /* const array */): number;

declare function cninit(): void;

declare function __builtin___sprintf_chk(str: string): number;

declare function switch_to_serial_console(): number;

declare function switch_to_old_console(p1: number): void;

declare function console_is_serial(): number;

declare function serial_init(): number;

declare function serial_putc(p1: number): void;

declare function serial_getc(): number;

declare function console_write_unbuffered(p1: number): void;

declare function SecureDTInit(base: interop.PointerConvertible, size: number): void;

declare function SecureDTIsLockedDown(): boolean;

declare function SecureDTEntryIsEqual(ref1: interop.PointerConvertible, ref2: interop.PointerConvertible): number;

declare function SecureDTFindEntry(propName: string, propValue: string, entryH: interop.PointerConvertible): number;

declare function SecureDTFindNodeWithPropertyEqualToValue(propertyName: string, propertyValue: interop.PointerConvertible, propertyValueSize: number, devicetreeNode: interop.PointerConvertible): number;

declare function SecureDTFindNodeWithPhandle(phandle: number, devicetreeNode: interop.PointerConvertible): number;

declare function SecureDTFindNodeWithStringProperty(propertyName: string, propertyValue: string, devicetreeNode: interop.PointerConvertible): number;

declare function SecureDTLookupEntry(searchPoint: interop.PointerConvertible, pathName: string, foundEntry: interop.PointerConvertible): number;

declare function SecureDTInitEntryIterator(startEntry: interop.PointerConvertible, iter: interop.PointerConvertible): number;

declare function SecureDTEnterEntry(iterator: interop.PointerConvertible, childEntry: interop.PointerConvertible): number;

declare function SecureDTExitEntry(iterator: interop.PointerConvertible, currentPosition: interop.PointerConvertible): number;

declare function SecureDTIterateEntries(iterator: interop.PointerConvertible, nextEntry: interop.PointerConvertible): number;

declare function SecureDTRestartEntryIteration(iterator: interop.PointerConvertible): number;

declare function SecureDTGetProperty(entry: interop.PointerConvertible, propertyName: string, propertyValue: interop.PointerConvertible, propertySize: interop.PointerConvertible): number;

declare function SecureDTGetPropertyRegion(entry: interop.PointerConvertible, propertyName: string, propertyValue: interop.PointerConvertible, propertySize: interop.PointerConvertible, region_start: number, region_size: number): number;

declare function SecureDTInitPropertyIterator(entry: interop.PointerConvertible, iter: interop.PointerConvertible): number;

declare function SecureDTIterateProperties(iterator: interop.PointerConvertible, foundProperty: interop.PointerConvertible): number;

declare function SecureDTRestartPropertyIteration(iterator: interop.PointerConvertible): number;

declare function airship_strerror(code: interop.Enum<typeof airship_result>): string;

declare function airship_get_ipc_error_description(protocol: interop.PointerConvertible, error: number): string;

declare function airship_device_transport_create_with_iopcidevice(device: interop.PointerConvertible): interop.Pointer;

declare function airship_device_transport_destroy(transport: interop.PointerConvertible): void;

declare function airship_device_transport_suspend(transport: interop.PointerConvertible): void;

declare function airship_device_transport_resume(transport: interop.PointerConvertible): void;

declare function airship_driver_probe_device(transport: interop.PointerConvertible, vendor_id: number, device_id: number): interop.Pointer;

declare function airship_driver_create(protocol: interop.PointerConvertible): interop.Pointer;

declare function airship_driver_destroy(driver: interop.PointerConvertible): void;

declare function airship_driver_set_configuration(driver: interop.PointerConvertible, config: interop.PointerConvertible): void;

declare function airship_driver_set_queue(driver: interop.PointerConvertible, role: interop.PointerConvertible, queue: interop.PointerConvertible): void;

declare function airship_driver_set_exec_stage_change_handler(driver: interop.PointerConvertible, handler: () => void): void;

declare function airship_driver_set_power_state_change_handler(driver: interop.PointerConvertible, handler: () => void): void;

declare function airship_driver_set_ipc_error_handler(driver: interop.PointerConvertible, handler: () => void): void;

declare function airship_driver_activate(driver: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_driver_enter_reset(driver: interop.PointerConvertible): void;

declare function airship_driver_exit_reset(driver: interop.PointerConvertible): void;

declare function airship_driver_set_transport(driver: interop.PointerConvertible, transport: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_driver_clear_transport(driver: interop.PointerConvertible): void;

declare function airship_driver_get_exec_stage(driver: interop.PointerConvertible): number;

declare function airship_driver_probe_exec_stage(driver: interop.PointerConvertible): void;

declare function airship_driver_set_power_target(driver: interop.PointerConvertible, target: interop.Enum<typeof airship_driver_power_target>): void;

declare function airship_driver_get_power_state(driver: interop.PointerConvertible): interop.Enum<typeof airship_driver_power_state>;

declare function airship_driver_get_error_state(driver: interop.PointerConvertible): number;

declare function airship_monitor_set_queue(monitor: interop.PointerConvertible, queue: interop.PointerConvertible): void;

declare function airship_monitor_set_event_handler(monitor: interop.PointerConvertible, handler: () => void): void;

declare function airship_monitor_set_cancel_handler(monitor: interop.PointerConvertible, handler: () => void): void;

declare function airship_monitor_activate(monitor: interop.PointerConvertible): void;

declare function airship_monitor_suspend(monitor: interop.PointerConvertible): void;

declare function airship_monitor_resume(monitor: interop.PointerConvertible): void;

declare function airship_monitor_cancel(monitor: interop.PointerConvertible): void;

declare function airship_monitor_destroy(monitor: interop.PointerConvertible): void;

declare function airship_monitor_wait(monitor: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_monitor_timedwait(monitor: interop.PointerConvertible, timeout_msec: number): interop.Enum<typeof airship_result>;

declare function airship_monitor_wait_interruptible(monitor: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_monitor_timedwait_interruptible(monitor: interop.PointerConvertible, timeout_msec: number): interop.Enum<typeof airship_result>;

declare function airship_monitor_set_criterion(monitor: interop.PointerConvertible, comparator: interop.Enum<typeof airship_monitor_comparator>, comparand: number, mask: number): void;

declare function airship_client_create_direct(driver: interop.PointerConvertible, name: interop.PointerConvertible): interop.Pointer;

declare function airship_client_destroy(client: interop.PointerConvertible): void;

declare function airship_client_acquire_resource(client: interop.PointerConvertible, resource_name: interop.PointerConvertible, selector: number): interop.Enum<typeof airship_result>;

declare function airship_client_release_resource(client: interop.PointerConvertible, resource_name: interop.PointerConvertible, selector: number): void;

declare function airship_client_create_resource_monitor(client: interop.PointerConvertible, resource_name: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_client_create_exec_stage_monitor(client: interop.PointerConvertible): interop.Pointer;

declare function airship_client_get_exec_stage(client: interop.PointerConvertible): number;

declare function airship_buffer_create(client: interop.PointerConvertible, size: number, dir: interop.Enum<typeof airship_buffer_direction>): interop.Pointer;

declare function airship_buffer_create_with_iomd(client: interop.PointerConvertible, iomd: interop.PointerConvertible, dir: interop.Enum<typeof airship_buffer_direction>): interop.Pointer;

declare function airship_buffer_destroy(buffer: interop.PointerConvertible): void;

declare function airship_buffer_get_size(buffer: interop.PointerConvertible): number;

declare function airship_buffer_get_addr(buffer: interop.PointerConvertible): interop.Pointer;

declare function airship_buffer_read(buffer: interop.PointerConvertible, dst: interop.PointerConvertible, offset: number, length: number): interop.Enum<typeof airship_result>;

declare function airship_buffer_write(buffer: interop.PointerConvertible, src: interop.PointerConvertible, offset: number, length: number): interop.Enum<typeof airship_result>;

declare function airship_buffer_map(buffer: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_interrupt_create(client: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_interrupt_destroy(interrupt: interop.PointerConvertible): void;

declare function airship_interrupt_set_queue(interrupt: interop.PointerConvertible, queue: interop.PointerConvertible): void;

declare function airship_interrupt_set_event_handler(interrupt: interop.PointerConvertible, handler: () => void): void;

declare function airship_interrupt_set_cancel_handler(interrupt: interop.PointerConvertible, handler: () => void): void;

declare function airship_interrupt_get_device_vector(interrupt: interop.PointerConvertible): number;

declare function airship_interrupt_activate(interrupt: interop.PointerConvertible): void;

declare function airship_interrupt_suspend(interrupt: interop.PointerConvertible): void;

declare function airship_interrupt_resume(interrupt: interop.PointerConvertible): void;

declare function airship_interrupt_cancel(interrupt: interop.PointerConvertible): void;

declare function airship_acipc_get_ipc_error_description(error: number): string;

declare function airship_acipc_get_health_status(client: interop.PointerConvertible, detail: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_boot_create(client: interop.PointerConvertible, name: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_boot_destroy(boot: interop.PointerConvertible): void;

declare function airship_acipc_boot_get_state(boot: interop.PointerConvertible, out_detail: interop.PointerConvertible): interop.Enum<typeof airship_acipc_boot_state>;

declare function airship_acipc_boot_create_state_monitor(boot: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_boot_read_register(boot: interop.PointerConvertible, register_name: interop.PointerConvertible, register_offset: number, register_length: number, dst: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_boot_write_register(boot: interop.PointerConvertible, register_name: interop.PointerConvertible, register_offset: number, register_length: number, src: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_boot_send_image(boot: interop.PointerConvertible, image: interop.PointerConvertible, image_offset: number, image_length: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_boot_get_image_response(boot: interop.PointerConvertible, out_code: interop.PointerConvertible): interop.Enum<typeof airship_acipc_boot_image_response>;

declare function airship_acipc_boot_probe_image_response(boot: interop.PointerConvertible): void;

declare function airship_acipc_boot_reset(boot: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_create(client: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_acipc_tr_destroy(tr: interop.PointerConvertible): void;

declare function airship_acipc_tr_get_size(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_set_size(tr: interop.PointerConvertible, count: number): void;

declare function airship_acipc_tr_get_backing_ring_size(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_set_backing_ring_size(tr: interop.PointerConvertible, count: number): void;

declare function airship_acipc_tr_get_transfer_footer_size(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_set_transfer_footer_size(tr: interop.PointerConvertible, length: number): void;

declare function airship_acipc_tr_get_completion_footer_size(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_set_completion_footer_size(tr: interop.PointerConvertible, length: number): void;

declare function airship_acipc_tr_get_nominal_transfer_size(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_get_completion_ring(tr: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_set_completion_ring(tr: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): void;

declare function airship_acipc_tr_get_completion_group(tr: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_set_completion_group(tr: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): void;

declare function airship_acipc_tr_get_out_of_order(tr: interop.PointerConvertible): boolean;

declare function airship_acipc_tr_get_in_place(tr: interop.PointerConvertible): boolean;

declare function airship_acipc_tr_set_open_clientdata(tr: interop.PointerConvertible, data: interop.PointerConvertible, length: number): void;

declare function airship_acipc_tr_get_trid(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_get_name(tr: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_get_selector(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_get_doorbell(tr: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_set_doorbell_moderation(tr: interop.PointerConvertible, interval_usec: number, leeway_usec: number): void;

declare function airship_acipc_tr_set_mode(tr: interop.PointerConvertible, mode: interop.Enum<typeof airship_acipc_tr_mode_t>): void;

declare function airship_acipc_tr_get_interrupt(tr: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_set_interrupt(tr: interop.PointerConvertible, interrupt: interop.PointerConvertible, selector: number): void;

declare function airship_acipc_tr_compute_required_backing_memory_size(tr: interop.PointerConvertible, out_alignment: interop.PointerConvertible): number;

declare function airship_acipc_tr_set_backing_memory(tr: interop.PointerConvertible, buffer: interop.PointerConvertible, offset: number, length: number): void;

declare function airship_acipc_tr_set_external_management(tr: interop.PointerConvertible, external_management: boolean): void;

declare function airship_acipc_tr_get_index_array_vector(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_activate(tr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_get_state(tr: interop.PointerConvertible, out_detail: interop.PointerConvertible): interop.Enum<typeof airship_acipc_ring_state>;

declare function airship_acipc_tr_create_state_monitor(tr: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_open(tr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_close(tr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_sync(tr: interop.PointerConvertible, flags: number): void;

declare function airship_acipc_tr_create_sync_monitor(tr: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_reset(tr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_synthesize_reset_completions(tr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_disconnect(tr: interop.PointerConvertible): void;

declare function airship_acipc_tr_enqueue_transfer(tr: interop.PointerConvertible, tag: number, flags: number, extbuf: interop.PointerConvertible, extbuf_offset: number, extbuf_length: number, header: interop.PointerConvertible, header_length: number, footer: interop.PointerConvertible, footer_length: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_get_free_space(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_create_free_space_monitor(tr: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_tr_get_first_free_tag(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_get_transfer_completion(tr: interop.PointerConvertible, tag: number, out_completion: interop.PointerConvertible, out_header: interop.PointerConvertible, header_size: number, out_footer: interop.PointerConvertible, footer_size: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_tr_get_completed_transfer_count(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_get_first_completed_tag(tr: interop.PointerConvertible): number;

declare function airship_acipc_tr_consume_transfers(tr: interop.PointerConvertible, tag: number, count: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_cr_create(client: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_acipc_cr_destroy(cr: interop.PointerConvertible): void;

declare function airship_acipc_cr_get_backing_ring_size(cr: interop.PointerConvertible): number;

declare function airship_acipc_cr_set_backing_ring_size(cr: interop.PointerConvertible, count: number): void;

declare function airship_acipc_cr_get_footer_size(cr: interop.PointerConvertible): number;

declare function airship_acipc_cr_set_footer_size(cr: interop.PointerConvertible, length: number): void;

declare function airship_acipc_cr_get_completion_group(cr: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_cr_set_completion_group(cr: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): void;

declare function airship_acipc_cr_get_mirror_enabled(cr: interop.PointerConvertible): boolean;

declare function airship_acipc_cr_set_mirror_enabled(cr: interop.PointerConvertible, enable: boolean): void;

declare function airship_acipc_cr_set_open_clientdata(cr: interop.PointerConvertible, data: interop.PointerConvertible, length: number): void;

declare function airship_acipc_cr_get_crid(cr: interop.PointerConvertible): number;

declare function airship_acipc_cr_get_name(cr: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_cr_get_selector(cr: interop.PointerConvertible): number;

declare function airship_acipc_cr_get_doorbell(cr: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_cr_set_doorbell_moderation(cr: interop.PointerConvertible, interval_usec: number, leeway_usec: number): void;

declare function airship_acipc_cr_get_interrupt(cr: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_cr_set_interrupt(cr: interop.PointerConvertible, interrupt: interop.PointerConvertible, selector: number): void;

declare function airship_acipc_cr_compute_required_backing_memory_size(cr: interop.PointerConvertible, out_alignment: interop.PointerConvertible): number;

declare function airship_acipc_cr_set_backing_memory(cr: interop.PointerConvertible, buffer: interop.PointerConvertible, offset: number, length: number): void;

declare function airship_acipc_cr_set_external_management(cr: interop.PointerConvertible, external_management: boolean): void;

declare function airship_acipc_cr_get_index_array_vector(cr: interop.PointerConvertible): number;

declare function airship_acipc_cr_activate(cr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_cr_get_state(cr: interop.PointerConvertible, out_detail: interop.PointerConvertible): interop.Enum<typeof airship_acipc_ring_state>;

declare function airship_acipc_cr_create_state_monitor(cr: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_cr_open(cr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_cr_close(cr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_cr_reset(cr: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_cr_sync(cr: interop.PointerConvertible, flags: number): void;

declare function airship_acipc_cr_create_sync_monitor(cr: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_cr_get_mirror_element(cr: interop.PointerConvertible, index: number, out_element: interop.PointerConvertible, out_header: interop.PointerConvertible, header_size: number, out_footer: interop.PointerConvertible, footer_size: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_cr_get_mirror_count(cr: interop.PointerConvertible): number;

declare function airship_acipc_cr_consume_mirror_elements(cr: interop.PointerConvertible, count: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_memregion_create(client: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_acipc_memregion_destroy(region: interop.PointerConvertible): void;

declare function airship_acipc_memregion_set_backing_memory(region: interop.PointerConvertible, buffer: interop.PointerConvertible, offset: number, length: number): void;

declare function airship_acipc_memregion_set_map_clientdata(region: interop.PointerConvertible, data: interop.PointerConvertible, length: number): void;

declare function airship_acipc_memregion_activate(region: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_memregion_get_state(region: interop.PointerConvertible, out_detail: interop.PointerConvertible): interop.Enum<typeof airship_acipc_memregion_state>;

declare function airship_acipc_memregion_create_state_monitor(region: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_memregion_map(region: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_memregion_unmap(region: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_memregion_reset(region: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_doorbell_create(client: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_acipc_doorbell_destroy(doorbell: interop.PointerConvertible): void;

declare function airship_acipc_doorbell_get_bank(doorbell: interop.PointerConvertible): number;

declare function airship_acipc_doorbell_get_offset(doorbell: interop.PointerConvertible): number;

declare function airship_acipc_doorbell_get_width(doorbell: interop.PointerConvertible): number;

declare function airship_acipc_doorbell_activate(doorbell: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_doorbell_open(doorbell: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_doorbell_close(doorbell: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_doorbell_schedule_update(doorbell: interop.PointerConvertible, interval_us: number, leeway_us: number, value: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_doorbell_write(doorbell: interop.PointerConvertible, value: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_doorbell_schedule_update_shared(doorbell: interop.PointerConvertible, interval_us: number, leeway_us: number): interop.Enum<typeof airship_result>;

declare function airship_acipc_doorbell_write_shared(doorbell: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_auxiliary_context_create(client: interop.PointerConvertible, name: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_acipc_auxiliary_context_destroy(context: interop.PointerConvertible): void;

declare function airship_acipc_auxiliary_context_get_tr_index_count(context: interop.PointerConvertible): number;

declare function airship_acipc_auxiliary_context_get_cr_index_count(context: interop.PointerConvertible): number;

declare function airship_acipc_auxiliary_context_get_peripheral_info_interrupt(context: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_auxiliary_context_set_backing_memory(context: interop.PointerConvertible, buffer: interop.PointerConvertible, offset: number, length: number): void;

declare function airship_acipc_auxiliary_context_activate(context: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_auxiliary_context_get_state(context: interop.PointerConvertible, out_detail: interop.PointerConvertible): interop.Enum<typeof airship_acipc_auxiliary_context_state>;

declare function airship_acipc_auxiliary_context_create_state_monitor(context: interop.PointerConvertible): interop.Pointer;

declare function airship_acipc_auxiliary_context_open(context: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_auxiliary_context_close(context: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_auxiliary_context_reset(context: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_acipc_auxiliary_context_get_offsets(context: interop.PointerConvertible, out_offsets: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_centauri_alpha_tr_pool_create(client: interop.PointerConvertible, name: interop.PointerConvertible): interop.Pointer;

declare function airship_centauri_alpha_tr_pool_destroy(pool: interop.PointerConvertible): void;

declare function airship_centauri_alpha_tr_pool_reserve(pool: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_centauri_alpha_tr_pool_reserve_next(pool: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_centauri_alpha_tr_pool_release(pool: interop.PointerConvertible, tr: interop.PointerConvertible): void;

declare function airship_centauri_alpha_tr_pool_get_base_id(pool: interop.PointerConvertible): number;

declare function airship_centauri_alpha_tr_pool_get_count(pool: interop.PointerConvertible): number;

declare function airship_centauri_alpha_tr_pool_is_empty(pool: interop.PointerConvertible): boolean;

declare function airship_centauri_alpha_cr_pool_create(client: interop.PointerConvertible, name: interop.PointerConvertible): interop.Pointer;

declare function airship_centauri_alpha_cr_pool_destroy(pool: interop.PointerConvertible): void;

declare function airship_centauri_alpha_cr_pool_reserve(pool: interop.PointerConvertible, selector: number): interop.Pointer;

declare function airship_centauri_alpha_cr_pool_reserve_next(pool: interop.PointerConvertible, out_selector: interop.PointerConvertible): interop.Pointer;

declare function airship_centauri_alpha_cr_pool_release(pool: interop.PointerConvertible, cr: interop.PointerConvertible): void;

declare function airship_centauri_alpha_cr_pool_get_base_id(pool: interop.PointerConvertible): number;

declare function airship_centauri_alpha_cr_pool_get_count(pool: interop.PointerConvertible): number;

declare function airship_centauri_alpha_cr_pool_is_empty(pool: interop.PointerConvertible): boolean;

declare function airship_daleipc_get_ipc_error_description(error: number): string;

declare function airship_daleipc_create_channel_controller(client: interop.PointerConvertible, channel_name: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_channel_controller_destroy(channel_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_channel_controller_activate(channel_ctrl: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_channel_controller_create_sync_monitor(channel_ctrl: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_channel_controller_create_state_monitor(channel_ctrl: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_channel_controller_get_mtu_size(channel_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_channel_controller_get_channel_size(channel_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_channel_controller_get_free_space(channel_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_channel_controller_create_free_space_monitor(channel_ctrl: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_channel_controller_enqueue_transfer(channel_ctrl: interop.PointerConvertible, buffer: interop.PointerConvertible, offset: number, length: number, tag: number): interop.Enum<typeof airship_result>;

declare function airship_daleipc_channel_controller_sync(channel_ctrl: interop.PointerConvertible, flags: number): void;

declare function airship_daleipc_channel_controller_get_completed_transfer_count(channel_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_channel_controller_get_transfer_completion(channel_ctrl: interop.PointerConvertible, index: number, out_completion: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_channel_controller_consume_transfers(channel_ctrl: interop.PointerConvertible, count: number): interop.Enum<typeof airship_result>;

declare function airship_daleipc_channel_controller_synthesize_reset_completions(channel_ctrl: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_create_uplink_controller(client: interop.PointerConvertible, channel_name: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_uplink_controller_destroy(uplink_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_uplink_controller_activate(uplink_ctrl: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_uplink_controller_create_sync_monitor(uplink_ctrl: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_uplink_controller_get_free_space(uplink_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_uplink_controller_enqueue_iosk_packet(uplink_ctrl: interop.PointerConvertible, extbuf: interop.PointerConvertible, extbuf_offset: number, length: number, tag: number, channel_id: number): interop.Enum<typeof airship_result>;

declare function airship_daleipc_uplink_controller_sync(uplink_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_uplink_controller_get_completed_packet_count(uplink_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_uplink_controller_get_packet_completion(uplink_ctrl: interop.PointerConvertible, index: number, out_completion: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_uplink_controller_consume_packets(uplink_ctrl: interop.PointerConvertible, count: number): interop.Enum<typeof airship_result>;

declare function airship_daleipc_uplink_controller_synthesize_reset_completions(uplink_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_uplink_controller_get_channel_size(uplink_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_create_downlink_controller(client: interop.PointerConvertible, channel_name: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_downlink_controller_destroy(downlink_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_downlink_controller_activate(downlink_ctrl: interop.PointerConvertible, buffer_size: number): interop.Enum<typeof airship_result>;

declare function airship_daleipc_downlink_controller_create_sync_monitor(downlink_ctrl: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_downlink_controller_get_free_space(downlink_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_downlink_controller_enqueue_iosk_packet_buffer(downlink_ctrl: interop.PointerConvertible, buffer: interop.PointerConvertible, tag: number): interop.Enum<typeof airship_result>;

declare function airship_daleipc_downlink_controller_sync(downlink_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_downlink_controller_get_completed_packet_count(downlink_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_downlink_controller_get_packet_completion(downlink_ctrl: interop.PointerConvertible, index: number, out_completion: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_downlink_controller_consume_packets(downlink_ctrl: interop.PointerConvertible, count: number): interop.Enum<typeof airship_result>;

declare function airship_daleipc_downlink_controller_synthesize_reset_completions(downlink_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_downlink_controller_get_channel_size(downlink_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_downlink_controller_get_min_buffer_count(downlink_ctrl: interop.PointerConvertible): number;

declare function airship_daleipc_create_device_controller(client: interop.PointerConvertible, channel_name: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_device_controller_destroy(device_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_device_controller_activate(device_ctrl: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_device_controller_get_device_timings(device_ctrl: interop.PointerConvertible, frc: interop.PointerConvertible, ap: interop.PointerConvertible, host_begin_abs: interop.PointerConvertible, host_end_abs: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_create_network_clock_controller(client: interop.PointerConvertible, channel_name: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_network_clock_controller_destroy(network_clock_ctrl: interop.PointerConvertible): void;

declare function airship_daleipc_network_clock_controller_activate(network_clock_ctrl: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_network_clock_controller_create_clock_monitor(network_clock_ctrl: interop.PointerConvertible): interop.Pointer;

declare function airship_daleipc_network_clock_controller_get_network_clock_updates(network_clock_ctrl: interop.PointerConvertible, frc: interop.PointerConvertible, ap: interop.PointerConvertible, host_begin_abs: interop.PointerConvertible, host_end_abs: interop.PointerConvertible): interop.Enum<typeof airship_result>;

declare function airship_daleipc_network_clock_controller_reset(network_clock_ctrl: interop.PointerConvertible): void;

declare function do_mach_notify_port_deleted(notify: number, name: number): number;

declare function do_mach_notify_port_destroyed(notify: number, rights: number): number;

declare function do_mach_notify_no_senders(notify: number, mscount: number): number;

declare function do_mach_notify_send_once(notify: number): number;

declare function do_mach_notify_dead_name(notify: number, name: number): number;

declare function notify_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function notify_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function doubleagent_lookup_xattr(server: number, file_port: number, file_size: number, name: unknown /* const array */, err: interop.PointerConvertible, value_offset: interop.PointerConvertible, value_length: interop.PointerConvertible): number;

declare function doubleagent_allocate_xattr(server: number, file_port: number, file_size: number, name: unknown /* const array */, size: number, options: number, err: interop.PointerConvertible, value_offset: interop.PointerConvertible): number;

declare function doubleagent_list_xattrs(server: number, file_port: number, file_size: number, err: interop.PointerConvertible, result: interop.PointerConvertible): number;

declare function doubleagent_remove_xattr(server: number, file_port: number, file_size: number, name: unknown /* const array */, err: interop.PointerConvertible, is_empty: interop.PointerConvertible): number;

declare function doubleagent_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function doubleagent_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function iocompressionstats_notification(iocompressionstats_port: number, flags: number): number;

declare function iocompressionstats_notification_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function iocompressionstats_notification_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function fairplayd_arcade_request(fairplayd_port: number, arcade_reg_port: number): number;

declare function fairplay_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function fairplay_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function coalition_notification(coalition_port: number, id: number, flags: number): number;

declare function coalition_notification_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function coalition_notification_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function telemetry_notification(telemetry_port: number, flags: number): number;

declare function telemetry_notification_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function telemetry_notification_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function upl_abort(upl_object: number, abort_cond: number): number;

declare function upl_abort_range(upl_object: number, offset: number, size: number, abort_cond: number, empty: interop.PointerConvertible): number;

declare function upl_commit(upl_object: number, page_list: number, page_listCnt: number): number;

declare function upl_commit_range(upl_object: number, offset: number, size: number, cntrl_flags: number, page_list: number, page_listCnt: number, empty: interop.PointerConvertible): number;

declare function memory_error_notification(memory_error_port: number, event: ecc_event_t, atoken: audit_token_t): number;

declare function mcc_memory_error_notification(memory_error_port: number, event: mcc_ecc_event_t, atoken: audit_token_t): number;

declare function llc_memory_error_notification(memory_error_port: number, event: llc_event_t, atoken: audit_token_t): number;

declare function memory_error_notification_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function memory_error_notification_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function send_ktrace_background_available(ktrace_background_port: number): number;

declare function clock_alarm_reply(alarm_port: number, alarm_code: number, alarm_type: number, alarm_time: mach_timespec): number;

declare function clock_reply_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function clock_reply_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function receive_sysdiagnose_notification(sysdiagnose_port: number, flags: number): number;

declare function receive_sysdiagnose_notification_with_audit_token(sysdiagnose_port: number, flags: number, atoken: audit_token_t): number;

declare function sysdiagnose_notification_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function sysdiagnose_notification_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function check_task_access(task_access_port: number, calling_pid: number, calling_gid: number, target_pid: number): number;

declare function find_code_signature(task_access_port: number, new_pid: number): number;

declare function check_task_access_with_flavor(task_access_port: number, calling_pid: number, calling_gid: number, target_pid: number, flavor: number): number;

declare function send_nspace_handle(nspace_handler_port: number, pid: number, path: unknown /* const array */, handler_error: interop.PointerConvertible): number;

declare function send_nspace_resolve_cancel(nspace_handler_port: number, req_id: number): number;

declare function send_nspace_resolve_path(nspace_handler_port: number, req_id: number, pid: number, op: number, path: unknown /* const array */, resolve_error: interop.PointerConvertible): number;

declare function send_vfs_resolve_file(nspace_handler_port: number, req_id: number, pid: number, op: number, offset: number, size: number, path: unknown /* const array */): number;

declare function send_vfs_resolve_dir(nspace_handler_port: number, req_id: number, pid: number, op: number, file_name: unknown /* const array */, path: unknown /* const array */): number;

declare function send_vfs_resolve_file_with_audit_token(nspace_handler_port: number, req_id: number, op: number, offset: number, size: number, path: unknown /* const array */, req_atoken: audit_token_t): number;

declare function send_vfs_resolve_dir_with_audit_token(nspace_handler_port: number, req_id: number, op: number, file_name: unknown /* const array */, path: unknown /* const array */, req_atoken: audit_token_t): number;

declare function send_vfs_resolve_reparent_with_audit_token(nspace_handler_port: number, req_id: number, op: number, path: unknown /* const array */, dest_path: unknown /* const array */, req_atoken: audit_token_t): number;

declare function catch_mach_exception_raise(exception_port: number, thread: number, task: number, exception: number, code: interop.PointerConvertible, codeCnt: number): number;

declare function catch_mach_exception_raise_state(exception_port: number, exception: number, code: interop.PointerConvertible, codeCnt: number, flavor: interop.PointerConvertible, old_state: interop.PointerConvertible, old_stateCnt: number, new_state: interop.PointerConvertible, new_stateCnt: interop.PointerConvertible): number;

declare function catch_mach_exception_raise_state_identity(exception_port: number, thread: number, task: number, exception: number, code: interop.PointerConvertible, codeCnt: number, flavor: interop.PointerConvertible, old_state: interop.PointerConvertible, old_stateCnt: number, new_state: interop.PointerConvertible, new_stateCnt: interop.PointerConvertible): number;

declare function mach_exc_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function mach_exc_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function mach_voucher_extract_attr_content(voucher: number, key: number, content: interop.PointerConvertible, contentCnt: interop.PointerConvertible): number;

declare function mach_voucher_extract_attr_recipe(voucher: number, key: number, recipe: interop.PointerConvertible, recipeCnt: interop.PointerConvertible): number;

declare function mach_voucher_extract_all_attr_recipes(voucher: number, recipes: interop.PointerConvertible, recipesCnt: interop.PointerConvertible): number;

declare function mach_voucher_attr_command(voucher: number, key: number, command: number, in_content: interop.PointerConvertible, in_contentCnt: number, out_content: interop.PointerConvertible, out_contentCnt: interop.PointerConvertible): number;

declare function mach_voucher_debug_info(task: number, voucher_name: number, recipes: interop.PointerConvertible, recipesCnt: interop.PointerConvertible): number;

declare function mach_voucher_attr_control_get_values(control: number, voucher: number, value_handles: interop.PointerConvertible, value_handlesCnt: interop.PointerConvertible): number;

declare function mach_voucher_attr_control_create_mach_voucher(control: number, recipes: interop.PointerConvertible, recipesCnt: number, voucher: interop.PointerConvertible): number;

declare function audit_triggers(audit_port: number, flags: number): number;

declare function audit_analytics(audit_port: number, caller_id: string, caller_name: string): number;

declare function audit_triggers_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function audit_triggers_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function arcade_upcall(arcade_upcall: number, path: number, pathCnt: number, offset: number, should_kill: interop.PointerConvertible): number;

declare function arcade_upcall_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function arcade_upcall_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function receive_nspace_handle(nspace_handler_port: number, pid: number, path: unknown /* const array */, handler_error: interop.PointerConvertible): number;

declare function receive_nspace_resolve_cancel(nspace_handler_port: number, req_id: number): number;

declare function receive_nspace_resolve_path(nspace_handler_port: number, req_id: number, pid: number, op: number, path: unknown /* const array */, resolve_error: interop.PointerConvertible): number;

declare function receive_vfs_resolve_file(nspace_handler_port: number, req_id: number, pid: number, op: number, offset: number, size: number, path: unknown /* const array */): number;

declare function receive_vfs_resolve_dir(nspace_handler_port: number, req_id: number, pid: number, op: number, file_name: unknown /* const array */, path: unknown /* const array */): number;

declare function receive_vfs_resolve_file_with_audit_token(nspace_handler_port: number, req_id: number, op: number, offset: number, size: number, path: unknown /* const array */, req_atoken: audit_token_t, atoken: audit_token_t): number;

declare function receive_vfs_resolve_dir_with_audit_token(nspace_handler_port: number, req_id: number, op: number, file_name: unknown /* const array */, path: unknown /* const array */, req_atoken: audit_token_t, atoken: audit_token_t): number;

declare function receive_vfs_resolve_reparent_with_audit_token(nspace_handler_port: number, req_id: number, op: number, path: unknown /* const array */, dest_path: unknown /* const array */, req_atoken: audit_token_t, atoken: audit_token_t): number;

declare function vfs_nspace_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function vfs_nspace_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function check_task_access(task_access_port: number, calling_pid: number, calling_gid: number, target_pid: number, caller_cred: audit_token_t): number;

declare function find_code_signature(task_access_port: number, new_pid: number): number;

declare function check_task_access_with_flavor(task_access_port: number, calling_pid: number, calling_gid: number, target_pid: number, flavor: number, caller_cred: audit_token_t): number;

declare function task_access_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function task_access_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function catch_exception_raise(exception_port: number, thread: number, task: number, exception: number, code: interop.PointerConvertible, codeCnt: number): number;

declare function catch_exception_raise_state(exception_port: number, exception: number, code: interop.PointerConvertible, codeCnt: number, flavor: interop.PointerConvertible, old_state: interop.PointerConvertible, old_stateCnt: number, new_state: interop.PointerConvertible, new_stateCnt: interop.PointerConvertible): number;

declare function catch_exception_raise_state_identity(exception_port: number, thread: number, task: number, exception: number, code: interop.PointerConvertible, codeCnt: number, flavor: interop.PointerConvertible, old_state: interop.PointerConvertible, old_stateCnt: number, new_state: interop.PointerConvertible, new_stateCnt: interop.PointerConvertible): number;

declare function exc_server(InHeadP: interop.PointerConvertible, OutHeadP: interop.PointerConvertible): number;

declare function exc_server_routine(InHeadP: interop.PointerConvertible): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

declare function clock_get_time(clock_serv: number, cur_time: interop.PointerConvertible): number;

declare function clock_get_attributes(clock_serv: number, flavor: number, clock_attr: interop.PointerConvertible, clock_attrCnt: interop.PointerConvertible): number;

declare function clock_alarm(clock_serv: number, alarm_type: number, alarm_time: mach_timespec, alarm_port: number): number;

declare function mach_vm_allocate(target: number, address: interop.PointerConvertible, size: number, flags: number): number;

declare function mach_vm_deallocate(target: number, address: number, size: number): number;

declare function mach_vm_protect(target_task: number, address: number, size: number, set_maximum: number, new_protection: number): number;

declare function mach_vm_inherit(target_task: number, address: number, size: number, new_inheritance: number): number;

declare function mach_vm_read(target_task: number, address: number, size: number, data: interop.PointerConvertible, dataCnt: interop.PointerConvertible): number;

declare function mach_vm_read_list(target_task: number, data_list: unknown /* const array */, count: number): number;

declare function mach_vm_write(target_task: number, address: number, data: number, dataCnt: number): number;

declare function mach_vm_copy(target_task: number, source_address: number, size: number, dest_address: number): number;

declare function mach_vm_read_overwrite(target_task: number, address: number, size: number, data: number, outsize: interop.PointerConvertible): number;

declare function mach_vm_msync(target_task: number, address: number, size: number, sync_flags: number): number;

declare function mach_vm_behavior_set(target_task: number, address: number, size: number, new_behavior: number): number;

declare function mach_vm_map(target_task: number, address: interop.PointerConvertible, size: number, mask: number, flags: number, object: number, offset: number, copy: number, cur_protection: number, max_protection: number, inheritance: number): number;

declare function mach_vm_machine_attribute(target_task: number, address: number, size: number, attribute: number, value: interop.PointerConvertible): number;

declare function mach_vm_remap(target_task: number, target_address: interop.PointerConvertible, size: number, mask: number, flags: number, src_task: number, src_address: number, copy: number, cur_protection: interop.PointerConvertible, max_protection: interop.PointerConvertible, inheritance: number): number;

declare function mach_vm_page_query(target_map: number, offset: number, disposition: interop.PointerConvertible, ref_count: interop.PointerConvertible): number;

declare function mach_vm_region_recurse(target_task: number, address: interop.PointerConvertible, size: interop.PointerConvertible, nesting_depth: interop.PointerConvertible, info: interop.PointerConvertible, infoCnt: interop.PointerConvertible): number;

declare function mach_vm_region(target_task: number, address: interop.PointerConvertible, size: interop.PointerConvertible, flavor: number, info: interop.PointerConvertible, infoCnt: interop.PointerConvertible, object_name: interop.PointerConvertible): number;

declare function _mach_make_memory_entry(target_task: number, size: interop.PointerConvertible, offset: number, permission: number, object_handle: interop.PointerConvertible, parent_handle: number): number;

declare function mach_vm_purgable_control(target_task: number, address: number, control: number, state: interop.PointerConvertible): number;

declare function mach_vm_page_info(target_task: number, address: number, flavor: number, info: interop.PointerConvertible, infoCnt: interop.PointerConvertible): number;

declare function mach_vm_page_range_query(target_map: number, address: number, size: number, dispositions: number, dispositions_count: interop.PointerConvertible): number;

declare function mach_vm_remap_new(target_task: number, target_address: interop.PointerConvertible, size: number, mask: number, flags: number, src_task: number, src_address: number, copy: number, cur_protection: interop.PointerConvertible, max_protection: interop.PointerConvertible, inheritance: number): number;

declare function mach_vm_deferred_reclamation_buffer_allocate(target_task: number, address: interop.PointerConvertible, next_deadline: interop.PointerConvertible, len: number, max_len: number): number;

declare function mach_vm_deferred_reclamation_buffer_flush(target_task: number, num_entries_to_reclaim: number, bytes_reclaimed: interop.PointerConvertible, next_deadline: interop.PointerConvertible): number;

declare function mach_vm_range_create(target_task: number, flavor: interop.Enum<typeof mach_vm_range_flavor_t>, recipes: interop.PointerConvertible, recipesCnt: number): number;

declare function mach_vm_deferred_reclamation_buffer_resize(target_task: number, new_len: number, bytes_reclaimed: interop.PointerConvertible, next_deadline: interop.PointerConvertible): number;

declare function mach_vm_update_pointers_with_remote_tags(target: number, in_pointer_list: interop.PointerConvertible, in_pointer_listCnt: number, out_pointer_list: interop.PointerConvertible, out_pointer_listCnt: interop.PointerConvertible): number;

declare function mach_vm_deferred_reclamation_buffer_query(target: number, addr: interop.PointerConvertible, size: interop.PointerConvertible): number;

declare function mach_vm_reallocate(target_task: number, src: number, src_size: number, dst: interop.PointerConvertible, dst_size: number, align_mask: number, options: number, flags: number): number;

declare function mach_memory_entry_purgable_control(mem_entry: number, control: number, state: interop.PointerConvertible): number;

declare function mach_memory_entry_access_tracking(mem_entry: number, access_tracking: interop.PointerConvertible, access_tracking_reads: interop.PointerConvertible, access_tracking_writes: interop.PointerConvertible): number;

declare function mach_memory_entry_ownership(mem_entry: number, owner: number, ledger_tag: number, ledger_flags: number): number;

declare function mach_memory_entry_get_page_counts(mem_entry: number, resident_cnt: interop.PointerConvertible, dirty_cnt: interop.PointerConvertible, swapped_cnt: interop.PointerConvertible): number;

declare function mach_memory_entry_region_info(mem_entry: number, offset: interop.PointerConvertible, size: interop.PointerConvertible, info: interop.PointerConvertible, infoCnt: interop.PointerConvertible): number;

declare function os_log_create(subsystem: string, category: string): NSObject;

declare function os_log_type_enabled(log: NSObject, OS_LOG_TYPE_INFO: number): boolean;

declare function os_log_type_enabled(log: NSObject, OS_LOG_TYPE_DEBUG: number): boolean;

declare function os_log_coprocessor(buff: interop.PointerConvertible, buff_len: number, type: interop.Enum<typeof os_log_type_t>, uuid: string, timestamp: number, offset: number, stream_log: boolean): boolean;

declare function os_log_coprocessor_with_handle(log: NSObject, buff: interop.PointerConvertible, buff_len: number, type: interop.Enum<typeof os_log_type_t>, uuid: string, timestamp: number, offset: number, stream_log: boolean): boolean;

declare function os_log_coprocessor_register(uuid: string, file_path: string, copy: boolean): void;

declare function os_log_coprocessor_register_with_type(uuid: string, file_path: string, register_type: interop.Enum<typeof os_log_coproc_reg_t>): void;

declare function _os_log_internal(dso: interop.PointerConvertible, log: NSObject, type: interop.Enum<typeof os_log_type_t>, message: string): void;

declare function _os_log_internal_driverKit(dso: interop.PointerConvertible, log: NSObject, type: interop.Enum<typeof os_log_type_t>, message: string): number;

declare function _os_log_at_time(dso: interop.PointerConvertible, log: NSObject, type: interop.Enum<typeof os_log_type_t>, ts: number, message: string): void;

declare function kextd_ping(server: number): number;

declare function nlist(filename: string, list: interop.PointerConvertible): number;

declare function KUNCUserNotificationDisplayNotice(noticeTimeout: number, flags: number, iconPath: string, soundPath: string, localizationPath: string, alertHeader: string, alertMessage: string, defaultButtonTitle: string): number;

declare function KUNCUserNotificationDisplayAlert(alertTimeout: number, flags: number, iconPath: string, soundPath: string, localizationPath: string, alertHeader: string, alertMessage: string, defaultButtonTitle: string, alternateButtonTitle: string, otherButtonTitle: string, responseFlags: interop.PointerConvertible): number;

declare function KUNCExecute(executionPath: string, openAsUser: number, pathExecutionType: number): number;

declare function KUNCGetNotificationID(): number;

declare function KUNCUserNotificationDisplayFromBundle(notificationID: number, bundleIdentifier: string, fileName: string, fileExtension: string, messageKey: string, tokenString: string, callback: (p1: number, p2: number, p3: interop.PointerConvertible) => void, contextKey: number): number;

declare function machine_do_debugid(): void;

declare function machine_arm_debug_info(): interop.Pointer;

declare function machine_do_mvfpid(): void;

declare function machine_arm_mvfp_info(): interop.Pointer;

declare function machine_read_midr(): number;

declare function machine_read_clidr(): number;

declare function machine_read_ccsidr(): number;

declare function machine_write_csselr(level: interop.Enum<typeof csselr_cache_level>, type: interop.Enum<typeof csselr_cache_type>): void;

declare function get_user_regs(p1: number): interop.Pointer;

declare function find_user_regs(p1: number): interop.Pointer;

declare function find_kern_regs(p1: number): interop.Pointer;

declare function find_user_vfp(p1: number): interop.Pointer;

declare function find_debug_state32(p1: number): interop.Pointer;

declare function find_or_allocate_debug_state32(p1: number): interop.Pointer;

declare function find_debug_state64(p1: number): interop.Pointer;

declare function find_or_allocate_debug_state64(p1: number): interop.Pointer;

declare function allocate_debug_state64(): interop.Pointer;

declare function free_debug_state(p1: interop.PointerConvertible): void;

declare function set_user_neon_reg(p1: number, p2: number, uint128_t: number): void;

declare function act_thread_csave(): interop.Pointer;

declare function act_thread_catt(ctx: interop.PointerConvertible): void;

declare function act_thread_cfree(ctx: interop.PointerConvertible): void;

declare function machine_read_isa_feat1(): arm_isa_feat1_reg;

declare function nd6_lookup_ipv6(interface: interop.PointerConvertible, ip6_dest: interop.PointerConvertible, ll_dest: interop.PointerConvertible, ll_dest_len: number, hint: interop.PointerConvertible, packet: interop.PointerConvertible): number;

declare function nd6_lookup_next_hop_for_dest(interface: interop.PointerConvertible, ip6_dest: interop.PointerConvertible, ll_dest: interop.PointerConvertible, ll_dest_len: number, hint: interop.PointerConvertible, packet: interop.PointerConvertible): number;

declare function random_buf(buf: interop.PointerConvertible, buflen: number): number;

declare function SHA1Init(p1: interop.PointerConvertible): void;

declare function SHA1Update(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number): void;

declare function SHA1Final(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function OSMalloc_Tagalloc(name: string, flags: number): interop.Pointer;

declare function OSMalloc_Tagfree(tag: interop.PointerConvertible): void;

declare function OSMalloc(size: number, tag: interop.PointerConvertible): interop.Pointer;

declare function OSMalloc_nowait(size: number, tag: interop.PointerConvertible): interop.Pointer;

declare function OSMalloc_noblock(size: number, tag: interop.PointerConvertible): interop.Pointer;

declare function OSFree(addr: interop.PointerConvertible, size: number, tag: interop.PointerConvertible): void;

declare function OSPrintMemory(): void;

declare function sysctlbyname(p1: string, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number): number;

declare function zlibVersion(): string;

declare function deflate(strm: interop.PointerConvertible, flush: number): number;

declare function deflateEnd(strm: interop.PointerConvertible): number;

declare function inflate(strm: interop.PointerConvertible, flush: number): number;

declare function inflateEnd(strm: interop.PointerConvertible): number;

declare function deflateSetDictionary(strm: interop.PointerConvertible, dictionary: interop.PointerConvertible, dictLength: number): number;

declare function deflateCopy(dest: interop.PointerConvertible, source: interop.PointerConvertible): number;

declare function deflateReset(strm: interop.PointerConvertible): number;

declare function deflateParams(strm: interop.PointerConvertible, level: number, strategy: number): number;

declare function deflateTune(strm: interop.PointerConvertible, good_length: number, max_lazy: number, nice_length: number, max_chain: number): number;

declare function deflateBound(strm: interop.PointerConvertible, sourceLen: number): number;

declare function deflatePrime(strm: interop.PointerConvertible, bits: number, value: number): number;

declare function deflateSetHeader(strm: interop.PointerConvertible, head: interop.PointerConvertible): number;

declare function inflateSetDictionary(strm: interop.PointerConvertible, dictionary: interop.PointerConvertible, dictLength: number): number;

declare function inflateSync(strm: interop.PointerConvertible): number;

declare function inflateCopy(dest: interop.PointerConvertible, source: interop.PointerConvertible): number;

declare function inflateReset(strm: interop.PointerConvertible): number;

declare function inflatePrime(strm: interop.PointerConvertible, bits: number, value: number): number;

declare function inflateGetHeader(strm: interop.PointerConvertible, head: interop.PointerConvertible): number;

declare function inflateBack(strm: interop.PointerConvertible, in_: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, in_desc: interop.PointerConvertible, out: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number, out_desc: interop.PointerConvertible): number;

declare function inflateBackEnd(strm: interop.PointerConvertible): number;

declare function zlibCompileFlags(): number;

declare function compress(dest: interop.PointerConvertible, destLen: interop.PointerConvertible, source: interop.PointerConvertible, sourceLen: number): number;

declare function compress2(dest: interop.PointerConvertible, destLen: interop.PointerConvertible, source: interop.PointerConvertible, sourceLen: number, level: number): number;

declare function compressBound(sourceLen: number): number;

declare function uncompress(dest: interop.PointerConvertible, destLen: interop.PointerConvertible, source: interop.PointerConvertible, sourceLen: number): number;

declare function adler32(adler: number, buf: interop.PointerConvertible, len: number): number;

declare function adler32_combine(adler1: number, adler2: number, len2: number): number;

declare function z_crc32(crc: number, buf: interop.PointerConvertible, len: number): number;

declare function z_crc32_combine(crc1: number, crc2: number, len2: number): number;

declare function deflateInit_(strm: interop.PointerConvertible, level: number, version: string, stream_size: number): number;

declare function inflateInit_(strm: interop.PointerConvertible, version: string, stream_size: number): number;

declare function deflateInit2_(strm: interop.PointerConvertible, level: number, method: number, windowBits: number, memLevel: number, strategy: number, version: string, stream_size: number): number;

declare function inflateInit2_(strm: interop.PointerConvertible, windowBits: number, version: string, stream_size: number): number;

declare function inflateBackInit_(strm: interop.PointerConvertible, windowBits: number, window: interop.PointerConvertible, version: string, stream_size: number): number;

declare function zError(p1: number): string;

declare function inflateSyncPoint(z: interop.PointerConvertible): number;

declare function get_crc_table(): interop.Pointer;

declare function OSCompareAndSwap64(oldValue: number, newValue: number, address: interop.PointerConvertible): number;

declare function OSAddAtomic64(theAmount: number, address: interop.PointerConvertible): number;

declare function OSCompareAndSwap(oldValue: number, newValue: number, address: interop.PointerConvertible): number;

declare function OSCompareAndSwapPtr(oldValue: interop.PointerConvertible, newValue: interop.PointerConvertible, address: interop.PointerConvertible): number;

declare function OSAddAtomic(amount: number, address: interop.PointerConvertible): number;

declare function OSAddAtomic16(amount: number, address: interop.PointerConvertible): number;

declare function OSAddAtomic8(amount: number, address: interop.PointerConvertible): number;

declare function OSIncrementAtomic(address: interop.PointerConvertible): number;

declare function OSIncrementAtomic16(address: interop.PointerConvertible): number;

declare function OSIncrementAtomic8(address: interop.PointerConvertible): number;

declare function OSDecrementAtomic(address: interop.PointerConvertible): number;

declare function OSDecrementAtomic16(address: interop.PointerConvertible): number;

declare function OSDecrementAtomic8(address: interop.PointerConvertible): number;

declare function OSBitAndAtomic(mask: number, address: interop.PointerConvertible): number;

declare function OSBitAndAtomic16(mask: number, address: interop.PointerConvertible): number;

declare function OSBitAndAtomic8(mask: number, address: interop.PointerConvertible): number;

declare function OSBitOrAtomic(mask: number, address: interop.PointerConvertible): number;

declare function OSBitOrAtomic16(mask: number, address: interop.PointerConvertible): number;

declare function OSBitOrAtomic8(mask: number, address: interop.PointerConvertible): number;

declare function OSBitXorAtomic(mask: number, address: interop.PointerConvertible): number;

declare function OSBitXorAtomic16(mask: number, address: interop.PointerConvertible): number;

declare function OSBitXorAtomic8(mask: number, address: interop.PointerConvertible): number;

declare function OSTestAndSet(bit: number, startAddress: interop.PointerConvertible): number;

declare function OSTestAndClear(bit: number, startAddress: interop.PointerConvertible): number;

declare function OSSynchronizeIO(): void;

declare function OSReportWithBacktrace(str: string): void;

declare function OSBacktrace(bt: interop.PointerConvertible, maxAddrs: number): number;

declare function OSPrintBacktrace(): void;

declare function OSKernelStackRemaining(): number;

declare function mach_gss_init_sec_context(server: number, mech: interop.Enum<typeof gssd_mechtype>, intoken: interop.PointerConvertible, intokenCnt: number, uid: number, princ_namestr: string, svc_namestr: string, flags: number, gssd_flags: number, context: interop.PointerConvertible, cred_handle: interop.PointerConvertible, ret_flags: interop.PointerConvertible, key: interop.PointerConvertible, keyCnt: interop.PointerConvertible, outtoken: interop.PointerConvertible, outtokenCnt: interop.PointerConvertible, major_stat: interop.PointerConvertible, minor_stat: interop.PointerConvertible): number;

declare function mach_gss_accept_sec_context(server: number, intoken: interop.PointerConvertible, intokenCnt: number, svc_namestr: string, gssd_flags: number, context: interop.PointerConvertible, cred_handle: interop.PointerConvertible, flags: interop.PointerConvertible, uid: interop.PointerConvertible, gids: interop.PointerConvertible, gidsCnt: interop.PointerConvertible, key: interop.PointerConvertible, keyCnt: interop.PointerConvertible, outtoken: interop.PointerConvertible, outtokenCnt: interop.PointerConvertible, major_stat: interop.PointerConvertible, minor_stat: interop.PointerConvertible): number;

declare function mach_gss_log_error(server: number, mnt: string, uid: number, source: string, major_stat: number, minor_stat: number): number;

declare function mach_gss_init_sec_context_v2(server: number, mech: interop.Enum<typeof gssd_mechtype>, intoken: interop.PointerConvertible, intokenCnt: number, uid: number, clnt_nt: interop.Enum<typeof gssd_nametype>, clnt_princ: interop.PointerConvertible, clnt_princCnt: number, svc_nt: interop.Enum<typeof gssd_nametype>, svc_princ: interop.PointerConvertible, svc_princCnt: number, flags: number, gssd_flags: interop.PointerConvertible, context: interop.PointerConvertible, cred_handle: interop.PointerConvertible, ret_flags: interop.PointerConvertible, key: interop.PointerConvertible, keyCnt: interop.PointerConvertible, outtoken: interop.PointerConvertible, outtokenCnt: interop.PointerConvertible, displayname: string, major_stat: interop.PointerConvertible, minor_stat: interop.PointerConvertible): number;

declare function mach_gss_accept_sec_context_v2(server: number, intoken: interop.PointerConvertible, intokenCnt: number, svc_nt: interop.Enum<typeof gssd_nametype>, svc_princ: interop.PointerConvertible, svc_princCnt: number, gssd_flags: interop.PointerConvertible, context: interop.PointerConvertible, cred_handle: interop.PointerConvertible, flags: interop.PointerConvertible, uid: interop.PointerConvertible, gids: interop.PointerConvertible, gidsCnt: interop.PointerConvertible, key: interop.PointerConvertible, keyCnt: interop.PointerConvertible, outtoken: interop.PointerConvertible, outtokenCnt: interop.PointerConvertible, major_stat: interop.PointerConvertible, minor_stat: interop.PointerConvertible): number;

declare function mach_gss_init_sec_context_v3(server: number, mech: interop.Enum<typeof gssd_mechtype>, intoken: interop.PointerConvertible, intokenCnt: number, uid: number, clnt_nt: interop.Enum<typeof gssd_nametype>, clnt_princ: interop.PointerConvertible, clnt_princCnt: number, svc_nt: interop.Enum<typeof gssd_nametype>, svc_princ: interop.PointerConvertible, svc_princCnt: number, flags: number, etypes: interop.PointerConvertible, etypesCnt: number, gssd_flags: interop.PointerConvertible, context: interop.PointerConvertible, cred_handle: interop.PointerConvertible, ret_flags: interop.PointerConvertible, key: interop.PointerConvertible, keyCnt: interop.PointerConvertible, outtoken: interop.PointerConvertible, outtokenCnt: interop.PointerConvertible, displayname: string, major_stat: interop.PointerConvertible, minor_stat: interop.PointerConvertible): number;

declare function mach_gss_hold_cred(server: number, mech: interop.Enum<typeof gssd_mechtype>, nt: interop.Enum<typeof gssd_nametype>, princ: interop.PointerConvertible, princCnt: number, major_stat: interop.PointerConvertible, minor_stat: interop.PointerConvertible): number;

declare function mach_gss_unhold_cred(server: number, mech: interop.Enum<typeof gssd_mechtype>, nt: interop.Enum<typeof gssd_nametype>, princ: interop.PointerConvertible, princCnt: number, major_stat: interop.PointerConvertible, minor_stat: interop.PointerConvertible): number;

declare function mach_gss_lookup(server: number, uid: number, asid: number, gssd_session_port: interop.PointerConvertible): number;

declare function mach_bridge_register_regwrite_timestamp_callback(func: (p1: number) => void): void;

declare function cpc_cycles_instrs_raw_approx_x86_64(unhalted_ref_cycles_out: interop.PointerConvertible): cpc_cycles_instrs;

declare function cpc_early_init(): void;

declare function serial_keyboard_init(): void;

declare function serial_keyboard_start(): void;

declare function serial_keyboard_poll(): void;

declare function console_init(): void;

declare function _serial_getc(wait: boolean): number;

declare function _vcgetc(wait: boolean): number;

declare function console_is_serial(): number;

declare function switch_to_serial_console(): number;

declare function switch_to_video_console(): number;

declare function switch_to_old_console(old_console: number): void;

