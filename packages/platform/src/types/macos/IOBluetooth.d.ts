import type { CBCentralManager, CBCentralManagerDelegate, CBPeripheral } from './CoreBluetooth'

import type { NSArray, NSCoder, NSCoding, NSCopying, NSDate, NSDictionary, NSError, NSNumber, NSPortDelegate, NSPortMessage, NSSecureCoding, NSStream, NSStreamDelegate } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSData, NSStreamEvent } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const IOBluetoothPDUTimestamp: string;

export declare const IOBluetoothPDUProtocolID: string;

export declare const IOBluetoothPDUOriginatingAddressType: string;

export declare const IOBluetoothPDUOriginatingAddress: string;

export declare const IOBluetoothPDUType: string;

export declare const IOBluetoothHandsFreeCallName: string;

export declare const IOBluetoothHandsFreeCallMultiparty: string;

export declare const IOBluetoothHandsFreeCallMode: string;

export declare const IOBluetoothHandsFreeCallDirection: string;

export declare const IOBluetoothHandsFreeIndicatorBattChg: string;

export declare const IOBluetoothHandsFreeIndicatorSignal: string;

export declare const IOBluetoothHandsFreeIndicatorCallSetup: string;

export declare const IOBluetoothHandsFreeIndicatorCall: string;

export declare const IOBluetoothHandsFreeIndicatorService: string;

export declare const kFTSListingTypeKey: interop.Object;

export declare const kFTSListingNameKey: interop.Object;

export declare const kFTSProgressTransferRateKey: interop.Object;

export declare const kFTSProgressTimeElapsedKey: interop.Object;

export declare const kFTSProgressBytesTransferredKey: interop.Object;

export declare const kOBEXHeaderIDKeyUnknown1ByteQuantity: interop.Object;

export declare const kOBEXHeaderIDKeyUnknownByteSequence: interop.Object;

export declare const kOBEXHeaderIDKeyUnknownUnicodeText: interop.Object;

export declare const kOBEXHeaderIDKeyObjectClass: interop.Object;

export declare const kOBEXHeaderIDKeyAuthorizationResponse: interop.Object;

export declare const kOBEXHeaderIDKeyAppParameters: interop.Object;

export declare const kOBEXHeaderIDKeyHTTP: interop.Object;

export declare const kOBEXHeaderIDKeyTarget: interop.Object;

export declare const kOBEXHeaderIDKeyDescription: interop.Object;

export declare const kOBEXHeaderIDKeyType: interop.Object;

export declare const IOBluetoothL2CAPChannelTerminatedNotification: string;

export declare const IOBluetoothHostControllerPoweredOffNotification: string;

export declare const kOBEXHeaderIDKeyBody: interop.Object;

export declare const IOBluetoothHostControllerPoweredOnNotification: string;

export declare const IOBluetoothPDUUserData: string;

export declare const kBluetoothHCICommandReadEncryptionKeySize: number;

export declare const kBluetoothL2CAPTCICommandL2CA_GroupRemoveMember: number;

export declare const kBluetoothHCICommandLESetPeriodicAdvertisingEnable: number;

export declare const kBluetoothL2CAPChannelBREDRSecurityManager: number;

export declare const kBluetoothDeviceClassMajorAny: number;

export declare const kBluetoothHCICommandGroupLogoTesting: number;

export declare const kOBEXHeaderIDKeyByteSequence: interop.Object;

export declare const kBluetoothVoiceSettingInputCodingALawInputCoding: number;

export declare const kOBEXHeaderIDKeyCount: interop.Object;

export declare const kBluetoothHCICommandLEStartEncryption: number;

export declare const kBluetoothServiceClassMajorCapturing: number;

export declare const kBluetoothHCIEventMaskDefault: number;

export declare const kBluetoothHCIErrorSCOAirModeRejected: number;

export declare const kBluetoothL2CAPChannelDynamicStart: number;

export declare const kBluetoothHCIErrorQoSRejected: number;

export declare const kOBEXHeaderIDKeyEndOfBody: interop.Object;

export declare const kBluetoothL2CAPTCICommandL2CA_DisconnectResp: number;

export declare const kBluetoothHCICommandSetConnectionlessPeripheralBroadcastData: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceKeyboard: number;

export declare const kBluetoothSDPPDUIDReserved: number;

export declare const kBluetoothVoiceSettingInputCodingMask: number;

export declare const kBluetoothDeviceClassMajorUnclassified: number;

export declare const kBluetoothDeviceClassMinorPeripheral2Gamepad: number;

export declare const kBluetoothSDPUUID16UDI_C_Plane: number;

export declare const kBluetoothLESecurityManagerNoBonding: number;

export declare const kBluetoothVoiceSettingInputCodingULawInputCoding: number;

export declare const kOBEXHeaderIDKeyTime4Byte: interop.Object;

export declare const kBluetoothHCICommandReadNumberOfSupportedIAC: number;

export declare const kBluetoothHCICommandSetReservedLTADDR: number;

export declare const kBluetoothL2CAPMTULowEnergyDefault: number;

export declare const kBluetoothHCICommandReadDefaultErroneousDataReporting: number;

export declare const kBluetoothHCICommandQoSSetup: number;

export declare const kBluetoothHCICommandChangeConnectionPacketType: number;

export declare const kBluetoothSDPDataElementTypeUUID: number;

export declare const kBluetoothHCIEventMaskChangeConnectionLinkKeyComplete: number;

export declare const kBluetoothSDPDataElementTypeReservedStart: number;

export declare const kBluetoothHCICommandLETransmitterTest: number;

export declare const kBluetoothKeyTypeAuthenticatedCombination: number;

export declare const kBluetoothSDPDataElementTypeURL: number;

export declare const kBluetoothSDPDataElementTypeDataElementSequence: number;

export declare const kBluetoothSDPDataElementTypeString: number;

export declare const kBluetoothSDPErrorCodeReserved: number;

export declare const kBluetoothSDPErrorCodeSuccess: number;

export declare const kBluetoothSDPPDUIDServiceSearchAttributeRequest: number;

export declare const kBluetoothSDPPDUIDServiceAttributeResponse: number;

export declare const kBluetoothSDPPDUIDServiceSearchResponse: number;

export declare const kBluetoothSDPPDUIDServiceSearchRequest: number;

export declare const kBluetoothSDPPDUIDErrorResponse: number;

export declare const kBluetoothL2CAPTCICommandL2CA_ConfigResp: number;

export declare const kBluetoothL2CAPTCICommandL2CA_Ping: number;

export declare const kBluetoothL2CAPTCICommandL2CA_WriteData: number;

export declare const kBluetoothL2CAPTCICommandL2CA_EnableCLT: number;

export declare const kBluetoothL2CAPTCICommandL2CA_DisableCLT: number;

export declare const kBluetoothL2CAPTCICommandL2CA_DisconnectReq: number;

export declare const kBluetoothL2CAPTCICommandL2CA_ConnectReq: number;

export declare const kBluetoothL2CAPTCICommandReserved: number;

export declare const kBluetoothL2CAPTCIEventIDL2CA_ConfigInd: number;

export declare const kBluetoothHCITransportUSBProtocolCode: number;

export declare const IOBluetoothPDUServiceCenterAddressType: string;

export declare const kBluetoothHCITransportUSBSubClassCode: number;

export declare const kBluetoothHCITransportUSBClassCode: number;

export declare const kBluetoothHCIErrorMax: number;

export declare const kBluetoothHCIErrorConnectionFailedToBeEstablished: number;

export declare const kBluetoothHCIErrorDirectedAdvertisingTimeout: number;

export declare const kBluetoothHCIErrorHostBusyPairing: number;

export declare const kBluetoothHCIErrorSecureSimplePairingNotSupportedByHost: number;

export declare const kBluetoothHCIErrorExtendedInquiryResponseTooLarge: number;

export declare const kBluetoothHCIErrorParameterOutOfMandatoryRange: number;

export declare const kBluetoothHCIErrorInsufficientSecurity: number;

export declare const kBluetoothHCIErrorQoSUnacceptableParameter: number;

export declare const kBluetoothHCIErrorDifferentTransactionCollision: number;

export declare const kBluetoothHCIErrorHostRejectedUnacceptableDeviceAddress: number;

export declare const kBluetoothHCIErrorUnitKeyUsed: number;

export declare const kBluetoothHCIErrorLMPPDUNotAllowed: number;

export declare const kBluetoothHCIErrorRoleChangeNotAllowed: number;

export declare const kBluetoothHCIErrorUnsupportedLMPParameterValue: number;

export declare const kBluetoothHCIErrorUnspecifiedError: number;

export declare const kBluetoothDeviceClassMinorPhoneCordless: number;

export declare const kBluetoothHCIErrorSCOIntervalRejected: number;

export declare const kBluetoothHCIErrorUnknownLMPPDU: number;

export declare const kBluetoothDeviceClassMinorHealthUndefined: number;

export declare const kBluetoothHCIErrorPairingNotAllowed: number;

export declare const kBluetoothHCIErrorOtherEndTerminatedConnectionAboutToPowerOff: number;

export declare const kBluetoothHCIErrorOtherEndTerminatedConnectionLowResources: number;

export declare const kBluetoothHCIErrorInvalidHCICommandParameters: number;

export declare const kBluetoothHCIErrorUnsupportedFeatureOrParameterValue: number;

export declare const kBluetoothHCIErrorHostRejectedRemoteDeviceIsPersonal: number;

export declare const kBluetoothHCIErrorHostRejectedSecurityReasons: number;

export declare const kBluetoothHCIErrorACLConnectionAlreadyExists: number;

export declare const kBluetoothHCIErrorMaxNumberOfConnections: number;

export declare const kBluetoothHCIErrorNoConnection: number;

export declare const kBluetoothHCIErrorSuccess: number;

export declare const kBluetoothHCIEventMaskPageScanModeChange: number;

export declare const kBluetoothHCIEventMaskQoSViolation: number;

export declare const kBluetoothHCIEventMaskReadClockOffsetComplete: number;

export declare const kBluetoothHCIEventMaskMaxSlotsChange: number;

export declare const kBluetoothHCIEventMaskDataBufferOverflow: number;

export declare const kBluetoothHCIEventMaskLinkKeyRequest: number;

export declare const kBluetoothHCIEventMaskRoleChange: number;

export declare const kBluetoothHCIEventMaskFlushOccurred: number;

export declare const kBluetoothHCIEventMaskCommandStatus: number;

export declare const kBluetoothHCIEventMaskMasterLinkKeyComplete: number;

export declare const kBluetoothHCIEventMaskEncryptionChange: number;

export declare const kBluetoothHCIEventMaskInquiryComplete: number;

export declare const kBluetoothHCIEventVendorSpecific: number;

export declare const kBluetoothHCIEventLogoTesting: number;

export declare const kBluetoothHCIEventAMPTestEnd: number;

export declare const kBluetoothHCIEventShortRangeModeChangeComplete: number;

export declare const kBluetoothHCIEventNumberOfCompletedDataBlocks: number;

export declare const kBluetoothHCIEventPhysicalLinkLossEarlyWarning: number;

export declare const kBluetoothHCIErrorSCOOffsetRejected: number;

export declare const kBluetoothHCIEventPhysicalLinkComplete: number;

export declare const kBluetoothHCIErrorConnectionTimeout: number;

export declare const kBluetoothHCISubEventLEScanTimeout: number;

export declare const kBluetoothHCISubEventLEPeriodicAdvertisingReport: number;

export declare const kBluetoothHCISubEventLEExtendedAdvertising: number;

export declare const kBluetoothHCISubEventLEDirectAdvertisingReport: number;

export declare const kBluetoothHCISubEventLELongTermKeyRequest: number;

export declare const kBluetoothHCISubEventLEReadRemoteUsedFeaturesComplete: number;

export declare const kBluetoothHCISubEventLEAdvertisingReport: number;

export declare const kBluetoothHCIEventRemoteHostSupportedFeaturesNotification: number;

export declare const kBluetoothHCIEventLinkSupervisionTimeoutChanged: number;

export declare const kBluetoothHCIEventUserConfirmationRequest: number;

export declare const kBluetoothHCIEventEncryptionKeyRefreshComplete: number;

export declare const kBluetoothHCIEventExtendedInquiryResult: number;

export declare const kBluetoothHCIEventInquiryResultWithRSSI: number;

export declare const kBluetoothHCIEventFlowSpecificationComplete: number;

export declare const kBluetoothHCIEventPageScanModeChange: number;

export declare const kBluetoothHCIEventQoSViolation: number;

export declare const kBluetoothHCIEventEnhancedFlushComplete: number;

export declare const kBluetoothHCIEventDataBufferOverflow: number;

export declare const kBluetoothHCIEventLinkKeyNotification: number;

export declare const kBluetoothHCIEventLinkKeyRequest: number;

export declare const kBluetoothHCIEventRoleChange: number;

export declare const kBluetoothHCIEventCommandComplete: number;

export declare const kBluetoothHCIEventQoSSetupComplete: number;

export declare const kBluetoothHCIEventChangeConnectionLinkKeyComplete: number;

export declare const kBluetoothHCIEventEncryptionChange: number;

export declare const kBluetoothHCIEventDisconnectionComplete: number;

export declare const kBluetoothHCIEventConnectionRequest: number;

export declare const kBluetoothL2CAPTCICommandL2CA_ConfigReq: number;

export declare const kBluetoothAirModeTransparentData: number;

export declare const kBluetoothAirModeCVSD: number;

export declare const kBluetoothVoiceSettingAirCodingFormatALaw: number;

export declare const kBluetoothVoiceSettingAirCodingFormatMask: number;

export declare const kBluetoothVoiceSettingInputSampleSizeMask: number;

export declare const kBluetoothHCIDataPacketMaxDataSize: number;

export declare const kBluetoothHCIDataPacketHeaderSize: number;

export declare const kBluetoothHCIEventPacketMaxDataSize: number;

export declare const kBluetoothHCIEventPacketHeaderSize: number;

export declare const kBluetoothHCICommandPacketMaxDataSize: number;

export declare const kBluetoothHCICommandPacketHeaderSize: number;

export declare const kBluetoothHCILoopbackModeLocal: number;

export declare const kBluetoothHCICommandMax: number;

export declare const kBluetoothHCICommandGroupMax: number;

export declare const kBluetoothHCICommandGroupVendorSpecific: number;

export declare const kBluetoothHCICommandLEReadRFPathCompensation: number;

export declare const kBluetoothHCICommandLEReadPeriodicAdvertiserListSize: number;

export declare const kBluetoothHCICommandLERemoveDeviceFromPeriodicAdvertiserList: number;

export declare const kBluetoothHCICommandLEAddDeviceToPeriodicAdvertiserList: number;

export declare const kBluetoothHCICommandLEPeriodicAdvertisingTerminateSync: number;

export declare const kBluetoothHCICommandLEPeriodicAdvertisingCreateSyncCancel: number;

export declare const kBluetoothHCICommandLESetExtendedScanParameters: number;

export declare const kBluetoothHCICommandLESetPeriodicAdvertisingData: number;

export declare const kBluetoothHCICommandLEClearAdvertisingSets: number;

export declare const kBluetoothHCICommandLERemoveAdvertisingSet: number;

export declare const kBluetoothHCICommandLEReadNumberofSupportedAdvertisingSets: number;

export declare const kBluetoothHCICommandLEReadMaximumAdvertisingDataLength: number;

export declare const kBluetoothHCICommandLESetExtendedAdvertisingParameters: number;

export declare const kBluetoothHCICommandLESetAdvertisingSetRandomAddress: number;

export declare const kBluetoothHCICommandLEEnhancedTransmitterTest: number;

export declare const kBluetoothHCICommandLEEnhancedReceiverTest: number;

export declare const kBluetoothVoiceSettingInputSampleSize16Bit: number;

export declare const kBluetoothHCICommandLESetPhy: number;

export declare const kBluetoothHCICommandLEReadPhy: number;

export declare const kBluetoothHCICommandLESetResolvablePrivateAddressTimeout: number;

export declare const kBluetoothHCICommandLEAddDeviceToResolvingList: number;

export declare const kBluetoothHCICommandLEReadSuggestedDefaultDataLength: number;

export declare const kBluetoothHCICommandLESetDataLength: number;

export declare const kBluetoothHCICommandLERand: number;

export declare const kBluetoothHCICommandLEEncrypt: number;

export declare const kBluetoothHCICommandLEReadChannelMap: number;

export declare const kBluetoothHCIEventDisconnectionLogicalLinkComplete: number;

export declare const kBluetoothHCICommandLESetHostChannelClassification: number;

export declare const kBluetoothHCICommandLEConnectionUpdate: number;

export declare const kBluetoothHCICommandLEClearWhiteList: number;

export declare const kBluetoothHCICommandLESetScanResponseData: number;

export declare const kBluetoothHCICommandLESetAdvertisingData: number;

export declare const kBluetoothHCICommandLESetAdvertisingParameters: number;

export declare const kBluetoothHCICommandLESetRandomAddress: number;

export declare const kBluetoothHCICommandLEReadBufferSize: number;

export declare const kBluetoothHCICommandLESetEventMask: number;

export declare const kBluetoothHCICommandAMPTestEnd: number;

export declare const kBluetoothHCICommandCreateConnectionCancel: number;

export declare const kBluetoothHCICommandEnableAMPReceiverReports: number;

export declare const kBluetoothHCICommandEnableDeviceUnderTestMode: number;

export declare const kBluetoothHCICommandReadLoopbackMode: number;

export declare const kBluetoothHCICommandSetTriggeredClockCapture: number;

export declare const kBluetoothHCICommandReadLocalAMPInfo: number;

export declare const kBluetoothHCICommandReadClock: number;

export declare const kBluetoothHCICommandReadAFHMappings: number;

export declare const kBluetoothHCICommandReadRSSI: number;

export declare const kBluetoothHCICommandGroupStatus: number;

export declare const kBluetoothHCICommandReadCountryCode: number;

export declare const kBluetoothHCICommandReadLocalExtendedFeatures: number;

export declare const kBluetoothHCICommandReadLocalSupportedFeatures: number;

export declare const kBluetoothHCICommandGroupInformational: number;

export declare const kBluetoothHCICommandWriteExtendedInquiryLength: number;

export declare const kBluetoothHCICommandReadExtendedInquiryLength: number;

export declare const kBluetoothHCICommandReadLocalOOBExtendedData: number;

export declare const kBluetoothHCICommandReadAuthenticatedPayloadTimeout: number;

export declare const kBluetoothHCICommandWriteSecureConnectionsHostSupport: number;

export declare const kBluetoothHCICommandReadSecureConnectionsHostSupport: number;

export declare const kBluetoothHCICommandWriteSynchronizationTrainParameters: number;

export declare const kBluetoothHCICommandReadSynchronizationTrainParameters: number;

export declare const kBluetoothHCICommandSetMWSPATTERNConfiguration: number;

export declare const kBluetoothHCICommandSetMWSChannelParameters: number;

export declare const kBluetoothHCICommandReadLEHostSupported: number;

export declare const kBluetoothHCICommandWriteBestEffortFlushTimeout: number;

export declare const kBluetoothHCICommandReadBestEffortFlushTimeout: number;

export declare const kBluetoothHCICommandReadEnhancedTransmitPowerLevel: number;

export declare const kBluetoothHCICommandWriteFlowControlMode: number;

export declare const kBluetoothHCICommandReadFlowControlMode: number;

export declare const kBluetoothHCICommandReadLocationData: number;

export declare const kBluetoothHCICommandEnhancedFlush: number;

export declare const kBluetoothHCICommandSendKeypressNotification: number;

export declare const kBluetoothHCICommandWriteInquiryResponseTransmitPower: number;

export declare const kBluetoothLEMaxTXTimeDefault: number;

export declare const kBluetoothHCICommandReadInquiryResponseTransmitPower: number;

export declare const kBluetoothHCICommandReadLocalOOBData: number;

export declare const kBluetoothHCICommandReadExtendedInquiryResponse: number;

export declare const kBluetoothHCICommandWriteAFHChannelAssessmentMode: number;

export declare const kBluetoothHCICommandReadPageScanType: number;

export declare const kBluetoothHCICommandWriteInquiryScanType: number;

export declare const kBluetoothHCICommandSetAFHClassification: number;

export declare const kBluetoothHCICommandReadPageScanMode: number;

export declare const kBluetoothHCICommandReadLinkSupervisionTimeout: number;

export declare const kBluetoothHCICommandSetHostControllerToHostFlowControl: number;

export declare const kBluetoothHCICommandWriteSCOFlowControlEnable: number;

export declare const kBluetoothHCICommandReadSCOFlowControlEnable: number;

export declare const kBluetoothHCICommandWriteNumberOfBroadcastRetransmissions: number;

export declare const kBluetoothHCICommandReadNumberOfBroadcastRetransmissions: number;

export declare const kBluetoothHCICommandWriteAutomaticFlushTimeout: number;

export declare const kBluetoothHCICommandReadAutomaticFlushTimeout: number;

export declare const kBluetoothHCICommandWriteVoiceSetting: number;

export declare const kBluetoothHCICommandReadVoiceSetting: number;

export declare const kBluetoothHCICommandReadEncryptionMode: number;

export declare const kBluetoothHCICommandReadPageScanActivity: number;

export declare const kBluetoothHCICommandReadScanEnable: number;

export declare const kBluetoothHCICommandReadPageTimeout: number;

export declare const kBluetoothHCICommandWriteConnectionAcceptTimeout: number;

export declare const kBluetoothHCICommandReadConnectionAcceptTimeout: number;

export declare const kBluetoothHCICommandReadLocalName: number;

export declare const kBluetoothHCICommandCreateNewUnitKey: number;

export declare const kBluetoothHCICommandWritePINType: number;

export declare const kBluetoothHCICommandFlush: number;

export declare const kBluetoothHCICommandSetEventMask: number;

export declare const kBluetoothHCICommandRejectSniffRequest: number;

export declare const kBluetoothHCICommandAcceptSniffRequest: number;

export declare const kBluetoothHCIEventConnectionComplete: number;

export declare const kBluetoothHCICommandSniffSubrating: number;

export declare const kBluetoothHCICommandFlowSpecification: number;

export declare const kBluetoothHCICommandWriteLinkPolicySettings: number;

export declare const kBluetoothHCICommandReadLocalSupportedCodecs: number;

export declare const kBluetoothHCICommandReadLinkPolicySettings: number;

export declare const kBluetoothHCICommandSwitchRole: number;

export declare const kBluetoothHCICommandRoleDiscovery: number;

export declare const kBluetoothHCICommandExitParkMode: number;

export declare const kBluetoothHCICommandSniffMode: number;

export declare const kBluetoothDeviceClassMinorWearableGlasses: number;

export declare const kBluetoothHCICommandHoldMode: number;

export declare const kBluetoothHCICommandGroupLinkPolicy: number;

export declare const kBluetoothHCICommandSetConnectionlessSlaveBroadcast: number;

export declare const kBluetoothHCICommandRemoteOOBExtendedDataRequestReply: number;

export declare const kBluetoothHCICommandReceiveSynchronizationTrain: number;

export declare const kBluetoothHCICommandTruncatedPageCancel: number;

export declare const kBluetoothHCICommandTruncatedPage: number;

export declare const kBluetoothHCICommandEnhancedAcceptSynchronousConnectionRequest: number;

export declare const kBluetoothHCICommandEnhancedSetupSynchronousConnection: number;

export declare const kBluetoothHCICommandUserPasskeyRequestNegativeReply: number;

export declare const kBluetoothHCICommandUserConfirmationRequestNegativeReply: number;

export declare const kBluetoothHCICommandUserConfirmationRequestReply: number;

export declare const kBluetoothHCICommandIOCapabilityRequestReply: number;

export declare const kBluetoothHCICommandRemoteNameRequestCancel: number;

export declare const kBluetoothHCICommandReadClockOffset: number;

export declare const kBluetoothHCICommandRemoteNameRequest: number;

export declare const kBluetoothHCICommandMasterLinkKey: number;

export declare const kBluetoothHCICommandSetConnectionEncryption: number;

export declare const kBluetoothHCICommandLinkKeyRequestReply: number;

export declare const kBluetoothHCICommandAcceptConnectionRequest: number;

export declare const kBluetoothHCICommandAddSCOConnection: number;

export declare const kBluetoothHCICommandCreateConnection: number;

export declare const kBluetoothHCICommandExitPeriodicInquiryMode: number;

export declare const kBluetoothHCICommandPeriodicInquiryMode: number;

export declare const kBluetoothHCICommandInquiryCancel: number;

export declare const kBluetoothHCIErrorHostTimeout: number;

export declare const kBluetoothHCICommandGroupLinkControl: number;

export declare const kBluetoothHCICommandNoOp: number;

export declare const kBluetoothHCIOpCodeNoOp: number;

export declare const kBluetoothLESecurityManagerBonding: number;

export declare const kBluetoothLEMaxTXOctetsMax: number;

export declare const kBluetoothL2CAPQoSLatencyDefault: number;

export declare const kBluetoothL2CAPQoSPeakBandwidthDefault: number;

export declare const IOBluetoothHandsFreeIndicatorRoam: string;

export declare const kBluetoothL2CAPQoSTokenBucketSizeDefault: number;

export declare const kBluetoothL2CAPQoSTypeDefault: number;

export declare const kBluetoothL2CAPMTUSIG: number;

export declare const kBluetoothL2CAPMTUDefault: number;

export declare const kBluetoothL2CAPMTULowEnergyMax: number;

export declare const kBluetoothLETXOctetsDefault: number;

export declare const kBluetoothLETXOctetsMin: number;

export declare const kBluetoothLETXTimeMax: number;

export declare const kBluetoothLETXTimeMin: number;

export declare const kBluetoothL2CAPConfigurationOptionQoSLength: number;

export declare const kBluetoothL2CAPConfigurationOptionMTULength: number;

export declare const kBluetoothL2CAPInfoTypeMaxConnectionlessMTUSize: number;

export declare const kBluetoothL2CAPFlushTimeoutForever: number;

export declare const kBluetoothL2CAPChannelAMPTestManager: number;

export declare const kBluetoothL2CAPChannelMagicPairing: number;

export declare const kBluetoothL2CAPChannelLEAP: number;

export declare const kBluetoothL2CAPChannelReservedStart: number;

export declare const kBluetoothL2CAPChannelSecurityManager: number;

export declare const kBluetoothL2CAPChannelLESignalling: number;

export declare const kBluetoothHCIEventPhysicalLinkRecovery: number;

export declare const kBluetoothL2CAPChannelAttributeProtocol: number;

export declare const kBluetoothL2CAPChannelAMPManagerProtocol: number;

export declare const kBluetoothL2CAPChannelNull: number;

export declare const kBluetoothACLLogicalChannelL2CAPStart: number;

export declare const kBluetoothACLLogicalChannelL2CAPContinue: number;

export declare const kBluetoothL2CAPMaxPacketSize: number;

export declare const kBluetoothRoleRemainSlave: number;

export declare const kBluetoothRoleRemainPeripheral: number;

export declare const kBluetoothAllowRoleSwitch: number;

export declare const kBluetoothDontAllowRoleSwitch: number;

export declare const kBluetoothHCIErroneousDataReportingDisabled: number;

export declare const kBluetoothPageScanModeOptional3: number;

export declare const kBluetoothPageScanModeOptional2: number;

export declare const kBluetoothPageScanModeOptional1: number;

export declare const kBluetoothPageScanModeMandatory: number;

export declare const kBluetoothPageScanPeriodModeP2: number;

export declare const kBluetoothPageScanRepetitionModeR2: number;

export declare const kBluetoothPageScanRepetitionModeR0: number;

export declare const kBluetoothGeneralInquiryAccessCodeIndex: number;

export declare const kBluetoothSynchronousConnectionPacketTypeEnd: number;

export declare const kBluetoothSynchronousConnectionPacketTypeFutureUse: number;

export declare const kBluetoothSynchronousConnectionPacketType3EV5Omit: number;

export declare const kBluetoothSynchronousConnectionPacketType2EV5Omit: number;

export declare const kBluetoothSynchronousConnectionPacketType3EV3Omit: number;

export declare const kBluetoothSynchronousConnectionPacketType2EV3Omit: number;

export declare const kBluetoothSynchronousConnectionPacketTypeEV4: number;

export declare const kBluetoothSynchronousConnectionPacketTypeEV3: number;

export declare const kBluetoothSynchronousConnectionPacketTypeHV2: number;

export declare const kBluetoothSynchronousConnectionPacketTypeHV1: number;

export declare const kBluetoothPacketTypeEnd: number;

export declare const kBluetoothPacketTypeDM5: number;

export declare const kBluetoothPacketType2DH3Omit: number;

export declare const kBluetoothPacketTypeHV3: number;

export declare const kBluetoothPacketTypeHV1: number;

export declare const kBluetoothKeyTypeAuthenticatedCombinationP256: number;

export declare const kBluetoothKeyTypeUnauthenticatedCombinationP256: number;

export declare const kBluetoothKeyTypeChangedCombination: number;

export declare const kBluetoothKeyTypeDebugCombination: number;

export declare const kBluetoothKeyFlagTemporary: number;

export declare const kBluetoothKeyFlagSemiPermanent: number;

export declare const kBluetoothEncryptionEnableBREDRAESCCM: number;

export declare const kBluetoothEncryptionEnableLEAESCCM: number;

export declare const kBluetoothEncryptionEnableBREDRE0: number;

export declare const kBluetoothEncryptionEnableOn: number;

export declare const kBluetoothEncryptionEnableOff: number;

export declare const kBluetoothConnectionHandleSerialDeviceReserved: number;

export declare const kBluetoothSDPUUID16MCAPControlChannel: number;

export declare const kBluetoothSDPUUID16CMPT: number;

export declare const kBluetoothSDPUUID16HardcopyNotification: number;

export declare const kBluetoothSDPUUID16UPNP: number;

export declare const kBluetoothSDPUUID16BNEP: number;

export declare const kBluetoothSDPUUID16HTTP: number;

export declare const kBluetoothSDPUUID16FTP: number;

export declare const kBluetoothSDPUUID16IP: number;

export declare const kBluetoothSDPUUID16OBEX: number;

export declare const kBluetoothSDPUUID16ATT: number;

export declare const kBluetoothSDPUUID16TCSBIN: number;

export declare const kBluetoothSDPUUID16RFCOMM: number;

export declare const kBluetoothL2CAPPSMAACP: number;

export declare const kBluetoothL2CAPPSMDynamicStart: number;

export declare const kBluetoothL2CAPPSMReservedStart: number;

export declare const kBluetoothL2CAPPSMATT: number;

export declare const kBluetoothL2CAPPSMAVCTP_Browsing: number;

export declare const kBluetoothL2CAPPSMAVDTP: number;

export declare const kBluetoothL2CAPPSMAVCTP: number;

export declare const kBluetoothL2CAPPSMHIDControl: number;

export declare const kBluetoothL2CAPPSMTCS_BIN_Cordless: number;

export declare const kBluetoothL2CAPPSMTCS_BIN: number;

export declare const kBluetoothL2CAPPSMRFCOMM: number;

export declare const kBluetoothL2CAPPSMSDP: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceDigitalPen: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceCardReader: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceMouse: number;

export declare const kBluetoothGAPAppearanceGenericBarcodeScanner: number;

export declare const kBluetoothGAPAppearanceGenericMediaPlayer: number;

export declare const kBluetoothGAPAppearanceGenericRemoteControl: number;

export declare const kBluetoothGAPAppearanceGenericClock: number;

export declare const kBluetoothDeviceClassMinorEnd: number;

export declare const kBluetoothDeviceClassMinorAny: number;

export declare const kBluetoothDeviceClassMinorHealthPulseOximeter: number;

export declare const kBluetoothDeviceClassMinorToyGame: number;

export declare const kBluetoothDeviceClassMinorToyVehicle: number;

export declare const kBluetoothDeviceClassMinorWearablePager: number;

export declare const kBluetoothDeviceClassMinorImaging1Scanner: number;

export declare const kBluetoothDeviceClassMinorPeripheral2AnyPointing: number;

export declare const kBluetoothDeviceClassMinorPeripheral2Joystick: number;

export declare const kBluetoothDeviceClassMinorPeripheral1Keyboard: number;

export declare const kBluetoothDeviceClassMinorAudioGamingToy: number;

export declare const kBluetoothDeviceClassMinorAudioVideoMonitor: number;

export declare const kBluetoothDeviceClassMinorAudioVideoCamera: number;

export declare const kBluetoothDeviceClassMinorAudioHiFi: number;

export declare const kBluetoothHCIEventMaxSlotsChange: number;

export declare const kBluetoothDeviceClassMinorAudioCar: number;

export declare const kBluetoothDeviceClassMinorAudioPortable: number;

export declare const kBluetoothDeviceClassMinorAudioHeadphones: number;

export declare const kBluetoothDeviceClassMinorAudioMicrophone: number;

export declare const kBluetoothDeviceClassMinorAudioHandsFree: number;

export declare const kBluetoothDeviceClassMinorAudioHeadset: number;

export declare const kBluetoothDeviceClassMinorAudioUnclassified: number;

export declare const kBluetoothHCIErrorCoarseClockAdjustmentRejected: number;

export declare const kBluetoothDeviceClassMinorPhoneWiredModemOrVoiceGateway: number;

export declare const kBluetoothDeviceClassMinorPhoneSmartPhone: number;

export declare const kBluetoothLEMaxTXTimeMax: number;

export declare const kBluetoothDeviceClassMinorComputerWearable: number;

export declare const kBluetoothDeviceClassMinorComputerHandheld: number;

export declare const kBluetoothDeviceClassMinorComputerServer: number;

export declare const kBluetoothDeviceClassMinorComputerUnclassified: number;

export declare const kBluetoothDeviceClassMajorToy: number;

export declare const kBluetoothDeviceClassMajorWearable: number;

export declare const kBluetoothDeviceClassMajorLANAccessPoint: number;

export declare const kBluetoothDeviceClassMajorMiscellaneous: number;

export declare const kBluetoothServiceClassMajorAny: number;

export declare const kBluetoothServiceClassMajorInformation: number;

export declare const kBluetoothServiceClassMajorTelephony: number;

export declare const kBluetoothServiceClassMajorRendering: number;

export declare const kBluetoothServiceClassMajorPositioning: number;

export declare const kBluetoothServiceClassMajorReserved1: number;

export declare const kFTSListingSizeKey: interop.Object;

export declare const kBluetoothHCIEventSynchronousConnectionChanged: number;

export declare const kBluetoothDeviceClassMinorPhoneCommonISDNAccess: number;

export declare const kBluetoothGAPAppearanceGenericTag: number;

export declare const kBluetoothHCIEventMaskReadRemoteSupportedFeaturesComplete: number;

export declare const kBluetoothDeviceClassMinorPeripheral2HandheldScanner: number;

export declare const kBluetoothHCICommandReset: number;

export declare const kBluetoothHCICommandSetEventMaskPageTwo: number;

export declare const kBluetoothSDPErrorCodeInvalidPDUSize: number;

export declare const kBluetoothHCIEventAMPStartTest: number;

export declare const kBluetoothHCIErrorPageTimeout: number;

export declare const kBluetoothHCICommandStartSynchronizationTrain: number;

export declare const kBluetoothLETXOctetsMax: number;

export declare const kBluetoothKeyTypeRemoteUnit: number;

export declare const kBluetoothDeviceClassMinorHealthBloodPressureMonitor: number;

export declare const kBluetoothHCICommandLEReadLocalSupportedFeatures: number;

export declare const kBluetoothHCICommandLESetExtendedScanEnable: number;

export declare const kBluetoothL2CAPTCIEventIDL2CA_QoSViolationInd: number;

export declare const kBluetoothDeviceClassMinorAudioCamcorder: number;

export declare const kBluetoothHCICommandReadFailedContactCounter: number;

export declare const kBluetoothHCIErrorUnsupportedRemoteFeature: number;

export declare const kBluetoothHCIEventUserPasskeyRequest: number;

export declare const kBluetoothDeviceClassMinorImaging2Unclassified: number;

export declare const kBluetoothDeviceClassMinorPeripheral2DigitizerTablet: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceDigitizerTablet: number;

export declare const kBluetoothPacketTypeDH1: number;

export declare const kBluetoothGAPAppearanceGenericDisplay: number;

export declare const kBluetoothDeviceClassMinorAudioLoudspeaker: number;

export declare const kBluetoothDeviceClassMinorPeripheral2RemoteControl: number;

export declare const kBluetoothHCIErrorConnectionTerminatedDueToMICFailure: number;

export declare const kBluetoothServiceClassMajorLimitedDiscoverableMode: number;

export declare const kBluetoothHCIMaxCommandPacketSize: number;

export declare const kBluetoothHCIEventAuthenticationComplete: number;

export declare const kBluetoothHCICommandLEReadLocalP256PublicKey: number;

export declare const kBluetoothHCICommandLEReadAdvertisingChannelTxPower: number;

export declare const kBluetoothGAPAppearanceGenericCycling: number;

export declare const kBluetoothDeviceClassMinorImaging1Display: number;

export declare const kBluetoothHCICommandAcceptSynchronousConnectionRequest: number;

export declare const kBluetoothHCICommandLEReadResolvingListSize: number;

export declare const kBluetoothHCICommandLEReadSupportedStates: number;

export declare const kBluetoothHCICommandWriteEncryptionMode: number;

export declare const kBluetoothGAPAppearanceGenericHumanInterfaceDevice: number;

export declare const kBluetoothHCICommandLEReadMaximumDataLength: number;

export declare const kBluetoothHCICommandReadPINType: number;

export declare const kBluetoothL2CAPPacketHeaderSize: number;

export declare const kBluetoothL2CAPChannelLEAS: number;

export declare const kBluetoothHCIEventRemoteOOBDataRequest: number;

export declare const kBluetoothDeviceClassMajorPeripheral: number;

export declare const kBluetoothL2CAPFlushTimeoutImmediate: number;

export declare const kBluetoothHCICommandReadClassOfDevice: number;

export declare const kBluetoothHCICommandLESetDefaultPhy: number;

export declare const kBluetoothGAPAppearanceGenericGlucoseMeter: number;

export declare const kBluetoothHCICommandHostBufferSize: number;

export declare const kBluetoothPacketTypeDV: number;

export declare const kBluetoothSDPPDUIDServiceAttributeRequest: number;

export declare const kBluetoothHCIErrorLMPErrorTransactionCollision: number;

export declare const kBluetoothSDPUUID16MCAPDataChannel: number;

export declare const kBluetoothDeviceClassMinorImaging1Camera: number;

export declare const kBluetoothHCICommandLERemoveDeviceFromResolvingList: number;

export declare const kBluetoothHCICommandReadLogicalLinkAcceptTimeout: number;

export declare const kBluetoothDeviceClassMinorHealthDataDisplay: number;

export declare const kBluetoothHCIEventLogicalLinkComplete: number;

export declare const kBluetoothHCIErrorInvalidLMPParameters: number;

export declare const kBluetoothHCICommandLELongTermKeyRequestReply: number;

export declare const kBluetoothSynchronousConnectionPacketTypeEV5: number;

export declare const kBluetoothLimitedInquiryAccessCodeIndex: number;

export declare const kBluetoothSDPDataElementTypeNil: number;

export declare const kBluetoothHCICommandWritePageScanMode: number;

export declare const kBluetoothHCICommandWriteAuthenticationEnable: number;

export declare const kBluetoothHCICommandWritePageTimeout: number;

export declare const kBluetoothSynchronousConnectionPacketTypeNone: number;

export declare const kBluetoothHCIEventAMPStatusChange: number;

export declare const kBluetoothL2CAPChannelDynamicEnd: number;

export declare const kBluetoothHCIEventReturnLinkKeys: number;

export declare const kBluetoothPacketType3DH1Omit: number;

export declare const kBluetoothL2CAPQoSTokenRateDefault: number;

export declare const kBluetoothServiceClassMajorAudio: number;

export declare const kBluetoothHCICommandLESetScanEnable: number;

export declare const kBluetoothL2CAPTCICommandL2CA_Reserved1: number;

export declare const kBluetoothGAPAppearanceGenericComputer: number;

export declare const kBluetoothDeviceClassMajorNone: number;

export declare const kBluetoothHCIEventIOCapabilityResponse: number;

export declare const kBluetoothDeviceClassMinorAudioReserved1: number;

export declare const kBluetoothSDPErrorCodeInvalidSDPVersion: number;

export declare const kBluetoothHCICommandGroupHostController: number;

export declare const kBluetoothDeviceClassMinorAudioVideoConferencing: number;

export declare const kBluetoothHCIErrorHardwareFailure: number;

export declare const kBluetoothHCICommandUserPasskeyRequestReply: number;

export declare const kBluetoothDeviceClassMajorAudio: number;

export declare const kBluetoothHCIEventMaskModeChange: number;

export declare const kBluetoothHCIErrorHostRejectedLimitedResources: number;

export declare const kBluetoothL2CAPChannelReservedEnd: number;

export declare const kBluetoothL2CAPPSMD2D: number;

export declare const kBluetoothSDPErrorCodeInvalidRequestSyntax: number;

export declare const kBluetoothL2CAPTCICommandL2CA_GroupCreate: number;

export declare const kBluetoothHCIEventRemoteNameRequestComplete: number;

export declare const kBluetoothHCICommandSetMWSSignaling: number;

export declare const kBluetoothHCIEventMaskRemoteNameRequestComplete: number;

export declare const kBluetoothSDPUUID16HardcopyDataChannel: number;

export declare const kBluetoothHCIErrorMACConnectionFailed: number;

export declare const kBluetoothHCIErrorLMPResponseTimeout: number;

export declare const kBluetoothHCISubEventLEConnectionUpdateComplete: number;

export declare const kBluetoothHCIEventLEMetaEvent: number;

export declare const kBluetoothHCICommandLETestEnd: number;

export declare const kBluetoothL2CAPTCICommandL2CA_GroupClose: number;

export declare const kBluetoothDeviceClassMinorPhoneCellular: number;

export declare const kBluetoothHCICommandReadLocalVersionInformation: number;

export declare const kBluetoothVoiceSettingAirCodingFormatCVSD: number;

export declare const kBluetoothLimitedInquiryAccessCodeLAPValue: number;

export declare const kBluetoothHCICommandRemoteOOBDataRequestNegativeReply: number;

export declare const kBluetoothHCICommandReadDataBlockSize: number;

export declare const kBluetoothHCICommandParkMode: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceBarcodeScanner: number;

export declare const kBluetoothHCICommandLEWriteRFPathCompensation: number;

export declare const kBluetoothHCICommandReadStoredLinkKey: number;

export declare const kOBEXHeaderIDKeyUnknown4ByteQuantity: interop.Object;

export declare const kBluetoothDeviceClassMinorPeripheral1Pointing: number;

export declare const kBluetoothHCICommandReadRemoteSupportedFeatures: number;

export declare const kBluetoothHCILoopbackModeRemote: number;

export declare const kBluetoothHCIEventPINCodeRequest: number;

export declare const kBluetoothHCICommandWriteLocationData: number;

export declare const kBluetoothDeviceClassMinorComputerPalmSized: number;

export declare const kBluetoothSDPUUID16L2CAP: number;

export declare const kBluetoothL2CAPChannelMagnet: number;

export declare const kBluetoothHCICommandReadInquiryScanType: number;

export declare const kOBEXHeaderIDKeyConnectionID: interop.Object;

export declare const kBluetoothHCISubEventLEConnectionComplete: number;

export declare const kBluetoothHCICommandLERemoteConnectionParameterRequestReply: number;

export declare const kBluetoothHCIEventModeChange: number;

export declare const kBluetoothHCICommandWritePageScanType: number;

export declare const kBluetoothHCIEventSniffSubrating: number;

export declare const kBluetoothDeviceClassMinorWearableWristWatch: number;

export declare const kBluetoothHCICommandRemoteOOBDataRequestReply: number;

export declare const kBluetoothHCIEventMaskPageScanRepetitionModeChange: number;

export declare const kBluetoothHCICommandSetMWSTransportLayer: number;

export declare const kBluetoothDeviceClassMajorComputer: number;

export declare const kBluetoothHCICommandLEExtendedCreateConnection: number;

export declare const kBluetoothHCIEventSynchronousConnectionComplete: number;

export declare const kBluetoothL2CAPFlushTimeoutEnd: number;

export declare const kBluetoothHCICommandRefreshEncryptionKey: number;

export declare const kBluetoothHCICommandReadExtendedPageTimeout: number;

export declare const kBluetoothPageScanPeriodModeP0: number;

export declare const kBluetoothL2CAPPSMHIDInterrupt: number;

export declare const kBluetoothHCIEventMaskInquiryResult: number;

export declare const kBluetoothHCICommandAuthenticationRequested: number;

export declare const kBluetoothAirModeULawLog: number;

export declare const kBluetoothHCIErrorInstantPassed: number;

export declare const kBluetoothHCIEventMasterLinkKeyComplete: number;

export declare const kBluetoothHCICommandReadDeviceAddress: number;

export declare const kBluetoothVoiceSettingInputDataFormatMask: number;

export declare const kBluetoothHCIEventMaskReturnLinkKeys: number;

export declare const kBluetoothPacketTypeAUX: number;

export declare const kBluetoothGAPAppearanceGenericRunningWalkingSensor: number;

export declare const kBluetoothHCICommandGroupTesting: number;

export declare const kBluetoothHCICommandPINCodeRequestReply: number;

export declare const kBluetoothHCISubEventLEChannelSelectionAlgorithm: number;

export declare const kBluetoothHCIEventMaskDisconnectionComplete: number;

export declare const kBluetoothHCICommandReadHoldModeActivity: number;

export declare const kBluetoothPacketType3DM5Omit: number;

export declare const kBluetoothGeneralInquiryAccessCodeLAPValue: number;

export declare const kBluetoothHCICommandLECreateConnection: number;

export declare const kBluetoothDeviceClassMinorPeripheral2DigitalPen: number;

export declare const kBluetoothHCICommandReadDefaultLinkPolicySettings: number;

export declare const kBluetoothHCIErroneousDataReportingReservedEnd: number;

export declare const kBluetoothVoiceSettingAirCodingFormatTransparentData: number;

export declare const kBluetoothHCICommandWriteLinkSupervisionTimeout: number;

export declare const kBluetoothHCICommandLESetExtendedScanResponseData: number;

export declare const kBluetoothHCIErrorKeyMissing: number;

export declare const kBluetoothDeviceClassMajorImaging: number;

export declare const kBluetoothHCIEventInquiryResult: number;

export declare const kBluetoothHCICommandSetConnectionlessSlaveBroadcastData: number;

export declare const kBluetoothHCIEventMaskLoopbackCommand: number;

export declare const kBluetoothLEMaxTXOctetsMin: number;

export declare const kBluetoothDeviceNameMaxLength: number;

export declare const kBluetoothVoiceSettingInputDataFormat1sComplement: number;

export declare const kBluetoothHCICommandWriteRemoteAMPASSOC: number;

export declare const kBluetoothHCICommandWriteClassOfDevice: number;

export declare const kBluetoothPacketTypeDM3: number;

export declare const kBluetoothHCICommandReadPageScanPeriodMode: number;

export declare const kBluetoothHCICommandHostNumberOfCompletedPackets: number;

export declare const kBluetoothVoiceSettingPCMBitPositionMask: number;

export declare const kBluetoothHCICommandLERemoveDeviceFromWhiteList: number;

export declare const IOBluetoothHandsFreeCallNumber: string;

export declare const kBluetoothSDPUUID16SDP: number;

export declare const kBluetoothHCICommandLESetAdvertiseEnable: number;

export declare const kBluetoothHCICommandWritePageScanPeriodMode: number;

export declare const kBluetoothHCICommandWriteHoldModeActivity: number;

export declare const kBluetoothHCISubEventLEScanRequestReceived: number;

export declare const kBluetoothHCICommandLEClearResolvingList: number;

export declare const kBluetoothHCICommandChangeLocalName: number;

export declare const kBluetoothKeyTypeLocalUnit: number;

export declare const kBluetoothHCICommandReadInquiryScanActivity: number;

export declare const kBluetoothPacketTypeHV2: number;

export declare const kBluetoothHCICommandGetMWSTransportLayerConfiguration: number;

export declare const kBluetoothHCICommandReadLocalSupportedCommands: number;

export declare const kBluetoothHCIEventCommandStatus: number;

export declare const kBluetoothHCICommandWriteSimplePairingMode: number;

export declare const IOBluetoothHandsFreeCallIndex: string;

export declare const kBluetoothHCICommandWriteScanEnable: number;

export declare const kBluetoothL2CAPTCICommandL2CA_Reserved2: number;

export declare const kBluetoothSDPErrorCodeInvalidContinuationState: number;

export declare const kBluetoothL2CAPFlushTimeoutDefault: number;

export declare const kBluetoothAirModeALawLog: number;

export declare const kBluetoothSynchronousConnectionPacketTypeAll: number;

export declare const kBluetoothHCICommandIOCapabilityRequestNegativeReply: number;

export declare const kBluetoothRoleBecomeCentral: number;

export declare const kBluetoothHCIErrorOtherEndTerminatedConnectionUserEnded: number;

export declare const kBluetoothHCIErrorQoSNotSupported: number;

export declare const kBluetoothL2CAPConfigurationOptionRetransmissionAndFlowControlLength: number;

export declare const kBluetoothHCIEventMaskNumberOfCompletedPackets: number;

export declare const kBluetoothSDPErrorCodeInsufficientResources: number;

export declare const kBluetoothHCICommandSetConnectionlessPeripheralBroadcast: number;

export declare const kBluetoothL2CAPPSMBNEP: number;

export declare const kBluetoothHCICommandLEPeriodicAdvertisingCreateSync: number;

export declare const kFTSProgressBytesTotalKey: interop.Object;

export declare const kBluetoothL2CAPPSMDynamicEnd: number;

export declare const kBluetoothHCIErrorAuthenticationFailure: number;

export declare const kBluetoothDeviceClassMinorPeripheral2Unclassified: number;

export declare const kBluetoothL2CAPTCIEventIDL2CA_TimeOutInd: number;

export declare const kBluetoothHCICommandWriteDefaultErroneousDataReporting: number;

export declare const kBluetoothHCICommandSetExternalFrameConfiguration: number;

export declare const kBluetoothHCIErrorPairingWithUnitKeyNotSupported: number;

export declare const kBluetoothHCICommandWriteSimplePairingDebugMode: number;

export declare const kBluetoothHCIErrorPowerIsOFF: number;

export declare const kBluetoothDeviceClassMinorHealthThermometer: number;

export declare const kBluetoothL2CAPTCIEventIDL2CA_ConnectInd: number;

export declare const kBluetoothHCICommandWriteLogicalLinkAcceptTimeout: number;

export declare const kBluetoothDeviceClassMinorAudioSetTopBox: number;

export declare const kBluetoothHCIEventConnectionPacketType: number;

export declare const kOBEXHeaderIDKeyLength: interop.Object;

export declare const kBluetoothDeviceClassMinorAudioVideoDisplayAndLoudspeaker: number;

export declare const kFTSProgressPercentageKey: interop.Object;

export declare const kBluetoothDeviceClassMinorWearableJacket: number;

export declare const IOBluetoothPDUServicCenterAddress: string;

export declare const kBluetoothL2CAPQoSDelayVariationDefault: number;

export declare const kBluetoothHCIEventNumberOfCompletedPackets: number;

export declare const kBluetoothHCICommandLESetScanParameters: number;

export declare const kBluetoothPacketType2DH1Omit: number;

export declare const kBluetoothHCIErroneousDataReportingReservedStart: number;

export declare const kBluetoothHCIErrorRepeatedAttempts: number;

export declare const kBluetoothHCICommandLEReadTransmitPower: number;

export declare const kBluetoothL2CAPChannelConnectionLessData: number;

export declare const kBluetoothLESecurityManagerReservedEnd: number;

export declare const kBluetoothHCICommandRejectConnectionRequest: number;

export declare const kBluetoothServiceClassMajorObjectTransfer: number;

export declare const kBluetoothHCIEventMaskLinkKeyNotification: number;

export declare const kBluetoothVoiceSettingInputDataFormatSignMagnitude: number;

export declare const kBluetoothACLLogicalChannelReserved: number;

export declare const kBluetoothHCIEventMaskCommandComplete: number;

export declare const kBluetoothHCICommandWriteLEHostSupported: number;

export declare const kBluetoothHCIEventLoopbackCommand: number;

export declare const kBluetoothHCICommandLESetExtendedAdvertisingData: number;

export declare const kBluetoothHCICommandSetEventFilter: number;

export declare const kBluetoothHCICommandLEReadLocalResolvableAddress: number;

export declare const kBluetoothDeviceClassMinorHealthHeartRateMonitor: number;

export declare const kBluetoothHCICommandWritePageScanActivity: number;

export declare const kBluetoothHCIEventMaskAuthenticationComplete: number;

export declare const kBluetoothPageScanRepetitionModeR1: number;

export declare const kBluetoothHCICommandSetupSynchronousConnection: number;

export declare const kBluetoothPacketType3DH3Omit: number;

export declare const kBluetoothL2CAPChannelEnd: number;

export declare const kBluetoothHCILoopbackModeOff: number;

export declare const kBluetoothHCIEventChannelSelected: number;

export declare const kBluetoothSDPUUID16Base: number;

export declare const kBluetoothHCIEventMaskPINCodeRequest: number;

export declare const kBluetoothHCICommandDisconnect: number;

export declare const kBluetoothDeviceClassMinorPeripheral2GesturalInputDevice: number;

export declare const kBluetoothVoiceSettingInputCodingLinearInputCoding: number;

export declare const kOBEXHeaderIDKeyAuthorizationChallenge: interop.Object;

export declare const kBluetoothHCIEventMaskReadRemoteVersionInformationComplete: number;

export declare const kBluetoothHCIEventMaskNone: number;

export declare const kBluetoothPacketTypeReserved1: number;

export declare const kBluetoothDeviceClassMinorImaging1Printer: number;

export declare const kBluetoothSDPDataElementTypeBoolean: number;

export declare const kBluetoothHCIEventMaskHardwareError: number;

export declare const IOBluetoothPDUEncoding: string;

export declare const kBluetoothHCICommandWriteStoredLinkKey: number;

export declare const kBluetoothGAPAppearanceGenericWatch: number;

export declare const kBluetoothSynchronousConnectionPacketTypeHV3: number;

export declare const kBluetoothHCICommandRejectSynchronousConnectionRequest: number;

export declare const kBluetoothVoiceSettingInputDataFormatUnsigned: number;

export declare const kBluetoothHCISubEventLEAdvertisingSetTerminated: number;

export declare const kBluetoothHCICommandLESetPeriodicAdvertisingParameters: number;

export declare const kBluetoothHCICommandGroupNoOp: number;

export declare const kBluetoothHCICommandLEWriteSuggestedDefaultDataLength: number;

export declare const kBluetoothHCICommandDeleteReservedLTADDR: number;

export declare const kBluetoothKeyTypeUnauthenticatedCombination: number;

export declare const kBluetoothL2CAPPSMNone: number;

export declare const kBluetoothDeviceClassMinorAudioVCR: number;

export declare const kBluetoothHCISubEventLEDataLengthChange: number;

export declare const kBluetoothDeviceClassMinorToyController: number;

export declare const kBluetoothHCIErrorReservedSlotViolation: number;

export declare const kBluetoothHCICommandReadLMPHandle: number;

export declare const kBluetoothDeviceClassMinorComputerDesktopWorkstation: number;

export declare const kBluetoothHCIEventMaskConnectionRequest: number;

export declare const kBluetoothSDPUUID16WSP: number;

export declare const kBluetoothHCIErrorUnacceptableConnectionInterval: number;

export declare const IOBluetoothL2CAPChannelPublishedNotification: string;

export declare const kFTSProgressPrecentageKey: interop.Object;

export declare const kBluetoothLEMaxTXOctetsDefault: number;

export declare const kBluetoothHCISubEventLEPhyUpdateComplete: number;

export declare const kBluetoothL2CAPTCICommandL2CA_GroupMembership: number;

export declare const kBluetoothDeviceClassMinorComputerLaptop: number;

export declare const kBluetoothHCIEventHardwareError: number;

export declare const kBluetoothHCIEventReadRemoteExtendedFeaturesComplete: number;

export declare const kBluetoothHCICommandChangeConnectionLinkKey: number;

export declare const kBluetoothHCICommandReadRemoteExtendedFeatures: number;

export declare const kOBEXHeaderIDKeyName: interop.Object;

export declare const kBluetoothHCICommandDeleteStoredLinkKey: number;

export declare const kBluetoothSDPErrorCodeInvalidServiceRecordHandle: number;

export declare const kBluetoothDeviceClassMinorToyDollActionFigure: number;

export declare const kBluetoothHCIEventKeypressNotification: number;

export declare const kBluetoothPacketType2DH5Omit: number;

export declare const kBluetoothDeviceClassMinorWearableHelmet: number;

export declare const kBluetoothHCICommandWriteCurrentIACLAP: number;

export declare const kBluetoothLimitedInquiryAccessCodeEnd: number;

export declare const kBluetoothL2CAPTCICommandL2CA_GetInfo: number;

export declare const kBluetoothHCICommandGroupLowEnergy: number;

export declare const kBluetoothLETXTimeDefault: number;

export declare const kBluetoothPacketTypeDH5: number;

export declare const kBluetoothHCICommandExitSniffMode: number;

export declare const kBluetoothLEMaxTXTimeMin: number;

export declare const kBluetoothHCICommandWriteInquiryScanActivity: number;

export declare const kBluetoothDeviceClassMinorAudioReserved2: number;

export declare const kBluetoothDeviceClassMinorPeripheral1Combo: number;

export declare const kBluetoothHCICommandAMPTest: number;

export declare const kBluetoothHCIEventUserPasskeyNotification: number;

export declare const kBluetoothHCIEventAMPReceiverReport: number;

export declare const kBluetoothRoleBecomeMaster: number;

export declare const kBluetoothL2CAPPSMReservedEnd: number;

export declare const kBluetoothHCICommandInquiry: number;

export declare const kBluetoothHCICommandReadCurrentIACLAP: number;

export declare const kBluetoothHCIEventMaskQoSSetupComplete: number;

export declare const kBluetoothDeviceClassMinorHealthGlucoseMeter: number;

export declare const kBluetoothHCICommandReadSimplePairingMode: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceJoystick: number;

export declare const kBluetoothHCICommandLESetExtendedAdvertisingEnableCommand: number;

export declare const kBluetoothHCISubEventLEPeriodicAdvertisingSyncLost: number;

export declare const kBluetoothL2CAPPSMUID_C_Plane: number;

export declare const kBluetoothHCIErroneousDataReportingEnabled: number;

export declare const kBluetoothHCIEventReadRemoteSupportedFeaturesComplete: number;

export declare const kBluetoothDeviceClassMajorEnd: number;

export declare const kBluetoothL2CAPMTUMaximum: number;

export declare const kBluetoothHCISubEventLEEnhancedConnectionComplete: number;

export declare const kBluetoothHCICommandSetConnectionlessPeripheralBroadcastReceive: number;

export declare const kBluetoothHCIEventSimplePairingComplete: number;

export declare const kBluetoothGAPAppearanceGenericKeyring: number;

export declare const kBluetoothSDPUUID16TCP: number;

export declare const kBluetoothDeviceClassMinorHealthScale: number;

export declare const kBluetoothL2CAPMTUStart: number;

export declare const kBluetoothHCIErrorEncryptionModeNotAcceptable: number;

export declare const kBluetoothHCICommandResetFailedContactCounter: number;

export declare const kBluetoothDeviceClassMinorToyRobot: number;

export declare const kBluetoothHCICommandReadLocalAMPASSOC: number;

export declare const kOBEXHeaderIDKeyUserDefined: interop.Object;

export declare const kBluetoothSDPPDUIDServiceSearchAttributeResponse: number;

export declare const kBluetoothL2CAPQoSFlagsDefault: number;

export declare const kBluetoothSDPUUID16HIDP: number;

export declare const kBluetoothHCICommandWriteExtendedPageTimeout: number;

export declare const kBluetoothPageScanPeriodModeP1: number;

export declare const kBluetoothHCICommandLEGenerateDHKey: number;

export declare const kBluetoothHCIEventMaskConnectionPacketTypeChanged: number;

export declare const kBluetoothHCIErrorConnectionTerminatedByLocalHost: number;

export declare const kBluetoothSDPDataElementTypeReservedEnd: number;

export declare const kBluetoothLESecurityManagerReservedStart: number;

export declare const kBluetoothHCIEventReadRemoteVersionInformationComplete: number;

export declare const kBluetoothHCICommandWriteExtendedInquiryResponse: number;

export declare const kBluetoothServiceClassMajorReserved2: number;

export declare const kBluetoothHCIEventPageScanRepetitionModeChange: number;

export declare const kBluetoothSDPUUID16AVCTP: number;

export declare const kBluetoothHCIErrorMemoryFull: number;

export declare const kBluetoothDeviceClassMinorPeripheral2SensingDevice: number;

export declare const kBluetoothHCICommandWriteInquiryMode: number;

export declare const kBluetoothHCICommandPINCodeRequestNegativeReply: number;

export declare const kBluetoothDeviceClassMinorPhoneUnclassified: number;

export declare const kBluetoothSDPDataElementTypeDataElementAlternative: number;

export declare const kBluetoothHCIErrorChannelClassificationNotSupported: number;

export declare const kBluetoothGAPAppearanceHumanInterfaceDeviceGamepad: number;

export declare const kBluetoothHCIEventInquiryComplete: number;

export declare const kBluetoothHCICommandReadAuthenticationEnable: number;

export declare const kBluetoothHCICommandGetLinkQuality: number;

export declare const kBluetoothL2CAPMTUMinimum: number;

export declare const kBluetoothHCICommandWriteLoopbackMode: number;

export declare const kBluetoothL2CAPTCICommandL2CA_GroupAddMember: number;

export declare const kBluetoothSDPDataElementTypeSignedInt: number;

export declare const kBluetoothHCIErrorRoleSwitchFailed: number;

export declare const kBluetoothHCICommandLESetAddressResolutionEnable: number;

export declare const kBluetoothHCICommandLEClearPeriodicAdvertiserList: number;

export declare const kBluetoothSDPUUID16TCSAT: number;

export declare const kBluetoothGAPAppearanceGenericPhone: number;

export declare const kBluetoothHCISubEventLEPeriodicAdvertisingSyncEstablished: number;

export declare const kBluetoothL2CAPChannelSignalling: number;

export declare const kMaximumNumberOfInquiryAccessCodes: number;

export declare const kBluetoothGAPAppearanceGenericHeartrateSensor: number;

export declare const kBluetoothHCIMaxEventPacketSize: number;

export declare const IOBluetoothHandsFreeIndicatorCallHeld: string;

export declare const kBluetoothDeviceClassMinorNone: number;

export declare const kBluetoothServiceClassMajorEnd: number;

export declare const kBluetoothHCISubEventLEGenerateDHKeyComplete: number;

export declare const kBluetoothHCICommandReadBufferSize: number;

export declare const kBluetoothHCIEventFlushOccurred: number;

export declare const kBluetoothHCICommandSetConnectionlessSlaveBroadcastReceive: number;

export declare const kBluetoothHCICommandWriteDefaultLinkPolicySettings: number;

export declare const kBluetoothGAPAppearanceUnknown: number;

export declare const kBluetoothConnectionHandleNone: number;

export declare const kOBEXHeaderIDKeyWho: interop.Object;

export declare const kBluetoothHCIErrorCommandDisallowed: number;

export declare const kBluetoothL2CAPFlushTimeoutUseExisting: number;

export declare const kBluetoothHCIErrorMaxNumberOfSCOConnectionsToADevice: number;

export declare const kBluetoothHCICommandLELongTermKeyRequestNegativeReply: number;

export declare const kBluetoothHCICommandWriteAuthenticatedPayloadTimeout: number;

export declare const kBluetoothHCIErrorUnknownHCICommand: number;

export declare const kBluetoothHCIEventMaskAll: number;

export declare const kBluetoothHCICommandLESetPrivacyMode: number;

export declare const kBluetoothDeviceClassMajorHealth: number;

export declare const kBluetoothKeyTypeCombination: number;

export declare const kBluetoothServiceClassMajorNetworking: number;

export declare const kBluetoothHCIMaxDataPacketSize: number;

export declare const kBluetoothPacketTypeDH3: number;

export declare const kBluetoothHCIEventDisconnectionPhysicalLinkComplete: number;

export declare const kBluetoothHCICommandLECreateConnectionCancel: number;

export declare const kBluetoothVoiceSettingAirCodingFormatULaw: number;

export declare const kBluetoothHCISubEventLEReadLocalP256PublicKeyComplete: number;

export declare const kBluetoothSDPUUID16HardcopyControlChannel: number;

export declare const kBluetoothHCICommandLERemoteConnectionParameterRequestNegativeReply: number;

export declare const kBluetoothHCIEventIOCapabilityRequest: number;

export declare const kBluetoothHCICommandSetMWSScanFrequencyTable: number;

export declare const kBluetoothVoiceSettingInputSampleSize8Bit: number;

export declare const kBluetoothDeviceClassMinorPeripheral2CardReader: number;

export declare const kBluetoothHCIEventFlowSpecModifyComplete: number;

export declare const kBluetoothHCIEventMaskConnectionComplete: number;

export declare const kBluetoothSDPUUID16UDP: number;

export declare const kBluetoothHCICommandLEAddDeviceToWhiteList: number;

export declare const kBluetoothHCICommandReadAFHChannelAssessmentMode: number;

export declare const kBluetoothGAPAppearanceGenericEyeGlasses: number;

export declare const kBluetoothHCICommandLEReceiverTest: number;

export declare const kBluetoothSDPUUID16AVDTP: number;

export declare const kBluetoothHCIErrorConnectionRejectedDueToNoSuitableChannelFound: number;

export declare const kBluetoothGAPAppearanceGenericThermometer: number;

export declare const kBluetoothPacketTypeDM1: number;

export declare const kBluetoothHCICommandShortRangeMode: number;

export declare const kBluetoothHCICommandLEReadRemoteUsedFeatures: number;

export declare const kBluetoothHCICommandLEReadPeerResolvableAddress: number;

export declare const kBluetoothHCICommandLinkKeyRequestNegativeReply: number;

export declare const kBluetoothHCICommandReadInquiryMode: number;

export declare const kOBEXHeaderIDKeyTimeISO: interop.Object;

export declare const kBluetoothHCISubEventLERemoteConnectionParameterRequest: number;

export declare const kBluetoothSDPErrorCodeReservedEnd: number;

export declare const IOBluetoothHandsFreeCallType: string;

export declare const IOBluetoothHandsFreeCallStatus: string;

export declare const kBluetoothHCIErrorControllerBusy: number;

export declare const kBluetoothHCIErrorRoleSwitchPending: number;

export declare const kBluetoothHCICommandReadTransmitPowerLevel: number;

export declare const kBluetoothACLLogicalChannelLMP: number;

export declare const kBluetoothHCICommandLEReadWhiteListSize: number;

export declare const kBluetoothL2CAPTCICommandL2CA_ReadData: number;

export declare const kBluetoothServiceClassMajorNone: number;

export declare const kBluetoothL2CAPTCICommandL2CA_ConnectResp: number;

export declare const kBluetoothDeviceClassMajorPhone: number;

export declare const kBluetoothL2CAPTCIEventIDL2CA_DisconnectInd: number;

export declare const kBluetoothGAPAppearanceGenericBloodPressure: number;

export declare const kFTSProgressEstimatedTimeKey: interop.Object;

export declare const kBluetoothHCICommandReadRemoteVersionInformation: number;

export declare const kBluetoothSDPErrorCodeReservedStart: number;

export declare const kBluetoothL2CAPConfigurationOptionFlushTimeoutLength: number;

export declare const kBluetoothL2CAPTCIEventIDReserved: number;

export declare const kBluetoothHCIEventReadClockOffsetComplete: number;

export declare const kBluetoothVoiceSettingInputDataFormat2sComplement: number;

export declare const kBluetoothSDPDataElementTypeUnsignedInt: number;

export declare const OBEXConnectFlagValues: {
  FlagNone: 0,
  FlagSupportMultipleItLMPConnections: 1,
  Flag1Reserved: 2,
  Flag2Reserved: 4,
  Flag3Reserved: 8,
  Flag4Reserved: 16,
  Flag5Reserved: 32,
  Flag6Reserved: 64,
  Flag7Reserved: 128,
};

export declare const BluetoothRFCOMMParityType: {
  No: 0,
  Odd: 1,
  Even: 2,
  Max: 3,
};

export declare const BluetoothHCIEncryptionModes: {
  Disabled: 0,
  OnlyForPointToPointPackets: 1,
  ForBothPointToPointAndBroadcastPackets: 2,
};

export declare const BluetoothCompanyIdentifers: {
  IdentiferEricssonTechnologyLicensing: 0,
  IdentiferNokiaMobilePhones: 1,
  IdentiferIntel: 2,
  IdentiferIBM: 3,
  IdentiferToshiba: 4,
  Identifer3Com: 5,
  IdentiferMicrosoft: 6,
  IdentiferLucent: 7,
  IdentiferMotorola: 8,
  IdentiferInfineonTechnologiesAG: 9,
  IdentiferCambridgeSiliconRadio: 10,
  IdentiferSiliconWave: 11,
  IdentiferDigianswerAS: 12,
  IdentiferTexasInstruments: 13,
  IdentiferParthusTechnologies: 14,
  IdentiferBroadcom: 15,
  IdentiferMitelSemiconductor: 16,
  IdentiferWidcomm: 17,
  IdentiferZeevo: 18,
  IdentiferAtmel: 19,
  IdentiferMistubishiElectric: 20,
  IdentiferRTXTelecom: 21,
  IdentiferKCTechnology: 22,
  IdentiferNewlogic: 23,
  IdentiferTransilica: 24,
  IdentiferRohdeandSchwarz: 25,
  IdentiferTTPCom: 26,
  IdentiferSigniaTechnologies: 27,
  IdentiferConexantSystems: 28,
  IdentiferQualcomm: 29,
  IdentiferInventel: 30,
  IdentiferAVMBerlin: 31,
  IdentiferBandspeed: 32,
  IdentiferMansella: 33,
  IdentiferNEC: 34,
  IdentiferWavePlusTechnology: 35,
  IdentiferAlcatel: 36,
  IdentiferPhilipsSemiconductor: 37,
  IdentiferCTechnologies: 38,
  IdentiferOpenInterface: 39,
  IdentiferRFCMicroDevices: 40,
  IdentiferHitachi: 41,
  IdentiferSymbolTechnologies: 42,
  IdentiferTenovis: 43,
  IdentiferMacronixInternational: 44,
  IdentiferGCTSemiconductor: 45,
  IdentiferNorwoodSystems: 46,
  IdentiferMewTelTechnology: 47,
  IdentiferSTMicroelectronics: 48,
  IdentiferSynopsys: 49,
  IdentiferRedMCommunications: 50,
  IdentiferCommil: 51,
  IdentiferCATC: 52,
  IdentiferEclipse: 53,
  IdentiferRenesasTechnology: 54,
  IdentiferMobilian: 55,
  IdentiferTerax: 56,
  IdentiferIntegratedSystemSolution: 57,
  IdentiferMatsushitaElectricIndustrial: 58,
  IdentiferGennum: 59,
  IdentiferResearchInMotion: 60,
  IdentiferIPextreme: 61,
  IdentiferSystemsAndChips: 62,
  IdentiferBluetoothSIG: 63,
  IdentiferSeikoEpson: 64,
  IdentiferIntegratedSiliconSolution: 65,
  IdentiferCONWISETechnology: 66,
  IdentiferParrotSA: 67,
  IdentiferSocketCommunications: 68,
  IdentiferAtherosCommunications: 69,
  IdentiferMediaTek: 70,
  IdentiferBluegiga: 71,
  IdentiferMarvellTechnologyGroup: 72,
  Identifer3DSP: 73,
  IdentiferAccelSemiconductor: 74,
  IdentiferContinentialAutomotiveSystems: 75,
  IdentiferApple: 76,
  IdentiferStaccatoCommunications: 77,
  IdentiferAvagoTechnologies: 78,
  IdentiferAPT: 79,
  IdentiferSiRFTechnology: 80,
  IdentiferTZeroTechnologies: 81,
  IdentiferJandM: 82,
  IdentiferFree2Move: 83,
  Identifer3DiJoy: 84,
  IdentiferPlantronics: 85,
  IdentiferSonyEricssonMobileCommunications: 86,
  IdentiferHarmonInternational: 87,
  IdentiferVisio: 88,
  IdentiferNordicSemiconductor: 89,
  IdentiferEMMicroElectronicMarin: 90,
  IdentiferRalinkTechnology: 91,
  IdentiferBelkinInternational: 92,
  IdentiferRealtekSemiconductor: 93,
  IdentiferStonestreetOne: 94,
  IdentiferWicentric: 95,
  IdentiferRivieraWaves: 96,
  IdentiferRDAMicroelectronics: 97,
  IdentiferGibsonGuitars: 98,
  IdentiferMiCommand: 99,
  IdentiferBandXIInternational: 100,
  IdentiferHewlettPackard: 101,
  Identifer9SolutionsOy: 102,
  IdentiferGNNetcom: 103,
  IdentiferGeneralMotors: 104,
  IdentiferAAndDEngineering: 105,
  IdentiferMindTree: 106,
  IdentiferPolarElectroOY: 107,
  IdentiferBeautifulEnterprise: 108,
  IdentiferBriarTek: 109,
  IdentiferSummitDataCommunications: 110,
  IdentiferSoundID: 111,
  IdentiferMonster: 112,
  IdentiferConnectBlueAB: 113,
  IdentiferShangHaiSuperSmartElectronics: 114,
  IdentiferGroupSense: 115,
  IdentiferZomm: 116,
  IdentiferSamsungElectronics: 117,
  IdentiferCreativeTechnology: 118,
  IdentiferLairdTechnologies: 119,
  IdentiferNike: 120,
  IdentiferLessWire: 121,
  IdentiferMStarTechnologies: 122,
  IdentiferHanlynnTechnologies: 123,
  IdentiferAAndRCambridge: 124,
  IdentiferSeersTechnology: 125,
  IdentiferSportsTrackingTechnologies: 126,
  IdentiferAutonetMobile: 127,
  IdentiferDeLormePublishingCompany: 128,
  IdentiferWuXiVimicro: 129,
  IdentiferSennheiserCommunications: 130,
  IdentiferTimeKeepingSystems: 131,
  IdentiferLudusHelsinki: 132,
  IdentiferBlueRadios: 133,
  IdentiferEquinux: 134,
  IdentiferGarminInternational: 135,
  IdentiferEcotest: 136,
  IdentiferGNResound: 137,
  IdentiferJawbone: 138,
  IdentiferTopconPositioningSystems: 139,
  IdentiferGimbal: 140,
  IdentiferZscanSoftware: 141,
  IdentiferQuintic: 142,
  IdentiferTelitWirelessSolutions: 143,
  IdentiferFunaiElectric: 144,
  IdentiferAdvancedPANMOBILSystems: 145,
  IdentiferThinkOptics: 146,
  IdentiferUniversalElectriconics: 147,
  IdentiferAirohaTechnology: 148,
  IdentiferNECLightning: 149,
  IdentiferODMTechnology: 150,
  IdentiferConnecteDevice: 151,
  IdentiferZero1TV: 152,
  IdentiferITechDynamicGlobalDistribution: 153,
  IdentiferAlpwise: 154,
  IdentiferJiangsuToppowerAutomotiveElectronics: 155,
  IdentiferColorfy: 156,
  IdentiferGeoforce: 157,
  IdentiferBose: 158,
  IdentiferSuuntoOy: 159,
  IdentiferKensingtonComputerProductsGroup: 160,
  IdentiferSRMedizinelektronik: 161,
  IdentiferVertu: 162,
  IdentiferMetaWatch: 163,
  IdentiferLinak: 164,
  IdentiferOTLDynamics: 165,
  IdentiferPandaOcean: 166,
  IdentiferVisteon: 167,
  IdentiferARPDevicesUnlimited: 168,
  IdentiferMagnetiMarelli: 169,
  IdentiferCaenRFID: 170,
  IdentiferIngenieurSystemgruppeZahn: 171,
  IdentiferGreenThrottleGames: 172,
  IdentiferPeterSystemtechnik: 173,
  IdentiferOmegawave: 174,
  IdentiferCinetix: 175,
  IdentiferPassifSemiconductor: 176,
  IdentiferSarisCyclingGroup: 177,
  IdentiferBekey: 178,
  IdentiferClarinoxTechnologies: 179,
  IdentiferBDETechnology: 180,
  IdentiferSwirlNetworks: 181,
  IdentiferMesoInternational: 182,
  IdentiferTreLab: 183,
  IdentiferQualcommInnovationCenter: 184,
  IdentiferJohnsonControls: 185,
  IdentiferStarkeyLaboratories: 186,
  IdentiferSPowerElectronics: 187,
  IdentiferAceSensor: 188,
  IdentiferAplix: 189,
  IdentiferAAMPofAmerica: 190,
  IdentiferStalmartTechnology: 191,
  IdentiferAMICCOMElectronics: 192,
  IdentiferShenzhenExcelsecuDataTechnology: 193,
  IdentiferGeneq: 194,
  IdentiferAdidas: 195,
  IdentiferLGElectronics: 196,
  IdentiferOnsetComputer: 197,
  IdentiferSelflyBV: 198,
  IdentiferQuupa: 199,
  IdentiferGeLo: 200,
  IdentiferEvluma: 201,
  IdentiferMC10: 202,
  IdentiferBinauricSE: 203,
  IdentiferBeatsElectronics: 204,
  IdentiferMicrochipTechnology: 205,
  IdentiferElgatoSystems: 206,
  IdentiferARCHOS: 207,
  IdentiferDexcom: 208,
  IdentiferPolarElectroEurope: 209,
  IdentiferDialogSemiconductor: 210,
  IdentiferTaixingbangTechnology: 211,
  IdentiferKawantech: 212,
  IdentiferAustcoCommunicationsSystems: 213,
  IdentiferTimexGroup: 214,
  IdentiferQualcommTechnologies: 215,
  IdentiferQualcommConnectedExperiences: 216,
  IdentiferVoyetraTurtleBeach: 217,
  IdentifertxtrGMBH: 218,
  IdentiferBiosentronics: 219,
  IdentiferProctorAndGamble: 220,
  IdentiferHosiden: 221,
  IdentiferMusik: 222,
  IdentiferMisfitWearables: 223,
  IdentiferGoogle: 224,
  IdentiferDanlers: 225,
  IdentiferSemilink: 226,
  IdentiferInMusicBrands: 227,
  IdentiferLSResearch: 228,
  IdentiferEdenSoftwareConsultants: 229,
  IdentiferFreshtemp: 230,
  IdentiferKSTechnologies: 231,
  IdentiferACTSTechnologies: 232,
  IdentiferVtrackSystems: 233,
  IdentiferNielsenKellerman: 234,
  IdentiferServerTechnology: 235,
  IdentiferBioResearchAssociates: 236,
  IdentiferJollyLogic: 237,
  IdentiferAboveAverageOutcomes: 238,
  IdentiferBitsplitters: 239,
  IdentiferPayPal: 240,
  IdentiferWitronTechnology: 241,
  IdentiferMorseProject: 242,
  IdentiferKentDisplays: 243,
  IdentiferNautilus: 244,
  IdentiferSmartifier: 245,
  IdentiferElcometer: 246,
  IdentiferVSNTechnologies: 247,
  IdentiferAceUni: 248,
  IdentiferStickNFind: 249,
  IdentiferCrystalCode: 250,
  IdentiferKOUKAMM: 251,
  IdentiferDelphi: 252,
  IdentiferValenceTech: 253,
  IdentiferStanleyBlackAndDecker: 254,
  IdentiferTypeProducts: 255,
  IdentiferTomTomInternational: 256,
  IdentiferFuGoo: 257,
  IdentiferKeiser: 258,
  IdentiferBangAndOlufson: 259,
  IdentiferPLUSLocationSystems: 260,
  IdentiferUbiquitousComputingTechnology: 261,
  IdentiferInnovativeYachtterSolutions: 262,
  IdentiferWilliamDemantHolding: 263,
  IdentiferInteropIdentifier: 65535,
};

export declare const IOBluetoothHandsFreePDUMessageStatus: {
  RecUnread: 0,
  RecRead: 1,
  StoUnsent: 2,
  StoSent: 3,
  All: 4,
};

export declare const IOBluetoothHandsFreeDeviceFeatures: {
  None: 0,
  ECAndOrNRFunction: 1,
  ThreeWayCalling: 2,
  CLIPresentation: 4,
  VoiceRecognition: 8,
  RemoteVolumeControl: 16,
  EnhancedCallStatus: 32,
  EnhancedCallControl: 64,
  CodecNegotiation: 128,
};

export declare const FTSFileType: {
  Folder: 1,
  File: 2,
};

export declare const OBEXOpCodeSessionValues: {
  CreateSession: 0,
  CloseSession: 1,
  SuspendSession: 2,
  ResumeSession: 3,
  SetTimeout: 4,
};

export declare const OBEXRealmValues: {
  ASCII: 0,
  ISO88591: 1,
  ISO88592: 2,
  ISO88593: 3,
  ISO88594: 4,
  ISO88595: 5,
  ISO88596: 6,
  ISO88597: 7,
  ISO88598: 8,
  ISO88599: 9,
  UNICODE: 255,
};

export declare const OBEXHeaderIdentifiers: {
  Name: 1,
  Description: 5,
  ReservedRangeStart: 16,
  ReservedRangeEnd: 47,
  UserDefinedRangeStart: 48,
  UserDefinedRangeEnd: 63,
  Type: 66,
  TimeISO: 68,
  Target: 70,
  HTTP: 71,
  Body: 72,
  EndOfBody: 73,
  Who: 74,
  AppParameters: 76,
  AuthorizationChallenge: 77,
  AuthorizationResponse: 78,
  ObjectClass: 79,
  Count: 192,
  Length: 195,
  Time4Byte: 196,
  ConnectionID: 203,
  OBEX13WANUUID: 80,
  OBEX13ObjectClass: 81,
  OBEX13SessionParameters: 82,
  OBEX13SessionSequenceNumber: 147,
  OBEX13CreatorID: 207,
};

export declare const OBEXErrorCodes: {
  ErrorRangeMin: -21850,
  ErrorRangeMax: -21899,
  Success: 0,
  GeneralError: -21850,
  NoResourcesError: -21851,
  UnsupportedError: -21852,
  InternalError: -21853,
  BadArgumentError: -21854,
  TimeoutError: -21855,
  BadRequestError: -21856,
  CancelledError: -21857,
  ForbiddenError: -21858,
  UnauthorizedError: -21859,
  NotAcceptableError: -21860,
  ConflictError: -21861,
  MethodNotAllowedError: -21862,
  NotFoundError: -21863,
  NotImplementedError: -21864,
  PreconditionFailedError: -21865,
  SessionBusyError: -21875,
  SessionNotConnectedError: -21876,
  SessionBadRequestError: -21877,
  SessionBadResponseError: -21878,
  SessionNoTransportError: -21879,
  SessionTransportDiedError: -21880,
  SessionTimeoutError: -21881,
  SessionAlreadyConnectedError: -21882,
};

export declare const IOBluetoothL2CAPChannelEventType: {
  Data: 1,
  OpenComplete: 2,
  Closed: 3,
  Reconfigured: 4,
  WriteComplete: 5,
  QueueSpaceAvailable: 6,
};

export declare const SDPServiceClasses: {
  ServiceDiscoveryServer: 4096,
  BrowseGroupDescriptor: 4097,
  PublicBrowseGroup: 4098,
  SerialPort: 4353,
  LANAccessUsingPPP: 4354,
  DialupNetworking: 4355,
  IrMCSync: 4356,
  OBEXObjectPush: 4357,
  OBEXFileTransfer: 4358,
  IrMCSyncCommand: 4359,
  Headset: 4360,
  CordlessTelephony: 4361,
  AudioSource: 4362,
  AudioSink: 4363,
  AVRemoteControlTarget: 4364,
  AdvancedAudioDistribution: 4365,
  AVRemoteControl: 4366,
  AVRemoteControlController: 4367,
  Intercom: 4368,
  Fax: 4369,
  HeadsetAudioGateway: 4370,
  WAP: 4371,
  WAPClient: 4372,
  PANU: 4373,
  NAP: 4374,
  GN: 4375,
  DirectPrinting: 4376,
  ReferencePrinting: 4377,
  Imaging: 4378,
  ImagingResponder: 4379,
  ImagingAutomaticArchive: 4380,
  ImagingReferencedObjects: 4381,
  HandsFree: 4382,
  HandsFreeAudioGateway: 4383,
  DirectPrintingReferenceObjectsService: 4384,
  ReflectedUI: 4385,
  BasicPrinting: 4386,
  PrintingStatus: 4387,
  HumanInterfaceDeviceService: 4388,
  HardcopyCableReplacement: 4389,
  HCR_Print: 4390,
  HCR_Scan: 4391,
  CommonISDNAccess: 4392,
  VideoConferencingGW: 4393,
  UDI_MT: 4394,
  UDI_TA: 4395,
  AudioVideo: 4396,
  SIM_Access: 4397,
  PhonebookAccess_PCE: 4398,
  PhonebookAccess_PSE: 4399,
  PhonebookAccess: 4400,
  Headset_HS: 4401,
  MessageAccessServer: 4402,
  MessageNotificationServer: 4403,
  MessageAccessProfile: 4404,
  GlobalNavigationSatelliteSystem: 4405,
  GlobalNavigationSatelliteSystemServer: 4406,
  PnPInformation: 4608,
  GenericNetworking: 4609,
  GenericFileTransfer: 4610,
  GenericAudio: 4611,
  GenericTelephony: 4612,
  VideoSource: 4867,
  VideoSink: 4868,
  VideoDistribution: 4869,
  HealthDevice: 5120,
  HealthDeviceSource: 5121,
  HealthDeviceSink: 5122,
  GATT: 6145,
};

export declare const IOBluetoothSMSMode: {
  PDU: 0,
  Text: 1,
};

export declare const OBEXPutFlagValues: {
  FlagNone: 0,
  FlagGoToParentDirFirst: 1,
  FlagDontCreateDirectory: 2,
  Flag2Reserved: 4,
  Flag3Reserved: 8,
  Flag4Reserved: 16,
  Flag5Reserved: 32,
  Flag6Reserved: 64,
  Flag7Reserved: 128,
};

export declare const OBEXTransportEventTypes: {
  DataReceived: 1147237441,
  Status: 1400136020,
};

export declare const BluetoothL2CAPConnectionStatus: {
  NoInfoAvailable: 0,
  AuthenticationPending: 1,
  AuthorizationPending: 2,
};

export declare const BluetoothHCIPageScanModes: {
  MandatoryPageScanMode: 0,
  OptionalPageScanMode1: 1,
  OptionalPageScanMode2: 2,
  OptionalPageScanMode3: 3,
};

export declare const OBEXSessionParameterTags: {
  DeviceAddress: 0,
  Nonce: 1,
  SessionID: 2,
  NextSequenceNumber: 3,
  Timeout: 4,
  SessionOpcode: 5,
};

export declare const BluetoothHCIHoldModeActivityStates: {
  MaintainCurrentPowerState: 0,
  SuspendPageScan: 1,
  SuspendInquiryScan: 2,
  SuspendPeriodicInquiries: 3,
};

export declare const BluetoothL2CAPInformationType: {
  ConnectionlessMTU: 1,
  ExtendedFeatures: 2,
  FixedChannelsSupported: 3,
};

export declare const IOBluetoothUserNotificationChannelDirection: {
  Any: 0,
  Incoming: 1,
  Outgoing: 2,
};

export declare const IOBluetoothDeviceSearchTypesBits: {
  Classic: 1,
  LE: 2,
};

export declare const IOBluetoothDeviceSearchOptionsBits: {
  None: 0,
  AlwaysStartInquiry: 1,
  DiscardCachedResults: 2,
};

export declare const BluetoothLEAdvertisingType: {
  ConnectableUndirected: 0,
  ConnectableDirected: 1,
  DiscoverableUndirected: 2,
  NonConnectableUndirected: 3,
  ScanResponse: 4,
};

export declare const BluetoothLEScanDuplicateFilter: {
  Disable: 0,
  Enable: 1,
};

export declare const BluetoothLEScan: {
  Disable: 0,
  Enable: 1,
};

export declare const BluetoothLEAddressType: {
  Public: 0,
  Random: 1,
};

export declare const BluetoothLEScanType: {
  Passive: 0,
  Active: 1,
};

export declare const BluetoothRFCOMMLineStatus: {
  No: 0,
  Overrun: 1,
  Parity: 2,
  Framing: 3,
};

export declare const BluetoothHCIPowerState: {
  ON: 1,
  OFF: 0,
  Unintialized: 255,
};

export declare const BluetoothOOBDataPresenceValues: {
  Not: 0,
  FromRemoteDevice: 1,
};

export declare const BluetoothSimplePairingDebugModes: {
  Disabled: 0,
  Enabled: 1,
};

export declare const BluetoothHCIInquiryScanTypes: {
  Standard: 0,
  Interlaced: 1,
  ReservedStart: 2,
  ReservedEnd: 255,
};

export declare const BluetoothHCIFECRequiredValues: {
  kBluetoothHCIFECRequired: 0,
  Not: 1,
};

export declare const BluetoothTransportTypes: {
  USB: 1,
  PCCard: 2,
  PCICard: 3,
  UART: 4,
  PCIe: 5,
};

export declare const BluetoothHCIAuthentionEnableModes: {
  Disabled: 0,
  Enabled: 1,
};

export declare const BluetoothHCIGeneralFlowControlStates: {
  HostControllerToHostFlowControlOff: 0,
  HCIACLDataPacketsOnHCISCODataPacketsOff: 1,
  HCIACLDataPacketsOffHCISCODataPacketsOn: 2,
  HCIACLDataPacketsOnHCISCODataPacketsOn: 3,
};

export declare const BluetoothHCIPageScanPeriodModes: {
  P0: 0,
  P1: 1,
  P2: 2,
};

export declare const BluetoothHCIDeleteStoredLinkKeyFlags: {
  KeyForSpecifiedDeviceOnly: 0,
  AllStoredLinkKeys: 1,
};

export declare const BluetoothHCIRoles: {
  Central: 0,
  Peripheral: 1,
  Master: 0,
  Slave: 1,
};

export declare const BluetoothHCIConnectionModes: {
  ActiveMode: 0,
  HoldMode: 1,
  SniffMode: 2,
  ParkMode: 3,
  ModeReservedForFutureUse: 4,
};

export declare const BluetoothAMPDisconnectPhysicalLinkResponseStatus: {
  Success: 0,
  InvalidControllerID: 1,
  NoPhysicalLink: 2,
};

export declare const BluetoothAMPCreatePhysicalLinkResponseStatus: {
  Success: 0,
  InvalidControllerID: 1,
  UnableToStartLinkCreation: 2,
  CollisionOccurred: 3,
  AMPDisconnectedPhysicalLinkRequestReceived: 4,
  PhysicalLinkAlreadyExists: 5,
  SecurityViolation: 6,
};

export declare const BluetoothAMPGetAssocResponseStatus: {
  Success: 0,
  InvalidControllerID: 1,
};

export declare const BluetoothAMPGetInfoResponseStatus: {
  Success: 0,
  InvalidControllerID: 1,
};

export declare const BluetoothLinkTypes: {
  SCOConnection: 0,
  ACLConnection: 1,
  ESCOConnection: 2,
  LinkTypeNone: 255,
};

export declare const BluetoothAMPDiscoverResponseControllerStatus: {
  PoweredDown: 0,
  BluetoothOnly: 1,
  NoCapacity: 2,
  LowCapacity: 3,
  MediumCapacity: 4,
  HighCapacity: 5,
  FullCapacity: 6,
};

export declare const BluetoothAMPCommandRejectReason: {
  kBluetoothAMPManagerCommandRejectReasonCommandNotRecognized: 0,
};

export declare const BluetoothLESecurityManagerKeypressNotificationType: {
  PasskeyEntryStarted: 0,
  PasskeyDigitEntered: 1,
  PasskeyDigitErased: 2,
  PasskeyCleared: 3,
  PasskeyEntryCompleted: 4,
  ReservedStart: 5,
  ReservedEnd: 255,
};

export declare const BluetoothLESecurityManagerOOBData: {
  AuthenticationDataNotPresent: 0,
  AuthenticationDataPresent: 1,
  DataReservedStart: 2,
  DataReservedEnd: 255,
};

export declare const BluetoothLESecurityManagerUserOutputCapability: {
  No: 1,
  Numeric: 2,
};

export declare const BluetoothLESecurityManagerUserInputCapability: {
  NoInput: 1,
  YesNo: 2,
  Keyboard: 3,
};

export declare const BluetoothLESecurityManagerCommandCode: {
  Reserved: 0,
  PairingRequest: 1,
  PairingResponse: 2,
  PairingConfirm: 3,
  PairingRandom: 4,
  PairingFailed: 5,
  EncryptionInfo: 6,
  MasterIdentification: 7,
  IdentityInfo: 8,
  IdentityAddressInfo: 9,
  SigningInfo: 10,
  SecurityRequest: 11,
  PairingPublicKey: 12,
  PairingDHKeyCheck: 13,
  PairingKeypressNotification: 14,
  ReservedStart: 15,
  ReservedEnd: 255,
};

export declare const BluetoothL2CAPSupervisoryFuctionType: {
  ReceiverReady: 0,
  Reject: 1,
  ReceiverNotReady: 2,
  SelectiveReject: 3,
};

export declare const BluetoothL2CAPQoSType: {
  NoTraffic: 0,
  BestEffort: 1,
  Guaranteed: 2,
};

export declare const BluetoothL2CAPInformationResult: {
  Success: 0,
  NotSupported: 1,
};

export declare const BluetoothL2CAPConfigurationRetransmissionAndFlowControlFlags: {
  BasicL2CAPModeFlag: 0,
  RetransmissionModeFlag: 1,
  FlowControlModeFlag: 2,
  EnhancedRetransmissionMode: 3,
  StreamingMode: 4,
};

export declare const BluetoothL2CAPConfigurationOption: {
  MTU: 1,
  FlushTimeout: 2,
  QoS: 3,
  RetransmissionAndFlowControl: 4,
  FrameCheckSequence: 5,
  ExtendedFlowSpecification: 6,
  ExtendedWindowSize: 7,
};

export declare const BluetoothL2CAPConfigurationResult: {
  Success: 0,
  UnacceptableParams: 1,
  Rejected: 2,
  UnknownOptions: 3,
};

export declare const BluetoothL2CAPCommandCode: {
  Reserved: 0,
  CommandReject: 1,
  ConnectionRequest: 2,
  ConnectionResponse: 3,
  ConfigureRequest: 4,
  ConfigureResponse: 5,
  DisconnectionRequest: 6,
  DisconnectionResponse: 7,
  EchoRequest: 8,
  EchoResponse: 9,
  InformationRequest: 10,
  InformationResponse: 11,
  CreateChannelRequest: 12,
  CreateChannelResponse: 13,
  MoveChannelRequest: 14,
  MoveChannelResponse: 15,
  MoveChannelConfirmation: 16,
  MoveChannelConfirmationResponse: 17,
  ConnectionParameterUpdateRequest: 18,
  ConnectionParameterUpdateResponse: 19,
  LECreditBasedConnectionRequest: 20,
  LECreditBasedConnectionResponse: 21,
  LEFlowControlCredit: 22,
};

export declare const BluetoothHCIPageScanTypes: {
  Standard: 0,
  Interlaced: 1,
  ReservedStart: 2,
  ReservedEnd: 255,
};

export declare const BluetoothLESecurityManagerIOCapability: {
  DisplayOnly: 0,
  DisplayYesNo: 1,
  KeyboardOnly: 2,
  NoInputNoOutput: 3,
  KeyboardDisplay: 4,
  ReservedStart: 5,
  ReservedEnd: 255,
};

export declare const BluetoothKeypressNotificationTypes: {
  EntryStarted: 0,
  DigitEntered: 1,
  DigitErased: 2,
  Cleared: 3,
  EntryCompleted: 4,
};

export declare const BluetoothHCITransmitReadPowerLevelTypes: {
  Current: 0,
  Maximum: 1,
};

export declare const BluetoothLEFeatureBits: {
  LEEncryption: 1,
  ConnectionParamsRequestProcedure: 2,
  ExtendedRejectIndication: 4,
  PeripheralInitiatedFeaturesExchange: 8,
  LEPing: 16,
  LEDataPacketLengthExtension: 32,
  LLPrivacy: 64,
  ExtendedScannerFilterPolicies: 128,
  SlaveInitiatedFeaturesExchange: 8,
};

export declare const BluetoothL2CAPCommandRejectReason: {
  CommandNotUnderstood: 0,
  SignallingMTUExceeded: 1,
  InvalidCIDInRequest: 2,
};

export declare const BluetoothLEScanFilter: {
  None: 0,
  Safelist: 1,
  Whitelist: 1,
};

export declare const BluetoothLMPVersions: {
  Specification1_0b: 0,
  Specification1_1: 1,
  Specification1_2: 2,
  Specification2_0EDR: 3,
  Specification2_1EDR: 4,
  Specification3_0HS: 5,
  Specification4_0: 6,
  Specification4_1: 7,
  Specification4_2: 8,
  Specification5_0: 9,
  Specification5_1: 10,
  Specification5_2: 11,
};

export declare const BluetoothHCIAFHChannelAssessmentModes: {
  Disabled: 0,
  Enabled: 1,
};

export declare const BluetoothLEConnectionInterval: {
  Min: 6,
  Max: 3200,
};

export declare const BluetoothAMPManagerCode: {
  Reserved: 0,
  AMPCommandReject: 1,
  AMPDiscoverRequest: 2,
  AMPDiscoverResponse: 3,
  AMPChangeNotify: 4,
  AMPChangeResponse: 5,
  AMPGetInfoRequest: 6,
  AMPGetInfoResponse: 7,
  AMPGetAssocRequest: 8,
  AMPGetAssocResponse: 9,
  AMPCreatePhysicalLinkRequest: 10,
  AMPCreatePhysicalLinkResponse: 11,
  AMPDisconnectPhysicalLinkRequest: 12,
  AMPDisconnectPhysicalLinkResponse: 13,
};

export declare const BluetoothHCISCOFlowControlStates: {
  Disabled: 0,
  Enabled: 1,
};

export declare const BluetoothHCIPageScanEnableStates: {
  NoScansEnabled: 0,
  InquiryScanEnabledPageScanDisabled: 1,
  InquiryScanDisabledPageScanEnabled: 2,
  InquiryScanEnabledPageScanEnabled: 3,
};

export declare const BluetoothAuthenticationRequirementsValues: {
  NotRequired: 0,
  Required: 1,
  NotRequiredNoBonding: 0,
  RequiredNoBonding: 1,
  NotRequiredDedicatedBonding: 2,
  RequiredDedicatedBonding: 3,
  NotRequiredGeneralBonding: 4,
  RequiredGeneralBonding: 5,
};

export declare const OBEXNonceFlagValues: {
  FlagNone: 0,
  FlagSendUserIDInResponse: 1,
  FlagAccessModeReadOnly: 2,
  Flag2Reserved: 4,
  Flag3Reserved: 8,
  Flag4Reserved: 16,
  Flag5Reserved: 32,
  Flag6Reserved: 64,
  Flag7Reserved: 128,
};

export declare const IOBluetoothHandsFreeSMSSupport: {
  Phase2: 1,
  Phase2p: 2,
  ManufactureSpecific: 4,
};

export declare const BluetoothHCIInquiryModes: {
  Standard: 0,
  WithRSSI: 1,
  WithRSSIOrExtendedInquiryResultFormat: 2,
};

export declare const BluetoothHCIVersions: {
  Specification1_0b: 0,
  Specification1_1: 1,
  Specification1_2: 2,
  Specification2_0EDR: 3,
  Specification2_1EDR: 4,
  Specification3_0HS: 5,
  Specification4_0: 6,
  Specification4_1: 7,
  Specification4_2: 8,
  Specification5_0: 9,
  Specification5_1: 10,
  Specification5_2: 11,
  Specification5_3: 12,
};

export declare const BluetoothL2CAPConnectionResult: {
  Successful: 0,
  Pending: 1,
  RefusedPSMNotSupported: 2,
  RefusedSecurityBlock: 3,
  RefusedNoResources: 4,
  RefusedReserved: 5,
  RefusedInvalidSourceCID: 6,
  RefusedSourceCIDAlreadyAllocated: 7,
};

export declare const OBEXVersions: {
  kOBEXVersion10: 16,
};

export declare const BluetoothHCILinkPolicySettingsValues: {
  DisableAllLMModes: 0,
  EnableCentralPeripheralSwitch: 1,
  EnableHoldMode: 2,
  EnableSniffMode: 4,
  EnableParkMode: 8,
  ReservedForFutureUse: 16,
  EnableMasterSlaveSwitch: 1,
};

export declare const BluetoothFeatureBits: {
  kBluetoothFeatureThreeSlotPackets: 1,
  kBluetoothFeatureFiveSlotPackets: 2,
  kBluetoothFeatureEncryption: 4,
  kBluetoothFeatureSlotOffset: 8,
  kBluetoothFeatureTimingAccuracy: 16,
  kBluetoothFeatureSwitchRoles: 32,
  kBluetoothFeatureHoldMode: 64,
  kBluetoothFeatureSniffMode: 128,
  kBluetoothFeatureParkMode: 1,
  kBluetoothFeatureRSSI: 2,
  kBluetoothFeaturePowerControlRequests: 2,
  kBluetoothFeatureChannelQuality: 4,
  kBluetoothFeatureSCOLink: 8,
  kBluetoothFeatureHV2Packets: 16,
  kBluetoothFeatureHV3Packets: 32,
  kBluetoothFeatureULawLog: 64,
  kBluetoothFeatureALawLog: 128,
  kBluetoothFeatureCVSD: 1,
  kBluetoothFeaturePagingScheme: 2,
  kBluetoothFeaturePowerControl: 4,
  kBluetoothFeatureTransparentSCOData: 8,
  kBluetoothFeatureFlowControlLagBit0: 16,
  kBluetoothFeatureFlowControlLagBit1: 32,
  kBluetoothFeatureFlowControlLagBit2: 64,
  kBluetoothFeatureBroadcastEncryption: 128,
  kBluetoothFeatureScatterMode: 1,
  kBluetoothFeatureEnhancedDataRateACL2MbpsMode: 2,
  kBluetoothFeatureEnhancedDataRateACL3MbpsMode: 4,
  kBluetoothFeatureEnhancedInquiryScan: 8,
  kBluetoothFeatureInterlacedInquiryScan: 16,
  kBluetoothFeatureInterlacedPageScan: 32,
  kBluetoothFeatureRSSIWithInquiryResult: 64,
  kBluetoothFeatureExtendedSCOLink: 128,
  kBluetoothFeatureEV4Packets: 1,
  kBluetoothFeatureEV5Packets: 2,
  kBluetoothFeatureAbsenceMasks: 4,
  kBluetoothFeatureAFHCapablePeripheral: 8,
  kBluetoothFeatureAFHClassificationPeripheral: 16,
  kBluetoothFeatureAliasAuhentication: 32,
  kBluetoothFeatureLESupportedController: 64,
  kBluetoothFeature3SlotEnhancedDataRateACLPackets: 128,
  kBluetoothFeatureAFHCapableSlave: 8,
  kBluetoothFeatureAFHClassificationSlave: 16,
  kBluetoothFeature5SlotEnhancedDataRateACLPackets: 1,
  kBluetoothFeatureSniffSubrating: 2,
  kBluetoothFeaturePauseEncryption: 4,
  kBluetoothFeatureAFHCapableMaster: 8,
  kBluetoothFeatureAFHClassificationMaster: 16,
  kBluetoothFeatureEnhancedDataRateeSCO2MbpsMode: 32,
  kBluetoothFeatureEnhancedDataRateeSCO3MbpsMode: 64,
  kBluetoothFeature3SlotEnhancedDataRateeSCOPackets: 128,
  kBluetoothFeatureExtendedInquiryResponse: 1,
  kBluetoothFeatureSecureSimplePairing: 8,
  kBluetoothFeatureEncapsulatedPDU: 16,
  kBluetoothFeatureErroneousDataReporting: 32,
  kBluetoothFeatureNonFlushablePacketBoundaryFlag: 64,
  kBluetoothFeatureLinkSupervisionTimeoutChangedEvent: 1,
  kBluetoothFeatureInquiryTransmissionPowerLevel: 2,
  kBluetoothFeatureExtendedFeatures: 128,
  kBluetoothExtendedFeatureSimpleSecurePairingHostMode: 1,
  kBluetoothExtendedFeatureLESupportedHostMode: 2,
  kBluetoothExtendedFeatureLEAndBREDRToSameDeviceHostMode: 4,
  KBluetoothExtendedFeatureSecureConnectionsHostMode: 8,
  kBluetoothExtendedFeatureSecureConnectionsControllerSupport: 1,
  kBluetoothExtendedFeaturePing: 2,
  kBluetoothExtendedFeatureReserved: 4,
  kBluetoothExtendedFeatureTrainNudging: 8,
  kBluetoothExtendedFeatureSlotAvailabilityMask: 16,
};

export declare const OBEXOpCodeCommandValues: {
  Reserved: 4,
  Connect: 128,
  Disconnect: 129,
  Put: 2,
  PutWithHighBitSet: 130,
  Get: 3,
  GetWithHighBitSet: 131,
  ReservedWithHighBitSet: 132,
  SetPath: 133,
  Abort: 255,
  ReservedRangeStart: 6,
  ReservedRangeEnd: 15,
  UserDefinedStart: 16,
  UserDefinedEnd: 31,
};

export declare const BluetoothHCISimplePairingModes: {
  NotSet: 0,
  Enabled: 1,
};

export declare const OBEXSessionEventTypes: {
  ConnectCommandResponseReceived: 1329808707,
  DisconnectCommandResponseReceived: 1329808708,
  PutCommandResponseReceived: 1329808720,
  GetCommandResponseReceived: 1329808711,
  SetPathCommandResponseReceived: 1329808723,
  AbortCommandResponseReceived: 1329808705,
  ConnectCommandReceived: 1330857283,
  DisconnectCommandReceived: 1330857284,
  PutCommandReceived: 1330857296,
  GetCommandReceived: 1330857287,
  SetPathCommandReceived: 1330857299,
  AbortCommandReceived: 1330857281,
  Error: 1330070853,
};

export declare const BluetoothL2CAPInformationExtendedFeaturesMask: {
  InformationNoExtendedFeatures: 0,
  InformationFlowControlMode: 1,
  InformationRetransmissionMode: 2,
  InformationBidirectionalQoS: 4,
  InformationEnhancedRetransmissionMode: 8,
  InformationStreamingMode: 16,
  InformationFCSOption: 32,
  InformationExtendedFlowSpecification: 64,
  InformationFixedChannels: 128,
  InformationExtendedWindowSize: 256,
  UnicastConnectionlessDataReception: 512,
};

export declare const IOBluetoothHandsFreeCallHoldModes: {
  Mode0: 1,
  Mode1: 2,
  Mode1idx: 4,
  Mode2: 8,
  Mode2idx: 16,
  Mode3: 32,
  Mode4: 64,
};

export declare const ProtocolParameters: {
  L2CAPPSM: 1,
  RFCOMMChannel: 1,
  TCPPort: 1,
  UDPPort: 1,
  BNEPVersion: 1,
  BNEPSupportedNetworkPacketTypeList: 2,
};

export declare const BluetoothIOCapabilities: {
  DisplayOnly: 0,
  DisplayYesNo: 1,
  KeyboardOnly: 2,
  NoInputNoOutput: 3,
};

export declare const BluetoothHCITimeoutValues: {
  kDefaultPageTimeout: 10000,
};

export declare const SDPAttributeIdentifierCodes: {
  ServiceRecordHandle: 0,
  ServiceClassIDList: 1,
  ServiceRecordState: 2,
  ServiceID: 3,
  ProtocolDescriptorList: 4,
  BrowseGroupList: 5,
  LanguageBaseAttributeIDList: 6,
  ServiceInfoTimeToLive: 7,
  ServiceAvailability: 8,
  BluetoothProfileDescriptorList: 9,
  DocumentationURL: 10,
  ClientExecutableURL: 11,
  IconURL: 12,
  AdditionalProtocolsDescriptorList: 13,
  VersionNumberList: 512,
  ServiceDatabaseState: 513,
  GroupID: 512,
  IPSubnet: 512,
  HIDReleaseNumber: 512,
  HIDParserVersion: 513,
  HIDDeviceSubclass: 514,
  HIDCountryCode: 515,
  HIDVirtualCable: 516,
  HIDReconnectInitiate: 517,
  HIDDescriptorList: 518,
  HIDLangIDBaseList: 519,
  HIDSDPDisable: 520,
  HIDBatteryPower: 521,
  HIDRemoteWake: 522,
  HIDProfileVersion: 523,
  HIDSupervisionTimeout: 524,
  HIDNormallyConnectable: 525,
  HIDBootDevice: 526,
  HIDSSRHostMaxLatency: 527,
  HIDSSRHostMinTimeout: 528,
  ServiceVersion: 768,
  ExternalNetwork: 769,
  Network: 769,
  SupportedDataStoresList: 769,
  FaxClass1Support: 770,
  RemoteAudioVolumeControl: 770,
  FaxClass2_0Support: 771,
  SupporterFormatsList: 771,
  FaxClass2Support: 772,
  AudioFeedbackSupport: 773,
  NetworkAddress: 774,
  WAPGateway: 775,
  HomepageURL: 776,
  WAPStackType: 777,
  SecurityDescription: 778,
  NetAccessType: 779,
  MaxNetAccessRate: 780,
  SupportedCapabilities: 784,
  SupportedFeatures: 785,
  SupportedFunctions: 786,
  TotalImagingDataCapacity: 787,
  ServiceName: 0,
  ServiceDescription: 1,
  ProviderName: 2,
};

export declare const BluetoothLESecurityManagerPairingFailedReasonCode: {
  Reserved: 0,
  PasskeyEntryFailed: 1,
  OOBNotAvailbale: 2,
  AuthenticationRequirements: 3,
  ConfirmValueFailed: 4,
  PairingNotSupported: 5,
  EncryptionKeySize: 6,
  CommandNotSupported: 7,
  UnspecifiedReason: 8,
  RepeatedAttempts: 9,
  InvalidParameters: 10,
  DHKeyCheckFailed: 11,
  NumericComparisonFailed: 12,
  BREDRPairingInProgress: 13,
  CrossTransportKeyDerivationGenerationNotAllowed: 14,
  ReservedStart: 15,
  ReservedEnd: 255,
};

export declare const OBEXOpCodeResponseValues: {
  ReservedRangeStart: 0,
  ReservedRangeEnd: 15,
  Continue: 16,
  ContinueWithFinalBit: 144,
  Success: 32,
  SuccessWithFinalBit: 160,
  Created: 33,
  CreatedWithFinalBit: 161,
  Accepted: 34,
  AcceptedWithFinalBit: 162,
  NonAuthoritativeInfo: 35,
  NonAuthoritativeInfoWithFinalBit: 163,
  NoContent: 36,
  NoContentWithFinalBit: 164,
  ResetContent: 37,
  ResetContentWithFinalBit: 165,
  PartialContent: 38,
  PartialContentWithFinalBit: 166,
  MultipleChoices: 48,
  MultipleChoicesWithFinalBit: 176,
  MovedPermanently: 49,
  MovedPermanentlyWithFinalBit: 177,
  MovedTemporarily: 50,
  MovedTemporarilyWithFinalBit: 178,
  SeeOther: 51,
  SeeOtherWithFinalBit: 179,
  NotModified: 52,
  NotModifiedWithFinalBit: 180,
  UseProxy: 53,
  UseProxyWithFinalBit: 181,
  BadRequest: 64,
  BadRequestWithFinalBit: 192,
  Unauthorized: 65,
  UnauthorizedWithFinalBit: 193,
  PaymentRequired: 66,
  PaymentRequiredWithFinalBit: 194,
  Forbidden: 67,
  ForbiddenWithFinalBit: 195,
  NotFound: 68,
  NotFoundWithFinalBit: 196,
  MethodNotAllowed: 69,
  MethodNotAllowedWithFinalBit: 197,
  NotAcceptable: 70,
  NotAcceptableWithFinalBit: 198,
  ProxyAuthenticationRequired: 71,
  ProxyAuthenticationRequiredWithFinalBit: 199,
  RequestTimeOut: 72,
  RequestTimeOutWithFinalBit: 200,
  Conflict: 73,
  ConflictWithFinalBit: 201,
  Gone: 74,
  GoneWithFinalBit: 202,
  LengthRequired: 75,
  LengthRequiredFinalBit: 203,
  PreconditionFailed: 76,
  PreconditionFailedWithFinalBit: 204,
  RequestedEntityTooLarge: 77,
  RequestedEntityTooLargeWithFinalBit: 205,
  RequestURLTooLarge: 78,
  RequestURLTooLargeWithFinalBit: 206,
  UnsupportedMediaType: 79,
  UnsupportedMediaTypeWithFinalBit: 207,
  InternalServerError: 80,
  InternalServerErrorWithFinalBit: 208,
  NotImplemented: 81,
  NotImplementedWithFinalBit: 209,
  BadGateway: 82,
  BadGatewayWithFinalBit: 210,
  ServiceUnavailable: 83,
  ServiceUnavailableWithFinalBit: 211,
  GatewayTimeout: 84,
  GatewayTimeoutWithFinalBit: 212,
  HTTPVersionNotSupported: 85,
  HTTPVersionNotSupportedWithFinalBit: 213,
  DatabaseFull: 96,
  DatabaseFullWithFinalBit: 224,
  DatabaseLocked: 97,
  DatabaseLockedWithFinalBit: 225,
};

export declare const BluetoothHCIReadStoredLinkKeysFlags: {
  ReturnLinkKeyForSpecifiedDeviceOnly: 0,
  ReadAllStoredLinkKeys: 1,
};

export declare const IOBluetoothHandsFreeCodecID: {
  DCVSD: 1,
  DmSBC: 2,
  DAACELD: -128,
};

export declare const SDPAttributeDeviceIdentificationRecord: {
  ServiceDescription: 1,
  DocumentationURL: 10,
  ClientExecutableURL: 11,
  SpecificationID: 512,
  VendorID: 513,
  ProductID: 514,
  Version: 515,
  PrimaryRecord: 516,
  VendorIDSource: 517,
  ReservedRangeStart: 518,
  ReservedRangeEnd: 767,
};

export declare const BluetoothLESecurityManagerKeyDistributionFormat: {
  Encryption: 1,
  ID: 2,
  Sign: 4,
  Link: 8,
};

export declare const BluetoothL2CAPSegmentationAndReassembly: {
  Unsegmented: 0,
  StartOf: 1,
  EndOf: 2,
  ContinuationOf: 3,
};

export declare const IOBluetoothHandsFreeAudioGatewayFeatures: {
  None: 0,
  ThreeWayCalling: 1,
  ECAndOrNRFunction: 2,
  VoiceRecognition: 4,
  InBandRingTone: 8,
  AttachedNumberToVoiceTag: 16,
  RejectCallCapability: 32,
  EnhancedCallStatus: 64,
  EnhancedCallControl: 128,
  ExtendedErrorResultCodes: 256,
  CodecNegotiation: 512,
};

export declare const BluetoothHCIRetransmissionEffortTypes: {
  None: 0,
  AtLeastOneAndOptimizeForPower: 1,
  AtLeastOneAndOptimizeLinkQuality: 2,
  DontCare: 255,
};

export declare const BluetoothHCIExtendedInquiryResponseDataTypes: {
  TypeFlags: 1,
  Type16BitServiceClassUUIDsWithMoreAvailable: 2,
  Type16BitServiceClassUUIDsCompleteList: 3,
  Type32BitServiceClassUUIDsWithMoreAvailable: 4,
  Type32BitServiceClassUUIDsCompleteList: 5,
  Type128BitServiceClassUUIDsWithMoreAvailable: 6,
  Type128BitServiceClassUUIDsCompleteList: 7,
  TypeShortenedLocalName: 8,
  TypeCompleteLocalName: 9,
  TypeTransmitPowerLevel: 10,
  TypeSSPOOBClassOfDevice: 13,
  TypeSSPOOBSimplePairingHashC: 14,
  TypeSSPOOBSimplePairingRandomizerR: 15,
  TypeDeviceID: 16,
  TypeSecurityManagerTKValue: 16,
  TypeSecurityManagerOOBFlags: 17,
  TypePeripheralConnectionIntervalRange: 18,
  TypeServiceSolicitation16BitUUIDs: 20,
  TypeServiceSolicitation128BitUUIDs: 21,
  TypeServiceData: 22,
  TypePublicTargetAddress: 23,
  TypeRandomTargetAddress: 24,
  TypeAppearance: 25,
  TypeAdvertisingInterval: 26,
  TypeLEBluetoothDeviceAddress: 27,
  TypeLERole: 28,
  TypeSimplePairingHash: 29,
  TypeSimplePairingRandomizer: 30,
  TypeServiceSolicitation32BitUUIDs: 31,
  TypeServiceData32BitUUID: 32,
  TypeServiceData128BitUUID: 33,
  TypeSecureConnectionsConfirmationValue: 34,
  TypeSecureConnectionsRandomValue: 35,
  TypeURI: 36,
  TypeIndoorPositioning: 37,
  TypeTransportDiscoveryData: 38,
  TypeCsisRsiData: 46,
  Type3DInformationData: 61,
  TypeManufacturerSpecificData: 255,
  TypeSlaveConnectionIntervalRange: 18,
};

export declare class BluetoothDeviceAddress {
  constructor(init?: BluetoothDeviceAddress);
  data: unknown /* const array */;
}

export declare class BluetoothSetEventMask {
  constructor(init?: BluetoothSetEventMask);
  data: unknown /* const array */;
}

export declare class BluetoothHCIEventSynchronousConnectionCompleteResults {
  constructor(init?: BluetoothHCIEventSynchronousConnectionCompleteResults);
  connectionHandle: number;
  deviceAddress: BluetoothDeviceAddress;
  linkType: number;
  transmissionInterval: number;
  retransmissionWindow: number;
  receivePacketLength: number;
  transmitPacketLength: number;
  airMode: number;
}

export declare class OBEXTransportEvent {
  constructor(init?: OBEXTransportEvent);
  type: number;
  status: number;
  dataPtr: interop.Pointer;
  dataLength: number;
}

export declare class OBEXPutCommandData {
  constructor(init?: OBEXPutCommandData);
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
  bodyDataLeftToSend: number;
}

export declare class OpaqueOBEXSessionRef {
  constructor(init?: OpaqueOBEXSessionRef);
}

export declare class IOBluetoothL2CAPChannelDataBlock {
  constructor(init?: IOBluetoothL2CAPChannelDataBlock);
  dataPtr: interop.Pointer;
  dataSize: number;
}

export declare class OpaqueIOBluetoothObjectRef {
  constructor(init?: OpaqueIOBluetoothObjectRef);
}

export declare class OBEXAbortCommandData {
  constructor(init?: OBEXAbortCommandData);
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
}

export declare class OBEXGetCommandResponseData {
  constructor(init?: OBEXGetCommandResponseData);
  serverResponseOpCode: number;
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
}

export declare class BluetoothHCIEventReadClockOffsetResults {
  constructor(init?: BluetoothHCIEventReadClockOffsetResults);
  connectionHandle: number;
  clockOffset: number;
}

export declare class BluetoothHCILinkSupervisionTimeout {
  constructor(init?: BluetoothHCILinkSupervisionTimeout);
  handle: number;
  timeout: number;
}

export declare class BluetoothIOCapabilityResponse {
  constructor(init?: BluetoothIOCapabilityResponse);
  deviceAddress: BluetoothDeviceAddress;
  ioCapability: number;
  OOBDataPresence: number;
  authenticationRequirements: number;
}

export declare class BluetoothHCIEventEncryptionKeyRefreshCompleteResults {
  constructor(init?: BluetoothHCIEventEncryptionKeyRefreshCompleteResults);
  connectionHandle: number;
}

export declare class BluetoothHCIExtendedInquiryResult {
  constructor(init?: BluetoothHCIExtendedInquiryResult);
  numberOfReponses: number;
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
  reserved: number;
  classOfDevice: number;
  clockOffset: number;
  RSSIValue: number;
  extendedInquiryResponse: BluetoothHCIExtendedInquiryResponse;
}

export declare class BluetoothHCIEventPageScanRepetitionModeChangeResults {
  constructor(init?: BluetoothHCIEventPageScanRepetitionModeChangeResults);
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
}

export declare class BluetoothHCIExtendedInquiryResponse {
  constructor(init?: BluetoothHCIExtendedInquiryResponse);
  data: unknown /* const array */;
}

export declare class OBEXSetPathCommandData {
  constructor(init?: OBEXSetPathCommandData);
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
  flags: number;
  constants: number;
}

export declare class OBEXAbortCommandResponseData {
  constructor(init?: OBEXAbortCommandResponseData);
  serverResponseOpCode: number;
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
}

export declare class BluetoothHCIEventLELongTermKeyRequestResults {
  constructor(init?: BluetoothHCIEventLELongTermKeyRequestResults);
  connectionHandle: number;
  randomNumber: unknown /* const array */;
  ediv: number;
}

export declare class BluetoothHCIEventLEMetaResults {
  constructor(init?: BluetoothHCIEventLEMetaResults);
  length: number;
  data: unknown /* const array */;
}

export declare class BluetoothHCIEventSniffSubratingResults {
  constructor(init?: BluetoothHCIEventSniffSubratingResults);
  connectionHandle: number;
  maxTransmitLatency: number;
  maxReceiveLatency: number;
  minRemoteTimeout: number;
  minLocalTimeout: number;
}

export declare class BluetoothHCIEventPageScanModeChangeResults {
  constructor(init?: BluetoothHCIEventPageScanModeChangeResults);
  deviceAddress: BluetoothDeviceAddress;
  pageScanMode: number;
}

export declare class BluetoothHCIEventReadRemoteSupportedFeaturesResults {
  constructor(init?: BluetoothHCIEventReadRemoteSupportedFeaturesResults);
  error: number;
  connectionHandle: number;
  lmpFeatures: BluetoothHCISupportedFeatures;
}

export declare class BluetoothHCIEventConnectionPacketTypeResults {
  constructor(init?: BluetoothHCIEventConnectionPacketTypeResults);
  connectionHandle: number;
  packetType: number;
}

export declare class BluetoothHCIEventFlushOccurredResults {
  constructor(init?: BluetoothHCIEventFlushOccurredResults);
  connectionHandle: number;
}

export declare class BluetoothHCIEventHardwareErrorResults {
  constructor(init?: BluetoothHCIEventHardwareErrorResults);
  error: number;
}

export declare class BluetoothHCIEventQoSSetupCompleteResults {
  constructor(init?: BluetoothHCIEventQoSSetupCompleteResults);
  connectionHandle: number;
  setupParams: BluetoothHCIQualityOfServiceSetupParams;
}

export declare class BluetoothHCIEventChangeConnectionLinkKeyCompleteResults {
  constructor(init?: BluetoothHCIEventChangeConnectionLinkKeyCompleteResults);
  connectionHandle: number;
}

export declare class BluetoothHCIEventReturnLinkKeysResults {
  constructor(init?: BluetoothHCIEventReturnLinkKeysResults);
  numLinkKeys: number;
  linkKeys: unknown /* const array */;
}

export declare class BluetoothHCIEventModeChangeResults {
  constructor(init?: BluetoothHCIEventModeChangeResults);
  connectionHandle: number;
  mode: number;
  modeInterval: number;
}

export declare class BluetoothHCIEventConnectionRequestResults {
  constructor(init?: BluetoothHCIEventConnectionRequestResults);
  deviceAddress: BluetoothDeviceAddress;
  classOfDevice: number;
  linkType: number;
}

export declare class BluetoothHCIEventRemoteNameRequestResults {
  constructor(init?: BluetoothHCIEventRemoteNameRequestResults);
  deviceAddress: BluetoothDeviceAddress;
  deviceName: unknown /* const array */;
}

export declare class BluetoothHCIEventReadRemoteVersionInfoResults {
  constructor(init?: BluetoothHCIEventReadRemoteVersionInfoResults);
  connectionHandle: number;
  lmpVersion: number;
  manufacturerName: number;
  lmpSubversion: number;
}

export declare class BluetoothHCIEventReadExtendedFeaturesResults {
  constructor(init?: BluetoothHCIEventReadExtendedFeaturesResults);
  connectionHandle: number;
  supportedFeaturesInfo: BluetoothHCIExtendedFeaturesInfo;
}

export declare class BluetoothHCIEventLEReadRemoteUsedFeaturesCompleteResults {
  constructor(init?: BluetoothHCIEventLEReadRemoteUsedFeaturesCompleteResults);
  connectionHandle: number;
  usedFeatures: BluetoothHCISupportedFeatures;
}

export declare class BluetoothHCIEventLEEnhancedConnectionCompleteResults {
  constructor(init?: BluetoothHCIEventLEEnhancedConnectionCompleteResults);
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

export declare class BluetoothHCIEventSynchronousConnectionChangedResults {
  constructor(init?: BluetoothHCIEventSynchronousConnectionChangedResults);
  connectionHandle: number;
  transmissionInterval: number;
  retransmissionWindow: number;
  receivePacketLength: number;
  transmitPacketLength: number;
}

export declare class BluetoothAFHResults {
  constructor(init?: BluetoothAFHResults);
  handle: number;
  mode: number;
  afhMap: unknown /* const array */;
}

export declare class BluetoothAFHHostChannelClassification {
  constructor(init?: BluetoothAFHHostChannelClassification);
  data: unknown /* const array */;
}

export declare class BluetoothUserPasskeyNotification {
  constructor(init?: BluetoothUserPasskeyNotification);
  deviceAddress: BluetoothDeviceAddress;
  passkey: number;
}

export declare class BluetoothHCIReadLocalOOBDataResults {
  constructor(init?: BluetoothHCIReadLocalOOBDataResults);
  hash: BluetoothHCISimplePairingOOBData;
  randomizer: BluetoothHCISimplePairingOOBData;
}

export declare class BluetoothHCIReadExtendedInquiryResponseResults {
  constructor(init?: BluetoothHCIReadExtendedInquiryResponseResults);
  outFECRequired: number;
  extendedInquiryResponse: BluetoothHCIExtendedInquiryResponse;
}

export declare class BluetoothHCIInquiryResult {
  constructor(init?: BluetoothHCIInquiryResult);
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
  pageScanPeriodMode: number;
  pageScanMode: number;
  classOfDevice: number;
  clockOffset: number;
}

export declare class BluetoothTransportInfo {
  constructor(init?: BluetoothTransportInfo);
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

export declare class BluetoothHCITransmitPowerLevelInfo {
  constructor(init?: BluetoothHCITransmitPowerLevelInfo);
  handle: number;
  level: number;
}

export declare class BluetoothHCICurrentInquiryAccessCodesForWrite {
  constructor(init?: BluetoothHCICurrentInquiryAccessCodesForWrite);
  count: number;
  codes: unknown /* const array */;
}

export declare class BluetoothHCICurrentInquiryAccessCodes {
  constructor(init?: BluetoothHCICurrentInquiryAccessCodes);
  count: number;
  codes: interop.Pointer;
}

export declare class BluetoothHCIInquiryAccessCode {
  constructor(init?: BluetoothHCIInquiryAccessCode);
  data: unknown /* const array */;
}

export declare class BluetoothReadClockInfo {
  constructor(init?: BluetoothReadClockInfo);
  handle: number;
  clock: number;
  accuracy: number;
}

export declare class BluetoothHCIEnhancedAcceptSynchronousConnectionRequestParams {
  constructor(init?: BluetoothHCIEnhancedAcceptSynchronousConnectionRequestParams);
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

export declare class BluetoothHCIEnhancedSetupSynchronousConnectionParams {
  constructor(init?: BluetoothHCIEnhancedSetupSynchronousConnectionParams);
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

export declare class BluetoothHCIAcceptSynchronousConnectionRequestParams {
  constructor(init?: BluetoothHCIAcceptSynchronousConnectionRequestParams);
  transmitBandwidth: number;
  receiveBandwidth: number;
  maxLatency: number;
  contentFormat: number;
  retransmissionEffort: number;
  packetType: number;
}

export declare class BluetoothHCIQualityOfServiceSetupParams {
  constructor(init?: BluetoothHCIQualityOfServiceSetupParams);
  flags: number;
  serviceType: number;
  tokenRate: number;
  peakBandwidth: number;
  latency: number;
  delayVariation: number;
}

export declare class BluetoothHCILinkPolicySettingsInfo {
  constructor(init?: BluetoothHCILinkPolicySettingsInfo);
  settings: number;
  handle: number;
}

export declare class BluetoothHCIEncryptionKeySizeInfo {
  constructor(init?: BluetoothHCIEncryptionKeySizeInfo);
  handle: number;
  keySize: number;
}

export declare class BluetoothHCISupportedFeatures {
  constructor(init?: BluetoothHCISupportedFeatures);
  data: unknown /* const array */;
}

export declare class BluetoothHCISupportedCommands {
  constructor(init?: BluetoothHCISupportedCommands);
  data: unknown /* const array */;
}

export declare class BluetoothIRK {
  constructor(init?: BluetoothIRK);
  data: unknown /* const array */;
}

export declare class BluetoothHCIExtendedFeaturesInfo {
  constructor(init?: BluetoothHCIExtendedFeaturesInfo);
  page: number;
  maxPage: number;
  data: unknown /* const array */;
}

export declare class BluetoothHCIEventLinkKeyNotificationResults {
  constructor(init?: BluetoothHCIEventLinkKeyNotificationResults);
  deviceAddress: BluetoothDeviceAddress;
  linkKey: BluetoothKey;
  keyType: number;
}

export declare class BluetoothHCIInquiryWithRSSIResults {
  constructor(init?: BluetoothHCIInquiryWithRSSIResults);
  results: unknown /* const array */;
  count: number;
}

export declare class BluetoothHCIEventSimplePairingCompleteResults {
  constructor(init?: BluetoothHCIEventSimplePairingCompleteResults);
  deviceAddress: BluetoothDeviceAddress;
}

export declare class BluetoothHCIEventEncryptionChangeResults {
  constructor(init?: BluetoothHCIEventEncryptionChangeResults);
  connectionHandle: number;
  enable: number;
}

export declare class OBEXDisconnectCommandResponseData {
  constructor(init?: OBEXDisconnectCommandResponseData);
  serverResponseOpCode: number;
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
}

export declare class BluetoothHCIEventDisconnectionCompleteResults {
  constructor(init?: BluetoothHCIEventDisconnectionCompleteResults);
  connectionHandle: number;
  reason: number;
}

export declare class BluetoothHCILinkQualityInfo {
  constructor(init?: BluetoothHCILinkQualityInfo);
  handle: number;
  qualityValue: number;
}

export declare class BluetoothHCIAutomaticFlushTimeoutInfo {
  constructor(init?: BluetoothHCIAutomaticFlushTimeoutInfo);
  handle: number;
  timeout: number;
}

export declare class BluetoothHCIEventLEConnectionUpdateCompleteResults {
  constructor(init?: BluetoothHCIEventLEConnectionUpdateCompleteResults);
  connectionHandle: number;
  connInterval: number;
  connLatency: number;
  supervisionTimeout: number;
}

export declare class BluetoothHCIEventLEConnectionCompleteResults {
  constructor(init?: BluetoothHCIEventLEConnectionCompleteResults);
  connectionHandle: number;
  role: number;
  peerAddressType: number;
  peerAddress: BluetoothDeviceAddress;
  connInterval: number;
  connLatency: number;
  supervisionTimeout: number;
  masterClockAccuracy: number;
}

export declare class BluetoothRemoteHostSupportedFeaturesNotification {
  constructor(init?: BluetoothRemoteHostSupportedFeaturesNotification);
  deviceAddress: BluetoothDeviceAddress;
  hostSupportedFeatures: BluetoothHCISupportedFeatures;
}

export declare class BluetoothHCIRoleInfo {
  constructor(init?: BluetoothHCIRoleInfo);
  role: number;
  handle: number;
}

export declare class BluetoothHCIEventReadRemoteExtendedFeaturesResults {
  constructor(init?: BluetoothHCIEventReadRemoteExtendedFeaturesResults);
  error: number;
  connectionHandle: number;
  page: number;
  maxPage: number;
  lmpFeatures: BluetoothHCISupportedFeatures;
}

export declare class BluetoothHCIEventConnectionCompleteResults {
  constructor(init?: BluetoothHCIEventConnectionCompleteResults);
  connectionHandle: number;
  deviceAddress: BluetoothDeviceAddress;
  linkType: number;
  encryptionMode: number;
}

export declare class OBEXGetCommandData {
  constructor(init?: OBEXGetCommandData);
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
}

export declare class OBEXSetPathCommandResponseData {
  constructor(init?: OBEXSetPathCommandResponseData);
  serverResponseOpCode: number;
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
  flags: number;
  constants: number;
}

export declare class BluetoothEnhancedSynchronousConnectionInfo {
  constructor(init?: BluetoothEnhancedSynchronousConnectionInfo);
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

export declare class OBEXConnectCommandData {
  constructor(init?: OBEXConnectCommandData);
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
  maxPacketSize: number;
  version: number;
  flags: number;
}

export declare class OpaquePrivOBEXSessionData {
  constructor(init?: OpaquePrivOBEXSessionData);
}

export declare class BluetoothHCIEventReadSupportedFeaturesResults {
  constructor(init?: BluetoothHCIEventReadSupportedFeaturesResults);
  connectionHandle: number;
  supportedFeatures: BluetoothHCISupportedFeatures;
}

export declare class BluetoothL2CAPQualityOfServiceOptions {
  constructor(init?: BluetoothL2CAPQualityOfServiceOptions);
  flags: number;
  serviceType: number;
  tokenRate: number;
  tokenBucketSize: number;
  peakBandwidth: number;
  latency: number;
  delayVariation: number;
}

export declare class BluetoothHCIScanActivity {
  constructor(init?: BluetoothHCIScanActivity);
  scanInterval: number;
  scanWindow: number;
}

export declare class BluetoothHCIStoredLinkKeysInfo {
  constructor(init?: BluetoothHCIStoredLinkKeysInfo);
  numLinkKeysRead: number;
  maxNumLinkKeysAllowedInDevice: number;
}

export declare class BluetoothHCILEBufferSize {
  constructor(init?: BluetoothHCILEBufferSize);
  ACLDataPacketLength: number;
  totalNumACLDataPackets: number;
}

export declare class BluetoothHCIEventAuthenticationCompleteResults {
  constructor(init?: BluetoothHCIEventAuthenticationCompleteResults);
  connectionHandle: number;
}

export declare class BluetoothEventFilterCondition {
  constructor(init?: BluetoothEventFilterCondition);
  data: unknown /* const array */;
}

export declare class OBEXErrorData {
  constructor(init?: OBEXErrorData);
  error: number;
  dataPtr: interop.Pointer;
  dataLength: number;
}

export declare class BluetoothHCIBufferSize {
  constructor(init?: BluetoothHCIBufferSize);
  ACLDataPacketLength: number;
  SCODataPacketLength: number;
  totalNumACLDataPackets: number;
  totalNumSCODataPackets: number;
}

export declare class BluetoothHCIRequestCallbackInfo {
  constructor(init?: BluetoothHCIRequestCallbackInfo);
  userCallback: number;
  userRefCon: number;
  internalRefCon: number;
  asyncIDRefCon: number;
  reserved: number;
}

export declare class OBEXDisconnectCommandData {
  constructor(init?: OBEXDisconnectCommandData);
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
}

export declare class BluetoothHCISetupSynchronousConnectionParams {
  constructor(init?: BluetoothHCISetupSynchronousConnectionParams);
  transmitBandwidth: number;
  receiveBandwidth: number;
  maxLatency: number;
  voiceSetting: number;
  retransmissionEffort: number;
  packetType: number;
}

export declare class BluetoothHCIEventMaxSlotsChangeResults {
  constructor(init?: BluetoothHCIEventMaxSlotsChangeResults);
  connectionHandle: number;
  maxSlots: number;
}

export declare class BluetoothHCIRSSIInfo {
  constructor(init?: BluetoothHCIRSSIInfo);
  handle: number;
  RSSIValue: number;
}

export declare class BluetoothKey {
  constructor(init?: BluetoothKey);
  data: unknown /* const array */;
}

export declare class BluetoothHCISimplePairingOOBData {
  constructor(init?: BluetoothHCISimplePairingOOBData);
  data: unknown /* const array */;
}

export declare class BluetoothUserConfirmationRequest {
  constructor(init?: BluetoothUserConfirmationRequest);
  deviceAddress: BluetoothDeviceAddress;
  numericValue: number;
}

export declare class BluetoothSynchronousConnectionInfo {
  constructor(init?: BluetoothSynchronousConnectionInfo);
  transmitBandWidth: number;
  receiveBandWidth: number;
  maxLatency: number;
  voiceSetting: number;
  retransmissionEffort: number;
  packetType: number;
}

export declare class BluetoothHCIEventQoSViolationResults {
  constructor(init?: BluetoothHCIEventQoSViolationResults);
  connectionHandle: number;
}

export declare class BluetoothKeypressNotification {
  constructor(init?: BluetoothKeypressNotification);
  deviceAddress: BluetoothDeviceAddress;
  notificationType: number;
}

export declare class BluetoothHCIEventRoleChangeResults {
  constructor(init?: BluetoothHCIEventRoleChangeResults);
  connectionHandle: number;
  deviceAddress: BluetoothDeviceAddress;
  role: number;
}

export declare class unnamed_9552725722646958359 {
  constructor(init?: unnamed_9552725722646958359);
  deviceAddress: BluetoothDeviceAddress;
  linkKey: BluetoothKey;
}

export declare class IOBluetoothL2CAPChannelEvent {
  constructor(init?: IOBluetoothL2CAPChannelEvent);
  eventType: interop.Enum<typeof IOBluetoothL2CAPChannelEventType>;
  u: unnamed_2902519888753426227;
  status: number;
}

export declare class OBEXConnectCommandResponseData {
  constructor(init?: OBEXConnectCommandResponseData);
  serverResponseOpCode: number;
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
  maxPacketSize: number;
  version: number;
  flags: number;
}

export declare class BluetoothHCIEventDataBufferOverflowResults {
  constructor(init?: BluetoothHCIEventDataBufferOverflowResults);
  linkType: number;
}

export declare class OBEXPutCommandResponseData {
  constructor(init?: OBEXPutCommandResponseData);
  serverResponseOpCode: number;
  headerDataPtr: interop.Pointer;
  headerDataLength: number;
}

export declare class OBEXSessionEvent {
  constructor(init?: OBEXSessionEvent);
  type: number;
  session: interop.Pointer;
  refCon: interop.Pointer;
  isEndOfEventData: number;
  reserved1: interop.Pointer;
  reserved2: interop.Pointer;
  u: unnamed_17887130414891251278;
}

export declare class BluetoothHCIVersionInfo {
  constructor(init?: BluetoothHCIVersionInfo);
  manufacturerName: number;
  lmpVersion: number;
  lmpSubVersion: number;
  hciVersion: number;
  hciRevision: number;
}

export declare class BluetoothL2CAPRetransmissionAndFlowControlOptions {
  constructor(init?: BluetoothL2CAPRetransmissionAndFlowControlOptions);
  flags: number;
  txWindowSize: number;
  maxTransmit: number;
  retransmissionTimeout: number;
  monitorTimeout: number;
  maxPDUPayloadSize: number;
}

export declare class BluetoothPINCode {
  constructor(init?: BluetoothPINCode);
  data: unknown /* const array */;
}

export declare class BluetoothHCIInquiryWithRSSIResult {
  constructor(init?: BluetoothHCIInquiryWithRSSIResult);
  deviceAddress: BluetoothDeviceAddress;
  pageScanRepetitionMode: number;
  reserved: number;
  classOfDevice: number;
  clockOffset: number;
  RSSIValue: number;
}

export declare class BluetoothHCIEventMasterLinkKeyCompleteResults {
  constructor(init?: BluetoothHCIEventMasterLinkKeyCompleteResults);
  connectionHandle: number;
  keyFlag: number;
}

export declare class BluetoothHCIFailedContactInfo {
  constructor(init?: BluetoothHCIFailedContactInfo);
  count: number;
  handle: number;
}

export declare class BluetoothHCIInquiryResults {
  constructor(init?: BluetoothHCIInquiryResults);
  results: unknown /* const array */;
  count: number;
}

export declare class BluetoothHCIEventFlowSpecificationData {
  constructor(init?: BluetoothHCIEventFlowSpecificationData);
  connectionHandle: number;
  flags: number;
  flowDirection: number;
  serviceType: number;
  tokenRate: number;
  tokenBucketSize: number;
  peakBandwidth: number;
  accessLatency: number;
}

export declare class IOBluetoothDeviceSearchAttributes {
  constructor(init?: IOBluetoothDeviceSearchAttributes);
  options: number;
  maxResults: number;
  deviceAttributeCount: number;
  attributeList: interop.Pointer;
}

export declare class BluetoothHCIEventVendorSpecificResults {
  constructor(init?: BluetoothHCIEventVendorSpecificResults);
  length: number;
  data: unknown /* const array */;
}

export declare class IOBluetoothDeviceSearchDeviceAttributes {
  constructor(init?: IOBluetoothDeviceSearchDeviceAttributes);
  address: BluetoothDeviceAddress;
  name: unknown /* const array */;
  serviceClassMajor: number;
  deviceClassMajor: number;
  deviceClassMinor: number;
}

export declare class BluetoothHCIReadLMPHandleResults {
  constructor(init?: BluetoothHCIReadLMPHandleResults);
  handle: number;
  lmp_handle: number;
  reserved: number;
}

export type unnamed_17887130414891251278Descriptor = 
  | { connectCommandResponseData: OBEXConnectCommandResponseData }
  | { disconnectCommandResponseData: OBEXDisconnectCommandResponseData }
  | { putCommandResponseData: OBEXPutCommandResponseData }
  | { getCommandResponseData: OBEXGetCommandResponseData }
  | { setPathCommandResponseData: OBEXSetPathCommandResponseData }
  | { abortCommandResponseData: OBEXAbortCommandResponseData }
  | { connectCommandData: OBEXConnectCommandData }
  | { disconnectCommandData: OBEXDisconnectCommandData }
  | { putCommandData: OBEXPutCommandData }
  | { getCommandData: OBEXGetCommandData }
  | { setPathCommandData: OBEXSetPathCommandData }
  | { abortCommandData: OBEXAbortCommandData }
  | { errorData: OBEXErrorData };

export declare class unnamed_17887130414891251278 {
  constructor(init?: unnamed_17887130414891251278Descriptor);
  connectCommandResponseData: OBEXConnectCommandResponseData;
  disconnectCommandResponseData: OBEXDisconnectCommandResponseData;
  putCommandResponseData: OBEXPutCommandResponseData;
  getCommandResponseData: OBEXGetCommandResponseData;
  setPathCommandResponseData: OBEXSetPathCommandResponseData;
  abortCommandResponseData: OBEXAbortCommandResponseData;
  connectCommandData: OBEXConnectCommandData;
  disconnectCommandData: OBEXDisconnectCommandData;
  putCommandData: OBEXPutCommandData;
  getCommandData: OBEXGetCommandData;
  setPathCommandData: OBEXSetPathCommandData;
  abortCommandData: OBEXAbortCommandData;
  errorData: OBEXErrorData;
}

export type unnamed_2902519888753426227Descriptor = 
  | { data: IOBluetoothL2CAPChannelDataBlock }
  | { writeRefCon: interop.PointerConvertible }
  | { padding: unknown /* const array */ };

export declare class unnamed_2902519888753426227 {
  constructor(init?: unnamed_2902519888753426227Descriptor);
  data: IOBluetoothL2CAPChannelDataBlock;
  writeRefCon: interop.Pointer;
  padding: unknown /* const array */;
}

export declare function IOBluetoothIgnoreHIDDevice(device: interop.Object): void;

export declare function IOBluetoothRemoveIgnoredHIDDevice(device: interop.Object): void;

export declare function IOBluetoothUserNotificationUnregister(notificationRef: interop.Object): void;

export declare function IOBluetoothL2CAPChannelRegisterForChannelCloseNotification(channel: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, inRefCon: interop.PointerConvertible): interop.Object;

export declare function IOBluetoothAddSCOAudioDevice(device: interop.Object, configDict: interop.Object): number;

export declare function IOBluetoothRemoveSCOAudioDevice(device: interop.Object): number;

export declare function IOBluetoothNSStringToDeviceAddress(inNameString: string, outDeviceAddress: interop.PointerConvertible): number;

export declare function IOBluetoothNSStringFromDeviceAddress(deviceAddress: interop.PointerConvertible): string;

export declare function IOBluetoothNSStringFromDeviceAddressColon(deviceAddress: interop.PointerConvertible): string;

export declare function IOBluetoothIsFileAppleDesignatedPIMData(inFileName: string): number;

export declare function IOBluetoothGetUniqueFileNameAndPath(inName: string, inPath: string): string;

export declare function IOBluetoothPackData(ioBuffer: interop.PointerConvertible, inFormat: string): number;

export declare function IOBluetoothPackDataList(ioBuffer: interop.PointerConvertible, inFormat: string, inArgs: string): number;

export declare function IOBluetoothUnpackData(inBufferSize: number, inBuffer: interop.PointerConvertible, inFormat: string): number;

export declare function IOBluetoothUnpackDataList(inBufferSize: number, inBuffer: interop.PointerConvertible, inFormat: string, inArgs: string): number;

export declare function IOBluetoothNumberOfAvailableHIDDevices(): number;

export declare function IOBluetoothNumberOfPointingHIDDevices(): number;

export declare function IOBluetoothNumberOfKeyboardHIDDevices(): number;

export declare function IOBluetoothNumberOfTabletHIDDevices(): number;

export declare function IOBluetoothFindNumberOfRegistryEntriesOfClassName(deviceType: string): number;

export declare function OBEXSessionDelete(inSessionRef: interop.PointerConvertible): number;

export declare function OBEXSessionHasOpenOBEXConnection(inSessionRef: interop.PointerConvertible, outIsConnected: interop.PointerConvertible): number;

export declare function OBEXSessionGetMaxPacketLength(inSessionRef: interop.PointerConvertible, outLength: interop.PointerConvertible): number;

export declare function OBEXSessionGetAvailableCommandPayloadLength(inSessionRef: interop.PointerConvertible, inOpCode: number, outLength: interop.PointerConvertible): number;

export declare function OBEXSessionGetAvailableCommandResponsePayloadLength(inSessionRef: interop.PointerConvertible, inOpCode: number, outLength: interop.PointerConvertible): number;

export declare function OBEXSessionConnect(inSessionRef: interop.PointerConvertible, inFlags: number, inMaxPacketLength: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionDisconnect(inSessionRef: interop.PointerConvertible, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionPut(inSessionRef: interop.PointerConvertible, inIsFinalChunk: number, inHeadersData: interop.PointerConvertible, inHeadersDataLength: number, inBodyData: interop.PointerConvertible, inBodyDataLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionGet(inSessionRef: interop.PointerConvertible, inIsFinalChunk: number, inHeadersData: interop.PointerConvertible, inHeadersDataLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionAbort(inSessionRef: interop.PointerConvertible, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionSetPath(inSessionRef: interop.PointerConvertible, inFlags: number, inConstants: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionConnectResponse(inSessionRef: interop.PointerConvertible, inResponseOpCode: number, inFlags: number, inMaxPacketLength: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionDisconnectResponse(inSessionRef: interop.PointerConvertible, inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionGetResponse(inSessionRef: interop.PointerConvertible, inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionPutResponse(inSessionRef: interop.PointerConvertible, inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionAbortResponse(inSessionRef: interop.PointerConvertible, inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionSetPathResponse(inSessionRef: interop.PointerConvertible, inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXSessionSetServerCallback(inSessionRef: interop.PointerConvertible, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare function OBEXCreateVCard(inFirstName: interop.PointerConvertible, inFirstNameLength: number, inLastName: interop.PointerConvertible, inLastNameLength: number, inFriendlyName: interop.PointerConvertible, inFriendlyNameLength: number, inNameCharset: interop.PointerConvertible, inNameCharsetLength: number, inHomePhone: interop.PointerConvertible, inHomePhoneLength: number, inWorkPhone: interop.PointerConvertible, inWorkPhoneLength: number, inCellPhone: interop.PointerConvertible, inCellPhoneLength: number, inFaxPhone: interop.PointerConvertible, inFaxPhoneLength: number, inEMailAddress: interop.PointerConvertible, inEMailAddressLength: number, inEMailAddressCharset: interop.PointerConvertible, inEMailAddressCharsetLength: number, inOrganization: interop.PointerConvertible, inOrganizationLength: number, inOrganizationCharset: interop.PointerConvertible, inOrganizationCharsetLength: number, inTitle: interop.PointerConvertible, inTitleLength: number, inTitleCharset: interop.PointerConvertible, inTitleCharsetLength: number): interop.Object;

export declare function OBEXCreateVEvent(inCharset: string, inCharsetLength: number, inEncoding: string, inEncodingLength: number, inEventStartDate: string, inEventStartDateLength: number, inEventEndDate: string, inEventEndDateLength: number, inAlarmDate: string, inAlarmDateLength: number, inCategory: string, inCategoryLength: number, inSummary: string, inSummaryLength: number, inLocation: string, inLocationLength: number, inXIRMCLUID: string, inXIRMCLUIDLength: number): interop.Object;

export declare function OBEXGetHeaders(inData: interop.PointerConvertible, inDataSize: number): interop.Object;

export declare function OBEXHeadersToBytes(dictionaryOfHeaders: interop.Object): interop.Object;

export declare function OBEXAddNameHeader(name: interop.Object, dictRef: interop.Object): number;

export declare function OBEXAddDescriptionHeader(description: interop.Object, dictRef: interop.Object): number;

export declare function OBEXAddCountHeader(count: number, dictRef: interop.Object): number;

export declare function OBEXAddTime4ByteHeader(time4Byte: number, dictRef: interop.Object): number;

export declare function OBEXAddLengthHeader(length: number, dictRef: interop.Object): number;

export declare function OBEXAddTypeHeader(type: interop.Object, dictRef: interop.Object): number;

export declare function OBEXAddTimeISOHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddTargetHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddHTTPHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddBodyHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, isEndOfBody: number, dictRef: interop.Object): number;

export declare function OBEXAddWhoHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddConnectionIDHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddApplicationParameterHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddByteSequenceHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddObjectClassHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddAuthorizationChallengeHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddAuthorizationResponseHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function OBEXAddUserDefinedHeader(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number, dictRef: interop.Object): number;

export declare function IOBluetoothOBEXSessionCreateWithIOBluetoothSDPServiceRecordRef(inSDPServiceRef: interop.Object, outSessionRef: interop.PointerConvertible): number;

export declare function IOBluetoothOBEXSessionCreateWithIOBluetoothDeviceRefAndChannelNumber(inDeviceRef: interop.Object, inChannelID: number, outSessionRef: interop.PointerConvertible): number;

export declare function IOBluetoothOBEXSessionCreateWithIncomingIOBluetoothRFCOMMChannel(inRFCOMMChannelRef: interop.Object, inCallback: (p1: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible, outSessionRef: interop.PointerConvertible): number;

export declare function IOBluetoothOBEXSessionOpenTransportConnection(inSessionRef: interop.PointerConvertible, inCallback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): number;

export declare interface IOBluetoothDevicePairDelegate extends NSObjectProtocol {
  devicePairingStarted?(sender: interop.Object): void;

  devicePairingConnecting?(sender: interop.Object): void;

  devicePairingConnected?(sender: interop.Object): void;

  devicePairingPINCodeRequest?(sender: interop.Object): void;

  devicePairingUserConfirmationRequestNumericValue?(sender: interop.Object, numericValue: number): void;

  devicePairingUserPasskeyNotificationPasskey?(sender: interop.Object, passkey: number): void;

  devicePairingFinishedError?(sender: interop.Object, error: number): void;

  deviceSimplePairingCompleteStatus?(sender: interop.Object, status: number): void;
}

export declare class IOBluetoothDevicePairDelegate extends NativeObject implements IOBluetoothDevicePairDelegate {
}

export declare interface IOBluetoothHandsFreeDeviceDelegate extends IOBluetoothHandsFreeDelegate {
  handsFreeIsServiceAvailable?(device: IOBluetoothHandsFreeDevice, isServiceAvailable: NSNumber): void;

  handsFreeIsCallActive?(device: IOBluetoothHandsFreeDevice, isCallActive: NSNumber): void;

  handsFreeCallSetupMode?(device: IOBluetoothHandsFreeDevice, callSetupMode: NSNumber): void;

  handsFreeCallHoldState?(device: IOBluetoothHandsFreeDevice, callHoldState: NSNumber): void;

  handsFreeSignalStrength?(device: IOBluetoothHandsFreeDevice, signalStrength: NSNumber): void;

  handsFreeIsRoaming?(device: IOBluetoothHandsFreeDevice, isRoaming: NSNumber): void;

  handsFreeBatteryCharge?(device: IOBluetoothHandsFreeDevice, batteryCharge: NSNumber): void;

  handsFreeIncomingCallFrom?(device: IOBluetoothHandsFreeDevice, number: string): void;

  handsFreeRingAttempt?(device: IOBluetoothHandsFreeDevice, ringAttempt: NSNumber): void;

  handsFreeCurrentCall?(device: IOBluetoothHandsFreeDevice, currentCall: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  handsFreeSubscriberNumber?(device: IOBluetoothHandsFreeDevice, subscriberNumber: string): void;

  handsFreeIncomingSMS?(device: IOBluetoothHandsFreeDevice, sms: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  handsFreeUnhandledResultCode?(device: IOBluetoothHandsFreeDevice, resultCode: string): void;
}

export declare class IOBluetoothHandsFreeDeviceDelegate extends NativeObject implements IOBluetoothHandsFreeDeviceDelegate {
}

export declare interface IOBluetoothHandsFreeAudioGatewayDelegate {
  handsFreeHangup?(device: IOBluetoothHandsFreeAudioGateway, hangup: NSNumber): void;

  handsFreeRedial?(device: IOBluetoothHandsFreeAudioGateway, redial: NSNumber): void;
}

export declare class IOBluetoothHandsFreeAudioGatewayDelegate extends NativeObject implements IOBluetoothHandsFreeAudioGatewayDelegate {
}

export declare interface IOBluetoothHandsFreeDelegate extends NSObjectProtocol {
  handsFreeConnected?(device: IOBluetoothHandsFree, status: NSNumber): void;

  handsFreeDisconnected?(device: IOBluetoothHandsFree, status: NSNumber): void;

  handsFreeScoConnectionOpened?(device: IOBluetoothHandsFree, status: NSNumber): void;

  handsFreeScoConnectionClosed?(device: IOBluetoothHandsFree, status: NSNumber): void;
}

export declare class IOBluetoothHandsFreeDelegate extends NativeObject implements IOBluetoothHandsFreeDelegate {
}

export declare interface IOBluetoothRFCOMMChannelDelegate {
  rfcommChannelDataDataLength?(rfcommChannel: IOBluetoothRFCOMMChannel, dataPointer: interop.PointerConvertible, dataLength: number): void;

  rfcommChannelOpenCompleteStatus?(rfcommChannel: IOBluetoothRFCOMMChannel, error: number): void;

  rfcommChannelClosed?(rfcommChannel: IOBluetoothRFCOMMChannel): void;

  rfcommChannelControlSignalsChanged?(rfcommChannel: IOBluetoothRFCOMMChannel): void;

  rfcommChannelFlowControlChanged?(rfcommChannel: IOBluetoothRFCOMMChannel): void;

  rfcommChannelWriteCompleteRefconStatus?(rfcommChannel: IOBluetoothRFCOMMChannel, refcon: interop.PointerConvertible, error: number): void;

  rfcommChannelWriteCompleteRefconStatusBytesWritten?(rfcommChannel: IOBluetoothRFCOMMChannel, refcon: interop.PointerConvertible, error: number, length: number): void;

  rfcommChannelQueueSpaceAvailable?(rfcommChannel: IOBluetoothRFCOMMChannel): void;
}

export declare class IOBluetoothRFCOMMChannelDelegate extends NativeObject implements IOBluetoothRFCOMMChannelDelegate {
}

export declare interface IOBluetoothL2CAPChannelDelegate {
  l2capChannelDataDataLength?(l2capChannel: IOBluetoothL2CAPChannel, dataPointer: interop.PointerConvertible, dataLength: number): void;

  l2capChannelOpenCompleteStatus?(l2capChannel: IOBluetoothL2CAPChannel, error: number): void;

  l2capChannelClosed?(l2capChannel: IOBluetoothL2CAPChannel): void;

  l2capChannelReconfigured?(l2capChannel: IOBluetoothL2CAPChannel): void;

  l2capChannelWriteCompleteRefconStatus?(l2capChannel: IOBluetoothL2CAPChannel, refcon: interop.PointerConvertible, error: number): void;

  l2capChannelQueueSpaceAvailable?(l2capChannel: IOBluetoothL2CAPChannel): void;
}

export declare class IOBluetoothL2CAPChannelDelegate extends NativeObject implements IOBluetoothL2CAPChannelDelegate {
}

export declare interface IOBluetoothDeviceAsyncCallbacks {
  remoteNameRequestCompleteStatus(device: IOBluetoothDevice, status: number): void;

  connectionCompleteStatus(device: IOBluetoothDevice, status: number): void;

  sdpQueryCompleteStatus(device: IOBluetoothDevice, status: number): void;
}

export declare class IOBluetoothDeviceAsyncCallbacks extends NativeObject implements IOBluetoothDeviceAsyncCallbacks {
}

export declare interface IOBluetoothDeviceInquiryDelegate extends NSObjectProtocol {
  deviceInquiryStarted?(sender: IOBluetoothDeviceInquiry): void;

  deviceInquiryDeviceFoundDevice?(sender: IOBluetoothDeviceInquiry, device: IOBluetoothDevice): void;

  deviceInquiryUpdatingDeviceNamesStartedDevicesRemaining?(sender: IOBluetoothDeviceInquiry, devicesRemaining: number): void;

  deviceInquiryDeviceNameUpdatedDeviceDevicesRemaining?(sender: IOBluetoothDeviceInquiry, device: IOBluetoothDevice, devicesRemaining: number): void;

  deviceInquiryCompleteErrorAborted?(sender: IOBluetoothDeviceInquiry, error: number, aborted: boolean): void;
}

export declare class IOBluetoothDeviceInquiryDelegate extends NativeObject implements IOBluetoothDeviceInquiryDelegate {
}

export declare class OBEXFileTransferServices extends NSObject {
  delegate: interop.Object;

  static withOBEXSession<This extends abstract new (...args: any) => any>(this: This, inOBEXSession: IOBluetoothOBEXSession): InstanceType<This>;

  initWithOBEXSession(inOBEXSession: IOBluetoothOBEXSession): this;

  currentPath(): string;

  isBusy(): boolean;

  isConnected(): boolean;

  connectToFTPService(): number;

  connectToObjectPushService(): number;

  disconnect(): number;

  changeCurrentFolderToRoot(): number;

  changeCurrentFolderBackward(): number;

  changeCurrentFolderForwardToPath(inDirName: string): number;

  createFolder(inDirName: string): number;

  removeItem(inItemName: string): number;

  retrieveFolderListing(): number;

  sendFile(inLocalPathAndName: string): number;

  copyRemoteFileToLocalPath(inRemoteFileName: string, inLocalPathAndName: string): number;

  sendDataTypeName(inData: NSData, inType: string, inName: string): number;

  getDefaultVCard(inLocalPathAndName: string): number;

  abort(): number;
}

export declare class IOBluetoothOBEXSession extends OBEXSession implements IOBluetoothRFCOMMChannelDelegate {
  static withSDPServiceRecord<This extends abstract new (...args: any) => any>(this: This, inSDPServiceRecord: IOBluetoothSDPServiceRecord): InstanceType<This>;

  static withDeviceChannelID<This extends abstract new (...args: any) => any>(this: This, inDevice: IOBluetoothDevice, inRFCOMMChannelID: number): InstanceType<This>;

  static withIncomingRFCOMMChannelEventSelectorSelectorTargetRefCon<This extends abstract new (...args: any) => any>(this: This, inChannel: IOBluetoothRFCOMMChannel, inEventSelector: string, inEventSelectorTarget: interop.Object, inUserRefCon: interop.PointerConvertible): InstanceType<This>;

  initWithSDPServiceRecord(inSDPServiceRecord: IOBluetoothSDPServiceRecord): this;

  initWithDeviceChannelID(inDevice: IOBluetoothDevice, inChannelID: number): this;

  initWithIncomingRFCOMMChannelEventSelectorSelectorTargetRefCon(inChannel: IOBluetoothRFCOMMChannel, inEventSelector: string, inEventSelectorTarget: interop.Object, inUserRefCon: interop.PointerConvertible): this;

  getRFCOMMChannel(): IOBluetoothRFCOMMChannel;

  getDevice(): IOBluetoothDevice;

  sendBufferTroughChannel(): number;

  restartTransmission(): void;

  isSessionTargetAMac(): boolean;

  openTransportConnectionSelectorTargetRefCon(inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  hasOpenTransportConnection(): number;

  closeTransportConnection(): number;

  sendDataToTransportDataLength(inDataToSend: interop.PointerConvertible, inDataLength: number): number;

  setOpenTransportConnectionAsyncSelectorTargetRefCon(inSelector: string, inSelectorTarget: interop.Object, inUserRefCon: interop.PointerConvertible): void;

  setOBEXSessionOpenConnectionCallbackRefCon(inCallback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void, inUserRefCon: interop.PointerConvertible): void;

  rfcommChannelDataDataLength(rfcommChannel: IOBluetoothRFCOMMChannel, dataPointer: interop.PointerConvertible, dataLength: number): void;

  rfcommChannelOpenCompleteStatus(rfcommChannel: IOBluetoothRFCOMMChannel, error: number): void;

  rfcommChannelClosed(rfcommChannel: IOBluetoothRFCOMMChannel): void;

  rfcommChannelControlSignalsChanged(rfcommChannel: IOBluetoothRFCOMMChannel): void;

  rfcommChannelFlowControlChanged(rfcommChannel: IOBluetoothRFCOMMChannel): void;

  rfcommChannelWriteCompleteRefconStatus(rfcommChannel: IOBluetoothRFCOMMChannel, refcon: interop.PointerConvertible, error: number): void;

  rfcommChannelWriteCompleteRefconStatusBytesWritten(rfcommChannel: IOBluetoothRFCOMMChannel, refcon: interop.PointerConvertible, error: number, length: number): void;

  rfcommChannelQueueSpaceAvailable(rfcommChannel: IOBluetoothRFCOMMChannel): void;
}

export declare class IOBluetoothL2CAPChannel extends IOBluetoothObject implements NSPortDelegate {
  static registerForChannelOpenNotificationsSelector(object: interop.Object, selector: string): IOBluetoothUserNotification;

  static registerForChannelOpenNotificationsSelectorWithPSMDirection(object: interop.Object, selector: string, psm: number, inDirection: interop.Enum<typeof IOBluetoothUserNotificationChannelDirection>): IOBluetoothUserNotification;

  static withObjectID<This extends abstract new (...args: any) => any>(this: This, objectID: number): InstanceType<This>;

  closeChannel(): number;

  readonly outgoingMTU: number;

  getOutgoingMTU(): number;

  readonly incomingMTU: number;

  getIncomingMTU(): number;

  requestRemoteMTU(remoteMTU: number): number;

  writeAsyncTrapLengthRefcon(data: interop.PointerConvertible, length: number, refcon: interop.PointerConvertible): number;

  writeAsyncLengthRefcon(data: interop.PointerConvertible, length: number, refcon: interop.PointerConvertible): number;

  writeSyncLength(data: interop.PointerConvertible, length: number): number;

  setDelegate(channelDelegate: interop.Object): number;

  setDelegateWithConfiguration(channelDelegate: interop.Object, channelConfiguration: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): number;

  delegate(): interop.Object;

  readonly device: IOBluetoothDevice;

  getDevice(): IOBluetoothDevice;

  readonly objectID: number;

  getObjectID(): number;

  readonly PSM: number;

  getPSM(): number;

  readonly localChannelID: number;

  getLocalChannelID(): number;

  readonly remoteChannelID: number;

  getRemoteChannelID(): number;

  isIncoming(): boolean;

  registerForChannelCloseNotificationSelector(observer: interop.Object, inSelector: string): IOBluetoothUserNotification;

  handlePortMessage(message: NSPortMessage): void;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class IOBluetoothHostController extends NSObject {
  delegate: interop.Object;

  static defaultController<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  readonly powerState: interop.Enum<typeof BluetoothHCIPowerState>;

  classOfDevice(): number;

  setClassOfDeviceForTimeInterval(classOfDevice: number, seconds: number): number;

  addressAsString(): string;

  nameAsString(): string;
}

export declare class IOBluetoothDevicePair extends NSObject implements CBCentralManagerDelegate {
  delegate: interop.Object;

  static pairWithDevice<This extends abstract new (...args: any) => any>(this: This, device: IOBluetoothDevice): InstanceType<This>;

  start(): number;

  stop(): void;

  device(): IOBluetoothDevice;

  setDevice(inDevice: IOBluetoothDevice): void;

  replyPINCodePINCode(PINCodeSize: number, PINCode: interop.PointerConvertible): void;

  replyUserConfirmation(reply: boolean): void;

  centralManagerDidUpdateState(central: CBCentralManager): void;

  centralManagerWillRestoreState(central: CBCentralManager, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  centralManagerDidDiscoverPeripheralAdvertisementDataRSSI(central: CBCentralManager, peripheral: CBPeripheral, advertisementData: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, RSSI: NSNumber): void;

  centralManagerDidConnectPeripheral(central: CBCentralManager, peripheral: CBPeripheral): void;

  centralManagerDidFailToConnectPeripheralError(central: CBCentralManager, peripheral: CBPeripheral, error: NSError | null): void;

  centralManagerDidDisconnectPeripheralError(central: CBCentralManager, peripheral: CBPeripheral, error: NSError | null): void;

  centralManagerDidDisconnectPeripheralTimestampIsReconnectingError(central: CBCentralManager, peripheral: CBPeripheral, timestamp: number, isReconnecting: boolean, error: NSError | null): void;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class IOBluetoothHandsFreeDevice extends IOBluetoothHandsFree {
  initWithDeviceDelegate(device: IOBluetoothDevice, inDelegate: IOBluetoothHandsFreeDelegate): this;
  initWithDeviceDelegate(device: IOBluetoothDevice, delegate: interop.Object): this;

  dialNumber(aNumber: string): void;

  memoryDial(memoryLocation: number): void;

  redial(): void;

  endCall(): void;

  acceptCall(): void;

  acceptCallOnPhone(): void;

  sendDTMF(character: string): void;

  subscriberNumber(): void;

  currentCallList(): void;

  releaseHeldCalls(): void;

  releaseActiveCalls(): void;

  releaseCall(index: number): void;

  holdCall(): void;

  placeAllOthersOnHold(index: number): void;

  addHeldCall(): void;

  callTransfer(): void;

  transferAudioToComputer(): void;

  transferAudioToPhone(): void;

  sendSMSMessage(aNumber: string, aMessage: string): void;

  sendATCommand(atCommand: string): void;

  sendATCommandTimeoutSelectorTarget(atCommand: string, timeout: number, selector: string, target: interop.Object): void;
}

export declare class IOBluetoothSDPUUID extends NSData {
  static uuidWithBytesLength<This extends abstract new (...args: any) => any>(this: This, bytes: interop.PointerConvertible, length: number): InstanceType<This>;

  static uuidWithData<This extends abstract new (...args: any) => any>(this: This, data: NSData): InstanceType<This>;

  static uuid16<This extends abstract new (...args: any) => any>(this: This, uuid16: number): InstanceType<This>;

  static uuid32<This extends abstract new (...args: any) => any>(this: This, uuid32: number): InstanceType<This>;

  static withSDPUUIDRef<This extends abstract new (...args: any) => any>(this: This, sdpUUIDRef: interop.Object): InstanceType<This>;

  initWithUUID16(uuid16: number): this;

  initWithUUID32(uuid32: number): this;

  getSDPUUIDRef(): interop.Object;

  getUUIDWithLength(newLength: number): this;

  isEqualToUUID(otherUUID: IOBluetoothSDPUUID): boolean;

  readonly classForCoder: interop.Pointer;

  readonly classForArchiver: interop.Pointer;

  readonly classForPortCoder: interop.Pointer;
}

export declare class IOBluetoothRFCOMMChannel extends IOBluetoothObject implements NSPortDelegate, NSStreamDelegate {
  static registerForChannelOpenNotificationsSelector(object: interop.Object, selector: string): IOBluetoothUserNotification;

  static registerForChannelOpenNotificationsSelectorWithChannelIDDirection(object: interop.Object, selector: string, channelID: number, inDirection: interop.Enum<typeof IOBluetoothUserNotificationChannelDirection>): IOBluetoothUserNotification;

  static withRFCOMMChannelRef<This extends abstract new (...args: any) => any>(this: This, rfcommChannelRef: interop.Object): InstanceType<This>;

  static withObjectID<This extends abstract new (...args: any) => any>(this: This, objectID: number): InstanceType<This>;

  getRFCOMMChannelRef(): interop.Object;

  closeChannel(): number;

  isOpen(): boolean;

  getMTU(): number;

  isTransmissionPaused(): boolean;

  writeLengthSleep(data: interop.PointerConvertible, length: number, sleep: boolean): number;

  writeAsyncLengthRefcon(data: interop.PointerConvertible, length: number, refcon: interop.PointerConvertible): number;

  writeSyncLength(data: interop.PointerConvertible, length: number): number;

  writeSimpleLengthSleepBytesSent(data: interop.PointerConvertible, length: number, sleep: boolean, numBytesSent: interop.PointerConvertible): number;

  setSerialParametersDataBitsParityStopBits(speed: number, nBits: number, parity: interop.Enum<typeof BluetoothRFCOMMParityType>, bitStop: number): number;

  sendRemoteLineStatus(lineStatus: interop.Enum<typeof BluetoothRFCOMMLineStatus>): number;

  setDelegate(delegate: interop.Object): number;

  delegate(): interop.Object;

  getChannelID(): number;

  isIncoming(): boolean;

  getDevice(): IOBluetoothDevice;

  getObjectID(): number;

  registerForChannelCloseNotificationSelector(observer: interop.Object, inSelector: string): IOBluetoothUserNotification;

  handlePortMessage(message: NSPortMessage): void;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;

  streamHandleEvent(aStream: NSStream, eventCode: interop.Enum<typeof NSStreamEvent>): void;
}

export declare class IOBluetoothHandsFreeAudioGateway extends IOBluetoothHandsFree {
  initWithDeviceDelegate(device: IOBluetoothDevice, inDelegate: IOBluetoothHandsFreeDelegate): this;
  initWithDeviceDelegate(device: IOBluetoothDevice, inDelegate: interop.Object): this;

  createIndicatorMinMaxCurrentValue(indicatorName: string, minValue: number, maxValue: number, currentValue: number): void;

  processATCommand(atCommand: string): void;

  sendOKResponse(): void;

  sendResponse(response: string): void;

  sendResponseWithOK(response: string, withOK: boolean): void;
}

export declare class OBEXSession extends NSObject {
  OBEXConnectMaxPacketLengthOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inFlags: number, inMaxPacketLength: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXDisconnectOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXPutHeadersDataHeadersDataLengthBodyDataBodyDataLengthEventSelectorSelectorTargetRefCon(isFinalChunk: number, inHeadersData: interop.PointerConvertible, inHeadersDataLength: number, inBodyData: interop.PointerConvertible, inBodyDataLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXGetHeadersHeadersLengthEventSelectorSelectorTargetRefCon(isFinalChunk: number, inHeaders: interop.PointerConvertible, inHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXAbortOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXSetPathConstantsOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inFlags: number, inConstants: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXConnectResponseFlagsMaxPacketLengthOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inResponseOpCode: number, inFlags: number, inMaxPacketLength: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXDisconnectResponseOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXPutResponseOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXGetResponseOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXAbortResponseOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  OBEXSetPathResponseOptionalHeadersOptionalHeadersLengthEventSelectorSelectorTargetRefCon(inResponseOpCode: number, inOptionalHeaders: interop.PointerConvertible, inOptionalHeadersLength: number, inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  getAvailableCommandPayloadLength(inOpCode: number): number;

  getAvailableCommandResponsePayloadLength(inOpCode: number): number;

  getMaxPacketLength(): number;

  hasOpenOBEXConnection(): boolean;

  setEventCallback(inEventCallback: (p1: interop.PointerConvertible) => void): void;

  setEventRefCon(inRefCon: interop.PointerConvertible): void;

  setEventSelectorTargetRefCon(inEventSelector: string, inEventSelectorTarget: interop.Object, inUserRefCon: interop.PointerConvertible): void;

  serverHandleIncomingData(event: interop.PointerConvertible): void;

  clientHandleIncomingData(event: interop.PointerConvertible): void;

  sendDataToTransportDataLength(inDataToSend: interop.PointerConvertible, inDataLength: number): number;

  openTransportConnectionSelectorTargetRefCon(inSelector: string, inTarget: interop.Object, inUserRefCon: interop.PointerConvertible): number;

  hasOpenTransportConnection(): number;

  closeTransportConnection(): number;
}

export declare class IOBluetoothSDPServiceRecord extends NSObject implements NSCoding, NSSecureCoding {
  static publishedServiceRecordWithDictionary<This extends abstract new (...args: any) => any>(this: This, serviceDict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): InstanceType<This>;

  removeServiceRecord(): number;

  static withServiceDictionaryDevice<This extends abstract new (...args: any) => any>(this: This, serviceDict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, device: IOBluetoothDevice): InstanceType<This>;

  initWithServiceDictionaryDevice(serviceDict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, device: IOBluetoothDevice): this;

  static withSDPServiceRecordRef<This extends abstract new (...args: any) => any>(this: This, sdpServiceRecordRef: interop.Object): InstanceType<This>;

  getSDPServiceRecordRef(): interop.Object;

  readonly device: IOBluetoothDevice;

  getDevice(): IOBluetoothDevice;

  readonly attributes: NSDictionary;

  getAttributes(): NSDictionary;

  getAttributeDataElement(attributeID: number): IOBluetoothSDPDataElement;

  getServiceName(): string;

  getRFCOMMChannelID(rfcommChannelID: interop.PointerConvertible): number;

  getL2CAPPSM(outPSM: interop.PointerConvertible): number;

  getServiceRecordHandle(outServiceRecordHandle: interop.PointerConvertible): number;

  matchesUUID16(uuid16: number): boolean;

  matchesUUIDArray(uuidArray: NSArray<interop.Object> | Array<interop.Object>): boolean;

  matchesSearchArray(searchArray: NSArray<interop.Object> | Array<interop.Object>): boolean;

  hasServiceFromArray(array: NSArray<interop.Object> | Array<interop.Object>): boolean;

  readonly sortedAttributes: NSArray;

  handsFreeSupportedFeatures(): number;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  static readonly supportsSecureCoding: boolean;
}

export declare class IOBluetoothDevice extends IOBluetoothObject implements NSCoding, NSSecureCoding {
  static registerForConnectNotificationsSelector(observer: interop.Object, inSelector: string): IOBluetoothUserNotification;

  registerForDisconnectNotificationSelector(observer: interop.Object, inSelector: string): IOBluetoothUserNotification;

  static deviceWithAddress<This extends abstract new (...args: any) => any>(this: This, address: interop.PointerConvertible): InstanceType<This>;

  static withAddress<This extends abstract new (...args: any) => any>(this: This, address: interop.PointerConvertible): InstanceType<This>;

  static deviceWithAddressString<This extends abstract new (...args: any) => any>(this: This, address: string): InstanceType<This>;

  static withDeviceRef<This extends abstract new (...args: any) => any>(this: This, deviceRef: interop.Object): InstanceType<This>;

  getDeviceRef(): interop.Object;

  openL2CAPChannelSyncWithPSMDelegate(newChannel: interop.PointerConvertible, psm: number, channelDelegate: interop.Object): number;

  openL2CAPChannelAsyncWithPSMDelegate(newChannel: interop.PointerConvertible, psm: number, channelDelegate: interop.Object): number;

  openL2CAPChannelFindExistingNewChannel(psm: number, findExisting: boolean, newChannel: interop.PointerConvertible): number;

  sendL2CAPEchoRequestLength(data: interop.PointerConvertible, length: number): number;

  openRFCOMMChannelChannel(channelID: number, rfcommChannel: interop.PointerConvertible): number;

  openRFCOMMChannelSyncWithChannelIDDelegate(rfcommChannel: interop.PointerConvertible, channelID: number, channelDelegate: interop.Object): number;

  openRFCOMMChannelAsyncWithChannelIDDelegate(rfcommChannel: interop.PointerConvertible, channelID: number, channelDelegate: interop.Object): number;

  readonly classOfDevice: number;

  getClassOfDevice(): number;

  readonly serviceClassMajor: number;

  getServiceClassMajor(): number;

  readonly deviceClassMajor: number;

  getDeviceClassMajor(): number;

  readonly deviceClassMinor: number;

  getDeviceClassMinor(): number;

  readonly name: string;

  getName(): string;

  readonly nameOrAddress: string;

  getNameOrAddress(): string;

  readonly lastNameUpdate: NSDate;

  getLastNameUpdate(): NSDate;

  getAddress(): interop.Pointer;

  readonly addressString: string;

  getAddressString(): string;

  getPageScanRepetitionMode(): number;

  getPageScanPeriodMode(): number;

  getPageScanMode(): number;

  getClockOffset(): number;

  getLastInquiryUpdate(): NSDate;

  RSSI(): number;

  rawRSSI(): number;

  isConnected(): boolean;

  openConnection(): number;

  openConnection(target: interop.Object): number;

  openConnectionWithPageTimeoutAuthenticationRequired(target: interop.Object, pageTimeoutValue: number, authenticationRequired: boolean): number;

  closeConnection(): number;

  remoteNameRequest(target: interop.Object): number;

  remoteNameRequestWithPageTimeout(target: interop.Object, pageTimeoutValue: number): number;

  requestAuthentication(): number;

  readonly connectionHandle: number;

  getConnectionHandle(): number;

  isIncoming(): boolean;

  getLinkType(): number;

  getEncryptionMode(): number;

  performSDPQuery(target: interop.Object): number;

  performSDPQueryUuids(target: interop.Object, uuidArray: NSArray<interop.Object> | Array<interop.Object>): number;

  readonly services: NSArray;

  getServices(): NSArray;

  getLastServicesUpdate(): NSDate;

  getServiceRecordForUUID(sdpUUID: IOBluetoothSDPUUID): IOBluetoothSDPServiceRecord;

  static favoriteDevices(): NSArray;

  isFavorite(): boolean;

  addToFavorites(): number;

  removeFromFavorites(): number;

  static recentDevices(numDevices: number): NSArray;

  recentAccessDate(): NSDate;

  static pairedDevices(): NSArray;

  isPaired(): boolean;

  setSupervisionTimeout(timeout: number): number;

  openL2CAPChannelSyncWithPSMWithConfigurationDelegate(newChannel: interop.PointerConvertible, psm: number, channelConfiguration: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, channelDelegate: interop.Object): number;

  openL2CAPChannelAsyncWithPSMWithConfigurationDelegate(newChannel: interop.PointerConvertible, psm: number, channelConfiguration: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, channelDelegate: interop.Object): number;

  awakeAfterUsingCoder(coder: NSCoder): interop.Object;

  handsFreeAudioGatewayDriverID(): string;

  handsFreeAudioGatewayServiceRecord(): IOBluetoothSDPServiceRecord;

  readonly handsFreeAudioGateway: boolean;

  handsFreeDeviceDriverID(): string;

  handsFreeDeviceServiceRecord(): IOBluetoothSDPServiceRecord;

  readonly handsFreeDevice: boolean;

  isHandsFreeAudioGateway(): boolean;

  isHandsFreeDevice(): boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  static readonly supportsSecureCoding: boolean;
}

export declare class IOBluetoothObject extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class IOBluetoothSDPServiceAttribute extends NSObject implements NSCoding, NSSecureCoding {
  static withIDAttributeElementValue<This extends abstract new (...args: any) => any>(this: This, newAttributeID: number, attributeElementValue: NSObject): InstanceType<This>;

  static withIDAttributeElement<This extends abstract new (...args: any) => any>(this: This, newAttributeID: number, attributeElement: IOBluetoothSDPDataElement): InstanceType<This>;

  initWithIDAttributeElementValue(newAttributeID: number, attributeElementValue: NSObject): this;

  initWithIDAttributeElement(newAttributeID: number, attributeElement: IOBluetoothSDPDataElement): this;

  getAttributeID(): number;

  getDataElement(): IOBluetoothSDPDataElement;

  getIDDataElement(): IOBluetoothSDPDataElement;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  static readonly supportsSecureCoding: boolean;
}

export declare class IOBluetoothHandsFree extends NSObject {
  supportedFeatures: number;

  inputVolume: number;

  inputMuted: boolean;

  outputVolume: number;

  outputMuted: boolean;

  readonly device: IOBluetoothDevice;

  readonly deviceSupportedFeatures: number;

  readonly deviceSupportedSMSServices: number;

  readonly deviceCallHoldModes: number;

  readonly SMSMode: interop.Enum<typeof IOBluetoothSMSMode>;

  readonly SMSEnabled: boolean;

  delegate: IOBluetoothHandsFreeDelegate;

  indicator(indicatorName: string): number;

  setIndicatorValue(indicatorName: string, indicatorValue: number): void;

  initWithDeviceDelegate(device: IOBluetoothDevice, inDelegate: IOBluetoothHandsFreeDelegate): this;

  connect(): void;

  disconnect(): void;

  readonly connected: boolean;

  connectSCO(): void;

  disconnectSCO(): void;

  isSCOConnected(): boolean;

  isInputMuted(): boolean;

  isOutputMuted(): boolean;

  isSMSEnabled(): boolean;

  isConnected(): boolean;
}

export declare class IOBluetoothSDPDataElement extends NSObject implements NSCoding, NSSecureCoding {
  static withElementValue<This extends abstract new (...args: any) => any>(this: This, element: NSObject): InstanceType<This>;

  static withTypeSizeDescriptorSizeValue<This extends abstract new (...args: any) => any>(this: This, type: number, newSizeDescriptor: number, newSize: number, newValue: NSObject): InstanceType<This>;

  static withSDPDataElementRef<This extends abstract new (...args: any) => any>(this: This, sdpDataElementRef: interop.Object): InstanceType<This>;

  initWithElementValue(element: NSObject): this;

  initWithTypeSizeDescriptorSizeValue(newType: number, newSizeDescriptor: number, newSize: number, newValue: NSObject): this;

  getSDPDataElementRef(): interop.Object;

  getTypeDescriptor(): number;

  getSizeDescriptor(): number;

  getSize(): number;

  getNumberValue(): NSNumber;

  getDataValue(): NSData;

  getStringValue(): string;

  getArrayValue(): NSArray;

  getUUIDValue(): IOBluetoothSDPUUID;

  getValue(): NSObject;

  containsDataElement(dataElement: IOBluetoothSDPDataElement): boolean;

  containsValue(cmpValue: NSObject): boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  static readonly supportsSecureCoding: boolean;
}

export declare class IOBluetoothDeviceInquiry extends NSObject {
  delegate: interop.Object;

  static inquiryWithDelegate<This extends abstract new (...args: any) => any>(this: This, delegate: interop.Object): InstanceType<This>;

  initWithDelegate(delegate: interop.Object): this;

  start(): number;

  stop(): number;

  inquiryLength: number;

  searchType: number;

  updateNewDeviceNames: boolean;

  foundDevices(): NSArray;

  clearFoundDevices(): void;

  setSearchCriteriaMajorDeviceClassMinorDeviceClass(inServiceClassMajor: number, inMajorDeviceClass: number, inMinorDeviceClass: number): void;
}

export declare class IOBluetoothUserNotification extends NSObject {
  unregister(): void;
}
