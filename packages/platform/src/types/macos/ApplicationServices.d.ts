import type { NSView } from './AppKit'

import type { CGPoint } from './CoreFoundation'

import type { AliasRecord, FSSpec } from './CoreServices'

import type { NSArray, NSBundle, NSDictionary } from './Foundation'

import type {
	FixedPoint,
	NSObjectProtocol,
	NumVersion,
	Point,
	ProcessSerialNumber,
	Rect,
} from './Runtime'

import type { interop } from './objc-runtime'

import { NativeObject } from './objc-runtime'

export declare const kATSUColorTag: number

export declare const kATSOptionFlagsUnRestrictedScope: number

export declare const cmNamedIndexed32Space: number

export declare const kPMJobManagerAborted: number

export declare const kPMStringConversionFailure: number

export declare const kICMapBinaryMask: number

export declare const kHIShapeEnumerateInit: number

export declare const kATSFontContextLocal: number

export declare const cmScannerDeviceClass: number

export declare const kProcessDictionaryIncludeAllInformationMask: number

export declare const kSelectorSmall8Bit: number

export declare const kPMShowInlinePageRangeWithSelection: number

export declare const kATSOptionFlagsDefault: number

export declare const kATSULineJustificationFactorTag: number

export declare const kPMSubTicketNotFound: number

export declare const cmXYZ48LSpace: number

export declare const kPMReadGotZeroData: number

export declare const kATSUseOriginFlags: number

export declare const icNoMoreWritersErr: number

export declare const kSpeechErrorsProperty: interop.Pointer

export declare const ttLabel2: number

export declare const kPlotIconRefNoImage: number

export declare const kPMCoverPageAfter: number

export declare const cmScreeningDescTag: number

export declare const kATSFontFamilyRefUnspecified: number

export declare const kATSUFlattenOptionNoOptionsMask: number

export declare const kPMInvalidParameter: number

export declare const cmGreenTRCTag: number

export declare const cmLinearChromaticAdaptation: number

export declare const kPMQueueJobFailed: number

export declare const kICFileType: number

export declare const kTextToSpeechVoiceBundleType: number

export declare const kPMValueOutOfRange: number

export declare const ttLabel7: number

export declare const kATSLineBreakToNearestCharacter: number

export declare const icTooManyProfilesErr: number

export declare const cmPrefsSynchError: number

export declare const kPMUnsupportedConnection: number

export declare const soCurrentA5: number

export declare const cutDev: number

export declare const modeHighLevelEventAware: number

export declare const kPMJobCanceled: number

export declare const kSpeechInputModeProperty: interop.Pointer

export declare const kATSUUnFlattenOptionNoOptionsMask: number

export declare const kUseProfileIntent: number

export declare const cmDeviceProfilesNotFound: number

export declare const kSpeechErrorCount: interop.Pointer

export declare const kPMFontNameTooLong: number

export declare const kFMFontCallbackFilterSelector: number

export declare const kFontNoScript: number

export declare const kAXValueCGPointType: number

export declare const kATSOptionFlagsUseDataFork: number

export declare const kATSULeadingTag: number

export declare const cmIlluminantF2: number

export declare const kATSULineWidthTag: number

export declare const cmDeviceInfoVersion1: number

export declare const kATSFontContainerRefUnspecified: number

export declare const cmMCSevenSpace: number

export declare const cmARGB64LPmulSpace: number

export declare const cmBlueTRCTag: number

export declare const notPasteboardOwnerErr: number

export declare const kATSUTruncFeatNoSquishing: number

export declare const kAXValueCGRectType: number

export declare const svAllMiniData: number

export declare const kICEditPreferenceEvent: number

export declare const cmReflectiveTransparentMask: number

export declare const kPMDocumentNotFound: number

export declare const kPMNoSelectedPrinters: number

export declare const extendedBlockLen: number

export declare const kATSGlyphInfoAppleReserved: number

export declare const kPMQualityLowest: number

export declare const kATSUMaxStyleTag: number

export declare const atBottomLeft: number

export declare const kSelectorHuge32Bit: number

export declare const cm7CLRData: number

export declare const kHIShapeParseFromBottomRight: number

export declare const cm64_8ColorPacking: number

export declare const cmMakeAndModelTag: number

export declare const icPrefNotFoundErr: number

export declare const cmGeometry0dord0: number

export declare const cmVideoCardGammaFormulaType: number

export declare const cmReadAccess: number

export declare const kPMNoDefaultItem: number

export declare const cmDeviceStateAppleRsvdBits: number

export declare const cmGrayA16Space: number

export declare const kSpeechErrorCFCallBack: interop.Pointer

export declare const cmDeviceDBNotFoundErr: number

export declare const cmTechnologyPhotoCD: number

export declare const kFontNoName: number

export declare const CS_MAX_PATH: number

export declare const kFMFontDirectoryFilterSelector: number

export declare const cmTechnologyVideoMonitor: number

export declare const kSpeechErrorCallbackSpokenString: interop.Pointer

export declare const kSpeechDictionaryEntryPhonemes: interop.Pointer

export declare const kSpeechDictionaryAbbreviations: interop.Pointer

export declare const kSpeechDictionaryModificationDate: interop.Pointer

export declare const kSpeechCommandPrefix: interop.Pointer

export declare const kSpeechVoiceID: interop.Pointer

export declare const kSpeechPhonemeInfoHiliteEnd: interop.Pointer

export declare const kSpeechPhonemeInfoHiliteStart: interop.Pointer

export declare const kSpeechPhonemeInfoExample: interop.Pointer

export declare const kSpeechPhonemeInfoOpcode: interop.Pointer

export declare const kSpeechSynthesizerInfoManufacturer: interop.Pointer

export declare const kSpeechSynthesizerInfoIdentifier: interop.Pointer

export declare const kSpeechErrorOldestCharacterOffset: interop.Pointer

export declare const kSpeechErrorOldest: interop.Pointer

export declare const kSpeechStatusPhonemeCode: interop.Pointer

export declare const kSpeechStatusNumberOfCharactersLeft: interop.Pointer

export declare const kSpeechStatusOutputPaused: interop.Pointer

export declare const kSpeechStatusOutputBusy: interop.Pointer

export declare const kSpeechPreflightThenPause: interop.Pointer

export declare const kSpeechNoSpeechInterrupt: interop.Pointer

export declare const kSpeechModeLiteral: interop.Pointer

export declare const kSpeechModeNormal: interop.Pointer

export declare const kSpeechSynthExtensionProperty: interop.Pointer

export declare const kSpeechAudioUnitProperty: interop.Pointer

export declare const kSpeechPhonemeOptionsProperty: interop.Pointer

export declare const kSpeechWordCFCallBack: interop.Pointer

export declare const kSpeechSpeechDoneCallBack: interop.Pointer

export declare const kSpeechTextDoneCallBack: interop.Pointer

export declare const kSpeechRefConProperty: interop.Pointer

export declare const kSpeechOutputChannelMapProperty: interop.Pointer

export declare const kSpeechOutputToAudioDeviceProperty: interop.Pointer

export declare const kSpeechOutputToExtAudioFileProperty: interop.Pointer

export declare const kSpeechCommandDelimiterProperty: interop.Pointer

export declare const kSpeechPitchBaseProperty: interop.Pointer

export declare const kSpeechNumberModeProperty: interop.Pointer

export declare const kSpeechStatusProperty: interop.Pointer

export declare const kFemale: number

export declare const kMale: number

export declare const kNeuter: number

export declare const kSpeechShowSyllables: number

export declare const kSpeechRelativeDuration: number

export declare const kSpeechRelativePitch: number

export declare const kSpeechGenerateTune: number

export declare const k4IndexedGrayPixelFormat: number

export declare const soVoiceFile: number

export declare const modePhonemes: number

export declare const modeText: number

export declare const soPhonemeOptions: number

export declare const soOutputToAudioDevice: number

export declare const soOutputToExtAudioFile: number

export declare const soWordCallBack: number

export declare const soErrorCallBack: number

export declare const soSyncCallBack: number

export declare const soSpeechDoneCallBack: number

export declare const soRefCon: number

export declare const soCommandDelimiter: number

export declare const soPhonemeSymbols: number

export declare const soSynthType: number

export declare const soPitchMod: number

export declare const soCharacterMode: number

export declare const soInputMode: number

export declare const kAXUnderlineTextAttribute: interop.Object

export declare const cmSigNamedColorType: number

export declare const kEndOfWord: number

export declare const kNoSpeechInterrupt: number

export declare const kTextToSpeechVoiceFileType: number

export declare const kTextToSpeechSynthType: number

export declare const kATSUDirectDataLayoutRecordATSLayoutRecordCurrent: number

export declare const kATSUDirectDataLayoutRecordATSLayoutRecordVersion1: number

export declare const kATSUDirectDataBaselineDeltaFixedArray: number

export declare const kATSUDirectDataAdvanceDeltaFixedArray: number

export declare const kATSFlatDataUstlCurrentVersion: number

export declare const kATSFlatDataUstlVersion2: number

export declare const kATSFlatDataUstlVersion1: number

export declare const kATSFlatDataUstlVersion0: number

export declare const kATSUDataStreamUnicodeStyledText: number

export declare const kATSUFromPreviousLayout: number

export declare const kATSUToTextEnd: number

export declare const kATSUNoSelector: number

export declare const kATSUInvalidFontID: number

export declare const kATSULeftToRightBaseDirection: number

export declare const kRedrawHighlighting: number

export declare const kInvertHighlighting: number

export declare const kGlyphCollectionUnspecified: number

export declare const kGlyphCollectionAdobeJapan2: number

export declare const kGlyphCollectionAdobeJapan1: number

export declare const kGlyphCollectionAdobeGB1: number

export declare const kATSUNumberTabTypes: number

export declare const kATSUDecimalTab: number

export declare const kATSURightTab: number

export declare const kATSUCenterTab: number

export declare const kATSULeftTab: number

export declare const kATSUSequentialFallbacksPreferred: number

export declare const kATSUStyleContainedBy: number

export declare const kATSUStyleEquals: number

export declare const kATSUStyleDoubleLineCount: number

export declare const kATSUStyleSingleLineCount: number

export declare const kATSUTruncateMiddle: number

export declare const kATSUTruncateStart: number

export declare const kATSUTruncateNone: number

export declare const kATSUByCluster: number

export declare const kATSUByCharacter: number

export declare const kATSULanguageTag: number

export declare const kATSUStyleDropShadowOffsetOptionTag: number

export declare const kATSUStyleDropShadowBlurOptionTag: number

export declare const kATSUStyleStrikeThroughCountOptionTag: number

export declare const kATSUStyleUnderlineColorOptionTag: number

export declare const kATSUFontMatrixTag: number

export declare const kATSUDescentTag: number

export declare const kATSUAscentTag: number

export declare const kATSUNoOpticalAlignmentTag: number

export declare const kATSUSuppressCrossKerningTag: number

export declare const kGlyphCollectionAdobeKorea1: number

export declare const kATSUNoCaretAngleTag: number

export declare const kATSUNoLigatureSplitTag: number

export declare const kATSUBaselineClassTag: number

export declare const kATSUKerningInhibitFactorTag: number

export declare const kATSUCrossStreamShiftTag: number

export declare const kATSUQDCondensedTag: number

export declare const kATSUQDItalicTag: number

export declare const kATSUCGContextTag: number

export declare const kATSUMaxLineTag: number

export declare const kATSULayoutOperationOverrideTag: number

export declare const kATSULineDecimalTabCharacterTag: number

export declare const kATSULineFontFallbacksTag: number

export declare const kATSULineTruncationTag: number

export declare const cmFlare0: number

export declare const kATSULineAscentTag: number

export declare const kPMLastErrorCodeToMakeMaintenanceOfThisListEasier: number

export declare const kPMIOAttrNotAvailable: number

export declare const kPMCloseFailed: number

export declare const kPMWriteFailed: number

export declare const kPMReadFailed: number

export declare const kPMOpenFailed: number

export declare const kPMInvalidPrinterAddress: number

export declare const kPMInvalidState: number

export declare const kPMGeneralCGError: number

export declare const kPMPluginRegisterationFailed: number

export declare const kPMInvalidJobID: number

export declare const kPMInvalidCVMContext: number

export declare const kPMInvalidIOMContext: number

export declare const kPMCVMSymbolNotFound: number

export declare const kPMPMSymbolNotFound: number

export declare const cmSigUInt16Type: number

export declare const kPMJobBusy: number

export declare const soReset: number

export declare const kPMJobNotFound: number

export declare const kPMQueueNotFound: number

export declare const kPMUnknownMessage: number

export declare const kPMPermissionError: number

export declare const kPMServerAttributeRestricted: number

export declare const kPMServerSuspended: number

export declare const kPMMessagingError: number

export declare const kPMServerCommunicationFailed: number

export declare const kPMUnknownDataType: number

export declare const kPMKeyNotUnique: number

export declare const kPMKeyNotFound: number

export declare const kPMItemIsLocked: number

export declare const kPMDeleteSubTicketFailed: number

export declare const kPMInvalidSubTicket: number

export declare const kPMUpdateTicketFailed: number

export declare const kPMPrBrowserNoUI: number

export declare const kPMEditRequestFailed: number

export declare const kPMInvalidLookupSpec: number

export declare const kPMInvalidPBMRef: number

export declare const kPMInvalidPDEContext: number

export declare const kPMNoDefaultSettings: number

export declare const kPMInvalidPaper: number

export declare const kPMInvalidObject: number

export declare const kPMInvalidReply: number

export declare const kPMInvalidType: number

export declare const kPMInvalidTicket: number

export declare const kPMInvalidKey: number

export declare const kPMInvalidPrinterInfo: number

export declare const kPMInvalidJobTemplate: number

export declare const kPMXMLParseError: number

export declare const kPMAllocationFailure: number

export declare const kPMCoverPageBefore: number

export declare const kPMInvalidPreset: number

export declare const kPMObjectInUse: number

export declare const kPMInvalidPrinter: number

export declare const kPMInvalidPrintSettings: number

export declare const kPMNoSuchEntry: number

export declare const kPMNoDefaultPrinter: number

export declare const kPMNoError: number

export declare const kUserPPDDomain: number

export declare const kSystemPPDDomain: number

export declare const kAllPPDDomains: number

export declare const kPMShowInlineScale: number

export declare const kPMShowInlineOrientation: number

export declare const kPMShowDefaultInlineItems: number

export declare const kPMHideInlineItems: number

export declare const kEndOfSentence: number

export declare const kPMBorderSingleThickline: number

export declare const kPMBorderDoubleHairline: number

export declare const kPMBorderSingleHairline: number

export declare const kPMLayoutBottomTopRightLeft: number

export declare const kPMLayoutTopBottomLeftRight: number

export declare const kPMLayoutRightLeftBottomTop: number

export declare const kPMLayoutRightLeftTopBottom: number

export declare const kPMLayoutLeftRightBottomTop: number

export declare const kPMScalingCenterOnImgArea: number

export declare const kPMScalingPinBottomLeft: number

export declare const kPMPaperTypeTShirt: number

export declare const kPMPaperTypeGlossy: number

export declare const kPMPaperTypePremium: number

export declare const kPMPaperTypeCoated: number

export declare const kPMPaperTypePlain: number

export declare const kPMQualityHighest: number

export declare const kPMQualityPhoto: number

export declare const kPMRGBColorSpaceModel: number

export declare const kPMPrinterProcessing: number

export declare const kPMReverseLandscape: number

export declare const kPMLandscape: number

export declare const kPMDestinationInvalid: number

export declare const kPMCancel: number

export declare const kATSUQDUnderlineTag: number

export declare const kSpeechSyncCallBack: interop.Pointer

export declare const soTextDoneCallBack: number

export declare const kPMUnlocked: number

export declare const cmDeviceStateDeviceRsvdBits: number

export declare const kICMapNotIncomingMask: number

export declare const cmParametricType4: number

export declare const kSelectorAllSmallData: number

export declare const kATSUBackgroundColor: number

export declare const kATSULineLayoutOptionsTag: number

export declare const kPMInvalidAllocator: number

export declare const kATSLineIsDisplayOnly: number

export declare const kPMPaperTypeUnknown: number

export declare const hitDev: number

export declare const cmRGB24Space: number

export declare const kPMQualityBest: number

export declare const kSelectorSmall4Bit: number

export declare const kUAZoomFocusTypeInsertionPoint: number

export declare const kAXForegoundColorTextAttribute: interop.Object

export declare const kAXVisibleNameKey: interop.Object

export declare const kAXFontFamilyKey: interop.Object

export declare const kAXMisspelledTextAttribute: interop.Object

export declare const kAXReplacementStringTextAttribute: interop.Object

export declare const kAXAttachmentTextAttribute: interop.Object

export declare const kAXStrikethroughTextAttribute: interop.Object

export declare const kAXStrikethroughColorTextAttribute: interop.Object

export declare const kAXUnderlineColorTextAttribute: interop.Object

export declare const kAXFontTextAttribute: interop.Object

export declare const kAXValueIllegalType: number

export declare const kAXValueCFRangeType: number

export declare const kAXValueCGSizeType: number

export declare const kAXTrustedCheckOptionPrompt: interop.Object

export declare const kTranslationDataTranslation: number

export declare const badTranslationRefErr: number

export declare const badPasteboardItemErr: number

export declare const badPasteboardSyncErr: number

export declare const cdevResErr: number

export declare const cdevMemErr: number

export declare const cursorDev: number

export declare const kATSInvalidFontTableAccess: number

export declare const clearDev: number

export declare const pasteDev: number

export declare const undoDev: number

export declare const activDev: number

export declare const updateDev: number

export declare const nulDev: number

export declare const closeDev: number

export declare const kSetFrontProcessCausedByUser: number

export declare const kQuitNotQuitDuringLogoutMask: number

export declare const kQuitNotQuitDuringInstallMask: number

export declare const kQuitOptionsMask: number

export declare const kQuitBeforeTerminatorAppQuitsMask: number

export declare const kQuitBeforeFBAsQuitMask: number

export declare const kQuitAtNormalTimeMask: number

export declare const kProcessTransformToUIElementApplication: number

export declare const kProcessTransformToForegroundApplication: number

export declare const modeUseTextEditServices: number

export declare const modeDeskAccessory: number

export declare const modeControlPanel: number

export declare const modeReserved: number

export declare const launchInhibitDaemon: number

export declare const launchAllow24Bit: number

export declare const launchUseMinimum: number

export declare const launchNoFileFlags: number

export declare const kSystemProcess: number

export declare const kNoProcess: number

export declare const kICServicesUDPMask: number

export declare const kICServicesTCPBit: number

export declare const kICMapPostMask: number

export declare const kICMapDataForkMask: number

export declare const kICMapResourceForkBit: number

export declare const kICMapBinaryBit: number

export declare const kICMapFixedLength: number

export declare const kICFileSpecHeaderSize: number

export declare const kICNumVersion: number

export declare const kICEditPreferenceEventClass: number

export declare const kAEGetURL: number

export declare const kICCreator: number

export declare const kICNoUserInteractionMask: number

export declare const kICNilProfileID: number

export declare const icReadWritePerm: number

export declare const icReadOnlyPerm: number

export declare const icNoPerm: number

export declare const kICAttrVolatileMask: number

export declare const kICAttrLockedMask: number

export declare const kICAttrNoChange: number

export declare const kICAttrVolatileBit: number

export declare const kICAttrLockedBit: number

export declare const kICComponentInterfaceVersion3: number

export declare const kICComponentInterfaceVersion2: number

export declare const kICComponentInterfaceVersion1: number

export declare const kICComponentInterfaceVersion0: number

export declare const icProfileNotFoundErr: number

export declare const icConfigInappropriateErr: number

export declare const icNothingToOverrideErr: number

export declare const icPrefDataErr: number

export declare const icPermErr: number

export declare const kPlotIconRefNormalFlags: number

export declare const svAllAvailableData: number

export declare const svAll4BitData: number

export declare const svAll1BitData: number

export declare const svAllSmallData: number

export declare const svAllLargeData: number

export declare const svMini8Bit: number

export declare const svSmall8Bit: number

export declare const svLarge8Bit: number

export declare const svLarge4Bit: number

export declare const svLarge1Bit: number

export declare const kATSUMaxATSUITagValue: number

export declare const kSelectorAll8BitData: number

export declare const kSelectorAll4BitData: number

export declare const kSelectorAllLargeData: number

export declare const kSelectorHuge8Bit: number

export declare const kSelectorHuge1Bit: number

export declare const cmLong8ColorPacking: number

export declare const kSelectorMini8Bit: number

export declare const kSelectorMini4Bit: number

export declare const kSelectorMini1Bit: number

export declare const kSelectorSmall32Bit: number

export declare const kSelectorSmall1Bit: number

export declare const kSelectorLarge8BitMask: number

export declare const kSelectorLarge32Bit: number

export declare const kSelectorLarge8Bit: number

export declare const kSelectorLarge4Bit: number

export declare const kSelectorLarge1Bit: number

export declare const ttSelectedOpen: number

export declare const ttOpen: number

export declare const ttOffline: number

export declare const kTransformSelectedOpen: number

export declare const kTransformSelectedDisabled: number

export declare const kTransformLabel7: number

export declare const kTransformLabel6: number

export declare const kTransformLabel5: number

export declare const kTransformLabel3: number

export declare const kTransformLabel2: number

export declare const kTransformDisabled: number

export declare const cmIterateCustomDeviceProfiles: number

export declare const kTransformNone: number

export declare const atBottomRight: number

export declare const atRight: number

export declare const atCenterLeft: number

export declare const atAbsoluteCenter: number

export declare const atHorizontalCenter: number

export declare const atBottom: number

export declare const kAlignBottomRight: number

export declare const kAlignBottomLeft: number

export declare const kAlignCenterLeft: number

export declare const kAlignCenterBottom: number

export declare const kAlignAbsoluteCenter: number

export declare const kAlignBottom: number

export declare const kAlignTop: number

export declare const kHIShapeParseFromTopLeft: number

export declare const kHIShapeEnumerateTerminate: number

export declare const kHIShapeEnumerateRect: number

export declare const kVerticalConstraint: number

export declare const kNoConstraint: number

export declare const k2vuyPixelFormat: number

export declare const kYUV211PixelFormat: number

export declare const kYUVSPixelFormat: number

export declare const k32RGBAPixelFormat: number

export declare const k32ABGRPixelFormat: number

export declare const k32BGRAPixelFormat: number

export declare const k24BGRPixelFormat: number

export declare const k16LE565PixelFormat: number

export declare const k16LE555PixelFormat: number

export declare const k1IndexedGrayPixelFormat: number

export declare const k32ARGBPixelFormat: number

export declare const k24RGBPixelFormat: number

export declare const k16BE555PixelFormat: number

export declare const k8IndexedPixelFormat: number

export declare const k2IndexedPixelFormat: number

export declare const srcCopy: number

export declare const cmProofDeviceClass: number

export declare const cmInternalCFErr: number

export declare const cmDeviceNotRegistered: number

export declare const cmIterateFactoryDeviceProfiles: number

export declare const cmDeviceStateOffline: number

export declare const cmDeviceStateDefault: number

export declare const cmDefaultProfileID: number

export declare const cmDefaultDeviceID: number

export declare const cmCurrentProfileInfoVersion: number

export declare const cmCurrentDeviceInfoVersion: number

export declare const cmDeviceProfileInfoVersion2: number

export declare const cmDeviceProfileInfoVersion1: number

export declare const cmProfileIterateDataVersion4: number

export declare const cmBufferBasedProfile: number

export declare const cmNoProfileBase: number

export declare const cmMCEight8Space: number

export declare const cmMCSeven8Space: number

export declare const cmGamutResult1Space: number

export declare const cmLAB48LSpace: number

export declare const cmLAB48Space: number

export declare const cmLAB32Space: number

export declare const cmLAB24Space: number

export declare const cmLUV32Space: number

export declare const cmXYZ24Space: number

export declare const kSpeechErrorNewestCharacterOffset: interop.Pointer

export declare const cmHLS32Space: number

export declare const cmHSV32Space: number

export declare const cmCMYK64Space: number

export declare const cmCMYK32Space: number

export declare const kPMQueueAlreadyExists: number

export declare const cmRGBA32PmulSpace: number

export declare const cmARGB64PmulSpace: number

export declare const cmARGB32PmulSpace: number

export declare const cmRGBA64LSpace: number

export declare const cmRGBA32Space: number

export declare const kPMScalingPinTopRight: number

export declare const cmARGB64LSpace: number

export declare const cmARGB64Space: number

export declare const cmRGB48Space: number

export declare const cmRGB565Space: number

export declare const cmRGB16LSpace: number

export declare const cmGrayA16PmulSpace: number

export declare const cmGrayA32LSpace: number

export declare const cmGrayA32Space: number

export declare const cmGray16Space: number

export declare const cmRGBAPmulSpace: number

export declare const cmMCEightSpace: number

export declare const modeGetFrontClicks: number

export declare const cmReservedSpace2: number

export declare const cmHLSSpace: number

export declare const cmCMYKSpace: number

export declare const cmNoSpace: number

export declare const cmReverseChannelPacking: number

export declare const cmLittleEndianPacking: number

export declare const cm32_32ColorPacking: number

export declare const cm64_16ColorPacking: number

export declare const cm48_16ColorPacking: number

export declare const kPMJobStreamReadFailed: number

export declare const cm32_16ColorPacking: number

export declare const cm56_8ColorPacking: number

export declare const cm48_8ColorPacking: number

export declare const cm40_8ColorPacking: number

export declare const cm32_8ColorPacking: number

export declare const cm24_8ColorPacking: number

export declare const cmAlphaFirstPacking: number

export declare const cmLong10ColorPacking: number

export declare const cmWord5ColorPacking: number

export declare const cmNoColorPacking: number

export declare const cmColorSpaceEncodingMask: number

export declare const cmColorSpacePackingMask: number

export declare const cmColorSpaceAlphaMask: number

export declare const kICMapNotOutgoingBit: number

export declare const cmColorSpacePremulAlphaMask: number

export declare const cmColorSpaceSpaceMask: number

export declare const kPCSToPCS: number

export declare const kPCSToDevice: number

export declare const kUseBtoB: number

export declare const kCUPSPPDDomain: number

export declare const kUseBtoA: number

export declare const cmProofUse: number

export declare const cmDisplayUse: number

export declare const cmOutputUse: number

export declare const cmEndAccess: number

export declare const cmBeginAccess: number

export declare const cmAbortWriteAccess: number

export declare const cmCloseAccess: number

export declare const cmWriteAccess: number

export declare const cmOpenReadAccess: number

export declare const cmWriteSpool: number

export declare const cmPS8bit: number

export declare const kDefaultCMMSignature: number

export declare const cmBradfordChromaticAdaptation: number

export declare const cmVideoCardGammaTableType: number

export declare const cmCS1CustTag: number

export declare const cmCS1NameTag: number

export declare const cmCS1TRCTag: number

export declare const cmParametricType3: number

export declare const cmParametricType2: number

export declare const cmSolaris: number

export declare const cmMicrosoft: number

export declare const cmNamedColorClass: number

export declare const cmColorSpaceClass: number

export declare const cmAbstractClass: number

export declare const cmOutputClass: number

export declare const cmDisplayClass: number

export declare const cmInputClass: number

export declare const cmNamedData: number

export declare const cm12CLRData: number

export declare const cm11CLRData: number

export declare const cm9CLRData: number

export declare const cm8CLRData: number

export declare const cm4CLRData: number

export declare const cm3CLRData: number

export declare const cmMCH7Data: number

export declare const cmMCH6Data: number

export declare const cmMCH5Data: number

export declare const cmCMYData: number

export declare const cmParametricType0: number

export declare const cmGrayData: number

export declare const cmSRGBData: number

export declare const cmRGBData: number

export declare const cmYxyData: number

export declare const cmLabData: number

export declare const cmXYZData: number

export declare const cmSpotFunctionDefault: number

export declare const cmSpotFunctionUnknown: number

export declare const cmIlluminantEquiPower: number

export declare const ttSelectedDisabled: number

export declare const cmIlluminantD55: number

export declare const cmIlluminantD65: number

export declare const cmIlluminantD50: number

export declare const cmIlluminantUnknown: number

export declare const cmStdobs1964TenDegrees: number

export declare const cmStdobs1931TwoDegrees: number

export declare const cmStdobsUnknown: number

export declare const cmGeometryUnknown: number

export declare const cmTechnologyFlexography: number

export declare const cmTechnologyOffsetLithography: number

export declare const cmTechnologyGravure: number

export declare const cmTechnologyFilmWriter: number

export declare const cmTechnologyPhotographicPaperPrinter: number

export declare const kAlignTopRight: number

export declare const cmTechnologyElectrophotographicPrinter: number

export declare const cmTechnologyInkJetPrinter: number

export declare const cmTechnologyReflectiveScanner: number

export declare const cmTechnologyFilmScanner: number

export declare const cmTechnologyDigitalCamera: number

export declare const cmSigMultiLocalizedUniCodeType: number

export declare const cmSigNativeDisplayInfoType: number

export declare const cmSigVideoCardGammaType: number

export declare const cmSigPS2CRDVMSizeType: number

export declare const cmSigXYZType: number

export declare const cmSigViewingConditionsType: number

export declare const cmSigUnicodeTextType: number

export declare const kGlyphCollectionAdobeCNS1: number

export declare const cmSigUInt32Type: number

export declare const cmSigU1Fixed15Type: number

export declare const cmSigTextType: number

export declare const cmSigS15Fixed16Type: number

export declare const cmSigProfileSequenceDescType: number

export declare const cmSigNamedColor2Type: number

export declare const cmSigMultiFunctB2AType: number

export declare const cmSigMeasurementType: number

export declare const cmSigLut16Type: number

export declare const cmSigDateTimeType: number

export declare const modeTune: number

export declare const cmSigDataType: number

export declare const cmNativeDisplayInfoTag: number

export declare const cmViewingConditionsTag: number

export declare const cmViewingConditionsDescTag: number

export declare const cmScreeningTag: number

export declare const cmRedTRCTag: number

export declare const cmRedColorantTag: number

export declare const cmPS2RenderingIntentTag: number

export declare const cmPS2CRD1Tag: number

export declare const cmPS2CRD0Tag: number

export declare const cmPreview2Tag: number

export declare const cmPreview1Tag: number

export declare const cmPreview0Tag: number

export declare const cmNamedColor2Tag: number

export declare const cmMediaWhitePointTag: number

export declare const cmMediaBlackPointTag: number

export declare const kSpeechCurrentVoiceProperty: interop.Pointer

export declare const cmLuminanceTag: number

export declare const cmGamutTag: number

export declare const cmDeviceModelDescTag: number

export declare const cmCopyrightTag: number

export declare const cmCharTargetTag: number

export declare const cmCalibrationDateTimeTag: number

export declare const cmBToA2Tag: number

export declare const cmAToB2Tag: number

export declare const cmAToB1Tag: number

export declare const cmBinaryData: number

export declare const cmAsciiData: number

export declare const cmAbsoluteColorimetric: number

export declare const cmSaturation: number

export declare const cmPerceptual: number

export declare const cmGlossy: number

export declare const cmGlossyMatteMask: number

export declare const cmNormalMode: number

export declare const cmEmbeddedUse: number

export declare const cmEmbeddedProfile: number

export declare const kSpeechOutputToFileURLProperty: interop.Pointer

export declare const cmGamutCheckingMask: number

export declare const cmInterpolationMask: number

export declare const cmQualityMask: number

export declare const cmBlackPointCompensationMask: number

export declare const cmEmbeddedUseMask: number

export declare const cmEmbeddedMask: number

export declare const cmMagicNumber: number

export declare const cmCS1ProfileVersion: number

export declare const kSpeechDictionaryPronunciations: interop.Pointer

export declare const cmCS2ProfileVersion: number

export declare const cmICCProfileVersion21: number

export declare const cmICCProfileVersion2: number

export declare const kNoEndingProsody: number

export declare const badPasteboardIndexErr: number

export declare const cmSigParametricCurveType: number

export declare const kATSUVerticalCharacterTag: number

export declare const cmRelativeColorimetric: number

export declare const soRecentSync: number

export declare const kPMInvalidConnection: number

export declare const cmPS2CRD2Tag: number

export declare const kSpeechPhonemeInfoSymbol: interop.Pointer

export declare const cmICCReservedFlagsMask: number

export declare const kTransformOffline: number

export declare const cm15CLRData: number

export declare const kATSUStronglyVertical: number

export declare const kAudioUnitProperty_SpeechChannel: number

export declare const kPMInvalidFileType: number

export declare const kGlyphCollectionGID: number

export declare const kLocalPPDDomain: number

export declare const cmProfileIterateDataVersion1: number

export declare const kATSUBackgroundCallback: number

export declare const kAEFetchURL: number

export declare const kATSUStyleUnequal: number

export declare const kSpeechModePhoneme: interop.Pointer

export declare const cmGamutResultSpace: number

export declare const cm10CLRData: number

export declare const kSpeechAudioOutputFormatProperty: interop.Pointer

export declare const kATSLineIgnoreFontLeading: number

export declare const kATSUUseLineControlWidth: number

export declare const kATSFontAutoActivationAsk: number

export declare const kATSFontAutoActivationDefault: number

export declare const kATSOptionFlagsRestrictedScope: number

export declare const kATSOptionFlagsDefaultScope: number

export declare const kATSOptionFlagsIterationScopeMask: number

export declare const kATSOptionFlagsIncludeDisabledMask: number

export declare const kATSOptionFlagsDoNotNotify: number

export declare const kATSOptionFlagsProcessSubdirectories: number

export declare const kATSOptionFlagsActivateDisabled: number

export declare const kATSFontContextGlobal: number

export declare const kATSFontContextUnspecified: number

export declare const kATSInvalidFontContainerAccess: number

export declare const kATSIterationScopeModified: number

export declare const kATSInvalidFontAccess: number

export declare const kATSInvalidFontFamilyAccess: number

export declare const kATSOptionFlagsUseResourceFork: number

export declare const kFontNoLanguage: number

export declare const kFontNoPlatform: number

export declare const cdevUnset: number

export declare const kSpeechCommandSuffix: interop.Pointer

export declare const kSpeechOutputToFileDescriptorProperty: interop.Pointer

export declare const cm8_8ColorPacking: number

export declare const cmARGB32Space: number

export declare const atTop: number

export declare const cmMCFiveSpace: number

export declare const kATSUQDExtendedTag: number

export declare const kQuitBeforeNormalTimeMask: number

export declare const kATSGlyphInfoByteSizeMask: number

export declare const kATSGlyphInfoIsWhiteSpace: number

export declare const kATSGlyphInfoIsRBHanger: number

export declare const kATSGlyphInfoIsAttachment: number

export declare const cmAToB0Tag: number

export declare const kATSStyleApplyHints: number

export declare const kATSStyleAppleReserved: number

export declare const kATSStyleNoAntiAliasing: number

export declare const kATSStyleApplyAntiAliasing: number

export declare const kATSStyleNoHinting: number

export declare const kATSStyleNoOptions: number

export declare const kATSLineDisableAllJustification: number

export declare const cmGray8Space: number

export declare const kATSLineUseQDRendering: number

export declare const kATSLineDisableAutoAdjustDisplayPos: number

export declare const kATSLineNoAntiAliasing: number

export declare const kATSLineApplyAntiAliasing: number

export declare const kATSLineTabAdjustEnabled: number

export declare const kATSLineFillOutToWidth: number

export declare const kATSLineFractDisable: number

export declare const kATSLineLastNoJustification: number

export declare const kATSLineNoSpecialJustification: number

export declare const kATSLineKeepSpacesOutOfMargin: number

export declare const kATSLineHasNoOpticalAlignment: number

export declare const kATSLineNoLayoutOptions: number

export declare const kATSUDecompositionFactorTag: number

export declare const kATSULayoutOperationPostLayoutAdjustment: number

export declare const kSpeechSynthesizerInfoProperty: interop.Pointer

export declare const kATSULayoutOperationTrackingAdjustment: number

export declare const kATSULayoutOperationBaselineAdjustment: number

export declare const kATSULayoutOperationKerningAdjustment: number

export declare const kATSULayoutOperationMorph: number

export declare const kATSULayoutOperationNone: number

export declare const kATSUseFractionalOrigins: number

export declare const kATSUseDeviceOrigins: number

export declare const kATSUseCaretOrigins: number

export declare const kATSNoTracking: number

export declare const cmProfileDescriptionTag: number

export declare const kATSUseLineHeight: number

export declare const kATSUseGlyphAdvance: number

export declare const kATSOtherCurveType: number

export declare const kATSQuadCurveType: number

export declare const kATSBoldQDStretch: number

export declare const kATSFontFormatUnspecified: number

export declare const kFMPostScriptFontTechnology: number

export declare const kFMTrueTypeFontTechnology: number

export declare const kFMFontFileRefFilterSelector: number

export declare const kFMGenerationFilterSelector: number

export declare const kFMFontContainerFilterSelector: number

export declare const kFMCurrentFilterFormat: number

export declare const kInvalidFont: number

export declare const kInvalidFontFamily: number

export declare const cmYXY32Space: number

export declare const modeDoesActivateOnFGSwitch: number

export declare const kATSULineFlushFactorTag: number

export declare const cmTechnologyThermalWaxPrinter: number

export declare const kSpeechModeText: interop.Pointer

export declare const kPMUnableToFindProcess: number

export declare const kPMQualityInkSaver: number

export declare const kATSUByCharacterCluster: number

export declare const kATSDeletedGlyphcode: number

export declare const kFMFontTechnologyFilterSelector: number

export declare const cmGray16LSpace: number

export declare const modeLiteral: number

export declare const atCenterTop: number

export declare const k16BE565PixelFormat: number

export declare const kPMShowPageAttributesPDE: number

export declare const kPMUnknownColorSpaceModel: number

export declare const modeMultiLaunch: number

export declare const modeLaunchDontSwitch: number

export declare const soPhonemeCallBack: number

export declare const kPMSyncRequestFailed: number

export declare const kPMDuplexNone: number

export declare const kHorizontalConstraint: number

export declare const kAudioUnitProperty_Voice: number

export declare const kPMPrintAllPages: number

export declare const cmSigUcrBgType: number

export declare const kPMCoverPageNone: number

export declare const cmTechnologyAMDisplay: number

export declare const cmTechnologyCRTDisplay: number

export declare const kPMDestinationProcessPDF: number

export declare const kPMFontNotFound: number

export declare const cmAlphaSpace: number

export declare const kATSURightToLeftBaseDirection: number

export declare const noPasteboardPromiseKeeperErr: number

export declare const cmGrayTRCTag: number

export declare const modeOnlyBackground: number

export declare const cmGeometry045or450: number

export declare const kSelectorHuge4Bit: number

export declare const kNoTransform: number

export declare const cmInputUse: number

export declare const kPMScalingPinBottomRight: number

export declare const kICNoUserInteractionBit: number

export declare const kICComponentInterfaceVersion4: number

export declare const duplicatePasteboardFlavorErr: number

export declare const kAXFontNameKey: interop.Object

export declare const svSmall1Bit: number

export declare const ttLabel6: number

export declare const cmCMSReservedFlagsMask: number

export declare const cmTechnologyDyeSublimationPrinter: number

export declare const kPMNoPrinterJobID: number

export declare const cmOpenWriteSpool: number

export declare const kATSUPriorityJustOverrideTag: number

export declare const kATSUFontTag: number

export declare const cmReflective: number

export declare const cmRGBSpace: number

export declare const kPMInvalidValue: number

export declare const cmTechnologyPMDisplay: number

export declare const cmGreenColorantTag: number

export declare const cmCloseSpool: number

export declare const cmPrinterDeviceClass: number

export declare const kPMShowInlinePageRange: number

export declare const k16LE5551PixelFormat: number

export declare const modeStationeryAware: number

export declare const ttLabel5: number

export declare const cmRGB48LSpace: number

export declare const kPMUserOrGroupNotFound: number

export declare const cmTechnologyProjectionTelevision: number

export declare const kPMLayoutTopBottomRightLeft: number

export declare const kPMFileOrDirOperationFailed: number

export declare const kUYVY422PixelFormat: number

export declare const kHIShapeParseFromLeft: number

export declare const kATSUForceHangingTag: number

export declare const cmIterateCurrentDeviceProfiles: number

export declare const cmPS2CRD3Tag: number

export declare const kNetworkPPDDomain: number

export declare const cmReadSpool: number

export declare const badPasteboardFlavorErr: number

export declare const kATSUStronglyHorizontal: number

export declare const kPMDestinationPreview: number

export declare const kATSUStyleStrikeThroughColorOptionTag: number

export declare const cmIlluminantD93: number

export declare const cmSigUInt8Type: number

export declare const kATSInvalidGlyphAccess: number

export declare const cmSigUInt64Type: number

export declare const kATSUClearAll: number

export declare const cmCMYKData: number

export declare const kSelectorAllMiniData: number

export declare const cmSiliconGraphics: number

export declare const cmCMYK64LSpace: number

export declare const kATSUSequentialFallbacksExclusive: number

export declare const keyEvtDev: number

export declare const kICMapNotIncomingBit: number

export declare const kSpeechResetProperty: interop.Pointer

export declare const kPMBorderDoubleThickline: number

export declare const kPMInvalidPrintSession: number

export declare const kPMInvalidPMContext: number

export declare const kSpeechRecentSyncProperty: interop.Pointer

export declare const soOutputToFileWithCFURL: number

export declare const ttNone: number

export declare const cmDeviceStateForceNotify: number

export declare const kAXListItemIndexTextAttribute: interop.Object

export declare const modeDisplayManagerAware: number

export declare const cmSigProfileDescriptionType: number

export declare const cmBToA0Tag: number

export declare const kSpeechVolumeProperty: interop.Pointer

export declare const cmSigMultiFunctA2BType: number

export declare const cmProfileIterateDataVersion2: number

export declare const cmSpotFunctionLine: number

export declare const kATSUBeforeWithStreamShiftTag: number

export declare const kATSFontRefUnspecified: number

export declare const cmLuvData: number

export declare const kATSUQDBoldfaceTag: number

export declare const kPMDestinationFile: number

export declare const kSelectorSmall8BitMask: number

export declare const kICMapDataForkBit: number

export declare const keyICEditPreferenceDestination: number

export declare const kHIShapeParseFromTop: number

export declare const kATSOptionFlagsUseDataForkAsResourceFork: number

export declare const k2IndexedGrayPixelFormat: number

export declare const ttDisabled: number

export declare const kQuitNeverMask: number

export declare const kPMReversePortrait: number

export declare const kATSIterationCompleted: number

export declare const kPMInvalidCalibrationTarget: number

export declare const kPMIOMSymbolNotFound: number

export declare const kATSUFromFollowingLayout: number

export declare const kATSUDirectDataDeviceDeltaSInt16Array: number

export declare const ttLabel3: number

export declare const soStatus: number

export declare const cmRGB32Space: number

export declare const cmHSVData: number

export declare const modeNormal: number

export declare const kPMQualityNormal: number

export declare const kHIShapeParseFromRight: number

export declare const kATSUDirectDataStyleIndexUInt16Array: number

export declare const cmGrayAPmulSpace: number

export declare const cmWord565ColorPacking: number

export declare const kTransformSelectedOffline: number

export declare const cmNamedIndexedSpace: number

export declare const kAXAutocorrectedTextAttribute: interop.Object

export declare const kPMInvalidItem: number

export declare const kATSULayoutOperationCallbackStatusHandled: number

export declare const kATSUStyleUnderlineCountOptionTag: number

export declare const svMini1Bit: number

export declare const kDeviceToPCS: number

export declare const cmSRGB16ChannelEncoding: number

export declare const cmTechnologySilkscreen: number

export declare const atNone: number

export declare const kTextToSpeechVoiceType: number

export declare const kAXForegroundColorTextAttribute: interop.Object

export declare const cmSigCrdInfoType: number

export declare const kATSRadiansFactor: number

export declare const cmYXYSpace: number

export declare const kATSUStyleDropShadowTag: number

export declare const copyDev: number

export declare const kATSUTrackingTag: number

export declare const cmProfileSequenceDescTag: number

export declare const kSpeechSynthesizerInfoVersion: interop.Pointer

export declare const kSpeechErrorCallbackCharacterOffset: interop.Pointer

export declare const kATSCubicCurveType: number

export declare const cmAlphaLastPacking: number

export declare const icNoURLErr: number

export declare const cmNamedColorTag: number

export declare const cmPS2CSATag: number

export declare const cmSigLut8Type: number

export declare const kPMLayoutBottomTopLeftRight: number

export declare const kATSUTruncateEnd: number

export declare const cmTaligent: number

export declare const soVolume: number

export declare const kPMServerNotFound: number

export declare const kATSULayoutOperationCallbackStatusContinue: number

export declare const cmSigScreeningType: number

export declare const icConfigNotFoundErr: number

export declare const cmTechnologyVideoCamera: number

export declare const kATSLineDisableAllTrackingAdjustments: number

export declare const cmIterateAllDeviceProfiles: number

export declare const cmMCFive8Space: number

export declare const cmPathBasedProfile: number

export declare const kATSUAfterWithStreamShiftTag: number

export declare const kATSLineImposeNoAngleForEnds: number

export declare const kPMTemplateIsLocked: number

export declare const cmTechnologyTag: number

export declare const kAXShadowTextAttribute: interop.Object

export declare const cmRGB16Space: number

export declare const kAlignTopLeft: number

export declare const cmIterateDeviceProfilesMask: number

export declare const kATSLineDisableAllBaselineAdjustments: number

export declare const kInvalidGeneration: number

export declare const kATSUByTypographicCluster: number

export declare const kAlignCenterTop: number

export declare const cmYCbCrData: number

export declare const kPMDevNColorSpaceModel: number

export declare const cmOriginalProfileLocationSize: number

export declare const kATSOptionFlagsComposeFontPostScriptName: number

export declare const cmCurrentProfileLocationSize: number

export declare const ttLabel4: number

export declare const soErrors: number

export declare const cmLUVSpace: number

export declare const cmDeviceMfgDescTag: number

export declare const kATSOptionFlagsIterateByPrecedenceMask: number

export declare const kATSUSizeTag: number

export declare const kSelectorAll32BitData: number

export declare const kAlignNone: number

export declare const cmPS7bit: number

export declare const kICServicesUDPBit: number

export declare const cmUcrBgTag: number

export declare const kATSULineDescentTag: number

export declare const cmSpotFunctionRound: number

export declare const atVerticalCenter: number

export declare const cmLinesPer: number

export declare const kICComponentVersion: number

export declare const soRate: number

export declare const kInternetEventClass: number

export declare const cmMCSixSpace: number

export declare const cmUseDefaultChromaticAdaptation: number

export declare const kATSGlyphInfoTerminatorGlyph: number

export declare const kTransformLabel1: number

export declare const kATSLineDisableAllLayoutOperations: number

export declare const cmDisplayDeviceClass: number

export declare const soNumberMode: number

export declare const svSmall4Bit: number

export declare const kSpeechRateProperty: interop.Pointer

export declare const kPMInvalidPageFormat: number

export declare const kSpeechDictionaryLocaleIdentifier: interop.Pointer

export declare const kSpeechCharacterModeProperty: interop.Pointer

export declare const kATSULineHighlightCGColorTag: number

export declare const kPMShowInlinePaperSize: number

export declare const kSpeechDictionaryEntrySpelling: interop.Pointer

export declare const kAlignLeft: number

export declare const kATSFontAutoActivationEnabled: number

export declare const kYVYU422PixelFormat: number

export declare const kAXNaturalLanguageTextAttribute: interop.Object

export declare const kPMGrayColorSpaceModel: number

export declare const kATSUUseGrafPortPenLoc: number

export declare const kSpeechErrorNewest: interop.Pointer

export declare const kATSULineBaselineValuesTag: number

export declare const cmRGBA64LPmulSpace: number

export declare const kPMScalingPinTopLeft: number

export declare const kPMUnexpectedImagingError: number

export declare const kPMScalingCenterOnPaper: number

export declare const kATSUStyleStrikeThroughTag: number

export declare const cmRGBA64Space: number

export declare const kATSUStyleDropShadowColorOptionTag: number

export declare const atLeft: number

export declare const kATSURGBAlphaColorTag: number

export declare const cmIlluminantA: number

export declare const kPMTicketTypeNotFound: number

export declare const k1MonochromePixelFormat: number

export declare const launchDontSwitch: number

export declare const kATSULangRegionTag: number

export declare const kSpeechAudioGraphProperty: interop.Pointer

export declare const kATSGenerationUnspecified: number

export declare const kATSULineRotationTag: number

export declare const kATSUTruncateSpecificationMask: number

export declare const cmRGBASpace: number

export declare const k4IndexedPixelFormat: number

export declare const cm5CLRData: number

export declare const kTransformOpen: number

export declare const cmColorSpaceReservedMask: number

export declare const kATSItalicQDSkew: number

export declare const cmCameraDeviceClass: number

export declare const kTransformLabel4: number

export declare const cmBToA1Tag: number

export declare const kSpeechVoiceCreator: interop.Pointer

export declare const kPMServerAlreadyRunning: number

export declare const kAudioUnitSubType_SpeechSynthesis: number

export declare const mode32BitCompatible: number

export declare const kSelectorAll1BitData: number

export declare const kQuitBeforeShellQuitsMask: number

export declare const kICMapResourceForkMask: number

export declare const cmGraySpace: number

export declare const cmAlphaPmulSpace: number

export declare const kPMCreateMessageFailed: number

export declare const cmDeviceStateBusy: number

export declare const cmNumHeaderElements: number

export declare const kHIShapeParseFromBottom: number

export declare const kPMJobGetTicketBadFormatError: number

export declare const kAXBackgroundColorTextAttribute: interop.Object

export declare const kATSULayoutOperationJustification: number

export declare const atCenterBottom: number

export declare const cm14CLRData: number

export declare const cmLinkClass: number

export declare const cmFlare100: number

export declare const kICMapPostBit: number

export declare const kATSUGlyphSelectorTag: number

export declare const cmOpenWriteAccess: number

export declare const macDev: number

export declare const kAXListItemLevelTextAttribute: interop.Object

export declare const cmSpotFunctionEllipse: number

export declare const kPlotIconRefNoMask: number

export declare const cmPrtrDefaultScreens: number

export declare const kATSUStyleContains: number

export declare const cmSpotFunctionCross: number

export declare const kProcessTransformToBackgroundApplication: number

export declare const soSoundOutput: number

export declare const keyAEAttaching: number

export declare const kATSULineTextLocatorTag: number

export declare const kPMNotImplemented: number

export declare const kAXSuperscriptTextAttribute: interop.Object

export declare const kATSUDefaultFontFallbacks: number

export declare const cmICCProfileVersion4: number

export declare const kPMDuplexNoTumble: number

export declare const cmBlueColorantTag: number

export declare const cmMacintosh: number

export declare const cmCreateNewAccess: number

export declare const kUAZoomFocusTypeOther: number

export declare const kSpeechPhonemeSymbolsProperty: interop.Pointer

export declare const kPMGeneralError: number

export declare const kATSUHangingInhibitFactorTag: number

export declare const kPMJobStreamEndError: number

export declare const cmVonKriesChromaticAdaptation: number

export declare const kATSFontFilterCurrentVersion: number

export declare const kPMInternalError: number

export declare const kPMJobGetTicketReadError: number

export declare const cmCurrentProfileMajorVersion: number

export declare const cmXYZ32Space: number

export declare const cmNamedIndexed32LSpace: number

export declare const cmProfileMajorVersionMask: number

export declare const cm13CLRData: number

export declare const ttSelectedOffline: number

export declare const kSetFrontProcessFrontWindowOnly: number

export declare const k8IndexedGrayPixelFormat: number

export declare const kICMapNotOutgoingMask: number

export declare const cmGrayA32PmulSpace: number

export declare const kATSULineDirectionTag: number

export declare const kTransformSelected: number

export declare const kSelectorAllAvailableData: number

export declare const initDev: number

export declare const modeGetAppDiedMsg: number

export declare const soCurrentVoice: number

export declare const cm6CLRData: number

export declare const kSpeechNoEndingProsody: interop.Pointer

export declare const kYUV411PixelFormat: number

export declare const kCurrentProcess: number

export declare const kImmediate: number

export declare const cm16_8ColorPacking: number

export declare const svAll8BitData: number

export declare const atTopRight: number

export declare const cmXYZSpace: number

export declare const kAXValueAXErrorType: number

export declare const cmProfileIterateDataVersion3: number

export declare const cmChromaticAdaptationTag: number

export declare const cmSigMakeAndModelType: number

export declare const kAlignVerticalCenter: number

export declare const cmHSVSpace: number

export declare const cmRGBA64PmulSpace: number

export declare const kAXMarkedMisspelledTextAttribute: interop.Object

export declare const cmGrayA32LPmulSpace: number

export declare const kATSUFromTextBeginning: number

export declare const kATSULayoutOperationAppleReserved: number

export declare const kATSULineLangRegionTag: number

export declare const kPreflightThenPause: number

export declare const cmCS1ChromTag: number

export declare const cmRGB565LSpace: number

export declare const kPMValidateTicketFailed: number

export declare const kPMDuplexTumble: number

export declare const kPMPrinterStopped: number

export declare const svMini4Bit: number

export declare const kPMPaperTypeTransparency: number

export declare const modeLocalAndRemoteHLEvents: number

export declare const kATSLineHasNoHangers: number

export declare const cmSpotFunctionSquare: number

export declare const kYUVUPixelFormat: number

export declare const modeCanBackground: number

export declare const kATSFontAutoActivationDisabled: number

export declare const modeNeedSuspendResume: number

export declare const cmDraftMode: number

export declare const kATSULastResortOnlyFallback: number

export declare const cmSigCurveType: number

export declare const cmIlluminantF8: number

export declare const cmVideoCardGammaTag: number

export declare const kAXFontSizeKey: interop.Object

export declare const kPMSimplexTumble: number

export declare const cmLABSpace: number

export declare const cdevGenErr: number

export declare const kATSGlyphInfoHasImposedWidth: number

export declare const kAlignCenterRight: number

export declare const extendedBlock: number

export declare const cmTechnologyPhotoImageSetter: number

export declare const kPMLayoutLeftRightTopBottom: number

export declare const kSpeechPitchModProperty: interop.Pointer

export declare const kATSLineDisableAllGlyphMorphing: number

export declare const kFMFontFamilyCallbackFilterSelector: number

export declare const cmPS2CRDVMSizeTag: number

export declare const cmProfileDescriptionMLTag: number

export declare const cmOpenReadSpool: number

export declare const kUseAtoB: number

export declare const kPMInvalidIndex: number

export declare const cmDeviceAlreadyRegistered: number

export declare const soSynthExtension: number

export declare const kPMPortrait: number

export declare const soVoiceDescription: number

export declare const kPMDestinationPrinter: number

export declare const kPMPluginNotFound: number

export declare const cmHLSData: number

export declare const ttSelected: number

export declare const kPMJobStreamOpenFailed: number

export declare const cmSigU16Fixed16Type: number

export declare const cmBestMode: number

export declare const ttLabel1: number

export declare const kATSUByWord: number

export declare const kSelectorHuge8BitMask: number

export declare const kATSUDirectDataStyleSettingATSUStyleSettingRefArray: number

export declare const kICComponentInterfaceVersion: number

export declare const cmColorSpaceSpaceAndAlphaMask: number

export declare const kATSLineDisableNegativeJustification: number

export declare const kSpeechModeTune: interop.Pointer

export declare const kATSGlyphInfoIsLTHanger: number

export declare const cmOneBitDirectPacking: number

export declare const kPMTicketIsLocked: number

export declare const soPitchBase: number

export declare const kPMPrinterIdle: number

export declare const kPMOutOfScope: number

export declare const kATSLineDisableAllKerningAdjustments: number

export declare const kPMShowInlineCopies: number

export declare const kATSUStyleTextLocatorTag: number

export declare const kATSFlattenedFontSpecifierRawNameData: number

export declare const cmReservedSpace1: number

export declare const icTruncatedErr: number

export declare const cmTechnologyElectrostaticPrinter: number

export declare const launchContinue: number

export declare const cmGrayASpace: number

export declare const kAXListItemPrefixTextAttribute: interop.Object

export declare const cmMCH8Data: number

export declare const cmBlackPointCompensation: number

export declare const cmMCSix8Space: number

export declare const cmMeasurementTag: number

export declare const kPMStatusFailed: number

export declare const kAXLinkTextAttribute: interop.Object

export declare const kATSOptionFlagsRecordPersistently: number

export declare const kPMDontSwitchPDEError: number

export declare const kATSLineUseDeviceMetrics: number

export declare const kSelectorAllHugeData: number

export declare const kATSUImposeWidthTag: number

export declare const kPMCMYKColorSpaceModel: number

export declare const kATSUStyleRenderingOptionsTag: number

export declare const icInternalErr: number

export declare const kICServicesTCPMask: number

export declare const kATSULineLanguageTag: number

export declare const cmXYZ48Space: number

export declare const cmParametricType1: number

export declare const kPMQualityDraft: number

export declare const kYVU9PixelFormat: number

export declare const atCenterRight: number

export declare const kATSUNoSpecialJustificationTag: number

export declare const kSpeechPhonemeCallBack: interop.Pointer

export declare const kPMFeatureNotInstalled: number

export declare const kTranslationFileTranslation: number

export declare const deactivDev: number

export declare const cmSpotFunctionDiamond: number

export declare const kATSLineAppleReserved: number

export declare const atTopLeft: number

export declare const kAlignRight: number

export declare const kPMKeyOrValueNotFound: number

export declare const kAlignHorizontalCenter: number

export declare const kPMDestinationFax: number

export declare const cmSigSignatureType: number

export declare const AXUnderlineStyle: {
	None: 0
	Single: 1
	Thick: 2
	Double: 9
}

export declare const ATSFontNotifyAction: {
	Fonts: 1
	Directories: 2
}

export declare const PMDataFormat: {
	Default: 0
	Minimal: 1
	Compressed: 2
}

export declare const ATSFontNotifyOption: {
	Default: 0
	ReceiveWhileSuspended: 1
}

export declare const AXValueType: {
	CGPoint: 1
	CGSize: 2
	CGRect: 3
	CFRange: 4
	AXError: 5
	Illegal: 0
}

export declare const AXPriority: {
	Low: 10
	Medium: 50
	High: 90
}

export declare const AXMenuItemModifiers: {
	None: 0
	Shift: 1
	Option: 2
	Control: 4
	NoCommand: 8
}

export declare const PasteboardStandardLocation: {
	Trash: 1953657704
	Unknown: 1970170734
}

export declare const PasteboardSyncFlags: {
	Modified: 1
	ClientIsOwner: 2
}

export declare const AXCopyMultipleAttributeOptions: {
	kAXCopyMultipleAttributeOptionStopOnError: 1
}

export declare const ATSFontFilterSelector: {
	FontFilterSelectorUnspecified: 0
	FontFilterSelectorGeneration: 3
	FontFilterSelectorFontFamily: 7
	FontFilterSelectorFontFamilyApplierFunction: 8
	FontFilterSelectorFontApplierFunction: 9
	FileReferenceFilterSelector: 10
}

export declare const PMPageToPaperMappingType: {
	None: 1
	ScaleToFit: 2
}

export declare const CMFloatBitmapFlags: {
	None: 0
	Alpha: 1
	AlphaPremul: 2
	RangeClipped: 4
}

export declare const PasteboardFlavorFlags: {
	NoFlags: 0
	SenderOnly: 1
	SenderTranslated: 2
	NotSaved: 4
	RequestOnly: 8
	SystemTranslated: 256
	Promised: 512
}

export declare const ATSFontQueryMessageID: {
	kATSQueryActivateFontMessage: 1635021665
}

export declare const AXError: {
	Success: 0
	Failure: -25200
	IllegalArgument: -25201
	InvalidUIElement: -25202
	InvalidUIElementObserver: -25203
	CannotComplete: -25204
	AttributeUnsupported: -25205
	ActionUnsupported: -25206
	NotificationUnsupported: -25207
	NotImplemented: -25208
	NotificationAlreadyRegistered: -25209
	NotificationNotRegistered: -25210
	APIDisabled: -25211
	NoValue: -25212
	ParameterizedAttributeUnsupported: -25213
	NotEnoughPrecision: -25214
}

export declare class SizeResourceRec {
	constructor(init?: SizeResourceRec)
	flags: number
	preferredHeapSize: number
	minimumHeapSize: number
}

export declare class ATSGlyphIdealMetrics {
	constructor(init?: ATSGlyphIdealMetrics)
	advance: CGPoint
	sideBearing: CGPoint
	otherSideBearing: CGPoint
}

export declare class CMConcatProfileSet {
	constructor(init?: CMConcatProfileSet)
	keyIndex: number
	count: number
	profileSet: unknown /* const array */
}

export declare class OpaquePMPrintSettings {
	constructor(init?: OpaquePMPrintSettings)
}

export declare class ATSUGlyphInfoArray {
	constructor(init?: ATSUGlyphInfoArray)
	layout: interop.Pointer
	numGlyphs: number
	glyphs: unknown /* const array */
}

export declare class ATSFlatDataStyleListFeatureData {
	constructor(init?: ATSFlatDataStyleListFeatureData)
	theFeatureType: number
	theFeatureSelector: number
}

export declare class ProcessInfoRec {
	constructor(init?: ProcessInfoRec)
	processInfoLength: number
	processName: interop.Pointer
	processNumber: ProcessSerialNumber
	processType: number
	processSignature: number
	processMode: number
	processLocation: string | null
	processSize: number
	processFreeMem: number
	processLauncher: ProcessSerialNumber
	processLaunchDate: number
	processActiveTime: number
	processAppRef: interop.Pointer
}

export declare class OpaquePMPrintSession {
	constructor(init?: OpaquePMPrintSession)
}

export declare class OpaquePasteboardRef {
	constructor(init?: OpaquePasteboardRef)
}

export declare class ATSFlatDataLineInfoHeader {
	constructor(init?: ATSFlatDataLineInfoHeader)
	numberOfLines: number
	lineInfoArray: unknown /* const array */
}

export declare class NCMConcatProfileSpec {
	constructor(init?: NCMConcatProfileSpec)
	renderingIntent: number
	transformTag: number
	profile: interop.Pointer
}

export declare class CMMakeAndModelType {
	constructor(init?: CMMakeAndModelType)
	typeDescriptor: number
	reserved: number
	makeAndModel: CMMakeAndModel
}

export declare class ATSFlatDataStyleRunDataHeader {
	constructor(init?: ATSFlatDataStyleRunDataHeader)
	numberOfStyleRuns: number
	styleRunArray: unknown /* const array */
}

export declare class FMFontFamilyInstance {
	constructor(init?: FMFontFamilyInstance)
	fontFamily: number
	fontStyle: number
}

export declare class CMGrayColor {
	constructor(init?: CMGrayColor)
	gray: number
}

export declare class ICAppSpec {
	constructor(init?: ICAppSpec)
	fCreator: number
	name: unknown /* const array */
}

export declare class ATSUCaret {
	constructor(init?: ATSUCaret)
	fX: number
	fY: number
	fDeltaX: number
	fDeltaY: number
}

export declare class FMInput {
	constructor(init?: FMInput)
	family: number
	size: number
	face: number
	needBits: number
	device: number
	numer: Point
	denom: Point
}

export declare class SpeechErrorInfo {
	constructor(init?: SpeechErrorInfo)
	count: number
	oldest: number
	oldPos: number
	newest: number
	newPos: number
}

export declare class SpeechStatusInfo {
	constructor(init?: SpeechStatusInfo)
	outputBusy: number
	outputPaused: number
	inputBytesLeft: number
	phonemeCode: number
}

export declare class CMProfileIterateData {
	constructor(init?: CMProfileIterateData)
	dataVersion: number
	header: CM2Header
	code: number
	name: unknown /* const array */
	location: CMProfileLocation
	uniCodeNameCount: number
	uniCodeName: interop.Pointer
	asciiName: interop.Pointer
	makeAndModel: interop.Pointer
	digest: interop.Pointer
}

export declare class DelimiterInfo {
	constructor(init?: DelimiterInfo)
	startDelimiter: unknown /* const array */
	endDelimiter: unknown /* const array */
}

export declare class SpeechVersionInfo {
	constructor(init?: SpeechVersionInfo)
	synthType: number
	synthSubType: number
	synthManufacturer: number
	synthFlags: number
	synthVersion: NumVersion
}

export declare class VoiceFileInfo {
	constructor(init?: VoiceFileInfo)
	fileSpec: FSSpec
	resID: number
}

export declare class VoiceSpec {
	constructor(init?: VoiceSpec)
	creator: number
	id: number
}

export declare class LLCStyleInfo {
	constructor(init?: LLCStyleInfo)
}

export declare class ATSFlatDataFontSpecRawNameDataHeader {
	constructor(init?: ATSFlatDataFontSpecRawNameDataHeader)
	numberOfFlattenedNames: number
	nameDataArray: unknown /* const array */
}

export declare class ATSFlatDataFontNameDataHeader {
	constructor(init?: ATSFlatDataFontNameDataHeader)
	nameSpecifierType: number
	nameSpecifierSize: number
}

export declare class ATSFlatDataStyleListVariationData {
	constructor(init?: ATSFlatDataStyleListVariationData)
	theVariationAxis: number
	theVariationValue: number
}

export declare class ATSFlatDataStyleListStyleDataHeader {
	constructor(init?: ATSFlatDataStyleListStyleDataHeader)
	sizeOfStyleInfo: number
	numberOfSetAttributes: number
	numberOfSetFeatures: number
	numberOfSetVariations: number
}

export declare class ATSFlatDataLineInfoData {
	constructor(init?: ATSFlatDataLineInfoData)
	lineLength: number
	numberOfLineControls: number
}

export declare class ATSFlatDataLayoutControlsDataHeader {
	constructor(init?: ATSFlatDataLayoutControlsDataHeader)
	numberOfLayoutControls: number
	controlArray: unknown /* const array */
}

export declare class ATSFlatDataTextLayoutDataHeader {
	constructor(init?: ATSFlatDataTextLayoutDataHeader)
	sizeOfLayoutData: number
	textLayoutLength: number
	offsetToLayoutControls: number
	offsetToLineInfo: number
}

export declare class ATSUGlyphInfo {
	constructor(init?: ATSUGlyphInfo)
	glyphID: number
	reserved: number
	layoutFlags: number
	charIndex: number
	style: interop.Pointer
	deltaY: number
	idealX: number
	screenX: number
	caretX: number
}

export declare class OpaqueATSUStyle {
	constructor(init?: OpaqueATSUStyle)
}

export declare class OpaqueATSUTextLayout {
	constructor(init?: OpaqueATSUTextLayout)
}

export declare class KernTable {
	constructor(init?: KernTable)
	numKerns: number
}

export declare class KernPair {
	constructor(init?: KernPair)
	kernFirst: number
	kernSecond: number
	kernWidth: number
}

export declare class NameTable {
	constructor(init?: NameTable)
	stringCount: number
	baseFontName: unknown /* const array */
}

export declare class FontAssoc {
	constructor(init?: FontAssoc)
	numAssoc: number
}

export declare class AsscEntry {
	constructor(init?: AsscEntry)
	fontSize: number
	fontStyle: number
	fontID: number
}

export declare class FamRec {
	constructor(init?: FamRec)
	ffFlags: number
	ffFamID: number
	ffFirstChar: number
	ffLastChar: number
	ffAscent: number
	ffDescent: number
	ffLeading: number
	ffWidMax: number
	ffWTabOff: number
	ffKernOff: number
	ffStylOff: number
	ffProperty: unknown /* const array */
	ffIntl: unknown /* const array */
	ffVersion: number
}

export declare class FontRec {
	constructor(init?: FontRec)
	fontType: number
	firstChar: number
	lastChar: number
	widMax: number
	kernMax: number
	nDescent: number
	fRectWidth: number
	fRectHeight: number
	owTLoc: number
	ascent: number
	descent: number
	leading: number
	rowWords: number
}

export declare class CMNamedColorType {
	constructor(init?: CMNamedColorType)
	typeDescriptor: number
	reserved: number
	vendorFlag: number
	count: number
	prefixName: unknown /* const array */
}

export declare class ATSFontNotificationInfoRef_ {
	constructor(init?: ATSFontNotificationInfoRef_)
}

export declare class ATSFlatDataMainHeaderBlock {
	constructor(init?: ATSFlatDataMainHeaderBlock)
	version: number
	sizeOfDataBlock: number
	offsetToTextLayouts: number
	offsetToStyleRuns: number
	offsetToStyleList: number
}

export declare class PMResolution {
	constructor(init?: PMResolution)
	hRes: number
	vRes: number
}

export declare class PMRect {
	constructor(init?: PMRect)
	top: number
	left: number
	bottom: number
	right: number
}

export declare class OpaquePMPaper {
	constructor(init?: OpaquePMPaper)
}

export declare class OpaquePMPreset {
	constructor(init?: OpaquePMPreset)
}

export declare class CMSignatureType {
	constructor(init?: CMSignatureType)
	typeDescriptor: number
	reserved: number
	signature: number
}

export declare class OpaquePMPrinter {
	constructor(init?: OpaquePMPrinter)
}

export declare class OpaquePMPageFormat {
	constructor(init?: OpaquePMPageFormat)
}

export declare class __AXValue {
	constructor(init?: __AXValue)
}

export declare class __AXObserver {
	constructor(init?: __AXObserver)
}

export declare class __AXTextMarkerRange {
	constructor(init?: __AXTextMarkerRange)
}

export declare class ATSUStyleRunInfo {
	constructor(init?: ATSUStyleRunInfo)
	runLength: number
	styleObjectIndex: number
}

export declare class __AXTextMarker {
	constructor(init?: __AXTextMarker)
}

export declare class VoiceDescription {
	constructor(init?: VoiceDescription)
	length: number
	voice: VoiceSpec
	version: number
	name: unknown /* const array */
	comment: unknown /* const array */
	gender: number
	age: number
	script: number
	language: number
	region: number
	reserved: unknown /* const array */
}

export declare class LaunchParamBlockRec {
	constructor(init?: LaunchParamBlockRec)
	reserved1: number
	reserved2: number
	launchBlockID: number
	launchEPBLength: number
	launchFileFlags: number
	launchControlFlags: number
	launchAppRef: interop.Pointer
	launchProcessSN: ProcessSerialNumber
	launchPreferredSize: number
	launchMinimumSize: number
	launchAvailableSize: number
	launchAppParameters: interop.Pointer
}

export declare class ICServices {
	constructor(init?: ICServices)
	count: number
	services: unknown /* const array */
}

export declare class ICServiceEntry {
	constructor(init?: ICServiceEntry)
	name: unknown /* const array */
	port: number
	flags: number
}

export declare class ICMapEntry {
	constructor(init?: ICMapEntry)
	totalLength: number
	fixedLength: number
	version: number
	fileType: number
	fileCreator: number
	postCreator: number
	flags: number
	extension: unknown /* const array */
	creatorAppName: unknown /* const array */
	postAppName: unknown /* const array */
	MIMEType: unknown /* const array */
	entryName: unknown /* const array */
}

export declare class ICFileSpec {
	constructor(init?: ICFileSpec)
	volName: unknown /* const array */
	volCreationDate: number
	fss: FSSpec
	alias: AliasRecord
}

export declare class OpaqueICInstance {
	constructor(init?: OpaqueICInstance)
}

export declare class MacPolygon {
	constructor(init?: MacPolygon)
	polySize: number
	polyBBox: Rect
	polyPoints: unknown /* const array */
}

export declare class OpaqueWindowPtr {
	constructor(init?: OpaqueWindowPtr)
}

export declare class FontInfo {
	constructor(init?: FontInfo)
	ascent: number
	descent: number
	widMax: number
	leading: number
}

export declare class Picture {
	constructor(init?: Picture)
	picSize: number
	picFrame: Rect
}

export declare class GDevice {
	constructor(init?: GDevice)
	gdRefNum: number
	gdID: number
	gdType: number
	gdITable: interop.Pointer
	gdResPref: number
	gdSearchProc: interop.Pointer
	gdCompProc: interop.Pointer
	gdFlags: number
	gdPMap: interop.Pointer
	gdRefCon: number
	gdNextGD: interop.Pointer
	gdRect: Rect
	gdMode: number
	gdCCBytes: number
	gdCCDepth: number
	gdCCXData: interop.Pointer
	gdCCXMask: interop.Pointer
	gdExt: interop.Pointer
}

export declare class PixPat {
	constructor(init?: PixPat)
	patType: number
	patMap: interop.Pointer
	patData: interop.Pointer
	patXData: interop.Pointer
	patXValid: number
	patXMap: interop.Pointer
	pat1Data: Pattern
}

export declare class ColorTable {
	constructor(init?: ColorTable)
	ctSeed: number
	ctFlags: number
	ctSize: number
	ctTable: unknown /* const array */
}

export declare class RGBColor {
	constructor(init?: RGBColor)
	red: number
	green: number
	blue: number
}

export declare class BitMap {
	constructor(init?: BitMap)
	baseAddr: string | null
	rowBytes: number
	bounds: Rect
}

export declare class NCMDeviceProfileInfo {
	constructor(init?: NCMDeviceProfileInfo)
	dataVersion: number
	profileID: number
	profileLoc: CMProfileLocation
	profileName: interop.Object | null
	profileScope: CMDeviceScope
	reserved: number
}

export declare class CMDeviceProfileInfo {
	constructor(init?: CMDeviceProfileInfo)
	dataVersion: number
	profileID: number
	profileLoc: CMProfileLocation
	profileName: interop.Object | null
	reserved: number
}

export declare class CMDeviceInfo {
	constructor(init?: CMDeviceInfo)
	dataVersion: number
	deviceClass: number
	deviceID: number
	deviceScope: CMDeviceScope
	deviceState: number
	defaultProfileID: number
	deviceName: interop.Pointer
	profileCount: number
	reserved: number
}

export declare class CMFloatBitmap {
	constructor(init?: CMFloatBitmap)
	version: number
	buffers: unknown /* const array */
	height: number
	width: number
	rowStride: number
	colStride: number
	space: number
	flags: interop.Enum<typeof CMFloatBitmapFlags>
}

export declare class CMProfileLocation {
	constructor(init?: CMProfileLocation)
	locType: number
	u: CMProfLoc
}

export declare class CMHandleLocation {
	constructor(init?: CMHandleLocation)
	h: interop.Pointer
}

export declare class CMMInfo {
	constructor(init?: CMMInfo)
	dataSize: number
	CMMType: number
	CMMMfr: number
	CMMVersion: number
	ASCIIName: unknown /* const array */
	ASCIIDesc: unknown /* const array */
	UniCodeNameCount: number
	UniCodeName: unknown /* const array */
	UniCodeDescCount: number
	UniCodeDesc: unknown /* const array */
}

export declare class CMNamedColor {
	constructor(init?: CMNamedColor)
	namedColorIndex: number
}

export declare class CMTagElemTable {
	constructor(init?: CMTagElemTable)
	count: number
	tagList: unknown /* const array */
}

export declare class CMMultichannel8Color {
	constructor(init?: CMMultichannel8Color)
	components: unknown /* const array */
}

export declare class CMMultichannel7Color {
	constructor(init?: CMMultichannel7Color)
	components: unknown /* const array */
}

export declare class CMMultichannel6Color {
	constructor(init?: CMMultichannel6Color)
	components: unknown /* const array */
}

export declare class CMMultichannel5Color {
	constructor(init?: CMMultichannel5Color)
	components: unknown /* const array */
}

export declare class CMYxyColor {
	constructor(init?: CMYxyColor)
	capY: number
	x: number
	y: number
}

export declare class CMCMYKColor {
	constructor(init?: CMCMYKColor)
	cyan: number
	magenta: number
	yellow: number
	black: number
}

export declare class CMMultiLocalizedUniCodeType {
	constructor(init?: CMMultiLocalizedUniCodeType)
	typeDescriptor: number
	reserved: number
	entryCount: number
	entrySize: number
}

export declare class CMMultiLocalizedUniCodeEntryRec {
	constructor(init?: CMMultiLocalizedUniCodeEntryRec)
	languageCode: unknown /* const array */
	regionCode: unknown /* const array */
	textLength: number
	textOffset: number
}

export declare class CMVideoCardGamma {
	constructor(init?: CMVideoCardGamma)
	tagType: number
	u: unnamed_4672107459432106759
}

export declare class CMVideoCardGammaFormula {
	constructor(init?: CMVideoCardGammaFormula)
	redGamma: number
	redMin: number
	redMax: number
	greenGamma: number
	greenMin: number
	greenMax: number
	blueGamma: number
	blueMin: number
	blueMax: number
}

export declare class CMVideoCardGammaTable {
	constructor(init?: CMVideoCardGammaTable)
	channels: number
	entryCount: number
	entrySize: number
	data: unknown /* const array */
}

export declare class CMPS2CRDVMSizeType {
	constructor(init?: CMPS2CRDVMSizeType)
	typeDescriptor: number
	reserved: number
	count: number
	intentCRD: unknown /* const array */
}

export declare class CMIntentCRDVMSize {
	constructor(init?: CMIntentCRDVMSize)
	renderingIntent: number
	VMSize: number
}

export declare class CMUcrBgType {
	constructor(init?: CMUcrBgType)
	typeDescriptor: number
	reserved: number
	ucrCount: number
	ucrValues: unknown /* const array */
}

export declare class CMXYZType {
	constructor(init?: CMXYZType)
	typeDescriptor: number
	reserved: number
	XYZ: unknown /* const array */
}

export declare class SpeechChannelRecord {
	constructor(init?: SpeechChannelRecord)
	data: unknown /* const array */
}

export declare class CMUInt32ArrayType {
	constructor(init?: CMUInt32ArrayType)
	typeDescriptor: number
	reserved: number
	value: unknown /* const array */
}

export declare class CMUInt8ArrayType {
	constructor(init?: CMUInt8ArrayType)
	typeDescriptor: number
	reserved: number
	value: unknown /* const array */
}

export declare class CMS15Fixed16ArrayType {
	constructor(init?: CMS15Fixed16ArrayType)
	typeDescriptor: number
	reserved: number
	value: unknown /* const array */
}

export declare class CMUnicodeTextType {
	constructor(init?: CMUnicodeTextType)
	typeDescriptor: number
	reserved: number
	text: unknown /* const array */
}

export declare class CMTextType {
	constructor(init?: CMTextType)
	typeDescriptor: number
	reserved: number
	text: unknown /* const array */
}

export declare class CMNativeDisplayInfoType {
	constructor(init?: CMNativeDisplayInfoType)
	typeDescriptor: number
	reserved: number
	nativeDisplayInfo: CMNativeDisplayInfo
}

export declare class CMNativeDisplayInfo {
	constructor(init?: CMNativeDisplayInfo)
	dataSize: number
	redPhosphor: CMFixedXYColor
	greenPhosphor: CMFixedXYColor
	bluePhosphor: CMFixedXYColor
	whitePoint: CMFixedXYColor
	redGammaValue: number
	greenGammaValue: number
	blueGammaValue: number
	gammaChannels: number
	gammaEntryCount: number
	gammaEntrySize: number
	gammaData: unknown /* const array */
}

export declare class CMNamedColor2Type {
	constructor(init?: CMNamedColor2Type)
	typeDescriptor: number
	reserved: number
	vendorFlag: number
	count: number
	deviceChannelCount: number
	prefixName: unknown /* const array */
	suffixName: unknown /* const array */
	data: unknown /* const array */
}

export declare class CMNamedColor2EntryType {
	constructor(init?: CMNamedColor2EntryType)
	rootName: unknown /* const array */
	PCSColorCoords: unknown /* const array */
	DeviceColorCoords: unknown /* const array */
}

export declare class KernEntry {
	constructor(init?: KernEntry)
	kernStyle: number
	kernLength: number
}

export declare class CMMeasurementType {
	constructor(init?: CMMeasurementType)
	typeDescriptor: number
	reserved: number
	standardObserver: number
	backingXYZ: CMFixedXYZColor
	geometry: number
	flare: number
	illuminant: number
}

export declare class CMMultiFunctCLUTType {
	constructor(init?: CMMultiFunctCLUTType)
	gridPoints: unknown /* const array */
	entrySize: number
	reserved: unknown /* const array */
	data: unknown /* const array */
}

export declare class CMLut8Type {
	constructor(init?: CMLut8Type)
	typeDescriptor: number
	reserved: number
	inputChannels: number
	outputChannels: number
	gridPoints: number
	reserved2: number
	matrix: unknown /* const array */
	inputTable: unknown /* const array */
}

export declare class CMLut16Type {
	constructor(init?: CMLut16Type)
	typeDescriptor: number
	reserved: number
	inputChannels: number
	outputChannels: number
	gridPoints: number
	reserved2: number
	matrix: unknown /* const array */
	inputTableEntries: number
	outputTableEntries: number
	inputTable: unknown /* const array */
}

export declare class CMAdaptationMatrixType {
	constructor(init?: CMAdaptationMatrixType)
	typeDescriptor: number
	reserved: number
	adaptationMatrix: unknown /* const array */
}

export declare class CMTagRecord {
	constructor(init?: CMTagRecord)
	tag: number
	elementOffset: number
	elementSize: number
}

export declare class CM4Header {
	constructor(init?: CM4Header)
	size: number
	CMMType: number
	profileVersion: number
	profileClass: number
	dataColorSpace: number
	profileConnectionSpace: number
	dateTime: CMDateTime
	CS2profileSignature: number
	platform: number
	flags: number
	deviceManufacturer: number
	deviceModel: number
	deviceAttributes: unknown /* const array */
	renderingIntent: number
	white: CMFixedXYZColor
	creator: number
	digest: unknown /* const array */
	reserved: unknown /* const array */
}

export declare class CM2Header {
	constructor(init?: CM2Header)
	size: number
	CMMType: number
	profileVersion: number
	profileClass: number
	dataColorSpace: number
	profileConnectionSpace: number
	dateTime: CMDateTime
	CS2profileSignature: number
	platform: number
	flags: number
	deviceManufacturer: number
	deviceModel: number
	deviceAttributes: unknown /* const array */
	renderingIntent: number
	white: CMFixedXYZColor
	creator: number
	reserved: unknown /* const array */
}

export declare class CMCMYColor {
	constructor(init?: CMCMYColor)
	cyan: number
	magenta: number
	yellow: number
}

export declare class CMXYZColor {
	constructor(init?: CMXYZColor)
	X: number
	Y: number
	Z: number
}

export declare class CMVideoCardGammaType {
	constructor(init?: CMVideoCardGammaType)
	typeDescriptor: number
	reserved: number
	gamma: CMVideoCardGamma
}

export declare class CMDeviceProfileArray {
	constructor(init?: CMDeviceProfileArray)
	profileCount: number
	profiles: unknown /* const array */
}

export declare class CMMakeAndModel {
	constructor(init?: CMMakeAndModel)
	manufacturer: number
	model: number
	serialNumber: number
	manufactureDate: number
	reserved1: number
	reserved2: number
	reserved3: number
	reserved4: number
}

export declare class ATSFontQuerySourceContext {
	constructor(init?: ATSFontQuerySourceContext)
	version: number
	refCon: interop.Pointer
	retain: (p1: interop.PointerConvertible) => interop.Pointer | null
	release: (p1: interop.PointerConvertible) => void | null
}

export declare class ATSFontFilter {
	constructor(init?: ATSFontFilter)
	version: number
	filterSelector: interop.Enum<typeof ATSFontFilterSelector>
	filter: unnamed_15486290801389724502
}

export declare class OpaqueTranslationRef {
	constructor(init?: OpaqueTranslationRef)
}

export declare class ATSFontIterator_ {
	constructor(init?: ATSFontIterator_)
}

export declare class ATSFontFamilyIterator_ {
	constructor(init?: ATSFontFamilyIterator_)
}

export declare class ATSGlyphVector {
	constructor(init?: ATSGlyphVector)
}

export declare class ATSTrapezoid {
	constructor(init?: ATSTrapezoid)
	upperLeft: FixedPoint
	upperRight: FixedPoint
	lowerRight: FixedPoint
	lowerLeft: FixedPoint
}

export declare class ATSLayoutRecord {
	constructor(init?: ATSLayoutRecord)
	glyphID: number
	flags: number
	originalOffset: number
	realPos: number
}

export declare class ATSGlyphScreenMetrics {
	constructor(init?: ATSGlyphScreenMetrics)
	deviceAdvance: CGPoint
	topLeft: CGPoint
	height: number
	width: number
	sideBearing: CGPoint
	otherSideBearing: CGPoint
}

export declare class PMLanguageInfo {
	constructor(init?: PMLanguageInfo)
	level: unknown /* const array */
	version: unknown /* const array */
	release: unknown /* const array */
}

export declare class ATSUCurvePath {
	constructor(init?: ATSUCurvePath)
	vectors: number
	controlBits: unknown /* const array */
	vector: unknown /* const array */
}

export declare class ATSFontMetrics {
	constructor(init?: ATSFontMetrics)
	version: number
	ascent: number
	descent: number
	leading: number
	avgAdvanceWidth: number
	maxAdvanceWidth: number
	minLeftSideBearing: number
	minRightSideBearing: number
	stemWidth: number
	stemHeight: number
	capHeight: number
	xHeight: number
	italicAngle: number
	underlinePosition: number
	underlineThickness: number
}

export declare class FMFilter {
	constructor(init?: FMFilter)
	format: number
	selector: number
	filter: unnamed_10139400973548267267
}

export declare class FMFontFamilyInstanceIterator {
	constructor(init?: FMFontFamilyInstanceIterator)
	reserved: unknown /* const array */
}

export declare class FMFontFamilyIterator {
	constructor(init?: FMFontFamilyIterator)
	reserved: unknown /* const array */
}

export declare class ATSFSSpec {
	constructor(init?: ATSFSSpec)
	vRefNum: number
	parID: number
	name: unknown /* const array */
}

export declare class ATSURGBAlphaColor {
	constructor(init?: ATSURGBAlphaColor)
	red: number
	green: number
	blue: number
	alpha: number
}

export declare class AppParameters {
	constructor(init?: AppParameters)
	theMsgEvent: unnamed_9992588540590216126
	eventRefCon: number
	messageLength: number
}

export declare class ColorSpec {
	constructor(init?: ColorSpec)
	value: number
	rgb: RGBColor
}

export declare class CMParametricCurveType {
	constructor(init?: CMParametricCurveType)
	typeDescriptor: number
	reserved: number
	functionType: number
	reserved2: number
	value: unknown /* const array */
}

export declare class CMRGBColor {
	constructor(init?: CMRGBColor)
	red: number
	green: number
	blue: number
}

export declare class PhonemeDescriptor {
	constructor(init?: PhonemeDescriptor)
	phonemeCount: number
	thePhonemes: unknown /* const array */
}

export declare class OpenCPicParams {
	constructor(init?: OpenCPicParams)
	srcRect: Rect
	hRes: number
	vRes: number
	version: number
	reserved1: number
	reserved2: number
}

export declare class CMFixedXYColor {
	constructor(init?: CMFixedXYColor)
	x: number
	y: number
}

export declare class ICFontRecord {
	constructor(init?: ICFontRecord)
	size: number
	face: number
	pad: number
	font: unknown /* const array */
}

export declare class CMScreeningType {
	constructor(init?: CMScreeningType)
	typeDescriptor: number
	reserved: number
	screeningFlag: number
	channelCount: number
	channelInfo: unknown /* const array */
}

export declare class OpaqueGrafPtr {
	constructor(init?: OpaqueGrafPtr)
}

export declare class ATSFlatDataFontSpecRawNameData {
	constructor(init?: ATSFlatDataFontSpecRawNameData)
	fontNameType: number
	fontNamePlatform: number
	fontNameScript: number
	fontNameLanguage: number
	fontNameLength: number
}

export declare class unnamed_9992588540590216126 {
	constructor(init?: unnamed_9992588540590216126)
	what: number
	message: number
	when: number
	where: Point
	modifiers: number
}

export declare class VDGammaRecord {
	constructor(init?: VDGammaRecord)
	csGTable: string | null
}

export declare class PhonemeInfo {
	constructor(init?: PhonemeInfo)
	opcode: number
	phStr: unknown /* const array */
	exampleStr: unknown /* const array */
	hiliteStart: number
	hiliteEnd: number
}

export declare class OpaquePMServer {
	constructor(init?: OpaquePMServer)
}

export declare class CMBitmap {
	constructor(init?: CMBitmap)
	image: string | null
	width: number
	height: number
	rowBytes: number
	pixelSize: number
	space: number
	user1: number
	user2: number
}

export declare class CQDProcs {
	constructor(init?: CQDProcs)
	textProc: (p1: number, p2: interop.PointerConvertible, p3: Point, p4: Point) => void | null
	lineProc: (p1: Point) => void | null
	rectProc: (p1: number, p2: interop.PointerConvertible) => void | null
	rRectProc: (p1: number, p2: interop.PointerConvertible, p3: number, p4: number) => void | null
	ovalProc: (p1: number, p2: interop.PointerConvertible) => void | null
	arcProc: (p1: number, p2: interop.PointerConvertible, p3: number, p4: number) => void | null
	polyProc: (p1: number, p2: interop.PointerConvertible) => void | null
	rgnProc: (p1: number, p2: interop.PointerConvertible) => void | null
	bitsProc: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
	) => void | null
	commentProc: (p1: number, p2: number, p3: interop.PointerConvertible) => void | null
	txMeasProc: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	getPicProc: (p1: interop.PointerConvertible, p2: number) => void | null
	putPicProc: (p1: interop.PointerConvertible, p2: number) => void | null
	opcodeProc: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void | null
	newProc1: () => number | null
	glyphsProc: (p1: interop.PointerConvertible, p2: number) => number | null
	printerStatusProc: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	newProc4: () => number | null
	newProc5: () => number | null
	newProc6: () => number | null
}

export declare class OpaqueATSUFontFallbacks {
	constructor(init?: OpaqueATSUFontFallbacks)
}

export declare class ATSFlatDataStyleListHeader {
	constructor(init?: ATSFlatDataStyleListHeader)
	numberOfStyles: number
	styleDataArray: unknown /* const array */
}

export declare class ATSUAttributeInfo {
	constructor(init?: ATSUAttributeInfo)
	fTag: number
	fValueSize: number
}

export declare class CMDateTime {
	constructor(init?: CMDateTime)
	year: number
	month: number
	dayOfTheMonth: number
	hours: number
	minutes: number
	seconds: number
}

export declare class ATSFlatDataTextLayoutHeader {
	constructor(init?: ATSFlatDataTextLayoutHeader)
	numFlattenedTextLayouts: number
	flattenedTextLayouts: unknown /* const array */
}

export declare class ICCharTable {
	constructor(init?: ICCharTable)
	netToMac: unknown /* const array */
	macToNet: unknown /* const array */
}

export declare class ATSUGlyphSelector {
	constructor(init?: ATSUGlyphSelector)
	collection: number
	glyphID: number
}

export declare class CMLabColor {
	constructor(init?: CMLabColor)
	L: number
	a: number
	b: number
}

export declare class ATSUTab {
	constructor(init?: ATSUTab)
	tabPosition: number
	tabType: number
}

export declare class CMDataType {
	constructor(init?: CMDataType)
	typeDescriptor: number
	reserved: number
	dataFlag: number
	data: unknown /* const array */
}

export declare class CMHSVColor {
	constructor(init?: CMHSVColor)
	hue: number
	saturation: number
	value: number
}

export declare class StyleTable {
	constructor(init?: StyleTable)
	fontClass: number
	offset: number
	reserved: number
	indexes: unknown /* const array */
}

export declare class CMDeviceScope {
	constructor(init?: CMDeviceScope)
	deviceUser: interop.Object | null
	deviceHost: interop.Object | null
}

export declare class CMTextDescriptionType {
	constructor(init?: CMTextDescriptionType)
	typeDescriptor: number
	reserved: number
	ASCIICount: number
	ASCIIName: unknown /* const array */
}

export declare class CMCurveType {
	constructor(init?: CMCurveType)
	typeDescriptor: number
	reserved: number
	countValue: number
	data: unknown /* const array */
}

export declare class CMDateTimeType {
	constructor(init?: CMDateTimeType)
	typeDescriptor: number
	reserved: number
	dateTime: CMDateTime
}

export declare class OpaqueCMProfileRef {
	constructor(init?: OpaqueCMProfileRef)
}

export declare class ProcessInfoExtendedRec {
	constructor(init?: ProcessInfoExtendedRec)
	processInfoLength: number
	processName: interop.Pointer
	processNumber: ProcessSerialNumber
	processType: number
	processSignature: number
	processMode: number
	processLocation: string | null
	processSize: number
	processFreeMem: number
	processLauncher: ProcessSerialNumber
	processLaunchDate: number
	processActiveTime: number
	processAppRef: interop.Pointer
	processTempMemTotal: number
	processPurgeableTempMemTotal: number
}

export declare class CMViewingConditionsType {
	constructor(init?: CMViewingConditionsType)
	typeDescriptor: number
	reserved: number
	illuminant: CMFixedXYZColor
	surround: CMFixedXYZColor
	stdIlluminant: number
}

export declare class __AXUIElement {
	constructor(init?: __AXUIElement)
}

export declare class GrafPort {
	constructor(init?: GrafPort)
	whatever: unknown /* const array */
}

export declare class __HIShape {
	constructor(init?: __HIShape)
}

export declare class CMFixedXYZColor {
	constructor(init?: CMFixedXYZColor)
	X: number
	Y: number
	Z: number
}

export declare class OpaqueRgnHandle {
	constructor(init?: OpaqueRgnHandle)
}

export declare class CMUInt64ArrayType {
	constructor(init?: CMUInt64ArrayType)
	typeDescriptor: number
	reserved: number
	value: unknown /* const array */
}

export declare class ATSUUnhighlightData {
	constructor(init?: ATSUUnhighlightData)
	dataType: number
	unhighlightData: ATSUBackgroundData
}

export declare class NCMConcatProfileSet {
	constructor(init?: NCMConcatProfileSet)
	cmm: number
	flags: number
	flagsMask: number
	profileCount: number
	profileSpecs: unknown /* const array */
}

export declare class FMFontIterator {
	constructor(init?: FMFontIterator)
	reserved: unknown /* const array */
}

export declare class ICAppSpecList {
	constructor(init?: ICAppSpecList)
	numberOfItems: number
	appSpecs: unknown /* const array */
}

export declare class CMLuvColor {
	constructor(init?: CMLuvColor)
	L: number
	u: number
	v: number
}

export declare class Pattern {
	constructor(init?: Pattern)
	pat: unknown /* const array */
}

export declare class ATSJustWidthDeltaEntryOverride {
	constructor(init?: ATSJustWidthDeltaEntryOverride)
	beforeGrowLimit: number
	beforeShrinkLimit: number
	afterGrowLimit: number
	afterShrinkLimit: number
	growFlags: number
	shrinkFlags: number
}

export declare class SpeechXtndData {
	constructor(init?: SpeechXtndData)
	synthCreator: number
	synthData: unknown /* const array */
}

export declare class CMScreeningChannelRec {
	constructor(init?: CMScreeningChannelRec)
	frequency: number
	angle: number
	spotFunction: number
}

export declare class PixMap {
	constructor(init?: PixMap)
	baseAddr: string | null
	rowBytes: number
	bounds: Rect
	pmVersion: number
	packType: number
	packSize: number
	hRes: number
	vRes: number
	pixelType: number
	pixelSize: number
	cmpCount: number
	cmpSize: number
	pixelFormat: number
	pmTable: interop.Pointer
	pmExt: interop.Pointer
}

export declare class CM2Profile {
	constructor(init?: CM2Profile)
	header: CM2Header
	tagTable: CMTagElemTable
	elemData: unknown /* const array */
}

export declare class CMUInt16ArrayType {
	constructor(init?: CMUInt16ArrayType)
	typeDescriptor: number
	reserved: number
	value: unknown /* const array */
}

export declare class CMProfileSequenceDescType {
	constructor(init?: CMProfileSequenceDescType)
	typeDescriptor: number
	reserved: number
	count: number
	data: unknown /* const array */
}

export declare class OpaqueDialogPtr {
	constructor(init?: OpaqueDialogPtr)
}

export declare class CMU16Fixed16ArrayType {
	constructor(init?: CMU16Fixed16ArrayType)
	typeDescriptor: number
	reserved: number
	value: unknown /* const array */
}

export declare class FMFontDirectoryFilter {
	constructor(init?: FMFontDirectoryFilter)
	fontFolderDomain: number
	reserved: unknown /* const array */
}

export declare class OpaqueCMWorldRef {
	constructor(init?: OpaqueCMWorldRef)
}

export declare class CMHLSColor {
	constructor(init?: CMHLSColor)
	hue: number
	lightness: number
	saturation: number
}

export declare class CMMultiFunctLutType {
	constructor(init?: CMMultiFunctLutType)
	typeDescriptor: number
	reserved: number
	inputChannels: number
	outputChannels: number
	reserved2: number
	offsetBcurves: number
	offsetMatrix: number
	offsetMcurves: number
	offsetCLUT: number
	offsetAcurves: number
	data: unknown /* const array */
}

export declare class CMPathLocation {
	constructor(init?: CMPathLocation)
	path: unknown /* const array */
}

export declare class CMBufferLocation {
	constructor(init?: CMBufferLocation)
	buffer: interop.Pointer
	size: number
}

export declare class ATSULayoutOperationOverrideSpecifier {
	constructor(init?: ATSULayoutOperationOverrideSpecifier)
	operationSelector: number
	overrideUPP: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
}

export declare class ATSFontNotificationRef_ {
	constructor(init?: ATSFontNotificationRef_)
}

export declare class ATSUCurvePaths {
	constructor(init?: ATSUCurvePaths)
	contours: number
	contour: unknown /* const array */
}

export type unnamed_10139400973548267267Descriptor =
	| { fontTechnologyFilter: number }
	| { fontContainerFilter: ATSFSSpec }
	| { generationFilter: number }
	| { fontFamilyCallbackFilter: (p1: number, p2: interop.PointerConvertible) => number | null }
	| { fontCallbackFilter: (p1: number, p2: interop.PointerConvertible) => number | null }
	| { fontDirectoryFilter: FMFontDirectoryFilter }
	| { fontFileRefFilter: interop.PointerConvertible }

export declare class unnamed_10139400973548267267 {
	constructor(init?: unnamed_10139400973548267267Descriptor)
	fontTechnologyFilter: number
	fontContainerFilter: ATSFSSpec
	generationFilter: number
	fontFamilyCallbackFilter: (p1: number, p2: interop.PointerConvertible) => number | null
	fontCallbackFilter: (p1: number, p2: interop.PointerConvertible) => number | null
	fontDirectoryFilter: FMFontDirectoryFilter
	fontFileRefFilter: interop.Pointer
}

export type unnamed_15486290801389724502Descriptor =
	| { generationFilter: number }
	| { fontFamilyFilter: number }
	| {
			fontFamilyApplierFunctionFilter: (p1: number, p2: interop.PointerConvertible) => number | null
	  }
	| { fontApplierFunctionFilter: (p1: number, p2: interop.PointerConvertible) => number | null }
	| { fontFileRefFilter: interop.PointerConvertible }

export declare class unnamed_15486290801389724502 {
	constructor(init?: unnamed_15486290801389724502Descriptor)
	generationFilter: number
	fontFamilyFilter: number
	fontFamilyApplierFunctionFilter: (p1: number, p2: interop.PointerConvertible) => number | null
	fontApplierFunctionFilter: (p1: number, p2: interop.PointerConvertible) => number | null
	fontFileRefFilter: interop.Pointer
}

export type ATSUBackgroundDataDescriptor =
	| { backgroundColor: ATSURGBAlphaColor }
	| {
			backgroundUPP: (
				p1: interop.PointerConvertible,
				p2: number,
				p3: number,
				p4: interop.PointerConvertible,
				p5: number,
			) => number | null
	  }

export declare class ATSUBackgroundData {
	constructor(init?: ATSUBackgroundDataDescriptor)
	backgroundColor: ATSURGBAlphaColor
	backgroundUPP: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
	) => number | null
}

export type CMProfLocDescriptor =
	| { handleLoc: CMHandleLocation }
	| { pathLoc: CMPathLocation }
	| { bufferLoc: CMBufferLocation }

export declare class CMProfLoc {
	constructor(init?: CMProfLocDescriptor)
	handleLoc: CMHandleLocation
	pathLoc: CMPathLocation
	bufferLoc: CMBufferLocation
}

export type CMColorDescriptor =
	| { rgb: CMRGBColor }
	| { hsv: CMHSVColor }
	| { hls: CMHLSColor }
	| { XYZ: CMXYZColor }
	| { Lab: CMLabColor }
	| { Luv: CMLuvColor }
	| { Yxy: CMYxyColor }
	| { cmyk: CMCMYKColor }
	| { cmy: CMCMYColor }
	| { gray: CMGrayColor }
	| { mc5: CMMultichannel5Color }
	| { mc6: CMMultichannel6Color }
	| { mc7: CMMultichannel7Color }
	| { mc8: CMMultichannel8Color }
	| { namedColor: CMNamedColor }

export declare class CMColor {
	constructor(init?: CMColorDescriptor)
	rgb: CMRGBColor
	hsv: CMHSVColor
	hls: CMHLSColor
	XYZ: CMXYZColor
	Lab: CMLabColor
	Luv: CMLuvColor
	Yxy: CMYxyColor
	cmyk: CMCMYKColor
	cmy: CMCMYColor
	gray: CMGrayColor
	mc5: CMMultichannel5Color
	mc6: CMMultichannel6Color
	mc7: CMMultichannel7Color
	mc8: CMMultichannel8Color
	namedColor: CMNamedColor
}

export type unnamed_4672107459432106759Descriptor =
	| { table: CMVideoCardGammaTable }
	| { formula: CMVideoCardGammaFormula }

export declare class unnamed_4672107459432106759 {
	constructor(init?: unnamed_4672107459432106759Descriptor)
	table: CMVideoCardGammaTable
	formula: CMVideoCardGammaFormula
}

export type CMAppleProfileHeaderDescriptor = { cm2: CM2Header } | { cm4: CM4Header }

export declare class CMAppleProfileHeader {
	constructor(init?: CMAppleProfileHeaderDescriptor)
	cm2: CM2Header
	cm4: CM4Header
}

export declare function ATSGetGeneration(): number

export declare function ATSFontActivateFromFileReference(
	iFile: interop.PointerConvertible,
	iContext: number,
	iFormat: number,
	iRefCon: interop.PointerConvertible,
	iOptions: number,
	oContainer: interop.PointerConvertible,
): number

export declare function ATSFontActivateFromMemory(
	iData: interop.PointerConvertible,
	iLength: number,
	iContext: number,
	iFormat: number,
	iReserved: interop.PointerConvertible,
	iOptions: number,
	oContainer: interop.PointerConvertible,
): number

export declare function ATSFontDeactivate(
	iContainer: number,
	iRefCon: interop.PointerConvertible,
	iOptions: number,
): number

export declare function ATSFontGetContainerFromFileReference(
	iFile: interop.PointerConvertible,
	iContext: number,
	iOptions: number,
	oContainer: interop.PointerConvertible,
): number

export declare function ATSFontGetContainer(
	iFont: number,
	iOptions: number,
	oContainer: interop.PointerConvertible,
): number

export declare function ATSFontSetEnabled(iFont: number, iOptions: number, iEnabled: number): number

export declare function ATSFontIsEnabled(iFont: number): number

export declare function ATSFontFamilyApplyFunction(
	iFunction: (p1: number, p2: interop.PointerConvertible) => number,
	iRefCon: interop.PointerConvertible,
): number

export declare function ATSFontFamilyIteratorCreate(
	iContext: number,
	iFilter: interop.PointerConvertible,
	iRefCon: interop.PointerConvertible,
	iOptions: number,
	ioIterator: interop.PointerConvertible,
): number

export declare function ATSFontFamilyIteratorRelease(ioIterator: interop.PointerConvertible): number

export declare function ATSFontFamilyIteratorReset(
	iContext: number,
	iFilter: interop.PointerConvertible,
	iRefCon: interop.PointerConvertible,
	iOptions: number,
	ioIterator: interop.PointerConvertible,
): number

export declare function ATSFontFamilyIteratorNext(
	iIterator: interop.PointerConvertible,
	oFamily: interop.PointerConvertible,
): number

export declare function ATSFontFamilyFindFromName(iName: interop.Object, iOptions: number): number

export declare function ATSFontFamilyGetGeneration(iFamily: number): number

export declare function ATSFontFamilyGetName(
	iFamily: number,
	iOptions: number,
	oName: interop.PointerConvertible,
): number

export declare function ATSFontFamilyGetEncoding(iFamily: number): number

export declare function ATSFontApplyFunction(
	iFunction: (p1: number, p2: interop.PointerConvertible) => number,
	iRefCon: interop.PointerConvertible,
): number

export declare function ATSFontIteratorCreate(
	iContext: number,
	iFilter: interop.PointerConvertible,
	iRefCon: interop.PointerConvertible,
	iOptions: number,
	ioIterator: interop.PointerConvertible,
): number

export declare function ATSFontIteratorRelease(ioIterator: interop.PointerConvertible): number

export declare function ATSFontIteratorReset(
	iContext: number,
	iFilter: interop.PointerConvertible,
	iRefCon: interop.PointerConvertible,
	iOptions: number,
	ioIterator: interop.PointerConvertible,
): number

export declare function ATSFontIteratorNext(
	iIterator: interop.PointerConvertible,
	oFont: interop.PointerConvertible,
): number

export declare function ATSFontFindFromName(iName: interop.Object, iOptions: number): number

export declare function ATSFontFindFromPostScriptName(
	iName: interop.Object,
	iOptions: number,
): number

export declare function ATSFontFindFromContainer(
	iContainer: number,
	iOptions: number,
	iCount: number,
	ioArray: interop.Pointer,
	oCount: interop.PointerConvertible,
): number

export declare function ATSFontGetGeneration(iFont: number): number

export declare function ATSFontGetName(
	iFont: number,
	iOptions: number,
	oName: interop.PointerConvertible,
): number

export declare function ATSFontGetPostScriptName(
	iFont: number,
	iOptions: number,
	oName: interop.PointerConvertible,
): number

export declare function ATSFontGetTableDirectory(
	iFont: number,
	iBufferSize: number,
	ioBuffer: interop.PointerConvertible,
	oSize: interop.PointerConvertible,
): number

export declare function ATSFontGetTable(
	iFont: number,
	iTag: number,
	iOffset: number,
	iBufferSize: number,
	ioBuffer: interop.PointerConvertible,
	oSize: interop.PointerConvertible,
): number

export declare function ATSFontGetHorizontalMetrics(
	iFont: number,
	iOptions: number,
	oMetrics: interop.PointerConvertible,
): number

export declare function ATSFontGetVerticalMetrics(
	iFont: number,
	iOptions: number,
	oMetrics: interop.PointerConvertible,
): number

export declare function ATSFontFamilyFindFromQuickDrawName(
	iName: interop.PointerConvertible,
): number

export declare function ATSFontFamilyGetQuickDrawName(
	iFamily: number,
	oName: unknown /* const array */,
): number

export declare function ATSFontGetFileReference(
	iFont: number,
	oFile: interop.PointerConvertible,
): number

export declare function ATSFontGetFontFamilyResource(
	iFont: number,
	iBufferSize: number,
	ioBuffer: interop.PointerConvertible,
	oSize: interop.PointerConvertible,
): number

export declare function ATSFontNotify(
	action: interop.Enum<typeof ATSFontNotifyAction>,
	info: interop.PointerConvertible,
): number

export declare function ATSFontNotificationSubscribe(
	callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	options: interop.Enum<typeof ATSFontNotifyOption>,
	iRefcon: interop.PointerConvertible,
	oNotificationRef: interop.PointerConvertible,
): number

export declare function ATSFontNotificationUnsubscribe(
	notificationRef: interop.PointerConvertible,
): number

export declare function ATSCreateFontQueryRunLoopSource(
	queryOrder: number,
	sourceOrder: number,
	callout: (
		p1: interop.Enum<typeof ATSFontQueryMessageID>,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Pointer,
	context: interop.PointerConvertible,
): interop.Object

export declare function ATSFontSetGlobalAutoActivationSetting(iSetting: number): number

export declare function ATSFontGetGlobalAutoActivationSetting(): number

export declare function ATSFontSetAutoActivationSettingForApplication(
	iSetting: number,
	iApplicationFileURL: interop.Object,
): number

export declare function ATSFontGetAutoActivationSettingForApplication(
	iApplicationFileURL: interop.Object,
): number

export declare function HIShapeGetTypeID(): number

export declare function HIShapeCreateEmpty(): interop.Object

export declare function HIShapeCreateWithQDRgn(inRgn: interop.PointerConvertible): interop.Object

export declare function HIShapeCreateWithRect(inRect: interop.PointerConvertible): interop.Object

export declare function HIShapeCreateCopy(inShape: interop.Object): interop.Object

export declare function HIShapeCreateIntersection(
	inShape1: interop.Object,
	inShape2: interop.Object,
): interop.Object

export declare function HIShapeCreateDifference(
	inShape1: interop.Object,
	inShape2: interop.Object,
): interop.Object

export declare function HIShapeCreateUnion(
	inShape1: interop.Object,
	inShape2: interop.Object,
): interop.Object

export declare function HIShapeCreateXor(
	inShape1: interop.Object,
	inShape2: interop.Object,
): interop.Object

export declare function HIShapeIsEmpty(inShape: interop.Object): number

export declare function HIShapeIsRectangular(inShape: interop.Object): number

export declare function HIShapeContainsPoint(
	inShape: interop.Object,
	inPoint: interop.PointerConvertible,
): number

export declare function HIShapeIntersectsRect(
	inShape: interop.Object,
	inRect: interop.PointerConvertible,
): number

export declare function HIShapeGetBounds(
	inShape: interop.Object,
	outRect: interop.PointerConvertible,
): interop.Pointer

export declare function HIShapeGetAsQDRgn(
	inShape: interop.Object,
	outRgn: interop.PointerConvertible,
): number

export declare function HIShapeReplacePathInCGContext(
	inShape: interop.Object,
	inContext: interop.Object,
): number

export declare function HIShapeEnumerate(
	inShape: interop.Object,
	inOptions: number,
	inProc: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number,
	inRefcon: interop.PointerConvertible,
): number

export declare function HIShapeCreateMutable(): interop.Object

export declare function HIShapeCreateMutableCopy(inOrig: interop.Object): interop.Object

export declare function HIShapeCreateMutableWithRect(
	inRect: interop.PointerConvertible,
): interop.Object

export declare function HIShapeSetEmpty(inShape: interop.Object): number

export declare function HIShapeSetWithShape(
	inDestShape: interop.Object,
	inSrcShape: interop.Object,
): number

export declare function HIShapeIntersect(
	inShape1: interop.Object,
	inShape2: interop.Object,
	outResult: interop.Object,
): number

export declare function HIShapeDifference(
	inShape1: interop.Object,
	inShape2: interop.Object,
	outResult: interop.Object,
): number

export declare function HIShapeUnion(
	inShape1: interop.Object,
	inShape2: interop.Object,
	outResult: interop.Object,
): number

export declare function HIShapeXor(
	inShape1: interop.Object,
	inShape2: interop.Object,
	outResult: interop.Object,
): number

export declare function HIShapeOffset(inShape: interop.Object, inDX: number, inDY: number): number

export declare function HIShapeInset(inShape: interop.Object, inDX: number, inDY: number): number

export declare function HIShapeUnionWithRect(
	inShape: interop.Object,
	inRect: interop.PointerConvertible,
): number

export declare function NewIconActionUPP(
	userRoutine: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number,
): (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number

export declare function NewIconGetterUPP(
	userRoutine: (p1: number, p2: interop.PointerConvertible) => interop.Pointer,
): (p1: number, p2: interop.PointerConvertible) => interop.Pointer

export declare function DisposeIconActionUPP(
	userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number,
): void

export declare function DisposeIconGetterUPP(
	userUPP: (p1: number, p2: interop.PointerConvertible) => interop.Pointer,
): void

export declare function InvokeIconActionUPP(
	theType: number,
	theIcon: interop.PointerConvertible,
	yourDataPtr: interop.PointerConvertible,
	userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number,
): number

export declare function InvokeIconGetterUPP(
	theType: number,
	yourDataPtr: interop.PointerConvertible,
	userUPP: (p1: number, p2: interop.PointerConvertible) => interop.Pointer,
): interop.Pointer

export declare function IconRefToIconFamily(
	theIconRef: interop.PointerConvertible,
	whichIcons: number,
	iconFamily: interop.PointerConvertible,
): number

export declare function SetIconFamilyData(
	iconFamily: interop.PointerConvertible,
	iconType: number,
	h: interop.PointerConvertible,
): number

export declare function GetIconFamilyData(
	iconFamily: interop.PointerConvertible,
	iconType: number,
	h: interop.PointerConvertible,
): number

export declare function PlotIconRefInContext(
	inContext: interop.Object,
	inRect: interop.PointerConvertible,
	inAlign: number,
	inTransform: number,
	inLabelColor: interop.PointerConvertible,
	inFlags: number,
	inIconRef: interop.PointerConvertible,
): number

export declare function IconRefContainsCGPoint(
	testPt: interop.PointerConvertible,
	iconRect: interop.PointerConvertible,
	align: number,
	iconServicesUsageFlags: number,
	theIconRef: interop.PointerConvertible,
): number

export declare function IconRefIntersectsCGRect(
	testRect: interop.PointerConvertible,
	iconRect: interop.PointerConvertible,
	align: number,
	iconServicesUsageFlags: number,
	theIconRef: interop.PointerConvertible,
): number

export declare function IconRefToHIShape(
	iconRect: interop.PointerConvertible,
	align: number,
	iconServicesUsageFlags: number,
	theIconRef: interop.PointerConvertible,
): interop.Object

export declare function IsIconRefMaskEmpty(iconRef: interop.PointerConvertible): number

export declare function GetIconRefVariant(
	inIconRef: interop.PointerConvertible,
	inVariant: number,
	outTransform: interop.PointerConvertible,
): interop.Pointer

export declare function ICStart(inst: interop.PointerConvertible, signature: number): number

export declare function ICStop(inst: interop.PointerConvertible): number

export declare function ICGetVersion(
	inst: interop.PointerConvertible,
	whichVersion: number,
	version: interop.PointerConvertible,
): number

export declare function ICGetConfigName(
	inst: interop.PointerConvertible,
	longname: number,
	name: unknown /* const array */,
): number

export declare function ICGetSeed(
	inst: interop.PointerConvertible,
	seed: interop.PointerConvertible,
): number

export declare function ICGetPerm(
	inst: interop.PointerConvertible,
	perm: interop.PointerConvertible,
): number

export declare function ICBegin(inst: interop.PointerConvertible, perm: number): number

export declare function ICGetPref(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
	attr: interop.PointerConvertible,
	buf: interop.PointerConvertible,
	size: interop.PointerConvertible,
): number

export declare function ICSetPref(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
	attr: number,
	buf: interop.PointerConvertible,
	size: number,
): number

export declare function ICFindPrefHandle(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
	attr: interop.PointerConvertible,
	prefh: interop.PointerConvertible,
): number

export declare function ICGetPrefHandle(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
	attr: interop.PointerConvertible,
	prefh: interop.PointerConvertible,
): number

export declare function ICSetPrefHandle(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
	attr: number,
	prefh: interop.PointerConvertible,
): number

export declare function ICCountPref(
	inst: interop.PointerConvertible,
	count: interop.PointerConvertible,
): number

export declare function ICGetIndPref(
	inst: interop.PointerConvertible,
	index: number,
	key: unknown /* const array */,
): number

export declare function ICDeletePref(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
): number

export declare function ICEnd(inst: interop.PointerConvertible): number

export declare function ICGetDefaultPref(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
	prefH: interop.PointerConvertible,
): number

export declare function ICEditPreferences(
	inst: interop.PointerConvertible,
	key: interop.PointerConvertible,
): number

export declare function ICLaunchURL(
	inst: interop.PointerConvertible,
	hint: interop.PointerConvertible,
	data: interop.PointerConvertible,
	len: number,
	selStart: interop.PointerConvertible,
	selEnd: interop.PointerConvertible,
): number

export declare function ICParseURL(
	inst: interop.PointerConvertible,
	hint: interop.PointerConvertible,
	data: interop.PointerConvertible,
	len: number,
	selStart: interop.PointerConvertible,
	selEnd: interop.PointerConvertible,
	url: interop.PointerConvertible,
): number

export declare function ICCreateGURLEvent(
	inst: interop.PointerConvertible,
	helperCreator: number,
	urlH: interop.PointerConvertible,
	theEvent: interop.PointerConvertible,
): number

export declare function ICSendGURLEvent(
	inst: interop.PointerConvertible,
	theEvent: interop.PointerConvertible,
): number

export declare function ICMapFilename(
	inst: interop.PointerConvertible,
	filename: interop.PointerConvertible,
	entry: interop.PointerConvertible,
): number

export declare function ICMapTypeCreator(
	inst: interop.PointerConvertible,
	fType: number,
	fCreator: number,
	filename: interop.PointerConvertible,
	entry: interop.PointerConvertible,
): number

export declare function ICMapEntriesFilename(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	filename: interop.PointerConvertible,
	entry: interop.PointerConvertible,
): number

export declare function ICMapEntriesTypeCreator(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	fType: number,
	fCreator: number,
	filename: interop.PointerConvertible,
	entry: interop.PointerConvertible,
): number

export declare function ICCountMapEntries(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	count: interop.PointerConvertible,
): number

export declare function ICGetIndMapEntry(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	index: number,
	pos: interop.PointerConvertible,
	entry: interop.PointerConvertible,
): number

export declare function ICGetMapEntry(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	pos: number,
	entry: interop.PointerConvertible,
): number

export declare function ICSetMapEntry(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	pos: number,
	entry: interop.PointerConvertible,
): number

export declare function ICDeleteMapEntry(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	pos: number,
): number

export declare function ICAddMapEntry(
	inst: interop.PointerConvertible,
	entries: interop.PointerConvertible,
	entry: interop.PointerConvertible,
): number

export declare function ICGetCurrentProfile(
	inst: interop.PointerConvertible,
	currentID: interop.PointerConvertible,
): number

export declare function ICSetCurrentProfile(inst: interop.PointerConvertible, newID: number): number

export declare function ICCountProfiles(
	inst: interop.PointerConvertible,
	count: interop.PointerConvertible,
): number

export declare function ICGetIndProfile(
	inst: interop.PointerConvertible,
	index: number,
	thisID: interop.PointerConvertible,
): number

export declare function ICGetProfileName(
	inst: interop.PointerConvertible,
	thisID: number,
	name: unknown /* const array */,
): number

export declare function ICSetProfileName(
	inst: interop.PointerConvertible,
	thisID: number,
	name: interop.PointerConvertible,
): number

export declare function ICAddProfile(
	inst: interop.PointerConvertible,
	prototypeID: number,
	newID: interop.PointerConvertible,
): number

export declare function ICDeleteProfile(inst: interop.PointerConvertible, thisID: number): number

export declare function LaunchApplication(LaunchParams: interop.PointerConvertible): number

export declare function GetCurrentProcess(pPSN: interop.PointerConvertible): number

export declare function GetFrontProcess(pPSN: interop.PointerConvertible): number

export declare function GetNextProcess(pPSN: interop.PointerConvertible): number

export declare function GetProcessInformation(
	PSN: interop.PointerConvertible,
	info: interop.PointerConvertible,
): number

export declare function ProcessInformationCopyDictionary(
	PSN: interop.PointerConvertible,
	infoToReturn: number,
): interop.Object

export declare function SetFrontProcess(pPSN: interop.PointerConvertible): number

export declare function SetFrontProcessWithOptions(
	inProcess: interop.PointerConvertible,
	inOptions: number,
): number

export declare function WakeUpProcess(PSN: interop.PointerConvertible): number

export declare function SameProcess(
	PSN1: interop.PointerConvertible,
	PSN2: interop.PointerConvertible,
	result: interop.PointerConvertible,
): number

export declare function ExitToShell(): void

export declare function KillProcess(inProcess: interop.PointerConvertible): number

export declare function GetProcessBundleLocation(
	psn: interop.PointerConvertible,
	location: interop.PointerConvertible,
): number

export declare function CopyProcessName(
	psn: interop.PointerConvertible,
	name: interop.PointerConvertible,
): number

export declare function GetProcessPID(
	psn: interop.PointerConvertible,
	pid: interop.PointerConvertible,
): number

export declare function GetProcessForPID(pid: number, psn: interop.PointerConvertible): number

export declare function IsProcessVisible(psn: interop.PointerConvertible): number

export declare function ShowHideProcess(psn: interop.PointerConvertible, visible: number): number

export declare function TransformProcessType(
	psn: interop.PointerConvertible,
	transformState: number,
): number

export declare function PasteboardGetTypeID(): number

export declare function PasteboardCreate(
	inName: interop.Object,
	outPasteboard: interop.PointerConvertible,
): number

export declare function PasteboardSynchronize(
	inPasteboard: interop.Object,
): interop.Enum<typeof PasteboardSyncFlags>

export declare function PasteboardClear(inPasteboard: interop.Object): number

export declare function PasteboardCopyName(
	inPasteboard: interop.Object,
	outName: interop.PointerConvertible,
): number

export declare function PasteboardGetItemCount(
	inPasteboard: interop.Object,
	outItemCount: interop.PointerConvertible,
): number

export declare function PasteboardGetItemIdentifier(
	inPasteboard: interop.Object,
	inIndex: number,
	outItem: interop.PointerConvertible,
): number

export declare function PasteboardCopyItemFlavors(
	inPasteboard: interop.Object,
	inItem: interop.PointerConvertible,
	outFlavorTypes: interop.PointerConvertible,
): number

export declare function PasteboardGetItemFlavorFlags(
	inPasteboard: interop.Object,
	inItem: interop.PointerConvertible,
	inFlavorType: interop.Object,
	outFlags: interop.PointerConvertible,
): number

export declare function PasteboardCopyItemFlavorData(
	inPasteboard: interop.Object,
	inItem: interop.PointerConvertible,
	inFlavorType: interop.Object,
	outData: interop.PointerConvertible,
): number

export declare function PasteboardPutItemFlavor(
	inPasteboard: interop.Object,
	inItem: interop.PointerConvertible,
	inFlavorType: interop.Object,
	inData: interop.Object,
	inFlags: interop.Enum<typeof PasteboardFlavorFlags>,
): number

export declare function PasteboardCopyPasteLocation(
	inPasteboard: interop.Object,
	outPasteLocation: interop.PointerConvertible,
): number

export declare function PasteboardSetPasteLocation(
	inPasteboard: interop.Object,
	inPasteLocation: interop.Object,
): number

export declare function PasteboardSetPromiseKeeper(
	inPasteboard: interop.Object,
	inPromiseKeeper: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number,
	inContext: interop.PointerConvertible,
): number

export declare function PasteboardResolvePromises(inPasteboard: interop.Object): number

export declare function TranslationGetTypeID(): number

export declare function TranslationCreate(
	inSourceType: interop.Object,
	inDestinationType: interop.Object,
	inTranslationFlags: number,
	outTranslation: interop.PointerConvertible,
): number

export declare function TranslationCreateWithSourceArray(
	inSourceTypes: interop.Object,
	inTranslationFlags: number,
	outDestinationTypes: interop.PointerConvertible,
	outTranslations: interop.PointerConvertible,
): number

export declare function TranslationPerformForData(
	inTranslation: interop.Object,
	inSourceData: interop.Object,
	outDestinationData: interop.PointerConvertible,
): number

export declare function TranslationPerformForFile(
	inTranslation: interop.Object,
	inSourceFile: interop.PointerConvertible,
	inDestinationDirectory: interop.PointerConvertible,
	inDestinationName: interop.Object,
	outTranslatedFile: interop.PointerConvertible,
): number

export declare function TranslationPerformForURL(
	inTranslation: interop.Object,
	inSourceURL: interop.Object,
	inDestinationURL: interop.Object,
	outTranslatedURL: interop.PointerConvertible,
): number

export declare function TranslationCopySourceType(
	inTranslation: interop.Object,
	outSourceType: interop.PointerConvertible,
): number

export declare function TranslationCopyDestinationType(
	inTranslation: interop.Object,
	outDestinationType: interop.PointerConvertible,
): number

export declare function TranslationGetTranslationFlags(
	inTranslation: interop.Object,
	outTranslationFlags: interop.PointerConvertible,
): number

export declare function AXAPIEnabled(): number

export declare function AXIsProcessTrustedWithOptions(options: interop.Object): number

export declare function AXIsProcessTrusted(): number

export declare function AXMakeProcessTrusted(
	executablePath: interop.Object,
): interop.Enum<typeof AXError>

export declare function AXUIElementGetTypeID(): number

export declare function AXUIElementCopyAttributeNames(
	element: interop.Object,
	names: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyAttributeValue(
	element: interop.Object,
	attribute: interop.Object,
	value: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementGetAttributeValueCount(
	element: interop.Object,
	attribute: interop.Object,
	count: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyAttributeValues(
	element: interop.Object,
	attribute: interop.Object,
	index: number,
	maxValues: number,
	values: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementIsAttributeSettable(
	element: interop.Object,
	attribute: interop.Object,
	settable: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementSetAttributeValue(
	element: interop.Object,
	attribute: interop.Object,
	value: interop.Object,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyMultipleAttributeValues(
	element: interop.Object,
	attributes: interop.Object,
	options: interop.Enum<typeof AXCopyMultipleAttributeOptions>,
	values: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyParameterizedAttributeNames(
	element: interop.Object,
	names: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyParameterizedAttributeValue(
	element: interop.Object,
	parameterizedAttribute: interop.Object,
	parameter: interop.Object,
	result: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyActionNames(
	element: interop.Object,
	names: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyActionDescription(
	element: interop.Object,
	action: interop.Object,
	description: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementPerformAction(
	element: interop.Object,
	action: interop.Object,
): interop.Enum<typeof AXError>

export declare function AXUIElementCopyElementAtPosition(
	application: interop.Object,
	x: number,
	y: number,
	element: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementCreateApplication(pid: number): interop.Object

export declare function AXUIElementCreateSystemWide(): interop.Object

export declare function AXUIElementGetPid(
	element: interop.Object,
	pid: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXUIElementSetMessagingTimeout(
	element: interop.Object,
	timeoutInSeconds: number,
): interop.Enum<typeof AXError>

export declare function AXUIElementPostKeyboardEvent(
	application: interop.Object,
	keyChar: number,
	virtualKey: number,
	keyDown: number,
): interop.Enum<typeof AXError>

export declare function AXTextMarkerGetTypeID(): number

export declare function AXTextMarkerCreate(
	allocator: interop.Object,
	bytes: interop.PointerConvertible,
	length: number,
): interop.Pointer

export declare function AXTextMarkerGetLength(marker: interop.PointerConvertible): number

export declare function AXTextMarkerGetBytePtr(marker: interop.PointerConvertible): interop.Pointer

export declare function AXTextMarkerRangeGetTypeID(): number

export declare function AXTextMarkerRangeCreate(
	allocator: interop.Object,
	startMarker: interop.PointerConvertible,
	endMarker: interop.PointerConvertible,
): interop.Pointer

export declare function AXTextMarkerRangeCreateWithBytes(
	allocator: interop.Object,
	startMarkerBytes: interop.PointerConvertible,
	startMarkerLength: number,
	endMarkerBytes: interop.PointerConvertible,
	endMarkerLength: number,
): interop.Pointer

export declare function AXTextMarkerRangeCopyStartMarker(
	textMarkerRange: interop.PointerConvertible,
): interop.Pointer

export declare function AXTextMarkerRangeCopyEndMarker(
	textMarkerRange: interop.PointerConvertible,
): interop.Pointer

export declare function AXObserverGetTypeID(): number

export declare function AXObserverCreate(
	application: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	outObserver: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXObserverCreateWithInfoCallback(
	application: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => void,
	outObserver: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXObserverAddNotification(
	observer: interop.Object,
	element: interop.Object,
	notification: interop.Object,
	refcon: interop.PointerConvertible,
): interop.Enum<typeof AXError>

export declare function AXObserverRemoveNotification(
	observer: interop.Object,
	element: interop.Object,
	notification: interop.Object,
): interop.Enum<typeof AXError>

export declare function AXObserverGetRunLoopSource(observer: interop.Object): interop.Object

export declare function AXValueGetTypeID(): number

export declare function AXValueCreate(
	theType: interop.Enum<typeof AXValueType>,
	valuePtr: interop.PointerConvertible,
): interop.Object

export declare function AXValueGetType(value: interop.Object): interop.Enum<typeof AXValueType>

export declare function AXValueGetValue(
	value: interop.Object,
	theType: interop.Enum<typeof AXValueType>,
	valuePtr: interop.PointerConvertible,
): number

export declare function UAZoomEnabled(): number

export declare function UAZoomChangeFocus(
	inRect: interop.PointerConvertible,
	inHighlightRect: interop.PointerConvertible,
	inType: number,
): number

export declare function PMRetain(object: interop.PointerConvertible): number

export declare function PMRelease(object: interop.PointerConvertible): number

export declare function PMCreateSession(printSession: interop.PointerConvertible): number

export declare function PMSessionError(printSession: interop.PointerConvertible): number

export declare function PMSessionSetError(
	printSession: interop.PointerConvertible,
	printError: number,
): number

export declare function PMSessionBeginCGDocumentNoDialog(
	printSession: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	pageFormat: interop.PointerConvertible,
): number

export declare function PMSessionEndDocumentNoDialog(
	printSession: interop.PointerConvertible,
): number

export declare function PMSessionBeginPageNoDialog(
	printSession: interop.PointerConvertible,
	pageFormat: interop.PointerConvertible,
	pageFrame: interop.PointerConvertible,
): number

export declare function PMSessionEndPageNoDialog(printSession: interop.PointerConvertible): number

export declare function PMSessionGetCGGraphicsContext(
	printSession: interop.PointerConvertible,
	context: interop.PointerConvertible,
): number

export declare function PMSessionGetDestinationType(
	printSession: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	destTypeP: interop.PointerConvertible,
): number

export declare function PMSessionCopyDestinationFormat(
	printSession: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	destFormatP: interop.PointerConvertible,
): number

export declare function PMSessionCopyDestinationLocation(
	printSession: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	destLocationP: interop.PointerConvertible,
): number

export declare function PMSessionSetDestination(
	printSession: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	destType: number,
	destFormat: interop.Object,
	destLocation: interop.Object,
): number

export declare function PMSessionCopyOutputFormatList(
	printSession: interop.PointerConvertible,
	destType: number,
	documentFormatP: interop.PointerConvertible,
): number

export declare function PMSessionCreatePageFormatList(
	printSession: interop.PointerConvertible,
	printer: interop.PointerConvertible,
	pageFormatList: interop.PointerConvertible,
): number

export declare function PMSessionCreatePrinterList(
	printSession: interop.PointerConvertible,
	printerList: interop.PointerConvertible,
	currentIndex: interop.PointerConvertible,
	currentPrinter: interop.PointerConvertible,
): number

export declare function PMSessionGetCurrentPrinter(
	printSession: interop.PointerConvertible,
	currentPrinter: interop.PointerConvertible,
): number

export declare function PMSessionSetCurrentPMPrinter(
	session: interop.PointerConvertible,
	printer: interop.PointerConvertible,
): number

export declare function PMSessionGetDataFromSession(
	printSession: interop.PointerConvertible,
	key: interop.Object,
	data: interop.PointerConvertible,
): number

export declare function PMSessionSetDataInSession(
	printSession: interop.PointerConvertible,
	key: interop.Object,
	data: interop.Object,
): number

export declare function PMCreatePageFormat(pageFormat: interop.PointerConvertible): number

export declare function PMSessionDefaultPageFormat(
	printSession: interop.PointerConvertible,
	pageFormat: interop.PointerConvertible,
): number

export declare function PMSessionValidatePageFormat(
	printSession: interop.PointerConvertible,
	pageFormat: interop.PointerConvertible,
	changed: interop.PointerConvertible,
): number

export declare function PMCopyPageFormat(
	formatSrc: interop.PointerConvertible,
	formatDest: interop.PointerConvertible,
): number

export declare function PMCreatePageFormatWithPMPaper(
	pageFormat: interop.PointerConvertible,
	paper: interop.PointerConvertible,
): number

export declare function PMPageFormatCreateDataRepresentation(
	pageFormat: interop.PointerConvertible,
	data: interop.PointerConvertible,
	format: interop.Enum<typeof PMDataFormat>,
): number

export declare function PMPageFormatCreateWithDataRepresentation(
	data: interop.Object,
	pageFormat: interop.PointerConvertible,
): number

export declare function PMGetAdjustedPageRect(
	pageFormat: interop.PointerConvertible,
	pageRect: interop.PointerConvertible,
): number

export declare function PMGetAdjustedPaperRect(
	pageFormat: interop.PointerConvertible,
	paperRect: interop.PointerConvertible,
): number

export declare function PMGetOrientation(
	pageFormat: interop.PointerConvertible,
	orientation: interop.PointerConvertible,
): number

export declare function PMGetPageFormatExtendedData(
	pageFormat: interop.PointerConvertible,
	dataID: number,
	size: interop.PointerConvertible,
	extendedData: interop.PointerConvertible,
): number

export declare function PMPageFormatGetPrinterID(
	pageFormat: interop.PointerConvertible,
	printerID: interop.PointerConvertible,
): number

export declare function PMGetScale(
	pageFormat: interop.PointerConvertible,
	scale: interop.PointerConvertible,
): number

export declare function PMGetUnadjustedPageRect(
	pageFormat: interop.PointerConvertible,
	pageRect: interop.PointerConvertible,
): number

export declare function PMGetUnadjustedPaperRect(
	pageFormat: interop.PointerConvertible,
	paperRect: interop.PointerConvertible,
): number

export declare function PMSetOrientation(
	pageFormat: interop.PointerConvertible,
	orientation: number,
	lock: number,
): number

export declare function PMSetPageFormatExtendedData(
	pageFormat: interop.PointerConvertible,
	dataID: number,
	size: number,
	extendedData: interop.PointerConvertible,
): number

export declare function PMSetScale(pageFormat: interop.PointerConvertible, scale: number): number

export declare function PMCreatePrintSettings(printSettings: interop.PointerConvertible): number

export declare function PMSessionDefaultPrintSettings(
	printSession: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
): number

export declare function PMSessionValidatePrintSettings(
	printSession: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	changed: interop.PointerConvertible,
): number

export declare function PMCopyPrintSettings(
	settingSrc: interop.PointerConvertible,
	settingDest: interop.PointerConvertible,
): number

export declare function PMPrintSettingsCreateDataRepresentation(
	printSettings: interop.PointerConvertible,
	data: interop.PointerConvertible,
	format: interop.Enum<typeof PMDataFormat>,
): number

export declare function PMPrintSettingsCreateWithDataRepresentation(
	data: interop.Object,
	printSettings: interop.PointerConvertible,
): number

export declare function PMGetCollate(
	printSettings: interop.PointerConvertible,
	collate: interop.PointerConvertible,
): number

export declare function PMGetCopies(
	printSettings: interop.PointerConvertible,
	copies: interop.PointerConvertible,
): number

export declare function PMGetDuplex(
	printSettings: interop.PointerConvertible,
	duplexSetting: interop.PointerConvertible,
): number

export declare function PMGetFirstPage(
	printSettings: interop.PointerConvertible,
	first: interop.PointerConvertible,
): number

export declare function PMGetLastPage(
	printSettings: interop.PointerConvertible,
	last: interop.PointerConvertible,
): number

export declare function PMGetPageRange(
	printSettings: interop.PointerConvertible,
	minPage: interop.PointerConvertible,
	maxPage: interop.PointerConvertible,
): number

export declare function PMPrintSettingsGetJobName(
	printSettings: interop.PointerConvertible,
	name: interop.PointerConvertible,
): number

export declare function PMPrintSettingsGetValue(
	printSettings: interop.PointerConvertible,
	key: interop.Object,
	value: interop.PointerConvertible,
): number

export declare function PMSetCollate(
	printSettings: interop.PointerConvertible,
	collate: number,
): number

export declare function PMSetCopies(
	printSettings: interop.PointerConvertible,
	copies: number,
	lock: number,
): number

export declare function PMSetDuplex(
	printSettings: interop.PointerConvertible,
	duplexSetting: number,
): number

export declare function PMSetFirstPage(
	printSettings: interop.PointerConvertible,
	first: number,
	lock: number,
): number

export declare function PMSetLastPage(
	printSettings: interop.PointerConvertible,
	last: number,
	lock: number,
): number

export declare function PMSetPageRange(
	printSettings: interop.PointerConvertible,
	minPage: number,
	maxPage: number,
): number

export declare function PMPrintSettingsSetJobName(
	printSettings: interop.PointerConvertible,
	name: interop.Object,
): number

export declare function PMPrintSettingsSetValue(
	printSettings: interop.PointerConvertible,
	key: interop.Object,
	value: interop.Object,
	locked: number,
): number

export declare function PMPrintSettingsCopyAsDictionary(
	printSettings: interop.PointerConvertible,
	settingsDictionary: interop.PointerConvertible,
): number

export declare function PMPrintSettingsCopyKeys(
	printSettings: interop.PointerConvertible,
	settingsKeys: interop.PointerConvertible,
): number

export declare function PMCreateGenericPrinter(printer: interop.PointerConvertible): number

export declare function PMServerCreatePrinterList(
	server: interop.PointerConvertible,
	printerList: interop.PointerConvertible,
): number

export declare function PMServerLaunchPrinterBrowser(
	server: interop.PointerConvertible,
	options: interop.Object,
): number

export declare function PMPrinterCreateFromPrinterID(printerID: interop.Object): interop.Pointer

export declare function PMPrinterCopyDescriptionURL(
	printer: interop.PointerConvertible,
	descriptionType: interop.Object,
	fileURL: interop.PointerConvertible,
): number

export declare function PMPrinterCopyDeviceURI(
	printer: interop.PointerConvertible,
	deviceURI: interop.PointerConvertible,
): number

export declare function PMPrinterCopyHostName(
	printer: interop.PointerConvertible,
	hostNameP: interop.PointerConvertible,
): number

export declare function PMPrinterCopyPresets(
	printer: interop.PointerConvertible,
	presetList: interop.PointerConvertible,
): number

export declare function PMPrinterGetCommInfo(
	printer: interop.PointerConvertible,
	supportsControlCharRangeP: interop.PointerConvertible,
	supportsEightBitP: interop.PointerConvertible,
): number

export declare function PMPrinterGetID(printer: interop.PointerConvertible): interop.Object

export declare function PMPrinterGetLocation(printer: interop.PointerConvertible): interop.Object

export declare function PMPrinterGetDriverCreator(
	printer: interop.PointerConvertible,
	creator: interop.PointerConvertible,
): number

export declare function PMPrinterGetDriverReleaseInfo(
	printer: interop.PointerConvertible,
	release: interop.PointerConvertible,
): number

export declare function PMPrinterGetPrinterResolutionCount(
	printer: interop.PointerConvertible,
	countP: interop.PointerConvertible,
): number

export declare function PMPrinterGetIndexedPrinterResolution(
	printer: interop.PointerConvertible,
	index: number,
	resolutionP: interop.PointerConvertible,
): number

export declare function PMPrinterGetOutputResolution(
	printer: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	resolutionP: interop.PointerConvertible,
): number

export declare function PMPrinterSetOutputResolution(
	printer: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
	resolutionP: interop.PointerConvertible,
): number

export declare function PMPrinterGetLanguageInfo(
	printer: interop.PointerConvertible,
	info: interop.PointerConvertible,
): number

export declare function PMPrinterGetMakeAndModelName(
	printer: interop.PointerConvertible,
	makeAndModel: interop.PointerConvertible,
): number

export declare function PMPrinterGetMimeTypes(
	printer: interop.PointerConvertible,
	settings: interop.PointerConvertible,
	mimeTypes: interop.PointerConvertible,
): number

export declare function PMPrinterGetName(printer: interop.PointerConvertible): interop.Object

export declare function PMPrinterGetPaperList(
	printer: interop.PointerConvertible,
	paperList: interop.PointerConvertible,
): number

export declare function PMPrinterGetState(
	printer: interop.PointerConvertible,
	state: interop.PointerConvertible,
): number

export declare function PMPrinterIsDefault(printer: interop.PointerConvertible): number

export declare function PMPrinterIsFavorite(printer: interop.PointerConvertible): number

export declare function PMPrinterIsPostScriptCapable(printer: interop.PointerConvertible): number

export declare function PMPrinterIsPostScriptPrinter(
	printer: interop.PointerConvertible,
	isPSPrinter: interop.PointerConvertible,
): number

export declare function PMPrinterIsRemote(
	printer: interop.PointerConvertible,
	isRemoteP: interop.PointerConvertible,
): number

export declare function PMPrinterSetDefault(printer: interop.PointerConvertible): number

export declare function PMPresetCopyName(
	preset: interop.PointerConvertible,
	name: interop.PointerConvertible,
): number

export declare function PMPresetCreatePrintSettings(
	preset: interop.PointerConvertible,
	session: interop.PointerConvertible,
	printSettings: interop.PointerConvertible,
): number

export declare function PMPresetGetAttributes(
	preset: interop.PointerConvertible,
	attributes: interop.PointerConvertible,
): number

export declare function PMGetPageFormatPaper(
	format: interop.PointerConvertible,
	paper: interop.PointerConvertible,
): number

export declare function PMPaperCreateCustom(
	printer: interop.PointerConvertible,
	id: interop.Object,
	name: interop.Object,
	width: number,
	height: number,
	margins: interop.PointerConvertible,
	paperP: interop.PointerConvertible,
): number

export declare function PMPaperGetWidth(
	paper: interop.PointerConvertible,
	paperWidth: interop.PointerConvertible,
): number

export declare function PMPaperGetHeight(
	paper: interop.PointerConvertible,
	paperHeight: interop.PointerConvertible,
): number

export declare function PMPaperGetMargins(
	paper: interop.PointerConvertible,
	paperMargins: interop.PointerConvertible,
): number

export declare function PMPaperGetID(
	paper: interop.PointerConvertible,
	paperID: interop.PointerConvertible,
): number

export declare function PMPaperGetPPDPaperName(
	paper: interop.PointerConvertible,
	paperName: interop.PointerConvertible,
): number

export declare function PMPaperCreateLocalizedName(
	paper: interop.PointerConvertible,
	printer: interop.PointerConvertible,
	paperName: interop.PointerConvertible,
): number

export declare function PMPaperGetPrinterID(
	paper: interop.PointerConvertible,
	printerID: interop.PointerConvertible,
): number

export declare function PMPaperIsCustom(paper: interop.PointerConvertible): number

export declare function PMWorkflowCopyItems(workflowItems: interop.PointerConvertible): number

export declare function PMWorkflowSubmitPDFWithOptions(
	workflowItem: interop.Object,
	title: interop.Object,
	options: string,
	pdfFile: interop.Object,
): number

export declare function PMWorkflowSubmitPDFWithSettings(
	workflowItem: interop.Object,
	settings: interop.PointerConvertible,
	pdfFile: interop.Object,
): number

export declare function PMPrinterPrintWithProvider(
	printer: interop.PointerConvertible,
	settings: interop.PointerConvertible,
	format: interop.PointerConvertible,
	mimeType: interop.Object,
	provider: interop.Object,
): number

export declare function PMPrinterPrintWithFile(
	printer: interop.PointerConvertible,
	settings: interop.PointerConvertible,
	format: interop.PointerConvertible,
	mimeType: interop.Object,
	fileURL: interop.Object,
): number

export declare function PMPrinterWritePostScriptToURL(
	printer: interop.PointerConvertible,
	settings: interop.PointerConvertible,
	format: interop.PointerConvertible,
	mimeType: interop.Object,
	sourceFileURL: interop.Object,
	destinationFileURL: interop.Object,
): number

export declare function PMPrintSettingsToOptions(
	settings: interop.PointerConvertible,
	options: interop.PointerConvertible,
): number

export declare function PMPrintSettingsToOptionsWithPrinterAndPageFormat(
	settings: interop.PointerConvertible,
	printer: interop.PointerConvertible,
	pageFormat: interop.PointerConvertible,
	options: interop.PointerConvertible,
): number

export declare function PMPrinterSendCommand(
	printer: interop.PointerConvertible,
	commandString: interop.Object,
	jobTitle: interop.Object,
	options: interop.Object,
): number

export declare function PMPrinterCopyState(
	printer: interop.PointerConvertible,
	stateDict: interop.PointerConvertible,
): number

export declare function PMCopyAvailablePPDs(
	domain: number,
	ppds: interop.PointerConvertible,
): number

export declare function PMCopyLocalizedPPD(
	ppd: interop.Object,
	localizedPPD: interop.PointerConvertible,
): number

export declare function PMCopyPPDData(ppd: interop.Object, data: interop.PointerConvertible): number

export declare function PMCGImageCreateWithEPSDataProvider(
	epsDataProvider: interop.Object,
	epsPreview: interop.Object,
): interop.Object

export declare function NewSpeechTextDoneUPP(
	userRoutine: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => void,
): (
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
) => void

export declare function NewSpeechDoneUPP(
	userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void

export declare function NewSpeechSyncUPP(
	userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void,
): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void

export declare function NewSpeechErrorUPP(
	userRoutine: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void,
): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void

export declare function NewSpeechPhonemeUPP(
	userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void,
): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void

export declare function NewSpeechWordUPP(
	userRoutine: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void,
): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void

export declare function DisposeSpeechTextDoneUPP(
	userUPP: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => void,
): void

export declare function DisposeSpeechDoneUPP(
	userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
): void

export declare function DisposeSpeechSyncUPP(
	userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void,
): void

export declare function DisposeSpeechErrorUPP(
	userUPP: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void,
): void

export declare function DisposeSpeechPhonemeUPP(
	userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void,
): void

export declare function DisposeSpeechWordUPP(
	userUPP: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void,
): void

export declare function InvokeSpeechTextDoneUPP(
	chan: interop.PointerConvertible,
	refCon: interop.PointerConvertible,
	nextBuf: interop.PointerConvertible,
	byteLen: interop.PointerConvertible,
	controlFlags: interop.PointerConvertible,
	userUPP: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => void,
): void

export declare function InvokeSpeechDoneUPP(
	chan: interop.PointerConvertible,
	refCon: interop.PointerConvertible,
	userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
): void

export declare function InvokeSpeechSyncUPP(
	chan: interop.PointerConvertible,
	refCon: interop.PointerConvertible,
	syncMessage: number,
	userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void,
): void

export declare function InvokeSpeechErrorUPP(
	chan: interop.PointerConvertible,
	refCon: interop.PointerConvertible,
	theError: number,
	bytePos: number,
	userUPP: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void,
): void

export declare function InvokeSpeechPhonemeUPP(
	chan: interop.PointerConvertible,
	refCon: interop.PointerConvertible,
	phonemeOpcode: number,
	userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void,
): void

export declare function InvokeSpeechWordUPP(
	chan: interop.PointerConvertible,
	refCon: interop.PointerConvertible,
	wordPos: number,
	wordLen: number,
	userUPP: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => void,
): void

export declare function SpeechManagerVersion(): NumVersion

export declare function MakeVoiceSpec(
	creator: number,
	id: number,
	voice: interop.PointerConvertible,
): number

export declare function CountVoices(numVoices: interop.PointerConvertible): number

export declare function GetIndVoice(index: number, voice: interop.PointerConvertible): number

export declare function GetVoiceDescription(
	voice: interop.PointerConvertible,
	info: interop.PointerConvertible,
	infoLength: number,
): number

export declare function GetVoiceInfo(
	voice: interop.PointerConvertible,
	selector: number,
	voiceInfo: interop.PointerConvertible,
): number

export declare function NewSpeechChannel(
	voice: interop.PointerConvertible,
	chan: interop.PointerConvertible,
): number

export declare function DisposeSpeechChannel(chan: interop.PointerConvertible): number

export declare function SpeakString(textToBeSpoken: interop.PointerConvertible): number

export declare function SpeakText(
	chan: interop.PointerConvertible,
	textBuf: interop.PointerConvertible,
	textBytes: number,
): number

export declare function SpeakBuffer(
	chan: interop.PointerConvertible,
	textBuf: interop.PointerConvertible,
	textBytes: number,
	controlFlags: number,
): number

export declare function StopSpeech(chan: interop.PointerConvertible): number

export declare function StopSpeechAt(chan: interop.PointerConvertible, whereToStop: number): number

export declare function PauseSpeechAt(
	chan: interop.PointerConvertible,
	whereToPause: number,
): number

export declare function ContinueSpeech(chan: interop.PointerConvertible): number

export declare function SpeechBusy(): number

export declare function SpeechBusySystemWide(): number

export declare function SetSpeechRate(chan: interop.PointerConvertible, rate: number): number

export declare function GetSpeechRate(
	chan: interop.PointerConvertible,
	rate: interop.PointerConvertible,
): number

export declare function SetSpeechPitch(chan: interop.PointerConvertible, pitch: number): number

export declare function GetSpeechPitch(
	chan: interop.PointerConvertible,
	pitch: interop.PointerConvertible,
): number

export declare function SetSpeechInfo(
	chan: interop.PointerConvertible,
	selector: number,
	speechInfo: interop.PointerConvertible,
): number

export declare function GetSpeechInfo(
	chan: interop.PointerConvertible,
	selector: number,
	speechInfo: interop.PointerConvertible,
): number

export declare function TextToPhonemes(
	chan: interop.PointerConvertible,
	textBuf: interop.PointerConvertible,
	textBytes: number,
	phonemeBuf: interop.PointerConvertible,
	phonemeBytes: interop.PointerConvertible,
): number

export declare function UseDictionary(
	chan: interop.PointerConvertible,
	dictionary: interop.PointerConvertible,
): number

export declare function SpeakCFString(
	chan: interop.PointerConvertible,
	aString: interop.Object,
	options: interop.Object,
): number

export declare function UseSpeechDictionary(
	chan: interop.PointerConvertible,
	speechDictionary: interop.Object,
): number

export declare function CopyPhonemesFromText(
	chan: interop.PointerConvertible,
	text: interop.Object,
	phonemes: interop.PointerConvertible,
): number

export declare function CopySpeechProperty(
	chan: interop.PointerConvertible,
	property: interop.Object,
	object: interop.PointerConvertible,
): number

export declare function SetSpeechProperty(
	chan: interop.PointerConvertible,
	property: interop.Object,
	object: interop.Object,
): number

export declare function SpeechSynthesisRegisterModuleURL(url: interop.Object): number

export declare function SpeechSynthesisUnregisterModuleURL(url: interop.Object): number

export declare interface PDEPlugInCallbackProtocol {
	printSession(): interop.Pointer

	printSettings(): interop.Pointer

	pageFormat(): interop.Pointer

	PMPrinter(): interop.Pointer

	ppdFile(): interop.Pointer

	willChangePPDOptionKeyValuePpdChoice(option: string, choice: string): boolean
}

export declare class PDEPlugInCallbackProtocol
	extends NativeObject
	implements PDEPlugInCallbackProtocol {}

export declare interface PDEPanel extends NSObjectProtocol {
	willShow(): void

	shouldHide(): boolean

	saveValuesAndReturnError(error: interop.PointerConvertible): boolean

	restoreValuesAndReturnError(error: interop.PointerConvertible): boolean

	supportedPPDOptionKeys?(): NSArray

	PPDOptionKeyValueDidChangePpdChoice(option: string, choice: string): void

	panelView(): NSView | null

	panelName(): string

	panelKind(): string

	summaryInfo(): NSDictionary | null

	shouldShowHelp?(): boolean

	shouldPrint?(): boolean

	printWindowWillClose?(userCanceled: boolean): void
}

export declare class PDEPanel extends NativeObject implements PDEPanel {}

export declare interface PDEPlugIn extends NSObjectProtocol {
	initWithBundle(theBundle: NSBundle): this

	PDEPanelsForTypeWithHostInfo(pdeType: string, host: PDEPlugInCallbackProtocol): NSArray
}

export declare class PDEPlugIn extends NativeObject implements PDEPlugIn {}
