import type { CGPoint, CGRect } from './CoreFoundation'

import type { NSObjectProtocol } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const UIAxis: {
	Neither: 0
	Horizontal: 1
	Vertical: 2
	Both: 3
}

export declare const UIRectEdge: {
	None: 0
	Top: 1
	Left: 2
	Bottom: 4
	Right: 8
	All: 15
}

export declare interface UICoordinateSpace extends NSObjectProtocol {
	convertPointToCoordinateSpace(point: CGPoint, coordinateSpace: UICoordinateSpace): CGPoint

	convertPointFromCoordinateSpace(point: CGPoint, coordinateSpace: UICoordinateSpace): CGPoint

	convertRectToCoordinateSpace(rect: CGRect, coordinateSpace: UICoordinateSpace): CGRect

	convertRectFromCoordinateSpace(rect: CGRect, coordinateSpace: UICoordinateSpace): CGRect

	readonly bounds: CGRect
}

export declare class UICoordinateSpace extends NativeObject implements UICoordinateSpace {}
