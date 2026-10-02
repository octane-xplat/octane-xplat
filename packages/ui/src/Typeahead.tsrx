/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useRef, useState, useSyncExternalStore, useId } from 'octane';
import type { SearchableItem, TypeaheadInputHandle, TypeaheadProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { FormField } from './FormField';
import { BaseTypeahead } from './BaseTypeahead';
import { Token } from './Token';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { Icon } from './Icon';
import { Pressable } from './Pressable';
import { BusyLaneProvider, createBusyIndicatorLane, type BusyIndicatorLane } from './busy-lane';

/** The field's inline-end lane: busy Spinner, then the clear button. A leaf
 *  subscribing to the lane re-renders only itself per search transition. */
function EndLane(props: { lane: BusyIndicatorLane; clear?: any }) @{
	const isBusy = useSyncExternalStore(props.lane.subscribe, props.lane.getIsBusy);
	if (!isBusy && props.clear == null) return null;

	<flexboxlayout className="vx-typeahead-endlane" flexDirection="row" alignItems="center">
		{isBusy ? <flexboxlayout className="vx-typeahead-spinner"><ActivityIndicator busy={true} /></flexboxlayout> : null}
		{props.clear}
	</flexboxlayout>
}

/** Single-selection search-as-you-type field: Field chrome + input wrapper +
 *  a Token over the input while a value is selected. Tapping the token or
 *  wrapper enters edit mode (input repopulated with the label); leaving the
 *  field without selecting restores the token. */
export function Typeahead<T extends SearchableItem,>(props: TypeaheadProps<T>) @{
	const size = props.size ?? 'md';
	const inputId = useId();
	const inputHandle = useRef<TypeaheadInputHandle | null>(null);
	const tokenRef = useRef<any>(null);
	const wrapperAnchor = useRef<any>(null);

	const busyLane = useMemo(() => createBusyIndicatorLane(), []);
	const [isEditing, setIsEditing] = useState(false);
	const showToken = props.value != null && !isEditing;

	const enterEditMode = () => {
		if (props.isDisabled || !props.value) return;
		setIsEditing(true);
		props.onChangeQuery?.(props.value.label);
		inputHandle.current?.setQuery(props.value.label);
		inputHandle.current?.focus();
	};

	const handleWrapperTap = () => {
		if (props.isDisabled) return;
		if (showToken) enterEditMode();
		else inputHandle.current?.focus();
	};

	const handleChange = (item: T | null) => {
		setIsEditing(false);
		props.onChange(item);
	};

	const handleClear = () => {
		setIsEditing(false);
		props.onChange(null);
		inputHandle.current?.focus();
	};

	// Focus leaving the input mid-edit restores the token.
	const handleInputBlur = () => {
		if (isEditing) setIsEditing(false);
	};

	const startIcon = props.startIcon == null
		? null
		: typeof props.startIcon === 'string'
			? <Icon name={props.startIcon} size={16} />
			: props.startIcon;

	const forwardedRef = useMemo(() => [(h: TypeaheadInputHandle | null) => {
							inputHandle.current = h;
						}, props.ref], [props.ref, props.ios, props.android, props.web]);

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
		ios={props.ios}
		android={props.android}
	>
		<flexboxlayout
			ref={(v: any) => {
				wrapperAnchor.current = v;
				if (v) applyEscapeProps(v, props);
			}}
			className={cx(
				'vx-typeahead',
				`vx-typeahead--size-${size}`,
				props.isDisabled && 'vx-typeahead--disabled',
				props.status && `vx-typeahead--status-${props.status.type}`,
			)}
			flexDirection="row"
			alignItems="center"
			onTap={handleWrapperTap}
			accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
		>
			{startIcon}
			<gridlayout className="vx-typeahead-content" flexGrow={1}>
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
						isFocusableDisabled={Boolean(props.isDisabled && props.disabledMessage)}
						hasAutoFocus={props.hasAutoFocus}
						id={inputId}
						onChangeQuery={props.onChangeQuery}
						onOpenChange={props.onOpenChange}
						debounceMs={props.debounceMs}
						anchorRef={wrapperAnchor}
						onBlur={handleInputBlur}
						size={size}
						isReadOnly={props.isReadOnly}
						ref={forwardedRef}
					/>
				</BusyLaneProvider>
				{showToken && props.value
					? <Token
						label={props.value.label}
						size={size}
						onClick={enterEditMode}
						isDisabled={props.isDisabled}
						className="vx-typeahead-token"
						ref={(v: any) => { tokenRef.current = v; }}
					/>
					: null}
			</gridlayout>
			<EndLane
				lane={busyLane}
				clear={props.hasClear !== false && props.value && !props.isDisabled
					? <Pressable className="vx-input-clear" accessibilityLabel="Clear selection" onPress={handleClear}><label text="×" /></Pressable>
					: null}
			/>
		</flexboxlayout>
	</FormField>
}
