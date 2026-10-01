import { useMemo, useRef, useState, useSyncExternalStore, useId } from 'octane';
import type { SearchableItem, TypeaheadInputHandle, TypeaheadProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { FormField } from './FormField.web.tsrx';
import { BaseTypeahead } from './BaseTypeahead.web.tsrx';
import { Token } from './Token.web.tsrx';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { Tooltip } from './Tooltip.web.tsrx';
import { BusyLaneProvider, createBusyIndicatorLane, type BusyIndicatorLane } from './busy-lane';

/** The field's inline-end lane: busy Spinner, then the clear button. A leaf
 *  subscribing to the lane re-renders only itself per search transition. */
function EndLane(props: { lane: BusyIndicatorLane; clear?: any }) @{
	const isBusy = useSyncExternalStore(props.lane.subscribe, props.lane.getIsBusy);
	if (!isBusy && props.clear == null) return null;
	<div className="vx-typeahead-endlane">
		{isBusy ? <span className="vx-typeahead-spinner" role="status" aria-label="Loading"><ActivityIndicator busy={true} /></span> : null}
		{props.clear}
	</div>
}

/** Single-selection search-as-you-type field: Field chrome + input wrapper +
 *  a Token painted over the input while a value is selected. Clicking the
 *  token or wrapper enters edit mode (input repopulated with the label);
 *  blur or Escape without a selection restores the token. */
export function Typeahead<T extends SearchableItem,>(props: TypeaheadProps<T>) @{
	const size = props.size ?? 'md';
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const inputHandle = useRef<TypeaheadInputHandle | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const tokenRef = useRef<HTMLElement | null>(null);
	const wrapperAnchor = useRef<any>(null);

	const showsDisabledMessage = Boolean(props.isDisabled && props.disabledMessage);
	const busyLane = useMemo(() => createBusyIndicatorLane(), []);
	const [isEditing, setIsEditing] = useState(false);
	const [editingValue, setEditingValue] = useState<T | null>(null);

	const showToken = props.value != null && !isEditing;

	const enterEditMode = () => {
		if (props.isDisabled || !props.value) return;
		setEditingValue(props.value);
		setIsEditing(true);
		props.onChangeQuery?.(props.value.label);
		// The base owns its query state; setQuery pushes the label through the
		// same search pipeline as a typed query.
		inputHandle.current?.setQuery(props.value.label);
		inputHandle.current?.focus();
		const el = inputHandle.current?.native as HTMLInputElement | null;
		el?.setSelectionRange?.(0, el.value.length);
	};

	const restoreToken = () => {
		setIsEditing(false);
		setEditingValue(null);
	};

	const handleWrapperClick = () => {
		if (props.isDisabled) return;
		if (showToken) enterEditMode();
		else inputHandle.current?.focus();
	};

	// Blur out of the whole field restores the token when no selection was made.
	const handleWrapperBlur = (e: any) => {
		if (wrapperRef.current?.contains(e.relatedTarget)) return;
		if (isEditing && editingValue) restoreToken();
	};

	const handleChange = (item: T | null) => {
		restoreToken();
		props.onChange(item);
		if (item) {
			// Keep keyboard users inside the component: focus the token's inner
			// button once it renders.
			setTimeout(() => {
				const tokenEl = tokenRef.current;
				(tokenEl?.querySelector('button') ?? tokenEl)?.focus?.();
			}, 0);
		}
	};

	const handleClear = (e: any) => {
		e?.stopPropagation?.();
		restoreToken();
		props.onChange(null);
		inputHandle.current?.focus();
	};

	// BaseTypeahead forwards keydowns here before its own navigation.
	const handleKeyDown = (e: any) => {
		if (e.isComposing || e.keyCode === 229) return;
		if (e.key === 'Escape' && editingValue) {
			e.preventDefault();
			restoreToken();
			inputHandle.current?.blur();
		}
	};

	const startIcon = props.startIcon == null
		? null
		: typeof props.startIcon === 'string'
			? <Icon name={props.startIcon} size={16} className="vx-typeahead-icon" />
			: props.startIcon;

	const wrapper = (
		<div
			ref={(el: any) => {
				wrapperRef.current = el;
				wrapperAnchor.current = el;
				if (el) applyEscapeProps(el, props);
			}}
			className={[
				'vx-typeahead',
				`vx-typeahead--size-${size}`,
				props.isDisabled ? 'vx-typeahead--disabled' : undefined,
				props.status ? `vx-typeahead--status-${props.status.type}` : undefined,
			]}
			onClick={handleWrapperClick}
			onBlur={handleWrapperBlur}
		>
			{startIcon}
			<div className="vx-typeahead-content">
				{showToken && props.value
					? <Token
						label={props.value.label}
						size={size}
						onClick={enterEditMode}
						isDisabled={props.isDisabled}
						className="vx-typeahead-token"
						bind={(el: any) => { tokenRef.current = el; }}
					/>
					: null}
				<BusyLaneProvider value={busyLane}>
					<BaseTypeahead
						searchSource={props.searchSource}
						value={props.value}
						onChange={handleChange}
						renderItem={props.renderItem}
						placeholder={showToken ? undefined : props.placeholder}
						hasEntriesOnFocus={props.hasEntriesOnFocus}
						maxMenuItems={props.maxMenuItems}
						minQueryLength={props.minQueryLength}
						emptySearchResultsText={props.emptySearchResultsText}
						isDisabled={props.isDisabled}
						isFocusableDisabled={showsDisabledMessage}
						hasAutoFocus={props.hasAutoFocus}
						id={inputId}
						onChangeQuery={props.onChangeQuery}
						onOpenChange={props.onOpenChange}
						debounceMs={props.debounceMs}
						anchorRef={wrapperAnchor}
						onKeyDown={handleKeyDown}
						inputClassName={showToken ? 'vx-typeahead-input--hidden' : undefined}
						size={size}
						isReadOnly={props.isReadOnly}
						bind={(h: TypeaheadInputHandle) => {
							inputHandle.current = h;
							inputRef.current = h?.native ?? null;
							props.bind?.(h);
						}}
					/>
				</BusyLaneProvider>
			</div>
			<EndLane
				lane={busyLane}
				clear={props.hasClear !== false && props.value && !props.isDisabled
					? <button type="button" className="vx-input-clear" aria-label="Clear selection" onClick={handleClear}>{'×'}</button>
					: null}
			/>
		</div>
	);

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
		{showsDisabledMessage
			? <Tooltip trigger={wrapper} content={props.disabledMessage} placement="top" />
			: wrapper}
	</FormField>
}
