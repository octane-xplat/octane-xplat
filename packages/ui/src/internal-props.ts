import type { ClassValue } from 'octane/jsx-runtime'
import type { Hsb } from './color'
import type {
	BaseTypeaheadProps,
	ContextRenderProps,
	PopoverProps,
	SearchableItem,
	StyleProp,
} from './props'

/** Internal plumbing — fields used by sibling components/hooks that must not
 *  appear on the public props contracts. Not re-exported by the package
 *  entrypoints; consumers cannot set these through JSX. */

/** `useLayer` renders `Popover` with a logical-geometry adapter carrying the
 *  resolved placement/alignment. Public callers use `placement`/`alignment`. */
export interface PopoverLayerPosition {
	layerPosition?: Pick<ContextRenderProps, 'placement' | 'alignment'>
	/** Web only: floor the panel's inline size at the anchor's measured width
	 *  (upstream `min(anchor-size(width), …)`). `DropdownMenu` sets it so an
	 *  unset `menuWidth` defaults to the trigger width. */
	anchorMinWidth?: boolean
}

/** `Tokenizer` appends query-derived "Create …" entries to `BaseTypeahead`
 *  results, exempt from `minQueryLength`. */
export interface TypeaheadQueryEntries<T extends SearchableItem = SearchableItem> {
	__queryEntries?: (query: string, results: T[]) => T[]
}

export type PopoverInternalProps = PopoverProps & PopoverLayerPosition
export type BaseTypeaheadInternalProps<T extends SearchableItem = SearchableItem> =
	BaseTypeaheadProps<T> & TypeaheadQueryEntries<T>

/** Internal LinearGradient part — the color suite composes it; not exported. */
export interface LinearGradientProps {
	colors: string[]
	direction: 'horizontal' | 'vertical'
	style?: StyleProp
	className?: ClassValue
	id?: string
}

/** Internal color-part views — driven by a shared `useColorState` so every
 *  part in a ColorPicker edits the same HSB. Not exported publicly. */
export interface ColorAreaViewProps {
	hsb: Hsb
	onHsb: (hsb: Hsb) => void
	onHsbEnd: () => void
	isDisabled?: boolean
	id?: string
	testID?: string
	className?: ClassValue
	style?: StyleProp
	accessibilityLabel?: string
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export type ColorSliderViewProps = ColorAreaViewProps
