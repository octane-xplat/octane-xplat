/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'octane';
import type { SearchableItem, SearchSource, TokenizerProps, TypeaheadInputHandle } from "./props";
import { cx } from "./cx";
import { FormField } from './FormField';
import { BaseTypeahead } from './BaseTypeahead';
import { Token } from './Token';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { Icon } from './Icon';
import { Pressable } from './Pressable';
import { Popover } from './Popover';
import { BusyLaneProvider, createBusyIndicatorLane, type BusyIndicatorLane } from './busy-lane';

const CREATABLE_ID_PREFIX = '__xds_create__';

function EndLane(props: { lane: BusyIndicatorLane; endContent?: any; clear?: any; laneRef?: (v: any) => void }) @{
	const isBusy = useSyncExternalStore(props.lane.subscribe, props.lane.getIsBusy);
	if (!isBusy && props.endContent == null && props.clear == null) return null;

	<flexboxlayout className="vx-tokenizer-endlane" flexDirection="row" alignItems="center" ref={props.laneRef}>
		{isBusy ? <flexboxlayout className="vx-typeahead-spinner"><ActivityIndicator busy={true} /></flexboxlayout> : null}
		{props.endContent}
		{props.clear}
	</flexboxlayout>
}

/** Multi-select field: Token chips + a BaseTypeahead input. Native leaf —
 *  Backspace-removes-last-token needs key events native text fields don't
 *  emit, so removal is the token ✕ (and the clear-all lane); truncation is
 *  measured off native layout (`layoutChanged`), not ResizeObserver. */
export function Tokenizer<T extends SearchableItem,>(props: TokenizerProps<T>) @{
	const size = props.size ?? 'md';
	const inputHandle = useRef<TypeaheadInputHandle | null>(null);
	const wrapperRef = useRef<any>(null);
	const laneRef = useRef<any>(null);
	const overflowRef = useRef<any>(null);
	const tokenEls = useRef(new Map<number, any>());

	const busyLane = useMemo(() => createBusyIndicatorLane(), []);
	const [isFocusedWithin, setIsFocusedWithin] = useState(false);
	const [layerOpen, setLayerOpen] = useState(false);
	const [overflowCount, setOverflowCount] = useState(0);

	const tokenOverflowBehavior = props.tokenOverflowBehavior ?? 'none';
	const isLayerMode = tokenOverflowBehavior === 'unfocusedLayer';
	const isTruncated = !isFocusedWithin && tokenOverflowBehavior !== 'none' && props.value.length > 0;
	const isAtMax = props.maxEntries != null && props.value.length >= props.maxEntries;

	const handle = {
		focus: () => {
			if (isLayerMode) setLayerOpen(true);
			inputHandle.current?.focus();
		},
		blur: () => {
			inputHandle.current?.blur();
			setLayerOpen(false);
			setIsFocusedWithin(false);
		},
		native: wrapperRef.current,
	};

	useImperativeHandle(props.ref, () => ({ ...handle, native: wrapperRef.current }), [props.ref]);

	const selectedIds = useMemo(
		() => new Set(props.value.map((item) => item.id)),
		[props.value],
	);

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
			return;
		}

		if (selectedIds.has(item.id)) return;
		props.onChange([...props.value, item], { item, type: 'add' });
	};

	const handleRemove = (item: T) => {
		props.onChange(props.value.filter((v) => v.id !== item.id), { item, type: 'remove' });
		inputHandle.current?.focus();
	};

	const handleClearAll = () => {
		if (props.value.length === 0) return;
		props.onChange([], { item: props.value[props.value.length - 1], type: 'remove' });
		inputHandle.current?.focus();
	};

	// Collapse when the input's focus leaves the field. Removing a token
	// refocuses the input, so a delayed collapse lets that refocus win.
	const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const collapseSoon = () => {
		if (blurTimer.current) clearTimeout(blurTimer.current);
		blurTimer.current = setTimeout(() => {
			setIsFocusedWithin(false);
			setLayerOpen(false);
			props.onBlur?.();
		}, 50);
	};

	const focusEntered = () => {
		if (blurTimer.current) { clearTimeout(blurTimer.current); blurTimer.current = null; }
		setIsFocusedWithin(true);
		if (isLayerMode) setLayerOpen(true);
		props.onFocus?.();
	};

	useEffect(() => () => { if (blurTimer.current) clearTimeout(blurTimer.current); }, []);
	useImperativeHandle(props.ref, () => ({ focus: () => inputHandle.current?.focus(), blur: () => inputHandle.current?.blur(), native: wrapperRef.current }), [props.ref]);

	// Count tokens clipped by the single-line truncation — measured off the
	// real layout: a token is hidden when its right edge passes the wrapper's
	// usable width (minus the end lane and the "+N more" counter).
	const measureOverflow = () => {
		const host = wrapperRef.current;
		if (!host) return;
		if (!isTruncated) {
			if (overflowCount !== 0) setOverflowCount(0);
			return;
		}

		const hostWidth = host.getActualSize?.().width ?? 0;
		const reserve =
			(laneRef.current?.getActualSize?.().width ?? 0) +
			(overflowRef.current?.getActualSize?.().width ?? 0) + 16;

		let hidden = 0;
		for (const v of tokenEls.current.values()) {
			const loc = v.getLocationRelativeTo?.(host);
			const w = v.getActualSize?.().width ?? 0;
			if (loc && loc.x + w > hostWidth - reserve) hidden++;
		}

		if (hidden !== overflowCount) setOverflowCount(hidden);
	};

	useEffect(() => {
		// The layout pass hasn't run yet when value/isTruncated change — wait a
		// tick so getActualSize reflects the new token set.
		const t = setTimeout(measureOverflow, 0);
		return () => clearTimeout(t);
	}, [isTruncated, props.value]);

	const startIcon = props.startIcon == null
		? null
		: typeof props.startIcon === 'string'
			? <Icon name={props.startIcon} size={16} />
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

		return <flexboxlayout
			key={item.id}
			className="vx-tokenizer-token"
			ref={(v: any) => { if (v) tokenEls.current.set(i, v); else tokenEls.current.delete(i); }}
		>{body}</flexboxlayout>;
	});

	const hasClearButton = Boolean(props.hasClear && props.value.length > 0 && !props.isDisabled);

	const wrapperClass = cx(
		'vx-tokenizer',
		`vx-tokenizer--size-${size}`,
		props.value.length > 0 && 'vx-tokenizer--filled',
		isTruncated && 'vx-tokenizer--truncated',
		props.isDisabled && 'vx-tokenizer--disabled',
		props.status && `vx-tokenizer--status-${props.status.type}`,
	);

	const fieldControls = (
		<BusyLaneProvider value={busyLane}>
			<BaseTypeahead
				searchSource={isAtMax ? emptySource : filteredSource}
				value={null}
				onChange={handleAdd}
				renderItem={props.renderItem}
				placeholder={props.value.length === 0 ? props.placeholder : undefined}
				hasEntriesOnFocus={isAtMax ? false : props.hasEntriesOnFocus}
				maxMenuItems={props.maxMenuItems}
				menuWidth={props.menuWidth}
				minQueryLength={props.minQueryLength}
				emptySearchResultsText={props.emptySearchResultsText}
				isDisabled={props.isDisabled}
				hasAutoFocus={props.hasAutoFocus}
				onChangeQuery={props.onChangeQuery}
				__queryEntries={createEntries}
				debounceMs={props.debounceMs}
					anchorRef={{ current: wrapperRef.current }}
				size={size}
				isReadOnly={props.isReadOnly}
				inputClassName={isAtMax || isTruncated ? 'vx-tokenizer-input--atmax' : props.value.length > 0 ? 'vx-tokenizer-input--compact' : undefined}
				onFocus={focusEntered}
				onBlur={collapseSoon}
				ref={(h: TypeaheadInputHandle) => { inputHandle.current = h; }}
			/>
		</BusyLaneProvider>
	);

	const clearButton = hasClearButton
		? <Pressable className="vx-input-clear" accessibilityLabel="Clear all" onPress={handleClearAll}><label text="×" /></Pressable>
		: null;

	const truncatedRow = (
		<flexboxlayout
			className={wrapperClass}
			flexDirection="row"
			alignItems="center"
			flexWrap="nowrap"
			ref={(v: any) => { wrapperRef.current = v; }}
			onLayoutChanged={measureOverflow}
			onTap={() => { if (!props.isDisabled) inputHandle.current?.focus(); }}
			accessibilityState={{ disabled: props.isDisabled } as any}
		>
			{startIcon}
			{tokens}
			{isTruncated
				? <label ref={(v: any) => { overflowRef.current = v; }} className="vx-tokenizer-overflow" text={overflowCount > 0 ? `+${overflowCount} more` : ''} />
				: null}
		</flexboxlayout>
	);

	let content: any;
	if (isLayerMode) {
		// The collapsed row anchors the popover; the full field lives inside it.
		content = <>
			<flexboxlayout
				className={wrapperClass}
				flexDirection="row"
				alignItems="center"
				flexWrap="nowrap"
				ref={(v: any) => { wrapperRef.current = v; }}
				onLayoutChanged={measureOverflow}
				onTap={() => { if (!props.isDisabled) focusEntered(); }}
				accessibilityState={{ disabled: props.isDisabled } as any}
			>
				{startIcon}
				{tokens}
				<label ref={(v: any) => { overflowRef.current = v; }} className="vx-tokenizer-overflow" text={overflowCount > 0 ? `+${overflowCount} more` : ''} />
			</flexboxlayout>
			<Popover
			anchor={{ current: wrapperRef.current }}
				open={layerOpen}
				placement="bottom"
				onDismiss={collapseSoon}
				className="vx-tokenizer-layer"
			>
				<flexboxlayout className="vx-tokenizer" flexDirection="row" alignItems="center" flexWrap="wrap">
					{startIcon}
					{tokens}
					{fieldControls}
					<EndLane lane={busyLane} endContent={props.endContent} clear={clearButton} laneRef={(v: any) => { laneRef.current = v; }} />
				</flexboxlayout>
			</Popover>
		</>;
	} else {
		content = <flexboxlayout
			className={wrapperClass}
			flexDirection="row"
			alignItems="center"
			flexWrap={isTruncated ? 'nowrap' : 'wrap'}
			ref={(v: any) => { wrapperRef.current = v; }}
			onLayoutChanged={measureOverflow}
			onTap={() => { if (!props.isDisabled) inputHandle.current?.focus(); }}
			accessibilityState={{ disabled: props.isDisabled } as any}
		>
			{startIcon}
			{tokens}
			{isTruncated
				? <label ref={(v: any) => { overflowRef.current = v; }} className="vx-tokenizer-overflow" text={overflowCount > 0 ? `+${overflowCount} more` : ''} />
				: null}
			{fieldControls}
			<EndLane lane={busyLane} endContent={props.endContent} clear={clearButton} laneRef={(v: any) => { laneRef.current = v; }} />
		</flexboxlayout>;
	}

	<FormField
		id={props.id}
		label={props.label}
		isLabelHidden={props.isLabelHidden}
		description={props.description}
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
	>
		{content}
	</FormField>
}
