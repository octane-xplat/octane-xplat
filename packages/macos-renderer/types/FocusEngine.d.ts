/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const UIFocusMovementDidFailNotification: string;

declare const UIFocusGroupPriorityCurrentlyFocused: number;

declare const UIFocusGroupPriorityPreviouslyFocused: number;

declare const UIFocusUpdateContextKey: string;

declare const UIFocusDidUpdateNotification: string;

declare const UIFocusGroupPriorityPrioritized: number;

declare const UIFocusGroupPriorityIgnored: number;

declare const UIFocusItemDeferralMode: {
  Automatic: 0,
  Always: 1,
  Never: 2,
};

declare const UIFocusHeading: {
  None: 0,
  Up: 1,
  Down: 2,
  Left: 4,
  Right: 8,
  Next: 16,
  Previous: 32,
  First: 256,
  Last: 512,
};

declare interface UIFocusItemScrollableContainer extends UIFocusItemContainer {
  contentOffset: CGPoint;

  readonly contentSize: CGSize;

  readonly visibleSize: CGSize;
}

declare class UIFocusItemScrollableContainer extends NativeObject implements UIFocusItemScrollableContainer {
}

declare interface UIFocusItem extends UIFocusEnvironment {
  readonly canBecomeFocused: boolean;

  readonly frame: CGRect;

  readonly focusGroupPriority?: number;

  readonly focusItemDeferralMode?: interop.Enum<typeof UIFocusItemDeferralMode>;

  readonly isTransparentFocusItem?: boolean;
}

declare class UIFocusItem extends NativeObject implements UIFocusItem {
}

declare interface UIFocusDebuggerOutput extends NSObjectProtocol {
}

declare class UIFocusDebuggerOutput extends NativeObject implements UIFocusDebuggerOutput {
}

declare interface UIFocusItemContainer extends NSObjectProtocol {
  readonly coordinateSpace: UICoordinateSpace;

  focusItemsInRect(rect: CGRect): NSArray;
}

declare class UIFocusItemContainer extends NativeObject implements UIFocusItemContainer {
}

declare interface UIFocusEnvironment extends NSObjectProtocol {
  readonly preferredFocusEnvironments: NSArray;

  readonly parentFocusEnvironment: UIFocusEnvironment;

  readonly focusItemContainer: UIFocusItemContainer;

  setNeedsFocusUpdate(): void;

  updateFocusIfNeeded(): void;

  shouldUpdateFocusInContext(context: UIFocusUpdateContext): boolean;

  didUpdateFocusInContext(context: UIFocusUpdateContext): void;

  readonly focusGroupIdentifier?: string;
}

declare class UIFocusEnvironment extends NativeObject implements UIFocusEnvironment {
}

declare class UIFocusUpdateContext extends NSObject {
  readonly previouslyFocusedItem: UIFocusItem;

  readonly nextFocusedItem: UIFocusItem;

  readonly focusHeading: interop.Enum<typeof UIFocusHeading>;
}

declare class UIFocusSystem extends NSObject {
  readonly focusedItem: UIFocusItem;

  static focusSystemForEnvironment(environment: UIFocusEnvironment): UIFocusSystem;

  requestFocusUpdateToEnvironment(environment: UIFocusEnvironment): void;

  updateFocusIfNeeded(): void;

  static environmentContainsEnvironment(environment: UIFocusEnvironment, otherEnvironment: UIFocusEnvironment): boolean;
}

declare class UIFocusDebugger extends NSObject {
  static help(): UIFocusDebuggerOutput;

  static status(): UIFocusDebuggerOutput;

  static checkFocusabilityForItem(item: UIFocusItem): UIFocusDebuggerOutput;

  static simulateFocusUpdateRequestFromEnvironment(environment: UIFocusEnvironment): UIFocusDebuggerOutput;

  static focusGroupsForEnvironment(environment: UIFocusEnvironment): UIFocusDebuggerOutput;

  static preferredFocusEnvironmentsForEnvironment(environment: UIFocusEnvironment): UIFocusDebuggerOutput;
}

