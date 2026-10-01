/** @jsxImportSource @nativescript-community/octane */
import { useContext, useEffect, useRef, useState } from 'octane';
import type { BaseTypeaheadProps, SearchableItem } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { useFieldControlProps } from './field-context';
import { isWritingText, writeText } from './text-write';
import { blurText } from './text-focus';
import { Popover } from './Popover.tsrx';
import { TypeaheadItem } from './TypeaheadItem.tsrx';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { BusyLaneContext } from './busy-lane';
import { characterCount, groupTypeaheadItems } from './typeahead-source';

function isBelowMinQueryLength(query: string, minQueryLength: number): boolean {
	const length = characterCount(query);
	return length > 0 && length < minQueryLength;
}

/** Combobox engine: input, debounced search/bootstrap, and an anchored
 *  result listbox. Native leaf — options are tap-driven (native text fields
 *  emit no arrow/escape key events; the return key selects the highlighted
 *  or first option). No wrapper chrome; callers supply the visible field
 *  and pass `anchor` to position the menu. */
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
	const fallbackAnchor = useRef<any>(null);
	const busyLane = useContext(BusyLaneContext);

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<T[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [open, setOpen] = useState(false);
	const [anchorWidth, setAnchorWidth] = useState(0);

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchGenRef = useRef(0);
	const resultsGenRef = useRef(0);
	const loadingRef = useRef(false);

	// Controlled text write — imperative so Android keeps its selection.
	useEffect(() => writeText(inputRef.current, query), [query]);

	const setLoading = (next: boolean) => {
		if (loadingRef.current === next) return;
		loadingRef.current = next;
		setIsLoading(next);
		busyLane?.onBusyChange(next);
	};

	const anchorView = () => props.anchorRef?.current ?? fallbackAnchor.current;

	const showLayer = () => {
		const size2 = (anchorView() as any)?.getActualSize?.();
		if (size2?.width > 0) setAnchorWidth(size2.width);
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
			const shown = [...fetched, ...(props.__queryEntries?.(searchQuery, fetched) ?? [])];
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
			const derived = props.__queryEntries?.(newQuery, []) ?? [];
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
		inputRef.current?.focus();
	};

	const handleFocus = () => {
		if (props.isDisabled) return;
		if (hasEntriesOnFocus && results.length === 0 && query.length === 0) {
			void performBootstrap();
		} else if (
			results.length > 0 &&
			(query.length > 0 || hasEntriesOnFocus) &&
			resultsGenRef.current === searchGenRef.current
		) {
			showLayer();
		}
		props.onFocus?.();
	};

	useEffect(() => {
		if (props.hasAutoFocus) inputRef.current?.focus();
	}, []);

	useEffect(() => () => {
		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		prevSearchSourceRef.current.cancel?.();
	}, []);

	const groups = groupTypeaheadItems(results, { ungroupedFirst: true });
	const selectedId = props.value?.id;

	<>
		<textfield
			ref={(v: any) => {
				inputRef.current = v;
				fallbackAnchor.current = v;
				if (!v) return;
				applyEscapeProps(v, props);
				props.bind?.({
					focus: () => v.focus(),
					blur: () => blurText(v),
					setQuery: (q: string) => handleQueryChange(q),
					native: v,
				});
			}}
			id={props.inputId ?? props.id}
			className={cx('vx-typeahead-input', `vx-typeahead-input--size-${size}`, props.isDisabled && 'vx-typeahead-input--disabled', props.inputClassName, props.className)}
			style={{ ...props.style, ...props.inputStyle }}
			hint={placeholder}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
			isEnabled={!props.isDisabled || props.isFocusableDisabled}
			editable={!(props.isDisabled || props.isReadOnly)}
			onTextChange={(e: any) => { if (!isWritingText(e.object)) handleQueryChange(e.value); }}
			onReturnPress={() => {
				const item = highlightedIndex >= 0 && highlightedIndex < results.length ? results[highlightedIndex] : results[0];
				if (item) handleSelect(item);
			}}
			onFocus={handleFocus}
			onBlur={props.onBlur}
		/>
		{isLoading && busyLane == null
			? <flexboxlayout className="vx-typeahead-loading"><ActivityIndicator busy={true} /></flexboxlayout>
			: null}
		<Popover
			anchor={props.anchorRef ?? fallbackAnchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			onDismiss={hideLayer}
			className="vx-typeahead-dropdown"
			style={{ minWidth: anchorWidth > 0 ? anchorWidth : undefined, width: props.menuWidth }}
		>
			<scrollview className="vx-typeahead-scroll">
				<flexboxlayout className="vx-typeahead-list" flexDirection="column">
					{results.length === 0 && hasSearched
						? <flexboxlayout className="vx-typeahead-empty"><label text={emptyText} /></flexboxlayout>
						: null}
					@for (const group of groups; key group.heading ?? 'ungrouped') {
						{group.heading != null
							? <label className="vx-typeahead-group" text={group.heading} />
							: null}
						@for (const item of group.items; index gi; key item.id + '-' + gi) {
							const index = results.indexOf(item);
							const isSelected = item.id === selectedId && selectedId != null;
							<flexboxlayout
								className={cx('vx-typeahead-option', `vx-typeahead-option--size-${size}`, index === highlightedIndex && 'vx-typeahead-option--highlighted', isSelected && 'vx-typeahead-option--selected')}
								flexDirection="row"
								alignItems="center"
								onTap={() => handleSelect(item)}
								accessibilityState={nativeAccessibilityState({ selected: isSelected }) as any}
							>
								<flexboxlayout className="vx-typeahead-option-content" flexGrow={1}>
									{props.renderItem ? props.renderItem(item) : <TypeaheadItem item={item} />}
								</flexboxlayout>
								{isSelected ? <label className="vx-typeahead-option-check" text="✓" /> : null}
							</flexboxlayout>
						}
					}
				</flexboxlayout>
			</scrollview>
		</Popover>
	</>
}
