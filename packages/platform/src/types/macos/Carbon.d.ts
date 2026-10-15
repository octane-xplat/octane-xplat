import type { NSImage } from './AppKit'

import type { CMColor, FMFontFamilyInstance, RGBColor } from './ApplicationServices'

import type { CFRange, CFUUIDBytes, CGPoint, CGRect } from './CoreFoundation'

import type { FSSpec } from './CoreServices'

import type { NSArray, NSAttributedString, NSDictionary, _NSRange } from './Foundation'

import type { Point, Rect } from './Runtime'

import type { interop } from './objc-runtime'

import { CTFontUIFontType } from './CoreText'

import { NativeObject } from './objc-runtime'



export declare const kAHTOCTypeUser: number;

export declare const kAHInternetConfigPrefErr: number;

export declare const kUserNameAndPasswordFlag: number;

export declare const kURLAllEventsMask: number;

export declare const kURLPeriodicEventMask: number;

export declare const kURLPercentEventMask: number;

export declare const kURLSystemEventMask: number;

export declare const kURLTransactionCompleteEventMask: number;

export declare const kURLErrorOccurredEventMask: number;

export declare const kURLResourceFoundEventMask: number;

export declare const kURLPropertyChangedEvent: number;

export declare const kURLPeriodicEvent: number;

export declare const kURLPercentEvent: number;

export declare const kURLUploadingEvent: number;

export declare const kURLErrorOccurredEvent: number;

export declare const kURLCompletedEvent: number;

export declare const kURLAbortInitiatedEvent: number;

export declare const kURLDownloadingEvent: number;

export declare const kURLInitiatedEvent: number;

export declare const kURLUploadingState: number;

export declare const kURLAbortingState: number;

export declare const kURLTransactionCompleteState: number;

export declare const kURLDataAvailableState: number;

export declare const kURLResourceFoundState: number;

export declare const kURLInitiatingState: number;

export declare const kURLNullState: number;

export declare const kURLResumeDownloadFlag: number;

export declare const kURLDebinhexOnlyFlag: number;

export declare const kURLExpandAndVerifyFlag: number;

export declare const kURLDirectoryListingFlag: number;

export declare const kURLDoNotTryAnonymousFlag: number;

export declare const kURLIsDirectoryHintFlag: number;

export declare const kURLUploadFlag: number;

export declare const kURLDisplayAuthFlag: number;

export declare const kURLDisplayProgressFlag: number;

export declare const kURLExpandFileFlag: number;

export declare const kURLReplaceExistingFlag: number;

export declare const kSRWordType: number;

export declare const kSRPhraseType: number;

export declare const kSRLanguageModelType: number;

export declare const kSRRejectionLevel: number;

export declare const kSRRepeatable: number;

export declare const kSROptional: number;

export declare const kSRLanguageModelFormat: number;

export declare const kSRTEXTFormat: number;

export declare const kSRMustCancelSearch: number;

export declare const kSRSearchWaitForAllClients: number;

export declare const kSRSearchInProgress: number;

export declare const kSRIdleRecognizer: number;

export declare const kSRKeyExpected: number;

export declare const kSRKeyWord: number;

export declare const kSRListenKeyCombo: number;

export declare const kSRUseToggleListen: number;

export declare const kSRSpeedVsAccuracyParam: number;

export declare const kSRCancelOnSoundOut: number;

export declare const kSRReadAudioURL: number;

export declare const kSRReadAudioFSSpec: number;

export declare const kSRSoundInVolume: number;

export declare const kSRForegroundOnly: number;

export declare const kSRAutoFinishingParam: number;

export declare const typeSRSpeechResult: number;

export declare const keySRSpeechStatus: number;

export declare const keySRRecognizer: number;

export declare const kAESpeechDetected: number;

export declare const kAESpeechDone: number;

export declare const kAESpeechSuite: number;

export declare const kSRLiveDesktopSpeechSource: number;

export declare const kSRDefaultSpeechSource: number;

export declare const kSRNoFeedbackHasListenModes: number;

export declare const kSRHasFeedbackHasListenModes: number;

export declare const kSRNoFeedbackNoListenModes: number;

export declare const kSRRejectedWord: number;

export declare const kSRCantReadLanguageObject: number;

export declare const kSRCantAdd: number;

export declare const kSRTooManyElements: number;

export declare const kSRExpansionTooDeep: number;

export declare const kSRWordNotFound: number;

export declare const kSRAlreadyFinished: number;

export declare const kSRLanguageModelTooBig: number;

export declare const kSRSubItemNotFound: number;

export declare const kSRHasNoSubItems: number;

export declare const kSRRecognitionCanceled: number;

export declare const kSRNoPendingUtterances: number;

export declare const kSRNoClientLanguageModel: number;

export declare const kSRModelMismatch: number;

export declare const kSRNotListeningState: number;

export declare const kSRAlreadyListening: number;

export declare const kSRCantSetDuringRecognition: number;

export declare const kSRCantSetProperty: number;

export declare const kSRFeedbackNotAvail: number;

export declare const kSRNotARecSystem: number;

export declare const kSRBadSelector: number;

export declare const kSRParamOutOfRange: number;

export declare const kSRBadParameter: number;

export declare const kSRNotASpeechObject: number;

export declare const kSROutOfMemory: number;

export declare const kSRComponentNotFound: number;

export declare const kFCFontCGColorAttribute: interop.Pointer;

export declare const kFCFontVisibleNameAttribute: interop.Pointer;

export declare const kFCFontSizeAttribute: interop.Pointer;

export declare const kFCFontFaceAttribute: interop.Pointer;

export declare const kFCFontNameAttribute: interop.Pointer;

export declare const kFCFontFamilyAttribute: interop.Pointer;

export declare const kFontSelectionATSUIType: number;

export declare const fontPanelFontSelectionQDStyleVersionErr: number;

export declare const kFontPanelMouseTrackingState: interop.Pointer;

export declare const kFontPanelAttributesKey: interop.Pointer;

export declare const kFontPanelVariationValuesKey: interop.Pointer;

export declare const kFontPanelVariationAxesKey: interop.Pointer;

export declare const kEventParamFontColor: number;

export declare const kEventParamFMFontSize: number;

export declare const kEventParamATSUFontSize: number;

export declare const typeFontColor: number;

export declare const typeFMFontSize: number;

export declare const typeFMFontStyle: number;

export declare const typeATSUSize: number;

export declare const kEventFontSelection: number;

export declare const kEventClassFont: number;

export declare const kColorPickerDetachedFromChoices: number;

export declare const kColorPickerInPickerDialog: number;

export declare const kAtSpecifiedOrigin: number;

export declare const kDefaultColorPickerHeight: number;

export declare const kDigiHubBlankDVD: number;

export declare const kDigiHubBlankCD: number;

export declare const kDigiHubVideoDVD: number;

export declare const errFinderCantDeleteImmediately: number;

export declare const errFinderNoInvisibleFiles: number;

export declare const errFinderBadPackageContents: number;

export declare const errFinderWindowMustBeButtonView: number;

export declare const errFinderLockedItemsInTrash: number;

export declare const errFinderVolumeNotFound: number;

export declare const errFinderFileSharingMustBeOn: number;

export declare const errAEValueOutOfRange: number;

export declare const errFinderBoundsWrong: number;

export declare const errFinderSysFolderProtected: number;

export declare const errFinderPropertyNowWindowBased: number;

export declare const errFinderWindowWrongType: number;

export declare const errFinderSharePointsCantInherit: number;

export declare const errFinderItemAlreadyInDest: number;

export declare const errFinderCantUseTrashedItems: number;

export declare const errFinderCantMoveToAncestor: number;

export declare const errFinderCantOverwrite: number;

export declare const errFinderCantMoveSource: number;

export declare const errFinderWindowMustBeIconView: number;

export declare const errFinderIsBusy: number;

export declare const formCreator: number;

export declare const keyOldFinderItems: number;

export declare const keyASPrepositionHas: number;

export declare const keyRedirectedDocumentList: number;

export declare const keyGlobalPositionList: number;

export declare const keyAENoAutoRouting: number;

export declare const keyMini8BitIcon: number;

export declare const keyMini1BitMask: number;

export declare const keySmall32BitIcon: number;

export declare const keySmall4BitIcon: number;

export declare const keySmall8BitIcon: number;

export declare const keySmallIconAndMask: number;

export declare const key8BitMask: number;

export declare const key4BitIcon: number;

export declare const key8BitIcon: number;

export declare const typeSmall4BitIcon: number;

export declare const typeSmall8BitIcon: number;

export declare const typeSmall8BitMask: number;

export declare const typeSmallIconAndMask: number;

export declare const type8BitIcon: number;

export declare const enumPrefsListViewPanel: number;

export declare const enumPrefsIconViewPanel: number;

export declare const enumPrefsWindowPanel: number;

export declare const enumMemoryPanel: number;

export declare const enumFontsPanel: number;

export declare const enumStatusNConfigPanel: number;

export declare const enumSortDirectionReverse: number;

export declare const enumSortDirectionNormal: number;

export declare const enumLargeIconSize: number;

export declare const enumMiniIconSize: number;

export declare const enumIconSize: number;

export declare const enumAllDisks: number;

export declare const enumAllRemoteDisks: number;

export declare const enumAliases: number;

export declare const enumFolders: number;

export declare const enumOnDate: number;

export declare const enumBetweenDate: number;

export declare const enumAfterDate: number;

export declare const enumBeforeDate: number;

export declare const enumLastMonth: number;

export declare const enumThisWeek: number;

export declare const enumYesterday: number;

export declare const enumToday: number;

export declare const enumDate: number;

export declare const enumOlderItems: number;

export declare const enumExistingItems: number;

export declare const enumConflicts: number;

export declare const enumGestalt: number;

export declare const pGrid: number;

export declare const pSmallButton: number;

export declare const pSmallIcon: number;

export declare const pSeeFolders: number;

export declare const pSeeFiles: number;

export declare const pViewPreferences: number;

export declare const pTemporaryFolder: number;

export declare const pSystemFolder: number;

export declare const pStartupItemsFolder: number;

export declare const pShutdownFolder: number;

export declare const pPreferencesFolder: number;

export declare const pFinderPreferences: number;

export declare const pControlPanelsFolder: number;

export declare const pARADialIn: number;

export declare const pIsOwner: number;

export declare const pCanDoProgramLinking: number;

export declare const pCanChangePassword: number;

export declare const pDeskAccessoryFile: number;

export declare const pHasScriptingTerminology: number;

export declare const pLocalAndRemoteEvents: number;

export declare const pPartitionSpaceUsed: number;

export declare const pFile: number;

export declare const pBySizeArrangement: number;

export declare const pByCreationDateArrangement: number;

export declare const pByModificationDateArrangement: number;

export declare const pByNameArrangement: number;

export declare const pSnapToGridArrangement: number;

export declare const pNoArrangement: number;

export declare const pIconViewArrangement: number;

export declare const pDefaultListViewIconSize: number;

export declare const pDefaultButtonViewIconSize: number;

export declare const pLabel7: number;

export declare const pLabel4: number;

export declare const pLabel3: number;

export declare const pLabel1: number;

export declare const pUseShortMenus: number;

export declare const pDelayBeforeSpringing: number;

export declare const pUseRelativeDate: number;

export declare const pShowModificationDate: number;

export declare const pProgramLinkingOn: number;

export declare const pFileShareOn: number;

export declare const pInfoPanel: number;

export declare const pObject: number;

export declare const pIsCollapsed: number;

export declare const pIsPulledOpen: number;

export declare const pIsPopup: number;

export declare const pIsZoomedFull: number;

export declare const pIsStartup: number;

export declare const pFreeSpace: number;

export declare const pSharingWindow: number;

export declare const pSharing: number;

export declare const pSharingProtection: number;

export declare const pMounted: number;

export declare const pExported: number;

export declare const pGuestPrivileges: number;

export declare const pOwnerPrivileges: number;

export declare const pStartupDisk: number;

export declare const pKeepArrangedBy: number;

export declare const pIconSize: number;

export declare const pPreviousView: number;

export declare const pExpanded: number;

export declare const pContainerWindow: number;

export declare const pViewFontSize: number;

export declare const pGridIcons: number;

export declare const pListViewIconSize: number;

export declare const pShowSize: number;

export declare const pShowLabel: number;

export declare const pShowCreationDate: number;

export declare const pSound: number;

export declare const pAppPartition: number;

export declare const pProductVersion: number;

export declare const pFileTypeOld: number;

export declare const pFileType: number;

export declare const pWindow: number;

export declare const pPosition: number;

export declare const pModificationDate: number;

export declare const pModificationDateOld: number;

export declare const pKind: number;

export declare const pInfoWindow: number;

export declare const pIconBitmap: number;

export declare const pFolderOld: number;

export declare const pDisk: number;

export declare const pDescription: number;

export declare const pCreationDate: number;

export declare const pCreationDateOld: number;

export declare const pContainer: number;

export declare const pComment: number;

export declare const cIconFamily: number;

export declare const cOnlineRemoteDisk: number;

export declare const cOnlineLocalDisk: number;

export declare const cSpecialFolders: number;

export declare const cAliasList: number;

export declare const cSound: number;

export declare const cLabel: number;

export declare const cGroup: number;

export declare const cAccessoryProcess: number;

export declare const cProcess: number;

export declare const cDTPWindow: number;

export declare const cClippingWindow: number;

export declare const cStatusWindow: number;

export declare const cSharingWindow: number;

export declare const cContainerWindow: number;

export declare const cContentSpace: number;

export declare const cPackage: number;

export declare const cSuitcase: number;

export declare const cClippingFile: number;

export declare const cSoundFile: number;

export declare const cFontFile: number;

export declare const cDocumentFile: number;

export declare const cDeskAccessoryFile: number;

export declare const cInternalFinderObject: number;

export declare const kAESort: number;

export declare const kAEDatabaseSuite: number;

export declare const kAESync: number;

export declare const kAEErase: number;

export declare const kAEEject: number;

export declare const kAECleanUp: number;

export declare const kAEFinderSuite: number;

export declare const pScriptCode: number;

export declare const cWritingCodeInfo: number;

export declare const pASHours: number;

export declare const pASMinutes: number;

export declare const pASSeconds: number;

export declare const pASQuote: number;

export declare const cFriday: number;

export declare const cThursday: number;

export declare const cWednesday: number;

export declare const cTuesday: number;

export declare const cSunday: number;

export declare const cDecember: number;

export declare const cNovember: number;

export declare const cSeptember: number;

export declare const cJuly: number;

export declare const cApril: number;

export declare const cJanuary: number;

export declare const cMonth: number;

export declare const pASDateString: number;

export declare const pASDay: number;

export declare const pASMonth: number;

export declare const cAddress: number;

export declare const cMachine: number;

export declare const cZone: number;

export declare const cCoerceKataHiragana: number;

export declare const cCoerceSmallKana: number;

export declare const cCoerceRemoveHyphens: number;

export declare const cCoerceRemovePunctuation: number;

export declare const cCoerceRemoveDiacriticals: number;

export declare const cCoerceLowerCase: number;

export declare const cCoerceUpperCase: number;

export declare const enumConsidsAndIgnores: number;

export declare const kASConsiderRepliesIgnoreMask: number;

export declare const kAEHyphensIgnoreMask: number;

export declare const kAEWhiteSpaceIgnoreMask: number;

export declare const kAEDiacriticIgnoreMask: number;

export declare const kASNumericStringsConsiderMask: number;

export declare const kASConsiderRepliesConsiderMask: number;

export declare const kAEPunctuationConsiderMask: number;

export declare const kAEExpansionConsiderMask: number;

export declare const enumConsiderations: number;

export declare const kASConsiderReplies: number;

export declare const kAEZenkakuHankaku: number;

export declare const kAEPunctuation: number;

export declare const kAEHyphens: number;

export declare const kAEDiacritic: number;

export declare const pASRequiredImportItems: number;

export declare const kASInitializeEventCode: number;

export declare const pASParent: number;

export declare const pASPi: number;

export declare const pASReturn: number;

export declare const pASSpace: number;

export declare const pASMe: number;

export declare const cString: number;

export declare const enumMiscValues: number;

export declare const kAEFalse: number;

export declare const enumBooleanValues: number;

export declare const typeSound: number;

export declare const cSeconds: number;

export declare const cAliasOrString: number;

export declare const cNumberDateTimeOrString: number;

export declare const cNumberOrDateTime: number;

export declare const cNumberOrString: number;

export declare const cListOrRecord: number;

export declare const cListElement: number;

export declare const cNumber: number;

export declare const cStringClass: number;

export declare const cRawData: number;

export declare const cHandleBreakpoint: number;

export declare const cScriptingAddition: number;

export declare const cDynamicLibrary: number;

export declare const cFramework: number;

export declare const cProcedure: number;

export declare const cHandler: number;

export declare const cScript: number;

export declare const cUserIdentifier: number;

export declare const cKeyIdentifier: number;

export declare const cVector: number;

export declare const cLinkedList: number;

export declare const cSymbol: number;

export declare const cMissingValue: number;

export declare const cUndefined: number;

export declare const cReference: number;

export declare const cReal: number;

export declare const cClassIdentifier: number;

export declare const kDialectBundleResType: number;

export declare const keyASPrepositionSince: number;

export declare const keyASPrepositionAbout: number;

export declare const keyASPrepositionAbove: number;

export declare const keyASPrepositionUnder: number;

export declare const keyASPrepositionBeneath: number;

export declare const keyASPrepositionBeside: number;

export declare const keyASPrepositionAsideFrom: number;

export declare const keyASPrepositionInsteadOf: number;

export declare const keyASPrepositionAgainst: number;

export declare const keyASPrepositionOnto: number;

export declare const keyASPrepositionInto: number;

export declare const keyASPrepositionOn: number;

export declare const keyASPrepositionBy: number;

export declare const keyASPrepositionThru: number;

export declare const keyASPrepositionFor: number;

export declare const keyASPrepositionAt: number;

export declare const typeUserRecordFields: number;

export declare const pProperties: number;

export declare const pLength: number;

export declare const kASExcluding: number;

export declare const kASImporting: number;

export declare const kASUseEventCode: number;

export declare const kOSAErrorArgs: number;

export declare const kASOr: number;

export declare const kASAnd: number;

export declare const kASContains: number;

export declare const kASConcatenate: number;

export declare const kASComesAfter: number;

export declare const kASComesBefore: number;

export declare const kASLessThanOrEqual: number;

export declare const kASEqual: number;

export declare const kASMultiply: number;

export declare const kASSubtract: number;

export declare const kASStopLogEvent: number;

export declare const kASStartLogEvent: number;

export declare const keyAppHandledCoercion: number;

export declare const keyASPositionalArgs: number;

export declare const kASPrepositionalSubroutine: number;

export declare const kASSubroutineEvent: number;

export declare const typeScszResource: number;

export declare const keyScszResource: number;

export declare const kASLaunchEvent: number;

export declare const kUpdateAETE: number;

export declare const kGetAEUT: number;

export declare const kGetAETE: number;

export declare const typeAEUT: number;

export declare const keyASReturning: number;

export declare const keySubjectAttr: number;

export declare const kASSelectGetHandlerNames: number;

export declare const kASSelectGetSysTerminology: number;

export declare const kASSelectGetHandler: number;

export declare const kASSelectSetHandler: number;

export declare const kASSelectSetProperty: number;

export declare const kASSelectGetAppTerminologyObsolete: number;

export declare const kASSelectGetHandlerObsolete: number;

export declare const kASNumberOfSourceStyles: number;

export declare const kASSourceStyleDynamicEnumValue: number;

export declare const kASSourceStyleDynamicClass: number;

export declare const kASSourceStyleDynamicParameterName: number;

export declare const kASSourceStyleDynamicEventName: number;

export declare const kASSourceStyleProperty: number;

export declare const kASSourceStyleClass: number;

export declare const kASSourceStyleParameterName: number;

export declare const kASSourceStyleString: number;

export declare const kASSourceStyleUserSymbol: number;

export declare const kASSourceStyleComment: number;

export declare const kASSourceStyleApplicationKeyword: number;

export declare const kASSourceStyleLanguageKeyword: number;

export declare const kASDefaultPreferredHeapSize: number;

export declare const kASDefaultMinHeapSize: number;

export declare const kASDefaultPreferredStackSize: number;

export declare const kASHasOpenHandler: number;

export declare const kASSelectGetSourceStyleNames: number;

export declare const kASSelectInit: number;

export declare const typeASStorage: number;

export declare const kAppleScriptSubtype: number;

export declare const kAEPunctuationIgnoreMask: number;

export declare const kGSSSelectOutOfRange: number;

export declare const kSRPendingSearch: number;

export declare const kGSSSelectGenericToRealID: number;

export declare const kGSSSelectGetScriptingComponentFromStored: number;

export declare const kGSSSelectSetDefaultScriptingComponent: number;

export declare const kOSAUseStandardDispatch: number;

export declare const keyOSASourceStart: number;

export declare const kOSAErrorMessage: number;

export declare const kOSAErrorNumber: number;

export declare const typeOSAGenericStorage: number;

export declare const kOSAModeFullyQualifyDescriptors: number;

export declare const kOSAModeDontGetDataForArguments: number;

export declare const kOSAModeDispatchToDirectObject: number;

export declare const kOSAModeAugmentContext: number;

export declare const kOSAModeDontReconnect: number;

export declare const kOSAModeAlwaysInteract: number;

export declare const kOSAModeCanInteract: number;

export declare const kOSAModeNeverInteract: number;

export declare const kOSASelectDoEvent: number;

export declare const kOSASelectAvailableDialectCodeList: number;

export declare const kOSASelectSetCurrentDialect: number;

export declare const kOSASelectGetSendProc: number;

export declare const kOSASelectCoerceToDesc: number;

export declare const kOSASelectCoerceFromDesc: number;

export declare const kOSASelectCopySourceString: number;

export declare const kOSASelectGetSource: number;

export declare const kOSASelectScriptingComponentName: number;

export declare const kOSASelectGetActiveProc: number;

export declare const kOSASelectSetActiveProc: number;

export declare const kOSASelectGetScriptInfo: number;

export declare const kOSASelectExecute: number;

export declare const kOSASupportsEventHandling: number;

export declare const kOSASupportsDialects: number;

export declare const kOSASupportsConvenience: number;

export declare const kOSASupportsAESending: number;

export declare const kOSASupportsAECoercion: number;

export declare const kOSASupportsGetSource: number;

export declare const kOSASupportsCompiling: number;

export declare const kOSAModeNull: number;

export declare const kOSANullMode: number;

export declare const kOSANullScript: number;

export declare const keyOSADialectLangCode: number;

export declare const keyOSADialectCode: number;

export declare const typeOSADialectInfo: number;

export declare const kOSACanGetSource: number;

export declare const kOSAScriptIsModified: number;

export declare const kOSASuite: number;

export declare const kOSAFileType: number;

export declare const kOSAGenericScriptingComponentSubtype: number;

export declare const kTSMTEAutoScroll: number;

export declare const kTSMTEInterfaceType: number;

export declare const kTSMTESignature: number;

export declare const kIMKMouseTrackingMode: number;

export declare const kTISNotifyEnabledKeyboardInputSourcesChanged: interop.Pointer;

export declare const kTISTypeInk: interop.Pointer;

export declare const kTISTypeKeyboardViewer: interop.Pointer;

export declare const kTISTypeCharacterPalette: interop.Pointer;

export declare const kTISTypeKeyboardInputMode: interop.Pointer;

export declare const kTISTypeKeyboardInputMethodWithoutModes: interop.Pointer;

export declare const kTISTypeKeyboardLayout: interop.Pointer;

export declare const kTISCategoryKeyboardInputSource: interop.Pointer;

export declare const kTISPropertyUnicodeKeyLayoutData: interop.Pointer;

export declare const kTISPropertyBundleID: interop.Pointer;

export declare const kTISPropertyInputSourceIsEnabled: interop.Pointer;

export declare const kTISPropertyInputSourceIsSelectCapable: interop.Pointer;

export declare const kTISPropertyInputSourceIsEnableCapable: interop.Pointer;

export declare const kTISPropertyInputSourceType: interop.Pointer;

export declare const kIBCarbonRuntimeCantFindObject: number;

export declare const kIBCarbonRuntimeCantFindNibFile: number;

export declare const errKBFailWritePreference: number;

export declare const errKBFailSettingID: number;

export declare const errKBIlligalParameters: number;

export declare const errKBPS2KeyboardNotAvailable: number;

export declare const gestaltKBPS2SetTranslationTable: number;

export declare const gestaltKBPS2SetIDToAny: number;

export declare const gestaltKeyboardsAttr: number;

export declare const kKLKCHRuchrKind: number;

export declare const kKLLanguageCode: number;

export declare const kKLLocalizedName: number;

export declare const kKLIdentifier: number;

export declare const kKLuchrData: number;

export declare const kKLKCHRData: number;

export declare const kKeyboardUnknown: number;

export declare const kKeyboardISO: number;

export declare const kUIOptionDisableHide: number;

export declare const kUIOptionDisableForceQuit: number;

export declare const kUIOptionDisableAppleMenu: number;

export declare const kUIOptionAutoShowMenuBar: number;

export declare const kUIModeAllSuppressed: number;

export declare const kUIModeContentSuppressed: number;

export declare const kHIToolboxVersionNumber: number;

export declare const tsNextSelectMode: number;

export declare const tsPreviousSelectMode: number;

export declare const kTranslationScrapProgressDialogID: number;

export declare const domTranslateFirst: number;

export declare const domNative: number;

export declare const kASTypeNamesSuite: number;

export declare const domCannot: number;

export declare const kTranslateGetTranslatedFilename: number;

export declare const kTranslateTranslateFile: number;

export declare const kTranslateIdentifyFile: number;

export declare const kSupportsScrapTranslation: number;

export declare const kControlScrollTextBoxAutoScrollAmountTag: number;

export declare const kControlKindScrollingTextBox: number;

export declare const kControlScrollTextBoxAutoScrollProc: number;

export declare const kControlScrollTextBoxProc: number;

export declare const kControlListDescResType: number;

export declare const kControlListBoxLDEFTag: number;

export declare const kControlListBoxFontStyleTag: number;

export declare const kControlListBoxKeyFilterTag: number;

export declare const kControlKindListBox: number;

export declare const kControlListBoxAutoSizeProc: number;

export declare const kControlListBoxProc: number;

export declare const kControlPictureHandleTag: number;

export declare const kControlPictureProc: number;

export declare const kControlEditTextInlinePostUpdateProcTag: number;

export declare const kControlEditTextPasswordProc: number;

export declare const kControlDataBrowserDraggedPart: number;

export declare const kControlClockAMPMPart: number;

export declare const kControlPageDownPart: number;

export declare const kControlPageUpPart: number;

export declare const kControlDownButtonPart: number;

export declare const kControlUpButtonPart: number;

export declare const kControlButtonPart: number;

export declare const kControlRadioGroupPart: number;

export declare const kControlListBoxDoubleClickPart: number;

export declare const kControlListBoxPart: number;

export declare const kControlClockPart: number;

export declare const kControlMenuPart: number;

export declare const kControlLabelPart: number;

export declare const popupMenuProc: number;

export declare const radioButProc: number;

export declare const pushButProc: number;

export declare const kListDefStandardTextType: number;

export declare const kListDefUserProcType: number;

export declare const lCloseMsg: number;

export declare const lDrawMsg: number;

export declare const lInitMsg: number;

export declare const lNoNilHilite: number;

export declare const lUseSense: number;

export declare const lNoRect: number;

export declare const lNoExtend: number;

export declare const lOnlyOne: number;

export declare const lNoNilHiliteBit: number;

export declare const lNoExtendBit: number;

export declare const lNoDisjointBit: number;

export declare const lDoHAutoscroll: number;

export declare const lDoVAutoscroll: number;

export declare const lDrawingModeOff: number;

export declare const lDoVAutoscrollBit: number;

export declare const lDrawingModeOffBit: number;

export declare const kEventParamTextLength: number;

export declare const kHIWindowTitleProxyIconPart: number;

export declare const kHIViewWindowGrowBoxID: ControlID;

export declare const kHIViewWindowToolbarButtonID: ControlID;

export declare const kHIViewWindowCloseBoxID: ControlID;

export declare const kHIViewWindowContentID: ControlID;

export declare const kControlEditTextSpellCheckAsYouTypeTag: number;

export declare const kControlEditTextSpellCheckingTag: number;

export declare const kControlEditUnicodeTextPostUpdateProcTag: number;

export declare const kControlEditTextInsertCFStringRefTag: number;

export declare const kControlEditTextInsertTextBufferTag: number;

export declare const kControlEditTextPasswordCFStringTag: number;

export declare const kControlEditTextValidationProcTag: number;

export declare const kControlEditTextFixedTextTag: number;

export declare const kControlEditTextLockedTag: number;

export declare const kControlEditTextCharCount: number;

export declare const kControlEditTextSelectionTag: number;

export declare const kControlEditTextStyleTag: number;

export declare const kControlKindHITextView: number;

export declare const pSize: number;

export declare const kEventTextDidChange: number;

export declare const kEventTextShouldChangeInRange: number;

export declare const kEventParamUnconfirmedRange: number;

export declare const kEventParamTextSelection: number;

export declare const kControlStaticTextIsMultilineTag: number;

export declare const kControlStaticTextTextHeightTag: number;

export declare const kControlStaticTextTextTag: number;

export declare const kControlStaticTextStyleTag: number;

export declare const kControlKindStaticText: number;

export declare const kControlTabListResType: number;

export declare const kControlTabInfoVersionZero: number;

export declare const kControlTabImageContentTag: number;

export declare const kControlTabFontStyleTag: number;

export declare const kControlTabEnabledFlagTag: number;

export declare const kControlTabContentRectTag: number;

export declare const kControlTabSizeMini: number;

export declare const kControlTabSizeSmall: number;

export declare const kControlTabSizeLarge: number;

export declare const kControlTabDirectionEast: number;

export declare const kControlTabDirectionNorth: number;

export declare const kControlTabSmallWestProc: number;

export declare const kControlTabLargeSouthProc: number;

export declare const kControlTabSmallNorthProc: number;

export declare const kControlTabLargeNorthProc: number;

export declare const kControlTabSmallProc: number;

export declare const cSharingPrivileges: number;

export declare const kControlTabLargeProc: number;

export declare const kControlKindSlider: number;

export declare const kControlSliderDoesNotPoint: number;

export declare const kControlSliderNonDirectional: number;

export declare const kControlKindSeparator: number;

export declare const kHISegmentSendCmdToUserFocus: number;

export declare const kHISegmentNoAttributes: number;

export declare const kHISegmentBehaviorSticky: number;

export declare const kHISegmentBehaviorToggles: number;

export declare const kHISegmentBehaviorRadio: number;

export declare const kHISegmentedViewKind: number;

export declare const kEventSearchFieldSearchClicked: number;

export declare const kEventSearchFieldCancelClicked: number;

export declare const kHISearchFieldAttributesSearchIcon: number;

export declare const kHISearchFieldAttributesCancel: number;

export declare const kControlSearchFieldMenuPart: number;

export declare const kControlKindHISearchField: number;

export declare const kHIScrollViewPageRight: number;

export declare const keyASPrepositionThrough: number;

export declare const kHIScrollViewPageDown: number;

export declare const kHIScrollViewScrollToRight: number;

export declare const kHIScrollViewOptionsFillGrowArea: number;

export declare const kHIScrollViewOptionsAllowGrow: number;

export declare const kEventScrollableScrollTo: number;

export declare const kEventScrollableInfoChanged: number;

export declare const kEventScrollableGetInfo: number;

export declare const kEventParamOrigin: number;

export declare const kEventParamImageSize: number;

export declare const kEventClassScrollable: number;

export declare const kControlScrollBarShowsArrowsTag: number;

export declare const kControlKindScrollBar: number;

export declare const kControlScrollBarLiveProc: number;

export declare const kControlScrollBarProc: number;

export declare const kControlChasingArrowsProc: number;

export declare const kControlProgressBarAnimatingTag: number;

export declare const kControlKindRelevanceBar: number;

export declare const kControlKindProgressBar: number;

export declare const popupTitleRightJust: number;

export declare const popupTitleCenterJust: number;

export declare const popupTitleLeftJust: number;

export declare const popupTitleShadow: number;

export declare const popupTitleOutline: number;

export declare const popupTitleItalic: number;

export declare const popupTitleBold: number;

export declare const popupUseWFont: number;

export declare const popupUseAddResMenu: number;

export declare const popupVariableWidth: number;

export declare const popupFixedWidth: number;

export declare const kControlPopupArrowSizeNormal: number;

export declare const kControlPopupArrowOrientationWest: number;

export declare const kControlPopupArrowOrientationEast: number;

export declare const kControlPopupArrowSmallNorthProc: number;

export declare const kControlPopupArrowNorthProc: number;

export declare const kControlPopupArrowWestProc: number;

export declare const kControlPopupButtonCheckCurrentTag: number;

export declare const kControlPopupButtonOwnedMenuRefTag: number;

export declare const kControlPopupButtonExtraHeightTag: number;

export declare const kControlPopupButtonMenuHandleTag: number;

export declare const kHIViewMenuContentID: ControlID;

export declare const kControlLittleArrowsIncrementValueTag: number;

export declare const kControlKindLittleArrows: number;

export declare const kControlImageWellIsDragDestinationTag: number;

export declare const kControlImageWellTransformTag: number;

export declare const kControlKindImageWell: number;

export declare const kControlImageWellProc: number;

export declare const kControlIconContentTag: number;

export declare const kControlIconResourceIDTag: number;

export declare const kControlIconAlignmentTag: number;

export declare const kControlIconTransformTag: number;

export declare const kControlIconRefNoTrackProc: number;

export declare const kHIImageViewImageTag: number;

export declare const kHIImageViewAutoTransformOnDeactivate: number;

export declare const kControlKindDisclosureTriangle: number;

export declare const kControlDisclosureTrianglePointDefault: number;

export declare const kControlTriangleLeftFacingAutoToggleProc: number;

export declare const kControlTriangleProc: number;

export declare const kControlDisclosureButtonDisclosed: number;

export declare const kDataBrowserListViewDefaultColumnFlags: number;

export declare const kDataBrowserListViewTypeSelectColumn: number;

export declare const kDataBrowserListViewMovableColumn: number;

export declare const kDataBrowserListViewSelectionColumn: number;

export declare const kDataBrowserTableViewLastColumn: number;

export declare const kDataBrowserTableViewSelectionColumn: number;

export declare const kDataBrowserLatestCustomCallbacks: number;

export declare const kControlPicturePart: number;

export declare const kDataBrowserStopTracking: number;

export declare const kDataBrowserContentHit: number;

export declare const kEventDataBrowserDrawCustomItem: number;

export declare const kEventParamDataBrowserPropertyID: number;

export declare const kEventParamDataBrowserItemID: number;

export declare const kDataBrowserMetricDisclosureColumnPerDepthGap: number;

export declare const kDataBrowserMetricDisclosureTriangleAndContentGap: number;

export declare const kDataBrowserMetricIconAndTextGap: number;

export declare const kDataBrowserMetricCellContentInset: number;

export declare const kDataBrowserAttributeListViewAlternatingRowColors: number;

export declare const kDataBrowserAttributeColumnViewResizeWindow: number;

export declare const kDataBrowserAttributeNone: number;

export declare const kDataBrowserViewSpecificPropertyFlags: number;

export declare const kDataBrowserViewSpecificFlagsMask: number;

export declare const kDataBrowserPropertyModificationFlags: number;

export declare const kDataBrowserPopupMenuButtonless: number;

export declare const kDataBrowserSliderDownwardThumb: number;

export declare const kASNot: number;

export declare const kDataBrowserSliderPlainThumb: number;

export declare const kDataBrowserDateTimeSecondsToo: number;

export declare const kDataBrowserDateTimeRelative: number;

export declare const kDataBrowserCheckboxTriState: number;

export declare const kDataBrowserPropertyFlagsOffset: number;

export declare const kDataBrowserPropertyIsEditable: number;

export declare const kDataBrowserPropertyIsMutable: number;

export declare const kDataBrowserPropertyRelevanceRankPart: number;

export declare const kDataBrowserPropertyCheckboxPart: number;

export declare const kDataBrowserPropertySliderPart: number;

export declare const kDataBrowserPropertyIconPart: number;

export declare const kDataBrowserPropertyTextPart: number;

export declare const kDataBrowserPropertyDisclosurePart: number;

export declare const kDataBrowserPropertyEnclosingPart: number;

export declare const kDataBrowserPopupMenuType: number;

export declare const kDataBrowserRelevanceRankType: number;

export declare const kDataBrowserDateTimeType: number;

export declare const kDataBrowserTextType: number;

export declare const kDataBrowserCustomType: number;

export declare const kDataBrowserItemParentContainerProperty: number;

export declare const kDataBrowserColumnViewPreviewProperty: number;

export declare const kDataBrowserContainerIsSortableProperty: number;

export declare const kDataBrowserContainerIsOpenableProperty: number;

export declare const kDataBrowserItemIsContainerProperty: number;

export declare const kDataBrowserItemIsSelectableProperty: number;

export declare const kDataBrowserItemIsActiveProperty: number;

export declare const kDataBrowserSelectionSetChanged: number;

export declare const kDataBrowserUserStateChanged: number;

export declare const kDataBrowserTargetChanged: number;

export declare const kDataBrowserUserToggledContainer: number;

export declare const kDataBrowserContainerClosing: number;

export declare const kDataBrowserItemDeselected: number;

export declare const kDataBrowserItemSelected: number;

export declare const kDataBrowserEditStopped: number;

export declare const kDataBrowserEditStarted: number;

export declare const kDataBrowserEditMsgClear: number;

export declare const kDataBrowserEditMsgCopy: number;

export declare const kDataBrowserEditMsgRedo: number;

export declare const kDataBrowserEditMsgUndo: number;

export declare const kDataBrowserSelectionAnchorRight: number;

export declare const kDataBrowserSelectionAnchorLeft: number;

export declare const kDataBrowserSelectionAnchorUp: number;

export declare const kDataBrowserItemsToggle: number;

export declare const kDataBrowserItemsAssign: number;

export declare const kDataBrowserItemsAdd: number;

export declare const kDataBrowserRevealOnly: number;

export declare const kDataBrowserContainerIsOpen: number;

export declare const kDataBrowserItemAnyState: number;

export declare const kDataBrowserItemNoState: number;

export declare const kDataBrowserNoItem: number;

export declare const kDataBrowserOrderDecreasing: number;

export declare const kDataBrowserOrderUndefined: number;

export declare const kDataBrowserAlwaysExtendSelection: number;

export declare const kDataBrowserResetSelection: number;

export declare const kDataBrowserDragSelect: number;

export declare const kDataBrowserNoView: number;

export declare const kControlDataBrowserEditTextValidationProcTag: number;

export declare const kControlDataBrowserKeyFilterTag: number;

export declare const kControlDataBrowserIncludesFrameAndFocusTag: number;

export declare const errDataBrowserInvalidPropertyData: number;

export declare const errDataBrowserInvalidPropertyPart: number;

export declare const errDataBrowserPropertyNotFound: number;

export declare const errDataBrowserItemNotFound: number;

export declare const kControlUserPaneBackgroundProcTag: number;

export declare const kControlUserPaneKeyDownProcTag: number;

export declare const kControlUserPaneTrackingProcTag: number;

export declare const kControlUserPaneHitTestProcTag: number;

export declare const kControlUserPaneDrawProcTag: number;

export declare const kControlKindUserPane: number;

export declare const kControlUserPaneProc: number;

export declare const kControlKindWindowHeader: number;

export declare const kControlKindPlacard: number;

export declare const kControlGroupBoxFrameRectTag: number;

export declare const kControlGroupBoxMenuRefTag: number;

export declare const kControlKindPopupGroupBox: number;

export declare const kControlKindCheckGroupBox: number;

export declare const kControlGroupBoxSecondaryPopupButtonProc: number;

export declare const kControlGroupBoxSecondaryCheckBoxProc: number;

export declare const kControlGroupBoxPopupButtonProc: number;

export declare const kHIComboBoxNumVisibleItemsTag: number;

export declare const kHIComboBoxListTag: number;

export declare const kControlKindHIComboBox: number;

export declare const kHIComboBoxStandardAttributes: number;

export declare const kHIComboBoxAutoSizeListAttribute: number;

export declare const kHIComboBoxAutoSortAttribute: number;

export declare const kHIComboBoxAutoDisclosureAttribute: number;

export declare const kHIComboBoxAutoCompletionAttribute: number;

export declare const kHIComboBoxNoAttributes: number;

export declare const kEventComboBoxListItemSelected: number;

export declare const kControlClockAnimatingTag: number;

export declare const kControlClockFontStyleTag: number;

export declare const kControlKindClock: number;

export declare const kControlClockFlagLive: number;

export declare const kControlClockIsDisplayOnly: number;

export declare const kControlClockFlagDisplayOnly: number;

export declare const kControlClockNoFlags: number;

export declare const kControlClockFlagStandard: number;

export declare const kControlClockTypeMonthDayYear: number;

export declare const kControlClockTypeHourMinuteSecond: number;

export declare const kControlClockTypeHourMinute: number;

export declare const kControlClockMonthYearProc: number;

export declare const kEventClockDateOrTimeChanged: number;

export declare const kControlRoundButtonContentTag: number;

export declare const kControlRoundButtonNormalSize: number;

export declare const kControlBevelButtonIsMultiValueMenuTag: number;

export declare const kControlBevelButtonKindTag: number;

export declare const kControlBevelButtonOwnedMenuRefTag: number;

export declare const kControlBevelButtonScaleIconTag: number;

export declare const kControlBevelButtonMenuRefTag: number;

export declare const _KeyboardDispatch: number;

export declare const kControlBevelButtonGraphicOffsetTag: number;

export declare const kControlBevelButtonTextOffsetTag: number;

export declare const kControlBevelButtonTransformTag: number;

export declare const kControlBevelButtonContentTag: number;

export declare const kControlBevelButtonPlaceAboveGraphic: number;

export declare const kControlBevelButtonPlaceBelowGraphic: number;

export declare const kControlBevelButtonPlaceToLeftOfGraphic: number;

export declare const kControlBevelButtonPlaceToRightOfGraphic: number;

export declare const kControlBevelButtonPlaceNormally: number;

export declare const kControlBevelButtonPlaceSysDirection: number;

export declare const kControlBevelButtonAlignTextFlushLeft: number;

export declare const kControlBevelButtonAlignTextFlushRight: number;

export declare const kControlBevelButtonAlignTextCenter: number;

export declare const kControlBevelButtonAlignTextSysDirection: number;

export declare const kControlBevelButtonAlignBottomRight: number;

export declare const kControlBevelButtonAlignTopRight: number;

export declare const kControlBevelButtonAlignBottomLeft: number;

export declare const kControlBevelButtonAlignTopLeft: number;

export declare const kControlBevelButtonAlignTop: number;

export declare const kControlBevelButtonAlignCenter: number;

export declare const kControlKindBevelButton: number;

export declare const kControlBevelButtonMenuOnRight: number;

export declare const kControlBehaviorCommandMenu: number;

export declare const kControlBehaviorMultiValueMenu: number;

export declare const kControlBehaviorSingleValueMenu: number;

export declare const kControlBehaviorOffsetContents: number;

export declare const kControlBehaviorToggles: number;

export declare const kControlBevelButtonLargeBevel: number;

export declare const kControlBevelButtonMenuOnRightVariant: number;

export declare const kControlBevelButtonSmallBevelVariant: number;

export declare const kControlBevelButtonLargeBevelProc: number;

export declare const kControlBevelButtonNormalBevelProc: number;

export declare const kControlBevelButtonSmallBevelProc: number;

export declare const kControlKindRadioGroup: number;

export declare const kControlRadioGroupProc: number;

export declare const kControlRadioButtonMixedValue: number;

export declare const kControlRadioButtonUncheckedValue: number;

export declare const kControlRadioButtonAutoToggleProc: number;

export declare const kControlCheckBoxMixedValue: number;

export declare const kControlCheckBoxCheckedValue: number;

export declare const kControlCheckBoxUncheckedValue: number;

export declare const kControlKindCheckBox: number;

export declare const kControlCheckBoxAutoToggleProc: number;

export declare const kControlCheckBoxProc: number;

export declare const kControlPushButtonAnimatingTag: number;

export declare const kControlPushButtonDefaultTag: number;

export declare const kControlKindPushIconButton: number;

export declare const kControlPushButtonIconOnLeft: number;

export declare const kControlPushButRightIconProc: number;

export declare const kHMHideTagImmediately: number;

export declare const kHMHideTagFade: number;

export declare const kHMIllegalContentForMinimumState: number;

export declare const errHMIllegalContentForMaximumState: number;

export declare const kHMMaximumContentIndex: number;

export declare const kHMMinimumContentIndex: number;

export declare const kHMContentNotProvided: number;

export declare const kHMContentProvided: number;

export declare const kHMRightBottomCorner: number;

export declare const kHMBottomRightCorner: number;

export declare const kHMLeftTopCorner: number;

export declare const kHMTopLeftCorner: number;

export declare const kHMRightSide: number;

export declare const kHMTopSide: number;

export declare const kHMAbsoluteCenterAligned: number;

export declare const kHMInsideBottomRightCorner: number;

export declare const kHMInsideBottomLeftCorner: number;

export declare const kHMInsideTopRightCorner: number;

export declare const kHMInsideTopLeftCorner: number;

export declare const kHMInsideTopCenterAligned: number;

export declare const kHMInsideBottomCenterAligned: number;

export declare const kHMInsideRightCenterAligned: number;

export declare const kHMOutsideBottomCenterAligned: number;

export declare const kHMOutsideTopCenterAligned: number;

export declare const kHMOutsideRightTopAligned: number;

export declare const kHMOutsideBottomRightAligned: number;

export declare const kHMOutsideBottomLeftAligned: number;

export declare const kHMOutsideTopRightAligned: number;

export declare const kHMOutsideTopLeftAligned: number;

export declare const kHMDefaultSide: number;

export declare const kHMStrResContent: number;

export declare const kHMTEHandleContent: number;

export declare const kAEGestalt: number;

export declare const kHMCFStringContent: number;

export declare const kHMNoContent: number;

export declare const kHMDisposeContent: number;

export declare const kHMSupplyContent: number;

export declare const kMacHelpVersion: number;

export declare const kTXNTextInputCountMask: number;

export declare const kTXNRunCountBit: number;

export declare const kTXNTextInputCountBit: number;

export declare const kTXNUndoLastAction: number;

export declare const kTXNFontVariationAction: number;

export declare const kControlEditTextSingleLineTag: number;

export declare const kTXNMoveAction: number;

export declare const kTXNAlignRightAction: number;

export declare const kTXNAlignCenterAction: number;

export declare const kTXNChangeStyleAction: number;

export declare const kTXNChangeFontAction: number;

export declare const kTXNClearAction: number;

export declare const kTXNCutAction: number;

export declare const kTXNTypingAction: number;

export declare const kTXNRestartAppleEventHandlersMask: number;

export declare const kTXNNoAppleEventHandlersMask: number;

export declare const kTXNNoAppleEventHandlersBit: number;

export declare const kTXNNoTSMEverBit: number;

export declare const kTXNDontDrawCaretWhenInactiveMask: number;

export declare const kTXNDontDrawCaretWhenInactiveBit: number;

export declare const kTXNDontDrawCaretWhenInactive: number;

export declare const kTXNImageWithQDMask: number;

export declare const kTXNUseQDforImagingBit: number;

export declare const kTXNQDFontColorAttributeSize: number;

export declare const kTXNQDFontStyleAttributeSize: number;

export declare const kControlBevelButtonMenuHandleTag: number;

export declare const kTXNQDFontFamilyIDAttributeSize: number;

export declare const kTXNQDFontStyleAttribute: number;

export declare const kTXNQDFontSizeAttribute: number;

export declare const kSRListenKeyMode: number;

export declare const kTXNQDFontNameAttribute: number;

export declare const kTXNTextEditStyleFrameType: number;

export declare const kTXNSupportFontCommandUpdating: number;

export declare const kTXNSupportSpellCheckCommandUpdating: number;

export declare const kTXNSupportEditCommandProcessing: number;

export declare const kTXNQuickTimeDocumentType: interop.Pointer;

export declare const kTXNMLTEDocumentType: interop.Pointer;

export declare const kTXNPlainTextDocumentType: interop.Pointer;

export declare const kTXNDataOptionCharacterEncodingKey: interop.Pointer;

export declare const kTXNDocumentAttributeCopyrightKey: interop.Pointer;

export declare const kTXNDocumentAttributeModificationTimeKey: interop.Pointer;

export declare const kTXNDocumentAttributeCommentKey: interop.Pointer;

export declare const kTXNDocumentAttributeAuthorKey: interop.Pointer;

export declare const kTXNDocumentAttributeSubjectKey: interop.Pointer;

export declare const kTXNDocumentAttributeCompanyNameKey: interop.Pointer;

export declare const kTXNDocumentAttributeTitleKey: interop.Pointer;

export declare const kTXNHorizontalScrollBarRectKey: number;

export declare const kTXNDestinationRectKey: number;

export declare const kTXNViewRectKey: number;

export declare const kTXNDrawItemAllMask: number;

export declare const kTXNDrawItemTextAndSelectionMask: number;

export declare const kTXNDrawItemTextMask: number;

export declare const kTXNScrollUnitsInLines: number;

export declare const pUseWideGrid: number;

export declare const kTXNScrollUnitsInPixels: number;

export declare const kTXNActionCountOfAllChanges: interop.Pointer;

export declare const kTXNBackgroundTypeRGB: number;

export declare const kTXNEntireWordMask: number;

export declare const kTXNIgnoreCaseMask: number;

export declare const kTXNUseEncodingWordRulesBit: number;

export declare const kTXNEntireWordBit: number;

export declare const kTXNIgnoreCaseBit: number;

export declare const kTXNATSUIStyleContinuousMask: number;

export declare const kTXNColorContinuousMask: number;

export declare const kTXNFontContinuousMask: number;

export declare const kTXNStyleContinuousBit: number;

export declare const kTXNUseScriptDefaultValue: number;

export declare const kTXNDecrementTypeSize: number;

export declare const kTXNIncrementTypeSize: number;

export declare const kTXNDontCareTypeSize: number;

export declare const kTXNATSUIStyleSize: number;

export declare const kTXNATSUIFontVariationsAttribute: number;

export declare const kTXNATSUIFontFeaturesAttribute: number;

export declare const kTXNTextEncodingAttribute: number;

export declare const kTXNLinkTracking: number;

export declare const kTXNMultipleStylesPerTextDocumentResType: number;

export declare const kTXNStartOffset: number;

export declare const kTXNUseCurrentSelection: number;

export declare const kTXNAutoScrollNever: number;

export declare const kTXNDisableLayoutAndDraw: number;

export declare const kTXNDisableDragAndDrop: number;

export declare const kTXNAutoIndentOn: number;

export declare const kTXNNoAutoWrap: number;

export declare const kTXNAutoWrap: number;

export declare const kTXNUseBottomline: number;

export declare const kTXNSelectionOff: number;

export declare const kTXNVisibilityTag: number;

export declare const enumPrefsButtonViewPanel: number;

export declare const kTXNUseCarbonEvents: number;

export declare const kTXNNoUserIOTag: number;

export declare const kTXNTabSettingsTag: number;

export declare const kTXNWordWrapStateTag: number;

export declare const kTXNSelectionStateTag: number;

export declare const kTXNForceFullJust: number;

export declare const kTXNFlushRight: number;

export declare const kTXNFlushLeft: number;

export declare const kTXNFlushDefault: number;

export declare const kTXNLeftToRight: number;

export declare const kTXNCenterTab: number;

export declare const kTXNLeftTab: number;

export declare const kTXNRightTab: number;

export declare const kTXNActionChangeTextPosition: interop.Pointer;

export declare const kTXNActionChangeFontFeature: interop.Pointer;

export declare const kTXNDontCareTypeStyle: number;

export declare const kTXNActionMove: interop.Pointer;

export declare const kTXNActionAlignCenter: interop.Pointer;

export declare const kTXNActionAlignLeft: interop.Pointer;

export declare const kTXNActionChangeStyle: interop.Pointer;

export declare const kTXNActionChangeSize: interop.Pointer;

export declare const kOSASelectStopRecording: number;

export declare const kTXNActionChangeFont: interop.Pointer;

export declare const kTXNActionCut: interop.Pointer;

export declare const kTXNActionTyping: interop.Pointer;

export declare const kTXNUnicodeTextData: number;

export declare const kTXNTextData: number;

export declare const kTXNSystemDefaultEncoding: number;

export declare const kTXNTextensionFile: number;

export declare const kTXNAIFFFile: number;

export declare const kTXNTextFile: number;

export declare const kTXNDoFontSubstitutionMask: number;

export declare const kTXNMonostyledTextMask: number;

export declare const kDataBrowserListViewLatestHeaderDesc: number;

export declare const kTXNDontDrawSelectionWhenInactiveMask: number;

export declare const pASPrintLength: number;

export declare const kTXNDoNotInstallDragProcsMask: number;

export declare const kOutputTextInUnicodeEncodingMask: number;

export declare const kTXNSaveStylesAsSTYLResourceMask: number;

export declare const kTXNReadOnlyMask: number;

export declare const kTXNWantVScrollBarMask: number;

export declare const cDesktopPrinter: number;

export declare const kTXNDrawGrowIconMask: number;

export declare const kTXNSingleLineOnlyBit: number;

export declare const kTXNDontDrawSelectionWhenInactiveBit: number;

export declare const kTXNAlwaysWrapAtViewEdgeBit: number;

export declare const kOutputTextInUnicodeEncodingBit: number;

export declare const kTXNNoSelectionBit: number;

export declare const kFontSelectionCoreTextType: number;

export declare const kTXNReadOnlyBit: number;

export declare const kTXNWantHScrollBarBit: number;

export declare const kTXNWillDefaultToCarbonEventBit: number;

export declare const kTXNWillDefaultToATSUIBit: number;

export declare const kTXNDisabledFunctionalityErr: number;

export declare const kScrapGetNamedScrap: number;

export declare const kScrapFlavorTypeUnicodeStyle: number;

export declare const kScrapFlavorTypeUnicode: number;

export declare const kScrapFlavorTypeSound: number;

export declare const kScrapFlavorTypeTextStyle: number;

export declare const kScrapFlavorTypeText: number;

export declare const kIMJaTypingMethodKana: number;

export declare const kIMJaTypingMethodProperty: number;

export declare const kTextServiceInputModePropertyTag: number;

export declare const kTextServiceJaTypingMethodPropertyTag: number;

export declare const kCMCopyTextServiceInputModeList: number;

export declare const kCMSetTextServiceProperty: number;

export declare const kCMGetTextServiceProperty: number;

export declare const kCMGetTextServiceMenu: number;

export declare const kCMTextServiceEventRef: number;

export declare const kCMTextServiceEvent: number;

export declare const kCMDeactivateTextService: number;

export declare const kCMTerminateTextService: number;

export declare const bTakeActiveEvent: number;

export declare const kNeutralScript: number;

export declare const kUnknownLanguage: number;

export declare const kTSMDocumentEnabledInputSourcesPropertyTag: number;

export declare const kASSelectGetAppTerminology: number;

export declare const kTSMDocumentInputSourceOverridePropertyTag: number;

export declare const cCoerceZenkakuhankaku: number;

export declare const kTSMDocumentWindowLevelPropertyTag: number;

export declare const kTSMDocumentInputModePropertyTag: number;

export declare const kTSMDocumentPropertyUnicodeInputWindow: number;

export declare const kTSMDocumentPropertySupportGlyphInfo: number;

export declare const kGSSSelectGetScriptingComponent: number;

export declare const kTSMDocumentSupportDocumentAccessPropertyTag: number;

export declare const kTSMDocumentUnicodeInputWindowPropertyTag: number;

export declare const kTSMDocumentUseFloatingWindowPropertyTag: number;

export declare const kTSMDocumentSupportGlyphInfoPropertyTag: number;

export declare const kTSMDocumentUnicodePropertyTag: number;

export declare const kOCRInputMethodClass: number;

export declare const kSpeechInputMethodClass: number;

export declare const kInkInputMethodClass: number;

export declare const kUnicodeDocumentInterfaceType: number;

export declare const kTSMTEDocumentInterfaceType: number;

export declare const kTSM24Version: number;

export declare const kTSM22Version: number;

export declare const kTSM20Version: number;

export declare const kAEUseStandardDispatch: number;

export declare const kAEIgnoreAppPhacHandler: number;

export declare const kDataBrowserEditMsgPaste: number;

export declare const kAEInteractWithAll: number;

export declare const kAEInteractWithSelf: number;

export declare const kStdAlertDoNotCloseOnHelp: number;

export declare const kStdAlertDoNotAnimateOnCancel: number;

export declare const kASGreaterThanOrEqual: number;

export declare const kStdAlertDoNotAnimateOnDefault: number;

export declare const kHICommandOther: number;

export declare const kDialogFontUseThemeFontIDMask: number;

export declare const kDialogFontAddToMetaFontMask: number;

export declare const kDialogFontAddFontSizeMask: number;

export declare const kDialogFontUseAllMask: number;

export declare const kDialogFontUseModeMask: number;

export declare const kDialogFontUseForeColorMask: number;

export declare const kDialogFontUseSizeMask: number;

export declare const kDialogFontUseFaceMask: number;

export declare const kDialogFontNoFontStyle: number;

export declare const kAlertFlagsUseCompositing: number;

export declare const kAlertFlagsUseThemeControls: number;

export declare const kAlertFlagsUseControlHierarchy: number;

export declare const kAlertFlagsUseThemeBackground: number;

export declare const kDialogFlagsUseCompositing: number;

export declare const kDialogFlagsUseThemeControls: number;

export declare const kDialogFlagsHandleMovableModal: number;

export declare const kDialogFlagsUseControlHierarchy: number;

export declare const kAlertStdAlertHelpButton: number;

export declare const kAlertStdAlertOtherButton: number;

export declare const kAlertStdAlertCancelButton: number;

export declare const kAlertStdAlertOKButton: number;

export declare const kAlertDefaultOtherText: number;

export declare const kAlertDefaultCancelText: number;

export declare const kAlertDefaultOKText: number;

export declare const kAlertCautionAlert: number;

export declare const kAlertNoteAlert: number;

export declare const kAlertStopAlert: number;

export declare const appendDITLRight: number;

export declare const noteIcon: number;

export declare const kControlIconSuiteNoTrackProc: number;

export declare const kCautionIcon: number;

export declare const cancel: number;

export declare const kStdCancelItemIndex: number;

export declare const kStdOkItemIndex: number;

export declare const itemDisable: number;

export declare const userItem: number;

export declare const iconItem: number;

export declare const resCtrl: number;

export declare const chkCtrl: number;

export declare const ctrlItem: number;

export declare const kHelpDialogItem: number;

export declare const kPictureDialogItem: number;

export declare const kEditTextDialogItem: number;

export declare const kStaticTextDialogItem: number;

export declare const kResourceControlDialogItem: number;

export declare const kCheckBoxDialogItem: number;

export declare const kEventAccessibleGetNamedActionDescription: number;

export declare const kEventAccessiblePerformNamedAction: number;

export declare const kEventAccessibleGetNamedAttribute: number;

export declare const kEventAccessibleGetAllParameterizedAttributeNames: number;

export declare const kTISPropertyInputSourceLanguages: interop.Pointer;

export declare const kEventAccessibleGetFocusedChild: number;

export declare const kEventAccessibleGetChildAtPoint: number;

export declare const kHITransformSelected: number;

export declare const kHITransformNone: number;

export declare const kHILayoutPositionRight: number;

export declare const kHILayoutPositionLeft: number;

export declare const kHILayoutPositionMax: number;

export declare const kHILayoutPositionCenter: number;

export declare const kHILayoutScaleAbsolute: number;

export declare const kHILayoutBindBottom: number;

export declare const kHILayoutBindRight: number;

export declare const kHILayoutBindMax: number;

export declare const kHIViewFocusOnAnyControl: number;

export declare const typeHIViewTrackingAreaRef: number;

export declare const kHIViewKindSignatureApple: number;

export declare const kHIViewContentNSImage: number;

export declare const kHIViewContentAlertIconType: number;

export declare const kHIViewContentImageResource: number;

export declare const kHIViewContentCGImageRef: number;

export declare const kHIViewContentIconRef: number;

export declare const kHIViewContentIconSuiteRef: number;

export declare const kHIViewContentTextOnly: number;

export declare const kHIViewFocusNextPart: number;

export declare const kHIViewClickableMetaPart: number;

export declare const kHIViewOpaqueMetaPart: number;

export declare const kHIViewStructureMetaPart: number;

export declare const kHIViewEntireView: number;

export declare const kHIViewDisabledPart: number;

export declare const kHIViewIndicatorPart: number;

export declare const kHIViewIgnoresClicks: number;

export declare const kHIViewIsOpaque: number;

export declare const kHIViewInvertsUpDownValueMeaning: number;

export declare const kHIViewIdlesWithTimer: number;

export declare const kHIViewAutoToggles: number;

export declare const kHIViewGetsFocusOnClick: number;

export declare const kHIViewFeatureIgnoresClicks: number;

export declare const kHIViewFeatureDoesNotDraw: number;

export declare const kHIViewFeatureInvertsUpDownValueMeaning: number;

export declare const kHIViewFeatureSupportsRadioBehavior: number;

export declare const kHIViewFeatureSupportsLiveFeedback: number;

export declare const kHIViewFeatureGetsFocusOnClick: number;

export declare const kHIViewFeatureAllowsSubviews: number;

export declare const kHIViewSendCommandToUserFocus: number;

export declare const kHIViewAttributeIsFieldEditor: number;

export declare const kHIViewAttributeSendCommandToUserFocus: number;

export declare const kThemeMetricProgressBarThickness: number;

export declare const kThemeMetricRadioButtonGlyphHeight: number;

export declare const kThemeMetricButtonRoundedHeight: number;

export declare const kThemeMetricSmallScrollBarMinThumbWidth: number;

export declare const kThemeMetricScrollBarMinThumbHeight: number;

export declare const kThemeMetricSliderMinThumbHeight: number;

export declare const kThemeMetricVSliderTickOffset: number;

export declare const kThemeMetricHSliderTickOffset: number;

export declare const kThemeMetricSmallPaneSplitterHeight: number;

export declare const kThemeMetricSmallTabOverlap: number;

export declare const kThemeMetricRoundTextFieldSmallContentInsetWithIconRight: number;

export declare const kThemeMetricRoundTextFieldMiniContentInsetWithIconLeft: number;

export declare const kThemeMetricRoundTextFieldMiniContentInsetTop: number;

export declare const kThemeMetricRoundTextFieldMiniContentInsetLeft: number;

export declare const kThemeMetricRoundTextFieldMiniContentInsetBottom: number;

export declare const kThemeMetricRoundTextFieldMiniContentHeight: number;

export declare const kThemeMetricRoundTextFieldContentInsetWithIconRight: number;

export declare const kThemeMetricMiniVSliderWidth: number;

export declare const kThemeMetricMiniVSliderTickWidth: number;

export declare const kThemeMetricMiniVSliderTickOffset: number;

export declare const kHIScrollViewPageLeft: number;

export declare const kThemeMetricMiniVSliderMinThumbHeight: number;

export declare const kThemeMetricMiniTabHeight: number;

export declare const kControlEditTextKeyScriptBehaviorTag: number;

export declare const kThemeMetricMiniTabCapsWidth: number;

export declare const kThemeMetricMiniRadioButtonWidth: number;

export declare const kThemeMetricMiniRadioButtonHeight: number;

export declare const kThemeMetricMiniPushButtonHeight: number;

export declare const kThemeMetricMiniPopupButtonHeight: number;

export declare const kThemeMetricMiniHSliderTickOffset: number;

export declare const kThemeMetricMiniHSliderTickHeight: number;

export declare const kThemeMetricMiniDisclosureButtonHeight: number;

export declare const kThemeMetricMiniCheckBoxWidth: number;

export declare const kThemeMetricMiniCheckBoxHeight: number;

export declare const kThemeMetricLittleArrowsSmallHeight: number;

export declare const kThemeMetricComboBoxMiniDisclosureWidth: number;

export declare const kThemeMetricComboBoxMiniBottomShadowOffset: number;

export declare const kThemeMetricComboBoxSmallDisclosureWidth: number;

export declare const kThemeMetricComboBoxLargeDisclosureWidth: number;

export declare const kThemeMetricComboBoxSmallRightShadowOffset: number;

export declare const kThemeMetricComboBoxSmallBottomShadowOffset: number;

export declare const kThemeMetricSmallVSliderTickOffset: number;

export declare const kThemeMetricSmallHSliderTickOffset: number;

export declare const kThemeMetricSmallVSliderWidth: number;

export declare const kThemeMetricLargeRoundButtonSize: number;

export declare const kControlPushButtonContentTag: number;

export declare const kThemeMetricRelevanceIndicatorHeight: number;

export declare const kThemeMetricSmallRadioButtonHeight: number;

export declare const kThemeMetricPaneSplitterHeight: number;

export declare const kThemeMetricSmallDisclosureButtonWidth: number;

export declare const kThemeMetricSmallDisclosureButtonHeight: number;

export declare const kThemeMetricDisclosureButtonWidth: number;

export declare const kThemeMetricDisclosureButtonHeight: number;

export declare const kThemeMetricMenuIconTrailingEdgeMargin: number;

export declare const kThemeMetricMenuTextLeadingEdgeMargin: number;

export declare const kThemeMetricMenuMarkIndent: number;

export declare const kThemeMetricSecondaryGroupBoxContentInset: number;

export declare const kThemeMetricPrimaryGroupBoxContentInset: number;

export declare const kThemeMetricSmallProgressBarShadowOutset: number;

export declare const IMKTextOrientationName: string;

export declare const kThemeMetricRadioButtonWidth: number;

export declare const kDataBrowserTableViewMinimalHilite: number;

export declare const kThemeMetricCheckBoxWidth: number;

export declare const kThemeMetricTitleBarControlsHeight: number;

export declare const kThemeMetricHSliderTickHeight: number;

export declare const kThemeMetricResizeControlHeight: number;

export declare const kThemeMetricPullDownHeight: number;

export declare const kThemeMetricLargeProgressBarThickness: number;

export declare const kThemeMetricSmallPopupButtonHeight: number;

export declare const kThemeMetricLittleArrowsWidth: number;

export declare const kThemeMetricPushButtonHeight: number;

export declare const kThemeMetricTabOverlap: number;

export declare const kThemeMetricLargeTabCapsWidth: number;

export declare const kThemeMetricImageWellThickness: number;

export declare const kThemeMetricEditTextFrameOutset: number;

export declare const kThemeMetricCheckBoxHeight: number;

export declare const kThemeMetricSmallScrollBarWidth: number;

export declare const kThemeMetricScrollBarWidth: number;

export declare const kTXNActionAlignRight: interop.Pointer;

export declare const kHIThemeFocusRingAbove: number;

export declare const kHIThemeTextBoxOptionNone: number;

export declare const kHIThemeTextVerticalFlushCenter: number;

export declare const kHIThemeTextVerticalFlushTop: number;

export declare const kHIThemeTextHorizontalFlushDefault: number;

export declare const kHIThemeTextHorizontalFlushRight: number;

export declare const kHIThemeTextHorizontalFlushLeft: number;

export declare const kHIThemeTextTruncationEnd: number;

export declare const kHIThemeTextTruncationMiddle: number;

export declare const kHIThemeTextTruncationNone: number;

export declare const kHIThemeSegmentAdornmentLeadingSeparator: number;

export declare const kHIThemeSegmentAdornmentFocus: number;

export declare const kHIThemeSegmentKindTextured: number;

export declare const kHIThemeSegmentKindNormal: number;

export declare const kHIThemeSegmentPositionLast: number;

export declare const kHIThemeSegmentPositionFirst: number;

export declare const kHIThemeTabPaneAdornmentNormal: number;

export declare const kHIThemeTabKindNormal: number;

export declare const kHIThemeTabPositionLast: number;

export declare const kAEKataHiragana: number;

export declare const kHIThemeTabSizeMini: number;

export declare const kHIThemeTabAdornmentTrailingSeparator: number;

export declare const kHIThemeTabAdornmentFocus: number;

export declare const kHIThemeMenuTitleDrawCondensed: number;

export declare const kHIThemeFrameTextFieldRoundSmall: number;

export declare const kHIThemeFrameTextFieldRound: number;

export declare const kHIThemeFrameListBox: number;

export declare const kHIThemeFrameTextFieldSquare: number;

export declare const kHIThemeHeaderKindWindow: number;

export declare const kHIThemeGroupBoxKindSecondaryOpaque: number;

export declare const kHIThemeGroupBoxKindSecondary: number;

export declare const kHIThemeGroupBoxKindPrimary: number;

export declare const kHIThemeGrowBoxKindNone: number;

export declare const kHIThemeGrowBoxKindNormal: number;

export declare const kHIThemeSplitterAdornmentMetal: number;

export declare const kHIThemeSplitterAdornmentNone: number;

export declare const kHIThemeOrientationInverted: number;

export declare const kEventTabletPointer: number;

export declare const kEventProcessCommand: number;

export declare const kEventGetSelectedText: number;

export declare const kEventShowHideBottomWindow: number;

export declare const kEventPosToOffset: number;

export declare const kEventUpdateActiveInputArea: number;

export declare const kEventHighLevelEvent: number;

export declare const kEventWindowDefDrawGrowBox: number;

export declare const kEventWindowDefMeasureTitle: number;

export declare const kEventWindowDefSetupProxyDragImage: number;

export declare const kEventWindowDefDispose: number;

export declare const kEventWindowDefInit: number;

export declare const kEventWindowDefHitTest: number;

export declare const kEventWindowDefGetRegion: number;

export declare const kEventWindowDefDrawFrame: number;

export declare const typeTabletPointerRec: number;

export declare const kEventParamTabletPointerRec: number;

export declare const kEventInkText: number;

export declare const kEventInkPoint: number;

export declare const kEventParamInkGestureHotspot: number;

export declare const kEventParamInkGestureBounds: number;

export declare const kEventParamInkKeyboardShortcut: number;

export declare const kHIHotKeyModeAllDisabledExceptUniversalAccess: number;

export declare const kEventHotKeyExclusive: number;

export declare const kEventHotKeyNoOptions: number;

export declare const kEventSystemUserSessionDeactivated: number;

export declare const kEventSystemUserSessionActivated: number;

export declare const kEventSystemDisplayReconfigured: number;

export declare const kEventSystemDisplaysAsleep: number;

export declare const kEventSystemTimeDateChanged: number;

export declare const kEventServicePerform: number;

export declare const kEventServicePaste: number;

export declare const kEventAppearanceScrollBarVariantChanged: number;

export declare const kSRPathFormat: number;

export declare const kEventControlAddedSubControl: number;

export declare const kEventControlValueFieldChanged: number;

export declare const kEventControlGetFrameMetrics: number;

export declare const kEventControlGetSizeConstraints: number;

export declare const kEventControlSetData: number;

export declare const kEventControlGetPartRegion: number;

export declare const kEventControlGetActionProcPart: number;

export declare const kSRNotificationParam: number;

export declare const kEventControlGhostingFinished: number;

export declare const kEventControlIndicatorMoved: number;

export declare const kEventControlTrack: number;

export declare const kEventControlContextualMenuClick: number;

export declare const kEventControlDeactivate: number;

export declare const kEventControlActivate: number;

export declare const kEventControlDragLeave: number;

export declare const kEventControlGetClickActivation: number;

export declare const kEventControlInterceptSubviewClick: number;

export declare const kEventControlGetAutoToggleValue: number;

export declare const kEventControlGetNextFocusCandidate: number;

export declare const kEventControlSimulateHit: number;

export declare const kEventControlInitialize: number;

export declare const kEventControlHit: number;

export declare const kHICommandFromControl: number;

export declare const kHICommandStartDictation: number;

export declare const kHICommandLearnWord: number;

export declare const kHICommandCheckSpellingAsYouType: number;

export declare const kHICommandChangeSpelling: number;

export declare const kHICommandCheckSpelling: number;

export declare const kHICommandShowSpellingPanel: number;

export declare const kHICommandShowCharacterPalette: number;

export declare const kHICommandPrint: number;

export declare const kHICommandSaveAs: number;

export declare const kHICommandCloseAll: number;

export declare const kDialogFontUseBackColorMask: number;

export declare const kHICommandNew: number;

export declare const kHICommandToggleFullScreen: number;

export declare const kHICommandRotateFloatingWindowsForward: number;

export declare const kHICommandRotateWindowsForward: number;

export declare const kHICommandWindowListSeparator: number;

export declare const kHICommandArrangeInFront: number;

export declare const kHICommandMaximizeAll: number;

export declare const kHICommandMaximizeWindow: number;

export declare const kHICommandMinimizeAll: number;

export declare const kHICommandMinimizeWindow: number;

export declare const kHICommandPreferences: number;

export declare const kHICommandShowAll: number;

export declare const kHICommandClear: number;

export declare const kHICommandCopy: number;

export declare const kHICommandUndo: number;

export declare const kHICommandQuitAndKeepWindows: number;

export declare const kHICommandQuit: number;

export declare const kHICommandCancel: number;

export declare const kHICommandOK: number;

export declare const kEventMenuBarHidden: number;

export declare const kThemeMetricTabFrameOverlap: number;

export declare const kEventMenuCeaseToBeScrollable: number;

export declare const kEventMenuCalculateSize: number;

export declare const kEventMenuDrawItem: number;

export declare const kEventMenuMeasureItemHeight: number;

export declare const kEventMenuMeasureItemWidth: number;

export declare const kEventMenuPopulate: number;

export declare const kEventMenuMatchKey: number;

export declare const kEventMenuClosed: number;

export declare const kEventMenuEndTracking: number;

export declare const kEventMenuBeginTracking: number;

export declare const kHIMenuCenterDirection: number;

export declare const kHIMenuLeftDirection: number;

export declare const kHIMenuRightDirection: number;

export declare const kMenuContextDontUpdateIcon: number;

export declare const kMenuContextDontUpdateText: number;

export declare const kMenuContextContextualMenu: number;

export declare const kHIViewContentNone: number;

export declare const kMenuContextCommandIDSearch: number;

export declare const kMenuContextKeyMatching: number;

export declare const kMenuContextMenuBarTracking: number;

export declare const kMenuContextSubmenu: number;

export declare const kEventWindowFullScreenExitCompleted: number;

export declare const kEventWindowGetGrowImageRegion: number;

export declare const kEventWindowDrawGrowBox: number;

export declare const kEventWindowMeasureTitle: number;

export declare const kEventWindowStateChanged: number;

export declare const kEventWindowSetupProxyDragImage: number;

export declare const kEventWindowModified: number;

export declare const kEventWindowDragHilite: number;

export declare const kEventWindowDispose: number;

export declare const kEventWindowHitTest: number;

export declare const kEventWindowGetRegion: number;

export declare const kEventWindowDrawFrame: number;

export declare const kEventWindowDrawerClosed: number;

export declare const kEventWindowDrawerOpening: number;

export declare const kEventWindowSheetClosed: number;

export declare const kEventWindowSheetOpening: number;

export declare const kEventWindowFocusToolbar: number;

export declare const kEventWindowFocusContent: number;

export declare const kEventWindowFocusRestored: number;

export declare const kEventWindowFocusRelinquish: number;

export declare const kEventWindowProxyEndDrag: number;

export declare const kEventWindowGetMinimumSize: number;

export declare const kEventWindowGetIdealSize: number;

export declare const kEventWindowPathSelect: number;

export declare const kEventWindowExpand: number;

export declare const kEventWindowCollapseAll: number;

export declare const kASAdd: number;

export declare const kEventWindowCollapse: number;

export declare const kEventWindowTransitionCompleted: number;

export declare const kEventWindowClosed: number;

export declare const kEventWindowDragCompleted: number;

export declare const kEventWindowDragStarted: number;

export declare const kEventWindowResizeStarted: number;

export declare const kEventWindowBoundsChanged: number;

export declare const kEventWindowBoundsChanging: number;

export declare const kEventWindowZoomed: number;

export declare const kEventWindowExpanded: number;

export declare const kEventWindowExpanding: number;

export declare const kEventWindowHidden: number;

export declare const kEventWindowShown: number;

export declare const kWindowBoundsChangeZoom: number;

export declare const kWindowBoundsChangeOriginChanged: number;

export declare const kWindowBoundsChangeSizeChanged: number;

export declare const kWindowBoundsChangeUserResize: number;

export declare const kWindowBoundsChangeUserDrag: number;

export declare const kEventWindowGetClickModality: number;

export declare const kEventParamWindowModality: number;

export declare const kTISPropertyInputSourceID: interop.Pointer;

export declare const kEventParamModalClickResult: number;

export declare const typeModalClickResult: number;

export declare const kHIModalClickAnnounce: number;

export declare const kEventWindowHandleDeactivate: number;

export declare const kEventWindowHandleActivate: number;

export declare const kEventWindowDeactivated: number;

export declare const kEventAppleEvent: number;

export declare const kEventAppFocusNextDocumentWindow: number;

export declare const kEventAppUpdateDockTile: number;

export declare const kEventAppActiveWindowChanged: number;

export declare const kAvailBoundsChangedForDock: number;

export declare const cEntireContents: number;

export declare const kEventAppShown: number;

export declare const kEventAppHidden: number;

export declare const kEventAppLaunchNotification: number;

export declare const kEventAppDeactivated: number;

export declare const kEventAppActivated: number;

export declare const kEventKeyModifierFnMask: number;

export declare const kEventKeyModifierNumLockMask: number;

export declare const kEventHotKeyPressed: number;

export declare const kEventRawKeyUp: number;

export declare const kEventTextInputIsMouseEventInInlineInputArea: number;

export declare const kEventTextInputUnicodeText: number;

export declare const kEventTextInputShowHideBottomWindow: number;

export declare const kEventTextInputPosToOffset: number;

export declare const kEventTextInputOffsetToPos: number;

export declare const kEventTextInputUnicodeForKeyEvent: number;

export declare const kEventTSMDocumentAccessGetFirstRectForRange: number;

export declare const kTSMDocAccessFontSizeAttribute: number;

export declare const kTSMDocAccessEffectiveRangeAttributeBit: number;

export declare const kEventTSMDocumentAccessGetCharactersPtr: number;

export declare const kEventTSMDocumentAccessGetLength: number;

export declare const kEventGestureSwipe: number;

export declare const kEventGestureMagnify: number;

export declare const kTXNRTFDocumentType: interop.Pointer;

export declare const kEventMouseScroll: number;

export declare const kEventMouseExited: number;

export declare const kEventMouseDragged: number;

export declare const kEventMouseMoved: number;

export declare const kEventMouseUp: number;

export declare const kEventMouseWheelAxisY: number;

export declare const kEventMouseWheelAxisX: number;

export declare const kEventMouseButtonSecondary: number;

export declare const kSRCantGetProperty: number;

export declare const kEventClassTSMDocumentAccess: number;

export declare const kEventClassAccessibility: number;

export declare const kEventClassToolbarItem: number;

export declare const kEventControlGetFocusPart: number;

export declare const kEventClassService: number;

export declare const kEventClassAppearance: number;

export declare const kEventClassCommand: number;

export declare const kEventClassControl: number;

export declare const kEventClassWindow: number;

export declare const kEventClassAppleEvent: number;

export declare const kEventClassKeyboard: number;

export declare const kEventClassMouse: number;

export declare const kMouseParamsClickAndHold: number;

export declare const kTrackMouseLocationOptionIncludeScrollWheel: number;

export declare const kMouseTrackingUserCancelled: number;

export declare const kMouseTrackingKeyModifiersChanged: number;

export declare const enumStationery: number;

export declare const pFileCreator: number;

export declare const kMouseTrackingMouseDragged: number;

export declare const kMouseTrackingMouseUp: number;

export declare const kEventParamAppleEventReply: number;

export declare const kEventParamAppleEvent: number;

export declare const kEventParamAccessibleActionDescription: number;

export declare const kEventParamAccessibleActionNames: number;

export declare const kEventParamAccessibleActionName: number;

export declare const kEventParamAccessibleAttributeValue: number;

export declare const kEventParamAccessibleAttributeNames: number;

export declare const kEventParamServiceUserData: number;

export declare const kEventParamServiceMessageName: number;

export declare const kEventParamServicePasteTypes: number;

export declare const kEventParamPasteboardRef: number;

export declare const typeTabletProximityRec: number;

export declare const kThemeMetricSmallPushButtonHeight: number;

export declare const typeTabletPointRec: number;

export declare const kEventParamPreviousWindow: number;

export declare const kEventParamIsInInstantMouser: number;

export declare const kEventParamSystemUIOptions: number;

export declare const kEventParamSystemUIMode: number;

export declare const kEventParamLaunchErr: number;

export declare const kEventParamLaunchRefCon: number;

export declare const typeThemeMenuType: number;

export declare const typeMenuDirection: number;

export declare const typeThemeMenuItemType: number;

export declare const typeThemeMenuState: number;

export declare const typeMenuTrackingMode: number;

export declare const typeMenuCommand: number;

export declare const kEventParamMenuContextHeight: number;

export declare const kEventParamMenuDirection: number;

export declare const kEventParamMenuIsPopup: number;

export declare const kEventParamMenuFrameView: number;

export declare const kEventParamMenuItemHeight: number;

export declare const kEventParamMenuDrawState: number;

export declare const kEventParamMenuVirtualBottom: number;

export declare const kEventParamMenuVirtualTop: number;

export declare const kEventParamMenuTextBaseline: number;

export declare const kEventParamMenuTextBounds: number;

export declare const kEventParamMenuItemBounds: number;

export declare const kEventParamMenuDismissed: number;

export declare const kEventParamMenuContext: number;

export declare const kEventParamMenuItemIndex: number;

export declare const kHILayoutPositionBottom: number;

export declare const kEventParamNewMenuTrackingMode: number;

export declare const kThemeMetricMenuTextTrailingEdgeMargin: number;

export declare const kEventParamCurrentMenuTrackingMode: number;

export declare const typeControlPartCode: number;

export declare const typeControlActionUPP: number;

export declare const kEventParamControlPrefersShape: number;

export declare const kEventParamControlPartAutoRepeats: number;

export declare const kEventParamControlHit: number;

export declare const kEventParamControlInvalRgn: number;

export declare const kEventParamControlCurrentPart: number;

export declare const kEventParamControlSubview: number;

export declare const kEventParamNextControl: number;

export declare const kEventParamControlFocusEverything: number;

export declare const kEventParamControlCurrentOwningWindow: number;

export declare const kEventParamControlOriginalOwningWindow: number;

export declare const kEventParamControlPartBounds: number;

export declare const kEventParamControlFeatures: number;

export declare const kEventParamControlDrawEngraved: number;

export declare const kEventParamControlDrawInColor: number;

export declare const kEventParamControlDataBufferSize: number;

export declare const kControlPopupArrowOrientationSouth: number;

export declare const kEventParamControlDataTag: number;

export declare const kEventParamControlOptimalBaselineOffset: number;

export declare const kEventParamControlSubControl: number;

export declare const kEventParamControlClickActivationResult: number;

export declare const kEventParamControlIndicatorOffset: number;

export declare const kEventParamControlIndicatorRegion: number;

export declare const kEventParamControlIndicatorDragConstraint: number;

export declare const kEventParamControlRegion: number;

export declare const kEventParamControlResult: number;

export declare const kEventParamInitCollection: number;

export declare const kEventParamControlPart: number;

export declare const typeWindowTransitionEffect: number;

export declare const typeWindowTransitionAction: number;

export declare const typeWindowPartCode: number;

export declare const typeWindowRegionCode: number;

export declare const kEventParamWindowTransitionEffect: number;

export declare const kEventParamWindowTransitionAction: number;

export declare const kEventParamCurrentDockDevice: number;

export declare const kEventParamWindowGrowRect: number;

export declare const kSRBlockBackground: number;

export declare const kEventParamWindowTitleTextWidth: number;

export declare const kEventParamWindowTitleFullWidth: number;

export declare const kEventParamWindowStateChangedFlags: number;

export declare const kEventParamWindowProxyOutlineRgn: number;

export declare const kOSASelectMakeContext: number;

export declare const kEventParamWindowProxyGWorldPtr: number;

export declare const kEventParamWindowDragHiliteFlag: number;

export declare const kEventParamWindowRegionCode: number;

export declare const kEventParamClickActivation: number;

export declare const kEventParamPreviousBounds: number;

export declare const kEventParamOriginalBounds: number;

export declare const kEventParamWindowFeatures: number;

export declare const typeHICommand: number;

export declare const kEventParamHICommand: number;

export declare const typeATSFontRef: number;

export declare const kEventParamTSMDocAccessBaselineDelta: number;

export declare const kEventParamTSMDocAccessLineBounds: number;

export declare const kEventParamTSMDocAccessReplyATSUGlyphSelector: number;

export declare const kEventParamTSMDocAccessReplyCTGlyphInfoRef: number;

export declare const pGroup: number;

export declare const kEventParamTSMDocAccessReplyATSFont: number;

export declare const kEventParamTSMDocAccessReplyCTFontRef: number;

export declare const kEventParamTSMDocAccessRequestedCharacterAttributes: number;

export declare const kEventParamTSMDocAccessSendCharactersPtr: number;

export declare const kEventParamTSMDocAccessSendCharacterRange: number;

export declare const kEventParamTSMDocAccessSendCharacterIndex: number;

export declare const kEventParamTSMDocAccessSendComponentInstance: number;

export declare const kEventParamTSMDocAccessSendRefCon: number;

export declare const kEventParamTextInputSendReplaceRange: number;

export declare const kEventParamTextInputReplyGlyphInfoArray: number;

export declare const kEventParamTextInputSendGlyphInfoArray: number;

export declare const kEventParamTextInputGlyphInfoArray: number;

export declare const kEventParamTextInputSendTextServiceMacEncoding: number;

export declare const kSRPathType: number;

export declare const kEventParamTextInputSendKeyboardEvent: number;

export declare const kEventParamTextInputSendShowHide: number;

export declare const kEventParamTextInputReplyCTFontRef: number;

export declare const kEventParamTextInputReplyFont: number;

export declare const kEventParamTextInputSendDraggingMode: number;

export declare const kEventParamTextInputSendCurrentPoint: number;

export declare const kEventParamTextInputReplyRegionClass: number;

export declare const kEventParamTextInputReplyTextOffset: number;

export declare const kEventParamTextInputSendTextOffset: number;

export declare const kEventParamTextInputReplyLeadingEdge: number;

export declare const kEventParamTextInputSendLeadingEdge: number;

export declare const kEventParamTextInputSendHiliteRng: number;

export declare const kEventParamTextInputReplyAttributedString: number;

export declare const kEventParamTextInputSendAttributedString: number;

export declare const kEventParamTextInputReplySLRec: number;

export declare const kEventParamTextInputSendRefCon: number;

export declare const kEventParamTSMSendComponentInstance: number;

export declare const kEventParamKeyModifiers: number;

export declare const kEventParamKeyMacCharCodes: number;

export declare const kEventParamRotationAmount: number;

export declare const kEventParamMagnificationAmount: number;

export declare const typeMouseTrackingRef: number;

export declare const typeMouseWheelAxis: number;

export declare const typeMouseButton: number;

export declare const kEventParamTabletEventType: number;

export declare const kEventParamMouseDelta: number;

export declare const kEventParamDirectionInverted: number;

export declare const kEventParamMouseWheelSmoothHorizontalDelta: number;

export declare const kEventParamMouseWheelSmoothVerticalDelta: number;

export declare const kEventParamClickCount: number;

export declare const kEventParamMouseButton: number;

export declare const kEventParamWindowMouseLocation: number;

export declare const typeSignedByteOffset: number;

export declare const typeSignedByteCount: number;

export declare const typeRefCon: number;

export declare const typeCGDisplayChangeFlags: number;

export declare const typeCGFloatScreenPixel: number;

export declare const typeHIRectScreenPixel: number;

export declare const typeHIRect72DPIGlobal: number;

export declare const typeHISizeScreenPixel: number;

export declare const typeGDHandle: number;

export declare const typeHIShapeRef: number;

export declare const typeHIRect: number;

export declare const typeHISize: number;

export declare const typeHIPoint: number;

export declare const typeCGImageRef: number;

export declare const typeCGContextRef: number;

export declare const typeCFIndex: number;

export declare const typeOSStatus: number;

export declare const typeCollection: number;

export declare const typeControlRef: number;

export declare const typeGWorldPtr: number;

export declare const typeGrafPtr: number;

export declare const typeWindowRef: number;

export declare const kEventParamShape: number;

export declare const kEventParamUserData: number;

export declare const kEventParamIndex: number;

export declare const kEventParamDisplayDevice: number;

export declare const kEventParamReason: number;

export declare const kEventParamMinimumSize: number;

export declare const kEventParamMutableArray: number;

export declare const kEventParamDeviceDepth: number;

export declare const kEventParamCGContextRef: number;

export declare const kEventParamAEEventClass: number;

export declare const kEventParamAEEventID: number;

export declare const kEventParamAvailableBounds: number;

export declare const kEventParamRgnHandle: number;

export declare const kEventParamControlRef: number;

export declare const kEventParamMenuRef: number;

export declare const kEventParamWindowRef: number;

export declare const typeEventTargetOptions: number;

export declare const typeEventTargetRef: number;

export declare const kEventParamPostTarget: number;

export declare const kWindowGroupAttrZOrderFixed: number;

export declare const kWindowGroupAttrPositionFixed: number;

export declare const kWindowGroupAttrSelectable: number;

export declare const kWindowPaintProcOptionsNone: number;

export declare const kStoredWindowPascalTitleID: number;

export declare const kStoredWindowSystemTag: number;

export declare const wTitleBarColor: number;

export declare const wFrameColor: number;

export declare const wContentColor: number;

export declare const kHIThemeTextTruncationDefault: number;

export declare const deskPatID: number;

export declare const wDrawGIcon: number;

export declare const wCalcRgns: number;

export declare const wHit: number;

export declare const kWindowMsgGetGrowImageRegion: number;

export declare const kWindowMsgSetupProxyDragImage: number;

export declare const kWindowMsgDrawInCurrentPort: number;

export declare const kWindowMsgGetRegion: number;

export declare const kEventWindowFocusDrawer: number;

export declare const kWindowMsgGetFeatures: number;

export declare const kWindowMsgDrawGrowOutline: number;

export declare const kHIWindowScaleModeFrameworkScaled: number;

export declare const kHIWindowScaleModeUnscaled: number;

export declare const kHIToolbarViewDrawBackgroundTag: number;

export declare const kWindowDrawerClosed: number;

export declare const kWindowDrawerClosing: number;

export declare const kWindowDrawerOpening: number;

export declare const kWindowEdgeDefault: number;

export declare const kHIWindowExposeHidden: number;

export declare const kHIWindowMoveToActiveSpace: number;

export declare const kHIWindowCanJoinAllSpaces: number;

export declare const kWindowLatentVisibleCollapsedGroup: number;

export declare const kWindowLatentVisibleCollapsedOwner: number;

export declare const kWindowLatentVisibleAppHidden: number;

export declare const kWindowLatentVisibleFullScreen: number;

export declare const kWindowLatentVisibleFloater: number;

export declare const kWindowConstrainStandardOptions: number;

export declare const kAEInterceptOpen: number;

export declare const kWindowConstrainCalcOnly: number;

export declare const kWindowConstrainMoveRegardlessOfFit: number;

export declare const kWindowConstrainMayResize: number;

export declare const kWindowMoveTransitionAction: number;

export declare const kTSMVersion: number;

export declare const kWindowShowTransitionAction: number;

export declare const kWindowGenieTransitionEffect: number;

export declare const kWindowSlideTransitionEffect: number;

export declare const kWindowZoomTransitionEffect: number;

export declare const kHIWindowMenuWindowTag: number;

export declare const kHIWindowMenuCreator: number;

export declare const kWindowMenuIncludeRotate: number;

export declare const kEventParamMouseLocation: number;

export declare const kScrollWindowInvalidate: number;

export declare const kScrollWindowNoOptions: number;

export declare const kHIWindowDepth64Bit: number;

export declare const kHIWindowDepth32Bit: number;

export declare const kWindowGroupLevelInactive: number;

export declare const kWindowGroupLevelActive: number;

export declare const kWindowGroupContentsVisible: number;

export declare const kWindowGroupContentsReturnWindows: number;

export declare const kPreviousWindowGroup: number;

export declare const kNextWindowGroup: number;

export declare const kWindowGroupAttrFixedLevel: number;

export declare const kWindowGroupAttrMoveTogether: number;

export declare const kWindowModalityWindowModal: number;

export declare const kWindowModalityAppModal: number;

export declare const kWindowModalityNone: number;

export declare const kHIWindowSharingReadOnly: number;

export declare const kWindowDefObjectClass: number;

export declare const kWindowDefProcPtr: number;

export declare const kMouseUpOutOfSlop: number;

export declare const kWindowDefSupportsColorGrafPort: number;

export declare const kWindowSupportsGetGrowImageRegion: number;

export declare const kWindowCanMeasureTitle: number;

export declare const kWindowCanSetupProxyDragImage: number;

export declare const kWindowCanDrawInCurrentPort: number;

export declare const kWindowSupportsDragHilite: number;

export declare const kWindowIsAlert: number;

export declare const kWindowCanGetWindowRegion: number;

export declare const kWindowIsModal: number;

export declare const wInProxyIcon: number;

export declare const wInCollapseBox: number;

export declare const wInZoomIn: number;

export declare const wInGoAway: number;

export declare const wInGrow: number;

export declare const wNoHit: number;

export declare const inToolbarButton: number;

export declare const inCollapseBox: number;

export declare const inZoomOut: number;

export declare const inZoomIn: number;

export declare const inGoAway: number;

export declare const inGrow: number;

export declare const kHIThemeTabAdornmentLeadingSeparator: number;

export declare const inDrag: number;

export declare const inMenuBar: number;

export declare const inDesk: number;

export declare const kApplicationWindowKind: number;

export declare const kDialogWindowKind: number;

export declare const dialogKind: number;

export declare const kWindowToolbarButtonRgn: number;

export declare const kWindowGlobalPortRgn: number;

export declare const kWindowUpdateRgn: number;

export declare const kWindowContentRgn: number;

export declare const kDataBrowserOrderIncreasing: number;

export declare const kWindowStructureRgn: number;

export declare const kWindowTitleProxyIconRgn: number;

export declare const kWindowCollapseBoxRgn: number;

export declare const kWindowGrowRgn: number;

export declare const kWindowZoomBoxRgn: number;

export declare const kWindowCloseBoxRgn: number;

export declare const kWindowTitleTextRgn: number;

export declare const kWindowTitleBarRgn: number;

export declare const kWindowAlertPositionOnMainScreen: number;

export declare const kWindowCascadeOnParentWindowScreen: number;

export declare const kWindowCascadeOnMainScreen: number;

export declare const kWindowCenterOnParentWindow: number;

export declare const kWindowCenterOnMainScreen: number;

export declare const kWindowStaggerParentWindowScreen: number;

export declare const kWindowAlertPositionParentWindowScreen: number;

export declare const kEventWindowHiding: number;

export declare const kWindowCenterParentWindowScreen: number;

export declare const kWindowStaggerMainScreen: number;

export declare const kWindowDefaultPosition: number;

export declare const kWindowSheetProc: number;

export declare const kWindowFloatSideFullZoomGrowProc: number;

export declare const kWindowFloatSideHorizZoomGrowProc: number;

export declare const kWindowFloatSideHorizZoomProc: number;

export declare const kWindowFloatSideVertZoomProc: number;

export declare const kWindowFloatSideGrowProc: number;

export declare const kControlBevelButtonNormalBevel: number;

export declare const kWindowFloatSideProc: number;

export declare const kWindowFloatFullZoomGrowProc: number;

export declare const kWindowFloatFullZoomProc: number;

export declare const kWindowFloatVertZoomProc: number;

export declare const kWindowFloatGrowProc: number;

export declare const kWindowFloatProc: number;

export declare const kWindowMovableModalGrowProc: number;

export declare const kWindowMovableAlertProc: number;

export declare const kWindowAlertProc: number;

export declare const kWindowMovableModalDialogProc: number;

export declare const kWindowShadowDialogProc: number;

export declare const kWindowVertZoomDocumentProc: number;

export declare const kWindowGrowDocumentProc: number;

export declare const kWindowSheetDefProcResID: number;

export declare const kWindowUtilitySideTitleDefProcResID: number;

export declare const kWindowUtilityDefProcResID: number;

export declare const kWindowDocumentDefProcResID: number;

export declare const floatSideZoomGrowProc: number;

export declare const floatSideZoomProc: number;

export declare const floatSideProc: number;

export declare const floatZoomGrowProc: number;

export declare const floatZoomProc: number;

export declare const floatGrowProc: number;

export declare const floatProc: number;

export declare const zoomNoGrow: number;

export declare const zoomDocProc: number;

export declare const movableDBoxProc: number;

export declare const noGrowDocProc: number;

export declare const kTXNShowWindowBit: number;

export declare const plainDBox: number;

export declare const dBoxProc: number;

export declare const documentProc: number;

export declare const kMovableAlertVariantCode: number;

export declare const kMovableModalDialogVariantCode: number;

export declare const kShadowDialogVariantCode: number;

export declare const kPlainDialogVariantCode: number;

export declare const kDocumentWindowVariantCode: number;

export declare const kFloatingWindowDefinition: number;

export declare const kRoundWindowDefinition: number;

export declare const kStandardWindowDefinition: number;

export declare const kWindowDefProcType: number;

export declare const kWindowFrameworkScaledAttribute: number;

export declare const kASQuotient: number;

export declare const kWindowNoConstrainAttribute: number;

export declare const kWindowHighResolutionCapableAttribute: number;

export declare const kWindowIgnoreClicksAttribute: number;

export declare const kWindowInWindowMenuAttribute: number;

export declare const kWindowHideOnSuspendAttribute: number;

export declare const kWindowNoShadowAttribute: number;

export declare const kWindowCompositingAttribute: number;

export declare const kWindowOpaqueForEventsAttribute: number;

export declare const kWindowNoUpdatesAttribute: number;

export declare const kWindowMetalNoContentSeparatorAttribute: number;

export declare const kWindowTexturedSquareCornersAttribute: number;

export declare const kWindowNoTitleBarAttribute: number;

export declare const kWindowToolbarButtonAttribute: number;

export declare const kWindowResizableAttribute: number;

export declare const kWindowCollapseBoxAttribute: number;

export declare const kWindowCloseBoxAttribute: number;

export declare const kWindowNoAttributes: number;

export declare const kHIWindowBitDoesNotHide: number;

export declare const kHIWindowBitIgnoreClicks: number;

export declare const kHIWindowBitLiveResize: number;

export declare const kTXNColorContinuousBit: number;

export declare const kHIWindowBitHideOnSuspend: number;

export declare const kHIWindowBitAsyncDrag: number;

export declare const pShowFolderSize: number;

export declare const kHIWindowBitCanBeVisibleWithoutLogin: number;

export declare const kHIWindowBitHighResolutionCapable: number;

export declare const kEventTabletPoint: number;

export declare const kHIWindowBitOpaqueForEvents: number;

export declare const kHIWindowBitNoActivates: number;

export declare const kHIWindowBitNoUpdates: number;

export declare const kControlWindowHeaderProc: number;

export declare const kHIWindowBitNoTexturedContentSeparator: number;

export declare const kHIWindowBitTexturedSquareCorners: number;

export declare const kHIWindowBitNoTitleBar: number;

export declare const kHIWindowBitTextured: number;

export declare const kHIWindowBitToolbarButton: number;

export declare const kHIWindowBitSideTitlebar: number;

export declare const kHIWindowBitCollapseBox: number;

export declare const kHIWindowBitZoomBox: number;

export declare const kHIWindowBitCloseBox: number;

export declare const kAllWindowClasses: number;

export declare const kSimpleWindowClass: number;

export declare const kSheetAlertWindowClass: number;

export declare const kOverlayWindowClass: number;

export declare const kPlainWindowClass: number;

export declare const kToolbarWindowClass: number;

export declare const kHelpWindowClass: number;

export declare const kUtilityWindowClass: number;

export declare const kFloatingWindowClass: number;

export declare const kControlDisclosureTrianglePointRight: number;

export declare const kMovableModalWindowClass: number;

export declare const kMovableAlertWindowClass: number;

export declare const kAlertWindowClass: number;

export declare const kDragTrackingLeaveControl: number;

export declare const kDragTrackingInControl: number;

export declare const kDragTrackingEnterControl: number;

export declare const kControlSizeSmall: number;

export declare const kControlSizeNormal: number;

export declare const kControlIdlesWithTimer: number;

export declare const kControlSupportsClickActivation: number;

export declare const kControlSupportsContextualMenus: number;

export declare const kControlSupportsSetCursor: number;

export declare const kControlSupportsGetRegion: number;

export declare const kControlSupportsDragAndDrop: number;

export declare const kControlHasRadioBehavior: number;

export declare const kTXNFontSizeAttributeSize: number;

export declare const kControlSupportsLiveFeedback: number;

export declare const kControlGetsFocusOnClick: number;

export declare const kControlHasSpecialBackground: number;

export declare const kControlSupportsDataAccess: number;

export declare const kControlHandlesTracking: number;

export declare const kControlSupportsGhosting: number;

export declare const kControlThemeTextInfoTag: number;

export declare const kEventTSMDocumentAccessUnlockDocument: number;

export declare const kControlThemeTextHorizontalFlushTag: number;

export declare const kControlThemeTextFontTag: number;

export declare const kControlContentTag: number;

export declare const kControlSizeTag: number;

export declare const kControlKindTag: number;

export declare const kControlKeyFilterTag: number;

export declare const kControlFontStyleTag: number;

export declare const kControlUseThemeFontIDMask: number;

export declare const kControlAddFontSizeMask: number;

export declare const kControlUseModeMask: number;

export declare const kControlUseBackColorMask: number;

export declare const kControlUseForeColorMask: number;

export declare const kControlFontMiniSystemFont: number;

export declare const kControlFontViewSystemFont: number;

export declare const kControlFontBigSystemFont: number;

export declare const kTXNMarginsTag: number;

export declare const kControlKeyScriptBehaviorPrefersRoman: number;

export declare const kControlContentCGImageRef: number;

export declare const kControlContentPictHandle: number;

export declare const kControlContentCIconHandle: number;

export declare const kControlContentIconSuiteHandle: number;

export declare const kControlContentAlertIconRes: number;

export declare const kControlContentPictRes: number;

export declare const kControlContentCIconRes: number;

export declare const kControlContentIconSuiteRes: number;

export declare const kEventHotKeyReleased: number;

export declare const kControlNoContent: number;

export declare const errFinderCannotPutAway: number;

export declare const kControlContentTextOnly: number;

export declare const kControlCollectionTagVarCode: number;

export declare const kControlCollectionTagIDSignature: number;

export declare const kControlCollectionTagTitle: number;

export declare const kControlCollectionTagRefCon: number;

export declare const kControlCollectionTagViewSize: number;

export declare const kControlCollectionTagMaximum: number;

export declare const kControlFocusPrevPart: number;

export declare const kControlFocusNoPart: number;

export declare const kControlContentMetaPart: number;

export declare const kControlStructureMetaPart: number;

export declare const kControlEntireControl: number;

export declare const kNumberCtlCTabEntries: number;

export declare const cBodyColor: number;

export declare const cFrameColor: number;

export declare const kControlColorTableResourceType: number;

export declare const kDragStandardDropLocationTrash: number;

export declare const kZoomAccelerate: number;

export declare const kZoomNoAcceleration: number;

export declare const kDragRegionHide: number;

export declare const kDragRegionDraw: number;

export declare const kDragRegionBegin: number;

export declare const kDragTrackingLeaveWindow: number;

export declare const kDragTrackingInWindow: number;

export declare const kDragTrackingEnterHandler: number;

export declare const kDragPseudoFileTypeDirectory: number;

export declare const kDragPseudoFileTypeVolume: number;

export declare const kDragPromisedFlavor: number;

export declare const kDragPromisedFlavorFindFile: number;

export declare const flavorTypePromiseHFS: number;

export declare const flavorTypeHFS: number;

export declare const kDragFlavorTypePromiseHFS: number;

export declare const kDragActionAll: number;

export declare const kDragActionDelete: number;

export declare const kDragActionMove: number;

export declare const kDragActionPrivate: number;

export declare const kDragActionCopy: number;

export declare const kDragActionNothing: number;

export declare const kFlavorTypeDragToTrashOnly: number;

export declare const kFlavorTypeUnicodeClippingName: number;

export declare const keyOSADialectName: number;

export declare const kFlavorTypeClippingFilename: number;

export declare const kFlavorTypeClippingName: number;

export declare const flavorDataPromised: number;

export declare const flavorNotSaved: number;

export declare const flavorSenderTranslated: number;

export declare const flavorSenderOnly: number;

export declare const kDragDarkTranslucency: number;

export declare const kDragHasLeftSenderWindow: number;

export declare const teFUseTextServices: number;

export declare const teHighlight: number;

export declare const teFind: number;

export declare const teFromRecal: number;

export declare const teFromFind: number;

export declare const teWordDrag: number;

export declare const teBitTest: number;

export declare const teFInlineInputAutoScroll: number;

export declare const teFUseInlineInput: number;

export declare const teFUseWhiteBackground: number;

export declare const teFTextBuffering: number;

export declare const teFAutoScroll: number;

export declare const intInlineInputTSMTEPreUpdateHook: number;

export declare const intTextWidthHook: number;

export declare const keyASArg: number;

export declare const intWidthHook: number;

export declare const intDrawHook: number;

export declare const TextWidthHook: number;

export declare const nWIDTHHook: number;

export declare const HITTESTHook: number;

export declare const WIDTHHook: number;

export declare const EOLHook: number;

export declare const doFont: number;

export declare const addSizeBit: number;

export declare const sizeBit: number;

export declare const faceBit: number;

export declare const fontBit: number;

export declare const teFlushLeft: number;

export declare const teFlushRight: number;

export declare const teFlushDefault: number;

export declare const teForceLeft: number;

export declare const teJustRight: number;

export declare const teJustCenter: number;

export declare const teJustLeft: number;

export declare const kHIToolbarItemMutableAttrs: number;

export declare const kHIToolbarItemSelected: number;

export declare const kHIToolbarItemDisabled: number;

export declare const kHIToolbarItemIsSeparator: number;

export declare const kHIToolbarItemAllowDuplicates: number;

export declare const kEventToolbarItemViewExitConfigMode: number;

export declare const kEventToolbarItemViewConfigForSize: number;

export declare const kEventToolbarItemViewConfigForMode: number;

export declare const typeHIToolbarDisplaySize: number;

export declare const kEventParamToolbarDisplayMode: number;

export declare const kEventToolbarItemAcceptDrop: number;

export declare const kEventToolbarItemSelectedStateChanged: number;

export declare const kEventToolbarItemCommandIDChanged: number;

export declare const kEventToolbarItemHelpTextChanged: number;

export declare const kAHInternalErr: number;

export declare const kEventToolbarItemLabelChanged: number;

export declare const kEventToolbarEndMultiChange: number;

export declare const kEventToolbarLayoutChanged: number;

export declare const kEventToolbarDisplaySizeChanged: number;

export declare const kEventToolbarCreateItemFromDrag: number;

export declare const kEventToolbarGetSelectableIdentifiers: number;

export declare const kEventToolbarGetAllowedIdentifiers: number;

export declare const kEventToolbarGetDefaultIdentifiers: number;

export declare const kControlIconNoTrackProc: number;

export declare const typeHIToolbarRef: number;

export declare const kEventParamToolbarItemConfigData: number;

export declare const kEventParamToolbarItem: number;

export declare const kEventParamToolbar: number;

export declare const kHICommandCycleToolbarModeLarger: number;

export declare const kEventParamControlWouldAcceptDrop: number;

export declare const kHICommandToggleAllToolbars: number;

export declare const kHICommandToggleToolbar: number;

export declare const kHICommandCustomizeToolbar: number;

export declare const kHIToolbarValidAttrs: number;

export declare const kHIToolbarIsConfigurable: number;

export declare const kHIToolbarAutoSavesConfig: number;

export declare const kHIToolbarDisplaySizeSmall: number;

export declare const kHIToolbarDisplaySizeNormal: number;

export declare const inNoWindow: number;

export declare const kHIToolbarDisplayModeLabelOnly: number;

export declare const kHIToolbarDisplayModeIconOnly: number;

export declare const kHIToolbarDisplayModeDefault: number;

export declare const kControlDefProcResourceType: number;

export declare const kThemeSavvyMenuResponse: number;

export declare const mCalcItemMsg: number;

export declare const mDrawMsg: number;

export declare const kMenuFindItemMsg: number;

export declare const kMenuInitMsg: number;

export declare const kMenuCalcItemMsg: number;

export declare const kMenuPopUpMsg: number;

export declare const kMenuSizeMsg: number;

export declare const keyContextualMenuModifiers: number;

export declare const keyContextualMenuAttributes: number;

export declare const keyContextualMenuSubmenu: number;

export declare const keyContextualMenuCommandID: number;

export declare const keyContextualMenuName: number;

export declare const kCMMenuItemSelected: number;

export declare const kCMHelpItemOtherHelp: number;

export declare const kWindowFullZoomGrowDocumentProc: number;

export declare const kCMHelpItemNoHelp: number;

export declare const gestaltContextualMenuHasAttributeAndModifierKeys: number;

export declare const gestaltContextualMenuUnusedBit: number;

export declare const gestaltContextualMenuAttr: number;

export declare const kMenuPropertyPersistent: number;

export declare const kHIMenuDismissedByFocusChange: number;

export declare const kHIMenuDismissedByTimeout: number;

export declare const kHIMenuDismissedByAppSwitch: number;

export declare const kHIMenuDismissedByKeyEvent: number;

export declare const kHIMenuDismissedByMouseUp: number;

export declare const kMenuDefProcPtr: number;

export declare const kMenuItemDataAllDataVersionTwo: number;

export declare const kMenuItemDataAllDataVersionOne: number;

export declare const kControlAutoToggles: number;

export declare const kMenuItemDataAttributedText: number;

export declare const kMenuItemDataProperties: number;

export declare const kMenuItemDataRefcon: number;

export declare const kMenuItemDataFontID: number;

export declare const kMenuItemDataSubmenuID: number;

export declare const kMenuItemDataTextEncoding: number;

export declare const kMenuItemDataCommandID: number;

export declare const kMenuItemDataIconEnabled: number;

export declare const kMenuItemDataStyle: number;

export declare const kMenuItemDataCmdKeyGlyph: number;

export declare const kMenuItemDataCmdKey: number;

export declare const kMenuItemDataText: number;

export declare const kMenuEventDontCheckSubmenus: number;

export declare const kHIThemeSegmentPositionOnly: number;

export declare const kMenuEventQueryOnly: number;

export declare const kMenuTrackingModeKeyboard: number;

export declare const kMenuTrackingModeMouse: number;

export declare const kMenuItemAttrAutoDisable: number;

export declare const kMenuItemAttrIncludeInCmdKeyMatching: number;

export declare const kMenuItemAttrCustomDraw: number;

export declare const kMenuItemAttrSectionHeader: number;

export declare const kMenuItemAttrSeparator: number;

export declare const kMenuItemAttrSubmenuParentChoosable: number;

export declare const kMenuItemAttrIconDisabled: number;

export declare const kMenuAttrDoNotCacheImage: number;

export declare const kMenuAttrCondenseSeparators: number;

export declare const kMenuAttrHidden: number;

export declare const kMenuAttrExcludesMarkColumn: number;

export declare const kControlPopupButtonMenuIDTag: number;

export declare const kMenuF19Glyph: number;

export declare const kMenuF16Glyph: number;

export declare const kMenuF15Glyph: number;

export declare const kMenuF13Glyph: number;

export declare const kMenuF12Glyph: number;

export declare const kMenuF10Glyph: number;

export declare const kMenuF9Glyph: number;

export declare const kMenuF8Glyph: number;

export declare const kMenuF7Glyph: number;

export declare const kMenuF6Glyph: number;

export declare const kMenuF4Glyph: number;

export declare const kMenuF3Glyph: number;

export declare const kMenuF2Glyph: number;

export declare const kMenuContextualMenuGlyph: number;

export declare const kMenuAppleLogoOutlineGlyph: number;

export declare const kMenuPageDownGlyph: number;

export declare const kMenuDownArrowGlyph: number;

export declare const kMenuUpArrowGlyph: number;

export declare const kMenuHelpGlyph: number;

export declare const kMenuRightArrowGlyph: number;

export declare const kMenuLeftArrowGlyph: number;

export declare const kMenuBlankGlyph: number;

export declare const kMenuLeftDoubleQuotesJapaneseGlyph: number;

export declare const kMenuEscapeGlyph: number;

export declare const kMenuRightArrowDashedGlyph: number;

export declare const kMenuUpArrowDashedGlyph: number;

export declare const kMenuLeftArrowDashedGlyph: number;

export declare const kMenuParagraphKoreanGlyph: number;

export declare const kMenuCheckmarkGlyph: number;

export declare const kMenuCommandGlyph: number;

export declare const kMenuDownwardArrowDashedGlyph: number;

export declare const kMenuNonmarkingReturnGlyph: number;

export declare const kMenuControlGlyph: number;

export declare const kMenuEnterGlyph: number;

export declare const kMenuTabLeftGlyph: number;

export declare const kMenuNullGlyph: number;

export declare const kMenuSmallIconType: number;

export declare const kMenuShrinkIconType: number;

export declare const kMenuIconType: number;

export declare const kAECaseIgnoreMask: number;

export declare const kMenuNoIcon: number;

export declare const kMenuNoCommandModifier: number;

export declare const kMenuOptionModifier: number;

export declare const kMenuShiftModifier: number;

export declare const kMenuNoModifiers: number;

export declare const kMenuStdMenuProc: number;

export declare const noMark: number;

export declare const kHIMenuAppendItem: number;

export declare const app4Mask: number;

export declare const app3Mask: number;

export declare const app2Mask: number;

export declare const app1Mask: number;

export declare const app4Evt: number;

export declare const app3Evt: number;

export declare const app2Evt: number;

export declare const app1Evt: number;

export declare const networkEvt: number;

export declare const kVK_JIS_Eisu: number;

export declare const kVK_JIS_KeypadComma: number;

export declare const kVK_JIS_Yen: number;

export declare const kVK_ISO_Section: number;

export declare const kVK_UpArrow: number;

export declare const kVK_DownArrow: number;

export declare const kVK_F1: number;

export declare const kVK_PageDown: number;

export declare const kVK_F2: number;

export declare const kVK_End: number;

export declare const kTXNPasteAction: number;

export declare const kVK_F4: number;

export declare const kVK_Home: number;

export declare const kVK_Help: number;

export declare const kVK_F15: number;

export declare const kASMagicTellEvent: number;

export declare const kVK_F9: number;

export declare const kVK_F8: number;

export declare const kVK_F3: number;

export declare const kVK_F7: number;

export declare const kControlBevelButtonTextPlaceTag: number;

export declare const kVK_F6: number;

export declare const kVK_F5: number;

export declare const kVK_F20: number;

export declare const kVK_F19: number;

export declare const kVK_F18: number;

export declare const kVK_VolumeDown: number;

export declare const kVK_VolumeUp: number;

export declare const kVK_Function: number;

export declare const kVK_RightControl: number;

export declare const errDataBrowserPropertyNotSupported: number;

export declare const kVK_RightOption: number;

export declare const kVK_RightShift: number;

export declare const kVK_RightCommand: number;

export declare const kVK_Control: number;

export declare const kVK_Option: number;

export declare const kVK_Command: number;

export declare const kVK_Escape: number;

export declare const kVK_Delete: number;

export declare const kVK_Space: number;

export declare const kVK_Tab: number;

export declare const kVK_Return: number;

export declare const kVK_ANSI_Keypad8: number;

export declare const kVK_ANSI_Keypad7: number;

export declare const kVK_ANSI_Keypad6: number;

export declare const kVK_ANSI_Keypad4: number;

export declare const kVK_ANSI_Keypad0: number;

export declare const kVK_ANSI_KeypadMinus: number;

export declare const kVK_ANSI_KeypadEnter: number;

export declare const kVK_ANSI_KeypadPlus: number;

export declare const kVK_ANSI_KeypadMultiply: number;

export declare const kVK_ANSI_KeypadDecimal: number;

export declare const kVK_ANSI_Period: number;

export declare const kVK_ANSI_M: number;

export declare const kEventRawKeyDown: number;

export declare const kVK_ANSI_Slash: number;

export declare const kVK_ANSI_Comma: number;

export declare const kVK_ANSI_Backslash: number;

export declare const kVK_ANSI_K: number;

export declare const kVK_ANSI_Quote: number;

export declare const kVK_ANSI_L: number;

export declare const kVK_ANSI_P: number;

export declare const kVK_ANSI_I: number;

export declare const kVK_ANSI_LeftBracket: number;

export declare const kVK_ANSI_U: number;

export declare const kVK_ANSI_O: number;

export declare const kVK_ANSI_0: number;

export declare const kVK_ANSI_8: number;

export declare const kVK_ANSI_5: number;

export declare const kVK_ANSI_6: number;

export declare const kVK_ANSI_4: number;

export declare const kVK_ANSI_3: number;

export declare const kVK_ANSI_2: number;

export declare const kVK_ANSI_1: number;

export declare const kVK_ANSI_T: number;

export declare const kVK_ANSI_Y: number;

export declare const kVK_ANSI_E: number;

export declare const kHIWindowBitInWindowMenu: number;

export declare const kVK_ANSI_Q: number;

export declare const kVK_ANSI_B: number;

export declare const kVK_ANSI_V: number;

export declare const kVK_ANSI_C: number;

export declare const kVK_ANSI_H: number;

export declare const kVK_ANSI_F: number;

export declare const kControlBevelButtonAlignBottom: number;

export declare const kVK_ANSI_D: number;

export declare const kVK_ANSI_S: number;

export declare const kBulletUnicode: number;

export declare const kCheckUnicode: number;

export declare const kCommandUnicode: number;

export declare const kShiftUnicode: number;

export declare const kNonBreakingSpaceCharCode: number;

export declare const kDeleteCharCode: number;

export declare const kSpaceCharCode: number;

export declare const kUpArrowCharCode: number;

export declare const kRightArrowCharCode: number;

export declare const kWindowMsgInitialize: number;

export declare const kClearCharCode: number;

export declare const kDiamondCharCode: number;

export declare const kCheckCharCode: number;

export declare const kCommandCharCode: number;

export declare const kFunctionKeyCharCode: number;

export declare const kReturnCharCode: number;

export declare const kHIToolbarItemLabelDisabled: number;

export declare const kPageDownCharCode: number;

export declare const kVerticalTabCharCode: number;

export declare const kLineFeedCharCode: number;

export declare const kTabCharCode: number;

export declare const kBackspaceCharCode: number;

export declare const kBellCharCode: number;

export declare const kHelpCharCode: number;

export declare const kNullCharCode: number;

export declare const rightOptionKey: number;

export declare const rightShiftKey: number;

export declare const shiftKey: number;

export declare const btnState: number;

export declare const rightOptionKeyBit: number;

export declare const controlKeyBit: number;

export declare const shiftKeyBit: number;

export declare const cmdKeyBit: number;

export declare const activeFlagBit: number;

export declare const adbAddrMask: number;

export declare const keyCodeMask: number;

export declare const charCodeMask: number;

export declare const everyEvent: number;

export declare const activMask: number;

export declare const keyUpMask: number;

export declare const keyDownMask: number;

export declare const activateEvt: number;

export declare const diskEvt: number;

export declare const updateEvt: number;

export declare const autoKey: number;

export declare const keyUp: number;

export declare const keyDown: number;

export declare const mouseUp: number;

export declare const mouseDown: number;

export declare const kThemeIndeterminateBar: number;

export declare const kThemeSlider: number;

export declare const kThemeScrollBar: number;

export declare const kThemeBrushPassiveAreaFill: number;

export declare const kThemeRightToLeftAdornment: number;

export declare const kThemeFocusAdornment: number;

export declare const kThemeDefaultAdornment: number;

export declare const kThemeActivePopupLabelTextColor: number;

export declare const kTXNSingleLineOnlyMask: number;

export declare const kThemeSelectedMenuItemTextColor: number;

export declare const kThemeSelectedRootMenuTextColor: number;

export declare const kThemeActiveRootMenuTextColor: number;

export declare const kThemeActivePopupWindowTitleColor: number;

export declare const kThemeActiveUtilityWindowTitleTextColor: number;

export declare const kThemeInactiveMovableModalWindowTitleTextColor: number;

export declare const kThemeActiveMovableModalWindowTitleTextColor: number;

export declare const kThemeInactiveDocumentWindowTitleTextColor: number;

export declare const activeFlag: number;

export declare const kThemeActiveDocumentWindowTitleTextColor: number;

export declare const kThemeListViewTextColor: number;

export declare const kThemeIconLabelTextColor: number;

export declare const kThemePressedBevelButtonTextColor: number;

export declare const kThemeInactiveBevelButtonTextColor: number;

export declare const kThemePressedPushButtonTextColor: number;

export declare const kThemeInactivePushButtonTextColor: number;

export declare const kThemeActivePushButtonTextColor: number;

export declare const kThemeInactivePlacardTextColor: number;

export declare const kThemeActivePlacardTextColor: number;

export declare const kThemeInactiveWindowHeaderTextColor: number;

export declare const kThemeActiveWindowHeaderTextColor: number;

export declare const kThemeActiveModelessDialogTextColor: number;

export declare const kThemeActiveAlertTextColor: number;

export declare const kThemeInactiveDialogTextColor: number;

export declare const kThemeAppleGuideCoachmarkBrush: number;

export declare const kThemeInactivePopupArrowBrush: number;

export declare const kThemePressedPopupArrowBrush: number;

export declare const kThemeFocusHighlightBrush: number;

export declare const kThemeInactiveScrollBarDelimiterBrush: number;

export declare const kThemeActiveScrollBarDelimiterBrush: number;

export declare const kThemeFinderWindowBackgroundBrush: number;

export declare const kThemeListViewSeparatorBrush: number;

export declare const kThemeIconLabelBackgroundBrush: number;

export declare const kThemeActiveUtilityWindowBackgroundBrush: number;

export declare const kEventMouseWheelMoved: number;

export declare const kThemeInactiveModelessDialogBackgroundBrush: number;

export declare const kThemeActiveModelessDialogBackgroundBrush: number;

export declare const kVK_ANSI_A: number;

export declare const kThemeActiveAlertBackgroundBrush: number;

export declare const kThemeInactiveDialogBackgroundBrush: number;

export declare const kThemeActiveDialogBackgroundBrush: number;

export declare const kControlProgressBarIndeterminateTag: number;

export declare const appearanceBadTextColorIndexErr: number;

export declare const appearanceProcessNotRegisteredErr: number;

export declare const appearanceProcessRegisteredErr: number;

export declare const appearanceBadBrushIndexErr: number;

export declare const kThemeSoundFinderDragOnIcon: number;

export declare const kThemeSoundDiskEject: number;

export declare const kThemeSoundLaunchApp: number;

export declare const kThemeSoundResolveAlias: number;

export declare const kThemeSoundReceiveDrop: number;

export declare const kThemeSoundSelectItem: number;

export declare const pIsLocked: number;

export declare const kThemeSoundDragTargetDrop: number;

export declare const kThemeSoundDragTargetUnhilite: number;

export declare const kThemeSoundDragTargetHilite: number;

export declare const kThemeInactivePopupButtonTextColor: number;

export declare const kThemeSoundTabRelease: number;

export declare const kThemeSoundTabEnter: number;

export declare const kThemeSoundTabPressed: number;

export declare const kThemeSoundDisclosureEnter: number;

export declare const kThemeSoundDisclosurePress: number;

export declare const kThemeSoundPopupExit: number;

export declare const kThemeSoundPopupEnter: number;

export declare const kControlRoundButtonLargeSize: number;

export declare const kThemeSoundPopupPress: number;

export declare const kThemeSoundLittleArrowDnRelease: number;

export declare const kThemeSoundLittleArrowUpRelease: number;

export declare const kThemeSoundLittleArrowExit: number;

export declare const kThemeSoundLittleArrowUpPress: number;

export declare const kThemeSoundBevelRelease: number;

export declare const kThemeSoundBevelEnter: number;

export declare const kThemeSoundBalloonOpen: number;

export declare const kThemeSoundSliderTrackPress: number;

export declare const kThemeSoundScrollEndOfTrack: number;

export declare const kOSARecordedText: number;

export declare const kThemeSoundScrollArrowRelease: number;

export declare const kThemeSoundScrollArrowPress: number;

export declare const kThemeSoundRadioExit: number;

export declare const kThemeSoundRadioEnter: number;

export declare const kThemeSoundRadioPress: number;

export declare const kASSelectGetPropertyObsolete: number;

export declare const kThemeSoundCheckboxExit: number;

export declare const kThemeSoundCheckboxEnter: number;

export declare const kThemeSoundCancelButtonExit: number;

export declare const kThemeSoundCancelButtonEnter: number;

export declare const kControlPopupFixedWidthVariant: number;

export declare const kThemeSoundDefaultButtonRelease: number;

export declare const kThemeSoundDefaultButtonExit: number;

export declare const kURLConnectingState: number;

export declare const kThemeSoundDefaultButtonEnter: number;

export declare const kThemeSoundButtonExit: number;

export declare const kThemeSoundButtonEnter: number;

export declare const kThemeSoundButtonPress: number;

export declare const kThemeSoundPopupWindowClose: number;

export declare const kThemeSoundPopupWindowOpen: number;

export declare const kThemeSoundAlertClose: number;

export declare const kThemeSoundAlertOpen: number;

export declare const ok: number;

export declare const kThemeMetricRoundTextFieldSmallContentInsetLeft: number;

export declare const kThemeSoundDialogClose: number;

export declare const kThemeSoundDialogOpen: number;

export declare const kThemeSoundUtilWindowActivate: number;

export declare const kThemeSoundUtilWindowCollapseDown: number;

export declare const kThemeSoundUtilWindowCollapseUp: number;

export declare const kEventParamTextInputReplyATSFont: number;

export declare const kThemeSoundUtilWindowZoomIn: number;

export declare const kThemeSoundUtilWindowOpen: number;

export declare const kThemeSoundWindowCollapseUp: number;

export declare const kThemeSoundWindowZoomOut: number;

export declare const kThemeSoundWindowZoomIn: number;

export declare const kThemeSoundWindowOpen: number;

export declare const kThemeSoundUtilWinCollapseEnter: number;

export declare const kThemeSoundUtilWinCollapsePress: number;

export declare const kThemeSoundUtilWinZoomEnter: number;

export declare const kThemeSoundUtilWinZoomPress: number;

export declare const kControlCollectionTagVisibility: number;

export declare const kThemeSoundUtilWinCloseExit: number;

export declare const kThemeSoundUtilWinCloseEnter: number;

export declare const kThemeSoundUtilWinClosePress: number;

export declare const kThemeSoundWindowDragBoundary: number;

export declare const kThemeSoundWindowCollapseEnter: number;

export declare const kThemeSoundWindowCollapsePress: number;

export declare const kThemeSoundWindowZoomRelease: number;

export declare const kThemeSoundWindowZoomExit: number;

export declare const kThemeSoundWindowZoomPress: number;

export declare const kThemeSoundWindowCloseRelease: number;

export declare const kThemeSoundWindowCloseExit: number;

export declare const kThemeSoundWindowCloseEnter: number;

export declare const kTXNSupportSpellCheckCommandProcessing: number;

export declare const kThemeSoundWindowClosePress: number;

export declare const kThemeMetricMenuMarkColumnWidth: number;

export declare const kThemeSoundMenuItemHilite: number;

export declare const kThemeSoundMenuClose: number;

export declare const kThemeSoundMenuOpen: number;

export declare const kThemeSoundNone: number;

export declare const kThemeDragSoundScrollBarArrowIncreasing: number;

export declare const kThemeDragSoundScrollBarArrowDecreasing: number;

export declare const kThemeDragSoundScrollBarGhost: number;

export declare const kThemeDragSoundScrollBarThumb: number;

export declare const kThemeDragSoundSliderGhost: number;

export declare const enumPrefsGeneralPanel: number;

export declare const kControlUseFontMask: number;

export declare const kMenuPowerGlyph: number;

export declare const kThemeDragSoundSliderThumb: number;

export declare const kThemeDragSoundMoveAlert: number;

export declare const kThemeDragSoundGrowUtilWindow: number;

export declare const kAECaseConsiderMask: number;

export declare const kThemeDragSoundMoveWindow: number;

export declare const kThemeDragSoundNone: number;

export declare const kThemeFinderSoundsMask: number;

export declare const kThemeControlSoundsMask: number;

export declare const kThemeMenuSoundsMask: number;

export declare const kThemeAdornmentArrowRightArrow: number;

export declare const kThemeAdornmentArrowUpArrow: number;

export declare const kThemeAdornmentArrowDoubleArrow: number;

export declare const kThemeAdornmentHeaderButtonNoSortArrow: number;

export declare const kThemeAdornmentHeaderButtonShadowOnly: number;

export declare const kThemeAdornmentHeaderButtonNoShadow: number;

export declare const kThemeAdornmentHeaderButtonSortUp: number;

export declare const kThemeAdornmentHeaderButtonRightNeighborSelected: number;

export declare const kThemeAdornmentHeaderButtonLeftNeighborSelected: number;

export declare const kWindowDrawerOpen: number;

export declare const kThemeAdornmentDrawIndicatorOnly: number;

export declare const kThemeAdornmentRightToLeft: number;

export declare const kThemeAdornmentFocus: number;

export declare const kThemeAdornmentDefault: number;

export declare const kThemeAdornmentNone: number;

export declare const kThemeDisclosureDown: number;

export declare const kThemeDisclosureRight: number;

export declare const kThemeButtonMixed: number;

export declare const kThemeDisclosureButton: number;

export declare const kThemeLargeRoundButton: number;

export declare const kThemeSmallRadioButton: number;

export declare const kThemeSmallCheckBox: number;

export declare const kThemeSmallBevelButton: number;

export declare const kThemeMiniRadioButton: number;

export declare const kThemeMiniCheckBox: number;

export declare const kThemeMediumBevelButton: number;

export declare const kThemeLargeBevelButton: number;

export declare const kThemeNormalRadioButton: number;

export declare const kThemePushButtonInsetSmall: number;

export declare const kThemePushButtonTextured: number;

export declare const kThemeBevelButtonInset: number;

export declare const kThemePopupButtonMini: number;

export declare const mctAllItems: number;

export declare const kThemePopupButtonNormal: number;

export declare const kThemePushButtonNormal: number;

export declare const kThemeArrowButtonMini: number;

export declare const kThemeArrowButtonSmall: number;

export declare const kThemeIncDecButtonMini: number;

export declare const kThemeIncDecButtonSmall: number;

export declare const kThemeComboBoxMini: number;

export declare const kThemeComboBoxSmall: number;

export declare const kThemeComboBox: number;

export declare const kThemeRoundedBevelButton: number;

export declare const kThemeRadioButtonSmall: number;

export declare const kThemeRoundButtonLarge: number;

export declare const kThemeDisclosureTriangle: number;

export declare const kThemePopupButton: number;

export declare const kThemeArrowButton: number;

export declare const kThemeCheckBox: number;

export declare const kThemePushButton: number;

export declare const kThemeGrowDown: number;

export declare const kThemeGrowUp: number;

export declare const kThemeArrow5pt: number;

export declare const kThemeArrow3pt: number;

export declare const kThemeArrowUp: number;

export declare const kThemeArrowRight: number;

export declare const kThemeArrowDown: number;

export declare const kThemeArrowLeft: number;

export declare const kThemeWidgetToolbarButton: number;

export declare const kThemeUtilitySideWindow: number;

export declare const kThemePlainDialogWindow: number;

export declare const kThemeMovableAlertWindow: number;

export declare const kThemeAlertWindow: number;

export declare const kThemeMovableDialogWindow: number;

export declare const kThemeDocumentWindow: number;

export declare const kThemeWindowHasFullZoom: number;

export declare const kThemeWindowHasVerticalZoom: number;

export declare const kThemeWindowHasGrow: number;

export declare const kThemeTrackHasFocus: number;

export declare const kThemeTrackNoScrollBarArrows: number;

export declare const kThemeTrackThumbRgnIsNotGhost: number;

export declare const kThemeTrackShowThumb: number;

export declare const kThemeTrackRightToLeft: number;

export declare const kThemeTrackHorizontal: number;

export declare const kThemeThumbUpward: number;

export declare const kFlavorTypeFinderNoTrackingBehavior: number;

export declare const kThemeBottomTrackPressed: number;

export declare const kThemeTopTrackPressed: number;

export declare const kThemeTopInsideArrowPressed: number;

export declare const kThemeRightOutsideArrowPressed: number;

export declare const kThemeRightInsideArrowPressed: number;

export declare const kThemeThumbPressed: number;

export declare const kThemeLeftInsideArrowPressed: number;

export declare const kThemeTrackInactive: number;

export declare const kThemeTrackDisabled: number;

export declare const kThemeTrackActive: number;

export declare const kThemeMiniIndeterminateBar: number;

export declare const kThemeMiniProgressBar: number;

export declare const kThemeMiniSlider: number;

export declare const teCaret: number;

export declare const kThemeMiniScrollBar: number;

export declare const kThemeSmallSlider: number;

export declare const kThemeMediumSlider: number;

export declare const kThemeSmallScrollBar: number;

export declare const kThemeMediumScrollBar: number;

export declare const kThemeProgressBarMini: number;

export declare const kThemeScrollBarMini: number;

export declare const kThemeIndeterminateBarLarge: number;

export declare const kThemeProgressBarLarge: number;

export declare const kThemeSliderSmall: number;

export declare const kControlPopupVariableWidthVariant: number;

export declare const kThemeRelevanceBar: number;

export declare const kThemeIndeterminateBarMedium: number;

export declare const kThemeProgressBarMedium: number;

export declare const kThemeSmallTabHeightMax: number;

export declare const kThemeLargeTabHeight: number;

export declare const kThemeSmallTabHeight: number;

export declare const kThemeTabWest: number;

export declare const kThemeTabEast: number;

export declare const kThemeTabFrontInactive: number;

export declare const kThemeTabFront: number;

export declare const kThemeTabNonFrontInactive: number;

export declare const kThemeTabNonFrontPressed: number;

export declare const kPublicThemeFontCount: number;

export declare const kThemeSpecifiedFont: number;

export declare const kThemeCurrentPortFont: number;

export declare const kThemeMiniSystemFont: number;

export declare const kThemeToolbarFont: number;

export declare const kThemeAlertHeaderFont: number;

export declare const kThemePushButtonFont: number;

export declare const kThemeWindowTitleFont: number;

export declare const kThemeMenuItemCmdKeyFont: number;

export declare const kThemeMenuItemFont: number;

export declare const kThemeMenuTitleFont: number;

export declare const kThemeSystemFontDetailEmphasized: number;

export declare const kThemeApplicationFont: number;

export declare const kThemeEmphasizedSystemFont: number;

export declare const kThemeSmallEmphasizedSystemFont: number;

export declare const kThemeSmallSystemFont: number;

export declare const kThemeSystemFont: number;

export declare const kThemeScrollBarThumbProportional: number;

export declare const kThemeScrollBarArrowsSingle: number;

export declare const kThemeCheckBoxClassicX: number;

export declare const kFillScreen: number;

export declare const kFitToScreen: number;

export declare const kCenterOnScreen: number;

export declare const kThemeSmoothFontEnabledTag: number;

export declare const kThemeUserDefinedTag: number;

export declare const kThemeSoundMaskTag: number;

export declare const kThemeExamplePictureIDTag: number;

export declare const kThemeHighlightColorNameTag: number;

export declare const kThemeDesktopPictureAlignmentTag: number;

export declare const kThemeDesktopPictureNameTag: number;

export declare const kThemeDesktopPatternTag: number;

export declare const kThemeDesktopPatternNameTag: number;

export declare const kThemeViewsFontSizeTag: number;

export declare const kThemeSmallSystemFontTag: number;

export declare const kThemeSystemFontTag: number;

export declare const kThemeAppearanceFileNameTag: number;

export declare const kThemeDblClickCollapseTag: number;

export declare const kThemeSoundsEnabledTag: number;

export declare const kThemeScrollBarThumbStyleTag: number;

export declare const kThemeScrollBarArrowStyleTag: number;

export declare const kThemeVariantNameTag: number;

export declare const kThemeNameTag: number;

export declare const kUseBestGuess: number;

export declare const kThemeBackgroundMetal: number;

export declare const kThemeBackgroundSecondaryGroupBox: number;

export declare const kThemeBackgroundListViewWindowHeader: number;

export declare const kThemeBackgroundPlacard: number;

export declare const kThemeBackgroundTabPane: number;

export declare const kThemeMenuItemNoBackground: number;

export declare const kThemeMenuItemHasIcon: number;

export declare const kASNumericStrings: number;

export declare const kThemeMenuItemPopUpBackground: number;

export declare const kThemeMenuItemHierBackground: number;

export declare const kTXNShowStart: number;

export declare const kThemeMenuItemAtBottom: number;

export declare const kThemeMenuItemAtTop: number;

export declare const kThemeMenuItemHierarchical: number;

export declare const kThemeMenuTypeInactive: number;

export declare const kThemeMenuTypeHierarchical: number;

export declare const kThemeMenuTypePopUp: number;

export declare const kThemeMenuTypePullDown: number;

export declare const kThemeMenuDisabled: number;

export declare const kThemeMenuSelected: number;

export declare const kThemeMenuActive: number;

export declare const kThemeMenuSquareMenuBar: number;

export declare const kThemeMenuBarNormal: number;

export declare const kThemePoofCursor: number;

export declare const kThemeResizeUpDownCursor: number;

export declare const kThemeResizeDownCursor: number;

export declare const kThemeNotAllowedCursor: number;

export declare const kThemeResizeLeftRightCursor: number;

export declare const kThemeResizeLeftCursor: number;

export declare const kThemeCountingUpAndDownHandCursor: number;

export declare const kThemeCountingUpHandCursor: number;

export declare const kThemePointingHandCursor: number;

export declare const kThemeOpenHandCursor: number;

export declare const kTISPropertyInputSourceCategory: interop.Pointer;

export declare const kThemeWatchCursor: number;

export declare const kThemePlusCursor: number;

export declare const kThemeCrossCursor: number;

export declare const kThemeIBeamCursor: number;

export declare const kThemeContextualMenuArrowCursor: number;

export declare const kMenuItemAttrDynamic: number;

export declare const kThemeAliasArrowCursor: number;

export declare const kThemeCopyArrowCursor: number;

export declare const kThemeStatePressedUp: number;

export declare const kThemeStateDisabled: number;

export declare const kThemeStateUnavailableInactive: number;

export declare const kThemeStateRollover: number;

export declare const kThemeStateActive: number;

export declare const kThemeTextColorSystemDetail: number;

export declare const kThemeTextColorNotification: number;

export declare const kThemeTextColorBevelButtonStickyActive: number;

export declare const kThemeTextColorIconLabelSelected: number;

export declare const kThemeTextColorTabNonFrontPressed: number;

export declare const kThemeTextColorTabFrontActive: number;

export declare const kThemeTextColorPopupLabelInactive: number;

export declare const kThemeTextColorPopupLabelActive: number;

export declare const kThemeTextColorMenuItemSelected: number;

export declare const kThemeTextColorRootMenuSelected: number;

export declare const kThemeTextColorRootMenuActive: number;

export declare const kThemeTextColorPopupWindowTitleActive: number;

export declare const kThemeTextColorUtilityWindowTitleInactive: number;

export declare const kThemeTextColorUtilityWindowTitleActive: number;

export declare const kThemeTextColorMovableModalWindowTitleInactive: number;

export declare const kThemeTextColorMovableModalWindowTitleActive: number;

export declare const kThemeTextColorDocumentWindowTitleActive: number;

export declare const kThemeTextColorListView: number;

export declare const kThemeTextColorIconLabel: number;

export declare const kThemeTextColorPopupButtonPressed: number;

export declare const kThemeTextColorPushButtonActive: number;

export declare const kThemeTextColorPlacardPressed: number;

export declare const kThemeTextColorPlacardInactive: number;

export declare const kThemeTextColorWindowHeaderActive: number;

export declare const kThemeTextColorModelessDialogInactive: number;

export declare const kThemeTextColorModelessDialogActive: number;

export declare const kThemeTextColorAlertInactive: number;

export declare const kThemeTextColorDialogActive: number;

export declare const kThemeBrushAlternatePrimaryHighlightColor: number;

export declare const kThemeBrushSecondaryHighlightColor: number;

export declare const kThemeBrushPrimaryHighlightColor: number;

export declare const kThemeBrushWhite: number;

export declare const kThemeBrushListViewEvenRowBackground: number;

export declare const kThemeBrushListViewOddRowBackground: number;

export declare const kThemeBrushMenuBackgroundSelected: number;

export declare const kThemeBrushMenuBackground: number;

export declare const kThemeBrushSheetBackgroundTransparent: number;

export declare const kThemeBrushSheetBackgroundOpaque: number;

export declare const kThemeBrushMovableModalBackground: number;

export declare const kThemeBrushNotificationWindowBackground: number;

export declare const kThemeBrushBevelInactiveDark: number;

export declare const kThemeBrushBevelActiveDark: number;

export declare const kThemeBrushBevelActiveLight: number;

export declare const kThemeBrushButtonPressedLightHighlight: number;

export declare const kThemeBrushButtonInactiveLightHighlight: number;

export declare const kThemeBrushButtonInactiveDarkShadow: number;

export declare const kTXNDisableDragAndDropTag: number;

export declare const kThemeBrushButtonActiveLightHighlight: number;

export declare const kThemeBrushButtonActiveDarkHighlight: number;

export declare const kThemeBrushButtonFacePressed: number;

export declare const kThemeBrushButtonFaceActive: number;

export declare const kThemeBrushButtonFrameInactive: number;

export declare const kThemeBrushButtonFrameActive: number;

export declare const kThemeBrushActiveAreaFill: number;

export declare const kThemeBrushIconLabelBackgroundSelected: number;

export declare const kThemeBrushAppleGuideCoachmark: number;

export declare const kThemeBrushPopupArrowActive: number;

export declare const kThemeBrushFocusHighlight: number;

export declare const kThemeBrushScrollBarDelimiterActive: number;

export declare const kThemeBrushFinderWindowBackground: number;

export declare const kThemeBrushDocumentWindowBackground: number;

export declare const kThemeBrushDragHilite: number;

export declare const kThemeBrushChasingArrows: number;

export declare const kTXNDoNotInstallDragProcsBit: number;

export declare const kThemeBrushListViewSeparator: number;

export declare const kThemeBrushIconLabelBackground: number;

export declare const kThemeBrushListViewBackground: number;

export declare const kThemeBrushListViewSortColumnBackground: number;

export declare const kThemeBrushUtilityWindowBackgroundInactive: number;

export declare const kThemeBrushUtilityWindowBackgroundActive: number;

export declare const kThemeBrushModelessDialogBackgroundActive: number;

export declare const kThemeBrushAlertBackgroundActive: number;

export declare const kThemeBrushDialogBackgroundInactive: number;

export declare const kThemeDocumentWindowBackgroundBrush: number;

export declare const kThemeMediumProgressBar: number;

export declare const kAppearanceRegionToolbarButton: number;

export declare const kAppearanceRegionContent: number;

export declare const kAppearanceRegionTitleProxyIcon: number;

export declare const kAppearanceRegionCollapseBox: number;

export declare const kAppearanceRegionGrow: number;

export declare const kAppearanceRegionCloseBox: number;

export declare const kAppearancePartPageRightArea: number;

export declare const kAppearancePartPageLeftArea: number;

export declare const kAppearancePartPageDownArea: number;

export declare const kThemeMetricSmallCheckBoxHeight: number;

export declare const kAppearancePartRightButton: number;

export declare const kAppearancePartDownButton: number;

export declare const kAppearancePartMetaInactive: number;

export declare const kAppearancePartMetaDisabled: number;

export declare const kAppearancePartMetaNone: number;

export declare const kAEViewsFontChanged: number;

export declare const kAESmallSystemFontChanged: number;

export declare const kAESystemFontChanged: number;

export declare const kHIArchiveDecodingForEditor: number;

export declare const hiArchiveHIObjectIgnoresArchivingErr: number;

export declare const kHIDelegateAfterKey: interop.Pointer;

export declare const kHIDelegateBeforeKey: interop.Pointer;

export declare const typeOSAErrorRange: number;

export declare const kHIDelegateAfter: number;

export declare const kHIDelegateBefore: number;

export declare const kHIObjectCustomDataClassIDKey: interop.Pointer;

export declare const kHIObjectCustomDataParameterValuesKey: interop.Pointer;

export declare const kHIObjectCustomDataParameterTypesKey: interop.Pointer;

export declare const kHIObjectCustomDataParameterNamesKey: interop.Pointer;

export declare const kEventDelegateGetGroupClasses: number;

export declare const kHIThemeTextBoxOptionDontClip: number;

export declare const kEventDelegateRemoved: number;

export declare const kEventParamDelegateTarget: number;

export declare const kEventClassDelegate: number;

export declare const kEventHIObjectCreatedFromArchive: number;

export declare const kEventHIObjectEncode: number;

export declare const kEventHIObjectPrintDebugInfo: number;

export declare const kEventHIObjectDestruct: number;

export declare const kEventHIObjectConstruct: number;

export declare const kHIObjectInitParamEventType: interop.Pointer;

export declare const kHIObjectInitParamEventName: interop.Pointer;

export declare const kHIObjectInitParamDescription: interop.Pointer;

export declare const kHIObjectInitParamUserName: interop.Pointer;

export declare const kEventParamDecodingForEditor: number;

export declare const kEventParamAfterDelegates: number;

export declare const kEventParamBeforeDelegates: number;

export declare const kEventClassHIObject: number;

export declare const kEventWindowZoom: number;

export declare const kHIClassOptionSingleton: number;

export declare const hiObjectDelegateNotFoundErr: number;

export declare const hiObjectDelegateAlreadyExistsErr: number;

export declare const hiObjectCannotSubclassSingletonErr: number;

export declare const hiObjectClassIsAbstractErr: number;

export declare const hiObjectClassHasSubclassesErr: number;

export declare const kEventTargetSendToAllHandlers: number;

export declare const kEventTargetDontPropagate: number;

export declare const kThemeCheckBoxMini: number;

export declare const kEventLoopIdleTimerStopped: number;

export declare const kEventLoopIdleTimerIdling: number;

export declare const kEventLoopIdleTimerStarted: number;

export declare const kEventQueueOptionsNone: number;

export declare const kEventAttributeUserEvent: number;

export declare const kEventAttributeNone: number;

export declare const kEventRemoveFromQueue: number;

export declare const kEventLeaveInQueue: number;

export declare const kEventPriorityHigh: number;

export declare const kEventParamDragRef: number;

export declare const eventLoopQuitErr: number;

export declare const eventLoopTimedOutErr: number;

export declare const eventParameterNotFoundErr: number;

export declare const eventKindIncorrectErr: number;

export declare const eventTargetBusyErr: number;

export declare const eventAlreadyPostedErr: number;

export declare const kHICoordSpaceView: number;

export declare const kHICoordSpaceWindow: number;

export declare const kDoNotActivateAndHandleClick: number;

export declare const kThemeBrushButtonActiveLightShadow: number;

export declare const pASWeeks: number;

export declare const kEventAppFocusMenuBar: number;

export declare const kEventToolbarItemAdded: number;

export declare const cTrash: number;

export declare const kEventAccessibleGetAllActionNames: number;

export declare const kThemeMetricRoundTextFieldContentInsetTop: number;

export declare const kScrapClearNamedScrap: number;

export declare const bHandleAERecording: number;

export declare const pLargestFreeBlock: number;

export declare const popupTitleCondense: number;

export declare const kHIViewNoPart: number;

export declare const kControlKindPushButton: number;

export declare const kThemeSoundTrackNameTag: number;

export declare const typeMenuItemIndex: number;

export declare const kTXNWillDefaultToCarbonEventMask: number;

export declare const kHIArchiveDecodeSuperclassForUnregisteredObjects: number;

export declare const kOSASelectDispose: number;

export declare const kThemeMetricMiniHSliderHeight: number;

export declare const kThemeBevelButton: number;

export declare const kCMHidePaletteWindows: number;

export declare const kHMLeftBottomCorner: number;

export declare const kDigiHubMusicCD: number;

export declare const kEventParamCurrentWindow: number;

export declare const kCenterOnMainScreen: number;

export declare const kKLuchrKind: number;

export declare const kDataBrowserNeverEmptySelectionSet: number;

export declare const kVK_ANSI_Keypad5: number;

export declare const kColorPickerCallColorProcLive: number;

export declare const pExpandable: number;

export declare const kWindowFloatVertZoomGrowProc: number;

export declare const kDrawControlIndicatorOnly: number;

export declare const kThemeListHeaderButton: number;

export declare const kOSAErrorExpectedType: number;

export declare const kHITextViewClassID: interop.Pointer;

export declare const kTextService: number;

export declare const kDoNotActivateAndIgnoreClick: number;

export declare const kThemeRadioButtonMini: number;

export declare const key32BitIcon: number;

export declare const kAEDontDisposeOnResume: number;

export declare const kAEAppearanceChanged: number;

export declare const kEventTSMDocumentAccessGetFont: number;

export declare const kTISPropertyLocalizedName: interop.Pointer;

export declare const kFontPanelATSUFontIDKey: interop.Pointer;

export declare const kControlEditTextKeyFilterTag: number;

export declare const wHiliteColor: number;

export declare const kVK_ANSI_R: number;

export declare const teDraw: number;

export declare const kEventClassInk: number;

export declare const kEventMouseEntered: number;

export declare const kSRNotifyRecognitionDone: number;

export declare const kControlFontSmallBoldSystemFont: number;

export declare const hiObjectClassExistsErr: number;

export declare const kWindowLiveResizeAttribute: number;

export declare const enumThisYear: number;

export declare const kWindowSideTitlebarAttribute: number;

export declare const kASDivide: number;

export declare const kLeftArrowCharCode: number;

export declare const kEventParamAccessibilityEventQueued: number;

export declare const kThemePushButtonInset: number;

export declare const kControlKindRadioButton: number;

export declare const typeMenuEventOptions: number;

export declare const cautionIcon: number;

export declare const cSaturday: number;

export declare const cPreferences: number;

export declare const kEventTSMDocumentAccessLockDocument: number;

export declare const kVK_F16: number;

export declare const pShortCuts: number;

export declare const kWindowModalDialogProc: number;

export declare const pExtensionsFolder: number;

export declare const typeQDRgnHandle: number;

export declare const kDataBrowserListViewAppendColumn: number;

export declare const keyOSASourceEnd: number;

export declare const kAEWhiteSpace: number;

export declare const kHIWindowBitFullScreenAuxiliary: number;

export declare const kEventParamCandidateText: number;

export declare const kURLDataAvailableEventMask: number;

export declare const kDataBrowserNothingHit: number;

export declare const kControlSupportsEmbedding: number;

export declare const kThemeSoundUtilWinZoomRelease: number;

export declare const kEventTSMDocumentAccessGetCharactersPtrForLargestBuffer: number;

export declare const kMenuItemDataCmdKeyModifiers: number;

export declare const kEventParamATSUFontID: number;

export declare const kHICommandCloseFile: number;

export declare const kControlKindChasingArrows: number;

export declare const kControlCheckBoxPart: number;

export declare const kEventHIObjectInitialize: number;

export declare const kTXNMultipleFrameType: number;

export declare const kWindowFadeTransitionEffect: number;

export declare const kOSAErrorBriefMessage: number;

export declare const kThemeMetricDisclosureButtonSize: number;

export declare const kWindowCascadeStartAtParentWindowScreen: number;

export declare const kTranslateGetScrapTranslationListConsideringData: number;

export declare const kEventParamWindowDefPart: number;

export declare const kControlClockTypeMonthYear: number;

export declare const kThemeTabNonFrontUnavailable: number;

export declare const kAESmallKana: number;

export declare const kMenuClearGlyph: number;

export declare const kEventControlBoundsChanged: number;

export declare const kHIWindowIgnoreObscuringWindows: number;

export declare const kEventParamParentMenu: number;

export declare const userKind: number;

export declare const kHIScrollViewPageUp: number;

export declare const pShowDiskInfo: number;

export declare const kASGreaterThan: number;

export declare const kEventParamTSMDocAccessCharacterCount: number;

export declare const kThemeDragHiliteBrush: number;

export declare const kControlScrollTextBoxDelayBetweenAutoScrollTag: number;

export declare const kThemeTextColorDocumentWindowTitleInactive: number;

export declare const kWindowEdgeTop: number;

export declare const kThemeSoundDisclosureExit: number;

export declare const kMenuItemDataAttributes: number;

export declare const kControlPushButtonCancelTag: number;

export declare const kWindowMsgCleanUp: number;

export declare const kEventToolbarCreateItemWithIdentifier: number;

export declare const kEventParamEnableMenuForKeyEvent: number;

export declare const kWindowCanGrow: number;

export declare const kControlProgressBarProc: number;

export declare const kDataBrowserAttributeReserveGrowBoxSpace: number;

export declare const kGSSSelectGetDefaultScriptingComponent: number;

export declare const bLanguageMask: number;

export declare const intInlineInputTSMTEPostUpdateHook: number;

export declare const kVK_ANSI_KeypadDivide: number;

export declare const cRecord: number;

export declare const kThemePopupTabCenterOnOffset: number;

export declare const kHIThemeTabPositionFirst: number;

export declare const kThemeMetricComboBoxLargeRightShadowOffset: number;

export declare const kOSASelectCompile: number;

export declare const kThemeMetricDisclosureTriangleHeight: number;

export declare const kEventParamWindowProxyImageRgn: number;

export declare const kThemeSoundEmptyTrash: number;

export declare const kControlTemplateResourceType: number;

export declare const kHICommandZoomWindow: number;

export declare const kTXNClearThisControl: number;

export declare const kTXNRefConTag: number;

export declare const kThemeMenuItemScrollUpArrow: number;

export declare const kControlKindHIStandardMenuView: number;

export declare const kEventServiceGetTypes: number;

export declare const kEventToolbarItemPerformAction: number;

export declare const kASSourceStyleNormalText: number;

export declare const kScrapReservedFlavorType: number;

export declare const kHIViewValidFeaturesForPanther: number;

export declare const kTXNUseInline: number;

export declare const kMouseTrackingScrollWheel: number;

export declare const kWindowEdgeBottom: number;

export declare const kThemeBrushButtonPressedLightShadow: number;

export declare const kThemeTextColorRootMenuDisabled: number;

export declare const cControlPanelFile: number;

export declare const kTXNQDFontNameAttributeSize: number;

export declare const kMenuEisuGlyph: number;

export declare const kDataBrowserListViewNoGapForIconInHeaderButton: number;

export declare const kEventParamCurrentBounds: number;

export declare const kURLSystemEvent: number;

export declare const kHIViewFeatureAutoToggles: number;

export declare const kEventParamTabletProximityRec: number;

export declare const kWindowDocumentProc: number;

export declare const kOSASelectLoadExecute: number;

export declare const kThemeSheetWindow: number;

export declare const kTXNTextRectKey: number;

export declare const kThemeMenuItemScrollDownArrow: number;

export declare const bScriptLanguageMask: number;

export declare const kThemeArrowCursor: number;

export declare const kEventParamToolbarDisplaySize: number;

export declare const kScrapFlavorMaskNone: number;

export declare const kScrapFlavorMaskTranslated: number;

export declare const kHIThemeSegmentAdornmentNone: number;

export declare const kFontPanelFeatureTypesKey: interop.Pointer;

export declare const kColorPickerDialogIsMoveable: number;

export declare const typeGlyphSelector: number;

export declare const kEventSystemDisplaysAwake: number;

export declare const kThemeBrushSheetBackground: number;

export declare const kThemeListViewBackgroundBrush: number;

export declare const cDisk: number;

export declare const typeIndicatorDragConstraint: number;

export declare const enumAllOpenFolders: number;

export declare const cPreferencesWindow: number;

export declare const kEventWindowToolbarSwitchMode: number;

export declare const kEventWindowSheetOpened: number;

export declare const cSmallReal: number;

export declare const kTXNAutoScrollWhenInsertionVisible: number;

export declare const kSRRejectable: number;

export declare const kDataBrowserIconAndTextType: number;

export declare const typeIconAndMask: number;

export declare const kASSelectGetPropertyNames: number;

export declare const popupTitleExtend: number;

export declare const kURLDataAvailableEvent: number;

export declare const kEventControlHiliteChanged: number;

export declare const kWindowAlertPositionOnParentWindow: number;

export declare const kThemeSoundButtonRelease: number;

export declare const kHIWindowDepthFloat: number;

export declare const kControlBevelButtonTextAlignTag: number;

export declare const kURLNoAutoRedirectFlag: number;

export declare const kEventParamInkGestureKind: number;

export declare const kTXNPageFrameType: number;

export declare const DRAWHook: number;

export declare const kHIWindowBitHideOnFullScreen: number;

export declare const kEventParamTabletPointRec: number;

export declare const kVK_F12: number;

export declare const kUIOptionAnimateMenuBar: number;

export declare const kAHTOCTypeDeveloper: number;

export declare const kVK_Shift: number;

export declare const kDataBrowserContainerSorted: number;

export declare const kCMSetTextServiceCursor: number;

export declare const kHITransformDisabled: number;

export declare const enumInfoWindowPanel: number;

export declare const kControlPopupArrowEastProc: number;

export declare const kDataBrowserContainerSorting: number;

export declare const teFIdleWithEventLoopTimer: number;

export declare const kEventRawKeyRepeat: number;

export declare const typeCFRange: number;

export declare const kControlBevelButtonLargeBevelVariant: number;

export declare const kWindowStaggerParentWindow: number;

export declare const kDragPseudoCreatorVolumeOrDirectory: number;

export declare const kDataBrowserItemIsSelected: number;

export declare const doToggle: number;

export declare const kThemeMetricRoundTextFieldSmallContentInsetRight: number;

export declare const kEventParamToolbarItemIdentifier: number;

export declare const kThemeSoundMenuItemRelease: number;

export declare const kHIHotKeyModeAllEnabled: number;

export declare const typeEventHotKeyID: number;

export declare const kThemeMetricSmallHSliderHeight: number;

export declare const kHMBottomLeftCorner: number;

export declare const kEventControlHitTest: number;

export declare const kEventClassClockView: number;

export declare const eventHotKeyExistsErr: number;

export declare const typeSecIdentityRef: number;

export declare const kDataBrowserUniversalPropertyFlags: number;

export declare const kThemeMetricTabIndentOrStyle: number;

export declare const kDataBrowserTruncateTextAtStart: number;

export declare const floatSideGrowProc: number;

export declare const kEventFontPanelClosed: number;

export declare const kControlTriangleAutoToggleProc: number;

export declare const gestaltKBPS2Keyboards: number;

export declare const kControlKindDisclosureButton: number;

export declare const kThemeStatePressed: number;

export declare const typeIconFamily: number;

export declare const keySmall8BitMask: number;

export declare const statText: number;

export declare const kHIWindowBitNoShadow: number;

export declare const kMouseParamsDragInitiation: number;

export declare const kHIWindowBitFrameworkScaled: number;

export declare const mSizeMsg: number;

export declare const pCapacity: number;

export declare const kEventParamDeviceColor: number;

export declare const kDataBrowserUniversalPropertyFlagsMask: number;

export declare const kDragRegionAndImage: number;

export declare const kThemeMetricSmallResizeControlHeight: number;

export declare const kEventParamTSMDocAccessReplyCharacterRange: number;

export declare const kASStartsWith: number;

export declare const kAvailBoundsChangedForDisplay: number;

export declare const kEventParamEnabled: number;

export declare const kTXNJustificationTag: number;

export declare const pLabel2: number;

export declare const stopIcon: number;

export declare const kThemeTextColorWhite: number;

export declare const kControlUseJustMask: number;

export declare const kEventParamTSMDocAccessReplyCharactersPtr: number;

export declare const kWindowOpaqueRgn: number;

export declare const kCMGetInputModePaletteMenu: number;

export declare const kControlPictureNoTrackProc: number;

export declare const kThemeMetricMiniHSliderMinThumbWidth: number;

export declare const hiArchiveTypeMismatchErr: number;

export declare const kAppearanceRegionZoomBox: number;

export declare const kHIScrollViewScrollToBottom: number;

export declare const cInfoWindow: number;

export declare const keyASPrepositionOver: number;

export declare const typeClickActivationResult: number;

export declare const formUserPropertyID: number;

export declare const kEventParamTextInputSendUpdateRng: number;

export declare const kOSASelectSetDefaultTarget: number;

export declare const kControlSearchFieldCancelPart: number;

export declare const kMenuItemDataEnabled: number;

export declare const kScrapFlavorSizeUnknown: number;

export declare const cCoercion: number;

export declare const kAppearanceEventClass: number;

export declare const kThemeMetricLittleArrowsMiniHeight: number;

export declare const kHIThemeFocusRingOnly: number;

export declare const kTXNRestartAppleEventHandlersBit: number;

export declare const kGenericComponentVersion: number;

export declare const kEventControlGetIndicatorDragConstraint: number;

export declare const kThemeBrushPopupArrowPressed: number;

export declare const kTXNAlwaysWrapAtViewEdgeMask: number;

export declare const kEventMenuTargetItem: number;

export declare const kHierarchicalFontMenuOption: number;

export declare const kTXNDoFontSubstitutionBit: number;

export declare const kHIComboBoxEditTextPart: number;

export declare const kThemeShadowDialogWindow: number;

export declare const kControlBevelButtonAlignSysDirection: number;

export declare const kThemeMetricProgressBarShadowOutset: number;

export declare const kEventMenuChangeTrackingMode: number;

export declare const kWindowUnifiedTitleAndToolbarAttribute: number;

export declare const kThemeSoundScrollTrackPress: number;

export declare const kThemeInactiveUtilityWindowTitleTextColor: number;

export declare const kHIWindowBitRoundBottomBarCorners: number;

export declare const kMenuDiamondGlyph: number;

export declare const typeATSUFontID: number;

export declare const intNWidthHook: number;

export declare const kModalDialogVariantCode: number;

export declare const kControlEditUnicodeTextProc: number;

export declare const kHMOutsideLeftBottomAligned: number;

export declare const kTISPropertyInputSourceIsASCIICapable: interop.Pointer;

export declare const kASRemainder: number;

export declare const kHIViewDoesNotUseSpecialParts: number;

export declare const cPreposition: number;

export declare const kThemeMetricComboBoxLargeBottomShadowOffset: number;

export declare const kEventMenuCreateFrameView: number;

export declare const cRunningAddress: number;

export declare const typeFSVolumeRefNum: number;

export declare const kControlEditTextTEHandleTag: number;

export declare const typeAETE: number;

export declare const hiArchiveKeyNotAvailableErr: number;

export declare const pLargeButton: number;

export declare const kThemeProgressBar: number;

export declare const kTXNSupportFontCommandProcessing: number;

export declare const kVK_ANSI_J: number;

export declare const kThemeTextColorBevelButtonInactive: number;

export declare const kEventClassGesture: number;

export declare const kEventParamStartControl: number;

export declare const kWindowDefinitionVersionOne: number;

export declare const kEventParamTextInputReplyMacEncoding: number;

export declare const kDrawControlEntireControl: number;

export declare const vAxisOnly: number;

export declare const kSRCallBackParam: number;

export declare const kOSAScriptBestType: number;

export declare const eventNotInQueueErr: number;

export declare const kTXNNoFontVariations: number;

export declare const kVK_ANSI_9: number;

export declare const cContainer: number;

export declare const kIBCarbonRuntimeObjectNotOfRequestedType: number;

export declare const kTXNSelectionOn: number;

export declare const kMenuItemDataIconID: number;

export declare const kEventWindowCollapsing: number;

export declare const kControlEditTextPart: number;

export declare const kMenuContextDontUpdateKey: number;

export declare const kThemeMetricListBoxFrameOutset: number;

export declare const kCleanUpAEUT: number;

export declare const kThemeMetricFocusRectOutset: number;

export declare const kControlSupportsCalcBestRect: number;

export declare const kTXNChangeFontColorAction: number;

export declare const kEventWindowDrawerOpened: number;

export declare const errFinderCantMoveToDestination: number;

export declare const kTXNActionChangeColor: interop.Pointer;

export declare const kThemeMediumIndeterminateBar: number;

export declare const kMenuItemAttrHidden: number;

export declare const kModalWindowClass: number;

export declare const kWindowActivationScopeIndependent: number;

export declare const kVK_LeftArrow: number;

export declare const kAppearanceRegionStructure: number;

export declare const pFolder: number;

export declare const kVK_F17: number;

export declare const kEventClassToolbarItemView: number;

export declare const pSharableContainer: number;

export declare const kHMTextResContent: number;

export declare const eventClassIncorrectErr: number;

export declare const kThemeBrushPopupArrowInactive: number;

export declare const kEventParamTextInputSendTextServiceEncoding: number;

export declare const kControlKindSignatureApple: number;

export declare const kURLUploadingMask: number;

export declare const pDefaultIconViewIconSize: number;

export declare const kDataBrowserDefaultPropertyFlags: number;

export declare const kEventToolbarItemViewEnterConfigMode: number;

export declare const kControlDialogItem: number;

export declare const kDataBrowserSliderUpwardThumb: number;

export declare const kUnknownScript: number;

export declare const kThemeMetricMiniTabOverlap: number;

export declare const appendDITLBottom: number;

export declare const kControlKeyScriptBehaviorAllowAnyScript: number;

export declare const pASWeekday: number;

export declare const kOSASelectCopyID: number;

export declare const kWindowMsgDraw: number;

export declare const pIsLockedOld: number;

export declare const kEventParamWindowModifiedFlag: number;

export declare const kControlBevelButtonAlignRight: number;

export declare const kWindowSupportsModifiedBit: number;

export declare const kMenuStdMenuBarProc: number;

export declare const kEventControlRemovingSubControl: number;

export declare const kDataBrowserItemRemoved: number;

export declare const suspendResumeMessage: number;

export declare const kWindowSheetTransitionEffect: number;

export declare const typeCGFloat: number;

export declare const kThemeMetricEditTextWhitespace: number;

export declare const eventPassToNextTargetErr: number;

export declare const kEventParamTextInputReplyLineAscent: number;

export declare const scrollBarProc: number;

export declare const kAERebuildDesktopDB: number;

export declare const kHICommandOpen: number;

export declare const kControlIconSuiteProc: number;

export declare const kControlSizeMini: number;

export declare const kThemeMetricSmallPullDownHeight: number;

export declare const kWindowIsCollapsedState: number;

export declare const kEventParamGDevice: number;

export declare const cFebruary: number;

export declare const kEventMenuOpening: number;

export declare const kDataBrowserPropertyFlagsMask: number;

export declare const kAlertFlagsAlertIsMovable: number;

export declare const kThemeBottomInsideArrowPressed: number;

export declare const kThemeCheckBoxSmall: number;

export declare const kHIImageViewAutoTransformNone: number;

export declare const kDataBrowserPropertyProgressBarPart: number;

export declare const kThemeMetricTexturedSmallPushButtonHeight: number;

export declare const kThemeMetricSmallHSliderTickHeight: number;

export declare const kControlDefProcType: number;

export declare const kWindowCenterOnParentWindowScreen: number;

export declare const kTXNDrawGrowIconBit: number;

export declare const kDataBrowserItemIsEditableProperty: number;

export declare const kPageUpCharCode: number;

export declare const kControlEditUnicodeTextPasswordProc: number;

export declare const kThemeSmoothFontMinSizeTag: number;

export declare const kMenuDisposeMsg: number;

export declare const kControlGroupBoxTitleRectTag: number;

export declare const kThemeSoundCancelButtonPress: number;

export declare const kControlListBoxListHandleTag: number;

export declare const radCtrl: number;

export declare const kThemeTextColorMenuItemActive: number;

export declare const kTXNRightToLeft: number;

export declare const kThemeMetricSmallVSliderMinThumbHeight: number;

export declare const kTXNLinkNotPressed: number;

export declare const typeSmall32BitIcon: number;

export declare const kThemeSoundWindowCollapseRelease: number;

export declare const kControlGroupBoxSecondaryTextTitleProc: number;

export declare const kOSASelectComponentSpecificStart: number;

export declare const kKLName: number;

export declare const kPencilLeftUnicode: number;

export declare const kScrollWindowEraseToPortBackground: number;

export declare const kEventParamNewScrollBarVariant: number;

export declare const kHICommandCycleToolbarModeSmaller: number;

export declare const enumWhere: number;

export declare const kWindowHorizZoomDocumentProc: number;

export declare const kEventWindowGetFullScreenContentSize: number;

export declare const enumSortDirection: number;

export declare const kActivateAndHandleClick: number;

export declare const kTISCategoryPaletteInputSource: interop.Pointer;

export declare const kSRFeedbackAndListeningModes: number;

export declare const kEventControlGetPartBounds: number;

export declare const kThemeBevelButtonLarge: number;

export declare const kOSAErrorRange: number;

export declare const kControlKindHIImageView: number;

export declare const lExtendDragBit: number;

export declare const kMenuF1Glyph: number;

export declare const kThemePopupTabCenterOnWindow: number;

export declare const kControlClockDateProc: number;

export declare const kKeyboardANSI: number;

export declare const kDataBrowserAttributeAutoHideScrollBars: number;

export declare const kTXNAllCountMask: number;

export declare const kButtonDialogItem: number;

export declare const kTISNotifySelectedKeyboardInputSourceChanged: interop.Pointer;

export declare const overlayDITL: number;

export declare const kDataBrowserEditMsgSelectAll: number;

export declare const kWindowCascadeOnParentWindow: number;

export declare const kTXNVertical: number;

export declare const kHMInsideLeftCenterAligned: number;

export declare const kTXNActionChangeFontVariation: interop.Pointer;

export declare const typeWindowDefPartCode: number;

export declare const kTXNDrawItemScrollbarsMask: number;

export declare const kControlBoundsChangePositionChanged: number;

export declare const kASSourceStyleObjectSpecifier: number;

export declare const keyAEUsing: number;

export declare const addSize: number;

export declare const kControlUserPaneFocusProcTag: number;

export declare const autoKeyMask: number;

export declare const kControlKindGroupBox: number;

export declare const cObjectBeingExamined: number;

export declare const kUpdateAEUT: number;

export declare const kTranslateGetFileTranslationList: number;

export declare const kVK_ANSI_N: number;

export declare const kVK_ForwardDelete: number;

export declare const kThemeArrow7pt: number;

export declare const kColorPickerInSystemDialog: number;

export declare const kThemeActivePopupButtonTextColor: number;

export declare const kEventWindowExpandAll: number;

export declare const kEventWindowFullScreenEnterCompleted: number;

export declare const kMenuAttrAutoDisable: number;

export declare const pReverse: number;

export declare const kDataBrowserDoNotTruncateText: number;

export declare const kURLResourceFoundEvent: number;

export declare const fontPanelSelectionStyleErr: number;

export declare const kThemeWindowHasHorizontalZoom: number;

export declare const kThemeTextColorBevelButtonPressed: number;

export declare const cOctober: number;

export declare const kEventParamTextInputSendFixLen: number;

export declare const kOSASelectAvailableDialects: number;

export declare const kEventToolbarItemGetPersistentData: number;

export declare const kWindowDefHIView: number;

export declare const kDragOpaqueTranslucency: number;

export declare const kEventControlDraw: number;

export declare const kEventParamMenuPopupItem: number;

export declare const kMenuIconRefType: number;

export declare const kSupportsFileTranslation: number;

export declare const kHIViewWindowToolbarID: ControlID;

export declare const kTXNDoFontSubstitution: number;

export declare const kKLIcon: number;

export declare const kThemeMetricTexturedPushButtonHeight: number;

export declare const kDigiHubEventClass: number;

export declare const kAENoDispatch: number;

export declare const kHIDelegateAll: number;

export declare const kThemeMetricMiniTabFrameOverlap: number;

export declare const kHIViewFeatureIsOpaque: number;

export declare const kHMRightTopCorner: number;

export declare const kOSAScriptIsTypeScriptContext: number;

export declare const kGSSSelectRealToGenericID: number;

export declare const pASIt: number;

export declare const kThemeScrollBarSmall: number;

export declare const kTSMDocumentTextServicePropertyTag: number;

export declare const kWindowActivationScopeNone: number;

export declare const textMenuProc: number;

export declare const kDataBrowserItemAdded: number;

export declare const kThemeNoAdornment: number;

export declare const kWindowGroupLevelPromoted: number;

export declare const kTXNDrawItemTextAndSelectionBit: number;

export declare const kThemeSoundBevelPress: number;

export declare const kTISPropertyInputModeID: interop.Pointer;

export declare const kEventControlTrackingAreaExited: number;

export declare const kTXNDocumentAttributeCreationTimeKey: interop.Pointer;

export declare const kASMinimumVersion: number;

export declare const kWindowDialogDefProcResID: number;

export declare const kThemeMenuBarInactive: number;

export declare const kThemeMetricMenuExcludedMarkColumnWidth: number;

export declare const typeHIToolbarDisplayMode: number;

export declare const kHIWindowBehaviorStationary: number;

export declare const kStoredBasicWindowDescriptionID: number;

export declare const kHIWindowBitFullScreenPrimary: number;

export declare const kHIViewWindowZoomBoxID: ControlID;

export declare const kThemeIndeterminateBarMini: number;

export declare const kHICommandShowHideFontPanel: number;

export declare const kColorPickerAppIsColorSyncAware: number;

export declare const appearanceThemeHasNoAccents: number;

export declare const kThemeThumbPlain: number;

export declare const kEventControlEnabledStateChanged: number;

export declare const kHIThemeFrameTextFieldRoundMini: number;

export declare const kWindowAlertPositionMainScreen: number;

export declare const pViewFont: number;

export declare const kThemeBrushButtonInactiveLightShadow: number;

export declare const wDraw: number;

export declare const kHIObjectCustomDataCDEFProcIDKey: interop.Pointer;

export declare const kThemeButtonOff: number;

export declare const kThemeSoundBalloonClose: number;

export declare const kHIThemeGrowBoxSizeSmall: number;

export declare const kHIWindowBackingLocationMainMemory: number;

export declare const kTXNFlattenMoviesTag: number;

export declare const doColor: number;

export declare const kVK_ANSI_Minus: number;

export declare const kControlGroupBoxCheckBoxProc: number;

export declare const kEventParamComboBoxListSelectedItemIndex: number;

export declare const kOSAModeCantSwitchLayer: number;

export declare const kVK_PageUp: number;

export declare const kEventWindowColorSpaceChanged: number;

export declare const kThemeSoundUtilWinCollapseRelease: number;

export declare const pOwner: number;

export declare const kHICommandBringAllToFront: number;

export declare const kKLUSKeyboard: number;

export declare const kEventParamPreviousDockRect: number;

export declare const kDataBrowserEditMsgCut: number;

export declare const kTXNQDFontFamilyIDAttribute: number;

export declare const kThemeTextColorTabFrontInactive: number;

export declare const kThemeMetricRoundTextFieldSmallContentHeight: number;

export declare const errDataBrowserItemNotAdded: number;

export declare const kTXNInlineStateTag: number;

export declare const kThemeSoundUtilWinZoomExit: number;

export declare const kEventParamHIObjectInstance: number;

export declare const kDragActionGeneric: number;

export declare const pLangCode: number;

export declare const kMenuF18Glyph: number;

export declare const kVK_ANSI_Keypad1: number;

export declare const lNoDisjoint: number;

export declare const kControlKindDataBrowser: number;

export declare const checkBoxProc: number;

export declare const kThemeTextColorPlacardActive: number;

export declare const kThemeScrollBarArrowsLowerRight: number;

export declare const kOSASelectGetResumeDispatchProc: number;

export declare const kControlPopupUseWFontVariant: number;

export declare const kHICommandPaste: number;

export declare const kHMTopRightCorner: number;

export declare const kHIViewDoesNotDraw: number;

export declare const kKeyboardJIS: number;

export declare const kOSAModeDisplayForHumans: number;

export declare const kOSAScriptIsTypeScriptValue: number;

export declare const kControlSupportsFocus: number;

export declare const kDragRegionIdle: number;

export declare const kHIObjectCustomDataDelegateGroupParametersKey: interop.Pointer;

export declare const kDataBrowserClientPropertyFlagsOffset: number;

export declare const kAEEmpty: number;

export declare const kControlPopupArrowSmallEastProc: number;

export declare const kHIMenuDismissedByMouseDown: number;

export declare const kEventParamDisplayChangeFlags: number;

export declare const kOSASelectCopyScript: number;

export declare const kTextServiceDocumentInterfaceType: number;

export declare const kASComment: number;

export declare const kControlUnicode: number;

export declare const kScrapFlavorTypeMovie: number;

export declare const kTXNSizeContinuousBit: number;

export declare const pASYear: number;

export declare const kMenuCapsLockGlyph: number;

export declare const kThemeUtilityWindow: number;

export declare const kTXNOperationNotAllowedErr: number;

export declare const kURLPropertyChangedEventMask: number;

export declare const kCMUCTextServiceEvent: number;

export declare const kDataBrowserRelativeDateTime: number;

export declare const mPopUpMsg: number;

export declare const kControlTabLargeWestProc: number;

export declare const kHIToolbarItemCantBeRemoved: number;

export declare const kEventParamControlOptimalBounds: number;

export declare const kHMHelpMenuID: number;

export declare const kTISTypeKeyboardInputMethodModeEnabled: interop.Pointer;

export declare const cJune: number;

export declare const kControlClockAbsoluteTimeTag: number;

export declare const kTSMDocumentRefconPropertyTag: number;

export declare const kThemeAdornmentArrowLeftArrow: number;

export declare const kEventAppFocusNextFloatingWindow: number;

export declare const kMenuItemDataFont: number;

export declare const tsNormalSelectMode: number;

export declare const kHIThemeSegmentSizeNormal: number;

export declare const kEventTextAccepted: number;

export declare const kHIViewContentIconTypeAndCreator: number;

export declare const kThemeMetricSmallHSliderMinThumbWidth: number;

export declare const kWindowOverlayProc: number;

export declare const kEventParamSwipeDirection: number;

export declare const keyLocalPositionList: number;

export declare const kHIThemeTextVerticalFlushBottom: number;

export declare const hiArchiveEncodingCompleteErr: number;

export declare const kDataBrowserViewSpecificFlagsOffset: number;

export declare const kWindowFloatHorizZoomProc: number;

export declare const kEventControlGetData: number;

export declare const kMenuIconResourceType: number;

export declare const kEventParamDelegateGroupClasses: number;

export declare const kTXNDrawCaretWhenInactiveTag: number;

export declare const kDialogFlagsUseThemeBackground: number;

export declare const kFontSelectionQDStyleVersionZero: number;

export declare const kThemeTrackNothingToScroll: number;

export declare const kControlPopupArrowSouthProc: number;

export declare const kThemeDataFileType: number;

export declare const kEventParamCTFontDescriptor: number;

export declare const cThumbColor: number;

export declare const pASPrintDepth: number;

export declare const kHIThemeMenuDrawInfoVersionZero: number;

export declare const kURLReservedFlag: number;

export declare const kControlTabInfoTag: number;

export declare const kThemeActiveMenuItemTextColor: number;

export declare const kControlListBoxDoubleClickTag: number;

export declare const kControlImageWellPart: number;

export declare const kThemeScrollBarMedium: number;

export declare const kEventMouseButtonPrimary: number;

export declare const kThemeSoundScrollArrowEnter: number;

export declare const kThemeTextColorBevelButtonStickyInactive: number;

export declare const networkMask: number;

export declare const kEventTabletProximity: number;

export declare const kTXNDisableDragAndDropMask: number;

export declare const kCharacterPaletteInputMethodClass: number;

export declare const formAlias: number;

export declare const kThemeWindowHasDirty: number;

export declare const kAltPlainWindowClass: number;

export declare const kEventWindowShowing: number;

export declare const wInDrag: number;

export declare const kDataBrowserCheckboxType: number;

export declare const kAEPutAway: number;

export declare const kOSASelectGetDialectInfo: number;

export declare const kControlRadioButtonProc: number;

export declare const kHIThemeFocusRingBelow: number;

export declare const keyASPrepositionTo: number;

export declare const kMenuShiftGlyph: number;

export declare const cDesktop: number;

export declare const kControlScrollTextBoxAnimatingTag: number;

export declare const kTXNATSUIStyle: number;

export declare const pASTimeString: number;

export declare const kControlDisclosureButtonClosed: number;

export declare const kControlUserPaneIdleProcTag: number;

export declare const enumThisMonth: number;

export declare const keyASPrepositionGiven: number;

export declare const kThemePopupButtonSmall: number;

export declare const kThemeActiveDialogTextColor: number;

export declare const kDataBrowserLatestCallbacks: number;

export declare const wInStructure: number;

export declare const kHICommandClose: number;

export declare const kWindowFullZoomDocumentProc: number;

export declare const kMenuItemAttrAutoRepeat: number;

export declare const kThemeMetricNormalProgressBarThickness: number;

export declare const kEventParamHIArchive: number;

export declare const kHIMenuDismissedByUserCancel: number;

export declare const kThemeMenuItemAlignRight: number;

export declare const keySRSpeechResult: number;

export declare const kDragTrackingEnterWindow: number;

export declare const kThemeWindowHasToolbarButton: number;

export declare const kKLKind: number;

export declare const kHIWindowBitResizable: number;

export declare const kEventControlGetSubviewForMouseEvent: number;

export declare const kHIViewOffscreenImageUseWindowBackingResolution: number;

export declare const kWindowVertZoomGrowDocumentProc: number;

export declare const kHIThemeSegmentSizeSmall: number;

export declare const kWindowDoesNotCycleAttribute: number;

export declare const kEventWindowCloseAll: number;

export declare const mouseMovedMessage: number;

export declare const pSortDirection: number;

export declare const kControlClockTimeSecondsProc: number;

export declare const kOptionUnicode: number;

export declare const kControlPopupArrowSmallSouthProc: number;

export declare const kMenuItemDataAllDataVersionThree: number;

export declare const kHILayoutBindLeft: number;

export declare const kEventParamTextInputReplyTextAngle: number;

export declare const kHIHotKeyModeAllDisabled: number;

export declare const kVK_ANSI_G: number;

export declare const kTXNDontDrawSelectionWhenInactive: number;

export declare const kThemeLargeProgressBar: number;

export declare const pAppleMenuItemsFolder: number;

export declare const kControlClockMinuteMonthPart: number;

export declare const kDataBrowserContainerClosed: number;

export declare const kEventTSMDocumentAccessGetGlyphInfo: number;

export declare const enumLastYear: number;

export declare const kVK_ANSI_Grave: number;

export declare const kControlPopupButtonProc: number;

export declare const kHIViewAllowsSubviews: number;

export declare const kControlOpaqueMetaPart: number;

export declare const typeWindowModality: number;

export declare const kThemePushButtonMini: number;

export declare const kThemeStatePressedDown: number;

export declare const kUIOptionDisableProcessSwitch: number;

export declare const kMenuItemDataMark: number;

export declare const kMenuAttrDoNotUseUserCommandKeys: number;

export declare const kHMLeftSide: number;

export declare const kThemeVariantBaseTintTag: number;

export declare const kControlCollectionTagUnicodeTitle: number;

export declare const kAlertPlainAlert: number;

export declare const kMenuF11Glyph: number;

export declare const typeSRRecognizer: number;

export declare const kThemeMetricRoundTextFieldSmallContentInsetTop: number;

export declare const kThemeSpinningCursor: number;

export declare const kDrawerWindowClass: number;

export declare const kTXNDataOptionDocumentTypeKey: interop.Pointer;

export declare const kMenuDefClassID: number;

export declare const kOSAErrorApp: number;

export declare const kThemeButtonOn: number;

export declare const wTextColor: number;

export declare const kWindowStandardHandlerAttribute: number;

export declare const kEventParamInitParameters: number;

export declare const kMenuAppleLogoFilledGlyph: number;

export declare const kEventParamTextInputReplyPoint: number;

export declare const kURLAllBufferEventsMask: number;

export declare const kHIMenuDismissedByCancelMenuTracking: number;

export declare const kASSelectSetSourceAttributes: number;

export declare const kThemeSoundUtilWindowZoomOut: number;

export declare const pSuggestedAppPartition: number;

export declare const kHIViewContentImageFile: number;

export declare const kHICommandPageSetup: number;

export declare const alphaLock: number;

export declare const kThemeSoundSliderEndOfTrack: number;

export declare const kControlBevelButtonLastMenuTag: number;

export declare const kEventParamProcessID: number;

export declare const kHIThemeGrowBoxSizeNormal: number;

export declare const kMenuDeleteLeftGlyph: number;

export declare const kDataBrowserItemSelfIdentityProperty: number;

export declare const kThemeTextColorTabNonFrontInactive: number;

export declare const kControlFontSmallSystemFont: number;

export declare const kMenuColorIconType: number;

export declare const kOSASelectSetScriptInfo: number;

export declare const kEventControlGetScrollToHereStartPoint: number;

export declare const kControlUseSizeMask: number;

export declare const kThemeMetricLittleArrowsSmallWidth: number;

export declare const pMakeChanges: number;

export declare const cStorage: number;

export declare const kEventParamControlPreviousPart: number;

export declare const cUser: number;

export declare const kEventClassApplication: number;

export declare const bScriptMask: number;

export declare const kEventParamControlValue: number;

export declare const kControlKindEditUnicodeText: number;

export declare const kSREnabled: number;

export declare const errDataBrowserNotConfigured: number;

export declare const pASTime: number;

export declare const kAlertVariantCode: number;

export declare const kThemeWidgetZoomBox: number;

export declare const kControlAddToMetaFontMask: number;

export declare const kThemeMetricRoundTextFieldContentHeight: number;

export declare const mctLastIDIndic: number;

export declare const kHICommandRotateFloatingWindowsBackward: number;

export declare const kHICommandFromMenu: number;

export declare const kWindowSimpleFrameProc: number;

export declare const wNew: number;

export declare const kMouseTrackingMouseExited: number;

export declare const kEventServiceCopy: number;

export declare const kThemeTextColorWindowHeaderInactive: number;

export declare const kThemeMetricPopupButtonHeight: number;

export declare const pEjectable: number;

export declare const kEventClassTablet: number;

export declare const kThemeCheckBoxCheckMark: number;

export declare const kThemeSoundRadioRelease: number;

export declare const kDocumentWindowClass: number;

export declare const kThemeSoundScrollArrowExit: number;

export declare const kControlClockSecondYearPart: number;

export declare const keyMini4BitIcon: number;

export declare const kThemeBrushButtonPressedDarkShadow: number;

export declare const kEventWindowDefGetGrowImageRegion: number;

export declare const kAEIngoreBuiltInEventHandler: number;

export declare const kHIViewContentMetaPart: number;

export declare const cKeyForm: number;

export declare const kTXNStyleContinuousMask: number;

export declare const kThemePushButtonSmall: number;

export declare const clrBit: number;

export declare const kControlBevelButtonSmallBevel: number;

export declare const typeVoidPtr: number;

export declare const eventClassInvalidErr: number;

export declare const kEventControlOptimalBoundsChanged: number;

export declare const kThemeNoSounds: number;

export declare const kControlKindHIGrowBoxView: number;

export declare const kControlRelevanceBarProc: number;

export declare const kMenuPageUpGlyph: number;

export declare const teFOutlineHilite: number;

export declare const kEventAppSystemUIModeChanged: number;

export declare const cCoerceOneByteToTwoByte: number;

export declare const kWindowMsgCalculateShape: number;

export declare const kControlChasingArrowsAnimatingTag: number;

export declare const errKBFailSettingTranslationTable: number;

export declare const kControlSliderLiveFeedback: number;

export declare const kHMOutsideLeftTopAligned: number;

export declare const kHIThemeHeaderKindList: number;

export declare const kControlWantsIdle: number;

export declare const kASSourceStyleLiteral: number;

export declare const kMenuReturnR2LGlyph: number;

export declare const kOSASelectStartRecording: number;

export declare const wInToolbarButton: number;

export declare const optionKey: number;

export declare const kURLTransactionCompleteEvent: number;

export declare const kVK_ANSI_KeypadClear: number;

export declare const kVK_ANSI_RightBracket: number;

export declare const kMenuControlModifier: number;

export declare const kDataBrowserListViewSortableColumn: number;

export declare const kMouseTrackingClientEvent: number;

export declare const kASSelectCopySourceAttributes: number;

export declare const kEventWindowProxyBeginDrag: number;

export declare const osEvt: number;

export declare const kEventWindowSheetClosing: number;

export declare const kUIModeNormal: number;

export declare const kThemeTextColorMenuItemDisabled: number;

export declare const kTXNMonostyledTextBit: number;

export declare const kOSAErrorOffendingObject: number;

export declare const kDataBrowserTableViewFillHilite: number;

export declare const editText: number;

export declare const kSRDefaultRejectionLevel: number;

export declare const kHIWindowBitCompositing: number;

export declare const kTXNUnicodeTextFile: number;

export declare const kStoredWindowTitleCFStringID: number;

export declare const kControlSizeLarge: number;

export declare const kControlInactivePart: number;

export declare const kStdCFStringAlertVersionOne: number;

export declare const kControlRadioButtonCheckedValue: number;

export declare const kMenuAttrUsePencilGlyph: number;

export declare const kFormFeedCharCode: number;

export declare const kEventTSMDocumentAccessGetCharacters: number;

export declare const kDragStandardTranslucency: number;

export declare const kEventClassVolume: number;

export declare const kOSAModeDontDefine: number;

export declare const kTXNDisableDragAndDropBit: number;

export declare const kHIThemeTabPositionMiddle: number;

export declare const kThemeBrushStaticAreaFill: number;

export declare const kDataBrowserPropertyContentPart: number;

export declare const kTXNURLAttribute: number;

export declare const kTXNNoSelectionMask: number;

export declare const pCallBackNumber: number;

export declare const kCMNothingSelected: number;

export declare const kTXNWantHScrollBarMask: number;

export declare const kEventParamMenuFirstOpen: number;

export declare const altDBoxProc: number;

export declare const pInternetLocation: number;

export declare const kEventParamCGImageRef: number;

export declare const kHIWindowBitDoesNotCycle: number;

export declare const kThemeRoundButtonHelp: number;

export declare const enumPrefsLabelPanel: number;

export declare const kEventParamTextInputSendPinRng: number;

export declare const kHIViewInactivePart: number;

export declare const cApplicationProcess: number;

export declare const kThemeMetricSliderMinThumbWidth: number;

export declare const kEventOffsetToPos: number;

export declare const kControlBevelButtonGraphicAlignTag: number;

export declare const kEventParamAccessibleChild: number;

export declare const kEventTSMDocumentAccessGetSelectedRange: number;

export declare const kEventParamMenuCommandKeyBounds: number;

export declare const kWindowConstrainMoveMinimum: number;

export declare const kEventParamUnconfirmedText: number;

export declare const kThemeSoundDiskInsert: number;

export declare const kEventParamControlAction: number;

export declare const kActivateAndIgnoreClick: number;

export declare const kEventParamTextInputReplyShowHide: number;

export declare const kStopIcon: number;

export declare const kSRNotFinishedWithRejection: number;

export declare const kURLDownloadingMask: number;

export declare const kEventParamCurrentDockRect: number;

export declare const kMenuContextPullDown: number;

export declare const kThemeViewsFontTag: number;

export declare const kTXNVerticalScrollBarRectKey: number;

export declare const kThemeSoundDisclosureRelease: number;

export declare const kThemeInactiveModelessDialogTextColor: number;

export declare const kThemeBrushBevelInactiveLight: number;

export declare const kEventWindowCollapsed: number;

export declare const kASNumericStringsIgnoreMask: number;

export declare const kThemeSoundLittleArrowDnPress: number;

export declare const kThemeCountingDownHandCursor: number;

export declare const kMenuItemAttrDisabled: number;

export declare const typeAppleScript: number;

export declare const kASMagicEndTellEvent: number;

export declare const kMenuCGImageRefType: number;

export declare const kSRBlockModally: number;

export declare const kEventWindowDrawPart: number;

export declare const kHIWindowBitStandardHandler: number;

export declare const pShowKind: number;

export declare const typeCGDisplayID: number;

export declare const kEventParamPreviousDockDevice: number;

export declare const kThemePressedPopupButtonTextColor: number;

export declare const kHIViewZOrderBelow: number;

export declare const kControlTriangleLeftFacingProc: number;

export declare const kSROtherRecAlreadyModal: number;

export declare const kEventAppFocusToolbar: number;

export declare const kEventAppLaunched: number;

export declare const kOSASelectExecuteEvent: number;

export declare const kThemeTextColorDialogInactive: number;

export declare const kThemeBrushButtonFaceInactive: number;

export declare const kControlUseFaceMask: number;

export declare const kASSourceStyleDynamicProperty: number;

export declare const pRest: number;

export declare const kVK_CapsLock: number;

export declare const driverEvt: number;

export declare const kTXNTextEncodingAttributeSize: number;

export declare const kMenuItemAttrIgnoreMeta: number;

export declare const kThemeTrackHideTrack: number;

export declare const optionKeyBit: number;

export declare const kTXNSaveStylesAsSTYLResourceBit: number;

export declare const kControlNoVariant: number;

export declare const kControlUserPaneActivateProcTag: number;

export declare const kEventWindowActivated: number;

export declare const kWindowResizeTransitionAction: number;

export declare const kThemeSoundBevelExit: number;

export declare const kAvailBoundsChangedForMenuBar: number;

export declare const kURLLookingUpHostState: number;

export declare const kURLCompletedEventMask: number;

export declare const kTXNQDFontColorAttribute: number;

export declare const kTXNAutoIndentOff: number;

export declare const kHIToolbarDisplayModeIconAndLabel: number;

export declare const kThemeDisabledMenuItemTextColor: number;

export declare const kControlKeyFilterBlockKey: number;

export declare const kMenuSpaceGlyph: number;

export declare const kControlDataBrowserEditTextKeyFilterTag: number;

export declare const kTISPropertyIconRef: interop.Pointer;

export declare const kThemeWidgetCloseBox: number;

export declare const keyASSubroutineName: number;

export declare const kEventParamAccessibleAttributeSettable: number;

export declare const kDeepestColorScreen: number;

export declare const kTXNNoTSMEverMask: number;

export declare const kHILayoutBindTop: number;

export declare const kWindowAsyncDragAttribute: number;

export declare const kHIThemeSegmentKindInset: number;

export declare const kEventParamWindowPartCode: number;

export declare const kEventDelegateIsGroup: number;

export declare const errFinderLastReserved: number;

export declare const keyASPrepositionIn: number;

export declare const kUIOptionDisableMenuBarTransparency: number;

export declare const kScrapFlavorTypeUTF16External: number;

export declare const kASNotEqual: number;

export declare const kMenuHiliteItemMsg: number;

export declare const kThemeDragSoundMoveDialog: number;

export declare const kThemeAdornmentNoShadow: number;

export declare const kHISearchFieldNoAttributes: number;

export declare const kDataBrowserRevealAndCenterInView: number;

export declare const kThemeRoundButton: number;

export declare const kURLAbortInitiatedMask: number;

export declare const kThemeRadioButton: number;

export declare const kControlTriangleLastValueTag: number;

export declare const kDataBrowserColumnView: number;

export declare const kHIThemeTextBoxOptionEngraved: number;

export declare const hMenuCmd: number;

export declare const pByLabelArrangement: number;

export declare const kDataBrowserContainerIsClosableProperty: number;

export declare const kSRNotImplementedYet: number;

export declare const kEventParamAttributes: number;

export declare const kEventMenuBarShown: number;

export declare const hAxisOnly: number;

export declare const kWindowSheetAlertProc: number;

export declare const kOSASelectDoScript: number;

export declare const kTXNActionUndoLast: interop.Pointer;

export declare const kEventAccessibleSetNamedAttribute: number;

export declare const kThemeSoundCheckboxRelease: number;

export declare const kHIThemeMenuDrawInfoVersionOne: number;

export declare const kMenuItemDataCFString: number;

export declare const kHIThemeTextBoxOptionStronglyVertical: number;

export declare const kTXNAutoIndentStateTag: number;

export declare const kTXNDrawItemTextBit: number;

export declare const kControlStaticTextCFStringTag: number;

export declare const pStaggerIcons: number;

export declare const kControlPushButtonIconAlignmentTag: number;

export declare const kTXNDropAction: number;

export declare const kRadioButtonDialogItem: number;

export declare const kDataBrowserMetricDisclosureColumnEdgeInset: number;

export declare const typeCTFontRef: number;

export declare const kThemeDragSoundMoveUtilWindow: number;

export declare const kThemeTextColorBlack: number;

export declare const kASAppleScriptSuite: number;

export declare const pIsScriptable: number;

export declare const kControlEditTextTextTag: number;

export declare const kControlCollectionTagMinimum: number;

export declare const enumArrangement: number;

export declare const kTXNFullJust: number;

export declare const fontPanelShowErr: number;

export declare const kEventParamMouseChord: number;

export declare const keyAEErrorObject: number;

export declare const flavorSystemTranslated: number;

export declare const kHIViewFeatureIdlesWithTimer: number;

export declare const kEventParamTSMDocAccessReplyFontSize: number;

export declare const kHICommandRevert: number;

export declare const kEventParamTextInputSendSLRec: number;

export declare const kEventWindowGetClickActivation: number;

export declare const eventInternalErr: number;

export declare const cmdKey: number;

export declare const kThemeMetricSeparatorSize: number;

export declare const kOSASelectSetCreateProc: number;

export declare const typeRelativeTime: number;

export declare const kControlSizeAuto: number;

export declare const kDataBrowserSelectionAnchorDown: number;

export declare const kWindowDragRgn: number;

export declare const kEventParamAccessibleAttributeParameter: number;

export declare const kOSAScriptResourceType: number;

export declare const kAppearancePartPageUpArea: number;

export declare const wDispose: number;

export declare const wGrow: number;

export declare const kThemeViewsFont: number;

export declare const kThemeSoundNewItem: number;

export declare const kTXNEndOffset: number;

export declare const kHomeCharCode: number;

export declare const kHICommandQuitAndDiscardWindows: number;

export declare const kMouseParamsSticky: number;

export declare const kWindowGroupAttrLayerTogether: number;

export declare const kThemeTextColorPushButtonInactive: number;

export declare const kThemeBrushButtonInactiveDarkHighlight: number;

export declare const kEventAppGetDockTileMenu: number;

export declare const kWindowDefProcID: number;

export declare const cApplicationFile: number;

export declare const kWindowHorizontalZoomAttribute: number;

export declare const kEventMenuDispose: number;

export declare const kHIComboBoxDisclosurePart: number;

export declare const kControlKindTabs: number;

export declare const gestaltContextualMenuTrapAvailable: number;

export declare const kCMFixTextService: number;

export declare const kControlBehaviorPushbutton: number;

export declare const pByKindArrangement: number;

export declare const kOSAScriptIsTypeCompiledScript: number;

export declare const kIMKNearestBoundaryMode: number;

export declare const pMinAppPartition: number;

export declare const kEventParamControlDataBuffer: number;

export declare const kSRUsePushToTalk: number;

export declare const kControlGroupBoxTextTitleProc: number;

export declare const pShowVersion: number;

export declare const kHIToolbarItemNoAttributes: number;

export declare const pOriginalItem: number;

export declare const kAEDiacriticConsiderMask: number;

export declare const errFinderMustBeActive: number;

export declare const kEventMouseButtonTertiary: number;

export declare const kControlKindPopupButton: number;

export declare const kThemeLargeTabHeightMax: number;

export declare const kTXNActionChangeGlyphVariation: interop.Pointer;

export declare const kThemeWidgetDirtyCloseBox: number;

export declare const kTXNMacOSEncoding: number;

export declare const keyASPrepositionFrom: number;

export declare const kSRWantsAutoFBGestures: number;

export declare const kDataBrowserRevealWithoutSelecting: number;

export declare const kControlSliderReverseDirection: number;

export declare const kEventParamServiceCopyTypes: number;

export declare const kControlEditTextPasswordTag: number;

export declare const kASDefaultMinStackSize: number;

export declare const kTXNActionCountOfStyleChanges: interop.Pointer;

export declare const kScrapFlavorTypePicture: number;

export declare const kThemeWidgetCollapseBox: number;

export declare const kASSelectSetHandlerObsolete: number;

export declare const kThemeMetricVSliderWidth: number;

export declare const kHIWindowBackingLocationVideoMemory: number;

export declare const kControlPopupUseAddResMenuVariant: number;

export declare const kControlLittleArrowsProc: number;

export declare const kASSelectSetPropertyObsolete: number;

export declare const kThemeSliderMedium: number;

export declare const kTXNActionPaste: interop.Pointer;

export declare const kMenuDrawMsg: number;

export declare const kAEWhiteSpaceConsiderMask: number;

export declare const kASSourceStyleUncompiledText: number;

export declare const kEventPriorityStandard: number;

export declare const kThemeUtilityWindowTitleFont: number;

export declare const kEventToolbarDisplayModeChanged: number;

export declare const kListDefProcPtr: number;

export declare const kThemeTabNonFront: number;

export declare const kSRAlreadyReleased: number;

export declare const kThemeBrushButtonPressedDarkHighlight: number;

export declare const pShowDate: number;

export declare const kVK_ANSI_Semicolon: number;

export declare const kHIComboBoxListPixelWidthTag: number;

export declare const kControlSliderHasTickMarks: number;

export declare const kWindowModalitySystemModal: number;

export declare const kEventControlVisibilityChanged: number;

export declare const pASDays: number;

export declare const kScrollBarsAlwaysActive: number;

export declare const kEventAppFocusDrawer: number;

export declare const kThemeBrushAlertBackgroundInactive: number;

export declare const kOSASelectDisplay: number;

export declare const kControlBevelButtonCenterPopupGlyphTag: number;

export declare const kHIThemeTextHorizontalFlushCenter: number;

export declare const kThemeMetricLargeTabHeight: number;

export declare const kOSAModeCompileIntoContext: number;

export declare const kOSASelectStore: number;

export declare const kThemeMetricSmallRadioButtonWidth: number;

export declare const kListDefStandardIconType: number;

export declare const kURLDownloadingState: number;

export declare const kThemeBrushDrawerBackground: number;

export declare const pEntireContents: number;

export declare const kEventToolbarItemRemoved: number;

export declare const kAppearanceRegionDrag: number;

export declare const kMenuItemDataIndent: number;

export declare const kEventParamTextInputReplyText: number;

export declare const kEventParamDataBrowserItemState: number;

export declare const kHIModalClickIsModal: number;

export declare const kAppleLogoCharCode: number;

export declare const enumAnyDate: number;

export declare const kSRDefaultRecognitionSystemID: number;

export declare const kEventParamControlIsGhosting: number;

export declare const kThemePressedPlacardTextColor: number;

export declare const kEventParamControlParam: number;

export declare const kOSASelectSetResumeDispatchProc: number;

export declare const kHMOutsideTopScriptAligned: number;

export declare const kTXNShowWindowMask: number;

export declare const kTXNActionDrop: interop.Pointer;

export declare const pSpringOpenFolders: number;

export declare const kEventParamTSMDocAccessLockCount: number;

export declare const kControlTabLargeEastProc: number;

export declare const kWindowVerticalZoomAttribute: number;

export declare const lNoRectBit: number;

export declare const teBitClear: number;

export declare const kThemeResizeRightCursor: number;

export declare const pArePrivilegesInherited: number;

export declare const enumViewBy: number;

export declare const kThemeSoundWindowClose: number;

export declare const kEventMenuGetFrameBounds: number;

export declare const kControlTrianglePart: number;

export declare const kEventControlApplyTextColor: number;

export declare const kASSourceStyleEventName: number;

export declare const kThemeMetricScrollBarMinThumbWidth: number;

export declare const kThemeInactivePopupLabelTextColor: number;

export declare const kASPower: number;

export declare const kEventWindowTransitionStarted: number;

export declare const kWindowConstrainUseTransitionWindow: number;

export declare const pStartingUp: number;

export declare const kThemeWindowHasTitleText: number;

export declare const kEventClassDataBrowser: number;

export declare const kEventClassSystem: number;

export declare const kThemeMenuBarSelected: number;

export declare const kAEExpansion: number;

export declare const kThemeBottomOutsideArrowPressed: number;

export declare const kThemeMetricCheckBoxGlyphHeight: number;

export declare const kHIViewSupportsLiveFeedback: number;

export declare const pAboutMacintosh: number;

export declare const kEventParamTextInputSendComponentInstance: number;

export declare const kEventParamMenuItemWidth: number;

export declare const kTISCategoryInkInputSource: interop.Pointer;

export declare const typeHIObjectRef: number;

export declare const kUIModeAllHidden: number;

export declare const kWindowConstrainAllowPartial: number;

export declare const kTranslateTranslateScrap: number;

export declare const kVK_Mute: number;

export declare const kTXNFontContinuousBit: number;

export declare const kDataBrowserClientPropertyFlagsMask: number;

export declare const kVK_ANSI_KeypadEquals: number;

export declare const kControlPopupArrowSizeSmall: number;

export declare const lOnlyOneBit: number;

export declare const kThemeSliderMini: number;

export declare const kThemeTextColorPopupButtonActive: number;

export declare const kControlEditTextInlineInputProc: number;

export declare const kOSASelectCopyDisplayString: number;

export declare const kKLKCHRKind: number;

export declare const pLabelIndex: number;

export declare const errFinderIncestuousMove: number;

export declare const kControlKindHIScrollView: number;

export declare const kUIModeContentHidden: number;

export declare const kDiamondUnicode: number;

export declare const cAliasFile: number;

export declare const kEventParamMouseWheelDelta: number;

export declare const kIMJaTypingMethodRoman: number;

export declare const kControlClockLongDateTag: number;

export declare const kUserDialogItem: number;

export declare const kThemeMetricLittleArrowsMiniWidth: number;

export declare const kASSourceStyleEnumValue: number;

export declare const kEventInkGesture: number;

export declare const kTXNAutoScrollInsertionIntoView: number;

export declare const kMouseTrackingMouseMoved: number;

export declare const kTSMDocAccessEffectiveRangeAttribute: number;

export declare const kEventMouseDown: number;

export declare const lDoHAutoscrollBit: number;

export declare const typeConceptualTime: number;

export declare const kMouseParamsProxyIcon: number;

export declare const kWindowActivationScopeAll: number;

export declare const kEventControlDragReceive: number;

export declare const kMenuReturnGlyph: number;

export declare const kControlPushButtonIsTexturedTag: number;

export declare const kEventParamKeyboardType: number;

export declare const kColorPickerInApplicationDialog: number;

export declare const kControlClockIsLive: number;

export declare const kControlCollectionTagCommand: number;

export declare const kThemeDragSoundDragging: number;

export declare const kTiledOnScreen: number;

export declare const kFontPanelAttributeSizesKey: interop.Pointer;

export declare const typeHIToolbarItemRef: number;

export declare const kWindowPlainDialogProc: number;

export declare const kHIViewFocusTraditionally: number;

export declare const doFace: number;

export declare const doSize: number;

export declare const kTXNWillDefaultToATSUIMask: number;

export declare const kCMHelpItemAppleGuide: number;

export declare const kEventMenuBecomeScrollable: number;

export declare const kSRSpelling: number;

export declare const kDigiHubPictureCD: number;

export declare const kTXNUseEncodingWordRulesMask: number;

export declare const kEventParamScrapRef: number;

export declare const kEventParamDictionary: number;

export declare const kMenuItemDataIconHandle: number;

export declare const kThemeMetricRoundTextFieldContentInsetRight: number;

export declare const kWindowConstrainUseSpecifiedBounds: number;

export declare const kTXNDrawSelectionWhenInactiveTag: number;

export declare const kControlKindPicture: number;

export declare const typePasteboardRef: number;

export declare const kHIWindowBackingLocationDefault: number;

export declare const pASTab: number;

export declare const kTSMDocAccessFontSizeAttributeBit: number;

export declare const errFinderOnlyLockedItemsInTrash: number;

export declare const kWindowCenterMainScreen: number;

export declare const rightShiftKeyBit: number;

export declare const pPhysicalSize: number;

export declare const cOnlineDisk: number;

export declare const kHMCFStringLocalizedContent: number;

export declare const kEventClassMenu: number;

export declare const pGroupPrivileges: number;

export declare const kEventClassToolbar: number;

export declare const kASCurrentApplication: number;

export declare const kEventControlTitleChanged: number;

export declare const kThemeMetricRoundButtonSize: number;

export declare const kControlImageWellContentTag: number;

export declare const kControlFocusNextPart: number;

export declare const kHIWindowSharingReadWrite: number;

export declare const kThemeBrushButtonActiveDarkShadow: number;

export declare const kVK_F14: number;

export declare const kHIThemeTextInfoVersionZero: number;

export declare const cFontSuitcase: number;

export declare const kControlBevelButtonMenuDelayTag: number;

export declare const kEventParamDelegateTargetClasses: number;

export declare const kEventParamMenuMarkBounds: number;

export declare const inContent: number;

export declare const kEventParamGrafPort: number;

export declare const kEventWindowFullScreenExitStarted: number;

export declare const kThemeDialogWindow: number;

export declare const kDataBrowserNoDisjointSelection: number;

export declare const kControlTabInfoVersionOne: number;

export declare const kHIWindowTitleBarPart: number;

export declare const kZoomDecelerate: number;

export declare const picItem: number;

export declare const cCoerceRemoveWhiteSpace: number;

export declare const kStdAlertDoNotAnimateOnOther: number;

export declare const kEventWindowUpdateDockTile: number;

export declare const errFinderWindowMustBeListView: number;

export declare const kControlSupportsFlattening: number;

export declare const kWindowGroupContentsRecurse: number;

export declare const hierMenu: number;

export declare const cSharableContainer: number;

export declare const kAppearancePartLeftButton: number;

export declare const kVK_F10: number;

export declare const pFontsFolder: number;

export declare const kWindowHorizZoomGrowDocumentProc: number;

export declare const kThemeBrushScrollBarDelimiterInactive: number;

export declare const doAll: number;

export declare const cClosure: number;

export declare const kHIWindowBitNoConstrain: number;

export declare const eventNotHandledErr: number;

export declare const inProxyIcon: number;

export declare const kEventParamResult: number;

export declare const kHIViewSupportsGhosting: number;

export declare const kEventTextInputUpdateActiveInputArea: number;

export declare const kThemeTextColorBevelButtonActive: number;

export declare const kEventClassEPPC: number;

export declare const kEventAttributeMonitored: number;

export declare const kHICommandHideOthers: number;

export declare const kHIThemeTextVerticalFlushDefault: number;

export declare const kEnterCharCode: number;

export declare const kControlPopupButtonMenuRefTag: number;

export declare const kDragFlavorTypeHFS: number;

export declare const driverMask: number;

export declare const kThemeMetricSmallTabCapsWidth: number;

export declare const kThemeArrow9pt: number;

export declare const errFinderWindowNotOpen: number;

export declare const kSRBufferTooSmall: number;

export declare const pTrash: number;

export declare const kThemeClosedHandCursor: number;

export declare const kHICoordSpaceScreenPixel: number;

export declare const kEventClassTextInput: number;

export declare const kSRCanned22kHzSpeechSource: number;

export declare const kWindowEdgeRight: number;

export declare const kControlPushButtonProc: number;

export declare const kURLDoNotDeleteOnErrorFlag: number;

export declare const kControlEditTextProc: number;

export declare const kEventWindowZoomAll: number;

export declare const kThemeSoundDefaultButtonPress: number;

export declare const kAppearanceRegionTitleText: number;

export declare const kMenuNorthwestArrowGlyph: number;

export declare const kWindowFloatSideFullZoomProc: number;

export declare const kCMInputModePaletteItemHit: number;

export declare const kInsertHierarchicalMenu: number;

export declare const kTXNChangeFontSizeAction: number;

export declare const kHIViewFeatureSupportsGhosting: number;

export declare const kThemeNormalCheckBox: number;

export declare const kTXNLinkWasPressed: number;

export declare const kEventUnicodeForKeyEvent: number;

export declare const kTXNDisableLayoutAndDrawTag: number;

export declare const kFontPanelAttributeTagsKey: interop.Pointer;

export declare const kWindowSimpleProc: number;

export declare const kControlBevelButtonMenuOnBottom: number;

export declare const kThemeChasingArrowsBrush: number;

export declare const kHIThemeTabAdornmentNone: number;

export declare const kTXNSingleLevelUndoTag: number;

export declare const kScrapFlavorMaskSenderOnly: number;

export declare const kHIMenuDismissedBySelection: number;

export declare const kFontPanelFeatureSelectorsKey: interop.Pointer;

export declare const kThemeSoundUtilWinCloseRelease: number;

export declare const kMenuTabRightGlyph: number;

export declare const kHICommandIgnoreSpelling: number;

export declare const kEventWindowFocusAcquired: number;

export declare const kColorPickerCanModifyPalette: number;

export declare const kOSADontUsePhac: number;

export declare const keyASPrepositionWith: number;

export declare const kDataBrowserContainerOpened: number;

export declare const kWindowMsgDragHilite: number;

export declare const pASResult: number;

export declare const kEventToolbarItemCreateCustomView: number;

export declare const keyASPrepositionBetween: number;

export declare const kControlEditTextInlinePreUpdateProcTag: number;

export declare const kEventTextInputFilterText: number;

export declare const kHICommandRotateWindowsBackward: number;

export declare const kDragDarkerTranslucency: number;

export declare const kEventParamControlMessage: number;

export declare const kControlGroupBoxFontStyleTag: number;

export declare const popupTitleUnderline: number;

export declare const kWindowMetalAttribute: number;

export declare const kMenuDeleteRightGlyph: number;

export declare const cAccessorySuitcase: number;

export declare const kTSM23Version: number;

export declare const kThemeMetricRoundTextFieldContentInsetWithIconLeft: number;

export declare const kTrackMouseLocationOptionDontConsumeMouseUp: number;

export declare const kControlTabDirectionSouth: number;

export declare const kHMOutsideLeftCenterAligned: number;

export declare const kHIWindowBitUnifiedTitleAndToolbar: number;

export declare const kDownArrowCharCode: number;

export declare const kTXNCenter: number;

export declare const kDataBrowserSliderType: number;

export declare const kControlBevelButtonNormalBevelVariant: number;

export declare const kHIWindowBehaviorTransient: number;

export declare const kScrollBarsSyncWithFocus: number;

export declare const kDialogFontUseJustMask: number;

export declare const kMouseTrackingTimedOut: number;

export declare const kVK_ANSI_W: number;

export declare const pButtonViewArrangement: number;

export declare const kControlSliderPointsUpOrLeft: number;

export declare const kHILayoutInfoVersionZero: number;

export declare const kThemeSoundCancelButtonRelease: number;

export declare const kCMShowHelpSelected: number;

export declare const kThemeWindowHasCloseBox: number;

export declare const errFinderCorruptOpenFolderList: number;

export declare const kThemeMetricHSliderHeight: number;

export declare const typeFMFontFamily: number;

export declare const kThemeLabelFont: number;

export declare const kHIToolbarItemSendCmdToUserFocus: number;

export declare const rightControlKeyBit: number;

export declare const kEventToolbarItemEnabledStateChanged: number;

export declare const kMouseTrackingMousePressed: number;

export declare const kThemeTabNorth: number;

export declare const kDefaultColorPickerWidth: number;

export declare const kEventMenuDrawItemContent: number;

export declare const kEventParamTextInputReplyFMFont: number;

export declare const kHIScrollViewValidOptions: number;

export declare const kHIThemeOrientationNormal: number;

export declare const kDragTrackingLeaveHandler: number;

export declare const kMenuItemDataCmdVirtualKey: number;

export declare const kThemeHighlightColorTag: number;

export declare const kEventVolumeMounted: number;

export declare const kThemeScrollBarThumbNormal: number;

export declare const kOSAModePreventGetSource: number;

export declare const typeCGFloat72DPIGlobal: number;

export declare const kThemeMetricMiniPullDownHeight: number;

export declare const kMenuContextInspection: number;

export declare const kEventAppIsEventInInstantMouser: number;

export declare const kControlClockHourDayPart: number;

export declare const kThemeDrawIndicatorOnly: number;

export declare const kControlPopupArrowOrientationNorth: number;

export declare const pASTopLevelScript: number;

export declare const kControlPlacardProc: number;

export declare const kEventWindowDrawerClosing: number;

export declare const kWindowFloatHorizZoomGrowProc: number;

export declare const typeByteOffset: number;

export declare const kHIWindowBitAutoViewDragTracking: number;

export declare const kHIToolbarItemAnchoredLeft: number;

export declare const kHIViewWindowTitleID: ControlID;

export declare const kTSM15Version: number;

export declare const kWindowCanZoom: number;

export declare const kThemeMenuItemPlain: number;

export declare const kASSelectSetSourceStyles: number;

export declare const kThemeMetricMenuIndentWidth: number;

export declare const resumeFlag: number;

export declare const kThemeLargeIndeterminateBar: number;

export declare const keyASPrepositionOutOf: number;

export declare const kDataBrowserAttributeListViewDrawColumnDividers: number;

export declare const kMenuEventIncludeDisabledItems: number;

export declare const kBulletCharCode: number;

export declare const enumSharingPanel: number;

export declare const kEventToolbarItemWouldAcceptDrop: number;

export declare const kThemeListViewSortColumnBackgroundBrush: number;

export declare const mDownMask: number;

export declare const kHICommandHideToolbar: number;

export declare const kHICommandWindowListTerminator: number;

export declare const kControlKindPopupArrow: number;

export declare const kEventParamKeyCode: number;

export declare const kThemeIncDecButton: number;

export declare const mUpMask: number;

export declare const kHILayoutPositionTop: number;

export declare const kHIScrollViewScrollToTop: number;

export declare const pShowComment: number;

export declare const cMonday: number;

export declare const kThemeTextColorPushButtonPressed: number;

export declare const kStdAlertDoNotDisposeSheet: number;

export declare const kDataBrowserProgressBarType: number;

export declare const kHIScrollViewOptionsHorizScroll: number;

export declare const kTISPropertyIconImageURL: interop.Pointer;

export declare const kEventParamKeyUnicodes: number;

export declare const kTXNUseQDforImagingMask: number;

export declare const kControlContentIconRef: number;

export declare const kEventCommandProcess: number;

export declare const kDataBrowserListView: number;

export declare const kEventToolbarItemImageChanged: number;

export declare const pView: number;

export declare const kHILayoutBindNone: number;

export declare const typeHIPointScreenPixel: number;

export declare const kDataBrowserSelectOnlyOne: number;

export declare const kWindowCanCollapse: number;

export declare const kEventParamAccessibleObject: number;

export declare const kThemeBrushBlack: number;

export declare const kEventControlSetCursor: number;

export declare const kOSASelectGetCreateProc: number;

export declare const kThemeBevelButtonMedium: number;

export declare const kSRPhraseFormat: number;

export declare const kOSAErrorPartialResult: number;

export declare const kThemePlatinumFileType: number;

export declare const kThemeThumbDownward: number;

export declare const kDataBrowserItemNoProperty: number;

export declare const kVK_ANSI_Keypad2: number;

export declare const kThemeInactiveAlertBackgroundBrush: number;

export declare const keyOSADialectScriptCode: number;

export declare const kHMPascalStrContent: number;

export declare const kThemeActiveBevelButtonTextColor: number;

export declare const kThemeSoundFinderDragOffIcon: number;

export declare const highLevelEventMask: number;

export declare const kURLBinHexFileFlag: number;

export declare const kThemeGrowLeft: number;

export declare const kHICommandSave: number;

export declare const kTISPropertyInputSourceIsSelected: interop.Pointer;

export declare const kDataBrowserCmdTogglesSelection: number;

export declare const kWindowStandardFloatingAttributes: number;

export declare const inStructure: number;

export declare const pPreferencesWindow: number;

export declare const kSheetWindowClass: number;

export declare const kThemeTextColorTabNonFrontActive: number;

export declare const gestaltContextualMenuHasUnicodeSupport: number;

export declare const controlKey: number;

export declare const kDragInsideSenderApplication: number;

export declare const kEventControlSetFocusPart: number;

export declare const typeScrapRef: number;

export declare const kControlDataBrowserPart: number;

export declare const cEventIdentifier: number;

export declare const kTXNFontFeatureAction: number;

export declare const kThemeDrawerWindow: number;

export declare const kTXNActionCountOfTextChanges: interop.Pointer;

export declare const kEventControlDispose: number;

export declare const kControlIconRefProc: number;

export declare const kAppearancePartUpButton: number;

export declare const kThemeBrushModelessDialogBackgroundInactive: number;

export declare const kHIWindowVisibleInAllSpaces: number;

export declare const kHIViewFocusNoPart: number;

export declare const kTXNClearTheseFontFeatures: number;

export declare const kMenuDrawItemsMsg: number;

export declare const kOSASelectGetCurrentDialect: number;

export declare const kEventAppFrontSwitched: number;

export declare const kThemeBevelButtonSmall: number;

export declare const kTXNEnableLayoutAndDraw: number;

export declare const kEventGestureRotate: number;

export declare const kControlClockTimeProc: number;

export declare const kTXNSupportEditCommandUpdating: number;

export declare const kHICommandSelectWindow: number;

export declare const pInherits: number;

export declare const kMenuOptionGlyph: number;

export declare const kControlPropertyPersistent: number;

export declare const typeCTFontDescriptorRef: number;

export declare const kControlPushButLeftIconProc: number;

export declare const kThemeSoundWindowCollapseExit: number;

export declare const kTXNRichTextFormatData: number;

export declare const pContentSpace: number;

export declare const cConstant: number;

export declare const kThemePopupTabNormalPosition: number;

export declare const kControlCollectionTagValue: number;

export declare const kEndCharCode: number;

export declare const kThemeAdornmentHeaderMenuButton: number;

export declare const kVK_F11: number;

export declare const kHIImageViewAutoTransformOnDisable: number;

export declare const kWindowCanBeVisibleWithoutLoginAttribute: number;

export declare const kKeyboardInputMethodClass: number;

export declare const kThemeAdornmentShadowOnly: number;

export declare const kWindowHasTitleBar: number;

export declare const kEventClassHIComboBox: number;

export declare const kControlScrollTextBoxDelayBeforeAutoScrollTag: number;

export declare const kWindowGroupAttrSelectAsLayer: number;

export declare const kThemeSoundWindowCollapseDown: number;

export declare const kThemeMenuItemMarkFont: number;

export declare const kControlCollectionTagBounds: number;

export declare const kThemeMetricMiniDisclosureButtonWidth: number;

export declare const kEventParamTextInputReplyLineHeight: number;

export declare const kASDefaultMaxStackSize: number;

export declare const keyASPrepositionUntil: number;

export declare const kHICommandCut: number;

export declare const kDataBrowserContainerAliasIDProperty: number;

export declare const kEventParamMenuType: number;

export declare const kThemeMetricRoundTextFieldSmallContentInsetBottom: number;

export declare const kHICommandAppHelp: number;

export declare const kWindowGroupAttrSharedActivation: number;

export declare const kAEHyphensConsiderMask: number;

export declare const kMouseTrackingMouseReleased: number;

export declare const kWindowFullZoomAttribute: number;

export declare const kMenuEjectGlyph: number;

export declare const kVK_JIS_Kana: number;

export declare const kHIMenuDismissedByActivationChange: number;

export declare const kCMInitiateTextService: number;

export declare const kASErrorEventCode: number;

export declare const kDialogFontUseFontMask: number;

export declare const pCompletelyExpanded: number;

export declare const kEventParamViewSize: number;

export declare const kDataBrowserDateTimeDateOnly: number;

export declare const kEventClassTextField: number;

export declare const kThemeInactiveAlertTextColor: number;

export declare const enumGeneralPanel: number;

export declare const kThemeSoundPopupRelease: number;

export declare const kAppearanceRegionTitleBar: number;

export declare const kControlDisabledPart: number;

export declare const kHIThemeTabPositionOnly: number;

export declare const kFlavorTypeUnicodeClippingFilename: number;

export declare const kEventWindowGetDockTileMenu: number;

export declare const kControlBevelButtonMenuValueTag: number;

export declare const cMarch: number;

export declare const kEventParamModalWindow: number;

export declare const btnStateBit: number;

export declare const kControlThemeTextTruncationTag: number;

export declare const kControlIconPart: number;

export declare const kAEIgnoreSysEventHandler: number;

export declare const kControlScrollTextBoxContentsTag: number;

export declare const kEventWindowDefModified: number;

export declare const kVK_ANSI_X: number;

export declare const btnCtrl: number;

export declare const kMenuContextDontUpdateEnabled: number;

export declare const pCanConnect: number;

export declare const kEventAppAvailableWindowBoundsChanged: number;

export declare const kEventControlTrackingAreaEntered: number;

export declare const kOSANoDispatch: number;

export declare const kTSMDocumentTSMTEPropertyTag: number;

export declare const kUIOptionDisableSessionTerminate: number;

export declare const kHIWindowDepthInvalid: number;

export declare const kThemeResizeUpCursor: number;

export declare const kWindowStateTitleChanged: number;

export declare const kEventAppTerminated: number;

export declare const kColorPickerDialogIsModal: number;

export declare const type4BitIcon: number;

export declare const kEventWindowClose: number;

export declare const kThemeMetricDisclosureTriangleWidth: number;

export declare const cAugust: number;

export declare const kFontPanelAttributeValuesKey: interop.Pointer;

export declare const kEventWindowRestoredAfterRelaunch: number;

export declare const kAEExpansionIgnoreMask: number;

export declare const kThemeStateUnavailable: number;

export declare const kHILayoutBindMin: number;

export declare const cList: number;

export declare const type8BitMask: number;

export declare const kVK_ANSI_Equal: number;

export declare const kSRListenKeyName: number;

export declare const teWordSelect: number;

export declare const kEventWindowGetIdealStandardState: number;

export declare const keyASPrepositionApartFrom: number;

export declare const kHIThemeTextInfoVersionOne: number;

export declare const eventHotKeyInvalidErr: number;

export declare const kEventToolbarBeginMultiChange: number;

export declare const kMenuItemAttrNotPreviousAlternate: number;

export declare const enumAllDocuments: number;

export declare const kHIModalClickRaiseWindow: number;

export declare const kEventControlDragWithin: number;

export declare const kHelpTagEventHandlerTag: number;

export declare const kPencilUnicode: number;

export declare const kHIThemeGroupBoxKindPrimaryOpaque: number;

export declare const kControlContentICONRes: number;

export declare const kThemeDisclosureLeft: number;

export declare const kSRCleanupOnClientExit: number;

export declare const kEventWindowDefStateChanged: number;

export declare const kControlWindowHeaderIsListHeaderTag: number;

export declare const kEventParamEventRef: number;

export declare const kThemeMetricRadioButtonHeight: number;

export declare const kControlRoundButtonSizeTag: number;

export declare const kThemeMetricRoundTextFieldContentInsetBottom: number;

export declare const kDragBehaviorZoomBackAnimation: number;

export declare const kControlSeparatorLineProc: number;

export declare const kThemeBrushDialogBackgroundActive: number;

export declare const kControlContentICON: number;

export declare const kASScriptEditorSuite: number;

export declare const kThemeSoundTabExit: number;

export declare const kEventWindowConstrain: number;

export declare const cListRecordOrString: number;

export declare const kOSASelectSetSendProc: number;

export declare const kCMGetScriptLangSupport: number;

export declare const kEventVolumeUnmounted: number;

export declare const kHighLevelEvent: number;

export declare const kEventParamMouseWheelAxis: number;

export declare const kHIModalClickAllowEvent: number;

export declare const kControlTabSmallEastProc: number;

export declare const kEventPriorityLow: number;

export declare const pFontsFolderPreAllegro: number;

export declare const errFinderUnknownUser: number;

export declare const kHIScrollViewScrollToLeft: number;

export declare const kThemePopupWindow: number;

export declare const kControlInvertsUpDownValueMeaning: number;

export declare const popupTitleNoStyle: number;

export declare const kTXNImageWithQDBit: number;

export declare const kMenuF14Glyph: number;

export declare const kEventControlDragEnter: number;

export declare const kThemeSoundTrackFileType: number;

export declare const kEventKeyModifierFnBit: number;

export declare const kHIWindowBitAutoCalibration: number;

export declare const keyASPrepositionWithout: number;

export declare const kThemeMetricSmallProgressBarThickness: number;

export declare const kHICommandShowToolbar: number;

export declare const keyASPrepositionBelow: number;

export declare const kWindowHideTransitionAction: number;

export declare const eventDeferAccessibilityEventErr: number;

export declare const kMenuControlISOGlyph: number;

export declare const kTXNDocumentAttributeEditorKey: interop.Pointer;

export declare const kEventParamHIViewTrackingArea: number;

export declare const kThemeDragSoundGrowWindow: number;

export declare const kSRWantsResultTextDrawn: number;

export declare const kMenuPencilGlyph: number;

export declare const kControlKindIcon: number;

export declare const kTXNQDFontSizeAttributeSize: number;

export declare const keyAEReplacing: number;

export declare const kWindowMsgModified: number;

export declare const kASSelectGetProperty: number;

export declare const kEventGestureEnded: number;

export declare const kHIThemeSegmentSizeMini: number;

export declare const kEventParamTransactionID: number;

export declare const kWindowSheetAlertDefProcResID: number;

export declare const kWindowFloatSideVertZoomGrowProc: number;

export declare const kControlKeyFilterPassKey: number;

export declare const kCalibratorNamePrefix: number;

export declare const kThemeMetricLittleArrowsHeight: number;

export declare const kMenuContextMenuEnabling: number;

export declare const typeHISize72DPIGlobal: number;

export declare const kFontPanelBackgroundColorAttributeName: interop.Pointer;

export declare const kASLessThan: number;

export declare const kTXNRunCountMask: number;

export declare const kDataBrowserIconType: number;

export declare const kControlNoPart: number;

export declare const enumSmallIconSize: number;

export declare const kTranslateGetScrapTranslationList: number;

export declare const kSRLMObjType: number;

export declare const enumLastWeek: number;

export declare const kHIThemeTabSizeNormal: number;

export declare const kWindowWantsDisposeAtProcessDeath: number;

export declare const kEventParamDimensions: number;

export declare const typeMenuRef: number;

export declare const kControlUsesOwningWindowsFontVariant: number;

export declare const kThemeTabFrontUnavailable: number;

export declare const kThemeWindowHasCollapseBox: number;

export declare const kDragBehaviorNone: number;

export declare const kCMTextServiceMenuSelect: number;

export declare const kControlTabDirectionWest: number;

export declare const typeDragRef: number;

export declare const kDragDoNotScaleImage: number;

export declare const type32BitIcon: number;

export declare const kHIViewFocusWithoutWrapping: number;

export declare const kWindowGroupAttrHideOnCollapse: number;

export declare const kHICommandFromWindow: number;

export declare const cListOrString: number;

export declare const kControlStaticTextTruncTag: number;

export declare const kHIToolbarCommandPressAction: number;

export declare const kVK_ANSI_7: number;

export declare const kEventWindowContextualMenuSelect: number;

export declare const kASDefaultMaxHeapSize: number;

export declare const kEventControlInvalidateForSizeChange: number;

export declare const typeCTGlyphInfoRef: number;

export declare const pDesktop: number;

export declare const kWindowHasRoundBottomBarCornersAttribute: number;

export declare const kEventControlOwningWindowChanged: number;

export declare const kControlSliderProc: number;

export declare const kThemeCustomThemesFileType: number;

export declare const kThemeTextColorAlertActive: number;

export declare const inSysWindow: number;

export declare const kThemeMetricVSliderTickWidth: number;

export declare const kHIViewFocusPrevPart: number;

export declare const kThemeTextColorPopupButtonInactive: number;

export declare const kEventCommandUpdateStatus: number;

export declare const kWindowIsOpaque: number;

export declare const kASCommentEvent: number;

export declare const kTXNSizeContinuousMask: number;

export declare const kMenuSoutheastArrowGlyph: number;

export declare const lHiliteMsg: number;

export declare const kFontSelectionQDType: number;

export declare const kThemeTabSouth: number;

export declare const kASSelectGetSourceStyles: number;

export declare const kDataBrowserItemsRemove: number;

export declare const kEventGestureStarted: number;

export declare const kThemeSoundWindowZoomEnter: number;

export declare const kThemeSoundUtilWindowClose: number;

export declare const kEventMenuEnableItems: number;

export declare const kDataBrowserItemIsDragTarget: number;

export declare const teCenter: number;

export declare const kHIViewFeatureDoesNotUseSpecialParts: number;

export declare const kDragActionAlias: number;

export declare const osMask: number;

export declare const kThemePushButtonTexturedSmall: number;

export declare const kMenuRightDoubleQuotesJapaneseGlyph: number;

export declare const kDataBrowserMetricLast: number;

export declare const kTXNEnableDragAndDrop: number;

export declare const kTXNDrawCaretWhenInactive: number;

export declare const kEventParamDelegateGroupParameters: number;

export declare const kControlGroupBoxMenuHandleTag: number;

export declare const kWindowAlertPositionOnParentWindowScreen: number;

export declare const taDstDocNeedsResourceFork: number;

export declare const kWindowMsgHitTest: number;

export declare const kThemeTopOutsideArrowPressed: number;

export declare const kThemeMetricBestListHeaderHeight: number;

export declare const kNoteIcon: number;

export declare const kEventHIObjectGetInitParameters: number;

export declare const kEventParamMenuEventOptions: number;

export declare const kMenuItemDataSubmenuHandle: number;

export declare const kThemeWindowSoundsMask: number;

export declare const kHMOutsideBottomScriptAligned: number;

export declare const kThemeMetricButtonRoundedRecessedHeight: number;

export declare const nullEvent: number;

export declare const kWindowMsgDrawGrowBox: number;

export declare const kSideFloaterVariantCode: number;

export declare const keyAll: number;

export declare const kEventWindowDefDrawPart: number;

export declare const kHICommandSelectAll: number;

export declare const kOSASelectScriptError: number;

export declare const alphaLockBit: number;

export declare const kDataBrowserItemDoubleClicked: number;

export declare const kWindowNoActivatesAttribute: number;

export declare const kSRSearchStatusParam: number;

export declare const kControlPushButtonIconOnRight: number;

export declare const kEventAppQuit: number;

export declare const kItemDisableBit: number;

export declare const kHIObjectCustomDataSuperClassIDKey: interop.Pointer;

export declare const teFInlineInput: number;

export declare const keyAETarget: number;

export declare const pKeepArranged: number;

export declare const kVK_ANSI_Z: number;

export declare const kThemeMetricRoundTextFieldSmallContentInsetWithIconLeft: number;

export declare const kEventParamTextInputReplyPointSize: number;

export declare const typeByteCount: number;

export declare const kControlKeyScriptBehaviorRequiresRoman: number;

export declare const kWindowCenterParentWindow: number;

export declare const kAETrue: number;

export declare const kEventControlFocusPartChanged: number;

export declare const kVK_F13: number;

export declare const pFileShareStartingUp: number;

export declare const diskMask: number;

export declare const cWeekday: number;

export declare const kThemeGrowRight: number;

export declare const kEventParamAccessibleAttributeName: number;

export declare const kThemeSoundWindowActivate: number;

export declare const kMouseTrackingMouseEntered: number;

export declare const kOSASelectCompileExecute: number;

export declare const kCMActivateTextService: number;

export declare const kOSASelectLoad: number;

export declare const kMenuTrademarkJapaneseGlyph: number;

export declare const kEventControlLayoutInfoChanged: number;

export declare const kEventParamControlDrawDepth: number;

export declare const kIconDialogItem: number;

export declare const kEventParamParentMenuItem: number;

export declare const kVK_ANSI_Keypad9: number;

export declare const kSRRefCon: number;

export declare const kEventWindowAttributesChanged: number;

export declare const kAEIgnoreSysPhacHandler: number;

export declare const kThemeLeftOutsideArrowPressed: number;

export declare const kURLErrorOccurredState: number;

export declare const kVK_RightArrow: number;

export declare const kEventAccessibleGetAllAttributeNames: number;

export declare const kThemeInactiveUtilityWindowBackgroundBrush: number;

export declare const kThemeMetricScrollBarOverlap: number;

export declare const kHMContentNotProvidedDontPropagate: number;

export declare const kEscapeCharCode: number;

export declare const kStdCFStringAlertVersionTwo: number;

export declare const kControlBevelButtonAlignLeft: number;

export declare const keyIconAndMask: number;

export declare const kWindowMsgMeasureTitle: number;

export declare const osEvtMessageMask: number;

export declare const kEventParamLineSize: number;

export declare const kMenuKanaGlyph: number;

export declare const kThemeBrushListViewColumnDivider: number;

export declare const kEventParamMenuIconBounds: number;

export declare const pLocal: number;

export declare const teBitSet: number;

export declare const kEventRawKeyModifiersChanged: number;

export declare const kEventParamMenuCommand: number;

export declare const kThemeMetricSmallScrollBarMinThumbHeight: number;

export declare const errFinderProgramLinkingMustBeOn: number;

export declare const kThemeBrushToolbarBackground: number;

export declare const kEventWindowDefDragHilite: number;

export declare const kEventParamMouseTrackingRef: number;

export declare const kASEndsWith: number;

export declare const kThemeTabPaneOverlap: number;

export declare const kTXNDrawSelectionWhenInactive: number;

export declare const kHICoordSpace72DPIGlobal: number;

export declare const kHIViewSupportsRadioBehavior: number;

export declare const pShouldCallBack: number;

export declare const kEventDelegateInstalled: number;

export declare const kThemeMetricSmallCheckBoxWidth: number;

export declare const kControlCollectionTagIDID: number;

export declare const taDstIsAppTranslation: number;

export declare const keyASUserRecordFields: number;

export declare const kTXNATSUIStyleContinuousBit: number;

export declare const kControlWantsActivate: number;

export declare const pIsSelected: number;

export declare const kDragInsideSenderWindow: number;

export declare const kHIToolbarNoAttributes: number;

export declare const kMenuThemeSavvyMsg: number;

export declare const kThemeSoundUtilWinDragBoundary: number;

export declare const wInContent: number;

export declare const kHIWindowSharingNone: number;

export declare const kOSAModeDontStoreParent: number;

export declare const kThemeMetricComboBoxMiniRightShadowOffset: number;

export declare const kEventWindowRestoreFromDock: number;

export declare const kControlPopupArrowSmallWestProc: number;

export declare const kMenuF17Glyph: number;

export declare const kControlClickableMetaPart: number;

export declare const hiObjectClassHasInstancesErr: number;

export declare const kEventParamFMFontStyle: number;

export declare const kEventControlClick: number;

export declare const enumAllLocalDisks: number;

export declare const kTXNSingleStylePerTextDocumentResType: number;

export declare const kControlWindowListViewHeaderProc: number;

export declare const cMay: number;

export declare const kControlKindHIMenuView: number;

export declare const kSRNotifyRecognitionBeginning: number;

export declare const pLabel5: number;

export declare const kDragStandardDropLocationUnknown: number;

export declare const kEventWindowFocusLost: number;

export declare const kThemeTextColorPopupWindowTitleInactive: number;

export declare const kHMStringResContent: number;

export declare const kThemeInactivePopupWindowTitleColor: number;

export declare const kHIWindowDragPart: number;

export declare const kEventDelegateGetTargetClasses: number;

export declare const kEventWindowResizeCompleted: number;

export declare const kCMHelpItemRemoveHelp: number;

export declare const noConstraint: number;

export declare const kTXNScrollUnitsInViewRects: number;

export declare const kControlBehaviorSticky: number;

export declare const kAppleLogoUnicode: number;

export declare const kEventParamTSMDocAccessEffectiveRange: number;

export declare const kEventParamReplacementText: number;

export declare const toggleBit: number;

export declare const kHMOutsideRightBottomAligned: number;

export declare const kTXNDocumentAttributeKeywordsKey: interop.Pointer;

export declare const kSRInternalError: number;

export declare const kThemeMetricSmallVSliderTickWidth: number;

export declare const kAECase: number;

export declare const kVK_ContextualMenu: number;

export declare const kTXNHorizontal: number;

export declare const kEventParamControlFrameMetrics: number;

export declare const kMouseTrackingMouseDown: number;

export declare const kThemeMetricRoundTextFieldMiniContentInsetRight: number;

export declare const kControlKindEditText: number;

export declare const kWindowLatentVisibleSuspend: number;

export declare const kControlTabSmallSouthProc: number;

export declare const kHIViewZOrderAbove: number;

export declare const kThemeDisabledRootMenuTextColor: number;

export declare const kEventAccessibleIsNamedAttributeSettable: number;

export declare const lUseSenseBit: number;

export declare const kTXNIOPrivilegesTag: number;

export declare const kWindowEdgeLeft: number;

export declare const typeControlFrameMetrics: number;

export declare const kWindowAlertPositionParentWindow: number;

export declare const intHitTestHook: number;

export declare const kSRNotAvailable: number;

export declare const kHIViewWindowCollapseBoxID: ControlID;

export declare const kAEIgnoreAppEventHandler: number;

export declare const kAppearancePartIndicator: number;

export declare const kMenuContextMenuBar: number;

export declare const kHIToolbarItemValidAttrs: number;

export declare const kMenuContextPopUpTracking: number;

export declare const kURLAllNonBufferEventsMask: number;

export declare const pLabel6: number;

export declare const kControlEditTextCFStringTag: number;

export declare const kControlIconProc: number;

export declare const appearanceBadCursorIndexErr: number;

export declare const kThemeMetricListHeaderHeight: number;

export declare const kMenuItemAttrUpdateSingleItem: number;

export declare const kEventKeyModifierNumLockBit: number;

export declare const kTranslatorCanGenerateFilename: number;

export declare const kVK_JIS_Underscore: number;

export declare const kEventParamWindowContentBounds: number;

export declare const rightControlKey: number;

export declare const kWindowHideOnFullScreenAttribute: number;

export declare const kEventParamFMFontFamily: number;

export declare const errFinderPropertyDoesNotApply: number;

export declare const kAEDoNotIgnoreHandler: number;

export declare const kTXNShowEnd: number;

export declare const kControlDisclosureTrianglePointLeft: number;

export declare const kThemeRightTrackPressed: number;

export declare const kEventParamInkTextRef: number;

export declare const kAEThemeSwitch: number;

export declare const kHMOutsideRightCenterAligned: number;

export declare const kWindowDefinitionVersionTwo: number;

export declare const lExtendDrag: number;

export declare const kEventWindowInit: number;

export declare const kMenuSystemIconSelectorType: number;

export declare const domWildcard: number;

export declare const kDataBrowserDateTimeTimeOnly: number;

export declare const kASNegate: number;

export declare const kHILayoutPositionMin: number;

export declare const errFinderAppFolderProtected: number;

export declare const pWarnOnEmpty: number;

export declare const kWindowStandardDocumentAttributes: number;

export declare const kThemeSoundLittleArrowEnter: number;

export declare const kTXNAlignLeftAction: number;

export declare const kThemeWindowIsCollapsed: number;

export declare const kHICommandAbout: number;

export declare const kHIComboBoxListPixelHeightTag: number;

export declare const kHMBottomSide: number;

export declare const kMenuIconSuiteType: number;

export declare const kHILayoutPositionNone: number;

export declare const kControlBoundsChangeSizeChanged: number;

export declare const kEventControlGetOptimalBounds: number;

export declare const errNeedsCompositedWindow: number;

export declare const kEventWindowFullScreenEnterStarted: number;

export declare const kUnicodeDocument: number;

export declare const kWindowPropertyPersistent: number;

export declare const kSRRecognitionDone: number;

export declare const kOSASupportsRecording: number;

export declare const cTextColor: number;

export declare const kEventParamMenuItemType: number;

export declare const keyASPrepositionAround: number;

export declare const kEventParamTextInputSendClauseRng: number;

export declare const kColorPickerCanAnimatePalette: number;

export declare const kWindowSimpleDefProcResID: number;

export declare const kThemeActivePopupArrowBrush: number;

export declare const kHIToolbarDisplaySizeDefault: number;

export declare const kThemeDesktopPictureAliasTag: number;

export declare const kHIThemeSegmentAdornmentTrailingSeparator: number;

export declare const errHMIllegalContentForMinimumState: number;

export declare const wInZoomOut: number;

export declare const kEventParamTextInputSendMouseEvent: number;

export declare const kEventParamViewAttributesDictionary: number;

export declare const kURLInitiatedEventMask: number;

export declare const kThemeSoundUtilWinCollapseExit: number;

export declare const typeHIPoint72DPIGlobal: number;

export declare const kMenuItemAttrUseVirtualKey: number;

export declare const kAEInteractWithLocal: number;

export declare const kThemeSoundCheckboxPress: number;

export declare const kHIThemeTabSizeSmall: number;

export declare const kWindowNoPosition: number;

export declare const cFolder: number;

export declare const kDataBrowserTruncateTextAtEnd: number;

export declare const kControlThemeTextVerticalFlushTag: number;

export declare const kHIThemeSegmentPositionMiddle: number;

export declare const kTranslateIdentifyScrap: number;

export declare const kEventHIObjectIsEqual: number;

export declare const kThemeMetricRoundTextFieldContentInsetLeft: number;

export declare const kHICommandHide: number;

export declare const kControlKindRoundButton: number;

export declare const kURLCompletedState: number;

export declare const kThemeLeftTrackPressed: number;

export declare const kHIScrollViewOptionsDisableSmoothScrolling: number;

export declare const kThemeAdornmentArrowDownArrow: number;

export declare const kEventParamTSMSendRefCon: number;

export declare const kTXNReadOnly: number;

export declare const kEventWindowGetMaximumSize: number;

export declare const kDialogFontUseFontNameMask: number;

export declare const kMenuContextPopUp: number;

export declare const kKLGroupIdentifier: number;

export declare const kEventParamMaximumSize: number;

export declare const updateMask: number;

export declare const kHISegmentBehaviorMomentary: number;

export declare const kEventParamDirectObject: number;

export declare const kEventTextInputGetSelectedText: number;

export declare const kHIWindowScaleModeMagnified: number;

export declare const kHIScrollViewOptionsVertScroll: number;

export declare const kThemeMetricSmallTabFrameOverlap: number;

export declare const kThemeMetricSmallTabHeight: number;

export declare const kThemeSoundCopyDone: number;

export declare const kThemeSystemFontDetail: number;

export declare const kEventParamPostOptions: number;

export declare const kControlUseAllMask: number;

export declare const kDragRegionEnd: number;

export declare const kWindowMsgStateChanged: number;

export declare const kHICommandRedo: number;

export declare const errFinderUnsupportedInsidePackages: number;

export declare const kTXNLineDirectionTag: number;

export declare const kControlIndicatorPart: number;

export declare const kControlStaticTextProc: number;

export declare const kDataBrowserTruncateTextMiddle: number;

export declare const kMenuF5Glyph: number;

export declare const kEventWindowPaint: number;

export declare const kTXNAutoScrollBehaviorTag: number;

export declare const kEventClassSearchField: number;

export declare const kControlUserItemDrawProcTag: number;

export declare const kControlRadioButtonPart: number;

export declare const kEventParamTextInputSendText: number;

export declare const kThemeStateInactive: number;

export declare const pApplicationFile: number;

export declare const eventHandlerAlreadyInstalledErr: number;

export declare const kTXNUnicodeEncoding: number;

export declare const kEventParamBounds: number;

export declare const kTXNWantVScrollBarBit: number;

export declare const kOSAComponentType: number;

export declare const kVK_ANSI_Keypad3: number;

export declare const kOSAModeDoRecord: number;

export declare const kThemeMetricRoundTextFieldMiniContentInsetWithIconRight: number;

export declare const kSRSndInSourceDisconnected: number;

export declare const kEventWindowTitleChanged: number;

export declare const kEventWindowCursorChange: number;

export declare const kTXNReadWrite: number;

export declare const kTXNDrawItemScrollbarsBit: number;

export declare const kThemeDragSoundMoveIcon: number;

export declare const intEOLHook: number;

export declare const kTXNActionClear: interop.Pointer;

export declare const kControlSliderPointsDownOrRight: number;

export declare const kThemeBackgroundWindowHeader: number;

export declare class OpaqueTXNObject {
  constructor(init?: OpaqueTXNObject);
}

export declare class OpaqueEventHandlerRef {
  constructor(init?: OpaqueEventHandlerRef);
}

export declare class HIViewKind {
  constructor(init?: HIViewKind);
  signature: number;
  kind: number;
}

export declare class TXNATSUIFeatures {
  constructor(init?: TXNATSUIFeatures);
  featureCount: number;
  featureTypes: interop.Pointer;
  featureSelectors: interop.Pointer;
}

export declare class NMRec {
  constructor(init?: NMRec);
  qLink: interop.Pointer;
  qType: number;
  nmFlags: number;
  nmPrivate: interop.Pointer;
  nmReserved: number;
  nmMark: number;
  nmIcon: interop.Pointer;
  nmSound: interop.Pointer;
  nmStr: interop.Pointer;
  nmResp: (p1: interop.PointerConvertible) => void | null;
  nmRefCon: interop.Pointer;
}

export declare class SRCallBackParam {
  constructor(init?: SRCallBackParam);
  callBack: (p1: interop.PointerConvertible) => void | null;
  refCon: interop.Pointer;
}

export declare class OpaqueFCFontDescriptorRef {
  constructor(init?: OpaqueFCFontDescriptorRef);
}

export declare class CalibratorInfo {
  constructor(init?: CalibratorInfo);
  dataSize: number;
  displayID: number;
  profileLocationSize: number;
  profileLocationPtr: interop.Pointer;
  eventProc: (p1: interop.PointerConvertible) => void | null;
  isGood: number;
}

export declare class NPMColor {
  constructor(init?: NPMColor);
  profile: interop.Pointer;
  color: CMColor;
}

export declare class BasicWindowDescription {
  constructor(init?: BasicWindowDescription);
  descriptionSize: number;
  windowContentRect: Rect;
  windowZoomRect: Rect;
  windowRefCon: interop.Pointer;
  windowStateFlags: number;
  windowPositionMethod: number;
  windowDefinitionVersion: number;
  windowDefinition: unnamed_9230533649620090995;
}

export declare class __TISInputSource {
  constructor(init?: __TISInputSource);
}

export declare class HIThemeChasingArrowsDrawInfo {
  constructor(init?: HIThemeChasingArrowsDrawInfo);
  version: number;
  state: number;
  index: number;
}

export declare class OpaqueIBNibRef {
  constructor(init?: OpaqueIBNibRef);
}

export declare class OpaqueKeyboardLayoutRef {
  constructor(init?: OpaqueKeyboardLayoutRef);
}

export declare class FileTranslationSpec {
  constructor(init?: FileTranslationSpec);
  componentSignature: number;
  translationSystemInfo: interop.Pointer;
  src: FileTypeSpec;
  dst: FileTypeSpec;
}

export declare class ScrapTypeSpec {
  constructor(init?: ScrapTypeSpec);
  format: number;
  hint: number;
}

export declare class FileTranslationList {
  constructor(init?: FileTranslationList);
  modDate: number;
  groupCount: number;
}

export declare class ListDefSpec {
  constructor(init?: ListDefSpec);
  defType: number;
  u: unnamed_15133351549658900064;
}

export declare class ListRec {
  constructor(init?: ListRec);
  rView: Rect;
  port: interop.Pointer;
  indent: Point;
  cellSize: Point;
  visible: Rect;
  vScroll: interop.Object | null;
  hScroll: interop.Object | null;
  selFlags: number;
  lActive: number;
  lReserved: number;
  listFlags: number;
  clikTime: number;
  clikLoc: Point;
  mouseLoc: Point;
  lClickLoop: () => number | null;
  lastClick: Point;
  refCon: number;
  listDefProc: interop.Pointer;
  userHandle: interop.Pointer;
  dataBounds: Rect;
  cells: interop.Pointer;
  maxIndex: number;
  cellArray: unknown /* const array */;
}

export declare class ControlEditTextSelectionRec {
  constructor(init?: ControlEditTextSelectionRec);
  selStart: number;
  selEnd: number;
}

export declare class ControlTabInfoRec {
  constructor(init?: ControlTabInfoRec);
  version: number;
  iconSuiteID: number;
  name: unknown /* const array */;
}

export declare class ControlTabEntry {
  constructor(init?: ControlTabEntry);
  icon: interop.Pointer;
  name: interop.Object | null;
  enabled: number;
}

export declare class DataBrowserAccessibilityItemInfo {
  constructor(init?: DataBrowserAccessibilityItemInfo);
  version: number;
  u: unnamed_15082188277367070764;
}

export declare class DataBrowserAccessibilityItemInfoV1 {
  constructor(init?: DataBrowserAccessibilityItemInfoV1);
  container: number;
  item: number;
  columnProperty: number;
  propertyPart: number;
  rowIndex: number;
  columnIndex: number;
}

export declare class DataBrowserListViewColumnDesc {
  constructor(init?: DataBrowserListViewColumnDesc);
  propertyDesc: DataBrowserPropertyDesc;
  headerBtnDesc: DataBrowserListViewHeaderDesc;
}

export declare class unnamed_1026251145828142037 {
  constructor(init?: unnamed_1026251145828142037);
  drawItemCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number, p7: number) => void | null;
  editTextCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number | null;
  hitTestCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  trackingCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: Point, p6: number) => number | null;
  dragRegionCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  acceptDragCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  receiveDragCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number | null;
}

export declare class DataBrowserCustomCallbacks {
  constructor(init?: DataBrowserCustomCallbacks);
  version: number;
  u: unnamed_3572299709375085477;
}

export declare class unnamed_9979202267688614400 {
  constructor(init?: unnamed_9979202267688614400);
  itemDataCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => number | null;
  itemCompareCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number | null;
  itemNotificationCallback: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  addDragItemCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number | null;
  acceptDragCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number | null;
  receiveDragCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number | null;
  postProcessDragCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void | null;
  itemHelpContentCallback: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void | null;
  getContextualMenuCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  selectContextualMenuCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number) => void | null;
}

export declare class HMHelpContent {
  constructor(init?: HMHelpContent);
  contentType: number;
  u: unnamed_1619167937236617690;
}

export declare class HMStringResType {
  constructor(init?: HMStringResType);
  hmmResID: number;
  hmmIndex: number;
}

export declare class TXNLongRect {
  constructor(init?: TXNLongRect);
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export declare class TXNMatchTextRecord {
  constructor(init?: TXNMatchTextRecord);
  iTextPtr: interop.Pointer;
  iTextToMatchLength: number;
  iTextEncoding: number;
}

export declare class TXNATSUIVariations {
  constructor(init?: TXNATSUIVariations);
  variationCount: number;
  variationAxis: interop.Pointer;
  variationValues: interop.Pointer;
}

export declare class TSMGlyphInfoArray {
  constructor(init?: TSMGlyphInfoArray);
  numGlyphInfo: number;
  glyphInfo: unknown /* const array */;
}

export declare class ScriptLanguageRecord {
  constructor(init?: ScriptLanguageRecord);
  fScript: number;
  fLanguage: number;
}

export declare class TextServiceInfo {
  constructor(init?: TextServiceInfo);
  fComponent: interop.Pointer;
  fItemName: unknown /* const array */;
}

export declare class OpaqueTSMDocumentID {
  constructor(init?: OpaqueTSMDocumentID);
}

export declare class AlertTemplate {
  constructor(init?: AlertTemplate);
  boundsRect: Rect;
  itemsID: number;
  stages: number;
}

export declare class DialogTemplate {
  constructor(init?: DialogTemplate);
  boundsRect: Rect;
  procID: number;
  visible: number;
  filler1: number;
  goAwayFlag: number;
  filler2: number;
  refCon: number;
  itemsID: number;
  title: unknown /* const array */;
}

export declare class HIAxisScale {
  constructor(init?: HIAxisScale);
  toView: interop.Object | null;
  kind: number;
  ratio: number;
}

export declare class HITypeAndCreator {
  constructor(init?: HITypeAndCreator);
  type: number;
  creator: number;
}

export declare class HIViewFrameMetrics {
  constructor(init?: HIViewFrameMetrics);
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export declare class EvQEl {
  constructor(init?: EvQEl);
  qLink: interop.Pointer;
  qType: number;
  evtQWhat: number;
  evtQMessage: number;
  evtQWhen: number;
  evtQWhere: Point;
  evtQModifiers: number;
}

export declare class HIThemeTextInfo {
  constructor(init?: HIThemeTextInfo);
  version: number;
  state: number;
  fontID: number;
  horizontalFlushness: number;
  verticalFlushness: number;
  options: number;
  truncationPosition: number;
  truncationMaxLines: number;
  truncationHappened: number;
  filler1: number;
  font: interop.Object | null;
}

export declare class SRCallBackStruct {
  constructor(init?: SRCallBackStruct);
  what: number;
  message: number;
  instance: interop.Pointer;
  status: number;
  flags: number;
  refCon: interop.Pointer;
}

export declare class HIThemeSegmentDrawInfo {
  constructor(init?: HIThemeSegmentDrawInfo);
  version: number;
  state: number;
  value: number;
  size: number;
  kind: number;
  position: number;
  adornment: number;
}

export declare class HIThemeBackgroundDrawInfo {
  constructor(init?: HIThemeBackgroundDrawInfo);
  version: number;
  state: number;
  kind: number;
}

export declare class HIThemeGrowBoxDrawInfo {
  constructor(init?: HIThemeGrowBoxDrawInfo);
  version: number;
  state: number;
  kind: number;
  direction: number;
  size: number;
}

export declare class TXNCarbonEventInfo {
  constructor(init?: TXNCarbonEventInfo);
  useCarbonEvents: number;
  filler: number;
  flags: number;
  fDictionary: interop.Object | null;
}

export declare class HIThemeScrollBarDelimitersDrawInfo {
  constructor(init?: HIThemeScrollBarDelimitersDrawInfo);
  version: number;
  state: number;
  windowType: number;
  attributes: number;
}

export declare class HIThemeGrabberDrawInfo {
  constructor(init?: HIThemeGrabberDrawInfo);
  version: number;
  state: number;
}

export declare class HIThemeTabPaneDrawInfoVersionZero {
  constructor(init?: HIThemeTabPaneDrawInfoVersionZero);
  version: number;
  state: number;
  direction: number;
  size: number;
}

export declare class HIThemeTabDrawInfo {
  constructor(init?: HIThemeTabDrawInfo);
  version: number;
  style: number;
  direction: number;
  size: number;
  adornment: number;
  kind: number;
  position: number;
}

export declare class HIThemeSplitterDrawInfo {
  constructor(init?: HIThemeSplitterDrawInfo);
  version: number;
  state: number;
  adornment: number;
}

export declare class HIThemeAnimationFrameInfo {
  constructor(init?: HIThemeAnimationFrameInfo);
  index: number;
}

export declare class HIThemeTrackDrawInfo {
  constructor(init?: HIThemeTrackDrawInfo);
  version: number;
  kind: number;
  bounds: CGRect;
  min: number;
  max: number;
  value: number;
  reserved: number;
  attributes: number;
  enableState: number;
  filler1: number;
  trackInfo: unnamed_8731871869346550225;
}

export declare class OpaqueEventHotKeyRef {
  constructor(init?: OpaqueEventHotKeyRef);
}

export declare class TabletProximityRec {
  constructor(init?: TabletProximityRec);
  vendorID: number;
  tabletID: number;
  pointerID: number;
  deviceID: number;
  systemTabletID: number;
  vendorPointerType: number;
  pointerSerialNumber: number;
  uniqueID: number;
  capabilityMask: number;
  pointerType: number;
  enterProximity: number;
}

export declare class TabletPointRec {
  constructor(init?: TabletPointRec);
  absX: number;
  absY: number;
  absZ: number;
  buttons: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  rotation: number;
  tangentialPressure: number;
  deviceID: number;
  vendor1: number;
  vendor2: number;
  vendor3: number;
}

export declare class unnamed_12419026022655666172 {
  constructor(init?: unnamed_12419026022655666172);
  menuRef: interop.Object | null;
  menuItemIndex: number;
}

export declare class HICommandExtended {
  constructor(init?: HICommandExtended);
  attributes: number;
  commandID: number;
  source: unnamed_12197809861532040615;
}

export declare class unnamed_17417303255892222079 {
  constructor(init?: unnamed_17417303255892222079);
  menuRef: interop.Object | null;
  menuItemIndex: number;
}

export declare class unnamed_4658342943099033580 {
  constructor(init?: unnamed_4658342943099033580);
  windowClass: number;
  windowAttributes: number;
}

export declare class MeasureWindowTitleRec {
  constructor(init?: MeasureWindowTitleRec);
  fullTitleWidth: number;
  titleTextWidth: number;
  isUnicodeTitle: number;
  unused: number;
}

export declare class OpaqueWindowGroupRef {
  constructor(init?: OpaqueWindowGroupRef);
}

export declare class WindowDefSpec {
  constructor(init?: WindowDefSpec);
  defType: number;
  u: unnamed_8319216960816638345;
}

export declare class IndicatorDragConstraint {
  constructor(init?: IndicatorDragConstraint);
  limitRect: Rect;
  slopRect: Rect;
  axis: number;
}

export declare class ControlFontStyleRec {
  constructor(init?: ControlFontStyleRec);
  flags: number;
  font: number;
  size: number;
  style: number;
  mode: number;
  just: number;
  foreColor: RGBColor;
  backColor: RGBColor;
}

export declare class PromiseHFSFlavor {
  constructor(init?: PromiseHFSFlavor);
  fileType: number;
  fileCreator: number;
  fdFlags: number;
  promisedFlavor: number;
}

export declare class OpaqueDragRef {
  constructor(init?: OpaqueDragRef);
}

export declare class TextStyle {
  constructor(init?: TextStyle);
  tsFont: number;
  tsFace: number;
  tsSize: number;
  tsColor: RGBColor;
}

export declare class LHElement {
  constructor(init?: LHElement);
  lhHeight: number;
  lhAscent: number;
}

export declare class StyleRun {
  constructor(init?: StyleRun);
  startChar: number;
  styleIndex: number;
}

export declare class MenuCRsrc {
  constructor(init?: MenuCRsrc);
  numEntries: number;
  mcEntryRecs: unknown /* const array */;
}

export declare class MCEntry {
  constructor(init?: MCEntry);
  mctID: number;
  mctItem: number;
  mctRGB1: RGBColor;
  mctRGB2: RGBColor;
  mctRGB3: RGBColor;
  mctRGB4: RGBColor;
  mctReserved: number;
}

export declare class MDEFDrawItemsData {
  constructor(init?: MDEFDrawItemsData);
  firstItem: number;
  lastItem: number;
  trackingData: interop.Pointer;
  context: interop.Pointer;
}

export declare class MDEFHiliteItemData {
  constructor(init?: MDEFHiliteItemData);
  previousItem: number;
  newItem: number;
  context: interop.Pointer;
}

export declare class MenuItemDataRec {
  constructor(init?: MenuItemDataRec);
  whichData: number;
  text: interop.Pointer;
  mark: string;
  cmdKey: string;
  cmdKeyGlyph: number;
  cmdKeyModifiers: number;
  style: number;
  enabled: number;
  iconEnabled: number;
  filler1: number;
  iconID: number;
  iconType: number;
  iconHandle: interop.Pointer;
  cmdID: number;
  encoding: number;
  submenuID: number;
  submenuHandle: interop.Object | null;
  fontID: number;
  refcon: interop.Pointer;
  attr: number;
  cfText: interop.Object | null;
  properties: interop.Pointer;
  indent: number;
  cmdVirtualKey: number;
  attributedText: interop.Object | null;
  font: interop.Object | null;
}

export declare class HMenuBarMenu {
  constructor(init?: HMenuBarMenu);
  menu: interop.Object | null;
  reserved: number;
}

export declare class HMenuBarHeader {
  constructor(init?: HMenuBarHeader);
  lastHMenu: number;
  menuTitleBits: interop.Pointer;
}

export declare class MenuBarHeader {
  constructor(init?: MenuBarHeader);
  lastMenu: number;
  lastRight: number;
  mbResID: number;
}

export declare class ProgressTrackInfo {
  constructor(init?: ProgressTrackInfo);
  phase: number;
}

export declare class OpaqueControlRef {
  constructor(init?: OpaqueControlRef);
}

export declare class OpaqueHIObjectRef {
  constructor(init?: OpaqueHIObjectRef);
}

export declare class OpaqueEventTargetRef {
  constructor(init?: OpaqueEventTargetRef);
}

export declare class __EventLoopTimer {
  constructor(init?: __EventLoopTimer);
}

export declare class OpaqueEventQueueRef {
  constructor(init?: OpaqueEventQueueRef);
}

export declare class OpaqueEventLoopRef {
  constructor(init?: OpaqueEventLoopRef);
}

export declare class EventTypeSpec {
  constructor(init?: EventTypeSpec);
  eventClass: number;
  eventKind: number;
}

export declare class OpaqueEventRef {
  constructor(init?: OpaqueEventRef);
}

export declare class TSMGlyphInfo {
  constructor(init?: TSMGlyphInfo);
  range: CFRange;
  fontRef: number;
  collection: number;
  glyphID: number;
}

export declare class DataBrowserListViewHeaderDesc {
  constructor(init?: DataBrowserListViewHeaderDesc);
  version: number;
  minimumWidth: number;
  maximumWidth: number;
  titleOffset: number;
  titleString: interop.Object | null;
  initialOrder: number;
  btnFontStyle: ControlFontStyleRec;
  btnContentInfo: ControlImageContentInfo;
}

export declare class MDEFDrawData {
  constructor(init?: MDEFDrawData);
  trackingData: MenuTrackingData;
  context: interop.Pointer;
}

export declare class OpaqueURLReference {
  constructor(init?: OpaqueURLReference);
}

export declare class TypeSelectRecord {
  constructor(init?: TypeSelectRecord);
  tsrLastKeyTime: number;
  tsrScript: number;
  tsrKeyStrokes: unknown /* const array */;
}

export declare class AlertStdAlertParamRec {
  constructor(init?: AlertStdAlertParamRec);
  movable: number;
  helpButton: number;
  filterProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  defaultText: interop.Pointer;
  cancelText: interop.Pointer;
  otherText: interop.Pointer;
  defaultButton: number;
  cancelButton: number;
  position: number;
}

export declare class HIThemeSeparatorDrawInfo {
  constructor(init?: HIThemeSeparatorDrawInfo);
  version: number;
  state: number;
}

export declare class PickerMenuItemInfo {
  constructor(init?: PickerMenuItemInfo);
  editMenuID: number;
  cutItem: number;
  copyItem: number;
  pasteItem: number;
  clearItem: number;
  undoItem: number;
}

export declare class SetupWindowProxyDragImageRec {
  constructor(init?: SetupWindowProxyDragImageRec);
  imageGWorld: interop.Pointer;
  imageRgn: interop.Pointer;
  outlineRgn: interop.Pointer;
}

export declare class HIThemeMenuBarDrawInfo {
  constructor(init?: HIThemeMenuBarDrawInfo);
  version: number;
  state: number;
  attributes: number;
}

export declare class TXNBackgroundData {
  constructor(init?: TXNBackgroundData);
  color: RGBColor;
}

export declare class OpaqueHIArchiveRef {
  constructor(init?: OpaqueHIArchiveRef);
}

export declare class HILayoutInfo {
  constructor(init?: HILayoutInfo);
  version: number;
  binding: HIBinding;
  scale: HIScaling;
  position: HIPositioning;
}

export declare class TXNBackground {
  constructor(init?: TXNBackground);
  bgType: number;
  bg: TXNBackgroundData;
}

export declare class StScrpRec {
  constructor(init?: StScrpRec);
  scrpNStyles: number;
  scrpStyleTab: unknown /* const array */;
}

export declare class HIThemeMenuDrawInfo {
  constructor(init?: HIThemeMenuDrawInfo);
  version: number;
  menuType: number;
  reserved1: number;
  reserved2: number;
  menuDirection: number;
  reserved3: number;
  reserved4: number;
}

export declare class HIThemeTabDrawInfoVersionZero {
  constructor(init?: HIThemeTabDrawInfoVersionZero);
  version: number;
  style: number;
  direction: number;
  size: number;
  adornment: number;
}

export declare class FontSelectionQDStyle {
  constructor(init?: FontSelectionQDStyle);
  version: number;
  instance: FMFontFamilyInstance;
  size: number;
  hasColor: number;
  reserved: number;
  color: RGBColor;
}

export declare class TransitionWindowOptions {
  constructor(init?: TransitionWindowOptions);
  version: number;
  duration: number;
  window: interop.Pointer;
  userData: interop.Pointer;
}

export declare class AlertStdCFStringAlertParamRec {
  constructor(init?: AlertStdCFStringAlertParamRec);
  version: number;
  movable: number;
  helpButton: number;
  defaultText: interop.Object | null;
  cancelText: interop.Object | null;
  otherText: interop.Object | null;
  defaultButton: number;
  cancelButton: number;
  position: number;
  flags: number;
  icon: interop.Pointer;
}

export declare class HIThemeHeaderDrawInfo {
  constructor(init?: HIThemeHeaderDrawInfo);
  version: number;
  state: number;
  kind: number;
}

export declare class ThemeTrackDrawInfo {
  constructor(init?: ThemeTrackDrawInfo);
  kind: number;
  bounds: Rect;
  min: number;
  max: number;
  value: number;
  reserved: number;
  attributes: number;
  enableState: number;
  filler1: number;
  trackInfo: unnamed_18406106730759024743;
}

export declare class URLCallbackInfo {
  constructor(init?: URLCallbackInfo);
  version: number;
  urlRef: interop.Pointer;
  property: string | null;
  currentSize: number;
  systemEvent: interop.Pointer;
}

export declare class ScrapFlavorInfo {
  constructor(init?: ScrapFlavorInfo);
  flavorType: number;
  flavorFlags: number;
}

export declare class HIScaling {
  constructor(init?: HIScaling);
  x: HIAxisScale;
  y: HIAxisScale;
}

export declare class HIThemeButtonDrawInfo {
  constructor(init?: HIThemeButtonDrawInfo);
  version: number;
  state: number;
  kind: number;
  value: number;
  adornment: number;
  animation: unnamed_7869461544095078150;
}

export declare class HMHelpContentRec {
  constructor(init?: HMHelpContentRec);
  version: number;
  absHotRect: Rect;
  tagSide: number;
  content: unknown /* const array */;
}

export declare class NullStRec {
  constructor(init?: NullStRec);
  teReserved: number;
  nullScrap: interop.Pointer;
}

export declare class ScriptLanguageSupport {
  constructor(init?: ScriptLanguageSupport);
  fScriptLanguageCount: number;
  fScriptLanguageArray: unknown /* const array */;
}

export declare class ThemeButtonDrawInfo {
  constructor(init?: ThemeButtonDrawInfo);
  state: number;
  value: number;
  adornment: number;
}

export declare class unnamed_7776070561773526988 {
  constructor(init?: unnamed_7776070561773526988);
  windowDefProc: number;
  windowHasCloseBox: number;
}

export declare class OpaqueHIObjectClassRef {
  constructor(init?: OpaqueHIObjectClassRef);
}

export declare class ScrollBarTrackInfo {
  constructor(init?: ScrollBarTrackInfo);
  viewsize: number;
  pressState: number;
}

export declare class ThemeWindowMetrics {
  constructor(init?: ThemeWindowMetrics);
  metricSize: number;
  titleHeight: number;
  titleWidth: number;
  popupTabOffset: number;
  popupTabWidth: number;
  popupTabPosition: number;
}

export declare class HIBinding {
  constructor(init?: HIBinding);
  top: HISideBinding;
  left: HISideBinding;
  bottom: HISideBinding;
  right: HISideBinding;
}

export declare class OpaquePicker {
  constructor(init?: OpaquePicker);
}

export declare class HIPositioning {
  constructor(init?: HIPositioning);
  x: HIAxisPosition;
  y: HIAxisPosition;
}

export declare class ControlKind {
  constructor(init?: ControlKind);
  signature: number;
  kind: number;
}

export declare class TERec {
  constructor(init?: TERec);
  destRect: Rect;
  viewRect: Rect;
  selRect: Rect;
  lineHeight: number;
  fontAscent: number;
  selPoint: Point;
  selStart: number;
  selEnd: number;
  active: number;
  wordBreak: (p1: string, p2: number) => number | null;
  clickLoop: (p1: interop.PointerConvertible) => number | null;
  clickTime: number;
  clickLoc: number;
  caretTime: number;
  caretState: number;
  just: number;
  teLength: number;
  hText: interop.Pointer;
  hDispatchRec: number;
  clikStuff: number;
  crOnly: number;
  txFont: number;
  txFace: number;
  txMode: number;
  txSize: number;
  inPort: interop.Pointer;
  highHook: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  caretHook: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  nLines: number;
  lineStarts: unknown /* const array */;
}

export declare class HISideBinding {
  constructor(init?: HISideBinding);
  toView: interop.Object | null;
  kind: number;
  offset: number;
}

export declare class OpaqueToolboxObjectClassRef {
  constructor(init?: OpaqueToolboxObjectClassRef);
}

export declare class HIThemeWindowWidgetDrawInfo {
  constructor(init?: HIThemeWindowWidgetDrawInfo);
  version: number;
  widgetState: number;
  widgetType: number;
  windowState: number;
  windowType: number;
  attributes: number;
  titleHeight: number;
  titleWidth: number;
}

export declare class MenuBarMenu {
  constructor(init?: MenuBarMenu);
  menu: interop.Object | null;
  menuLeft: number;
}

export declare class HICommand {
  constructor(init?: HICommand);
  attributes: number;
  commandID: number;
  menu: unnamed_17417303255892222079;
}

export declare class GetGrowImageRegionRec {
  constructor(init?: GetGrowImageRegionRec);
  growRect: Rect;
  growImageRegion: interop.Pointer;
}

export declare class TXNTypeAttributes {
  constructor(init?: TXNTypeAttributes);
  tag: number;
  size: number;
  data: TXNAttributeData;
}

export declare class TSMTERec {
  constructor(init?: TSMTERec);
  textH: interop.Pointer;
  preUpdateProc: (p1: interop.PointerConvertible, p2: number) => void | null;
  postUpdateProc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  updateFlag: number;
  refCon: number;
}

export declare class TXNTab {
  constructor(init?: TXNTab);
  value: number;
  tabType: number;
  filler: number;
}

export declare class NColorPickerInfo {
  constructor(init?: NColorPickerInfo);
  theColor: NPMColor;
  dstProfile: interop.Pointer;
  flags: number;
  placeWhere: number;
  dialogOrigin: Point;
  pickerType: number;
  colorProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  colorProcData: interop.Pointer;
  prompt: unknown /* const array */;
  mInfo: PickerMenuItemInfo;
  newColorChosen: number;
  reserved: number;
}

export declare class MDEFFindItemData {
  constructor(init?: MDEFFindItemData);
  trackingData: MenuTrackingData;
  context: interop.Pointer;
}

export declare class DataBrowserPropertyDesc {
  constructor(init?: DataBrowserPropertyDesc);
  propertyID: number;
  propertyType: number;
  propertyFlags: number;
}

export declare class FileTypeSpec {
  constructor(init?: FileTypeSpec);
  format: number;
  hint: number;
  flags: number;
  catInfoType: number;
  catInfoCreator: number;
}

export declare class DataBrowserCallbacks {
  constructor(init?: DataBrowserCallbacks);
  version: number;
  u: unnamed_15431414133122086623;
}

export declare class EventHotKeyID {
  constructor(init?: EventHotKeyID);
  signature: number;
  id: number;
}

export declare class MenuTrackingData {
  constructor(init?: MenuTrackingData);
  menu: interop.Object | null;
  itemSelected: number;
  itemUnderMouse: number;
  itemRect: Rect;
  virtualMenuTop: number;
  virtualMenuBottom: number;
}

export declare class HIThemeTabPaneDrawInfo {
  constructor(init?: HIThemeTabPaneDrawInfo);
  version: number;
  state: number;
  direction: number;
  size: number;
  kind: number;
  adornment: number;
}

export declare class TXNMargins {
  constructor(init?: TXNMargins);
  topMargin: number;
  leftMargin: number;
  bottomMargin: number;
  rightMargin: number;
}

export declare class HIThemePopupArrowDrawInfo {
  constructor(init?: HIThemePopupArrowDrawInfo);
  version: number;
  state: number;
  orientation: number;
  size: number;
}

export declare class ControlTabInfoRecV1 {
  constructor(init?: ControlTabInfoRecV1);
  version: number;
  iconSuiteID: number;
  name: interop.Object | null;
}

export declare class ScrpSTElement {
  constructor(init?: ScrpSTElement);
  scrpStartChar: number;
  scrpHeight: number;
  scrpAscent: number;
  scrpFont: number;
  scrpFace: number;
  scrpSize: number;
  scrpColor: RGBColor;
}

export declare class ContextualMenuInterfaceStruct {
  constructor(init?: ContextualMenuInterfaceStruct);
  _reserved: interop.Pointer;
  QueryInterface: (p1: interop.PointerConvertible, p2: CFUUIDBytes, p3: interop.PointerConvertible) => number | null;
  AddRef: (p1: interop.PointerConvertible) => number | null;
  Release: (p1: interop.PointerConvertible) => number | null;
  ExamineContext: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  HandleSelection: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number | null;
  PostMenuCleanup: (p1: interop.PointerConvertible) => void | null;
}

export declare class HIThemeFrameDrawInfo {
  constructor(init?: HIThemeFrameDrawInfo);
  version: number;
  kind: number;
  state: number;
  isFocused: number;
}

export declare class HIThemeMenuTitleDrawInfo {
  constructor(init?: HIThemeMenuTitleDrawInfo);
  version: number;
  state: number;
  attributes: number;
  condensedTitleExtra: number;
}

export declare class HIThemeGroupBoxDrawInfo {
  constructor(init?: HIThemeGroupBoxDrawInfo);
  version: number;
  state: number;
  kind: number;
}

export declare class OpaqueScrapRef {
  constructor(init?: OpaqueScrapRef);
}

export declare class ControlImageContentInfo {
  constructor(init?: ControlImageContentInfo);
  contentType: number;
  u: unnamed_4244627788791132852;
}

export declare class ScrapTranslationList {
  constructor(init?: ScrapTranslationList);
  modDate: number;
  groupCount: number;
}

export declare class ControlID {
  constructor(init?: ControlID);
  signature: number;
  id: number;
}

export declare class CtlCTab {
  constructor(init?: CtlCTab);
  ccSeed: number;
  ccRider: number;
  ctSize: number;
  ctTable: unknown /* const array */;
}

export declare class HIScrollBarTrackInfo {
  constructor(init?: HIScrollBarTrackInfo);
  version: number;
  enableState: number;
  pressState: number;
  viewsize: number;
}

export declare class DataBrowserAccessibilityItemInfoV0 {
  constructor(init?: DataBrowserAccessibilityItemInfoV0);
  container: number;
  item: number;
  columnProperty: number;
  propertyPart: number;
}

export declare class SliderTrackInfo {
  constructor(init?: SliderTrackInfo);
  thumbDir: number;
  pressState: number;
}

export declare class WStateData {
  constructor(init?: WStateData);
  userState: Rect;
  stdState: Rect;
}

export declare class unnamed_14351929984319882480 {
  constructor(init?: unnamed_14351929984319882480);
  classID: interop.Object | null;
  initEvent: interop.Pointer;
}

export declare class EventRecord {
  constructor(init?: EventRecord);
  what: number;
  message: number;
  when: number;
  where: Point;
  modifiers: number;
}

export declare class TextServiceList {
  constructor(init?: TextServiceList);
  fTextServiceCount: number;
  fServices: unknown /* const array */;
}

export declare class HIThemeMenuItemDrawInfo {
  constructor(init?: HIThemeMenuItemDrawInfo);
  version: number;
  itemType: number;
  state: number;
}

export declare class StandardIconListCellDataRec {
  constructor(init?: StandardIconListCellDataRec);
  iconHandle: interop.Pointer;
  font: number;
  face: number;
  size: number;
  name: unknown /* const array */;
}

export declare class HIContentBorderMetrics {
  constructor(init?: HIContentBorderMetrics);
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export declare class TEStyleRec {
  constructor(init?: TEStyleRec);
  nRuns: number;
  nStyles: number;
  styleTab: interop.Pointer;
  lhTab: interop.Pointer;
  teRefCon: number;
  nullStyle: interop.Pointer;
  runs: unknown /* const array */;
}

export declare class HIThemeAnimationTimeInfo {
  constructor(init?: HIThemeAnimationTimeInfo);
  start: number;
  current: number;
}

export declare class OpaqueMenuRef {
  constructor(init?: OpaqueMenuRef);
}

export declare class STElement {
  constructor(init?: STElement);
  stCount: number;
  stHeight: number;
  stAscent: number;
  stFont: number;
  stFace: number;
  stSize: number;
  stColor: RGBColor;
}

export declare class MenuDefSpec {
  constructor(init?: MenuDefSpec);
  defType: number;
  u: unnamed_15248615777502536500;
}

export declare class HIThemeTickMarkDrawInfo {
  constructor(init?: HIThemeTickMarkDrawInfo);
  version: number;
  state: number;
}

export declare class GetWindowRegionRec {
  constructor(init?: GetWindowRegionRec);
  winRgn: interop.Pointer;
  regionCode: number;
}

export declare class HIAxisPosition {
  constructor(init?: HIAxisPosition);
  toView: interop.Object | null;
  kind: number;
  offset: number;
}

export declare class HIThemeWindowDrawInfo {
  constructor(init?: HIThemeWindowDrawInfo);
  version: number;
  state: number;
  windowType: number;
  attributes: number;
  titleHeight: number;
  titleWidth: number;
}

export declare class OpaqueHIViewTrackingAreaRef {
  constructor(init?: OpaqueHIViewTrackingAreaRef);
}

export declare class HFSFlavor {
  constructor(init?: HFSFlavor);
  fileType: number;
  fileCreator: number;
  fdFlags: number;
  fileSpec: FSSpec;
}

export declare class HIThemeMenuDrawInfoVersionZero {
  constructor(init?: HIThemeMenuDrawInfoVersionZero);
  version: number;
  menuType: number;
}

export declare class WinCTab {
  constructor(init?: WinCTab);
  wCSeed: number;
  wCReserved: number;
  ctSize: number;
  ctTable: unknown /* const array */;
}

export declare class OpaqueEventHandlerCallRef {
  constructor(init?: OpaqueEventHandlerCallRef);
}

export declare class OpaqueSRSpeechObject {
  constructor(init?: OpaqueSRSpeechObject);
}

export declare class HIThemePlacardDrawInfo {
  constructor(init?: HIThemePlacardDrawInfo);
  version: number;
  state: number;
}

export declare class OpaqueThemeDrawingState {
  constructor(init?: OpaqueThemeDrawingState);
}

export declare class HIViewContentInfo {
  constructor(init?: HIViewContentInfo);
  contentType: number;
  u: unnamed_2304931644965025415;
}

export declare class ControlTemplate {
  constructor(init?: ControlTemplate);
  controlRect: Rect;
  controlValue: number;
  controlVisible: number;
  fill: number;
  controlMaximum: number;
  controlMinimum: number;
  controlDefProcID: number;
  controlReference: number;
  controlTitle: unknown /* const array */;
}

export type unnamed_4244627788791132852Descriptor = 
  | { resID: number }
  | { iconRef: interop.PointerConvertible }
  | { imageRef: interop.Object | null };

export declare class unnamed_4244627788791132852 {
  constructor(init?: unnamed_4244627788791132852Descriptor);
  resID: number;
  iconRef: interop.Pointer;
  imageRef: interop.Object | null;
}

export type unnamed_15133351549658900064Descriptor = 
  | { userProc: (p1: number, p2: number, p3: interop.PointerConvertible, p4: Point, p5: number, p6: number, p7: interop.PointerConvertible) => void | null };

export declare class unnamed_15133351549658900064 {
  constructor(init?: unnamed_15133351549658900064Descriptor);
  userProc: (p1: number, p2: number, p3: interop.PointerConvertible, p4: Point, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
}

export type unnamed_15082188277367070764Descriptor = 
  | { v0: DataBrowserAccessibilityItemInfoV0 }
  | { v1: DataBrowserAccessibilityItemInfoV1 };

export declare class unnamed_15082188277367070764 {
  constructor(init?: unnamed_15082188277367070764Descriptor);
  v0: DataBrowserAccessibilityItemInfoV0;
  v1: DataBrowserAccessibilityItemInfoV1;
}

export type unnamed_3572299709375085477Descriptor = 
  | { v1: unnamed_1026251145828142037 };

export declare class unnamed_3572299709375085477 {
  constructor(init?: unnamed_3572299709375085477Descriptor);
  v1: unnamed_1026251145828142037;
}

export type unnamed_15431414133122086623Descriptor = 
  | { v1: unnamed_9979202267688614400 };

export declare class unnamed_15431414133122086623 {
  constructor(init?: unnamed_15431414133122086623Descriptor);
  v1: unnamed_9979202267688614400;
}

export type unnamed_1619167937236617690Descriptor = 
  | { tagCFString: interop.Object | null }
  | { tagString: unknown /* const array */ }
  | { tagStringRes: HMStringResType }
  | { tagTEHandle: interop.PointerConvertible }
  | { tagTextRes: number }
  | { tagStrRes: number };

export declare class unnamed_1619167937236617690 {
  constructor(init?: unnamed_1619167937236617690Descriptor);
  tagCFString: interop.Object | null;
  tagString: unknown /* const array */;
  tagStringRes: HMStringResType;
  tagTEHandle: interop.Pointer;
  tagTextRes: number;
  tagStrRes: number;
}

export type TXNAttributeDataDescriptor = 
  | { dataPtr: interop.PointerConvertible }
  | { dataValue: number }
  | { atsuFeatures: interop.PointerConvertible }
  | { atsuVariations: interop.PointerConvertible }
  | { urlReference: interop.Object | null };

export declare class TXNAttributeData {
  constructor(init?: TXNAttributeDataDescriptor);
  dataPtr: interop.Pointer;
  dataValue: number;
  atsuFeatures: interop.Pointer;
  atsuVariations: interop.Pointer;
  urlReference: interop.Object | null;
}

export type TXNControlDataDescriptor = 
  | { uValue: number }
  | { sValue: number }
  | { tabValue: TXNTab }
  | { marginsPtr: interop.PointerConvertible };

export declare class TXNControlData {
  constructor(init?: TXNControlDataDescriptor);
  uValue: number;
  sValue: number;
  tabValue: TXNTab;
  marginsPtr: interop.Pointer;
}

export type unnamed_8319216960816638345Descriptor = 
  | { defProc: interop.PointerConvertible }
  | { classRef: interop.PointerConvertible }
  | { procID: number }
  | { rootView: interop.PointerConvertible };

export declare class unnamed_8319216960816638345 {
  constructor(init?: unnamed_8319216960816638345Descriptor);
  defProc: interop.Pointer;
  classRef: interop.Pointer;
  procID: number;
  rootView: interop.Pointer;
}

export type unnamed_18406106730759024743Descriptor = 
  | { scrollbar: ScrollBarTrackInfo }
  | { slider: SliderTrackInfo }
  | { progress: ProgressTrackInfo };

export declare class unnamed_18406106730759024743 {
  constructor(init?: unnamed_18406106730759024743Descriptor);
  scrollbar: ScrollBarTrackInfo;
  slider: SliderTrackInfo;
  progress: ProgressTrackInfo;
}

export type unnamed_9230533649620090995Descriptor = 
  | { versionOne: unnamed_7776070561773526988 }
  | { versionTwo: unnamed_4658342943099033580 };

export declare class unnamed_9230533649620090995 {
  constructor(init?: unnamed_9230533649620090995Descriptor);
  versionOne: unnamed_7776070561773526988;
  versionTwo: unnamed_4658342943099033580;
}

export type unnamed_12197809861532040615Descriptor = 
  | { control: interop.Object | null }
  | { window: interop.PointerConvertible }
  | { menu: unnamed_12419026022655666172 };

export declare class unnamed_12197809861532040615 {
  constructor(init?: unnamed_12197809861532040615Descriptor);
  control: interop.Object | null;
  window: interop.Pointer;
  menu: unnamed_12419026022655666172;
}

export type unnamed_7869461544095078150Descriptor = 
  | { time: HIThemeAnimationTimeInfo }
  | { frame: HIThemeAnimationFrameInfo };

export declare class unnamed_7869461544095078150 {
  constructor(init?: unnamed_7869461544095078150Descriptor);
  time: HIThemeAnimationTimeInfo;
  frame: HIThemeAnimationFrameInfo;
}

export type unnamed_15248615777502536500Descriptor = 
  | { defProc: interop.PointerConvertible }
  | { view: unnamed_14351929984319882480 };

export declare class unnamed_15248615777502536500 {
  constructor(init?: unnamed_15248615777502536500Descriptor);
  defProc: interop.Pointer;
  view: unnamed_14351929984319882480;
}

export type unnamed_2304931644965025415Descriptor = 
  | { iconRef: interop.PointerConvertible }
  | { iconTypeAndCreator: HITypeAndCreator }
  | { imageRef: interop.Object | null }
  | { imageResource: interop.Object | null }
  | { imageFile: interop.Object | null }
  | { nsImage: NSImage | null };

export declare class unnamed_2304931644965025415 {
  constructor(init?: unnamed_2304931644965025415Descriptor);
  iconRef: interop.Pointer;
  iconTypeAndCreator: HITypeAndCreator;
  imageRef: interop.Object | null;
  imageResource: interop.Object | null;
  imageFile: interop.Object | null;
  nsImage: NSImage | null;
}

export type unnamed_8731871869346550225Descriptor = 
  | { scrollbar: ScrollBarTrackInfo }
  | { slider: SliderTrackInfo }
  | { progress: ProgressTrackInfo };

export declare class unnamed_8731871869346550225 {
  constructor(init?: unnamed_8731871869346550225Descriptor);
  scrollbar: ScrollBarTrackInfo;
  slider: SliderTrackInfo;
  progress: ProgressTrackInfo;
}

export declare function HIPointConvert(ioPoint: interop.PointerConvertible, inSourceSpace: number, inSourceObject: interop.PointerConvertible, inDestinationSpace: number, inDestinationObject: interop.PointerConvertible): void;

export declare function HIRectConvert(ioRect: interop.PointerConvertible, inSourceSpace: number, inSourceObject: interop.PointerConvertible, inDestinationSpace: number, inDestinationObject: interop.PointerConvertible): void;

export declare function HISizeConvert(ioSize: interop.PointerConvertible, inSourceSpace: number, inSourceObject: interop.PointerConvertible, inDestinationSpace: number, inDestinationObject: interop.PointerConvertible): void;

export declare function GetCurrentEventLoop(): interop.Pointer;

export declare function GetMainEventLoop(): interop.Pointer;

export declare function RunCurrentEventLoop(inTimeout: number): number;

export declare function QuitEventLoop(inEventLoop: interop.PointerConvertible): number;

export declare function GetCFRunLoopFromEventLoop(inEventLoop: interop.PointerConvertible): interop.Object;

export declare function ReceiveNextEvent(inNumTypes: number, inList: interop.PointerConvertible, inTimeout: number, inPullEvent: number, outEvent: interop.PointerConvertible): number;

export declare function CreateEvent(inAllocator: interop.Object, inClassID: number, inKind: number, inWhen: number, inAttributes: number, outEvent: interop.PointerConvertible): number;

export declare function CopyEvent(inOther: interop.PointerConvertible): interop.Pointer;

export declare function CopyEventAs(inAllocator: interop.Object, inOther: interop.PointerConvertible, inEventClass: number, inEventKind: number): interop.Pointer;

export declare function RetainEvent(inEvent: interop.PointerConvertible): interop.Pointer;

export declare function GetEventRetainCount(inEvent: interop.PointerConvertible): number;

export declare function ReleaseEvent(inEvent: interop.PointerConvertible): void;

export declare function SetEventParameter(inEvent: interop.PointerConvertible, inName: number, inType: number, inSize: number, inDataPtr: interop.PointerConvertible): number;

export declare function GetEventParameter(inEvent: interop.PointerConvertible, inName: number, inDesiredType: number, outActualType: interop.PointerConvertible, inBufferSize: number, outActualSize: interop.PointerConvertible, outData: interop.PointerConvertible): number;

export declare function RemoveEventParameter(inEvent: interop.PointerConvertible, inName: number): number;

export declare function GetEventClass(inEvent: interop.PointerConvertible): number;

export declare function GetEventKind(inEvent: interop.PointerConvertible): number;

export declare function GetEventTime(inEvent: interop.PointerConvertible): number;

export declare function SetEventTime(inEvent: interop.PointerConvertible, inTime: number): number;

export declare function CreateEventWithCGEvent(inAllocator: interop.Object, inEvent: interop.Object, inAttributes: number, outEvent: interop.PointerConvertible): number;

export declare function CopyEventCGEvent(inEvent: interop.PointerConvertible): interop.Object;

export declare function GetCurrentEventQueue(): interop.Pointer;

export declare function GetMainEventQueue(): interop.Pointer;

export declare function NewEventComparatorUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number;

export declare function DisposeEventComparatorUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): void;

export declare function InvokeEventComparatorUPP(inEvent: interop.PointerConvertible, inCompareData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): number;

export declare function PostEventToQueue(inQueue: interop.PointerConvertible, inEvent: interop.PointerConvertible, inPriority: number): number;

export declare function FlushEventsMatchingListFromQueue(inQueue: interop.PointerConvertible, inNumTypes: number, inList: interop.PointerConvertible): number;

export declare function FlushSpecificEventsFromQueue(inQueue: interop.PointerConvertible, inComparator: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, inCompareData: interop.PointerConvertible): number;

export declare function FlushEventQueue(inQueue: interop.PointerConvertible): number;

export declare function FindSpecificEventInQueue(inQueue: interop.PointerConvertible, inComparator: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number, inCompareData: interop.PointerConvertible): interop.Pointer;

export declare function GetNumEventsInQueue(inQueue: interop.PointerConvertible): number;

export declare function RemoveEventFromQueue(inQueue: interop.PointerConvertible, inEvent: interop.PointerConvertible): number;

export declare function IsEventInQueue(inQueue: interop.PointerConvertible, inEvent: interop.PointerConvertible): number;

export declare function AcquireFirstMatchingEventInQueue(inQueue: interop.PointerConvertible, inNumTypes: number, inList: interop.PointerConvertible, inOptions: number): interop.Pointer;

export declare function GetCurrentEvent(): interop.Pointer;

export declare function GetCurrentEventButtonState(): number;

export declare function GetCurrentEventKeyModifiers(): number;

export declare function HIGetMousePosition(inSpace: number, inObject: interop.PointerConvertible, outPoint: interop.PointerConvertible): interop.Pointer;

export declare function GetCurrentButtonState(): number;

export declare function GetCurrentKeyModifiers(): number;

export declare function GetCurrentEventTime(): number;

export declare function NewEventLoopTimerUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

export declare function NewEventLoopIdleTimerUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void;

export declare function DisposeEventLoopTimerUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function DisposeEventLoopIdleTimerUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void): void;

export declare function InvokeEventLoopTimerUPP(inTimer: interop.Object, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function InvokeEventLoopIdleTimerUPP(inTimer: interop.Object, inState: number, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void): void;

export declare function InstallEventLoopTimer(inEventLoop: interop.PointerConvertible, inFireDelay: number, inInterval: number, inTimerProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, inTimerData: interop.PointerConvertible, outTimer: interop.PointerConvertible): number;

export declare function RemoveEventLoopTimer(inTimer: interop.Object): number;

export declare function SetEventLoopTimerNextFireTime(inTimer: interop.Object, inNextFire: number): number;

export declare function NewEventHandlerUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number;

export declare function DisposeEventHandlerUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): void;

export declare function InvokeEventHandlerUPP(inHandlerCallRef: interop.PointerConvertible, inEvent: interop.PointerConvertible, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): number;

export declare function InstallEventHandler(inTarget: interop.PointerConvertible, inHandler: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, inNumTypes: number, inList: interop.PointerConvertible, inUserData: interop.PointerConvertible, outRef: interop.PointerConvertible): number;

export declare function RemoveEventHandler(inHandlerRef: interop.PointerConvertible): number;

export declare function AddEventTypesToHandler(inHandlerRef: interop.PointerConvertible, inNumTypes: number, inList: interop.PointerConvertible): number;

export declare function RemoveEventTypesFromHandler(inHandlerRef: interop.PointerConvertible, inNumTypes: number, inList: interop.PointerConvertible): number;

export declare function CallNextEventHandler(inCallRef: interop.PointerConvertible, inEvent: interop.PointerConvertible): number;

export declare function SendEventToEventTarget(inEvent: interop.PointerConvertible, inTarget: interop.PointerConvertible): number;

export declare function SendEventToEventTargetWithOptions(inEvent: interop.PointerConvertible, inTarget: interop.PointerConvertible, inOptions: number): number;

export declare function EnableSecureEventInput(): number;

export declare function DisableSecureEventInput(): number;

export declare function IsSecureEventInputEnabled(): number;

export declare function HIObjectRegisterSubclass(inClassID: interop.Object, inBaseClassID: interop.Object, inOptions: number, inConstructProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, inNumEvents: number, inEventList: interop.PointerConvertible, inConstructData: interop.PointerConvertible, outClassRef: interop.PointerConvertible): number;

export declare function HIObjectUnregisterClass(inClassRef: interop.Object): number;

export declare function HIObjectCreate(inClassID: interop.Object, inConstructData: interop.PointerConvertible, outObject: interop.PointerConvertible): number;

export declare function HIObjectGetEventTarget(inObject: interop.Object): interop.Pointer;

export declare function HIObjectPrintDebugInfo(inObject: interop.Object): void;

export declare function HIObjectCopyClassID(inObject: interop.Object): interop.Object;

export declare function HIObjectIsOfClass(inObject: interop.Object, inObjectClassID: interop.Object): number;

export declare function HIObjectDynamicCast(inObject: interop.Object, inClassID: interop.Object): interop.Pointer;

export declare function HIObjectCreateFromBundle(inBundle: interop.Object, outObject: interop.PointerConvertible): number;

export declare function HIObjectFromEventTarget(inTarget: interop.PointerConvertible): interop.Object;

export declare function HIObjectIsArchivingIgnored(inObject: interop.Object): number;

export declare function HIObjectAddDelegate(inObject: interop.Object, inDelegate: interop.Object, inPosition: number): number;

export declare function HIObjectRemoveDelegate(inObject: interop.Object, inDelegate: interop.Object, inPosition: number): number;

export declare function HIObjectCopyDelegates(inObject: interop.Object, outDelegates: interop.PointerConvertible): number;

export declare function HIObjectGetEventHandlerObject(inRef: interop.PointerConvertible): interop.Object;

export declare function NewThemeTabTitleDrawUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void;

export declare function NewThemeEraseUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void;

export declare function NewThemeButtonDrawUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: number) => void): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: number) => void;

export declare function NewWindowTitleDrawingUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void;

export declare function NewThemeIteratorUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function DisposeThemeTabTitleDrawUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void): void;

export declare function DisposeThemeEraseUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void): void;

export declare function DisposeThemeButtonDrawUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: number) => void): void;

export declare function DisposeWindowTitleDrawingUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function DisposeThemeIteratorUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function InvokeThemeTabTitleDrawUPP(bounds: interop.PointerConvertible, style: number, direction: number, depth: number, isColorDev: number, userData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void): void;

export declare function InvokeThemeEraseUPP(bounds: interop.PointerConvertible, eraseData: interop.PointerConvertible, depth: number, isColorDev: number, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void): void;

export declare function InvokeThemeButtonDrawUPP(bounds: interop.PointerConvertible, kind: number, info: interop.PointerConvertible, userData: interop.PointerConvertible, depth: number, isColorDev: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: number) => void): void;

export declare function InvokeWindowTitleDrawingUPP(bounds: interop.PointerConvertible, depth: number, colorDevice: number, userData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function InvokeThemeIteratorUPP(inFileName: interop.PointerConvertible, resID: number, inThemeSettings: interop.PointerConvertible, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function NewMenuTitleDrawingUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void;

export declare function NewMenuItemDrawingUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void;

export declare function DisposeMenuTitleDrawingUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function DisposeMenuItemDrawingUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function InvokeMenuTitleDrawingUPP(inBounds: interop.PointerConvertible, inDepth: number, inIsColorDevice: number, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function InvokeMenuItemDrawingUPP(inBounds: interop.PointerConvertible, inDepth: number, inIsColorDevice: number, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function Button(): number;

export declare function GetKeys(theKeys: unknown /* const array */): void;

export declare function FlushEvents(whichMask: number, stopMask: number): void;

export declare function IsCmdChar(event: interop.PointerConvertible, test: number): number;

export declare function LMGetKeyThresh(): number;

export declare function LMGetKeyRepThresh(): number;

export declare function LMGetKbdLast(): number;

export declare function LMGetKbdType(): number;

export declare function GetMenuTrackingData(theMenu: interop.Object, outData: interop.PointerConvertible): number;

export declare function CMPluginExamineContext(thisInstance: interop.PointerConvertible, inContext: interop.PointerConvertible, outCommandPairs: interop.PointerConvertible): number;

export declare function CMPluginHandleSelection(thisInstance: interop.PointerConvertible, inContext: interop.PointerConvertible, inCommandID: number): number;

export declare function CMPluginPostMenuCleanup(thisInstance: interop.PointerConvertible): void;

export declare function NewHighHookUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

export declare function NewEOLHookUPP(userRoutine: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number;

export declare function NewCaretHookUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

export declare function NewWidthHookUPP(userRoutine: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number;

export declare function NewTextWidthHookUPP(userRoutine: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number;

export declare function NewNWidthHookUPP(userRoutine: (p1: number, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible) => number): (p1: number, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible) => number;

export declare function NewDrawHookUPP(userRoutine: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void;

export declare function NewHitTestHookUPP(userRoutine: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number): (p1: number, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number;

export declare function NewTEFindWordUPP(userRoutine: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void;

export declare function NewTERecalcUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void;

export declare function NewTEDoTextUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void;

export declare function NewTEClickLoopUPP(userRoutine: (p1: interop.PointerConvertible) => number): (p1: interop.PointerConvertible) => number;

export declare function DisposeHighHookUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function DisposeEOLHookUPP(userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): void;

export declare function DisposeCaretHookUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function DisposeWidthHookUPP(userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function DisposeTextWidthHookUPP(userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function DisposeNWidthHookUPP(userUPP: (p1: number, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible) => number): void;

export declare function DisposeDrawHookUPP(userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function DisposeHitTestHookUPP(userUPP: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number): void;

export declare function DisposeTEFindWordUPP(userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): void;

export declare function DisposeTERecalcUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function DisposeTEDoTextUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): void;

export declare function DisposeTEClickLoopUPP(userUPP: (p1: interop.PointerConvertible) => number): void;

export declare function InvokeHighHookUPP(r: interop.PointerConvertible, pTE: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function InvokeEOLHookUPP(theChar: number, pTE: interop.PointerConvertible, hTE: interop.PointerConvertible, userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): number;

export declare function InvokeCaretHookUPP(r: interop.PointerConvertible, pTE: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function InvokeWidthHookUPP(textLen: number, textOffset: number, textBufferPtr: interop.PointerConvertible, pTE: interop.PointerConvertible, hTE: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): number;

export declare function InvokeTextWidthHookUPP(textLen: number, textOffset: number, textBufferPtr: interop.PointerConvertible, pTE: interop.PointerConvertible, hTE: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): number;

export declare function InvokeNWidthHookUPP(styleRunLen: number, styleRunOffset: number, slop: number, direction: number, textBufferPtr: interop.PointerConvertible, lineStart: interop.PointerConvertible, pTE: interop.PointerConvertible, hTE: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible) => number): number;

export declare function InvokeDrawHookUPP(textOffset: number, drawLen: number, textBufferPtr: interop.PointerConvertible, pTE: interop.PointerConvertible, hTE: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function InvokeHitTestHookUPP(styleRunLen: number, styleRunOffset: number, slop: number, textBufferPtr: interop.PointerConvertible, pTE: interop.PointerConvertible, hTE: interop.PointerConvertible, pixelWidth: interop.PointerConvertible, charOffset: interop.PointerConvertible, pixelInChar: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number): number;

export declare function InvokeTEFindWordUPP(currentPos: number, caller: number, pTE: interop.PointerConvertible, hTE: interop.PointerConvertible, wordStart: interop.PointerConvertible, wordEnd: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): void;

export declare function InvokeTERecalcUPP(pTE: interop.PointerConvertible, changeLength: number, lineStart: interop.PointerConvertible, firstChar: interop.PointerConvertible, lastChar: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function InvokeTEDoTextUPP(pTE: interop.PointerConvertible, firstChar: number, lastChar: number, selector: number, currentGrafPort: interop.PointerConvertible, charPosition: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): void;

export declare function InvokeTEClickLoopUPP(pTE: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible) => number): number;

export declare function NewDragInputUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function DisposeDragInputUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function InvokeDragInputUPP(mouse: interop.PointerConvertible, modifiers: interop.PointerConvertible, dragInputRefCon: interop.PointerConvertible, theDrag: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function NewDragSendDataUPP(userRoutine: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function NewDragTrackingHandlerUPP(userRoutine: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function NewDragReceiveHandlerUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number;

export declare function NewDragDrawingUPP(userRoutine: (p1: number, p2: interop.PointerConvertible, p3: Point, p4: interop.PointerConvertible, p5: Point, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number): (p1: number, p2: interop.PointerConvertible, p3: Point, p4: interop.PointerConvertible, p5: Point, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number;

export declare function DisposeDragSendDataUPP(userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function DisposeDragTrackingHandlerUPP(userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function DisposeDragReceiveHandlerUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): void;

export declare function DisposeDragDrawingUPP(userUPP: (p1: number, p2: interop.PointerConvertible, p3: Point, p4: interop.PointerConvertible, p5: Point, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number): void;

export declare function InvokeDragSendDataUPP(theType: number, dragSendRefCon: interop.PointerConvertible, theItemRef: interop.PointerConvertible, theDrag: interop.PointerConvertible, userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function InvokeDragTrackingHandlerUPP(message: number, theWindow: interop.PointerConvertible, handlerRefCon: interop.PointerConvertible, theDrag: interop.PointerConvertible, userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function InvokeDragReceiveHandlerUPP(theWindow: interop.PointerConvertible, handlerRefCon: interop.PointerConvertible, theDrag: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): number;

export declare function InvokeDragDrawingUPP(message: number, showRegion: interop.PointerConvertible, showOrigin: Point, hideRegion: interop.PointerConvertible, hideOrigin: Point, dragDrawingRefCon: interop.PointerConvertible, theDrag: interop.PointerConvertible, userUPP: (p1: number, p2: interop.PointerConvertible, p3: Point, p4: interop.PointerConvertible, p5: Point, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number): number;

export declare function NewControlActionUPP(userRoutine: (p1: interop.PointerConvertible, p2: number) => void): (p1: interop.PointerConvertible, p2: number) => void;

export declare function DisposeControlActionUPP(userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function InvokeControlActionUPP(theControl: interop.Object, partCode: number, userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function NewControlKeyFilterUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function DisposeControlKeyFilterUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function InvokeControlKeyFilterUPP(theControl: interop.Object, keyCode: interop.PointerConvertible, charCode: interop.PointerConvertible, modifiers: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function NewWindowPaintUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number;

export declare function DisposeWindowPaintUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number): void;

export declare function InvokeWindowPaintUPP(device: interop.PointerConvertible, qdContext: interop.PointerConvertible, window: interop.PointerConvertible, inClientPaintRgn: interop.PointerConvertible, outSystemPaintRgn: interop.PointerConvertible, refCon: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number): number;

export declare function CheckEventQueueForUserCancel(): number;

export declare function IsUserCancelEventRef(event: interop.PointerConvertible): number;

export declare function HIMouseTrackingGetParameters(inSelector: number, outTime: interop.PointerConvertible, outDistance: interop.PointerConvertible): number;

export declare function GetApplicationEventTarget(): interop.Pointer;

export declare function GetEventDispatcherTarget(): interop.Pointer;

export declare function GetEventMonitorTarget(): interop.Pointer;

export declare function ProcessHICommand(inCommand: interop.PointerConvertible): number;

export declare function RegisterEventHotKey(inHotKeyCode: number, inHotKeyModifiers: number, inHotKeyID: EventHotKeyID, inTarget: interop.PointerConvertible, inOptions: number, outRef: interop.PointerConvertible): number;

export declare function UnregisterEventHotKey(inHotKey: interop.PointerConvertible): number;

export declare function CopySymbolicHotKeys(outHotKeyArray: interop.PointerConvertible): number;

export declare function PushSymbolicHotKeyMode(inOptions: number): interop.Pointer;

export declare function PopSymbolicHotKeyMode(inToken: interop.PointerConvertible): void;

export declare function GetSymbolicHotKeyMode(): number;

export declare function HIThemeDrawButton(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number, outLabelRect: interop.PointerConvertible): number;

export declare function HIThemeGetButtonShape(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, outShape: interop.PointerConvertible): number;

export declare function HIThemeGetButtonContentBounds(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, outBounds: interop.PointerConvertible): number;

export declare function HIThemeGetButtonBackgroundBounds(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, outBounds: interop.PointerConvertible): number;

export declare function HIThemeDrawChasingArrows(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawPopupArrow(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawMenuBarBackground(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawMenuTitle(inMenuBarRect: interop.PointerConvertible, inTitleRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number, outLabelRect: interop.PointerConvertible): number;

export declare function HIThemeDrawMenuBackground(inMenuRect: interop.PointerConvertible, inMenuDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawMenuItem(inMenuRect: interop.PointerConvertible, inItemRect: interop.PointerConvertible, inItemDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number, outContentRect: interop.PointerConvertible): number;

export declare function HIThemeDrawMenuSeparator(inMenuRect: interop.PointerConvertible, inItemRect: interop.PointerConvertible, inItemDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeGetMenuBackgroundShape(inMenuRect: interop.PointerConvertible, inMenuDrawInfo: interop.PointerConvertible, outShape: interop.PointerConvertible): number;

export declare function HIThemeDrawSegment(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawTabPane(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawTab(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number, outLabelRect: interop.PointerConvertible): number;

export declare function HIThemeGetTabPaneDrawShape(inRect: interop.PointerConvertible, inDirection: number, inTabSize: number, outShape: interop.PointerConvertible): number;

export declare function HIThemeGetTabPaneContentShape(inRect: interop.PointerConvertible, inDirection: number, inTabSize: number, outShape: interop.PointerConvertible): number;

export declare function HIThemeGetTabDrawShape(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, outShape: interop.PointerConvertible): number;

export declare function HIThemeGetTabShape(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, outShape: interop.PointerConvertible): number;

export declare function HIThemeGetTextDimensions(inString: interop.Object, inWidth: number, inTextInfo: interop.PointerConvertible, outWidth: interop.PointerConvertible, outHeight: interop.PointerConvertible, outBaseline: interop.PointerConvertible): number;

export declare function HIThemeDrawTextBox(inString: interop.Object, inBounds: interop.PointerConvertible, inTextInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeGetUIFontType(inFontID: number): interop.Enum<typeof CTFontUIFontType>;

export declare function HIThemeDrawTrack(inDrawInfo: interop.PointerConvertible, inGhostRect: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawTrackTickMarks(inDrawInfo: interop.PointerConvertible, inNumTicks: number, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawTickMark(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeGetTrackThumbShape(inDrawInfo: interop.PointerConvertible, outThumbShape: interop.PointerConvertible): number;

export declare function HIThemeHitTestTrack(inDrawInfo: interop.PointerConvertible, inMousePoint: interop.PointerConvertible, outPartHit: interop.PointerConvertible): number;

export declare function HIThemeGetTrackBounds(inDrawInfo: interop.PointerConvertible, outBounds: interop.PointerConvertible): number;

export declare function HIThemeGetTrackPartBounds(inDrawInfo: interop.PointerConvertible, inPartCode: number, outPartBounds: interop.PointerConvertible): number;

export declare function HIThemeGetTrackParts(inDrawInfo: interop.PointerConvertible, outNumberOfParts: interop.PointerConvertible, inMaxParts: number, ioPartsBuffer: interop.PointerConvertible): number;

export declare function HIThemeGetTrackDragRect(inDrawInfo: interop.PointerConvertible, outDragRect: interop.PointerConvertible): number;

export declare function HIThemeGetTrackThumbPositionFromOffset(inDrawInfo: interop.PointerConvertible, inThumbOffset: interop.PointerConvertible, outRelativePosition: interop.PointerConvertible): number;

export declare function HIThemeGetTrackThumbPositionFromBounds(inDrawInfo: interop.PointerConvertible, inThumbBounds: interop.PointerConvertible, outRelativePosition: interop.PointerConvertible): number;

export declare function HIThemeGetTrackLiveValue(inDrawInfo: interop.PointerConvertible, inRelativePosition: number, outValue: interop.PointerConvertible): number;

export declare function HIThemeGetScrollBarTrackRect(inBounds: interop.PointerConvertible, inTrackInfo: interop.PointerConvertible, inIsHoriz: number, outTrackBounds: interop.PointerConvertible): number;

export declare function HIThemeHitTestScrollBarArrows(inScrollBarBounds: interop.PointerConvertible, inTrackInfo: interop.PointerConvertible, inIsHoriz: number, inPtHit: interop.PointerConvertible, outTrackBounds: interop.PointerConvertible, outPartCode: interop.PointerConvertible): number;

export declare function HIThemeDrawScrollBarDelimiters(inContRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawWindowFrame(inContRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number, outTitleRect: interop.PointerConvertible): number;

export declare function HIThemeDrawTitleBarWidget(inContRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawGrowBox(inOrigin: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeGetGrowBoxBounds(inOrigin: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, outBounds: interop.PointerConvertible): number;

export declare function HIThemeGetWindowShape(inContRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inWinRegion: number, outShape: interop.PointerConvertible): number;

export declare function HIThemeGetWindowRegionHit(inContRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inPoint: interop.PointerConvertible, outRegionHit: interop.PointerConvertible): number;

export declare function HIThemeDrawFrame(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawGroupBox(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawGenericWell(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawPaneSplitter(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawGrabber(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawPlacard(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawHeader(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawFocusRect(inRect: interop.PointerConvertible, inHasFocus: number, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeBeginFocus(inContext: interop.Object, inRing: number, inReserved: interop.PointerConvertible): number;

export declare function HIThemeEndFocus(inContext: interop.Object): number;

export declare function HIThemeDrawSeparator(inRect: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeSetFill(inBrush: number, inInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeSetStroke(inBrush: number, inInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeSetTextFill(inColor: number, inInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeApplyBackground(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeDrawBackground(inBounds: interop.PointerConvertible, inDrawInfo: interop.PointerConvertible, inContext: interop.Object, inOrientation: number): number;

export declare function HIThemeBrushCreateCGColor(inBrush: number, outColor: interop.PointerConvertible): number;

export declare function HIThemeGetTextColorForThemeBrush(inBrush: number, inWindowIsActive: number, outColor: interop.PointerConvertible): number;

export declare function GetThemeMenuSeparatorHeight(outHeight: interop.PointerConvertible): number;

export declare function GetThemeMenuItemExtra(inItemType: number, outHeight: interop.PointerConvertible, outWidth: interop.PointerConvertible): number;

export declare function GetThemeMenuTitleExtra(outWidth: interop.PointerConvertible, inIsSquished: number): number;

export declare function GetThemeMetric(inMetric: number, outMetric: interop.PointerConvertible): number;

export declare function CopyThemeIdentifier(outIdentifier: interop.PointerConvertible): number;

export declare function NewNMUPP(userRoutine: (p1: interop.PointerConvertible) => void): (p1: interop.PointerConvertible) => void;

export declare function DisposeNMUPP(userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function InvokeNMUPP(nmReqPtr: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function NewModalFilterUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number;

export declare function NewModalFilterYDUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function NewUserItemUPP(userRoutine: (p1: interop.PointerConvertible, p2: number) => void): (p1: interop.PointerConvertible, p2: number) => void;

export declare function DisposeModalFilterUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): void;

export declare function DisposeModalFilterYDUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function DisposeUserItemUPP(userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function InvokeModalFilterUPP(theDialog: interop.PointerConvertible, theEvent: interop.PointerConvertible, itemHit: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): number;

export declare function InvokeModalFilterYDUPP(theDialog: interop.PointerConvertible, theEvent: interop.PointerConvertible, itemHit: interop.PointerConvertible, yourDataPtr: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function InvokeUserItemUPP(theDialog: interop.PointerConvertible, itemNo: number, userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function AESend(theAppleEvent: interop.PointerConvertible, reply: interop.PointerConvertible, sendMode: number, sendPriority: number, timeOutInTicks: number, idleProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, filterProc: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number): number;

export declare function AEProcessAppleEvent(theEventRecord: interop.PointerConvertible): number;

export declare function AEProcessEvent(inEvent: interop.PointerConvertible): number;

export declare function AEResetTimer(reply: interop.PointerConvertible): number;

export declare function AEGetInteractionAllowed(level: interop.PointerConvertible): number;

export declare function AESetInteractionAllowed(level: number): number;

export declare function AEInteractWithUser(timeOutInTicks: number, nmReqPtr: interop.PointerConvertible, idleProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): number;

export declare function AESuspendTheCurrentEvent(theAppleEvent: interop.PointerConvertible): number;

export declare function AEResumeTheCurrentEvent(theAppleEvent: interop.PointerConvertible, reply: interop.PointerConvertible, dispatcher: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, handlerRefcon: interop.PointerConvertible): number;

export declare function AEGetTheCurrentEvent(theAppleEvent: interop.PointerConvertible): number;

export declare function AESetTheCurrentEvent(theAppleEvent: interop.PointerConvertible): number;

export declare function NewAEIdleUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number;

export declare function NewAEFilterUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number;

export declare function DisposeAEIdleUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): void;

export declare function DisposeAEFilterUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number): void;

export declare function InvokeAEIdleUPP(theEvent: interop.PointerConvertible, sleepTime: interop.PointerConvertible, mouseRgn: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): number;

export declare function InvokeAEFilterUPP(theEvent: interop.PointerConvertible, returnID: number, transactionID: number, sender: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number): number;

export declare function TSMSetDocumentProperty(docID: interop.PointerConvertible, propertyTag: number, propertySize: number, propertyData: interop.PointerConvertible): number;

export declare function TSMGetDocumentProperty(docID: interop.PointerConvertible, propertyTag: number, bufferSize: number, actualSize: interop.PointerConvertible, propertyBuffer: interop.PointerConvertible): number;

export declare function TSMRemoveDocumentProperty(docID: interop.PointerConvertible, propertyTag: number): number;

export declare function TSMGetActiveDocument(): interop.Pointer;

export declare function NewScrapPromiseKeeperUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number;

export declare function DisposeScrapPromiseKeeperUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): void;

export declare function InvokeScrapPromiseKeeperUPP(scrap: interop.PointerConvertible, flavorType: number, userData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): number;

export declare function NewTXNFindUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: number, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: number, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible) => number;

export declare function NewTXNActionNameMapperUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => interop.Pointer): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => interop.Pointer;

export declare function NewTXNContextualMenuSetupUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void;

export declare function NewTXNScrollInfoUPP(userRoutine: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => void): (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => void;

export declare function DisposeTXNFindUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: number, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible) => number): void;

export declare function DisposeTXNActionNameMapperUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => interop.Pointer): void;

export declare function DisposeTXNContextualMenuSetupUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void): void;

export declare function DisposeTXNScrollInfoUPP(userUPP: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function InvokeTXNFindUPP(matchData: interop.PointerConvertible, iDataType: number, iMatchOptions: number, iSearchTextPtr: interop.PointerConvertible, encoding: number, absStartOffset: number, searchTextLength: number, oStartMatch: interop.PointerConvertible, oEndMatch: interop.PointerConvertible, ofound: interop.PointerConvertible, refCon: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: number, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible) => number): number;

export declare function InvokeTXNActionNameMapperUPP(actionName: interop.Object, commandID: number, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => interop.Pointer): interop.Object;

export declare function InvokeTXNContextualMenuSetupUPP(iContextualMenu: interop.Object, object: interop.PointerConvertible, inUserData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void): void;

export declare function InvokeTXNScrollInfoUPP(iValue: number, iMaximumValue: number, iScrollBarOrientation: number, iRefCon: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function NewTXNActionKeyMapperUPP(userRoutine: (p1: number, p2: number) => interop.Pointer): (p1: number, p2: number) => interop.Pointer;

export declare function DisposeTXNActionKeyMapperUPP(userUPP: (p1: number, p2: number) => interop.Pointer): void;

export declare function InvokeTXNActionKeyMapperUPP(actionKey: number, commandID: number, userUPP: (p1: number, p2: number) => interop.Pointer): interop.Object;

export declare function NewHMControlContentUPP(userRoutine: (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number;

export declare function NewHMWindowContentUPP(userRoutine: (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number;

export declare function NewHMMenuTitleContentUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function NewHMMenuItemContentUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number;

export declare function DisposeHMControlContentUPP(userUPP: (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function DisposeHMWindowContentUPP(userUPP: (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function DisposeHMMenuTitleContentUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function DisposeHMMenuItemContentUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): void;

export declare function InvokeHMControlContentUPP(inControl: interop.Object, inGlobalMouse: Point, inRequest: number, outContentProvided: interop.PointerConvertible, ioHelpContent: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): number;

export declare function InvokeHMWindowContentUPP(inWindow: interop.PointerConvertible, inGlobalMouse: Point, inRequest: number, outContentProvided: interop.PointerConvertible, ioHelpContent: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: Point, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): number;

export declare function InvokeHMMenuTitleContentUPP(inMenu: interop.Object, inRequest: number, outContentProvided: interop.PointerConvertible, ioHelpContent: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function InvokeHMMenuItemContentUPP(inTrackingData: interop.PointerConvertible, inRequest: number, outContentProvided: interop.PointerConvertible, ioHelpContent: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number): number;

export declare function NewControlUserPaneDrawUPP(userRoutine: (p1: interop.PointerConvertible, p2: number) => void): (p1: interop.PointerConvertible, p2: number) => void;

export declare function NewControlUserPaneHitTestUPP(userRoutine: (p1: interop.PointerConvertible, p2: Point) => number): (p1: interop.PointerConvertible, p2: Point) => number;

export declare function NewControlUserPaneTrackingUPP(userRoutine: (p1: interop.PointerConvertible, p2: Point, p3: (p1: interop.PointerConvertible, p2: number) => void) => number): (p1: interop.PointerConvertible, p2: Point, p3: (p1: interop.PointerConvertible, p2: number) => void) => number;

export declare function NewControlUserPaneIdleUPP(userRoutine: (p1: interop.PointerConvertible) => void): (p1: interop.PointerConvertible) => void;

export declare function NewControlUserPaneKeyDownUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number;

export declare function NewControlUserPaneActivateUPP(userRoutine: (p1: interop.PointerConvertible, p2: number) => void): (p1: interop.PointerConvertible, p2: number) => void;

export declare function NewControlUserPaneFocusUPP(userRoutine: (p1: interop.PointerConvertible, p2: number) => number): (p1: interop.PointerConvertible, p2: number) => number;

export declare function DisposeControlUserPaneDrawUPP(userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function DisposeControlUserPaneHitTestUPP(userUPP: (p1: interop.PointerConvertible, p2: Point) => number): void;

export declare function DisposeControlUserPaneTrackingUPP(userUPP: (p1: interop.PointerConvertible, p2: Point, p3: (p1: interop.PointerConvertible, p2: number) => void) => number): void;

export declare function DisposeControlUserPaneIdleUPP(userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function DisposeControlUserPaneKeyDownUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number): void;

export declare function DisposeControlUserPaneActivateUPP(userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function DisposeControlUserPaneFocusUPP(userUPP: (p1: interop.PointerConvertible, p2: number) => number): void;

export declare function InvokeControlUserPaneDrawUPP(control: interop.Object, part: number, userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function InvokeControlUserPaneHitTestUPP(control: interop.Object, where: Point, userUPP: (p1: interop.PointerConvertible, p2: Point) => number): number;

export declare function InvokeControlUserPaneTrackingUPP(control: interop.Object, startPt: Point, actionProc: (p1: interop.PointerConvertible, p2: number) => void, userUPP: (p1: interop.PointerConvertible, p2: Point, p3: (p1: interop.PointerConvertible, p2: number) => void) => number): number;

export declare function InvokeControlUserPaneIdleUPP(control: interop.Object, userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function InvokeControlUserPaneKeyDownUPP(control: interop.Object, keyCode: number, charCode: number, modifiers: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number): number;

export declare function InvokeControlUserPaneActivateUPP(control: interop.Object, activating: number, userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function InvokeControlUserPaneFocusUPP(control: interop.Object, action: number, userUPP: (p1: interop.PointerConvertible, p2: number) => number): number;

export declare function NewDataBrowserItemUPP(userRoutine: (p1: number, p2: number, p3: interop.PointerConvertible) => void): (p1: number, p2: number, p3: interop.PointerConvertible) => void;

export declare function DisposeDataBrowserItemUPP(userUPP: (p1: number, p2: number, p3: interop.PointerConvertible) => void): void;

export declare function InvokeDataBrowserItemUPP(item: number, state: number, clientData: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: interop.PointerConvertible) => void): void;

export declare function NewDataBrowserItemDataUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => number;

export declare function NewDataBrowserItemCompareUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number;

export declare function NewDataBrowserItemNotificationWithItemUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void;

export declare function NewDataBrowserItemNotificationUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number) => void): (p1: interop.PointerConvertible, p2: number, p3: number) => void;

export declare function NewDataBrowserAddDragItemUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number;

export declare function NewDataBrowserAcceptDragUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number;

export declare function NewDataBrowserReceiveDragUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number;

export declare function NewDataBrowserPostProcessDragUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void;

export declare function NewDataBrowserGetContextualMenuUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void;

export declare function NewDataBrowserSelectContextualMenuUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number) => void;

export declare function NewDataBrowserItemHelpContentUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void;

export declare function DisposeDataBrowserItemDataUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => number): void;

export declare function DisposeDataBrowserItemCompareUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number): void;

export declare function DisposeDataBrowserItemNotificationWithItemUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function DisposeDataBrowserItemNotificationUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number) => void): void;

export declare function DisposeDataBrowserAddDragItemUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number): void;

export declare function DisposeDataBrowserAcceptDragUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number): void;

export declare function DisposeDataBrowserReceiveDragUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number): void;

export declare function DisposeDataBrowserPostProcessDragUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void): void;

export declare function DisposeDataBrowserGetContextualMenuUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function DisposeDataBrowserSelectContextualMenuUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number) => void): void;

export declare function DisposeDataBrowserItemHelpContentUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): void;

export declare function InvokeDataBrowserItemDataUPP(browser: interop.Object, item: number, property: number, itemData: interop.PointerConvertible, setValue: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => number): number;

export declare function InvokeDataBrowserItemCompareUPP(browser: interop.Object, itemOne: number, itemTwo: number, sortProperty: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number): number;

export declare function InvokeDataBrowserItemNotificationWithItemUPP(browser: interop.Object, item: number, message: number, itemData: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void): void;

export declare function InvokeDataBrowserItemNotificationUPP(browser: interop.Object, item: number, message: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number) => void): void;

export declare function InvokeDataBrowserAddDragItemUPP(browser: interop.Object, theDrag: interop.PointerConvertible, item: number, itemRef: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number): number;

export declare function InvokeDataBrowserAcceptDragUPP(browser: interop.Object, theDrag: interop.PointerConvertible, item: number, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number): number;

export declare function InvokeDataBrowserReceiveDragUPP(browser: interop.Object, theDrag: interop.PointerConvertible, item: number, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => number): number;

export declare function InvokeDataBrowserPostProcessDragUPP(browser: interop.Object, theDrag: interop.PointerConvertible, trackDragResult: number, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void): void;

export declare function InvokeDataBrowserGetContextualMenuUPP(browser: interop.Object, menu: interop.PointerConvertible, helpType: interop.PointerConvertible, helpItemString: interop.PointerConvertible, selection: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function InvokeDataBrowserSelectContextualMenuUPP(browser: interop.Object, menu: interop.Object, selectionType: number, menuID: number, menuItem: number, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number) => void): void;

export declare function InvokeDataBrowserItemHelpContentUPP(browser: interop.Object, item: number, property: number, inRequest: number, outContentProvided: interop.PointerConvertible, ioHelpContent: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void): void;

export declare function NewDataBrowserDrawItemUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number, p7: number) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number, p7: number) => void;

export declare function NewDataBrowserEditItemUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number;

export declare function NewDataBrowserHitTestUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number;

export declare function NewDataBrowserTrackingUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: Point, p6: number) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: Point, p6: number) => number;

export declare function NewDataBrowserItemDragRgnUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void;

export declare function NewDataBrowserItemAcceptDragUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number;

export declare function NewDataBrowserItemReceiveDragUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number;

export declare function DisposeDataBrowserDrawItemUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number, p7: number) => void): void;

export declare function DisposeDataBrowserEditItemUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number): void;

export declare function DisposeDataBrowserHitTestUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function DisposeDataBrowserTrackingUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: Point, p6: number) => number): void;

export declare function DisposeDataBrowserItemDragRgnUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function DisposeDataBrowserItemAcceptDragUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function DisposeDataBrowserItemReceiveDragUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number): void;

export declare function InvokeDataBrowserDrawItemUPP(browser: interop.Object, item: number, property: number, itemState: number, theRect: interop.PointerConvertible, gdDepth: number, colorDevice: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number, p7: number) => void): void;

export declare function InvokeDataBrowserEditItemUPP(browser: interop.Object, item: number, property: number, theString: interop.Object, maxEditTextRect: interop.PointerConvertible, shrinkToFit: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number): number;

export declare function InvokeDataBrowserHitTestUPP(browser: interop.Object, itemID: number, property: number, theRect: interop.PointerConvertible, mouseRect: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): number;

export declare function InvokeDataBrowserTrackingUPP(browser: interop.Object, itemID: number, property: number, theRect: interop.PointerConvertible, startPt: Point, modifiers: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: Point, p6: number) => number): number;

export declare function InvokeDataBrowserItemDragRgnUPP(browser: interop.Object, itemID: number, property: number, theRect: interop.PointerConvertible, dragRgn: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void): void;

export declare function InvokeDataBrowserItemAcceptDragUPP(browser: interop.Object, itemID: number, property: number, theRect: interop.PointerConvertible, theDrag: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): number;

export declare function InvokeDataBrowserItemReceiveDragUPP(browser: interop.Object, itemID: number, property: number, dragFlags: number, theDrag: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number): number;

export declare function NewControlEditTextValidationUPP(userRoutine: (p1: interop.PointerConvertible) => void): (p1: interop.PointerConvertible) => void;

export declare function NewEditUnicodePostUpdateUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number;

export declare function DisposeControlEditTextValidationUPP(userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function DisposeEditUnicodePostUpdateUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number): void;

export declare function InvokeControlEditTextValidationUPP(control: interop.Object, userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function InvokeEditUnicodePostUpdateUPP(uniText: interop.PointerConvertible, uniTextLength: number, iStartOffset: number, iEndOffset: number, refcon: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => number): number;

export declare function NewListSearchUPP(userRoutine: (p1: string, p2: string, p3: number, p4: number) => number): (p1: string, p2: string, p3: number, p4: number) => number;

export declare function NewListClickLoopUPP(userRoutine: () => number): () => number;

export declare function NewListDefUPP(userRoutine: (p1: number, p2: number, p3: interop.PointerConvertible, p4: Point, p5: number, p6: number, p7: interop.PointerConvertible) => void): (p1: number, p2: number, p3: interop.PointerConvertible, p4: Point, p5: number, p6: number, p7: interop.PointerConvertible) => void;

export declare function DisposeListSearchUPP(userUPP: (p1: string, p2: string, p3: number, p4: number) => number): void;

export declare function DisposeListClickLoopUPP(userUPP: () => number): void;

export declare function DisposeListDefUPP(userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: Point, p5: number, p6: number, p7: interop.PointerConvertible) => void): void;

export declare function InvokeListSearchUPP(aPtr: string, bPtr: string, aLen: number, bLen: number, userUPP: (p1: string, p2: string, p3: number, p4: number) => number): number;

export declare function InvokeListClickLoopUPP(userUPP: () => number): number;

export declare function InvokeListDefUPP(lMessage: number, lSelect: number, lRect: interop.PointerConvertible, lCell: Point, lDataOffset: number, lDataLen: number, lHandle: interop.PointerConvertible, userUPP: (p1: number, p2: number, p3: interop.PointerConvertible, p4: Point, p5: number, p6: number, p7: interop.PointerConvertible) => void): void;

export declare function NewGetScrapDataUPP(userRoutine: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number;

export declare function DisposeGetScrapDataUPP(userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): void;

export declare function InvokeGetScrapDataUPP(requestedFormat: number, dataH: interop.PointerConvertible, srcDataGetterRefCon: interop.PointerConvertible, userUPP: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number): number;

export declare function SetSystemUIMode(inMode: number, inOptions: number): number;

export declare function GetSystemUIMode(outMode: interop.PointerConvertible, outOptions: interop.PointerConvertible): void;

export declare function GetApplicationTextEncoding(): number;

export declare function HISearchWindowShow(inSearchString: interop.Object, inFlags: number): number;

export declare function HIDictionaryWindowShow(dictionary: interop.Object, textString: interop.Object, selectionRange: CFRange, textFont: interop.Object, textOrigin: CGPoint, verticalText: number, viewTransform: interop.PointerConvertible): void;

export declare function KBGetLayoutType(iKeyboardType: number): number;

export declare function TISInputSourceGetTypeID(): number;

export declare function TISGetInputSourceProperty(inputSource: interop.Object, propertyKey: interop.Object): interop.Pointer;

export declare function TISCreateInputSourceList(properties: interop.Object, includeAllInstalled: number): interop.Object;

export declare function TISCopyCurrentKeyboardInputSource(): interop.Object;

export declare function TISCopyCurrentKeyboardLayoutInputSource(): interop.Object;

export declare function TISCopyCurrentASCIICapableKeyboardInputSource(): interop.Object;

export declare function TISCopyCurrentASCIICapableKeyboardLayoutInputSource(): interop.Object;

export declare function TISCopyInputSourceForLanguage(language: interop.Object): interop.Object;

export declare function TISCreateASCIICapableInputSourceList(): interop.Object;

export declare function TISSelectInputSource(inputSource: interop.Object): number;

export declare function TISDeselectInputSource(inputSource: interop.Object): number;

export declare function TISEnableInputSource(inputSource: interop.Object): number;

export declare function TISDisableInputSource(inputSource: interop.Object): number;

export declare function TISSetInputMethodKeyboardLayoutOverride(keyboardLayout: interop.Object): number;

export declare function TISCopyInputMethodKeyboardLayoutOverride(): interop.Object;

export declare function TISRegisterInputSource(location: interop.Object): number;

export declare function DebugPrintMainEventQueue(): void;

export declare function DebugPrintEvent(inEvent: interop.PointerConvertible): void;

export declare function NewTSMTEPreUpdateUPP(userRoutine: (p1: interop.PointerConvertible, p2: number) => void): (p1: interop.PointerConvertible, p2: number) => void;

export declare function NewTSMTEPostUpdateUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void): (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void;

export declare function DisposeTSMTEPreUpdateUPP(userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function DisposeTSMTEPostUpdateUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void): void;

export declare function InvokeTSMTEPreUpdateUPP(textH: interop.PointerConvertible, refCon: number, userUPP: (p1: interop.PointerConvertible, p2: number) => void): void;

export declare function InvokeTSMTEPostUpdateUPP(textH: interop.PointerConvertible, fixLen: number, inputAreaStart: number, inputAreaEnd: number, pinStart: number, pinEnd: number, refCon: number, userUPP: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void): void;

export declare function OSALoad(scriptingComponent: interop.PointerConvertible, scriptData: interop.PointerConvertible, modeFlags: number, resultingScriptID: interop.PointerConvertible): number;

export declare function OSAStore(scriptingComponent: interop.PointerConvertible, scriptID: number, desiredType: number, modeFlags: number, resultingScriptData: interop.PointerConvertible): number;

export declare function OSAExecute(scriptingComponent: interop.PointerConvertible, compiledScriptID: number, contextID: number, modeFlags: number, resultingScriptValueID: interop.PointerConvertible): number;

export declare function OSADisplay(scriptingComponent: interop.PointerConvertible, scriptValueID: number, desiredType: number, modeFlags: number, resultingText: interop.PointerConvertible): number;

export declare function OSACopyDisplayString(scriptingComponent: interop.PointerConvertible, scriptID: number, modeFlags: number, result: interop.PointerConvertible): number;

export declare function OSAScriptError(scriptingComponent: interop.PointerConvertible, selector: number, desiredType: number, resultingErrorDescription: interop.PointerConvertible): number;

export declare function OSADispose(scriptingComponent: interop.PointerConvertible, scriptID: number): number;

export declare function OSASetScriptInfo(scriptingComponent: interop.PointerConvertible, scriptID: number, selector: number, value: number): number;

export declare function OSAGetScriptInfo(scriptingComponent: interop.PointerConvertible, scriptID: number, selector: number, result: interop.PointerConvertible): number;

export declare function OSASetActiveProc(scriptingComponent: interop.PointerConvertible, activeProc: (p1: interop.PointerConvertible) => number, refCon: interop.PointerConvertible): number;

export declare function OSAGetActiveProc(scriptingComponent: interop.PointerConvertible, activeProc: interop.PointerConvertible, refCon: interop.PointerConvertible): number;

export declare function OSAScriptingComponentName(scriptingComponent: interop.PointerConvertible, resultingScriptingComponentName: interop.PointerConvertible): number;

export declare function OSACompile(scriptingComponent: interop.PointerConvertible, sourceData: interop.PointerConvertible, modeFlags: number, previousAndResultingScriptID: interop.PointerConvertible): number;

export declare function OSACopyID(scriptingComponent: interop.PointerConvertible, fromID: number, toID: interop.PointerConvertible): number;

export declare function OSACopyScript(scriptingComponent: interop.PointerConvertible, fromID: number, toID: interop.PointerConvertible): number;

export declare function OSAGetSource(scriptingComponent: interop.PointerConvertible, scriptID: number, desiredType: number, resultingSourceData: interop.PointerConvertible): number;

export declare function OSACopySourceString(scriptingComponent: interop.PointerConvertible, scriptID: number, modeFlags: number, result: interop.PointerConvertible): number;

export declare function OSACoerceFromDesc(scriptingComponent: interop.PointerConvertible, scriptData: interop.PointerConvertible, modeFlags: number, resultingScriptID: interop.PointerConvertible): number;

export declare function OSACoerceToDesc(scriptingComponent: interop.PointerConvertible, scriptID: number, desiredType: number, modeFlags: number, result: interop.PointerConvertible): number;

export declare function OSASetSendProc(scriptingComponent: interop.PointerConvertible, sendProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number, p6: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, p7: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number, p8: interop.PointerConvertible) => number, refCon: interop.PointerConvertible): number;

export declare function OSAGetSendProc(scriptingComponent: interop.PointerConvertible, sendProc: interop.PointerConvertible, refCon: interop.PointerConvertible): number;

export declare function OSASetCreateProc(scriptingComponent: interop.PointerConvertible, createProc: (p1: number, p2: number, p3: interop.PointerConvertible, p4: number, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number, refCon: interop.PointerConvertible): number;

export declare function OSAGetCreateProc(scriptingComponent: interop.PointerConvertible, createProc: interop.PointerConvertible, refCon: interop.PointerConvertible): number;

export declare function OSASetDefaultTarget(scriptingComponent: interop.PointerConvertible, target: interop.PointerConvertible): number;

export declare function OSAStartRecording(scriptingComponent: interop.PointerConvertible, compiledScriptToModifyID: interop.PointerConvertible): number;

export declare function OSAStopRecording(scriptingComponent: interop.PointerConvertible, compiledScriptID: number): number;

export declare function OSALoadExecute(scriptingComponent: interop.PointerConvertible, scriptData: interop.PointerConvertible, contextID: number, modeFlags: number, resultingScriptValueID: interop.PointerConvertible): number;

export declare function OSACompileExecute(scriptingComponent: interop.PointerConvertible, sourceData: interop.PointerConvertible, contextID: number, modeFlags: number, resultingScriptValueID: interop.PointerConvertible): number;

export declare function OSADoScript(scriptingComponent: interop.PointerConvertible, sourceData: interop.PointerConvertible, contextID: number, desiredType: number, modeFlags: number, resultingText: interop.PointerConvertible): number;

export declare function OSASetCurrentDialect(scriptingComponent: interop.PointerConvertible, dialectCode: number): number;

export declare function OSAGetCurrentDialect(scriptingComponent: interop.PointerConvertible, resultingDialectCode: interop.PointerConvertible): number;

export declare function OSAAvailableDialects(scriptingComponent: interop.PointerConvertible, resultingDialectInfoList: interop.PointerConvertible): number;

export declare function OSAGetDialectInfo(scriptingComponent: interop.PointerConvertible, dialectCode: number, selector: number, resultingDialectInfo: interop.PointerConvertible): number;

export declare function OSAAvailableDialectCodeList(scriptingComponent: interop.PointerConvertible, resultingDialectCodeList: interop.PointerConvertible): number;

export declare function OSASetResumeDispatchProc(scriptingComponent: interop.PointerConvertible, resumeDispatchProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, refCon: interop.PointerConvertible): number;

export declare function OSAGetResumeDispatchProc(scriptingComponent: interop.PointerConvertible, resumeDispatchProc: interop.PointerConvertible, refCon: interop.PointerConvertible): number;

export declare function OSAExecuteEvent(scriptingComponent: interop.PointerConvertible, theAppleEvent: interop.PointerConvertible, contextID: number, modeFlags: number, resultingScriptValueID: interop.PointerConvertible): number;

export declare function OSADoEvent(scriptingComponent: interop.PointerConvertible, theAppleEvent: interop.PointerConvertible, contextID: number, modeFlags: number, reply: interop.PointerConvertible): number;

export declare function OSAMakeContext(scriptingComponent: interop.PointerConvertible, contextName: interop.PointerConvertible, parentContext: number, resultingContextID: interop.PointerConvertible): number;

export declare function OSAGetScriptDataFromURL(scriptURL: interop.Object, storable: interop.PointerConvertible, modeFlags: number, resultingScriptData: interop.PointerConvertible): number;

export declare function OSALoadScriptData(scriptingComponent: interop.PointerConvertible, scriptData: interop.PointerConvertible, fromURL: interop.Object, modeFlags: number, resultingScriptID: interop.PointerConvertible): number;

export declare function OSALoadFile(scriptingComponent: interop.PointerConvertible, scriptFile: interop.PointerConvertible, storable: interop.PointerConvertible, modeFlags: number, resultingScriptID: interop.PointerConvertible): number;

export declare function OSAStoreFile(scriptingComponent: interop.PointerConvertible, scriptID: number, desiredType: number, modeFlags: number, scriptFile: interop.PointerConvertible): number;

export declare function OSALoadExecuteFile(scriptingComponent: interop.PointerConvertible, scriptFile: interop.PointerConvertible, contextID: number, modeFlags: number, resultingScriptValueID: interop.PointerConvertible): number;

export declare function OSADoScriptFile(scriptingComponent: interop.PointerConvertible, scriptFile: interop.PointerConvertible, contextID: number, desiredType: number, modeFlags: number, resultingText: interop.PointerConvertible): number;

export declare function OSAGetStorageType(scriptData: interop.PointerConvertible, dscType: interop.PointerConvertible): number;

export declare function OSAAddStorageType(scriptData: interop.PointerConvertible, dscType: number): number;

export declare function OSARemoveStorageType(scriptData: interop.PointerConvertible): number;

export declare function OSAGetDefaultScriptingComponent(genericScriptingComponent: interop.PointerConvertible, scriptingSubType: interop.PointerConvertible): number;

export declare function OSASetDefaultScriptingComponent(genericScriptingComponent: interop.PointerConvertible, scriptingSubType: number): number;

export declare function OSAGetScriptingComponent(genericScriptingComponent: interop.PointerConvertible, scriptingSubType: number, scriptingInstance: interop.PointerConvertible): number;

export declare function OSAGetScriptingComponentFromStored(genericScriptingComponent: interop.PointerConvertible, scriptData: interop.PointerConvertible, scriptingSubType: interop.PointerConvertible): number;

export declare function OSAGenericToRealID(genericScriptingComponent: interop.PointerConvertible, theScriptID: interop.PointerConvertible, theExactComponent: interop.PointerConvertible): number;

export declare function OSARealToGenericID(genericScriptingComponent: interop.PointerConvertible, theScriptID: interop.PointerConvertible, theExactComponent: interop.PointerConvertible): number;

export declare function ASInit(scriptingComponent: interop.PointerConvertible, modeFlags: number, minStackSize: number, preferredStackSize: number, maxStackSize: number, minHeapSize: number, preferredHeapSize: number, maxHeapSize: number): number;

export declare function ASSetSourceStyles(scriptingComponent: interop.PointerConvertible, sourceStyles: interop.PointerConvertible): number;

export declare function ASGetSourceStyles(scriptingComponent: interop.PointerConvertible, resultingSourceStyles: interop.PointerConvertible): number;

export declare function ASCopySourceAttributes(scriptingComponent: interop.PointerConvertible, resultingSourceAttributes: interop.PointerConvertible): number;

export declare function ASSetSourceAttributes(scriptingComponent: interop.PointerConvertible, sourceAttributes: interop.Object): number;

export declare function ASGetSourceStyleNames(scriptingComponent: interop.PointerConvertible, modeFlags: number, resultingSourceStyleNamesList: interop.PointerConvertible): number;

export declare function OSASetProperty(scriptingComponent: interop.PointerConvertible, modeFlags: number, contextID: number, variableName: interop.PointerConvertible, scriptValueID: number): number;

export declare function OSAGetProperty(scriptingComponent: interop.PointerConvertible, modeFlags: number, contextID: number, variableName: interop.PointerConvertible, resultingScriptValueID: interop.PointerConvertible): number;

export declare function OSAGetPropertyNames(scriptingComponent: interop.PointerConvertible, modeFlags: number, contextID: number, resultingPropertyNames: interop.PointerConvertible): number;

export declare function OSASetHandler(scriptingComponent: interop.PointerConvertible, modeFlags: number, contextID: number, handlerName: interop.PointerConvertible, compiledScriptID: number): number;

export declare function OSAGetHandler(scriptingComponent: interop.PointerConvertible, modeFlags: number, contextID: number, handlerName: interop.PointerConvertible, resultingCompiledScriptID: interop.PointerConvertible): number;

export declare function OSAGetHandlerNames(scriptingComponent: interop.PointerConvertible, modeFlags: number, contextID: number, resultingHandlerNames: interop.PointerConvertible): number;

export declare function OSAGetSysTerminology(scriptingComponent: interop.PointerConvertible, modeFlags: number, terminologyID: number, terminologyList: interop.PointerConvertible): number;

export declare function OSACopyScriptingDefinition(ref: interop.PointerConvertible, modeFlags: number, sdef: interop.PointerConvertible): number;

export declare function OSACopyScriptingDefinitionFromURL(url: interop.Object, modeFlags: number, sdef: interop.PointerConvertible): number;

export declare function NewNColorChangedUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

export declare function DisposeNColorChangedUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function InvokeNColorChangedUPP(userData: interop.PointerConvertible, newColor: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): void;

export declare function GetColor(where: Point, prompt: interop.PointerConvertible, inColor: interop.PointerConvertible, outColor: interop.PointerConvertible): number;

export declare function NPickColor(theColorInfo: interop.PointerConvertible): number;

export declare function NewCalibrateEventUPP(userRoutine: (p1: interop.PointerConvertible) => void): (p1: interop.PointerConvertible) => void;

export declare function NewCanCalibrateUPP(userRoutine: (p1: number, p2: interop.PointerConvertible) => number): (p1: number, p2: interop.PointerConvertible) => number;

export declare function NewCalibrateUPP(userRoutine: (p1: interop.PointerConvertible) => number): (p1: interop.PointerConvertible) => number;

export declare function DisposeCalibrateEventUPP(userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function DisposeCanCalibrateUPP(userUPP: (p1: number, p2: interop.PointerConvertible) => number): void;

export declare function DisposeCalibrateUPP(userUPP: (p1: interop.PointerConvertible) => number): void;

export declare function InvokeCalibrateEventUPP(event: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function InvokeCanCalibrateUPP(displayID: number, errMessage: unknown /* const array */, userUPP: (p1: number, p2: interop.PointerConvertible) => number): number;

export declare function InvokeCalibrateUPP(theInfo: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible) => number): number;

export declare function CMCalibrateDisplay(theInfo: interop.PointerConvertible): number;

export declare function FPIsFontPanelVisible(): number;

export declare function FPShowHideFontPanel(): number;

export declare function SetFontInfoForSelection(iStyleType: number, iNumStyles: number, iStyles: interop.PointerConvertible, iFPEventTarget: interop.PointerConvertible): number;

export declare function FCCopyCollectionNames(): interop.Object;

export declare function FCCopyFontDescriptorsInCollection(iCollection: interop.Object): interop.Object;

export declare function FCAddCollection(iCollection: interop.Object, iCollectionOptions: number): number;

export declare function FCRemoveCollection(iCollection: interop.Object): number;

export declare function FCAddFontDescriptorToCollection(iDescriptor: interop.Object, iCollection: interop.Object): number;

export declare function FCRemoveFontDescriptorFromCollection(iDescriptor: interop.Object, iCollection: interop.Object): number;

export declare function FCFontDescriptorCreateWithFontAttributes(iAttributes: interop.Object): interop.Object;

export declare function FCFontDescriptorCreateWithName(iFontName: interop.Object, iSize: number): interop.Object;

export declare function NewSRCallBackUPP(userRoutine: (p1: interop.PointerConvertible) => void): (p1: interop.PointerConvertible) => void;

export declare function DisposeSRCallBackUPP(userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function InvokeSRCallBackUPP(param: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible) => void): void;

export declare function SROpenRecognitionSystem(system: interop.PointerConvertible, systemID: number): number;

export declare function SRCloseRecognitionSystem(system: interop.PointerConvertible): number;

export declare function SRSetProperty(srObject: interop.PointerConvertible, selector: number, property: interop.PointerConvertible, propertyLen: number): number;

export declare function SRGetProperty(srObject: interop.PointerConvertible, selector: number, property: interop.PointerConvertible, propertyLen: interop.PointerConvertible): number;

export declare function SRReleaseObject(srObject: interop.PointerConvertible): number;

export declare function SRGetReference(srObject: interop.PointerConvertible, newObjectRef: interop.PointerConvertible): number;

export declare function SRNewRecognizer(system: interop.PointerConvertible, recognizer: interop.PointerConvertible, sourceID: number): number;

export declare function SRStartListening(recognizer: interop.PointerConvertible): number;

export declare function SRStopListening(recognizer: interop.PointerConvertible): number;

export declare function SRSetLanguageModel(recognizer: interop.PointerConvertible, languageModel: interop.PointerConvertible): number;

export declare function SRGetLanguageModel(recognizer: interop.PointerConvertible, languageModel: interop.PointerConvertible): number;

export declare function SRContinueRecognition(recognizer: interop.PointerConvertible): number;

export declare function SRCancelRecognition(recognizer: interop.PointerConvertible): number;

export declare function SRIdle(): number;

export declare function SRNewLanguageModel(system: interop.PointerConvertible, model: interop.PointerConvertible, name: interop.PointerConvertible, nameLength: number): number;

export declare function SRNewPath(system: interop.PointerConvertible, path: interop.PointerConvertible): number;

export declare function SRNewPhrase(system: interop.PointerConvertible, phrase: interop.PointerConvertible, text: interop.PointerConvertible, textLength: number): number;

export declare function SRNewWord(system: interop.PointerConvertible, word: interop.PointerConvertible, text: interop.PointerConvertible, textLength: number): number;

export declare function SRPutLanguageObjectIntoHandle(languageObject: interop.PointerConvertible, lobjHandle: interop.PointerConvertible): number;

export declare function SRPutLanguageObjectIntoDataFile(languageObject: interop.PointerConvertible, fRefNum: number): number;

export declare function SRNewLanguageObjectFromHandle(system: interop.PointerConvertible, languageObject: interop.PointerConvertible, lObjHandle: interop.PointerConvertible): number;

export declare function SRNewLanguageObjectFromDataFile(system: interop.PointerConvertible, languageObject: interop.PointerConvertible, fRefNum: number): number;

export declare function SREmptyLanguageObject(languageObject: interop.PointerConvertible): number;

export declare function SRChangeLanguageObject(languageObject: interop.PointerConvertible, text: interop.PointerConvertible, textLength: number): number;

export declare function SRAddLanguageObject(base: interop.PointerConvertible, addon: interop.PointerConvertible): number;

export declare function SRAddText(base: interop.PointerConvertible, text: interop.PointerConvertible, textLength: number, refCon: interop.PointerConvertible): number;

export declare function SRRemoveLanguageObject(base: interop.PointerConvertible, toRemove: interop.PointerConvertible): number;

export declare function SRCountItems(container: interop.PointerConvertible, count: interop.PointerConvertible): number;

export declare function SRGetIndexedItem(container: interop.PointerConvertible, item: interop.PointerConvertible, index: number): number;

export declare function SRSetIndexedItem(container: interop.PointerConvertible, item: interop.PointerConvertible, index: number): number;

export declare function SRRemoveIndexedItem(container: interop.PointerConvertible, index: number): number;

export declare function SRDrawText(recognizer: interop.PointerConvertible, dispText: interop.PointerConvertible, dispLength: number): number;

export declare function SRDrawRecognizedText(recognizer: interop.PointerConvertible, dispText: interop.PointerConvertible, dispLength: number): number;

export declare function SRSpeakText(recognizer: interop.PointerConvertible, speakText: interop.PointerConvertible, speakLength: number): number;

export declare function SRSpeakAndDrawText(recognizer: interop.PointerConvertible, text: interop.PointerConvertible, textLength: number): number;

export declare function SRStopSpeech(recognizer: interop.PointerConvertible): number;

export declare function SRSpeechBusy(recognizer: interop.PointerConvertible): number;

export declare function SRProcessBegin(recognizer: interop.PointerConvertible, failed: number): number;

export declare function SRProcessEnd(recognizer: interop.PointerConvertible, failed: number): number;

export declare function KCAddAppleSharePassword(serverSignature: interop.PointerConvertible, serverAddress: interop.PointerConvertible, serverName: interop.PointerConvertible, volumeName: interop.PointerConvertible, accountName: interop.PointerConvertible, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function KCAddInternetPassword(serverName: interop.PointerConvertible, securityDomain: interop.PointerConvertible, accountName: interop.PointerConvertible, port: number, protocol: number, authType: number, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function KCAddInternetPasswordWithPath(serverName: interop.PointerConvertible, securityDomain: interop.PointerConvertible, accountName: interop.PointerConvertible, path: interop.PointerConvertible, port: number, protocol: number, authType: number, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function KCAddGenericPassword(serviceName: interop.PointerConvertible, accountName: interop.PointerConvertible, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function KCAddItem(item: interop.Object): number;

export declare function KCUnlock(keychain: interop.Object, password: interop.PointerConvertible): number;

export declare function KCCreateKeychain(password: interop.PointerConvertible, keychain: interop.PointerConvertible): number;

export declare function KCChangeSettings(keychain: interop.Object): number;

export declare function kcunlock(keychain: interop.Object, password: string): number;

export declare function kccreatekeychain(password: string, keychain: interop.PointerConvertible): number;

export declare function kcaddapplesharepassword(serverSignature: interop.PointerConvertible, serverAddress: string, serverName: string, volumeName: string, accountName: string, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function kcaddinternetpassword(serverName: string, securityDomain: string, accountName: string, port: number, protocol: number, authType: number, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function kcaddinternetpasswordwithpath(serverName: string, securityDomain: string, accountName: string, path: string, port: number, protocol: number, authType: number, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function kcaddgenericpassword(serviceName: string, accountName: string, passwordLength: number, passwordData: interop.PointerConvertible, item: interop.PointerConvertible): number;

export declare function NewURLNotifyUPP(userRoutine: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number;

export declare function NewURLSystemEventUPP(userRoutine: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number;

export declare function DisposeURLNotifyUPP(userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): void;

export declare function DisposeURLSystemEventUPP(userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): void;

export declare function InvokeURLNotifyUPP(userContext: interop.PointerConvertible, event: number, callbackInfo: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number): number;

export declare function InvokeURLSystemEventUPP(userContext: interop.PointerConvertible, event: interop.PointerConvertible, userUPP: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number): number;

export declare function SecChooseIdentity(displayInfo: interop.Object, identities: interop.Object, identityRef: interop.PointerConvertible): number;

export declare function SecChooseIdentityAsSheet(parentWindow: interop.PointerConvertible, inTarget: interop.PointerConvertible, displayInfo: interop.Object, identities: interop.Object): number;

export declare function SecDisplayCertificate(certificate: interop.Object, keychainList: interop.Object): number;

export declare function SecDisplayCertificateGroup(certificates: interop.PointerConvertible, keychainList: interop.Object): number;

export declare function SecEditTrust(displayInfo: interop.Object, trust: interop.Object): number;

export declare function SecEditTrustAsSheet(parentWindow: interop.PointerConvertible, inTarget: interop.PointerConvertible, displayInfo: interop.Object, trust: interop.Object): number;

export declare function AHSearch(bookname: interop.Object, query: interop.Object): number;

export declare function AHGotoMainTOC(toctype: number): number;

export declare function AHGotoPage(bookname: interop.Object, path: interop.Object, anchor: interop.Object): number;

export declare function AHLookupAnchor(bookname: interop.Object, anchor: interop.Object): number;

export declare function AHRegisterHelpBook(appBundleRef: interop.PointerConvertible): number;

export declare function AHRegisterHelpBookWithURL(applicationURL: interop.PointerConvertible): number;

export declare interface IMKUnicodeTextInput {
  insertText(string: interop.Object): void;
}

export declare class IMKUnicodeTextInput extends NativeObject implements IMKUnicodeTextInput {
}

export declare interface IMKTextInput {
  insertTextReplacementRange(string: interop.Object, replacementRange: _NSRange): void;

  setMarkedTextSelectionRangeReplacementRange(string: interop.Object, selectionRange: _NSRange, replacementRange: _NSRange): void;

  selectedRange(): _NSRange;

  markedRange(): _NSRange;

  attributedSubstringFromRange(range: _NSRange): NSAttributedString;

  length(): number;

  characterIndexForPointTrackingInMarkedRange(point: CGPoint, mappingMode: number, inMarkedRange: interop.PointerConvertible): number;

  attributesForCharacterIndexLineHeightRectangle(index: number, lineRect: interop.PointerConvertible): NSDictionary;

  validAttributesForMarkedText(): NSArray;

  overrideKeyboardWithKeyboardNamed(keyboardUniqueName: string): void;

  selectInputMode(modeIdentifier: string): void;

  supportsUnicode(): boolean;

  bundleIdentifier(): string;

  windowLevel(): number;

  supportsProperty(property: number): boolean;

  uniqueClientIdentifierString(): string;

  stringFromRangeActualRange(range: _NSRange, actualRange: interop.PointerConvertible): string;

  firstRectForCharacterRangeActualRange(aRange: _NSRange, actualRange: interop.PointerConvertible): CGRect;
}

export declare class IMKTextInput extends NativeObject implements IMKTextInput {
}
