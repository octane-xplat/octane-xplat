import type { CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { NSArray } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { UICoordinateSpace } from './UIUtilities'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const UIFocusMovementDidFailNotification: string

export declare const UIFocusGroupPriorityCurrentlyFocused: number

export declare const UIFocusGroupPriorityPreviouslyFocused: number

export declare const UIFocusUpdateContextKey: string

export declare const UIFocusDidUpdateNotification: string

export declare const UIFocusGroupPriorityPrioritized: number

export declare const UIFocusGroupPriorityIgnored: number

export declare const UIFocusItemDeferralMode: {
	Automatic: 0
	Always: 1
	Never: 2
}

export declare const UIFocusHeading: {
	None: 0
	Up: 1
	Down: 2
	Left: 4
	Right: 8
	Next: 16
	Previous: 32
	First: 256
	Last: 512
}

export declare interface UIFocusItemScrollableContainer extends UIFocusItemContainer {
	contentOffset: CGPoint

	readonly contentSize: CGSize

	readonly visibleSize: CGSize
}

export declare class UIFocusItemScrollableContainer
	extends NativeObject
	implements UIFocusItemScrollableContainer {}

export declare interface UIFocusItem extends UIFocusEnvironment {
	readonly canBecomeFocused: boolean

	readonly frame: CGRect

	readonly focusGroupPriority?: number

	readonly focusItemDeferralMode?: interop.Enum<typeof UIFocusItemDeferralMode>

	readonly isTransparentFocusItem?: boolean
}

export declare class UIFocusItem extends NativeObject implements UIFocusItem {}

export declare interface UIFocusDebuggerOutput extends NSObjectProtocol {}

export declare class UIFocusDebuggerOutput extends NativeObject implements UIFocusDebuggerOutput {}

export declare interface UIFocusItemContainer extends NSObjectProtocol {
	readonly coordinateSpace: UICoordinateSpace

	focusItemsInRect(rect: CGRect): NSArray
}

export declare class UIFocusItemContainer extends NativeObject implements UIFocusItemContainer {}

export declare interface UIFocusEnvironment extends NSObjectProtocol {
	readonly preferredFocusEnvironments: NSArray

	readonly parentFocusEnvironment: UIFocusEnvironment

	readonly focusItemContainer: UIFocusItemContainer

	setNeedsFocusUpdate(): void

	updateFocusIfNeeded(): void

	shouldUpdateFocusInContext(context: UIFocusUpdateContext): boolean

	didUpdateFocusInContext(context: UIFocusUpdateContext): void

	readonly focusGroupIdentifier?: string
}

export declare class UIFocusEnvironment extends NativeObject implements UIFocusEnvironment {}

export declare class UIFocusUpdateContext extends NSObject {
	readonly previouslyFocusedItem: UIFocusItem

	readonly nextFocusedItem: UIFocusItem

	readonly focusHeading: interop.Enum<typeof UIFocusHeading>
}

export declare class UIFocusSystem extends NSObject {
	readonly focusedItem: UIFocusItem

	static focusSystemForEnvironment(environment: UIFocusEnvironment): UIFocusSystem

	requestFocusUpdateToEnvironment(environment: UIFocusEnvironment): void

	updateFocusIfNeeded(): void

	static environmentContainsEnvironment(
		environment: UIFocusEnvironment,
		otherEnvironment: UIFocusEnvironment,
	): boolean
}

export declare class UIFocusDebugger extends NSObject {
	static help(): UIFocusDebuggerOutput

	static status(): UIFocusDebuggerOutput

	static checkFocusabilityForItem(item: UIFocusItem): UIFocusDebuggerOutput

	static simulateFocusUpdateRequestFromEnvironment(
		environment: UIFocusEnvironment,
	): UIFocusDebuggerOutput

	static focusGroupsForEnvironment(environment: UIFocusEnvironment): UIFocusDebuggerOutput

	static preferredFocusEnvironmentsForEnvironment(
		environment: UIFocusEnvironment,
	): UIFocusDebuggerOutput
}
