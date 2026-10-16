import type { NSView } from './AppKit'

import type { CGSize } from './CoreFoundation'

import type {
	Tcl_HashTable,
	Tcl_ObjType,
	Tk_ImageType,
	Tk_PhotoImageFormat,
	Tk_SmoothMethod,
} from './Runtime'

import type { interop } from './objc-runtime'

import { Tcl_QueuePosition, Tk_Anchor, Tk_OptionType } from './Runtime'

export declare const xBitReverseTable: unknown /* const array */

export declare const TtkNullElementOptions: interop.Pointer

export declare const tkIntPlatStubsPtr: interop.Pointer

export declare const tkMacOSXEmbedHandler: interop.Pointer

export declare const tkIntStubsPtr: interop.Pointer

export declare const tkPredefBitmapTable: Tcl_HashTable

export declare const tkPhotoImageType: Tk_ImageType

export declare const tkMainWindowList: interop.Pointer

export declare const tkImgFmtPPM: Tk_PhotoImageFormat

export declare const tkImgFmtGIF: Tk_PhotoImageFormat

export declare const tkStateKeyObjType: Tcl_ObjType

export declare const tkFontObjType: Tcl_ObjType

export declare const tkCursorObjType: Tcl_ObjType

export declare const tkColorObjType: Tcl_ObjType

export declare const tkBitmapObjType: Tcl_ObjType

export declare const tkDisplayList: interop.Pointer

export declare const LU_SHIFT: number

export declare const LU_CAPS: number

export declare const Ttk_ElementClass: number

export declare const Ttk_Theme: number

export declare const ttkNullElementSpec: Ttk_ElementSpec

export declare const Ttk_StateMap: number

export declare const tkTextIndexType: Tcl_ObjType

export declare const tkOptionObjType: Tcl_ObjType

export declare const tkBorderObjType: Tcl_ObjType

export declare const tkHandleEventProc: (p1: interop.PointerConvertible) => void

export declare const tkIntXlibStubsPtr: interop.Pointer

export declare const tkBitmapImageType: Tk_ImageType

export declare const LU_IGNORE: number

export declare const ttkStubsPtr: interop.Pointer

export declare const tkBezierSmoothMethod: Tk_SmoothMethod

export declare const ArrowDirection: {
	UP: 0
	DOWN: 1
	LEFT: 2
	RIGHT: 3
}

export declare const Ttk_Compound: {
	NONE: 0
	TEXT: 1
	IMAGE: 2
	CENTER: 3
	TOP: 4
	BOTTOM: 5
	LEFT: 6
	RIGHT: 7
}

export declare const Ttk_ButtonDefaultState: {
	NORMAL: 0
	ACTIVE: 1
	DISABLED: 2
}

export declare const TTKStyleVersion2: {
	TK_STYLE_VERSION_2: 2
}

export declare const XIMCaretStyle: {
	Invisible: 0
	Primary: 1
	Secondary: 2
}

export declare const XIMCaretDirection: {
	ForwardChar: 0
	BackwardChar: 1
	ForwardWord: 2
	BackwardWord: 3
	CaretUp: 4
	CaretDown: 5
	NextLine: 6
	PreviousLine: 7
	LineStart: 8
	LineEnd: 9
	AbsolutePosition: 10
	DontChange: 11
}

export declare const XIMStatusDataType: {
	Text: 0
	Bitmap: 1
}

export declare const Ttk_Side: {
	LEFT: 0
	TOP: 1
	RIGHT: 2
	BOTTOM: 3
}

export declare const Ttk_Orient: {
	HORIZONT: 0
	VERTIC: 1
}

export declare const XICCEncodingStyle: {
	String: 0
	CompoundText: 1
	Text: 2
	StdICCText: 3
}

export declare class TkFont {
	constructor(init?: TkFont)
	resourceRefCount: number
	objRefCount: number
	cacheHashPtr: interop.Pointer
	namedHashPtr: interop.Pointer
	screen: interop.Pointer
	tabWidth: number
	underlinePos: number
	underlineHeight: number
	fid: number
	fa: TkFontAttributes
	fm: TkFontMetrics
	nextPtr: interop.Pointer
}

export declare class TkFontMetrics {
	constructor(init?: TkFontMetrics)
	ascent: number
	descent: number
	maxWidth: number
	fixed: number
}

export declare class TtkImageSpec {
	constructor(init?: TtkImageSpec)
}

export declare class TTKLayoutInstruction {
	constructor(init?: TTKLayoutInstruction)
	elementName: string | null
	opcode: number
}

export declare class NullElement {
	constructor(init?: NullElement)
	unused: interop.Pointer
}

export declare class Ttk_ElementSpec {
	constructor(init?: Ttk_ElementSpec)
	version: interop.Enum<typeof TTKStyleVersion2>
	elementSize: number
	options: interop.Pointer
	size: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => void | null
	draw: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: number,
	) => void | null
}

export declare class Ttk_ElementOptionSpec {
	constructor(init?: Ttk_ElementOptionSpec)
	optionName: string | null
	type: interop.Enum<typeof Tk_OptionType>
	offset: number
	defaultValue: string | null
}

export declare class Ttk_Style_ {
	constructor(init?: Ttk_Style_)
}

export declare class Ttk_Layout_ {
	constructor(init?: Ttk_Layout_)
}

export declare class Ttk_ElementClass_ {
	constructor(init?: Ttk_ElementClass_)
}

export declare class Ttk_Theme_ {
	constructor(init?: Ttk_Theme_)
}

export declare class Ttk_Box {
	constructor(init?: Ttk_Box)
	x: number
	y: number
	width: number
	height: number
}

export declare class Ttk_StateSpec {
	constructor(init?: Ttk_StateSpec)
	onbits: number
	offbits: number
}

export declare class TkIntPlatStubHooks {
	constructor(init?: TkIntPlatStubHooks)
}

export declare class TkMacOSXEmbedHandler {
	constructor(init?: TkMacOSXEmbedHandler)
	registerWinProc: (p1: number, p2: interop.PointerConvertible) => number | null
	getPortProc: (p1: interop.PointerConvertible) => interop.Pointer | null
	containerExistProc: (p1: interop.PointerConvertible) => number | null
	getClipProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null
	getOffsetProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null
}

export declare class TkIntStubHooks {
	constructor(init?: TkIntStubHooks)
}

export declare class TkWindowPrivate {
	constructor(init?: TkWindowPrivate)
	winPtr: interop.Pointer
	view: NSView | null
	context: interop.Object | null
	xOff: number
	yOff: number
	size: CGSize
	visRgn: interop.Object | null
	aboveVisRgn: interop.Object | null
	drawRgn: interop.Object | null
	referenceCount: number
	toplevel: interop.Pointer
	flags: number
}

export declare class TkDisplayFocusInfo {
	constructor(init?: TkDisplayFocusInfo)
}

export declare class TkWmInfo {
	constructor(init?: TkWmInfo)
}

export declare class TkClipboardTarget {
	constructor(init?: TkClipboardTarget)
}

export declare class TkMainInfo {
	constructor(init?: TkMainInfo)
	refCount: number
	winPtr: interop.Pointer
	interp: interop.Pointer
	nameTable: Tcl_HashTable
	deletionEpoch: number
	bindingTable: interop.Pointer
	bindInfo: interop.Pointer
	fontInfoPtr: interop.Pointer
	tlFocusPtr: interop.Pointer
	displayFocusPtr: interop.Pointer
	optionRootPtr: interop.Pointer
	imageTable: Tcl_HashTable
	strictMotif: number
	alwaysShowSelection: number
	nextPtr: interop.Pointer
}

export declare class TkWindowEvent {
	constructor(init?: TkWindowEvent)
}

export declare class TkDisplay {
	constructor(init?: TkDisplay)
	display: interop.Pointer
	nextPtr: interop.Pointer
	name: string | null
	lastEventTime: number
	borderInit: number
	borderTable: Tcl_HashTable
	atomInit: number
	nameTable: Tcl_HashTable
	atomTable: Tcl_HashTable
	bindInfoStale: number
	modeModMask: number
	metaModMask: number
	altModMask: number
	lockUsage: number
	numModKeyCodes: number
	modKeyCodes: interop.Pointer
	bitmapInit: number
	bitmapAutoNumber: number
	bitmapNameTable: Tcl_HashTable
	bitmapIdTable: Tcl_HashTable
	bitmapDataTable: Tcl_HashTable
	numIdSearches: number
	numSlowSearches: number
	colorInit: number
	stressPtr: interop.Pointer
	colorNameTable: Tcl_HashTable
	colorValueTable: Tcl_HashTable
	cursorInit: number
	cursorNameTable: Tcl_HashTable
	cursorDataTable: Tcl_HashTable
	cursorIdTable: Tcl_HashTable
	cursorString: unknown /* const array */
	cursorFont: number
	errorPtr: interop.Pointer
	deleteCount: number
	delayedMotionPtr: interop.Pointer
	focusDebug: number
	implicitWinPtr: interop.Pointer
	focusPtr: interop.Pointer
	gcValueTable: Tcl_HashTable
	gcIdTable: Tcl_HashTable
	gcInit: number
	maintainHashTable: Tcl_HashTable
	geomInit: number
	uidTable: Tcl_HashTable
	uidInit: number
	grabWinPtr: interop.Pointer
	eventualGrabWinPtr: interop.Pointer
	buttonWinPtr: interop.Pointer
	serverWinPtr: interop.Pointer
	firstGrabEventPtr: interop.Pointer
	lastGrabEventPtr: interop.Pointer
	grabFlags: number
	gridInit: number
	gridHashTable: Tcl_HashTable
	imageId: number
	postCommandGeneration: number
	packInit: number
	packerHashTable: Tcl_HashTable
	placeInit: number
	masterTable: Tcl_HashTable
	slaveTable: Tcl_HashTable
	selectionInfoPtr: interop.Pointer
	multipleAtom: number
	incrAtom: number
	targetsAtom: number
	timestampAtom: number
	textAtom: number
	compoundTextAtom: number
	applicationAtom: number
	windowAtom: number
	clipboardAtom: number
	utf8Atom: number
	clipWindow: interop.Pointer
	clipboardActive: number
	clipboardAppPtr: interop.Pointer
	clipTargetPtr: interop.Pointer
	commTkwin: interop.Pointer
	commProperty: number
	registryProperty: number
	appNameProperty: number
	idStackPtr: interop.Pointer
	defaultAllocProc: (p1: interop.PointerConvertible) => number | null
	windowStackPtr: interop.Pointer
	idCleanupScheduled: interop.Pointer
	firstWmPtr: interop.Pointer
	foregroundWmPtr: interop.Pointer
	destroyCount: number
	lastDestroyRequest: number
	cmapPtr: interop.Pointer
	winTable: Tcl_HashTable
	refCount: number
	mouseButtonState: number
	mouseButtonWindow: number
	warpWindow: number
	warpX: number
	warpY: number
	flags: number
	caret: TkCaret
	iconDataSize: number
	iconDataPtr: interop.Pointer
}

export declare class TkWindow {
	constructor(init?: TkWindow)
	display: interop.Pointer
	dispPtr: interop.Pointer
	screenNum: number
	visual: interop.Pointer
	depth: number
	window: number
	childList: interop.Pointer
	lastChildPtr: interop.Pointer
	parentPtr: interop.Pointer
	nextPtr: interop.Pointer
	mainPtr: interop.Pointer
	pathName: string | null
	nameUid: string | null
	classUid: string | null
	changes: XWindowChanges
	dirtyChanges: number
	atts: XSetWindowAttributes
	dirtyAtts: number
	flags: number
	handlerList: interop.Pointer
	tagPtr: interop.Pointer
	numTags: number
	optionLevel: number
	selHandlerList: interop.Pointer
	geomMgrPtr: interop.Pointer
	geomData: interop.Pointer
	reqWidth: number
	reqHeight: number
	internalBorderLeft: number
	wmInfoPtr: interop.Pointer
	classProcsPtr: interop.Pointer
	instanceData: interop.Pointer
	privatePtr: interop.Pointer
	internalBorderRight: number
	internalBorderTop: number
	internalBorderBottom: number
	minReqWidth: number
	minReqHeight: number
}

export declare class TkCursor {
	constructor(init?: TkCursor)
	cursor: interop.Pointer
	display: interop.Pointer
	resourceRefCount: number
	objRefCount: number
	otherTable: interop.Pointer
	hashPtr: interop.Pointer
	idHashPtr: interop.Pointer
	nextPtr: interop.Pointer
}

export declare class TkBindInfo_ {
	constructor(init?: TkBindInfo_)
}

export declare class TkStressedCmap {
	constructor(init?: TkStressedCmap)
}

export declare class TkRegion_ {
	constructor(init?: TkRegion_)
}

export declare class TkpCursor_ {
	constructor(init?: TkpCursor_)
}

export declare class TkColormap {
	constructor(init?: TkColormap)
}

export declare class TtkStubHooks {
	constructor(init?: TtkStubHooks)
}

export declare class TtkStubs {
	constructor(init?: TtkStubs)
	magic: number
	epoch: number
	revision: number
	hooks: interop.Pointer
	Ttk_Theme: (
		p1: interop.PointerConvertible,
	) => (p1: interop.PointerConvertible, p2: string) => number | null
	ttk_RegisterCleanup: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => void | null
	ttk_RegisterElementSpec: (
		p1: number,
		p2: string,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	ttk_RegisterElement: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: string,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => interop.Pointer | null
	ttk_RegisterElementFactory: (
		p1: interop.PointerConvertible,
		p2: string,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	ttk_RegisterLayout: (p1: number, p2: string, p3: number) => void | null
	reserved9: () => void | null
	ttk_GetStateSpecFromObj: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ttk_NewStateSpecObj: (p1: number, p2: number) => interop.Pointer | null
	Ttk_StateMap: (
		p1: interop.PointerConvertible,
	) => (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	ttk_StateMapLookup: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
	) => interop.Pointer | null
	ttk_StateTableLookup: (p1: interop.PointerConvertible, p2: number) => number | null
	reserved15: () => void | null
	reserved16: () => void | null
	reserved17: () => void | null
	reserved18: () => void | null
	reserved19: () => void | null
	ttk_GetPaddingFromObj: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	ttk_GetBorderFromObj: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ttk_GetStickyFromObj: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	Ttk_Padding: (
		p1: interop.PointerConvertible,
	) => (p1: number, p2: number, p3: number, p4: number) => number | null
	Ttk_Box: (
		p1: interop.PointerConvertible,
	) => (p1: number, p2: number, p3: number, p4: number) => number | null
	ttk_BoxContains: (p1: number, p2: number, p3: number) => number | null
	ttk_NewBoxObj: (p1: number) => interop.Pointer | null
	reserved36: () => void | null
	reserved37: () => void | null
	reserved38: () => void | null
	reserved39: () => void | null
	ttk_GetOrientFromObj: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class _XIMStatusDrawCallbackStruct {
	constructor(init?: _XIMStatusDrawCallbackStruct)
	type: interop.Enum<typeof XIMStatusDataType>
	data: unnamed_11485782119801829208
}

export declare class _XIMPreeditDrawCallbackStruct {
	constructor(init?: _XIMPreeditDrawCallbackStruct)
	caret: number
	chg_first: number
	chg_length: number
	text: interop.Pointer
}

export declare class XIMStyles {
	constructor(init?: XIMStyles)
	count_styles: number
	supported_styles: interop.Pointer
}

export declare class _XIM {
	constructor(init?: _XIM)
}

export declare class XwcTextItem {
	constructor(init?: XwcTextItem)
	chars: interop.Pointer
	nchars: number
	delta: number
	font_set: interop.Pointer
}

export declare class XmbTextItem {
	constructor(init?: XmbTextItem)
	chars: string | null
	nchars: number
	delta: number
	font_set: interop.Pointer
}

export declare class _XFontSet {
	constructor(init?: _XFontSet)
}

export declare class XFontSetExtents {
	constructor(init?: XFontSetExtents)
	max_ink_extent: XRectangle
	max_logical_extent: XRectangle
}

export declare class XTextItem16 {
	constructor(init?: XTextItem16)
	chars: interop.Pointer
	nchars: number
	delta: number
	font: number
}

export declare class XChar2b {
	constructor(init?: XChar2b)
	byte1: number
	byte2: number
}

export declare class XTextItem {
	constructor(init?: XTextItem)
	chars: string | null
	nchars: number
	delta: number
	font: number
}

export declare class XCharStruct {
	constructor(init?: XCharStruct)
	lbearing: number
	rbearing: number
	width: number
	ascent: number
	descent: number
	attributes: number
}

export declare class XErrorEvent {
	constructor(init?: XErrorEvent)
	type: number
	display: interop.Pointer
	resourceid: number
	serial: number
	error_code: number
	request_code: number
	minor_code: number
}

export declare class XMappingEvent {
	constructor(init?: XMappingEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	request: number
	first_keycode: number
	count: number
}

export declare class XClientMessageEvent {
	constructor(init?: XClientMessageEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	message_type: number
	format: number
	data: unnamed_6829101999670043274
}

export declare class XSelectionEvent {
	constructor(init?: XSelectionEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	requestor: number
	selection: number
	target: number
	property: number
	time: number
}

export declare class XSelectionRequestEvent {
	constructor(init?: XSelectionRequestEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	owner: number
	requestor: number
	selection: number
	target: number
	property: number
	time: number
}

export declare class XSelectionClearEvent {
	constructor(init?: XSelectionClearEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	selection: number
	time: number
}

export declare class XCirculateRequestEvent {
	constructor(init?: XCirculateRequestEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	parent: number
	window: number
	place: number
}

export declare class XCirculateEvent {
	constructor(init?: XCirculateEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	event: number
	window: number
	place: number
}

export declare class XMapRequestEvent {
	constructor(init?: XMapRequestEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	parent: number
	window: number
}

export declare class XUnmapEvent {
	constructor(init?: XUnmapEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	event: number
	window: number
	from_configure: number
}

export declare class XDestroyWindowEvent {
	constructor(init?: XDestroyWindowEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	event: number
	window: number
}

export declare class XNoExposeEvent {
	constructor(init?: XNoExposeEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	drawable: number
	major_code: number
	minor_code: number
}

export declare class XGraphicsExposeEvent {
	constructor(init?: XGraphicsExposeEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	drawable: number
	x: number
	y: number
	width: number
	height: number
	count: number
	major_code: number
	minor_code: number
}

export declare class XKeymapEvent {
	constructor(init?: XKeymapEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	key_vector: unknown /* const array */
}

export declare class XFocusChangeEvent {
	constructor(init?: XFocusChangeEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	mode: number
	detail: number
}

export declare class XMotionEvent {
	constructor(init?: XMotionEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	root: number
	subwindow: number
	time: number
	x: number
	y: number
	x_root: number
	y_root: number
	state: number
	is_hint: number
	same_screen: number
}

export declare class XButtonEvent {
	constructor(init?: XButtonEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	root: number
	subwindow: number
	time: number
	x: number
	y: number
	x_root: number
	y_root: number
	state: number
	button: number
	same_screen: number
}

export declare class _XIMFilter {
	constructor(init?: _XIMFilter)
}

export declare class unnamed_13217392612618162696 {
	constructor(init?: unnamed_13217392612618162696)
	defaultCCCs: string | null
	clientCmaps: string | null
	perVisualIntensityMaps: string | null
}

export declare class _XKeytrans {
	constructor(init?: _XKeytrans)
}

export declare class _XLockInfo {
	constructor(init?: _XLockInfo)
}

export declare class _XrmHashBucketRec {
	constructor(init?: _XrmHashBucketRec)
}

export declare class _XFreeFuncs {
	constructor(init?: _XFreeFuncs)
}

export declare class XSegment {
	constructor(init?: XSegment)
	x1: number
	y1: number
	x2: number
	y2: number
}

export declare class XColor {
	constructor(init?: XColor)
	pixel: number
	red: number
	green: number
	blue: number
	flags: number
	pad: number
}

export declare class funcs {
	constructor(init?: funcs)
	create_image: () => interop.Pointer | null
	destroy_image: (p1: interop.PointerConvertible) => number | null
	get_pixel: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null
	put_pixel: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number | null
	sub_image: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: number,
		p4: number,
		p5: number,
	) => interop.Pointer | null
	add_pixel: (p1: interop.PointerConvertible, p2: number) => number | null
}

export declare class XHostAddress {
	constructor(init?: XHostAddress)
	family: number
	length: number
	address: string | null
}

export declare class XWindowAttributes {
	constructor(init?: XWindowAttributes)
	x: number
	y: number
	width: number
	height: number
	border_width: number
	depth: number
	visual: interop.Pointer
	root: number
	class: number
	bit_gravity: number
	win_gravity: number
	backing_store: number
	backing_planes: number
	backing_pixel: number
	save_under: number
	colormap: number
	map_installed: number
	map_state: number
	all_event_masks: number
	your_event_mask: number
	do_not_propagate_mask: number
	override_redirect: number
	screen: interop.Pointer
}

export declare class XSetWindowAttributes {
	constructor(init?: XSetWindowAttributes)
	background_pixmap: number
	background_pixel: number
	border_pixmap: number
	border_pixel: number
	bit_gravity: number
	win_gravity: number
	backing_store: number
	backing_planes: number
	backing_pixel: number
	save_under: number
	event_mask: number
	do_not_propagate_mask: number
	override_redirect: number
	colormap: number
	cursor: number
}

export declare class ScreenFormat {
	constructor(init?: ScreenFormat)
	ext_data: interop.Pointer
	depth: number
	bits_per_pixel: number
	scanline_pad: number
}

export declare class _XDisplay {
	constructor(init?: _XDisplay)
	ext_data: interop.Pointer
	free_funcs: interop.Pointer
	fd: number
	conn_checker: number
	proto_major_version: number
	proto_minor_version: number
	vendor: string | null
	resource_base: number
	resource_mask: number
	resource_id: number
	resource_shift: number
	resource_alloc: () => number | null
	byte_order: number
	bitmap_unit: number
	bitmap_pad: number
	bitmap_bit_order: number
	nformats: number
	pixmap_format: interop.Pointer
	vnumber: number
	release: number
	head: interop.Pointer
	tail: interop.Pointer
	qlen: number
	request: number
	last_req: string | null
	buffer: string | null
	bufptr: string | null
	bufmax: string | null
	max_request_size: number
	db: interop.Pointer
	synchandler: () => number | null
	display_name: string | null
	default_screen: number
	nscreens: number
	screens: interop.Pointer
	motion_buffer: number
	flags: number
	min_keycode: number
	max_keycode: number
	keysyms: interop.Pointer
	modifiermap: interop.Pointer
	keysyms_per_keycode: number
	xdefaults: string | null
	scratch_buffer: string | null
	scratch_length: number
	ext_number: number
	ext_procs: interop.Pointer
	event_vec: unknown /* const array */
	wire_vec: unknown /* const array */
	lock_meaning: number
	lock: interop.Pointer
	async_handlers: interop.Pointer
	bigreq_size: number
	lock_fns: interop.Pointer
	key_bindings: interop.Pointer
	cursor_font: number
	atoms: interop.Pointer
	mode_switch: number
	context_db: interop.Pointer
	error_vec: interop.Pointer
	cms: unnamed_13217392612618162696
	im_filters: interop.Pointer
	qfree: interop.Pointer
	next_event_serial_num: number
	savedsynchandler: () => number | null
}

export declare class XExtCodes {
	constructor(init?: XExtCodes)
	extension: number
	major_opcode: number
	first_event: number
	first_error: number
}

export declare class _XExtData {
	constructor(init?: _XExtData)
	number: number
	next: interop.Pointer
	free_private: () => number | null
	private_data: string | null
}

export declare class unnamed_7044465383961058737 {
	constructor(init?: unnamed_7044465383961058737)
	colormap: number
	red_max: number
	red_mult: number
	green_max: number
	green_mult: number
	blue_max: number
	blue_mult: number
	base_pixel: number
	visualid: number
	killid: number
}

export declare class unnamed_16337562390196501752 {
	constructor(init?: unnamed_16337562390196501752)
	visual: interop.Pointer
	visualid: number
	screen: number
	depth: number
	class: number
	red_mask: number
	green_mask: number
	blue_mask: number
	colormap_size: number
	bits_per_rgb: number
}

export declare class XClassHint {
	constructor(init?: XClassHint)
	res_name: string | null
	res_class: string | null
}

export declare class TkFontAttributes {
	constructor(init?: TkFontAttributes)
	family: string | null
	size: number
	weight: number
	slant: number
	underline: number
	overstrike: number
}

export declare class unnamed_12402282187060610322 {
	constructor(init?: unnamed_12402282187060610322)
	value: interop.Pointer
	encoding: number
	format: number
	nitems: number
}

export declare class unnamed_3438557735055231788 {
	constructor(init?: unnamed_3438557735055231788)
	x: number
	y: number
}

export declare class XSizeHints {
	constructor(init?: XSizeHints)
	flags: number
	x: number
	y: number
	width: number
	height: number
	min_width: number
	min_height: number
	max_width: number
	max_height: number
	width_inc: number
	height_inc: number
	min_aspect: unnamed_3438557735055231788
	max_aspect: unnamed_3438557735055231788
	base_width: number
	base_height: number
	win_gravity: number
}

export declare class XExposeEvent {
	constructor(init?: XExposeEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	x: number
	y: number
	width: number
	height: number
	count: number
}

export declare class XResizeRequestEvent {
	constructor(init?: XResizeRequestEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	width: number
	height: number
}

export declare class XKeyboardControl {
	constructor(init?: XKeyboardControl)
	key_click_percent: number
	bell_percent: number
	bell_pitch: number
	bell_duration: number
	led: number
	led_mode: number
	key: number
	auto_repeat_mode: number
}

export declare class Screen {
	constructor(init?: Screen)
	ext_data: interop.Pointer
	display: interop.Pointer
	root: number
	width: number
	height: number
	mwidth: number
	mheight: number
	ndepths: number
	depths: interop.Pointer
	root_depth: number
	root_visual: interop.Pointer
	default_gc: interop.Pointer
	cmap: number
	white_pixel: number
	black_pixel: number
	max_maps: number
	min_maps: number
	backing_store: number
	save_unders: number
	root_input_mask: number
}

export declare class Ttk_Padding {
	constructor(init?: Ttk_Padding)
	left: number
	top: number
	right: number
	bottom: number
}

export declare class TkpClipMask {
	constructor(init?: TkpClipMask)
	type: number
	value: unnamed_7224119439400604794
}

export declare class TtkEnsemble {
	constructor(init?: TtkEnsemble)
	name: string | null
	command: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	ensemble: interop.Pointer
}

export declare class TkXLFDAttributes {
	constructor(init?: TkXLFDAttributes)
	foundry: string | null
	slant: number
	setwidth: number
	charset: string | null
}

export declare class TkCaret {
	constructor(init?: TkCaret)
	winPtr: interop.Pointer
	x: number
	y: number
	height: number
}

export declare class TkIntXlibStubs {
	constructor(init?: TkIntXlibStubs)
	magic: number
	hooks: interop.Pointer
}

export declare class Ttk_ResourceCache_ {
	constructor(init?: Ttk_ResourceCache_)
}

export declare class XColormapEvent {
	constructor(init?: XColormapEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	colormap: number
	new: number
	state: number
}

export declare class XAnyEvent {
	constructor(init?: XAnyEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
}

export declare class TkToplevelFocusInfo {
	constructor(init?: TkToplevelFocusInfo)
}

export declare class _XSQEvent {
	constructor(init?: _XSQEvent)
}

export declare class TkStateMap {
	constructor(init?: TkStateMap)
	numKey: number
	strKey: string | null
}

export declare class XCreateWindowEvent {
	constructor(init?: XCreateWindowEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	parent: number
	window: number
	x: number
	y: number
	width: number
	height: number
	border_width: number
	override_redirect: number
}

export declare class XPoint {
	constructor(init?: XPoint)
	x: number
	y: number
}

export declare class XMapEvent {
	constructor(init?: XMapEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	event: number
	window: number
	override_redirect: number
}

export declare class XVisibilityEvent {
	constructor(init?: XVisibilityEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	state: number
}

export declare class XKeyboardState {
	constructor(init?: XKeyboardState)
	key_click_percent: number
	bell_percent: number
	bell_pitch: number
	bell_duration: number
	led_mask: number
	global_auto_repeat: number
	auto_repeats: unknown /* const array */
}

export declare class Ttk_StateTable {
	constructor(init?: Ttk_StateTable)
	index: number
	onBits: number
	offBits: number
}

export declare class Depth {
	constructor(init?: Depth)
	depth: number
	nvisuals: number
	visuals: interop.Pointer
}

export declare class XConfigureEvent {
	constructor(init?: XConfigureEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	event: number
	window: number
	x: number
	y: number
	width: number
	height: number
	border_width: number
	above: number
	override_redirect: number
}

export declare class TkFontInfo {
	constructor(init?: TkFontInfo)
}

export declare class XIconSize {
	constructor(init?: XIconSize)
	min_width: number
	min_height: number
	max_width: number
	max_height: number
	width_inc: number
	height_inc: number
}

export declare class _XRegion {
	constructor(init?: _XRegion)
}

export declare class XGCValues {
	constructor(init?: XGCValues)
	function: number
	plane_mask: number
	foreground: number
	background: number
	line_width: number
	line_style: number
	cap_style: number
	join_style: number
	fill_style: number
	fill_rule: number
	arc_mode: number
	tile: number
	stipple: number
	ts_x_origin: number
	ts_y_origin: number
	font: number
	subwindow_mode: number
	graphics_exposures: number
	clip_x_origin: number
	clip_y_origin: number
	clip_mask: number
	dash_offset: number
	dashes: number
}

export declare class XKeyEvent {
	constructor(init?: XKeyEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	root: number
	subwindow: number
	time: number
	x: number
	y: number
	x_root: number
	y_root: number
	state: number
	keycode: number
	same_screen: number
	trans_chars: unknown /* const array */
	nbytes: number
}

export declare class TkPredefBitmap {
	constructor(init?: TkPredefBitmap)
	source: string | null
	width: number
	height: number
	native: number
}

export declare class TkEventHandler {
	constructor(init?: TkEventHandler)
	mask: number
	proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null
	clientData: interop.Pointer
	nextPtr: interop.Pointer
}

export declare class _XComposeStatus {
	constructor(init?: _XComposeStatus)
	compose_ptr: number
	chars_matched: number
}

export declare class _XInternalAsync {
	constructor(init?: _XInternalAsync)
}

export declare class Ttk_LayoutNode_ {
	constructor(init?: Ttk_LayoutNode_)
}

export declare class _XIC {
	constructor(init?: _XIC)
}

export declare class _XDisplayAtoms {
	constructor(init?: _XDisplayAtoms)
}

export declare class TkSelectionInfo {
	constructor(init?: TkSelectionInfo)
}

export declare class _XImage {
	constructor(init?: _XImage)
	width: number
	height: number
	xoffset: number
	format: number
	data: string | null
	byte_order: number
	bitmap_unit: number
	bitmap_bit_order: number
	bitmap_pad: number
	depth: number
	bytes_per_line: number
	bits_per_pixel: number
	red_mask: number
	green_mask: number
	blue_mask: number
	obdata: string | null
	f: funcs
}

export declare class Visual {
	constructor(init?: Visual)
	ext_data: interop.Pointer
	visualid: number
	class: number
	red_mask: number
	green_mask: number
	blue_mask: number
	bits_per_rgb: number
	map_entries: number
}

export declare class XModifierKeymap {
	constructor(init?: XModifierKeymap)
	max_keypermod: number
	modifiermap: interop.Pointer
}

export declare class _XIMText {
	constructor(init?: _XIMText)
	length: number
	feedback: interop.Pointer
	encoding_is_wchar: number
	string: unnamed_10117225375179073326
}

export declare class TkSelHandler {
	constructor(init?: TkSelHandler)
}

export declare class XConfigureRequestEvent {
	constructor(init?: XConfigureRequestEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	parent: number
	window: number
	x: number
	y: number
	width: number
	height: number
	border_width: number
	above: number
	detail: number
	value_mask: number
}

export declare class TkpGCCache {
	constructor(init?: TkpGCCache)
	cachedForeground: number
	cachedForegroundColor: interop.Object | null
	cachedBackground: number
	cachedBackgroundColor: interop.Object | null
}

export declare class _XIMPreeditCaretCallbackStruct {
	constructor(init?: _XIMPreeditCaretCallbackStruct)
	position: number
	direction: interop.Enum<typeof XIMCaretDirection>
	style: interop.Enum<typeof XIMCaretStyle>
}

export declare class _XContextDB {
	constructor(init?: _XContextDB)
}

export declare class ElArray {
	constructor(init?: ElArray)
}

export declare class XFontProp {
	constructor(init?: XFontProp)
	name: number
	card32: number
}

export declare class XIMCallback {
	constructor(init?: XIMCallback)
	client_data: string | null
	callback: () => void | null
}

export declare class TkIntXlibStubHooks {
	constructor(init?: TkIntXlibStubHooks)
}

export declare class XWindowChanges {
	constructor(init?: XWindowChanges)
	x: number
	y: number
	width: number
	height: number
	border_width: number
	sibling: number
	stack_mode: number
}

export declare class XReparentEvent {
	constructor(init?: XReparentEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	event: number
	window: number
	parent: number
	x: number
	y: number
	override_redirect: number
}

export declare class _XExten {
	constructor(init?: _XExten)
}

export declare class XPixmapFormatValues {
	constructor(init?: XPixmapFormatValues)
	depth: number
	bits_per_pixel: number
	scanline_pad: number
}

export declare class XPropertyEvent {
	constructor(init?: XPropertyEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	atom: number
	time: number
	state: number
}

export declare class unnamed_17599682455591046079 {
	constructor(init?: unnamed_17599682455591046079)
	flags: number
	input: number
	initial_state: number
	icon_pixmap: number
	icon_window: number
	icon_x: number
	icon_y: number
	icon_mask: number
	window_group: number
}

export declare class XArc {
	constructor(init?: XArc)
	x: number
	y: number
	width: number
	height: number
	angle1: number
	angle2: number
}

export declare class XTimeCoord {
	constructor(init?: XTimeCoord)
	time: number
	x: number
	y: number
}

export declare class TkErrorHandler {
	constructor(init?: TkErrorHandler)
	dispPtr: interop.Pointer
	firstRequest: number
	lastRequest: number
	error: number
	request: number
	minorCode: number
	errorProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	clientData: interop.Pointer
	nextPtr: interop.Pointer
}

export declare class XGravityEvent {
	constructor(init?: XGravityEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	event: number
	window: number
	x: number
	y: number
}

export declare class XCrossingEvent {
	constructor(init?: XCrossingEvent)
	type: number
	serial: number
	send_event: number
	display: interop.Pointer
	window: number
	root: number
	subwindow: number
	time: number
	x: number
	y: number
	x_root: number
	y_root: number
	mode: number
	detail: number
	same_screen: number
	focus: number
	state: number
}

export declare class XFontStruct {
	constructor(init?: XFontStruct)
	ext_data: interop.Pointer
	fid: number
	direction: number
	min_char_or_byte2: number
	max_char_or_byte2: number
	min_byte1: number
	max_byte1: number
	all_chars_exist: number
	default_char: number
	n_properties: number
	properties: interop.Pointer
	min_bounds: XCharStruct
	max_bounds: XCharStruct
	per_char: interop.Pointer
	ascent: number
	descent: number
}

export declare class TkKeyEvent {
	constructor(init?: TkKeyEvent)
	keyEvent: XKeyEvent
	charValuePtr: string | null
	charValueLen: number
}

export declare class _XLockPtrs {
	constructor(init?: _XLockPtrs)
}

export declare class TkGrabEvent {
	constructor(init?: TkGrabEvent)
}

export declare class TkIdStack {
	constructor(init?: TkIdStack)
}

export declare class XRectangle {
	constructor(init?: XRectangle)
	x: number
	y: number
	width: number
	height: number
}

export type unnamed_11485782119801829208Descriptor =
	| { text: interop.PointerConvertible }
	| { bitmap: number }

export declare class unnamed_11485782119801829208 {
	constructor(init?: unnamed_11485782119801829208Descriptor)
	text: interop.Pointer
	bitmap: number
}

export type unnamed_10117225375179073326Descriptor =
	| { multi_byte: string | null }
	| { wide_char: interop.PointerConvertible }

export declare class unnamed_10117225375179073326 {
	constructor(init?: unnamed_10117225375179073326Descriptor)
	multi_byte: string | null
	wide_char: interop.Pointer
}

export type XEDataObjectDescriptor =
	| { display: interop.PointerConvertible }
	| { gc: interop.PointerConvertible }
	| { visual: interop.PointerConvertible }
	| { screen: interop.PointerConvertible }
	| { pixmap_format: interop.PointerConvertible }
	| { font: interop.PointerConvertible }

export declare class XEDataObject {
	constructor(init?: XEDataObjectDescriptor)
	display: interop.Pointer
	gc: interop.Pointer
	visual: interop.Pointer
	screen: interop.Pointer
	pixmap_format: interop.Pointer
	font: interop.Pointer
}

export type unnamed_7224119439400604794Descriptor =
	| { pixmap: number }
	| { region: interop.PointerConvertible }

export declare class unnamed_7224119439400604794 {
	constructor(init?: unnamed_7224119439400604794Descriptor)
	pixmap: number
	region: interop.Pointer
}

export type _XEventDescriptor =
	| { type: number }
	| { xany: XAnyEvent }
	| { xkey: XKeyEvent }
	| { xbutton: XButtonEvent }
	| { xmotion: XMotionEvent }
	| { xcrossing: XCrossingEvent }
	| { xfocus: XFocusChangeEvent }
	| { xexpose: XExposeEvent }
	| { xgraphicsexpose: XGraphicsExposeEvent }
	| { xnoexpose: XNoExposeEvent }
	| { xvisibility: XVisibilityEvent }
	| { xcreatewindow: XCreateWindowEvent }
	| { xdestroywindow: XDestroyWindowEvent }
	| { xunmap: XUnmapEvent }
	| { xmap: XMapEvent }
	| { xmaprequest: XMapRequestEvent }
	| { xreparent: XReparentEvent }
	| { xconfigure: XConfigureEvent }
	| { xgravity: XGravityEvent }
	| { xresizerequest: XResizeRequestEvent }
	| { xconfigurerequest: XConfigureRequestEvent }
	| { xcirculate: XCirculateEvent }
	| { xcirculaterequest: XCirculateRequestEvent }
	| { xproperty: XPropertyEvent }
	| { xselectionclear: XSelectionClearEvent }
	| { xselectionrequest: XSelectionRequestEvent }
	| { xselection: XSelectionEvent }
	| { xcolormap: XColormapEvent }
	| { xclient: XClientMessageEvent }
	| { xmapping: XMappingEvent }
	| { xerror: XErrorEvent }
	| { xkeymap: XKeymapEvent }
	| { pad: unknown /* const array */ }

export declare class _XEvent {
	constructor(init?: _XEventDescriptor)
	type: number
	xany: XAnyEvent
	xkey: XKeyEvent
	xbutton: XButtonEvent
	xmotion: XMotionEvent
	xcrossing: XCrossingEvent
	xfocus: XFocusChangeEvent
	xexpose: XExposeEvent
	xgraphicsexpose: XGraphicsExposeEvent
	xnoexpose: XNoExposeEvent
	xvisibility: XVisibilityEvent
	xcreatewindow: XCreateWindowEvent
	xdestroywindow: XDestroyWindowEvent
	xunmap: XUnmapEvent
	xmap: XMapEvent
	xmaprequest: XMapRequestEvent
	xreparent: XReparentEvent
	xconfigure: XConfigureEvent
	xgravity: XGravityEvent
	xresizerequest: XResizeRequestEvent
	xconfigurerequest: XConfigureRequestEvent
	xcirculate: XCirculateEvent
	xcirculaterequest: XCirculateRequestEvent
	xproperty: XPropertyEvent
	xselectionclear: XSelectionClearEvent
	xselectionrequest: XSelectionRequestEvent
	xselection: XSelectionEvent
	xcolormap: XColormapEvent
	xclient: XClientMessageEvent
	xmapping: XMappingEvent
	xerror: XErrorEvent
	xkeymap: XKeymapEvent
	pad: unknown /* const array */
}

export type unnamed_6829101999670043274Descriptor =
	| { b: unknown /* const array */ }
	| { s: unknown /* const array */ }
	| { l: unknown /* const array */ }

export declare class unnamed_6829101999670043274 {
	constructor(init?: unnamed_6829101999670043274Descriptor)
	b: unknown /* const array */
	s: unknown /* const array */
	l: unknown /* const array */
}

export declare function XAllocIconSize(): interop.Pointer

export declare function XAllocSizeHints(): interop.Pointer

export declare function XAllocStandardColormap(): interop.Pointer

export declare function XAllocWMHints(): interop.Pointer

export declare function XClipBox(): void

export declare function XCreateRegion(): interop.Pointer

export declare function XDefaultString(): string

export declare function XDeleteContext(): number

export declare function XDestroyRegion(): void

export declare function XEmptyRegion(): void

export declare function XEqualRegion(): void

export declare function XFindContext(): number

export declare function XGetClassHint(): number

export declare function XGetIconSizes(): number

export declare function XGetNormalHints(): number

export declare function XGetRGBColormaps(): number

export declare function XGetSizeHints(): number

export declare function XGetStandardColormap(): number

export declare function XGetTextProperty(): number

export declare function XGetWMClientMachine(): number

export declare function XGetWMHints(): interop.Pointer

export declare function XGetWMIconName(): number

export declare function XGetWMName(): number

export declare function XGetWMNormalHints(): number

export declare function XGetWMSizeHints(): number

export declare function XGetZoomHints(): number

export declare function XIntersectRegion(): void

export declare function XLookupString(): number

export declare function XMatchVisualInfo(): number

export declare function XOffsetRegion(): void

export declare function XPointInRegion(): number

export declare function XPolygonRegion(): interop.Pointer

export declare function XRectInRegion(): number

export declare function XSaveContext(): number

export declare function XSetClassHint(): void

export declare function XSetIconSizes(): void

export declare function XSetNormalHints(): void

export declare function XSetRGBColormaps(): void

export declare function XSetSizeHints(): void

export declare function XSetStandardProperties(): void

export declare function XSetTextProperty(): void

export declare function XSetWMHints(): void

export declare function XSetWMIconName(): void

export declare function XSetWMName(): void

export declare function XSetWMNormalHints(): void

export declare function XSetWMProperties(): void

export declare function XmbSetWMProperties(): void

export declare function XSetWMSizeHints(): void

export declare function XSetRegion(): void

export declare function XSetStandardColormap(): void

export declare function XSetZoomHints(): void

export declare function XShrinkRegion(): void

export declare function XSubtractRegion(): void

export declare function XmbTextListToTextProperty(): number

export declare function XwcTextListToTextProperty(): number

export declare function XwcFreeStringList(): void

export declare function XTextPropertyToStringList(): number

export declare function XmbTextPropertyToTextList(): number

export declare function XwcTextPropertyToTextList(): number

export declare function XUnionRectWithRegion(): void

export declare function XUnionRegion(): void

export declare function XWMGeometry(): number

export declare function XXorRegion(): void

export declare function Ttk_RegisterCleanup(
	interp: interop.PointerConvertible,
	deleteData: interop.PointerConvertible,
	cleanupProc: interop.PointerConvertible,
): number

export declare function Ttk_RegisterElementSpec(
	theme: number,
	elementName: string,
	elementSpec: interop.PointerConvertible,
	clientData: interop.PointerConvertible,
): number

export declare function Ttk_RegisterElementFactory(
	interp: interop.PointerConvertible,
	name: string,
	factoryProc: number,
	clientData: interop.PointerConvertible,
): number

export declare function Ttk_RegisterLayout(
	theme: number,
	className: string,
	layoutSpec: number,
): number

export declare function Ttk_GetStateSpecFromObj(
	interp: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	spec_rtn: interop.PointerConvertible,
): number

export declare function Ttk_StateTableLookup(map: interop.Pointer, state: number): number

export declare function Ttk_GetPaddingFromObj(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	pad_rtn: interop.PointerConvertible,
): number

export declare function Ttk_GetBorderFromObj(
	interp: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	pad_rtn: interop.PointerConvertible,
): number

export declare function Ttk_GetStickyFromObj(
	interp: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	sticky_rtn: interop.PointerConvertible,
): number

export declare function Ttk_BoxContains(box: number, x: number, y: number): number

export declare function Ttk_GetOrientFromObj(
	interp: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	orient: interop.PointerConvertible,
): number

export declare function TkAllocWindow(
	dispPtr: interop.PointerConvertible,
	screenNum: number,
	parentPtr: interop.PointerConvertible,
): interop.Pointer

export declare function TkBezierPoints(
	control: interop.Pointer,
	numSteps: number,
	coordPtr: interop.PointerConvertible,
): void

export declare function TkBezierScreenPoints(
	canvas: interop.PointerConvertible,
	control: interop.Pointer,
	numSteps: number,
	xPointPtr: interop.PointerConvertible,
): void

export declare function TkBindDeadWindow(winPtr: interop.PointerConvertible): void

export declare function TkBindEventProc(
	winPtr: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
): void

export declare function TkBindFree(mainPtr: interop.PointerConvertible): void

export declare function TkBindInit(mainPtr: interop.PointerConvertible): void

export declare function TkChangeEventWindow(
	eventPtr: interop.PointerConvertible,
	winPtr: interop.PointerConvertible,
): void

export declare function TkClipInit(
	interp: interop.PointerConvertible,
	dispPtr: interop.PointerConvertible,
): number

export declare function TkComputeAnchor(
	anchor: interop.Enum<typeof Tk_Anchor>,
	tkwin: interop.PointerConvertible,
	padX: number,
	padY: number,
	innerWidth: number,
	innerHeight: number,
	xPtr: interop.PointerConvertible,
	yPtr: interop.PointerConvertible,
): void

export declare function TkCopyAndGlobalEval(
	interp: interop.PointerConvertible,
	script: string,
): number

export declare function TkCreateBindingProcedure(
	interp: interop.PointerConvertible,
	bindingTable: interop.PointerConvertible,
	object: interop.PointerConvertible,
	eventString: string,
	evalProc: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
	) => number,
	freeProc: (p1: interop.PointerConvertible) => void,
	clientData: interop.PointerConvertible,
): number

export declare function TkCreateCursorFromData(
	tkwin: interop.PointerConvertible,
	source: string,
	mask: string,
	width: number,
	height: number,
	xHot: number,
	yHot: number,
	fg: XColor,
	bg: XColor,
): interop.Pointer

export declare function TkCreateFrame(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	argv: interop.PointerConvertible,
	toplevel: number,
	appName: string,
): number

export declare function TkCreateMainWindow(
	interp: interop.PointerConvertible,
	screenName: string,
	baseName: string,
): interop.Pointer

export declare function TkCurrentTime(dispPtr: interop.PointerConvertible): number

export declare function TkDeleteAllImages(mainPtr: interop.PointerConvertible): void

export declare function TkDoConfigureNotify(winPtr: interop.PointerConvertible): void

export declare function TkDrawInsetFocusHighlight(
	tkwin: interop.PointerConvertible,
	gc: interop.PointerConvertible,
	width: number,
	drawable: number,
	padding: number,
): void

export declare function TkEventDeadWindow(winPtr: interop.PointerConvertible): void

export declare function TkFillPolygon(
	canvas: interop.PointerConvertible,
	coordPtr: interop.PointerConvertible,
	numPoints: number,
	display: interop.PointerConvertible,
	drawable: number,
	gc: interop.PointerConvertible,
	outlineGC: interop.PointerConvertible,
): void

export declare function TkFindStateNum(
	interp: interop.PointerConvertible,
	option: string,
	mapPtr: interop.PointerConvertible,
	strKey: string,
): number

export declare function TkFindStateString(
	mapPtr: interop.PointerConvertible,
	numKey: number,
): string

export declare function TkFocusDeadWindow(winPtr: interop.PointerConvertible): void

export declare function TkFocusFilterEvent(
	winPtr: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
): number

export declare function TkFocusKeyEvent(
	winPtr: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
): interop.Pointer

export declare function TkFontPkgInit(mainPtr: interop.PointerConvertible): void

export declare function TkFontPkgFree(mainPtr: interop.PointerConvertible): void

export declare function TkFreeBindingTags(winPtr: interop.PointerConvertible): void

export declare function TkpFreeCursor(cursorPtr: interop.PointerConvertible): void

export declare function TkGetBitmapData(
	interp: interop.PointerConvertible,
	string: string,
	fileName: string,
	widthPtr: interop.PointerConvertible,
	heightPtr: interop.PointerConvertible,
	hotXPtr: interop.PointerConvertible,
	hotYPtr: interop.PointerConvertible,
): string

export declare function TkGetButtPoints(
	p1: interop.Pointer,
	p2: interop.Pointer,
	width: number,
	project: number,
	m1: interop.Pointer,
	m2: interop.Pointer,
): void

export declare function TkGetCursorByName(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	string: string,
): interop.Pointer

export declare function TkGetDefaultScreenName(
	interp: interop.PointerConvertible,
	screenName: string,
): string

export declare function TkGetDisplay(display: interop.PointerConvertible): interop.Pointer

export declare function TkGetDisplayOf(
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
	tkwinPtr: interop.PointerConvertible,
): number

export declare function TkGetFocusWin(winPtr: interop.PointerConvertible): interop.Pointer

export declare function TkGetInterpNames(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
): number

export declare function TkGetMiterPoints(
	p1: interop.Pointer,
	p2: interop.Pointer,
	p3: interop.Pointer,
	width: number,
	m1: interop.Pointer,
	m2: interop.Pointer,
): number

export declare function TkGetPointerCoords(
	tkwin: interop.PointerConvertible,
	xPtr: interop.PointerConvertible,
	yPtr: interop.PointerConvertible,
): void

export declare function TkGetServerInfo(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
): void

export declare function TkGrabDeadWindow(winPtr: interop.PointerConvertible): void

export declare function TkGrabState(winPtr: interop.PointerConvertible): number

export declare function TkIncludePoint(
	itemPtr: interop.PointerConvertible,
	pointPtr: interop.PointerConvertible,
): void

export declare function TkInOutEvents(
	eventPtr: interop.PointerConvertible,
	sourcePtr: interop.PointerConvertible,
	destPtr: interop.PointerConvertible,
	leaveType: number,
	enterType: number,
	position: interop.Enum<typeof Tcl_QueuePosition>,
): void

export declare function TkInstallFrameMenu(tkwin: interop.PointerConvertible): void

export declare function TkKeysymToString(keysym: number): string

export declare function TkLineToArea(
	end1Ptr: interop.Pointer,
	end2Ptr: interop.Pointer,
	rectPtr: interop.Pointer,
): number

export declare function TkLineToPoint(
	end1Ptr: interop.Pointer,
	end2Ptr: interop.Pointer,
	pointPtr: interop.Pointer,
): number

export declare function TkMakeBezierCurve(
	canvas: interop.PointerConvertible,
	pointPtr: interop.PointerConvertible,
	numPoints: number,
	numSteps: number,
	xPoints: interop.Pointer,
	dblPoints: interop.Pointer,
): number

export declare function TkMakeBezierPostscript(
	interp: interop.PointerConvertible,
	canvas: interop.PointerConvertible,
	pointPtr: interop.PointerConvertible,
	numPoints: number,
): void

export declare function TkOptionClassChanged(winPtr: interop.PointerConvertible): void

export declare function TkOptionDeadWindow(winPtr: interop.PointerConvertible): void

export declare function TkOvalToArea(
	ovalPtr: interop.PointerConvertible,
	rectPtr: interop.PointerConvertible,
): number

export declare function TkOvalToPoint(
	ovalPtr: interop.Pointer,
	width: number,
	filled: number,
	pointPtr: interop.Pointer,
): number

export declare function TkpChangeFocus(winPtr: interop.PointerConvertible, force: number): number

export declare function TkpCloseDisplay(dispPtr: interop.PointerConvertible): void

export declare function TkpClaimFocus(topLevelPtr: interop.PointerConvertible, force: number): void

export declare function TkpDisplayWarning(msg: string, title: string): void

export declare function TkpGetAppName(
	interp: interop.PointerConvertible,
	name: interop.PointerConvertible,
): void

export declare function TkpGetOtherWindow(winPtr: interop.PointerConvertible): interop.Pointer

export declare function TkpGetWrapperWindow(winPtr: interop.PointerConvertible): interop.Pointer

export declare function TkpInit(interp: interop.PointerConvertible): number

export declare function TkpInitializeMenuBindings(
	interp: interop.PointerConvertible,
	bindingTable: interop.PointerConvertible,
): void

export declare function TkpMakeContainer(tkwin: interop.PointerConvertible): void

export declare function TkpMakeMenuWindow(
	tkwin: interop.PointerConvertible,
	transient: number,
): void

export declare function TkpMakeWindow(winPtr: interop.PointerConvertible, parent: number): number

export declare function TkpMenuNotifyToplevelCreate(
	interp1: interop.PointerConvertible,
	menuName: string,
): void

export declare function TkpOpenDisplay(display_name: string): interop.Pointer

export declare function TkPointerEvent(
	eventPtr: interop.PointerConvertible,
	winPtr: interop.PointerConvertible,
): number

export declare function TkPolygonToArea(
	polyPtr: interop.PointerConvertible,
	numPoints: number,
	rectPtr: interop.PointerConvertible,
): number

export declare function TkPolygonToPoint(
	polyPtr: interop.PointerConvertible,
	numPoints: number,
	pointPtr: interop.PointerConvertible,
): number

export declare function TkPositionInTree(
	winPtr: interop.PointerConvertible,
	treePtr: interop.PointerConvertible,
): number

export declare function TkpRedirectKeyEvent(
	winPtr: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
): void

export declare function TkpSetMainMenubar(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	menuName: string,
): void

export declare function TkpUseWindow(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	string: string,
): number

export declare function TkpWindowWasRecentlyDeleted(
	win: number,
	dispPtr: interop.PointerConvertible,
): number

export declare function TkQueueEventForAllChildren(
	winPtr: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
): void

export declare function TkReadBitmapFile(
	display: interop.PointerConvertible,
	d: number,
	filename: string,
	width_return: interop.PointerConvertible,
	height_return: interop.PointerConvertible,
	bitmap_return: interop.PointerConvertible,
	x_hot_return: interop.PointerConvertible,
	y_hot_return: interop.PointerConvertible,
): number

export declare function TkScrollWindow(
	tkwin: interop.PointerConvertible,
	gc: interop.PointerConvertible,
	x: number,
	y: number,
	width: number,
	height: number,
	dx: number,
	dy: number,
	damageRgn: interop.PointerConvertible,
): number

export declare function TkSelDeadWindow(winPtr: interop.PointerConvertible): void

export declare function TkSelEventProc(
	tkwin: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
): void

export declare function TkSelInit(tkwin: interop.PointerConvertible): void

export declare function TkSelPropProc(eventPtr: interop.PointerConvertible): void

export declare function TkSetWindowMenuBar(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	oldMenuName: string,
	menuName: string,
): void

export declare function TkStringToKeysym(name: string): number

export declare function TkThickPolyLineToArea(
	coordPtr: interop.PointerConvertible,
	numPoints: number,
	width: number,
	capStyle: number,
	joinStyle: number,
	rectPtr: interop.PointerConvertible,
): number

export declare function TkWmAddToColormapWindows(winPtr: interop.PointerConvertible): void

export declare function TkWmDeadWindow(winPtr: interop.PointerConvertible): void

export declare function TkWmFocusToplevel(winPtr: interop.PointerConvertible): interop.Pointer

export declare function TkWmMapWindow(winPtr: interop.PointerConvertible): void

export declare function TkWmNewWindow(winPtr: interop.PointerConvertible): void

export declare function TkWmProtocolEventProc(
	winPtr: interop.PointerConvertible,
	evenvPtr: interop.PointerConvertible,
): void

export declare function TkWmRemoveFromColormapWindows(winPtr: interop.PointerConvertible): void

export declare function TkWmRestackToplevel(
	winPtr: interop.PointerConvertible,
	aboveBelow: number,
	otherPtr: interop.PointerConvertible,
): void

export declare function TkWmSetClass(winPtr: interop.PointerConvertible): void

export declare function TkWmUnmapWindow(winPtr: interop.PointerConvertible): void

export declare function TkDebugBitmap(
	tkwin: interop.PointerConvertible,
	name: string,
): interop.Pointer

export declare function TkDebugBorder(
	tkwin: interop.PointerConvertible,
	name: string,
): interop.Pointer

export declare function TkDebugCursor(
	tkwin: interop.PointerConvertible,
	name: string,
): interop.Pointer

export declare function TkDebugColor(
	tkwin: interop.PointerConvertible,
	name: string,
): interop.Pointer

export declare function TkDebugConfig(
	interp: interop.PointerConvertible,
	table: interop.PointerConvertible,
): interop.Pointer

export declare function TkDebugFont(
	tkwin: interop.PointerConvertible,
	name: string,
): interop.Pointer

export declare function TkFindStateNumObj(
	interp: interop.PointerConvertible,
	optionPtr: interop.PointerConvertible,
	mapPtr: interop.PointerConvertible,
	keyPtr: interop.PointerConvertible,
): number

export declare function TkGetBitmapPredefTable(): interop.Pointer

export declare function TkGetDisplayList(): interop.Pointer

export declare function TkGetMainInfoList(): interop.Pointer

export declare function TkGetWindowFromObj(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	windowPtr: interop.PointerConvertible,
): number

export declare function TkpGetString(
	winPtr: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
	dsPtr: interop.PointerConvertible,
): string

export declare function TkpGetSubFonts(
	interp: interop.PointerConvertible,
	tkfont: interop.PointerConvertible,
): void

export declare function TkpGetSystemDefault(
	tkwin: interop.PointerConvertible,
	dbName: string,
	className: string,
): interop.Pointer

export declare function TkpMenuThreadInit(): void

export declare function TkpDrawHighlightBorder(
	tkwin: interop.PointerConvertible,
	fgGC: interop.PointerConvertible,
	bgGC: interop.PointerConvertible,
	highlightWidth: number,
	drawable: number,
): void

export declare function TkSetFocusWin(winPtr: interop.PointerConvertible, force: number): void

export declare function TkpSetKeycodeAndState(
	tkwin: interop.PointerConvertible,
	keySym: number,
	eventPtr: interop.PointerConvertible,
): void

export declare function TkpGetKeySym(
	dispPtr: interop.PointerConvertible,
	eventPtr: interop.PointerConvertible,
): number

export declare function TkpInitKeymapInfo(dispPtr: interop.PointerConvertible): void

export declare function TkPhotoGetValidRegion(handle: interop.PointerConvertible): interop.Pointer

export declare function TkWmStackorderToplevel(
	parentPtr: interop.PointerConvertible,
): interop.Pointer

export declare function TkFocusFree(mainPtr: interop.PointerConvertible): void

export declare function TkClipCleanup(dispPtr: interop.PointerConvertible): void

export declare function TkGCCleanup(dispPtr: interop.PointerConvertible): void

export declare function TkStylePkgInit(mainPtr: interop.PointerConvertible): void

export declare function TkStylePkgFree(mainPtr: interop.PointerConvertible): void

export declare function TkToplevelWindowForCommand(
	interp: interop.PointerConvertible,
	cmdName: string,
): interop.Pointer

export declare function TkGetOptionSpec(
	name: string,
	optionTable: interop.PointerConvertible,
): interop.Pointer

export declare function TkMakeRawCurve(
	canvas: interop.PointerConvertible,
	pointPtr: interop.PointerConvertible,
	numPoints: number,
	numSteps: number,
	xPoints: interop.Pointer,
	dblPoints: interop.Pointer,
): number

export declare function TkMakeRawCurvePostscript(
	interp: interop.PointerConvertible,
	canvas: interop.PointerConvertible,
	pointPtr: interop.PointerConvertible,
	numPoints: number,
): void

export declare function TkpDrawFrame(
	tkwin: interop.PointerConvertible,
	border: interop.PointerConvertible,
	highlightWidth: number,
	borderWidth: number,
	relief: number,
): void

export declare function TkCreateThreadExitHandler(
	proc: (p1: interop.PointerConvertible) => void,
	clientData: interop.PointerConvertible,
): void

export declare function TkDeleteThreadExitHandler(
	proc: (p1: interop.PointerConvertible) => void,
	clientData: interop.PointerConvertible,
): void

export declare function TkpTestembedCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	argv: interop.PointerConvertible,
): number

export declare function TkpTesttextCmd(
	dummy: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	argv: interop.PointerConvertible,
): number

export declare function TkStateParseProc(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	value: string,
	widgRec: string,
	offset: number,
): number

export declare function TkStatePrintProc(
	clientData: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	widgRec: string,
	offset: number,
	freeProcPtr: interop.PointerConvertible,
): string

export declare function TkCanvasDashParseProc(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	value: string,
	widgRec: string,
	offset: number,
): number

export declare function TkCanvasDashPrintProc(
	clientData: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	widgRec: string,
	offset: number,
	freeProcPtr: interop.PointerConvertible,
): string

export declare function TkOffsetParseProc(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	value: string,
	widgRec: string,
	offset: number,
): number

export declare function TkOffsetPrintProc(
	clientData: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	widgRec: string,
	offset: number,
	freeProcPtr: interop.PointerConvertible,
): string

export declare function TkPixelParseProc(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	value: string,
	widgRec: string,
	offset: number,
): number

export declare function TkPixelPrintProc(
	clientData: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	widgRec: string,
	offset: number,
	freeProcPtr: interop.PointerConvertible,
): string

export declare function TkOrientParseProc(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	value: string,
	widgRec: string,
	offset: number,
): number

export declare function TkOrientPrintProc(
	clientData: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	widgRec: string,
	offset: number,
	freeProcPtr: interop.PointerConvertible,
): string

export declare function TkSmoothParseProc(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	value: string,
	widgRec: string,
	offset: number,
): number

export declare function TkSmoothPrintProc(
	clientData: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	widgRec: string,
	offset: number,
	freeProcPtr: interop.PointerConvertible,
): string

export declare function Ttk_Init(interp: interop.PointerConvertible): number

export declare function Tk_BellObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_BindObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_BindtagsObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ButtonObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_CanvasObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	objv: interop.Pointer,
): number

export declare function Tk_CheckbuttonObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ClipboardObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ChooseColorObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ChooseDirectoryObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ChooseFontObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_DestroyObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_EntryObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_EventObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_FrameObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_FocusObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_FontObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_GetOpenFileObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_GetSaveFileObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_GrabObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_GridObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ImageObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_LabelObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_LabelframeObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ListboxObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_LowerObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_MenubuttonObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_MessageBoxObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_MessageObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_PanedWindowObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_OptionObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_PackObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_PlaceObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_RadiobuttonObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_RaiseObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ScaleObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ScrollbarCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	argv: interop.PointerConvertible,
): number

export declare function Tk_SelectionObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_SendCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	argv: interop.PointerConvertible,
): number

export declare function Tk_SendObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_SpinboxObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_TextObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_TkObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_TkwaitObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_ToplevelObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_UpdateObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_WinfoObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_WmObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function Tk_GetDoublePixelsFromObj(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	doublePtr: interop.PointerConvertible,
): number

export declare function TkEventInit(): void

export declare function TkRegisterObjTypes(): void

export declare function TkCreateMenuCmd(interp: interop.PointerConvertible): number

export declare function TkDeadAppCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	argv: interop.PointerConvertible,
): number

export declare function TkCanvasGetCoordObj(
	interp: interop.PointerConvertible,
	canvas: interop.PointerConvertible,
	obj: interop.PointerConvertible,
	doublePtr: interop.PointerConvertible,
): number

export declare function TkGetDoublePixels(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	string: string,
	doublePtr: interop.PointerConvertible,
): number

export declare function TkPostscriptImage(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	psInfo: interop.PointerConvertible,
	ximage: interop.PointerConvertible,
	x: number,
	y: number,
	width: number,
	height: number,
): number

export declare function TkMapTopFrame(tkwin: interop.PointerConvertible): void

export declare function TkpGetBindingXEvent(interp: interop.PointerConvertible): interop.Pointer

export declare function TkCreateExitHandler(
	proc: (p1: interop.PointerConvertible) => void,
	clientData: interop.PointerConvertible,
): void

export declare function TkDeleteExitHandler(
	proc: (p1: interop.PointerConvertible) => void,
	clientData: interop.PointerConvertible,
): void

export declare function TkFinalize(p1: interop.PointerConvertible): void

export declare function TkFinalizeThread(p1: interop.PointerConvertible): void

export declare function TkpBuildRegionFromAlphaData(
	region: interop.PointerConvertible,
	x: number,
	y: number,
	width: number,
	height: number,
	dataPtr: interop.PointerConvertible,
	pixelStride: number,
	lineStride: number,
): void

export declare function TkPrintPadAmount(
	interp: interop.PointerConvertible,
	buffer: string,
	pad1: number,
	pad2: number,
): void

export declare function TkParsePadAmount(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	objPtr: interop.PointerConvertible,
	pad1Ptr: interop.PointerConvertible,
	pad2Ptr: interop.PointerConvertible,
): number

export declare function TkFocusSplit(winPtr: interop.PointerConvertible): void

export declare function TkFocusJoin(winPtr: interop.PointerConvertible): void

export declare function TkpAlwaysShowSelection(tkwin: interop.PointerConvertible): number

export declare function TkpDrawCharsInContext(
	display: interop.PointerConvertible,
	drawable: number,
	gc: interop.PointerConvertible,
	tkfont: interop.PointerConvertible,
	source: string,
	numBytes: number,
	rangeStart: number,
	rangeLength: number,
	x: number,
	y: number,
): void

export declare function TkpMeasureCharsInContext(
	tkfont: interop.PointerConvertible,
	source: string,
	numBytes: number,
	rangeStart: number,
	rangeLength: number,
	maxLength: number,
	flags: number,
	lengthPtr: interop.PointerConvertible,
): number

export declare function TkUnderlineCharsInContext(
	display: interop.PointerConvertible,
	drawable: number,
	gc: interop.PointerConvertible,
	tkfont: interop.PointerConvertible,
	string: string,
	numBytes: number,
	x: number,
	y: number,
	firstByte: number,
	lastByte: number,
): void

export declare function TkpGetFontAttrsForChar(
	tkwin: interop.PointerConvertible,
	tkfont: interop.PointerConvertible,
	c: number,
	faPtr: interop.PointerConvertible,
): void

export declare function TkBackgroundEvalObjv(
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.PointerConvertible,
	flags: number,
): number

export declare function TkUnsupported1ObjCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function TkpGetGCCache(gc: interop.PointerConvertible): interop.Pointer

export declare function TkpInitGCCache(gc: interop.PointerConvertible): void

export declare function TkpFreeGCCache(gc: interop.PointerConvertible): void

export declare function TkMacOSXDefaultStartupScript(): void

export declare function TkpClipDrawableToRect(
	display: interop.PointerConvertible,
	d: number,
	x: number,
	y: number,
	width: number,
	height: number,
): void

export declare function TkpRetainRegion(r: interop.PointerConvertible): void

export declare function TkpReleaseRegion(r: interop.PointerConvertible): void

export declare function TkCreateXEventSource(): void

export declare function TkFreeWindowId(dispPtr: interop.PointerConvertible, w: number): void

export declare function TkInitXId(dispPtr: interop.PointerConvertible): void

export declare function TkpCmapStressed(tkwin: interop.PointerConvertible, colormap: number): number

export declare function TkpSync(display: interop.PointerConvertible): void

export declare function TkUnixContainerId(winPtr: interop.PointerConvertible): number

export declare function TkUnixDoOneXEvent(timePtr: interop.PointerConvertible): number

export declare function TkUnixSetMenubar(
	tkwin: interop.PointerConvertible,
	menubar: interop.PointerConvertible,
): void

export declare function TkpScanWindowId(
	interp: interop.PointerConvertible,
	string: string,
	idPtr: interop.PointerConvertible,
): number

export declare function TkWmCleanup(dispPtr: interop.PointerConvertible): void

export declare function TkSendCleanup(dispPtr: interop.PointerConvertible): void

export declare function TkFreeXId(dispPtr: interop.PointerConvertible): void

export declare function TkpWmSetState(winPtr: interop.PointerConvertible, state: number): number

export declare function TkpTestsendCmd(
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	argc: number,
	argv: interop.PointerConvertible,
): number

export declare function Ttk_GetStateSpecFromObj(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): number

export declare function Ttk_NewStateSpecObj(onbits: number, offbits: number): interop.Pointer

export declare function Ttk_GetStateMapFromObj(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
): number

export declare function Ttk_StateMapLookup(
	p1: interop.PointerConvertible,
	Ttk_StateMap: number,
	p3: number,
): interop.Pointer

export declare function Ttk_StateTableLookup(map: interop.Pointer, p2: number): number

export declare function Ttk_GetPaddingFromObj(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
): number

export declare function Ttk_GetBorderFromObj(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): number

export declare function Ttk_MakePadding(l: number, t: number, r: number, b: number): number

export declare function Ttk_UniformPadding(borderWidth: number): number

export declare function Ttk_AddPadding(): number

export declare function Ttk_RelievePadding(): number

export declare function Ttk_MakeBox(x: number, y: number, width: number, height: number): number

export declare function Ttk_BoxContains(): number

export declare function Ttk_GetStickyFromObj(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): number

export declare function Ttk_NewStickyObj(p1: number): interop.Pointer

export declare function Ttk_PackBox(
	cavity: interop.PointerConvertible,
	w: number,
	h: number,
	side: interop.Enum<typeof Ttk_Side>,
): number

export declare function Ttk_StickBox(parcel: number, w: number, h: number, sticky: number): number

export declare function Ttk_AnchorBox(
	parcel: number,
	w: number,
	h: number,
	anchor: interop.Enum<typeof Tk_Anchor>,
): number

export declare function Ttk_PadBox(b: number, p: number): number

export declare function Ttk_ExpandBox(b: number, p: number): number

export declare function Ttk_PlaceBox(
	cavity: interop.PointerConvertible,
	w: number,
	h: number,
	p4: interop.Enum<typeof Ttk_Side>,
	p5: number,
): number

export declare function Ttk_PositionBox(
	cavity: interop.PointerConvertible,
	w: number,
	h: number,
	p4: number,
): number

export declare function Ttk_StylePkgInit(p1: interop.PointerConvertible): void

export declare function Ttk_GetTheme(interp: interop.PointerConvertible, name: string): number

export declare function Ttk_GetDefaultTheme(interp: interop.PointerConvertible): number

export declare function Ttk_GetCurrentTheme(interp: interop.PointerConvertible): number

export declare function Ttk_CreateTheme(
	interp: interop.PointerConvertible,
	name: string,
	parent: number,
): number

export declare function Ttk_SetThemeEnabledProc(): void

export declare function Ttk_UseTheme(p1: interop.PointerConvertible, Ttk_Theme: number): number

export declare function Ttk_RegisterCleanup(
	interp: interop.PointerConvertible,
	deleteData: interop.PointerConvertible,
	cleanupProc: (p1: interop.PointerConvertible) => void,
): void

export declare function Ttk_RegisterElement(
	interp: interop.PointerConvertible,
	theme: number,
	elementName: string,
	p4: interop.PointerConvertible,
	clientData: interop.PointerConvertible,
): interop.Pointer

export declare function Ttk_RegisterElementFactory(
	p1: interop.PointerConvertible,
	name: string,
	p3: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: string,
		p5: number,
		p6: interop.PointerConvertible,
	) => number,
	clientData: interop.PointerConvertible,
): number

export declare function TtkNullElementSize(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): void

export declare function TtkNullElementDraw(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: number,
	Ttk_Box: number,
	p6: number,
): void

export declare function Ttk_RegisterLayout(
	theme: number,
	className: string,
	layoutSpec: interop.PointerConvertible,
): void

export declare function Ttk_RegisterLayouts(
	theme: number,
	layoutTable: interop.PointerConvertible,
): void

export declare function Ttk_CreateLayout(
	p1: interop.PointerConvertible,
	Ttk_Theme: number,
	name: string,
	recordPtr: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
): interop.Pointer

export declare function Ttk_CreateSublayout(
	p1: interop.PointerConvertible,
	Ttk_Theme: number,
	p3: interop.PointerConvertible,
	name: string,
	p5: interop.PointerConvertible,
): interop.Pointer

export declare function Ttk_FreeLayout(p1: interop.PointerConvertible): void

export declare function Ttk_LayoutSize(
	p1: interop.PointerConvertible,
	p2: number,
	widthPtr: interop.PointerConvertible,
	heightPtr: interop.PointerConvertible,
): void

export declare function Ttk_PlaceLayout(
	p1: interop.PointerConvertible,
	p2: number,
	Ttk_Box: number,
): void

export declare function Ttk_DrawLayout(p1: interop.PointerConvertible, p2: number, p3: number): void

export declare function Ttk_RebindSublayout(
	p1: interop.PointerConvertible,
	recordPtr: interop.PointerConvertible,
): void

export declare function Ttk_IdentifyElement(
	p1: interop.PointerConvertible,
	x: number,
	y: number,
): interop.Pointer

export declare function Ttk_FindElement(
	p1: interop.PointerConvertible,
	nodeName: string,
): interop.Pointer

export declare function Ttk_ElementName(p1: interop.PointerConvertible): string

export declare function Ttk_ElementParcel(p1: interop.PointerConvertible): number

export declare function Ttk_ClientRegion(
	p1: interop.PointerConvertible,
	elementName: string,
): number

export declare function Ttk_LayoutNodeInternalParcel(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
): number

export declare function Ttk_LayoutNodeInternalPadding(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
): number

export declare function Ttk_LayoutNodeReqSize(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	w: interop.PointerConvertible,
	h: interop.PointerConvertible,
): void

export declare function Ttk_PlaceElement(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	Ttk_Box: number,
): void

export declare function Ttk_ChangeElementState(
	p1: interop.PointerConvertible,
	set: number,
	clr: number,
): void

export declare function Ttk_QueryOption(
	p1: interop.PointerConvertible,
	p2: string,
	p3: number,
): interop.Pointer

export declare function Ttk_LayoutStyle(p1: interop.PointerConvertible): interop.Pointer

export declare function Ttk_StyleDefault(
	p1: interop.PointerConvertible,
	optionName: string,
): interop.Pointer

export declare function Ttk_StyleMap(
	p1: interop.PointerConvertible,
	optionName: string,
	p3: number,
): interop.Pointer

export declare function Ttk_CreateResourceCache(p1: interop.PointerConvertible): interop.Pointer

export declare function Ttk_FreeResourceCache(p1: interop.PointerConvertible): void

export declare function Ttk_GetResourceCache(p1: interop.PointerConvertible): interop.Pointer

export declare function Ttk_UseFont(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): interop.Pointer

export declare function Ttk_UseColor(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): interop.Pointer

export declare function Ttk_UseBorder(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): interop.Pointer

export declare function Ttk_UseImage(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): interop.Pointer

export declare function Ttk_RegisterNamedColor(
	p1: interop.PointerConvertible,
	p2: string,
	p3: interop.PointerConvertible,
): void

export declare function TtkGetImageSpec(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): interop.Pointer

export declare function TtkFreeImageSpec(p1: interop.PointerConvertible): void

export declare function TtkSelectImage(p1: interop.PointerConvertible, p2: number): interop.Pointer

export declare function Ttk_GetButtonDefaultStateFromObj(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): number

export declare function Ttk_GetCompoundFromObj(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): number

export declare function Ttk_InvokeEnsemble(
	commands: interop.PointerConvertible,
	cmdIndex: number,
	clientData: interop.PointerConvertible,
	interp: interop.PointerConvertible,
	objc: number,
	objv: interop.Pointer,
): number

export declare function TtkEnumerateHashTable(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
): number

export declare function TtkArrowSize(
	h: number,
	p2: interop.Enum<typeof ArrowDirection>,
	widthPtr: interop.PointerConvertible,
	heightPtr: interop.PointerConvertible,
): void

export declare function TtkDrawArrow(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	Ttk_Box: number,
	p5: interop.Enum<typeof ArrowDirection>,
): void

export declare function TtkFillArrow(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	Ttk_Box: number,
	p5: interop.Enum<typeof ArrowDirection>,
): void

export declare function TkFontParseXLFD(
	string: string,
	faPtr: interop.PointerConvertible,
	xaPtr: interop.PointerConvertible,
): number

export declare function TkFontGetAliasList(faceName: string): interop.Pointer

export declare function TkFontGetFallbacks(): interop.Pointer

export declare function TkFontGetPixels(tkwin: interop.PointerConvertible, size: number): number

export declare function TkFontGetPoints(tkwin: interop.PointerConvertible, size: number): number

export declare function TkFontGetGlobalClass(): interop.Pointer

export declare function TkFontGetSymbolClass(): interop.Pointer

export declare function TkCreateNamedFont(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	name: string,
	faPtr: interop.PointerConvertible,
): number

export declare function TkDeleteNamedFont(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	name: string,
): number

export declare function TkFontGetFirstTextLayout(
	layout: interop.PointerConvertible,
	font: interop.PointerConvertible,
	dst: string,
): number

export declare function TkpDeleteFont(tkFontPtr: interop.PointerConvertible): void

export declare function TkpFontPkgInit(mainPtr: interop.PointerConvertible): void

export declare function TkpGetFontFromAttributes(
	tkFontPtr: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
	faPtr: interop.PointerConvertible,
): interop.Pointer

export declare function TkpGetFontFamilies(
	interp: interop.PointerConvertible,
	tkwin: interop.PointerConvertible,
): void

export declare function TkpGetNativeFont(
	tkwin: interop.PointerConvertible,
	name: string,
): interop.Pointer
