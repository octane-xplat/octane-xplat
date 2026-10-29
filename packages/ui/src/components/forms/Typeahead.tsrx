/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo, useRef, useState, useSyncExternalStore, useId } from 'octane'
import type { SearchableItem, TypeaheadInputHandle, TypeaheadProps } from '../../props'
import { useSize } from '../layout/size-context'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { FormField } from './FormField'
import { BaseTypeahead } from './BaseTypeahead'
import { Token } from './Token'
import { ActivityIndicator } from '../feedback/ActivityIndicator.tsrx'
import { Icon } from '../media/Icon'
import { Pressable } from '../actions/Pressable'
import { BusyLaneProvider, createBusyIndicatorLane, type BusyIndicatorLane } from '../../internal/rendering/busy-lane'

/** The field's inline-end lane: busy Spinner, then the clear button. A leaf
 *  subscribing to the lane re-renders only itself per search transition. */
function EndLane(props: { lane: BusyIndicatorLane; clear?: any }) @{
	const isBusy = useSyncExternalStore(props.lane.subscribe, props.lane.getIsBusy)
	if (!isBusy && props.clear == null) {
		return null
	}

	<masonview
		className="vx-typeahead-endlane"
		style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
	>
		{isBusy ? (
			<masonview className="vx-typeahead-spinner" style={{ display: 'flex' }}>
				<ActivityIndicator busy={true} />
			</masonview>
		) : null}
		{props.clear}
	</masonview>
}

/** Single-selection search-as-you-type field: Field chrome + input wrapper +
 *  a Token over the input while a value is selected. Tapping the token or
 *  wrapper enters edit mode (input repopulated with the label); leaving the
 *  field without selecting restores the token. */
export function Typeahead<T extends SearchableItem>(props: TypeaheadProps<T>) @{
	const size = useSize(props.size, 'md')
	const inputId = useId()
	const inputHandle = useRef<TypeaheadInputHandle | null>(null)
	const tokenRef = useRef<any>(null)
	const wrapperAnchor = useRef<any>(null)

	const busyLane = useMemo(() => createBusyIndicatorLane(), [])
	const [isEditing, setIsEditing] = useState(false)
	const showToken = props.value != null && !isEditing

	const enterEditMode = () => {
		if (props.isDisabled || !props.value) {
			return
		}

		setIsEditing(true)
		props.onChangeQuery?.(props.value.label)
		inputHandle.current?.setQuery(props.value.label)
		inputHandle.current?.focus()
	}

	const handleWrapperTap = () => {
		if (props.isDisabled) {
			return
		}

		if (showToken) {
			enterEditMode()
		} else {
			inputHandle.current?.focus()
		}
	}

	const handleChange = (item: T | null) => {
		setIsEditing(false)
		props.onChange(item)
	}

	const handleClear = () => {
		setIsEditing(false)
		props.onChange(null)
		inputHandle.current?.focus()
	}

	// Focus leaving the input mid-edit restores the token.
	const handleInputBlur = () => {
		if (isEditing) {
			setIsEditing(false)
		}
	}

	const startIcon =
		props.startIcon == null ? null : typeof props.startIcon === 'string' ? (
			<Icon name={props.startIcon} size={16} />
		) : (
			props.startIcon
		)

	const forwardedRef = useMemo(
		() => [
			(h: TypeaheadInputHandle | null) => {
				inputHandle.current = h
			},
			props.ref,
		],
		[props.ref, props.ios, props.android, props.web],
	)

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
		style={{ ...(props.width != null ? { width: props.width } : {}), ...styleRecord(props.style) }}
		ios={props.ios}
		android={props.android}
	>
		<masonview
			ref={(v: any) => {
				wrapperAnchor.current = v
				if (v) {
					applyEscapeProps(v, props)
				}
			}}
			className={cx(
				'vx-typeahead',
				`vx-typeahead--size-${size}`,
				props.isDisabled && 'vx-typeahead--disabled',
				props.status && `vx-typeahead--status-${props.status.type}`,
			)}
			onTap={handleWrapperTap}
			accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
			style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
		>
			{startIcon}
			<masonview
				className="vx-typeahead-content"
				style={mergeStyle({ flexGrow: 1 }, { display: 'grid' })}
			>
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
				{showToken && props.value ? (
					<Token
						label={props.value.label}
						size={size}
						onClick={enterEditMode}
						isDisabled={props.isDisabled}
						className="vx-typeahead-token"
						ref={(v: any) => {
							tokenRef.current = v
						}}
					/>
				) : null}
			</masonview>
			<EndLane
				lane={busyLane}
				clear={
					props.hasClear !== false && props.value && !props.isDisabled ? (
						<Pressable
							className="vx-input-clear"
							accessibilityLabel="Clear selection"
							onPress={handleClear}
						>
							<label text="×" />
						</Pressable>
					) : null
				}
			/>
		</masonview>
	</FormField>
}
