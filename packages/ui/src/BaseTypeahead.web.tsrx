import { useContext, useEffect, useId, useRef, useState } from 'octane';
import type { BaseTypeaheadProps, SearchableItem } from "./props";
import { applyEscapeProps } from "./escape-props";
import { useFieldControlProps } from './field-context';
import { Popover } from './Popover.web.tsrx';
import { TypeaheadItem } from './TypeaheadItem.web.tsrx';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';
import { BusyLaneContext } from './busy-lane';
import { characterCount, groupTypeaheadItems } from './typeahead-source';

/** A query shorter than the caller's threshold; an empty query is the
 *  untouched state — `hasEntriesOnFocus` owns what happens there. */
function isBelowMinQueryLength(query: string, minQueryLength: number): boolean {
	const length = characterCount(query);
	return length > 0 && length < minQueryLength;
}

function isImeKeyEvent(e: any): boolean {
	return e?.isComposing === true || e?.keyCode === 229;
}

/** Combobox engine: input, debounced search/bootstrap, keyboard navigation,
 *  and an anchored result listbox. No wrapper chrome — Typeahead and
 *  Tokenizer own the visible field and pass `anchor` to position the menu.
 *  `item.element` > `renderItem` > TypeaheadItem for option content. */
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

	const generatedId = useId();
	const inputId = props.inputId ?? props.id ?? generatedId;
	const listboxId = `${generatedId}-listbox`;
	const panelId = `${generatedId}-panel`;

	const inputRef = useRef<HTMLInputElement | null>(null);
	const fallbackAnchor = useRef<any>(null);
	const busyLane = useContext(BusyLaneContext);

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<T[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [open, setOpen] = useState(false);
	const [announcement, setAnnouncement] = useState('');
	const [anchorWidth, setAnchorWidth] = useState(0);

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Monotonic generation: selection, clear, and source replacement bump it so
	// stale async resolutions discard themselves.
	const searchGenRef = useRef(0);
	const resultsGenRef = useRef(0);
	const loadingRef = useRef(false);
	const latest = useRef(props);
	latest.current = props;

	const setLoading = (next: boolean) => {
		if (loadingRef.current === next) return;
		loadingRef.current = next;
		setIsLoading(next);
		busyLane?.onBusyChange(next);
	};

	const anchorEl = () => props.anchorRef?.current ?? fallbackAnchor.current;

	const showLayer = () => {
		const el = anchorEl() as HTMLElement | null;
		if (el?.getBoundingClientRect) setAnchorWidth(el.getBoundingClientRect().width);
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

	// Results still arriving from a replaced source must not land in the new
	// one's menu.
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
		// Claim a generation so overlapping searches can't race — an in-flight
		// response for an older query fails this check instead of overwriting.
		const gen = ++searchGenRef.current;
		setLoading(true);
		setHasSearched(true);
		try {
			const searchResults = await searchSource.search(searchQuery);
			if (searchGenRef.current !== gen) return;
			resultsGenRef.current = gen;
			const fetched = searchResults.slice(0, maxMenuItems);
			const shown = [...fetched, ...(props.__queryEntries?.(searchQuery, fetched) ?? [])];
			setResults(shown);
			setHighlightedIndex(shown.length > 0 ? 0 : -1);
			if (searchResults.length > 0 || searchQuery.length > 0) showLayer();
			// Announce the outcome for an active query (not the focus-open).
			if (searchQuery.length > 0) {
				setAnnouncement(shown.length === 0 ? emptyText : `${shown.length} result${shown.length === 1 ? '' : 's'}`);
			}
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

		// Emptied field or a query under the threshold: drop stale results and
		// close — an unsearched query must not report "no results". Query-derived
		// entries still run (they cost no fetch).
		if ((newQuery.length === 0 && !hasEntriesOnFocus) || isBelowMinQueryLength(newQuery, minQueryLength)) {
			searchGenRef.current++;
			searchSource.cancel?.();
			const derived = props.__queryEntries?.(newQuery, []) ?? [];
			setResults(derived);
			setHighlightedIndex(derived.length > 0 ? 0 : -1);
			setHasSearched(false);
			// The abandoned search won't clear this itself.
			setLoading(false);
			setAnnouncement('');
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
		inputRef.current?.focus();
	};

	const handleFocus = () => {
		if (props.isDisabled) return;
		if (hasEntriesOnFocus && results.length === 0 && query.length === 0) {
			void performBootstrap();
		} else if (
			results.length > 0 &&
			(query.length > 0 || hasEntriesOnFocus) &&
			// Cached results invalidated by a selection must not re-show.
			resultsGenRef.current === searchGenRef.current
		) {
			showLayer();
		}
		props.onFocus?.();
	};

	// Close when focus leaves the field for somewhere outside the wrapper and
	// the dropdown panel — Tab/programmatic moves are not covered by the
	// backdrop's outside-tap dismiss.
	const handleBlur = (e: any) => {
		props.onBlur?.();
		if (!open) return;
		const next = e.relatedTarget as Node | null;
		if (next) {
			const anchor = anchorEl() as HTMLElement | null;
			const panel = document.getElementById(panelId);
			if (anchor?.contains(next) || panel?.contains(next)) return;
		}
		hideLayer();
	};

	const handleKeyDown = (e: any) => {
		props.onKeyDown?.(e);
		if (e.defaultPrevented) return;
		// An IME candidate window owns Enter/Escape/arrows mid-composition.
		if (isImeKeyEvent(e)) return;

		if (!open) {
			if (e.key === 'ArrowDown' && (hasEntriesOnFocus || query.length > 0)) {
				e.preventDefault();
				if (results.length > 0) {
					showLayer();
					setHighlightedIndex(0);
				} else if (hasEntriesOnFocus && !isBelowMinQueryLength(query, minQueryLength)) {
					void performBootstrap();
				}
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (results.length > 0) setHighlightedIndex((prev) => prev < results.length - 1 ? prev + 1 : 0);
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (results.length > 0) setHighlightedIndex((prev) => prev > 0 ? prev - 1 : results.length - 1);
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < results.length) handleSelect(results[highlightedIndex]);
				break;
			case 'Escape':
				e.preventDefault();
				hideLayer();
				break;
			case 'Tab':
				hideLayer();
				break;
			case 'Home':
				e.preventDefault();
				if (results.length > 0) setHighlightedIndex(0);
				break;
			case 'End':
				e.preventDefault();
				if (results.length > 0) setHighlightedIndex(results.length - 1);
				break;
		}
	};

	const itemId = (index: number) => `${listboxId}-option-${index}`;

	// Keep the keyboard highlight scrolled into view (hover never scrolls).
	useEffect(() => {
		if (!open || highlightedIndex < 0) return;
		document.getElementById(itemId(highlightedIndex))?.scrollIntoView?.({ block: 'nearest' });
	}, [highlightedIndex, open]);

	useEffect(() => {
		if (props.hasAutoFocus) inputRef.current?.focus();
	}, []);

	// Unmount: clear the debounce and cancel in-flight work.
	useEffect(() => () => {
		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		prevSearchSourceRef.current.cancel?.();
	}, []);

	const groups = groupTypeaheadItems(results, { ungroupedFirst: true });
	const selectedId = props.value?.id;

	<>
		<input
			ref={(el: any) => {
				inputRef.current = el;
				fallbackAnchor.current = el;
				if (!el) return;
				applyEscapeProps(el, props);
				props.bind?.({
					focus: () => el.focus(),
					blur: () => el.blur(),
					setQuery: (q: string) => handleQueryChange(q),
					native: el,
				});
			}}
			id={inputId}
			tabIndex={props.inputTabIndex}
			type="text"
			role="combobox"
			className={['vx-typeahead-input', `vx-typeahead-input--size-${size}`, props.isDisabled ? 'vx-typeahead-input--disabled' : undefined, props.inputClassName, props.className]}
			style={{ ...props.style, ...props.inputStyle }}
			aria-expanded={open}
			aria-controls={listboxId}
			aria-activedescendant={open && highlightedIndex >= 0 && highlightedIndex < results.length ? itemId(highlightedIndex) : undefined}
			aria-autocomplete="list"
			aria-busy={isLoading || undefined}
			aria-label={props.ariaLabel}
			aria-labelledby={props.ariaLabelledBy}
			aria-describedby={props.ariaDescribedBy}
			aria-required={props.isRequired && !props.isOptional || undefined}
			aria-invalid={props.status?.type === 'error' || undefined}
			aria-disabled={props.isFocusableDisabled ? 'true' : undefined}
			value={query}
			onInput={(e: any) => handleQueryChange(e.target.value)}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			placeholder={placeholder}
			disabled={props.isDisabled && !props.isFocusableDisabled || undefined}
			readOnly={props.isFocusableDisabled || props.isReadOnly || undefined}
			autoComplete="off"
		/>
		{isLoading && busyLane == null
			? <span className="vx-typeahead-loading" role="status" aria-label="Loading"><ActivityIndicator busy={true} /></span>
			: null}
		<span className="vx-sr-only" role="status">{announcement}</span>
		<Popover
			anchor={props.anchorRef ?? fallbackAnchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			onDismiss={hideLayer}
			className="vx-typeahead-dropdown"
			style={{ minWidth: anchorWidth > 0 ? anchorWidth : undefined, width: props.menuWidth }}
			web={{ id: panelId }}
		>
			<div id={listboxId} role="listbox" aria-label="Search results" className="vx-typeahead-list">
				{results.length === 0 && hasSearched
					? <div role="option" aria-disabled="true" className="vx-typeahead-empty">{emptyText}</div>
					: groups.map((group, gi) => {
						const options = group.items.map((item) => {
							const index = results.indexOf(item);
							const isSelected = item.id === selectedId && selectedId != null;
							return (
								<div
									key={`${item.id}-${index}`}
									id={itemId(index)}
									role="option"
									aria-selected={isSelected || undefined}
									tabIndex={-1}
									className={['vx-typeahead-option', `vx-typeahead-option--size-${size}`, index === highlightedIndex ? 'vx-typeahead-option--highlighted' : undefined, isSelected ? 'vx-typeahead-option--selected' : undefined]}
									onMouseDown={(e: any) => e.preventDefault()}
									onMouseEnter={() => setHighlightedIndex(index)}
									onClick={() => handleSelect(item)}
								>
									<span className="vx-typeahead-option-content">
										{props.renderItem ? props.renderItem(item) : <TypeaheadItem item={item} />}
									</span>
									{isSelected ? <span className="vx-typeahead-option-check" aria-hidden="true">✓</span> : null}
								</div>
							);
						});
						if (group.heading == null) return options;
						return (
							<div key={`group-${group.heading ?? gi}`} role="group" aria-label={group.heading}>
								<div className="vx-typeahead-group" aria-hidden="true">{group.heading}</div>
								{options}
							</div>
						);
					})}
			</div>
		</Popover>
	</>
}
