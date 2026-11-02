/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const AXCustomContentImportance: {
	Default: 0
	High: 1
}

declare const AXNumericDataAxisDescriptorScale: {
	Linear: 0
	Log10: 1
	Ln: 2
}

declare const AXChartDescriptorContentDirection: {
	LeftToRight: 0
	RightToLeft: 1
	TopToBottom: 2
	BottomToTop: 3
	RadialClockwise: 4
	RadialCounterClockwise: 5
}

declare function AXNameFromColor(color: interop.Object): string

declare interface AXMathExpressionProvider extends NSObjectProtocol {}

declare class AXMathExpressionProvider extends NativeObject implements AXMathExpressionProvider {}

declare interface AXCustomContentProvider extends NSObjectProtocol {
	get accessibilityCustomContent(): NSArray
	set accessibilityCustomContent(value: NSArray<interop.Object> | Array<interop.Object>)
}

declare class AXCustomContentProvider extends NativeObject implements AXCustomContentProvider {}

declare interface AXBrailleMapRenderer extends NSObjectProtocol {}

declare class AXBrailleMapRenderer extends NativeObject implements AXBrailleMapRenderer {}

declare class AXCustomContent extends NSObject implements NSCopying, NSSecureCoding {
	static customContentWithLabelValue<This extends abstract new (...args: any) => any>(
		this: This,
		label: string,
		value: string,
	): InstanceType<This>

	static customContentWithAttributedLabelAttributedValue<
		This extends abstract new (...args: any) => any,
	>(this: This, label: NSAttributedString, value: NSAttributedString): InstanceType<This>

	readonly label: string

	readonly attributedLabel: NSAttributedString

	readonly value: string

	readonly attributedValue: NSAttributedString

	importance: interop.Enum<typeof AXCustomContentImportance>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
