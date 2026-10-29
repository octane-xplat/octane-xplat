/** @jsxImportSource @octane-xplat/jsx */
import { useImperativeHandle, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { BaseTypeaheadProps, SearchableItem } from '../../props'
import type { NSTextField } from '@octane-xplat/platform/macos'
import type { BaseTypeaheadInternalProps } from '../../internal-props'
import { useFieldControlProps } from './field-context'
import { BusyLaneContext } from '../../internal/rendering/busy-lane'
import { characterCount } from './typeahead-source'
import { BaseTypeaheadView } from './BaseTypeaheadView.macos.tsrx'
import { createAppKitAutoFocus } from '../../internal/accessibility/auto-focus.macos'

/** AppKit combobox search/focus ownership. Results remain in the inline
 * presentation; keyboard intents remain source-only and listbox AX is incomplete. */
export function BaseTypeahead<T extends SearchableItem>(inProps: BaseTypeaheadProps<T>) @{
	const props = useFieldControlProps(inProps)
	const inputRef = useRef<NSTextField | null>(null), busyLane = useContext(BusyLaneContext)
	const [query, setQuery] = useState(''), [results, setResults] = useState<T[]>([])
	const [highlightedIndex, setHighlightedIndex] = useState(-1), [isLoading, setIsLoading] = useState(false)
	const [hasSearched, setHasSearched] = useState(false), [open, setOpen] = useState(false)
	const live = useRef({ props, query, results, open }); live.current = { props, query, results, open }
	const generation = useRef(0), resultsGeneration = useRef(-1), loading = useRef(false), selecting = useRef(false), editing = useRef(false)
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null), request = useRef<AbortController | null>(null)
	const blocked = () => !!live.current.props.isDisabled || !!live.current.props.isReadOnly
	const cancel = () => {
		const gen = ++generation.current
		const controller = request.current; request.current = null
		if (timer.current != null) { clearTimeout(timer.current); timer.current = null }
		controller?.abort()
		return gen
	}
	const valid = (gen: number) => !!inputRef.current && generation.current === gen && !blocked()
	const setLoading = (next: boolean) => {
		if (loading.current === next) return
		loading.current = next
		if (inputRef.current) setIsLoading(next)
		busyLane?.onBusyChange(next)
	}
	const showLayer = () => {
		if (!inputRef.current || blocked() || live.current.open) return
		live.current.open = true; setOpen(true)
		live.current.props.onOpenChange?.(true)
	}
	const hideLayer = () => {
		const wasOpen = live.current.open, notify = live.current.props.onOpenChange
		const gen = cancel()
		if (generation.current !== gen) return
		live.current.open = false
		if (inputRef.current) { setOpen(false); setHighlightedIndex(-1) }
		setLoading(false)
		if (wasOpen) notify?.(false)
	}
	const source = useRef(props.searchSource)
	if (source.current !== props.searchSource) { source.current = props.searchSource; generation.current++ }
	const applyResults = (items: T[], gen: number, searched: boolean, text: string) => {
		if (!valid(gen)) return
		const current = live.current.props, fetched = items.slice(0, current.maxMenuItems ?? 10)
		const derived = searched ? (current as BaseTypeaheadInternalProps<T>).__queryEntries?.(text, fetched) ?? [] : []
		if (!valid(gen)) return // Query-entry callbacks may replace props or unmount.
		const shown = [...fetched, ...derived]
		resultsGeneration.current = gen; live.current.results = shown
		setResults(shown); setHighlightedIndex(shown.length ? 0 : -1); setHasSearched(searched)
		if (shown.length || (searched && text.length)) showLayer()
	}
	const performBootstrap = async (gen: number) => {
		if (!valid(gen)) return
		const controller = new AbortController(); request.current = controller
		try {
			let value = live.current.props.searchSource.bootstrap({ signal: controller.signal })
			if (!Array.isArray(value)) { if (valid(gen)) setLoading(true); value = await value }
			applyResults(value, gen, false, '')
		} catch { if (valid(gen)) { live.current.results = []; setResults([]); setHighlightedIndex(-1) } }
		finally { if (valid(gen)) { request.current = null; setLoading(false) } }
	}
	const performSearch = async (text: string, gen: number) => {
		if (!valid(gen)) return
		const controller = new AbortController(); request.current = controller
		setHasSearched(true); setLoading(true)
		try {
			if (!valid(gen)) return
			const value = await live.current.props.searchSource.search(text, { signal: controller.signal })
			applyResults(value, gen, true, text)
		} catch { if (valid(gen)) { live.current.results = []; setResults([]); setHighlightedIndex(-1) } }
		finally { if (valid(gen)) { request.current = null; setLoading(false) } }
	}
	const handleQueryChange = (text: string) => {
		if (!inputRef.current || blocked() || editing.current || selecting.current) return
		editing.current = true
		try {
			const gen = cancel()
			live.current.query = text; setQuery(text); setLoading(false)
			if (!valid(gen)) return
			live.current.props.onChangeQuery?.(text)
			if (!valid(gen)) return
			const current = live.current.props, entriesOnFocus = current.hasEntriesOnFocus ?? false
			if ((!text.length && !entriesOnFocus) || (text.length > 0 && characterCount(text) < (current.minQueryLength ?? 1))) {
				const derived = (current as BaseTypeaheadInternalProps<T>).__queryEntries?.(text, []) ?? []
				if (!valid(gen)) return
				resultsGeneration.current = gen; live.current.results = derived
				setResults(derived); setHighlightedIndex(derived.length ? 0 : -1); setHasSearched(false)
				if (derived.length) showLayer(); else hideLayer()
				return
			}
			const search = () => { timer.current = null; if (!valid(gen)) return; if (text.length) void performSearch(text, gen); else void performBootstrap(gen) }
			if ((current.debounceMs ?? 150) <= 0) search(); else timer.current = setTimeout(search, current.debounceMs ?? 150)
		} finally { editing.current = false }
	}
	const handleSelect = (item: T) => {
		if (!inputRef.current || blocked() || selecting.current || !live.current.open || resultsGeneration.current !== generation.current) return
		const current = live.current, selected = current.results.find((result) => result.id === item.id)
		if (!selected) return
		selecting.current = true
		try {
			const change = current.props.onChange, notify = current.props.onOpenChange
			const gen = cancel()
			if (inputRef.current && generation.current === gen) {
				live.current.query = ''; live.current.results = []; live.current.open = false
				setQuery(''); setResults([]); setHighlightedIndex(-1); setHasSearched(false); setOpen(false); setLoading(false)
			}
			change(selected)
			if (inputRef.current && generation.current === gen && !live.current.open) notify?.(false)
		} finally { selecting.current = false }
	}
	const offerResults = () => {
		if (!inputRef.current || blocked()) return
		const current = live.current
		if (current.results.length && (current.query.length || current.props.hasEntriesOnFocus) && resultsGeneration.current === generation.current) showLayer()
		else if (!current.query.length && current.props.hasEntriesOnFocus) { const gen = cancel(); void performBootstrap(gen) }
		else if (current.query.length && characterCount(current.query) >= (current.props.minQueryLength ?? 1)) { const gen = cancel(); void performSearch(current.query, gen) }
	}
	const handleFocus = () => {
		if (!inputRef.current) return
		const gen = generation.current
		live.current.props.onFocus?.()
		if (generation.current === gen) offerResults()
	}
	const handleBlur = () => {
		if (!inputRef.current) return
		const notify = live.current.props.onBlur
		hideLayer(); notify?.()
	}
	const autoFocus = useMemo(() => createAppKitAutoFocus({ requested: () => live.current.props.hasAutoFocus === true, blocked }), [])
	const inputSlot = useMemo(() => ({
		get current() { return inputRef.current },
		set current(view: NSTextField | null) {
			const changed = inputRef.current !== view
			if (changed) cancel()
			inputRef.current = view
			if (changed) { live.current.open = false; if (view) setOpen(false); setLoading(false) }
			autoFocus.bind(view)
		},
	}), [])
	useLayoutEffect(() => autoFocus.update(), null)
	useLayoutEffect(() => { live.current.results = []; setResults([]); setHasSearched(false); hideLayer() }, [props.searchSource, props.isDisabled, props.isReadOnly])
	useEffect(() => () => { cancel(); autoFocus.dispose(); setLoading(false) }, [])
	const actions = useRef({ handleQueryChange }); actions.current = { handleQueryChange }
	useImperativeHandle(props.ref, () => ({
		focus() {
			const view = inputRef.current, current = live.current.props
			if (!view?.window || (current.isDisabled && !current.isFocusableDisabled) || ['hidden', 'hiddenOrHasHiddenAncestor'].some((key) => { const value = Reflect.get(view, key); return Boolean(typeof value === 'function' ? value.call(view) : value) })) return
			view.window.makeFirstResponder(view)
		},
		blur() {
			const view = inputRef.current, window = view?.window, responder = window?.firstResponder
			if (!view || !window || !responder) return
			const editor = Reflect.get(view, 'currentEditor'), currentEditor = typeof editor === 'function' ? editor.call(view) : editor
			if (responder === view || responder === currentEditor) window.makeFirstResponder(null)
		},
		setQuery: (text: string) => actions.current.handleQueryChange(text),
		get native() { return inputRef.current! },
	}), [])

	<BaseTypeaheadView {...props}
		inputId={props.inputId ?? props.id} inputRef={inputSlot} anchor={props.anchorRef ?? inputSlot}
		size={props.size ?? 'md'} placeholder={props.placeholder ?? 'Search…'}
		hasEntriesOnFocus={props.hasEntriesOnFocus ?? false} query={query}
		results={resultsGeneration.current === generation.current ? results : []}
		open={open && !props.isDisabled && !props.isReadOnly} highlightedIndex={highlightedIndex}
		isSearching={isLoading} hasSearched={hasSearched} value={props.value} emptyText={props.emptySearchResultsText ?? 'No results found'}
		onQueryChange={handleQueryChange} onSelect={handleSelect} onInputFocus={handleFocus} onInputBlur={handleBlur}
		onHighlight={(index: number) => {
			if (inputRef.current && !blocked() && live.current.open && resultsGeneration.current === generation.current && index >= 0 && index < live.current.results.length) setHighlightedIndex(index)
		}}
		onOpenChange={(next: boolean) => { if (!next) hideLayer(); else offerResults() }}
	/>
}
