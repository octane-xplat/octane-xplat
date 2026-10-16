import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSDictionary,
	NSNumber,
	NSSecureCoding,
	NSSet,
	NSURL,
} from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const UTTypeQuickTimeMovie: UTType

export declare const UTTypeX509Certificate: UTType

export declare const UTTypeToDoItem: UTType

export declare const UTTypeMessage: UTType

export declare const UTTypeSpreadsheet: UTType

export declare const UTTypeGZIP: UTType

export declare const UTTypeSystemPreferencesPane: UTType

export declare const UTTypeUnixExecutable: UTType

export declare const UTTypeApplicationBundle: UTType

export declare const UTTypeApplication: UTType

export declare const UTTypeXPCService: UTType

export declare const UTTypePluginBundle: UTType

export declare const UTTypeBundle: UTType

export declare const UTTypeVolume: UTType

export declare const UTTypeMIDI: UTType

export declare const UTTypeAppleProtectedMPEG4Video: UTType

export declare const UTTypeMP3: UTType

export declare const UTTypeMPEG2TransportStream: UTType

export declare const UTTypeMPEG2Video: UTType

export declare const UTTypeMPEG: UTType

export declare const UTTypeVideo: UTType

export declare const UTTypeRealityFile: UTType

export declare const UTTypeWebP: UTType

export declare const UTTypeHEIF: UTType

export declare const UTTypeLivePhoto: UTType

export declare const UTTypeSVG: UTType

export declare const UTTypeRAWImage: UTType

export declare const UTTypeGIF: UTType

export declare const UTTypeJPEG: UTType

export declare const UTTypeWebArchive: UTType

export declare const UTTypePDF: UTType

export declare const UTTypePropertyList: UTType

export declare const UTTypeAppleScript: UTType

export declare const UTTypeAssemblyLanguageSource: UTType

export declare const UTTypeSourceCode: UTType

export declare const UTTypeHTML: UTType

export declare const UTTypeUTF8TabSeparatedText: UTType

export declare const UTTypeUTF16PlainText: UTType

export declare const UTTypeText: UTType

export declare const UTTypeURL: UTType

export declare const UTTypeExecutable: UTType

export declare const UTTypeDirectory: UTType

export declare const UTTypeItem: UTType

export declare const UTTagClassMIMEType: string

export declare const UTTypeJSON: UTType

export declare const UTTypeAppleArchive: UTType

export declare const UTTypeDelimitedText: UTType

export declare const UTTypeWAV: UTType

export declare const UTTypeInternetShortcut: UTType

export declare const UTTypeLog: UTType

export declare const UTTypeFolder: UTType

export declare const UTTypeBMP: UTType

export declare const UTTypeBookmark: UTType

export declare const UTTypeCalendarEvent: UTType

export declare const UTTypePythonScript: UTType

export declare const UTTypeRTF: UTType

export declare const UTTypeAVI: UTType

export declare const UTTypeEXE: UTType

export declare const UTTypeCommaSeparatedText: UTType

export declare const UTTypeRubyScript: UTType

export declare const UTTypeURLBookmarkData: UTType

export declare const UTTypeApplicationExtension: UTType

export declare const UTTypePerlScript: UTType

export declare const UTTypeEPUB: UTType

export declare const UTTypeSymbolicLink: UTType

export declare const UTTypeContent: UTType

export declare const UTTypeArchive: UTType

export declare const UTTypeAIFF: UTType

export declare const UTTypeUSD: UTType

export declare const UTTagClassFilenameExtension: string

export declare const UTTypeVCard: UTType

export declare const UTTypePlainText: UTType

export declare const UTTypeQuickLookGenerator: UTType

export declare const UTTypeBinaryPropertyList: UTType

export declare const UTTypeScript: UTType

export declare const UTTypeHEIC: UTType

export declare const UTTypeCHeader: UTType

export declare const UTTypePlaylist: UTType

export declare const UTTypeTIFF: UTType

export declare const UTTypeCSource: UTType

export declare const UTTypeAliasFile: UTType

export declare const UTTypeData: UTType

export declare const UTTypeICNS: UTType

export declare const UTTypeZIP: UTType

export declare const UTTypeJavaScript: UTType

export declare const UTTypeInternetLocation: UTType

export declare const UTTypeUSDZ: UTType

export declare const UTTypeYAML: UTType

export declare const UTTypePNG: UTType

export declare const UTTypeMPEG4Audio: UTType

export declare const UTTypeResolvable: UTType

export declare const UTTypeICO: UTType

export declare const UTTypeCompositeContent: UTType

export declare const UTTypePHPScript: UTType

export declare const UTTypeImage: UTType

export declare const UTTypeDiskImage: UTType

export declare const UTTypeMPEG4Movie: UTType

export declare const UTTypeSpotlightImporter: UTType

export declare const UTTypeContact: UTType

export declare const UTTypePKCS12: UTType

export declare const UTTypeAppleProtectedMPEG4Audio: UTType

export declare const UTTypeXMLPropertyList: UTType

export declare const UTTypeXML: UTType

export declare const UTTypeCPlusPlusHeader: UTType

export declare const UTTypeDatabase: UTType

export declare const UTTypeFileURL: UTType

export declare const UTTypeEmailMessage: UTType

export declare const UTTypeBZ2: UTType

export declare const UTTypeOSAScript: UTType

export declare const UTTypeRTFD: UTType

export declare const UTTypeShellScript: UTType

export declare const UTTypeMovie: UTType

export declare const UTTypeARReferenceObject: UTType

export declare const UTTypeFramework: UTType

export declare const UTTypeObjectiveCSource: UTType

export declare const UTTypeAudio: UTType

export declare const UTTypeSwiftSource: UTType

export declare const UTTypePresentation: UTType

export declare const UTTypeTabSeparatedText: UTType

export declare const UTTypePackage: UTType

export declare const UTTypeMountPoint: UTType

export declare const UTTypeObjectiveCPlusPlusSource: UTType

export declare const UTTypeFont: UTType

export declare const UTTypeSceneKitScene: UTType

export declare const UTType3DContent: UTType

export declare const UTTypeUTF16ExternalPlainText: UTType

export declare const UTTypeAudiovisualContent: UTType

export declare const UTTypeCPlusPlusSource: UTType

export declare const UTTypeOSAScriptBundle: UTType

export declare const UTTypeUTF8PlainText: UTType

export declare const UTTypeFlatRTFD: UTType

export declare const UTTypeM3UPlaylist: UTType

export declare class UTType extends NSObject implements NSCopying, NSSecureCoding {
	static typeWithIdentifier<This extends abstract new (...args: any) => any>(
		this: This,
		identifier: string,
	): InstanceType<This>

	static typeWithFilenameExtension<This extends abstract new (...args: any) => any>(
		this: This,
		filenameExtension: string,
	): InstanceType<This>

	static typeWithFilenameExtensionConformingToType<This extends abstract new (...args: any) => any>(
		this: This,
		filenameExtension: string,
		supertype: UTType,
	): InstanceType<This>

	static typeWithMIMEType<This extends abstract new (...args: any) => any>(
		this: This,
		mimeType: string,
	): InstanceType<This>

	static typeWithMIMETypeConformingToType<This extends abstract new (...args: any) => any>(
		this: This,
		mimeType: string,
		supertype: UTType,
	): InstanceType<This>

	readonly identifier: string

	readonly preferredFilenameExtension: string

	readonly preferredMIMEType: string

	readonly localizedDescription: string

	readonly version: NSNumber

	readonly referenceURL: NSURL

	readonly dynamic: boolean

	readonly declared: boolean

	readonly publicType: boolean

	isDynamic(): boolean

	isDeclared(): boolean

	isPublicType(): boolean

	conformsToType(type: UTType): boolean

	isSupertypeOfType(type: UTType): boolean

	isSubtypeOfType(type: UTType): boolean

	readonly supertypes: NSSet

	static typeWithTagTagClassConformingToType<This extends abstract new (...args: any) => any>(
		this: This,
		tag: string,
		tagClass: string,
		supertype: UTType | null,
	): InstanceType<This>

	static typesWithTagTagClassConformingToType(
		tag: string,
		tagClass: string,
		supertype: UTType | null,
	): NSArray

	readonly tags: NSDictionary

	static exportedTypeWithIdentifier(identifier: string): UTType

	static exportedTypeWithIdentifierConformingToType(identifier: string, parentType: UTType): UTType

	static importedTypeWithIdentifier(identifier: string): UTType

	static importedTypeWithIdentifierConformingToType(identifier: string, parentType: UTType): UTType

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
