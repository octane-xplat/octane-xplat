/** @jsxImportSource @octane-xplat/jsx */
import { appKitTextChange } from './appkit-events.macos'
import { useTranslator } from './internationalization'
import { mergeStyle } from './style-merge'
import { useRef } from 'octane'
import type { SelectViewProps } from './select-view'
import { cx } from '@octane-xplat/lib'
import { Pressable } from './Pressable.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { TextSlot } from './text-slot'

import { CheckIndicator, CheckboxIndicator } from './indicators'
import { useIndicator } from './use-indicator'
import { nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'

/** Select presentation — resolved finite-list state in, user intents out.
 *  Internal only; consumers use `Select`. */
export function SelectView(props: SelectViewProps) @{
	const translate = useTranslator()
	const anchor = useRef<NSView | null>(null)
	const search = useRef<NSTextField | null>(null)
	const CheckInd = useIndicator('check') ?? CheckIndicator
	const MultiInd = useIndicator('checkbox') ?? CheckboxIndicator
	const busy = Boolean(props.isLoading || props.pending)
	const blocked = Boolean(props.isDisabled || props.isReadOnly)
	const selectedOption = props.options.find((option) => option.value === props.selected[0])

	<>
		<Pressable
			ref={anchor}
			id={props.id}
			className={cx(
				'vx-select-trigger',
				props.isDisabled && 'vx-select--disabled',
				props.isReadOnly && 'vx-select--readonly',
				busy && 'vx-select--loading',
				props.className,
			)}
			style={props.style}
			disabled={props.isDisabled}
			onPress={blocked ? undefined : () => props.onOpenChange(!props.open)}
			accessibilityRole="button"
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled, expanded: props.open, busy,
				invalid: props.status?.type === 'error', required: props.isRequired && !props.isOptional }}
			accessibilityValue={props.triggerText}
		>
			{props.renderValue && selectedOption && !props.multiple ? (
				<masonview className="vx-select-value"><TextSlot>{props.renderValue(selectedOption)}</TextSlot></masonview>
			) : (
				<label className={cx('vx-select-value', !props.selected.length && 'vx-select-placeholder')} text={props.triggerText} />
			)}
			{props.hasClear && props.selected.length && !blocked ? (
				<Pressable
					className="vx-select-clear"
					disabled={props.pending}
					accessibilityLabel={translate('@astryx.selector.clearLabel')}
					onPress={props.onClear}
				>
					<label text="×" />
				</Pressable>
			) : null}
			{busy ? (
				<label className="vx-select-loading" text="Loading…" accessibilityLiveRegion={'polite'} />
			) : null}
			{!props.isReadOnly ? <label className="vx-select-caret" text="▾" /> : null}
		</Pressable>
		<Popover
			anchor={anchor}
			open={props.open}
			placement={props.placement ?? 'bottom'}
			onDismiss={() => props.onOpenChange(false)}
			className="vx-menu"
		>
			{props.searchable ? (
				<masonview
					className="vx-select-search-row"
					style={mergeStyle({ flexDirection: 'row' }, { display: 'flex' })}
				>
					<textfield
						ref={search}
						id={props.id ? `${props.id}-search` : undefined}
						className="vx-select-search"
						value={props.query}
						placeholder={props.searchPlaceholder ?? translate('@astryx.selector.searchPlaceholder')}
						accessibilityLabel={translate('@astryx.selector.searchOptions')}
						onTextChange={appKitTextChange(props.onQueryChange)}
					/>
					{props.query ? (
						<Pressable
							className="vx-select-search-clear"
							accessibilityLabel="Clear search"
							onPress={() => {
								props.onQueryChange('')
								search.current?.window?.makeFirstResponder(search.current)
							}}
						>
							<label text="×" />
						</Pressable>
					) : null}
				</masonview>
			) : null}
			{props.multiple && props.hasSelectAll ? (
				<masonview id={props.id ? `${props.id}-select-all` : undefined}
					className="vx-pressable vx-select-all"
					disabled={blocked || props.pending || !props.enabled.length}
					onTap={blocked || props.pending || !props.enabled.length ? undefined : props.onSelectAll}
					accessibilityRole="checkbox"
					accessibilityLabel={props.selectAllLabel ?? 'Select all'}
					accessibilityState={{ checked: props.selectAllState === 'indeterminate' ? 'mixed' : props.selectAllState === 'checked',
						disabled: blocked || props.pending || !props.enabled.length }}>
					<MultiInd state={props.selectAllState} />
					<label text={props.selectAllLabel ?? 'Select all'} />
				</masonview>
			) : null}
			<label
				className="vx-select-feedback"
				text={props.announcement}
				accessibilityLiveRegion={'polite'}
			/>
			<scrollview
				style={{
					height: Math.min(
						props.maxMenuHeight ?? 280,
						Math.max(40, props.shown.length * 56 + props.groups.length * 24),
					),
				}}
			>
				<masonview
					className="vx-menu-list vx-select-list"
					accessibilityRole={props.multiple ? 'group' : 'radiogroup'}
					accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label ?? 'Options'}
					style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
				>
					{!props.shown.length && !busy ? (
						<label className="vx-select-empty" text={props.emptyText} />
					) : null}
					@for (const group of props.groups; index gi; key gi) {
						<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
							{group.heading != null ? (
								<label className="vx-select-group" text={group.heading} />
							) : null}
							@for (const option of group.options; key option.value) {
								<masonview
									id={props.id ? `${props.id}-option-${option.value}` : undefined}
									className={cx(
										'vx-menu-item',
										'vx-select-option',
										props.selected.includes(option.value) && 'vx-select-option--on',
										(blocked || option.isDisabled || props.pending) && 'vx-menu-item--disabled',
									)}
									disabled={blocked || option.isDisabled || props.pending}
									onTap={blocked || option.isDisabled || props.pending ? undefined : () => props.onPick(option)}
									accessibilityRole={nativeAccessibilityRole(props.multiple ? 'checkbox' : 'radio')}
									accessibilityLabel={`${option.label ?? option.value}${option.description ? ', ' + option.description : ''}${props.selected.includes(option.value) ? ', Selected' : ''}${option.isDisabled ? ', Disabled' : ''}`}
									accessibilityState={nativeAccessibilityState({
										selected: props.selected.includes(option.value),
										checked: props.selected.includes(option.value),
										disabled: blocked || option.isDisabled || props.pending,
									})}
									style={mergeStyle({ flexDirection: 'row' }, { display: 'flex' })}
								>
									<masonview className="vx-select-check" style={{ display: 'flex' }}>
										{props.multiple ? (
											<MultiInd
												state={
													props.selected.includes(option.value)
														? 'checked'
														: 'unchecked'
												}
												isDisabled={option.isDisabled}
											/>
										) : (
											<CheckInd
												state={
													props.selected.includes(option.value)
														? 'checked'
														: 'unchecked'
												}
												isDisabled={option.isDisabled}
											/>
										)}
									</masonview>
									{props.renderOption ? <TextSlot>{props.renderOption(option)}</TextSlot> : <>
										{option.icon != null ? <masonview className="vx-select-option-icon" accessible={false}><TextSlot>{option.icon}</TextSlot></masonview> : null}
									<masonview
										style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
									>
										<label
											className="vx-menu-item-label"
											text={option.label ?? option.value}
										/>
										{option.description ? (
											<label
												className="vx-select-description"
												text={option.description}
											/>
										) : null}
									</masonview>
									</>}
								</masonview>
							}
						</masonview>
					}
				</masonview>
			</scrollview>
		</Popover>
	</>
}
