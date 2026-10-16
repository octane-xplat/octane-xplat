import type { CGAffineTransform, CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { MTLDevice } from './Metal'

import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'

import { CGRectEdge } from './CoreFoundation'

export declare const kCGPDFContextOutputIntents: interop.Pointer

export declare const kCGColorSpaceDCIP3: interop.Pointer

export declare const kCGFontVariationAxisMinValue: interop.Pointer

export declare const kCGColorSpaceExtendedSRGB: interop.Pointer

export declare const kCGWindowLayer: interop.Pointer

export declare const kCGPDFContextEncryptionKeyLength: interop.Pointer

export declare const kCGColorSpaceITUR_709: interop.Pointer

export declare const kCGWindowBackingLocationVideoMemory: interop.Pointer

export declare const kCGWindowMemoryUsage: interop.Pointer

export declare const kCGColorSpaceExtendedRange: interop.Pointer

export declare const kCGDisplayStreamMinimumFrameTime: interop.Pointer

export declare const kCGPDFTagPropertyTitleText: interop.Pointer

export declare const kCGDisplayStreamYCbCrMatrix_SMPTE_240M_1995: interop.Pointer

export declare const kCGDisplayStreamYCbCrMatrix_ITU_R_601_4: interop.Pointer

export declare const kCGDisplayStreamYCbCrMatrix: interop.Pointer

export declare const kCGDisplayStreamColorSpace: interop.Pointer

export declare const kCGDisplayStreamPreserveAspectRatio: interop.Pointer

export declare const kCGDisplayStreamDestinationRect: interop.Pointer

export declare const kCGDisplayStreamSourceRect: interop.Pointer

export declare const kCGWindowIsOnscreen: interop.Pointer

export declare const kCGWindowOwnerPID: interop.Pointer

export declare const kCGWindowAlpha: interop.Pointer

export declare const kCGWindowSharingState: interop.Pointer

export declare const kCGWindowStoreType: interop.Pointer

export declare const kCGWindowNumber: interop.Pointer

export declare const kCGPDFTagPropertyAlternativeText: interop.Pointer

export declare const kCGPDFTagPropertyActualText: interop.Pointer

export declare const kCGPDFContextCreatePDFA: interop.Pointer

export declare const kCGPDFContextCreateLinearizedPDF: interop.Pointer

export declare const kCGPDFContextAccessPermissions: interop.Pointer

export declare const kCGPDFXRegistryName: interop.Pointer

export declare const kCGPDFXOutputConditionIdentifier: interop.Pointer

export declare const kCGPDFXOutputIntentSubtype: interop.Pointer

export declare const kCGPDFContextOutputIntent: interop.Pointer

export declare const kCGPDFContextAllowsPrinting: interop.Pointer

export declare const kCGPDFContextOwnerPassword: interop.Pointer

export declare const kCGPDFContextCreator: interop.Pointer

export declare const kCGPDFContextKeywords: interop.Pointer

export declare const kCGPDFContextSubject: interop.Pointer

export declare const kCGPDFContextAuthor: interop.Pointer

export declare const kCGPDFContextArtBox: interop.Pointer

export declare const kCGPDFContextTrimBox: interop.Pointer

export declare const kCGPDFContextBleedBox: interop.Pointer

export declare const kCGPDFContextCropBox: interop.Pointer

export declare const kCGColorConversionTRCSize: interop.Pointer

export declare const kCGColorConversionBlackPointCompensation: interop.Pointer

export declare const kCGColorSpaceAdobeRGB1998: interop.Pointer

export declare const CGSizeZero: CGSize

export declare const kCGWindowName: interop.Pointer

export declare const kCGPDFOutlineTitle: interop.Pointer

export declare const kCGColorSpaceDisplayP3_HLG: interop.Pointer

export declare const kCGPDFContextMediaBox: interop.Pointer

export declare const kCGPDFOutlineDestinationRect: interop.Pointer

export declare const kCGPDFOutlineChildren: interop.Pointer

export declare const kCGBitmapByteOrder32Host: interop.Enum<typeof CGBitmapInfo>

export declare const kCGBitmapByteOrder16Host: interop.Enum<typeof CGBitmapInfo>

export declare const kCGFontVariationAxisMaxValue: interop.Pointer

export declare const kCGFontVariationAxisName: interop.Pointer

export declare const kCGGlyphMax: number

export declare const kCGFontIndexInvalid: number

export declare const kCGFontIndexMax: number

export declare const kCGColorClear: interop.Pointer

export declare const kCGColorBlack: interop.Pointer

export declare const kCGColorSpaceExtendedLinearGray: interop.Pointer

export declare const kCGColorSpaceLinearGray: interop.Pointer

export declare const kCGColorSpaceExtendedGray: interop.Pointer

export declare const kCGColorSpaceLinearSRGB: interop.Pointer

export declare const kCGColorSpaceITUR_2020_PQ_EOTF: interop.Pointer

export declare const kCGColorSpaceDisplayP3_PQ_EOTF: interop.Pointer

export declare const kCGColorSpaceITUR_2020_HLG: interop.Pointer

export declare const kCGColorSpaceITUR_2020_PQ: interop.Pointer

export declare const kCGColorSpaceITUR_2100_PQ: interop.Pointer

export declare const kCGColorSpaceExtendedLinearDisplayP3: interop.Pointer

export declare const kCGColorSpaceExtendedDisplayP3: interop.Pointer

export declare const kCGColorSpaceROMMRGB: interop.Pointer

export declare const kCGColorSpaceACESCGLinear: interop.Pointer

export declare const kCGColorSpaceGenericLab: interop.Pointer

export declare const kCGColorSpaceGenericXYZ: interop.Pointer

export declare const kCGColorSpaceSRGB: interop.Pointer

export declare const kCGColorSpaceGenericCMYK: interop.Pointer

export declare const kCGColorSpaceGenericRGB: interop.Pointer

export declare const CGAffineTransformIdentity: CGAffineTransform

export declare const kCGPDFXInfo: interop.Pointer

export declare const kCGAdaptiveMaximumBitDepth: interop.Pointer

export declare const kCGPDFOutlineDestination: interop.Pointer

export declare const kCGDisplayStreamShowCursor: interop.Pointer

export declare const kCGColorSpaceDisplayP3: interop.Pointer

export declare const kCGPDFContextTitle: interop.Pointer

export declare const kCGWindowWorkspace: interop.Pointer

export declare const kCGDisplayShowDuplicateLowResolutionModes: interop.Pointer

export declare const kCGColorSpaceGenericGrayGamma2_2: interop.Pointer

export declare const kCGWindowOwnerName: interop.Pointer

export declare const kCGPDFTagPropertyLanguageText: interop.Pointer

export declare const kCGPDFXOutputCondition: interop.Pointer

export declare const kCGColorSpaceExtendedLinearSRGB: interop.Pointer

export declare const kCGColorSpaceGenericGray: interop.Pointer

export declare const kCGPDFXDestinationOutputProfile: interop.Pointer

export declare const kCGColorWhite: interop.Pointer

export declare const CGPointZero: CGPoint

export declare const kCGPDFContextAllowsCopying: interop.Pointer

export declare const kCGFontVariationAxisDefaultValue: interop.Pointer

export declare const kCGColorSpaceExtendedITUR_2020: interop.Pointer

export declare const kCGDisplayStreamQueueDepth: interop.Pointer

export declare const kCGColorSpaceITUR_2020: interop.Pointer

export declare const kCGColorSpaceITUR_2100_HLG: interop.Pointer

export declare const CGRectZero: CGRect

export declare const kCGColorSpaceDisplayP3_PQ: interop.Pointer

export declare const kCGDisplayStreamYCbCrMatrix_ITU_R_709_2: interop.Pointer

export declare const kCGPDFContextUserPassword: interop.Pointer

export declare const kCGWindowBounds: interop.Pointer

export declare const CGRectNull: CGRect

export declare const kCGColorSpaceExtendedLinearITUR_2020: interop.Pointer

export declare const CGRectInfinite: CGRect

export declare const kCGColorSpaceGenericRGBLinear: interop.Pointer

export declare const CGEventTapLocation: {
	HID: 0
	Session: 1
	AnnotatedSession: 2
}

export declare const CGInterpolationQuality: {
	Default: 0
	None: 1
	Low: 2
	Medium: 4
	High: 3
}

export declare const CGLineJoin: {
	Miter: 0
	Round: 1
	Bevel: 2
}

export declare const CGConfigureOption: {
	ForAppOnly: 0
	ForSession: 1
	Permanently: 2
}

export declare const CGPDFBox: {
	Media: 0
	Crop: 1
	Bleed: 2
	Trim: 3
	Art: 4
}

export declare const CGEventSourceStateID: {
	Private: -1
	CombinedSessionState: 0
	HIDSystemState: 1
}

export declare const CGImagePixelFormatInfo: {
	Mask: 983040
	Packed: 0
	RGB555: 65536
	RGB565: 131072
	RGB101010: 196608
	RGBCIF10: 262144
}

export declare const CGError: {
	Success: 0
	Failure: 1000
	IllegalArgument: 1001
	InvalidConnection: 1002
	InvalidContext: 1003
	CannotComplete: 1004
	NotImplemented: 1006
	RangeCheck: 1007
	TypeCheck: 1008
	InvalidOperation: 1010
	NoneAvailable: 1011
}

export declare const CGPatternTiling: {
	NoDistortion: 0
	ConstantSpacingMinimalDistortion: 1
	ConstantSpacing: 2
}

export declare const CGEventMouseSubtype: {
	Default: 0
	TabletPoint: 1
	TabletProximity: 2
}

export declare const CGPDFDataFormat: {
	Raw: 0
	JPEGEncoded: 1
	JPEG2000: 2
}

export declare const CGComponent: {
	Unknown: 0
	Integer8Bit: 1
	Integer10Bit: 6
	Integer16Bit: 2
	Integer32Bit: 3
	Float16Bit: 5
	Float32Bit: 4
}

export declare const CGPDFObjectType: {
	Null: 1
	Boolean: 2
	Integer: 3
	Real: 4
	Name: 5
	String: 6
	Array: 7
	Dictionary: 8
	Stream: 9
}

export declare const CGWindowListOption: {
	OptionAll: 0
	OptionOnScreenOnly: 1
	OptionOnScreenAboveWindow: 2
	OptionOnScreenBelowWindow: 4
	OptionIncludingWindow: 8
	ExcludeDesktopElements: 16
}

export declare const CGEventTapPlacement: {
	HeadInsert: 0
	TailAppend: 1
}

export declare const CGEventField: {
	MouseEventNumber: 0
	MouseEventClickState: 1
	MouseEventPressure: 2
	MouseEventButtonNumber: 3
	MouseEventDeltaX: 4
	MouseEventDeltaY: 5
	MouseEventInstantMouser: 6
	MouseEventSubtype: 7
	KeyboardEventAutorepeat: 8
	KeyboardEventKeycode: 9
	KeyboardEventKeyboardType: 10
	ScrollWheelEventDeltaAxis1: 11
	ScrollWheelEventDeltaAxis2: 12
	ScrollWheelEventDeltaAxis3: 13
	ScrollWheelEventFixedPtDeltaAxis1: 93
	ScrollWheelEventFixedPtDeltaAxis2: 94
	ScrollWheelEventFixedPtDeltaAxis3: 95
	ScrollWheelEventPointDeltaAxis1: 96
	ScrollWheelEventPointDeltaAxis2: 97
	ScrollWheelEventPointDeltaAxis3: 98
	ScrollWheelEventScrollPhase: 99
	ScrollWheelEventScrollCount: 100
	ScrollWheelEventMomentumPhase: 123
	ScrollWheelEventInstantMouser: 14
	TabletEventPointX: 15
	TabletEventPointY: 16
	TabletEventPointZ: 17
	TabletEventPointButtons: 18
	TabletEventPointPressure: 19
	TabletEventTiltX: 20
	TabletEventTiltY: 21
	TabletEventRotation: 22
	TabletEventTangentialPressure: 23
	TabletEventDeviceID: 24
	TabletEventVendor1: 25
	TabletEventVendor2: 26
	TabletEventVendor3: 27
	TabletProximityEventVendorID: 28
	TabletProximityEventTabletID: 29
	TabletProximityEventPointerID: 30
	TabletProximityEventDeviceID: 31
	TabletProximityEventSystemTabletID: 32
	TabletProximityEventVendorPointerType: 33
	TabletProximityEventVendorPointerSerialNumber: 34
	TabletProximityEventVendorUniqueID: 35
	TabletProximityEventCapabilityMask: 36
	TabletProximityEventPointerType: 37
	TabletProximityEventEnterProximity: 38
	EventTargetProcessSerialNumber: 39
	EventTargetUnixProcessID: 40
	EventSourceUnixProcessID: 41
	EventSourceUserData: 42
	EventSourceUserID: 43
	EventSourceGroupID: 44
	EventSourceStateID: 45
	ScrollWheelEventIsContinuous: 88
	MouseEventWindowUnderMousePointer: 91
	MouseEventWindowUnderMousePointerThatCanHandleThisEvent: 92
	EventUnacceleratedPointerMovementX: 170
	EventUnacceleratedPointerMovementY: 171
	ScrollWheelEventMomentumOptionPhase: 173
	ScrollWheelEventAcceleratedDeltaAxis1: 176
	ScrollWheelEventAcceleratedDeltaAxis2: 175
	ScrollWheelEventRawDeltaAxis1: 178
	ScrollWheelEventRawDeltaAxis2: 177
}

export declare const CGEventFlags: {
	AlphaShift: 65536
	Shift: 131072
	Control: 262144
	Alternate: 524288
	Command: 1048576
	Help: 4194304
	SecondaryFn: 8388608
	NumericPad: 2097152
	NonCoalesced: 256
}

export declare const CGGesturePhase: {
	None: 0
	Began: 1
	Changed: 2
	Ended: 4
	Cancelled: 8
	MayBegin: 128
}

export declare const CGDisplayStreamFrameStatus: {
	FrameComplete: 0
	FrameIdle: 1
	FrameBlank: 2
	Stopped: 3
}

export declare const CGDisplayStreamUpdateRectType: {
	Refreshed: 0
	Moved: 1
	Dirty: 2
	ReducedDirty: 3
}

export declare const CGWindowLevelKey: {
	BaseWindowLevelKey: 0
	MinimumWindowLevelKey: 1
	DesktopWindowLevelKey: 2
	BackstopMenuLevelKey: 3
	NormalWindowLevelKey: 4
	FloatingWindowLevelKey: 5
	TornOffMenuWindowLevelKey: 6
	DockWindowLevelKey: 7
	MainMenuWindowLevelKey: 8
	StatusWindowLevelKey: 9
	ModalPanelWindowLevelKey: 10
	PopUpMenuWindowLevelKey: 11
	DraggingWindowLevelKey: 12
	ScreenSaverWindowLevelKey: 13
	MaximumWindowLevelKey: 14
	OverlayWindowLevelKey: 15
	HelpWindowLevelKey: 16
	UtilityWindowLevelKey: 17
	DesktopIconWindowLevelKey: 18
	CursorWindowLevelKey: 19
	AssistiveTechHighWindowLevelKey: 20
	NumberOfWindowLevelKeys: 21
}

export declare const CGWindowBackingType: {
	Retained: 0
	Nonretained: 1
	Buffered: 2
}

export declare const CGWindowSharingType: {
	None: 0
	ReadOnly: 1
	ReadWrite: 2
}

export declare const CGBitmapLayout: {
	AlphaOnly: 0
	Gray: 1
	GrayAlpha: 2
	RGBA: 3
	ARGB: 4
	RGBX: 5
	XRGB: 6
	BGRA: 7
	BGRX: 8
	ABGR: 9
	XBGR: 10
	CMYK: 11
}

export declare const CGColorModel: {
	NoColorant: 0
	Gray: 1
	RGB: 2
	CMYK: 4
	Lab: 8
	DeviceN: 16
}

export declare const CGCaptureOptions: {
	Options: 0
	Fill: 1
}

export declare const CGColorSpaceModel: {
	Unknown: -1
	Monochrome: 0
	RGB: 1
	CMYK: 2
	Lab: 3
	DeviceN: 4
	Indexed: 5
	Pattern: 6
	XYZ: 7
}

export declare const CGBlendMode: {
	Normal: 0
	Multiply: 1
	Screen: 2
	Overlay: 3
	Darken: 4
	Lighten: 5
	ColorDodge: 6
	ColorBurn: 7
	SoftLight: 8
	HardLight: 9
	Difference: 10
	Exclusion: 11
	Hue: 12
	Saturation: 13
	Color: 14
	Luminosity: 15
	Clear: 16
	Copy: 17
	SourceIn: 18
	SourceOut: 19
	SourceAtop: 20
	DestinationOver: 21
	DestinationIn: 22
	DestinationOut: 23
	DestinationAtop: 24
	XOR: 25
	PlusDarker: 26
	PlusLighter: 27
}

export declare const CGTextEncoding: {
	FontSpecific: 0
	MacRoman: 1
}

export declare const CGPathDrawingMode: {
	Fill: 0
	EOFill: 1
	Stroke: 2
	FillStroke: 3
	EOFillStroke: 4
}

export declare const CGImageAlphaInfo: {
	None: 0
	PremultipliedLast: 1
	PremultipliedFirst: 2
	Last: 3
	First: 4
	NoneSkipLast: 5
	NoneSkipFirst: 6
	Only: 7
}

export declare const CGGradientDrawingOptions: {
	BeforeStart: 1
	AfterEnd: 2
}

export declare const CGGlyphDeprecatedEnum: {
	Min: 0
	Max: 1
}

export declare const CGColorRenderingIntent: {
	Default: 0
	AbsoluteColorimetric: 1
	RelativeColorimetric: 2
	Perceptual: 3
	Saturation: 4
}

export declare const CGEventTapOptions: {
	Default: 0
	ListenOnly: 1
}

export declare const CGFontPostScriptFormat: {
	Type1: 1
	Type3: 3
	Type42: 42
}

export declare const CGMouseButton: {
	Left: 0
	Right: 1
	Center: 2
}

export declare const CGEventSuppressionState: {
	EventSuppressionStateSuppressionInterval: 0
	EventSuppressionStateRemoteMouseDrag: 1
	NumberOfEventSuppressionStates: 2
}

export declare const CGEventFilterMask: {
	LocalMouse: 1
	LocalKeyboard: 2
	SystemDefined: 4
}

export declare const CGPDFAccessPermissions: {
	LowQualityPrinting: 1
	HighQualityPrinting: 2
	DocumentChanges: 4
	DocumentAssembly: 8
	ContentCopying: 16
	ContentAccessibility: 32
	Commenting: 64
	FormFieldEntry: 128
}

export declare const CGDisplayChangeSummaryFlags: {
	BeginConfiguration: 1
	Moved: 2
	SetMain: 4
	SetMode: 8
	Add: 16
	Remove: 32
	Enabled: 256
	Disabled: 512
	Mirror: 1024
	UnMirror: 2048
	DesktopShapeChanged: 4096
}

export declare const CGBitmapInfo: {
	AlphaInfoMask: 31
	ComponentInfoMask: 3840
	ByteOrderInfoMask: 28672
	PixelFormatInfoMask: 983040
	FloatInfoMask: 3840
	ByteOrderMask: 28672
	FloatComponents: 256
	ByteOrderDefault: 0
	ByteOrder16Little: 4096
	ByteOrder32Little: 8192
	ByteOrder16Big: 12288
	ByteOrder32Big: 16384
}

export declare const CGImageByteOrderInfo: {
	OrderMask: 28672
	OrderDefault: 0
	Order16Little: 4096
	Order32Little: 8192
	Order16Big: 12288
	Order32Big: 16384
	Order16Host: 4096
	Order32Host: 8192
}

export declare const CGScrollPhase: {
	Began: 1
	Changed: 2
	Ended: 4
	Cancelled: 8
	MayBegin: 128
}

export declare const CGPDFTagType: {
	Document: 100
	Part: 101
	Art: 102
	Section: 103
	Div: 104
	BlockQuote: 105
	Caption: 106
	TOC: 107
	TOCI: 108
	Index: 109
	NonStructure: 110
	Private: 111
	Paragraph: 200
	Header: 201
	Header1: 202
	Header2: 203
	Header3: 204
	Header4: 205
	Header5: 206
	Header6: 207
	List: 300
	ListItem: 301
	Label: 302
	ListBody: 303
	Table: 400
	TableRow: 401
	TableHeaderCell: 402
	TableDataCell: 403
	TableHeader: 404
	TableBody: 405
	TableFooter: 406
	Span: 500
	Quote: 501
	Note: 502
	Reference: 503
	Bibliography: 504
	Code: 505
	Link: 506
	Annotation: 507
	Ruby: 600
	RubyBaseText: 601
	RubyAnnotationText: 602
	RubyPunctuation: 603
	Warichu: 604
	WarichuText: 605
	WarichuPunctiation: 606
	Figure: 700
	Formula: 701
	Form: 702
	Object: 800
}

export declare const CGImageComponentInfo: {
	Integer: 0
	Float: 256
}

export declare const CGLineCap: {
	Butt: 0
	Round: 1
	Square: 2
}

export declare const CGMomentumScrollPhase: {
	None: 0
	Begin: 1
	Continue: 2
	End: 3
}

export declare const CGEventType: {
	Null: 0
	LeftMouseDown: 1
	LeftMouseUp: 2
	RightMouseDown: 3
	RightMouseUp: 4
	MouseMoved: 5
	LeftMouseDragged: 6
	RightMouseDragged: 7
	KeyDown: 10
	KeyUp: 11
	FlagsChanged: 12
	ScrollWheel: 22
	TabletPointer: 23
	TabletProximity: 24
	OtherMouseDown: 25
	OtherMouseUp: 26
	OtherMouseDragged: 27
	TapDisabledByTimeout: -2
	TapDisabledByUserInput: -1
}

export declare const CGScreenUpdateOperation: {
	Refresh: 0
	Move: 1
	ReducedDirtyRectangleCount: -2147483648
}

export declare const CGWindowImageOption: {
	Default: 0
	BoundsIgnoreFraming: 1
	ShouldBeOpaque: 2
	OnlyShadows: 4
	BestResolution: 8
	NominalResolution: 16
}

export declare const CGColorConversionInfoTransformType: {
	From: 0
	To: 1
	Apply: 2
}

export declare const CGPathElementType: {
	MoveToPoint: 0
	AddLineToPoint: 1
	AddQuadCurveToPoint: 2
	AddCurveToPoint: 3
	CloseSubpath: 4
}

export declare const CGTextDrawingMode: {
	Fill: 0
	Stroke: 1
	FillStroke: 2
	Invisible: 3
	FillClip: 4
	StrokeClip: 5
	FillStrokeClip: 6
	Clip: 7
}

export declare const CGScrollEventUnit: {
	Pixel: 0
	Line: 1
}

export declare class CGContentToneMappingInfo {
	constructor(init?: CGContentToneMappingInfo)
	method: interop.Enum<typeof CGToneMapping>
	options: interop.Object | null
}

export declare class CGDataProvider {
	constructor(init?: CGDataProvider)
}

export declare class CGPath {
	constructor(init?: CGPath)
}

export declare class CGDataConsumerCallbacks {
	constructor(init?: CGDataConsumerCallbacks)
	putBytes: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	releaseConsumer: (p1: interop.PointerConvertible) => void | null
}

export declare class CGPDFStream {
	constructor(init?: CGPDFStream)
}

export declare class CGDataConsumer {
	constructor(init?: CGDataConsumer)
}

export declare class CGPDFDictionary {
	constructor(init?: CGPDFDictionary)
}

export declare class CGColorDataFormat {
	constructor(init?: CGColorDataFormat)
	version: number
	colorspace_info: interop.Object | null
	bitmap_info: interop.Enum<typeof CGBitmapInfo>
	bits_per_component: number
	bytes_per_row: number
	intent: interop.Enum<typeof CGColorRenderingIntent>
	decode: interop.Pointer
}

export declare class CGDisplayStreamUpdate {
	constructor(init?: CGDisplayStreamUpdate)
}

export declare class CGFunctionCallbacks {
	constructor(init?: CGFunctionCallbacks)
	version: number
	evaluate: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => void | null
	releaseInfo: (p1: interop.PointerConvertible) => void | null
}

export declare class CGPSConverterCallbacks {
	constructor(init?: CGPSConverterCallbacks)
	version: number
	beginDocument: (p1: interop.PointerConvertible) => void | null
	endDocument: (p1: interop.PointerConvertible, p2: boolean) => void | null
	beginPage: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => void | null
	endPage: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => void | null
	noteProgress: (p1: interop.PointerConvertible) => void | null
	noteMessage: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null
	releaseInfo: (p1: interop.PointerConvertible) => void | null
}

export declare class __CGEventSource {
	constructor(init?: __CGEventSource)
}

export declare class __CGEventTapProxy {
	constructor(init?: __CGEventTapProxy)
}

export declare class CGDisplayStream {
	constructor(init?: CGDisplayStream)
}

export declare class _CGDisplayConfigRef {
	constructor(init?: _CGDisplayConfigRef)
}

export declare class CGPDFOperatorTable {
	constructor(init?: CGPDFOperatorTable)
}

export declare class CGPDFStructureElement {
	constructor(init?: CGPDFStructureElement)
}

export declare class CGPDFContentStream {
	constructor(init?: CGPDFContentStream)
}

export declare class CGLayer {
	constructor(init?: CGLayer)
}

export declare class CGColorConversionInfo {
	constructor(init?: CGColorConversionInfo)
}

export declare class CGBitmapParameters {
	constructor(init?: CGBitmapParameters)
	width: number
	height: number
	bytesPerPixel: number
	alignedBytesPerRow: number
	component: interop.Enum<typeof CGComponent>
	layout: interop.Enum<typeof CGBitmapLayout>
	format: interop.Enum<typeof CGImagePixelFormatInfo>
	colorSpace: interop.Object | null
	hasPremultipliedAlpha: boolean
	byteOrder: number
	edrTargetHeadroom: number
}

export declare class CGRenderingBufferProvider {
	constructor(init?: CGRenderingBufferProvider)
}

export declare class CGDisplayMode {
	constructor(init?: CGDisplayMode)
}

export declare class CGDataProviderSequentialCallbacks {
	constructor(init?: CGDataProviderSequentialCallbacks)
	version: number
	getBytes: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => number | null
	skipForward: (p1: interop.PointerConvertible, p2: number) => number | null
	rewind: (p1: interop.PointerConvertible) => void | null
	releaseInfo: (p1: interop.PointerConvertible) => void | null
}

export declare class CGGradient {
	constructor(init?: CGGradient)
}

export declare class CGPDFScanner {
	constructor(init?: CGPDFScanner)
}

export declare class CGPDFDocument {
	constructor(init?: CGPDFDocument)
}

export declare class CGImage {
	constructor(init?: CGImage)
}

export declare class ColorSyncProfile {
	constructor(init?: ColorSyncProfile)
}

export declare class CGPDFMarkedContentItem {
	constructor(init?: CGPDFMarkedContentItem)
}

export declare class CGShading {
	constructor(init?: CGShading)
}

export declare class CGPatternCallbacks {
	constructor(init?: CGPatternCallbacks)
	version: number
	drawPattern: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null
	releaseInfo: (p1: interop.PointerConvertible) => void | null
}

export declare class CGPattern {
	constructor(init?: CGPattern)
}

export declare class CGContext {
	constructor(init?: CGContext)
}

export declare class CGColorBufferFormat {
	constructor(init?: CGColorBufferFormat)
	version: number
	bitmapInfo: interop.Enum<typeof CGBitmapInfo>
	bitsPerComponent: number
	bitsPerPixel: number
	bytesPerRow: number
}

export declare class CGPDFPage {
	constructor(init?: CGPDFPage)
}

export declare class __CGEventTapInformation {
	constructor(init?: __CGEventTapInformation)
	eventTapID: number
	tapPoint: interop.Enum<typeof CGEventTapLocation>
	options: interop.Enum<typeof CGEventTapOptions>
	eventsOfInterest: number
	tappingProcess: number
	processBeingTapped: number
	enabled: boolean
	minUsecLatency: number
	avgUsecLatency: number
	maxUsecLatency: number
}

export declare class CGContentInfo {
	constructor(init?: CGContentInfo)
	deepestImageComponent: interop.Enum<typeof CGComponent>
	contentColorModels: interop.Enum<typeof CGColorModel>
	hasWideGamut: boolean
	hasTransparency: boolean
	largestContentHeadroom: number
}

export declare class CGPDFObject {
	constructor(init?: CGPDFObject)
}

export declare class CGPDFArray {
	constructor(init?: CGPDFArray)
}

export declare class CGPathElement {
	constructor(init?: CGPathElement)
	type: interop.Enum<typeof CGPathElementType>
	points: interop.Pointer
}

export declare class CGPDFString {
	constructor(init?: CGPDFString)
}

export declare class CGColorSpace {
	constructor(init?: CGColorSpace)
}

export declare class CGScreenUpdateMoveDelta {
	constructor(init?: CGScreenUpdateMoveDelta)
	dX: number
	dY: number
}

export declare class __IOSurface {
	constructor(init?: __IOSurface)
}

export declare class CGDeviceColor {
	constructor(init?: CGDeviceColor)
	red: number
	green: number
	blue: number
}

export declare class __CGEvent {
	constructor(init?: __CGEvent)
}

export declare class CGPSConverter {
	constructor(init?: CGPSConverter)
}

export declare class CGFont {
	constructor(init?: CGFont)
}

export declare class CGColor {
	constructor(init?: CGColor)
}

export declare class CGFunction {
	constructor(init?: CGFunction)
}

export declare class CGDataProviderDirectCallbacks {
	constructor(init?: CGDataProviderDirectCallbacks)
	version: number
	getBytePointer: (p1: interop.PointerConvertible) => interop.Pointer | null
	releaseBytePointer: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => void | null
	getBytesAtPosition: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
	) => number | null
	releaseInfo: (p1: interop.PointerConvertible) => void | null
}

export declare function CGRectGetMinX(rect: CGRect): number

export declare function CGRectGetMidX(rect: CGRect): number

export declare function CGRectGetMaxX(rect: CGRect): number

export declare function CGRectGetMinY(rect: CGRect): number

export declare function CGRectGetMidY(rect: CGRect): number

export declare function CGRectGetMaxY(rect: CGRect): number

export declare function CGRectGetWidth(rect: CGRect): number

export declare function CGRectGetHeight(rect: CGRect): number

export declare function CGPointEqualToPoint(point1: CGPoint, point2: CGPoint): boolean

export declare function CGSizeEqualToSize(size1: CGSize, size2: CGSize): boolean

export declare function CGRectEqualToRect(rect1: CGRect, rect2: CGRect): boolean

export declare function CGRectStandardize(rect: CGRect): CGRect

export declare function CGRectIsEmpty(rect: CGRect): boolean

export declare function CGRectIsNull(rect: CGRect): boolean

export declare function CGRectIsInfinite(rect: CGRect): boolean

export declare function CGRectInset(rect: CGRect, dx: number, dy: number): CGRect

export declare function CGRectIntegral(rect: CGRect): CGRect

export declare function CGRectUnion(r1: CGRect, r2: CGRect): CGRect

export declare function CGRectIntersection(r1: CGRect, r2: CGRect): CGRect

export declare function CGRectOffset(rect: CGRect, dx: number, dy: number): CGRect

export declare function CGRectDivide(
	rect: CGRect,
	slice: interop.PointerConvertible,
	remainder: interop.PointerConvertible,
	amount: number,
	edge: interop.Enum<typeof CGRectEdge>,
): void

export declare function CGRectContainsPoint(rect: CGRect, point: CGPoint): boolean

export declare function CGRectContainsRect(rect1: CGRect, rect2: CGRect): boolean

export declare function CGRectIntersectsRect(rect1: CGRect, rect2: CGRect): boolean

export declare function CGPointCreateDictionaryRepresentation(point: CGPoint): interop.Object

export declare function CGPointMakeWithDictionaryRepresentation(
	dict: interop.Object,
	point: interop.PointerConvertible,
): boolean

export declare function CGSizeCreateDictionaryRepresentation(size: CGSize): interop.Object

export declare function CGSizeMakeWithDictionaryRepresentation(
	dict: interop.Object,
	size: interop.PointerConvertible,
): boolean

export declare function CGRectCreateDictionaryRepresentation(p1: CGRect): interop.Object

export declare function CGRectMakeWithDictionaryRepresentation(
	dict: interop.Object,
	rect: interop.PointerConvertible,
): boolean

export declare function CGAffineTransformMake(
	a: number,
	b: number,
	c: number,
	d: number,
	tx: number,
	ty: number,
): CGAffineTransform

export declare function CGAffineTransformMakeTranslation(tx: number, ty: number): CGAffineTransform

export declare function CGAffineTransformMakeScale(sx: number, sy: number): CGAffineTransform

export declare function CGAffineTransformMakeRotation(angle: number): CGAffineTransform

export declare function CGAffineTransformIsIdentity(t: CGAffineTransform): boolean

export declare function CGAffineTransformTranslate(
	t: CGAffineTransform,
	tx: number,
	ty: number,
): CGAffineTransform

export declare function CGAffineTransformScale(
	t: CGAffineTransform,
	sx: number,
	sy: number,
): CGAffineTransform

export declare function CGAffineTransformRotate(
	t: CGAffineTransform,
	angle: number,
): CGAffineTransform

export declare function CGAffineTransformInvert(t: CGAffineTransform): CGAffineTransform

export declare function CGAffineTransformConcat(
	t1: CGAffineTransform,
	t2: CGAffineTransform,
): CGAffineTransform

export declare function CGAffineTransformEqualToTransform(
	t1: CGAffineTransform,
	t2: CGAffineTransform,
): boolean

export declare function CGPointApplyAffineTransform(point: CGPoint, t: CGAffineTransform): CGPoint

export declare function CGSizeApplyAffineTransform(size: CGSize, t: CGAffineTransform): CGSize

export declare function CGRectApplyAffineTransform(rect: CGRect, t: CGAffineTransform): CGRect

export declare function CGDataProviderGetTypeID(): number

export declare function CGDataProviderCreateSequential(
	info: interop.PointerConvertible,
	callbacks: interop.PointerConvertible,
): interop.Object

export declare function CGDataProviderCreateDirect(
	info: interop.PointerConvertible,
	size: number,
	callbacks: interop.PointerConvertible,
): interop.Object

export declare function CGDataProviderCreateWithData(
	info: interop.PointerConvertible,
	data: interop.PointerConvertible,
	size: number,
	releaseData: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number) => void,
): interop.Object

export declare function CGDataProviderCreateWithCFData(data: interop.Object): interop.Object

export declare function CGDataProviderCreateWithURL(url: interop.Object): interop.Object

export declare function CGDataProviderCreateWithFilename(filename: string): interop.Object

export declare function CGDataProviderRetain(provider: interop.Object): interop.Object

export declare function CGDataProviderRelease(provider: interop.Object): void

export declare function CGDataProviderCopyData(provider: interop.Object): interop.Object

export declare function CGDataProviderGetInfo(provider: interop.Object): interop.Pointer

export declare function CGColorSpaceCreateDeviceGray(): interop.Object

export declare function CGColorSpaceCreateDeviceRGB(): interop.Object

export declare function CGColorSpaceCreateDeviceCMYK(): interop.Object

export declare function CGColorSpaceCreateCalibratedGray(
	whitePoint: interop.PointerConvertible,
	blackPoint: interop.PointerConvertible,
	gamma: number,
): interop.Object

export declare function CGColorSpaceCreateCalibratedRGB(
	whitePoint: interop.PointerConvertible,
	blackPoint: interop.PointerConvertible,
	gamma: interop.PointerConvertible,
	matrix: interop.PointerConvertible,
): interop.Object

export declare function CGColorSpaceCreateLab(
	whitePoint: interop.PointerConvertible,
	blackPoint: interop.PointerConvertible,
	range: interop.PointerConvertible,
): interop.Object

export declare function CGColorSpaceCreateWithICCData(data: interop.Object): interop.Object

export declare function CGColorSpaceCreateICCBased(
	nComponents: number,
	range: interop.PointerConvertible,
	profile: interop.Object,
	alternate: interop.Object,
): interop.Object

export declare function CGColorSpaceCreateIndexed(
	baseSpace: interop.Object,
	lastIndex: number,
	colorTable: interop.PointerConvertible,
): interop.Object

export declare function CGColorSpaceCreatePattern(baseSpace: interop.Object): interop.Object

export declare function CGColorSpaceCreateWithName(name: interop.Object): interop.Object

export declare function CGColorSpaceRetain(space: interop.Object): interop.Object

export declare function CGColorSpaceRelease(space: interop.Object): void

export declare function CGColorSpaceGetName(space: interop.Object): interop.Object

export declare function CGColorSpaceCopyName(space: interop.Object): interop.Object

export declare function CGColorSpaceGetTypeID(): number

export declare function CGColorSpaceGetNumberOfComponents(space: interop.Object): number

export declare function CGColorSpaceGetModel(
	space: interop.Object,
): interop.Enum<typeof CGColorSpaceModel>

export declare function CGColorSpaceGetBaseColorSpace(space: interop.Object): interop.Object

export declare function CGColorSpaceGetColorTableCount(space: interop.Object): number

export declare function CGColorSpaceGetColorTable(
	space: interop.Object,
	table: interop.PointerConvertible,
): void

export declare function CGColorSpaceCopyICCData(space: interop.Object): interop.Object

export declare function CGColorSpaceIsWideGamutRGB(p1: interop.Object): boolean

export declare function CGColorSpaceIsHDR(p1: interop.Object): boolean

export declare function CGColorSpaceUsesITUR_2100TF(p1: interop.Object): boolean

export declare function CGColorSpaceSupportsOutput(space: interop.Object): boolean

export declare function CGColorSpaceCopyPropertyList(space: interop.Object): interop.Object

export declare function CGColorSpaceCreateWithPropertyList(plist: interop.Object): interop.Object

export declare function CGColorSpaceUsesExtendedRange(space: interop.Object): boolean

export declare function CGColorSpaceCreateLinearized(space: interop.Object): interop.Object

export declare function CGColorSpaceCreateExtended(space: interop.Object): interop.Object

export declare function CGColorSpaceCreateExtendedLinearized(space: interop.Object): interop.Object

export declare function CGColorSpaceCreateWithICCProfile(data: interop.Object): interop.Object

export declare function CGColorSpaceCopyICCProfile(space: interop.Object): interop.Object

export declare function CGColorSpaceCreateWithPlatformColorSpace(
	ref: interop.PointerConvertible,
): interop.Object

export declare function CGPatternGetTypeID(): number

export declare function CGPatternCreate(
	info: interop.PointerConvertible,
	bounds: CGRect,
	matrix: CGAffineTransform,
	xStep: number,
	yStep: number,
	tiling: interop.Enum<typeof CGPatternTiling>,
	isColored: boolean,
	callbacks: interop.PointerConvertible,
): interop.Object

export declare function CGPatternRetain(pattern: interop.Object): interop.Object

export declare function CGPatternRelease(pattern: interop.Object): void

export declare function CGColorCreate(
	space: interop.Object,
	components: interop.PointerConvertible,
): interop.Object

export declare function CGColorCreateGenericGray(gray: number, alpha: number): interop.Object

export declare function CGColorCreateGenericRGB(
	red: number,
	green: number,
	blue: number,
	alpha: number,
): interop.Object

export declare function CGColorCreateGenericCMYK(
	cyan: number,
	magenta: number,
	yellow: number,
	black: number,
	alpha: number,
): interop.Object

export declare function CGColorCreateGenericGrayGamma2_2(
	gray: number,
	alpha: number,
): interop.Object

export declare function CGColorCreateSRGB(
	red: number,
	green: number,
	blue: number,
	alpha: number,
): interop.Object

export declare function CGColorGetConstantColor(colorName: interop.Object): interop.Object

export declare function CGColorCreateWithPattern(
	space: interop.Object,
	pattern: interop.Object,
	components: interop.PointerConvertible,
): interop.Object

export declare function CGColorCreateCopy(color: interop.Object): interop.Object

export declare function CGColorCreateCopyWithAlpha(
	color: interop.Object,
	alpha: number,
): interop.Object

export declare function CGColorCreateCopyByMatchingToColorSpace(
	p1: interop.Object,
	intent: interop.Enum<typeof CGColorRenderingIntent>,
	color: interop.Object,
	options: interop.Object,
): interop.Object

export declare function CGColorRetain(color: interop.Object): interop.Object

export declare function CGColorRelease(color: interop.Object): void

export declare function CGColorEqualToColor(color1: interop.Object, color2: interop.Object): boolean

export declare function CGColorGetNumberOfComponents(color: interop.Object): number

export declare function CGColorGetComponents(color: interop.Object): interop.Pointer

export declare function CGColorGetAlpha(color: interop.Object): number

export declare function CGColorGetColorSpace(color: interop.Object): interop.Object

export declare function CGColorGetPattern(color: interop.Object): interop.Object

export declare function CGColorGetTypeID(): number

export declare function CGFontGetTypeID(): number

export declare function CGFontCreateWithPlatformFont(
	platformFontReference: interop.PointerConvertible,
): interop.Object

export declare function CGFontCreateWithDataProvider(provider: interop.Object): interop.Object

export declare function CGFontCreateWithFontName(name: interop.Object): interop.Object

export declare function CGFontCreateCopyWithVariations(
	font: interop.Object,
	variations: interop.Object,
): interop.Object

export declare function CGFontRetain(font: interop.Object): interop.Object

export declare function CGFontRelease(font: interop.Object): void

export declare function CGFontGetNumberOfGlyphs(font: interop.Object): number

export declare function CGFontGetUnitsPerEm(font: interop.Object): number

export declare function CGFontCopyPostScriptName(font: interop.Object): interop.Object

export declare function CGFontCopyFullName(font: interop.Object): interop.Object

export declare function CGFontGetAscent(font: interop.Object): number

export declare function CGFontGetDescent(font: interop.Object): number

export declare function CGFontGetLeading(font: interop.Object): number

export declare function CGFontGetCapHeight(font: interop.Object): number

export declare function CGFontGetXHeight(font: interop.Object): number

export declare function CGFontGetFontBBox(font: interop.Object): CGRect

export declare function CGFontGetItalicAngle(font: interop.Object): number

export declare function CGFontGetStemV(font: interop.Object): number

export declare function CGFontCopyVariationAxes(font: interop.Object): interop.Object

export declare function CGFontCopyVariations(font: interop.Object): interop.Object

export declare function CGFontGetGlyphAdvances(
	font: interop.Object,
	glyphs: interop.PointerConvertible,
	count: number,
	advances: interop.PointerConvertible,
): boolean

export declare function CGFontGetGlyphBBoxes(
	font: interop.Object,
	glyphs: interop.PointerConvertible,
	count: number,
	bboxes: interop.PointerConvertible,
): boolean

export declare function CGFontGetGlyphWithGlyphName(
	font: interop.Object,
	name: interop.Object,
): number

export declare function CGFontCopyGlyphNameForGlyph(
	font: interop.Object,
	glyph: number,
): interop.Object

export declare function CGFontCanCreatePostScriptSubset(
	font: interop.Object,
	format: interop.Enum<typeof CGFontPostScriptFormat>,
): boolean

export declare function CGFontCreatePostScriptSubset(
	font: interop.Object,
	subsetName: interop.Object,
	format: interop.Enum<typeof CGFontPostScriptFormat>,
	glyphs: interop.PointerConvertible,
	count: number,
	encoding: interop.PointerConvertible,
): interop.Object

export declare function CGFontCreatePostScriptEncoding(
	font: interop.Object,
	encoding: interop.PointerConvertible,
): interop.Object

export declare function CGFontCopyTableTags(font: interop.Object): interop.Object

export declare function CGFontCopyTableForTag(font: interop.Object, tag: number): interop.Object

export declare function CGGradientGetTypeID(): number

export declare function CGGradientCreateWithColorComponents(
	space: interop.Object,
	components: interop.PointerConvertible,
	locations: interop.PointerConvertible,
	count: number,
): interop.Object

export declare function CGGradientCreateWithColors(
	space: interop.Object,
	colors: interop.Object,
	locations: interop.PointerConvertible,
): interop.Object

export declare function CGGradientRetain(gradient: interop.Object): interop.Object

export declare function CGGradientRelease(gradient: interop.Object): void

export declare function CGImageGetTypeID(): number

export declare function CGImageCreate(
	width: number,
	height: number,
	bitsPerComponent: number,
	bitsPerPixel: number,
	bytesPerRow: number,
	space: interop.Object,
	bitmapInfo: interop.Enum<typeof CGBitmapInfo>,
	provider: interop.Object,
	decode: interop.PointerConvertible,
	shouldInterpolate: boolean,
	intent: interop.Enum<typeof CGColorRenderingIntent>,
): interop.Object

export declare function CGImageMaskCreate(
	width: number,
	height: number,
	bitsPerComponent: number,
	bitsPerPixel: number,
	bytesPerRow: number,
	provider: interop.Object,
	decode: interop.PointerConvertible,
	shouldInterpolate: boolean,
): interop.Object

export declare function CGImageCreateCopy(image: interop.Object): interop.Object

export declare function CGImageCreateWithJPEGDataProvider(
	source: interop.Object,
	decode: interop.PointerConvertible,
	shouldInterpolate: boolean,
	intent: interop.Enum<typeof CGColorRenderingIntent>,
): interop.Object

export declare function CGImageCreateWithPNGDataProvider(
	source: interop.Object,
	decode: interop.PointerConvertible,
	shouldInterpolate: boolean,
	intent: interop.Enum<typeof CGColorRenderingIntent>,
): interop.Object

export declare function CGImageCreateWithImageInRect(
	image: interop.Object,
	rect: CGRect,
): interop.Object

export declare function CGImageCreateWithMask(
	image: interop.Object,
	mask: interop.Object,
): interop.Object

export declare function CGImageCreateWithMaskingColors(
	image: interop.Object,
	components: interop.PointerConvertible,
): interop.Object

export declare function CGImageCreateCopyWithColorSpace(
	image: interop.Object,
	space: interop.Object,
): interop.Object

export declare function CGImageRetain(image: interop.Object): interop.Object

export declare function CGImageRelease(image: interop.Object): void

export declare function CGImageIsMask(image: interop.Object): boolean

export declare function CGImageGetWidth(image: interop.Object): number

export declare function CGImageGetHeight(image: interop.Object): number

export declare function CGImageGetBitsPerComponent(image: interop.Object): number

export declare function CGImageGetBitsPerPixel(image: interop.Object): number

export declare function CGImageGetBytesPerRow(image: interop.Object): number

export declare function CGImageGetColorSpace(image: interop.Object): interop.Object

export declare function CGImageGetAlphaInfo(
	image: interop.Object,
): interop.Enum<typeof CGImageAlphaInfo>

export declare function CGImageGetDataProvider(image: interop.Object): interop.Object

export declare function CGImageGetDecode(image: interop.Object): interop.Pointer

export declare function CGImageGetShouldInterpolate(image: interop.Object): boolean

export declare function CGImageGetRenderingIntent(
	image: interop.Object,
): interop.Enum<typeof CGColorRenderingIntent>

export declare function CGImageGetBitmapInfo(
	image: interop.Object,
): interop.Enum<typeof CGBitmapInfo>

export declare function CGImageGetByteOrderInfo(
	image: interop.Object,
): interop.Enum<typeof CGImageByteOrderInfo>

export declare function CGImageGetPixelFormatInfo(
	image: interop.Object,
): interop.Enum<typeof CGImagePixelFormatInfo>

export declare function CGImageGetUTType(image: interop.Object): interop.Object

export declare function CGPathGetTypeID(): number

export declare function CGPathCreateMutable(): interop.Object

export declare function CGPathCreateCopy(path: interop.Object): interop.Object

export declare function CGPathCreateCopyByTransformingPath(
	path: interop.Object,
	transform: interop.PointerConvertible,
): interop.Object

export declare function CGPathCreateMutableCopy(path: interop.Object): interop.Object

export declare function CGPathCreateMutableCopyByTransformingPath(
	path: interop.Object,
	transform: interop.PointerConvertible,
): interop.Object

export declare function CGPathCreateWithRect(
	rect: CGRect,
	transform: interop.PointerConvertible,
): interop.Object

export declare function CGPathCreateWithEllipseInRect(
	rect: CGRect,
	transform: interop.PointerConvertible,
): interop.Object

export declare function CGPathCreateWithRoundedRect(
	rect: CGRect,
	cornerWidth: number,
	cornerHeight: number,
	transform: interop.PointerConvertible,
): interop.Object

export declare function CGPathAddRoundedRect(
	path: interop.Object,
	transform: interop.PointerConvertible,
	rect: CGRect,
	cornerWidth: number,
	cornerHeight: number,
): void

export declare function CGPathCreateCopyByDashingPath(
	path: interop.Object,
	transform: interop.PointerConvertible,
	phase: number,
	lengths: interop.PointerConvertible,
	count: number,
): interop.Object

export declare function CGPathCreateCopyByStrokingPath(
	path: interop.Object,
	transform: interop.PointerConvertible,
	lineWidth: number,
	lineCap: interop.Enum<typeof CGLineCap>,
	lineJoin: interop.Enum<typeof CGLineJoin>,
	miterLimit: number,
): interop.Object

export declare function CGPathRetain(path: interop.Object): interop.Object

export declare function CGPathRelease(path: interop.Object): void

export declare function CGPathEqualToPath(path1: interop.Object, path2: interop.Object): boolean

export declare function CGPathMoveToPoint(
	path: interop.Object,
	m: interop.PointerConvertible,
	x: number,
	y: number,
): void

export declare function CGPathAddLineToPoint(
	path: interop.Object,
	m: interop.PointerConvertible,
	x: number,
	y: number,
): void

export declare function CGPathAddQuadCurveToPoint(
	path: interop.Object,
	m: interop.PointerConvertible,
	cpx: number,
	cpy: number,
	x: number,
	y: number,
): void

export declare function CGPathAddCurveToPoint(
	path: interop.Object,
	m: interop.PointerConvertible,
	cp1x: number,
	cp1y: number,
	cp2x: number,
	cp2y: number,
	x: number,
	y: number,
): void

export declare function CGPathCloseSubpath(path: interop.Object): void

export declare function CGPathAddRect(
	path: interop.Object,
	m: interop.PointerConvertible,
	rect: CGRect,
): void

export declare function CGPathAddRects(
	path: interop.Object,
	m: interop.PointerConvertible,
	rects: interop.PointerConvertible,
	count: number,
): void

export declare function CGPathAddLines(
	path: interop.Object,
	m: interop.PointerConvertible,
	points: interop.PointerConvertible,
	count: number,
): void

export declare function CGPathAddEllipseInRect(
	path: interop.Object,
	m: interop.PointerConvertible,
	rect: CGRect,
): void

export declare function CGPathAddRelativeArc(
	path: interop.Object,
	matrix: interop.PointerConvertible,
	x: number,
	y: number,
	radius: number,
	startAngle: number,
	delta: number,
): void

export declare function CGPathAddArc(
	path: interop.Object,
	m: interop.PointerConvertible,
	x: number,
	y: number,
	radius: number,
	startAngle: number,
	endAngle: number,
	clockwise: boolean,
): void

export declare function CGPathAddArcToPoint(
	path: interop.Object,
	m: interop.PointerConvertible,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	radius: number,
): void

export declare function CGPathAddPath(
	path1: interop.Object,
	m: interop.PointerConvertible,
	path2: interop.Object,
): void

export declare function CGPathIsEmpty(path: interop.Object): boolean

export declare function CGPathIsRect(
	path: interop.Object,
	rect: interop.PointerConvertible,
): boolean

export declare function CGPathGetCurrentPoint(path: interop.Object): CGPoint

export declare function CGPathGetBoundingBox(path: interop.Object): CGRect

export declare function CGPathGetPathBoundingBox(path: interop.Object): CGRect

export declare function CGPathContainsPoint(
	path: interop.Object,
	m: interop.PointerConvertible,
	point: CGPoint,
	eoFill: boolean,
): boolean

export declare function CGPathApply(
	path: interop.Object,
	info: interop.PointerConvertible,
	function$: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
): void

export declare function CGPathApplyWithBlock(
	path: interop.Object,
	block: (p1: interop.PointerConvertible) => void,
): void

export declare function CGPDFObjectGetType(
	object: interop.PointerConvertible,
): interop.Enum<typeof CGPDFObjectType>

export declare function CGPDFObjectGetValue(
	object: interop.PointerConvertible,
	type: interop.Enum<typeof CGPDFObjectType>,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFStreamGetDictionary(
	stream: interop.PointerConvertible,
): interop.Pointer

export declare function CGPDFStreamCopyData(
	stream: interop.PointerConvertible,
	format: interop.PointerConvertible,
): interop.Object

export declare function CGPDFStringGetLength(string: interop.PointerConvertible): number

export declare function CGPDFStringGetBytePtr(string: interop.PointerConvertible): interop.Pointer

export declare function CGPDFStringCopyTextString(
	string: interop.PointerConvertible,
): interop.Object

export declare function CGPDFStringCopyDate(string: interop.PointerConvertible): interop.Object

export declare function CGPDFArrayGetCount(array: interop.PointerConvertible): number

export declare function CGPDFArrayGetObject(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetNull(array: interop.PointerConvertible, index: number): boolean

export declare function CGPDFArrayGetBoolean(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetInteger(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetNumber(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetName(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetString(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetArray(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetDictionary(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayGetStream(
	array: interop.PointerConvertible,
	index: number,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFArrayApplyBlock(
	array: interop.PointerConvertible,
	block: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => boolean,
	info: interop.PointerConvertible,
): void

export declare function CGPDFDictionaryGetCount(dict: interop.PointerConvertible): number

export declare function CGPDFDictionaryGetObject(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetBoolean(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetInteger(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetNumber(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetName(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetString(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetArray(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetDictionary(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryGetStream(
	dict: interop.PointerConvertible,
	key: string,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFDictionaryApplyFunction(
	dict: interop.PointerConvertible,
	function$: (p1: string, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void,
	info: interop.PointerConvertible,
): void

export declare function CGPDFDictionaryApplyBlock(
	dict: interop.PointerConvertible,
	block: (p1: string, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => boolean,
	info: interop.PointerConvertible,
): void

export declare function CGPDFPageRetain(page: interop.Object): interop.Object

export declare function CGPDFPageRelease(page: interop.Object): void

export declare function CGPDFPageGetDocument(page: interop.Object): interop.Object

export declare function CGPDFPageGetPageNumber(page: interop.Object): number

export declare function CGPDFPageGetBoxRect(
	page: interop.Object,
	box: interop.Enum<typeof CGPDFBox>,
): CGRect

export declare function CGPDFPageGetRotationAngle(page: interop.Object): number

export declare function CGPDFPageGetDrawingTransform(
	page: interop.Object,
	box: interop.Enum<typeof CGPDFBox>,
	rect: CGRect,
	rotate: number,
	preserveAspectRatio: boolean,
): CGAffineTransform

export declare function CGPDFPageGetDictionary(page: interop.Object): interop.Pointer

export declare function CGPDFPageGetTypeID(): number

export declare function CGPDFDocumentCreateWithProvider(provider: interop.Object): interop.Object

export declare function CGPDFDocumentCreateWithURL(url: interop.Object): interop.Object

export declare function CGPDFDocumentRetain(document: interop.Object): interop.Object

export declare function CGPDFDocumentRelease(document: interop.Object): void

export declare function CGPDFDocumentGetVersion(
	document: interop.Object,
	majorVersion: interop.PointerConvertible,
	minorVersion: interop.PointerConvertible,
): void

export declare function CGPDFDocumentIsEncrypted(document: interop.Object): boolean

export declare function CGPDFDocumentUnlockWithPassword(
	document: interop.Object,
	password: string,
): boolean

export declare function CGPDFDocumentIsUnlocked(document: interop.Object): boolean

export declare function CGPDFDocumentAllowsPrinting(document: interop.Object): boolean

export declare function CGPDFDocumentAllowsCopying(document: interop.Object): boolean

export declare function CGPDFDocumentGetNumberOfPages(document: interop.Object): number

export declare function CGPDFDocumentGetPage(
	document: interop.Object,
	pageNumber: number,
): interop.Object

export declare function CGPDFDocumentGetCatalog(document: interop.Object): interop.Pointer

export declare function CGPDFDocumentGetInfo(document: interop.Object): interop.Pointer

export declare function CGPDFDocumentGetID(document: interop.Object): interop.Pointer

export declare function CGPDFDocumentGetTypeID(): number

export declare function CGPDFDocumentGetOutline(document: interop.Object): interop.Object

export declare function CGPDFDocumentGetAccessPermissions(
	document: interop.Object,
): interop.Enum<typeof CGPDFAccessPermissions>

export declare function CGPDFDocumentGetMediaBox(document: interop.Object, page: number): CGRect

export declare function CGPDFDocumentGetCropBox(document: interop.Object, page: number): CGRect

export declare function CGPDFDocumentGetBleedBox(document: interop.Object, page: number): CGRect

export declare function CGPDFDocumentGetTrimBox(document: interop.Object, page: number): CGRect

export declare function CGPDFDocumentGetArtBox(document: interop.Object, page: number): CGRect

export declare function CGPDFDocumentGetRotationAngle(
	document: interop.Object,
	page: number,
): number

export declare function CGFunctionGetTypeID(): number

export declare function CGFunctionCreate(
	info: interop.PointerConvertible,
	domainDimension: number,
	domain: interop.PointerConvertible,
	rangeDimension: number,
	range: interop.PointerConvertible,
	callbacks: interop.PointerConvertible,
): interop.Object

export declare function CGFunctionRetain(function$: interop.Object): interop.Object

export declare function CGFunctionRelease(function$: interop.Object): void

export declare function CGShadingGetTypeID(): number

export declare function CGShadingCreateAxial(
	space: interop.Object,
	start: CGPoint,
	end: CGPoint,
	function$: interop.Object,
	extendStart: boolean,
	extendEnd: boolean,
): interop.Object

export declare function CGShadingCreateRadial(
	space: interop.Object,
	start: CGPoint,
	startRadius: number,
	end: CGPoint,
	endRadius: number,
	function$: interop.Object,
	extendStart: boolean,
	extendEnd: boolean,
): interop.Object

export declare function CGShadingRetain(shading: interop.Object): interop.Object

export declare function CGShadingRelease(shading: interop.Object): void

export declare function CGContextGetTypeID(): number

export declare function CGContextSaveGState(c: interop.Object): void

export declare function CGContextRestoreGState(c: interop.Object): void

export declare function CGContextScaleCTM(c: interop.Object, sx: number, sy: number): void

export declare function CGContextTranslateCTM(c: interop.Object, tx: number, ty: number): void

export declare function CGContextRotateCTM(c: interop.Object, angle: number): void

export declare function CGContextConcatCTM(c: interop.Object, transform: CGAffineTransform): void

export declare function CGContextGetCTM(c: interop.Object): CGAffineTransform

export declare function CGContextSetLineWidth(c: interop.Object, width: number): void

export declare function CGContextSetLineCap(
	c: interop.Object,
	cap: interop.Enum<typeof CGLineCap>,
): void

export declare function CGContextSetLineJoin(
	c: interop.Object,
	join: interop.Enum<typeof CGLineJoin>,
): void

export declare function CGContextSetMiterLimit(c: interop.Object, limit: number): void

export declare function CGContextSetLineDash(
	c: interop.Object,
	phase: number,
	lengths: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextSetFlatness(c: interop.Object, flatness: number): void

export declare function CGContextSetAlpha(c: interop.Object, alpha: number): void

export declare function CGContextSetBlendMode(
	c: interop.Object,
	mode: interop.Enum<typeof CGBlendMode>,
): void

export declare function CGContextBeginPath(c: interop.Object): void

export declare function CGContextMoveToPoint(c: interop.Object, x: number, y: number): void

export declare function CGContextAddLineToPoint(c: interop.Object, x: number, y: number): void

export declare function CGContextAddCurveToPoint(
	c: interop.Object,
	cp1x: number,
	cp1y: number,
	cp2x: number,
	cp2y: number,
	x: number,
	y: number,
): void

export declare function CGContextAddQuadCurveToPoint(
	c: interop.Object,
	cpx: number,
	cpy: number,
	x: number,
	y: number,
): void

export declare function CGContextClosePath(c: interop.Object): void

export declare function CGContextAddRect(c: interop.Object, rect: CGRect): void

export declare function CGContextAddRects(
	c: interop.Object,
	rects: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextAddLines(
	c: interop.Object,
	points: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextAddEllipseInRect(c: interop.Object, rect: CGRect): void

export declare function CGContextAddArc(
	c: interop.Object,
	x: number,
	y: number,
	radius: number,
	startAngle: number,
	endAngle: number,
	clockwise: number,
): void

export declare function CGContextAddArcToPoint(
	c: interop.Object,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	radius: number,
): void

export declare function CGContextAddPath(c: interop.Object, path: interop.Object): void

export declare function CGContextReplacePathWithStrokedPath(c: interop.Object): void

export declare function CGContextIsPathEmpty(c: interop.Object): boolean

export declare function CGContextGetPathCurrentPoint(c: interop.Object): CGPoint

export declare function CGContextGetPathBoundingBox(c: interop.Object): CGRect

export declare function CGContextCopyPath(c: interop.Object): interop.Object

export declare function CGContextPathContainsPoint(
	c: interop.Object,
	point: CGPoint,
	mode: interop.Enum<typeof CGPathDrawingMode>,
): boolean

export declare function CGContextDrawPath(
	c: interop.Object,
	mode: interop.Enum<typeof CGPathDrawingMode>,
): void

export declare function CGContextFillPath(c: interop.Object): void

export declare function CGContextEOFillPath(c: interop.Object): void

export declare function CGContextStrokePath(c: interop.Object): void

export declare function CGContextFillRect(c: interop.Object, rect: CGRect): void

export declare function CGContextFillRects(
	c: interop.Object,
	rects: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextStrokeRect(c: interop.Object, rect: CGRect): void

export declare function CGContextStrokeRectWithWidth(
	c: interop.Object,
	rect: CGRect,
	width: number,
): void

export declare function CGContextClearRect(c: interop.Object, rect: CGRect): void

export declare function CGContextFillEllipseInRect(c: interop.Object, rect: CGRect): void

export declare function CGContextStrokeEllipseInRect(c: interop.Object, rect: CGRect): void

export declare function CGContextStrokeLineSegments(
	c: interop.Object,
	points: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextClip(c: interop.Object): void

export declare function CGContextEOClip(c: interop.Object): void

export declare function CGContextResetClip(c: interop.Object): void

export declare function CGContextClipToMask(
	c: interop.Object,
	rect: CGRect,
	mask: interop.Object,
): void

export declare function CGContextGetClipBoundingBox(c: interop.Object): CGRect

export declare function CGContextClipToRect(c: interop.Object, rect: CGRect): void

export declare function CGContextClipToRects(
	c: interop.Object,
	rects: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextSetFillColorWithColor(
	c: interop.Object,
	color: interop.Object,
): void

export declare function CGContextSetStrokeColorWithColor(
	c: interop.Object,
	color: interop.Object,
): void

export declare function CGContextSetFillColorSpace(c: interop.Object, space: interop.Object): void

export declare function CGContextSetStrokeColorSpace(c: interop.Object, space: interop.Object): void

export declare function CGContextSetFillColor(
	c: interop.Object,
	components: interop.PointerConvertible,
): void

export declare function CGContextSetStrokeColor(
	c: interop.Object,
	components: interop.PointerConvertible,
): void

export declare function CGContextSetFillPattern(
	c: interop.Object,
	pattern: interop.Object,
	components: interop.PointerConvertible,
): void

export declare function CGContextSetStrokePattern(
	c: interop.Object,
	pattern: interop.Object,
	components: interop.PointerConvertible,
): void

export declare function CGContextSetPatternPhase(c: interop.Object, phase: CGSize): void

export declare function CGContextSetGrayFillColor(
	c: interop.Object,
	gray: number,
	alpha: number,
): void

export declare function CGContextSetGrayStrokeColor(
	c: interop.Object,
	gray: number,
	alpha: number,
): void

export declare function CGContextSetRGBFillColor(
	c: interop.Object,
	red: number,
	green: number,
	blue: number,
	alpha: number,
): void

export declare function CGContextSetRGBStrokeColor(
	c: interop.Object,
	red: number,
	green: number,
	blue: number,
	alpha: number,
): void

export declare function CGContextSetCMYKFillColor(
	c: interop.Object,
	cyan: number,
	magenta: number,
	yellow: number,
	black: number,
	alpha: number,
): void

export declare function CGContextSetCMYKStrokeColor(
	c: interop.Object,
	cyan: number,
	magenta: number,
	yellow: number,
	black: number,
	alpha: number,
): void

export declare function CGContextSetRenderingIntent(
	c: interop.Object,
	intent: interop.Enum<typeof CGColorRenderingIntent>,
): void

export declare function CGContextDrawImage(
	c: interop.Object,
	rect: CGRect,
	image: interop.Object,
): void

export declare function CGContextDrawTiledImage(
	c: interop.Object,
	rect: CGRect,
	image: interop.Object,
): void

export declare function CGContextGetInterpolationQuality(
	c: interop.Object,
): interop.Enum<typeof CGInterpolationQuality>

export declare function CGContextSetInterpolationQuality(
	c: interop.Object,
	quality: interop.Enum<typeof CGInterpolationQuality>,
): void

export declare function CGContextSetShadowWithColor(
	c: interop.Object,
	offset: CGSize,
	blur: number,
	color: interop.Object,
): void

export declare function CGContextSetShadow(c: interop.Object, offset: CGSize, blur: number): void

export declare function CGContextDrawLinearGradient(
	c: interop.Object,
	gradient: interop.Object,
	startPoint: CGPoint,
	endPoint: CGPoint,
	options: interop.Enum<typeof CGGradientDrawingOptions>,
): void

export declare function CGContextDrawRadialGradient(
	c: interop.Object,
	gradient: interop.Object,
	startCenter: CGPoint,
	startRadius: number,
	endCenter: CGPoint,
	endRadius: number,
	options: interop.Enum<typeof CGGradientDrawingOptions>,
): void

export declare function CGContextDrawShading(c: interop.Object, shading: interop.Object): void

export declare function CGContextSetCharacterSpacing(c: interop.Object, spacing: number): void

export declare function CGContextSetTextPosition(c: interop.Object, x: number, y: number): void

export declare function CGContextGetTextPosition(c: interop.Object): CGPoint

export declare function CGContextSetTextMatrix(c: interop.Object, t: CGAffineTransform): void

export declare function CGContextGetTextMatrix(c: interop.Object): CGAffineTransform

export declare function CGContextSetTextDrawingMode(
	c: interop.Object,
	mode: interop.Enum<typeof CGTextDrawingMode>,
): void

export declare function CGContextSetFont(c: interop.Object, font: interop.Object): void

export declare function CGContextSetFontSize(c: interop.Object, size: number): void

export declare function CGContextShowGlyphsAtPositions(
	c: interop.Object,
	glyphs: interop.PointerConvertible,
	Lpositions: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextDrawPDFPage(c: interop.Object, page: interop.Object): void

export declare function CGContextBeginPage(
	c: interop.Object,
	mediaBox: interop.PointerConvertible,
): void

export declare function CGContextEndPage(c: interop.Object): void

export declare function CGContextRetain(c: interop.Object): interop.Object

export declare function CGContextRelease(c: interop.Object): void

export declare function CGContextFlush(c: interop.Object): void

export declare function CGContextSynchronize(c: interop.Object): void

export declare function CGContextSetShouldAntialias(
	c: interop.Object,
	shouldAntialias: boolean,
): void

export declare function CGContextSetAllowsAntialiasing(
	c: interop.Object,
	allowsAntialiasing: boolean,
): void

export declare function CGContextSetShouldSmoothFonts(
	c: interop.Object,
	shouldSmoothFonts: boolean,
): void

export declare function CGContextSetAllowsFontSmoothing(
	c: interop.Object,
	allowsFontSmoothing: boolean,
): void

export declare function CGContextSetShouldSubpixelPositionFonts(
	c: interop.Object,
	shouldSubpixelPositionFonts: boolean,
): void

export declare function CGContextSetAllowsFontSubpixelPositioning(
	c: interop.Object,
	allowsFontSubpixelPositioning: boolean,
): void

export declare function CGContextSetShouldSubpixelQuantizeFonts(
	c: interop.Object,
	shouldSubpixelQuantizeFonts: boolean,
): void

export declare function CGContextSetAllowsFontSubpixelQuantization(
	c: interop.Object,
	allowsFontSubpixelQuantization: boolean,
): void

export declare function CGContextBeginTransparencyLayer(
	c: interop.Object,
	auxiliaryInfo: interop.Object,
): void

export declare function CGContextBeginTransparencyLayerWithRect(
	c: interop.Object,
	rect: CGRect,
	auxInfo: interop.Object,
): void

export declare function CGContextEndTransparencyLayer(c: interop.Object): void

export declare function CGContextGetUserSpaceToDeviceSpaceTransform(
	c: interop.Object,
): CGAffineTransform

export declare function CGContextConvertPointToDeviceSpace(
	c: interop.Object,
	point: CGPoint,
): CGPoint

export declare function CGContextConvertPointToUserSpace(c: interop.Object, point: CGPoint): CGPoint

export declare function CGContextConvertSizeToDeviceSpace(c: interop.Object, size: CGSize): CGSize

export declare function CGContextConvertSizeToUserSpace(c: interop.Object, size: CGSize): CGSize

export declare function CGContextConvertRectToDeviceSpace(c: interop.Object, rect: CGRect): CGRect

export declare function CGContextConvertRectToUserSpace(c: interop.Object, rect: CGRect): CGRect

export declare function CGContextSelectFont(
	c: interop.Object,
	name: string,
	size: number,
	textEncoding: interop.Enum<typeof CGTextEncoding>,
): void

export declare function CGContextShowText(c: interop.Object, string: string, length: number): void

export declare function CGContextShowTextAtPoint(
	c: interop.Object,
	x: number,
	y: number,
	string: string,
	length: number,
): void

export declare function CGContextShowGlyphs(
	c: interop.Object,
	g: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextShowGlyphsAtPoint(
	c: interop.Object,
	x: number,
	y: number,
	glyphs: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextShowGlyphsWithAdvances(
	c: interop.Object,
	glyphs: interop.PointerConvertible,
	advances: interop.PointerConvertible,
	count: number,
): void

export declare function CGContextDrawPDFDocument(
	c: interop.Object,
	rect: CGRect,
	document: interop.Object,
	page: number,
): void

export declare function CGBitmapContextCreateWithData(
	data: interop.PointerConvertible,
	width: number,
	height: number,
	bitsPerComponent: number,
	bytesPerRow: number,
	space: interop.Object,
	bitmapInfo: interop.Enum<typeof CGBitmapInfo>,
	releaseCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	releaseInfo: interop.PointerConvertible,
): interop.Object

export declare function CGBitmapContextCreate(
	data: interop.PointerConvertible,
	width: number,
	height: number,
	bitsPerComponent: number,
	bytesPerRow: number,
	space: interop.Object,
	bitmapInfo: interop.Enum<typeof CGBitmapInfo>,
): interop.Object

export declare function CGBitmapContextGetData(context: interop.Object): interop.Pointer

export declare function CGBitmapContextGetWidth(context: interop.Object): number

export declare function CGBitmapContextGetHeight(context: interop.Object): number

export declare function CGBitmapContextGetBitsPerComponent(context: interop.Object): number

export declare function CGBitmapContextGetBitsPerPixel(context: interop.Object): number

export declare function CGBitmapContextGetBytesPerRow(context: interop.Object): number

export declare function CGBitmapContextGetColorSpace(context: interop.Object): interop.Object

export declare function CGBitmapContextGetAlphaInfo(
	context: interop.Object,
): interop.Enum<typeof CGImageAlphaInfo>

export declare function CGBitmapContextGetBitmapInfo(
	context: interop.Object,
): interop.Enum<typeof CGBitmapInfo>

export declare function CGBitmapContextCreateImage(context: interop.Object): interop.Object

export declare function CGColorConversionInfoGetTypeID(): number

export declare function CGColorConversionInfoCreate(
	src: interop.Object,
	dst: interop.Object,
): interop.Pointer

export declare function CGColorConversionInfoCreateWithOptions(
	src: interop.Object,
	dst: interop.Object,
	options: interop.Object,
): interop.Pointer

export declare function CGColorConversionInfoCreateFromList(
	options: interop.Object,
	p2: interop.Object,
	p3: interop.Enum<typeof CGColorConversionInfoTransformType>,
	p4: interop.Enum<typeof CGColorRenderingIntent>,
): interop.Pointer

export declare function CGColorConversionInfoCreateFromListWithArguments(
	options: interop.Object,
	p2: interop.Object,
	p3: interop.Enum<typeof CGColorConversionInfoTransformType>,
	p4: interop.Enum<typeof CGColorRenderingIntent>,
	p5: string,
): interop.Pointer

export declare function CGConvertColorDataWithFormat(
	width: number,
	height: number,
	dst_data: interop.PointerConvertible,
	dst_format: CGColorDataFormat,
	src_data: interop.PointerConvertible,
	src_format: CGColorDataFormat,
	options: interop.Object,
): boolean

export declare function CGDataConsumerGetTypeID(): number

export declare function CGDataConsumerCreate(
	info: interop.PointerConvertible,
	cbks: interop.PointerConvertible,
): interop.Object

export declare function CGDataConsumerCreateWithURL(url: interop.Object): interop.Object

export declare function CGDataConsumerCreateWithCFData(data: interop.Object): interop.Object

export declare function CGDataConsumerRetain(consumer: interop.Object): interop.Object

export declare function CGDataConsumerRelease(consumer: interop.Object): void

export declare function CGErrorSetCallback(callback: () => void): void

export declare function CGLayerCreateWithContext(
	context: interop.Object,
	size: CGSize,
	auxiliaryInfo: interop.Object,
): interop.Object

export declare function CGLayerRetain(layer: interop.Object): interop.Object

export declare function CGLayerRelease(layer: interop.Object): void

export declare function CGLayerGetSize(layer: interop.Object): CGSize

export declare function CGLayerGetContext(layer: interop.Object): interop.Object

export declare function CGContextDrawLayerInRect(
	context: interop.Object,
	rect: CGRect,
	layer: interop.Object,
): void

export declare function CGContextDrawLayerAtPoint(
	context: interop.Object,
	point: CGPoint,
	layer: interop.Object,
): void

export declare function CGLayerGetTypeID(): number

export declare function CGPDFContentStreamCreateWithPage(page: interop.Object): interop.Pointer

export declare function CGPDFContentStreamCreateWithStream(
	stream: interop.PointerConvertible,
	streamResources: interop.PointerConvertible,
	parent: interop.PointerConvertible,
): interop.Pointer

export declare function CGPDFContentStreamRetain(cs: interop.PointerConvertible): interop.Pointer

export declare function CGPDFContentStreamRelease(cs: interop.PointerConvertible): void

export declare function CGPDFContentStreamGetStreams(cs: interop.PointerConvertible): interop.Object

export declare function CGPDFContentStreamGetResource(
	cs: interop.PointerConvertible,
	category: string,
	name: string,
): interop.Pointer

export declare function CGPDFContextCreate(
	consumer: interop.Object,
	mediaBox: interop.PointerConvertible,
	auxiliaryInfo: interop.Object,
): interop.Object

export declare function CGPDFContextCreateWithURL(
	url: interop.Object,
	mediaBox: interop.PointerConvertible,
	auxiliaryInfo: interop.Object,
): interop.Object

export declare function CGPDFContextClose(context: interop.Object): void

export declare function CGPDFContextBeginPage(
	context: interop.Object,
	pageInfo: interop.Object,
): void

export declare function CGPDFContextEndPage(context: interop.Object): void

export declare function CGPDFContextAddDocumentMetadata(
	context: interop.Object,
	metadata: interop.Object,
): void

export declare function CGPDFContextSetParentTree(
	context: interop.Object,
	parentTreeDictionary: interop.PointerConvertible,
): void

export declare function CGPDFContextSetIDTree(
	context: interop.Object,
	IDTreeDictionary: interop.PointerConvertible,
): void

export declare function CGPDFContextSetPageTagStructureTree(
	context: interop.Object,
	pageTagStructureTreeDictionary: interop.Object,
): void

export declare function CGPDFContextSetURLForRect(
	context: interop.Object,
	url: interop.Object,
	rect: CGRect,
): void

export declare function CGPDFContextAddDestinationAtPoint(
	context: interop.Object,
	name: interop.Object,
	point: CGPoint,
): void

export declare function CGPDFContextSetDestinationForRect(
	context: interop.Object,
	name: interop.Object,
	rect: CGRect,
): void

export declare function CGPDFContextSetOutline(
	context: interop.Object,
	outline: interop.Object,
): void

export declare function CGPDFTagTypeGetName(tagType: interop.Enum<typeof CGPDFTagType>): string

export declare function CGPDFContextBeginTag(
	context: interop.Object,
	tagType: interop.Enum<typeof CGPDFTagType>,
	tagProperties: interop.Object,
): void

export declare function CGPDFContextEndTag(context: interop.Object): void

export declare function CGPDFScannerCreate(
	cs: interop.PointerConvertible,
	table: interop.PointerConvertible,
	info: interop.PointerConvertible,
): interop.Pointer

export declare function CGPDFScannerRetain(scanner: interop.PointerConvertible): interop.Pointer

export declare function CGPDFScannerRelease(scanner: interop.PointerConvertible): void

export declare function CGPDFScannerScan(scanner: interop.PointerConvertible): boolean

export declare function CGPDFScannerGetContentStream(
	scanner: interop.PointerConvertible,
): interop.Pointer

export declare function CGPDFScannerPopObject(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopBoolean(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopInteger(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopNumber(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopName(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopString(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopArray(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopDictionary(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerPopStream(
	scanner: interop.PointerConvertible,
	value: interop.PointerConvertible,
): boolean

export declare function CGPDFScannerStop(s: interop.PointerConvertible): void

export declare function CGPDFOperatorTableCreate(): interop.Pointer

export declare function CGPDFOperatorTableRetain(table: interop.PointerConvertible): interop.Pointer

export declare function CGPDFOperatorTableRelease(table: interop.PointerConvertible): void

export declare function CGPDFOperatorTableSetCallback(
	table: interop.PointerConvertible,
	name: string,
	callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
): void

export declare function CGWindowListCopyWindowInfo(
	option: interop.Enum<typeof CGWindowListOption>,
	relativeToWindow: number,
): interop.Object

export declare function CGWindowListCreate(
	option: interop.Enum<typeof CGWindowListOption>,
	relativeToWindow: number,
): interop.Object

export declare function CGWindowListCreateDescriptionFromArray(
	windowArray: interop.Object,
): interop.Object

export declare function CGWindowListCreateImage(
	screenBounds: CGRect,
	listOption: interop.Enum<typeof CGWindowListOption>,
	windowID: number,
	imageOption: interop.Enum<typeof CGWindowImageOption>,
): interop.Object

export declare function CGWindowListCreateImageFromArray(
	screenBounds: CGRect,
	windowArray: interop.Object,
	imageOption: interop.Enum<typeof CGWindowImageOption>,
): interop.Object

export declare function CGPreflightScreenCaptureAccess(): boolean

export declare function CGRequestScreenCaptureAccess(): boolean

export declare function CGWindowLevelForKey(key: interop.Enum<typeof CGWindowLevelKey>): number

export declare function CGMainDisplayID(): number

export declare function CGGetDisplaysWithPoint(
	point: CGPoint,
	maxDisplays: number,
	displays: interop.PointerConvertible,
	matchingDisplayCount: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGGetDisplaysWithRect(
	rect: CGRect,
	maxDisplays: number,
	displays: interop.PointerConvertible,
	matchingDisplayCount: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGGetDisplaysWithOpenGLDisplayMask(
	mask: number,
	maxDisplays: number,
	displays: interop.PointerConvertible,
	matchingDisplayCount: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGGetActiveDisplayList(
	maxDisplays: number,
	activeDisplays: interop.PointerConvertible,
	displayCount: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGGetOnlineDisplayList(
	maxDisplays: number,
	onlineDisplays: interop.PointerConvertible,
	displayCount: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGDisplayIDToOpenGLDisplayMask(display: number): number

export declare function CGOpenGLDisplayMaskToDisplayID(mask: number): number

export declare function CGDisplayBounds(display: number): CGRect

export declare function CGDisplayPixelsWide(display: number): number

export declare function CGDisplayPixelsHigh(display: number): number

export declare function CGDisplayCopyAllDisplayModes(
	display: number,
	options: interop.Object,
): interop.Object

export declare function CGDisplayCopyDisplayMode(display: number): interop.Object

export declare function CGDisplaySetDisplayMode(
	display: number,
	mode: interop.Object,
	options: interop.Object,
): interop.Enum<typeof CGError>

export declare function CGDisplayModeGetWidth(mode: interop.Object): number

export declare function CGDisplayModeGetHeight(mode: interop.Object): number

export declare function CGDisplayModeCopyPixelEncoding(mode: interop.Object): interop.Object

export declare function CGDisplayModeGetRefreshRate(mode: interop.Object): number

export declare function CGDisplayModeGetIOFlags(mode: interop.Object): number

export declare function CGDisplayModeGetIODisplayModeID(mode: interop.Object): number

export declare function CGDisplayModeIsUsableForDesktopGUI(mode: interop.Object): boolean

export declare function CGDisplayModeGetTypeID(): number

export declare function CGDisplayModeRetain(mode: interop.Object): interop.Object

export declare function CGDisplayModeRelease(mode: interop.Object): void

export declare function CGDisplayModeGetPixelWidth(mode: interop.Object): number

export declare function CGDisplayModeGetPixelHeight(mode: interop.Object): number

export declare function CGSetDisplayTransferByFormula(
	display: number,
	redMin: number,
	redMax: number,
	redGamma: number,
	greenMin: number,
	greenMax: number,
	greenGamma: number,
	blueMin: number,
	blueMax: number,
	blueGamma: number,
): interop.Enum<typeof CGError>

export declare function CGGetDisplayTransferByFormula(
	display: number,
	redMin: interop.PointerConvertible,
	redMax: interop.PointerConvertible,
	redGamma: interop.PointerConvertible,
	greenMin: interop.PointerConvertible,
	greenMax: interop.PointerConvertible,
	greenGamma: interop.PointerConvertible,
	blueMin: interop.PointerConvertible,
	blueMax: interop.PointerConvertible,
	blueGamma: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGDisplayGammaTableCapacity(display: number): number

export declare function CGSetDisplayTransferByTable(
	display: number,
	tableSize: number,
	redTable: interop.PointerConvertible,
	greenTable: interop.PointerConvertible,
	blueTable: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGGetDisplayTransferByTable(
	display: number,
	capacity: number,
	redTable: interop.PointerConvertible,
	greenTable: interop.PointerConvertible,
	blueTable: interop.PointerConvertible,
	sampleCount: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGSetDisplayTransferByByteTable(
	display: number,
	tableSize: number,
	redTable: interop.PointerConvertible,
	greenTable: interop.PointerConvertible,
	blueTable: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGDisplayRestoreColorSyncSettings(): void

export declare function CGDisplayIsCaptured(display: number): number

export declare function CGDisplayCapture(display: number): interop.Enum<typeof CGError>

export declare function CGDisplayCaptureWithOptions(
	display: number,
	options: interop.Enum<typeof CGCaptureOptions>,
): interop.Enum<typeof CGError>

export declare function CGDisplayRelease(display: number): interop.Enum<typeof CGError>

export declare function CGCaptureAllDisplays(): interop.Enum<typeof CGError>

export declare function CGCaptureAllDisplaysWithOptions(
	options: interop.Enum<typeof CGCaptureOptions>,
): interop.Enum<typeof CGError>

export declare function CGReleaseAllDisplays(): interop.Enum<typeof CGError>

export declare function CGShieldingWindowID(display: number): number

export declare function CGShieldingWindowLevel(): number

export declare function CGDisplayCreateImage(displayID: number): interop.Object

export declare function CGDisplayCreateImageForRect(display: number, rect: CGRect): interop.Object

export declare function CGDisplayHideCursor(display: number): interop.Enum<typeof CGError>

export declare function CGDisplayShowCursor(display: number): interop.Enum<typeof CGError>

export declare function CGDisplayMoveCursorToPoint(
	display: number,
	point: CGPoint,
): interop.Enum<typeof CGError>

export declare function CGGetLastMouseDelta(
	deltaX: interop.PointerConvertible,
	deltaY: interop.PointerConvertible,
): void

export declare function CGDisplayGetDrawingContext(display: number): interop.Object

export declare function CGDisplayAvailableModes(dsp: number): interop.Object

export declare function CGDisplayBestModeForParameters(
	display: number,
	bitsPerPixel: number,
	width: number,
	height: number,
	exactMatch: interop.PointerConvertible,
): interop.Object

export declare function CGDisplayBestModeForParametersAndRefreshRate(
	display: number,
	bitsPerPixel: number,
	width: number,
	height: number,
	refreshRate: number,
	exactMatch: interop.PointerConvertible,
): interop.Object

export declare function CGDisplayCurrentMode(display: number): interop.Object

export declare function CGDisplaySwitchToMode(
	display: number,
	mode: interop.Object,
): interop.Enum<typeof CGError>

export declare function CGBeginDisplayConfiguration(
	config: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGConfigureDisplayOrigin(
	config: interop.PointerConvertible,
	display: number,
	x: number,
	y: number,
): interop.Enum<typeof CGError>

export declare function CGConfigureDisplayWithDisplayMode(
	config: interop.PointerConvertible,
	display: number,
	mode: interop.Object,
	options: interop.Object,
): interop.Enum<typeof CGError>

export declare function CGConfigureDisplayStereoOperation(
	config: interop.PointerConvertible,
	display: number,
	stereo: number,
	forceBlueLine: number,
): interop.Enum<typeof CGError>

export declare function CGConfigureDisplayMirrorOfDisplay(
	config: interop.PointerConvertible,
	display: number,
	master: number,
): interop.Enum<typeof CGError>

export declare function CGCancelDisplayConfiguration(
	config: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGCompleteDisplayConfiguration(
	config: interop.PointerConvertible,
	option: interop.Enum<typeof CGConfigureOption>,
): interop.Enum<typeof CGError>

export declare function CGRestorePermanentDisplayConfiguration(): void

export declare function CGDisplayRegisterReconfigurationCallback(
	callback: (
		p1: number,
		p2: interop.Enum<typeof CGDisplayChangeSummaryFlags>,
		p3: interop.PointerConvertible,
	) => void,
	userInfo: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGDisplayRemoveReconfigurationCallback(
	callback: (
		p1: number,
		p2: interop.Enum<typeof CGDisplayChangeSummaryFlags>,
		p3: interop.PointerConvertible,
	) => void,
	userInfo: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGDisplaySetStereoOperation(
	display: number,
	stereo: number,
	forceBlueLine: number,
	option: interop.Enum<typeof CGConfigureOption>,
): interop.Enum<typeof CGError>

export declare function CGDisplayIsActive(display: number): number

export declare function CGDisplayIsAsleep(display: number): number

export declare function CGDisplayIsOnline(display: number): number

export declare function CGDisplayIsMain(display: number): number

export declare function CGDisplayIsBuiltin(display: number): number

export declare function CGDisplayIsInMirrorSet(display: number): number

export declare function CGDisplayIsAlwaysInMirrorSet(display: number): number

export declare function CGDisplayIsInHWMirrorSet(display: number): number

export declare function CGDisplayMirrorsDisplay(display: number): number

export declare function CGDisplayUsesOpenGLAcceleration(display: number): number

export declare function CGDisplayIsStereo(display: number): number

export declare function CGDisplayPrimaryDisplay(display: number): number

export declare function CGDisplayUnitNumber(display: number): number

export declare function CGDisplayVendorNumber(display: number): number

export declare function CGDisplayModelNumber(display: number): number

export declare function CGDisplaySerialNumber(display: number): number

export declare function CGDisplayIOServicePort(display: number): number

export declare function CGDisplayScreenSize(display: number): CGSize

export declare function CGDisplayRotation(display: number): number

export declare function CGDisplayCopyColorSpace(display: number): interop.Object

export declare function CGConfigureDisplayMode(
	config: interop.PointerConvertible,
	display: number,
	mode: interop.Object,
): interop.Enum<typeof CGError>

export declare function CGConfigureDisplayFadeEffect(
	config: interop.PointerConvertible,
	fadeOutSeconds: number,
	fadeInSeconds: number,
	fadeRed: number,
	fadeGreen: number,
	fadeBlue: number,
): interop.Enum<typeof CGError>

export declare function CGAcquireDisplayFadeReservation(
	seconds: number,
	token: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGReleaseDisplayFadeReservation(token: number): interop.Enum<typeof CGError>

export declare function CGDisplayFade(
	token: number,
	duration: number,
	startBlend: number,
	endBlend: number,
	redBlend: number,
	greenBlend: number,
	blueBlend: number,
	synchronous: number,
): interop.Enum<typeof CGError>

export declare function CGDisplayFadeOperationInProgress(): number

export declare function CGDisplayStreamUpdateGetTypeID(): number

export declare function CGDisplayStreamUpdateGetRects(
	updateRef: interop.Object,
	rectType: interop.Enum<typeof CGDisplayStreamUpdateRectType>,
	rectCount: interop.PointerConvertible,
): interop.Pointer

export declare function CGDisplayStreamUpdateCreateMergedUpdate(
	firstUpdate: interop.Object,
	secondUpdate: interop.Object,
): interop.Object

export declare function CGDisplayStreamUpdateGetMovedRectsDelta(
	updateRef: interop.Object,
	dx: interop.PointerConvertible,
	dy: interop.PointerConvertible,
): void

export declare function CGDisplayStreamUpdateGetDropCount(updateRef: interop.Object): number

export declare function CGDisplayStreamGetTypeID(): number

export declare function CGDisplayStreamCreate(
	display: number,
	outputWidth: number,
	outputHeight: number,
	pixelFormat: number,
	properties: interop.Object,
	handler: (
		p1: interop.Enum<typeof CGDisplayStreamFrameStatus>,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
): interop.Object

export declare function CGDisplayStreamCreateWithDispatchQueue(
	display: number,
	outputWidth: number,
	outputHeight: number,
	pixelFormat: number,
	properties: interop.Object,
	queue: NSObject,
	handler: (
		p1: interop.Enum<typeof CGDisplayStreamFrameStatus>,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
): interop.Object

export declare function CGDisplayStreamStart(
	displayStream: interop.Object,
): interop.Enum<typeof CGError>

export declare function CGDisplayStreamStop(
	displayStream: interop.Object,
): interop.Enum<typeof CGError>

export declare function CGDisplayStreamGetRunLoopSource(
	displayStream: interop.Object,
): interop.Object

export declare function CGRegisterScreenRefreshCallback(
	callback: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void,
	userInfo: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGUnregisterScreenRefreshCallback(
	callback: (p1: number, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void,
	userInfo: interop.PointerConvertible,
): void

export declare function CGWaitForScreenRefreshRects(
	rects: interop.PointerConvertible,
	count: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGScreenRegisterMoveCallback(
	callback: (
		p1: CGScreenUpdateMoveDelta,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	userInfo: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGScreenUnregisterMoveCallback(
	callback: (
		p1: CGScreenUpdateMoveDelta,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
	userInfo: interop.PointerConvertible,
): void

export declare function CGWaitForScreenUpdateRects(
	requestedOperations: interop.Enum<typeof CGScreenUpdateOperation>,
	currentOperation: interop.PointerConvertible,
	rects: interop.PointerConvertible,
	rectCount: interop.PointerConvertible,
	delta: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGReleaseScreenRefreshRects(rects: interop.PointerConvertible): void

export declare function CGCursorIsVisible(): number

export declare function CGCursorIsDrawnInFramebuffer(): number

export declare function CGWarpMouseCursorPosition(
	newCursorPosition: CGPoint,
): interop.Enum<typeof CGError>

export declare function CGAssociateMouseAndMouseCursorPosition(
	connected: number,
): interop.Enum<typeof CGError>

export declare function CGWindowServerCreateServerPort(): interop.Object

export declare function CGEnableEventStateCombining(
	combineState: number,
): interop.Enum<typeof CGError>

export declare function CGInhibitLocalEvents(inhibit: number): interop.Enum<typeof CGError>

export declare function CGPostMouseEvent(
	mouseCursorPosition: CGPoint,
	updateMouseCursorPosition: number,
	buttonCount: number,
	mouseButtonDown: number,
): interop.Enum<typeof CGError>

export declare function CGPostScrollWheelEvent(
	wheelCount: number,
	wheel1: number,
): interop.Enum<typeof CGError>

export declare function CGPostKeyboardEvent(
	keyChar: number,
	virtualKey: number,
	keyDown: number,
): interop.Enum<typeof CGError>

export declare function CGSetLocalEventsFilterDuringSuppressionState(
	filter: interop.Enum<typeof CGEventFilterMask>,
	state: interop.Enum<typeof CGEventSuppressionState>,
): interop.Enum<typeof CGError>

export declare function CGSetLocalEventsSuppressionInterval(
	seconds: number,
): interop.Enum<typeof CGError>

export declare function CGWindowServerCFMachPort(): interop.Object

export declare function CGEventGetTypeID(): number

export declare function CGEventCreate(source: interop.Object): interop.Object

export declare function CGEventCreateData(
	allocator: interop.Object,
	event: interop.Object,
): interop.Object

export declare function CGEventCreateFromData(
	allocator: interop.Object,
	data: interop.Object,
): interop.Object

export declare function CGEventCreateMouseEvent(
	source: interop.Object,
	mouseType: interop.Enum<typeof CGEventType>,
	mouseCursorPosition: CGPoint,
	mouseButton: interop.Enum<typeof CGMouseButton>,
): interop.Object

export declare function CGEventCreateKeyboardEvent(
	source: interop.Object,
	virtualKey: number,
	keyDown: boolean,
): interop.Object

export declare function CGEventCreateScrollWheelEvent(
	source: interop.Object,
	units: interop.Enum<typeof CGScrollEventUnit>,
	wheelCount: number,
	wheel1: number,
): interop.Object

export declare function CGEventCreateScrollWheelEvent2(
	source: interop.Object,
	units: interop.Enum<typeof CGScrollEventUnit>,
	wheelCount: number,
	wheel1: number,
	wheel2: number,
	wheel3: number,
): interop.Object

export declare function CGEventCreateCopy(event: interop.Object): interop.Object

export declare function CGEventCreateSourceFromEvent(event: interop.Object): interop.Object

export declare function CGEventSetSource(event: interop.Object, source: interop.Object): void

export declare function CGEventGetType(event: interop.Object): interop.Enum<typeof CGEventType>

export declare function CGEventSetType(
	event: interop.Object,
	type: interop.Enum<typeof CGEventType>,
): void

export declare function CGEventGetTimestamp(event: interop.Object): number

export declare function CGEventSetTimestamp(event: interop.Object, timestamp: number): void

export declare function CGEventGetLocation(event: interop.Object): CGPoint

export declare function CGEventGetUnflippedLocation(event: interop.Object): CGPoint

export declare function CGEventSetLocation(event: interop.Object, location: CGPoint): void

export declare function CGEventGetFlags(event: interop.Object): interop.Enum<typeof CGEventFlags>

export declare function CGEventSetFlags(
	event: interop.Object,
	flags: interop.Enum<typeof CGEventFlags>,
): void

export declare function CGEventKeyboardGetUnicodeString(
	event: interop.Object,
	maxStringLength: number,
	actualStringLength: interop.PointerConvertible,
	unicodeString: interop.PointerConvertible,
): void

export declare function CGEventKeyboardSetUnicodeString(
	event: interop.Object,
	stringLength: number,
	unicodeString: interop.PointerConvertible,
): void

export declare function CGEventGetIntegerValueField(
	event: interop.Object,
	field: interop.Enum<typeof CGEventField>,
): number

export declare function CGEventSetIntegerValueField(
	event: interop.Object,
	field: interop.Enum<typeof CGEventField>,
	value: number,
): void

export declare function CGEventGetDoubleValueField(
	event: interop.Object,
	field: interop.Enum<typeof CGEventField>,
): number

export declare function CGEventSetDoubleValueField(
	event: interop.Object,
	field: interop.Enum<typeof CGEventField>,
	value: number,
): void

export declare function CGEventTapCreate(
	tap: interop.Enum<typeof CGEventTapLocation>,
	place: interop.Enum<typeof CGEventTapPlacement>,
	options: interop.Enum<typeof CGEventTapOptions>,
	eventsOfInterest: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof CGEventType>,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => interop.Pointer,
	userInfo: interop.PointerConvertible,
): interop.Object

export declare function CGEventTapCreateForPSN(
	processSerialNumber: interop.PointerConvertible,
	place: interop.Enum<typeof CGEventTapPlacement>,
	options: interop.Enum<typeof CGEventTapOptions>,
	eventsOfInterest: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof CGEventType>,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => interop.Pointer,
	userInfo: interop.PointerConvertible,
): interop.Object

export declare function CGEventTapCreateForPid(
	pid: number,
	place: interop.Enum<typeof CGEventTapPlacement>,
	options: interop.Enum<typeof CGEventTapOptions>,
	eventsOfInterest: number,
	callback: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof CGEventType>,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => interop.Pointer,
	userInfo: interop.PointerConvertible,
): interop.Object

export declare function CGEventTapEnable(tap: interop.Object, enable: boolean): void

export declare function CGEventTapIsEnabled(tap: interop.Object): boolean

export declare function CGEventTapPostEvent(
	proxy: interop.PointerConvertible,
	event: interop.Object,
): void

export declare function CGEventPost(
	tap: interop.Enum<typeof CGEventTapLocation>,
	event: interop.Object,
): void

export declare function CGEventPostToPSN(
	processSerialNumber: interop.PointerConvertible,
	event: interop.Object,
): void

export declare function CGEventPostToPid(pid: number, event: interop.Object): void

export declare function CGGetEventTapList(
	maxNumberOfTaps: number,
	tapList: interop.PointerConvertible,
	eventTapCount: interop.PointerConvertible,
): interop.Enum<typeof CGError>

export declare function CGPreflightListenEventAccess(): boolean

export declare function CGRequestListenEventAccess(): boolean

export declare function CGPreflightPostEventAccess(): boolean

export declare function CGRequestPostEventAccess(): boolean

export declare function CGEventSourceGetTypeID(): number

export declare function CGEventSourceCreate(
	stateID: interop.Enum<typeof CGEventSourceStateID>,
): interop.Object

export declare function CGEventSourceGetKeyboardType(source: interop.Object): number

export declare function CGEventSourceSetKeyboardType(
	source: interop.Object,
	keyboardType: number,
): void

export declare function CGEventSourceGetPixelsPerLine(source: interop.Object): number

export declare function CGEventSourceSetPixelsPerLine(
	source: interop.Object,
	pixelsPerLine: number,
): void

export declare function CGEventSourceGetSourceStateID(
	source: interop.Object,
): interop.Enum<typeof CGEventSourceStateID>

export declare function CGEventSourceButtonState(
	stateID: interop.Enum<typeof CGEventSourceStateID>,
	button: interop.Enum<typeof CGMouseButton>,
): boolean

export declare function CGEventSourceKeyState(
	stateID: interop.Enum<typeof CGEventSourceStateID>,
	key: number,
): boolean

export declare function CGEventSourceFlagsState(
	stateID: interop.Enum<typeof CGEventSourceStateID>,
): interop.Enum<typeof CGEventFlags>

export declare function CGEventSourceSecondsSinceLastEventType(
	stateID: interop.Enum<typeof CGEventSourceStateID>,
	eventType: interop.Enum<typeof CGEventType>,
): number

export declare function CGEventSourceCounterForEventType(
	stateID: interop.Enum<typeof CGEventSourceStateID>,
	eventType: interop.Enum<typeof CGEventType>,
): number

export declare function CGEventSourceSetUserData(source: interop.Object, userData: number): void

export declare function CGEventSourceGetUserData(source: interop.Object): number

export declare function CGEventSourceSetLocalEventsFilterDuringSuppressionState(
	source: interop.Object,
	filter: interop.Enum<typeof CGEventFilterMask>,
	state: interop.Enum<typeof CGEventSuppressionState>,
): void

export declare function CGEventSourceGetLocalEventsFilterDuringSuppressionState(
	source: interop.Object,
	state: interop.Enum<typeof CGEventSuppressionState>,
): interop.Enum<typeof CGEventFilterMask>

export declare function CGEventSourceSetLocalEventsSuppressionInterval(
	source: interop.Object,
	seconds: number,
): void

export declare function CGEventSourceGetLocalEventsSuppressionInterval(
	source: interop.Object,
): number

export declare function CGPSConverterCreate(
	info: interop.PointerConvertible,
	callbacks: interop.PointerConvertible,
	options: interop.Object,
): interop.Object

export declare function CGPSConverterConvert(
	converter: interop.Object,
	provider: interop.Object,
	consumer: interop.Object,
	options: interop.Object,
): boolean

export declare function CGPSConverterAbort(converter: interop.Object): boolean

export declare function CGPSConverterIsConverting(converter: interop.Object): boolean

export declare function CGPSConverterGetTypeID(): number

export declare function CGSessionCopyCurrentDictionary(): interop.Object

export declare function CGDirectDisplayCopyCurrentMetalDevice(display: number): MTLDevice
