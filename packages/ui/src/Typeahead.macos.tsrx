/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo, useRef, useState, useSyncExternalStore, useId } from 'octane';
import type { SearchableItem, TypeaheadInputHandle, TypeaheadProps } from "./props";
import { cx } from "./cx";
import { FormField } from './FormField.macos.tsrx';
import { BaseTypeahead } from './BaseTypeahead.macos.tsrx';
import { Token } from './Token.macos.tsrx';
import { ActivityIndicator } from './controls.macos.tsrx';
import { Icon } from './Icon.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { Tooltip } from './Tooltip.tsrx';
import { BusyLaneProvider, createBusyIndicatorLane, type BusyIndicatorLane } from './busy-lane';

/** The field's inline-end lane: busy Spinner, then the clear button. */
function EndLane(props: { lane: BusyIndicatorLane; clear?: any }) @{
	const isBusy = useSyncExternalStore(props.lane.subscribe, props.lane.getIsBusy);
	if (!isBusy && props.clear == null) return null;
	<flexboxlayout className="vx-typeahead-endlane" flexDirection="row" alignItems="center">
		{isBusy ? <flexboxlayout className="vx-typeahead-spinner"><ActivityIndicator busy={true} /></flexboxlayout> : null}
		{props.clear}
	</flexboxlayout>
}

/** Single-selection search-as-you-type field. macOS leaf: the AppKit
 *  textfield exposes no focus/return events, so the list opens when results
 *  exist and options are click-selected; the selected value still renders as
 *  a Token with click-to-edit and clear. `disabledMessage` surfaces through
 *  the AppKit tooltip bridge. */
export function Typeahead<T extends SearchableItem,>(props: TypeaheadProps<T>) @{
	const size = props.size ?? 'md';
	const inputId = useId();
	const inputHandle = useRef<TypeaheadInputHandle | null>(null);
	const wrapperAnchor = useRef<any>(null);

	const showsDisabledMessage = Boolean(props.isDisabled && props.disabledMessage);
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

	const startIcon = props.startIcon == null
		? null
		: typeof props.startIcon === 'string'
			? <Icon name={props.startIcon} size={16} />
			: props.startIcon;

	const wrapper = <flexboxlayout
		ref={(v: any) => { wrapperAnchor.current = v; }}
		className={cx(
			'vx-typeahead',
			`vx-typeahead--size-${size}`,
			props.isDisabled && 'vx-typeahead--disabled',
			props.status && `vx-typeahead--status-${props.status.type}`,
		)}
		flexDirection="row"
		alignItems="center"
		onTap={handleWrapperTap}
		accessibilityState={{ disabled: props.isDisabled }}
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
					hasAutoFocus={props.hasAutoFocus}
					id={inputId}
					onChangeQuery={props.onChangeQuery}
					onOpenChange={props.onOpenChange}
					debounceMs={props.debounceMs}
					size={size}
					isReadOnly={props.isReadOnly}
					bind={(h: TypeaheadInputHandle) => {
						inputHandle.current = h;
						props.bind?.(h);
					}}
				/>
			</BusyLaneProvider>
			{showToken && props.value
				? <Token
					label={props.value.label}
					size={size}
					onClick={enterEditMode}
					isDisabled={props.isDisabled}
					className="vx-typeahead-token"
				/>
				: null}
		</gridlayout>
		<EndLane
			lane={busyLane}
			clear={props.hasClear !== false && props.value && !props.isDisabled
				? <Pressable className="vx-input-clear" accessibilityLabel="Clear selection" onPress={handleClear}><label text="×" /></Pressable>
				: null}
		/>
	</flexboxlayout>;

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
	>
		{showsDisabledMessage
			? <Tooltip trigger={wrapper} content={props.disabledMessage} placement="top" />
			: wrapper}
	</FormField>
}
