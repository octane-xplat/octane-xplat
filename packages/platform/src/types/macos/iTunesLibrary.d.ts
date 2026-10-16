import type { NSImage } from './AppKit'

import type { NSArray, NSData, NSDate, NSNumber, NSSet, NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const ITLibPlaylistPropertyMaster: string

export declare const ITLibPlaylistPropertyKind: string

export declare const ITLibPlaylistPropertyVisible: string

export declare const ITLibPlaylistPropertyDistinguisedKind: string

export declare const ITLibPlaylistPropertyAllItemsPlaylist: string

export declare const ITLibPlaylistPropertyName: string

export declare const ITLibMediaItemPropertyYear: string

export declare const ITLibMediaItemPropertyVoiceOverLanguage: string

export declare const ITLibMediaItemPropertyTrackNumber: string

export declare const ITLibMediaItemPropertySkipDate: string

export declare const ITLibMediaItemPropertyFileSize: string

export declare const ITLibMediaItemPropertySampleRate: string

export declare const ITLibMediaItemPropertyRatingComputed: string

export declare const ITLibMediaItemPropertyMovementCount: string

export declare const ITLibMediaItemPropertyIsPurchased: string

export declare const ITLibMediaItemPropertyPlayCount: string

export declare const ITLibMediaItemPropertySortTitle: string

export declare const ITLibMediaItemPropertyTitle: string

export declare const ITLibMediaItemPropertyDescription: string

export declare const ITLibMediaItemPropertyContentRating: string

export declare const ITLibMediaItemPropertyComposer: string

export declare const ITLibMediaItemPropertyCategory: string

export declare const ITLibMediaItemPropertyBitRate: string

export declare const ITLibMediaItemPropertyVideoEpisodeOrder: string

export declare const ITLibMediaItemPropertyVideoEpisode: string

export declare const ITLibMediaItemPropertyVideoSeason: string

export declare const ITLibMediaItemPropertyAlbumTrackCount: string

export declare const ITLibMediaItemPropertyAlbumDiscNumber: string

export declare const ITLibMediaItemPropertyAlbumDiscCount: string

export declare const ITLibMediaItemPropertyAlbumRatingComputed: string

export declare const ITLibMediaItemPropertyAlbumArtist: string

export declare const ITLibMediaItemPropertySortAlbumTitle: string

export declare const ITLibMediaItemPropertyAlbumTitle: string

export declare const ITLibMediaEntityPropertyPersistentID: string

export declare const ITLibMediaItemPropertyVolumeAdjustment: string

export declare const ITLibMediaItemPropertyMediaKind: string

export declare const ITLibMediaItemPropertyAlbumIsGapless: string

export declare const ITLibMediaItemPropertyPlayStatus: string

export declare const ITLibPlaylistPropertyParentPersistentID: string

export declare const ITLibMediaItemPropertyTotalTime: string

export declare const ITLibMediaItemPropertyLastPlayDate: string

export declare const ITLibMediaItemPropertyGenre: string

export declare const ITLibMediaItemPropertyVideoWidth: string

export declare const ITLibMediaItemPropertyHasArtwork: string

export declare const ITLibMediaItemPropertyIsUserDisabled: string

export declare const ITLibMediaItemPropertyMovementName: string

export declare const ITLibMediaItemPropertyArtwork: string

export declare const ITLibMediaItemPropertyFileType: string

export declare const ITLibMediaItemPropertyArtistName: string

export declare const ITLibMediaItemPropertyVolumeNormalizationEnergy: string

export declare const ITLibMediaItemPropertySortComposer: string

export declare const ITLibMediaItemPropertyVideoIsHD: string

export declare const ITLibMediaItemPropertySortAlbumArtist: string

export declare const ITLibMediaItemPropertyIsVideo: string

export declare const ITLibMediaItemPropertyMovementNumber: string

export declare const ITLibMediaItemPropertyRating: string

export declare const ITLibMediaItemPropertyReleaseDate: string

export declare const ITLibMediaItemPropertyLyricsContentRating: string

export declare const ITLibMediaItemPropertyVideoSeries: string

export declare const ITLibMediaItemPropertyStartTime: string

export declare const ITLibMediaItemPropertySortArtistName: string

export declare const ITLibMediaItemPropertyWork: string

export declare const ITLibMediaItemPropertyLocationType: string

export declare const ITLibMediaItemPropertyKind: string

export declare const ITLibMediaItemPropertyVideoHeight: string

export declare const ITLibMediaItemPropertyBeatsPerMinute: string

export declare const ITLibMediaItemPropertyAddedDate: string

export declare const ITLibMediaItemPropertyVideoSortSeries: string

export declare const ITLibMediaItemPropertyStopTime: string

export declare const ITLibMediaItemPropertyComments: string

export declare const ITLibMediaItemPropertyAlbumIsCompilation: string

export declare const ITLibMediaItemPropertyLocation: string

export declare const ITLibPlaylistPropertyItems: string

export declare const ITLibMediaItemPropertyAlbumRating: string

export declare const ITLibMediaItemPropertyGrouping: string

export declare const ITLibMediaItemPropertySize: string

export declare const ITLibMediaItemPropertyIsDRMProtected: string

export declare const ITLibMediaItemPropertyModifiedDate: string

export declare const ITLibMediaItemPropertyUserSkipCount: string

export declare const ITLibInitOptions: {
	None: 0
	LazyLoadData: 1
}

export declare const ITLibExportFeature: {
	ITLibExportFeatureNone: 0
}

export declare const ITLibMediaItemPlayStatus: {
	None: 0
	PartiallyPlayed: 1
	Unplayed: 2
}

export declare const ITLibMediaItemLocationType: {
	Unknown: 0
	File: 1
	URL: 2
	Remote: 3
}

export declare const ITLibMediaItemLyricsContentRating: {
	None: 0
	Explicit: 1
	Clean: 2
}

export declare const ITLibPlaylistKind: {
	Regular: 0
	Smart: 1
	Genius: 2
	Folder: 3
	GeniusMix: 4
}

export declare const ITLibDistinguishedPlaylistKind: {
	KindNone: 0
	KindMovies: 1
	KindTVShows: 2
	KindMusic: 3
	KindAudiobooks: 4
	KindBooks: 4
	KindRingtones: 5
	KindPodcasts: 7
	KindVoiceMemos: 14
	KindPurchases: 16
	KindiTunesU: 26
	Kind90sMusic: 42
	KindMyTopRated: 43
	KindTop25MostPlayed: 44
	KindRecentlyPlayed: 45
	KindRecentlyAdded: 46
	KindMusicVideos: 47
	KindClassicalMusic: 48
	KindLibraryMusicVideos: 49
	KindHomeVideos: 50
	KindApplications: 51
	KindLovedSongs: 52
	KindMusicShowsAndMovies: 53
}

export declare const ITLibArtworkFormat: {
	None: 0
	Bitmap: 1
	JPEG: 2
	JPEG2000: 3
	GIF: 4
	PNG: 5
	BMP: 6
	TIFF: 7
	PICT: 8
}

export declare const ITLibMediaItemMediaKind: {
	KindUnknown: 1
	KindSong: 2
	KindMovie: 3
	KindPodcast: 4
	KindAudiobook: 5
	KindPDFBooklet: 6
	KindMusicVideo: 7
	KindTVShow: 8
	KindInteractiveBooklet: 9
	KindHomeVideo: 12
	KindRingtone: 14
	KindDigitalBooklet: 15
	KindIOSApplication: 16
	KindVoiceMemo: 17
	KindiTunesU: 18
	KindBook: 19
	KindPDFBook: 20
	KindAlertTone: 21
}

export declare class ITLibrary extends NSObject {
	readonly applicationVersion: string

	readonly features: interop.Enum<typeof ITLibExportFeature>

	readonly apiMajorVersion: number

	readonly apiMinorVersion: number

	readonly mediaFolderLocation: NSURL

	readonly musicFolderLocation: NSURL

	readonly showContentRating: boolean

	readonly allMediaItems: NSArray

	readonly allPlaylists: NSArray

	static libraryWithAPIVersionError<This extends abstract new (...args: any) => any>(
		this: This,
		requestedAPIVersion: string,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static libraryWithAPIVersionOptionsError<This extends abstract new (...args: any) => any>(
		this: This,
		requestedAPIVersion: string,
		options: interop.Enum<typeof ITLibInitOptions>,
		error: interop.PointerConvertible,
	): InstanceType<This>

	initWithAPIVersionError(requestedAPIVersion: string, error: interop.PointerConvertible): this

	initWithAPIVersionOptionsError(
		requestedAPIVersion: string,
		options: interop.Enum<typeof ITLibInitOptions>,
		error: interop.PointerConvertible,
	): this

	artworkForMediaFile(mediaFileURL: NSURL): ITLibArtwork

	reloadData(): boolean

	unloadData(): void

	shouldShowContentRating(): boolean
}

export declare class ITLibMediaItemVideoInfo extends NSObject {
	readonly series: string

	readonly sortSeries: string

	readonly season: number

	readonly episode: string

	readonly episodeOrder: number

	readonly hd: boolean

	readonly videoWidth: number

	readonly videoHeight: number

	isHD(): boolean
}

export declare class ITLibMediaItem extends ITLibMediaEntity {
	readonly title: string

	readonly sortTitle: string

	readonly artist: ITLibArtist

	readonly composer: string

	readonly sortComposer: string

	readonly rating: number

	readonly ratingComputed: boolean

	readonly startTime: number

	readonly stopTime: number

	readonly album: ITLibAlbum

	readonly genre: string

	readonly kind: string

	readonly mediaKind: interop.Enum<typeof ITLibMediaItemMediaKind>

	readonly fileSize: number

	readonly size: number

	readonly totalTime: number

	readonly trackNumber: number

	readonly category: string

	readonly description: string

	readonly lyricsContentRating: interop.Enum<typeof ITLibMediaItemLyricsContentRating>

	readonly contentRating: string

	readonly modifiedDate: NSDate

	readonly addedDate: NSDate

	readonly bitrate: number

	readonly sampleRate: number

	readonly beatsPerMinute: number

	readonly playCount: number

	readonly lastPlayedDate: NSDate

	readonly playStatus: interop.Enum<typeof ITLibMediaItemPlayStatus>

	readonly location: NSURL

	readonly artworkAvailable: boolean

	readonly artwork: ITLibArtwork

	readonly comments: string

	readonly purchased: boolean

	readonly cloud: boolean

	readonly drmProtected: boolean

	readonly video: boolean

	readonly videoInfo: ITLibMediaItemVideoInfo

	readonly releaseDate: NSDate

	readonly year: number

	readonly fileType: number

	readonly skipCount: number

	readonly skipDate: NSDate

	readonly voiceOverLanguage: string

	readonly volumeAdjustment: number

	readonly volumeNormalizationEnergy: number

	readonly userDisabled: boolean

	readonly grouping: string

	readonly locationType: interop.Enum<typeof ITLibMediaItemLocationType>

	isRatingComputed(): boolean

	hasArtworkAvailable(): boolean

	isPurchased(): boolean

	isCloud(): boolean

	isDRMProtected(): boolean

	isVideo(): boolean

	isUserDisabled(): boolean
}

export declare class ITLibPlaylist extends ITLibMediaEntity {
	readonly name: string

	readonly parentID: NSNumber

	readonly visible: boolean

	readonly allItemsPlaylist: boolean

	readonly items: NSArray

	readonly distinguishedKind: interop.Enum<typeof ITLibDistinguishedPlaylistKind>

	readonly kind: interop.Enum<typeof ITLibPlaylistKind>

	readonly master: boolean

	isVisible(): boolean

	isAllItemsPlaylist(): boolean

	isMaster(): boolean
}

export declare class ITLibArtist extends NSObject {
	readonly name: string

	readonly sortName: string

	readonly persistentID: NSNumber
}

export declare class ITLibMediaEntity extends NSObject {
	readonly persistentID: NSNumber

	valueForProperty(property: string): interop.Object

	enumerateValuesForPropertiesUsingBlock(
		properties: NSSet | null,
		block: (p1: string, p2: interop.Object, p3: interop.PointerConvertible) => void,
	): void

	enumerateValuesExceptForPropertiesUsingBlock(
		properties: NSSet | null,
		block: (p1: string, p2: interop.Object, p3: interop.PointerConvertible) => void,
	): void
}

export declare class ITLibAlbum extends NSObject {
	readonly title: string

	readonly sortTitle: string

	readonly compilation: boolean

	readonly artist: ITLibArtist

	readonly discCount: number

	readonly discNumber: number

	readonly rating: number

	readonly ratingComputed: boolean

	readonly gapless: boolean

	readonly trackCount: number

	readonly albumArtist: string

	readonly sortAlbumArtist: string

	readonly persistentID: NSNumber

	isCompilation(): boolean

	isRatingComputed(): boolean

	isGapless(): boolean
}

export declare class ITLibArtwork extends NSObject {
	readonly image: NSImage

	readonly imageData: NSData

	readonly imageDataFormat: interop.Enum<typeof ITLibArtworkFormat>
}
