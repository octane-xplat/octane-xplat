import type { ResolvedFieldControlProps } from './field-context'
import type {
	PopoverAnchorRef,
	PopoverPlacement,
	SearchableItem,
	TypeaheadKeyDownHandler,
} from '../../props'

/** Internal presentation contract for the BaseTypeahead container/view
 *  split. `BaseTypeahead` stays the canonical component: it resolves field
 *  context and owns the combobox engine — debounced search/bootstrap,
 *  generation cancellation, query/results/highlight/open coordination, and
 *  the imperative handle. `BaseTypeaheadView` receives that resolved state
 *  and reports user intents; it owns the host interaction that stays
 *  cohesive with its markup — the input element, keyboard navigation and
 *  IME guards, pointer highlight, and the listbox accessibility wiring —
 *  and does not re-decide search, open, or commit state.
 *
 *  The contract carries resolved state rather than independent flags so
 *  fixtures cannot express impossible presentations: `open` is the
 *  container's effective layer decision, `hasSearched` gates the empty
 *  state, and `isSearching` is the engine's own progress (distinct from
 *  the field-level `isLoading`). The view normalizes `highlightedIndex`
 *  against `results` before use. There is no search-error presentation:
 *  rejection clears results/highlight, matching the container contract.
 *
 *  `BaseTypeaheadView` is intentionally not exported from the package.
 *  Fixtures (see BaseTypeaheadView.web.test.tsrx for the canonical shape)
 *  render it directly from source; when the planned visual-test suite
 *  lands, it can mount this same boundary for the resolved visual-state
 *  matrix without a public export. */
export interface BaseTypeaheadViewProps<
	T extends SearchableItem = SearchableItem,
> extends ResolvedFieldControlProps {
	className?: any
	style?: any
	/** Resolved id applied to the input element itself. */
	inputId?: string
	/** Listbox id for the combobox wiring (web). */
	listboxId?: string
	/** Panel id — the blur containment target (web). */
	panelId?: string
	/** Custom option content inside the stable result row. `item.element`
	 *  and TypeaheadItem keep their precedence. */
	renderItem?: (item: T) => any
	placeholder?: string
	menuWidth?: number
	placement?: PopoverPlacement
	isFocusableDisabled?: boolean
	/** Gates the closed-state ArrowDown open intent (web/AppKit keyboard). */
	hasEntriesOnFocus?: boolean
	inputTabIndex?: number
	inputClassName?: any
	inputStyle?: any
	accessibilityLabel?: string
	/** Consumer keydown notification — runs before internal navigation;
	 *  `preventDefault` suppresses it. Web and AppKit wire it; mobile leaves do not. */
	onKeyDown?: TypeaheadKeyDownHandler
	/** Resolved dropdown anchor — the caller's `anchorRef` or the input. */
	anchor: PopoverAnchorRef
	/** Container-owned slot for the input element — backs the imperative
	 *  handle's `native`/`focus`/`blur`. The view assigns it. */
	inputRef: { current: any }
	ios?: any
	android?: any
	web?: any

	// Resolved state (written by the container's search coordination).
	/** Current input text. */
	query: string
	/** Resolved display items — sliced results plus query-derived entries. */
	results: T[]
	/** Effective dropdown visibility — the container's open decision. */
	open: boolean
	/** Resolved option index for keyboard/pointer highlight; -1 = none. */
	highlightedIndex: number
	/** Engine search in flight — paints the view's own indicator only when
	 *  no BusyLane owner is present. */
	isSearching: boolean
	/** A search completed — gates the empty-state row. */
	hasSearched: boolean
	/** Controlled selection — marks the matching row. */
	value: T | null
	/** Resolved empty-state text. */
	emptyText: string
	/** Result-count announcement for the live region (web only). */
	announcement?: string
	/** Measured anchor width for the dropdown's minimum (web/native). */
	anchorWidth?: number

	// User intents reported back to the container.
	/** Input text edited — the container runs the search pipeline. */
	onQueryChange: (query: string) => void
	/** A result row was committed (click/tap/Enter/Return). */
	onSelect: (item: T) => void
	/** The user requested the layer open (closed ArrowDown) or closed
	 *  (Escape, Tab, outside dismiss); the container decides. */
	onOpenChange: (open: boolean) => void
	/** Input gained focus — the container decides bootstrap vs reshow and
	 *  forwards the consumer's `onFocus`. Platforms without focus events
	 *  leave it unset. */
	onInputFocus?: () => void
	/** Input lost focus — the container decides field-leave close and
	 *  forwards the consumer's `onBlur`. Platforms without blur events
	 *  leave it unset. */
	onInputBlur?: (event: any) => void
	/** Pointer/keyboard navigation changed the highlighted option.
	 *  Platforms without highlight input leave it unset. */
	onHighlight?: (index: number) => void
}
