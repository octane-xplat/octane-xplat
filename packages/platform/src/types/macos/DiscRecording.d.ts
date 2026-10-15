import type { NSArray, NSData, NSDictionary } from './Foundation'

import type { NumVersion } from './Runtime'

import type { interop } from './objc-runtime'

import { NSFormatter, NSNumber } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const DRDeviceMediaTypeKey: string;

export declare const kDRStatusCurrentSessionKey: interop.Pointer;

export declare const kDRErrorStatusAdditionalSenseStringKey: interop.Pointer;

export declare const DRIndexPointsKey: string;

export declare const DRDeviceCanWriteDVDRWKey: string;

export declare const DRErrorStatusErrorStringKey: string;

export declare const DRDeviceIsBusyKey: string;

export declare const DRMediaCatalogNumberKey: string;

export declare const DRUDFWriteVersion: string;

export declare const kDRErrorStatusErrorKey: interop.Pointer;

export declare const DRDeviceMaximumWriteSpeedKey: string;

export declare const DRDeviceMediaFreeSpaceKey: string;

export declare const kDRCDTextGenreCodeErotic: number;

export declare const DRDeviceCanWriteCDKey: string;

export declare const kDRStatusStateVerifying: interop.Pointer;

export declare const DRCDTextGenreCodeHipHop: number;

export declare const DRErrorStatusErrorKey: string;

export declare const DRErrorStatusKey: string;

export declare const DRStatusStateSessionOpen: string;

export declare const DRStatusStateDone: string;

export declare const DRStatusStatePreparing: string;

export declare const DRStatusStateNone: string;

export declare const DRStatusEraseTypeKey: string;

export declare const DRStatusCurrentSpeedKey: string;

export declare const DRStatusTotalSessionsKey: string;

export declare const DRStatusPercentCompleteKey: string;

export declare const DRStatusStateKey: string;

export declare const DRFileForkData: number;

export declare const DRLinkTypeFinderAlias: string;

export declare const DRLinkTypeSymbolicLink: string;

export declare const DRUDFRealTimeFile: string;

export declare const DRUDFVolumeSetImplementationUse: string;

export declare const DRUDFVolumeSetTimestamp: string;

export declare const DRUDFApplicationIdentifierSuffix: string;

export declare const DRUDFMaxVolumeSequenceNumber: string;

export declare const DRUDFVolumeSequenceNumber: string;

export declare const DRUDFVersion150: string;

export declare const DRMacFinderHideExtension: string;

export declare const DRMacExtendedFinderFlags: string;

export declare const DRMacFinderFlags: string;

export declare const DRMacScrollPosition: string;

export declare const DRMacWindowBounds: string;

export declare const DRMacFileCreator: string;

export declare const DRPosixFileMode: string;

export declare const DREffectiveDate: string;

export declare const DRBackupDate: string;

export declare const DRAttributeModificationDate: string;

export declare const DRInvisible: string;

export declare const DRUDF: string;

export declare const DRHFSPlus: string;

export declare const DRISO9660LevelTwo: string;

export declare const DRISO9660LevelOne: string;

export declare const DRFilesystemInclusionMaskISO9660: number;

export declare const DREraseTypeQuick: string;

export declare const DRCDTextSizeKey: string;

export declare const DRCDTextTOC2Key: string;

export declare const DRCDTextGenreCodeKey: string;

export declare const DRCDTextDiscIdentKey: string;

export declare const DRCDTextPerformerKey: string;

export declare const DRCDTextCopyrightAssertedForTitlesKey: string;

export declare const DRCDTextCopyrightAssertedForNamesKey: string;

export declare const DRCDTextGenreCodeWorldMusic: number;

export declare const DRCDTextGenreCodeSpokenWord: number;

export declare const DRCDTextGenreCodeSoundEffects: number;

export declare const DRCDTextGenreCodeRhythmAndBlues: number;

export declare const DRCDTextGenreCodeReggae: number;

export declare const DRCDTextGenreCodeOperetta: number;

export declare const DRCDTextGenreCodeErotic: number;

export declare const DRCDTextGenreCodeEasyListening: number;

export declare const DRCDTextGenreCodeAlternativeRock: number;

export declare const DRCDTextGenreCodeAdultContemporary: number;

export declare const DRCDTextGenreCodeUnknown: number;

export declare const DRBurnStrategyCDTAO: string;

export declare const DRBurnFailureActionNone: string;

export declare const DRBurnStrategyIsRequiredKey: string;

export declare const DRBurnTestingKey: string;

export declare const DRBurnUnderrunProtectionKey: string;

export declare const DRBurnVerifyDiscKey: string;

export declare const DRFilesystemInclusionMaskJoliet: number;

export declare const DRBurnOverwriteDiscKey: string;

export declare const DRBurnRequestedSpeedKey: string;

export declare const DRSubchannelDataFormPack: string;

export declare const DRVolumeExpirationDate: string;

export declare const DRVolumeCheckedDate: string;

export declare const DRVolumeModificationDate: string;

export declare const DRDefaultDate: string;

export declare const DRBlockSize: string;

export declare const DRSystemIdentifier: string;

export declare const DRDataPreparer: string;

export declare const DRPublisher: string;

export declare const DRVolumeSet: string;

export declare const DRISOLevel: string;

export declare const DRTrackPacketTypeFixed: string;

export declare const DRTrackTypeReserved: string;

export declare const DRTrackTypeIncomplete: string;

export declare const DRTrackTypeKey: string;

export declare const DRSessionNumberKey: string;

export declare const DRTrackStartAddressKey: string;

export declare const DRNextWritableAddressKey: string;

export declare const DRVerificationTypeNone: string;

export declare const DRVerificationTypeReceiveData: string;

export declare const DRTrackISRCKey: string;

export declare const DRPreGapIsRequiredKey: string;

export declare const DRPreGapLengthKey: string;

export declare const DRMaxBurnSpeedKey: string;

export declare const DRVerificationTypeKey: string;

export declare const DRBlockSizeKey: string;

export declare const DRDeviceMediaTypeUnknown: string;

export declare const DRDeviceMediaTypeHDDVDRWDualLayer: string;

export declare const DRDeviceMediaTypeHDDVDRAM: string;

export declare const DRDeviceMediaTypeHDDVDRDualLayer: string;

export declare const DRDeviceMediaTypeHDDVDR: string;

export declare const DRDeviceMediaTypeBDROM: string;

export declare const DRDeviceMediaTypeDVDPlusRWDoubleLayer: string;

export declare const DRDeviceMediaTypeDVDPlusRDoubleLayer: string;

export declare const DRDeviceMediaTypeDVDPlusR: string;

export declare const DRDeviceMediaTypeDVDRW: string;

export declare const DRDeviceMediaTypeDVDR: string;

export declare const DRDeviceMediaClassUnknown: string;

export declare const DRDeviceMediaClassDVD: string;

export declare const DRDeviceMediaClassKey: string;

export declare const DRDeviceMediaTrackCountKey: string;

export declare const DRDeviceMediaBlocksFreeKey: string;

export declare const DRDeviceMediaBlocksOverwritableKey: string;

export declare const DRDeviceMediaUsedSpaceKey: string;

export declare const DRDeviceMediaIsErasableKey: string;

export declare const DRDeviceMediaIsOverwritableKey: string;

export declare const DRDeviceMediaIsAppendableKey: string;

export declare const DRDeviceMediaStateInTransition: string;

export declare const DRDeviceMediaStateMediaPresent: string;

export declare const DRDeviceBurnSpeedsKey: string;

export declare const DRDeviceMediaInfoKey: string;

export declare const DRDeviceCanTestWriteDVDKey: string;

export declare const DRDeviceCanWriteCDSAOKey: string;

export declare const DRDeviceCanWriteCDTextKey: string;

export declare const DRDeviceCanWriteHDDVDRWDualLayerKey: string;

export declare const DRDeviceCanWriteHDDVDRWKey: string;

export declare const DRDeviceCanWriteHDDVDRDualLayerKey: string;

export declare const DRDeviceCanWriteDVDPlusRWKey: string;

export declare const DRDeviceCanWriteDVDPlusRKey: string;

export declare const DRDeviceCanWriteDVDRAMKey: string;

export declare const DRDeviceCanWriteDVDRKey: string;

export declare const DRDeviceCanWriteCDRWKey: string;

export declare const DRDeviceCanWriteKey: string;

export declare const DRDevicePhysicalInterconnectLocationExternal: string;

export declare const DRDevicePhysicalInterconnectUSB: string;

export declare const DRDevicePhysicalInterconnectFireWire: string;

export declare const DRDevicePhysicalInterconnectFibreChannel: string;

export declare const DRDeviceSupportLevelAppleShipping: string;

export declare const DRDeviceSupportLevelVendorSupported: string;

export declare const DRDeviceSupportLevelNone: string;

export declare const DRDeviceLoadingMechanismCanInjectKey: string;

export declare const DRDevicePhysicalInterconnectLocationKey: string;

export declare const DRDeviceFirmwareRevisionKey: string;

export declare const DRDeviceProductNameKey: string;

export declare const DRDeviceIORegistryEntryPathKey: string;

export declare const DRDeviceSupportLevelKey: string;

export declare const DRDeviceBurnSpeedDVD1x: number;

export declare const kDRUDFVolumeSetTimestamp: interop.Pointer;

export declare const kDRUDFVolumeSetIdentifier: interop.Pointer;

export declare const kDRUDFApplicationIdentifierSuffix: interop.Pointer;

export declare const kDRUDFMaxInterchangeLevel: interop.Pointer;

export declare const kDRUDFMaxVolumeSequenceNumber: interop.Pointer;

export declare const kDRUDFPrimaryVolumeDescriptorNumber: interop.Pointer;

export declare const kDRUDFVersion102: interop.Pointer;

export declare const kDRUDFWriteVersion: interop.Pointer;

export declare const kDRMacExtendedFinderFlags: interop.Pointer;

export declare const kDRMacIconLocation: interop.Pointer;

export declare const kDRHFSPlusCatalogNodeID: interop.Pointer;

export declare const kDRHFSPlusTextEncodingHint: interop.Pointer;

export declare const kDRPosixGID: interop.Pointer;

export declare const DRAllFilesystems: string;

export declare const kDRPosixFileMode: interop.Pointer;

export declare const kDRRecordingDate: interop.Pointer;

export declare const kDRAttributeModificationDate: interop.Pointer;

export declare const kDRCreationDate: interop.Pointer;

export declare const kDRISO9660VersionNumber: interop.Pointer;

export declare const kDRUDF: interop.Pointer;

export declare const kDRHFSPlus: interop.Pointer;

export declare const kDRJoliet: interop.Pointer;

export declare const kDRISO9660LevelTwo: interop.Pointer;

export declare const kDRAllFilesystems: interop.Pointer;

export declare const kDRISOMacExtensions: interop.Pointer;

export declare const kDRVolumeEffectiveDate: interop.Pointer;

export declare const kDRVolumeCheckedDate: interop.Pointer;

export declare const kDRVolumeCreationDate: interop.Pointer;

export declare const kDRDefaultDate: interop.Pointer;

export declare const kDRBlockSize: interop.Pointer;

export declare const kDRAbstractFile: interop.Pointer;

export declare const kDRApplicationIdentifier: interop.Pointer;

export declare const kDRSystemIdentifier: interop.Pointer;

export declare const kDRDataPreparer: interop.Pointer;

export declare const kDRPublisher: interop.Pointer;

export declare const kDRVolumeSet: interop.Pointer;

export declare const kDRFileForkSizeEstimate: number;

export declare const kDRFileForkResource: number;

export declare const kDRFileMessagePostBurn: number;

export declare const kDRFileMessageVerificationStarting: number;

export declare const kDRFileMessageProduceData: number;

export declare const kDRLinkTypeSymbolicLink: number;

export declare const kDRFilesystemMaskJoliet: number;

export declare const kDRStatusProgressCurrentXFactor: interop.Pointer;

export declare const kDRStatusProgressCurrentKPS: interop.Pointer;

export declare const DRTrackPacketTypeKey: string;

export declare const kDRStatusStateFinishing: interop.Pointer;

export declare const kDRStatusStateSessionOpen: interop.Pointer;

export declare const kDRStatusStateDone: interop.Pointer;

export declare const kDRStatusEraseTypeKey: interop.Pointer;

export declare const kDRStatusPercentCompleteKey: interop.Pointer;

export declare const kDRErrorStatusErrorStringKey: interop.Pointer;

export declare const DRBurnStrategyKey: string;

export declare const kDRErrorStatusKey: interop.Pointer;

export declare const kDRDevicePreGapLengthNotValidErr: number;

export declare const kDRDeviceCantWriteISRCErr: number;

export declare const kDRDeviceCantWriteCDTextErr: number;

export declare const kDRTooManyNameConflictsErr: number;

export declare const kDRTrackReusedErr: number;

export declare const kDRBurnMediaWriteFailureErr: number;

export declare const kDRAudioFileNotSupportedErr: number;

export declare const kDRInvalidIndexPointsErr: number;

export declare const kDRSpeedTestAlreadyRunningErr: number;

export declare const kDRFunctionNotSupportedErr: number;

export declare const kDRUserCanceledErr: number;

export declare const kDRBadLayoutErr: number;

export declare const kDRTooManyTracksForDVDErr: number;

export declare const kDRVerificationFailedErr: number;

export declare const kDRDataProductionErr: number;

export declare const kDRBurnNotAllowedErr: number;

export declare const kDRBurnUnderrunErr: number;

export declare const kDRDeviceNotReadyErr: number;

export declare const kDRDeviceInvalidErr: number;

export declare const kDRDeviceAccessErr: number;

export declare const kDREraseTypeQuick: interop.Pointer;

export declare const kDRCDTextSizeKey: interop.Pointer;

export declare const kDRCDTextTOC2Key: interop.Pointer;

export declare const kDRCDTextMCNISRCKey: interop.Pointer;

export declare const kDRCDTextGenreCodeKey: interop.Pointer;

export declare const kDRCDTextDiscIdentKey: interop.Pointer;

export declare const kDRCDTextArrangerKey: interop.Pointer;

export declare const kDRCDTextCopyrightAssertedForTitlesKey: interop.Pointer;

export declare const kDRCDTextCopyrightAssertedForNamesKey: interop.Pointer;

export declare const kDRCDTextCopyrightAssertedForSpecialMessagesKey: interop.Pointer;

export declare const kDRCDTextCFStringEncodingKey: interop.Pointer;

export declare const kDRCDTextCharacterCodeKey: interop.Pointer;

export declare const kDRCDTextGenreCodeSpokenWord: number;

export declare const kDRCDTextGenreCodeRhythmAndBlues: number;

export declare const kDRCDTextGenreCodeOperetta: number;

export declare const kDRCDTextGenreCodeNewAge: number;

export declare const kDRCDTextGenreCodeMusical: number;

export declare const kDRCDTextGenreCodeFolk: number;

export declare const kDRCDTextGenreCodeCountry: number;

export declare const kDRCDTextGenreCodeClassical: number;

export declare const kDRCDTextGenreCodeChildrens: number;

export declare const kDRCDTextGenreCodeUnknown: number;

export declare const kDRBurnStrategyCDSAO: interop.Pointer;

export declare const kDRBurnFailureActionNone: interop.Pointer;

export declare const kDRBurnFailureActionEject: interop.Pointer;

export declare const kDRCDTextKey: interop.Pointer;

export declare const kDRMediaCatalogNumberKey: interop.Pointer;

export declare const kDRBurnFailureActionKey: interop.Pointer;

export declare const kDRBurnCompletionActionKey: interop.Pointer;

export declare const kDRBurnOverwriteDiscKey: interop.Pointer;

export declare const kDRBurnAppendableKey: interop.Pointer;

export declare const kDRBurnStatusChangedNotification: interop.Pointer;

export declare const kDRTrackMessageVerifyPreGap: number;

export declare const kDRTrackMessageProducePreGap: number;

export declare const kDRTrackMessagePostBurn: number;

export declare const kDRTrackMessageVerificationDone: number;

export declare const kDRTrackMessagePreBurn: number;

export declare const kDRFlagNoMoreData: number;

export declare const kDRFlagSubchannelDataRequested: number;

export declare const kDRSessionFormatDVDData: number;

export declare const kDRSessionFormatCDXA: number;

export declare const kDRSessionFormatMode1Data: number;

export declare const kDRTrackMode2Form1Data: number;

export declare const kDRTrackMode1Data: number;

export declare const kDRDataFormMode2Form2Data: number;

export declare const kDRDataFormMode2Form1Data: number;

export declare const kDRDataFormAudio: number;

export declare const kDRBlockTypeDVDData: number;

export declare const kDRBlockSizeDVDData: number;

export declare const kDRBlockSizeMode2Data: number;

export declare const kDRBlockSizeMode1Data: number;

export declare const kDRBlockSizeAudio: number;

export declare const kDRSubchannelDataFormPack: interop.Pointer;

export declare const kDRSubchannelDataFormKey: interop.Pointer;

export declare const DRDeviceCanWriteDVDRWDualLayerKey: string;

export declare const kDRTrackPacketTypeVariable: interop.Pointer;

export declare const kDRSessionNumberKey: interop.Pointer;

export declare const kDRSCMSCopyrightFree: interop.Pointer;

export declare const kDRVerificationTypeNone: interop.Pointer;

export declare const kDRAudioFourChannelKey: interop.Pointer;

export declare const kDRIndexPointsKey: interop.Pointer;

export declare const kDRBufferZone1DataKey: interop.Pointer;

export declare const kDRDVDTimestampKey: interop.Pointer;

export declare const kDRVerificationTypeKey: interop.Pointer;

export declare const kDRBlockTypeKey: interop.Pointer;

export declare const kDRTrackLengthKey: interop.Pointer;

export declare const kDRDeviceBurnSpeedDVD1x: number;

export declare const kDRDeviceBurnSpeedCD1x: number;

export declare const kDRDeviceMediaTypeHDDVDRWDualLayer: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDPlusRW: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDPlusRDoubleLayer: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDPlusR: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDRWDualLayer: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDRW: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDRDualLayer: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDR: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDRAM: interop.Pointer;

export declare const kDRDeviceMediaTypeCDRW: interop.Pointer;

export declare const kDRDeviceMediaClassUnknown: interop.Pointer;

export declare const kDRDeviceMediaClassHDDVD: interop.Pointer;

export declare const kDRDeviceMediaClassBD: interop.Pointer;

export declare const kDRDeviceMediaTypeKey: interop.Pointer;

export declare const kDRDeviceMediaClassKey: interop.Pointer;

export declare const kDRDeviceMediaSessionCountKey: interop.Pointer;

export declare const kDRDeviceMediaTrackCountKey: interop.Pointer;

export declare const kDRDeviceMediaDoubleLayerL0DataZoneBlocksKey: interop.Pointer;

export declare const kDRDeviceMediaBlocksUsedKey: interop.Pointer;

export declare const kDRDeviceMediaBlocksOverwritableKey: interop.Pointer;

export declare const kDRDeviceMediaIsReservedKey: interop.Pointer;

export declare const kDRDeviceMediaIsErasableKey: interop.Pointer;

export declare const kDRDeviceMediaIsAppendableKey: interop.Pointer;

export declare const kDRDeviceTrackInfoKey: interop.Pointer;

export declare const kDRDeviceBurnSpeedsKey: interop.Pointer;

export declare const kDRDeviceMediaInfoKey: interop.Pointer;

export declare const kDRMediaNotPresentErr: number;

export declare const kDRDeviceMediaStateKey: interop.Pointer;

export declare const kDRDeviceMaximumWriteSpeedKey: interop.Pointer;

export declare const DRDeviceBurnSpeedBD1x: number;

export declare const kDRDeviceIsBusyKey: interop.Pointer;

export declare const kDRDeviceCanTestWriteCDKey: interop.Pointer;

export declare const kDRDeviceCanWriteCDSAOKey: interop.Pointer;

export declare const kDRDeviceCanWriteCDTAOKey: interop.Pointer;

export declare const kDRDeviceCanWriteIndexPointsKey: interop.Pointer;

export declare const kDRDeviceCanWriteCDTextKey: interop.Pointer;

export declare const kDRDeviceCanWriteHDDVDRWDualLayerKey: interop.Pointer;

export declare const kDRDeviceCanWriteHDDVDRWKey: interop.Pointer;

export declare const kDRDeviceCanWriteHDDVDKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDPlusRWDoubleLayerKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDPlusRWKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDPlusRDoubleLayerKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDPlusRKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDRAMKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDRWDualLayerKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDRWKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDRDualLayerKey: interop.Pointer;

export declare const kDRDeviceCanWriteDVDKey: interop.Pointer;

export declare const kDRDeviceCanWriteCDRWKey: interop.Pointer;

export declare const kDRDevicePhysicalInterconnectLocationInternal: interop.Pointer;

export declare const kDRDevicePhysicalInterconnectUSB: interop.Pointer;

export declare const kDRDevicePhysicalInterconnectATAPI: interop.Pointer;

export declare const kDRDeviceLoadingMechanismCanOpenKey: interop.Pointer;

export declare const kDRDeviceLoadingMechanismCanInjectKey: interop.Pointer;

export declare const kDRDeviceLoadingMechanismCanEjectKey: interop.Pointer;

export declare const kDRDevicePhysicalInterconnectLocationKey: interop.Pointer;

export declare const DRSessionFormatKey: string;

export declare const kDRDeviceProductNameKey: interop.Pointer;

export declare const kDRDeviceIORegistryEntryPathKey: interop.Pointer;

export declare const kDRTrackTypeIncomplete: interop.Pointer;

export declare const kDRDeviceSupportLevelKey: interop.Pointer;

export declare const kDRDeviceStatusChangedNotification: interop.Pointer;

export declare const kDRDeviceAppearedNotification: interop.Pointer;

export declare const kDRRefConCFTypeCallbacks: DRRefConCallbacks;

export declare const kDRAccessDate: interop.Pointer;

export declare const DRDevicePhysicalInterconnectATAPI: string;

export declare const DRFilesystemInclusionMaskHFSPlus: number;

export declare const DRDeviceSupportLevelUnsupported: string;

export declare const kDRDeviceMediaTypeBDROM: interop.Pointer;

export declare const DRErrorStatusSenseKey: string;

export declare const kDRStatusStateTrackWrite: interop.Pointer;

export declare const DRCDTextGenreCodeClassical: number;

export declare const DRTrackLengthKey: string;

export declare const kDRMediaBusyErr: number;

export declare const kDRDataFormKey: interop.Pointer;

export declare const DRDeviceMediaTypeCDROM: string;

export declare const DRAudioPreEmphasisKey: string;

export declare const kDRVerificationTypeReceiveData: interop.Pointer;

export declare const kDRBurnDoubleLayerL0DataZoneBlocksKey: interop.Pointer;

export declare const DRBurnFailureActionKey: string;

export declare const kDRDeviceCanWriteDVDDAOKey: interop.Pointer;

export declare const DRDeviceMediaTypeDVDRAM: string;

export declare const kDRCDTextGenreCodeRap: number;

export declare const kDRDeviceCanWriteCDRawKey: interop.Pointer;

export declare const DRDeviceWriteCapabilitiesKey: string;

export declare const DRBurnCompletionActionEject: string;

export declare const DRSCMSCopyrightFree: string;

export declare const kDRDevicePhysicalInterconnectLocationExternal: interop.Pointer;

export declare const kDRDeviceNotSupportedErr: number;

export declare const kDRCDTextGenreKey: interop.Pointer;

export declare const kDRTrackMode2Form2Data: number;

export declare const DRDeviceCanWriteDVDDAOKey: string;

export declare const DRHFSPlusTextEncodingHint: string;

export declare const DRStatusStateVerifying: string;

export declare const DRApplicationIdentifier: string;

export declare const kDRDeviceSupportLevelAppleShipping: interop.Pointer;

export declare const kDRCDTextSongwriterKey: interop.Pointer;

export declare const DRTrackTypeInvisible: string;

export declare const kDRStatusStateFailed: interop.Pointer;

export declare const kDRMacFinderHideExtension: interop.Pointer;

export declare const kDRDeviceMediaTypeBDR: interop.Pointer;

export declare const kDRCDTextGenreCodeOpera: number;

export declare const DRPosixUID: string;

export declare const kDRDoubleLayerL0AlreadySpecifiedErr: number;

export declare const DRDVDCopyrightInfoKey: string;

export declare const DRDeviceDisappearedNotification: string;

export declare const DRDeviceMediaTypeDVDRDualLayer: string;

export declare const kDRBurnStrategyDVDDAO: interop.Pointer;

export declare const kDRSubchannelDataFormRaw: interop.Pointer;

export declare const kDRDataFormDVDData: number;

export declare const DRStatusStateFinishing: string;

export declare const kDRBlockSizeKey: interop.Pointer;

export declare const DRVolumeCreationDate: string;

export declare const kDRCDTextGenreCodePop: number;

export declare const kDRCDTextTitleKey: interop.Pointer;

export declare const DRCDTextMCNISRCKey: string;

export declare const kDRDeviceCanWriteBDRKey: interop.Pointer;

export declare const kDRCDTextGenreCodeSoundEffects: number;

export declare const kDRBurnPowerCalibrationErr: number;

export declare const kDRDeviceCanWriteCDRKey: interop.Pointer;

export declare const kDRISO9660LevelOne: interop.Pointer;

export declare const kDRDeviceBurnSpeedHDDVD1x: number;

export declare const kDRDeviceCanWriteBDKey: interop.Pointer;

export declare const DRHFSPlusCatalogNodeID: string;

export declare const kDRCDTextPerformerKey: interop.Pointer;

export declare const DRDeviceCanWriteBDRKey: string;

export declare const kDRTrackModeDVDData: number;

export declare const kDRDeviceMediaBSDNameKey: interop.Pointer;

export declare const DRDeviceCanUnderrunProtectDVDKey: string;

export declare const kDRDeviceMediaTypeBDRE: interop.Pointer;

export declare const DRDeviceMediaClassBD: string;

export declare const DRDeviceMediaStateNone: string;

export declare const kDRTrackModeAudio: number;

export declare const DRISO9660VersionNumber: string;

export declare const DRStatusTotalTracksKey: string;

export declare const kDRBlockTypeMode1Data: number;

export declare const kDRMaxBurnSpeedKey: interop.Pointer;

export declare const DRAbstractFile: string;

export declare const kDRCopyrightFile: interop.Pointer;

export declare const DRDeviceMediaIsReservedKey: string;

export declare const kDRTrackStartAddressKey: interop.Pointer;

export declare const kDRDeviceMediaClassDVD: interop.Pointer;

export declare const DRTrackNumberKey: string;

export declare const DRDeviceCanWriteDVDPlusRDoubleLayerKey: string;

export declare const DRDeviceCanWriteISRCKey: string;

export declare const DRBurnAppendableKey: string;

export declare const kDRCDTextGenreCodeRock: number;

export declare const DRSerialCopyManagementStateKey: string;

export declare const DRDeviceMediaTypeHDDVDROM: string;

export declare const kDRDeviceMediaIsOverwritableKey: interop.Pointer;

export declare const kDRISORockRidgeExtensions: interop.Pointer;

export declare const DRDeviceCanWriteCDRawKey: string;

export declare const kDRCDTextTOCKey: interop.Pointer;

export declare const DRUDFMaxInterchangeLevel: string;

export declare const kDRBurnStrategyBDDAO: interop.Pointer;

export declare const DRVolumeEffectiveDate: string;

export declare const DRPosixGID: string;

export declare const kDRUDFVersion150: interop.Pointer;

export declare const kDRCDTextGenreCodeContemporaryChristian: number;

export declare const kDRDeviceMediaClassCD: interop.Pointer;

export declare const DRAccessDate: string;

export declare const kDRDeviceCanWriteHDDVDRAMKey: interop.Pointer;

export declare const DRStatusStateTrackOpen: string;

export declare const DRStatusProgressCurrentKPS: string;

export declare const DRCDTextTOCKey: string;

export declare const kDRBlockSizeMode2Form2Data: number;

export declare const kDRDVDCopyrightInfoKey: interop.Pointer;

export declare const DRJoliet: string;

export declare const kDRDeviceWriteBufferSizeKey: interop.Pointer;

export declare const DRCDTextGenreCodeNewAge: number;

export declare const kDRInternalErr: number;

export declare const kDRDeviceSupportLevelNone: interop.Pointer;

export declare const kDRCDTextGenreCodeReggae: number;

export declare const DRTrackIsEmptyKey: string;

export declare const kDRStatusProgressInfoKey: interop.Pointer;

export declare const kDRDeviceMediaStateNone: interop.Pointer;

export declare const DRUDFInterchangeLevel: string;

export declare const kDRCDTextGenreCodeWorldMusic: number;

export declare const DRTrackModeKey: string;

export declare const DRCDTextTitleKey: string;

export declare const DRRecordingDate: string;

export declare const DRSynchronousBehaviorKey: string;

export declare const kDRUDFRealTimeFile: interop.Pointer;

export declare const DRDevicePhysicalInterconnectSCSI: string;

export declare const kDRCDTextGenreCodeGospel: number;

export declare const kDRCDTextGenreCodeAlternativeRock: number;

export declare const DRCDTextClosedKey: string;

export declare const DRISO9660: string;

export declare const kDRDevicePhysicalInterconnectSCSI: interop.Pointer;

export declare const DRCDTextGenreCodeDance: number;

export declare const DRDeviceMediaTypeBDR: string;

export declare const kDRDeviceMediaStateMediaPresent: interop.Pointer;

export declare const kDRSubchannelDataFormNone: interop.Pointer;

export declare const kDRDeviceMediaStateInTransition: interop.Pointer;

export declare const DRBurnCompletionActionMount: string;

export declare const kDRDeviceCommunicationErr: number;

export declare const DREraseTypeKey: string;

export declare const DRBurnStrategyCDSAO: string;

export declare const kDRDeviceCanTestWriteDVDKey: interop.Pointer;

export declare const DRSCMSCopyrightProtectedOriginal: string;

export declare const kDRBurnVerifyDiscKey: interop.Pointer;

export declare const kDRPosixUID: interop.Pointer;

export declare const kDRFreeBlocksKey: interop.Pointer;

export declare const kDRDeviceMediaTypeUnknown: interop.Pointer;

export declare const kDRBibliographicFile: interop.Pointer;

export declare const kDRFilesystemMaskHFSPlus: number;

export declare const kDRStatusTotalTracksKey: interop.Pointer;

export declare const kDRVerificationTypeProduceAgain: interop.Pointer;

export declare const kDRStatusTotalSessionsKey: interop.Pointer;

export declare const DRStatusStateTrackClose: string;

export declare const kDRCDTextGenreCodeLatin: number;

export declare const kDRMediaNotSupportedErr: number;

export declare const DRCDTextGenreCodeJazz: number;

export declare const kDRSuppressMacSpecificFiles: interop.Pointer;

export declare const DRDeviceLoadingMechanismCanOpenKey: string;

export declare const kDRFileForkSizeActual: number;

export declare const DRDeviceMediaTypeDVDPlusRW: string;

export declare const DRDeviceMediaIsBlankKey: string;

export declare const DREraseStatusChangedNotification: string;

export declare const kDRDeviceFirmwareRevisionKey: interop.Pointer;

export declare const DRDeviceCanWriteDVDPlusRWDoubleLayerKey: string;

export declare const DRTrackPacketTypeVariable: string;

export declare const kDRBurnCompletionActionEject: interop.Pointer;

export declare const kDRStatusStateKey: interop.Pointer;

export declare const kDRDeviceMediaTypeHDDVDROM: interop.Pointer;

export declare const kDRBurnTestingKey: interop.Pointer;

export declare const kDRLinkTypeFinderAlias: number;

export declare const kDRDevicePhysicalInterconnectLocationUnknown: interop.Pointer;

export declare const kDRVolumeModificationDate: interop.Pointer;

export declare const kDRErrorStatusErrorInfoStringKey: interop.Pointer;

export declare const kDRFilesystemMaskISO9660: number;

export declare const DRSubchannelDataFormNone: string;

export declare const kDRMediaNotBlankErr: number;

export declare const DRDeviceCanWriteCDTAOKey: string;

export declare const kDRFileModifiedDuringBurnErr: number;

export declare const kDRBurnStrategyIsRequiredKey: interop.Pointer;

export declare const kDRTrackTypeReserved: interop.Pointer;

export declare const DRBurnStrategyDVDDAO: string;

export declare const DRFilesystemInclusionMaskUDF: number;

export declare const kDRMacWindowView: interop.Pointer;

export declare const kDRISO9660: interop.Pointer;

export declare const kDRVolumeExpirationDate: interop.Pointer;

export declare const kDRBlockTypeMode2Data: number;

export declare const kDRUDFInterchangeLevel: interop.Pointer;

export declare const DRCDTextGenreCodeOpera: number;

export declare const kDRDevicePhysicalInterconnectFibreChannel: interop.Pointer;

export declare const DRDeviceCurrentWriteSpeedKey: string;

export declare const kDRStatusStatePreparing: interop.Pointer;

export declare const DRFlagSubchannelDataRequested: number;

export declare const DRDeviceMediaBlocksUsedKey: string;

export declare const DRLinkTypeHardLink: string;

export declare const DRCreationDate: string;

export declare const kDRBackupDate: interop.Pointer;

export declare const DRBurnFailureActionEject: string;

export declare const kDREraseStatusChangedNotification: interop.Pointer;

export declare const kDRDeviceCanWriteHDDVDRKey: interop.Pointer;

export declare const kDRDeviceMediaTypeHDDVDR: interop.Pointer;

export declare const kDRDeviceCanUnderrunProtectCDKey: interop.Pointer;

export declare const DRDeviceBurnSpeedHDDVD1x: number;

export declare const DRUDFVolumeSetIdentifier: string;

export declare const DRMacFileType: string;

export declare const DRAudioFourChannelKey: string;

export declare const kDRDeviceCanWriteISRCKey: interop.Pointer;

export declare const kDRDeviceMediaTypeHDDVDRAM: interop.Pointer;

export declare const kDRStatusStateErasing: interop.Pointer;

export declare const DRVerificationTypeProduceAgain: string;

export declare const kDREraseTypeComplete: interop.Pointer;

export declare const kDRDevicePhysicalInterconnectFireWire: interop.Pointer;

export declare const DRDeviceLoadingMechanismCanEjectKey: string;

export declare const DRDeviceVendorNameKey: string;

export declare const DRSCMSCopyrightProtectedCopy: string;

export declare const DRDeviceMediaOverwritableSpaceKey: string;

export declare const kDRTrackISRCKey: interop.Pointer;

export declare const kDRISOLevel: interop.Pointer;

export declare const DRDeviceCanWriteIndexPointsKey: string;

export declare const kDRDeviceSupportLevelAppleSupported: interop.Pointer;

export declare const kDRCDTextGenreCodeDance: number;

export declare const DRDeviceTrackInfoKey: string;

export declare const kDRMacFileType: interop.Pointer;

export declare const DRMacIconLocation: string;

export declare const DRDeviceCanTestWriteCDKey: string;

export declare const kDRTrackTypeClosed: interop.Pointer;

export declare const kDRCDTextSpecialMessageKey: interop.Pointer;

export declare const kDRTrackMode2Data: number;

export declare const DRStatusStateSessionClose: string;

export declare const DREraseTypeComplete: string;

export declare const DRSubchannelDataFormKey: string;

export declare const DRDeviceIsTrayOpenKey: string;

export declare const DRDeviceCanWriteBDKey: string;

export declare const DRDeviceCanWriteDVDRDualLayerKey: string;

export declare const DRFileForkResource: number;

export declare const kDRDeviceBurnSpeedBD1x: number;

export declare const DRSubchannelDataFormRaw: string;

export declare const kDRDeviceVendorNameKey: interop.Pointer;

export declare const DRDeviceMediaTypeHDDVDRW: string;

export declare const kDRMediaNotWritableErr: number;

export declare const kDRStatusStateSessionClose: interop.Pointer;

export declare const DRBurnStrategyBDDAO: string;

export declare const kDRFilesystemMaskUDF: number;

export declare const kDRTrackMessageProduceData: number;

export declare const DRDeviceMediaBSDNameKey: string;

export declare const DRStatusCurrentTrackKey: string;

export declare const kDRDeviceBurnSpeedMax: number;

export declare const kDRUDFVolumeSetImplementationUse: interop.Pointer;

export declare const kDRSynchronousBehaviorKey: interop.Pointer;

export declare const DRStatusStateFailed: string;

export declare const DRDeviceCanWriteHDDVDRAMKey: string;

export declare const DRDeviceBurnSpeedCD1x: number;

export declare const kDRAudioPreEmphasisKey: interop.Pointer;

export declare const DRDeviceCanWriteCDRKey: string;

export declare const kDRLinkTypeHardLink: number;

export declare const kDRSCMSCopyrightProtectedCopy: interop.Pointer;

export declare const kDRCDTextEncodingISOLatin1Modified: number;

export declare const kDRBlockTypeMode2Form1Data: number;

export declare const kDRExpirationDate: interop.Pointer;

export declare const kDREffectiveDate: interop.Pointer;

export declare const DRDevicePhysicalInterconnectLocationUnknown: string;

export declare const kDRSessionFormatKey: interop.Pointer;

export declare const kDRStatusCurrentTrackKey: interop.Pointer;

export declare const DRCDTextEncodingASCII: number;

export declare const kDRBlockTypeMode2Form2Data: number;

export declare const DRSuppressMacSpecificFiles: string;

export declare const kDRPreGapIsRequiredKey: interop.Pointer;

export declare const kDRCDTextClosedKey: interop.Pointer;

export declare const DRDataFormKey: string;

export declare const kDRSessionFormatCDI: number;

export declare const DRCDTextSpecialMessageKey: string;

export declare const kDRDeviceSupportLevelVendorSupported: interop.Pointer;

export declare const kDRFilesystemsNotSupportedErr: number;

export declare const kDRDeviceCurrentWriteSpeedKey: interop.Pointer;

export declare const DRContentModificationDate: string;

export declare const kDRDeviceCanUnderrunProtectDVDKey: interop.Pointer;

export declare const kDRMacScrollPosition: interop.Pointer;

export declare const DRCDTextGenreCodeContemporaryChristian: number;

export declare const kDRFileForkData: number;

export declare const kDRDeviceCanWriteHDDVDRDualLayerKey: interop.Pointer;

export declare const kDRMacFinderFlags: interop.Pointer;

export declare const kDRDeviceIsTrayOpenKey: interop.Pointer;

export declare const kDRTrackPacketTypeFixed: interop.Pointer;

export declare const kDRErrorStatusSenseKey: interop.Pointer;

export declare const kDRFileMessageForkSize: number;

export declare const kDRCDTextGenreCodeAdultContemporary: number;

export declare const kDRErrorStatusSenseCodeStringKey: interop.Pointer;

export declare const kDRCDTextGenreCodeHipHop: number;

export declare const kDRMediaInvalidErr: number;

export declare const kDRUDFVolumeSequenceNumber: interop.Pointer;

export declare const DRDeviceCanWriteHDDVDRKey: string;

export declare const kDRBurnCompletionActionMount: interop.Pointer;

export declare const DRDeviceMediaSessionCountKey: string;

export declare const kDRFilesystemMaskDefault: number;

export declare const DRDeviceWriteBufferSizeKey: string;

export declare const kDRSerialCopyManagementStateKey: interop.Pointer;

export declare const DRErrorStatusErrorInfoStringKey: string;

export declare const DRCDTextKey: string;

export declare const DRFreeBlocksKey: string;

export declare const kDRMediaNotErasableErr: number;

export declare const kDRStatusStateNone: interop.Pointer;

export declare const DRUDFVersion102: string;

export declare const DRCDTextGenreCodeMusical: number;

export declare const DRDeviceCanUnderrunProtectCDKey: string;

export declare const kDRTrackNumberKey: interop.Pointer;

export declare const DRCopyrightFile: string;

export declare const kDRStatusCurrentSpeedKey: interop.Pointer;

export declare const kDRFileMessageRelease: number;

export declare const DRStatusStateTrackWrite: string;

export declare const kDRDeviceMediaTypeDVDPlusRWDoubleLayer: interop.Pointer;

export declare const kDRDeviceMediaTypeDVDROM: interop.Pointer;

export declare const DRCDTextGenreCodeGospel: number;

export declare const DRCDTextGenreCodeRap: number;

export declare const DRCDTextComposerKey: string;

export declare const kDRDataFormMode2Data: number;

export declare const DRDeviceMediaClassHDDVD: string;

export declare const kDRDataFormMode1Data: number;

export declare const kDRDeviceMediaTypeCDR: interop.Pointer;

export declare const DRCDTextLanguageKey: string;

export declare const kDREraseTypeKey: interop.Pointer;

export declare const kDRBurnStrategyKey: interop.Pointer;

export declare const kDRCDTextGenreCodeEasyListening: number;

export declare const kDRDeviceCanWriteDVDRKey: interop.Pointer;

export declare const DRMacWindowView: string;

export declare const kDRDeviceDisappearedNotification: interop.Pointer;

export declare const kDRDeviceWriteCapabilitiesKey: interop.Pointer;

export declare const kDRDeviceMediaTypeCDROM: interop.Pointer;

export declare const DRDeviceCanWriteDVDKey: string;

export declare const DRErrorStatusSenseCodeStringKey: string;

export declare const DRUDFPrimaryVolumeDescriptorNumber: string;

export declare const DRDeviceMediaTypeDVDRWDualLayer: string;

export declare const kDRCDTextGenreCodeJazz: number;

export declare const DRDeviceMediaClassCD: string;

export declare const DRDeviceBurnSpeedMax: number;

export declare const kDRDeviceCanWriteCDKey: interop.Pointer;

export declare const DRDeviceMediaTypeDVDROM: string;

export declare const kDRTrackTypeInvisible: interop.Pointer;

export declare const kDRDeviceTrackRefsKey: interop.Pointer;

export declare const DRTrackPacketSizeKey: string;

export declare const kDRSCMSCopyrightProtectedOriginal: interop.Pointer;

export declare const DRBurnDoubleLayerL0DataZoneBlocksKey: string;

export declare const kDRCDTextEncodingASCII: number;

export declare const kDRTrackTypeKey: interop.Pointer;

export declare const DRStatusProgressCurrentXFactor: string;

export declare const kDRDeviceCantWriteSCMSErr: number;

export declare const kDRFileLocationConflictErr: number;

export declare const kDRTrackModeKey: interop.Pointer;

export declare const kDRDeviceCanWriteBDREKey: interop.Pointer;

export declare const kDRBlockSizeMode2Form1Data: number;

export declare const DRISORockRidgeExtensions: string;

export declare const kDRDoubleLayerL0DataZoneBlocksParamErr: number;

export declare const kDRTrackMessageVerifyData: number;

export declare const kDRVerificationTypeChecksum: interop.Pointer;

export declare const kDRBurnStrategyCDTAO: interop.Pointer;

export declare const kDRInvisible: interop.Pointer;

export declare const DRDeviceAppearedNotification: string;

export declare const DRCDTextGenreKey: string;

export declare const DRISOMacExtensions: string;

export declare const DRDeviceMediaStateKey: string;

export declare const kDRBlockTypeAudio: number;

export declare const kDRDeviceBusyErr: number;

export declare const DRUDFExtendedFilePermissions: string;

export declare const DRDVDTimestampKey: string;

export declare const DRDeviceMediaTypeBDRE: string;

export declare const kDRDeviceBurnStrategyNotAvailableErr: number;

export declare const DRBurnStatusChangedNotification: string;

export declare const kDRContentModificationDate: interop.Pointer;

export declare const kDRCDTextLanguageKey: interop.Pointer;

export declare const DRStatusStateErasing: string;

export declare const DRDeviceMediaTypeCDRW: string;

export declare const DRCDTextGenreCodeLatin: number;

export declare const kDRMacWindowBounds: interop.Pointer;

export declare const kDRDeviceMediaIsBlankKey: interop.Pointer;

export declare const kDRUDFExtendedFilePermissions: interop.Pointer;

export declare const DRDeviceSupportLevelAppleSupported: string;

export declare const kDRDeviceCantWriteIndexPointsErr: number;

export declare const kDRDeviceSupportLevelUnsupported: interop.Pointer;

export declare const DRCDTextGenreCodeCountry: number;

export declare const kDRCDTextComposerKey: interop.Pointer;

export declare const DRExpirationDate: string;

export declare const DRTrackTypeClosed: string;

export declare const kDRTrackPacketTypeKey: interop.Pointer;

export declare const DRDevicePhysicalInterconnectLocationInternal: string;

export declare const kDRDeviceMediaTypeHDDVDRW: interop.Pointer;

export declare const kDRDeviceMediaTypeHDDVDRDualLayer: interop.Pointer;

export declare const kDRPreGapLengthKey: interop.Pointer;

export declare const DRDeviceMediaDoubleLayerL0DataZoneBlocksKey: string;

export declare const DRCDTextNSStringEncodingKey: string;

export declare const DRCDTextGenreCodeRock: number;

export declare const kDRFileMessagePreBurn: number;

export declare const DRDeviceCanWriteBDREKey: string;

export declare const DRCDTextGenreCodeFolk: number;

export declare const kDRBurnUnderrunProtectionKey: interop.Pointer;

export declare const kDRBurnKey: interop.Pointer;

export declare const kDRDeviceCanWriteKey: interop.Pointer;

export declare const DRStatusCurrentSessionKey: string;

export declare const kDRTrackIsEmptyKey: interop.Pointer;

export declare const DRDeviceCanWriteHDDVDKey: string;

export declare const DRCDTextArrangerKey: string;

export declare const DRCDTextGenreCodePop: number;

export declare const DRBibliographicFile: string;

export declare const kDRSessionFormatAudio: number;

export declare const kDRTrackMessageVerificationStarting: number;

export declare const DRCDTextCharacterCodeKey: string;

export declare const DRErrorStatusAdditionalSenseStringKey: string;

export declare const DRDeviceMediaTypeCDR: string;

export declare const DRVerificationTypeChecksum: string;

export declare const kDRTrackMessageEstimateLength: number;

export declare const kDRStatusStateTrackOpen: interop.Pointer;

export declare const kDRCDTextGenreCodeSoundtrack: number;

export declare const DRBlockTypeKey: string;

export declare const kDRBurnRequestedSpeedKey: interop.Pointer;

export declare const DRCDTextGenreCodeSoundtrack: number;

export declare const DRDeviceStatusChangedNotification: string;

export declare const DRCDTextSongwriterKey: string;

export declare const DRDevicePhysicalInterconnectKey: string;

export declare const kDRDevicePhysicalInterconnectKey: interop.Pointer;

export declare const kDRDeviceMediaBlocksFreeKey: interop.Pointer;

export declare const DRCDTextGenreCodeChildrens: number;

export declare const kDRNextWritableAddressKey: interop.Pointer;

export declare const DRStatusProgressInfoKey: string;

export declare const kDRMacFileCreator: interop.Pointer;

export declare const kDRStatusStateTrackClose: interop.Pointer;

export declare const DRDeviceTrackRefsKey: string;

export declare const DRCDTextEncodingISOLatin1Modified: number;

export declare const kDRFirstErr: number;

export declare const DRCDTextCopyrightAssertedForSpecialMessagesKey: string;

export declare const DRBurnCompletionActionKey: string;

export declare const kDRTrackPacketSizeKey: interop.Pointer;

export declare class __DRTrack {
  constructor(init?: __DRTrack);
}

export declare class DRTrackProductionInfo {
  constructor(init?: DRTrackProductionInfo);
  buffer: interop.Pointer;
  reqCount: number;
  actCount: number;
  flags: number;
  blockSize: number;
  requestedAddress: number;
}

export declare class DRFileProductionInfo {
  constructor(init?: DRFileProductionInfo);
  requestedAddress: number;
  buffer: interop.Pointer;
  reqCount: number;
  actCount: number;
  blockSize: number;
  fork: number;
}

export declare class __DRFolder {
  constructor(init?: __DRFolder);
}

export declare class __DRFile {
  constructor(init?: __DRFile);
}

export declare class __DRNotificationCenter {
  constructor(init?: __DRNotificationCenter);
}

export declare class __DRErase {
  constructor(init?: __DRErase);
}

export declare class __DRCDTextBlock {
  constructor(init?: __DRCDTextBlock);
}

export declare class DRRefConCallbacks {
  constructor(init?: DRRefConCallbacks);
  version: number;
  retain: (p1: interop.PointerConvertible) => interop.Pointer | null;
  release: (p1: interop.PointerConvertible) => void | null;
}

export declare class __DRBurn {
  constructor(init?: __DRBurn);
}

export declare class __DRDevice {
  constructor(init?: __DRDevice);
}

export declare class DRFileForkSizeInfo {
  constructor(init?: DRFileForkSizeInfo);
  fork: number;
  query: number;
  size: number;
}

export declare function DRSetRefCon(ref: interop.Object, refCon: interop.PointerConvertible, callbacks: interop.PointerConvertible): void;

export declare function DRGetRefCon(ref: interop.Object): interop.Pointer;

export declare function DRCopyLocalizedStringForValue(value: interop.Object): interop.Object;

export declare function DRDeviceGetTypeID(): number;

export declare function DRCopyDeviceArray(): interop.Object;

export declare function DRDeviceCopyDeviceForBSDName(name: interop.Object): interop.Object;

export declare function DRDeviceCopyDeviceForIORegistryEntryPath(path: interop.Object): interop.Object;

export declare function DRDeviceIsValid(device: interop.Object): number;

export declare function DRDeviceOpenTray(device: interop.Object): number;

export declare function DRDeviceCloseTray(device: interop.Object): number;

export declare function DRDeviceEjectMedia(device: interop.Object): number;

export declare function DRDeviceAcquireMediaReservation(device: interop.Object): void;

export declare function DRDeviceReleaseMediaReservation(device: interop.Object): void;

export declare function DRDeviceAcquireExclusiveAccess(device: interop.Object): number;

export declare function DRDeviceReleaseExclusiveAccess(device: interop.Object): void;

export declare function DRDeviceCopyInfo(device: interop.Object): interop.Object;

export declare function DRDeviceCopyStatus(device: interop.Object): interop.Object;

export declare function DRDeviceKPSForXFactor(deviceOrMediaType: interop.Object, xfactor: number): number;

export declare function DRDeviceXFactorForKPS(deviceOrMediaType: interop.Object, kps: number): number;

export declare function DRTrackGetTypeID(): number;

export declare function DRTrackCreate(properties: interop.Object, callback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): interop.Object;

export declare function DRTrackSetProperties(track: interop.Object, properties: interop.Object): void;

export declare function DRTrackGetProperties(track: interop.Object): interop.Object;

export declare function DRTrackSpeedTest(track: interop.Object, howManyMilliseconds: number, howManyBytes: number): number;

export declare function DRTrackEstimateLength(track: interop.Object): number;

export declare function DRBurnGetTypeID(): number;

export declare function DRBurnCreate(device: interop.Object): interop.Object;

export declare function DRBurnWriteLayout(burn: interop.Object, layout: interop.Object): number;

export declare function DRBurnAbort(burn: interop.Object): void;

export declare function DRBurnCopyStatus(burn: interop.Object): interop.Object;

export declare function DRBurnGetDevice(burn: interop.Object): interop.Object;

export declare function DRBurnSetProperties(burn: interop.Object, properties: interop.Object): void;

export declare function DRBurnGetProperties(burn: interop.Object): interop.Object;

export declare function DRCDTextBlockCreateArrayFromPackList(packs: interop.Object): interop.Object;

export declare function DRCDTextBlockGetTypeID(): number;

export declare function DRCDTextBlockCreate(language: interop.Object, encoding: number): interop.Object;

export declare function DRCDTextBlockGetProperties(block: interop.Object): interop.Object;

export declare function DRCDTextBlockSetProperties(block: interop.Object, properties: interop.Object): void;

export declare function DRCDTextBlockGetTrackDictionaries(block: interop.Object): interop.Object;

export declare function DRCDTextBlockSetTrackDictionaries(block: interop.Object, array: interop.Object): void;

export declare function DRCDTextBlockGetValue(block: interop.Object, trackIndex: number, key: interop.Object): interop.Object;

export declare function DRCDTextBlockSetValue(block: interop.Object, trackIndex: number, key: interop.Object, value: interop.Object): void;

export declare function DRCDTextBlockFlatten(block: interop.Object): number;

export declare function DREraseGetTypeID(): number;

export declare function DREraseCreate(device: interop.Object): interop.Object;

export declare function DREraseStart(erase: interop.Object): number;

export declare function DREraseCopyStatus(erase: interop.Object): interop.Object;

export declare function DREraseGetDevice(erase: interop.Object): interop.Object;

export declare function DREraseSetProperties(erase: interop.Object, properties: interop.Object): void;

export declare function DREraseGetProperties(erase: interop.Object): interop.Object;

export declare function DRCopyLocalizedStringForDiscRecordingError(osError: number): interop.Object;

export declare function DRCopyLocalizedStringForSenseCode(senseCode: number): interop.Object;

export declare function DRCopyLocalizedStringForAdditionalSense(ASC: number, ASCQ: number): interop.Object;

export declare function DRNotificationCenterGetTypeID(): number;

export declare function DRNotificationCenterCreate(): interop.Object;

export declare function DRNotificationCenterCreateRunLoopSource(center: interop.Object): interop.Object;

export declare function DRNotificationCenterAddObserver(center: interop.Object, observer: interop.PointerConvertible, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void, name: interop.Object, object: interop.Object): void;

export declare function DRNotificationCenterRemoveObserver(center: interop.Object, observer: interop.PointerConvertible, name: interop.Object, object: interop.Object): void;

export declare function DRFSObjectIsVirtual(object: interop.PointerConvertible): number;

export declare function DRFSObjectGetRealFSRef(object: interop.PointerConvertible, fsRef: interop.PointerConvertible): void;

export declare function DRFSObjectCopyRealURL(object: interop.PointerConvertible): interop.Object;

export declare function DRFSObjectGetParent(object: interop.PointerConvertible): interop.Object;

export declare function DRFSObjectCopyBaseName(object: interop.PointerConvertible): interop.Object;

export declare function DRFSObjectCopySpecificName(object: interop.PointerConvertible, fsKey: interop.Object): interop.Object;

export declare function DRFSObjectCopySpecificNames(object: interop.PointerConvertible): interop.Object;

export declare function DRFSObjectCopyMangledName(object: interop.PointerConvertible, fsKey: interop.Object): interop.Object;

export declare function DRFSObjectCopyMangledNames(object: interop.PointerConvertible): interop.Object;

export declare function DRFSObjectCopyFilesystemProperty(object: interop.PointerConvertible, fsKey: interop.Object, propertyKey: interop.Object, coalesce: number): interop.Object;

export declare function DRFSObjectCopyFilesystemProperties(object: interop.PointerConvertible, fsKey: interop.Object, coalesce: number): interop.Object;

export declare function DRFSObjectGetFilesystemMask(object: interop.PointerConvertible, explicitMask: interop.PointerConvertible, effectiveMask: interop.PointerConvertible): number;

export declare function DRFSObjectSetBaseName(object: interop.Object, baseName: interop.Object): void;

export declare function DRFSObjectSetSpecificName(object: interop.Object, fsKey: interop.Object, specificName: interop.Object): void;

export declare function DRFSObjectSetSpecificNames(object: interop.Object, specificNames: interop.Object): void;

export declare function DRFSObjectSetFilesystemProperty(object: interop.Object, fsKey: interop.Object, propertyKey: interop.Object, value: interop.Object): void;

export declare function DRFSObjectSetFilesystemProperties(object: interop.Object, fsKey: interop.Object, properties: interop.Object): void;

export declare function DRFSObjectSetFilesystemMask(object: interop.Object, newMask: number): void;

export declare function DRFolderGetTypeID(): number;

export declare function DRFolderCreateReal(fsRef: interop.PointerConvertible): interop.Object;

export declare function DRFolderCreateRealWithURL(urlRef: interop.PointerConvertible): interop.Object;

export declare function DRFolderCreateVirtual(baseName: interop.Object): interop.Object;

export declare function DRFolderConvertRealToVirtual(realFolder: interop.Object): void;

export declare function DRFolderAddChild(parent: interop.Object, newChild: interop.Object): void;

export declare function DRFolderRemoveChild(parent: interop.Object, child: interop.Object): void;

export declare function DRFolderCountChildren(folder: interop.PointerConvertible): number;

export declare function DRFolderCopyChildren(folder: interop.PointerConvertible): interop.Object;

export declare function DRFileGetTypeID(): number;

export declare function DRFileCreateReal(fsRef: interop.PointerConvertible): interop.Object;

export declare function DRFileCreateRealWithURL(urlRef: interop.PointerConvertible): interop.Object;

export declare function DRFileCreateVirtualWithData(baseName: interop.Object, fileData: interop.PointerConvertible, fileDataLength: number): interop.Object;

export declare function DRFileCreateVirtualWithCallback(baseName: interop.Object, fileProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number, fileProcRefCon: interop.PointerConvertible): interop.Object;

export declare function DRFileCreateVirtualLink(original: interop.Object, linkType: number, fsKey: interop.Object): interop.Object;

export declare function DRFilesystemTrackCreate(rootFolder: interop.Object): interop.Object;

export declare function DRFilesystemTrackEstimateOverhead(numBlocks: number, blockSize: number, fsMask: number): number;

export declare function DRAudioTrackCreate(audioFile: interop.PointerConvertible): interop.Object;

export declare function DRAudioTrackCreateWithURL(audioFileURL: interop.Object): interop.Object;

export declare function DRGetVersion(): NumVersion;

export declare interface DRFileDataProduction {
  calculateSizeOfFileForkEstimating(file: DRFile, fork: number, estimate: boolean): number;

  prepareFileForBurn(file: DRFile): boolean;

  produceFileForkIntoBufferLengthAtAddressBlockSize(file: DRFile, fork: number, buffer: string, bufferLength: number, address: number, blockSize: number): number;

  prepareFileForVerification(file: DRFile): boolean;

  cleanupFileAfterBurn(file: DRFile): void;
}

export declare class DRFileDataProduction extends NativeObject implements DRFileDataProduction {
}

export declare interface DRTrackDataProduction {
  estimateLengthOfTrack(track: DRTrack): number;

  prepareTrackForBurnToMedia(track: DRTrack, burn: DRBurn, mediaInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): boolean;

  cleanupTrackAfterBurn(track: DRTrack): void;

  producePreGapForTrackIntoBufferLengthAtAddressBlockSizeIoFlags(track: DRTrack, buffer: string, bufferLength: number, address: number, blockSize: number, flags: interop.PointerConvertible): number;

  produceDataForTrackIntoBufferLengthAtAddressBlockSizeIoFlags(track: DRTrack, buffer: string, bufferLength: number, address: number, blockSize: number, flags: interop.PointerConvertible): number;

  prepareTrackForVerification(track: DRTrack): boolean;

  verifyPreGapForTrackInBufferLengthAtAddressBlockSizeIoFlags(track: DRTrack, buffer: string, bufferLength: number, address: number, blockSize: number, flags: interop.PointerConvertible): boolean;

  verifyDataForTrackInBufferLengthAtAddressBlockSizeIoFlags(track: DRTrack, buffer: string, bufferLength: number, address: number, blockSize: number, flags: interop.PointerConvertible): boolean;

  cleanupTrackAfterVerification(track: DRTrack): boolean;
}

export declare class DRTrackDataProduction extends NativeObject implements DRTrackDataProduction {
}

export declare class DRNotificationCenter extends NSObject {
  static currentRunLoopCenter(): DRNotificationCenter;

  addObserverSelectorNameObject(observer: interop.Object, aSelector: string, notificationName: string, anObject: interop.Object): void;

  removeObserverNameObject(observer: interop.Object, aName: string, anObject: interop.Object): void;
}

export declare class DRMSFFormatter extends NSFormatter {
  initWithFormat(format: string): this;

  format(): string;

  setFormat(format: string): void;
}

export declare class DRFile extends DRFSObject {
  static fileWithPath(path: string): DRFile;

  initWithPath(path: string): this;

  static virtualFileWithNameData(name: string, data: NSData): DRFile;

  static virtualFileWithNameDataProducer(name: string, producer: interop.Object): DRFile;

  initWithNameData(name: string, data: NSData): this;

  initWithNameDataProducer(name: string, producer: interop.Object): this;

  static hardLinkPointingToInFilesystem(original: DRFile, filesystem: string): DRFile;

  static symLinkPointingToInFilesystem(original: DRFSObject, filesystem: string): DRFile;

  static finderAliasPointingToInFilesystem(original: DRFSObject, filesystem: string): DRFile;

  initWithLinkTypePointingToInFilesystem(linkType: string, original: DRFSObject, filesystem: string): this;
}

export declare class DRFSObject extends NSObject {
  isVirtual(): boolean;

  sourcePath(): string;

  parent(): DRFolder;

  baseName(): string;

  setBaseName(baseName: string): void;

  specificNameForFilesystem(filesystem: string): string;

  specificNames(): NSDictionary;

  setSpecificNameForFilesystem(name: string, filesystem: string): void;

  setSpecificNames(specificNames: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  mangledNameForFilesystem(filesystem: string): string;

  mangledNames(): NSDictionary;

  propertyForKeyInFilesystemMergeWithOtherFilesystems(key: string, filesystem: string, merge: boolean): interop.Object;

  propertiesForFilesystemMergeWithOtherFilesystems(filesystem: string, merge: boolean): NSDictionary;

  setPropertyForKeyInFilesystem(property: interop.Object, key: string, filesystem: string): void;

  setPropertiesInFilesystem(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, filesystem: string): void;

  explicitFilesystemMask(): number;

  setExplicitFilesystemMask(mask: number): void;

  effectiveFilesystemMask(): number;
}

export declare class DRCDTextBlock extends NSObject {
  static arrayOfCDTextBlocksFromPacks(packs: NSData): NSArray;

  static cdTextBlockWithLanguageEncoding(lang: string, enc: number): DRCDTextBlock;

  initWithLanguageEncoding(lang: string, enc: number): this;

  properties(): NSDictionary;

  setProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  trackDictionaries(): NSArray;

  setTrackDictionaries(tracks: NSArray<interop.Object> | Array<interop.Object>): void;

  objectForKeyOfTrack(key: string, trackIndex: number): interop.Object;

  setObjectForKeyOfTrack(value: interop.Object, key: string, trackIndex: number): void;

  flatten(): number;

  language(): string;

  encoding(): number;
}

export declare class DRBurn extends NSObject {
  static burnForDevice(device: DRDevice): DRBurn;

  initWithDevice(device: DRDevice): this;

  writeLayout(layout: interop.Object): void;

  status(): NSDictionary;

  abort(): void;

  properties(): NSDictionary;

  setProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  device(): DRDevice;

  requestedBurnSpeed(): number;

  setRequestedBurnSpeed(speed: number): void;

  appendable(): boolean;

  setAppendable(appendable: boolean): void;

  verifyDisc(): boolean;

  setVerifyDisc(verify: boolean): void;

  completionAction(): string;

  setCompletionAction(action: string): void;

  static layoutForImageFile(path: string): interop.Object;
}

export declare class DRTrack extends NSObject {
  initWithProducer(producer: interop.Object): this;

  properties(): NSDictionary;

  setProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  testProductionSpeedForInterval(interval: number): number;

  testProductionSpeedForLength(length: number): number;

  estimateLength(): number;

  length(): DRMSF;

  preGap(): DRMSF;

  setPreGap(preGap: DRMSF): void;

  static trackForAudioOfLengthProducer(length: DRMSF, producer: interop.Object): DRTrack;

  static trackForAudioFile(path: string): DRTrack;

  static trackForRootFolder(rootFolder: DRFolder): DRTrack;
}

export declare class DRDevice extends NSObject {
  static devices(): NSArray;

  static deviceForBSDName(bsdName: string): DRDevice;

  static deviceForIORegistryEntryPath(path: string): DRDevice;

  isValid(): boolean;

  info(): NSDictionary;

  status(): NSDictionary;

  openTray(): boolean;

  closeTray(): boolean;

  ejectMedia(): boolean;

  acquireExclusiveAccess(): boolean;

  releaseExclusiveAccess(): void;

  acquireMediaReservation(): void;

  releaseMediaReservation(): void;

  isEqualToDevice(otherDevice: DRDevice): boolean;

  writesCD(): boolean;

  writesDVD(): boolean;

  displayName(): string;

  ioRegistryEntryPath(): string;

  mediaIsPresent(): boolean;

  mediaIsTransitioning(): boolean;

  mediaIsBusy(): boolean;

  mediaType(): string;

  mediaIsBlank(): boolean;

  mediaIsAppendable(): boolean;

  mediaIsOverwritable(): boolean;

  mediaIsErasable(): boolean;

  mediaIsReserved(): boolean;

  mediaSpaceOverwritable(): DRMSF;

  mediaSpaceUsed(): DRMSF;

  mediaSpaceFree(): DRMSF;

  trayIsOpen(): boolean;

  bsdName(): string;
}

export declare class DRErase extends NSObject {
  static eraseForDevice(device: DRDevice): DRErase;

  initWithDevice(device: DRDevice): this;

  start(): void;

  status(): NSDictionary;

  properties(): NSDictionary;

  setProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  device(): DRDevice;

  eraseType(): string;

  setEraseType(type: string): void;
}

export declare class DRFolder extends DRFSObject {
  static folderWithPath(path: string): DRFolder;

  initWithPath(path: string): this;

  static virtualFolderWithName(name: string): DRFolder;

  initWithName(name: string): this;

  makeVirtual(): void;

  addChild(child: DRFSObject): void;

  removeChild(child: DRFSObject): void;

  count(): number;

  children(): NSArray;
}

export declare class DRMSF extends NSNumber {
  static msf(): DRMSF;

  static msfWithFrames(frames: number): DRMSF;

  static msfWithString(string: string): DRMSF;

  initWithFrames(frames: number): this;

  initWithString(string: string): this;

  minutes(): number;

  seconds(): number;

  frames(): number;

  sectors(): number;

  msfByAdding(msf: DRMSF): DRMSF;

  msfBySubtracting(msf: DRMSF): DRMSF;

  readonly description: string;

  descriptionWithFormat(format: string): string;

  isEqualToMSF(otherDRMSF: DRMSF): boolean;
}
