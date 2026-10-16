import type { interop } from './objc-runtime'

export declare const MAMediaCharacteristicTranscribesSpokenDialogForAccessibility: interop.Pointer

export declare const MAMediaCharacteristicDescribesMusicAndSoundForAccessibility: interop.Pointer

export declare const kMACaptionAppearanceSettingsChangedNotification: interop.Pointer

export declare const MAMediaCharacteristicDescribesVideoForAccessibility: interop.Pointer

export declare const kMAAudibleMediaSettingsChangedNotification: interop.Pointer

export declare const MACaptionAppearanceTextEdgeStyle: {
	Undefined: 0
	None: 1
	Raised: 2
	Depressed: 3
	Uniform: 4
	DropShadow: 5
}

export declare const MACaptionAppearanceFontStyle: {
	Default: 0
	MonospacedWithSerif: 1
	ProportionalWithSerif: 2
	MonospacedWithoutSerif: 3
	ProportionalWithoutSerif: 4
	Casual: 5
	Cursive: 6
	SmallCapital: 7
}

export declare const MACaptionAppearanceBehavior: {
	Value: 0
	ContentIfAvailable: 1
}

export declare const MACaptionAppearanceDisplayType: {
	ForcedOnly: 0
	Automatic: 1
	AlwaysOn: 2
}

export declare const MACaptionAppearanceDomain: {
	Default: 0
	User: 1
}

export declare function MACaptionAppearanceDidDisplayCaptions(strings: interop.Object): void

export declare function MACaptionAppearanceAddSelectedLanguage(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	language: interop.Object,
): boolean

export declare function MACaptionAppearanceCopySelectedLanguages(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
): interop.Object

export declare function MACaptionAppearanceGetDisplayType(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
): interop.Enum<typeof MACaptionAppearanceDisplayType>

export declare function MACaptionAppearanceSetDisplayType(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	displayType: interop.Enum<typeof MACaptionAppearanceDisplayType>,
): void

export declare function MACaptionAppearanceCopyPreferredCaptioningMediaCharacteristics(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
): interop.Object

export declare function MACaptionAppearanceCopyForegroundColor(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Object

export declare function MACaptionAppearanceCopyBackgroundColor(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Object

export declare function MACaptionAppearanceCopyWindowColor(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Object

export declare function MACaptionAppearanceGetForegroundOpacity(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

export declare function MACaptionAppearanceGetBackgroundOpacity(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

export declare function MACaptionAppearanceGetWindowOpacity(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

export declare function MACaptionAppearanceGetWindowRoundedCornerRadius(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

export declare function MACaptionAppearanceCopyFontDescriptorForStyle(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
	fontStyle: interop.Enum<typeof MACaptionAppearanceFontStyle>,
): interop.Object

export declare function MACaptionAppearanceGetRelativeCharacterSize(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

export declare function MACaptionAppearanceGetTextEdgeStyle(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Enum<typeof MACaptionAppearanceTextEdgeStyle>

export declare function MAAudibleMediaCopyPreferredCharacteristics(): interop.Object

export declare function MAImageCaptioningCopyCaption(
	url: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function MAImageCaptioningSetCaption(
	url: interop.Object,
	string: interop.Object,
	error: interop.PointerConvertible,
): boolean

export declare function MAImageCaptioningCopyMetadataTagPath(): interop.Object
