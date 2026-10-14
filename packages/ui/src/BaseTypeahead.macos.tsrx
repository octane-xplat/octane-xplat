/** @jsxImportSource @octane-xplat/macos-renderer */
import { useImperativeHandle, useContext, useEffect, useRef, useState } from 'octane';
import type { BaseTypeaheadProps, SearchableItem } from "./props";
import type { BaseTypeaheadInternalProps } from './internal-props';
import { useFieldControlProps } from './field-context';
import { BusyLaneContext } from './busy-lane';
import { characterCount } from './typeahead-source';
import { BaseTypeaheadView } from './BaseTypeaheadView.macos.tsrx';

function isBelowMinQueryLength(query: string, minQueryLength: number): boolean {
	const length = characterCount(query);
	return length > 0 && length < minQueryLength;
}

/** Combobox engine: input, debounced search/bootstrap, and a result list.
 *  AppKit leaf — the renderer's textfield exposes only `value` +
 *  `onTextChange`, so there is no focus bootstrap, key navigation, or
 *  return-to-select; the list opens when results exist and options are
 *  tap-selected. Popover renders inline below the anchor on this target.
 *
 *  This is the container half of the split: it coordinates query, results,
 *  highlight, search progress, and open state, then renders
 *  `BaseTypeaheadView` with the resolved state and intent callbacks. */
export function BaseTypeahead<T extends SearchableItem,>(inProps: BaseTypeaheadProps<T>) @{
	const props = useFieldControlProps(inProps);
	const searchSource = props.searchSource;
	const hasEntriesOnFocus = props.hasEntriesOnFocus ?? false;
	const maxMenuItems = props.maxMenuItems ?? 10;
	const minQueryLength = props.minQueryLength ?? 1;
	const debounceMs = props.debounceMs ?? 150;
	const size = props.size ?? 'md';
	const placeholder = props.placeholder ?? 'Search…';
	const emptyText = props.emptySearchResultsText ?? 'No results found';

	const inputRef = useRef<any>(null);
	const busyLane = useContext(BusyLaneContext);

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<T[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [open, setOpen] = useState(false);

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchGenRef = useRef(0);
	const resultsGenRef = useRef(0);
	const loadingRef = useRef(false);

	const setLoading = (next: boolean) => {
		if (loadingRef.current === next) return;
		loadingRef.current = next;
		setIsLoading(next);
		busyLane?.onBusyChange(next);
	};

	const showLayer = () => {
		setOpen(true);
		props.onOpenChange?.(true);
	};

	const hideLayer = () => {
		if (!open) return;
		setOpen(false);
		setHighlightedIndex(-1);
		searchSource.cancel?.();
		props.onOpenChange?.(false);
	};

	const prevSearchSourceRef = useRef(searchSource);
	if (prevSearchSourceRef.current !== searchSource) {
		prevSearchSourceRef.current.cancel?.();
		prevSearchSourceRef.current = searchSource;
		searchGenRef.current++;
	}

	const applyBootstrapResults = (bootstrapResults: T[], gen: number) => {
		if (searchGenRef.current !== gen) return;
		resultsGenRef.current = gen;
		const shown = bootstrapResults.slice(0, maxMenuItems);
		setResults(shown);
		setHighlightedIndex(shown.length > 0 ? 0 : -1);
		if (bootstrapResults.length > 0) showLayer();
	};

	const performBootstrap = async () => {
		const gen = ++searchGenRef.current;
		let bootstrapResult: T[] | Promise<T[]>;
		try {
			bootstrapResult = searchSource.bootstrap();
		} catch {
			if (searchGenRef.current === gen) {
				setResults([]);
				setLoading(false);
			}

			return;
		}

		if (Array.isArray(bootstrapResult)) {
			setLoading(false);
			applyBootstrapResults(bootstrapResult, gen);
			return;
		}

		setLoading(true);
		try {
			applyBootstrapResults(await bootstrapResult, gen);
		} catch {
			if (searchGenRef.current === gen) setResults([]);
		} finally {
			if (searchGenRef.current === gen) setLoading(false);
		}
	};

	const performSearch = async (searchQuery: string) => {
		searchSource.cancel?.();
		const gen = ++searchGenRef.current;
		setLoading(true);
		setHasSearched(true);
		try {
			const searchResults = await searchSource.search(searchQuery);
			if (searchGenRef.current !== gen) return;
			resultsGenRef.current = gen;
			const fetched = searchResults.slice(0, maxMenuItems);
			const shown = [...fetched, ...((props as BaseTypeaheadInternalProps<T>).__queryEntries?.(searchQuery, fetched) ?? [])];
			setResults(shown);
			setHighlightedIndex(shown.length > 0 ? 0 : -1);
			if (searchResults.length > 0 || searchQuery.length > 0) showLayer();
		} catch {
			if (searchGenRef.current !== gen) return;
			setResults([]);
			setHighlightedIndex(-1);
		} finally {
			if (searchGenRef.current === gen) setLoading(false);
		}
	};

	const handleQueryChange = (newQuery: string) => {
		setQuery(newQuery);
		props.onChangeQuery?.(newQuery);

		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

		if ((newQuery.length === 0 && !hasEntriesOnFocus) || isBelowMinQueryLength(newQuery, minQueryLength)) {
			searchGenRef.current++;
			searchSource.cancel?.();
			const derived = (props as BaseTypeaheadInternalProps<T>).__queryEntries?.(newQuery, []) ?? [];
			setResults(derived);
			setHighlightedIndex(derived.length > 0 ? 0 : -1);
			setHasSearched(false);
			setLoading(false);
			if (derived.length > 0) showLayer(); else hideLayer();
			return;
		}

		const triggerSearch = () => {
			if (newQuery.length > 0) {
				void performSearch(newQuery);
			} else if (hasEntriesOnFocus) {
				void performBootstrap();
			}
		};

		if (debounceMs <= 0) triggerSearch();
		else searchTimeoutRef.current = setTimeout(triggerSearch, debounceMs);
	};

	const handleSelect = (item: T) => {
		searchGenRef.current++;
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
			searchTimeoutRef.current = null;
		}

		searchSource.cancel?.();
		props.onChange(item);
		setQuery('');
		setResults([]);
		setHasSearched(false);
		setLoading(false);
		hideLayer();
	};

	useEffect(() => () => {
		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		prevSearchSourceRef.current.cancel?.();
	}, []);

	useImperativeHandle(props.ref, () => ({
		focus: () => inputRef.current.window?.makeFirstResponder?.(inputRef.current),
		blur: () => inputRef.current.window?.makeFirstResponder?.(null),
		setQuery: (q: string) => handleQueryChange(q),
		native: inputRef.current,
	}), undefined);

	<BaseTypeaheadView
		{...props}
		inputId={props.inputId ?? props.id}
		inputRef={inputRef}
		anchor={inputRef}
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
		onQueryChange={handleQueryChange}
		onSelect={handleSelect}
		onOpenChange={(next: boolean) => { if (!next) hideLayer(); }}
	/>
}
