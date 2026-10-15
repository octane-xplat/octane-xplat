import type { CGPoint, CGRect } from './CoreFoundation'

import type { NSArray, NSCoder, NSCopying, NSData, NSSecureCoding, NSURL, _NSRange } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const BEAccessibilityOrientation: {
  Unknown: 0,
  Vertical: 1,
  Horizontal: 2,
};

export declare const BEAccessibilityPressedState: {
  Undefined: 0,
  False: 1,
  True: 2,
  Mixed: 3,
};

export declare const BEGestureType: {
  Loupe: 0,
  OneFingerTap: 1,
  DoubleTapAndHold: 2,
  DoubleTap: 3,
  OneFingerDoubleTap: 8,
  OneFingerTripleTap: 9,
  TwoFingerSingleTap: 10,
  TwoFingerRangedSelectGesture: 11,
  IMPhraseBoundaryDrag: 14,
  ForceTouch: 15,
};

export declare const BEAccessibilityContainerType: {
  None: 0,
  Landmark: 1,
  Table: 2,
  List: 4,
  Fieldset: 8,
  Dialog: 16,
  Tree: 32,
  Frame: 64,
  Article: 128,
  SemanticGroup: 256,
  ScrollArea: 512,
  Alert: 1024,
  DescriptionList: 2048,
};

export declare const BESelectionTouchPhase: {
  Started: 0,
  Moved: 1,
  Ended: 2,
  EndedMovingForward: 3,
  EndedMovingBackward: 4,
  EndedNotMoving: 5,
};

export declare const BESelectionFlags: {
  SelectionFlagsNone: 0,
  WordIsNearTap: 1,
  SelectionFlipped: 2,
  PhraseBoundaryChanged: 4,
};

export declare interface BETextInputDelegate {
  shouldDeferEventHandlingToSystemForTextInputContext(textInput: BETextInput, keyEventContext: interop.Object): boolean;

  textInputSetCandidateSuggestions(textInput: BETextInput, suggestions: NSArray<interop.Object> | Array<interop.Object> | null): void;

  selectionWillChangeForTextInput(textInput: BETextInput): void;

  selectionDidChangeForTextInput(textInput: BETextInput): void;

  textInputDeferReplaceTextActionToSystem(textInput: BETextInput, sender: interop.Object): void;

  invalidateTextEntryContextForTextInput(textInput: BETextInput): void;
}

export declare class BETextInputDelegate extends NativeObject implements BETextInputDelegate {
}

export declare interface BETextInteractionDelegate {
  systemWillChangeSelectionForInteraction(textInteraction: interop.Object): void;

  systemDidChangeSelectionForInteraction(textInteraction: interop.Object): void;
}

export declare class BETextInteractionDelegate extends NativeObject implements BETextInteractionDelegate {
}

export declare interface BEAccessibilityTextMarkerSupport extends NSObjectProtocol {
  accessibilityBoundsForTextMarkerRange(range: BEAccessibilityTextMarkerRange): CGRect;

  accessibilityContentForTextMarkerRange(range: BEAccessibilityTextMarkerRange): string;

  accessibilityTextMarkerRangeForCurrentSelection(): BEAccessibilityTextMarkerRange;

  accessibilityTextMarkerRange(): BEAccessibilityTextMarkerRange;

  accessibilityNextTextMarker(marker: BEAccessibilityTextMarker): BEAccessibilityTextMarker;

  accessibilityPreviousTextMarker(marker: BEAccessibilityTextMarker): BEAccessibilityTextMarker;

  accessibilityLineEndMarkerForMarker(marker: BEAccessibilityTextMarker): BEAccessibilityTextMarker;

  accessibilityLineStartMarkerForMarker(marker: BEAccessibilityTextMarker): BEAccessibilityTextMarker;

  accessibilityMarkerForPoint(point: CGPoint): BEAccessibilityTextMarker;

  accessibilityTextMarkerForPosition(position: number): BEAccessibilityTextMarker;

  accessibilityTextMarkerRangeForRange(range: _NSRange): BEAccessibilityTextMarkerRange;

  accessibilityRangeForTextMarkerRange(range: BEAccessibilityTextMarkerRange): _NSRange;
}

export declare class BEAccessibilityTextMarkerSupport extends NativeObject implements BEAccessibilityTextMarkerSupport {
}

export declare class BEAccessibilityTextMarker extends NSObject implements NSCopying, NSSecureCoding {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class BEWebAppManifest extends NSObject {
  initWithJSONDataManifestURL(jsonData: NSData, manifestURL: NSURL): this;

  readonly jsonData: NSData;

  readonly manifestURL: NSURL;
}

export declare class BETextSuggestion extends NSObject {
  initWithInputText(inputText: string): this;

  readonly inputText: string;
}

export declare class BETextAlternatives extends NSObject {
  readonly primaryString: string;

  readonly alternativeStrings: NSArray;
}

export declare class BEAccessibilityTextMarkerRange extends NSObject implements NSCopying, NSSecureCoding {
  startMarker: BEAccessibilityTextMarker;

  endMarker: BEAccessibilityTextMarker;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}
