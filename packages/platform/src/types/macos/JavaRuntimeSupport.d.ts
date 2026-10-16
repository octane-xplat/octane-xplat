import type { NSApplicationDelegate, NSEvent } from './AppKit'

import type { CGPoint, CGRect } from './CoreFoundation'

import type { NSArray, NSDictionary } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSDragOperation } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const kJRSUI_SegmentPosition_last: number

export declare const kJRSUI_Widget_frameGroupBoxSecondary: number

export declare const kJRSUI_WindowType_utility: number

export declare const kJRSUI_Key_segmentTrailingSeparator: number

export declare const kJRSUI_Widget_buttonPushScope: number

export declare const kJRSUI_PartHit_arrowMinInside: number

export declare const kJRSUI_Widget_buttonPushScope2: number

export declare const kJRSUI_Variant_gradientSideBarSelection: number

export declare const kJRSUI_Widget_titleBarZoomBox: number

export declare const kJRSUI_Key_animationStartTime: number

export declare const kJRSUI_Direction_right: number

export declare const kJRSUI_Widget_dividerSplitter: number

export declare const kJRSUI_PartHit_hit: number

export declare const kJRSUI_Direction_up: number

export declare const kJRSUI_PartHit_arrowMax: number

export declare const kJRSUI_PartHit_arrowMin: number

export declare const kJRSUI_PartHit_none: number

export declare const kJRSUI_UserInterfaceLayoutDirection_rightToLeft: number

export declare const kJRSUI_UserInterfaceLayoutDirection_leftToRight: number

export declare const kJRSUI_PresentationState_inactive: number

export declare const kJRSUI_WindowType_titlelessUtility: number

export declare const kJRSUI_Variant_gradientSideBarFocusedSelection: number

export declare const kJRSUI_Variant_gradientListBackgroundEven: number

export declare const kJRSUI_Variant_menuHierarchical: number

export declare const kJRSUI_Variant_menuPulldown: number

export declare const kJRSUI_Variant_menuPopup: number

export declare const kJRSUI_Variant_menuGlyph: number

export declare const kJRSUI_ScrollBarPart_trackMin: number

export declare const kJRSUI_ScrollBarPart_arrowMinInside: number

export declare const kJRSUI_ScrollBarPart_arrowMin: number

export declare const kJRSUI_ScrollBarPart_none: number

export declare const kJRSUI_SegmentPosition_first: number

export declare const kJRSUI_AlignmentVertical_bottom: number

export declare const kJRSUI_AlignmentVertical_top: number

export declare const kJRSUI_AlignmentHorizontal_right: number

export declare const kJRSUI_AlignmentHorizontal_center: number

export declare const kJRSUI_Orientation_vertical: number

export declare const kJRSUI_Orientation_horizontal: number

export declare const kJRSUI_Direction_east: number

export declare const kJRSUI_Direction_south: number

export declare const kJRSUI_Direction_left: number

export declare const kJRSUI_Direction_none: number

export declare const kJRSUI_Size_small: number

export declare const kJRSUI_Size_mini: number

export declare const kJRSUI_State_drag: number

export declare const kJRSUI_State_rollover: number

export declare const kJRSUI_State_pulsed: number

export declare const kJRSUI_State_disabled: number

export declare const kJRSUI_Widget_windowFrame: number

export declare const kJRSUI_Widget_toolbarItemWell: number

export declare const kJRSUI_Widget_titleBarCloseBox: number

export declare const kJRSUI_Widget_synchronization: number

export declare const kJRSUI_Widget_slider: number

export declare const kJRSUI_Widget_scrollColumnSizer: number

export declare const kJRSUI_Widget_progressRelevance: number

export declare const kJRSUI_Widget_menuTitle: number

export declare const kJRSUI_Widget_menuBar: number

export declare const kJRSUI_Widget_menuItem: number

export declare const kJRSUI_Widget_growBox: number

export declare const kJRSUI_Widget_frameWell: number

export declare const kJRSUI_Widget_frameTextField: number

export declare const kJRSUI_Widget_framePlacard: number

export declare const kJRSUI_Widget_frameGroupBox: number

export declare const kJRSUI_Widget_focus: number

export declare const kJRSUI_Widget_dividerSeparatorBar: number

export declare const kJRSUI_Widget_dividerGrabber: number

export declare const kJRSUI_Widget_buttonSegmentedTextured: number

export declare const kJRSUI_Widget_buttonSegmentedSCurve: number

export declare const kJRSUI_Widget_buttonSegmentedInset2: number

export declare const kJRSUI_Widget_buttonSegmentedInset: number

export declare const kJRSUI_Widget_buttonSegmented: number

export declare const kJRSUI_Widget_buttonSearchFieldFind: number

export declare const kJRSUI_Widget_buttonRoundInset2: number

export declare const kJRSUI_Widget_buttonRound: number

export declare const kJRSUI_Widget_buttonRadio: number

export declare const kJRSUI_Widget_buttonPushInset2: number

export declare const kJRSUI_Widget_buttonPush: number

export declare const kJRSUI_Widget_buttonPopDown: number

export declare const kJRSUI_Widget_buttonLittleArrows: number

export declare const kJRSUI_Widget_buttonDisclosure: number

export declare const kJRSUI_Widget_buttonCheckBox: number

export declare const kJRSUI_Widget_buttonBevelInset: number

export declare const kJRSUI_Widget_buttonBevel: number

export declare const kJRSUI_Key_userInterfaceLayoutDirection: number

export declare const kJRSUI_Key_thumbStart: number

export declare const kJRSUI_Key_thumbProportion: number

export declare const kJRSUI_Key_animationFrame: number

export declare const kJRSUI_Key_maximumValue: number

export declare const kJRSUI_Key_frameOnly: number

export declare const kJRSUI_Key_noIndicator: number

export declare const kJRSUI_Key_pressedPart: number

export declare const kJRSUI_Key_position: number

export declare const kJRSUI_Key_horizontalAlignment: number

export declare const kJRSUI_Key_verticalAlignment: number

export declare const kJRSUI_Key_direction: number

export declare const JRSMenuDidReuseItemNotification: string

export declare const kJRSUI_Widget_gradient: number

export declare const kJRSUI_Widget_growBoxTextured: number

export declare const kJRSUI_Key_presentationState: number

export declare const kJRSUI_Key_size: number

export declare const kJRSUI_Widget_buttonComboBoxInset: number

export declare const kJRSUI_Key_windowFrameDrawClipped: number

export declare const kJRSUI_Widget_buttonSearchFieldCancel: number

export declare const kJRSUI_ScrollBarPart_thumb: number

export declare const kJRSUI_Size_regular: number

export declare const kJRSUI_Size_large: number

export declare const kJRSUI_PresentationState_activeMain: number

export declare const kJRSUI_Key_focused: number

export declare const kJRSUI_Variant_gradientSideBar: number

export declare const kJRSUI_AlignmentHorizontal_left: number

export declare const kJRSUI_Widget_buttonPushTextured: number

export declare const kJRSUI_PartHit_unknown: number

export declare const kJRSUI_Key_variant: number

export declare const kJRSUI_AlignmentVertical_center: number

export declare const kJRSUI_Widget_buttonPopUpInset: number

export declare const kJRSUI_Key_segmentLeadingSeparator: number

export declare const kJRSUI_Widget_buttonListHeader: number

export declare const kJRSUI_Key_nothingToScroll: number

export declare const kJRSUI_Direction_west: number

export declare const kJRSUI_Direction_down: number

export declare const kJRSUI_State_active: number

export declare const kJRSUI_PartHit_arrowMaxInside: number

export declare const kJRSUI_PresentationState_activeKey: number

export declare const kJRSUI_Widget_frameTextFieldRound: number

export declare const kJRSUI_Key_value: number

export declare const kJRSUI_Key_windowTitleBarHeight: number

export declare const kJRSUI_Widget_progressSpinner: number

export declare const kJRSUI_Key_arrowsOnly: number

export declare const kJRSUI_Widget_disclosureTriangle: number

export declare const kJRSUI_Widget_titleBarToolbarButton: number

export declare const kJRSUI_PartHit_trackMax: number

export declare const kJRSUI_Widget_buttonPopUp: number

export declare const kJRSUI_Key_indicatorOnly: number

export declare const kJRSUI_Widget_buttonComboBox: number

export declare const kJRSUI_Widget_buttonPopUpSquare: number

export declare const kJRSUI_Widget_buttonPushInset: number

export declare const kJRSUI_Widget_buttonPopDownInset: number

export declare const kJRSUI_Widget_dial: number

export declare const kJRSUI_Widget_sliderThumb: number

export declare const kJRSUI_Widget_background: number

export declare const kJRSUI_Widget_progressIndeterminateBar: number

export declare const kJRSUI_Widget_tab: number

export declare const kJRSUI_Widget_progressBar: number

export declare const kJRSUI_Key_windowFrameDrawTitleSeparator: number

export declare const kJRSUI_Key_state: number

export declare const kJRSUI_Direction_north: number

export declare const kJRSUI_Key_animationTime: number

export declare const kJRSUI_ScrollBarPart_trackMax: number

export declare const kJRSUI_Key_orientation: number

export declare const kJRSUI_SegmentPosition_middle: number

export declare const kJRSUI_Widget_buttonBevelRound: number

export declare const kJRSUI_Key_widget: number

export declare const kJRSUI_ScrollBarPart_arrowMax: number

export declare const kJRSUI_PartHit_thumb: number

export declare const kJRSUI_Widget_buttonRoundHelp: number

export declare const kJRSUI_Widget_frameListBox: number

export declare const kJRSUI_ScrollBarPart_arrowMaxInside: number

export declare const kJRSUI_Key_windowType: number

export declare const kJRSUI_PartHit_trackMin: number

export declare const kJRSUI_Widget_titleBarCollapseBox: number

export declare const kJRSUI_Variant_gradientListBackgroundOdd: number

export declare const kJRSUI_Widget_menu: number

export declare const kJRSUI_State_inactive: number

export declare const kJRSUI_Widget_buttonSegmentedToolbar: number

export declare const kJRSUI_WindowType_document: number

export declare const kJRSUI_Widget_scrollBar: number

export declare const kJRSUI_SegmentPosition_only: number

export declare const kJRSUI_Widget_buttonRoundInset: number

export declare const kJRSUI_State_pressed: number

export declare const kJRSUI_Widget_buttonPopDownSquare: number

export declare function JRSAccessibilityUnregisterUniqueIdForUIElement(
	element: interop.Object,
): void

export declare function JRSFontGetRenderingStyleForHints(fmHint: number, aaHint: number): number

export declare function JRSFontAlignStyleForFractionalMeasurement(style: number): number

export declare function JRSFontAlignStyleForIntegerMeasurement(style: number): number

export declare function JRSFontStyleUsesFractionalMetrics(style: number): boolean

export declare function JRSFontStyleIsAntialiased(style: number): boolean

export declare function JRSFontGetRenderingStyleForContext(
	context: interop.PointerConvertible,
): number

export declare function JRSFontSetRenderingStyleOnContext(
	context: interop.PointerConvertible,
	style: number,
): void

export declare function JRSFontCreateFallbackFontForCharacters(
	font: interop.PointerConvertible,
	unichars: interop.PointerConvertible,
	length: number,
): interop.Object

export declare function JRSFontGetAdvancesForGlyphsAndStyle(
	font: interop.PointerConvertible,
	tx: interop.PointerConvertible,
	style: number,
	glyphs: interop.Pointer,
	count: number,
	advances: interop.Pointer,
): number

export declare function JRSFontGetBoundingBoxesForGlyphsAndStyle(
	font: interop.PointerConvertible,
	tx: interop.PointerConvertible,
	style: number,
	glyphs: interop.Pointer,
	count: number,
	bboxes: interop.Pointer,
): CGRect

export declare function JRSUIRendererCreate(): interop.Object

export declare function JRSUIRendererRelease(renderer: interop.Object): void

export declare function JRSUIControlCreate(isFlipped: number): interop.Object

export declare function JRSUIControlRelease(control: interop.Object): void

export declare function JRSUIControlDraw(
	renderer: interop.Object,
	control: interop.Object,
	context: interop.Object,
	bounds: CGRect,
): void

export declare function JRSUIGetKey(value: number): interop.Object

export declare function JRSUIControlSetValueByKey(
	control: interop.Object,
	key: interop.Object,
	value: interop.Object,
): void

export declare function JRSUIControlSetWidget(control: interop.Object, value: number): void

export declare function JRSUIControlSetState(control: interop.Object, value: number): void

export declare function JRSUIControlSetSize(control: interop.Object, value: number): void

export declare function JRSUIControlSetDirection(control: interop.Object, value: number): void

export declare function JRSUIControlSetOrientation(control: interop.Object, value: number): void

export declare function JRSUIControlSetAlignmentVertical(
	control: interop.Object,
	value: number,
): void

export declare function JRSUIControlSetAlignmentHorizontal(
	control: interop.Object,
	value: number,
): void

export declare function JRSUIControlSetSegmentPosition(control: interop.Object, value: number): void

export declare function JRSUIControlSetScrollBarPart(control: interop.Object, value: number): void

export declare function JRSUIControlSetVariant(control: interop.Object, value: number): void

export declare function JRSUIControlSetWindowType(control: interop.Object, value: number): void

export declare function JRSUIControlSetPresentationState(
	control: interop.Object,
	value: number,
): void

export declare function JRSUIControlSetUserInterfaceLayoutDirection(
	control: interop.Object,
	value: number,
): void

export declare function JRSUIControlSetShowArrows(control: interop.Object, value: number): void

export declare function JRSUIControlSetAnimating(control: interop.Object, value: number): void

export declare function JRSUIControlGetHitPart(
	renderer: interop.Object,
	control: interop.Object,
	bounds: CGRect,
	point: CGPoint,
): number

export declare function JRSUIControlShouldScrollToClick(): number

export declare function JRSUIControlGetScrollBarPartBounds(
	control: interop.Object,
	frame: CGRect,
	part: number,
): CGRect

export declare function JRSUIControlGetScrollBarOffsetFor(
	control: interop.Object,
	frame: CGRect,
	offset: number,
	visibleAmount: number,
	extent: number,
): number

export declare interface JRSRemoteLayer {
	readonly layerID: number
}

export declare class JRSRemoteLayer extends NativeObject implements JRSRemoteLayer {}

export declare interface JRSMenuDelegate extends NSObjectProtocol {
	handleJavaMouseEvent?(event: NSEvent): void

	handleJavaMenuItemTargetedAtIndexRect?(menuIndex: number, rect: CGRect): void
}

export declare class JRSMenuDelegate extends NativeObject implements JRSMenuDelegate {}

export declare class JRSDrag extends NSObject {
	static currentAllowableActions(): interop.Enum<typeof NSDragOperation>

	static currentModifiers(): number
}

export declare class JRSInputMethodController extends NSObject {
	static controller(): JRSInputMethodController

	availableInputMethodLocales(): NSArray

	currentInputMethodName(): string

	currentInputMethodLocale(): string

	setCurrentInputMethodForLocale(theLocale: string): void
}

export declare class JRSAppKitAWT extends NSObject {
	static awtAppDelegate(): NSApplicationDelegate

	static registerAWTAppWithOptions(
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): void

	static markAppIsDaemon(): boolean
}

export declare class JRSSymbolicator extends NSObject {
	static symbolicatorForPid(pid: number): JRSSymbolicator

	addressForSymbol(symbolName: string): number
}

export declare class JRSRenderServer extends NSObject {
	static startRenderServer(): number

	static sendRenderServer(serverPort: number): string

	static recieveRenderServer(serverName: string): number
}
