import type { NSColor, NSImage } from './AppKit'

import type { CGRect } from './CoreFoundation'

import type {
	NSArray,
	NSAttributedString,
	NSCoder,
	NSDate,
	NSError,
	NSProgress,
	NSSecureCoding,
} from './Foundation'

import type {
	PHAdjustmentData,
	PHAsset,
	PHCloudIdentifier,
	PHContentEditingInput,
	PHContentEditingOutput,
	PHLivePhoto,
	PHPhotoLibrary,
	PHProject,
} from './Photos'

import type { NSObjectProtocol } from './Runtime'

import type { CLLocationCoordinate2D } from './_LocationEssentials'

import type { interop } from './objc-runtime'

import { NSView } from './AppKit'

import { NSExtensionContext } from './Foundation'

import { MKMapType } from './MapKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const PHProjectCategoryOther: string

export declare const PHProjectCategoryPrints: string

export declare const PHProjectCategoryCard: string

export declare const PHProjectCategoryCalendar: string

export declare const PHProjectCategoryBook: string

export declare const PHProjectTypeUndefined: string

export declare const PHProjectCategorySlideshow: string

export declare const PHProjectCategoryWallDecor: string

export declare const PHProjectCategoryUndefined: string

export declare const PHProjectTextElementType: {
	Body: 0
	Title: 1
	Subtitle: 2
}

export declare const PHProjectSectionType: {
	Undefined: 0
	Cover: 1
	Content: 2
	Auxiliary: 3
}

export declare const PHLivePhotoViewPlaybackStyle: {
	Undefined: 0
	Full: 1
	Hint: 2
}

export declare const PHProjectCreationSource: {
	Undefined: 0
	UserSelection: 1
	Album: 2
	Memory: 3
	Moment: 4
	Project: 20
	ProjectBook: 21
	ProjectCalendar: 22
	ProjectCard: 23
	ProjectPrintOrder: 24
	ProjectSlideshow: 25
	ProjectExtension: 26
}

export declare const PHLivePhotoViewContentMode: {
	Fit: 0
	Fill: 1
}

export declare interface PHProjectExtensionController extends NSObjectProtocol {
	readonly supportedProjectTypes?: NSArray

	typeDescriptionDataSourceForCategoryInvalidator?(
		category: string,
		invalidator: PHProjectTypeDescriptionInvalidator,
	): PHProjectTypeDescriptionDataSource

	beginProjectWithExtensionContextProjectInfoCompletion(
		extensionContext: PHProjectExtensionContext,
		projectInfo: PHProjectInfo,
		completion: (p1: NSError) => void | null,
	): void

	resumeProjectWithExtensionContextCompletion(
		extensionContext: PHProjectExtensionContext,
		completion: (p1: NSError) => void | null,
	): void

	finishProjectWithCompletionHandler(completion: () => void): void
}

export declare class PHProjectExtensionController
	extends NativeObject
	implements PHProjectExtensionController {}

export declare interface PHProjectTypeDescriptionInvalidator extends NSObjectProtocol {
	invalidateTypeDescriptionForProjectType(projectType: string): void

	invalidateFooterTextForSubtypesOfProjectType(projectType: string): void
}

export declare class PHProjectTypeDescriptionInvalidator
	extends NativeObject
	implements PHProjectTypeDescriptionInvalidator {}

export declare interface PHLivePhotoViewDelegate extends NSObjectProtocol {
	livePhotoViewCanBeginPlaybackWithStyle?(
		livePhotoView: PHLivePhotoView,
		playbackStyle: interop.Enum<typeof PHLivePhotoViewPlaybackStyle>,
	): boolean

	livePhotoViewWillBeginPlaybackWithStyle?(
		livePhotoView: PHLivePhotoView,
		playbackStyle: interop.Enum<typeof PHLivePhotoViewPlaybackStyle>,
	): void

	livePhotoViewDidEndPlaybackWithStyle?(
		livePhotoView: PHLivePhotoView,
		playbackStyle: interop.Enum<typeof PHLivePhotoViewPlaybackStyle>,
	): void
}

export declare class PHLivePhotoViewDelegate
	extends NativeObject
	implements PHLivePhotoViewDelegate {}

export declare interface PHProjectTypeDescriptionDataSource extends NSObjectProtocol {
	subtypesForProjectType(projectType: string): NSArray

	typeDescriptionForProjectType(projectType: string): PHProjectTypeDescription

	footerTextForSubtypesOfProjectType(projectType: string): NSAttributedString

	extensionWillDiscardDataSource?(): void
}

export declare class PHProjectTypeDescriptionDataSource
	extends NativeObject
	implements PHProjectTypeDescriptionDataSource {}

export declare interface PHContentEditingController extends NSObjectProtocol {
	canHandleAdjustmentData(adjustmentData: PHAdjustmentData): boolean

	startContentEditingWithInputPlaceholderImage(
		contentEditingInput: PHContentEditingInput,
		placeholderImage: NSImage,
	): void

	finishContentEditingWithCompletionHandler(
		completionHandler: (p1: PHContentEditingOutput) => void | null,
	): void

	cancelContentEditing(): void

	readonly shouldShowCancelConfirmation: boolean
}

export declare class PHContentEditingController
	extends NativeObject
	implements PHContentEditingController {}

export declare class PHProjectMapElement extends PHProjectElement implements NSSecureCoding {
	readonly mapType: interop.Enum<typeof MKMapType>

	readonly centerCoordinate: CLLocationCoordinate2D

	readonly heading: number

	readonly pitch: number

	readonly altitude: number

	readonly annotations: NSArray

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectJournalEntryElement
	extends PHProjectElement
	implements NSSecureCoding
{
	readonly date: NSDate

	readonly assetElement: PHProjectAssetElement

	readonly textElement: PHProjectTextElement

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectTextElement extends PHProjectElement implements NSSecureCoding {
	readonly text: string

	readonly attributedText: NSAttributedString

	readonly textElementType: interop.Enum<typeof PHProjectTextElementType>

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectElement extends NSObject implements NSSecureCoding {
	readonly weight: number

	readonly placement: CGRect

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectSectionContent extends NSObject implements NSSecureCoding {
	readonly elements: NSArray

	readonly numberOfColumns: number

	readonly aspectRatio: number

	readonly cloudAssetIdentifiers: NSArray

	readonly backgroundColor: NSColor

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectInfo extends NSObject implements NSSecureCoding {
	readonly creationSource: interop.Enum<typeof PHProjectCreationSource>

	readonly projectType: string

	readonly sections: NSArray

	readonly brandingEnabled: boolean

	readonly pageNumbersEnabled: boolean

	readonly productIdentifier: string

	readonly themeIdentifier: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectTypeDescription extends NSObject implements NSSecureCoding {
	readonly projectType: string

	readonly localizedTitle: string

	readonly localizedDescription: string

	readonly localizedAttributedDescription: NSAttributedString

	readonly image: NSImage

	readonly subtypeDescriptions: NSArray

	readonly canProvideSubtypes: boolean

	initWithProjectTypeTitleDescriptionImageSubtypeDescriptions(
		projectType: string,
		localizedTitle: string,
		localizedDescription: string | null,
		image: NSImage | null,
		subtypeDescriptions: NSArray<interop.Object> | Array<interop.Object>,
	): this

	initWithProjectTypeTitleAttributedDescriptionImageSubtypeDescriptions(
		projectType: string,
		localizedTitle: string,
		localizedAttributedDescription: NSAttributedString | null,
		image: NSImage | null,
		subtypeDescriptions: NSArray<interop.Object> | Array<interop.Object>,
	): this

	initWithProjectTypeTitleDescriptionImage(
		projectType: string,
		localizedTitle: string,
		localizedDescription: string | null,
		image: NSImage | null,
	): this

	initWithProjectTypeTitleDescriptionImageCanProvideSubtypes(
		projectType: string,
		localizedTitle: string,
		localizedDescription: string | null,
		image: NSImage | null,
		canProvideSubtypes: boolean,
	): this

	initWithProjectTypeTitleAttributedDescriptionImageCanProvideSubtypes(
		projectType: string,
		localizedTitle: string,
		localizedAttributedDescription: NSAttributedString | null,
		image: NSImage | null,
		canProvideSubtypes: boolean,
	): this

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectExtensionContext extends NSExtensionContext {
	readonly photoLibrary: PHPhotoLibrary

	readonly project: PHProject

	showEditorForAsset(asset: PHAsset): void

	updatedProjectInfoFromProjectInfoCompletion(
		existingProjectInfo: PHProjectInfo | null,
		completion: (p1: PHProjectInfo) => void | null,
	): NSProgress
}

export declare class PHLivePhotoView extends NSView {
	delegate: PHLivePhotoViewDelegate

	livePhoto: PHLivePhoto

	contentMode: interop.Enum<typeof PHLivePhotoViewContentMode>

	audioVolume: number

	muted: boolean

	startPlaybackWithStyle(playbackStyle: interop.Enum<typeof PHLivePhotoViewPlaybackStyle>): void

	stopPlayback(): void

	stopPlaybackAnimated(animated: boolean): void

	readonly livePhotoBadgeView: NSView

	isMuted(): boolean
}

export declare class PHProjectRegionOfInterest extends NSObject implements NSSecureCoding {
	readonly rect: CGRect

	readonly weight: number

	readonly quality: number

	readonly identifier: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectAssetElement extends PHProjectElement implements NSSecureCoding {
	readonly cloudAssetIdentifier: PHCloudIdentifier

	readonly annotation: string

	readonly cropRect: CGRect

	readonly regionsOfInterest: NSArray

	readonly horizontallyFlipped: boolean

	readonly verticallyFlipped: boolean

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class PHProjectSection extends NSObject implements NSSecureCoding {
	readonly sectionContents: NSArray

	readonly sectionType: interop.Enum<typeof PHProjectSectionType>

	readonly title: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
