import type { CGAffineTransform, CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { CIBarcodeDescriptor, CIContext, CIImage } from './CoreImage'

import type { CMTime, CMTimeMapping, CMTimeRange, CMVideoDimensions } from './CoreMedia'

import type { CVTimeStamp } from './CoreVideo'

import type { NSArray, NSCoder, NSCopying, NSData, NSDate, NSDictionary, NSError, NSIndexSet, NSItemProviderReading, NSItemProviderWriting, NSLocale, NSMutableCopying, NSNumber, NSOperationQueue, NSProgress, NSSecureCoding, NSURL, NSURLAuthenticationChallenge, NSURLRequest, NSURLResponse, NSURLSessionConfiguration, NSURLSessionTaskDelegate } from './Foundation'

import type { MPNowPlayingInfoLanguageOption, MPNowPlayingInfoLanguageOptionGroup } from './MediaPlayer'

import type { NSObjectProtocol, simd_float3x3, simd_float4x3 } from './Runtime'

import type { UTType } from './UniformTypeIdentifiers'

import type { interop } from './objc-runtime'

import { NSComparisonResult, NSItemProviderRepresentationVisibility, NSURLSession, NSURLSessionTask } from './Foundation'

import { CGImagePropertyOrientation } from './ImageIO'

import { CALayer } from './QuartzCore'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const AVSemanticSegmentationMatteTypeTeeth: string;

export declare const AVSemanticSegmentationMatteTypeSkin: string;

export declare const AVMetadataObjectTypeITF14Code: string;

export declare const AVMetadataObjectTypeInterleaved2of5Code: string;

export declare const AVMetadataObjectTypeAztecCode: string;

export declare const AVMetadataObjectTypeQRCode: string;

export declare const AVMetadataObjectTypeCode93Code: string;

export declare const AVMetadataObjectTypeEAN8Code: string;

export declare const AVMetadataObjectTypeEAN13Code: string;

export declare const AVMetadataObjectTypeCode39Mod43Code: string;

export declare const AVMetadataObjectTypeHumanBody: string;

export declare const AVCaptureSessionInterruptionEndedNotification: string;

export declare const AVCaptureSessionWasInterruptedNotification: string;

export declare const AVCaptureSessionDidStopRunningNotification: string;

export declare const AVCaptureSessionDidStartRunningNotification: string;

export declare const AVCaptureSessionRuntimeErrorNotification: string;

export declare const AVCaptureDeviceTypeBuiltInMicrophone: string;

export declare const AVCaptureDeviceTypeExternalUnknown: string;

export declare const AVCaptureDeviceTypeBuiltInWideAngleCamera: string;

export declare const AVCaptureDeviceWasDisconnectedNotification: string;

export declare const AVCaptureSessionPresetiFrame960x540: string;

export declare const AVCaptureSessionPreset3840x2160: string;

export declare const AVCaptureSessionPreset1920x1080: string;

export declare const AVCaptureSessionPreset1280x720: string;

export declare const AVCaptureSessionPreset640x480: string;

export declare const AVCaptureSessionPresetLow: string;

export declare const AVCaptureSessionPresetMedium: string;

export declare const AVCaptureSessionPresetPhoto: string;

export declare const AVSampleBufferRenderSynchronizerRateDidChangeNotification: string;

export declare const AVSampleBufferDisplayLayerFailedToDecodeNotificationErrorKey: string;

export declare const AVSampleBufferDisplayLayerFailedToDecodeNotification: string;

export declare const AVSampleBufferAudioRendererFlushTimeKey: string;

export declare const AVRouteDetectorMultipleRoutesDetectedDidChangeNotification: string;

export declare const AVPlayerItemTrackVideoFieldModeDeinterlaceFields: string;

export declare const AVPlayerItemLegibleOutputTextStylingResolutionSourceAndRulesOnly: string;

export declare const AVPlayerItemMediaSelectionDidChangeNotification: string;

export declare const AVPlayerItemRecommendedTimeOffsetFromLiveDidChangeNotification: string;

export declare const AVPlayerItemNewErrorLogEntryNotification: string;

export declare const AVPlayerItemFailedToPlayToEndTimeNotification: string;

export declare const AVPlayerItemDidPlayToEndTimeNotification: string;

export declare const AVPlayerItemTimeJumpedNotification: string;

export declare const AVPlayerEligibleForHDRPlaybackDidChangeNotification: string;

export declare const AVPlayerWaitingWithNoItemToPlayReason: string;

export declare const AVPlayerWaitingWhileEvaluatingBufferingRateReason: string;

export declare const AVPlayerWaitingToMinimizeStallsReason: string;

export declare const AVOutputSettingsPresetHEVC3840x2160WithAlpha: string;

export declare const AVOutputSettingsPresetHEVC3840x2160: string;

export declare const AVOutputSettingsPresetHEVC1920x1080WithAlpha: string;

export declare const AVOutputSettingsPreset3840x2160: string;

export declare const AVOutputSettingsPreset1920x1080: string;

export declare const AVOutputSettingsPreset1280x720: string;

export declare const AVFragmentedMovieContainsMovieFragmentsDidChangeNotification: string;

export declare const AVMovieShouldSupportAliasDataReferencesKey: string;

export declare const AVMovieReferenceRestrictionsKey: string;

export declare const AVFragmentedMovieTrackSegmentsDidChangeNotification: string;

export declare const AVMetadataIdentifierIcyMetadataStreamTitle: string;

export declare const AVMetadataIdentifierID3MetadataOfficialPublisherWebpage: string;

export declare const AVMetadataIdentifierID3MetadataOfficialInternetRadioStationHomepage: string;

export declare const AVMetadataIdentifierID3MetadataOfficialAudioSourceWebpage: string;

export declare const AVMetadataIdentifierID3MetadataOfficialAudioFileWebpage: string;

export declare const AVMetadataIdentifierID3MetadataCommercialInformation: string;

export declare const AVMetadataIdentifierID3MetadataTermsOfUse: string;

export declare const AVMetadataIdentifierID3MetadataUserText: string;

export declare const AVMetadataIdentifierID3MetadataTitleSortOrder: string;

export declare const AVMetadataIdentifierID3MetadataPerformerSortOrder: string;

export declare const AVMetadataIdentifierID3MetadataAlbumSortOrder: string;

export declare const AVMetadataIdentifierID3MetadataSize: string;

export declare const AVMetadataIdentifierID3MetadataInternetRadioStationOwner: string;

export declare const AVMetadataIdentifierID3MetadataTrackNumber: string;

export declare const AVMetadataIdentifierID3MetadataProducedNotice: string;

export declare const AVMetadataIdentifierID3MetadataPartOfASet: string;

export declare const AVMetadataIdentifierID3MetadataConductor: string;

export declare const AVMetadataIdentifierID3MetadataLeadPerformer: string;

export declare const AVMetadataIdentifierID3MetadataOriginalReleaseYear: string;

export declare const AVMetadataIdentifierID3MetadataOriginalArtist: string;

export declare const AVMetadataIdentifierID3MetadataOriginalLyricist: string;

export declare const AVMetadataIdentifierID3MetadataOriginalFilename: string;

export declare const AVMetadataIdentifierID3MetadataOriginalAlbumTitle: string;

export declare const AVMetadataIdentifierID3MetadataMood: string;

export declare const AVMetadataIdentifierID3MetadataMediaType: string;

export declare const AVMetadataIdentifierID3MetadataLanguage: string;

export declare const AVMetadataIdentifierID3MetadataInitialKey: string;

export declare const AVMetadataIdentifierID3MetadataSubTitle: string;

export declare const AVMetadataIdentifierID3MetadataContentGroupDescription: string;

export declare const AVMetadataIdentifierID3MetadataFileType: string;

export declare const AVMetadataIdentifierID3MetadataTaggingTime: string;

export declare const AVMetadataIdentifierID3MetadataRecordingTime: string;

export declare const AVMetadataIdentifierID3MetadataOriginalReleaseTime: string;

export declare const AVMetadataIdentifierID3MetadataPlaylistDelay: string;

export declare const AVMetadataIdentifierID3MetadataEncodingTime: string;

export declare const AVMetadataIdentifierID3MetadataComposer: string;

export declare const AVMetadataIdentifierID3MetadataBeatsPerMinute: string;

export declare const AVMetadataIdentifierID3MetadataAlbumTitle: string;

export declare const AVMetadataIdentifierID3MetadataSynchronizedTempoCodes: string;

export declare const AVMetadataIdentifierID3MetadataSynchronizedLyric: string;

export declare const AVMetadataIdentifierID3MetadataSignature: string;

export declare const AVMetadataIdentifierID3MetadataReverb: string;

export declare const AVMetadataIdentifierID3MetadataRelativeVolumeAdjustment2: string;

export declare const AVMetadataIdentifierID3MetadataRelativeVolumeAdjustment: string;

export declare const AVMetadataIdentifierID3MetadataRecommendedBufferSize: string;

export declare const AVMetadataIdentifierID3MetadataPositionSynchronization: string;

export declare const AVMetadataIdentifierID3MetadataPopularimeter: string;

export declare const AVMetadataIdentifierID3MetadataOwnership: string;

export declare const AVMetadataIdentifierID3MetadataMPEGLocationLookupTable: string;

export declare const AVMetadataIdentifierID3MetadataMusicCDIdentifier: string;

export declare const AVMetadataIdentifierID3MetadataGroupIdentifier: string;

export declare const AVMetadataIdentifierID3MetadataGeneralEncapsulatedObject: string;

export declare const AVMetadataIdentifierID3MetadataEventTimingCodes: string;

export declare const AVMetadataIdentifierID3MetadataEncryption: string;

export declare const AVMetadataIdentifierID3MetadataCommerical: string;

export declare const AVMetadataIdentifierID3MetadataComments: string;

export declare const AVMetadataIdentifierID3MetadataAttachedPicture: string;

export declare const AVMetadataIdentifierID3MetadataAudioEncryption: string;

export declare const AVMetadataIdentifieriTunesMetadataExecProducer: string;

export declare const AVMetadataIdentifieriTunesMetadataOnlineExtras: string;

export declare const AVMetadataIdentifieriTunesMetadataSoloist: string;

export declare const AVMetadataIdentifieriTunesMetadataSoundEngineer: string;

export declare const AVMetadataIdentifieriTunesMetadataPerformer: string;

export declare const AVMetadataIdentifieriTunesMetadataProducer: string;

export declare const AVMetadataIdentifieriTunesMetadataLinerNotes: string;

export declare const AVMetadataIdentifieriTunesMetadataEQ: string;

export declare const AVMetadataIdentifieriTunesMetadataAcknowledgement: string;

export declare const AVMetadataIdentifieriTunesMetadataLyrics: string;

export declare const AVMetadataIdentifieriTunesMetadataAuthor: string;

export declare const AVMetadataIdentifieriTunesMetadataArranger: string;

export declare const AVMetadataIdentifieriTunesMetadataArtDirector: string;

export declare const AVMetadataIdentifieriTunesMetadataBeatsPerMin: string;

export declare const AVMetadataIdentifieriTunesMetadataContentRating: string;

export declare const AVMetadataIdentifieriTunesMetadataGrouping: string;

export declare const AVMetadataIdentifieriTunesMetadataGenreID: string;

export declare const AVMetadataIdentifieriTunesMetadataAccountKind: string;

export declare const AVMetadataIdentifieriTunesMetadataAlbumArtist: string;

export declare const AVMetadataIdentifieriTunesMetadataComposer: string;

export declare const AVMetadataIdentifieriTunesMetadataTrackSubTitle: string;

export declare const AVMetadataIdentifieriTunesMetadataSongName: string;

export declare const AVMetadataIdentifieriTunesMetadataUserGenre: string;

export declare const AVMetadataIdentifieriTunesMetadataPredefinedGenre: string;

export declare const AVMetadataIdentifieriTunesMetadataEncodedBy: string;

export declare const AVMetadataIdentifieriTunesMetadataReleaseDate: string;

export declare const AVMetadataIdentifieriTunesMetadataCopyright: string;

export declare const AVMetadataIdentifieriTunesMetadataCoverArt: string;

export declare const AVMetadataIdentifieriTunesMetadataUserComment: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLocationHorizontalAccuracyInMeters: string;

export declare const AVMetadataIdentifierQuickTimeMetadataSpatialOverCaptureQualityScoringVersion: string;

export declare const AVMetadataIdentifierQuickTimeMetadataSpatialOverCaptureQualityScore: string;

export declare const AVMetadataIdentifierQuickTimeMetadataAutoLivePhoto: string;

export declare const AVMetadataIdentifierQuickTimeMetadataContentIdentifier: string;

export declare const AVMetadataIdentifierQuickTimeMetadataVideoOrientation: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDetectedDogBody: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDetectedCatBody: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDetectedHumanBody: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDetectedFace: string;

export declare const AVMetadataIdentifierQuickTimeMetadataPreferredAffineTransform: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLocationDate: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLocationRole: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLocationNote: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLocationName: string;

export declare const AVMetadataIdentifierQuickTimeMetadataRatingUser: string;

export declare const AVMetadataIdentifierQuickTimeMetadataCollectionUser: string;

export declare const AVMetadataIdentifierQuickTimeMetadataCameraIdentifier: string;

export declare const AVMetadataIdentifierQuickTimeMetadataCredits: string;

export declare const AVMetadataIdentifierQuickTimeMetadataComposer: string;

export declare const AVMetadataIdentifierQuickTimeMetadataPerformer: string;

export declare const AVMetadataIdentifierQuickTimeMetadataEncodedBy: string;

export declare const AVMetadataIdentifierQuickTimeMetadataArranger: string;

export declare const AVMetadataIdentifierQuickTimeMetadataModel: string;

export declare const AVMetadataIdentifierQuickTimeMetadataMake: string;

export declare const AVMetadataIdentifierQuickTimeMetadataiXML: string;

export declare const AVMetadataIdentifierQuickTimeMetadataGenre: string;

export declare const AVMetadataIdentifierQuickTimeMetadataSoftware: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDescription: string;

export declare const AVMetadataIdentifierQuickTimeMetadataArtwork: string;

export declare const AVMetadataIdentifierQuickTimeMetadataArtist: string;

export declare const AVMetadataIdentifierQuickTimeMetadataAlbum: string;

export declare const AVMetadataIdentifierQuickTimeMetadataPublisher: string;

export declare const AVMetadataIdentifierQuickTimeMetadataProducer: string;

export declare const AVMetadataIdentifierQuickTimeMetadataKeywords: string;

export declare const AVMetadataIdentifierQuickTimeMetadataCopyright: string;

export declare const AVMetadataIdentifierQuickTimeMetadataComment: string;

export declare const AVMetadataIdentifier3GPUserDataMediaClassification: string;

export declare const AVMetadataIdentifier3GPUserDataKeywordList: string;

export declare const AVMetadataIdentifier3GPUserDataCollection: string;

export declare const AVMetadataIdentifier3GPUserDataDescription: string;

export declare const AVMetadataIdentifier3GPUserDataLocation: string;

export declare const AVMetadataIdentifier3GPUserDataRecordingYear: string;

export declare const AVMetadataIdentifier3GPUserDataGenre: string;

export declare const AVMetadataIdentifier3GPUserDataCopyright: string;

export declare const AVMetadataIdentifierISOUserDataTaggedCharacteristic: string;

export declare const AVMetadataIdentifierISOUserDataDate: string;

export declare const AVMetadataIdentifierISOUserDataCopyright: string;

export declare const AVMetadataIdentifierQuickTimeUserDataAccessibilityDescription: string;

export declare const AVMetadataIdentifierQuickTimeUserDataTaggedCharacteristic: string;

export declare const AVMetadataIdentifierQuickTimeUserDataTrackName: string;

export declare const AVMetadataIdentifierQuickTimeUserDataLocationISO6709: string;

export declare const AVMetadataIdentifierQuickTimeUserDataURLLink: string;

export declare const AVMetadataIdentifierQuickTimeUserDataWriter: string;

export declare const AVMetadataIdentifierQuickTimeUserDataTrack: string;

export declare const AVMetadataIdentifierQuickTimeUserDataSpecialPlaybackRequirements: string;

export declare const AVMetadataIdentifierQuickTimeUserDataSoftware: string;

export declare const AVMetadataIdentifierQuickTimeUserDataProducer: string;

export declare const AVMetadataIdentifierQuickTimeUserDataPerformers: string;

export declare const AVMetadataIdentifierQuickTimeUserDataOriginalArtist: string;

export declare const AVMetadataIdentifierQuickTimeUserDataModel: string;

export declare const AVMetadataIdentifierQuickTimeUserDataMake: string;

export declare const AVMetadataIdentifierQuickTimeUserDataInformation: string;

export declare const AVMetadataIdentifierQuickTimeUserDataGenre: string;

export declare const AVMetadataIdentifierQuickTimeUserDataFullName: string;

export declare const AVMetadataIdentifierQuickTimeUserDataEncodedBy: string;

export declare const AVMetadataIdentifierQuickTimeUserDataDisclaimer: string;

export declare const AVMetadataIdentifierQuickTimeUserDataDirector: string;

export declare const AVMetadataIdentifierQuickTimeUserDataCopyright: string;

export declare const AVMetadataIdentifierQuickTimeUserDataComment: string;

export declare const AVMetadataIdentifierQuickTimeUserDataAuthor: string;

export declare const AVMetadataIdentifierQuickTimeUserDataArtist: string;

export declare const AVMetadataIdentifierQuickTimeUserDataAlbum: string;

export declare const AVMetadataCommonIdentifierAccessibilityDescription: string;

export declare const AVMetadataCommonIdentifierSoftware: string;

export declare const AVMetadataCommonIdentifierArtist: string;

export declare const AVMetadataCommonIdentifierAlbumName: string;

export declare const AVMetadataCommonIdentifierLocation: string;

export declare const AVMetadataCommonIdentifierRelation: string;

export declare const AVMetadataCommonIdentifierAssetIdentifier: string;

export declare const AVMetadataCommonIdentifierFormat: string;

export declare const AVMetadataCommonIdentifierType: string;

export declare const AVMetadataCommonIdentifierContributor: string;

export declare const AVMetadataCommonIdentifierSubject: string;

export declare const AVMetadataCommonIdentifierCreator: string;

export declare const AVMetadataCommonIdentifierTitle: string;

export declare const AVErrorDiscontinuityFlagsKey: string;

export declare const AVErrorPresentationTimeStampKey: string;

export declare const AVErrorMediaSubTypeKey: string;

export declare const AVErrorRecordingSuccessfullyFinishedKey: string;

export declare const AVErrorPIDKey: string;

export declare const AVErrorFileSizeKey: string;

export declare const AVErrorTimeKey: string;

export declare const AVErrorDeviceKey: string;

export declare const AVAssetDownloadedAssetEvictionPriorityDefault: string;

export declare const AVAssetDownloadTaskPrefersHDRKey: string;

export declare const AVAssetDownloadTaskMediaSelectionPrefersMultichannelKey: string;

export declare const AVAssetDownloadTaskMediaSelectionKey: string;

export declare const AVMetadataIdentifierID3MetadataEncodedWith: string;

export declare const AVMetadataIdentifierQuickTimeUserDataProduct: string;

export declare const AVMetadataISOUserDataKeyCopyright: string;

export declare const AVCaptureDeviceWasConnectedNotification: string;

export declare const AVMetadataID3MetadataKeyInternetRadioStationName: string;

export declare const AVMetadataIdentifierQuickTimeUserDataHostComputer: string;

export declare const AVVideoPixelAspectRatioHorizontalSpacingKey: string;

export declare const AVFragmentedMovieTrackTotalSampleDataLengthDidChangeNotification: string;

export declare const AVMetadataIdentifier3GPUserDataMediaRating: string;

export declare const AVMetadataID3MetadataKeyLink: string;

export declare const AVMetadataIdentifierQuickTimeUserDataWarning: string;

export declare const AVMetadataIdentifier3GPUserDataAlbumAndTrack: string;

export declare const AVAssetTrackTrackAssociationsDidChangeNotification: string;

export declare const AVAssetTrackTimeRangeDidChangeNotification: string;

export declare const AVTrackAssociationTypeMetadataReferent: string;

export declare const AVTrackAssociationTypeChapterList: string;

export declare const AVAssetImageGeneratorApertureModeEncodedPixels: string;

export declare const AVAssetImageGeneratorApertureModeProductionAperture: string;

export declare const AVAssetImageGeneratorApertureModeCleanAperture: string;

export declare const AVAssetExportPresetAppleM4V1080pHD: string;

export declare const AVAssetExportPresetAppleM4VWiFi: string;

export declare const AVAssetExportPresetAppleM4VAppleTV: string;

export declare const AVAssetExportPresetAppleM4V480pSD: string;

export declare const AVAssetExportPresetAppleM4VCellular: string;

export declare const AVAssetExportPresetAppleProRes4444LPCM: string;

export declare const AVAssetExportPresetAppleProRes422LPCM: string;

export declare const AVAssetExportPresetHEVC3840x2160: string;

export declare const AVMetadataCommonIdentifierLastModifiedDate: string;

export declare const AVAssetExportPresetHEVC1920x1080WithAlpha: string;

export declare const AVAssetExportPreset1920x1080: string;

export declare const AVAssetExportPreset640x480: string;

export declare const AVAssetExportPresetHighestQuality: string;

export declare const AVAssetExportPresetMediumQuality: string;

export declare const AVAudioTimePitchAlgorithmVarispeed: string;

export declare const AVAudioTimePitchAlgorithmSpectral: string;

export declare const AVMetadataIdentifierID3MetadataCopyright: string;

export declare const AVAudioTimePitchAlgorithmTimeDomain: string;

export declare const AVAssetChapterMetadataGroupsDidChangeNotification: string;

export declare const AVAssetDurationDidChangeNotification: string;

export declare const AVURLAssetShouldSupportAliasDataReferencesKey: string;

export declare const AVMetadataQuickTimeMetadataKeyTitle: string;

export declare const AVMetadataIdentifierID3MetadataMusicianCreditsList: string;

export declare const AVVideoApertureModeEncodedPixels: string;

export declare const AVVideoApertureModeCleanAperture: string;

export declare const AVVideoAverageNonDroppableFrameRateKey: string;

export declare const AVVideoDecompressionPropertiesKey: string;

export declare const AVVideoH264EntropyModeCAVLC: string;

export declare const AVVideoProfileLevelH264MainAutoLevel: string;

export declare const AVVideoProfileLevelH264Main30: string;

export declare const AVVideoProfileLevelH264BaselineAutoLevel: string;

export declare const AVVideoProfileLevelH264Baseline41: string;

export declare const AVVideoProfileLevelH264Baseline31: string;

export declare const AVVideoAllowFrameReorderingKey: string;

export declare const AVVideoQualityKey: string;

export declare const AVVideoCompressionPropertiesKey: string;

export declare const AVVideoYCbCrMatrix_SMPTE_240M_1995: string;

export declare const AVVideoYCbCrMatrix_ITU_R_601_4: string;

export declare const AVVideoYCbCrMatrix_ITU_R_709_2: string;

export declare const AVVideoYCbCrMatrixKey: string;

export declare const AVVideoTransferFunction_ITU_R_2100_HLG: string;

export declare const AVVideoTransferFunction_SMPTE_240M_1995: string;

export declare const AVVideoTransferFunction_ITU_R_709_2: string;

export declare const AVVideoTransferFunctionKey: string;

export declare const AVVideoColorPrimaries_P3_D65: string;

export declare const AVVideoColorPrimaries_ITU_R_709_2: string;

export declare const AVVideoColorPrimariesKey: string;

export declare const AVVideoScalingModeResize: string;

export declare const AVVideoCleanApertureHorizontalOffsetKey: string;

export declare const AVVideoCleanApertureHeightKey: string;

export declare const AVVideoCleanApertureWidthKey: string;

export declare const AVVideoPixelAspectRatioKey: string;

export declare const AVVideoCodecAppleProRes422: string;

export declare const AVVideoCodecTypeAppleProRes422Proxy: string;

export declare const AVVideoCodecTypeAppleProRes422LT: string;

export declare const AVVideoCodecTypeAppleProRes422HQ: string;

export declare const AVVideoCodecTypeH264: string;

export declare const AVVideoCodecTypeHEVC: string;

export declare const AVMetadataExtraAttributeBaseURIKey: string;

export declare const AVMetadataKeySpaceHLSDateRange: string;

export declare const AVMetadataFormatHLSMetadata: string;

export declare const AVMetadataIcyMetadataKeyStreamURL: string;

export declare const AVMetadataKeySpaceIcy: string;

export declare const AVMetadataID3MetadataKeyUserURL: string;

export declare const AVMetadataID3MetadataKeyOfficialPublisherWebpage: string;

export declare const AVMetadataID3MetadataKeyOfficialArtistWebpage: string;

export declare const AVMetadataID3MetadataKeyUniqueFileIdentifier: string;

export declare const AVMetadataID3MetadataKeyUserText: string;

export declare const AVMetadataID3MetadataKeyYear: string;

export declare const AVMetadataID3MetadataKeyInternationalStandardRecordingCode: string;

export declare const AVMetadataID3MetadataKeyTitleSortOrder: string;

export declare const AVMetadataID3MetadataKeySize: string;

export declare const AVMetadataID3MetadataKeyInternetRadioStationOwner: string;

export declare const AVMetadataID3MetadataKeyPublisher: string;

export declare const AVMetadataQuickTimeUserDataKeyComposer: string;

export declare const AVMetadataID3MetadataKeyProducedNotice: string;

export declare const AVMetadataID3MetadataKeyPartOfASet: string;

export declare const AVMetadataID3MetadataKeyModifiedBy: string;

export declare const AVMetadataID3MetadataKeyConductor: string;

export declare const AVMetadataID3MetadataKeyBand: string;

export declare const AVMetadataID3MetadataKeyOriginalArtist: string;

export declare const AVMetadataID3MetadataKeyOriginalLyricist: string;

export declare const AVMetadataID3MetadataKeyOriginalAlbumTitle: string;

export declare const AVMetadataID3MetadataKeyLength: string;

export declare const AVMetadataID3MetadataKeyInitialKey: string;

export declare const AVMetadataID3MetadataKeySubTitle: string;

export declare const AVMetadataID3MetadataKeyInvolvedPeopleList_v24: string;

export declare const AVMetadataID3MetadataKeyTime: string;

export declare const AVMetadataID3MetadataKeyEncodedBy: string;

export declare const AVMetadataID3MetadataKeyTaggingTime: string;

export declare const AVMetadataID3MetadataKeyOriginalReleaseTime: string;

export declare const AVMetadataID3MetadataKeyPlaylistDelay: string;

export declare const AVMetadataID3MetadataKeyEncodingTime: string;

export declare const AVMetadataQuickTimeUserDataKeyDescription: string;

export declare const AVMetadataID3MetadataKeyContentType: string;

export declare const AVMetadataID3MetadataKeySeek: string;

export declare const AVMetadataID3MetadataKeyRelativeVolumeAdjustment2: string;

export declare const AVMetadataID3MetadataKeyRelativeVolumeAdjustment: string;

export declare const AVMetadataID3MetadataKeyOwnership: string;

export declare const AVMetadataID3MetadataKeyMPEGLocationLookupTable: string;

export declare const AVMetadataID3MetadataKeyCommercial: string;

export declare const AVMetadataID3MetadataKeyAttachedPicture: string;

export declare const AVMetadataFormatID3Metadata: string;

export declare const AVMetadataiTunesMetadataKeyExecProducer: string;

export declare const AVMetadataiTunesMetadataKeyPerformer: string;

export declare const AVMetadataiTunesMetadataKeyProducer: string;

export declare const AVMetadataiTunesMetadataKeyOriginalArtist: string;

export declare const AVMetadataiTunesMetadataKeyAcknowledgement: string;

export declare const AVMetadataiTunesMetadataKeyArtDirector: string;

export declare const AVMetadataiTunesMetadataKeyContentRating: string;

export declare const AVMetadataiTunesMetadataKeyPlaylistID: string;

export declare const AVMetadataiTunesMetadataKeyDiscNumber: string;

export declare const AVMetadataiTunesMetadataKeyPredefinedGenre: string;

export declare const AVMetadataiTunesMetadataKeyEncodedBy: string;

export declare const AVMetadataiTunesMetadataKeyReleaseDate: string;

export declare const AVMetadataiTunesMetadataKeyCopyright: string;

export declare const AVMetadataiTunesMetadataKeyCoverArt: string;

export declare const AVMetadataiTunesMetadataKeyUserComment: string;

export declare const AVMetadataiTunesMetadataKeyAlbum: string;

export declare const AVMetadataKeySpaceiTunes: string;

export declare const AVVideoWidthKey: string;

export declare const AVMetadataQuickTimeMetadataKeyAccessibilityDescription: string;

export declare const AVMetadataQuickTimeMetadataKeyContentIdentifier: string;

export declare const AVMetadataQuickTimeMetadataKeyLocationDate: string;

export declare const AVMetadataQuickTimeMetadataKeyLocationNote: string;

export declare const AVMetadataQuickTimeMetadataKeyLocationBody: string;

export declare const AVMetadataQuickTimeMetadataKeyCollectionUser: string;

export declare const AVMetadataQuickTimeMetadataKeyPhonogramRights: string;

export declare const AVMetadataQuickTimeMetadataKeyCredits: string;

export declare const AVMetadataQuickTimeMetadataKeyMake: string;

export declare const AVMetadataQuickTimeMetadataKeyiXML: string;

export declare const AVMetadataQuickTimeMetadataKeyArtist: string;

export declare const AVMetadataFormatUnknown: string;

export declare const AVMetadataQuickTimeMetadataKeyAlbum: string;

export declare const AVMetadataQuickTimeMetadataKeyKeywords: string;

export declare const AVMetadataQuickTimeMetadataKeyInformation: string;

export declare const AVMetadataQuickTimeMetadataKeyDirector: string;

export declare const AVMetadataQuickTimeMetadataKeyComment: string;

export declare const AVMetadataKeySpaceQuickTimeMetadata: string;

export declare const AVMetadata3GPUserDataKeyMediaClassification: string;

export declare const AVMetadata3GPUserDataKeyKeywordList: string;

export declare const AVMetadata3GPUserDataKeyUserRating: string;

export declare const AVMetadata3GPUserDataKeyDescription: string;

export declare const AVMetadata3GPUserDataKeyLocation: string;

export declare const AVMetadata3GPUserDataKeyGenre: string;

export declare const AVMetadata3GPUserDataKeyPerformer: string;

export declare const AVMetadataISOUserDataKeyAccessibilityDescription: string;

export declare const AVMetadataISOUserDataKeyTaggedCharacteristic: string;

export declare const AVMetadataKeySpaceISOUserData: string;

export declare const AVMetadataFormatISOUserData: string;

export declare const AVMetadataQuickTimeUserDataKeyTaggedCharacteristic: string;

export declare const AVMetadataQuickTimeUserDataKeyPhonogramRights: string;

export declare const AVMetadataQuickTimeUserDataKeyWarning: string;

export declare const AVMetadataQuickTimeUserDataKeySoftware: string;

export declare const AVMetadataQuickTimeUserDataKeyProducer: string;

export declare const AVMetadataQuickTimeUserDataKeyMake: string;

export declare const AVMetadataQuickTimeUserDataKeyHostComputer: string;

export declare const AVMetadataQuickTimeUserDataKeyCopyright: string;

export declare const AVMetadataQuickTimeUserDataKeyChapter: string;

export declare const AVMetadataQuickTimeUserDataKeyAuthor: string;

export declare const AVMetadataQuickTimeUserDataKeyArranger: string;

export declare const AVMetadataCommonKeyModel: string;

export declare const AVMetadataCommonKeyCopyrights: string;

export declare const AVMetadataCommonKeyRelation: string;

export declare const AVMetadataCommonKeyLanguage: string;

export declare const AVMetadataCommonKeyType: string;

export declare const AVMetadataCommonKeyContributor: string;

export declare const AVMetadataCommonKeyPublisher: string;

export declare const AVFileTypeProfileMPEG4AppleHLS: string;

export declare const AVStreamingKeyDeliveryPersistentContentKeyType: string;

export declare const AVFileTypeHEIF: string;

export declare const AVFileTypeHEIC: string;

export declare const AVFileTypeJPEG: string;

export declare const AVFileTypeEnhancedAC3: string;

export declare const AVFileTypeAMR: string;

export declare const AVFileTypeAIFF: string;

export declare const AVFileType3GPP: string;

export declare const AVFileTypeAppleM4A: string;

export declare const AVMediaCharacteristicDescribesVideoForAccessibility: string;

export declare const AVMediaCharacteristicDescribesMusicAndSoundForAccessibility: string;

export declare const AVMediaCharacteristicTranscribesSpokenDialogForAccessibility: string;

export declare const AVMediaCharacteristicIsOriginalContent: string;

export declare const AVMediaCharacteristicContainsAlphaChannel: string;

export declare const AVMediaCharacteristicUsesWideGamutColorSpace: string;

export declare const AVMediaTypeAuxiliaryPicture: string;

export declare const AVMediaTypeTimecode: string;

export declare const AVMediaTypeSubtitle: string;

export declare const AVMediaTypeVideo: string;

export declare const AVContentKeyRequestRetryReasonReceivedResponseWithExpiredLease: string;

export declare const AVContentKeySessionServerPlaybackContextOptionProtocolVersions: string;

export declare const AVContentKeySystemClearKey: string;

export declare const AVMetadataQuickTimeUserDataKeyOriginalArtist: string;

export declare const AVMetadataIdentifierID3MetadataUniqueFileIdentifier: string;

export declare const AVContentKeyRequestProtocolVersionsKey: string;

export declare const AVMetadataQuickTimeMetadataKeyRatingUser: string;

export declare const AVAssetExportPresetHEVCHighestQuality: string;

export declare const AVCoreAnimationBeginTimeAtZero: number;

export declare const AVMetadataID3MetadataKeyRecommendedBufferSize: string;

export declare const AVFileTypeDNG: string;

export declare const AVAssetDownloadTaskMinimumRequiredMediaBitrateKey: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDirector: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDisplayName: string;

export declare const AVMetadataiTunesMetadataKeyCredits: string;

export declare const AVMetadataIdentifierQuickTimeUserDataOriginalSource: string;

export declare const AVMetadataExtraAttributeValueURIKey: string;

export declare const AVVideoH264EntropyModeCABAC: string;

export declare const AVMetadataCommonKeyAuthor: string;

export declare const AVMetadataIdentifieriTunesMetadataRecordCompany: string;

export declare const AVMetadataCommonIdentifierCopyrights: string;

export declare const AVVideoProfileLevelH264High41: string;

export declare const AVMetadataIdentifierQuickTimeUserDataArranger: string;

export declare const AVVideoColorPrimaries_EBU_3213: string;

export declare const AVMetadataID3MetadataKeySynchronizedTempoCodes: string;

export declare const AVMetadataID3MetadataKeyMusicCDIdentifier: string;

export declare const AVMetadataQuickTimeMetadataKeyProducer: string;

export declare const AVURLAssetAllowsConstrainedNetworkAccessKey: string;

export declare const AVVideoScalingModeFit: string;

export declare const AVMetadataIdentifieriTunesMetadataArtist: string;

export declare const AVVideoMaxKeyFrameIntervalKey: string;

export declare const AVMetadataID3MetadataKeyCommercialInformation: string;

export declare const AVVideoScalingModeResizeAspect: string;

export declare const AVPlayerItemFailedToPlayToEndTimeErrorKey: string;

export declare const AVMetadataIdentifierQuickTimeUserDataPublisher: string;

export declare const AVMediaTypeMetadata: string;

export declare const AVVideoScalingModeKey: string;

export declare const AVMetadataID3MetadataKeyMediaType: string;

export declare const AVMetadataIdentifierID3MetadataContentType: string;

export declare const AVAssetExportPresetHEVC1920x1080: string;

export declare const AVMediaCharacteristicVoiceOverTranslation: string;

export declare const AVMetadataID3MetadataKeySignature: string;

export declare const AVMetadataQuickTimeMetadataKeyDisplayName: string;

export declare const AVMetadataID3MetadataKeyReverb: string;

export declare const AVMetadataiTunesMetadataKeySongName: string;

export declare const AVVideoProfileLevelH264Main32: string;

export declare const AVMetadataiTunesMetadataKeySongID: string;

export declare const AVMetadataID3MetadataKeyMusicianCreditsList: string;

export declare const AVMetadataQuickTimeMetadataKeyOriginalArtist: string;

export declare const AVVideoCodecTypeJPEG: string;

export declare const AVVideoApertureModeProductionAperture: string;

export declare const AVMetadataIdentifierID3MetadataEqualization2: string;

export declare const AVVideoProfileLevelH264Baseline30: string;

export declare const AVVideoTransferFunction_SMPTE_ST_2084_PQ: string;

export declare const AVMetadataCommonKeyAlbumName: string;

export declare const AVVideoProfileLevelH264HighAutoLevel: string;

export declare const AVVideoCleanApertureVerticalOffsetKey: string;

export declare const AVMetadataQuickTimeMetadataKeyDescription: string;

export declare const AVMetadataIdentifierISOUserDataAccessibilityDescription: string;

export declare const AVVideoCodecAppleProRes4444: string;

export declare const AVMetadataFormatQuickTimeUserData: string;

export declare const AVMetadataID3MetadataKeyUnsynchronizedLyric: string;

export declare const AVMetadataiTunesMetadataKeyBeatsPerMin: string;

export declare const AVMetadataCommonKeyTitle: string;

export declare const AVMetadataIdentifier3GPUserDataTitle: string;

export declare const AVMetadataQuickTimeMetadataKeyLocationRole: string;

export declare const AVMetadata3GPUserDataKeyMediaRating: string;

export declare const AVCaptureMaxAvailableTorchLevel: number;

export declare const AVMetadataObjectTypeFace: string;

export declare const AVSemanticSegmentationMatteTypeHair: string;

export declare const AVMetadataIdentifierID3MetadataDate: string;

export declare const AVMetadataID3MetadataKeyDate: string;

export declare const AVMetadataIdentifierQuickTimeUserDataKeywords: string;

export declare const AVMetadataCommonIdentifierCreationDate: string;

export declare const AVMetadataQuickTimeMetadataKeyCopyright: string;

export declare const AVSampleBufferAudioRendererWasFlushedAutomaticallyNotification: string;

export declare const AVMetadataObjectTypeSalientObject: string;

export declare const AVMetadata3GPUserDataKeyCollection: string;

export declare const AVMetadataQuickTimeUserDataKeyInformation: string;

export declare const AVMetadataIdentifierID3MetadataBand: string;

export declare const AVMetadataIdentifierID3MetadataPlayCounter: string;

export declare const AVSemanticSegmentationMatteTypeGlasses: string;

export declare const AVMetadataiTunesMetadataKeyDirector: string;

export declare const AVAssetExportPresetLowQuality: string;

export declare const AVURLAssetReferenceRestrictionsKey: string;

export declare const AVMetadataExtraAttributeInfoKey: string;

export declare const AVMetadataQuickTimeUserDataKeySpecialPlaybackRequirements: string;

export declare const AVMetadataIdentifierQuickTimeMetadataCameraFrameReadoutTime: string;

export declare const AVMetadataQuickTimeMetadataKeyDirectionFacing: string;

export declare const AVMetadataObjectTypeCatBody: string;

export declare const AVMetadataID3MetadataKeyGeneralEncapsulatedObject: string;

export declare const AVMediaCharacteristicDubbedTranslation: string;

export declare const AVMediaTypeClosedCaption: string;

export declare const AVMetadataQuickTimeUserDataKeyAccessibilityDescription: string;

export declare const AVMetadataQuickTimeUserDataKeyOriginalSource: string;

export declare const AVMetadataiTunesMetadataKeyPhonogramRights: string;

export declare const AVMetadataQuickTimeUserDataKeyCredits: string;

export declare const AVMetadataID3MetadataKeyCopyright: string;

export declare const AVMetadata3GPUserDataKeyAlbumAndTrack: string;

export declare const AVPlayerItemPlaybackStalledNotification: string;

export declare const AVMediaCharacteristicContainsOnlyForcedSubtitles: string;

export declare const AVMetadataQuickTimeMetadataKeyArtwork: string;

export declare const AVFileTypeWAVE: string;

export declare const AVMetadataKeySpaceAudioFile: string;

export declare const AVMetadataIdentifieriTunesMetadataPublisher: string;

export declare const AVURLAssetHTTPCookiesKey: string;

export declare const AVMetadataQuickTimeUserDataKeyTrack: string;

export declare const AVMediaCharacteristicContainsHDRVideo: string;

export declare const AVMetadataID3MetadataKeyRecordingTime: string;

export declare const AVAssetExportPreset960x540: string;

export declare const AVMetadata3GPUserDataKeyThumbnail: string;

export declare const AVMetadataiTunesMetadataKeyUserGenre: string;

export declare const AVMetadataObjectTypeDataMatrixCode: string;

export declare const AVMetadataQuickTimeMetadataKeySoftware: string;

export declare const AVMetadataIdentifier3GPUserDataThumbnail: string;

export declare const AVTrackAssociationTypeForcedSubtitlesOnly: string;

export declare const AVVideoH264EntropyModeKey: string;

export declare const AVMetadataIdentifierID3MetadataModifiedBy: string;

export declare const AVMetadataQuickTimeUserDataKeyEncodedBy: string;

export declare const AVStreamingKeyDeliveryContentKeyType: string;

export declare const AVAssetTrackSegmentsDidChangeNotification: string;

export declare const AVVideoColorPrimaries_ITU_R_2020: string;

export declare const AVVideoMaxKeyFrameIntervalDurationKey: string;

export declare const AVMetadataQuickTimeUserDataKeyPerformers: string;

export declare const AVMetadataID3MetadataKeyPositionSynchronization: string;

export declare const AVAssetExportPresetAppleM4A: string;

export declare const AVMetadataIdentifier3GPUserDataPerformer: string;

export declare const AVMetadataID3MetadataKeyTermsOfUse: string;

export declare const AVMediaTypeText: string;

export declare const AVMetadataiTunesMetadataKeyLinerNotes: string;

export declare const AVVideoPixelAspectRatioVerticalSpacingKey: string;

export declare const AVMetadataKeySpaceQuickTimeUserData: string;

export declare const AVURLAssetAllowsExpensiveNetworkAccessKey: string;

export declare const AVMetadataCommonKeyCreator: string;

export declare const AVAssetExportPresetHEVC3840x2160WithAlpha: string;

export declare const AVContentKeySystemFairPlayStreaming: string;

export declare const AVMetadataQuickTimeUserDataKeyOriginalFormat: string;

export declare const AVCaptureSessionPreset320x240: string;

export declare const AVMetadataCommonKeySource: string;

export declare const AVMetadataQuickTimeMetadataKeyLocationName: string;

export declare const AVOutputSettingsPresetHEVC1920x1080: string;

export declare const AVMetadataID3MetadataKeyAlbumTitle: string;

export declare const AVVideoEncoderSpecificationKey: string;

export declare const AVAssetExportPresetPassthrough: string;

export declare const AVTrackAssociationTypeSelectionFollower: string;

export declare const AVVideoCodecH264: string;

export declare const AVVideoYCbCrMatrix_ITU_R_2020: string;

export declare const AVMetadataiTunesMetadataKeyDescription: string;

export declare const AVVideoExpectedSourceFrameRateKey: string;

export declare const AVMetadataIdentifieriTunesMetadataThanks: string;

export declare const AVFileTypeCoreAudioFormat: string;

export declare const AVMetadataQuickTimeMetadataKeyYear: string;

export declare const AVMetadataiTunesMetadataKeyGenreID: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDirectionMotion: string;

export declare const AVURLAssetPreferPreciseDurationAndTimingKey: string;

export declare const AVVideoAllowWideColorKey: string;

export declare const AVMetadataIdentifieriTunesMetadataDiscNumber: string;

export declare const AVMetadataiTunesMetadataKeyArtist: string;

export declare const AVTrackAssociationTypeTimecode: string;

export declare const AVMetadata3GPUserDataKeyRecordingYear: string;

export declare const AVMetadataIdentifierID3MetadataInvolvedPeopleList_v24: string;

export declare const AVVideoProfileLevelH264Main41: string;

export declare const AVMetadataQuickTimeMetadataKeyEncodedBy: string;

export declare const AVOutputSettingsPreset640x480: string;

export declare const AVMetadataQuickTimeUserDataKeyLocationISO6709: string;

export declare const AVMetadataID3MetadataKeyEqualization: string;

export declare const AVMetadata3GPUserDataKeyTitle: string;

export declare const AVMetadataiTunesMetadataKeyConductor: string;

export declare const AVMetadataiTunesMetadataKeyTrackNumber: string;

export declare const AVMetadataQuickTimeUserDataKeyModel: string;

export declare const AVMetadataiTunesMetadataKeySoloist: string;

export declare const AVMetadataIdentifierID3MetadataUnsynchronizedLyric: string;

export declare const AVMetadataIdentifierQuickTimeUserDataPhonogramRights: string;

export declare const AVPlayerItemLegibleOutputTextStylingResolutionDefault: string;

export declare const AVMetadataCommonKeyFormat: string;

export declare const AVMetadataID3MetadataKeyInvolvedPeopleList_v23: string;

export declare const AVMediaTypeHaptic: string;

export declare const AVMetadataiTunesMetadataKeyTrackSubTitle: string;

export declare const AVMetadataIdentifierID3MetadataTime: string;

export declare const AVMetadataCommonIdentifierLanguage: string;

export declare const AVFileTypeMPEG4: string;

export declare const AVMetadataiTunesMetadataKeyComposer: string;

export declare const AVMetadataCommonKeyDescription: string;

export declare const AVMetadataIdentifieriTunesMetadataPhonogramRights: string;

export declare const AVMetadataCommonKeyLastModifiedDate: string;

export declare const AVPlayerItemNewAccessLogEntryNotification: string;

export declare const AVMetadataIdentifierID3MetadataSetSubtitle: string;

export declare const AVMediaCharacteristicLegible: string;

export declare const AVMetadataIdentifierID3MetadataEqualization: string;

export declare const AVMetadataQuickTimeUserDataKeyDirector: string;

export declare const AVMetadataObjectTypeUPCECode: string;

export declare const AVMetadataQuickTimeMetadataKeyModel: string;

export declare const AVErrorFileTypeKey: string;

export declare const AVMediaCharacteristicIsMainProgramContent: string;

export declare const AVMetadataQuickTimeUserDataKeyFullName: string;

export declare const AVContentKeyRequestRetryReasonReceivedObsoleteContentKey: string;

export declare const AVMetadataID3MetadataKeyRecordingDates: string;

export declare const AVVideoColorPropertiesKey: string;

export declare const AVMetadataID3MetadataKeySetSubtitle: string;

export declare const AVAssetMediaSelectionGroupsDidChangeNotification: string;

export declare const AVMetadataIdentifierID3MetadataCommercial: string;

export declare const AVMetadataISOUserDataKeyDate: string;

export declare const AVMetadataIdentifierQuickTimeMetadataAccessibilityDescription: string;

export declare const AVMetadataIdentifieriTunesMetadataSongID: string;

export declare const AVMediaCharacteristicAudible: string;

export declare const AVMetadataQuickTimeUserDataKeyComment: string;

export declare const AVMetadataID3MetadataKeyOriginalFilename: string;

export declare const AVFileTypeMPEGLayer3: string;

export declare const AVMediaCharacteristicEasyToRead: string;

export declare const AVMetadataKeySpaceCommon: string;

export declare const AVMetadataQuickTimeMetadataKeyArranger: string;

export declare const AVMetadataIdentifierIcyMetadataStreamURL: string;

export declare const AVFileTypeQuickTimeMovie: string;

export declare const AVMetadataID3MetadataKeyContentGroupDescription: string;

export declare const AVMetadataIdentifierID3MetadataLength: string;

export declare const AVMetadataIdentifierID3MetadataAudioSeekPointIndex: string;

export declare const AVMetadataCommonIdentifierModel: string;

export declare const AVMetadataID3MetadataKeyLyricist: string;

export declare const AVMetadataQuickTimeMetadataKeyCreationDate: string;

export declare const AVMetadataQuickTimeMetadataKeyLocationISO6709: string;

export declare const AVMetadataCommonIdentifierDescription: string;

export declare const AVMetadataCommonKeyLocation: string;

export declare const AVFileType3GPP2: string;

export declare const AVMetadataID3MetadataKeyMood: string;

export declare const AVVideoScalingModeResizeAspectFill: string;

export declare const AVMetadataIdentifieriTunesMetadataAlbum: string;

export declare const AVMetadataCommonKeyIdentifier: string;

export declare const AVAssetDownloadedAssetEvictionPriorityImportant: string;

export declare const AVAssetWriterInputMediaDataLocationInterleavedWithMainMediaData: string;

export declare const AVFileTypeSunAU: string;

export declare const AVMetadataiTunesMetadataKeyPublisher: string;

export declare const AVMetadataID3MetadataKeyEventTimingCodes: string;

export declare const AVMetadataIdentifieriTunesMetadataConductor: string;

export declare const AVMetadataID3MetadataKeyCommerical: string;

export declare const AVContentKeySessionServerPlaybackContextOptionServerChallenge: string;

export declare const AVMetadataID3MetadataKeyAudioEncryption: string;

export declare const AVMetadataCommonIdentifierArtwork: string;

export declare const AVSampleBufferDisplayLayerRequiresFlushToResumeDecodingDidChangeNotification: string;

export declare const AVMetadataFormatQuickTimeMetadata: string;

export declare const AVMetadataIcyMetadataKeyStreamTitle: string;

export declare const AVMediaTypeDepthData: string;

export declare const AVAssetExportPreset3840x2160: string;

export declare const AVMetadataCommonKeyArtwork: string;

export declare const AVMediaCharacteristicLanguageTranslation: string;

export declare const AVMetadataCommonKeySubject: string;

export declare const AVMetadataID3MetadataKeyPlayCounter: string;

export declare const AVMetadataQuickTimeUserDataKeyWriter: string;

export declare const AVMetadataIdentifieriTunesMetadataAppleID: string;

export declare const AVAssetExportPresetHEVCHighestQualityWithAlpha: string;

export declare const AVVideoProfileLevelKey: string;

export declare const AVErrorPersistentTrackIDKey: string;

export declare const AVMetadataIdentifierQuickTimeUserDataChapter: string;

export declare const AVMetadataCommonKeyMake: string;

export declare const AVMetadataIdentifieriTunesMetadataDirector: string;

export declare const AVAssetDownloadTaskMinimumRequiredPresentationSizeKey: string;

export declare const AVMetadataIdentifierID3MetadataLyricist: string;

export declare const AVMetadataID3MetadataKeyComments: string;

export declare const AVMetadataIdentifierID3MetadataTitleDescription: string;

export declare const AVMetadataQuickTimeMetadataKeyCameraIdentifier: string;

export declare const AVMetadataIdentifieriTunesMetadataDiscCompilation: string;

export declare const AVMetadataIdentifieriTunesMetadataDescription: string;

export declare const AVMetadataIdentifier3GPUserDataUserRating: string;

export declare const AVMetadataIdentifierQuickTimeUserDataCredits: string;

export declare const AVMetadataID3MetadataKeyTrackNumber: string;

export declare const AVContentKeyRequestRequiresValidationDataInSecureTokenKey: string;

export declare const AVAssetExportPresetAppleM4V720pHD: string;

export declare const AVFileTypeAVCI: string;

export declare const AVAssetExportPresetAppleM4ViPod: string;

export declare const AVVideoCodecTypeAppleProRes4444: string;

export declare const AVMetadata3GPUserDataKeyAuthor: string;

export declare const AVMetadataIdentifierID3MetadataPublisher: string;

export declare const AVMetadataFormatiTunesMetadata: string;

export declare const AVMetadataiTunesMetadataKeyEQ: string;

export declare const AVMediaTypeAudio: string;

export declare const AVVideoCodecKey: string;

export declare const AVVideoColorPrimaries_SMPTE_C: string;

export declare const AVMetadataIdentifierID3MetadataOfficialArtistWebpage: string;

export declare const AVCaptureInputPortFormatDescriptionDidChangeNotification: string;

export declare const AVMetadataCommonKeySoftware: string;

export declare const AVVideoProfileLevelH264High40: string;

export declare const AVMetadataID3MetadataKeyFileType: string;

export declare const AVVideoCodecTypeAppleProRes422: string;

export declare const AVMetadataID3MetadataKeyOfficialInternetRadioStationHomepage: string;

export declare const AVMetadataObjectTypeDogBody: string;

export declare const AVMetadataiTunesMetadataKeyEncodingTool: string;

export declare const AVMetadataQuickTimeMetadataKeyDirectionMotion: string;

export declare const AVMetadataQuickTimeUserDataKeyCreationDate: string;

export declare const AVAssetContainsFragmentsDidChangeNotification: string;

export declare const AVFragmentedMovieTrackTimeRangeDidChangeNotification: string;

export declare const AVMetadataIdentifierID3MetadataRecordingDates: string;

export declare const AVMetadataQuickTimeMetadataKeyPerformer: string;

export declare const AVMetadataID3MetadataKeyOriginalReleaseYear: string;

export declare const AVMetadataiTunesMetadataKeyOnlineExtras: string;

export declare const AVMetadataID3MetadataKeyLanguage: string;

export declare const AVVideoCodecTypeHEVCWithAlpha: string;

export declare const AVCaptureSessionPreset960x540: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLivePhotoVitalityScoringVersion: string;

export declare const AVVideoCleanApertureKey: string;

export declare const AVMetadataIdentifierID3MetadataSeek: string;

export declare const AVMetadataIdentifierID3MetadataInvolvedPeopleList_v23: string;

export declare const AVURLAssetAllowsCellularAccessKey: string;

export declare const AVMetadata3GPUserDataKeyCopyright: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLivePhotoVitalityScore: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDirectionFacing: string;

export declare const AVMetadataID3MetadataKeyOfficialAudioFileWebpage: string;

export declare const AVMetadataCommonIdentifierSource: string;

export declare const AVMetadataIdentifierID3MetadataFileOwner: string;

export declare const AVMetadataIdentifierQuickTimeMetadataOriginalArtist: string;

export declare const AVMetadataIdentifierQuickTimeUserDataComposer: string;

export declare const AVMetadataiTunesMetadataKeyAuthor: string;

export declare const AVOutputSettingsPreset960x540: string;

export declare const AVCaptureSessionPresetHigh: string;

export declare const AVVideoHeightKey: string;

export declare const AVMetadataIdentifieriTunesMetadataCredits: string;

export declare const AVAssetWasDefragmentedNotification: string;

export declare const AVMetadataiTunesMetadataKeyArtistID: string;

export declare const AVMetadataID3MetadataKeySynchronizedLyric: string;

export declare const AVMetadataiTunesMetadataKeyRecordCompany: string;

export declare const AVMetadataIdentifierID3MetadataPrivate: string;

export declare const AVMetadataIdentifierQuickTimeMetadataAuthor: string;

export declare const AVMetadataiTunesMetadataKeyDiscCompilation: string;

export declare const AVMetadataID3MetadataKeyPayment: string;

export declare const AVMetadataID3MetadataKeyOfficialAudioSourceWebpage: string;

export declare const AVVideoAverageBitRateKey: string;

export declare const AVMetadataiTunesMetadataKeyAccountKind: string;

export declare const AVMetadataQuickTimeMetadataKeyCameraFrameReadoutTime: string;

export declare const AVMetadataIdentifierID3MetadataPayment: string;

export declare const AVMediaCharacteristicVisual: string;

export declare const AVMetadataID3MetadataKeyGroupIdentifier: string;

export declare const AVMetadataIdentifierQuickTimeMetadataCreationDate: string;

export declare const AVMetadataCommonIdentifierAuthor: string;

export declare const AVMetadataIdentifierQuickTimeUserDataCreationDate: string;

export declare const AVMetadataIdentifierQuickTimeUserDataOriginalFormat: string;

export declare const AVMetadataIdentifierID3MetadataInternationalStandardRecordingCode: string;

export declare const AVMetadataKeySpaceID3: string;

export declare const AVMetadataIdentifierQuickTimeUserDataDescription: string;

export declare const AVMediaTypeMuxed: string;

export declare const AVMetadataiTunesMetadataKeyAppleID: string;

export declare const AVMetadataQuickTimeUserDataKeyPublisher: string;

export declare const AVMetadataID3MetadataKeyEncodedWith: string;

export declare const AVMetadataIdentifieriTunesMetadataArtistID: string;

export declare const AVMetadataQuickTimeMetadataKeyPublisher: string;

export declare const AVFileTypeTIFF: string;

export declare const AVMetadataID3MetadataKeyBeatsPerMinute: string;

export declare const AVMetadataIdentifierID3MetadataEncodedBy: string;

export declare const AVMetadataID3MetadataKeyPrivate: string;

export declare const AVMediaCharacteristicIsAuxiliaryContent: string;

export declare const AVMetadataIdentifierID3MetadataInternetRadioStationName: string;

export declare const AVMetadataID3MetadataKeyTitleDescription: string;

export declare const AVMetadataQuickTimeUserDataKeyProduct: string;

export declare const AVLayerVideoGravityResize: string;

export declare const AVMetadataObjectTypeCode128Code: string;

export declare const AVMetadataiTunesMetadataKeyArranger: string;

export declare const AVMetadataID3MetadataKeyEqualization2: string;

export declare const AVTrackAssociationTypeAudioFallback: string;

export declare const AVMetadataIdentifierID3MetadataLink: string;

export declare const AVMetadataObjectTypeCode39Code: string;

export declare const AVFragmentedMovieWasDefragmentedNotification: string;

export declare const AVMetadataID3MetadataKeyAlbumSortOrder: string;

export declare const AVMetadataiTunesMetadataKeyThanks: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLocationBody: string;

export declare const AVMetadataQuickTimeUserDataKeyAlbum: string;

export declare const AVMetadataIdentifierQuickTimeMetadataDetectedSalientObject: string;

export declare const AVMetadataIdentifierID3MetadataReleaseTime: string;

export declare const AVMetadataQuickTimeUserDataKeyArtist: string;

export declare const AVMetadataIdentifierID3MetadataUserURL: string;

export declare const AVFragmentedMovieDurationDidChangeNotification: string;

export declare const AVVideoProfileLevelH264Main31: string;

export declare const AVMetadataQuickTimeMetadataKeyComposer: string;

export declare const AVVideoCodecJPEG: string;

export declare const AVMetadataQuickTimeUserDataKeyTrackName: string;

export declare const AVAssetResourceLoadingRequestStreamingContentKeyRequestRequiresPersistentKey: string;

export declare const AVMetadataIdentifierID3MetadataYear: string;

export declare const AVMetadataID3MetadataKeyAudioSeekPointIndex: string;

export declare const AVMetadataCommonKeyAccessibilityDescription: string;

export declare const AVLayerVideoGravityResizeAspect: string;

export declare const AVMetadataCommonKeyCreationDate: string;

export declare const AVMetadataIdentifierQuickTimeMetadataLocationISO6709: string;

export declare const AVMetadataIdentifierQuickTimeMetadataInformation: string;

export declare const AVMetadataID3MetadataKeyComposer: string;

export declare const AVCaptureSessionPresetiFrame1280x720: string;

export declare const AVMetadataiTunesMetadataKeySoundEngineer: string;

export declare const AVMetadataCommonIdentifierMake: string;

export declare const AVMetadataID3MetadataKeyFileOwner: string;

export declare const AVMetadataIdentifierID3MetadataCopyrightInformation: string;

export declare const AVMetadataID3MetadataKeyEncryption: string;

export declare const AVContentKeySystemAuthorizationToken: string;

export declare const AVContentKeyRequestRetryReasonTimedOut: string;

export declare const AVMetadataIdentifieriTunesMetadataTrackNumber: string;

export declare const AVMetadataQuickTimeMetadataKeyGenre: string;

export declare const AVMetadataObjectTypePDF417Code: string;

export declare const AVMetadataIdentifieriTunesMetadataOriginalArtist: string;

export declare const AVMetadataID3MetadataKeyPerformerSortOrder: string;

export declare const AVFileTypeProfileMPEG4CMAFCompliant: string;

export declare const AVFileTypeAIFC: string;

export declare const AVMetadataQuickTimeUserDataKeyURLLink: string;

export declare const AVAssetExportPreset1280x720: string;

export declare const AVMetadataID3MetadataKeyPopularimeter: string;

export declare const AVMetadataIdentifieriTunesMetadataEncodingTool: string;

export declare const AVMetadataQuickTimeUserDataKeyGenre: string;

export declare const AVLayerVideoGravityResizeAspectFill: string;

export declare const AVCaptureSessionErrorKey: string;

export declare const AVMetadataIdentifierQuickTimeMetadataPhonogramRights: string;

export declare const AVMetadataiTunesMetadataKeyAlbumArtist: string;

export declare const AVMetadataQuickTimeMetadataKeyAuthor: string;

export declare const AVMetadataID3MetadataKeyCopyrightInformation: string;

export declare const AVMetadataiTunesMetadataKeyGrouping: string;

export declare const AVMetadataCommonKeyArtist: string;

export declare const AVFileTypeAppleM4V: string;

export declare const AVMetadataQuickTimeUserDataKeyDisclaimer: string;

export declare const AVMetadataIdentifierQuickTimeMetadataYear: string;

export declare const AVMetadataCommonIdentifierPublisher: string;

export declare const AVMediaCharacteristicFrameBased: string;

export declare const AVMetadataIdentifier3GPUserDataAuthor: string;

export declare const AVMetadataID3MetadataKeyLeadPerformer: string;

export declare const AVErrorMediaTypeKey: string;

export declare const AVMetadataIdentifieriTunesMetadataPlaylistID: string;

export declare const AVAssetWriterInputMediaDataLocationBeforeMainMediaDataNotInterleaved: string;

export declare const AVMetadataiTunesMetadataKeyLyrics: string;

export declare const AVFoundationErrorDomain: string;

export declare const AVCaptureSessionPreset352x288: string;

export declare const AVFileTypeAC3: string;

export declare const AVMetadataID3MetadataKeyReleaseTime: string;

export declare const AVVideoCodecHEVC: string;

export declare const AVMetadataIdentifierQuickTimeMetadataTitle: string;

export declare const AVMetadataQuickTimeUserDataKeyKeywords: string;

export declare const AVAuthorizationStatus: {
  NotDetermined: 0,
  Restricted: 1,
  Denied: 2,
  Authorized: 3,
};

export declare const AVPlayerLooperStatus: {
  Unknown: 0,
  Ready: 1,
  Failed: 2,
  Cancelled: 3,
};

export declare const AVDepthDataQuality: {
  Low: 0,
  High: 1,
};

export declare const AVCaptureOutputDataDroppedReason: {
  None: 0,
  LateData: 1,
  OutOfBuffers: 2,
  Discontinuity: 3,
};

export declare const AVVideoFieldMode: {
  Both: 0,
  TopOnly: 1,
  BottomOnly: 2,
  Deinterlace: 3,
};

export declare const AVCaptureFlashMode: {
  Off: 0,
  On: 1,
  Auto: 2,
};

export declare const AVCaptureDevicePosition: {
  Unspecified: 0,
  Back: 1,
  Front: 2,
};

export declare const AVQueuedSampleBufferRenderingStatus: {
  Unknown: 0,
  Rendering: 1,
  Failed: 2,
};

export declare const AVContentAuthorizationStatus: {
  Unknown: 0,
  Completed: 1,
  Cancelled: 2,
  TimedOut: 3,
  Busy: 4,
  NotAvailable: 5,
  NotPossible: 6,
};

export declare const AVDelegatingPlaybackCoordinatorSeekOptions: {
  AVDelegatingPlaybackCoordinatorSeekOptionResumeImmediately: 1,
};

export declare const AVPlayerTimeControlStatus: {
  Paused: 0,
  WaitingToPlayAtSpecifiedRate: 1,
  Playing: 2,
};

export declare const AVPlayerStatus: {
  Unknown: 0,
  ReadyToPlay: 1,
  Failed: 2,
};

export declare const AVCaptionUnitsType: {
  Unspecified: 0,
  Cells: 1,
  Percent: 2,
};

export declare const AVAssetReaderStatus: {
  Unknown: 0,
  Reading: 1,
  Completed: 2,
  Failed: 3,
  Cancelled: 4,
};

export declare const AVAssetImageGeneratorResult: {
  Succeeded: 0,
  Failed: 1,
  Cancelled: 2,
};

export declare const AVAssetExportSessionStatus: {
  Unknown: 0,
  Waiting: 1,
  Exporting: 2,
  Completed: 3,
  Failed: 4,
  Cancelled: 5,
};

export declare const AVAudioSpatializationFormats: {
  None: 0,
  MonoAndStereo: 3,
  Multichannel: 4,
  MonoStereoAndMultichannel: 7,
};

export declare const AVCaptureDeviceTransportControlsPlaybackMode: {
  Not: 0,
  AVCaptureDeviceTransportControlsPlayingMode: 1,
};

export declare const AVCaptureFocusMode: {
  Locked: 0,
  AutoFocus: 1,
  ContinuousAutoFocus: 2,
};

export declare const AVAssetReferenceRestrictions: {
  ForbidNone: 0,
  ForbidRemoteReferenceToLocal: 1,
  ForbidLocalReferenceToRemote: 2,
  ForbidCrossSiteReference: 4,
  ForbidLocalReferenceToLocal: 8,
  ForbidAll: 65535,
  DefaultPolicy: 2,
};

export declare const AVCaptureWhiteBalanceMode: {
  Locked: 0,
  AutoWhiteBalance: 1,
  ContinuousAutoWhiteBalance: 2,
};

export declare const AVKeyValueStatus: {
  Unknown: 0,
  Loading: 1,
  Loaded: 2,
  Failed: 3,
  Cancelled: 4,
};

export declare const AVCaptureVideoOrientation: {
  Portrait: 1,
  PortraitUpsideDown: 2,
  LandscapeRight: 3,
  LandscapeLeft: 4,
};

export declare const AVCaptureColorSpace: {
  Space_sRGB: 0,
  Space_P3_D65: 1,
};

export declare const AVAssetSegmentType: {
  Initialization: 1,
  Separable: 2,
};

export declare const AVSampleBufferRequestMode: {
  Immediate: 0,
  Scheduled: 1,
  Opportunistic: 2,
};

export declare const AVAssetWriterStatus: {
  Unknown: 0,
  Writing: 1,
  Completed: 2,
  Failed: 3,
  Cancelled: 4,
};

export declare const AVCaptureExposureMode: {
  Locked: 0,
  AutoExpose: 1,
  ContinuousAutoExposure: 2,
  Custom: 3,
};

export declare const AVCaptureTorchMode: {
  Off: 0,
  On: 1,
  Auto: 2,
};

export declare const AVCaptureAutoFocusSystem: {
  None: 0,
  ContrastDetection: 1,
  PhaseDetection: 2,
};

export declare const AVPlayerActionAtItemEnd: {
  Advance: 0,
  Pause: 1,
  None: 2,
};

export declare const AVError: {
  Unknown: -11800,
  OutOfMemory: -11801,
  SessionNotRunning: -11803,
  DeviceAlreadyUsedByAnotherSession: -11804,
  NoDataCaptured: -11805,
  SessionConfigurationChanged: -11806,
  DiskFull: -11807,
  DeviceWasDisconnected: -11808,
  MediaChanged: -11809,
  MaximumDurationReached: -11810,
  MaximumFileSizeReached: -11811,
  MediaDiscontinuity: -11812,
  MaximumNumberOfSamplesForFileFormatReached: -11813,
  DeviceNotConnected: -11814,
  DeviceInUseByAnotherApplication: -11815,
  DeviceLockedForConfigurationByAnotherProcess: -11817,
  ExportFailed: -11820,
  DecodeFailed: -11821,
  InvalidSourceMedia: -11822,
  FileAlreadyExists: -11823,
  CompositionTrackSegmentsNotContiguous: -11824,
  InvalidCompositionTrackSegmentDuration: -11825,
  InvalidCompositionTrackSegmentSourceStartTime: -11826,
  InvalidCompositionTrackSegmentSourceDuration: -11827,
  FileFormatNotRecognized: -11828,
  FileFailedToParse: -11829,
  MaximumStillImageCaptureRequestsExceeded: -11830,
  ContentIsProtected: -11831,
  NoImageAtTime: -11832,
  DecoderNotFound: -11833,
  EncoderNotFound: -11834,
  ContentIsNotAuthorized: -11835,
  ApplicationIsNotAuthorized: -11836,
  OperationNotSupportedForAsset: -11838,
  DecoderTemporarilyUnavailable: -11839,
  EncoderTemporarilyUnavailable: -11840,
  InvalidVideoComposition: -11841,
  ReferenceForbiddenByReferencePolicy: -11842,
  InvalidOutputURLPathExtension: -11843,
  ScreenCaptureFailed: -11844,
  DisplayWasDisabled: -11845,
  TorchLevelUnavailable: -11846,
  IncompatibleAsset: -11848,
  FailedToLoadMediaData: -11849,
  ServerIncorrectlyConfigured: -11850,
  ApplicationIsNotAuthorizedToUseDevice: -11852,
  FailedToParse: -11853,
  FileTypeDoesNotSupportSampleReferences: -11854,
  UndecodableMediaData: -11855,
  AirPlayControllerRequiresInternet: -11856,
  AirPlayReceiverRequiresInternet: -11857,
  VideoCompositorFailed: -11858,
  CreateContentKeyRequestFailed: -11860,
  UnsupportedOutputSettings: -11861,
  OperationNotAllowed: -11862,
  ContentIsUnavailable: -11863,
  FormatUnsupported: -11864,
  MalformedDepth: -11865,
  ContentNotUpdated: -11866,
  NoLongerPlayable: -11867,
  NoCompatibleAlternatesForExternalDisplay: -11868,
  NoSourceTrack: -11869,
  ExternalPlaybackNotSupportedForAsset: -11870,
  OperationNotSupportedForPreset: -11871,
  IncorrectlyConfigured: -11875,
  SegmentStartedWithNonSyncSample: -11876,
  RosettaNotInstalled: -11877,
};

export declare const AVContentKeyRequestStatus: {
  RequestingResponse: 0,
  ReceivedResponse: 1,
  Renewed: 2,
  Retried: 3,
  Cancelled: 4,
  Failed: 5,
};

export declare const AVDelegatingPlaybackCoordinatorRateChangeOptions: {
  AVDelegatingPlaybackCoordinatorRateChangeOptionPlayImmediately: 1,
};

export declare const AVMetricPlaybackMode: {
  Local: 0,
  AirPlayVideo: 1,
};

export declare const AVDepthDataAccuracy: {
  Relative: 0,
  Absolute: 1,
};

export declare const AVPlayerItemStatus: {
  Unknown: 0,
  ReadyToPlay: 1,
  Failed: 2,
};

export declare const AVSampleBufferRequestDirection: {
  Forward: 1,
  None: 0,
  Reverse: -1,
};

export declare const AVMovieWritingOptions: {
  AddMovieHeaderToDestination: 0,
  TruncateDestinationToMovieHeaderOnly: 1,
};

export declare class AVPlannedVideoSegmentBoundaryGuidelines {
  constructor(init?: AVPlannedVideoSegmentBoundaryGuidelines);
  minimumFrameCount: number;
  minimumDuration: CMTime;
}

export declare class AVCaptureWhiteBalanceTemperatureAndTintValues {
  constructor(init?: AVCaptureWhiteBalanceTemperatureAndTintValues);
  temperature: number;
  tint: number;
}

export declare class AVCaptureWhiteBalanceChromaticityValues {
  constructor(init?: AVCaptureWhiteBalanceChromaticityValues);
  x: number;
  y: number;
}

export declare class AVSampleCursorStorageRange {
  constructor(init?: AVSampleCursorStorageRange);
  offset: number;
  length: number;
}

export declare class AVSampleCursorAudioDependencyInfo {
  constructor(init?: AVSampleCursorAudioDependencyInfo);
  audioSampleIsIndependentlyDecodable: boolean;
  audioSamplePacketRefreshCount: number;
}

export declare class AVSampleCursorDependencyInfo {
  constructor(init?: AVSampleCursorDependencyInfo);
  sampleIndicatesWhetherItHasDependentSamples: boolean;
  sampleHasDependentSamples: boolean;
  sampleIndicatesWhetherItDependsOnOthers: boolean;
  sampleDependsOnOthers: boolean;
  sampleIndicatesWhetherItHasRedundantCoding: boolean;
  sampleHasRedundantCoding: boolean;
}

export declare class AVCaptionSize {
  constructor(init?: AVCaptionSize);
  width: AVCaptionDimension;
  height: AVCaptionDimension;
}

export declare class AVEdgeWidths {
  constructor(init?: AVEdgeWidths);
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export declare class AVPixelAspectRatio {
  constructor(init?: AVPixelAspectRatio);
  horizontalSpacing: number;
  verticalSpacing: number;
}

export declare class AVCaptionPoint {
  constructor(init?: AVCaptionPoint);
  x: AVCaptionDimension;
  y: AVCaptionDimension;
}

export declare class AVCaptureWhiteBalanceGains {
  constructor(init?: AVCaptureWhiteBalanceGains);
  redGain: number;
  greenGain: number;
  blueGain: number;
}

export declare class AVSampleCursorChunkInfo {
  constructor(init?: AVSampleCursorChunkInfo);
  chunkSampleCount: number;
  chunkHasUniformSampleSizes: boolean;
  chunkHasUniformSampleDurations: boolean;
  chunkHasUniformFormatDescriptions: boolean;
}

export declare class AVCaptureTimecode {
  constructor(init?: AVCaptureTimecode);
}

export declare class AVSampleCursorSyncInfo {
  constructor(init?: AVSampleCursorSyncInfo);
  sampleIsFullSync: boolean;
  sampleIsPartialSync: boolean;
  sampleIsDroppable: boolean;
}

export declare class AVCaptionDimension {
  constructor(init?: AVCaptionDimension);
  value: number;
  units: interop.Enum<typeof AVCaptionUnitsType>;
}

export declare function AVMakeRectWithAspectRatioInsideRect(aspectRatio: CGSize, boundingRect: CGRect): CGRect;

export declare interface AVVideoCompositionInstructionProtocol extends NSObjectProtocol {
  readonly timeRange: CMTimeRange;

  readonly enablePostProcessing: boolean;

  readonly containsTweening: boolean;

  readonly requiredSourceTrackIDs: NSArray;

  readonly passthroughTrackID: number;
}

export declare class AVVideoCompositionInstructionProtocol extends NativeObject implements AVVideoCompositionInstructionProtocol {
}

export declare interface AVFragmentMinding {
  readonly associatedWithFragmentMinder: boolean;

  isAssociatedWithFragmentMinder(): boolean;
}

export declare class AVFragmentMinding extends NativeObject implements AVFragmentMinding {
}

export declare interface AVCaptureVideoDataOutputSampleBufferDelegate extends NSObjectProtocol {
  captureOutputDidOutputSampleBufferFromConnection?(output: AVCaptureOutput, sampleBuffer: interop.Object, connection: AVCaptureConnection): void;

  captureOutputDidDropSampleBufferFromConnection?(output: AVCaptureOutput, sampleBuffer: interop.Object, connection: AVCaptureConnection): void;
}

export declare class AVCaptureVideoDataOutputSampleBufferDelegate extends NativeObject implements AVCaptureVideoDataOutputSampleBufferDelegate {
}

export declare interface AVPlayerItemLegibleOutputPushDelegate extends AVPlayerItemOutputPushDelegate {
  legibleOutputDidOutputAttributedStringsNativeSampleBuffersForItemTime?(output: AVPlayerItemLegibleOutput, strings: NSArray<interop.Object> | Array<interop.Object>, nativeSamples: NSArray<interop.Object> | Array<interop.Object>, itemTime: CMTime): void;
}

export declare class AVPlayerItemLegibleOutputPushDelegate extends NativeObject implements AVPlayerItemLegibleOutputPushDelegate {
}

export declare interface AVPlayerItemMetadataOutputPushDelegate extends AVPlayerItemOutputPushDelegate {
  metadataOutputDidOutputTimedMetadataGroupsFromPlayerItemTrack?(output: AVPlayerItemMetadataOutput, groups: NSArray<interop.Object> | Array<interop.Object>, track: AVPlayerItemTrack | null): void;
}

export declare class AVPlayerItemMetadataOutputPushDelegate extends NativeObject implements AVPlayerItemMetadataOutputPushDelegate {
}

export declare interface AVQueuedSampleBufferRendering extends NSObjectProtocol {
  readonly timebase: interop.Object;

  enqueueSampleBuffer(sampleBuffer: interop.Object): void;

  flush(): void;

  readonly readyForMoreMediaData: boolean;

  requestMediaDataWhenReadyOnQueueUsingBlock(queue: NSObject, block: () => void): void;

  stopRequestingMediaData(): void;

  isReadyForMoreMediaData(): boolean;
}

export declare class AVQueuedSampleBufferRendering extends NativeObject implements AVQueuedSampleBufferRendering {
}

export declare interface AVPlayerItemOutputPushDelegate extends NSObjectProtocol {
  outputSequenceWasFlushed?(output: AVPlayerItemOutput): void;
}

export declare class AVPlayerItemOutputPushDelegate extends NativeObject implements AVPlayerItemOutputPushDelegate {
}

export declare interface AVPlayerItemOutputPullDelegate extends NSObjectProtocol {
  outputMediaDataWillChange?(sender: AVPlayerItemOutput): void;

  outputSequenceWasFlushed?(output: AVPlayerItemOutput): void;
}

export declare class AVPlayerItemOutputPullDelegate extends NativeObject implements AVPlayerItemOutputPullDelegate {
}

export declare interface AVAssetDownloadDelegate extends NSURLSessionTaskDelegate {
  URLSessionAssetDownloadTaskDidFinishDownloadingToURL?(session: NSURLSession, assetDownloadTask: AVAssetDownloadTask, location: NSURL): void;

  URLSessionAssetDownloadTaskDidLoadTimeRangeTotalTimeRangesLoadedTimeRangeExpectedToLoad?(session: NSURLSession, assetDownloadTask: AVAssetDownloadTask, timeRange: CMTimeRange, loadedTimeRanges: NSArray<interop.Object> | Array<interop.Object>, timeRangeExpectedToLoad: CMTimeRange): void;

  URLSessionAssetDownloadTaskDidResolveMediaSelection?(session: NSURLSession, assetDownloadTask: AVAssetDownloadTask, resolvedMediaSelection: AVMediaSelection): void;

  URLSessionAggregateAssetDownloadTaskWillDownloadToURL?(session: NSURLSession, aggregateAssetDownloadTask: AVAggregateAssetDownloadTask, location: NSURL): void;

  URLSessionAggregateAssetDownloadTaskDidCompleteForMediaSelection?(session: NSURLSession, aggregateAssetDownloadTask: AVAggregateAssetDownloadTask, mediaSelection: AVMediaSelection): void;

  URLSessionAggregateAssetDownloadTaskDidLoadTimeRangeTotalTimeRangesLoadedTimeRangeExpectedToLoadForMediaSelection?(session: NSURLSession, aggregateAssetDownloadTask: AVAggregateAssetDownloadTask, timeRange: CMTimeRange, loadedTimeRanges: NSArray<interop.Object> | Array<interop.Object>, timeRangeExpectedToLoad: CMTimeRange, mediaSelection: AVMediaSelection): void;
}

export declare class AVAssetDownloadDelegate extends NativeObject implements AVAssetDownloadDelegate {
}

export declare interface AVPlayerItemMetadataCollectorPushDelegate extends NSObjectProtocol {
  metadataCollectorDidCollectDateRangeMetadataGroupsIndexesOfNewGroupsIndexesOfModifiedGroups(metadataCollector: AVPlayerItemMetadataCollector, metadataGroups: NSArray<interop.Object> | Array<interop.Object>, indexesOfNewGroups: NSIndexSet, indexesOfModifiedGroups: NSIndexSet): void;
}

export declare class AVPlayerItemMetadataCollectorPushDelegate extends NativeObject implements AVPlayerItemMetadataCollectorPushDelegate {
}

export declare interface AVVideoCompositing extends NSObjectProtocol {
  readonly sourcePixelBufferAttributes: NSDictionary;

  readonly requiredPixelBufferAttributesForRenderContext: NSDictionary;

  renderContextChanged(newRenderContext: AVVideoCompositionRenderContext): void;

  startVideoCompositionRequest(asyncVideoCompositionRequest: AVAsynchronousVideoCompositionRequest): void;

  cancelAllPendingVideoCompositionRequests?(): void;

  readonly supportsWideColorSourceFrames?: boolean;

  readonly supportsHDRSourceFrames?: boolean;

  anticipateRenderingUsingHint?(renderHint: AVVideoCompositionRenderHint): void;

  prerollForRenderingUsingHint?(renderHint: AVVideoCompositionRenderHint): void;
}

export declare class AVVideoCompositing extends NativeObject implements AVVideoCompositing {
}

export declare interface AVContentKeyRecipient {
  readonly mayRequireContentKeysForMediaDataProcessing: boolean;
}

export declare class AVContentKeyRecipient extends NativeObject implements AVContentKeyRecipient {
}

export declare interface AVPlayerItemIntegratedTimelineObserver extends NSObjectProtocol {
}

export declare class AVPlayerItemIntegratedTimelineObserver extends NativeObject implements AVPlayerItemIntegratedTimelineObserver {
}

export declare interface AVCapturePhotoCaptureDelegate extends NSObjectProtocol {
  captureOutputWillBeginCaptureForResolvedSettings?(output: AVCapturePhotoOutput, resolvedSettings: AVCaptureResolvedPhotoSettings): void;

  captureOutputWillCapturePhotoForResolvedSettings?(output: AVCapturePhotoOutput, resolvedSettings: AVCaptureResolvedPhotoSettings): void;

  captureOutputDidCapturePhotoForResolvedSettings?(output: AVCapturePhotoOutput, resolvedSettings: AVCaptureResolvedPhotoSettings): void;

  captureOutputDidFinishProcessingPhotoError?(output: AVCapturePhotoOutput, photo: AVCapturePhoto, error: NSError | null): void;

  captureOutputDidFinishCaptureForResolvedSettingsError?(output: AVCapturePhotoOutput, resolvedSettings: AVCaptureResolvedPhotoSettings, error: NSError | null): void;
}

export declare class AVCapturePhotoCaptureDelegate extends NativeObject implements AVCapturePhotoCaptureDelegate {
}

export declare interface AVCaptureFileOutputRecordingDelegate extends NSObjectProtocol {
  captureOutputDidStartRecordingToOutputFileAtURLFromConnections?(output: AVCaptureFileOutput, fileURL: NSURL, connections: NSArray<interop.Object> | Array<interop.Object>): void;

  captureOutputDidPauseRecordingToOutputFileAtURLFromConnections?(output: AVCaptureFileOutput, fileURL: NSURL, connections: NSArray<interop.Object> | Array<interop.Object>): void;

  captureOutputDidResumeRecordingToOutputFileAtURLFromConnections?(output: AVCaptureFileOutput, fileURL: NSURL, connections: NSArray<interop.Object> | Array<interop.Object>): void;

  captureOutputWillFinishRecordingToOutputFileAtURLFromConnectionsError?(output: AVCaptureFileOutput, fileURL: NSURL, connections: NSArray<interop.Object> | Array<interop.Object>, error: NSError | null): void;

  captureOutputDidFinishRecordingToOutputFileAtURLFromConnectionsError(output: AVCaptureFileOutput, outputFileURL: NSURL, connections: NSArray<interop.Object> | Array<interop.Object>, error: NSError | null): void;
}

export declare class AVCaptureFileOutputRecordingDelegate extends NativeObject implements AVCaptureFileOutputRecordingDelegate {
}

export declare interface AVAssetWriterDelegate extends NSObjectProtocol {
  assetWriterDidOutputSegmentDataSegmentTypeSegmentReport?(writer: AVAssetWriter, segmentData: NSData, segmentType: interop.Enum<typeof AVAssetSegmentType>, segmentReport: AVAssetSegmentReport | null): void;

  assetWriterDidOutputSegmentDataSegmentType?(writer: AVAssetWriter, segmentData: NSData, segmentType: interop.Enum<typeof AVAssetSegmentType>): void;
}

export declare class AVAssetWriterDelegate extends NativeObject implements AVAssetWriterDelegate {
}

export declare interface AVContentKeySessionDelegate extends NSObjectProtocol {
  contentKeySessionDidProvideContentKeyRequest(session: AVContentKeySession, keyRequest: AVContentKeyRequest): void;

  contentKeySessionDidProvideRenewingContentKeyRequest?(session: AVContentKeySession, keyRequest: AVContentKeyRequest): void;

  contentKeySessionDidProvidePersistableContentKeyRequest?(session: AVContentKeySession, keyRequest: AVPersistableContentKeyRequest): void;

  contentKeySessionDidUpdatePersistableContentKeyForContentKeyIdentifier?(session: AVContentKeySession, persistableContentKey: NSData, keyIdentifier: interop.Object): void;

  contentKeySessionContentKeyRequestDidFailWithError?(session: AVContentKeySession, keyRequest: AVContentKeyRequest, err: NSError): void;

  contentKeySessionShouldRetryContentKeyRequestReason?(session: AVContentKeySession, keyRequest: AVContentKeyRequest, retryReason: string): boolean;

  contentKeySessionContentKeyRequestDidSucceed?(session: AVContentKeySession, keyRequest: AVContentKeyRequest): void;

  contentKeySessionContentProtectionSessionIdentifierDidChange?(session: AVContentKeySession): void;

  contentKeySessionDidGenerateExpiredSessionReport?(session: AVContentKeySession): void;
}

export declare class AVContentKeySessionDelegate extends NativeObject implements AVContentKeySessionDelegate {
}

export declare interface AVAsynchronousKeyValueLoading {
  statusOfValueForKeyError(key: string, outError: interop.PointerConvertible): interop.Enum<typeof AVKeyValueStatus>;

  loadValuesAsynchronouslyForKeysCompletionHandler(keys: NSArray<interop.Object> | Array<interop.Object>, handler: () => void | null): void;
}

export declare class AVAsynchronousKeyValueLoading extends NativeObject implements AVAsynchronousKeyValueLoading {
}

export declare interface AVVideoCompositionValidationHandling extends NSObjectProtocol {
  videoCompositionShouldContinueValidatingAfterFindingInvalidValueForKey?(videoComposition: AVVideoComposition, key: string): boolean;

  videoCompositionShouldContinueValidatingAfterFindingEmptyTimeRange?(videoComposition: AVVideoComposition, timeRange: CMTimeRange): boolean;

  videoCompositionShouldContinueValidatingAfterFindingInvalidTimeRangeInInstruction?(videoComposition: AVVideoComposition, videoCompositionInstruction: AVVideoCompositionInstruction): boolean;

  videoCompositionShouldContinueValidatingAfterFindingInvalidTrackIDInInstructionLayerInstructionAsset?(videoComposition: AVVideoComposition, videoCompositionInstruction: AVVideoCompositionInstruction, layerInstruction: AVVideoCompositionLayerInstruction, asset: AVAsset): boolean;
}

export declare class AVVideoCompositionValidationHandling extends NativeObject implements AVVideoCompositionValidationHandling {
}

export declare interface AVAssetResourceLoaderDelegate extends NSObjectProtocol {
  resourceLoaderShouldWaitForLoadingOfRequestedResource?(resourceLoader: AVAssetResourceLoader, loadingRequest: AVAssetResourceLoadingRequest): boolean;

  resourceLoaderShouldWaitForRenewalOfRequestedResource?(resourceLoader: AVAssetResourceLoader, renewalRequest: AVAssetResourceRenewalRequest): boolean;

  resourceLoaderDidCancelLoadingRequest?(resourceLoader: AVAssetResourceLoader, loadingRequest: AVAssetResourceLoadingRequest): void;

  resourceLoaderShouldWaitForResponseToAuthenticationChallenge?(resourceLoader: AVAssetResourceLoader, authenticationChallenge: NSURLAuthenticationChallenge): boolean;

  resourceLoaderDidCancelAuthenticationChallenge?(resourceLoader: AVAssetResourceLoader, authenticationChallenge: NSURLAuthenticationChallenge): void;
}

export declare class AVAssetResourceLoaderDelegate extends NativeObject implements AVAssetResourceLoaderDelegate {
}

export declare interface AVCaptureFileOutputDelegate extends NSObjectProtocol {
  captureOutputShouldProvideSampleAccurateRecordingStart(output: AVCaptureOutput): boolean;

  captureOutputDidOutputSampleBufferFromConnection?(output: AVCaptureFileOutput, sampleBuffer: interop.Object, connection: AVCaptureConnection): void;
}

export declare class AVCaptureFileOutputDelegate extends NativeObject implements AVCaptureFileOutputDelegate {
}

export declare interface AVCaptureAudioDataOutputSampleBufferDelegate extends NSObjectProtocol {
  captureOutputDidOutputSampleBufferFromConnection?(output: AVCaptureOutput, sampleBuffer: interop.Object, connection: AVCaptureConnection): void;
}

export declare class AVCaptureAudioDataOutputSampleBufferDelegate extends NativeObject implements AVCaptureAudioDataOutputSampleBufferDelegate {
}

export declare class AVPortraitEffectsMatte extends NSObject {
  static portraitEffectsMatteFromDictionaryRepresentationError<This extends abstract new (...args: any) => any>(this: This, imageSourceAuxDataInfoDictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): InstanceType<This>;

  portraitEffectsMatteByApplyingExifOrientation(exifOrientation: interop.Enum<typeof CGImagePropertyOrientation>): this;

  portraitEffectsMatteByReplacingPortraitEffectsMatteWithPixelBufferError(pixelBuffer: interop.Object, outError: interop.PointerConvertible): this;

  dictionaryRepresentationForAuxiliaryDataType(outAuxDataType: interop.PointerConvertible): NSDictionary;

  readonly pixelFormatType: number;

  readonly mattingImage: interop.Object;
}

export declare class AVAudioMix extends NSObject implements NSCopying, NSMutableCopying {
  readonly inputParameters: NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVPlayerMediaSelectionCriteria extends NSObject {
  readonly preferredLanguages: NSArray;

  readonly preferredMediaCharacteristics: NSArray;

  readonly principalMediaCharacteristics: NSArray;

  initWithPreferredLanguagesPreferredMediaCharacteristics(preferredLanguages: NSArray<interop.Object> | Array<interop.Object> | null, preferredMediaCharacteristics: NSArray<interop.Object> | Array<interop.Object> | null): this;

  initWithPrincipalMediaCharacteristicsPreferredLanguagesPreferredMediaCharacteristics(principalMediaCharacteristics: NSArray<interop.Object> | Array<interop.Object> | null, preferredLanguages: NSArray<interop.Object> | Array<interop.Object> | null, preferredMediaCharacteristics: NSArray<interop.Object> | Array<interop.Object> | null): this;
}

export declare class AVMutableMetadataItem extends AVMetadataItem {
  // @ts-ignore MemberDecl.tsIgnore
  identifier: string;

  // @ts-ignore MemberDecl.tsIgnore
  extendedLanguageTag: string;

  // @ts-ignore MemberDecl.tsIgnore
  locale: NSLocale;

  // @ts-ignore MemberDecl.tsIgnore
  time: CMTime;

  // @ts-ignore MemberDecl.tsIgnore
  duration: CMTime;

  // @ts-ignore MemberDecl.tsIgnore
  dataType: string;

  // @ts-ignore MemberDecl.tsIgnore
  value: NSCopying;

  // @ts-ignore MemberDecl.tsIgnore
  get extraAttributes(): NSDictionary;
  // @ts-ignore MemberDecl.tsIgnore
  set extraAttributes(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  static metadataItem(): AVMutableMetadataItem;

  // @ts-ignore MemberDecl.tsIgnore
  startDate: NSDate;

  // @ts-ignore MemberDecl.tsIgnore
  keySpace: string;

  // @ts-ignore MemberDecl.tsIgnore
  key: NSCopying;
}

export declare class AVCaptureVideoPreviewLayer extends CALayer {
  static layerWithSession<This extends abstract new (...args: any) => any>(this: This, session: AVCaptureSession): InstanceType<This>;

  initWithSession(session: AVCaptureSession): this;

  static layerWithSessionWithNoConnection<This extends abstract new (...args: any) => any>(this: This, session: AVCaptureSession): InstanceType<This>;

  initWithSessionWithNoConnection(session: AVCaptureSession): this;

  session: AVCaptureSession;

  setSessionWithNoConnection(session: AVCaptureSession): void;

  readonly connection: AVCaptureConnection;

  videoGravity: string;

  captureDevicePointOfInterestForPoint(pointInLayer: CGPoint): CGPoint;

  pointForCaptureDevicePointOfInterest(captureDevicePointOfInterest: CGPoint): CGPoint;

  metadataOutputRectOfInterestForRect(rectInLayerCoordinates: CGRect): CGRect;

  rectForMetadataOutputRectOfInterest(rectInMetadataOutputCoordinates: CGRect): CGRect;

  transformedMetadataObjectForMetadataObject(metadataObject: AVMetadataObject): AVMetadataObject;
}

export declare class AVCaptureScreenInput extends AVCaptureInput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  initWithDisplayID(displayID: number): this;

  minFrameDuration: CMTime;

  cropRect: CGRect;

  scaleFactor: number;

  capturesMouseClicks: boolean;

  capturesCursor: boolean;

  removesDuplicateFrames: boolean;
}

export declare class AVCaptureDeviceInput extends AVCaptureInput {
  static deviceInputWithDeviceError<This extends abstract new (...args: any) => any>(this: This, device: AVCaptureDevice, outError: interop.PointerConvertible): InstanceType<This>;

  initWithDeviceError(device: AVCaptureDevice, outError: interop.PointerConvertible): this;

  readonly device: AVCaptureDevice;
}

export declare class AVCaptureVideoDataOutput extends AVCaptureOutput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  setSampleBufferDelegateQueue(sampleBufferDelegate: AVCaptureVideoDataOutputSampleBufferDelegate | null, sampleBufferCallbackQueue: NSObject | null): void;

  readonly sampleBufferDelegate: AVCaptureVideoDataOutputSampleBufferDelegate;

  readonly sampleBufferCallbackQueue: NSObject;

  get videoSettings(): NSDictionary;
  set videoSettings(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  recommendedVideoSettingsForAssetWriterWithOutputFileType(outputFileType: string): NSDictionary;

  availableVideoCodecTypesForAssetWriterWithOutputFileType(outputFileType: string): NSArray;

  recommendedVideoSettingsForVideoCodecTypeAssetWriterOutputFileType(videoCodecType: string, outputFileType: string): NSDictionary;

  readonly availableVideoCVPixelFormatTypes: NSArray;

  readonly availableVideoCodecTypes: NSArray;

  alwaysDiscardsLateVideoFrames: boolean;
}

export declare class AVMetadataFaceObject extends AVMetadataObject implements NSCopying {
  readonly faceID: number;

  readonly hasRollAngle: boolean;

  readonly rollAngle: number;

  readonly hasYawAngle: boolean;

  readonly yawAngle: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVAssetSegmentTrackReport extends NSObject {
  readonly trackID: number;

  readonly mediaType: string;

  readonly earliestPresentationTimeStamp: CMTime;

  readonly duration: CMTime;

  readonly firstVideoSampleInformation: AVAssetSegmentReportSampleInformation;
}

export declare class AVMetadataDogBodyObject extends AVMetadataBodyObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMetadataCatBodyObject extends AVMetadataBodyObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMetadataHumanBodyObject extends AVMetadataBodyObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMetadataBodyObject extends AVMetadataObject implements NSCopying {
  readonly bodyID: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMetadataObject extends NSObject {
  readonly time: CMTime;

  readonly duration: CMTime;

  readonly bounds: CGRect;

  readonly type: string;
}

export declare class AVCaptureAudioFileOutput extends AVCaptureFileOutput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  static availableOutputFileTypes(): NSArray;

  startRecordingToOutputFileURLOutputFileTypeRecordingDelegate(outputFileURL: NSURL, fileType: string, delegate: AVCaptureFileOutputRecordingDelegate): void;

  get metadata(): NSArray;
  set metadata(value: NSArray<interop.Object> | Array<interop.Object>);

  get audioSettings(): NSDictionary;
  set audioSettings(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);
}

export declare class AVCaptureFileOutput extends AVCaptureOutput {
  delegate: AVCaptureFileOutputDelegate;

  readonly outputFileURL: NSURL;

  startRecordingToOutputFileURLRecordingDelegate(outputFileURL: NSURL, delegate: AVCaptureFileOutputRecordingDelegate): void;

  stopRecording(): void;

  readonly recording: boolean;

  readonly recordingPaused: boolean;

  pauseRecording(): void;

  resumeRecording(): void;

  readonly recordedDuration: CMTime;

  readonly recordedFileSize: number;

  maxRecordedDuration: CMTime;

  maxRecordedFileSize: number;

  minFreeDiskSpaceLimit: number;

  isRecording(): boolean;

  isRecordingPaused(): boolean;
}

export declare class AVCaptureOutput extends NSObject {
  readonly connections: NSArray;

  connectionWithMediaType(mediaType: string): AVCaptureConnection;

  transformedMetadataObjectForMetadataObjectConnection(metadataObject: AVMetadataObject, connection: AVCaptureConnection): AVMetadataObject;

  metadataOutputRectOfInterestForRect(rectInOutputCoordinates: CGRect): CGRect;

  rectForMetadataOutputRectOfInterest(rectInMetadataOutputCoordinates: CGRect): CGRect;
}

export declare class AVCaptureAudioChannel extends NSObject {
  readonly averagePowerLevel: number;

  readonly peakHoldLevel: number;

  volume: number;

  enabled: boolean;

  isEnabled(): boolean;
}

export declare class AVCaptureConnection extends NSObject {
  static connectionWithInputPortsOutput<This extends abstract new (...args: any) => any>(this: This, ports: NSArray<interop.Object> | Array<interop.Object>, output: AVCaptureOutput): InstanceType<This>;

  static connectionWithInputPortVideoPreviewLayer<This extends abstract new (...args: any) => any>(this: This, port: AVCaptureInputPort, layer: AVCaptureVideoPreviewLayer): InstanceType<This>;

  initWithInputPortsOutput(ports: NSArray<interop.Object> | Array<interop.Object>, output: AVCaptureOutput): this;

  initWithInputPortVideoPreviewLayer(port: AVCaptureInputPort, layer: AVCaptureVideoPreviewLayer): this;

  readonly inputPorts: NSArray;

  readonly output: AVCaptureOutput;

  readonly videoPreviewLayer: AVCaptureVideoPreviewLayer;

  enabled: boolean;

  readonly active: boolean;

  readonly audioChannels: NSArray;

  readonly supportsVideoMirroring: boolean;

  videoMirrored: boolean;

  automaticallyAdjustsVideoMirroring: boolean;

  readonly supportsVideoOrientation: boolean;

  videoOrientation: interop.Enum<typeof AVCaptureVideoOrientation>;

  readonly supportsVideoFieldMode: boolean;

  videoFieldMode: interop.Enum<typeof AVVideoFieldMode>;

  readonly supportsVideoMinFrameDuration: boolean;

  videoMinFrameDuration: CMTime;

  readonly supportsVideoMaxFrameDuration: boolean;

  videoMaxFrameDuration: CMTime;

  isEnabled(): boolean;

  isActive(): boolean;

  isVideoMirroringSupported(): boolean;

  isVideoMirrored(): boolean;

  isVideoOrientationSupported(): boolean;

  isVideoFieldModeSupported(): boolean;

  isVideoMinFrameDurationSupported(): boolean;

  isVideoMaxFrameDurationSupported(): boolean;
}

export declare class AVCaptureDeviceDiscoverySession extends NSObject {
  static discoverySessionWithDeviceTypesMediaTypePosition<This extends abstract new (...args: any) => any>(this: This, deviceTypes: NSArray<interop.Object> | Array<interop.Object>, mediaType: string | null, position: interop.Enum<typeof AVCaptureDevicePosition>): InstanceType<This>;

  readonly devices: NSArray;
}

export declare class AVSynchronizedLayer extends CALayer {
  static synchronizedLayerWithPlayerItem(playerItem: AVPlayerItem): AVSynchronizedLayer;

  playerItem: AVPlayerItem;
}

export declare class AVSampleBufferGenerator extends NSObject {
  initWithAssetTimebase(asset: AVAsset, timebase: interop.Object | null): this;

  createSampleBufferForRequest(request: AVSampleBufferRequest): interop.Object;

  static notifyOfDataReadyForSampleBufferCompletionHandler(sbuf: interop.Object, completionHandler: (p1: boolean, p2: NSError) => void | null): void;
}

export declare class AVSampleBufferRenderSynchronizer extends NSObject {
  readonly timebase: interop.Object;

  rate: number;

  currentTime(): CMTime;

  setRateTime(rate: number, time: CMTime): void;

  readonly renderers: NSArray;

  addRenderer(renderer: AVQueuedSampleBufferRendering): void;

  removeRendererAtTimeCompletionHandler(renderer: AVQueuedSampleBufferRendering, time: CMTime, completionHandler: (p1: boolean) => void | null): void;

  addPeriodicTimeObserverForIntervalQueueUsingBlock(interval: CMTime, queue: NSObject | null, block: (p1: CMTime) => void): interop.Object;

  addBoundaryTimeObserverForTimesQueueUsingBlock(times: NSArray<interop.Object> | Array<interop.Object>, queue: NSObject | null, block: () => void): interop.Object;

  removeTimeObserver(observer: interop.Object): void;
}

export declare class AVSampleBufferDisplayLayer extends CALayer implements AVQueuedSampleBufferRendering {
  controlTimebase: interop.Object;

  videoGravity: string;

  readonly timebase: interop.Object;

  readonly status: interop.Enum<typeof AVQueuedSampleBufferRenderingStatus>;

  readonly error: NSError;

  enqueueSampleBuffer(sampleBuffer: interop.Object): void;

  flush(): void;

  flushAndRemoveImage(): void;

  readonly requiresFlushToResumeDecoding: boolean;

  readonly readyForMoreMediaData: boolean;

  requestMediaDataWhenReadyOnQueueUsingBlock(queue: NSObject, block: () => void): void;

  stopRequestingMediaData(): void;

  isReadyForMoreMediaData(): boolean;

  preventsCapture: boolean;

  preventsDisplaySleepDuringVideoPlayback: boolean;

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

export declare class AVPlayerLayer extends CALayer {
  static playerLayerWithPlayer(player: AVPlayer | null): AVPlayerLayer;

  player: AVPlayer;

  videoGravity: string;

  readonly readyForDisplay: boolean;

  readonly videoRect: CGRect;

  get pixelBufferAttributes(): NSDictionary;
  set pixelBufferAttributes(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  isReadyForDisplay(): boolean;
}

export declare class AVPlayerItemMetadataOutput extends AVPlayerItemOutput {
  initWithIdentifiers(identifiers: NSArray<interop.Object> | Array<interop.Object> | null): this;

  readonly delegate: AVPlayerItemMetadataOutputPushDelegate;

  readonly delegateQueue: NSObject;

  advanceIntervalForDelegateInvocation: number;
}

export declare class AVPlayerItemLegibleOutput extends AVPlayerItemOutput {
  readonly delegate: AVPlayerItemLegibleOutputPushDelegate;

  readonly delegateQueue: NSObject;

  advanceIntervalForDelegateInvocation: number;

  initWithMediaSubtypesForNativeRepresentation(subtypes: NSArray<interop.Object> | Array<interop.Object>): this;

  textStylingResolution: string;
}

export declare class AVPlayerItemVideoOutput extends AVPlayerItemOutput {
  initWithPixelBufferAttributes(pixelBufferAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithOutputSettings(outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  hasNewPixelBufferForItemTime(itemTime: CMTime): boolean;

  copyPixelBufferForItemTimeItemTimeForDisplay(itemTime: CMTime, outItemTimeForDisplay: interop.PointerConvertible): interop.Object;

  requestNotificationOfMediaDataChangeWithAdvanceInterval(interval: number): void;

  readonly delegate: AVPlayerItemOutputPullDelegate;

  readonly delegateQueue: NSObject;
}

export declare class AVPlayerItemErrorLog extends NSObject implements NSCopying {
  extendedLogData(): NSData;

  readonly extendedLogDataStringEncoding: number;

  readonly events: NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVPlayerItem extends NSObject implements NSCopying, AVMetricEventStreamPublisher {
  static playerItemWithURL<This extends abstract new (...args: any) => any>(this: This, URL: NSURL): InstanceType<This>;

  static playerItemWithAsset<This extends abstract new (...args: any) => any>(this: This, asset: AVAsset): InstanceType<This>;

  static playerItemWithAssetAutomaticallyLoadedAssetKeys<This extends abstract new (...args: any) => any>(this: This, asset: AVAsset, automaticallyLoadedAssetKeys: NSArray<interop.Object> | Array<interop.Object> | null): InstanceType<This>;

  initWithURL(URL: NSURL): this;

  initWithAsset(asset: AVAsset): this;

  initWithAssetAutomaticallyLoadedAssetKeys(asset: AVAsset, automaticallyLoadedAssetKeys: NSArray<interop.Object> | Array<interop.Object> | null): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  copy(): interop.Object;

  readonly status: interop.Enum<typeof AVPlayerItemStatus>;

  readonly error: NSError;

  readonly asset: AVAsset;

  readonly tracks: NSArray;

  readonly duration: CMTime;

  readonly presentationSize: CGSize;

  readonly timedMetadata: NSArray;

  readonly automaticallyLoadedAssetKeys: NSArray;

  readonly canPlayFastForward: boolean;

  readonly canPlaySlowForward: boolean;

  readonly canPlayReverse: boolean;

  readonly canPlaySlowReverse: boolean;

  readonly canPlayFastReverse: boolean;

  readonly canStepForward: boolean;

  readonly canStepBackward: boolean;

  configuredTimeOffsetFromLive: CMTime;

  readonly recommendedTimeOffsetFromLive: CMTime;

  automaticallyPreservesTimeOffsetFromLive: boolean;

  currentTime(): CMTime;

  forwardPlaybackEndTime: CMTime;

  reversePlaybackEndTime: CMTime;

  readonly seekableTimeRanges: NSArray;

  seekToTimeCompletionHandler(time: CMTime, completionHandler: (p1: boolean) => void | null): void;

  seekToTimeToleranceBeforeToleranceAfterCompletionHandler(time: CMTime, toleranceBefore: CMTime, toleranceAfter: CMTime, completionHandler: (p1: boolean) => void | null): void;

  cancelPendingSeeks(): void;

  currentDate(): NSDate;

  seekToDateCompletionHandler(date: NSDate, completionHandler: (p1: boolean) => void | null): boolean;

  stepByCount(stepCount: number): void;

  readonly timebase: interop.Object;

  videoComposition: AVVideoComposition;

  readonly customVideoCompositor: AVVideoCompositing;

  seekingWaitsForVideoCompositionRendering: boolean;

  get textStyleRules(): NSArray;
  set textStyleRules(value: NSArray<interop.Object> | Array<interop.Object>);

  videoApertureMode: string;

  appliesPerFrameHDRDisplayMetadata: boolean;

  audioTimePitchAlgorithm: string;

  audioSpatializationAllowed: boolean;

  allowedAudioSpatializationFormats: interop.Enum<typeof AVAudioSpatializationFormats>;

  audioMix: AVAudioMix;

  isAudioSpatializationAllowed(): boolean;

  readonly loadedTimeRanges: NSArray;

  readonly playbackLikelyToKeepUp: boolean;

  readonly playbackBufferFull: boolean;

  readonly playbackBufferEmpty: boolean;

  canUseNetworkResourcesForLiveStreamingWhilePaused: boolean;

  preferredForwardBufferDuration: number;

  isPlaybackLikelyToKeepUp(): boolean;

  isPlaybackBufferFull(): boolean;

  isPlaybackBufferEmpty(): boolean;

  preferredPeakBitRate: number;

  preferredMaximumResolution: CGSize;

  startsOnFirstEligibleVariant: boolean;

  selectMediaOptionInMediaSelectionGroup(mediaSelectionOption: AVMediaSelectionOption | null, mediaSelectionGroup: AVMediaSelectionGroup): void;

  selectMediaOptionAutomaticallyInMediaSelectionGroup(mediaSelectionGroup: AVMediaSelectionGroup): void;

  readonly currentMediaSelection: AVMediaSelection;

  accessLog(): AVPlayerItemAccessLog;

  errorLog(): AVPlayerItemErrorLog;

  addOutput(output: AVPlayerItemOutput): void;

  removeOutput(output: AVPlayerItemOutput): void;

  readonly outputs: NSArray;

  addMediaDataCollector(collector: AVPlayerItemMediaDataCollector): void;

  removeMediaDataCollector(collector: AVPlayerItemMediaDataCollector): void;

  readonly mediaDataCollectors: NSArray;

  seekToTime(time: CMTime): void;

  seekToTimeToleranceBeforeToleranceAfter(time: CMTime, toleranceBefore: CMTime, toleranceAfter: CMTime): void;

  seekToDate(date: NSDate): boolean;

  selectedMediaOptionInMediaSelectionGroup(mediaSelectionGroup: AVMediaSelectionGroup): AVMediaSelectionOption;

  readonly authorizationRequiredForPlayback: boolean;

  readonly applicationAuthorizedForPlayback: boolean;

  readonly contentAuthorizedForPlayback: boolean;

  requestContentAuthorizationAsynchronouslyWithTimeoutIntervalCompletionHandler(timeoutInterval: number, handler: () => void): void;

  cancelContentAuthorizationRequest(): void;

  readonly contentAuthorizationRequestStatus: interop.Enum<typeof AVContentAuthorizationStatus>;

  isAuthorizationRequiredForPlayback(): boolean;

  isApplicationAuthorizedForPlayback(): boolean;

  isContentAuthorizedForPlayback(): boolean;
}

export declare class AVPlayer extends NSObject {
  init(): this;

  static playerWithURL<This extends abstract new (...args: any) => any>(this: This, URL: NSURL): InstanceType<This>;

  static playerWithPlayerItem<This extends abstract new (...args: any) => any>(this: This, item: AVPlayerItem | null): InstanceType<This>;

  initWithURL(URL: NSURL): this;

  initWithPlayerItem(item: AVPlayerItem | null): this;

  readonly status: interop.Enum<typeof AVPlayerStatus>;

  readonly error: NSError;

  rate: number;

  play(): void;

  pause(): void;

  readonly timeControlStatus: interop.Enum<typeof AVPlayerTimeControlStatus>;

  readonly reasonForWaitingToPlay: string;

  playImmediatelyAtRate(rate: number): void;

  readonly currentItem: AVPlayerItem;

  replaceCurrentItemWithPlayerItem(item: AVPlayerItem | null): void;

  actionAtItemEnd: interop.Enum<typeof AVPlayerActionAtItemEnd>;

  currentTime(): CMTime;

  seekToDate(date: NSDate): void;

  seekToDateCompletionHandler(date: NSDate, completionHandler: (p1: boolean) => void): void;

  seekToTime(time: CMTime): void;

  seekToTimeToleranceBeforeToleranceAfter(time: CMTime, toleranceBefore: CMTime, toleranceAfter: CMTime): void;

  seekToTimeCompletionHandler(time: CMTime, completionHandler: (p1: boolean) => void): void;

  seekToTimeToleranceBeforeToleranceAfterCompletionHandler(time: CMTime, toleranceBefore: CMTime, toleranceAfter: CMTime, completionHandler: (p1: boolean) => void): void;

  automaticallyWaitsToMinimizeStalling: boolean;

  setRateTimeAtHostTime(rate: number, itemTime: CMTime, hostClockTime: CMTime): void;

  prerollAtRateCompletionHandler(rate: number, completionHandler: (p1: boolean) => void | null): void;

  cancelPendingPrerolls(): void;

  addPeriodicTimeObserverForIntervalQueueUsingBlock(interval: CMTime, queue: NSObject | null, block: (p1: CMTime) => void): interop.Object;

  addBoundaryTimeObserverForTimesQueueUsingBlock(times: NSArray<interop.Object> | Array<interop.Object>, queue: NSObject | null, block: () => void): interop.Object;

  removeTimeObserver(observer: interop.Object): void;

  volume: number;

  muted: boolean;

  isMuted(): boolean;

  appliesMediaSelectionCriteriaAutomatically: boolean;

  setMediaSelectionCriteriaForMediaCharacteristic(criteria: AVPlayerMediaSelectionCriteria | null, mediaCharacteristic: string): void;

  mediaSelectionCriteriaForMediaCharacteristic(mediaCharacteristic: string): AVPlayerMediaSelectionCriteria;

  audioOutputDeviceUniqueID: string;

  allowsExternalPlayback: boolean;

  readonly externalPlaybackActive: boolean;

  isExternalPlaybackActive(): boolean;

  readonly outputObscuredDueToInsufficientExternalProtection: boolean;

  static readonly eligibleForHDRPlayback: boolean;

  preferredVideoDecoderGPURegistryID: number;

  preventsDisplaySleepDuringVideoPlayback: boolean;

  closedCaptionDisplayEnabled: boolean;

  masterClock: interop.Object;

  isClosedCaptionDisplayEnabled(): boolean;
}

export declare class AVFragmentedMovie extends AVMovie implements AVFragmentMinding {
  readonly tracks: NSArray;

  trackWithTrackID(trackID: number): AVMovieTrack;
  trackWithTrackID(trackID: number): AVAssetTrack;
  trackWithTrackID(trackID: number): AVFragmentedMovieTrack;

  tracksWithMediaType(mediaType: string): NSArray;

  tracksWithMediaCharacteristic(mediaCharacteristic: string): NSArray;

  readonly associatedWithFragmentMinder: boolean;

  isAssociatedWithFragmentMinder(): boolean;
}

export declare class AVMutableMovie extends AVMovie {
  static movieWithURLOptionsError<This extends abstract new (...args: any) => any>(this: This, URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): InstanceType<This>;

  initWithURLOptionsError(URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): this;

  static movieWithDataOptionsError<This extends abstract new (...args: any) => any>(this: This, data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): InstanceType<This>;

  initWithDataOptionsError(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): this;

  static movieWithSettingsFromMovieOptionsError<This extends abstract new (...args: any) => any>(this: This, movie: AVMovie | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): InstanceType<This>;

  initWithSettingsFromMovieOptionsError(movie: AVMovie | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): this;

  // @ts-ignore MemberDecl.tsIgnore
  preferredRate: number;

  // @ts-ignore MemberDecl.tsIgnore
  preferredVolume: number;

  // @ts-ignore MemberDecl.tsIgnore
  preferredTransform: CGAffineTransform;

  timescale: number;

  readonly tracks: NSArray;

  modified: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  defaultMediaDataStorage: AVMediaDataStorage;

  interleavingPeriod: CMTime;

  insertTimeRangeOfAssetAtTimeCopySampleDataError(timeRange: CMTimeRange, asset: AVAsset, startTime: CMTime, copySampleData: boolean, outError: interop.PointerConvertible): boolean;

  insertEmptyTimeRange(timeRange: CMTimeRange): void;

  removeTimeRange(timeRange: CMTimeRange): void;

  scaleTimeRangeToDuration(timeRange: CMTimeRange, duration: CMTime): void;

  isModified(): boolean;

  mutableTrackCompatibleWithTrack(track: AVAssetTrack): AVMutableMovieTrack;

  addMutableTrackWithMediaTypeCopySettingsFromTrackOptions(mediaType: string, track: AVAssetTrack | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): AVMutableMovieTrack;

  addMutableTracksCopyingSettingsFromTracksOptions(existingTracks: NSArray<interop.Object> | Array<interop.Object>, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): NSArray;

  removeTrack(track: AVMovieTrack): void;

  // @ts-ignore MemberDecl.tsIgnore
  get metadata(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set metadata(value: NSArray<interop.Object> | Array<interop.Object>);

  trackWithTrackID(trackID: number): AVMovieTrack;
  trackWithTrackID(trackID: number): AVAssetTrack;
  trackWithTrackID(trackID: number): AVMutableMovieTrack;

  tracksWithMediaType(mediaType: string): NSArray;

  tracksWithMediaCharacteristic(mediaCharacteristic: string): NSArray;

  metadataForFormat(format: string): NSArray;

  chapterMetadataGroupsWithTitleLocaleContainingItemsWithCommonKeys(locale: NSLocale, commonKeys: NSArray<interop.Object> | Array<interop.Object> | null): NSArray;

  chapterMetadataGroupsBestMatchingPreferredLanguages(preferredLanguages: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  mediaSelectionGroupForMediaCharacteristic(mediaCharacteristic: string): AVMediaSelectionGroup;

  unusedTrackID(): number;
}

export declare class AVMovie extends AVAsset implements NSCopying, NSMutableCopying {
  static movieTypes(): NSArray;

  static movieWithURLOptions<This extends abstract new (...args: any) => any>(this: This, URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithURLOptions(URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  static movieWithDataOptions<This extends abstract new (...args: any) => any>(this: This, data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithDataOptions(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly URL: NSURL;

  readonly data: NSData;

  readonly defaultMediaDataStorage: AVMediaDataStorage;

  readonly tracks: NSArray;

  readonly canContainMovieFragments: boolean;

  readonly containsMovieFragments: boolean;

  movieHeaderWithFileTypeError(fileType: string, outError: interop.PointerConvertible): NSData;

  writeMovieHeaderToURLFileTypeOptionsError(URL: NSURL, fileType: string, options: interop.Enum<typeof AVMovieWritingOptions>, outError: interop.PointerConvertible): boolean;

  isCompatibleWithFileType(fileType: string): boolean;

  trackWithTrackID(trackID: number): AVAssetTrack;
  trackWithTrackID(trackID: number): AVMovieTrack;

  tracksWithMediaType(mediaType: string): NSArray;

  tracksWithMediaCharacteristic(mediaCharacteristic: string): NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMovieTrack extends AVAssetTrack {
  readonly mediaPresentationTimeRange: CMTimeRange;

  readonly mediaDecodeTimeRange: CMTimeRange;

  readonly alternateGroupID: number;

  readonly mediaDataStorage: AVMediaDataStorage;
}

export declare class AVMetadataItemFilter extends NSObject {
  static metadataItemFilterForSharing(): AVMetadataItemFilter;
}

export declare class AVMetadataItemValueRequest extends NSObject {
  readonly metadataItem: AVMetadataItem | null;

  respondWithValue(value: NSCopying): void;

  respondWithError(error: NSError): void;
}

export declare class AVMetadataItem extends NSObject implements AVAsynchronousKeyValueLoading, NSCopying, NSMutableCopying {
  readonly identifier: string;

  readonly extendedLanguageTag: string;

  readonly locale: NSLocale;

  readonly time: CMTime;

  readonly duration: CMTime;

  readonly dataType: string;

  readonly value: NSCopying;

  readonly extraAttributes: NSDictionary;

  readonly startDate: NSDate;

  readonly stringValue: string;

  readonly numberValue: NSNumber;

  readonly dateValue: NSDate;

  readonly dataValue: NSData;

  statusOfValueForKeyError(key: string, outError: interop.PointerConvertible): interop.Enum<typeof AVKeyValueStatus>;

  loadValuesAsynchronouslyForKeysCompletionHandler(keys: NSArray<interop.Object> | Array<interop.Object>, handler: () => void | null): void;

  static metadataItemsFromArrayFilteredAndSortedAccordingToPreferredLanguages(metadataItems: NSArray<interop.Object> | Array<interop.Object>, preferredLanguages: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  static metadataItemsFromArrayFilteredByIdentifier(metadataItems: NSArray<interop.Object> | Array<interop.Object>, identifier: string): NSArray;

  static metadataItemsFromArrayFilteredByMetadataItemFilter(metadataItems: NSArray<interop.Object> | Array<interop.Object>, metadataItemFilter: AVMetadataItemFilter): NSArray;

  static identifierForKeyKeySpace(key: interop.Object, keySpace: string): string;

  static keySpaceForIdentifier(identifier: string): string;

  static keyForIdentifier(identifier: string): interop.Object;

  readonly key: NSCopying;

  readonly commonKey: string;

  readonly keySpace: string;

  static metadataItemWithPropertiesOfMetadataItemValueLoadingHandler(metadataItem: AVMetadataItem, handler: (p1: AVMetadataItemValueRequest) => void): AVMetadataItem;

  static metadataItemsFromArrayWithLocale(metadataItems: NSArray<interop.Object> | Array<interop.Object>, locale: NSLocale): NSArray;

  static metadataItemsFromArrayWithKeyKeySpace(metadataItems: NSArray<interop.Object> | Array<interop.Object>, key: interop.Object | null, keySpace: string | null): NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVTextStyleRule extends NSObject implements NSCopying {
  static propertyListForTextStyleRules(textStyleRules: NSArray<interop.Object> | Array<interop.Object>): interop.Object;

  static textStyleRulesFromPropertyList(plist: interop.Object): NSArray;

  static textStyleRuleWithTextMarkupAttributes(textMarkupAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): AVTextStyleRule;

  static textStyleRuleWithTextMarkupAttributesTextSelector(textMarkupAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, textSelector: string | null): AVTextStyleRule;

  initWithTextMarkupAttributes(textMarkupAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): this;

  initWithTextMarkupAttributesTextSelector(textMarkupAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, textSelector: string | null): this;

  readonly textMarkupAttributes: NSDictionary;

  readonly textSelector: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMutableAssetDownloadStorageManagementPolicy extends AVAssetDownloadStorageManagementPolicy {
  // @ts-ignore MemberDecl.tsIgnore
  priority: string;

  // @ts-ignore MemberDecl.tsIgnore
  expirationDate: NSDate;
}

export declare class AVAssetResourceLoadingRequest extends NSObject {
  readonly request: NSURLRequest;

  readonly finished: boolean;

  readonly cancelled: boolean;

  readonly contentInformationRequest: AVAssetResourceLoadingContentInformationRequest;

  readonly dataRequest: AVAssetResourceLoadingDataRequest;

  response: NSURLResponse;

  redirect: NSURLRequest;

  readonly requestor: AVAssetResourceLoadingRequestor;

  finishLoading(): void;

  finishLoadingWithError(error: NSError | null): void;

  isFinished(): boolean;

  isCancelled(): boolean;

  streamingContentKeyRequestDataForAppContentIdentifierOptionsError(appIdentifier: NSData, contentIdentifier: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): NSData;

  persistentContentKeyFromKeyVendorResponseOptionsError(keyVendorResponse: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): NSData;

  finishLoadingWithResponseDataRedirect(response: NSURLResponse | null, data: NSData | null, redirect: NSURLRequest | null): void;
}

export declare class AVAssetDownloadStorageManagementPolicy extends NSObject implements NSCopying, NSMutableCopying {
  readonly priority: string;

  readonly expirationDate: NSDate;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVAssetDownloadStorageManager extends NSObject {
  static sharedDownloadStorageManager(): AVAssetDownloadStorageManager;

  setStorageManagementPolicyForURL(storageManagementPolicy: AVAssetDownloadStorageManagementPolicy, downloadStorageURL: NSURL): void;

  storageManagementPolicyForURL(downloadStorageURL: NSURL): AVAssetDownloadStorageManagementPolicy;
}

export declare class AVAssetDownloadURLSession extends NSURLSession {
  static sessionWithConfigurationAssetDownloadDelegateDelegateQueue(configuration: NSURLSessionConfiguration, delegate: AVAssetDownloadDelegate | null, delegateQueue: NSOperationQueue | null): AVAssetDownloadURLSession;

  assetDownloadTaskWithURLAssetAssetTitleAssetArtworkDataOptions(URLAsset: AVURLAsset, title: string, artworkData: NSData | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): AVAssetDownloadTask;

  aggregateAssetDownloadTaskWithURLAssetMediaSelectionsAssetTitleAssetArtworkDataOptions(URLAsset: AVURLAsset, mediaSelections: NSArray<interop.Object> | Array<interop.Object>, title: string, artworkData: NSData | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): AVAggregateAssetDownloadTask;
}

export declare class AVAggregateAssetDownloadTask extends NSURLSessionTask {
  readonly URLAsset: AVURLAsset;
}

export declare class AVAssetDownloadTask extends NSURLSessionTask {
  readonly URLAsset: AVURLAsset;

  readonly options: NSDictionary;

  readonly loadedTimeRanges: NSArray;
}

export declare class AVMutableAudioMixInputParameters extends AVAudioMixInputParameters {
  static audioMixInputParametersWithTrack<This extends abstract new (...args: any) => any>(this: This, track: AVAssetTrack | null): InstanceType<This>;

  static audioMixInputParameters<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  // @ts-ignore MemberDecl.tsIgnore
  trackID: number;

  // @ts-ignore MemberDecl.tsIgnore
  audioTimePitchAlgorithm: string;

  // @ts-ignore MemberDecl.tsIgnore
  audioTapProcessor: interop.Object;

  setVolumeRampFromStartVolumeToEndVolumeTimeRange(startVolume: number, endVolume: number, timeRange: CMTimeRange): void;

  setVolumeAtTime(volume: number, time: CMTime): void;
}

export declare class AVAudioMixInputParameters extends NSObject implements NSCopying, NSMutableCopying {
  readonly trackID: number;

  readonly audioTimePitchAlgorithm: string;

  readonly audioTapProcessor: interop.Object;

  getVolumeRampForTimeStartVolumeEndVolumeTimeRange(time: CMTime, startVolume: interop.PointerConvertible, endVolume: interop.PointerConvertible, timeRange: interop.PointerConvertible): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVFrameRateRange extends NSObject {
  readonly minFrameRate: number;

  readonly maxFrameRate: number;

  readonly maxFrameDuration: CMTime;

  readonly minFrameDuration: CMTime;
}

export declare class AVAssetWriterInputGroup extends AVMediaSelectionGroup {
  static assetWriterInputGroupWithInputsDefaultInput<This extends abstract new (...args: any) => any>(this: This, inputs: NSArray<interop.Object> | Array<interop.Object>, defaultInput: AVAssetWriterInput | null): InstanceType<This>;

  initWithInputsDefaultInput(inputs: NSArray<interop.Object> | Array<interop.Object>, defaultInput: AVAssetWriterInput | null): this;

  readonly inputs: NSArray;

  readonly defaultInput: AVAssetWriterInput;
}

export declare class AVAssetSegmentReportSampleInformation extends NSObject {
  readonly presentationTimeStamp: CMTime;

  readonly offset: number;

  readonly length: number;

  readonly isSyncSample: boolean;
}

export declare class AVMediaSelectionGroup extends NSObject implements NSCopying {
  readonly options: NSArray;

  readonly defaultOption: AVMediaSelectionOption;

  readonly allowsEmptySelection: boolean;

  mediaSelectionOptionWithPropertyList(plist: interop.Object): AVMediaSelectionOption;

  static playableMediaSelectionOptionsFromArray(mediaSelectionOptions: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  static mediaSelectionOptionsFromArrayFilteredAndSortedAccordingToPreferredLanguages(mediaSelectionOptions: NSArray<interop.Object> | Array<interop.Object>, preferredLanguages: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  static mediaSelectionOptionsFromArrayWithLocale(mediaSelectionOptions: NSArray<interop.Object> | Array<interop.Object>, locale: NSLocale): NSArray;

  static mediaSelectionOptionsFromArrayWithMediaCharacteristics(mediaSelectionOptions: NSArray<interop.Object> | Array<interop.Object>, mediaCharacteristics: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  static mediaSelectionOptionsFromArrayWithoutMediaCharacteristics(mediaSelectionOptions: NSArray<interop.Object> | Array<interop.Object>, mediaCharacteristics: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  makeNowPlayingInfoLanguageOptionGroup(): MPNowPlayingInfoLanguageOptionGroup;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVAssetTrackGroup extends NSObject implements NSCopying {
  readonly trackIDs: NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVAssetResourceLoadingDataRequest extends NSObject {
  readonly requestedOffset: number;

  readonly requestedLength: number;

  readonly requestsAllDataToEndOfResource: boolean;

  readonly currentOffset: number;

  respondWithData(data: NSData): void;
}

export declare class AVMutableDateRangeMetadataGroup extends AVDateRangeMetadataGroup {
  // @ts-ignore MemberDecl.tsIgnore
  startDate: NSDate;

  // @ts-ignore MemberDecl.tsIgnore
  endDate: NSDate;

  // @ts-ignore MemberDecl.tsIgnore
  get items(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set items(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class AVAssetResourceLoadingRequestor extends NSObject {
  readonly providesExpiredSessionReports: boolean;
}

export declare class AVAssetReaderOutput extends NSObject {
  readonly mediaType: string;

  alwaysCopiesSampleData: boolean;

  copyNextSampleBuffer(): interop.Object;

  supportsRandomAccess: boolean;

  resetForReadingTimeRanges(timeRanges: NSArray<interop.Object> | Array<interop.Object>): void;

  markConfigurationAsFinal(): void;
}

export declare class AVVideoCompositionCoreAnimationTool extends NSObject {
  static videoCompositionCoreAnimationToolWithAdditionalLayerAsTrackID<This extends abstract new (...args: any) => any>(this: This, layer: CALayer, trackID: number): InstanceType<This>;

  static videoCompositionCoreAnimationToolWithPostProcessingAsVideoLayerInLayer<This extends abstract new (...args: any) => any>(this: This, videoLayer: CALayer, animationLayer: CALayer): InstanceType<This>;

  static videoCompositionCoreAnimationToolWithPostProcessingAsVideoLayersInLayer<This extends abstract new (...args: any) => any>(this: This, videoLayers: NSArray<interop.Object> | Array<interop.Object>, animationLayer: CALayer): InstanceType<This>;
}

export declare class AVMutableVideoCompositionLayerInstruction extends AVVideoCompositionLayerInstruction {
  static videoCompositionLayerInstructionWithAssetTrack<This extends abstract new (...args: any) => any>(this: This, track: AVAssetTrack): InstanceType<This>;

  static videoCompositionLayerInstruction<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  // @ts-ignore MemberDecl.tsIgnore
  trackID: number;

  setTransformRampFromStartTransformToEndTransformTimeRange(startTransform: CGAffineTransform, endTransform: CGAffineTransform, timeRange: CMTimeRange): void;

  setTransformAtTime(transform: CGAffineTransform, time: CMTime): void;

  setOpacityRampFromStartOpacityToEndOpacityTimeRange(startOpacity: number, endOpacity: number, timeRange: CMTimeRange): void;

  setOpacityAtTime(opacity: number, time: CMTime): void;

  setCropRectangleRampFromStartCropRectangleToEndCropRectangleTimeRange(startCropRectangle: CGRect, endCropRectangle: CGRect, timeRange: CMTimeRange): void;

  setCropRectangleAtTime(cropRectangle: CGRect, time: CMTime): void;
}

export declare class AVVideoCompositionLayerInstruction extends NSObject implements NSSecureCoding, NSCopying, NSMutableCopying {
  readonly trackID: number;

  getTransformRampForTimeStartTransformEndTransformTimeRange(time: CMTime, startTransform: interop.PointerConvertible, endTransform: interop.PointerConvertible, timeRange: interop.PointerConvertible): boolean;

  getOpacityRampForTimeStartOpacityEndOpacityTimeRange(time: CMTime, startOpacity: interop.PointerConvertible, endOpacity: interop.PointerConvertible, timeRange: interop.PointerConvertible): boolean;

  getCropRectangleRampForTimeStartCropRectangleEndCropRectangleTimeRange(time: CMTime, startCropRectangle: interop.PointerConvertible, endCropRectangle: interop.PointerConvertible, timeRange: interop.PointerConvertible): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMutableVideoCompositionInstruction extends AVVideoCompositionInstruction {
  static videoCompositionInstruction<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  // @ts-ignore MemberDecl.tsIgnore
  timeRange: CMTimeRange;

  // @ts-ignore MemberDecl.tsIgnore
  backgroundColor: interop.Object;

  // @ts-ignore MemberDecl.tsIgnore
  get layerInstructions(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set layerInstructions(value: NSArray<interop.Object> | Array<interop.Object>);

  // @ts-ignore MemberDecl.tsIgnore
  enablePostProcessing: boolean;
}

export declare class AVVideoCompositionInstruction extends NSObject implements NSSecureCoding, NSCopying, NSMutableCopying, AVVideoCompositionInstructionProtocol {
  readonly timeRange: CMTimeRange;

  readonly backgroundColor: interop.Object;

  readonly layerInstructions: NSArray;

  readonly enablePostProcessing: boolean;

  readonly requiredSourceTrackIDs: NSArray;

  readonly passthroughTrackID: number;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;

  readonly containsTweening: boolean;

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

export declare class AVMutableVideoComposition extends AVVideoComposition {
  static videoComposition(): AVMutableVideoComposition;

  static videoCompositionWithPropertiesOfAsset(asset: AVAsset): AVVideoComposition;
  static videoCompositionWithPropertiesOfAsset(asset: AVAsset): AVMutableVideoComposition;

  static videoCompositionWithPropertiesOfAssetPrototypeInstruction(asset: AVAsset, prototypeInstruction: AVVideoCompositionInstruction): AVMutableVideoComposition;

  // @ts-ignore MemberDecl.tsIgnore
  customVideoCompositorClass: AVVideoCompositing;

  // @ts-ignore MemberDecl.tsIgnore
  frameDuration: CMTime;

  // @ts-ignore MemberDecl.tsIgnore
  sourceTrackIDForFrameTiming: number;

  // @ts-ignore MemberDecl.tsIgnore
  renderSize: CGSize;

  // @ts-ignore MemberDecl.tsIgnore
  renderScale: number;

  // @ts-ignore MemberDecl.tsIgnore
  get instructions(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set instructions(value: NSArray<interop.Object> | Array<interop.Object>);

  // @ts-ignore MemberDecl.tsIgnore
  animationTool: AVVideoCompositionCoreAnimationTool;

  // @ts-ignore MemberDecl.tsIgnore
  colorPrimaries: string;

  // @ts-ignore MemberDecl.tsIgnore
  colorYCbCrMatrix: string;

  // @ts-ignore MemberDecl.tsIgnore
  colorTransferFunction: string;

  static videoCompositionWithAssetApplyingCIFiltersWithHandler(asset: AVAsset, applier: (p1: AVAsynchronousCIImageFilteringRequest) => void): AVVideoComposition;
  static videoCompositionWithAssetApplyingCIFiltersWithHandler(asset: AVAsset, applier: (p1: AVAsynchronousCIImageFilteringRequest) => void): AVMutableVideoComposition;
}

export declare class AVVideoComposition extends NSObject implements NSCopying, NSMutableCopying {
  static videoCompositionWithPropertiesOfAsset(asset: AVAsset): AVVideoComposition;

  readonly customVideoCompositorClass: AVVideoCompositing;

  readonly frameDuration: CMTime;

  readonly sourceTrackIDForFrameTiming: number;

  readonly renderSize: CGSize;

  readonly renderScale: number;

  readonly instructions: NSArray;

  readonly animationTool: AVVideoCompositionCoreAnimationTool;

  readonly colorPrimaries: string;

  readonly colorYCbCrMatrix: string;

  readonly colorTransferFunction: string;

  static videoCompositionWithAssetApplyingCIFiltersWithHandler(asset: AVAsset, applier: (p1: AVAsynchronousCIImageFilteringRequest) => void): AVVideoComposition;

  isValidForAssetTimeRangeValidationDelegate(asset: AVAsset | null, timeRange: CMTimeRange, validationDelegate: AVVideoCompositionValidationHandling | null): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVAsynchronousCIImageFilteringRequest extends NSObject implements NSCopying {
  readonly renderSize: CGSize;

  readonly compositionTime: CMTime;

  readonly sourceImage: CIImage;

  finishWithImageContext(filteredImage: CIImage, context: CIContext | null): void;

  finishWithError(error: NSError): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVVideoCompositionRenderHint extends NSObject {
  readonly startCompositionTime: CMTime;

  readonly endCompositionTime: CMTime;
}

export declare class AVVideoCompositionRenderContext extends NSObject {
  readonly size: CGSize;

  readonly renderTransform: CGAffineTransform;

  readonly renderScale: number;

  readonly pixelAspectRatio: AVPixelAspectRatio;

  readonly edgeWidths: AVEdgeWidths;

  readonly highQualityRendering: boolean;

  readonly videoComposition: AVVideoComposition;

  newPixelBuffer(): interop.Object;
}

export declare class AVDateRangeMetadataGroup extends AVMetadataGroup implements NSCopying, NSMutableCopying {
  initWithItemsStartDateEndDate(items: NSArray<interop.Object> | Array<interop.Object>, startDate: NSDate, endDate: NSDate | null): this;

  readonly startDate: NSDate;

  readonly endDate: NSDate;

  readonly items: NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMetadataGroup extends NSObject {
  readonly items: NSArray;

  readonly classifyingLabel: string;

  readonly uniqueID: string;
}

export declare class AVAssetWriterInputPassDescription extends NSObject {
  readonly sourceTimeRanges: NSArray;
}

export declare class AVComposition extends AVAsset implements NSMutableCopying {
  readonly tracks: NSArray;

  readonly naturalSize: CGSize;

  readonly URLAssetInitializationOptions: NSDictionary;

  trackWithTrackID(trackID: number): AVAssetTrack;
  trackWithTrackID(trackID: number): AVCompositionTrack;

  tracksWithMediaType(mediaType: string): NSArray;

  tracksWithMediaCharacteristic(mediaCharacteristic: string): NSArray;

  metadataForFormat(format: string): NSArray;

  chapterMetadataGroupsWithTitleLocaleContainingItemsWithCommonKeys(locale: NSLocale, commonKeys: NSArray<interop.Object> | Array<interop.Object> | null): NSArray;

  chapterMetadataGroupsBestMatchingPreferredLanguages(preferredLanguages: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  mediaSelectionGroupForMediaCharacteristic(mediaCharacteristic: string): AVMediaSelectionGroup;

  unusedTrackID(): number;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVCompositionTrackFormatDescriptionReplacement extends NSObject implements NSSecureCoding {
  readonly originalFormatDescription: interop.Object;

  readonly replacementFormatDescription: interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class AVAssetTrackSegment extends NSObject {
  readonly timeMapping: CMTimeMapping;

  readonly empty: boolean;

  isEmpty(): boolean;
}

export declare class AVAssetImageGenerator extends NSObject {
  readonly asset: AVAsset;

  appliesPreferredTrackTransform: boolean;

  maximumSize: CGSize;

  apertureMode: string;

  videoComposition: AVVideoComposition;

  readonly customVideoCompositor: AVVideoCompositing;

  requestedTimeToleranceBefore: CMTime;

  requestedTimeToleranceAfter: CMTime;

  static assetImageGeneratorWithAsset<This extends abstract new (...args: any) => any>(this: This, asset: AVAsset): InstanceType<This>;

  initWithAsset(asset: AVAsset): this;

  copyCGImageAtTimeActualTimeError(requestedTime: CMTime, actualTime: interop.PointerConvertible, outError: interop.PointerConvertible): interop.Object;

  generateCGImagesAsynchronouslyForTimesCompletionHandler(requestedTimes: NSArray<interop.Object> | Array<interop.Object>, handler: (p1: CMTime, p2: interop.PointerConvertible, p3: CMTime, p4: interop.Enum<typeof AVAssetImageGeneratorResult>, p5: NSError) => void): void;

  cancelAllCGImageGeneration(): void;
}

export declare class AVCaptureInputPort extends NSObject {
  readonly input: AVCaptureInput;

  readonly mediaType: string;

  readonly formatDescription: interop.Object;

  enabled: boolean;

  readonly clock: interop.Object;

  isEnabled(): boolean;
}

export declare class AVAssetExportSession extends NSObject {
  static exportSessionWithAssetPresetName<This extends abstract new (...args: any) => any>(this: This, asset: AVAsset, presetName: string): InstanceType<This>;

  initWithAssetPresetName(asset: AVAsset, presetName: string): this;

  readonly presetName: string;

  readonly asset: AVAsset;

  outputFileType: string;

  outputURL: NSURL;

  shouldOptimizeForNetworkUse: boolean;

  readonly status: interop.Enum<typeof AVAssetExportSessionStatus>;

  readonly error: NSError;

  exportAsynchronouslyWithCompletionHandler(handler: () => void): void;

  readonly progress: number;

  cancelExport(): void;

  static allExportPresets(): NSArray;

  static exportPresetsCompatibleWithAsset(asset: AVAsset): NSArray;

  static determineCompatibilityOfExportPresetWithAssetOutputFileTypeCompletionHandler(presetName: string, asset: AVAsset, outputFileType: string | null, handler: (p1: boolean) => void): void;

  readonly supportedFileTypes: NSArray;

  determineCompatibleFileTypesWithCompletionHandler(handler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  timeRange: CMTimeRange;

  readonly maxDuration: CMTime;

  readonly estimatedOutputFileLength: number;

  fileLengthLimit: number;

  estimateMaximumDurationWithCompletionHandler(handler: (p1: CMTime, p2: NSError) => void | null): void;

  estimateOutputFileLengthWithCompletionHandler(handler: (p1: number, p2: NSError) => void | null): void;

  get metadata(): NSArray;
  set metadata(value: NSArray<interop.Object> | Array<interop.Object>);

  metadataItemFilter: AVMetadataItemFilter;

  audioTimePitchAlgorithm: string;

  audioMix: AVAudioMix;

  videoComposition: AVVideoComposition;

  readonly customVideoCompositor: AVVideoCompositing;

  canPerformMultiplePassesOverSourceMediaData: boolean;

  directoryForTemporaryFiles: NSURL;
}

export declare class AVAssetReaderSampleReferenceOutput extends AVAssetReaderOutput {
  static assetReaderSampleReferenceOutputWithTrack<This extends abstract new (...args: any) => any>(this: This, track: AVAssetTrack): InstanceType<This>;

  initWithTrack(track: AVAssetTrack): this;

  readonly track: AVAssetTrack;
}

export declare class AVAssetCache extends NSObject {
  readonly playableOffline: boolean;

  mediaSelectionOptionsInMediaSelectionGroup(mediaSelectionGroup: AVMediaSelectionGroup): NSArray;

  isPlayableOffline(): boolean;
}

export declare class AVURLAsset extends AVAsset implements NSItemProviderReading, NSItemProviderWriting, AVContentKeyRecipient {
  static audiovisualTypes(): NSArray;

  static audiovisualMIMETypes(): NSArray;

  static isPlayableExtendedMIMEType(extendedMIMEType: string): boolean;

  static URLAssetWithURLOptions<This extends abstract new (...args: any) => any>(this: This, URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithURLOptions(URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly URL: NSURL;

  readonly resourceLoader: AVAssetResourceLoader;

  readonly assetCache: AVAssetCache;

  compatibleTrackForCompositionTrack(compositionTrack: AVCompositionTrack): AVAssetTrack;

  readonly mayRequireContentKeysForMediaDataProcessing: boolean;

  static readonly readableTypeIdentifiersForItemProvider: NSArray;

  static objectWithItemProviderDataTypeIdentifierError<This extends abstract new (...args: any) => any>(this: This, data: NSData, typeIdentifier: string, outError: interop.PointerConvertible): InstanceType<This>;

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

  static readonly writableTypeIdentifiersForItemProvider: NSArray;

  readonly writableTypeIdentifiersForItemProvider: NSArray;

  static itemProviderVisibilityForRepresentationWithTypeIdentifier(typeIdentifier: string): interop.Enum<typeof NSItemProviderRepresentationVisibility>;

  itemProviderVisibilityForRepresentationWithTypeIdentifier(typeIdentifier: string): interop.Enum<typeof NSItemProviderRepresentationVisibility>;

  loadDataWithTypeIdentifierForItemProviderCompletionHandler(typeIdentifier: string, completionHandler: (p1: NSData, p2: NSError) => void | null): NSProgress;
}

export declare class AVContentKeyResponse extends NSObject {
  static contentKeyResponseWithFairPlayStreamingKeyResponseData<This extends abstract new (...args: any) => any>(this: This, keyResponseData: NSData): InstanceType<This>;

  static contentKeyResponseWithClearKeyDataInitializationVector<This extends abstract new (...args: any) => any>(this: This, keyData: NSData, initializationVector: NSData | null): InstanceType<This>;

  static contentKeyResponseWithAuthorizationTokenData<This extends abstract new (...args: any) => any>(this: This, authorizationTokenData: NSData): InstanceType<This>;
}

export declare class AVContentKeyRequest extends NSObject {
  readonly status: interop.Enum<typeof AVContentKeyRequestStatus>;

  readonly error: NSError;

  readonly identifier: interop.Object;

  readonly initializationData: NSData;

  readonly options: NSDictionary;

  readonly canProvidePersistableContentKey: boolean;

  makeStreamingContentKeyRequestDataForAppContentIdentifierOptionsCompletionHandler(appIdentifier: NSData, contentIdentifier: NSData | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, handler: (p1: NSData, p2: NSError) => void | null): void;

  processContentKeyResponse(keyResponse: AVContentKeyResponse): void;

  processContentKeyResponseError(error: NSError): void;

  respondByRequestingPersistableContentKeyRequestAndReturnError(outError: interop.PointerConvertible): boolean;

  readonly renewsExpiringResponseData: boolean;
}

export declare class AVCaptureStillImageOutput extends AVCaptureOutput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  get outputSettings(): NSDictionary;
  set outputSettings(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  readonly availableImageDataCVPixelFormatTypes: NSArray;

  readonly availableImageDataCodecTypes: NSArray;

  highResolutionStillImageOutputEnabled: boolean;

  readonly capturingStillImage: boolean;

  captureStillImageAsynchronouslyFromConnectionCompletionHandler(connection: AVCaptureConnection, handler: (p1: interop.PointerConvertible, p2: NSError) => void | null): void;

  static jpegStillImageNSDataRepresentation(jpegSampleBuffer: interop.Object): NSData;

  isHighResolutionStillImageOutputEnabled(): boolean;

  isCapturingStillImage(): boolean;
}

export declare class AVAssetTrack extends NSObject implements NSCopying, AVAsynchronousKeyValueLoading {
  readonly asset: AVAsset | null;

  readonly trackID: number;

  readonly mediaType: string;

  readonly formatDescriptions: NSArray;

  readonly playable: boolean;

  readonly decodable: boolean;

  readonly enabled: boolean;

  readonly selfContained: boolean;

  readonly totalSampleDataLength: number;

  hasMediaCharacteristic(mediaCharacteristic: string): boolean;

  isPlayable(): boolean;

  isDecodable(): boolean;

  isEnabled(): boolean;

  isSelfContained(): boolean;

  readonly timeRange: CMTimeRange;

  readonly naturalTimeScale: number;

  readonly estimatedDataRate: number;

  readonly languageCode: string;

  readonly extendedLanguageTag: string;

  readonly naturalSize: CGSize;

  readonly preferredTransform: CGAffineTransform;

  readonly preferredVolume: number;

  readonly hasAudioSampleDependencies: boolean;

  readonly nominalFrameRate: number;

  readonly minFrameDuration: CMTime;

  readonly requiresFrameReordering: boolean;

  readonly segments: NSArray;

  segmentForTrackTime(trackTime: CMTime): AVAssetTrackSegment;

  samplePresentationTimeForTrackTime(trackTime: CMTime): CMTime;

  readonly commonMetadata: NSArray;

  readonly metadata: NSArray;

  readonly availableMetadataFormats: NSArray;

  metadataForFormat(format: string): NSArray;

  readonly availableTrackAssociationTypes: NSArray;

  associatedTracksOfType(trackAssociationType: string): NSArray;

  readonly canProvideSampleCursors: boolean;

  makeSampleCursorWithPresentationTimeStamp(presentationTimeStamp: CMTime): AVSampleCursor;

  makeSampleCursorAtFirstSampleInDecodeOrder(): AVSampleCursor;

  makeSampleCursorAtLastSampleInDecodeOrder(): AVSampleCursor;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  statusOfValueForKeyError(key: string, outError: interop.PointerConvertible): interop.Enum<typeof AVKeyValueStatus>;

  loadValuesAsynchronouslyForKeysCompletionHandler(keys: NSArray<interop.Object> | Array<interop.Object>, handler: () => void | null): void;
}

export declare class AVSampleBufferAudioRenderer extends NSObject implements AVQueuedSampleBufferRendering {
  readonly status: interop.Enum<typeof AVQueuedSampleBufferRenderingStatus>;

  readonly error: NSError;

  audioOutputDeviceUniqueID: string;

  audioTimePitchAlgorithm: string;

  enqueueSampleBuffer(sampleBuffer: interop.Object): void;

  flush(): void;

  readonly readyForMoreMediaData: boolean;

  requestMediaDataWhenReadyOnQueueUsingBlock(queue: NSObject, block: () => void): void;

  stopRequestingMediaData(): void;

  isReadyForMoreMediaData(): boolean;

  volume: number;

  muted: boolean;

  isMuted(): boolean;

  flushFromSourceTimeCompletionHandler(time: CMTime, completionHandler: (p1: boolean) => void): void;

  readonly timebase: interop.Object;

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

export declare class AVContentKeySession extends NSObject {
  static contentKeySessionWithKeySystem<This extends abstract new (...args: any) => any>(this: This, keySystem: string): InstanceType<This>;

  static contentKeySessionWithKeySystemStorageDirectoryAtURL<This extends abstract new (...args: any) => any>(this: This, keySystem: string, storageURL: NSURL): InstanceType<This>;

  readonly delegate: AVContentKeySessionDelegate;

  readonly delegateQueue: NSObject;

  readonly storageURL: NSURL;

  readonly keySystem: string;

  expire(): void;

  readonly contentProtectionSessionIdentifier: NSData;

  processContentKeyRequestWithIdentifierInitializationDataOptions(identifier: interop.Object | null, initializationData: NSData | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  renewExpiringResponseDataForContentKeyRequest(contentKeyRequest: AVContentKeyRequest): void;

  makeSecureTokenForExpirationDateOfPersistableContentKeyCompletionHandler(persistableContentKeyData: NSData, handler: (p1: NSData, p2: NSError) => void | null): void;

  invalidatePersistableContentKeyOptionsCompletionHandler(persistableContentKeyData: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, handler: (p1: NSData, p2: NSError) => void | null): void;

  invalidateAllPersistableContentKeysForAppOptionsCompletionHandler(appIdentifier: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, handler: (p1: NSData, p2: NSError) => void | null): void;

  addContentKeyRecipient(recipient: AVContentKeyRecipient): void;

  removeContentKeyRecipient(recipient: AVContentKeyRecipient): void;

  readonly contentKeyRecipients: NSArray;

  static pendingExpiredSessionReportsWithAppIdentifierStorageDirectoryAtURL(appIdentifier: NSData, storageURL: NSURL): NSArray;

  static removePendingExpiredSessionReportsWithAppIdentifierStorageDirectoryAtURL(expiredSessionReports: NSArray<interop.Object> | Array<interop.Object>, appIdentifier: NSData, storageURL: NSURL): void;
}

export declare class AVPlayerItemMetadataCollector extends AVPlayerItemMediaDataCollector {
  initWithIdentifiersClassifyingLabels(identifiers: NSArray<interop.Object> | Array<interop.Object> | null, classifyingLabels: NSArray<interop.Object> | Array<interop.Object> | null): this;

  readonly delegate: AVPlayerItemMetadataCollectorPushDelegate;

  readonly delegateQueue: NSObject;
}

export declare class AVDepthData extends NSObject {
  static depthDataFromDictionaryRepresentationError<This extends abstract new (...args: any) => any>(this: This, imageSourceAuxDataInfoDictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): InstanceType<This>;

  depthDataByConvertingToDepthDataType(depthDataType: number): this;

  depthDataByApplyingExifOrientation(exifOrientation: interop.Enum<typeof CGImagePropertyOrientation>): this;

  depthDataByReplacingDepthDataMapWithPixelBufferError(pixelBuffer: interop.Object, outError: interop.PointerConvertible): this;

  readonly availableDepthDataTypes: NSArray;

  dictionaryRepresentationForAuxiliaryDataType(outAuxDataType: interop.PointerConvertible): NSDictionary;

  readonly depthDataType: number;

  readonly depthDataMap: interop.Object;

  readonly depthDataQuality: interop.Enum<typeof AVDepthDataQuality>;

  readonly depthDataFiltered: boolean;

  readonly depthDataAccuracy: interop.Enum<typeof AVDepthDataAccuracy>;

  readonly cameraCalibrationData: AVCameraCalibrationData;

  isDepthDataFiltered(): boolean;
}

export declare class AVMutableComposition extends AVComposition {
  readonly tracks: NSArray;

  // @ts-ignore MemberDecl.tsIgnore
  naturalSize: CGSize;

  static composition<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  static compositionWithURLAssetInitializationOptions<This extends abstract new (...args: any) => any>(this: This, URLAssetInitializationOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  insertTimeRangeOfAssetAtTimeError(timeRange: CMTimeRange, asset: AVAsset, startTime: CMTime, outError: interop.PointerConvertible): boolean;

  insertTimeRangeOfAssetAtTimeCompletionHandler(timeRange: CMTimeRange, asset: AVAsset, startTime: CMTime, completionHandler: (p1: NSError) => void | null): void;

  insertEmptyTimeRange(timeRange: CMTimeRange): void;

  removeTimeRange(timeRange: CMTimeRange): void;

  scaleTimeRangeToDuration(timeRange: CMTimeRange, duration: CMTime): void;

  addMutableTrackWithMediaTypePreferredTrackID(mediaType: string, preferredTrackID: number): AVMutableCompositionTrack;

  removeTrack(track: AVCompositionTrack): void;

  mutableTrackCompatibleWithTrack(track: AVAssetTrack): AVMutableCompositionTrack;

  trackWithTrackID(trackID: number): AVCompositionTrack;
  trackWithTrackID(trackID: number): AVAssetTrack;
  trackWithTrackID(trackID: number): AVMutableCompositionTrack;

  tracksWithMediaType(mediaType: string): NSArray;

  tracksWithMediaCharacteristic(mediaCharacteristic: string): NSArray;
}

export declare class AVCapturePhotoSettings extends NSObject implements NSCopying {
  static photoSettings<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  static photoSettingsWithFormat<This extends abstract new (...args: any) => any>(this: This, format: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  static photoSettingsFromPhotoSettings<This extends abstract new (...args: any) => any>(this: This, photoSettings: AVCapturePhotoSettings): InstanceType<This>;

  readonly uniqueID: number;

  readonly format: NSDictionary;

  readonly processedFileType: string;

  highResolutionPhotoEnabled: boolean;

  isHighResolutionPhotoEnabled(): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVCapturePhoto extends NSObject {
  readonly timestamp: CMTime;

  readonly pixelBuffer: interop.Object;

  readonly resolvedSettings: AVCaptureResolvedPhotoSettings;

  readonly photoCount: number;

  fileDataRepresentation(): NSData;

  CGImageRepresentation(): interop.Object;
}

export declare class AVCaptureAudioPreviewOutput extends AVCaptureOutput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  outputDeviceUniqueID: string;

  volume: number;
}

export declare class AVSemanticSegmentationMatte extends NSObject {
  static semanticSegmentationMatteFromImageSourceAuxiliaryDataTypeDictionaryRepresentationError<This extends abstract new (...args: any) => any>(this: This, imageSourceAuxiliaryDataType: interop.Object, imageSourceAuxiliaryDataInfoDictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): InstanceType<This>;

  readonly matteType: string;

  semanticSegmentationMatteByApplyingExifOrientation(exifOrientation: interop.Enum<typeof CGImagePropertyOrientation>): this;

  semanticSegmentationMatteByReplacingSemanticSegmentationMatteWithPixelBufferError(pixelBuffer: interop.Object, outError: interop.PointerConvertible): this;

  dictionaryRepresentationForAuxiliaryDataType(outAuxDataType: interop.PointerConvertible): NSDictionary;

  readonly pixelFormatType: number;

  readonly mattingImage: interop.Object;
}

export declare class AVPlayerItemErrorLogEvent extends NSObject implements NSCopying {
  readonly date: NSDate;

  readonly URI: string;

  readonly serverAddress: string;

  readonly playbackSessionID: string;

  readonly errorStatusCode: number;

  readonly errorDomain: string;

  readonly errorComment: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVCompositionTrack extends AVAssetTrack {
  readonly segments: NSArray;

  segmentForTrackTime(trackTime: CMTime): AVAssetTrackSegment;
  segmentForTrackTime(trackTime: CMTime): AVCompositionTrackSegment;

  readonly formatDescriptionReplacements: NSArray;

  hasMediaCharacteristic(mediaCharacteristic: string): boolean;

  samplePresentationTimeForTrackTime(trackTime: CMTime): CMTime;

  metadataForFormat(format: string): NSArray;

  associatedTracksOfType(trackAssociationType: string): NSArray;
}

export declare class AVSampleCursor extends NSObject implements NSCopying {
  stepInDecodeOrderByCount(stepCount: number): number;

  stepInPresentationOrderByCount(stepCount: number): number;

  stepByDecodeTimeWasPinned(deltaDecodeTime: CMTime, outWasPinned: interop.PointerConvertible): CMTime;

  stepByPresentationTimeWasPinned(deltaPresentationTime: CMTime, outWasPinned: interop.PointerConvertible): CMTime;

  readonly presentationTimeStamp: CMTime;

  readonly decodeTimeStamp: CMTime;

  comparePositionInDecodeOrderWithPositionOfCursor(cursor: AVSampleCursor): interop.Enum<typeof NSComparisonResult>;

  samplesWithEarlierDecodeTimeStampsMayHaveLaterPresentationTimeStampsThanCursor(cursor: AVSampleCursor): boolean;

  samplesWithLaterDecodeTimeStampsMayHaveEarlierPresentationTimeStampsThanCursor(cursor: AVSampleCursor): boolean;

  readonly currentSampleDuration: CMTime;

  copyCurrentSampleFormatDescription(): interop.Object;

  readonly currentSampleSyncInfo: AVSampleCursorSyncInfo;

  readonly currentSampleDependencyInfo: AVSampleCursorDependencyInfo;

  readonly currentSampleAudioDependencyInfo: AVSampleCursorAudioDependencyInfo;

  readonly samplesRequiredForDecoderRefresh: number;

  readonly currentChunkStorageURL: NSURL;

  readonly currentChunkStorageRange: AVSampleCursorStorageRange;

  readonly currentChunkInfo: AVSampleCursorChunkInfo;

  readonly currentSampleIndexInChunk: number;

  readonly currentSampleStorageRange: AVSampleCursorStorageRange;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVPlayerItemMediaDataCollector extends NSObject {
}

export declare class AVMutableMediaSelection extends AVMediaSelection {
  selectMediaOptionInMediaSelectionGroup(mediaSelectionOption: AVMediaSelectionOption | null, mediaSelectionGroup: AVMediaSelectionGroup): void;
}

export declare class AVAssetResourceLoadingContentInformationRequest extends NSObject {
  contentType: string;

  readonly allowedContentTypes: NSArray;

  contentLength: number;

  byteRangeAccessSupported: boolean;

  renewalDate: NSDate;

  isByteRangeAccessSupported(): boolean;
}

export declare class AVCaptureDevice extends NSObject {
  static devices(): NSArray;

  static devicesWithMediaType(mediaType: string): NSArray;

  static defaultDeviceWithMediaType(mediaType: string): AVCaptureDevice;

  static deviceWithUniqueID(deviceUniqueID: string): AVCaptureDevice;

  readonly uniqueID: string;

  readonly modelID: string;

  readonly localizedName: string;

  readonly manufacturer: string;

  readonly transportType: number;

  hasMediaType(mediaType: string): boolean;

  lockForConfiguration(outError: interop.PointerConvertible): boolean;

  unlockForConfiguration(): void;

  supportsAVCaptureSessionPreset(preset: string): boolean;

  readonly connected: boolean;

  readonly inUseByAnotherApplication: boolean;

  readonly suspended: boolean;

  readonly linkedDevices: NSArray;

  readonly formats: NSArray;

  activeFormat: AVCaptureDeviceFormat;

  activeVideoMinFrameDuration: CMTime;

  activeVideoMaxFrameDuration: CMTime;

  readonly inputSources: NSArray;

  activeInputSource: AVCaptureDeviceInputSource;

  isConnected(): boolean;

  isInUseByAnotherApplication(): boolean;

  isSuspended(): boolean;

  readonly position: interop.Enum<typeof AVCaptureDevicePosition>;

  readonly deviceType: string;

  static defaultDeviceWithDeviceTypeMediaTypePosition(deviceType: string, mediaType: string | null, position: interop.Enum<typeof AVCaptureDevicePosition>): AVCaptureDevice;

  readonly hasFlash: boolean;

  readonly flashAvailable: boolean;

  isFlashModeSupported(flashMode: interop.Enum<typeof AVCaptureFlashMode>): boolean;

  flashMode: interop.Enum<typeof AVCaptureFlashMode>;

  isFlashAvailable(): boolean;

  readonly hasTorch: boolean;

  readonly torchAvailable: boolean;

  readonly torchActive: boolean;

  readonly torchLevel: number;

  isTorchModeSupported(torchMode: interop.Enum<typeof AVCaptureTorchMode>): boolean;

  torchMode: interop.Enum<typeof AVCaptureTorchMode>;

  setTorchModeOnWithLevelError(torchLevel: number, outError: interop.PointerConvertible): boolean;

  isTorchAvailable(): boolean;

  isTorchActive(): boolean;

  isFocusModeSupported(focusMode: interop.Enum<typeof AVCaptureFocusMode>): boolean;

  focusMode: interop.Enum<typeof AVCaptureFocusMode>;

  readonly focusPointOfInterestSupported: boolean;

  focusPointOfInterest: CGPoint;

  readonly adjustingFocus: boolean;

  isFocusPointOfInterestSupported(): boolean;

  isAdjustingFocus(): boolean;

  isExposureModeSupported(exposureMode: interop.Enum<typeof AVCaptureExposureMode>): boolean;

  exposureMode: interop.Enum<typeof AVCaptureExposureMode>;

  readonly exposurePointOfInterestSupported: boolean;

  exposurePointOfInterest: CGPoint;

  readonly adjustingExposure: boolean;

  isExposurePointOfInterestSupported(): boolean;

  isAdjustingExposure(): boolean;

  isWhiteBalanceModeSupported(whiteBalanceMode: interop.Enum<typeof AVCaptureWhiteBalanceMode>): boolean;

  whiteBalanceMode: interop.Enum<typeof AVCaptureWhiteBalanceMode>;

  readonly adjustingWhiteBalance: boolean;

  isAdjustingWhiteBalance(): boolean;

  static authorizationStatusForMediaType(mediaType: string): interop.Enum<typeof AVAuthorizationStatus>;

  static requestAccessForMediaTypeCompletionHandler(mediaType: string, handler: (p1: boolean) => void): void;

  readonly transportControlsSupported: boolean;

  readonly transportControlsPlaybackMode: interop.Enum<typeof AVCaptureDeviceTransportControlsPlaybackMode>;

  readonly transportControlsSpeed: number;

  setTransportControlsPlaybackModeSpeed(mode: interop.Enum<typeof AVCaptureDeviceTransportControlsPlaybackMode>, speed: number): void;

  activeColorSpace: interop.Enum<typeof AVCaptureColorSpace>;
}

export declare class AVFragmentedAsset extends AVURLAsset implements AVFragmentMinding {
  static fragmentedAssetWithURLOptions<This extends abstract new (...args: any) => any>(this: This, URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  readonly tracks: NSArray;

  trackWithTrackID(trackID: number): AVAssetTrack;
  trackWithTrackID(trackID: number): AVFragmentedAssetTrack;

  tracksWithMediaType(mediaType: string): NSArray;

  tracksWithMediaCharacteristic(mediaCharacteristic: string): NSArray;

  readonly associatedWithFragmentMinder: boolean;

  isAssociatedWithFragmentMinder(): boolean;
}

export declare class AVCameraCalibrationData extends NSObject {
  readonly intrinsicMatrix: simd_float3x3;

  readonly intrinsicMatrixReferenceDimensions: CGSize;

  readonly extrinsicMatrix: simd_float4x3;

  readonly pixelSize: number;

  readonly lensDistortionLookupTable: NSData;

  readonly inverseLensDistortionLookupTable: NSData;

  readonly lensDistortionCenter: CGPoint;
}

export declare class AVAsynchronousVideoCompositionRequest extends NSObject implements NSCopying {
  readonly renderContext: AVVideoCompositionRenderContext;

  readonly compositionTime: CMTime;

  readonly sourceTrackIDs: NSArray;

  readonly videoCompositionInstruction: AVVideoCompositionInstruction;

  sourceFrameByTrackID(trackID: number): interop.Object;

  sourceSampleBufferByTrackID(trackID: number): interop.Object;

  finishWithComposedVideoFrame(composedVideoFrame: interop.Object): void;

  finishWithError(error: NSError): void;

  finishCancelledRequest(): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVAssetReader extends NSObject {
  static assetReaderWithAssetError<This extends abstract new (...args: any) => any>(this: This, asset: AVAsset, outError: interop.PointerConvertible): InstanceType<This>;

  initWithAssetError(asset: AVAsset, outError: interop.PointerConvertible): this;

  readonly asset: AVAsset;

  readonly status: interop.Enum<typeof AVAssetReaderStatus>;

  readonly error: NSError;

  timeRange: CMTimeRange;

  readonly outputs: NSArray;

  canAddOutput(output: AVAssetReaderOutput): boolean;

  addOutput(output: AVAssetReaderOutput): void;

  startReading(): boolean;

  cancelReading(): void;
}

export declare class AVAssetSegmentReport extends NSObject {
  readonly segmentType: interop.Enum<typeof AVAssetSegmentType>;

  readonly trackReports: NSArray;
}

export declare class AVMediaSelectionOption extends NSObject implements NSCopying {
  readonly mediaType: string;

  readonly mediaSubTypes: NSArray;

  hasMediaCharacteristic(mediaCharacteristic: string): boolean;

  readonly playable: boolean;

  readonly extendedLanguageTag: string;

  readonly locale: NSLocale;

  readonly commonMetadata: NSArray;

  readonly availableMetadataFormats: NSArray;

  metadataForFormat(format: string): NSArray;

  associatedMediaSelectionOptionInMediaSelectionGroup(mediaSelectionGroup: AVMediaSelectionGroup): AVMediaSelectionOption;

  propertyList(): interop.Object;

  displayNameWithLocale(locale: NSLocale): string;

  readonly displayName: string;

  isPlayable(): boolean;

  makeNowPlayingInfoLanguageOption(): MPNowPlayingInfoLanguageOption;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVAssetResourceRenewalRequest extends AVAssetResourceLoadingRequest {
}

export declare class AVFragmentedAssetTrack extends AVAssetTrack {
}

export declare class AVAssetWriter extends NSObject {
  static assetWriterWithURLFileTypeError<This extends abstract new (...args: any) => any>(this: This, outputURL: NSURL, outputFileType: string, outError: interop.PointerConvertible): InstanceType<This>;

  initWithURLFileTypeError(outputURL: NSURL, outputFileType: string, outError: interop.PointerConvertible): this;

  initWithContentType(outputContentType: UTType): this;

  readonly outputURL: NSURL;

  readonly outputFileType: string;

  readonly availableMediaTypes: NSArray;

  readonly status: interop.Enum<typeof AVAssetWriterStatus>;

  readonly error: NSError;

  get metadata(): NSArray;
  set metadata(value: NSArray<interop.Object> | Array<interop.Object>);

  shouldOptimizeForNetworkUse: boolean;

  directoryForTemporaryFiles: NSURL;

  readonly inputs: NSArray;

  canApplyOutputSettingsForMediaType(outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, mediaType: string): boolean;

  canAddInput(input: AVAssetWriterInput): boolean;

  addInput(input: AVAssetWriterInput): void;

  startWriting(): boolean;

  startSessionAtSourceTime(startTime: CMTime): void;

  endSessionAtSourceTime(endTime: CMTime): void;

  cancelWriting(): void;

  finishWriting(): boolean;

  finishWritingWithCompletionHandler(handler: () => void): void;

  movieFragmentInterval: CMTime;

  initialMovieFragmentSequenceNumber: number;

  producesCombinableFragments: boolean;

  overallDurationHint: CMTime;

  movieTimeScale: number;

  canAddInputGroup(inputGroup: AVAssetWriterInputGroup): boolean;

  addInputGroup(inputGroup: AVAssetWriterInputGroup): void;

  readonly inputGroups: NSArray;

  preferredOutputSegmentInterval: CMTime;

  initialSegmentStartTime: CMTime;

  outputFileTypeProfile: string;

  delegate: AVAssetWriterDelegate;

  flushSegment(): void;
}

export declare class AVMutableTimedMetadataGroup extends AVTimedMetadataGroup {
  // @ts-ignore MemberDecl.tsIgnore
  timeRange: CMTimeRange;

  // @ts-ignore MemberDecl.tsIgnore
  get items(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set items(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class AVFragmentedAssetMinder extends NSObject {
  static fragmentedAssetMinderWithAssetMindingInterval<This extends abstract new (...args: any) => any>(this: This, asset: AVAsset, mindingInterval: number): InstanceType<This>;

  initWithAssetMindingInterval(asset: AVAsset, mindingInterval: number): this;

  mindingInterval: number;

  readonly assets: NSArray;

  addFragmentedAsset(asset: AVAsset): void;

  removeFragmentedAsset(asset: AVAsset): void;
}

export declare class AVAssetReaderAudioMixOutput extends AVAssetReaderOutput {
  static assetReaderAudioMixOutputWithAudioTracksAudioSettings<This extends abstract new (...args: any) => any>(this: This, audioTracks: NSArray<interop.Object> | Array<interop.Object>, audioSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithAudioTracksAudioSettings(audioTracks: NSArray<interop.Object> | Array<interop.Object>, audioSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly audioTracks: NSArray;

  readonly audioSettings: NSDictionary;

  audioMix: AVAudioMix;

  audioTimePitchAlgorithm: string;
}

export declare class AVFragmentedMovieMinder extends AVFragmentedAssetMinder {
  static fragmentedMovieMinderWithMovieMindingInterval<This extends abstract new (...args: any) => any>(this: This, movie: AVFragmentedMovie, mindingInterval: number): InstanceType<This>;

  initWithMovieMindingInterval(movie: AVFragmentedMovie, mindingInterval: number): this;

  mindingInterval: number;

  readonly movies: NSArray;

  addFragmentedMovie(movie: AVFragmentedMovie): void;

  removeFragmentedMovie(movie: AVFragmentedMovie): void;
}

export declare class AVPersistableContentKeyRequest extends AVContentKeyRequest {
  persistableContentKeyFromKeyVendorResponseOptionsError(keyVendorResponse: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): NSData;
}

export declare class AVPlayerItemAccessLogEvent extends NSObject implements NSCopying {
  readonly numberOfSegmentsDownloaded: number;

  readonly numberOfMediaRequests: number;

  readonly playbackStartDate: NSDate;

  readonly URI: string;

  readonly serverAddress: string;

  readonly numberOfServerAddressChanges: number;

  readonly playbackSessionID: string;

  readonly playbackStartOffset: number;

  readonly segmentsDownloadedDuration: number;

  readonly durationWatched: number;

  readonly numberOfStalls: number;

  readonly numberOfBytesTransferred: number;

  readonly transferDuration: number;

  readonly observedBitrate: number;

  readonly indicatedBitrate: number;

  readonly indicatedAverageBitrate: number;

  readonly averageVideoBitrate: number;

  readonly averageAudioBitrate: number;

  readonly numberOfDroppedVideoFrames: number;

  readonly startupTime: number;

  readonly downloadOverdue: number;

  readonly observedMaxBitrate: number;

  readonly observedMinBitrate: number;

  readonly observedBitrateStandardDeviation: number;

  readonly playbackType: string;

  readonly mediaRequestsWWAN: number;

  readonly switchBitrate: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVCapturePhotoOutput extends AVCaptureOutput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  capturePhotoWithSettingsDelegate(settings: AVCapturePhotoSettings, delegate: AVCapturePhotoCaptureDelegate): void;

  readonly availablePhotoPixelFormatTypes: NSArray;

  readonly availablePhotoCodecTypes: NSArray;

  readonly availablePhotoFileTypes: NSArray;

  supportedPhotoPixelFormatTypesForFileType(fileType: string): NSArray;

  supportedPhotoCodecTypesForFileType(fileType: string): NSArray;

  highResolutionCaptureEnabled: boolean;

  isHighResolutionCaptureEnabled(): boolean;
}

export declare class AVMediaDataStorage extends NSObject {
  initWithURLOptions(URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  URL(): NSURL;
}

export declare class AVAssetWriterInputMetadataAdaptor extends NSObject {
  static assetWriterInputMetadataAdaptorWithAssetWriterInput<This extends abstract new (...args: any) => any>(this: This, input: AVAssetWriterInput): InstanceType<This>;

  initWithAssetWriterInput(input: AVAssetWriterInput): this;

  readonly assetWriterInput: AVAssetWriterInput;

  appendTimedMetadataGroup(timedMetadataGroup: AVTimedMetadataGroup): boolean;
}

export declare class AVPlayerItemAccessLog extends NSObject implements NSCopying {
  extendedLogData(): NSData;

  readonly extendedLogDataStringEncoding: number;

  readonly events: NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVCaptureAudioDataOutput extends AVCaptureOutput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  setSampleBufferDelegateQueue(sampleBufferDelegate: AVCaptureAudioDataOutputSampleBufferDelegate | null, sampleBufferCallbackQueue: NSObject | null): void;

  readonly sampleBufferDelegate: AVCaptureAudioDataOutputSampleBufferDelegate;

  readonly sampleBufferCallbackQueue: NSObject;

  get audioSettings(): NSDictionary;
  set audioSettings(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  recommendedAudioSettingsForAssetWriterWithOutputFileType(outputFileType: string): NSDictionary;
}

export declare class AVTimedMetadataGroup extends AVMetadataGroup implements NSCopying, NSMutableCopying {
  initWithItemsTimeRange(items: NSArray<interop.Object> | Array<interop.Object>, timeRange: CMTimeRange): this;

  initWithSampleBuffer(sampleBuffer: interop.Object): this;

  readonly timeRange: CMTimeRange;

  readonly items: NSArray;

  copyFormatDescription(): interop.Object;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVMutableCompositionTrack extends AVCompositionTrack {
  // @ts-ignore MemberDecl.tsIgnore
  enabled: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  naturalTimeScale: number;

  // @ts-ignore MemberDecl.tsIgnore
  languageCode: string;

  // @ts-ignore MemberDecl.tsIgnore
  extendedLanguageTag: string;

  // @ts-ignore MemberDecl.tsIgnore
  preferredTransform: CGAffineTransform;

  // @ts-ignore MemberDecl.tsIgnore
  preferredVolume: number;

  // @ts-ignore MemberDecl.tsIgnore
  get segments(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set segments(value: NSArray<interop.Object> | Array<interop.Object>);

  insertTimeRangeOfTrackAtTimeError(timeRange: CMTimeRange, track: AVAssetTrack, startTime: CMTime, outError: interop.PointerConvertible): boolean;

  insertTimeRangesOfTracksAtTimeError(timeRanges: NSArray<interop.Object> | Array<interop.Object>, tracks: NSArray<interop.Object> | Array<interop.Object>, startTime: CMTime, outError: interop.PointerConvertible): boolean;

  insertEmptyTimeRange(timeRange: CMTimeRange): void;

  removeTimeRange(timeRange: CMTimeRange): void;

  scaleTimeRangeToDuration(timeRange: CMTimeRange, duration: CMTime): void;

  validateTrackSegmentsError(trackSegments: NSArray<interop.Object> | Array<interop.Object>, outError: interop.PointerConvertible): boolean;

  addTrackAssociationToTrackType(compositionTrack: AVCompositionTrack, trackAssociationType: string): void;

  removeTrackAssociationToTrackType(compositionTrack: AVCompositionTrack, trackAssociationType: string): void;

  isEnabled(): boolean;

  replaceFormatDescriptionWithFormatDescription(originalFormatDescription: interop.Object, replacementFormatDescription: interop.Object | null): void;
}

export declare class AVPlayerItemOutput extends NSObject {
  itemTimeForHostTime(hostTimeInSeconds: number): CMTime;

  itemTimeForMachAbsoluteTime(machAbsoluteTime: number): CMTime;

  itemTimeForCVTimeStamp(timestamp: CVTimeStamp): CMTime;

  suppressesPlayerRendering: boolean;
}

export declare class AVMetadataMachineReadableCodeObject extends AVMetadataObject {
  readonly corners: NSArray;

  readonly stringValue: string;

  readonly descriptor: CIBarcodeDescriptor;
}

export declare class AVMutableAudioMix extends AVAudioMix {
  static audioMix<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  // @ts-ignore MemberDecl.tsIgnore
  get inputParameters(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set inputParameters(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class AVCaptureResolvedPhotoSettings extends NSObject {
  readonly uniqueID: number;

  readonly photoDimensions: CMVideoDimensions;

  readonly expectedPhotoCount: number;
}

export declare class AVAssetWriterInput extends NSObject {
  static assetWriterInputWithMediaTypeOutputSettings<This extends abstract new (...args: any) => any>(this: This, mediaType: string, outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  static assetWriterInputWithMediaTypeOutputSettingsSourceFormatHint<This extends abstract new (...args: any) => any>(this: This, mediaType: string, outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, sourceFormatHint: interop.Object | null): InstanceType<This>;

  initWithMediaTypeOutputSettings(mediaType: string, outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithMediaTypeOutputSettingsSourceFormatHint(mediaType: string, outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, sourceFormatHint: interop.Object | null): this;

  readonly mediaType: string;

  readonly outputSettings: NSDictionary;

  readonly sourceFormatHint: interop.Object;

  get metadata(): NSArray;
  set metadata(value: NSArray<interop.Object> | Array<interop.Object>);

  readonly readyForMoreMediaData: boolean;

  expectsMediaDataInRealTime: boolean;

  requestMediaDataWhenReadyOnQueueUsingBlock(queue: NSObject, block: () => void): void;

  appendSampleBuffer(sampleBuffer: interop.Object): boolean;

  markAsFinished(): void;

  isReadyForMoreMediaData(): boolean;

  languageCode: string;

  extendedLanguageTag: string;

  naturalSize: CGSize;

  transform: CGAffineTransform;

  preferredVolume: number;

  marksOutputTrackAsEnabled: boolean;

  mediaTimeScale: number;

  preferredMediaChunkDuration: CMTime;

  preferredMediaChunkAlignment: number;

  sampleReferenceBaseURL: NSURL;

  mediaDataLocation: string;

  canAddTrackAssociationWithTrackOfInputType(input: AVAssetWriterInput, trackAssociationType: string): boolean;

  addTrackAssociationWithTrackOfInputType(input: AVAssetWriterInput, trackAssociationType: string): void;

  performsMultiPassEncodingIfSupported: boolean;

  readonly canPerformMultiplePasses: boolean;

  readonly currentPassDescription: AVAssetWriterInputPassDescription;

  respondToEachPassDescriptionOnQueueUsingBlock(queue: NSObject, block: () => void): void;

  markCurrentPassAsFinished(): void;
}

export declare class AVCaptureDeviceInputSource extends NSObject {
  readonly inputSourceID: string;

  readonly localizedName: string;
}

export declare class AVCaptureDeviceFormat extends NSObject {
  readonly mediaType: string;

  readonly formatDescription: interop.Object;

  readonly videoSupportedFrameRateRanges: NSArray;

  readonly autoFocusSystem: interop.Enum<typeof AVCaptureAutoFocusSystem>;

  readonly supportedColorSpaces: NSArray;
}

export declare class AVAssetReaderVideoCompositionOutput extends AVAssetReaderOutput {
  static assetReaderVideoCompositionOutputWithVideoTracksVideoSettings<This extends abstract new (...args: any) => any>(this: This, videoTracks: NSArray<interop.Object> | Array<interop.Object>, videoSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithVideoTracksVideoSettings(videoTracks: NSArray<interop.Object> | Array<interop.Object>, videoSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly videoTracks: NSArray;

  readonly videoSettings: NSDictionary;

  videoComposition: AVVideoComposition;

  readonly customVideoCompositor: AVVideoCompositing;
}

export declare class AVCaptureInput extends NSObject {
  readonly ports: NSArray;
}

export declare class AVCompositionTrackSegment extends AVAssetTrackSegment {
  static compositionTrackSegmentWithURLTrackIDSourceTimeRangeTargetTimeRange<This extends abstract new (...args: any) => any>(this: This, URL: NSURL, trackID: number, sourceTimeRange: CMTimeRange, targetTimeRange: CMTimeRange): InstanceType<This>;

  static compositionTrackSegmentWithTimeRange<This extends abstract new (...args: any) => any>(this: This, timeRange: CMTimeRange): InstanceType<This>;

  initWithURLTrackIDSourceTimeRangeTargetTimeRange(URL: NSURL, trackID: number, sourceTimeRange: CMTimeRange, targetTimeRange: CMTimeRange): this;

  initWithTimeRange(timeRange: CMTimeRange): this;

  readonly empty: boolean;

  readonly sourceURL: NSURL;

  readonly sourceTrackID: number;

  isEmpty(): boolean;
}

export declare class AVMediaSelection extends NSObject implements NSCopying, NSMutableCopying {
  readonly asset: AVAsset | null;

  selectedMediaOptionInMediaSelectionGroup(mediaSelectionGroup: AVMediaSelectionGroup): AVMediaSelectionOption;

  mediaSelectionCriteriaCanBeAppliedAutomaticallyToMediaSelectionGroup(mediaSelectionGroup: AVMediaSelectionGroup): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVPlayerItemTrack extends NSObject {
  readonly assetTrack: AVAssetTrack;

  enabled: boolean;

  readonly currentVideoFrameRate: number;

  videoFieldMode: string;

  isEnabled(): boolean;
}

export declare class AVPlayerLooper extends NSObject {
  static playerLooperWithPlayerTemplateItemTimeRange<This extends abstract new (...args: any) => any>(this: This, player: AVQueuePlayer, itemToLoop: AVPlayerItem, loopRange: CMTimeRange): InstanceType<This>;

  static playerLooperWithPlayerTemplateItem<This extends abstract new (...args: any) => any>(this: This, player: AVQueuePlayer, itemToLoop: AVPlayerItem): InstanceType<This>;

  initWithPlayerTemplateItemTimeRange(player: AVQueuePlayer, itemToLoop: AVPlayerItem, loopRange: CMTimeRange): this;

  readonly status: interop.Enum<typeof AVPlayerLooperStatus>;

  readonly error: NSError;

  disableLooping(): void;

  readonly loopCount: number;

  readonly loopingPlayerItems: NSArray;
}

export declare class AVRouteDetector extends NSObject {
  routeDetectionEnabled: boolean;

  readonly multipleRoutesDetected: boolean;

  isRouteDetectionEnabled(): boolean;
}

export declare class AVAssetReaderTrackOutput extends AVAssetReaderOutput {
  static assetReaderTrackOutputWithTrackOutputSettings<This extends abstract new (...args: any) => any>(this: This, track: AVAssetTrack, outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithTrackOutputSettings(track: AVAssetTrack, outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly track: AVAssetTrack;

  readonly outputSettings: NSDictionary;

  audioTimePitchAlgorithm: string;
}

export declare class AVQueuePlayer extends AVPlayer {
  static queuePlayerWithItems<This extends abstract new (...args: any) => any>(this: This, items: NSArray<interop.Object> | Array<interop.Object>): InstanceType<This>;

  initWithItems(items: NSArray<interop.Object> | Array<interop.Object>): this;

  items(): NSArray;

  advanceToNextItem(): void;

  canInsertItemAfterItem(item: AVPlayerItem, afterItem: AVPlayerItem | null): boolean;

  insertItemAfterItem(item: AVPlayerItem, afterItem: AVPlayerItem | null): void;

  removeItem(item: AVPlayerItem): void;

  removeAllItems(): void;
}

export declare class AVOutputSettingsAssistant extends NSObject {
  static availableOutputSettingsPresets(): NSArray;

  static outputSettingsAssistantWithPreset<This extends abstract new (...args: any) => any>(this: This, presetIdentifier: string): InstanceType<This>;

  readonly audioSettings: NSDictionary;

  readonly videoSettings: NSDictionary;

  readonly outputFileType: string;

  sourceAudioFormat: interop.Object;

  sourceVideoFormat: interop.Object;

  sourceVideoAverageFrameDuration: CMTime;

  sourceVideoMinFrameDuration: CMTime;
}

export declare class AVAssetReaderOutputMetadataAdaptor extends NSObject {
  static assetReaderOutputMetadataAdaptorWithAssetReaderTrackOutput<This extends abstract new (...args: any) => any>(this: This, trackOutput: AVAssetReaderTrackOutput): InstanceType<This>;

  initWithAssetReaderTrackOutput(trackOutput: AVAssetReaderTrackOutput): this;

  readonly assetReaderTrackOutput: AVAssetReaderTrackOutput;

  nextTimedMetadataGroup(): AVTimedMetadataGroup;
}

export declare class AVCaptureMovieFileOutput extends AVCaptureFileOutput {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  movieFragmentInterval: CMTime;

  get metadata(): NSArray;
  set metadata(value: NSArray<interop.Object> | Array<interop.Object>);

  outputSettingsForConnection(connection: AVCaptureConnection): NSDictionary;

  setOutputSettingsForConnection(outputSettings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, connection: AVCaptureConnection): void;
}

export declare class AVMutableMovieTrack extends AVMovieTrack {
  // @ts-ignore MemberDecl.tsIgnore
  mediaDataStorage: AVMediaDataStorage;

  sampleReferenceBaseURL: NSURL;

  // @ts-ignore MemberDecl.tsIgnore
  enabled: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  alternateGroupID: number;

  modified: boolean;

  readonly hasProtectedContent: boolean;

  timescale: number;

  isEnabled(): boolean;

  isModified(): boolean;

  // @ts-ignore MemberDecl.tsIgnore
  languageCode: string;

  // @ts-ignore MemberDecl.tsIgnore
  extendedLanguageTag: string;

  // @ts-ignore MemberDecl.tsIgnore
  naturalSize: CGSize;

  // @ts-ignore MemberDecl.tsIgnore
  preferredTransform: CGAffineTransform;

  layer: number;

  cleanApertureDimensions: CGSize;

  productionApertureDimensions: CGSize;

  encodedPixelsDimensions: CGSize;

  // @ts-ignore MemberDecl.tsIgnore
  preferredVolume: number;

  preferredMediaChunkSize: number;

  preferredMediaChunkDuration: CMTime;

  preferredMediaChunkAlignment: number;

  insertTimeRangeOfTrackAtTimeCopySampleDataError(timeRange: CMTimeRange, track: AVAssetTrack, startTime: CMTime, copySampleData: boolean, outError: interop.PointerConvertible): boolean;

  insertEmptyTimeRange(timeRange: CMTimeRange): void;

  removeTimeRange(timeRange: CMTimeRange): void;

  scaleTimeRangeToDuration(timeRange: CMTimeRange, duration: CMTime): void;

  // @ts-ignore MemberDecl.tsIgnore
  get metadata(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set metadata(value: NSArray<interop.Object> | Array<interop.Object>);

  addTrackAssociationToTrackType(movieTrack: AVMovieTrack, trackAssociationType: string): void;

  removeTrackAssociationToTrackType(movieTrack: AVMovieTrack, trackAssociationType: string): void;

  replaceFormatDescriptionWithFormatDescription(formatDescription: interop.Object, newFormatDescription: interop.Object): void;

  appendSampleBufferDecodeTimePresentationTimeError(sampleBuffer: interop.Object, outDecodeTime: interop.PointerConvertible, outPresentationTime: interop.PointerConvertible, outError: interop.PointerConvertible): boolean;

  insertMediaTimeRangeIntoTimeRange(mediaTimeRange: CMTimeRange, trackTimeRange: CMTimeRange): boolean;

  hasMediaCharacteristic(mediaCharacteristic: string): boolean;

  segmentForTrackTime(trackTime: CMTime): AVAssetTrackSegment;

  samplePresentationTimeForTrackTime(trackTime: CMTime): CMTime;

  metadataForFormat(format: string): NSArray;

  associatedTracksOfType(trackAssociationType: string): NSArray;
}

export declare class AVAssetWriterInputPixelBufferAdaptor extends NSObject {
  static assetWriterInputPixelBufferAdaptorWithAssetWriterInputSourcePixelBufferAttributes<This extends abstract new (...args: any) => any>(this: This, input: AVAssetWriterInput, sourcePixelBufferAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithAssetWriterInputSourcePixelBufferAttributes(input: AVAssetWriterInput, sourcePixelBufferAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly assetWriterInput: AVAssetWriterInput;

  readonly sourcePixelBufferAttributes: NSDictionary;

  readonly pixelBufferPool: interop.Object;

  appendPixelBufferWithPresentationTime(pixelBuffer: interop.Object, presentationTime: CMTime): boolean;
}

export declare class AVMetadataSalientObject extends AVMetadataObject implements NSCopying {
  readonly objectID: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AVSampleBufferRequest extends NSObject {
  initWithStartCursor(startCursor: AVSampleCursor): this;

  readonly startCursor: AVSampleCursor;

  direction: interop.Enum<typeof AVSampleBufferRequestDirection>;

  limitCursor: AVSampleCursor;

  preferredMinSampleCount: number;

  maxSampleCount: number;

  mode: interop.Enum<typeof AVSampleBufferRequestMode>;

  overrideTime: CMTime;
}

export declare class AVFragmentedMovieTrack extends AVMovieTrack {
}

export declare class AVAssetResourceLoader extends NSObject {
  readonly delegate: AVAssetResourceLoaderDelegate;

  readonly delegateQueue: NSObject;

  preloadsEligibleContentKeys: boolean;
}

export declare class AVAsset extends NSObject implements NSCopying, AVAsynchronousKeyValueLoading {
  static assetWithURL<This extends abstract new (...args: any) => any>(this: This, URL: NSURL): InstanceType<This>;

  readonly duration: CMTime;

  readonly preferredRate: number;

  readonly preferredVolume: number;

  readonly preferredTransform: CGAffineTransform;

  readonly naturalSize: CGSize;

  readonly minimumTimeOffsetFromLive: CMTime;

  readonly providesPreciseDurationAndTiming: boolean;

  cancelLoading(): void;

  readonly referenceRestrictions: interop.Enum<typeof AVAssetReferenceRestrictions>;

  readonly tracks: NSArray;

  trackWithTrackID(trackID: number): AVAssetTrack;

  tracksWithMediaType(mediaType: string): NSArray;

  tracksWithMediaCharacteristic(mediaCharacteristic: string): NSArray;

  readonly trackGroups: NSArray;

  readonly creationDate: AVMetadataItem;

  readonly lyrics: string;

  readonly commonMetadata: NSArray;

  readonly metadata: NSArray;

  readonly availableMetadataFormats: NSArray;

  metadataForFormat(format: string): NSArray;

  readonly availableChapterLocales: NSArray;

  chapterMetadataGroupsWithTitleLocaleContainingItemsWithCommonKeys(locale: NSLocale, commonKeys: NSArray<interop.Object> | Array<interop.Object> | null): NSArray;

  chapterMetadataGroupsBestMatchingPreferredLanguages(preferredLanguages: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  readonly availableMediaCharacteristicsWithMediaSelectionOptions: NSArray;

  mediaSelectionGroupForMediaCharacteristic(mediaCharacteristic: string): AVMediaSelectionGroup;

  readonly preferredMediaSelection: AVMediaSelection;

  readonly allMediaSelections: NSArray;

  readonly hasProtectedContent: boolean;

  readonly canContainFragments: boolean;

  readonly containsFragments: boolean;

  readonly overallDurationHint: CMTime;

  readonly playable: boolean;

  readonly exportable: boolean;

  readonly readable: boolean;

  readonly composable: boolean;

  readonly compatibleWithAirPlayVideo: boolean;

  isPlayable(): boolean;

  isExportable(): boolean;

  isReadable(): boolean;

  isComposable(): boolean;

  isCompatibleWithAirPlayVideo(): boolean;

  unusedTrackID(): number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  statusOfValueForKeyError(key: string, outError: interop.PointerConvertible): interop.Enum<typeof AVKeyValueStatus>;

  loadValuesAsynchronouslyForKeysCompletionHandler(keys: NSArray<interop.Object> | Array<interop.Object>, handler: () => void | null): void;
}

export declare class AVCaptureSession extends NSObject {
  canSetSessionPreset(preset: string): boolean;

  sessionPreset: string;

  readonly inputs: NSArray;

  canAddInput(input: AVCaptureInput): boolean;

  addInput(input: AVCaptureInput): void;

  removeInput(input: AVCaptureInput): void;

  readonly outputs: NSArray;

  canAddOutput(output: AVCaptureOutput): boolean;

  addOutput(output: AVCaptureOutput): void;

  removeOutput(output: AVCaptureOutput): void;

  addInputWithNoConnections(input: AVCaptureInput): void;

  addOutputWithNoConnections(output: AVCaptureOutput): void;

  readonly connections: NSArray;

  canAddConnection(connection: AVCaptureConnection): boolean;

  addConnection(connection: AVCaptureConnection): void;

  removeConnection(connection: AVCaptureConnection): void;

  beginConfiguration(): void;

  commitConfiguration(): void;

  readonly running: boolean;

  startRunning(): void;

  stopRunning(): void;

  readonly masterClock: interop.Object;

  isRunning(): boolean;
}
