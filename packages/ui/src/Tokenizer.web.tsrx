import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'octane';
import type { SearchableItem, SearchSource, TokenizerProps, TypeaheadInputHandle } from "./props";
import { applyEscapeProps } from "./escape-props";
import { FormField } from './FormField.web.tsrx';
import { BaseTypeahead } from './BaseTypeahead.web.tsrx';
import { Token } from './Token.web.tsrx';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { Tooltip } from './Tooltip.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { BusyLaneProvider, createBusyIndicatorLane, type BusyIndicatorLane } from './busy-lane';

// Sentinel prefix distinguishing "Create \"X\"" entries from real results.
const CREATABLE_ID_PREFIX = '__xds_create__';

/** Inline-end lane: busy Spinner, endContent, clear button — one leaf
 *  subscribing so a search transition doesn't re-render every token. */
function EndLane(props: { lane: BusyIndicatorLane; endContent?: any; clear?: any; laneRef?: (el: HTMLElement | null) => void }) @{
	const isBusy = useSyncExternalStore(props.lane.subscribe, props.lane.getIsBusy);
	if (!isBusy && props.endContent == null && props.clear == null) return null;
	<div className="vx-tokenizer-endlane" ref={props.laneRef}>
		{isBusy ? <span className="vx-typeahead-spinner" role="status" aria-label="Loading"><ActivityIndicator busy={true} /></span> : null}
		{props.endContent}
		{props.clear}
	</div>
}

/** Multi-select field: Token chips + a BaseTypeahead input. Selecting adds a
 *  token and clears the query; Backspace on an empty input removes the last
 *  token; `hasCreate` offers a "Create \"…\"" entry for unmatched text. */
export function Tokenizer<T extends SearchableItem,>(props: TokenizerProps<T>) @{
	const size = props.size ?? 'md';
	const inputId = useId();
	const inputHandle = useRef<TypeaheadInputHandle | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const laneRef = useRef<HTMLElement | null>(null);
	const overflowRef = useRef<HTMLElement | null>(null);
	const tokenEls = useRef(new Map<number, HTMLElement>());
	const layerContentRef = useRef<HTMLElement | null>(null);

	const showsDisabledMessage = Boolean(props.isDisabled && props.disabledMessage);
	const busyLane = useMemo(() => createBusyIndicatorLane(), []);
	const [isFocusedWithin, setIsFocusedWithin] = useState(false);
	const [layerOpen, setLayerOpen] = useState(false);
	const [overflowCount, setOverflowCount] = useState(0);
	const [announcement, setAnnouncement] = useState('');
	const lastQuery = useRef('');

	const tokenOverflowBehavior = props.tokenOverflowBehavior ?? 'none';
	const isLayerMode = tokenOverflowBehavior === 'unfocusedLayer';
	const isTruncated = !isFocusedWithin && tokenOverflowBehavior !== 'none' && props.value.length > 0;
	const isAtMax = props.maxEntries != null && props.value.length >= props.maxEntries;


	useEffect(() => { props.bind?.({ focus: () => inputHandle.current?.focus(), blur: () => inputHandle.current?.blur(), native: wrapperRef.current }); }, [props.bind]);

	const selectedIds = useMemo(
		() => new Set(props.value.map((item) => item.id)),
		[props.value],
	);

	// Already-selected items never appear in the dropdown.
	const filteredSource: SearchSource<T> = useMemo(
		() => ({
			search: async (query: string) =>
				(await props.searchSource.search(query)).filter((item) => !selectedIds.has(item.id)),
			bootstrap: async () =>
				(await props.searchSource.bootstrap()).filter((item) => !selectedIds.has(item.id)),
			cancel: () => props.searchSource.cancel?.(),
		}),
		[props.searchSource, selectedIds],
	);

	const emptySource: SearchSource<T> = useMemo(
		() => ({ search: async () => [], bootstrap: async () => [] }),
		[],
	);

	// The "Create \"X\"" entry rides on the query, not a fetch — so it survives
	// queries too short to search.
	const createEntries = (query: string, results: T[]): T[] => {
		const trimmed = query.trim();
		if (!props.hasCreate || trimmed === '') return [];
		const alreadyExists =
			selectedIds.has(trimmed) ||
			results.some((item) => item.label.toLowerCase() === trimmed.toLowerCase());
		if (alreadyExists) return [];
		return [{
			id: `${CREATABLE_ID_PREFIX}${trimmed}`,
			label: `Create "${trimmed}"`,
			auxiliaryData: { __createdValue: trimmed },
		} as unknown as T];
	};

	const handleAdd = (item: T | null) => {
		if (!item || isAtMax) return;
		if (props.hasCreate && typeof item.id === 'string' && item.id.startsWith(CREATABLE_ID_PREFIX)) {
			const createdValue = item.id.slice(CREATABLE_ID_PREFIX.length);
			if (selectedIds.has(createdValue)) return;
			const realItem = { id: createdValue, label: createdValue } as T;
			props.onChange([...props.value, realItem], { item: realItem, type: 'create' });
			setAnnouncement(`${createdValue} added`);
			return;
		}
		if (selectedIds.has(item.id)) return;
		props.onChange([...props.value, item], { item, type: 'add' });
		setAnnouncement(`${item.label} added`);
	};

	const handleRemove = (item: T) => {
		props.onChange(props.value.filter((v) => v.id !== item.id), { item, type: 'remove' });
		setAnnouncement(`${item.label} removed`);
		inputHandle.current?.focus();
	};

	const handleClearAll = () => {
		if (props.value.length === 0) return;
		props.onChange([], { item: props.value[props.value.length - 1], type: 'remove' });
		inputHandle.current?.focus();
	};

	const handleKeyDown = (e: any) => {
		if (e.isComposing || e.keyCode === 229) return;
		if (e.key === 'Backspace' && lastQuery.current === '' && props.value.length > 0) {
			e.preventDefault();
			handleRemove(props.value[props.value.length - 1]);
		}
	};

	const handleQueryChange = (q: string) => {
		lastQuery.current = q;
		props.onChangeQuery?.(q);
	};

	// Focus-within tracking drives the overflow collapse. The dropdown options
	// never take focus (mousedown is prevented), so a real focusout means the
	// pointer/keyboard moved outside the field and the layer popover.
	const isFocusInTokenizer = (target: Node | null): boolean => {
		if (!target) return false;
		return Boolean(wrapperRef.current?.contains(target) || layerContentRef.current?.contains(target));
	};

	const openLayer = () => {
		setIsFocusedWithin(true);
		setLayerOpen(true);
		setTimeout(() => inputHandle.current?.focus(), 0);
	};

	const collapse = (e: any) => {
		const related = (e as FocusEvent).relatedTarget as Node | null;
		if (isFocusInTokenizer(related)) return;
		setIsFocusedWithin(false);
		setLayerOpen(false);
		props.onBlur?.();
	};

	const bindWrapper = (el: HTMLDivElement | null) => {
		wrapperRef.current = el;
		if (!el) return;
		applyEscapeProps(el, props);
		el.addEventListener('focusin', (e) => {
			const comingFromOutside = !isFocusInTokenizer(e.relatedTarget as Node | null);
			setIsFocusedWithin(true);
			if (isLayerMode) setLayerOpen(true);
			if (comingFromOutside) {
				props.onFocus?.();
				if (e.target !== inputHandle.current?.native) {
					inputHandle.current?.focus();
				}
			}
		});
		el.addEventListener('focusout', collapse);
	};

	const bindLayerContent = (el: HTMLElement | null) => {
		layerContentRef.current = el;
		if (!el) return;
		el.addEventListener('focusin', (e) => {
			if (!isFocusInTokenizer(e.relatedTarget as Node | null)) props.onFocus?.();
			setIsFocusedWithin(true);
		});
		el.addEventListener('focusout', collapse);
	};

	// Measure how many tokens are clipped by the single-line truncation.
	const measureOverflow = () => {
		const host = wrapperRef.current;
		if (!host) return;
		if (!isTruncated) {
			if (overflowCount !== 0) setOverflowCount(0);
			return;
		}
		const limit = host.clientWidth - (overflowRef.current?.offsetWidth ?? 0) - 8;
		let hidden = 0;
		for (const el of tokenEls.current.values()) {
			if (el.offsetLeft + el.offsetWidth > limit) hidden++;
		}
		setOverflowCount(hidden);
	};

	useEffect(measureOverflow, [isTruncated, props.value]);
	useEffect(() => {
		const host = wrapperRef.current;
		if (!isTruncated || !host || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(measureOverflow);
		ro.observe(host);
		return () => ro.disconnect();
	}, [isTruncated]);

	const startIcon = props.startIcon == null
		? null
		: typeof props.startIcon === 'string'
			? <Icon name={props.startIcon} size={16} className="vx-tokenizer-icon" />
			: props.startIcon;

	const tokens = props.value.map((item, i) => {
		const onRemoveItem = () => handleRemove(item);
		const body = props.renderToken
			? props.renderToken(item, onRemoveItem)
			: <Token
				label={item.label}
				size={size}
				onRemove={props.isDisabled ? undefined : onRemoveItem}
				isDisabled={props.isDisabled}
			/>;
		return <span
			key={item.id}
			className="vx-tokenizer-token"
			ref={(el: any) => { if (el) tokenEls.current.set(i, el); else tokenEls.current.delete(i); }}
		>{body}</span>;
	});

	const hasClearButton = Boolean(props.hasClear && props.value.length > 0 && !props.isDisabled);

	const wrapperClass = [
		'vx-tokenizer',
		`vx-tokenizer--size-${size}`,
		props.value.length > 0 ? 'vx-tokenizer--filled' : undefined,
		isTruncated ? 'vx-tokenizer--truncated' : undefined,
		props.isDisabled ? 'vx-tokenizer--disabled' : undefined,
		props.status ? `vx-tokenizer--status-${props.status.type}` : undefined,
	];

	const fieldControls = (
		<BusyLaneProvider value={busyLane}>
			<BaseTypeahead
				searchSource={isAtMax ? emptySource : filteredSource}
				value={null}
				onChange={handleAdd}
				renderItem={props.renderItem}
				// A space keeps :placeholder-shown usable without painting text
				// beside tokens.
				placeholder={props.value.length === 0 ? props.placeholder : ' '}
				hasEntriesOnFocus={isAtMax ? false : props.hasEntriesOnFocus}
				maxMenuItems={props.maxMenuItems}
				menuWidth={props.menuWidth}
				minQueryLength={props.minQueryLength}
				emptySearchResultsText={props.emptySearchResultsText}
				isDisabled={props.isDisabled}
				isFocusableDisabled={showsDisabledMessage}
				hasAutoFocus={props.hasAutoFocus}
				id={inputId}
				onChangeQuery={handleQueryChange}
				onKeyDown={handleKeyDown}
				__queryEntries={createEntries}
				debounceMs={props.debounceMs}
				anchorRef={{ current: wrapperRef.current }}
				size={size}
				isReadOnly={props.isReadOnly}
				inputClassName={isAtMax || isTruncated ? 'vx-tokenizer-input--atmax' : props.value.length > 0 ? 'vx-tokenizer-input--compact' : undefined}
				bind={(h: TypeaheadInputHandle) => { inputHandle.current = h; }}
			/>
		</BusyLaneProvider>
	);

	const hiddenInputs = props.htmlName != null
		? props.value.map((item) => (
			<input key={item.id} type="hidden" name={props.htmlName} value={item.id} disabled={props.isDisabled || undefined} />
		))
		: null;

	const clearButton = hasClearButton
		? <button type="button" className="vx-input-clear" aria-label="Clear all" onClick={(e: any) => { e.stopPropagation(); handleClearAll(); }}>{'×'}</button>
		: null;

	const wrapperContent = (
		<div
			ref={bindWrapper}
			className={wrapperClass}
			role="group"
			aria-label={props.label}
			onClick={() => { if (!props.isDisabled && !isLayerMode) inputHandle.current?.focus(); }}
		>
			{startIcon}
			{tokens}
			{isTruncated
				? <span ref={(el: any) => { overflowRef.current = el; }} className="vx-tokenizer-overflow">{overflowCount > 0 ? `+${overflowCount} more` : ''}</span>
				: null}
			{fieldControls}
			{hiddenInputs}
			<EndLane lane={busyLane} endContent={props.endContent} clear={clearButton} />
		</div>
	);

	let content = wrapperContent;
	if (isLayerMode) {
		// The truncated row is the anchor; the live field (with the input) is
		// always mounted inside the popover so opening can focus it directly.
		content = <>
			<div
				ref={bindWrapper}
				className={wrapperClass}
				role="group"
				aria-label={props.label}
				tabIndex={props.isDisabled ? undefined : 0}
				onClick={() => { if (!props.isDisabled) openLayer(); }}
				onFocus={() => { if (!props.isDisabled) openLayer(); }}
			>
				{isTruncated ? (
					<>
						{startIcon}
						{tokens}
						<span ref={(el: any) => { overflowRef.current = el; }} className="vx-tokenizer-overflow">{overflowCount > 0 ? `+${overflowCount} more` : ''}</span>
					</>
				) : null}
			</div>
			<Popover
				anchor={wrapperRef}
				open={layerOpen}
				placement="bottom"
				onDismiss={() => { setLayerOpen(false); setIsFocusedWithin(false); }}
				className="vx-tokenizer-layer"
				style={{ minWidth: wrapperRef.current?.clientWidth }}
			>
				<div ref={bindLayerContent}>
					{wrapperContent}
				</div>
			</Popover>
		</>;
	}

	<FormField
		id={props.id}
		label={props.label}
		isLabelHidden={props.isLabelHidden}
		description={props.description}
		inputID={inputId}
		isOptional={props.isOptional}
		isRequired={props.isRequired}
		isDisabled={props.isDisabled}
		isLoading={props.isLoading}
		isReadOnly={props.isReadOnly}
		status={props.status}
		statusVariant={props.statusVariant}
		labelTooltip={props.labelTooltip}
		size={size}
		className={props.className}
		style={{ ...(props.width != null ? { width: props.width } : {}), ...props.style }}
		web={props.web}
	>
		<>
			{showsDisabledMessage
				? <Tooltip trigger={content} content={props.disabledMessage} placement="top" />
				: content}
			<span className="vx-sr-only" role="status">{announcement}</span>
		</>
	</FormField>
}
