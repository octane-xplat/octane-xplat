import type { NSImage } from './AppKit'

import type { CGRect, CGSize } from './CoreFoundation'

import type { NSArray, NSDictionary } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const MPLanguageOptionCharacteristicVoiceOverTranslation: string

export declare const MPLanguageOptionCharacteristicDescribesVideo: string

export declare const MPLanguageOptionCharacteristicEasyToRead: string

export declare const MPLanguageOptionCharacteristicTranscribesSpokenDialog: string

export declare const MPLanguageOptionCharacteristicContainsOnlyForcedSubtitles: string

export declare const MPLanguageOptionCharacteristicIsAuxiliaryContent: string

export declare const MPLanguageOptionCharacteristicIsMainProgramContent: string

export declare const MPNowPlayingInfoPropertyCurrentPlaybackDate: string

export declare const MPNowPlayingInfoPropertyExternalUserProfileIdentifier: string

export declare const MPNowPlayingInfoPropertyChapterCount: string

export declare const MPNowPlayingInfoPropertyDefaultPlaybackRate: string

export declare const MPNowPlayingInfoPropertyPlaybackRate: string

export declare const MPMediaPlaylistPropertyDescriptionText: string

export declare const MPMediaPlaylistPropertyPlaylistAttributes: string

export declare const MPMediaPlaylistPropertyCloudGlobalID: string

export declare const MPMediaItemPropertyUserGrouping: string

export declare const MPMediaItemPropertyLastPlayedDate: string

export declare const MPMediaItemPropertyHasProtectedAsset: string

export declare const MPMediaItemPropertyAssetURL: string

export declare const MPMediaItemPropertyIsCompilation: string

export declare const MPMediaItemPropertyLyrics: string

export declare const MPMediaItemPropertyDiscNumber: string

export declare const MPMediaItemPropertyAlbumTrackCount: string

export declare const MPMediaItemPropertyAlbumTrackNumber: string

export declare const MPMediaItemPropertyComposerPersistentID: string

export declare const MPMediaItemPropertyGenrePersistentID: string

export declare const MPMediaItemPropertyGenre: string

export declare const MPMediaItemPropertyAlbumArtistPersistentID: string

export declare const MPMediaItemPropertyArtistPersistentID: string

export declare const MPMediaItemPropertyArtist: string

export declare const MPMediaItemPropertyAlbumPersistentID: string

export declare const MPMediaItemPropertyAlbumTitle: string

export declare const MPMediaItemPropertyTitle: string

export declare const MPErrorDomain: string

export declare const MPMediaItemPropertyComments: string

export declare const MPNowPlayingInfoPropertyChapterNumber: string

export declare const MPNowPlayingInfoCollectionIdentifier: string

export declare const MPMediaItemPropertyPlaybackDuration: string

export declare const MPMediaPlaybackIsPreparedToPlayDidChangeNotification: string

export declare const MPMediaItemPropertyIsCloudItem: string

export declare const MPNowPlayingInfoPropertyIsLiveStream: string

export declare const MPMediaItemPropertyArtwork: string

export declare const MPNowPlayingInfoPropertyMediaType: string

export declare const MPNowPlayingInfoPropertyElapsedPlaybackTime: string

export declare const MPMediaItemPropertySkipCount: string

export declare const MPMediaPlaylistPropertySeedItems: string

export declare const MPNowPlayingInfoPropertyAssetURL: string

export declare const MPNowPlayingInfoPropertyPlaybackProgress: string

export declare const MPNowPlayingInfoPropertyExternalContentIdentifier: string

export declare const MPLanguageOptionCharacteristicLanguageTranslation: string

export declare const MPMediaPlaylistPropertyPersistentID: string

export declare const MPMediaPlaylistPropertyName: string

export declare const MPNowPlayingInfoPropertyServiceIdentifier: string

export declare const MPMediaItemPropertyComposer: string

export declare const MPMediaItemPropertyDiscCount: string

export declare const MPNowPlayingInfoPropertyPlaybackQueueCount: string

export declare const MPMediaItemPropertyAlbumArtist: string

export declare const MPLanguageOptionCharacteristicDescribesMusicAndSound: string

export declare const MPMediaItemPropertyPlayCount: string

export declare const MPMediaItemPropertyMediaType: string

export declare const MPMediaItemPropertyPlaybackStoreID: string

export declare const MPNowPlayingInfoPropertyPlaybackQueueIndex: string

export declare const MPNowPlayingInfoPropertyAvailableLanguageOptions: string

export declare const MPMediaItemPropertyReleaseDate: string

export declare const MPMediaItemPropertyBeatsPerMinute: string

export declare const MPMediaItemPropertyBookmarkTime: string

export declare const MPLanguageOptionCharacteristicDubbedTranslation: string

export declare const MPMediaEntityPropertyPersistentID: string

export declare const MPMediaItemPropertyDateAdded: string

export declare const MPMediaItemPropertyRating: string

export declare const MPMediaItemPropertyPodcastPersistentID: string

export declare const MPNowPlayingInfoPropertyCurrentLanguageOptions: string

export declare const MPMediaItemPropertyIsExplicit: string

export declare const MPMediaItemPropertyPodcastTitle: string

export declare const MPMediaItemPropertyPersistentID: string

export declare const MPMediaPlaylistPropertyAuthorDisplayName: string

export declare const MPMediaType: {
	Music: 1
	Podcast: 2
	AudioBook: 4
	AudioITunesU: 8
	AnyAudio: 255
	Movie: 256
	TVShow: 512
	VideoPodcast: 1024
	MusicVideo: 2048
	VideoITunesU: 4096
	HomeVideo: 8192
	AnyVideo: 65280
	Any: -1
}

export declare const MPRemoteCommandHandlerStatus: {
	Success: 0
	NoSuchContent: 100
	NoActionableNowPlayingItem: 110
	DeviceNotFound: 120
	CommandFailed: 200
}

export declare const MPShuffleType: {
	Off: 0
	Items: 1
	Collections: 2
}

export declare const MPNowPlayingInfoMediaType: {
	None: 0
	Audio: 1
	Video: 2
}

export declare const MPChangeLanguageOptionSetting: {
	None: 0
	NowPlayingItemOnly: 1
	Permanent: 2
}

export declare const MPErrorCode: {
	Unknown: 0
	PermissionDenied: 1
	CloudServiceCapabilityMissing: 2
	NetworkConnectionFailed: 3
	NotFound: 4
	NotSupported: 5
	Cancelled: 6
	RequestTimedOut: 7
}

export declare const MPSeekCommandEventType: {
	Begin: 0
	End: 1
}

export declare const MPRepeatType: {
	Off: 0
	One: 1
	All: 2
}

export declare const MPNowPlayingInfoLanguageOptionType: {
	Audible: 0
	Legible: 1
}

export declare const MPNowPlayingPlaybackState: {
	Unknown: 0
	Playing: 1
	Paused: 2
	Stopped: 3
	Interrupted: 4
}

export declare interface MPSystemMusicPlayerController extends NSObjectProtocol {}

export declare class MPSystemMusicPlayerController
	extends NativeObject
	implements MPSystemMusicPlayerController {}

export declare class MPChangeRepeatModeCommandEvent extends MPRemoteCommandEvent {
	readonly repeatType: interop.Enum<typeof MPRepeatType>

	readonly preservesRepeatMode: boolean
}

export declare class MPChangeShuffleModeCommandEvent extends MPRemoteCommandEvent {
	readonly shuffleType: interop.Enum<typeof MPShuffleType>

	readonly preservesShuffleMode: boolean
}

export declare class MPChangePlaybackPositionCommandEvent extends MPRemoteCommandEvent {
	readonly positionTime: number
}

export declare class MPChangeLanguageOptionCommandEvent extends MPRemoteCommandEvent {
	readonly languageOption: MPNowPlayingInfoLanguageOption

	readonly setting: interop.Enum<typeof MPChangeLanguageOptionSetting>
}

export declare class MPChangePlaybackRateCommandEvent extends MPRemoteCommandEvent {
	readonly playbackRate: number
}

export declare class MPSeekCommandEvent extends MPRemoteCommandEvent {
	readonly type: interop.Enum<typeof MPSeekCommandEventType>
}

export declare class MPRemoteCommandEvent extends NSObject {
	readonly command: MPRemoteCommand

	readonly timestamp: number
}

export declare class MPChangeRepeatModeCommand extends MPRemoteCommand {
	currentRepeatType: interop.Enum<typeof MPRepeatType>
}

export declare class MPChangePlaybackPositionCommand extends MPRemoteCommand {}

export declare class MPRatingCommand extends MPRemoteCommand {
	minimumRating: number

	maximumRating: number
}

export declare class MPSkipIntervalCommand extends MPRemoteCommand {
	get preferredIntervals(): NSArray
	set preferredIntervals(value: NSArray<interop.Object> | Array<interop.Object>)
}

export declare class MPRemoteCommand extends NSObject {
	enabled: boolean

	addTargetAction(target: interop.Object, action: string): void

	removeTargetAction(target: interop.Object, action: string | null): void

	removeTarget(target: interop.Object | null): void

	addTargetWithHandler(
		handler: (p1: MPRemoteCommandEvent) => interop.Enum<typeof MPRemoteCommandHandlerStatus>,
	): interop.Object

	isEnabled(): boolean
}

export declare class MPNowPlayingInfoLanguageOptionGroup extends NSObject {
	initWithLanguageOptionsDefaultLanguageOptionAllowEmptySelection(
		languageOptions: NSArray<interop.Object> | Array<interop.Object>,
		defaultLanguageOption: MPNowPlayingInfoLanguageOption | null,
		allowEmptySelection: boolean,
	): this

	readonly languageOptions: NSArray

	readonly defaultLanguageOption: MPNowPlayingInfoLanguageOption

	readonly allowEmptySelection: boolean
}

export declare class MPNowPlayingInfoLanguageOption extends NSObject {
	initWithTypeLanguageTagCharacteristicsDisplayNameIdentifier(
		languageOptionType: interop.Enum<typeof MPNowPlayingInfoLanguageOptionType>,
		languageTag: string,
		languageOptionCharacteristics: NSArray<interop.Object> | Array<interop.Object> | null,
		displayName: string,
		identifier: string,
	): this

	isAutomaticLegibleLanguageOption(): boolean

	isAutomaticAudibleLanguageOption(): boolean

	readonly languageOptionType: interop.Enum<typeof MPNowPlayingInfoLanguageOptionType>

	readonly languageTag: string

	readonly languageOptionCharacteristics: NSArray

	readonly displayName: string

	readonly identifier: string
}

export declare class MPContentItem extends NSObject {
	initWithIdentifier(identifier: string): this

	readonly identifier: string

	title: string

	subtitle: string

	artwork: MPMediaItemArtwork

	playbackProgress: number

	streamingContent: boolean

	explicitContent: boolean

	container: boolean

	playable: boolean

	isStreamingContent(): boolean

	isExplicitContent(): boolean

	isContainer(): boolean

	isPlayable(): boolean
}

export declare class MPChangeShuffleModeCommand extends MPRemoteCommand {
	currentShuffleType: interop.Enum<typeof MPShuffleType>
}

export declare class MPRatingCommandEvent extends MPRemoteCommandEvent {
	readonly rating: number
}

export declare class MPMediaItemArtwork extends NSObject {
	initWithBoundsSizeRequestHandler(
		boundsSize: CGSize,
		requestHandler: (p1: CGSize) => NSImage,
	): this

	imageWithSize(size: CGSize): NSImage

	readonly bounds: CGRect

	readonly imageCropRect: CGRect
}

export declare class MPFeedbackCommand extends MPRemoteCommand {
	active: boolean

	localizedTitle: string

	localizedShortTitle: string

	isActive(): boolean
}

export declare class MPNowPlayingInfoCenter extends NSObject {
	static defaultCenter(): MPNowPlayingInfoCenter

	get nowPlayingInfo(): NSDictionary
	set nowPlayingInfo(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	playbackState: interop.Enum<typeof MPNowPlayingPlaybackState>
}

export declare class MPRemoteCommandCenter extends NSObject {
	readonly pauseCommand: MPRemoteCommand

	readonly playCommand: MPRemoteCommand

	readonly stopCommand: MPRemoteCommand

	readonly togglePlayPauseCommand: MPRemoteCommand

	readonly enableLanguageOptionCommand: MPRemoteCommand

	readonly disableLanguageOptionCommand: MPRemoteCommand

	readonly changePlaybackRateCommand: MPChangePlaybackRateCommand

	readonly changeRepeatModeCommand: MPChangeRepeatModeCommand

	readonly changeShuffleModeCommand: MPChangeShuffleModeCommand

	readonly nextTrackCommand: MPRemoteCommand

	readonly previousTrackCommand: MPRemoteCommand

	readonly skipForwardCommand: MPSkipIntervalCommand

	readonly skipBackwardCommand: MPSkipIntervalCommand

	readonly seekForwardCommand: MPRemoteCommand

	readonly seekBackwardCommand: MPRemoteCommand

	readonly changePlaybackPositionCommand: MPChangePlaybackPositionCommand

	readonly ratingCommand: MPRatingCommand

	readonly likeCommand: MPFeedbackCommand

	readonly dislikeCommand: MPFeedbackCommand

	readonly bookmarkCommand: MPFeedbackCommand

	static sharedCommandCenter(): MPRemoteCommandCenter
}

export declare class MPSkipIntervalCommandEvent extends MPRemoteCommandEvent {
	readonly interval: number
}

export declare class MPChangePlaybackRateCommand extends MPRemoteCommand {
	get supportedPlaybackRates(): NSArray
	set supportedPlaybackRates(value: NSArray<interop.Object> | Array<interop.Object>)
}

export declare class MPFeedbackCommandEvent extends MPRemoteCommandEvent {
	readonly negative: boolean

	isNegative(): boolean
}
