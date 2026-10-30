export interface LayoutChildProps {
	/** Zero-based row index in the parent grid. */
	row?: number
	/** Zero-based column index in the parent grid. */
	col?: number
	/** Row tracks to span (>= 1). */
	rowSpan?: number
	/** Column tracks to span (>= 1). */
	colSpan?: number
	/** Edge of the parent dock layout this child pins to. */
	dock?: 'left' | 'top' | 'right' | 'bottom'
	/** Absolute x offset in dips inside an absolute-layout parent. */
	left?: number
	/** Absolute y offset in dips inside an absolute-layout parent. */
	top?: number
	/** Flex grow factor along the parent main axis. */
	flexGrow?: number
	/** Flex shrink factor along the parent main axis. */
	flexShrink?: number
	/** Cross-axis alignment override for this child. */
	alignSelf?: string
	/** Sibling ordering — lower orders lay out first. */
	order?: number
}

/** Flex-container props shared by View/Row/Pressable — RN vocabulary, applied
 *  to the host flexboxlayout natively and the element's style on web.
 *  `gap` is a dip number (px on web); NS supports it on FlexboxLayout only
 *  (GridLayout has no gap). */
export interface FlexContainerProps {
	justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
	alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
	flexWrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse'
	gap?: number | string
	rowGap?: number | string
	columnGap?: number | string
}

export type Role =
	| 'button'
	| 'link'
	| 'search'
	| 'image'
	| 'heading'
	| 'adjustable'
	| 'summary'
	| 'text'
	| 'none'
	| 'progressbar'
	| 'checkbox'
	| 'switch'
	| 'radio'
	| 'spinbutton'
	| 'tab'

export interface AccessibilityProps {
	/** Whether the element is exposed to assistive technology as an accessibility element. */
	accessible?: boolean
	/** Spoken name for assistive technology. */
	accessibilityLabel?: string
	/** Semantic role — mapped to an ARIA role on web and the platform role vocabulary natively. */
	accessibilityRole?: Role
	/** Spoken hint describing what activating does. */
	accessibilityHint?: string
	/** Spoken current value text. */
	accessibilityValue?: string
	/** State flags merged into the platform accessibility state. */
	accessibilityState?: {
		disabled?: boolean
		selected?: boolean
		checked?: boolean
	}
	/** Live-region announcements: polite queues, assertive interrupts. @default 'none' */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
}

/** Paged horizontal swipe container — onboarding flows, media galleries.
 *  Chrome-reset OS paging on native (ViewPager2 / UICollectionView paging via
 *  @nativescript-community/ui-pager), a scroll-snap scroller on web, experimental NSScrollView paging on AppKit.
 *  AppKit eagerly renders pages; native input/layout remain unqualified. Follows
 *  the platform-list contract: `items` + `renderItem`, no children — each
 *  page is a full-host-size cell. No indicator is built in; compose dots
 *  from `Row` + `View` driven by `page`/`onPageChange`. */
export interface PagerProps extends LayoutChildProps, AccessibilityProps {
	/** Class list applied to the pager element. */
	className?: any
	/** Inline style applied to the pager element (string CSS or object). */
	style?: any
	/** Element id passed through to the host element. */
	id?: string
	/** Page models — each becomes one full-size cell. Untyped (`any[]`) so
	 *  callers keep their own item type through `renderItem`. */
	items: any[]
	/** Cell renderer — receives the item and its page index; returns any
	 *  renderable. */
	renderItem: (item: any, index: number) => unknown
	/** Rendered when `items` is empty. */
	renderEmpty?: () => unknown
	/** Controlled page index — pass with `onPageChange` to own the page.
	 *  Writes scroll/settle to the page; user swipes call `onPageChange`. */
	page?: number
	/** Starting page for uncontrolled use (default 0). */
	defaultPage?: number
	/** Fires when the settled page changes — a completed user page transition. Programmatic `page` writes do not echo back through it. */
	onPageChange?: (index: number) => void
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
}
