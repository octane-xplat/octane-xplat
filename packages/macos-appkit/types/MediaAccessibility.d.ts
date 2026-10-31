/// <reference types="@nativescript/objc-node-api" />

declare const MAMediaCharacteristicTranscribesSpokenDialogForAccessibility: interop.Pointer

declare const MAMediaCharacteristicDescribesMusicAndSoundForAccessibility: interop.Pointer

declare const kMACaptionAppearanceSettingsChangedNotification: interop.Pointer

declare const MAMediaCharacteristicDescribesVideoForAccessibility: interop.Pointer

declare const kMAAudibleMediaSettingsChangedNotification: interop.Pointer

declare const MACaptionAppearanceTextEdgeStyle: {
	Undefined: 0
	None: 1
	Raised: 2
	Depressed: 3
	Uniform: 4
	DropShadow: 5
}

declare const MACaptionAppearanceFontStyle: {
	Default: 0
	MonospacedWithSerif: 1
	ProportionalWithSerif: 2
	MonospacedWithoutSerif: 3
	ProportionalWithoutSerif: 4
	Casual: 5
	Cursive: 6
	SmallCapital: 7
}

declare const MACaptionAppearanceBehavior: {
	Value: 0
	ContentIfAvailable: 1
}

declare const MACaptionAppearanceDisplayType: {
	ForcedOnly: 0
	Automatic: 1
	AlwaysOn: 2
}

declare const MACaptionAppearanceDomain: {
	Default: 0
	User: 1
}

declare function MACaptionAppearanceDidDisplayCaptions(strings: interop.Object): void

declare function MACaptionAppearanceAddSelectedLanguage(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	language: interop.Object,
): boolean

declare function MACaptionAppearanceCopySelectedLanguages(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
): interop.Object

declare function MACaptionAppearanceGetDisplayType(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
): interop.Enum<typeof MACaptionAppearanceDisplayType>

declare function MACaptionAppearanceSetDisplayType(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	displayType: interop.Enum<typeof MACaptionAppearanceDisplayType>,
): void

declare function MACaptionAppearanceCopyPreferredCaptioningMediaCharacteristics(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
): interop.Object

declare function MACaptionAppearanceCopyForegroundColor(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Object

declare function MACaptionAppearanceCopyBackgroundColor(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Object

declare function MACaptionAppearanceCopyWindowColor(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Object

declare function MACaptionAppearanceGetForegroundOpacity(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

declare function MACaptionAppearanceGetBackgroundOpacity(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

declare function MACaptionAppearanceGetWindowOpacity(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

declare function MACaptionAppearanceGetWindowRoundedCornerRadius(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

declare function MACaptionAppearanceCopyFontDescriptorForStyle(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
	fontStyle: interop.Enum<typeof MACaptionAppearanceFontStyle>,
): interop.Object

declare function MACaptionAppearanceGetRelativeCharacterSize(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): number

declare function MACaptionAppearanceGetTextEdgeStyle(
	domain: interop.Enum<typeof MACaptionAppearanceDomain>,
	behavior: interop.PointerConvertible,
): interop.Enum<typeof MACaptionAppearanceTextEdgeStyle>

declare function MAAudibleMediaCopyPreferredCharacteristics(): interop.Object

declare function MAImageCaptioningCopyCaption(
	url: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

declare function MAImageCaptioningSetCaption(
	url: interop.Object,
	string: interop.Object,
	error: interop.PointerConvertible,
): boolean

declare function MAImageCaptioningCopyMetadataTagPath(): interop.Object
