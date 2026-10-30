/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'
import { createAppKitAutoFocus } from '../../internal/accessibility/auto-focus.macos'
import { useFieldControlProps } from './field-context'
import type { PowerSearchHandle, TextInputHandle } from '../../props'
import { useSize } from '../layout/size-context'
import type { PowerSearchViewProps } from './power-search-view'
import { SearchInput } from '../actions/controls.macos.tsrx'
import { Icon } from '../media/Icon.macos.tsrx'
import { Button } from '../actions/controls.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { Popover } from '../overlays/Popover.macos.tsrx'
import { PowerSearchToken } from './PowerSearchToken.macos.tsrx'
import { PowerSearchFilterEditor } from './PowerSearchFilterEditor.macos.tsrx'
import { powerSearchTranslate } from './power-search-strings'
import { cx } from '@octane-xplat/lib'

// The public handle uses a platform-neutral native type. Inspect the AppKit
// control boundary before passing it to the native request owner.
function appKitInput(view: unknown): view is NSView {
	return (
		typeof view === 'object' &&
		view !== null &&
		'window' in view &&
		typeof Reflect.get(view, 'currentEditor') === 'function'
	)
}

export function PowerSearchView(inProps: PowerSearchViewProps) @{
	const props = useFieldControlProps(inProps)
	const live = useRef(props)
	live.current = props
	const size = useSize(props.size, 'md')
	const anchor = useRef<NSView | null>(null)
	const inputHandle = useRef<TextInputHandle | null>(null)
	const autoFocus = useMemo(
		() =>
			createAppKitAutoFocus({
				requested: () => !!live.current.hasAutoFocus,
				blocked: () =>
					!!live.current.isDisabled ||
					!!live.current.isReadOnly ||
					!!live.current.isLoading ||
					!!live.current.editing,
			}),
		[],
	)

	const bindAnchor = useCallback((view: NSView | null) => {
		anchor.current = view
		if (!view) {
			autoFocus.bind(null)
		}
	}, [])

	const bindInput = useCallback((handle: TextInputHandle | null) => {
		inputHandle.current = handle
		const native = handle?.native
		autoFocus.bind(appKitInput(native) ? native : null)
		autoFocus.update()
	}, [])

	useLayoutEffect(() => {
		const native = inputHandle.current?.native
		autoFocus.bind(anchor.current && appKitInput(native) ? native : null)
		autoFocus.update()
	}, null)

	useEffect(() => () => autoFocus.dispose(), [])
	const handle = useMemo<PowerSearchHandle>(
		() => ({
			focusTypeahead() {
				if (anchor.current && !live.current.isDisabled && !live.current.editing) {
					inputHandle.current?.focus()
				}
			},
			blurTypeahead() {
				if (anchor.current) {
					inputHandle.current?.blur()
				}
			},
		}),
		[],
	)

	const { query, editing, results, internal } = props
	const Suggestion: any = Pressable
	const status = props.status
	useEffect(() => {
		props.handleRef?.(handle)
	}, [props.handleRef])

	const Editor: any = editing
		? (props.components?.[
				internal.getOperator(editing.filter.field, editing.filter.operator ?? '')?.value.type ??
					'string'
			]?.Editor ?? PowerSearchFilterEditor)
		: PowerSearchFilterEditor

	<masonview
		id={props.id}
		className={cx(
			'vx-power-search',
			`vx-power-search--size-${size}`,
			props.isDisabled && 'vx-power-search--disabled',
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		ref={bindAnchor}
	>
		<masonview className="vx-power-search-row" style={{ display: 'flex' }}>
			{props.startIcon ? (
				typeof props.startIcon === 'string' ? (
					<Icon className="vx-power-search-start-icon" name={props.startIcon} />
				) : (
					props.startIcon
				)
			) : null}
			{props.filters.map((filter, index) => {
				const field = internal.getField(filter.field),
					operator = internal.getOperator(filter.field, filter.operator)

				if (!field || !operator) {
					return null
				}

				const Token = props.components?.[filter.value.type]?.Token ?? PowerSearchToken
				return (
					<Token
						key={`${filter.field}-${index}`}
						config={props.config}
						filter={filter}
						field={field}
						operator={operator}
						maxLength={props.maxTokenLength ?? 40}
						timezoneID={props.timezoneID}
						onPress={() => !props.isReadOnly && props.onEdit(filter, index)}
						onRemove={props.isReadOnly ? undefined : () => props.onRemove(index)}
						isDisabled={props.isDisabled || props.isReadOnly}
					/>
				)
			})}
			<SearchInput
				ref={bindInput}
				className="vx-power-search-input"
				value={query}
				placeholder={props.placeholder ?? powerSearchTranslate('@astryx.powersearch.placeholder')}
				onChange={props.onQueryChange}
				onFocus={props.onInputFocus}
				onBlur={props.onBlur}
				isDisabled={props.isDisabled}
				isReadOnly={props.isReadOnly}
				isLoading={props.isLoading}
				description={props.disabledMessage}
				hasClear={false}
				accessibilityLabel={props.label ?? 'Search'}
			/>
			{props.resultCount != null ? (
				<label
					className="vx-power-search-count"
					accessibilityLiveRegion={'polite'}
					text={String(props.resultCount)}
				/>
			) : null}
			{props.endContent}
			{props.hasClear !== false && props.filters.length > 0 ? (
				<Button
					label="Clear"
					variant="ghost"
					clickAction={props.onClear}
					isDisabled={props.isDisabled}
				/>
			) : null}
		</masonview>
		<Popover
			anchor={anchor}
			open={props.suggestionsOpen}
			placement="bottom"
			onDismiss={() => props.onDismiss()}
			className="vx-power-search-results"
			style={props.menuWidth ? { width: props.menuWidth } : undefined}
		>
			<masonview className="vx-power-search-result-list" style={{ display: 'flex' }}>
				{results.map((item: any) => (
					<Suggestion
						key={item.id}
						className="vx-power-search-result"
						onPress={() => props.onChoose(item)}
					>
						<label text={item.label} />
					</Suggestion>
				))}
				{results.length === 0 ? (
					<label className="vx-power-search-empty" text="No results" />
				) : null}
			</masonview>
		</Popover>
		<Popover
			anchor={anchor}
			open={!!editing}
			placement="bottom"
			onDismiss={() => props.onCancel()}
			className="vx-power-search-edit"
		>
			{editing ? (
				<Editor
					config={props.config}
					filter={editing.filter}
					mode={editing.index < 0 ? 'create' : 'edit'}
					onSave={props.onSave}
					onCancel={() => props.onCancel()}
					saveButtonLabel={props.popoverSaveButtonLabel}
					isReadOnly={
						props.isReadOnly || props.isDisabled || props.isLoading || editing.filter.isReadOnly
					}
					timezoneID={props.timezoneID}
				/>
			) : null}
		</Popover>
		{status?.message ? (
			<label
				className={cx(
					'vx-power-search-status',
					`vx-power-search-status--${status.type}`,
					`vx-power-search-status--${props.statusVariant ?? 'attached'}`,
				)}
				text={status.message}
			/>
		) : null}
	</masonview>
}
