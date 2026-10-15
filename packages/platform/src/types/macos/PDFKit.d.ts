import type { NSAnimation, NSAnimationDelegate, NSBezierPath, NSColor, NSEvent, NSFont, NSImage, NSMenu, NSMenuDelegate, NSMenuItem, NSPrintInfo, NSPrintOperation, NSScreen } from './AppKit'

import type { CGAffineTransform, CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { NSArray, NSAttributedString, NSCoder, NSCoding, NSCopying, NSData, NSDate, NSDictionary, NSEdgeInsets, NSNotification, NSURL, _NSRange } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSTextAlignment, NSView } from './AppKit'

import { NSComparisonResult, NSStringCompareOptions } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const PDFViewVisiblePagesChangedNotification: string;

export declare const PDFViewSelectionChangedNotification: string;

export declare const PDFViewAnnotationWillHitNotification: string;

export declare const PDFViewPrintPermissionNotification: string;

export declare const PDFViewCopyPermissionNotification: string;

export declare const PDFViewAnnotationHitNotification: string;

export declare const PDFViewPageChangedNotification: string;

export declare const PDFViewChangedHistoryNotification: string;

export declare const PDFDocumentUserPasswordOption: string;

export declare const PDFDocumentOwnerPasswordOption: string;

export declare const PDFDocumentModificationDateAttribute: string;

export declare const PDFDocumentCreationDateAttribute: string;

export declare const PDFDocumentProducerAttribute: string;

export declare const PDFDocumentCreatorAttribute: string;

export declare const PDFDocumentSubjectAttribute: string;

export declare const PDFDocumentAuthorAttribute: string;

export declare const PDFDocumentDidBeginPageWriteNotification: string;

export declare const PDFDocumentDidBeginWriteNotification: string;

export declare const PDFDocumentDidFindMatchNotification: string;

export declare const PDFDocumentDidBeginPageFindNotification: string;

export declare const PDFDocumentDidEndFindNotification: string;

export declare const PDFDocumentDidBeginFindNotification: string;

export declare const PDFBorderKeyDashPattern: string;

export declare const PDFBorderKeyStyle: string;

export declare const PDFAppearanceCharacteristicsKeyBorderColor: string;

export declare const PDFAppearanceCharacteristicsKeyBackgroundColor: string;

export declare const PDFAnnotationHighlightingModeOutline: string;

export declare const PDFAnnotationHighlightingModeInvert: string;

export declare const PDFAnnotationTextIconTypeNewParagraph: string;

export declare const PDFAnnotationTextIconTypeNote: string;

export declare const PDFAnnotationLineEndingStyleClosedArrow: string;

export declare const PDFAnnotationLineEndingStyleDiamond: string;

export declare const PDFAnnotationLineEndingStyleCircle: string;

export declare const PDFAnnotationLineEndingStyleSquare: string;

export declare const PDFAnnotationWidgetSubtypeText: string;

export declare const PDFAnnotationWidgetSubtypeSignature: string;

export declare const PDFAnnotationWidgetSubtypeChoice: string;

export declare const PDFAnnotationWidgetSubtypeButton: string;

export declare const PDFAnnotationSubtypeWidget: string;

export declare const PDFAnnotationSubtypePopup: string;

export declare const PDFAnnotationSubtypeStamp: string;

export declare const PDFAnnotationSubtypeInk: string;

export declare const PDFAnnotationSubtypeStrikeOut: string;

export declare const PDFAnnotationSubtypeUnderline: string;

export declare const PDFAnnotationSubtypeHighlight: string;

export declare const PDFAnnotationSubtypeCircle: string;

export declare const PDFAnnotationSubtypeLine: string;

export declare const PDFAnnotationSubtypeLink: string;

export declare const kPDFAnnotationKey_WidgetValue: string;

export declare const kPDFAnnotationKey_WidgetOptions: string;

export declare const kPDFAnnotationKey_WidgetAppearanceDictionary: string;

export declare const kPDFAnnotationKey_WidgetFieldType: string;

export declare const kPDFAnnotationKey_WidgetFieldFlags: string;

export declare const kPDFAnnotationKey_WidgetDefaultValue: string;

export declare const kPDFAnnotationKey_TextLabel: string;

export declare const kPDFAnnotationKey_Quadding: string;

export declare const kPDFAnnotationKey_Parent: string;

export declare const kPDFAnnotationKey_Open: string;

export declare const kPDFAnnotationKey_LinePoints: string;

export declare const kPDFAnnotationKey_HighlightingMode: string;

export declare const kPDFAnnotationKey_Destination: string;

export declare const kPDFAnnotationKey_DefaultAppearance: string;

export declare const kPDFAnnotationKey_BorderStyle: string;

export declare const kPDFAnnotationKey_Subtype: string;

export declare const kPDFAnnotationKey_Name: string;

export declare const kPDFAnnotationKey_Date: string;

export declare const kPDFAnnotationKey_Contents: string;

export declare const kPDFAnnotationKey_Color: string;

export declare const kPDFAnnotationKey_AppearanceState: string;

export declare const PDFAnnotationKeyWidgetOptions: string;

export declare const PDFAnnotationKeyWidgetAppearanceDictionary: string;

export declare const PDFAnnotationKeyWidgetDefaultValue: string;

export declare const PDFAnnotationKeyWidgetBorderColor: string;

export declare const PDFAnnotationKeyWidgetDownCaption: string;

export declare const PDFAnnotationKeyTextLabel: string;

export declare const PDFAnnotationKeyQuadPoints: string;

export declare const PDFAnnotationKeyPopup: string;

export declare const PDFAnnotationKeyParent: string;

export declare const PDFAnnotationKeyIconName: string;

export declare const PDFAnnotationKeyLinePoints: string;

export declare const PDFAnnotationKeyHighlightingMode: string;

export declare const PDFAnnotationKeyDefaultAppearance: string;

export declare const PDFAnnotationKeyBorderStyle: string;

export declare const PDFAnnotationKeyAdditionalActions: string;

export declare const PDFAnnotationKeyAction: string;

export declare const PDFAnnotationKeyRect: string;

export declare const PDFAnnotationKeyDate: string;

export declare const PDFAnnotationKeyFlags: string;

export declare const PDFAnnotationKeyColor: string;

export declare const PDFAnnotationKeyAppearanceState: string;

export declare const PDFAnnotationKeyAppearanceDictionary: string;

export declare const kPDFAnnotationKey_WidgetMaxLen: string;

export declare const PDFThumbnailViewDocumentEditedNotification: string;

export declare const PDFDocumentDidEndPageWriteNotification: string;

export declare const PDFAnnotationKeyLineEndingStyles: string;

export declare const kPDFAnnotationKey_Flags: string;

export declare const PDFAppearanceCharacteristicsKeyCaption: string;

export declare const PDFAnnotationKeyWidgetTextLabelUI: string;

export declare const PDFAnnotationTextIconTypeHelp: string;

export declare const PDFDocumentDidUnlockNotification: string;

export declare const PDFDocumentDidEndPageFindNotification: string;

export declare const PDFAnnotationSubtypeFreeText: string;

export declare const kPDFAnnotationKey_IconName: string;

export declare const kPDFAnnotationKey_InteriorColor: string;

export declare const kPDFAnnotationKey_Popup: string;

export declare const PDFAnnotationLineEndingStyleOpenArrow: string;

export declare const PDFAnnotationKeyOpen: string;

export declare const PDFViewScaleChangedNotification: string;

export declare const PDFDocumentTitleAttribute: string;

export declare const PDFAnnotationSubtypeSquare: string;

export declare const PDFAnnotationKeyContents: string;

export declare const PDFAnnotationSubtypeText: string;

export declare const PDFAnnotationKeyWidgetMaxLen: string;

export declare const PDFAnnotationKeyWidgetValue: string;

export declare const PDFAnnotationHighlightingModePush: string;

export declare const PDFAnnotationKeyInklist: string;

export declare const PDFViewDocumentChangedNotification: string;

export declare const PDFAnnotationTextIconTypeKey: string;

export declare const PDFAnnotationLineEndingStyleNone: string;

export declare const kPDFAnnotationKey_AppearanceDictionary: string;

export declare const PDFAnnotationKeyWidgetRotation: string;

export declare const PDFAnnotationKeyWidgetRolloverCaption: string;

export declare const PDFViewDisplayModeChangedNotification: string;

export declare const PDFAppearanceCharacteristicsKeyRolloverCaption: string;

export declare const kPDFAnnotationKey_WidgetTextLabelUI: string;

export declare const kPDFAnnotationKey_QuadPoints: string;

export declare const PDFAnnotationHighlightingModeNone: string;

export declare const PDFAnnotationKeyWidgetFieldType: string;

export declare const PDFAppearanceCharacteristicsKeyRotation: string;

export declare const PDFAnnotationKeyDestination: string;

export declare const PDFAnnotationKeyQuadding: string;

export declare const PDFDocumentKeywordsAttribute: string;

export declare const PDFAnnotationKeySubtype: string;

export declare const PDFAnnotationTextIconTypeComment: string;

export declare const kPDFAnnotationKey_Page: string;

export declare const kPDFAnnotationKey_Border: string;

export declare const PDFAnnotationTextIconTypeParagraph: string;

export declare const kPDFAnnotationKey_Rect: string;

export declare const PDFDocumentDidEndWriteNotification: string;

export declare const PDFAnnotationKeyInteriorColor: string;

export declare const kPDFDestinationUnspecifiedValue: number;

export declare const PDFBorderKeyLineWidth: string;

export declare const PDFAppearanceCharacteristicsKeyDownCaption: string;

export declare const PDFAnnotationKeyWidgetFieldFlags: string;

export declare const PDFAnnotationKeyBorder: string;

export declare const PDFAnnotationKeyName: string;

export declare const PDFViewDisplayBoxChangedNotification: string;

export declare const PDFAnnotationKeyPage: string;

export declare const PDFAnnotationKeyWidgetBackgroundColor: string;

export declare const kPDFAnnotationKey_AdditionalActions: string;

export declare const PDFAnnotationTextIconTypeInsert: string;

export declare const kPDFAnnotationKey_LineEndingStyles: string;

export declare const kPDFAnnotationKey_Action: string;

export declare const PDFAnnotationKeyWidgetCaption: string;

export declare const kPDFAnnotationKey_Inklist: string;

export declare const PDFInterpolationQuality: {
  None: 0,
  Low: 1,
  High: 2,
};

export declare const PDFDisplayMode: {
  SinglePage: 0,
  SinglePageContinuous: 1,
  TwoUp: 2,
  TwoUpContinuous: 3,
};

export declare const PDFAccessPermissions: {
  LowQualityPrinting: 1,
  HighQualityPrinting: 2,
  DocumentChanges: 4,
  DocumentAssembly: 8,
  ContentCopying: 16,
  ContentAccessibility: 32,
  Commenting: 64,
  FormFieldEntry: 128,
};

export declare const PDFPrintScalingMode: {
  None: 0,
  ToFit: 1,
  DownToFit: 2,
};

export declare const PDFWidgetControlType: {
  Unknown: -1,
  PushButton: 0,
  RadioButton: 1,
  CheckBox: 2,
};

export declare const PDFLineStyle: {
  None: 0,
  Square: 1,
  Circle: 2,
  Diamond: 3,
  OpenArrow: 4,
  ClosedArrow: 5,
};

export declare const PDFDisplayBox: {
  Media: 0,
  Crop: 1,
  Bleed: 2,
  Trim: 3,
  Art: 4,
};

export declare const PDFActionNamedName: {
  None: 0,
  NextPage: 1,
  PreviousPage: 2,
  FirstPage: 3,
  LastPage: 4,
  GoBack: 5,
  GoForward: 6,
  GoToPage: 7,
  Find: 8,
  Print: 9,
  ZoomIn: 10,
  ZoomOut: 11,
};

export declare const PDFDocumentPermissions: {
  None: 0,
  User: 1,
  Owner: 2,
};

export declare const PDFTextAnnotationIconType: {
  Comment: 0,
  Key: 1,
  Note: 2,
  Help: 3,
  NewParagraph: 4,
  Paragraph: 5,
  Insert: 6,
};

export declare const PDFBorderStyle: {
  Solid: 0,
  Dashed: 1,
  Beveled: 2,
  Inset: 3,
  Underline: 4,
};

export declare const PDFAreaOfInterest: {
  No: 0,
  Page: 1,
  Text: 2,
  Annotation: 4,
  Link: 8,
  Control: 16,
  TextField: 32,
  Icon: 64,
  Popup: 128,
  Image: 256,
  Any: 9223372036854775807,
};

export declare const PDFSelectionGranularity: {
  Character: 0,
  Word: 1,
  Line: 2,
};

export declare const PDFMarkupType: {
  Highlight: 0,
  StrikeOut: 1,
  Underline: 2,
  Redact: 3,
};

export declare const PDFWidgetCellState: {
  Mixed: -1,
  Off: 0,
  On: 1,
};

export declare const PDFDisplayDirection: {
  Vertical: 0,
  Horizontal: 1,
};

export declare interface PDFViewDelegate extends NSObjectProtocol {
  PDFViewWillClickOnLinkWithURL?(sender: PDFView, url: NSURL): void;

  PDFViewWillChangeScaleFactorToScale?(sender: PDFView, scaler: number): number;

  PDFViewPrintJobTitle?(sender: PDFView): string;

  PDFViewPerformPrint?(sender: PDFView): void;

  PDFViewPerformFind?(sender: PDFView): void;

  PDFViewPerformGoToPage?(sender: PDFView): void;

  PDFViewOpenPDFForRemoteGoToAction?(sender: PDFView, action: PDFActionRemoteGoTo): void;
}

export declare class PDFViewDelegate extends NativeObject implements PDFViewDelegate {
}

export declare interface PDFDocumentDelegate extends NSObjectProtocol {
  documentDidUnlock?(notification: NSNotification): void;

  documentDidBeginDocumentFind?(notification: NSNotification): void;

  documentDidEndDocumentFind?(notification: NSNotification): void;

  documentDidBeginPageFind?(notification: NSNotification): void;

  documentDidEndPageFind?(notification: NSNotification): void;

  documentDidFindMatch?(notification: NSNotification): void;

  didMatchString?(instance: PDFSelection): void;

  classForPage?(): interop.Pointer;

  classForAnnotationType?(annotationType: string): interop.Pointer;

  classForAnnotationClass?(annotationClass: interop.PointerConvertible): interop.Pointer;
}

export declare class PDFDocumentDelegate extends NativeObject implements PDFDocumentDelegate {
}

export declare class PDFAnnotationSquare extends PDFAnnotation implements NSCopying, NSCoding {
  interiorColor: NSColor;

  setInteriorColor(interiorColor: NSColor | null): void;
  setInteriorColor(color: NSColor): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFAnnotationLink extends PDFAnnotation implements NSCopying {
  destination: PDFDestination;

  setDestination(destination: PDFDestination | null): void;
  setDestination(destination: PDFDestination): void;

  URL: NSURL;

  setURL(URL: NSURL | null): void;
  setURL(url: NSURL): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAnnotationInk extends PDFAnnotation implements NSCopying, NSCoding {
  readonly paths: NSArray;

  addBezierPath(path: NSBezierPath): void;

  removeBezierPath(path: NSBezierPath): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFAnnotationFreeText extends PDFAnnotation implements NSCopying, NSCoding {
  font: NSFont;

  setFont(font: NSFont | null): void;
  setFont(font: NSFont): void;

  fontColor: NSColor;

  setFontColor(fontColor: NSColor | null): void;
  setFontColor(color: NSColor): void;

  alignment: interop.Enum<typeof NSTextAlignment>;

  setAlignment(alignment: interop.Enum<typeof NSTextAlignment>): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFAnnotationCircle extends PDFAnnotation implements NSCopying {
  interiorColor: NSColor;

  setInteriorColor(interiorColor: NSColor | null): void;
  setInteriorColor(color: NSColor): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFSelection extends NSObject implements NSCopying {
  initWithDocument(document: PDFDocument): this;

  readonly pages: NSArray;

  color: NSColor;

  readonly string: string;

  readonly attributedString: NSAttributedString;

  boundsForPage(page: PDFPage): CGRect;

  numberOfTextRangesOnPage(page: PDFPage): number;

  rangeAtIndexOnPage(index: number, page: PDFPage): _NSRange;

  selectionsByLine(): NSArray;

  addSelection(selection: PDFSelection): void;

  addSelections(selections: NSArray<interop.Object> | Array<interop.Object>): void;

  extendSelectionAtEnd(succeed: number): void;

  extendSelectionAtStart(precede: number): void;

  extendSelectionForLineBoundaries(): void;

  drawForPageActive(page: PDFPage, active: boolean): void;

  drawForPageWithBoxActive(page: PDFPage, box: interop.Enum<typeof PDFDisplayBox>, active: boolean): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFOutline extends NSObject {
  init(): this;

  readonly document: PDFDocument;

  readonly parent: PDFOutline;

  readonly numberOfChildren: number;

  readonly index: number;

  childAtIndex(index: number): PDFOutline;

  insertChildAtIndex(child: PDFOutline, index: number): void;

  removeFromParent(): void;

  label: string;

  isOpen: boolean;

  destination: PDFDestination;

  action: PDFAction;
}

export declare class PDFDocument extends NSObject implements NSCopying {
  init(): this;

  initWithURL(url: NSURL): this;

  initWithData(data: NSData): this;

  readonly documentURL: NSURL;

  readonly documentRef: interop.Object;

  get documentAttributes(): NSDictionary;
  set documentAttributes(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  readonly majorVersion: number;

  readonly minorVersion: number;

  readonly isEncrypted: boolean;

  readonly isLocked: boolean;

  unlockWithPassword(password: string): boolean;

  readonly allowsPrinting: boolean;

  readonly allowsCopying: boolean;

  readonly allowsDocumentChanges: boolean;

  readonly allowsDocumentAssembly: boolean;

  readonly allowsContentAccessibility: boolean;

  readonly allowsCommenting: boolean;

  readonly allowsFormFieldEntry: boolean;

  readonly accessPermissions: interop.Enum<typeof PDFAccessPermissions>;

  readonly permissionsStatus: interop.Enum<typeof PDFDocumentPermissions>;

  readonly string: string;

  delegate: PDFDocumentDelegate;

  dataRepresentation(): NSData;

  dataRepresentationWithOptions(options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSData;

  writeToFile(path: string): boolean;

  writeToFileWithOptions(path: string, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): boolean;

  writeToURL(url: NSURL): boolean;

  writeToURLWithOptions(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): boolean;

  outlineRoot: PDFOutline;

  outlineItemForSelection(selection: PDFSelection): PDFOutline;

  readonly pageCount: number;

  pageAtIndex(index: number): PDFPage;

  indexForPage(page: PDFPage): number;

  insertPageAtIndex(page: PDFPage, index: number): void;

  removePageAtIndex(index: number): void;

  exchangePageAtIndexWithPageAtIndex(indexA: number, indexB: number): void;

  readonly pageClass: interop.Pointer;

  findStringWithOptions(string: string, options: interop.Enum<typeof NSStringCompareOptions>): NSArray;

  beginFindStringWithOptions(string: string, options: interop.Enum<typeof NSStringCompareOptions>): void;

  beginFindStringsWithOptions(strings: NSArray<interop.Object> | Array<interop.Object>, options: interop.Enum<typeof NSStringCompareOptions>): void;

  findStringFromSelectionWithOptions(string: string, selection: PDFSelection | null, options: interop.Enum<typeof NSStringCompareOptions>): PDFSelection;

  readonly isFinding: boolean;

  cancelFindString(): void;

  printOperationForPrintInfoScalingModeAutoRotate(printInfo: NSPrintInfo | null, scaleMode: interop.Enum<typeof PDFPrintScalingMode>, doRotate: boolean): NSPrintOperation;

  readonly selectionForEntireDocument: PDFSelection;

  selectionFromPageAtPointToPageAtPoint(startPage: PDFPage, startPoint: CGPoint, endPage: PDFPage, endPoint: CGPoint): PDFSelection;

  selectionFromPageAtCharacterIndexToPageAtCharacterIndex(startPage: PDFPage, startCharacter: number, endPage: PDFPage, endCharacter: number): PDFSelection;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFDestination extends NSObject implements NSCopying {
  initWithPageAtPoint(page: PDFPage, point: CGPoint): this;

  readonly page: PDFPage | null;

  readonly point: CGPoint;

  zoom: number;

  compare(destination: PDFDestination): interop.Enum<typeof NSComparisonResult>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFBorder extends NSObject implements NSCopying, NSCoding {
  style: interop.Enum<typeof PDFBorderStyle>;

  lineWidth: number;

  get dashPattern(): NSArray;
  set dashPattern(value: NSArray<interop.Object> | Array<interop.Object>);

  readonly borderKeyValues: NSDictionary;

  drawInRect(rect: CGRect): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFPage extends NSObject implements NSCopying {
  init(): this;

  initWithImage(image: NSImage): this;

  readonly document: PDFDocument;

  readonly pageRef: interop.Object;

  readonly label: string;

  boundsForBox(box: interop.Enum<typeof PDFDisplayBox>): CGRect;

  setBoundsForBox(bounds: CGRect, box: interop.Enum<typeof PDFDisplayBox>): void;

  rotation: number;

  readonly annotations: NSArray;

  displaysAnnotations: boolean;

  addAnnotation(annotation: PDFAnnotation): void;

  removeAnnotation(annotation: PDFAnnotation): void;

  annotationAtPoint(point: CGPoint): PDFAnnotation;

  transformForBox(box: interop.Enum<typeof PDFDisplayBox>): CGAffineTransform;

  drawWithBoxToContext(box: interop.Enum<typeof PDFDisplayBox>, context: interop.Object): void;

  transformContextForBox(context: interop.Object, box: interop.Enum<typeof PDFDisplayBox>): void;

  thumbnailOfSizeForBox(size: CGSize, box: interop.Enum<typeof PDFDisplayBox>): NSImage;

  readonly numberOfCharacters: number;

  readonly string: string;

  readonly attributedString: NSAttributedString;

  characterBoundsAtIndex(index: number): CGRect;

  characterIndexAtPoint(point: CGPoint): number;

  selectionForRect(rect: CGRect): PDFSelection;

  selectionForWordAtPoint(point: CGPoint): PDFSelection;

  selectionForLineAtPoint(point: CGPoint): PDFSelection;

  selectionFromPointToPoint(startPoint: CGPoint, endPoint: CGPoint): PDFSelection;

  selectionForRange(range: _NSRange): PDFSelection;

  readonly dataRepresentation: NSData;

  drawWithBox(box: interop.Enum<typeof PDFDisplayBox>): void;

  transformContextForBox(box: interop.Enum<typeof PDFDisplayBox>): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFActionURL extends PDFAction implements NSCopying {
  initWithURL(url: NSURL): this;

  URL: NSURL;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFActionNamed extends PDFAction implements NSCopying {
  initWithName(name: interop.Enum<typeof PDFActionNamedName>): this;

  name: interop.Enum<typeof PDFActionNamedName>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAction extends NSObject implements NSCopying {
  readonly type: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFActionResetForm extends PDFAction implements NSCopying {
  init(): this;

  get fields(): NSArray;
  set fields(value: NSArray<interop.Object> | Array<interop.Object>);

  fieldsIncludedAreCleared: boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAnnotationTextWidget extends PDFAnnotation implements NSCopying {
  stringValue(): string;

  setStringValue(value: string): void;

  attributedStringValue(): NSAttributedString;

  setAttributedStringValue(value: NSAttributedString): void;

  backgroundColor: NSColor;

  setBackgroundColor(backgroundColor: NSColor | null): void;
  setBackgroundColor(color: NSColor): void;

  rotation(): number;

  setRotation(rotation: number): void;

  font: NSFont;

  setFont(font: NSFont | null): void;
  setFont(font: NSFont): void;

  fontColor: NSColor;

  setFontColor(fontColor: NSColor | null): void;
  setFontColor(color: NSColor): void;

  alignment: interop.Enum<typeof NSTextAlignment>;

  setAlignment(alignment: interop.Enum<typeof NSTextAlignment>): void;

  maximumLength: number;

  setMaximumLength(maximumLength: number): void;
  setMaximumLength(maxLen: number): void;

  fieldName: string;

  setFieldName(fieldName: string | null): void;
  setFieldName(name: string): void;

  isMultiline(): boolean;

  setIsMultiline(multiline: boolean): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAnnotationLine extends PDFAnnotation implements NSCopying, NSCoding {
  startPoint: CGPoint;

  setStartPoint(startPoint: CGPoint): void;
  setStartPoint(point: CGPoint): void;

  endPoint: CGPoint;

  setEndPoint(endPoint: CGPoint): void;
  setEndPoint(point: CGPoint): void;

  startLineStyle: interop.Enum<typeof PDFLineStyle>;

  setStartLineStyle(startLineStyle: interop.Enum<typeof PDFLineStyle>): void;
  setStartLineStyle(style: interop.Enum<typeof PDFLineStyle>): void;

  endLineStyle: interop.Enum<typeof PDFLineStyle>;

  setEndLineStyle(endLineStyle: interop.Enum<typeof PDFLineStyle>): void;
  setEndLineStyle(style: interop.Enum<typeof PDFLineStyle>): void;

  interiorColor: NSColor;

  setInteriorColor(interiorColor: NSColor | null): void;
  setInteriorColor(color: NSColor): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFAnnotationButtonWidget extends PDFAnnotation implements NSCopying {
  controlType(): interop.Enum<typeof PDFWidgetControlType>;

  setControlType(type: interop.Enum<typeof PDFWidgetControlType>): void;

  state(): number;

  setState(value: number): void;

  backgroundColor: NSColor;

  setBackgroundColor(backgroundColor: NSColor | null): void;
  setBackgroundColor(color: NSColor): void;

  allowsToggleToOff: boolean;

  setAllowsToggleToOff(allowsToggleToOff: boolean): void;
  setAllowsToggleToOff(allowOff: boolean): void;

  font: NSFont;

  setFont(font: NSFont | null): void;
  setFont(font: NSFont): void;

  fontColor: NSColor;

  setFontColor(fontColor: NSColor | null): void;
  setFontColor(color: NSColor): void;

  caption: string;

  setCaption(caption: string | null): void;
  setCaption(name: string): void;

  fieldName: string;

  setFieldName(fieldName: string | null): void;
  setFieldName(name: string): void;

  onStateValue(): string;

  setOnStateValue(name: string): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAnnotationPopup extends PDFAnnotation implements NSCopying, NSCoding {
  isOpen(): boolean;

  setIsOpen(isOpen: boolean): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFAnnotation extends NSObject implements NSCopying, NSCoding {
  initWithBoundsForTypeWithProperties(bounds: CGRect, annotationType: string, properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  page: PDFPage;

  type: string;

  bounds: CGRect;

  shouldDisplay: boolean;

  shouldPrint: boolean;

  modificationDate: NSDate;

  userName: string;

  popup: PDFAnnotation;

  border: PDFBorder;

  color: NSColor;

  contents: string;

  action: PDFAction;

  readonly hasAppearanceStream: boolean;

  highlighted: boolean;

  drawWithBoxInContext(box: interop.Enum<typeof PDFDisplayBox>, context: interop.Object): void;

  setValueForAnnotationKey(value: interop.Object, key: string): boolean;

  setBooleanForAnnotationKey(value: boolean, key: string): boolean;

  setRectForAnnotationKey(value: CGRect, key: string): boolean;

  readonly annotationKeyValues: NSDictionary;

  valueForAnnotationKey(key: string): interop.Object;

  removeValueForAnnotationKey(key: string): void;

  isHighlighted(): boolean;

  initWithDictionaryForPage(dictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, page: PDFPage | null): this;

  initWithBounds(bounds: CGRect): this;

  readonly toolTip: string;

  mouseUpAction: PDFAction;

  removeAllAppearanceStreams(): void;

  drawWithBox(box: interop.Enum<typeof PDFDisplayBox>): void;

  font: NSFont;

  fontColor: NSColor;

  interiorColor: NSColor;

  alignment: interop.Enum<typeof NSTextAlignment>;

  startPoint: CGPoint;

  endPoint: CGPoint;

  startLineStyle: interop.Enum<typeof PDFLineStyle>;

  endLineStyle: interop.Enum<typeof PDFLineStyle>;

  static lineStyleFromName(name: string): interop.Enum<typeof PDFLineStyle>;

  static nameForLineStyle(style: interop.Enum<typeof PDFLineStyle>): string;

  iconType: interop.Enum<typeof PDFTextAnnotationIconType>;

  get quadrilateralPoints(): NSArray;
  set quadrilateralPoints(value: NSArray<interop.Object> | Array<interop.Object>);

  markupType: interop.Enum<typeof PDFMarkupType>;

  widgetFieldType: string;

  widgetControlType: interop.Enum<typeof PDFWidgetControlType>;

  multiline: boolean;

  readonly activatableTextField: boolean;

  readonly isPasswordField: boolean;

  comb: boolean;

  maximumLength: number;

  widgetStringValue: string;

  widgetDefaultStringValue: string;

  allowsToggleToOff: boolean;

  radiosInUnison: boolean;

  readOnly: boolean;

  listChoice: boolean;

  get choices(): NSArray;
  set choices(value: NSArray<interop.Object> | Array<interop.Object>);

  get values(): NSArray;
  set values(value: NSArray<interop.Object> | Array<interop.Object>);

  buttonWidgetState: interop.Enum<typeof PDFWidgetCellState>;

  buttonWidgetStateString: string;

  open: boolean;

  readonly paths: NSArray;

  addBezierPath(path: NSBezierPath): void;

  removeBezierPath(path: NSBezierPath): void;

  destination: PDFDestination;

  URL: NSURL;

  fieldName: string;

  caption: string;

  backgroundColor: NSColor;

  stampName: string;

  isMultiline(): boolean;

  isActivatableTextField(): boolean;

  hasComb(): boolean;

  isReadOnly(): boolean;

  isListChoice(): boolean;

  isOpen(): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFView extends NSView implements NSAnimationDelegate, NSMenuDelegate {
  document: PDFDocument;

  readonly canGoToFirstPage: boolean;

  goToFirstPage(sender: interop.Object | null): void;

  readonly canGoToLastPage: boolean;

  goToLastPage(sender: interop.Object | null): void;

  readonly canGoToNextPage: boolean;

  goToNextPage(sender: interop.Object | null): void;

  readonly canGoToPreviousPage: boolean;

  goToPreviousPage(sender: interop.Object | null): void;

  readonly canGoBack: boolean;

  goBack(sender: interop.Object | null): void;

  readonly canGoForward: boolean;

  goForward(sender: interop.Object | null): void;

  readonly currentPage: PDFPage;

  goToPage(page: PDFPage): void;

  readonly currentDestination: PDFDestination;

  goToDestination(destination: PDFDestination): void;

  goToSelection(selection: PDFSelection): void;

  goToRectOnPage(rect: CGRect, page: PDFPage): void;

  displayMode: interop.Enum<typeof PDFDisplayMode>;

  displayDirection: interop.Enum<typeof PDFDisplayDirection>;

  displaysPageBreaks: boolean;

  pageBreakMargins: NSEdgeInsets;

  displayBox: interop.Enum<typeof PDFDisplayBox>;

  displaysAsBook: boolean;

  displaysRTL: boolean;

  backgroundColor: NSColor;

  interpolationQuality: interop.Enum<typeof PDFInterpolationQuality>;

  pageShadowsEnabled: boolean;

  delegate: PDFViewDelegate;

  scaleFactor: number;

  minScaleFactor: number;

  maxScaleFactor: number;

  autoScales: boolean;

  readonly scaleFactorForSizeToFit: number;

  zoomIn(sender: interop.Object | null): void;

  readonly canZoomIn: boolean;

  zoomOut(sender: interop.Object | null): void;

  readonly canZoomOut: boolean;

  areaOfInterestForMouse(event: NSEvent): interop.Enum<typeof PDFAreaOfInterest>;

  areaOfInterestForPoint(cursorLocation: CGPoint): interop.Enum<typeof PDFAreaOfInterest>;

  setCursorForAreaOfInterest(area: interop.Enum<typeof PDFAreaOfInterest>): void;

  performAction(action: PDFAction): void;

  currentSelection: PDFSelection;

  setCurrentSelectionAnimate(selection: PDFSelection | null, animate: boolean): void;

  clearSelection(): void;

  selectAll(sender: interop.Object | null): void;

  scrollSelectionToVisible(sender: interop.Object | null): void;

  get highlightedSelections(): NSArray;
  set highlightedSelections(value: NSArray<interop.Object> | Array<interop.Object>);

  drawPageToContext(page: PDFPage, context: interop.Object): void;

  drawPagePostToContext(page: PDFPage, context: interop.Object): void;

  copy(): interop.Object;
  copy(sender: interop.Object | null): void;

  printWithInfoAutoRotate(printInfo: NSPrintInfo, doRotate: boolean): void;

  printWithInfoAutoRotatePageScaling(printInfo: NSPrintInfo, doRotate: boolean, scale: interop.Enum<typeof PDFPrintScalingMode>): void;

  pageForPointNearest(point: CGPoint, nearest: boolean): PDFPage;

  convertPointToPage(point: CGPoint, page: PDFPage): CGPoint;

  convertRectToPage(rect: CGRect, page: PDFPage): CGRect;

  convertPointFromPage(point: CGPoint, page: PDFPage): CGPoint;

  convertRectFromPage(rect: CGRect, page: PDFPage): CGRect;

  readonly documentView: NSView;

  layoutDocumentView(): void;

  annotationsChangedOnPage(page: PDFPage): void;

  rowSizeForPage(page: PDFPage): CGSize;

  acceptsDraggedFiles: boolean;

  readonly visiblePages: NSArray;

  enableDataDetectors: boolean;

  takePasswordFrom(sender: interop.Object): void;

  drawPage(page: PDFPage): void;

  drawPagePost(page: PDFPage): void;

  shouldAntiAlias: boolean;

  greekingThreshold: number;

  takeBackgroundColorFrom(sender: interop.Object): void;

  allowsDragging: boolean;

  animationShouldStart(animation: NSAnimation): boolean;

  animationDidStop(animation: NSAnimation): void;

  animationDidEnd(animation: NSAnimation): void;

  animationValueForProgress(animation: NSAnimation, progress: number): number;

  animationDidReachProgressMark(animation: NSAnimation, progress: number): void;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;

  menuNeedsUpdate(menu: NSMenu): void;

  numberOfItemsInMenu(menu: NSMenu): number;

  menuUpdateItemAtIndexShouldCancel(menu: NSMenu, item: NSMenuItem, index: number, shouldCancel: boolean): boolean;

  menuHasKeyEquivalentForEventTargetAction(menu: NSMenu, event: NSEvent, target: interop.PointerConvertible, action: interop.PointerConvertible): boolean;

  menuWillOpen(menu: NSMenu): void;

  menuDidClose(menu: NSMenu): void;

  menuWillHighlightItem(menu: NSMenu, item: NSMenuItem | null): void;

  confinementRectForMenuOnScreen(menu: NSMenu, screen: NSScreen | null): CGRect;
}

export declare class PDFActionRemoteGoTo extends PDFAction implements NSCopying {
  initWithPageIndexAtPointFileURL(pageIndex: number, point: CGPoint, url: NSURL): this;

  pageIndex: number;

  point: CGPoint;

  URL: NSURL;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAppearanceCharacteristics extends NSObject implements NSCopying {
  controlType: interop.Enum<typeof PDFWidgetControlType>;

  backgroundColor: NSColor;

  borderColor: NSColor;

  rotation: number;

  caption: string;

  rolloverCaption: string;

  downCaption: string;

  readonly appearanceCharacteristicsKeyValues: NSDictionary;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFActionGoTo extends PDFAction implements NSCopying {
  initWithDestination(destination: PDFDestination): this;

  destination: PDFDestination;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAnnotationStamp extends PDFAnnotation implements NSCopying {
  name(): string;

  setName(name: string): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAnnotationText extends PDFAnnotation implements NSCopying, NSCoding {
  iconType: interop.Enum<typeof PDFTextAnnotationIconType>;

  setIconType(type: interop.Enum<typeof PDFTextAnnotationIconType>): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFThumbnailView extends NSView implements NSCoding {
  PDFView: PDFView;

  backgroundColor: NSColor;

  readonly selectedPages: NSArray;

  thumbnailSize: CGSize;

  maximumNumberOfColumns: number;

  labelFont: NSFont;

  allowsDragging: boolean;

  allowsMultipleSelection: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class PDFAnnotationChoiceWidget extends PDFAnnotation implements NSCopying {
  stringValue(): string;

  setStringValue(value: string): void;

  backgroundColor: NSColor;

  setBackgroundColor(color: NSColor): void;

  font: NSFont;

  setFont(font: NSFont): void;

  fontColor: NSColor;

  setFontColor(color: NSColor): void;

  fieldName: string;

  setFieldName(name: string): void;

  isListChoice(): boolean;

  setIsListChoice(isList: boolean): void;

  get choices(): NSArray;
  set choices(value: NSArray<interop.Object> | Array<interop.Object>);

  setChoices(options: NSArray<interop.Object> | Array<interop.Object>): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class PDFAnnotationMarkup extends PDFAnnotation implements NSCopying, NSCoding {
  get quadrilateralPoints(): NSArray;
  set quadrilateralPoints(value: NSArray<interop.Object> | Array<interop.Object>);

  setQuadrilateralPoints(points: NSArray<interop.Object> | Array<interop.Object>): void;

  markupType: interop.Enum<typeof PDFMarkupType>;

  setMarkupType(type: interop.Enum<typeof PDFMarkupType>): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}
