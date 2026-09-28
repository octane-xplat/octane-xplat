export interface LayoutChildProps {
	row?: number
	col?: number
	rowSpan?: number
	colSpan?: number
	dock?: 'left' | 'top' | 'right' | 'bottom'
	left?: number
	top?: number
	flexGrow?: number
	flexShrink?: number
	alignSelf?: string
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
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityRole?: Role
	accessibilityHint?: string
	accessibilityValue?: string
	accessibilityState?: {
		disabled?: boolean
		selected?: boolean
		checked?: boolean
	}
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
}

/** Paged horizontal swipe container — onboarding flows, media galleries.
 *  Chrome-reset OS paging on native (ViewPager2 / UICollectionView paging via
 *  @nativescript-community/ui-pager), a scroll-snap scroller on web. Follows
 *  the platform-list contract: `items` + `renderItem`, no children — each
 *  page is a full-host-size cell. No indicator is built in; compose dots
 *  from `Row` + `View` driven by `page`/`onPageChange`. */
export interface PagerProps extends LayoutChildProps, AccessibilityProps {
	className?: any
	style?: any
	id?: string
	items: any[]
	renderItem: (item: any, index: number) => any
	renderEmpty?: () => any
	/** Controlled page index — pass with `onPageChange` to own the page.
	 *  Writes scroll/settle to the page; user swipes call `onPageChange`. */
	page?: number
	/** Starting page for uncontrolled use (default 0). */
	defaultPage?: number
	/** Fires when the settled page changes — a completed swipe on both
	 *  targets. Programmatic `page` writes do not echo back through it. */
	onPageChange?: (index: number) => void
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
