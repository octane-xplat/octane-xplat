/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo, useRef, useState, useSyncExternalStore, useId } from 'octane'
import type { SearchableItem, TypeaheadInputHandle, TypeaheadProps } from '../../props'
import { useSize } from '../layout/size-context'
import { cx } from '@octane-xplat/lib'
import { FormField } from './FormField.macos.tsrx'
import { useFieldControlProps } from './field-context'
import { BaseTypeahead } from './BaseTypeahead.macos.tsrx'
import { Token } from './Token.macos.tsrx'
import { ActivityIndicator } from '../actions/controls.macos.tsrx'
import { Icon } from '../media/Icon.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { Tooltip } from '../overlays/Tooltip.tsrx'
import { BusyLaneProvider, createBusyIndicatorLane, type BusyIndicatorLane } from '../../internal/rendering/busy-lane'

/** The field's inline-end lane: busy Spinner, then the clear button. */
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

/** AppKit search-as-you-type field with focus bootstrap and click selection.
 * Input-owned keyboard selection has a source path; native listbox AX remains incomplete.
 * The selected value uses a Token; disabledMessage uses the tooltip bridge. */
export function Typeahead<T extends SearchableItem>(inProps: TypeaheadProps<T>) @{
	const props = useFieldControlProps(inProps)
	const size = useSize(props.size, 'md')
	const inputId = useId()
	const inputHandle = useRef<TypeaheadInputHandle | null>(null)
	const wrapperAnchor = useRef<any>(null)

	const showsDisabledMessage = Boolean(props.isDisabled && props.disabledMessage)
	const busyLane = useMemo(() => createBusyIndicatorLane(), [])
	const [isEditing, setIsEditing] = useState(false)
	const showToken = props.value != null && !isEditing

	const enterEditMode = () => {
		if (props.isDisabled || props.isReadOnly || !props.value) {
			return
		}

		setIsEditing(true)
		inputHandle.current?.setQuery(props.value.label)
		inputHandle.current?.focus()
	}

	const handleWrapperTap = () => {
		if (props.isDisabled || props.isReadOnly) {
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
		if (props.isDisabled || props.isReadOnly) return
		setIsEditing(false)
		props.onChange(null)
		inputHandle.current?.focus()
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

	const wrapper = (
		<masonview
			ref={(v: any) => {
				wrapperAnchor.current = v
			}}
			className={cx(
				'vx-typeahead',
				`vx-typeahead--size-${size}`,
				props.isDisabled && 'vx-typeahead--disabled',
				props.status && `vx-typeahead--status-${props.status.type}`,
			)}
			onTap={handleWrapperTap}
			accessibilityState={{ disabled: props.isDisabled }}
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
						isFocusableDisabled={showsDisabledMessage}
						hasAutoFocus={props.hasAutoFocus}
						id={inputId}
						onChangeQuery={props.onChangeQuery}
						onOpenChange={props.onOpenChange}
						debounceMs={props.debounceMs}
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
					/>
				) : null}
			</masonview>
			<EndLane
				lane={busyLane}
				clear={
					props.hasClear !== false && props.value && !props.isDisabled && !props.isReadOnly ? (
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
	>
		{showsDisabledMessage ? (
			<Tooltip trigger={wrapper} content={props.disabledMessage} placement="top" />
		) : (
			wrapper
		)}
	</FormField>
}

export { BaseTypeahead } from './BaseTypeahead.macos.tsrx'
