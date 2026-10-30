/** @jsxImportSource @octane-xplat/jsx */
import type { NSTextField, NSView, NSWindow } from '@octane-xplat/platform/macos'
import './SelectView.macos.css'
import { appKitTextChange } from '../../internal/platform/appkit-events.macos'
import { useTranslator } from '../../internal/platform/internationalization'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'octane'
import type { SelectViewProps } from './select-view'
import type { SelectOption } from '../../props'
import { appKitHost } from '../../internal/platform/host-bridge'
import { useKeyboard } from '../../internal/keyboard/use-keyboard.macos'
import { createAppKitChoiceFocus } from './choice-focus.macos'
import { createAppKitSelectKeyboard } from './select-keyboard.macos'
import { cx } from '@octane-xplat/lib'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { Icon } from '../media/Icon.macos.tsrx'
import { Popover } from '../overlays/Popover.macos.tsrx'
import { TextSlot } from './text-slot'

import { CheckIndicator, CheckboxIndicator } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'

function SelectOptionRow(input: {
	option: SelectOption
	owner: SelectViewProps
	views: Map<string, NSView>
	latest(): SelectViewProps
}) @{
	const { option, owner: props } = input
	const blocked = Boolean(props.isDisabled || props.isReadOnly)
	const CheckInd = useIndicator('check') ?? CheckIndicator
	const MultiInd = useIndicator('checkbox') ?? CheckboxIndicator
	const own = useRef<NSView | null>(null)
	const bind = useCallback(
		(view: NSView | null) => {
			const previous = own.current
			if (previous && input.views.get(option.value) === previous) {
				input.views.delete(option.value)
			}

			own.current = view
			if (view) {
				input.views.set(option.value, view)
			}
		},
		[input.views, option.value],
	)

	const pick = () => {
		if (!own.current) {
			return
		}

		const current = input.latest(),
			choice = current.options.find((item) => item.value === option.value)

		if (
			!current.open ||
			current.pending ||
			current.isDisabled ||
			current.isReadOnly ||
			!choice ||
			choice.isDisabled
		) {
			return
		}

		current.onPick(choice)
	}

	<masonview
		ref={bind}
		id={props.id ? `${props.id}-option-${option.value}` : undefined}
		className={cx(
			'vx-menu-item',
			'vx-select-option',
			props.selected.includes(option.value) && 'vx-select-option--on',
			(blocked || option.isDisabled || props.pending) && 'vx-menu-item--disabled',
		)}
		disabled={blocked || option.isDisabled || props.pending}
		onTap={blocked || option.isDisabled || props.pending ? undefined : pick}
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
					state={props.selected.includes(option.value) ? 'checked' : 'unchecked'}
					isDisabled={option.isDisabled}
				/>
			) : (
				<CheckInd
					state={props.selected.includes(option.value) ? 'checked' : 'unchecked'}
					isDisabled={option.isDisabled}
				/>
			)}
		</masonview>
		{props.renderOption ? (
			<TextSlot>{props.renderOption(option)}</TextSlot>
		) : (
			<>
				{option.icon != null ? (
					<masonview className="vx-select-option-icon" accessible={false}>
						<TextSlot>{option.icon}</TextSlot>
					</masonview>
				) : null}
				<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
					<label className="vx-menu-item-label" text={option.label ?? option.value} />
					{option.description ? (
						<label className="vx-select-description" text={option.description} />
					) : null}
				</masonview>
			</>
		)}
	</masonview>
}

/** Select presentation — resolved finite-list state in, user intents out.
 *  Internal only; consumers use `Select`. */
export function SelectView(props: SelectViewProps): unknown @{
	const translate = useTranslator()
	const anchor = useRef<NSView | null>(null)
	const search = useRef<NSTextField | null>(null)
	const MultiInd = useIndicator('checkbox') ?? CheckboxIndicator
	const busy = Boolean(props.isLoading || props.pending)
	const blocked = Boolean(props.isDisabled || props.isReadOnly)
	const selectedOption = props.options.find((option) => option.value === props.selected[0])

	const surface = useRef<NSView | null>(null)
	const views = useRef(new Map<string, NSView>())
	const live = useRef(props)
	live.current = props
	const returnFocus = useRef<NSView | null>(null)
	const focusRequest = useRef<{ edge: 'first' | 'last'; value?: string } | null>({ edge: 'first' })
	const source = useRef<'trigger' | 'surface'>('trigger')
	const searchAtEnd = useRef(false)
	const surfaceLease = useRef<(() => void) | null>(null)
	const navigation = useMemo(
		() =>
			createAppKitChoiceFocus({
				root: () => surface.current,
				views: views.current,
				selected: () => live.current.selected[0],
				orientation: () => 'both',
				direction: () => 'ltr',
				reveal: (view) => {
					view.scrollRectToVisible(view.bounds)
				},
			}),
		[],
	)

	const searchFocused = () => {
		const field = search.current,
			responder = field?.window?.firstResponder

		return Boolean(
			field && responder && (responder === field || field.currentEditor() === responder),
		)
	}

	const focusedKey = () => {
		const window = surface.current?.window,
			responder = window?.firstResponder

		if (!window || !responder) {
			return undefined
		}

		return [...views.current].find(([, view]) => view.window === window && view === responder)?.[0]
	}

	const focusSearch = () => {
		const field = search.current
		return Boolean(field?.window?.makeFirstResponder(field))
	}

	const initialize = () => {
		if (!live.current.open || !surface.current?.window) {
			return
		}

		navigation.synchronize()
		const request = focusRequest.current
		if (!request) {
			return
		}

		const editor = search.current?.currentEditor()
		const marked = editor ? Reflect.get(editor, 'hasMarkedText') : false
		if (searchFocused() && Boolean(typeof marked === 'function' ? marked.call(editor) : marked)) {
			focusRequest.current = null
			searchAtEnd.current = false
			return
		}

		const value =
			request.value ?? (request.edge === 'last' ? navigation.orderedKeys().at(-1) : undefined)

		const moved = live.current.searchable
			? searchFocused() || focusSearch()
			: navigation.focus(value, request.edge)

		if (moved && live.current.searchable && searchAtEnd.current) {
			const current = search.current?.currentEditor()
			if (current) {
				current.selectedRange = { location: current.string.length, length: 0 }
			}

			searchAtEnd.current = false
		}

		if (
			moved ||
			(!live.current.enabled.length && surface.current.window.makeFirstResponder(surface.current))
		) {
			focusRequest.current = null
		}
	}

	const initializeLatest = useRef(initialize)
	initializeLatest.current = initialize
	const bindSurface = useCallback((view: NSView | null) => {
		surfaceLease.current?.()
		surfaceLease.current = null
		if (!view) {
			navigation.dispose()
		}

		surface.current = view
		if (view) {
			const retain = appKitHost()?.retainFocusTarget
			if (typeof retain === 'function') {
				const release = retain(view)
				if (typeof release !== 'function') {
					throw new Error('AppKit select surface focus ownership unavailable')
				}

				surfaceLease.current = release
			}

			Promise.resolve().then(() => {
				if (surface.current === view) {
					initializeLatest.current()
				}
			})
		}
	}, [])

	const keyboard = useMemo(
		() =>
			createAppKitSelectKeyboard({
				open: () => live.current.open,
				blocked: () => Boolean(live.current.isDisabled || live.current.isReadOnly),
				pending: () => live.current.pending,
				multiple: () => Boolean(live.current.multiple),
				searchable: () => Boolean(live.current.searchable),
				hasClear: () => Boolean(live.current.hasClear),
				hasSelectAll: () => Boolean(live.current.hasSelectAll),
				selected: () => live.current.selected,
				enabled: () => {
					if (!live.current.open) {
						return live.current.enabled
					}

					const byKey = new Map(live.current.enabled.map((option) => [option.value, option]))
					return navigation
						.orderedKeys()
						.flatMap((key) => (byKey.has(key) ? [byKey.get(key)!] : []))
				},
				focused: () => (source.current === 'surface' ? focusedKey() : undefined),
				editing: () => source.current === 'surface' && searchFocused(),
				focus: navigation.focus,
				requestOpen: (edge, value) => {
					focusRequest.current = { edge, value }
					returnFocus.current = anchor.current
					live.current.onOpenChange(true)
				},
				close: (target) => {
					const trigger = anchor.current
					const candidate =
						target === 'next'
							? (trigger?.nextValidKeyView ?? trigger)
							: target === 'previous'
								? (trigger?.previousValidKeyView ?? trigger)
								: trigger

					returnFocus.current = candidate?.window === trigger?.window ? candidate : trigger
					live.current.onOpenChange(false)
				},
				query: (value) => {
					searchAtEnd.current = true
					live.current.onQueryChange(value)
				},
				focusSearch: () => {
					focusRequest.current = { edge: 'first' }
					Promise.resolve().then(() => initializeLatest.current())
				},
				pick: (option) => live.current.onPick(option),
				clear: () => live.current.onClear(),
				selectAll: () => live.current.onSelectAll(),
			}),
		[],
	)

	const triggerKeys = useKeyboard({
		onKeyDown: (event) => {
			if (anchor.current?.window?.firstResponder !== anchor.current) {
				return
			}

			source.current = 'trigger'
			keyboard.keyDown(event)
		},
	}).keyboardProps

	const surfaceKeys = useKeyboard({
		onKeyDown: (event) => {
			if (!live.current.open) {
				if (!event.isComposing && !event.ctrlKey && !event.altKey && !event.metaKey) {
					event.preventDefault()
				}

				return
			}

			const responder = surface.current?.window?.firstResponder
			if (
				!responder ||
				(!searchFocused() &&
					focusedKey() === undefined &&
					responder !== surface.current &&
					!['Escape', 'Tab'].includes(event.key))
			) {
				return
			}

			source.current = 'surface'
			keyboard.keyDown(event)
		},
	}).keyboardProps

	const wasOpen = useRef(false)
	useLayoutEffect(() => {
		if (props.open && !wasOpen.current) {
			returnFocus.current = anchor.current
			focusRequest.current ??= { edge: 'first' }
		}

		if (!props.open) {
			keyboard.reset()
			searchAtEnd.current = false
			focusRequest.current = { edge: 'first' }
			navigation.dispose()
		}

		wasOpen.current = props.open
	}, [props.open])

	useEffect(() => {
		if (!props.open) {
			return
		}

		const native = globalThis as Record<string, any>,
			center = native.NSNotificationCenter?.defaultCenter

		if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) {
			return
		}

		let token: unknown
		try {
			token = center.addObserverForNameObjectQueueUsingBlock(
				native.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification',
				null,
				null,
				(notification: { object: NSWindow }) => {
					if (notification.object === surface.current?.window) {
						initializeLatest.current()
					}
				},
			)
		} catch (error) {
			console.warn('[macos-select] focus observation unavailable', error)
			return
		}

		return () => {
			if (token != null) {
				center.removeObserver(token)
			}
		}
	}, [props.open])

	useEffect(
		() => () => {
			navigation.dispose()
			surfaceLease.current?.()
			surfaceLease.current = null
		},
		[],
	)

	<>
		<masonview
			ref={anchor}
			{...triggerKeys}
			id={props.id}
			testID={props.testID}
			className={cx(
				'vx-pressable',
				'vx-select-trigger',
				'vx-select-trigger--appkit',
				props.variant === 'ghost' && 'vx-select--ghost',
				props.isDisabled && 'vx-select--disabled',
				props.isReadOnly && 'vx-select--readonly',
				busy && 'vx-select--loading',
				props.className,
			)}
			style={props.style}
			disabled={props.isDisabled}
			onTap={
				blocked
					? undefined
					: () => {
							keyboard.reset()
							returnFocus.current = anchor.current
							props.onOpenChange(!props.open)
						}
			}
			accessibilityRole="button"
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{
				disabled: props.isDisabled,
				expanded: props.open,
				busy,
				invalid: props.status?.type === 'error',
				required: props.isRequired && !props.isOptional,
			}}
			accessibilityValue={props.triggerText}
		>
			{props.multiple && props.triggerDisplay === 'badges' && props.selected.length ? (
				<masonview className="vx-select-badges vx-select-badges--appkit">
					@for (const value of props.selected; key value) {
						const option = props.options.find((item) => item.value === value)
						<masonview className="vx-select-badge vx-select-badge--appkit">
							<label text={option?.label ?? value} />
							<Pressable
								className="vx-select-badge-x"
								disabled={Boolean(blocked || props.pending || !option || option.isDisabled)}
								accessibilityLabel={`Remove ${option?.label ?? value}`}
								onPress={() => {
									const current = live.current,
										choice = current.options.find((item) => item.value === value)

									if (
										!anchor.current ||
										!current.multiple ||
										current.triggerDisplay !== 'badges' ||
										current.isDisabled ||
										current.isReadOnly ||
										current.pending ||
										!choice ||
										choice.isDisabled ||
										!current.selected.includes(value)
									) {
										return
									}

									current.onPick(choice)
								}}
							>
								<Icon name="xplat-clear" size={12} />
							</Pressable>
						</masonview>
					}
				</masonview>
			) : props.renderValue && selectedOption && !props.multiple ? (
				<masonview className="vx-select-value">
					<TextSlot>{props.renderValue(selectedOption)}</TextSlot>
				</masonview>
			) : (
				<label
					className={cx('vx-select-value', !props.selected.length && 'vx-select-placeholder')}
					text={props.triggerText}
				/>
			)}
			{props.hasClear && props.selected.length && !blocked ? (
				<Pressable
					className="vx-select-clear"
					disabled={props.pending}
					accessibilityLabel={translate('@astryx.selector.clearLabel')}
					onPress={props.onClear}
				>
					<Icon name="xplat-clear" size={12} />
				</Pressable>
			) : null}
			{busy ? (
				<label className="vx-select-loading" text="Loading…" accessibilityLiveRegion={'polite'} />
			) : null}
			{!props.isReadOnly ? (
				<Icon name="xplat-chevron-down" className="vx-select-caret" size={14} />
			) : null}
		</masonview>
		<Popover
			anchor={anchor}
			finalFocusRef={returnFocus}
			open={props.open}
			placement={props.placement ?? 'bottom'}
			onDismiss={() => {
				returnFocus.current = anchor.current
				props.onOpenChange(false)
			}}
			className="vx-menu"
		>
			<masonview
				ref={bindSurface}
				{...surfaceKeys}
				className="vx-select-surface--appkit"
				accessibilityRole="group"
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
							placeholder={
								props.searchPlaceholder ?? translate('@astryx.selector.searchPlaceholder')
							}
							accessibilityLabel={translate('@astryx.selector.searchOptions')}
							onTextChange={appKitTextChange((value) => {
								if (live.current.open && !live.current.isDisabled && !live.current.isReadOnly) {
									live.current.onQueryChange(value)
								}
							})}
						/>
						{props.query ? (
							<Pressable
								className="vx-select-search-clear"
								accessibilityLabel="Clear search"
								onPress={() => {
									const current = live.current
									if (!current.open || current.isDisabled || current.isReadOnly) {
										return
									}

									current.onQueryChange('')
									search.current?.window?.makeFirstResponder(search.current)
								}}
							>
								<Icon name="xplat-clear" size={12} />
							</Pressable>
						) : null}
					</masonview>
				) : null}
				{props.multiple && props.hasSelectAll ? (
					<masonview
						id={props.id ? `${props.id}-select-all` : undefined}
						className="vx-pressable vx-select-all"
						disabled={blocked || props.pending || !props.enabled.length}
						onTap={
							blocked || props.pending || !props.enabled.length
								? undefined
								: () => {
										const current = live.current
										if (
											current.open &&
											!current.pending &&
											!current.isDisabled &&
											!current.isReadOnly
										) {
											current.onSelectAll()
										}
									}
						}
						accessibilityRole="checkbox"
						accessibilityLabel={props.selectAllLabel ?? 'Select all'}
						accessibilityState={{
							checked:
								props.selectAllState === 'indeterminate'
									? 'mixed'
									: props.selectAllState === 'checked',
							disabled: blocked || props.pending || !props.enabled.length,
						}}
					>
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
						accessibilityLabel={
							props.accessibilityLabel ??
							props.ariaLabel ??
							props.fieldLabel ??
							props.label ??
							'Options'
						}
						style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
					>
						{!props.shown.length && !busy ? (
							<label className="vx-select-empty" text={props.emptyText} />
						) : null}
						@for (const group of props.groups; index gi; key gi) {
							<masonview
								style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
							>
								{group.heading != null ? (
									<label className="vx-select-group" text={group.heading} />
								) : null}
								@for (const option of group.options; key option.value) {
									<SelectOptionRow
										option={option}
										owner={props}
										views={views.current}
										latest={() => live.current}
									/>
								}
							</masonview>
						}
					</masonview>
				</scrollview>
			</masonview>
		</Popover>
	</>
}
