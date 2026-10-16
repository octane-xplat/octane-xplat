import type {
	NSBezierPath,
	NSColor,
	NSImage,
	NSPasteboard,
	NSPasteboardReading,
	NSPasteboardWriting,
	NSStringDrawingContext,
	NSTextAttachment,
	NSTextBlock,
	NSTextList,
	NSTextTable,
	NSWorkspaceAuthorization,
} from './AppKit'

import type { CKContainer, CKRecordValue, CKShare } from './CloudKit'

import type { CNKeyDescriptor } from './Contacts'

import type { NSFetchRequestResult } from './CoreData'

import type { CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { CIBarcodeDescriptor } from './CoreImage'

import type { CMTime, CMTimeMapping, CMTimeRange } from './CoreMedia'

import type { CSSearchableItemAttributeSet } from './CoreSpotlight'

import type { NSFileProviderItem } from './FileProvider'

import type { GKRandomSource } from './GameplayKit'

import type { MKCoordinateSpan, MKMapItem } from './MapKit'

import type { CAAction, CATransform3D } from './QuartzCore'

import type { QLPreviewItem } from './QuickLookUI'

import type { NSObjectProtocol } from './Runtime'

import type { SCNVector3, SCNVector4 } from './SceneKit'

import type { UTType } from './UniformTypeIdentifiers'

import type { CLLocationCoordinate2D } from './_LocationEssentials'

import type { interop } from './objc-runtime'

import {
	NSFontTraitMask,
	NSPasteboardReadingOptions,
	NSPasteboardWritingOptions,
	NSStringDrawingOptions,
	NSTextAlignment,
	NSWritingDirection,
} from './AppKit'

import { NSObject } from './Runtime'

import { SSLProtocol, tls_protocol_version_t } from './Security'

import { NativeObject } from './objc-runtime'

export declare const NSKeepAllocationStatistics: boolean

export declare const NSDeallocateZombies: boolean

export declare const NSMetadataItemKeywordsKey: string

export declare const NSMetadataItemTitleKey: string

export declare const NSNoScriptError: number

export declare const NSStringEncodingErrorKey: string

export declare const NSStreamSocketSSLErrorDomain: string

export declare const NSURLErrorKey: string

export declare const NSLocalizedFailureErrorKey: string

export declare const NSURLErrorBackgroundTaskCancelledReasonKey: string

export declare const NSOperationNotSupportedForKeyScriptError: number

export declare const NSKeyValueValidationError: number

export declare const NSStringTransformLatinToKatakana: string

export declare const NSMetadataItemEXIFGPSVersionKey: string

export declare const NSStreamSOCKSProxyConfigurationKey: string

export declare const NSGrammarCorrections: string

export declare const NSDecompressionFailedError: number

export declare const NSURLVolumeURLForRemountingKey: string

export declare const NSURLVolumeIsJournalingKey: string

export declare const NSStringEncodingDetectionFromWindowsKey: string

export declare const NSStreamDataWrittenToMemoryStreamKey: string

export declare const NSConnectionDidInitializeNotification: string

export declare const NSFileReadInvalidFileNameError: number

export declare const NSURLTotalFileSizeKey: string

export declare const NSTextCheckingAllSystemTypes: number

export declare const NSFileReadCorruptFileError: number

export declare const NSShiftJISStringEncoding: number

export declare const NSBundleExecutableArchitectureI386: number

export declare const NSURLVolumeAvailableCapacityForOpportunisticUsageKey: string

export declare const NSIntMapValueCallBacks: NSMapTableValueCallBacks

export declare const NSMetadataItemTextContentKey: string

export declare const NSMetadataItemExposureTimeStringKey: string

export declare const NSLocaleMeasurementSystem: string

export declare const NSHourNameDesignations: string

export declare const NSMetadataItemRecipientsKey: string

export declare const NSRunLoopCommonModes: string

export declare const NSMetadataItemDeliveryTypeKey: string

export declare const NSZeroSize: CGSize

export declare const NSUnionOfArraysKeyValueOperator: string

export declare const NSNegativeCurrencyFormatString: string

export declare const NSFileLockingError: number

export declare const NSURLFileResourceTypeNamedPipe: string

export declare const NSURLVolumeResourceCountKey: string

export declare const NSMetadataItemAcquisitionModelKey: string

export declare const NSURLAuthenticationMethodHTMLForm: string

export declare const NSFoundationVersionNumber: number

export declare const NSExecutableNotLoadableError: number

export declare const NSStringTransformLatinToArabic: string

export declare const NSFileReadInapplicableStringEncodingError: number

export declare const NSObjectMapKeyCallBacks: NSMapTableKeyCallBacks

export declare const NSURLUbiquitousItemPercentDownloadedKey: string

export declare const NSURLFileContentIdentifierKey: string

export declare const NSURLVolumeSupportsRootDirectoryDatesKey: string

export declare const NSXPCConnectionErrorMinimum: number

export declare const NSLinguisticTagWhitespace: string

export declare const NSPersonNameComponentDelimiter: string

export declare const NSURLUbiquitousItemDownloadingStatusNotDownloaded: string

export declare const NSMetadataItemMusicalInstrumentNameKey: string

export declare const NSURLCreationDateKey: string

export declare const NSMetadataItemGPSDestDistanceKey: string

export declare const NSFileWriteFileExistsError: number

export declare const NSOwnedPointerHashCallBacks: NSHashTableCallBacks

export declare const NSExtensionJavaScriptPreprocessingResultsKey: string

export declare const NSURLUbiquitousItemIsDownloadedKey: string

export declare const NSMetadataItemGPSDOPKey: string

export declare const NSCalendarIdentifierIslamic: string

export declare const NSMapTableWeakMemory: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSURLIsUserImmutableKey: string

export declare const NSLinguisticTagIdiom: string

export declare const NSURLVolumeURLKey: string

export declare const NSCoderReadCorruptError: number

export declare const NSMetadataItemAlbumKey: string

export declare const NSFileAppendOnly: string

export declare const NSProgressFileOperationKindUploading: string

export declare const NSMetadataItemDurationSecondsKey: string

export declare const NSNextDayDesignations: string

export declare const NSLinguisticTagPronoun: string

export declare const NSURLIsHiddenKey: string

export declare const NSMetadataItemOrientationKey: string

export declare const NSFileHandleOperationException: string

export declare const NSArgumentEvaluationScriptError: number

export declare const NSURLUbiquitousItemHasUnresolvedConflictsKey: string

export declare const NSCalendarIdentifierISO8601: string

export declare const NSUbiquitousFileUbiquityServerNotAvailable: number

export declare const NSURLAddedToDirectoryDateKey: string

export declare const NSCloudSharingConflictError: number

export declare const NSMetadataQueryUpdateRemovedItemsKey: string

export declare const NSUbiquityIdentityDidChangeNotification: string

export declare const NSNextNextDayDesignations: string

export declare const NSHTTPPropertyRedirectionHeadersKey: string

export declare const NSPropertyListErrorMaximum: number

export declare const NSURLUbiquitousItemDownloadRequestedKey: string

export declare const NSNonRetainedObjectHashCallBacks: NSHashTableCallBacks

export declare const NSInvocationOperationVoidResultException: string

export declare const NSXPCConnectionInvalid: number

export declare const NSUbiquitousKeyValueStoreAccountChange: number

export declare const NSFormattingError: number

export declare const NSURLVolumeSupportsSwapRenamingKey: string

export declare const NSMetadataQueryUserHomeScope: string

export declare const NSURLUbiquitousSharedItemMostRecentEditorNameComponentsKey: string

export declare const NSMetadataItemProjectsKey: string

export declare const NSUndefinedDateComponent: number

export declare const NSDecimalNumberOverflowException: string

export declare const NSMetadataItemPublishersKey: string

export declare const NSHTTPCookiePath: string

export declare const NSProgressFileURLKey: string

export declare const NSMetadataQueryNetworkScope: string

export declare const NSMetadataItemMusicalGenreKey: string

export declare const NSUnionOfSetsKeyValueOperator: string

export declare const NSMetadataUbiquitousItemDownloadRequestedKey: string

export declare const NSURLFileResourceTypeCharacterSpecial: string

export declare const NSOwnedPointerMapKeyCallBacks: NSMapTableKeyCallBacks

export declare const NSURLUbiquitousItemIsUploadingKey: string

export declare const NSURLIsExcludedFromBackupKey: string

export declare const NSURLErrorUserAuthenticationRequired: number

export declare const NSMetadataItemCountryKey: string

export declare const NSXMLParserErrorDomain: string

export declare const NSIndianCalendar: string

export declare const NSMapTableObjectPointerPersonality: interop.Enum<
	typeof NSPointerFunctionsOptions
>

export declare const NSExtensionItemAttributedTitleKey: string

export declare const NSMetadataItemAppleLoopsLoopModeKey: string

export declare const NSURLProtectionSpaceHTTPSProxy: string

export declare const NSOwnedObjectIdentityHashCallBacks: NSHashTableCallBacks

export declare const NSMetadataItemOrganizationsKey: string

export declare const NSStringEncodingDetectionUseOnlySuggestedEncodingsKey: string

export declare const NSURLFileResourceIdentifierKey: string

export declare const NSPositiveCurrencyFormatString: string

export declare const NSMetadataItemFNumberKey: string

export declare const NSMetadataItemAttributeChangeDateKey: string

export declare const NSInternationalCurrencyString: string

export declare const NSURLTotalFileAllocatedSizeKey: string

export declare const NSURLErrorFailingURLErrorKey: string

export declare const NSSunOSOperatingSystem: number

export declare const NSMetadataItemLatitudeKey: string

export declare const NSURLErrorRedirectToNonExistentLocation: number

export declare const NSMetadataItemURLKey: string

export declare const NSURLIsAliasFileKey: string

export declare const NSMetadataItemPathKey: string

export declare const NSURLLinkCountKey: string

export declare const NSMetadataItemResolutionHeightDPIKey: string

export declare const NSGrammarUserDescription: string

export declare const NSGrammarRange: string

export declare const NSOperationNotSupportedForKeySpecifierError: number

export declare const NSInternalSpecifierError: number

export declare const NSInvalidIndexSpecifierError: number

export declare const NSUnknownKeySpecifierError: number

export declare const NSContainerSpecifierError: number

export declare const NSNoTopLevelContainersSpecifierError: number

export declare const NSNoSpecifierError: number

export declare const NSOperationNotSupportedForKeyException: string

export declare const NSUnknownKeyScriptError: number

export declare const NSArgumentsWrongScriptError: number

export declare const NSRequiredArgumentsMissingScriptError: number

export declare const NSReceiversCantHandleCommandScriptError: number

export declare const NSMetadataUbiquitousItemPercentDownloadedKey: string

export declare const NSReceiverEvaluationScriptError: number

export declare const NSClassDescriptionNeededForClassNotification: string

export declare const NSAppleEventTimeOutNone: number

export declare const NSNotificationPostToAllSessions: interop.Enum<
	typeof NSDistributedNotificationOptions
>

export declare const NSLocalNotificationCenterType: string

export declare const NSConnectionDidDieNotification: string

export declare const NSAppleScriptErrorBriefMessage: string

export declare const NSAppleScriptErrorAppName: string

export declare const NSAppleScriptErrorNumber: string

export declare const NSAppleScriptErrorMessage: string

export declare const NSURLSessionDownloadTaskResumeData: string

export declare const NSURLSessionTaskPriorityHigh: number

export declare const NSURLSessionTaskPriorityLow: number

export declare const NSURLSessionTaskPriorityDefault: number

export declare const NSURLSessionTransferSizeUnknown: number

export declare const NSUndoManagerDidCloseUndoGroupNotification: string

export declare const NSUndoManagerDidOpenUndoGroupNotification: string

export declare const NSUndoManagerDidRedoChangeNotification: string

export declare const NSUndoManagerDidUndoChangeNotification: string

export declare const NSUndoManagerWillRedoChangeNotification: string

export declare const NSUndoManagerGroupIsDiscardableKey: string

export declare const NSUndoCloseGroupingRunLoopOrdering: number

export declare const NSUbiquitousKeyValueStoreInitialSyncChange: number

export declare const NSUbiquitousKeyValueStoreChangeReasonKey: string

export declare const NSNetServicesErrorDomain: string

export declare const NSMetadataQueryUbiquitousDocumentsScope: string

export declare const NSMetadataQueryIndexedLocalComputerScope: string

export declare const NSMetadataQueryResultContentRelevanceAttribute: string

export declare const NSMetadataQueryUpdateChangedItemsKey: string

export declare const NSMetadataQueryUpdateAddedItemsKey: string

export declare const NSMetadataQueryDidFinishGatheringNotification: string

export declare const NSMetadataQueryGatheringProgressNotification: string

export declare const NSMetadataQueryDidStartGatheringNotification: string

export declare const NSMetadataItemIsApplicationManagedKey: string

export declare const NSMetadataItemApplicationCategoriesKey: string

export declare const NSMetadataItemExecutablePlatformKey: string

export declare const NSMetadataItemIsLikelyJunkKey: string

export declare const NSMetadataItemAuthorAddressesKey: string

export declare const NSMetadataItemOriginalFormatKey: string

export declare const NSMetadataItemPerformersKey: string

export declare const NSMetadataItemGenreKey: string

export declare const NSMetadataItemProducerKey: string

export declare const NSMetadataItemDirectorKey: string

export declare const NSMetadataItemInformationKey: string

export declare const NSMetadataItemMusicalInstrumentCategoryKey: string

export declare const NSMetadataItemFinderCommentKey: string

export declare const NSMetadataItemKindKey: string

export declare const NSMetadataItemInstantMessageAddressesKey: string

export declare const NSMetadataItemEmailAddressesKey: string

export declare const NSMetadataItemStarRatingKey: string

export declare const NSMetadataItemDueDateKey: string

export declare const NSMetadataItemEncodingApplicationsKey: string

export declare const NSMetadataItemCreatorKey: string

export declare const NSMetadataItemPageHeightKey: string

export declare const NSMetadataItemPageWidthKey: string

export declare const NSMetadataItemNumberOfPagesKey: string

export declare const NSMetadataItemIdentifierKey: string

export declare const NSMetadataItemThemeKey: string

export declare const NSMetadataItemSubjectKey: string

export declare const NSMetadataItemCoverageKey: string

export declare const NSMetadataItemContributorsKey: string

export declare const NSMetadataItemLanguagesKey: string

export declare const NSMetadataItemIsGeneralMIDISequenceKey: string

export declare const NSMetadataItemAudioTrackNumberKey: string

export declare const NSMetadataItemTimeSignatureKey: string

export declare const NSMetadataItemKeySignatureKey: string

export declare const NSMetadataItemTempoKey: string

export declare const NSMetadataItemAudioSampleRateKey: string

export declare const NSMetadataItemStateOrProvinceKey: string

export declare const NSMetadataItemCityKey: string

export declare const NSMetadataItemMaxApertureKey: string

export declare const NSMetadataItemMeteringModeKey: string

export declare const NSMetadataItemAudioBitRateKey: string

export declare const NSMetadataItemStreamableKey: string

export declare const NSMetadataItemMediaTypesKey: string

export declare const NSMetadataItemCodecsKey: string

export declare const NSMetadataItemGPSDifferentalKey: string

export declare const NSMetadataItemGPSDateStampKey: string

export declare const NSMetadataItemGPSProcessingMethodKey: string

export declare const NSMetadataItemGPSMapDatumKey: string

export declare const NSMetadataItemGPSMeasureModeKey: string

export declare const NSMetadataItemNamedLocationKey: string

export declare const NSMetadataItemGPSTrackKey: string

export declare const NSMetadataItemTimestampKey: string

export declare const NSMetadataItemLongitudeKey: string

export declare const NSMetadataItemAltitudeKey: string

export declare const NSMetadataItemLensModelKey: string

export declare const NSMetadataItemExposureTimeSecondsKey: string

export declare const NSMetadataItemExposureModeKey: string

export declare const NSMetadataItemResolutionWidthDPIKey: string

export declare const NSMetadataItemApertureKey: string

export declare const NSNotificationDeliverImmediately: interop.Enum<
	typeof NSDistributedNotificationOptions
>

export declare const NSMetadataItemWhiteBalanceKey: string

export declare const NSMetadataItemISOSpeedKey: string

export declare const NSMetadataItemAcquisitionMakeKey: string

export declare const NSMetadataItemFlashOnOffKey: string

export declare const NSMetadataItemBitsPerSampleKey: string

export declare const NSMetadataItemColorSpaceKey: string

export declare const NSMetadataItemPixelWidthKey: string

export declare const NSMetadataItemPixelHeightKey: string

export declare const NSMetadataItemContactKeywordsKey: string

export declare const NSMetadataItemContentModificationDateKey: string

export declare const NSMetadataItemLastUsedDateKey: string

export declare const NSMetadataItemWhereFromsKey: string

export declare const NSMetadataItemDownloadedDateKey: string

export declare const NSMetadataItemEditorsKey: string

export declare const NSMetadataUbiquitousSharedItemPermissionsReadWrite: string

export declare const NSMetadataUbiquitousSharedItemPermissionsReadOnly: string

export declare const NSMetadataUbiquitousSharedItemRoleParticipant: string

export declare const NSMetadataUbiquitousSharedItemRoleOwner: string

export declare const NSMetadataItemCopyrightKey: string

export declare const NSMetadataUbiquitousSharedItemCurrentUserPermissionsKey: string

export declare const NSNetServicesErrorCode: string

export declare const NSMetadataUbiquitousItemHasUnresolvedConflictsKey: string

export declare const NSMetadataUbiquitousItemIsSharedKey: string

export declare const NSMetadataUbiquitousItemURLInLocalContainerKey: string

export declare const NSMetadataUbiquitousItemContainerDisplayNameKey: string

export declare const NSMetadataUbiquitousItemIsExternalDocumentKey: string

export declare const NSMetadataUbiquitousItemDownloadingErrorKey: string

export declare const NSMetadataUbiquitousItemIsUploadingKey: string

export declare const NSMetadataUbiquitousItemIsUploadedKey: string

export declare const NSMetadataUbiquitousItemDownloadingStatusCurrent: string

export declare const NSMetadataUbiquitousItemDownloadingStatusDownloaded: string

export declare const NSMetadataUbiquitousItemDownloadingStatusNotDownloaded: string

export declare const NSMetadataUbiquitousItemDownloadingStatusKey: string

export declare const NSMetadataUbiquitousItemIsDownloadedKey: string

export declare const NSMetadataItemContentTypeTreeKey: string

export declare const NSMetadataItemContentTypeKey: string

export declare const NSMetadataItemFSContentChangeDateKey: string

export declare const NSMetadataItemFSNameKey: string

export declare const NSLinguisticTagOrganizationName: string

export declare const NSLinguisticTagPlaceName: string

export declare const NSLinguisticTagPersonalName: string

export declare const NSLinguisticTagParagraphBreak: string

export declare const NSLinguisticTagOtherPunctuation: string

export declare const NSLinguisticTagDash: string

export declare const NSLinguisticTagWordJoiner: string

export declare const NSLinguisticTagCloseParenthesis: string

export declare const NSLinguisticTagCloseQuote: string

export declare const NSLinguisticTagSentenceTerminator: string

export declare const NSLinguisticTagClassifier: string

export declare const NSLinguisticTagInterjection: string

export declare const NSLinguisticTagConjunction: string

export declare const NSLinguisticTagPreposition: string

export declare const NSLinguisticTagParticle: string

export declare const NSLinguisticTagDeterminer: string

export declare const NSLinguisticTagAdjective: string

export declare const NSLinguisticTagVerb: string

export declare const NSLinguisticTagOther: string

export declare const NSLinguisticTagPunctuation: string

export declare const NSLinguisticTagSchemeScript: string

export declare const NSLinguisticTagSchemeNameType: string

export declare const NSLinguisticTagSchemeTokenType: string

export declare const NSExtensionItemAttributedContentTextKey: string

export declare const NSExtensionItemsAndErrorsKey: string

export declare const NSCompressionErrorMinimum: number

export declare const NSCompressionFailedError: number

export declare const NSCloudSharingErrorMaximum: number

export declare const NSCloudSharingOtherError: number

export declare const NSCloudSharingTooManyParticipantsError: number

export declare const NSCloudSharingQuotaExceededError: number

export declare const NSBundleOnDemandResourceExceededMaximumSizeError: number

export declare const NSBundleOnDemandResourceOutOfSpaceError: number

export declare const NSBundleErrorMaximum: number

export declare const NSBundleErrorMinimum: number

export declare const NSCoderErrorMaximum: number

export declare const NSCoderErrorMinimum: number

export declare const NSCoderInvalidValueError: number

export declare const NSUserActivityErrorMaximum: number

export declare const NSUserActivityErrorMinimum: number

export declare const NSUserActivityRemoteApplicationTimedOutError: number

export declare const NSUserActivityHandoffFailedError: number

export declare const NSUbiquitousFileErrorMaximum: number

export declare const NSUbiquitousFileErrorMinimum: number

export declare const NSXPCConnectionErrorMaximum: number

export declare const NSXPCConnectionReplyInvalid: number

export declare const NSXPCConnectionInterrupted: number

export declare const NSPropertyListErrorMinimum: number

export declare const NSPropertyListWriteInvalidError: number

export declare const NSPropertyListReadStreamError: number

export declare const NSPropertyListReadCorruptError: number

export declare const NSExecutableErrorMaximum: number

export declare const NSValidationErrorMaximum: number

export declare const NSValidationErrorMinimum: number

export declare const NSFileErrorMinimum: number

export declare const NSExecutableLinkError: number

export declare const NSExecutableLoadError: number

export declare const NSExecutableArchitectureMismatchError: number

export declare const NSUserCancelledError: number

export declare const NSFileManagerUnmountBusyError: number

export declare const NSFileManagerUnmountUnknownError: number

export declare const NSFileWriteOutOfSpaceError: number

export declare const NSFileWriteInvalidFileNameError: number

export declare const NSFileWriteUnknownError: number

export declare const NSFileReadUnknownStringEncodingError: number

export declare const NSFileReadTooLargeError: number

export declare const NSFileNoSuchFileError: number

export declare const NSKeyedUnarchiveFromDataTransformerName: string

export declare const NSUnarchiveFromDataTransformerName: string

export declare const NSIsNotNilTransformerName: string

export declare const NSIsNilTransformerName: string

export declare const NSNegateBooleanTransformerName: string

export declare const NSDateTimeOrdering: string

export declare const NSLaterTimeDesignations: string

export declare const NSYearMonthWeekDesignations: string

export declare const NSDecimalDigits: string

export declare const NSThousandsSeparator: string

export declare const NSCurrencySymbol: string

export declare const NSShortTimeDateFormatString: string

export declare const NSDateFormatString: string

export declare const NSTimeFormatString: string

export declare const NSShortMonthNameArray: string

export declare const NSMonthNameArray: string

export declare const NSUserDefaultsDidChangeNotification: string

export declare const NSRegistrationDomain: string

export declare const NSWindows95OperatingSystem: number

export declare const NSExecutableErrorMinimum: number

export declare const NSURLErrorBackgroundSessionWasDisconnected: number

export declare const NSURLErrorRequestBodyStreamExhausted: number

export declare const NSURLErrorCallIsActive: number

export declare const NSURLErrorInternationalRoamingOff: number

export declare const NSURLErrorCannotMoveFile: number

export declare const NSURLErrorCannotWriteToFile: number

export declare const NSUnderlyingErrorKey: string

export declare const NSURLErrorCannotCloseFile: number

export declare const NSURLErrorCannotOpenFile: number

export declare const NSURLErrorCannotCreateFile: number

export declare const NSURLErrorServerCertificateHasUnknownRoot: number

export declare const NSURLErrorServerCertificateHasBadDate: number

export declare const NSURLErrorSecureConnectionFailed: number

export declare const NSURLErrorDataLengthExceedsMaximum: number

export declare const NSURLErrorNoPermissionsToReadFile: number

export declare const NSURLErrorFileIsDirectory: number

export declare const NSURLErrorCannotParseResponse: number

export declare const NSURLErrorUserCancelledAuthentication: number

export declare const NSURLErrorBadServerResponse: number

export declare const NSURLErrorNotConnectedToInternet: number

export declare const NSURLErrorResourceUnavailable: number

export declare const NSURLErrorHTTPTooManyRedirects: number

export declare const NSURLErrorDNSLookupFailed: number

export declare const NSURLErrorNetworkConnectionLost: number

export declare const NSURLErrorCancelled: number

export declare const NSURLErrorUnknown: number

export declare const NSURLErrorNetworkUnavailableReasonKey: string

export declare const NSURLErrorCancelledReasonInsufficientSystemResources: number

export declare const NSURLErrorCancelledReasonBackgroundUpdatesDisabled: number

export declare const NSURLErrorCancelledReasonUserForceQuitApplication: number

export declare const NSURLErrorFailingURLStringErrorKey: string

export declare const NSLocaleAlternateQuotationBeginDelimiterKey: string

export declare const NSDebugEnabled: boolean

export declare const NSMetadataItemDateAddedKey: string

export declare const NSURLContentTypeKey: string

export declare const NSMetadataUbiquitousSharedItemMostRecentEditorNameComponentsKey: string

export declare const NSMetadataItemRecordingYearKey: string

export declare const NSLinguisticTagSchemeNameTypeOrLexicalClass: string

export declare const NSURLUbiquitousSharedItemPermissionsReadWrite: string

export declare const NSDestinationInvalidException: string

export declare const NSMetadataItemAudioEncodingApplicationKey: string

export declare const NSInvalidArchiveOperationException: string

export declare const NSUbiquitousFileNotUploadedDueToQuotaError: number

export declare const NSStreamSocketSecurityLevelKey: string

export declare const NSLinguisticTagOtherWhitespace: string

export declare const NSMetadataItemSpeedKey: string

export declare const NSURLErrorAppTransportSecurityRequiresSecureConnection: number

export declare const NSCocoaErrorDomain: string

export declare const NSMetadataItemSecurityMethodKey: string

export declare const NSPersonNameComponentFamilyName: string

export declare const NSHTTPCookieValue: string

export declare const NSJapaneseEUCStringEncoding: number

export declare const NSMacOSRomanStringEncoding: number

export declare const NSStringTransformFullwidthToHalfwidth: string

export declare const NSFTPPropertyFTPProxy: string

export declare const NSURLVolumeSupportsSparseFilesKey: string

export declare const NSMetadataItemContentCreationDateKey: string

export declare const NSStreamSOCKSProxyVersion4: string

export declare const NSExtensionItemAttachmentsKey: string

export declare const NSFileExtensionHidden: string

export declare const NSMetadataItemGPSStatusKey: string

export declare const NSCoderValueNotFoundError: number

export declare const NSHTTPCookieMaximumAge: string

export declare const NSDecimalNumberExactnessException: string

export declare const NSURLIsPurgeableKey: string

export declare const NSBundleDidLoadNotification: string

export declare const NSDistinctUnionOfSetsKeyValueOperator: string

export declare const NSURLTypeIdentifierKey: string

export declare const NSSolarisOperatingSystem: number

export declare const NSFileReadNoSuchFileError: number

export declare const NSMetadataItemDescriptionKey: string

export declare const NSURLCustomIconKey: string

export declare const NSURLErrorCannotConnectToHost: number

export declare const NSMinimumKeyValueOperator: string

export declare const NSURLVolumeSupportsAccessPermissionsKey: string

export declare const NSMetadataUbiquitousItemPercentUploadedKey: string

export declare const NSCloudSharingErrorMinimum: number

export declare const NSURLLocalizedNameKey: string

export declare const NSMetadataItemVersionKey: string

export declare const NSURLIsRegularFileKey: string

export declare const NSNonOwnedPointerMapKeyCallBacks: NSMapTableKeyCallBacks

export declare const NSConnectionReplyMode: string

export declare const NSURLVolumeIsEncryptedKey: string

export declare const NSPortReceiveException: string

export declare const NSAMPMDesignation: string

export declare const NSMetadataItemLayerNamesKey: string

export declare const NSWillBecomeMultiThreadedNotification: string

export declare const NSPersonNameComponentNickname: string

export declare const NSURLFileProtectionNone: string

export declare const NSProgressFileTotalCountKey: string

export declare const NSMetadataItemDisplayNameKey: string

export declare const NSTaskDidTerminateNotification: string

export declare const NSUserActivityHandoffUserInfoTooLargeError: number

export declare const NSScannedOption: number

export declare const NSURLUbiquitousItemDownloadingStatusDownloaded: string

export declare const NSURLIsDirectoryKey: string

export declare const NSLocaleVariantCode: string

export declare const NSFileManagerUnmountDissentingProcessIdentifierErrorKey: string

export declare const NSPOSIXErrorDomain: string

export declare const NSMetadataItemAuthorsKey: string

export declare const NSURLErrorClientCertificateRejected: number

export declare const NSMetadataItemPhoneNumbersKey: string

export declare const NSURLQuarantinePropertiesKey: string

export declare const NSMetadataItemFocalLength35mmKey: string

export declare const NSKeyValueChangeOldKey: string

export declare const NSStreamFileCurrentOffsetKey: string

export declare const NSURLAuthenticationMethodClientCertificate: string

export declare const NSFileTypeUnknown: string

export declare const NSURLLabelNumberKey: string

export declare const NSFileHFSCreatorCode: string

export declare const NSFileOwnerAccountID: string

export declare const NSLinguisticTagNoun: string

export declare const NSFileReadUnsupportedSchemeError: number

export declare const NSErrorFailingURLStringKey: string

export declare const NSURLErrorBackgroundSessionRequiresSharedContainer: number

export declare const NSLinguisticTagSchemeLemma: string

export declare const NSStreamSOCKSProxyPasswordKey: string

export declare const NSUbiquitousKeyValueStoreServerChange: number

export declare const NSStringEncodingDetectionLossySubstitutionKey: string

export declare const NSURLIsReadableKey: string

export declare const NSURLIsSparseKey: string

export declare const NSMetadataItemPixelCountKey: string

export declare const NSObjectHashCallBacks: NSHashTableCallBacks

export declare const NSURLAuthenticationMethodHTTPBasic: string

export declare const NSStreamNetworkServiceTypeCallSignaling: string

export declare const NSPropertyListWriteStreamError: number

export declare const NSMapTableCopyIn: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSNonOwnedPointerHashCallBacks: NSHashTableCallBacks

export declare const NSLinguisticTagSchemeLexicalClass: string

export declare const NSMetadataItemComposerKey: string

export declare const NSMetadataItemRecipientAddressesKey: string

export declare const NSHTTPCookieVersion: string

export declare const NSStreamSOCKSProxyPortKey: string

export declare const NSURLVolumeSupportsCaseSensitiveNamesKey: string

export declare const NSURLAuthenticationMethodServerTrust: string

export declare const NSFileTypeRegular: string

export declare const NSURLErrorDownloadDecodingFailedToComplete: number

export declare const NSOldStyleException: string

export declare const NSDistinctUnionOfArraysKeyValueOperator: string

export declare const NSDecimalNumberUnderflowException: string

export declare const NSMetadataItemVideoBitRateKey: string

export declare const NSMetadataItemExecutableArchitecturesKey: string

export declare const NSFileReadUnknownError: number

export declare const NSMetadataItemIsUbiquitousKey: string

export declare const NSURLErrorFileOutsideSafeArea: number

export declare const NSTextCheckingCountryKey: string

export declare const NSLinguisticTagAdverb: string

export declare const NSParseErrorException: string

export declare const NSNonRetainedObjectMapKeyCallBacks: NSMapTableKeyCallBacks

export declare const NSMetadataItemTotalBitRateKey: string

export declare const NSFileWriteInapplicableStringEncodingError: number

export declare const NSStreamSOCKSProxyHostKey: string

export declare const NSProgressEstimatedTimeRemainingKey: string

export declare const NSGlobalDomain: string

export declare const NSEarlierTimeDesignations: string

export declare const NSUTF32BigEndianStringEncoding: number

export declare const NSURLKeysOfUnsetValuesKey: string

export declare const NSURLIsVolumeKey: string

export declare const NSFileErrorMaximum: number

export declare const NSProgressFileOperationKindDownloading: string

export declare const NSTextCheckingPhoneKey: string

export declare const NSFilePosixPermissions: string

export declare const NSMetadataItemGPSDestLatitudeKey: string

export declare const NSKeySpecifierEvaluationScriptError: number

export declare const NSURLVolumeIsLocalKey: string

export declare const NSDebugDescriptionErrorKey: string

export declare const NSURLErrorDomain: string

export declare const NSMetadataQueryDidUpdateNotification: string

export declare const NSMetadataUbiquitousItemIsDownloadingKey: string

export declare const NSUndoManagerWillUndoChangeNotification: string

export declare const NSStringTransformToXMLHex: string

export declare const NSStringTransformLatinToCyrillic: string

export declare const NSLinguisticTagNumber: string

export declare const NSLinguisticTagOtherWord: string

export declare const NSLocaleCurrencySymbol: string

export declare const NSStringEncodingDetectionDisallowedEncodingsKey: string

export declare const NSHTTPPropertyStatusReasonKey: string

export declare const NSWindowsCP1250StringEncoding: number

export declare const NSURLErrorUnsupportedURL: number

export declare const NSProgressFileIconKey: string

export declare const NSURLErrorCannotDecodeRawData: number

export declare const NSCalendarIdentifierJapanese: string

export declare const NSStreamNetworkServiceTypeVideo: string

export declare const NSURLFileResourceTypeDirectory: string

export declare const NSURLFileResourceTypeUnknown: string

export declare const NSMetadataItemAuthorEmailAddressesKey: string

export declare const NSURLErrorDownloadDecodingFailedMidStream: number

export declare const NSUbiquitousFileUnavailableError: number

export declare const NSShortWeekDayNameArray: string

export declare const NSFileImmutable: string

export declare const NSMetadataItemAppleLoopsRootKeyKey: string

export declare const NSURLErrorCannotLoadFromNetwork: number

export declare const NSURLErrorServerCertificateUntrusted: number

export declare const NSStreamNetworkServiceTypeVoice: string

export declare const NSInternalScriptError: number

export declare const NSURLErrorBackgroundSessionInUseByAnotherProcess: number

export declare const NSWindowsNTOperatingSystem: number

export declare const NSMetadataItemGPSDestLongitudeKey: string

export declare const NSOSF1OperatingSystem: number

export declare const NSTextCheckingAirlineKey: string

export declare const NSURLVolumeSupportsRenamingKey: string

export declare const NSOSStatusErrorDomain: string

export declare const NSISOLatin1StringEncoding: number

export declare const NSAppleEventManagerWillProcessFirstEventNotification: string

export declare const NSURLVolumeUUIDStringKey: string

export declare const NSLocalizedFailureReasonErrorKey: string

export declare const NSFileSystemSize: string

export declare const NSURLEffectiveIconKey: string

export declare const NSKeyValueChangeKindKey: string

export declare const NSURLThumbnailDictionaryKey: string

export declare const NSMetadataItemAudioChannelCountKey: string

export declare const NSDidBecomeSingleThreadedNotification: string

export declare const NSFormattingErrorMaximum: number

export declare const NSURLErrorCannotFindHost: number

export declare const NSUnionOfObjectsKeyValueOperator: string

export declare const NSURLUbiquitousItemIsSharedKey: string

export declare const NSURLVolumeAvailableCapacityKey: string

export declare const NSFTPPropertyFileOffsetKey: string

export declare const NSCloudSharingNoPermissionError: number

export declare const NSFileCreationDate: string

export declare const NSURLThumbnailKey: string

export declare const NSUbiquitousKeyValueStoreQuotaViolationChange: number

export declare const NSURLVolumeSupportsCompressionKey: string

export declare const NSStreamSOCKSErrorDomain: string

export declare const NSURLMayShareFileContentKey: string

export declare const NSURLLabelColorKey: string

export declare const NSStreamSocketSecurityLevelNone: string

export declare const NSStringEncodingDetectionAllowLossyKey: string

export declare const NSFileReadNoPermissionError: number

export declare const NSInvocationOperationCancelledException: string

export declare const NSFileWriteNoPermissionError: number

export declare const NSItemProviderPreferredImageSizeKey: string

export declare const NSURLErrorBadURL: number

export declare const NSLocaleLanguageCode: string

export declare const NSFileProtectionNone: string

export declare const NSURLVolumeSupportsHardLinksKey: string

export declare const NSLocaleCollatorIdentifier: string

export declare const NSThisDayDesignations: string

export declare const NSURLAuthenticationMethodHTTPDigest: string

export declare const NSProgressFileOperationKindKey: string

export declare const NSIntegerMapKeyCallBacks: NSMapTableKeyCallBacks

export declare const NSHPUXOperatingSystem: number

export declare const NSURLErrorClientCertificateRequired: number

export declare const NSArgumentDomain: string

export declare const NSUTF32LittleEndianStringEncoding: number

export declare const NSMetadataItemCFBundleIdentifierKey: string

export declare const NSCollectorDisabledOption: number

export declare const NSFileHandleNotificationFileHandleItem: string

export declare const NSInternalInconsistencyException: string

export declare const NSPersonNameComponentMiddleName: string

export declare const NSStringEncodingDetectionLikelyLanguageKey: string

export declare const NSURLVolumeTotalCapacityKey: string

export declare const NSURLNameKey: string

export declare const NSISO2022JPStringEncoding: number

export declare const NSMetadataQueryIndexedNetworkScope: string

export declare const NSURLVolumeIsInternalKey: string

export declare const NSInvalidUnarchiveOperationException: string

export declare const NSUndoManagerCheckpointNotification: string

export declare const NSStreamSOCKSProxyUserKey: string

export declare const NSBundleOnDemandResourceInvalidTagError: number

export declare const NSRepublicOfChinaCalendar: string

export declare const NSPersianCalendar: string

export declare const NSFileBusy: string

export declare const NSMetadataItemRecordingDateKey: string

export declare const NSHTTPCookieComment: string

export declare const NSStreamNetworkServiceTypeBackground: string

export declare const NSLocalizedRecoveryOptionsErrorKey: string

export declare const NSURLVolumeMaximumFileSizeKey: string

export declare const NSMetadataItemFSCreationDateKey: string

export declare const NSURLFileResourceTypeKey: string

export declare const NSURLFileResourceTypeSocket: string

export declare const NSURLCredentialStorageRemoveSynchronizableCredentials: string

export declare const NSURLProtectionSpaceSOCKSProxy: string

export declare const NSURLProtectionSpaceFTPProxy: string

export declare const NSURLProtectionSpaceHTTP: string

export declare const NSInvalidArgumentException: string

export declare const NSMetadataItemAppleLoopsKeyFilterTypeKey: string

export declare const NSAverageKeyValueOperator: string

export declare const NSDistinctUnionOfObjectsKeyValueOperator: string

export declare const NSKeyValueChangeNotificationIsPriorKey: string

export declare const NSUbiquitousKeyValueStoreDidChangeExternallyNotification: string

export declare const NSCompressionErrorMaximum: number

export declare const NSCurrentLocaleDidChangeNotification: string

export declare const NSAppleEventTimeOutDefault: number

export declare const NSLocaleExemplarCharacterSet: string

export declare const NSISO8601Calendar: string

export declare const NSURLParentDirectoryURLKey: string

export declare const NSPointerToStructHashCallBacks: NSHashTableCallBacks

export declare const NSProgressKindFile: string

export declare const NSURLVolumeIsAutomountedKey: string

export declare const NSHTTPPropertyServerHTTPVersionKey: string

export declare const NSURLVolumeSupportsExclusiveRenamingKey: string

export declare const NSMetadataUbiquitousSharedItemOwnerNameComponentsKey: string

export declare const NSMetadataQueryUbiquitousDataScope: string

export declare const NSTimeDateFormatString: string

export declare const NSIntHashCallBacks: NSHashTableCallBacks

export declare const NSUserActivityConnectionUnavailableError: number

export declare const NSProgressFileAnimationImageOriginalRectKey: string

export declare const NSAssertionHandlerKey: string

export declare const NSHTTPCookieSameSitePolicy: string

export declare const NSURLUbiquitousSharedItemOwnerNameComponentsKey: string

export declare const NSURLErrorDataNotAllowed: number

export declare const NSURLVolumeSupportsCasePreservedNamesKey: string

export declare const NSObjectNotAvailableException: string

export declare const NS_LittleEndian: number

export declare const NSURLHasHiddenExtensionKey: string

export declare const NSCalendarIdentifierRepublicOfChina: string

export declare const NSURLVolumeSupportsJournalingKey: string

export declare const NSCalendarIdentifierHebrew: string

export declare const NSStreamSocketSecurityLevelSSLv3: string

export declare const NSFileWriteVolumeReadOnlyError: number

export declare const NSURLVolumeLocalizedFormatDescriptionKey: string

export declare const NSURLErrorServerCertificateNotYetValid: number

export declare const NSHTTPCookieDomain: string

export declare const NSHashTableStrongMemory: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSUndefinedKeyException: string

export declare const NSURLIsExecutableKey: string

export declare const NSMetadataItemImageDirectionKey: string

export declare const NSPortTimeoutException: string

export declare const NSURLCredentialStorageChangedNotification: string

export declare const NSURLUbiquitousSharedItemCurrentUserPermissionsKey: string

export declare const NSProgressFileOperationKindReceiving: string

export declare const NSSecureUnarchiveFromDataTransformerName: string

export declare const NSLoadedClasses: string

export declare const NSMetadataItemEXIFVersionKey: string

export declare const NSFileGroupOwnerAccountName: string

export declare const NSURLVolumeIsRootFileSystemKey: string

export declare const NSFileProtectionComplete: string

export declare const NSStreamSocketSecurityLevelNegotiatedSSL: string

export declare const NSURLErrorFailingURLPeerTrustErrorKey: string

export declare const NSPropertyListReadUnknownVersionError: number

export declare const NSMetadataItemGPSAreaInformationKey: string

export declare const NSTextCheckingStreetKey: string

export declare const NSURLAttributeModificationDateKey: string

export declare const NSHTTPCookiePort: string

export declare const NSTextCheckingCityKey: string

export declare const NSURLVolumeIsBrowsableKey: string

export declare const NSMetadataUbiquitousSharedItemCurrentUserRoleKey: string

export declare const NSSymbolStringEncoding: number

export declare const NSHTTPCookieName: string

export declare const NSStreamSocketSecurityLevelSSLv2: string

export declare const NSStringTransformStripDiacritics: string

export declare const NSFileHandleNotificationDataItem: string

export declare const NSHTTPCookieDiscard: string

export declare const NSCalendarIdentifierBuddhist: string

export declare const NSWeekDayNameArray: string

export declare const NSLocaleScriptCode: string

export declare const NSURLUbiquitousItemIsDownloadingKey: string

export declare const NSMetadataItemFontsKey: string

export declare const NSHTTPPropertyStatusCodeKey: string

export declare const NSMetadataUbiquitousItemUploadingErrorKey: string

export declare const NSURLFileResourceTypeSymbolicLink: string

export declare const NSURLUbiquitousItemIsUploadedKey: string

export declare const NSUnicodeStringEncoding: number

export declare const NSIntegerHashCallBacks: NSHashTableCallBacks

export declare const NSLinguisticTagOpenQuote: string

export declare const NSCannotCreateScriptCommandError: number

export declare const NSWindowsCP1252StringEncoding: number

export declare const NSLinguisticTagSchemeLanguage: string

export declare const NSURLVolumeSupportsExtendedSecurityKey: string

export declare const NSIntMapKeyCallBacks: NSMapTableKeyCallBacks

export declare const NSItemProviderErrorDomain: string

export declare const NSDateComponentUndefined: number

export declare const NSUTF32StringEncoding: number

export declare const NSHTTPPropertyErrorPageDataKey: string

export declare const NSURLUbiquitousItemPercentUploadedKey: string

export declare const NSURLContentAccessDateKey: string

export declare const NSMaximumKeyValueOperator: string

export declare const NSFTPPropertyUserLoginKey: string

export declare const NSCountKeyValueOperator: string

export declare const NSHelpAnchorErrorKey: string

export declare const NSKeyValueChangeNewKey: string

export declare const NSURLVolumeNameKey: string

export declare const NSMetadataItemFSSizeKey: string

export declare const NSURLUbiquitousSharedItemPermissionsReadOnly: string

export declare const NSCalendarIdentifierEthiopicAmeteAlem: string

export declare const NSPersonNameComponentPrefix: string

export declare const NSKeyValueChangeIndexesKey: string

export declare const NSMetadataQueryLocalComputerScope: string

export declare const NSURLApplicationIsScriptableKey: string

export declare const NSCharacterConversionException: string

export declare const NSUTF16LittleEndianStringEncoding: number

export declare const NSMetadataItemHasAlphaChannelKey: string

export declare const NSHTTPCookieSameSiteLax: string

export declare const NSIslamicCivilCalendar: string

export declare const NSMetadataItemParticipantsKey: string

export declare const NSURLDocumentIdentifierKey: string

export declare const NSCalendarIdentifierIslamicCivil: string

export declare const NSURLLocalizedTypeDescriptionKey: string

export declare const NSHashTableZeroingWeakMemory: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSDecimalNumberDivideByZeroException: string

export declare const NSURLVolumeIsRemovableKey: string

export declare const NSCalendarIdentifierIndian: string

export declare const NSMetadataItemRecipientEmailAddressesKey: string

export declare const NSMetadataItemHeadlineKey: string

export declare const NSMetadataItemInstructionsKey: string

export declare const NSURLGenerationIdentifierKey: string

export declare const NSFileProtectionKey: string

export declare const NSFileHandleReadToEndOfFileCompletionNotification: string

export declare const NSURLVolumeSupportsZeroRunsKey: string

export declare const NSURLUbiquitousItemDownloadingErrorKey: string

export declare const NSURLProtectionSpaceHTTPS: string

export declare const NSURLAuthenticationMethodDefault: string

export declare const NSFilePathErrorKey: string

export declare const NSMachErrorDomain: string

export declare const NSObjectMapValueCallBacks: NSMapTableValueCallBacks

export declare const NSURLUbiquitousItemUploadingErrorKey: string

export declare const NSSystemClockDidChangeNotification: string

export declare const NSURLProtectionSpaceFTP: string

export declare const NSProgressFileAnimationImageKey: string

export declare const NSOwnedPointerMapValueCallBacks: NSMapTableValueCallBacks

export declare const NSMetadataItemAppleLoopDescriptorsKey: string

export declare const NSProgressThroughputKey: string

export declare const NSCalendarIdentifierEthiopicAmeteMihret: string

export declare const NSURLIsWritableKey: string

export declare const NSFileTypeBlockSpecial: string

export declare const NSMetadataItemRedEyeOnOffKey: string

export declare const NSSumKeyValueOperator: string

export declare const NSWindowsCP1253StringEncoding: number

export declare const NSURLErrorTimedOut: number

export declare const NSFileSize: string

export declare const NSLocaleUsesMetricSystem: string

export declare const NSURLCanonicalPathKey: string

export declare const NSURLVolumeSupportsSymbolicLinksKey: string

export declare const NSChineseCalendar: string

export declare const NSTextCheckingStateKey: string

export declare const NSDecimalSeparator: string

export declare const NSShortDateFormatString: string

export declare const NSURLErrorCannotRemoveFile: number

export declare const NSNonOwnedPointerMapValueCallBacks: NSMapTableValueCallBacks

export declare const NSURLErrorFileDoesNotExist: number

export declare const NSPersonNameComponentGivenName: string

export declare const NSMetadataQueryAccessibleUbiquitousExternalDocumentsScope: string

export declare const NSMetadataItemFocalLengthKey: string

export declare const NSURLIsMountTriggerKey: string

export declare const NSUbiquitousKeyValueStoreChangedKeysKey: string

export declare const NSUserNotificationDefaultSoundName: string

export declare const NSHashTableWeakMemory: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSURLFileSecurityKey: string

export declare const NSFileProtectionCompleteUntilFirstUserAuthentication: string

export declare const NSCalendarIdentifierIslamicTabular: string

export declare const NSLocaleIdentifier: string

export declare const NSZombieEnabled: boolean

export declare const NSFileHFSTypeCode: string

export declare const NSURLUbiquitousSharedItemRoleOwner: string

export declare const NSURLVolumeIsEjectableKey: string

export declare const NSGregorianCalendar: string

export declare const NSURLIsPackageKey: string

export declare const NSHebrewCalendar: string

export declare const NSURLVolumeSupportsVolumeSizesKey: string

export declare const NSHTTPCookieOriginURL: string

export declare const NSBundleExecutableArchitecturePPC64: number

export declare const NSProgressFileCompletedCountKey: string

export declare const NSURLFileAllocatedSizeKey: string

export declare const NSFileSystemFreeSize: string

export declare const NSURLFileResourceTypeRegular: string

export declare const NSHTTPCookieManagerCookiesChangedNotification: string

export declare const NSHTTPCookieManagerAcceptPolicyChangedNotification: string

export declare const NSCloudSharingNetworkFailureError: number

export declare const NSURLErrorCannotDecodeContentData: number

export declare const NSCalendarDayChangedNotification: string

export declare const NSMetadataItemProfileNameKey: string

export declare const NSPersonNameComponentSuffix: string

export declare const NSURLFileProtectionCompleteUnlessOpen: string

export declare const NSStringTransformLatinToGreek: string

export declare const NSFileWriteUnsupportedSchemeError: number

export declare const NSFormattingErrorMinimum: number

export declare const NSMetadataItemRightsKey: string

export declare const NSASCIIStringEncoding: number

export declare const NSLocaleQuotationBeginDelimiterKey: string

export declare const NSThumbnail1024x1024SizeKey: string

export declare const NSTextCheckingAllTypes: number

export declare const NSFileTypeCharacterSpecial: string

export declare const NSPortDidBecomeInvalidNotification: string

export declare const NSFileModificationDate: string

export declare const NSStringTransformLatinToHebrew: string

export declare const NSURLVolumeCreationDateKey: string

export declare const NSHashTableCopyIn: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSFileProtectionCompleteUnlessOpen: string

export declare const NS_BigEndian: number

export declare const NSURLUbiquitousItemContainerDisplayNameKey: string

export declare const NSThreadWillExitNotification: string

export declare const NSBundleExecutableArchitectureARM64: number

export declare const NSFTPPropertyUserPasswordKey: string

export declare const NSCalendarIdentifierPersian: string

export declare const NSURLVolumeIsReadOnlyKey: string

export declare const NSLinguisticTagOpenParenthesis: string

export declare const NSWindowsCP1251StringEncoding: number

export declare const NSURLErrorZeroByteResource: number

export declare const NSZeroRect: CGRect

export declare const NSURLContentModificationDateKey: string

export declare const NSHTTPCookieSameSiteStrict: string

export declare const NSRangeException: string

export declare const NSLocaleCollationIdentifier: string

export declare const NSURLVolumeSupportsImmutableFilesKey: string

export declare const NSMetadataItemLyricistKey: string

export declare const NSFileSystemNodes: string

export declare const NSURLTagNamesKey: string

export declare const NSMetadataItemCameraOwnerKey: string

export declare const NSPortSendException: string

export declare const NSMetadataItemExposureProgramKey: string

export declare const NSMallocException: string

export declare const NSURLIsSymbolicLinkKey: string

export declare const NSRecoveryAttempterErrorKey: string

export declare const NSMapTableStrongMemory: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSMetadataItemGPSDestBearingKey: string

export declare const NSFileType: string

export declare const NSNonRetainedObjectMapValueCallBacks: NSMapTableValueCallBacks

export declare const NSIntegerMapValueCallBacks: NSMapTableValueCallBacks

export declare const NSURLIsApplicationKey: string

export declare const NSProprietaryStringEncoding: number

export declare const NSNotFound: number

export declare const NSFileSystemFreeNodes: string

export declare const NSTextCheckingFlightKey: string

export declare const NSLocalizedRecoverySuggestionErrorKey: string

export declare const NSGenericException: string

export declare const NSFileHandleNotificationMonitorModes: string

export declare const NSSystemTimeZoneDidChangeNotification: string

export declare const NSStreamNetworkServiceTypeVoIP: string

export declare const NSStreamSocketSecurityLevelTLSv1: string

export declare const NSInconsistentArchiveException: string

export declare const NSStreamSOCKSProxyVersion5: string

export declare const NSFileHandleDataAvailableNotification: string

export declare const NSStreamSOCKSProxyVersionKey: string

export declare const NSURLAuthenticationMethodNegotiate: string

export declare const NSTextCheckingOrganizationKey: string

export declare const NSTextCheckingNameKey: string

export declare const NSURLVolumeIdentifierKey: string

export declare const NSHTTPCookieSecure: string

export declare const NSKeyedArchiveRootObjectKey: string

export declare const NSEdgeInsetsZero: NSEdgeInsets

export declare const NSMACHOperatingSystem: number

export declare const NSPriorDayDesignations: string

export declare const NSHTTPCookieCommentURL: string

export declare const NSTextCheckingZIPKey: string

export declare const NSLocaleCountryCode: string

export declare const NSHTTPCookieExpires: string

export declare const NSURLVolumeAvailableCapacityForImportantUsageKey: string

export declare const NSMapTableZeroingWeakMemory: interop.Enum<typeof NSPointerFunctionsOptions>

export declare const NSHashTableObjectPointerPersonality: interop.Enum<
	typeof NSPointerFunctionsOptions
>

export declare const NSTextCheckingAllCustomTypes: number

export declare const NSFileGroupOwnerAccountID: string

export declare const NSMetadataItemOriginalSourceKey: string

export declare const NSFileSystemNumber: string

export declare const NSFileHandleReadCompletionNotification: string

export declare const NSUndoManagerWillCloseUndoGroupNotification: string

export declare const NSOpenStepUnicodeReservedBase: number

export declare const NSFileTypeSymbolicLink: string

export declare const NSFileReferenceCount: string

export declare const NSFileTypeDirectory: string

export declare const NSURLUbiquitousSharedItemRoleParticipant: string

export declare const NSURLUbiquitousItemDownloadingStatusCurrent: string

export declare const NSExecutableRuntimeMismatchError: number

export declare const NSProgressFileOperationKindDecompressingAfterDownloading: string

export declare const NSURLUbiquitousSharedItemCurrentUserRoleKey: string

export declare const NSURLUbiquitousItemDownloadingStatusKey: string

export declare const NSLocalizedDescriptionKey: string

export declare const NSInvalidReceivePortException: string

export declare const NS_UnknownByteOrder: number

export declare const NSFileOwnerAccountName: string

export declare const NSURLVolumeSupportsPersistentIDsKey: string

export declare const NSURLFileSizeKey: string

export declare const NSCalendarIdentifierIslamicUmmAlQura: string

export declare const NSURLVolumeLocalizedNameKey: string

export declare const NSNonOwnedPointerOrNullMapKeyCallBacks: NSMapTableKeyCallBacks

export declare const NSURLAuthenticationMethodNTLM: string

export declare const NSURLPathKey: string

export declare const NSURLFileProtectionCompleteUntilFirstUserAuthentication: string

export declare const NSURLLocalizedLabelKey: string

export declare const NSCalendarIdentifierGregorian: string

export declare const NSURLPreferredIOBlockSizeKey: string

export declare const NSURLMayHaveExtendedAttributesKey: string

export declare const NSURLVolumeSupportsFileProtectionKey: string

export declare const NSCalendarIdentifierChinese: string

export declare const NSURLIsUbiquitousItemKey: string

export declare const NSURLVolumeSupportsFileCloningKey: string

export declare const NSURLFileScheme: string

export declare const NSFTPPropertyActiveTransferModeKey: string

export declare const NSProgressFileOperationKindCopying: string

export declare const NSURLVolumeSupportsAdvisoryFileLockingKey: string

export declare const NSObjectInaccessibleException: string

export declare const NSURLFileResourceTypeBlockSpecial: string

export declare const NSOperationQueueDefaultMaxConcurrentOperationCount: number

export declare const NSDefaultRunLoopMode: string

export declare const NSJapaneseCalendar: string

export declare const NSMetadataItemCommentKey: string

export declare const NSIslamicCalendar: string

export declare const NSPersonNameComponentKey: string

export declare const NSLocaleAlternateQuotationEndDelimiterKey: string

export declare const NSLocaleQuotationEndDelimiterKey: string

export declare const NSStreamNetworkServiceType: string

export declare const NSLocaleCurrencyCode: string

export declare const NSLocaleGroupingSeparator: string

export declare const NSLocaleCalendar: string

export declare const NSWrapCalendarComponents: number

export declare const NSCalendarIdentifierCoptic: string

export declare const NSInvalidSendPortException: string

export declare const NSBundleExecutableArchitectureX86_64: number

export declare const NSFileDeviceIdentifier: string

export declare const NSFileTypeSocket: string

export declare const NSLocaleDecimalSeparator: string

export declare const NSStringEncodingDetectionSuggestedEncodingsKey: string

export declare const NSStringTransformHiraganaToKatakana: string

export declare const NSProcessInfoThermalStateDidChangeNotification: string

export declare const NSStringTransformMandarinToLatin: string

export declare const NSStringTransformToLatin: string

export declare const NSStringTransformLatinToThai: string

export declare const NSStringTransformLatinToHangul: string

export declare const NSUserActivityTypeBrowsingWeb: string

export declare const NSUTF16BigEndianStringEncoding: number

export declare const NSUTF16StringEncoding: number

export declare const NSFileHandleConnectionAcceptedNotification: string

export declare const NSWindowsCP1254StringEncoding: number

export declare const NSNonLossyASCIIStringEncoding: number

export declare const NSFileSystemFileNumber: string

export declare const NSUTF8StringEncoding: number

export declare const NSStringTransformToUnicodeName: string

export declare const NSURLFileProtectionKey: string

export declare const NSStringTransformStripCombiningMarks: string

export declare const NSBundleExecutableArchitecturePPC: number

export declare const NSLinguisticTagWord: string

export declare const NSZeroPoint: CGPoint

export declare const NSURLProtectionSpaceHTTPProxy: string

export declare const NSURLIsSystemImmutableKey: string

export declare const NSHTTPPropertyHTTPProxy: string

export declare const NSMetadataItemAudiencesKey: string

export declare const NSFailedAuthenticationException: string

export declare const NSFeatureUnsupportedError: number

export declare const NSStringTransformLatinToHiragana: string

export declare const NSURLFileProtectionComplete: string

export declare const NSISOLatin2StringEncoding: number

export declare const NSNEXTSTEPStringEncoding: number

export declare const NSTextCheckingJobTitleKey: string

export declare const NSBuddhistCalendar: string

export declare const NSAppleScriptErrorRange: string

export declare const NSWhoseSubelementIdentifier: {
	Index: 0
	Every: 1
	Middle: 2
	Random: 3
	No: 4
}

export declare const NSTextCheckingType: {
	Orthography: 1
	Spelling: 2
	Grammar: 4
	Date: 8
	Address: 16
	Link: 32
	Quote: 64
	Dash: 128
	Replacement: 256
	Correction: 512
	RegularExpression: 1024
	PhoneNumber: 2048
	TransitInformation: 4096
}

export declare const NSDataWritingOptions: {
	DataWritingAtomic: 1
	DataWritingWithoutOverwriting: 2
	DataWritingFileProtectionNone: 268435456
	DataWritingFileProtectionComplete: 536870912
	DataWritingFileProtectionCompleteUnlessOpen: 805306368
	DataWritingFileProtectionCompleteUntilFirstUserAuthentication: 1073741824
	DataWritingFileProtectionMask: 4026531840
	AtomicWrite: 1
}

export declare const NSFormattingUnitStyle: {
	Short: 1
	Medium: 2
	Long: 3
}

export declare const NSNotificationSuspensionBehavior: {
	Drop: 1
	Coalesce: 2
	Hold: 3
	DeliverImmediately: 4
}

export declare const NSNotificationCoalescing: {
	NoCoalescing: 0
	CoalescingOnName: 1
	CoalescingOnSender: 2
}

export declare const NSPropertyListMutabilityOptions: {
	Immutable: 0
	MutableContainers: 1
	MutableContainersAndLeaves: 2
}

export declare const NSCalculationError: {
	NoError: 0
	LossOfPrecision: 1
	Underflow: 2
	Overflow: 3
	DivideByZero: 4
}

export declare const NSAppleEventSendOptions: {
	NoReply: 1
	QueueReply: 2
	WaitForReply: 3
	NeverInteract: 16
	CanInteract: 32
	AlwaysInteract: 48
	CanSwitchLayer: 64
	DontRecord: 4096
	DontExecute: 8192
	DontAnnotate: 65536
	DefaultOptions: 35
}

export declare const NSBinarySearchingOptions: {
	FirstEqual: 256
	LastEqual: 512
	InsertionIndex: 1024
}

export declare const NSInsertionPosition: {
	After: 0
	Before: 1
	Beginning: 2
	End: 3
	Replace: 4
}

export declare const NSXMLNodeOptions: {
	NodeOptionsNone: 0
	NodeIsCDATA: 1
	NodeExpandEmptyElement: 2
	NodeCompactEmptyElement: 4
	NodeUseSingleQuotes: 8
	NodeUseDoubleQuotes: 16
	NodeNeverEscapeContents: 32
	DocumentTidyHTML: 512
	DocumentTidyXML: 1024
	DocumentValidate: 8192
	NodeLoadExternalEntitiesAlways: 16384
	NodeLoadExternalEntitiesSameOriginOnly: 32768
	NodeLoadExternalEntitiesNever: 524288
	DocumentXInclude: 65536
	NodePrettyPrint: 131072
	DocumentIncludeContentTypeDeclaration: 262144
	NodePreserveNamespaceOrder: 1048576
	NodePreserveAttributeOrder: 2097152
	NodePreserveEntities: 4194304
	NodePreservePrefixes: 8388608
	NodePreserveCDATA: 16777216
	NodePreserveWhitespace: 33554432
	NodePreserveDTD: 67108864
	NodePreserveCharacterReferences: 134217728
	NodePromoteSignificantWhitespace: 268435456
	NodePreserveEmptyElements: 6
	NodePreserveQuotes: 24
	NodePreserveAll: 4293918750
}

export declare const NSURLErrorNetworkUnavailableReason: {
	Cellular: 0
	Expensive: 1
	Constrained: 2
}

export declare const NSFileVersionReplacingOptions: {
	NSFileVersionReplacingByMoving: 1
}

export declare const NSXMLNodeKind: {
	Invalid: 0
	Document: 1
	Element: 2
	Attribute: 3
	Namespace: 4
	ProcessingInstruction: 5
	Comment: 6
	Text: 7
	DTD: 8
	EntityDeclaration: 9
	AttributeDeclaration: 10
	ElementDeclaration: 11
	NotationDeclaration: 12
}

export declare const NSURLSessionWebSocketMessageType: {
	Data: 0
	String: 1
}

export declare const NSKeyValueChange: {
	Setting: 1
	Insertion: 2
	Removal: 3
	Replacement: 4
}

export declare const NSTaskTerminationReason: {
	Exit: 1
	UncaughtSignal: 2
}

export declare const NSStringEnumerationOptions: {
	ByLines: 0
	ByParagraphs: 1
	ByComposedCharacterSequences: 2
	ByWords: 3
	BySentences: 4
	ByCaretPositions: 5
	ByDeletionClusters: 6
	Reverse: 256
	SubstringNotRequired: 512
	Localized: 1024
}

export declare const NSXMLDTDNodeKind: {
	EntityGeneralKind: 1
	EntityParsedKind: 2
	EntityUnparsedKind: 3
	EntityParameterKind: 4
	EntityPredefined: 5
	AttributeCDATAKind: 6
	AttributeIDKind: 7
	AttributeIDRefKind: 8
	AttributeIDRefsKind: 9
	AttributeEntityKind: 10
	AttributeEntitiesKind: 11
	AttributeNMTokenKind: 12
	AttributeNMTokensKind: 13
	AttributeEnumerationKind: 14
	AttributeNotationKind: 15
	ElementDeclarationUndefinedKind: 16
	ElementDeclarationEmptyKind: 17
	ElementDeclarationAnyKind: 18
	ElementDeclarationMixedKind: 19
	ElementDeclarationElementKind: 20
}

export declare const NSLinguisticTaggerUnit: {
	Word: 0
	Sentence: 1
	Paragraph: 2
	Document: 3
}

export declare const NSNumberFormatterRoundingMode: {
	Ceiling: 0
	Floor: 1
	Down: 2
	Up: 3
	HalfEven: 4
	HalfDown: 5
	HalfUp: 6
}

export declare const NSItemProviderRepresentationVisibility: {
	All: 0
	Group: 2
	OwnProcess: 3
}

export declare const NSDateFormatterBehavior: {
	BehaviorDefault: 0
	Behavior10_0: 1000
	Behavior10_4: 1040
}

export declare const NSNetServiceOptions: {
	NoAutoRename: 1
	ListenForConnections: 2
}

export declare const NSDataSearchOptions: {
	Backwards: 1
	Anchored: 2
}

export declare const NSCalendarUnit: {
	CalendarUnitEra: 2
	CalendarUnitYear: 4
	CalendarUnitMonth: 8
	CalendarUnitDay: 16
	CalendarUnitHour: 32
	CalendarUnitMinute: 64
	CalendarUnitSecond: 128
	CalendarUnitWeekday: 512
	CalendarUnitWeekdayOrdinal: 1024
	CalendarUnitQuarter: 2048
	CalendarUnitWeekOfMonth: 4096
	CalendarUnitWeekOfYear: 8192
	CalendarUnitYearForWeekOfYear: 16384
	CalendarUnitNanosecond: 32768
	CalendarUnitCalendar: 1048576
	CalendarUnitTimeZone: 2097152
	EraCalendarUnit: 2
	YearCalendarUnit: 4
	MonthCalendarUnit: 8
	DayCalendarUnit: 16
	HourCalendarUnit: 32
	MinuteCalendarUnit: 64
	SecondCalendarUnit: 128
	WeekCalendarUnit: 256
	WeekdayCalendarUnit: 512
	WeekdayOrdinalCalendarUnit: 1024
	QuarterCalendarUnit: 2048
	WeekOfMonthCalendarUnit: 4096
	WeekOfYearCalendarUnit: 8192
	YearForWeekOfYearCalendarUnit: 16384
	CalendarCalendarUnit: 1048576
	TimeZoneCalendarUnit: 2097152
}

export declare const NSFileCoordinatorReadingOptions: {
	WithoutChanges: 1
	ResolvesSymbolicLink: 2
	ImmediatelyAvailableMetadataOnly: 4
	ForUploading: 8
}

export declare const NSURLSessionDelayedRequestDisposition: {
	ContinueLoading: 0
	UseNewRequest: 1
	Cancel: 2
}

export declare const NSSaveOptions: {
	Yes: 0
	No: 1
	Ask: 2
}

export declare const NSOrderedCollectionDifferenceCalculationOptions: {
	OmitInsertedObjects: 1
	OmitRemovedObjects: 2
	InferMoves: 4
}

export declare const NSDataReadingOptions: {
	DataReadingMappedIfSafe: 1
	DataReadingUncached: 2
	DataReadingMappedAlways: 8
	DataReadingMapped: 1
	MappedRead: 1
	UncachedRead: 2
}

export declare const NSBackgroundActivityResult: {
	Finished: 1
	Deferred: 2
}

export declare const NSSearchPathDirectory: {
	Application: 1
	DemoApplication: 2
	DeveloperApplication: 3
	AdminApplication: 4
	Library: 5
	Developer: 6
	User: 7
	Documentation: 8
	Document: 9
	CoreService: 10
	AutosavedInformation: 11
	Desktop: 12
	Caches: 13
	ApplicationSupport: 14
	Downloads: 15
	InputMethods: 16
	Movies: 17
	Music: 18
	Pictures: 19
	PrinterDescription: 20
	SharedPublic: 21
	PreferencePanes: 22
	ApplicationScripts: 23
	ItemReplacement: 99
	AllApplications: 100
	AllLibraries: 101
	Trash: 102
}

export declare const NSMachPortOptions: {
	None: 0
	SendRight: 1
	ReceiveRight: 2
}

export declare const NSTestComparisonOperation: {
	EqualTo: 0
	LessThanOrEqualTo: 1
	LessThan: 2
	GreaterThanOrEqualTo: 3
	GreaterThan: 4
	BeginsWith: 5
	EndsWith: 6
	Contains: 7
}

export declare const NSByteCountFormatterCountStyle: {
	File: 0
	Memory: 1
	Decimal: 2
	Binary: 3
}

export declare const NSComparisonPredicateOptions: {
	CaseInsensitive: 1
	DiacriticInsensitive: 2
	Normalized: 4
}

export declare const NSStringEncodingConversionOptions: {
	AllowLossy: 1
	ExternalRepresentation: 2
}

export declare const NSItemProviderErrorCode: {
	Unknown: -1
	ItemUnavailable: -1000
	UnexpectedValueClass: -1100
	UnavailableCoercion: -1200
}

export declare const NSMeasurementFormatterUnitOptions: {
	ProvidedUnit: 1
	NaturalScale: 2
	TemperatureWithoutUnit: 4
}

export declare const NSKeyValueObservingOptions: {
	New: 1
	Old: 2
	Initial: 4
	Prior: 8
}

export declare const NSFileWrapperReadingOptions: {
	Immediate: 1
	WithoutMapping: 2
}

export declare const NSProcessInfoThermalState: {
	Nominal: 0
	Fair: 1
	Serious: 2
	Critical: 3
}

export declare const NSNumberFormatterPadPosition: {
	BeforePrefix: 0
	AfterPrefix: 1
	BeforeSuffix: 2
	AfterSuffix: 3
}

export declare const NSFileWrapperWritingOptions: {
	Atomic: 1
	WithNameUpdating: 2
}

export declare const NSFileManagerUnmountOptions: {
	AllPartitionsAndEjectDisk: 1
	WithoutUI: 2
}

export declare const NSAlignmentOptions: {
	MinXInward: 1
	MinYInward: 2
	MaxXInward: 4
	MaxYInward: 8
	WidthInward: 16
	HeightInward: 32
	MinXOutward: 256
	MinYOutward: 512
	MaxXOutward: 1024
	MaxYOutward: 2048
	WidthOutward: 4096
	HeightOutward: 8192
	MinXNearest: 65536
	MinYNearest: 131072
	MaxXNearest: 262144
	MaxYNearest: 524288
	WidthNearest: 1048576
	HeightNearest: 2097152
	RectFlipped: -9223372036854775808
	AllEdgesInward: 15
	AllEdgesOutward: 3840
	AllEdgesNearest: 983040
}

export declare const NSRelativePosition: {
	After: 0
	Before: 1
}

export declare const NSStringCompareOptions: {
	CaseInsensitive: 1
	Literal: 2
	Backwards: 4
	Anchored: 8
	Numeric: 64
	DiacriticInsensitive: 128
	WidthInsensitive: 256
	ForcedOrdering: 512
	RegularExpression: 1024
}

export declare const NSNumberFormatterBehavior: {
	BehaviorDefault: 0
	Behavior10_0: 1000
	Behavior10_4: 1040
}

export declare const NSDateComponentsFormatterZeroFormattingBehavior: {
	None: 0
	Default: 1
	DropLeading: 2
	DropMiddle: 4
	DropTrailing: 8
	DropAll: 14
	Pad: 65536
}

export declare const NSISO8601DateFormatOptions: {
	Year: 1
	Month: 2
	WeekOfYear: 4
	Day: 16
	Time: 32
	TimeZone: 64
	SpaceBetweenDateAndTime: 128
	DashSeparatorInDate: 256
	ColonSeparatorInTime: 512
	ColonSeparatorInTimeZone: 1024
	FractionalSeconds: 2048
	FullDate: 275
	FullTime: 1632
	InternetDateTime: 1907
}

export declare const NSURLSessionTaskState: {
	Running: 0
	Suspended: 1
	Canceling: 2
	Completed: 3
}

export declare const NSURLRequestCachePolicy: {
	UseProtocolCachePolicy: 0
	ReloadIgnoringLocalCacheData: 1
	ReloadIgnoringLocalAndRemoteCacheData: 4
	ReloadIgnoringCacheData: 1
	ReturnCacheDataElseLoad: 2
	ReturnCacheDataDontLoad: 3
	ReloadRevalidatingCacheData: 5
}

export declare const NSEnergyFormatterUnit: {
	Joule: 11
	Kilojoule: 14
	Calorie: 1793
	Kilocalorie: 1794
}

export declare const NSDirectoryEnumerationOptions: {
	SkipsSubdirectoryDescendants: 1
	SkipsPackageDescendants: 2
	SkipsHiddenFiles: 4
	IncludesDirectoriesPostOrder: 8
	ProducesRelativePathURLs: 16
}

export declare const NSVolumeEnumerationOptions: {
	SkipHiddenVolumes: 2
	ProduceFileReferenceURLs: 4
}

export declare const NSRelativeDateTimeFormatterStyle: {
	Numeric: 0
	Named: 1
}

export declare const NSMatchingFlags: {
	Progress: 1
	Completed: 2
	HitEnd: 4
	RequiredEnd: 8
	InternalError: 16
}

export declare const NSURLSessionTaskMetricsResourceFetchType: {
	Unknown: 0
	NetworkLoad: 1
	ServerPush: 2
	LocalCache: 3
}

export declare const NSItemProviderFileOptions: {
	NSItemProviderFileOptionOpenInPlace: 1
}

export declare const NSFileManagerItemReplacementOptions: {
	UsingNewMetadataOnly: 1
	WithoutDeletingBackupItem: 2
}

export declare const NSXMLParserExternalEntityResolvingPolicy: {
	Never: 0
	NoNetwork: 1
	SameOriginOnly: 2
	Always: 3
}

export declare const NSByteCountFormatterUnits: {
	Default: 0
	Bytes: 1
	KB: 2
	MB: 4
	GB: 8
	TB: 16
	PB: 32
	EB: 64
	ZB: 128
	YBOrHigher: 65280
	All: 65535
}

export declare const NSPropertyListFormat: {
	OpenStepFormat: 1
	XMLFormat_v1_0: 100
	BinaryFormat_v1_0: 200
}

export declare const NSSearchPathDomainMask: {
	UserDomain: 1
	LocalDomain: 2
	NetworkDomain: 4
	SystemDomain: 8
	AllDomains: 65535
}

export declare const NSUserNotificationActivationType: {
	None: 0
	ContentsClicked: 1
	ActionButtonClicked: 2
	Replied: 3
	AdditionalActionClicked: 4
}

export declare const NSURLCacheStoragePolicy: {
	Allowed: 0
	AllowedInMemoryOnly: 1
	NotAllowed: 2
}

export declare const NSXMLDocumentContentKind: {
	XML: 0
	XHTML: 1
	HTML: 2
	Text: 3
}

export declare const NSURLSessionAuthChallengeDisposition: {
	UseCredential: 0
	PerformDefaultHandling: 1
	CancelAuthenticationChallenge: 2
	RejectProtectionSpace: 3
}

export declare const NSDistributedNotificationOptions: {
	DeliverImmediately: 1
	PostToAllSessions: 2
}

export declare const NSURLSessionResponseDisposition: {
	Cancel: 0
	Allow: 1
	BecomeDownload: 2
	BecomeStream: 3
}

export declare const NSTimeZoneNameStyle: {
	Standard: 0
	ShortStandard: 1
	DaylightSaving: 2
	ShortDaylightSaving: 3
	Generic: 4
	ShortGeneric: 5
}

export declare const NSLinguisticTaggerOptions: {
	OmitWords: 1
	OmitPunctuation: 2
	OmitWhitespace: 4
	OmitOther: 8
	JoinNames: 16
}

export declare const NSFileCoordinatorWritingOptions: {
	ForDeleting: 1
	ForMoving: 2
	ForMerging: 4
	ForReplacing: 8
	ContentIndependentMetadataOnly: 16
}

export declare const NSDateComponentsFormatterUnitsStyle: {
	Positional: 0
	Abbreviated: 1
	Short: 2
	Full: 3
	SpellOut: 4
	Brief: 5
}

export declare const NSCompoundPredicateType: {
	Not: 0
	And: 1
	Or: 2
}

export declare const NSXPCConnectionOptions: {
	NSXPCConnectionPrivileged: 4096
}

export declare const NSXMLParserError: {
	Internal: 1
	OutOfMemory: 2
	DocumentStart: 3
	EmptyDocument: 4
	PrematureDocumentEnd: 5
	InvalidHexCharacterRef: 6
	InvalidDecimalCharacterRef: 7
	InvalidCharacterRef: 8
	InvalidCharacter: 9
	CharacterRefAtEOF: 10
	CharacterRefInProlog: 11
	CharacterRefInEpilog: 12
	CharacterRefInDTD: 13
	EntityRefAtEOF: 14
	EntityRefInProlog: 15
	EntityRefInEpilog: 16
	EntityRefInDTD: 17
	ParsedEntityRefAtEOF: 18
	ParsedEntityRefInProlog: 19
	ParsedEntityRefInEpilog: 20
	ParsedEntityRefInInternalSubset: 21
	EntityReferenceWithoutName: 22
	EntityReferenceMissingSemi: 23
	ParsedEntityRefNoName: 24
	ParsedEntityRefMissingSemi: 25
	UndeclaredEntity: 26
	UnparsedEntity: 28
	EntityIsExternal: 29
	EntityIsParameter: 30
	UnknownEncoding: 31
	EncodingNotSupported: 32
	StringNotStarted: 33
	StringNotClosed: 34
	NamespaceDeclaration: 35
	EntityNotStarted: 36
	EntityNotFinished: 37
	LessThanSymbolInAttribute: 38
	AttributeNotStarted: 39
	AttributeNotFinished: 40
	AttributeHasNoValue: 41
	AttributeRedefined: 42
	LiteralNotStarted: 43
	LiteralNotFinished: 44
	CommentNotFinished: 45
	ProcessingInstructionNotStarted: 46
	ProcessingInstructionNotFinished: 47
	NotationNotStarted: 48
	NotationNotFinished: 49
	AttributeListNotStarted: 50
	AttributeListNotFinished: 51
	MixedContentDeclNotStarted: 52
	MixedContentDeclNotFinished: 53
	ElementContentDeclNotStarted: 54
	ElementContentDeclNotFinished: 55
	XMLDeclNotStarted: 56
	XMLDeclNotFinished: 57
	ConditionalSectionNotStarted: 58
	ConditionalSectionNotFinished: 59
	ExternalSubsetNotFinished: 60
	DOCTYPEDeclNotFinished: 61
	MisplacedCDATAEndString: 62
	CDATANotFinished: 63
	MisplacedXMLDeclaration: 64
	SpaceRequired: 65
	SeparatorRequired: 66
	NMTOKENRequired: 67
	NAMERequired: 68
	PCDATARequired: 69
	URIRequired: 70
	PublicIdentifierRequired: 71
	LTRequired: 72
	GTRequired: 73
	LTSlashRequired: 74
	EqualExpected: 75
	TagNameMismatch: 76
	UnfinishedTag: 77
	StandaloneValue: 78
	InvalidEncodingName: 79
	CommentContainsDoubleHyphen: 80
	InvalidEncoding: 81
	ExternalStandaloneEntity: 82
	InvalidConditionalSection: 83
	EntityValueRequired: 84
	NotWellBalanced: 85
	ExtraContent: 86
	InvalidCharacterInEntity: 87
	ParsedEntityRefInInternal: 88
	EntityRefLoop: 89
	EntityBoundary: 90
	InvalidURI: 91
	URIFragment: 92
	NoDTD: 94
	DelegateAbortedParse: 512
}

export declare const NSURLRequestNetworkServiceType: {
	Default: 0
	VoIP: 1
	Video: 2
	Background: 3
	Voice: 4
	ResponsiveData: 6
	AVStreaming: 8
	ResponsiveAV: 9
	CallSignaling: 11
}

export declare const NSURLCredentialPersistence: {
	None: 0
	ForSession: 1
	Permanent: 2
	Synchronizable: 3
}

export declare const NSNetServicesError: {
	UnknownError: -72000
	CollisionError: -72001
	NotFoundError: -72002
	ActivityInProgress: -72003
	BadArgumentError: -72004
	CancelledError: -72005
	InvalidError: -72006
	TimeoutError: -72007
	MissingRequiredConfigurationError: -72008
}

export declare const NSCalendarOptions: {
	WrapComponents: 1
	MatchStrictly: 2
	SearchBackwards: 4
	MatchPreviousTimePreservingSmallerUnits: 256
	MatchNextTimePreservingSmallerUnits: 512
	MatchNextTime: 1024
	MatchFirst: 4096
	MatchLast: 8192
}

export declare const NSOperationQueuePriority: {
	VeryLow: -8
	Low: -4
	Normal: 0
	High: 4
	VeryHigh: 8
}

export declare const NSRelativeDateTimeFormatterUnitsStyle: {
	Full: 0
	SpellOut: 1
	Short: 2
	Abbreviated: 3
}

export declare const NSRectEdge: {
	RectEdgeMinX: 0
	RectEdgeMinY: 1
	RectEdgeMaxX: 2
	RectEdgeMaxY: 3
	MinXEdge: 0
	MinYEdge: 1
	MaxXEdge: 2
	MaxYEdge: 3
}

export declare const NSURLHandleStatus: {
	NotLoaded: 0
	LoadSucceeded: 1
	LoadInProgress: 2
	LoadFailed: 3
}

export declare const NSPostingStyle: {
	WhenIdle: 1
	ASAP: 2
	Now: 3
}

export declare const NSURLSessionTaskMetricsDomainResolutionProtocol: {
	Unknown: 0
	UDP: 1
	TCP: 2
	TLS: 3
	HTTPS: 4
}

export declare const NSStreamStatus: {
	NotOpen: 0
	Opening: 1
	Open: 2
	Reading: 3
	Writing: 4
	AtEnd: 5
	Closed: 6
	Error: 7
}

export declare const NSHTTPCookieAcceptPolicy: {
	Always: 0
	Never: 1
	OnlyFromMainDocumentDomain: 2
}

export declare const NSMatchingOptions: {
	ReportProgress: 1
	ReportCompletion: 2
	Anchored: 4
	WithTransparentBounds: 8
	WithoutAnchoringBounds: 16
}

export declare const NSLocaleLanguageDirection: {
	Unknown: 0
	LeftToRight: 1
	RightToLeft: 2
	TopToBottom: 3
	BottomToTop: 4
}

export declare const NSKeyValueSetMutationKind: {
	Union: 1
	Minus: 2
	Intersect: 3
	Set: 4
}

export declare const NSExpressionType: {
	ConstantValue: 0
	EvaluatedObject: 1
	Variable: 2
	KeyPath: 3
	Function: 4
	UnionSet: 5
	IntersectSet: 6
	MinusSet: 7
	Subquery: 13
	Aggregate: 14
	AnyKey: 15
	Block: 19
	Conditional: 20
}

export declare const NSPointerFunctionsOptions: {
	StrongMemory: 0
	ZeroingWeakMemory: 1
	OpaqueMemory: 2
	MallocMemory: 3
	MachVirtualMemory: 4
	WeakMemory: 5
	ObjectPersonality: 0
	OpaquePersonality: 256
	ObjectPointerPersonality: 512
	CStringPersonality: 768
	StructPersonality: 1024
	IntegerPersonality: 1280
	CopyIn: 65536
}

export declare const NSJSONWritingOptions: {
	PrettyPrinted: 1
	SortedKeys: 2
	FragmentsAllowed: 4
	WithoutEscapingSlashes: 8
}

export declare const NSEnumerationOptions: {
	Concurrent: 1
	Reverse: 2
}

export declare const NSStreamEvent: {
	None: 0
	OpenCompleted: 1
	HasBytesAvailable: 2
	HasSpaceAvailable: 4
	ErrorOccurred: 8
	EndEncountered: 16
}

export declare const NSActivityOptions: {
	IdleDisplaySleepDisabled: 1099511627776
	IdleSystemSleepDisabled: 1048576
	SuddenTerminationDisabled: 16384
	AutomaticTerminationDisabled: 32768
	UserInitiated: 16777215
	UserInitiatedAllowingIdleSystemSleep: 15728639
	Background: 255
	LatencyCritical: 1095216660480
}

export declare const NSPersonNameComponentsFormatterOptions: {
	NSPersonNameComponentsFormatterPhonetic: 2
}

export declare const NSURLBookmarkCreationOptions: {
	PreferFileIDResolution: 256
	MinimalBookmark: 512
	SuitableForBookmarkFile: 1024
	WithSecurityScope: 2048
	SecurityScopeAllowOnlyReadAccess: 4096
	WithoutImplicitSecurityScope: 536870912
}

export declare const NSNumberFormatterStyle: {
	No: 0
	Decimal: 1
	Currency: 2
	Percent: 3
	Scientific: 4
	SpellOut: 5
	Ordinal: 6
	CurrencyISOCode: 8
	CurrencyPlural: 9
	CurrencyAccounting: 10
}

export declare const NSMassFormatterUnit: {
	Gram: 11
	Kilogram: 14
	Ounce: 1537
	Pound: 1538
	Stone: 1539
}

export declare const NSFormattingContext: {
	Unknown: 0
	Dynamic: 1
	Standalone: 2
	ListItem: 3
	BeginningOfSentence: 4
	MiddleOfSentence: 5
}

export declare const NSURLRelationship: {
	Contains: 0
	Same: 1
	Other: 2
}

export declare const NSSortOptions: {
	Concurrent: 1
	Stable: 16
}

export declare const NSDataCompressionAlgorithm: {
	LZFSE: 0
	LZ4: 1
	LZMA: 2
	Zlib: 3
}

export declare const NSRegularExpressionOptions: {
	CaseInsensitive: 1
	AllowCommentsAndWhitespace: 2
	IgnoreMetacharacters: 4
	DotMatchesLineSeparators: 8
	AnchorsMatchLines: 16
	UseUnixLineSeparators: 32
	UseUnicodeWordBoundaries: 64
}

export declare const NSURLSessionWebSocketCloseCode: {
	Invalid: 0
	NormalClosure: 1000
	GoingAway: 1001
	ProtocolError: 1002
	UnsupportedData: 1003
	NoStatusReceived: 1005
	AbnormalClosure: 1006
	InvalidFramePayloadData: 1007
	PolicyViolation: 1008
	MessageTooBig: 1009
	MandatoryExtensionMissing: 1010
	InternalServerError: 1011
	TLSHandshakeFailure: 1015
}

export declare const NSCollectionChangeType: {
	Insert: 0
	Remove: 1
}

export declare const NSPersonNameComponentsFormatterStyle: {
	Default: 0
	Short: 1
	Medium: 2
	Long: 3
	Abbreviated: 4
}

export declare const NSAttributedStringEnumerationOptions: {
	Reverse: 2
	LongestEffectiveRangeNotRequired: 1048576
}

export declare const NSPredicateOperatorType: {
	LessThan: 0
	LessThanOrEqualTo: 1
	GreaterThan: 2
	GreaterThanOrEqualTo: 3
	EqualTo: 4
	NotEqualTo: 5
	Matches: 6
	Like: 7
	BeginsWith: 8
	EndsWith: 9
	In: 10
	CustomSelector: 11
	Contains: 99
	Between: 100
}

export declare const NSJSONReadingOptions: {
	MutableContainers: 1
	MutableLeaves: 2
	FragmentsAllowed: 4
	AllowFragments: 4
}

export declare const NSDecodingFailurePolicy: {
	RaiseException: 0
	SetErrorAndReturn: 1
}

export declare const NSFileVersionAddingOptions: {
	NSFileVersionAddingByMoving: 1
}

export declare const NSDateFormatterStyle: {
	No: 0
	Short: 1
	Medium: 2
	Long: 3
	Full: 4
}

export declare const NSQualityOfService: {
	UserInteractive: 33
	UserInitiated: 25
	Utility: 17
	Background: 9
	Default: -1
}

export declare const NSDataBase64EncodingOptions: {
	Encoding64CharacterLineLength: 1
	Encoding76CharacterLineLength: 2
	EncodingEndLineWithCarriageReturn: 16
	EncodingEndLineWithLineFeed: 32
}

export declare const NSURLBookmarkResolutionOptions: {
	WithoutUI: 256
	WithoutMounting: 512
	WithSecurityScope: 1024
}

export declare const NSDateIntervalFormatterStyle: {
	No: 0
	Short: 1
	Medium: 2
	Long: 3
	Full: 4
}

export declare const NSComparisonPredicateModifier: {
	Direct: 0
	All: 1
	Any: 2
}

export declare const NSLengthFormatterUnit: {
	Millimeter: 8
	Centimeter: 9
	Meter: 11
	Kilometer: 14
	Inch: 1281
	Foot: 1282
	Yard: 1283
	Mile: 1284
}

export declare const NSComparisonResult: {
	Ascending: -1
	Same: 0
	Descending: 1
}

export declare const NSDataBase64DecodingOptions: {
	NSDataBase64DecodingIgnoreUnknownCharacters: 1
}

export declare const NSRoundingMode: {
	Plain: 0
	Down: 1
	Up: 2
	Bankers: 3
}

export declare class __NSAppleEventManagerSuspension {
	constructor(init?: __NSAppleEventManagerSuspension)
}

export declare class NSMapEnumerator {
	constructor(init?: NSMapEnumerator)
	_pi: number
	_si: number
	_bs: interop.Pointer
}

export declare class NSHashEnumerator {
	constructor(init?: NSHashEnumerator)
	_pi: number
	_si: number
	_bs: interop.Pointer
}

export declare class NSAffineTransformStruct {
	constructor(init?: NSAffineTransformStruct)
	m11: number
	m12: number
	m21: number
	m22: number
	tX: number
	tY: number
}

export declare class NSSwappedDouble {
	constructor(init?: NSSwappedDouble)
	v: number
}

export declare class NSEdgeInsets {
	constructor(init?: NSEdgeInsets)
	top: number
	left: number
	bottom: number
	right: number
}

export declare class _NSRange {
	constructor(init?: _NSRange)
	location: number
	length: number
}

export declare class NSOperatingSystemVersion {
	constructor(init?: NSOperatingSystemVersion)
	majorVersion: number
	minorVersion: number
	patchVersion: number
}

export declare class NSMapTableKeyCallBacks {
	constructor(init?: NSMapTableKeyCallBacks)
	hash: (p1: NSMapTable, p2: interop.PointerConvertible) => number | null
	isEqual: (
		p1: NSMapTable,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => boolean | null
	retain: (p1: NSMapTable, p2: interop.PointerConvertible) => void | null
	release: (p1: NSMapTable, p2: interop.PointerConvertible) => void | null
	describe: (p1: NSMapTable, p2: interop.PointerConvertible) => string | null
	notAKeyMarker: interop.Pointer
}

export declare class NSHashTableCallBacks {
	constructor(init?: NSHashTableCallBacks)
	hash: (p1: NSHashTable, p2: interop.PointerConvertible) => number | null
	isEqual: (
		p1: NSHashTable,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => boolean | null
	retain: (p1: NSHashTable, p2: interop.PointerConvertible) => void | null
	release: (p1: NSHashTable, p2: interop.PointerConvertible) => void | null
	describe: (p1: NSHashTable, p2: interop.PointerConvertible) => string | null
}

export declare class NSSwappedFloat {
	constructor(init?: NSSwappedFloat)
	v: number
}

export declare class NSFastEnumerationState {
	constructor(init?: NSFastEnumerationState)
	state: number
	itemsPtr: interop.Pointer
	mutationsPtr: interop.Pointer
	extra: unknown /* const array */
}

export declare class NSMapTableValueCallBacks {
	constructor(init?: NSMapTableValueCallBacks)
	retain: (p1: NSMapTable, p2: interop.PointerConvertible) => void | null
	release: (p1: NSMapTable, p2: interop.PointerConvertible) => void | null
	describe: (p1: NSMapTable, p2: interop.PointerConvertible) => string | null
}

export declare class NSDecimal {
	constructor(init?: NSDecimal)
	_exponent: number
	_length: number
	_isNegative: number
	_isCompact: number
	_reserved: number
	_mantissa: unknown /* const array */
}

export declare function NSStringFromSelector(aSelector: string): string

export declare function NSSelectorFromString(aSelectorName: string): string

export declare function NSStringFromClass(aClass: interop.PointerConvertible): string

export declare function NSClassFromString(aClassName: string): interop.Pointer

export declare function NSStringFromProtocol(proto: interop.PointerConvertible): string

export declare function NSProtocolFromString(namestr: string): interop.Pointer

export declare function NSGetSizeAndAlignment(
	typePtr: string,
	sizep: interop.PointerConvertible,
	alignp: interop.PointerConvertible,
): string

export declare function NSLog(format: string): void

export declare function NSLogv(format: string, args: string): void

export declare function NSDefaultMallocZone(): interop.Pointer

export declare function NSCreateZone(
	startSize: number,
	granularity: number,
	canFree: boolean,
): interop.Pointer

export declare function NSRecycleZone(zone: interop.PointerConvertible): void

export declare function NSSetZoneName(zone: interop.PointerConvertible, name: string): void

export declare function NSZoneName(zone: interop.PointerConvertible): string

export declare function NSZoneFromPointer(ptr: interop.PointerConvertible): interop.Pointer

export declare function NSZoneMalloc(
	zone: interop.PointerConvertible,
	size: number,
): interop.Pointer

export declare function NSZoneCalloc(
	zone: interop.PointerConvertible,
	numElems: number,
	byteSize: number,
): interop.Pointer

export declare function NSZoneRealloc(
	zone: interop.PointerConvertible,
	ptr: interop.PointerConvertible,
	size: number,
): interop.Pointer

export declare function NSZoneFree(
	zone: interop.PointerConvertible,
	ptr: interop.PointerConvertible,
): void

export declare function NSAllocateCollectable(size: number, options: number): interop.Pointer

export declare function NSReallocateCollectable(
	ptr: interop.PointerConvertible,
	size: number,
	options: number,
): interop.Pointer

export declare function NSPageSize(): number

export declare function NSLogPageSize(): number

export declare function NSRoundUpToMultipleOfPageSize(bytes: number): number

export declare function NSRoundDownToMultipleOfPageSize(bytes: number): number

export declare function NSAllocateMemoryPages(bytes: number): interop.Pointer

export declare function NSDeallocateMemoryPages(
	ptr: interop.PointerConvertible,
	bytes: number,
): void

export declare function NSCopyMemoryPages(
	source: interop.PointerConvertible,
	dest: interop.PointerConvertible,
	bytes: number,
): void

export declare function NSRealMemoryAvailable(): number

export declare function NSAllocateObject(
	aClass: interop.PointerConvertible,
	extraBytes: number,
	zone: interop.PointerConvertible,
): interop.Object

export declare function NSDeallocateObject(object: interop.Object): void

export declare function NSCopyObject(
	object: interop.Object,
	extraBytes: number,
	zone: interop.PointerConvertible,
): interop.Object

export declare function NSShouldRetainWithZone(
	anObject: interop.Object,
	requestedZone: interop.PointerConvertible,
): boolean

export declare function NSIncrementExtraRefCount(object: interop.Object): void

export declare function NSDecrementExtraRefCountWasZero(object: interop.Object): boolean

export declare function NSExtraRefCount(object: interop.Object): number

export declare function NSUnionRange(range1: _NSRange, range2: _NSRange): _NSRange

export declare function NSIntersectionRange(range1: _NSRange, range2: _NSRange): _NSRange

export declare function NSStringFromRange(range: _NSRange): string

export declare function NSRangeFromString(aString: string): _NSRange

export declare function NXReadNSObjectFromCoder(decoder: NSCoder): NSObject

export declare function NSDecimalCopy(
	destination: interop.PointerConvertible,
	source: interop.PointerConvertible,
): void

export declare function NSDecimalCompact(number: interop.PointerConvertible): void

export declare function NSDecimalCompare(
	leftOperand: interop.PointerConvertible,
	rightOperand: interop.PointerConvertible,
): interop.Enum<typeof NSComparisonResult>

export declare function NSDecimalRound(
	result: interop.PointerConvertible,
	number: interop.PointerConvertible,
	scale: number,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): void

export declare function NSDecimalNormalize(
	number1: interop.PointerConvertible,
	number2: interop.PointerConvertible,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): interop.Enum<typeof NSCalculationError>

export declare function NSDecimalAdd(
	result: interop.PointerConvertible,
	leftOperand: interop.PointerConvertible,
	rightOperand: interop.PointerConvertible,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): interop.Enum<typeof NSCalculationError>

export declare function NSDecimalSubtract(
	result: interop.PointerConvertible,
	leftOperand: interop.PointerConvertible,
	rightOperand: interop.PointerConvertible,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): interop.Enum<typeof NSCalculationError>

export declare function NSDecimalMultiply(
	result: interop.PointerConvertible,
	leftOperand: interop.PointerConvertible,
	rightOperand: interop.PointerConvertible,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): interop.Enum<typeof NSCalculationError>

export declare function NSDecimalDivide(
	result: interop.PointerConvertible,
	leftOperand: interop.PointerConvertible,
	rightOperand: interop.PointerConvertible,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): interop.Enum<typeof NSCalculationError>

export declare function NSDecimalPower(
	result: interop.PointerConvertible,
	number: interop.PointerConvertible,
	power: number,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): interop.Enum<typeof NSCalculationError>

export declare function NSDecimalMultiplyByPowerOf10(
	result: interop.PointerConvertible,
	number: interop.PointerConvertible,
	power: number,
	roundingMode: interop.Enum<typeof NSRoundingMode>,
): interop.Enum<typeof NSCalculationError>

export declare function NSDecimalString(
	dcm: interop.PointerConvertible,
	locale: interop.Object,
): string

export declare function NSGetUncaughtExceptionHandler(): (p1: NSException) => void

export declare function NSSetUncaughtExceptionHandler(p1: (p1: NSException) => void): void

export declare function NSUserName(): string

export declare function NSFullUserName(): string

export declare function NSHomeDirectory(): string

export declare function NSHomeDirectoryForUser(userName: string): string

export declare function NSTemporaryDirectory(): string

export declare function NSOpenStepRootDirectory(): string

export declare function NSSearchPathForDirectoriesInDomains(
	directory: interop.Enum<typeof NSSearchPathDirectory>,
	domainMask: interop.Enum<typeof NSSearchPathDomainMask>,
	expandTilde: boolean,
): NSArray

export declare function NSFreeHashTable(table: NSHashTable): void

export declare function NSResetHashTable(table: NSHashTable): void

export declare function NSCompareHashTables(table1: NSHashTable, table2: NSHashTable): boolean

export declare function NSCopyHashTableWithZone(
	table: NSHashTable,
	zone: interop.PointerConvertible,
): NSHashTable

export declare function NSHashGet(
	table: NSHashTable,
	pointer: interop.PointerConvertible,
): interop.Pointer

export declare function NSHashInsert(table: NSHashTable, pointer: interop.PointerConvertible): void

export declare function NSHashInsertKnownAbsent(
	table: NSHashTable,
	pointer: interop.PointerConvertible,
): void

export declare function NSHashInsertIfAbsent(
	table: NSHashTable,
	pointer: interop.PointerConvertible,
): interop.Pointer

export declare function NSHashRemove(table: NSHashTable, pointer: interop.PointerConvertible): void

export declare function NSEnumerateHashTable(table: NSHashTable): NSHashEnumerator

export declare function NSNextHashEnumeratorItem(
	enumerator: interop.PointerConvertible,
): interop.Pointer

export declare function NSEndHashTableEnumeration(enumerator: interop.PointerConvertible): void

export declare function NSCountHashTable(table: NSHashTable): number

export declare function NSStringFromHashTable(table: NSHashTable): string

export declare function NSAllHashTableObjects(table: NSHashTable): NSArray

export declare function NSCreateHashTableWithZone(
	callBacks: NSHashTableCallBacks,
	capacity: number,
	zone: interop.PointerConvertible,
): NSHashTable

export declare function NSCreateHashTable(
	callBacks: NSHashTableCallBacks,
	capacity: number,
): NSHashTable

export declare function NSEqualPoints(aPoint: CGPoint, bPoint: CGPoint): boolean

export declare function NSEqualSizes(aSize: CGSize, bSize: CGSize): boolean

export declare function NSEqualRects(aRect: CGRect, bRect: CGRect): boolean

export declare function NSIsEmptyRect(aRect: CGRect): boolean

export declare function NSEdgeInsetsEqual(aInsets: NSEdgeInsets, bInsets: NSEdgeInsets): boolean

export declare function NSInsetRect(aRect: CGRect, dX: number, dY: number): CGRect

export declare function NSIntegralRect(aRect: CGRect): CGRect

export declare function NSIntegralRectWithOptions(
	aRect: CGRect,
	opts: interop.Enum<typeof NSAlignmentOptions>,
): CGRect

export declare function NSUnionRect(aRect: CGRect, bRect: CGRect): CGRect

export declare function NSIntersectionRect(aRect: CGRect, bRect: CGRect): CGRect

export declare function NSOffsetRect(aRect: CGRect, dX: number, dY: number): CGRect

export declare function NSDivideRect(
	inRect: CGRect,
	slice: interop.PointerConvertible,
	rem: interop.PointerConvertible,
	amount: number,
	edge: interop.Enum<typeof NSRectEdge>,
): void

export declare function NSPointInRect(aPoint: CGPoint, aRect: CGRect): boolean

export declare function NSMouseInRect(aPoint: CGPoint, aRect: CGRect, flipped: boolean): boolean

export declare function NSContainsRect(aRect: CGRect, bRect: CGRect): boolean

export declare function NSIntersectsRect(aRect: CGRect, bRect: CGRect): boolean

export declare function NSStringFromPoint(aPoint: CGPoint): string

export declare function NSStringFromSize(aSize: CGSize): string

export declare function NSStringFromRect(aRect: CGRect): string

export declare function NSPointFromString(aString: string): CGPoint

export declare function NSSizeFromString(aString: string): CGSize

export declare function NSRectFromString(aString: string): CGRect

export declare function NSFreeMapTable(table: NSMapTable): void

export declare function NSResetMapTable(table: NSMapTable): void

export declare function NSCompareMapTables(table1: NSMapTable, table2: NSMapTable): boolean

export declare function NSCopyMapTableWithZone(
	table: NSMapTable,
	zone: interop.PointerConvertible,
): NSMapTable

export declare function NSMapMember(
	table: NSMapTable,
	key: interop.PointerConvertible,
	originalKey: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function NSMapGet(
	table: NSMapTable,
	key: interop.PointerConvertible,
): interop.Pointer

export declare function NSMapInsert(
	table: NSMapTable,
	key: interop.PointerConvertible,
	value: interop.PointerConvertible,
): void

export declare function NSMapInsertKnownAbsent(
	table: NSMapTable,
	key: interop.PointerConvertible,
	value: interop.PointerConvertible,
): void

export declare function NSMapInsertIfAbsent(
	table: NSMapTable,
	key: interop.PointerConvertible,
	value: interop.PointerConvertible,
): interop.Pointer

export declare function NSMapRemove(table: NSMapTable, key: interop.PointerConvertible): void

export declare function NSEnumerateMapTable(table: NSMapTable): NSMapEnumerator

export declare function NSNextMapEnumeratorPair(
	enumerator: interop.PointerConvertible,
	key: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function NSEndMapTableEnumeration(enumerator: interop.PointerConvertible): void

export declare function NSCountMapTable(table: NSMapTable): number

export declare function NSStringFromMapTable(table: NSMapTable): string

export declare function NSAllMapTableKeys(table: NSMapTable): NSArray

export declare function NSAllMapTableValues(table: NSMapTable): NSArray

export declare function NSCreateMapTableWithZone(
	keyCallBacks: NSMapTableKeyCallBacks,
	valueCallBacks: NSMapTableValueCallBacks,
	capacity: number,
	zone: interop.PointerConvertible,
): NSMapTable

export declare function NSCreateMapTable(
	keyCallBacks: NSMapTableKeyCallBacks,
	valueCallBacks: NSMapTableValueCallBacks,
	capacity: number,
): NSMapTable

export declare function NSFileTypeForHFSTypeCode(hfsFileTypeCode: number): string

export declare function NSHFSTypeCodeFromFileType(fileTypeString: string): number

export declare function NSHFSTypeOfFile(fullFilePath: string): string

export declare function NSIsFreedObject(anObject: interop.Object): boolean

export declare function NSFrameAddress(frame: number): interop.Pointer

export declare function NSReturnAddress(frame: number): interop.Pointer

export declare function NSCountFrames(): number

export declare function NSRecordAllocationEvent(eventType: number, object: interop.Object): void

export declare interface NSURLConnectionDataDelegate extends NSURLConnectionDelegate {
	connectionWillSendRequestRedirectResponse?(
		connection: NSURLConnection,
		request: NSURLRequest,
		response: NSURLResponse | null,
	): NSURLRequest

	connectionDidReceiveResponse?(connection: NSURLConnection, response: NSURLResponse): void

	connectionDidReceiveData?(connection: NSURLConnection, data: NSData): void

	connectionNeedNewBodyStream?(connection: NSURLConnection, request: NSURLRequest): NSInputStream

	connectionDidSendBodyDataTotalBytesWrittenTotalBytesExpectedToWrite?(
		connection: NSURLConnection,
		bytesWritten: number,
		totalBytesWritten: number,
		totalBytesExpectedToWrite: number,
	): void

	connectionWillCacheResponse?(
		connection: NSURLConnection,
		cachedResponse: NSCachedURLResponse,
	): NSCachedURLResponse

	connectionDidFinishLoading?(connection: NSURLConnection): void
}

export declare class NSURLConnectionDataDelegate
	extends NativeObject
	implements NSURLConnectionDataDelegate {}

export declare interface NSXPCProxyCreating {
	readonly remoteObjectProxy: interop.Object

	remoteObjectProxyWithErrorHandler(handler: (p1: NSError) => void): interop.Object

	synchronousRemoteObjectProxyWithErrorHandler?(handler: (p1: NSError) => void): interop.Object
}

export declare class NSXPCProxyCreating extends NativeObject implements NSXPCProxyCreating {}

export declare interface NSNetServiceBrowserDelegate extends NSObjectProtocol {
	netServiceBrowserWillSearch?(browser: NSNetServiceBrowser): void

	netServiceBrowserDidStopSearch?(browser: NSNetServiceBrowser): void

	netServiceBrowserDidNotSearch?(
		browser: NSNetServiceBrowser,
		errorDict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	netServiceBrowserDidFindDomainMoreComing?(
		browser: NSNetServiceBrowser,
		domainString: string,
		moreComing: boolean,
	): void

	netServiceBrowserDidFindServiceMoreComing?(
		browser: NSNetServiceBrowser,
		service: NSNetService,
		moreComing: boolean,
	): void

	netServiceBrowserDidRemoveDomainMoreComing?(
		browser: NSNetServiceBrowser,
		domainString: string,
		moreComing: boolean,
	): void

	netServiceBrowserDidRemoveServiceMoreComing?(
		browser: NSNetServiceBrowser,
		service: NSNetService,
		moreComing: boolean,
	): void
}

export declare class NSNetServiceBrowserDelegate
	extends NativeObject
	implements NSNetServiceBrowserDelegate {}

export declare interface NSURLSessionWebSocketDelegate extends NSURLSessionTaskDelegate {
	URLSessionWebSocketTaskDidOpenWithProtocol?(
		session: NSURLSession,
		webSocketTask: NSURLSessionWebSocketTask,
		protocol: string | null,
	): void

	URLSessionWebSocketTaskDidCloseWithCodeReason?(
		session: NSURLSession,
		webSocketTask: NSURLSessionWebSocketTask,
		closeCode: interop.Enum<typeof NSURLSessionWebSocketCloseCode>,
		reason: NSData | null,
	): void
}

export declare class NSURLSessionWebSocketDelegate
	extends NativeObject
	implements NSURLSessionWebSocketDelegate {}

export declare interface NSLocking {
	lock(): void

	unlock(): void
}

export declare class NSLocking extends NativeObject implements NSLocking {}

export declare interface NSProgressReporting extends NSObjectProtocol {
	readonly progress: NSProgress
}

export declare class NSProgressReporting extends NativeObject implements NSProgressReporting {}

export declare interface NSCoding {
	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSCoding extends NativeObject implements NSCoding {}

export declare interface NSURLSessionDataDelegate extends NSURLSessionTaskDelegate {
	URLSessionDataTaskDidReceiveResponseCompletionHandler?(
		session: NSURLSession,
		dataTask: NSURLSessionDataTask,
		response: NSURLResponse,
		completionHandler: (p1: interop.Enum<typeof NSURLSessionResponseDisposition>) => void,
	): void

	URLSessionDataTaskDidBecomeDownloadTask?(
		session: NSURLSession,
		dataTask: NSURLSessionDataTask,
		downloadTask: NSURLSessionDownloadTask,
	): void

	URLSessionDataTaskDidBecomeStreamTask?(
		session: NSURLSession,
		dataTask: NSURLSessionDataTask,
		streamTask: NSURLSessionStreamTask,
	): void

	URLSessionDataTaskDidReceiveData?(
		session: NSURLSession,
		dataTask: NSURLSessionDataTask,
		data: NSData,
	): void

	URLSessionDataTaskWillCacheResponseCompletionHandler?(
		session: NSURLSession,
		dataTask: NSURLSessionDataTask,
		proposedResponse: NSCachedURLResponse,
		completionHandler: (p1: NSCachedURLResponse) => void | null,
	): void
}

export declare class NSURLSessionDataDelegate
	extends NativeObject
	implements NSURLSessionDataDelegate {}

export declare interface NSPortDelegate extends NSObjectProtocol {
	handlePortMessage?(message: NSPortMessage): void
}

export declare class NSPortDelegate extends NativeObject implements NSPortDelegate {}

export declare interface NSURLDownloadDelegate extends NSObjectProtocol {
	downloadDidBegin?(download: NSURLDownload): void

	downloadWillSendRequestRedirectResponse?(
		download: NSURLDownload,
		request: NSURLRequest,
		redirectResponse: NSURLResponse | null,
	): NSURLRequest

	downloadCanAuthenticateAgainstProtectionSpace?(
		connection: NSURLDownload,
		protectionSpace: NSURLProtectionSpace,
	): boolean

	downloadDidReceiveAuthenticationChallenge?(
		download: NSURLDownload,
		challenge: NSURLAuthenticationChallenge,
	): void

	downloadDidCancelAuthenticationChallenge?(
		download: NSURLDownload,
		challenge: NSURLAuthenticationChallenge,
	): void

	downloadShouldUseCredentialStorage?(download: NSURLDownload): boolean

	downloadDidReceiveResponse?(download: NSURLDownload, response: NSURLResponse): void

	downloadWillResumeWithResponseFromByte?(
		download: NSURLDownload,
		response: NSURLResponse,
		startingByte: number,
	): void

	downloadDidReceiveDataOfLength?(download: NSURLDownload, length: number): void

	downloadShouldDecodeSourceDataOfMIMEType?(download: NSURLDownload, encodingType: string): boolean

	downloadDecideDestinationWithSuggestedFilename?(download: NSURLDownload, filename: string): void

	downloadDidCreateDestination?(download: NSURLDownload, path: string): void

	downloadDidFinish?(download: NSURLDownload): void

	downloadDidFailWithError?(download: NSURLDownload, error: NSError): void
}

export declare class NSURLDownloadDelegate extends NativeObject implements NSURLDownloadDelegate {}

export declare interface NSXMLParserDelegate extends NSObjectProtocol {
	parserDidStartDocument?(parser: NSXMLParser): void

	parserDidEndDocument?(parser: NSXMLParser): void

	parserFoundNotationDeclarationWithNamePublicIDSystemID?(
		parser: NSXMLParser,
		name: string,
		publicID: string | null,
		systemID: string | null,
	): void

	parserFoundUnparsedEntityDeclarationWithNamePublicIDSystemIDNotationName?(
		parser: NSXMLParser,
		name: string,
		publicID: string | null,
		systemID: string | null,
		notationName: string | null,
	): void

	parserFoundAttributeDeclarationWithNameForElementTypeDefaultValue?(
		parser: NSXMLParser,
		attributeName: string,
		elementName: string,
		type: string | null,
		defaultValue: string | null,
	): void

	parserFoundElementDeclarationWithNameModel?(
		parser: NSXMLParser,
		elementName: string,
		model: string,
	): void

	parserFoundInternalEntityDeclarationWithNameValue?(
		parser: NSXMLParser,
		name: string,
		value: string | null,
	): void

	parserFoundExternalEntityDeclarationWithNamePublicIDSystemID?(
		parser: NSXMLParser,
		name: string,
		publicID: string | null,
		systemID: string | null,
	): void

	parserDidStartElementNamespaceURIQualifiedNameAttributes?(
		parser: NSXMLParser,
		elementName: string,
		namespaceURI: string | null,
		qName: string | null,
		attributeDict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	parserDidEndElementNamespaceURIQualifiedName?(
		parser: NSXMLParser,
		elementName: string,
		namespaceURI: string | null,
		qName: string | null,
	): void

	parserDidStartMappingPrefixToURI?(parser: NSXMLParser, prefix: string, namespaceURI: string): void

	parserDidEndMappingPrefix?(parser: NSXMLParser, prefix: string): void

	parserFoundCharacters?(parser: NSXMLParser, string: string): void

	parserFoundIgnorableWhitespace?(parser: NSXMLParser, whitespaceString: string): void

	parserFoundProcessingInstructionWithTargetData?(
		parser: NSXMLParser,
		target: string,
		data: string | null,
	): void

	parserFoundComment?(parser: NSXMLParser, comment: string): void

	parserFoundCDATA?(parser: NSXMLParser, CDATABlock: NSData): void

	parserResolveExternalEntityNameSystemID?(
		parser: NSXMLParser,
		name: string,
		systemID: string | null,
	): NSData

	parserParseErrorOccurred?(parser: NSXMLParser, parseError: NSError): void

	parserValidationErrorOccurred?(parser: NSXMLParser, validationError: NSError): void
}

export declare class NSXMLParserDelegate extends NativeObject implements NSXMLParserDelegate {}

export declare interface NSKeyedUnarchiverDelegate extends NSObjectProtocol {
	unarchiverCannotDecodeObjectOfClassNameOriginalClasses?(
		unarchiver: NSKeyedUnarchiver,
		name: string,
		classNames: NSArray<interop.Object> | Array<interop.Object>,
	): interop.Pointer

	unarchiverDidDecodeObject?(
		unarchiver: NSKeyedUnarchiver,
		object: interop.Object | null,
	): interop.Object

	unarchiverWillReplaceObjectWithObject?(
		unarchiver: NSKeyedUnarchiver,
		object: interop.Object,
		newObject: interop.Object,
	): void

	unarchiverWillFinish?(unarchiver: NSKeyedUnarchiver): void

	unarchiverDidFinish?(unarchiver: NSKeyedUnarchiver): void
}

export declare class NSKeyedUnarchiverDelegate
	extends NativeObject
	implements NSKeyedUnarchiverDelegate {}

export declare interface NSURLProtocolClient extends NSObjectProtocol {
	URLProtocolWasRedirectedToRequestRedirectResponse(
		protocol: NSURLProtocol,
		request: NSURLRequest,
		redirectResponse: NSURLResponse,
	): void

	URLProtocolCachedResponseIsValid(
		protocol: NSURLProtocol,
		cachedResponse: NSCachedURLResponse,
	): void

	URLProtocolDidReceiveResponseCacheStoragePolicy(
		protocol: NSURLProtocol,
		response: NSURLResponse,
		policy: interop.Enum<typeof NSURLCacheStoragePolicy>,
	): void

	URLProtocolDidLoadData(protocol: NSURLProtocol, data: NSData): void

	URLProtocolDidFinishLoading(protocol: NSURLProtocol): void

	URLProtocolDidFailWithError(protocol: NSURLProtocol, error: NSError): void

	URLProtocolDidReceiveAuthenticationChallenge(
		protocol: NSURLProtocol,
		challenge: NSURLAuthenticationChallenge,
	): void

	URLProtocolDidCancelAuthenticationChallenge(
		protocol: NSURLProtocol,
		challenge: NSURLAuthenticationChallenge,
	): void
}

export declare class NSURLProtocolClient extends NativeObject implements NSURLProtocolClient {}

export declare interface NSURLConnectionDownloadDelegate extends NSURLConnectionDelegate {
	connectionDidWriteDataTotalBytesWrittenExpectedTotalBytes?(
		connection: NSURLConnection,
		bytesWritten: number,
		totalBytesWritten: number,
		expectedTotalBytes: number,
	): void

	connectionDidResumeDownloadingTotalBytesWrittenExpectedTotalBytes?(
		connection: NSURLConnection,
		totalBytesWritten: number,
		expectedTotalBytes: number,
	): void

	connectionDidFinishDownloadingDestinationURL(
		connection: NSURLConnection,
		destinationURL: NSURL,
	): void
}

export declare class NSURLConnectionDownloadDelegate
	extends NativeObject
	implements NSURLConnectionDownloadDelegate {}

export declare interface NSConnectionDelegate extends NSObjectProtocol {
	makeNewConnectionSender?(conn: NSConnection, ancestor: NSConnection): boolean

	connectionShouldMakeNewConnection?(ancestor: NSConnection, conn: NSConnection): boolean

	authenticationDataForComponents?(
		components: NSArray<interop.Object> | Array<interop.Object>,
	): NSData

	authenticateComponentsWithData?(
		components: NSArray<interop.Object> | Array<interop.Object>,
		signature: NSData,
	): boolean

	createConversationForConnection?(conn: NSConnection): interop.Object

	connectionHandleRequest?(connection: NSConnection, doreq: NSDistantObjectRequest): boolean
}

export declare class NSConnectionDelegate extends NativeObject implements NSConnectionDelegate {}

export declare interface NSFileManagerDelegate extends NSObjectProtocol {
	fileManagerShouldCopyItemAtPathToPath?(
		fileManager: NSFileManager,
		srcPath: string,
		dstPath: string,
	): boolean

	fileManagerShouldCopyItemAtURLToURL?(
		fileManager: NSFileManager,
		srcURL: NSURL,
		dstURL: NSURL,
	): boolean

	fileManagerShouldProceedAfterErrorCopyingItemAtPathToPath?(
		fileManager: NSFileManager,
		error: NSError,
		srcPath: string,
		dstPath: string,
	): boolean

	fileManagerShouldProceedAfterErrorCopyingItemAtURLToURL?(
		fileManager: NSFileManager,
		error: NSError,
		srcURL: NSURL,
		dstURL: NSURL,
	): boolean

	fileManagerShouldMoveItemAtPathToPath?(
		fileManager: NSFileManager,
		srcPath: string,
		dstPath: string,
	): boolean

	fileManagerShouldMoveItemAtURLToURL?(
		fileManager: NSFileManager,
		srcURL: NSURL,
		dstURL: NSURL,
	): boolean

	fileManagerShouldProceedAfterErrorMovingItemAtPathToPath?(
		fileManager: NSFileManager,
		error: NSError,
		srcPath: string,
		dstPath: string,
	): boolean

	fileManagerShouldProceedAfterErrorMovingItemAtURLToURL?(
		fileManager: NSFileManager,
		error: NSError,
		srcURL: NSURL,
		dstURL: NSURL,
	): boolean

	fileManagerShouldLinkItemAtPathToPath?(
		fileManager: NSFileManager,
		srcPath: string,
		dstPath: string,
	): boolean

	fileManagerShouldLinkItemAtURLToURL?(
		fileManager: NSFileManager,
		srcURL: NSURL,
		dstURL: NSURL,
	): boolean

	fileManagerShouldProceedAfterErrorLinkingItemAtPathToPath?(
		fileManager: NSFileManager,
		error: NSError,
		srcPath: string,
		dstPath: string,
	): boolean

	fileManagerShouldProceedAfterErrorLinkingItemAtURLToURL?(
		fileManager: NSFileManager,
		error: NSError,
		srcURL: NSURL,
		dstURL: NSURL,
	): boolean

	fileManagerShouldRemoveItemAtPath?(fileManager: NSFileManager, path: string): boolean

	fileManagerShouldRemoveItemAtURL?(fileManager: NSFileManager, URL: NSURL): boolean

	fileManagerShouldProceedAfterErrorRemovingItemAtPath?(
		fileManager: NSFileManager,
		error: NSError,
		path: string,
	): boolean

	fileManagerShouldProceedAfterErrorRemovingItemAtURL?(
		fileManager: NSFileManager,
		error: NSError,
		URL: NSURL,
	): boolean
}

export declare class NSFileManagerDelegate extends NativeObject implements NSFileManagerDelegate {}

export declare interface NSNetServiceDelegate extends NSObjectProtocol {
	netServiceWillPublish?(sender: NSNetService): void

	netServiceDidPublish?(sender: NSNetService): void

	netServiceDidNotPublish?(
		sender: NSNetService,
		errorDict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	netServiceWillResolve?(sender: NSNetService): void

	netServiceDidResolveAddress?(sender: NSNetService): void

	netServiceDidNotResolve?(
		sender: NSNetService,
		errorDict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	netServiceDidStop?(sender: NSNetService): void

	netServiceDidUpdateTXTRecordData?(sender: NSNetService, data: NSData): void

	netServiceDidAcceptConnectionWithInputStreamOutputStream?(
		sender: NSNetService,
		inputStream: NSInputStream,
		outputStream: NSOutputStream,
	): void
}

export declare class NSNetServiceDelegate extends NativeObject implements NSNetServiceDelegate {}

export declare interface NSCacheDelegate extends NSObjectProtocol {
	cacheWillEvictObject?(cache: NSCache, obj: interop.Object): void
}

export declare class NSCacheDelegate extends NativeObject implements NSCacheDelegate {}

export declare interface NSFilePresenter extends NSObjectProtocol {
	readonly presentedItemURL: NSURL

	readonly presentedItemOperationQueue: NSOperationQueue

	readonly primaryPresentedItemURL?: NSURL

	relinquishPresentedItemToReader?(reader: (p1: () => void) => void | null): void

	relinquishPresentedItemToWriter?(writer: (p1: () => void) => void | null): void

	savePresentedItemChangesWithCompletionHandler?(
		completionHandler: (p1: NSError) => void | null,
	): void

	accommodatePresentedItemDeletionWithCompletionHandler?(
		completionHandler: (p1: NSError) => void | null,
	): void

	presentedItemDidMoveToURL?(newURL: NSURL): void

	presentedItemDidChange?(): void

	presentedItemDidChangeUbiquityAttributes?(attributes: NSSet): void

	readonly observedPresentedItemUbiquityAttributes?: NSSet

	presentedItemDidGainVersion?(version: NSFileVersion): void

	presentedItemDidLoseVersion?(version: NSFileVersion): void

	presentedItemDidResolveConflictVersion?(version: NSFileVersion): void

	accommodatePresentedSubitemDeletionAtURLCompletionHandler?(
		url: NSURL,
		completionHandler: (p1: NSError) => void | null,
	): void

	presentedSubitemDidAppearAtURL?(url: NSURL): void

	presentedSubitemAtURLDidMoveToURL?(oldURL: NSURL, newURL: NSURL): void

	presentedSubitemDidChangeAtURL?(url: NSURL): void

	presentedSubitemAtURLDidGainVersion?(url: NSURL, version: NSFileVersion): void

	presentedSubitemAtURLDidLoseVersion?(url: NSURL, version: NSFileVersion): void

	presentedSubitemAtURLDidResolveConflictVersion?(url: NSURL, version: NSFileVersion): void
}

export declare class NSFilePresenter extends NativeObject implements NSFilePresenter {}

export declare interface NSMachPortDelegate extends NSPortDelegate {
	handleMachMessage?(msg: interop.PointerConvertible): void
}

export declare class NSMachPortDelegate extends NativeObject implements NSMachPortDelegate {}

export declare interface NSDiscardableContent {
	beginContentAccess(): boolean

	endContentAccess(): void

	discardContentIfPossible(): void

	isContentDiscarded(): boolean
}

export declare class NSDiscardableContent extends NativeObject implements NSDiscardableContent {}

export declare interface NSStreamDelegate extends NSObjectProtocol {
	streamHandleEvent?(aStream: NSStream, eventCode: interop.Enum<typeof NSStreamEvent>): void
}

export declare class NSStreamDelegate extends NativeObject implements NSStreamDelegate {}

export declare interface NSItemProviderReading extends NSObjectProtocol {}

export declare class NSItemProviderReading extends NativeObject implements NSItemProviderReading {
	static readonly readableTypeIdentifiersForItemProvider: NSArray

	static objectWithItemProviderDataTypeIdentifierError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		data: NSData,
		typeIdentifier: string,
		outError: interop.PointerConvertible,
	): InstanceType<This>
}

export declare interface NSURLSessionTaskDelegate extends NSURLSessionDelegate {
	URLSessionTaskWillBeginDelayedRequestCompletionHandler?(
		session: NSURLSession,
		task: NSURLSessionTask,
		request: NSURLRequest,
		completionHandler: (
			p1: interop.Enum<typeof NSURLSessionDelayedRequestDisposition>,
			p2: NSURLRequest,
		) => void | null,
	): void

	URLSessionTaskIsWaitingForConnectivity?(session: NSURLSession, task: NSURLSessionTask): void

	URLSessionTaskWillPerformHTTPRedirectionNewRequestCompletionHandler?(
		session: NSURLSession,
		task: NSURLSessionTask,
		response: NSHTTPURLResponse,
		request: NSURLRequest,
		completionHandler: (p1: NSURLRequest) => void | null,
	): void

	URLSessionTaskDidReceiveChallengeCompletionHandler?(
		session: NSURLSession,
		task: NSURLSessionTask,
		challenge: NSURLAuthenticationChallenge,
		completionHandler: (
			p1: interop.Enum<typeof NSURLSessionAuthChallengeDisposition>,
			p2: NSURLCredential,
		) => void | null,
	): void

	URLSessionTaskNeedNewBodyStream?(
		session: NSURLSession,
		task: NSURLSessionTask,
		completionHandler: (p1: NSInputStream) => void | null,
	): void

	URLSessionTaskDidSendBodyDataTotalBytesSentTotalBytesExpectedToSend?(
		session: NSURLSession,
		task: NSURLSessionTask,
		bytesSent: number,
		totalBytesSent: number,
		totalBytesExpectedToSend: number,
	): void

	URLSessionTaskDidFinishCollectingMetrics?(
		session: NSURLSession,
		task: NSURLSessionTask,
		metrics: NSURLSessionTaskMetrics,
	): void

	URLSessionTaskDidCompleteWithError?(
		session: NSURLSession,
		task: NSURLSessionTask,
		error: NSError | null,
	): void
}

export declare class NSURLSessionTaskDelegate
	extends NativeObject
	implements NSURLSessionTaskDelegate {}

export declare interface NSURLHandleClient {
	URLHandleResourceDataDidBecomeAvailable(sender: NSURLHandle, newBytes: NSData): void

	URLHandleResourceDidBeginLoading(sender: NSURLHandle): void

	URLHandleResourceDidFinishLoading(sender: NSURLHandle): void

	URLHandleResourceDidCancelLoading(sender: NSURLHandle): void

	URLHandleResourceDidFailLoadingWithReason(sender: NSURLHandle, reason: string): void
}

export declare class NSURLHandleClient extends NativeObject implements NSURLHandleClient {}

export declare interface NSURLAuthenticationChallengeSender extends NSObjectProtocol {
	useCredentialForAuthenticationChallenge(
		credential: NSURLCredential,
		challenge: NSURLAuthenticationChallenge,
	): void

	continueWithoutCredentialForAuthenticationChallenge(challenge: NSURLAuthenticationChallenge): void

	cancelAuthenticationChallenge(challenge: NSURLAuthenticationChallenge): void

	performDefaultHandlingForAuthenticationChallenge?(challenge: NSURLAuthenticationChallenge): void

	rejectProtectionSpaceAndContinueWithChallenge?(challenge: NSURLAuthenticationChallenge): void
}

export declare class NSURLAuthenticationChallengeSender
	extends NativeObject
	implements NSURLAuthenticationChallengeSender {}

export declare interface NSURLSessionDownloadDelegate extends NSURLSessionTaskDelegate {
	URLSessionDownloadTaskDidFinishDownloadingToURL(
		session: NSURLSession,
		downloadTask: NSURLSessionDownloadTask,
		location: NSURL,
	): void

	URLSessionDownloadTaskDidWriteDataTotalBytesWrittenTotalBytesExpectedToWrite?(
		session: NSURLSession,
		downloadTask: NSURLSessionDownloadTask,
		bytesWritten: number,
		totalBytesWritten: number,
		totalBytesExpectedToWrite: number,
	): void

	URLSessionDownloadTaskDidResumeAtOffsetExpectedTotalBytes?(
		session: NSURLSession,
		downloadTask: NSURLSessionDownloadTask,
		fileOffset: number,
		expectedTotalBytes: number,
	): void
}

export declare class NSURLSessionDownloadDelegate
	extends NativeObject
	implements NSURLSessionDownloadDelegate {}

export declare interface NSXPCListenerDelegate extends NSObjectProtocol {
	listenerShouldAcceptNewConnection?(
		listener: NSXPCListener,
		newConnection: NSXPCConnection,
	): boolean
}

export declare class NSXPCListenerDelegate extends NativeObject implements NSXPCListenerDelegate {}

export declare interface NSKeyedArchiverDelegate extends NSObjectProtocol {
	archiverWillEncodeObject?(archiver: NSKeyedArchiver, object: interop.Object): interop.Object

	archiverDidEncodeObject?(archiver: NSKeyedArchiver, object: interop.Object | null): void

	archiverWillReplaceObjectWithObject?(
		archiver: NSKeyedArchiver,
		object: interop.Object | null,
		newObject: interop.Object | null,
	): void

	archiverWillFinish?(archiver: NSKeyedArchiver): void

	archiverDidFinish?(archiver: NSKeyedArchiver): void
}

export declare class NSKeyedArchiverDelegate
	extends NativeObject
	implements NSKeyedArchiverDelegate {}

export declare interface NSExtensionRequestHandling extends NSObjectProtocol {
	beginRequestWithExtensionContext(context: NSExtensionContext): void
}

export declare class NSExtensionRequestHandling
	extends NativeObject
	implements NSExtensionRequestHandling {}

export declare interface NSSpellServerDelegate extends NSObjectProtocol {
	spellServerFindMisspelledWordInStringLanguageWordCountCountOnly?(
		sender: NSSpellServer,
		stringToCheck: string,
		language: string,
		wordCount: interop.PointerConvertible,
		countOnly: boolean,
	): _NSRange

	spellServerSuggestGuessesForWordInLanguage?(
		sender: NSSpellServer,
		word: string,
		language: string,
	): NSArray

	spellServerDidLearnWordInLanguage?(sender: NSSpellServer, word: string, language: string): void

	spellServerDidForgetWordInLanguage?(sender: NSSpellServer, word: string, language: string): void

	spellServerSuggestCompletionsForPartialWordRangeInStringLanguage?(
		sender: NSSpellServer,
		range: _NSRange,
		string: string,
		language: string,
	): NSArray

	spellServerCheckGrammarInStringLanguageDetails?(
		sender: NSSpellServer,
		stringToCheck: string,
		language: string | null,
		details: interop.PointerConvertible,
	): _NSRange

	spellServerCheckStringOffsetTypesOptionsOrthographyWordCount?(
		sender: NSSpellServer,
		stringToCheck: string,
		offset: number,
		checkingTypes: number,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		orthography: NSOrthography | null,
		wordCount: interop.PointerConvertible,
	): NSArray

	spellServerRecordResponseToCorrectionForWordLanguage?(
		sender: NSSpellServer,
		response: number,
		correction: string,
		word: string,
		language: string,
	): void
}

export declare class NSSpellServerDelegate extends NativeObject implements NSSpellServerDelegate {}

export declare interface NSMutableCopying {
	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSMutableCopying extends NativeObject implements NSMutableCopying {}

export declare interface NSUserNotificationCenterDelegate extends NSObjectProtocol {
	userNotificationCenterDidDeliverNotification?(
		center: NSUserNotificationCenter,
		notification: NSUserNotification,
	): void

	userNotificationCenterDidActivateNotification?(
		center: NSUserNotificationCenter,
		notification: NSUserNotification,
	): void

	userNotificationCenterShouldPresentNotification?(
		center: NSUserNotificationCenter,
		notification: NSUserNotification,
	): boolean
}

export declare class NSUserNotificationCenterDelegate
	extends NativeObject
	implements NSUserNotificationCenterDelegate {}

export declare interface NSUserActivityDelegate extends NSObjectProtocol {
	userActivityWillSave?(userActivity: NSUserActivity): void

	userActivityWasContinued?(userActivity: NSUserActivity): void

	userActivityDidReceiveInputStreamOutputStream?(
		userActivity: NSUserActivity,
		inputStream: NSInputStream,
		outputStream: NSOutputStream,
	): void
}

export declare class NSUserActivityDelegate
	extends NativeObject
	implements NSUserActivityDelegate {}

export declare interface NSURLSessionStreamDelegate extends NSURLSessionTaskDelegate {
	URLSessionReadClosedForStreamTask?(
		session: NSURLSession,
		streamTask: NSURLSessionStreamTask,
	): void

	URLSessionWriteClosedForStreamTask?(
		session: NSURLSession,
		streamTask: NSURLSessionStreamTask,
	): void

	URLSessionBetterRouteDiscoveredForStreamTask?(
		session: NSURLSession,
		streamTask: NSURLSessionStreamTask,
	): void

	URLSessionStreamTaskDidBecomeInputStreamOutputStream?(
		session: NSURLSession,
		streamTask: NSURLSessionStreamTask,
		inputStream: NSInputStream,
		outputStream: NSOutputStream,
	): void
}

export declare class NSURLSessionStreamDelegate
	extends NativeObject
	implements NSURLSessionStreamDelegate {}

export declare interface NSDecimalNumberBehaviors {
	roundingMode(): interop.Enum<typeof NSRoundingMode>

	scale(): number

	exceptionDuringOperationErrorLeftOperandRightOperand(
		operation: string,
		error: interop.Enum<typeof NSCalculationError>,
		leftOperand: NSDecimalNumber,
		rightOperand: NSDecimalNumber | null,
	): NSDecimalNumber
}

export declare class NSDecimalNumberBehaviors
	extends NativeObject
	implements NSDecimalNumberBehaviors {}

export declare interface NSMetadataQueryDelegate extends NSObjectProtocol {
	metadataQueryReplacementObjectForResultObject?(
		query: NSMetadataQuery,
		result: NSMetadataItem,
	): interop.Object

	metadataQueryReplacementValueForAttributeValue?(
		query: NSMetadataQuery,
		attrName: string,
		attrValue: interop.Object,
	): interop.Object
}

export declare class NSMetadataQueryDelegate
	extends NativeObject
	implements NSMetadataQueryDelegate {}

export declare interface NSSecureCoding extends NSCoding {}

export declare class NSSecureCoding extends NativeObject implements NSSecureCoding {
	static readonly supportsSecureCoding: boolean
}

export declare interface NSItemProviderWriting extends NSObjectProtocol {
	readonly writableTypeIdentifiersForItemProvider?: NSArray

	itemProviderVisibilityForRepresentationWithTypeIdentifier?(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>

	loadDataWithTypeIdentifierForItemProviderCompletionHandler(
		typeIdentifier: string,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): NSProgress
}

export declare class NSItemProviderWriting extends NativeObject implements NSItemProviderWriting {
	static readonly writableTypeIdentifiersForItemProvider: NSArray

	static itemProviderVisibilityForRepresentationWithTypeIdentifier(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>
}

export declare interface NSURLSessionDelegate extends NSObjectProtocol {
	URLSessionDidBecomeInvalidWithError?(session: NSURLSession, error: NSError | null): void

	URLSessionDidReceiveChallengeCompletionHandler?(
		session: NSURLSession,
		challenge: NSURLAuthenticationChallenge,
		completionHandler: (
			p1: interop.Enum<typeof NSURLSessionAuthChallengeDisposition>,
			p2: NSURLCredential,
		) => void | null,
	): void

	URLSessionDidFinishEventsForBackgroundURLSession?(session: NSURLSession): void
}

export declare class NSURLSessionDelegate extends NativeObject implements NSURLSessionDelegate {}

export declare interface NSCopying {
	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSCopying extends NativeObject implements NSCopying {}

export declare interface NSURLConnectionDelegate extends NSObjectProtocol {
	connectionDidFailWithError?(connection: NSURLConnection, error: NSError): void

	connectionShouldUseCredentialStorage?(connection: NSURLConnection): boolean

	connectionWillSendRequestForAuthenticationChallenge?(
		connection: NSURLConnection,
		challenge: NSURLAuthenticationChallenge,
	): void

	connectionCanAuthenticateAgainstProtectionSpace?(
		connection: NSURLConnection,
		protectionSpace: NSURLProtectionSpace,
	): boolean

	connectionDidReceiveAuthenticationChallenge?(
		connection: NSURLConnection,
		challenge: NSURLAuthenticationChallenge,
	): void

	connectionDidCancelAuthenticationChallenge?(
		connection: NSURLConnection,
		challenge: NSURLAuthenticationChallenge,
	): void
}

export declare class NSURLConnectionDelegate
	extends NativeObject
	implements NSURLConnectionDelegate {}

export declare interface NSFastEnumeration {
	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number
}

export declare class NSFastEnumeration extends NativeObject implements NSFastEnumeration {}

export declare class NSMutableString extends NSString {
	replaceCharactersInRangeWithString(range: _NSRange, aString: string): void

	insertStringAtIndex(aString: string, loc: number): void

	deleteCharactersInRange(range: _NSRange): void

	appendString(aString: string): void

	appendFormat(format: string): void

	setString(aString: string): void

	replaceOccurrencesOfStringWithStringOptionsRange(
		target: string,
		replacement: string,
		options: interop.Enum<typeof NSStringCompareOptions>,
		searchRange: _NSRange,
	): number

	applyTransformReverseRangeUpdatedRange(
		transform: string,
		reverse: boolean,
		range: _NSRange,
		resultingRange: interop.PointerConvertible,
	): boolean

	initWithCapacity(capacity: number): this

	static stringWithCapacity(capacity: number): NSMutableString
}

export declare class NSCreateCommand extends NSScriptCommand {
	readonly createClassDescription: NSScriptClassDescription

	readonly resolvedKeyDictionary: NSDictionary
}

export declare class NSConditionLock extends NSObject implements NSLocking {
	initWithCondition(condition: number): this

	readonly condition: number

	lockWhenCondition(condition: number): void

	tryLock(): boolean

	tryLockWhenCondition(condition: number): boolean

	unlockWithCondition(condition: number): void

	lockBeforeDate(limit: NSDate): boolean

	lockWhenConditionBeforeDate(condition: number, limit: NSDate): boolean

	name: string

	lock(): void

	unlock(): void
}

export declare class NSFileProviderService extends NSObject {
	getFileProviderConnectionWithCompletionHandler(
		completionHandler: (p1: NSXPCConnection, p2: NSError) => void | null,
	): void

	readonly name: string
}

export declare class NSPointerFunctions extends NSObject implements NSCopying {
	initWithOptions(options: interop.Enum<typeof NSPointerFunctionsOptions>): this

	static pointerFunctionsWithOptions(
		options: interop.Enum<typeof NSPointerFunctionsOptions>,
	): NSPointerFunctions

	hashFunction: (
		p1: interop.PointerConvertible,
		p2: (p1: interop.PointerConvertible) => number,
	) => number | null

	isEqualFunction: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: (p1: interop.PointerConvertible) => number,
	) => boolean | null

	sizeFunction: (p1: interop.PointerConvertible) => number

	descriptionFunction: (p1: interop.PointerConvertible) => string | null

	relinquishFunction: (
		p1: interop.PointerConvertible,
		p2: (p1: interop.PointerConvertible) => number,
	) => void | null

	acquireFunction: (
		p1: interop.PointerConvertible,
		p2: (p1: interop.PointerConvertible) => number,
		p3: boolean,
	) => interop.Pointer | null

	usesStrongWriteBarrier: boolean

	usesWeakReadAndWriteBarriers: boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSScriptCoercionHandler extends NSObject {
	static sharedCoercionHandler(): NSScriptCoercionHandler

	coerceValueToClass(value: interop.Object, toClass: interop.PointerConvertible): interop.Object

	registerCoercerSelectorToConvertFromClassToClass(
		coercer: interop.Object,
		selector: string,
		fromClass: interop.PointerConvertible,
		toClass: interop.PointerConvertible,
	): void
}

export declare class NSInvocationOperation extends NSOperation {
	initWithTargetSelectorObject(
		target: interop.Object,
		sel: string,
		arg: interop.Object | null,
	): this

	initWithInvocation(inv: NSInvocation): this

	readonly invocation: NSInvocation

	readonly result: interop.Object
}

export declare class NSBackgroundActivityScheduler extends NSObject {
	initWithIdentifier(identifier: string): this

	readonly identifier: string

	qualityOfService: interop.Enum<typeof NSQualityOfService>

	repeats: boolean

	interval: number

	tolerance: number

	scheduleWithBlock(
		block: (p1: (p1: interop.Enum<typeof NSBackgroundActivityResult>) => void) => void,
	): void

	invalidate(): void

	readonly shouldDefer: boolean
}

export declare class NSMethodSignature extends NSObject {
	static signatureWithObjCTypes(types: string): NSMethodSignature

	readonly numberOfArguments: number

	getArgumentTypeAtIndex(idx: number): string

	readonly frameLength: number

	isOneway(): boolean

	readonly methodReturnType: string

	readonly methodReturnLength: number
}

export declare class NSURLCredential extends NSObject implements NSSecureCoding, NSCopying {
	readonly persistence: interop.Enum<typeof NSURLCredentialPersistence>

	initWithUserPasswordPersistence(
		user: string,
		password: string,
		persistence: interop.Enum<typeof NSURLCredentialPersistence>,
	): this

	static credentialWithUserPasswordPersistence(
		user: string,
		password: string,
		persistence: interop.Enum<typeof NSURLCredentialPersistence>,
	): NSURLCredential

	readonly user: string

	readonly password: string

	readonly hasPassword: boolean

	initWithIdentityCertificatesPersistence(
		identity: interop.Object,
		certArray: NSArray<interop.Object> | Array<interop.Object> | null,
		persistence: interop.Enum<typeof NSURLCredentialPersistence>,
	): this

	static credentialWithIdentityCertificatesPersistence(
		identity: interop.Object,
		certArray: NSArray<interop.Object> | Array<interop.Object> | null,
		persistence: interop.Enum<typeof NSURLCredentialPersistence>,
	): NSURLCredential

	readonly identity: interop.Object

	readonly certificates: NSArray

	initWithTrust(trust: interop.Object): this

	static credentialForTrust(trust: interop.Object): NSURLCredential

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSMutableURLRequest extends NSURLRequest {
	// @ts-ignore MemberDecl.tsIgnore
	URL: NSURL

	// @ts-ignore MemberDecl.tsIgnore
	cachePolicy: interop.Enum<typeof NSURLRequestCachePolicy>

	// @ts-ignore MemberDecl.tsIgnore
	timeoutInterval: number

	// @ts-ignore MemberDecl.tsIgnore
	mainDocumentURL: NSURL

	// @ts-ignore MemberDecl.tsIgnore
	networkServiceType: interop.Enum<typeof NSURLRequestNetworkServiceType>

	// @ts-ignore MemberDecl.tsIgnore
	allowsCellularAccess: boolean

	// @ts-ignore MemberDecl.tsIgnore
	allowsExpensiveNetworkAccess: boolean

	// @ts-ignore MemberDecl.tsIgnore
	allowsConstrainedNetworkAccess: boolean

	// @ts-ignore MemberDecl.tsIgnore
	HTTPMethod: string

	// @ts-ignore MemberDecl.tsIgnore
	get allHTTPHeaderFields(): NSDictionary
	// @ts-ignore MemberDecl.tsIgnore
	set allHTTPHeaderFields(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	setValueForHTTPHeaderField(value: string | null, field: string): void

	addValueForHTTPHeaderField(value: string, field: string): void

	// @ts-ignore MemberDecl.tsIgnore
	HTTPBody: NSData

	// @ts-ignore MemberDecl.tsIgnore
	HTTPBodyStream: NSInputStream

	// @ts-ignore MemberDecl.tsIgnore
	HTTPShouldHandleCookies: boolean

	// @ts-ignore MemberDecl.tsIgnore
	HTTPShouldUsePipelining: boolean
}

export declare class NSDataDetector extends NSRegularExpression {
	static dataDetectorWithTypesError(
		checkingTypes: number,
		error: interop.PointerConvertible,
	): NSDataDetector

	initWithTypesError(checkingTypes: number, error: interop.PointerConvertible): this

	readonly checkingTypes: number
}

export declare class NSURLSessionDownloadTask extends NSURLSessionTask {
	cancelByProducingResumeData(completionHandler: (p1: NSData) => void | null): void

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class NSValueTransformer extends NSObject {
	static setValueTransformerForName(transformer: NSValueTransformer | null, name: string): void

	static valueTransformerForName(name: string): NSValueTransformer

	static valueTransformerNames(): NSArray

	static transformedValueClass(): interop.Pointer

	static allowsReverseTransformation(): boolean

	transformedValue(value: interop.Object | null): interop.Object

	reverseTransformedValue(value: interop.Object | null): interop.Object
}

export declare class NSPort extends NSObject implements NSCopying, NSCoding {
	static port(): NSPort

	invalidate(): void

	readonly valid: boolean

	setDelegate(anObject: NSPortDelegate | null): void

	delegate(): NSPortDelegate

	scheduleInRunLoopForMode(runLoop: NSRunLoop, mode: string): void

	removeFromRunLoopForMode(runLoop: NSRunLoop, mode: string): void

	readonly reservedSpaceLength: number

	sendBeforeDateComponentsFromReserved(
		limitDate: NSDate,
		components: NSMutableArray | null,
		receivePort: NSPort | null,
		headerSpaceReserved: number,
	): boolean

	sendBeforeDateMsgidComponentsFromReserved(
		limitDate: NSDate,
		msgID: number,
		components: NSMutableArray | null,
		receivePort: NSPort | null,
		headerSpaceReserved: number,
	): boolean

	addConnectionToRunLoopForMode(conn: NSConnection, runLoop: NSRunLoop, mode: string): void

	removeConnectionFromRunLoopForMode(conn: NSConnection, runLoop: NSRunLoop, mode: string): void

	isValid(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSPipe extends NSObject {
	readonly fileHandleForReading: NSFileHandle

	readonly fileHandleForWriting: NSFileHandle

	static pipe(): NSPipe
}

export declare class NSCalendar extends NSObject implements NSCopying, NSSecureCoding {
	static readonly currentCalendar: NSCalendar

	static readonly autoupdatingCurrentCalendar: NSCalendar

	static calendarWithIdentifier(calendarIdentifierConstant: string): NSCalendar

	initWithCalendarIdentifier(ident: string): this

	readonly calendarIdentifier: string

	locale: NSLocale

	timeZone: NSTimeZone

	firstWeekday: number

	minimumDaysInFirstWeek: number

	readonly eraSymbols: NSArray

	readonly longEraSymbols: NSArray

	readonly monthSymbols: NSArray

	readonly shortMonthSymbols: NSArray

	readonly veryShortMonthSymbols: NSArray

	readonly standaloneMonthSymbols: NSArray

	readonly shortStandaloneMonthSymbols: NSArray

	readonly veryShortStandaloneMonthSymbols: NSArray

	readonly weekdaySymbols: NSArray

	readonly shortWeekdaySymbols: NSArray

	readonly veryShortWeekdaySymbols: NSArray

	readonly standaloneWeekdaySymbols: NSArray

	readonly shortStandaloneWeekdaySymbols: NSArray

	readonly veryShortStandaloneWeekdaySymbols: NSArray

	readonly quarterSymbols: NSArray

	readonly shortQuarterSymbols: NSArray

	readonly standaloneQuarterSymbols: NSArray

	readonly shortStandaloneQuarterSymbols: NSArray

	readonly AMSymbol: string

	readonly PMSymbol: string

	minimumRangeOfUnit(unit: interop.Enum<typeof NSCalendarUnit>): _NSRange

	maximumRangeOfUnit(unit: interop.Enum<typeof NSCalendarUnit>): _NSRange

	rangeOfUnitInUnitForDate(
		smaller: interop.Enum<typeof NSCalendarUnit>,
		larger: interop.Enum<typeof NSCalendarUnit>,
		date: NSDate,
	): _NSRange

	ordinalityOfUnitInUnitForDate(
		smaller: interop.Enum<typeof NSCalendarUnit>,
		larger: interop.Enum<typeof NSCalendarUnit>,
		date: NSDate,
	): number

	rangeOfUnitStartDateIntervalForDate(
		unit: interop.Enum<typeof NSCalendarUnit>,
		datep: interop.PointerConvertible,
		tip: interop.PointerConvertible,
		date: NSDate,
	): boolean

	dateFromComponents(comps: NSDateComponents): NSDate

	componentsFromDate(unitFlags: interop.Enum<typeof NSCalendarUnit>, date: NSDate): NSDateComponents

	dateByAddingComponentsToDateOptions(
		comps: NSDateComponents,
		date: NSDate,
		opts: interop.Enum<typeof NSCalendarOptions>,
	): NSDate

	componentsFromDateToDateOptions(
		unitFlags: interop.Enum<typeof NSCalendarUnit>,
		startingDate: NSDate,
		resultDate: NSDate,
		opts: interop.Enum<typeof NSCalendarOptions>,
	): NSDateComponents

	getEraYearMonthDayFromDate(
		eraValuePointer: interop.PointerConvertible,
		yearValuePointer: interop.PointerConvertible,
		monthValuePointer: interop.PointerConvertible,
		dayValuePointer: interop.PointerConvertible,
		date: NSDate,
	): void

	getEraYearForWeekOfYearWeekOfYearWeekdayFromDate(
		eraValuePointer: interop.PointerConvertible,
		yearValuePointer: interop.PointerConvertible,
		weekValuePointer: interop.PointerConvertible,
		weekdayValuePointer: interop.PointerConvertible,
		date: NSDate,
	): void

	getHourMinuteSecondNanosecondFromDate(
		hourValuePointer: interop.PointerConvertible,
		minuteValuePointer: interop.PointerConvertible,
		secondValuePointer: interop.PointerConvertible,
		nanosecondValuePointer: interop.PointerConvertible,
		date: NSDate,
	): void

	componentFromDate(unit: interop.Enum<typeof NSCalendarUnit>, date: NSDate): number

	dateWithEraYearMonthDayHourMinuteSecondNanosecond(
		eraValue: number,
		yearValue: number,
		monthValue: number,
		dayValue: number,
		hourValue: number,
		minuteValue: number,
		secondValue: number,
		nanosecondValue: number,
	): NSDate

	dateWithEraYearForWeekOfYearWeekOfYearWeekdayHourMinuteSecondNanosecond(
		eraValue: number,
		yearValue: number,
		weekValue: number,
		weekdayValue: number,
		hourValue: number,
		minuteValue: number,
		secondValue: number,
		nanosecondValue: number,
	): NSDate

	startOfDayForDate(date: NSDate): NSDate

	componentsInTimeZoneFromDate(timezone: NSTimeZone, date: NSDate): NSDateComponents

	compareDateToDateToUnitGranularity(
		date1: NSDate,
		date2: NSDate,
		unit: interop.Enum<typeof NSCalendarUnit>,
	): interop.Enum<typeof NSComparisonResult>

	isDateEqualToDateToUnitGranularity(
		date1: NSDate,
		date2: NSDate,
		unit: interop.Enum<typeof NSCalendarUnit>,
	): boolean

	isDateInSameDayAsDate(date1: NSDate, date2: NSDate): boolean

	isDateInToday(date: NSDate): boolean

	isDateInYesterday(date: NSDate): boolean

	isDateInTomorrow(date: NSDate): boolean

	isDateInWeekend(date: NSDate): boolean

	rangeOfWeekendStartDateIntervalContainingDate(
		datep: interop.PointerConvertible,
		tip: interop.PointerConvertible,
		date: NSDate,
	): boolean

	nextWeekendStartDateIntervalOptionsAfterDate(
		datep: interop.PointerConvertible,
		tip: interop.PointerConvertible,
		options: interop.Enum<typeof NSCalendarOptions>,
		date: NSDate,
	): boolean

	componentsFromDateComponentsToDateComponentsOptions(
		unitFlags: interop.Enum<typeof NSCalendarUnit>,
		startingDateComp: NSDateComponents,
		resultDateComp: NSDateComponents,
		options: interop.Enum<typeof NSCalendarOptions>,
	): NSDateComponents

	dateByAddingUnitValueToDateOptions(
		unit: interop.Enum<typeof NSCalendarUnit>,
		value: number,
		date: NSDate,
		options: interop.Enum<typeof NSCalendarOptions>,
	): NSDate

	enumerateDatesStartingAfterDateMatchingComponentsOptionsUsingBlock(
		start: NSDate,
		comps: NSDateComponents,
		opts: interop.Enum<typeof NSCalendarOptions>,
		block: (p1: NSDate, p2: boolean, p3: interop.PointerConvertible) => void | null,
	): void

	nextDateAfterDateMatchingComponentsOptions(
		date: NSDate,
		comps: NSDateComponents,
		options: interop.Enum<typeof NSCalendarOptions>,
	): NSDate

	nextDateAfterDateMatchingUnitValueOptions(
		date: NSDate,
		unit: interop.Enum<typeof NSCalendarUnit>,
		value: number,
		options: interop.Enum<typeof NSCalendarOptions>,
	): NSDate

	nextDateAfterDateMatchingHourMinuteSecondOptions(
		date: NSDate,
		hourValue: number,
		minuteValue: number,
		secondValue: number,
		options: interop.Enum<typeof NSCalendarOptions>,
	): NSDate

	dateBySettingUnitValueOfDateOptions(
		unit: interop.Enum<typeof NSCalendarUnit>,
		v: number,
		date: NSDate,
		opts: interop.Enum<typeof NSCalendarOptions>,
	): NSDate

	dateBySettingHourMinuteSecondOfDateOptions(
		h: number,
		m: number,
		s: number,
		date: NSDate,
		opts: interop.Enum<typeof NSCalendarOptions>,
	): NSDate

	dateMatchesComponents(date: NSDate, components: NSDateComponents): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSMoveCommand extends NSScriptCommand {
	setReceiversSpecifier(receiversSpecifier: NSScriptObjectSpecifier | null): void
	setReceiversSpecifier(receiversRef: NSScriptObjectSpecifier | null): void

	readonly keySpecifier: NSScriptObjectSpecifier
}

export declare class NSEnergyFormatter extends NSFormatter {
	numberFormatter: NSNumberFormatter

	unitStyle: interop.Enum<typeof NSFormattingUnitStyle>

	forFoodEnergyUse: boolean

	stringFromValueUnit(value: number, unit: interop.Enum<typeof NSEnergyFormatterUnit>): string

	stringFromJoules(numberInJoules: number): string

	unitStringFromValueUnit(value: number, unit: interop.Enum<typeof NSEnergyFormatterUnit>): string

	unitStringFromJoulesUsedUnit(numberInJoules: number, unitp: interop.PointerConvertible): string

	getObjectValueForStringErrorDescription(
		obj: interop.PointerConvertible,
		string: string,
		error: interop.PointerConvertible,
	): boolean

	isForFoodEnergyUse(): boolean
}

export declare class NSURLAuthenticationChallenge extends NSObject implements NSSecureCoding {
	initWithProtectionSpaceProposedCredentialPreviousFailureCountFailureResponseErrorSender(
		space: NSURLProtectionSpace,
		credential: NSURLCredential | null,
		previousFailureCount: number,
		response: NSURLResponse | null,
		error: NSError | null,
		sender: NSURLAuthenticationChallengeSender,
	): this

	initWithAuthenticationChallengeSender(
		challenge: NSURLAuthenticationChallenge,
		sender: NSURLAuthenticationChallengeSender,
	): this

	readonly protectionSpace: NSURLProtectionSpace

	readonly proposedCredential: NSURLCredential

	readonly previousFailureCount: number

	readonly failureResponse: NSURLResponse

	readonly error: NSError

	readonly sender: NSURLAuthenticationChallengeSender

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSLock extends NSObject implements NSLocking {
	tryLock(): boolean

	lockBeforeDate(limit: NSDate): boolean

	name: string

	lock(): void

	unlock(): void
}

export declare class NSXPCInterface extends NSObject {
	static interfaceWithProtocol(protocol: interop.PointerConvertible): NSXPCInterface

	get protocol(): interop.Pointer
	set protocol(value: interop.PointerConvertible)

	setClassesForSelectorArgumentIndexOfReply(
		classes: NSSet,
		sel: string,
		arg: number,
		ofReply: boolean,
	): void

	classesForSelectorArgumentIndexOfReply(sel: string, arg: number, ofReply: boolean): NSSet

	setInterfaceForSelectorArgumentIndexOfReply(
		ifc: NSXPCInterface,
		sel: string,
		arg: number,
		ofReply: boolean,
	): void

	interfaceForSelectorArgumentIndexOfReply(
		sel: string,
		arg: number,
		ofReply: boolean,
	): NSXPCInterface

	setXPCTypeForSelectorArgumentIndexOfReply(
		type: interop.PointerConvertible,
		sel: string,
		arg: number,
		ofReply: boolean,
	): void

	XPCTypeForSelectorArgumentIndexOfReply(
		sel: string,
		arg: number,
		ofReply: boolean,
	): interop.Pointer
}

export declare class NSUserAutomatorTask extends NSUserScriptTask {
	get variables(): NSDictionary
	set variables(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	executeWithInputCompletionHandler(
		input: NSSecureCoding | null,
		handler: (p1: interop.Object, p2: NSError) => void | null,
	): void
}

export declare class NSSortDescriptor extends NSObject implements NSSecureCoding, NSCopying {
	static sortDescriptorWithKeyAscending<This extends abstract new (...args: any) => any>(
		this: This,
		key: string | null,
		ascending: boolean,
	): InstanceType<This>

	static sortDescriptorWithKeyAscendingSelector<This extends abstract new (...args: any) => any>(
		this: This,
		key: string | null,
		ascending: boolean,
		selector: string | null,
	): InstanceType<This>

	initWithKeyAscending(key: string | null, ascending: boolean): this

	initWithKeyAscendingSelector(
		key: string | null,
		ascending: boolean,
		selector: string | null,
	): this

	initWithCoder(coder: NSCoder): this

	readonly key: string

	readonly ascending: boolean

	readonly selector: string

	allowEvaluation(): void

	static sortDescriptorWithKeyAscendingComparator<This extends abstract new (...args: any) => any>(
		this: This,
		key: string | null,
		ascending: boolean,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): InstanceType<This>

	initWithKeyAscendingComparator(
		key: string | null,
		ascending: boolean,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): this

	readonly comparator: (
		p1: interop.Object,
		p2: interop.Object,
	) => interop.Enum<typeof NSComparisonResult>

	compareObjectToObject(
		object1: interop.Object,
		object2: interop.Object,
	): interop.Enum<typeof NSComparisonResult>

	readonly reversedSortDescriptor: interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSFileVersion extends NSObject {
	static currentVersionOfItemAtURL(url: NSURL): NSFileVersion

	static otherVersionsOfItemAtURL(url: NSURL): NSArray

	static unresolvedConflictVersionsOfItemAtURL(url: NSURL): NSArray

	static getNonlocalVersionsOfItemAtURLCompletionHandler(
		url: NSURL,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	static versionOfItemAtURLForPersistentIdentifier(
		url: NSURL,
		persistentIdentifier: interop.Object,
	): NSFileVersion

	static addVersionOfItemAtURLWithContentsOfURLOptionsError(
		url: NSURL,
		contentsURL: NSURL,
		options: interop.Enum<typeof NSFileVersionAddingOptions>,
		outError: interop.PointerConvertible,
	): NSFileVersion

	static temporaryDirectoryURLForNewVersionOfItemAtURL(url: NSURL): NSURL

	readonly URL: NSURL

	readonly localizedName: string

	readonly localizedNameOfSavingComputer: string

	readonly originatorNameComponents: NSPersonNameComponents

	readonly modificationDate: NSDate

	readonly persistentIdentifier: NSCoding

	readonly conflict: boolean

	resolved: boolean

	discardable: boolean

	readonly hasLocalContents: boolean

	readonly hasThumbnail: boolean

	replaceItemAtURLOptionsError(
		url: NSURL,
		options: interop.Enum<typeof NSFileVersionReplacingOptions>,
		error: interop.PointerConvertible,
	): NSURL

	removeAndReturnError(outError: interop.PointerConvertible): boolean

	static removeOtherVersionsOfItemAtURLError(
		url: NSURL,
		outError: interop.PointerConvertible,
	): boolean

	isConflict(): boolean

	isResolved(): boolean

	isDiscardable(): boolean
}

export declare class NSDictionary<KeyType = interop.Object, ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding, NSFastEnumeration, NSFetchRequestResult
{
	readonly count: number

	objectForKey(aKey: KeyType): ObjectType

	keyEnumerator(): NSEnumerator

	init(): this

	initWithObjectsForKeysCount(
		objects: interop.PointerConvertible,
		keys: interop.PointerConvertible,
		cnt: number,
	): this

	initWithCoder(coder: NSCoder): this

	readonly allKeys: NSArray

	allKeysForObject(anObject: ObjectType): NSArray

	readonly allValues: NSArray

	readonly description: string

	readonly descriptionInStringsFileFormat: string

	descriptionWithLocale(locale: interop.Object | null): string

	descriptionWithLocaleIndent(locale: interop.Object | null, level: number): string

	isEqualToDictionary(
		otherDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): boolean

	objectEnumerator(): NSEnumerator

	objectsForKeysNotFoundMarker(
		keys: NSArray<interop.Object> | Array<interop.Object>,
		marker: ObjectType,
	): NSArray

	writeToURLError(url: NSURL, error: interop.PointerConvertible): boolean

	keysSortedByValueUsingSelector(comparator: string): NSArray

	getObjectsAndKeysCount(
		objects: interop.PointerConvertible,
		keys: interop.PointerConvertible,
		count: number,
	): void

	objectForKeyedSubscript(key: KeyType): ObjectType

	enumerateKeysAndObjectsUsingBlock(
		block: (p1: interop.Object, p2: interop.Object, p3: interop.PointerConvertible) => void,
	): void

	enumerateKeysAndObjectsWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: interop.Object, p2: interop.Object, p3: interop.PointerConvertible) => void,
	): void

	keysSortedByValueUsingComparator(
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): NSArray

	keysSortedByValueWithOptionsUsingComparator(
		opts: interop.Enum<typeof NSSortOptions>,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): NSArray

	keysOfEntriesPassingTest(
		predicate: (p1: interop.Object, p2: interop.Object, p3: interop.PointerConvertible) => boolean,
	): NSSet

	keysOfEntriesWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: interop.Object, p3: interop.PointerConvertible) => boolean,
	): NSSet

	getObjectsAndKeys(objects: interop.PointerConvertible, keys: interop.PointerConvertible): void

	static dictionaryWithContentsOfFile<KeyType, ObjectType>(path: string): NSDictionary

	static dictionaryWithContentsOfURL<KeyType, ObjectType>(url: NSURL): NSDictionary

	initWithContentsOfFile(path: string): this

	initWithContentsOfURL(url: NSURL): this

	writeToFileAtomically(path: string, useAuxiliaryFile: boolean): boolean

	writeToURLAtomically(url: NSURL, atomically: boolean): boolean

	static dictionary<KeyType, ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static dictionaryWithObjectForKey<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, object: ObjectType, key: NSCopying): InstanceType<This>

	static dictionaryWithObjectsForKeysCount<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		objects: interop.PointerConvertible,
		keys: interop.PointerConvertible,
		cnt: number,
	): InstanceType<This>

	static dictionaryWithObjectsAndKeys<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, firstObject: interop.Object): InstanceType<This>

	static dictionaryWithDictionary<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): InstanceType<This>

	static dictionaryWithObjectsForKeys<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		objects: NSArray<interop.Object> | Array<interop.Object>,
		keys: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	initWithObjectsAndKeys(firstObject: interop.Object): this

	initWithDictionary(
		otherDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): this

	initWithDictionaryCopyItems(
		otherDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		flag: boolean,
	): this

	initWithObjectsForKeys(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		keys: NSArray<interop.Object> | Array<interop.Object>,
	): this

	initWithContentsOfURLError(url: NSURL, error: interop.PointerConvertible): this

	static dictionaryWithContentsOfURLError<KeyType, ObjectType>(
		url: NSURL,
		error: interop.PointerConvertible,
	): NSDictionary

	static sharedKeySetForKeys<KeyType, ObjectType>(
		keys: NSArray<interop.Object> | Array<interop.Object>,
	): interop.Object

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	fileSize(): number

	fileModificationDate(): NSDate

	fileType(): string

	filePosixPermissions(): number

	fileOwnerAccountName(): string

	fileGroupOwnerAccountName(): string

	fileSystemNumber(): number

	fileSystemFileNumber(): number

	fileExtensionHidden(): boolean

	fileHFSCreatorCode(): number

	fileHFSTypeCode(): number

	fileIsImmutable(): boolean

	fileIsAppendOnly(): boolean

	fileCreationDate(): NSDate

	fileOwnerAccountID(): NSNumber

	fileGroupOwnerAccountID(): NSNumber

	valueForKey(key: string): interop.Object
	valueForKey(key: string): ObjectType

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly debugDescription: string

	readonly [Symbol.iterator]: () => Iterator<any>
}

export declare class NSMetadataQuery extends NSObject {
	delegate: NSMetadataQueryDelegate

	predicate: NSPredicate

	get sortDescriptors(): NSArray
	set sortDescriptors(value: NSArray<interop.Object> | Array<interop.Object>)

	get valueListAttributes(): NSArray
	set valueListAttributes(value: NSArray<interop.Object> | Array<interop.Object>)

	get groupingAttributes(): NSArray
	set groupingAttributes(value: NSArray<interop.Object> | Array<interop.Object>)

	notificationBatchingInterval: number

	get searchScopes(): NSArray
	set searchScopes(value: NSArray<interop.Object> | Array<interop.Object>)

	get searchItems(): NSArray
	set searchItems(value: NSArray<interop.Object> | Array<interop.Object>)

	operationQueue: NSOperationQueue

	startQuery(): boolean

	stopQuery(): void

	readonly started: boolean

	readonly gathering: boolean

	readonly stopped: boolean

	disableUpdates(): void

	enableUpdates(): void

	readonly resultCount: number

	resultAtIndex(idx: number): interop.Object

	enumerateResultsUsingBlock(
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	enumerateResultsWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	readonly results: NSArray

	indexOfResult(result: interop.Object): number

	readonly valueLists: NSDictionary

	readonly groupedResults: NSArray

	valueOfAttributeForResultAtIndex(attrName: string, idx: number): interop.Object

	isStarted(): boolean

	isGathering(): boolean

	isStopped(): boolean
}

export declare class NSDateComponents extends NSObject implements NSCopying, NSSecureCoding {
	calendar: NSCalendar

	timeZone: NSTimeZone

	era: number

	year: number

	month: number

	day: number

	hour: number

	minute: number

	second: number

	nanosecond: number

	weekday: number

	weekdayOrdinal: number

	quarter: number

	weekOfMonth: number

	weekOfYear: number

	yearForWeekOfYear: number

	leapMonth: boolean

	readonly date: NSDate

	week(): number

	setWeek(v: number): void

	setValueForComponent(value: number, unit: interop.Enum<typeof NSCalendarUnit>): void

	valueForComponent(unit: interop.Enum<typeof NSCalendarUnit>): number

	readonly validDate: boolean

	isValidDateInCalendar(calendar: NSCalendar): boolean

	isLeapMonth(): boolean

	isValidDate(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSScriptObjectSpecifier extends NSObject implements NSCoding {
	static objectSpecifierWithDescriptor(descriptor: NSAppleEventDescriptor): NSScriptObjectSpecifier

	initWithContainerSpecifierKey(container: NSScriptObjectSpecifier, property: string): this

	initWithContainerClassDescriptionContainerSpecifierKey(
		classDesc: NSScriptClassDescription,
		container: NSScriptObjectSpecifier | null,
		property: string,
	): this

	initWithCoder(inCoder: NSCoder): this

	childSpecifier: NSScriptObjectSpecifier

	containerSpecifier: NSScriptObjectSpecifier

	containerIsObjectBeingTested: boolean

	containerIsRangeContainerObject: boolean

	key: string

	containerClassDescription: NSScriptClassDescription

	readonly keyClassDescription: NSScriptClassDescription

	indicesOfObjectsByEvaluatingWithContainerCount(
		container: interop.Object,
		count: interop.PointerConvertible,
	): interop.Pointer

	objectsByEvaluatingWithContainers(containers: interop.Object): interop.Object

	readonly objectsByEvaluatingSpecifier: interop.Object

	evaluationErrorNumber: number

	readonly evaluationErrorSpecifier: NSScriptObjectSpecifier

	readonly descriptor: NSAppleEventDescriptor

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSOperation extends NSObject {
	start(): void

	main(): void

	readonly cancelled: boolean

	cancel(): void

	readonly executing: boolean

	readonly finished: boolean

	readonly concurrent: boolean

	readonly asynchronous: boolean

	readonly ready: boolean

	addDependency(op: NSOperation): void

	removeDependency(op: NSOperation): void

	readonly dependencies: NSArray

	queuePriority: interop.Enum<typeof NSOperationQueuePriority>

	completionBlock: () => void

	waitUntilFinished(): void

	threadPriority: number

	qualityOfService: interop.Enum<typeof NSQualityOfService>

	name: string

	isCancelled(): boolean

	isExecuting(): boolean

	isFinished(): boolean

	isConcurrent(): boolean

	isAsynchronous(): boolean

	isReady(): boolean
}

export declare class NSXMLParser extends NSObject {
	initWithContentsOfURL(url: NSURL): this

	initWithData(data: NSData): this

	initWithStream(stream: NSInputStream): this

	delegate: NSXMLParserDelegate

	shouldProcessNamespaces: boolean

	shouldReportNamespacePrefixes: boolean

	externalEntityResolvingPolicy: interop.Enum<typeof NSXMLParserExternalEntityResolvingPolicy>

	allowedExternalEntityURLs: NSSet

	parse(): boolean

	abortParsing(): void

	readonly parserError: NSError

	shouldResolveExternalEntities: boolean

	readonly publicID: string

	readonly systemID: string

	readonly lineNumber: number

	readonly columnNumber: number
}

export declare class NSComparisonPredicate extends NSPredicate {
	static predicateWithLeftExpressionRightExpressionModifierTypeOptions(
		lhs: NSExpression,
		rhs: NSExpression,
		modifier: interop.Enum<typeof NSComparisonPredicateModifier>,
		type: interop.Enum<typeof NSPredicateOperatorType>,
		options: interop.Enum<typeof NSComparisonPredicateOptions>,
	): NSComparisonPredicate

	static predicateWithLeftExpressionRightExpressionCustomSelector(
		lhs: NSExpression,
		rhs: NSExpression,
		selector: string,
	): NSComparisonPredicate

	initWithLeftExpressionRightExpressionModifierTypeOptions(
		lhs: NSExpression,
		rhs: NSExpression,
		modifier: interop.Enum<typeof NSComparisonPredicateModifier>,
		type: interop.Enum<typeof NSPredicateOperatorType>,
		options: interop.Enum<typeof NSComparisonPredicateOptions>,
	): this

	initWithLeftExpressionRightExpressionCustomSelector(
		lhs: NSExpression,
		rhs: NSExpression,
		selector: string,
	): this

	initWithCoder(coder: NSCoder): this

	readonly predicateOperatorType: interop.Enum<typeof NSPredicateOperatorType>

	readonly comparisonPredicateModifier: interop.Enum<typeof NSComparisonPredicateModifier>

	readonly leftExpression: NSExpression

	readonly rightExpression: NSExpression

	readonly customSelector: string

	readonly options: interop.Enum<typeof NSComparisonPredicateOptions>
}

export declare class NSAutoreleasePool extends NSObject {
	static addObject(anObject: interop.Object): void

	addObject(anObject: interop.Object): void

	drain(): void

	static showPools(): void
}

export declare class NSCloneCommand extends NSScriptCommand {
	setReceiversSpecifier(receiversSpecifier: NSScriptObjectSpecifier | null): void
	setReceiversSpecifier(receiversRef: NSScriptObjectSpecifier | null): void

	readonly keySpecifier: NSScriptObjectSpecifier
}

export declare class NSTimeZone extends NSObject implements NSCopying, NSSecureCoding {
	readonly name: string

	readonly data: NSData

	secondsFromGMTForDate(aDate: NSDate): number

	abbreviationForDate(aDate: NSDate): string

	isDaylightSavingTimeForDate(aDate: NSDate): boolean

	daylightSavingTimeOffsetForDate(aDate: NSDate): number

	nextDaylightSavingTimeTransitionAfterDate(aDate: NSDate): NSDate

	static readonly systemTimeZone: NSTimeZone

	static resetSystemTimeZone(): void

	static defaultTimeZone: NSTimeZone

	static readonly localTimeZone: NSTimeZone

	static readonly knownTimeZoneNames: NSArray

	static get abbreviationDictionary(): NSDictionary
	static set abbreviationDictionary(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	static readonly timeZoneDataVersion: string

	readonly secondsFromGMT: number

	readonly abbreviation: string

	readonly daylightSavingTime: boolean

	readonly daylightSavingTimeOffset: number

	readonly nextDaylightSavingTimeTransition: NSDate

	readonly description: string

	isEqualToTimeZone(aTimeZone: NSTimeZone): boolean

	localizedNameLocale(
		style: interop.Enum<typeof NSTimeZoneNameStyle>,
		locale: NSLocale | null,
	): string

	isDaylightSavingTime(): boolean

	static timeZoneWithName<This extends abstract new (...args: any) => any>(
		this: This,
		tzName: string,
	): InstanceType<This>

	static timeZoneWithNameData<This extends abstract new (...args: any) => any>(
		this: This,
		tzName: string,
		aData: NSData | null,
	): InstanceType<This>

	initWithName(tzName: string): this

	initWithNameData(tzName: string, aData: NSData | null): this

	static timeZoneForSecondsFromGMT<This extends abstract new (...args: any) => any>(
		this: This,
		seconds: number,
	): InstanceType<This>

	static timeZoneWithAbbreviation<This extends abstract new (...args: any) => any>(
		this: This,
		abbreviation: string,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSCachedURLResponse extends NSObject implements NSSecureCoding, NSCopying {
	initWithResponseData(response: NSURLResponse, data: NSData): this

	initWithResponseDataUserInfoStoragePolicy(
		response: NSURLResponse,
		data: NSData,
		userInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		storagePolicy: interop.Enum<typeof NSURLCacheStoragePolicy>,
	): this

	readonly response: NSURLResponse

	readonly data: NSData

	readonly userInfo: NSDictionary

	readonly storagePolicy: interop.Enum<typeof NSURLCacheStoragePolicy>

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSXPCListenerEndpoint extends NSObject implements NSSecureCoding {
	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSNotificationCenter extends NSObject {
	static readonly defaultCenter: NSNotificationCenter

	addObserverSelectorNameObject(
		observer: interop.Object,
		aSelector: string,
		aName: string | null,
		anObject: interop.Object | null,
	): void

	postNotification(notification: NSNotification): void

	postNotificationNameObject(aName: string, anObject: interop.Object | null): void

	postNotificationNameObjectUserInfo(
		aName: string,
		anObject: interop.Object | null,
		aUserInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	removeObserver(observer: interop.Object): void

	removeObserverNameObject(
		observer: interop.Object,
		aName: string | null,
		anObject: interop.Object | null,
	): void

	addObserverForNameObjectQueueUsingBlock(
		name: string | null,
		obj: interop.Object | null,
		queue: NSOperationQueue | null,
		block: (p1: NSNotification) => void,
	): NSObject
}

export declare class NSRandomSpecifier extends NSScriptObjectSpecifier {}

export declare class NSDateIntervalFormatter extends NSFormatter {
	locale: NSLocale

	calendar: NSCalendar

	timeZone: NSTimeZone

	dateTemplate: string

	dateStyle: interop.Enum<typeof NSDateIntervalFormatterStyle>

	timeStyle: interop.Enum<typeof NSDateIntervalFormatterStyle>

	stringFromDateToDate(fromDate: NSDate, toDate: NSDate): string

	stringFromDateInterval(dateInterval: NSDateInterval): string
}

export declare class NSUnitInformationStorage extends NSDimension implements NSSecureCoding {
	static readonly bytes: NSUnitInformationStorage

	static readonly bits: NSUnitInformationStorage

	static readonly nibbles: NSUnitInformationStorage

	static readonly yottabytes: NSUnitInformationStorage

	static readonly zettabytes: NSUnitInformationStorage

	static readonly exabytes: NSUnitInformationStorage

	static readonly petabytes: NSUnitInformationStorage

	static readonly terabytes: NSUnitInformationStorage

	static readonly gigabytes: NSUnitInformationStorage

	static readonly megabytes: NSUnitInformationStorage

	static readonly kilobytes: NSUnitInformationStorage

	static readonly yottabits: NSUnitInformationStorage

	static readonly zettabits: NSUnitInformationStorage

	static readonly exabits: NSUnitInformationStorage

	static readonly petabits: NSUnitInformationStorage

	static readonly terabits: NSUnitInformationStorage

	static readonly gigabits: NSUnitInformationStorage

	static readonly megabits: NSUnitInformationStorage

	static readonly kilobits: NSUnitInformationStorage

	static readonly yobibytes: NSUnitInformationStorage

	static readonly zebibytes: NSUnitInformationStorage

	static readonly exbibytes: NSUnitInformationStorage

	static readonly pebibytes: NSUnitInformationStorage

	static readonly tebibytes: NSUnitInformationStorage

	static readonly gibibytes: NSUnitInformationStorage

	static readonly mebibytes: NSUnitInformationStorage

	static readonly kibibytes: NSUnitInformationStorage

	static readonly yobibits: NSUnitInformationStorage

	static readonly zebibits: NSUnitInformationStorage

	static readonly exbibits: NSUnitInformationStorage

	static readonly pebibits: NSUnitInformationStorage

	static readonly tebibits: NSUnitInformationStorage

	static readonly gibibits: NSUnitInformationStorage

	static readonly mebibits: NSUnitInformationStorage

	static readonly kibibits: NSUnitInformationStorage

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSKeyedArchiver extends NSCoder {
	initRequiringSecureCoding(requiresSecureCoding: boolean): this

	static archivedDataWithRootObjectRequiringSecureCodingError(
		object: interop.Object,
		requiresSecureCoding: boolean,
		error: interop.PointerConvertible,
	): NSData

	init(): this

	initForWritingWithMutableData(data: NSMutableData): this

	static archivedDataWithRootObject(rootObject: interop.Object): NSData

	static archiveRootObjectToFile(rootObject: interop.Object, path: string): boolean

	delegate: NSKeyedArchiverDelegate

	outputFormat: interop.Enum<typeof NSPropertyListFormat>

	readonly encodedData: NSData

	finishEncoding(): void

	static setClassNameForClass(codedName: string | null, cls: interop.PointerConvertible): void

	setClassNameForClass(codedName: string | null, cls: interop.PointerConvertible): void

	static classNameForClass(cls: interop.PointerConvertible): string

	classNameForClass(cls: interop.PointerConvertible): string

	encodeObjectForKey(object: interop.Object | null, key: string): void

	encodeConditionalObjectForKey(object: interop.Object | null, key: string): void

	encodeBoolForKey(value: boolean, key: string): void

	encodeIntForKey(value: number, key: string): void

	encodeInt32ForKey(value: number, key: string): void

	encodeInt64ForKey(value: number, key: string): void

	encodeFloatForKey(value: number, key: string): void

	encodeDoubleForKey(value: number, key: string): void

	encodeBytesLengthForKey(bytes: interop.PointerConvertible, length: number, key: string): void

	// @ts-ignore MemberDecl.tsIgnore
	requiresSecureCoding: boolean
}

export declare class NSXPCCoder extends NSCoder {
	encodeXPCObjectForKey(xpcObject: NSObject, key: string): void

	decodeXPCObjectOfTypeForKey(type: interop.PointerConvertible, key: string): NSObject

	userInfo: NSObject

	readonly connection: NSXPCConnection
}

export declare class NSUnitVolume extends NSDimension implements NSSecureCoding {
	static readonly megaliters: NSUnitVolume

	static readonly kiloliters: NSUnitVolume

	static readonly liters: NSUnitVolume

	static readonly deciliters: NSUnitVolume

	static readonly centiliters: NSUnitVolume

	static readonly milliliters: NSUnitVolume

	static readonly cubicKilometers: NSUnitVolume

	static readonly cubicMeters: NSUnitVolume

	static readonly cubicDecimeters: NSUnitVolume

	static readonly cubicCentimeters: NSUnitVolume

	static readonly cubicMillimeters: NSUnitVolume

	static readonly cubicInches: NSUnitVolume

	static readonly cubicFeet: NSUnitVolume

	static readonly cubicYards: NSUnitVolume

	static readonly cubicMiles: NSUnitVolume

	static readonly acreFeet: NSUnitVolume

	static readonly bushels: NSUnitVolume

	static readonly teaspoons: NSUnitVolume

	static readonly tablespoons: NSUnitVolume

	static readonly fluidOunces: NSUnitVolume

	static readonly cups: NSUnitVolume

	static readonly pints: NSUnitVolume

	static readonly quarts: NSUnitVolume

	static readonly gallons: NSUnitVolume

	static readonly imperialTeaspoons: NSUnitVolume

	static readonly imperialTablespoons: NSUnitVolume

	static readonly imperialFluidOunces: NSUnitVolume

	static readonly imperialPints: NSUnitVolume

	static readonly imperialQuarts: NSUnitVolume

	static readonly imperialGallons: NSUnitVolume

	static readonly metricCups: NSUnitVolume

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSRangeSpecifier extends NSScriptObjectSpecifier {
	initWithCoder(inCoder: NSCoder): this

	initWithContainerClassDescriptionContainerSpecifierKeyStartSpecifierEndSpecifier(
		classDesc: NSScriptClassDescription,
		container: NSScriptObjectSpecifier | null,
		property: string,
		startSpec: NSScriptObjectSpecifier | null,
		endSpec: NSScriptObjectSpecifier | null,
	): this

	startSpecifier: NSScriptObjectSpecifier

	endSpecifier: NSScriptObjectSpecifier
}

export declare class NSUnitDuration extends NSDimension implements NSSecureCoding {
	static readonly hours: NSUnitDuration

	static readonly minutes: NSUnitDuration

	static readonly seconds: NSUnitDuration

	static readonly milliseconds: NSUnitDuration

	static readonly microseconds: NSUnitDuration

	static readonly nanoseconds: NSUnitDuration

	static readonly picoseconds: NSUnitDuration

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSDateInterval extends NSObject implements NSCopying, NSSecureCoding {
	readonly startDate: NSDate

	readonly endDate: NSDate

	readonly duration: number

	init(): this

	initWithCoder(coder: NSCoder): this

	initWithStartDateDuration(startDate: NSDate, duration: number): this

	initWithStartDateEndDate(startDate: NSDate, endDate: NSDate): this

	compare(dateInterval: NSDateInterval): interop.Enum<typeof NSComparisonResult>

	isEqualToDateInterval(dateInterval: NSDateInterval): boolean

	intersectsDateInterval(dateInterval: NSDateInterval): boolean

	intersectionWithDateInterval(dateInterval: NSDateInterval): NSDateInterval

	containsDate(date: NSDate): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSIndexPath extends NSObject implements NSCopying, NSSecureCoding {
	static indexPathWithIndex<This extends abstract new (...args: any) => any>(
		this: This,
		index: number,
	): InstanceType<This>

	static indexPathWithIndexesLength<This extends abstract new (...args: any) => any>(
		this: This,
		indexes: interop.PointerConvertible,
		length: number,
	): InstanceType<This>

	initWithIndexesLength(indexes: interop.PointerConvertible, length: number): this

	initWithIndex(index: number): this

	indexPathByAddingIndex(index: number): NSIndexPath

	indexPathByRemovingLastIndex(): NSIndexPath

	indexAtPosition(position: number): number

	readonly length: number

	getIndexesRange(indexes: interop.PointerConvertible, positionRange: _NSRange): void

	compare(otherObject: NSIndexPath): interop.Enum<typeof NSComparisonResult>

	getIndexes(indexes: interop.PointerConvertible): void

	static indexPathForItemInSection(item: number, section: number): NSIndexPath

	readonly item: number

	readonly section: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUniqueIDSpecifier extends NSScriptObjectSpecifier {
	initWithCoder(inCoder: NSCoder): this

	initWithContainerClassDescriptionContainerSpecifierKeyUniqueID(
		classDesc: NSScriptClassDescription,
		container: NSScriptObjectSpecifier | null,
		property: string,
		uniqueID: interop.Object,
	): this

	uniqueID: interop.Object
}

export declare class NSProcessInfo extends NSObject {
	static readonly processInfo: NSProcessInfo

	readonly environment: NSDictionary

	readonly arguments$: NSArray

	readonly hostName: string

	processName: string

	readonly processIdentifier: number

	readonly globallyUniqueString: string

	operatingSystem(): number

	operatingSystemName(): string

	readonly operatingSystemVersionString: string

	readonly operatingSystemVersion: NSOperatingSystemVersion

	readonly processorCount: number

	readonly activeProcessorCount: number

	readonly physicalMemory: number

	isOperatingSystemAtLeastVersion(version: NSOperatingSystemVersion): boolean

	readonly systemUptime: number

	disableSuddenTermination(): void

	enableSuddenTermination(): void

	disableAutomaticTermination(reason: string): void

	enableAutomaticTermination(reason: string): void

	automaticTerminationSupportEnabled: boolean

	arguments(): NSArray

	beginActivityWithOptionsReason(
		options: interop.Enum<typeof NSActivityOptions>,
		reason: string,
	): NSObject

	endActivity(activity: NSObject): void

	performActivityWithOptionsReasonUsingBlock(
		options: interop.Enum<typeof NSActivityOptions>,
		reason: string,
		block: () => void,
	): void

	readonly userName: string

	readonly fullUserName: string

	readonly thermalState: interop.Enum<typeof NSProcessInfoThermalState>

	readonly macCatalystApp: boolean

	readonly iOSAppOnMac: boolean

	isMacCatalystApp(): boolean

	isiOSAppOnMac(): boolean
}

export declare class NSFormatter extends NSObject implements NSCopying, NSCoding {
	stringForObjectValue(obj: interop.Object | null): string

	attributedStringForObjectValueWithDefaultAttributes(
		obj: interop.Object,
		attrs:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSAttributedString

	editingStringForObjectValue(obj: interop.Object): string

	getObjectValueForStringErrorDescription(
		obj: interop.PointerConvertible,
		string: string,
		error: interop.PointerConvertible,
	): boolean

	isPartialStringValidNewEditingStringErrorDescription(
		partialString: string,
		newString: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	isPartialStringValidProposedSelectedRangeOriginalStringOriginalSelectedRangeErrorDescription(
		partialStringPtr: interop.PointerConvertible,
		proposedSelRangePtr: interop.PointerConvertible,
		origString: string,
		origSelRange: _NSRange,
		error: interop.PointerConvertible,
	): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUnitDispersion extends NSDimension implements NSSecureCoding {
	static readonly partsPerMillion: NSUnitDispersion

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSIndexSpecifier extends NSScriptObjectSpecifier {
	initWithContainerClassDescriptionContainerSpecifierKeyIndex(
		classDesc: NSScriptClassDescription,
		container: NSScriptObjectSpecifier | null,
		property: string,
		index: number,
	): this

	index: number
}

export declare class NSUnitSpeed extends NSDimension implements NSSecureCoding {
	static readonly metersPerSecond: NSUnitSpeed

	static readonly kilometersPerHour: NSUnitSpeed

	static readonly milesPerHour: NSUnitSpeed

	static readonly knots: NSUnitSpeed

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSCache<
	KeyType = interop.Object,
	ObjectType = interop.Object,
> extends NSObject {
	name: string

	delegate: NSCacheDelegate

	objectForKey(key: KeyType): ObjectType

	setObjectForKey(obj: ObjectType, key: KeyType): void

	setObjectForKeyCost(obj: ObjectType, key: KeyType, g: number): void

	removeObjectForKey(key: KeyType): void

	removeAllObjects(): void

	totalCostLimit: number

	countLimit: number

	evictsObjectsWithDiscardedContent: boolean
}

export declare class NSOutputStream extends NSStream {
	writeMaxLength(buffer: interop.PointerConvertible, len: number): number

	readonly hasSpaceAvailable: boolean

	initToMemory(): this

	initToBufferCapacity(buffer: interop.PointerConvertible, capacity: number): this

	initWithURLAppend(url: NSURL, shouldAppend: boolean): this

	initToFileAtPathAppend(path: string, shouldAppend: boolean): this

	static outputStreamToMemory<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static outputStreamToBufferCapacity<This extends abstract new (...args: any) => any>(
		this: This,
		buffer: interop.PointerConvertible,
		capacity: number,
	): InstanceType<This>

	static outputStreamToFileAtPathAppend<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
		shouldAppend: boolean,
	): InstanceType<This>

	static outputStreamWithURLAppend<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		shouldAppend: boolean,
	): InstanceType<This>
}

export declare class NSOrderedSet<ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding, NSFastEnumeration
{
	readonly count: number

	objectAtIndex(idx: number): ObjectType

	indexOfObject(object: ObjectType): number

	init(): this

	initWithObjectsCount(objects: interop.PointerConvertible, cnt: number): this

	initWithCoder(coder: NSCoder): this

	getObjectsRange(objects: interop.PointerConvertible, range: _NSRange): void

	objectsAtIndexes(indexes: NSIndexSet): NSArray

	readonly firstObject: ObjectType

	readonly lastObject: ObjectType

	isEqualToOrderedSet(other: NSOrderedSet): boolean

	containsObject(object: ObjectType): boolean

	intersectsOrderedSet(other: NSOrderedSet): boolean

	intersectsSet(set: NSSet): boolean

	isSubsetOfOrderedSet(other: NSOrderedSet): boolean

	isSubsetOfSet(set: NSSet): boolean

	objectAtIndexedSubscript(idx: number): ObjectType

	objectEnumerator(): NSEnumerator

	reverseObjectEnumerator(): NSEnumerator

	readonly reversedOrderedSet: NSOrderedSet

	readonly array: NSArray

	readonly set: NSSet

	enumerateObjectsUsingBlock(
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	enumerateObjectsWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	enumerateObjectsAtIndexesOptionsUsingBlock(
		s: NSIndexSet,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	indexOfObjectPassingTest(
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): number

	indexOfObjectWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): number

	indexOfObjectAtIndexesOptionsPassingTest(
		s: NSIndexSet,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): number

	indexesOfObjectsPassingTest(
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): NSIndexSet

	indexesOfObjectsWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): NSIndexSet

	indexesOfObjectsAtIndexesOptionsPassingTest(
		s: NSIndexSet,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): NSIndexSet

	indexOfObjectInSortedRangeOptionsUsingComparator(
		object: ObjectType,
		range: _NSRange,
		opts: interop.Enum<typeof NSBinarySearchingOptions>,
		cmp: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): number

	sortedArrayUsingComparator(
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): NSArray

	sortedArrayWithOptionsUsingComparator(
		opts: interop.Enum<typeof NSSortOptions>,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): NSArray

	readonly description: string

	descriptionWithLocale(locale: interop.Object | null): string

	descriptionWithLocaleIndent(locale: interop.Object | null, level: number): string

	static orderedSet<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static orderedSetWithObject<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		object: ObjectType,
	): InstanceType<This>

	static orderedSetWithObjectsCount<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		objects: interop.PointerConvertible,
		cnt: number,
	): InstanceType<This>

	static orderedSetWithObjects<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		firstObj: ObjectType,
	): InstanceType<This>

	static orderedSetWithOrderedSet<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		set: NSOrderedSet,
	): InstanceType<This>

	static orderedSetWithOrderedSetRangeCopyItems<
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, set: NSOrderedSet, range: _NSRange, flag: boolean): InstanceType<This>

	static orderedSetWithArray<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		array: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static orderedSetWithArrayRangeCopyItems<
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		array: NSArray<interop.Object> | Array<interop.Object>,
		range: _NSRange,
		flag: boolean,
	): InstanceType<This>

	static orderedSetWithSet<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		set: NSSet,
	): InstanceType<This>

	static orderedSetWithSetCopyItems<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		set: NSSet,
		flag: boolean,
	): InstanceType<This>

	initWithObject(object: ObjectType): this

	initWithObjects(firstObj: ObjectType): this

	initWithOrderedSet(set: NSOrderedSet): this

	initWithOrderedSetCopyItems(set: NSOrderedSet, flag: boolean): this

	initWithOrderedSetRangeCopyItems(set: NSOrderedSet, range: _NSRange, flag: boolean): this

	initWithArray(array: NSArray<interop.Object> | Array<interop.Object>): this

	initWithArrayCopyItems(set: NSArray<interop.Object> | Array<interop.Object>, flag: boolean): this

	initWithArrayRangeCopyItems(
		set: NSArray<interop.Object> | Array<interop.Object>,
		range: _NSRange,
		flag: boolean,
	): this

	initWithSet(set: NSSet): this

	initWithSetCopyItems(set: NSSet, flag: boolean): this

	differenceFromOrderedSetWithOptionsUsingEquivalenceTest(
		other: NSOrderedSet,
		options: interop.Enum<typeof NSOrderedCollectionDifferenceCalculationOptions>,
		block: (p1: interop.Object, p2: interop.Object) => boolean,
	): NSOrderedCollectionDifference

	differenceFromOrderedSetWithOptions(
		other: NSOrderedSet,
		options: interop.Enum<typeof NSOrderedCollectionDifferenceCalculationOptions>,
	): NSOrderedCollectionDifference

	differenceFromOrderedSet(other: NSOrderedSet): NSOrderedCollectionDifference

	orderedSetByApplyingDifference(difference: NSOrderedCollectionDifference): NSOrderedSet

	valueForKey(key: string): interop.Object

	setValueForKey(value: interop.Object | null, key: string): void

	addObserverForKeyPathOptionsContext(
		observer: NSObject,
		keyPath: string,
		options: interop.Enum<typeof NSKeyValueObservingOptions>,
		context: interop.PointerConvertible,
	): void

	removeObserverForKeyPathContext(
		observer: NSObject,
		keyPath: string,
		context: interop.PointerConvertible,
	): void

	removeObserverForKeyPath(observer: NSObject, keyPath: string): void

	sortedArrayUsingDescriptors(
		sortDescriptors: NSArray<interop.Object> | Array<interop.Object>,
	): NSArray

	filteredOrderedSetUsingPredicate(p: NSPredicate): NSOrderedSet

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<ObjectType>
}

export declare class NSPredicate extends NSObject implements NSSecureCoding, NSCopying {
	static predicateWithFormatArgumentArray(
		predicateFormat: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSPredicate

	static predicateWithFormat(predicateFormat: string): NSPredicate

	static predicateWithFormatArguments(predicateFormat: string, argList: string): NSPredicate

	static predicateFromMetadataQueryString(queryString: string): NSPredicate

	static predicateWithValue(value: boolean): NSPredicate

	static predicateWithBlock(
		block: (
			p1: interop.Object,
			p2: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		) => boolean | null,
	): NSPredicate

	readonly predicateFormat: string

	predicateWithSubstitutionVariables(
		variables:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): this

	evaluateWithObject(object: interop.Object | null): boolean

	evaluateWithObjectSubstitutionVariables(
		object: interop.Object | null,
		bindings:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): boolean

	allowEvaluation(): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSSetCommand extends NSScriptCommand {
	setReceiversSpecifier(receiversSpecifier: NSScriptObjectSpecifier | null): void
	setReceiversSpecifier(receiversRef: NSScriptObjectSpecifier | null): void

	readonly keySpecifier: NSScriptObjectSpecifier
}

export declare class NSUnitPower extends NSDimension implements NSSecureCoding {
	static readonly terawatts: NSUnitPower

	static readonly gigawatts: NSUnitPower

	static readonly megawatts: NSUnitPower

	static readonly kilowatts: NSUnitPower

	static readonly watts: NSUnitPower

	static readonly milliwatts: NSUnitPower

	static readonly microwatts: NSUnitPower

	static readonly nanowatts: NSUnitPower

	static readonly picowatts: NSUnitPower

	static readonly femtowatts: NSUnitPower

	static readonly horsepower: NSUnitPower

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUserUnixTask extends NSUserScriptTask {
	standardInput: NSFileHandle

	standardOutput: NSFileHandle

	standardError: NSFileHandle

	executeWithArgumentsCompletionHandler(
		arguments$: NSArray<interop.Object> | Array<interop.Object> | null,
		handler: (p1: NSError) => void | null,
	): void
}

export declare class NSClassDescription extends NSObject {
	static registerClassDescriptionForClass(
		description: NSClassDescription,
		aClass: interop.PointerConvertible,
	): void

	static invalidateClassDescriptionCache(): void

	static classDescriptionForClass(aClass: interop.PointerConvertible): NSClassDescription

	readonly attributeKeys: NSArray

	readonly toOneRelationshipKeys: NSArray

	readonly toManyRelationshipKeys: NSArray

	inverseForRelationshipKey(relationshipKey: string): string
}

export declare class NSSecureUnarchiveFromDataTransformer extends NSValueTransformer {
	static readonly allowedTopLevelClasses: NSArray
}

export declare class NSMetadataQueryResultGroup extends NSObject {
	readonly attribute: string

	readonly value: interop.Object

	readonly subgroups: NSArray

	readonly resultCount: number

	resultAtIndex(idx: number): interop.Object

	readonly results: NSArray
}

export declare class NSUnitEnergy extends NSDimension implements NSSecureCoding {
	static readonly kilojoules: NSUnitEnergy

	static readonly joules: NSUnitEnergy

	static readonly kilocalories: NSUnitEnergy

	static readonly calories: NSUnitEnergy

	static readonly kilowattHours: NSUnitEnergy

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSMetadataQueryAttributeValueTuple extends NSObject {
	readonly attribute: string

	readonly value: interop.Object

	readonly count: number
}

export declare class NSXMLDTDNode extends NSXMLNode {
	initWithXMLString(string: string): this

	initWithKindOptions(
		kind: interop.Enum<typeof NSXMLNodeKind>,
		options: interop.Enum<typeof NSXMLNodeOptions>,
	): this

	init(): this

	DTDKind: interop.Enum<typeof NSXMLDTDNodeKind>

	readonly external: boolean

	publicID: string

	systemID: string

	notationName: string

	isExternal(): boolean
}

export declare class NSNull extends NSObject implements NSCopying, NSSecureCoding, CAAction {
	static null(): NSNull

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	runActionForKeyObjectArguments(
		event: string,
		anObject: interop.Object,
		dict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void
}

export declare class NSCountCommand extends NSScriptCommand {}

export declare class NSItemProvider extends NSObject implements NSCopying {
	init(): this

	registerDataRepresentationForTypeIdentifierVisibilityLoadHandler(
		typeIdentifier: string,
		visibility: interop.Enum<typeof NSItemProviderRepresentationVisibility>,
		loadHandler: (p1: (p1: NSData, p2: NSError) => void) => NSProgress | null,
	): void

	registerFileRepresentationForTypeIdentifierFileOptionsVisibilityLoadHandler(
		typeIdentifier: string,
		fileOptions: interop.Enum<typeof NSItemProviderFileOptions>,
		visibility: interop.Enum<typeof NSItemProviderRepresentationVisibility>,
		loadHandler: (p1: (p1: NSURL, p2: boolean, p3: NSError) => void) => NSProgress | null,
	): void

	readonly registeredTypeIdentifiers: NSArray

	registeredTypeIdentifiersWithFileOptions(
		fileOptions: interop.Enum<typeof NSItemProviderFileOptions>,
	): NSArray

	hasItemConformingToTypeIdentifier(typeIdentifier: string): boolean

	hasRepresentationConformingToTypeIdentifierFileOptions(
		typeIdentifier: string,
		fileOptions: interop.Enum<typeof NSItemProviderFileOptions>,
	): boolean

	loadDataRepresentationForTypeIdentifierCompletionHandler(
		typeIdentifier: string,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): NSProgress

	loadFileRepresentationForTypeIdentifierCompletionHandler(
		typeIdentifier: string,
		completionHandler: (p1: NSURL, p2: NSError) => void | null,
	): NSProgress

	loadInPlaceFileRepresentationForTypeIdentifierCompletionHandler(
		typeIdentifier: string,
		completionHandler: (p1: NSURL, p2: boolean, p3: NSError) => void | null,
	): NSProgress

	suggestedName: string

	initWithObject(object: NSItemProviderWriting): this

	registerObjectVisibility(
		object: NSItemProviderWriting,
		visibility: interop.Enum<typeof NSItemProviderRepresentationVisibility>,
	): void

	registerObjectOfClassVisibilityLoadHandler(
		aClass: NSItemProviderWriting,
		visibility: interop.Enum<typeof NSItemProviderRepresentationVisibility>,
		loadHandler: (p1: (p1: NSItemProviderWriting, p2: NSError) => void) => NSProgress | null,
	): void

	canLoadObjectOfClass(aClass: NSItemProviderReading): boolean

	loadObjectOfClassCompletionHandler(
		aClass: NSItemProviderReading,
		completionHandler: (p1: NSItemProviderReading, p2: NSError) => void | null,
	): NSProgress

	initWithItemTypeIdentifier(item: NSSecureCoding | null, typeIdentifier: string | null): this

	initWithContentsOfURL(fileURL: NSURL): this

	registerItemForTypeIdentifierLoadHandler(
		typeIdentifier: string,
		loadHandler: (
			p1: (p1: NSSecureCoding, p2: NSError) => void,
			p2: interop.PointerConvertible,
			p3: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		) => void,
	): void

	loadItemForTypeIdentifierOptionsCompletionHandler(
		typeIdentifier: string,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		completionHandler: (p1: NSSecureCoding, p2: NSError) => void | null,
	): void

	previewImageHandler: (
		p1: (p1: NSSecureCoding, p2: NSError) => void,
		p2: interop.PointerConvertible,
		p3: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	) => void

	loadPreviewImageWithOptionsCompletionHandler(
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: NSSecureCoding, p2: NSError) => void,
	): void

	registerCloudKitShareWithPreparationHandler(
		preparationHandler: (p1: (p1: CKShare, p2: CKContainer, p3: NSError) => void) => void | null,
	): void

	registerCloudKitShareContainer(share: CKShare, container: CKContainer): void

	readonly sourceFrame: CGRect

	readonly containerFrame: CGRect

	readonly preferredPresentationSize: CGSize

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSDecimalNumber extends NSNumber {
	initWithMantissaExponentIsNegative(mantissa: number, exponent: number, flag: boolean): this

	initWithDecimal(dcm: NSDecimal): this

	initWithString(numberValue: string | null): this

	initWithStringLocale(numberValue: string | null, locale: interop.Object | null): this

	descriptionWithLocale(locale: interop.Object | null): string

	readonly decimalValue: NSDecimal

	static decimalNumberWithMantissaExponentIsNegative(
		mantissa: number,
		exponent: number,
		flag: boolean,
	): NSDecimalNumber

	static decimalNumberWithDecimal(dcm: NSDecimal): NSDecimalNumber

	static decimalNumberWithString(numberValue: string | null): NSDecimalNumber

	static decimalNumberWithStringLocale(
		numberValue: string | null,
		locale: interop.Object | null,
	): NSDecimalNumber

	static readonly zero: NSDecimalNumber

	static readonly one: NSDecimalNumber

	static readonly minimumDecimalNumber: NSDecimalNumber

	static readonly maximumDecimalNumber: NSDecimalNumber

	static readonly notANumber: NSDecimalNumber

	decimalNumberByAdding(decimalNumber: NSDecimalNumber): NSDecimalNumber

	decimalNumberByAddingWithBehavior(
		decimalNumber: NSDecimalNumber,
		behavior: NSDecimalNumberBehaviors | null,
	): NSDecimalNumber

	decimalNumberBySubtracting(decimalNumber: NSDecimalNumber): NSDecimalNumber

	decimalNumberBySubtractingWithBehavior(
		decimalNumber: NSDecimalNumber,
		behavior: NSDecimalNumberBehaviors | null,
	): NSDecimalNumber

	decimalNumberByMultiplyingBy(decimalNumber: NSDecimalNumber): NSDecimalNumber

	decimalNumberByMultiplyingByWithBehavior(
		decimalNumber: NSDecimalNumber,
		behavior: NSDecimalNumberBehaviors | null,
	): NSDecimalNumber

	decimalNumberByDividingBy(decimalNumber: NSDecimalNumber): NSDecimalNumber

	decimalNumberByDividingByWithBehavior(
		decimalNumber: NSDecimalNumber,
		behavior: NSDecimalNumberBehaviors | null,
	): NSDecimalNumber

	decimalNumberByRaisingToPower(power: number): NSDecimalNumber

	decimalNumberByRaisingToPowerWithBehavior(
		power: number,
		behavior: NSDecimalNumberBehaviors | null,
	): NSDecimalNumber

	decimalNumberByMultiplyingByPowerOf10(power: number): NSDecimalNumber

	decimalNumberByMultiplyingByPowerOf10WithBehavior(
		power: number,
		behavior: NSDecimalNumberBehaviors | null,
	): NSDecimalNumber

	decimalNumberByRoundingAccordingToBehavior(
		behavior: NSDecimalNumberBehaviors | null,
	): NSDecimalNumber

	compare(otherNumber: NSNumber): interop.Enum<typeof NSComparisonResult>
	compare(decimalNumber: NSNumber): interop.Enum<typeof NSComparisonResult>

	static defaultBehavior: NSDecimalNumberBehaviors

	readonly objCType: string

	readonly doubleValue: number
}

export declare class NSNameSpecifier extends NSScriptObjectSpecifier {
	initWithCoder(inCoder: NSCoder): this

	initWithContainerClassDescriptionContainerSpecifierKeyName(
		classDesc: NSScriptClassDescription,
		container: NSScriptObjectSpecifier | null,
		property: string,
		name: string,
	): this

	name: string
}

export declare class NSURLProtectionSpace extends NSObject implements NSSecureCoding, NSCopying {
	initWithHostPortProtocolRealmAuthenticationMethod(
		host: string,
		port: number,
		protocol: string | null,
		realm: string | null,
		authenticationMethod: string | null,
	): this

	initWithProxyHostPortTypeRealmAuthenticationMethod(
		host: string,
		port: number,
		type: string | null,
		realm: string | null,
		authenticationMethod: string | null,
	): this

	readonly realm: string

	readonly receivesCredentialSecurely: boolean

	readonly isProxy: boolean

	readonly host: string

	readonly port: number

	readonly proxyType: string

	readonly protocol: string

	readonly authenticationMethod: string

	readonly distinguishedNames: NSArray

	readonly serverTrust: interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSOrderedCollectionDifference<ObjectType = interop.Object>
	extends NSObject
	implements NSFastEnumeration
{
	initWithChanges(changes: NSArray<interop.Object> | Array<interop.Object>): this

	initWithInsertIndexesInsertedObjectsRemoveIndexesRemovedObjectsAdditionalChanges(
		inserts: NSIndexSet,
		insertedObjects: NSArray<interop.Object> | Array<interop.Object> | null,
		removes: NSIndexSet,
		removedObjects: NSArray<interop.Object> | Array<interop.Object> | null,
		changes: NSArray<interop.Object> | Array<interop.Object>,
	): this

	initWithInsertIndexesInsertedObjectsRemoveIndexesRemovedObjects(
		inserts: NSIndexSet,
		insertedObjects: NSArray<interop.Object> | Array<interop.Object> | null,
		removes: NSIndexSet,
		removedObjects: NSArray<interop.Object> | Array<interop.Object> | null,
	): this

	readonly insertions: NSArray

	readonly removals: NSArray

	readonly hasChanges: boolean

	differenceByTransformingChangesWithBlock(
		block: (p1: NSOrderedCollectionChange) => NSOrderedCollectionChange,
	): NSOrderedCollectionDifference

	inverseDifference(): this

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<ObjectType>
}

export declare class NSExpression extends NSObject implements NSSecureCoding, NSCopying {
	static expressionWithFormatArgumentArray(
		expressionFormat: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
	): NSExpression

	static expressionWithFormat(expressionFormat: string): NSExpression

	static expressionWithFormatArguments(expressionFormat: string, argList: string): NSExpression

	static expressionForConstantValue(obj: interop.Object | null): NSExpression

	static expressionForEvaluatedObject(): NSExpression

	static expressionForVariable(string: string): NSExpression

	static expressionForKeyPath(keyPath: string): NSExpression

	static expressionForFunctionArguments(
		name: string,
		parameters: NSArray<interop.Object> | Array<interop.Object>,
	): NSExpression

	static expressionForAggregate(
		subexpressions: NSArray<interop.Object> | Array<interop.Object>,
	): NSExpression

	static expressionForUnionSetWith(left: NSExpression, right: NSExpression): NSExpression

	static expressionForIntersectSetWith(left: NSExpression, right: NSExpression): NSExpression

	static expressionForMinusSetWith(left: NSExpression, right: NSExpression): NSExpression

	static expressionForSubqueryUsingIteratorVariablePredicate(
		expression: NSExpression,
		variable: string,
		predicate: NSPredicate,
	): NSExpression

	static expressionForFunctionSelectorNameArguments(
		target: NSExpression,
		name: string,
		parameters: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSExpression

	static expressionForAnyKey(): NSExpression

	static expressionForBlockArguments(
		block: (
			p1: interop.Object,
			p2: NSArray<interop.Object> | Array<interop.Object>,
			p3: NSMutableDictionary,
		) => interop.Object | null,
		arguments$: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSExpression

	static expressionForConditionalTrueExpressionFalseExpression(
		predicate: NSPredicate,
		trueExpression: NSExpression,
		falseExpression: NSExpression,
	): NSExpression

	initWithExpressionType(type: interop.Enum<typeof NSExpressionType>): this

	initWithCoder(coder: NSCoder): this

	readonly expressionType: interop.Enum<typeof NSExpressionType>

	readonly constantValue: interop.Object

	readonly keyPath: string

	readonly function$: string

	readonly variable: string

	readonly operand: NSExpression

	readonly arguments$: NSArray

	readonly collection: interop.Object

	readonly predicate: NSPredicate

	readonly leftExpression: NSExpression

	readonly rightExpression: NSExpression

	readonly trueExpression: NSExpression

	readonly falseExpression: NSExpression

	readonly expressionBlock: (
		p1: interop.Object,
		p2: NSArray<interop.Object> | Array<interop.Object>,
		p3: NSMutableDictionary,
	) => interop.Object | null

	expressionValueWithObjectContext(
		object: interop.Object | null,
		context: NSMutableDictionary | null,
	): interop.Object

	allowEvaluation(): void

	function(): string

	arguments(): NSArray | null

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSHTTPURLResponse extends NSURLResponse {
	initWithURLStatusCodeHTTPVersionHeaderFields(
		url: NSURL,
		statusCode: number,
		HTTPVersion: string | null,
		headerFields:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	readonly statusCode: number

	readonly allHeaderFields: NSDictionary

	valueForHTTPHeaderField(field: string): string

	static localizedStringForStatusCode(statusCode: number): string
}

export declare class NSDistantObject extends NSProxy implements NSCoding {
	static proxyWithTargetConnection(target: interop.Object, connection: NSConnection): interop.Object

	initWithTargetConnection(target: interop.Object, connection: NSConnection): this

	static proxyWithLocalConnection(target: interop.Object, connection: NSConnection): interop.Object

	initWithLocalConnection(target: interop.Object, connection: NSConnection): this

	initWithCoder(inCoder: NSCoder): this

	setProtocolForProxy(proto: interop.PointerConvertible): void

	readonly connectionForProxy: NSConnection

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSSet<ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding, NSFastEnumeration
{
	readonly count: number

	member(object: ObjectType): ObjectType

	objectEnumerator(): NSEnumerator

	init(): this

	initWithObjectsCount(objects: interop.PointerConvertible, cnt: number): this

	initWithCoder(coder: NSCoder): this

	readonly allObjects: NSArray

	anyObject(): ObjectType

	containsObject(anObject: ObjectType): boolean

	readonly description: string

	descriptionWithLocale(locale: interop.Object | null): string

	intersectsSet(otherSet: NSSet): boolean

	isEqualToSet(otherSet: NSSet): boolean

	isSubsetOfSet(otherSet: NSSet): boolean

	makeObjectsPerformSelector(aSelector: string): void

	makeObjectsPerformSelectorWithObject(aSelector: string, argument: interop.Object | null): void

	setByAddingObject(anObject: ObjectType): NSSet

	setByAddingObjectsFromSet(other: NSSet): NSSet

	setByAddingObjectsFromArray(other: NSArray<interop.Object> | Array<interop.Object>): NSSet

	enumerateObjectsUsingBlock(
		block: (p1: interop.Object, p2: interop.PointerConvertible) => void,
	): void

	enumerateObjectsWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: interop.Object, p2: interop.PointerConvertible) => void,
	): void

	objectsPassingTest(
		predicate: (p1: interop.Object, p2: interop.PointerConvertible) => boolean,
	): NSSet

	objectsWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: interop.PointerConvertible) => boolean,
	): NSSet

	static set<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static setWithObject<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		object: ObjectType,
	): InstanceType<This>

	static setWithObjectsCount<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		objects: interop.PointerConvertible,
		cnt: number,
	): InstanceType<This>

	static setWithObjects<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		firstObj: ObjectType,
	): InstanceType<This>

	static setWithSet<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		set: NSSet,
	): InstanceType<This>

	static setWithArray<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		array: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	initWithObjects(firstObj: ObjectType): this

	initWithSet(set: NSSet): this

	initWithSetCopyItems(set: NSSet, flag: boolean): this

	initWithArray(array: NSArray<interop.Object> | Array<interop.Object>): this

	valueForKey(key: string): interop.Object

	setValueForKey(value: interop.Object | null, key: string): void

	addObserverForKeyPathOptionsContext(
		observer: NSObject,
		keyPath: string,
		options: interop.Enum<typeof NSKeyValueObservingOptions>,
		context: interop.PointerConvertible,
	): void

	removeObserverForKeyPathContext(
		observer: NSObject,
		keyPath: string,
		context: interop.PointerConvertible,
	): void

	removeObserverForKeyPath(observer: NSObject, keyPath: string): void

	sortedArrayUsingDescriptors(
		sortDescriptors: NSArray<interop.Object> | Array<interop.Object>,
	): NSArray

	filteredSetUsingPredicate(predicate: NSPredicate): NSSet

	static setWithCollectionViewIndexPath<
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, indexPath: NSIndexPath): InstanceType<This>

	static setWithCollectionViewIndexPaths<
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, indexPaths: NSArray<interop.Object> | Array<interop.Object>): InstanceType<This>

	enumerateIndexPathsWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: NSIndexPath, p2: interop.PointerConvertible) => void,
	): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<ObjectType>
}

export declare class NSXPCConnection extends NSObject implements NSXPCProxyCreating {
	initWithServiceName(serviceName: string): this

	readonly serviceName: string

	initWithMachServiceNameOptions(
		name: string,
		options: interop.Enum<typeof NSXPCConnectionOptions>,
	): this

	initWithListenerEndpoint(endpoint: NSXPCListenerEndpoint): this

	readonly endpoint: NSXPCListenerEndpoint

	exportedInterface: NSXPCInterface

	exportedObject: interop.Object

	remoteObjectInterface: NSXPCInterface

	readonly remoteObjectProxy: interop.Object

	remoteObjectProxyWithErrorHandler(handler: (p1: NSError) => void): interop.Object

	synchronousRemoteObjectProxyWithErrorHandler(handler: (p1: NSError) => void): interop.Object

	interruptionHandler: () => void

	invalidationHandler: () => void

	resume(): void

	suspend(): void

	activate(): void

	invalidate(): void

	readonly auditSessionIdentifier: number

	readonly processIdentifier: number

	readonly effectiveUserIdentifier: number

	readonly effectiveGroupIdentifier: number

	static currentConnection(): NSXPCConnection

	scheduleSendBarrierBlock(block: () => void): void
}

export declare class NSNetService extends NSObject {
	initWithDomainTypeNamePort(domain: string, type: string, name: string, port: number): this

	initWithDomainTypeName(domain: string, type: string, name: string): this

	scheduleInRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	removeFromRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	delegate: NSNetServiceDelegate

	includesPeerToPeer: boolean

	readonly name: string

	readonly type: string

	readonly domain: string

	readonly hostName: string

	readonly addresses: NSArray

	readonly port: number

	publish(): void

	publishWithOptions(options: interop.Enum<typeof NSNetServiceOptions>): void

	resolve(): void

	stop(): void

	static dictionaryFromTXTRecordData(txtData: NSData): NSDictionary

	static dataFromTXTRecordDictionary(
		txtDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): NSData

	resolveWithTimeout(timeout: number): void

	getInputStreamOutputStream(
		inputStream: interop.PointerConvertible,
		outputStream: interop.PointerConvertible,
	): boolean

	setTXTRecordData(recordData: NSData | null): boolean

	TXTRecordData(): NSData

	startMonitoring(): void

	stopMonitoring(): void
}

export declare class NSScriptCommandDescription extends NSObject implements NSCoding {
	initWithSuiteNameCommandNameDictionary(
		suiteName: string,
		commandName: string,
		commandDeclaration:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	initWithCoder(inCoder: NSCoder): this

	readonly suiteName: string

	readonly commandName: string

	readonly appleEventClassCode: number

	readonly appleEventCode: number

	readonly commandClassName: string

	readonly returnType: string

	readonly appleEventCodeForReturnType: number

	readonly argumentNames: NSArray

	typeForArgumentWithName(argumentName: string): string

	appleEventCodeForArgumentWithName(argumentName: string): number

	isOptionalArgumentWithName(argumentName: string): boolean

	createCommandInstance(): NSScriptCommand

	createCommandInstanceWithZone(zone: interop.PointerConvertible): NSScriptCommand

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSAppleScript extends NSObject implements NSCopying {
	initWithContentsOfURLError(url: NSURL, errorInfo: interop.PointerConvertible): this

	initWithSource(source: string): this

	readonly source: string

	readonly compiled: boolean

	compileAndReturnError(errorInfo: interop.PointerConvertible): boolean

	executeAndReturnError(errorInfo: interop.PointerConvertible): NSAppleEventDescriptor

	executeAppleEventError(
		event: NSAppleEventDescriptor,
		errorInfo: interop.PointerConvertible,
	): NSAppleEventDescriptor

	isCompiled(): boolean

	readonly richTextSource: NSAttributedString

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSURLCredentialStorage extends NSObject {
	static readonly sharedCredentialStorage: NSURLCredentialStorage

	credentialsForProtectionSpace(space: NSURLProtectionSpace): NSDictionary

	readonly allCredentials: NSDictionary

	setCredentialForProtectionSpace(credential: NSURLCredential, space: NSURLProtectionSpace): void

	removeCredentialForProtectionSpace(credential: NSURLCredential, space: NSURLProtectionSpace): void

	removeCredentialForProtectionSpaceOptions(
		credential: NSURLCredential,
		space: NSURLProtectionSpace,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	defaultCredentialForProtectionSpace(space: NSURLProtectionSpace): NSURLCredential

	setDefaultCredentialForProtectionSpace(
		credential: NSURLCredential,
		space: NSURLProtectionSpace,
	): void

	getCredentialsForProtectionSpaceTaskCompletionHandler(
		protectionSpace: NSURLProtectionSpace,
		task: NSURLSessionTask,
		completionHandler: (
			p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		) => void | null,
	): void

	setCredentialForProtectionSpaceTask(
		credential: NSURLCredential,
		protectionSpace: NSURLProtectionSpace,
		task: NSURLSessionTask,
	): void

	removeCredentialForProtectionSpaceOptionsTask(
		credential: NSURLCredential,
		protectionSpace: NSURLProtectionSpace,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		task: NSURLSessionTask,
	): void

	getDefaultCredentialForProtectionSpaceTaskCompletionHandler(
		space: NSURLProtectionSpace,
		task: NSURLSessionTask,
		completionHandler: (p1: NSURLCredential) => void | null,
	): void

	setDefaultCredentialForProtectionSpaceTask(
		credential: NSURLCredential,
		protectionSpace: NSURLProtectionSpace,
		task: NSURLSessionTask,
	): void
}

export declare class NSTimer extends NSObject {
	static timerWithTimeIntervalInvocationRepeats(
		ti: number,
		invocation: NSInvocation,
		yesOrNo: boolean,
	): NSTimer

	static scheduledTimerWithTimeIntervalInvocationRepeats(
		ti: number,
		invocation: NSInvocation,
		yesOrNo: boolean,
	): NSTimer

	static timerWithTimeIntervalTargetSelectorUserInfoRepeats(
		ti: number,
		aTarget: interop.Object,
		aSelector: string,
		userInfo: interop.Object | null,
		yesOrNo: boolean,
	): NSTimer

	static scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
		ti: number,
		aTarget: interop.Object,
		aSelector: string,
		userInfo: interop.Object | null,
		yesOrNo: boolean,
	): NSTimer

	static timerWithTimeIntervalRepeatsBlock(
		interval: number,
		repeats: boolean,
		block: (p1: NSTimer) => void,
	): NSTimer

	static scheduledTimerWithTimeIntervalRepeatsBlock(
		interval: number,
		repeats: boolean,
		block: (p1: NSTimer) => void,
	): NSTimer

	initWithFireDateIntervalRepeatsBlock(
		date: NSDate,
		interval: number,
		repeats: boolean,
		block: (p1: NSTimer) => void,
	): this

	initWithFireDateIntervalTargetSelectorUserInfoRepeats(
		date: NSDate,
		ti: number,
		t: interop.Object,
		s: string,
		ui: interop.Object | null,
		rep: boolean,
	): this

	fire(): void

	fireDate: NSDate

	readonly timeInterval: number

	tolerance: number

	invalidate(): void

	readonly valid: boolean

	readonly userInfo: interop.Object

	isValid(): boolean
}

export declare class NSLinguisticTagger extends NSObject {
	initWithTagSchemesOptions(
		tagSchemes: NSArray<interop.Object> | Array<interop.Object>,
		opts: number,
	): this

	readonly tagSchemes: NSArray

	string: string

	static availableTagSchemesForUnitLanguage(
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
		language: string,
	): NSArray

	static availableTagSchemesForLanguage(language: string): NSArray

	setOrthographyRange(orthography: NSOrthography | null, range: _NSRange): void

	orthographyAtIndexEffectiveRange(
		charIndex: number,
		effectiveRange: interop.PointerConvertible,
	): NSOrthography

	stringEditedInRangeChangeInLength(newRange: _NSRange, delta: number): void

	tokenRangeAtIndexUnit(
		charIndex: number,
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
	): _NSRange

	sentenceRangeForRange(range: _NSRange): _NSRange

	enumerateTagsInRangeUnitSchemeOptionsUsingBlock(
		range: _NSRange,
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
		scheme: string,
		options: interop.Enum<typeof NSLinguisticTaggerOptions>,
		block: (p1: string, p2: _NSRange, p3: interop.PointerConvertible) => void | null,
	): void

	tagAtIndexUnitSchemeTokenRange(
		charIndex: number,
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
		scheme: string,
		tokenRange: interop.PointerConvertible,
	): string

	tagsInRangeUnitSchemeOptionsTokenRanges(
		range: _NSRange,
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
		scheme: string,
		options: interop.Enum<typeof NSLinguisticTaggerOptions>,
		tokenRanges: interop.PointerConvertible,
	): NSArray

	enumerateTagsInRangeSchemeOptionsUsingBlock(
		range: _NSRange,
		tagScheme: string,
		opts: interop.Enum<typeof NSLinguisticTaggerOptions>,
		block: (p1: string, p2: _NSRange, p3: _NSRange, p4: interop.PointerConvertible) => void | null,
	): void

	tagAtIndexSchemeTokenRangeSentenceRange(
		charIndex: number,
		scheme: string,
		tokenRange: interop.PointerConvertible,
		sentenceRange: interop.PointerConvertible,
	): string

	tagsInRangeSchemeOptionsTokenRanges(
		range: _NSRange,
		tagScheme: string,
		opts: interop.Enum<typeof NSLinguisticTaggerOptions>,
		tokenRanges: interop.PointerConvertible,
	): NSArray

	readonly dominantLanguage: string

	static dominantLanguageForString(string: string): string

	static tagForStringAtIndexUnitSchemeOrthographyTokenRange(
		string: string,
		charIndex: number,
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
		scheme: string,
		orthography: NSOrthography | null,
		tokenRange: interop.PointerConvertible,
	): string

	static tagsForStringRangeUnitSchemeOptionsOrthographyTokenRanges(
		string: string,
		range: _NSRange,
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
		scheme: string,
		options: interop.Enum<typeof NSLinguisticTaggerOptions>,
		orthography: NSOrthography | null,
		tokenRanges: interop.PointerConvertible,
	): NSArray

	static enumerateTagsForStringRangeUnitSchemeOptionsOrthographyUsingBlock(
		string: string,
		range: _NSRange,
		unit: interop.Enum<typeof NSLinguisticTaggerUnit>,
		scheme: string,
		options: interop.Enum<typeof NSLinguisticTaggerOptions>,
		orthography: NSOrthography | null,
		block: (p1: string, p2: _NSRange, p3: interop.PointerConvertible) => void | null,
	): void

	possibleTagsAtIndexSchemeTokenRangeSentenceRangeScores(
		charIndex: number,
		tagScheme: string,
		tokenRange: interop.PointerConvertible,
		sentenceRange: interop.PointerConvertible,
		scores: interop.PointerConvertible,
	): NSArray
}

export declare class NSHTTPCookieStorage extends NSObject {
	static readonly sharedHTTPCookieStorage: NSHTTPCookieStorage

	static sharedCookieStorageForGroupContainerIdentifier(identifier: string): NSHTTPCookieStorage

	readonly cookies: NSArray

	setCookie(cookie: NSHTTPCookie): void

	deleteCookie(cookie: NSHTTPCookie): void

	removeCookiesSinceDate(date: NSDate): void

	cookiesForURL(URL: NSURL): NSArray

	setCookiesForURLMainDocumentURL(
		cookies: NSArray<interop.Object> | Array<interop.Object>,
		URL: NSURL | null,
		mainDocumentURL: NSURL | null,
	): void

	cookieAcceptPolicy: interop.Enum<typeof NSHTTPCookieAcceptPolicy>

	sortedCookiesUsingDescriptors(sortOrder: NSArray<interop.Object> | Array<interop.Object>): NSArray

	storeCookiesForTask(
		cookies: NSArray<interop.Object> | Array<interop.Object>,
		task: NSURLSessionTask,
	): void

	getCookiesForTaskCompletionHandler(
		task: NSURLSessionTask,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void | null,
	): void
}

export declare class NSDistributedLock extends NSObject {
	static lockWithPath(path: string): NSDistributedLock

	initWithPath(path: string): this

	tryLock(): boolean

	unlock(): void

	breakLock(): void

	readonly lockDate: NSDate
}

export declare class NSPositionalSpecifier extends NSObject {
	initWithPositionObjectSpecifier(
		position: interop.Enum<typeof NSInsertionPosition>,
		specifier: NSScriptObjectSpecifier,
	): this

	readonly position: interop.Enum<typeof NSInsertionPosition>

	readonly objectSpecifier: NSScriptObjectSpecifier

	setInsertionClassDescription(classDescription: NSScriptClassDescription): void

	evaluate(): void

	readonly insertionContainer: interop.Object

	readonly insertionKey: string

	readonly insertionIndex: number

	readonly insertionReplaces: boolean
}

export declare class NSQuitCommand extends NSScriptCommand {
	readonly saveOptions: interop.Enum<typeof NSSaveOptions>
}

export declare class NSFileSecurity extends NSObject implements NSCopying, NSSecureCoding {
	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSMeasurementFormatter extends NSFormatter implements NSSecureCoding {
	unitOptions: interop.Enum<typeof NSMeasurementFormatterUnitOptions>

	unitStyle: interop.Enum<typeof NSFormattingUnitStyle>

	locale: NSLocale

	numberFormatter: NSNumberFormatter

	stringFromMeasurement(measurement: NSMeasurement): string

	stringFromUnit(unit: NSUnit): string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUUID extends NSObject implements NSCopying, NSSecureCoding {
	static UUID<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	init(): this

	initWithUUIDString(string: string): this

	initWithUUIDBytes(bytes: interop.PointerConvertible): this

	getUUIDBytes(uuid: interop.PointerConvertible): void

	readonly UUIDString: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSDecimalNumberHandler
	extends NSObject
	implements NSDecimalNumberBehaviors, NSCoding
{
	static readonly defaultDecimalNumberHandler: NSDecimalNumberHandler

	initWithRoundingModeScaleRaiseOnExactnessRaiseOnOverflowRaiseOnUnderflowRaiseOnDivideByZero(
		roundingMode: interop.Enum<typeof NSRoundingMode>,
		scale: number,
		exact: boolean,
		overflow: boolean,
		underflow: boolean,
		divideByZero: boolean,
	): this

	static decimalNumberHandlerWithRoundingModeScaleRaiseOnExactnessRaiseOnOverflowRaiseOnUnderflowRaiseOnDivideByZero<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		roundingMode: interop.Enum<typeof NSRoundingMode>,
		scale: number,
		exact: boolean,
		overflow: boolean,
		underflow: boolean,
		divideByZero: boolean,
	): InstanceType<This>

	roundingMode(): interop.Enum<typeof NSRoundingMode>

	scale(): number

	exceptionDuringOperationErrorLeftOperandRightOperand(
		operation: string,
		error: interop.Enum<typeof NSCalculationError>,
		leftOperand: NSDecimalNumber,
		rightOperand: NSDecimalNumber | null,
	): NSDecimalNumber

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSScanner extends NSObject implements NSCopying {
	readonly string: string

	scanLocation: number

	charactersToBeSkipped: NSCharacterSet

	caseSensitive: boolean

	locale: interop.Object

	initWithString(string: string): this

	scanInt(result: interop.PointerConvertible): boolean

	scanInteger(result: interop.PointerConvertible): boolean

	scanLongLong(result: interop.PointerConvertible): boolean

	scanUnsignedLongLong(result: interop.PointerConvertible): boolean

	scanFloat(result: interop.PointerConvertible): boolean

	scanDouble(result: interop.PointerConvertible): boolean

	scanHexInt(result: interop.PointerConvertible): boolean

	scanHexLongLong(result: interop.PointerConvertible): boolean

	scanHexFloat(result: interop.PointerConvertible): boolean

	scanHexDouble(result: interop.PointerConvertible): boolean

	scanStringIntoString(string: string, result: interop.PointerConvertible): boolean

	scanCharactersFromSetIntoString(set: NSCharacterSet, result: interop.PointerConvertible): boolean

	scanUpToStringIntoString(string: string, result: interop.PointerConvertible): boolean

	scanUpToCharactersFromSetIntoString(
		set: NSCharacterSet,
		result: interop.PointerConvertible,
	): boolean

	readonly atEnd: boolean

	static scannerWithString<This extends abstract new (...args: any) => any>(
		this: This,
		string: string,
	): InstanceType<This>

	static localizedScannerWithString(string: string): interop.Object

	isAtEnd(): boolean

	scanDecimal(dcm: interop.PointerConvertible): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSScriptWhoseTest extends NSObject implements NSCoding {
	isTrue(): boolean

	init(): this

	initWithCoder(inCoder: NSCoder): this

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSSocketPort extends NSPort {
	init(): this

	initWithTCPPort(port: number): this

	initWithProtocolFamilySocketTypeProtocolAddress(
		family: number,
		type: number,
		protocol: number,
		address: NSData,
	): this

	initWithProtocolFamilySocketTypeProtocolSocket(
		family: number,
		type: number,
		protocol: number,
		sock: number,
	): this

	initRemoteWithTCPPortHost(port: number, hostName: string | null): this

	initRemoteWithProtocolFamilySocketTypeProtocolAddress(
		family: number,
		type: number,
		protocol: number,
		address: NSData,
	): this

	readonly protocolFamily: number

	readonly socketType: number

	readonly protocol: number

	readonly address: NSData

	readonly socket: number
}

export declare class NSMutableIndexSet extends NSIndexSet {
	addIndexes(indexSet: NSIndexSet): void

	removeIndexes(indexSet: NSIndexSet): void

	removeAllIndexes(): void

	addIndex(value: number): void

	removeIndex(value: number): void

	addIndexesInRange(range: _NSRange): void

	removeIndexesInRange(range: _NSRange): void

	shiftIndexesStartingAtIndexBy(index: number, delta: number): void
}

export declare class NSFileWrapper extends NSObject implements NSSecureCoding {
	initWithURLOptionsError(
		url: NSURL,
		options: interop.Enum<typeof NSFileWrapperReadingOptions>,
		outError: interop.PointerConvertible,
	): this

	initDirectoryWithFileWrappers(
		childrenByPreferredName:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): this

	initRegularFileWithContents(contents: NSData): this

	initSymbolicLinkWithDestinationURL(url: NSURL): this

	initWithSerializedRepresentation(serializeRepresentation: NSData): this

	initWithCoder(inCoder: NSCoder): this

	readonly directory: boolean

	readonly regularFile: boolean

	readonly symbolicLink: boolean

	preferredFilename: string

	filename: string

	get fileAttributes(): NSDictionary
	set fileAttributes(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	matchesContentsOfURL(url: NSURL): boolean

	readFromURLOptionsError(
		url: NSURL,
		options: interop.Enum<typeof NSFileWrapperReadingOptions>,
		outError: interop.PointerConvertible,
	): boolean

	writeToURLOptionsOriginalContentsURLError(
		url: NSURL,
		options: interop.Enum<typeof NSFileWrapperWritingOptions>,
		originalContentsURL: NSURL | null,
		outError: interop.PointerConvertible,
	): boolean

	readonly serializedRepresentation: NSData

	addFileWrapper(child: NSFileWrapper): string

	addRegularFileWithContentsPreferredFilename(data: NSData, fileName: string): string

	removeFileWrapper(child: NSFileWrapper): void

	readonly fileWrappers: NSDictionary

	keyForFileWrapper(child: NSFileWrapper): string

	readonly regularFileContents: NSData

	readonly symbolicLinkDestinationURL: NSURL

	isDirectory(): boolean

	isRegularFile(): boolean

	isSymbolicLink(): boolean

	initWithPath(path: string): this

	initSymbolicLinkWithDestination(path: string): this

	needsToBeUpdatedFromPath(path: string): boolean

	updateFromPath(path: string): boolean

	writeToFileAtomicallyUpdateFilenames(
		path: string,
		atomicFlag: boolean,
		updateFilenamesFlag: boolean,
	): boolean

	addFileWithPath(path: string): string

	addSymbolicLinkWithDestinationPreferredFilename(path: string, filename: string): string

	symbolicLinkDestination(): string

	icon: NSImage

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSURLRequest
	extends NSObject
	implements NSSecureCoding, NSCopying, NSMutableCopying
{
	static requestWithURL<This extends abstract new (...args: any) => any>(
		this: This,
		URL: NSURL,
	): InstanceType<This>

	static readonly supportsSecureCoding: boolean

	static requestWithURLCachePolicyTimeoutInterval<This extends abstract new (...args: any) => any>(
		this: This,
		URL: NSURL,
		cachePolicy: interop.Enum<typeof NSURLRequestCachePolicy>,
		timeoutInterval: number,
	): InstanceType<This>

	initWithURL(URL: NSURL): this

	initWithURLCachePolicyTimeoutInterval(
		URL: NSURL,
		cachePolicy: interop.Enum<typeof NSURLRequestCachePolicy>,
		timeoutInterval: number,
	): this

	readonly URL: NSURL

	readonly cachePolicy: interop.Enum<typeof NSURLRequestCachePolicy>

	readonly timeoutInterval: number

	readonly mainDocumentURL: NSURL

	readonly networkServiceType: interop.Enum<typeof NSURLRequestNetworkServiceType>

	readonly allowsCellularAccess: boolean

	readonly allowsExpensiveNetworkAccess: boolean

	readonly allowsConstrainedNetworkAccess: boolean

	readonly HTTPMethod: string

	readonly allHTTPHeaderFields: NSDictionary

	valueForHTTPHeaderField(field: string): string

	readonly HTTPBody: NSData

	readonly HTTPBodyStream: NSInputStream

	readonly HTTPShouldHandleCookies: boolean

	readonly HTTPShouldUsePipelining: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSDeleteCommand extends NSScriptCommand {
	setReceiversSpecifier(receiversSpecifier: NSScriptObjectSpecifier | null): void
	setReceiversSpecifier(receiversRef: NSScriptObjectSpecifier | null): void

	readonly keySpecifier: NSScriptObjectSpecifier
}

export declare class NSUndoManager extends NSObject {
	beginUndoGrouping(): void

	endUndoGrouping(): void

	readonly groupingLevel: number

	disableUndoRegistration(): void

	enableUndoRegistration(): void

	readonly undoRegistrationEnabled: boolean

	groupsByEvent: boolean

	levelsOfUndo: number

	get runLoopModes(): NSArray
	set runLoopModes(value: NSArray<interop.Object> | Array<interop.Object>)

	undo(): void

	redo(): void

	undoNestedGroup(): void

	readonly canUndo: boolean

	readonly canRedo: boolean

	readonly undoing: boolean

	readonly redoing: boolean

	removeAllActions(): void

	removeAllActionsWithTarget(target: interop.Object): void

	registerUndoWithTargetSelectorObject(
		target: interop.Object,
		selector: string,
		object: interop.Object | null,
	): void

	prepareWithInvocationTarget(target: interop.Object): interop.Object

	registerUndoWithTargetHandler(
		target: interop.Object,
		undoHandler: (p1: interop.Object) => void,
	): void

	setActionIsDiscardable(discardable: boolean): void

	readonly undoActionIsDiscardable: boolean

	readonly redoActionIsDiscardable: boolean

	readonly undoActionName: string

	readonly redoActionName: string

	setActionName(actionName: string): void

	readonly undoMenuItemTitle: string

	readonly redoMenuItemTitle: string

	undoMenuTitleForUndoActionName(actionName: string): string

	redoMenuTitleForUndoActionName(actionName: string): string

	isUndoRegistrationEnabled(): boolean

	isUndoing(): boolean

	isRedoing(): boolean
}

export declare class NSMutableArray<ObjectType = interop.Object> extends NSArray {
	addObject(anObject: ObjectType): void

	insertObjectAtIndex(anObject: ObjectType, index: number): void

	removeLastObject(): void

	removeObjectAtIndex(index: number): void

	replaceObjectAtIndexWithObject(index: number, anObject: ObjectType): void

	init(): this

	initWithCapacity(numItems: number): this

	initWithCoder(coder: NSCoder): this

	addObjectsFromArray(otherArray: NSArray<interop.Object> | Array<interop.Object>): void

	exchangeObjectAtIndexWithObjectAtIndex(idx1: number, idx2: number): void

	removeAllObjects(): void

	removeObjectInRange(anObject: ObjectType, range: _NSRange): void

	removeObject(anObject: ObjectType): void

	removeObjectIdenticalToInRange(anObject: ObjectType, range: _NSRange): void

	removeObjectIdenticalTo(anObject: ObjectType): void

	removeObjectsFromIndicesNumIndices(indices: interop.PointerConvertible, cnt: number): void

	removeObjectsInArray(otherArray: NSArray<interop.Object> | Array<interop.Object>): void

	removeObjectsInRange(range: _NSRange): void

	replaceObjectsInRangeWithObjectsFromArrayRange(
		range: _NSRange,
		otherArray: NSArray<interop.Object> | Array<interop.Object>,
		otherRange: _NSRange,
	): void

	replaceObjectsInRangeWithObjectsFromArray(
		range: _NSRange,
		otherArray: NSArray<interop.Object> | Array<interop.Object>,
	): void

	setArray(otherArray: NSArray<interop.Object> | Array<interop.Object>): void

	sortUsingFunctionContext(
		compare: (
			p1: interop.Object,
			p2: interop.Object,
			p3: interop.PointerConvertible,
		) => number | null,
		context: interop.PointerConvertible,
	): void

	sortUsingSelector(comparator: string): void

	insertObjectsAtIndexes(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		indexes: NSIndexSet,
	): void

	removeObjectsAtIndexes(indexes: NSIndexSet): void

	replaceObjectsAtIndexesWithObjects(
		indexes: NSIndexSet,
		objects: NSArray<interop.Object> | Array<interop.Object>,
	): void

	setObjectAtIndexedSubscript(obj: ObjectType, idx: number): void

	sortUsingComparator(
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): void

	sortWithOptionsUsingComparator(
		opts: interop.Enum<typeof NSSortOptions>,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): void

	static arrayWithCapacity<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		numItems: number,
	): InstanceType<This>

	static arrayWithContentsOfFile<ObjectType>(path: string): NSArray
	static arrayWithContentsOfFile<ObjectType>(path: string): NSMutableArray

	static arrayWithContentsOfURL<ObjectType>(url: NSURL): NSArray
	static arrayWithContentsOfURL<ObjectType>(url: NSURL): NSMutableArray

	initWithContentsOfFile(path: string): this

	initWithContentsOfURL(url: NSURL): this

	applyDifference(difference: NSOrderedCollectionDifference): void

	sortUsingDescriptors(sortDescriptors: NSArray<interop.Object> | Array<interop.Object>): void

	filterUsingPredicate(predicate: NSPredicate): void
}

export declare class NSUnitConcentrationMass extends NSDimension implements NSSecureCoding {
	static readonly gramsPerLiter: NSUnitConcentrationMass

	static readonly milligramsPerDeciliter: NSUnitConcentrationMass

	static millimolesPerLiterWithGramsPerMole(gramsPerMole: number): NSUnitConcentrationMass

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSCalendarDate extends NSDate {
	static calendarDate(): interop.Object

	static dateWithStringCalendarFormatLocale(
		description: string,
		format: string,
		locale: interop.Object | null,
	): interop.Object

	static dateWithStringCalendarFormat(description: string, format: string): interop.Object

	static dateWithYearMonthDayHourMinuteSecondTimeZone(
		year: number,
		month: number,
		day: number,
		hour: number,
		minute: number,
		second: number,
		aTimeZone: NSTimeZone | null,
	): interop.Object

	dateByAddingYearsMonthsDaysHoursMinutesSeconds(
		year: number,
		month: number,
		day: number,
		hour: number,
		minute: number,
		second: number,
	): NSCalendarDate

	dayOfCommonEra(): number

	dayOfMonth(): number

	dayOfWeek(): number

	dayOfYear(): number

	hourOfDay(): number

	minuteOfHour(): number

	monthOfYear(): number

	secondOfMinute(): number

	yearOfCommonEra(): number

	calendarFormat(): string

	descriptionWithCalendarFormatLocale(format: string, locale: interop.Object | null): string

	descriptionWithCalendarFormat(format: string): string

	descriptionWithLocale(locale: interop.Object | null): string

	timeZone(): NSTimeZone

	initWithStringCalendarFormatLocale(
		description: string,
		format: string,
		locale: interop.Object | null,
	): this

	initWithStringCalendarFormat(description: string, format: string): this

	initWithString(description: string): this

	initWithYearMonthDayHourMinuteSecondTimeZone(
		year: number,
		month: number,
		day: number,
		hour: number,
		minute: number,
		second: number,
		aTimeZone: NSTimeZone | null,
	): this

	setCalendarFormat(format: string | null): void

	setTimeZone(aTimeZone: NSTimeZone | null): void

	yearsMonthsDaysHoursMinutesSecondsSinceDate(
		yp: interop.PointerConvertible,
		mop: interop.PointerConvertible,
		dp: interop.PointerConvertible,
		hp: interop.PointerConvertible,
		mip: interop.PointerConvertible,
		sp: interop.PointerConvertible,
		date: NSCalendarDate,
	): void

	// @ts-ignore MemberDecl.tsIgnore
	static readonly distantFuture: NSCalendarDate

	// @ts-ignore MemberDecl.tsIgnore
	static readonly distantPast: NSCalendarDate
}

export declare class NSAttributedString
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding, NSPasteboardReading, NSPasteboardWriting
{
	readonly string: string

	attributesAtIndexEffectiveRange(location: number, range: interop.PointerConvertible): NSDictionary

	readonly length: number

	attributeAtIndexEffectiveRange(
		attrName: string,
		location: number,
		range: interop.PointerConvertible,
	): interop.Object

	attributedSubstringFromRange(range: _NSRange): NSAttributedString

	attributesAtIndexLongestEffectiveRangeInRange(
		location: number,
		range: interop.PointerConvertible,
		rangeLimit: _NSRange,
	): NSDictionary

	attributeAtIndexLongestEffectiveRangeInRange(
		attrName: string,
		location: number,
		range: interop.PointerConvertible,
		rangeLimit: _NSRange,
	): interop.Object

	isEqualToAttributedString(other: NSAttributedString): boolean

	initWithString(str: string): this

	initWithStringAttributes(
		str: string,
		attrs:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	initWithAttributedString(attrStr: NSAttributedString): this

	enumerateAttributesInRangeOptionsUsingBlock(
		enumerationRange: _NSRange,
		opts: interop.Enum<typeof NSAttributedStringEnumerationOptions>,
		block: (
			p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p2: _NSRange,
			p3: interop.PointerConvertible,
		) => void,
	): void

	enumerateAttributeInRangeOptionsUsingBlock(
		attrName: string,
		enumerationRange: _NSRange,
		opts: interop.Enum<typeof NSAttributedStringEnumerationOptions>,
		block: (p1: interop.Object, p2: _NSRange, p3: interop.PointerConvertible) => void | null,
	): void

	initWithURLOptionsDocumentAttributesError(
		url: NSURL,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		dict: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): this

	initWithDataOptionsDocumentAttributesError(
		data: NSData,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		dict: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): this

	dataFromRangeDocumentAttributesError(
		range: _NSRange,
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): NSData

	fileWrapperFromRangeDocumentAttributesError(
		range: _NSRange,
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): NSFileWrapper

	containsAttachmentsInRange(range: _NSRange): boolean

	initWithRTFDocumentAttributes(data: NSData, dict: interop.PointerConvertible): this

	initWithRTFDDocumentAttributes(data: NSData, dict: interop.PointerConvertible): this

	initWithHTMLDocumentAttributes(data: NSData, dict: interop.PointerConvertible): this

	initWithHTMLBaseURLDocumentAttributes(
		data: NSData,
		base: NSURL,
		dict: interop.PointerConvertible,
	): this

	initWithDocFormatDocumentAttributes(data: NSData, dict: interop.PointerConvertible): this

	initWithHTMLOptionsDocumentAttributes(
		data: NSData,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		dict: interop.PointerConvertible,
	): this

	initWithRTFDFileWrapperDocumentAttributes(
		wrapper: NSFileWrapper,
		dict: interop.PointerConvertible,
	): this

	RTFFromRangeDocumentAttributes(
		range: _NSRange,
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): NSData

	RTFDFromRangeDocumentAttributes(
		range: _NSRange,
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): NSData

	RTFDFileWrapperFromRangeDocumentAttributes(
		range: _NSRange,
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): NSFileWrapper

	docFormatFromRangeDocumentAttributes(
		range: _NSRange,
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): NSData

	fontAttributesInRange(range: _NSRange): NSDictionary

	rulerAttributesInRange(range: _NSRange): NSDictionary

	lineBreakBeforeIndexWithinRange(location: number, aRange: _NSRange): number

	lineBreakByHyphenatingBeforeIndexWithinRange(location: number, aRange: _NSRange): number

	doubleClickAtIndex(location: number): _NSRange

	nextWordFromIndexForward(location: number, isForward: boolean): number

	rangeOfTextBlockAtIndex(block: NSTextBlock, location: number): _NSRange

	rangeOfTextTableAtIndex(table: NSTextTable, location: number): _NSRange

	rangeOfTextListAtIndex(list: NSTextList, location: number): _NSRange

	itemNumberInTextListAtIndex(list: NSTextList, location: number): number

	static readonly textTypes: NSArray

	static readonly textUnfilteredTypes: NSArray

	readonly containsAttachments: boolean

	static textFileTypes(): NSArray

	static textPasteboardTypes(): NSArray

	static textUnfilteredFileTypes(): NSArray

	static textUnfilteredPasteboardTypes(): NSArray

	initWithURLDocumentAttributes(url: NSURL, dict: interop.PointerConvertible): this

	initWithPathDocumentAttributes(path: string, dict: interop.PointerConvertible): this

	URLAtIndexEffectiveRange(location: number, effectiveRange: interop.PointerConvertible): NSURL

	static attributedStringWithAttachment(attachment: NSTextAttachment): NSAttributedString

	size(): CGSize

	drawAtPoint(point: CGPoint): void

	drawInRect(rect: CGRect): void

	drawWithRectOptionsContext(
		rect: CGRect,
		options: interop.Enum<typeof NSStringDrawingOptions>,
		context: NSStringDrawingContext | null,
	): void

	boundingRectWithSizeOptionsContext(
		size: CGSize,
		options: interop.Enum<typeof NSStringDrawingOptions>,
		context: NSStringDrawingContext | null,
	): CGRect

	drawWithRectOptions(rect: CGRect, options: interop.Enum<typeof NSStringDrawingOptions>): void

	boundingRectWithSizeOptions(
		size: CGSize,
		options: interop.Enum<typeof NSStringDrawingOptions>,
	): CGRect

	static loadFromHTMLWithRequestOptionsCompletionHandler(
		request: NSURLRequest,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (
			p1: NSAttributedString,
			p2: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p3: NSError,
		) => void,
	): void

	static loadFromHTMLWithFileURLOptionsCompletionHandler(
		fileURL: NSURL,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (
			p1: NSAttributedString,
			p2: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p3: NSError,
		) => void,
	): void

	static loadFromHTMLWithStringOptionsCompletionHandler(
		string: string,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (
			p1: NSAttributedString,
			p2: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p3: NSError,
		) => void,
	): void

	static loadFromHTMLWithDataOptionsCompletionHandler(
		data: NSData,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (
			p1: NSAttributedString,
			p2: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p3: NSError,
		) => void,
	): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	static readableTypesForPasteboard(pasteboard: NSPasteboard): NSArray

	static readingOptionsForTypePasteboard(
		type: string,
		pasteboard: NSPasteboard,
	): interop.Enum<typeof NSPasteboardReadingOptions>

	initWithPasteboardPropertyListOfType(propertyList: interop.Object, type: string): this

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	writableTypesForPasteboard(pasteboard: NSPasteboard): NSArray

	writingOptionsForTypePasteboard(
		type: string,
		pasteboard: NSPasteboard,
	): interop.Enum<typeof NSPasteboardWritingOptions>

	pasteboardPropertyListForType(type: string): interop.Object
}

export declare class NSDirectoryEnumerator<ObjectType = interop.Object> extends NSEnumerator {
	readonly fileAttributes: NSDictionary

	readonly directoryAttributes: NSDictionary

	readonly isEnumeratingDirectoryPostOrder: boolean

	skipDescendents(): void

	readonly level: number

	skipDescendants(): void
}

export declare class NSDistributedNotificationCenter extends NSNotificationCenter {
	static notificationCenterForType(notificationCenterType: string): NSDistributedNotificationCenter

	// @ts-ignore MemberDecl.tsIgnore
	static readonly defaultCenter: NSDistributedNotificationCenter

	addObserverSelectorNameObjectSuspensionBehavior(
		observer: interop.Object,
		selector: string,
		name: string | null,
		object: string | null,
		suspensionBehavior: interop.Enum<typeof NSNotificationSuspensionBehavior>,
	): void

	postNotificationNameObjectUserInfoDeliverImmediately(
		name: string,
		object: string | null,
		userInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		deliverImmediately: boolean,
	): void

	postNotificationNameObjectUserInfoOptions(
		name: string,
		object: string | null,
		userInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		options: interop.Enum<typeof NSDistributedNotificationOptions>,
	): void

	suspended: boolean

	addObserverSelectorNameObject(
		observer: interop.Object,
		aSelector: string,
		aName: string | null,
		anObject: interop.Object | null,
	): void
	addObserverSelectorNameObject(
		observer: interop.Object,
		aSelector: string,
		aName: string | null,
		anObject: string | null,
	): void

	postNotificationNameObject(aName: string, anObject: interop.Object | null): void
	postNotificationNameObject(aName: string, anObject: string | null): void

	postNotificationNameObjectUserInfo(
		aName: string,
		anObject: interop.Object | null,
		aUserInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void
	postNotificationNameObjectUserInfo(
		aName: string,
		anObject: string | null,
		aUserInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	removeObserverNameObject(
		observer: interop.Object,
		aName: string | null,
		anObject: interop.Object | null,
	): void
	removeObserverNameObject(
		observer: interop.Object,
		aName: string | null,
		anObject: string | null,
	): void
}

export declare class NSUnitMass extends NSDimension implements NSSecureCoding {
	static readonly kilograms: NSUnitMass

	static readonly grams: NSUnitMass

	static readonly decigrams: NSUnitMass

	static readonly centigrams: NSUnitMass

	static readonly milligrams: NSUnitMass

	static readonly micrograms: NSUnitMass

	static readonly nanograms: NSUnitMass

	static readonly picograms: NSUnitMass

	static readonly ounces: NSUnitMass

	static readonly poundsMass: NSUnitMass

	static readonly stones: NSUnitMass

	static readonly metricTons: NSUnitMass

	static readonly shortTons: NSUnitMass

	static readonly carats: NSUnitMass

	static readonly ouncesTroy: NSUnitMass

	static readonly slugs: NSUnitMass

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSOrderedCollectionChange<ObjectType = interop.Object> extends NSObject {
	static changeWithObjectTypeIndex<ObjectType>(
		anObject: ObjectType | null,
		type: interop.Enum<typeof NSCollectionChangeType>,
		index: number,
	): NSOrderedCollectionChange

	static changeWithObjectTypeIndexAssociatedIndex<ObjectType>(
		anObject: ObjectType | null,
		type: interop.Enum<typeof NSCollectionChangeType>,
		index: number,
		associatedIndex: number,
	): NSOrderedCollectionChange

	readonly object: ObjectType

	readonly changeType: interop.Enum<typeof NSCollectionChangeType>

	readonly index: number

	readonly associatedIndex: number

	initWithObjectTypeIndex(
		anObject: ObjectType | null,
		type: interop.Enum<typeof NSCollectionChangeType>,
		index: number,
	): this

	initWithObjectTypeIndexAssociatedIndex(
		anObject: ObjectType | null,
		type: interop.Enum<typeof NSCollectionChangeType>,
		index: number,
		associatedIndex: number,
	): this
}

export declare class NSHost extends NSObject {
	static currentHost<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static hostWithName<This extends abstract new (...args: any) => any>(
		this: This,
		name: string | null,
	): InstanceType<This>

	static hostWithAddress<This extends abstract new (...args: any) => any>(
		this: This,
		address: string,
	): InstanceType<This>

	isEqualToHost(aHost: NSHost): boolean

	readonly name: string

	readonly names: NSArray

	readonly address: string

	readonly addresses: NSArray

	readonly localizedName: string

	static setHostCacheEnabled(flag: boolean): void

	static isHostCacheEnabled(): boolean

	static flushHostCache(): void
}

export declare class NSRecursiveLock extends NSObject implements NSLocking {
	tryLock(): boolean

	lockBeforeDate(limit: NSDate): boolean

	name: string

	lock(): void

	unlock(): void
}

export declare class NSConnection extends NSObject {
	readonly statistics: NSDictionary

	static allConnections(): NSArray

	static defaultConnection(): NSConnection

	static connectionWithRegisteredNameHost<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
		hostName: string | null,
	): InstanceType<This>

	static connectionWithRegisteredNameHostUsingNameServer<
		This extends abstract new (...args: any) => any,
	>(this: This, name: string, hostName: string | null, server: NSPortNameServer): InstanceType<This>

	static rootProxyForConnectionWithRegisteredNameHost(
		name: string,
		hostName: string | null,
	): NSDistantObject

	static rootProxyForConnectionWithRegisteredNameHostUsingNameServer(
		name: string,
		hostName: string | null,
		server: NSPortNameServer,
	): NSDistantObject

	static serviceConnectionWithNameRootObjectUsingNameServer<
		This extends abstract new (...args: any) => any,
	>(this: This, name: string, root: interop.Object, server: NSPortNameServer): InstanceType<This>

	static serviceConnectionWithNameRootObject<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
		root: interop.Object,
	): InstanceType<This>

	requestTimeout: number

	replyTimeout: number

	rootObject: interop.Object

	delegate: NSConnectionDelegate

	independentConversationQueueing: boolean

	readonly valid: boolean

	readonly rootProxy: NSDistantObject

	invalidate(): void

	addRequestMode(rmode: string): void

	removeRequestMode(rmode: string): void

	readonly requestModes: NSArray

	registerName(name: string | null): boolean

	registerNameWithNameServer(name: string | null, server: NSPortNameServer): boolean

	static connectionWithReceivePortSendPort<This extends abstract new (...args: any) => any>(
		this: This,
		receivePort: NSPort | null,
		sendPort: NSPort | null,
	): InstanceType<This>

	static currentConversation(): interop.Object

	initWithReceivePortSendPort(receivePort: NSPort | null, sendPort: NSPort | null): this

	readonly sendPort: NSPort

	readonly receivePort: NSPort

	enableMultipleThreads(): void

	readonly multipleThreadsEnabled: boolean

	addRunLoop(runloop: NSRunLoop): void

	removeRunLoop(runloop: NSRunLoop): void

	runInNewThread(): void

	readonly remoteObjects: NSArray

	readonly localObjects: NSArray

	dispatchWithComponents(components: NSArray<interop.Object> | Array<interop.Object>): void

	isValid(): boolean
}

export declare class NSMetadataItem extends NSObject {
	initWithURL(url: NSURL): this

	valueForAttribute(key: string): interop.Object

	valuesForAttributes(keys: NSArray<interop.Object> | Array<interop.Object>): NSDictionary

	readonly attributes: NSArray
}

export declare class NSLocale extends NSObject implements NSCopying, NSSecureCoding {
	objectForKey(key: string): interop.Object

	displayNameForKeyValue(key: string, value: interop.Object): string

	initWithLocaleIdentifier(string: string): this

	initWithCoder(coder: NSCoder): this

	readonly localeIdentifier: string

	localizedStringForLocaleIdentifier(localeIdentifier: string): string

	readonly languageCode: string

	localizedStringForLanguageCode(languageCode: string): string

	readonly countryCode: string

	localizedStringForCountryCode(countryCode: string): string

	readonly scriptCode: string

	localizedStringForScriptCode(scriptCode: string): string

	readonly variantCode: string

	localizedStringForVariantCode(variantCode: string): string

	readonly exemplarCharacterSet: NSCharacterSet

	readonly calendarIdentifier: string

	localizedStringForCalendarIdentifier(calendarIdentifier: string): string

	readonly collationIdentifier: string

	localizedStringForCollationIdentifier(collationIdentifier: string): string

	readonly usesMetricSystem: boolean

	readonly decimalSeparator: string

	readonly groupingSeparator: string

	readonly currencySymbol: string

	readonly currencyCode: string

	localizedStringForCurrencyCode(currencyCode: string): string

	readonly collatorIdentifier: string

	localizedStringForCollatorIdentifier(collatorIdentifier: string): string

	readonly quotationBeginDelimiter: string

	readonly quotationEndDelimiter: string

	readonly alternateQuotationBeginDelimiter: string

	readonly alternateQuotationEndDelimiter: string

	static readonly autoupdatingCurrentLocale: NSLocale

	static readonly currentLocale: NSLocale

	static readonly systemLocale: NSLocale

	static localeWithLocaleIdentifier<This extends abstract new (...args: any) => any>(
		this: This,
		ident: string,
	): InstanceType<This>

	static readonly availableLocaleIdentifiers: NSArray

	static readonly ISOLanguageCodes: NSArray

	static readonly ISOCountryCodes: NSArray

	static readonly ISOCurrencyCodes: NSArray

	static readonly commonISOCurrencyCodes: NSArray

	static readonly preferredLanguages: NSArray

	static componentsFromLocaleIdentifier(string: string): NSDictionary

	static localeIdentifierFromComponents(
		dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): string

	static canonicalLocaleIdentifierFromString(string: string): string

	static canonicalLanguageIdentifierFromString(string: string): string

	static localeIdentifierFromWindowsLocaleCode(lcid: number): string

	static windowsLocaleCodeFromLocaleIdentifier(localeIdentifier: string): number

	static characterDirectionForLanguage(
		isoLangCode: string,
	): interop.Enum<typeof NSLocaleLanguageDirection>

	static lineDirectionForLanguage(
		isoLangCode: string,
	): interop.Enum<typeof NSLocaleLanguageDirection>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSBundle extends NSObject {
	static readonly mainBundle: NSBundle

	static bundleWithPath<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
	): InstanceType<This>

	initWithPath(path: string): this

	static bundleWithURL<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
	): InstanceType<This>

	initWithURL(url: NSURL): this

	static bundleForClass(aClass: interop.PointerConvertible): NSBundle

	static bundleWithIdentifier(identifier: string): NSBundle

	static readonly allBundles: NSArray

	static readonly allFrameworks: NSArray

	load(): boolean

	readonly loaded: boolean

	unload(): boolean

	preflightAndReturnError(error: interop.PointerConvertible): boolean

	loadAndReturnError(error: interop.PointerConvertible): boolean

	readonly bundleURL: NSURL

	readonly resourceURL: NSURL

	readonly executableURL: NSURL

	URLForAuxiliaryExecutable(executableName: string): NSURL

	readonly privateFrameworksURL: NSURL

	readonly sharedFrameworksURL: NSURL

	readonly sharedSupportURL: NSURL

	readonly builtInPlugInsURL: NSURL

	readonly appStoreReceiptURL: NSURL

	readonly bundlePath: string

	readonly resourcePath: string

	readonly executablePath: string

	pathForAuxiliaryExecutable(executableName: string): string

	readonly privateFrameworksPath: string

	readonly sharedFrameworksPath: string

	readonly sharedSupportPath: string

	readonly builtInPlugInsPath: string

	static URLForResourceWithExtensionSubdirectoryInBundleWithURL(
		name: string | null,
		ext: string | null,
		subpath: string | null,
		bundleURL: NSURL,
	): NSURL

	static URLsForResourcesWithExtensionSubdirectoryInBundleWithURL(
		ext: string | null,
		subpath: string | null,
		bundleURL: NSURL,
	): NSArray

	URLForResourceWithExtension(name: string | null, ext: string | null): NSURL

	URLForResourceWithExtensionSubdirectory(
		name: string | null,
		ext: string | null,
		subpath: string | null,
	): NSURL

	URLForResourceWithExtensionSubdirectoryLocalization(
		name: string | null,
		ext: string | null,
		subpath: string | null,
		localizationName: string | null,
	): NSURL

	URLsForResourcesWithExtensionSubdirectory(ext: string | null, subpath: string | null): NSArray

	URLsForResourcesWithExtensionSubdirectoryLocalization(
		ext: string | null,
		subpath: string | null,
		localizationName: string | null,
	): NSArray

	static pathForResourceOfTypeInDirectory(
		name: string | null,
		ext: string | null,
		bundlePath: string,
	): string

	static pathsForResourcesOfTypeInDirectory(ext: string | null, bundlePath: string): NSArray

	pathForResourceOfType(name: string | null, ext: string | null): string

	pathForResourceOfTypeInDirectory(
		name: string | null,
		ext: string | null,
		subpath: string | null,
	): string

	pathForResourceOfTypeInDirectoryForLocalization(
		name: string | null,
		ext: string | null,
		subpath: string | null,
		localizationName: string | null,
	): string

	pathsForResourcesOfTypeInDirectory(ext: string | null, subpath: string | null): NSArray

	pathsForResourcesOfTypeInDirectoryForLocalization(
		ext: string | null,
		subpath: string | null,
		localizationName: string | null,
	): NSArray

	localizedStringForKeyValueTable(
		key: string,
		value: string | null,
		tableName: string | null,
	): string

	readonly bundleIdentifier: string

	readonly infoDictionary: NSDictionary

	readonly localizedInfoDictionary: NSDictionary

	objectForInfoDictionaryKey(key: string): interop.Object

	classNamed(className: string): interop.Pointer

	readonly principalClass: interop.Pointer

	readonly preferredLocalizations: NSArray

	readonly localizations: NSArray

	readonly developmentLocalization: string

	static preferredLocalizationsFromArray(
		localizationsArray: NSArray<interop.Object> | Array<interop.Object>,
	): NSArray

	static preferredLocalizationsFromArrayForPreferences(
		localizationsArray: NSArray<interop.Object> | Array<interop.Object>,
		preferencesArray: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSArray

	readonly executableArchitectures: NSArray

	isLoaded(): boolean

	contextHelpForKey(key: string): NSAttributedString

	imageForResource(name: string): NSImage

	pathForImageResource(name: string): string

	URLForImageResource(name: string): NSURL

	loadNibNamedOwnerTopLevelObjects(
		nibName: string,
		owner: interop.Object | null,
		topLevelObjects: interop.PointerConvertible,
	): boolean

	static loadNibFileExternalNameTableWithZone(
		fileName: string,
		context: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		zone: interop.PointerConvertible,
	): boolean

	static loadNibNamedOwner(nibName: string, owner: interop.Object): boolean

	loadNibFileExternalNameTableWithZone(
		fileName: string,
		context: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		zone: interop.PointerConvertible,
	): boolean

	pathForSoundResource(name: string): string

	loadAppleScriptObjectiveCScripts(): void
}

export declare class NSValue extends NSObject implements NSCopying, NSSecureCoding {
	getValueSize(value: interop.PointerConvertible, size: number): void

	readonly objCType: string

	initWithBytesObjCType(value: interop.PointerConvertible, type: string): this

	initWithCoder(coder: NSCoder): this

	static valueWithBytesObjCType(value: interop.PointerConvertible, type: string): NSValue

	static valueWithObjCType(value: interop.PointerConvertible, type: string): NSValue

	static valueWithNonretainedObject(anObject: interop.Object | null): NSValue

	readonly nonretainedObjectValue: interop.Object

	static valueWithPointer(pointer: interop.PointerConvertible): NSValue

	readonly pointerValue: interop.Pointer

	isEqualToValue(value: NSValue): boolean

	getValue(value: interop.PointerConvertible): void

	static valueWithRange(range: _NSRange): NSValue

	readonly rangeValue: _NSRange

	static valueWithPoint(point: CGPoint): NSValue

	static valueWithSize(size: CGSize): NSValue

	static valueWithRect(rect: CGRect): NSValue

	static valueWithEdgeInsets(insets: NSEdgeInsets): NSValue

	readonly pointValue: CGPoint

	readonly sizeValue: CGSize

	readonly rectValue: CGRect

	readonly edgeInsetsValue: NSEdgeInsets

	static valueWithCATransform3D(t: CATransform3D): NSValue

	readonly CATransform3DValue: CATransform3D

	static valueWithSCNVector3(v: SCNVector3): NSValue

	static valueWithSCNVector4(v: SCNVector4): NSValue

	static valueWithSCNMatrix4(v: CATransform3D): NSValue

	readonly SCNVector3Value: SCNVector3

	readonly SCNVector4Value: SCNVector4

	readonly SCNMatrix4Value: CATransform3D

	static valueWithCMTime(time: CMTime): NSValue

	readonly CMTimeValue: CMTime

	static valueWithCMTimeRange(timeRange: CMTimeRange): NSValue

	readonly CMTimeRangeValue: CMTimeRange

	static valueWithCMTimeMapping(timeMapping: CMTimeMapping): NSValue

	readonly CMTimeMappingValue: CMTimeMapping

	static valueWithMKCoordinate(coordinate: CLLocationCoordinate2D): NSValue

	static valueWithMKCoordinateSpan(span: MKCoordinateSpan): NSValue

	readonly MKCoordinateValue: CLLocationCoordinate2D

	readonly MKCoordinateSpanValue: MKCoordinateSpan

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSRelativeDateTimeFormatter extends NSFormatter {
	dateTimeStyle: interop.Enum<typeof NSRelativeDateTimeFormatterStyle>

	unitsStyle: interop.Enum<typeof NSRelativeDateTimeFormatterUnitsStyle>

	formattingContext: interop.Enum<typeof NSFormattingContext>

	calendar: NSCalendar

	locale: NSLocale

	localizedStringFromDateComponents(dateComponents: NSDateComponents): string

	localizedStringFromTimeInterval(timeInterval: number): string

	localizedStringForDateRelativeToDate(date: NSDate, referenceDate: NSDate): string

	stringForObjectValue(obj: interop.Object | null): string
}

export declare class NSUserAppleScriptTask extends NSUserScriptTask {
	executeWithAppleEventCompletionHandler(
		event: NSAppleEventDescriptor | null,
		handler: (p1: NSAppleEventDescriptor, p2: NSError) => void | null,
	): void
}

export declare class NSUserNotification extends NSObject implements NSCopying {
	init(): this

	title: string

	subtitle: string

	informativeText: string

	actionButtonTitle: string

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	deliveryDate: NSDate

	deliveryTimeZone: NSTimeZone

	deliveryRepeatInterval: NSDateComponents

	readonly actualDeliveryDate: NSDate

	readonly presented: boolean

	readonly remote: boolean

	soundName: string

	hasActionButton: boolean

	readonly activationType: interop.Enum<typeof NSUserNotificationActivationType>

	otherButtonTitle: string

	identifier: string

	contentImage: NSImage

	hasReplyButton: boolean

	responsePlaceholder: string

	readonly response: NSAttributedString

	get additionalActions(): NSArray
	set additionalActions(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly additionalActivationAction: NSUserNotificationAction

	isPresented(): boolean

	isRemote(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSFileAccessIntent extends NSObject {
	static readingIntentWithURLOptions<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		options: interop.Enum<typeof NSFileCoordinatorReadingOptions>,
	): InstanceType<This>

	static writingIntentWithURLOptions<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		options: interop.Enum<typeof NSFileCoordinatorWritingOptions>,
	): InstanceType<This>

	readonly URL: NSURL
}

export declare class NSAppleEventManager extends NSObject {
	static sharedAppleEventManager(): NSAppleEventManager

	setEventHandlerAndSelectorForEventClassAndEventID(
		handler: interop.Object,
		handleEventSelector: string,
		eventClass: number,
		eventID: number,
	): void

	removeEventHandlerForEventClassAndEventID(eventClass: number, eventID: number): void

	dispatchRawAppleEventWithRawReplyHandlerRefCon(
		theAppleEvent: interop.PointerConvertible,
		theReply: interop.PointerConvertible,
		handlerRefCon: interop.PointerConvertible,
	): number

	readonly currentAppleEvent: NSAppleEventDescriptor

	readonly currentReplyAppleEvent: NSAppleEventDescriptor

	suspendCurrentAppleEvent(): interop.Pointer

	appleEventForSuspensionID(suspensionID: interop.PointerConvertible): NSAppleEventDescriptor

	replyAppleEventForSuspensionID(suspensionID: interop.PointerConvertible): NSAppleEventDescriptor

	setCurrentAppleEventAndReplyEventWithSuspensionID(suspensionID: interop.PointerConvertible): void

	resumeWithSuspensionID(suspensionID: interop.PointerConvertible): void
}

export declare class NSHashTable<ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSSecureCoding, NSFastEnumeration
{
	initWithOptionsCapacity(
		options: interop.Enum<typeof NSPointerFunctionsOptions>,
		initialCapacity: number,
	): this

	initWithPointerFunctionsCapacity(functions: NSPointerFunctions, initialCapacity: number): this

	static hashTableWithOptions<ObjectType>(
		options: interop.Enum<typeof NSPointerFunctionsOptions>,
	): NSHashTable

	static hashTableWithWeakObjects<ObjectType>(): interop.Object

	static weakObjectsHashTable<ObjectType>(): NSHashTable

	readonly pointerFunctions: NSPointerFunctions

	readonly count: number

	member(object: ObjectType | null): ObjectType

	objectEnumerator(): NSEnumerator

	addObject(object: ObjectType | null): void

	removeObject(object: ObjectType | null): void

	removeAllObjects(): void

	readonly allObjects: NSArray

	readonly anyObject: ObjectType

	containsObject(anObject: ObjectType | null): boolean

	intersectsHashTable(other: NSHashTable): boolean

	isEqualToHashTable(other: NSHashTable): boolean

	isSubsetOfHashTable(other: NSHashTable): boolean

	intersectHashTable(other: NSHashTable): void

	unionHashTable(other: NSHashTable): void

	minusHashTable(other: NSHashTable): void

	readonly setRepresentation: NSSet

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<ObjectType>
}

export declare class NSLogicalTest extends NSScriptWhoseTest {
	initAndTestWithTests(subTests: NSArray<interop.Object> | Array<interop.Object>): this

	initOrTestWithTests(subTests: NSArray<interop.Object> | Array<interop.Object>): this

	initNotTestWithTest(subTest: NSScriptWhoseTest): this
}

export declare class NSExistsCommand extends NSScriptCommand {}

export declare class NSLengthFormatter extends NSFormatter {
	numberFormatter: NSNumberFormatter

	unitStyle: interop.Enum<typeof NSFormattingUnitStyle>

	forPersonHeightUse: boolean

	stringFromValueUnit(value: number, unit: interop.Enum<typeof NSLengthFormatterUnit>): string

	stringFromMeters(numberInMeters: number): string

	unitStringFromValueUnit(value: number, unit: interop.Enum<typeof NSLengthFormatterUnit>): string

	unitStringFromMetersUsedUnit(numberInMeters: number, unitp: interop.PointerConvertible): string

	getObjectValueForStringErrorDescription(
		obj: interop.PointerConvertible,
		string: string,
		error: interop.PointerConvertible,
	): boolean

	isForPersonHeightUse(): boolean
}

export declare class NSRelativeSpecifier extends NSScriptObjectSpecifier {
	initWithCoder(inCoder: NSCoder): this

	initWithContainerClassDescriptionContainerSpecifierKeyRelativePositionBaseSpecifier(
		classDesc: NSScriptClassDescription,
		container: NSScriptObjectSpecifier | null,
		property: string,
		relPos: interop.Enum<typeof NSRelativePosition>,
		baseSpecifier: NSScriptObjectSpecifier | null,
	): this

	relativePosition: interop.Enum<typeof NSRelativePosition>

	baseSpecifier: NSScriptObjectSpecifier
}

export declare class NSURLSessionWebSocketTask extends NSURLSessionTask {
	sendMessageCompletionHandler(
		message: NSURLSessionWebSocketMessage,
		completionHandler: (p1: NSError) => void | null,
	): void

	receiveMessageWithCompletionHandler(
		completionHandler: (p1: NSURLSessionWebSocketMessage, p2: NSError) => void | null,
	): void

	sendPingWithPongReceiveHandler(pongReceiveHandler: (p1: NSError) => void | null): void

	cancelWithCloseCodeReason(
		closeCode: interop.Enum<typeof NSURLSessionWebSocketCloseCode>,
		reason: NSData | null,
	): void

	maximumMessageSize: number

	readonly closeCode: interop.Enum<typeof NSURLSessionWebSocketCloseCode>

	readonly closeReason: NSData
}

export declare class NSXPCListener extends NSObject {
	static serviceListener(): NSXPCListener

	static anonymousListener(): NSXPCListener

	initWithMachServiceName(name: string): this

	delegate: NSXPCListenerDelegate

	readonly endpoint: NSXPCListenerEndpoint

	resume(): void

	suspend(): void

	activate(): void

	invalidate(): void
}

export declare class NSPropertySpecifier extends NSScriptObjectSpecifier {}

export declare class NSMeasurement<UnitType = interop.Object>
	extends NSObject
	implements NSCopying, NSSecureCoding
{
	readonly unit: UnitType

	readonly doubleValue: number

	initWithDoubleValueUnit(doubleValue: number, unit: UnitType): this

	canBeConvertedToUnit(unit: NSUnit): boolean

	measurementByConvertingToUnit(unit: NSUnit): NSMeasurement

	measurementByAddingMeasurement(measurement: NSMeasurement): NSMeasurement

	measurementBySubtractingMeasurement(measurement: NSMeasurement): NSMeasurement

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSMiddleSpecifier extends NSScriptObjectSpecifier {}

export declare class NSScriptExecutionContext extends NSObject {
	static sharedScriptExecutionContext(): NSScriptExecutionContext

	topLevelObject: interop.Object

	objectBeingTested: interop.Object

	rangeContainerObject: interop.Object
}

export declare class NSCondition extends NSObject implements NSLocking {
	wait(): void

	waitUntilDate(limit: NSDate): boolean

	signal(): void

	broadcast(): void

	name: string

	lock(): void

	unlock(): void
}

export declare class NSGarbageCollector extends NSObject {
	static defaultCollector(): interop.Object

	isCollecting(): boolean

	disable(): void

	enable(): void

	isEnabled(): boolean

	collectIfNeeded(): void

	collectExhaustively(): void

	disableCollectorForPointer(ptr: interop.PointerConvertible): void

	enableCollectorForPointer(ptr: interop.PointerConvertible): void

	readonly zone: interop.Pointer
}

export declare class NSAppleEventDescriptor extends NSObject implements NSCopying, NSSecureCoding {
	static nullDescriptor(): NSAppleEventDescriptor

	static descriptorWithDescriptorTypeBytesLength(
		descriptorType: number,
		bytes: interop.PointerConvertible,
		byteCount: number,
	): NSAppleEventDescriptor

	static descriptorWithDescriptorTypeData(
		descriptorType: number,
		data: NSData | null,
	): NSAppleEventDescriptor

	static descriptorWithBoolean(boolean: number): NSAppleEventDescriptor

	static descriptorWithEnumCode(enumerator: number): NSAppleEventDescriptor

	static descriptorWithInt32(signedInt: number): NSAppleEventDescriptor

	static descriptorWithDouble(doubleValue: number): NSAppleEventDescriptor

	static descriptorWithTypeCode(typeCode: number): NSAppleEventDescriptor

	static descriptorWithString(string: string): NSAppleEventDescriptor

	static descriptorWithDate(date: NSDate): NSAppleEventDescriptor

	static descriptorWithFileURL(fileURL: NSURL): NSAppleEventDescriptor

	static appleEventWithEventClassEventIDTargetDescriptorReturnIDTransactionID(
		eventClass: number,
		eventID: number,
		targetDescriptor: NSAppleEventDescriptor | null,
		returnID: number,
		transactionID: number,
	): NSAppleEventDescriptor

	static listDescriptor(): NSAppleEventDescriptor

	static recordDescriptor(): NSAppleEventDescriptor

	static currentProcessDescriptor(): NSAppleEventDescriptor

	static descriptorWithProcessIdentifier(processIdentifier: number): NSAppleEventDescriptor

	static descriptorWithBundleIdentifier(bundleIdentifier: string): NSAppleEventDescriptor

	static descriptorWithApplicationURL(applicationURL: NSURL): NSAppleEventDescriptor

	initWithAEDescNoCopy(aeDesc: interop.PointerConvertible): this

	initWithDescriptorTypeBytesLength(
		descriptorType: number,
		bytes: interop.PointerConvertible,
		byteCount: number,
	): this

	initWithDescriptorTypeData(descriptorType: number, data: NSData | null): this

	initWithEventClassEventIDTargetDescriptorReturnIDTransactionID(
		eventClass: number,
		eventID: number,
		targetDescriptor: NSAppleEventDescriptor | null,
		returnID: number,
		transactionID: number,
	): this

	initListDescriptor(): this

	initRecordDescriptor(): this

	readonly aeDesc: interop.Pointer

	readonly descriptorType: number

	readonly data: NSData

	readonly booleanValue: number

	readonly enumCodeValue: number

	readonly int32Value: number

	readonly doubleValue: number

	readonly typeCodeValue: number

	readonly stringValue: string

	readonly dateValue: NSDate

	readonly fileURLValue: NSURL

	readonly eventClass: number

	readonly eventID: number

	readonly returnID: number

	readonly transactionID: number

	setParamDescriptorForKeyword(descriptor: NSAppleEventDescriptor, keyword: number): void

	paramDescriptorForKeyword(keyword: number): NSAppleEventDescriptor

	removeParamDescriptorWithKeyword(keyword: number): void

	setAttributeDescriptorForKeyword(descriptor: NSAppleEventDescriptor, keyword: number): void

	attributeDescriptorForKeyword(keyword: number): NSAppleEventDescriptor

	sendEventWithOptionsTimeoutError(
		sendOptions: interop.Enum<typeof NSAppleEventSendOptions>,
		timeoutInSeconds: number,
		error: interop.PointerConvertible,
	): NSAppleEventDescriptor

	readonly isRecordDescriptor: boolean

	readonly numberOfItems: number

	insertDescriptorAtIndex(descriptor: NSAppleEventDescriptor, index: number): void

	descriptorAtIndex(index: number): NSAppleEventDescriptor

	removeDescriptorAtIndex(index: number): void

	setDescriptorForKeyword(descriptor: NSAppleEventDescriptor, keyword: number): void

	descriptorForKeyword(keyword: number): NSAppleEventDescriptor

	removeDescriptorWithKeyword(keyword: number): void

	keywordForDescriptorAtIndex(index: number): number

	coerceToDescriptorType(descriptorType: number): NSAppleEventDescriptor

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSURLSessionUploadTask extends NSURLSessionDataTask {
	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class NSPurgeableData extends NSMutableData implements NSDiscardableContent {
	beginContentAccess(): boolean

	endContentAccess(): void

	discardContentIfPossible(): void

	isContentDiscarded(): boolean
}

export declare class NSXMLNode extends NSObject implements NSCopying {
	init(): this

	initWithKind(kind: interop.Enum<typeof NSXMLNodeKind>): this

	initWithKindOptions(
		kind: interop.Enum<typeof NSXMLNodeKind>,
		options: interop.Enum<typeof NSXMLNodeOptions>,
	): this

	static document(): interop.Object

	static documentWithRootElement(element: NSXMLElement): interop.Object

	static elementWithName(name: string): interop.Object

	static elementWithNameURI(name: string, URI: string): interop.Object

	static elementWithNameStringValue(name: string, string: string): interop.Object

	static elementWithNameChildrenAttributes(
		name: string,
		children: NSArray<interop.Object> | Array<interop.Object> | null,
		attributes: NSArray<interop.Object> | Array<interop.Object> | null,
	): interop.Object

	static attributeWithNameStringValue(name: string, stringValue: string): interop.Object

	static attributeWithNameURIStringValue(
		name: string,
		URI: string,
		stringValue: string,
	): interop.Object

	static namespaceWithNameStringValue(name: string, stringValue: string): interop.Object

	static processingInstructionWithNameStringValue(name: string, stringValue: string): interop.Object

	static commentWithStringValue(stringValue: string): interop.Object

	static textWithStringValue(stringValue: string): interop.Object

	static DTDNodeWithXMLString(string: string): interop.Object

	readonly kind: interop.Enum<typeof NSXMLNodeKind>

	name: string

	objectValue: interop.Object

	stringValue: string

	setStringValueResolvingEntities(string: string, resolve: boolean): void

	readonly index: number

	readonly level: number

	readonly rootDocument: NSXMLDocument

	readonly parent: NSXMLNode

	readonly childCount: number

	readonly children: NSArray

	childAtIndex(index: number): NSXMLNode

	readonly previousSibling: NSXMLNode

	readonly nextSibling: NSXMLNode

	readonly previousNode: NSXMLNode

	readonly nextNode: NSXMLNode

	detach(): void

	readonly XPath: string

	readonly localName: string

	readonly prefix: string

	URI: string

	static localNameForName(name: string): string

	static prefixForName(name: string): string

	static predefinedNamespaceForPrefix(name: string): NSXMLNode

	readonly description: string

	readonly XMLString: string

	XMLStringWithOptions(options: interop.Enum<typeof NSXMLNodeOptions>): string

	canonicalXMLStringPreservingComments(comments: boolean): string

	nodesForXPathError(xpath: string, error: interop.PointerConvertible): NSArray

	objectsForXQueryConstantsError(
		xquery: string,
		constants:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): NSArray

	objectsForXQueryError(xquery: string, error: interop.PointerConvertible): NSArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSTask extends NSObject {
	init(): this

	executableURL: NSURL

	get arguments$(): NSArray
	set arguments$(value: NSArray<interop.Object> | Array<interop.Object>)

	get environment(): NSDictionary
	set environment(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	currentDirectoryURL: NSURL

	standardInput: interop.Object

	standardOutput: interop.Object

	standardError: interop.Object

	launchAndReturnError(error: interop.PointerConvertible): boolean

	interrupt(): void

	terminate(): void

	suspend(): boolean

	resume(): boolean

	readonly processIdentifier: number

	readonly running: boolean

	readonly terminationStatus: number

	readonly terminationReason: interop.Enum<typeof NSTaskTerminationReason>

	terminationHandler: (p1: NSTask) => void

	qualityOfService: interop.Enum<typeof NSQualityOfService>

	arguments(): NSArray | null

	isRunning(): boolean

	static launchedTaskWithExecutableURLArgumentsErrorTerminationHandler(
		url: NSURL,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
		terminationHandler: (p1: NSTask) => void | null,
	): NSTask

	waitUntilExit(): void

	launchPath: string

	currentDirectoryPath: string

	launch(): void

	static launchedTaskWithLaunchPathArguments(
		path: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
	): NSTask
}

export declare class NSProgress extends NSObject {
	static currentProgress(): NSProgress

	static progressWithTotalUnitCount(unitCount: number): NSProgress

	static discreteProgressWithTotalUnitCount(unitCount: number): NSProgress

	static progressWithTotalUnitCountParentPendingUnitCount(
		unitCount: number,
		parent: NSProgress,
		portionOfParentTotalUnitCount: number,
	): NSProgress

	initWithParentUserInfo(
		parentProgressOrNil: NSProgress | null,
		userInfoOrNil:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	becomeCurrentWithPendingUnitCount(unitCount: number): void

	performAsCurrentWithPendingUnitCountUsingBlock(unitCount: number, work: () => void): void

	resignCurrent(): void

	addChildWithPendingUnitCount(child: NSProgress, inUnitCount: number): void

	totalUnitCount: number

	completedUnitCount: number

	localizedDescription: string

	localizedAdditionalDescription: string

	cancellable: boolean

	pausable: boolean

	readonly cancelled: boolean

	readonly paused: boolean

	cancellationHandler: () => void

	pausingHandler: () => void

	resumingHandler: () => void

	setUserInfoObjectForKey(objectOrNil: interop.Object | null, key: string): void

	readonly indeterminate: boolean

	readonly fractionCompleted: number

	readonly finished: boolean

	cancel(): void

	pause(): void

	resume(): void

	readonly userInfo: NSDictionary

	kind: string

	estimatedTimeRemaining: NSNumber

	throughput: NSNumber

	fileOperationKind: string

	fileURL: NSURL

	fileTotalCount: NSNumber

	fileCompletedCount: NSNumber

	publish(): void

	unpublish(): void

	static addSubscriberForFileURLWithPublishingHandler(
		url: NSURL,
		publishingHandler: (p1: NSProgress) => () => void,
	): interop.Object

	static removeSubscriber(subscriber: interop.Object): void

	readonly old: boolean

	isCancellable(): boolean

	isPausable(): boolean

	isCancelled(): boolean

	isPaused(): boolean

	isIndeterminate(): boolean

	isFinished(): boolean

	isOld(): boolean
}

export declare class NSGetCommand extends NSScriptCommand {}

export declare class NSSocketPortNameServer extends NSPortNameServer {
	static sharedInstance(): interop.Object

	portForName(name: string): NSPort

	portForNameHost(name: string, host: string | null): NSPort

	registerPortName(port: NSPort, name: string): boolean

	removePortForName(name: string): boolean

	portForNameHostNameServerPortNumber(name: string, host: string | null, portNumber: number): NSPort

	registerPortNameNameServerPortNumber(port: NSPort, name: string, portNumber: number): boolean

	defaultNameServerPortNumber: number
}

export declare class NSMessagePortNameServer extends NSPortNameServer {
	static sharedInstance(): interop.Object

	portForName(name: string): NSPort

	portForNameHost(name: string, host: string | null): NSPort
}

export declare class NSPortNameServer extends NSObject {
	static systemDefaultPortNameServer(): NSPortNameServer

	portForName(name: string): NSPort

	portForNameHost(name: string, host: string | null): NSPort

	registerPortName(port: NSPort, name: string): boolean

	removePortForName(name: string): boolean
}

export declare class NSOperationQueue extends NSObject implements NSProgressReporting {
	readonly progress: NSProgress

	addOperation(op: NSOperation): void

	addOperationsWaitUntilFinished(
		ops: NSArray<interop.Object> | Array<interop.Object>,
		wait: boolean,
	): void

	addOperationWithBlock(block: () => void): void

	addBarrierBlock(barrier: () => void): void

	maxConcurrentOperationCount: number

	suspended: boolean

	name: string

	qualityOfService: interop.Enum<typeof NSQualityOfService>

	underlyingQueue: NSObject

	cancelAllOperations(): void

	waitUntilAllOperationsAreFinished(): void

	static readonly currentQueue: NSOperationQueue

	static readonly mainQueue: NSOperationQueue

	isSuspended(): boolean

	readonly operations: NSArray

	readonly operationCount: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class NSPortMessage extends NSObject {
	initWithSendPortReceivePortComponents(
		sendPort: NSPort | null,
		replyPort: NSPort | null,
		components: NSArray<interop.Object> | Array<interop.Object> | null,
	): this

	readonly components: NSArray

	readonly receivePort: NSPort

	readonly sendPort: NSPort

	sendBeforeDate(date: NSDate): boolean

	msgid: number
}

export declare class NSPortCoder extends NSCoder {
	isBycopy(): boolean

	isByref(): boolean

	encodePortObject(aport: NSPort): void

	decodePortObject(): NSPort

	connection(): NSConnection

	static portCoderWithReceivePortSendPortComponents(
		rcvPort: NSPort | null,
		sndPort: NSPort | null,
		comps: NSArray<interop.Object> | Array<interop.Object> | null,
	): interop.Object

	initWithReceivePortSendPortComponents(
		rcvPort: NSPort | null,
		sndPort: NSPort | null,
		comps: NSArray<interop.Object> | Array<interop.Object> | null,
	): this

	dispatch(): void
}

export declare class NSISO8601DateFormatter extends NSFormatter implements NSSecureCoding {
	timeZone: NSTimeZone

	formatOptions: interop.Enum<typeof NSISO8601DateFormatOptions>

	init(): this

	stringFromDate(date: NSDate): string

	dateFromString(string: string): NSDate

	static stringFromDateTimeZoneFormatOptions(
		date: NSDate,
		timeZone: NSTimeZone,
		formatOptions: interop.Enum<typeof NSISO8601DateFormatOptions>,
	): string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSScriptClassDescription extends NSClassDescription {
	static classDescriptionForClass(aClass: interop.PointerConvertible): NSClassDescription
	static classDescriptionForClass(aClass: interop.PointerConvertible): NSScriptClassDescription

	initWithSuiteNameClassNameDictionary(
		suiteName: string,
		className: string,
		classDeclaration:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	readonly suiteName: string

	readonly className: string

	readonly implementationClassName: string

	readonly superclassDescription: NSScriptClassDescription

	readonly appleEventCode: number

	matchesAppleEventCode(appleEventCode: number): boolean

	supportsCommand(commandDescription: NSScriptCommandDescription): boolean

	selectorForCommand(commandDescription: NSScriptCommandDescription): string

	typeForKey(key: string): string

	classDescriptionForKey(key: string): NSScriptClassDescription

	appleEventCodeForKey(key: string): number

	keyWithAppleEventCode(appleEventCode: number): string

	readonly defaultSubcontainerAttributeKey: string

	isLocationRequiredToCreateForKey(toManyRelationshipKey: string): boolean

	hasPropertyForKey(key: string): boolean

	hasOrderedToManyRelationshipForKey(key: string): boolean

	hasReadablePropertyForKey(key: string): boolean

	hasWritablePropertyForKey(key: string): boolean

	isReadOnlyKey(key: string): boolean
}

export declare class NSDistantObjectRequest extends NSObject {
	readonly invocation: NSInvocation

	readonly connection: NSConnection

	readonly conversation: interop.Object

	replyWithException(exception: NSException | null): void
}

export declare class NSUnarchiver extends NSCoder {
	initForReadingWithData(data: NSData): this

	setObjectZone(zone: interop.PointerConvertible): void

	objectZone(): interop.Pointer

	readonly atEnd: boolean

	readonly systemVersion: number

	static unarchiveObjectWithData(data: NSData): interop.Object

	static unarchiveObjectWithFile(path: string): interop.Object

	static decodeClassNameAsClassName(inArchiveName: string, trueName: string): void

	decodeClassNameAsClassName(inArchiveName: string, trueName: string): void

	static classNameDecodedForArchiveClassName(inArchiveName: string): string

	classNameDecodedForArchiveClassName(inArchiveName: string): string

	replaceObjectWithObject(object: interop.Object, newObject: interop.Object): void

	isAtEnd(): boolean
}

export declare class NSAffineTransform extends NSObject implements NSCopying, NSSecureCoding {
	static transform(): NSAffineTransform

	initWithTransform(transform: NSAffineTransform): this

	init(): this

	translateXByYBy(deltaX: number, deltaY: number): void

	rotateByDegrees(angle: number): void

	rotateByRadians(angle: number): void

	scaleBy(scale: number): void

	scaleXByYBy(scaleX: number, scaleY: number): void

	invert(): void

	appendTransform(transform: NSAffineTransform): void

	prependTransform(transform: NSAffineTransform): void

	transformPoint(aPoint: CGPoint): CGPoint

	transformSize(aSize: CGSize): CGSize

	transformStruct: NSAffineTransformStruct

	transformBezierPath(path: NSBezierPath): NSBezierPath

	set(): void

	concat(): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSWhoseSpecifier extends NSScriptObjectSpecifier {
	initWithCoder(inCoder: NSCoder): this

	initWithContainerClassDescriptionContainerSpecifierKeyTest(
		classDesc: NSScriptClassDescription,
		container: NSScriptObjectSpecifier | null,
		property: string,
		test: NSScriptWhoseTest,
	): this

	test: NSScriptWhoseTest

	startSubelementIdentifier: interop.Enum<typeof NSWhoseSubelementIdentifier>

	startSubelementIndex: number

	endSubelementIdentifier: interop.Enum<typeof NSWhoseSubelementIdentifier>

	endSubelementIndex: number
}

export declare class NSURLHandle extends NSObject {
	static registerURLHandleClass(anURLHandleSubclass: interop.PointerConvertible): void

	static URLHandleClassForURL(anURL: NSURL): interop.Pointer

	status(): interop.Enum<typeof NSURLHandleStatus>

	failureReason(): string

	addClient(client: NSURLHandleClient): void

	removeClient(client: NSURLHandleClient): void

	loadInBackground(): void

	cancelLoadInBackground(): void

	resourceData(): NSData

	availableResourceData(): NSData

	expectedResourceDataSize(): number

	flushCachedData(): void

	backgroundLoadDidFailWithReason(reason: string): void

	didLoadBytesLoadComplete(newBytes: NSData, yorn: boolean): void

	static canInitWithURL(anURL: NSURL): boolean

	static cachedHandleForURL(anURL: NSURL): NSURLHandle

	initWithURLCached(anURL: NSURL, willCache: boolean): this

	propertyForKey(propertyKey: string): interop.Object

	propertyForKeyIfAvailable(propertyKey: string): interop.Object

	writePropertyForKey(propertyValue: interop.Object, propertyKey: string): boolean

	writeData(data: NSData): boolean

	loadInForeground(): NSData

	beginLoadInBackground(): void

	endLoadInBackground(): void
}

export declare class NSURL
	extends NSObject
	implements
		NSSecureCoding,
		NSCopying,
		NSItemProviderReading,
		NSItemProviderWriting,
		NSPasteboardWriting,
		NSPasteboardReading,
		QLPreviewItem
{
	initWithSchemeHostPath(scheme: string, host: string | null, path: string): this

	initFileURLWithPathIsDirectoryRelativeToURL(
		path: string,
		isDir: boolean,
		baseURL: NSURL | null,
	): this

	initFileURLWithPathRelativeToURL(path: string, baseURL: NSURL | null): this

	initFileURLWithPathIsDirectory(path: string, isDir: boolean): this

	initFileURLWithPath(path: string): this

	static fileURLWithPathIsDirectoryRelativeToURL(
		path: string,
		isDir: boolean,
		baseURL: NSURL | null,
	): NSURL

	static fileURLWithPathRelativeToURL(path: string, baseURL: NSURL | null): NSURL

	static fileURLWithPathIsDirectory(path: string, isDir: boolean): NSURL

	static fileURLWithPath(path: string): NSURL

	initFileURLWithFileSystemRepresentationIsDirectoryRelativeToURL(
		path: string,
		isDir: boolean,
		baseURL: NSURL | null,
	): this

	static fileURLWithFileSystemRepresentationIsDirectoryRelativeToURL(
		path: string,
		isDir: boolean,
		baseURL: NSURL | null,
	): NSURL

	initWithString(URLString: string): this

	initWithStringRelativeToURL(URLString: string, baseURL: NSURL | null): this

	static URLWithString<This extends abstract new (...args: any) => any>(
		this: This,
		URLString: string,
	): InstanceType<This>

	static URLWithStringRelativeToURL<This extends abstract new (...args: any) => any>(
		this: This,
		URLString: string,
		baseURL: NSURL | null,
	): InstanceType<This>

	initWithDataRepresentationRelativeToURL(data: NSData, baseURL: NSURL | null): this

	static URLWithDataRepresentationRelativeToURL(data: NSData, baseURL: NSURL | null): NSURL

	initAbsoluteURLWithDataRepresentationRelativeToURL(data: NSData, baseURL: NSURL | null): this

	static absoluteURLWithDataRepresentationRelativeToURL(data: NSData, baseURL: NSURL | null): NSURL

	readonly dataRepresentation: NSData

	readonly absoluteString: string

	readonly relativeString: string

	readonly baseURL: NSURL

	readonly absoluteURL: NSURL

	readonly scheme: string

	readonly resourceSpecifier: string

	readonly host: string

	readonly port: NSNumber

	readonly user: string

	readonly password: string

	readonly path: string

	readonly fragment: string

	readonly parameterString: string

	readonly query: string

	readonly relativePath: string

	readonly hasDirectoryPath: boolean

	getFileSystemRepresentationMaxLength(buffer: string, maxBufferLength: number): boolean

	readonly fileSystemRepresentation: string

	readonly fileURL: boolean

	readonly standardizedURL: NSURL

	isFileReferenceURL(): boolean

	fileReferenceURL(): NSURL

	readonly filePathURL: NSURL

	getResourceValueForKeyError(
		value: interop.PointerConvertible,
		key: string,
		error: interop.PointerConvertible,
	): boolean

	resourceValuesForKeysError(
		keys: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): NSDictionary

	setResourceValueForKeyError(
		value: interop.Object | null,
		key: string,
		error: interop.PointerConvertible,
	): boolean

	setResourceValuesError(
		keyedValues:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): boolean

	removeCachedResourceValueForKey(key: string): void

	removeAllCachedResourceValues(): void

	setTemporaryResourceValueForKey(value: interop.Object | null, key: string): void

	bookmarkDataWithOptionsIncludingResourceValuesForKeysRelativeToURLError(
		options: interop.Enum<typeof NSURLBookmarkCreationOptions>,
		keys: NSArray<interop.Object> | Array<interop.Object> | null,
		relativeURL: NSURL | null,
		error: interop.PointerConvertible,
	): NSData

	initByResolvingBookmarkDataOptionsRelativeToURLBookmarkDataIsStaleError(
		bookmarkData: NSData,
		options: interop.Enum<typeof NSURLBookmarkResolutionOptions>,
		relativeURL: NSURL | null,
		isStale: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): this

	static URLByResolvingBookmarkDataOptionsRelativeToURLBookmarkDataIsStaleError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		bookmarkData: NSData,
		options: interop.Enum<typeof NSURLBookmarkResolutionOptions>,
		relativeURL: NSURL | null,
		isStale: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static resourceValuesForKeysFromBookmarkData(
		keys: NSArray<interop.Object> | Array<interop.Object>,
		bookmarkData: NSData,
	): NSDictionary

	static writeBookmarkDataToURLOptionsError(
		bookmarkData: NSData,
		bookmarkFileURL: NSURL,
		options: number,
		error: interop.PointerConvertible,
	): boolean

	static bookmarkDataWithContentsOfURLError(
		bookmarkFileURL: NSURL,
		error: interop.PointerConvertible,
	): NSData

	static URLByResolvingAliasFileAtURLOptionsError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		options: interop.Enum<typeof NSURLBookmarkResolutionOptions>,
		error: interop.PointerConvertible,
	): InstanceType<This>

	startAccessingSecurityScopedResource(): boolean

	stopAccessingSecurityScopedResource(): void

	isFileURL(): boolean

	getPromisedItemResourceValueForKeyError(
		value: interop.PointerConvertible,
		key: string,
		error: interop.PointerConvertible,
	): boolean

	promisedItemResourceValuesForKeysError(
		keys: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): NSDictionary

	checkPromisedItemIsReachableAndReturnError(error: interop.PointerConvertible): boolean

	static fileURLWithPathComponents(
		components: NSArray<interop.Object> | Array<interop.Object>,
	): NSURL

	readonly pathComponents: NSArray

	readonly lastPathComponent: string

	readonly pathExtension: string

	URLByAppendingPathComponent(pathComponent: string): NSURL

	URLByAppendingPathComponentIsDirectory(pathComponent: string, isDirectory: boolean): NSURL

	readonly URLByDeletingLastPathComponent: NSURL

	URLByAppendingPathExtension(pathExtension: string): NSURL

	readonly URLByDeletingPathExtension: NSURL

	checkResourceIsReachableAndReturnError(error: interop.PointerConvertible): boolean

	readonly URLByStandardizingPath: NSURL

	readonly URLByResolvingSymlinksInPath: NSURL

	resourceDataUsingCache(shouldUseCache: boolean): NSData

	loadResourceDataNotifyingClientUsingCache(client: interop.Object, shouldUseCache: boolean): void

	propertyForKey(propertyKey: string): interop.Object

	setResourceData(data: NSData): boolean

	setPropertyForKey(property: interop.Object, propertyKey: string): boolean

	URLHandleUsingCache(shouldUseCache: boolean): NSURLHandle

	static URLFromPasteboard(pasteBoard: NSPasteboard): NSURL

	writeToPasteboard(pasteBoard: NSPasteboard): void

	URLByAppendingPathComponentConformingToType(partialName: string, contentType: UTType): NSURL

	URLByAppendingPathExtensionForType(contentType: UTType): NSURL

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly readableTypeIdentifiersForItemProvider: NSArray

	static objectWithItemProviderDataTypeIdentifierError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		data: NSData,
		typeIdentifier: string,
		outError: interop.PointerConvertible,
	): InstanceType<This>

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	static readonly writableTypeIdentifiersForItemProvider: NSArray

	readonly writableTypeIdentifiersForItemProvider: NSArray

	static itemProviderVisibilityForRepresentationWithTypeIdentifier(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>

	itemProviderVisibilityForRepresentationWithTypeIdentifier(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>

	loadDataWithTypeIdentifierForItemProviderCompletionHandler(
		typeIdentifier: string,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): NSProgress

	writableTypesForPasteboard(pasteboard: NSPasteboard): NSArray

	writingOptionsForTypePasteboard(
		type: string,
		pasteboard: NSPasteboard,
	): interop.Enum<typeof NSPasteboardWritingOptions>

	pasteboardPropertyListForType(type: string): interop.Object

	static readableTypesForPasteboard(pasteboard: NSPasteboard): NSArray

	static readingOptionsForTypePasteboard(
		type: string,
		pasteboard: NSPasteboard,
	): interop.Enum<typeof NSPasteboardReadingOptions>

	initWithPasteboardPropertyListOfType(propertyList: interop.Object, type: string): this

	readonly previewItemURL: NSURL

	readonly previewItemTitle: string

	readonly previewItemDisplayState: interop.Object
}

export declare class NSProxy extends NativeObject implements NSObjectProtocol {
	static alloc<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static allocWithZone<This extends abstract new (...args: any) => any>(
		this: This,
		zone: interop.PointerConvertible,
	): InstanceType<This>

	static class(): interop.Pointer

	forwardInvocation(invocation: NSInvocation): void

	methodSignatureForSelector(sel: string): NSMethodSignature

	dealloc(): void

	finalize(): void

	readonly description: string

	readonly debugDescription: string

	static respondsToSelector(aSelector: string): boolean

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer
}

export declare class NSUserActivity extends NSObject {
	initWithActivityType(activityType: string): this

	init(): this

	readonly activityType: string

	title: string

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	addUserInfoEntriesFromDictionary(
		otherDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	requiredUserInfoKeys: NSSet

	needsSave: boolean

	webpageURL: NSURL

	referrerURL: NSURL

	expirationDate: NSDate

	keywords: NSSet

	supportsContinuationStreams: boolean

	delegate: NSUserActivityDelegate

	targetContentIdentifier: string

	becomeCurrent(): void

	resignCurrent(): void

	invalidate(): void

	getContinuationStreamsWithCompletionHandler(
		completionHandler: (p1: NSInputStream, p2: NSOutputStream, p3: NSError) => void | null,
	): void

	eligibleForHandoff: boolean

	eligibleForSearch: boolean

	eligibleForPublicIndexing: boolean

	persistentIdentifier: string

	static deleteSavedUserActivitiesWithPersistentIdentifiersCompletionHandler(
		persistentIdentifiers: NSArray<interop.Object> | Array<interop.Object>,
		handler: () => void,
	): void

	static deleteAllSavedUserActivitiesWithCompletionHandler(handler: () => void): void

	isEligibleForHandoff(): boolean

	isEligibleForSearch(): boolean

	isEligibleForPublicIndexing(): boolean

	readonly detectedBarcodeDescriptor: CIBarcodeDescriptor

	mapItem: MKMapItem

	readonly isClassKitDeepLink: boolean

	readonly contextIdentifierPath: NSArray

	contentAttributeSet: CSSearchableItemAttributeSet
}

export declare class NSURLSessionTaskMetrics extends NSObject {
	readonly transactionMetrics: NSArray

	readonly taskInterval: NSDateInterval

	readonly redirectCount: number

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class NSIndexSet
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding
{
	static indexSet<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static indexSetWithIndex<This extends abstract new (...args: any) => any>(
		this: This,
		value: number,
	): InstanceType<This>

	static indexSetWithIndexesInRange<This extends abstract new (...args: any) => any>(
		this: This,
		range: _NSRange,
	): InstanceType<This>

	initWithIndexesInRange(range: _NSRange): this

	initWithIndexSet(indexSet: NSIndexSet): this

	initWithIndex(value: number): this

	isEqualToIndexSet(indexSet: NSIndexSet): boolean

	readonly count: number

	readonly firstIndex: number

	readonly lastIndex: number

	indexGreaterThanIndex(value: number): number

	indexLessThanIndex(value: number): number

	indexGreaterThanOrEqualToIndex(value: number): number

	indexLessThanOrEqualToIndex(value: number): number

	getIndexesMaxCountInIndexRange(
		indexBuffer: interop.PointerConvertible,
		bufferSize: number,
		range: interop.PointerConvertible,
	): number

	countOfIndexesInRange(range: _NSRange): number

	containsIndex(value: number): boolean

	containsIndexesInRange(range: _NSRange): boolean

	containsIndexes(indexSet: NSIndexSet): boolean

	intersectsIndexesInRange(range: _NSRange): boolean

	enumerateIndexesUsingBlock(block: (p1: number, p2: interop.PointerConvertible) => void): void

	enumerateIndexesWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: number, p2: interop.PointerConvertible) => void,
	): void

	enumerateIndexesInRangeOptionsUsingBlock(
		range: _NSRange,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: number, p2: interop.PointerConvertible) => void,
	): void

	indexPassingTest(predicate: (p1: number, p2: interop.PointerConvertible) => boolean): number

	indexWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: number, p2: interop.PointerConvertible) => boolean,
	): number

	indexInRangeOptionsPassingTest(
		range: _NSRange,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: number, p2: interop.PointerConvertible) => boolean,
	): number

	indexesPassingTest(predicate: (p1: number, p2: interop.PointerConvertible) => boolean): NSIndexSet

	indexesWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: number, p2: interop.PointerConvertible) => boolean,
	): NSIndexSet

	indexesInRangeOptionsPassingTest(
		range: _NSRange,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: number, p2: interop.PointerConvertible) => boolean,
	): NSIndexSet

	enumerateRangesUsingBlock(block: (p1: _NSRange, p2: interop.PointerConvertible) => void): void

	enumerateRangesWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: _NSRange, p2: interop.PointerConvertible) => void,
	): void

	enumerateRangesInRangeOptionsUsingBlock(
		range: _NSRange,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: _NSRange, p2: interop.PointerConvertible) => void,
	): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSURLSessionTaskTransactionMetrics extends NSObject {
	readonly request: NSURLRequest

	readonly response: NSURLResponse

	readonly fetchStartDate: NSDate

	readonly domainLookupStartDate: NSDate

	readonly domainLookupEndDate: NSDate

	readonly connectStartDate: NSDate

	readonly secureConnectionStartDate: NSDate

	readonly secureConnectionEndDate: NSDate

	readonly connectEndDate: NSDate

	readonly requestStartDate: NSDate

	readonly requestEndDate: NSDate

	readonly responseStartDate: NSDate

	readonly responseEndDate: NSDate

	readonly networkProtocolName: string

	readonly proxyConnection: boolean

	readonly reusedConnection: boolean

	readonly resourceFetchType: interop.Enum<typeof NSURLSessionTaskMetricsResourceFetchType>

	readonly countOfRequestHeaderBytesSent: number

	readonly countOfRequestBodyBytesSent: number

	readonly countOfRequestBodyBytesBeforeEncoding: number

	readonly countOfResponseHeaderBytesReceived: number

	readonly countOfResponseBodyBytesReceived: number

	readonly countOfResponseBodyBytesAfterDecoding: number

	readonly localAddress: string

	readonly localPort: NSNumber

	readonly remoteAddress: string

	readonly remotePort: NSNumber

	readonly negotiatedTLSProtocolVersion: NSNumber

	readonly negotiatedTLSCipherSuite: NSNumber

	readonly cellular: boolean

	readonly expensive: boolean

	readonly constrained: boolean

	readonly multipath: boolean

	readonly domainResolutionProtocol: interop.Enum<
		typeof NSURLSessionTaskMetricsDomainResolutionProtocol
	>

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	isProxyConnection(): boolean

	isReusedConnection(): boolean

	isCellular(): boolean

	isExpensive(): boolean

	isConstrained(): boolean

	isMultipath(): boolean
}

export declare class NSURLSessionWebSocketMessage extends NSObject {
	initWithData(data: NSData): this

	initWithString(string: string): this

	readonly type: interop.Enum<typeof NSURLSessionWebSocketMessageType>

	readonly data: NSData

	readonly string: string
}

export declare class NSUbiquitousKeyValueStore extends NSObject {
	static readonly defaultStore: NSUbiquitousKeyValueStore

	objectForKey(aKey: string): interop.Object

	setObjectForKey(anObject: interop.Object | null, aKey: string): void

	removeObjectForKey(aKey: string): void

	stringForKey(aKey: string): string

	arrayForKey(aKey: string): NSArray

	dictionaryForKey(aKey: string): NSDictionary

	dataForKey(aKey: string): NSData

	longLongForKey(aKey: string): number

	doubleForKey(aKey: string): number

	boolForKey(aKey: string): boolean

	setStringForKey(aString: string | null, aKey: string): void

	setDataForKey(aData: NSData | null, aKey: string): void

	setArrayForKey(
		anArray: NSArray<interop.Object> | Array<interop.Object> | null,
		aKey: string,
	): void

	setDictionaryForKey(
		aDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		aKey: string,
	): void

	setLongLongForKey(value: number, aKey: string): void

	setDoubleForKey(value: number, aKey: string): void

	setBoolForKey(value: boolean, aKey: string): void

	readonly dictionaryRepresentation: NSDictionary

	synchronize(): boolean
}

export declare class NSBlockOperation extends NSOperation {
	static blockOperationWithBlock<This extends abstract new (...args: any) => any>(
		this: This,
		block: () => void,
	): InstanceType<This>

	addExecutionBlock(block: () => void): void

	readonly executionBlocks: NSArray
}

export declare class NSURLSessionConfiguration extends NSObject implements NSCopying {
	static readonly defaultSessionConfiguration: NSURLSessionConfiguration

	static readonly ephemeralSessionConfiguration: NSURLSessionConfiguration

	static backgroundSessionConfigurationWithIdentifier(identifier: string): NSURLSessionConfiguration

	readonly identifier: string

	requestCachePolicy: interop.Enum<typeof NSURLRequestCachePolicy>

	timeoutIntervalForRequest: number

	timeoutIntervalForResource: number

	networkServiceType: interop.Enum<typeof NSURLRequestNetworkServiceType>

	allowsCellularAccess: boolean

	allowsExpensiveNetworkAccess: boolean

	allowsConstrainedNetworkAccess: boolean

	waitsForConnectivity: boolean

	discretionary: boolean

	sharedContainerIdentifier: string

	sessionSendsLaunchEvents: boolean

	get connectionProxyDictionary(): NSDictionary
	set connectionProxyDictionary(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	TLSMinimumSupportedProtocol: interop.Enum<typeof SSLProtocol>

	TLSMaximumSupportedProtocol: interop.Enum<typeof SSLProtocol>

	TLSMinimumSupportedProtocolVersion: interop.Enum<typeof tls_protocol_version_t>

	TLSMaximumSupportedProtocolVersion: interop.Enum<typeof tls_protocol_version_t>

	HTTPShouldUsePipelining: boolean

	HTTPShouldSetCookies: boolean

	HTTPCookieAcceptPolicy: interop.Enum<typeof NSHTTPCookieAcceptPolicy>

	get HTTPAdditionalHeaders(): NSDictionary
	set HTTPAdditionalHeaders(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	HTTPMaximumConnectionsPerHost: number

	HTTPCookieStorage: NSHTTPCookieStorage

	URLCredentialStorage: NSURLCredentialStorage

	URLCache: NSURLCache

	shouldUseExtendedBackgroundIdleMode: boolean

	get protocolClasses(): NSArray
	set protocolClasses(value: NSArray<interop.Object> | Array<interop.Object>)

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	isDiscretionary(): boolean

	static backgroundSessionConfiguration(identifier: string): NSURLSessionConfiguration

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSDateFormatter extends NSFormatter {
	formattingContext: interop.Enum<typeof NSFormattingContext>

	getObjectValueForStringRangeError(
		obj: interop.PointerConvertible,
		string: string,
		rangep: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	stringFromDate(date: NSDate): string

	dateFromString(string: string): NSDate

	static localizedStringFromDateDateStyleTimeStyle(
		date: NSDate,
		dstyle: interop.Enum<typeof NSDateFormatterStyle>,
		tstyle: interop.Enum<typeof NSDateFormatterStyle>,
	): string

	static dateFormatFromTemplateOptionsLocale(
		tmplate: string,
		opts: number,
		locale: NSLocale | null,
	): string

	static defaultFormatterBehavior: interop.Enum<typeof NSDateFormatterBehavior>

	setLocalizedDateFormatFromTemplate(dateFormatTemplate: string): void

	dateFormat: string

	dateStyle: interop.Enum<typeof NSDateFormatterStyle>

	timeStyle: interop.Enum<typeof NSDateFormatterStyle>

	locale: NSLocale

	generatesCalendarDates: boolean

	formatterBehavior: interop.Enum<typeof NSDateFormatterBehavior>

	timeZone: NSTimeZone

	calendar: NSCalendar

	lenient: boolean

	twoDigitStartDate: NSDate

	defaultDate: NSDate

	get eraSymbols(): NSArray
	set eraSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get monthSymbols(): NSArray
	set monthSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get shortMonthSymbols(): NSArray
	set shortMonthSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get weekdaySymbols(): NSArray
	set weekdaySymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get shortWeekdaySymbols(): NSArray
	set shortWeekdaySymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	AMSymbol: string

	PMSymbol: string

	get longEraSymbols(): NSArray
	set longEraSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get veryShortMonthSymbols(): NSArray
	set veryShortMonthSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get standaloneMonthSymbols(): NSArray
	set standaloneMonthSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get shortStandaloneMonthSymbols(): NSArray
	set shortStandaloneMonthSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get veryShortStandaloneMonthSymbols(): NSArray
	set veryShortStandaloneMonthSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get veryShortWeekdaySymbols(): NSArray
	set veryShortWeekdaySymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get standaloneWeekdaySymbols(): NSArray
	set standaloneWeekdaySymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get shortStandaloneWeekdaySymbols(): NSArray
	set shortStandaloneWeekdaySymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get veryShortStandaloneWeekdaySymbols(): NSArray
	set veryShortStandaloneWeekdaySymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get quarterSymbols(): NSArray
	set quarterSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get shortQuarterSymbols(): NSArray
	set shortQuarterSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get standaloneQuarterSymbols(): NSArray
	set standaloneQuarterSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	get shortStandaloneQuarterSymbols(): NSArray
	set shortStandaloneQuarterSymbols(value: NSArray<interop.Object> | Array<interop.Object>)

	gregorianStartDate: NSDate

	doesRelativeDateFormatting: boolean

	isLenient(): boolean

	initWithDateFormatAllowNaturalLanguage(format: string, flag: boolean): this

	allowsNaturalLanguage(): boolean
}

export declare class NSCompoundPredicate extends NSPredicate {
	initWithTypeSubpredicates(
		type: interop.Enum<typeof NSCompoundPredicateType>,
		subpredicates: NSArray<interop.Object> | Array<interop.Object>,
	): this

	initWithCoder(coder: NSCoder): this

	readonly compoundPredicateType: interop.Enum<typeof NSCompoundPredicateType>

	readonly subpredicates: NSArray

	static andPredicateWithSubpredicates(
		subpredicates: NSArray<interop.Object> | Array<interop.Object>,
	): NSCompoundPredicate

	static orPredicateWithSubpredicates(
		subpredicates: NSArray<interop.Object> | Array<interop.Object>,
	): NSCompoundPredicate

	static notPredicateWithSubpredicate(predicate: NSPredicate): NSCompoundPredicate
}

export declare class NSXMLDTD extends NSXMLNode {
	init(): this

	initWithContentsOfURLOptionsError(
		url: NSURL,
		mask: interop.Enum<typeof NSXMLNodeOptions>,
		error: interop.PointerConvertible,
	): this

	initWithDataOptionsError(
		data: NSData,
		mask: interop.Enum<typeof NSXMLNodeOptions>,
		error: interop.PointerConvertible,
	): this

	publicID: string

	systemID: string

	insertChildAtIndex(child: NSXMLNode, index: number): void

	insertChildrenAtIndex(
		children: NSArray<interop.Object> | Array<interop.Object>,
		index: number,
	): void

	removeChildAtIndex(index: number): void

	setChildren(children: NSArray<interop.Object> | Array<interop.Object> | null): void

	addChild(child: NSXMLNode): void

	replaceChildAtIndexWithNode(index: number, node: NSXMLNode): void

	entityDeclarationForName(name: string): NSXMLDTDNode

	notationDeclarationForName(name: string): NSXMLDTDNode

	elementDeclarationForName(name: string): NSXMLDTDNode

	attributeDeclarationForNameElementName(name: string, elementName: string): NSXMLDTDNode

	static predefinedEntityDeclarationForName(name: string): NSXMLDTDNode
}

export declare class NSURLSessionDataTask extends NSURLSessionTask {
	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class NSMachBootstrapServer extends NSPortNameServer {
	static sharedInstance(): interop.Object

	portForName(name: string): NSPort

	portForNameHost(name: string, host: string | null): NSPort

	registerPortName(port: NSPort, name: string): boolean

	servicePortWithName(name: string): NSPort
}

export declare class NSURLProtocol extends NSObject {
	initWithRequestCachedResponseClient(
		request: NSURLRequest,
		cachedResponse: NSCachedURLResponse | null,
		client: NSURLProtocolClient | null,
	): this

	readonly client: NSURLProtocolClient

	readonly request: NSURLRequest

	readonly cachedResponse: NSCachedURLResponse

	static canInitWithRequest(request: NSURLRequest): boolean

	static canonicalRequestForRequest(request: NSURLRequest): NSURLRequest

	static requestIsCacheEquivalentToRequest(a: NSURLRequest, b: NSURLRequest): boolean

	startLoading(): void

	stopLoading(): void

	static propertyForKeyInRequest(key: string, request: NSURLRequest): interop.Object

	static setPropertyForKeyInRequest(
		value: interop.Object,
		key: string,
		request: NSMutableURLRequest,
	): void

	static removePropertyForKeyInRequest(key: string, request: NSMutableURLRequest): void

	static registerClass(protocolClass: interop.PointerConvertible): boolean

	static unregisterClass(protocolClass: interop.PointerConvertible): void

	static canInitWithTask(task: NSURLSessionTask): boolean

	initWithTaskCachedResponseClient(
		task: NSURLSessionTask,
		cachedResponse: NSCachedURLResponse | null,
		client: NSURLProtocolClient | null,
	): this

	readonly task: NSURLSessionTask
}

export declare class NSMessagePort extends NSPort {}

export declare class NSMutableData extends NSData {
	readonly mutableBytes: interop.Pointer

	// @ts-ignore MemberDecl.tsIgnore
	length: number

	appendBytesLength(bytes: interop.PointerConvertible, length: number): void

	appendData(other: NSData): void

	increaseLengthBy(extraLength: number): void

	replaceBytesInRangeWithBytes(range: _NSRange, bytes: interop.PointerConvertible): void

	resetBytesInRange(range: _NSRange): void

	setData(data: NSData): void

	replaceBytesInRangeWithBytesLength(
		range: _NSRange,
		replacementBytes: interop.PointerConvertible,
		replacementLength: number,
	): void

	static dataWithCapacity<This extends abstract new (...args: any) => any>(
		this: This,
		aNumItems: number,
	): InstanceType<This>

	static dataWithLength<This extends abstract new (...args: any) => any>(
		this: This,
		length: number,
	): InstanceType<This>

	initWithCapacity(capacity: number): this

	initWithLength(length: number): this

	decompressUsingAlgorithmError(
		algorithm: interop.Enum<typeof NSDataCompressionAlgorithm>,
		error: interop.PointerConvertible,
	): boolean

	compressUsingAlgorithmError(
		algorithm: interop.Enum<typeof NSDataCompressionAlgorithm>,
		error: interop.PointerConvertible,
	): boolean
}

export declare class NSPropertyListSerialization extends NSObject {
	static propertyListIsValidForFormat(
		plist: interop.Object,
		format: interop.Enum<typeof NSPropertyListFormat>,
	): boolean

	static dataWithPropertyListFormatOptionsError(
		plist: interop.Object,
		format: interop.Enum<typeof NSPropertyListFormat>,
		opt: number,
		error: interop.PointerConvertible,
	): NSData

	static writePropertyListToStreamFormatOptionsError(
		plist: interop.Object,
		stream: NSOutputStream,
		format: interop.Enum<typeof NSPropertyListFormat>,
		opt: number,
		error: interop.PointerConvertible,
	): number

	static propertyListWithDataOptionsFormatError(
		data: NSData,
		opt: interop.Enum<typeof NSPropertyListMutabilityOptions>,
		format: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): interop.Object

	static propertyListWithStreamOptionsFormatError(
		stream: NSInputStream,
		opt: interop.Enum<typeof NSPropertyListMutabilityOptions>,
		format: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): interop.Object

	static dataFromPropertyListFormatErrorDescription(
		plist: interop.Object,
		format: interop.Enum<typeof NSPropertyListFormat>,
		errorString: interop.PointerConvertible,
	): NSData

	static propertyListFromDataMutabilityOptionFormatErrorDescription(
		data: NSData,
		opt: interop.Enum<typeof NSPropertyListMutabilityOptions>,
		format: interop.PointerConvertible,
		errorString: interop.PointerConvertible,
	): interop.Object
}

export declare class NSScriptSuiteRegistry extends NSObject {
	static sharedScriptSuiteRegistry(): NSScriptSuiteRegistry

	static setSharedScriptSuiteRegistry(registry: NSScriptSuiteRegistry): void

	loadSuitesFromBundle(bundle: NSBundle): void

	loadSuiteWithDictionaryFromBundle(
		suiteDeclaration:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		bundle: NSBundle,
	): void

	registerClassDescription(classDescription: NSScriptClassDescription): void

	registerCommandDescription(commandDescription: NSScriptCommandDescription): void

	readonly suiteNames: NSArray

	appleEventCodeForSuite(suiteName: string): number

	bundleForSuite(suiteName: string): NSBundle

	classDescriptionsInSuite(suiteName: string): NSDictionary

	commandDescriptionsInSuite(suiteName: string): NSDictionary

	suiteForAppleEventCode(appleEventCode: number): string

	classDescriptionWithAppleEventCode(appleEventCode: number): NSScriptClassDescription

	commandDescriptionWithAppleEventClassAndAppleEventCode(
		appleEventClassCode: number,
		appleEventIDCode: number,
	): NSScriptCommandDescription

	aeteResource(languageName: string): NSData
}

export declare class NSNotification extends NSObject implements NSCopying, NSCoding {
	readonly name: string

	readonly object: interop.Object

	readonly userInfo: NSDictionary

	initWithNameObjectUserInfo(
		name: string,
		object: interop.Object | null,
		userInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	initWithCoder(coder: NSCoder): this

	static notificationWithNameObject<This extends abstract new (...args: any) => any>(
		this: This,
		aName: string,
		anObject: interop.Object | null,
	): InstanceType<This>

	static notificationWithNameObjectUserInfo<This extends abstract new (...args: any) => any>(
		this: This,
		aName: string,
		anObject: interop.Object | null,
		aUserInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	init(): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSUserNotificationCenter extends NSObject {
	static readonly defaultUserNotificationCenter: NSUserNotificationCenter

	delegate: NSUserNotificationCenterDelegate

	get scheduledNotifications(): NSArray
	set scheduledNotifications(value: NSArray<interop.Object> | Array<interop.Object>)

	scheduleNotification(notification: NSUserNotification): void

	removeScheduledNotification(notification: NSUserNotification): void

	readonly deliveredNotifications: NSArray

	deliverNotification(notification: NSUserNotification): void

	removeDeliveredNotification(notification: NSUserNotification): void

	removeAllDeliveredNotifications(): void
}

export declare class NSURLCache extends NSObject {
	static sharedURLCache: NSURLCache

	initWithMemoryCapacityDiskCapacityDiskPath(
		memoryCapacity: number,
		diskCapacity: number,
		path: string | null,
	): this

	initWithMemoryCapacityDiskCapacityDirectoryURL(
		memoryCapacity: number,
		diskCapacity: number,
		directoryURL: NSURL | null,
	): this

	cachedResponseForRequest(request: NSURLRequest): NSCachedURLResponse

	storeCachedResponseForRequest(cachedResponse: NSCachedURLResponse, request: NSURLRequest): void

	removeCachedResponseForRequest(request: NSURLRequest): void

	removeAllCachedResponses(): void

	removeCachedResponsesSinceDate(date: NSDate): void

	memoryCapacity: number

	diskCapacity: number

	readonly currentMemoryUsage: number

	readonly currentDiskUsage: number

	storeCachedResponseForDataTask(
		cachedResponse: NSCachedURLResponse,
		dataTask: NSURLSessionDataTask,
	): void

	getCachedResponseForDataTaskCompletionHandler(
		dataTask: NSURLSessionDataTask,
		completionHandler: (p1: NSCachedURLResponse) => void | null,
	): void

	removeCachedResponseForDataTask(dataTask: NSURLSessionDataTask): void
}

export declare class NSURLSessionTask extends NSObject implements NSCopying, NSProgressReporting {
	readonly taskIdentifier: number

	readonly originalRequest: NSURLRequest

	readonly currentRequest: NSURLRequest

	readonly response: NSURLResponse

	readonly progress: NSProgress

	earliestBeginDate: NSDate

	countOfBytesClientExpectsToSend: number

	countOfBytesClientExpectsToReceive: number

	readonly countOfBytesSent: number

	readonly countOfBytesReceived: number

	readonly countOfBytesExpectedToSend: number

	readonly countOfBytesExpectedToReceive: number

	taskDescription: string

	cancel(): void

	readonly state: interop.Enum<typeof NSURLSessionTaskState>

	readonly error: NSError

	suspend(): void

	resume(): void

	priority: number

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class NSProtocolChecker extends NSProxy {
	readonly protocol: interop.Pointer

	readonly target: NSObject

	static protocolCheckerWithTargetProtocol<This extends abstract new (...args: any) => any>(
		this: This,
		anObject: NSObject,
		aProtocol: interop.PointerConvertible,
	): InstanceType<This>

	initWithTargetProtocol(anObject: NSObject, aProtocol: interop.PointerConvertible): this
}

export declare class NSThread extends NSObject {
	static readonly currentThread: NSThread

	static detachNewThreadWithBlock(block: () => void): void

	static detachNewThreadSelectorToTargetWithObject(
		selector: string,
		target: interop.Object,
		argument: interop.Object | null,
	): void

	static isMultiThreaded(): boolean

	readonly threadDictionary: NSMutableDictionary

	static sleepUntilDate(date: NSDate): void

	static sleepForTimeInterval(ti: number): void

	static exit(): void

	static threadPriority(): number

	static setThreadPriority(p: number): boolean

	threadPriority: number

	qualityOfService: interop.Enum<typeof NSQualityOfService>

	static readonly callStackReturnAddresses: NSArray

	static readonly callStackSymbols: NSArray

	name: string

	stackSize: number

	readonly isMainThread: boolean

	static readonly isMainThread: boolean

	static readonly mainThread: NSThread

	init(): this

	initWithTargetSelectorObject(
		target: interop.Object,
		selector: string,
		argument: interop.Object | null,
	): this

	initWithBlock(block: () => void): this

	readonly executing: boolean

	readonly finished: boolean

	readonly cancelled: boolean

	cancel(): void

	start(): void

	main(): void

	isExecuting(): boolean

	isFinished(): boolean

	isCancelled(): boolean
}

export declare class NSUnitTemperature extends NSDimension implements NSSecureCoding {
	static readonly kelvin: NSUnitTemperature

	static readonly celsius: NSUnitTemperature

	static readonly fahrenheit: NSUnitTemperature

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSFileManager extends NSObject {
	static readonly defaultManager: NSFileManager

	mountedVolumeURLsIncludingResourceValuesForKeysOptions(
		propertyKeys: NSArray<interop.Object> | Array<interop.Object> | null,
		options: interop.Enum<typeof NSVolumeEnumerationOptions>,
	): NSArray

	unmountVolumeAtURLOptionsCompletionHandler(
		url: NSURL,
		mask: interop.Enum<typeof NSFileManagerUnmountOptions>,
		completionHandler: (p1: NSError) => void | null,
	): void

	contentsOfDirectoryAtURLIncludingPropertiesForKeysOptionsError(
		url: NSURL,
		keys: NSArray<interop.Object> | Array<interop.Object> | null,
		mask: interop.Enum<typeof NSDirectoryEnumerationOptions>,
		error: interop.PointerConvertible,
	): NSArray

	URLsForDirectoryInDomains(
		directory: interop.Enum<typeof NSSearchPathDirectory>,
		domainMask: interop.Enum<typeof NSSearchPathDomainMask>,
	): NSArray

	URLForDirectoryInDomainAppropriateForURLCreateError(
		directory: interop.Enum<typeof NSSearchPathDirectory>,
		domain: interop.Enum<typeof NSSearchPathDomainMask>,
		url: NSURL | null,
		shouldCreate: boolean,
		error: interop.PointerConvertible,
	): NSURL

	getRelationshipOfDirectoryAtURLToItemAtURLError(
		outRelationship: interop.PointerConvertible,
		directoryURL: NSURL,
		otherURL: NSURL,
		error: interop.PointerConvertible,
	): boolean

	getRelationshipOfDirectoryInDomainToItemAtURLError(
		outRelationship: interop.PointerConvertible,
		directory: interop.Enum<typeof NSSearchPathDirectory>,
		domainMask: interop.Enum<typeof NSSearchPathDomainMask>,
		url: NSURL,
		error: interop.PointerConvertible,
	): boolean

	createDirectoryAtURLWithIntermediateDirectoriesAttributesError(
		url: NSURL,
		createIntermediates: boolean,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): boolean

	createSymbolicLinkAtURLWithDestinationURLError(
		url: NSURL,
		destURL: NSURL,
		error: interop.PointerConvertible,
	): boolean

	delegate: NSFileManagerDelegate

	setAttributesOfItemAtPathError(
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		path: string,
		error: interop.PointerConvertible,
	): boolean

	createDirectoryAtPathWithIntermediateDirectoriesAttributesError(
		path: string,
		createIntermediates: boolean,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): boolean

	contentsOfDirectoryAtPathError(path: string, error: interop.PointerConvertible): NSArray

	subpathsOfDirectoryAtPathError(path: string, error: interop.PointerConvertible): NSArray

	attributesOfItemAtPathError(path: string, error: interop.PointerConvertible): NSDictionary

	attributesOfFileSystemForPathError(path: string, error: interop.PointerConvertible): NSDictionary

	createSymbolicLinkAtPathWithDestinationPathError(
		path: string,
		destPath: string,
		error: interop.PointerConvertible,
	): boolean

	destinationOfSymbolicLinkAtPathError(path: string, error: interop.PointerConvertible): string

	copyItemAtPathToPathError(
		srcPath: string,
		dstPath: string,
		error: interop.PointerConvertible,
	): boolean

	moveItemAtPathToPathError(
		srcPath: string,
		dstPath: string,
		error: interop.PointerConvertible,
	): boolean

	linkItemAtPathToPathError(
		srcPath: string,
		dstPath: string,
		error: interop.PointerConvertible,
	): boolean

	removeItemAtPathError(path: string, error: interop.PointerConvertible): boolean

	copyItemAtURLToURLError(srcURL: NSURL, dstURL: NSURL, error: interop.PointerConvertible): boolean

	moveItemAtURLToURLError(srcURL: NSURL, dstURL: NSURL, error: interop.PointerConvertible): boolean

	linkItemAtURLToURLError(srcURL: NSURL, dstURL: NSURL, error: interop.PointerConvertible): boolean

	removeItemAtURLError(URL: NSURL, error: interop.PointerConvertible): boolean

	trashItemAtURLResultingItemURLError(
		url: NSURL,
		outResultingURL: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	fileAttributesAtPathTraverseLink(path: string, yorn: boolean): NSDictionary

	changeFileAttributesAtPath(
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		path: string,
	): boolean

	directoryContentsAtPath(path: string): NSArray

	fileSystemAttributesAtPath(path: string): NSDictionary

	pathContentOfSymbolicLinkAtPath(path: string): string

	createSymbolicLinkAtPathPathContent(path: string, otherpath: string): boolean

	createDirectoryAtPathAttributes(
		path: string,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): boolean

	linkPathToPathHandler(src: string, dest: string, handler: interop.Object | null): boolean

	copyPathToPathHandler(src: string, dest: string, handler: interop.Object | null): boolean

	movePathToPathHandler(src: string, dest: string, handler: interop.Object | null): boolean

	removeFileAtPathHandler(path: string, handler: interop.Object | null): boolean

	readonly currentDirectoryPath: string

	changeCurrentDirectoryPath(path: string): boolean

	fileExistsAtPath(path: string): boolean

	fileExistsAtPathIsDirectory(path: string, isDirectory: interop.PointerConvertible): boolean

	isReadableFileAtPath(path: string): boolean

	isWritableFileAtPath(path: string): boolean

	isExecutableFileAtPath(path: string): boolean

	isDeletableFileAtPath(path: string): boolean

	contentsEqualAtPathAndPath(path1: string, path2: string): boolean

	displayNameAtPath(path: string): string

	componentsToDisplayForPath(path: string): NSArray

	enumeratorAtPath(path: string): NSDirectoryEnumerator

	enumeratorAtURLIncludingPropertiesForKeysOptionsErrorHandler(
		url: NSURL,
		keys: NSArray<interop.Object> | Array<interop.Object> | null,
		mask: interop.Enum<typeof NSDirectoryEnumerationOptions>,
		handler: (p1: NSURL, p2: NSError) => boolean | null,
	): NSDirectoryEnumerator

	subpathsAtPath(path: string): NSArray

	contentsAtPath(path: string): NSData

	createFileAtPathContentsAttributes(
		path: string,
		data: NSData | null,
		attr:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): boolean

	fileSystemRepresentationWithPath(path: string): string

	stringWithFileSystemRepresentationLength(str: string, len: number): string

	replaceItemAtURLWithItemAtURLBackupItemNameOptionsResultingItemURLError(
		originalItemURL: NSURL,
		newItemURL: NSURL,
		backupItemName: string | null,
		options: interop.Enum<typeof NSFileManagerItemReplacementOptions>,
		resultingURL: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	setUbiquitousItemAtURLDestinationURLError(
		flag: boolean,
		url: NSURL,
		destinationURL: NSURL,
		error: interop.PointerConvertible,
	): boolean

	isUbiquitousItemAtURL(url: NSURL): boolean

	startDownloadingUbiquitousItemAtURLError(url: NSURL, error: interop.PointerConvertible): boolean

	evictUbiquitousItemAtURLError(url: NSURL, error: interop.PointerConvertible): boolean

	URLForUbiquityContainerIdentifier(containerIdentifier: string | null): NSURL

	URLForPublishingUbiquitousItemAtURLExpirationDateError(
		url: NSURL,
		outDate: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): NSURL

	readonly ubiquityIdentityToken: NSCoding

	getFileProviderServicesForItemAtURLCompletionHandler(
		url: NSURL,
		completionHandler: (
			p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	containerURLForSecurityApplicationGroupIdentifier(groupIdentifier: string): NSURL

	readonly homeDirectoryForCurrentUser: NSURL

	readonly temporaryDirectory: NSURL

	homeDirectoryForUser(userName: string): NSURL

	static fileManagerWithAuthorization<This extends abstract new (...args: any) => any>(
		this: This,
		authorization: NSWorkspaceAuthorization,
	): InstanceType<This>
}

export declare class NSPersonNameComponentsFormatter extends NSFormatter {
	style: interop.Enum<typeof NSPersonNameComponentsFormatterStyle>

	phonetic: boolean

	static localizedStringFromPersonNameComponentsStyleOptions(
		components: NSPersonNameComponents,
		nameFormatStyle: interop.Enum<typeof NSPersonNameComponentsFormatterStyle>,
		nameOptions: interop.Enum<typeof NSPersonNameComponentsFormatterOptions>,
	): string

	stringFromPersonNameComponents(components: NSPersonNameComponents): string

	annotatedStringFromPersonNameComponents(components: NSPersonNameComponents): NSAttributedString

	personNameComponentsFromString(string: string): NSPersonNameComponents

	getObjectValueForStringErrorDescription(
		obj: interop.PointerConvertible,
		string: string,
		error: interop.PointerConvertible,
	): boolean

	isPhonetic(): boolean
}

export declare class NSUnitAcceleration extends NSDimension implements NSSecureCoding {
	static readonly metersPerSecondSquared: NSUnitAcceleration

	static readonly gravity: NSUnitAcceleration

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSStream extends NSObject {
	open(): void

	close(): void

	delegate: NSStreamDelegate

	propertyForKey(key: string): interop.Object

	setPropertyForKey(property: interop.Object | null, key: string): boolean

	scheduleInRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	removeFromRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	readonly streamStatus: interop.Enum<typeof NSStreamStatus>

	readonly streamError: NSError

	static getStreamsToHostWithNamePortInputStreamOutputStream(
		hostname: string,
		port: number,
		inputStream: interop.PointerConvertible,
		outputStream: interop.PointerConvertible,
	): void

	static getStreamsToHostPortInputStreamOutputStream(
		host: NSHost,
		port: number,
		inputStream: interop.PointerConvertible,
		outputStream: interop.PointerConvertible,
	): void

	static getBoundStreamsWithBufferSizeInputStreamOutputStream(
		bufferSize: number,
		inputStream: interop.PointerConvertible,
		outputStream: interop.PointerConvertible,
	): void
}

export declare class NSRunLoop extends NSObject {
	static readonly currentRunLoop: NSRunLoop

	static readonly mainRunLoop: NSRunLoop

	readonly currentMode: string

	getCFRunLoop(): interop.Object

	addTimerForMode(timer: NSTimer, mode: string): void

	addPortForMode(aPort: NSPort, mode: string): void

	removePortForMode(aPort: NSPort, mode: string): void

	limitDateForMode(mode: string): NSDate

	acceptInputForModeBeforeDate(mode: string, limitDate: NSDate): void

	run(): void

	runUntilDate(limitDate: NSDate): void

	runModeBeforeDate(mode: string, limitDate: NSDate): boolean

	configureAsServer(): void

	performInModesBlock(
		modes: NSArray<interop.Object> | Array<interop.Object>,
		block: () => void,
	): void

	performBlock(block: () => void): void

	performSelectorTargetArgumentOrderModes(
		aSelector: string,
		target: interop.Object,
		arg: interop.Object | null,
		order: number,
		modes: NSArray<interop.Object> | Array<interop.Object>,
	): void

	cancelPerformSelectorTargetArgument(
		aSelector: string,
		target: interop.Object,
		arg: interop.Object | null,
	): void

	cancelPerformSelectorsWithTarget(target: interop.Object): void
}

export declare class NSRegularExpression extends NSObject implements NSCopying, NSSecureCoding {
	static regularExpressionWithPatternOptionsError(
		pattern: string,
		options: interop.Enum<typeof NSRegularExpressionOptions>,
		error: interop.PointerConvertible,
	): NSRegularExpression

	initWithPatternOptionsError(
		pattern: string,
		options: interop.Enum<typeof NSRegularExpressionOptions>,
		error: interop.PointerConvertible,
	): this

	readonly pattern: string

	readonly options: interop.Enum<typeof NSRegularExpressionOptions>

	readonly numberOfCaptureGroups: number

	static escapedPatternForString(string: string): string

	enumerateMatchesInStringOptionsRangeUsingBlock(
		string: string,
		options: interop.Enum<typeof NSMatchingOptions>,
		range: _NSRange,
		block: (
			p1: NSTextCheckingResult,
			p2: interop.Enum<typeof NSMatchingFlags>,
			p3: interop.PointerConvertible,
		) => void | null,
	): void

	matchesInStringOptionsRange(
		string: string,
		options: interop.Enum<typeof NSMatchingOptions>,
		range: _NSRange,
	): NSArray

	numberOfMatchesInStringOptionsRange(
		string: string,
		options: interop.Enum<typeof NSMatchingOptions>,
		range: _NSRange,
	): number

	firstMatchInStringOptionsRange(
		string: string,
		options: interop.Enum<typeof NSMatchingOptions>,
		range: _NSRange,
	): NSTextCheckingResult

	rangeOfFirstMatchInStringOptionsRange(
		string: string,
		options: interop.Enum<typeof NSMatchingOptions>,
		range: _NSRange,
	): _NSRange

	stringByReplacingMatchesInStringOptionsRangeWithTemplate(
		string: string,
		options: interop.Enum<typeof NSMatchingOptions>,
		range: _NSRange,
		templ: string,
	): string

	replaceMatchesInStringOptionsRangeWithTemplate(
		string: NSMutableString,
		options: interop.Enum<typeof NSMatchingOptions>,
		range: _NSRange,
		templ: string,
	): number

	replacementStringForResultInStringOffsetTemplate(
		result: NSTextCheckingResult,
		string: string,
		offset: number,
		templ: string,
	): string

	static escapedTemplateForString(string: string): string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSSpellServer extends NSObject {
	delegate: NSSpellServerDelegate

	registerLanguageByVendor(language: string | null, vendor: string | null): boolean

	isWordInUserDictionariesCaseSensitive(word: string, flag: boolean): boolean

	run(): void
}

export declare class NSTextCheckingResult extends NSObject implements NSCopying, NSSecureCoding {
	readonly resultType: interop.Enum<typeof NSTextCheckingType>

	readonly range: _NSRange

	readonly orthography: NSOrthography

	readonly grammarDetails: NSArray

	readonly date: NSDate

	readonly timeZone: NSTimeZone

	readonly duration: number

	readonly components: NSDictionary

	readonly URL: NSURL

	readonly replacementString: string

	readonly alternativeStrings: NSArray

	readonly regularExpression: NSRegularExpression

	readonly phoneNumber: string

	readonly numberOfRanges: number

	rangeAtIndex(idx: number): _NSRange

	rangeWithName(name: string): _NSRange

	resultByAdjustingRangesWithOffset(offset: number): NSTextCheckingResult

	readonly addressComponents: NSDictionary

	static orthographyCheckingResultWithRangeOrthography(
		range: _NSRange,
		orthography: NSOrthography,
	): NSTextCheckingResult

	static spellCheckingResultWithRange(range: _NSRange): NSTextCheckingResult

	static grammarCheckingResultWithRangeDetails(
		range: _NSRange,
		details: NSArray<interop.Object> | Array<interop.Object>,
	): NSTextCheckingResult

	static dateCheckingResultWithRangeDate(range: _NSRange, date: NSDate): NSTextCheckingResult

	static dateCheckingResultWithRangeDateTimeZoneDuration(
		range: _NSRange,
		date: NSDate,
		timeZone: NSTimeZone,
		duration: number,
	): NSTextCheckingResult

	static addressCheckingResultWithRangeComponents(
		range: _NSRange,
		components:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): NSTextCheckingResult

	static linkCheckingResultWithRangeURL(range: _NSRange, url: NSURL): NSTextCheckingResult

	static quoteCheckingResultWithRangeReplacementString(
		range: _NSRange,
		replacementString: string,
	): NSTextCheckingResult

	static dashCheckingResultWithRangeReplacementString(
		range: _NSRange,
		replacementString: string,
	): NSTextCheckingResult

	static replacementCheckingResultWithRangeReplacementString(
		range: _NSRange,
		replacementString: string,
	): NSTextCheckingResult

	static correctionCheckingResultWithRangeReplacementString(
		range: _NSRange,
		replacementString: string,
	): NSTextCheckingResult

	static correctionCheckingResultWithRangeReplacementStringAlternativeStrings(
		range: _NSRange,
		replacementString: string,
		alternativeStrings: NSArray<interop.Object> | Array<interop.Object>,
	): NSTextCheckingResult

	static regularExpressionCheckingResultWithRangesCountRegularExpression(
		ranges: interop.PointerConvertible,
		count: number,
		regularExpression: NSRegularExpression,
	): NSTextCheckingResult

	static phoneNumberCheckingResultWithRangePhoneNumber(
		range: _NSRange,
		phoneNumber: string,
	): NSTextCheckingResult

	static transitInformationCheckingResultWithRangeComponents(
		range: _NSRange,
		components:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): NSTextCheckingResult

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUnitArea extends NSDimension implements NSSecureCoding {
	static readonly squareMegameters: NSUnitArea

	static readonly squareKilometers: NSUnitArea

	static readonly squareMeters: NSUnitArea

	static readonly squareCentimeters: NSUnitArea

	static readonly squareMillimeters: NSUnitArea

	static readonly squareMicrometers: NSUnitArea

	static readonly squareNanometers: NSUnitArea

	static readonly squareInches: NSUnitArea

	static readonly squareFeet: NSUnitArea

	static readonly squareYards: NSUnitArea

	static readonly squareMiles: NSUnitArea

	static readonly acres: NSUnitArea

	static readonly ares: NSUnitArea

	static readonly hectares: NSUnitArea

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSMachPort extends NSPort {
	static portWithMachPort(machPort: number): NSPort

	initWithMachPort(machPort: number): this

	setDelegate(anObject: NSPortDelegate | null): void
	setDelegate(anObject: NSMachPortDelegate | null): void

	delegate(): NSPortDelegate
	delegate(): NSMachPortDelegate

	static portWithMachPortOptions(
		machPort: number,
		f: interop.Enum<typeof NSMachPortOptions>,
	): NSPort

	initWithMachPortOptions(machPort: number, f: interop.Enum<typeof NSMachPortOptions>): this

	readonly machPort: number

	scheduleInRunLoopForMode(runLoop: NSRunLoop, mode: string): void

	removeFromRunLoopForMode(runLoop: NSRunLoop, mode: string): void
}

export declare class NSUserNotificationAction extends NSObject implements NSCopying {
	static actionWithIdentifierTitle<This extends abstract new (...args: any) => any>(
		this: This,
		identifier: string | null,
		title: string | null,
	): InstanceType<This>

	readonly identifier: string

	readonly title: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSURLQueryItem extends NSObject implements NSSecureCoding, NSCopying {
	initWithNameValue(name: string, value: string | null): this

	static queryItemWithNameValue<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
		value: string | null,
	): InstanceType<This>

	readonly name: string

	readonly value: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSPointerArray
	extends NSObject
	implements NSFastEnumeration, NSCopying, NSSecureCoding
{
	initWithOptions(options: interop.Enum<typeof NSPointerFunctionsOptions>): this

	initWithPointerFunctions(functions: NSPointerFunctions): this

	static pointerArrayWithOptions(
		options: interop.Enum<typeof NSPointerFunctionsOptions>,
	): NSPointerArray

	static pointerArrayWithPointerFunctions(functions: NSPointerFunctions): NSPointerArray

	readonly pointerFunctions: NSPointerFunctions

	pointerAtIndex(index: number): interop.Pointer

	addPointer(pointer: interop.PointerConvertible): void

	removePointerAtIndex(index: number): void

	insertPointerAtIndex(item: interop.PointerConvertible, index: number): void

	replacePointerAtIndexWithPointer(index: number, item: interop.PointerConvertible): void

	compact(): void

	count: number

	static pointerArrayWithStrongObjects(): interop.Object

	static pointerArrayWithWeakObjects(): interop.Object

	static strongObjectsPointerArray(): NSPointerArray

	static weakObjectsPointerArray(): NSPointerArray

	readonly allObjects: NSArray

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	readonly [Symbol.iterator]: () => Iterator<any>
}

export declare class NSOrthography extends NSObject implements NSCopying, NSSecureCoding {
	readonly dominantScript: string

	readonly languageMap: NSDictionary

	initWithDominantScriptLanguageMap(
		script: string,
		map: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCoder(coder: NSCoder): this

	languagesForScript(script: string): NSArray

	dominantLanguageForScript(script: string): string

	readonly dominantLanguage: string

	readonly allScripts: NSArray

	readonly allLanguages: NSArray

	static defaultOrthographyForLanguage<This extends abstract new (...args: any) => any>(
		this: This,
		language: string,
	): InstanceType<This>

	static orthographyWithDominantScriptLanguageMap<This extends abstract new (...args: any) => any>(
		this: This,
		script: string,
		map: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSData
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding, CKRecordValue
{
	readonly length: number

	readonly bytes: interop.Pointer

	readonly description: string

	getBytesLength(buffer: interop.PointerConvertible, length: number): void

	getBytesRange(buffer: interop.PointerConvertible, range: _NSRange): void

	isEqualToData(other: NSData): boolean

	subdataWithRange(range: _NSRange): NSData

	writeToFileAtomically(path: string, useAuxiliaryFile: boolean): boolean

	writeToURLAtomically(url: NSURL, atomically: boolean): boolean

	writeToFileOptionsError(
		path: string,
		writeOptionsMask: interop.Enum<typeof NSDataWritingOptions>,
		errorPtr: interop.PointerConvertible,
	): boolean

	writeToURLOptionsError(
		url: NSURL,
		writeOptionsMask: interop.Enum<typeof NSDataWritingOptions>,
		errorPtr: interop.PointerConvertible,
	): boolean

	rangeOfDataOptionsRange(
		dataToFind: NSData,
		mask: interop.Enum<typeof NSDataSearchOptions>,
		searchRange: _NSRange,
	): _NSRange

	enumerateByteRangesUsingBlock(
		block: (p1: interop.PointerConvertible, p2: _NSRange, p3: interop.PointerConvertible) => void,
	): void

	static data<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static dataWithBytesLength<This extends abstract new (...args: any) => any>(
		this: This,
		bytes: interop.PointerConvertible,
		length: number,
	): InstanceType<This>

	static dataWithBytesNoCopyLength<This extends abstract new (...args: any) => any>(
		this: This,
		bytes: interop.PointerConvertible,
		length: number,
	): InstanceType<This>

	static dataWithBytesNoCopyLengthFreeWhenDone<This extends abstract new (...args: any) => any>(
		this: This,
		bytes: interop.PointerConvertible,
		length: number,
		b: boolean,
	): InstanceType<This>

	static dataWithContentsOfFileOptionsError<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
		readOptionsMask: interop.Enum<typeof NSDataReadingOptions>,
		errorPtr: interop.PointerConvertible,
	): InstanceType<This>

	static dataWithContentsOfURLOptionsError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		readOptionsMask: interop.Enum<typeof NSDataReadingOptions>,
		errorPtr: interop.PointerConvertible,
	): InstanceType<This>

	static dataWithContentsOfFile<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
	): InstanceType<This>

	static dataWithContentsOfURL<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
	): InstanceType<This>

	initWithBytesLength(bytes: interop.PointerConvertible, length: number): this

	initWithBytesNoCopyLength(bytes: interop.PointerConvertible, length: number): this

	initWithBytesNoCopyLengthFreeWhenDone(
		bytes: interop.PointerConvertible,
		length: number,
		b: boolean,
	): this

	initWithBytesNoCopyLengthDeallocator(
		bytes: interop.PointerConvertible,
		length: number,
		deallocator: (p1: interop.PointerConvertible, p2: number) => void | null,
	): this

	initWithContentsOfFileOptionsError(
		path: string,
		readOptionsMask: interop.Enum<typeof NSDataReadingOptions>,
		errorPtr: interop.PointerConvertible,
	): this

	initWithContentsOfURLOptionsError(
		url: NSURL,
		readOptionsMask: interop.Enum<typeof NSDataReadingOptions>,
		errorPtr: interop.PointerConvertible,
	): this

	initWithContentsOfFile(path: string): this

	initWithContentsOfURL(url: NSURL): this

	initWithData(data: NSData): this

	static dataWithData<This extends abstract new (...args: any) => any>(
		this: This,
		data: NSData,
	): InstanceType<This>

	initWithBase64EncodedStringOptions(
		base64String: string,
		options: interop.Enum<typeof NSDataBase64DecodingOptions>,
	): this

	base64EncodedStringWithOptions(options: interop.Enum<typeof NSDataBase64EncodingOptions>): string

	initWithBase64EncodedDataOptions(
		base64Data: NSData,
		options: interop.Enum<typeof NSDataBase64DecodingOptions>,
	): this

	base64EncodedDataWithOptions(options: interop.Enum<typeof NSDataBase64EncodingOptions>): NSData

	decompressedDataUsingAlgorithmError(
		algorithm: interop.Enum<typeof NSDataCompressionAlgorithm>,
		error: interop.PointerConvertible,
	): this

	compressedDataUsingAlgorithmError(
		algorithm: interop.Enum<typeof NSDataCompressionAlgorithm>,
		error: interop.PointerConvertible,
	): this

	getBytes(buffer: interop.PointerConvertible): void

	static dataWithContentsOfMappedFile(path: string): interop.Object

	initWithContentsOfMappedFile(path: string): this

	initWithBase64Encoding(base64String: string): this

	base64Encoding(): string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly debugDescription: string
}

export declare class NSNotificationQueue extends NSObject {
	static readonly defaultQueue: NSNotificationQueue

	initWithNotificationCenter(notificationCenter: NSNotificationCenter): this

	enqueueNotificationPostingStyle(
		notification: NSNotification,
		postingStyle: interop.Enum<typeof NSPostingStyle>,
	): void

	enqueueNotificationPostingStyleCoalesceMaskForModes(
		notification: NSNotification,
		postingStyle: interop.Enum<typeof NSPostingStyle>,
		coalesceMask: interop.Enum<typeof NSNotificationCoalescing>,
		modes: NSArray<interop.Object> | Array<interop.Object> | null,
	): void

	dequeueNotificationsMatchingCoalesceMask(notification: NSNotification, coalesceMask: number): void
}

export declare class NSURLSession extends NSObject {
	static readonly sharedSession: NSURLSession

	static sessionWithConfiguration(configuration: NSURLSessionConfiguration): NSURLSession

	static sessionWithConfigurationDelegateDelegateQueue(
		configuration: NSURLSessionConfiguration,
		delegate: NSURLSessionDelegate | null,
		queue: NSOperationQueue | null,
	): NSURLSession

	readonly delegateQueue: NSOperationQueue

	readonly delegate: NSURLSessionDelegate

	readonly configuration: NSURLSessionConfiguration

	sessionDescription: string

	finishTasksAndInvalidate(): void

	invalidateAndCancel(): void

	resetWithCompletionHandler(completionHandler: () => void): void

	flushWithCompletionHandler(completionHandler: () => void): void

	getTasksWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSArray<interop.Object> | Array<interop.Object>,
			p3: NSArray<interop.Object> | Array<interop.Object>,
		) => void,
	): void

	getAllTasksWithCompletionHandler(
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void,
	): void

	dataTaskWithRequest(request: NSURLRequest): NSURLSessionDataTask

	dataTaskWithURL(url: NSURL): NSURLSessionDataTask

	uploadTaskWithRequestFromFile(request: NSURLRequest, fileURL: NSURL): NSURLSessionUploadTask

	uploadTaskWithRequestFromData(request: NSURLRequest, bodyData: NSData): NSURLSessionUploadTask

	uploadTaskWithStreamedRequest(request: NSURLRequest): NSURLSessionUploadTask

	downloadTaskWithRequest(request: NSURLRequest): NSURLSessionDownloadTask

	downloadTaskWithURL(url: NSURL): NSURLSessionDownloadTask

	downloadTaskWithResumeData(resumeData: NSData): NSURLSessionDownloadTask

	streamTaskWithHostNamePort(hostname: string, port: number): NSURLSessionStreamTask

	streamTaskWithNetService(service: NSNetService): NSURLSessionStreamTask

	webSocketTaskWithURL(url: NSURL): NSURLSessionWebSocketTask

	webSocketTaskWithURLProtocols(
		url: NSURL,
		protocols: NSArray<interop.Object> | Array<interop.Object>,
	): NSURLSessionWebSocketTask

	webSocketTaskWithRequest(request: NSURLRequest): NSURLSessionWebSocketTask

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	dataTaskWithRequestCompletionHandler(
		request: NSURLRequest,
		completionHandler: (p1: NSData, p2: NSURLResponse, p3: NSError) => void | null,
	): NSURLSessionDataTask

	dataTaskWithURLCompletionHandler(
		url: NSURL,
		completionHandler: (p1: NSData, p2: NSURLResponse, p3: NSError) => void | null,
	): NSURLSessionDataTask

	uploadTaskWithRequestFromFileCompletionHandler(
		request: NSURLRequest,
		fileURL: NSURL,
		completionHandler: (p1: NSData, p2: NSURLResponse, p3: NSError) => void | null,
	): NSURLSessionUploadTask

	uploadTaskWithRequestFromDataCompletionHandler(
		request: NSURLRequest,
		bodyData: NSData | null,
		completionHandler: (p1: NSData, p2: NSURLResponse, p3: NSError) => void | null,
	): NSURLSessionUploadTask

	downloadTaskWithRequestCompletionHandler(
		request: NSURLRequest,
		completionHandler: (p1: NSURL, p2: NSURLResponse, p3: NSError) => void | null,
	): NSURLSessionDownloadTask

	downloadTaskWithURLCompletionHandler(
		url: NSURL,
		completionHandler: (p1: NSURL, p2: NSURLResponse, p3: NSError) => void | null,
	): NSURLSessionDownloadTask

	downloadTaskWithResumeDataCompletionHandler(
		resumeData: NSData,
		completionHandler: (p1: NSURL, p2: NSURLResponse, p3: NSError) => void | null,
	): NSURLSessionDownloadTask
}

export declare class NSURLSessionStreamTask extends NSURLSessionTask {
	readDataOfMinLengthMaxLengthTimeoutCompletionHandler(
		minBytes: number,
		maxBytes: number,
		timeout: number,
		completionHandler: (p1: NSData, p2: boolean, p3: NSError) => void | null,
	): void

	writeDataTimeoutCompletionHandler(
		data: NSData,
		timeout: number,
		completionHandler: (p1: NSError) => void | null,
	): void

	captureStreams(): void

	closeWrite(): void

	closeRead(): void

	startSecureConnection(): void

	stopSecureConnection(): void

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class NSURLDownload extends NSObject {
	static canResumeDownloadDecodedWithEncodingMIMEType(MIMEType: string): boolean

	initWithRequestDelegate(request: NSURLRequest, delegate: NSURLDownloadDelegate | null): this

	initWithResumeDataDelegatePath(
		resumeData: NSData,
		delegate: NSURLDownloadDelegate | null,
		path: string,
	): this

	cancel(): void

	setDestinationAllowOverwrite(path: string, allowOverwrite: boolean): void

	readonly request: NSURLRequest

	readonly resumeData: NSData

	deletesFileUponFailure: boolean
}

export declare class NSUnitElectricCurrent extends NSDimension implements NSSecureCoding {
	static readonly megaamperes: NSUnitElectricCurrent

	static readonly kiloamperes: NSUnitElectricCurrent

	static readonly amperes: NSUnitElectricCurrent

	static readonly milliamperes: NSUnitElectricCurrent

	static readonly microamperes: NSUnitElectricCurrent

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUserDefaults extends NSObject {
	static readonly standardUserDefaults: NSUserDefaults

	static resetStandardUserDefaults(): void

	init(): this

	initWithSuiteName(suitename: string | null): this

	initWithUser(username: string): this

	objectForKey(defaultName: string): interop.Object

	setObjectForKey(value: interop.Object | null, defaultName: string): void

	removeObjectForKey(defaultName: string): void

	stringForKey(defaultName: string): string

	arrayForKey(defaultName: string): NSArray

	dictionaryForKey(defaultName: string): NSDictionary

	dataForKey(defaultName: string): NSData

	stringArrayForKey(defaultName: string): NSArray

	integerForKey(defaultName: string): number

	floatForKey(defaultName: string): number

	doubleForKey(defaultName: string): number

	boolForKey(defaultName: string): boolean

	URLForKey(defaultName: string): NSURL

	setIntegerForKey(value: number, defaultName: string): void

	setFloatForKey(value: number, defaultName: string): void

	setDoubleForKey(value: number, defaultName: string): void

	setBoolForKey(value: boolean, defaultName: string): void

	setURLForKey(url: NSURL | null, defaultName: string): void

	registerDefaults(
		registrationDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	addSuiteNamed(suiteName: string): void

	removeSuiteNamed(suiteName: string): void

	dictionaryRepresentation(): NSDictionary

	readonly volatileDomainNames: NSArray

	volatileDomainForName(domainName: string): NSDictionary

	setVolatileDomainForName(
		domain: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		domainName: string,
	): void

	removeVolatileDomainForName(domainName: string): void

	persistentDomainNames(): NSArray

	persistentDomainForName(domainName: string): NSDictionary

	setPersistentDomainForName(
		domain: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		domainName: string,
	): void

	removePersistentDomainForName(domainName: string): void

	synchronize(): boolean

	objectIsForcedForKey(key: string): boolean

	objectIsForcedForKeyInDomain(key: string, domain: string): boolean
}

export declare class NSMapTable<KeyType = interop.Object, ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSSecureCoding, NSFastEnumeration
{
	initWithKeyOptionsValueOptionsCapacity(
		keyOptions: interop.Enum<typeof NSPointerFunctionsOptions>,
		valueOptions: interop.Enum<typeof NSPointerFunctionsOptions>,
		initialCapacity: number,
	): this

	initWithKeyPointerFunctionsValuePointerFunctionsCapacity(
		keyFunctions: NSPointerFunctions,
		valueFunctions: NSPointerFunctions,
		initialCapacity: number,
	): this

	static mapTableWithKeyOptionsValueOptions<KeyType, ObjectType>(
		keyOptions: interop.Enum<typeof NSPointerFunctionsOptions>,
		valueOptions: interop.Enum<typeof NSPointerFunctionsOptions>,
	): NSMapTable

	static mapTableWithStrongToStrongObjects<KeyType, ObjectType>(): interop.Object

	static mapTableWithWeakToStrongObjects<KeyType, ObjectType>(): interop.Object

	static mapTableWithStrongToWeakObjects<KeyType, ObjectType>(): interop.Object

	static mapTableWithWeakToWeakObjects<KeyType, ObjectType>(): interop.Object

	static strongToStrongObjectsMapTable<KeyType, ObjectType>(): NSMapTable

	static weakToStrongObjectsMapTable<KeyType, ObjectType>(): NSMapTable

	static strongToWeakObjectsMapTable<KeyType, ObjectType>(): NSMapTable

	static weakToWeakObjectsMapTable<KeyType, ObjectType>(): NSMapTable

	readonly keyPointerFunctions: NSPointerFunctions

	readonly valuePointerFunctions: NSPointerFunctions

	objectForKey(aKey: KeyType | null): ObjectType

	removeObjectForKey(aKey: KeyType | null): void

	setObjectForKey(anObject: ObjectType | null, aKey: KeyType | null): void

	readonly count: number

	keyEnumerator(): NSEnumerator

	objectEnumerator(): NSEnumerator

	removeAllObjects(): void

	dictionaryRepresentation(): NSDictionary

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<any>
}

export declare class NSUnitElectricResistance extends NSDimension implements NSSecureCoding {
	static readonly megaohms: NSUnitElectricResistance

	static readonly kiloohms: NSUnitElectricResistance

	static readonly ohms: NSUnitElectricResistance

	static readonly milliohms: NSUnitElectricResistance

	static readonly microohms: NSUnitElectricResistance

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSURLResponse extends NSObject implements NSSecureCoding, NSCopying {
	initWithURLMIMETypeExpectedContentLengthTextEncodingName(
		URL: NSURL,
		MIMEType: string | null,
		length: number,
		name: string | null,
	): this

	readonly URL: NSURL

	readonly MIMEType: string

	readonly expectedContentLength: number

	readonly textEncodingName: string

	readonly suggestedFilename: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSMutableOrderedSet<ObjectType = interop.Object> extends NSOrderedSet {
	insertObjectAtIndex(object: ObjectType, idx: number): void

	removeObjectAtIndex(idx: number): void

	replaceObjectAtIndexWithObject(idx: number, object: ObjectType): void

	initWithCoder(coder: NSCoder): this

	init(): this

	initWithCapacity(numItems: number): this

	addObject(object: ObjectType): void

	addObjectsCount(objects: interop.PointerConvertible, count: number): void

	addObjectsFromArray(array: NSArray<interop.Object> | Array<interop.Object>): void

	exchangeObjectAtIndexWithObjectAtIndex(idx1: number, idx2: number): void

	moveObjectsAtIndexesToIndex(indexes: NSIndexSet, idx: number): void

	insertObjectsAtIndexes(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		indexes: NSIndexSet,
	): void

	setObjectAtIndex(obj: ObjectType, idx: number): void

	setObjectAtIndexedSubscript(obj: ObjectType, idx: number): void

	replaceObjectsInRangeWithObjectsCount(
		range: _NSRange,
		objects: interop.PointerConvertible,
		count: number,
	): void

	replaceObjectsAtIndexesWithObjects(
		indexes: NSIndexSet,
		objects: NSArray<interop.Object> | Array<interop.Object>,
	): void

	removeObjectsInRange(range: _NSRange): void

	removeObjectsAtIndexes(indexes: NSIndexSet): void

	removeAllObjects(): void

	removeObject(object: ObjectType): void

	removeObjectsInArray(array: NSArray<interop.Object> | Array<interop.Object>): void

	intersectOrderedSet(other: NSOrderedSet): void

	minusOrderedSet(other: NSOrderedSet): void

	unionOrderedSet(other: NSOrderedSet): void

	intersectSet(other: NSSet): void

	minusSet(other: NSSet): void

	unionSet(other: NSSet): void

	sortUsingComparator(
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): void

	sortWithOptionsUsingComparator(
		opts: interop.Enum<typeof NSSortOptions>,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): void

	sortRangeOptionsUsingComparator(
		range: _NSRange,
		opts: interop.Enum<typeof NSSortOptions>,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): void

	static orderedSetWithCapacity<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		numItems: number,
	): InstanceType<This>

	applyDifference(difference: NSOrderedCollectionDifference): void

	sortUsingDescriptors(sortDescriptors: NSArray<interop.Object> | Array<interop.Object>): void

	filterUsingPredicate(p: NSPredicate): void
}

export declare class NSSpecifierTest extends NSScriptWhoseTest {
	initWithCoder(inCoder: NSCoder): this

	initWithObjectSpecifierComparisonOperatorTestObject(
		obj1: NSScriptObjectSpecifier | null,
		compOp: interop.Enum<typeof NSTestComparisonOperation>,
		obj2: interop.Object | null,
	): this
}

export declare class NSExtensionItem extends NSObject implements NSCopying, NSSecureCoding {
	attributedTitle: NSAttributedString

	attributedContentText: NSAttributedString

	get attachments(): NSArray
	set attachments(value: NSArray<interop.Object> | Array<interop.Object>)

	get userInfo(): NSDictionary
	set userInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSJSONSerialization extends NSObject {
	static isValidJSONObject(obj: interop.Object): boolean

	static dataWithJSONObjectOptionsError(
		obj: interop.Object,
		opt: interop.Enum<typeof NSJSONWritingOptions>,
		error: interop.PointerConvertible,
	): NSData

	static JSONObjectWithDataOptionsError(
		data: NSData,
		opt: interop.Enum<typeof NSJSONReadingOptions>,
		error: interop.PointerConvertible,
	): interop.Object

	static writeJSONObjectToStreamOptionsError(
		obj: interop.Object,
		stream: NSOutputStream,
		opt: interop.Enum<typeof NSJSONWritingOptions>,
		error: interop.PointerConvertible,
	): number

	static JSONObjectWithStreamOptionsError(
		stream: NSInputStream,
		opt: interop.Enum<typeof NSJSONReadingOptions>,
		error: interop.PointerConvertible,
	): interop.Object
}

export declare class NSHTTPCookie extends NSObject {
	initWithProperties(
		properties:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): this

	static cookieWithProperties(
		properties:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): NSHTTPCookie

	static requestHeaderFieldsWithCookies(
		cookies: NSArray<interop.Object> | Array<interop.Object>,
	): NSDictionary

	static cookiesWithResponseHeaderFieldsForURL(
		headerFields:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		URL: NSURL,
	): NSArray

	readonly properties: NSDictionary

	readonly version: number

	readonly name: string

	readonly value: string

	readonly expiresDate: NSDate

	readonly sessionOnly: boolean

	readonly domain: string

	readonly path: string

	readonly secure: boolean

	readonly HTTPOnly: boolean

	readonly comment: string

	readonly commentURL: NSURL

	readonly portList: NSArray

	readonly sameSitePolicy: string

	isSessionOnly(): boolean

	isSecure(): boolean

	isHTTPOnly(): boolean
}

export declare class NSInputStream extends NSStream {
	readMaxLength(buffer: interop.PointerConvertible, len: number): number

	getBufferLength(buffer: interop.PointerConvertible, len: interop.PointerConvertible): boolean

	readonly hasBytesAvailable: boolean

	initWithData(data: NSData): this

	initWithURL(url: NSURL): this

	initWithFileAtPath(path: string): this

	static inputStreamWithData<This extends abstract new (...args: any) => any>(
		this: This,
		data: NSData,
	): InstanceType<This>

	static inputStreamWithFileAtPath<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
	): InstanceType<This>

	static inputStreamWithURL<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
	): InstanceType<This>
}

export declare class NSArchiver extends NSCoder {
	initForWritingWithMutableData(mdata: NSMutableData): this

	readonly archiverData: NSMutableData

	encodeRootObject(rootObject: interop.Object): void

	encodeConditionalObject(object: interop.Object | null): void

	static archivedDataWithRootObject(rootObject: interop.Object): NSData

	static archiveRootObjectToFile(rootObject: interop.Object, path: string): boolean

	encodeClassNameIntoClassName(trueName: string, inArchiveName: string): void

	classNameEncodedForTrueClassName(trueName: string): string

	replaceObjectWithObject(object: interop.Object, newObject: interop.Object): void
}

export declare class NSFileHandle extends NSObject implements NSSecureCoding {
	readonly availableData: NSData

	initWithFileDescriptorCloseOnDealloc(fd: number, closeopt: boolean): this

	initWithCoder(coder: NSCoder): this

	readDataToEndOfFileAndReturnError(error: interop.PointerConvertible): NSData

	readDataUpToLengthError(length: number, error: interop.PointerConvertible): NSData

	writeDataError(data: NSData, error: interop.PointerConvertible): boolean

	getOffsetError(
		offsetInFile: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	seekToEndReturningOffsetError(
		offsetInFile: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	seekToOffsetError(offset: number, error: interop.PointerConvertible): boolean

	truncateAtOffsetError(offset: number, error: interop.PointerConvertible): boolean

	synchronizeAndReturnError(error: interop.PointerConvertible): boolean

	closeAndReturnError(error: interop.PointerConvertible): boolean

	static readonly fileHandleWithStandardInput: NSFileHandle

	static readonly fileHandleWithStandardOutput: NSFileHandle

	static readonly fileHandleWithStandardError: NSFileHandle

	static readonly fileHandleWithNullDevice: NSFileHandle

	static fileHandleForReadingAtPath<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
	): InstanceType<This>

	static fileHandleForWritingAtPath<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
	): InstanceType<This>

	static fileHandleForUpdatingAtPath<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
	): InstanceType<This>

	static fileHandleForReadingFromURLError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static fileHandleForWritingToURLError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static fileHandleForUpdatingURLError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		error: interop.PointerConvertible,
	): InstanceType<This>

	readInBackgroundAndNotifyForModes(
		modes: NSArray<interop.Object> | Array<interop.Object> | null,
	): void

	readInBackgroundAndNotify(): void

	readToEndOfFileInBackgroundAndNotifyForModes(
		modes: NSArray<interop.Object> | Array<interop.Object> | null,
	): void

	readToEndOfFileInBackgroundAndNotify(): void

	acceptConnectionInBackgroundAndNotifyForModes(
		modes: NSArray<interop.Object> | Array<interop.Object> | null,
	): void

	acceptConnectionInBackgroundAndNotify(): void

	waitForDataInBackgroundAndNotifyForModes(
		modes: NSArray<interop.Object> | Array<interop.Object> | null,
	): void

	waitForDataInBackgroundAndNotify(): void

	readabilityHandler: (p1: NSFileHandle) => void

	writeabilityHandler: (p1: NSFileHandle) => void

	initWithFileDescriptor(fd: number): this

	readonly fileDescriptor: number

	readDataToEndOfFile(): NSData

	readDataOfLength(length: number): NSData

	writeData(data: NSData): void

	readonly offsetInFile: number

	seekToEndOfFile(): number

	seekToFileOffset(offset: number): void

	truncateFileAtOffset(offset: number): void

	synchronizeFile(): void

	closeFile(): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSFileCoordinator extends NSObject {
	static addFilePresenter(filePresenter: NSFilePresenter): void

	static removeFilePresenter(filePresenter: NSFilePresenter): void

	static readonly filePresenters: NSArray

	initWithFilePresenter(filePresenterOrNil: NSFilePresenter | null): this

	purposeIdentifier: string

	coordinateAccessWithIntentsQueueByAccessor(
		intents: NSArray<interop.Object> | Array<interop.Object>,
		queue: NSOperationQueue,
		accessor: (p1: NSError) => void | null,
	): void

	coordinateReadingItemAtURLOptionsErrorByAccessor(
		url: NSURL,
		options: interop.Enum<typeof NSFileCoordinatorReadingOptions>,
		outError: interop.PointerConvertible,
		reader: (p1: NSURL) => void,
	): void

	coordinateWritingItemAtURLOptionsErrorByAccessor(
		url: NSURL,
		options: interop.Enum<typeof NSFileCoordinatorWritingOptions>,
		outError: interop.PointerConvertible,
		writer: (p1: NSURL) => void,
	): void

	coordinateReadingItemAtURLOptionsWritingItemAtURLOptionsErrorByAccessor(
		readingURL: NSURL,
		readingOptions: interop.Enum<typeof NSFileCoordinatorReadingOptions>,
		writingURL: NSURL,
		writingOptions: interop.Enum<typeof NSFileCoordinatorWritingOptions>,
		outError: interop.PointerConvertible,
		readerWriter: (p1: NSURL, p2: NSURL) => void,
	): void

	coordinateWritingItemAtURLOptionsWritingItemAtURLOptionsErrorByAccessor(
		url1: NSURL,
		options1: interop.Enum<typeof NSFileCoordinatorWritingOptions>,
		url2: NSURL,
		options2: interop.Enum<typeof NSFileCoordinatorWritingOptions>,
		outError: interop.PointerConvertible,
		writer: (p1: NSURL, p2: NSURL) => void,
	): void

	prepareForReadingItemsAtURLsOptionsWritingItemsAtURLsOptionsErrorByAccessor(
		readingURLs: NSArray<interop.Object> | Array<interop.Object>,
		readingOptions: interop.Enum<typeof NSFileCoordinatorReadingOptions>,
		writingURLs: NSArray<interop.Object> | Array<interop.Object>,
		writingOptions: interop.Enum<typeof NSFileCoordinatorWritingOptions>,
		outError: interop.PointerConvertible,
		batchAccessor: (p1: () => void) => void,
	): void

	itemAtURLWillMoveToURL(oldURL: NSURL, newURL: NSURL): void

	itemAtURLDidMoveToURL(oldURL: NSURL, newURL: NSURL): void

	itemAtURLDidChangeUbiquityAttributes(url: NSURL, attributes: NSSet): void

	cancel(): void
}

export declare class NSUnitFuelEfficiency extends NSDimension implements NSSecureCoding {
	static readonly litersPer100Kilometers: NSUnitFuelEfficiency

	static readonly milesPerImperialGallon: NSUnitFuelEfficiency

	static readonly milesPerGallon: NSUnitFuelEfficiency

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSError extends NSObject implements NSCopying, NSSecureCoding {
	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	init(): this

	initWithDomainCodeUserInfo(
		domain: string,
		code: number,
		dict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	static errorWithDomainCodeUserInfo<This extends abstract new (...args: any) => any>(
		this: This,
		domain: string,
		code: number,
		dict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	readonly domain: string

	readonly code: number

	readonly userInfo: NSDictionary

	readonly localizedDescription: string

	readonly localizedFailureReason: string

	readonly localizedRecoverySuggestion: string

	readonly localizedRecoveryOptions: NSArray

	readonly recoveryAttempter: interop.Object

	readonly helpAnchor: string

	static setUserInfoValueProviderForDomainProvider(
		errorDomain: string,
		provider: (p1: NSError, p2: string) => interop.Object | null,
	): void

	static userInfoValueProviderForDomain(
		errorDomain: string,
	): (p1: NSError, p2: string) => interop.Object | null

	static fileProviderErrorForCollisionWithItem<This extends abstract new (...args: any) => any>(
		this: This,
		existingItem: NSFileProviderItem,
	): InstanceType<This>

	static fileProviderErrorForNonExistentItemWithIdentifier<
		This extends abstract new (...args: any) => any,
	>(this: This, itemIdentifier: string): InstanceType<This>

	static fileProviderErrorForRejectedDeletionOfItem<
		This extends abstract new (...args: any) => any,
	>(this: This, updatedVersion: NSFileProviderItem): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSAssertionHandler extends NSObject {
	static readonly currentHandler: NSAssertionHandler

	handleFailureInMethodObjectFileLineNumberDescription(
		selector: string,
		object: interop.Object,
		fileName: string,
		line: number,
		format: string | null,
	): void

	handleFailureInFunctionFileLineNumberDescription(
		functionName: string,
		fileName: string,
		line: number,
		format: string | null,
	): void
}

export declare class NSInvocation extends NSObject {
	static invocationWithMethodSignature(sig: NSMethodSignature): NSInvocation

	readonly methodSignature: NSMethodSignature

	retainArguments(): void

	readonly argumentsRetained: boolean

	target: interop.Object

	selector: string

	getReturnValue(retLoc: interop.PointerConvertible): void

	setReturnValue(retLoc: interop.PointerConvertible): void

	getArgumentAtIndex(argumentLocation: interop.PointerConvertible, idx: number): void

	setArgumentAtIndex(argumentLocation: interop.PointerConvertible, idx: number): void

	invoke(): void

	invokeWithTarget(target: interop.Object): void

	invokeUsingIMP(imp: () => void): void
}

export declare class NSPersonNameComponents extends NSObject implements NSCopying, NSSecureCoding {
	namePrefix: string

	givenName: string

	middleName: string

	familyName: string

	nameSuffix: string

	nickname: string

	phoneticRepresentation: NSPersonNameComponents

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSURLConnection extends NSObject {
	initWithRequestDelegateStartImmediately(
		request: NSURLRequest,
		delegate: interop.Object | null,
		startImmediately: boolean,
	): this

	initWithRequestDelegate(request: NSURLRequest, delegate: interop.Object | null): this

	static connectionWithRequestDelegate(
		request: NSURLRequest,
		delegate: interop.Object | null,
	): NSURLConnection

	readonly originalRequest: NSURLRequest

	readonly currentRequest: NSURLRequest

	start(): void

	cancel(): void

	scheduleInRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	unscheduleFromRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	setDelegateQueue(queue: NSOperationQueue | null): void

	static canHandleRequest(request: NSURLRequest): boolean

	static sendSynchronousRequestReturningResponseError(
		request: NSURLRequest,
		response: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): NSData

	static sendAsynchronousRequestQueueCompletionHandler(
		request: NSURLRequest,
		queue: NSOperationQueue,
		handler: (p1: NSURLResponse, p2: NSData, p3: NSError) => void | null,
	): void
}

export declare class NSListFormatter extends NSFormatter {
	locale: NSLocale

	itemFormatter: NSFormatter

	static localizedStringByJoiningStrings(
		strings: NSArray<interop.Object> | Array<interop.Object>,
	): string

	stringFromItems(items: NSArray<interop.Object> | Array<interop.Object>): string

	stringForObjectValue(obj: interop.Object | null): string
}

export declare class NSByteCountFormatter extends NSFormatter {
	static stringFromByteCountCountStyle(
		byteCount: number,
		countStyle: interop.Enum<typeof NSByteCountFormatterCountStyle>,
	): string

	stringFromByteCount(byteCount: number): string

	static stringFromMeasurementCountStyle(
		measurement: NSMeasurement,
		countStyle: interop.Enum<typeof NSByteCountFormatterCountStyle>,
	): string

	stringFromMeasurement(measurement: NSMeasurement): string

	stringForObjectValue(obj: interop.Object | null): string

	allowedUnits: interop.Enum<typeof NSByteCountFormatterUnits>

	countStyle: interop.Enum<typeof NSByteCountFormatterCountStyle>

	allowsNonnumericFormatting: boolean

	includesUnit: boolean

	includesCount: boolean

	includesActualByteCount: boolean

	adaptive: boolean

	zeroPadsFractionDigits: boolean

	formattingContext: interop.Enum<typeof NSFormattingContext>

	isAdaptive(): boolean
}

export declare class NSUnitElectricCharge extends NSDimension implements NSSecureCoding {
	static readonly coulombs: NSUnitElectricCharge

	static readonly megaampereHours: NSUnitElectricCharge

	static readonly kiloampereHours: NSUnitElectricCharge

	static readonly ampereHours: NSUnitElectricCharge

	static readonly milliampereHours: NSUnitElectricCharge

	static readonly microampereHours: NSUnitElectricCharge

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSCharacterSet
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding
{
	static readonly controlCharacterSet: NSCharacterSet

	static readonly whitespaceCharacterSet: NSCharacterSet

	static readonly whitespaceAndNewlineCharacterSet: NSCharacterSet

	static readonly decimalDigitCharacterSet: NSCharacterSet

	static readonly letterCharacterSet: NSCharacterSet

	static readonly lowercaseLetterCharacterSet: NSCharacterSet

	static readonly uppercaseLetterCharacterSet: NSCharacterSet

	static readonly nonBaseCharacterSet: NSCharacterSet

	static readonly alphanumericCharacterSet: NSCharacterSet

	static readonly decomposableCharacterSet: NSCharacterSet

	static readonly illegalCharacterSet: NSCharacterSet

	static readonly punctuationCharacterSet: NSCharacterSet

	static readonly capitalizedLetterCharacterSet: NSCharacterSet

	static readonly symbolCharacterSet: NSCharacterSet

	static readonly newlineCharacterSet: NSCharacterSet

	static characterSetWithRange(aRange: _NSRange): NSCharacterSet

	static characterSetWithCharactersInString(aString: string): NSCharacterSet

	static characterSetWithBitmapRepresentation(data: NSData): NSCharacterSet

	static characterSetWithContentsOfFile(fName: string): NSCharacterSet

	initWithCoder(coder: NSCoder): this

	characterIsMember(aCharacter: string): boolean

	readonly bitmapRepresentation: NSData

	readonly invertedSet: NSCharacterSet

	longCharacterIsMember(theLongChar: number): boolean

	isSupersetOfSet(theOtherSet: NSCharacterSet): boolean

	hasMemberInPlane(thePlane: number): boolean

	static readonly URLUserAllowedCharacterSet: NSCharacterSet

	static readonly URLPasswordAllowedCharacterSet: NSCharacterSet

	static readonly URLHostAllowedCharacterSet: NSCharacterSet

	static readonly URLPathAllowedCharacterSet: NSCharacterSet

	static readonly URLQueryAllowedCharacterSet: NSCharacterSet

	static readonly URLFragmentAllowedCharacterSet: NSCharacterSet

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSUnitLength extends NSDimension implements NSSecureCoding {
	static readonly megameters: NSUnitLength

	static readonly kilometers: NSUnitLength

	static readonly hectometers: NSUnitLength

	static readonly decameters: NSUnitLength

	static readonly meters: NSUnitLength

	static readonly decimeters: NSUnitLength

	static readonly centimeters: NSUnitLength

	static readonly millimeters: NSUnitLength

	static readonly micrometers: NSUnitLength

	static readonly nanometers: NSUnitLength

	static readonly picometers: NSUnitLength

	static readonly inches: NSUnitLength

	static readonly feet: NSUnitLength

	static readonly yards: NSUnitLength

	static readonly miles: NSUnitLength

	static readonly scandinavianMiles: NSUnitLength

	static readonly lightyears: NSUnitLength

	static readonly nauticalMiles: NSUnitLength

	static readonly fathoms: NSUnitLength

	static readonly furlongs: NSUnitLength

	static readonly astronomicalUnits: NSUnitLength

	static readonly parsecs: NSUnitLength

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSDate extends NSObject implements NSCopying, NSSecureCoding, CKRecordValue {
	readonly timeIntervalSinceReferenceDate: number

	init(): this

	initWithTimeIntervalSinceReferenceDate(ti: number): this

	initWithCoder(coder: NSCoder): this

	timeIntervalSinceDate(anotherDate: NSDate): number

	readonly timeIntervalSinceNow: number

	readonly timeIntervalSince1970: number

	addTimeInterval(seconds: number): interop.Object

	dateByAddingTimeInterval(ti: number): this

	earlierDate(anotherDate: NSDate): NSDate

	laterDate(anotherDate: NSDate): NSDate

	compare(other: NSDate): interop.Enum<typeof NSComparisonResult>

	isEqualToDate(otherDate: NSDate): boolean

	readonly description: string

	descriptionWithLocale(locale: interop.Object | null): string

	static readonly timeIntervalSinceReferenceDate: number

	static date<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static dateWithTimeIntervalSinceNow<This extends abstract new (...args: any) => any>(
		this: This,
		secs: number,
	): InstanceType<This>

	static dateWithTimeIntervalSinceReferenceDate<This extends abstract new (...args: any) => any>(
		this: This,
		ti: number,
	): InstanceType<This>

	static dateWithTimeIntervalSince1970<This extends abstract new (...args: any) => any>(
		this: This,
		secs: number,
	): InstanceType<This>

	static dateWithTimeIntervalSinceDate<This extends abstract new (...args: any) => any>(
		this: This,
		secsToBeAdded: number,
		date: NSDate,
	): InstanceType<This>

	static readonly distantFuture: NSDate

	static readonly distantPast: NSDate

	static readonly now: NSDate

	initWithTimeIntervalSinceNow(secs: number): this

	initWithTimeIntervalSince1970(secs: number): this

	initWithTimeIntervalSinceDate(secsToBeAdded: number, date: NSDate): this

	static dateWithNaturalLanguageStringLocale(
		string: string,
		locale: interop.Object | null,
	): interop.Object

	static dateWithNaturalLanguageString(string: string): interop.Object

	static dateWithString(aString: string): interop.Object

	dateWithCalendarFormatTimeZone(
		format: string | null,
		aTimeZone: NSTimeZone | null,
	): NSCalendarDate

	descriptionWithCalendarFormatTimeZoneLocale(
		format: string | null,
		aTimeZone: NSTimeZone | null,
		locale: interop.Object | null,
	): string

	initWithString(description: string): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly debugDescription: string
}

export declare class NSUnitPressure extends NSDimension implements NSSecureCoding {
	static readonly newtonsPerMetersSquared: NSUnitPressure

	static readonly gigapascals: NSUnitPressure

	static readonly megapascals: NSUnitPressure

	static readonly kilopascals: NSUnitPressure

	static readonly hectopascals: NSUnitPressure

	static readonly inchesOfMercury: NSUnitPressure

	static readonly bars: NSUnitPressure

	static readonly millibars: NSUnitPressure

	static readonly millimetersOfMercury: NSUnitPressure

	static readonly poundsForcePerSquareInch: NSUnitPressure

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSNetServiceBrowser extends NSObject {
	init(): this

	delegate: NSNetServiceBrowserDelegate

	includesPeerToPeer: boolean

	scheduleInRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	removeFromRunLoopForMode(aRunLoop: NSRunLoop, mode: string): void

	searchForBrowsableDomains(): void

	searchForRegistrationDomains(): void

	searchForServicesOfTypeInDomain(type: string, domainString: string): void

	stop(): void
}

export declare class NSScriptCommand extends NSObject implements NSCoding {
	initWithCommandDescription(commandDef: NSScriptCommandDescription): this

	initWithCoder(inCoder: NSCoder): this

	readonly commandDescription: NSScriptCommandDescription

	directParameter: interop.Object

	receiversSpecifier: NSScriptObjectSpecifier

	readonly evaluatedReceivers: interop.Object

	get arguments$(): NSDictionary
	set arguments$(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	readonly evaluatedArguments: NSDictionary

	readonly wellFormed: boolean

	performDefaultImplementation(): interop.Object

	executeCommand(): interop.Object

	scriptErrorNumber: number

	scriptErrorOffendingObjectDescriptor: NSAppleEventDescriptor

	scriptErrorExpectedTypeDescriptor: NSAppleEventDescriptor

	scriptErrorString: string

	static currentCommand(): NSScriptCommand

	readonly appleEvent: NSAppleEventDescriptor

	suspendExecution(): void

	resumeExecutionWithResult(result: interop.Object | null): void

	arguments(): NSDictionary | null

	isWellFormed(): boolean

	encodeWithCoder(coder: NSCoder): void
}

export declare class NSDimension extends NSUnit implements NSSecureCoding {
	readonly converter: NSUnitConverter

	initWithSymbolConverter(symbol: string, converter: NSUnitConverter): this

	static baseUnit<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUserScriptTask extends NSObject {
	initWithURLError(url: NSURL, error: interop.PointerConvertible): this

	readonly scriptURL: NSURL

	executeWithCompletionHandler(handler: (p1: NSError) => void | null): void
}

export declare class NSUnitFrequency extends NSDimension implements NSSecureCoding {
	static readonly terahertz: NSUnitFrequency

	static readonly gigahertz: NSUnitFrequency

	static readonly megahertz: NSUnitFrequency

	static readonly kilohertz: NSUnitFrequency

	static readonly hertz: NSUnitFrequency

	static readonly millihertz: NSUnitFrequency

	static readonly microhertz: NSUnitFrequency

	static readonly nanohertz: NSUnitFrequency

	static readonly framesPerSecond: NSUnitFrequency

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSUnitElectricPotentialDifference
	extends NSDimension
	implements NSSecureCoding
{
	static readonly megavolts: NSUnitElectricPotentialDifference

	static readonly kilovolts: NSUnitElectricPotentialDifference

	static readonly volts: NSUnitElectricPotentialDifference

	static readonly millivolts: NSUnitElectricPotentialDifference

	static readonly microvolts: NSUnitElectricPotentialDifference

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSNumber extends NSValue implements NSFetchRequestResult, CKRecordValue {
	initWithCoder(coder: NSCoder): this

	initWithChar(value: number): this

	initWithUnsignedChar(value: number): this

	initWithShort(value: number): this

	initWithUnsignedShort(value: number): this

	initWithInt(value: number): this

	initWithUnsignedInt(value: number): this

	initWithLong(value: number): this

	initWithUnsignedLong(value: number): this

	initWithLongLong(value: number): this

	initWithUnsignedLongLong(value: number): this

	initWithFloat(value: number): this

	initWithDouble(value: number): this

	initWithBool(value: boolean): this

	initWithInteger(value: number): this

	initWithUnsignedInteger(value: number): this

	readonly charValue: number

	readonly unsignedCharValue: number

	readonly shortValue: number

	readonly unsignedShortValue: number

	readonly intValue: number

	readonly unsignedIntValue: number

	readonly longValue: number

	readonly unsignedLongValue: number

	readonly longLongValue: number

	readonly unsignedLongLongValue: number

	readonly floatValue: number

	readonly doubleValue: number

	readonly boolValue: boolean

	readonly integerValue: number

	readonly unsignedIntegerValue: number

	readonly stringValue: string

	compare(otherNumber: NSNumber): interop.Enum<typeof NSComparisonResult>

	isEqualToNumber(number: NSNumber): boolean

	descriptionWithLocale(locale: interop.Object | null): string

	static numberWithChar(value: number): NSNumber

	static numberWithUnsignedChar(value: number): NSNumber

	static numberWithShort(value: number): NSNumber

	static numberWithUnsignedShort(value: number): NSNumber

	static numberWithInt(value: number): NSNumber

	static numberWithUnsignedInt(value: number): NSNumber

	static numberWithLong(value: number): NSNumber

	static numberWithUnsignedLong(value: number): NSNumber

	static numberWithLongLong(value: number): NSNumber

	static numberWithUnsignedLongLong(value: number): NSNumber

	static numberWithFloat(value: number): NSNumber

	static numberWithDouble(value: number): NSNumber

	static numberWithBool(value: boolean): NSNumber

	static numberWithInteger(value: number): NSNumber

	static numberWithUnsignedInteger(value: number): NSNumber

	readonly decimalValue: NSDecimal

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class NSUnitAngle extends NSDimension implements NSSecureCoding {
	static readonly degrees: NSUnitAngle

	static readonly arcMinutes: NSUnitAngle

	static readonly arcSeconds: NSUnitAngle

	static readonly radians: NSUnitAngle

	static readonly gradians: NSUnitAngle

	static readonly revolutions: NSUnitAngle

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSKeyedUnarchiver extends NSCoder {
	initForReadingFromDataError(data: NSData, error: interop.PointerConvertible): this

	static unarchivedObjectOfClassFromDataError(
		cls: interop.PointerConvertible,
		data: NSData,
		error: interop.PointerConvertible,
	): interop.Object

	static unarchivedArrayOfObjectsOfClassFromDataError(
		cls: interop.PointerConvertible,
		data: NSData,
		error: interop.PointerConvertible,
	): NSArray

	static unarchivedDictionaryWithKeysOfClassObjectsOfClassFromDataError(
		keyCls: interop.PointerConvertible,
		valueCls: interop.PointerConvertible,
		data: NSData,
		error: interop.PointerConvertible,
	): NSDictionary

	static unarchivedObjectOfClassesFromDataError(
		classes: NSSet,
		data: NSData,
		error: interop.PointerConvertible,
	): interop.Object

	static unarchivedArrayOfObjectsOfClassesFromDataError(
		classes: NSSet,
		data: NSData,
		error: interop.PointerConvertible,
	): NSArray

	static unarchivedDictionaryWithKeysOfClassesObjectsOfClassesFromDataError(
		keyClasses: NSSet,
		valueClasses: NSSet,
		data: NSData,
		error: interop.PointerConvertible,
	): NSDictionary

	init(): this

	initForReadingWithData(data: NSData): this

	static unarchiveObjectWithData(data: NSData): interop.Object

	static unarchiveTopLevelObjectWithDataError(
		data: NSData,
		error: interop.PointerConvertible,
	): interop.Object

	static unarchiveObjectWithFile(path: string): interop.Object

	delegate: NSKeyedUnarchiverDelegate

	finishDecoding(): void

	static setClassForClassName(cls: interop.PointerConvertible, codedName: string): void

	setClassForClassName(cls: interop.PointerConvertible, codedName: string): void

	static classForClassName(codedName: string): interop.Pointer

	classForClassName(codedName: string): interop.Pointer

	containsValueForKey(key: string): boolean

	decodeObjectForKey(key: string): interop.Object

	decodeBoolForKey(key: string): boolean

	decodeIntForKey(key: string): number

	decodeInt32ForKey(key: string): number

	decodeInt64ForKey(key: string): number

	decodeFloatForKey(key: string): number

	decodeDoubleForKey(key: string): number

	decodeBytesForKeyReturnedLength(key: string, lengthp: interop.PointerConvertible): interop.Pointer

	// @ts-ignore MemberDecl.tsIgnore
	requiresSecureCoding: boolean

	// @ts-ignore MemberDecl.tsIgnore
	decodingFailurePolicy: interop.Enum<typeof NSDecodingFailurePolicy>
}

export declare class NSNumberFormatter extends NSFormatter {
	formattingContext: interop.Enum<typeof NSFormattingContext>

	getObjectValueForStringRangeError(
		obj: interop.PointerConvertible,
		string: string,
		rangep: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	stringFromNumber(number: NSNumber): string

	numberFromString(string: string): NSNumber

	static localizedStringFromNumberNumberStyle(
		num: NSNumber,
		nstyle: interop.Enum<typeof NSNumberFormatterStyle>,
	): string

	static defaultFormatterBehavior(): interop.Enum<typeof NSNumberFormatterBehavior>

	static setDefaultFormatterBehavior(behavior: interop.Enum<typeof NSNumberFormatterBehavior>): void

	numberStyle: interop.Enum<typeof NSNumberFormatterStyle>

	locale: NSLocale

	generatesDecimalNumbers: boolean

	formatterBehavior: interop.Enum<typeof NSNumberFormatterBehavior>

	negativeFormat: string

	get textAttributesForNegativeValues(): NSDictionary
	set textAttributesForNegativeValues(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	positiveFormat: string

	get textAttributesForPositiveValues(): NSDictionary
	set textAttributesForPositiveValues(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	allowsFloats: boolean

	decimalSeparator: string

	alwaysShowsDecimalSeparator: boolean

	currencyDecimalSeparator: string

	usesGroupingSeparator: boolean

	groupingSeparator: string

	zeroSymbol: string

	get textAttributesForZero(): NSDictionary
	set textAttributesForZero(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	nilSymbol: string

	get textAttributesForNil(): NSDictionary
	set textAttributesForNil(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	notANumberSymbol: string

	get textAttributesForNotANumber(): NSDictionary
	set textAttributesForNotANumber(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	positiveInfinitySymbol: string

	get textAttributesForPositiveInfinity(): NSDictionary
	set textAttributesForPositiveInfinity(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	negativeInfinitySymbol: string

	get textAttributesForNegativeInfinity(): NSDictionary
	set textAttributesForNegativeInfinity(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	positivePrefix: string

	positiveSuffix: string

	negativePrefix: string

	negativeSuffix: string

	currencyCode: string

	currencySymbol: string

	internationalCurrencySymbol: string

	percentSymbol: string

	perMillSymbol: string

	minusSign: string

	plusSign: string

	exponentSymbol: string

	groupingSize: number

	secondaryGroupingSize: number

	multiplier: NSNumber

	formatWidth: number

	paddingCharacter: string

	paddingPosition: interop.Enum<typeof NSNumberFormatterPadPosition>

	roundingMode: interop.Enum<typeof NSNumberFormatterRoundingMode>

	roundingIncrement: NSNumber

	minimumIntegerDigits: number

	maximumIntegerDigits: number

	minimumFractionDigits: number

	maximumFractionDigits: number

	minimum: NSNumber

	maximum: NSNumber

	currencyGroupingSeparator: string

	lenient: boolean

	usesSignificantDigits: boolean

	minimumSignificantDigits: number

	maximumSignificantDigits: number

	partialStringValidationEnabled: boolean

	isLenient(): boolean

	isPartialStringValidationEnabled(): boolean

	hasThousandSeparators: boolean

	thousandSeparator: string

	localizesFormat: boolean

	format: string

	attributedStringForZero: NSAttributedString

	attributedStringForNil: NSAttributedString

	attributedStringForNotANumber: NSAttributedString

	roundingBehavior: NSDecimalNumberHandler
}

export declare class NSUnit extends NSObject implements NSCopying, NSSecureCoding {
	readonly symbol: string

	initWithSymbol(symbol: string): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSCloseCommand extends NSScriptCommand {
	readonly saveOptions: interop.Enum<typeof NSSaveOptions>
}

export declare class NSUnitConverter extends NSObject {
	baseUnitValueFromValue(value: number): number

	valueFromBaseUnitValue(baseUnitValue: number): number
}

export declare class NSException extends NSObject implements NSCopying, NSSecureCoding {
	static exceptionWithNameReasonUserInfo(
		name: string,
		reason: string | null,
		userInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSException

	initWithNameReasonUserInfo(
		aName: string,
		aReason: string | null,
		aUserInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	readonly name: string

	readonly reason: string

	readonly userInfo: NSDictionary

	readonly callStackReturnAddresses: NSArray

	readonly callStackSymbols: NSArray

	raise(): void

	static raiseFormat(name: string, format: string): void

	static raiseFormatArguments(name: string, format: string, argList: string): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSSimpleCString extends NSString {}

export declare class NSURLComponents extends NSObject implements NSCopying {
	init(): this

	initWithURLResolvingAgainstBaseURL(url: NSURL, resolve: boolean): this

	static componentsWithURLResolvingAgainstBaseURL<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		resolve: boolean,
	): InstanceType<This>

	initWithString(URLString: string): this

	static componentsWithString<This extends abstract new (...args: any) => any>(
		this: This,
		URLString: string,
	): InstanceType<This>

	readonly URL: NSURL

	URLRelativeToURL(baseURL: NSURL | null): NSURL

	readonly string: string

	scheme: string

	user: string

	password: string

	host: string

	port: NSNumber

	path: string

	query: string

	fragment: string

	percentEncodedUser: string

	percentEncodedPassword: string

	percentEncodedHost: string

	percentEncodedPath: string

	percentEncodedQuery: string

	percentEncodedFragment: string

	readonly rangeOfScheme: _NSRange

	readonly rangeOfUser: _NSRange

	readonly rangeOfPassword: _NSRange

	readonly rangeOfHost: _NSRange

	readonly rangeOfPort: _NSRange

	readonly rangeOfPath: _NSRange

	readonly rangeOfQuery: _NSRange

	readonly rangeOfFragment: _NSRange

	get queryItems(): NSArray
	set queryItems(value: NSArray<interop.Object> | Array<interop.Object>)

	get percentEncodedQueryItems(): NSArray
	set percentEncodedQueryItems(value: NSArray<interop.Object> | Array<interop.Object>)

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class NSMutableAttributedString extends NSAttributedString {
	replaceCharactersInRangeWithString(range: _NSRange, str: string): void

	setAttributesRange(
		attrs:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		range: _NSRange,
	): void

	readonly mutableString: NSMutableString

	addAttributeValueRange(name: string, value: interop.Object, range: _NSRange): void

	addAttributesRange(
		attrs: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		range: _NSRange,
	): void

	removeAttributeRange(name: string, range: _NSRange): void

	replaceCharactersInRangeWithAttributedString(
		range: _NSRange,
		attrString: NSAttributedString,
	): void

	insertAttributedStringAtIndex(attrString: NSAttributedString, loc: number): void

	appendAttributedString(attrString: NSAttributedString): void

	deleteCharactersInRange(range: _NSRange): void

	setAttributedString(attrString: NSAttributedString): void

	beginEditing(): void

	endEditing(): void

	fixAttributesInRange(range: _NSRange): void

	readFromURLOptionsDocumentAttributesError(
		url: NSURL,
		opts: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		dict: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	readFromDataOptionsDocumentAttributesError(
		data: NSData,
		opts: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		dict: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	fixFontAttributeInRange(range: _NSRange): void

	fixParagraphStyleAttributeInRange(range: _NSRange): void

	fixAttachmentAttributeInRange(range: _NSRange): void

	superscriptRange(range: _NSRange): void

	subscriptRange(range: _NSRange): void

	unscriptRange(range: _NSRange): void

	applyFontTraitsRange(traitMask: interop.Enum<typeof NSFontTraitMask>, range: _NSRange): void

	setAlignmentRange(alignment: interop.Enum<typeof NSTextAlignment>, range: _NSRange): void

	setBaseWritingDirectionRange(
		writingDirection: interop.Enum<typeof NSWritingDirection>,
		range: _NSRange,
	): void

	readFromURLOptionsDocumentAttributes(
		url: NSURL,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		dict: interop.PointerConvertible,
	): boolean

	readFromDataOptionsDocumentAttributes(
		data: NSData,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		dict: interop.PointerConvertible,
	): boolean

	updateAttachmentsFromPath(path: string): void
}

export declare class NSCoder extends NSObject {
	encodeValueOfObjCTypeAt(type: string, addr: interop.PointerConvertible): void

	encodeDataObject(data: NSData): void

	decodeDataObject(): NSData

	decodeValueOfObjCTypeAtSize(type: string, data: interop.PointerConvertible, size: number): void

	versionForClassName(className: string): number

	encodeObject(object: interop.Object | null): void

	encodeRootObject(rootObject: interop.Object): void

	encodeBycopyObject(anObject: interop.Object | null): void

	encodeByrefObject(anObject: interop.Object | null): void

	encodeConditionalObject(object: interop.Object | null): void

	encodeValuesOfObjCTypes(types: string): void

	encodeArrayOfObjCTypeCountAt(type: string, count: number, array: interop.PointerConvertible): void

	encodeBytesLength(byteaddr: interop.PointerConvertible, length: number): void

	decodeObject(): interop.Object

	decodeTopLevelObjectAndReturnError(error: interop.PointerConvertible): interop.Object

	decodeValuesOfObjCTypes(types: string): void

	decodeArrayOfObjCTypeCountAt(
		itemType: string,
		count: number,
		array: interop.PointerConvertible,
	): void

	decodeBytesWithReturnedLength(lengthp: interop.PointerConvertible): interop.Pointer

	encodePropertyList(aPropertyList: interop.Object): void

	decodePropertyList(): interop.Object

	setObjectZone(zone: interop.PointerConvertible): void

	objectZone(): interop.Pointer

	readonly systemVersion: number

	readonly allowsKeyedCoding: boolean

	encodeObjectForKey(object: interop.Object | null, key: string): void

	encodeConditionalObjectForKey(object: interop.Object | null, key: string): void

	encodeBoolForKey(value: boolean, key: string): void

	encodeIntForKey(value: number, key: string): void

	encodeInt32ForKey(value: number, key: string): void

	encodeInt64ForKey(value: number, key: string): void

	encodeFloatForKey(value: number, key: string): void

	encodeDoubleForKey(value: number, key: string): void

	encodeBytesLengthForKey(bytes: interop.PointerConvertible, length: number, key: string): void

	containsValueForKey(key: string): boolean

	decodeObjectForKey(key: string): interop.Object

	decodeTopLevelObjectForKeyError(key: string, error: interop.PointerConvertible): interop.Object

	decodeBoolForKey(key: string): boolean

	decodeIntForKey(key: string): number

	decodeInt32ForKey(key: string): number

	decodeInt64ForKey(key: string): number

	decodeFloatForKey(key: string): number

	decodeDoubleForKey(key: string): number

	decodeBytesForKeyReturnedLength(key: string, lengthp: interop.PointerConvertible): interop.Pointer

	encodeIntegerForKey(value: number, key: string): void

	decodeIntegerForKey(key: string): number

	readonly requiresSecureCoding: boolean

	decodeObjectOfClassForKey(aClass: interop.PointerConvertible, key: string): interop.Object

	decodeTopLevelObjectOfClassForKeyError(
		aClass: interop.PointerConvertible,
		key: string,
		error: interop.PointerConvertible,
	): interop.Object

	decodeArrayOfObjectsOfClassForKey(cls: interop.PointerConvertible, key: string): NSArray

	decodeDictionaryWithKeysOfClassObjectsOfClassForKey(
		keyCls: interop.PointerConvertible,
		objectCls: interop.PointerConvertible,
		key: string,
	): NSDictionary

	decodeObjectOfClassesForKey(classes: NSSet | null, key: string): interop.Object

	decodeTopLevelObjectOfClassesForKeyError(
		classes: NSSet | null,
		key: string,
		error: interop.PointerConvertible,
	): interop.Object

	decodeArrayOfObjectsOfClassesForKey(classes: NSSet, key: string): NSArray

	decodeDictionaryWithKeysOfClassesObjectsOfClassesForKey(
		keyClasses: NSSet,
		objectClasses: NSSet,
		key: string,
	): NSDictionary

	decodePropertyListForKey(key: string): interop.Object

	readonly allowedClasses: NSSet

	failWithError(error: NSError): void

	readonly decodingFailurePolicy: interop.Enum<typeof NSDecodingFailurePolicy>

	readonly error: NSError

	encodeNXObject(object: interop.Object): void

	decodeNXObject(): interop.Object

	decodeValueOfObjCTypeAt(type: string, data: interop.PointerConvertible): void

	encodePoint(point: CGPoint): void

	decodePoint(): CGPoint

	encodeSize(size: CGSize): void

	decodeSize(): CGSize

	encodeRect(rect: CGRect): void

	decodeRect(): CGRect

	encodePointForKey(point: CGPoint, key: string): void

	encodeSizeForKey(size: CGSize, key: string): void

	encodeRectForKey(rect: CGRect, key: string): void

	decodePointForKey(key: string): CGPoint

	decodeSizeForKey(key: string): CGSize

	decodeRectForKey(key: string): CGRect

	decodeNXColor(): NSColor

	encodeCMTimeForKey(time: CMTime, key: string): void

	decodeCMTimeForKey(key: string): CMTime

	encodeCMTimeRangeForKey(timeRange: CMTimeRange, key: string): void

	decodeCMTimeRangeForKey(key: string): CMTimeRange

	encodeCMTimeMappingForKey(timeMapping: CMTimeMapping, key: string): void

	decodeCMTimeMappingForKey(key: string): CMTimeMapping
}

export declare class NSUnitConverterLinear extends NSUnitConverter implements NSSecureCoding {
	readonly coefficient: number

	readonly constant: number

	initWithCoefficient(coefficient: number): this

	initWithCoefficientConstant(coefficient: number, constant: number): this

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSMassFormatter extends NSFormatter {
	numberFormatter: NSNumberFormatter

	unitStyle: interop.Enum<typeof NSFormattingUnitStyle>

	forPersonMassUse: boolean

	stringFromValueUnit(value: number, unit: interop.Enum<typeof NSMassFormatterUnit>): string

	stringFromKilograms(numberInKilograms: number): string

	unitStringFromValueUnit(value: number, unit: interop.Enum<typeof NSMassFormatterUnit>): string

	unitStringFromKilogramsUsedUnit(
		numberInKilograms: number,
		unitp: interop.PointerConvertible,
	): string

	getObjectValueForStringErrorDescription(
		obj: interop.PointerConvertible,
		string: string,
		error: interop.PointerConvertible,
	): boolean

	isForPersonMassUse(): boolean
}

export declare class NSXMLElement extends NSXMLNode {
	initWithName(name: string): this

	initWithNameURI(name: string, URI: string | null): this

	initWithNameStringValue(name: string, string: string | null): this

	initWithXMLStringError(string: string, error: interop.PointerConvertible): this

	initWithKindOptions(
		kind: interop.Enum<typeof NSXMLNodeKind>,
		options: interop.Enum<typeof NSXMLNodeOptions>,
	): this

	elementsForName(name: string): NSArray

	elementsForLocalNameURI(localName: string, URI: string | null): NSArray

	addAttribute(attribute: NSXMLNode): void

	removeAttributeForName(name: string): void

	get attributes(): NSArray
	set attributes(value: NSArray<interop.Object> | Array<interop.Object>)

	setAttributesWithDictionary(
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	attributeForName(name: string): NSXMLNode

	attributeForLocalNameURI(localName: string, URI: string | null): NSXMLNode

	addNamespace(aNamespace: NSXMLNode): void

	removeNamespaceForPrefix(name: string): void

	get namespaces(): NSArray
	set namespaces(value: NSArray<interop.Object> | Array<interop.Object>)

	namespaceForPrefix(name: string): NSXMLNode

	resolveNamespaceForName(name: string): NSXMLNode

	resolvePrefixForNamespaceURI(namespaceURI: string): string

	insertChildAtIndex(child: NSXMLNode, index: number): void

	insertChildrenAtIndex(
		children: NSArray<interop.Object> | Array<interop.Object>,
		index: number,
	): void

	removeChildAtIndex(index: number): void

	setChildren(children: NSArray<interop.Object> | Array<interop.Object> | null): void

	addChild(child: NSXMLNode): void

	replaceChildAtIndexWithNode(index: number, node: NSXMLNode): void

	normalizeAdjacentTextNodesPreservingCDATA(preserve: boolean): void

	setAttributesAsDictionary(
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void
}

export declare class NSCountedSet<ObjectType = interop.Object> extends NSMutableSet {
	initWithCapacity(numItems: number): this

	initWithArray(array: NSArray<interop.Object> | Array<interop.Object>): this

	initWithSet(set: NSSet): this

	countForObject(object: ObjectType): number

	objectEnumerator(): NSEnumerator

	addObject(object: ObjectType): void

	removeObject(object: ObjectType): void
}

export declare class NSExtensionContext extends NSObject {
	readonly inputItems: NSArray

	completeRequestReturningItemsCompletionHandler(
		items: NSArray<interop.Object> | Array<interop.Object> | null,
		completionHandler: (p1: boolean) => void | null,
	): void

	cancelRequestWithError(error: NSError): void

	openURLCompletionHandler(URL: NSURL, completionHandler: (p1: boolean) => void | null): void

	get notificationActions(): NSArray
	set notificationActions(value: NSArray<interop.Object> | Array<interop.Object>)

	performNotificationDefaultAction(): void

	dismissNotificationContentExtension(): void

	mediaPlayingStarted(): void

	mediaPlayingPaused(): void

	loadBroadcastingApplicationInfoWithCompletion(
		handler: (p1: string, p2: string, p3: NSImage) => void | null,
	): void

	completeRequestWithBroadcastURLSetupInfo(
		broadcastURL: NSURL,
		setupInfo:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void
}

export declare class NSDateComponentsFormatter extends NSFormatter {
	stringForObjectValue(obj: interop.Object | null): string

	stringFromDateComponents(components: NSDateComponents): string

	stringFromDateToDate(startDate: NSDate, endDate: NSDate): string

	stringFromTimeInterval(ti: number): string

	static localizedStringFromDateComponentsUnitsStyle(
		components: NSDateComponents,
		unitsStyle: interop.Enum<typeof NSDateComponentsFormatterUnitsStyle>,
	): string

	unitsStyle: interop.Enum<typeof NSDateComponentsFormatterUnitsStyle>

	allowedUnits: interop.Enum<typeof NSCalendarUnit>

	zeroFormattingBehavior: interop.Enum<typeof NSDateComponentsFormatterZeroFormattingBehavior>

	calendar: NSCalendar

	referenceDate: NSDate

	allowsFractionalUnits: boolean

	maximumUnitCount: number

	collapsesLargestUnit: boolean

	includesApproximationPhrase: boolean

	includesTimeRemainingPhrase: boolean

	formattingContext: interop.Enum<typeof NSFormattingContext>

	getObjectValueForStringErrorDescription(
		obj: interop.PointerConvertible,
		string: string,
		error: interop.PointerConvertible,
	): boolean
}

export declare class NSConstantString extends NSSimpleCString {}

export declare class NSXMLDocument extends NSXMLNode {
	init(): this

	initWithXMLStringOptionsError(
		string: string,
		mask: interop.Enum<typeof NSXMLNodeOptions>,
		error: interop.PointerConvertible,
	): this

	initWithContentsOfURLOptionsError(
		url: NSURL,
		mask: interop.Enum<typeof NSXMLNodeOptions>,
		error: interop.PointerConvertible,
	): this

	initWithDataOptionsError(
		data: NSData,
		mask: interop.Enum<typeof NSXMLNodeOptions>,
		error: interop.PointerConvertible,
	): this

	initWithRootElement(element: NSXMLElement | null): this

	static replacementClassForClass(cls: interop.PointerConvertible): interop.Pointer

	characterEncoding: string

	version: string

	standalone: boolean

	documentContentKind: interop.Enum<typeof NSXMLDocumentContentKind>

	MIMEType: string

	DTD: NSXMLDTD

	setRootElement(root: NSXMLElement): void

	rootElement(): NSXMLElement

	insertChildAtIndex(child: NSXMLNode, index: number): void

	insertChildrenAtIndex(
		children: NSArray<interop.Object> | Array<interop.Object>,
		index: number,
	): void

	removeChildAtIndex(index: number): void

	setChildren(children: NSArray<interop.Object> | Array<interop.Object> | null): void

	addChild(child: NSXMLNode): void

	replaceChildAtIndexWithNode(index: number, node: NSXMLNode): void

	readonly XMLData: NSData

	XMLDataWithOptions(options: interop.Enum<typeof NSXMLNodeOptions>): NSData

	objectByApplyingXSLTArgumentsError(
		xslt: NSData,
		arguments$:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): interop.Object

	objectByApplyingXSLTStringArgumentsError(
		xslt: string,
		arguments$:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): interop.Object

	objectByApplyingXSLTAtURLArgumentsError(
		xsltURL: NSURL,
		argument:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): interop.Object

	validateAndReturnError(error: interop.PointerConvertible): boolean

	isStandalone(): boolean
}

export declare class NSMutableSet<ObjectType = interop.Object> extends NSSet {
	addObject(object: ObjectType): void

	removeObject(object: ObjectType): void

	initWithCoder(coder: NSCoder): this

	init(): this

	initWithCapacity(numItems: number): this

	addObjectsFromArray(array: NSArray<interop.Object> | Array<interop.Object>): void

	intersectSet(otherSet: NSSet): void

	minusSet(otherSet: NSSet): void

	removeAllObjects(): void

	unionSet(otherSet: NSSet): void

	setSet(otherSet: NSSet): void

	static setWithCapacity<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		numItems: number,
	): InstanceType<This>

	filterUsingPredicate(predicate: NSPredicate): void
}

export declare class NSString
	extends NSObject
	implements
		NSCopying,
		NSMutableCopying,
		NSSecureCoding,
		NSItemProviderReading,
		NSItemProviderWriting,
		NSPasteboardWriting,
		NSPasteboardReading,
		CKRecordValue,
		CNKeyDescriptor
{
	readonly length: number

	characterAtIndex(index: number): string

	init(): this

	initWithCoder(coder: NSCoder): this

	substringFromIndex(from: number): string

	substringToIndex(to: number): string

	substringWithRange(range: _NSRange): string

	getCharactersRange(buffer: interop.PointerConvertible, range: _NSRange): void

	compare(string: string): interop.Enum<typeof NSComparisonResult>

	compareOptions(
		string: string,
		mask: interop.Enum<typeof NSStringCompareOptions>,
	): interop.Enum<typeof NSComparisonResult>

	compareOptionsRange(
		string: string,
		mask: interop.Enum<typeof NSStringCompareOptions>,
		rangeOfReceiverToCompare: _NSRange,
	): interop.Enum<typeof NSComparisonResult>

	compareOptionsRangeLocale(
		string: string,
		mask: interop.Enum<typeof NSStringCompareOptions>,
		rangeOfReceiverToCompare: _NSRange,
		locale: interop.Object | null,
	): interop.Enum<typeof NSComparisonResult>

	caseInsensitiveCompare(string: string): interop.Enum<typeof NSComparisonResult>

	localizedCompare(string: string): interop.Enum<typeof NSComparisonResult>

	localizedCaseInsensitiveCompare(string: string): interop.Enum<typeof NSComparisonResult>

	localizedStandardCompare(string: string): interop.Enum<typeof NSComparisonResult>

	isEqualToString(aString: string): boolean

	hasPrefix(str: string): boolean

	hasSuffix(str: string): boolean

	commonPrefixWithStringOptions(
		str: string,
		mask: interop.Enum<typeof NSStringCompareOptions>,
	): string

	containsString(str: string): boolean

	localizedCaseInsensitiveContainsString(str: string): boolean

	localizedStandardContainsString(str: string): boolean

	localizedStandardRangeOfString(str: string): _NSRange

	rangeOfString(searchString: string): _NSRange

	rangeOfStringOptions(
		searchString: string,
		mask: interop.Enum<typeof NSStringCompareOptions>,
	): _NSRange

	rangeOfStringOptionsRange(
		searchString: string,
		mask: interop.Enum<typeof NSStringCompareOptions>,
		rangeOfReceiverToSearch: _NSRange,
	): _NSRange

	rangeOfStringOptionsRangeLocale(
		searchString: string,
		mask: interop.Enum<typeof NSStringCompareOptions>,
		rangeOfReceiverToSearch: _NSRange,
		locale: NSLocale | null,
	): _NSRange

	rangeOfCharacterFromSet(searchSet: NSCharacterSet): _NSRange

	rangeOfCharacterFromSetOptions(
		searchSet: NSCharacterSet,
		mask: interop.Enum<typeof NSStringCompareOptions>,
	): _NSRange

	rangeOfCharacterFromSetOptionsRange(
		searchSet: NSCharacterSet,
		mask: interop.Enum<typeof NSStringCompareOptions>,
		rangeOfReceiverToSearch: _NSRange,
	): _NSRange

	rangeOfComposedCharacterSequenceAtIndex(index: number): _NSRange

	rangeOfComposedCharacterSequencesForRange(range: _NSRange): _NSRange

	stringByAppendingString(aString: string): string

	stringByAppendingFormat(format: string): string

	readonly doubleValue: number

	readonly floatValue: number

	readonly intValue: number

	readonly integerValue: number

	readonly longLongValue: number

	readonly boolValue: boolean

	readonly uppercaseString: string

	readonly lowercaseString: string

	readonly capitalizedString: string

	readonly localizedUppercaseString: string

	readonly localizedLowercaseString: string

	readonly localizedCapitalizedString: string

	uppercaseStringWithLocale(locale: NSLocale | null): string

	lowercaseStringWithLocale(locale: NSLocale | null): string

	capitalizedStringWithLocale(locale: NSLocale | null): string

	getLineStartEndContentsEndForRange(
		startPtr: interop.PointerConvertible,
		lineEndPtr: interop.PointerConvertible,
		contentsEndPtr: interop.PointerConvertible,
		range: _NSRange,
	): void

	lineRangeForRange(range: _NSRange): _NSRange

	getParagraphStartEndContentsEndForRange(
		startPtr: interop.PointerConvertible,
		parEndPtr: interop.PointerConvertible,
		contentsEndPtr: interop.PointerConvertible,
		range: _NSRange,
	): void

	paragraphRangeForRange(range: _NSRange): _NSRange

	enumerateSubstringsInRangeOptionsUsingBlock(
		range: _NSRange,
		opts: interop.Enum<typeof NSStringEnumerationOptions>,
		block: (p1: string, p2: _NSRange, p3: _NSRange, p4: interop.PointerConvertible) => void | null,
	): void

	enumerateLinesUsingBlock(block: (p1: string, p2: interop.PointerConvertible) => void): void

	readonly UTF8String: string

	readonly fastestEncoding: number

	readonly smallestEncoding: number

	dataUsingEncodingAllowLossyConversion(encoding: number, lossy: boolean): NSData

	dataUsingEncoding(encoding: number): NSData

	canBeConvertedToEncoding(encoding: number): boolean

	cStringUsingEncoding(encoding: number): string

	getCStringMaxLengthEncoding(buffer: string, maxBufferCount: number, encoding: number): boolean

	getBytesMaxLengthUsedLengthEncodingOptionsRangeRemainingRange(
		buffer: interop.PointerConvertible,
		maxBufferCount: number,
		usedBufferCount: interop.PointerConvertible,
		encoding: number,
		options: interop.Enum<typeof NSStringEncodingConversionOptions>,
		range: _NSRange,
		leftover: interop.PointerConvertible,
	): boolean

	maximumLengthOfBytesUsingEncoding(enc: number): number

	lengthOfBytesUsingEncoding(enc: number): number

	static readonly availableStringEncodings: interop.Pointer

	static localizedNameOfStringEncoding(encoding: number): string

	static readonly defaultCStringEncoding: number

	readonly decomposedStringWithCanonicalMapping: string

	readonly precomposedStringWithCanonicalMapping: string

	readonly decomposedStringWithCompatibilityMapping: string

	readonly precomposedStringWithCompatibilityMapping: string

	componentsSeparatedByString(separator: string): NSArray

	componentsSeparatedByCharactersInSet(separator: NSCharacterSet): NSArray

	stringByTrimmingCharactersInSet(set: NSCharacterSet): string

	stringByPaddingToLengthWithStringStartingAtIndex(
		newLength: number,
		padString: string,
		padIndex: number,
	): string

	stringByFoldingWithOptionsLocale(
		options: interop.Enum<typeof NSStringCompareOptions>,
		locale: NSLocale | null,
	): string

	stringByReplacingOccurrencesOfStringWithStringOptionsRange(
		target: string,
		replacement: string,
		options: interop.Enum<typeof NSStringCompareOptions>,
		searchRange: _NSRange,
	): string

	stringByReplacingOccurrencesOfStringWithString(target: string, replacement: string): string

	stringByReplacingCharactersInRangeWithString(range: _NSRange, replacement: string): string

	stringByApplyingTransformReverse(transform: string, reverse: boolean): string

	writeToURLAtomicallyEncodingError(
		url: NSURL,
		useAuxiliaryFile: boolean,
		enc: number,
		error: interop.PointerConvertible,
	): boolean

	writeToFileAtomicallyEncodingError(
		path: string,
		useAuxiliaryFile: boolean,
		enc: number,
		error: interop.PointerConvertible,
	): boolean

	readonly description: string

	readonly hash: number

	initWithCharactersNoCopyLengthFreeWhenDone(
		characters: interop.PointerConvertible,
		length: number,
		freeBuffer: boolean,
	): this

	initWithCharactersNoCopyLengthDeallocator(
		chars: interop.PointerConvertible,
		len: number,
		deallocator: (p1: interop.PointerConvertible, p2: number) => void | null,
	): this

	initWithCharactersLength(characters: interop.PointerConvertible, length: number): this

	initWithUTF8String(nullTerminatedCString: string): this

	initWithString(aString: string): this

	initWithFormat(format: string): this

	initWithFormatArguments(format: string, argList: string): this

	initWithFormatLocale(format: string, locale: interop.Object | null): this

	initWithFormatLocaleArguments(
		format: string,
		locale: interop.Object | null,
		argList: string,
	): this

	initWithValidatedFormatValidFormatSpecifiersLocaleArgumentsError(
		format: string,
		validFormatSpecifiers: string,
		locale: interop.Object | null,
		argList: string,
		error: interop.PointerConvertible,
	): this

	initWithDataEncoding(data: NSData, encoding: number): this

	initWithBytesLengthEncoding(
		bytes: interop.PointerConvertible,
		len: number,
		encoding: number,
	): this

	initWithBytesNoCopyLengthEncodingFreeWhenDone(
		bytes: interop.PointerConvertible,
		len: number,
		encoding: number,
		freeBuffer: boolean,
	): this

	initWithBytesNoCopyLengthEncodingDeallocator(
		bytes: interop.PointerConvertible,
		len: number,
		encoding: number,
		deallocator: (p1: interop.PointerConvertible, p2: number) => void | null,
	): this

	static string<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static stringWithString<This extends abstract new (...args: any) => any>(
		this: This,
		string: string,
	): InstanceType<This>

	static stringWithCharactersLength<This extends abstract new (...args: any) => any>(
		this: This,
		characters: interop.PointerConvertible,
		length: number,
	): InstanceType<This>

	static stringWithUTF8String<This extends abstract new (...args: any) => any>(
		this: This,
		nullTerminatedCString: string,
	): InstanceType<This>

	static stringWithFormat<This extends abstract new (...args: any) => any>(
		this: This,
		format: string,
	): InstanceType<This>

	static localizedStringWithFormat<This extends abstract new (...args: any) => any>(
		this: This,
		format: string,
	): InstanceType<This>

	static stringWithValidatedFormatValidFormatSpecifiersError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		format: string,
		validFormatSpecifiers: string,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static localizedStringWithValidatedFormatValidFormatSpecifiersError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		format: string,
		validFormatSpecifiers: string,
		error: interop.PointerConvertible,
	): InstanceType<This>

	initWithCStringEncoding(nullTerminatedCString: string, encoding: number): this

	static stringWithCStringEncoding<This extends abstract new (...args: any) => any>(
		this: This,
		cString: string,
		enc: number,
	): InstanceType<This>

	initWithContentsOfURLEncodingError(
		url: NSURL,
		enc: number,
		error: interop.PointerConvertible,
	): this

	initWithContentsOfFileEncodingError(
		path: string,
		enc: number,
		error: interop.PointerConvertible,
	): this

	static stringWithContentsOfURLEncodingError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		enc: number,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static stringWithContentsOfFileEncodingError<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
		enc: number,
		error: interop.PointerConvertible,
	): InstanceType<This>

	initWithContentsOfURLUsedEncodingError(
		url: NSURL,
		enc: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): this

	initWithContentsOfFileUsedEncodingError(
		path: string,
		enc: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): this

	static stringWithContentsOfURLUsedEncodingError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		enc: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static stringWithContentsOfFileUsedEncodingError<This extends abstract new (...args: any) => any>(
		this: This,
		path: string,
		enc: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static stringEncodingForDataEncodingOptionsConvertedStringUsedLossyConversion(
		data: NSData,
		opts:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		string: interop.PointerConvertible,
		usedLossyConversion: interop.PointerConvertible,
	): number

	propertyList(): interop.Object

	propertyListFromStringsFileFormat(): NSDictionary

	cString(): string

	lossyCString(): string

	cStringLength(): number

	getCString(bytes: string): void

	getCStringMaxLength(bytes: string, maxLength: number): void

	getCStringMaxLengthRangeRemainingRange(
		bytes: string,
		maxLength: number,
		aRange: _NSRange,
		leftoverRange: interop.PointerConvertible,
	): void

	writeToFileAtomically(path: string, useAuxiliaryFile: boolean): boolean

	writeToURLAtomically(url: NSURL, atomically: boolean): boolean

	initWithContentsOfFile(path: string): this

	initWithContentsOfURL(url: NSURL): this

	static stringWithContentsOfFile(path: string): interop.Object

	static stringWithContentsOfURL(url: NSURL): interop.Object

	initWithCStringNoCopyLengthFreeWhenDone(bytes: string, length: number, freeBuffer: boolean): this

	initWithCStringLength(bytes: string, length: number): this

	initWithCString(bytes: string): this

	static stringWithCStringLength(bytes: string, length: number): interop.Object

	static stringWithCString(bytes: string): interop.Object

	getCharacters(buffer: interop.PointerConvertible): void

	variantFittingPresentationWidth(width: number): string

	static pathWithComponents(components: NSArray<interop.Object> | Array<interop.Object>): string

	readonly pathComponents: NSArray

	readonly absolutePath: boolean

	readonly lastPathComponent: string

	readonly stringByDeletingLastPathComponent: string

	stringByAppendingPathComponent(str: string): string

	readonly pathExtension: string

	readonly stringByDeletingPathExtension: string

	stringByAppendingPathExtension(str: string): string

	readonly stringByAbbreviatingWithTildeInPath: string

	readonly stringByExpandingTildeInPath: string

	readonly stringByStandardizingPath: string

	readonly stringByResolvingSymlinksInPath: string

	stringsByAppendingPaths(paths: NSArray<interop.Object> | Array<interop.Object>): NSArray

	completePathIntoStringCaseSensitiveMatchesIntoArrayFilterTypes(
		outputName: interop.PointerConvertible,
		flag: boolean,
		outputArray: interop.PointerConvertible,
		filterTypes: NSArray<interop.Object> | Array<interop.Object> | null,
	): number

	readonly fileSystemRepresentation: string

	getFileSystemRepresentationMaxLength(cname: string, max: number): boolean

	isAbsolutePath(): boolean

	stringByAddingPercentEncodingWithAllowedCharacters(allowedCharacters: NSCharacterSet): string

	readonly stringByRemovingPercentEncoding: string

	stringByAddingPercentEscapesUsingEncoding(enc: number): string

	stringByReplacingPercentEscapesUsingEncoding(enc: number): string

	linguisticTagsInRangeSchemeOptionsOrthographyTokenRanges(
		range: _NSRange,
		scheme: string,
		options: interop.Enum<typeof NSLinguisticTaggerOptions>,
		orthography: NSOrthography | null,
		tokenRanges: interop.PointerConvertible,
	): NSArray

	enumerateLinguisticTagsInRangeSchemeOptionsOrthographyUsingBlock(
		range: _NSRange,
		scheme: string,
		options: interop.Enum<typeof NSLinguisticTaggerOptions>,
		orthography: NSOrthography | null,
		block: (p1: string, p2: _NSRange, p3: _NSRange, p4: interop.PointerConvertible) => void | null,
	): void

	sizeWithAttributes(
		attrs:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): CGSize

	drawAtPointWithAttributes(
		point: CGPoint,
		attrs:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	drawInRectWithAttributes(
		rect: CGRect,
		attrs:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	drawWithRectOptionsAttributesContext(
		rect: CGRect,
		options: interop.Enum<typeof NSStringDrawingOptions>,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		context: NSStringDrawingContext | null,
	): void

	boundingRectWithSizeOptionsAttributesContext(
		size: CGSize,
		options: interop.Enum<typeof NSStringDrawingOptions>,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		context: NSStringDrawingContext | null,
	): CGRect

	drawWithRectOptionsAttributes(
		rect: CGRect,
		options: interop.Enum<typeof NSStringDrawingOptions>,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	boundingRectWithSizeOptionsAttributes(
		size: CGSize,
		options: interop.Enum<typeof NSStringDrawingOptions>,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): CGRect

	stringByAppendingPathComponentConformingToType(partialName: string, contentType: UTType): string

	stringByAppendingPathExtensionForType(contentType: UTType): string

	static deferredLocalizedIntentsStringWithFormat(format: string): string

	static deferredLocalizedIntentsStringWithFormatFromTable(
		format: string,
		table: string | null,
	): string

	static deferredLocalizedIntentsStringWithFormatFromTableArguments(
		format: string,
		table: string | null,
		arguments$: string,
	): string

	static localizedUserNotificationStringForKeyArguments(
		key: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object> | null,
	): string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	static readonly readableTypeIdentifiersForItemProvider: NSArray

	static objectWithItemProviderDataTypeIdentifierError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		data: NSData,
		typeIdentifier: string,
		outError: interop.PointerConvertible,
	): InstanceType<This>

	isEqual(object: interop.Object): boolean

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly debugDescription: string

	static readonly writableTypeIdentifiersForItemProvider: NSArray

	readonly writableTypeIdentifiersForItemProvider: NSArray

	static itemProviderVisibilityForRepresentationWithTypeIdentifier(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>

	itemProviderVisibilityForRepresentationWithTypeIdentifier(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>

	loadDataWithTypeIdentifierForItemProviderCompletionHandler(
		typeIdentifier: string,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): NSProgress

	writableTypesForPasteboard(pasteboard: NSPasteboard): NSArray

	writingOptionsForTypePasteboard(
		type: string,
		pasteboard: NSPasteboard,
	): interop.Enum<typeof NSPasteboardWritingOptions>

	pasteboardPropertyListForType(type: string): interop.Object

	static readableTypesForPasteboard(pasteboard: NSPasteboard): NSArray

	static readingOptionsForTypePasteboard(
		type: string,
		pasteboard: NSPasteboard,
	): interop.Enum<typeof NSPasteboardReadingOptions>

	initWithPasteboardPropertyListOfType(propertyList: interop.Object, type: string): this
}

export declare class NSMutableDictionary<
	KeyType = interop.Object,
	ObjectType = interop.Object,
> extends NSDictionary {
	removeObjectForKey(aKey: KeyType): void

	setObjectForKey(anObject: ObjectType, aKey: NSCopying): void

	init(): this

	initWithCapacity(numItems: number): this

	initWithCoder(coder: NSCoder): this

	addEntriesFromDictionary(
		otherDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	removeAllObjects(): void

	removeObjectsForKeys(keyArray: NSArray<interop.Object> | Array<interop.Object>): void

	setDictionary(
		otherDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	setObjectForKeyedSubscript(obj: ObjectType | null, key: NSCopying): void

	static dictionaryWithCapacity<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, numItems: number): InstanceType<This>

	static dictionaryWithContentsOfFile<KeyType, ObjectType>(path: string): NSDictionary
	static dictionaryWithContentsOfFile<KeyType, ObjectType>(path: string): NSMutableDictionary

	static dictionaryWithContentsOfURL<KeyType, ObjectType>(url: NSURL): NSDictionary
	static dictionaryWithContentsOfURL<KeyType, ObjectType>(url: NSURL): NSMutableDictionary

	initWithContentsOfFile(path: string): this

	initWithContentsOfURL(url: NSURL): this

	static dictionaryWithSharedKeySet<KeyType, ObjectType>(
		keyset: interop.Object,
	): NSMutableDictionary

	setValueForKey(value: interop.Object | null, key: string): void
	setValueForKey(value: ObjectType | null, key: string): void

	static dictionaryWithOBEXHeadersDataHeadersDataSize<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, inHeadersData: interop.PointerConvertible, inDataSize: number): InstanceType<This>

	static dictionaryWithOBEXHeadersData<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, inHeadersData: NSData): InstanceType<This>

	getHeaderBytes(): NSMutableData

	addTargetHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addHTTPHeaderLength(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number): number

	addBodyHeaderLengthEndOfBody(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
		isEndOfBody: boolean,
	): number

	addWhoHeaderLength(inHeaderData: interop.PointerConvertible, inHeaderDataLength: number): number

	addConnectionIDHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addApplicationParameterHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addByteSequenceHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addObjectClassHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addAuthorizationChallengeHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addAuthorizationResponseHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addTimeISOHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addTypeHeader(type: string): number

	addLengthHeader(length: number): number

	addTime4ByteHeader(time4Byte: number): number

	addCountHeader(inCount: number): number

	addDescriptionHeader(inDescriptionString: string): number

	addNameHeader(inNameString: string): number

	addUserDefinedHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	addImageHandleHeader(type: string): number

	addImageDescriptorHeaderLength(
		inHeaderData: interop.PointerConvertible,
		inHeaderDataLength: number,
	): number

	static withOBEXHeadersDataHeadersDataSize<
		KeyType,
		ObjectType,
		This extends abstract new (...args: any) => any,
	>(this: This, inHeadersData: interop.PointerConvertible, inDataSize: number): InstanceType<This>
}

export declare class NSArray<ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding, NSFastEnumeration, CKRecordValue
{
	readonly count: number

	objectAtIndex(index: number): ObjectType

	init(): this

	initWithObjectsCount(objects: interop.PointerConvertible, cnt: number): this

	initWithCoder(coder: NSCoder): this

	arrayByAddingObject(anObject: ObjectType): NSArray

	arrayByAddingObjectsFromArray(
		otherArray: NSArray<interop.Object> | Array<interop.Object>,
	): NSArray

	componentsJoinedByString(separator: string): string

	containsObject(anObject: ObjectType): boolean

	readonly description: string

	descriptionWithLocale(locale: interop.Object | null): string

	descriptionWithLocaleIndent(locale: interop.Object | null, level: number): string

	firstObjectCommonWithArray(
		otherArray: NSArray<interop.Object> | Array<interop.Object>,
	): ObjectType

	getObjectsRange(objects: interop.PointerConvertible, range: _NSRange): void

	indexOfObject(anObject: ObjectType): number

	indexOfObjectInRange(anObject: ObjectType, range: _NSRange): number

	indexOfObjectIdenticalTo(anObject: ObjectType): number

	indexOfObjectIdenticalToInRange(anObject: ObjectType, range: _NSRange): number

	isEqualToArray(otherArray: NSArray<interop.Object> | Array<interop.Object>): boolean

	readonly firstObject: ObjectType

	readonly lastObject: ObjectType

	objectEnumerator(): NSEnumerator

	reverseObjectEnumerator(): NSEnumerator

	readonly sortedArrayHint: NSData

	sortedArrayUsingFunctionContext(
		comparator: (
			p1: interop.Object,
			p2: interop.Object,
			p3: interop.PointerConvertible,
		) => number | null,
		context: interop.PointerConvertible,
	): NSArray

	sortedArrayUsingFunctionContextHint(
		comparator: (
			p1: interop.Object,
			p2: interop.Object,
			p3: interop.PointerConvertible,
		) => number | null,
		context: interop.PointerConvertible,
		hint: NSData | null,
	): NSArray

	sortedArrayUsingSelector(comparator: string): NSArray

	subarrayWithRange(range: _NSRange): NSArray

	writeToURLError(url: NSURL, error: interop.PointerConvertible): boolean

	makeObjectsPerformSelector(aSelector: string): void

	makeObjectsPerformSelectorWithObject(aSelector: string, argument: interop.Object | null): void

	objectsAtIndexes(indexes: NSIndexSet): NSArray

	objectAtIndexedSubscript(idx: number): ObjectType

	enumerateObjectsUsingBlock(
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	enumerateObjectsWithOptionsUsingBlock(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	enumerateObjectsAtIndexesOptionsUsingBlock(
		s: NSIndexSet,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		block: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => void,
	): void

	indexOfObjectPassingTest(
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): number

	indexOfObjectWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): number

	indexOfObjectAtIndexesOptionsPassingTest(
		s: NSIndexSet,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): number

	indexesOfObjectsPassingTest(
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): NSIndexSet

	indexesOfObjectsWithOptionsPassingTest(
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): NSIndexSet

	indexesOfObjectsAtIndexesOptionsPassingTest(
		s: NSIndexSet,
		opts: interop.Enum<typeof NSEnumerationOptions>,
		predicate: (p1: interop.Object, p2: number, p3: interop.PointerConvertible) => boolean,
	): NSIndexSet

	sortedArrayUsingComparator(
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): NSArray

	sortedArrayWithOptionsUsingComparator(
		opts: interop.Enum<typeof NSSortOptions>,
		cmptr: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): NSArray

	indexOfObjectInSortedRangeOptionsUsingComparator(
		obj: ObjectType,
		r: _NSRange,
		opts: interop.Enum<typeof NSBinarySearchingOptions>,
		cmp: (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>,
	): number

	static array<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static arrayWithObject<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		anObject: ObjectType,
	): InstanceType<This>

	static arrayWithObjectsCount<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		objects: interop.PointerConvertible,
		cnt: number,
	): InstanceType<This>

	static arrayWithObjects<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		firstObj: ObjectType,
	): InstanceType<This>

	static arrayWithArray<ObjectType, This extends abstract new (...args: any) => any>(
		this: This,
		array: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	initWithObjects(firstObj: ObjectType): this

	initWithArray(array: NSArray<interop.Object> | Array<interop.Object>): this

	initWithArrayCopyItems(
		array: NSArray<interop.Object> | Array<interop.Object>,
		flag: boolean,
	): this

	initWithContentsOfURLError(url: NSURL, error: interop.PointerConvertible): this

	static arrayWithContentsOfURLError<ObjectType>(
		url: NSURL,
		error: interop.PointerConvertible,
	): NSArray

	differenceFromArrayWithOptionsUsingEquivalenceTest(
		other: NSArray<interop.Object> | Array<interop.Object>,
		options: interop.Enum<typeof NSOrderedCollectionDifferenceCalculationOptions>,
		block: (p1: interop.Object, p2: interop.Object) => boolean,
	): NSOrderedCollectionDifference

	differenceFromArrayWithOptions(
		other: NSArray<interop.Object> | Array<interop.Object>,
		options: interop.Enum<typeof NSOrderedCollectionDifferenceCalculationOptions>,
	): NSOrderedCollectionDifference

	differenceFromArray(
		other: NSArray<interop.Object> | Array<interop.Object>,
	): NSOrderedCollectionDifference

	arrayByApplyingDifference(difference: NSOrderedCollectionDifference): NSArray

	getObjects(objects: interop.PointerConvertible): void

	static arrayWithContentsOfFile<ObjectType>(path: string): NSArray

	static arrayWithContentsOfURL<ObjectType>(url: NSURL): NSArray

	initWithContentsOfFile(path: string): this

	initWithContentsOfURL(url: NSURL): this

	writeToFileAtomically(path: string, useAuxiliaryFile: boolean): boolean

	writeToURLAtomically(url: NSURL, atomically: boolean): boolean

	pathsMatchingExtensions(filterTypes: NSArray<interop.Object> | Array<interop.Object>): NSArray

	valueForKey(key: string): interop.Object

	setValueForKey(value: interop.Object | null, key: string): void

	addObserverToObjectsAtIndexesForKeyPathOptionsContext(
		observer: NSObject,
		indexes: NSIndexSet,
		keyPath: string,
		options: interop.Enum<typeof NSKeyValueObservingOptions>,
		context: interop.PointerConvertible,
	): void

	removeObserverFromObjectsAtIndexesForKeyPathContext(
		observer: NSObject,
		indexes: NSIndexSet,
		keyPath: string,
		context: interop.PointerConvertible,
	): void

	removeObserverFromObjectsAtIndexesForKeyPath(
		observer: NSObject,
		indexes: NSIndexSet,
		keyPath: string,
	): void

	addObserverForKeyPathOptionsContext(
		observer: NSObject,
		keyPath: string,
		options: interop.Enum<typeof NSKeyValueObservingOptions>,
		context: interop.PointerConvertible,
	): void

	removeObserverForKeyPathContext(
		observer: NSObject,
		keyPath: string,
		context: interop.PointerConvertible,
	): void

	removeObserverForKeyPath(observer: NSObject, keyPath: string): void

	sortedArrayUsingDescriptors(
		sortDescriptors: NSArray<interop.Object> | Array<interop.Object>,
	): NSArray

	filteredArrayUsingPredicate(predicate: NSPredicate): NSArray

	shuffledArrayWithRandomSource(randomSource: GKRandomSource): NSArray

	shuffledArray(): NSArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly debugDescription: string

	readonly [Symbol.iterator]: () => Iterator<ObjectType>
}

export declare class NSUnitIlluminance extends NSDimension implements NSSecureCoding {
	static readonly lux: NSUnitIlluminance

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class NSEnumerator<ObjectType = interop.Object>
	extends NSObject
	implements NSFastEnumeration
{
	nextObject(): ObjectType

	readonly allObjects: NSArray

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	readonly [Symbol.iterator]: () => Iterator<ObjectType>
}

export declare class NSMutableCharacterSet
	extends NSCharacterSet
	implements NSCopying, NSMutableCopying, NSSecureCoding
{
	addCharactersInRange(aRange: _NSRange): void

	removeCharactersInRange(aRange: _NSRange): void

	addCharactersInString(aString: string): void

	removeCharactersInString(aString: string): void

	formUnionWithCharacterSet(otherSet: NSCharacterSet): void

	formIntersectionWithCharacterSet(otherSet: NSCharacterSet): void

	invert(): void

	// @ts-ignore MemberDecl.tsIgnore
	static readonly controlCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly whitespaceCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly whitespaceAndNewlineCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly decimalDigitCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly letterCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly lowercaseLetterCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly uppercaseLetterCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly nonBaseCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly alphanumericCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly decomposableCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly illegalCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly punctuationCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly capitalizedLetterCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly symbolCharacterSet: NSMutableCharacterSet

	// @ts-ignore MemberDecl.tsIgnore
	static readonly newlineCharacterSet: NSMutableCharacterSet

	static characterSetWithRange(aRange: _NSRange): NSCharacterSet
	static characterSetWithRange(aRange: _NSRange): NSMutableCharacterSet

	static characterSetWithCharactersInString(aString: string): NSCharacterSet
	static characterSetWithCharactersInString(aString: string): NSMutableCharacterSet

	static characterSetWithBitmapRepresentation(data: NSData): NSCharacterSet
	static characterSetWithBitmapRepresentation(data: NSData): NSMutableCharacterSet

	static characterSetWithContentsOfFile(fName: string): NSCharacterSet
	static characterSetWithContentsOfFile(fName: string): NSMutableCharacterSet

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
