/** @jsxImportSource @octane-xplat/jsx/dom */
import { useImperativeHandle, useContext, useEffect, useId, useRef, useState } from 'octane'
import type { BaseTypeaheadProps, SearchableItem } from '../../props'
import type { BaseTypeaheadInternalProps } from '../../internal-props'
import { useFieldControlProps } from './field-context'
import { BusyLaneContext } from '../../internal/rendering/busy-lane'
import { characterCount } from './typeahead-source'
import { BaseTypeaheadView } from './BaseTypeaheadView.web.tsrx'

/** A query shorter than the caller's threshold; an empty query is the
 *  untouched state — `hasEntriesOnFocus` owns what happens there. */
function isBelowMinQueryLength(query: string, minQueryLength: number): boolean {
	const length = characterCount(query)
	return length > 0 && length < minQueryLength
}

/** Combobox engine: input, debounced search/bootstrap, keyboard navigation,
 *  and an anchored result listbox. No wrapper chrome — Typeahead and
 *  Tokenizer own the visible field and pass `anchor` to position the menu.
 *  `item.element` > `renderItem` > TypeaheadItem for option content.
 *
 *  This is the container half of the split: it coordinates query, results,
 *  highlight, search progress, and open state, then renders
 *  `BaseTypeaheadView` with the resolved state and intent callbacks. */
export function BaseTypeahead<T extends SearchableItem>(inProps: BaseTypeaheadProps<T>) @{
	const props = useFieldControlProps(inProps)
	const searchSource = props.searchSource
	const hasEntriesOnFocus = props.hasEntriesOnFocus ?? false
	const maxMenuItems = props.maxMenuItems ?? 10
	const minQueryLength = props.minQueryLength ?? 1
	const debounceMs = props.debounceMs ?? 150
	const size = props.size ?? 'md'
	const placeholder = props.placeholder ?? 'Search…'
	const emptyText = props.emptySearchResultsText ?? 'No results found'

	const generatedId = useId()
	const inputId = props.inputId ?? props.id ?? generatedId
	const listboxId = `${generatedId}-listbox`
	const panelId = `${generatedId}-panel`

	const inputRef = useRef<HTMLInputElement | null>(null)
	const busyLane = useContext(BusyLaneContext)

	const [query, setQuery] = useState('')
	const [results, setResults] = useState<T[]>([])
	const [highlightedIndex, setHighlightedIndex] = useState(-1)
	const [isLoading, setIsLoading] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)
	const [open, setOpen] = useState(false)
	const [announcement, setAnnouncement] = useState('')
	const [anchorWidth, setAnchorWidth] = useState(0)

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	// Monotonic generation: selection, clear, and source replacement bump it so
	// stale async resolutions discard themselves.
	const searchGenRef = useRef(0)
	const resultsGenRef = useRef(0)
	const loadingRef = useRef(false)
	const requestRef = useRef<AbortController | null>(null)
	const abortRequest = () => {
		requestRef.current?.abort()
		requestRef.current = null
	}

	const nextRequest = () => {
		abortRequest()
		const controller = new AbortController()
		requestRef.current = controller
		return { signal: controller.signal }
	}

	const setLoading = (next: boolean) => {
		if (loadingRef.current === next) {
			return
		}

		loadingRef.current = next
		setIsLoading(next)
		busyLane?.onBusyChange(next)
	}

	const anchorEl = () => props.anchorRef?.current ?? inputRef.current

	const showLayer = () => {
		const el = anchorEl() as HTMLElement | null
		if (el?.getBoundingClientRect) {
			setAnchorWidth(el.getBoundingClientRect().width)
		}

		setOpen(true)
		props.onOpenChange?.(true)
	}

	const hideLayer = () => {
		if (!open) {
			return
		}

		setOpen(false)
		setHighlightedIndex(-1)
		abortRequest()
		props.onOpenChange?.(false)
	}

	// Results still arriving from a replaced source must not land in the new
	// one's menu.
	const prevSearchSourceRef = useRef(searchSource)
	if (prevSearchSourceRef.current !== searchSource) {
		abortRequest()
		prevSearchSourceRef.current = searchSource
		searchGenRef.current++
	}

	const applyBootstrapResults = (bootstrapResults: T[], gen: number) => {
		if (searchGenRef.current !== gen) {
			return
		}

		resultsGenRef.current = gen
		const shown = bootstrapResults.slice(0, maxMenuItems)
		setResults(shown)
		setHighlightedIndex(shown.length > 0 ? 0 : -1)
		if (bootstrapResults.length > 0) {
			showLayer()
		}
	}

	const performBootstrap = async () => {
		const gen = ++searchGenRef.current
		let bootstrapResult: T[] | Promise<T[]>
		try {
			bootstrapResult = searchSource.bootstrap(nextRequest())
		} catch {
			if (searchGenRef.current === gen) {
				setResults([])
				setLoading(false)
			}

			return
		}

		if (Array.isArray(bootstrapResult)) {
			setLoading(false)
			applyBootstrapResults(bootstrapResult, gen)
			return
		}

		setLoading(true)
		try {
			applyBootstrapResults(await bootstrapResult, gen)
		} catch {
			if (searchGenRef.current === gen) {
				setResults([])
			}
		} finally {
			if (searchGenRef.current === gen) {
				setLoading(false)
			}
		}
	}

	const performSearch = async (searchQuery: string) => {
		abortRequest()
		// Claim a generation so overlapping searches can't race — an in-flight
		// response for an older query fails this check instead of overwriting.
		const gen = ++searchGenRef.current
		setLoading(true)
		setHasSearched(true)
		try {
			const searchResults = await searchSource.search(searchQuery, nextRequest())
			if (searchGenRef.current !== gen) {
				return
			}

			resultsGenRef.current = gen
			const fetched = searchResults.slice(0, maxMenuItems)
			const shown = [
				...fetched,
				...((props as BaseTypeaheadInternalProps<T>).__queryEntries?.(searchQuery, fetched) ?? []),
			]

			setResults(shown)
			setHighlightedIndex(shown.length > 0 ? 0 : -1)
			if (searchResults.length > 0 || searchQuery.length > 0) {
				showLayer()
			}

			// Announce the outcome for an active query (not the focus-open).
			if (searchQuery.length > 0) {
				setAnnouncement(
					shown.length === 0 ? emptyText : `${shown.length} result${shown.length === 1 ? '' : 's'}`,
				)
			}
		} catch {
			if (searchGenRef.current !== gen) {
				return
			}

			setResults([])
			setHighlightedIndex(-1)
		} finally {
			if (searchGenRef.current === gen) {
				setLoading(false)
			}
		}
	}

	const handleQueryChange = (newQuery: string) => {
		setQuery(newQuery)
		props.onChangeQuery?.(newQuery)

		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
		}

		// Emptied field or a query under the threshold: drop stale results and
		// close — an unsearched query must not report "no results". Query-derived
		// entries still run (they cost no fetch).
		if (
			(newQuery.length === 0 && !hasEntriesOnFocus) ||
			isBelowMinQueryLength(newQuery, minQueryLength)
		) {
			searchGenRef.current++
			abortRequest()
			const derived = (props as BaseTypeaheadInternalProps<T>).__queryEntries?.(newQuery, []) ?? []
			setResults(derived)
			setHighlightedIndex(derived.length > 0 ? 0 : -1)
			setHasSearched(false)
			// The abandoned search won't clear this itself.
			setLoading(false)
			setAnnouncement('')
			if (derived.length > 0) {
				showLayer()
			} else {
				hideLayer()
			}

			return
		}

		const triggerSearch = () => {
			if (newQuery.length > 0) {
				void performSearch(newQuery)
			} else if (hasEntriesOnFocus) {
				void performBootstrap()
			}
		}

		if (debounceMs <= 0) {
			triggerSearch()
		} else {
			searchTimeoutRef.current = setTimeout(triggerSearch, debounceMs)
		}
	}

	const handleSelect = (item: T) => {
		searchGenRef.current++
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
			searchTimeoutRef.current = null
		}

		abortRequest()
		props.onChange(item)
		setQuery('')
		setResults([])
		setHasSearched(false)
		setLoading(false)
		hideLayer()
		inputRef.current?.focus()
	}

	const handleFocus = () => {
		if (props.isDisabled) {
			return
		}

		if (hasEntriesOnFocus && results.length === 0 && query.length === 0) {
			void performBootstrap()
		} else if (
			results.length > 0 &&
			(query.length > 0 || hasEntriesOnFocus) &&
			// Cached results invalidated by a selection must not re-show.
			resultsGenRef.current === searchGenRef.current
		) {
			showLayer()
		}

		props.onFocus?.()
	}

	// Close when focus leaves the field for somewhere outside the wrapper and
	// the dropdown panel — Tab/programmatic moves are not covered by the
	// backdrop's outside-tap dismiss.
	const handleBlur = (e: any) => {
		props.onBlur?.()
		if (!open) {
			return
		}

		const next = e.relatedTarget as Node | null
		if (next) {
			const anchor = anchorEl() as HTMLElement | null
			const panel = document.getElementById(panelId)
			if (anchor?.contains(next) || panel?.contains(next)) {
				return
			}
		}

		hideLayer()
	}

	// The view reports the closed-state ArrowDown as an open intent; the
	// container decides between reshowing results and bootstrapping.
	const handleOpenIntent = (next: boolean) => {
		if (!next) {
			hideLayer()
			return
		}

		if (open) {
			return
		}

		if (results.length > 0) {
			showLayer()
			setHighlightedIndex(0)
		} else if (hasEntriesOnFocus && !isBelowMinQueryLength(query, minQueryLength)) {
			void performBootstrap()
		}
	}

	useEffect(() => {
		if (props.hasAutoFocus) {
			inputRef.current?.focus()
		}
	}, [])

	// Unmount: clear the debounce and cancel in-flight work.
	useEffect(
		() => () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}

			abortRequest()
		},
		[],
	)

	useImperativeHandle(
		props.ref,
		() => ({
			focus: () => inputRef.current?.focus(),
			blur: () => inputRef.current?.blur(),
			setQuery: (q: string) => handleQueryChange(q),
			native: inputRef.current,
		}),
		undefined,
	)

	<BaseTypeaheadView
		{...props}
		inputId={inputId}
		listboxId={listboxId}
		panelId={panelId}
		inputRef={inputRef}
		anchor={props.anchorRef ?? inputRef}
		size={size}
		placeholder={placeholder}
		hasEntriesOnFocus={hasEntriesOnFocus}
		query={query}
		results={results}
		open={open}
		highlightedIndex={highlightedIndex}
		isSearching={isLoading}
		hasSearched={hasSearched}
		value={props.value}
		emptyText={emptyText}
		announcement={announcement}
		anchorWidth={anchorWidth}
		onQueryChange={handleQueryChange}
		onSelect={handleSelect}
		onOpenChange={handleOpenIntent}
		onInputFocus={handleFocus}
		onInputBlur={handleBlur}
		onHighlight={setHighlightedIndex}
	/>
}
