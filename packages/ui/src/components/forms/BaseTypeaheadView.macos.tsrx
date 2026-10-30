/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'octane'
import type { NSTextField, NSView } from '@octane-xplat/platform/macos'
import { appKitTextChange } from '../../internal/platform/appkit-events.macos'
import type { SearchableItem } from '../../props'
import type { BaseTypeaheadViewProps } from './typeahead-view'
import { cx } from '@octane-xplat/lib'
import { TypeaheadResults } from './TypeaheadResults.macos.tsrx'
import { appKitTypeaheadOwnsFocus } from './typeahead-layer.macos'
import { TypeaheadItem } from './TypeaheadItem.macos.tsrx'
import { ActivityIndicator } from '../actions/controls.macos.tsrx'
import { BusyLaneContext } from '../../internal/rendering/busy-lane'
import { groupTypeaheadItems } from './typeahead-source'
import { createAppKitTypeaheadKeys } from './typeahead-keys.macos'
import { createAppKitTypeaheadAccessibility } from './typeahead-accessibility.macos'

/** AppKit presentation with stable input attachment and field-leave blur.
 * Keyboard intents retain input focus; AX roles/links follow pending highlight.
 * Native accessibility behavior and announcements remain unqualified. */
export function BaseTypeaheadView<T extends SearchableItem>(
	props: BaseTypeaheadViewProps<T>,
): unknown @{
	const busyLane = useContext(BusyLaneContext)
	const groups = groupTypeaheadItems(props.results, { ungroupedFirst: true })
	const selectedId = props.value?.id
	const bindInput = useCallback(
		(view: NSTextField | null) => {
			props.inputRef.current = view
			accessibility.update()
		},
		[props.inputRef],
	)

	const activeIndex =
		props.highlightedIndex >= 0 && props.highlightedIndex < props.results.length
			? props.highlightedIndex
			: -1

	const live = useRef(props)
	live.current = props
	const rows = useRef(new Map<string, { view: NSView }>())
	const list = useRef<NSView | null>(null),
		shell = useRef<NSView | null>(null)

	const bindShell = useCallback((view: NSView | null) => {
		shell.current = view
	}, [])

	const fieldBlur = (event: any) => {
		if (
			!live.current.inputRef.current ||
			appKitTypeaheadOwnsFocus([live.current.inputRef.current, shell.current, list.current])
		) {
			return
		}

		live.current.onInputBlur?.(event)
	}

	const accessibility = useMemo(
		() =>
			createAppKitTypeaheadAccessibility(() => {
				const current = live.current,
					active = current.results[current.highlightedIndex]

				return {
					input: current.inputRef.current,
					list: list.current,
					active: active ? (rows.current.get(active.id)?.view ?? null) : null,
					open: current.open,
					blocked: !!current.isDisabled || !!current.isReadOnly,
				}
			}),
		[],
	)

	const bindList = useCallback((view: NSView | null) => {
		list.current = view
		accessibility.update()
	}, [])

	useLayoutEffect(() => accessibility.update(), null)
	useEffect(() => () => accessibility.dispose(), [])
	const bindRow = (id: string) => {
		let lease: { view: NSView } | undefined
		return (view: NSView | null) => {
			if (view) {
				lease = { view }
				rows.current.set(id, lease)
			} else if (rows.current.get(id) === lease) {
				rows.current.delete(id)
			}

			accessibility.update()
		}
	}

	const keys = useMemo(
		() =>
			createAppKitTypeaheadKeys<T>({
				input: () => live.current.inputRef.current,
				state: () => {
					const p = live.current
					return {
						open: p.open,
						blocked: !!p.isDisabled || !!p.isReadOnly,
						query: p.query,
						entriesOnFocus: !!p.hasEntriesOnFocus,
						items: p.results,
						active: p.highlightedIndex,
					}
				},
				notify: (event) => live.current.onKeyDown?.(event),
				open: () => live.current.onOpenChange(true),
				close: () => live.current.onOpenChange(false),
				highlight: (index) => live.current.onHighlight?.(index),
				select: (item) => live.current.onSelect(item),
			}),
		[],
	)

	const resultsReady = useCallback(() => {
		accessibility.update()
		const current = live.current,
			item = current.results[current.highlightedIndex]

		if (!current.open || current.isDisabled || current.isReadOnly || !item) {
			return
		}

		const input = current.inputRef.current,
			row = rows.current.get(item.id)?.view

		if (!input?.window || !row || row.window !== input.window) {
			return
		}

		const editor =
			typeof input.currentEditor === 'function' ? input.currentEditor() : input.currentEditor

		if (
			input.window.firstResponder === input ||
			(editor != null && input.window.firstResponder === editor)
		) {
			row.scrollRectToVisible?.(row.bounds)
		}
	}, [])

	useLayoutEffect(resultsReady, [props.open, activeIndex, props.results])

	<masonview
		className={cx('vx-typeahead', props.className)}
		ref={bindShell}
		onBlur={fieldBlur}
		style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		<textfield
			ref={bindInput}
			onFocus={props.onInputFocus}
			onKeyDown={keys}
			id={props.inputId}
			className={cx(
				'vx-typeahead-input',
				`vx-typeahead-input--size-${props.size}`,
				props.isDisabled && 'vx-typeahead-input--disabled',
				props.inputClassName,
			)}
			style={props.inputStyle}
			value={props.query}
			placeholder={props.placeholder}
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			isEnabled={!props.isDisabled || !!props.isFocusableDisabled}
			editable={!props.isDisabled && !props.isReadOnly}
			accessibilityRole="combobox"
			accessibilityState={{
				disabled: props.isDisabled,
				readonly: props.isReadOnly,
				expanded: props.open && !props.isDisabled && !props.isReadOnly,
			}}
			onTextChange={appKitTextChange(props.onQueryChange)}
		/>
		{props.isSearching && busyLane == null ? (
			<masonview className="vx-typeahead-loading" style={{ display: 'flex' }}>
				<ActivityIndicator busy={true} />
			</masonview>
		) : null}
		<TypeaheadResults
			anchor={props.anchor}
			input={() => live.current.inputRef.current}
			open={props.open && !props.isDisabled && !props.isReadOnly}
			width={props.menuWidth}
			placement={props.placement}
			onDismiss={() => live.current.onOpenChange(false)}
			onBlur={fieldBlur}
			onReady={resultsReady}
		>
			<masonview
				className="vx-typeahead-list"
				ref={bindList}
				accessibilityRole="listbox"
				accessibilityLabel={
					props.accessibilityLabel ??
					props.ariaLabel ??
					props.fieldLabel ??
					props.label ??
					'Suggestions'
				}
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				{props.results.length === 0 && props.hasSearched ? (
					<masonview className="vx-typeahead-empty" style={{ display: 'flex' }}>
						<label text={props.emptyText} />
					</masonview>
				) : null}
				@for (const group of groups; key group.heading ?? 'ungrouped') {
					{
						group.heading != null ? (
							<label className="vx-typeahead-group" text={group.heading} />
						) : null
					}

					@for (const item of group.items; index gi; key item.id + '-' + gi) {
						const index = props.results.indexOf(item)
						const isSelected = item.id === selectedId && selectedId != null
						<masonview
							ref={bindRow(item.id)}
							className={cx(
								'vx-typeahead-option',
								`vx-typeahead-option--size-${props.size}`,
								index === activeIndex && 'vx-typeahead-option--highlighted',
								isSelected && 'vx-typeahead-option--selected',
							)}
							onTap={() => props.onSelect(item)}
							accessibilityRole="option"
							accessibilityLabel={item.label}
							accessibilityState={{
								selected: index === activeIndex,
								disabled: props.isDisabled,
								readonly: props.isReadOnly,
							}}
							style={mergeStyle(
								{ flexDirection: 'row', alignItems: 'center' },
								{ display: 'flex' },
							)}
						>
							<masonview
								className="vx-typeahead-option-content"
								style={mergeStyle({ flexGrow: 1 }, { display: 'flex' })}
							>
								{props.renderItem ? props.renderItem(item) : <TypeaheadItem item={item} />}
							</masonview>
							{isSelected ? <label className="vx-typeahead-option-check" text="✓" /> : null}
						</masonview>
					}
				}
			</masonview>
		</TypeaheadResults>
	</masonview>
}
