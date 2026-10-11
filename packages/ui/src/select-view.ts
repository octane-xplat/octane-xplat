import type { ResolvedFieldControlProps } from './field-context'
import type { PopoverPlacement, SelectOption } from './props'
import type { SelectOptionGroup } from './select-options'

/** Internal presentation contract for the Select container/view split.
 *  `Select` stays the canonical component: it resolves field context and
 *  finite-list coordination through `useSelect` and renders `SelectView`
 *  with this resolved state. The view owns host interaction that stays
 *  cohesive with its markup — trigger/option focus, keyboard navigation,
 *  type-ahead matching, and the listbox accessibility wiring — and reports
 *  user intents through the `on*` callbacks; it does not re-decide open,
 *  selection, query, or commit state.
 *
 *  The contract carries resolved state rather than independent flags so
 *  fixtures cannot express impossible presentations: `open` is the
 *  effective surface state (disabled/read-only suppression already
 *  applied), and busy presentation derives in the view as
 *  `isLoading || pending`, so `pending` cannot be rendered idle.
 *
 *  `SelectView` is intentionally not exported from the package. Fixtures
 *  (see SelectView.web.test.tsrx for the canonical shape) render it
 *  directly from source; when the planned visual-test suite lands, it can
 *  mount this same boundary for the resolved visual-state matrix without
 *  a public export. */
export interface SelectViewProps extends ResolvedFieldControlProps {
	className?: any
	style?: any
	options: SelectOption[]
	multiple?: boolean
	searchable?: boolean
	hasClear?: boolean
	hasSelectAll?: boolean
	selectAllLabel?: string
	searchPlaceholder?: string
	/** Maximum list height, in px/dip. @default 280 */
	maxMenuHeight?: number
	placement?: PopoverPlacement
	accessibilityLabel?: string
	/** Web form name; native keeps selection in application state. */
	htmlName?: string

	// Resolved state (written by the container's `useSelect` coordination).
	/** Effective listbox visibility — already suppressed when blocked. */
	open: boolean
	/** Local filter text inside the open surface. */
	query: string
	/** Resolved selection values, including an in-flight optimistic value. */
	selected: string[]
	/** Filtered options in display order, pre-grouped. */
	groups: SelectOptionGroup[]
	/** `groups` flattened — every option currently shown. */
	shown: SelectOption[]
	/** Enabled subset of `shown`; the keyboard/pointer navigation set. */
	enabled: SelectOption[]
	selectAllState: 'checked' | 'indeterminate' | 'unchecked'
	/** Async commit in flight — blocks edits and marks options inert. */
	pending: boolean
	triggerText: string
	emptyText: string
	announcement: string
	/** Resolved active-descendant option value; platforms without pointer
	 *  or keyboard highlight leave it unset. */
	activeValue?: string | null

	// User intents reported back to the container.
	onOpenChange: (open: boolean) => void
	onQueryChange: (query: string) => void
	onPick: (option: SelectOption) => void
	onClear: () => void
	onSelectAll: () => void
	/** Pointer/keyboard navigation changed the highlighted option. */
	onActiveValueChange?: (value: string | null) => void
}
